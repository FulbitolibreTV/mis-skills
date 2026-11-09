#!/usr/bin/env bash
# becario-editor v1.0 · comprueba e instala las herramientas del editor en Mac (y Linux).
# Uso:  bash preparar.sh comprobar
#       bash preparar.sh instalar [--motor hyperframes|remotion] [--sin-skills]
# Todo se instala en ~/.becario-editor (sin permisos de administrador), salvo lo que haga Homebrew si ya lo tienes.
# Las descargas se comprueban: Node con su SHASUMS256 oficial, uv con su .sha256, y npm/pip con sus propias huellas.

set -u
ORDEN="${1:-comprobar}"; shift || true
MOTOR=""; SKILLS=1
while [ $# -gt 0 ]; do
  case "$1" in
    --motor) MOTOR="${2:-}"; shift 2 ;;
    --sin-skills) SKILLS=0; shift ;;
    *) echo "Opción desconocida: $1"; exit 2 ;;
  esac
done

BASE="${BECARIO_EDITOR_HOME:-$HOME/.becario-editor}"
AQUI="$(cd "$(dirname "$0")" && pwd)"
SKILL="$(cd "$AQUI/.." && pwd)"
HF_VERSION="0.9.5"; GSAP_VERSION="3.15.0"; FW_VERSION="1.2.1"
export HYPERFRAMES_NO_TELEMETRY=1 npm_config_cache="$BASE/npm-cache" npm_config_update_notifier=false npm_config_fund=false npm_config_audit=false
mkdir -p "$BASE"
SO="$(uname -s)"; ARQ="$(uname -m)"
case "$SO" in Darwin) SO_N="darwin" ;; Linux) SO_N="linux" ;; *) echo "FALLO sistema no compatible: $SO (usa preparar.ps1 en Windows)"; exit 1 ;; esac
case "$ARQ" in arm64|aarch64) ARQ_N="arm64"; UV_ARQ="aarch64" ;; x86_64|amd64) ARQ_N="x64"; UV_ARQ="x86_64" ;; *) echo "FALLO procesador no compatible: $ARQ"; exit 1 ;; esac
BREW=""; for b in /opt/homebrew/bin/brew /usr/local/bin/brew; do [ -x "$b" ] && BREW="$b" && break; done
[ -z "$BREW" ] && command -v brew >/dev/null 2>&1 && BREW="$(command -v brew)"

sha256() { if command -v sha256sum >/dev/null 2>&1; then sha256sum "$1" | cut -d' ' -f1; else shasum -a 256 "$1" | cut -d' ' -f1; fi; }
bajar() { curl -fsSL --retry 2 -o "$2" "$1"; }
version_mayor() { "$1" -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0; }

# ------------------------------------------------------------ buscar lo que ya hay
buscar_node() {
  NODE=""
  for n in "$BASE/node/bin/node" "$(command -v node 2>/dev/null)" /opt/homebrew/bin/node /usr/local/bin/node; do
    [ -n "$n" ] && [ -x "$n" ] && [ "$(version_mayor "$n")" -ge 22 ] 2>/dev/null && NODE="$n" && break
  done
  NPM=""; [ -n "$NODE" ] && [ -x "$(dirname "$NODE")/npm" ] && NPM="$(dirname "$NODE")/npm"
  [ -n "$NODE" ] && [ -z "$NPM" ] && NPM="$(command -v npm 2>/dev/null)"
}
buscar_ffmpeg() {
  FFMPEG=""; FFPROBE=""
  for d in "$BASE/ffmpeg" "$(dirname "$(command -v ffmpeg 2>/dev/null || echo /x/x)")" /opt/homebrew/bin /usr/local/bin /usr/bin; do
    if [ -x "$d/ffmpeg" ] && [ -x "$d/ffprobe" ] && "$d/ffmpeg" -version >/dev/null 2>&1; then FFMPEG="$d/ffmpeg"; FFPROBE="$d/ffprobe"; break; fi
  done
}
python_valido() { "$1" -c 'import sys; sys.exit(0 if (3,10) <= sys.version_info[:2] <= (3,13) else 1)' >/dev/null 2>&1; }
buscar_python() {
  PYSIS=""
  for p in python3.12 python3.11 python3.13 python3.10 python3 /opt/homebrew/bin/python3.12 /usr/local/bin/python3.12; do
    c="$(command -v "$p" 2>/dev/null)"; [ -n "$c" ] || continue
    # en Mac, /usr/bin/python3 sin las herramientas de Xcode abre una ventana de instalación: se salta
    [ "$SO_N" = "darwin" ] && [ "$c" = "/usr/bin/python3" ] && ! xcode-select -p >/dev/null 2>&1 && continue
    python_valido "$c" && PYSIS="$c" && break
  done
}
venv_ok() { [ -x "$BASE/venv/bin/python" ] && "$BASE/venv/bin/python" -c 'import faster_whisper' >/dev/null 2>&1; }
buscar_chrome() {
  CHROME=""
  for c in "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" "/Applications/Chromium.app/Contents/MacOS/Chromium" \
           "$(command -v google-chrome 2>/dev/null)" "$(command -v chromium 2>/dev/null)" "$(command -v chromium-browser 2>/dev/null)"; do
    [ -n "$c" ] && [ -x "$c" ] && CHROME="$c" && break
  done
}
motor_actual() {
  if [ -n "$MOTOR" ]; then echo "$MOTOR"; return; fi
  if [ -f "$BASE/rutas.json" ] && grep -q '"motor": *"remotion"' "$BASE/rutas.json"; then echo remotion; else echo hyperframes; fi
}
motor_ok() {
  if [ "$(motor_actual)" = "remotion" ]; then [ -f "$BASE/remotion/node_modules/@remotion/cli/remotion-cli.js" ]
  else [ -f "$BASE/hyperframes/node_modules/hyperframes/bin/hyperframes.mjs" ] && [ -f "$BASE/hyperframes/node_modules/gsap/dist/gsap.min.js" ]; fi
}

informe() {
  buscar_node; buscar_ffmpeg; buscar_python
  echo "Sistema: $SO $ARQ · Homebrew: ${BREW:-no} · carpeta de herramientas: $BASE"
  if [ -n "$NODE" ]; then echo "OK    Node.js $("$NODE" -v) ($NODE)"; else echo "FALTA Node.js 22 o posterior"; fi
  if [ -n "$FFMPEG" ]; then echo "OK    FFmpeg ($FFMPEG)"; else echo "FALTA FFmpeg y FFprobe"; fi
  if venv_ok; then echo "OK    Whisper (faster-whisper en $BASE/venv)"
  elif [ -n "$PYSIS" ]; then echo "FALTA Whisper (faster-whisper; se instala con $PYSIS)"
  else echo "FALTA Whisper (faster-whisper) y Python 3.10-3.13"; fi
  if motor_ok; then echo "OK    $(motor_actual) ($BASE/$(motor_actual))"; else echo "FALTA $(motor_actual) (motor de montaje)"; fi
  [ -d "$BASE/modelos/whisper-small" ] && [ -f "$BASE/modelos/whisper-small/model.bin" ] && echo "OK    modelo de voz Whisper small" || echo "AVISO el modelo de voz (unos 240 MB) se descarga en la prueba"
}

# ------------------------------------------------------------ instalar
instalar_node() {
  buscar_node; [ -n "$NODE" ] && return 0
  if [ -n "$BREW" ]; then echo "· Instalando Node.js con Homebrew…"; "$BREW" install node >/dev/null 2>&1; buscar_node; [ -n "$NODE" ] && return 0; fi
  echo "· Descargando Node.js 22 (nodejs.org, comprobado con SHASUMS256)…"
  local tmp; tmp="$(mktemp -d)"
  bajar "https://nodejs.org/dist/latest-v22.x/SHASUMS256.txt" "$tmp/SHASUMS256.txt" || { echo "FALLO no se pudo descargar la lista de Node.js"; return 1; }
  local linea fich suma
  linea="$(grep -E "node-v22\.[0-9.]+-$SO_N-$ARQ_N\.tar\.gz$" "$tmp/SHASUMS256.txt" | head -1)"
  suma="${linea%% *}"; fich="${linea##* }"
  [ -z "$fich" ] && { echo "FALLO no hay Node.js 22 para $SO_N-$ARQ_N"; return 1; }
  bajar "https://nodejs.org/dist/latest-v22.x/$fich" "$tmp/$fich" || { echo "FALLO no se pudo descargar $fich"; return 1; }
  [ "$(sha256 "$tmp/$fich")" = "$suma" ] || { echo "FALLO la descarga de Node.js no coincide con su sha256; descartada"; rm -rf "$tmp"; return 1; }
  rm -rf "$BASE/node"; mkdir -p "$BASE/node"
  tar -xzf "$tmp/$fich" -C "$BASE/node" --strip-components=1 && rm -rf "$tmp"
  buscar_node; [ -n "$NODE" ]
}

instalar_ffmpeg() {
  buscar_ffmpeg; [ -n "$FFMPEG" ] && return 0
  if [ -n "$BREW" ]; then echo "· Instalando FFmpeg con Homebrew (tarda unos minutos)…"; "$BREW" install ffmpeg >/dev/null 2>&1; buscar_ffmpeg; [ -n "$FFMPEG" ] && return 0; fi
  echo "· Instalando FFmpeg y FFprobe desde npm (versión ligera, sin administrador)…"
  mkdir -p "$BASE/ffmpeg-npm" "$BASE/ffmpeg"
  PATH="$(dirname "$NODE"):$PATH" "$NPM" install -q --prefix "$BASE/ffmpeg-npm" @ffmpeg-installer/ffmpeg @ffprobe-installer/ffprobe >/dev/null 2>&1 \
    || { echo "FALLO npm no pudo instalar FFmpeg"; return 1; }
  local f p
  f="$(cd "$BASE/ffmpeg-npm" && "$NODE" -p "require('@ffmpeg-installer/ffmpeg').path" 2>/dev/null)"
  p="$(cd "$BASE/ffmpeg-npm" && "$NODE" -p "require('@ffprobe-installer/ffprobe').path" 2>/dev/null)"
  [ -f "$f" ] && [ -f "$p" ] || { echo "FALLO no encuentro los binarios de FFmpeg de npm"; return 1; }
  cp "$f" "$BASE/ffmpeg/ffmpeg"; cp "$p" "$BASE/ffmpeg/ffprobe"; chmod u+x "$BASE/ffmpeg/ffmpeg" "$BASE/ffmpeg/ffprobe"
  [ "$SO_N" = "darwin" ] && xattr -d com.apple.quarantine "$BASE/ffmpeg/ffmpeg" "$BASE/ffmpeg/ffprobe" 2>/dev/null
  rm -rf "$BASE/ffmpeg-npm"
  buscar_ffmpeg; [ -n "$FFMPEG" ]
}

conseguir_uv() {
  UV="$(command -v uv 2>/dev/null)"; [ -x "$BASE/uv/uv" ] && UV="$BASE/uv/uv"
  [ -n "$UV" ] && return 0
  local destino="uv-$UV_ARQ-apple-darwin"; [ "$SO_N" = "linux" ] && destino="uv-$UV_ARQ-unknown-linux-gnu"
  echo "· Descargando uv (gestor de Python de Astral, comprobado con su sha256)…"
  local tmp; tmp="$(mktemp -d)"
  bajar "https://github.com/astral-sh/uv/releases/latest/download/$destino.tar.gz" "$tmp/uv.tar.gz" \
    && bajar "https://github.com/astral-sh/uv/releases/latest/download/$destino.tar.gz.sha256" "$tmp/uv.sha256" \
    || { echo "FALLO no se pudo descargar uv"; return 1; }
  [ "$(sha256 "$tmp/uv.tar.gz")" = "$(cut -d' ' -f1 "$tmp/uv.sha256")" ] || { echo "FALLO uv no coincide con su sha256; descartado"; return 1; }
  mkdir -p "$BASE/uv"; tar -xzf "$tmp/uv.tar.gz" -C "$BASE/uv" --strip-components=1 && rm -rf "$tmp"
  UV="$BASE/uv/uv"; [ -x "$UV" ]
}

instalar_whisper() {
  venv_ok && return 0
  buscar_python
  if [ -z "$PYSIS" ] && [ -n "$BREW" ]; then echo "· Instalando Python 3.12 con Homebrew…"; "$BREW" install python@3.12 >/dev/null 2>&1; buscar_python; fi
  echo "· Instalando Whisper (faster-whisper $FW_VERSION) en $BASE/venv…"
  rm -rf "$BASE/venv"
  if [ -n "$PYSIS" ] && "$PYSIS" -m venv "$BASE/venv" >/dev/null 2>&1 \
     && "$BASE/venv/bin/python" -m pip install -q --disable-pip-version-check "faster-whisper==$FW_VERSION" >/dev/null 2>&1; then
    venv_ok && return 0
  fi
  echo "· Python del sistema no sirve; uso uv con un Python 3.12 propio…"
  rm -rf "$BASE/venv"
  conseguir_uv || return 1
  export UV_PYTHON_INSTALL_DIR="$BASE/uv/python" UV_CACHE_DIR="$BASE/uv/cache"
  "$UV" venv -q --python 3.12 "$BASE/venv" >/dev/null 2>&1 \
    && "$UV" pip install -q --python "$BASE/venv/bin/python" "faster-whisper==$FW_VERSION" >/dev/null 2>&1
  rm -rf "$BASE/uv/cache"
  venv_ok || { echo "FALLO no se pudo instalar faster-whisper"; return 1; }
}

instalar_motor() {
  local m; m="$(motor_actual)"
  export PATH="$(dirname "$NODE"):$PATH"
  CHROME_FIJO=""
  if [ "$m" = "remotion" ]; then
    if ! motor_ok; then
      echo "· Instalando Remotion 4.0.540…"
      mkdir -p "$BASE/remotion"; cp "$SKILL/plantilla/remotion-prueba/package.json" "$BASE/remotion/package.json"; chmod u+w "$BASE/remotion/package.json"
      (cd "$BASE/remotion" && "$NPM" install -q >/dev/null 2>&1) || { echo "FALLO npm no pudo instalar Remotion"; return 1; }
    fi
    (cd "$BASE/remotion" && "$NODE" node_modules/@remotion/cli/remotion-cli.js browser ensure >/dev/null 2>&1) \
      || { buscar_chrome; [ -n "$CHROME" ] && CHROME_FIJO="$CHROME" || echo "AVISO Remotion no pudo bajar su navegador; se reintentará al montar"; }
  else
    if ! motor_ok; then
      echo "· Instalando HyperFrames $HF_VERSION…"
      mkdir -p "$BASE/hyperframes"
      "$NPM" install -q --prefix "$BASE/hyperframes" "hyperframes@$HF_VERSION" "gsap@$GSAP_VERSION" >/dev/null 2>&1 \
        || { echo "FALLO npm no pudo instalar HyperFrames"; return 1; }
    fi
    local hf="$BASE/hyperframes/node_modules/hyperframes/bin/hyperframes.mjs"
    "$NODE" "$hf" browser ensure >/dev/null 2>&1 \
      || { buscar_chrome; [ -n "$CHROME" ] && CHROME_FIJO="$CHROME" || echo "AVISO HyperFrames no pudo bajar su navegador; se reintentará al montar"; }
    if [ "$SKILLS" = "1" ]; then
      echo "· Instalando las skills de HyperFrames para Claude Code (en ~/.claude/skills)…"
      (cd "$BASE" && "$NODE" "$hf" skills update </dev/null >/dev/null 2>&1) || echo "AVISO no se pudieron instalar las skills de HyperFrames (el editor funciona igual)"
    fi
  fi
  motor_ok
}

escribir_rutas() {
  "$BASE/venv/bin/python" - "$BASE" "$(motor_actual)" "$NODE" "$NPM" "$FFMPEG" "$FFPROBE" "${CHROME_FIJO:-}" <<'PY'
import json, sys, os
base, motor, node, npm, ff, fp, chrome = sys.argv[1:8]
ruta = os.path.join(base, "rutas.json")
try:
    datos = json.load(open(ruta, encoding="utf-8"))
except Exception:
    datos = {}
datos.update({"motor": motor, "node": node, "npm": npm, "ffmpeg": ff, "ffprobe": fp,
              "python": os.path.join(base, "venv", "bin", "python"), motor: os.path.join(base, motor)})
if chrome:
    datos["chrome"] = chrome
json.dump(datos, open(ruta, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
PY
}

case "$ORDEN" in
  comprobar) informe ;;
  instalar)
    instalar_node   || { echo "FALLO Node.js"; exit 1; }
    instalar_ffmpeg || { echo "FALLO FFmpeg"; exit 1; }
    instalar_whisper || { echo "FALLO Whisper"; exit 1; }
    instalar_motor  || { echo "FALLO motor $(motor_actual)"; exit 1; }
    escribir_rutas  || { echo "FALLO al guardar rutas.json"; exit 1; }
    rm -rf "$BASE/npm-cache"
    echo; informe; echo
    echo "LISTO. Python del editor: $BASE/venv/bin/python"
    echo "Siguiente: \"$BASE/venv/bin/python\" \"$AQUI/editor.py\" carpeta <RUTA>   y luego   … editor.py prueba" ;;
  *) echo "Uso: bash preparar.sh comprobar | instalar [--motor hyperframes|remotion] [--sin-skills]"; exit 2 ;;
esac
