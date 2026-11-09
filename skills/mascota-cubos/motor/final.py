#!/usr/bin/env python3
"""Segundo final (por ejemplo, TikTok) sin rehacer el vídeo entero.

python3 final.py proyecto/reel.json --texto "Sígueme y escríbeme CUBOS por privado y te lo mando." \
    --usuario @mi_cuenta --palabra CUBOS [--bio "Recetas fáciles cada semana"]
    [--voz final.mp3] [--acelerar 1.05] [--claves "Sígueme,CUBOS"] [--poses "senala_camara,celebra"] [--salida otra_carpeta]

1. Crea la carpeta del segundo final (por defecto, <proyecto>_tiktok dentro de motor/) con una copia del plan
   en la que solo cambia la última frase, que pasa a ser una escena final «sígueme y escríbeme por privado»
   (tarjeta de perfil, «Seguir», «Mensaje» y el mensaje con la palabra), y con "base" apuntando al proyecto original.
2. Si el reel tiene voz, pega el audio del final nuevo (--voz, solo esa frase) detrás del cuerpo de la voz
   original, de modo que empiece en el mismo instante que la frase original, y reutiliza los tiempos del cuerpo
   tal cual: así todo lo anterior al final es idéntico y no se vuelve a renderizar.
3. Después: render.js copia de la versión original los fotogramas iguales y solo renderiza el final.
"""
import argparse, copy, json, os, shutil, subprocess, sys, tempfile, wave

AQUI = os.path.dirname(os.path.abspath(__file__))
NO_COPIAR = {'fotogramas', 'muestras', 'info.json', 'voz.wav', 'tiempos.json'}


def duracion(ruta):
    with wave.open(ruta) as w:
        return w.getnframes() / w.getframerate()


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('plan')
    ap.add_argument('--texto', required=True, help='la última frase nueva, bien escrita (salen los subtítulos de aquí)')
    ap.add_argument('--voz', help='audio solo con la frase nueva (obligatorio si el reel tiene voz)')
    ap.add_argument('--acelerar', default='1.0')
    ap.add_argument('--claves', default='', help='palabras de la frase que salen en caja de color, separadas por comas')
    ap.add_argument('--poses', default='', help='poses de la frase, separadas por comas (por defecto, las del final original)')
    ap.add_argument('--salida', help='carpeta del segundo final (por defecto, <proyecto>_tiktok)')
    ap.add_argument('--usuario', help='la cuenta que sale en la tarjeta de perfil, por ejemplo @mi_cuenta (pregúntasela a la persona)')
    ap.add_argument('--bio', help='una línea bajo el nombre de la cuenta')
    ap.add_argument('--palabra', help='la palabra que tienen que escribir por privado (por defecto, la del final original)')
    a = ap.parse_args()

    plan_ruta = os.path.abspath(a.plan)
    dir_base = os.path.dirname(plan_ruta)
    base = json.load(open(plan_ruta, encoding='utf-8'))
    destino = os.path.abspath(a.salida or dir_base.rstrip('/') + '_tiktok')
    if destino == dir_base:
        sys.exit('La carpeta del segundo final tiene que ser distinta de la del proyecto.')
    os.makedirs(destino, exist_ok=True)

    # 1 · archivos del proyecto (personaje, imágenes, módulos), sin lo que se regenera
    for n in os.listdir(dir_base):
        if n in NO_COPIAR or n == os.path.basename(plan_ruta) or n.lower().endswith(('.mp4', '.wav', '.mp3', '.m4a')):
            continue
        o = os.path.join(dir_base, n)
        if os.path.isfile(o):
            shutil.copy2(o, os.path.join(destino, n))
        elif os.path.isdir(o):
            shutil.copytree(o, os.path.join(destino, n), dirs_exist_ok=True)

    # 2 · plan: solo cambia la última frase
    nuevo = copy.deepcopy(base)
    k = len(nuevo['frases']) - 1
    fin = nuevo['frases'][k]
    esc = fin.get('escena') if isinstance(fin.get('escena'), dict) else {}
    fin['texto'] = a.texto
    fin['claves'] = [c.strip() for c in a.claves.split(',') if c.strip()]
    if a.poses:
        fin['poses'] = [p.strip() for p in a.poses.split(',') if p.strip()]
    fin['escena'] = {'tipo': 'cta', 'cielo': esc.get('cielo', 'atardecer'),
                     'cta': {'modo': 'sigueme', **{x: v for x, v in (esc.get('cta') or {}).items() if x in ('usuario', 'bio', 'palabra', 'textos')}}}
    for campo in ('usuario', 'bio', 'palabra'):
        if getattr(a, campo):
            fin['escena']['cta'][campo] = getattr(a, campo)
    if not fin['escena']['cta'].get('usuario'):
        print('Aviso: falta --usuario; la tarjeta dirá «@tu_cuenta». Pregunta a la persona su cuenta y repite.')
    nuevo['base'] = os.path.relpath(plan_ruta, destino)
    nuevo['salida'] = 'reel.mp4'
    nuevo.pop('voz', None); nuevo.pop('tiempos', None)

    # 3 · voz: cuerpo original + 0,12 s + final nuevo, con los tiempos del cuerpo intactos
    if base.get('tiempos') and base.get('voz'):
        if not a.voz:
            sys.exit('Este reel tiene voz: pasa con --voz el audio que dice solo la frase nueva.')
        t_base = json.load(open(os.path.join(dir_base, base['tiempos']), encoding='utf-8'))
        cuerpo = [w for w in t_base['palabras'] if w['frase'] < k]
        if not cuerpo:
            sys.exit('No encuentro el cuerpo de la voz en tiempos.json.')
        corte = max(w['fin'] for w in cuerpo) + 0.06
        tmp = tempfile.mkdtemp()
        json.dump({'frases': [{'texto': a.texto}], 'idioma': base.get('idioma', 'es')},
                  open(os.path.join(tmp, 'reel.json'), 'w', encoding='utf-8'), ensure_ascii=False)
        r = subprocess.run([sys.executable, os.path.join(AQUI, 'alinear.py'), os.path.join(tmp, 'reel.json'), os.path.abspath(a.voz),
                            '--acelerar', a.acelerar], capture_output=True, text=True)
        print(r.stdout.strip())
        if r.returncode:
            sys.exit('No se pudo preparar la voz del final:\n' + r.stderr[-800:])
        t_fin = json.load(open(os.path.join(tmp, 'tiempos.json'), encoding='utf-8'))
        # la frase nueva empieza donde empezaba la original (así la escena anterior no cambia); como mínimo, 0,05 s de silencio
        ini_base = min(w['ini'] for w in t_base['palabras'] if w['frase'] == k)
        ini_fin = min(w['ini'] for w in t_fin['palabras']) if t_fin['palabras'] else 0.0
        hueco = max(0.05, round(ini_base - ini_fin - corte, 3))
        voz_out = os.path.join(destino, 'voz.wav')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(dir_base, base['voz']), '-i', os.path.join(tmp, 'voz.wav'),
                        '-filter_complex', f'[0:a]atrim=0:{corte:.3f},asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo[a];'
                        f'anullsrc=r=48000:cl=stereo,atrim=0:{hueco}[s];[1:a]aresample=48000,aformat=channel_layouts=stereo[b];'
                        '[a][s][b]concat=n=3:v=0:a=1[o]', '-map', '[o]', voz_out], check=True)
        off = corte + hueco
        palabras = cuerpo + [{**w, 'ini': round(w['ini'] + off, 3), 'fin': round(w['fin'] + off, 3), 'frase': k} for w in t_fin['palabras']]
        json.dump({'duracion': round(duracion(voz_out), 3), 'palabras': palabras},
                  open(os.path.join(destino, 'tiempos.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
        nuevo['voz'] = 'voz.wav'; nuevo['tiempos'] = 'tiempos.json'
        shutil.rmtree(tmp, ignore_errors=True)
        print(f'Voz del segundo final: cuerpo hasta {corte:.2f} s + {hueco:.2f} s de pausa + final → {duracion(voz_out):.1f} s')

    json.dump(nuevo, open(os.path.join(destino, 'reel.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    rel = os.path.relpath(destino, AQUI)
    print(f'Listo: {rel}/reel.json (base: el proyecto original).')
    print('Siguiente: renderiza antes el original entero; luego, desde motor/:')
    print(f'  node render.js {rel}/reel.json        # copia los fotogramas iguales y solo hace el final')
    print(f'  node montar.js {rel}/reel.json && python3 ritmo.py {rel}/reel.mp4')


if __name__ == '__main__':
    main()
