# Guía de instalación — Opus Video Inspiración

## Para qué sirve

Es una **skill original de dirección visual y producción de animaciones con código**, inspirada en el catálogo público de https://github.com/yihui-dev/awesome-opus5-5-videos. No descarga el catálogo completo ni genera videos mágicamente sin un motor de render. Ayuda a Claude a estudiar estilos y construir un resultado propio.

## Instalación

**Claude (Skills):** sube el ZIP `zips/opus-video-inspiracion-v1.0.0.zip` como una skill. La carpeta raíz del archivo contiene `SKILL.md` y las referencias.

**Claude Code (marketplace de este repositorio):**

```text
/plugin marketplace add FulbitolibreTV/mis-skills
/plugin install skills-video@mis-skills
```

La skill aparecerá dentro de `skills-video`. También puedes copiar `skills/opus-video-inspiracion/` a `~/.claude/skills/`.

## Pruebas de uso

- «Prepara storyboard y HTML de un reel vertical de 30 segundos sobre cómo funcionan los motores eléctricos, con animaciones tipo Canvas. No uses assets ajenos.»
- «Diseña una presentación 3D de un producto con cámara suave, etiquetas y función `window.seek(t)` para capturar fotogramas.»
- «Para mi video de 25 segundos, compara 2 direcciones visuales y elige una que se vea bien en móvil.»

**Importante:** Chrome/Playwright, FFmpeg, Remotion y Three.js se instalan solo si el proyecto que estás creando realmente los necesita. Esta skill no instala herramientas, abre cuentas ni publica contenido al subirla.

## Relación con las otras skills

- `como-funciona` → animación de procesos y explicaciones.
- `becario-reels` → guion, voz, subtítulos y montaje vertical.
- `explicador-animado` → escenas explicativas y personajes.
- `anuncio-animado` → anuncios de producto y motion graphics.
- `becario-editor` → edición y exportación en el ordenador.
- `youtube-agent` → hooks, títulos, SEO y planeación editorial (no renderiza videos).

`opus-video-inspiracion` añade dirección visual y referencias a estas herramientas; no reemplaza sus instrucciones ni motores existentes.

## Fuente y crédito

- Catálogo: [yihui-dev/awesome-opus5-5-videos](https://github.com/yihui-dev/awesome-opus5-5-videos), licencia MIT para el proyecto base.
- Cada prompt o muestra enlazada identifica su autor. Respeta sus derechos y la licencia de los materiales de terceros. No se redistribuye el catálogo de prompts dentro de este ZIP.
