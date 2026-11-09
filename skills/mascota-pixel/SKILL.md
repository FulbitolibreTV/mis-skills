---
name: mascota-pixel
description: Reels y TikToks con tu mascota en pixel art que mueve la boca con tu voz. Pasos numerados, tarjetas de apps, portada y textos, todo con código a partir de una imagen o una foto.
---

# mascota-pixel

Hace reels verticales (1080×1920, 30 fps) en este formato:
- Arriba, un titular grueso que cambia con cada idea: la primera línea, grande; la segunda, dentro de una caja de color.
- En el centro, paneles de estilo videojuego (borde grueso y sombra dura) que imitan apps: terminal que escribe, carpetas, barras de carga, ondas de voz, contadores y la caja de comentario. Se colocan y se ajustan solos en el hueco libre, sin pisar nada.
- Abajo, algo a la izquierda, **la mascota del usuario en pixel art, con borde de pegatina y un halo pixelado detrás, moviendo la boca con la voz**.
- Abajo a la derecha, una barra de XP que se llena; en el fondo, una trama suave y estrellitas que parpadean.

Todo se hace con Python (Pillow y numpy) y ffmpeg. No hace falta navegador ni pagar herramientas de vídeo.

## Antes de empezar
1. Copia la skill a una carpeta de trabajo, porque la carpeta de la skill es de solo lectura, y comprueba el entorno:
   ```bash
   mkdir -p ~/mascota-pixel && cp -r <carpeta de esta skill>/. ~/mascota-pixel/ && chmod -R u+w ~/mascota-pixel && cd ~/mascota-pixel && python3 scripts/comprobar.py
   ```
   (con `/.` se copia el contenido aunque `~/mascota-pixel` ya exista; si ya había una versión vieja, esto la actualiza. El `chmod` hace falta porque `cp -r` conserva el «solo lectura» de la skill)
   Si algo sale con ✗, arréglalo antes de seguir: la propia comprobación instala lo que pueda.
2. Crea una carpeta de proyecto por vídeo, por ejemplo `~/mascota-pixel/proyectos/mi-reel/`. Todos los comandos se lanzan desde `~/mascota-pixel`.
3. **¿Primera vez o sin imágenes?** Haz el reel de ejemplo para ver que todo funciona (unos 2 minutos):
   ```bash
   mkdir -p proyectos && cp -r ejemplo proyectos/prueba
   python3 scripts/alinear.py --guion proyectos/prueba/guion.txt --sin-voz --salida proyectos/prueba/voz
   python3 scripts/render.py proyectos/prueba/reel.json
   ```

## El trabajo, paso a paso

### 1. Qué pide el usuario
Pregunta solo lo que falte, en un único mensaje:
- **Tema** del reel y **palabra para comentar**, si la quiere.
- **Voz:** si tiene un audio (suyo o de ElevenLabs), si quiere que le escribas el texto para generarla o si lo quiere sin voz.
- **Personaje:** sus imágenes.

Si no contesta, sigue con lo razonable: sin voz, robot de ejemplo y estilo `claro`, y dilo.

### 2. Personaje → `referencias/personaje.md`
- **Hoja con varias poses** (recomendado; prompt listo en `referencias/personaje.md`): `sprite.py cortar`, y después `preparar`.
- **Una o varias imágenes sueltas** (pixel art, dibujo o avatar): `sprite.py preparar`.
- **Solo una foto:** dale el prompt para convertirla en pixel art con ChatGPT o Gemini, que da mucho mejor resultado. Si tiene prisa, `preparar` también acepta la foto si el fondo es liso.
- **Escala:** con una hoja de poses en modo dibujo, usa `--factor` para que todas salgan a la misma escala (ver `personaje.md`).
- **Nombres de las poses:** en `cortar` y en `preparar`, pon `--nombres` en orden de lectura. Con imágenes sueltas, el orden es el alfabético de los archivos. Usa nombres que digan el gesto (`saluda`, `pulgar`), porque son los que pondrás en `reel.json`.
- **Marca la boca una vez:**
  1. Mira `personaje/vistas/<pose>.png` con la herramienta de leer imágenes.
  2. Apunta más o menos la columna del centro de la boca, la fila de la raya y el ancho.
  3. Ejecuta `sprite.py boca`. Ajusta solo los números a la raya oscura más cercana y busca la boca en las demás poses.
  4. **Revisa `personaje/hoja.png` siempre:** cada pose sale como es y con 4 bocas. Si alguna boca cae fuera de sitio, márcala a mano en esa pose con `--solo-esta`.

### 3. Guion → `referencias/guion-y-voz.md`
- `guion.txt`, con **una frase por línea** (8–15 frases) y unas 190–200 palabras por minuto.
- Estructura:
  1. Gancho con un número o una promesa concreta.
  2. Pasos o ideas.
  3. Prueba: «como este vídeo».
  4. Llamada a la acción.
- Si la voz es de ElevenLabs, dale también el texto con etiquetas de emoción.

### 4. Voz y tiempos
```bash
python3 scripts/alinear.py --guion P/guion.txt --voz audio.mp3 --salida P/voz --idioma es   # con voz (pon el idioma de la voz: es, en, pt…)
python3 scripts/alinear.py --guion P/guion.txt --sin-voz --salida P/voz                     # sin voz
```
- Recorta las pausas largas, deja la voz a −14 LUFS y saca el tiempo de cada palabra con Whisper. La primera vez descarga el modelo, unos 240 MB.
- Si salen menos del 80 % de palabras reconocidas, el guion no coincide con lo que dice la voz: corrígelo y repite.

### 5. Plan del vídeo → `referencias/plan.md` y `referencias/tarjetas.md`
Escribe `P/reel.json`:
- **Un paso por frase**, normalmente.
- **1–2 titulares por paso.** Como mucho 3 palabras por línea, y el segundo titular entra en una palabra clave con `"en"`.
- **Una pose por paso**, que encaje con lo que se dice.
- **Una tarjeta por paso**, con imagen literal de la frase.
- El primer paso con `"personaje": "grande"` y un `sello` es el gancho.
- **Si la voz tiene pocas frases largas** (lo normal en un audio grabado): no partas las frases. Pon 3–5 titulares con `en` en ese paso y elementos de tarjeta con `en`, para que algo cambie cada 1,5 s.
- **Dos finales** (por ejemplo, «comenta» en Instagram y «sígueme» en TikTok): ver «Dos finales» en `plan.md`.
- **Si la voz no dice la llamada a la acción:** añade al final un paso de cierre sin voz, `{"cierre": 2.0, "titulares": [...], "tarjeta": {...}}`.

Copia la estructura de `ejemplo/reel.json`.

### 6. Revisar y renderizar
```bash
python3 scripts/render.py P/reel.json --muestras      # un fotograma por paso → P/salida/muestras.png
python3 scripts/render.py P/reel.json --muestras titulares   # uno por cada titular (pasos largos)
python3 scripts/render.py P/reel.json --en 12.5       # un fotograma concreto
python3 scripts/render.py P/reel.json                 # vídeo → P/salida/reel.mp4
python3 scripts/ritmo.py P/salida/reel.mp4            # avisa si la pantalla se queda quieta más de 0,6 s (--por-zona: cada zona)
python3 scripts/portada.py P/reel.json                # portada.png (1080×1920, para las dos apps) + portada_comprobar.png (recorte 3:4 del perfil)
```
- **Mira `muestras.png` antes del render completo.** Revisa que nada se pise, que los textos quepan, que la pose encaje y que el `sello` no tape la mano ni la cara (muévelo con `x` y `y`).
- El render tarda más o menos lo que dura el vídeo.
- Si `ritmo.py` avisa de algo, añade un titular o un elemento con `"en"` en ese segundo y vuelve a renderizar.

### 7. Entrega → `referencias/publicar.md`
- Manda al usuario `reel.mp4` y `portada.png`.
- Escríbele el texto para Instagram y el de TikTok.
- Recuérdale que marque el contenido como hecho con IA si la voz es sintética o el personaje sale de un generador de imágenes.
- Si el vídeo dice «comenta PALABRA», pregúntale qué va a mandar a quien comente. Si no tiene nada preparado, ofrécete a hacerlo (un resumen o una guía corta) o cambia el final por «sígueme».

## Reglas
- No inventes funciones, precios ni cifras en el guion. Si el usuario da un dato, úsalo tal cual.
- No uses logos ni marcas de otras empresas dentro del vídeo: nómbralas solo como texto.
- Los titulares no tapan la cara del personaje y las tarjetas no bajan de su cabeza. El render ya lo controla; revisa las muestras.
- Si algo falla, mira `referencias/problemas.md` antes de improvisar.

## Archivos
- `scripts/`: `comprobar.py`, `sprite.py` (cortar, preparar, boca, hoja), `alinear.py`, `render.py`, `escenas.py` (tarjetas), `sonidos.py` (efectos sintetizados), `ritmo.py`, `portada.py` y `comun.py` (estilos e iconos).
- `referencias/`: `personaje.md`, `guion-y-voz.md`, `plan.md`, `tarjetas.md`, `publicar.md` y `problemas.md`.
- `ejemplo/`: proyecto completo con un robot de ejemplo.
- `fuentes/`: Poppins, JetBrains Mono y Jersey 10, con licencia OFL.
