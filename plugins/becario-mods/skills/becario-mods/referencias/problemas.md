# Si algo falla

- **`/mods` y `/consumo` no existen.**
  - Los mods no están cargados.
  - En la terminal, mira `/plugin` → Installed.
  - Si subiste el plugin en claude.ai (Personalizar → Plugins), Claude Code lo descarga al arrancar con tu cuenta. Si ya estaba abierto, ciérralo y vuelve a abrirlo.
  - Hace falta Claude Code v2.1.287 o posterior: `claude --version` en la terminal, `/status` en la app de escritorio.
- **No veo el panel.**
  - El panel no se abre solo: escribe `/consumo` (o `/mods panel on`).
  - Algunas superficies no dibujan paneles (`claude -p`, las sesiones en la nube). Ahí `/consumo` da lo mismo en texto.
  - En terminales estrechas el panel sale encima del cuadro de texto, no al lado.
- **El panel no enseña los límites de 5 h ni el semanal.** Solo aparecen cuando la respuesta del servidor los trae, que pasa con suscripción. Con API verás el coste estimado.
- **El portero mandó a Haiku algo que necesitaba más nivel.**
  - El portero solo toca el subagente Explore. Si te quedas corto, `/mods explorar sonnet` o `/mods explorar igual`.
  - También puedes pedir a Claude que lance ese subagente con un modelo concreto: el portero respeta el modelo que ya viene elegido.
- **El vigilante pregunta demasiado.** Sube el umbral (`/mods umbral 100000`) o apágalo (`/mods vigilante off`).
- **El vigilante avisa con poco tiempo de pausa:** quizá cree que usas créditos de uso (caché de 5 min). Fija la duración con `/mods ttl 60`.
- **Copié la carpeta del plugin y no me deja editarla ni borrarla:** la copia conserva el «solo lectura»; `chmod -R u+w <carpeta>`.
- **Quiero apagar el plugin:** desactívalo en `/plugin` → Installed, o en Personalizar → Plugins. (`"disableAllHooks": true` en `~/.claude/settings.json` apaga los mods de todos los plugins, y además tus hooks y tu línea de estado.)
