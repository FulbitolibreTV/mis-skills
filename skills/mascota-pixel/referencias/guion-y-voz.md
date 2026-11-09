# Guion y voz

## Guion (`guion.txt`)
- **Una frase por línea**, tal y como debe verse escrita. Las etiquetas entre corchetes (`[excited]`) se ignoran.
- Entre 8 y 15 frases, de 30 a 50 segundos. Unas 190–200 palabras por minuto.

**Estructura que funciona en este formato:**
1. **Gancho, en los primeros 2 segundos:** un número concreto o una promesa visible. Ejemplo: «Este robot te enseña a hacer café de filtro en cuatro pasos».
2. **Una idea o un paso por frase**, con frases cortas.
3. **Objeción y respuesta:** «¿Que no tienes tiempo? Ahora sí».
4. **Prueba:** «Como este vídeo que estás viendo».
5. **Llamada a la acción:** «Comenta PALABRA y te lo mando» o «Sígueme para más».

**Reglas:**
- Escribe los números como se dicen si la voz es sintética («quince gramos»): la voz los lee mejor y el titular puede llevar la cifra («15 g»).
- Nada de datos inventados. Si hace falta una cifra o un precio, pídesela al usuario o di que hay que comprobarla.

## Voz
- **Grabada con el móvil:** en un sitio sin eco, a un palmo del micro y de una tirada. Cualquier formato vale (m4a, mp3, wav, ogg).
- **ElevenLabs u otra voz de IA:** dale al usuario el texto entero del guion en un solo bloque, con etiquetas de emoción en inglés al principio de algunas frases (`[excited]`, `[confident]`, `[curious]`, `[playfully]`). Si la voz pronuncia mal un nombre, escríbelo como suena en el texto para la voz («Clod» por Claude) y deja `guion.txt` bien escrito: el alineado tolera esas diferencias.
- **Sin voz:** `--sin-voz` calcula los tiempos a `--ppm` (185 por defecto). El vídeo sale con efectos y sin voz; la boca se mueve igual.

## alinear.py
- `--pausa-max 0.26`: las pausas más largas se recortan a 0,26 s para que el reel no se haga lento.
- `--velocidad 1.05`: acelera un 5 % sin cambiar el tono. Úsalo si avisa de que va lenta.
- `--idioma es` (o `en`, `pt`…): el idioma de la voz.
- El reconocimiento usa faster-whisper con el modelo small: primero lo intenta desde Hugging Face y, si está bloqueado, desde npm, comprobando el sha256. Si no hay ninguno, reparte las palabras por los tramos con voz; es menos preciso, pero funciona.
- Deja `voz/palabras.json`, con `palabras` (`t` texto, `ini` y `fin` en segundos, `frase` desde 0) y `frases` (`texto`, `ini` y `fin`).
- Si avisa de que la voz va rápida (más de 215 por minuto), no pasa nada: pon titulares más cortos y tarjetas sencillas.
