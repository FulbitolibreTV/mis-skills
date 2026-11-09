# Personaje en pixel art

## Opción A, la mejor: una hoja con 9 poses en una sola generación
Se pide en ChatGPT (o en Gemini) **una sola imagen** con 9 poses. Así salen todas a la misma escala y con el mismo estilo, y no hay que pedirlas una a una.

Adjunta la imagen o la foto del personaje y pega esto, cambiando lo que va entre corchetes:

```
Create ONE image: a pixel-art sprite sheet of this exact character with 9 poses, arranged in 3 columns × 3 rows, on a plain flat bright green background (#00FF00), like a green screen. Leave clear empty space between poses. No grid lines, no borders, no text, no labels, no numbers. Do not use green anywhere on the character.

Every pose: waist-up (body cut at the waist), facing the viewer, all at the SAME size and scale, head at the same height in every cell, mouth CLOSED and neutral (a small line), complete hands with five fingers that stay inside their own cell.

Style: detailed 16-bit indie video game pixel art, visible square pixels, crisp edges, no anti-aliasing, no blur, no gradients, limited palette (about 24 colors), 1-pixel dark outline, simple 2–3 tone cel shading.

Keep the identity of the attached character: [describe en una línea pelo, ropa y lo más reconocible].

Poses, left to right, top to bottom:
1. pointing his index finger straight at the viewer
2. pointing to the right side of the image with his arm extended
3. index finger raised next to his face, "I have an idea"
4. shrugging with both palms up
5. arms crossed, confident
6. thumbs up
7. OK hand sign next to his face
8. waving with an open hand
9. both hands on his cheeks, eyebrows raised, surprised
```

- Si el personaje es chica, cambia *his* por *her*; si es un animal o un objeto, por *its*.
- **Si el personaje tiene algo verde**, usa fondo magenta: `plain flat magenta background (#FF00FF)` y `Do not use magenta anywhere on the character`.
- **Si se parte de una foto**, añade al principio: `Turn the person in the attached photo into a cute pixel-art video game character (keep hair, glasses, beard and clothes recognizable).`
- **Para una segunda hoja** con más poses (2×2): adjunta la primera hoja y añade `Same pixel size, palette and proportions as the attached sprite sheet.`. Poses útiles: peace sign, fist raised, clapping, hand behind the ear, celebrating, thinking with hand on chin.

Nombres de las 9 poses, en orden: `senala_camara,senala_lado,dedo_arriba,encoge_hombros,brazos_cruzados,pulgar,ok,saluda,sorpresa`.

**Si la hoja es otra** (2×2, 2×3, con otras poses): mírala, ponle a cada pose un nombre que diga el gesto, en orden de lectura (de izquierda a derecha y de arriba abajo), y pásalos en `--nombres`. Si hay poses repetidas, llámalas `repetida1`, `repetida2`… y no las uses en `reel.json`.

## Opción B: imágenes sueltas
Pasa los nombres de las poses con `--nombres` en el orden alfabético de los archivos (`preparar` te dice el orden si no coinciden), o copia las imágenes con su nombre de pose (`saluda.png`).
- Vale cualquier imagen: un PNG de pixel art, un dibujo plano o un avatar.
- Fondo transparente o de un color liso.
- Una imagen por pose, con un nombre de archivo que diga la pose (`saluda.png`).
- Con **una sola imagen** también funciona: el personaje no cambiará de pose, pero sí moverá la boca.

## Comandos
```bash
# A) hoja con varias poses → una imagen por pose
python3 scripts/sprite.py cortar --hoja hoja.png --salida P/poses \
   --nombres senala_camara,senala_lado,dedo_arriba,encoge_hombros,brazos_cruzados,pulgar,ok,saluda,sorpresa
#    (si junta o separa mal las figuras: --rejilla 3x3 corta en partes iguales)

# imágenes → sprites de píxeles (sirve para la carpeta de A o para imágenes sueltas)
python3 scripts/sprite.py preparar --entrada P/poses --salida P/personaje

# boca: se marca en UNA pose y en las demás se busca sola
python3 scripts/sprite.py boca --personaje P/personaje --pose senala_camara --x 41 --y 52 --ancho 6
```

`preparar` detecta solo el tipo de imagen:
- **pixel:** pixel art ampliado, como el que sale de ChatGPT. Detecta el tamaño del píxel y lo devuelve a su tamaño real.
- **nativo:** sprite pequeño, de 260 px o menos. Se usa tal cual.
- **dibujo:** cualquier otra imagen (dibujo plano, avatar, foto). Se reduce a `--alto` píxeles (120 por defecto), con paleta limitada y contorno. Queda pixelado, pero menos nítido que un pixel art de verdad: si el usuario quiere el aspecto de videojuego, dale el prompt de la hoja.

Si una imagen de pixel art sale como «dibujo» y queda borrosa, fuerza `--modo pixel`. Si sale mal, prueba `--modo dibujo --alto 100`.

**Poses de una misma hoja en modo dibujo:** usa `--factor` (por ejemplo, `--factor 3.6`: cada 3,6 píxeles de la imagen hacen 1 píxel del sprite), no `--alto`. Así todas salen a la misma escala aunque una tenga el brazo levantado.
- Elige el factor para que el sprite mida unos 100–120 px de alto.
- Si hay dos hojas de tamaños distintos, ajusta el factor de la segunda por la proporción entre las cabezas.

## Cómo marcar la boca
1. Abre `P/personaje/vistas/<pose>.png` con la herramienta de leer imágenes. Es el sprite ampliado, con una rejilla y números cada 10 píxeles: en rojo arriba y abajo para las columnas, y a los lados para las filas.
2. Busca la boca, una raya horizontal pequeña bajo la nariz. No hace falta clavarla: `boca` ajusta los números a la raya oscura más cercana y te dice dónde la ha puesto (`--exacta` para no ajustar):
   - `--x`: la columna del centro de la raya.
   - `--y`: la fila de la raya.
   - `--ancho`: cuántos píxeles mide, normalmente entre 4 y 10.
3. Ejecuta `boca`. Mira `vistas/bocas_<pose>.png`, con las 7 bocas ampliadas, y `hoja.png`, con cada pose y 4 bocas.
4. **Si una boca sale desplazada en otra pose**, márcala a mano solo en esa: `--pose esa --x .. --y .. --ancho .. --solo-esta`.
5. Si la boca se pinta sobre la barba o la piel equivocada, sube o baja una fila.

Bocas: X reposo (la original del dibujo), A cerrada (m, b, p), B poco abierta (consonantes, f, v), C media (e, i), D grande (a), E redonda (o) y F pequeña (u).

## personaje.json
`preparar` y `boca` lo escriben solos. Se puede editar:
- `pose_inicial`: la pose de referencia, la que fija el tamaño.
- `poses.<nombre>.boca`: `{x, y, ancho}`. Se puede añadir `"piel": [r, g, b]` si el color de alrededor de la boca no sale bien.
