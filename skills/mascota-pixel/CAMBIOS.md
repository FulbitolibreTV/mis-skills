# Cambios

## 1.4 · 28-10-2026
- La copia de trabajo se puede escribir siempre: el comando de SKILL.md añade `chmod -R u+w`, porque `cp -r` conserva el «solo lectura» de la skill y antes fallaba al crear el proyecto de ejemplo.
- `comprobar.py` revisa toda la copia (no solo la carpeta principal), arregla los permisos si hace falta y avisa si se está trabajando dentro de la carpeta de la skill.
- `comprobar.py` comprueba también la letra Jersey 10.
- El reel de ejemplo crea antes la carpeta `proyectos/` (antes, `cp -r ejemplo proyectos/prueba` fallaba la primera vez).
- Tras una prueba a ciegas:
  - `ritmo.py` deja claro que las cifras por zona son orientativas y que el veredicto mira la pantalla entera. Con `--por-zona`, exige además un cambio cada 0,6 s en cada zona.
  - SKILL.md explica qué sale de `portada.py`: la portada a 1080×1920, que vale para las dos apps, y una imagen para comprobar el recorte 3:4 del perfil.

## 1.3 · 27-10-2026 (modo videojuego)
- Tarjetas y cajas del titular que se materializan en píxeles, con esquinas en escalera.
- Letra de píxel Jersey 10 (OFL) en las cajas, en las barras de título y en el XP.
- «+10 XP» al pasar de paso, «¡LEVEL UP!» al final, bocadillos de emoción (!, ?, corazón, idea…), placa de jugador con barra de vida, nubes de píxel y sacudidas de pantalla.
- Sonidos de 8 bits: blip, moneda, subida de nivel y golpe.
- `--factor` en `preparar`, para que todas las poses de una hoja tengan la misma escala.
- `boca` encuentra la boca aunque las caras estén dibujadas por separado.
- La boca «o» ahora es proporcional al ancho de la boca.
- Sprites más nítidos: en modo dibujo, cada píxel toma el color central de su bloque y ya no mezcla bordes (`--suave` para el modo anterior).
- La búsqueda de la boca acepta extremos suavizados y bocas torcidas.
- Vídeo con más calidad (CRF 16, ajuste para animación).
- Tras la cuarta prueba a ciegas:
  - «¡LEVEL UP!» va abajo a la derecha, lejos de la cara, y se coloca con `nivel_xy`.
  - La barra de XP se dibuja encima del personaje.
  - El sello y la placa del jugador eligen solos el lado libre del cuerpo.
  - La cintura se alarga sin rayas.
  - Los bocadillos de emoción tienen el borde completo.
  - «+10 XP» es más grande.
  - Se limpian mejor las comisuras.
  - `"idioma"` traduce los textos fijos.
  - El modo pixel avisa y pasa al modo dibujo si el sprite sale diminuto.
  - `--factor` aparece también en SKILL.md.

## 1.2 · 27-10-2026 (rediseño visual)
- Titulares nuevos: la primera línea, grande, y la segunda en una caja de color con sombra dura, que entra con un barrido.
- Cajas de estilo videojuego: borde grueso, sombra dura y botones cuadrados. El modo `"panel": "suave"` deja el aspecto anterior.
- Las tarjetas se dibujan aparte, se miden, se reducen si no caben y se amplían un poco si sobra sitio. Ya no se pisan con el titular ni con el personaje.
- Textos de las tarjetas más grandes.
- Sin contador ni ruta arriba por defecto.
- Barra de XP en vez de rejilla, halo pixelado detrás del personaje, trama de puntos y destellos en el fondo.
- Sonido suave al cambiar de titular.
- Tras una tercera prueba a ciegas:
  - Las tarjetas ya no rozan el halo del personaje.
  - Los destellos solo salen en zonas libres.
  - Los titulares largos igualan el tamaño de sus dos líneas.
  - La portada pone el halo detrás del título y con un tamaño limitado.
  - Los tiempos de la terminal y de la carpeta se ajustan a lo que dura el paso.
  - La tarjeta de poses ya no deja una fila vacía.
  - Nuevas opciones: `escala_personaje` e `insignia_tipo: mal`.
  - Nuevos iconos: silencio, cruz y altavoz.
  - El texto de la caja del titular siempre contrasta.
  - El contorno se limpia de restos de verde.
  - Documentados los dos finales y todas las claves `_en`.

## 1.1 · 27-10-2026 (tras las pruebas con dos Claude nuevos)
- `boca` ajusta solo los números a la raya real de la boca, y borra mejor la boca original. La boca cerrada ahora tiene todo el ancho.
- `preparar --nombres`, para dar nombre a las poses de imágenes sueltas.
- Contorno más limpio en imágenes con restos de JPG.
- `"en"` prioriza la palabra exacta y avisa si es ambigua.
- Tarjetas centradas en el hueco libre.
- El personaje grande del gancho ya no tapa el titular.
- Paso de cierre sin voz (`"cierre"`) y `--muestras titulares`.
- El sello va por defecto lejos de la mano y dentro del recorte de la portada.
- 8 iconos nuevos. Las cifras pequeñas ya no cuentan hacia arriba.
- La copia de la skill funciona aunque la carpeta ya exista.
- Avisos de voz rápida y de `--idioma`, y documentación ampliada.

## 1.0 · 27-10-2026
- Primera versión. Incluye:
  - Corte de hojas de poses.
  - Paso a píxeles de pixel art, sprites y dibujos.
  - Bocas por código con búsqueda automática en todas las poses.
  - Alineado de voz con Whisper.
  - 15 tarjetas y 5 estilos.
  - Efectos de sonido sintetizados.
  - Control de ritmo, portada y robot de ejemplo.
