---
name: anuncio-animado
description: Anuncios animados de unos 10 s para una app o negocio, al estilo motion graphics, a partir de un anuncio que te guste o de una descripción. Saca un MP4 y una página HTML en bucle.
---

# anuncio-animado

Hace anuncios cortos animados (8–12 s, en bucle) para una app, una marca o un negocio, con el estilo de los anuncios de motion graphics. Tiene dos estilos:
- **`limpio` (por defecto):** el de los anuncios de las apps grandes. Fondo blanco, un solo color de marca con sus tonos, trazos gruesos que cruzan el plano, letra redondeada, móvil 3D entre aros, tarjeta que entra volando y desenfoque de movimiento de verdad. Sigue 8 tiempos fijos (logo · pregunta con la mascota · tres palabras · «Descubre…» · móvil · dato · tarjeta · logo final que se desvanece) y de cada uno cambias los textos y cuándo empieza. Es el de `ejemplo/`.
- **`clasico`:** escenas libres (9 tipos) sobre fondos de color, con el orden y la duración que quieras. Es el de `ejemplo-clasico/` y está explicado en `referencias/escenas.md`.

Usa `limpio` salvo que el usuario quiera otro orden de escenas, fondos de color o un final con botón.

- **Entrada:** un anuncio que le guste al usuario (vídeo, capturas o solo la descripción) y los datos de su marca. Del anuncio de referencia se copia **el ritmo y la estructura**, nunca su marca, sus personajes, sus textos ni sus colores.
- **Salida:** un MP4 (vertical 1080×1920 por defecto, también horizontal o cuadrado), una página HTML de un solo archivo que reproduce el anuncio en bucle y una portada PNG.
- Motor: Canvas 2D en Chromium sin pantalla (Node) + ffmpeg. Todo se dibuja con código: no hace falta After Effects ni programas de pago.

## Antes de empezar
1. Copia la skill a una carpeta de trabajo (la carpeta de la skill es de solo lectura) y comprueba el entorno:
   ```bash
   mkdir -p ~/anuncio-animado && cp -r <carpeta de esta skill>/. ~/anuncio-animado/ && chmod -R u+w ~/anuncio-animado && cd ~/anuncio-animado && node motor/comprobar.js
   ```
   El `chmod` hace falta porque `cp -r` conserva el «solo lectura». `comprobar.js` instala lo que falta con npm (sin permisos de administrador; la primera vez tarda hasta un minuto) y dibuja un fotograma de prueba. Si algo sale con ✗, mira `referencias/problemas.md` antes de seguir.
2. Un proyecto por anuncio: `~/anuncio-animado/proyectos/<nombre>/`. Todos los comandos se lanzan desde `~/anuncio-animado`; abajo, `P` es la carpeta del proyecto.
3. **¿Primera vez, o el usuario solo quiere probar?** Haz el ejemplo (estilo limpio, una app inventada de idiomas, unos 30–40 s de render):
   ```bash
   mkdir -p proyectos && cp -r ejemplo proyectos/prueba
   node motor/render.js proyectos/prueba/anuncio.json --muestras   # hoja con un fotograma de cada escena
   node motor/render.js proyectos/prueba/anuncio.json              # → proyectos/prueba/anuncio.mp4
   node motor/exportar.js proyectos/prueba/anuncio.json            # → proyectos/prueba/anuncio.html
   ```

## El trabajo, paso a paso

### 1. Preguntas (en un solo mensaje)
- **Qué anuncia:** nombre de la app o del negocio, qué hace en una frase y a quién va dirigido.
- **Marca:** colores (si los tiene; si no, los propones tú), logo (PNG o SVG, opcional) y eslogan.
- **Referencia:** un anuncio que le guste (el vídeo, unas capturas o una descripción). Si no tiene, usa la estructura del ejemplo.
- **Formato:** vertical (Reels, TikTok, Shorts), horizontal (YouTube, web) o cuadrado; duración (10 s por defecto; con referencia, la de la referencia).
- **Mascota:** si quiere un personaje (forma, color y accesorio; ver `referencias/escenas.md`) o ninguno.
- **Cierre:** en el estilo limpio, el final es el logo con el nombre; en el clásico, el texto del botón final («Descárgala gratis», «Pide el tuyo»…).

Si no contesta todo (o no está para contestar), no te pares: sigue con lo razonable, haz también el render sin esperar el visto bueno de la hoja y di al entregar qué decidiste tú: vertical, 10 s, estilo limpio con la mascota del color principal, el color elegido por ti si no lo da (uno con fuerza, ver `referencias/escenas.md`) y los textos sacados de lo que hace. En el estilo clásico, además, un eslogan de 3–6 palabras y un botón final según el negocio («Descárgala gratis» para una app, «Ven a probarlo» o «Reserva ya» para un local). Sin logo, el motor dibuja un icono con la mascota.

**¿No es una app?** (una tienda, un bar, un servicio): las escenas de app se reaprovechan; mira «Negocio sin app» en `referencias/escenas.md`.

### 2. La referencia
- **Vídeo:**
  ```bash
  python3 scripts/referencia.py REFERENCIA.mp4 --salida P/referencia
  ```
  Saca `planos.json` (cada plano con su inicio y su fin), `hoja.jpg` (una sola imagen con un fotograma de cada plano: mírala en vez de fotogramas sueltos), `borrador_limpio.json` (el ejemplo del estilo limpio con los 8 tiempos de la referencia) y `borrador.json` (estilo clásico, una escena por plano). Si salen pocos planos, repite con `--umbral 0.2`; si salen demasiados, con `--umbral 0.45`.
- **Capturas:** míralas y apunta qué pasa en cada una y cuánto dura (si no se sabe, 1–1,5 s por plano).
- **Descripción:** convierte lo que cuenta en una lista de planos con su duración.
- En los tres casos, escribe para el usuario una lista corta: «plano 1 (0–1 s): logo con aro → escena `logo`…». **No copies** el logo, la mascota, los textos, los colores ni la música del anuncio de referencia: es de otra marca.

### 3. El plan → `referencias/escenas.md`
**Estilo limpio** (parte de `ejemplo/anuncio.json`): cambia `marca.nombre`, `marca.colores.principal` (un color con fuerza: el texto blanco tiene que leerse encima), `marca.logo` si lo hay y todo `textos` (pregunta, bocadillo, tres palabras con sus iconos, «Descubre», el título de la pantalla del móvil, el dato y los tres textos de la tarjeta). Pon los iconos a juego con el negocio (`iconos`, `iconos_movil` y los de la tarjeta: los del ejemplo son de idiomas). En `tiempos` van **los 8 inicios** de las partes, en segundos: con referencia, `referencia.py` ya los deja en `P/referencia/borrador_limpio.json` (cada parte en el corte de la referencia más cercano; revísalos con la hoja); sin referencia, quita `tiempos` y se reparten solos en la `duracion`. Cada parte necesita 0,4 s como mínimo. El borrador sale con el formato de la referencia: pon `ancho` y `alto` en el que haya pedido el usuario. Sin mascota: `"mascota": false` (sale el icono). Campos y límites de texto en «Estilo limpio» de `referencias/escenas.md`.

**Estilo clásico** (parte de `ejemplo-clasico/anuncio.json` o del `borrador.json`):
- Para cada plano, el tipo de escena que haga lo mismo y sus textos, con los tiempos de la referencia (`a` y `b`) y su misma duración total. Usa una sola llamada a la acción (la del final; si sale un botón en `movil`, que diga otra cosa, como «Ver más»). Un plano de menos de 0,5 s es casi todo transición: júntalo con el de al lado (o usa `palabras` con dos palabras, que cambian dentro de la misma escena).
- Textos cortos (unas 3 palabras por segundo como mucho) y en el idioma del usuario.
- Si hay logo, cópialo a `P/` y ponlo en `marca.logo`.

### 4. Muestras y una ronda de cambios
```bash
node motor/render.js P/anuncio.json --muestras          # P/muestras.jpg
node motor/render.js P/anuncio.json --solo 1.2,4.5      # esos segundos a tamaño real, en P/muestras/
```
**Corrige todos los «Aviso:» antes de seguir**: el motor avisa de las escenas demasiado cortas, de los textos que se van a cortar o que no da tiempo a leer, de las palabras de `resaltar` que no están en el texto y de las letras o el logo que no cargan. Luego mira la hoja (una sola imagen), corrige lo que veas (colores que no contrastan, escenas vacías) y enséñasela al usuario **antes** del render completo. Cada muestra es un solo instante (la del final se toma cuando ya está completo). Si cambias el plan, vuelve a sacar las muestras: las anteriores se quedan viejas.

### 5. Render y entrega
```bash
node motor/render.js P/anuncio.json [--vueltas 2] [--musica cancion.mp3] [--crf 18]   # P/anuncio.mp4
node motor/exportar.js P/anuncio.json                                               # P/anuncio.html
node motor/render.js P/anuncio.json --portada auto                                  # P/portada.png (el final completo; o un segundo: --portada 4.5)
```
- El render va por tandas de 150 s: si se corta, **repite el mismo comando** y sigue donde iba. 10 s de anuncio tardan unos 10–20 s.
- `--vueltas 2` repite el anuncio (para publicarlo de 20 s). `--musica` solo con música que el usuario tenga derecho a usar; para redes, mejor sin música y que la ponga desde la biblioteca de la app.
- La página HTML funciona sin internet (letras y logo van dentro): se abre con doble clic o se sube a una web. Tocar la pantalla la pausa.
- Entrega el MP4, el HTML y la portada, y di en una línea qué escenas has usado. El MP4 sale **sin sonido** salvo que uses `--musica`: dilo al entregarlo.

## Formato horizontal o cuadrado
Cambia `ancho` y `alto` en el plan (1920×1080 o 1080×1080). En el estilo limpio, el diseño se escala y se centra; en el clásico, en horizontal los textos van a la izquierda y la mascota a la derecha. Mira siempre la hoja de muestras: lo que cabe en vertical puede no caber en cuadrado.

## Si algo falla
`referencias/problemas.md`.
