// cover (render.js cover -> portada.jpg) and seamless loop back to frame 1
window.COVER = { t: 1.6, title: '¿Por qué el *microondas* no calienta el *plato*?' };

// ---------- the shot list: "¿Por qué el microondas calienta la sopa, pero no el plato?" ----------
// draw(ctx, lt, t): lt = seconds inside the shot, t = seconds of the voice. Time things to words with WT('word').

// 0 · hook: the microwave running, soup steaming, the two temperatures
shot(0, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 1000, .7);
  // frame 1 starts inside on the steaming soup and pulls out fast: something moves before the first word ends
  const z = kf(lt, [[0, 3], [.7, 1.18, easeOut], [3.5, 1.32]]), [cx, cy] = kf(lt, [[0, [423, 1050]], [.7, [560, 1030], easeOut]]);
  ctx.save(); cam(ctx, z, cx, cy, t);
  const sec = Math.max(0, 30 - Math.floor(t * 2.5));
  microwave(ctx, 90, 760, 900, 540, t, { timer: '0:' + String(sec).padStart(2, '0') });
  ctx.restore();
  const p1 = (t - WT('sopa')) / .5, p2 = (t - WT('plato')) / .5;
  label(ctx, 'SOPA · 75 °C', 455, 1000, 300, 600, p1, C.amber);
  label(ctx, 'PLATO · 21 °C', 520, 1190, 760, 1560, p2, C.cyan);
});

// 1 · inside: the panel turns see-through, push in on the magnetron
shot(1, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 760, 1000, .5);
  const z = kf(lt, [[0, 1.14], [.6, 1.14], [2.2, 2.1]]), cx = kf(lt, [[.6, 540], [2.2, 870]]), cy = kf(lt, [[.6, 1030], [2.2, 1080]]);
  ctx.save(); cam(ctx, z, cx, cy, t);
  microwave(ctx, 90, 760, 900, 540, t, { xray: clamp(lt / .6), light: .7 });
  ctx.restore();
  label(ctx, 'MAGNETRÓN', 610, 1060, 540, 1480, (t - WT('magnetron')) / .5, C.gold, 34);
});

// 2 · it throws out waves, a huge counter
shot(2, 'cut', (ctx, lt, t) => {
  background(ctx, t, 300, 1000, .45, 3);
  const k = clamp(lt / .4);
  ctx.save(); cam(ctx, 1, 540, 960, t);
  magnetron(ctx, 130, 1000, 1.3, t, 1);
  for (let i = 0; i < 4; i++) {
    const y = 780 + i * 120, p = clamp((lt - .15 - i * .08) / .7);
    wave(ctx, 230, 1080, y, 34 - i * 3, 160, t * 12 + i, C.gold, 4, k * (1 - i * .15), easeOut(p));
  }
  ctx.restore();
  const t0 = WT('oscilan'), c = clamp((t - t0) / 1.6);
  readout(ctx, fmt(2450000000 * easeOut(c)), 'veces por segundo', 540, 1420, 82, (t - t0) / .3);
});

// 3 · into the soup: zoom straight through the surface into water molecules
shot(3, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 1000, .6, 4);
  const z = kf(lt, [[0, 1], [.5, 1.05], [1.5, 7, easeIn]]), fade = clamp((lt - 1.05) / .45);
  if (fade < 1) {
    ctx.save(); ctx.globalAlpha = 1 - fade; cam(ctx, z, 540, 1010, t, 1 - fade);
    bowl(ctx, 540, 900, 380, t, 1, t);
    ctx.restore();
  }
  if (fade > 0) {
    ctx.save(); ctx.globalAlpha = fade; ctx.fillStyle = rad(ctx, 540, 1000, 0, 1100, [[0, 'rgba(130,60,15,.6)'], [1, 'rgba(20,10,4,0)']]); ctx.fillRect(0, 0, W, H);
    const R = rng(7), sc = lerp(1.6, 1, easeOut(fade));
    for (let i = 0; i < 26; i++) {
      const x = 540 + (R() - .5) * 1100 * sc, y = 1000 + (R() - .5) * 1300 * sc, a = R() * TAU + Math.sin(t * 1.5 + i) * .4;
      molecule(ctx, x + Math.sin(t + i) * 10, y + Math.cos(t * .8 + i) * 10, (.55 + R() * .35) * sc, a);
    }
    ctx.restore();
  }
  label(ctx, 'AGUA', 560, 990, 790, 1470, (t - WT('agua')) / .5, C.cyan, 36);
});

// 4 · one molecule: a negative side and a positive side
shot(4, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 1000, .35, 5);
  const tp = WT('positivo'), tn = WT('negativo'), ang = -.2 + Math.sin(lt * .7) * .12;
  // punch in on each charge as it is named: the frame jumps, so the eye gets something new
  const s = t < tp ? kf(lt, [[0, 3.1], [3, 3.4]]) : t < tn ? kf(t, [[tp, 3.4], [tp + .18, 4.2, easeOut]]) : kf(t, [[tn, 4.2], [tn + .18, 3.6, easeOut]]);
  const mx = t < tp ? 450 : t < tn ? kf(t, [[tp, 450], [tp + .18, 380, easeOut]]) : kf(t, [[tn, 380], [tn + .18, 600, easeOut]]), my = t < tn ? 1000 : kf(t, [[tn, 1000], [tn + .18, 900, easeOut]]);
  const qn = clamp((t - WT('negativo')) / .4), qp = clamp((t - WT('positivo')) / .4);
  molecule(ctx, mx, my, s, ang, Math.max(qn, qp) * .9);
  const hs = [-.91, .91].map(a => [mx + Math.cos(ang + a) * 62 * s, my + Math.sin(ang + a) * 62 * s]);
  if (qp > 0) hs.forEach(([hx, hy]) => { bloom(ctx, hx, hy, 160, 'rgba(255,79,99,', .4 * qp); text(ctx, '+', hx, hy, 80 * qp, '#fff', 700); });
  if (qn > 0) { bloom(ctx, mx, my, 240, 'rgba(94,240,212,', .3 * qn); text(ctx, '−', mx, my, 110 * qn, '#fff', 700); }
  label(ctx, 'POSITIVO', hs[0][0] + 20, hs[0][1] - 60, 800, 600, (t - WT('positivo')) / .5, C.red);
  label(ctx, 'NEGATIVO', mx - 40, my + 120, 300, 1500, (t - WT('negativo')) / .5, C.cyan);
});

// 5-6 · a field of molecules: the wave flips, they turn to follow it, faster and faster, then heat
const FIELD = []; { const R = rng(21); for (let r = 0; r < 8; r++) for (let c = 0; c < 6; c++) FIELD.push({ x: 140 + c * 160 + (r % 2) * 80 + (R() - .5) * 30, y: 560 + r * 130 + (R() - .5) * 30, a0: R() * TAU, lag: .7 + R() * .6, ph: R() * TAU }); }
function fieldScene(ctx, t, heat) {
  const t5 = LINE(5);
  background(ctx, t, 540, 1050, .35 + heat * .8, 6);
  // the field: flips every half period, the period shrinks as heat rises
  const per = lerp(1.6, .25, heat), ph = (t - t5) / per, dir = Math.sin(ph * TAU) >= 0 ? 0 : Math.PI, smooth = Math.cos(ph * TAU);
  for (let i = 0; i < 3; i++) wave(ctx, 0, W, 640 + i * 380, 26, 220, ph * TAU * (smooth >= 0 ? 1 : -1) + i, C.gold, 3, .35 + heat * .3);
  if (heat > 0) bloom(ctx, 540, 1050, 900, 'rgba(255,120,30,', .35 * heat);
  const align = clamp((t - t5 - .4) / 1);
  FIELD.forEach((m, i) => {
    const follow = Math.PI * (.5 - .5 * smooth);   // 0 when the field points right, PI when it points left
    const jit = heat * (Math.sin(t * 31 + m.ph) * .6 + Math.sin(t * 17 + i) * .4);
    const a = lerp(m.a0 + Math.sin(t + m.ph) * .3, follow + (m.lag - 1) * .4, align) + jit;
    const sx = heat * Math.sin(t * 23 + m.ph) * 14, sy = heat * Math.cos(t * 19 + i) * 14;
    molecule(ctx, m.x + sx, m.y + sy, .62, a, 0, heat);
  });
  // a big arrow showing which way the field points right now
  const ax = 540, ay = 1560, k = smooth;
  glow(ctx, () => { ctx.beginPath(); ctx.moveTo(ax - 150 * k, ay); ctx.lineTo(ax + 150 * k, ay); ctx.moveTo(ax + 150 * k, ay); ctx.lineTo(ax + 110 * k, ay - 30); ctx.moveTo(ax + 150 * k, ay); ctx.lineTo(ax + 110 * k, ay + 30); }, C.gold, 5, .9);
  caps(ctx, 'campo', ax, ay + 70, 26, C.dim);
  return dir;
}
shot(5, 'cut', (ctx, lt, t) => { fieldScene(ctx, t, 0); caps(ctx, 'a cámara superlenta', 540, 470, 24, C.dim); });
shot(6, 'cut', (ctx, lt, t) => {
  const heat = easeIn(clamp(lt / 1.6)) * .6 + clamp((t - WT('calor')) / .6) * .4;
  fieldScene(ctx, t, heat);
  // little sparks where molecules bump into each other
  const R = rng(Math.floor(t * 12) + 3);
  for (let i = 0; i < Math.floor(heat * 7); i++) { const m = FIELD[Math.floor(R() * FIELD.length)]; bloom(ctx, m.x + 70, m.y + 20, 60, 'rgba(255,220,140,', .8); }
  readout(ctx, Math.round(lerp(21, 75, heat)) + ' °C', 'temperatura', 540, 1380, 76, lt / .3, heat > .8 ? C.amber : C.ink);
});

// 7-9 · cross-section: soup full of water, a ceramic plate with almost none, waves pass through it, heat leaks down
const Z7 = 1.32;
function section(ctx, t, o, over) {
  background(ctx, t, 540, 1050, .45, 8);
  const cy = 980, r = 330;
  ctx.save(); cam(ctx, o.z || Z7, o.cx || 540, o.cy || 1090, t);
  // plate slab
  const py = 1200, ph = 70;
  ctx.fillStyle = 'rgba(0,0,0,.5)'; ellipse(ctx, 540, py + ph + 20, 470, 30); ctx.fill();
  rrect(ctx, 90, py, 900, ph, 34); ctx.fillStyle = lin(ctx, 0, py, 0, py + ph, [[0, '#f2f4f6'], [1, '#a9aeb6']]); ctx.fill();
  const warm = o.plateHeat || 0;
  if (warm > 0) { ctx.save(); rrect(ctx, 90, py, 900, ph, 34); ctx.clip(); ctx.fillStyle = rad(ctx, 540, py, 0, 120 + 380 * warm, [[0, `rgba(255,120,40,${.85 * warm})`], [1, 'rgba(255,120,40,0)']]); ctx.fillRect(90, py - 200, 900, 400); ctx.restore(); }
  // a few lonely water molecules in the plate
  [[230, py + 35], [700, py + 30]].forEach(([x, y], i) => molecule(ctx, x, y, .22, t * .2 + i));
  // bowl cut in half: wall, soup with molecules
  ctx.beginPath(); ctx.moveTo(540 - r, cy); ctx.bezierCurveTo(540 - r, cy + r * .6, 540 - r * .55, py - 6, 540, py - 6); ctx.bezierCurveTo(540 + r * .55, py - 6, 540 + r, cy + r * .6, 540 + r, cy); ctx.lineTo(540 + r - 26, cy);
  ctx.bezierCurveTo(540 + r - 26, cy + r * .55, 540 + r * .5, py - 32, 540, py - 32); ctx.bezierCurveTo(540 - r * .5, py - 32, 540 - r + 26, cy + r * .55, 540 - r + 26, cy); ctx.closePath();
  ctx.fillStyle = lin(ctx, 0, cy, 0, py, [[0, '#f4f5f7'], [1, '#b8bdc5']]); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.moveTo(540 - r + 26, cy + 30); ctx.bezierCurveTo(540 - r + 26, cy + r * .55, 540 - r * .5, py - 32, 540, py - 32); ctx.bezierCurveTo(540 + r * .5, py - 32, 540 + r - 26, cy + r * .55, 540 + r - 26, cy + 30); ctx.closePath(); ctx.clip();
  ctx.fillStyle = lin(ctx, 0, cy, 0, py, [[0, '#e88a3c'], [1, '#a9461a']]); ctx.fillRect(0, cy, W, 400);
  const R = rng(9);
  for (let i = 0; i < 34; i++) { const x = 540 + (R() - .5) * 2 * (r - 40), y = cy + 40 + R() * 200; molecule(ctx, x, y, .2, R() * TAU + t * (1 + 6 * (o.soupHeat || 0)) * (R() > .5 ? 1 : -1), 0, (o.soupHeat || 0) * .6); }
  if (o.soupHeat) bloom(ctx, 540, cy + 120, 380, 'rgba(255,140,40,', .45 * o.soupHeat);
  ctx.restore();
  over && over(ctx, { cy, py, ph, r }, o.z || Z7);
  ctx.restore();
  return { cy, py, ph, r };
}
shot(7, 'fade', (ctx, lt, t) => {
  // "Pero aquí viene lo curioso": the whole cut, soup full of water
  section(ctx, t, { z: kf(lt, [[0, 1.2], [2, 1.34]]), soupHeat: .3 }, (c, g, z) => label(c, 'SOPA', 420, 1060, 300, 760, lt / .5, C.amber, 30 / z));
});
// ...then dive into the plate: ceramic grains, almost no water
shotAt(WT('plato', 0, 7) - .1, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 1000, .25, 12);
  ctx.save(); cam(ctx, kf(lt, [[0, 1.25], [3, 1.05]]), 540, 1000, t);
  const R = rng(5);
  for (let i = 0; i < 90; i++) {
    const x = R() * 1300 - 110, y = 520 + R() * 1050, r = 50 + R() * 70, sides = 5 + Math.floor(R() * 3), rot = R() * TAU, g = 120 + R() * 70;
    ctx.beginPath(); for (let k = 0; k < sides; k++) { const a = rot + k / sides * TAU, rr = r * (.75 + R() * .3); k ? ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath();
    ctx.fillStyle = `rgb(${g},${g + 4},${g + 10})`; ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 3; ctx.stroke();
  }
  molecule(ctx, 300, 1180, .8, t * .4); molecule(ctx, 800, 820, .7, -t * .3);
  ctx.restore();
  label(ctx, 'CERÁMICA', 540, 1000, 540, 1520, (t - WT('ceramica')) / .5, C.cyan, 34);
  label(ctx, 'AGUA: CASI NADA', 300, 1180, 300, 640, (t - WT('agua', 0, 7)) / .5, C.ink, 30);
});
shot(8, 'cut', (ctx, lt, t) => {
  // waves enter from the left: they die out inside the soup but cross the plate untouched
  const p = easeOut(clamp(lt / .9));
  section(ctx, t, { soupHeat: .3 + .7 * clamp(lt / 1.5) }, (c, g) => {
    wave(c, -200, 1280, g.py + g.ph / 2, 16, 130, t * 10, C.gold, 3, 1, p);
    wave(c, -200, lerp(-200, 560, p), 1080, 22, 130, t * 10 + 1, C.gold, 3, 1, 1);
    wave(c, -200, lerp(-200, 520, p), 1140, 22, 130, t * 10 + 2, C.gold, 3, .7, 1);
  });
  readout(ctx, Math.round(lerp(40, 75, clamp(lt / 1.5))) + ' °C', 'sopa', 300, 640, 56, lt / .3, C.amber);
  readout(ctx, '21 °C', 'plato', 780, 1530, 56, (lt - .4) / .3, C.cyan);
});
shot(9, 'cut', (ctx, lt, t) => {
  const tq = WT('quema'), heat = clamp((t - WT('sopa', 0, 9)) / 1.8);
  const zq = kf(t, [[tq - .4, 1.32], [tq - .1, 2.1, easeOut]]);
  section(ctx, t, { soupHeat: 1, plateHeat: heat, z: zq, cx: kf(t, [[tq - .4, 540], [tq - .1, 820, easeOut]]), cy: kf(t, [[tq - .4, 1090], [tq - .1, 1180, easeOut]]) }, (c, g) => {
    // heat drips down from the bowl into the plate
    for (let i = 0; i < 5; i++) { const x = 380 + i * 80, y = g.py - 50 + ((t * 70 + i * 23) % 80); c.save(); c.globalAlpha = heat; glow(c, () => { c.beginPath(); c.moveTo(x - 14, y - 12); c.lineTo(x, y); c.lineTo(x + 14, y - 12); }, C.amber, 4, .9); c.restore(); }
    // a finger touches the plate rim and pulls back
    const fx = kf(t, [[tq - .6, 1200], [tq - .05, 900], [tq + .25, 900], [tq + .55, 1150]]), fy = kf(t, [[tq - .6, 1500], [tq - .05, 1215], [tq + .25, 1215], [tq + .55, 1420]]);
    if (t > tq - .6 && t < tq + .7) finger(c, fx, fy, Math.PI + .6, .42, 520);
    const ring = clamp((t - tq) / .4); if (ring > 0 && ring < 1) { circle(c, 900, 1215, 30 + 90 * ring); c.strokeStyle = `rgba(255,79,99,${1 - ring})`; c.lineWidth = 6; c.stroke(); }
  });
  readout(ctx, Math.round(lerp(21, 48, heat)) + ' °C', 'plato', 780, 1530, 56, 1, heat > .6 ? C.amber : C.cyan);
});

// 10 · call to action: send it to that friend
shot(10, 'fade', (ctx, lt, t) => {
  background(ctx, t, 540, 1000, .4, 10);
  shareScene(ctx, lt, WT('amigo') - LINE(10), WT('centro') - LINE(10) + .1, (c, w, h) => {
    c.fillStyle = '#121418'; c.fillRect(0, 0, w, h); c.save(); c.translate(w / 2, h * .62); c.scale(.55, .55); bowl(c, 0, 0, 380, t, 1, t); c.restore();
    c.font = '600 22px Inter'; c.fillStyle = '#d8dbe0'; c.textAlign = 'center'; c.fillText('¿Por qué el microondas no calienta el plato?', w / 2, 120);
  });
});
