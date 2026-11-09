#!/usr/bin/env python3
"""Prepara la voz y saca el momento exacto de cada palabra de historia.json.

Uso:  python3 alinear.py PROYECTO --voz audio.mp3 [--idioma es] [--pausa-max 0.35] [--velocidad 1.0]

La voz es UNA grabación con todas las frases de historia.json en orden y, al final, cada final
(si hay dos, uno detrás de otro, con una pausa). Las [etiquetas] y las ** no se leen.
Deja en PROYECTO/voz/, para cada versión (una por final):
  voz_<versión>.wav        la voz con las pausas recortadas, a −14 LUFS y con solo su final
  palabras_<versión>.json  cada palabra con su inicio y su fin (lo usa plan.py)
Sin voz no hace falta: plan.py estima los tiempos.
"""
import argparse, difflib, hashlib, json, os, re, shutil, subprocess, sys, tempfile
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from comun import FFMPEG, cargar_json, frases_de, guardar_json, normaliza, proyecto, tokens, versiones  # noqa: E402

SR = 16000
NPM_PARTES = ["@skillninja/shortmovie-telop-model-p%d" % i for i in range(4)]
SHA_SMALL = "ca732cb1379efc49417d028465f543d83a39de2c61f3027678de103dc404ce73"
CACHE = os.path.join(os.path.expanduser("~"), ".cache", "historia-papel")


def ffmpeg(*args):
    r = subprocess.run([FFMPEG, "-hide_banner", "-loglevel", "error", "-y", *args], capture_output=True, text=True)
    if r.returncode:
        sys.exit("ffmpeg falló: " + r.stderr[-800:])
    return r


def leer_audio(ruta, sr=SR):
    raw = subprocess.run([FFMPEG, "-v", "error", "-i", ruta, "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"],
                         capture_output=True).stdout
    a = np.frombuffer(raw, np.float32).copy()
    if len(a) == 0:
        sys.exit(f"No he podido leer audio de {ruta}.")
    return a


def escribir_wav(ruta, a, sr):
    import wave
    a = np.clip(a, -1, 1)
    with wave.open(ruta, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes((a * 32767).astype(np.int16).tobytes())


# ---------------------------------------------------------------- pausas
def recortar_pausas(a, sr, pausa_max):
    hop = int(sr * 0.01)
    n = len(a) // hop
    rms = np.sqrt(np.mean(a[:n * hop].reshape(n, hop) ** 2, axis=1) + 1e-12)
    db = 20 * np.log10(rms)
    pico = np.percentile(db, 95)
    umbral = max(pico - 38, -55)
    voz = db > umbral
    # cierra huecos muy cortos dentro de palabras
    idx = np.where(voz)[0]
    if len(idx) == 0:
        return a, 0.0
    ini, fin = idx[0], idx[-1] + 1
    keep = []
    i = ini
    while i < fin:
        if voz[i]:
            j = i
            while j < fin and voz[j]:
                j += 1
            keep.append((i, j)); i = j
        else:
            j = i
            while j < fin and not voz[j]:
                j += 1
            keep.append(("pausa", j - i)); i = j
    trozos, quitado = [], 0.0
    lim = int(pausa_max / 0.01)
    pos = ini
    margen = 4  # 40 ms de aire al principio y al final
    for k in keep:
        if k[0] == "pausa":
            largo = k[1]
            if largo > lim:
                mitad = lim // 2
                trozos.append(a[pos * hop:(pos + mitad) * hop])
                trozos.append(a[(pos + largo - (lim - mitad)) * hop:(pos + largo) * hop])
                quitado += (largo - lim) * 0.01
            else:
                trozos.append(a[pos * hop:(pos + largo) * hop])
            pos += largo
        else:
            trozos.append(a[pos * hop:k[1] * hop]); pos = k[1]
    cab = a[max(0, ini - margen) * hop:ini * hop]
    cola = a[fin * hop:min(n, fin + margen + 6) * hop]
    # funde cada unión 5 ms para que no haga clic
    f = int(sr * 0.005)
    salida = [cab]
    for t in trozos:
        if len(t) > 2 * f:
            t = t.copy(); t[:f] *= np.linspace(0, 1, f); t[-f:] *= np.linspace(1, 0, f)
        salida.append(t)
    salida.append(cola)
    quitado += (ini - margen) * 0.01 if ini > margen else 0
    return np.concatenate(salida), quitado


def normalizar(ent, sal, sr=48000):
    r = subprocess.run([FFMPEG, "-hide_banner", "-i", ent, "-af", "loudnorm=I=-14:TP=-1.5:LRA=7:print_format=json",
                        "-f", "null", "-"], capture_output=True, text=True)
    try:
        m = json.loads(r.stderr[r.stderr.rindex("{"):r.stderr.rindex("}") + 1])
        filtro = ("loudnorm=I=-14:TP=-1.5:LRA=7:measured_I=%s:measured_TP=%s:measured_LRA=%s:measured_thresh=%s:"
                  "offset=%s:linear=true" % (m["input_i"], m["input_tp"], m["input_lra"], m["input_thresh"], m["target_offset"]))
    except Exception:
        filtro = "loudnorm=I=-14:TP=-1.5:LRA=7"
    ffmpeg("-i", ent, "-af", filtro, "-ar", str(sr), "-ac", "1", sal)


# ---------------------------------------------------------------- reconocimiento
def asegurar_faster_whisper():
    try:
        import faster_whisper  # noqa: F401
        return True
    except ImportError:
        print("  Instalando faster-whisper (una sola vez)…")
        r = subprocess.run([sys.executable, "-m", "pip", "install", "-q", "--break-system-packages", "faster-whisper"],
                           capture_output=True, text=True)
        for extra in ([], ["--user", "--break-system-packages"], ["--user"]):
            if r.returncode == 0:
                break
            r = subprocess.run([sys.executable, "-m", "pip", "install", "-q", *extra, "faster-whisper"], capture_output=True, text=True)
        if r.returncode == 0:
            import site, importlib
            importlib.invalidate_caches()
            if site.getusersitepackages() not in sys.path:
                sys.path.append(site.getusersitepackages())
        try:
            import faster_whisper  # noqa: F401
            return True
        except ImportError:
            print("  No se pudo instalar faster-whisper:", (r.stderr or "")[-300:])
            return False


def modelo_npm():
    destino = os.path.join(CACHE, "whisper-small")
    if os.path.exists(os.path.join(destino, "model.bin")):
        return destino
    if not shutil.which("npm"):
        return None
    print("  Descargando el modelo de voz Whisper small (unos 240 MB, una sola vez)…")
    tmp = tempfile.mkdtemp(prefix="whisper-")
    entorno = dict(os.environ, npm_config_cache=os.path.join(CACHE, "npm"))  # caché propia: funciona sin admin
    for p in NPM_PARTES:
        r = subprocess.run(["npm", "pack", "-q", p], cwd=tmp, capture_output=True, text=True, env=entorno)
        if r.returncode:
            print("  npm no pudo bajar", p, r.stderr[-200:])
            return None
    partes = []
    for f in sorted(os.listdir(tmp)):
        if f.endswith(".tgz"):
            d = os.path.join(tmp, f[:-4]); os.makedirs(d)
            subprocess.run(["tar", "xzf", os.path.join(tmp, f), "-C", d], check=True)
            partes.append(os.path.join(d, "package"))
    os.makedirs(destino, exist_ok=True)
    base = [p for p in partes if os.path.exists(os.path.join(p, "config.json"))][0]
    for f in ("config.json", "tokenizer.json", "vocabulary.json", "preprocessor_config.json"):
        shutil.copy(os.path.join(base, f), destino)
    h = hashlib.sha256()
    with open(os.path.join(destino, "model.bin.tmp"), "wb") as out:
        for i in range(4):
            ruta = [os.path.join(p, f"model.bin.part{i}") for p in partes if os.path.exists(os.path.join(p, f"model.bin.part{i}"))][0]
            with open(ruta, "rb") as fh:
                while True:
                    b = fh.read(1 << 22)
                    if not b:
                        break
                    h.update(b); out.write(b)
    if h.hexdigest() != SHA_SMALL:
        print("  El modelo descargado no coincide (sha256). Se descarta.")
        os.remove(os.path.join(destino, "model.bin.tmp"))
        return None
    os.rename(os.path.join(destino, "model.bin.tmp"), os.path.join(destino, "model.bin"))
    shutil.rmtree(tmp, ignore_errors=True)
    shutil.rmtree(os.path.join(CACHE, "npm"), ignore_errors=True)  # la caché de npm ya no hace falta (otros 200 MB)
    return destino


def reconocer(audio16, idioma, modelo):
    if not asegurar_faster_whisper():
        return None
    from faster_whisper import WhisperModel
    intentos = [modelo] if modelo else []
    intentos += [os.path.join(CACHE, "whisper-small"), "npm", "small"]
    for m in intentos:
        try:
            if m == "npm":
                m = modelo_npm()
                if not m:
                    continue
            elif m and m != "small" and not os.path.exists(os.path.join(m, "model.bin")):
                continue
            wm = WhisperModel(m, device="cpu", compute_type="int8")
            print(f"  Reconociendo la voz con Whisper ({'small' if m == 'small' else os.path.basename(m)})…")
            segs, _ = wm.transcribe(audio16, language=idioma, word_timestamps=True, vad_filter=False,
                                    condition_on_previous_text=False)
            pal = []
            for s in segs:
                for w in s.words or []:
                    n = normaliza(w.word)
                    if n:
                        pal.append({"n": n, "ini": float(w.start), "fin": float(w.end)})
            return pal
        except Exception as e:  # noqa: BLE001
            print(f"  (modelo {m}: {str(e)[:120]})")
    return None


def emparejar(script, oidas):
    a = [w["n"] for w in script]; b = [w["n"] for w in oidas]
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    iguales = 0
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == "equal":
            for k in range(i2 - i1):
                script[i1 + k]["ini"] = oidas[j1 + k]["ini"]; script[i1 + k]["fin"] = oidas[j1 + k]["fin"]
            iguales += i2 - i1
        elif op == "replace":
            t0, t1 = oidas[j1]["ini"], oidas[j2 - 1]["fin"]
            pesos = np.array([len(script[k]["n"]) + 1 for k in range(i1, i2)], float)
            cortes = t0 + (t1 - t0) * np.concatenate([[0], np.cumsum(pesos) / pesos.sum()])
            for k in range(i2 - i1):
                script[i1 + k]["ini"] = float(cortes[k]); script[i1 + k]["fin"] = float(cortes[k + 1])
            iguales += sum(1 for k in range(min(i2 - i1, j2 - j1)) if difflib.SequenceMatcher(None, a[i1 + k], b[j1 + k]).ratio() > 0.6)
    interpolar(script)
    return iguales / max(1, len(script))


def interpolar(script):
    n = len(script)
    i = 0
    while i < n:
        if "ini" in script[i]:
            i += 1; continue
        j = i
        while j < n and "ini" not in script[j]:
            j += 1
        t0 = script[i - 1]["fin"] if i > 0 else 0.0
        t1 = script[j]["ini"] if j < n else t0 + 0.32 * (j - i)
        pesos = np.array([len(script[k]["n"]) + 1 for k in range(i, j)], float)
        cortes = t0 + (t1 - t0) * np.concatenate([[0], np.cumsum(pesos) / pesos.sum()])
        for k in range(i, j):
            script[k]["ini"] = float(cortes[k - i]); script[k]["fin"] = float(cortes[k - i + 1])
        i = j


def por_energia(script, a, sr):
    """Plan B sin reconocimiento: reparte las palabras por los tramos con voz."""
    hop = int(sr * 0.01); n = len(a) // hop
    db = 20 * np.log10(np.sqrt(np.mean(a[:n * hop].reshape(n, hop) ** 2, axis=1) + 1e-12))
    voz = db > max(np.percentile(db, 95) - 35, -55)
    t_voz = np.where(voz)[0] * 0.01
    if len(t_voz) == 0:
        sys.exit("No se oye voz en el audio.")
    pesos = np.array([len(w["n"]) + 1 for w in script], float)
    acum = np.concatenate([[0], np.cumsum(pesos) / pesos.sum()])
    for k, w in enumerate(script):
        w["ini"] = float(t_voz[min(len(t_voz) - 1, int(acum[k] * (len(t_voz) - 1)))])
        w["fin"] = float(t_voz[min(len(t_voz) - 1, int(acum[k + 1] * (len(t_voz) - 1)))])


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("proyecto")
    ap.add_argument("--voz", required=True, help="el audio con la historia leída (mp3, wav, m4a…)")
    ap.add_argument("--idioma", default="es", help="idioma de la voz: es (por defecto), en, pt, fr, it…")
    ap.add_argument("--pausa-max", type=float, default=0.35, help="las pausas más largas se acortan a esto (segundos)")
    ap.add_argument("--velocidad", type=float, default=1.0, help="1.05 = un 5 %% más rápida, sin cambiar el tono")
    ap.add_argument("--modelo", help="carpeta de un modelo faster-whisper ya descargado")
    args = ap.parse_args()
    carpeta = proyecto(args.proyecto)
    historia = cargar_json(os.path.join(carpeta, "historia.json"))
    vers = versiones(historia)
    cuerpo = frases_de(historia)
    finales = [f for _, f in vers if f]
    textos = [f["texto"] for f in cuerpo] + [f["texto"] for f in finales]
    script = tokens(textos)
    nb = len(cuerpo)
    salida = os.path.join(carpeta, "voz")
    os.makedirs(salida, exist_ok=True)
    if not os.path.exists(args.voz):
        sys.exit(f"No encuentro el audio {args.voz}.")
    a = leer_audio(args.voz, 48000)
    a2, quitado = recortar_pausas(a, 48000, args.pausa_max)
    tmp = os.path.join(salida, "_recortada.wav")
    escribir_wav(tmp, a2, 48000)
    if abs(args.velocidad - 1.0) > 0.001:
        tmp2 = os.path.join(salida, "_rapida.wav")
        ffmpeg("-i", tmp, "-af", f"atempo={args.velocidad}", tmp2)
        os.replace(tmp2, tmp)
    completa = os.path.join(salida, "_completa.wav")
    normalizar(tmp, completa)
    os.remove(tmp)
    a16 = leer_audio(completa, SR)
    print(f"  Voz: {len(a16) / SR:.1f} s (pausas recortadas: −{quitado:.1f} s)")
    oidas = reconocer(a16, args.idioma, args.modelo)
    if oidas:
        calidad = emparejar(script, oidas)
    else:
        print("  Aviso: sin reconocimiento de voz. Reparto las palabras por los tramos con voz (menos preciso).")
        por_energia(script, a16, SR)
        calidad = None
    a48 = leer_audio(completa, 48000)
    sr = 48000
    os.remove(completa)
    ini_frase = lambda n: min(w["ini"] for w in script if w["frase"] == n)
    fin_frase = lambda n: max(w["fin"] for w in script if w["frase"] == n)
    corte = ini_frase(nb) - 0.06 if finales else None
    for k, (nombre, final) in enumerate(vers):
        if final:
            fk = nb + k
            s0 = ini_frase(fk) - 0.06
            s1 = min(ini_frase(fk + 1) - 0.06 if fk + 1 < nb + len(finales) else len(a48) / sr, fin_frase(fk) + 0.6)
            trozo = np.concatenate([a48[:int(corte * sr)], a48[int(s0 * sr):int(s1 * sr)]])
            desplaza = corte - s0
            palabras = [dict(w) for w in script if w["frase"] < nb] + [dict(w, ini=w["ini"] + desplaza, fin=w["fin"] + desplaza) for w in script if w["frase"] == fk]
        else:
            trozo = a48[:int((fin_frase(nb - 1) + 0.8) * sr)]
            palabras = [dict(w) for w in script if w["frase"] < nb]
        f = int(sr * 0.02)
        trozo = trozo.copy(); trozo[-f:] *= np.linspace(1, 0, f)
        escribir_wav(os.path.join(salida, f"voz_{nombre}.wav"), trozo, sr)
        datos = {"duracion": round(len(trozo) / sr, 3), "calidad": calidad,
                 "palabras": [{"t": w["t"], "ini": round(w["ini"], 3), "fin": round(w["fin"], 3)} for w in palabras]}
        guardar_json(os.path.join(salida, f"palabras_{nombre}.json"), datos)
        ppm = len(palabras) / max(0.1, (palabras[-1]["fin"] - palabras[0]["ini"]) / 60)
        print(f"  {nombre}: {datos['duracion']:.1f} s, {len(palabras)} palabras, {ppm:.0f} palabras por minuto")
    if calidad is not None:
        print(f"  Palabras reconocidas: {calidad * 100:.0f} %" + ("  ← revisa que historia.json diga lo mismo que la voz (y en el mismo orden)" if calidad < 0.8
              else "  (bien: por encima del 80 %)"))
    print("Listo:", salida, "· ahora: python3 scripts/render.py", os.path.relpath(carpeta), "--muestra")


if __name__ == "__main__":
    main()
