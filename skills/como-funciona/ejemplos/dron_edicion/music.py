# Upbeat 120 BPM track made in code (no copyright): intro with riser, drop at 5 s, outro fade. Writes music.wav
import numpy as np, wave, sys
SR = 44100; BPM = 120; B = 60 / BPM; DUR = float(sys.argv[1]) if len(sys.argv) > 1 else 30.0
N = int(SR * DUR); out = np.zeros((N, 2))
t_ = lambda d: np.arange(int(SR * d)) / SR
def place(x, at, g=1.0, pan=0.0):
    i = int(at * SR)
    if i >= N: return
    x = x[: N - i]; out[i:i + len(x), 0] += x * g * (1 - max(0, pan)); out[i:i + len(x), 1] += x * g * (1 + min(0, pan))
def kick():
    t = t_(.35); f = 50 + 120 * np.exp(-t * 30); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)
def clap():
    t = t_(.25); n = np.random.default_rng(1).standard_normal(len(t)); return n * np.exp(-t * 22) * .5
def hat(open_=False):
    t = t_(.12 if not open_ else .3); n = np.random.default_rng(2).standard_normal(len(t)); n = np.diff(n, prepend=0); return n * np.exp(-t * (60 if not open_ else 14)) * .25
def saw(f, d):
    t = t_(d); return sum(np.sin(2 * np.pi * f * k * t) / k for k in range(1, 8))
def note(m): return 440 * 2 ** ((m - 69) / 12)
prog = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]   # Am F C G
DROP = 5.0
bar = 4 * B
for i in range(int(DUR / bar) + 1):
    ch = prog[i % 4]; at = i * bar
    pad = sum(saw(note(m), bar) for m in ch) / 3
    env = np.minimum(1, t_(bar) / .3) * np.minimum(1, (bar - t_(bar)) / .3)
    place(pad * env * .10, at, 1, 0)
    if at >= DROP - 1e-6:
        for k in range(8):                                       # bass on 8ths
            bt = at + k * B / 2; d = B / 2 * .9; x = saw(note(ch[0] - 24), d) * np.exp(-t_(d) * 4)
            place(x * .22, bt)
        for k in range(4):                                       # lead pluck arpeggio
            m = ch[k % 3] + 12; d = B * .9; x = np.sin(2 * np.pi * note(m) * t_(d)) * np.exp(-t_(d) * 6)
            place(x * .12, at + k * B, 1, -.3 + .2 * k)
# drums
for k in range(int(DUR / B) + 1):
    bt = k * B
    if bt >= DROP - 1e-6 and bt < DUR - 2.0:
        place(kick(), bt, .9)
        if k % 2: place(clap(), bt, .5)
        place(hat(), bt + B / 2, .7, .4)
    elif bt < DROP:
        if k % 2 == 0: place(hat(), bt, .4, -.3)
# riser + impact into the drop
t = t_(3.0); n = np.random.default_rng(3).standard_normal(len(t)); r = n * (t / 3) ** 2 * .3
place(np.convolve(r, np.ones(30) / 30, 'same'), DROP - 3.0, 1)
place(kick() * 1.4, DROP, 1); place(clap(), DROP, .8)
# fade out
fade = np.ones(N); fl = int(SR * 2.5); fade[-fl:] = np.linspace(1, 0, fl); out *= fade[:, None]
out /= np.max(np.abs(out)) + 1e-9; out *= .9
with wave.open('music.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out * 32767).astype(np.int16).tobytes())
print('music.wav', DUR)
