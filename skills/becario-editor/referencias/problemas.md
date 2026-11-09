# Problemas y soluciones

Primero, siempre: `preparar … comprobar` (dice qué falta) y, si existe, `editor.py estado`.

## Instalación
- **Windows · «la ejecución de scripts está deshabilitada»**: usa exactamente `powershell -NoProfile -ExecutionPolicy Bypass -File "…\preparar.ps1" instalar` (solo afecta a esa orden).
- **Windows · winget no existe o falla**: el instalador pasa solo a las versiones portables (Node.js de nodejs.org, FFmpeg desde npm, Python con uv). Si también fallan, comprueba la conexión. winget viene en Windows 10 y 11 como «Instalador de aplicación» (Microsoft Store).
- **Windows · Node.js pide permiso de administrador y la persona no lo tiene**: deja que falle; el instalador usa Node.js portable en su usuario.
- **Windows · «Python» abre la Microsoft Store**: es un acceso directo falso de Windows; el instalador lo ignora y usa el de winget o uv.
- **Mac sin Homebrew**: no hace falta; se usan Node.js portable, FFmpeg desde npm y Python con uv, todo en `~/.becario-editor`.
- **Mac · «no se puede abrir porque no se puede verificar el desarrollador» (ffmpeg)**: `xattr -d com.apple.quarantine ~/.becario-editor/ffmpeg/ffmpeg ~/.becario-editor/ffmpeg/ffprobe`.
- **Mac Intel antiguo (macOS 12 o anterior)**: puede que no haya paquetes de faster-whisper para su sistema; dilo claramente y propón actualizar macOS.
- **Se corta a medias**: vuelve a lanzar la misma orden; salta lo hecho.
- **Sin internet o con un proxy de empresa**: npm, pip y las descargas fallarán. Pide que lo intente en otra red.
- **Antivirus que borra ffmpeg.exe**: que restaure el archivo y lo marque como seguro (es la compilación de gyan.dev que enlaza ffmpeg.org, o la de npm).

## Navegador del motor
- **«Chrome not found» al renderizar**: `node <hyperframes>/node_modules/hyperframes/bin/hyperframes.mjs browser ensure`. Si no se puede descargar, pon en `rutas.json` la clave `"chrome"` con la ruta de Chrome o de Edge (Windows: `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`).
- **HyperFrames · «sub_timeline_script_failure» con gsap**: la composición carga GSAP de internet; copia `gsap.min.js` de `<hyperframes>/node_modules/gsap/dist/` junto al `index.html` y enlázalo en local.

## Whisper
- **El modelo no se descarga**: se intenta Hugging Face y, si no responde, npm (comprobado con sha256). Comprueba la conexión y repite.
- **Transcribe mal nombres propios**: corrige el `.srt` a mano (o pide a Claude que lo haga) antes de quemarlo.
- **Va muy lento**: es normal en ordenadores sin mucha potencia (unos 1-2 minutos por minuto de vídeo).

## FFmpeg
- **«No such filter: 'subtitles'»**: ese FFmpeg no trae libass. En Windows, `winget install -e --id Gyan.FFmpeg`; en Mac, `brew install ffmpeg`. Luego `preparar … instalar` para actualizar `rutas.json`.
- **El corte de silencios se come palabras**: sube `--margen` (0,2) o baja `--umbral` (-45). Si deja demasiadas pausas, sube `--umbral` (-30) o baja `--minimo` (0,35).
- **Vídeo del móvil con la imagen girada**: FFmpeg respeta la rotación; si sale mal, expórtalo con `exportar --vertical`.
