#!/usr/bin/env python3
"""Convierte imágenes de un personaje en sprites de píxeles listos para animar.

Uso:
  python3 sprite.py preparar --entrada FOTOS_O_CARPETA... --salida PROYECTO/personaje [--modo auto|pixel|dibujo]
                             [--alto 120] [--colores 32]
  python3 sprite.py boca --personaje PROYECTO/personaje --pose NOMBRE --x X --y Y --ancho W
  python3 sprite.py hoja --personaje PROYECTO/personaje      (vuelve a dibujar la hoja de comprobación)

«preparar» deja en la carpeta de salida:
  nativos/<pose>.png      sprite a su tamaño real de píxel (1 px = 1 píxel del dibujo)
  vistas/<pose>.png       vista ampliada con rejilla y números para marcar la boca
  personaje.json          poses, tamaños y boca de cada pose (la boca se marca con «boca»)
  hoja.png                todas las poses juntas para revisarlas
"""
import argparse, glob, math, os, sys
import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from comun import fuente, cargar_json, guardar_json  # noqa: E402

EXT = (".png", ".jpg", ".jpeg", ".webp")
VISEMAS = ["X", "A", "B", "C", "D", "E", "F"]


# ---------------------------------------------------------------- fondo
def quitar_fondo(im):
    """Devuelve RGBA con el fondo transparente. Usa el canal alfa si ya lo hay; si no, borra
    el color liso que toca los bordes (relleno desde el borde, tolerante a JPG)."""
    im = im.convert("RGBA")
    a = np.array(im)
    if (a[..., 3] < 128).mean() > 0.03:
        return im, "alfa"
    rgbf = a[..., :3].astype(np.int32)
    borde = np.concatenate([rgbf[0], rgbf[-1], rgbf[:, 0], rgbf[:, -1]])
    fondo = np.median(borde, axis=0)
    dist = np.abs(rgbf - fondo).sum(axis=2)
    parecido = dist < 60
    if parecido[0].mean() < 0.5 and parecido[-1].mean() < 0.5:
        print("  Aviso: el fondo no parece liso. Si el recorte sale mal, pide la imagen con fondo transparente o de un color liso.")
    try:
        from scipy import ndimage
        etiq, _ = ndimage.label(parecido)
        # semillas arriba y a los lados (no abajo: el personaje suele estar cortado por la cintura
        # y una camiseta del color del fondo se borraría)
        ids = set(np.unique(np.concatenate([etiq[0], etiq[:, 0], etiq[:, -1]]))) - {0}
        fuera = np.isin(etiq, list(ids))
    except ImportError:
        m = Image.fromarray((parecido * 255).astype(np.uint8))
        h, w = parecido.shape
        for (x, y) in [(0, 0), (w - 1, 0), (w // 2, 0), (0, h // 2), (w - 1, h // 2), (0, h - 1), (w - 1, h - 1)]:
            if m.getpixel((x, y)) == 255:
                ImageDraw.floodfill(m, (x, y), 128)
        fuera = np.array(m) == 128
    r_, g_, b_ = fondo
    croma = (max(fondo) - min(fondo)) > 120  # fondo muy saturado (verde o magenta): se quita en todas partes
    if croma:
        fuera = fuera | (dist < 110)
        if g_ > r_ + 80 and g_ > b_ + 80:  # verde: quita también el halo verde de los bordes
            fuera = fuera | ((rgbf[..., 1] > rgbf[..., 0] + 50) & (rgbf[..., 1] > rgbf[..., 2] + 50))
        elif r_ > g_ + 80 and b_ > g_ + 80:  # magenta
            fuera = fuera | ((rgbf[..., 0] > rgbf[..., 1] + 60) & (rgbf[..., 2] > rgbf[..., 1] + 60))
    a[..., 3] = np.where(fuera, 0, 255)
    return Image.fromarray(a), "color %s%s" % ("#%02X%02X%02X" % tuple(int(c) for c in fondo), " (croma)" if croma else "")


# ---------------------------------------------------------------- rejilla
def _distancias(rgb, al):
    """Distancias entre bordes de color a lo largo de cada fila (los bordes desenfocados cuentan como uno)."""
    g = np.abs(np.diff(rgb, axis=1)).sum(axis=2) * (al[:, 1:] & al[:, :-1])
    ds = []
    for fila in g[::2]:
        bordes = np.where(fila > 60)[0]
        if len(bordes) < 2:
            continue
        grupos, act = [], [bordes[0]]
        for b in bordes[1:]:
            if b - act[-1] <= 1:
                act.append(b)
            else:
                grupos.append(np.mean(act)); act = [b]
        grupos.append(np.mean(act))
        d = np.diff(grupos)
        ds.extend(d[(d >= 1.5) & (d <= 80)])
    return np.array(ds)


def _periodo(rgb, al):
    """Tamaño del bloque de píxel en un eje: (periodo, fase, calidad 0–1)."""
    ds = _distancias(rgb, al)
    if len(ds) < 30:
        return 0.0, 0.0, 0.0
    S = np.arange(2.0, 40.0, 0.02)
    sc = np.array([np.cos(2 * np.pi * ds / s).mean() for s in S])
    M = sc.max()
    s0 = S[sc > 0.85 * M].max()
    loc = (S > s0 - 0.3) & (S < s0 + 0.3)
    s0 = S[loc][sc[loc].argmax()]
    q = float(sc[loc].max())
    # afina el periodo y saca la fase con el perfil de bordes
    perfil = (np.abs(np.diff(rgb, axis=1)).sum(axis=2) * (al[:, 1:] & al[:, :-1]))
    perfil = np.where(perfil > 40, perfil, 0).sum(axis=0)
    x = np.arange(len(perfil)); tot = perfil.sum() + 1e-9
    mejor = (0, s0, 0.0)
    for s in np.arange(s0 * 0.94, s0 * 1.06, 0.005):
        z = (perfil * np.exp(-2j * np.pi * x / s)).sum() / tot
        if abs(z) > mejor[0]:
            mejor = (abs(z), s, np.angle(z))
    _, s, ang = mejor
    return float(s), float((ang / (2 * np.pi)) * s % s), q


def detectar_rejilla(rgba):
    a = np.asarray(rgba).astype(np.float32)
    rgb, al = a[..., :3], a[..., 3] > 127
    sx, fx, qx = _periodo(rgb, al)
    sy, fy, qy = _periodo(rgb.transpose(1, 0, 2), al.T)
    return (sx, fx + 0.5, qx), (sy, fy + 0.5, qy)


def muestrear(rgba, sx, fx, sy, fy):
    a = np.asarray(rgba)
    H, W = a.shape[:2]
    xs = np.arange(fx, W, sx); ys = np.arange(fy, H, sy)
    out = np.zeros((len(ys) + 1, len(xs) + 1, 4), np.uint8)
    bordes_x = np.concatenate([[0], xs, [W]]); bordes_y = np.concatenate([[0], ys, [H]])
    for j in range(len(bordes_y) - 1):
        y0, y1 = bordes_y[j], bordes_y[j + 1]
        if y1 - y0 < 1:
            continue
        iy0, iy1 = int(y0 + (y1 - y0) * 0.25), max(int(y0 + (y1 - y0) * 0.75), int(y0 + (y1 - y0) * 0.25) + 1)
        for i in range(len(bordes_x) - 1):
            x0, x1 = bordes_x[i], bordes_x[i + 1]
            if x1 - x0 < 1:
                continue
            ix0, ix1 = int(x0 + (x1 - x0) * 0.25), max(int(x0 + (x1 - x0) * 0.75), int(x0 + (x1 - x0) * 0.25) + 1)
            bloque = a[iy0:iy1, ix0:ix1].reshape(-1, 4)
            if len(bloque) == 0:
                continue
            opacos = bloque[bloque[:, 3] > 127]
            if len(opacos) * 2 < len(bloque):
                continue
            out[j, i, :3] = np.median(opacos[:, :3], axis=0)
            out[j, i, 3] = 255
    return Image.fromarray(out)


# ---------------------------------------------------------------- limpieza
def quitar_halo(im, fondo_txt):
    """Los píxeles del borde que han cogido el color del fondo croma pasan a ser contorno oscuro."""
    a = np.array(im).astype(np.int32)
    op = a[..., 3] > 0
    p = np.pad(op, 1)
    borde = op & ~(np.roll(p, 1, 0) & np.roll(p, -1, 0) & np.roll(p, 1, 1) & np.roll(p, -1, 1))[1:-1, 1:-1]
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    if "#00FF" in fondo_txt.upper() or (g.mean() > 0 and "croma" in fondo_txt and fondo_txt[7:9] != "00"):
        manchado = (g > r + 30) & (g > b + 30)
    else:  # magenta
        manchado = (r > g + 40) & (b > g + 40)
    lum = (r * 299 + g * 587 + b * 114) // 1000
    limpio = g <= np.maximum(r, b) + 6
    oscuros = a[op & (lum < 70) & ~manchado & limpio][:, :3]
    color = np.median(oscuros, axis=0) if len(oscuros) > 10 else np.array([24, 22, 28])
    cambiar = borde & manchado
    a[cambiar, :3] = color
    # el personaje no lleva verde (lo pide el prompt): los verdes oscuros que queden en el contorno
    # o pegados a él también son restos del fondo
    resto = manchado & ~cambiar & (lum < 150)
    a[resto, :3] = color
    # 2.º anillo del borde: tonos oscuros apenas verdosos (mezcla de contorno y fondo)
    p2 = np.pad(borde, 1)
    anillo = op & (np.roll(p2, 1, 0) | np.roll(p2, -1, 0) | np.roll(p2, 1, 1) | np.roll(p2, -1, 1))[1:-1, 1:-1]
    verdoso = (g > r + 12) & (g > b + 4) & (lum < 110)
    a[(borde | anillo) & verdoso, :3] = color
    # segunda capa: manchados pegados a un borde ya corregido
    return Image.fromarray(a.astype(np.uint8))


def contorno_limpio(im):
    """Los píxeles grises oscuros del borde exterior (restos de JPG o de suavizado) pasan a contorno."""
    a = np.array(im).astype(np.int32)
    op = a[..., 3] > 0
    p = np.pad(op, 1)
    borde = op & ~(np.roll(p, 1, 0) & np.roll(p, -1, 0) & np.roll(p, 1, 1) & np.roll(p, -1, 1))[1:-1, 1:-1]
    lum = (a[..., 0] * 299 + a[..., 1] * 587 + a[..., 2] * 114) // 1000
    sat = a[..., :3].max(axis=2) - a[..., :3].min(axis=2)
    oscuros = a[op & (lum < 60)][:, :3]
    if len(oscuros) < 20:
        return im
    color = np.median(oscuros, axis=0)
    cambiar = borde & (lum < 105) & (lum >= 60) & (sat < 40)
    a[cambiar, :3] = color
    return Image.fromarray(a.astype(np.uint8))


def unificar_contorno(im):
    """Tras un fondo croma, los oscuros parecidos al contorno (mezclados con el verde) pasan a ser el contorno."""
    a = np.array(im).astype(np.int32)
    op = a[..., 3] > 0
    lum = (a[..., 0] * 299 + a[..., 1] * 587 + a[..., 2] * 114) // 1000
    oscuros = a[op & (lum < 70)][:, :3]
    if len(oscuros) < 20:
        return im
    cols, cuenta = np.unique(oscuros, axis=0, return_counts=True)
    candidatos = [(c @ np.array([299, 587, 114]) // 1000, tuple(c)) for c, n in zip(cols, cuenta) if n >= 0.05 * len(oscuros)]
    if not candidatos:
        return im
    base = np.array(min(candidatos)[1])
    dist = np.abs(a[..., :3] - base).sum(axis=2)
    cambiar = op & (lum < 85) & (dist < 60)
    a[cambiar, :3] = base
    return Image.fromarray(a.astype(np.uint8))


def cuantizar(im, colores):
    a = np.array(im)
    op = a[..., 3] > 0
    if op.sum() == 0:
        return im
    rgb = Image.fromarray(a[..., :3])
    q = rgb.quantize(colors=colores, method=Image.Quantize.MEDIANCUT, kmeans=4, dither=Image.Dither.NONE).convert("RGB")
    a[..., :3] = np.where(op[..., None], np.array(q), 0)
    return Image.fromarray(a)


def limpiar(im):
    a = np.array(im)
    op = a[..., 3] > 0
    # quita píxeles opacos sueltos y rellena agujeros de 1 píxel
    p = np.pad(op, 1)
    vec = sum(np.roll(np.roll(p, dy, 0), dx, 1) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dy or dx)[1:-1, 1:-1]
    sueltos = op & (vec <= 1)
    a[sueltos, 3] = 0
    return Image.fromarray(a)


def contorno(im, color=None):
    """Añade 1 píxel de contorno oscuro donde el borde exterior no es ya oscuro."""
    a = np.array(im)
    op = a[..., 3] > 0
    lum = a[..., :3].astype(np.int32) @ np.array([299, 587, 114]) / 1000
    if color is None:
        oscuros = a[op & (lum < 70)][:, :3]
        color = np.median(oscuros, axis=0).astype(np.uint8) if len(oscuros) > 20 else np.array([24, 22, 28], np.uint8)
    p = np.pad(op, 1)
    vecino = (np.roll(p, 1, 0) | np.roll(p, -1, 0) | np.roll(p, 1, 1) | np.roll(p, -1, 1))[1:-1, 1:-1]
    borde_ext = op & ~(np.roll(p, 1, 0) & np.roll(p, -1, 0) & np.roll(p, 1, 1) & np.roll(p, -1, 1))[1:-1, 1:-1]
    claros = borde_ext & (lum > 90)
    if claros.mean() > 0.002:  # el borde no es oscuro: se dibuja contorno fuera
        a = np.pad(a, ((1, 1), (1, 1), (0, 0)))
        op2 = a[..., 3] > 0
        p2 = np.pad(op2, 1)
        nuevo = ~op2 & (np.roll(p2, 1, 0) | np.roll(p2, -1, 0) | np.roll(p2, 1, 1) | np.roll(p2, -1, 1))[1:-1, 1:-1]
        nuevo[-1, :] = False  # abajo no: el personaje está cortado por la cintura
        a[nuevo, :3] = color; a[nuevo, 3] = 255
    del vecino
    return Image.fromarray(a)


def recortar(im):
    bb = im.getbbox()
    return im.crop(bb) if bb else im


def a_pixeles(ruta, modo, alto, colores, factor=None, nitido=True):
    original = Image.open(ruta)
    rgba, como = quitar_fondo(original)
    if como == "alfa" and "croma" in original.info.get("fondo", ""):
        como = original.info["fondo"]  # viene de «cortar»: recuerda que el fondo era croma
    bb = rgba.getbbox()
    if not bb:
        raise SystemExit(f"{ruta}: la imagen ha quedado vacía al quitar el fondo.")
    rgba = rgba.crop(bb)
    info = {"fondo": como}
    if max(rgba.size) <= 260 and modo != "dibujo":
        # ya es un sprite a tamaño real (1 píxel = 1 píxel): se usa tal cual
        nat = limpiar(cuantizar(rgba, colores))
        info.update(modo="nativo")
        return recortar(contorno(nat)), info
    (sx, fx, qx), (sy, fy, qy) = detectar_rejilla(rgba)
    es_pixel = qx > 0.62 and qy > 0.62 and sy > 0 and 0.85 < sx / sy < 1.18 and sx >= 2.4
    if modo == "pixel" or (modo == "auto" and es_pixel):
        s = (sx + sy) / 2 if abs(sx - sy) < 0.6 else None
        nat = muestrear(rgba, s or sx, fx % (s or sx), s or sy, fy % (s or sy))
        info.update(modo="pixel", bloque=round(float(s or sx), 2), calidad=round(float(min(qx, qy)), 2))
        if max(nat.size) < 40:
            print(f"  Aviso: en modo pixel sale un sprite diminuto ({nat.width}×{nat.height}); la imagen no es pixel art de bloques "
                  "regulares. Uso el modo dibujo nítido.")
            k = factor if factor else rgba.height / alto
            nat = muestrear(rgba, k, 0, k, 0)
            info.update(modo="dibujo", nitido=True)
        # si el bloque es muy pequeño el sprite sale enorme: se reduce a «alto»
        if nat.height > alto * 1.6:
            f = alto / nat.height
            nat = nat.resize((max(1, round(nat.width * f)), alto), Image.Resampling.NEAREST)
            info["reducido"] = True
    elif nitido:
        # muestreo por bloques: cada píxel del sprite toma el color central de su bloque (sin mezclar
        # colores en los bordes), así el sprite sale nítido aunque la imagen de origen sea suave
        k = factor if factor else rgba.height / alto
        nat = muestrear(rgba, k, 0, k, 0)
        info.update(modo="dibujo", nitido=True, calidad=round(float(min(qx, qy)), 2))
    else:
        f = (1.0 / factor) if factor else alto / rgba.height
        w = max(1, round(rgba.width * f))
        alto = max(1, round(rgba.height * f))
        a = np.array(rgba).astype(np.float32)
        # premultiplica para no ensuciar el borde al reducir
        a[..., :3] *= a[..., 3:4] / 255.0
        red = np.array(Image.fromarray(a.astype(np.uint8)).resize((w, alto), Image.Resampling.BOX)).astype(np.float32)
        al = red[..., 3:4]
        red[..., :3] = np.where(al > 0, red[..., :3] * 255.0 / np.maximum(al, 1), 0)
        red[..., 3] = np.where(red[..., 3] > 110, 255, 0)
        nat = Image.fromarray(np.clip(red, 0, 255).astype(np.uint8))
        info.update(modo="dibujo", calidad=round(float(min(qx, qy)), 2))
    if "croma" in info["fondo"]:
        nat = quitar_halo(nat, info["fondo"])
    nat = cuantizar(nat, colores)
    if "croma" in info["fondo"]:
        nat = unificar_contorno(nat)
    nat = limpiar(nat)
    nat = contorno_limpio(nat)
    nat = contorno(nat)
    nat = recortar(nat)
    return nat, info


# ---------------------------------------------------------------- vistas
def vista_rejilla(nat, ruta, boca=None, z=None):
    w, h = nat.size
    z = z or max(4, min(12, 900 // max(w, h)))
    margen = 40
    lienzo = Image.new("RGB", (w * z + margen * 2, h * z + margen * 2), (255, 255, 255))
    # tablero para ver la transparencia
    d = ImageDraw.Draw(lienzo)
    for y in range(h):
        for x in range(w):
            if (x + y) % 2:
                d.rectangle([margen + x * z, margen + y * z, margen + x * z + z - 1, margen + y * z + z - 1], fill=(236, 236, 236))
    grande = nat.resize((w * z, h * z), Image.Resampling.NEAREST)
    lienzo.paste(grande, (margen, margen), grande)
    f = fuente("mono", 14)
    for x in range(0, w + 1):
        col = (255, 60, 60) if x % 10 == 0 else ((150, 150, 150) if x % 5 == 0 else (215, 215, 215))
        d.line([margen + x * z, margen, margen + x * z, margen + h * z], fill=col, width=1)
        if x % 10 == 0:
            d.text((margen + x * z, 8), str(x), fill=(200, 0, 0), font=f, anchor="ma")
            d.text((margen + x * z, margen + h * z + 8), str(x), fill=(200, 0, 0), font=f, anchor="ma")
    for y in range(0, h + 1):
        col = (255, 60, 60) if y % 10 == 0 else ((150, 150, 150) if y % 5 == 0 else (215, 215, 215))
        d.line([margen, margen + y * z, margen + w * z, margen + y * z], fill=col, width=1)
        if y % 10 == 0:
            d.text((20, margen + y * z), str(y), fill=(200, 0, 0), font=f, anchor="mm")
            d.text((margen + w * z + 20, margen + y * z), str(y), fill=(200, 0, 0), font=f, anchor="mm")
    if boca:
        bx, by, bw = boca["x"], boca["y"], boca["ancho"]
        x0 = margen + (bx - bw // 2) * z; y0 = margen + by * z
        d.rectangle([x0 - 2, y0 - 2, x0 + bw * z + 2, y0 + z + 2], outline=(0, 160, 255), width=3)
    lienzo.save(ruta)


def hoja(carpeta):
    pj = cargar_json(os.path.join(carpeta, "personaje.json"))
    poses = list(pj["poses"].items())
    celdas = []
    for nombre, p in poses:
        nat = Image.open(os.path.join(carpeta, p["archivo"])).convert("RGBA")
        z = max(2, 300 // max(nat.size))
        img = nat.resize((nat.width * z, nat.height * z), Image.Resampling.NEAREST)
        if p.get("boca"):
            filas = [img]
            for v in ["A", "C", "D", "E"]:
                b = dibujar_boca(nat, p["boca"], v)
                filas.append(b.resize((b.width * z, b.height * z), Image.Resampling.NEAREST))
            celdas.append((nombre, filas, True))
        else:
            celdas.append((nombre, [img], False))
    ancho_celda = 340
    alto = sum(360 if not c[2] else 360 for c in celdas)
    cols = 1 + max(len(c[1]) for c in celdas)
    lienzo = Image.new("RGB", (ancho_celda * cols, max(400, 360 * len(celdas) + 20)), (245, 245, 245))
    d = ImageDraw.Draw(lienzo)
    f = fuente("bold", 22)
    for i, (nombre, imgs, con_boca) in enumerate(celdas):
        y = 10 + i * 360
        d.text((14, y + 10), nombre, fill=(20, 20, 20), font=f)
        d.text((14, y + 44), ("boca marcada" + (" (buscada)" if pj["poses"][nombre]["boca"].get("buscada") else "")) if con_boca else "boca sin marcar", fill=(0, 140, 60) if con_boca else (200, 60, 0), font=fuente("medium", 18))
        for j, img in enumerate(imgs):
            x = ancho_celda * (j + 1) + (ancho_celda - img.width) // 2
            lienzo.paste(img, (x, y + 330 - img.height), img)
    del alto
    lienzo.save(os.path.join(carpeta, "hoja.png"))
    return os.path.join(carpeta, "hoja.png")


# ---------------------------------------------------------------- bocas
def _color_piel(a, x, y, w):
    muestras = []
    for dx in (-(w // 2) - 2, (w - w // 2) + 1, -(w // 2) - 3, (w - w // 2) + 2):
        for dy in (-1, 0, 1):
            xx, yy = x + dx, y + dy
            if 0 <= yy < a.shape[0] and 0 <= xx < a.shape[1] and a[yy, xx, 3] > 0:
                muestras.append(a[yy, xx, :3])
    if not muestras:
        return np.array([230, 190, 160], np.uint8)
    return np.median(np.array(muestras), axis=0).astype(np.uint8)


def dibujar_boca(nat, boca, visema):
    """Pinta la boca `visema` (X reposo, A cerrada, B poco abierta, C media, D muy abierta,
    E redonda «o», F pequeña «u») sobre una copia del sprite nativo."""
    img = nat.copy()
    if visema == "X" or not boca:
        return img
    a = np.array(img)
    cx, cy, w = int(boca["x"]), int(boca["y"]), max(3, int(boca["ancho"]))
    piel = np.array(boca.get("piel") or _color_piel(a, cx, cy, w), np.uint8)
    oscuro = np.array(boca.get("labio") or [60, 24, 28], np.uint8)
    diente = np.array([246, 244, 240], np.uint8)
    lengua = np.array([214, 96, 104], np.uint8)
    x0 = cx - w // 2
    H, W = a.shape[:2]

    def pon(x, y, c):
        if 0 <= x < W and 0 <= y < H:
            a[y, x, :3] = c; a[y, x, 3] = 255

    # borra la boca original: píxeles distintos de la piel en la zona de la boca
    for yy in range(cy - 1, cy + 4):
        for xx in range(x0 - 3, x0 + w + 3):
            if 0 <= xx < W and 0 <= yy < H and a[yy, xx, 3] > 0:
                umbral = 22 if yy in (cy, cy + 1) else 60
                if np.abs(a[yy, xx, :3].astype(int) - piel.astype(int)).sum() > umbral:
                    # la fila de encima solo se limpia en la zona de la boca (bocas torcidas), no más arriba
                    if yy >= cy or (x0 - 2 <= xx <= x0 + w + 1 and a[yy, xx, :3].astype(int).sum() < piel.astype(int).sum() - 120):
                        a[yy, xx, :3] = piel
    if visema == "A":
        for x in range(x0, x0 + w):
            pon(x, cy, oscuro)
    elif visema == "B":
        for x in range(x0 + 1, x0 + w - 1):
            pon(x, cy, diente); pon(x, cy + 1, oscuro)
        pon(x0, cy, oscuro); pon(x0 + w - 1, cy, oscuro)
    elif visema in ("C", "D"):
        alto = 3 if visema == "C" else 4
        ww = w if visema == "C" else w + 2
        xa = cx - ww // 2
        for y in range(cy, cy + alto):
            for x in range(xa, xa + ww):
                esquina = (y in (cy, cy + alto - 1)) and x in (xa, xa + ww - 1)
                if esquina:
                    continue
                pon(x, y, oscuro)
        for x in range(xa + 1, xa + ww - 1):
            pon(x, cy, diente)
        if visema == "D":
            for x in range(cx - 1, cx + 1 + (ww % 2 == 0 and 0 or 1)):
                pon(x, cy + alto - 2, lengua)
    elif visema == "E":
        rojo = np.array([150, 52, 62], np.uint8)
        ww = 3 if w <= 5 else max(4, round(w * 0.45))
        hh = 3 if w <= 5 else max(4, round(w * 0.4))
        xa = cx - ww // 2
        for y in range(cy, cy + hh):
            for x in range(xa, xa + ww):
                borde_y = y in (cy, cy + hh - 1)
                borde_x = x in (xa, xa + ww - 1)
                if borde_y and borde_x:
                    continue
                pon(x, y, oscuro if (borde_x or borde_y) else rojo)
    elif visema == "F":
        pon(cx - 1, cy, oscuro); pon(cx, cy, oscuro); pon(cx - 1, cy + 1, oscuro); pon(cx, cy + 1, oscuro)
    return Image.fromarray(a)


# ---------------------------------------------------------------- comandos
def cmd_preparar(args):
    rutas = []
    for e in args.entrada:
        if os.path.isdir(e):
            rutas += sorted(p for p in glob.glob(os.path.join(e, "*")) if p.lower().endswith(EXT))
        elif os.path.isfile(e):
            rutas.append(e)
    if not rutas:
        raise SystemExit("No encuentro imágenes (.png, .jpg, .webp) en --entrada.")
    sal = args.salida
    os.makedirs(os.path.join(sal, "nativos"), exist_ok=True)
    os.makedirs(os.path.join(sal, "vistas"), exist_ok=True)
    ruta_json = os.path.join(sal, "personaje.json")
    pj = cargar_json(ruta_json) if os.path.exists(ruta_json) else {"version": 1, "poses": {}}
    nombres = [n.strip() for n in args.nombres.split(",")] if args.nombres else None
    if nombres and len(nombres) != len(rutas):
        raise SystemExit(f"Hay {len(rutas)} imágenes y {len(nombres)} nombres. Orden de las imágenes: "
                         + ", ".join(os.path.basename(r) for r in rutas))
    for k, r in enumerate(rutas):
        nombre = nombres[k] if nombres else os.path.splitext(os.path.basename(r))[0].lower().replace(" ", "_")
        nat, info = a_pixeles(r, args.modo, args.alto, args.colores, args.factor, not args.suave)
        nat.save(os.path.join(sal, "nativos", nombre + ".png"))
        vieja = pj["poses"].get(nombre, {})
        pj["poses"][nombre] = {"archivo": f"nativos/{nombre}.png", "ancho": nat.width, "alto": nat.height,
                               "boca": vieja.get("boca"), "origen": os.path.basename(r), **info}
        vista_rejilla(nat, os.path.join(sal, "vistas", nombre + ".png"), vieja.get("boca"))
        print(f"  {nombre}: {nat.width}×{nat.height} px · modo {info['modo']} · fondo {info['fondo']}"
              + (f" · bloque {info.get('bloque')}" if info.get("bloque") else ""))
    pj.setdefault("pose_inicial", next(iter(pj["poses"])))
    guardar_json(ruta_json, pj)
    print("Hoja:", hoja(sal))
    print("Siguiente paso: mira cada imagen de vistas/ y marca la boca con «sprite.py boca».")


def buscar_boca(ref_img, ref_boca, img):
    """Busca en `img` la misma cara que en `ref_img` (ojos + boca) y devuelve la boca equivalente."""
    a = np.array(ref_img).astype(np.int32)
    b = np.array(img).astype(np.int32)
    x, y = ref_boca["x"], ref_boca["y"]
    x0, x1, y0, y1 = max(0, x - 12), min(a.shape[1], x + 13), max(0, y - 16), min(a.shape[0], y + 4)
    parche = a[y0:y1, x0:x1]
    mascara = parche[..., 3] > 0
    if mascara.sum() < 30:
        return None, None
    ph, pw = parche.shape[:2]
    mejor = (1e18, None)
    for yy in range(0, b.shape[0] - ph + 1):
        for xx in range(0, b.shape[1] - pw + 1):
            v = b[yy:yy + ph, xx:xx + pw]
            dif = np.abs(v[..., :3] - parche[..., :3]).sum(axis=2)
            dif = np.where(v[..., 3] > 0, dif, 300)
            err = dif[mascara].mean()
            if err < mejor[0]:
                mejor = (err, (xx, yy))
    err, (xx, yy) = mejor
    nueva = {"x": x + (xx - x0), "y": y + (yy - y0), "ancho": ref_boca["ancho"], "buscada": True}
    return nueva, err


def ajustar_boca(nat, x, y, ancho):
    """Busca la raya de la boca más cercana a (x, y) y devuelve su centro, fila y ancho reales."""
    a = np.array(nat).astype(np.int32)
    H, W = a.shape[:2]
    lum = (a[..., 0] * 299 + a[..., 1] * 587 + a[..., 2] * 114) // 1000
    mejor = None
    for yy in range(max(0, y - 2), min(H, y + 3)):
        fila = lum[yy]
        x_a, x_b = max(0, x - 8), min(W, x + 9)
        ref = np.median([lum[yy, k] for k in (max(0, x - 9), min(W - 1, x + 9)) if a[yy, k, 3] > 0] or [200])
        oscuro = [(k, a[yy, k, 3] > 0 and fila[k] < ref - 35) for k in range(x_a, x_b)]
        k = 0
        while k < len(oscuro):
            if oscuro[k][1]:
                j = k
                while j < len(oscuro) and oscuro[j][1]:
                    j += 1
                ini, fin = oscuro[k][0], oscuro[j - 1][0]
                largo = fin - ini + 1
                if 2 <= largo <= 14:
                    cx = (ini + fin + 1) // 2
                    dist = abs(cx - x) + 2 * abs(yy - y)
                    if mejor is None or dist < mejor[0]:
                        mejor = (dist, cx, yy, largo)
                k = j
            else:
                k += 1
    if mejor and mejor[0] <= 8:
        return {"x": int(mejor[1]), "y": int(mejor[2]), "ancho": int(max(3, mejor[3]))}, True
    return {"x": x, "y": y, "ancho": ancho}, False


def raya_en_piel(img, x, y, ref_img, ref_boca, radio=10):
    """Busca, cerca de (x, y), una raya horizontal oscura con piel encima y debajo (la boca cerrada)."""
    a = np.array(img).astype(np.int32)
    r = np.array(ref_img).astype(np.int32)
    H, W = a.shape[:2]
    piel = r[ref_boca["y"] - 2, ref_boca["x"], :3]
    lum = (a[..., 0] * 299 + a[..., 1] * 587 + a[..., 2] * 114) // 1000
    def es_piel(yy, xx):
        return 0 <= yy < H and 0 <= xx < W and a[yy, xx, 3] > 0 and np.abs(a[yy, xx, :3] - piel).sum() < 90
    mejor = None
    for yy in range(max(1, y - radio), min(H - 1, y + radio)):
        xx = max(0, x - radio)
        while xx < min(W, x + radio):
            if a[yy, xx, 3] > 0 and lum[yy, xx] < 120:
                j = xx
                # la raya sigue mientras sea algo más oscura que la piel (los extremos suavizados cuentan)
                # y se perdona un hueco de 1 píxel
                while j < W and a[yy, j, 3] > 0 and (lum[yy, j] < 175 or (j + 1 < W and lum[yy, j + 1] < 140 and j > xx)):
                    j += 1
                largo = j - xx
                if 4 <= largo <= 14:
                    cx = (xx + j) // 2
                    piel_alrededor = sum(int(es_piel(yy - 2, k)) + int(es_piel(yy + 2, k)) for k in range(xx, j)) / (2 * largo)
                    if piel_alrededor > 0.7:
                        dist = abs(cx - x) + 1.5 * abs(yy - y) - 3 * piel_alrededor
                        if mejor is None or dist < mejor[0]:
                            mejor = (dist, {"x": int(cx), "y": int(yy), "ancho": int(largo)})
                xx = j + 1
            else:
                xx += 1
    return mejor[1] if mejor else None


def cmd_boca(args):
    ruta_json = os.path.join(args.personaje, "personaje.json")
    pj = cargar_json(ruta_json)
    if args.pose not in pj["poses"]:
        raise SystemExit(f"No hay ninguna pose «{args.pose}». Poses: {', '.join(pj['poses'])}")
    ref = Image.open(os.path.join(args.personaje, pj["poses"][args.pose]["archivo"])).convert("RGBA")
    if args.exacta:
        marcada = {"x": args.x, "y": args.y, "ancho": args.ancho}
    else:
        marcada, ok = ajustar_boca(ref, args.x, args.y, args.ancho)
        if ok and (marcada["x"], marcada["y"], marcada["ancho"]) != (args.x, args.y, args.ancho):
            print(f"  Ajustada a la raya de la boca: x={marcada['x']}, y={marcada['y']}, ancho={marcada['ancho']} (usa --exacta para no ajustar)")
        elif not ok:
            print("  No encuentro una raya de boca cerca: uso tus números tal cual.")
    marcadas = {args.pose: marcada}
    if not args.solo_esta:
        for nombre, p in pj["poses"].items():
            if nombre == args.pose or (p.get("boca") and not p["boca"].get("buscada") and not args.rehacer):
                continue
            img = Image.open(os.path.join(args.personaje, p["archivo"])).convert("RGBA")
            nueva, err = buscar_boca(ref, marcadas[args.pose], img)
            if nueva is None:
                print(f"  {nombre}: no he podido buscar la boca; márcala a mano.")
                continue
            if err > 60:
                # caras dibujadas por separado: busca la raya de la boca rodeada de piel cerca de donde debería estar
                encontrada = raya_en_piel(img, nueva["x"], nueva["y"], ref, marcadas[args.pose])
                if not encontrada:
                    print(f"  {nombre}: no encuentro la boca sola; márcala a mano con --pose {nombre} --solo-esta.")
                    continue
                encontrada["buscada"] = True
                marcadas[nombre] = encontrada
                continue
            aj, ok = ajustar_boca(img, nueva["x"], nueva["y"], nueva["ancho"])
            if ok and abs(aj["x"] - nueva["x"]) <= 2 and abs(aj["y"] - nueva["y"]) <= 1:
                nueva.update(aj)
            marcadas[nombre] = nueva
    for nombre, b in marcadas.items():
        p = pj["poses"][nombre]
        p["boca"] = b
        nat = Image.open(os.path.join(args.personaje, p["archivo"])).convert("RGBA")
        vista_rejilla(nat, os.path.join(args.personaje, "vistas", nombre + ".png"), b)
        tiras = [dibujar_boca(nat, b, v) for v in VISEMAS]
        x0, y0 = b["x"] - 10, b["y"] - 10
        recs = [t.crop((max(0, x0), max(0, y0), min(t.width, x0 + 20), min(t.height, y0 + 16))) for t in tiras]
        zz = 14
        prueba = Image.new("RGB", (len(recs) * (20 * zz + 10) + 10, 16 * zz + 50), (255, 255, 255))
        dd = ImageDraw.Draw(prueba)
        for i, (v, rc) in enumerate(zip(VISEMAS, recs)):
            g = rc.resize((rc.width * zz, rc.height * zz), Image.Resampling.NEAREST)
            prueba.paste(g, (10 + i * (20 * zz + 10), 40), g)
            dd.text((10 + i * (20 * zz + 10), 8), {"X": "reposo", "A": "cerrada", "B": "poco", "C": "media",
                                                   "D": "grande", "E": "o", "F": "u"}[v], fill=(0, 0, 0), font=fuente("bold", 22))
        prueba.save(os.path.join(args.personaje, "vistas", f"bocas_{nombre}.png"))
        extra = " (buscada sola: compruébala en hoja.png)" if b.get("buscada") else ""
        print(f"  {nombre}: boca en ({b['x']}, {b['y']}), ancho {b['ancho']}{extra}")
    guardar_json(ruta_json, pj)
    print("Hoja:", hoja(args.personaje))


def cortar_hoja(ruta, rejilla=None, esperadas=None):
    """Separa una hoja con varias poses. Devuelve una lista de imágenes RGBA en orden de lectura."""
    im, como = quitar_fondo(Image.open(ruta))
    a = np.array(im)
    op = a[..., 3] > 0
    H, W = op.shape
    trozos = []
    if not rejilla:
        try:
            from scipy import ndimage
            etiq, n = ndimage.label(ndimage.binary_dilation(op, iterations=3))
            cajas = ndimage.find_objects(etiq)
        except ImportError:
            cajas, n = [], 0
        grandes = []
        for k, sl in enumerate(cajas or []):
            area = (etiq[sl] == k + 1).sum()
            if area > H * W * 0.01:
                grandes.append([sl[1].start, sl[0].start, sl[1].stop, sl[0].stop])
        if grandes and (esperadas is None or len(grandes) == esperadas):
            # filas: agrupa por centro vertical
            grandes.sort(key=lambda c: (c[1] + c[3]) / 2)
            filas, act = [], [grandes[0]]
            for c in grandes[1:]:
                alto_m = np.mean([x[3] - x[1] for x in act])
                if (c[1] + c[3]) / 2 - np.mean([(x[1] + x[3]) / 2 for x in act]) > alto_m * 0.5:
                    filas.append(act); act = [c]
                else:
                    act.append(c)
            filas.append(act)
            for f in filas:
                for c in sorted(f, key=lambda c: c[0]):
                    trozos.append(c)
        else:
            if grandes:
                print(f"  Encuentro {len(grandes)} figuras y esperaba {esperadas}: corto por rejilla.")
            lado = int(round(math.sqrt(esperadas or 9)))
            rejilla = (lado, math.ceil((esperadas or 9) / lado))
    if rejilla:
        filas_, cols_ = rejilla
        for r in range(filas_):
            for c in range(cols_):
                trozos.append([c * W // cols_, r * H // filas_, (c + 1) * W // cols_, (r + 1) * H // filas_])
    salida = []
    for (x0, y0, x1, y1) in trozos:
        p = im.crop((x0, y0, x1, y1))
        bb = p.getbbox()
        if bb:
            salida.append(p.crop(bb))
    return salida, como


def cmd_cortar(args):
    nombres = [n.strip() for n in args.nombres.split(",")] if args.nombres else None
    rej = tuple(int(v) for v in args.rejilla.lower().split("x")) if args.rejilla else None
    poses, como = cortar_hoja(args.hoja, rej, len(nombres) if nombres else None)
    os.makedirs(args.salida, exist_ok=True)
    print(f"  Fondo: {como} · {len(poses)} poses")
    if nombres and len(nombres) != len(poses):
        print(f"  Aviso: hay {len(poses)} poses y {len(nombres)} nombres; las que sobren se llaman pose_N.")
    for i, p in enumerate(poses):
        nombre = nombres[i] if nombres and i < len(nombres) else f"pose_{i + 1}"
        from PIL.PngImagePlugin import PngInfo
        meta = PngInfo()
        meta.add_text("fondo", como)
        p.save(os.path.join(args.salida, nombre + ".png"), pnginfo=meta)
        print(f"  {nombre}: {p.width}×{p.height}")
    proy = os.path.dirname(os.path.abspath(args.salida))
    print(f"Siguiente: python3 scripts/sprite.py preparar --entrada {args.salida} --salida {os.path.join(proy, 'personaje')}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("preparar")
    p.add_argument("--entrada", nargs="+", required=True)
    p.add_argument("--salida", required=True)
    p.add_argument("--modo", default="auto", choices=["auto", "pixel", "dibujo"])
    p.add_argument("--alto", type=int, default=120, help="alto del sprite en píxeles en modo dibujo (90–160)")
    p.add_argument("--colores", type=int, default=32)
    p.add_argument("--factor", type=float, help="modo dibujo: reduce TODAS las imágenes por el mismo factor (p. ej. 3.6) en vez de "
                   "llevar cada una a --alto; úsalo con poses de una misma hoja para que tengan la misma escala")
    p.add_argument("--suave", action="store_true", help="modo dibujo: reducir mezclando colores (más suave, menos nítido)")
    p.add_argument("--nombres", help="nombre de cada pose, en el orden de las imágenes (alfabético si es una carpeta)")
    b = sub.add_parser("boca")
    b.add_argument("--personaje", required=True)
    b.add_argument("--pose", required=True, help="pose en la que has medido la boca; en las demás se busca sola")
    b.add_argument("--solo-esta", action="store_true", help="no buscar la boca en las demás poses")
    b.add_argument("--exacta", action="store_true", help="no ajustar los números a la raya de la boca")
    b.add_argument("--rehacer", action="store_true", help="vuelve a buscar también en poses ya marcadas a mano")
    b.add_argument("--x", type=int, required=True, help="centro de la boca (columna)")
    b.add_argument("--y", type=int, required=True, help="fila de la boca (la de la raya de la boca)")
    b.add_argument("--ancho", type=int, required=True, help="ancho de la boca en píxeles (4–8 normalmente)")
    c = sub.add_parser("cortar", help="separa una hoja con varias poses en una imagen por pose")
    c.add_argument("--hoja", required=True)
    c.add_argument("--salida", required=True)
    c.add_argument("--nombres", help="nombres de las poses en orden de lectura, separados por comas")
    c.add_argument("--rejilla", help="FILASxCOLUMNAS para cortar en partes iguales (p. ej. 3x3)")
    h = sub.add_parser("hoja")
    h.add_argument("--personaje", required=True)
    args = ap.parse_args()
    {"preparar": cmd_preparar, "boca": cmd_boca, "cortar": cmd_cortar, "hoja": lambda a: print(hoja(a.personaje))}[args.cmd](args)


if __name__ == "__main__":
    main()
