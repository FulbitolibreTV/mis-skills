// ---------- props for this reel: bull, cape, eye with cones, people, flags ----------
// bull head from the front. charge 0..1 lowers the head; steam puffs from the nose
function bull(ctx, x, y, s, t, charge = 0, look = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(Math.sin(t * 2) * .02);
  ctx.translate(0, charge * 40);
  // horns
  [-1, 1].forEach(k => {
    ctx.beginPath(); ctx.moveTo(k * 110, -120); ctx.bezierCurveTo(k * 230, -150, k * 300, -230, k * 250, -330); ctx.bezierCurveTo(k * 250, -250, k * 190, -190, k * 120, -80); ctx.closePath();
    ctx.fillStyle = lin(ctx, k * 120, -80, k * 250, -330, [[0, '#d8cfb8'], [.7, '#f4efe2'], [1, '#3a332a']]); ctx.fill();
  });
  // ears
  [-1, 1].forEach(k => { ellipse(ctx, k * 190, -60, 80, 34, k * .35); ctx.fillStyle = '#2d221d'; ctx.fill(); ellipse(ctx, k * 195, -58, 52, 18, k * .35); ctx.fillStyle = '#5a3a30'; ctx.fill(); });
  // head
  ctx.beginPath(); ctx.moveTo(-150, -150); ctx.bezierCurveTo(-60, -200, 60, -200, 150, -150); ctx.bezierCurveTo(190, -20, 120, 140, 100, 230); ctx.bezierCurveTo(60, 290, -60, 290, -100, 230); ctx.bezierCurveTo(-120, 140, -190, -20, -150, -150); ctx.closePath();
  ctx.fillStyle = lin(ctx, -150, 0, 150, 0, [[0, '#1b1512'], [.45, '#3b2c24'], [1, '#140f0d']]); ctx.fill();
  // forehead curls
  ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 6; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(-60 + i * 30, -130 + (i % 2) * 14, 16, 0, Math.PI * 1.5); ctx.stroke(); }
  // muzzle
  ellipse(ctx, 0, 215, 115, 70); ctx.fillStyle = lin(ctx, 0, 150, 0, 290, [[0, '#4a3a33'], [1, '#2a201c']]); ctx.fill();
  [-1, 1].forEach(k => { ellipse(ctx, k * 48, 220, 20, 28, k * .3); ctx.fillStyle = '#0c0807'; ctx.fill(); });
  // eyes
  [-1, 1].forEach(k => {
    ellipse(ctx, k * 92, -10, 30, 22, k * -.2); ctx.fillStyle = '#f1e8dc'; ctx.fill();
    circle(ctx, k * 92 + look * 10, -8, 15); ctx.fillStyle = '#120c0a'; ctx.fill(); circle(ctx, k * 92 + look * 10 - 5, -14, 5); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(k * 50, -28 + charge * 8); ctx.lineTo(k * 128, -50 - charge * 6); ctx.lineWidth = 12; ctx.strokeStyle = '#0c0807'; ctx.lineCap = 'round'; ctx.stroke();
  });
  // steam
  for (let i = 0; i < 2; i++) { const ph = (t * 1.4 + i * .5) % 1, k = i ? 1 : -1, sx = k * (50 + ph * 120), sy = 270 + ph * 90, sr = 40 + ph * 90; ctx.save(); ctx.globalAlpha = (1 - ph) * .35 * charge; ctx.fillStyle = rad(ctx, sx, sy, 0, sr, [[0, 'rgba(233,237,242,1)'], [1, 'rgba(233,237,242,0)']]); ctx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2); ctx.restore(); }
  ctx.restore();
}
// the cape (muleta): a cloth on a stick, wave = how much it swings. col can be any colour
function cape(ctx, x, y, s, t, wave = 1, col = '#d4202f') {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const sw = Math.sin(t * 4) * 40 * wave;
  line(ctx, -230, -10, 230, -10, 12, '#6b4a2e');
  ctx.beginPath(); ctx.moveTo(-220, 0);
  for (let i = 0; i <= 20; i++) { const u = i / 20, xx = -220 + u * 440, yy = 330 + Math.sin(u * 9 + t * 5) * 18 * wave + sw * u; ctx.lineTo(xx + sw * .3, yy); }
  ctx.lineTo(220, 0); ctx.closePath();
  ctx.fillStyle = lin(ctx, -220, 0, 220, 0, [[0, shadeC(col, -.35)], [.4, col], [.7, shadeC(col, -.15)], [1, shadeC(col, -.4)]]); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 6; for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-220 + i * 88, 10); ctx.quadraticCurveTo(-220 + i * 88 + sw * .2, 160, -220 + i * 88 + sw * .4, 320); ctx.stroke(); }
  ctx.restore();
}
function shadeC(hex, k) { const n = parseInt(hex.slice(1), 16), f = c => Math.round(clamp(k > 0 ? c + (255 - c) * k : c * (1 + k), 0, 255)); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; }
// the inside of an eye: retina with cone cells. cols = cone colours; crossed = a colour that is missing
function retina(ctx, x, y, r, t, cols, crossed) {
  ctx.save();
  circle(ctx, x, y, r); ctx.fillStyle = rad(ctx, x, y, 0, r, [[0, '#4a1f22'], [1, '#170809']]); ctx.fill(); ctx.clip();
  // vessels
  ctx.strokeStyle = 'rgba(200,60,60,.35)'; ctx.lineWidth = 6; const R = rng(9);
  for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.moveTo(x, y); let px = x, py = y, a = R() * TAU; for (let k = 0; k < 6; k++) { a += (R() - .5); px += Math.cos(a) * r * .2; py += Math.sin(a) * r * .2; ctx.lineTo(px, py); } ctx.stroke(); }
  // cones in rows
  const n = cols.length, gap = r * 1.2 / n;
  cols.forEach((c, i) => {
    const cx = x + (i - (n - 1) / 2) * gap, h = r * .7, bob = Math.sin(t * 3 + i) * 6;
    rrect(ctx, cx - 30, y - h / 2 + bob, 60, h, 30); ctx.fillStyle = c; ctx.fill();
    bloom(ctx, cx, y - h / 2 + bob, 90, c === '#ff3b4e' ? 'rgba(255,59,78,' : c === '#4fd36b' ? 'rgba(79,211,107,' : 'rgba(80,140,255,', .5);
  });
  ctx.restore();
  circle(ctx, x, y, r); ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.lineWidth = 4; ctx.stroke();
  if (crossed != null) { const cx = crossed; line(ctx, cx - 70, y - 70, cx + 70, y + 70, 12, C.red); line(ctx, cx + 70, y - 70, cx - 70, y + 70, 12, C.red); }
}
// a simple person seen from the front, shirt colour col
function person(ctx, x, y, s, col, t = 0, moving = 0) {
  ctx.save(); ctx.translate(x + Math.sin(t * 6) * 20 * moving, y); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ellipse(ctx, 0, 250, 90, 18); ctx.fill();
  const leg = Math.sin(t * 9) * 18 * moving;
  rrect(ctx, -45, 120, 36, 130 + leg, 16); ctx.fillStyle = '#2b2f37'; ctx.fill(); rrect(ctx, 9, 120, 36, 130 - leg, 16); ctx.fill();
  rrect(ctx, -70, -20, 140, 160, 50); ctx.fillStyle = col; ctx.fill();
  circle(ctx, 0, -80, 56); ctx.fillStyle = C.skin0; ctx.fill();
  ctx.beginPath(); ctx.arc(0, -92, 58, Math.PI * 1.05, Math.PI * 1.95); ctx.fillStyle = '#2b1d17'; ctx.fill();
  ctx.restore();
}
// a flag on a pole
function flag(ctx, x, y, s, col, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  line(ctx, 0, 0, 0, 300, 10, '#8a8f99');
  ctx.beginPath(); ctx.moveTo(0, 0); for (let i = 0; i <= 10; i++) { const u = i / 10; ctx.lineTo(u * 200, Math.sin(u * 6 + t * 4) * 12 * u); } for (let i = 10; i >= 0; i--) { const u = i / 10; ctx.lineTo(u * 200, 130 + Math.sin(u * 6 + t * 4) * 12 * u); } ctx.closePath();
  ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = 3; ctx.stroke();
  ctx.restore();
}
// an angry red face (for the punchline)
function angryFace(ctx, x, y, r, t, k = 1) {
  ctx.save(); ctx.translate(x, y + Math.sin(t * 30) * 4 * k);
  circle(ctx, 0, 0, r); ctx.fillStyle = rad(ctx, -r * .3, -r * .3, r * .1, r * 1.1, [[0, lerpCol('#f3c9b1', '#ff6a5a', k)], [1, lerpCol('#c98f78', '#b8202f', k)]]); ctx.fill();
  [-1, 1].forEach(s => { circle(ctx, s * r * .35, -r * .05, r * .1); ctx.fillStyle = '#1b1210'; ctx.fill(); line(ctx, s * r * .55, -r * .35, s * r * .15, -r * .2, r * .07, '#1b1210'); });
  ctx.beginPath(); ctx.arc(0, r * .55, r * .3, Math.PI * 1.15, Math.PI * 1.85); ctx.lineWidth = r * .07; ctx.strokeStyle = '#1b1210'; ctx.stroke();
  if (k > .5) for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + (i - 1) * .5, ph = (t * 1.5 + i * .3) % 1; ctx.save(); ctx.globalAlpha = 1 - ph; ellipse(ctx, Math.cos(a) * r * (1.1 + ph * .5), Math.sin(a) * r * (1.1 + ph * .5), r * .12, r * .08); ctx.fillStyle = '#e9edf2'; ctx.fill(); ctx.restore(); }
  ctx.restore();
}
