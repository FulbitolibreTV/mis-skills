"""Mide el ritmo de un reel ya renderizado: busca los tramos en los que no pasa nada en pantalla.

Uso:
  python3 ritmo.py salida/reel.mp4 [--tiempos src/datos/tiempos.json] [--hueco 0.6] [--por-zona]
                   [--umbral 1.5] [--umbral-detalle 6] [--json informe.json]

Cómo mide:
  - Reduce el vídeo a 540x960 en gris y compara cada fotograma con el anterior, por zonas de pantalla
    (arriba, centro, abajo), porque un cambio pequeño en una zona se pierde en la media de toda la imagen.
  - Un fotograma "tiene evento" si en alguna zona la diferencia media pasa de --umbral (escala 0-255)
    o si en alguna baldosa de 90x80 px la diferencia con dos fotogramas antes pasa de --umbral-detalle.
    Lo primero cuenta tarjetas, iconos y cambios grandes; lo segundo, cosas pequeñas que también se ven,
    como cada palabra que aparece en los subtítulos. Los dos dejan fuera la respiración del personaje,
    el empuje lento de cámara y las manchas del fondo.
  - Un "hueco" es un tramo seguido sin eventos más largo que --hueco segundos (0,6 s es la regla del método:
    en los reels de referencia nunca pasan más de 0,6 s sin que algo cambie).
Con --tiempos dice en qué frase cae cada hueco, para saber qué escena hay que animar más.
Siempre enseña el tramo quieto más largo de cada zona (arriba, centro, abajo). Con --por-zona es más exigente:
cada zona por separado tiene que cambiar al menos cada --hueco segundos (no basta con que cambie otra).
Termina con código 1 si hay huecos, para usarlo como control antes de entregar.
"""
import argparse
import json
import os
import shutil
import subprocess
import sys

import numpy as np

W, H = 540, 960
ZONAS = {"arriba": (0, 300), "centro": (300, 640), "abajo": (640, 960)}


def ffmpeg_bin(video):
    """ffmpeg del sistema, el que trae Remotion en el proyecto del vídeo (salida/../node_modules) o imageio-ffmpeg."""
    if shutil.which("ffmpeg"):
        return "ffmpeg", dict(os.environ)
    proyecto = os.path.dirname(os.path.dirname(os.path.abspath(video)))
    base = os.path.join(proyecto, "node_modules", "@remotion")
    if os.path.isdir(base):
        for d in sorted(os.listdir(base)):
            b = os.path.join(base, d, "ffmpeg")
            if d.startswith("compositor-") and os.path.exists(b):
                env = dict(os.environ)
                env["LD_LIBRARY_PATH"] = os.path.join(base, d) + ":" + env.get("LD_LIBRARY_PATH", "")
                env["DYLD_LIBRARY_PATH"] = os.path.join(base, d)
                return b, env
    try:
        import imageio_ffmpeg  # type: ignore

        return imageio_ffmpeg.get_ffmpeg_exe(), dict(os.environ)
    except Exception:
        sys.exit("No encuentro ffmpeg. Instálalo con: pip install imageio-ffmpeg")


def fps_de(video, ff, env):
    out = subprocess.run([ff, "-hide_banner", "-i", video], capture_output=True, text=True, env=env).stderr
    import re

    m = re.search(r"(\d+(?:\.\d+)?) fps", out)
    return float(m.group(1)) if m else 30.0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--tiempos")
    ap.add_argument("--hueco", type=float, default=0.6)
    ap.add_argument("--umbral", type=float, default=1.5)
    ap.add_argument("--umbral-detalle", type=float, default=6.0)
    ap.add_argument("--json")
    ap.add_argument("--por-zona", action="store_true", help="exige un cambio cada --hueco segundos en cada zona por separado")
    a = ap.parse_args()
    if not os.path.exists(a.video):
        sys.exit(f"No encuentro el vídeo {a.video}. Renderízalo antes (node render.mjs video).")

    ff, env = ffmpeg_bin(a.video)
    fps = fps_de(a.video, ff, env)
    cmd = [ff, "-hide_banner", "-loglevel", "error", "-i", a.video, "-vf", f"scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "gray", "-"]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, env=env)
    TW, TH = 90, 80
    previos = []
    difs = []
    detalle = []
    detalle_zona = []
    filas_zona = {z: [k for k in range(H // TH) if y0 <= (k + 0.5) * TH < y1] for z, (y0, y1) in ZONAS.items()}
    while True:
        buf = proc.stdout.read(W * H)
        if len(buf) < W * H:
            break
        fr = np.frombuffer(buf, dtype=np.uint8).reshape(H, W).astype(np.int16)
        if previos:
            d = np.abs(fr - previos[-1])
            difs.append([d[y0:y1].mean() for y0, y1 in ZONAS.values()])
            d2 = np.abs(fr - previos[0])  # dos fotogramas atrás: pilla los fundidos cortos
            bald = d2.reshape(H // TH, TH, W // TW, TW).mean(axis=(1, 3))
            detalle.append(bald.max())
            detalle_zona.append([bald[f].max() if f else 0 for f in filas_zona.values()])
        previos = (previos + [fr])[-2:]
    proc.wait()
    if not difs:
        sys.exit("No he podido leer fotogramas del vídeo")
    difs = np.array(difs)
    evento = (difs > a.umbral).any(axis=1) | (np.array(detalle) > a.umbral_detalle)
    n = len(evento) + 1
    dur = n / fps

    def tramos_quietos(ev):
        out, i = [], 0
        while i < len(ev):
            if not ev[i]:
                j = i
                while j < len(ev) and not ev[j]:
                    j += 1
                out.append((round((i + 1) / fps, 2), round((j + 1) / fps, 2), round((j - i) / fps, 2)))
                i = j
            else:
                i += 1
        return out

    huecos = [t for t in tramos_quietos(evento) if t[2] > a.hueco]
    # por zonas: cada zona con su propio cambio (media de la zona o una baldosa de la zona)
    dz = np.array(detalle_zona)
    zonas = {}
    for k, z in enumerate(ZONAS):
        ev_z = (difs[:, k] > a.umbral) | (dz[:, k] > a.umbral_detalle)
        tr = tramos_quietos(ev_z)
        zonas[z] = {"mas_largo": max(tr, key=lambda t: t[2]) if tr else (0, 0, 0.0), "huecos": [t for t in tr if t[2] > a.hueco]}
    if a.por_zona:
        # un hueco de toda la pantalla también lo es de cada zona: se listan por zona
        huecos = sorted((t0, t1, l, z) for z, info in zonas.items() for t0, t1, l in info["huecos"])

    frases = []
    if a.tiempos:
        frases = json.load(open(a.tiempos))["frases"]

    def frase_de(t):
        for k, f in enumerate(frases):
            sig = frases[k + 1]["inicio"] if k + 1 < len(frases) else 1e9
            if f["inicio"] - 0.3 <= t < sig:
                return k, f["texto"]
        return None, ""

    quietos = 100 * (~evento).mean()
    # eventos = arranques de movimiento (fotograma con evento tras uno sin evento) + cambios fuertes
    arranques = int(((evento[1:]) & (~evento[:-1])).sum()) + int(evento[0])
    print(f"duración {dur:.2f} s · {fps:.0f} fps · fotogramas quietos {quietos:.1f} % · arranques de movimiento {arranques / dur:.2f}/s")
    print("Por zonas (" + ("cuentan para el veredicto" if a.por_zona else "orientativo; con --por-zona cuentan") + "): tramo quieto más largo")
    for z, info in zonas.items():
        t0, t1, l = info["mas_largo"]
        marca = ("✗" if l > a.hueco else "✓") if a.por_zona else " "
        print(f"  {marca} {z:<7} {l:.2f} s" + (f" ({t0:.2f}–{t1:.2f} s)" if l else ""))
    if huecos:
        print(f"HUECOS de más de {a.hueco} s sin nada nuevo" + (" en alguna zona" if a.por_zona else " en pantalla") + f": {len(huecos)}")
        for h in huecos:
            t0, t1, l = h[:3]
            k, texto = frase_de(t0)
            donde = f"  ← frase {k + 1}: {texto}" if k is not None else ""
            print(f"  {t0:6.2f}–{t1:6.2f} s ({l:.2f} s)" + (f" [{h[3]}]" if len(h) > 3 else "") + donde)
        print("Arréglalo: haz que algo entre o cambie en ese tramo (una palabra clave que dispare un elemento, un contador, un icono).")
        if a.por_zona:
            print("En una zona concreta: arriba, un titular o una etiqueta que cambie; en el centro, otro momento de la escena;")
            print("abajo, los subtítulos (quita \"sinSubtitulos\" si sobra) o un cambio de pose del personaje.")
    else:
        print(f"OK: ningún tramo de más de {a.hueco} s sin movimiento" + (" en ninguna zona." if a.por_zona else "."))
    if not a.por_zona:
        largas = [(z, info["mas_largo"]) for z, info in zonas.items() if info["mas_largo"][2] > 3]
        for z, (t0, t1, l) in largas:
            k, texto = frase_de(t0)
            print(f"  Nota: la zona de {z} se queda quieta {l:.1f} s ({t0:.2f}–{t1:.2f} s" + (f", frase {k + 1}" if k is not None else "") + "). No es un fallo, pero si quieres más ritmo, anímala ahí (ritmo.md) o mira con --por-zona.")
    if a.json:
        json.dump({"duracion": dur, "fps": fps, "quietos_pct": quietos, "huecos": huecos, "zonas": zonas}, open(a.json, "w"), indent=1)
    sys.exit(1 if huecos else 0)


if __name__ == "__main__":
    main()
