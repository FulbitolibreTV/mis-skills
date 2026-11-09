# becario-reels · guía rápida

Versión 1.2 · 29-10-2026 · regalo de @elbecariodemurphy.ia

## Qué es
Una skill para Claude que hace reels y TikToks verticales (1080×1920) animados con código a partir de una sola frase: guion, voz sincronizada con subtítulos palabra a palabra, una escena animada por frase (17 tipos), efectos de sonido, portada y textos para publicar. Si lo subes a Instagram y a TikTok, puede hacer dos versiones que solo cambian en el final: «Comenta PALABRA» en Instagram y «sígueme y escríbeme por privado» en TikTok. No gasta créditos de IA de vídeo.

## Cómo se instala
1. En Claude, ve a **Configuración → Capacidades** y activa la **ejecución de código y creación de archivos** (con acceso a red al menos para los gestores de paquetes).
2. Ve a **Personalizar → Skills → + → Subir una skill** y elige `becario-reels-v1.2.zip` (sin descomprimir).
3. Comprueba que la skill aparece activada.

Funciona en todos los planes que permiten skills, también en el gratis.

## Pruébala
Escribe en un chat nuevo:
> Hazme un reel sin voz sobre 3 trucos para dormir mejor. En Instagram que comenten DORMIR y en TikTok que me sigan y me lo escriban por privado. Mi cuenta es @mi_cuenta.

Claude te enseñará el guion, una hoja con fotogramas de muestra y, al final, los dos vídeos con la portada y los textos. Un reel de 40 s tarda unos 15–20 minutos en total. Para ponerle voz, pídele el texto para ElevenLabs (o grábala tú) y súbele el audio: el final de TikTok se genera aparte, solo esa frase.

## Si algo falla
- **No instala o «no hay navegador»:** revisa que la ejecución de código tenga acceso a red para npm y abre un chat nuevo.
- **Los subtítulos no van con la voz:** el texto del guion tiene que ser exactamente lo que se oye. Dile a Claude qué frase falla.
- **El vídeo pesa demasiado:** se recomprime solo por encima de 28 MB.
- **Algo raro en un segundo concreto:** dile a Claude el segundo; puede sacar ese fotograma y arreglarlo antes de renderizar otra vez.

## Licencias
El motor de vídeo es Remotion: gratis para particulares, autónomos, organizaciones sin ánimo de lucro y empresas de hasta 3 personas; las más grandes necesitan su licencia de empresa (remotion.dev/license, consultado el 28-10-2026). Las fuentes (Manrope, Inter, Space Grotesk, DM Sans, Bricolage Grotesque, Anton, Archivo, Caveat y JetBrains Mono) tienen licencia OFL, los iconos son de Lucide (ISC) y los efectos de sonido se sintetizaron para la skill.
