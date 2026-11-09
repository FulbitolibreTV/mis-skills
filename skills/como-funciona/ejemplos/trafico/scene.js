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
// ---------- props: side-view car with brake lights, highway, ring road with a real traffic model ----------
function car(ctx, x, y, s, col = '#4f8cff', brake = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ellipse(ctx, 0, 6, 330, 24); ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(-320, -20); ctx.lineTo(-300, -80); ctx.lineTo(-120, -100); ctx.lineTo(-40, -170); ctx.lineTo(140, -170); ctx.lineTo(230, -100); ctx.lineTo(320, -80); ctx.lineTo(330, -20); ctx.closePath();
  ctx.fillStyle = lin(ctx, 0, -170, 0, 0, [[0, shade(col, .2)], [1, shade(col, -.35)]]); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-20, -155); ctx.lineTo(130, -155); ctx.lineTo(200, -102); ctx.lineTo(-90, -102); ctx.closePath(); ctx.fillStyle = '#1d2433'; ctx.fill();
  [-190, 200].forEach(wx => { circle(ctx, wx, -14, 52); ctx.fillStyle = '#0e0b14'; ctx.fill(); circle(ctx, wx, -14, 22); ctx.fillStyle = '#c9c3d6'; ctx.fill(); });
  rrect(ctx, -326, -78, 22, 30, 6); ctx.fillStyle = brake > 0 ? '#ff2a3a' : '#7a1c22'; ctx.fill();
  if (brake > 0) { ctx.globalAlpha = .5 * brake; circle(ctx, -330, -63, 90); ctx.fillStyle = '#ff2a3a'; ctx.fill(); ctx.globalAlpha = 1; }
  ctx.restore();
}
const CAR_COLS = ['#4f8cff', '#ff6b6b', '#f5c451', '#3ecf8e', '#b07cff', '#e9ecf2', '#ff9f2e'];
// a highway seen from the side at dusk; returns the road y
function highway(ctx, t, y = 1500) {
  const h = landscape(ctx, t, 'atardecer', { hor: y - 120, sun: [800, y - 400], ground: 'ninguno' });
  ctx.fillStyle = '#2a2d34'; ctx.fillRect(0, y - 40, W, 180); ctx.fillStyle = '#16181d'; ctx.fillRect(0, y + 140, W, H - y);
  for (let i = 0; i < 12; i++) { ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(((i * 160 - t * 60) % (W + 160) + W + 160) % (W + 160) - 160, y + 60, 80, 8); }
  return y;
}
// ---- ring road: optimal-velocity (Bando) model, 22 cars, simulated once at load ----
const RING = (() => {
  const N = 22, h0 = 2, L = N * h0, a = 1, dt = .05, V = h => Math.tanh(h - 2) + Math.tanh(2);
  let x = [...Array(N)].map((_, i) => i * h0), v = x.map(() => V(h0));
  x[0] += .15;                                    // one driver drifts a tiny bit closer
  const frames = [];
  for (let k = 0; k <= 6000; k++) {
    if (k % 10 === 0) frames.push({ x: x.slice(), v: v.slice() });
    const acc = x.map((xi, i) => { let h = x[(i + 1) % N] - xi; if (h < 0) h += L; return a * (V(h) - v[i]); });
    v = v.map((vi, i) => Math.max(0, vi + acc[i] * dt)); x = x.map((xi, i) => xi + v[i] * dt);
  }
  return { N, L, frames, vmax: V(h0) };
})();
// sim time 0..300; draws the ring at (cx, cy) radius r
function ring(ctx, cx, cy, r, simT, t) {
  const f = RING.frames[Math.max(0, Math.min(RING.frames.length - 1, Math.round(simT * 2)))];
  circle(ctx, cx, cy, r + 70); ctx.fillStyle = '#2a2d34'; ctx.fill();
  circle(ctx, cx, cy, r - 70); ctx.fillStyle = '#2f6b3f'; ctx.fill();
  ctx.setLineDash([30, 30]); circle(ctx, cx, cy, r); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 6; ctx.stroke(); ctx.setLineDash([]);
  f.x.forEach((xi, i) => {
    const a = xi / RING.L * TAU - Math.PI / 2, slow = 1 - f.v[i] / RING.vmax;
    ctx.save(); ctx.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r); ctx.rotate(a + Math.PI / 2);
    rrect(ctx, -26, -44, 52, 88, 14); ctx.fillStyle = CAR_COLS[i % CAR_COLS.length]; ctx.fill();
    rrect(ctx, -20, -18, 40, 30, 8); ctx.fillStyle = 'rgba(20,24,34,.8)'; ctx.fill();
    if (slow > .35) { ctx.fillStyle = '#ff2a3a'; ctx.globalAlpha = Math.min(1, slow * 1.4); rrect(ctx, -24, -52, 16, 10, 4); ctx.fill(); rrect(ctx, 8, -52, 16, 10, 4); ctx.fill(); ctx.globalAlpha = 1; }
    ctx.restore();
  });
}
// where the jam is now (angle of the slowest car), for arrows
function jamAngle(simT) {
  const f = RING.frames[Math.max(0, Math.min(RING.frames.length - 1, Math.round(simT * 2)))];
  let m = 0; f.v.forEach((v, i) => { if (v < f.v[m]) m = i; });
  return f.x[m] / RING.L * TAU - Math.PI / 2;
}
