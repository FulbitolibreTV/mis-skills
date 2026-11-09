// Constructor de mascotas de cubos a partir de una descripción sencilla (sin pintar píxel a píxel).
// crearMascota(THREE, ficha) → personaje con poses y caras.
//
// ficha = {
//   tipo: 'humano' | 'animal',
//   piel: '#F2C29A',                         // humano: color de piel · animal: pelaje
//   pelo: { color: '#4A2F1E', estilo: 'corto' | 'largo' | 'calvo' | 'coleta' | 'dos_coletas' | 'mono' | 'puntas' },   // solo humano
//   animal: { orejas: 'gato'|'perro'|'oso'|'conejo', hocico: '#FFF3E6', nariz: '#E8798A', cola: true, rayas: '#hex' },
//   ojos: '#1B1B22', boca: '#8A3A2E', mejillas: true,
//   torso: { color: '#FFFFFF', manga: 'corta'|'larga'|'sin', capucha: false, dibujo: ['....', ...] (filas de 8, opcional), leyenda: {X:'#hex'} },
//   piernas: { color: '#2B2E3A', largo: true },
//   zapatos: { color: '#1B1B20', suela: '#F2F2F2' },
//   accesorios: ['gorro_chef', 'gorra:#E23B3B', 'gafas:#1B1B22', 'auriculares:#2B2E3A', 'cinta:#FF7A1A', 'delantal:#FFFFFF', 'pajarita:#E23B3B', 'casco', 'corona'],
//   cubos: [{ parte: 'cabeza', pos: [0, 10, 0], tam: [2, 2, 2], color: '#hex' }],   // bloques 3D libres (cabeza: 0–8 de alto, centro x/z = 0)
//   retoques: [{ parte: 'cuerpo', cara: 'frente', filas: ['........', '..XX....'], leyenda: { X: '#hex' } }],  // píxeles a mano
//   semilla: 7,
// }
import { crearPersonaje } from '../personaje.js';
import { nuevaSkin } from '../skin.js';

const rev = (a) => a.map((f) => [...f].reverse().join(''));
const oscurecer = (hex, f = 0.85) => {
  const n = parseInt(hex.slice(1), 16), c = (v) => Math.max(0, Math.min(255, Math.round(v * f)));
  return '#' + [c((n >> 16) & 255), c((n >> 8) & 255), c(n & 255)].map((v) => v.toString(16).padStart(2, '0')).join('');
};

export function crearMascota(THREE, f) {
  const animal = f.tipo === 'animal';
  const piel = f.piel || (animal ? '#E8A15A' : '#F2C29A');
  const pelo = f.pelo || { color: '#4A2F1E', estilo: 'corto' };
  const torso = f.torso || { color: '#FFFFFF', manga: 'corta' };
  const piernas = f.piernas || { color: '#2B2E3A', largo: true };
  const zap = f.zapatos || { color: '#1B1B20', suela: '#F2F2F2' };
  const acc = (f.accesorios || []).map((a) => { const [n, c] = a.split(':'); return { n, c }; });
  const tiene = (n) => acc.find((a) => a.n === n);
  const k = {
    S: piel, s: oscurecer(piel, 0.88), H: animal ? piel : pelo.color, h: oscurecer(animal ? piel : pelo.color, 0.82),
    L: animal ? oscurecer(piel, 1.08) : oscurecer(pelo.color, 1.15),
    N: f.ojos || '#1B1B22', W: '#FFFFFF', M: f.boca || '#8A3A2E', m: oscurecer(f.boca || '#8A3A2E', 0.7), R: '#D9584B',
    P: f.mejillas === false ? piel : '#EE9F8C', E: oscurecer(animal ? piel : pelo.color, 0.7),
    A: f.animal?.hocico || '#FFF3E6', n: f.animal?.nariz || '#E8798A', Y: f.animal?.rayas || oscurecer(piel, 0.75),
    C: torso.color, c: oscurecer(torso.color, 0.88), K: piernas.color, k: oscurecer(piernas.color, 0.85),
    Z: zap.color, U: zap.suela || '#F2F2F2', D: '#8FD3FF',
    ...(torso.leyenda || {}),
  };
  const sk = nuevaSkin(f.semilla || 7);

  // ---------- cabeza ----------
  let frente, lado, detras, arriba = Array(8).fill('HHHHHHHH');
  if (animal) {
    frente = ['HHHHHHHH', 'HHHHHHHH', 'HHHHHHHH', 'HHHHHHHH', 'HWNHHNWH', 'HHAnnAHH', 'PHAMMAHP', 'HHHHHHHH'];
    if (f.animal?.rayas) frente[0] = 'HYHHHHYH', frente[1] = 'HHYHHYHH';
    lado = Array(8).fill('HHHHHHHH'); detras = Array(8).fill('HHHHHHHH');
  } else if (pelo.estilo === 'calvo') {
    frente = ['SSSSSSSS', 'SSSSSSSS', 'SSSSSSSS', 'SEESSEES', 'SWNSSNWS', 'SSSssSSS', 'PSSMMSSP', 'ssssssss'];
    lado = ['SSSSSSSS', 'SSSSSSSS', 'SSSSSSSS', 'SSSSSSSS', 'SSSSsSSS', 'SSSSsSSS', 'SSSSSSSS', 'ssssssss'];
    detras = Array(7).fill('SSSSSSSS').concat(['ssssssss']); arriba = Array(8).fill('SSSSSSSS');
  } else {
    frente = ['HHHHHHHH', 'HHHHHHHH', 'HhHHHHhH', 'hEESSEEh', 'SWNSSNWS', 'SSSssSSS', 'PSSMMSSP', 'ssssssss'];
    lado = ['HHHHHHHH', 'HHHHHHHH', 'HHHHHHHH', 'HHHHHHSh', 'HHHHsSSh', 'HHHhsSSS', 'hhhSSSSS', 'ssssssss'];
    detras = ['HHHHHHHH', 'HHHHHHHH', 'HHHHHHHH', 'HHHHHHHH', 'HHHHHHHH', 'HHHHHHHH', 'hhhhhhhh', 'ssssssss'];
    if (pelo.estilo === 'largo') {
      frente[3] = 'HEESSEEH'; frente[4] = 'HWNSSNWH'; frente[5] = 'HSSssSSH'; frente[6] = 'HSSMMSSH'; frente[7] = 'HssssssH';
      lado = Array(8).fill('HHHHHHHH'); detras = Array(8).fill('HHHHHHHH');
    }
  }
  sk.filas('cabeza', 'frente', frente, k);
  sk.filas('cabeza', 'der', lado, k); sk.filas('cabeza', 'izq', rev(lado), k);
  sk.filas('cabeza', 'detras', detras, k); sk.filas('cabeza', 'arriba', arriba, k, 0.05);
  sk.llenar('cabeza', animal ? k.h : k.s, 'abajo');
  // capa exterior: volumen de pelo
  if (!animal && pelo.estilo !== 'calvo') {
    sk.filas('sombrero', 'frente', ['LHHLHHLH', 'HH  H  H', '        ', '        ', '        ', '        ', '        ', '        '], k);
    const sd = pelo.estilo === 'largo'
      ? ['HLHHHLHH', 'HHHHHHHH', 'HHHHHHH ', 'HHHHHHH ', 'HHHHHH  ', 'HHHHHH  ', 'HHHHH   ', 'HHHH    ']
      : ['HLHHHLHH', 'HHHH    ', 'HHH     ', 'HH      ', '        ', '        ', '        ', '        '];
    sk.filas('sombrero', 'der', sd, k); sk.filas('sombrero', 'izq', rev(sd), k);
    sk.filas('sombrero', 'detras', pelo.estilo === 'largo' ? Array(8).fill('HHHHHHHH') : ['HHLHHHLH', 'HHHHHHHH', 'HHHHHHHH', 'hHHHHHHh', 'H HHH HH', '        ', '        ', '        '], k);
    sk.filas('sombrero', 'arriba', ['HHLHHHHL', 'LHHHHLHH', 'HHHHHHHH', 'HHLHHHLH', 'HHHHHHHH', 'HLHHLHHH', 'HHHHHHHH', 'LHHHLHHH'], k, 0.05);
  }
  const cinta = tiene('cinta');
  if (cinta) { k.O = cinta.c || '#FF7A1A'; for (const c of ['frente', 'der', 'izq', 'detras']) sk.filas('sombrero', c, ['........', 'OOOOOOOO'], k); }
  const gafas = tiene('gafas');
  if (gafas) { k.G = gafas.c || '#1B1B22'; sk.filas('sombrero', 'frente', ['', '', '', '', 'GGGGGGGG', '.GG..GG.'], k); }

  // ---------- torso ----------
  const C = torso.color;
  const pecho = Array(12).fill('CCCCCCCC');
  if (!animal) { pecho[0] = 'CCCSSCCC'; pecho[1] = 'CCCccCCC'; }
  pecho[11] = 'cccccccc';
  if (torso.dibujo) torso.dibujo.forEach((fila, i) => { pecho[3 + i] = [...pecho[3 + i]].map((ch, j) => (fila[j] && fila[j] !== '.' ? fila[j] : ch)).join(''); });
  sk.filas('cuerpo', 'frente', pecho, k, 0.02);
  sk.llenar('cuerpo', C, ['der', 'izq', 'detras'], 0.02); sk.franja('cuerpo', 11, 12, k.c, 0.02, ['der', 'izq', 'detras']);
  sk.filas('cuerpo', 'arriba', animal ? Array(4).fill('CCCCCCCC') : ['CCCCCCCC', 'CCCSSCCC', 'CCCSSCCC', 'CCCCCCCC'], k);
  sk.llenar('cuerpo', k.c, 'abajo');
  if (torso.bajo !== false && !tiene('peto')) { sk.franja('chaqueta', 10, 11, C, 0.02); sk.franja('chaqueta', 11, 12, k.c, 0.02); }
  if (torso.capucha) { // capucha caída detrás + cordones
    sk.filas('chaqueta', 'detras', ['CCCCCCCC', 'CCCCCCCC', 'cCCCCCCc', ' cCCCCc '], k);
    sk.filas('cuerpo', 'frente', ['........', '..W..W..', '..W..W..'], k);
  }
  const delantal = tiene('delantal');
  if (delantal) { k.Q = delantal.c || '#FFFFFF'; sk.filas('chaqueta', 'frente', ['  Q  Q  ', '  QQQQ  ', ' QQQQQQ ', ' QQQQQQ ', ' QQQQQQ ', ' QQQQQQ ', ' QQQQQQ ', ' QQQQQQ ', ' QQQQQQ ', ' QQQQQQ ', 'QQQQQQQQ', 'QQQQQQQQ'], k); }
  const peto = tiene('peto');
  if (peto) { // peto: tirantes y babero delante, cintura por detrás y por los lados
    k.V = peto.c || '#3B5BA5'; k.v = oscurecer(k.V, 0.85); k.b = '#E8C25A';
    sk.filas('cuerpo', 'frente', ['.V....V.', '.V....V.', '.V....V.', '.VbVVbV.', '.VVVVVV.', '.VVVVVV.', '.VVvvVV.', '.VVVVVV.', 'VVVVVVVV', 'VVVVVVVV', 'VVVVVVVV', 'vvvvvvvv'], k);
    sk.filas('cuerpo', 'detras', ['..V..V..', '..V..V..', '...VV...', '...VV...', '..V..V..', '.V....V.', 'VVVVVVVV', 'VVVVVVVV', 'VVVVVVVV', 'VVVVVVVV', 'VVVVVVVV', 'vvvvvvvv'], k);
    for (const c of ['der', 'izq']) sk.filas('cuerpo', c, ['....', '....', '....', '....', '....', '....', '....', '....', 'VVVV', 'VVVV', 'VVVV', 'vvvv'], k);
  }
  const paj = tiene('pajarita');
  if (paj) { k.B = paj.c || '#E23B3B'; sk.filas('cuerpo', 'frente', ['........', '..BBBB..', '...BB...'], k); }

  // ---------- brazos ----------
  const manga = torso.manga || 'corta';
  for (const [b, m] of [['brazoD', 'mangaD'], ['brazoI', 'mangaI']]) {
    const hasta = animal && manga === 'sin' ? 0 : manga === 'larga' ? 11 : manga === 'sin' ? 0 : 4;
    if (hasta > 0) { sk.franja(b, 0, hasta - 1, C, 0.02); sk.franja(b, hasta - 1, hasta, k.c, 0.02); sk.llenar(b, C, 'arriba'); }
    else sk.llenar(b, piel, 'arriba');
    sk.franja(b, hasta, 12, piel, 0.02); sk.franja(b, 11, 12, k.s, 0.02); sk.llenar(b, k.s, 'abajo');
    if (hasta > 0) { sk.franja(m, 0, hasta - 1, C, 0.02); sk.franja(m, hasta - 1, hasta, k.c, 0.02); }
  }
  // ---------- piernas ----------
  for (const [p, q] of [['piernaD', 'pantD'], ['piernaI', 'pantI']]) {
    const fin = piernas.largo === false ? 5 : 9;
    sk.franja(p, 0, fin - 1, piernas.color, 0.02); sk.franja(p, fin - 1, fin, k.k, 0.02);
    sk.franja(p, fin, 9, piel, 0.02); sk.franja(p, 9, 11, zap.color, 0.02); sk.franja(p, 11, 12, k.U, 0.01);
    sk.llenar(p, piernas.color, 'arriba'); sk.llenar(p, k.U, 'abajo');
    sk.franja(q, 9, 11, zap.color, 0.02); sk.franja(q, 11, 12, k.U, 0.01);
    if (piernas.largo === false) sk.franja(q, 0, 4, piernas.color, 0.02);
  }

  // ---------- retoques a mano: [{ parte, cara, filas, leyenda }] (se pintan encima) ----------
  for (const r of f.retoques || []) sk.filas(r.parte, r.cara, r.filas, { ...k, ...(r.leyenda || {}) }, 0.01);

  // ---------- expresiones ----------
  const filas = animal ? {
    feliz: null,
    sorpresa: ['HHHHHHHH', 'HWNHHNWH', 'HHAnnAHH', 'PHAmmAHP', 'HHHmmHHH'],
    guino: ['HHHHHHHH', 'HWNHHNWH', 'HHAnnAHH', 'PHAMMMHP', 'HHHHHHHH'],
    risa: ['HHHHHHHH', 'HWNHHNWH', 'HHAnnAHH', 'PHWWWWHP', 'HHmRRmHH'],
    agobio: ['HEHHHHEH', 'HWNHHNWH', 'HHAnnAHH', 'PHMMMMHP', 'HMHHHHMH'],
    piensa: ['HEEHHHHH', 'HNWHHNWH', 'HHAnnAHH', 'PHAAMMHP', 'HHHHHHHH'],
    decidido: ['HHEEHEEH', 'HWNHHNWH', 'HHAnnAHH', 'PHMMMMHP', 'HHHHHHHH'],
  } : {
    feliz: null,
    sorpresa: ['hEESSEEh', 'SWNSSNWS', 'SSSssSSS', 'PSSmmSSP', 'sssmmsss'],
    guino: ['hEESSEEh', 'SWNSSNWS', 'SSSssSSS', 'PSSMMMSP', 'ssssssss'],
    risa: ['hEESSEEh', 'SWNSSNWS', 'SSSssSSS', 'PSWWWWSP', 'ssmRRmss'],
    agobio: ['hESSSSEh', 'SWNSSNWS', 'SSSssSSS', 'PSMMMMSP', 'sMssssMs'],
    piensa: ['hEESSSSh', 'SNWSSNWS', 'SSSssSSS', 'PSSSMMSP', 'ssssssss'],
    decidido: ['hSEESEEh', 'SWNSSNWS', 'SSSssSSS', 'PSMMMMSP', 'ssssssss'],
  };
  if (!animal && (pelo.estilo === 'calvo' || pelo.estilo === 'largo')) {
    const borde = pelo.estilo === 'calvo' ? 'S' : 'H';
    for (const n in filas) if (filas[n]) filas[n] = filas[n].map((r) => borde + r.slice(1, 7) + borde);
  }
  const caras = { feliz: sk.copia() };
  for (const [n, r] of Object.entries(filas)) if (r) caras[n] = sk.variante(['.', '.', '.', ...r], k, n === 'agobio' ? ['.', '.', '.', '.', '.......D', '.......D'] : null);

  return crearPersonaje(THREE, {
    skin: sk.canvas, caras, colorPiel: piel,
    extras(THREE, partes, { cubo, animables }) {
      const cab = partes.cabeza;
      const pon = (m, x, y, z, padre = cab) => { m.position.set(x, y, z); padre.add(m); return m; };
      // orejas de animal
      const o = f.animal?.orejas;
      if (animal && o) {
        const interior = f.animal?.hocico || '#FFD7D0';
        const forma = { gato: [[2.4, 2.0, 1.2], [1.4, 1.2, 1.2]], perro: [[2.4, 3.6, 1.0]], oso: [[2.4, 2.2, 1.2]], conejo: [[1.8, 5.0, 1.0]] }[o] || [[2.4, 2.0, 1.2]];
        for (const lado of [-1, 1]) {
          if (o === 'perro') { const e = cubo(1.0, 3.6, 2.4, oscurecer(piel, 0.8)); pon(e, lado * 4.5, 5.2, 0); continue; }
          const [w, h, d] = forma[0];
          pon(cubo(w, h, d, piel), lado * 2.6, 8 + h / 2, -0.5);
          if (forma[1]) pon(cubo(forma[1][0], forma[1][1], 0.3, interior), lado * 2.6, 8 + forma[1][1] / 2 + 0.4, 0.2);
          else if (o === 'conejo') pon(cubo(0.9, 3.8, 0.3, interior), lado * 2.6, 8 + 2.6, 0.0);
        }
      }
      if (animal && f.animal?.cola !== false) {
        const piv = new THREE.Group(); piv.position.set(0, 13, -2.2); partes.cuerpo.add(piv);
        const largo = o === 'conejo' ? 1.6 : o === 'oso' ? 1.4 : 6;
        const cola = cubo(1.4, 1.4, largo, piel); cola.geometry.translate(0, 0, -largo / 2); cola.rotation.x = -0.6; piv.add(cola);
        animables.push((t) => { piv.rotation.y = Math.sin(t * 3) * 0.35; });
      }
      if (f.animal?.bigotes) for (const lado of [-1, 1]) pon(cubo(2.2, 0.25, 0.2, '#3A3A3A'), lado * 4.2, 2.6, 4.1);
      // accesorios
      if (tiene('gorro_chef')) { pon(cubo(8.6, 1.4, 8.6, '#FFFFFF'), 0, 8.7, 0); pon(cubo(9.6, 4.2, 9.6, '#F7F7F7'), 0, 11.4, 0); }
      const gorra = tiene('gorra');
      if (gorra) { const c = gorra.c || '#E23B3B'; pon(cubo(8.8, 3, 8.8, c), 0, 7.6, 0); pon(cubo(8.4, 0.6, 4, oscurecer(c, 0.85)), 0, 6.4, 5.8); }
      const auri = tiene('auriculares');
      if (auri) { const c = auri.c || '#2B2E3A'; pon(cubo(9.2, 1, 1.4, c), 0, 9.0, 0); for (const l of [-1, 1]) pon(cubo(1.4, 3, 3, c), l * 4.8, 4.2, 0); }
      const somb = tiene('sombrero');
      if (somb) { // sombrero de ala ancha (paja por defecto); segundo color = cinta
        const [, c1, c2] = (f.accesorios.find((a) => a.startsWith('sombrero')) + '::').split(':');
        const paja = c1 || '#E6C677', cinta = c2 || '#B5452F';
        pon(cubo(15, 0.8, 15, oscurecer(paja, 0.95)), 0, 8.4, 0);
        pon(cubo(9.4, 3.4, 9.4, paja), 0, 10.4, 0);
        pon(cubo(9.6, 0.9, 9.6, cinta), 0, 9.3, 0);
      }
      if (tiene('corona')) { const c = '#F5C542'; pon(cubo(7, 1.2, 7, c), 0, 8.7, 0); for (const [x, z] of [[-3, 3], [3, 3], [0, 3], [-3, -3], [3, -3]]) pon(cubo(1.2, 1.4, 1.2, c), x, 10, z); }
      // peinados con volumen (sobre la base de pelo corto)
      if (!animal) {
        const ph = pelo.color || '#4A2F1E', ps = oscurecer(ph, 0.8), est = pelo.estilo;
        if (est === 'coleta') { // coleta atrás que se balancea
          pon(cubo(2.2, 2.2, 1.2, ps), 0, 5.6, -4.5);
          const piv = new THREE.Group(); piv.position.set(0, 5.2, -5.0); cab.add(piv);
          const c = cubo(2.4, 5.4, 1.8, ph); c.geometry.translate(0, -2.7, 0); piv.add(c); piv.rotation.x = 0.28;
          animables.push((t) => { piv.rotation.z = Math.sin(t * 2.2) * 0.12; });
        }
        if (est === 'dos_coletas') for (const l of [-1, 1]) {
          pon(cubo(1.4, 1.6, 1.6, ps), l * 4.5, 5.4, -1.2);
          const piv = new THREE.Group(); piv.position.set(l * 5.0, 5.0, -1.2); cab.add(piv);
          const c = cubo(1.8, 4.6, 1.8, ph); c.geometry.translate(0, -2.3, 0); piv.add(c); piv.rotation.z = l * 0.18;
          animables.push((t) => { piv.rotation.z = l * (0.18 + Math.sin(t * 2.4 + l) * 0.08); });
        }
        if (est === 'mono') { pon(cubo(3.4, 2.6, 3.4, ph), 0, 9.3, -1.6); pon(cubo(3.6, 0.6, 3.6, ps), 0, 8.2, -1.6); }
        if (est === 'puntas') { // pelo de punta con un mechón hacia arriba
          for (const [x, y, z, w, h, d, rz] of [[-2.4, 8.8, 0.8, 2.2, 1.8, 2.4, 0.25], [0.6, 9.6, 1.4, 2.4, 3.2, 2.4, -0.2], [2.8, 8.7, -0.6, 2.0, 1.6, 2.2, -0.35], [-0.8, 8.6, -2.4, 2.4, 1.4, 2.4, 0.1]])
            pon(cubo(w, h, d, ph), x, y, z).rotation.z = rz;
        }
      }
      for (const q of f.cubos || []) { // bloques libres: { parte, pos: [x,y,z], tam: [w,h,d], color, giro: [rx,ry,rz] }
        const padre = { cabeza: cab, cuerpo: partes.tronco, tronco: partes.tronco, brazoD: partes.brazoD.codo, brazoI: partes.brazoI.codo, piernaD: partes.piernaD, piernaI: partes.piernaI }[q.parte || 'cabeza'] || cab;
        const m = cubo(...(q.tam || [1, 1, 1]), q.color || '#FFFFFF'); m.position.set(...(q.pos || [0, 0, 0])); if (q.giro) m.rotation.set(...q.giro); padre.add(m);
      }
      if (tiene('casco')) {
        const vidrio = new THREE.Mesh(new THREE.BoxGeometry(11, 11, 11), new THREE.MeshLambertMaterial({ color: '#BFE3FF', transparent: true, opacity: 0.28, depthWrite: false }));
        pon(vidrio, 0, 4.2, 0); pon(cubo(11.4, 1.6, 11.4, '#E6E6E6'), 0, -1.3, 0);
      }
    },
  });
}
