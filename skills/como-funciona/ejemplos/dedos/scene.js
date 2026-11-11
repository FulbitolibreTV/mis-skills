// ---------- props: «¿Por qué se te arrugan los dedos en el agua?» ----------
// fingertip seen from the pad side, pointing up. tip at (x, yTip), s = scale, wr 0..1 = how wrinkled, o.nerve = gold nerve inside
function fingerUp(ctx, x, yTip, s, t, wr = 0, o = {}) {
  const w = 380 * (1 - .05 * wr), len = 1500;
  ctx.save(); ctx.translate(x, yTip); ctx.scale(s, s);
  const body = () => { ctx.beginPath(); ctx.moveTo(-w / 2, len); ctx.lineTo(-w / 2, w / 2); ctx.arc(0, w / 2, w / 2, Math.PI, 0); ctx.lineTo(w / 2, len); ctx.closePath(); };
  // soft shadow
  ctx.save(); ctx.translate(26, 30); body(); ctx.fillStyle = 'rgba(40,15,10,.28)'; ctx.fill(); ctx.restore();
  body(); ctx.fillStyle = lin(ctx, -w / 2, 0, w / 2, 0, [[0, C.skin2], [.25, C.skin1], [.55, C.skin0], [1, C.skin2]]); ctx.fill();
  ctx.save(); body(); ctx.clip();
  // the pad: a warmer oval near the tip
  ctx.fillStyle = rad(ctx, -20, w * .55, 0, w * .75, [[0, 'rgba(245,160,140,.45)'], [1, 'rgba(245,160,140,0)']]); ctx.fillRect(-w, -40, 2 * w, w * 1.6);
  // fingerprint whorls (fade as wrinkles take over)
  ctx.strokeStyle = `rgba(150,80,65,${.22 * (1 - wr * .6)})`; ctx.lineWidth = 3;
  for (let r = 24; r < 260; r += 22) { ctx.beginPath(); ctx.ellipse(-10, w * .6, r * .8, r, 0, Math.PI * 1.05, Math.PI * 2.95); ctx.stroke(); }
  // first joint crease
  ctx.strokeStyle = 'rgba(120,55,45,.45)'; ctx.lineWidth = 5;
  [w * 1.55, w * 1.62].forEach(yy => { ctx.beginPath(); ctx.moveTo(-w / 2, yy); ctx.quadraticCurveTo(0, yy + 22, w / 2, yy); ctx.stroke(); });
  // pale, slightly bluish when soaked
  if (wr > 0) { ctx.fillStyle = `rgba(225,215,235,${.22 * wr})`; ctx.fillRect(-w, -40, 2 * w, len); }
  // wrinkles: lengthwise ridges that branch, like drainage channels
  if (wr > 0) {
    const R = rng(7);
    for (let i = 0; i < 9; i++) {
      const bx = -w * .42 + i * w * .105, ph = R() * 6, l0 = 30 + R() * 60, l1 = w * (1.05 + R() * .25);
      const path = (dx) => { ctx.beginPath(); for (let yy = l0; yy <= l1; yy += 12) { const k = Math.sin(yy / w * Math.PI); const xx = bx * (.82 + .18 * k) + Math.sin(yy / 38 + ph) * 9 * wr + dx; yy === l0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); } };
      ctx.globalAlpha = clamp(wr * 1.3 - i * .03);
      path(4); ctx.strokeStyle = 'rgba(255,235,225,.55)'; ctx.lineWidth = 7 * wr; ctx.stroke();
      path(-3); ctx.strokeStyle = 'rgba(115,50,45,.6)'; ctx.lineWidth = 9 * wr; ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  // nerve inside: a gold line up the middle with pulses travelling to the tip
  if (o.nerve) {
    const cut = o.cut || 0, yCut = w * 1.25;
    glow(ctx, () => { ctx.beginPath(); ctx.moveTo(0, len); for (let yy = len; yy > w * .4; yy -= 20) ctx.lineTo(Math.sin(yy / 70) * 18, yy); }, cut > .5 ? C.faint : C.gold, 6, o.nerve);
    for (let i = 0; i < 5; i++) {
      const yy = len - ((t * 520 + i * 260) % (len - w * .4));
      if (cut > .5 && yy < yCut) continue;
      bloom(ctx, Math.sin(yy / 70) * 18, yy, 60, 'rgba(255,200,90,', .8 * o.nerve);
    }
    if (cut > 0) { const k = easeOut(clamp(cut)); bloom(ctx, 0, yCut, 140, 'rgba(255,79,99,', .7 * k); line(ctx, -50 * k, yCut - 50 * k, 50 * k, yCut + 50 * k, 14, C.red); line(ctx, 50 * k, yCut - 50 * k, -50 * k, yCut + 50 * k, 14, C.red); }
  }
  ctx.restore();
  ctx.restore();
}
// water: a translucent body below the surface y, with ripples and bubbles
function water(ctx, t, y, k = 1) {
  if (k <= 0) return;
  ctx.save(); ctx.globalAlpha = k;
  ctx.beginPath(); ctx.moveTo(-20, H + 20); ctx.lineTo(-20, y);
  for (let x = -20; x <= W + 20; x += 20) ctx.lineTo(x, y + Math.sin(x / 70 + t * 3) * 8 + Math.sin(x / 31 - t * 2) * 4);
  ctx.lineTo(W + 20, H + 20); ctx.closePath();
  ctx.fillStyle = lin(ctx, 0, y, 0, H, [[0, 'rgba(120,200,255,.32)'], [1, 'rgba(30,90,170,.5)']]); ctx.fill();
  ctx.beginPath(); for (let x = -20; x <= W + 20; x += 20) { const yy = y + Math.sin(x / 70 + t * 3) * 8 + Math.sin(x / 31 - t * 2) * 4; x === -20 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); }
  ctx.strokeStyle = 'rgba(230,248,255,.75)'; ctx.lineWidth = 5; ctx.stroke();
  const R = rng(11);
  for (let i = 0; i < 22; i++) { const bx = R() * W, sp = 60 + R() * 90, ph = R() * 10, by = H - ((t * sp + ph * 200) % (H - y)); if (by < y + 12) continue; circle(ctx, bx + Math.sin(t * 2 + i) * 8, by, 5 + R() * 9); ctx.strokeStyle = 'rgba(235,250,255,.6)'; ctx.lineWidth = 2.5; ctx.stroke(); }
  ctx.restore();
}
// a patch of smooth forearm skin (for "the arms don't")
function armPatch(ctx, x, y, w, h, t) {
  ctx.save(); rrect(ctx, x, y, w, h, 120); ctx.fillStyle = lin(ctx, x, 0, x + w, 0, [[0, C.skin2], [.45, C.skin0], [1, C.skin1]]); ctx.fill();
  ctx.clip(); const R = rng(5); ctx.strokeStyle = 'rgba(110,70,55,.35)'; ctx.lineWidth = 2;
  for (let i = 0; i < 40; i++) { const px = x + R() * w, py = y + R() * h; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + 10, py + 14); ctx.stroke(); }
  ctx.restore();
}
// fingertip cross-section: skin on top, soft tissue with blood vessels and a nerve.
// vr 0..1 = vessel size (1 open, ~.35 closed), fold 0..1 = skin folds as volume drops, soak 0..1 = blue water arrows going in
function section(ctx, t, o = {}) {
  const vr = o.vr == null ? 1 : o.vr, fold = o.fold || 0, top = 640 + fold * 70;
  const surf = x => top + Math.sin(x / 70) * 70 * fold * (.6 + .4 * Math.sin(x / 23)) ;
  // tissue
  ctx.save();
  ctx.beginPath(); ctx.moveTo(-20, H + 20); for (let x = -20; x <= W + 20; x += 10) ctx.lineTo(x, surf(x)); ctx.lineTo(W + 20, H + 20); ctx.closePath();
  ctx.fillStyle = lin(ctx, 0, top, 0, H, [[0, '#f2c1a8'], [.08, '#e7a98e'], [.4, '#d98f7a'], [1, '#a95c52']]); ctx.fill();
  ctx.save(); ctx.clip();
  // epidermis line, follows the surface
  ctx.beginPath(); for (let x = -20; x <= W + 20; x += 10) { const yy = surf(x) + 60; x === -20 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); }
  ctx.strokeStyle = 'rgba(130,60,50,.35)'; ctx.lineWidth = 5; ctx.stroke();
  const R = rng(4); ctx.fillStyle = 'rgba(255,235,225,.12)'; for (let i = 0; i < 140; i++) { circle(ctx, R() * W, top + 80 + R() * 1100, 3 + R() * 7); ctx.fill(); }
  // blood vessels: three red tubes across, radius follows vr
  [980, 1180, 1390].forEach((yy, i) => {
    const r = (34 - i * 4) * vr;
    ctx.beginPath(); for (let x = -20; x <= W + 20; x += 15) { const y2 = yy + Math.sin(x / 120 + i) * 30; x === -20 ? ctx.moveTo(x, y2) : ctx.lineTo(x, y2); }
    ctx.lineCap = 'round'; ctx.lineWidth = r * 2 + 10; ctx.strokeStyle = '#8f2f3a'; ctx.stroke(); ctx.lineWidth = r * 2; ctx.strokeStyle = '#d9414f'; ctx.stroke();
    // blood cells flowing (fewer when narrow)
    for (let j = 0; j < 9; j++) { const x = ((t * (200 + i * 40) + j * 140) % 1200) - 60, y2 = yy + Math.sin(x / 120 + i) * 30; if (vr < .5 && j % 3) continue; ellipse(ctx, x, y2, 12 * Math.max(vr, .4), 8 * Math.max(vr, .4)); ctx.fillStyle = '#ff8a95'; ctx.fill(); }
  });
  // nerve fiber (gold) running up into the tissue, pulses if o.signal
  if (o.nerve) glow(ctx, () => { ctx.beginPath(); ctx.moveTo(120, H); ctx.bezierCurveTo(200, 1500, 80, 1250, 260, 1100); ctx.bezierCurveTo(420, 980, 640, 1020, 760, 900); }, C.gold, 5, o.nerve);
  if (o.signal > 0) for (let i = 0; i < 4; i++) {
    const u = ((t * .8 + i * .25) % 1); const bx = (a, b, c, d, u) => (1 - u) ** 3 * a + 3 * (1 - u) ** 2 * u * b + 3 * (1 - u) * u * u * c + u ** 3 * d;
    const px = u < .5 ? bx(120, 200, 80, 260, u * 2) : bx(260, 420, 640, 760, u * 2 - 1), py = u < .5 ? bx(H, 1500, 1250, 1100, u * 2) : bx(1100, 980, 1020, 900, u * 2 - 1);
    bloom(ctx, px, py, 70, 'rgba(255,210,100,', .9 * o.signal);
  }
  ctx.restore();
  // water above, arrows going in (the myth)
  if (o.soak > 0) {
    ctx.fillStyle = `rgba(90,170,255,${.25 * o.soak})`; ctx.fillRect(0, 0, W, top);
    for (let i = 0; i < 6; i++) { const x = 140 + i * 160, ph = (t * 1.2 + i * .37) % 1, y0 = top - 260 + ph * 300; ctx.globalAlpha = o.soak * (1 - ph); line(ctx, x, y0, x, y0 + 80, 10, '#7cc4ff'); ctx.beginPath(); ctx.moveTo(x - 22, y0 + 70); ctx.lineTo(x, y0 + 105); ctx.lineTo(x + 22, y0 + 70); ctx.fillStyle = '#7cc4ff'; ctx.fill(); ctx.globalAlpha = 1; }
  }
  ctx.restore();
  return top;
}
// brain from the side (same look as the «pie» reel); glowK lights it up
function brain(ctx, x, y, s, t, glowK = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const lobes = [[-60, -30, 80], [10, -55, 85], [75, -15, 70], [-15, 30, 80], [60, 40, 60]];
  ctx.beginPath(); lobes.forEach(([lx, ly, r]) => { ctx.moveTo(lx + r, ly); ctx.arc(lx, ly, r, 0, TAU); });
  ctx.fillStyle = lin(ctx, 0, -140, 0, 120, [[0, '#f2a9b4'], [1, '#c26a7b']]); ctx.fill();
  ctx.strokeStyle = 'rgba(120,40,60,.45)'; ctx.lineWidth = 6;
  for (let i = 0; i < 7; i++) { ctx.beginPath(); for (let j = 0; j <= 12; j++) { const px = -110 + j * 18, py = -90 + i * 26 + Math.sin(j * 1.3 + i) * 10; j ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); }
  rrect(ctx, 20, 90, 40, 110, 18); ctx.fillStyle = '#c26a7b'; ctx.fill();
  if (glowK > 0) for (let i = 0; i < 6; i++) { const a = t * 3 + i; bloom(ctx, Math.cos(a * 1.3) * 80, Math.sin(a) * 60 - 10, 70, 'rgba(255,200,90,', .5 * glowK); }
  ctx.restore();
}
// a tyre tread seen from above with grooves; water drops are pushed out along the grooves (flow 0..1)
function tread(ctx, x, y, w, h, t, flow = 0) {
  ctx.save(); rrect(ctx, x, y, w, h, 40); ctx.fillStyle = lin(ctx, x, 0, x + w, 0, [[0, '#1d2026'], [.5, '#353a43'], [1, '#1d2026']]); ctx.fill(); ctx.clip();
  const gw = 26;
  for (let i = 0; i < 7; i++) { const yy = y + 40 + i * (h - 80) / 6; ctx.beginPath(); ctx.moveTo(x, yy - 60); ctx.lineTo(x + w / 2, yy); ctx.lineTo(x + w, yy - 60); ctx.lineWidth = gw; ctx.strokeStyle = '#0c0d10'; ctx.stroke(); }
  [x + w * .2, x + w * .8].forEach(gx => { line(ctx, gx, y, gx, y + h, gw, '#0c0d10'); });
  if (flow > 0) for (let i = 0; i < 7; i++) {
    const yy = y + 40 + i * (h - 80) / 6;
    for (let s = -1; s <= 1; s += 2) { const u = (t * 1.3 + i * .21) % 1, px = x + w / 2 + s * u * w / 2, py = yy - u * 60; circle(ctx, px, py, 12); ctx.fillStyle = `rgba(120,200,255,${flow * (1 - u * .6)})`; ctx.fill(); bloom(ctx, px, py, 30, 'rgba(120,200,255,', .4 * flow); }
  }
  ctx.restore();
  ctx.save(); rrect(ctx, x, y, w, h, 40); ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
}
// a glass bowl of water with marbles; n = how many marbles still in it
function bowl(ctx, x, y, r, t, n, seed = 1) {
  ctx.save();
  ctx.beginPath(); ctx.ellipse(x, y, r, r * .28, 0, 0, Math.PI); ctx.lineTo(x - r, y); ctx.ellipse(x, y, r, r * .9, 0, Math.PI, 0, true); ctx.closePath();
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI); ctx.closePath(); ctx.fillStyle = 'rgba(120,200,255,.28)'; ctx.fill();
  ctx.strokeStyle = 'rgba(220,240,255,.7)'; ctx.lineWidth = 5; ctx.stroke();
  ellipse(ctx, x, y, r, r * .22); ctx.strokeStyle = 'rgba(220,240,255,.55)'; ctx.lineWidth = 4; ctx.stroke();
  const cols = ['#ff4f63', '#5b8cff', '#33d17a', '#f5c451', '#b06bff', '#ff9f2e'];
  for (let i = 0; i < n; i++) marble(ctx, x - r * .55 + (i % 4) * r * .36, y + r * .45 - Math.floor(i / 4) * 46, 24, cols[(i + seed) % cols.length]);
  ctx.restore();
}
function marble(ctx, x, y, r, col) {
  circle(ctx, x, y, r); ctx.fillStyle = rad(ctx, x - r * .4, y - r * .4, 0, r * 1.3, [[0, '#ffffff'], [.25, col], [1, shade(col, -.45)]]); ctx.fill();
}
// a simple stopwatch
function stopwatch(ctx, x, y, r, t, run = 1) {
  ctx.save(); circle(ctx, x, y, r); ctx.fillStyle = '#1b1d22'; ctx.fill(); ctx.strokeStyle = '#d9dde3'; ctx.lineWidth = 8; ctx.stroke();
  rrect(ctx, x - 18, y - r - 34, 36, 30, 6); ctx.fillStyle = '#d9dde3'; ctx.fill();
  const a = -Math.PI / 2 + t * run * 2.4; line(ctx, x, y, x + Math.cos(a) * r * .78, y + Math.sin(a) * r * .78, 7, C.red); circle(ctx, x, y, 9); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.restore();
}
