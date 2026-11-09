# Cambios

## 1.4 · 29-10-2026
- **Final de TikTok «sígueme y escríbeme por privado»:** la tarjeta de perfil de `"modo": "sigueme"` ya no promete un enlace en el perfil. Pulsa «Seguir» (con un corazón), luego «Mensaje», y sale el mensaje privado con la palabra. `final.py` cambia `--enlace` por `--palabra` (por defecto, la del final original). Textos fijos nuevos: `mensaje` y `privado` (sale `enlace`). La tarjeta ya no pone una bio por defecto («Contenido nuevo cada semana»): solo sale si se da con `--bio`.
- SKILL.md explica los dos caminos para TikTok: el mismo «Comenta PALABRA» contestando a mano (por defecto) o un segundo final que pide seguir y escribir por privado, y recuerda permitir las solicitudes de mensajes.

## 1.3 · 28-10-2026
- **Dos finales sin rehacer el vídeo:** `final.py` crea la segunda versión (por ejemplo, para TikTok) cambiando solo la última frase. Si hay voz, pega la frase nueva detrás del cuerpo, en el mismo instante que la original, y conserva los tiempos. `render.js` copia de la versión original los fotogramas que no cambian y solo renderiza el final.
- **Final «sígueme»:** `"modo": "sigueme"` en la escena `cta` muestra una tarjeta de perfil que pulsa «Seguir», el enlace del perfil y un corazón.
- **Textos fijos configurables** con `"textos"` (autor del comentario, respuesta, usuario, bio, «Seguir», «Siguiendo» y el enlace), para cambiarlos o usar otro idioma.
- **Modelo de voz más seguro:** la huella sha256 del modelo va escrita en el código (antes se leía del mismo paquete que se descargaba) y, si la descarga sale mal, se borra para no usarla la próxima vez.
- **Brazos:** en los cambios de pose con un giro grande del hombro, el codo se estira a mitad del gesto para que la mano no cruce la cara.
- **`ritmo.py`:** enseña cuánto se mueve cada zona (arriba, centro, abajo) y, con `--por-zona`, exige un cambio cada 0,6 s en cada una.
- **Peinados nuevos** en la ficha: `coleta` (se balancea), `dos_coletas`, `mono` y `puntas`.
- Chromium se encuentra también con `PLAYWRIGHT_BROWSERS_PATH` y en `/opt/pw-browsers` (antes fallaba con un usuario sin permisos de administrador).
- Mensajes claros si faltan las dependencias del motor, si no se puede abrir Chromium, si se monta sin renderizar o si `ritmo.py` se lanza sin vídeo.
- Tras dos pruebas a ciegas (una sin permisos de administrador): `final.py` pide la cuenta (`--usuario`, `--bio`, `--enlace`) y avisa si falta; la frase nueva empieza en el mismo instante que la original, así que se reutilizan más fotogramas (88 % en un reel de 41 s); SKILL.md nombra los archivos de la portada y dice qué hacer si `--por-zona` falla.
- `GUIA.md` y este archivo de cambios.

## 1.2 · 27-10-2026
- Descripción de `SKILL.md` acortada de 288 a 182 caracteres, para que la app la acepte (máximo de 200).

## 1.1 · 26-10-2026
- Tras una prueba a ciegas: comprobación de Chromium, muestras en una carpeta aparte con `--rehacer` por tramos, sombrero y peto, bloques libres (`cubos`), módulo propio en la carpeta del proyecto y subtítulos opcionales en los pasos.

## 1.0 · 26-10-2026
- Primera versión: mascota de cubos por ficha, bloques o skin de 64×64; hoja de personaje con 8 poses y 7 caras; paisaje de bloques propio; pasos con tarjetas; voz alineada con Whisper; efectos sintetizados; montaje a −14 LUFS; portada y control de ritmo.
