#!/usr/bin/env python3
"""Renderiza el vídeo (o los dos, si hay dos finales) con su voz y sus efectos.

Uso:
  python3 render.py PROYECTO --muestra        hoja de miniaturas + 6 s en borrador (1 minuto)
  python3 render.py PROYECTO                  vídeos finales en PROYECTO/salida/
  python3 render.py PROYECTO --borrador       a media resolución (unas 5 veces más rápido)
  python3 render.py PROYECTO --version NOMBRE solo una versión

Va por trozos de 6 s que se guardan: si el comando se corta o llega al límite de --minutos (3 por defecto),
vuelve a ejecutar el MISMO comando y sigue donde lo dejó. Lo que no cambia no se vuelve a dibujar
(el cuerpo se dibuja una vez y sirve para los dos finales).
"""
import argparse, hashlib, json, multiprocessing as mp, os, shutil, subprocess, sys, time, wave

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from comun import FFMPEG, proyecto  # noqa: E402

TROZO = 6.0
CODIFICA = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "21", "-maxrate", "2600k", "-bufsize", "5200k",
            "-pix_fmt", "yuv420p", "-g", "60"]


# ---------------------------------------------------------------- trozos
def trozos(plan, escala):
    """[(desde, hasta, clave)]. La clave solo depende de lo que se ve en ese tramo."""
    dur = plan["duracion"]
    corte = plan["inicio_final"] - plan.get("barrido_dur", 0.8) if plan.get("inicio_final") else dur
    corte = max(0.0, min(dur, corte))
    cortes, t = [], 0.0
    while t < corte - 1e-6:
        cortes.append((t, min(corte, t + TROZO)))
        t += TROZO
    t = corte
    while t < dur - 1e-6:
        cortes.append((t, min(dur, t + TROZO)))
        t += TROZO
    fps = plan.get("fps", 30)
    out = []
    for a, b in cortes:
        a, b = round(round(a * fps) / fps, 4), round(round(b * fps) / fps, 4)
        if b <= a:
            continue
        margen = plan.get("barrido_dur", 0.8)
        datos = {"a": a, "b": b, "escala": escala, "fps": fps, "colores": plan.get("colores"), "hervor": plan.get("hervor_fps"),
                 "barrido": plan.get("barrido_dur"), "palabras": [l for l in plan.get("palabras", []) if l["s"] < b + 1 and l["e"] > a - 1],
                 "escenas": [e for e in plan["escenas"] if e["inicio"] < b + margen],
                 "recortes": [r for r in plan["recortes"] if r["t"] < b and r["fin"] + 0.3 > a],
                 "boca": plan.get("boca", [])[int(a * 30):int(b * 30) + 2], "motor": huella_motor()}
        clave = hashlib.sha1(json.dumps(datos, sort_keys=True, ensure_ascii=False).encode()).hexdigest()[:16]
        out.append((a, b, clave))
    return out


_HM = None


def huella_motor():
    global _HM
    if _HM is None:
        with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "papel.py"), "rb") as fh:
            _HM = hashlib.sha1(fh.read()).hexdigest()[:12]
    return _HM


def _dibuja(args):
    ruta_plan, salida, a, b, escala = args
    import papel
    plan = papel.cargar(ruta_plan)
    tmp = salida + ".tmp.mp4"
    lz = papel.Lienzo(escala)
    fps = plan.get("fps", 30)
    cmd = [FFMPEG, "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{lz.w}x{lz.h}", "-r", str(fps), "-i", "-", *CODIFICA, tmp]
    pr = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    n = int(round((b - a) * fps))
    for i in range(n):
        pr.stdin.write(lz.pinta(plan, a + i / fps, fps))
    pr.stdin.close()
    if pr.wait():
        return None
    os.replace(tmp, salida)
    return salida


# ---------------------------------------------------------------- sonido
def eventos(plan):
    """Un efecto cuando algo aparece o actúa (los nombres son de sonidos.py)."""
    ev = []
    for esc in plan["escenas"]:
        t0 = esc["inicio"]
        if esc.get("barrido"):
            ev.append((t0 - 0.35, "whoosh", 0.8))
        teclea = False
        for pz in esc["piezas"]:
            tipo, e = pz["tipo"], pz.get("entra")
            te = t0 + e.get("t", 0) if isinstance(e, dict) else None
            if pz.get("tiembla") is False and tipo in ("pared", "pared_lisa", "mesa", "cielo"):
                continue
            if te is not None:
                if tipo in ("sello", "caja_palabra"):
                    ev.append((te + 0.12, "sello", 1.0))
                elif tipo == "brazo":
                    ev.append((te, "pasa", 0.9))
                elif tipo in ("etiqueta", "insignia", "nota"):
                    ev.append((te, "pop", 1.0))
                else:
                    ev.append((te, "papel", 0.7))
            if tipo == "contador":
                ev.append((t0 + pz.get("t0", 0), "barra", 0.8))
            if tipo == "brazo" and str(pz.get("pose", "")).startswith("teclea"):
                teclea = True
            for tk, props in pz.get("claves", []):
                if tipo == "puerta" and props.get("abre") == 1:
                    ev.append((t0 + tk - 0.4, "puerta", 0.8))
                if tipo == "pinza" and props.get("cierra") == 1:
                    ev.append((t0 + tk - 0.05, "golpe", 0.9))
                if tipo == "mazo" and isinstance(props.get("rot"), (int, float)) and props["rot"] < 20:
                    ev.append((t0 + tk - 0.02, "golpe", 1.0))
                if tipo == "tachado" and props.get("tacha") == 1:
                    ev.append((t0 + tk - 0.3, "tachar", 0.8))
        if teclea:
            fin = plan["escenas"][plan["escenas"].index(esc) + 1]["inicio"] if esc is not plan["escenas"][-1] else plan["duracion"]
            t = t0 + 0.3
            while t < fin - 0.2:
                ev.append((t, "tecla", 0.6))
                t += 0.11 + (int(t * 100) % 7) * 0.012
    for r in plan.get("recortes", []):
        ev.append((r["t"] + 0.02, "papel", 1.0))
    ev.sort()
    limpio = []
    for t, s, g in ev:
        t = max(0.0, t)
        if s != "tecla" and limpio and any(abs(x[0] - t) < 0.12 and x[1] != "tecla" for x in limpio[-4:]):
            continue
        limpio.append((round(t, 3), s, g))
    return limpio


def audio(plan, salida_wav):
    import numpy as np
    import sonidos
    sr = sonidos.SR
    dur = plan["duracion"]
    n = int(sr * dur)
    voz = np.zeros(n, np.float32)
    if plan.get("voz") and os.path.exists(plan["voz"]):
        raw = subprocess.run([FFMPEG, "-v", "error", "-i", plan["voz"], "-f", "f32le", "-ac", "1", "-ar", str(sr), "-"], capture_output=True).stdout
        v = np.frombuffer(raw, np.float32)[:n]
        voz[:len(v)] = v
    ef = np.zeros(n, np.float32)
    rng = np.random.default_rng(7)
    for t, nombre, g in eventos(plan):
        s = sonidos.efecto(nombre, rng).astype(np.float32) * g
        k = int(t * sr)
        if 0 <= k < n:
            m = min(n, k + len(s))
            ef[k:m] += s[:m - k]
    # los efectos bajan mientras se habla (la voz siempre por encima)
    hop = int(sr * 0.05)
    env = np.repeat([float(np.sqrt(np.mean(voz[i:i + hop] ** 2))) if len(voz[i:i + hop]) else 0.0 for i in range(0, n, hop)], hop)[:n]
    hablando = np.convolve((env > 0.02).astype(np.float32), np.ones(5) / 5, mode="same")
    ef *= (1.0 - 0.45 * hablando) * (0.55 if plan.get("con_voz") else 0.8)
    mezcla = voz + ef
    pico = float(np.abs(mezcla).max()) or 1.0
    if pico > 0.89:
        mezcla = np.tanh(mezcla * 1.1) / np.tanh(1.1) * 0.89 if pico < 1.4 else mezcla * (0.89 / pico)
    with wave.open(salida_wav, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes((np.clip(mezcla, -1, 1) * 32767).astype(np.int16).tobytes())


# ---------------------------------------------------------------- montar
def montar(plan, lista_trozos, salida):
    tmp = os.path.dirname(lista_trozos[0])
    txt = os.path.join(tmp, f"lista_{plan['version']}.txt")
    with open(txt, "w") as fh:
        for t in lista_trozos:
            fh.write(f"file '{t}'\n")
    wav = os.path.join(tmp, f"audio_{plan['version']}.wav")
    audio(plan, wav)
    r = subprocess.run([FFMPEG, "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", txt, "-i", wav, "-map", "0:v", "-map", "1:a",
                        "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", salida], capture_output=True, text=True)
    if r.returncode:
        sys.exit("No pude unir los trozos: " + r.stderr[-500:])
    os.remove(wav)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("proyecto")
    ap.add_argument("--muestra", action="store_true", help="hoja de miniaturas y 6 s en borrador")
    ap.add_argument("--borrador", action="store_true", help="media resolución (rápido, para revisar)")
    ap.add_argument("--version", help="solo esta versión (nombre del final)")
    ap.add_argument("--desde", type=float, default=0.0, help="con --muestra: segundo donde empieza el trozo")
    ap.add_argument("--minutos", type=float, default=3.0, help="para y guarda al pasar de estos minutos (vuelve a ejecutar para seguir)")
    ap.add_argument("--procesos", type=int, default=0, help="procesos en paralelo (por defecto, uno por núcleo)")
    ap.add_argument("--ppm", type=float, default=170, help="palabras por minuto si no hay voz")
    a = ap.parse_args()
    carpeta = proyecto(a.proyecto)
    import plan as planificador
    planes = planificador.todos(carpeta, a.ppm)
    if a.version:
        planes = [p for p in planes if p["version"] == a.version]
        if not planes:
            sys.exit(f"No hay ninguna versión «{a.version}». Hay: " + ", ".join(p["version"] for p in planificador.todos(carpeta, a.ppm)))
    salida = os.path.join(carpeta, "salida")
    cache = os.path.join(salida, "trozos")
    os.makedirs(cache, exist_ok=True)
    procesos = a.procesos or max(1, min(4, os.cpu_count() or 2))

    if a.muestra:
        import papel
        p = planes[0]
        ruta = os.path.join(salida, f"plan_{p['version']}.json")
        papel.cargar(p)
        ts = [round(d["inicio"] + max(0.3, min(d["dur"] * 0.8, d["dur"] - 0.5)), 2) for d in p["frases"]][:12]
        hoja = os.path.join(salida, "muestra_hoja.jpg")
        papel.hoja(p, hoja, ts)
        desde = max(0.0, min(a.desde, p["duracion"] - 1))
        hasta = min(p["duracion"], desde + 6.0)
        clip = os.path.join(cache, "muestra_video.mp4")
        t0 = time.time()
        _dibuja((ruta, clip, desde, hasta, 0.5))
        wav = os.path.join(cache, "muestra.wav")
        audio(p, wav)
        final = os.path.join(salida, "muestra.mp4")
        subprocess.run([FFMPEG, "-v", "error", "-y", "-i", clip, "-ss", str(desde), "-t", str(hasta - desde), "-i", wav, "-map", "0:v", "-map", "1:a",
                        "-c:v", "copy", "-c:a", "aac", "-shortest", final], check=True)
        os.remove(clip); os.remove(wav)
        print(f"Muestra lista ({time.time() - t0:.0f} s):\n  {hoja}  (una miniatura por escena)\n  {final}  (segundos {desde:.0f}–{hasta:.0f}, media resolución)")
        return

    escala = 0.5 if a.borrador else 1.0
    trabajo = {}
    por_version = {}
    for p in planes:
        ruta = os.path.join(salida, f"plan_{p['version']}.json")
        lista = []
        for desde, hasta, clave in trozos(p, escala):
            archivo = os.path.join(cache, f"{clave}.mp4")
            lista.append(archivo)
            if not os.path.exists(archivo) and archivo not in trabajo:
                trabajo[archivo] = (ruta, archivo, desde, hasta, escala)
        por_version[p["version"]] = (p, lista)
    pendientes = list(trabajo.values())
    total_seg = sum(t[3] - t[2] for t in pendientes)
    if pendientes:
        print(f"Dibujando {len(pendientes)} trozos ({total_seg:.0f} s de vídeo) con {procesos} procesos…")
    t0 = time.time()
    hechos = 0
    cortado = False
    with mp.Pool(procesos) as pool:
        for i in range(0, len(pendientes), procesos):
            if time.time() - t0 > a.minutos * 60:
                cortado = True
                break
            for r in pool.map(_dibuja, pendientes[i:i + procesos]):
                if r is None:
                    sys.exit("ffmpeg falló al dibujar un trozo. Ejecuta python3 scripts/comprobar.py.")
                hechos += 1
            print(f"  {hechos}/{len(pendientes)} trozos ({time.time() - t0:.0f} s)", flush=True)
    if cortado:
        print(f"PARADO para no pasar de {a.minutos:.0f} min: quedan {len(pendientes) - hechos} trozos. Vuelve a ejecutar el mismo comando y sigue donde lo dejó.")
        sys.exit(3)
    for nombre, (p, lista) in por_version.items():
        final = os.path.join(salida, f"{p['nombre_archivo']}{'_borrador' if a.borrador else ''}.mp4")
        montar(p, lista, final)
        mb = os.path.getsize(final) / 1e6
        print(f"  ✓ {final}  ({p['duracion']:.1f} s, {mb:.1f} MB" + (", sin voz" if not p["con_voz"] else "") + ")")
    if not a.version:  # borra los trozos de planes viejos (ya no sirven)
        usados = {x for _, l in por_version.values() for x in l}
        for f in os.listdir(cache):
            ruta = os.path.join(cache, f)
            if f.endswith(".mp4") and ruta not in usados:
                os.remove(ruta)
    print("Siguiente: python3 scripts/ritmo.py con cada vídeo y python3 scripts/portada.py", os.path.relpath(carpeta))


if __name__ == "__main__":
    main()
