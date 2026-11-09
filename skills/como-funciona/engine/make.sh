#!/usr/bin/env bash
# Build a "cómo funciona" reel end to end: voice -> word timings -> sound -> picture -> <reel>/<name>.mp4
#   make.sh <reel-folder> [edge | kokoro | path/to/voiceover.mp3|wav|m4a]
#   make.sh ~/reels/microondas                # reuse audio/vo.wav (or make the default voice the first time: Edge es-MX-JorgeNeural +8%, Kokoro if Edge fails)
#   make.sh ~/reels/microondas edge           # free Edge voice with exact word times (VOICE=es-AR-TomasNeural RATE=+10% to change it;
#                                             #   tts_edge.py --list shows all 45 Spanish voices)
#   make.sh ~/reels/microondas kokoro         # new take in the free Spanish voice (VOICE=ef_dora SPEED=1.05 to change it)
#   make.sh ~/reels/microondas ~/mi_voz.m4a   # your own recording
#   AUDIO_ONLY=1 make.sh ~/reels/microondas   # remix the sound only (reuses the last picture)
set -euo pipefail
ENGINE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export KIT="${KIT:-$HOME/claude-animation-skills/kit}"
DIR="$(cd "${1:?usage: make.sh <reel-folder> [edge|kokoro|file]}" && pwd)"
VOICE_SRC="${2:-keep}"
WORKERS="${WORKERS:-4}"
PY="$KIT/.venv/Scripts/python.exe"; [ -x "$PY" ] || PY="$KIT/.venv/bin/python"
[ -x "$PY" ] || { echo "the voice tools aren't set up: run  bash $KIT/setup.sh --voice"; exit 1; }
export NODE_PATH="$KIT/node_modules"
NAME="$(basename "$DIR")"
cd "$DIR"; mkdir -p audio
# characters live in the second skill (como-funciona-personajes, next to this one): copy them in if the reel doesn't have them
PJ="${PJ_DIR:-$ENGINE/../../como-funciona-personajes/personajes}"
if [ -d "$PJ" ] && [ ! -f web/personajes/lista.js ]; then cp -r "$PJ" web/personajes; fi

kokoro() { "$PY" "$ENGINE/tools/tts_es.py" "${VOICE:-em_alex}" "${SPEED:-1.1}"; cp audio/vo_kokoro.wav audio/vo.wav; rm -f audio/edge.txt; touch audio/kokoro.txt; }
edge() { "$PY" "$ENGINE/tools/tts_edge.py" "${VOICE:-es-MX-JorgeNeural}" "${RATE:-+8%}"; ffmpeg -v error -y -i audio/vo_edge.wav -ac 1 -ar 44100 audio/vo.wav; rm -f audio/kokoro.txt; touch audio/edge.txt; }
echo "== voice: $VOICE_SRC"
case "$VOICE_SRC" in
  keep)   [ -f audio/vo.wav ] || edge || kokoro ;;
  kokoro) kokoro ;;
  edge)   edge ;;
  *)      ffmpeg -v error -y -i "$VOICE_SRC" -ac 1 -ar 44100 audio/vo.wav; rm -f audio/kokoro.txt audio/edge.txt
          # trim silence at both ends so the hook lands on frame 1
          ffmpeg -v error -y -i audio/vo.wav -af "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse" audio/vo_trim.wav && mv audio/vo_trim.wav audio/vo.wav ;;
esac

echo "== word timings"
"$PY" "$ENGINE/tools/align_es.py" audio/vo.wav

echo "== sound"
node "$ENGINE/tools/render.js" spans
"$PY" audio.py

if [ "${AUDIO_ONLY:-0}" != "1" ] || [ ! -f silent.mp4 ]; then
  N=$(node "$ENGINE/tools/render.js" count)
  echo "== drawing $N shots with $WORKERS workers"
  rm -rf seg; mkdir -p seg
  pids=()
  for ((w = 0; w < WORKERS; w++)); do
    ids=""; for ((i = w; i < N; i += WORKERS)); do ids="${ids:+$ids,}$i"; done
    [ -n "$ids" ] && { node "$ENGINE/tools/render.js" segments "$ids" > "seg/log$w.txt" 2>&1 & pids+=($!); }
  done
  for p in "${pids[@]}"; do wait "$p"; done
  [ "$(ls seg/shot_??.mp4 | wc -l)" -eq "$N" ] || { echo "a shot failed to render, see $DIR/seg/log*.txt"; exit 1; }
  for f in seg/shot_??.mp4; do echo "file '$f'"; done > seg/list.txt
  (cd seg && sed 's#seg/##' list.txt > list2.txt && ffmpeg -v error -y -f concat -safe 0 -i list2.txt -c copy ../silent.mp4)
fi

echo "== final mux"
ffmpeg -v error -y -i silent.mp4 -i audio/mix.wav -map 0:v -map 1:a -c:v copy \
  -af "alimiter=limit=0.8:attack=2:release=60,loudnorm=I=-14:TP=-1.5:LRA=9" \
  -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart "$NAME.part.mp4"
mv "$NAME.part.mp4" "$NAME.mp4"
echo "done: $DIR/$NAME.mp4"
