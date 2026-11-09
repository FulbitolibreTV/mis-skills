# Guía para que los vídeos tengan más opciones de hacerse virales

Nada garantiza que un vídeo sea viral. Estas reglas suben las probabilidades. Aplícalas en este orden: el tema y el gancho pesan más que el diseño.

## 1. El tema (antes de escribir nada)
Propón **5 temas** al usuario y ponles nota del 1 al 10 en cada punto. Recomienda el de más nota.
- **Cotidiano:** ¿la gente lo toca o lo ve cada día? (móvil, tarjeta, microondas, ascensor, semáforo, wifi, nevera, mando, cremallera, ticket térmico…)
- **«Nunca me lo pregunté»:** ¿da curiosidad en cuanto lo oyes?
- **Visual:** ¿hay algo invisible que se pueda dibujar en dorado (electricidad, ondas, calor, presión, señal)?
- **Sorpresa:** ¿la respuesta va contra lo que cree la gente o trae una cifra loca?
- **Enviable:** ¿hay un «amigo que…» claro para el final? («que siempre pierde las llaves», «que deja la sopa fría por el centro»)

Si el usuario ya trae tema, puntúalo igual y sugiere cómo subir la nota (por ejemplo, darle la vuelta a la pregunta).

## 2. El gancho (0 a 2 s)
Escribe **3 ganchos distintos** y deja elegir al usuario. Fórmulas que funcionan:
- **Pregunta imposible:** «¿Por qué el microondas calienta la sopa, pero no el plato?»
- **Contradicción:** «Tu tarjeta paga sin tocar nada… y no tiene batería.»
- **Lo hace sin que lo sepas:** «Tu móvil está leyendo tu dedo cien veces por segundo.»
- **Cifra loca:** «Esta onda cambia de sentido 2.450 millones de veces por segundo.»
- **Dato de historia (relatos):** «¿Sabías que el hombre que más vivió en la Biblia murió justo el año del diluvio?» El «¿Sabías que…?» solo vale si el dato loco llega en la misma frase.
- **Pregunta personal:** «¿Dios te sigue perdonando si caes una y otra vez?», «¿Te has preguntado por qué…?» (toca algo que la persona vive).
- **Te lo han explicado mal:** «No, el microondas no hace vibrar el agua.» (solo si es verdad)

Reglas del gancho:
- Máximo 12 palabras. La palabra clave, en las 3 primeras.
- **Algo se mueve en el fotograma 1:** un zoom rápido hacia fuera, un dedo que toca o algo que se enciende. Nunca un plano quieto.
- El objeto, grande y reconocible desde el primer fotograma (la gente decide si sigue mirando antes de leer).
- Nada de presentaciones («Hoy te explico…»). «¿Sabías que…?» solo con el dato loco en la misma frase.
- En relatos, el primer fotograma ya es cine: un rayo que cae, lluvia sobre el personaje, el sol que se pone.

## 3. Retención (que no se vayan)
- **La escena avanza con la historia:** en relatos, mantén el mismo personaje y el mismo paisaje y haz que cambien (el cielo pasa de tormenta a atardecer, algo se construye, se enciende, se cierra) en lugar de cortar a un decorado nuevo en cada frase.
- **Haz la cuenta en pantalla:** si el guion suma o compara cifras, que se vean sumarse (`segBar`, `chip`) o acumularse (`tally`).
- **El fotograma 1 enseña la pregunta:** si el vídeo va de por qué tiembla el párpado, el primer fotograma es un ojo enorme con el párpado temblando. Si va de un tren, el tren ya va en marcha.
- **Algo nuevo cada 2 o 3 s:** un corte, un zoom que entra, una etiqueta, un número o un cambio de color. `node render.js audit` lo comprueba y avisa de los tramos quietos.
- **Bucle abierto** hacia la mitad: «Pero aquí viene lo curioso…», «Y lo raro es esto…», «Pero hay un problema…». Promete algo y cúmplelo.
- **Cifra sorprendente** entre el segundo 8 y el 15, con contador (`readout`).
- **Cada frase hace avanzar la historia.** Si se puede quitar sin perder nada, quítala.
- **Zoom que atraviesa** (de un objeto a su interior) al menos una vez: es el momento «wow» de este estilo.
- **Causas con objetos de la vida diaria:** un despertador a las 3:47, un café, un papel «URGENTE», el móvil. La gente se reconoce y se queda.
- **Planos cerca (macro):** dedo gigante, chip, superficie. Mejor recortado por los bordes que pequeño en el centro.

## 4. Voz y ritmo
- Unas **3 palabras por segundo** y sin pausas largas. Con Kokoro, `SPEED=1.1` a `1.2`.
- **La voz del usuario gana a la voz gratis.** Grabada con el móvil, cerca de la boca, con energía, en una habitación con cosas blandas. Si el usuario puede grabarla, recomiéndalo.
- Frases cortas. Tono de contarle algo increíble a un amigo, no de clase.

## 5. Final
Elige el que mejor encaje; todos terminan en cuanto llega la respuesta:
- **Enviar:** «Envíaselo a ese amigo que…» con la hoja de compartir. Los envíos por mensaje son lo que más empuja un vídeo.
- **Comentar entre dos opciones:** «¿A ti te tiembla el izquierdo o el derecho? Dímelo en comentarios.» Una pregunta fácil, de una palabra, sobre el propio espectador: dispara los comentarios (`commentAsk`).
- **Revelación:** «¿Te diste cuenta? Este vídeo siguió justo esa estructura» y se enseña el recorrido entero con etiquetas y «Tú estás aquí». Ideal para metáforas.
- **Anuncio:** «link en la bio» en una píldora (`pill`), sin rodeos.
- **Bucle:** la última imagen se funde con la primera (`LOOP`, activado por defecto). Si se puede, que la última frase enlace con la primera.
- No termines con «sígueme» ni con despedidas.

## 6. Portada
- `node render.js cover` → `portada.jpg`: un fotograma del vídeo con la pregunta grande en el centro y las palabras clave en dorado. Defínela en `shots.js`: `window.COVER = { t: 1.6, title: '¿Por qué el *microondas* no calienta el *plato*?' }`.
- Máximo 8 palabras, que se lean en el móvil a tamaño miniatura.

## 7. Publicar (díselo al usuario al entregar)
- Duración: **30 a 45 s** para empezar.
- Pon el texto del gancho también en la descripción, más 3 a 5 hashtags del tema (#curiosidades #ciencia #comofunciona y uno del objeto).
- Publica en TikTok, Reels y Shorts el mismo vídeo.
- **Constancia:** un vídeo al día durante semanas importa más que un vídeo perfecto.
- En las estadísticas, mira **en qué segundo se va la gente** y cambia ese tipo de plano en el siguiente vídeo.
- Si un tema funciona, haz la parte 2 («¿Y por qué el metal hace chispas?»).
