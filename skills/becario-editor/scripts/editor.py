#!/usr/bin/env python3
"""Editor IA · herramientas de la skill becario-editor (v1.0).

Uso (con el Python del editor, el que apunta preparar.sh / preparar.ps1 en rutas.json):
  editor.py estado                         qué hay instalado y dónde
  editor.py carpeta RUTA                   crea «Editor IA» (brutos, referencias, exportados) dentro de RUTA
  editor.py silencios ENTRADA [SALIDA]     quita los silencios de un clip
  editor.py subtitulos ENTRADA             transcribe con Whisper y deja .srt y .palabras.json al lado
  editor.py quemar VIDEO SRT SALIDA        pone los subtítulos dentro del vídeo
  editor.py analizar VIDEO                 medidas de un vídeo (planos, ritmo, volumen) y hoja de miniaturas
  editor.py exportar ENTRADA SALIDA        MP4 H.264 a 30 fps con el volumen a -14 LUFS (--vertical: 1080x1920)
  editor.py prueba [--carpeta EDITOR]      prueba corta de todo (unos 1-3 minutos; la primera vez baja el modelo)

Solo usa la biblioteca estándar de Python, salvo faster-whisper para los subtítulos.
"""
import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

VERSION = "1.0"
BASE = Path(os.environ.get("BECARIO_EDITOR_HOME") or (Path.home() / ".becario-editor"))
RUTAS = BASE / "rutas.json"
AQUI = Path(__file__).resolve().parent
if (AQUI.parent / "plantilla").exists():               # dentro de la skill: scripts/editor.py
    SKILL, PLANTILLA = AQUI.parent, AQUI.parent / "plantilla"
else:                                                   # copia en «Editor IA/.editor/editor.py»
    SKILL, PLANTILLA = AQUI, AQUI
EJEMPLO = SKILL / "ejemplo"
ES_WIN = os.name == "nt"

# Modelo Whisper small (MIT). Primero Hugging Face; si no se puede, estos paquetes de npm, comprobados con sha256.
NPM_PARTES = ["@skillninja/shortmovie-telop-model-p%d" % i for i in range(4)]
SHA_SMALL = "ca732cb1379efc49417d028465f543d83a39de2c61f3027678de103dc404ce73"

for flujo in (sys.stdout, sys.stderr):
    try:
        flujo.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass


# ---------------------------------------------------------------- utilidades
def leer_rutas():
    try:
        return json.loads(RUTAS.read_text(encoding="utf-8-sig"))
    except Exception:
        return {}


def guardar_rutas(datos):
    BASE.mkdir(parents=True, exist_ok=True)
    RUTAS.write_text(json.dumps(datos, indent=2, ensure_ascii=False), encoding="utf-8")


def herramienta(nombre):
    r = leer_rutas().get(nombre)
    if r and Path(r).exists():
        return r
    return shutil.which(nombre)


def correr(cmd, **kw):
    return subprocess.run([str(c) for c in cmd], capture_output=True, text=True,
                          encoding="utf-8", errors="replace", **kw)


def fallar(msg, pista=None):
    print("FALLO:", msg)
    if pista:
        print("Qué hacer:", pista)
    sys.exit(1)


def ffmpeg():
    f = herramienta("ffmpeg")
    if not f:
        fallar("no encuentro FFmpeg.", "ejecuta primero el paso de instalación (preparar … instalar).")
    return f


def ffprobe():
    return herramienta("ffprobe")


def duracion(ruta):
    fp = ffprobe()
    if fp:
        r = correr([fp, "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", ruta])
        try:
            return float(r.stdout.strip())
        except ValueError:
            pass
    r = correr([ffmpeg(), "-hide_banner", "-i", ruta])
    m = re.search(r"Duration: (\d+):(\d+):([\d.]+)", r.stderr)
    if not m:
        fallar(f"no puedo leer la duración de {ruta}.", "comprueba que es un vídeo o audio normal (MP4, MOV, MP3, WAV…).")
    return int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3))


def tiene_video(ruta):
    r = correr([ffmpeg(), "-hide_banner", "-i", ruta])
    return bool(re.search(r"Stream #.*: Video: (?!mjpeg|png)", r.stderr))


def tiene_audio(ruta):
    r = correr([ffmpeg(), "-hide_banner", "-i", ruta])
    return "Audio:" in r.stderr


def lado(ruta, sufijo, ext=None):
    """Archivo de salida junto al de entrada; si la entrada está en brutos/ o referencias/,
    va a trabajo/ (esas carpetas no se tocan)."""
    p = Path(ruta)
    carpeta = p.parent
    if carpeta.name.lower() in ("brutos", "referencias", "exportados"):
        carpeta = carpeta.parent / "trabajo"
        carpeta.mkdir(exist_ok=True)
    return carpeta / (p.stem + sufijo + (ext or p.suffix))


def copiar_carpeta(origen, destino):
    """Copia sin heredar el «solo lectura» de la skill instalada (y pisa copias anteriores)."""
    for f in Path(origen).rglob("*"):
        if f.is_file():
            d = Path(destino) / f.relative_to(origen)
            d.parent.mkdir(parents=True, exist_ok=True)
            if d.exists():
                os.chmod(d, 0o644)
            shutil.copyfile(f, d)


# ---------------------------------------------------------------- estado
def cmd_estado(_a):
    r = leer_rutas()
    print(f"becario-editor v{VERSION} · herramientas en {BASE}")
    if not r:
        print("Aún no hay nada instalado (falta el paso preparar … instalar).")
        return
    for k in ("motor", "node", "ffmpeg", "ffprobe", "python", "hyperframes", "remotion", "chrome", "modelo", "editor", "prueba"):
        if k in r:
            print(f"  {k:12} {r[k]}")


# ---------------------------------------------------------------- carpeta
CARPETAS = ["brutos", "referencias", "exportados"]


def cmd_carpeta(a):
    raiz = Path(a.ruta).expanduser().resolve()
    editor = raiz if raiz.name.lower() == "editor ia" else raiz / "Editor IA"
    editor.mkdir(parents=True, exist_ok=True)
    for c in CARPETAS:
        (editor / c).mkdir(exist_ok=True)
    # plantilla: CLAUDE.md, prompts/ y LEEME de cada carpeta; nunca se pisa algo del usuario
    puestos, respetados = [], []
    if not (PLANTILLA / "CLAUDE.md").exists():
        fallar("esta copia de editor.py no trae la plantilla.", "usa el editor.py de la carpeta scripts de la skill.")
    for origen in sorted(PLANTILLA.rglob("*")):
        rel = origen.relative_to(PLANTILLA)
        if rel.parts[0] in ("hf-prueba", "hf-montaje", "remotion-prueba") or origen.is_dir():
            continue
        destino = editor / rel
        destino.parent.mkdir(parents=True, exist_ok=True)
        if destino.exists() and destino.read_bytes() != origen.read_bytes():
            respetados.append(str(rel))
            continue
        if destino.exists():
            os.chmod(destino, 0o644)
        shutil.copyfile(origen, destino)
        puestos.append(str(rel))
    # copia de las herramientas dentro del editor, para usarlas aunque la skill no esté cargada
    herr = editor / ".editor"
    herr.mkdir(exist_ok=True)
    if (herr / "editor.py").exists():
        os.chmod(herr / "editor.py", 0o644)
    shutil.copyfile(Path(__file__).resolve(), herr / "editor.py")
    for sub in ("hf-prueba", "hf-montaje", "remotion-prueba"):
        if (PLANTILLA / sub).exists():
            copiar_carpeta(PLANTILLA / sub, herr / sub)
    if EJEMPLO.exists():
        copiar_carpeta(EJEMPLO, herr / "ejemplo")
    r = leer_rutas()
    r["editor"] = str(editor)
    guardar_rutas(r)
    print(f"OK carpeta {editor}")
    print("   dentro:", ", ".join(CARPETAS), "+ CLAUDE.md y prompts/")
    if respetados:
        print("   ya existían y NO se han tocado:", ", ".join(respetados))


# ---------------------------------------------------------------- silencios
def detectar_silencios(entrada, umbral, minimo):
    r = correr([ffmpeg(), "-hide_banner", "-nostats", "-i", entrada, "-vn",
                "-af", f"silencedetect=noise={umbral}dB:d={minimo}", "-f", "null", "-"])
    ini = [float(x) for x in re.findall(r"silence_start: (-?[\d.]+)", r.stderr)]
    fin = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", r.stderr)]
    total = duracion(entrada)
    if len(fin) < len(ini):
        fin.append(total)
    return [(max(0.0, s), e) for s, e in zip(ini, fin)], total


def tramos_a_dejar(silencios, total, margen):
    dejar, t = [], 0.0
    for s, e in silencios:
        a, b = s + margen, e - margen          # se deja un poco de aire a cada lado de la voz
        if b - a < 0.08:
            continue
        if a > t:
            dejar.append((t, a))
        t = b
    if total - t > 0.05:
        dejar.append((t, total))
    return [(round(a, 3), round(b, 3)) for a, b in dejar if b - a > 0.05]


def renderizar_tramos(entrada, tramos, salida, con_video):
    """Corta y une con trim/concat; por bloques para no hacer órdenes larguísimas (Windows)."""
    tmp = Path(tempfile.mkdtemp(prefix="editor-"))
    partes = []
    try:
        for i in range(0, len(tramos), 40):
            bloque = tramos[i:i + 40]
            f, etiquetas = [], []
            for j, (a, b) in enumerate(bloque):
                d = b - a
                fade = min(0.012, d / 4)
                if con_video:
                    f.append(f"[0:v]trim=start={a}:end={b},setpts=PTS-STARTPTS[v{j}]")
                f.append(f"[0:a]atrim=start={a}:end={b},asetpts=PTS-STARTPTS,"
                         f"afade=t=in:d={fade:.3f},afade=t=out:st={d - fade:.3f}:d={fade:.3f}[a{j}]")
                etiquetas.append((f"[v{j}]" if con_video else "") + f"[a{j}]")
            n = len(bloque)
            f.append("".join(etiquetas) + f"concat=n={n}:v={1 if con_video else 0}:a=1" +
                     ("[v][a]" if con_video else "[a]"))
            parte = tmp / (f"p{i:05d}" + (".mp4" if con_video else ".m4a"))
            cmd = [ffmpeg(), "-hide_banner", "-y", "-i", entrada, "-filter_complex", ";".join(f)]
            if con_video:
                cmd += ["-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
                        "-pix_fmt", "yuv420p"]
            else:
                cmd += ["-map", "[a]"]
            cmd += ["-c:a", "aac", "-b:a", "192k", str(parte)]
            r = correr(cmd)
            if r.returncode:
                fallar("FFmpeg no pudo cortar el clip: " + r.stderr.strip()[-400:])
            partes.append(parte)
        if len(partes) == 1:
            shutil.move(str(partes[0]), salida)
        else:
            lista = tmp / "lista.txt"
            lista.write_text("".join(f"file '{p.as_posix()}'\n" for p in partes), encoding="utf-8")
            r = correr([ffmpeg(), "-hide_banner", "-y", "-f", "concat", "-safe", "0", "-i", lista,
                        "-c", "copy", "-movflags", "+faststart", salida])
            if r.returncode:
                fallar("FFmpeg no pudo unir los trozos: " + r.stderr.strip()[-400:])
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def cmd_silencios(a):
    entrada = str(Path(a.entrada).expanduser())
    if not Path(entrada).exists():
        fallar(f"no existe {entrada}.")
    if not tiene_audio(entrada):
        fallar("el clip no tiene sonido, así que no hay silencios que quitar.")
    con_video = tiene_video(entrada)
    salida = a.salida or str(lado(entrada, "_sin_silencios", ".mp4" if con_video else ".m4a"))
    silencios, total = detectar_silencios(entrada, a.umbral, a.minimo)
    tramos = tramos_a_dejar(silencios, total, a.margen)
    if not tramos:
        fallar("todo el clip parece silencio.", f"prueba con un umbral más bajo, por ejemplo --umbral {a.umbral - 10}.")
    renderizar_tramos(entrada, tramos, salida, con_video)
    nuevo = duracion(salida)
    quitados = [(round(s, 2), round(e, 2)) for s, e in silencios]
    Path(lado(salida, "", ".cortes.json")).write_text(json.dumps(
        {"entrada": entrada, "umbral_db": a.umbral, "minimo_s": a.minimo, "margen_s": a.margen,
         "silencios": quitados, "tramos_que_quedan": tramos}, indent=1, ensure_ascii=False), encoding="utf-8")
    print(f"OK silencios {Path(salida).name}: {total:.1f} s → {nuevo:.1f} s "
          f"({len(silencios)} silencios quitados, {total - nuevo:.1f} s menos)")
    return salida


# ---------------------------------------------------------------- whisper
def asegurar_modelo():
    destino = BASE / "modelos" / "whisper-small"
    if (destino / "model.bin").exists():
        return str(destino)
    destino.mkdir(parents=True, exist_ok=True)
    print("  Descargando el modelo de voz Whisper small (unos 240 MB, una sola vez)…", flush=True)
    try:
        from faster_whisper import download_model
        ruta = download_model("small", output_dir=str(destino))
        if Path(ruta, "model.bin").exists():
            return str(ruta)
    except Exception as e:  # sin acceso a Hugging Face: plan B
        print("  No se puede bajar de Hugging Face (" + str(e)[:60] + "); lo bajo de npm, comprobado con sha256.")
    return modelo_npm(destino)


def modelo_npm(destino):
    npm = herramienta("npm")
    if not npm:
        fallar("no he podido bajar el modelo de voz.", "comprueba la conexión a internet y vuelve a intentarlo.")
    tmp = Path(tempfile.mkdtemp(prefix="whisper-"))
    entorno = dict(os.environ, npm_config_cache=str(BASE / "npm-cache"))   # caché propia: sin admin
    for p in NPM_PARTES:
        r = correr([npm, "pack", "-q", p], cwd=tmp, env=entorno, shell=ES_WIN)
        if r.returncode:
            fallar("npm no pudo bajar " + p + ": " + r.stderr.strip()[-200:],
                   "comprueba la conexión a internet y vuelve a intentarlo.")
    import tarfile
    partes = []
    for f in sorted(tmp.glob("*.tgz")):
        d = tmp / f.stem
        d.mkdir()
        with tarfile.open(f) as t:
            try:
                t.extractall(d, filter="data")
            except TypeError:          # Python sin el parámetro filter
                t.extractall(d)
        partes.append(d / "package")
    base = [p for p in partes if (p / "config.json").exists()][0]
    for f in ("config.json", "tokenizer.json", "vocabulary.json", "preprocessor_config.json"):
        shutil.copy(base / f, destino)
    h = hashlib.sha256()
    temporal = destino / "model.bin.tmp"
    with open(temporal, "wb") as out:
        for i in range(4):
            ruta = [p / f"model.bin.part{i}" for p in partes if (p / f"model.bin.part{i}").exists()][0]
            with open(ruta, "rb") as fh:
                while True:
                    b = fh.read(1 << 22)
                    if not b:
                        break
                    h.update(b)
                    out.write(b)
    shutil.rmtree(tmp, ignore_errors=True)
    shutil.rmtree(BASE / "npm-cache", ignore_errors=True)
    if h.hexdigest() != SHA_SMALL:
        temporal.unlink()
        fallar("el modelo descargado no coincide con su sha256; lo he borrado.", "vuelve a intentarlo.")
    temporal.rename(destino / "model.bin")
    return str(destino)


def audio_16k(ruta):
    """El audio lo decodifica FFmpeg (no PyAV): así no dependemos de la versión de PyAV."""
    import numpy as np
    r = subprocess.run([ffmpeg(), "-v", "error", "-i", str(ruta), "-vn", "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
                       capture_output=True)
    if r.returncode or not r.stdout:
        fallar("FFmpeg no pudo leer el audio de " + str(ruta) + ": " + r.stderr.decode("utf-8", "replace")[-300:])
    return np.frombuffer(r.stdout, np.float32)


def agrupar(palabras, max_palabras=4, max_letras=28):
    grupos, actual = [], []
    for w in palabras:
        texto = " ".join(x["p"] for x in actual + [w])
        if actual and (len(actual) >= max_palabras or len(texto) > max_letras):
            grupos.append(actual)
            actual = []
        actual.append(w)
        if re.search(r"[.!?…,:;]$", w["p"]):
            grupos.append(actual)
            actual = []
    if actual:
        grupos.append(actual)
    return grupos


def hms(t):
    t = max(0.0, t)
    h, r = divmod(int(round(t * 1000)), 3600000)
    m, r = divmod(r, 60000)
    s, ms = divmod(r, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def cmd_subtitulos(a):
    entrada = str(Path(a.entrada).expanduser())
    if not Path(entrada).exists():
        fallar(f"no existe {entrada}.")
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        fallar("falta faster-whisper en este Python.",
               "usa el Python del editor (el de rutas.json) o repite el paso de instalación.")
    modelo = WhisperModel(asegurar_modelo(), device="cpu", compute_type="int8")
    t0 = time.time()
    segmentos, info = modelo.transcribe(audio_16k(entrada), language=a.idioma or None, word_timestamps=True,
                                        beam_size=5, condition_on_previous_text=False)
    palabras = []
    for s in segmentos:
        for w in (s.words or []):
            p = w.word.strip()
            if p:
                palabras.append({"p": p, "ini": round(w.start, 2), "fin": round(w.end, 2)})
    if not palabras:
        fallar("Whisper no ha oído ninguna palabra.", "comprueba que el clip tiene voz y que se oye bien.")
    srt = Path(a.salida) if a.salida else lado(entrada, "", ".srt")
    lineas = []
    for i, g in enumerate(agrupar(palabras, a.palabras), 1):
        ini, fin = g[0]["ini"], max(g[-1]["fin"], g[0]["ini"] + 0.3)
        texto = " ".join(x["p"] for x in g)
        if a.mayusculas:
            texto = texto.upper()
        lineas.append(f"{i}\n{hms(ini)} --> {hms(fin)}\n{texto}\n")
    srt.write_text("\n".join(lineas), encoding="utf-8")
    lado(srt, "", ".palabras.json").write_text(json.dumps(palabras, ensure_ascii=False, indent=0), encoding="utf-8")
    print(f"OK subtítulos {srt.name}: {len(palabras)} palabras, idioma {info.language}, {time.time() - t0:.0f} s")
    print("   texto:", " ".join(x["p"] for x in palabras)[:300])
    return str(srt), palabras


# ---------------------------------------------------------------- quemar
def color_ass(hexa, alfa="00"):
    h = hexa.lstrip("#")
    return f"&H{alfa}{h[4:6]}{h[2:4]}{h[0:2]}".upper()


def estilo_subtitulos(carpeta_editor, propio=None):
    # tamano y margen_abajo van en puntos sobre 288 de alto (el estándar de los subtítulos):
    # 18 ≈ 120 px en un vídeo de 1920; margen_abajo 60 ≈ a un 20 % de la altura desde abajo
    e = {"fuente": "Arial", "tamano": 18, "color": "#FFFFFF", "borde": "#000000", "grosor_borde": 2,
         "negrita": True, "margen_abajo": 60}
    cands = [Path(carpeta_editor) / "referencias" / "mi-estilo.json"] if carpeta_editor else []
    if propio:                                         # retoque solo para este vídeo, encima del estilo general
        cands.append(Path(propio).expanduser())
    for cand in cands:
        if not cand.exists():
            continue
        try:
            datos = json.loads(cand.read_text(encoding="utf-8-sig"))
        except Exception as ex:
            print(f"  AVISO: {cand.name} no se puede leer ({ex}); uso el estilo por defecto.")
            continue
        sub = datos.get("subtitulos", datos)          # vale con la clave "subtitulos" o con los campos sueltos
        conocidos = {k: v for k, v in sub.items() if k in e}
        if not conocidos:
            print(f"  AVISO: {cand.name} no trae valores de subtítulos ({', '.join(e)}); uso el estilo por defecto.")
        e.update(conocidos)
    return (f"Fontname={e['fuente']},Fontsize={e['tamano']},PrimaryColour={color_ass(e['color'])},"
            f"OutlineColour={color_ass(e['borde'])},BorderStyle=1,Outline={e['grosor_borde']},Shadow=0,"
            f"Bold={-1 if e['negrita'] else 0},Alignment=2,MarginV={e['margen_abajo']}")


def cmd_quemar(a):
    video, srt = Path(a.video).expanduser().resolve(), Path(a.srt).expanduser().resolve()
    salida = Path(a.salida).expanduser().resolve()
    for p in (video, srt):
        if not p.exists():
            fallar(f"no existe {p}.")
    estilo = estilo_subtitulos(a.carpeta or leer_rutas().get("editor"), a.estilo)
    # se trabaja desde la carpeta del .srt para no pelear con las rutas de Windows dentro del filtro
    filtro = f"subtitles=filename='{srt.name}':force_style='{estilo}'"
    r = correr([ffmpeg(), "-hide_banner", "-y", "-i", video, "-vf", filtro, "-c:v", "libx264", "-preset", "veryfast",
                "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", salida], cwd=srt.parent)
    if r.returncode:
        if "No such filter" in r.stderr:
            fallar("este FFmpeg no trae el filtro de subtítulos (libass).",
                   "instala la versión completa de FFmpeg (en Windows, winget Gyan.FFmpeg; en Mac, brew install ffmpeg).")
        fallar("FFmpeg no pudo poner los subtítulos: " + r.stderr.strip()[-400:])
    print(f"OK quemar {salida.name}")
    return str(salida)



# ---------------------------------------------------------------- analizar y exportar
def cmd_analizar(a):
    video = str(Path(a.video).expanduser())
    if not Path(video).exists():
        fallar(f"no existe {video}.")
    total = duracion(video)
    info = correr([ffmpeg(), "-hide_banner", "-i", video]).stderr
    m = re.search(r"Video: .*?(\d{3,5})x(\d{3,5}).*?([\d.]+) fps", info)
    ancho, alto, fps = (m.group(1), m.group(2), m.group(3)) if m else ("?", "?", "?")
    cortes = len(re.findall(r"pts_time", correr([ffmpeg(), "-hide_banner", "-i", video, "-an", "-vf",
                 "select='gt(scene,0.3)',showinfo", "-f", "null", "-"]).stderr)) if tiene_video(video) else 0
    lufs = "?"
    if tiene_audio(video):
        e = correr([ffmpeg(), "-hide_banner", "-nostats", "-i", video, "-vn", "-af", "ebur128", "-f", "null", "-"]).stderr
        mm = re.findall(r"I:\s+(-?[\d.]+) LUFS", e)
        lufs = mm[-1] if mm else "?"
    hoja = Path(a.salida) if a.salida else lado(video, "_hoja", ".png")
    if tiene_video(video):
        paso = max(total / 12, 0.5)
        correr([ffmpeg(), "-hide_banner", "-y", "-i", video, "-vf",
                f"fps=1/{paso:.3f},scale=270:-2,tile=4x3:padding=6:color=white", "-frames:v", "1", hoja])
    datos = {"video": Path(video).name, "duracion_s": round(total, 1), "tamano": f"{ancho}x{alto}", "fps": fps,
             "cambios_de_plano": cortes, "cambios_por_minuto": round(cortes / total * 60, 1) if total else 0,
             "plano_medio_s": round(total / (cortes + 1), 2), "volumen_lufs": lufs,
             "hoja": str(hoja) if hoja.exists() else None}
    print(json.dumps(datos, ensure_ascii=False, indent=1))
    return datos


def cmd_exportar(a):
    entrada, salida = str(Path(a.entrada).expanduser()), str(Path(a.salida).expanduser())
    if not Path(entrada).exists():
        fallar(f"no existe {entrada}.")
    vf = ("scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black,"
          "fps=30,format=yuv420p,setsar=1") if a.vertical else "fps=30,format=yuv420p"
    cmd = [ffmpeg(), "-hide_banner", "-y", "-i", entrada, "-vf", vf, "-c:v", "libx264", "-preset", "veryfast",
           "-crf", str(a.crf), "-pix_fmt", "yuv420p"]
    if tiene_audio(entrada):
        cmd += ["-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", "48000", "-c:a", "aac", "-b:a", "192k"]
    r = correr(cmd + ["-movflags", "+faststart", salida])
    if r.returncode:
        fallar("FFmpeg no pudo exportar: " + r.stderr.strip()[-400:])
    mb = Path(salida).stat().st_size / 1e6
    print(f"OK exportar {Path(salida).name}: {duracion(salida):.1f} s, {mb:.1f} MB, volumen a -14 LUFS")
    return salida


# ---------------------------------------------------------------- motor (HyperFrames o Remotion)
def entorno_motor():
    r = leer_rutas()
    env = dict(os.environ, HYPERFRAMES_NO_TELEMETRY="1")   # sin datos de uso de HyperFrames
    if r.get("chrome"):
        env["HYPERFRAMES_BROWSER_PATH"] = r["chrome"]
    for k in ("node", "ffmpeg"):
        if r.get(k):
            env["PATH"] = str(Path(r[k]).parent) + os.pathsep + env.get("PATH", "")
    return env


def render_motor(carpeta_trabajo, salida):
    r = leer_rutas()
    motor, node = r.get("motor", "hyperframes"), herramienta("node")
    if not node:
        return False, "no encuentro Node.js"
    trabajo = Path(carpeta_trabajo)
    if motor == "remotion":
        cli = Path(r.get("remotion", "")) / "node_modules" / "@remotion" / "cli" / "remotion-cli.js"
        if not cli.exists():
            return False, "Remotion no está instalado (repite la instalación con --motor remotion)"
        proyecto = Path(r["remotion"])
        copiar_carpeta(PLANTILLA / "remotion-prueba" / "src", proyecto / "src")
        cmd = [node, cli, "render", "src/index.jsx", "Prueba", str(salida)]
        if r.get("chrome"):
            cmd += ["--browser-executable", r["chrome"]]
        res = correr(cmd, cwd=proyecto, env=entorno_motor(), timeout=600)
    else:
        cli = Path(r.get("hyperframes", "")) / "node_modules" / "hyperframes" / "bin" / "hyperframes.mjs"
        gsap = Path(r.get("hyperframes", "")) / "node_modules" / "gsap" / "dist" / "gsap.min.js"
        if not cli.exists():
            return False, "HyperFrames no está instalado (repite la instalación)"
        trabajo.mkdir(parents=True, exist_ok=True)
        copiar_carpeta(PLANTILLA / "hf-prueba", trabajo)
        shutil.copyfile(gsap, trabajo / "gsap.min.js")
        res = correr([node, cli, "render", "-o", str(salida)], cwd=trabajo, env=entorno_motor(), timeout=600)
    if res.returncode or not Path(salida).exists():
        return False, (res.stdout + res.stderr).strip()[-600:]
    return True, ""


# ---------------------------------------------------------------- prueba
def cmd_prueba(a):
    r = leer_rutas()
    editor = Path(a.carpeta or r.get("editor") or ".").expanduser().resolve()
    if not (editor / "exportados").exists():
        fallar(f"no encuentro la carpeta del editor en {editor}.", "crea primero la carpeta (editor.py carpeta RUTA).")
    voz = EJEMPLO / "voz_prueba.ogg"
    if not voz.exists():
        voz = editor / ".editor" / "ejemplo" / "voz_prueba.ogg"
    t0 = time.time()
    tmp = Path(tempfile.mkdtemp(prefix="prueba-editor-"))
    resultados = []
    try:
        # 1) un «bruto» de 9 s con dos silencios largos
        bruto = tmp / "bruto.mp4"
        filtro = ("[0:a]aresample=48000,atrim=0:2.76,asetpts=PTS-STARTPTS[a1];"
                  "[0:a]aresample=48000,atrim=start=2.76,asetpts=PTS-STARTPTS[a2];"
                  "aevalsrc=0:d=0.9:s=48000[s0];aevalsrc=0:d=1.6:s=48000[s1];aevalsrc=0:d=0.9:s=48000[s2];"
                  "[s0][a1][s1][a2][s2]concat=n=5:v=0:a=1[a]")
        res = correr([ffmpeg(), "-hide_banner", "-y", "-i", voz, "-f", "lavfi", "-i",
                      "color=c=0x2B3A55:s=1080x1920:r=30", "-filter_complex", filtro, "-map", "1:v", "-map", "[a]",
                      "-shortest", "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-c:a", "aac", bruto])
        if res.returncode:
            fallar("FFmpeg no pudo crear el clip de prueba: " + res.stderr.strip()[-300:])
        antes = duracion(bruto)

        # 2) quitar silencios
        sin = tmp / "sin_silencios.mp4"
        cmd_silencios(argparse.Namespace(entrada=str(bruto), salida=str(sin), umbral=-35, minimo=0.45, margen=0.12))
        despues = duracion(sin)
        ok = antes - despues > 1.5
        resultados.append(("Quitar silencios", ok, f"{antes:.1f} s → {despues:.1f} s"))

        # 3) subtítulos con Whisper
        srt, palabras = cmd_subtitulos(argparse.Namespace(entrada=str(sin), salida=None, idioma="es",
                                                          palabras=4, mayusculas=False))
        texto = " ".join(p["p"] for p in palabras).lower()
        ok = "carpeta" in texto and ("brutos" in texto or "exportados" in texto)
        resultados.append(("Subtítulos (Whisper)", ok, f"«{texto[:70]}…»"))

        # 4) subtítulos dentro del vídeo
        con_subs = tmp / "con_subtitulos.mp4"
        cmd_quemar(argparse.Namespace(video=str(sin), srt=srt, salida=str(con_subs), carpeta=str(editor), estilo=None))
        resultados.append(("Subtítulos dentro del vídeo", con_subs.exists(), "FFmpeg"))

        # 5) entrada animada con el motor (HyperFrames o Remotion) y montaje final
        motor = r.get("motor", "hyperframes")
        intro = tmp / "intro.mp4"
        ok_motor, error = render_motor(tmp / "hf", intro)
        final = editor / "exportados" / "prueba_editor.mp4"
        if ok_motor:
            res = correr([ffmpeg(), "-hide_banner", "-y", "-i", intro, "-i", con_subs, "-f", "lavfi", "-t", "2",
                          "-i", "anullsrc=r=48000:cl=stereo", "-filter_complex",
                          "[0:v]scale=1080:1920,fps=30,format=yuv420p,setsar=1[v0];"
                          "[1:v]scale=1080:1920,fps=30,format=yuv420p,setsar=1[v1];"
                          "[2:a]aformat=sample_rates=48000:channel_layouts=stereo[a0];"
                          "[1:a]aresample=48000,aformat=sample_rates=48000:channel_layouts=stereo[a1];"
                          "[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]",
                          "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
                          "-pix_fmt", "yuv420p", "-c:a", "aac", "-movflags", "+faststart", final])
            if res.returncode:
                ok_motor, error = False, "no se pudo unir la entrada: " + res.stderr.strip()[-300:]
        if not ok_motor:
            shutil.copyfile(con_subs, final)
        resultados.append((f"Montaje con {motor.capitalize()}", ok_motor, error[:300] if error else "entrada animada de 2 s"))
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    todo = all(x[1] for x in resultados)
    print()
    print("PRUEBA DEL EDITOR " + ("SUPERADA" if todo else "CON FALLOS") + f" · {time.time() - t0:.0f} s")
    for nombre, ok, detalle in resultados:
        print(f"  {'✓' if ok else '✗'} {nombre}: {detalle}")
    print(f"  Vídeo de prueba: {final}")
    r = leer_rutas()
    r["prueba"] = time.strftime("%d-%m-%Y %H:%M") + (" OK" if todo else " con fallos")
    guardar_rutas(r)
    sys.exit(0 if todo else 1)


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser(prog="editor.py", description="Editor IA (becario-editor)")
    sub = ap.add_subparsers(dest="orden", required=True)
    sub.add_parser("estado")
    p = sub.add_parser("carpeta")
    p.add_argument("ruta")
    p = sub.add_parser("silencios")
    p.add_argument("entrada")
    p.add_argument("salida", nargs="?")
    p.add_argument("--umbral", type=float, default=-35, help="dB por debajo de los cuales es silencio (-35)")
    p.add_argument("--minimo", type=float, default=0.45, help="segundos mínimos para cortar (0,45)")
    p.add_argument("--margen", type=float, default=0.12, help="aire que se deja junto a la voz (0,12 s)")
    p = sub.add_parser("subtitulos")
    p.add_argument("entrada")
    p.add_argument("--salida")
    p.add_argument("--idioma", default="es")
    p.add_argument("--palabras", type=int, default=4, help="palabras como mucho por subtítulo (4)")
    p.add_argument("--mayusculas", action="store_true")
    p = sub.add_parser("quemar")
    p.add_argument("video")
    p.add_argument("srt")
    p.add_argument("salida")
    p.add_argument("--carpeta", help="carpeta Editor IA (para leer referencias/mi-estilo.json)")
    p.add_argument("--estilo", help="JSON con retoques solo para este vídeo (mismo formato que mi-estilo.json)")
    p = sub.add_parser("analizar")
    p.add_argument("video")
    p.add_argument("--salida", help="dónde dejar la hoja de miniaturas (.png)")
    p = sub.add_parser("exportar")
    p.add_argument("entrada")
    p.add_argument("salida")
    p.add_argument("--vertical", action="store_true", help="encaja en 1080x1920")
    p.add_argument("--crf", type=int, default=20)
    p = sub.add_parser("prueba")
    p.add_argument("--carpeta")
    a = ap.parse_args()
    {"estado": cmd_estado, "carpeta": cmd_carpeta, "silencios": cmd_silencios, "subtitulos": cmd_subtitulos,
     "quemar": cmd_quemar, "analizar": cmd_analizar, "exportar": cmd_exportar, "prueba": cmd_prueba}[a.orden](a)


if __name__ == "__main__":
    main()
