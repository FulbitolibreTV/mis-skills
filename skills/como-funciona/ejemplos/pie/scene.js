// ---------- props: a brain with two regions, a person, a cringing face, a microphone, a sofa, a scanner ----------
// brain from the side; ins / cin = how lit the insula and cingulate regions are (0..1)
function brain(ctx, x, y, s, t, ins = 0, cin = 0, glowK = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const lobes = [[-60, -30, 80], [10, -55, 85], [75, -15, 70], [-15, 30, 80], [60, 40, 60]];
  ctx.beginPath(); lobes.forEach(([lx, ly, r]) => { ctx.moveTo(lx + r, ly); ctx.arc(lx, ly, r, 0, TAU); });
  ctx.fillStyle = lin(ctx, 0, -140, 0, 120, [[0, '#f2a9b4'], [1, '#c26a7b']]); ctx.fill();
  ctx.strokeStyle = 'rgba(120,40,60,.45)'; ctx.lineWidth = 6;
  for (let i = 0; i < 7; i++) { ctx.beginPath(); for (let j = 0; j <= 12; j++) { const px = -110 + j * 18, py = -90 + i * 26 + Math.sin(j * 1.3 + i) * 10; j ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); }
  rrect(ctx, 20, 90, 40, 110, 18); ctx.fillStyle = '#c26a7b'; ctx.fill();
  if (glowK > 0) for (let i = 0; i < 6; i++) { const a = t * 3 + i; bloom(ctx, Math.cos(a * 1.3) * 80, Math.sin(a) * 60 - 10, 70, 'rgba(255,200,90,', .5 * glowK); }
  if (ins > 0) { const p = .7 + .3 * Math.sin(t * 6); bloom(ctx, 20, 20, 120, 'rgba(255,170,60,', .9 * ins * p); circle(ctx, 20, 20, 26); ctx.fillStyle = `rgba(255,214,120,${ins})`; ctx.fill(); }
  if (cin > 0) { const p = .7 + .3 * Math.sin(t * 6 + 1); bloom(ctx, -10, -40, 120, 'rgba(255,170,60,', .9 * cin * p); ellipse(ctx, -10, -40, 60, 18, -.1); ctx.fillStyle = `rgba(255,214,120,${cin})`; ctx.fill(); }
  ctx.restore();
}
// ---------- leg, nerve, pins ----------
const LEG_Y = 560;
// the lower leg and foot seen from the side; sq = how much it is squeezed at x 330; numb tints the foot cold
function leg(ctx, t, sq = 0, numb = 0) {
  ctx.save();
  const top = x => LEG_Y - 95 + (Math.abs(x - 330) < 120 ? sq * 45 * Math.cos((x - 330) / 120 * Math.PI / 2) : 0);
  ctx.beginPath(); ctx.moveTo(-40, top(-40));
  for (let x = -40; x <= 760; x += 20) ctx.lineTo(x, top(x));
  ctx.quadraticCurveTo(820, LEG_Y - 120, 880, LEG_Y - 40); ctx.lineTo(1010, LEG_Y + 10); ctx.quadraticCurveTo(1050, LEG_Y + 60, 1000, LEG_Y + 95);
  ctx.lineTo(-40, LEG_Y + 95); ctx.closePath();
  ctx.fillStyle = lin(ctx, 0, LEG_Y - 100, 0, LEG_Y + 95, [[0, C.skin0], [.6, C.skin1], [1, C.skin2]]); ctx.fill();
  if (numb > 0) { ctx.save(); ctx.clip(); ctx.fillStyle = lin(ctx, 450, 0, 1050, 0, [[0, 'rgba(120,150,220,0)'], [1, `rgba(120,150,220,${.55 * numb})`]]); ctx.fillRect(400, LEG_Y - 200, 700, 400); ctx.restore(); }
  // toenail
  rrect(ctx, 985, LEG_Y + 20, 34, 22, 8); ctx.fillStyle = C.nail; ctx.fill();
  ctx.restore();
  if (sq > 0) { ctx.save(); ctx.globalAlpha = sq; rrect(ctx, 180, LEG_Y - 420 + (1 - sq) * -80, 300, 290, 60); ctx.fillStyle = lin(ctx, 0, LEG_Y - 420, 0, LEG_Y - 130, [[0, '#3a3f49'], [1, '#2a2e36']]); ctx.fill(); caps(ctx, 'tu peso', 330, LEG_Y - 280, 28, C.ink); ctx.restore(); }
}
// the nerve as a gold cable along the leg. mode: 'flow' (signals travel), 'blocked' (they stop at the squeeze), 'chaos' (random sparks)
function nerve(ctx, t, mode = 'flow', k = 1) {
  const y = x => LEG_Y + 30 + Math.sin(x / 90) * 10;
  glow(ctx, () => { ctx.beginPath(); for (let x = -40; x <= 990; x += 15) x === -40 ? ctx.moveTo(x, y(x)) : ctx.lineTo(x, y(x)); }, C.gold, 4, mode === 'blocked' ? .35 : .8 * k);
  if (mode === 'flow' || mode === 'blocked') {
    for (let i = 0; i < 8; i++) {
      let x = 990 - ((t * 420 + i * 140) % 1120);
      if (mode === 'blocked' && x < 380) continue;
      circle(ctx, x, y(x), 10); ctx.fillStyle = C.goldHot; ctx.fill(); bloom(ctx, x, y(x), 50, 'rgba(255,200,90,', .7);
    }
    if (mode === 'blocked') { bloom(ctx, 380, y(380), 90, 'rgba(255,79,99,', .7); line(ctx, 360, y(380) - 30, 400, y(380) + 30, 8, C.red); line(ctx, 400, y(380) - 30, 360, y(380) + 30, 8, C.red); }
  } else {
    const R = rng(Math.floor(t * 20));
    for (let i = 0; i < 16; i++) { const x = 380 + R() * 620, yy = y(x) + (R() - .5) * 120; bloom(ctx, x, yy, 40 + R() * 40, 'rgba(255,220,120,', .9 * k); }
  }
}
// pins popping around the foot
function pins(ctx, t, k = 1) {
  if (k <= 0) return;
  const R = rng(Math.floor(t * 8) + 3);
  for (let i = 0; i < 14; i++) {
    const x = 560 + R() * 470, y = LEG_Y - 140 + R() * 300, a = R() * TAU, p = (t * 8 + i) % 1;
    ctx.save(); ctx.globalAlpha = k * (1 - p); ctx.translate(x, y); ctx.rotate(a);
    line(ctx, 0, 0, 0, 46, 4, '#d9dde3'); circle(ctx, 0, 0, 9); ctx.fillStyle = C.red; ctx.fill(); ctx.restore();
  }
}
