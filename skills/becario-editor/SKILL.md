---
name: becario-editor
description: Deja montado un editor de vídeo con Claude en tu ordenador. Instala HyperFrames o Remotion, FFmpeg y Whisper, crea la carpeta Editor IA y trae los prompts para tu estilo y para editar clips.
---

# becario-editor · el editor de vídeo con Claude

Prepara el ordenador de la persona para editar vídeos hablando con Claude: comprueba e instala las herramientas, crea la carpeta **Editor IA** (`brutos`, `referencias`, `exportados`) con sus prompts y hace una prueba corta. Después, en cada sesión con esa carpeta, Claude edita siguiendo el `CLAUDE.md` que deja dentro.

Habla con la persona en su idioma, en frases cortas y sin tecnicismos. Ella no tiene que escribir ningún comando.

`SKILL_DIR` es la carpeta de esta skill (la que aparece como «Base directory» al cargarla). No escribas nada dentro de ella: las herramientas van a `~/.becario-editor` (en Windows, `%USERPROFILE%\.becario-editor`) y el editor, a la carpeta que elija la persona.

## 0. Comprueba dónde estás
Tiene que ser una sesión **local** en el ordenador de la persona (app de escritorio de Claude → pestaña Code → entorno Local), en Windows o Mac (en Linux también funciona). Si estás en un entorno en la nube o sin acceso a sus archivos, no instales nada: explícale en dos líneas que abra la app de escritorio, pestaña Code, elija Local y una carpeta (por ejemplo, Documentos), y repita la petición.

## 1. Comprueba qué falta
- **Windows:** `powershell -NoProfile -ExecutionPolicy Bypass -File "SKILL_DIR\scripts\preparar.ps1" comprobar`
- **Mac o Linux:** `bash "SKILL_DIR/scripts/preparar.sh" comprobar`

Si la persona ha pedido Remotion, añade `-Motor remotion` (Windows) o `--motor remotion` (Mac/Linux) también aquí.

Motor de montaje: **HyperFrames** por defecto (HTML + GSAP, licencia Apache 2.0). Usa **Remotion** solo si la persona lo pide o ya lo usa; avísale de su licencia: gratis para particulares, autónomos y equipos de hasta 3 personas, y de pago para empresas más grandes (remotion.dev).

## 2. Pide permiso una sola vez
Enséñale en 3-5 líneas lo que falta y lo que vas a instalar, y pide un único «sí». Tamaños aproximados: Node.js 100 MB, FFmpeg 100-200 MB, Whisper 300 MB más el modelo de voz (240 MB, se baja en la prueba), HyperFrames 130 MB más su navegador (150 MB) o Remotion 500 MB. Todo queda en su usuario, sin tocar el sistema, salvo lo que instale winget (Windows) o Homebrew (Mac) si los tiene. Dile también que HyperFrames añade sus propias skills en `~/.claude/skills` (para que Claude sepa animar con él). Si ya dio permiso en su mensaje, no vuelvas a preguntar.

## 3. Instala
- **Windows:** `powershell -NoProfile -ExecutionPolicy Bypass -File "SKILL_DIR\scripts\preparar.ps1" instalar` (añade `-Motor remotion` si toca y `-SinSkills` si no quiere las skills de HyperFrames).
- **Mac o Linux:** `bash "SKILL_DIR/scripts/preparar.sh" instalar` (`--motor remotion`, `--sin-skills`).

Puede tardar de 3 a 15 minutos: ejecútalo con el tiempo máximo de espera (10 minutos). Si se corta, **vuelve a lanzar la misma orden**: salta lo que ya está hecho. En Windows, si aparece una ventana pidiendo permiso para instalar, dile a la persona que la acepte. Si algo falla, lee `referencias/problemas.md` antes de improvisar y prueba lo que diga; no pidas a la persona que instale nada a mano salvo que no haya otra salida (y entonces dale el paso exacto).

Al terminar, el instalador deja `rutas.json` en la carpeta de herramientas y dice cuál es el **Python del editor** (`PY` a partir de ahora).

## 4. Crea la carpeta
Usa la carpeta de la sesión: `"PY" "SKILL_DIR/scripts/editor.py" carpeta "<carpeta de la sesión>"`. Crea dentro `Editor IA` (si la carpeta ya se llama así, la usa) con `brutos`, `referencias`, `exportados`, `prompts/`, `CLAUDE.md` y `.editor/` (una copia de las herramientas). No pisa nada que ya exista.

## 5. Prueba corta
`"PY" "SKILL_DIR/scripts/editor.py" prueba`. Monta un clip de 9 s con voz y silencios, quita los silencios, lo transcribe con Whisper, pone los subtítulos, renderiza una entrada animada de 2 s con el motor y deja `exportados/prueba_editor.mp4`. Tarda 1-3 minutos (la primera vez baja el modelo de voz). Si sale «CON FALLOS», arregla lo que diga con `referencias/problemas.md` y repítela.

## 6. Cierra
En 5-6 líneas: qué se ha instalado, que la prueba ha salido bien (y dónde está el vídeo) y qué hacer ahora:
1. Abrir una sesión nueva con la carpeta **Editor IA** (pestaña Code → Local → esa carpeta).
2. Poner 3-5 vídeos que le gusten en `referencias/` y usar el prompt `prompts/2-mi-estilo.md`.
3. Grabar, soltar el clip en `brutos/` y usar `prompts/3-editar-clip.md`; para cambios, hablarle normal (`prompts/4-corregir-hablando.md`).

## Otras peticiones
- «Comprueba el editor»: paso 1 y `"PY" "SKILL_DIR/scripts/editor.py" estado`; repara con el paso 3 si falta algo.
- «Cambia el motor a Remotion/HyperFrames»: paso 3 con `--motor` (o `-Motor`) y la prueba.
- Para editar, las órdenes de `editor.py` (silencios, subtitulos, quemar, analizar, exportar) están explicadas en `plantilla/CLAUDE.md`.
