#!/usr/bin/env python3
"""Portada del reel (1080×1920) con el personaje en grande, para Instagram y TikTok.

Uso:  python3 portada.py PROYECTO/reel.json

Lee el bloque "portada" de reel.json:
  "portada": {"etiqueta": "SKILL DE CLAUDE", "l1": "MI MASCOTA", "l2": "HABLA SOLA",
              "pose": "sorpresa", "boca": "D", "sello": {"valor": "0", "texto": "píxeles animados"}}
Deja PROYECTO/salida/portada.png, portada.jpg y portada_comprobar.png (recorte 3:4 de la cuadrícula
de Instagram y la portada en miniatura, para ver que se lee).
"""
import os, sys
import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from comun import fuente, estilo, mezcla, cargar_json, ajusta_tam, parte_lineas  # noqa: E402
from render import Personaje, W, H  # noqa: E402

Y34 = (240, 1680)  # lo que enseña la cuadrícula del perfil


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    ruta = sys.argv[1]
    base = os.path.dirname(os.path.abspath(ruta))
    R = cargar_json(ruta)
    E = estilo(R.get("estilo", "claro"))
    P = R.get("portada")
    if not P:
        sys.exit("Falta el bloque «portada» en reel.json (mira el ejemplo en referencias/plan.md).")
    pj = Personaje(os.path.join(base, R.get("personaje", "personaje")), E)
    im = Image.new("RGB", (W, H), E["fondo"])
    d = ImageDraw.Draw(im)
    # cuadrícula de píxeles muy suave de fondo
    for x in range(0, W, 60):
        d.line([x, 0, x, H], fill=mezcla(E["fondo"], E["linea"], 0.35), width=2)
    for y in range(0, H, 60):
        d.line([0, y, W, y], fill=mezcla(E["fondo"], E["linea"], 0.35), width=2)
    # el halo va antes del título para no taparlo; se calcula con la posición del personaje
    pose = P.get("pose") or pj.inicial
    if pose not in pj.poses:
        sys.exit(f"La pose «{pose}» no existe. Poses: {', '.join(pj.poses)}")
    _lin = [l for l in (P.get("l1"), P.get("l2")) if l]
    _tam = ajusta_tam(_lin, "black", 150, 70, W - 120)
    _y_fin = Y34[0] + 70 + (110 if P.get("etiqueta") else 0) + int(_tam * 1.02) * len(_lin)
    escala = P.get("escala", 1.9)
    Pg = max(2, round(pj.escala(pose) * escala))
    boca_y = max(_y_fin + 60 + int(pj.d_ref * Pg), 1230)
    if P.get("halo", True):
        from render import _pixel_disco
        rr = int(min(470, pj.d_ref * Pg * 1.15))
        a1 = _pixel_disco(rr, mezcla(E["acento"], E["fondo"], 0.72), 14)
        a2 = _pixel_disco(rr * 0.74, mezcla(E["acento"], E["fondo"], 0.55), 14)
        a1.paste(a2, ((a1.width - a2.width) // 2, (a1.height - a2.height) // 2), a2)
        cy = boca_y - pj.d_ref * Pg * 0.35
        im.paste(a1, (int(W / 2 - a1.width / 2), int(cy - a1.height / 2)), a1)
    y = Y34[0] + 70
    if P.get("etiqueta"):
        f = fuente("bold", 40)
        tw = f.getlength(P["etiqueta"]) + 64
        d.rounded_rectangle([W / 2 - tw / 2, y, W / 2 + tw / 2, y + 74], 37, fill=E["texto"])
        d.text((W / 2, y + 37), P["etiqueta"], fill=E["fondo"] if E["fondo"] != E["texto"] else "#FFFFFF", font=f, anchor="mm")
        y += 110
    lineas = [l for l in (P.get("l1"), P.get("l2")) if l]
    tam = ajusta_tam(lineas, "black", 150, 70, W - 120)
    fl = fuente("black", tam)
    for k, l in enumerate(lineas):
        col = E["texto"] if (k == 0 and len(lineas) > 1) else E["acento"]
        d.text((W / 2, y + tam * 0.55), l, fill=col, font=fl, anchor="mm")
        y += int(tam * 1.02)
    # personaje grande
    spr, (bx, by) = pj.imagen(pose, P.get("boca", "D"), Pg, extender_a=(boca_y, H + 40))
    im.paste(spr, (int(W / 2 - bx), int(boca_y - by)), spr)
    if P.get("sello"):
        s = P["sello"]
        f1, f2 = fuente("black", 120), fuente("bold", 36)
        txt2 = parte_lineas(s.get("texto", ""), f2, 360)
        sw = int(max([f1.getlength(s.get("valor", ""))] + [f2.getlength(t) for t in txt2]) + 70)
        sh = 150 + 44 * len(txt2)
        st = Image.new("RGBA", (sw + 40, sh + 40), (0, 0, 0, 0))
        sd = ImageDraw.Draw(st)
        sd.rounded_rectangle([20, 20, 20 + sw, 20 + sh], 30, fill=E["acento"], outline="#FFFFFF", width=9)
        sd.text((20 + sw / 2, 20 + 80), s.get("valor", ""), fill="#FFFFFF", font=f1, anchor="mm")
        for k, t in enumerate(txt2):
            sd.text((20 + sw / 2, 20 + 160 + k * 44), t, fill="#FFFFFF", font=f2, anchor="mm")
        st = st.rotate(-8, expand=True, resample=Image.Resampling.BICUBIC)
        sy = s.get("y", boca_y + 200)
        sy = min(sy, Y34[1] - st.height / 2 - 10)  # que no se salga del recorte 3:4
        nat_a = np.array(pj.nat[pose])[..., 3] > 0
        bb_ = pj.boca(pose)
        mg = int(nat_a.shape[1] * 0.22)
        izq = nat_a[max(0, bb_["y"] - 10):, :max(1, bb_["x"] - mg)].sum() <= nat_a[max(0, bb_["y"] - 10):, bb_["x"] + mg:].sum()
        im.paste(st, (int(s.get("x", 250 if izq else 830) - st.width / 2), int(sy - st.height / 2)), st)
    sal = os.path.join(base, "salida")
    os.makedirs(sal, exist_ok=True)
    im.save(os.path.join(sal, "portada.png"))
    im.save(os.path.join(sal, "portada.jpg"), quality=92)
    # comprobación: recorte 3:4 y miniatura de 120 px
    rec = im.crop((0, Y34[0], W, Y34[1]))
    comp = Image.new("RGB", (rec.width // 2 + 220, rec.height // 2 + 60), (40, 40, 40))
    comp.paste(rec.resize((rec.width // 2, rec.height // 2)), (10, 50))
    mini = rec.resize((120, 160))
    comp.paste(mini, (rec.width // 2 + 60, 50))
    cd = ImageDraw.Draw(comp)
    cd.text((10, 12), "recorte 3:4 (cuadrícula)", fill=(255, 255, 255), font=fuente("semibold", 24))
    cd.text((rec.width // 2 + 40, 220), "a 120 px", fill=(255, 255, 255), font=fuente("semibold", 22))
    comp.save(os.path.join(sal, "portada_comprobar.png"))
    print("Portada:", os.path.join(sal, "portada.png"), "· comprobación:", os.path.join(sal, "portada_comprobar.png"))


if __name__ == "__main__":
    main()
