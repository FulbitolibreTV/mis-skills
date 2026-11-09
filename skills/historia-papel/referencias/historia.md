# historia.json: el guion con sus escenas

Un archivo por vídeo, en `proyectos/<nombre>/historia.json`. Mira `ejemplo/historia.json` (4 frases y dos finales).

```json
{
 "titulo": "El primer bug",
 "fuentes": ["Smithsonian, Log Book With Computer Bug: https://…"],
 "decorado": "mesa",
 "portada": {"titulo": "El primer **bug** era un bicho", "etiqueta": "HISTORIA REAL · 1947"},
 "frases": [
  {"texto": "En **1947**, un ordenador de Harvard empezó a **fallar** sin motivo.",
   "decorado": "mesa", "camara": "acerca", "barrido": false,
   "piezas": [ … ]}
 ],
 "finales": {
  "instagram": {"texto": "Comenta **BUG** y te cuento más historias así."},
  "tiktok": {"texto": "Sígueme y escríbeme **BUG** por privado."}
 }
}
```

| Campo | Qué es |
| --- | --- |
| `titulo` | Nombre del vídeo (los archivos salen con él). |
| `fuentes` | De dónde salen los datos (para la descripción del vídeo). No lo lee ningún script, pero apúntalas siempre. |
| `decorado` | Fondo por defecto de las escenas. |
| `frases` | Una por escena, en orden. Cada una con `texto` y `piezas`. |
| `finales` | Opcional. Un vídeo por final (el cuerpo se dibuja una vez). Los nombres son libres. Con un solo final, usa `"final": {"texto": "…"}`; sin final, no pongas ninguno. Si un final no trae `piezas`, se monta solo: lo que va antes de la palabra **clave** en una etiqueta, la palabra en una caja grande y el resto debajo. |
| `portada` | Opcional: `titulo` (con **clave** en naranja), `etiqueta` (arriba, pequeña) y `t` (segundo del fondo). |
| `colores` | Opcional: cambia colores de la paleta, por ejemplo `{"naranja": "#E8505B", "noche": "#1B2A2F"}`. |
| `tiras` | `false` quita las tiras automáticas de palabras clave. |
| `subtitulos` | `true` añade subtítulos palabra a palabra (por defecto no: las tiras ya hacen ese papel). |

## Cada frase
| Campo | Qué es |
| --- | --- |
| `texto` | Lo que se dice. Entre `**dos asteriscos**` van las palabras clave: salen solas en tiras de papel (naranja la primera, crema la segunda) en la parte de abajo. 1 o 2 grupos por frase. |
| `decorado` | `mesa` (pared y mesa con lámpara), `escritorio` (mesa entera), `pared` (papel pintado y suelo), `pasillo` (pared muy ancha para mover la cámara de lado, x de 0 a 3600), `cielo` (noche con luna), `corcho` (tablón con lámpara), `liso` o `ninguno`. |
| `camara` | `acerca` (por defecto: zoom lento), `aleja`, `quieta` o `{"x": 540, "y": 960, "zoom": 1, "claves": [[tiempo, {"x": …, "y": …, "zoom": …}]]}` para recorrer un decorado. |
| `barrido` | `true`: la escena entra con un barrido de franjas de papel. Úsalo para cambiar de parte de la historia (2–4 por vídeo). |
| `piezas` | Los objetos (catálogo en `piezas.md`). Se dibujan en orden: lo primero queda detrás. |
| `tiras` | Opcional, para elegir las tiras a mano: `[{"en": "@palabra", "texto": "lo que pone", "estilo": "naranja" \| "crema" \| "noche", "fila": 0 \| 1}]`. |

## Cómo pensar cada escena
1. **Una idea por frase y un objeto que la cuente** en el centro (una metáfora de papel: la red que atrapa contraseñas, el embudo que filtra, la puerta que se abre).
2. **Que pase algo cuando se dice la palabra:** entra un sello con `@palabra`, se abre una puerta, rueda un contador, una mano teclea o señala. Al menos una pieza por frase con un tiempo `@palabra`.
3. **Las tres zonas vivas:** arriba una etiqueta o una lámpara que parpadea; en el centro, el objeto; abajo, un brazo, una taza o las tiras. Nada quieto más de un segundo.
4. **Manos que entran desde abajo** (`brazo` con `"entra": {"desde": "abajo"}`): son lo que más vida da.
5. **Gancho en el segundo 0:** la primera escena ya tiene algo moviéndose (entradas en `t` 0–0,3) y la frase empieza con el dato más raro o concreto.

Ideas de metáforas:
| Si la frase habla de… | Prueba con… |
| --- | --- |
| un ordenador, un programa, internet | `monitor` + `teclado` + dos `brazo` tecleando; `terminal`; `cable` con `pulsos` |
| una fecha, una cifra | `calendario` que pasa días, `contador` que rueda, `etiqueta` |
| investigar, buscar | `corcho` + `nota` + `lupa` que se mueve con `claves` |
| un lugar, una empresa | `edificio` + `etiqueta` con el nombre; `cielo` de noche |
| un viaje | `avion` con `claves` + `cable` `discontinuo` que se traza |
| la ley, un juicio | `mazo` que golpea (anima `rot`) + `bloque` + `sello` |
| dinero | `billetes`, `contador` con `sufijo` |
| acceder, entrar | `puerta` que se abre + `brazo` con `pose: llave` |
| filtrar, elegir | `embudo` + `sobre` que caen |
| alguien anónimo | `silueta` con una `etiqueta` que cambia de `texto` en las `claves` |
| un error, un aviso | `sello` rojo, `sirena`, `chispas` |
| un bicho, un fallo | `polilla` |
| contar algo con tu cara de papel | `persona` abajo a la izquierda con `habla: true` (las tiras suben solas) |

## Tiempos
Con voz, los tiempos `@palabra` caen justo cuando se dice la palabra. Sin voz se estiman (a 170 palabras por minuto), así que el vídeo queda bien pero no hay voz: lo normal es grabarla.
