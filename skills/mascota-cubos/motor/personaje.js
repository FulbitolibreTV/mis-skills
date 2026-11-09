// Personaje de cubos con el formato de "skin" clásico de 64x64 (dos capas).
// Proporciones: cabeza 8x8x8, cuerpo 8x12x4, brazos y piernas 4x12x4. 1 unidad = 1 píxel de la skin.
// El grupo raíz se escala a 1/16, así el personaje mide 2 bloques.
//
// crearPersonaje(THREE, { skin: canvas64, caras: {nombre: canvas64}, extras: fn(THREE, partes, utils) })

// Origen (u,v) y medidas (w,h,d) de cada caja en la skin
export const LAYOUT = {
  cabeza:   { o: [0, 0],   s: [8, 8, 8] },  sombrero: { o: [32, 0],  s: [8, 8, 8] },
  cuerpo:   { o: [16, 16], s: [8, 12, 4] }, chaqueta: { o: [16, 32], s: [8, 12, 4] },
  brazoD:   { o: [40, 16], s: [4, 12, 4] }, mangaD:   { o: [40, 32], s: [4, 12, 4] },
  brazoI:   { o: [32, 48], s: [4, 12, 4] }, mangaI:   { o: [48, 48], s: [4, 12, 4] },
  piernaD:  { o: [0, 16],  s: [4, 12, 4] }, pantD:    { o: [0, 32],  s: [4, 12, 4] },
  piernaI:  { o: [16, 48], s: [4, 12, 4] }, pantI:    { o: [0, 48],  s: [4, 12, 4] },
};

// Rectángulo [x, y, w, h] de una cara de una parte
export function rectCara(parte, cara) {
  const { o: [u, v], s: [w, h, d] } = LAYOUT[parte];
  return {
    arriba: [u + d, v, w, d], abajo: [u + d + w, v, w, d],
    der: [u, v + d, d, h], frente: [u + d, v + d, w, h],
    izq: [u + d + w, v + d, d, h], detras: [u + 2 * d + w, v + d, w, h],
  }[cara];
}

export function crearPersonaje(THREE, op) {
  const SZ = 64;
  const mkTex = (canvas) => {
    const t = new THREE.CanvasTexture(canvas);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false; t.colorSpace = THREE.SRGBColorSpace; t.flipY = true;
    return t;
  };
  const texBase = mkTex(op.skin);
  const matBase = new THREE.MeshLambertMaterial({ map: texBase, alphaTest: 0.5 });
  const matCapa = new THREE.MeshLambertMaterial({ map: texBase, alphaTest: 0.5, side: THREE.DoubleSide });
  const texCaras = {};
  for (const [k, c] of Object.entries(op.caras || {})) texCaras[k] = mkTex(c);
  const matCaraBase = new THREE.MeshLambertMaterial({ map: texBase, alphaTest: 0.5 });
  const matCaraCapa = new THREE.MeshLambertMaterial({ map: texBase, alphaTest: 0.5, side: THREE.DoubleSide });

  // Caja con UV de la skin; corte opcional en altura [y0, y1) (para brazo y antebrazo)
  function caja(parte, inflar = 0, corte = null, mat = null) {
    const { s: [w, h, d] } = LAYOUT[parte];
    const y0 = corte ? corte[0] : 0, y1 = corte ? corte[1] : h;
    const hh = y1 - y0;
    const geo = new THREE.BoxGeometry(w + inflar * 2, hh + inflar * 2, d + inflar * 2);
    const uv = geo.attributes.uv;
    const caras = ['izq', 'der', 'arriba', 'abajo', 'frente', 'detras']; // orden de BoxGeometry: +x,-x,+y,-y,+z,-z
    caras.forEach((c, i) => {
      let [x, y, rw, rh] = rectCara(parte, c);
      if (c === 'izq' || c === 'der' || c === 'frente' || c === 'detras') { y += y0; rh = hh; }
      if (corte && c === 'abajo' && y1 < h) { [x, y, rw, rh] = rectCara(parte, 'frente'); y += y1 - 1; rh = 1; rh = 1; rw = w; }
      if (corte && c === 'arriba' && y0 > 0) { [x, y, rw, rh] = rectCara(parte, 'frente'); y += y0; rh = 1; rw = w; }
      const u0 = x / SZ, u1 = (x + rw) / SZ, vT = 1 - y / SZ, vB = 1 - (y + rh) / SZ;
      let q = [[u0, vT], [u1, vT], [u0, vB], [u1, vB]];
      if (c === 'abajo' && !(corte && y1 < h)) q = [[u0, vB], [u1, vB], [u0, vT], [u1, vT]]; // la cara de abajo va volteada
      q.forEach(([uu, vv], k) => uv.setXY(i * 4 + k, uu, vv));
    });
    uv.needsUpdate = true;
    const m = new THREE.Mesh(geo, mat || (inflar > 0 ? matCapa : matBase));
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }

  const raiz = new THREE.Group();
  const cuerpo = new THREE.Group(); raiz.add(cuerpo);

  // Piernas (cadera en y=12)
  function pierna(base, capa, lado) {
    const piv = new THREE.Group(); piv.position.set(lado * 2, 12, 0);
    const a = caja(base); a.position.y = -6; piv.add(a);
    const b = caja(capa, 0.25); b.position.y = -6; piv.add(b);
    cuerpo.add(piv); return piv;
  }
  const piernaD = pierna('piernaD', 'pantD', -1), piernaI = pierna('piernaI', 'pantI', 1);

  // Tronco
  const tronco = new THREE.Group(); tronco.position.y = 18; cuerpo.add(tronco);
  tronco.add(caja('cuerpo'));
  tronco.add(caja('chaqueta', 0.25));

  // Brazos con codo: hombro en y=22 (el brazo asoma 2 por encima), corte a los 6 píxeles
  function brazo(base, capa, lado) {
    const hombro = new THREE.Group(); hombro.position.set(lado * 6, 22, 0);
    const sup = caja(base, 0, [0, 6]); sup.position.y = -1; hombro.add(sup);
    const supC = caja(capa, 0.25, [0, 6]); supC.position.y = -1; hombro.add(supC);
    const codo = new THREE.Group(); codo.rotation.order = 'YXZ'; codo.position.y = -4; hombro.add(codo);
    const inf = caja(base, 0, [6, 12]); inf.position.y = -3; codo.add(inf);
    const infC = caja(capa, 0.25, [6, 12]); infC.position.y = -3; codo.add(infC);
    cuerpo.add(hombro);
    return { hombro, codo, mano: inf };
  }
  const brazoD = brazo('brazoD', 'mangaD', -1), brazoI = brazo('brazoI', 'mangaI', 1);

  // Cabeza (cuello en y=24)
  const cuello = new THREE.Group(); cuello.position.y = 24; cuerpo.add(cuello);
  const cabeza = new THREE.Group(); cuello.add(cabeza);
  const cab = caja('cabeza', 0, null, matCaraBase); cab.position.y = 4; cabeza.add(cab);
  const som = caja('sombrero', 0.5, null, matCaraCapa); som.position.y = 4; cabeza.add(som);

  // Utilidad para extras: cubito de un color (con sombreado de vóxel)
  const cubo = (w, h, d, color) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
    m.castShadow = true; m.receiveShadow = true; return m;
  };
  const partes = { raiz, cuerpo, tronco, cuello, cabeza, brazoD, brazoI, piernaD, piernaI };
  const animables = [];
  if (op.extras) op.extras(THREE, partes, { cubo, animables });

  // Dedos (pulgar arriba / índice), ocultos por defecto
  const colorPiel = op.colorPiel || '#F2C29A';
  function dedos(br, lado) {
    const pulgar = cubo(1.2, 2.2, 1.2, colorPiel); pulgar.position.set(-lado * 0.0, -4.0, 2.6); pulgar.visible = false; br.codo.add(pulgar);
    const indice = cubo(1.2, 2.4, 1.2, colorPiel); indice.position.set(0, -7.2, 1.1); indice.visible = false; br.codo.add(indice);
    br.pulgar = pulgar; br.indice = indice;
  }
  dedos(brazoD, -1); dedos(brazoI, 1);

  // ---------- caras ----------
  const estado = { pose: 'base', cara: null, salto: 0 };
  function cara(nombre) {
    const t = texCaras[nombre] || texBase;
    matCaraBase.map = t; matCaraCapa.map = t;
    matCaraBase.needsUpdate = true; matCaraCapa.needsUpdate = true;
    estado.cara = nombre;
  }

  // ---------- poses ----------
  const r = (x = 0, y = 0, z = 0) => [x, y, z];
  const POSES = {
    base:            { bD: r(0, 0, -0.06), cD: r(-0.12), bI: r(0, 0, 0.06), cI: r(-0.12), cab: r(0.03), cara: 'feliz' },
    saluda:          { bD: r(0, 0, -0.08), cD: r(-0.15), bI: r(0, 0, 2.55), cI: r(0, 0, 0.45), cab: r(0, -0.12, 0.07), cara: 'feliz' },
    senala_arriba:   { bD: r(0, 0, -2.95), cD: r(0, 0, -0.05), bI: r(0, 0, 0.1), cI: r(-0.15), cab: r(-0.25, 0.12), cara: 'decidido', indiceD: true },
    presenta:        { bD: r(0, 0, -0.08), cD: r(-0.15), bI: r(-0.3, 0, 1.1), cI: r(-0.8, 0, 0), cab: r(0, 0.28, 0.05), cara: 'feliz' },
    pulgar:          { bD: r(-0.35, 0, -0.15), cD: r(-1.35, 0.25, 0), bI: r(0, 0, 0.08), cI: r(-0.12), cab: r(0, -0.1, 0.08), cara: 'guino', pulgarD: true },
    celebra:         { bD: r(0, 0, -2.6), cD: r(0, 0, -0.25), bI: r(0, 0, 2.6), cI: r(0, 0, 0.25), cab: r(-0.15), cara: 'risa', salto: 1.5, pD: r(0.2), pI: r(-0.2) },
    piensa:          { bD: r(-0.35, 0, 0.1), cD: r(-2.25, 0.45, 0), bI: r(-0.2, 0, 0.1), cI: r(-1.35, -1.2, 0), cab: r(0.05, 0.25, 0.15), cara: 'piensa', indiceD: true },
    agobiado:        { bD: r(-2.65, 0, 0.42), cD: r(-1.45, 0, 0), bI: r(-2.65, 0, -0.42), cI: r(-1.45, 0, 0), cab: r(0.14), cara: 'agobio' },
    sorpresa:        { bD: r(0, 0, -0.55), cD: r(-0.3), bI: r(0, 0, 0.55), cI: r(-0.3), cab: r(-0.12), cara: 'sorpresa', cuerpoRx: -0.05 },
    senala_camara:   { bD: r(-1.45, 0.12, 0), cD: r(-0.1), bI: r(0, 0, 0.08), cI: r(-0.12), cab: r(0, 0, -0.05), cara: 'guino', indiceD: true },
    brazos_cruzados: { bD: r(-0.25, 0, 0.1), cD: r(-1.35, 1.25, 0), bI: r(-0.42, 0, -0.1), cI: r(-1.45, -1.25, 0), cab: r(0, 0, 0.07), cara: 'decidido' },
    camina:          { bD: r(0.5, 0, -0.06), cD: r(-0.2), bI: r(-0.5, 0, 0.06), cI: r(-0.2), cab: r(0.03), cara: 'feliz', pD: r(-0.5), pI: r(0.5) },
  };
  if (op.poses) Object.assign(POSES, op.poses);

  function mezcla(a, b, k = 1) {
    const A = POSES[a] || POSES.base, B = POSES[b] || POSES.base;
    const e = k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k);
    const L = (u = [0, 0, 0], v = [0, 0, 0]) => u.map((x, i) => x + (v[i] - x) * e);
    const set = (obj, ua, va) => { const q = L(ua, va); obj.rotation.set(q[0], q[1], q[2]); };
    // En un giro grande del hombro con el codo doblado, la mano cruzaría la cara: el codo se estira a mitad del gesto.
    const dif = (u = [0, 0, 0], v = [0, 0, 0]) => Math.max(...u.map((x, i) => Math.abs(v[i] - x)));
    const doblado = (c = [0, 0, 0]) => Math.max(Math.abs(c[0]), Math.abs(c[1])) > 0.9;
    const codo = (obj, hA, hB, cA, cB) => {
      if (a === b || dif(hA, hB) < 1.2 || !(doblado(cA) || doblado(cB))) return set(obj, cA, cB);
      const recto = [-0.15, 0, 0], m = (u = [0, 0, 0], v, s) => u.map((x, i) => x + (v[i] - x) * s);
      const q = e < 0.5 ? m(cA, recto, e * 2) : m(recto, cB || [0, 0, 0], (e - 0.5) * 2);
      obj.rotation.set(q[0], q[1], q[2]);
    };
    set(brazoD.hombro, A.bD, B.bD); codo(brazoD.codo, A.bD, B.bD, A.cD, B.cD);
    set(brazoI.hombro, A.bI, B.bI); codo(brazoI.codo, A.bI, B.bI, A.cI, B.cI);
    set(cuello, A.cab, B.cab); set(piernaD, A.pD, B.pD); set(piernaI, A.pI, B.pI);
    const fin = e >= 0.5 ? B : A;
    brazoD.pulgar.visible = !!fin.pulgarD; brazoD.indice.visible = !!fin.indiceD;
    brazoI.pulgar.visible = !!fin.pulgarI; brazoI.indice.visible = !!fin.indiceI;
    cuerpo.rotation.x = (A.cuerpoRx || 0) + ((B.cuerpoRx || 0) - (A.cuerpoRx || 0)) * e;
    estado.pose = e >= 0.5 ? b : a;
    estado.salto = (A.salto || 0) + ((B.salto || 0) - (A.salto || 0)) * e;
    const c = fin.cara || 'feliz';
    if (estado.cara !== c) cara(c);
  }
  const pose = (n) => mezcla(n, n, 1);

  // Movimiento tranquilo: respiración y balanceo leve; los extras animables (cintas, colas) ondean
  function animar(t) {
    cuerpo.position.y = estado.salto + Math.sin(t * 2.4) * 0.15;
    cabeza.rotation.z = Math.sin(t * 1.3) * 0.02;
    animables.forEach((f) => f(t));
  }

  raiz.scale.setScalar(1 / 16);
  pose('base');
  return { grupo: raiz, pose, mezcla, cara, animar, poses: Object.keys(POSES), caras: Object.keys(texCaras), partes };
}
