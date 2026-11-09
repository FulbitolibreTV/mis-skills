# Cambios

## v1.0 (31-10-2026)
- Primera versión: comando `/kit` con el recorrido completo, `/kit comprobar`, `/kit deshacer` y `/kit 1,3` para instalar solo algunos.
- Playwright y Frontend Design se instalan desde el directorio oficial de plugins de Anthropic con `claude plugin install`.
- MemPalace: programa con `uv tool install mempalace` y su plugin desde el repositorio de su autor (MemPalace/mempalace).
- Headroom: `headroom-ai[proxy,code,mcp]` (con el proxy y sin PyTorch, unos 750 MB). Se usa con `headroom wrap claude --code-memory none` en la terminal (probado de punta a punta el 31-10-2026). No se usa el extra `lean` de su README: aún no está en la versión publicada y sin él falta el proxy.
- MODS: becario-mods v1.3 sin cambios, dentro de `mercado/`. Si ya lo tienes, no se instala otra copia.
- Comandos comprobados el 31-10-2026 con Claude Code 2.1.316, uv 0.11.32, MemPalace 3.11.0 (programa) y 3.12.0 (plugin), Headroom 0.42.0 y @playwright/mcp 0.0.84.
