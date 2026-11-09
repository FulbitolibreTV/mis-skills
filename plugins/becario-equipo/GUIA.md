# Guía rápida · becario-equipo v1.3

## Qué es
Un **plugin** (un paquete que añade comandos a Claude Code) que hace que Claude trabaje como un equipo con método:
1. Primero el plan.
2. Después las pruebas y el código.
3. Luego una revisión.
4. Al final, apunta lo aprendido para no repetir errores.

Todo en español.

## Qué necesitas
- **Claude Code**, la versión de Claude que trabaja dentro de las carpetas de tu ordenador. Está en los planes Pro y Max, o en un plan de empresa que lo incluya. La primera vez te pedirá iniciar sesión con tu cuenta de Claude.
- **Versión 2.1.273 o posterior,** que es desde la que llegan a Claude Code los plugins subidos a tu cuenta. Mírala con `claude --version`.
- **Para el ejemplo de abajo,** Python 3. Compruébalo con `python3 --version` (en Windows, `python --version`). Si no lo tienes, haz el ejemplo en el lenguaje que uses: el plugin vale para cualquiera.

## Cómo se instala (2 minutos)
1. Descarga el ZIP. **No lo descomprimas.**
2. Entra en Claude (web o app de escritorio) → **Personalizar** → **Plugins** → **Añadir** → **Subir plugin** y elige `becario-equipo-v1.3.zip`.
3. Abre la **terminal** (el programa donde se escriben órdenes), entra en la carpeta de tu proyecto con `cd ruta/de/tu/proyecto` y escribe `claude`. Si Claude Code ya estaba abierto, escribe `/reload-plugins` para que cargue el plugin.
4. Escribe `/becario-equipo:` y deberían salir los 5 comandos.

**Otra forma, sin subirlo a la cuenta** (solo para esta opción sí se descomprime): descomprime el ZIP y arranca Claude Code con `claude --plugin-dir ruta/a/becario-equipo`. Solo dura esa sesión.

**Avisos normales la primera vez:**
- Claude Code te preguntará si **confías en la carpeta**. Di que sí si es tu proyecto.
- Te pedirá **permiso** para crear archivos o ejecutar programas (por ejemplo, `python3`). Lee qué va a hacer y acepta si es dentro de tu carpeta.

## Pruébalo con este ejemplo
1. En la terminal, crea una carpeta vacía y entra en ella: `mkdir prueba-equipo` y después `cd prueba-equipo`.
2. Escribe `claude`.
3. Pega esto:

```
/becario-equipo:equipo nivel 3 crea en Python una función que convierta una duración en texto, como "1 h 5 min", a minutos, con sus pruebas
```

Qué verás:
- **Un plan corto en el chat.** En el nivel 1 se guarda en el archivo `PLAN-equipo.md`; en los niveles 2 y 3 va en el chat.
- **Las pruebas,** cada una fallando antes de escribir el código, y después todas en verde. Si alguna es de protección y pasaba desde el principio, te lo dice.
- **El informe del revisor,** con «Arreglar ya», «Mejor arreglarlo» y «Opcional».
- **Los arreglos,** cada uno con su prueba.
- **Al final, una sola respuesta:** el resumen, el informe de la revisión tal cual, lo pendiente y, si hace falta, una lista numerada con lo que necesita que le digas. La última pregunta es si guarda las lecciones; en un proyecto recién creado lo normal es que no haya ninguna.

## Los comandos
- **`/becario-equipo:equipo`:** te pregunta el nivel (1, 2, 3 o solo revisar) y hace el trabajo. También puedes pedirlo con tus palabras: «usa el equipo en nivel 2 para añadir el login».
- **`/becario-equipo:planificar`** (nivel 1): siempre deja `PLAN-equipo.md` con el objetivo, los pasos, las pruebas y los riesgos. Si algo no está claro, elige lo más simple, lo apunta como suposición y te pregunta después. No toca el código.
- **`/becario-equipo:construir`** (nivel 2): en cada paso, primero la prueba (que tiene que fallar), luego el código mínimo, y todas las pruebas otra vez.
- **`/becario-equipo:revisar`:** revisa lo que has cambiado. Si no hay cambios, revisa los archivos que le digas (`/becario-equipo:revisar carrito.py`) o los del proyecto si son pocos. Ejecuta las pruebas si las hay y te pregunta antes de arreglar.
- **`/becario-equipo:aprender`:** propone lecciones de la sesión y las guarda si dices que sí.

Si encuentra fallos que no son de lo que le has pedido, te avisa y te pregunta; no los arregla por su cuenta.

## En el chat de Claude (sin Claude Code)
Pídelo con tus palabras, por ejemplo «usa el equipo para revisar este código», y pega o sube el código. Funciona el método, pero no el revisor aparte, porque en el chat no hay subagentes: la revisión la hace la misma conversación. Para ejecutar las pruebas en el chat hace falta la ejecución de código activada (en Ajustes de Claude). Los comandos con `/` pueden aparecer también en el menú del chat.

## Qué lee y qué guarda
- **Lee** los archivos de tu proyecto y ejecuta tus pruebas.
- **Está hecho para escribir solo en tu proyecto:** tu código y tus pruebas, `PLAN-equipo.md` y `.claude/rules/lecciones-equipo.md`. Este último tiene como mucho 30 lecciones, para que no se coma la memoria de trabajo de Claude, y Claude Code lo carga solo al abrir cada sesión.
- **Pregunta antes de** instalar algo, borrar archivos, conectarse a internet, guardar cambios en git (commit) o subirlos (push), o salir de la carpeta del proyecto.
- **Ojo:** esto son instrucciones para Claude, no un candado. Lo que sí está garantizado es que el revisor solo puede leer y que Claude Code te pide permiso según tu configuración.
- No trae ganchos (programas que se ejecutan solos) ni servidores.

## Lo que pesa
Claude cuenta lo que lee en **tokens** (trocitos de palabra), y eso gasta de tu límite. Medido con `claude plugin details becario-equipo` en Claude Code 2.1.312 (con el plugin ya instalado; sin instalar, `claude --plugin-dir ruta/a/becario-equipo plugin details becario-equipo`):
- **Fijo, en cada sesión:** unos 285 tokens. Es lo único que paga una sesión en la que no lo usas.
- **Cuando lo usas:**
  - El comando `equipo` añade unos 6.700 tokens a esa conversación.
  - Los otros comandos, entre 1.200 y 1.900.
  - El revisor es un ayudante aparte (un «subagente») de unos 950 tokens más lo que lea. Trabaja con el modelo Sonnet aunque tú uses otro: si usas Opus, gasta menos que él; si usas Haiku, algo más, a cambio de una revisión mejor.

## Si algo falla
- **No salen los comandos:**
  - Comprueba que el plugin está activado en Personalizar → Plugins.
  - Comprueba que Claude Code tiene la sesión iniciada con esa cuenta y que la versión es la 2.1.273 o posterior.
  - Después, escribe `/reload-plugins`.
- **No encuentra cómo ejecutar las pruebas:** dile el comando («las pruebas se ejecutan con `npm test`»). Si quieres que lo recuerde, usa `/becario-equipo:aprender`.
- **El revisor dice que no ejecuta las pruebas:** es lo normal, porque solo lee. Las pruebas las ejecuta la conversación principal y pone el resultado en el informe.
- **Quieres quitar las lecciones:** borra `.claude/rules/lecciones-equipo.md`.
- **Usas git y no quieres subir las lecciones:** git es el programa que guarda el historial de tu código, y el repositorio, la carpeta que controla. Añade esa ruta a `.gitignore`.

---
Hecho por **@elbecariodemurphy.ia** (Instagram y TikTok). Licencia MIT. No es un producto oficial de Anthropic.
