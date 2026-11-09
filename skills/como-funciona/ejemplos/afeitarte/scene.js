// ---------- props: skin cross-section with a hair follicle, razor, pencil, chin with stubble ----------
const SKIN_Y = 600;   // skin surface in the cross-section
// skin seen in cross-section: surface at SKIN_Y, layers below
function skin(ctx, t) {
  ctx.fillStyle = lin(ctx, 0, SKIN_Y, 0, SKIN_Y + 520, [[0, '#f2c1a8'], [.12, '#e7a98e'], [.4, '#d98f7a'], [1, '#b8655a']]); ctx.fillRect(-200, SKIN_Y, W + 400, 700);
  ctx.strokeStyle = 'rgba(120,50,40,.25)'; ctx.lineWidth = 4;
  [70, 220].forEach(d => { ctx.beginPath(); for (let x = -200; x <= W + 200; x += 20) { const y = SKIN_Y + d + Math.sin(x / 60 + d) * 10; x === -200 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); });
  const R = rng(4); ctx.fillStyle = 'rgba(255,240,230,.12)'; for (let i = 0; i < 120; i++) { circle(ctx, R() * W, SKIN_Y + 20 + R() * 480, 3 + R() * 6); ctx.fill(); }
}
// one hair growing from a follicle at x. len = length above the skin; blunt 0..1 = tapered tip -> flat cut tip
function hair(ctx, x, len, blunt = 0, w = 22, rootGlow = 0, col = '#2b1d17') {
  // follicle and root bulb
  ctx.save();
  ctx.beginPath(); ctx.ellipse(x, SKIN_Y + 170, 40, 200, 0, 0, TAU); ctx.fillStyle = 'rgba(150,70,60,.35)'; ctx.fill();
  circle(ctx, x, SKIN_Y + 330, 46); ctx.fillStyle = '#8a4a3c'; ctx.fill();
  if (rootGlow > 0) bloom(ctx, x, SKIN_Y + 330, 160, 'rgba(255,200,90,', .8 * rootGlow);
  // shaft from the root up to the tip
  const top = SKIN_Y - len, tipLen = lerp(70, 0, blunt);
  ctx.beginPath();
  ctx.moveTo(x - w / 2, SKIN_Y + 320); ctx.lineTo(x - w / 2, top + tipLen);
  if (tipLen > 1) ctx.quadraticCurveTo(x - w / 4, top + tipLen * .3, x, top); else ctx.lineTo(x - w / 2, top);
  if (tipLen > 1) ctx.quadraticCurveTo(x + w / 4, top + tipLen * .3, x + w / 2, top + tipLen); else ctx.lineTo(x + w / 2, top);
  ctx.lineTo(x + w / 2, SKIN_Y + 320); ctx.closePath();
  ctx.fillStyle = lin(ctx, x - w / 2, 0, x + w / 2, 0, [[0, col], [.4, '#5a4033'], [1, col]]); ctx.fill();
  ctx.restore();
}
// a safety razor seen from the side, blade edge at (x, y)
function razor(ctx, x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rrect(ctx, -10, -330, 40, 300, 18); ctx.fillStyle = lin(ctx, -10, 0, 30, 0, [[0, '#4a505b'], [1, '#2a2e36']]); ctx.fill();
  rrect(ctx, -110, -40, 240, 40, 12); ctx.fillStyle = '#d9dde3'; ctx.fill();
  rrect(ctx, -120, -6, 260, 10, 3); ctx.fillStyle = '#f4f6f8'; ctx.fill(); glow(ctx, () => { ctx.beginPath(); ctx.moveTo(-120, 4); ctx.lineTo(140, 4); }, C.cyan, 2, .6);
  ctx.restore();
}
// a pencil lying horizontally, tip on the right; sharp 0..1
function pencil(ctx, x, y, s, sharp = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rrect(ctx, -300, -30, 420, 60, 8); ctx.fillStyle = '#f2b632'; ctx.fill();
  rrect(ctx, -330, -30, 40, 60, 8); ctx.fillStyle = '#e88a9a'; ctx.fill();
  const tl = lerp(0, 110, sharp);
  ctx.beginPath(); ctx.moveTo(120, -30); ctx.lineTo(120 + tl, sharp > .1 ? 0 : -30); ctx.lineTo(120 + tl, sharp > .1 ? 0 : 30); ctx.lineTo(120, 30); ctx.closePath(); ctx.fillStyle = '#f1d7b0'; ctx.fill();
  if (sharp > .1) { ctx.beginPath(); ctx.moveTo(120 + tl * .7, -9); ctx.lineTo(120 + tl, 0); ctx.lineTo(120 + tl * .7, 9); ctx.closePath(); ctx.fillStyle = '#2a2e36'; ctx.fill(); }
  else { rrect(ctx, 120, -30, 14, 60, 3); ctx.fillStyle = '#2a2e36'; ctx.fill(); }
  ctx.restore();
}
// a chin and upper lip seen from the front with stubble; tuft 0..1 = a thin moustache
function chin(ctx, x, y, s, t, stubble = 1, tuft = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ellipse(ctx, 0, 0, 300, 380); ctx.fillStyle = rad(ctx, -80, -120, 40, 420, [[0, C.skin0], [1, C.skin1]]); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-110, 40); ctx.quadraticCurveTo(0, 80, 110, 40); ctx.quadraticCurveTo(0, 120, -110, 40); ctx.fillStyle = '#b4564f'; ctx.fill();
  const R = rng(3);
  for (let i = 0; i < 260 * stubble; i++) { const a = R() * TAU, r = 120 + R() * 220, px = Math.cos(a) * r * .8, py = 60 + Math.abs(Math.sin(a)) * r * .9; if (py > 330) continue; circle(ctx, px, py, 2.5); ctx.fillStyle = 'rgba(40,25,20,.7)'; ctx.fill(); }
  if (tuft > 0) for (let i = 0; i < 50; i++) { const px = -100 + i * 4, py = 10 + Math.sin(i) * 3; line(ctx, px, py, px + 4, py - 14 * tuft, 3, 'rgba(40,25,20,.75)'); }
  ctx.restore();
}
