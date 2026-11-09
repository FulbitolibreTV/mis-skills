#!/usr/bin/env python3
"""Analiza un anuncio de referencia (vídeo) para copiar su RITMO, no su contenido.

Uso:
  python3 scripts/referencia.py ANUNCIO.mp4 --salida P/referencia [--umbral 0.3] [--min 0.25]

Saca, sin mirar fotograma a fotograma:
  - planos.json : duración, tamaño, fps y los planos (cortes) con su inicio y su fin, en segundos;
  - hoja.jpg    : UNA imagen con un fotograma de cada plano y su tiempo (para mirarla de una vez);
  - borrador.json: un plan de anuncio (estilo clásico) con una escena por plano y los mismos tiempos, para rellenar;
  - borrador_limpio.json: el ejemplo del estilo limpio con sus 8 partes encajadas en los cortes de la referencia.
Los cortes (también las cortinillas) se detectan por el cambio de colores entre un fotograma y el de 0,27 s antes (> --umbral, de 0 a 1). Los planos de menos de --min s se juntan con el anterior.
Si el vídeo tiene transiciones suaves y salen pocos planos, baja el umbral (0.2); si salen demasiados, súbelo (0.45).
"""
import argparse, json, os, re, subprocess, sys

def sondeo(ruta):
    out = subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries',
                                   'stream=width,height,r_frame_rate:format=duration', '-of', 'json', ruta])
    d = json.loads(out); s = d['streams'][0]; n, m = s['r_frame_rate'].split('/')
    return float(d['format']['duration']), int(s['width']), int(s['height']), round(float(n) / float(m or 1), 2)

def cortes(ruta, umbral, fps=30):
    """Cortes y cortinillas: compara cada fotograma con el de 0,27 s antes por su histograma de color
    (un cambio de plano cambia los colores; el movimiento dentro del plano, mucho menos) y se queda con los picos."""
    import numpy as np
    w, h = 96, 96
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', ruta, '-an', '-vf', f'fps={fps},scale={w}:{h}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
                         capture_output=True).stdout
    n = len(raw) // (w * h * 3)
    if n < 3: return []
    v = np.frombuffer(raw[:n * w * h * 3], np.uint8).reshape(n, w * h, 3) // 32          # 8 niveles por canal
    hist = np.stack([np.bincount((f[:, 0] * 64 + f[:, 1] * 8 + f[:, 2]).astype(np.int64), minlength=512) for f in v]) / (w * h)
    k = max(1, round(0.27 * fps))
    d = np.zeros(n)
    d[k:] = np.abs(hist[k:] - hist[:-k]).sum(1) / 2                                         # 0 = igual, 1 = nada en común
    picos, ventana = [], max(1, round(0.2 * fps))
    for i in range(k, n):
        if d[i] >= umbral and d[i] > d[i - 1] and d[i] == d[max(0, i - ventana):i + ventana + 1].max():
            j = i                                                                            # donde empieza a subir
            while j > k and d[j - 1] < d[j] and d[j - 1] > 0.05: j -= 1
            picos.append(round((i + j) / 2 / fps, 2))                                        # mitad de la transición
    return picos

def main():
    ap = argparse.ArgumentParser(description='Planos y hoja de miniaturas de un anuncio de referencia')
    ap.add_argument('video', help='el anuncio de referencia (MP4, MOV…)'); ap.add_argument('--salida', required=True, help='carpeta donde dejar planos.json, hoja.jpg y borrador.json')
    ap.add_argument('--umbral', type=float, default=0.3, help='sensibilidad de los cortes, de 0 a 1 (0.2 saca más planos, 0.45 menos)')
    ap.add_argument('--min', type=float, default=0.25, help='duración mínima de un plano en segundos (los más cortos se juntan con el anterior)')
    a = ap.parse_args()
    if not os.path.isfile(a.video): sys.exit(f'No encuentro el vídeo: {a.video}')
    os.makedirs(a.salida, exist_ok=True)
    dur, w, h, fps = sondeo(a.video)
    marcas = [0.0]
    for t in cortes(a.video, a.umbral, fps):
        if t - marcas[-1] >= a.min and dur - t >= a.min: marcas.append(round(t, 2))
    planos = [{'n': i + 1, 'a': marcas[i], 'b': round(marcas[i + 1] if i + 1 < len(marcas) else dur, 2)} for i in range(len(marcas))]
    for p in planos: p['dur'] = round(p['b'] - p['a'], 2)
    info = {'video': os.path.basename(a.video), 'duracion': round(dur, 2), 'ancho': w, 'alto': h, 'fps': fps,
            'formato': 'vertical' if h > w * 1.1 else ('horizontal' if w > h * 1.1 else 'cuadrado'),
            'planos': planos, 'media_por_plano': round(dur / len(planos), 2)}
    json.dump(info, open(os.path.join(a.salida, 'planos.json'), 'w'), ensure_ascii=False, indent=2)

    # hoja: un fotograma de cada plano (en su 60 %), 4 por fila, con el tiempo encima
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        sys.exit('Falta Pillow: pip install --user pillow (o pip install pillow --break-system-packages)')
    tw = 240 if h >= w else 320; th = round(tw * h / w)
    fotos = []
    for p in planos:
        t = p['a'] + p['dur'] * 0.6
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t:.3f}', '-i', a.video, '-frames:v', '1', '-vf', f'scale={tw}:{th}',
                              '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
        fotos.append(Image.frombytes('RGB', (tw, th), raw) if len(raw) == tw * th * 3 else Image.new('RGB', (tw, th), '#444'))
    cols = min(4, len(fotos)); filas = (len(fotos) + cols - 1) // cols; cab = 30
    hoja = Image.new('RGB', (cols * (tw + 8) + 8, filas * (th + cab + 8) + 8), '#1c1c1c'); d = ImageDraw.Draw(hoja)
    try: f = ImageFont.truetype('DejaVuSans-Bold.ttf', 17)
    except OSError: f = ImageFont.load_default()
    for i, (im, p) in enumerate(zip(fotos, planos)):
        x, y = 8 + (i % cols) * (tw + 8), 8 + (i // cols) * (th + cab + 8)
        d.text((x + 4, y + 5), f"{p['n']} · {p['a']:.2f}–{p['b']:.2f} s", font=f, fill='#ffffff')
        hoja.paste(im, (x, y + cab))
    hoja.save(os.path.join(a.salida, 'hoja.jpg'), quality=85)

    # borrador del plan: una escena por plano con los mismos tiempos (tipo «texto» para cambiarlo luego)
    borrador = {'salida': 'anuncio', 'ancho': 1080 if info['formato'] != 'horizontal' else 1920,
                'alto': 1920 if info['formato'] == 'vertical' else 1080, 'fps': 30, 'duracion': info['duracion'],
                'marca': {'nombre': 'Mi App', 'eslogan': '', 'colores': {}}, 'mascota': {'forma': 'bocadillo'},
                'escenas': [{'tipo': 'texto', 'a': p['a'], 'b': p['b'], 'texto': f"Plano {p['n']}"} for p in planos]}
    if info['formato'] == 'cuadrado': borrador['alto'] = 1080
    json.dump(borrador, open(os.path.join(a.salida, 'borrador.json'), 'w'), ensure_ascii=False, indent=2)
    # borrador del estilo limpio: cada una de sus 8 partes empieza en el corte de la referencia más cercano
    # a donde caería en el diseño (a menos de 0,5 s); si no hay corte cerca, se queda en su sitio
    D = [0, 1.0, 2.45, 3.4, 4.42, 6.0, 7.15, 7.76]
    k = info['duracion'] / 9.54; cortes_ref = [p['a'] for p in planos[1:]]; tiempos = [0]
    for d in D[1:]:
        obj = d * k; cerca = [c for c in cortes_ref if abs(c - obj) <= 0.5 and c - tiempos[-1] >= 0.4]
        t = min(cerca, key=lambda c: abs(c - obj)) if cerca else max(obj, tiempos[-1] + 0.4)
        tiempos.append(round(t, 2))
    tiempos = [x if x <= info['duracion'] - 0.4 * (7 - i) else round(info['duracion'] - 0.4 * (7 - i), 2) for i, x in enumerate(tiempos)]
    tiempos[0] = 0
    ej = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'ejemplo', 'anuncio.json')
    limpio = json.load(open(ej, encoding='utf-8')) if os.path.exists(ej) else {'estilo': 'limpio'}
    limpio.update({'ancho': borrador['ancho'], 'alto': borrador['alto'], 'duracion': info['duracion'], 'tiempos': tiempos})
    limpio['marca'] = {'nombre': 'Mi App', 'colores': {'principal': '#7B4DFF'}}
    json.dump(limpio, open(os.path.join(a.salida, 'borrador_limpio.json'), 'w'), ensure_ascii=False, indent=2)
    print(f"{info['duracion']} s · {w}×{h} · {fps} fps · {info['formato']} · {len(planos)} planos (media {info['media_por_plano']} s)")
    print('  ' + ' | '.join(f"{p['n']}: {p['a']:.1f}–{p['b']:.1f}" for p in planos))
    print(f"Hoja: {os.path.join(a.salida, 'hoja.jpg')} · borrador: {os.path.join(a.salida, 'borrador.json')} (clásico)")
    nota = ' (las partes sin un corte cerca se quedan en su sitio del diseño)'
    print(f"Estilo limpio: {os.path.join(a.salida, 'borrador_limpio.json')} · tiempos {tiempos}{nota}")
    print(f"  Formato del borrador: el de la referencia ({info['formato']}, {borrador['ancho']}×{borrador['alto']}). Si el usuario lo quiere en otro, cambia ancho y alto (vertical 1080×1920).")

if __name__ == '__main__': main()
