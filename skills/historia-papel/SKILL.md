---
name: historia-papel
description: Vídeos verticales que cuentan una historia real en papel recortado animado con código, con voz o sin ella y dos finales. Úsala si piden contar una historia, anécdota o hecho en vídeo estilo papel.
---

# historia-papel

Convierte una historia (real, de tu empresa, una anécdota…) en un vídeo vertical de 1080×1920 hecho de **papel recortado animado**: una escena por frase, objetos de papel con sombra corta y filo que tiembla como en stop motion, manos que entran desde abajo y actúan, cámara que se acerca despacio, barridos de franjas de papel y las palabras clave en tiras. Todo se dibuja con código (skia-python + ffmpeg): no hace falta saber dibujar ni programar.

Lo que hace el usuario: contar la historia, aprobar el guion y, si quiere, grabar la voz. Lo demás lo haces tú con esta skill.

## 0. Preparar (una vez por conversación)
La carpeta de la skill es de solo lectura: cópiala y trabaja en la copia. Si no sabes dónde está, búscala: `find / -name SKILL.md -path "*historia-papel*" 2>/dev/null | head -1`.
```bash
cp -r "<carpeta de este SKILL.md>" ~/historia-papel && chmod -R u+w ~/historia-papel
cd ~/historia-papel && python3 scripts/comprobar.py
```
`comprobar.py` instala lo que falte (skia-python, numpy, pillow) y termina en `TODO LISTO`. Si falla, mira `referencias/problemas.md`.

Para probar que todo va: `mkdir -p proyectos && cp -r ejemplo proyectos/bug && python3 scripts/render.py proyectos/bug --muestra` (10–15 s).

## 1. La historia
Si el usuario no lo ha dicho ya, pregúntale en un solo mensaje (con opciones y una recomendada):
- **qué historia** y para qué tema o público (si solo da un tema, propón 2–3 historias reales que encajen);
- **duración**: 40–90 s (unas 4–5 frases cada 15 s; por defecto, unos 60 s);
- **voz**: la graba él (o la genera con una herramienta de voz) y te la pasa, o sin voz;
- **final**: la palabra para que la gente comente y si quiere **dos finales** (por ejemplo, Instagram «Comenta PALABRA…» y TikTok «Sígueme y escríbeme PALABRA por privado»), uno solo o ninguno.

**Datos reales y comprobados.** Si tienes búsqueda web, comprueba cada dato (fechas, cifras, nombres) en fuentes fiables y apúntalas en `"fuentes"`. Lo que no se pueda comprobar se quita o se dice como tal («según…»). No inventes cifras ni citas. Sin búsqueda web, usa solo datos que sepas con seguridad y dile al usuario cuáles conviene que compruebe antes de publicar.

## 2. El guion
- Una frase = una escena, de 8 a 20 palabras, que se entienda al oírla.
- **Gancho** en la frase 1: el dato más raro o concreto, sin rodeos.
- Marca con `**…**` 1 o 2 grupos de palabras clave por frase: salen en tiras de papel.
- Cambios de parte (contexto → giro → desenlace → lección) con `"barrido": true`.
- Enséñale el guion (solo las frases) y espera su visto bueno antes de construir. Si va a grabar la voz, que lo haga con este texto final.

## 3. Las escenas: historia.json
Crea `proyectos/<nombre>/historia.json` (formato completo en `referencias/historia.md`, piezas en `referencias/piezas.md`; el ejemplo está en `ejemplo/historia.json`). Para cada frase:
- un `decorado` (mesa, escritorio, pared, pasillo, cielo, corcho, liso);
- de 3 a 7 `piezas`: un objeto central que cuente la idea y algo que **actúe en la palabra clave** con un tiempo `"@palabra"` (un sello que golpea, una puerta que se abre, un contador que rueda, un brazo que entra desde abajo);
- las tres zonas vivas: arriba (etiqueta, lámpara que parpadea), centro (el objeto) y abajo (brazo, taza, tiras);
- colores que se vean: los fondos son oscuros (noche, morado), así que usa piezas claras (crema, beige, ocre, naranja, celeste, rojo) y textos de 44 px o más.

Si falta un objeto, añade una pieza nueva en `scripts/papel.py` (plantilla al final de `piezas.md`). No dibujes logos, mascotas ni personajes de otros, ni caricaturas de personas reales: usa `silueta`, `persona` (genérica) o una `etiqueta` con el nombre.

Comprueba el plan (rápido, sin dibujar): `python3 scripts/plan.py proyectos/<nombre>`. Arregla los errores y los avisos que dé.

## 4. La voz (si la hay)
1. Texto para grabar: `python3 scripts/plan.py proyectos/<nombre> --texto` (lo guarda en `voz/texto_para_leer.txt`). Se graba **en una sola toma**: la historia y después cada final, en orden, con una pausa corta antes de cada uno.
2. Con el audio del usuario: `python3 scripts/alinear.py proyectos/<nombre> --voz <audio>`. Recorta pausas largas, iguala el volumen (−14 LUFS), reconoce cada palabra con Whisper (la primera vez baja el modelo, unos 240 MB) y prepara una voz por final. Si dice menos del 80 % de palabras reconocidas, el texto no coincide con lo grabado: corrígelo.
3. Si después cambias el texto de una frase, hay que volver a grabar y alinear. Cambiar piezas o tiempos no.

Sin voz, sáltate este paso: los tiempos se estiman y el vídeo lleva solo efectos.

## 5. Muestra antes del vídeo entero
```bash
python3 scripts/render.py proyectos/<nombre> --muestra            # hoja de miniaturas + 6 s (10–15 s)
python3 scripts/render.py proyectos/<nombre> --muestra --desde 20  # otro trozo
```
Mira `salida/muestra_hoja.jpg` (una miniatura por escena: una sola imagen, no fotogramas sueltos) y arregla lo que se pise o se vea vacío. Enséñale `salida/muestra.mp4` al usuario y ajusta lo que pida.

## 6. El vídeo
```bash
python3 scripts/render.py proyectos/<nombre>
```
- Sale un vídeo por final en `salida/` (`<titulo>_<final>.mp4`), con voz, efectos de sonido hechos con código y la voz siempre por encima.
- Va por trozos: si dice `PARADO`, **ejecuta el mismo comando otra vez** hasta que acabe. Lo dibujado se guarda y el cuerpo se dibuja una sola vez para todos los finales. Un minuto de vídeo tarda entre 3 y 7 min con 2 núcleos (`--borrador` lo hace a media resolución, unas 5 veces más rápido).

## 7. Revisar y entregar
1. Ritmo: `python3 scripts/ritmo.py salida/<vídeo>.mp4` (con `--por-zona`, más exigente). Si avisa de tramos quietos, añade movimiento en esa escena y vuelve a renderizar (solo se redibujan los trozos que cambian).
2. Portada: `python3 scripts/portada.py proyectos/<nombre>` (1080×1920, el título dentro del recorte 3:4 del centro; `--t` cambia el fondo).
3. Entrega al usuario los vídeos y la portada, y un texto para la descripción con las fuentes. Recuérdale marcarlo como contenido generado con IA si la red social lo pide.

## Archivos
- `scripts/plan.py` historia.json → planes · `scripts/render.py` muestra y vídeos · `scripts/alinear.py` voz · `scripts/portada.py` · `scripts/ritmo.py` · `scripts/comprobar.py`
- `scripts/papel.py` motor y piezas · `scripts/sonidos.py` efectos sintetizados
- `referencias/` historia.md, piezas.md, problemas.md · `ejemplo/historia.json`
