# historia-papel · guía rápida

## Qué es
Una skill para Claude que convierte una historia real en un vídeo vertical (1080×1920) de **papel recortado animado**: una escena por frase, objetos de papel que tiemblan como en stop motion, manos que entran y actúan, barridos de franjas de papel y las palabras clave en tiras. Tú le cuentas la historia; Claude escribe el guion, monta cada escena y te da el vídeo con tu voz (o sin voz), con dos finales si los quieres y su portada. No hace falta saber dibujar ni programar.

## Cómo se instala
1. En Claude, activa la ejecución de código: **Ajustes → Capacidades → Ejecución de código**.
2. **Personalizar → Skills → + → Subir una skill**, y sube el ZIP tal cual (sin descomprimir).
3. Escríbele: «Usa la skill historia-papel y monta el vídeo de ejemplo del primer bug».

Necesita un **plan de pago de Claude** (Pro, Max, Team o Enterprise): las skills no están en el plan gratuito (support.claude.com, consultado el 31-10-2026).

## Un ejemplo para probarlo
- **Rápido (sin voz):** «Usa la skill historia-papel y monta el vídeo de ejemplo del primer bug». En 3 o 4 minutos tienes dos vídeos de unos 20 s (uno por final) y la portada.
- **El tuyo:** «Usa historia-papel: quiero un vídeo de 60 s sobre la historia de [tu historia], con mi voz y la palabra HISTORIA para comentar». Claude te pregunta lo que falte, te enseña el guion, te da el texto para grabar y, cuando le pasas el audio, monta el vídeo.

Consejos:
- Graba la voz **en una sola toma**, con el texto que te da Claude: la historia y después cada final, en orden, con una pausa corta antes de cada uno.
- Pide primero la **muestra** (una hoja con una imagen por escena y 6 s de vídeo): se corrige en segundos.
- Los vídeos largos se hacen por trozos: si Claude dice «PARADO», solo hay que pedirle que siga.

## Si falla
- «Permission denied» o «no se puede escribir»: pídele a Claude que copie la skill a su carpeta de trabajo (SKILL.md, paso 0).
- «No module named skia»: pídele que ejecute `python3 scripts/comprobar.py`.
- «Palabras reconocidas» por debajo del 80 %: el texto no coincide con lo que dice tu audio; que lo corrija.
- Más casos en `referencias/problemas.md`.

## Qué usa
- Python con skia-python (licencia BSD), numpy, Pillow y ffmpeg. Los efectos de sonido y el grano del papel se generan con código: no hay archivos de terceros.
- Letra Poppins (licencia OFL, en `fuentes/`).
- Para la voz, faster-whisper con el modelo Whisper small (licencia MIT), que se descarga una vez desde npm y se comprueba con su huella sha256.
- Solo trabaja con los archivos que le pases y dentro de su carpeta de trabajo; no sube nada a ningún sitio.

---
Hecho por @elbecariodemurphy.ia
