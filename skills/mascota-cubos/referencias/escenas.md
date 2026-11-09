# Escenas y tarjetas de `reel.json`

```jsonc
{
  "fps": 30,
  "escala3d": 0.75,                 // resolución del 3D (0.75 = 810×1440 escalado; más alto = más lento)
  "personaje": { "ficha": { ... } }, // o { "skin": "skin.png" } o { "modulo": "fichas/mia.js", "funcion": "crear" }
  "colores": { "acento": "#FF7A1A", "texto": "#0E1B33", "fondo": "#FFF4E8", "fondo2": "#FDE6CF" },
  "ejemplos": { "chef": { ...ficha... } },  // mascotas extra para tarjetas (se renderizan como imagen)
  "caracteresPorLinea": 24,         // subtítulos: largo máximo de cada página
  "cola": 0.9,                      // segundos tras la última palabra
  "velocidadSinVoz": 1,             // solo sin voz: 1 ≈ 2,5 palabras/s; 1.2 más rápido
  "subtitulosEnPasos": false,       // true: subtítulos también en los pasos (abajo, junto a la mascota); recomendado sin voz
  "altoMascotaPasos": 450,          // alto en píxeles de la mascota en los pasos
  "yTarjeta": 640,                  // dónde empieza la tarjeta de los pasos
  "frases": [ { "texto": "...", "claves": ["..."], "poses": ["..."], "escena": { ... } } ]
}
```

`voz` y `tiempos` los añade `alinear.py`. Sin ellos, el reel va sin voz y con tiempos estimados.

## Poses
`base`, `saluda`, `presenta`, `pulgar`, `senala_arriba`, `senala_camara`, `piensa`, `celebra` (salta), `sorpresa`, `agobiado`, `brazos_cruzados`, `camina`. Cada pose trae su cara: feliz, sorpresa, guiño, risa, agobio, piensa o decidido.

## Tipos de escena

### `paisaje`: mundo de bloques en 3D, con subtítulos arriba
```json
{ "tipo": "paisaje", "cielo": "dia", "camara": "medio", "objeto": { ... } }
```
- `cielo`: `dia`, `atardecer` o `noche`.
- `camara`: `medio`, `cerca`, `lejos` o `bajo`. Por defecto va alternando.
- `giro`: orientación de la mascota (−0.12 por defecto).
- `subtitulos: false` los oculta.
- `objeto`, que flota sobre la escena:
  - `{"tipo": "icono", "icono": "camara", "tacharEn": "cara"}`: tarjeta con icono que se tacha al decir esa palabra y estalla en píxeles. Iconos: `camara`, `archivo`, `check`, `play`, `regalo`.
  - `{"tipo": "tarjetas", "items": [{"ejemplo": "chef", "titulo": "recetas", "pose": "pulgar", "pie": "sin cara"}]}`: 2 o 3 cartas en abanico con mascotas de `ejemplos`.
  - `{"tipo": "rec"}`: marco de grabación con «REC» parpadeando.

### `cortinilla`: ola de color a pantalla completa con un texto grande
```json
{ "tipo": "cortinilla", "texto": "Te enseño cómo." }
```
Entra con una ola que sube. Al pasar a un `paso`, sale con otra ola.

### `paso`: fondo claro con cuadrícula, número en píxeles, barra de progreso, título y tarjeta
```json
{ "tipo": "paso", "n": 1, "total": 6, "titulo": ["sube la", "skill"], "clave": "skill",
  "tarjeta": { ... }, "burbuja": { "texto": "te la mando al final ↓", "en": "tranquilo" }, "lado": "izquierda" }
```
- La mascota va abajo a la izquierda, o a la derecha con `"lado": "derecha"`.
- `burbuja` es un bocadillo que aparece al decir la palabra `en`.
- `subtitulos: true` muestra la frase abajo, junto a la mascota. Por defecto los pasos no llevan subtítulos: el título y la tarjeta cuentan la idea. En los reels sin voz, actívalos con `"subtitulosEnPasos": true` en el plan.
- Dos frases seguidas pueden tener el mismo `n` si cambian el título o la tarjeta.

Tarjetas (`tarjeta.tipo`):
| tipo | campos | qué enseña |
|---|---|---|
| `chat` | `app`, `archivo`, `nota`, `texto` o `marcador` | Ventana de chat: archivo adjunto, nota verde con ✓ y texto que se escribe solo |
| `elige` | `app`, `texto`, `opciones` [{`ejemplo`, `etiqueta`}], `elegida`, `elegirEn` | Se escribe una petición y se elige una de 3 mascotas. `"ejemplo": "principal"` es la tuya |
| `giro` | `app`, `etiquetas` | Tu mascota de frente, 3/4, de lado y de espaldas |
| `poses` | `app`, `poses` (6), `recorte` | Cuadrícula con 6 poses de tu mascota |
| `guion` | `app`, `filas` [[línea, emoción, pantalla]] | Tabla del guion con etiquetas de emoción |
| `voz` | `app`, `nombre`, `segundos` | Onda de voz que se va llenando, botón de reproducir y tiempo |
| `lista` | `app`, `etiqueta`, `items`, `vista` (true/false), `imagen`, `vistaEn` | Lista que se va marcando. Con `vista: true` sale un móvil con el paisaje y la mascota al decir `vistaEn`; con `imagen: "foto.jpg"` (de la carpeta del proyecto) sale esa imagen en el móvil. Sin ninguna de las dos, la lista ocupa toda la tarjeta |

### Portada (`node portada.js`)
`"portada": {"etiqueta": "SKILL GRATIS", "titulo": ["3 PLANTAS", "SIN AGUA"], "clave": "SIN AGUA", "sub": "…", "pose": "celebra", "cielo": "dia"}`. `clave` puede tener varias palabras: se resaltan todas.

### `cta`: paisaje (atardecer por defecto) con comentario, respuesta y archivos
```json
{ "tipo": "cta", "cielo": "atardecer", "cta": { "palabra": "CUBOS", "respuesta": "¡Aquí tienes tu kit!", "archivos": ["mi-regalo.zip", "guía paso a paso"], "autor": "@tú · ahora" } }
```

### `cta` con `"modo": "sigueme"`: final «sígueme y escríbeme por privado» (por ejemplo, para TikTok)
Tarjeta de perfil que pulsa «Seguir» (con un corazón) y luego «Mensaje», y sale el mensaje privado con la palabra. Lo pone solo `final.py` (ver «Dos finales» en SKILL.md).
```json
{ "tipo": "cta", "cielo": "atardecer", "cta": { "modo": "sigueme", "usuario": "@tu_cuenta", "bio": "Recetas fáciles", "palabra": "CUBOS" } }
```

### Textos fijos y otros idiomas
Los textos que pone el motor se cambian con `"textos"` en el plan (o dentro de un `cta`): `autor`, `respuesta`, `usuario`, `bio`, `seguir`, `siguiendo`, `mensaje` y `privado`. Por ejemplo, en inglés: `"textos": {"seguir": "Follow", "siguiendo": "Following", "mensaje": "Message", "privado": "by DM", "autor": "@you · now"}`.

## Transiciones automáticas
- Paisaje → cortinilla: ola que sube.
- Cortinilla → paso: ola que barre hacia arriba.
- Paso ↔ paisaje: desenfoque con destello blanco.
- Paso → paso: el título se desenfoca y entra la tarjeta nueva.

## Efectos de sonido automáticos
Se generan con ffmpeg (sin archivos externos) y se colocan solos:
- `pop` en tarjetas, cartas y estallidos.
- `ding` en confirmaciones.
- `click` al elegir.
- `whoosh` en olas y desenfoques.
`montar.js --sin-efectos` los quita.
