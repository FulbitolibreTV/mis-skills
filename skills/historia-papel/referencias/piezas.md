# Catálogo de piezas

Cada pieza es un objeto de papel recortado. En `historia.json` se escribe así:
`{"tipo": "monitor", "x": 540, "y": 800, "entra": {"t": "@ordenador", "desde": "cae"}}`.

## Pantalla
- Mide **1080 × 1920**. `x` va de izquierda (0) a derecha (1080); `y`, de arriba (0) abajo (1920).
- Zonas: **arriba** (y 0–450) para etiquetas, fechas y números; **centro** (y 450–1280) para el objeto principal; **abajo** (y 1280–1920) para brazos, tazas, teléfonos… Las tiras de palabras clave salen solas en y ≈ 1440 y 1570.
- Deja 80 px de margen a los lados. Lo que esté en una zona tiene que moverse o cambiar al menos cada segundo (si no, `ritmo.py` avisa).

## Opciones que valen para todas
| Opción | Qué hace |
| --- | --- |
| `x`, `y` | Posición del origen de la pieza (casi siempre su centro; se dice abajo cuando no). |
| `rot` | Giro en grados (−10 a 10 queda natural). |
| `escala` | Tamaño (1 = normal). |
| `alfa` | Transparencia (0 invisible, 1 opaca). |
| `espejo` | `true` la da la vuelta en horizontal. |
| `pivote` | Punto sobre el que gira y escala, relativo al origen (`[0, 900]` = 900 px más abajo). |
| `capa` | Paralaje: 1 se mueve con la cámara; 0,9 parece más lejos. |
| `tiembla` | `false` quita el temblor de stop motion (para fondos). |
| `entra` | Cómo aparece: `{"t": tiempo, "desde": "pop" \| "golpe" \| "cae" \| "funde" \| "abajo" \| "arriba" \| "izquierda" \| "derecha", "dur": 0.4, "dist": 1300}`. «golpe» es para sellos y palabras; «abajo» para brazos. |
| `sale` | Cómo se va: `{"t": tiempo, "hacia": "funde" \| "pop" \| "abajo" \| "arriba" \| "izquierda" \| "derecha", "dur": 0.4}`. |
| `claves` | Animación libre: `[[tiempo, {"propiedad": valor, "curva": "suave"}], …]`. Cualquier número se anima (`x`, `y`, `rot`, `escala`, `alfa`, `abre`, `traza`, `num`…); un texto cambia de golpe en su tiempo. Curvas: `suave`, `sale`, `rebote`, `lineal`. |

**Tiempos** (en `t`, `t0`, `t1`, `texto_t0` y en las `claves`): segundos desde que empieza la frase, o mejor una palabra de esa frase:
`"@ordenador"` (cuando se dice), `"@ordenador+0.3"`, `"@ordenador-0.2"`, `"@la#2"` (la segunda vez que se dice), `"fin"` o `"fin-0.5"` (final de la escena).

**Colores:** un nombre de la paleta o `"#RRGGBB"`. Los fondos son oscuros: para que una pieza o un texto se vea, usa colores claros (`crema`, `beige`, `ocre`, `naranja`, `celeste`, `rojo`, `amarillo` solo en textos grandes); `morado`, `noche` y `tinta` casi desaparecen sobre ellos. Textos de 44 px o más (se ven en el móvil). Paleta: `noche`, `noche2`, `noche3`, `tinta`, `crema`, `crema2`, `beige`, `beige2`, `ocre`, `puerta`, `puerta2`, `madera`, `teal`, `celeste`, `gris`, `gris2`, `piel`, `piel2`, `manga`, `manga2`, `verde`, `pantalla`, `rojo`, `naranja`, `blanco`, `morado`, `morado2`, `cafe`, `amarillo`.

## Fondos (los pone el decorado; úsalos sueltos solo si hace falta)
| Pieza | Qué es | Opciones (valor por defecto) |
| --- | --- | --- |
| `pared_lisa` | Pared con lunares. Origen arriba a la izquierda. | `w`, `h`, `color` (noche), `punto` (noche3) |
| `pared` | Papel pintado de rayas, zócalo y suelo de tablas. Origen arriba a la izquierda. | `w` (3000), `h`, `zocalo` (1180, la y del suelo), `color`, `raya`, `suelo`, `alfombra` (true) |
| `mesa` | Tablero de escritorio con vetas. Origen arriba a la izquierda. | `w`, `h`, `color` (noche2), `veta` |
| `cielo` | Cielo de noche con estrellas que brillan y luna. Origen arriba a la izquierda. | `w`, `h`, `color`, `luna` (true), `luna_x`, `luna_y` |
| `corcho` | Tablón de corcho con marco. | `w` (860), `h` (640) |
| `lampara` | Lámpara con cono de luz. Con `parpadeo: true` falla de vez en cuando (da vida a la zona de arriba). | `cono` (700), `ancho` (260), `luz` (0.22), `parpadeo`, `semilla` |

## Objetos
| Pieza | Qué es | Opciones (valor por defecto) |
| --- | --- | --- |
| `monitor` | Ordenador retro; escribe líneas solo. Origen en el centro de la pantalla. | `tam` (1), `lineas` (7), `escribe` (1.5 líneas/s), `tinta` (verde), `texto` (texto grande en pantalla), `texto_t0` (cuándo empieza a teclearse), `texto_vel` (10 letras/s), `tam_texto` (64) |
| `terminal` | Ventana de terminal que se llena de código de colores. | `w` (820), `h` (560), `vel` (4 líneas/s) |
| `teclado` | Teclado visto desde arriba; las teclas se hunden solas. | `w` (640), `h` (220), `activo` (true) |
| `telefono` | Teléfono de disco. Con `gira: 1`, el disco gira. | `tam` (1), `color`, `color2`, `gira` (0) |
| `movil` | Móvil; dentro dibuja `hijos` (otras piezas, en coordenadas de pantalla 1080×1920 reducidas). | `w` (460), `h` (900), `fondo`, `hijos` |
| `taza` | Taza de café vista desde arriba. | — |
| `disquete` | Disquete. | `color` |
| `postal` | Postal con texto escrito. | `texto` ("clave:"), `texto2` ("••••••"), `color` |
| `sobre` | Sobre cerrado. | `w`, `h`, `color`, `linea` |
| `nota` | Pósit con chincheta, título y líneas. | `w` (260), `h` (220), `color`, `texto`, `tam` (38), `tinta`, `lineas` (3), `chincheta` |
| `hoja` | Hoja que se rellena de líneas numeradas (guion, lista, cuaderno). | `w` (560), `h` (740), `titulo` ("GUION"), `vel` (3 líneas/s), `filas` (9) |
| `calendario` | Calendario; anima `num` para que pasen los días. | `num` (28), `mes` ("diciembre"), `anio` ("1995"), `color` |
| `lupa` | Lupa con brillo. | `r` (130) |
| `red` | Red de pescar (atrapar algo). | `r` (180) |
| `embudo` | Embudo (filtrar, elegir). | `color` (teal) |
| `mazo` | Mazo de juez; anima `rot` para golpear. Origen en el extremo del mango. | — |
| `bloque` | Bloque donde golpea el mazo. | — |
| `billetes` | Fajo de billetes con cifra. | `texto` ("5.000 $") |
| `avion` | Avión de papel (viajes). Anímalo con `claves` de `x`, `y`, `rot`. | — |
| `edificio` | Edificio con ventanas; origen abajo en el centro. | `w` (360), `h` (620), `cols` (4), `filas` (7), `luces` (0.3), `ventana` (nº de una ventana) y `ventana_on` (0/1, anímalo), `color`, `color2` |
| `puerta` | Puerta con marco; anima `abre` de 0 a 1. Origen en el suelo, en el centro. | `abre` (0), `dentro` ("pantallas", "atomo" o "estrellas"), `interior`, `color` |
| `radar` | Radar que barre y hace parpadear un punto. | `r` (300), `vel` (140), `blip` ([x, y]), `blip_on` (1) |
| `sirena` | Luz de sirena que alterna rojo y azul. | — |
| `cable` | Cable o ruta por puntos. Anima `traza` de 0 a 1 para dibujarlo. `pulsos` = luces que viajan; `discontinuo: true` = ruta a trazos. Las coordenadas de `puntos` son de pantalla (pon `x`, `y` a 0). | `puntos`, `traza` (1), `grosor` (26), `pulsos` (0), `vel_pulsos`, `color`, `brillo`, `color_pulso`, `discontinuo` |
| `pinza` | Pinza de cocodrilo con cable (pinchar una red); anima `cierra`. | `cierra` (0), `largo` (600), `cable` |
| `chispas` | Chispas; anima `fuerza` de 0 a 1 y vuelta. | `fuerza` (1) |
| `polilla` | Polilla o bicho de papel que aletea. | `aletea` (true), `color`, `color2` |
| `silueta` | Persona translúcida sin rasgos (alguien anónimo). Origen en los pies. | `transp` (0.55), `color` (celeste) |
| `linea_tiempo` | Línea de tiempo de un editor con un cursor que avanza. | `w`, `h`, `vel` |
| `onda` | Onda de sonido animada (alguien habla, una llamada). | `barras` (24), `w` (600), `color` |
| `rect`, `circulo` | Formas de papel sueltas (cinta adhesiva, recortes, botones). | `w`, `h`, `r`, `color` |
| `imagen` | Un PNG del usuario (con fondo transparente), en la carpeta del proyecto. Origen abajo en el centro. | `archivo` (obligatorio), `alto` (600) |

## Manos y personas
| Pieza | Qué es | Opciones (valor por defecto) |
| --- | --- | --- |
| `brazo` | Brazo con manga que entra desde abajo y actúa. Origen en la muñeca; el brazo baja `largo` px. Pon `"pivote": [0, largo]` para que gire desde el hombro y entra con `"desde": "abajo"`. | `pose`: `abierta`, `teclea_a`, `teclea_b` (alternan solas: teclear), `puno`, `llave` (sujeta una llave), `senala`, `sujeta`; `lado` ("der" o "izq"), `largo` (900), `manga`, `manga2`, `puno_color` |
| `persona` | Narrador de papel (dibujo propio, genérico) con boca que se mueve con la voz. Origen en los pies; mide unos 820 px (usa `escala` 0.7 abajo a la izquierda: x 225, y 1975). | `pose` (`quieto`, `saluda`, `senala`, `pulgar`, `presenta`, `celebra`), `habla` (true = boca con la voz), `mira` (−1 a 1), `colores` ({"pelo", "piel", "camiseta", "pantalon"…}), `cinta` (true), `mechon` (true) |
| `grupo` | Varias piezas (`hijos`) juntas, con `recorte` opcional [x, y, w, h] y `fondo`. | `hijos`, `recorte`, `fondo` |

## Textos
| Pieza | Qué es | Opciones (valor por defecto) |
| --- | --- | --- |
| `etiqueta` | Etiqueta de papel con chincheta (lugares, nombres, fechas). | `texto`, `tam` (44), `fondo` (crema), `color` (tinta), `chincheta` (true) |
| `sello` | Sello de tinta (ERROR, CULPABLE, APROBADO…). Entra con `"desde": "golpe"`. | `texto`, `tam` (90), `color` (rojo) |
| `contador` | Número grande que rueda de `de` a `a` entre `t0` y `t1`. | `de` (0), `a` (100), `t0`, `t1`, `sufijo` (" %", " €"…), `tam` (200), `color` (amarillo) |
| `titulo` | Texto grande con contorno. | `texto`, `tam` (120), `color` (crema), `trazo` (tinta) |
| `caja_palabra` | La palabra para comentar, en caja grande de color. | `texto`, `tam` (190) |
| `tachado` | Píldora con texto que se tacha; anima `tacha` de 0 a 1. | `texto`, `tam` (64), `tacha` (0) |
| `insignia` | Círculo de color con un número (pasos 1, 2, 3). | `texto`, `r` (90) |

## Una pieza nueva
Si la historia necesita un objeto que no está (un barco, una bombilla…), añádelo en `scripts/papel.py` de tu copia, junto a las demás:
```python
@pieza("bombilla")
def p_bombilla(cv, P, ctx):
    """Bombilla que se enciende con 'luz' de 0 a 1. Origen en el centro del cristal."""
    sombra_capa(cv, (-90, -110, 180, 260))                      # abre la sombra de papel
    circ(cv, 0, 0, 80, pp(P.get("color", "crema"), ctx=ctx, semilla=900))
    rr(cv, -40, 70, 80, 70, 10, pp("gris2", ctx=ctx, semilla=901))
    cv.restore()                                              # cierra la sombra
    circ(cv, 0, 0, 60, pp("amarillo", P.get("luz", 0), ctx=ctx, semilla=902))
```
- `pp(color, alfa, ctx=ctx, semilla=n)` es el papel con el filo recortado que tiembla (usa una semilla distinta para cada trozo).
- `rr` (rectángulo redondeado), `circ`, `poli` (polígono) y `texto` dibujan; `sombra_capa(cv, caja)` … `cv.restore()` les pone la sombra corta.
- Formas planas y pocas: 3 a 8 trozos por objeto, sin degradados. Nada de copiar logos ni personajes de otros.
