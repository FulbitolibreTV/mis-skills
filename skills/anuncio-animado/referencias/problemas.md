# Problemas frecuentes

| Qué pasa | Qué hacer |
| --- | --- |
| `Read-only file system` o `Permission denied` al escribir | Trabajas dentro de la carpeta de la skill. Cópiala como dice SKILL.md, con `chmod -R u+w` |
| `npm install ha fallado` (403, sin red) | El entorno no deja descargar de npm. Comprueba que la ejecución de código tiene acceso a internet y vuelve a lanzar `node motor/comprobar.js` |
| `No encuentro Chromium` | `comprobar.js` intenta instalar `@sparticuz/chromium@131` por npm (unos 60 MB). Si no puede, desde `motor/`: `npm install @sparticuz/chromium@131 --no-audit --no-fund --cache ~/.cache/anuncio-animado/npm`, o `npx playwright install chromium` |
| `Faltan las letras X` | Las letras van por npm: desde `motor/`, `npm install @fontsource/<nombre-en-minúsculas-con-guiones>` (por ejemplo `@fontsource/dm-sans`). Mientras tanto se usa Poppins |
| `El plan tiene un error` | El JSON está mal escrito (una coma de más o de menos, comillas rectas `"`). Valídalo con `python3 -m json.tool P/anuncio.json` |
| `tipo «x» desconocido` | Solo valen los tipos de `referencias/escenas.md`; se dibuja como `texto` |
| `No se pudo abrir el logo` | La ruta de `marca.logo` es relativa a la carpeta del plan y tiene que ser PNG, JPG, SVG o WEBP |
| Un texto no cabe o se sale | Acórtalo o baja `tam` en esa escena. El motor encoge los textos largos, pero a partir de unas 5 palabras por línea se leen mal |
| El render se corta a medias | Repite el mismo comando: sigue donde iba (los fotogramas hechos se guardan en `P/fotogramas/` y se borran al acabar) |
| `referencia.py` saca pocos planos | Baja el umbral: `--umbral 0.2`. Si saca demasiados: `--umbral 0.45`. Mira siempre `hoja.jpg` |
| El usuario no puede subir el vídeo de referencia | Que mande 4–8 capturas o que lo describa plano a plano |
| El MP4 no se ve en el móvil | Ya sale en H.264 y yuv420p. Si pesa demasiado, `--crf 23` |
| El render del estilo limpio va lento | Para probar, pon `"desenfoque": 1` en el plan (8 veces más rápido, sin desenfoque de movimiento) y vuelve a 8 para el vídeo final |
