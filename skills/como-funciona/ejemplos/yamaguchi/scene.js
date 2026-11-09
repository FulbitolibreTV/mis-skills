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
// ---------- props: 1940s Japanese town, flash and mushroom cloud, train, office desk ----------
// a row of low wooden buildings with tiled roofs on the horizon line y
function town(ctx, y, s = 1, seed = 2, col = '#2b2a30') {
  const R = rng(seed); let x = -40;
  while (x < W + 40) {
    const w = (90 + R() * 120) * s, h = (60 + R() * 110) * s;
    ctx.fillStyle = col; ctx.fillRect(x, y - h, w, h + 40);
    ctx.beginPath(); ctx.moveTo(x - 14 * s, y - h); ctx.quadraticCurveTo(x + w / 2, y - h - 40 * s, x + w + 14 * s, y - h); ctx.lineTo(x + w + 14 * s, y - h + 10 * s); ctx.lineTo(x - 14 * s, y - h + 10 * s); ctx.closePath(); ctx.fillStyle = shade(col, -.3); ctx.fill();
    for (let i = 0; i < 3; i++) { ctx.fillStyle = 'rgba(255,214,140,.35)'; ctx.fillRect(x + 12 * s + i * w / 3, y - h * .55, 14 * s, 18 * s); }
    x += w + 8;
  }
}
// a blinding flash (k 0..1) and a rising mushroom cloud (p 0..1) above (x, y)
function blast(ctx, x, y, s, k, p, t) {
  if (k > 0) { ctx.fillStyle = `rgba(255,248,230,${k})`; ctx.fillRect(0, 0, W, H); }
  if (p <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const top = -700 * easeOut(p), R = rng(5);
  ctx.beginPath(); ctx.moveTo(-60, 0); ctx.quadraticCurveTo(-40, top * .5, -90, top + 120); ctx.lineTo(90, top + 120); ctx.quadraticCurveTo(40, top * .5, 60, 0); ctx.closePath();
  ctx.fillStyle = lin(ctx, 0, 0, 0, top, [[0, '#7a5a48'], [1, '#c8a58a']]); ctx.fill();
  for (let i = 0; i < 26; i++) { const a = R() * Math.PI, r = (120 + R() * 140) * easeOut(p), px = Math.cos(a) * 260 * easeOut(p), py = top - Math.sin(a) * 90 + Math.sin(t * 2 + i) * 6; const g = 190 + R() * 30 | 0; circle(ctx, px, py, r * .7); ctx.fillStyle = `rgb(${g},${g - 45},${g - 85})`; ctx.fill(); }
  bloom(ctx, 0, top + 40, 380, 'rgba(255,160,80,', .5 * (1 - p * .5));
  ellipse(ctx, 0, 0, 380 * easeOut(p), 50 * easeOut(p)); ctx.fillStyle = 'rgba(200,170,140,.6)'; ctx.fill();
  ctx.restore();
}
// a steam-era train seen from the side, moving (x = front)
function train(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  for (let c = 0; c < 3; c++) { const cx = -c * 420; rrect(ctx, cx - 400, -170, 380, 150, 14); ctx.fillStyle = c ? '#3d4a3a' : '#22262c'; ctx.fill(); for (let i = 0; i < 5; i++) { rrect(ctx, cx - 380 + i * 72, -145, 50, 50, 6); ctx.fillStyle = 'rgba(255,220,150,.6)'; ctx.fill(); } [-340, -80].forEach(wx => { circle(ctx, cx + wx, -10, 34); ctx.fillStyle = '#111'; ctx.fill(); }); }
  rrect(ctx, -40, -240, 70, 80, 8); ctx.fillStyle = '#22262c'; ctx.fill();
  for (let i = 0; i < 6; i++) { const ph = (t * .8 + i / 6) % 1; circle(ctx, -10 - ph * 300, -260 - ph * 160, 30 + ph * 60); ctx.fillStyle = `rgba(220,220,225,${.5 * (1 - ph)})`; ctx.fill(); }
  ctx.restore();
}
function desk(ctx, x, y, s) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = '#6e4a2c'; rrect(ctx, -300, -20, 600, 40, 8); ctx.fill(); rrect(ctx, -280, 20, 40, 200, 6); ctx.fill(); rrect(ctx, 240, 20, 40, 200, 6); ctx.fill(); rrect(ctx, -120, -50, 160, 30, 4); ctx.fillStyle = '#efe6d2'; ctx.fill(); ctx.restore(); }
// Yamaguchi: a young engineer in a dark suit; hurt = bandages
function engineer(ctx, x, y, s, o = {}) {
  figure(ctx, x, y, s, { robe: '#2b3140', sash: null, hair: '#141414', skin: '#e9c39f', arms: o.arms, eyes: o.eyes, look: o.look, silhouette: o.silhouette });
  if (o.hurt && !o.silhouette) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = '#f4f1ea'; rrect(ctx, -66, -470, 132, 22, 10); ctx.fill(); rrect(ctx, 30, -330, 60, 26, 8); ctx.fill(); ctx.restore(); }
}
