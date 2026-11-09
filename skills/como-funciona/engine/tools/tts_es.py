# Free Spanish voiceover with Kokoro. Run from a reel folder: reads script.json, writes audio/vo_kokoro.wav and audio/lines.json.
#   tts_es.py [voice] [speed]     defaults: em_alex 1.1   (other Spanish voices: ef_dora, em_santa)
import json, sys, os, re, shutil, tempfile, numpy as np, soundfile as sf
KIT = os.environ.get("KIT") or sys.exit("set KIT to the animation kit folder (make.sh does it)")
from kokoro_onnx import Kokoro, EspeakConfig
import espeakng_loader

# espeak-ng fails on a long data path (deep install folders), so use a copy at a short path when needed
data = espeakng_loader.get_data_path()
if len(data) > 100:
    short = os.path.join(tempfile.gettempdir(), "kokoro-espeak-ng-data")
    if not os.path.exists(os.path.join(short, "phontab")):
        shutil.rmtree(short, ignore_errors=True); shutil.copytree(data, short)
    data = short
espeak = EspeakConfig(lib_path=espeakng_loader.get_library_path(), data_path=data)

voice = sys.argv[1] if len(sys.argv) > 1 else "em_alex"
speed = float(sys.argv[2]) if len(sys.argv) > 2 else 1.1
k = Kokoro(os.path.join(KIT, "models/kokoro-v1.0.onnx"), os.path.join(KIT, "models/voices-v1.0.bin"), espeak_config=espeak)
os.makedirs("audio", exist_ok=True)
lines = [re.sub(r"\*", "", L) for L in json.load(open("script.json", encoding="utf-8"))]
GAP = 0.14  # seconds of air between lines
out, t, meta = [], 0.0, []
for i, line in enumerate(lines):
    samples, sr = k.create(line, voice=voice, speed=speed, lang="es")
    a = np.abs(samples); idx = np.where(a > 0.01)[0]
    samples = samples[max(0, idx[0] - int(0.02 * sr)): idx[-1] + int(0.05 * sr)]
    meta.append({"i": i, "text": line, "start": round(t, 3), "dur": round(len(samples) / sr, 3)})
    out.append(samples)
    gap = GAP + (0.15 if i == 0 or line.rstrip().endswith(("?", "!")) else 0)   # a beat after the hook and after questions
    out.append(np.zeros(int(gap * sr), dtype=samples.dtype))
    t += len(samples) / sr + gap
vo = np.concatenate(out)
sf.write("audio/vo_kokoro.wav", vo, sr)
json.dump({"voice": voice, "speed": speed, "lines": meta}, open("audio/lines.json", "w", encoding="utf-8"), indent=1, ensure_ascii=False)
print(f"{voice} total {len(vo)/sr:.2f}s")
