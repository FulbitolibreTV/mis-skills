# Mis skills de Claude

Colección de skills y plugins para Claude, en español: vídeos verticales (reels, TikTok, shorts), anuncios animados, editor de vídeo y herramientas para programar con Claude Code.

## Qué hay aquí

| Carpeta | Qué contiene |
| --- | --- |
| `skills/` | Las skills, cada una en su carpeta con su `SKILL.md` |
| `plugins/` | Plugins para Claude Code (traen comandos con `/`) |
| `zips/` | Cada skill y plugin ya comprimido, listo para subir a Claude |
| `guias/` | Guías y chuletas en PDF |

## Cómo instalar una skill o plugin

**En Claude (web, app de escritorio o móvil)**

1. Ve a **Configuración → Capacidades** y activa la **ejecución de código y creación de archivos**.
2. Descarga el ZIP que quieras de la carpeta `zips/` (ábrelo en GitHub y pulsa el botón de descarga).
3. Para una **skill**: **Personalizar → Skills → + → Subir una skill** y elige el ZIP, sin descomprimirlo.
4. Para un **plugin**: **Personalizar → Plugins → Añadir → Subir plugin** y elige el ZIP.
5. Comprueba que aparece activada.

**En Claude Code (terminal)**

Copia la carpeta de la skill en `~/.claude/skills/` (en Windows, `C:\Users\TU_USUARIO\.claude\skills\`) y abre una sesión nueva. Para probar un plugin solo en una sesión:

```bash
claude --plugin-dir plugins/becario-mods
```

## Skills

Las skills no necesitan comando: se activan solas cuando pides algo que encaja. Basta con decirlo con tus palabras.

| Skill | Para qué sirve | Ejemplo de qué pedir |
| --- | --- | --- |
| `como-funciona` | Vídeos verticales dibujados con código: cómo funciona algo, mitos, cifras, historia, noticias. Voz gratis y subtítulos palabra a palabra. Estilos mapa, tech oscuro y neón | «Hazme un reel de cómo funciona un chip» |
| `como-funciona-personajes` | Parte 2 de `como-funciona`: biblioteca de personajes y referencias. No se usa sola, instálala junto a la anterior | — |
| `becario-reels` | Reels y TikToks animados: guion, voz con subtítulos, escenas, portada y dos finales (Instagram y TikTok) | «Haz un reel sobre 3 trucos de Excel» |
| `explicador-animado` | Vídeos explicativos con personajes con cara, en vertical u horizontal | «Explica la inflación en un vídeo animado» |
| `historia-papel` | Historias reales contadas en papel recortado animado | «Cuenta la historia del Titanic estilo papel» |
| `collage-historia` | Vídeos en collage de revista que aplican una historia (peli, serie, fábula) a tu tema, con tus clips | «Collage con la fábula de la tortuga y la liebre para mi negocio» |
| `mascota-cubos` | Reels con una mascota 3D de cubos, sin enseñar la cara | «Reel con mascota de cubos sobre productividad» |
| `mascota-pixel` | Reels con tu mascota en pixel art que mueve la boca con tu voz | «Reel con mi mascota pixel, aquí va mi audio» |
| `anuncio-animado` | Anuncios de unos 10 segundos para una app o negocio, estilo motion graphics. Saca MP4 y HTML | «Anuncio animado para mi app de recetas» |
| `becario-editor` | Monta un editor de vídeo con Claude en tu ordenador (HyperFrames o Remotion, FFmpeg, Whisper). Necesita la app de escritorio | «Instálame el editor de vídeo» |

Cada skill trae una `GUIA.md` con instalación, un ejemplo para probarla y qué hacer si falla.

## Plugins y sus comandos

Los plugins son para **Claude Code**. Sus comandos se escriben con `/`.

### becario-equipo

Un equipo de programación con método: planifica, programa con pruebas, revisa y apunta lo aprendido.

| Comando | Qué hace |
| --- | --- |
| `/becario-equipo:equipo <idea>` | Te pregunta el nivel (1, 2, 3 o solo revisar) y hace el trabajo |
| `/becario-equipo:planificar <idea>` | Nivel 1: deja un plan en `PLAN-equipo.md` sin tocar el código |
| `/becario-equipo:construir <idea>` | Nivel 2: paso a paso, primero la prueba y luego el código |
| `/becario-equipo:revisar [archivo]` | Revisa los cambios y pregunta antes de arreglar |
| `/becario-equipo:aprender` | Propone de 0 a 3 lecciones y las guarda si dices que sí |

También vale pedirlo con tus palabras: «usa el equipo en nivel 3 para añadir el login».

### becario-kit

| Comando | Qué hace |
| --- | --- |
| `/kit` | Instala paso a paso 5 plugins: Playwright, Frontend Design, MemPalace, Headroom y MODS. Pide permiso antes de cada uno |
| `/kit comprobar` | Solo revisa qué está instalado |
| `/kit deshacer` | Quita lo que instaló |

### becario-mods

Tres mods para que te dure más el límite de uso de Claude Code (requiere Claude Code v2.1.287 o posterior).

| Mod o comando | Qué hace |
| --- | --- |
| Portero | Pone el subagente Explore a trabajar con Haiku para gastar menos |
| Vigilante | Avisa antes de un mensaje que gastaría mucho y recuerda usar `/compact` a tiempo |
| `/consumo` | Panel con tu límite de 5 horas y semanal, el contexto, la caché y lo que gasta cada agente |
| Skill `becario-mods` | Pídele «revisa cómo uso Claude» o «ayúdame a crear un mod» |

## Comandos útiles de Claude Code

| Comando | Qué hace |
| --- | --- |
| `/help` | Lista todos los comandos |
| `/plugin` | Gestiona los plugins instalados |
| `/compact` | Resume la conversación para gastar menos |
| `/clear` | Empieza una conversación nueva |

## Guías

- `guias/guia-youtube-agent-v1.0.pdf`
- `guias/chuleta-ciudades-ia-v1.0.pdf`

## Créditos y licencias

- `como-funciona`: basada en código con licencia MIT de Artem Novitckii (ver `LICENSE-claude-animation-skills.txt` en su carpeta).
- Skills, plugins y guías «becario»: regalo de **El Becario de Murphy IA** ([@elbecariodemurphy.ia](https://www.instagram.com/elbecariodemurphy.ia/)). Los plugins y `anuncio-animado` tienen licencia MIT; el resto indica sus condiciones en su `GUIA.md`.
- Remotion (lo usan algunas skills) es gratis para particulares y empresas de hasta 3 personas; las más grandes necesitan licencia (remotion.dev/license).
