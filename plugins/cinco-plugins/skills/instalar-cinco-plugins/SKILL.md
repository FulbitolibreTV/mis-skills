---
name: instalar-cinco-plugins
description: >-
  Configura y comprueba cinco herramientas externas para Claude Code: Playwright,
  OmniRoute, Headroom, MemPalace y Frontend Design. Usa si la persona pide
  instalar los cinco plugins, mejorar navegación, memoria, ahorro de contexto,
  interfaces o cambiar proveedores de modelos.
disable-model-invocation: true
argument-hint: "[comprobar | deshacer | 1,2,3,4,5]"
---

# Instalar 5 plugins · asistente para Claude Code

Responde en español. Lee primero `../../GUIA.md`, relativa a esta carpeta, para las instrucciones y fuentes actualizadas. Es una guía de **integración**, no contiene las implementaciones de terceros. Nunca afirmes que un componente está instalado si no lo comprobaste en la computadora de la persona.

Interpreta `$ARGUMENTS`: vacío = ofrecer instalar los cinco; `comprobar` = solo diagnósticos; `deshacer` = mostrar desinstalación y pedir confirmación; `1,3` = seleccionar solo Playwright y Headroom, siguiendo la numeración de esta skill.

## Orden y objetivo

1. **Playwright** — navegador y pruebas de páginas. Plugin de Claude Code o servidor MCP de Microsoft.
2. **OmniRoute** — enrutador opcional de modelos; exige configurar por separado proveedores y respetar sus condiciones. Herramienta de terceros, **no** plugin oficial de Anthropic.
3. **Headroom** — compresión de contexto; ejecutable de terceros que envuelve una sesión de Claude Code.
4. **MemPalace** — memoria de proyectos; software y plugin de terceros.
5. **Frontend Design** — capacidades de diseño de interfaces desde el marketplace oficial de Claude Code.

## Reglas obligatorias

- **Primero diagnostica, después pregunta** qué instalar y explica qué cambiará. Una solicitud de instalar este kit no autoriza instalar automáticamente los cinco programas ni modificar proveedores, claves o cuentas; pide aprobación por cada herramienta.
- Detecta sistema operativo y los ejecutables `claude`, `node`, `npm` y `uv`, sin asumir Windows/WSL. Explica la diferencia entre comandos de terminal y `/plugin` dentro de Claude Code.
- Comprueba versiones y disponibilidad de `claude plugin list`, `claude mcp list` o `/plugin`, `/mcp` cuando corresponda. Si no se puede ejecutar un comando, informa de la limitación; no lo simules.
- Para Playwright y Frontend Design usa el marketplace oficial de Claude Code cuando esté disponible. Si falla un nombre, comprueba el marketplace antes de inventar un alias.
- Para OmniRoute no muestres ni solicites API keys en el chat, no las guardes en el repositorio, no configures proveedores ni modelos sin permiso y no prometas tokens gratis. Algunos proveedores restringen las herramientas de terceros.
- Para Headroom, no invoques `headroom wrap claude` desde una sesión Claude Code ya abierta. Instruye a la persona a lanzarlo en una **nueva terminal** y a deshacerlo si falla.
- Para MemPalace, advierte que puede procesar historiales y archivos del proyecto. No actives minería de conversaciones ni sincronización externa sin consentimiento explícito.
- No instales servicios, no ejecutes scripts remotos, no actualices paquetes globales ni borres archivos sin permiso. **No hagas cambios silenciosos.**
- Después de cada instalación verifica su estado, registra si fue instalada, ya existía o falló; no confundas "guía añadida al repositorio" con "programa instalado en una computadora".

## Instalación (solo después de aprobarla)

### 1. Playwright

En Claude Code: `/plugin install playwright@claude-plugins-official`.

Alternativa MCP en terminal, cuando existe Node/npx: `claude mcp add playwright npx @playwright/mcp@latest`.

Comprobar: `/plugin` o `/mcp`, según el método. Alternativas: no instales ambas automáticamente.

### 2. OmniRoute

Terminal (si Node/npm están disponibles): `npm install -g omniroute`, luego `omniroute` y consultar su panel local. Para uso posterior: `omniroute configure claude`, `omniroute run claude`. Comprueba qué versión y opciones soporta el programa instalado; las interfaces cambian.

Advierte que credenciales y modelos se configuran aparte, tras revisar términos y riesgos. Comprobar: `omniroute --version` y `omniroute doctor` (si lo soporta).

### 3. Headroom

Terminal, si `uv` está instalado: `uv tool install --python 3.13 "headroom-ai[all]"`.

Comprobar: `headroom --version`. Para usarlo, abrir una **nueva** sesión desde terminal con `headroom wrap claude`; deshacer con `headroom unwrap claude`. Puede cambiar la forma de lanzar Claude Code.

### 4. MemPalace

Terminal, con `uv`: `uv tool install mempalace`. En Claude Code: `claude plugin marketplace add MemPalace/mempalace` y, con el marketplace correcto, `claude plugin install --scope user mempalace@mempalace` (o seguir el identificador que muestre `/plugin`).

Comprobar: `mempalace --version` y `/plugin`; configurar memoria solo para el proyecto seleccionado, con permiso.

### 5. Frontend Design

Dentro de Claude Code: `/plugin install frontend-design@claude-plugins-official`.

Comprobar en `/plugin`. Prueba sugerida: «Diseña una landing accesible para una cafetería, tipografía editorial y colores sobrios».

## Comprobar

No instala nada. Resume tabla: nombre, `instalado/ya estaba/no instalado/no comprobable`, método, prueba. Una herramienta que existe en GitHub no está automáticamente instalada en la computadora.

## Deshacer

Pide permiso y desinstala **solo los componentes elegidos**. Comandos orientativos:
- Playwright: `/plugin uninstall playwright@claude-plugins-official` o `claude mcp remove playwright`, según método.
- OmniRoute: `npm uninstall -g omniroute`. No borres credenciales o configuración sin permiso adicional.
- Headroom: `headroom unwrap claude` y, si lo aprueban, `uv tool uninstall headroom-ai`.
- MemPalace: `claude plugin uninstall mempalace@mempalace` y `uv tool uninstall mempalace`. No borres memorias locales.
- Frontend Design: `/plugin uninstall frontend-design@claude-plugins-official`.

## Fuentes

Consulta `../../GUIA.md` y sus enlaces oficiales para corregir comandos si cambiaron. Al responder distingue claramente qué establece la guía, qué verificaste y qué sigue pendiente.
