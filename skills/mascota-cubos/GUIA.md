# mascota-cubos · guía rápida

Versión 1.4 · 29-10-2026 · regalo de @elbecariodemurphy.ia

## Qué es
Una skill para Claude que hace reels verticales (1080×1920) protagonizados por una mascota 3D de cubos: paisaje de bloques, pasos numerados con tarjetas, subtítulos palabra a palabra, tu voz alineada, efectos de sonido, portada y, si quieres, dos finales («Comenta PALABRA» en Instagram y «sígueme y escríbeme por privado» en TikTok). Todo con código: no gasta créditos de imágenes ni de vídeo.

## Cómo se instala
1. En Claude, ve a **Configuración → Capacidades** y activa la **ejecución de código y creación de archivos**.
2. Ve a **Personalizar → Skills → + → Subir una skill** y elige `mascota-cubos-v1.4.zip` (sin descomprimir).
3. Comprueba que la skill aparece activada.

Funciona en todos los planes que permiten skills. Necesita que el entorno de Claude tenga Chromium y ffmpeg (la skill lo comprueba al empezar).

## Pruébala
Escribe en un chat nuevo:
> Hazme un reel corto sin voz con mascota de cubos: 3 trucos para concentrarte al estudiar. La mascota, un chico con sudadera azul y gafas.

Claude te enseñará primero la hoja del personaje y después unos fotogramas de muestra antes del vídeo completo. Un reel de 40 s tarda unos 15–20 minutos en renderizarse.

## Si algo falla
- **«No encuentro Chromium»:** pídele a Claude que ejecute `npx playwright install chromium`. Si no hay red para descargarlo, ese entorno no puede renderizar.
- **Tarda mucho:** es normal; el render va por tandas y se puede relanzar sin perder lo hecho.
- **La voz no coincide con los subtítulos:** el texto del plan tiene que ser exactamente lo que dice el audio.
- **Algo raro en el vídeo:** dile a Claude qué segundo es; puede rehacer solo ese tramo con `--rehacer`.

## Licencias
Three.js (MIT), Playwright (Apache 2.0), Whisper y faster-whisper (MIT) y las fuentes Poppins, Silkscreen y JetBrains Mono (OFL) permiten uso comercial. Los efectos de sonido se sintetizan con ffmpeg y el paisaje de bloques es propio.
