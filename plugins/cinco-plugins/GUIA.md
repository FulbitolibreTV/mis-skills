# Guía: cinco herramientas para Claude Code

Esta guía de integración acompaña a `cinco-plugins` y **no contiene ni redistribuye** el código de los proyectos externos. Está basada en el documento «Los 5 plugins que instalo en Claude Code» (@noisy.ia, noviembre de 2026), con las referencias a sus respectivos repositorios. Los nombres y procedimientos pueden cambiar.

## Qué se puede instalar

| # | Herramienta | Función | Origen |
|---|---|---|---|
| 1 | Playwright | Navegación y pruebas web | [Microsoft](https://github.com/microsoft/playwright-mcp) |
| 2 | OmniRoute | Proxy y enrutamiento opcional entre proveedores/modelos | [OmniRoute](https://github.com/cheaper-inference/OmniRoute) (redirección del repo de la guía) |
| 3 | Headroom | Reducir el contexto de resultados extensos | [Headroom](https://github.com/headroomlabs-ai/headroom) (redirección del repo de la guía) |
| 4 | MemPalace | Memoria de proyecto | [MemPalace](https://github.com/MemPalace/mempalace) |
| 5 | Frontend Design | Diseño de interfaces | Marketplace oficial de Claude Code |

**Una guía o un plugin instalador NO son los cinco programas instalados.** Se instalan en la computadora del usuario desde los proveedores correspondientes, previa autorización.

## Requisitos

- Claude Code. Distingue terminal (`claude ...`) de comandos dentro de Claude Code (`/plugin ...`).
- Node.js y npm/npx para Playwright MCP y OmniRoute.
- `uv` para instalar Headroom y MemPalace. En Windows usa una terminal compatible con los paquetes que vayas a instalar; revisa los requisitos de cada proyecto.
- No pongas claves API en el repositorio o en conversaciones. Respeta límites y condiciones de cada proveedor.

## Comandos sugeridos, según el PDF de referencia y repos oficiales

```text
1 Playwright       /plugin install playwright@claude-plugins-official
  alternativa MCP: claude mcp add playwright npx @playwright/mcp@latest

2 OmniRoute        npm install -g omniroute
                   omniroute
                   omniroute configure claude
                   omniroute run claude

3 Headroom         uv tool install --python 3.13 "headroom-ai[all]"
                   headroom wrap claude
                   headroom unwrap claude    # revertir envoltura

4 MemPalace        uv tool install mempalace
                   claude plugin marketplace add MemPalace/mempalace
                   claude plugin install --scope user mempalace@mempalace

5 Frontend Design  /plugin install frontend-design@claude-plugins-official
```

**Comprueba antes de instalar:** `claude --version`, `node --version`, `npm --version`, `uv --version`, `claude plugin list` y `claude mcp list` (si están disponibles). Después de cada paso repite las comprobaciones.

## Notas importantes

- Playwright y Frontend Design son integraciones del directorio oficial de Claude Code; el servidor MCP de Playwright tiene su propio repositorio de Microsoft.
- OmniRoute y Headroom son **programas externos** y pueden cambiar cómo se ejecuta Claude Code. Haz una copia de tus ajustes antes de cambiar proveedores o herramientas. Prueba uno a la vez. OmniRoute no te proporciona automáticamente acceso gratis a modelos; necesitarás cuentas compatibles y sus términos podrían restringir clientes externos.
- MemPalace administra memoria del proyecto. Revisa su documentación de privacidad y da permiso antes de procesar historiales, habilitar indexación o configurar sincronización.
- La sintaxis exacta de instalación depende de la versión y disponibilidad del marketplace. Si falla, revisa la documentación oficial; no adivines un alias.
- Este plugin se limita a guiar el proceso, solicitar autorización y verificar, no ejecuta instalaciones por sí mismo al agregarlo a GitHub.

## Procedencia

Adaptación original para `FulbitolibreTV/mis-skills`, basada en el archivo aportado por el usuario «GUIA 5 PLUGINS @noisy.ia.pdf». Créditos de la guía: @noisy.ia; idea original atribuida en el PDF a @santiremedio. La documentación propia enlaza a las fuentes oficiales y evita copiar el material original completo.
