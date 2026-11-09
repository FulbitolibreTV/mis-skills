# Problemas y soluciones

| Qué pasa | Qué hacer |
| --- | --- |
| `comprobar.py` dice que falta ffmpeg | Instala imageio-ffmpeg de forma automática. Si no hay internet, `apt install ffmpeg` o pídele al usuario que active la ejecución de código con acceso a paquetes |
| `Permission denied` al escribir | La copia conserva el «solo lectura» de la skill: `chmod -R u+w ~/mascota-pixel` (ya va en el comando de SKILL.md, y `comprobar.py` lo arregla solo). Si estás dentro de la carpeta de la skill, cópiala antes a `~/mascota-pixel` |
| El recorte del personaje se come parte del cuerpo | El fondo no era liso o era del mismo color que la ropa. Pide la imagen con fondo verde `#00FF00` (o magenta si el personaje lleva verde). Con fondo blanco y camiseta blanca, la camiseta desaparece |
| Queda un borde verde alrededor | Pasa si la imagen se recortó a mano. Usa `sprite.py cortar` (recuerda que el fondo era croma) o pide la imagen otra vez con fondo verde y pásala por `cortar --rejilla 1x1` |
| `cortar` encuentra más o menos figuras de las esperadas | Usa `--rejilla 3x3` (o las filas y columnas que tenga la hoja) |
| El sprite sale borroso o con colores raros | Fuerza `--modo pixel`. Si era un dibujo, prueba con `--alto 90` o `--alto 150` y `--colores 24` o `48` |
| El sprite sale gigante (más de 200 px de alto) | El pixel art era muy fino: `preparar` lo reduce solo a `--alto`. Puedes bajarlo |
| La boca sale en otro sitio en alguna pose | Márcala a mano en esa pose con `--solo-esta`. Revisa `hoja.png` |
| La boca tapa la barba o sale un parche de otro color | Añade `"piel": [r, g, b]` en la boca de esa pose en `personaje.json`, con el color de alrededor de la boca |
| «Palabras reconocidas» por debajo del 80 % | El guion no es lo que dice la voz. Corrige `guion.txt` y vuelve a alinear. Comprueba también `--idioma` |
| El modelo de voz no se descarga | Sin internet, `alinear.py` reparte las palabras por los tramos con voz. El vídeo sale, pero los titulares pueden ir un poco desfasados: usa `"en"` con segundos |
| ERROR en reel.json | El mensaje dice qué paso y qué campo. Los números de frase empiezan en 1 |
| «no encuentro la palabra» | Esa palabra no está en las frases de ese paso: usa otra o segundos |
| Algo tapa la cara del personaje | La tarjeta es demasiado alta: menos líneas, menos archivos o menos elementos |
| `ritmo.py` avisa de tramos quietos | Añade un segundo titular con `en` o un elemento que entre en ese segundo |
| El vídeo pesa demasiado | Se recomprime solo por encima de 28 MB. Para menos, bájalo después con ffmpeg (`-crf 24`) |
| El render se corta por tiempo | Lanza el render en segundo plano, o renderiza menos pasos para probar. Va a unos 30–60 fotogramas por segundo |
