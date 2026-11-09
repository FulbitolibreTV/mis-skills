# becario-equipo

Un equipo ligero para Claude Code, en español. Claude trabaja con método: **planifica, programa con pruebas, se revisa y apunta lo que aprende** para la próxima vez.

- **Tres niveles:** 1 · planificar (solo el plan), 2 · programar con pruebas, 3 · completo (pruebas, revisión y lecciones).
- **Un revisor de solo lectura**, que no puede editar ni ejecutar nada.
- **Lecciones que se recuerdan solas:** se guardan en `.claude/rules/lecciones-equipo.md`, y Claude Code carga ese archivo al abrir cada sesión.
- **Ligero:** según `claude plugin details`, añade unos 285 tokens fijos a cada sesión. Al usarlo se carga el método completo (unos 6.700 tokens con `equipo`).

## Comandos

| Comando | Qué hace |
| --- | --- |
| `/becario-equipo:equipo <idea>` | Te pregunta el nivel (1, 2, 3 o solo revisar) y hace el trabajo |
| `/becario-equipo:planificar <idea>` | Nivel 1: deja un plan en `PLAN-equipo.md` sin tocar el código |
| `/becario-equipo:construir <idea>` | Nivel 2: paso a paso, primero la prueba y luego el código |
| `/becario-equipo:revisar [archivo]` | Revisa los cambios actuales (o lo que le digas) y pregunta antes de arreglar |
| `/becario-equipo:aprender` | Propone de 0 a 3 lecciones y las guarda si dices que sí |

También puedes pedirlo con tus palabras: «usa el equipo en nivel 3 para añadir el login».

## Instalación

Lee `GUIA.md`. En resumen: Claude (web o app) → Personalizar → Plugins → Añadir → Subir plugin, y eliges este ZIP. Después abres Claude Code con la misma cuenta.

Qué lee y qué guarda: lee los archivos de tu proyecto, ejecuta tus pruebas y está hecho para escribir solo en tu proyecto (`PLAN-equipo.md`, tus archivos de código y pruebas, y `.claude/rules/lecciones-equipo.md`). No trae ganchos ni servidores, y le pide a Claude que pregunte antes de salir de la carpeta, instalar o conectarse a internet. Ojo: son instrucciones, no un candado; lo que sí está garantizado es que el revisor solo puede leer y que Claude Code te pide permiso según tu configuración.

Hecho por @elbecariodemurphy.ia · Licencia MIT.
