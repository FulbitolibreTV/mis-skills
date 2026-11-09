"""Utilidades comunes de historia-papel: rutas, ffmpeg, JSON, palabras y versiones."""
import json, os, re, shutil, sys, unicodedata

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
FPS = 30


def _ffmpeg():
    f = shutil.which("ffmpeg")
    if f:
        return f
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:  # noqa: BLE001
        return "ffmpeg"


FFMPEG = _ffmpeg()


def cargar_json(ruta):
    try:
        with open(ruta, encoding="utf-8") as fh:
            return json.load(fh)
    except FileNotFoundError:
        sys.exit(f"No encuentro {ruta}.")
    except json.JSONDecodeError as e:
        sys.exit(f"{ruta} no es un JSON válido (línea {e.lineno}, columna {e.colno}): {e.msg}")


def guardar_json(ruta, datos, sangria=1):
    os.makedirs(os.path.dirname(os.path.abspath(ruta)), exist_ok=True)
    with open(ruta, "w", encoding="utf-8") as fh:
        json.dump(datos, fh, ensure_ascii=False, indent=sangria)


def normaliza(palabra):
    s = unicodedata.normalize("NFD", str(palabra).lower())
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    return re.sub(r"[^a-z0-9ñ]", "", s)


def slug(texto):
    s = re.sub(r"[^a-z0-9-]", "", unicodedata.normalize("NFD", str(texto).lower()).encode("ascii", "ignore").decode().replace(" ", "-"))
    return re.sub(r"-+", "-", s).strip("-")[:40] or "historia"


def limpia_texto(texto):
    """Texto tal como se dice: sin **marcas** ni [etiquetas de emoción]."""
    return re.sub(r"\s+", " ", re.sub(r"\[[^\]]*\]", "", texto).replace("**", "")).strip()


def tokens(frases):
    """Palabras del guion en orden: {t (escrita), n (normalizada), frase, clave (va entre **)}."""
    out = []
    for i, f in enumerate(frases):
        f = re.sub(r"\[[^\]]*\]", "", f)
        dentro = False
        for trozo in f.split():
            marcas = trozo.count("**")
            clave = dentro or marcas > 0
            if marcas % 2 == 1:
                dentro = not dentro
            limpio = trozo.replace("**", "")
            n = normaliza(limpio)
            if n:
                out.append({"t": limpio, "n": n, "frase": i, "clave": clave})
    return out


def estimar(script, ppm):
    """Tiempos sin voz: reparte las palabras a un ritmo de lectura natural."""
    t = 0.15
    seg = 60.0 / ppm
    prev = 0
    for w in script:
        if w["frase"] != prev:
            t += 0.3
            prev = w["frase"]
        dur = seg * (0.55 + 0.09 * len(w["n"]))
        w["ini"], w["fin"] = round(t, 3), round(t + dur * 0.92, 3)
        t += dur
        if w["t"][-1:] in ",;:…":
            t += 0.15
    return t + 0.6


def versiones(historia):
    """[(nombre, final o None)]. Con «finales» sale un vídeo por final; si no, uno solo."""
    fin = historia.get("finales")
    if isinstance(fin, dict) and fin:
        out = []
        for nombre, f in fin.items():
            if isinstance(f, str):
                f = {"texto": f}
            out.append((slug(nombre) or "final", f))
        return out
    f = historia.get("final")
    if isinstance(f, str):
        f = {"texto": f}
    return [("video", f)]


def frases_de(historia, final=None):
    frs = historia.get("frases") or []
    if not frs:
        sys.exit("historia.json no tiene «frases»: hace falta una lista con una frase (y su escena) por elemento.")
    out = []
    for i, fr in enumerate(frs):
        if isinstance(fr, str):
            fr = {"texto": fr}
        if not fr.get("texto"):
            sys.exit(f"La frase {i + 1} no tiene «texto».")
        out.append(fr)
    if final:
        out.append(dict(final, _final=True))
    return out


def proyecto(ruta):
    """Acepta la carpeta del proyecto o su historia.json."""
    ruta = os.path.abspath(ruta)
    if os.path.isfile(ruta):
        ruta = os.path.dirname(ruta)
    if not os.path.exists(os.path.join(ruta, "historia.json")):
        sys.exit(f"No encuentro {os.path.join(ruta, 'historia.json')}. Crea la carpeta del proyecto con su historia.json (mira ejemplo/).")
    return ruta


def avisa_si_solo_lectura(carpeta):
    if not os.access(carpeta, os.W_OK):
        sys.exit(f"No se puede escribir en {carpeta}. Si es la carpeta de la skill (solo lectura), copia el proyecto a tu carpeta de trabajo.")
