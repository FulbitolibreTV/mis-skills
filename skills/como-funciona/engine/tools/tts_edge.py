# Free Spanish voiceover with the Microsoft Edge voices (45 voices from 22 countries), with the exact time of every word.
# Run from a reel folder: reads script.json, writes audio/vo_edge.wav and audio/edge_words.json (align_es.py uses them).
#   tts_edge.py [voice] [rate] [pitch]   defaults: es-MX-JorgeNeural +8% +0Hz
#   tts_edge.py --list                   lists the Spanish voices
# Needs internet. It uses the read-aloud service of Microsoft Edge, which is not an official API: it may stop working someday.
import asyncio, json, os, re, sys, subprocess, unicodedata, difflib
import numpy as np, soundfile as sf
import edge_tts

def norm(w): return re.sub(r"[^a-z0-9ñ]", "", unicodedata.normalize("NFD", w.lower()).replace("̃", "~").encode("ascii", "ignore").decode().replace("n~", "ñ"))

if len(sys.argv) > 1 and sys.argv[1] == "--list":
    vs = asyncio.run(edge_tts.list_voices())
    for v in sorted((v for v in vs if v["Locale"].startswith("es-")), key=lambda v: v["ShortName"]):
        print(f'{v["ShortName"]:28} {v["Gender"]:7} {v["Locale"]}')
    sys.exit()

voice = sys.argv[1] if len(sys.argv) > 1 else "es-MX-JorgeNeural"
rate = sys.argv[2] if len(sys.argv) > 2 else "+8%"
pitch = sys.argv[3] if len(sys.argv) > 3 else "+0Hz"
lines = [re.sub(r"\*", "", L) for L in json.load(open("script.json", encoding="utf-8"))]
os.makedirs("audio", exist_ok=True)
SR = 24000

async def say(i, text):
    mp3 = f"audio/edge_{i:02d}.mp3"; bounds = []
    com = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, boundary="WordBoundary")
    with open(mp3, "wb") as f:
        async for ch in com.stream():
            if ch["type"] == "audio": f.write(ch["data"])
            elif ch["type"] == "WordBoundary": bounds.append((ch["text"], ch["offset"] / 1e7, (ch["offset"] + ch["duration"]) / 1e7))
    return mp3, bounds

def decode(mp3):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", mp3, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32)

out, words, t = [], [], 0.0
for i, line in enumerate(lines):
    mp3, bounds = asyncio.run(say(i, line))
    a = decode(mp3)
    # cut the silence the service leaves at both ends, keep the word times in step
    idx = np.where(np.abs(a) > .01)[0]; s0 = max(0, idx[0] - int(.02 * SR)); s1 = idx[-1] + int(.06 * SR)
    a = a[s0:s1]; off = s0 / SR
    # match the service's words to the script's words (numbers, punctuation and contractions may differ)
    toks = line.split(); A = [norm(w) for w in toks]; B = [norm(b[0]) for b in bounds]
    st = [None] * len(toks); en = [None] * len(toks)
    for blk in difflib.SequenceMatcher(a=A, b=B, autojunk=False).get_matching_blocks():
        for k in range(blk.size): st[blk.a + k] = bounds[blk.b + k][1] - off; en[blk.a + k] = bounds[blk.b + k][2] - off
    dur = len(a) / SR
    for k in range(len(toks)):   # words the service split or merged differently: fill between neighbours
        if st[k] is None:
            lo = next((j for j in range(k - 1, -1, -1) if en[j] is not None), None); hi = next((j for j in range(k + 1, len(toks)) if st[j] is not None), None)
            a0 = en[lo] if lo is not None else 0; a1 = st[hi] if hi is not None else dur
            gaps = [j for j in range(lo + 1 if lo is not None else 0, hi if hi is not None else len(toks))]
            n = len(gaps); p = gaps.index(k)
            st[k] = a0 + (a1 - a0) * p / n; en[k] = a0 + (a1 - a0) * (p + 1) / n
    for k, w in enumerate(toks): words.append({"line": i, "w": w, "s": round(t + max(0, st[k]), 3), "e": round(t + min(dur, en[k]), 3)})
    out.append(a)
    gap = .12 + (.15 if i == 0 or line.rstrip().endswith(("?", "!")) else 0)   # a beat after the hook and after questions
    out.append(np.zeros(int(gap * SR), dtype=np.float32)); t += dur + gap
    os.remove(mp3)
vo = np.concatenate(out)
sf.write("audio/vo_edge.wav", vo, SR)
json.dump({"voice": voice, "rate": rate, "lines": lines, "words": words}, open("audio/edge_words.json", "w", encoding="utf-8"), ensure_ascii=False, indent=0)
print(f"{voice} {rate}: {len(vo) / SR:.2f}s, {len(words)} words")
