# Hábitos que hacen durar el límite

Comprobados el 28-10-2026 en fuentes oficiales:
- support.claude.com, «Usage limit best practices»
- code.claude.com, «Manage costs effectively» y «How Claude Code uses prompt caching»
- claude.com/resources, «Choosing the right Claude model»

## Chat (claude.ai y la app)
1. **Junta las preguntas relacionadas en un solo mensaje** y revisa el mensaje antes de enviarlo, para no tener que aclararlo después.
2. **Sé concreto:** las preguntas vagas obligan a ir y volver.
3. **Usa Proyectos para lo que consultas muchas veces:** sube los documentos al conocimiento del proyecto. Lo que ya está en caché cuenta menos cuando se reutiliza; tras un rato sin usarlo, la caché caduca y vuelve a contar entero.
4. **No repitas lo que ya está en la conversación:** remite a ello («lo del mensaje anterior»).
5. **Elige el modelo:** Haiku es el que menos límite gasta, Sonnet gasta un nivel medio y Opus el que más. Guarda Opus para lo difícil.
6. **Mira tu consumo** en Ajustes → Uso: tienes barras de la sesión y de la semana.

## Claude Code
1. **`/clear` entre tareas que no tienen nada que ver.** El contexto viejo se paga en cada mensaje. Usa `/rename` antes si quieres volver luego con `/resume`.
2. **`/compact` en las pausas naturales,** con la caché aún caliente: así lee la conversación desde la caché y cuesta una fracción. Tras una pausa larga, ya no sale barato.
3. **Elige modelo y esfuerzo al empezar y no los cambies a mitad de tarea:** cambiar de modelo obliga a releer todo sin caché. Sonnet vale para la mayoría del código; Opus, para lo difícil.
4. **Que el `CLAUDE.md` sea corto** (menos de unas 200 líneas). Lo específico, a skills, que solo se cargan cuando hacen falta.
5. **Apaga los servidores MCP que no uses** (`/mcp`) y usa herramientas de terminal (como `gh`) cuando las haya.
6. **Manda lo verboso a subagentes** (pruebas, registros largos, documentación), con un modelo pequeño. Es lo que hace el portero.
7. **Pide cosas concretas:** «mejora este proyecto» hace que lo lea todo.
8. **Usa el modo plan (Mayús o Shift + Tab) en las tareas grandes** y corrige pronto con Esc o `/rewind`.
9. **`/usage`:** enseña qué parte de tu uso se va en skills, subagentes, plugins y MCP, y propone cambios (pulsa `f` para que Claude Code aplique los que pueda).
10. **Los agent teams gastan mucho más:** en modo plan, unas 7 veces más tokens. Úsalos solo cuando hagan falta, con equipos pequeños.
