# Cambios

## v1.3 (28-10-2026)
Arreglos tras la tercera ronda de pruebas:
- **Vigilante:**
  - Al cerrar Claude Code ya no borra lo que guardaba, así que de verdad avisa al volver con `claude --resume`.
  - Ya no supone la caché de 5 minutos por mirar `/consumo` antes del primer mensaje.
  - El recordatorio no sale mientras un subagente sigue trabajando.
- **`/mods`:**
  - `ttl` acepta solo 5, 60 o auto, que es lo que dura de verdad la caché.
  - Entiende «1 000 000».
  - `portero vigilante off` ya no se come el ajuste siguiente.
  - Guarda solo lo que cambias.
- **Límites:** solo cuentan los de 5 horas y semanal.
- **Guía:**
  - Opción B más fácil: arrastrar la carpeta a la terminal para escribir su ruta.
  - Enlace para instalar Claude Code.
  - Cuenta de claude.ai para la opción A.
  - Seguridad más exacta.
- 21 pruebas automáticas.

## v1.2 (28-10-2026)
Arreglos tras la segunda ronda de pruebas:
- **Portero, más seguro:** solo cambia el modelo del subagente Explore, que según la documentación no puede escribir ni editar archivos. Ya no intenta adivinar qué encargos de otros subagentes son «fáciles»: en las pruebas, las listas de palabras fallaban con las tildes («bórralo», «corrígelo») y llegó a mandar a Haiku un encargo que borraba una línea. Se quita el ajuste `faciles`.
- **Vigilante:**
  - Tras `/compact` (también el automático) y `/clear` borra lo que guardaba, así que ya no hay falsas alarmas.
  - Solo vigila mensajes escritos por una persona.
  - Los comandos se reconocen sin adivinar.
  - Si la sesión no trae límites de plan, supone 5 minutos de caché.
  - Las pausas largas se cuentan en días.
  - Guarda las conversaciones usadas más recientemente.
- **`/consumo`:** recuerda la conversación al reanudarla.
- **`/mods ayuda`:** explica cada ajuste. Entiende «12,5k», «80 000» y «80 mil».
- **Guía:** cómo abrir la terminal en Windows y Mac, aviso de que la opción B dura una sesión, WSL, y qué hace ya Claude Code por su cuenta.
- 19 pruebas automáticas.

## v1.1 (28-10-2026)
Arreglos tras la primera ronda de pruebas con Claude que no conocían el proyecto:
- **Portero:** solo abarata los subagentes que miran. Si el encargo corrige, edita, escribe, crea, ejecuta o prueba algo, no lo toca, y revisa el encargo entero. No hace nada con modelos que no conoce. «Plantilla» ya no cuenta como «plan».
- **Vigilante:** olvida la conversación anterior tras `/clear`, `/resume` o `/compact` (antes avisaba en falso). Recuerda cada conversación, así que también avisa al volver otro día con `/resume`. Sin datos del plan supone 60 minutos de caché, no 5. Las rutas pegadas que empiezan por `/` ya se vigilan.
- **Panel:** ya no se abre solo (`/consumo` o `/mods panel on`).
- **`/mods`:** entiende `80.000`, `80k`, «apagado» o «encendido», avisa si falta el valor y pone límites razonables.
- **Números en español:** porcentajes redondeados, punto de miles, «1 petición».
- **Guía:** palabras explicadas, tabla de ajustes, pasos para Windows y Mac, solo lectura y seguridad más exacta.
- **Vigilante, además:** no frena los mensajes automáticos (avisos de subagentes en segundo plano, tareas programadas, otros plugins).
- **Portero, además:** también deja en su modelo los encargos de seguridad, fallos y tests, y los subagentes reanudados.
- **Skill:** lleva dentro los hábitos y las soluciones, para no depender de leer otros archivos.
- **`/mods ayuda`.** Al apagar el vigilante, se cancela el recordatorio pendiente.
- Icono del plugin.
- 18 pruebas automáticas.

## v1.0 (28-10-2026)
- Primera versión. Mods: portero (subagentes fáciles a Haiku), vigilante (aviso de caché caducada y recordatorio de `/compact`) y panel (límites, contexto, caché y agentes; `/consumo`).
- Ajustes con `/mods`, guardados entre sesiones.
- Skill `becario-mods`: revisión de consumo, hábitos comprobados en fuentes oficiales y receta para crear mods.
- 10 pruebas automáticas (`claude plugin test`) y una prueba real con `claude -p` (Explore pasó a Haiku).
