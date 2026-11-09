// Paisaje de bloques propio (colinas en terrazas, árboles, flores, nubes de cubos).
// Paleta propia y texturas propias: estilo vóxel genérico, sin texturas ni logos de ningún juego.

export const CIELOS = {
  dia:        { arriba: '#4FA3F0', abajo: '#CDE9FF', niebla: '#CFE6F7', sol: '#FFFFFF', luz: 1.0, nube: '#FFFFFF' },
  atardecer:  { arriba: '#E77FA0', abajo: '#FFC98A', niebla: '#F5C2A5', sol: '#FFE2B0', luz: 0.9, nube: '#F6B9B0' },
  noche:      { arriba: '#0E1B33', abajo: '#2B3F6E', niebla: '#22345C', sol: '#9DB6FF', luz: 0.45, nube: '#5A6C99' },
};

export function crearMundo(THREE, scene, op = {}) {
  const cielo = CIELOS[op.cielo || 'dia'];
  let semilla = op.semilla || 11;
  const rnd = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
  const tex = (w, h, f) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); f(g, w, h);
    const t = new THREE.CanvasTexture(c);
    t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  const tono = (hex, f) => { const c = new THREE.Color(hex); c.offsetHSL(0, 0, f); return '#' + c.getHexString(); };
  const ruido = (g, w, h, col, a = 0.05) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { g.fillStyle = tono(col, (rnd() - .5) * a * 2); g.fillRect(x, y, 1, 1); } };

  // Cielo con degradado
  scene.background = tex(4, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, cielo.arriba); gr.addColorStop(1, cielo.abajo);
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  scene.background.magFilter = THREE.LinearFilter;
  scene.fog = new THREE.Fog(cielo.niebla, 22, 75);

  // Luces
  const hemi = new THREE.HemisphereLight('#EAF4FF', '#7A8F5A', 1.15 * cielo.luz); scene.add(hemi);
  const sol = new THREE.DirectionalLight(cielo.sol, 2.0 * cielo.luz);
  sol.position.set(-6, 12, 9); sol.castShadow = true;
  sol.shadow.mapSize.set(op.sombra || 1024, op.sombra || 1024);
  Object.assign(sol.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 40 });
  sol.shadow.bias = -0.0008; sol.shadow.radius = 4;
  scene.add(sol);
  const relleno = new THREE.DirectionalLight('#FFE9D2', 0.5 * cielo.luz); relleno.position.set(8, 4, 6); scene.add(relleno);
  const contra = new THREE.DirectionalLight(cielo.sol, 0.8 * cielo.luz); contra.position.set(4, 7, -9); scene.add(contra);

  // Texturas de bloque (16x16)
  const verde = op.hierba || '#6CC24A';
  const tHierba = tex(16, 16, (g) => { ruido(g, 16, 16, verde, .025); g.fillStyle = tono(verde, .04); g.fillRect(0, 0, 16, 1); g.fillRect(0, 0, 1, 16); });
  const tLado = tex(16, 16, (g) => {
    ruido(g, 16, 16, '#B98457', .03);
    g.fillStyle = tono(verde, -0.04); g.fillRect(0, 0, 16, 4);
    for (let x = 0; x < 16; x += 2) if (rnd() < .5) g.fillRect(x, 4, 2, 1);
    g.fillStyle = tono('#B98457', -0.06); g.fillRect(0, 15, 16, 1);
  });
  const tTierra = tex(16, 16, (g) => ruido(g, 16, 16, '#B98457', .03));
  const tTronco = tex(16, 16, (g) => { ruido(g, 16, 16, '#8A6340', .03); for (let x = 2; x < 16; x += 4) { g.fillStyle = '#634428'; g.fillRect(x, 0, 1, 16); } });
  const tHoja = tex(16, 16, (g) => { ruido(g, 16, 16, '#5BB446', .05); g.fillStyle = '#6FC458'; g.fillRect(0, 0, 16, 1); });
  const tCamino = tex(16, 16, (g) => ruido(g, 16, 16, '#E2C48F', .03));
  const L = (map) => new THREE.MeshLambertMaterial({ map });
  const matBloque = [L(tLado), L(tLado), L(tHierba), L(tTierra), L(tLado), L(tLado)];
  const matCamino = [L(tLado), L(tLado), L(tCamino), L(tTierra), L(tLado), L(tLado)];

  // Mapa de alturas: pradera plana delante, terrazas detrás y a los lados
  const N = 48, H = {};
  const alt = (x, z) => {
    if (z > -6 && Math.abs(x) < 10) return 0;
    const lomaI = 9 - Math.hypot((x + 10) * 0.75, (z + 16) * 0.6) * 0.75;
    const lomaD = 8 - Math.hypot((x - 11) * 0.7, (z + 13) * 0.65) * 0.75;
    const fondo = 11 - Math.hypot(x * 0.35, (z + 34) * 0.5) * 0.6;
    const n = Math.sin(x * 0.55 + z * 0.2) * 0.9 + Math.cos(z * 0.7 - x * 0.35) * 0.8 + Math.sin(x * 1.7 + z * 1.3) * 0.35;
    const v = Math.max(lomaI, lomaD, fondo, 0) + (Math.max(lomaI, lomaD, fondo) > 0.5 ? n : 0);
    return Math.max(0, Math.floor(v));
  };
  const caminos = (x, z) => Math.abs(z - 3 - Math.sin(x * 0.25) * 0.8) < 0.6 && Math.abs(x) > 3;
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const pos = [], posCam = [];
  for (let x = -N / 2; x < N / 2; x++) for (let z = -N; z < 12; z++) {
    const h = alt(x, z); H[x + ',' + z] = h;
  }
  const get = (x, z) => H[x + ',' + z] ?? 0;
  for (let x = -N / 2; x < N / 2; x++) for (let z = -N; z < 12; z++) {
    const h = get(x, z);
    const minV = Math.min(get(x + 1, z), get(x - 1, z), get(x, z + 1), get(x, z - 1), h);
    for (let y = Math.max(minV, h - 1) - 1; y < h; y++) {
      if (y < h - 1 || y < -1) continue;
    }
    for (let y = Math.min(minV, h) ; y <= h; y++) (caminos(x, z) && h === 0 ? posCam : pos).push([x, y - 0.5, z]);
  }
  const inst = (arr, mat, sombra = false) => {
    const m = new THREE.InstancedMesh(geo, mat, arr.length);
    const o = new THREE.Object3D();
    arr.forEach((p, i) => { o.position.set(p[0], p[1], p[2]); o.updateMatrix(); m.setMatrixAt(i, o.matrix); });
    m.receiveShadow = true; m.castShadow = sombra; scene.add(m); return m;
  };
  inst(pos, matBloque); inst(posCam, matCamino);

  // Árboles
  const troncos = [], hojas = [];
  const arbol = (x, z) => {
    const h = get(x, z), alto = 3 + Math.floor(rnd() * 2);
    for (let y = 0; y < alto; y++) troncos.push([x, h + y + 0.5, z]);
    const top = h + alto;
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (let dy = 0; dy < 2; dy++) {
      if (dy === 1 && Math.abs(dx) + Math.abs(dz) === 2) continue;
      hojas.push([x + dx, top + dy - 0.5, z + dz]);
    }
    hojas.push([x, top + 1.5, z]);
  };
  [[-9, -13], [-14, -9], [-5, -20], [8, -11], [13, -15], [5, -24], [-18, -18], [17, -8], [-11, -27], [11, -30], [0, -33], [-21, -10], [21, -20]].forEach(([x, z]) => arbol(x, z));
  inst(troncos, L(tTronco), true); inst(hojas, L(tHoja), true);

  // Flores y matas de hierba
  const flores = [];
  for (let i = 0; i < 140; i++) {
    const x = Math.floor((rnd() - .5) * N), z = Math.floor(-rnd() * 40 + 10);
    if (Math.abs(x) < 3 && z > -2) continue;
    flores.push([x + (rnd() - .5) * .6, get(x, z), z + (rnd() - .5) * .6, ['#E8423B', '#F7D23E', '#FFFFFF', '#B9E26B'][Math.floor(rnd() * 4)]]);
  }
  const gFlor = new THREE.BoxGeometry(0.22, 0.22, 0.22), gTallo = new THREE.BoxGeometry(0.06, 0.3, 0.06);
  const o3 = new THREE.Object3D();
  const instancias = (geo, mat, pts) => {
    const m = new THREE.InstancedMesh(geo, mat, pts.length);
    pts.forEach((p, i) => { o3.position.set(p[0], p[1], p[2]); o3.updateMatrix(); m.setMatrixAt(i, o3.matrix); });
    scene.add(m);
  };
  instancias(gTallo, new THREE.MeshLambertMaterial({ color: '#3F8F2C' }), flores.map(([x, y, z]) => [x, y + 0.15, z]));
  for (const c of ['#E8423B', '#F7D23E', '#FFFFFF', '#B9E26B']) instancias(gFlor, new THREE.MeshLambertMaterial({ color: c }), flores.filter((f) => f[3] === c).map(([x, y, z]) => [x, y + 0.36, z]));

  // Nubes de cubos
  const nubes = new THREE.Group(); scene.add(nubes);
  const mNube = new THREE.MeshLambertMaterial({ color: cielo.nube, emissive: cielo.nube, emissiveIntensity: 0.35, fog: false });
  const nubeDatos = [[-9, 15, -26, 3.2], [7, 17, -32, 4], [-1, 19, -40, 3], [14, 14, -22, 2.4], [-16, 13, -20, 2], [4, 13.5, -18, 1.6], [-5, 16.5, -24, 1.4]];
  nubeDatos.forEach(([x, y, z, s]) => {
    const g = new THREE.Group(); g.position.set(x, y, z);
    const n = 1 + Math.floor(rnd() * 3);
    for (let i = 0; i < n; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(s, s * .9, s), mNube); b.position.set(i * s * .7 - n * s * .3, (rnd() - .5) * s * .3, (rnd() - .5) * s * .5); g.add(b); }
    g.userData.v = 0.15 + rnd() * 0.2; g.rotation.y = rnd() * 0.6; nubes.add(g);
  });

  function animar(t) {
    nubes.children.forEach((n, i) => { n.position.x += 0; n.userData.x0 ??= n.position.x; n.position.x = n.userData.x0 + Math.sin(t * 0.1 + i) * 0.4 + t * n.userData.v * 0.3; n.position.y += Math.sin(t * 0.8 + i) * 0.002; });
  }
  return { animar, sol, altura: get };
}
