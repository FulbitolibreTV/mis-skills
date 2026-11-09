# Cambios

## v1.1 · 02-11-2026
- **Estilo nuevo `limpio`, ahora el de por defecto** (`motor/limpio.js`): el de los anuncios de motion graphics de las apps grandes. Fondo blanco, un solo color de marca con sus tonos, trazos gruesos que cruzan el plano, móvil 3D entre aros, tarjeta que entra volando, logo final que se desvanece y desenfoque de movimiento de verdad (8 sub-imágenes por fotograma).
- 8 partes con textos y tiempos propios (`textos` y `tiempos`); color, logo y letra desde el plan; vertical, horizontal y cuadrado; avisos de textos largos, colores muy claros y partes demasiado cortas.
- El ejemplo (Charlo) pasa a ser del estilo limpio; el de v1.0 sigue en `ejemplo-clasico/`.
- La página HTML usa 2 sub-imágenes por fotograma para ir fluida en el navegador.

## v1.0 · 02-11-2026
Primera versión.
- Motor de anuncios en Canvas 2D, determinista (el mismo segundo da siempre la misma imagen), con 9 tipos de escena: logo, pregunta, palabras, descubre, móvil 3D, dato, tarjeta, final y texto. Cinco transiciones y final que funde con el principio para el bucle.
- Mascota dibujada con código: 5 formas, 3 accesorios, habla, saluda y salta.
- Vertical, horizontal y cuadrado con el mismo plan.
- `referencia.py`: planos, hoja de miniaturas y borrador del plan a partir de un anuncio de referencia.
- Hoja de muestras, fotogramas sueltos a tamaño real, render por tandas que se puede retomar, música opcional con fundido, varias vueltas y portada.
- `exportar.js`: página HTML de un solo archivo que se reproduce en bucle sin internet.
- `comprobar.js`: instala las dependencias sin permisos de administrador y busca Chromium (Playwright, el del sistema o @sparticuz/chromium).
