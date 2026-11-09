"""Utilidades comunes de mascota-pixel: rutas, fuentes, estilos, texto e iconos."""
import json, os, shutil, subprocess, sys, unicodedata
from functools import lru_cache
from PIL import Image, ImageDraw, ImageFont, ImageFilter

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FUENTES = os.path.join(RAIZ, "fuentes")

def _ffmpeg():
    ruta = shutil.which("ffmpeg")
    if ruta:
        return ruta
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        pass
    print("  ffmpeg no está instalado: instalo imageio-ffmpeg (una sola vez)…")
    subprocess.run([sys.executable, "-m", "pip", "install", "-q", "--break-system-packages", "imageio-ffmpeg"], capture_output=True)
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        sys.exit("No hay ffmpeg y no se ha podido instalar. Instálalo (apt install ffmpeg o pip install imageio-ffmpeg).")


FFMPEG = _ffmpeg()

PESOS = {"medium": "Poppins-Medium.ttf", "semibold": "Poppins-SemiBold.ttf",
         "bold": "Poppins-Bold.ttf", "extrabold": "Poppins-ExtraBold.ttf",
         "black": "Poppins-Black.ttf", "mono": "JetBrainsMono-Medium.woff",
         "monobold": "JetBrainsMono-Bold.woff", "pixel": "Jersey10-Regular.ttf", "pixelfino": "Jersey10-Regular.ttf"}


@lru_cache(maxsize=256)
def fuente(peso, tam):
    return ImageFont.truetype(os.path.join(FUENTES, PESOS[peso]), int(tam))


# ---------- estilos ----------
ESTILOS = {
    # fondo, fondo2 (alterna por paso), tarjeta, texto, acento, suave (gris de detalles),
    # rejilla (4 tonos de relleno, de claro a oscuro), vacia (celda vacía), ok (verde de checks)
    "claro": dict(fondo="#FAFAFA", fondo2="#F2F3F5", tarjeta="#FFFFFF", texto="#16181D",
                  acento="#1F6FEB", suave="#8A919C", linea="#E3E5E8",
                  rejilla=["#B7E4C0", "#6CCB7F", "#2DA44E", "#1A7F37"], vacia="#E7E9EC", ok="#1A7F37"),
    "arena": dict(fondo="#EBDDC6", fondo2="#E4D4BA", tarjeta="#FFFFFF", texto="#0E1B33",
                  acento="#FF7A1A", suave="#7C7466", linea="#D6C6AA",
                  rejilla=["#FFD9B8", "#FFB37A", "#FF7A1A", "#C85A00"], vacia="#DCCBAE", ok="#1E8A4C"),
    "noche": dict(fondo="#0F1420", fondo2="#141A28", tarjeta="#1C2333", texto="#F2F4F8",
                  acento="#7AA2FF", suave="#8C96AB", linea="#2A3346",
                  rejilla=["#22355E", "#2F4F95", "#4C74D9", "#7AA2FF"], vacia="#1A2131", ok="#3FBF7F"),
    "menta": dict(fondo="#E6F4EE", fondo2="#DCEFE6", tarjeta="#FFFFFF", texto="#10302A",
                  acento="#0E9F6E", suave="#6B8079", linea="#C9E3D8",
                  rejilla=["#BDE8D3", "#7FD1AA", "#2FB57E", "#0E7F55"], vacia="#D2E8DD", ok="#0E7F55"),
    "chicle": dict(fondo="#FFF0F5", fondo2="#FDE6EE", tarjeta="#FFFFFF", texto="#2A1530",
                   acento="#E5337A", suave="#8F7A88", linea="#F2D3DF",
                   rejilla=["#F9C6D9", "#F28DB2", "#E5337A", "#B11E59"], vacia="#F3DCE5", ok="#1E8A4C"),
}


def estilo(nombre_o_dict):
    if isinstance(nombre_o_dict, dict):
        base = dict(ESTILOS[nombre_o_dict.get("base", "claro")])
        base.update({k: v for k, v in nombre_o_dict.items() if k != "base"})
        return base
    if nombre_o_dict not in ESTILOS:
        sys.exit(f"Estilo «{nombre_o_dict}» no existe. Usa uno de: {', '.join(ESTILOS)} o un objeto con colores.")
    return dict(ESTILOS[nombre_o_dict])


def rgb(h, a=255):
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


def mezcla(c1, c2, t):
    a, b = rgb(c1) if isinstance(c1, str) else c1, rgb(c2) if isinstance(c2, str) else c2
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(4))


def es_oscuro(h):
    r, g, b, _ = rgb(h)
    return (0.299 * r + 0.587 * g + 0.114 * b) < 128


# ---------- texto ----------
def normaliza(p):
    p = unicodedata.normalize("NFD", p.lower())
    p = "".join(c for c in p if unicodedata.category(c) != "Mn")
    return "".join(c for c in p if c.isalnum())


def ancho_texto(txt, f):
    return f.getlength(txt)


def ajusta_tam(lineas, peso, tam_max, tam_min, ancho_max):
    t = tam_max
    while t > tam_min and max(ancho_texto(l, fuente(peso, t)) for l in lineas if l) > ancho_max:
        t -= 2
    return t


def parte_lineas(txt, f, ancho_max):
    palabras, lineas, act = txt.split(), [], ""
    for p in palabras:
        prueba = (act + " " + p).strip()
        if ancho_texto(prueba, f) <= ancho_max or not act:
            act = prueba
        else:
            lineas.append(act); act = p
    if act:
        lineas.append(act)
    return lineas


def cargar_json(ruta):
    with open(ruta, encoding="utf-8") as fh:
        return json.load(fh)


def guardar_json(ruta, datos):
    with open(ruta, "w", encoding="utf-8") as fh:
        json.dump(datos, fh, ensure_ascii=False, indent=2)


# ---------- sombras y cajas ----------
@lru_cache(maxsize=64)
def sombra(w, h, radio, desenfoque=18, alfa=38, dy=10):
    m = desenfoque * 2
    im = Image.new("RGBA", (w + 2 * m, h + 2 * m + dy), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([m, m + dy, m + w, m + h + dy], radio, fill=(0, 0, 0, alfa))
    return im.filter(ImageFilter.GaussianBlur(desenfoque)), m


# Aspecto de las cajas: "juego" (borde grueso y sombra dura, estilo panel de videojuego) o "suave"
PANEL = {"modo": "juego", "borde": "#16181D", "sombra": "#16181D", "grosor": 4, "desplaza": 8}


def configurar_panel(E, modo=None):
    PANEL["modo"] = modo or E.get("panel", "juego")
    PANEL["borde"] = E.get("borde", E["texto"] if not es_oscuro(E["fondo"]) else "#000000")
    PANEL["sombra"] = E.get("sombra", PANEL["borde"])


def poli_pixel(x0, y0, x1, y1, s):
    """Rectángulo con las esquinas en escalera de píxel (dos escalones de `s`)."""
    s = max(1, min(s, (x1 - x0) / 4, (y1 - y0) / 4))
    return [(x0, y0 + 2 * s), (x0 + s, y0 + 2 * s), (x0 + s, y0 + s), (x0 + 2 * s, y0 + s), (x0 + 2 * s, y0),
            (x1 - 2 * s, y0), (x1 - 2 * s, y0 + s), (x1 - s, y0 + s), (x1 - s, y0 + 2 * s), (x1, y0 + 2 * s),
            (x1, y1 - 2 * s), (x1 - s, y1 - 2 * s), (x1 - s, y1 - s), (x1 - 2 * s, y1 - s), (x1 - 2 * s, y1),
            (x0 + 2 * s, y1), (x0 + 2 * s, y1 - s), (x0 + s, y1 - s), (x0 + s, y1 - 2 * s), (x0, y1 - 2 * s)]


def rect_pixel(d, x0, y0, x1, y1, fill, borde=None, grosor=4, s=6, sombra=None, desplaza=8):
    """Panel de videojuego: esquinas en escalera, borde grueso y sombra dura opcional."""
    if sombra:
        d.polygon(poli_pixel(x0 + desplaza, y0 + desplaza, x1 + desplaza, y1 + desplaza, s), fill=sombra)
    if borde:
        d.polygon(poli_pixel(x0, y0, x1, y1, s), fill=borde)
        d.polygon(poli_pixel(x0 + grosor, y0 + grosor, x1 - grosor, y1 - grosor, max(1, s - grosor / 2)), fill=fill)
    else:
        d.polygon(poli_pixel(x0, y0, x1, y1, s), fill=fill)


def caja(lienzo, x, y, w, h, color, radio=22, borde=None, con_sombra=True):
    """Dibuja una tarjeta sobre `lienzo`. En modo «juego»: esquinas de píxel, borde grueso y sombra dura."""
    d = ImageDraw.Draw(lienzo)
    if PANEL["modo"] == "juego":
        g, o = PANEL["grosor"], PANEL["desplaza"]
        s = 8 if min(w, h) > 60 else 5
        rect_pixel(d, x, y, x + w, y + h, color, PANEL["borde"], g, s, PANEL["sombra"] if con_sombra else None, o)
        return
    if con_sombra:
        s, m = sombra(int(w), int(h), radio)
        lienzo.paste(s, (int(x - m), int(y - m)), s)
    d.rounded_rectangle([x, y, x + w, y + h], radio, fill=color, outline=borde, width=2 if borde else 0)


# ---------- iconos vectoriales simples (sin emojis ni logos) ----------
def icono(d, nombre, cx, cy, t, color, fondo=None):
    """Dibuja un icono de tamaño t centrado en (cx, cy). Nombres en ICONOS."""
    s = t / 100.0
    def P(x, y):
        return (cx + (x - 50) * s, cy + (y - 50) * s)
    w = max(2, int(7 * s))
    if nombre == "carpeta":
        d.rounded_rectangle([*P(8, 22), *P(44, 36)], int(5 * s), fill=color)
        d.rounded_rectangle([*P(8, 30), *P(92, 82)], int(7 * s), fill=color)
    elif nombre == "video":
        d.rounded_rectangle([*P(10, 20), *P(90, 80)], int(10 * s), fill=color)
        d.polygon([P(42, 36), P(42, 64), P(66, 50)], fill=fondo or "#FFFFFF")
    elif nombre == "audio":
        for i, h in enumerate([20, 40, 60, 34, 52, 26, 44]):
            x = 14 + i * 12
            d.rounded_rectangle([*P(x, 50 - h / 2), *P(x + 6, 50 + h / 2)], int(3 * s), fill=color)
    elif nombre == "micro":
        d.rounded_rectangle([*P(36, 10), *P(64, 58)], int(14 * s), fill=color)
        d.arc([*P(24, 30), *P(76, 72)], 0, 180, fill=color, width=w)
        d.line([P(50, 72), P(50, 88)], fill=color, width=w)
        d.line([P(34, 90), P(66, 90)], fill=color, width=w)
    elif nombre == "documento":
        d.rounded_rectangle([*P(22, 10), *P(78, 90)], int(8 * s), fill=color)
        for y in (34, 48, 62):
            d.line([P(34, y), P(66, y)], fill=fondo or "#FFFFFF", width=max(2, int(5 * s)))
    elif nombre == "imagen":
        d.rounded_rectangle([*P(10, 18), *P(90, 82)], int(10 * s), fill=color)
        d.polygon([P(20, 74), P(42, 46), P(58, 64), P(68, 54), P(82, 74)], fill=fondo or "#FFFFFF")
        d.ellipse([*P(62, 26), *P(76, 40)], fill=fondo or "#FFFFFF")
    elif nombre == "estrella":
        import math
        pts = []
        for i in range(10):
            r = 44 if i % 2 == 0 else 19
            a = -math.pi / 2 + i * math.pi / 5
            pts.append(P(50 + r * math.cos(a), 52 + r * math.sin(a)))
        d.polygon(pts, fill=color)
    elif nombre == "corazon":
        d.ellipse([*P(10, 14), *P(52, 56)], fill=color)
        d.ellipse([*P(48, 14), *P(90, 56)], fill=color)
        d.polygon([P(12, 42), P(88, 42), P(50, 88)], fill=color)
    elif nombre == "check":
        d.line([P(16, 52), P(40, 74), P(84, 28)], fill=color, width=max(3, int(12 * s)), joint="curve")
    elif nombre == "reloj":
        d.ellipse([*P(14, 18), *P(86, 90)], outline=color, width=w)
        d.line([P(50, 54), P(50, 32)], fill=color, width=w)
        d.line([P(50, 54), P(66, 62)], fill=color, width=w)
        d.line([P(42, 8), P(58, 8)], fill=color, width=w)
    elif nombre == "chat":
        d.rounded_rectangle([*P(8, 14), *P(92, 70)], int(16 * s), fill=color)
        d.polygon([P(26, 66), P(26, 90), P(48, 68)], fill=color)
    elif nombre == "codigo":
        d.line([P(36, 26), P(14, 50), P(36, 74)], fill=color, width=w, joint="curve")
        d.line([P(64, 26), P(86, 50), P(64, 74)], fill=color, width=w, joint="curve")
    elif nombre == "chispa":
        d.polygon([P(50, 6), P(60, 40), P(94, 50), P(60, 60), P(50, 94), P(40, 60), P(6, 50), P(40, 40)], fill=color)
    elif nombre == "musica":
        d.ellipse([*P(14, 62), *P(40, 86)], fill=color)
        d.ellipse([*P(58, 52), *P(84, 76)], fill=color)
        d.line([P(38, 74), P(38, 20)], fill=color, width=w)
        d.line([P(82, 64), P(82, 12)], fill=color, width=w)
        d.polygon([P(36, 16), P(84, 6), P(84, 24), P(36, 34)], fill=color)
    elif nombre == "rayo":
        d.polygon([P(58, 6), P(20, 56), P(46, 56), P(38, 94), P(80, 40), P(54, 40)], fill=color)
    elif nombre == "lupa":
        d.ellipse([*P(12, 12), *P(64, 64)], outline=color, width=w)
        d.line([P(58, 58), P(88, 88)], fill=color, width=int(w * 1.4))
    elif nombre == "personaje":
        d.ellipse([*P(30, 10), *P(70, 50)], fill=color)
        d.rounded_rectangle([*P(18, 54), *P(82, 96)], int(18 * s), fill=color)
    elif nombre == "tijeras":
        d.ellipse([*P(10, 58), *P(38, 86)], outline=color, width=w)
        d.ellipse([*P(62, 58), *P(90, 86)], outline=color, width=w)
        d.line([P(32, 62), P(76, 10)], fill=color, width=w)
        d.line([P(68, 62), P(24, 10)], fill=color, width=w)
    elif nombre == "globo":
        d.ellipse([*P(10, 10), *P(90, 90)], outline=color, width=w)
        d.ellipse([*P(32, 10), *P(68, 90)], outline=color, width=max(2, w // 2))
        d.line([P(10, 50), P(90, 50)], fill=color, width=max(2, w // 2))
    elif nombre == "movil":
        d.rounded_rectangle([*P(28, 6), *P(72, 94)], int(10 * s), fill=color)
        d.rounded_rectangle([*P(33, 14), *P(67, 80)], int(4 * s), fill=fondo or "#FFFFFF")
        d.ellipse([*P(46, 84), *P(54, 90)], fill=fondo or "#FFFFFF")
    elif nombre == "libro":
        d.polygon([P(8, 20), P(48, 28), P(48, 90), P(8, 82)], fill=color)
        d.polygon([P(52, 28), P(92, 20), P(92, 82), P(52, 90)], fill=color)
        for y in (40, 54, 68):
            d.line([P(16, y - 6), P(40, y)], fill=fondo or "#FFFFFF", width=max(2, int(4 * s)))
            d.line([P(60, y), P(84, y - 6)], fill=fondo or "#FFFFFF", width=max(2, int(4 * s)))
    elif nombre == "camara":
        d.rounded_rectangle([*P(8, 28), *P(92, 84)], int(12 * s), fill=color)
        d.rectangle([*P(34, 18), *P(62, 30)], fill=color)
        d.ellipse([*P(32, 38), *P(68, 74)], fill=fondo or "#FFFFFF")
        d.ellipse([*P(41, 47), *P(59, 65)], fill=color)
    elif nombre == "bombilla":
        d.ellipse([*P(22, 6), *P(78, 62)], fill=color)
        d.rectangle([*P(38, 56), *P(62, 76)], fill=color)
        d.rounded_rectangle([*P(36, 78), *P(64, 92)], int(4 * s), fill=color)
    elif nombre == "grafica":
        for i, h in enumerate([30, 52, 40, 76]):
            x = 12 + i * 20
            d.rounded_rectangle([*P(x, 90 - h), *P(x + 14, 90)], int(3 * s), fill=color)
    elif nombre == "dinero":
        d.ellipse([*P(10, 10), *P(90, 90)], fill=color)
        d.text(P(50, 52), "€", fill=fondo or "#FFFFFF", font=fuente("black", int(58 * s)), anchor="mm")
    elif nombre == "casa":
        d.polygon([P(50, 8), P(92, 46), P(8, 46)], fill=color)
        d.rectangle([*P(18, 44), *P(82, 90)], fill=color)
        d.rectangle([*P(42, 60), *P(58, 90)], fill=fondo or "#FFFFFF")
    elif nombre == "comida":
        d.ellipse([*P(8, 30), *P(92, 92)], fill=color)
        d.rectangle([*P(8, 30), *P(92, 60)], fill=fondo or "#FFFFFF")
        d.line([P(8, 60), P(92, 60)], fill=color, width=w)
    elif nombre == "silencio":
        d.polygon([P(8, 38), P(26, 38), P(48, 18), P(48, 82), P(26, 62), P(8, 62)], fill=color)
        d.line([P(62, 34), P(90, 66)], fill=color, width=w)
        d.line([P(90, 34), P(62, 66)], fill=color, width=w)
    elif nombre == "cruz":
        d.line([P(20, 20), P(80, 80)], fill=color, width=max(3, int(12 * s)))
        d.line([P(80, 20), P(20, 80)], fill=color, width=max(3, int(12 * s)))
    elif nombre == "altavoz":
        d.polygon([P(8, 38), P(26, 38), P(48, 18), P(48, 82), P(26, 62), P(8, 62)], fill=color)
        d.arc([*P(46, 30), *P(74, 70)], -60, 60, fill=color, width=w)
        d.arc([*P(50, 16), *P(92, 84)], -60, 60, fill=color, width=w)
    else:  # punto
        d.ellipse([*P(25, 25), *P(75, 75)], fill=color)


ICONOS = ["carpeta", "video", "audio", "micro", "documento", "imagen", "estrella", "corazon", "check",
          "reloj", "chat", "codigo", "chispa", "musica", "rayo", "lupa", "personaje", "tijeras", "globo",
          "movil", "libro", "camara", "bombilla", "grafica", "dinero", "casa", "comida", "silencio", "cruz", "altavoz"]
