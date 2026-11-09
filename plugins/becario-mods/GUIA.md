# becario-mods v1.3 · Guía rápida

Tres **mods para Claude Code** que hacen que te dure más el límite de uso, y una skill que revisa cómo usas Claude (también en el chat) y te ayuda a crear tus propios mods.
Hecho por @elbecariodemurphy.ia · 28-10-2026.

## Palabras raras, explicadas
- **Claude Code:** la versión de Claude que trabaja con archivos y programas en tu ordenador o computadora. Se usa en la **terminal** (la ventana negra donde se escriben órdenes) o en la pestaña **Code** de la app de escritorio de Claude. No es el chat normal.
- **Mod:** una pieza que se le añade a Claude Code y cambia cómo funciona, como los mods de los videojuegos.
- **Subagente:** un ayudante que Claude lanza para una parte de la tarea (por ejemplo, buscar en tus carpetas).
- **Haiku, Sonnet y Opus:** los modelos de Claude. Haiku es el que menos límite gasta y Opus, el que más.
- **Token:** un trocito de palabra. El límite se mide en tokens.
- **Contexto:** todo lo que Claude tiene delante en la conversación. Se vuelve a leer en cada mensaje.
- **Caché:** una memoria temporal que hace que releer la conversación cueste mucho menos. Caduca si no escribes en un rato (una hora con suscripción; 5 minutos con créditos de uso o con API).
- **`/compact`:** resume la conversación para que ocupe menos. **`/clear`:** empieza una conversación nueva desde cero.

## Qué trae
- **Portero:** cuando Claude lanza su subagente **Explore** (el que busca y lee archivos para entender un proyecto), lo pone a trabajar con Haiku, que gasta mucho menos que Opus. Según la documentación oficial, Explore no puede escribir ni editar archivos, así que el ahorro no pone en riesgo tu trabajo. No toca ningún otro subagente ni el modelo de tu conversación, porque cambiarlo obligaría a releerla entera sin caché.
- **Vigilante:** si vuelves a una conversación grande cuando su caché ya ha caducado, te avisa antes de enviar y te deja no enviarlo. Funciona también si cerraste Claude Code y vuelves a la misma conversación con `/resume` o `claude --resume`. Solo mira lo que escribes en Claude Code: los mensajes automáticos (avisos de subagentes en segundo plano, tareas programadas) pasan sin preguntar. Además, con la caché de una hora, 5 minutos antes de que caduque te recuerda que un `/compact` en ese momento sale barato (con la de 5 minutos no hay recordatorio: no daría tiempo).
- **Panel:** tu límite de 5 horas y el semanal, el contexto, la caché y lo que gasta cada agente. Escribe `/consumo` cuando quieras verlo (o `/mods panel on` para que se abra solo).
- **Skill `becario-mods`:** pídele «revisa por qué se me acaba el límite» o «hazme un mod que…». Funciona en el chat y en Claude Code.

## Qué necesitas
- Para los **mods**, **Claude Code**:
  - La versión 2.1.287 o posterior, en la terminal o en la pestaña Code de la app de escritorio. Mírala con `claude --version` (terminal) o `/status` (app).
  - Claude Code viene en los planes Pro y Max (y en Team y Enterprise). Si aún no lo tienes, la guía oficial de instalación está en https://code.claude.com/docs/es/setup. La pestaña Code ya viene en la app de escritorio de Claude.
- La **skill** funciona también en el chat normal. Ahí no hay mods.

## Cómo se instala
**Opción A, desde claude.ai o la app (la más fácil, y se queda instalado):**
1. Descarga `becario-mods-v1.3.zip`. Si tu navegador lo descomprime solo (Safari en Mac lo hace), vuelve a comprimir la carpeta `becario-mods`: clic derecho → Comprimir.
2. Ve a **Personalizar → Plugins → Añadir → Subir plugin** (en inglés: Customize → Plugins → Add → Upload plugin) y elige el ZIP.
3. Abre Claude Code **con tu cuenta de claude.ai** (la misma en la que subiste el plugin). El plugin se descarga solo al arrancar. Si ya lo tenías abierto, ciérralo y vuelve a abrirlo, o escribe `/reload-plugins`. Con una clave de API o con un proveedor en la nube (Bedrock y similares), los plugins de tu cuenta no se descargan: usa la opción B.

**Opción B, desde la terminal (solo para probarlo, dura una sesión):**
1. Descomprime el ZIP. En Windows, «Extraer todo» crea una carpeta de más: entra hasta la carpeta que se llama `becario-mods` y que tiene dentro `GUIA.md`.
2. Abre la terminal en la carpeta donde quieras trabajar con Claude (tu proyecto). En Windows: entra en esa carpeta, clic derecho en un hueco → «Abrir en Terminal». En Mac: abre la app Terminal, escribe `cd ` (con un espacio), arrastra esa carpeta a la ventana y pulsa Intro.
3. Escribe `claude --plugin-dir ` (con un espacio al final), arrastra la carpeta `becario-mods` (la que tiene `GUIA.md`) a la ventana para que se escriba su ruta, y pulsa Intro.
4. Cada vez que abras Claude Code tendrás que volver a escribirlo. Para tenerlo siempre, usa la opción A.

## Pruébalo
1. Escribe `/mods`. Si te enseña los ajustes, los mods están activos.
2. Pide algo que use un subagente, por ejemplo: «usa el subagente Explore para listar los archivos de esta carpeta». Verás una línea gris: «portero: … → haiku». (Si tu conversación ya usa Haiku, no sale nada: no hay nada que abaratar.)
3. Escribe `/consumo` para ver tu límite, el contexto y la caché.

## Ajustes (`/mods …`, se guardan entre sesiones)
| Ajuste | Qué hace | Cuándo tocarlo |
| --- | --- | --- |
| `portero on/off` | Enciende o apaga el portero | Si quieres que todos los subagentes usen tu modelo |
| `explorar haiku/sonnet/igual` | Modelo del subagente Explore (`igual` = el mismo que tu conversación) | Si Haiku se queda corto explorando proyectos enormes o revisando seguridad |
| `vigilante on/off` | Enciende o apaga el aviso de caché caducada | Si no quieres avisos |
| `umbral 80000` | A partir de cuántos tokens avisa (entre 10.000 y 1.000.000; vale `80k`) | Si avisa demasiado, súbelo |
| `ttl 5`, `ttl 60` o `ttl auto` | Cuánto dura la caché: 5 minutos o 1 hora (`auto`: 60 con suscripción, 5 si tu sesión no trae límites de plan) | Si el aviso no acierta (por ejemplo, si usas una clave de API con la caché de 1 hora, que se activa con el ajuste `promptCacheTtl` de Claude Code) |
| `recordatorio on/off` | Aviso 5 minutos antes de que caduque la caché | Si te molesta |
| `panel on/off` | Abrir el panel solo al empezar | Si quieres verlo siempre |

## Si falla
- **`/mods` no existe:** el plugin no está cargado.
  - Comprueba la versión de Claude Code: `claude --version` en la terminal, o `/status` en la app de escritorio.
  - Si lo instalaste con la opción A, comprueba que entraste con tu cuenta de claude.ai y escribe `/reload-plugins` (o cierra y vuelve a abrir). Si usas la opción B, arranca otra vez con `claude --plugin-dir ` y la carpeta `becario-mods` arrastrada.
  - En las sesiones WSL de la app de escritorio no hay plugins.
- **No ves el panel:** algunas apps no lo dibujan (por ejemplo, las sesiones en la nube) y en ventanas estrechas puede salir encima del cuadro de texto. Usa `/consumo`, que te da lo mismo en texto.
- **Los límites de 5 h y semanal salen vacíos:** solo aparecen con suscripción, cuando el servidor los manda.
- **Copiaste la carpeta del plugin y no te deja editarla ni borrarla:** la copia conserva el «solo lectura». En la terminal: `chmod -R u+w becario-mods`. En Windows: Propiedades → desmarca «Solo lectura».
- **Quiero apagarlo:** desactiva el plugin en `/plugin` (en la terminal) o en Personalizar → Plugins.

Más ayuda: pregúntale a la skill («usa la skill becario-mods: …»).

## Lo que Claude Code ya hace solo (y conviene saber)
- `/usage` enseña en la línea «Prompt cache (main)» si tu caché está caliente o fría, y recomienda cosas como compactar antes de irte.
- En la terminal, con la caché de una hora, Claude Code puede compactar solo una conversación parada poco antes de que caduque.
- El vigilante te sirve sobre todo en la app de escritorio, al volver con `/resume` y para verlo todo de un vistazo con `/consumo`.

## Seguridad
Un mod es código que corre en tu ordenador o computadora con tus permisos.
- **Qué lee:** el uso de Claude (tokens, límites, caché), de dónde viene cada mensaje (tú o un aviso automático) y el tipo de cada subagente. Del registro del portero solo se queda el título corto de cada encargo. No lee el texto de tus mensajes.
- **Qué guarda:** tus ajustes y la hora y el tamaño de tus últimas conversaciones, en el almacén de Claude Code.
- **Qué no hace:** no abre tus archivos, no ejecuta programas, no se conecta a internet y no manda nada a nadie.

Si sabes usar la terminal, `claude plugin validate ./becario-mods` lo confirma: en la línea `calls:` no aparece `$.fs` (archivos), `$.process` (programas) ni `$.http` (internet).

## Licencia
MIT. Úsalo y cámbialo como quieras.
