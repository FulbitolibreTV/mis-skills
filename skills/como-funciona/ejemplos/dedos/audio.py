# Sound for the reel, all made in code: a dark ambient bed, soft whooshes on cuts, ticks on key words, and a few cues.
# Reads audio/vo.wav, audio/words.json and audio/spans.json (make.sh writes them). Writes audio/mix.wav.
import json, re, unicodedata, numpy as np, soundfile as sf
from scipy import signal
SR = 44100
WORDS = json.load(open('audio/words.json', encoding='utf-8'))
SP = json.load(open('audio/spans.json'))
DUR = SP['dur'] + .3
N = int(DUR * SR)
rng = np.random.default_rng(3)
def norm(s): return re.sub(r'[^a-z0-9]', '', unicodedata.normalize('NFD', s.lower()).encode('ascii', 'ignore').decode())
def WT(word, n=0, from_line=0):
    m = [w for w in WORDS if w['line'] >= from_line and norm(w['w']) == norm(word)]
    return m[n]['s'] if len(m) > n else None
def LINE(i): return next(w['s'] for w in WORDS if w['line'] == i)
def T(n): return np.arange(n) / SR
def place(buf, x, at, g=1.0):
    if at is None: return
    i = int(at * SR); j = min(len(buf), i + len(x))
    if 0 <= i < len(buf): buf[i:j] += x[:j - i] * g
def bp(x, lo, hi): b, a = signal.butter(2, [lo / (SR / 2), min(hi / (SR / 2), .99)], 'band'); return signal.lfilter(b, a, x)
def lp(x, f): b, a = signal.butter(2, f / (SR / 2), 'low'); return signal.lfilter(b, a, x)
def hp(x, f): b, a = signal.butter(2, f / (SR / 2), 'high'); return signal.lfilter(b, a, x)

# ---------------- sfx kit ----------------
def whoosh(dur=.4):
    n = int(dur * SR); x = rng.standard_normal(n); k = np.linspace(0, 1, n)
    return (bp(x, 300, 1500) * (1 - k) + bp(x, 1500, 7000) * k) * np.sin(np.pi * k) ** 1.6 * 1.2
def tick(f=2600):
    n = int(.05 * SR); t = T(n); return hp(rng.standard_normal(n), 3500) * np.exp(-t * 220) * .5 + np.sin(2 * np.pi * f * t) * np.exp(-t * 90) * .35
def blip(f=880, dur=.25):
    n = int(dur * SR); t = T(n); return (np.sin(2 * np.pi * f * t) + .3 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 14) * np.minimum(1, t / .003) * .5
def shimmer(dur=1.2):
    out = np.zeros(int(dur * SR))
    for i, f in enumerate([1568, 2093, 2637, 3136]): place(out, blip(f, .7) * .45, i * .06)
    return out
def hum(dur=1.5, f=120):
    n = int(dur * SR); t = T(n); x = np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * 2 * f * t) + .25 * np.sin(2 * np.pi * 3 * f * t)
    return x * np.minimum(1, t / .15) * np.minimum(1, (dur - t) / .3) * .25
def riser(dur=1.5):
    n = int(dur * SR); t = T(n); f = 220 * 2 ** (t / dur * 2)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * .3 + bp(rng.standard_normal(n), 1000, 6000) * .25 * t / dur) * (t / dur) ** 2
def thump(f0=60, dur=.4):
    n = int(dur * SR); t = T(n); f = f0 * (1 + 1.2 * np.exp(-t * 25)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)
def tap(): x = thump(180, .08) * .5; x[:2205] += tick(1800)[:len(x)] * .6; return x
def sizzle(dur=1.0):
    n = int(dur * SR); t = T(n); x = hp(rng.standard_normal(n), 2500) * (rng.random(n) > .985) * 3
    return lp(x, 9000) * np.minimum(1, t / .2) * np.minimum(1, (dur - t) / .3) * .5

sfx = np.zeros(N)
# every cut gets a soft whoosh, every *key* word a tick
for i, (s, e, tr) in enumerate(SP['shots'][1:], 1): place(sfx, whoosh(.38 if tr != 'cut' else .28), s - .2, .22 if tr == 'cut' else .32)
for w in WORDS:
    if w['k']: place(sfx, tick(), w['s'], .3)

# ---- cues for this reel (edit per reel: WT('word') = when that word is said)
place(sfx, shimmer(), 0.2, .3)                                              # fingertip wrinkling
place(sfx, tap(), WT('brazos'), .5); place(sfx, blip(880, .4), WT('brazos'), .25)
place(sfx, sizzle(1.2), WT('absorbe'), .25); place(sfx, tap(), WT('eso'), .7); place(sfx, blip(300, .3), WT('eso'), .35)
place(sfx, blip(1320, .5), WT('90'), .25); place(sfx, whoosh(.5), WT('cortado'), .4); place(sfx, tap(), WT('cortado'), .6)
place(sfx, riser(1.2), WT('sistema'), .3); place(sfx, shimmer(), (WT('sistema') or 0) + .6, .3)
place(sfx, whoosh(.8), LINE(4), .4); place(sfx, hum(2.0, 90), WT('cierran'), .35)
place(sfx, blip(660, .4), WT('pliega'), .35); place(sfx, shimmer(), WT('pliega'), .25)
place(sfx, riser(1.0), WT('curioso'), .3); place(sfx, blip(1760, .5), WT('para'), .3)
place(sfx, whoosh(.6), WT('llanta'), .35); place(sfx, tap(), WT('agarras'), .5)
place(sfx, blip(1320, .4), WT('canicas'), .25); place(sfx, shimmer(), WT('12'), .4); place(sfx, tap(), WT('12'), .6)
place(sfx, tap(), WT('amigo'), .6); place(sfx, tap(), (WT('ducha') or 0) + .2, .6); place(sfx, shimmer(), (WT('ducha') or 0) + .3, .35)

# ---------------- music: slow dark pad, a soft pulse, lifts at the end ----------------
def midi(m): return 440 * 2 ** ((m - 69) / 12)
def pad(ms, dur, g=1.0):
    n = int(dur * SR); t = T(n); x = np.zeros(n)
    for m in ms:
        for d in (-.004, 0, .004):
            ph = np.cumsum(midi(m) * (1 + d) * (1 + .002 * np.sin(2 * np.pi * .3 * t))) / SR; x += 2 * (ph % 1) - 1
    x = lp(x / (len(ms) * 3), 900); return x * np.minimum(1, t / 1.0) * np.minimum(1, (dur - t) / 1.0) * g
def pluck(m, dur=.6):
    n = int(dur * SR); t = T(n); f = midi(m); return (np.sin(2 * np.pi * f * t) + .25 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 6) * np.minimum(1, t / .004)
music = np.zeros(N)
prog = [(45, 52, 57, 60), (41, 48, 53, 57), (43, 50, 55, 59), (40, 47, 52, 56)]   # Am F G E
bar = 3.2; t = 0; k = 0
while t < DUR:
    place(music, pad(prog[k % 4], bar + 1.2, .5), t)
    for j in range(8): place(music, pluck(prog[k % 4][1 + j % 3] + 12, .5) * .18, t + j * bar / 8)
    t += bar; k += 1
music = lp(music, 5000)

# ---------------- voice + mix ----------------
vo, vsr = sf.read('audio/vo.wav')
if vo.ndim > 1: vo = vo.mean(1)
vo = signal.resample_poly(vo, SR, vsr); vo = hp(vo, 80)
env = lp(np.abs(signal.hilbert(vo)), 20); vo = vo * np.where(env > .15, (.15 / np.maximum(env, 1e-6)) ** .4, 1.0)
vo = vo / (np.max(np.abs(vo)) + 1e-9) * .9
VO = np.zeros(N); VO[:min(N, len(vo))] = vo[:N]
duck = 1 - .5 * np.clip(lp(np.abs(VO), 6) / .05, 0, 1)
mix = VO + music * .16 * duck + sfx * .75
fl = int(.6 * SR); mix[-fl:] *= np.linspace(1, 0, fl)
mix = mix / np.max(np.abs(mix)) * .89
sf.write('audio/mix.wav', np.stack([mix, mix], 1), SR)
print('mix', round(DUR, 2), 's')
