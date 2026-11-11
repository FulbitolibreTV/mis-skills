# Ejemplos hechos con esta skill

Cada carpeta es un vídeo terminado y publicado. Trae `script.json` (la voz), `scene.js` (sus objetos), `shots.js` (sus planos) y a veces `captions.json`. Para reutilizar uno: copia `engine/template` a una carpeta nueva, pon encima estos archivos (`scene.js` y `shots.js` van en `web/`), cambia el guion y sigue los pasos de `SKILL.md` desde la voz.

| Carpeta | Formato | Qué enseña |
|---|---|---|
| `aviones` | Cómo funciona / cifras | avión dibujado, termómetro, cubos de pintura, indicador de combustible, `hookTitle` |
| `precios99` | Cómo funciona (psicología) | etiqueta de precio `priceTag`, vestido, barras `bars` |
| `velocidad` | Cifras / comparación | carretera, coche, velocímetro `speedo`, lluvia, gasolinera; la cuenta en pantalla |
| `trafico` | Cómo funciona con simulación | coches con luces de freno, carretera, glorieta con modelo de tráfico real (atasco fantasma) |
| `toros` | Mito | toro, capa, retina (cómo ve), persona, cara enfadada |
| `afeitarte` | Mito (cuerpo humano) | piel en macro, pelo, cuchilla, barbilla |
| `pie` | Cuerpo humano | cerebro, pierna, nervio, alfileres |
| `verguenza` | Cuerpo humano (cerebro) | cerebro, persona, micrófono, escáner; estudio con universidad y año |
| `dedos` | Cuerpo humano (piel) | dedo gigante que se arruga en el agua, corte de la yema con vasos que se cierran, cerebro con nervio, dibujo de llanta, canicas y cuenco, cronómetro; portada sin repetir el `hookTitle` |
| `chamba` | Humor «Día 1 vs Día 30» | despertador, cama, nevera, dinero; el mismo personaje y `pill('DÍA 1')` |
| `insumergible` | Historia / relato | transatlántico, buque de guerra, iceberg, bote, mina, hélice, bajo el agua, la protagonista |
| `yamaguchi` | Historia / relato | pueblo, explosión, tren, oficina, ingeniero |
| `elecciones` | Noticias explicadas | Capitolio, escaños, estados, ley, sello, dinero, lupa, calendario |
| `inmigrantes` | Noticias explicadas | Capitolio dibujado, furgoneta, dinero, lupa, carpeta, escudo de derechos; guion neutral |
| `gta6` | Noticias de videojuegos | ciudad de neón, palmeras, caja de juego, consolas, disco que se llena, coche |
| `mexico` | Historia con FOTOS REALES | `photoBg`, `photoCard`, `docSheet`, mapas en tarjeta; fotos con `tools/fotos.py` (la lista y las licencias están en `CREDITOS.txt`) |
| `dron_edicion` | Editar un vídeo grabado | no es un vídeo dibujado: `build.py` corta al ritmo, corrige color, pasa a vertical 1080x1920 y mezcla; `music.py` hace la música (sin derechos); `titles.js` hace los textos de entrada y salida |
| `estilo_mapa_brasil` | Estilo `mapa` (historia de territorios) | «¿Por qué en Brasil hablan portugués?»: `mapa.js` hecho con `tools/mapa.py -95 -58 5 45`, línea de Tordesillas, países que se pintan, barcos, banderas, muñequitos |
| `estilo_tech_tresredes` | Estilo `tech` (IA, apps, tutoriales) | móviles con un vídeo dibujado, ventana con el guion que se escribe, `techBig('10', 'mb')`, chips con check y cursor |
| `estilo_neon_escalera` | Estilo `neon` (metáfora de la vida) | escalera con niveles, el protagonista sube, cae y una persona le sostiene con una cuerda; abrazo y corazones al final |

Para volver a bajar las fotos de `mexico`: `python -I engine/tools/fotos.py <carpeta> oro "File:Gold nugget (placer gold) (California, USA) (16839560358).jpg" ...` con los nombres de `CREDITOS.txt`.
