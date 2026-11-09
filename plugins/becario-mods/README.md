# becario-mods

Tres mods para Claude Code que ayudan a que te dure más el límite de uso, y una skill en español.

- **Portero:** pone el subagente Explore (busca y lee; no puede editar archivos) a trabajar con Haiku, sin tocar ningún otro subagente ni el modelo de tu conversación, para no perder la caché.
- **Vigilante:** avisa antes de enviar un mensaje que releería sin caché una conversación grande, y recuerda hacer `/compact` antes de que la caché caduque.
- **Panel:** enseña tu límite de 5 horas y el semanal, el contexto, la caché de la última petición y lo que gasta cada agente (`/consumo`).
- **Skill `becario-mods`:** revisa cómo usas Claude y te ayuda a crear tus propios mods.

Instalación (en claude.ai: Personalizar → Plugins → Añadir → Subir plugin; para una sesión: `claude --plugin-dir <ruta de becario-mods>`), prueba y ajustes: mira `GUIA.md`. Requiere Claude Code v2.1.287 o posterior (terminal o pestaña Code de la app de escritorio). Licencia MIT. Hecho por @elbecariodemurphy.ia.
