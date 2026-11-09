---
name: revisar
description: Revisa el código con el revisor del equipo y pregunta antes de arreglar.
disable-model-invocation: true
argument-hint: "[archivo o carpeta, opcional]"
---

# Equipo · solo revisar

Qué revisar (si está vacío, sigue «Qué se revisa»): $ARGUMENTS

Hablas en español claro, de tú. **No toques ningún archivo hasta que la persona diga que sí.**

## Normas que no se saltan

- **Nada inventado:** solo dices que una prueba pasa si la has ejecutado y has visto el resultado. Si no se puede ejecutar, lo dices.
- **Pregunta antes de:** instalar algo, borrar archivos, tocar algo fuera de la carpeta del proyecto, conectarte a internet, hacer commit o push, o cambiar más de lo que pide el encargo.
- **Fallos que no son del encargo** (por ejemplo, un error que ya estaba en otra función): avísalos y pregunta; no los arregles por tu cuenta.
- **Sin secretos:** no copies claves, contraseñas ni datos personales en nada de lo que escribas.
- Todo lo que necesitas está en este archivo: no hace falta leer nada más del plugin.

## Revisar

**Qué se revisa:**
1. Si la persona indicó algo concreto (un archivo, una carpeta, «mi carrito»), eso, entero. Si no dijo qué tiene que hacer ese código, el objetivo es «que haga lo que dicen sus nombres, comentarios y README».
2. Si no, lo que ha cambiado: en un proyecto con git, `git status` y `git diff` (y `git diff <rama principal>...` si estás en otra rama). Sin git, los archivos que has tocado en esta sesión.
3. **Si git falla o no hay cambios,** no te quedes ahí: revisa los archivos de código del proyecto si son pocos (hasta unos 10), o pregunta cuáles revisar si son muchos. Nunca digas «no hay nada que revisar» sin haber mirado código.

**Cómo:**
1. Si tienes el subagente `becario-equipo:revisor` (en Claude Code), pídele la revisión. En el mensaje pásale: el objetivo del encargo, la lista de archivos y **los cambios pegados** (la salida de `git diff`, si la hay), y el comando de las pruebas. El revisor solo lee: no edita ni ejecuta nada.
   - **Lánzalo en primer plano** (nunca en segundo plano) y espera su informe antes de seguir. Mientras tanto no escribas ningún resumen: tu respuesta final es una sola.
   - Si no hay subagentes (por ejemplo, en el chat de Claude), haz tú la revisión con la lista de abajo y dilo.
2. **Lista de la revisión,** en este orden:
   1. ¿Hace lo que pide el encargo? Ni menos ni más.
   2. Casos límite: datos vacíos, nulos, muy grandes, con tildes o caracteres raros, fechas y zonas horarias, números negativos o con decimales.
   3. ¿Se puede perder o romper algo? Datos que se sobrescriben, archivos que se borran, errores que se tragan sin avisar.
   4. Seguridad: claves o contraseñas en el código; datos del usuario que llegan sin comprobar a una consulta, a un comando o a una página.
   5. Pruebas: ¿hay una para cada comportamiento nuevo y para cada fallo arreglado? ¿Alguna no comprueba nada de verdad?
   6. ¿Se entiende? Nombres confusos, código repetido, funciones demasiado largas.
3. **Clasifica** cada cosa:
   - **Arreglar ya:** un fallo, datos que se pierden, seguridad, o algo que no hace lo que pide el encargo.
   - **Mejor arreglarlo:** casos que faltan por probar, entradas que el encargo no pide pero el código acepta, nombres confusos, código repetido.
   - **Opcional:** gustos y estilo.
   - Si la revisión es de un encargo concreto, lo que esté mal **fuera** de ese encargo va aparte, en «Fuera del encargo», y no se arregla sin preguntar.
4. **Las pruebas:** antes de enseñar el informe, ejecuta tú las pruebas del proyecto (si las hay y puedes) y pon el resultado real en la línea «Pruebas». El revisor no las ejecuta.
5. **El informe,** siempre con este formato:

```
Revisión · <fecha de hoy, AAAA-MM-DD>
Arreglar ya (N):
- <archivo:línea> — <qué pasa> — <cómo se arregla>
Mejor arreglarlo (N):
- ...
Opcional (N):
- ...
Fuera del encargo (N): <solo si aplica>
Pruebas: <comando → resultado real, o «no hay pruebas», o «no se han podido ejecutar»>
```

Reglas del informe: rutas dentro del proyecto (no rutas completas del ordenador); si un grupo está vacío, escribe solo `Arreglar ya (0)` sin viñetas; no añadas otras secciones. Si no encuentras nada importante, dilo así, sin inventar problemas para rellenar.

**Después del informe (solo revisar):**
- Termina con esta pregunta: «¿Arreglo lo de "Arreglar ya"? (sí / no / solo algunos)». No toques nada hasta que diga que sí.
- El informe ya es el resumen: no añadas otro.
