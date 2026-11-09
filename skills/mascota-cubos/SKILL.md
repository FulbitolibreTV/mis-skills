---
name: mascota-cubos
description: Crea reels verticales con una mascota 3D de cubos (desde una descripción, foto o skin). Úsala si piden un reel o vídeo corto con mascota de cubos o de bloques, o sin enseñar la cara.
---

# mascota-cubos

Convierte una idea en un reel vertical con una mascota de cubos en 3D: paisaje de bloques, pasos numerados con tarjetas, subtítulos palabra a palabra, voz alineada, efectos de sonido y llamada a comentar. Todo se hace con código (Three.js, Chromium sin pantalla y ffmpeg): no gasta créditos de imágenes ni de vídeo.

Habla con la persona en su idioma, de tú y sin tecnicismos. Enséñale resultados (hoja de personaje, fotogramas de muestra, vídeo) en cuanto los tengas.

## 0. Preparar el motor (una vez por conversación)

```bash
cp -r <carpeta de esta skill>/motor ./motor && chmod -R u+w ./motor
cd motor && npm install --no-audit --no-fund
node comun.js || npx playwright install chromium     # comprueba que hay navegador
```

- La carpeta de la skill puede ser de solo lectura: trabaja siempre en la copia.
- Si no hay Chromium y `npx playwright install chromium` falla por la red, díselo a la persona: sin navegador no se puede renderizar.
- Cada proyecto es una carpeta **dentro de `motor/`** (por ejemplo `motor/mi_reel/`) con su `reel.json` y sus archivos (voz, skin, imágenes, módulo de mascota). En los comandos de abajo, cambia `proyecto/` por tu carpeta.

## 1. Pregunta lo justo

Antes de construir, asegúrate de tener (pregunta en un solo mensaje lo que falte):

1. **Nicho** y **de qué va el reel** (o el guion, si lo trae escrito).
2. **La mascota**: descripción, foto o dibujo, o una skin PNG de 64×64.
3. **Voz**: ¿la va a generar en ElevenLabs (u otra), la graba, o el reel va sin voz?
4. **Colores de marca** (opcional): un color de acento y uno de texto.

Si la persona no está o dice «tú decides», elige lo razonable y dilo.

## 2. Construye la mascota

Hay tres formas (en `reel.json` → `personaje`):

| Forma | Cuándo | Cómo |
|---|---|---|
| `{"ficha": {...}}` | Casi siempre | Rellena una ficha (ver `referencias/fichas.md`). Con una foto, mírala y elige colores, pelo, ropa y accesorios. |
| `{"skin": "mi_skin.png"}` | Trae una skin de 64×64 | Copia el PNG a la carpeta del proyecto. Sin caras extra: usa la de la skin. |
| `{"modulo": "mia.js", "funcion": "crear", "ficha": {...}}` | Algo que la ficha no cubre del todo | Un módulo en la carpeta del proyecto. Lo normal es usar `crearMascota(THREE, P.ficha)` y añadir cubos a `pj.partes` (ver «Módulo propio» en `referencias/fichas.md`). |

Ejemplos listos en `ejemplos/fichas.json` (chef, gata, astronauta, gamer). Antes de escribir un módulo, prueba con `accesorios`, `cubos` (bloques 3D libres) y `retoques` (píxeles): casi todo cabe ahí.

Después, saca la hoja de personaje y enséñasela antes de seguir:

```bash
cd motor && node hoja.js proyecto/reel.json   # → proyecto/hoja.png (vistas, 8 poses, 7 caras)
```

Mírala tú primero (Read sobre el PNG). Comprueba que se lee bien a tamaño móvil, que no hay píxeles sueltos que parezcan manchas y que los colores coinciden con lo pedido. Ajusta con `retoques` y repite.

**Estilo:** proporciones de skin clásica (cabeza 8×8, cuerpo 8×12, brazos y piernas 4×12), ojos de una fila, sombreado por filas (luz arriba, sombra abajo), sin puntos sueltos.

**Marcas:** el estilo de bloques es libre, pero no pongas nombres, logos ni personajes de ningún videojuego (ni en el vídeo ni en el texto). El paisaje del motor es propio.

## 3. Guion y texto para la voz

Estructura que funciona (35–45 s, unas 120–140 palabras, ~200 palabras por minuto). Para un reel corto (15–25 s), quita la prueba y la cortinilla: gancho, 2 o 3 pasos (uno por frase, con `total` igual al número de pasos) y el «Comenta…». Cada elemento de una lista va en su propio paso, para que tenga tarjeta y la barra de progreso se complete.

1. **Gancho (0–3 s):** frase corta con una promesa o un dato raro. Algo se mueve antes de 1,5 s.
2. **Prueba:** «este vídeo lo hice así».
3. **Cortinilla:** «Te enseño cómo».
4. **Pasos numerados (3–6):** una frase por paso; cada paso con su tarjeta.
5. **Remate** y **«Comenta PALABRA y te mando…»**.

Escribe además el texto para ElevenLabs con etiquetas de emoción en inglés entre corchetes: `[excited]`, `[confident]`, `[curious]`, `[mischievously]`, `[playfully]`, `[impressed]`. Sin risas ni suspiros (alargan pausas). Cambia la escritura de las palabras extranjeras que lea mal (por ejemplo «Clod» por Claude o «ril» por reel). En `reel.json` el texto va bien escrito: los subtítulos salen de ahí. Modelo recomendado: Eleven v3 o posterior, en MP3 o WAV.

## 4. Escribe `reel.json`

Una entrada en `frases` por cada frase del guion, en orden. Cada frase lleva:

- `texto`: la frase exacta de la voz.
- `claves`: 1 o 2 palabras que salen en caja de color.
- `poses`: la primera entra al empezar la frase y las demás en las palabras clave.
- `escena`: abre una escena nueva. Sin `escena`, la frase sigue en la anterior.

Los tipos de escena y de tarjeta están en `referencias/escenas.md`, y hay una plantilla completa en `ejemplos/reel_ejemplo.json`.

Reglas de ritmo:
- Una escena por frase.
- Ninguna escena de más de ~4 s sin algo que entre o cambie.
- Varía la cámara del paisaje (`medio`, `cerca`, `lejos`, `bajo`).
- Títulos de paso de 2 líneas, con 1–3 palabras por línea.

## 5. Voz → tiempos

```bash
cd motor && python3 alinear.py proyecto/reel.json /ruta/voz.mp3            # añade --acelerar 1.05 si va lenta
```

Qué hace:
- Recorta las pausas largas (máximo 0,26 s) y normaliza a −14 LUFS → `proyecto/voz.wav`.
- Reconoce la voz y empareja cada palabra con el guion → `proyecto/tiempos.json`.

Mira el porcentaje de palabras emparejadas: por debajo del 90 %, revisa que `texto` coincida con lo que se oye. Si no hay reconocimiento disponible, avisa y reparte por los tramos con voz.

Sin voz: no ejecutes nada. El motor estima los tiempos: unas 2,5 palabras por segundo, más 0,25 s entre frases y 0,9 s de cola. Para que vaya más rápido o más lento, pon `"velocidadSinVoz": 1.2` (o 0.8) en el plan. En los reels sin voz, pon `"subtitulosEnPasos": true` para que las frases de los pasos se lean.

Si cambias un `texto` después de alinear, vuelve a alinear.

## 6. Renderiza y monta

```bash
cd motor
node render.js proyecto/reel.json --muestras               # un fotograma por escena en proyecto/muestras/ (míralos)
node render.js proyecto/reel.json --limite 500              # repite hasta que diga «¡completo!»
node render.js proyecto/reel.json --rehacer 4.2-7.3         # tras cambiar una escena: rehace solo ese tramo (segundos)
node montar.js proyecto/reel.json                           # → proyecto/reel.mp4 (voz + efectos, −14 LUFS)
```

- El render tarda ~1,2 s por fotograma de paisaje y ~0,3 s por fotograma de paso (un reel de 40 s, unos 15–20 min). Con 2 núcleos, un solo proceso va más rápido que dos (`--procesos` solo si hay 4 núcleos o más). Va por tandas (`--limite` en segundos) para no pasarse del tiempo máximo de cada comando; se puede relanzar sin perder lo hecho.
- Si cambias una escena, rehaz solo su tramo con `--rehacer` (los tiempos de cada escena salen al hacer `--muestras` y están en `proyecto/info.json`). Si cambias tiempos, voz o algo que afecta a todo, borra `proyecto/fotogramas` y renderiza de nuevo.
- `montar.js` recomprime si pasa de 28 MB, porque la app no deja descargar más de 30 MB.
- Revisa el vídeo antes de entregarlo:
  - Saca un fotograma por escena con ffmpeg y míralos.
  - Comprueba que ningún texto tapa la cara de la mascota.
  - Comprueba que los subtítulos caen dentro de y = 200–1540, para que no los tapen los botones de TikTok.
  - Ejecuta `python3 ritmo.py proyecto/reel.mp4`: ningún tramo de más de 0,6 s sin movimiento. Si salta, mete algo que entre en ese segundo y rehaz el tramo:
    - Otra pose: añade una palabra clave a la frase.
    - Una `burbuja` en esa palabra.
    - Adelanta el momento de la tarjeta (`vistaEn`, `elegirEn`, `tacharEn`).
    - Parte la frase en dos escenas.
  - `--por-zona` es más exigente: pide un cambio cada 0,6 s arriba, en el centro y abajo por separado (para cuentas que quieren mucho ritmo). Si falla una zona, el remedio es el mismo: mete algo que entre o cambie en esa zona en ese segundo (un elemento de la tarjeta con su momento, una burbuja o una pose).

### Dos finales (por ejemplo, Instagram y TikTok)
En TikTok no hay respuesta automática a los comentarios (y desde la UE su API de mensajes no está disponible). Hay dos caminos y los dos valen; si la persona no dice nada, el primero:
- **Un solo final, «Comenta PALABRA», en las dos apps:** en TikTok contesta a mano. Un solo vídeo.
- **Dos finales:** en Instagram «Comenta PALABRA» y en TikTok «sígueme y escríbeme PALABRA por privado». Nunca prometas un enlace en el perfil ni nombres la otra app. Recuérdale que en TikTok tiene que permitir las solicitudes de mensajes (Ajustes → Privacidad → Mensajes directos) para recibir los de quien no le sigue.

Con dos finales, las dos versiones solo cambian en la última frase y el cuerpo no se vuelve a renderizar:
1. Haz y renderiza entero el reel con el primer final (por ejemplo, «Comenta PALABRA…»).
2. Pregunta a la persona su cuenta (sale en la tarjeta de perfil) y, si hay voz, pídele un audio aparte que diga solo la frase nueva (mismos ajustes de voz).
3. Crea la segunda versión:
   ```bash
   python3 final.py proyecto/reel.json --texto "Sígueme y escríbeme CUBOS por privado y te lo mando." --usuario @su_cuenta --palabra CUBOS --voz final.mp3 --claves "Sígueme,CUBOS"
   node render.js proyecto_tiktok/reel.json --limite 500   # copia los fotogramas iguales y solo hace el final
   node montar.js proyecto_tiktok/reel.json
   ```
   `final.py` pega la frase nueva detrás del cuerpo de la voz (empieza en el mismo instante que la original y conserva los tiempos) y cambia la escena final por una tarjeta de perfil en la que se pulsa «Seguir» y «Mensaje» y sale el mensaje privado con la palabra. Sin voz, quita `--voz`.

## 7. Entrega

- Manda el MP4 (los dos, si hay dos finales) y la hoja de personaje.
- Propón:
  - Una portada. Añade `"portada": {"etiqueta": "…", "titulo": ["LÍNEA 1", "LÍNEA 2"], "clave": "PALABRA", "sub": "…", "pose": "celebra"}` al plan y ejecuta `node portada.js proyecto/reel.json`. Sale `proyecto/portada.jpg` (1080×1920, sirve para las dos apps) y `portada_cuadricula.png` (cómo se ve en la cuadrícula del perfil). En `portada_cuadricula.png`, comprueba que el título se lee a 120 px y que no tapa la cara.
  - El texto para Instagram: gancho en la primera línea y como mucho 5 hashtags.
  - El texto para TikTok: la primera línea con lo que la gente busca.
- Recuérdale que marque el vídeo como «contenido generado por IA» si la voz es de IA (en TikTok, en «Más opciones»; en Instagram, en «Añadir etiqueta de IA»).
- Licencias: Three.js (MIT), Playwright (Apache 2.0) y las fuentes Poppins, Silkscreen y JetBrains Mono (OFL) permiten uso comercial. Los efectos de sonido se generan con ffmpeg. Si el modelo de reconocimiento de voz no se puede descargar, el alineado funciona igual, aunque es menos preciso.
