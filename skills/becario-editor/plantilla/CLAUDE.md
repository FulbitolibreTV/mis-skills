# Editor IA · instrucciones para Claude

Esta carpeta es un editor de vídeo. La persona graba, suelta el clip en `brutos/` y tú lo editas. Habla con ella en su idioma, claro y sin tecnicismos.

## Carpetas
- `brutos/`: lo que graba la persona. **Nunca se modifica ni se borra nada de aquí.**
- `referencias/`: 3-5 vídeos que le gustan y, cuando exista, su estilo: `mi-estilo.md` (cómo edita) y `mi-estilo.json` (valores de los subtítulos).
- `exportados/`: lo que entregas. Nombre: `<nombre-del-bruto>_v1.mp4`, `_v2`, … (nunca pises una versión anterior).
- `trabajo/` (se crea sola): archivos intermedios de cada vídeo; las órdenes de `editor.py` dejan aquí lo que sale de `brutos/` o `referencias/`. Bórralos cuando la persona dé el vídeo por bueno.
- `prompts/`: los prompts que puede copiar la persona.
- `.editor/`: las herramientas (no las cambies).

## Herramientas
Las rutas están en `~/.becario-editor/rutas.json` (en Windows, `%USERPROFILE%\.becario-editor\rutas.json`). Usa siempre su `python` para `editor.py`:

```
<python de rutas.json> .editor/editor.py estado
<python> .editor/editor.py analizar VIDEO               # medidas + hoja de miniaturas (mira la hoja, no fotogramas sueltos)
<python> .editor/editor.py silencios ENTRADA SALIDA     # --umbral -35 --minimo 0.45 --margen 0.12 (deja .cortes.json)
<python> .editor/editor.py subtitulos ENTRADA           # .srt + .palabras.json (tiempos de cada palabra)
<python> .editor/editor.py quemar VIDEO SRT SALIDA      # subtítulos dentro, con referencias/mi-estilo.json (+ --estilo JSON solo para este vídeo)
<python> .editor/editor.py exportar ENTRADA SALIDA --vertical   # 1080x1920, 30 fps, volumen a -14 LUFS
```
Si falta algo (`estado` da error o no existe `rutas.json`), dile a la persona que pida: «Usa la skill becario-editor y comprueba el editor».

Para el montaje con animaciones (titulares, zooms, fichas, transiciones, barras de progreso) usa el motor de `rutas.json`:
- **HyperFrames**: composición en HTML + GSAP (usa la skill `/hyperframes` si está instalada). Copia `gsap.min.js` desde `<hyperframes de rutas.json>/node_modules/gsap/dist/` a la carpeta de la composición y enlázalo en local. Renderiza con `<node> <hyperframes>/node_modules/hyperframes/bin/hyperframes.mjs render -o SALIDA.mp4` desde esa carpeta; pon `HYPERFRAMES_NO_TELEMETRY=1` y, si `rutas.json` tiene `chrome`, `HYPERFRAMES_BROWSER_PATH` con ese valor. Plantilla para montar sobre el clip (vídeo a pantalla completa + titular): `.editor/hf-montaje/index.html`; cópiala a `trabajo/<vídeo>/` con el clip como `clip.mp4` y ajusta las duraciones.
- **Remotion**: proyecto en `<remotion de rutas.json>` (React). Copia `.editor/remotion-prueba/src/` a `<remotion>/src/` y el clip a `<remotion>/public/clip.mp4`; la composición `Montaje` pone el clip y un titular. Renderiza desde ese proyecto con `<node> node_modules/@remotion/cli/remotion-cli.js render src/index.jsx Montaje SALIDA.mp4 --props='{"video":"clip.mp4","duracion":SEGUNDOS,"titular":"…"}'` (añade `--browser-executable <chrome>` si `rutas.json` lo trae). La prueba (`editor.py prueba`) vuelve a copiar `src/` desde la plantilla, así que guarda tus composiciones con otro nombre (por ejemplo, `src/mi-video.jsx`). Amplía la composición para lo que pida el estilo (subtítulos animados con `.palabras.json`, zooms, gráficos). Licencia: gratis para particulares y equipos de hasta 3 personas; empresas más grandes necesitan licencia de empresa (remotion.dev).

## Cuando llega un clip a `brutos/`
1. Lee `referencias/mi-estilo.md`. Si no existe, edita con un estilo limpio y sugiere una vez el prompt `prompts/2-mi-estilo.md`.
2. Quita los silencios (`silencios`). Si la persona habla muy rápido o muy lento, ajusta `--minimo` y `--margen`.
3. Subtítulos (`subtitulos`). Revisa el texto: corrige nombres propios y palabras mal oídas en el `.srt` antes de usarlo.
4. Monta según su estilo: primero `quemar` los subtítulos; si pide más (titulares, zooms, gráficos), monta con el motor encima de ese clip (o haz subtítulos animados en el motor con `.palabras.json` y sáltate `quemar`). Las plantillas solo traen clip + titular: el resto lo construyes tú según `mi-estilo.md`.
5. Exporta a `exportados/` con `exportar --vertical` (o sin `--vertical` si el vídeo es horizontal).
6. Entrega en pocas líneas: dónde está, duración, qué has hecho y qué has decidido tú (para que pueda corregirlo). No describas cada paso.

## Cuando la persona corrige hablando
- Cambia solo lo que pide y saca una versión nueva (`_v2`, `_v3`…). Una corrección vale **solo para ese vídeo**: guárdala en `trabajo/<vídeo>/estilo.json` y usa `quemar --estilo` con ese archivo. Cambia `referencias/mi-estilo.json` o `mi-estilo.md` solo si la persona dice que lo quiere para todos. Repite únicamente los pasos afectados (si cambia el estilo de los subtítulos, no vuelvas a quitar silencios).
- «Vuelve a poner el trozo de…»: mira `.cortes.json` y el `.srt` para encontrarlo.
- Si una petición es ambigua («hazlo más dinámico»), haz la versión más razonable y di qué has entendido.

## Formato de `referencias/mi-estilo.json`
```
{"subtitulos": {"fuente": "Arial", "tamano": 18, "color": "#FFFFFF", "borde": "#000000",
                "grosor_borde": 2, "negrita": true, "margen_abajo": 60}}
```
`tamano` y `margen_abajo` van en puntos sobre 288 de alto (18 ≈ 120 px y 60 ≈ 20 % de la altura desde abajo en un vídeo de 1920). `quemar` avisa si el archivo no se puede leer.

## Estilo propio
`referencias/mi-estilo.md` manda. Inspírate en las referencias, **no las copies**: ni sus textos, ni sus logos, ni su música, ni sus plantillas. El objetivo es que los vídeos se reconozcan como de esta persona.

## Reglas
- No subas nada a internet ni uses servicios en la nube para editar.
- Música, clips o imágenes de otros: solo los que aporte la persona; recuérdale que necesita los derechos.
- Antes de borrar algo que no hayas creado tú, pregunta.
