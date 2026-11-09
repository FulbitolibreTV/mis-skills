# mascota-pixel · guía rápida

Versión 1.4 · 28-10-2026 · regalo de @elbecariodemurphy.ia

## Qué es
Una skill para Claude que hace reels y TikToks con **tu personaje en pixel art moviendo la boca con tu voz**. Arriba sale un titular grande en cada frase; en el centro, paneles de estilo videojuego que imitan apps (terminal, carpetas, barras de carga, ondas de voz, caja de comentario); abajo, tu mascota, con una barra de XP que marca el avance.

Tú pones la idea, la imagen y la voz. Claude escribe el guion contigo, convierte tu imagen en un sprite, sincroniza la boca, monta el vídeo y te da la portada y los textos.

## Cómo se instala
1. En Claude, ve a **Configuración → Capacidades** y activa la **ejecución de código y creación de archivos**.
2. Ve a **Personalizar → Skills → + → Subir una skill** y elige `mascota-pixel.zip` (sin descomprimir).
3. Comprueba que la skill aparece activada.

Funciona en el plan gratuito de Claude. Un reel de 40 segundos lleva unos minutos de trabajo de Claude, y la primera vez que usas voz descarga el modelo de reconocimiento, unos 240 MB.

## Pruébala
Escribe en un chat nuevo:

> Usa la skill mascota-pixel y haz el reel de ejemplo del robot.

Si sale el vídeo del robot explicando el café, ya está todo funcionando. Después:

> Haz un reel con mi personaje sobre [tu tema]. Te adjunto mi imagen y mi audio.

### Tu personaje
Lo mejor es una hoja con 9 poses hecha en ChatGPT o Gemini en una sola generación: pídele a Claude «dame el prompt de la hoja de poses» y pégalo con tu foto o tu dibujo. También vale una sola imagen (pixel art, dibujo o avatar) con fondo liso.

### Tu voz
Grábate con el móvil (de una tirada y sin eco) o genera la voz con ElevenLabs con el texto que te da Claude. También puede ir sin voz.

## Si algo falla
- **«No puedo ejecutar código»:** activa la ejecución de código (paso 1 de la instalación).
- **El recorte se come parte del personaje:** pide la imagen con fondo verde liso (#00FF00).
- **La boca sale fuera de sitio:** dile a Claude «revisa la hoja de bocas y corrige la pose X».
- **El vídeo no se descarga:** pídele que lo recomprima por debajo de 28 MB.
- Lo demás está en `referencias/problemas.md`, y Claude lo consulta solo.

## Licencias
- Código de la skill: uso libre, personal y comercial.
- Fuentes Poppins, JetBrains Mono y Jersey 10: SIL Open Font License (`fuentes/`).
- Reconocimiento de voz: faster-whisper (MIT) con el modelo Whisper small de OpenAI (MIT).
- Efectos de sonido: sintetizados por la propia skill, sin derechos de terceros.
- El robot de ejemplo es propio y puedes usarlo.
- Lo que crees con la skill es tuyo. Si usas imágenes generadas con IA, respeta las condiciones de la herramienta que las genera.
