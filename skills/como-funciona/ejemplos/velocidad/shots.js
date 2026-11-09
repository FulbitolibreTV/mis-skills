// ---------- "¿Cuánto ganas manejando a 120 en vez de a 100?" ----------
window.CAPTIONS = 'low';
window.COVER = { t: 1.2, title: '¿Cuánto ganas yendo a *120* en vez de a *100*?' };
const L100 = 390, L120 = 690, Y0 = 1000;     // lane centres and the start line in the braking diagrams
const CAR100 = '#9fb4c8', CAR120 = '#e9ecef';

// braking diagram: two lanes from above, cyan = metres while reacting, gold = metres while braking
function diagram(ctx, t, cars, o = {}) {
  background(ctx, t, 540, 600, .35, 7);
  const px = o.px || PX;
  ctx.save(); cam(ctx, o.z || 1, o.cx || 540, o.cy || 920, t, .6);
  road(ctx, 240, 600, 0, o.wet || 0);
  // ruler every 10 m
  for (let m = 0; m <= 160; m += 10) { const y = Y0 - m * px; if (y < -200) break; line(ctx, 200, y, m % 50 ? 222 : 236, y, 3, 'rgba(255,255,255,.35)'); if (m % 50 === 0) mono(ctx, m + ' m', 190, y, 24, C.dim, 'right'); }
  line(ctx, 240, Y0, 840, Y0, 4, 'rgba(255,255,255,.5)');
  cars.forEach(c => {
    if (c.hide) return;
    const dec = c.dec || DEC, d = pos(c.kmh, c.s, dec), dr = Math.min(d, mps(c.kmh) * REACT), x = c.x;
    glow(ctx, () => { ctx.beginPath(); ctx.moveTo(x, Y0); ctx.lineTo(x, Y0 - dr * px); }, C.cyan, 6, .9);
    if (d > dr) glow(ctx, () => { ctx.beginPath(); ctx.moveTo(x, Y0 - dr * px); ctx.lineTo(x, Y0 - d * px); }, C.gold, 6, .9);
    car(ctx, x, Y0 - d * px + 50, .42, c.col, c.s > REACT && speedAt(c.kmh, c.s, dec) > 0 ? 1 : (c.s > REACT ? .5 : 0));
    if (c.dim) dimLine(ctx, x + 70, Y0, x + 70, Y0 - stopDist(c.kmh, dec) * px, c.dim, c.dimP ?? 1);
  });
  o.over && o.over(ctx);
  ctx.restore();
}
const LANE_TAGS = (ctx, p = 1) => { caps(ctx, '100 km/h', L100, 150, 26, C.cyan); caps(ctx, '120 km/h', L120, 150, 26, C.gold); };

// 0 · hook: the needle swings to 120, then back to 100
shot(0, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 620, .6, 1);
  // speed streaks behind the dial
  for (let i = 0; i < 14; i++) { const x = 80 + i * 70, y = ((t * 1800 + i * 337) % 2200) - 200; glow(ctx, () => { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 160); }, C.gold, 2, .25); }
  const t120 = WT('120'), t100 = WT('100');
  const v = t < t120 - .3 ? kf(lt, [[0, 40], [.6, 100, easeOut]]) : t < t100 - .2 ? kf(t, [[t120 - .3, 100], [t120 + .2, 120, backOut]]) : kf(t, [[t100 - .2, 120], [t100 + .3, 100, easeOut]]);
  ctx.save(); cam(ctx, kf(lt, [[0, 1.3], [.6, 1, easeOut], [3.3, 1.06]]), 540, 560, t, 1, 540, 560);
  speedo(ctx, 540, 560, 340, v, 180, v > 110 ? C.red : C.gold);
  ctx.restore();
});

// 1 · the trip: 50 km, two dots race, the fast one wins by 5 minutes
const ROUTE = [[230, 960], [300, 700], [720, 640], [820, 420], [430, 330], [600, 160]];
function routePt(p) { const n = ROUTE.length - 1, f = clamp(p) * n, i = Math.min(n - 1, Math.floor(f)), k = f - i; return [lerp(ROUTE[i][0], ROUTE[i + 1][0], k), lerp(ROUTE[i][1], ROUTE[i + 1][1], k)]; }
shot(1, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 600, .4, 2);
  const R = rng(3); ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 2;
  for (let i = 0; i < 18; i++) { ctx.beginPath(); ctx.moveTo(R() * W, R() * 1100); ctx.lineTo(R() * W, R() * 1100); ctx.stroke(); }
  const d = clamp(lt / .6);
  glow(ctx, () => { ctx.beginPath(); for (let i = 0; i <= 100 * d; i++) { const [x, y] = routePt(i / 100); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } }, 'rgba(255,255,255,.6)', 4, .5);
  const p100 = clamp((lt - .4) / 2.6), p120 = clamp((lt - .4) / 2.15);
  [[p100, C.cyan], [p120, C.gold]].forEach(([p, col]) => { const [x, y] = routePt(p); bloom(ctx, x, y, 80, col === C.cyan ? 'rgba(94,240,212,' : 'rgba(245,196,81,', .6); circle(ctx, x, y, 16); ctx.fillStyle = col; ctx.fill(); });
  label(ctx, 'A', 230, 960, 150, 1010, d, C.ink); label(ctx, 'B · 50 KM', 600, 160, 760, 120, d, C.ink);
  readout(ctx, '+5 min', 'de ventaja', 540, 1500, 84, (t - WT('minutos', 0, 1)) / .3, C.gold);
});

// 2 · the clocks: 30 min vs 25 min
shot(2, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 600, .4, 3);
  const a = (t - WT('tardas')) / .3, b = (t - WT('120', 0, 2)) / .3;
  car(ctx, 300, 430, .9, CAR100); car(ctx, 780, 430, .9, CAR120);
  caps(ctx, '100 km/h', 300, 630, 30, C.cyan); caps(ctx, '120 km/h', 780, 630, 30, C.gold);
  readout(ctx, String(Math.round(30 * easeOut(clamp(a / 3)))) + ' min', '', 300, 800, 76, a);
  readout(ctx, String(Math.round(25 * easeOut(clamp(b / 3)))) + ' min', '', 780, 800, 76, b, C.gold);
});

// 3 · real life: a red light, a queue, curves
shot(3, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 600, .4, 4);
  ctx.save(); cam(ctx, kf(lt, [[0, 1.05], [4.3, 1.15]]), 540, 620, t);
  road(ctx, 280, 520, 0);
  [[410, 860], [410, 600], [670, 760], [670, 470]].forEach(([x, y], i) => car(ctx, x, y, .8, ['#c94f4f', '#4f7cc9', '#d9dde3', '#c9a24f'][i], 1));
  // traffic light
  box3d(ctx, 860, 180, 130, 340, 20, lin(ctx, 860, 0, 990, 0, [[0, '#2b2f37'], [1, '#191b20']]), '#3a3f49', '#111', 24);
  [[C.red, 1], ['#ffb347', 0], [C.green, 0]].forEach(([col, on], i) => { circle(ctx, 925, 240 + i * 105, 40); ctx.fillStyle = on ? col : '#2a2a2a'; ctx.fill(); if (on) bloom(ctx, 925, 240 + i * 105, 150, 'rgba(255,79,99,', .6 + .2 * Math.sin(t * 6)); });
  ctx.restore();
  label(ctx, 'TRÁFICO', 410, 600, 150, 420, (t - WT('trafico')) / .4, C.ink);
  label(ctx, 'SEMÁFORO', 925, 240, 860, 1450, (t - WT('semaforos')) / .4, C.red);
  readout(ctx, '< 5 min', 'ganas todavía menos', 420, 1500, 70, (t - WT('menos', 0, 3)) / .3, C.cyan);
});

// 4 · braking: the rear of the car, lamps go red on "frenar"
shot(4, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 600, .5, 5);
  road(ctx, 140, 800, t * 900 * (t < WT('frenar') ? 1 : clamp(1 - (t - WT('frenar')) * .6)));
  const b = clamp((t - WT('frenar')) / .15);
  ctx.save(); cam(ctx, kf(lt, [[0, 1.0], [4, 1.18]]), 540, 600, t);
  car(ctx, 540, 520, 2.6, CAR120, b);
  ctx.restore();
  if (b > 0) bloom(ctx, 540, 900, 600, 'rgba(255,40,60,', .25 * b);
});

// 5 · something crosses in front
shot(5, 'flash', (ctx, lt, t) => {
  background(ctx, t, 540, 600, .4, 6);
  road(ctx, 140, 800, t * 1200);
  const bx = kf(lt, [[0, -80], [1.6, 1150]]), by = 330;
  circle(ctx, bx, by, 46); ctx.fillStyle = rad(ctx, bx - 14, by - 14, 4, 50, [[0, '#ff8a7a'], [1, '#c2202f']]); ctx.fill();
  line(ctx, bx - 30, by - 30, bx + 30, by + 30, 5, 'rgba(255,255,255,.6)');
  car(ctx, 540, 900, 1.1, CAR120);
  warn(ctx, 540, 600, 1.4, (lt - .5) / .3);
});

// 6 · the brain needs about a second
shot(6, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 520, .5, 8);
  const tc = WT('cerebro'), k = clamp((t - tc) / 1);
  brain(ctx, 540, 470, 1.7, t, .3 + .7 * k);
  readout(ctx, (Math.min(1, Math.max(0, t - tc))).toFixed(2).replace('.', ',') + ' s', 'reaccionando', 540, 860, 80, (t - tc) / .2, k >= 1 ? C.gold : C.ink);
  label(ctx, 'VER', 420, 420, 200, 230, (t - tc) / .4, C.cyan); label(ctx, 'DECIDIR', 650, 380, 860, 230, (t - tc - .4) / .4, C.cyan);
  label(ctx, 'PIE AL FRENO', 580, 760, 850, 1500, (t - tc - .9) / .4, C.gold, 26);
});

// 7 · the reaction metres: 28 m vs 33 m without braking at all
shot(7, 'cut', (ctx, lt, t) => {
  const a = clamp((t - WT('100', 0, 7)) / .9), b = clamp((t - WT('33')) / .9);
  diagram(ctx, t, [{ kmh: 100, x: L100, s: a * REACT, col: CAR100, dim: '28 m', dimP: a }, { kmh: 120, x: L120, s: b * REACT, col: CAR120, dim: '33 m', dimP: b }], { z: 1.6, cy: 962, px: PX });
  caps(ctx, 'sin frenar', 540, 1500, 30, C.cyan);
});

// 8 · braking grows with the square of the speed
shot(8, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 600, .35, 9);
  const ox = 170, oy = 980, gw = 760, gh = 760, sx = v => ox + v / 140 * gw, sy = d => oy - d / 110 * gh, br = v => mps(v) ** 2 / (2 * DEC);
  line(ctx, ox, oy, ox + gw, oy, 3, C.dim); line(ctx, ox, oy, ox, oy - gh, 3, C.dim);
  caps(ctx, 'velocidad', ox + gw / 2, oy + 50, 24, C.dim); caps(ctx, 'frenada', ox - 30, oy - gh - 30, 24, C.dim, 700, 'left');
  const p = easeOut(clamp(lt / 2));
  glow(ctx, () => { ctx.beginPath(); for (let v = 0; v <= 140 * p; v += 2) { v ? ctx.lineTo(sx(v), sy(br(v))) : ctx.moveTo(sx(v), sy(br(v))); } }, C.gold, 5, 1);
  [[100, C.cyan], [120, C.gold]].forEach(([v, col], i) => { if (p * 140 < v) return; circle(ctx, sx(v), sy(br(v)), 14); ctx.fillStyle = col; ctx.fill(); line(ctx, sx(v), sy(br(v)), sx(v), oy, 2, col); mono(ctx, String(v), sx(v), oy + 24, 26, col); });
  const q = (t - WT('cuadrado')) / .3; if (q > 0) readout(ctx, 'd ∝ v²', '', 400, 400, 90, q, C.gold);
});

// 9 · +20 % speed, +44 % braking
shot(9, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 600, .35, 10);
  const bars = [['velocidad', 1.2, '+20 %', C.cyan, WT('20')], ['frenada', 1.44, '+44 %', C.gold, WT('44')]];
  bars.forEach(([name, k, txt, col, tw], i) => {
    const y = 420 + i * 300, base = 420, p = easeOut(clamp((t - tw + .2) / .7));
    caps(ctx, name, 140, y - 70, 28, C.dim, 700, 'left');
    rrect(ctx, 140, y - 30, base, 60, 14); ctx.fillStyle = '#2a2e36'; ctx.fill();
    rrect(ctx, 140, y - 30, base * lerp(1, k, p), 60, 14); ctx.fillStyle = col; ctx.globalAlpha = .9; ctx.fill(); ctx.globalAlpha = 1;
    line(ctx, 140 + base, y - 46, 140 + base, y + 46, 3, '#fff');
    if (p > 0) mono(ctx, txt, 160 + base * lerp(1, k, p) + 20, y, 52, col, 'left');
  });
});

// 10 · dry asphalt: the car at 100 stops after about 83 m
shot(10, 'zoom', (ctx, lt, t) => {
  const s = Math.max(0, lt - .3) * 1.7;
  diagram(ctx, t, [{ kmh: 100, x: L100, s, col: CAR100, dim: '83 m', dimP: clamp((t - WT('83')) / .5) }, { kmh: 120, x: L120, s: 0, col: CAR120, hide: true }], {});
  LANE_TAGS(ctx);
});
// 11 · the car at 120 needs about 113 m
shot(11, 'cut', (ctx, lt, t) => {
  const s = Math.max(0, lt) * 2.6;
  diagram(ctx, t, [{ kmh: 100, x: L100, s: 9, col: CAR100, dim: '83 m' }, { kmh: 120, x: L120, s, col: CAR120, dim: '113 m', dimP: clamp((t - WT('113')) / .5) }], {});
  LANE_TAGS(ctx);
});
// 12 · thirty metres more: seven cars in a row fill the gap
shot(12, 'zoom', (ctx, lt, t) => {
  const tc = WT('7');
  diagram(ctx, t, [{ kmh: 100, x: L100, s: 9, col: CAR100 }, { kmh: 120, x: L120, s: 9, col: CAR120 }], {
    z: 2.1, cy: Y0 - 98 * PX,
    over: c => {
      const y1 = Y0 - stopDist(100) * PX, y2 = Y0 - stopDist(120) * PX;
      c.save(); c.setLineDash([10, 10]); line(c, 240, y1, 840, y1, 3, C.cyan); c.restore();
      for (let i = 0; i < 7; i++) { const p = clamp((t - tc + .1 - i * .12) / .2); if (p <= 0) continue; c.save(); c.globalAlpha = p; car(c, 540, y1 - (i + .5) * (y1 - y2) / 7, .13, '#ff6b6b'); c.restore(); }
    }
  });
  readout(ctx, '+30 m', '', 540, 1500, 84, (t - WT('30')) / .3, C.red);
});

// 13 · "y aquí viene lo más fuerte"
shot(13, 'flash', (ctx, lt, t) => {
  background(ctx, t, 540, 600, 0, 11);
  bloom(ctx, 540, 600, 700, 'rgba(255,40,60,', .35 + .2 * Math.sin(lt * 10));
  warn(ctx, 540, 600, 2.4, lt / .3);
});

// 14 · where the car at 100 has stopped, the one at 120 is still doing ~70
shot(14, 'zoom', (ctx, lt, t) => {
  const tp = WT('parado'), d83 = stopDist(100);
  let sHit = 0; for (let s = 0; s < 8; s += .01) if (pos(120, s) >= d83) { sHit = s; break; }
  const s = Math.min(sHit, Math.max(0, lt - .2) * 1.3);
  const v = speedAt(120, s), there = s >= sHit - 1e-3;
  diagram(ctx, t, [{ kmh: 100, x: L100, s: 9, col: CAR100 }, { kmh: 120, x: L120, s, col: CAR120 }], {
    z: 1.35, cy: Y0 - d83 * PX + 60,
    over: c => { c.save(); c.setLineDash([12, 10]); line(c, 240, Y0 - d83 * PX, 840, Y0 - d83 * PX, 4, C.cyan); c.restore(); check(c, L100 + 90, Y0 - d83 * PX + 40, 26, (t - tp) / .4); }
  });
  if (there) bloom(ctx, 540, 600, 800, 'rgba(255,40,60,', .25);
  speedo(ctx, 850, 330, 160, v, 180, there ? C.red : C.gold);
});

// 15 · hitting something at 70 is like falling from a sixth floor (about 19 m)
shot(15, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 600, .4, 12);
  const gy = 1040, fh = 125, tf = WT('caer'), p = clamp((t - tf) / .7);
  line(ctx, 60, gy, 1020, gy, 4, '#555b66');
  building(ctx, 380, gy, 330, 6, fh, 6, clamp((t - WT('sexto')) / .4));
  const top = gy - 6 * fh + 20;
  caps(ctx, '6.º piso', 545, top - 70, 30, C.gold);
  dimLine(ctx, 260, gy, 260, top, '19 m', clamp((t - WT('caer')) / .5), C.ink);
  car(ctx, 840, lerp(top - 40, gy - 70, easeIn(p)), .55, CAR120, 0, Math.PI / 2 * p);
  if (p >= 1) { bloom(ctx, 840, gy, 300, 'rgba(255,220,140,', .6 * clamp(1 - (t - tf - .7) / .5)); }
});

// 16 · in the rain: more than 150 m
shot(16, 'zoom', (ctx, lt, t) => {
  const s = Math.max(0, lt - .6) * 2.2, px = 5;
  diagram(ctx, t, [{ kmh: 120, x: L120, s, col: CAR120, dec: DEC_WET, dim: '150+ m', dimP: clamp((t - WT('150')) / .5) }], {
    px, wet: .9, cy: 640,
    over: c => { const yd = Y0 - stopDist(120) * px; c.save(); c.setLineDash([10, 10]); line(c, 240, yd, 840, yd, 3, C.dim); c.restore(); caps(c, 'en seco: 113 m', 400, yd + 30, 22, C.dim); }
  });
  rain(ctx, t, 1);
});

// 17 · fuel: the air pushes back harder and harder
shot(17, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 600, .4, 13);
  const ka = clamp((t - WT('aire')) / .5), k = .4 + .6 * ka;
  ctx.save(); cam(ctx, kf(lt, [[0, 1], [7, 1.12]]), 540, 640, t);
  for (let i = 0; i < 9; i++) {
    const x0 = 140 + i * 100, ph = (t * (1.6 + ka) + i * .37) % 1;
    glow(ctx, () => { ctx.beginPath(); for (let y = -100; y < 1100; y += 20) { const dx = x0 - 540, push = Math.exp(-((y - 380) ** 2) / 30000) * Math.sign(dx || 1) * Math.max(0, 260 - Math.abs(dx)) * .9; y === -100 ? ctx.moveTo(x0 + push, y) : ctx.lineTo(x0 + push, y); } }, C.gold, 2.5, .25 * k);
    const yy = -100 + ph * 1200, dx = x0 - 540, push = Math.exp(-((yy - 380) ** 2) / 30000) * Math.sign(dx || 1) * Math.max(0, 260 - Math.abs(dx)) * .9;
    circle(ctx, x0 + push, yy, 6); ctx.fillStyle = C.goldHot; ctx.fill();
  }
  car(ctx, 540, 640, 2, CAR120);
  ctx.restore();
  pump(ctx, 880, 1520, .9);
  readout(ctx, '+20 %', 'gasolina', 420, 1520, 84, (t - WT('20', 0, 17)) / .3, C.amber);
});

// 18 · the bill: more fuel, more risk, more metres
shot(18, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 600, .4, 14);
  [['+20 %', 'gasolina', WT('gasolina', 0, 18), C.amber], ['+44 %', 'riesgo al frenar', WT('riesgo'), C.red], ['+30 m', 'de frenada', WT('frenada', 0, 18), C.gold]]
    .forEach(([a, b, tw, col], i) => readout(ctx, a, b, 540, 300 + i * 260, 86, (t - tw + .1) / .25, col));
});

// 19 · all that, for five minutes
shot(19, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 600, .5, 15);
  speedo(ctx, 540, 620, 330, 120 + Math.sin(t * 8) * 1.5, 180, C.red);
  readout(ctx, '5 min', '', 540, 1520, 100, (t - WT('5', 0, 19)) / .25, C.gold);
});

// 20 · send it to that friend
shot(20, 'fade', (ctx, lt, t) => {
  background(ctx, t, 540, 600, .4, 16);
  shareScene(ctx, lt, WT('amigo') - LINE(20), WT('rapido') - LINE(20) + .2, (c, w, h) => {
    c.fillStyle = '#121418'; c.fillRect(0, 0, w, h); speedo(c, w / 2, h * .6, 150, 120, 180, C.red);
    c.font = '600 22px Inter'; c.fillStyle = '#d8dbe0'; c.textAlign = 'center'; c.fillText('¿Cuánto ganas yendo a 120 en vez de a 100?', w / 2, 120);
  });
}, { capY: 330 });

// zoom punches on key words so no stretch sits still (render.js audit checks it)
const P = (i, times, pc) => { SHOTS[i].punch = times; if (pc) SHOTS[i].pc = pc; };
P(1, [WT('minutos', 0, 1)], [540, 560]);
P(2, [WT('tardas'), WT('120', 0, 2)], [540, 600]);
P(3, [WT('trafico'), WT('semaforos'), WT('menos', 0, 3)]);
P(4, [WT('calcula'), WT('frenar')], [540, 520]);
P(6, [WT('cerebro'), WT('reaccionar')], [540, 500]);
P(7, [WT('100', 0, 7), WT('33'), WT('frenar', 0, 7)]);
P(8, [WT('velocidad', 0, 8), WT('cuadrado')]);
P(9, [WT('rapido', 0, 9), WT('44'), WT('frenar', 0, 9)]);
P(10, [WT('seco'), WT('83')], [L100, 500]);
P(11, [WT('113')], [L120, 400]);
P(12, [WT('7')]);
P(14, [WT('parado'), WT('70')]);
P(15, [WT('sexto')]);
P(16, [WT('lloviendo'), WT('150')]);
P(17, [WT('gasolina', 0, 17), WT('aire'), WT('fuerte')], [540, 640]);
P(18, [WT('gasolina', 0, 18), WT('riesgo'), WT('frenada', 0, 18)], [540, 560]);
P(19, [WT('minutos', 0, 19)]);
P(0, [WT('120'), WT('100')], [540, 560]);
P(1, [WT('viaje'), WT('kilometros'), WT('minutos', 0, 1)], [540, 560]);
P(8, [WT('frenada', 0, 8), WT('velocidad', 0, 8), WT('cuadrado')]);
P(9, [WT('vas', 0, 9), WT('20'), WT('44'), WT('distancia')]);
P(17, [WT('ademas'), WT('gasolina', 0, 17), WT('aire'), WT('fuerte')], [540, 640]);
P(18, [WT('sea'), WT('gasolina', 0, 18), WT('riesgo'), WT('frenada', 0, 18)], [540, 560]);
P(17, [WT('ademas'), WT('120', 0, 17), WT('coche', 0, 17), WT('gasolina', 0, 17), WT('aire'), WT('fuerte')], [540, 1350]);
