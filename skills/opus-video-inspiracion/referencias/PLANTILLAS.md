# Plantillas originales de producción (no copiadas de los creadores)

Estas plantillas son propuestas **originales** para generar animaciones en Claude. Ajustar siempre tema, marca, duración y recursos disponibles.

## Plantilla A — Reel de «cómo funciona» (9:16, 30 s)

```text
Produce una animación vertical original de 30 segundos sobre [TEMA].
Entrega 1) guion visual con tiempos, 2) un index.html reproducible en navegador,
3) función window.seek(t) para fijar cada fotograma, y 4) instrucciones reales de exportación.
Estilo: limpio, técnico, una idea por escena, acento cromático consistente,
textos grandes y alto contraste. Crea tus propios dibujos en Canvas/SVG.
Secciones: 0–3 s pregunta; 3–8 s vista general; 8–21 s despiece en tres fases;
21–27 s resultado; 27–30 s conclusión.
No uses música ni recursos con derechos sin permiso.
Antes de afirmar que hay MP4, verifica que existe y que duración y resolución son correctas.
```

## Plantilla B — Anuncio de producto (9:16, 15 s)

```text
Crea un anuncio original para [PRODUCTO], con una promesa verificable proporcionada
por el usuario. Estética editorial contemporánea, una tipografía principal,
fondo legible, movimientos suaves y no más de siete palabras por pantalla.
Duración 15 s a 30 fps. Diseña cuatro escenas: necesidad, mecanismo, beneficio
verificable y cierre. No inventes cifras ni reseñas.
Entrega HTML/CSS/JS previsualizable; usa SVG/GSAP solo cuando aporte valor.
Conserva archivos fuente y define pasos comprobables para capturar un video.
```

## Plantilla C — Modelo 3D didáctico (16:9 o 9:16)

```text
Representa en Three.js un modelo educativo simplificado de [OBJETO], claramente
marcado como modelo esquemático. Cámara con encuadre inicial, movimiento suave,
3 etiquetas máximas visibles a la vez y un control de «despiece» si corresponde.
Incluye iluminación accesible, botón de pausa y una función seek(t) determinista.
Verifica la escala y que las partes visibles estén sustentadas por la información
que aporta el usuario o fuentes verificadas. Si es una maqueta y no una reproducción
exacta, dilo en pantalla.
```

## Nota de producción

HTML y una vista previa no equivalen a MP4. Para exportar, es necesario capturar fotogramas (por ejemplo con Playwright y un controlador de tiempo) y codificarlos con FFmpeg, o utilizar un motor de video que ya esté funcionando en el proyecto. Si el entorno carece de esas herramientas, entregar el proyecto reproducible sin inventar la salida final.
