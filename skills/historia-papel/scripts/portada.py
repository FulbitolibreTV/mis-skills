#!/usr/bin/env python3
"""Portada de 1080×1920 (sirve para Instagram y TikTok) con una escena del vídeo y el título en tiras de papel.

Uso:  python3 portada.py PROYECTO [--t 3.5] [--titulo "texto con **clave**"] [--etiqueta "UNA HISTORIA REAL"]

Sin --t usa el momento más lleno de la primera escena. Sin --titulo usa "portada" de historia.json
({"titulo": "...", "etiqueta": "...", "t": 3.5}) o el título de la historia.
El título va dentro del recorte 3:4 del centro (y de 240 a 1680), que es lo que enseña la cuadrícula del perfil.
"""
import argparse, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from comun import cargar_json, proyecto  # noqa: E402


def lineas_titulo(texto, max_chars=13):
    """Parte el título en líneas cortas; las palabras entre ** van en naranja."""
    palabras, dentro = [], False
    for w in texto.split():
        m = w.count("**")
        clave = dentro or m > 0
        if m % 2:
            dentro = not dentro
        palabras.append((w.replace("**", ""), clave))
    lineas, act = [], []
    for w, c in palabras:
        if act and (len(" ".join(x for x, _ in act + [(w, c)])) > max_chars or act[-1][1] != c):
            lineas.append(act); act = []
        act.append((w, c))
    if act:
        lineas.append(act)
    return [(" ".join(x for x, _ in l), l[0][1]) for l in lineas]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("proyecto")
    ap.add_argument("--t", type=float, help="segundo del vídeo que se usa de fondo")
    ap.add_argument("--titulo")
    ap.add_argument("--etiqueta")
    ap.add_argument("--version", help="versión del plan (por defecto, la primera)")
    a = ap.parse_args()
    carpeta = proyecto(a.proyecto)
    historia = cargar_json(os.path.join(carpeta, "historia.json"))
    conf = historia.get("portada", {}) if isinstance(historia.get("portada"), dict) else {}
    import plan as planificador
    import papel
    import skia
    planes = planificador.todos(carpeta)
    p = next((x for x in planes if x["version"] == a.version), planes[0])
    p["recortes"] = []
    p.pop("palabras", None)
    papel.cargar(p)
    t = a.t if a.t is not None else conf.get("t")
    if t is None:
        f0 = p["frases"][0]
        t = f0["inicio"] + max(0.4, f0["dur"] - 0.3)
    titulo = a.titulo or conf.get("titulo") or historia.get("titulo", "")
    etiqueta = a.etiqueta if a.etiqueta is not None else conf.get("etiqueta", "UNA HISTORIA REAL")
    if not titulo:
        sys.exit("Falta el título: usa --titulo o «portada»: {«titulo»: …} en historia.json.")
    lz = papel.Lienzo(1.0)
    cv = lz.cv
    cv.save()
    papel.fotograma(cv, p, t)
    cv.restore()
    # velo para que el título se lea
    cv.drawRect(skia.Rect.MakeXYWH(0, 0, papel.W, papel.H), skia.Paint(Color4f=papel.col("#000000", 0.42)))
    ctx = papel.Ctx(0, 3)
    lineas = lineas_titulo(titulo)
    tam = 150 if max(len(l) for l, _ in lineas) <= 9 else (128 if max(len(l) for l, _ in lineas) <= 12 else 108)
    alto = tam * 1.45
    y = 960 - (len(lineas) * (alto + 18)) / 2 + alto / 2 + 40
    if etiqueta:
        f = papel.fuente("Bold", 46)
        ancho = f.measureText(etiqueta) + 60
        cv.save(); cv.translate(540, y - alto / 2 - 70); cv.rotate(-2)
        papel.sombra_capa(cv, (-ancho / 2, -40, ancho, 80), 0.8)
        papel.rr(cv, -ancho / 2, -38, ancho, 76, 6, papel.pp("crema", ctx=ctx, semilla=3))
        cv.restore()
        papel.texto(cv, etiqueta, 0, 16, tam=46, peso="Bold", c="tinta")
        cv.restore()
    for k, (texto, clave) in enumerate(lineas):
        f = papel.fuente("Black", tam)
        ancho = f.measureText(texto) + tam * 0.9
        cv.save(); cv.translate(540 + (24 if k % 2 else -24), y + k * (alto + 18)); cv.rotate(-2.5 if k % 2 == 0 else 2)
        papel.sombra_capa(cv, (-ancho / 2, -alto / 2, ancho, alto), 1.2, dx=8, dy=12, blur=4)
        pt = skia.Paint(AntiAlias=True, Color4f=papel.col("naranja" if clave else "crema"))
        pt.setPathEffect(skia.DiscretePathEffect.Make(7, 2.6, 17 + k))
        cv.drawRect(skia.Rect.MakeXYWH(-ancho / 2, -alto / 2, ancho, alto), pt)
        cv.restore()
        papel.texto(cv, texto, 0, tam * 0.36, tam=tam, peso="Black", c="blanco" if clave else "tinta")
        cv.restore()
    papel.acabado(cv, viñeta=False)
    from PIL import Image
    im = Image.frombytes("RGBA", (lz.w, lz.h), lz.surf.makeImageSnapshot().tobytes()).convert("RGB")
    salida = os.path.join(carpeta, "salida", f"{p['nombre_archivo'].rsplit('_', 1)[0] if p['version'] != 'video' else p['nombre_archivo']}_portada.png")
    im.save(salida)
    alto_total = len(lineas) * (alto + 18) + (110 if etiqueta else 0)
    if alto_total > 1440:
        print("  Aviso: el título es largo y se sale del recorte 3:4 del perfil. Acórtalo (3 o 4 líneas cortas).")
    print("Portada lista:", salida, f"(fondo: segundo {t:.1f})")


if __name__ == "__main__":
    main()
