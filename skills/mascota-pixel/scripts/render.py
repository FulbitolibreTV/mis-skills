#!/usr/bin/env python3
"""Renderiza el reel a partir de reel.json.

Uso:
  python3 render.py PROYECTO/reel.json                  vídeo completo → PROYECTO/salida/reel.mp4
  python3 render.py PROYECTO/reel.json --muestras       un fotograma por paso → PROYECTO/salida/muestras.png
  python3 render.py PROYECTO/reel.json --en 12.5        un solo fotograma en el segundo 12,5
  Opciones: --salida NOMBRE.mp4  --sin-sonidos  --sonidos 0.8 (volumen de efectos)
"""
import argparse, math, os, subprocess, sys, time
import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from comun import FFMPEG, fuente, estilo, rgb, mezcla, normaliza, cargar_json, ajusta_tam, caja, es_oscuro, configurar_panel, rect_pixel, PANEL  # noqa: E402
from sprite import dibujar_boca  # noqa: E402
from escenas import TARJETAS, ease  # noqa: E402
import sonidos  # noqa: E402

W, H, FPS = 1080, 1920, 30
MX = 70                       # margen lateral
Y_CABECERA = 262              # centro de la fila de arriba (solo si se activa el contador o la ruta)
Y_TITULO = 236                # arriba del titular
BOCA_XY = (392, 1566)         # dónde queda la boca del personaje en su sitio normal
ALTO_CABEZA = 330             # de la boca a lo más alto del pelo, en píxeles de pantalla
REJILLA = dict(x=742, y=1690, cols=11, filas=7, celda=20, hueco=5)
VISEMA_DE = {}
for c in "aá": VISEMA_DE[c] = "D"
for c in "eéií": VISEMA_DE[c] = "C"
for c in "oó": VISEMA_DE[c] = "E"
for c in "uúüw": VISEMA_DE[c] = "F"
for c in "mbp": VISEMA_DE[c] = "A"
for c in "fv": VISEMA_DE[c] = "B"


TEXTOS = {
    "es": {"nivel": "¡LEVEL UP!"},
    "en": {"nivel": "LEVEL UP!"},
    "pt": {"nivel": "LEVEL UP!"},
}


def falla(msg):
    sys.exit("ERROR en reel.json: " + msg)


# ---------------------------------------------------------------- personaje
class Personaje:
    def __init__(self, carpeta, E):
        self.carpeta = carpeta
        pj = cargar_json(os.path.join(carpeta, "personaje.json"))
        self.poses = pj["poses"]
        self.inicial = pj.get("pose_inicial") or next(iter(self.poses))
        self.nat = {k: Image.open(os.path.join(carpeta, v["archivo"])).convert("RGBA") for k, v in self.poses.items()}
        sin_boca = [k for k, v in self.poses.items() if not v.get("boca")]
        if sin_boca:
            print("  Aviso: estas poses no tienen la boca marcada y no moverán la boca:", ", ".join(sin_boca))
        self.cache = {}
        ref = self.poses[self.inicial]
        self.ref_boca = ref.get("boca") or self._boca_supuesta(self.inicial)
        self.d_ref = self.ref_boca["y"] - self._arriba(self.inicial, self.ref_boca)
        self.P = max(2, min(14, round(ALTO_CABEZA / max(4, self.d_ref))))

    def _arriba(self, pose, boca):
        a = np.array(self.nat[pose])[..., 3] > 0
        x0, x1 = max(0, boca["x"] - 20), boca["x"] + 20
        filas = np.where(a[:, x0:x1].any(axis=1))[0]
        return int(filas[0]) if len(filas) else 0

    def _boca_supuesta(self, pose):
        im = self.nat[pose]
        return {"x": im.width // 2, "y": int(im.height * 0.45), "ancho": 6, "_falsa": True}

    def boca(self, pose):
        b = self.poses[pose].get("boca")
        if b:
            return b
        # sin marcar: misma posición relativa que la pose inicial
        rb = self.ref_boca
        im0, im = self.nat[self.inicial], self.nat[pose]
        return {"x": int(rb["x"] * im.width / im0.width), "y": rb["y"], "ancho": rb["ancho"], "_falsa": True}

    def escala(self, pose):
        b = self.boca(pose)
        d = b["y"] - self._arriba(pose, b)
        return max(2, round(self.P * self.d_ref / max(4, d)))

    def imagen(self, pose, visema, P=None, extender_a=None):
        """Sprite a escala de pantalla con borde de pegatina. Devuelve (img, (bx, by)) con la posición
        de la boca dentro de la imagen."""
        P = P or self.escala(pose)
        clave = (pose, visema, P, extender_a)
        if clave in self.cache:
            return self.cache[clave]
        nat = self.nat[pose]
        b = self.boca(pose)
        img = dibujar_boca(nat, b, visema) if not b.get("_falsa") else nat.copy()
        a = np.array(img)
        if extender_a:  # alarga la cintura hasta abajo de la pantalla (extender_a = (y de la boca, alto))
            y_boca, alto_p = extender_a
            filas_pantalla = alto_p - (y_boca - b["y"] * P)
            faltan = math.ceil(filas_pantalla / P) - a.shape[0] + 1
            if faltan > 0:
                # repite la última fila que no sea contorno (si la última es casi toda oscura, es el borde)
                k = a.shape[0] - 1
                while k > a.shape[0] - 4:
                    fila = a[k]
                    op_f = fila[:, 3] > 0
                    lum = fila[:, :3].astype(int).sum(axis=1)
                    if op_f.sum() and (lum[op_f] < 200).mean() < 0.5:
                        break
                    k -= 1
                fila = a[k:k + 1].copy()
                op_f = fila[0, :, 3] > 0
                lum_f = fila[0, :, :3].astype(int) @ np.array([299, 587, 114]) // 1000
                claros = op_f & (lum_f >= 70)
                if claros.sum() > 3:
                    # el relleno usa el color más repetido de la fila (sin rayas de sombreado); el contorno se mantiene
                    cols, n_ = np.unique(fila[0, claros, :3], axis=0, return_counts=True)
                    fila[0, claros, :3] = cols[n_.argmax()]
                a = np.concatenate([a[:k + 1]] + [fila] * (faltan + (a.shape[0] - 1 - k)))
        # borde de pegatina de 1 píxel
        op = a[..., 3] > 0
        p = np.pad(op, 2)
        dil = np.zeros_like(p)
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                dil |= np.roll(np.roll(p, dy, 0), dx, 1)
        con = np.zeros((a.shape[0] + 4, a.shape[1] + 4, 4), np.uint8)
        con[dil] = (255, 255, 255, 255)
        con[2:-2, 2:-2][op] = a[op]
        im = Image.fromarray(con).resize((con.shape[1] * P, con.shape[0] * P), Image.Resampling.NEAREST)
        res = (im, ((b["x"] + 2 + 0.5) * P, (b["y"] + 2) * P))
        self.cache[clave] = res
        return res

    def mini(self, pose, alto):
        clave = ("mini", pose, alto)
        if clave not in self.cache:
            nat = self.nat.get(pose) or self.nat[self.inicial]
            f = alto / nat.height
            self.cache[clave] = nat.resize((max(1, round(nat.width * f)), alto), Image.Resampling.NEAREST)
        return self.cache[clave]

    def boca_mini(self, visema, ancho):
        clave = ("bocam", visema, ancho)
        if clave not in self.cache:
            pose = self.inicial
            b = self.boca(pose)
            img = dibujar_boca(self.nat[pose], b, visema)
            r = max(b["ancho"] + 4, 9)
            rec = img.crop((b["x"] - r, b["y"] - r // 2 - 1, b["x"] + r, b["y"] + r // 2 + 3))
            f = ancho / rec.width
            self.cache[clave] = rec.resize((ancho, max(1, round(rec.height * f))), Image.Resampling.NEAREST)
        return self.cache[clave]


# ---------------------------------------------------------------- línea de tiempo
class Reel:
    def __init__(self, ruta_json, args):
        self.ruta = ruta_json
        self.base = os.path.dirname(os.path.abspath(ruta_json))
        R = cargar_json(ruta_json)
        self.R = R
        self.E = estilo(R.get("estilo", "claro"))
        self.idioma = R.get("idioma", "es") if R.get("idioma", "es") in TEXTOS else "es"
        configurar_panel(self.E, R.get("panel"))
        self.args = args
        pal = R.get("palabras", "voz/palabras.json")
        ruta_pal = self.rel(pal)
        if not os.path.exists(ruta_pal):
            falla(f"no encuentro {pal}. Primero ejecuta alinear.py (con voz o con --sin-voz).")
        P = cargar_json(ruta_pal)
        self.palabras = P["palabras"]
        self.frases = P["frases"]
        self.voz = None
        if R.get("voz") or P.get("voz"):
            rv = self.rel(R["voz"]) if R.get("voz") else os.path.join(os.path.dirname(ruta_pal), P["voz"])
            if os.path.exists(rv):
                self.voz = rv
        self.duracion_voz = P["duracion"]
        global ALTO_CABEZA
        ALTO_CABEZA = int(330 * float(R.get("escala_personaje", 1.0)))
        self.pj = Personaje(self.rel(R.get("personaje", "personaje")), self.E)
        self._prepara_pasos()
        self._prepara_bocas()
        self._prepara_envolvente()
        self.sonidos_hechos = set()
        self.eventos = []
        self.cache_img = {}

    def rel(self, p):
        return p if os.path.isabs(p) else os.path.join(self.base, p)

    # -- pasos
    def _prepara_pasos(self):
        pasos = self.R.get("pasos")
        if not pasos:
            falla("falta la lista «pasos».")
        nf = len(self.frases)
        usadas = []
        for i, p in enumerate(pasos):
            fr = p.get("frases") or ([p["frase"]] if "frase" in p else None)
            if not fr and "cierre" in p:
                if i != len(pasos) - 1:
                    falla(f"el paso {i + 1} es de cierre («cierre»), y solo puede ser el último.")
                p["_frases"] = []
                continue
            if not fr:
                falla(f"el paso {i + 1} no dice qué frase(s) cubre («frase»: número, o «cierre»: segundos si es el final sin voz).")
            for f in fr:
                if not 1 <= f <= nf:
                    falla(f"el paso {i + 1} usa la frase {f}, pero el guion tiene {nf} frases (se cuentan desde 1).")
            p["_frases"] = [f - 1 for f in fr]
            usadas += p["_frases"]
            if p.get("tarjeta") and p["tarjeta"].get("tipo") not in TARJETAS:
                falla(f"el paso {i + 1} usa la tarjeta «{p['tarjeta'].get('tipo')}», que no existe. Tipos: {', '.join(TARJETAS)}.")
            if p.get("pose") and p["pose"] not in self.pj.poses:
                falla(f"el paso {i + 1} usa la pose «{p['pose']}», que no existe. Poses: {', '.join(self.pj.poses)}.")
        faltan = sorted(set(range(nf)) - set(usadas))
        if faltan:
            print("  Aviso: estas frases no están en ningún paso y se verán con el paso anterior:", [f + 1 for f in faltan])
        for i, p in enumerate(pasos):
            if not p["_frases"]:
                p["_ini"] = self.duracion_voz + 0.15
            else:
                p["_ini"] = 0.0 if i == 0 else max(0.0, self.frases[p["_frases"][0]]["ini"] - 1.0 / FPS)
        for i, p in enumerate(pasos):
            if not p["_frases"]:
                p["_fin"] = p["_ini"] + float(p["cierre"])
            else:
                p["_fin"] = pasos[i + 1]["_ini"] if i + 1 < len(pasos) else self.duracion_voz + self.R.get("cola", 0.8)
            if p["_fin"] - p["_ini"] < 0.3:
                print(f"  Aviso: el paso {i + 1} dura solo {p['_fin'] - p['_ini']:.2f} s.")
            ws = [w for w in self.palabras if w["frase"] in p["_frases"]]
            p["_palabras"] = ws
            tits = p.get("titulares") or ([p["titular"]] if p.get("titular") else [])
            for k, tt in enumerate(tits):
                tt["_t"] = 0.0 if k == 0 and tt.get("en") is None else self.cuando_abs(p, tt.get("en"), 0.0)
            p["_titulares"] = sorted(tits, key=lambda x: x["_t"])
        self.pasos = pasos
        self.total = pasos[-1]["_fin"]

    def cuando_abs(self, paso, spec, defecto):
        """Segundos desde el inicio del paso para una palabra («en»: "palabra"), segundos (número) o defecto."""
        if spec is None:
            return defecto
        if isinstance(spec, (int, float)):
            return float(spec)
        objetivo = normaliza(str(spec).split()[0])
        n_ocur = 1
        if "#" in str(spec):
            objetivo, n_ocur = normaliza(str(spec).split("#")[0]), int(str(spec).split("#")[1])
        exactas = [w for w in paso["_palabras"] if normaliza(w["t"]) == objetivo]
        empiezan = [w for w in paso["_palabras"] if normaliza(w["t"]).startswith(objetivo)]
        lista = exactas if exactas else empiezan
        if not exactas and len(empiezan) > 1 and n_ocur == 1 and (spec, "amb") not in paso.setdefault("_avisos", set()):
            paso["_avisos"].add((spec, "amb"))
            print(f"  Aviso: «{spec}» coincide con varias palabras del paso ({', '.join(w['t'] for w in empiezan)}); uso la primera. Escribe la palabra entera o «{spec}#2».")
        if len(lista) >= n_ocur:
            return max(0.0, lista[n_ocur - 1]["ini"] - paso["_ini"] - 0.08)
        print(f"  Aviso: no encuentro la palabra «{spec}» en el paso de la frase {paso['_frases'][0] + 1}; uso el tiempo por defecto.")
        paso.setdefault("_avisos", set()).add(spec)
        return defecto

    # -- bocas
    def _prepara_bocas(self):
        n = int(math.ceil(self.total * FPS)) + 1
        vis = ["X"] * n
        for w in self.palabras:
            letras_ = [c for c in w["t"].lower() if c.isalpha()]
            if not letras_:
                continue
            pesos = np.array([1.4 if c in "aeiouáéíóúü" else 0.8 for c in letras_])
            cortes = w["ini"] + (w["fin"] - w["ini"]) * np.concatenate([[0], np.cumsum(pesos) / pesos.sum()])
            for k, c in enumerate(letras_):
                f0, f1 = int(cortes[k] * FPS), int(math.ceil(cortes[k + 1] * FPS))
                for f in range(max(0, f0), min(n, f1)):
                    vis[f] = VISEMA_DE.get(c, "B")
        # huecos cortos entre palabras: boca cerrada; largos: reposo
        for f in range(1, n - 1):
            if vis[f] == "X" and vis[f - 1] != "X":
                j = f
                while j < n and vis[j] == "X":
                    j += 1
                if j < n and (j - f) <= 4:
                    for k in range(f, j):
                        vis[k] = "A"
        # cada forma dura al menos 2 fotogramas
        for f in range(1, n - 1):
            if vis[f] != vis[f - 1] and vis[f] != vis[f + 1]:
                vis[f] = vis[f - 1]
        self.visemas = vis

    def _prepara_envolvente(self):
        self.env = None
        if not self.voz:
            return
        raw = subprocess.run([FFMPEG, "-v", "error", "-i", self.voz, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
                             capture_output=True).stdout
        a = np.frombuffer(raw, np.float32)
        hop = 160
        n = len(a) // hop
        rms = np.sqrt(np.mean(a[:n * hop].reshape(n, hop) ** 2, axis=1))
        self.env = rms / (np.percentile(rms, 98) + 1e-6)
        self.audio_voz = a
        # boca cerrada cuando no suena nada (aunque el alineado diga que hay palabra)
        for f in range(len(self.visemas)):
            k = int(f / FPS * 100)
            if 0 <= k < n and self.visemas[f] not in ("X", "A") and self.env[max(0, k - 2):k + 3].max() < 0.06:
                self.visemas[f] = "A"

    # -- utilidades para las tarjetas
    def paso_en(self, t):
        for i, p in enumerate(self.pasos):
            if p["_ini"] <= t < p["_fin"]:
                return i, p
        return len(self.pasos) - 1, self.pasos[-1]

    def sonido(self, nombre, t_abs, clave=None):
        clave = clave or (nombre, round(t_abs, 3))
        if clave in self.sonidos_hechos:
            return
        self.sonidos_hechos.add(clave)
        self.eventos.append((t_abs, nombre))

    def imagen_usuario(self, ruta, w, h):
        clave = ("img", ruta, w, h)
        if clave not in self.cache_img:
            r = self.rel(ruta)
            if not os.path.exists(r):
                print(f"  Aviso: no encuentro la imagen {ruta}.")
                self.cache_img[clave] = None
            else:
                im = Image.open(r).convert("RGBA")
                f = min(w / im.width, h / im.height)
                self.cache_img[clave] = im.resize((max(1, int(im.width * f)), max(1, int(im.height * f))), Image.Resampling.LANCZOS)
        return self.cache_img[clave]

    def miniatura_video(self, w, h):
        clave = ("minivideo", w, h)
        if clave not in self.cache_img:
            E = self.E
            im = Image.new("RGB", (540, 960), E["fondo"])
            d = ImageDraw.Draw(im)
            tit = next((p["_titulares"][0] for p in self.pasos if p["_titulares"]), {"l1": "", "l2": ""})
            d.rounded_rectangle([36, 150, 380, 196], 10, fill=E["texto"])
            d.rounded_rectangle([36, 214, 300, 270], 10, fill=E["acento"])
            spr, (bx, by) = self.pj.imagen(self.pj.inicial, "C", max(2, self.pj.P // 2))
            im.paste(spr, (int(196 - bx), int(783 - by)), spr)
            self.cache_img[clave] = im.resize((w, h), Image.Resampling.LANCZOS)
        return self.cache_img[clave]


class Ctx:
    """Lo que ve una tarjeta: tiempo, estilo, área y ayudas."""

    def __init__(self, reel, paso, t_abs, area):
        self.reel, self.paso, self.E = reel, paso, reel.E
        self.t = t_abs - paso["_ini"]
        self.t_abs = t_abs
        self.dur = paso["_fin"] - paso["_ini"]
        self.area = area

    def cuando(self, spec, defecto):
        return self.reel.cuando_abs(self.paso, spec, defecto)

    seco = False

    def sonido(self, nombre, t_rel):
        if self.seco:
            return
        if t_rel <= self.t + 1e-6:
            self.reel.sonido(nombre, self.paso["_ini"] + t_rel)

    def tecleo(self, t0, t1, cada=0.07):
        if self.seco:
            return
        k = 0
        while t0 + k * cada <= min(t1, self.t):
            self.reel.sonido("tecla", self.paso["_ini"] + t0 + k * cada)
            k += 1

    def sub_area(self, y_extra):
        x, y, w, h = self.area
        c = Ctx(self.reel, self.paso, self.t_abs, (x, y + y_extra, w, h - y_extra))
        c.seco = self.seco
        return c

    def lista_poses(self):
        return list(self.reel.pj.poses)

    def pose_inicial(self):
        return self.reel.pj.inicial

    def sprite_mini(self, pose, alto):
        if pose not in self.reel.pj.nat:
            return None
        return self.reel.pj.mini(pose, alto)

    def imagen(self, ruta, w, h):
        return self.reel.imagen_usuario(ruta, w, h)

    def visema_actual(self):
        f = int(self.t_abs * FPS)
        v = self.reel.visemas[min(f, len(self.reel.visemas) - 1)]
        return v

    def boca_mini(self, v, ancho):
        return self.reel.pj.boca_mini(v, ancho)

    def palabras_cerca(self, n):
        ws = self.paso["_palabras"]
        if not ws:
            return []
        t = self.t_abs
        i = 0
        for k, w in enumerate(ws):
            if w["ini"] <= t + 0.05:
                i = k
        ini = max(0, min(i - n // 2, len(ws) - n))
        out = []
        for k in range(ini, min(len(ws), ini + n)):
            w = ws[k]
            out.append({"t": w["t"].strip(".,;:¿?¡!…"), "actual": w["ini"] <= t + 0.05 < w["fin"] + 0.1 and k == i,
                        "dicha": w["fin"] < t})
        return out

    def envolvente(self, barras):
        env = self.reel.env
        if env is None:
            return [0.3 + 0.25 * math.sin(i * 0.9 + self.t_abs * 9) * math.sin(i * 0.37 + self.t_abs * 4) for i in range(barras)]
        k = int(self.t_abs * 100)
        vals = []
        for i in range(barras):
            j = k - barras // 2 + i
            v = env[j] if 0 <= j < len(env) else 0.0
            vals.append(0.12 + 0.95 * min(1.0, v))
        return vals

    def miniatura_video(self, w, h):
        return self.reel.miniatura_video(w, h)


# ---------------------------------------------------------------- dibujo de un fotograma
def titular_img(reel, tt):
    """Titular: línea 1 en el color del texto y línea 2 dentro de una caja de color con sombra dura.
    Devuelve (img_l1 o None, img_caja o None, alto_total)."""
    clave = ("tit", tt.get("l1", ""), tt.get("l2", ""))
    if clave in reel.cache_img:
        return reel.cache_img[clave]
    E = reel.E
    l1, l2 = tt.get("l1") or "", tt.get("l2") or ""
    if l1 and not l2:            # una sola línea: va en la caja
        l1, l2 = "", l1
    ancho = W - 2 * MX
    img1 = None
    alto = 0
    t_comun = None
    fc = reel.R.get("letra_caja", "pixel" if PANEL["modo"] == "juego" else "black")
    max2 = 150 if fc == "pixel" else 116
    k_px = 1.3 if fc == "pixel" else 1.0
    if l1 and l2:  # las dos líneas al mismo tamaño (a la vista) si una es larga
        t_comun = min(ajusta_tam([l1], "black", 124, 50, ancho), (ajusta_tam([l2], fc, max2, 50, ancho - 2 * 28 - 8) + 8) / k_px)
    if l1:
        t1 = min(ajusta_tam([l1], "black", 124, 56, ancho), t_comun or 999)
        f1 = fuente("black", t1)
        bb = f1.getbbox(l1)
        img1 = Image.new("RGBA", (int(bb[2]) + 10, int(t1 * 1.18)), (0, 0, 0, 0))
        ImageDraw.Draw(img1).text((0, 0), l1, fill=E["texto"], font=f1)
        alto += int(t1 * 1.18) + 4
    img2 = None
    if l2:
        pad_x, pad_y, sombra_d = 28, 14, 8
        tope = (t_comun * k_px - 8) if t_comun else 999
        t2 = min(ajusta_tam([l2], fc, max2, 50, ancho - 2 * pad_x - sombra_d), tope)
        f2 = fuente(fc, t2)
        bb = f2.getbbox(l2)
        tw, th = bb[2] - bb[0], bb[3] - bb[1]
        bw, bh = int(tw + 2 * pad_x), int(th + 2 * pad_y + t2 * 0.12)
        img2 = Image.new("RGBA", (bw + sombra_d + 2, bh + sombra_d + 2), (0, 0, 0, 0))
        d2 = ImageDraw.Draw(img2)
        borde = E.get("borde", E["texto"])
        if PANEL["modo"] == "juego":
            rect_pixel(d2, 0, 0, bw, bh, E["acento"], borde, 5, 8, borde, sombra_d)
        else:
            d2.rounded_rectangle([sombra_d, sombra_d, sombra_d + bw, sombra_d + bh], 16, fill=borde)
            d2.rounded_rectangle([0, 0, bw, bh], 16, fill=E["acento"], outline=borde, width=4)
        ra, ga, ba, _ = rgb(E["acento"])
        lum_a = 0.299 * ra + 0.587 * ga + 0.114 * ba
        col = E.get("texto_caja") or ("#FFFFFF" if lum_a < 155 else "#0F1420")
        d2.text((pad_x - bb[0], pad_y - bb[1] + t2 * 0.06), l2, fill=col, font=f2)
        alto += img2.height + (6 if img1 else 0)
    res = (img1, img2, alto)
    reel.cache_img[clave] = res
    return res


def mosaico(im, p):
    """Efecto de aparecer «materializándose» en píxeles grandes (p de 0 a 1)."""
    if p >= 1 or im.width < 4 or im.height < 4:
        return im
    bloque = int(2 + 26 * (1 - p) ** 1.6)
    if bloque <= 2:
        return im
    peq = im.resize((max(1, im.width // bloque), max(1, im.height // bloque)), Image.Resampling.BILINEAR)
    return peq.resize(im.size, Image.Resampling.NEAREST)


EMOTES = {  # dibujos de 9×9 píxeles: «#» color principal, «o» blanco
    "!": ["...##....", "...##....", "...##....", "...##....", "...##....", ".........", "...##....", "...##....", "........."],
    "?": ["..####...", ".##..##..", ".....##..", "....##...", "...##....", "...##....", ".........", "...##....", "...##...."],
    "corazon": [".##...##.", "####.####", "#########", "#########", ".#######.", "..#####..", "...###...", "....#....", "........."],
    "idea": ["...###...", "..#ooo#..", ".#ooooo#.", ".#ooooo#.", ".#ooooo#.", "..#ooo#..", "...###...", "...###...", "....#...."],
    "nota": ["....####.", "....#..#.", "....#..#.", "....#..#.", "..###.##.", ".########", ".###.###.", ".........", "........."],
    "gota": ["....#....", "...###...", "...###...", "..#####..", "..##o##..", "..#####..", "...###...", ".........", "........."],
    "estrella": ["....#....", "....#....", "...###...", "#########", ".#######.", "..#####..", "..##.##..", ".##...##.", "........."],
    "enfado": ["##.....##", ".##...##.", "..#...#..", ".........", ".........", "..#...#..", ".##...##.", "##.....##", "........."],
}


def emote_img(reel, nombre, z=8):
    clave = ("emote", nombre, z)
    if clave in reel.cache_img:
        return reel.cache_img[clave]
    E = reel.E
    dib = EMOTES.get(nombre, EMOTES["!"])
    borde = E.get("borde", E["texto"])
    col = {"corazon": "#E5383B", "idea": "#FFC93C", "gota": "#4DA3FF", "enfado": "#E5383B"}.get(nombre, E["acento"])
    n = 13
    peq = Image.new("RGBA", (n, n + 3), (0, 0, 0, 0))
    d = ImageDraw.Draw(peq)
    d.rectangle([1, 0, n - 2, n - 1], fill="#FFFFFF")      # bocadillo
    d.rectangle([0, 1, n - 1, n - 2], fill="#FFFFFF")
    d.polygon([(3, n - 1), (6, n - 1), (3, n + 2)], fill="#FFFFFF")
    for yy, fila in enumerate(dib):
        for xx, ch in enumerate(fila):
            if ch == "#":
                peq.putpixel((xx + 2, yy + 2), rgb(col))
            elif ch == "o":
                peq.putpixel((xx + 2, yy + 2), (255, 255, 255, 255))
    # contorno de 1 píxel alrededor de todo el bocadillo
    a = np.pad(np.array(peq), ((1, 1), (1, 1), (0, 0)))
    op = a[..., 3] > 0
    p = np.pad(op, 1)
    cont = ~op & (np.roll(p, 1, 0) | np.roll(p, -1, 0) | np.roll(p, 1, 1) | np.roll(p, -1, 1))[1:-1, 1:-1]
    a[cont] = rgb(borde)
    im = Image.fromarray(a).resize(((n + 2) * z, (n + 5) * z), Image.Resampling.NEAREST)
    reel.cache_img[clave] = im
    return im


def nube(reel, z=10):
    clave = ("nube", z)
    if clave not in reel.cache_img:
        E = reel.E
        forma = ["....####......", "..########.###", ".#############", "##############", ".############."]
        col = mezcla(E["fondo"], "#FFFFFF", 0.55) if not es_oscuro(E["fondo"]) else mezcla(E["fondo"], "#FFFFFF", 0.12)
        im = Image.new("RGBA", (len(forma[0]), len(forma)), (0, 0, 0, 0))
        for y, f in enumerate(forma):
            for x, ch in enumerate(f):
                if ch == "#":
                    im.putpixel((x, y), col)
        reel.cache_img[clave] = im.resize((im.width * z, im.height * z), Image.Resampling.NEAREST)
    return reel.cache_img[clave]


def texto_pixel(reel, txt, tam, color, borde=None, grosor=5):
    clave = ("tp", txt, tam, color, borde)
    if clave not in reel.cache_img:
        f = fuente("pixel", tam)
        bb = f.getbbox(txt)
        im = Image.new("RGBA", (bb[2] + 2 * grosor + 10, bb[3] + 2 * grosor + 10), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        if borde:
            for dx in range(-grosor, grosor + 1, max(1, grosor // 2)):
                for dy in range(-grosor, grosor + 1, max(1, grosor // 2)):
                    d.text((grosor + 4 + dx, grosor + 4 + dy), txt, fill=borde, font=f)
        d.text((grosor + 4, grosor + 4), txt, fill=color, font=f)
        reel.cache_img[clave] = im
    return reel.cache_img[clave]


def emote_del_paso(paso, frases):
    if "emote" in paso:
        return paso["emote"]
    if paso.get("_frases"):
        txt = frases[paso["_frases"][0]]["texto"].strip()
        if txt.endswith("?"):
            return "?"
        if txt.endswith("!"):
            return "!"
    return None


def alto_titulares(reel, paso):
    return max([titular_img(reel, tt)[2] for tt in paso["_titulares"]] or [0])


def _pixel_disco(radio, color, paso=12):
    """Círculo pixelado (escalones de `paso` píxeles), con un aro de puntos."""
    n = int(radio * 2 / paso) + 3
    peq = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    d = ImageDraw.Draw(peq)
    c = n / 2
    r = radio / paso
    d.ellipse([c - r, c - r, c + r, c + r], fill=color)
    return peq.resize((n * paso, n * paso), Image.Resampling.NEAREST)


def halo(reel, lienzo, cx, cy, radio):
    if not reel.R.get("halo", True):
        return
    clave = ("halo", int(radio))
    if clave not in reel.cache_img:
        E = reel.E
        a = _pixel_disco(radio, mezcla(E["acento"], E["fondo"], 0.72))
        b = _pixel_disco(radio * 0.74, mezcla(E["acento"], E["fondo"], 0.55))
        a.paste(b, ((a.width - b.width) // 2, (a.height - b.height) // 2), b)
        reel.cache_img[clave] = a
    im = reel.cache_img[clave]
    lienzo.paste(im, (int(cx - im.width / 2), int(cy - im.height / 2)), im)


def destellos(reel, d, t, ocupado=()):
    """Estrellitas de píxel que parpadean en las zonas libres del fondo (movimiento suave constante)."""
    if not reel.R.get("destellos", True):
        return
    E = reel.E
    rng = np.random.default_rng(11)
    for k in range(14):
        x, y = rng.uniform(40, W - 40), rng.uniform(200, H - 120)
        fase, periodo = rng.uniform(0, 6.28), rng.uniform(1.6, 3.2)
        v = math.sin(2 * math.pi * t / periodo + fase)
        if v < 0.2:
            continue
        if any(x0 - 40 < x < x1 + 40 and y0 - 40 < y < y1 + 40 for (x0, y0, x1, y1) in ocupado):
            continue
        s = 8
        col = E["acento"] if k % 3 else E.get("borde", E["texto"])
        brazo = 1 if v < 0.75 else 2
        for i in range(-brazo, brazo + 1):
            d.rectangle([x + i * s, y, x + i * s + s - 1, y + s - 1], fill=col)
            d.rectangle([x, y + i * s, x + s - 1, y + i * s + s - 1], fill=col)


def fondo_paso(reel, i):
    clave = ("fondo", i)
    if clave in reel.cache_img:
        return reel.cache_img[clave]
    E = reel.E
    alterna = reel.R.get("alternar_fondo", True)
    base = E["fondo2"] if (alterna and i % 2) else E["fondo"]
    im = Image.new("RGB", (W, H), base)
    d = ImageDraw.Draw(im)
    # trama de puntos cuadrados, muy suave
    punto = mezcla(base, E["linea"], 0.55)
    for y in range(30, H, 56):
        for x in range(30 + (28 if (y // 56) % 2 else 0), W, 56):
            d.rectangle([x, y, x + 5, y + 5], fill=punto)
    cab = reel.R.get("cabecera", {})
    if cab.get("contador", False):
        txt = f"{i + 1:02d}/{len(reel.pasos):02d}"
        f = fuente("monobold", 30)
        tw = f.getlength(txt)
        d.rounded_rectangle([MX, Y_CABECERA - 25, MX + tw + 34, Y_CABECERA + 25], 12,
                            fill=mezcla(E["acento"], E["fondo"], 0.85), outline=E.get("borde", E["texto"]), width=3)
        d.text((MX + 17, Y_CABECERA), txt, fill=E.get("borde", E["texto"]), font=f, anchor="lm")
    der = cab.get("derecha", [])
    if der:
        if isinstance(der, str):
            der = [der]
        f1, f2 = fuente("mono", 30), fuente("monobold", 30)
        partes = [(der[0] + (" / " if len(der) > 1 else ""), f1 if len(der) > 1 else f2, E["suave"] if len(der) > 1 else E["acento"])]
        if len(der) > 1:
            partes.append((der[1], f2, E["acento"]))
        total = sum(f.getlength(t) for t, f, _ in partes)
        x = W - MX - total
        for t, f, c in partes:
            d.text((x, Y_CABECERA), t, fill=c, font=f, anchor="lm")
            x += f.getlength(t)
    reel.cache_img[clave] = im
    return im


def progreso(reel, lienzo, t):
    modo = reel.R.get("progreso", "xp")
    if reel.R.get("rejilla") is False or modo in (None, False, "no"):
        return
    E = reel.E
    d = ImageDraw.Draw(lienzo)
    frac = min(1.0, t / max(0.1, reel.total - 0.4))
    if modo == "rejilla":
        g = REJILLA
        n = g["cols"] * g["filas"]
        llenas = int(n * frac)
        tonos = np.random.default_rng(3).integers(0, len(E["rejilla"]), n)
        for k in range(n):
            c, r = k // g["filas"], k % g["filas"]
            x = g["x"] + c * (g["celda"] + g["hueco"]); y = g["y"] + r * (g["celda"] + g["hueco"])
            d.rounded_rectangle([x, y, x + g["celda"], y + g["celda"]], 4, fill=E["rejilla"][tonos[k]] if k < llenas else E["vacia"])
        return
    # barra de experiencia de videojuego
    x0, y0, w, h = 700, 1748, 310, 78
    caja(lienzo, x0, y0, w, h, E["tarjeta"], radio=12)
    borde = E.get("borde", E["texto"])
    d.text((x0 + 22, y0 + h / 2), "XP", fill=borde, font=fuente("pixel", 52), anchor="lm")
    seg, sx0 = 10, x0 + 84
    sw = (x0 + w - 18 - sx0) / seg
    llenos = frac * seg
    for k in range(seg):
        x = sx0 + k * sw
        rell = min(1.0, max(0.0, llenos - k))
        d.rectangle([x, y0 + 22, x + sw - 5, y0 + h - 22], fill=E["vacia"])
        if rell > 0:
            col = E["rejilla"][min(3, k * 4 // seg)] if rell >= 1 else E["acento"]
            d.rectangle([x, y0 + 22, x + (sw - 5) * (1 if rell >= 1 else rell), y0 + h - 22], fill=col)
    if 0 < llenos < seg and (t * 3) % 1 < 0.5:  # el segmento que se está llenando parpadea
        k = int(llenos)
        x = sx0 + k * sw
        d.rectangle([x, y0 + 22, x + sw - 5, y0 + h - 22], outline=borde, width=2)


def pose_en(paso, t_rel, reel):
    pose = paso.get("pose") or reel.pj.inicial
    t_cambio = 0.0
    for tt in paso["_titulares"]:
        if tt.get("pose") and tt["_t"] <= t_rel:
            pose, t_cambio = tt["pose"], tt["_t"]
    return pose, t_cambio


def escala_grande(reel):
    if "escala_grande" in reel.R:
        return float(reel.R["escala_grande"])
    if "_escala_grande" in reel.cache_img:
        return reel.cache_img["_escala_grande"]
    pj = reel.pj
    poses = [p for p in reel.pasos if p.get("personaje") == "grande"]
    usadas = [p.get("pose") or pj.inicial for p in poses] or [pj.inicial]
    ancho = max(pj.nat[p].width * pj.escala(p) for p in usadas)
    alto = max((pj.boca(p)["y"] - pj._arriba(p, pj.boca(p))) * pj.escala(p) for p in usadas)
    tope = 650  # debajo del titular más alto (2 líneas)
    e = max(1.0, min(2.0, 940 / max(1, ancho), (1290 - tope) / max(1, alto)))
    reel.cache_img["_escala_grande"] = e
    return e

def capa_tarjeta(reel, i, paso, t, area):
    """Dibuja la tarjeta en una capa aparte para colocarla sin pisar nada: se mide su tamaño final,
    se reduce si no cabe y se centra en el hueco libre. Devuelve (capa, x, y) o None."""
    tj = paso["tarjeta"]
    x, y, w, h = area
    margen = 60
    alto_capa = int(h + 2 * margen + 400)

    def dibuja(t_abs, seco):
        capa = Image.new("RGBA", (W, alto_capa), (0, 0, 0, 0))
        ctx = Ctx(reel, paso, t_abs, (x, margen, w, h))
        ctx.seco = seco
        TARJETAS[tj["tipo"]](capa, tj, ctx)
        return capa

    clave = ("ajuste", i, area)
    if clave not in reel.cache_img:
        final = dibuja(paso["_fin"] - 0.01, True)
        bb = final.getbbox()
        if not bb:
            reel.cache_img[clave] = (1.0, 0, 0, W / 2)
        else:
            arriba = min(bb[1], margen)
            alto = bb[3] - arriba
            ancho = bb[2] - bb[0]
            centro_x = (bb[0] + bb[2]) / 2
            k = min(reel.R.get("ampliar_tarjetas", 1.2), h / max(1, alto), (W - 2 * 36) / max(1, ancho))
            dy = max(0, (h - alto * k)) * (0.42 if reel.R.get("centrar_tarjetas", True) else 0)
            reel.cache_img[clave] = (k, dy, arriba, centro_x)
    k, dy, arriba, centro_x = reel.cache_img[clave]
    capa = dibuja(t, False)
    capa = capa.crop((0, arriba, W, alto_capa))
    if abs(k - 1) > 0.001:
        capa = capa.resize((max(1, int(W * k)), max(1, int(capa.height * k))), Image.Resampling.LANCZOS if k < 1 else Image.Resampling.BICUBIC)
    # entrada de la tarjeta: sube un poco y aparece
    t_rel = t - paso["_ini"]
    sube = 0
    if t_rel < 0.24:
        p = ease(t_rel / 0.24)
        if reel.R.get("juego", True):
            capa = mosaico(capa, p)
            a = np.array(capa)
            a[..., 3] = (a[..., 3] * min(1.0, p * 2.5)).astype(np.uint8)
            capa = Image.fromarray(a)
        else:
            sube = int(40 * (1 - p))
            a = np.array(capa)
            a[..., 3] = (a[..., 3] * p).astype(np.uint8)
            capa = Image.fromarray(a)
    return capa, int(W / 2 - centro_x * k), int(y + dy - (margen - arriba) * k + sube)


def fotograma(reel, f):
    t = f / FPS
    i, paso = reel.paso_en(t)
    E = reel.E
    lienzo = fondo_paso(reel, i).copy()
    d = ImageDraw.Draw(lienzo)
    t_rel = t - paso["_ini"]
    if i > 0 and t_rel < 1.0 / FPS + 1e-6:
        reel.sonido("pasa", paso["_ini"])
    ocupado = []
    personaje_grande = paso.get("personaje") == "grande"
    y_tit = Y_TITULO if not reel.R.get("cabecera", {}).get("contador") else Y_TITULO + 90
    # posición del personaje (también para el halo)
    destino, escala = BOCA_XY, 1.0
    if personaje_grande:
        destino, escala = (540, 1290), escala_grande(reel)
    elif i > 0 and reel.pasos[i - 1].get("personaje") == "grande" and t_rel < 0.4:
        p = ease(t_rel / 0.4)
        e0 = escala_grande(reel)
        destino = (540 + (BOCA_XY[0] - 540) * p, 1290 + (BOCA_XY[1] - 1290) * p)
        escala = e0 + (1 - e0) * p
    juego = reel.R.get("juego", True)
    if juego and reel.R.get("nubes", True):
        for k, (y_n, vel, x0n) in enumerate([(1040, 22, 120), (1360, 14, 700), (1620, 30, 380), (640, 10, 900)]):
            nb = nube(reel, 9 if k % 2 else 12)
            xn = (x0n + vel * t) % (W + nb.width) - nb.width
            lienzo.paste(nb, (int(xn), y_n), nb)
    halo(reel, lienzo, destino[0], destino[1] - 0.30 * ALTO_CABEZA * escala, 0.82 * ALTO_CABEZA * escala ** 0.8)
    # titular
    tits = [tt for tt in paso["_titulares"] if tt["_t"] <= t_rel + 1e-6]
    if tits:
        tt = tits[-1]
        img1, img2, alto = titular_img(reel, tt)
        dt = t_rel - tt["_t"]
        if dt < 1.0 / FPS + 1e-6 and (tt is not paso["_titulares"][0] or i == 0):
            reel.sonido("tic", paso["_ini"] + tt["_t"])
        y = y_tit
        ocupado.append((MX, y_tit, MX + max(img1.width if img1 is not None else 0, img2.width if img2 is not None else 0), y_tit + alto))
        if img1 is not None:
            a = ease(dt / 0.2)
            im = img1
            if a < 1:
                al = np.array(im); al[..., 3] = (al[..., 3] * a).astype(np.uint8); im = Image.fromarray(al)
            lienzo.paste(im, (int(MX - 40 * (1 - a)), int(y)), im)
            y += int(img1.height * 0.98) + 4
        if img2 is not None:
            p = ease((dt - (0.06 if img1 is not None else 0)) / 0.24)
            if p > 0:
                if juego:  # se materializa en píxeles grandes
                    im2 = mosaico(img2, p)
                    if p < 0.35:
                        al = np.array(im2); al[..., 3] = (al[..., 3] * (p / 0.35)).astype(np.uint8); im2 = Image.fromarray(al)
                    lienzo.paste(im2, (MX, int(y)), im2)
                else:
                    ancho = max(1, int(img2.width * p))
                    trozo = img2.crop((0, 0, ancho, img2.height))
                    lienzo.paste(trozo, (MX, int(y)), trozo)
    # tarjeta
    tj = paso.get("tarjeta")
    if tj:
        y0 = y_tit + alto_titulares(reel, paso) + 48
        if personaje_grande:
            area = (MX, y0, W - 2 * MX, 360)
        else:
            limite = BOCA_XY[1] - ALTO_CABEZA - 40
            if reel.R.get("halo", True):
                limite = min(limite, BOCA_XY[1] - 0.30 * ALTO_CABEZA - 0.82 * ALTO_CABEZA - 34)
            area = (MX, y0, W - 2 * MX, int(limite - y0))
        res = capa_tarjeta(reel, i, paso, t, area)
        if res:
            capa, cx, cy = res
            lienzo.paste(capa, (cx, cy), capa)
            bb = capa.getbbox()
            if bb:
                ocupado.append((cx + bb[0], cy + bb[1], cx + bb[2], cy + bb[3]))
    if not personaje_grande:
        ocupado.append((690, 1740, 1020, 1840))
    rr = 0.82 * ALTO_CABEZA * escala ** 0.8
    hc = destino[1] - 0.30 * ALTO_CABEZA * escala
    ocupado.append((destino[0] - rr, hc - rr, destino[0] + rr, H))
    destellos(reel, d, t, ocupado)
    # personaje
    pose, t_cambio = pose_en(paso, t_rel, reel)
    vis = reel.visemas[min(f, len(reel.visemas) - 1)]
    resp = round(3 * math.sin(2 * math.pi * t / 3.4))
    salto = -10 * (1 - ease((t_rel - t_cambio) / 0.16)) if (t_rel - t_cambio) < 0.16 and (i > 0 or t_cambio > 0) else 0
    P = reel.pj.escala(pose)
    Pg = max(2, round(P * escala))
    spr, (bx, by) = reel.pj.imagen(pose, vis, Pg, extender_a=(int(destino[1]), H + 40) if (escala == 1.0 or personaje_grande) else None)
    if abs(Pg - P * escala) > 0.01 and escala != 1.0 and not personaje_grande:
        fx = P * escala / Pg
        spr = spr.resize((max(1, int(spr.width * fx)), max(1, int(spr.height * fx))), Image.Resampling.NEAREST)
        bx, by = bx * fx, by * fx
    lienzo.paste(spr, (int(destino[0] - bx), int(destino[1] - by + resp + salto)), spr)
    # la barra de XP va encima del personaje para que ninguna pose la tape
    if not personaje_grande:
        progreso(reel, lienzo, t)
    # sello en el gancho
    if personaje_grande and paso.get("sello"):
        s = paso["sello"]
        ts = reel.cuando_abs(paso, s.get("en"), 0.6)
        if t_rel >= ts:
            reel.sonido("pop", paso["_ini"] + ts)
            from escenas import rebote
            k = rebote((t_rel - ts) / 0.35)
            s = dict(s); s["_pose"] = pose
            sello(reel, lienzo, s, k)
    sacudida = 0.0
    if personaje_grande and paso.get("sello"):
        ts = reel.cuando_abs(paso, paso["sello"].get("en"), 0.6)
        if 0 <= t_rel - ts < 0.3:
            sacudida = 1 - (t_rel - ts) / 0.3
            reel.sonido("golpe", paso["_ini"] + ts)
    if juego:
        sacudida = max(sacudida, efectos_juego(reel, lienzo, i, paso, t, t_rel, destino, escala, personaje_grande, tits))
    if sacudida > 0 and reel.R.get("sacudidas", True):
        rng = np.random.default_rng(f)
        dx, dy = (rng.integers(-12, 13, 2) * sacudida).astype(int)
        base = Image.new("RGB", (W, H), E["fondo"])
        base.paste(lienzo, (int(dx), int(dy)))
        lienzo = base
    return lienzo


def efectos_juego(reel, lienzo, i, paso, t, t_rel, destino, escala, grande, tits):
    """+XP al pasar de paso, bocadillos de emoción sobre la cabeza, placa del jugador y ¡LEVEL UP! al final.
    Devuelve la intensidad de sacudida de pantalla (0–1)."""
    from escenas import rebote
    E = reel.E
    borde = E.get("borde", E["texto"])
    sac = 0.0
    ultimo = (i == len(reel.pasos) - 1)
    # +XP cada vez que se pasa de paso
    if i > 0 and not grande and not ultimo and reel.R.get("progreso", "xp") == "xp" and t_rel < 0.9:
        reel.sonido("moneda", paso["_ini"] + 0.05)
        q = ease(t_rel / 0.9)
        im = texto_pixel(reel, reel.R.get("texto_xp", "+10 XP"), 80, E["acento"], borde, 3)
        if t_rel > 0.6:
            al = np.array(im); al[..., 3] = (al[..., 3] * max(0.0, 1 - (t_rel - 0.6) / 0.3)).astype(np.uint8); im = Image.fromarray(al)
        lienzo.paste(im, (int(860 - im.width / 2), int(1690 - 120 * q)), im)
    # ¡LEVEL UP! al empezar el último paso
    if ultimo and i > 0 and reel.R.get("subir_nivel", True) and t_rel < 1.4:
        reel.sonido("nivel", paso["_ini"] + 0.05)
        k = rebote(t_rel / 0.4)
        im = texto_pixel(reel, reel.R.get("texto_nivel", TEXTOS[reel.idioma]["nivel"]), 112, "#FFFFFF", borde, 6)
        caja_im = Image.new("RGBA", (im.width + 60, im.height + 30), (0, 0, 0, 0))
        rect_pixel(ImageDraw.Draw(caja_im), 0, 0, caja_im.width - 10, caja_im.height - 10, E["acento"], borde, 5, 10, borde, 8)
        caja_im.paste(im, (20, 6), im)
        if t_rel > 1.1:
            al = np.array(caja_im); al[..., 3] = (al[..., 3] * (1 - (t_rel - 1.1) / 0.3)).astype(np.uint8); caja_im = Image.fromarray(al)
        z = max(0.05, k)
        ci = caja_im.resize((max(1, int(caja_im.width * z)), max(1, int(caja_im.height * z))), Image.Resampling.NEAREST)
        nx, ny = reel.R.get("nivel_xy", (W - 40 - caja_im.width / 2, 1625))
        lienzo.paste(ci, (int(nx - ci.width / 2), int(ny - ci.height / 2)), ci)
        if t_rel < 0.3:
            sac = 0.7 * (1 - t_rel / 0.3)
    # golpe de pantalla en los titulares marcados
    for tt in paso["_titulares"]:
        if tt.get("golpe") and 0 <= t_rel - tt["_t"] < 0.25:
            reel.sonido("golpe", paso["_ini"] + tt["_t"])
            sac = max(sac, 1 - (t_rel - tt["_t"]) / 0.25)
    # bocadillos de emoción (!, ?, corazón…) sobre la cabeza
    eventos = []
    em = emote_del_paso(paso, reel.frases)
    if em:
        eventos.append((0.15, em))
    for tt in paso["_titulares"]:
        if tt.get("emote"):
            eventos.append((tt["_t"] + 0.05, tt["emote"]))
    for (te, nombre) in eventos:
        if 0 <= t_rel - te < 1.1:
            reel.sonido("blip", paso["_ini"] + te)
            k = rebote((t_rel - te) / 0.3)
            im = emote_img(reel, nombre, 9 if not grande else 12)
            z = max(0.05, k)
            im2 = im.resize((max(1, int(im.width * z)), max(1, int(im.height * z))), Image.Resampling.NEAREST)
            cx = destino[0] + 0.62 * ALTO_CABEZA * escala
            cy = destino[1] - 1.12 * ALTO_CABEZA * escala + 6 * math.sin((t_rel - te) * 8)
            lienzo.paste(im2, (int(cx - im2.width / 2), int(cy - im2.height)), im2)
    # placa del jugador en el gancho
    jug = reel.R.get("jugador")
    if jug and grande:
        nombre = f"{jug.get('nombre', 'PLAYER 1')}"
        nivel = jug.get("nivel")
        txt = nombre + (f"  LV.{nivel}" if nivel else "")
        im = texto_pixel(reel, txt, 58, borde)
        pw, ph = im.width + 40, im.height + 46
        placa = Image.new("RGBA", (pw + 10, ph + 10), (0, 0, 0, 0))
        dp = ImageDraw.Draw(placa)
        rect_pixel(dp, 0, 0, pw, ph, E["tarjeta"], borde, 4, 6, borde, 6)
        placa.paste(im, (18, 4), im)
        vida = float(jug.get("vida", 1.0))
        segs = 10
        for s_ in range(segs):
            x = 20 + s_ * (pw - 40) / segs
            col = "#2DBE60" if s_ < round(vida * segs) else E["vacia"]
            dp.rectangle([x, ph - 26, x + (pw - 40) / segs - 4, ph - 12], fill=col)
        a = ease(t_rel / 0.3)
        pose_g = pose_en(paso, t_rel, reel)[0]
        hay_sello = bool(paso.get("sello"))
        lado_s = lado_libre(reel, pose_g)
        # la placa va arriba a la derecha, junto a la cabeza (el sello queda más abajo)
        px = (jug["x"] - pw) if "x" in jug else (W - 40 - pw)
        del hay_sello, lado_s
        lienzo.paste(placa, (int(px), int(jug.get("y", 1180) + 30 * (1 - a))), placa)
    return sac


def sello(reel, lienzo, s, k):
    E = reel.E
    f1, f2 = fuente("black", 120), fuente("bold", 34)
    lns = [s.get("valor", ""), s.get("texto", "")]
    w = int(max(f1.getlength(lns[0]), f2.getlength(lns[1])) + 70)
    h = 210
    im = Image.new("RGBA", (w + 40, h + 40), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([20, 20, 20 + w, 20 + h], 28, fill=E["acento"], outline="#FFFFFF", width=8)
    d.text((20 + w / 2, 20 + 82), lns[0], fill="#FFFFFF", font=f1, anchor="mm")
    d.text((20 + w / 2, 20 + 168), lns[1], fill="#FFFFFF", font=f2, anchor="mm")
    im = im.rotate(-8, expand=True, resample=Image.Resampling.BICUBIC)
    z = max(0.05, k)
    im = im.resize((max(1, int(im.width * z)), max(1, int(im.height * z))))
    lado = lado_libre(reel, s.get("_pose"))
    x = s.get("x", 270 if lado == "izq" else 810)
    y = s.get("y", 1670)
    lienzo.paste(im, (int(x - im.width / 2), int(y - im.height / 2)), im)


def lado_libre(reel, pose):
    """«izq» o «der»: el lado del cuerpo con menos brazo/mano por debajo de la boca (para no taparlos)."""
    pose = pose or reel.pj.inicial
    clave = ("lado", pose)
    if clave not in reel.cache_img:
        nat = np.array(reel.pj.nat[pose])[..., 3] > 0
        b = reel.pj.boca(pose)
        ancho = nat.shape[1]
        margen = int(ancho * 0.22)
        abajo = nat[max(0, b["y"] - 10):, :]   # brazos y manos suelen estar a la altura de la cara o por debajo
        izq, der = abajo[:, :max(1, b["x"] - margen)].sum(), abajo[:, b["x"] + margen:].sum()
        reel.cache_img[clave] = "izq" if izq <= der else "der"
    return reel.cache_img[clave]


# ---------------------------------------------------------------- salida
def leer_mono(ruta):
    raw = subprocess.run([FFMPEG, "-v", "error", "-i", ruta, "-ac", "1", "-ar", "48000", "-f", "f32le", "-"],
                         capture_output=True).stdout
    return np.frombuffer(raw, np.float32).copy()


def mezclar_audio(reel, ruta_wav, sfx_vol):
    import wave
    dur = reel.total
    pista = np.zeros(int(48000 * dur), np.float32)
    if reel.voz:
        v = leer_mono(reel.voz)
        pista[:min(len(v), len(pista))] += v[:len(pista)]
    if sfx_vol > 0:
        s = sonidos.pista(reel.eventos, dur, ganancia=sfx_vol * (1.0 if reel.voz else 0.7))
        pista[:len(s)] += s
    pico = np.abs(pista).max() + 1e-9
    if pico > 0.98:
        pista *= 0.98 / pico
    with wave.open(ruta_wav, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(48000)
        w.writeframes((pista * 32767).astype(np.int16).tobytes())


def render(reel, salida, sfx_vol):
    n = int(math.ceil(reel.total * FPS))
    tmp_v = salida + ".video.mp4"
    cmd = [FFMPEG, "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
           "-i", "-", "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", "-tune", "animation", "-pix_fmt", "yuv420p", "-movflags", "+faststart", tmp_v]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    t0 = time.time()
    for f in range(n):
        im = fotograma(reel, f)
        proc.stdin.write(im.tobytes())
        if f % 150 == 0:
            print(f"  fotograma {f}/{n} · {f / FPS:.0f} s de vídeo · {time.time() - t0:.0f} s de reloj", flush=True)
    proc.stdin.close()
    if proc.wait():
        sys.exit("ffmpeg no pudo codificar el vídeo.")
    wav = salida + ".audio.wav"
    mezclar_audio(reel, wav, sfx_vol)
    filtro = []
    if reel.voz:
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        from alinear import normalizar
        wav2 = salida + ".audio_n.wav"
        normalizar(wav, wav2)
        os.replace(wav2, wav)
    subprocess.run([FFMPEG, "-v", "error", "-y", "-i", tmp_v, "-i", wav, "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
                    "-shortest", "-movflags", "+faststart", *filtro, salida], check=True)
    os.remove(tmp_v); os.remove(wav)
    mb = os.path.getsize(salida) / 1e6
    if mb > 28:
        print(f"  El vídeo pesa {mb:.1f} MB; lo recomprimo para que se pueda descargar (máx. 28 MB)…")
        kbps = int(27 * 8000 / reel.total) - 200
        tmp2 = salida + ".tmp.mp4"
        subprocess.run([FFMPEG, "-v", "error", "-y", "-i", salida, "-c:v", "libx264", "-preset", "veryfast", "-b:v", f"{kbps}k",
                        "-maxrate", f"{kbps}k", "-bufsize", f"{2 * kbps}k", "-c:a", "copy", tmp2], check=True)
        os.replace(tmp2, salida)
        mb = os.path.getsize(salida) / 1e6
    print(f"Listo: {salida} · {reel.total:.1f} s · {mb:.1f} MB · {time.time() - t0:.0f} s de render")


def muestras(reel, ruta, por_titular=False):
    imgs = []
    for i, p in enumerate(reel.pasos):
        tiempos = [p["_ini"] + (p["_fin"] - p["_ini"]) * 0.75]
        if por_titular and len(p["_titulares"]) > 1:
            fin = [tt["_t"] for tt in p["_titulares"][1:]] + [p["_fin"] - p["_ini"]]
            tiempos = [p["_ini"] + min(tt["_t"] + 0.5, (tt["_t"] + f) / 2) for tt, f in zip(p["_titulares"], fin)]
        for t in tiempos:
            imgs.append((i, t, fotograma(reel, int(t * FPS)).resize((270, 480), Image.Resampling.LANCZOS)))
    cols = min(6, len(imgs))
    filas = math.ceil(len(imgs) / cols)
    hoja = Image.new("RGB", (cols * 280 + 10, filas * 530 + 10), (40, 40, 40))
    d = ImageDraw.Draw(hoja)
    for k, (i, t, im) in enumerate(imgs):
        x, y = 10 + (k % cols) * 280, 10 + (k // cols) * 530
        hoja.paste(im, (x, y + 36))
        d.text((x, y + 6), f"paso {i + 1} · {t:.1f} s", fill=(255, 255, 255), font=fuente("semibold", 22))
    hoja.save(ruta)
    print("Muestras:", ruta)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("reel")
    ap.add_argument("--muestras", nargs="?", const="pasos", choices=["pasos", "titulares"],
                    help="«pasos»: un fotograma por paso; «titulares»: uno por cada titular")
    ap.add_argument("--en", type=float)
    ap.add_argument("--salida")
    ap.add_argument("--sin-sonidos", action="store_true")
    ap.add_argument("--sonidos", type=float, default=1.0)
    args = ap.parse_args()
    reel = Reel(args.reel, args)
    carpeta = os.path.join(reel.base, "salida")
    os.makedirs(carpeta, exist_ok=True)
    print(f"  {len(reel.pasos)} pasos · {reel.total:.1f} s · personaje a {reel.pj.P} px por píxel")
    if args.muestras:
        muestras(reel, os.path.join(carpeta, "muestras.png"), args.muestras == "titulares")
    elif args.en is not None:
        r = os.path.join(carpeta, f"fotograma_{args.en:.2f}.png")
        # recorre el tiempo hasta ahí para que los sonidos y estados sean los mismos
        fotograma(reel, int(args.en * FPS)).save(r)
        print("Fotograma:", r)
    else:
        salida = os.path.join(carpeta, args.salida or reel.R.get("salida", "reel.mp4"))
        render(reel, salida, 0 if args.sin_sonidos else args.sonidos)


if __name__ == "__main__":
    main()
