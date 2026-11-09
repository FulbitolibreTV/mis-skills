# Si algo falla

| Lo que pasa | Qué hacer |
| --- | --- |
| `Permission denied` o «no se puede escribir» | Estás dentro de la carpeta de la skill, que es de solo lectura. Copia la skill con `cp -r … && chmod -R u+w …` (SKILL.md, paso 0) y trabaja en la copia. |
| `No module named 'skia'` | `python3 scripts/comprobar.py` lo instala. Sin permisos de administrador también funciona (se instala para tu usuario). |
| `libEGL.so.1: cannot open shared object file` | A skia-python le falta una librería del sistema. Con permisos: `apt-get install -y libegl1 libgl1`. Sin permisos, usa otro ordenador o el de Claude en la nube. |
| `no encuentro «@palabra» en «…»` | El tiempo apunta a una palabra que no está en esa frase. Usa una palabra de la misma frase, escrita como se dice (las tildes y mayúsculas dan igual; vale el principio de la palabra). |
| `no existe la pieza «…»` | Mira el nombre en `referencias/piezas.md` o crea la pieza en `scripts/papel.py`. |
| `El texto de historia.json ha cambiado desde que alineaste la voz` | Cambiaste una frase después de pasar `alinear.py`. O vuelves a dejar el texto como estaba, o grabas otra vez y pasas `alinear.py`. Cambiar piezas, decorados o tiempos no obliga a nada. |
| `Palabras reconocidas: 60 %` | La grabación no dice lo mismo que `historia.json` (o lo dice en otro orden). Corrige el texto para que sea exactamente lo grabado. |
| `PARADO para no pasar de 3 min` | Es normal en vídeos largos: vuelve a ejecutar el mismo comando y sigue donde lo dejó. |
| El modelo de voz no se descarga | `alinear.py` lo baja de npm (240 MB, una vez, comprobando su huella). Si no hay red, sigue sin voz: `plan.py` estima los tiempos. |
| `ritmo.py` avisa de tramos quietos | Añade en esa zona algo que se mueva: una pieza que entra con `@palabra`, `lampara` con `parpadeo`, un `brazo` tecleando, una `onda`, una `nota` con `claves`. |
| La portada tapa algo importante | `portada.py PROYECTO --t 12.5` usa otro segundo del vídeo como fondo. |
| Una pieza tapa a otra | Se dibujan en orden: mueve la que debe ir delante al final de la lista `piezas`. |
| El vídeo pesa mucho | Es por el grano del papel. Para mandarlo por mensaje: `ffmpeg -i video.mp4 -c:v libx264 -crf 26 -preset veryfast -c:a copy pequeño.mp4`. |
