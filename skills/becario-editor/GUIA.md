# becario-editor · guía rápida

## Qué es
Una skill para Claude que te deja montado **un editor de vídeo que funciona hablando**:
- **Comprueba e instala** lo que hace falta, sin que escribas comandos: HyperFrames (o Remotion) para montar y animar, FFmpeg para cortar y exportar, y Whisper (faster-whisper) para los subtítulos. Tú solo das permiso.
- **Crea la carpeta Editor IA** con `brutos`, `referencias` y `exportados`, más un `CLAUDE.md` para que Claude sepa editar ahí.
- **Trae los prompts** para preparar el editor, aprender tu estilo (de 3 a 5 vídeos: «inspírate, no copies»), editar un clip (quitar silencios, poner subtítulos y montar) y corregir hablando.
- Al final hace **una prueba corta** y te deja un vídeo de unos 9 segundos en `exportados` para que veas que todo funciona.

Funciona en **Windows 10/11 y Mac** (también en Linux). Todo se edita en tu ordenador: no se sube nada a internet.

## Qué necesitas
- Un plan de pago de Claude (**Pro o Max**): las skills y Claude Code no están en el plan gratuito.
- La **app de escritorio de Claude** (claude.com/download), porque el editor trabaja con los archivos de tu ordenador desde la pestaña **Code**.
- Unos 1,5 GB libres y conexión a internet durante la instalación.

## Cómo se instala
1. En Claude, activa la ejecución de código (Ajustes → Capacidades → Ejecución de código).
2. Personalizar → Skills → + → **Subir una skill**, y sube el ZIP tal cual (sin descomprimir).
3. Abre la app de escritorio → pestaña **Code** → entorno **Local** → elige una carpeta (por ejemplo, Documentos) y escribe lo de abajo.

## Un ejemplo para probarla
> Usa la skill becario-editor y prepárame el editor de vídeo en esta carpeta.

Claude te dirá qué te falta, te pedirá permiso una vez, lo instalará (de 3 a 15 minutos), creará `Editor IA` y hará la prueba. Cuando termine:
1. Abre una sesión nueva con la carpeta **Editor IA**.
2. Pon de 3 a 5 vídeos que te gusten en `referencias` y pega el prompt de `prompts/2-mi-estilo.md`.
3. Graba, suelta el vídeo en `brutos` y pega `prompts/3-editar-clip.md`. Para cambiar algo, díselo normal: «haz el gancho más grande».

¿Prefieres Remotion? Añade «usa Remotion como motor». Remotion es gratis para particulares, autónomos y equipos de hasta 3 personas; las empresas más grandes necesitan su licencia de empresa (remotion.dev).

## Si algo falla
- **Claude no encuentra la skill en la pestaña Code**: comprueba que está activada en Personalizar → Skills. Si aun así no aparece, descomprime el ZIP en `~/.claude/skills/` (en Windows, `C:\Users\TU_USUARIO\.claude\skills\`) y abre una sesión nueva.
- **Se corta la instalación**: dile «sigue con la instalación»; retoma donde iba.
- **Windows pide permiso para instalar algo**: acéptalo (es winget instalando Node.js, FFmpeg o Python).
- **Los subtítulos tienen palabras mal escritas**: dile «revisa el texto de los subtítulos, se dice X, no Y».
- **Corta demasiado (o demasiado poco) los silencios**: dile «deja un poco más de pausa» o «corta más».
- Más casos en `referencias/problemas.md`.

## Qué se instala y dónde
Todo va a tu carpeta de usuario, en `.becario-editor` (Node.js, FFmpeg, Python con faster-whisper, el motor y el modelo de voz), salvo lo que instale winget en Windows o Homebrew en Mac si ya lo tienes. Si eliges HyperFrames, también añade sus skills para Claude Code en `.claude/skills`. Para quitarlo todo, borra la carpeta `.becario-editor` (y esas skills si no las quieres). Las descargas directas (Node.js portable, uv y el modelo de voz) se comprueban con su huella sha256; lo demás llega por winget, Homebrew, npm o pip.

## Licencias
- Código de esta skill: puedes usarlo y modificarlo libremente.
- HyperFrames (HeyGen): Apache 2.0. GSAP: licencia estándar gratuita de GSAP. Remotion: licencia propia (ver arriba). FFmpeg: LGPL/GPL. faster-whisper y el modelo Whisper small: MIT. Node.js: MIT. uv: MIT/Apache 2.0.
- HyperFrames envía datos de uso anónimos si no se desactiva; esta skill lo desactiva en sus llamadas (`HYPERFRAMES_NO_TELEMETRY=1`).
- La voz del clip de prueba es nuestra (generada con ElevenLabs para nuestro vídeo).

---
Hecha por **@elbecariodemurphy.ia** · versión 1.0
