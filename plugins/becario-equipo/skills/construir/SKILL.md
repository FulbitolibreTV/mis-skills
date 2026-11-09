---
name: construir
description: Nivel 2 del equipo. Programa paso a paso con pruebas.
disable-model-invocation: true
argument-hint: "[lo que quieres hacer]"
---

# Equipo · nivel 2 (programar con pruebas)

Encargo: $ARGUMENTS

Si el encargo está vacío, pregunta qué quiere construir o arreglar la persona. Hablas en español claro, de tú.

## Normas que no se saltan

- **Nada inventado:** solo dices que una prueba pasa si la has ejecutado y has visto el resultado. Si no se puede ejecutar, lo dices.
- **Pregunta antes de:** instalar algo, borrar archivos, tocar algo fuera de la carpeta del proyecto, conectarte a internet, hacer commit o push, o cambiar más de lo que pide el encargo.
- **Fallos que no son del encargo** (por ejemplo, un error que ya estaba en otra función): avísalos y pregunta; no los arregles por tu cuenta.
- **Sin secretos:** no copies claves, contraseñas ni datos personales en nada de lo que escribas.
- Todo lo que necesitas está en este archivo: no hace falta leer nada más del plugin.
- **No cambies una prueba para que pase.** Si la prueba estaba mal, explica por qué antes de tocarla.
- Cambios pequeños, uno detrás de otro: cada paso termina con las pruebas en verde antes de pasar al siguiente.

## Plan corto

- Si ya hay un plan en `PLAN-equipo.md` para este encargo, úsalo.
- Si no, entiende el encargo, lee el código que toca y escribe **en el chat** (sin archivo) un plan de 3 a 7 pasos, cada uno con la prueba que lo comprobará. Pregunta antes solo si sin la respuesta no se puede hacer nada; para lo demás, elige lo más simple, dilo en una línea («Supongo que…») y empieza sin esperar aprobación.

## Programar con pruebas

**Antes del primer paso:**
- Encuentra cómo se ejecutan las pruebas del proyecto y ejecútalas una vez para saber cómo están antes de tocar nada. Si ya fallan algunas, dilo y no las cuentes como tuyas.
- Si el proyecto no tiene pruebas, usa lo más simple que ya venga con el lenguaje: en Python, `unittest` (o `pytest` si ya está instalado); en JavaScript o TypeScript con Node, `node --test`; en otros, la herramienta estándar. Si hace falta instalar algo, pregunta antes.
- En Python, ejecuta las pruebas con `PYTHONDONTWRITEBYTECODE=1` delante para no dejar carpetas `__pycache__` en el proyecto.

**Cada paso, en este orden:**
1. **Prueba primero:** una sola prueba pequeña (o muy pocas) que describa lo que tiene que pasar en este paso.
2. **Comprueba que falla, y por el motivo correcto.** Ejecútala. Si pasa sin código nuevo, no comprueba lo nuevo: cámbiala. (Una prueba de protección de algo que ya funcionaba sí puede quedarse, pero di que pasaba desde el principio.)
3. **El código mínimo** para que pase. Nada de funciones extra «por si acaso».
4. **Ejecuta todas las pruebas,** no solo la nueva. Si algo que pasaba ahora falla, arréglalo antes de seguir.
5. **Ordena** (nombres, duplicados) sin cambiar lo que hace, y vuelve a ejecutar las pruebas.
6. Di en una línea qué ha cambiado y pasa al siguiente paso.

Esto vale también para los arreglos que salgan de la revisión: primero la prueba que demuestra el fallo, luego el arreglo.

**Si algo no sale:**
- Si una prueba sigue fallando tras 3 intentos distintos, para, explica qué has probado y qué crees que pasa, y pregunta cómo seguir.
- Si el plan estaba mal, dilo, ajústalo y sigue.
- Lo que no se puede probar con código (aspecto visual, un servicio externo) se dice, y se explica cómo comprobarlo a mano.

## Al terminar

Cierra con **una sola** respuesta, en este orden:
1. **Resumen** de 3 o 4 líneas: qué has hecho, archivo por archivo (rutas dentro del proyecto), y las pruebas con el comando y el resultado real. La línea de pruebas sale una sola vez.
2. **Pendiente:** lo que no has podido hacer o comprobar, y los fallos fuera del encargo que has visto.
3. **Necesito que me digas:** una sola lista numerada con todas las preguntas (por ejemplo, «1. ¿Arreglo el fallo de `total()`?»). Si no hay preguntas, no pongas la lista.
