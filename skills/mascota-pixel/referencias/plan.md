# reel.json, el plan del vídeo

Ejemplo completo: `ejemplo/reel.json`.

```json
{
  "estilo": "arena",
  "cabecera": {"derecha": ["mi-canal", "pixel"], "contador": true},
  "personaje": "personaje",
  "palabras": "voz/palabras.json",
  "rejilla": true,
  "alternar_fondo": true,
  "cola": 0.8,
  "pasos": [ ... ],
  "portada": { ... }
}
```

## Campos generales
| Campo | Qué es |
| --- | --- |
| `estilo` | `claro` (blanco y azul), `arena` (crema y naranja), `noche` (oscuro), `menta` o `chicle`. También acepta un objeto con colores: `{"base": "claro", "acento": "#7C3AED", "rejilla": ["#E9D5FF", "#C084FC", "#9333EA", "#6B21A8"]}`. Claves de color: `fondo`, `fondo2`, `tarjeta`, `texto`, `acento`, `suave`, `linea`, `rejilla` (4 tonos), `vacia` y `ok` |
| `cabecera.derecha` | Ruta de arriba a la derecha: `["gris", "color"]`, por ejemplo `["tu-canal", "pixel"]`. Por defecto no sale nada |
| `cabecera.contador` | `true` pone una píldora «03/12» arriba. Por defecto no sale: la barra de XP ya enseña el avance |
| `panel` | `"juego"` (por defecto: cajas con borde grueso y sombra dura, como un videojuego) o `"suave"` (sombra difuminada) |
| `progreso` | `"xp"` (barra de experiencia abajo a la derecha, por defecto), `"rejilla"` (cuadritos) o `"no"` |
| `halo` | `false` quita el círculo pixelado de detrás del personaje |
| `destellos` | `false` quita las estrellitas de píxel que parpadean en el fondo |
| `idioma` | `"es"` (por defecto), `"en"` o `"pt"`: idioma de los textos fijos («¡LEVEL UP!» y la caja de comentario). Los titulares y las tarjetas se escriben en el idioma del vídeo |
| `nivel_xy` | Dónde sale «¡LEVEL UP!» (por defecto abajo a la derecha, lejos de la cara) |
| `juego` | `true` (por defecto): toques de videojuego. Las tarjetas y las cajas del titular se materializan en píxeles, sale «+10 XP» al cambiar de paso y «¡LEVEL UP!» al empezar el último, hay bocadillos de emoción sobre la cabeza, nubes de píxel y sacudidas de pantalla. `false` lo quita todo |
| `jugador` | Placa de videojuego en el gancho: `{"nombre": "BECARIO", "nivel": "99", "vida": 0.9, "x": 1010, "y": 1500}` |
| `letra_caja` | Letra de la caja del titular: `"pixel"` (por defecto en modo juego, Jersey 10) o `"black"` (Poppins) |
| `texto_xp`, `texto_nivel` | Textos de «+10 XP» y «¡LEVEL UP!» |
| `subir_nivel`, `nubes`, `sacudidas` | `false` quita cada efecto por separado |
| `escala_personaje` | Tamaño del personaje en su sitio: 1 por defecto. Con 0,8 queda más pequeño y deja más hueco a las tarjetas; con 1,15, más grande |
| `ampliar_tarjetas` | Cuánto puede crecer una tarjeta pequeña para llenar el hueco (1.2 por defecto; 1 para no ampliar) |
| `personaje` | Carpeta con `personaje.json` (la que crea `sprite.py preparar`) |
| `palabras` | El archivo que crea `alinear.py`. La voz se encuentra sola si se alineó con voz |
| `cola` | Segundos que se queda el último paso después de la última palabra |
| `escala_grande` | Tamaño del personaje en el gancho (por defecto se ajusta solo, hasta 2×) |
| `salida` | Nombre del vídeo (por defecto `reel.mp4`) |

## Cada paso
```json
{"frase": 3, "pose": "senala_lado",
 "titulares": [{"l1": "Tu dibujo", "l2": "o tu foto"}, {"en": "convierte", "l1": "Personaje", "l2": "de píxeles", "pose": "sorpresa"}],
 "tarjeta": {"tipo": "poses", "pie": "hecho con tu imagen"}}
```

| Campo | Qué es |
| --- | --- |
| `frase` o `frases` | Qué frase o frases del guion cubre, contando desde 1. El paso empieza un fotograma antes de su primera palabra y dura hasta el siguiente paso |
| `cierre` | En lugar de `frase`, solo en el último paso: los segundos que dura un final sin voz, por ejemplo `"cierre": 2.0`, para una llamada a la acción que la voz no dice. Usa `en` con segundos |
| `pose` | Pose del personaje en este paso (si falta, la pose inicial) |
| `titulares` | 1–5 titulares (más en frases largas). `l1` sale grande en el color del texto y `l2` dentro de una caja del color del acento; si solo hay `l1`, va en la caja. Como mucho unas 14 letras por línea (el tamaño se ajusta solo, pero cuanto más corto, mejor). `en` indica cuándo entra; sin `en`, el primero entra al empezar el paso. Un titular puede cambiar la pose con `pose` |
| `tarjeta` | Lo que se ve en el centro. Tipos y campos en `tarjetas.md` |
| `personaje: "grande"` | El personaje sale en grande y centrado (gancho del primer paso). En el paso siguiente baja solo a su sitio |
| `emote` | Bocadillo de videojuego sobre la cabeza al empezar el paso: `!`, `?`, `corazon`, `idea`, `nota`, `gota`, `estrella` o `enfado`. Si falta, las frases que acaban en «?» o «!» lo ponen solas. También vale dentro de un titular |
| `golpe` | Dentro de un titular, `"golpe": true` sacude la pantalla cuando entra. Úsalo con moderación: 1–2 por vídeo |
| `sello` | Solo con `grande`: etiqueta inclinada `{"valor": "0", "texto": "fotogramas a mano", "en": "palabra", "x": 270, "y": 1660}` |

## «en»: cuándo pasa algo
En titulares y en casi todos los elementos de las tarjetas:
- `"en": "palabra"`: entra 0,08 s antes de que se diga esa palabra en el paso. No distingue tildes ni mayúsculas. Primero busca la palabra exacta; si no está, la primera que empiece así, y avisa si hay varias. Con palabras cortas («lo», «es»), mejor usa la palabra entera de al lado o segundos.
- `"en": "palabra#2"`: la segunda vez que se dice.
- `"en": 1.5`: a los 1,5 segundos de empezar el paso.

Si no encuentra la palabra, avisa y usa el tiempo por defecto.

## Titulares largos
- Si una línea pasa de unas 14 letras, el tamaño baja solo y las dos líneas se igualan, para que no queden una grande y otra pequeña.
- Para un titular potente, mejor una primera línea corta y la idea fuerte en la caja: `{"l1": "Error 1", "l2": "Tardas en arrancar"}`.

## Dos finales (Instagram y TikTok)
- Copia `reel.json` como `reel_tiktok.json` y cambia solo el último paso (y `"salida": "reel_tiktok.mp4"`).
- Si la voz es distinta al final, alinea las dos voces en carpetas distintas (`voz`, `voz_tiktok`) y pon en cada plan su `"palabras"`.

## Reglas de ritmo
- Algo cambia antes de 1,5 s y nunca hay más de 0,6 s sin cambios. La boca ayuda, pero los titulares y las tarjetas también tienen que moverse.
- Un titular nuevo cada 1,2–2 s en las frases largas: pon un segundo titular con `en`.
- Las tarjetas tienen su propio movimiento (tecleo, barras, elementos que entran). Pon los `en` en las palabras clave para que entren a la vez que se dicen.

## Portada
```json
"portada": {"etiqueta": "SKILL DE CLAUDE", "l1": "MI MASCOTA", "l2": "HABLA SOLA", "pose": "sorpresa",
            "boca": "D", "escala": 1.9, "sello": {"valor": "0", "texto": "píxeles animados", "x": 800, "y": 1500}}
```
- Títulos cortos en mayúsculas, como mucho unas 13 letras por línea.
- `halo`: `false` quita el círculo pixelado de detrás. `escala`: tamaño del personaje (1,9 por defecto; baja a 1,5 si el personaje es muy grande).
- `boca`: la forma de la boca en la portada (D, abierta, queda expresiva).
- `portada_comprobar.png` enseña el recorte 3:4 que ve la cuadrícula de Instagram y la miniatura a 120 px: el título tiene que leerse.
