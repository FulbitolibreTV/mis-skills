---
name: kit
description: Instala y comprueba paso a paso 5 plugins para Claude Code (Playwright, Frontend Design, MemPalace, Headroom y MODS), pidiendo permiso antes de cada uno.
disable-model-invocation: true
argument-hint: "[comprobar | deshacer | 1,2,3,4,5]"
---

# Kit del becario · instalar 5 plugins paso a paso

Hablas en español claro, de tú, con frases cortas. La persona puede no saber programar: explica cada paso en una línea antes de hacerlo y di qué ha pasado después. Nunca digas que algo funciona si no lo has comprobado con un comando.

Lo que ha escrito la persona después de `/kit`: $ARGUMENTS

- Vacío: haz el recorrido completo (pasos 0 a 3).
- `comprobar`: haz solo el paso 0 y el paso 3 (no instales nada).
- `deshacer`: ve directo a «Deshacer» al final.
- Números (por ejemplo `1,3`): haz el paso 0 y luego instala solo esos plugins, sin preguntar cuáles.

La carpeta de este plugin es `${CLAUDE_PLUGIN_ROOT}`.

## Los 5 plugins

| # | Plugin | Qué arregla | Cómo se instala |
| --- | --- | --- | --- |
| 1 | Playwright (de Microsoft, en el directorio oficial de Anthropic) | Claude hace webs pero no las ve: con esto abre el navegador, mira la página y pulsa botones | Plugin de Claude Code |
| 2 | Frontend Design (de Anthropic) | Webs que no parecen todas la misma plantilla | Plugin de Claude Code |
| 3 | MemPalace | Cada chat empieza casi de cero: guarda la memoria del proyecto en tu ordenador | Programa (con `uv`) + plugin de su autor |
| 4 | Headroom | Recorta lo que sobra (logs, archivos) antes de mandarlo a Claude | Programa (con `uv`). Se usa abriendo Claude Code con `headroom wrap claude` |
| 5 | MODS (becario-mods) | Portero, vigilante de caché y panel `/consumo` para que dure más el límite | Viene dentro de este kit |

## Paso 0 · Mirar qué hay (sin cambiar nada)

Ejecuta estos comandos de solo lectura (en Windows, en la misma terminal de Claude Code) y guarda los resultados:

1. `claude --version` → hace falta 2.1.287 o posterior para MODS. Si el comando no existe, apúntalo: es lo normal en la pestaña Code de la app de escritorio (lleva su propia copia de Claude Code). En ese caso, en los pasos de plugins le darás a la persona los comandos `/plugin …` para que los escriba ella en el chat, uno a uno, y esperarás a que te diga que ha terminado.
2. `claude plugin list` → qué plugins tiene ya. Si alguno de los cinco ya está instalado y activo, no lo reinstales: márcalo como «ya lo tenías». Si sale `becario-mods` (con cualquier origen, por ejemplo `@synced`), MODS ya está: no instales otra copia.
3. `node --version` → Playwright necesita Node.js 18 o posterior (y `npx`, que viene con Node). Si no está, el plugin 1 se puede instalar igual, pero avisa de que no arrancará hasta que instale Node.js LTS desde nodejs.org.
4. `uv --version` → MemPalace y Headroom se instalan con `uv` (descarga su propio Python, no hace falta tener Python).
5. El sistema: `uname -s` (si falla o sale algo con MINGW o MSYS, es Windows).

Resume en 3–5 líneas qué tiene y qué le falta.

## Paso 1 · Elegir

Si no ha dado números, pregúntale cuáles quiere instalar (los cinco por defecto), con la herramienta de preguntas si la tienes. Antes, avísale en dos líneas de lo que conviene saber:
- MemPalace y Headroom son programas de terceros (licencias MIT y Apache 2.0) que se instalan en su ordenador con `uv`. Headroom ocupa unos 750 MB y tarda unos minutos.
- Headroom cambia cómo se abre Claude Code: se usa abriendo `headroom wrap claude` en la terminal. **No funciona en la pestaña Code de la app de escritorio**, solo en la terminal.

Si no puedes preguntar (por ejemplo, en `claude -p`), instala solo 1, 2 y 5, y explica cómo instalar 3 y 4 con `/kit 3,4`.

## Paso 2 · Instalar, uno a uno

Para cada plugin elegido: di en una línea qué vas a hacer, ejecuta el comando (Claude Code le pedirá permiso a la persona) y comprueba el resultado con el comando de «Comprobar». Si un paso falla, dilo claro, sigue con los demás y al final da el arreglo de «Si algo falla».

### Si falta `uv` (solo para 3 y 4)
Pide permiso antes, porque descarga y ejecuta el instalador oficial de astral.sh:
- macOS o Linux: `curl -LsSf https://astral.sh/uv/install.sh | sh`
- Windows (PowerShell): `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"`

Si el instalador no se puede descargar (red de empresa, error de certificado) y tiene Python 3, la otra vía oficial es `python3 -m pip install --user uv` (en Windows, `py -m pip install --user uv`), también con permiso. Si pip contesta «externally-managed-environment», prueba `pipx install uv`; si tampoco, sáltate 3 y 4 y dile que instale uv desde docs.astral.sh.

Después, `uv --version`. Si dice que no lo encuentra, la terminal aún no lo ve: usa la ruta completa `~/.local/bin/uv` (en Windows, `$HOME/.local/bin/uv.exe`) en los comandos siguientes. Si dice que no, sáltate 3 y 4.

### 1 · Playwright
- Instalar: `claude plugin install playwright`
- Comprobar: `claude plugin list` muestra `playwright` con ✓ enabled.
- Sin `claude` en la terminal: que escriba `/plugin install playwright`.
- Avisa: la primera vez que lo use, descarga `@playwright/mcp` con npx y abre Google Chrome. Si no tiene Chrome, que lo instale o que pida a Claude «instala el navegador de Playwright».

### 2 · Frontend Design
- Instalar: `claude plugin install frontend-design`
- Comprobar: `claude plugin list` muestra `frontend-design` con ✓ enabled.
- Sin `claude` en la terminal: `/plugin install frontend-design`.
- Avisa: no hay que hacer nada más; Claude lo usa solo cuando le pides una interfaz.

### 3 · MemPalace
1. Programa: `uv tool install mempalace` → comprobar con `mempalace --version` (o `~/.local/bin/mempalace --version`). Si solo funciona con la ruta completa, ejecuta `uv tool update-shell` y avisa de que hay que cerrar y abrir la terminal.
2. Su plugin para Claude Code (lo publica su autor en GitHub, en MemPalace/mempalace):
   - `claude plugin marketplace add MemPalace/mempalace`
   - `claude plugin install --scope user mempalace@mempalace`
   - Sin `claude` en la terminal: `/plugin marketplace add MemPalace/mempalace` y luego `/plugin install mempalace@mempalace`.
3. Comprobar: `claude plugin list` muestra `mempalace` con ✓ enabled.
4. Avisa: al reiniciar Claude Code, dentro de cada proyecto se activa con `/mempalace:init`. Guarda en su ordenador, en `~/.mempalace`, resúmenes de las conversaciones (cada 15 mensajes, al cerrar y antes de compactar); según su autor, no sale nada del ordenador si no lo activa.

### 4 · Headroom
1. Programa, con el proxy y sin PyTorch (copia el comando tal cual, con los corchetes): `uv tool install --python 3.13 "headroom-ai[proxy,code,mcp]"`. Puede tardar varios minutos: ponle al comando un tiempo máximo de 10 minutos (600000 ms). Si uv avisa de que falta un «extra», no lo quites: para y dilo.
2. Comprobar: `headroom --version` (o `~/.local/bin/headroom --version`). Si solo va con la ruta completa, `uv tool update-shell` y reiniciar la terminal.
3. **No ejecutes `headroom wrap` tú**: abriría otro Claude Code dentro de este. Explica cómo se usa:
   - En la terminal, en vez de `claude`, abre `headroom wrap claude --code-memory none`. Arranca un proxy en su ordenador que recorta lo que sobra, añade a Claude Code una herramienta suya (`headroom`, para recuperar lo recortado) y abre Claude Code a través de él. Al salir, los ajustes de Claude Code vuelven a como estaban; el proxy y esa herramienta siguen hasta `headroom unwrap claude`.
   - Según sus autores, ahorra un 20 % de tokens programando (más en JSON y logs repetidos; casi nada en texto normal).
   - Por defecto manda a Headroom Labs contadores anónimos (cuántos tokens ahorra, sin el contenido). Para apagarlo: `DO_NOT_TRACK=1` antes del comando (en PowerShell, `$env:DO_NOT_TRACK=1`).
   - Si al abrirlo da un error de inicio de sesión o de conexión: cerrarlo, `headroom unwrap claude` y abrir Claude Code normal.

### 5 · MODS
Si `claude plugin list` ya muestra `becario-mods`, está hecho: no instales otra copia.

Si no:
1. Copia la carpeta del kit a un sitio fijo (Claude Code la lee de ahí, así que no hay que borrarla):
   - Dos comandos separados (no los juntes con `&&`, así el permiso que pide Claude Code es más claro): `mkdir -p ~/.becario-kit/mercado` y después `cp -R "${CLAUDE_PLUGIN_ROOT}/mercado/." ~/.becario-kit/mercado/`
   - En PowerShell: `New-Item -ItemType Directory -Force "$HOME\.becario-kit\mercado" | Out-Null; Copy-Item -Recurse -Force "${CLAUDE_PLUGIN_ROOT}\mercado\*" "$HOME\.becario-kit\mercado\"`
   - Comprueba que existe `~/.becario-kit/mercado/.claude-plugin/marketplace.json`.
   - Si la copia no se puede hacer (permiso denegado o error), **no** añadas el marketplace desde `${CLAUDE_PLUGIN_ROOT}`: esa carpeta cambia al actualizar el kit y MODS dejaría de cargar. Para aquí, marca MODS como pendiente y dale los tres comandos de este paso (copiar, añadir, instalar) para que los ejecute ella.
2. `claude plugin marketplace add ~/.becario-kit/mercado` (si dice que ya existe, sigue).
3. `claude plugin install becario-mods@becario-kit`
4. Sin `claude` en la terminal: haz tú el paso 1 y que escriba `/plugin marketplace add ~/.becario-kit/mercado` (con su ruta completa de inicio, por ejemplo `C:/Users/Nombre/.becario-kit/mercado`) y `/plugin install becario-mods@becario-kit`.
5. Comprobar: `claude plugin list` muestra `becario-mods` con ✓ enabled. Avisa: necesita Claude Code 2.1.287 o posterior; los paneles se ven en la terminal y en la pestaña Code, y `/consumo` también contesta en texto.

## Paso 3 · Resumen final (siempre en texto)

Vuelve a ejecutar `claude plugin list` (y `mempalace --version` y `headroom --version` si tocaba) y termina con una tabla:

| # | Plugin | Estado | Para probarlo |
| --- | --- | --- | --- |
| 1 | Playwright | ✅ / ⏭️ ya lo tenías / ❌ (motivo) | «Abre example.com y dime qué pone» |
| 2 | Frontend Design | … | «Hazme una página de inicio para mi panadería» |
| 3 | MemPalace | … | `/mempalace:init` dentro de tu proyecto |
| 4 | Headroom | … | `headroom wrap claude --code-memory none` en la terminal |
| 5 | MODS | … | `/consumo` |

Después, en una línea: **cierra Claude Code y vuelve a abrirlo** para que cargue los plugins nuevos. Y en otra: para deshacer cualquiera, `/kit deshacer`.

## Si algo falla
- `claude: command not found` → estás en la app de escritorio: usa los comandos `/plugin …` de cada paso.
- `Plugin "…" not found in marketplace` → `claude plugin marketplace update` y repetir. Si sigue, `/plugin` → pestaña de descubrir, y buscarlo por el nombre.
- `uv`, `mempalace` o `headroom` «no se encuentra» justo después de instalar → ruta completa `~/.local/bin/…`, `uv tool update-shell` y reiniciar la terminal.
- Headroom tarda mucho o se corta → repetir el mismo comando (uv retoma lo descargado).
- Playwright no abre el navegador → instalar Google Chrome o Node.js LTS.

## Deshacer
Enseña solo lo que la persona tenga instalado, pregunta qué quiere quitar y ejecuta solo eso:
- Playwright: `claude plugin uninstall playwright`
- Frontend Design: `claude plugin uninstall frontend-design`
- MemPalace: `claude plugin uninstall mempalace` · `claude plugin marketplace remove mempalace` · `uv tool uninstall mempalace`. Su memoria sigue en `~/.mempalace`: no la borres tú; dile dónde está por si quiere borrarla ella.
- Headroom: `headroom unwrap claude` · `uv tool uninstall headroom-ai`
- MODS: `claude plugin uninstall becario-mods@becario-kit` · `claude plugin marketplace remove becario-kit`. La carpeta `~/.becario-kit` la puede borrar ella después.
