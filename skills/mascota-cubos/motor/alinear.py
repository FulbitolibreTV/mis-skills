#!/usr/bin/env python3
"""Prepara la voz y saca el tiempo de cada palabra del guion.

python3 alinear.py proyecto/reel.json voz_original.mp3 [--acelerar 1.05] [--pausa 0.26]

1. Recorta las pausas largas (como mucho --pausa segundos) y normaliza a -14 LUFS → proyecto/voz.wav
2. Reconoce la voz (faster-whisper, modelo small) y empareja con el guion → proyecto/tiempos.json
   Si no hay reconocimiento disponible, reparte las palabras por los tramos con voz (avisa).
3. Apunta voz y tiempos en reel.json.
"""
import json, os, re, subprocess, sys, unicodedata, difflib, wave, shutil, hashlib, tempfile

# huella del modelo Whisper small (faster-whisper): se comprueba aquí, no con un archivo del propio paquete
SHA_SMALL = 'ca732cb1379efc49417d028465f543d83a39de2c61f3027678de103dc404ce73'

args = sys.argv[1:]
def opt(n, d=None):
    return args[args.index('--' + n) + 1] if '--' + n in args else d
plan_ruta = next(a for a in args if a.endswith('.json'))
voz_in = next(a for a in args if not a.endswith('.json') and not a.startswith('--') and a not in (opt('acelerar'), opt('pausa')))
acel = float(opt('acelerar', '1.0')); pausa_max = float(opt('pausa', '0.26'))
dir_ = os.path.dirname(os.path.abspath(plan_ruta))
plan = json.load(open(plan_ruta, encoding='utf-8'))

def ff(*a):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *a], check=True)

tmp = tempfile.mkdtemp()
base = os.path.join(tmp, 'base.wav')
ff('-i', voz_in, '-ac', '1', '-ar', '48000', *(['-af', f'atempo={acel}'] if acel != 1.0 else []), base)

# --- silencios ---
r = subprocess.run(['ffmpeg', '-i', base, '-af', 'silencedetect=noise=-38dB:d=0.12', '-f', 'null', '-'], capture_output=True, text=True).stderr
ini = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', r)]
fin = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', r)]
dur = float(re.findall(r'time=(\d+):(\d+):([\d.]+)', r)[-1][2]) + 60 * int(re.findall(r'time=(\d+):(\d+):([\d.]+)', r)[-1][1])
with wave.open(base) as w: dur = w.getnframes() / w.getframerate()
sil = list(zip(ini, fin + [dur] * (len(ini) - len(fin))))
# tramos que se conservan
tramos, cur = [], 0.0
for a, b in sil:
    if a <= 0.01:  # silencio inicial: dejar 0,05 s
        cur = max(cur, b - 0.05); continue
    if b >= dur - 0.01:  # silencio final: dejar 0,3 s
        tramos.append((cur, min(dur, a + 0.3))); cur = None; break
    if b - a > pausa_max:
        tramos.append((cur, a + pausa_max / 2)); cur = b - pausa_max / 2
if cur is not None: tramos.append((cur, dur))
partes = ''.join(f'[0:a]atrim={a:.3f}:{b:.3f},asetpts=PTS-STARTPTS[p{i}];' for i, (a, b) in enumerate(tramos))
cortada = os.path.join(tmp, 'cortada.wav')
ff('-i', base, '-filter_complex', partes + ''.join(f'[p{i}]' for i in range(len(tramos))) + f'concat=n={len(tramos)}:v=0:a=1[o]', '-map', '[o]', cortada)
voz_out = os.path.join(dir_, 'voz.wav')
ff('-i', cortada, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=7', '-ar', '48000', '-ac', '2', voz_out)
with wave.open(voz_out) as w: duracion = w.getnframes() / w.getframerate()
print(f'Voz: {dur:.1f} s → {duracion:.1f} s (pausas ≤ {pausa_max} s, x{acel})')

# --- guion ---
def norm(s):
    s = unicodedata.normalize('NFD', s.lower())
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]', '', s)
ALIAS = {'clod': 'claude', 'clot': 'claude', 'cloud': 'claude', 'klod': 'claude', 'ril': 'reel', 'rils': 'reels', 'riel': 'reel',
         'elevenlabs': 'elevenlabs', 'once': 'once', '3d': 'tresd', 'tresde': 'tresd'}
guion = []
for i, fr in enumerate(plan['frases']):
    for w in fr['texto'].split():
        guion.append({'texto': w, 'frase': i, 'n': ALIAS.get(norm(w), norm(w))})

# --- reconocimiento ---
def modelo_whisper():
    d = os.environ.get('WHISPER_DIR') or os.path.expanduser('~/.cache/mascota-cubos/whisper-small')
    if os.path.exists(os.path.join(d, 'model.bin')): return d
    os.makedirs(d, exist_ok=True)
    try:  # el modelo viaja en npm (4 partes) porque el registro de npm suele estar permitido
        for i in range(4):
            subprocess.run(['npm', 'pack', '-q', f'@skillninja/shortmovie-telop-model-p{i}', '--pack-destination', d], check=True, capture_output=True, timeout=300)
        for t in sorted(f for f in os.listdir(d) if f.endswith('.tgz')):
            subprocess.run(['tar', 'xzf', os.path.join(d, t), '-C', d], check=True)
            for f in os.listdir(os.path.join(d, 'package')): shutil.move(os.path.join(d, 'package', f), os.path.join(d, f)) if not os.path.exists(os.path.join(d, f)) or f.startswith('model.bin') else None
            shutil.rmtree(os.path.join(d, 'package')); os.remove(os.path.join(d, t))
        with open(os.path.join(d, 'model.bin'), 'wb') as out:
            for i in range(4):
                p = os.path.join(d, f'model.bin.part{i}')
                out.write(open(p, 'rb').read()); os.remove(p)
        h = hashlib.sha256()
        with open(os.path.join(d, 'model.bin'), 'rb') as fh:
            for b in iter(lambda: fh.read(1 << 22), b''): h.update(b)
        if h.hexdigest() != SHA_SMALL:
            os.remove(os.path.join(d, 'model.bin'))  # que no se quede un modelo malo para la próxima vez
            raise RuntimeError('el modelo descargado no pasa la comprobación (sha256)')
        return d
    except Exception as e:
        print('Aviso: no pude preparar el modelo de reconocimiento:', e)
        return None

palabras_asr = None
try:
    from faster_whisper import WhisperModel
except ImportError:
    subprocess.run([sys.executable, '-m', 'pip', 'install', '-q', '--break-system-packages', 'faster-whisper'], capture_output=True)
    try: from faster_whisper import WhisperModel
    except ImportError: WhisperModel = None
md = modelo_whisper() if WhisperModel and '--sin-asr' not in args else None
if md:
    import numpy as np
    m16 = os.path.join(tmp, 'm16.wav'); ff('-i', voz_out, '-ac', '1', '-ar', '16000', m16)
    with wave.open(m16) as w: audio = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    modelo = WhisperModel(md, device='cpu', compute_type='int8')
    segs, _ = modelo.transcribe(audio, language=plan.get('idioma', 'es'), word_timestamps=True, initial_prompt=' '.join(fr['texto'] for fr in plan['frases'])[:800])
    palabras_asr = [{'n': ALIAS.get(norm(x.word), norm(x.word)), 'ini': x.start, 'fin': x.end} for s in segs for x in s.words]
    palabras_asr = [p for p in palabras_asr if p['n']]

if palabras_asr:
    a = [g['n'] for g in guion]; b = [p['n'] for p in palabras_asr]
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            g, p = guion[blk.a + k], palabras_asr[blk.b + k]
            g['ini'], g['fin'] = p['ini'], p['fin']
    # parecidas (no exactas) en los huecos
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == 'replace' and i2 - i1 == j2 - j1:
            for k in range(i2 - i1):
                guion[i1 + k]['ini'], guion[i1 + k]['fin'] = palabras_asr[j1 + k]['ini'], palabras_asr[j1 + k]['fin']
    emparejadas = sum(1 for g in guion if 'ini' in g)
    print(f'Reconocimiento: {emparejadas}/{len(guion)} palabras emparejadas ({100 * emparejadas / len(guion):.0f} %)')
else:
    print('Aviso: sin reconocimiento de voz. Reparto las palabras por los tramos con voz (menos preciso).')
    r = subprocess.run(['ffmpeg', '-i', voz_out, '-af', 'silencedetect=noise=-38dB:d=0.12', '-f', 'null', '-'], capture_output=True, text=True).stderr
    si = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', r)]; sf = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', r)]
    voz_tr, c = [], 0.0
    for x, y in zip(si, sf + [duracion]):
        if x > c: voz_tr.append((c, x))
        c = y
    if c < duracion: voz_tr.append((c, duracion))
    total_voz = sum(y - x for x, y in voz_tr)
    pesos = [len(g['texto']) + 2 for g in guion]; tot = sum(pesos); acc = 0
    def en_voz(fr):
        objetivo = fr * total_voz
        for x, y in voz_tr:
            if objetivo <= y - x: return x + objetivo
            objetivo -= y - x
        return duracion
    for g, p in zip(guion, pesos):
        g['ini'] = en_voz(acc / tot); acc += p; g['fin'] = en_voz((acc - 2) / tot)

# interpolar las que falten
for i, g in enumerate(guion):
    if 'ini' not in g:
        prev = next((guion[j]['fin'] for j in range(i - 1, -1, -1) if 'fin' in guion[j]), 0.0)
        sig = next((guion[j]['ini'] for j in range(i + 1, len(guion)) if 'ini' in guion[j]), duracion)
        huecos = [h for h in guion[i:] if 'ini' not in h]
        n = next((k for k, h in enumerate(guion[i:]) if 'ini' in h), len(guion) - i)
        paso = (sig - prev) / (n + 1)
        g['ini'] = prev + paso * 0.5; g['fin'] = prev + paso
for i in range(1, len(guion)):
    if guion[i]['ini'] < guion[i - 1]['ini']: guion[i]['ini'] = guion[i - 1]['ini'] + 0.01

out = {'duracion': round(duracion, 3), 'palabras': [{'texto': g['texto'], 'ini': round(g['ini'], 3), 'fin': round(g['fin'], 3), 'frase': g['frase']} for g in guion]}
json.dump(out, open(os.path.join(dir_, 'tiempos.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
plan['voz'] = 'voz.wav'; plan['tiempos'] = 'tiempos.json'
json.dump(plan, open(plan_ruta, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
ppm = len(guion) / duracion * 60
print(f'Listo: {len(guion)} palabras en {duracion:.1f} s ({ppm:.0f} palabras/min).' + (' Sugerencia: --acelerar 1.05' if ppm < 190 and acel == 1.0 else ''))
shutil.rmtree(tmp, ignore_errors=True)
