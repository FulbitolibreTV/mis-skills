// ---------- ESTILOS extra: 'mapa' (mapa ilustrado), 'tech' (escaparate oscuro naranja), 'neon' (palitos de neón) ----------
// Elige uno para todo el vídeo con window.ESTILO = 'mapa' | 'tech' | 'neon' al principio de shots.js.
// Cambia los subtítulos y el acabado (main.js) y trae sus piezas, todas dibujadas en código.

// ============ ESTILO 'mapa': mar turquesa, tierra de papel, países que cambian de color, banderas, muñequitos ============
// Datos: python tools/mapa.py <carpeta> oeste sur este norte  ->  web/mapa.js (costas y fronteras reales, Natural Earth)
const MAPC = {
  sea0: '#2b8189', sea1: '#5aaead', paper: '#cdb98f', paperEdge: '#5e4a2e', bgLand: '#bfae86',
  rojo: '#d63a3f', azul: '#2f56c4', amarillo: '#e9a92b', verde: '#3c9b4c', morado: '#7b4bb3', naranja: '#e77a2a', celeste: '#4fa3e0',
};
let MAPV = { lon: 0, lat: 0, z: 10 };          // camera: centre and pixels per degree
function mapCam(lon, lat, z) { if (Array.isArray(lon)) [lon, lat, z] = lon; MAPV = { lon, lat, z }; }
// camera that fits a box [oeste, sur, este, norte] in the frame (leave room for captions on top)
function mapFit(w, s, e, n, pad = 1.1, cy = 0) {
  const lat = (s + n) / 2, k = Math.cos(lat * Math.PI / 180);
  const z = Math.min(1000 / ((e - w) * k * pad), 1250 / ((n - s) * pad));
  return [(w + e) / 2, lat + cy / z, z];
}
function P(lon, lat) { const k = Math.cos(MAPV.lat * Math.PI / 180); return [540 + (lon - MAPV.lon) * MAPV.z * k, 1000 - (lat - MAPV.lat) * MAPV.z]; }
function seaBg(ctx, t) {
  ctx.fillStyle = lin(ctx, 0, 0, 0, H, [[0, MAPC.sea1], [.45, MAPC.sea0], [1, '#1f6a72']]); ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = rad(ctx, 540, 300, 0, 1100, [[0, 'rgba(255,255,255,.16)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(0, 0, W, H);
  // soft water ripples
  ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.035)'; ctx.lineWidth = 3;
  for (let i = 0; i < 26; i++) { const y = (i * 83 + t * 6) % (H + 80) - 40; ctx.beginPath(); for (let x = 0; x <= W; x += 30) ctx.lineTo(x, y + Math.sin(x / 90 + i + t * .6) * 6); ctx.stroke(); }
  ctx.restore();
}
function landPath(ctx, name) {
  const rings = (window.GEO && GEO.c[name]) || []; ctx.beginPath();
  rings.forEach(r => { for (let i = 0; i < r.length; i += 2) { const [x, y] = P(r[i], r[i + 1]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); });
  return rings.length > 0;
}
let PAPER = null;
function paperPattern(ctx) {
  if (PAPER) return PAPER;
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), R = rng(77);
  for (let i = 0; i < 1600; i++) { g.fillStyle = `rgba(${R() < .5 ? '60,40,20' : '255,250,235'},${.04 + R() * .06})`; g.fillRect(R() * 256, R() * 256, 1 + R() * 3, 1 + R() * 3); }
  return (PAPER = ctx.createPattern(c, 'repeat'));
}
// one country: fill colour (any hex), with drop shadow, paper texture and inked coast. o.p fades it in, o.edge = coast colour
function land(ctx, name, fill = MAPC.paper, o = {}) {
  if (o.p !== undefined && o.p <= 0) return;
  ctx.save(); if (o.p !== undefined) ctx.globalAlpha = clamp(o.p);
  if (!landPath(ctx, name)) { ctx.restore(); return; }
  ctx.shadowColor = 'rgba(0,30,40,.35)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 8;
  ctx.fillStyle = fill; ctx.fill('evenodd'); ctx.shadowColor = 'transparent';
  ctx.fillStyle = paperPattern(ctx); ctx.fill('evenodd');
  ctx.lineJoin = 'round'; ctx.strokeStyle = o.edge || 'rgba(45,32,18,.75)'; ctx.lineWidth = o.lw || 3; ctx.stroke();
  ctx.restore();
}
// every country in mapa.js in the faded background colour (skip the ones you paint yourself)
function bgLands(ctx, skip = [], fill = MAPC.bgLand) { Object.keys((window.GEO || { c: {} }).c).forEach(n => { if (!skip.includes(n)) land(ctx, n, fill, { edge: 'rgba(60,45,25,.45)', lw: 2 }); }); }
// colour spreading over a country from a point (conquest, independence): from -> to, k 0..1, start at [lon, lat]
function paintLand(ctx, name, from, to, k, at) {
  land(ctx, name, from); if (k <= 0) return;
  const [x, y] = at ? P(at[0], at[1]) : mapPt(name);
  ctx.save(); ctx.beginPath(); circle(ctx, x, y, 2600 * easeOut(clamp(k))); ctx.clip(); land(ctx, name, to); ctx.restore();
}
// centre of a country on screen (middle of its biggest piece)
function mapPt(name) {
  const rings = (window.GEO && GEO.c[name]) || []; let best = null, ba = -1;
  rings.forEach(r => { let a = 0, sx = 0, sy = 0; const xs = [], ys = []; for (let i = 0; i < r.length; i += 2) { xs.push(r[i]); ys.push(r[i + 1]); } a = (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys)); if (a > ba) { ba = a; best = [(Math.max(...xs) + Math.min(...xs)) / 2, (Math.max(...ys) + Math.min(...ys)) / 2]; } });
  return best ? P(best[0], best[1]) : [540, 1000];
}
// white uppercase map label with a dark rim; '\n' for two lines
function mapLabel(ctx, txt, x, y, p = 1, size = 34) {
  if (p <= 0) return;
  ctx.save(); ctx.globalAlpha = clamp(p * 2); ctx.translate(x, y + (1 - easeOut(clamp(p))) * 14);
  ctx.font = `700 ${size}px Inter`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  txt.split('\n').forEach((l, i, a) => { const yy = (i - (a.length - 1) / 2) * size * 1.1; ctx.strokeStyle = 'rgba(40,20,10,.85)'; ctx.lineWidth = size * .22; ctx.strokeText(l, 0, yy); ctx.fillStyle = '#fff'; ctx.fillText(l, 0, yy); });
  ctx.restore();
}
// year in a dark glassy box (1844)
function yearTag(ctx, txt, x, y, p = 1, size = 96) {
  if (p <= 0) return;
  ctx.save(); ctx.translate(x, y); const k = backOut(clamp(p * 1.4)); ctx.scale(k, k);
  ctx.font = `700 ${size}px Inter`; const w = ctx.measureText(txt).width + size * .7, h = size * 1.25;
  rrect(ctx, -w / 2, -h / 2, w, h, size * .22); ctx.fillStyle = 'rgba(25,35,40,.72)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 3; ctx.stroke();
  ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 10; text(ctx, txt, 0, 4, size, '#f2f2f2', 700);
  ctx.restore();
}
// ---- flags drawn in code. code: es, es_old (cruz de Borgoña), pt, fr, gb, us, mx, ht, do, cu, pr, br, ar, co, ve, cl, pe, nl, de, it, ru, cn, jp,
// or your own: {h: ['#c00', '#fff']} (horizontal stripes) / {v: [...]} (vertical)
const FLAGS = {
  es: { h: ['#c60b1e', '#ffc400', '#ffc400', '#c60b1e'] }, pt: { v: ['#046a38', '#046a38', '#da291c', '#da291c', '#da291c'], dot: ['#ffe900', .4, .5] },
  fr: { v: ['#0055a4', '#fff', '#ef4135'] }, mx: { v: ['#006847', '#fff', '#ce1126'], dot: ['#8a5a2b', .5, .5] }, ht: { h: ['#00209f', '#d21034'], box: '#fff' },
  br: { h: ['#009c3b'], dia: '#ffdf00', dot: ['#002776', .5, .5] }, ar: { h: ['#74acdf', '#fff', '#74acdf'], dot: ['#f6b40e', .5, .5] },
  co: { h: ['#fcd116', '#fcd116', '#003893', '#ce1126'] }, ve: { h: ['#ffcc00', '#00247d', '#cf142b'] }, pe: { v: ['#d91023', '#fff', '#d91023'] },
  nl: { h: ['#ae1c28', '#fff', '#21468b'] }, de: { h: ['#000', '#dd0000', '#ffce00'] }, it: { v: ['#009246', '#fff', '#ce2b37'] },
  ru: { h: ['#fff', '#0039a6', '#d52b1e'] }, cn: { h: ['#de2910'], star: ['#ffde00', .2, .3] }, jp: { h: ['#fff'], dot: ['#bc002d', .5, .5] },
  cu: { h: ['#002a8f', '#fff', '#002a8f', '#fff', '#002a8f'], tri: '#cf142b' }, pr: { h: ['#ed0000', '#fff', '#ed0000', '#fff', '#ed0000'], tri: '#0050f0' },
  cl: { h: ['#fff', '#d52b1e'], canton: '#0039a6' }, us: { h: ['#b22234', '#fff', '#b22234', '#fff', '#b22234', '#fff', '#b22234'], canton: '#3c3b6e' },
};
function flagArt(g, code, w, h) {
  if (code === 'es_old') { g.fillStyle = '#f4f1e8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c4161c'; g.lineWidth = h * .14; g.lineCap = 'round'; g.beginPath(); g.moveTo(w * .12, h * .12); g.lineTo(w * .88, h * .88); g.moveTo(w * .88, h * .12); g.lineTo(w * .12, h * .88); g.stroke(); return; }
  if (code === 'gb') { g.fillStyle = '#012169'; g.fillRect(0, 0, w, h); g.strokeStyle = '#fff'; g.lineWidth = h * .2; g.beginPath(); g.moveTo(0, 0); g.lineTo(w, h); g.moveTo(w, 0); g.lineTo(0, h); g.stroke(); g.strokeStyle = '#c8102e'; g.lineWidth = h * .07; g.stroke(); g.fillStyle = '#fff'; g.fillRect(w * .42, 0, w * .16, h); g.fillRect(0, h * .37, w, h * .26); g.fillStyle = '#c8102e'; g.fillRect(w * .46, 0, w * .08, h); g.fillRect(0, h * .42, w, h * .16); return; }
  if (code === 'do') { const q = [['#002d62', 0, 0], ['#ce1126', 1, 0], ['#ce1126', 0, 1], ['#002d62', 1, 1]]; q.forEach(([c, i, j]) => { g.fillStyle = c; g.fillRect(i * w / 2, j * h / 2, w / 2, h / 2); }); g.fillStyle = '#fff'; g.fillRect(w * .44, 0, w * .12, h); g.fillRect(0, h * .41, w, h * .18); return; }
  const f = typeof code === 'string' ? FLAGS[code] || { h: ['#888'] } : code;
  if (f.h) f.h.forEach((c, i) => { g.fillStyle = c; g.fillRect(0, i * h / f.h.length, w, h / f.h.length + 1); });
  if (f.v) f.v.forEach((c, i) => { g.fillStyle = c; g.fillRect(i * w / f.v.length, 0, w / f.v.length + 1, h); });
  if (f.canton) { g.fillStyle = f.canton; g.fillRect(0, 0, w * .4, h * (f.h.length > 2 ? 4 / 7 : .5)); g.fillStyle = '#fff'; if (code === 'cl') { star(g, w * .2, h * .25, h * .12); g.fill(); } else for (let i = 0; i < 12; i++) { circle(g, w * (.05 + (i % 4) * .1), h * (.08 + Math.floor(i / 4) * .17), h * .03); g.fill(); } }
  if (f.tri) { g.fillStyle = f.tri; g.beginPath(); g.moveTo(0, 0); g.lineTo(w * .45, h / 2); g.lineTo(0, h); g.fill(); g.fillStyle = '#fff'; star(g, w * .15, h / 2, h * .13); g.fill(); }
  if (f.dia) { g.fillStyle = f.dia; g.beginPath(); g.moveTo(w * .08, h / 2); g.lineTo(w / 2, h * .1); g.lineTo(w * .92, h / 2); g.lineTo(w / 2, h * .9); g.fill(); }
  if (f.box) { g.fillStyle = f.box; g.fillRect(w * .36, h * .3, w * .28, h * .4); }
  if (f.dot) { g.fillStyle = f.dot[0]; circle(g, w * f.dot[1], h * f.dot[2], h * .2); g.fill(); }
  if (f.star) { g.fillStyle = f.star[0]; star(g, w * f.star[1], h * f.star[2], h * .14); g.fill(); }
}
function star(ctx, x, y, r) { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); }
const FLAG_CACHE = {};
// a waving flag, top-left at (x, y)
function flag(ctx, code, x, y, w, t = 0, amp = 1) {
  const h = w * .66, key = JSON.stringify(code) + w;
  if (!FLAG_CACHE[key]) { const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h); flagArt(c.getContext('2d'), code, c.width, c.height); FLAG_CACHE[key] = c; }
  const src = FLAG_CACHE[key], n = 24, sw = src.width / n;
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 4;
  for (let i = 0; i < n; i++) { const k = i / n, dy = Math.sin(t * 5 - k * 6) * h * .06 * k * amp; ctx.drawImage(src, i * sw, 0, sw + 1, src.height, x + i * sw, y + dy, sw + 1, h); ctx.shadowColor = 'transparent'; }
  // folds
  for (let i = 0; i < n; i++) { const k = i / n, s = Math.cos(t * 5 - k * 6) * k * amp; ctx.fillStyle = s > 0 ? `rgba(255,255,255,${s * .14})` : `rgba(0,0,0,${-s * .2})`; ctx.fillRect(x + i * sw, y + Math.sin(t * 5 - k * 6) * h * .06 * k * amp, sw + 1, h); }
  ctx.restore();
}
// flag on a pole planted at (x, y) (bottom of the pole); grows in with p
function flagPole(ctx, code, x, y, s = 1, t = 0, p = 1) {
  if (p <= 0) return; const k = easeOut(clamp(p)), hp = 150 * s * k;
  ctx.save(); line(ctx, x, y, x, y - hp, 5 * s, '#5b4632'); circle(ctx, x, y - hp - 4 * s, 6 * s); ctx.fillStyle = '#e0b85a'; ctx.fill();
  if (k > .3) { ctx.globalAlpha = clamp((k - .3) / .4); flag(ctx, code, x + 2 * s, y - hp, 90 * s, t); }
  ctx.restore();
}
// peg-doll person (wooden toy): o = {body, skin, hat: 'corona'|'sombrero'|'tricornio'|'casco'|'gorro'|'pluma'|'turbante', hair, hop, face}
function peg(ctx, x, y, s = 1, o = {}) {
  const body = o.body || '#7a4b2a', skin = o.skin || '#e9c29a';
  ctx.save(); ctx.translate(x, y - Math.abs(Math.sin((o.hop || 0) * Math.PI)) * 18 * s); ctx.scale(s, s);
  ellipse(ctx, 0, 2, 30, 9); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fill();
  rrect(ctx, -26, -78, 52, 80, [22, 22, 12, 12]); ctx.fillStyle = lin(ctx, -26, 0, 26, 0, [[0, shade(body, .25)], [.6, body], [1, shade(body, -.35)]]); ctx.fill();
  circle(ctx, 0, -100, 26); ctx.fillStyle = rad(ctx, -8, -110, 2, 30, [[0, shade(skin, .35)], [1, skin]]); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 2; ctx.stroke();
  if (o.hair) { ctx.beginPath(); ctx.arc(0, -102, 27, Math.PI * 1.05, Math.PI * 1.95); ctx.lineTo(18, -104); ctx.quadraticCurveTo(0, -116, -18, -104); ctx.fillStyle = o.hair; ctx.fill(); }
  if (o.face !== false) { [-9, 9].forEach(dx => { circle(ctx, dx, -100, 3.4); ctx.fillStyle = '#2b1a10'; ctx.fill(); }); ctx.beginPath(); ctx.arc(0, -93, 6, .2, Math.PI - .2); ctx.strokeStyle = '#7a3b2a'; ctx.lineWidth = 2; ctx.stroke(); circle(ctx, -14, -92, 4); circle(ctx, 14, -92, 4); ctx.fillStyle = 'rgba(230,110,90,.35)'; ctx.fill(); }
  const hat = o.hat;
  if (hat === 'corona') { ctx.beginPath(); ctx.moveTo(-22, -118); ctx.lineTo(-24, -146); ctx.lineTo(-12, -132); ctx.lineTo(0, -150); ctx.lineTo(12, -132); ctx.lineTo(24, -146); ctx.lineTo(22, -118); ctx.closePath(); ctx.fillStyle = lin(ctx, 0, -150, 0, -118, [[0, '#ffe27a'], [1, '#d99a1c']]); ctx.fill(); circle(ctx, 0, -128, 4); ctx.fillStyle = '#d63a3f'; ctx.fill(); }
  if (hat === 'sombrero') { ellipse(ctx, 0, -118, 44, 10); ctx.fillStyle = '#e2c27a'; ctx.fill(); rrect(ctx, -20, -142, 40, 26, 10); ctx.fill(); ctx.fillStyle = '#9a6b2b'; ctx.fillRect(-20, -124, 40, 6); }
  if (hat === 'tricornio') { ctx.beginPath(); ctx.moveTo(-40, -114); ctx.quadraticCurveTo(0, -160, 40, -114); ctx.quadraticCurveTo(0, -126, -40, -114); ctx.fillStyle = '#1e1c22'; ctx.fill(); }
  if (hat === 'casco') { ctx.beginPath(); ctx.ellipse(0, -118, 46, 9, 0, 0, TAU); ctx.fillStyle = '#b9c0c8'; ctx.fill(); ctx.beginPath(); ctx.arc(0, -118, 24, Math.PI, 0); ctx.fillStyle = lin(ctx, 0, -142, 0, -118, [[0, '#eef2f6'], [1, '#9aa3ad']]); ctx.fill(); line(ctx, 0, -142, 0, -152, 5, '#9aa3ad'); }
  if (hat === 'gorro') { ctx.beginPath(); ctx.arc(0, -114, 26, Math.PI, 0); ctx.quadraticCurveTo(10, -150, -6, -150); ctx.fillStyle = o.hatCol || '#c8332f'; ctx.fill(); }
  if (hat === 'pluma') { ctx.fillStyle = '#c8332f'; ctx.fillRect(-26, -118, 52, 7); [[-6, '#f2c230'], [4, '#3c9b4c']].forEach(([dx, c]) => { ellipse(ctx, dx, -140, 6, 20, dx * .03); ctx.fillStyle = c; ctx.fill(); }); }
  if (hat === 'turbante') { ellipse(ctx, 0, -122, 28, 16); ctx.fillStyle = o.hatCol || '#f3efe6'; ctx.fill(); }
  ctx.restore();
}
// galleon with puffy sails rocking on the water; o.flag = flag code on the top mast
function ship(ctx, x, y, s = 1, t = 0, o = {}) {
  ctx.save(); ctx.translate(x, y + Math.sin(t * 2 + x) * 4 * s); ctx.rotate(Math.sin(t * 1.6 + x) * .03); ctx.scale(o.flip ? -s : s, s);
  ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-90, 6); ctx.quadraticCurveTo(-140, 10, -170, 4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-90, -30); ctx.lineTo(95, -30); ctx.quadraticCurveTo(90, 0, 60, 8); ctx.lineTo(-70, 8); ctx.quadraticCurveTo(-90, -5, -90, -30); ctx.fillStyle = lin(ctx, 0, -30, 0, 8, [[0, '#8a5530'], [1, '#4d2c16']]); ctx.fill();
  ctx.fillStyle = '#e7c46a'; ctx.fillRect(-82, -22, 168, 4);
  rrect(ctx, -92, -58, 40, 30, 4); ctx.fillStyle = '#6b3f22'; ctx.fill();
  [[-40, 120], [10, 150], [58, 110]].forEach(([mx, mh]) => {
    line(ctx, mx, -30, mx, -30 - mh, 4, '#4d2c16');
    for (let j = 0; j < 2; j++) { const sy = -30 - mh + 14 + j * mh * .42, sw = 34 - j * 2 + mh * .1, sh = mh * .34; ctx.beginPath(); ctx.moveTo(mx - sw, sy); ctx.quadraticCurveTo(mx, sy + sh * .25, mx + sw, sy); ctx.lineTo(mx + sw * .92, sy + sh); ctx.quadraticCurveTo(mx, sy + sh * 1.2, mx - sw * .92, sy + sh); ctx.closePath(); ctx.fillStyle = lin(ctx, mx - sw, 0, mx + sw, 0, [[0, '#ffffff'], [1, '#d9d4c8']]); ctx.fill(); ctx.strokeStyle = 'rgba(80,60,40,.3)'; ctx.lineWidth = 1.5; ctx.stroke(); }
  });
  if (o.flag) { ctx.save(); ctx.scale(o.flip ? -1 : 1, 1); flag(ctx, o.flag, o.flip ? -8 : 12, -200, 44, t); ctx.restore(); }
  ctx.restore();
}
// small scene pieces
function hut(ctx, x, y, s = 1) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ellipse(ctx, 0, 4, 46, 10); ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fill(); rrect(ctx, -32, -46, 64, 48, 6); ctx.fillStyle = '#a77a45'; ctx.fill(); ctx.fillStyle = '#4a2f18'; rrect(ctx, -9, -30, 18, 32, 8); ctx.fill(); ctx.beginPath(); ctx.moveTo(-46, -40); ctx.lineTo(0, -96); ctx.lineTo(46, -40); ctx.closePath(); ctx.fillStyle = lin(ctx, -46, 0, 46, 0, [[0, '#e3c27c'], [1, '#a57f3e']]); ctx.fill(); ctx.strokeStyle = 'rgba(90,60,20,.4)'; ctx.lineWidth = 2; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(0, -94); ctx.lineTo(i * 13, -42); ctx.stroke(); } ctx.restore(); }
function house(ctx, x, y, s = 1, roof = '#b8452e') { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ellipse(ctx, 0, 4, 50, 10); ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fill(); ctx.fillStyle = lin(ctx, -36, 0, 36, 0, [[0, '#fbf6ea'], [1, '#d8cfbd']]); ctx.fillRect(-36, -50, 72, 52); ctx.fillStyle = '#6a4a2c'; ctx.fillRect(-8, -26, 16, 28); ctx.fillStyle = '#6fa8c9'; ctx.fillRect(-28, -38, 12, 12); ctx.fillRect(16, -38, 12, 12); ctx.beginPath(); ctx.moveTo(-44, -48); ctx.lineTo(0, -82); ctx.lineTo(44, -48); ctx.closePath(); ctx.fillStyle = roof; ctx.fill(); ctx.restore(); }
function fire(ctx, x, y, s = 1, t = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = rad(ctx, 0, -40, 0, 140, [[0, 'rgba(255,190,80,.5)'], [1, 'rgba(255,120,40,0)']]); ctx.fillRect(-140, -180, 280, 220);
  for (let i = 0; i < 5; i++) { const ph = t * 7 + i * 1.7, h = 70 + Math.sin(ph) * 18 - i * 6, dx = (i - 2) * 16; ctx.beginPath(); ctx.moveTo(dx - 18, 0); ctx.quadraticCurveTo(dx - 20, -h * .6, dx + Math.sin(ph) * 8, -h); ctx.quadraticCurveTo(dx + 20, -h * .5, dx + 18, 0); ctx.fillStyle = i % 2 ? '#ffb02e' : '#ff6a1e'; ctx.fill(); }
  for (let i = 0; i < 6; i++) { const k = ((t * .5 + i / 6) % 1); circle(ctx, Math.sin(i * 3 + t) * 20 + k * 30, -90 - k * 160, 18 + k * 30); ctx.fillStyle = `rgba(90,90,90,${.35 * (1 - k)})`; ctx.fill(); }
  ctx.restore();
}
function cow(ctx, x, y, s = 1, t = 0, flip = false) {
  ctx.save(); ctx.translate(x, y); ctx.scale(flip ? -s : s, s); const st = Math.sin(t * 6) * 5;
  ellipse(ctx, 0, 4, 40, 7); ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fill();
  [[-22, st], [-12, -st], [14, st], [24, -st]].forEach(([lx, a]) => line(ctx, lx, -20, lx + a * .6, 2, 7, '#5a321c'));
  ellipse(ctx, 0, -30, 36, 18); ctx.fillStyle = '#8a4b26'; ctx.fill();
  [[-12, -34, 9], [10, -26, 7], [20, -36, 5]].forEach(([sx, sy, r]) => { circle(ctx, sx, sy, r); ctx.fillStyle = '#f3ece0'; ctx.fill(); });
  ellipse(ctx, 38, -40, 13, 11); ctx.fillStyle = '#8a4b26'; ctx.fill(); ellipse(ctx, 47, -36, 7, 6); ctx.fillStyle = '#e8b9a0'; ctx.fill();
  line(ctx, 32, -50, 28, -58, 4, '#efe6d4'); line(ctx, 42, -50, 46, -58, 4, '#efe6d4');
  ctx.restore();
}
function palm(ctx, x, y, s = 1, t = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.beginPath(); ctx.moveTo(-5, 0); ctx.quadraticCurveTo(10, -60, 4, -120); ctx.lineWidth = 10; ctx.strokeStyle = '#8a6236'; ctx.stroke();
  for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * .55 + Math.sin(t * 2 + i) * .04; ctx.beginPath(); ctx.moveTo(4, -120); ctx.quadraticCurveTo(4 + Math.cos(a) * 40, -120 + Math.sin(a) * 40 - 14, 4 + Math.cos(a) * 70, -120 + Math.sin(a) * 50 + 20); ctx.lineWidth = 9; ctx.strokeStyle = i % 2 ? '#3f8a3a' : '#5aa548'; ctx.stroke(); }
  ctx.restore();
}
function cane(ctx, x, y, s = 1, t = 0) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); for (let i = 0; i < 7; i++) { const dx = (i - 3) * 8, h = 60 + (i * 37) % 20, sw = Math.sin(t * 2 + i) * 3; line(ctx, dx, 0, dx + sw, -h, 4, '#6aa84a'); line(ctx, dx + sw, -h + 10, dx + sw + 12, -h - 2, 3, '#8cc45c'); } ctx.restore(); }
// a line across the map in lon/lat ([[lon, lat], ...]); dashed = treaty lines, solid = routes/rivers. p draws it in
function mapLine(ctx, pts, p = 1, col = '#fff', o = {}) {
  if (p <= 0) return; const sp = pts.map(q => P(q[0], q[1]));
  let L = 0; const seg = []; for (let i = 1; i < sp.length; i++) { const d = Math.hypot(sp[i][0] - sp[i - 1][0], sp[i][1] - sp[i - 1][1]); seg.push(d); L += d; }
  let left = L * clamp(p); ctx.save(); ctx.beginPath(); ctx.moveTo(sp[0][0], sp[0][1]); let end = sp[0];
  for (let i = 1; i < sp.length && left > 0; i++) { const k = Math.min(1, left / seg[i - 1]); end = [lerp(sp[i - 1][0], sp[i][0], k), lerp(sp[i - 1][1], sp[i][1], k)]; ctx.lineTo(end[0], end[1]); left -= seg[i - 1]; }
  if (o.dash) ctx.setLineDash(o.dash); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = (o.w || 6) + 4; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = o.w || 6; ctx.stroke();
  if (o.arrow && p > .05) { const a = sp.length > 1 ? Math.atan2(end[1] - sp[Math.max(0, sp.length - 2)][1], end[0] - sp[Math.max(0, sp.length - 2)][0]) : 0; ctx.setLineDash([]); ctx.translate(end[0], end[1]); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-12, -13); ctx.lineTo(-12, 13); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); }
  ctx.restore(); return end;
}
// wavy river (blue) between map points
function river(ctx, pts, p = 1, t = 0) { mapLine(ctx, pts, p, '#3b8fe0', { w: 7 }); }

// ============ ESTILO 'tech': negro con brillo naranja, móviles y ventanas, chips con icono, letras grandes ============
const TC = { or: '#ff7a1a', or2: '#ffa24d', ink: '#f5efe9', dim: '#8d8079', card: '#191514', card2: '#221c1a' };
function techBg(ctx, t, gx = 540, gy = 1150) {
  ctx.fillStyle = '#0b0807'; ctx.fillRect(0, 0, W, H);
  const pu = 1 + Math.sin(t * .8) * .04;
  ctx.fillStyle = rad(ctx, gx, gy, 0, 820 * pu, [[0, 'rgba(255,110,25,.30)'], [.4, 'rgba(160,55,10,.16)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalAlpha = .05; ctx.strokeStyle = '#ff9a50'; ctx.lineWidth = 2; for (let i = 1; i < 5; i++) { circle(ctx, gx, gy, i * 190 + (t * 20) % 190); ctx.stroke(); } ctx.restore();
}
function techEnter(ctx, x, y, p, rot = 0) { const k = backOut(clamp(p)); ctx.translate(x, y + (1 - easeOut(clamp(p))) * 120); ctx.scale(.85 + .15 * k, .85 + .15 * k); ctx.rotate(rot); ctx.globalAlpha *= clamp(p * 2.5); }
// phone mockup; drawScreen(ctx, sw, sh) draws in screen space (0,0 top-left). Use img: 'clave' to show a screenshot
function techPhone(ctx, x, y, w, p = 1, drawScreen, o = {}) {
  if (p <= 0) return; const h = w * 2.05, r = w * .16, sw = w - w * .07, sh = h - w * .07;
  ctx.save(); techEnter(ctx, x, y, p, o.rot || 0);
  ctx.shadowColor = 'rgba(255,110,30,.35)'; ctx.shadowBlur = 60; rrect(ctx, -w / 2, -h / 2, w, h, r); ctx.fillStyle = '#2b2b30'; ctx.fill(); ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3; ctx.stroke();
  ctx.save(); rrect(ctx, -sw / 2, -sh / 2, sw, sh, r * .85); ctx.clip(); ctx.translate(-sw / 2, -sh / 2);
  ctx.fillStyle = '#121214'; ctx.fillRect(0, 0, sw, sh);
  if (o.img && IMG[o.img] && IMG[o.img].naturalWidth) { const im = IMG[o.img], sc = sw / im.naturalWidth, off = (o.scroll || 0) * Math.max(0, im.naturalHeight * sc - sh); ctx.drawImage(im, 0, -off, sw, im.naturalHeight * sc); }
  if (drawScreen) drawScreen(ctx, sw, sh);
  ctx.restore();
  rrect(ctx, -w * .14, -h / 2 + w * .06, w * .28, w * .07, w * .035); ctx.fillStyle = '#000'; ctx.fill();
  ctx.restore();
}
// browser / app window with the three dots; drawInside(ctx, w, h) in window space under the bar
function techWindow(ctx, x, y, w, h, p = 1, drawInside, o = {}) {
  if (p <= 0) return; ctx.save(); techEnter(ctx, x, y, p, o.rot || 0);
  ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 40; rrect(ctx, -w / 2, -h / 2, w, h, 18); ctx.fillStyle = o.light ? '#f4f4f6' : TC.card; ctx.fill(); ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 2; ctx.stroke();
  ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => { circle(ctx, -w / 2 + 26 + i * 22, -h / 2 + 24, 7); ctx.fillStyle = c; ctx.fill(); });
  if (o.title) text(ctx, o.title, 0, -h / 2 + 24, 20, o.light ? '#666' : TC.dim, 600);
  ctx.save(); rrect(ctx, -w / 2, -h / 2 + 48, w, h - 48, [0, 0, 18, 18]); ctx.clip(); ctx.translate(-w / 2, -h / 2 + 48);
  if (o.img && IMG[o.img] && IMG[o.img].naturalWidth) { const im = IMG[o.img], sc = Math.max(w / im.naturalWidth, (h - 48) / im.naturalHeight); ctx.drawImage(im, (w - im.naturalWidth * sc) / 2, 0, im.naturalWidth * sc, im.naturalHeight * sc); }
  if (drawInside) drawInside(ctx, w, h - 48);
  ctx.restore(); ctx.restore();
}
// icon glyphs for chips: sol, pincel, robot, rayo, check, code, carpeta, reloj, dinero, foto, chat, mundo, flecha, candado
function techIcon(ctx, kind, x, y, s = 1, col = TC.or) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const L = (a, b, c, d) => { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); };
  if (kind === 'sol') { circle(ctx, 0, 0, 9); ctx.fill(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; L(Math.cos(a) * 14, Math.sin(a) * 14, Math.cos(a) * 20, Math.sin(a) * 20); } }
  else if (kind === 'pincel') { ctx.lineWidth = 6; L(-14, 14, 10, -10); ctx.fillStyle = '#fff'; circle(ctx, 13, -13, 6); ctx.fill(); }
  else if (kind === 'robot') { rrect(ctx, -16, -12, 32, 24, 6); ctx.fill(); ctx.fillStyle = '#111'; circle(ctx, -7, 0, 3.5); ctx.fill(); circle(ctx, 7, 0, 3.5); ctx.fill(); L(0, -12, 0, -20); }
  else if (kind === 'rayo') { ctx.beginPath(); ctx.moveTo(4, -20); ctx.lineTo(-10, 3); ctx.lineTo(1, 3); ctx.lineTo(-4, 20); ctx.lineTo(10, -3); ctx.lineTo(-1, -3); ctx.closePath(); ctx.fill(); }
  else if (kind === 'check') { ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(-3, 10); ctx.lineTo(14, -10); ctx.stroke(); }
  else if (kind === 'code') { ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-8, -10); ctx.lineTo(-18, 0); ctx.lineTo(-8, 10); ctx.moveTo(8, -10); ctx.lineTo(18, 0); ctx.lineTo(8, 10); ctx.moveTo(4, -14); ctx.lineTo(-4, 14); ctx.stroke(); }
  else if (kind === 'carpeta') { rrect(ctx, -18, -10, 36, 26, 4); ctx.fill(); rrect(ctx, -18, -15, 16, 8, 3); ctx.fill(); }
  else if (kind === 'reloj') { circle(ctx, 0, 0, 16); ctx.stroke(); L(0, 0, 0, -9); L(0, 0, 7, 4); }
  else if (kind === 'dinero') { text(ctx, '$', 0, 2, 34, col, 700); }
  else if (kind === 'foto') { rrect(ctx, -18, -13, 36, 26, 5); ctx.stroke(); circle(ctx, 0, 0, 6); ctx.stroke(); }
  else if (kind === 'chat') { rrect(ctx, -18, -14, 36, 24, 8); ctx.fill(); ctx.beginPath(); ctx.moveTo(-8, 10); ctx.lineTo(-12, 18); ctx.lineTo(0, 10); ctx.fill(); }
  else if (kind === 'mundo') { circle(ctx, 0, 0, 16); ctx.stroke(); ellipse(ctx, 0, 0, 7, 16); ctx.stroke(); L(-16, 0, 16, 0); }
  else if (kind === 'flecha') { ctx.lineWidth = 5; L(-14, 0, 14, 0); L(6, -8, 14, 0); L(6, 8, 14, 0); }
  else if (kind === 'candado') { rrect(ctx, -14, -2, 28, 20, 4); ctx.fill(); ctx.beginPath(); ctx.arc(0, -4, 9, Math.PI, 0); ctx.stroke(); }
  ctx.restore();
}
// dark rounded row with an icon and a short text (lists: "una idea", "unas referencias"...)
function techChip(ctx, icon, txt, x, y, w = 520, p = 1, col = TC.or) {
  if (p <= 0) return; ctx.save(); ctx.translate(x + (1 - easeOut(clamp(p))) * 80, y); ctx.globalAlpha *= clamp(p * 2);
  rrect(ctx, -w / 2, -42, w, 84, 20); ctx.fillStyle = lin(ctx, 0, -42, 0, 42, [[0, '#2a2422'], [1, '#191514']]); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.1)'; ctx.lineWidth = 2; ctx.stroke();
  techIcon(ctx, icon, -w / 2 + 48, 0, 1, col); text(ctx, txt, -w / 2 + 92, 2, 36, TC.ink, 600, 'Inter', 'left');
  ctx.restore();
}
// orange pill (solid = orange with dark text, else outlined)
function techPill(ctx, txt, x, y, p = 1, solid = true, size = 30) {
  if (p <= 0) return; ctx.save(); ctx.translate(x, y); const k = backOut(clamp(p * 1.4)); ctx.scale(k, k);
  ctx.font = `700 ${size}px Inter`; const w = ctx.measureText(txt).width + size * 1.2, h = size * 1.55;
  rrect(ctx, -w / 2, -h / 2, w, h, h / 2); if (solid) { ctx.fillStyle = TC.or; ctx.fill(); } else { ctx.fillStyle = 'rgba(30,24,22,.9)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; ctx.stroke(); }
  text(ctx, txt, 0, 2, size, solid ? '#1a0e06' : TC.ink, 700); ctx.restore();
}
// big display word in Unica One: white part + orange part ("24" "mb"). A number in a counts up with p
function techBig(ctx, a, b, x, y, size = 200, p = 1) {
  if (p <= 0) return; ctx.save(); ctx.translate(x, y); const k = backOut(clamp(p * 1.3)); ctx.scale(k, k);
  const num = /^\d+$/.test(a) ? String(Math.round(+a * easeOut(clamp(p * 1.2)))) : a;
  ctx.font = `400 ${size}px 'Unica One'`; const wa = ctx.measureText(num + ' ').width, wb = b ? ctx.measureText(b).width : 0; let x0 = -(wa + wb) / 2;
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.shadowColor = 'rgba(255,120,30,.45)'; ctx.shadowBlur = 30;
  ctx.fillStyle = TC.ink; ctx.fillText(num, x0, 0); if (b) { ctx.fillStyle = TC.or; ctx.fillText(b, x0 + wa, 0); }
  ctx.restore();
}
// grid of tiles popping in (photos if keys are images, else warm/cool gradient tiles)
function techGrid(ctx, x, y, w, cols, rows, p = 1, keys = [], seed = 3) {
  const g = 8, tw = (w - g * (cols - 1)) / cols, R = rng(seed);
  for (let i = 0; i < cols * rows; i++) {
    const c = i % cols, r = Math.floor(i / cols), q = clamp(p * (cols * rows) / 6 - (c + r) * .25), tx = x - w / 2 + c * (tw + g), ty = y + r * (tw + g), hue = R();
    if (q <= 0) continue; ctx.save(); ctx.globalAlpha = clamp(q * 2); ctx.translate(tx + tw / 2, ty + tw / 2); ctx.scale(.6 + .4 * easeOut(clamp(q)), .6 + .4 * easeOut(clamp(q)));
    rrect(ctx, -tw / 2, -tw / 2, tw, tw, 8); ctx.save(); ctx.clip();
    const key = keys[i % (keys.length || 1)];
    if (key && IMG[key] && IMG[key].naturalWidth) { const im = IMG[key], sc = Math.max(tw / im.naturalWidth, tw / im.naturalHeight); ctx.drawImage(im, -im.naturalWidth * sc / 2, -im.naturalHeight * sc / 2, im.naturalWidth * sc, im.naturalHeight * sc); }
    else { ctx.fillStyle = lin(ctx, -tw / 2, -tw / 2, tw / 2, tw / 2, hue < .4 ? [[0, '#1d5e6b'], [1, '#c9a46a']] : hue < .75 ? [[0, '#3a2a40'], [1, '#ff8a3c']] : [[0, '#9fb3c4'], [1, '#2c3a48']]); ctx.fillRect(-tw / 2, -tw / 2, tw, tw); }
    ctx.restore(); ctx.restore();
  }
}
// '</>' badge
function codeBadge(ctx, x, y, s = 1, p = 1) { if (p <= 0) return; ctx.save(); ctx.translate(x, y); const k = backOut(clamp(p * 1.4)); ctx.scale(s * k, s * k); rrect(ctx, -90, -70, 180, 140, 26); ctx.fillStyle = '#16181c'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 3; ctx.stroke(); techIcon(ctx, 'code', 0, 0, 2.6, '#fff'); ctx.restore(); }
// mouse pointer with a click ripple at tClick (lt seconds)
function techCursor(ctx, x, y, lt = 0, tClick = 99) {
  const c = lt - tClick; if (c > 0 && c < .5) { circle(ctx, x, y, 10 + c * 90); ctx.strokeStyle = `rgba(255,140,60,${1 - c * 2})`; ctx.lineWidth = 4; ctx.stroke(); }
  ctx.save(); ctx.translate(x, y); const k = c > 0 && c < .15 ? .85 : 1; ctx.scale(k, k);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 46); ctx.lineTo(12, 35); ctx.lineTo(22, 56); ctx.lineTo(30, 52); ctx.lineTo(20, 32); ctx.lineTo(36, 32); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#111'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
}
// glowing curved link between two points (A connects to B)
function techLink(ctx, x1, y1, x2, y2, p = 1, t = 0) {
  if (p <= 0) return; ctx.save(); ctx.beginPath(); const mx = (x1 + x2) / 2, my = Math.min(y1, y2) - 120; ctx.moveTo(x1, y1); ctx.quadraticCurveTo(mx, my, x2, y2);
  ctx.setLineDash([2000]); ctx.lineDashOffset = 2000 * (1 - clamp(p)); ctx.strokeStyle = TC.or; ctx.lineWidth = 4; ctx.shadowColor = TC.or; ctx.shadowBlur = 16; ctx.stroke();
  const k = (t * .8) % 1, q = 1 - k; circle(ctx, q * q * x1 + 2 * q * k * mx + k * k * x2, q * q * y1 + 2 * q * k * my + k * k * y2, 7); ctx.fillStyle = '#fff'; if (p >= 1) ctx.fill(); ctx.restore();
}
// progress bar (uploads, loading)
function techBar(ctx, x, y, w, k, label = '') { rrect(ctx, x - w / 2, y - 12, w, 24, 12); ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fill(); rrect(ctx, x - w / 2, y - 12, Math.max(24, w * clamp(k)), 24, 12); ctx.fillStyle = TC.or; ctx.fill(); if (label) text(ctx, label, x, y + 46, 28, TC.dim, 600); }

// ============ ESTILO 'neon': palitos blancos con brillo sobre negro, suelo con reflejo, metáforas ============
const NC = { white: '#f6f6f6', pink: '#ff5c8a', dress: '#ff6f91', orange: '#ff9a3c', teal: '#38d6cf', gold: '#ffd23f', blue: '#4aa8ff', slate: '#2a3039' };
const FLOOR = 1380;
// draws scene(ctx) and its faded mirror under the floor line
function neonScene(ctx, t, scene, floor = FLOOR) {
  ctx.fillStyle = '#030304'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = rad(ctx, 540, floor - 300, 0, 900, [[0, 'rgba(40,50,70,.25)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, floor); ctx.clip(); scene(ctx); ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.rect(0, floor, W, H - floor); ctx.clip(); ctx.globalAlpha = .2; ctx.translate(0, floor * 2); ctx.scale(1, -1); scene(ctx); ctx.restore();
  ctx.fillStyle = lin(ctx, 0, floor, 0, floor + 380, [[0, 'rgba(3,3,4,.2)'], [1, 'rgba(3,3,4,1)']]); ctx.fillRect(0, floor, W, H - floor);
  line(ctx, 0, floor, W, floor, 2, 'rgba(255,255,255,.55)');
}
// poses: angles in radians from straight down (+ = towards the right). [upper, lower] for each limb
const POSES = {
  stand: { la: [.25, .1], ra: [-.25, -.1], ll: [.12, 0], rl: [-.12, 0] },
  wave: { la: [.25, .1], ra: [-2.4, -2.9], ll: [.12, 0], rl: [-.12, 0] },
  cheer: { la: [2.5, 2.8], ra: [-2.5, -2.8], ll: [.2, 0], rl: [-.2, 0] },
  point: { la: [.25, .1], ra: [-1.6, -1.6], ll: [.12, 0], rl: [-.12, 0] },
  pull: { la: [-1.9, -1.6], ra: [-2.2, -1.9], ll: [.35, .1], rl: [-.3, -.1], lean: -.25 },
  sad: { la: [.08, .05], ra: [-.08, -.05], ll: [.08, 0], rl: [-.08, 0], lean: .15, head: .4 },
  hug: { la: [-1.4, -2.2], ra: [-1.2, -2.0], ll: [.1, 0], rl: [-.1, 0] },
  give: { la: [.25, .1], ra: [-1.3, -1.6], ll: [.12, 0], rl: [-.12, 0] },
};
const walkPose = t => { const a = Math.sin(t * 8) * .45; return { la: [-a * .7, -a * .5], ra: [a * .7, a * .5], ll: [a, a * .3 + .1], rl: [-a, -a * .3 + .1] }; };
const climbPose = t => { const a = Math.sin(t * 6); return { la: [3 + a * .25, 3.1], ra: [-3 + a * .25, -2.9], ll: [-.6 - a * .3, .3], rl: [-.3 + a * .3, .5], lean: -.1 }; };
// stick figure, feet at (x, y). o = {pose, col, dress, tie, hat:'copa', hair, s, face:'smile'|'sad'|'o', look: -1|1, glow}
function stick(ctx, x, y, s = 1, o = {}) {
  const pz = typeof o.pose === 'string' ? POSES[o.pose] : (o.pose || POSES.stand), col = o.col || NC.white, lw = 5;
  const leg = 62, torso = 74, arm = 46, hr = 27;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.look === -1 ? -1 : 1), s); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.shadowColor = o.glow || 'rgba(255,255,255,.75)'; ctx.shadowBlur = 14; ctx.strokeStyle = col; ctx.lineWidth = lw;
  const limb = (x0, y0, [a1, a2], L) => { const x1 = x0 + Math.sin(a1) * L, y1 = y0 + Math.cos(a1) * L, x2 = x1 + Math.sin(a2) * L, y2 = y1 + Math.cos(a2) * L; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); return [x2, y2]; };
  const hip = [0, -leg * 2 + 6], lean = pz.lean || 0, neck = [hip[0] + Math.sin(lean) * torso, hip[1] - Math.cos(lean) * torso];
  limb(hip[0], hip[1], pz.ll, leg); limb(hip[0], hip[1], pz.rl, leg);
  if (o.dress) { ctx.save(); ctx.shadowColor = o.dress; ctx.beginPath(); ctx.moveTo(neck[0] - 6, neck[1] + 14); ctx.lineTo(hip[0] - 34, hip[1] + 18); ctx.lineTo(hip[0] + 34, hip[1] + 18); ctx.lineTo(neck[0] + 6, neck[1] + 14); ctx.closePath(); ctx.fillStyle = o.dress; ctx.fill(); ctx.restore(); }
  ctx.beginPath(); ctx.moveTo(hip[0], hip[1]); ctx.lineTo(neck[0], neck[1]); ctx.stroke();
  if (o.tie) { ctx.save(); ctx.shadowColor = o.tie; ctx.beginPath(); ctx.moveTo(neck[0], neck[1] + 4); ctx.lineTo(neck[0] - 6, neck[1] + 30); ctx.lineTo(neck[0], neck[1] + 38); ctx.lineTo(neck[0] + 6, neck[1] + 30); ctx.closePath(); ctx.fillStyle = o.tie; ctx.fill(); ctx.restore(); }
  const sh = [neck[0], neck[1] + 10]; const hl = limb(sh[0], sh[1], pz.la, arm), hrr = limb(sh[0], sh[1], pz.ra, arm);
  const hc = [neck[0] + Math.sin(lean + (pz.head || 0)) * (hr + 2), neck[1] - Math.cos(lean + (pz.head || 0)) * (hr + 2)];
  circle(ctx, hc[0], hc[1], hr); ctx.fillStyle = '#050506'; ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
  if (o.hair) { ctx.beginPath(); ctx.arc(hc[0], hc[1], hr + 2, Math.PI * 1.1, Math.PI * 1.9); ctx.strokeStyle = o.hair; ctx.lineWidth = 8; ctx.stroke(); circle(ctx, hc[0] - hr * .9, hc[1] - hr * .5, 8); ctx.fillStyle = o.hair; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = lw; }
  if (o.hat === 'copa') { ctx.fillStyle = '#111'; ctx.strokeStyle = col; ctx.lineWidth = 3; rrect(ctx, hc[0] - 18, hc[1] - hr - 34, 36, 32, 3); ctx.fill(); ctx.stroke(); line(ctx, hc[0] - 28, hc[1] - hr - 2, hc[0] + 28, hc[1] - hr - 2, 4, col); ctx.fillStyle = NC.pink; ctx.fillRect(hc[0] - 18, hc[1] - hr - 10, 36, 6); }
  ctx.fillStyle = col; [-9, 9].forEach(dx => { circle(ctx, hc[0] + dx, hc[1] - 3, 3.2); ctx.fill(); });
  ctx.beginPath(); const f = o.face || 'smile'; if (f === 'smile') ctx.arc(hc[0], hc[1] + 4, 9, .25, Math.PI - .25); else if (f === 'sad') ctx.arc(hc[0], hc[1] + 16, 8, Math.PI + .3, -.3); else circle(ctx, hc[0], hc[1] + 9, 4); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke();
  if (o.holding) { ctx.save(); ctx.shadowColor = o.holding; ctx.shadowBlur = 14; circle(ctx, hrr[0], hrr[1], 9); ctx.fillStyle = o.holding; ctx.fill(); ctx.restore(); }
  ctx.restore();
  const m = o.look === -1 ? -1 : 1; return { handL: [x + hl[0] * s * m, y + hl[1] * s], handR: [x + hrr[0] * s * m, y + hrr[1] * s], head: [x + hc[0] * s * m, y + hc[1] * s] };
}
// dark tower/wall with levels from the bottom: levels = ['ARRUINADO', 'PRIMER TRABAJO', 'NEGOCIO', 'ÉXITO']; p raises it
function neonTower(ctx, x, yBase, w, h, levels = [], p = 1, lit = -1) {
  const hh = h * easeOut(clamp(p)); if (hh <= 2) return;
  ctx.save(); rrect(ctx, x - w / 2, yBase - hh, w, hh, 4); ctx.fillStyle = lin(ctx, x - w / 2, 0, x + w / 2, 0, [[0, '#2c333d'], [1, '#1b2027']]); ctx.fill();
  ctx.save(); ctx.clip(); const R = rng(9); ctx.fillStyle = 'rgba(255,255,255,.05)'; for (let i = 0; i < 70; i++) { circle(ctx, x - w / 2 + R() * w, yBase - R() * h, 2 + R() * 4); ctx.fill(); } ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; ctx.stroke();
  levels.forEach((l, i) => { const ly = yBase - (i + .5) * h / levels.length; if (ly < yBase - hh + 10) return; const on = lit < 0 || i <= lit;
    ctx.globalAlpha = on ? 1 : .35; text(ctx, l, x - w / 2 + 26, ly, 26, NC.orange, 800, 'JetBrains Mono', 'left');
    ctx.beginPath(); ctx.moveTo(x - w / 2, ly + 22); ctx.lineTo(x - w / 2 - 16, ly + 18); ctx.lineTo(x - w / 2, ly + 30); ctx.fillStyle = '#9aa3ad'; ctx.fill(); ctx.globalAlpha = 1; });
  ctx.restore(); return (i) => yBase - (i + .5) * h / levels.length;
}
// stairs going up to the right, each step can carry a label
function neonStairs(ctx, x, yBase, n, sw, sh, p = 1, labels = []) {
  for (let i = 0; i < n; i++) { const q = clamp(p * n - i); if (q <= 0) break; const sx = x + i * sw, sy = yBase - (i + 1) * sh * easeOut(q);
    rrect(ctx, sx, sy, sw, yBase - sy, 3); ctx.fillStyle = '#20262e'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; ctx.stroke();
    if (labels[i]) { ctx.font = `800 26px 'JetBrains Mono'`; const fs = Math.min(26, 26 * (sw - 16) / ctx.measureText(labels[i]).width); text(ctx, labels[i], sx + sw / 2, sy + 30, fs, NC.orange, 800, 'JetBrains Mono'); } }
  return i => [x + i * sw + sw / 2, yBase - (i + 1) * sh];
}
// glowing rope between two points with a little sag
function rope(ctx, x1, y1, x2, y2, sag = 30, col = NC.orange) { ctx.save(); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 + sag, x2, y2); ctx.strokeStyle = col; ctx.lineWidth = 3.5; ctx.shadowColor = col; ctx.shadowBlur = 12; ctx.stroke(); ctx.restore(); }
// two-line mono title at the top: white line, coloured line ("¿QUIÉN SOSTIENE" / "TU CUERDA?")
function neonTitle(ctx, l1, l2, y = 330, p = 1, col2 = NC.pink, size = 52) {
  if (p <= 0) return; ctx.save(); ctx.globalAlpha = clamp(p * 2); ctx.shadowColor = 'rgba(255,255,255,.4)'; ctx.shadowBlur = 10;
  if ('letterSpacing' in ctx) ctx.letterSpacing = size * .12 + 'px';
  text(ctx, l1, 540, y, size, '#fff', 800, 'JetBrains Mono'); if (l2) { ctx.shadowColor = col2; text(ctx, l2, 540, y + size * 1.25, size, col2, 800, 'JetBrains Mono'); }
  ctx.restore();
}
// floating hearts (love, gratitude) around (x, y)
function hearts(ctx, x, y, t, p = 1, n = 4, col = NC.pink) {
  if (p <= 0) return; for (let i = 0; i < n; i++) { const k = ((t * .5 + i / n) % 1), hx = x + Math.sin(i * 2.3 + t * 2) * 50 + (i - n / 2) * 22, hy = y - k * 160, s = (10 + (i % 3) * 5) * clamp(p * 2) * (1 - k * .4);
    ctx.save(); ctx.globalAlpha = (1 - k) * clamp(p * 2); ctx.translate(hx, hy); ctx.beginPath(); ctx.moveTo(0, s * .9); ctx.bezierCurveTo(-s * 1.6, -s * .3, -s * .6, -s * 1.5, 0, -s * .5); ctx.bezierCurveTo(s * .6, -s * 1.5, s * 1.6, -s * .3, 0, s * .9); ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 12; ctx.fill(); ctx.restore(); }
}
// tiny mono speech text next to a figure ("VEN CONMIGO.")
function neonSay(ctx, txt, x, y, p = 1, col = NC.white, size = 22) { if (p <= 0) return; ctx.save(); ctx.globalAlpha = clamp(p * 2); text(ctx, txt.slice(0, Math.ceil(txt.length * clamp(p * 1.5))), x, y, size, col, 800, 'JetBrains Mono'); ctx.restore(); }
// coins / gift glowing in a hand
function neonCoin(ctx, x, y, r = 14, col = NC.gold) { ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 16; circle(ctx, x, y, r); ctx.fillStyle = col; ctx.fill(); ctx.restore(); }

// ============ PERSONAJES en imagen (personajes/<estilo>/<nombre>.png, hechos con tools/personajes.py) ============
// pj(ctx, 'mapa/rey', x, yPies, alto, {p, hop, flip, rot, gray, shadow}) dibuja el personaje con los pies en (x, yPies).
//   p = entrada con rebote (0..1), hop = saltito (0..1 en bucle: (t * 2) % 1), flip = mira al otro lado, rot = inclinar (enfado, caída)
// La lista está en personajes/lista.js (window.PJ_LIST); todos se cargan antes de dibujar.
(function () { const L = window.PJ_LIST || {}; Object.keys(L).forEach(st => L[st].forEach(n => { const k = 'pj:' + st + '/' + n, im = new Image(); IMG[k] = im; window.IMG_LOADS.push(new Promise(r => { im.onload = im.onerror = r; })); im.src = 'personajes/' + st + '/' + n + '.png'; })); })();
function pj(ctx, name, x, y, h = 260, o = {}) {
  const im = IMG['pj:' + name]; if (!im || !im.naturalWidth) { console.log('pj: no hay ' + name); return; }
  const p = o.p === undefined ? 1 : o.p; if (p <= 0) return;
  const k = backOut(clamp(p * 1.3)), w = h * im.naturalWidth / im.naturalHeight, hop = o.hop ? Math.abs(Math.sin(o.hop * Math.PI)) * h * .12 : 0;
  ctx.save(); ctx.translate(x, y);
  if (o.shadow !== false && !name.startsWith('neon/')) { ellipse(ctx, 0, 0, w * .42 * (1 - hop / h), h * .045); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fill(); }
  ctx.translate(0, -hop); ctx.rotate(o.rot || 0); ctx.scale((o.flip ? -1 : 1) * k, k * (1 + (o.hop ? -Math.cos(o.hop * TAU) * .02 : 0)));
  if (o.gray) ctx.filter = 'grayscale(1) brightness(.8)';
  ctx.globalAlpha *= clamp(p * 3); ctx.drawImage(im, -w / 2, -h, w, h);
  ctx.restore();
}
