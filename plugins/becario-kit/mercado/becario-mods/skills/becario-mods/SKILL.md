---
name: becario-mods
description: Para gastar menos límite de Claude. Explica y ajusta los mods portero, vigilante y panel, revisa cómo usas Claude y Claude Code, y te ayuda a crear tu propio mod con tus palabras.
---

# becario-mods

Esta skill viene en el plugin **becario-mods** (v1.3), junto con tres mods para Claude Code. Úsala cuando la persona:
- quiera que le dure más el límite de Claude, o pregunte por qué se le acaba,
- pregunte por los mods (qué son, si están activos, cómo se cambian),
- quiera crear su propio mod.

Habla siempre en el idioma de la persona, claro y sin tecnicismos. Todo lo que necesitas está en este archivo. Las carpetas `referencias/` solo amplían; si no puedes leerlas, sigue sin ellas.

## 1. Saber dónde está la persona

| Dónde | Mods | Qué puedes hacer tú |
| --- | --- | --- |
| Chat de claude.ai o de la app (sin herramientas) | No se ejecutan | Dar los hábitos del chat (apartado 4) |
| Claude Code en la terminal o en la pestaña **Code** de la app de escritorio | Sí | Todo: comprobar los mods, ajustarlos y revisar la configuración |
| Sesiones de la app que trabajan en la nube | Si el plugin llega a esa sesión, los mods actúan, pero el panel puede no dibujarse | Usar `/consumo`, que da lo mismo en texto |

Para saber si los mods están cargados, pide a la persona que escriba `/mods`: si responde con los ajustes, están cargados. Hace falta Claude Code v2.1.287 o posterior (`claude --version`; en la app de escritorio, `/status`).

## 2. Los tres mods

- **Portero.** Cuando Claude lanza el subagente **Explore** (busca y lee; según la documentación no puede escribir ni editar archivos), lo pone a trabajar con Haiku, que gasta mucho menos que Opus. No toca ningún otro subagente. Nunca cambia el modelo de la conversación principal: cada modelo tiene su propia caché y cambiarlo obliga a releer toda la conversación sin caché.
- **Vigilante.** Si la conversación es grande (desde 50.000 tokens) y la persona vuelve cuando la caché ya ha caducado (una hora con suscripción), avisa antes de enviar y deja no enviarlo. Avisa también al volver con `/resume`, aunque se haya cerrado Claude Code. Solo mira lo que escribe la persona en Claude Code: no frena los mensajes automáticos (avisos de subagentes, tareas programadas). Además, con la caché de una hora, 5 minutos antes de que caduque recuerda que un `/compact` con la caché aún caliente sale barato.
- **Panel.** Con `/consumo`: límite de 5 horas y semanal, contexto, caché de la última petición y lo que gasta cada agente. Con `/mods panel on` se abre solo al empezar.

**Ajustes** (`/mods …`, se guardan entre sesiones):
- `portero on/off`
- `explorar haiku/sonnet/igual` (`igual` = el mismo modelo que la conversación)
- `vigilante on/off`
- `umbral 80000` (o `80k`; entre 10.000 y 1.000.000)
- `ttl 5`, `ttl 60` o `ttl auto` (la caché dura 5 minutos o 1 hora; `auto`: 60 con suscripción, 5 si la sesión no trae límites de plan)
- `recordatorio on/off` y `panel on/off`
- `/mods ayuda` explica cada ajuste

## 3. Revisión de consumo (cuando pregunten «¿por qué se me acaba el límite?»)

**En Claude Code**, haz esto en orden y explica cada hallazgo en una frase:
1. Pide a la persona que ejecute `/usage` y que te pegue lo que sale. Lee las recomendaciones: cada fila dice qué parte del uso explica. Con la tecla `f`, Claude Code aplica las que puede.
2. Mira el tamaño de los `CLAUDE.md` que se cargan siempre: `~/.claude/CLAUDE.md` y el del proyecto. Si pasan de unas 200 líneas, propón mover lo específico a skills, que solo se cargan cuando hacen falta.
3. Pide a la persona que ejecute `/mcp` y que te diga qué servidores tiene. Propón apagar los que no usa.
4. Si te deja, mira `~/.claude/settings.json` (solo leer): modelo por defecto, `effortLevel` y `env`. No cambies nada sin preguntar.
5. Da como mucho cinco hábitos del apartado 4 que encajen con lo que has visto.

**En el chat**, da los hábitos del chat (apartado 4) y explica que los mods solo funcionan en Claude Code.

No prometas porcentajes de ahorro. Si la persona quiere cifras, que compare `/consumo` antes y después.

## 4. Hábitos que hacen durar el límite

Comprobados el 28-10-2026 en support.claude.com («Usage limit best practices»), code.claude.com («Manage costs effectively» y «How Claude Code uses prompt caching») y claude.com («Choosing the right Claude model»).

**Chat:**
- Junta las preguntas relacionadas en un solo mensaje y revísalo antes de enviarlo.
- Sé concreto: las preguntas vagas obligan a ir y volver.
- Usa Proyectos para los documentos que consultas a menudo: lo que ya está en caché cuenta menos cuando se reutiliza.
- No repitas lo que ya está en la conversación; remite a ello.
- Elige modelo: Haiku es el que menos gasta, Sonnet gasta un nivel medio y Opus el que más. Guarda Opus para lo difícil.
- Mira tu consumo en Ajustes → Uso.

**Claude Code:**
- `/clear` entre tareas sin relación (usa `/rename` antes si quieres volver con `/resume`).
- `/compact` en las pausas, con la caché aún caliente. Tras una pausa larga ya no sale barato.
- Elige modelo y esfuerzo al empezar y no los cambies a mitad de tarea.
- Que el `CLAUDE.md` sea corto (menos de unas 200 líneas).
- Apaga los servidores MCP que no uses y prefiere herramientas de terminal como `gh`.
- Manda lo verboso (pruebas, registros, documentación) a subagentes con un modelo pequeño.
- Pide cosas concretas y usa el modo plan (Mayús o Shift + Tab) en las tareas grandes.
- Los agent teams gastan unas 7 veces más tokens en modo plan: solo cuando hagan falta.

## 5. Crear un mod nuevo

1. Pide que lo describa con sus palabras: qué debe pasar y cuándo («avísame cuando…», «no dejes que…», «enséñame…»).
2. Si en la sesión está la skill **plugin-authoring** (viene con Claude Code), cárgala y síguela: dice dónde se escribe el mod, cómo se prueba y cómo se activa.
3. Si no está, explica que hace falta Claude Code y da la receta de `referencias/crear-mod.md`. Si no puedes leerla, la idea es esta: una carpeta con `.claude-plugin/plugin.json` (nombre y versión), `hooks/hooks.json` (`{ "modules": ["./register.js"] }`) y `hooks/register.js`, que exporta `register(on)` y engancha eventos como `tool.call` o `prompt.submit`. Documentación: https://code.claude.com/docs/es/plugins/mods/create
4. Antes de darlo por bueno, valídalo con `claude plugin validate <carpeta>` y pruébalo con `claude --plugin-dir <carpeta>`.
5. Recuérdale que un mod corre con sus permisos: solo debe instalar mods de quien se fíe.

## 6. Si algo falla

- **`/mods` no existe:** el plugin no está cargado. Comprueba la versión y cierra y vuelve a abrir Claude Code. Si lo subió en claude.ai (Personalizar → Plugins), se descarga al arrancar Claude Code con la misma cuenta.
- **No ve el panel:** que use `/consumo`. Algunas apps no dibujan paneles (VS Code, sesiones en la nube) y, en ventanas estrechas, sale encima del cuadro de texto.
- **El portero se pasa de ahorrador** (por ejemplo, si exploras para revisar seguridad): `/mods explorar sonnet` o `/mods explorar igual`.
- **El vigilante pregunta demasiado:** `/mods umbral 100000` o `/mods vigilante off`. Si avisa con pausas cortas, `/mods ttl 60`.
- **Apagarlo:** desactivar el plugin en `/plugin` → Installed, o en Personalizar → Plugins.
- **Copió la carpeta y no puede editarla:** conserva el «solo lectura»; `chmod -R u+w <carpeta>`.
