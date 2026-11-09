# Tarjetas (lo que se ve en el centro)

Cada paso lleva como mucho una tarjeta: `"tarjeta": {"tipo": "...", ...}`.
- Todos los campos son opcionales salvo los marcados con **(obligatorio)**.
- Los `..._en` aceptan una palabra o unos segundos (ver `plan.md`). Lista completa:
  - Terminal: `prompt_en`, `barra_en`, `fin_en`, `archivo_en` y `en` dentro de cada línea de `salida`.
  - Carpeta: `en`, `barras_en`, `etiqueta_en`, `pie_en` y `en` dentro de cada archivo.
  - Monigote: `en`, `icono_en`, `tachar_en` y `bocadillo_en`.
  - Comentario: `en` y `texto_en`.
  - Dictado: `en` y `hasta`.
  - Render: `clic_en`.
  - Lista, iconos, onda, grabar, contador, imagen y cifra: `en`, y en lista e iconos también `en` dentro de cada elemento.
  - Sin `en`, los tiempos se reparten solos dentro del paso para que todo dé tiempo a verse.
- Iconos disponibles: `carpeta, video, audio, micro, documento, imagen, estrella, corazon, check, reloj, chat, codigo, chispa, musica, rayo, lupa, personaje, tijeras, globo, movil, libro, camara, bombilla, grafica, dinero, casa, comida, silencio, cruz, altavoz`.

## terminal: ventana de app que escribe una orden y responde
```json
{"tipo": "terminal", "titulo": "Claude", "icono": "chispa", "prompt": "haz el vídeo con mi voz",
 "salida": ["✓ Audio cargado", {"texto": "✓ Bocas", "en": "boca"}, "• Leyendo el guion"],
 "barra": "Renderizando", "barra_en": "renderiza", "fin": "✓ Vídeo listo",
 "archivo": "voz.mp3", "archivo_icono": "audio"}
```
- **Prompt:** se teclea con sonido (`velocidad` = segundos por letra, 0,038).
- **Salida:** las líneas que empiezan por `✓` salen en verde con un check; las que empiezan por `•` llevan un punto.
- **Barra:** se llena y después sale la línea `fin`.
- **Archivo:** una píldora con el nombre del archivo cae encima de la ventana.
- Para que se lea bien, como mucho unas 6 líneas en total.

## carpeta: ventana de carpeta con archivos que aparecen uno a uno
```json
{"tipo": "carpeta", "nombre": "reels", "archivos": [{"nombre": "reel-1", "icono": "video"}, {"nombre": "reel-2", "pose": "pulgar"},
 {"nombre": "logo", "imagen": "recursos/logo.png"}], "barras": true, "etiqueta": "✓ plantilla", "pie": "en unos 30 minutos", "pie_icono": "reloj"}
```
- Cada archivo puede llevar un `icono`, una `pose` del personaje o una `imagen` del proyecto.
- **Barras:** barra de descarga bajo cada archivo. **Etiqueta:** después de las barras, cambia los nombres por «✓ texto».
- **Pie:** píldora bajo la ventana.
- Como mucho 8 archivos.

## poses: las poses del personaje apareciendo
```json
{"tipo": "poses", "nombre": "personaje", "pie": "hecho con tu imagen", "max": 6}
```
Usa todas las poses de `personaje.json` (o las de `"poses": [...]`).

## bocas: las bocas del personaje con karaoke
```json
{"tipo": "bocas", "titulo": "Bocas sincronizadas"}
```
Enseña las 7 bocas, resalta la que está usando en ese momento y debajo pone las palabras que se dicen, resaltando la actual.

## onda: voz generándose
```json
{"tipo": "onda", "titulo": "ElevenLabs", "insignia": "voz IA", "etiqueta": "Generando voz"}
```
La onda sigue la voz real si la hay.

## grabar: micrófono grabando
```json
{"tipo": "grabar", "etiqueta": "Grabando tu guion"}
```
Lleva un «● REC» que parpadea y una onda roja.

## contador: publicación con una cifra que sube
```json
{"tipo": "contador", "titulo": "@tu_cuenta", "valor": 82500, "desde": 0, "formato": "k", "etiqueta": "me gusta",
 "icono": "corazon", "insignia": "funciona", "pose": "celebra"}
```
- **Formato:** `k` da 82.5K; `puntos` da 82.500.
- Las cifras de menos de 100 salen directamente, sin contar hacia arriba.
- **Insignia negativa:** `"insignia_tipo": "mal"` la pone en rojo con una ✗, por ejemplo «aburre».
- A la izquierda va una miniatura con una `pose` o una `imagen`.
- **No pongas cifras inventadas como si fueran reales**: usa las del usuario o cifras de ejemplo que no lo parezcan.

## monigote: muñeco de palo con bocadillo y un icono que se tacha
```json
{"tipo": "monigote", "bocadillo": "No tengo tiempo", "icono": "reloj", "tachar": true, "tachar_en": "ahora", "cara": "triste"}
```
La cara puede ser `triste` o `contenta`.

## iconos: rejilla de iconos con texto que aparecen uno a uno
```json
{"tipo": "iconos", "items": [{"icono": "micro", "texto": "voz", "en": "voz"}, {"icono": "video", "texto": "vídeo"}, {"pose": "saluda", "texto": "tú"}],
 "prompt": "usa todo esto"}
```
- Hasta 5 por fila; también vale una `pose` del personaje y un `color`.
- Con `prompt`, debajo sale una terminal.

## dictado: dictar por voz a la app
```json
{"tipo": "dictado", "texto": "abre con el personaje y pon un titular en cada frase", "salida": ["✓ Entendido"]}
```
Una píldora oscura escribe el texto en directo y la terminal de debajo lo recibe.

**Consejo para terminal y dictado:** no retrases `prompt_en` más de 1 s desde el inicio del paso. Si no, la ventana se queda vacía.

## render: carpeta de vídeos, clic en final.mp4 y vista previa
```json
{"tipo": "render", "archivos": ["borrador-01.mp4", "borrador-02.mp4", "final.mp4"], "clic_en": "este"}
```

## comentario: caja de comentario donde se escribe la palabra
```json
{"tipo": "comentario", "palabra": "PIXEL", "texto": "y te mando la skill gratis", "boton": "Comentar"}
```
Para el final con llamada a la acción. Textos fijos de la caja: `pestana`, `pestana2`, `ayuda` y `boton`. Se traducen solos con `"idioma"` en `reel.json`.

## lista: lista de comprobación que se va marcando
```json
{"tipo": "lista", "titulo": "Antes de publicar", "items": [{"texto": "Portada", "en": "portada"}, "Texto", "Etiqueta de IA"]}
```
Como mucho 5 elementos.

## imagen: una imagen del proyecto (captura, logo propio, foto)
```json
{"tipo": "imagen", "archivo": "recursos/captura.png", "pie": "así queda", "ancho": 0.9, "marco": true}
```
Usa solo imágenes del usuario o hechas por ti; nada de logos de otras marcas.

## cifra: un número enorme que sube
```json
{"tipo": "cifra", "valor": "15", "sufijo": " g", "texto": "de café por cada 250 ml", "en": "quince"}
```
- Si `valor` no es un número (por ejemplo «x2»), sale tal cual.
- Los números de 100 o más suben contando. Los pequeños salen directamente, para que nadie lea una cifra intermedia rara. Se puede forzar con `"animar": true` o `false`.
