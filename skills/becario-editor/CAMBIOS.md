# Cambios

## 1.0 (02-11-2026)
- Primera versión.
- Comprueba e instala Node.js, FFmpeg, Whisper (faster-whisper 1.2.1) y el motor de montaje: HyperFrames 0.9.5 (por defecto) o Remotion 4.0.540. Windows con `preparar.ps1` (winget o portables comprobados con sha256) y Mac/Linux con `preparar.sh` (Homebrew o portables), todo sin administrador.
- Crea la carpeta Editor IA (brutos, referencias, exportados) con `CLAUDE.md`, cuatro prompts y una copia de las herramientas.
- `editor.py`: quitar silencios, subtítulos con Whisper (.srt y tiempos por palabra), quemar subtítulos con tu estilo, analizar referencias (medidas y hoja de miniaturas), exportar a -14 LUFS y prueba corta de todo.
