# Cambios

## 1.2 · 29-10-2026
- **Dos finales sin rehacer el vídeo:** `"finales"` en el plan sustituye la última frase en otra versión (por ejemplo, TikTok). `alinear.py FINAL.mp3 --final tiktok` pega esa frase detrás del cuerpo de la voz, en el mismo instante y con la misma sonoridad que el final original; `node render.mjs video` hace las dos versiones, comprueba que el cuerpo sale idéntico y solo renderiza el final.
- **Final «perfil» para TikTok:** `"modo": "perfil"` en la escena `cta`: tarjeta de perfil en la que se pulsa «Seguir» y «Mensaje», y sale el mensaje privado con la palabra. En TikTok vale también el mismo «Comenta PALABRA» de Instagram (se contesta a mano): es lo que hace la skill si no se le dice otra cosa.
- **Idioma y textos fijos:** `"idioma"` (es, en, pt, fr, it, de) traduce los textos fijos de las escenas y el formato de los números; `"textos"` cambia cualquiera de ellos. El chat ya no lleva un nombre de marca por defecto.
- **Subtítulos:** una palabra de enlace («de», «la», «que»…) ya no cierra una línea en el modo `linea`.
- **`ritmo.py`:** enseña el tramo quieto más largo de cada zona (arriba, centro, abajo) y, con `--por-zona`, exige un cambio cada 0,6 s en cada una.
- **Render:** la caché de trozos compara el contenido del plan y de los tiempos, así que cambiar la portada o un final no obliga a renderizar otra vez la versión principal.
- `resumen` marca con `~` los momentos que se reparten solos y enseña el estado de cada final; `fotos`, `foto` y `resumen` aceptan `--final`.
- Rutas: la skill ya no da por hecha ninguna carpeta del entorno (ni la de la skill ni la de entrega).
- Voz: Eleven v4, v4 Turbo y v3 (las que entienden las etiquetas, consultado el 28-10-2026).
- Tras dos pruebas a ciegas (una sin permisos de administrador y en inglés): la escena `chat` acepta `codigo` (las líneas que se escriben como respuesta) en vez del código de ejemplo de un reel; si un icono no existe, el resumen sugiere los parecidos que sí existen; avisos de reel de menos de 25 s, de titular que no se llega a leer entero antes del fundido y de lista de solo 2 elementos; alinear.py avisa si el final nuevo va a otro ritmo que el resto; el móvil se distingue mejor en estilos oscuros; ejemplos de finales en inglés; se encuentran también los iconos de Lucide que solo existen con su nombre antiguo (como `history`); `ritmo.py` avisa, sin dar fallo, de una zona quieta más de 3 s.
- `GUIA.md` y este archivo de cambios.

## 1.1 · 25-10-2026
- Tras dos pruebas a ciegas: cortes entre frases cuando se parte una frase donde la voz no hace pausa (alinear avisa), aviso de texto cambiado sin volver a alinear, avisos de títulos pequeños, escenas que tardan en enseñar algo y contraste bajo, escena «tachado» rediseñada, la voz solo suena si se alineó y permisos al copiar la plantilla desde la carpeta de solo lectura.

## 1.0 · 25-10-2026
- Primera versión: guion, voz alineada palabra a palabra, 17 tipos de escena, 5 estilos, personaje opcional, efectos, control de ritmo, portada y textos.
