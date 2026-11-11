# Fuente del vídeo (estilo opus-video-inspiracion)

- `index.html`: la animación entera en Canvas. Ábrelo en el navegador para verla; `index.html?t=12` congela el segundo 12. `window.seek(t)` dibuja cualquier fotograma.
- `words.js`: el tiempo de cada palabra de la voz (Edge, es-MX-JorgeNeural +8 %).
- `exportar.js`: `node exportar.js <carpeta> video x 4` saca los fotogramas con Playwright y los une con FFmpeg en `silent.mp4`; luego se le pone el audio.
- Letras Inter y JetBrains Mono, licencia OFL (`fonts/`).
