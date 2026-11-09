# anuncio-animado · guía rápida

## Qué es
Una skill para Claude que hace **anuncios animados de unos 10 segundos** para tu app, tu marca o tu negocio, con el estilo de los anuncios de motion graphics de las apps grandes: fondo blanco, tu color, trazos que cruzan la pantalla, una mascota que salta y habla, un móvil que gira en 3D con tu app, una tarjeta que entra volando y tu logo al final, con desenfoque de movimiento como en After Effects. También tiene un estilo «clásico», con fondos de color y escenas a tu gusto.

Le enseñas un anuncio que te guste (o se lo describes) y te hace **uno con el mismo ritmo, pero con tu marca**: tus colores, tu nombre, tus textos y una mascota propia dibujada con código. Te da:
- un **vídeo MP4** (vertical para Reels, TikTok y Shorts, u horizontal o cuadrado);
- una **página HTML** que reproduce el anuncio en bucle, para tu web o para enseñarlo;
- una **portada** en PNG.

Sin After Effects ni programas de pago: todo se dibuja con código.

## Qué necesitas
- Un plan de pago de Claude (**Pro, Max, Team o Enterprise**): las skills no están en el plan gratuito (según la ayuda oficial de Claude, consultada el 31-10-2026). La skill es gratis.
- La **ejecución de código activada** (Ajustes → Capacidades) y con acceso a internet: la primera vez instala lo que necesita con npm.
- El nombre de tu marca y, si los tienes, tus colores y tu logo (PNG o SVG).

## Cómo se instala
1. En Claude, activa la ejecución de código (Ajustes → Capacidades → Ejecución de código).
2. Personalizar → Skills → + → **Subir una skill**, y sube el ZIP tal cual (sin descomprimir).
3. Abre un chat nuevo y escribe lo de abajo.

## Un ejemplo para probarla
> Usa la skill anuncio-animado y haz el anuncio de ejemplo.

En un par de minutos te da el anuncio de una app inventada de idiomas (Charlo), el mismo del vídeo. Después, el tuyo:
> Usa la skill anuncio-animado. Quiero un anuncio de 10 s en vertical para [tu app o negocio, en una frase]. Mis colores son [colores]. Te paso un anuncio que me gusta.

Si el chat no te deja subir el vídeo del anuncio que te gusta, mándale 4–8 capturas o descríbeselo plano a plano. Te enseñará una hoja con un fotograma de cada escena antes de hacer el vídeo, para que cambies lo que quieras.

## Si algo falla
- **«Read-only file system» o «Permission denied»:** dile «copia la skill a una carpeta de trabajo como dice SKILL.md» (hay que copiarla con `chmod -R u+w`).
- **No puede instalar nada (error 403 o sin red):** revisa que la ejecución de código tenga acceso a internet y pídele que repita la comprobación.
- **El vídeo se corta a medias:** pídele que repita el mismo comando; sigue donde iba.
- **Un texto no cabe:** pídele que lo acorte o que baje el tamaño de esa escena.
- Más casos en `referencias/problemas.md`.

## Ojo con las marcas
Del anuncio que te guste se copia **el ritmo y la estructura**, no su logo, su mascota, sus textos ni su música: son de otra marca. Usa solo tu logo y música que tengas derecho a usar (en redes, mejor la de la biblioteca de la app).

## Licencias
- Código de la skill: MIT (`LICENSE`). Puedes usarlo y modificarlo para tus anuncios.
- Letras Fredoka y Poppins: SIL Open Font License, instaladas desde npm con @fontsource.
- Navegador sin pantalla: playwright-core (Apache 2.0) y, si hace falta, @sparticuz/chromium (MIT; Chromium, licencia BSD).
- Las mascotas, los iconos y la app de ejemplo están dibujados por código para esta skill.

---
Hecha por **@elbecariodemurphy.ia** · versión 1.1
