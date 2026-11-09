# Escenas y campos del plan

## Estilo limpio (`"estilo": "limpio"`, por defecto)
8 partes fijas; de cada una cambian los textos y el inicio (`tiempos`, 8 números en segundos).

| Parte | Qué pasa | Campos (`textos`) | Largo recomendado |
| --- | --- | --- | --- |
| 1 · logo | la mascota (o el icono) salta dentro de un aro y dos trazos la rodean | — | — |
| 2 · pregunta | la pregunta entra desde la izquierda, sube y la mascota asoma por abajo con su bocadillo | `pregunta`, `bocadillo` | 38 y 18 caracteres |
| 3 · palabras | tres palabras con su icono; el fondo cambia de color con cada una | `palabras` (3), `iconos` (3: engranaje, flecha, libro, estrella, altavoz, micro, reloj, corazon, check, calendario o ninguno) | 11 cada una |
| 4 · descubre | salta el icono de la app y se escribe «Descubre Nombre» | `descubre`: la palabra que va delante del nombre («Descubre» si no lo pones; `""` para que salga solo el nombre) | 18 contando el nombre |
| 5 · móvil | un móvil gira en 3D entre aros con una ruta de botones | `movil` (título de la pantalla), `iconos_movil` (6 iconos de los botones) | 22 |
| 6 · dato | un punto crece hasta llenar el plano y se escribe el dato | `dato` (vacío: solo el color) | 30 |
| 7 · tarjeta | una tarjeta de la app entra volando y se aleja | `tarjeta.titulo`, `tarjeta.frase`, `tarjeta.boton`, `tarjeta.icono_frase`, `tarjeta.icono_boton` | 22, 14 y 20 |
| 8 · final | un trazo se enrosca, se convierte en el icono, se escribe el nombre y todo se desvanece a blanco | `marca.nombre` | 10 |

- **Color:** `marca.colores.principal`; los tonos oscuros y claros salen solos. Opcionales: `marca.colores.texto` (ojos de la mascota) y `marca.colores.secundario` (mofletes).
- **Logo:** `marca.logo` (PNG con fondo transparente, en la carpeta del proyecto) sustituye al icono con la cara de la mascota.
- **Letra:** `marca.letra_titulos` (Fredoka por defecto; otras, con `npm install @fontsource/<nombre>` en `motor/`).
- **Desenfoque:** `desenfoque` = sub-imágenes por fotograma (8 por defecto; 1 lo quita y renderiza 8 veces más rápido).
- Los textos largos se encogen solos para caber, pero el motor avisa: mejor acortarlos. En vertical, una pregunta larga se parte sola en dos líneas.
- **Nombre largo (dos palabras o más de 10 letras):** en `descubre`, una palabra corta («Prueba», «Ven a») o `""` para que salga solo el nombre.
- **Iconos a juego con el negocio:** cambia también `iconos_movil` y los de la tarjeta (en el ejemplo son de idiomas: altavoz y micro). Para una reserva, por ejemplo, `calendario`, `reloj` y `check`.
- **Negocio sin app:** `movil` como el nombre de la carta o del servicio, y la tarjeta como un pedido o una reserva («Tu mesa · Hoy 21:00 · TOCA PARA RESERVAR»).

## Estilo clásico (`"estilo": "clasico"`, o un plan sin `estilo`)

Un archivo JSON por anuncio, en su carpeta de proyecto. Copia la estructura de `ejemplo-clasico/anuncio.json`.

## Cabecera
| Campo | Qué es | Por defecto |
| --- | --- | --- |
| `salida` | Nombre de los archivos que salen (`anuncio.mp4`, `anuncio.html`) | `"anuncio"` |
| `ancho`, `alto` | Tamaño en píxeles. Vertical 1080×1920 (Reels, TikTok, Shorts, historias), horizontal 1920×1080 (YouTube, web) o 1280×720, cuadrado 1080×1080 | 1080×1920 |
| `fps` | Fotogramas por segundo | 30 |
| `duracion` | Duración total en segundos. Si no está, acaba donde acaba la última escena | — |
| `bucle` | `true`: el final funde con el principio, para que el anuncio se repita sin salto | `true` |

## `marca`
| Campo | Qué es |
| --- | --- |
| `nombre` | Nombre de la app o del negocio (sale en el logo, «Descubre…» y el final) |
| `eslogan` | Frase corta del final (si la escena `final` no trae `texto`) |
| `logo` | Opcional: ruta a un PNG o SVG **del usuario**, relativa a la carpeta del plan (`"logo.png"`). Sin logo, se dibuja un icono con la mascota |
| `colores` | `principal`, `secundario`, `acento`, `fondo`, `texto` y `claro` en hex (`"#6C4CF1"`). Si falta alguno, se usa el del ejemplo |
| `letra_titulos`, `letra_textos` | Familias de Google Fonts instaladas con npm (`@fontsource/<nombre>`). Por defecto Fredoka y Poppins |

Colores: elige un `principal` con fuerza, un `secundario` que contraste con él, un `acento` claro (amarillo, lima…), un `fondo` muy claro y un `texto` muy oscuro. Si el usuario da un solo color de marca, propón los otros cinco y enséñalos en la hoja de muestras.

## `mascota` (personaje dibujado con código)
| Campo | Valores |
| --- | --- |
| `forma` | `bocadillo`, `circulo`, `gota`, `cuadrado` o `nube` |
| `color` | Hex; por defecto, el `principal` |
| `accesorio` | `gafas`, `pajarita`, `auriculares` o `null` |
| `visible` | `false` para un anuncio sin mascota |

## `escenas`
Una lista. Cada escena tiene `tipo`, `a` (segundo en el que empieza) y, si quieres, `b` (en el que acaba; si no, acaba cuando empieza la siguiente). Campos que valen para todas:
- `fondo`: un nombre de color de la marca (`"principal"`, `"secundario"`, `"acento"`, `"fondo"`) o un hex.
- `transicion` de entrada: `corte`, `circulo`, `barrido`, `arriba` o `diagonal` (si no se pone, va alternando; la primera escena es siempre `corte`).
- `decor: false` quita las formas que flotan en el fondo.

| Tipo | Qué dibuja | Campos propios |
| --- | --- | --- |
| `logo` | Aros que se abren, el icono que rebota y el nombre | — |
| `pregunta` | Pregunta grande palabra a palabra y la mascota que sube y habla | `texto`, `resaltar` (palabras en caja de color; una entrada de varias palabras, como «5 km», resalta cada una), `bocadillo` (lo que dice la mascota), `tam` (tamaño de letra, 112) |
| `palabras` | Una palabra enorme por color de fondo, que cambia de golpe | `palabras` (2–3), `colores` (uno por palabra: nombre de color de la marca o hex), `tam` (200) |
| `descubre` | Cortinillas de color y «Descubre» + icono + nombre | `texto` («Descubre») |
| `movil` | Un móvil que gira en 3D con la pantalla de la app y etiquetas que saltan | `chips` (2 etiquetas), `filas` (3 filas de la lista), `boton`, `racha` (texto pequeño arriba a la derecha) |
| `dato` | Un número que cuenta y estalla en estrellas | `numero`, `desde` (0), `prefijo` («+»; `""` para quitarlo), `sufijo` (« %», « €»…), `texto` |
| `tarjeta` | Tarjeta de la app con barra de progreso, racha y pegatina | `titulo`, `subtitulo`, `progreso` (0–1), `chip` («+20 XP»), `racha_texto` |
| `final` | Un trazo que dibuja el camino hasta el icono, el nombre, el eslogan y un botón | `texto` (eslogan), `cta` (texto del botón) |
| `texto` | Una frase grande con la mascota (comodín para lo que no encaje) | `texto`, `resaltar`, `tam`, `mascota: false`, `habla`, `saluda` |

## Negocio sin app
Las escenas de app sirven también para un local o un servicio, cambiando los textos:
- `movil` → la carta, el catálogo o la web en el móvil: `filas` con 3 productos o servicios («Flat white», «Croissant vegano»), `chips` con lo que lo distingue («Café de especialidad», «100 % vegano») y `boton` («Pedir», «Reservar»).
- `tarjeta` → un pedido, una reserva o la tarjeta de fidelidad: `titulo` «Tu pedido», `subtitulo` «Listo en 5 min», `progreso` 0.8, `chip` «-10 %», `racha_texto` «5.º café gratis».
- `dato` → una cifra real del negocio (años abierto, kilos de pan al día, clientes, valoración). Nunca te inventes una cifra: pregúntala o quita la escena.
- Si nada de eso encaja, usa `texto` o `palabras`.

## Tiempos
- Un anuncio de 8–12 s suele tener 7–9 escenas de 0,8–1,9 s. Menos de 0,5 s casi no se ve (el motor avisa).
- Textos del móvil y de las tarjetas: cortos (filas de 18 caracteres, etiquetas de 22, botón de 14). El motor avisa si algo se va a cortar.
- **Si hay referencia**, usa los tiempos de sus planos (`referencia.py` los saca) y elige para cada plano el tipo que haga lo mismo: logo con aro → `logo`; pregunta + personaje → `pregunta`; palabras sobre color → `palabras`; móvil girando → `movil`; cifra → `dato`; tarjeta de la app → `tarjeta`; cierre con logo → `final`.
- Las transiciones duran 0,26 s y ocurren al empezar cada escena.
- El texto tiene que poder leerse: unas 3 palabras por segundo (el motor avisa por encima de 3,5).
- En `palabras`, la hoja de muestras solo enseña una palabra: mira las demás con `--solo`.

## Ejemplo mínimo
```json
{
  "ancho": 1080, "alto": 1920,
  "marca": { "nombre": "Panadería Lola", "eslogan": "Pan de verdad, cada mañana",
             "colores": { "principal": "#C2571A", "secundario": "#2F6B4F", "acento": "#F4C542", "fondo": "#FFF6EA", "texto": "#2A1A10", "claro": "#FFFFFF" } },
  "mascota": { "forma": "circulo", "accesorio": "pajarita" },
  "escenas": [
    { "tipo": "logo", "a": 0 },
    { "tipo": "pregunta", "a": 1.0, "texto": "¿Pan recién hecho?", "resaltar": ["recién"], "bocadillo": "¡Huele!" },
    { "tipo": "palabras", "a": 2.6, "palabras": ["Masa madre", "Horno de leña"] },
    { "tipo": "dato", "a": 4.0, "numero": 24, "prefijo": "", "sufijo": " h", "texto": "de fermentación" },
    { "tipo": "final", "a": 5.4, "b": 7.5, "cta": "Pide el tuyo" }
  ]
}
```
