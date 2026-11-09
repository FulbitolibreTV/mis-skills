#!/usr/bin/env python3
"""Convierte historia.json en el plan que dibuja el motor (uno por versión del final).

Uso:  python3 plan.py PROYECTO [--ppm 170]

- Con voz (después de alinear.py) usa los tiempos reales de cada palabra (PROYECTO/voz/).
- Sin voz, los estima a --ppm palabras por minuto.
- Resuelve los tiempos «@palabra», pone el decorado de cada escena, la cámara y las tiras de papel
  con las palabras **clave**, y deja PROYECTO/salida/plan_<versión>.json.
- Revisa el plan y avisa de lo que se vería mal (piezas desconocidas, palabras que no están, etc.).
"""
import argparse, copy, json, math, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from comun import (FFMPEG, cargar_json, estimar, frases_de, guardar_json, normaliza, proyecto,  # noqa: E402
                   slug, tokens, versiones)

W, H = 1080, 1920
TIEMPOS = {"t", "t0", "t1", "texto_t0"}
PATRON = re.compile(r"^\s*(?:@(?P<pal>[^\s+#]+?)(?:#(?P<k>\d+))?|(?P<esp>fin|inicio))\s*(?P<d>[+-]\s*\d+(?:[.,]\d+)?)?\s*$", re.I)


# ---------------------------------------------------------------- decorados
def decorado(nombre, colores=None):
    """Fondo de la escena: piezas que no tiemblan y van detrás de todo. Devuelve (color de fondo, piezas)."""
    c = colores or {}
    if nombre in (None, "", "ninguno"):
        return c.get("fondo", "noche"), []
    if nombre == "mesa":
        return "noche", [
            {"tipo": "pared_lisa", "x": -110, "y": -80, "w": 1300, "h": 830, "capa": 0.9, "tiembla": False, "color": c.get("pared", "noche"), "punto": c.get("punto", "noche3")},
            {"tipo": "mesa", "x": -110, "y": 740, "w": 1300, "h": 1500, "tiembla": False, "color": c.get("mesa", "noche2"), "veta": c.get("veta", "noche3")},
            {"tipo": "lampara", "x": 540, "y": -30, "cono": 720, "ancho": 320, "capa": 0.92, "parpadeo": True}]
    if nombre == "escritorio":  # mesa vista de frente, sin pared
        return "noche2", [{"tipo": "mesa", "x": -110, "y": -80, "w": 1300, "h": 2200, "tiembla": False, "color": c.get("mesa", "noche2"), "veta": c.get("veta", "noche3")},
                          {"tipo": "lampara", "x": 760, "y": -30, "cono": 760, "ancho": 300, "luz": 0.2, "parpadeo": True}]
    if nombre == "pared":
        return "morado", [{"tipo": "pared", "x": -110, "y": 0, "w": 1300, "h": 2100, "zocalo": 1350, "alfombra": False, "tiembla": False,
                           "color": c.get("pared", "morado"), "raya": c.get("raya", "morado2")},
                          {"tipo": "lampara", "x": 540, "y": 120, "cono": 1100, "ancho": 400, "luz": 0.26, "parpadeo": True}]
    if nombre == "pasillo":  # pared muy ancha para mover la cámara de lado (x de 0 a 3600)
        return "morado", [{"tipo": "pared", "x": -600, "y": 0, "w": 4800, "h": 2400, "zocalo": 1180, "tiembla": False,
                           "color": c.get("pared", "morado"), "raya": c.get("raya", "morado2")}]
    if nombre == "cielo":
        return "noche", [{"tipo": "cielo", "x": -110, "y": -80, "w": 1300, "h": 2100, "luna_x": 940, "luna_y": 240, "tiembla": False, "color": c.get("cielo", "noche")}]
    if nombre == "corcho":
        return "noche2", [{"tipo": "pared_lisa", "x": -110, "y": -80, "w": 1300, "h": 2200, "color": "noche2", "punto": "noche3", "tiembla": False},
                          {"tipo": "lampara", "x": 540, "y": -30, "cono": 640, "ancho": 300, "luz": 0.2, "capa": 0.95, "parpadeo": True},
                          {"tipo": "corcho", "x": 540, "y": 820, "entra": {"t": 0.0, "desde": "cae", "dur": 0.35}}]
    if nombre == "liso":
        return c.get("fondo", "noche"), [{"tipo": "pared_lisa", "x": -110, "y": -80, "w": 1300, "h": 2200, "tiembla": False,
                                          "color": c.get("pared", "noche"), "punto": c.get("punto", "noche3")}]
    sys.exit(f"Decorado desconocido «{nombre}». Usa: mesa, escritorio, pared, pasillo, cielo, corcho, liso o ninguno.")


# ---------------------------------------------------------------- tiempos
class Frase:
    def __init__(self, n, palabras, inicio, dur):
        self.n, self.palabras, self.inicio, self.dur = n, palabras, inicio, dur

    def t(self, valor, donde):
        """Tiempo local (segundos desde que empieza la escena) de un número o de «@palabra±s», «fin-0.5»…"""
        if isinstance(valor, (int, float)):
            return float(valor)
        m = PATRON.match(str(valor))
        if not m:
            raise ValueError(f"frase {self.n + 1}, {donde}: «{valor}» no es un tiempo. Usa un número, «@palabra», «@palabra+0.3», «@palabra#2» o «fin-0.5».")
        d = float(m.group("d").replace(" ", "").replace(",", ".")) if m.group("d") else 0.0
        if m.group("esp"):
            base = self.dur if m.group("esp").lower() == "fin" else 0.0
        else:
            buscada = normaliza(m.group("pal"))
            k = int(m.group("k") or 1)
            exactas = [p for p in self.palabras if p["n"] == buscada]
            cand = exactas or [p for p in self.palabras if p["n"].startswith(buscada)]
            if not buscada or len(cand) < k:
                dichas = " ".join(p["t"] for p in self.palabras)
                raise ValueError(f"frase {self.n + 1}, {donde}: no encuentro «@{m.group('pal')}»" + (f" (#{k})" if k > 1 else "") +
                                 f" en «{dichas}». Usa una palabra de esa frase, tal cual se dice.")
            base = cand[k - 1]["ini"] - self.inicio
        return round(max(0.0, base + d), 3)


def resolver(obj, fr, donde="piezas"):
    """Recorre una pieza (y sus hijos) cambiando los tiempos con @palabra por segundos."""
    if isinstance(obj, list):
        return [resolver(x, fr, donde) for x in obj]
    if not isinstance(obj, dict):
        return obj
    out = {}
    for k, v in obj.items():
        if k in TIEMPOS:
            out[k] = fr.t(v, f"{donde} → {k}")
        elif k == "claves" and isinstance(v, list):
            cl = []
            for c in v:
                if not (isinstance(c, list) and len(c) == 2 and isinstance(c[1], dict)):
                    raise ValueError(f"frase {fr.n + 1}, {donde}: cada clave es [tiempo, {{propiedades}}], no {json.dumps(c, ensure_ascii=False)[:60]}")
                cl.append([fr.t(c[0], f"{donde} → claves"), resolver(c[1], fr, donde)])
            out[k] = cl
        else:
            out[k] = resolver(v, fr, donde)
    return out


# ---------------------------------------------------------------- cámara y tiras
def camara(spec, fr, zoom_fin=1.05):
    if spec in (None, "acerca"):
        return {"x": 540, "y": 960, "zoom": 1.0, "claves": [[0, {"zoom": 1.0}], [round(fr.dur + 0.3, 3), {"zoom": zoom_fin, "curva": "lineal"}]]}
    if spec == "aleja":
        return {"x": 540, "y": 960, "zoom": 1.08, "claves": [[0, {"zoom": 1.08}], [round(fr.dur + 0.3, 3), {"zoom": 1.0, "curva": "lineal"}]]}
    if spec == "quieta":
        return {"x": 540, "y": 960, "zoom": 1.0}
    if isinstance(spec, dict):
        c = {"x": spec.get("x", 540), "y": spec.get("y", 960), "zoom": spec.get("zoom", 1.0)}
        if spec.get("claves"):
            c["claves"] = resolver({"claves": spec["claves"]}, fr, "camara")["claves"]
        return c
    raise ValueError(f"frase {fr.n + 1}: cámara «{spec}» desconocida. Usa acerca, aleja, quieta o {{x, y, zoom, claves}}.")


def grupos_clave(palabras):
    """Palabras **clave** seguidas = una tira."""
    gr, act = [], []
    for p in palabras:
        if p["clave"]:
            act.append(p)
        elif act:
            gr.append(act); act = []
    if act:
        gr.append(act)
    return gr


def tamano_tira(texto):
    n = len(texto)
    return 86 if n < 14 else (74 if n < 20 else (64 if n < 26 else 54))


# ---------------------------------------------------------------- final automático
def piezas_final(fr):
    pal = next((g for g in grupos_clave(fr.palabras)), None)
    piezas = []
    if pal:
        i0, i1 = fr.palabras.index(pal[0]), fr.palabras.index(pal[-1])
        antes = " ".join(p["t"] for p in fr.palabras[:i0]).strip(" ,.:;")
        despues = fr.palabras[i1 + 1:]
        if antes:
            piezas.append({"tipo": "etiqueta", "texto": antes, "x": 540, "y": 400, "tam": 66 if len(antes) < 22 else 54, "rot": -3,
                           "entra": {"t": 0.0, "desde": "pop", "dur": 0.3}})
        if despues:
            txt = " ".join(p["t"] for p in despues).strip(" ,.:;")
            piezas.append({"tipo": "etiqueta", "texto": txt, "x": 560, "y": 980, "tam": 60 if len(txt) < 26 else 50, "rot": 3,
                           "entra": {"t": max(0.0, round(despues[0]["ini"] - fr.inicio - 0.05, 3)), "desde": "pop", "dur": 0.3}})
        palabra = " ".join(p["t"] for p in pal).strip(".,:;!?¡¿…")
        piezas.append({"tipo": "caja_palabra", "texto": palabra, "x": 540, "y": 700, "tam": 200 if len(palabra) <= 7 else 150, "rot": -2,
                       "entra": {"t": max(0.0, round(pal[0]["ini"] - fr.inicio - 0.05, 3)), "desde": "golpe", "dur": 0.25}})
    piezas += [{"tipo": "telefono", "x": 175, "y": 1260, "tam": 0.55, "rot": -14, "entra": {"t": 0.1, "desde": "izquierda", "dur": 0.4}},
               {"tipo": "postal", "x": 900, "y": 1250, "rot": 12, "entra": {"t": 0.15, "desde": "derecha", "dur": 0.4}},
               {"tipo": "sobre", "x": 930, "y": 560, "rot": -8, "entra": {"t": 0.25, "desde": "derecha", "dur": 0.4}},
               {"tipo": "onda", "x": 700, "y": 1780, "w": 300, "barras": 13, "color": "celeste"}]
    return piezas


# ---------------------------------------------------------------- envolvente de la voz (boca del narrador)
def envolvente(wav):
    import subprocess
    import numpy as np
    raw = subprocess.run([FFMPEG, "-v", "error", "-i", wav, "-f", "f32le", "-ac", "1", "-ar", "24000", "-"], capture_output=True).stdout
    a = np.frombuffer(raw, np.float32)
    if not len(a):
        return []
    n = 800
    rms = [float(np.sqrt(np.mean(a[i:i + n] ** 2))) for i in range(0, len(a), n)]
    top = max(rms) or 1.0
    return [round(min(1.0, (r / top) ** 0.7 * 1.3), 2) if r / top > 0.06 else 0.0 for r in rms]


# ---------------------------------------------------------------- construir
def construir(carpeta, nombre, final, ppm=170, avisos=None):
    import papel
    avisos = avisos if avisos is not None else []
    historia = cargar_json(os.path.join(carpeta, "historia.json"))
    frs = frases_de(historia, final)
    script = tokens([f["texto"] for f in frs])
    voz_json = os.path.join(carpeta, "voz", f"palabras_{nombre}.json")
    voz_wav = os.path.join(carpeta, "voz", f"voz_{nombre}.wav")
    if os.path.exists(voz_json):
        dat = cargar_json(voz_json)
        oidas = dat["palabras"]
        if [w["n"] for w in script] != [normaliza(w["t"]) for w in oidas]:
            sys.exit(f"El texto de historia.json ha cambiado desde que alineaste la voz ({voz_json}).\n"
                     "Vuelve a pasar alinear.py (con la voz que dice el texto nuevo) o deja el texto como estaba.")
        for w, o in zip(script, oidas):
            w["ini"], w["fin"] = o["ini"], o["fin"]
        fin_audio = dat.get("duracion", script[-1]["fin"] + 0.8)
        con_voz = os.path.exists(voz_wav)
    else:
        fin_audio = estimar(script, ppm)
        con_voz = False
    N = len(frs)
    pals = [[w for w in script if w["frase"] == n] for n in range(N)]
    for n in range(N):
        if not pals[n]:
            sys.exit(f"La frase {n + 1} no tiene ninguna palabra que se pueda decir.")
    S = [0.0] + [round(max(0.0, pals[n][0]["ini"] - 0.06), 3) for n in range(1, N)]
    total = round(max(fin_audio, script[-1]["fin"] + 1.0), 3)
    DUR = [round((S[n + 1] if n + 1 < N else total) - S[n], 3) for n in range(N)]
    colores = historia.get("colores", {})
    papel.PALETA.update(colores)
    tiras_auto = historia.get("tiras", True) is not False
    escenas, tiras = [], []
    errores = []
    for n, f in enumerate(frs):
        fr = Frase(n, pals[n], S[n], DUR[n])
        try:
            dec = f.get("decorado", "escritorio" if f.get("_final") else historia.get("decorado", "mesa"))
            color_fondo, base = decorado(dec, historia.get("decorado_colores"))
            propias = f.get("piezas")
            if propias is None and f.get("_final"):
                propias = piezas_final(fr)
            propias = resolver(copy.deepcopy(propias or []), fr)
            for i, pz in enumerate(propias):
                if not isinstance(pz, dict) or "tipo" not in pz:
                    raise ValueError(f"frase {n + 1}, pieza {i + 1}: cada pieza necesita «tipo».")
                comprobar_pieza(pz, papel.PIEZAS, n, i, fr, avisos)
            esc = {"id": f"f{n + 1}", "inicio": S[n], "fondo": f.get("color_fondo", color_fondo), "barrido": bool(f.get("barrido", False)) and n > 0,
                   "camara": camara(f.get("camara"), fr), "piezas": base + propias}
            escenas.append(esc)
            # tiras de papel con las palabras clave
            con_persona = any(p.get("tipo") == "persona" for p in propias)
            if f.get("tiras") is not None:
                lista = [resolver(dict(t), fr, "tiras") for t in f["tiras"]]
                for t in lista:
                    t["t"] = fr.t(t.pop("en"), "tiras → en") if "en" in t else t.get("t", 0.0)
            elif tiras_auto and not (f.get("_final") and f.get("piezas") is None):
                lista = [{"t": round(g[0]["ini"] - S[n] - 0.05, 3), "texto": " ".join(p["t"] for p in g).strip(".,:;…"), "estilo": "naranja" if k % 2 == 0 else "crema"}
                         for k, g in enumerate(grupos_clave(pals[n]))]
            else:
                lista = []
            for k, t in enumerate(lista):
                if not t.get("texto"):
                    raise ValueError(f"frase {n + 1}: cada tira necesita «texto».")
                fila = t.get("fila", k % 2)
                tiras.append({"t": round(S[n] + max(0.0, t["t"]), 3), "fin": round(S[n] + DUR[n] - 0.12, 3), "texto": t["texto"],
                              "estilo": t.get("estilo", "naranja"), "fila": fila,
                              "x": t.get("x", 650 if con_persona else 540 + (30 if k % 2 == 0 else -30)),
                              "y": t.get("y", (1180 if con_persona else 1440) + fila * 128),
                              "rot": t.get("rot", 2 if k % 2 == 0 else -3), "tam": t.get("tam", tamano_tira(t["texto"]))})
        except ValueError as e:
            errores.append(str(e))
    if errores:
        sys.exit("No puedo hacer el plan:\n  - " + "\n  - ".join(errores))
    # una tira nueva en la misma fila sustituye a la anterior
    for i, r in enumerate(tiras):
        for r2 in tiras[i + 1:]:
            if r2["fila"] == r["fila"] and r2["t"] < r["fin"]:
                r["fin"] = round(r2["t"] - 0.02, 3)
                break
    for r in tiras:
        if r["fin"] - r["t"] < 0.5:
            avisos.append(f"La tira «{r['texto']}» solo se ve {max(0, r['fin'] - r['t']):.1f} s: quita alguna ** de esa frase o ponla en otra fila.")
    for n in range(N):
        if DUR[n] < 1.2:
            avisos.append(f"La escena {n + 1} dura solo {DUR[n]:.1f} s: júntala con la siguiente o alarga la frase.")
    plan = {"version": nombre, "duracion": total, "fps": 30, "barrido_dur": 0.8, "hervor_fps": 12, "colores": colores, "carpeta": carpeta,
            "con_voz": con_voz, "voz": voz_wav if con_voz else None, "inicio_final": S[-1] if final else None,
            "frases": [{"n": n + 1, "inicio": S[n], "dur": DUR[n], "texto": frs[n]["texto"]} for n in range(N)],
            "escenas": escenas, "recortes": tiras, "boca": envolvente(voz_wav) if con_voz else []}
    if historia.get("subtitulos"):
        plan["palabras"] = subtitulos(script)
    return plan


def subtitulos(script):
    lineas, act = [], []
    for w in script:
        if act and (w["frase"] != act[-1]["frase"] or len(act) >= 4 or len(" ".join(p["t"] for p in act + [w])) > 24):
            lineas.append(act); act = []
        act.append(w)
    if act:
        lineas.append(act)
    return [{"s": l[0]["ini"], "e": l[-1]["fin"], "y": 1770, "p": [{"w": p["t"], "s": p["ini"], "clave": p["clave"]} for p in l]} for l in lineas]


def comprobar_pieza(pz, piezas, n, i, fr, avisos):
    tipo = pz["tipo"]
    if tipo not in piezas:
        raise ValueError(f"frase {n + 1}, pieza {i + 1}: no existe la pieza «{tipo}». Hay: {', '.join(sorted(piezas))}. "
                         "Mira referencias/piezas.md o añádela a scripts/papel.py.")
    x, y = pz.get("x", 0), pz.get("y", 0)
    if isinstance(x, (int, float)) and isinstance(y, (int, float)) and not pz.get("claves") and (x < -400 or x > 1480 or y < -400 or y > 2400):
        avisos.append(f"Frase {n + 1}: la pieza «{tipo}» está fuera de la pantalla (x={x}, y={y}); la pantalla va de 0 a 1080 y de 0 a 1920.")
    e = pz.get("entra")
    if isinstance(e, dict) and e.get("t", 0) > fr.dur:
        avisos.append(f"Frase {n + 1}: la pieza «{tipo}» entra en el segundo {e['t']:.1f}, pero la escena dura {fr.dur:.1f} s: no se verá.")
    for h in pz.get("hijos", []) or []:
        if isinstance(h, dict) and h.get("tipo") not in piezas:
            raise ValueError(f"frase {n + 1}, pieza {i + 1}: un hijo usa «{h.get('tipo')}», que no existe.")


def todos(carpeta, ppm=170):
    historia = cargar_json(os.path.join(carpeta, "historia.json"))
    planes, avisos = [], []
    for nombre, final in versiones(historia):
        plan = construir(carpeta, nombre, final, ppm, avisos)
        plan["nombre_archivo"] = slug(historia.get("titulo", "historia")) + ("" if nombre == "video" else "_" + nombre)
        guardar_json(os.path.join(carpeta, "salida", f"plan_{nombre}.json"), plan, sangria=None)
        planes.append(plan)
    vistos = set()
    for a in avisos:
        if a not in vistos:
            vistos.add(a)
            print("  Aviso:", a)
    return planes


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("proyecto")
    ap.add_argument("--ppm", type=float, default=170, help="palabras por minuto si no hay voz (170 por defecto)")
    ap.add_argument("--texto", action="store_true", help="solo escribe el texto que hay que leer en la grabación (y lo guarda en voz/texto_para_leer.txt)")
    a = ap.parse_args()
    carpeta = proyecto(a.proyecto)
    if a.texto:
        from comun import limpia_texto
        historia = cargar_json(os.path.join(carpeta, "historia.json"))
        partes = [limpia_texto(f["texto"]) for f in frases_de(historia)]
        finales = [(n, f) for n, f in versiones(historia) if f]
        texto = "\n".join(partes)
        if finales:
            texto += "\n\n" + "\n\n".join(limpia_texto(f["texto"]) for _, f in finales)
        os.makedirs(os.path.join(carpeta, "voz"), exist_ok=True)
        with open(os.path.join(carpeta, "voz", "texto_para_leer.txt"), "w", encoding="utf-8") as fh:
            fh.write(texto + "\n")
        print(texto)
        if len(finales) > 1:
            print(f"\n(Graba todo seguido en UNA toma: la historia y después los {len(finales)} finales, en este orden: "
                  + ", ".join(n for n, _ in finales) + ". Deja una pausa corta antes de cada final.)")
        return
    for p in todos(carpeta, a.ppm):
        n_piezas = sum(len(e["piezas"]) for e in p["escenas"])
        print(f"  {p['version']}: {p['duracion']:.1f} s, {len(p['escenas'])} escenas, {n_piezas} piezas, {len(p['recortes'])} tiras, "
              + ("con voz" if p["con_voz"] else "sin voz (tiempos estimados)"))
    print("Plan listo en", os.path.join(carpeta, "salida"))


if __name__ == "__main__":
    main()
