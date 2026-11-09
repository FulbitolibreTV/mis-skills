// Herramientas para pintar una skin de 64x64 por partes y caras.
import { LAYOUT, rectCara } from './personaje.js';

export const CARAS6 = ['arriba', 'abajo', 'der', 'frente', 'izq', 'detras'];

export function nuevaSkin(semilla = 3) {
  const c = document.createElement('canvas'); c.width = 64; c.height = 64;
  const g = c.getContext('2d');
  let s = semilla;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);

  const hexARgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const varia = (hex, f) => {
    if (!f) return hex;
    const [r, gg, b] = hexARgb(hex), k = 1 + (rnd() - 0.5) * 2 * f;
    const cl = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
    return `rgb(${cl(r)},${cl(gg)},${cl(b)})`;
  };
  const px = (x, y, col, f = 0) => { if (!col) return; g.fillStyle = varia(col, f); g.fillRect(x, y, 1, 1); };

  const api = {
    canvas: c,
    // rellena una cara (o todas) de una parte; f = variación de tono por píxel (0.03 = suave)
    llenar(parte, color, caras = CARAS6, f = 0.03) {
      for (const cara of [].concat(caras)) {
        const [x, y, w, h] = rectCara(parte, cara);
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(x + i, y + j, color, f);
      }
      return api;
    },
    // franja de filas [y0, y1) en las caras laterales (der, frente, izq, detras)
    franja(parte, y0, y1, color, f = 0.03, caras = ['der', 'frente', 'izq', 'detras']) {
      for (const cara of caras) {
        const [x, y, w] = rectCara(parte, cara);
        for (let j = y0; j < y1; j++) for (let i = 0; i < w; i++) px(x + i, y + j, color, f);
      }
      return api;
    },
    // dibuja filas de caracteres sobre una cara; leyenda: { H: '#color', ... }; '.' = no tocar, ' ' = transparente
    filas(parte, cara, filas, leyenda, f = 0.03, dx = 0, dy = 0) {
      const [x, y] = rectCara(parte, cara);
      filas.forEach((fila, j) => [...fila].forEach((ch, i) => {
        if (ch === '.') return;
        if (ch === ' ') { g.clearRect(x + dx + i, y + dy + j, 1, 1); return; }
        if (leyenda[ch]) px(x + dx + i, y + dy + j, leyenda[ch], f);
      }));
      return api;
    },
    // borra (transparente) una parte entera: útil para capas exteriores
    borrar(parte, caras = CARAS6) {
      for (const cara of [].concat(caras)) { const [x, y, w, h] = rectCara(parte, cara); g.clearRect(x, y, w, h); }
      return api;
    },
    pixel: px,
    // copia del lienzo (para variantes de cara)
    copia() {
      const d = document.createElement('canvas'); d.width = 64; d.height = 64;
      d.getContext('2d').drawImage(c, 0, 0); return d;
    },
    // pinta en otro lienzo (variante de expresión) filas sobre la cara frontal de la cabeza
    variante(filasCabeza, leyenda, filasSombrero = null) {
      const d = api.copia(); const gd = d.getContext('2d');
      const pinta = (parte, filas) => {
        const [x, y] = rectCara(parte, 'frente');
        filas.forEach((fila, j) => [...fila].forEach((ch, i) => {
          if (ch === '.') return;
          if (ch === ' ') { gd.clearRect(x + i, y + j, 1, 1); return; }
          gd.fillStyle = varia(leyenda[ch], 0.02); gd.fillRect(x + i, y + j, 1, 1);
        }));
      };
      pinta('cabeza', filasCabeza); if (filasSombrero) pinta('sombrero', filasSombrero);
      return d;
    },
  };
  return api;
}

// Carga una skin desde una imagen PNG de 64x64 (o 64x32 antigua, que se completa en espejo)
export async function skinDesdeImagen(url) {
  const img = await new Promise((ok, mal) => { const i = new Image(); i.onload = () => ok(i); i.onerror = mal; i.src = url; });
  const c = document.createElement('canvas'); c.width = 64; c.height = 64;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  g.drawImage(img, 0, 0);
  if (img.height === 32) { // formato antiguo: brazo y pierna izquierdos = copia de los derechos
    g.drawImage(img, 0, 16, 16, 16, 16, 48, 16, 16);
    g.drawImage(img, 40, 16, 16, 16, 32, 48, 16, 16);
  }
  return c;
}

export { LAYOUT };
