// ---------- props: price tags, dress on a hanger, demand bars, big hook title ----------
// big hook title in the middle of the first frames (so the thumbnail shows the question). *word* = gold
function hookTitle(ctx, lt, txt, until = 1.8, y = 1050, size = 92) {
  const a = clamp((until - lt) / .3); if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a; ctx.font = `700 ${size}px Inter`;
  const words = txt.split(' '), lines = []; let cur = '';
  words.forEach(w => { const test = (cur ? cur + ' ' : '') + w; if (ctx.measureText(test.replace(/\*/g, '')).width > 900 && cur) { lines.push(cur); cur = w; } else cur = test; });
  lines.push(cur);
  lines.forEach((ln, i) => {
    const yy = y + (i - (lines.length - 1) / 2) * size * 1.15; const full = ln.replace(/\*/g, ''); let x = 540 - ctx.measureText(full).width / 2;
    ln.split(' ').forEach(w => { const gold = w.includes('*'), s = w.replace(/\*/g, '') + ' '; ctx.shadowColor = 'rgba(0,0,0,.85)'; ctx.shadowBlur = 24; text(ctx, s, x, yy, size, gold ? C.gold : '#fff', 700, 'Inter', 'left'); x += ctx.measureText(s).width; });
  });
  ctx.restore();
}
// a hanging price tag. hi = highlight of the first digit 0..1 (gold box around it), col = price colour
function priceTag(ctx, x, y, s, price, o = {}) {
  const p = o.p ?? 1; if (p <= 0) return;
  const sw = Math.sin((o.t || 0) * 1.6) * .05 * (o.swing ?? 1), k = backOut(clamp(p * 1.4));
  ctx.save(); ctx.translate(x, y - 260 * s); ctx.rotate(sw); ctx.scale(s * k, s * k);
  line(ctx, 0, -200, 0, 60, 4, 'rgba(230,220,200,.7)');
  const w = o.w || 560, h = 280;
  ctx.beginPath(); ctx.moveTo(-w / 2 + 70, 60); ctx.lineTo(w / 2, 60); ctx.lineTo(w / 2, 60 + h); ctx.lineTo(-w / 2 + 70, 60 + h); ctx.lineTo(-w / 2, 60 + h / 2); ctx.closePath();
  ctx.fillStyle = lin(ctx, 0, 60, 0, 60 + h, [[0, o.bg || '#fbf3dd'], [1, shade(o.bg || '#fbf3dd', -.12)]]); ctx.fill();
  circle(ctx, -w / 2 + 70, 60 + h / 2, 18); ctx.fillStyle = '#2a2420'; ctx.fill();
  ctx.font = `700 150px Inter`; const tw = ctx.measureText(price).width, x0 = 40 - tw / 2;
  const first = price.match(/\d/), fi = first ? price.indexOf(first[0]) : 0, pre = ctx.measureText(price.slice(0, fi)).width, dw = ctx.measureText(price[fi]).width;
  const hi = o.hi || 0, dim = o.dim || 0;
  text(ctx, price.slice(0, fi), x0, 60 + h / 2 + 6, 150, o.col || '#1d1a17', 700, 'Inter', 'left');
  text(ctx, price[fi], x0 + pre, 60 + h / 2 + 6, 150, hi > .5 ? '#c27a00' : (o.col || '#1d1a17'), 700, 'Inter', 'left');
  ctx.globalAlpha = 1 - .75 * dim; text(ctx, price.slice(fi + 1), x0 + pre + dw, 60 + h / 2 + 6, 150, o.col || '#1d1a17', 700, 'Inter', 'left'); ctx.globalAlpha = 1;
  if (hi > 0) { ctx.globalAlpha = hi; ctx.strokeStyle = C.blue; ctx.lineWidth = 6; ctx.strokeRect(x0 + pre - 10, 60 + h / 2 - 80, dw + 20, 170); circle(ctx, x0 + pre - 10, 60 + h / 2 - 80, 12); circle(ctx, x0 + pre + dw + 10, 60 + h / 2 + 90, 12); ctx.fillStyle = '#fff'; ctx.fill(); ctx.globalAlpha = 1; }
  ctx.restore();
}
// a dress on a hanger
// ---------- props: neon city, palms, game case, console, calendar strip, drive, car ----------
function neonSky(ctx, t, hor = 1300) {
  ctx.fillStyle = lin(ctx, 0, 0, 0, hor, [[0, '#1a0b3a'], [.55, '#8a2a7a'], [.85, '#ff7a59'], [1, '#ffc46b']]); ctx.fillRect(0, 0, W, hor);
  const sy = hor - 120; ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, hor); ctx.clip();
  circle(ctx, 540, sy, 260); ctx.fillStyle = lin(ctx, 0, sy - 260, 0, sy + 260, [[0, '#ffe08a'], [1, '#ff4f8a']]); ctx.fill();
  for (let i = 0; i < 6; i++) { ctx.fillStyle = '#8a2a7a'; ctx.fillRect(260, sy + 30 + i * 34, 560, 6 + i * 3); }
  ctx.restore(); stars(ctx, t, 60, 4, hor * .4);
}
function palm(ctx, x, y, s = 1, t = 0, col = '#120a22') {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = col; ctx.strokeStyle = col;
  ctx.beginPath(); ctx.moveTo(-14, 0); ctx.quadraticCurveTo(10, -260, 40, -520); ctx.lineTo(56, -520); ctx.quadraticCurveTo(30, -260, 14, 0); ctx.closePath(); ctx.fill();
  const sw = Math.sin(t * 1.3) * .05;
  for (let i = 0; i < 7; i++) { const a = -Math.PI + i * Math.PI / 6 + sw; ctx.save(); ctx.translate(48, -520); ctx.rotate(a);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(110, -50, 230, 30); ctx.quadraticCurveTo(110, -10, 0, 12); ctx.closePath(); ctx.fill(); ctx.restore(); }
  ctx.restore();
}
function neonCity(ctx, t, hor = 1300) {
  neonSky(ctx, t, hor); skyline(ctx, t, hor, .75, 7, .3); skyline(ctx, t, hor + 40, 1, 9, .6);
  ctx.fillStyle = lin(ctx, 0, hor, 0, H, [[0, '#2a1240'], [1, '#0c0716']]); ctx.fillRect(0, hor + 40, W, H - hor);
  for (let i = 0; i < 8; i++) { ctx.globalAlpha = .5; ctx.fillStyle = i % 2 ? '#ff4fb0' : '#4fd8ff'; ctx.fillRect(0, hor + 60 + i * 70, W, 3); } ctx.globalAlpha = 1;
}
function gameCase(ctx, x, y, s, label = '6', p = 1, tilt = 0) {
  if (p <= 0) return; const k = backOut(clamp(p));
  ctx.save(); ctx.translate(x, y); ctx.rotate(tilt); ctx.scale(s * k, s * k);
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 40; rrect(ctx, -200, -260, 400, 520, 18); ctx.fillStyle = '#16131f'; ctx.fill(); ctx.shadowBlur = 0;
  rrect(ctx, -180, -240, 360, 480, 10); ctx.fillStyle = lin(ctx, 0, -240, 0, 240, [[0, '#ff4f8a'], [.6, '#ff9a4f'], [1, '#2b1050']]); ctx.fill();
  text(ctx, label, 0, -10, 300, '#fff', 700); text(ctx, 'NUEVO JUEGO', 0, 190, 34, 'rgba(255,255,255,.85)', 700);
  ctx.restore();
}
function consoleBox(ctx, x, y, s, name, col, p = 1, ok = true) {
  if (p <= 0) return; const k = backOut(clamp(p));
  ctx.save(); ctx.translate(x, y); ctx.scale(s * k, s * k);
  ellipse(ctx, 0, 230, 170, 22); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fill();
  rrect(ctx, -110, -220, 220, 440, 40); ctx.fillStyle = lin(ctx, -110, 0, 110, 0, [[0, shade(col, -.25)], [.5, col], [1, shade(col, -.35)]]); ctx.fill();
  rrect(ctx, -30, -200, 60, 400, 20); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fill();
  text(ctx, name, 0, 300, 50, '#fff', 700);
  if (!ok) { line(ctx, -150, -150, 150, 150, 26, C.red); line(ctx, 150, -150, -150, 150, 26, C.red); }
  ctx.restore();
}
function drive(ctx, x, y, w, fill, label) {
  rrect(ctx, x - w / 2, y - 40, w, 80, 40); ctx.fillStyle = '#1e2230'; ctx.fill();
  rrect(ctx, x - w / 2, y - 40, Math.max(80, w * fill), 80, 40); ctx.fillStyle = lin(ctx, x - w / 2, 0, x + w / 2, 0, [[0, C.green], [.7, C.amber], [1, C.red]]); ctx.fill();
  text(ctx, label, x, y + 100, 44, C.ink, 700);
}
function car(ctx, x, y, s, col = '#ff4f8a') {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ellipse(ctx, 0, 6, 330, 24); ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(-320, -20); ctx.lineTo(-300, -80); ctx.lineTo(-120, -100); ctx.lineTo(-40, -170); ctx.lineTo(140, -170); ctx.lineTo(230, -100); ctx.lineTo(320, -80); ctx.lineTo(330, -20); ctx.closePath();
  ctx.fillStyle = lin(ctx, 0, -170, 0, 0, [[0, shade(col, .2)], [1, shade(col, -.35)]]); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-20, -155); ctx.lineTo(130, -155); ctx.lineTo(200, -102); ctx.lineTo(-90, -102); ctx.closePath(); ctx.fillStyle = '#2a1f45'; ctx.fill();
  [-190, 200].forEach(wx => { circle(ctx, wx, -14, 52); ctx.fillStyle = '#0e0b14'; ctx.fill(); circle(ctx, wx, -14, 22); ctx.fillStyle = '#c9c3d6'; ctx.fill(); });
  ctx.restore();
}
function bars(ctx, x, y, vals, labels, p = 1, cols) {
  vals.forEach((v, i) => {
    const bx = x + i * 220, h = 420 * v * easeOut(clamp(p - i * .25));
    if (clamp(p - i * .25) <= 0) return;
    rrect(ctx, bx - 70, y - h, 140, h, 14); ctx.fillStyle = lin(ctx, 0, y - h, 0, y, [[0, (cols && cols[i]) || C.gold], [1, shade((cols && cols[i]) || C.gold, -.4)]]); ctx.fill();
    text(ctx, labels[i], bx, y + 50, 46, C.ink, 700);
  });
}
