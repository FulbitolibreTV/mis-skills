# Los mods de becario-mods v1.3

Funcionan en Claude Code desde la v2.1.287 (terminal o pestaña Code de la app de escritorio). Comprobado en la documentación oficial el 28-10-2026: https://code.claude.com/docs/es/plugins/mods/overview

## Portero
- **Cuándo actúa:** cada vez que Claude va a lanzar un subagente.
- **Qué hace:**
  - Al subagente **Explore** (explorar código y carpetas) lo manda a `haiku`. Explore usa por defecto el mismo modelo que la conversación, que en Pro y Max es Opus. Según la documentación oficial, Explore solo tiene herramientas de lectura y no puede escribir ni editar archivos.
  - No toca ningún otro subagente. En la v1.0 y la v1.1 intentaba adivinar qué encargos de general-purpose eran «fáciles» con listas de palabras, y en las pruebas falló: mandó a Haiku encargos que editaban o borraban.
- **Qué no hace nunca:**
  - Cambiar el modelo de la conversación principal (eso relee todo sin caché).
  - Subir de modelo.
  - Tocar un subagente al que ya se le eligió un modelo.
  - Tocar nada si el modelo de tu conversación no es Haiku, Sonnet, Opus ni Fable (por ejemplo, un modelo propio de una empresa).
- **Lo que se ve:** una línea gris «portero: «tarea» → haiku».
- **Ajustes:** `/mods portero off` · `/mods explorar haiku|sonnet|igual`. Si exploras para auditar seguridad o un proyecto enorme, `explorar sonnet`.
- **Medido el 28-10-2026** (Opus como modelo principal, una búsqueda con Explore, precios de lista): la parte del subagente costó 0,0019 $ con Haiku frente a unos 0,031 $ con Opus. Es un solo ejemplo, no una media.

## Vigilante
- **La caché:** Claude Code reenvía la conversación entera en cada mensaje y la caché evita pagarla entera otra vez. Esa caché caduca si no hay actividad: una hora en la conversación principal con suscripción y dentro del límite del plan, y 5 minutos con créditos de uso o con API.
- **Aviso al volver:** si la conversación supera el umbral (50.000 tokens por defecto) y ha pasado más tiempo que la vida de la caché, antes de enviar pregunta. Recuerda la hora y el tamaño de cada conversación, así que también avisa si cerraste Claude Code y vuelves a ella con `/resume` o `claude --resume` (comprobado: la conversación reanudada conserva su identificador). Tras `/compact` (también la automática) borra lo que guardaba de esa conversación. Tras `/clear` empieza de cero con la conversación nueva. Solo vigila lo que escribes en Claude Code; los comandos (`/algo`) y los mensajes automáticos (avisos de subagentes, tareas programadas, otros plugins) pasan sin preguntar. Las opciones:
  - «Enviar igual»
  - «No enviar» (el mensaje no se manda; consejo: `/clear`, que no cuesta nada, y pegar un resumen corto)
- **Recordatorio:** con la caché de una hora, 5 minutos antes de que caduque, un aviso recuerda que un `/compact` hecho ahora sale barato, porque lee la conversación desde la caché. No sale si un subagente sigue trabajando, ni con la caché de 5 minutos.
- **Ajustes:** `/mods vigilante off` · `/mods umbral 80000` (o `80k`, `80.000`; entre 10.000 y 1.000.000) · `/mods ttl 5`, `/mods ttl 60` o `/mods ttl auto` · `/mods recordatorio off`.
- **Ojo:** el mod supone 60 minutos de caché si tu sesión trae límites de plan (suscripción) y 5 si no los trae (API o pasarela) o si ya has gastado el 100 % de tu límite (créditos de uso). Si no acierta, fíjala con `/mods ttl`. La duración real la decide Claude Code (ajuste oficial `promptCacheTtl`).

## Panel
- **Dónde aparece:** escribe `/consumo` y se abre al lado de la conversación (terminal y pestaña Code); en ventanas estrechas puede salir encima del cuadro de texto. Donde no se puede dibujar, `/consumo` devuelve lo mismo en texto. Con `/mods panel on` se abre solo al empezar.
- **Qué enseña:**
  - El límite de 5 horas y el semanal, en %, si los da tu plan.
  - Si no, el coste estimado de la sesión.
  - El contexto usado.
  - La última petición: modelo, tokens de entrada y qué parte vino de la caché.
  - Cada agente: modelo, peticiones y tokens de entrada y salida.
  - Las últimas decisiones del portero.
  - Si la caché está caliente o fría.
- **Línea de estado:** `ctx 62 % · caché 98 % · 5 h 41 %`.
