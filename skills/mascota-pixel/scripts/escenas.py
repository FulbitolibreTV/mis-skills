"""Tarjetas del formato: cada una dibuja su estado en el instante t (segundos desde que empieza el paso).

Todas reciben (d, lienzo, tarjeta, ctx) y dibujan dentro de ctx.area = (x, y, ancho, alto_max).
"""
import math, os
import numpy as np
from PIL import Image, ImageDraw
from comun import fuente, rgb, mezcla, icono, caja, parte_lineas, PANEL, poli_pixel

DOTS = ["#FF5F57", "#FEBC2E", "#28C840"]
TEXTOS_TARJETA = {
    "es": {"pestana": "Escribir", "pestana2": "Vista previa", "ayuda": "Escribe un comentario", "boton": "Comentar"},
    "en": {"pestana": "Write", "pestana2": "Preview", "ayuda": "Leave a comment", "boton": "Comment"},
    "pt": {"pestana": "Escrever", "pestana2": "Pré-visualizar", "ayuda": "Escreva um comentário", "boton": "Comentar"},
}


def ease(x):
    x = max(0.0, min(1.0, x))
    return 1 - (1 - x) ** 3


def rebote(x):
    x = max(0.0, min(1.0, x))
    c1, c3 = 1.70158, 2.70158
    return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2


def item(v, clave="texto"):
    return v if isinstance(v, dict) else {clave: v}


# ---------------------------------------------------------------- piezas
def ventana(lienzo, ctx, x, y, w, h, titulo, icono_titulo=None, alfa=1.0):
    E = ctx.E
    caja(lienzo, x, y, w, h, E["tarjeta"], radio=20, borde=E["linea"])
    d = ImageDraw.Draw(lienzo)
    if PANEL["modo"] == "juego":
        g = PANEL["grosor"]
        barra_c = mezcla(E["acento"], E["tarjeta"], 0.78)
        # barra de título que respeta las esquinas de píxel
        from PIL import Image as _I
        masc = _I.new("L", (int(w) + 2, 70), 0)
        ImageDraw.Draw(masc).polygon(poli_pixel(g, g, w - g, h - g, max(1, 8 - g / 2)), fill=255)
        masc = masc.crop((0, 0, int(w) + 2, 66))
        lienzo.paste(barra_c, (int(x), int(y)), masc)
        d.line([x + g, y + 66, x + w - g, y + 66], fill=PANEL["borde"], width=g)
        for i, c in enumerate(DOTS):  # botones cuadrados, estilo píxel
            d.rectangle([x + 24 + i * 32, y + 24, x + 44 + i * 32, y + 44], fill=c, outline=PANEL["borde"], width=3)
        tx = x + 132
        if icono_titulo:
            icono(d, icono_titulo, tx + 18, y + 34, 36, PANEL["borde"], barra_c)
            tx += 46
        if titulo:
            d.text((tx, y + 34), titulo, fill=PANEL["borde"], font=fuente("pixel", 44), anchor="lm")
        return y + 66
    d.rounded_rectangle([x + 1, y + 1, x + w - 1, y + 62], 20, fill=mezcla(E["tarjeta"], E["linea"], 0.35))
    d.rectangle([x + 1, y + 40, x + w - 1, y + 62], fill=mezcla(E["tarjeta"], E["linea"], 0.35))
    d.line([x + 1, y + 62, x + w - 1, y + 62], fill=E["linea"], width=2)
    for i, c in enumerate(DOTS):
        d.ellipse([x + 26 + i * 30, y + 22, x + 44 + i * 30, y + 40], fill=c)
    tx = x + 130
    if icono_titulo:
        icono(d, icono_titulo, tx + 16, y + 31, 34, E["acento"], E["tarjeta"])
        tx += 42
    if titulo:
        d.text((tx, y + 31), titulo, fill=E["texto"], font=fuente("semibold", 30), anchor="lm")
    return y + 62


def barra(d, ctx, x, y, w, prog, alto=14, color=None):
    E = ctx.E
    d.rounded_rectangle([x, y, x + w, y + alto], alto // 2, fill=mezcla(E["linea"], E["tarjeta"], 0.2))
    if prog > 0.001:
        d.rounded_rectangle([x, y, x + max(alto, w * prog), y + alto], alto // 2, fill=color or E["ok"])


def pastilla(lienzo, ctx, cx, y, texto, icono_n=None, oscura=False, escala=1.0):
    E = ctx.E
    f = fuente("monobold" if not oscura else "semibold", int(30 * escala))
    tw = f.getlength(texto) + (44 if icono_n else 0)
    w, h = tw + 48, int(58 * escala)
    x = cx - w / 2
    fondo = "#16181D" if oscura else mezcla(E["acento"], E["tarjeta"], 0.88)
    borde = None if oscura else mezcla(E["acento"], E["tarjeta"], 0.55)
    caja(lienzo, x, y, w, h, fondo, radio=h // 2, borde=borde)
    d = ImageDraw.Draw(lienzo)
    tx = x + 24
    color = "#FFFFFF" if oscura else E["acento"]
    if icono_n:
        icono(d, icono_n, tx + 16, y + h / 2, 32, color, fondo)
        tx += 44
    d.text((tx, y + h / 2), texto, fill=color, font=f, anchor="lm")
    return w, h


def miniatura(lienzo, ctx, x, y, w, h, arch, fondo=None):
    """Miniatura de archivo: pose del personaje, imagen del usuario o icono."""
    E = ctx.E
    d = ImageDraw.Draw(lienzo)
    if arch.get("pose") or arch.get("imagen"):
        d.rounded_rectangle([x, y, x + w, y + h], 12, fill=fondo or mezcla(E["fondo"], E["tarjeta"], 0.3), outline=E["linea"], width=2)
        if arch.get("pose"):
            img = ctx.sprite_mini(arch["pose"], int(h * 0.82))
        else:
            img = ctx.imagen(arch["imagen"], w - 8, h - 8)
        if img is not None:
            lienzo.paste(img, (int(x + (w - img.width) / 2), int(y + h - img.height - (0 if arch.get("pose") else 4))), img)
    else:
        d.rounded_rectangle([x, y, x + w, y + h], 12, fill=mezcla(E["acento"], E["tarjeta"], 0.85), outline=E["linea"], width=2)
        icono(d, arch.get("icono", "documento"), x + w / 2, y + h / 2, min(w, h) * 0.5, E["acento"], E["tarjeta"])


def letras(texto, prog):
    n = int(round(len(texto) * max(0.0, min(1.0, prog))))
    return texto[:n]


# ---------------------------------------------------------------- tarjetas
def t_terminal(lienzo, tj, ctx):
    E = ctx.E
    x, y, w, hmax = ctx.area
    t, dur = ctx.t, ctx.dur
    y0 = y
    if tj.get("archivo"):
        ta = ctx.cuando(tj.get("archivo_en"), 0.0)
        p = rebote((t - ta) / 0.35)
        if t >= ta:
            ctx.sonido("pop", ta)
            pastilla(lienzo, ctx, x + w / 2, y0 - 30 + 30 * p, tj["archivo"], tj.get("archivo_icono", "audio"))
        y0 += 92
    prompt = tj.get("prompt", "")
    t_p0 = ctx.cuando(tj.get("prompt_en"), 0.12)
    v_tecleo = tj.get("velocidad", 0.038)
    t_p1 = t_p0 + min(len(prompt) * v_tecleo, dur * 0.45)
    salida = [item(s) for s in tj.get("salida", [])]
    n = len(salida)
    prev = t_p1
    tope = dur - 0.5 - (1.3 if tj.get("barra") else 0) - (0.4 if tj.get("fin") else 0)
    for i, s in enumerate(salida):
        defecto = max(prev + 0.25, t_p1 + 0.15 + (dur * 0.85 - t_p1) * (i / max(1, n)))
        s["_t"] = ctx.cuando(s.get("en"), min(defecto, max(prev + 0.12, tope - (n - 1 - i) * 0.2)))
        prev = s["_t"]
    t_barra = ctx.cuando(tj.get("barra_en"), min(max([s["_t"] for s in salida] + [t_p1]) + 0.2, dur - 1.3)) if tj.get("barra") else None
    t_fin = ctx.cuando(tj.get("fin_en"), min((t_barra or t_p1) + max(0.6, dur * 0.25), dur - 0.55)) if tj.get("fin") else None

    fm = fuente("mono", 38)
    lh = 60
    lineas_prompt = parte_lineas(prompt, fm, w - 110) if prompt else []
    visibles = [s for s in salida if t >= s["_t"]]
    filas = len(lineas_prompt) + sum(len(parte_lineas(s["texto"], fm, w - 110)) for s in visibles)
    filas += (1 if t_barra is not None and t >= t_barra else 0) + (1 if t_fin is not None and t >= t_fin else 0)
    h = 62 + 36 + max(1, filas) * lh + 18
    yc = ventana(lienzo, ctx, x, y0, w, h, tj.get("titulo", "Claude"), tj.get("icono", "chispa"))
    d = ImageDraw.Draw(lienzo)
    yy = yc + 26
    # prompt
    escrito = letras(prompt, (t - t_p0) / max(0.01, t_p1 - t_p0)) if t >= t_p0 else ""
    if t_p0 <= t < t_p1 + 0.05:
        ctx.tecleo(t_p0, t_p1)
    d.rounded_rectangle([x + 20, yy - 8, x + w - 20, yy - 8 + len(lineas_prompt or [""]) * lh + 8], 12,
                        fill=mezcla(E["fondo"], E["tarjeta"], 0.55))
    resto = escrito
    ultimo_xy = (x + 70, yy)
    for i, lp in enumerate(lineas_prompt or [""]):
        trozo = resto[:len(lp)]; resto = resto[len(lp):].lstrip()
        if i == 0:
            d.text((x + 36, yy + lh / 2 - 6), ">", fill=E["acento"], font=fuente("monobold", 38), anchor="lm")
        d.text((x + 70, yy + lh / 2 - 6), trozo, fill=E["texto"], font=fm, anchor="lm")
        if trozo or i == 0:
            ultimo_xy = (x + 70 + fm.getlength(trozo), yy)
        yy += lh
    yy += 6
    for s in visibles:
        ctx.sonido("check" if s["texto"].startswith("✓") else "pop", s["_t"])
        a = ease((t - s["_t"]) / 0.2)
        txt = s["texto"]
        color = E["ok"] if txt.startswith("✓") else E["suave"]
        if txt.startswith("✓"):
            icono(d, "check", x + 52, yy + lh / 2 - 6, 36, mezcla(E["tarjeta"], E["ok"], a))
            txt = txt[1:].strip()
        elif txt.startswith("•"):
            d.ellipse([x + 46, yy + lh / 2 - 12, x + 58, yy + lh / 2], fill=mezcla(E["tarjeta"], E["texto"], a))
            txt = txt[1:].strip(); color = E["texto"]
        for ln in parte_lineas(txt, fm, w - 110):
            d.text((x + 76 - 10 * (1 - a), yy + lh / 2 - 6), ln, fill=mezcla(E["tarjeta"], color, a), font=fm, anchor="lm")
            yy += lh
    if t_barra is not None and t >= t_barra:
        ctx.sonido("barra", t_barra)
        dur_b = tj.get("barra_dur", max(0.5, min(1.4, ((t_fin or (t_barra + 1.2)) - t_barra) * 0.9)))
        p = ease((t - t_barra) / dur_b)
        d.text((x + 36, yy + lh / 2 - 6), tj["barra"], fill=E["texto"], font=fm, anchor="lm")
        bx = x + 60 + fm.getlength(tj["barra"])
        barra(d, ctx, bx, yy + lh / 2 - 13, x + w - 40 - bx, p)
        yy += lh
    if t_fin is not None and t >= t_fin:
        ctx.sonido("exito", t_fin)
        icono(d, "check", x + 52, yy + lh / 2 - 6, 30, E["ok"])
        d.text((x + 76, yy + lh / 2 - 6), tj["fin"].lstrip("✓ "), fill=E["ok"], font=fuente("monobold", 38), anchor="lm")
    # cursor parpadeante
    if (t * 2) % 1 < 0.55 and t < (t_fin or 99) and t >= t_p0:
        cx_, cy_ = ultimo_xy
        d.rectangle([cx_ + 4, cy_ + 2, cx_ + 20, cy_ + lh - 14], fill=E["acento"])


def t_carpeta(lienzo, tj, ctx, archivos=None):
    E = ctx.E
    x, y, w, hmax = ctx.area
    t, dur = ctx.t, ctx.dur
    archivos = archivos or [item(a, "nombre") for a in tj.get("archivos", [])]
    n = len(archivos)
    cols = min(4, max(1, n)) if n <= 4 else (4 if n <= 8 else 5)
    filas = math.ceil(n / cols) if n else 1
    tw = (w - 40 - (cols - 1) * 22) / cols
    th = min(230, tw * 1.35) if not tj.get("cuadradas") else tw * 0.95
    con_barras = tj.get("barras", False)
    extra_pie = 100 if tj.get("pie") else 0
    con_nombres = any(a.get("nombre") for a in archivos) or tj.get("etiqueta")
    fila_nombre = 70 if con_nombres else 14
    th = max(80, min(th, (hmax - 62 - 40 - extra_pie) / filas - fila_nombre - (24 if con_barras else 0)))
    if tj.get("cuadradas"):
        tw_v = tw
    h = 62 + 30 + filas * (th + fila_nombre + (24 if con_barras else 0)) + 10
    yc = ventana(lienzo, ctx, x, y, w, h, tj.get("nombre", "carpeta"), "carpeta")
    d = ImageDraw.Draw(lienzo)
    t0 = ctx.cuando(tj.get("en"), 0.1)
    paso = tj.get("cadencia", min(0.32, dur * 0.4 / max(1, n)))
    t_barras = ctx.cuando(tj.get("barras_en"), min(t0 + n * paso + 0.1, dur - 1.6))
    t_etq = ctx.cuando(tj.get("etiqueta_en"), min(t_barras + (0.8 if con_barras else 0.1) + 0.2, dur - 0.5 - n * 0.1)) if tj.get("etiqueta") else None
    prev = t0 - paso
    for i, a in enumerate(archivos):
        ta = ctx.cuando(a.get("en"), max(prev + 0.12, t0 + i * paso))
        prev = ta
        if t < ta:
            continue
        ctx.sonido("pop", ta)
        c, r = i % cols, i // cols
        ax = x + 20 + c * (tw + 22)
        ay = yc + 24 + r * (th + fila_nombre + (24 if con_barras else 0))
        s = rebote((t - ta) / 0.3)
        mw, mh = tw * (0.6 + 0.4 * s), th * (0.6 + 0.4 * s)
        miniatura(lienzo, ctx, ax + (tw - mw) / 2, ay + (th - mh) / 2, mw, mh, a)
        ly = ay + th + 10
        if con_barras:
            pb = ease((t - t_barras - i * 0.12) / 0.7)
            barra(d, ctx, ax + 6, ly, tw - 12, pb, alto=12)
            ly += 24
        if t_etq is not None and t >= t_etq + i * 0.1:
            ctx.sonido("check", t_etq + i * 0.1)
            etq = tj["etiqueta"].lstrip("✓ ")
            f = fuente("semibold", 24 if tw < 200 else 28)
            tw2 = f.getlength(etq) + 30
            icono(d, "check", ax + tw / 2 - tw2 / 2 + 10, ly + 20, 22, E["ok"])
            d.text((ax + tw / 2 - tw2 / 2 + 28, ly + 20), etq, fill=E["ok"], font=f, anchor="lm")
        else:
            d.text((ax + tw / 2, ly + 22), a.get("nombre", ""), fill=E["texto"], font=fuente("bold", 30), anchor="mm")
    if tj.get("pie"):
        tp = ctx.cuando(tj.get("pie_en"), t0 + n * paso + 0.3)
        if t >= tp:
            ctx.sonido("pop", tp)
            s = rebote((t - tp) / 0.3)
            pastilla(lienzo, ctx, x + w / 2, y + h + 24 + 10 * (1 - s), tj["pie"], tj.get("pie_icono", "reloj"))


def t_poses(lienzo, tj, ctx):
    archivos = [{"pose": p, "nombre": ""} for p in (tj.get("poses") or ctx.lista_poses())][:tj.get("max", 8)]
    tj2 = dict(nombre=tj.get("nombre", "poses"), pie=tj.get("pie"), pie_icono=tj.get("pie_icono", "chispa"),
               cuadradas=False, cadencia=tj.get("cadencia"), en=tj.get("en"))
    tj2 = {k: v for k, v in tj2.items() if v is not None}
    t_carpeta(lienzo, tj2, ctx, archivos)


def t_bocas(lienzo, tj, ctx):
    E = ctx.E
    x, y, w, hmax = ctx.area
    h = 360
    caja(lienzo, x, y, w, h, E["tarjeta"], radio=20, borde=E["linea"])
    d = ImageDraw.Draw(lienzo)
    d.text((x + w / 2, y + 52), tj.get("titulo", "Bocas sincronizadas"), fill=E["texto"], font=fuente("bold", 38), anchor="mm")
    vis = ["A", "B", "C", "D", "E", "F", "X"]
    act = ctx.visema_actual()
    tw = (w - 60) / len(vis)
    for i, v in enumerate(vis):
        img = ctx.boca_mini(v, int(tw - 14))
        bx = x + 30 + i * tw
        sel = (v == act)
        if img is not None:
            if sel:
                d.rounded_rectangle([bx, y + 100, bx + tw - 8, y + 100 + img.height + 16], 12, outline=E["acento"], width=5)
            lienzo.paste(img, (int(bx + 4), y + 108), img)
    # karaoke: palabras de la frase actual
    pal = ctx.palabras_cerca(5)
    f = fuente("semibold", 36)
    total = sum(f.getlength(p["t"]) + 26 for p in pal)
    px = x + w / 2 - total / 2
    for p in pal:
        pw = f.getlength(p["t"]) + 26
        if p.get("actual"):
            d.rounded_rectangle([px, y + 262, px + pw - 6, y + 316], 10, fill=E["acento"])
            d.text((px + pw / 2 - 3, y + 289), p["t"], fill="#FFFFFF", font=f, anchor="mm")
        else:
            d.text((px + pw / 2 - 3, y + 289), p["t"], fill=E["texto"] if p.get("dicha") else E["suave"], font=f, anchor="mm")
        px += pw


def _onda(d, ctx, x, y, w, h, color, barras=46, en_vivo=True):
    env = ctx.envolvente(barras)
    bw = w / barras
    for i in range(barras):
        v = env[i] if en_vivo else 0.25 + 0.2 * math.sin(i * 0.7 + ctx.t * 6)
        bh = max(8, h * min(1.0, v))
        d.rounded_rectangle([x + i * bw + bw * 0.2, y + h / 2 - bh / 2, x + (i + 1) * bw - bw * 0.2, y + h / 2 + bh / 2],
                            int(bw * 0.3), fill=color)


def t_onda(lienzo, tj, ctx):
    E = ctx.E
    x, y, w, hmax = ctx.area
    t, dur = ctx.t, ctx.dur
    h = 380
    t0 = ctx.cuando(tj.get("en"), 0.0)
    a = ease((t - t0) / 0.3)
    if t < t0:
        return
    ctx.sonido("pop", t0)
    caja(lienzo, x, y + 20 * (1 - a), w, h, E["tarjeta"], radio=20, borde=E["linea"])
    d = ImageDraw.Draw(lienzo)
    yy = y + 20 * (1 - a)
    icono(d, "audio", x + 50, yy + 50, 40, E["texto"])
    d.text((x + 84, yy + 50), tj.get("titulo", "Voz con IA"), fill=E["texto"], font=fuente("bold", 34), anchor="lm")
    if tj.get("insignia"):
        f = fuente("semibold", 26)
        bw = f.getlength(tj["insignia"]) + 34
        d.rounded_rectangle([x + w - 30 - bw, yy + 30, x + w - 30, yy + 72], 21, fill=mezcla(E["ok"], E["tarjeta"], 0.85), outline=mezcla(E["ok"], E["tarjeta"], 0.4), width=2)
        d.text((x + w - 30 - bw / 2, yy + 51), tj["insignia"], fill=E["ok"], font=f, anchor="mm")
    _onda(d, ctx, x + 40, yy + 110, w - 80, 150, E["acento"])
    d.text((x + 40, yy + 320), tj.get("etiqueta", "Generando la voz"), fill=E["texto"], font=fuente("semibold", 32), anchor="lm")
    bx = x + 70 + fuente("semibold", 32).getlength(tj.get("etiqueta", "Generando la voz"))
    p = ease((t - t0) / max(0.6, dur * 0.85))
    barra(d, ctx, bx, yy + 312, x + w - 40 - bx, p)
    if p >= 1:
        ctx.sonido("check", t0 + max(0.6, dur * 0.85))


def t_grabar(lienzo, tj, ctx):
    E = ctx.E
    x, y, w, hmax = ctx.area
    t = ctx.t
    t0 = ctx.cuando(tj.get("en"), 0.0)
    if t < t0:
        return
    ctx.sonido("rec", t0)
    a = ease((t - t0) / 0.3)
    h = 300
    yy = y + 20 * (1 - a)
    caja(lienzo, x, yy, w, h, E["tarjeta"], radio=20, borde=E["linea"])
    d = ImageDraw.Draw(lienzo)
    icono(d, "micro", x + 120, yy + h / 2, 170, E["texto"])
    rojo = "#E5383B"
    if (t * 1.6) % 1 < 0.6:
        d.ellipse([x + 250, yy + 52, x + 276, yy + 78], fill=rojo)
    d.text((x + 288, yy + 65), "REC", fill=rojo, font=fuente("bold", 32), anchor="lm")
    _onda(d, ctx, x + 250, yy + 100, w - 300, 100, rojo, barras=30)
    d.text((x + 250, yy + 240), tj.get("etiqueta", "Grabando tu guion"), fill=E["texto"], font=fuente("semibold", 34), anchor="lm")


def formato_num(v, fmt):
    if fmt == "k":
        return (f"{v / 1000:.1f}K".replace(".0K", "K")) if v >= 1000 else str(int(v))
    s = f"{int(v):,}".replace(",", ".")
    return s


def t_contador(lienzo, tj, ctx):
    E = ctx.E
    x, y, w, hmax = ctx.area
    t, dur = ctx.t, ctx.dur
    t0 = ctx.cuando(tj.get("en"), 0.0)
    if t < t0:
        return
    ctx.sonido("pop", t0)
    a = rebote((t - t0) / 0.35)
    h = 330
    yy = y + 20 * (1 - a)
    caja(lienzo, x, yy, w, h, E["tarjeta"], radio=20, borde=E["linea"])
    d = ImageDraw.Draw(lienzo)
    miniatura(lienzo, ctx, x + 26, yy + 26, 200, h - 52, {"pose": tj.get("pose", ctx.pose_inicial())} if not tj.get("imagen") else {"imagen": tj["imagen"]},
              fondo=mezcla(E["texto"], E["tarjeta"], 0.05) if tj.get("miniatura_oscura") else None)
    tx = x + 260
    d.text((tx, yy + 60), tj.get("titulo", "@tu_cuenta"), fill=E["acento"], font=fuente("semibold", 32), anchor="lm")
    animar = tj.get("animar", abs(tj.get("valor", 1000) - tj.get("desde", 0)) >= 100)
    p = ease((t - t0 - 0.1) / max(0.5, dur * 0.55)) if animar else (1.0 if t >= t0 + 0.1 else 0.0)
    v = tj.get("desde", 0) + (tj.get("valor", 1000) - tj.get("desde", 0)) * p
    icono(d, tj.get("icono", "corazon"), tx + 34, yy + 150, 70, "#E5383B" if tj.get("icono", "corazon") == "corazon" else E["acento"])
    d.text((tx + 84, yy + 150), formato_num(v, tj.get("formato", "k")), fill=E["texto"], font=fuente("extrabold", 92), anchor="lm")
    d.text((tx, yy + 225), tj.get("etiqueta", "me gusta"), fill=E["suave"], font=fuente("medium", 30), anchor="lm")
    if tj.get("insignia") and p > 0.98:
        ctx.sonido("check", t0 + 0.1 + max(0.5, dur * 0.55))
        f = fuente("semibold", 26)
        bw = f.getlength(tj["insignia"]) + 60
        mala = tj.get("insignia_tipo") == "mal"
        ci = "#D93636" if mala else E["ok"]
        d.rounded_rectangle([tx, yy + 258, tx + bw, yy + 300], 21, fill=mezcla(ci, E["tarjeta"], 0.85), outline=mezcla(ci, E["tarjeta"], 0.4), width=2)
        icono(d, "cruz" if mala else "check", tx + 24, yy + 279, 20, ci)
        d.text((tx + 40, yy + 279), tj["insignia"], fill=ci, font=f, anchor="lm")


def t_monigote(lienzo, tj, ctx):
    E = ctx.E
    x, y, w, hmax = ctx.area
    t, dur = ctx.t, ctx.dur
    d = ImageDraw.Draw(lienzo)
    K = E["texto"]
    k = max(0.5, min(1.0, (hmax - 30) / 560))
    cx, top = x + 250, y + 150 * k
    lw = 9
    t0 = ctx.cuando(tj.get("en"), 0.0)
    if t < t0:
        return
    ctx.sonido("pop", t0)
    # monigote
    d.ellipse([cx - 55 * k, top, cx + 55 * k, top + 110 * k], outline=K, width=lw)
    triste = tj.get("cara", "triste") == "triste"
    d.ellipse([cx - 26 * k, top + 36 * k, cx - 14 * k, top + 48 * k], fill=K); d.ellipse([cx + 14 * k, top + 36 * k, cx + 26 * k, top + 48 * k], fill=K)
    if triste:
        d.arc([cx - 26 * k, top + 70 * k, cx + 26 * k, top + 100 * k], 200, 340, fill=K, width=6)
    else:
        d.arc([cx - 26 * k, top + 54 * k, cx + 26 * k, top + 86 * k], 20, 160, fill=K, width=6)
    d.line([cx, top + 110 * k, cx, top + 280 * k], fill=K, width=lw)
    d.line([cx - 75 * k, top + 210 * k, cx, top + 150 * k, cx + 75 * k, top + 210 * k], fill=K, width=lw, joint="curve")
    d.line([cx - 70 * k, top + 400 * k, cx, top + 280 * k, cx + 70 * k, top + 400 * k], fill=K, width=lw, joint="curve")
    # icono encima
    if tj.get("icono"):
        ti = ctx.cuando(tj.get("icono_en"), 0.25)
        if t >= ti:
            ctx.sonido("tic", ti)
            ic_y = top - 86 * k
            icono(d, tj["icono"], cx, ic_y, 120 * k, K)
            if tj["icono"] == "reloj":  # aguja que gira
                ang = (t - ti) * 6
                d.line([cx, ic_y + 5 * k, cx + 30 * k * math.sin(ang), ic_y + 5 * k - 30 * k * math.cos(ang)], fill=E["acento"], width=7)
            tt = ctx.cuando(tj.get("tachar_en"), dur * 0.55) if tj.get("tachar") else None
            if tt is not None and t >= tt:
                ctx.sonido("tachar", tt)
                p = ease((t - tt) / 0.2)
                r = 74 * k
                d.line([cx - r, ic_y - r, cx - r + 2 * r * p, ic_y - r + 2 * r * p], fill="#E5383B", width=12)
                if p > 0.5:
                    q = ease((t - tt - 0.1) / 0.2)
                    d.line([cx + r, ic_y - r, cx + r - 2 * r * q, ic_y - r + 2 * r * q], fill="#E5383B", width=12)
    # bocadillo
    if tj.get("bocadillo"):
        tb = ctx.cuando(tj.get("bocadillo_en"), 0.35)
        if t >= tb:
            ctx.sonido("pop", tb)
            s = rebote((t - tb) / 0.3)
            f = fuente("bold", 50)
            lns = parte_lineas(tj["bocadillo"], f, 400)
            bw = max(f.getlength(l) for l in lns) + 60
            bh = len(lns) * 62 + 44
            bx, by = cx + 130 * k, top - 60 * k
            bw2, bh2 = bw * s, bh * s
            d.rounded_rectangle([bx, by, bx + bw2, by + bh2], 22, fill=E["tarjeta"], outline=K, width=4)
            d.polygon([(bx + 2, by + bh2 * 0.55), (bx - 26, by + bh2 * 0.75), (bx + 2, by + bh2 * 0.8)], fill=K)
            d.polygon([(bx + 5, by + bh2 * 0.6), (bx - 14, by + bh2 * 0.73), (bx + 5, by + bh2 * 0.75)], fill=E["tarjeta"])
            if s > 0.9:
                for i, l in enumerate(lns):
                    d.text((bx + 30, by + 24 + i * 62), l, fill=K, font=f)


def t_iconos(lienzo, tj, ctx):
    E = ctx.E
    x, y, w, hmax = ctx.area
    t, dur = ctx.t, ctx.dur
    items = [item(i, "icono") for i in tj.get("items", [])]
    n = len(items)
    cols = min(5, max(1, n))
    tam = min(230, (w - (cols - 1) * 28) / cols, (hmax - 40) / math.ceil(max(1, n) / cols) - 80)
    t0 = ctx.cuando(tj.get("en"), 0.05)
    cad = tj.get("cadencia", min(0.25, dur * 0.55 / max(1, n)))
    d = ImageDraw.Draw(lienzo)
    filas = math.ceil(n / cols)
    total_w = cols * tam + (cols - 1) * 24
    prev = t0 - cad
    for i, it in enumerate(items):
        ta = ctx.cuando(it.get("en"), max(prev + 0.1, t0 + i * cad))
        prev = ta
        if t < ta:
            continue
        ctx.sonido("pop", ta)
        s = rebote((t - ta) / 0.3)
        c, r = i % cols, i // cols
        en_fila = min(cols, n - r * cols)
        fila_w = en_fila * tam + (en_fila - 1) * 24
        ix = x + (w - fila_w) / 2 + c * (tam + 24) + tam / 2
        iy = y + 20 + r * (tam + 70) + tam / 2
        tt = tam * s
        color = it.get("color", E["acento"])
        caja(lienzo, ix - tt / 2, iy - tt / 2, tt, tt, E["tarjeta"], radio=int(tt * 0.22), borde=E["linea"])
        if it.get("pose"):
            img = ctx.sprite_mini(it["pose"], int(tt * 0.8))
            if img:
                lienzo.paste(img, (int(ix - img.width / 2), int(iy + tt / 2 - img.height - 4)), img)
        else:
            icono(d, it.get("icono", "chispa"), ix, iy, tt * 0.56, color, E["tarjeta"])
        if it.get("texto") and s > 0.9:
            d.text((ix, iy + tam / 2 + 34), it["texto"], fill=E["texto"], font=fuente("bold", 34), anchor="mm")
    del filas, total_w
    if tj.get("prompt"):
        sub = dict(tj); sub.pop("items"); sub["prompt_en"] = tj.get("prompt_en") or (t0 + n * cad + 0.1)
        filas_alto = math.ceil(n / cols) * (tam + 70) + 30
        ctx2 = ctx.sub_area(y_extra=filas_alto)
        t_terminal(lienzo, {k: v for k, v in sub.items() if k in ("prompt", "prompt_en", "salida", "titulo", "icono", "fin", "fin_en")}, ctx2)


def t_dictado(lienzo, tj, ctx):
    E = ctx.E
    x, y, w, hmax = ctx.area
    t, dur = ctx.t, ctx.dur
    texto = tj.get("texto", "")
    t0 = ctx.cuando(tj.get("en"), 0.05)
    t1 = ctx.cuando(tj.get("hasta"), t0 + min(dur * 0.8, len(texto) * 0.045))
    p = (t - t0) / max(0.1, t1 - t0)
    escrito = letras(texto, p)
    d = ImageDraw.Draw(lienzo)
    # icono de dictado
    caja(lienzo, x, y, 84, 84, mezcla(E["acento"], E["tarjeta"], 0.7), radio=20)
    _onda(d, ctx, x + 14, y + 22, 56, 40, E["tarjeta"], barras=7)
    # pastilla oscura con el texto en directo
    px0, pw = x + 104, w - 104
    oscuro_bg = (sum(rgb(E["fondo"])[:3]) / 3) < 100
    d.rounded_rectangle([px0, y + 6, px0 + pw, y + 78], 36, fill="#16181D" if not oscuro_bg else "#2C3550",
                        outline=PANEL["borde"] if not oscuro_bg else E["acento"], width=3)
    if (t * 1.6) % 1 < 0.6:
        d.ellipse([px0 + 26, y + 30, px0 + 50, y + 54], fill="#E5383B")
    f = fuente("semibold", 32)
    vis = escrito
    while vis and f.getlength(vis) > pw - 110:
        vis = vis[1:]
    d.text((px0 + 68, y + 42), vis, fill="#FFFFFF", font=f, anchor="lm")
    # la terminal recibe el texto
    sub = {"titulo": tj.get("titulo", "Claude"), "prompt": texto, "prompt_en": t0, "velocidad": (t1 - t0) / max(1, len(texto))}
    if tj.get("salida"):
        sub["salida"] = tj["salida"]
    t_terminal(lienzo, sub, ctx.sub_area(y_extra=110))
    if t0 <= t <= t1:
        ctx.tecleo(t0, t1)


def t_render(lienzo, tj, ctx):
    E = ctx.E
    x, y, w, hmax = ctx.area
    t, dur = ctx.t, ctx.dur
    archivos = tj.get("archivos", ["borrador-01.mp4", "borrador-02.mp4", "final.mp4"])
    h = 62 + 60 + len(archivos) * 64 + 40
    h = max(h, 420)
    yc = ventana(lienzo, ctx, x, y, w, h, tj.get("nombre", "renders"), "carpeta")
    d = ImageDraw.Draw(lienzo)
    t_clic = ctx.cuando(tj.get("clic_en"), dur * 0.35)
    lista_w = w * 0.5
    ly = yc + 50
    sel = len(archivos) - 1
    for i, a in enumerate(archivos):
        fy = ly + i * 64
        activo = (i == sel and t >= t_clic)
        if activo:
            d.rounded_rectangle([x + 24, fy - 6, x + lista_w, fy + 52], 10, fill=E["acento"])
        col = "#FFFFFF" if activo else E["texto"]
        icono(d, "documento", x + 52, fy + 23, 34, col if activo else E["suave"], E["acento"] if activo else E["tarjeta"])
        d.text((x + 82, fy + 23), a, fill=col, font=fuente("medium", 28), anchor="lm")
    # cursor que va a la última fila
    t_mov = t_clic - 0.45
    if t >= t_mov - 0.3:
        p = ease((t - t_mov) / 0.45)
        cx0, cy0 = x + lista_w * 0.9, ly - 20
        cx1, cy1 = x + lista_w * 0.62, ly + sel * 64 + 30
        cx_, cy_ = cx0 + (cx1 - cx0) * p, cy0 + (cy1 - cy0) * p
        if t >= t_clic:
            ctx.sonido("clic", t_clic)
        d.polygon([(cx_, cy_), (cx_, cy_ + 44), (cx_ + 12, cy_ + 33), (cx_ + 22, cy_ + 52), (cx_ + 30, cy_ + 48),
                   (cx_ + 20, cy_ + 30), (cx_ + 36, cy_ + 30)], fill="#111111", outline="#FFFFFF")
    # vista previa del vídeo
    if t >= t_clic + 0.1:
        ctx.sonido("pop", t_clic + 0.1)
        s = rebote((t - t_clic - 0.1) / 0.35)
        pw_, ph_ = (w - lista_w - 70) * s, (h - 100) * s
        px_, py_ = x + lista_w + 40 + (w - lista_w - 70) * (1 - s) / 2, yc + 20
        mini = ctx.miniatura_video(int(w - lista_w - 70), int(h - 100))
        if mini is not None:
            m2 = mini.resize((max(1, int(pw_)), max(1, int(ph_))))
            caja(lienzo, px_, py_, pw_, ph_, E["tarjeta"], radio=12, borde=E["linea"])
            lienzo.paste(m2, (int(px_), int(py_)))
            if s > 0.95 and (t * 2) % 1 < 0.7:  # punto de reproducción
                d.ellipse([px_ + pw_ / 2 - 34, py_ + ph_ / 2 - 34, px_ + pw_ / 2 + 34, py_ + ph_ / 2 + 34], fill=(0, 0, 0, 120) if lienzo.mode == "RGBA" else "#333333")
                d.polygon([(px_ + pw_ / 2 - 10, py_ + ph_ / 2 - 18), (px_ + pw_ / 2 - 10, py_ + ph_ / 2 + 18), (px_ + pw_ / 2 + 18, py_ + ph_ / 2)], fill="#FFFFFF")


def t_comentario(lienzo, tj, ctx):
    E = ctx.E
    x, y, w, hmax = ctx.area
    t, dur = ctx.t, ctx.dur
    palabra = tj.get("palabra", "PIXEL")
    h = 330
    caja(lienzo, x, y, w, h, E["tarjeta"], radio=20, borde=E["linea"])
    d = ImageDraw.Draw(lienzo)
    T = TEXTOS_TARJETA.get(ctx.reel.idioma, TEXTOS_TARJETA["es"])
    p1, p2 = tj.get("pestana", T["pestana"]), tj.get("pestana2", T["pestana2"])
    d.text((x + 34, y + 44), p1, fill=E["texto"], font=fuente("semibold", 28), anchor="lm")
    d.line([x + 30, y + 66, x + 30 + fuente("semibold", 28).getlength(p1) + 8, y + 66], fill=E["acento"], width=4)
    d.text((x + 64 + fuente("semibold", 28).getlength(p1), y + 44), p2, fill=E["suave"], font=fuente("medium", 28), anchor="lm")
    bx, by, bw, bh = x + 28, y + 86, w - 56, 150
    d.rounded_rectangle([bx, by, bx + bw, by + bh], 12, fill=E["tarjeta"], outline=E["acento"], width=4)
    t0 = ctx.cuando(tj.get("en"), 0.25)
    t1 = t0 + 0.12 * len(palabra)
    escrito = letras(palabra, (t - t0) / (t1 - t0)) if t >= t0 else ""
    if t0 <= t <= t1 + 0.05:
        ctx.tecleo(t0, t1, cada=0.12)
    f = fuente("monobold", 110)
    d.text((bx + 34, by + bh / 2 + 4), escrito, fill=E["texto"], font=f, anchor="lm")
    if (t * 2) % 1 < 0.55:
        cxp = bx + 40 + f.getlength(escrito)
        d.rectangle([cxp, by + 30, cxp + 6, by + bh - 30], fill=E["acento"])
    d.text((x + 34, y + h - 50), tj.get("ayuda", T["ayuda"]), fill=E["suave"], font=fuente("medium", 26), anchor="lm")
    bt = tj.get("boton", T["boton"])
    fb = fuente("bold", 30)
    btw = fb.getlength(bt) + 56
    pulsado = t >= t1 + 0.35
    if pulsado:
        ctx.sonido("clic", t1 + 0.35)
    col = E["ok"] if not pulsado else mezcla(E["ok"], "#000000", 0.2)
    d.rounded_rectangle([x + w - 30 - btw, y + h - 76, x + w - 30, y + h - 24], 12, fill=col)
    d.text((x + w - 30 - btw / 2, y + h - 50), bt, fill="#FFFFFF", font=fb, anchor="mm")
    if tj.get("texto"):
        tt = ctx.cuando(tj.get("texto_en"), t1 + 0.4)
        if t >= tt:
            ctx.sonido("exito", tt)
            a = ease((t - tt) / 0.3)
            ft = fuente("bold", 44)
            for i, ln in enumerate(parte_lineas(tj["texto"], ft, w - 40)):
                d.text((x + w / 2, y + h + 60 + i * 58 + 12 * (1 - a)), ln, fill=mezcla(E["fondo"], E["texto"], a), font=ft, anchor="mm")


def t_lista(lienzo, tj, ctx):
    E = ctx.E
    x, y, w, hmax = ctx.area
    t, dur = ctx.t, ctx.dur
    items = [item(i) for i in tj.get("items", [])]
    n = len(items)
    lh = 100
    h = 40 + n * lh + (80 if tj.get("titulo") else 0)
    caja(lienzo, x, y, w, h, E["tarjeta"], radio=20, borde=E["linea"])
    d = ImageDraw.Draw(lienzo)
    yy = y + 30
    if tj.get("titulo"):
        d.text((x + 36, yy + 22), tj["titulo"], fill=E["texto"], font=fuente("extrabold", 44), anchor="lm")
        yy += 80
    t0 = ctx.cuando(tj.get("en"), 0.1)
    cad = tj.get("cadencia", dur * 0.7 / max(1, n))
    f = fuente("bold", 44)
    prev = t0 - cad
    for i, it in enumerate(items):
        ta = ctx.cuando(it.get("en"), max(prev + 0.3, t0 + i * cad))
        prev = ta
        hecho = t >= ta
        if hecho:
            ctx.sonido("check", ta)
        a = ease((t - ta) / 0.2) if hecho else 0
        cy = yy + i * lh + lh / 2 - 10
        d.rounded_rectangle([x + 36, cy - 28, x + 92, cy + 28], 10, fill=mezcla(E["linea"], E["ok"], a), outline=PANEL["borde"] if PANEL["modo"] == "juego" else None, width=3)
        if hecho:
            icono(d, "check", x + 64, cy, 36, "#FFFFFF")
        d.text((x + 116, cy), it["texto"], fill=mezcla(E["suave"], E["texto"], a), font=f, anchor="lm")


def t_imagen(lienzo, tj, ctx):
    E = ctx.E
    x, y, w, hmax = ctx.area
    t = ctx.t
    t0 = ctx.cuando(tj.get("en"), 0.05)
    if t < t0:
        return
    ctx.sonido("pop", t0)
    s = rebote((t - t0) / 0.35)
    img = ctx.imagen(tj["archivo"], int(w * tj.get("ancho", 0.9)), int(min(hmax, 480) * 1.0))
    if img is None:
        return
    iw, ih = int(img.width * s), int(img.height * s)
    if iw < 2 or ih < 2:
        return
    im2 = img.resize((iw, ih))
    ix, iy = int(x + (w - iw) / 2), int(y + (img.height - ih) / 2 + 10)
    if tj.get("marco", True):
        caja(lienzo, ix - 10, iy - 10, iw + 20, ih + 20, E["tarjeta"], radio=18, borde=E["linea"])
    lienzo.paste(im2, (ix, iy), im2)
    if tj.get("pie"):
        d = ImageDraw.Draw(lienzo)
        d.text((x + w / 2, iy + ih + 50), tj["pie"], fill=E["texto"], font=fuente("semibold", 34), anchor="mm")


def t_cifra(lienzo, tj, ctx):
    E = ctx.E
    x, y, w, hmax = ctx.area
    t, dur = ctx.t, ctx.dur
    t0 = ctx.cuando(tj.get("en"), 0.05)
    if t < t0:
        return
    ctx.sonido("pop", t0)
    d = ImageDraw.Draw(lienzo)
    val = tj.get("valor", "0")
    s = rebote((t - t0) / 0.35)
    try:
        num = float(str(val).replace(".", "").replace(",", "."))
        animar = tj.get("animar", num >= 100)
        p = ease((t - t0) / max(0.4, dur * 0.4)) if animar else 1.0
        desde = float(tj.get("desde", 0))
        txt = tj.get("prefijo", "") + formato_num(desde + (num - desde) * p, tj.get("formato", "puntos")) + tj.get("sufijo", "")
    except ValueError:
        txt = str(val)
    f = fuente("black", int(230 * (0.7 + 0.3 * s)))
    d.text((x + w / 2, y + 140), txt, fill=E["acento"], font=f, anchor="mm")
    if tj.get("texto"):
        ft = fuente("bold", 46)
        for i, ln in enumerate(parte_lineas(tj["texto"], ft, w - 60)):
            d.text((x + w / 2, y + 300 + i * 58), ln, fill=E["texto"], font=ft, anchor="mm")


TARJETAS = {
    "terminal": t_terminal, "carpeta": t_carpeta, "poses": t_poses, "bocas": t_bocas, "onda": t_onda,
    "grabar": t_grabar, "contador": t_contador, "monigote": t_monigote, "iconos": t_iconos,
    "dictado": t_dictado, "render": t_render, "comentario": t_comentario, "lista": t_lista,
    "imagen": t_imagen, "cifra": t_cifra,
}
