# Guía de becario-kit (v1.0)

## Qué es
Un plugin para Claude Code con un comando, `/kit`, que te instala y comprueba paso a paso cinco plugins:

| # | Plugin | Qué arregla |
| --- | --- | --- |
| 1 | **Playwright** (Microsoft) | Claude hace la web pero no la ve. Con esto abre el navegador, la mira y prueba los botones. |
| 2 | **Frontend Design** (Anthropic) | Webs hechas con IA que parecen todas la misma plantilla. |
| 3 | **MemPalace** | Cada chat nuevo empieza casi de cero. Guarda la memoria de tu proyecto en tu ordenador. |
| 4 | **Headroom** | Claude se traga logs y archivos enteros. Recorta lo que sobra antes de mandarlo. |
| 5 | **MODS** (becario-mods v1.3) | Portero (búsquedas con Haiku), vigilante de la caché y panel `/consumo`. Viene dentro del kit. |

Claude te pide permiso antes de cada comando, se salta lo que ya tienes y termina con una tabla de lo que ha quedado.

## Qué necesitas
- **Claude Code** v2.1.287 o posterior, en la terminal o en la pestaña Code de la app de escritorio. Va en los planes Pro y Max de Claude. En el chat normal de claude.ai el kit no sirve: instalaría las cosas en la nube, no en tu ordenador.
- Para **Playwright**: Node.js 18 o posterior y Google Chrome.
- Para **MemPalace** y **Headroom**: `uv` (si no lo tienes, `/kit` te ofrece instalarlo con el instalador oficial). No hace falta tener Python: `uv` trae el suyo.
- Todo es gratis. Headroom ocupa unos 750 MB.

## Cómo se instala
1. Descarga el ZIP y no lo descomprimas.
2. En Claude (web o app): **Personalizar → Plugins → Añadir → Subir plugin**, y sube el ZIP.
3. Abre Claude Code con la misma cuenta, en la carpeta de un proyecto, y escribe **`/kit`**.

Si `/kit` no aparece, cierra Claude Code y vuelve a abrirlo (descarga los plugins de tu cuenta al arrancar). Si sigue sin salir, mira en `/plugin` que `becario-kit` esté activo.

## Pruébalo
- `/kit` → el recorrido completo.
- `/kit comprobar` → solo mira qué tienes instalado, sin tocar nada.
- `/kit 1,2` → instala solo Playwright y Frontend Design.
- `/kit deshacer` → quita lo que elijas.

Al terminar, **cierra Claude Code y vuelve a abrirlo**. Después:
- Playwright: «Abre example.com y dime qué pone».
- Frontend Design: «Hazme una página de inicio para mi panadería».
- MemPalace: `/mempalace:init` dentro de tu proyecto.
- Headroom: en la terminal, abre `headroom wrap claude --code-memory none` en vez de `claude`.
- MODS: `/consumo`.

## Qué lee y qué guarda cada uno
- **El kit (`/kit`)**: no lee tus archivos. Ejecuta los comandos de instalación que ves en pantalla (cada uno con tu permiso) y copia la carpeta de MODS a `~/.becario-kit/mercado`, de donde la lee Claude Code. No la borres mientras uses MODS.
- **Playwright**: abre Chrome cuando se lo pides y ve las páginas que visita. La primera vez descarga `@playwright/mcp` con npx.
- **Frontend Design**: solo son instrucciones para Claude. No ejecuta nada.
- **MemPalace**: guarda en tu ordenador (`~/.mempalace`) resúmenes de tus conversaciones de Claude Code: cada 15 mensajes, al cerrar y antes de compactar. Según su autor, no sale nada de tu ordenador si no lo activas tú. Añade a Claude 47 herramientas de memoria.
- **Headroom**: mientras lo usas, tu Claude Code habla con Anthropic a través de un proxy en tu ordenador que recorta lo repetido. Por defecto manda a Headroom Labs contadores anónimos (tokens ahorrados, nunca el contenido); para apagarlo, pon `DO_NOT_TRACK=1` antes del comando. Además añade a Claude Code una herramienta suya (`headroom`) para recuperar lo recortado, y el proxy sigue en marcha en segundo plano: `headroom unwrap claude` quita las dos cosas. Solo funciona en la terminal, no en la pestaña Code de la app de escritorio.
- **MODS**: lee los datos de consumo de tu sesión para el panel y cambia el modelo del subagente Explore (solo lectura) a Haiku. Lo puedes ajustar con `/mods`.

## Cuánto ahorra cada uno (sin inventos)
- Headroom: sus autores miden un 20 % menos de tokens en agentes de programación, más en JSON y logs repetidos, y casi nada en texto normal.
- MODS: en una búsqueda con Explore, la parte del subagente nos costó unas 16 veces menos con Haiku que con Opus (solo esa parte).
- Los demás no ahorran: hacen que Claude trabaje mejor.

## Si algo falla
- **`claude: command not found`**: estás en la pestaña Code de la app de escritorio. `/kit` te dará los comandos `/plugin …` para que los escribas tú.
- **«Plugin not found in marketplace»**: `claude plugin marketplace update` y repite `/kit`.
- **`mempalace` o `headroom` «no se encuentra»** justo después de instalar: cierra y abre la terminal (o ejecuta `uv tool update-shell`).
- **Headroom da error de inicio de sesión**: ciérralo, ejecuta `headroom unwrap claude` y abre Claude Code normal.
- **Playwright no abre el navegador**: instala Google Chrome o Node.js LTS.
- Para empezar de cero: `/kit deshacer` y luego `/kit`.

## Deshacer a mano
- Playwright: `claude plugin uninstall playwright`
- Frontend Design: `claude plugin uninstall frontend-design`
- MemPalace: `claude plugin uninstall mempalace`, `claude plugin marketplace remove mempalace` y `uv tool uninstall mempalace` (tu memoria sigue en `~/.mempalace` hasta que la borres).
- Headroom: `headroom unwrap claude` y `uv tool uninstall headroom-ai`
- MODS: `claude plugin uninstall becario-mods@becario-kit` y `claude plugin marketplace remove becario-kit`; luego puedes borrar `~/.becario-kit`.
- El kit: en `/plugin`, desactiva o quita `becario-kit`.

## De quién es cada cosa
- **becario-kit** y **becario-mods**: El Becario de Murphy IA, licencia MIT.
- **Playwright** (MCP): Microsoft, licencia Apache 2.0. Llega desde el directorio oficial de plugins de Anthropic.
- **Frontend Design**: Anthropic, en su directorio oficial de plugins.
- **MemPalace**: proyecto MemPalace (github.com/MemPalace/mempalace), licencia MIT.
- **Headroom**: Headroom Labs (github.com/headroomlabs-ai/headroom), licencia Apache 2.0.

El kit no lleva dentro el código de los cuatro primeros: los instala desde sus fuentes oficiales. Ninguno está patrocinado ni tiene relación con nosotros. Instala solo plugins de quien te fíes: se ejecutan con tus permisos.

Comandos comprobados el 31-10-2026 con Claude Code 2.1.316.

---
Hecho por **@elbecariodemurphy.ia** · Si te sirve, compártelo con alguien que use Claude Code 🧡
