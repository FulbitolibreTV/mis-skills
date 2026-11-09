# Word timings for a Spanish voiceover. Run from a reel folder: align_es.py audio/vo.wav
# Writes audio/words.json and web/words.js ([{w, s, e, line, k}], k = 1 for *key* words).
#   1. If a multilingual Parakeet model (folder name contains "parakeet" and "v3") is in KIT/models, it listens to the take.
#   2. Otherwise, for the Kokoro voice, it uses the exact line times from audio/lines.json.
#   3. Otherwise (your own recording), it finds the pauses and spreads the lines over them.
# Inside a line, words get time by syllables and commas snap to the real pauses.
import json, re, os, sys, glob, difflib, unicodedata, numpy as np, soundfile as sf
KIT = os.environ.get("KIT", "")
src = sys.argv[1] if len(sys.argv) > 1 else "audio/vo.wav"
a, sr = sf.read(src, dtype="float32")
if a.ndim > 1: a = a.mean(1)
dur = len(a) / sr
raw = json.load(open("script.json", encoding="utf-8"))
REPL = json.load(open("captions.json", encoding="utf-8")) if os.path.exists("captions.json") else {}
spoken = [re.sub(r"\*", "", L) for L in raw]
def norm(w): return re.sub(r"[^a-z0-9ñ]", "", unicodedata.normalize("NFD", w.lower()).replace("̃", "~").encode("ascii", "ignore").decode().replace("n~", "ñ"))
def syl(w): return max(1, len(re.findall(r"[aeiouáéíóúü]+", w.lower()))) + (0.4 if any(c.isdigit() for c in w) else 0)

# --- speech / pause map (10 ms hops)
hop = int(sr * .01); n = len(a) // hop
rms = np.sqrt(np.mean(a[:n * hop].reshape(n, hop) ** 2, 1))
thr = max(np.percentile(rms, 95) * .06, np.percentile(rms, 10) * 3, 1e-4)
speech = rms > thr
pauses = []; i = 0
while i < n:
    if not speech[i]:
        j = i
        while j < n and not speech[j]: j += 1
        if (j - i) * .01 >= .12: pauses.append((i * .01, j * .01))
        i = j
    else: i += 1

def spread(words, s0, e0):
    """time words inside [s0, e0] by syllables, commas get a little extra air and snap to real pauses"""
    wts = [syl(w) + (0.8 if re.search(r"[,;:]$", w) else 0) for w in words]
    tot = sum(wts); t = s0; out = []
    for w, k in zip(words, wts): out.append([t, 0]); t += (e0 - s0) * k / tot
    for idx, w in enumerate(words[:-1]):
        if re.search(r"[,;:]$", w):
            guess = out[idx + 1][0]
            near = [p for p in pauses if s0 < p[1] < e0 and abs(p[1] - guess) < .45]
            if near:
                p = min(near, key=lambda p: abs(p[1] - guess)); shift = p[1] - guess
                for k2 in range(idx + 1, len(words)):   # move the rest, squeezing toward the line end
                    out[k2][0] += shift * (1 - (k2 - idx - 1) / max(1, len(words) - idx - 1))
    for idx in range(len(out)): out[idx][1] = out[idx + 1][0] if idx + 1 < len(out) else e0
    return out

line_words = [L.split() for L in spoken]
times = None
models = [d for d in glob.glob(os.path.join(KIT, "models", "*parakeet*")) if "v3" in d]
edge = json.load(open("audio/edge_words.json", encoding="utf-8")) if os.path.exists("audio/edge_words.json") and os.path.exists("audio/edge.txt") else None
if edge and edge["lines"] == spoken and abs(edge["words"][-1]["e"] - dur) < .8:
    # the Edge voice told us when every word is said: use it as is
    times = [[[w["s"], w["e"]] for w in edge["words"] if w["line"] == li] for li in range(len(line_words))]
    print("timed from the Edge voice word marks (exact)")
elif models:
    import sherpa_onnx
    d = models[0]
    rec = sherpa_onnx.OfflineRecognizer.from_transducer(encoder=f"{d}/encoder.int8.onnx", decoder=f"{d}/decoder.int8.onnx", joiner=f"{d}/joiner.int8.onnx", tokens=f"{d}/tokens.txt", model_type="nemo_transducer")
    b = a if sr == 16000 else np.interp(np.linspace(0, len(a) - 1, int(len(a) * 16000 / sr)), np.arange(len(a)), a).astype(np.float32)
    st = rec.create_stream(); st.accept_waveform(16000, b); rec.decode_stream(st); r = st.result
    asr = []
    for tok, ts in zip(r.tokens, r.timestamps):
        if tok.startswith(" ") or tok.startswith("▁") or not asr: asr.append([tok.strip(" ▁"), ts])
        else: asr[-1][0] += tok
    flat = [(w, li) for li, L in enumerate(line_words) for w in L]
    sm = difflib.SequenceMatcher(a=[norm(w) for w, _ in flat], b=[norm(x[0]) for x in asr], autojunk=False)
    st_ = [None] * len(flat)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size): st_[blk.a + k] = asr[blk.b + k][1]
    for i2 in range(len(flat)):
        if st_[i2] is None:
            lo = next((j for j in range(i2 - 1, -1, -1) if st_[j] is not None), None); hi = next((j for j in range(i2 + 1, len(flat)) if st_[j] is not None), None)
            st_[i2] = (st_[lo] + (st_[hi] - st_[lo]) * (i2 - lo) / (hi - lo)) if lo is not None and hi is not None else (st_[lo] + .3 if lo is not None else 0)
    times = []; k = 0
    for L in line_words:
        row = []
        for _ in L: row.append([st_[k], min(st_[k + 1] if k + 1 < len(st_) else dur, st_[k] + 1.2)]); k += 1
        times.append(row)
    print("aligned with", os.path.basename(d))
else:
    meta = json.load(open("audio/lines.json", encoding="utf-8"))["lines"] if os.path.exists("audio/lines.json") else None
    kokoro = meta and [m["text"] for m in meta] == spoken and abs(meta[-1]["start"] + meta[-1]["dur"] - dur) < .6 and src.endswith("vo.wav") and os.path.exists("audio/kokoro.txt")
    if kokoro:
        spans = [(m["start"], m["start"] + m["dur"]) for m in meta]; print("timed from the Kokoro line times")
    else:
        # own recording (or ElevenLabs): choose the line breaks among the real pauses all at once (dynamic programming):
        # each line should last about its syllables x the speaking rate, and sentence ends usually sit on the longer pauses
        s0 = np.argmax(speech) * .01; e0 = (n - np.argmax(speech[::-1])) * .01
        w = [sum(syl(x) for x in L) + .8 * len(re.findall(r"[,;:]", " ".join(L))) for L in line_words]
        P = [p for p in pauses if s0 < p[0] and p[1] < e0]
        talk = (e0 - s0) - sum(p[1] - p[0] for p in P) * .5
        rate = talk / sum(w)
        starts = [s0] + [p[1] for p in P]; ends = [p[0] for p in P] + [e0]   # a line runs from a start to an end
        L_n, K = len(line_words), len(P) + 1
        INF = 1e18; best = np.full((L_n + 1, K + 1), INF); back = np.zeros((L_n + 1, K + 1), int); best[0][0] = 0
        def cost(i, a, b):   # line i from starts[a] to ends[b - 1]
            d = ends[b - 1] - starts[a]; exp = rate * w[i]
            if d <= .15: return INF
            gap = (P[b - 1][1] - P[b - 1][0]) if b - 1 < len(P) else .6
            return (d - exp) ** 2 / exp - 1.2 * min(gap, .6)
        for i in range(L_n):
            for a in range(K):
                if best[i][a] >= INF: continue
                for b in range(a + 1, K + 1):
                    if i < L_n - 1 and b == K: break
                    if i == L_n - 1 and b != K: continue
                    c = best[i][a] + cost(i, a, b)
                    if c < best[i + 1][b]: best[i + 1][b] = c; back[i + 1][b] = a
        b = K; cuts = []
        for i in range(L_n, 0, -1): a = back[i][b]; cuts.append((starts[a], ends[b - 1])); b = a
        spans = cuts[::-1]; print("timed from the pauses in the recording (check the stills)")
    times = [spread(L, s, e) for L, (s, e) in zip(line_words, spans)]

# --- caption text: replacements (spoken phrase -> what to show) and *key* words
words = []
for li, (L, T) in enumerate(zip(line_words, times)):
    toks = [[w, s, e] for w, (s, e) in zip(L, T)]
    for spoken_p, shown in REPL.items():
        sp = [norm(x) for x in spoken_p.split()]
        for i2 in range(len(toks) - len(sp) + 1):
            if [norm(x[0]) for x in toks[i2:i2 + len(sp)]] == sp:
                tail = re.sub(r"^.*?([^\w*]*)$", r"\1", toks[i2 + len(sp) - 1][0])   # keep trailing punctuation
                s, e = toks[i2][1], toks[i2 + len(sp) - 1][2]; parts = shown.split(); step = (e - s) / len(parts)
                new = [[p + (tail if j == len(parts) - 1 else ""), s + j * step, s + (j + 1) * step] for j, p in enumerate(parts)]
                toks = toks[:i2] + new + toks[i2 + len(sp):]; break
    keyed = raw[li].split()   # *key* marks from the original line, matched by position where the words agree
    keyset = {norm(x) for x in keyed if "*" in x}   # replacement words carry their own *stars*
    for w, s, e in toks:
        k = 1 if "*" in w or norm(w) in keyset else 0
        words.append({"w": w.replace("*", ""), "s": round(s, 3), "e": round(e, 3), "line": li, "k": k})
json.dump(words, open("audio/words.json", "w", encoding="utf-8"), ensure_ascii=False, indent=0)
open("web/words.js", "w", encoding="utf-8").write("const WORDS=" + json.dumps(words, ensure_ascii=False) + ";")
print(f"{len(words)} words, {dur:.2f}s")
print(" ".join(f"{w['w']}@{w['s']:.2f}" for w in words[:16]))
