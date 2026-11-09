// Motor del reel de cubos: dibuja el fotograma f de forma determinista (window.dibujar(f)).
// Capas: #fondo (DOM) · #medio (tarjetas) · canvas 3D · #frente (subtítulos, objetos, transiciones).
import * as THREE from 'three';
import { crearPersonaje } from './personaje.js';
import { crearMundo } from './mundo.js';
import { crearMascota } from './fichas/constructor.js';
import { skinDesdeImagen } from './skin.js';

const W = 1080, H = 1920;
const q = new URLSearchParams(location.search);
const rutaPlan = q.get('plan') || 'proyecto/reel.json';
const BASE = rutaPlan.includes('/') ? rutaPlan.slice(0, rutaPlan.lastIndexOf('/') + 1) : '';
const plan = await (await fetch(rutaPlan)).json();
const FPS = plan.fps || 30;
const Y_T = plan.yTarjeta ?? 640; // arriba de la tarjeta en los pasos
const COL = { acento: '#FF7A1A', texto: '#0E1B33', fondo: '#FFF3E6', fondo2: '#FFE7D1', tarjeta: '#FFFFFF', ...(plan.colores || {}) };

// ---------------- utilidades ----------------
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const suave = (x) => { x = cl(x); return x * x * (3 - 2 * x); };
const salida = (x) => { x = cl(x); return 1 - Math.pow(1 - x, 3); };
const rebote = (x) => { x = cl(x); const c = 1.4; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const entre = (t, a, d = 0.3) => cl((t - a) / d);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ]/g, '');
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const ENLACE = new Set('de la el en que y a los las un una del al por con para tu su mi o ni se lo le te'.split(' '));

const ICONOS = {
  camara: '<svg viewBox="0 0 64 64"><rect x="6" y="16" width="52" height="38" rx="9" fill="#fff" stroke="#0E1B33" stroke-width="4"/><rect x="22" y="9" width="20" height="10" rx="3" fill="#0E1B33"/><circle cx="32" cy="35" r="11" fill="#0E1B33"/><circle cx="32" cy="35" r="5" fill="#fff"/><circle cx="49" cy="25" r="3" fill="#E23B3B"/></svg>',
  archivo: '<svg viewBox="0 0 24 24"><path d="M6 2h8l5 5v15H6z" fill="#fff" stroke="currentColor" stroke-width="2"/><path d="M14 2v5h5" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M4 12l5 5L20 6" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  play: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="currentColor"/><path d="M10 7l7 5-7 5z" fill="#fff"/></svg>',
  regalo: '<svg viewBox="0 0 24 24"><rect x="3" y="9" width="18" height="12" rx="2" fill="#fff"/><rect x="2" y="6" width="20" height="5" rx="1.5" fill="#fff"/><rect x="11" y="6" width="2" height="15" fill="currentColor"/><path d="M12 6C9 1 5 3 8 6M12 6c3-5 7-3 4 0" fill="none" stroke="#fff" stroke-width="2"/></svg>',
  enviar: '<svg viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  corazon: '<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.5-9.2C1.2 8.6 3.3 5 6.8 5c2.1 0 3.6 1.2 5.2 3 1.6-1.8 3.1-3 5.2-3 3.5 0 5.6 3.6 4.3 6.8C19.5 16.4 12 21 12 21z" fill="currentColor"/></svg>',
  enlace: '<svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.2 1.2M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.2-1.2" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
  flecha: '<svg viewBox="0 0 40 40"><path d="M6 6l26 26M32 14v18H14" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

// ---------------- tiempos ----------------
let tiempos;
if (plan.tiempos) tiempos = await (await fetch(BASE + plan.tiempos)).json();
else { // sin voz: unas 3,3 palabras por segundo y pausa entre frases
  let t = 0.15; const palabras = [];
  plan.frases.forEach((fr, i) => {
    const v = plan.velocidadSinVoz || 1;
    fr.texto.split(/\s+/).filter(Boolean).forEach((w) => { const d = (0.12 + w.length * 0.045) / v; palabras.push({ texto: w, ini: t, fin: t + d, frase: i }); t += d + 0.04 / v; });
    t += 0.25 / v;
  });
  tiempos = { duracion: t, palabras };
}
const PAL = tiempos.palabras;
const DUR = tiempos.duracion + (plan.cola ?? 0.9);
const NF = Math.ceil(DUR * FPS);
const FR = plan.frases.map((fr, i) => {
  const ws = PAL.filter((p) => p.frase === i);
  return { ...fr, i, palabras: ws, ini: ws.length ? ws[0].ini : 0, fin: ws.length ? ws[ws.length - 1].fin : 0 };
});
FR.forEach((fr, i) => { fr.a = i === 0 ? 0 : Math.max(0, fr.ini - 0.05); });
FR.forEach((fr, i) => { fr.b = i < FR.length - 1 ? FR[i + 1].a : DUR; });
const claveDe = (fr) => new Set((fr.claves || []).flatMap((c) => c.split(/\s+/)).map(norm));
const tPalabra = (fr, palabra, def) => { const p = fr.palabras.find((w) => norm(w.texto) === norm(palabra)); return p ? p.ini : def; };

// Escenas: una frase con "escena" abre escena nueva; sin ella, sigue la anterior
const ESC = [];
FR.forEach((fr) => {
  if (fr.escena && fr.escena !== 'sigue') ESC.push({ ...fr.escena, a: fr.a, b: fr.b, frases: [fr] });
  else { const e = ESC[ESC.length - 1]; e.b = fr.b; e.frases.push(fr); }
});
ESC.forEach((e, i) => { e.i = i; e.ant = ESC[i - 1]; e.sig = ESC[i + 1]; e.modo = ['paisaje', 'cta'].includes(e.tipo) ? 'mundo' : 'estudio'; });
const escenaEn = (t) => ESC.find((e) => t >= e.a && t < e.b) || ESC[ESC.length - 1];

// Poses: la primera al empezar la frase; las demás en sus palabras clave (o repartidas)
const POSES = [];
FR.forEach((fr) => {
  const ps = fr.poses || [];
  const claves = fr.palabras.filter((w) => claveDe(fr).has(norm(w.texto)));
  ps.forEach((p, j) => {
    let t = fr.a + 0.04;
    if (j > 0) t = claves[j - 1] ? claves[j - 1].ini - 0.1 : fr.a + (fr.b - fr.a) * (j / ps.length);
    POSES.push({ t, p });
  });
});
POSES.sort((x, y) => x.t - y.t);
function poseEn(t) {
  let i = -1; for (let k = 0; k < POSES.length; k++) if (POSES[k].t <= t) i = k;
  if (i < 0) return { a: 'base', b: 'base', k: 1 };
  return { a: i > 0 ? POSES[i - 1].p : 'base', b: POSES[i].p, k: (t - POSES[i].t) / 0.25 };
}

// ---------------- 3D ----------------
const renderer = new THREE.WebGLRenderer({ antialias: plan.antialias ?? false, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(plan.escala3d || 0.75);
renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
document.getElementById('escenario').insertBefore(renderer.domElement, document.getElementById('frente'));
const lienzo = renderer.domElement; window._r = renderer;

const P = plan.personaje || {};
let skinCache = null;
async function nuevoPersonaje(ficha = null) {
  if (ficha) return crearMascota(THREE, ficha);
  if (P.ficha) return crearMascota(THREE, P.ficha);
  if (P.skin) { skinCache ||= await skinDesdeImagen(BASE + P.skin); return crearPersonaje(THREE, { skin: skinCache, caras: {} }); }
  if (P.modulo) { let m; try { m = await import('./' + BASE + P.modulo); } catch { m = await import('./' + P.modulo.replace(/^\.\//, '')); } return m[P.funcion || 'default'](THREE, P); }
  return crearMascota(THREE, { tipo: 'humano' });
}

// Mundos (uno por cielo) con su propio personaje y cámara en perspectiva
const mundos = {};
async function mundo(cielo = 'dia') {
  if (mundos[cielo]) return mundos[cielo];
  const scene = new THREE.Scene();
  const m = crearMundo(THREE, scene, { cielo, hierba: plan.hierba });
  const pj = await nuevoPersonaje(); scene.add(pj.grupo);
  const cam = new THREE.PerspectiveCamera(40, W / H, 0.1, 200);
  return (mundos[cielo] = { scene, m, pj, cam });
}
// Estudio: fondo transparente y cámara ortográfica en píxeles (y hacia abajo = -y)
const estudio = { scene: new THREE.Scene(), cam: new THREE.OrthographicCamera(0, W, 0, -H, -5000, 5000), minis: [] };
estudio.cam.position.z = 1000;
estudio.scene.add(new THREE.HemisphereLight('#FFFFFF', '#A89878', 1.0));
{ const d = new THREE.DirectionalLight('#FFF6EC', 2.1); d.position.set(-0.5, 0.8, 1); estudio.scene.add(d);
  const f = new THREE.DirectionalLight('#FFE9D2', 0.6); f.position.set(1, 0.2, 0.6); estudio.scene.add(f);
  const c = new THREE.DirectionalLight('#FFFFFF', 0.7); c.position.set(0.4, 0.6, -1); estudio.scene.add(c); }
estudio.pj = await nuevoPersonaje(); estudio.scene.add(estudio.pj.grupo);
const ALTO_PJ = 33; // unidades de skin (pies a coronilla, con la capa exterior)
function colocar(pj, x, ySuelo, altoPx, giro = 0.4, inclina = 0.12) {
  pj.grupo.scale.setScalar(altoPx / ALTO_PJ);
  pj.grupo.position.set(x, -ySuelo, 0);
  pj.grupo.rotation.set(inclina, giro, 0);
  pj.grupo.visible = true;
}
async function minis(n) {
  while (estudio.minis.length < n) { const m = await nuevoPersonaje(); m.grupo.visible = false; estudio.scene.add(m.grupo); estudio.minis.push(m); }
  return estudio.minis;
}
// Mascotas de ejemplo (para tarjetas): imágenes PNG renderizadas una vez
const fotos = {};
async function fotoDe(clave, ficha, pose = 'saluda') {
  if (fotos[clave]) return fotos[clave];
  const sc = new THREE.Scene();
  sc.add(new THREE.HemisphereLight('#FFFFFF', '#B9A88A', 1.3));
  const d = new THREE.DirectionalLight('#FFFFFF', 1.9); d.position.set(-0.5, 0.8, 1); sc.add(d);
  const pj = ficha ? crearMascota(THREE, ficha) : await nuevoPersonaje(); sc.add(pj.grupo);
  pj.pose(pose); pj.animar(0);
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  r.setSize(300, 360, false); r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping;
  const cam = new THREE.OrthographicCamera(0, 300, 0, -360, -5000, 5000); cam.position.z = 1000;
  pj.grupo.scale.setScalar(300 / ALTO_PJ); pj.grupo.position.set(150, -345, 0); pj.grupo.rotation.set(0.12, 0.45, 0);
  r.render(sc, cam);
  fotos[clave] = r.domElement.toDataURL('image/png'); r.dispose();
  return fotos[clave];
}
// Foto del paisaje para la vista previa de la tarjeta "lista"
let fotoPaisaje = null;
async function vistaPaisaje() {
  if (fotoPaisaje) return fotoPaisaje;
  const m = await mundo('dia');
  m.pj.pose('saluda'); m.pj.animar(0); m.m.animar(0);
  m.cam.position.set(0, 2.3, 8.5); m.cam.lookAt(0, 2.0, 0);
  renderer.render(m.scene, m.cam);
  fotoPaisaje = lienzo.toDataURL('image/jpeg', 0.85);
  return fotoPaisaje;
}

// ---------------- precarga ----------------
const ejemplos = plan.ejemplos || {};
for (const e of ESC) {
  if (e.tipo === 'paisaje' || e.tipo === 'cta') await mundo(e.cielo || (e.tipo === 'cta' ? 'atardecer' : 'dia'));
  const items = [...(e.objeto?.items || []), ...(e.tarjeta?.opciones || [])];
  for (const it of items) if (it.ejemplo) it.img = await fotoDe(it.ejemplo, it.ejemplo === 'principal' ? null : ejemplos[it.ejemplo], it.pose || 'saluda');
  if (e.tarjeta?.tipo === 'lista' && e.tarjeta.imagen) e.tarjeta.img = BASE + e.tarjeta.imagen;
  else if (e.tarjeta?.tipo === 'lista' && e.tarjeta.vista) e.tarjeta.img = await vistaPaisaje();
  if (e.tarjeta?.tipo === 'poses') await minis(6);
  if (e.tarjeta?.tipo === 'giro') await minis(4);
}
await document.fonts.ready;
await Promise.all(['600 20px Poppins', '800 20px Poppins', '700 20px Pixel', '500 20px Mono'].map((f) => document.fonts.load(f)));

// ---------------- subtítulos ----------------
function paginas(fr) {
  const out = []; let cur = [];
  const largo = (ws) => ws.map((w) => w.texto).join(' ').length;
  fr.palabras.forEach((w, i) => {
    const finFrase = cur.length && /[.?!…:]$/.test(cur[cur.length - 1].texto) && largo(cur) > 4;
    if (finFrase) { out.push(cur); cur = []; }
    else if (cur.length && largo([...cur, w]) > (plan.caracteresPorLinea || 24)) {
      // nunca cerrar página con palabra de enlace
      if (ENLACE.has(norm(cur[cur.length - 1].texto)) && cur.length > 1) { const u = cur.pop(); out.push(cur); cur = [u]; }
      else { out.push(cur); cur = []; }
    }
    cur.push(w);
  });
  if (cur.length) out.push(cur);
  return out;
}
function subtitulos(t, e) {
  const fr = FR.find((f) => t >= f.a && t < f.b); if (!fr || !fr.palabras.length) return '';
  if (e.subtitulos === false) return '';
  const enPaso = e.modo === 'estudio';
  const adel = 8 / FPS;
  const pags = paginas(fr);
  let pg = pags[0];
  for (const p of pags) if (t >= p[0].ini - adel) pg = p;
  const claves = claveDe(fr);
  let html = '', enCaja = false;
  pg.forEach((w, i) => {
    const vis = t >= w.ini - adel;
    if (!vis) return; // la línea crece palabra a palabra (centrada)
    const k = entre(t, w.ini - adel, 0.12);
    const esClave = claves.has(norm(w.texto));
    const estilo = `display:inline-block;opacity:${vis ? 0.25 + 0.75 * k : 0};transform:translateY(${(1 - salida(k)) * 18}px) scale(${0.9 + 0.1 * rebote(k)})`;
    if (esClave && !enCaja) { html += `<span style="background:${COL.acento};color:#fff;border-radius:14px;padding:0 16px 4px;margin:0 4px;display:inline-block;box-shadow:0 6px 18px rgba(0,0,0,.18);opacity:${vis ? 1 : 0}">`; enCaja = true; }
    if (!esClave && enCaja) { html += '</span>'; enCaja = false; }
    html += `${html && !html.endsWith('">') ? ' ' : ''}<span style="${estilo}">${esc(w.texto)}</span>`;
  });
  if (enCaja) html += '</span>';
  if (enPaso) return `<div class="abs" style="left:${e.lado === 'derecha' ? 60 : 440}px;width:580px;top:1300px;text-align:${e.lado === 'derecha' ? 'left' : 'left'};font-weight:800;font-size:50px;line-height:1.15;color:${COL.texto};letter-spacing:-1px">${html}</div>`;
  const y = e.tipo === 'cta' ? 250 : (plan.ySubtitulos || 290);
  return `<div class="abs" style="left:60px;right:60px;top:${y}px;text-align:center;font-weight:800;font-size:66px;line-height:1.15;color:#fff;letter-spacing:-1px;text-shadow:0 3px 0 rgba(14,27,51,.35),0 8px 26px rgba(14,27,51,.45)">${html}</div>`;
}

// ---------------- piezas comunes ----------------
const ventana = (app, cuerpo, { x = 110, y = Y_T, w = 860, h = 420, k = 1, etiqueta = '' } = {}) =>
  `<div class="abs" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;background:${COL.tarjeta};border-radius:34px;box-shadow:0 30px 70px rgba(14,27,51,.16),0 4px 14px rgba(14,27,51,.08);transform:translateY(${(1 - salida(k)) * 60}px) scale(${0.92 + 0.08 * rebote(k)});opacity:${cl(k * 3)};overflow:hidden">
    <div style="height:74px;display:flex;align-items:center;padding:0 32px;border-bottom:2px solid #F1ECE6;font-weight:800;font-size:30px;color:${COL.texto}">${esc(app)}
      ${etiqueta ? `<span style="margin-left:16px;font-size:22px;background:${COL.acento};color:#fff;border-radius:8px;padding:2px 12px">${esc(etiqueta)}</span>` : ''}
      <span style="margin-left:auto;display:flex;gap:10px">${'<i style="width:14px;height:14px;border-radius:50%;background:#E9E3DC;display:block"></i>'.repeat(3)}</span></div>
    <div style="position:relative;height:${h - 74}px">${cuerpo}</div></div>`;
const chip = (txt, icono = 'archivo', col = COL.texto) =>
  `<span style="display:inline-flex;align-items:center;gap:12px;background:#F6F1EB;border-radius:14px;padding:10px 18px;font-family:Mono;font-size:28px;color:${col}"><span style="width:28px;height:28px;color:${COL.acento};display:inline-block">${ICONOS[icono]}</span>${esc(txt)}</span>`;
const escribe = (txt, k) => esc(txt.slice(0, Math.round(txt.length * cl(k)))) + (k < 1 ? `<span style="display:inline-block;width:3px;height:1em;background:${COL.texto};vertical-align:-4px;margin-left:2px"></span>` : '');
const sombraSuelo = (x, y, w) => `<div class="abs" style="left:${x - w / 2}px;top:${y - 16}px;width:${w}px;height:32px;border-radius:50%;background:radial-gradient(closest-side,rgba(14,27,51,.22),rgba(14,27,51,0))"></div>`;
function particulas(t, t0, cx, cy, n = 22, col = COL.acento, alcance = 360) {
  const k = (t - t0) / 0.8; if (k < 0 || k > 1) return '';
  let h = '';
  for (let i = 0; i < n; i++) {
    const ang = hash(i + t0) * Math.PI * 2, v = 0.4 + hash(i * 3 + t0) * 0.6, s = 10 + hash(i * 7) * 16;
    const x = cx + Math.cos(ang) * alcance * v * salida(k), y = cy + Math.sin(ang) * alcance * v * salida(k) + 200 * k * k;
    h += `<div class="abs" style="left:${x}px;top:${y}px;width:${s}px;height:${s}px;background:${i % 3 ? col : '#fff'};opacity:${1 - k};transform:rotate(${i * 30 + k * 90}deg)"></div>`;
  }
  return h;
}

// Números en píxeles (5×7), dibujados con cuadros
const DIG = { 0: ['01110', '10001', '10011', '10101', '11001', '10001', '01110'], 1: ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  2: ['01110', '10001', '00001', '00110', '01000', '10000', '11111'], 3: ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  4: ['00010', '00110', '01010', '10010', '11111', '00010', '00010'], 5: ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  6: ['00110', '01000', '10000', '11110', '10001', '10001', '01110'], 7: ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  8: ['01110', '10001', '10001', '01110', '10001', '10001', '01110'], 9: ['01110', '10001', '10001', '01111', '00001', '00010', '01100'] };
function numeroPixel(txt, p, col) {
  return `<span style="display:inline-flex;gap:${p}px">${[...txt].map((d) => `<span style="display:grid;grid-template-columns:repeat(5,${p}px);grid-auto-rows:${p}px">${(DIG[d] || DIG[0]).join('').split('').map((b) => `<i style="display:block;background:${b === '1' ? col : 'transparent'}"></i>`).join('')}</span>`).join('')}</span>`;
}

// ---------------- escenas ----------------
const FONDO_PASOS = () => `<div class="abs" style="inset:0;background:linear-gradient(180deg,${COL.fondo},${COL.fondo2});"></div>
  <div class="abs" style="inset:0;background-image:linear-gradient(rgba(14,27,51,.045) 2px,transparent 2px),linear-gradient(90deg,rgba(14,27,51,.045) 2px,transparent 2px);background-size:54px 54px"></div>`;

function cabeceraPaso(t, e) {
  const k = entre(t, e.a, 0.35);
  const total = e.total || 6;
  const cuadros = Array.from({ length: total }, (_, i) => `<i style="display:inline-block;width:26px;height:26px;margin-right:8px;background:${i < e.n ? COL.acento : COL.acento + '33'};transform:scale(${i === e.n - 1 ? 0.6 + 0.4 * rebote(entre(t, e.a + 0.1, 0.3)) : 1})"></i>`).join('');
  const lineas = [].concat(e.titulo || []);
  const clave = norm(e.clave || '');
  let n = 0;
  const tit = lineas.map((l) => `<div>${l.split(' ').map((w) => {
    const kk = entre(t, e.a + 0.08 + 0.06 * n++, 0.25);
    const esC = clave && clave.split(' ').includes(norm(w)) || (e.clave && l.toLowerCase().includes(e.clave.toLowerCase()) && e.clave.toLowerCase().split(' ').includes(w.toLowerCase()));
    return `<span style="display:inline-block;opacity:${kk};filter:blur(${(1 - kk) * 10}px);transform:translateY(${(1 - salida(kk)) * 20}px);color:${esC ? COL.acento : COL.texto}">${esc(w)}</span>`;
  }).join(' ')}</div>`).join('');
  return `<div class="abs" style="left:110px;top:300px;display:flex;align-items:center;gap:34px;opacity:${k}">
      ${numeroPixel(String(e.n).padStart(2, '0'), 11, COL.acento)}<span>${cuadros}</span></div>
    <div class="abs" style="left:60px;right:60px;top:410px;text-align:center;font-weight:800;font-size:76px;line-height:1.02;letter-spacing:-2px">${tit}</div>`;
}

const TARJETAS = {
  chat(t, e, c, k) {
    const ta = e.a + 0.35;
    const kArch = entre(t, ta, 0.3), kNota = entre(t, ta + 0.7, 0.3);
    const kTxt = c.texto ? entre(t, ta + 0.2, Math.max(0.6, (e.b - e.a) * 0.55)) : 0;
    const cuerpo = `
      ${c.archivo ? `<div class="abs" style="left:36px;top:40px;opacity:${kArch};transform:scale(${0.8 + 0.2 * rebote(kArch)})">${chip(c.archivo)}</div>` : ''}
      ${c.nota ? `<div class="abs" style="left:36px;top:${c.archivo ? 116 : 40}px;opacity:${kNota};font-family:Mono;font-size:28px;color:#2F9E5B;display:flex;gap:10px;align-items:center"><span style="width:30px;height:30px;display:inline-block;color:#2F9E5B">${ICONOS.check}</span>${esc(c.nota)}</div>` : ''}
      <div class="abs" style="left:28px;right:28px;bottom:28px;height:86px;border-radius:22px;background:#F7F3EE;display:flex;align-items:center;padding:0 24px;font-family:Mono;font-size:30px;color:${COL.texto}">${c.texto ? escribe(c.texto, kTxt) : `<span style="opacity:.35">${esc(c.marcador || 'Escribe aquí…')}</span>`}
        <span style="margin-left:auto;width:54px;height:54px;border-radius:14px;background:${COL.acento};display:flex;align-items:center;justify-content:center"><span style="width:30px;height:30px">${ICONOS.enviar}</span></span></div>`;
    return ventana(c.app || 'Claude', cuerpo, { k, h: c.alto || 360 });
  },
  elige(t, e, c, k) {
    const ta = e.a + 0.3, ops = c.opciones || [];
    const kTxt = entre(t, ta, 0.8);
    const tSel = c.elegirEn ? tPalabra(e.frases[0], c.elegirEn, e.a + (e.b - e.a) * 0.7) : e.a + (e.b - e.a) * 0.7;
    const kSel = entre(t, tSel, 0.3);
    const fichas = ops.map((o, i) => {
      const ki = entre(t, ta + 0.5 + i * 0.18, 0.3);
      const sel = i === (c.elegida ?? 0);
      return `<div style="width:220px;height:250px;border-radius:24px;background:#FBF8F4;border:4px solid ${sel && kSel > 0 ? COL.acento : '#EFE8E0'};display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:16px;position:relative;opacity:${ki * (sel || kSel === 0 ? 1 : 1 - 0.55 * kSel)};transform:scale(${(0.85 + 0.15 * rebote(ki)) * (sel ? 1 + 0.06 * rebote(kSel) : 1)})">
        ${o.img ? `<img src="${o.img}" style="height:170px">` : ''}<div style="font-family:Mono;font-size:26px;color:${COL.texto}">${esc(o.etiqueta || o.ejemplo || '')}</div>
        ${sel ? `<div style="position:absolute;top:-16px;right:-16px;width:46px;height:46px;border-radius:50%;background:${COL.acento};color:#fff;display:flex;align-items:center;justify-content:center;transform:scale(${rebote(kSel)})"><span style="width:28px;height:28px">${ICONOS.check}</span></div>` : ''}</div>`;
    }).join('');
    const cuerpo = `<div class="abs" style="left:28px;right:28px;top:26px;height:70px;border-radius:18px;background:#F7F3EE;display:flex;align-items:center;padding:0 22px;font-family:Mono;font-size:28px;color:${COL.texto}">${escribe(c.texto || '', kTxt)}</div>
      <div class="abs" style="left:0;right:0;top:122px;display:flex;justify-content:center;gap:26px">${fichas}</div>`;
    return ventana(c.app || 'Claude', cuerpo, { k, h: 520 });
  },
  giro(t, e, c, k) {
    const et = c.etiquetas || ['frente', '3/4', 'lado', 'espalda'];
    const cuerpo = `<div class="abs" style="left:0;right:0;bottom:24px;display:flex;justify-content:space-around;font-family:Mono;font-size:28px;color:#8A8F9C">${et.map((x, i) => `<span style="opacity:${entre(t, e.a + 0.4 + i * 0.2, 0.25)}">${esc(x)}</span>`).join('')}</div>`;
    return ventana(c.app || 'Claude', cuerpo, { k, h: 470 });
  },
  poses(t, e, c, k) {
    const cuerpo = Array.from({ length: 6 }, (_, i) => {
      const x = 40 + (i % 3) * 266, y = 20 + Math.floor(i / 3) * 214;
      return `<div class="abs" style="left:${x}px;top:${y}px;width:246px;height:200px;border-radius:20px;background:#F8F4EF;opacity:${entre(t, e.a + 0.3 + i * 0.12, 0.2)}"></div>`;
    }).join('') + (c.recorte ? `<div class="abs" style="left:24px;right:24px;top:${20 + 214 * ((t - e.a) % 1.2) / 1.2 * 2}px;height:4px;background:${COL.acento};opacity:${entre(t, e.a + 0.9, 0.2)};box-shadow:0 0 18px ${COL.acento}"></div>` : '');
    return ventana(c.app || 'Claude', cuerpo, { k, h: 540 });
  },
  guion(t, e, c, k) {
    const filas = c.filas || [];
    const cab = `<div style="display:flex;font-family:Mono;font-size:22px;color:#9A9FAB;padding:18px 30px 8px"><span style="flex:1">línea</span><span style="width:200px">emoción</span><span style="width:150px">pantalla</span></div>`;
    const cuerpo = cab + filas.map((f, i) => {
      const ki = entre(t, e.a + 0.35 + i * 0.35, 0.3);
      return `<div style="display:flex;align-items:center;padding:12px 30px;border-top:2px solid #F3EEE8;opacity:${ki};transform:translateX(${(1 - salida(ki)) * 40}px)">
        <span style="flex:1;font-size:26px;font-weight:600;color:${COL.texto};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:16px">${esc(f[0])}</span>
        <span style="width:200px"><span style="background:${COL.acento};color:#fff;border-radius:8px;padding:2px 10px;font-family:Mono;font-size:22px">[${esc(f[1] || 'excited')}]</span></span>
        <span style="width:150px;font-family:Mono;font-size:22px;color:#8A8F9C">${esc(f[2] || '')}</span></div>`;
    }).join('');
    return ventana(c.app || 'Claude', cuerpo, { k, h: 120 + filas.length * 70 });
  },
  voz(t, e, c, k) {
    const ta = e.a + 0.4, kv = cl((t - ta) / Math.max(0.8, e.b - ta - 0.2));
    const n = 34, barras = Array.from({ length: n }, (_, i) => {
      const activa = i / n < kv;
      const h = 14 + Math.abs(Math.sin(i * 1.7) * 60 + Math.sin(i * 0.6 + t * 9) * 20) * (activa ? 1 : 0.35);
      return `<i style="display:inline-block;width:12px;margin:0 4px;height:${h}px;border-radius:6px;background:${activa ? COL.acento : '#E9E1D8'}"></i>`;
    }).join('');
    const seg = Math.floor(kv * (c.segundos || 38));
    const cuerpo = `<div class="abs" style="left:34px;top:30px;font-family:Mono;font-size:28px;color:${COL.texto};display:flex;align-items:center;gap:12px"><i style="width:18px;height:18px;border-radius:50%;background:${COL.acento};display:inline-block"></i>${esc(c.nombre || 'voz')}</div>
      <div class="abs" style="left:24px;right:24px;top:110px;height:130px;display:flex;align-items:center;justify-content:center">${barras}</div>
      <div class="abs" style="left:34px;right:34px;bottom:30px;display:flex;align-items:center;gap:18px;font-family:Mono;font-size:26px;color:#8A8F9C"><span style="width:52px;height:52px;color:${COL.acento}">${ICONOS.play}</span>0:${String(seg).padStart(2, '0')}
        <span style="flex:1;height:8px;border-radius:4px;background:#EFE8E0;position:relative"><i style="position:absolute;left:0;top:0;bottom:0;width:${kv * 100}%;background:${COL.acento};border-radius:4px"></i></span></div>`;
    return ventana(c.app || 'ElevenLabs', cuerpo, { k, h: 380, x: 130, y: Y_T + 30, w: 820 });
  },
  lista(t, e, c, k) {
    const items = c.items || [];
    const tVista = c.vistaEn ? tPalabra(e.frases[e.frases.length - 1], c.vistaEn, e.b - 1.2) : e.a + 0.4 + items.length * 0.3 + 0.3;
    const kv = entre(t, tVista, 0.45);
    const tItem = (it, i) => (it && it.en ? tPalabra(e.frases[e.frases.length - 1], it.en, e.a + 0.35 + i * 0.28) - 0.1 : e.a + 0.35 + i * 0.28);
    const li = items.map((it0, i) => {
      const it = typeof it0 === 'string' ? it0 : it0.texto;
      const ki = entre(t, tItem(it0, i), 0.25);
      return `<div style="display:flex;align-items:center;gap:14px;margin-bottom:22px;opacity:${ki};transform:translateX(${(1 - salida(ki)) * 30}px);font-family:Mono;font-size:28px;color:${COL.texto}"><i style="width:14px;height:14px;background:${COL.acento};display:inline-block"></i>${esc(it)}</div>`;
    }).join('');
    const carga = kv === 0 && t > e.a + 0.5 ? `<div style="display:flex;gap:10px">${[0, 1, 2].map((i) => `<i style="width:16px;height:16px;border-radius:50%;background:${COL.acento};opacity:${0.3 + 0.7 * Math.abs(Math.sin(t * 5 + i))};display:inline-block"></i>`).join('')}</div>` : '';
    const conVista = c.vista || c.imagen;
    if (!conVista) return ventana(c.app || 'Claude', `<div class="abs" style="left:40px;top:40px;right:40px">${li}</div>`, { k, h: 120 + items.length * 64, etiqueta: c.etiqueta || '' });
    const cuerpo = `<div class="abs" style="left:40px;top:40px">${li}</div>
      <div class="abs" style="right:150px;top:30px;width:200px;height:356px;border-radius:26px;background:#F3EEE8;display:flex;align-items:center;justify-content:center;overflow:hidden">${carga}
        ${c.img ? `<img src="${c.img}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:${kv};transform:scale(${1.15 - 0.15 * salida(kv)})">` : ''}</div>
      <div class="abs" style="right:30px;bottom:30px;width:96px;height:64px;border-radius:16px;border:3px solid #EDE6DE;display:flex;align-items:center;justify-content:center;color:${COL.texto};font-family:Mono;font-size:26px">↵</div>`;
    return ventana(c.app || 'Claude', cuerpo, { k, h: 500, etiqueta: c.etiqueta || '' });
  },
};

// Coloca mascotas pequeñas dentro de la tarjeta (giro y poses)
function minisEnTarjeta(t, e, k) {
  estudio.minis.forEach((m) => (m.grupo.visible = false));
  const c = e.tarjeta || {};
  const sube = (1 - salida(k)) * 60;
  if (c.tipo === 'giro') {
    const giros = [0, 0.75, 1.5708, 3.1416];
    estudio.minis.slice(0, 4).forEach((m, i) => {
      const ki = entre(t, e.a + 0.35 + i * 0.2, 0.3);
      if (ki <= 0) return;
      m.pose('base'); m.animar(t + i);
      colocar(m, 110 + 110 + i * 213, Y_T + 74 + 300 + sube, 250 * rebote(ki), giros[i] + Math.sin(t * 1.2 + i) * 0.05, 0.1);
    });
  }
  if (c.tipo === 'poses') {
    const ps = c.poses || ['saluda', 'pulgar', 'piensa', 'celebra', 'sorpresa', 'agobiado'];
    estudio.minis.slice(0, 6).forEach((m, i) => {
      const ki = entre(t, e.a + 0.35 + i * 0.12, 0.3);
      if (ki <= 0) return;
      m.pose(ps[i] || 'base'); m.animar(t + i * 0.7);
      colocar(m, 110 + 40 + (i % 3) * 266 + 123, Y_T + 74 + 20 + Math.floor(i / 3) * 214 + 188 + sube, 160 * rebote(ki), 0.45, 0.1);
    });
  }
}

// ---------------- objetos del paisaje ----------------
function objeto(t, e) {
  const o = e.objeto; if (!o) return '';
  const fr = e.frases[0];
  if (o.tipo === 'icono') {
    const k = entre(t, e.a + 0.1, 0.35);
    const tTacha = o.tacharEn ? tPalabra(fr, o.tacharEn, e.a + 1) : null;
    const kT = tTacha ? entre(t, tTacha, 0.25) : 0;
    const tExpl = Math.min(e.b - 0.35, (tTacha || e.a) + 0.9);
    if (t > tExpl) return particulas(t, tExpl, 540, 640, 26, '#E23B3B', 420);
    return `<div class="abs" style="left:${540 - 150}px;top:${640 - 150}px;width:300px;height:300px;border-radius:64px;background:#fff;box-shadow:0 30px 60px rgba(14,27,51,.25);display:flex;align-items:center;justify-content:center;transform:scale(${rebote(k)}) rotate(${(1 - k) * -12 + Math.sin(t * 2) * 2}deg)">
        <div style="width:200px;height:200px">${ICONOS[o.icono] || ''}</div>
        ${tTacha ? `<div class="abs" style="left:30px;top:142px;width:${240 * kT}px;height:22px;background:#E23B3B;border-radius:11px;transform-origin:left center;transform:rotate(-38deg) translate(-10px,80px)"></div>` : ''}</div>`;
  }
  if (o.tipo === 'tarjetas') {
    const its = o.items || [];
    return its.map((it, i) => {
      const ki = entre(t, e.a + 0.1 + i * 0.22, 0.35);
      const x = 540 + (i - (its.length - 1) / 2) * 300, rot = (i - (its.length - 1) / 2) * 7;
      return `<div class="abs" style="left:${x - 135}px;top:${560 + Math.abs(i - (its.length - 1) / 2) * 30}px;width:270px;height:400px;border-radius:28px;background:${it.fondo || '#fff'};box-shadow:0 24px 50px rgba(14,27,51,.28);overflow:hidden;opacity:${cl(ki * 2)};transform:translateY(${(1 - salida(ki)) * 120}px) rotate(${rot}deg) scale(${0.8 + 0.2 * rebote(ki)})">
        ${it.img ? `<img src="${it.img}" style="position:absolute;left:0;right:0;bottom:56px;margin:auto;width:230px">` : ''}
        <div style="position:absolute;left:18px;top:16px;font-weight:800;font-size:30px;color:${COL.texto}">${esc(it.titulo || '')}</div>
        <div style="position:absolute;left:0;right:0;bottom:0;height:56px;background:${COL.texto};color:#fff;font-family:Mono;font-size:22px;display:flex;align-items:center;justify-content:center">${esc(it.pie || 'sin cara')}</div></div>`;
    }).join('');
  }
  if (o.tipo === 'rec') {
    const k = entre(t, e.a + 0.05, 0.3);
    return `<div class="abs" style="left:70px;top:420px;width:940px;height:1180px;border:6px solid #E23B3B;border-radius:40px;opacity:${k};transform:scale(${1.06 - 0.06 * salida(k)})">
      <div class="abs" style="left:30px;top:28px;background:#E23B3B;color:#fff;font-weight:800;font-size:30px;border-radius:12px;padding:6px 16px;display:flex;gap:10px;align-items:center"><i style="width:16px;height:16px;border-radius:50%;background:#fff;opacity:${Math.sin(t * 6) > 0 ? 1 : 0.3};display:inline-block"></i>REC</div></div>`;
  }
  return '';
}

// Textos fijos de los finales: se cambian con "textos" en el plan (o en cada cta), por ejemplo para otro idioma
const TEXTOS = { autor: '@tú · ahora', respuesta: '¡Aquí tienes tu kit!', usuario: '@tu_cuenta', bio: '',
  seguir: 'Seguir', siguiendo: 'Siguiendo', mensaje: 'Mensaje', privado: 'por privado', ...(plan.textos || {}) };

// Final sin comentar (por ejemplo, TikTok, «sígueme y escríbeme PALABRA por privado»): tarjeta de perfil que pulsa
// «Seguir», luego «Mensaje», y sale el mensaje privado con la palabra; un corazón al seguir
function ctaSigueme(t, e, c) {
  const T = { ...TEXTOS, ...(c.textos || {}) };
  const k = entre(t, e.a + 0.15, 0.35), kS = entre(t, e.a + 1.05, 0.3), kM = entre(t, e.a + 1.55, 0.3), kE = entre(t, e.a + 1.7, 0.35), kC = entre(t, e.a + 1.25, 0.35);
  const sigue = t >= e.a + 1.05, escrito = t >= e.a + 1.55;
  const palabra = String(c.palabra || '').toUpperCase();
  return `<div class="abs" style="left:80px;top:430px;width:640px;background:#fff;border-radius:30px;padding:26px 30px;box-shadow:0 20px 50px rgba(14,27,51,.25);opacity:${k};transform:scale(${0.85 + 0.15 * rebote(k)});transform-origin:left top">
      <div style="display:flex;align-items:center;gap:20px">
        <div style="width:96px;height:96px;border-radius:50%;background:${COL.acento};flex:none"></div>
        <div style="min-width:0"><div style="font-weight:800;font-size:40px;color:${COL.texto};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(c.usuario || T.usuario)}</div>
          ${(c.bio || T.bio) ? `<div style="font-family:Mono;font-size:22px;color:#9A9FAB">${esc(c.bio || T.bio)}</div>` : ''}</div></div>
      <div style="margin-top:22px;display:flex;gap:16px;align-items:center">
        <div style="flex:1;text-align:center;font-weight:800;font-size:36px;border-radius:18px;padding:14px 0;background:${sigue ? '#EDEFF3' : COL.acento};color:${sigue ? COL.texto : '#fff'};transform:scale(${1 + 0.08 * Math.sin(Math.PI * kS)})">${esc(sigue ? T.siguiendo : T.seguir)}</div>
        <div style="flex:1;text-align:center;font-weight:800;font-size:36px;border-radius:18px;padding:14px 0;background:${sigue && !escrito ? COL.acento : '#EDEFF3'};color:${sigue && !escrito ? '#fff' : COL.texto};transform:scale(${1 + 0.08 * Math.sin(Math.PI * kM)})">${esc(T.mensaje)}</div>
        <div style="width:64px;height:64px;color:#E23B3B;opacity:${kC};transform:scale(${0.4 + 0.6 * rebote(kC)})">${ICONOS.corazon}</div></div>
      <div style="margin-top:18px;display:flex;justify-content:flex-end;opacity:${kE};transform:translateY(${(1 - salida(kE)) * 20}px) scale(${0.85 + 0.15 * rebote(kE)});transform-origin:right top">
        <div style="display:inline-flex;align-items:center;gap:14px;background:${COL.texto};color:#fff;border-radius:26px 26px 8px 26px;padding:14px 26px">
          <span style="font-family:Mono;font-size:24px;opacity:.75">${esc(T.privado)}</span>
          <span style="font-weight:800;font-size:${palabra.length > 8 ? 40 : 50}px;color:${COL.acento};letter-spacing:1px">${esc(palabra || '✉')}</span>
          <span style="font-size:28px;color:${COL.acento}">✓✓</span></div></div>
    </div>`;
}

function cta(t, e) {
  const c = e.cta || {};
  if (c.modo === 'sigueme') return ctaSigueme(t, e, c);
  const k = entre(t, e.a + 0.15, 0.35);
  const tw = entre(t, e.a + 0.35, 0.5);
  const tr = e.a + 1.05;
  const kR = entre(t, tr, 0.3);
  const archivos = (c.archivos || []).map((a, i) => {
    const ki = entre(t, tr + 0.35 + i * 0.2, 0.3);
    return `<div style="margin-top:14px;opacity:${ki};transform:translateX(${(1 - salida(ki)) * 40}px)">${chip(a)}</div>`;
  }).join('');
  return `<div class="abs" style="left:80px;top:430px;width:560px;background:#fff;border-radius:30px;padding:22px 30px;box-shadow:0 20px 50px rgba(14,27,51,.25);opacity:${k};transform:scale(${0.85 + 0.15 * rebote(k)});transform-origin:left top">
      <div style="font-family:Mono;font-size:22px;color:#9A9FAB">${esc(c.autor || TEXTOS.autor)}</div>
      <div style="font-weight:800;font-size:58px;color:${COL.texto};letter-spacing:-1px">${escribe(c.palabra || 'CUBOS', tw)}</div></div>
    <div class="abs" style="left:640px;top:520px;width:90px;height:90px;color:${COL.acento};opacity:${kR};transform:translate(${(1 - salida(kR)) * -20}px,${(1 - salida(kR)) * -20}px)">${ICONOS.flecha}</div>
    <div class="abs" style="right:70px;top:640px;text-align:right">
      <div style="display:inline-flex;align-items:center;gap:14px;background:${COL.acento};color:#fff;font-weight:800;font-size:40px;border-radius:24px;padding:16px 28px;opacity:${kR};transform:scale(${0.8 + 0.2 * rebote(kR)})">${esc(c.respuesta || TEXTOS.respuesta)}<span style="width:40px;height:40px;color:${COL.acento};display:inline-block">${ICONOS.regalo}</span></div>
      ${archivos}</div>`;
}

// ---------------- dibujar un fotograma ----------------
const capa = { fondo: document.getElementById('fondo'), medio: document.getElementById('medio'), frente: document.getElementById('frente') };
let ultimoFondo = '';
window.dibujar = async (f) => {
  const t = f / FPS;
  const e = escenaEn(t);
  const tl = t - e.a;
  const ps = poseEn(t);
  let fondo = '', medio = '', frente = '';

  if (e.modo === 'mundo') {
    const cielo = e.cielo || (e.tipo === 'cta' ? 'atardecer' : 'dia');
    const m = await mundo(cielo);
    m.pj.mezcla(ps.a, ps.b, ps.k); m.pj.animar(t); m.m.animar(t);
    m.pj.grupo.rotation.y = (e.giro ?? -0.12) + Math.sin(t * 0.6) * 0.06;
    const CAM = { medio: [0, 2.3, 8.5, 2.0], cerca: [0.5, 1.9, 5.6, 1.75], lejos: [0, 3.0, 11.5, 2.6], bajo: [0.4, 0.9, 6.5, 1.9] };
    const nombreCam = e.camara || (e.objeto?.tipo === 'rec' ? 'medio' : ['medio', 'cerca', 'medio', 'lejos'][e.i % 4]);
    const [x, y, z, ly] = CAM[nombreCam] || CAM.medio;
    const kd = tl / Math.max(1, e.b - e.a);
    m.cam.position.set(x + Math.sin(t * 0.35) * 0.25, y - kd * 0.15, z - kd * 0.9);
    m.cam.lookAt(0, ly, 0);
    renderer.render(m.scene, m.cam);
    frente += objeto(t, e);
    if (e.tipo === 'cta') frente += cta(t, e);
    frente += subtitulos(t, e);
  } else {
    estudio.minis.forEach((mm) => (mm.grupo.visible = false));
    const pj = estudio.pj; pj.mezcla(ps.a, ps.b, ps.k); pj.animar(t);
    if (e.tipo === 'cortinilla') {
      fondo = `<div class="abs" style="inset:0;background:${COL.acento}"></div>`;
      const kt = entre(t, e.a + 0.15, 0.4);
      medio = `<div class="abs" style="left:60px;right:60px;top:720px;text-align:center;font-weight:800;font-size:112px;letter-spacing:-3px;color:#fff;opacity:${kt};filter:blur(${(1 - kt) * 14}px);transform:scale(${0.9 + 0.1 * rebote(kt)})">${esc(e.texto || '')}</div>`
        + particulas(t, e.a + 0.25, 540, 780, 26, '#fff', 460) + sombraSuelo(540, 1500, 260);
      colocar(pj, 540, 1500, 520, -0.35 + Math.sin(t) * 0.05, 0.08);
    } else { // paso
      fondo = FONDO_PASOS();
      medio = cabeceraPaso(t, e);
      const k = entre(t, e.a + 0.12, 0.4);
      if (e.tarjeta && TARJETAS[e.tarjeta.tipo]) medio += TARJETAS[e.tarjeta.tipo](t, e, e.tarjeta, k);
      minisEnTarjeta(t, e, k);
      if (e.subtitulos === true || (plan.subtitulosEnPasos && e.subtitulos !== false)) medio += subtitulos(t, e);
      if (e.burbuja) {
        const kb = entre(t, tPalabra(e.frases[e.frases.length - 1], e.burbuja.en || '', e.a + 0.8), 0.3);
        medio += `<div class="abs" style="left:${e.lado === 'derecha' ? 120 : 430}px;top:1400px;background:#fff;border-radius:22px;padding:16px 26px;font-family:Mono;font-size:30px;color:${COL.texto};box-shadow:0 14px 34px rgba(14,27,51,.14);opacity:${kb};transform:scale(${0.8 + 0.2 * rebote(kb)});transform-origin:left center">${esc(e.burbuja.texto)}</div>`;
      }
      const lado = e.lado === 'derecha' ? 820 : 260;
      medio += sombraSuelo(lado, 1720, 250);
      colocar(pj, lado, 1720, plan.altoMascotaPasos || 450, e.lado === 'derecha' ? -0.45 : 0.45, 0.1);
    }
    renderer.render(estudio.scene, estudio.cam);
  }

  // ---- transiciones ----
  let filtro = '';
  if (e.tipo === 'cortinilla' && tl < 0.4) { // ola que sube y tapa
    const k = suave(tl / 0.4);
    frente += `<div class="abs" style="left:-200px;right:-200px;height:2600px;top:${1920 - k * 2400}px;background:${COL.acento};border-radius:50% 50% 0 0/220px 220px 0 0;opacity:${1 - suave((tl - 0.3) / 0.1)}"></div>`;
  }
  if (e.ant && e.ant.tipo === 'cortinilla' && tl < 0.45) { // ola clara que barre la cortinilla
    const k = suave(tl / 0.45);
    frente += `<div class="abs" style="left:-200px;right:-200px;height:2600px;top:${-680 - k * 2000}px;background:${COL.acento};border-radius:0 0 50% 50%/0 0 220px 220px"></div>`;
  }
  if (e.modo === 'mundo' && e.ant && e.ant.modo === 'estudio' && tl < 0.4) { const k = 1 - tl / 0.4; filtro = `blur(${k * 18}px)`; frente += `<div class="abs" style="inset:0;background:#fff;opacity:${k * 0.7}"></div>`; }
  if (e.modo === 'estudio' && e.sig && e.sig.modo === 'mundo' && e.b - t < 0.35) { const k = 1 - (e.b - t) / 0.35; filtro = `blur(${k * 18}px)`; frente += `<div class="abs" style="inset:0;background:#fff;opacity:${k * 0.7}"></div>`; }
  lienzo.style.filter = filtro;
  document.getElementById('fondo').style.filter = filtro; document.getElementById('medio').style.filter = filtro;

  if (fondo !== ultimoFondo) { capa.fondo.innerHTML = fondo; ultimoFondo = fondo; }
  capa.medio.innerHTML = medio;
  capa.frente.innerHTML = frente;
  return true;
};

// Portada: fotograma fijo con título grande dentro del recorte 3:4 central (y = 240–1680)
window.dibujarPortada = async () => {
  const o = plan.portada || {};
  const m = await mundo(o.cielo || 'dia');
  m.pj.pose(o.pose || 'celebra'); m.pj.animar(0.4); m.m.animar(3);
  m.pj.grupo.rotation.y = o.giro ?? -0.3;
  m.cam.position.set(0.3, 1.75, 5.4); m.cam.lookAt(0, 2.45, 0);
  renderer.render(m.scene, m.cam);
  lienzo.style.filter = '';
  const claves = new Set(String(o.clave || '').split(/\s+/).map(norm).filter(Boolean));
  const lineas = (o.titulo || ['MI', 'REEL']).map((l) => `<div>${l.split(' ').map((w) => claves.has(norm(w))
    ? `<span style="background:${COL.acento};color:#fff;border-radius:22px;padding:0 22px 8px;display:inline-block">${esc(w)}</span>` : esc(w)).join(' ')}</div>`).join('');
  capa.fondo.innerHTML = ''; capa.medio.innerHTML = '';
  capa.frente.innerHTML = `
    ${o.etiqueta ? `<div class="abs" style="left:0;right:0;top:300px;text-align:center"><span style="background:${COL.texto};color:#fff;font-weight:800;font-size:40px;letter-spacing:3px;border-radius:40px;padding:14px 34px">${esc(o.etiqueta)}</span></div>` : ''}
    <div class="abs" style="left:40px;right:40px;top:400px;text-align:center;font-weight:800;font-size:${o.tamano || 150}px;line-height:1.02;letter-spacing:-4px;color:#fff;text-shadow:0 6px 0 rgba(14,27,51,.35),0 14px 40px rgba(14,27,51,.5)">${lineas}</div>
    ${o.sub ? `<div class="abs" style="left:60px;right:60px;top:${430 + (o.titulo || []).length * 155}px;text-align:center;font-weight:600;font-size:54px;color:#fff;text-shadow:0 4px 18px rgba(14,27,51,.6)">${esc(o.sub)}</div>` : ''}`;
  return true;
};

// Efectos de sonido sincronizados (los mezcla montar.js)
window.eventos = () => {
  const ev = [];
  ESC.forEach((e) => {
    if (e.tipo === 'cortinilla') ev.push({ t: e.a, s: 'whoosh' });
    if (e.modo === 'mundo' && e.ant && e.ant.modo === 'estudio') ev.push({ t: e.a - 0.15, s: 'whoosh' });
    if (e.tipo === 'paso') { ev.push({ t: e.a + 0.12, s: 'pop' }); const c = e.tarjeta || {};
      if (c.tipo === 'chat') { if (c.archivo) ev.push({ t: e.a + 0.35, s: 'pop' }); if (c.nota) ev.push({ t: e.a + 1.05, s: 'ding' }); }
      if (c.tipo === 'elige') { const tS = c.elegirEn ? tPalabra(e.frases[0], c.elegirEn, e.a + (e.b - e.a) * 0.7) : e.a + (e.b - e.a) * 0.7; ev.push({ t: tS, s: 'click' }); }
      if (c.tipo === 'giro' || c.tipo === 'poses') for (let i = 0; i < (c.tipo === 'giro' ? 4 : 6); i++) ev.push({ t: e.a + 0.35 + i * (c.tipo === 'giro' ? 0.2 : 0.12), s: 'pop' });
      if (c.tipo === 'lista') (c.items || []).forEach((it, i) => ev.push({ t: it && it.en ? tPalabra(e.frases[e.frases.length - 1], it.en, e.a + 0.35 + i * 0.28) - 0.1 : e.a + 0.35 + i * 0.28, s: 'click' }));
      if (c.tipo === 'lista' && c.vista) ev.push({ t: c.vistaEn ? tPalabra(e.frases[e.frases.length - 1], c.vistaEn, e.b - 1.2) : e.b - 1.2, s: 'ding' });
    }
    if (e.objeto?.tipo === 'icono' && e.objeto.tacharEn) { const tt = tPalabra(e.frases[0], e.objeto.tacharEn, e.a + 1); ev.push({ t: tt, s: 'whoosh' }); ev.push({ t: Math.min(e.b - 0.35, tt + 0.9), s: 'pop' }); }
    if (e.objeto?.tipo === 'tarjetas') (e.objeto.items || []).forEach((_, i) => ev.push({ t: e.a + 0.1 + i * 0.22, s: 'pop' }));
    if (e.tipo === 'cta') { ev.push({ t: e.a + 1.05, s: 'ding' }); if (e.cta?.modo === 'sigueme') ev.push({ t: e.a + 1.7, s: 'pop' }); (e.cta?.archivos || []).forEach((_, i) => ev.push({ t: e.a + 1.4 + i * 0.2, s: 'pop' })); }
  });
  return ev.filter((x) => x.t >= 0 && x.t < DUR).sort((a, b) => a.t - b.t);
};
// firmas: render.js las compara para reutilizar los fotogramas iguales de otra versión (dos finales)
const FIRMA = JSON.stringify(Object.fromEntries(Object.entries(plan).filter(([k]) => !['frases', 'voz', 'tiempos', 'base', 'salida', 'portada'].includes(k))));
window.info = { fotogramas: NF, fps: FPS, duracion: DUR, firma: FIRMA, escenas: ESC.map((e) => ({ tipo: e.tipo, a: +e.a.toFixed(3), b: +e.b.toFixed(3),
  firma: JSON.stringify([e.tipo, e.cielo, e.frases.map((f) => [f.texto, f.claves, f.poses, f.escena])]) })) };
window.listo = true;
