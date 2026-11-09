# Cambios

## v1.0 (03-11-2026)
- Primera versión: de historia.json a vídeo vertical en papel recortado (skia-python + ffmpeg).
- 49 piezas de papel (objetos, fondos, manos con 7 poses, narrador genérico con boca que sigue la voz y textos), decorados, cámara, barridos de franjas y tiras automáticas con las palabras clave.
- Tiempos por palabra («@palabra+0.3»): con voz caen justo cuando se dice; sin voz se estiman.
- Voz en una sola grabación con varios finales: alinear.py prepara una voz por final.
- Render por trozos que se guardan (sigue donde lo dejó y dibuja el cuerpo una sola vez para todos los finales), muestra rápida, efectos de sonido sintetizados, control de ritmo y portada.
