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
// ---------- props: airliner, thermometer, crack panel, paint buckets, fuel gauge ----------
// an airliner seen from the side, nose to the right, centre (x, y), ~900 px long at s = 1.
// o: body colour, tail colour, stripe, logo letter, crack 0..1, drip 0..1
function plane(ctx, x, y, s = 1, o = {}) {
  const body = o.body || '#f4f6f8', tail = o.tail || '#d83a3a';
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.tilt || 0); ctx.scale(s, s);
  // far wing
  ctx.beginPath(); ctx.moveTo(-40, -10); ctx.lineTo(-200, -120); ctx.lineTo(-150, -120); ctx.lineTo(60, -10); ctx.closePath(); ctx.fillStyle = shade(body, -.25); ctx.fill();
  // tail fin
  ctx.beginPath(); ctx.moveTo(-330, -40); ctx.lineTo(-430, -240); ctx.lineTo(-360, -240); ctx.lineTo(-250, -50); ctx.closePath(); ctx.fillStyle = tail; ctx.fill();
  if (o.logo) text(ctx, o.logo, -365, -150, 60, '#fff', 700);
  // fuselage
  ctx.beginPath(); ctx.moveTo(-440, -50); ctx.lineTo(330, -60); ctx.quadraticCurveTo(470, -50, 470, 0); ctx.quadraticCurveTo(450, 50, 330, 55); ctx.lineTo(-360, 45); ctx.quadraticCurveTo(-420, 20, -440, -50); ctx.closePath();
  ctx.fillStyle = lin(ctx, 0, -60, 0, 55, [[0, shade(body, .1)], [.55, body], [1, shade(body, -.22)]]); ctx.fill();
  if (o.stripe) { rrect(ctx, -400, 6, 840, 14, 6); ctx.fillStyle = o.stripe; ctx.fill(); }
  for (let i = 0; i < 22; i++) { rrect(ctx, -300 + i * 28, -26, 14, 18, 6); ctx.fillStyle = '#2a3446'; ctx.fill(); }
  ctx.beginPath(); ctx.moveTo(400, -38); ctx.quadraticCurveTo(440, -30, 452, -12); ctx.lineTo(405, -14); ctx.closePath(); ctx.fillStyle = '#2a3446'; ctx.fill();
  // near wing + engine
  ctx.beginPath(); ctx.moveTo(-60, 20); ctx.lineTo(-240, 170); ctx.lineTo(-170, 170); ctx.lineTo(80, 25); ctx.closePath(); ctx.fillStyle = shade(body, -.12); ctx.fill();
  rrect(ctx, -120, 70, 140, 56, 26); ctx.fillStyle = lin(ctx, 0, 70, 0, 126, [[0, '#c9ced5'], [1, '#7a808a']]); ctx.fill();
  if (o.crack) { glow(ctx, () => { ctx.beginPath(); ctx.moveTo(120, -50); ctx.lineTo(140, -20); ctx.lineTo(125, 5); ctx.lineTo(150, 30); }, '#5a1a10', 7, o.crack); }
  if (o.drip) { ctx.fillStyle = '#2a1a10'; rrect(ctx, -60, 120, 10, 60 * o.drip, 5); ctx.fill(); }
  ctx.restore();
}
// a thermometer; level 0..1, col = liquid colour
function thermometer(ctx, x, y, s, level, col = C.red) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rrect(ctx, -30, -300, 60, 300, 30); ctx.fillStyle = '#e9ecf0'; ctx.fill();
  circle(ctx, 0, 20, 55); ctx.fill();
  circle(ctx, 0, 20, 40); ctx.fillStyle = col; ctx.fill();
  rrect(ctx, -14, -280 + 280 * (1 - level), 28, 280 * level + 20, 14); ctx.fill();
  ctx.restore();
}
// a paint bucket
function bucket(ctx, x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-80, -100); ctx.lineTo(80, -100); ctx.lineTo(65, 60); ctx.lineTo(-65, 60); ctx.closePath(); ctx.fillStyle = lin(ctx, -80, 0, 80, 0, [[0, '#9aa0aa'], [.5, '#e3e6ea'], [1, '#8a9099']]); ctx.fill();
  ellipse(ctx, 0, -100, 80, 20); ctx.fillStyle = col; ctx.fill();
  ctx.beginPath(); ctx.moveTo(-60, -60); ctx.quadraticCurveTo(-55, -10, -40, 0); ctx.lineTo(-30, -60); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -110, 90, Math.PI, 0); ctx.strokeStyle = '#6a707a'; ctx.lineWidth = 6; ctx.stroke();
  ctx.restore();
}
// a round fuel gauge; v 0..1
function fuelGauge(ctx, x, y, r, v) {
  circle(ctx, x, y, r); ctx.fillStyle = '#16191e'; ctx.fill(); ctx.strokeStyle = '#3a3e47'; ctx.lineWidth = 10; ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, r * .78, Math.PI * .75, Math.PI * 2.25); ctx.strokeStyle = '#2a2e36'; ctx.lineWidth = r * .12; ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, r * .78, Math.PI * .75, Math.PI * (.75 + 1.5 * v)); ctx.strokeStyle = v < .35 ? C.red : C.amber; ctx.stroke();
  const a = Math.PI * (.75 + 1.5 * v); line(ctx, x, y, x + Math.cos(a) * r * .65, y + Math.sin(a) * r * .65, 10, '#fff'); circle(ctx, x, y, 16); ctx.fillStyle = '#fff'; ctx.fill();
  text(ctx, 'FUEL', x, y + r * .45, r * .16, C.dim, 700);
}
