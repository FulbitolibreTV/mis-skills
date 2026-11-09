#!/usr/bin/env python3
"""Motor de historia-papel: escenas de papel recortado animadas con código (skia-python + ffmpeg).

No se usa a mano: plan.py convierte historia.json en un plan y render.py lo renderiza.
Las piezas (objetos de papel) están aquí abajo, cada una con @pieza("nombre"); el catálogo
con sus opciones está en referencias/piezas.md. Para un objeto nuevo, añade una función igual.
"""
import argparse, json, math, os, subprocess, sys
import skia

AQUI = os.path.dirname(os.path.abspath(__file__))
FUENTES = os.path.join(os.path.dirname(AQUI), "fuentes")
CARPETA_IMAGENES = os.getcwd()   # plan.py la cambia a la carpeta del proyecto
W, H = 1080, 1920

# ---------------------------------------------------------------- colores
PALETA = {
    "noche": "#14203B", "noche2": "#1C2B4C", "noche3": "#26385E", "tinta": "#0E1B33",
    "crema": "#EFE4CC", "crema2": "#E2D4B5", "beige": "#E6DCC3", "beige2": "#CFC2A3",
    "ocre": "#D9A441", "puerta": "#D48A3C", "puerta2": "#B86F2A", "madera": "#6B4A35",
    "teal": "#4E8C9A", "celeste": "#A9CFE0", "gris": "#9AA3AE", "gris2": "#6E7886",
    "piel": "#EDBE93", "piel2": "#CF9670", "manga": "#7C8798", "manga2": "#98A2B2",
    "verde": "#7FD69A", "pantalla": "#12241E", "rojo": "#D8573C", "naranja": "#FF7A1A",
    "blanco": "#FFFFFF", "morado": "#2A2F52", "morado2": "#33395F", "cafe": "#5A3A22",
    "amarillo": "#F2C14E",
}


def col(c, a=1.0):
    if isinstance(c, str):
        c = PALETA.get(c, c)
        c = c.lstrip("#")
        r, g, b = int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16)
    else:
        r, g, b = c[:3]
    return skia.Color4f(r / 255, g / 255, b / 255, a)


_FUENTES = {}


def fuente(peso="Bold", tam=40):
    k = (peso, tam)
    if k not in _FUENTES:
        ruta = os.path.join(FUENTES, f"Poppins-{peso}.ttf")
        if not os.path.exists(ruta):
            sys.exit(f"Falta la fuente {ruta}: vuelve a copiar la skill entera.")
        _FUENTES[k] = skia.Font(skia.Typeface.MakeFromFile(ruta), tam)
    return _FUENTES[k]


_IMGS = {}


def imagen(nombre):
    if nombre not in _IMGS:
        ruta = nombre if os.path.isabs(nombre) else os.path.join(CARPETA_IMAGENES, nombre)
        if not os.path.exists(ruta):
            sys.exit(f"No encuentro la imagen {ruta} (pieza «imagen»). Ponla en la carpeta del proyecto.")
        _IMGS[nombre] = skia.Image.open(ruta)
    return _IMGS[nombre]


def _textura(tam, grueso, fuerza, semilla):
    """Grano de papel hecho con números (no hace falta ningún archivo)."""
    import numpy as np
    rng = np.random.default_rng(semilla)
    n = rng.standard_normal((tam // grueso, tam // grueso)).astype(np.float32)
    if grueso > 1:
        n = np.kron(n, np.ones((grueso, grueso), np.float32))
        k = np.ones(grueso * 2 + 1, np.float32) / (grueso * 2 + 1)
        n = np.apply_along_axis(lambda f: np.convolve(np.concatenate([f[-grueso:], f, f[:grueso]]), k, "valid"), 0, n)
        n = np.apply_along_axis(lambda f: np.convolve(np.concatenate([f[-grueso:], f, f[:grueso]]), k, "valid"), 1, n)
        n /= n.std() + 1e-6
    a = np.clip(np.abs(n) * fuerza, 0, 1)
    rgba = np.zeros((tam, tam, 4), np.uint8)
    blanco = n > 0
    for c in range(3):
        rgba[..., c] = np.where(blanco, 255, 0) * a
    rgba[..., 3] = (a * 255).astype(np.uint8)
    return skia.Image.fromarray(rgba, colorType=skia.ColorType.kRGBA_8888_ColorType, alphaType=skia.AlphaType.kPremul_AlphaType)


# ---------------------------------------------------------------- curvas
def suave(u):  # ease in-out cúbica
    u = max(0.0, min(1.0, u))
    return 4 * u ** 3 if u < 0.5 else 1 - (-2 * u + 2) ** 3 / 2


def sale(u):  # ease out cúbica
    u = max(0.0, min(1.0, u))
    return 1 - (1 - u) ** 3


def rebote(u):  # ease out back
    u = max(0.0, min(1.0, u))
    c1, c3 = 1.6, 2.6
    return 1 + c3 * (u - 1) ** 3 + c1 * (u - 1) ** 2


CURVAS = {"suave": suave, "sale": sale, "rebote": rebote, "lineal": lambda u: max(0, min(1, u))}


# ---------------------------------------------------------------- pintura de papel
class Ctx:
    """Lo que una pieza necesita para dibujarse en un fotograma."""

    def __init__(self, t, hervor, t_abs=None):
        self.t = t          # tiempo dentro de la escena
        self.hervor = hervor  # paso del «temblor» a 12 fps (cambia la semilla)
        self.t_abs = t if t_abs is None else t_abs  # tiempo del vídeo (para la boca)


BOCA = []      # envolvente de la voz, 30 valores por segundo (la rellena cargar)


def boca_en(t):
    if not BOCA:
        return 0.3
    i = int(t * 30)
    return BOCA[i] if 0 <= i < len(BOCA) else 0.0


def pp(c, a=1.0, borde=True, ctx=None, semilla=0, estilo="relleno", grosor=0):
    """Paint de papel: color plano y, si borde, filo de recorte irregular que «hierve»."""
    p = skia.Paint(AntiAlias=True, Color4f=col(c, a))
    if estilo == "linea":
        p.setStyle(skia.Paint.kStroke_Style)
        p.setStrokeWidth(grosor or 3)
        p.setStrokeCap(skia.Paint.kRound_Cap)
        p.setStrokeJoin(skia.Paint.kRound_Join)
    if borde and ctx is not None:
        p.setPathEffect(skia.DiscretePathEffect.Make(9, 0.9, (ctx.hervor * 7 + semilla) % 9973))
    return p


def rr(cv, x, y, w, h, r, paint):
    cv.drawRoundRect(skia.Rect.MakeXYWH(x, y, w, h), r, r, paint)


def circ(cv, x, y, r, paint):
    cv.drawCircle(x, y, r, paint)


def poli(cv, pts, paint):
    path = skia.Path()
    path.moveTo(*pts[0])
    for q in pts[1:]:
        path.lineTo(*q)
    path.close()
    cv.drawPath(path, paint)


def texto(cv, s, x, y, tam=40, peso="Bold", c="tinta", centro=True, a=1.0, trazo=None, grosor=0):
    f = fuente(peso, tam)
    ancho = f.measureText(s)
    x0 = x - ancho / 2 if centro else x
    if trazo:
        tp = skia.Paint(AntiAlias=True, Color4f=col(trazo, a))
        tp.setStyle(skia.Paint.kStroke_Style)
        tp.setStrokeWidth(grosor)
        tp.setStrokeJoin(skia.Paint.kRound_Join)
        cv.drawString(s, x0, y, f, tp)
    cv.drawString(s, x0, y, f, skia.Paint(AntiAlias=True, Color4f=col(c, a)))
    return ancho


def sombra_capa(cv, caja=None, fuerza=1.0, dx=5, dy=8, blur=5):
    """Abre una capa con sombra corta de papel; cerrar con cv.restore().
    caja = (x, y, w, h) local que contiene lo que se dibuja (la capa se limita a ella: mucho más rápido)."""
    f = skia.ImageFilters.DropShadow(dx * fuerza, dy * fuerza, blur, blur, col("#000000", 0.38 * fuerza).toColor())
    r = None
    if caja:
        m = 4 * blur + 12 * fuerza + 6
        r = skia.Rect.MakeXYWH(caja[0] - m, caja[1] - m, caja[2] + 2 * m, caja[3] + 2 * m)
    cv.saveLayer(r, skia.Paint(ImageFilter=f))


# ---------------------------------------------------------------- piezas
PIEZAS = {}


def pieza(nombre):
    def reg(fn):
        PIEZAS[nombre] = fn
        return fn
    return reg


@pieza("rect")
def p_rect(cv, P, ctx):
    w, h = P.get("w", 200), P.get("h", 200)
    rr(cv, -w / 2, -h / 2, w, h, P.get("r", 6), pp(P.get("color", "crema"), ctx=ctx, semilla=P.get("semilla", 1), borde=P.get("filo", True)))


@pieza("circulo")
def p_circulo(cv, P, ctx):
    circ(cv, 0, 0, P.get("r", 60), pp(P.get("color", "crema"), ctx=ctx, semilla=3))


@pieza("pared")
def p_pared(cv, P, ctx):
    """Pared con papel pintado de rayas, zócalo y suelo de tablas. Origen arriba a la izquierda."""
    w, h = P.get("w", 3000), P.get("h", 1920)
    zoc = P.get("zocalo", 1180)
    cv.drawRect(skia.Rect.MakeXYWH(0, 0, w, zoc), skia.Paint(Color4f=col(P.get("color", "morado"))))
    raya = skia.Paint(Color4f=col(P.get("raya", "morado2")))
    for x in range(0, int(w), 90):
        cv.drawRect(skia.Rect.MakeXYWH(x, 0, 34, zoc), raya)
    cv.drawRect(skia.Rect.MakeXYWH(0, zoc - 150, w, 150), pp("madera", ctx=ctx, semilla=5))
    cv.drawRect(skia.Rect.MakeXYWH(0, zoc - 150, w, 16), pp("#7E5A42", ctx=ctx, semilla=6))
    cv.drawRect(skia.Rect.MakeXYWH(0, zoc, w, h - zoc), skia.Paint(Color4f=col(P.get("suelo", "#2E2A3A"))))
    tabla = pp("#3A3546", estilo="linea", grosor=3, borde=False)
    for y in range(zoc + 60, int(h), 110):
        cv.drawLine(0, y, w, y, tabla)
    if P.get("alfombra", True):
        y0 = zoc + 210
        cv.drawRect(skia.Rect.MakeXYWH(0, y0, w, 130), pp("teal", ctx=ctx, semilla=8))
        for x in range(40, int(w), 150):
            poli(cv, [(x, y0 + 65), (x + 40, y0 + 25), (x + 80, y0 + 65), (x + 40, y0 + 105)], pp("ocre", ctx=ctx, semilla=x))


@pieza("mesa")
def p_mesa(cv, P, ctx):
    """Tablero de escritorio visto desde arriba (origen arriba a la izquierda)."""
    w, h = P.get("w", 1300), P.get("h", 2200)
    cv.drawRect(skia.Rect.MakeXYWH(0, 0, w, h), skia.Paint(Color4f=col(P.get("color", "noche2"))))
    veta = pp(P.get("veta", "noche3"), estilo="linea", grosor=2, borde=False)
    for i, y in enumerate(range(30, int(h), 70)):
        path = skia.Path()
        path.moveTo(0, y)
        for x in range(0, int(w) + 100, 100):
            path.lineTo(x, y + 6 * math.sin(x / 140 + i))
        cv.drawPath(path, veta)


@pieza("pared_lisa")
def p_pared_lisa(cv, P, ctx):
    w, h = P.get("w", 1300), P.get("h", 900)
    cv.drawRect(skia.Rect.MakeXYWH(0, 0, w, h), skia.Paint(Color4f=col(P.get("color", "noche"))))
    pun = skia.Paint(AntiAlias=True, Color4f=col(P.get("punto", "noche3")))
    for y in range(40, int(h), 46):
        for x in range(20 + (y // 46 % 2) * 23, int(w), 46):
            cv.drawCircle(x, y, 4, pun)
    cv.drawRect(skia.Rect.MakeXYWH(0, h - 24, w, 24), pp("noche3", ctx=ctx, semilla=2))


@pieza("lampara")
def p_lampara(cv, P, ctx):
    """Lámpara de techo/pared con cono de luz hacia abajo."""
    largo = P.get("cono", 700)
    a = P.get("luz", 0.22)
    if P.get("parpadeo"):
        # bombilla que falla de vez en cuando (da vida a la zona sin distraer)
        k = int(ctx.t * 10)
        if (k * 2654435761 + int(P.get("semilla", 0))) % 7 == 0:
            a *= 0.35
    sh = skia.GradientShader.MakeLinear([(0, 0), (0, largo)], [col("#FFE7A8", a).toColor(), col("#FFE7A8", 0).toColor()])
    cono = skia.Paint(AntiAlias=True, Shader=sh)
    poli(cv, [(-40, 30), (40, 30), (P.get("ancho", 260), largo), (-P.get("ancho", 260), largo)], cono)
    sombra_capa(cv, (-60,-5,120,50), 0.6)
    poli(cv, [(-28, 0), (28, 0), (52, 38), (-52, 38)], pp("ocre", ctx=ctx, semilla=4))
    cv.restore()
    circ(cv, 0, 40, 12, skia.Paint(AntiAlias=True, Color4f=col("#FFF3C4")))


@pieza("monitor")
def p_monitor(cv, P, ctx):
    """Monitor retro de tubo. Origen en el centro de la pantalla."""
    s = P.get("tam", 1.0)
    cv.save(); cv.scale(s, s)
    sombra_capa(cv, (-280,-240,560,570))
    rr(cv, -60, 230, 120, 60, 6, pp("beige2", ctx=ctx, semilla=11))
    rr(cv, -170, 280, 340, 40, 10, pp("beige", ctx=ctx, semilla=12))
    rr(cv, -270, -230, 540, 470, 34, pp("beige", ctx=ctx, semilla=13))
    rr(cv, -240, -200, 480, 380, 26, pp("beige2", ctx=ctx, semilla=14))
    cv.restore()
    rr(cv, -215, -178, 430, 330, 30, pp("pantalla", ctx=ctx, semilla=15))
    # brillo del cristal
    sh = skia.GradientShader.MakeRadial((0, -20), 260, [col("#2D5A46", 0.55).toColor(), col("#2D5A46", 0).toColor()])
    rr(cv, -215, -178, 430, 330, 30, skia.Paint(AntiAlias=True, Shader=sh))
    # líneas de texto que se escriben
    lineas = P.get("lineas", 7)
    vel = P.get("escribe", 1.5)  # líneas por segundo
    hechas = ctx.t * vel
    for i in range(lineas):
        frac = max(0.0, min(1.0, hechas - i))
        if frac <= 0:
            break
        ancho = [300, 220, 340, 180, 260, 310, 200, 240][i % 8] * frac
        rr(cv, -180, -140 + i * 38, ancho, 14, 7, skia.Paint(AntiAlias=True, Color4f=col(P.get("tinta", "verde"), 0.9)))
    if P.get("texto"):
        s_ = P["texto"]
        if P.get("texto_t0") is not None:
            n_ = max(0, int((ctx.t - P["texto_t0"]) * P.get("texto_vel", 10)))
            s_ = s_[:n_] + ("_" if int(ctx.t * 3) % 2 or n_ < len(s_) else " ")
        texto(cv, s_, 0, 70, tam=P.get("tam_texto", 64), peso="Black", c=P.get("tinta", "verde"))
    # botones
    for i in range(3):
        circ(cv, 150 + i * 30, 205, 8, pp("gris2", ctx=ctx, semilla=20 + i))
    cv.restore()


@pieza("teclado")
def p_teclado(cv, P, ctx):
    """Teclado visto desde arriba. Origen en el centro."""
    w, h = P.get("w", 640), P.get("h", 220)
    sombra_capa(cv, (-w/2,-h/2,w,h))
    rr(cv, -w / 2, -h / 2, w, h, 18, pp("beige", ctx=ctx, semilla=30))
    cv.restore()
    cols, filas = 15, 5
    kw, kh = (w - 50) / cols, (h - 40) / filas
    pulsada = (ctx.hervor * 37) % (cols * filas) if P.get("activo", True) else -1
    for f in range(filas):
        for cidx in range(cols):
            i = f * cols + cidx
            color = "beige2" if i == pulsada or i == (pulsada * 7) % (cols * filas) else "#F4EEDF"
            rr(cv, -w / 2 + 25 + cidx * kw + 2, -h / 2 + 20 + f * kh + 2, kw - 5, kh - 6, 5, skia.Paint(AntiAlias=True, Color4f=col(color)))


@pieza("telefono")
def p_telefono(cv, P, ctx):
    """Teléfono de disco visto desde arriba."""
    s = P.get("tam", 1.0)
    cv.scale(s, s)
    sombra_capa(cv, (-200,-170,400,300))
    poli(cv, [(-120, 90), (120, 90), (95, -60), (-95, -60)], pp(P.get("color", "#8FB0B8"), ctx=ctx, semilla=40))
    rr(cv, -150, -120, 300, 70, 35, pp(P.get("color2", "#7A9BA4"), ctx=ctx, semilla=41))
    circ(cv, -120, -85, 42, pp(P.get("color2", "#7A9BA4"), ctx=ctx, semilla=42))
    circ(cv, 120, -85, 42, pp(P.get("color2", "#7A9BA4"), ctx=ctx, semilla=43))
    cv.restore()
    circ(cv, 0, 22, 62, pp("crema", ctx=ctx, semilla=44))
    gira = P.get("gira", 0) * ctx.t * 90
    for i in range(10):
        ang = math.radians(-60 + i * 28 + gira)
        circ(cv, math.cos(ang) * 42, 22 + math.sin(ang) * 42, 9, skia.Paint(AntiAlias=True, Color4f=col("gris2")))
    circ(cv, 0, 22, 18, pp("#7A9BA4", ctx=ctx, semilla=45))


@pieza("taza")
def p_taza(cv, P, ctx):
    sombra_capa(cv, (-60,-60,155,120))
    rr(cv, 40, -16, 46, 32, 14, pp("crema2", ctx=ctx, semilla=50, estilo="linea", grosor=12))
    circ(cv, 0, 0, 52, pp("crema", ctx=ctx, semilla=51))
    cv.restore()
    circ(cv, 0, 0, 40, pp("cafe", ctx=ctx, semilla=52))
    circ(cv, -10, -10, 10, skia.Paint(AntiAlias=True, Color4f=col("#7A5236", 0.8)))


@pieza("disquete")
def p_disquete(cv, P, ctx):
    sombra_capa(cv, (-60,-60,120,120))
    rr(cv, -55, -55, 110, 110, 6, pp(P.get("color", "#2B3550"), ctx=ctx, semilla=60))
    cv.restore()
    rr(cv, -30, -55, 60, 38, 3, pp("gris", ctx=ctx, semilla=61))
    rr(cv, -38, 6, 76, 42, 3, pp("crema", ctx=ctx, semilla=62))


@pieza("etiqueta")
def p_etiqueta(cv, P, ctx):
    """Etiqueta de papel con texto y chincheta."""
    s = P.get("texto", "")
    tam = P.get("tam", 44)
    ancho = fuente("Bold", tam).measureText(s) + tam * 1.1
    alto = tam * 1.55
    sombra_capa(cv, (-ancho/2,-alto/2-12,ancho,alto+12), 0.8)
    rr(cv, -ancho / 2, -alto / 2, ancho, alto, 6, pp(P.get("fondo", "crema"), ctx=ctx, semilla=70))
    cv.restore()
    texto(cv, s, 0, tam * 0.36, tam=tam, peso="Bold", c=P.get("color", "tinta"))
    if P.get("chincheta", True):
        circ(cv, 0, -alto / 2 + 4, 9, pp("rojo", ctx=ctx, semilla=71))


@pieza("contador")
def p_contador(cv, P, ctx):
    """Número grande con contorno que rueda de 'de' a 'a' entre t0 y t1."""
    de, a = P.get("de", 0), P.get("a", 100)
    t0, t1 = P.get("t0", 0), P.get("t1", 1)
    u = sale((ctx.t - t0) / max(0.01, t1 - t0))
    v = int(round(de + (a - de) * u))
    s = f"{v:,}".replace(",", ".") + P.get("sufijo", "")
    tam = P.get("tam", 200)
    f = fuente("Black", tam)
    ancho = f.measureText(s)
    sombra_capa(cv, (-ancho/2-40,-tam*0.9,ancho+80,tam*1.5), 1.2, dx=8, dy=12, blur=4)
    texto(cv, s, 0, tam * 0.35, tam=tam, peso="Black", c=P.get("color", "amarillo"), trazo="tinta", grosor=tam * 0.12)
    cv.restore()


@pieza("puerta")
def p_puerta(cv, P, ctx):
    """Puerta con marco. Origen en el centro del suelo de la puerta. P['abre'] 0..1."""
    w, h = 300, 520
    abre = max(0.0, min(1.0, P.get("abre", 0)))
    sombra_capa(cv, (-w/2-30,-h-30,w+60,h+30), 0.8)
    rr(cv, -w / 2 - 26, -h - 26, w + 52, h + 26, 4, pp("puerta2", ctx=ctx, semilla=80))
    cv.restore()
    # interior
    interior = P.get("interior", "noche")
    rr(cv, -w / 2, -h, w, h, 2, pp(interior, ctx=ctx, semilla=81))
    if abre > 0.02:
        dentro = P.get("dentro", "pantallas")
        cv.save()
        cv.clipRect(skia.Rect.MakeXYWH(-w / 2, -h, w, h))
        if dentro == "pantallas":
            for i in range(3):
                rr(cv, -110 + (i % 2) * 110, -430 + i * 120, 120, 80, 8, pp("beige", ctx=ctx, semilla=82 + i))
                rr(cv, -100 + (i % 2) * 110, -420 + i * 120, 100, 56, 6, pp("pantalla", ctx=ctx, semilla=85 + i))
                for k in range(3):
                    rr(cv, -92 + (i % 2) * 110, -410 + i * 120 + k * 15, 60 - k * 12, 6, 3, skia.Paint(AntiAlias=True, Color4f=col("verde", 0.9)))
        elif dentro == "atomo":
            cv.save(); cv.translate(0, -h / 2)
            orb = pp("amarillo", estilo="linea", grosor=8, ctx=ctx, semilla=90)
            for k in range(3):
                cv.save(); cv.rotate(k * 60 + ctx.t * 20)
                cv.drawOval(skia.Rect.MakeXYWH(-120, -45, 240, 90), orb)
                cv.restore()
            circ(cv, 0, 0, 22, pp("rojo", ctx=ctx, semilla=91))
            cv.restore()
        elif dentro == "estrellas":
            for i in range(14):
                circ(cv, -120 + (i * 53) % 240, -480 + (i * 97) % 440, 4 + (i % 3), skia.Paint(AntiAlias=True, Color4f=col("#FFF3C4", 0.9)))
        cv.restore()
    # hoja de la puerta (se abre hacia la izquierda: se estrecha desde la bisagra)
    hoja_w = w * (1 - 0.82 * suave(abre))
    sombra_capa(cv, (-w/2,-h,w,h), 0.9)
    rr(cv, -w / 2, -h, hoja_w, h, 3, pp(P.get("color", "puerta"), ctx=ctx, semilla=92))
    cv.restore()
    k = hoja_w / w
    if k > 0.25:
        panel = pp("puerta2", estilo="linea", grosor=6, ctx=ctx, semilla=93)
        rr(cv, -w / 2 + 40 * k, -h + 50, (w - 80) * k, 190, 6, panel)
        rr(cv, -w / 2 + 40 * k, -h + 280, (w - 80) * k, 190, 6, panel)
        circ(cv, -w / 2 + hoja_w - 34 * k, -h / 2 + 10, 14, pp("ocre", ctx=ctx, semilla=94))


@pieza("brazo")
def p_brazo(cv, P, ctx):
    """Brazo de papel desde abajo con mano. Origen en la muñeca; el brazo baja 'largo' px.
    Poses: abierta, teclea_a, teclea_b, puno, llave, senala, sujeta."""
    largo = P.get("largo", 900)
    if P.get("lado", "der") == "izq":
        cv.scale(-1, 1)
    manga = P.get("manga", "manga")
    sombra_capa(cv, (-80,20,160,largo))
    # manga que se ensancha hacia abajo
    poli(cv, [(-52, 30), (52, 30), (74, largo), (-74, largo)], pp(manga, ctx=ctx, semilla=100))
    pliegue = pp(P.get("manga2", "manga2"), estilo="linea", grosor=4, ctx=ctx, semilla=101)
    for k in range(3):
        y = 160 + k * 230
        cv.drawLine(-40, y, 30, y + 40, pliegue)
    cv.restore()
    rr(cv, -58, 10, 116, 44, 8, pp(P.get("puno_color", "crema"), ctx=ctx, semilla=102))
    pose = P.get("pose", "abierta")
    if ctx.hervor % 2 and pose in ("teclea_a", "teclea_b") and P.get("alterna", True):
        pose = "teclea_b" if pose == "teclea_a" else "teclea_a"
    mano(cv, pose, ctx)


def mano(cv, pose, ctx):
    piel = pp("piel", ctx=ctx, semilla=110)
    linea = pp("piel2", estilo="linea", grosor=3, borde=False)
    sombra_capa(cv, (-75,-200,150,240), 0.7)
    if pose in ("abierta", "teclea_a", "teclea_b", "sujeta"):
        if pose == "teclea_a":
            largos = [70, 92, 66, 70]
        elif pose == "teclea_b":
            largos = [86, 70, 90, 56]
        else:
            largos = [80, 96, 92, 72]
        abre = 8 if pose == "abierta" else 2
        xs = [-38, -13, 12, 37]
        for i, (x, L) in enumerate(zip(xs, largos)):
            cv.save(); cv.translate(x, -50); cv.rotate((i - 1.5) * abre)
            rr(cv, -12, -L, 24, L + 20, 12, piel)
            cv.restore()
        rr(cv, -55, -62, 110, 82, 26, piel)
        cv.save(); cv.translate(-52, -18); cv.rotate(-40 if pose != "sujeta" else -10)
        rr(cv, -13, -62, 26, 72, 13, piel)
        cv.restore()
    elif pose in ("puno", "llave"):
        rr(cv, -52, -78, 104, 98, 28, piel)
        for i in range(4):
            rr(cv, -48 + i * 25, -92, 22, 34, 11, piel)
        if pose == "llave":
            cv.restore()
            llave(cv, ctx)
            sombra_capa(cv, (-60,-70,60,60), 0.7)
            rr(cv, -54, -60, 50, 40, 18, piel)  # pulgar encima de la llave
    elif pose == "senala":
        rr(cv, -52, -70, 104, 90, 28, piel)
        rr(cv, -14, -190, 28, 140, 14, piel)
        for i in range(3):
            rr(cv, 12 + i * 2, -82 + i * 4, 22, 30, 11, piel)
        cv.save(); cv.translate(-50, -30); cv.rotate(-30)
        rr(cv, -13, -50, 26, 60, 13, piel)
        cv.restore()
    cv.restore()
    if pose in ("abierta", "teclea_a", "teclea_b", "sujeta"):
        for x in (-25, 0, 25):
            cv.drawLine(x, -56, x, -40, linea)


def llave(cv, ctx):
    sombra_capa(cv, (-40,-290,90,240), 0.6)
    c = pp("amarillo", ctx=ctx, semilla=120)
    rr(cv, -9, -230, 18, 160, 6, c)
    circ(cv, 0, -250, 34, c)
    rr(cv, 9, -205, 26, 14, 3, c)
    rr(cv, 9, -178, 18, 14, 3, c)
    cv.restore()
    circ(cv, 0, -250, 12, pp("noche", ctx=ctx, semilla=121))


@pieza("imagen")
def p_imagen(cv, P, ctx):
    img = imagen(P["archivo"])
    alto = P.get("alto", 600)
    ancho = img.width() * alto / img.height()
    cv.drawImageRect(img, skia.Rect.MakeXYWH(-ancho / 2, -alto, ancho, alto), skia.SamplingOptions(skia.FilterMode.kLinear))



# ---------------------------------------------------------------- más piezas
def curva_puntos(pts, n=16):
    """Catmull-Rom: devuelve una polilínea suave que pasa por los puntos."""
    if len(pts) < 3:
        return [tuple(p) for p in pts]
    P = [pts[0]] + list(pts) + [pts[-1]]
    out = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        for k in range(n):
            u = k / n
            u2, u3 = u * u, u * u * u
            out.append(tuple(0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * u + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * u2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * u3) for j in (0, 1)))
    out.append(tuple(pts[-1]))
    return out


def recorta_polilinea(pl, frac):
    """Primer tramo de una polilínea (frac de su largo) y el punto final."""
    if frac >= 1:
        return pl, pl[-1]
    largos = [math.dist(a, b) for a, b in zip(pl, pl[1:])]
    total = sum(largos) * max(0.0, frac)
    out = [pl[0]]
    for (a, b), L in zip(zip(pl, pl[1:]), largos):
        if total <= L:
            u = total / L if L else 0
            q = (a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u)
            out.append(q)
            return out, q
        out.append(b)
        total -= L
    return out, pl[-1]


@pieza("cable")
def p_cable(cv, P, ctx):
    """Cable o ruta por puntos. traza 0..1 lo dibuja; pulsos = luces que viajan; discontinuo = ruta."""
    pl = curva_puntos(P.get("puntos", [[0, 0], [300, 0]]))
    tramo, punta = recorta_polilinea(pl, P.get("traza", 1.0))
    if len(tramo) < 2:
        return
    path = skia.Path()
    path.moveTo(*tramo[0])
    for q in tramo[1:]:
        path.lineTo(*q)
    g = P.get("grosor", 26)
    if not P.get("discontinuo"):
        sombra_capa(cv, P.get("caja", (-200, -200, 1500, 2400)), 0.8)
        cv.drawPath(path, pp(P.get("color", "gris2"), estilo="linea", grosor=g, borde=False))
        cv.drawPath(path, pp(P.get("brillo", "gris"), estilo="linea", grosor=g * 0.3, borde=False))
        cv.restore()
    else:
        p = pp(P.get("color", "crema"), estilo="linea", grosor=g, borde=False)
        p.setPathEffect(skia.DashPathEffect.Make([g * 1.6, g * 1.3], 0))
        cv.drawPath(path, p)
    for k in range(P.get("pulsos", 0)):
        fr = ((ctx.t * P.get("vel_pulsos", 0.35)) + k / max(1, P.get("pulsos", 1))) % 1.0
        if fr <= P.get("traza", 1.0):
            _, q = recorta_polilinea(pl, fr)
            circ(cv, q[0], q[1], g * 0.42, skia.Paint(AntiAlias=True, Color4f=col(P.get("color_pulso", "amarillo"))))


@pieza("pinza")
def p_pinza(cv, P, ctx):
    """Pinza de cocodrilo con su cable hacia abajo. cierra 0..1."""
    ab = (1 - P.get("cierra", 0)) * 16
    sombra_capa(cv, (-70, -120, 140, 700), 0.9)
    cv.drawLine(0, 60, 0, P.get("largo", 600), pp(P.get("cable", "rojo"), estilo="linea", grosor=16, borde=False))
    rr(cv, -34, -10, 68, 90, 12, pp("rojo", ctx=ctx, semilla=300))
    for s in (-1, 1):
        cv.save(); cv.translate(0, -10); cv.rotate(s * ab)
        poli(cv, [(0, 0), (s * 32, 0), (s * 5, -88)], pp("gris", ctx=ctx, semilla=302 + s))
        cv.restore()
    cv.restore()


@pieza("chispas")
def p_chispas(cv, P, ctx):
    a = P.get("fuerza", 1.0)
    if a <= 0:
        return
    p = pp("amarillo", a, estilo="linea", grosor=7, borde=False)
    for k in range(8):
        ang = math.radians(k * 45 + (ctx.hervor * 23) % 40)
        r0, r1 = 30 + (ctx.hervor + k) % 3 * 8, 70 + (ctx.hervor * 3 + k) % 4 * 14
        cv.drawLine(math.cos(ang) * r0, math.sin(ang) * r0, math.cos(ang) * r1, math.sin(ang) * r1, p)


@pieza("edificio")
def p_edificio(cv, P, ctx):
    """Edificio recortado; origen abajo en el centro. luces = cuántas ventanas encendidas (0..1)."""
    w, h = P.get("w", 360), P.get("h", 620)
    sombra_capa(cv, (-w / 2, -h - 40, w, h + 40), 0.9)
    rr(cv, -w / 2, -h, w, h, 4, pp(P.get("color", "gris2"), ctx=ctx, semilla=310))
    rr(cv, -w / 2 - 14, -h - 26, w + 28, 34, 4, pp(P.get("color2", "beige2"), ctx=ctx, semilla=311))
    cv.restore()
    cols, filas = P.get("cols", 4), P.get("filas", 7)
    vw, vh = (w - 60) / cols, (h - 140) / filas
    luces = P.get("luces", 0.3)
    for f in range(filas):
        for c in range(cols):
            i = f * cols + c
            on = ((i * 37) % 100) / 100 < luces
            if P.get("ventana") is not None and i == P["ventana"]:
                on = P.get("ventana_on", 1) > 0.5
            rr(cv, -w / 2 + 30 + c * vw + 6, -h + 40 + f * vh + 6, vw - 12, vh - 14, 3,
               pp("#FFE08A" if on else "noche", ctx=ctx, semilla=320 + i))
    rr(cv, -40, -110, 80, 110, 6, pp("noche", ctx=ctx, semilla=399))


@pieza("cielo")
def p_cielo(cv, P, ctx):
    w, h = P.get("w", 1300), P.get("h", 1100)
    cv.drawRect(skia.Rect.MakeXYWH(0, 0, w, h), skia.Paint(Color4f=col(P.get("color", "noche"))))
    for i in range(60):
        x, y = (i * 211) % w, (i * 137) % h
        brillo = 0.4 + 0.6 * (((i + ctx.hervor // 3) % 5) / 4)
        circ(cv, x, y, 2 + i % 3, skia.Paint(AntiAlias=True, Color4f=col("#FFF3C4", brillo)))
    if P.get("luna", True):
        circ(cv, P.get("luna_x", w * 0.78), P.get("luna_y", 220), 70, pp("crema", ctx=ctx, semilla=330))
        circ(cv, P.get("luna_x", w * 0.78) + 30, P.get("luna_y", 220) - 18, 62, skia.Paint(AntiAlias=True, Color4f=col(P.get("color", "noche"))))


@pieza("radar")
def p_radar(cv, P, ctx):
    r = P.get("r", 300)
    sombra_capa(cv, (-r - 30, -r - 30, 2 * r + 60, 2 * r + 60))
    circ(cv, 0, 0, r + 26, pp("beige2", ctx=ctx, semilla=340))
    cv.restore()
    circ(cv, 0, 0, r, pp("#10291F", ctx=ctx, semilla=341))
    anillo = pp("#2F6B4C", estilo="linea", grosor=4, borde=False)
    for k in (0.33, 0.66):
        circ(cv, 0, 0, r * k, anillo)
    cv.drawLine(-r, 0, r, 0, anillo); cv.drawLine(0, -r, 0, r, anillo)
    ang = (ctx.t * P.get("vel", 140)) % 360
    sh = skia.GradientShader.MakeSweep(0, 0, [col("verde", 0).toColor(), col("verde", 0.0).toColor(), col("verde", 0.55).toColor()], [0, 0.82, 1.0])
    cv.save(); cv.rotate(ang - 360)
    circ(cv, 0, 0, r, skia.Paint(AntiAlias=True, Shader=sh))
    cv.drawLine(0, 0, r, 0, pp("verde", estilo="linea", grosor=5, borde=False))
    cv.restore()
    bx, by = P.get("blip", [r * 0.4, -r * 0.3])
    ab = math.degrees(math.atan2(by, bx)) % 360
    d = (ang - ab) % 360
    fuerza = max(0.0, 1 - d / 200) if P.get("blip_on", 1) else 0
    if fuerza > 0:
        circ(cv, bx, by, 26 + 18 * (1 - fuerza), skia.Paint(AntiAlias=True, Color4f=col("rojo", 0.35 * fuerza)))
        circ(cv, bx, by, 16, skia.Paint(AntiAlias=True, Color4f=col("rojo", fuerza)))


@pieza("sello")
def p_sello(cv, P, ctx):
    s = P.get("texto", "INTRUSO")
    tam = P.get("tam", 90)
    ancho = fuente("Black", tam).measureText(s) + tam * 0.8
    alto = tam * 1.45
    c = P.get("color", "rojo")
    rr(cv, -ancho / 2, -alto / 2, ancho, alto, 14, pp(c, estilo="linea", grosor=10, ctx=ctx, semilla=350))
    texto(cv, s, 0, tam * 0.36, tam=tam, peso="Black", c=c)


@pieza("postal")
def p_postal(cv, P, ctx):
    sombra_capa(cv, (-120, -80, 240, 160), 0.8)
    rr(cv, -115, -75, 230, 150, 6, pp(P.get("color", "crema"), ctx=ctx, semilla=360))
    cv.restore()
    rr(cv, 50, -60, 50, 56, 3, pp("teal", ctx=ctx, semilla=361))
    linea = pp("beige2", estilo="linea", grosor=4, borde=False)
    cv.drawLine(10, -60, 10, 60, linea)
    for k in range(3):
        cv.drawLine(24, 12 + k * 18, 100, 12 + k * 18, linea)
    texto(cv, P.get("texto", "clave:"), -55, -10, tam=26, peso="Bold", c="tinta")
    texto(cv, P.get("texto2", "••••••"), -55, 26, tam=28, peso="Black", c="rojo")


@pieza("red")
def p_red(cv, P, ctx):
    """Red de pescar con aro y mango. Origen en el centro del aro."""
    r = P.get("r", 180)
    sombra_capa(cv, (-r - 20, -r - 20, 2 * r + 40, 2 * r + 420), 0.8)
    rr(cv, -14, r - 10, 28, 400, 12, pp("madera", ctx=ctx, semilla=370))
    cv.restore()
    cv.save()
    path = skia.Path(); path.addCircle(0, 0, r)
    cv.clipPath(path, doAntiAlias=True)
    malla = pp("crema", 0.85, estilo="linea", grosor=4, borde=False)
    for k in range(-r * 2, r * 2, 36):
        cv.drawLine(k, -r, k + 2 * r, r, malla)
        cv.drawLine(k, r, k + 2 * r, -r, malla)
    cv.restore()
    circ(cv, 0, 0, r, pp("ocre", estilo="linea", grosor=14, ctx=ctx, semilla=371))


@pieza("silueta")
def p_silueta(cv, P, ctx):
    """Persona translúcida; origen en los pies."""
    a = P.get("transp", 0.55)
    c = P.get("color", "celeste")
    circ(cv, 0, -560, 70, pp(c, a, ctx=ctx, semilla=380))
    rr(cv, -110, -480, 220, 300, 60, pp(c, a, ctx=ctx, semilla=381))
    rr(cv, -95, -220, 80, 220, 30, pp(c, a, ctx=ctx, semilla=382))
    rr(cv, 15, -220, 80, 220, 30, pp(c, a, ctx=ctx, semilla=383))


@pieza("mazo")
def p_mazo(cv, P, ctx):
    """Mazo de juez; origen en el extremo del mango (pivote natural)."""
    sombra_capa(cv, (-40, -420, 260, 470))
    rr(cv, -16, -330, 32, 330, 12, pp("madera", ctx=ctx, semilla=390))
    rr(cv, -110, -430, 220, 110, 20, pp("#8A5A3A", ctx=ctx, semilla=391))
    rr(cv, -120, -410, 24, 70, 6, pp("ocre", ctx=ctx, semilla=392))
    rr(cv, 96, -410, 24, 70, 6, pp("ocre", ctx=ctx, semilla=393))
    cv.restore()


@pieza("bloque")
def p_bloque(cv, P, ctx):
    sombra_capa(cv, (-150, -60, 300, 120))
    rr(cv, -140, -30, 280, 60, 14, pp("#8A5A3A", ctx=ctx, semilla=395))
    rr(cv, -120, -54, 240, 30, 10, pp("madera", ctx=ctx, semilla=396))
    cv.restore()


@pieza("embudo")
def p_embudo(cv, P, ctx):
    sombra_capa(cv, (-300, -40, 600, 500))
    poli(cv, [(-280, 0), (280, 0), (50, 300), (-50, 300)], pp(P.get("color", "teal"), ctx=ctx, semilla=400))
    rr(cv, -50, 290, 100, 160, 8, pp(P.get("color", "teal"), ctx=ctx, semilla=401))
    rr(cv, -290, -20, 580, 36, 12, pp("celeste", ctx=ctx, semilla=402))
    cv.restore()


@pieza("sobre")
def p_sobre(cv, P, ctx):
    w, h = P.get("w", 170), P.get("h", 110)
    sombra_capa(cv, (-w / 2, -h / 2, w, h), 0.7)
    rr(cv, -w / 2, -h / 2, w, h, 6, pp(P.get("color", "crema"), ctx=ctx, semilla=410))
    cv.restore()
    lin = pp(P.get("linea", "beige2"), estilo="linea", grosor=5, borde=False)
    cv.drawLine(-w / 2 + 6, -h / 2 + 6, 0, 8, lin)
    cv.drawLine(w / 2 - 6, -h / 2 + 6, 0, 8, lin)


@pieza("corcho")
def p_corcho(cv, P, ctx):
    w, h = P.get("w", 860), P.get("h", 640)
    sombra_capa(cv, (-w / 2 - 30, -h / 2 - 30, w + 60, h + 60))
    rr(cv, -w / 2 - 26, -h / 2 - 26, w + 52, h + 52, 10, pp("madera", ctx=ctx, semilla=420))
    cv.restore()
    rr(cv, -w / 2, -h / 2, w, h, 4, pp("#C48E5A", ctx=ctx, semilla=421))
    pun = skia.Paint(AntiAlias=True, Color4f=col("#A87444"))
    for i in range(160):
        circ(cv, -w / 2 + (i * 97) % w, -h / 2 + (i * 61) % h, 3, pun)


@pieza("nota")
def p_nota(cv, P, ctx):
    w, h = P.get("w", 260), P.get("h", 220)
    sombra_capa(cv, (-w / 2, -h / 2, w, h), 0.8)
    rr(cv, -w / 2, -h / 2, w, h, 4, pp(P.get("color", "crema"), ctx=ctx, semilla=430))
    cv.restore()
    y = -h / 2 + 50
    if P.get("texto"):
        texto(cv, P["texto"], 0, y, tam=P.get("tam", 38), peso="Black", c=P.get("tinta", "tinta"))
        y += 30
    lin = pp("beige2", estilo="linea", grosor=6, borde=False)
    for k in range(P.get("lineas", 3)):
        y += 34
        if y < h / 2 - 20:
            cv.drawLine(-w / 2 + 30, y, w / 2 - 30 - (k % 2) * 50, y, lin)
    if P.get("chincheta", True):
        circ(cv, 0, -h / 2 + 12, 11, pp("rojo", ctx=ctx, semilla=431))


@pieza("lupa")
def p_lupa(cv, P, ctx):
    r = P.get("r", 130)
    sombra_capa(cv, (-r - 20, -r - 20, 2 * r + 260, 2 * r + 260))
    cv.save(); cv.rotate(45)
    rr(cv, r - 6, -22, 220, 44, 20, pp("madera", ctx=ctx, semilla=440))
    cv.restore()
    circ(cv, 0, 0, r, pp("ocre", estilo="linea", grosor=22, ctx=ctx, semilla=441))
    cv.restore()
    circ(cv, 0, 0, r - 10, skia.Paint(AntiAlias=True, Color4f=col("celeste", 0.28)))
    circ(cv, -r * 0.35, -r * 0.35, r * 0.22, skia.Paint(AntiAlias=True, Color4f=col("#FFFFFF", 0.35)))


@pieza("calendario")
def p_calendario(cv, P, ctx):
    num = int(round(P.get("num", 28)))
    sombra_capa(cv, (-230, -300, 460, 600))
    rr(cv, -220, -260, 440, 540, 14, pp("crema", ctx=ctx, semilla=450))
    rr(cv, -220, -260, 440, 120, 14, pp(P.get("color", "teal"), ctx=ctx, semilla=451))
    cv.restore()
    for x in (-120, 120):
        rr(cv, x - 10, -300, 20, 70, 8, pp("gris2", ctx=ctx, semilla=452))
    texto(cv, P.get("mes", "diciembre"), 0, -180, tam=58, peso="Bold", c="crema")
    texto(cv, str(num), 0, 110, tam=230, peso="Black", c="tinta")
    texto(cv, P.get("anio", "1995"), 0, 220, tam=52, peso="Bold", c="teal")


@pieza("sirena")
def p_sirena(cv, P, ctx):
    fase = int(ctx.t * 6) % 2
    c = "#3D7BFF" if fase else "rojo"
    circ(cv, 0, -40, 160, skia.Paint(AntiAlias=True, Color4f=col(c, 0.22)))
    sombra_capa(cv, (-90, -120, 180, 150))
    rr(cv, -80, -10, 160, 40, 8, pp("gris2", ctx=ctx, semilla=460))
    path = skia.Path(); path.addArc(skia.Rect.MakeXYWH(-60, -110, 120, 200), 180, 180)
    cv.drawPath(path, pp(c, ctx=ctx, semilla=461))
    cv.restore()


@pieza("avion")
def p_avion(cv, P, ctx):
    sombra_capa(cv, (-120, -80, 240, 160), 1.2)
    poli(cv, [(-110, 30), (110, 0), (-110, -60), (-60, 0)], pp("crema", ctx=ctx, semilla=470))
    poli(cv, [(-60, 0), (110, 0), (-100, 60)], pp("crema2", ctx=ctx, semilla=471))
    cv.restore()


@pieza("billetes")
def p_billetes(cv, P, ctx):
    sombra_capa(cv, (-190, -110, 380, 220))
    for k in range(5, -1, -1):
        rr(cv, -180 + k * 3, -95 + k * 7, 360, 170, 8, pp("#9CC79A" if k % 2 else "#B9D9B1", ctx=ctx, semilla=480 + k))
    cv.restore()
    rr(cv, -180, -95, 360, 170, 8, pp("#B9D9B1", ctx=ctx, semilla=487))
    circ(cv, 0, -10, 46, pp("#9CC79A", ctx=ctx, semilla=488))
    rr(cv, -40, -40, 80, 150, 6, pp("crema", ctx=ctx, semilla=489))
    texto(cv, P.get("texto", "5.000 $"), 0, 58, tam=40, peso="Black", c="tinta")


@pieza("terminal")
def p_terminal(cv, P, ctx):
    w, h = P.get("w", 820), P.get("h", 560)
    sombra_capa(cv, (-w / 2, -h / 2, w, h), 1.1)
    rr(cv, -w / 2, -h / 2, w, h, 22, pp("tinta", ctx=ctx, semilla=490))
    cv.restore()
    rr(cv, -w / 2, -h / 2, w, 60, 22, pp("noche3", ctx=ctx, semilla=491))
    for k, c in enumerate(("rojo", "amarillo", "verde")):
        circ(cv, -w / 2 + 40 + k * 34, -h / 2 + 30, 10, skia.Paint(AntiAlias=True, Color4f=col(c)))
    lineas = P.get("lineas", [["naranja", 160, "verde", 260], ["celeste", 120, "crema", 300], ["verde", 200], ["crema", 90, "amarillo", 220, "celeste", 120],
                              ["naranja", 140, "crema", 280], ["celeste", 240], ["verde", 120, "crema", 200]])
    hechas = ctx.t * P.get("vel", 4.0)
    y = -h / 2 + 110
    for i, ln in enumerate(lineas):
        if hechas - i <= 0 or y > h / 2 - 30:
            break
        frac = min(1.0, hechas - i)
        x = -w / 2 + 50
        total = sum(ln[1::2]) + 20 * (len(ln) // 2)
        lim = x + total * frac
        for c, L in zip(ln[0::2], ln[1::2]):
            fin = min(x + L, lim)
            if fin > x:
                rr(cv, x, y, fin - x, 18, 9, skia.Paint(AntiAlias=True, Color4f=col(c, 0.95)))
            x += L + 20
        y += 54
    if int(ctx.t * 2.5) % 2:
        rr(cv, -w / 2 + 50, y, 24, 22, 2, skia.Paint(AntiAlias=True, Color4f=col("crema")))


@pieza("hoja")
def p_hoja(cv, P, ctx):
    w, h = P.get("w", 560), P.get("h", 740)
    sombra_capa(cv, (-w / 2, -h / 2, w, h))
    rr(cv, -w / 2, -h / 2, w, h, 6, pp("crema", ctx=ctx, semilla=500))
    cv.restore()
    texto(cv, P.get("titulo", "GUION"), 0, -h / 2 + 80, tam=56, peso="Black", c="tinta")
    hechas = ctx.t * P.get("vel", 3.0)
    for i in range(P.get("filas", 9)):
        if hechas - i <= 0:
            break
        y = -h / 2 + 150 + i * 62
        circ(cv, -w / 2 + 60, y, 16, skia.Paint(AntiAlias=True, Color4f=col("naranja")))
        texto(cv, str(i + 1), -w / 2 + 60, y + 9, tam=24, peso="Bold", c="blanco")
        L = (w - 150) * min(1.0, hechas - i) * (0.6 + 0.4 * ((i * 7) % 5) / 4)
        rr(cv, -w / 2 + 95, y - 8, L, 16, 8, skia.Paint(AntiAlias=True, Color4f=col("beige2")))


@pieza("insignia")
def p_insignia(cv, P, ctx):
    r = P.get("r", 90)
    sombra_capa(cv, (-r, -r, 2 * r, 2 * r))
    circ(cv, 0, 0, r, pp("naranja", ctx=ctx, semilla=510))
    cv.restore()
    texto(cv, str(P.get("texto", "1")), 0, r * 0.38, tam=int(r * 1.1), peso="Black", c="blanco")


@pieza("titulo")
def p_titulo(cv, P, ctx):
    tam = P.get("tam", 120)
    sombra_capa(cv, (-700, -tam, 1400, tam * 1.5), 1.0, dx=6, dy=10, blur=4)
    texto(cv, P.get("texto", ""), 0, tam * 0.35, tam=tam, peso="Black", c=P.get("color", "crema"), trazo=P.get("trazo", "tinta"), grosor=tam * 0.12)
    cv.restore()


@pieza("caja_palabra")
def p_caja_palabra(cv, P, ctx):
    s = P.get("texto", "PALABRA")
    tam = P.get("tam", 190)
    ancho = fuente("Black", tam).measureText(s)
    sombra_capa(cv, (-ancho / 2 - 50, -tam, ancho + 100, tam * 1.4), 1.2, dx=10, dy=14, blur=3)
    rr(cv, -ancho / 2 - 44, -tam * 0.82, ancho + 88, tam * 1.2, 26, pp("naranja", ctx=ctx, semilla=520))
    cv.restore()
    texto(cv, s, 0, tam * 0.3, tam=tam, peso="Black", c="blanco")


@pieza("tachado")
def p_tachado(cv, P, ctx):
    s = P.get("texto", "")
    tam = P.get("tam", 64)
    ancho = fuente("ExtraBold", tam).measureText(s) + tam
    sombra_capa(cv, (-ancho / 2, -tam * 0.8, ancho, tam * 1.6), 0.8)
    rr(cv, -ancho / 2, -tam * 0.75, ancho, tam * 1.5, tam * 0.75, pp("crema", ctx=ctx, semilla=530))
    cv.restore()
    texto(cv, s, 0, tam * 0.35, tam=tam, peso="ExtraBold", c="tinta")
    u = P.get("tacha", 0)
    if u > 0:
        cv.drawLine(-ancho / 2 + 20, 0, -ancho / 2 + 20 + (ancho - 40) * min(1, u), -4, pp("rojo", estilo="linea", grosor=12, borde=False))


@pieza("onda")
def p_onda(cv, P, ctx):
    n, w = P.get("barras", 24), P.get("w", 600)
    paso = w / n
    for i in range(n):
        h = 20 + 90 * abs(math.sin(ctx.t * 7 + i * 0.7)) * (0.5 + 0.5 * math.sin(i * 1.3))
        rr(cv, -w / 2 + i * paso, -h / 2, paso * 0.6, h, paso * 0.3, skia.Paint(AntiAlias=True, Color4f=col(P.get("color", "naranja"))))


@pieza("linea_tiempo")
def p_linea_tiempo(cv, P, ctx):
    w, h = P.get("w", 860), P.get("h", 300)
    sombra_capa(cv, (-w / 2, -h / 2, w, h))
    rr(cv, -w / 2, -h / 2, w, h, 18, pp("tinta", ctx=ctx, semilla=540))
    cv.restore()
    pistas = [("celeste", [(0, 0.22), (0.25, 0.5), (0.55, 0.95)]), ("ocre", [(0.05, 0.4), (0.45, 0.8)]), ("naranja", [(0, 0.3), (0.32, 0.62), (0.66, 1.0)])]
    for k, (c, trozos) in enumerate(pistas):
        y = -h / 2 + 50 + k * 75
        for a, b in trozos:
            rr(cv, -w / 2 + 40 + a * (w - 80), y, (b - a) * (w - 80) - 8, 50, 10, skia.Paint(AntiAlias=True, Color4f=col(c, 0.9)))
    xp = -w / 2 + 40 + ((ctx.t * P.get("vel", 0.25)) % 1.0) * (w - 80)
    cv.drawLine(xp, -h / 2 + 20, xp, h / 2 - 20, pp("rojo", estilo="linea", grosor=6, borde=False))
    circ(cv, xp, -h / 2 + 22, 12, skia.Paint(AntiAlias=True, Color4f=col("rojo")))


@pieza("polilla")
def p_polilla(cv, P, ctx):
    """Polilla o insecto de papel; aletea solo. Origen en el centro del cuerpo."""
    aleteo = 1.0 if not P.get("aletea", True) else 0.55 + 0.45 * abs(math.sin(ctx.t * 9))
    c1, c2 = P.get("color", "beige2"), P.get("color2", "#B7A88A")
    sombra_capa(cv, (-120, -90, 240, 180), 0.8)
    for s in (-1, 1):
        cv.save(); cv.scale(s * aleteo, 1)
        poli(cv, [(6, -8), (96, -70), (110, -10), (40, 18)], pp(c1, ctx=ctx, semilla=700 + s))
        poli(cv, [(6, 6), (70, 30), (60, 70), (14, 34)], pp(c2, ctx=ctx, semilla=702 + s))
        cv.restore()
    rr(cv, -9, -40, 18, 84, 9, pp("cafe", ctx=ctx, semilla=705))
    lin = pp("cafe", estilo="linea", grosor=3, borde=False)
    cv.drawLine(-3, -38, -26, -72, lin); cv.drawLine(3, -38, 26, -72, lin)
    cv.restore()


@pieza("grupo")
def p_grupo(cv, P, ctx):
    """Piezas hijas en coordenadas locales (sin cámara), con recorte opcional."""
    if P.get("recorte"):
        x, y, w, h = P["recorte"]
        cv.save()
        cv.clipRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, w, h), 24, 24), doAntiAlias=True)
        if P.get("fondo"):
            cv.drawRect(skia.Rect.MakeXYWH(x, y, w, h), skia.Paint(Color4f=col(P["fondo"])))
    neutra = {"x": W / 2, "y": H / 2, "zoom": 1}
    for h_ in P.get("hijos", []):
        dibujar_pieza(cv, h_, ctx, neutra)
    if P.get("recorte"):
        cv.restore()


@pieza("movil")
def p_movil(cv, P, ctx):
    """Móvil con pantalla; 'hijos' se dibujan dentro (coordenadas de pantalla, 0..w, 0..h)."""
    w, h = P.get("w", 460), P.get("h", 900)
    sombra_capa(cv, (-w / 2 - 24, -h / 2 - 24, w + 48, h + 48), 1.1)
    rr(cv, -w / 2 - 22, -h / 2 - 22, w + 44, h + 44, 60, pp("tinta", ctx=ctx, semilla=550))
    cv.restore()
    cv.save()
    cv.clipRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(-w / 2, -h / 2, w, h), 44, 44), doAntiAlias=True)
    cv.drawRect(skia.Rect.MakeXYWH(-w / 2, -h / 2, w, h), skia.Paint(Color4f=col(P.get("fondo", "morado"))))
    cv.translate(-w / 2, -h / 2)
    esc = P.get("zoom_dentro", w / W)
    cv.scale(esc, esc)
    sub = Ctx(ctx.t, ctx.hervor)
    neutra = {"x": W / 2, "y": H / 2, "zoom": 1}
    for h_ in P.get("hijos", []):
        dibujar_pieza(cv, h_, sub, neutra)
    cv.restore()
    rr(cv, -60, -h / 2 + 14, 120, 26, 13, skia.Paint(AntiAlias=True, Color4f=col("tinta")))



# ---------------------------------------------------------------- narrador: persona de papel recortado
PERSONA = {"pelo": "#6B4430", "pelo2": "#4E3022", "piel": "#F2C6A0", "piel2": "#DDA27C", "cinta": "#E0533A", "cinta2": "#B8402B",
           "camiseta": "#4E8C9A", "camiseta2": "#3F7480", "pantalon": "#262423", "pantalon2": "#3A3734", "linea": "#2A2630",
           "ojo": "#1E1A22", "boca": "#8C2F2A", "lengua": "#F08A8A", "suela": "#F4F1EA"}
POSES_PERSONA = {  # (brazo izq, brazo der): ángulo desde abajo y mano
    "quieto": ((10, "puno"), (-10, "puno")),
    "saluda": ((10, "puno"), (-155, "abierta")),
    "senala": ((10, "puno"), (-92, "senala")),
    "pulgar": ((10, "puno"), (-125, "pulgar")),
    "presenta": ((12, "puno"), (-58, "abierta")),
    "celebra": ((160, "puno"), (-160, "puno")),
}


def _ruta(pts, cerrar=True):
    p = skia.Path(); p.moveTo(*pts[0])
    for q in pts[1:]:
        if len(q) == 4:
            p.quadTo(q[0], q[1], q[2], q[3])
        else:
            p.lineTo(*q)
    if cerrar:
        p.close()
    return p


@pieza("persona")
def p_persona(cv, P, ctx):
    """Narrador de papel recortado. Origen en los pies; mide unos 820 px a escala 1.
    pose (quieto, saluda, senala, pulgar, presenta, celebra), habla (boca con la voz), mira -1..1,
    colores {pelo, piel, camiseta, pantalon…}, cinta (true = cinta en la frente), mechon (true/false)."""
    BEC = dict(PERSONA)
    BEC.update({k: PALETA.get(v, v) for k, v in (P.get("colores") or {}).items()})
    def c(k, a=1.0, sem=0):
        return pp(BEC[k], a, ctx=ctx, semilla=600 + sem)
    lin = lambda g=5: pp(BEC["linea"], estilo="linea", grosor=g, borde=False)
    pose = POSES_PERSONA.get(P.get("pose", "quieto"), POSES_PERSONA["quieto"])
    resp = math.sin(ctx.t * 2.2) * 3
    # piernas, zapatillas y pantalón
    sombra_capa(cv, (-140, -330, 280, 340), 0.9)
    for sx in (-1, 1):
        rr(cv, sx * 34 - 16, -200, 32, 165, 14, c("piel", sem=1 + sx))
        cv.drawPath(_ruta([(sx * 34 - 30, -52), (sx * 34 + 18 + sx * 10, -54), (sx * 34 + 46 * (1 if sx > 0 else 0.6) + sx * 10, -18), (sx * 34 + 46 * (1 if sx > 0 else 0.6) + sx * 10, -8), (sx * 34 - 38 * (1 if sx < 0 else 0.6), -8), (sx * 34 - 38 * (1 if sx < 0 else 0.6), -24)]), c("pantalon", sem=3 + sx))
        rr(cv, sx * 34 - 40 + (sx > 0) * 4, -12, 92, 13, 6, c("suela", sem=5 + sx))
    cv.drawPath(_ruta([(-92, -330 + resp * 0.3), (92, -330 + resp * 0.3), (98, -190), (8, -190), (0, -230), (-8, -190), (-98, -190)]), c("pantalon", sem=8))
    cv.restore()
    cv.save(); cv.translate(0, resp)

    def brazo(sx, ang, mano):
        cv.save(); cv.translate(sx * 86, -470); cv.rotate(ang)
        sombra_capa(cv, (-45, -40, 90, 270), 0.8)
        rr(cv, -15, 30, 30, 150, 14, c("piel", sem=22 + sx))
        cv.drawPath(_ruta([(-34, -22), (30, -22), (36, 62), (-38, 58)]), c("camiseta", sem=20 + sx))
        circ(cv, 0, 186, 24, c("piel", sem=24 + sx))
        if mano == "senala":
            rr(cv, -7, 196, 14, 54, 7, c("piel", sem=26))
        elif mano == "pulgar":
            rr(cv, 13, 150, 15, 42, 7, c("piel", sem=27))
        elif mano == "abierta":
            for k in range(4):
                rr(cv, -21 + k * 11, 196, 10, 28 - abs(k - 1.5) * 4, 5, c("piel", sem=28 + k))
        cv.restore()
        cv.restore()
    (ai, mi), (ad, md) = pose
    brazo(-1, ai, mi)
    # camiseta con cuello redondo
    sombra_capa(cv, (-120, -500, 240, 290), 0.9)
    cv.drawPath(_ruta([(-88, -492), (-40, -500), (-20, -486, 0, -484), (20, -486, 40, -500), (88, -492), (96, -310), (90, -300), (-90, -300), (-96, -310)]), c("camiseta", sem=30))
    cv.restore()
    cv.drawPath(_ruta([(-40, -500), (-20, -470, 0, -468), (20, -470, 40, -500)], cerrar=False), lin(5))
    cv.drawPath(_ruta([(-60, -420), (-30, -400, 10, -404)], cerrar=False), pp(BEC["camiseta2"], estilo="linea", grosor=5, borde=False))
    brazo(1, ad, md)
    # cuello
    rr(cv, -20, -530, 40, 44, 10, c("piel2", sem=40))
    # ---------- cabeza
    cv.save(); cv.translate(0, -640); cv.rotate(math.sin(ctx.t * 1.3) * 1.5 + P.get("inclina", 0))
    sombra_capa(cv, (-230, -360, 460, 520), 0.9)
    # pelo de detrás: mechones alrededor, despeinados (largos y curvas distintos)
    LARGOS = [34, 58, 44, 70, 50, 62, 40, 74, 52, 66, 46, 72, 42, 56, 38, 60, 36]
    CURVAS_ = [0.5, -0.3, 0.4, 0.6, -0.4, 0.3, 0.5, -0.2, 0.45, -0.35, 0.55, 0.25, -0.3, 0.4, 0.5, -0.4, 0.3]
    for capa, col_k, r0, dl in ((0, "pelo2", 116, 14), (1, "pelo", 110, 0)):
        for k in range(17):
            ang = math.radians(-215 + k * 15.6)
            L = LARGOS[k] + dl
            ax, ay = math.cos(ang), math.sin(ang)
            px, py = -ay, ax
            w = 30 + (k % 3) * 4
            base1 = (ax * r0 + px * w, ay * r0 + py * w - 22)
            base2 = (ax * r0 - px * w, ay * r0 - py * w - 22)
            cu = CURVAS_[k]
            tip = (ax * (r0 + L) + px * L * cu, ay * (r0 + L) + py * L * cu - 22)
            mid1 = ((base1[0] + tip[0]) / 2 + px * L * cu * 0.4, (base1[1] + tip[1]) / 2 + py * L * cu * 0.4)
            mid2 = ((base2[0] + tip[0]) / 2 + px * L * cu * 0.2, (base2[1] + tip[1]) / 2 + py * L * cu * 0.2)
            cv.drawPath(_ruta([base1, (mid1[0], mid1[1], tip[0], tip[1]), (mid2[0], mid2[1], base2[0], base2[1])]), c(col_k, sem=41 + k + capa * 20))
    # patillas sobre las orejas
    for sx in (-1, 1):
        cv.drawPath(_ruta([(sx * 104, -40), (sx * 140, 10, sx * 128, 54), (sx * 118, 30, sx * 96, 20)]), c("pelo", sem=78 + sx))
    # mechón grande que sube y se curva
    if P.get("mechon", False):
      cv.save(); cv.translate(0, -120); cv.scale(0.72, 0.72); cv.translate(0, 120)
      cv.drawPath(_ruta([(-34, -120), (-60, -230, -10, -300), (40, -330, 78, -300), (30, -286, 20, -240), (12, -180, 26, -118)]), c("pelo2", sem=80))
      cv.drawPath(_ruta([(-26, -122), (-48, -228, -6, -290), (34, -318, 66, -298), (24, -280, 14, -236), (8, -180, 20, -120)]), c("pelo", sem=81))
      cv.restore()
    cv.drawOval(skia.Rect.MakeXYWH(-150, -175, 300, 220), c("pelo", sem=82))
    # orejas y cara (barbilla un poco en punta)
    for sx in (-1, 1):
        cv.drawOval(skia.Rect.MakeXYWH(sx * 118 - 22, -6, 44, 58), c("piel2", sem=84 + sx))
    cara = _ruta([(-120, -60), (-124, 40, -96, 92), (-50, 140, 0, 146), (50, 140, 96, 92), (124, 40, 120, -60), (0, -110, -120, -60)])
    cv.drawPath(cara, c("piel", sem=86))
    # cinta sobre la frente, con los lazos a la izquierda (opcional)
    if P.get("cinta"):
      cv.drawPath(_ruta([(-128, -84), (0, -112, 128, -84), (126, -52), (0, -82, -126, -52)]), c("cinta", sem=90))
      cv.drawPath(_ruta([(-120, -74), (-182, -42, -194, 16), (-168, 16), (-158, -20, -116, -54)]), c("cinta2", sem=91))
      cv.drawPath(_ruta([(-116, -62), (-158, -12, -148, 48), (-124, 42), (-128, 0, -108, -50)]), c("cinta", sem=92))
    # flequillo: mechones cortos que caen sobre la cinta (con su sombra para separarlos de la piel)
    for k, (x, L, ang, w) in enumerate([(-70, 46, 14, 15), (-6, 58, -2, 17), (58, 40, -16, 14)]):
        cv.save(); cv.translate(x, -116); cv.rotate(ang)
        cv.drawPath(_ruta([(-w - 2, 0), (-w * 0.4, L * 0.6, 2, L + 4), (w * 0.5, L * 0.5, w + 2, 0)]), c("pelo2", sem=100 + k))
        cv.drawPath(_ruta([(-w, 0), (-w * 0.4, L * 0.55, 1, L), (w * 0.45, L * 0.45, w, 0)]), c("pelo", sem=95 + k))
        cv.restore()
    cv.restore()  # sombra de la cabeza
    # cara: ojos grandes con blanco, cejas, nariz y boca abierta
    mira = P.get("mira", 0) * 7
    parpadeo = (int(ctx.t * 10) % 41) == 0
    for sx in (-1, 1):
        ex = sx * 46
        if parpadeo:
            cv.drawPath(_ruta([(ex - 24, 30), (ex, 40, ex + 24, 30)], cerrar=False), lin(6))
        else:
            cv.drawOval(skia.Rect.MakeXYWH(ex - 25, 2, 50, 58), skia.Paint(AntiAlias=True, Color4f=col("#FFFFFF")))
            cv.drawOval(skia.Rect.MakeXYWH(ex - 25, 2, 50, 58), lin(5))
            circ(cv, ex + mira - sx * 3, 33, 17, skia.Paint(AntiAlias=True, Color4f=col(BEC["ojo"])))
            circ(cv, ex + mira - sx * 3 - 6, 25, 6, skia.Paint(AntiAlias=True, Color4f=col("#FFFFFF")))
        cv.drawPath(_ruta([(ex - 24, -12 - (sx > 0) * 2), (ex, -24, ex + 24, -14 - (sx < 0) * 2)], cerrar=False), lin(8))
    cv.drawPath(_ruta([(4, 60), (-4, 76), (6, 78)], cerrar=False), pp(BEC["piel2"], estilo="linea", grosor=5, borde=False))
    boca = boca_en(ctx.t_abs) if P.get("habla") else P.get("boca", 0.4)
    boca = max(0.0, min(1.0, boca))
    h = 6 + 40 * boca
    bp = _ruta([(-38, 92), (0, 100, 38, 92), (34, 92 + h, 0, 92 + h + 6), (-34, 92 + h, -38, 92)])
    cv.drawPath(bp, pp(BEC["boca"], borde=False))
    cv.save(); cv.clipPath(bp, doAntiAlias=True)
    cv.drawOval(skia.Rect.MakeXYWH(-22, 92 + h - 14, 44, 30), skia.Paint(AntiAlias=True, Color4f=col(BEC["lengua"])))
    rr(cv, -30, 88, 60, 12, 4, skia.Paint(AntiAlias=True, Color4f=col("#FFFFFF")))
    cv.restore()
    cv.drawPath(bp, lin(4))
    cv.restore()  # cabeza
    cv.restore()  # respiración


# ---------------------------------------------------------------- animación de propiedades
def valor(pz, prop, t, defecto=None):
    """Valor de una propiedad en t: claves [[t, {props}], ...] con curva; si no, la base."""
    base = pz.get(prop, defecto)
    claves = pz.get("_claves")
    if not claves:
        return base
    previa = None
    for i, (tk, props) in enumerate(claves):
        if prop not in props:
            continue
        if tk <= t:
            previa = (tk, props[prop], props.get("curva", "suave"))
            continue
        # siguiente clave con esta propiedad
        if previa is None:
            return props[prop] if base is None else base
        t0, v0, _ = previa
        curva = CURVAS.get(props.get("curva", "suave"), suave)
        if isinstance(v0, (int, float)) and isinstance(props[prop], (int, float)):
            u = curva((t - t0) / max(1e-6, tk - t0))
            return v0 + (props[prop] - v0) * u
        return v0
    return previa[1] if previa else base


def preparar(pz):
    """Convierte atajos (entra, sale, accion) en claves."""
    claves = [list(c) for c in pz.get("claves", [])]
    x, y = pz.get("x", 0), pz.get("y", 0)
    e = pz.get("entra")
    if e:
        t, dur = e.get("t", 0), e.get("dur", 0.5)
        modo = e.get("desde", "pop")
        d = e.get("dist", 1300)
        ini = {}
        if modo == "abajo": ini = {"y": y + d}
        elif modo == "arriba": ini = {"y": y - d}
        elif modo == "izquierda": ini = {"x": x - d}
        elif modo == "derecha": ini = {"x": x + d}
        elif modo == "pop": ini = {"escala": 0.0}
        elif modo == "cae": ini = {"y": y - 160, "alfa": 0.0}
        elif modo == "golpe": ini = {"escala": 2.2 * pz.get("escala", 1.0), "alfa": 0.0}
        elif modo == "funde": ini = {"alfa": 0.0}
        fin = {k: (pz.get(k, 1.0) if k in ("escala", "alfa") else (x if k == "x" else y)) for k in ini}
        fin["curva"] = e.get("curva", "rebote" if modo in ("pop", "abajo", "cae") else "sale")
        if modo == "golpe":
            fin["curva"] = e.get("curva", "sale")
        claves.append([0, dict(ini)])
        claves.append([t, dict(ini)])
        claves.append([t + dur, fin])
    s = pz.get("sale")
    if s:
        t, dur = s.get("t", 99), s.get("dur", 0.4)
        modo = s.get("hacia", "abajo")
        d = s.get("dist", 1300)
        fin = {}
        if modo == "abajo": fin = {"y": y + d}
        elif modo == "arriba": fin = {"y": y - d}
        elif modo == "izquierda": fin = {"x": x - d}
        elif modo == "derecha": fin = {"x": x + d}
        elif modo == "pop": fin = {"escala": 0.0}
        elif modo == "funde": fin = {"alfa": 0.0}
        ini = {k: (pz.get(k, 1.0) if k in ("escala", "alfa") else (x if k == "x" else y)) for k in fin}
        claves.append([t, ini])
        fin["curva"] = "suave"
        claves.append([t + dur, fin])
    claves.sort(key=lambda c: c[0])
    pz["_claves"] = claves
    return pz


def dibujar_pieza(cv, pz, ctx, cam):
    t = ctx.t
    tipo = pz["tipo"]
    alfa = valor(pz, "alfa", t, 1.0)
    esc = valor(pz, "escala", t, 1.0)
    if alfa <= 0.003 or esc <= 0.003:
        return
    P = {k: valor(pz, k, t, v) for k, v in pz.items() if not k.startswith("_") and k not in ("claves", "entra", "sale")}
    x, y = P.get("x", 0), P.get("y", 0)
    capa = P.get("capa", 1.0)
    # paralaje: lo lejano se mueve menos con la cámara
    x += (cam["x"] - W / 2) * (1 - capa)
    y += (cam["y"] - H / 2) * (1 - capa)
    # temblor de stop motion (12 fps)
    if P.get("tiembla", True):
        sem = hash((pz.get("id", tipo), ctx.hervor)) % 1000
        x += ((sem % 7) - 3) * 0.45
        y += (((sem // 7) % 7) - 3) * 0.45
        rot_t = (((sem // 49) % 5) - 2) * 0.12
    else:
        rot_t = 0
    cv.save()
    cv.translate(x, y)
    piv = P.get("pivote", [0, 0])
    cv.translate(*piv)
    cv.rotate(P.get("rot", 0) + rot_t)
    cv.scale(esc * (-1 if P.get("espejo") else 1), esc)
    cv.translate(-piv[0], -piv[1])
    if alfa < 0.999:
        cv.saveLayerAlpha(None, int(alfa * 255))
    PIEZAS[tipo](cv, P, ctx)
    if alfa < 0.999:
        cv.restore()
    cv.restore()


# ---------------------------------------------------------------- escenas
def camara(esc, t):
    cam = {"x": W / 2, "y": H / 2, "zoom": 1.0}
    c = esc.get("camara", {})
    pz = {"x": c.get("x", W / 2), "y": c.get("y", H / 2), "zoom": c.get("zoom", 1.0), "_claves": sorted(c.get("claves", []), key=lambda k: k[0])}
    for k in cam:
        cam[k] = valor(pz, k, t, cam[k])
    return cam


def dibujar_escena(cv, esc, t, hervor):
    cv.save()
    cv.clear(col(esc.get("fondo", "noche")))
    cam = camara(esc, t)
    cv.translate(W / 2, H / 2)
    cv.scale(cam["zoom"], cam["zoom"])
    cv.translate(-cam["x"], -cam["y"])
    ctx = Ctx(t, hervor, t + esc.get("inicio", 0))
    for pz in esc["piezas"]:
        dibujar_pieza(cv, pz, ctx, cam)
    cv.restore()


def acabado(cv, viñeta=True):
    """Grano de papel y viñeta suave encima de todo."""
    if "grano" not in _IMGS:
        _IMGS["grano"] = _textura(512, 1, 0.075, 11)
        _IMGS["ruido_suave"] = _textura(512, 16, 0.022, 12)
    p = skia.Paint(Shader=_IMGS["grano"].makeShader(skia.TileMode.kRepeat, skia.TileMode.kRepeat, skia.SamplingOptions()))
    cv.drawPaint(p)
    p2 = skia.Paint(Shader=_IMGS["ruido_suave"].makeShader(skia.TileMode.kRepeat, skia.TileMode.kRepeat, skia.SamplingOptions(skia.FilterMode.kLinear), skia.Matrix.Scale(2, 2)))
    cv.drawPaint(p2)
    if viñeta:
        sh = skia.GradientShader.MakeRadial((W / 2, H / 2), H * 0.72, [col("#000000", 0).toColor(), col("#000000", 0.32).toColor()], [0.55, 1.0])
        cv.drawPaint(skia.Paint(Shader=sh))


# ---------------------------------------------------------------- barrido de franjas de papel
def barrido(cv, u, colores=None, n=6, hervor=0):
    """u de 0 a 1: las franjas entran (0–0,5) y salen (0,5–1) siguiendo el mismo sentido."""
    colores = colores or ["crema", "teal", "celeste", "ocre", "crema", "teal"]
    alto = H / n
    ctx = Ctx(0, hervor)
    for i in range(n):
        d = 1 if i % 2 == 0 else -1
        retardo = i * 0.035
        v = max(0.0, min(1.0, (u - retardo) / (1 - n * 0.035)))
        if v <= 0 or v >= 1:
            continue
        # entra de un lado, tapa y se va por el otro
        if v < 0.5:
            x = -d * W * (1 - suave(v * 2))
        else:
            x = d * W * suave((v - 0.5) * 2)
        sombra_capa(cv, (-60,i*alto-20,W+120,alto+40), 1.0, dx=0, dy=10, blur=8)
        cv.drawRect(skia.Rect.MakeXYWH(x - 30, i * alto - 6, W + 60, alto + 12), pp(colores[i % len(colores)], ctx=ctx, semilla=200 + i))
        cv.restore()


def tapado(u, n=6):
    """¿Las franjas tapan toda la pantalla en u? (para cambiar de escena debajo)."""
    return u >= 0.5


# ---------------------------------------------------------------- subtítulos
def subtitulos(cv, palabras, t, fps):
    """Una línea centrada palabra a palabra; las clave en caja naranja con texto blanco."""
    adelanto = 8 / fps
    linea = None
    for ln in palabras:
        if ln["s"] - adelanto <= t <= ln["e"] + 0.25:
            linea = ln
    if not linea:
        return
    y = linea.get("y", 1510)
    tam = 66
    f = fuente("ExtraBold", tam)
    esp = f.measureText(" ")
    vis = [p for p in linea["p"] if p["s"] - adelanto <= t]
    anchos = [f.measureText(p["w"]) for p in linea["p"]]
    total = sum(anchos) + esp * (len(anchos) - 1)
    x = W / 2 - total / 2
    for p, a in zip(linea["p"], anchos):
        if p in vis:
            u = sale((t - (p["s"] - adelanto)) / 0.12)
            dy = (1 - u) * 18
            if p.get("clave"):
                sombra_capa(cv, (x-20,y-tam,a+40,tam*1.3), 0.8)
                rr(cv, x - 14, y - tam * 0.86 + dy, a + 28, tam * 1.12, 12, skia.Paint(AntiAlias=True, Color4f=col("naranja")))
                cv.restore()
                texto(cv, p["w"], x, y + dy, tam=tam, peso="ExtraBold", c="blanco", centro=False)
            else:
                texto(cv, p["w"], x, y + dy, tam=tam, peso="ExtraBold", c="blanco", centro=False, trazo="tinta", grosor=12)
        x += a + esp


# ---------------------------------------------------------------- palabras clave en tiras de papel
def recortes(cv, lista, t, hervor):
    """Tiras de papel recortado con las palabras clave: entran de golpe al decirse y se van al acabar su escena.
    Cada una: {t, fin, texto, estilo: naranja|crema|noche, x, y, rot, tam}."""
    ctx = Ctx(t, hervor)
    for r in lista:
        if not (r["t"] <= t <= r["fin"] + 0.25):
            continue
        u = (t - r["t"]) / 0.22
        esc = 1.0 + 0.35 * (1 - rebote(u)) if u < 1 else 1.0
        alfa = min(1.0, u * 2.5)
        if t > r["fin"]:
            alfa *= max(0.0, 1 - (t - r["fin"]) / 0.25)
        if alfa <= 0.01:
            continue
        tam = r.get("tam", 70)
        f = fuente("Black", tam)
        s = r["texto"]
        ancho = f.measureText(s) + tam * 0.9
        alto = tam * 1.45
        fondo, tinta = {"naranja": ("naranja", "blanco"), "crema": ("crema", "tinta"), "noche": ("tinta", "crema")}[r.get("estilo", "naranja")]
        cv.save()
        cv.translate(r.get("x", W / 2), r.get("y", 1450))
        cv.rotate(r.get("rot", 0) + ((hervor + len(s)) % 3 - 1) * 0.15)
        cv.scale(esc, esc)
        if alfa < 0.999:
            cv.saveLayerAlpha(None, int(alfa * 255))
        sombra_capa(cv, (-ancho / 2, -alto / 2, ancho, alto), 1.1, dx=6, dy=10, blur=4)
        p = skia.Paint(AntiAlias=True, Color4f=col(fondo))
        p.setPathEffect(skia.DiscretePathEffect.Make(7, 2.6, (hervor * 5 + len(s)) % 997))
        cv.drawRect(skia.Rect.MakeXYWH(-ancho / 2, -alto / 2, ancho, alto), p)
        cv.restore()
        texto(cv, s, 0, tam * 0.36, tam=tam, peso="Black", c=tinta)
        if alfa < 0.999:
            cv.restore()
        cv.restore()


# ---------------------------------------------------------------- plan y render
def cargar(plan):
    """Prepara un plan (ruta o diccionario) para dibujarlo."""
    if isinstance(plan, str):
        with open(plan, encoding="utf-8") as fh:
            plan = json.load(fh)
    global BOCA, CARPETA_IMAGENES
    PALETA.update(plan.get("colores", {}))
    if plan.get("carpeta"):
        CARPETA_IMAGENES = plan["carpeta"]
    for esc in plan["escenas"]:
        def prep(lista, pref):
            for i, pz in enumerate(lista):
                pz.setdefault("id", f"{pref}_{i}")
                preparar(pz)
                if pz.get("hijos"):
                    prep(pz["hijos"], pz["id"])
        prep(esc["piezas"], esc.get("id", ""))
    BOCA = plan.get("boca", [])
    return plan


def fotograma(cv, plan, t, fps=30):
    hervor = int(t * plan.get("hervor_fps", 12))
    escenas = plan["escenas"]
    actual = escenas[0]
    for esc in escenas:
        if esc["inicio"] <= t:
            actual = esc
    # ¿estamos en un barrido que entra a esta escena o sale de ella?
    dur_b = plan.get("barrido_dur", 0.8)
    mostrar = actual
    u_b = None
    for esc in escenas:
        if esc.get("barrido") and abs(t - esc["inicio"]) < dur_b / 2:
            u_b = (t - esc["inicio"]) / dur_b + 0.5
            idx = escenas.index(esc)
            mostrar = escenas[idx - 1] if u_b < 0.5 and idx > 0 else esc
    dibujar_escena(cv, mostrar, t - mostrar["inicio"], hervor)
    if plan.get("recortes"):
        recortes(cv, plan["recortes"], t, hervor)
    acabado(cv)
    if u_b is not None:
        barrido(cv, u_b, colores=plan.get("barrido_colores"), hervor=hervor)
    if plan.get("palabras"):
        subtitulos(cv, plan["palabras"], t, fps)


class Lienzo:
    """Superficie de dibujo; escala < 1 para borradores rápidos."""

    def __init__(self, escala=1.0):
        self.escala = escala
        self.w, self.h = int(round(W * escala)) // 2 * 2, int(round(H * escala)) // 2 * 2
        info = skia.ImageInfo.Make(self.w, self.h, skia.ColorType.kRGBA_8888_ColorType, skia.AlphaType.kPremul_AlphaType)
        self.surf = skia.Surface.MakeRaster(info)
        self.cv = self.surf.getCanvas()

    def pinta(self, plan, t, fps=30):
        self.cv.save()
        self.cv.scale(self.escala, self.escala)
        fotograma(self.cv, plan, t, fps)
        self.cv.restore()
        return self.surf.makeImageSnapshot().tobytes()


def render(plan, salida, desde=0.0, hasta=None, fps=30, escala=1.0, ffmpeg="ffmpeg"):
    """Renderiza [desde, hasta) a un MP4 sin sonido (H.264 casi sin pérdida, para unir después)."""
    hasta = hasta if hasta is not None else plan["duracion"]
    lz = Lienzo(escala)
    cmd = [ffmpeg, "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{lz.w}x{lz.h}", "-r", str(fps), "-i", "-",
           "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", "-pix_fmt", "yuv420p", salida]
    pr = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    n = int(round((hasta - desde) * fps))
    for i in range(n):
        pr.stdin.write(lz.pinta(plan, desde + i / fps, fps))
    pr.stdin.close()
    if pr.wait():
        sys.exit("ffmpeg no pudo escribir " + salida)


def hoja(plan, salida, tiempos, fps=30):
    """Hoja de miniaturas (para revisar sin mirar fotogramas sueltos)."""
    from PIL import Image, ImageDraw
    lz = Lienzo(0.25)
    mini = [(t, Image.frombytes("RGBA", (lz.w, lz.h), lz.pinta(plan, t, fps)).convert("RGB")) for t in tiempos]
    cols = min(6, len(mini))
    filas = math.ceil(len(mini) / cols)
    out = Image.new("RGB", (cols * lz.w, filas * (lz.h + 20)), (30, 30, 30))
    d = ImageDraw.Draw(out)
    for k, (t, im) in enumerate(mini):
        out.paste(im, ((k % cols) * lz.w, (k // cols) * (lz.h + 20) + 20))
        d.text(((k % cols) * lz.w + 6, (k // cols) * (lz.h + 20) + 3), f"{t:.1f} s", fill=(255, 210, 0))
    out.save(salida, quality=85)
