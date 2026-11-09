# Cambios

## v1.3 (28-10-2026)
Arreglos de la tercera tanda de pruebas:
- **Final del nivel 3 en un orden fijo:** resumen corto, el informe de la revisión tal cual (con lo que se hizo con cada punto), lo pendiente y una sola lista numerada de preguntas. La línea de pruebas sale una vez y la pregunta de las lecciones va la última.
- **El aviso de «en Claude Code rinde más» solo sale en el chat** (se colaba en Claude Code).
- **Formato del revisor más estricto:** rutas dentro del proyecto, grupos vacíos sin viñetas y sin secciones de más.
- **Plan:** sección nueva «Preguntas para ti», y cada fallo previo una sola vez. `planificar` cierra con el plan y sus preguntas (ya no habla de pruebas ejecutadas).
- **Pruebas:** las de protección que pasan desde el principio se permiten, avisando. En Python se ejecutan sin dejar `__pycache__`.
- **Lecciones:** un fallo que se va a corregir no es una lección; ejemplo nuevo del comando exacto que encuentra las pruebas.
- Coste medido: unos 285 tokens fijos por sesión; unos 6.700 al usar `equipo`.
- **Guía:** comando exacto de `plugin details`, qué supone el revisor con Sonnet según tu modelo y lo de internet igual en la guía, el README y las skills.

## v1.2 (28-10-2026)
Arreglos de la segunda tanda de pruebas:
- **Planificar siempre deja el plan:** si algo no está claro, elige lo más simple, lo apunta como suposición y pregunta después. Antes, con una petición poco concreta, hacía 3 preguntas y no dejaba `PLAN-equipo.md`.
- **Fallos fuera del encargo:** se avisan y se preguntan, no se arreglan solos. Van aparte en el informe («Fuera del encargo»), y el resumen ya no dice que todo está cumplido si uno de esos fallos afecta al resultado.
- **El revisor va en primer plano** (`background: false`) y se espera su informe: una sola respuesta final. En el nivel 3, el informe se enseña tal cual en el resumen.
- **En «solo revisar»,** Claude ejecuta las pruebas y pone el resultado real en el informe, y el informe hace de resumen.
- **Lecciones:** cada una necesita una prueba de la sesión; nada de «no hay X» sin comprobarlo; la pregunta para guardarlas es literal.
- **En el chat:** sus instrucciones van al principio, se ignora `$ARGUMENTS` si aparece tal cual y el aviso de Claude Code va al final.
- **Cada comando lleva solo sus normas** (`planificar` y `revisar` ya no hablan de pruebas en verde) y los bloques se nombran en vez de numerarse.
- **Guía para principiantes:** qué es cada cosa (plugin, terminal, tokens, git), los avisos de la primera vez (confiar en la carpeta, permisos), cómo se usa en el chat, y «Lo que pesa», al final.
- **README:** aclara que las normas son instrucciones para Claude, no un candado.

## v1.1 (28-10-2026)
Arreglos de lo que encontraron las primeras pruebas con personas que no conocían el plugin:
- **Cada comando lleva su método completo dentro.** En la v1.0 mandaban leer archivos de referencia del plugin, y en Claude Code esas lecturas pedían permiso o se denegaban, así que el método quedaba a medias.
- **Nuevo modo «solo revisar»** en `equipo` (también en el chat).
- **`revisar`:** si no hay cambios o git falla, revisa los archivos que le digas o los del proyecto. Al revisor se le pasan los cambios, y se espera su informe antes de seguir (antes salían dos resúmenes con cifras distintas).
- Mismo formato de informe en la skill y en el revisor (la línea de pruebas la rellena la conversación principal), con criterio para «mejor arreglarlo».
- **Lecciones:** solo lo propio del proyecto (nada de rutas de tu ordenador ni conocimiento general), frase fija para preguntar antes de guardar, máximo 30 sin contar la cabecera, y una nota sobre git.
- **En el chat,** si no has pegado el código, lo pide.
- La descripción de `equipo` es más concreta, para que no salte sola con cualquier «arregla esto».
- **Guía:** Python para el ejemplo, cómo abrir Claude Code, los avisos de permiso, lo que pesa al usarlo y que el revisor trabaja con Sonnet.
- Coste fijo medido: unos 285 tokens por sesión.

## v1.0 (28-10-2026)
- Primera versión: skill `equipo` con tres niveles (planificar, programar con pruebas y completo), los comandos `planificar`, `construir`, `revisar` y `aprender`, el subagente `revisor` (solo lectura) y las lecciones en `.claude/rules/lecciones-equipo.md`.
- Coste medido con `claude plugin details` (Claude Code 2.1.312): unos 283 tokens por sesión.
