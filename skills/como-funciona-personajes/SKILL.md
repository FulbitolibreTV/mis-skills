---
name: como-funciona-personajes
description: Parte 2 de la skill como-funciona. Biblioteca de personajes y objetos en imagen (muñequitos de juguete para el estilo mapa, monigotes de neón para el estilo neon) y las referencias de estilo que mandó el usuario. No se usa sola; la usa como-funciona cuando un vídeo lleva personajes o hace falta mirar una referencia.
---

# como-funciona-personajes (parte 2)

Esta carpeta es la parte 2 de `como-funciona`. Está separada porque una skill admite como máximo 200 archivos.

- `personajes/<estilo>/<nombre>.png`: personajes y objetos recortados con fondo transparente. `personajes/lista.js` los lista y `estilos.js` los carga solos.
- `reference/`: referencias de estilo (`ref_*.jpg`), resultados de ejemplo (`ejemplo_*.jpg`) y las hojas originales de ChatGPT (`hoja_*.png`).

Cómo se usa: en cada vídeo, copia `personajes/` a `<carpeta del vídeo>/web/personajes` (`make.sh` lo hace solo si encuentra esta carpeta al lado de `como-funciona`). Para dibujarlos: `pj(ctx, 'mapa/rey', x, yPies, alto, {p, hop, flip, rot, gray})` (ver `como-funciona/SKILL.md`).

Para añadir personajes: `python -I como-funciona/engine/tools/personajes.py hoja.png mapa 5 4 nombre1,nombre2,...`. Los escribe aquí y actualiza `lista.js`. Cuando esta parte llegue a unos 190 archivos, crea `como-funciona-personajes-2` con la misma estructura y pon `PJ_DIR` apuntando a su carpeta `personajes`.
