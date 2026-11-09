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
// a simple person seen from the front, shirt col; arm 0..1 raises an arm (to hold a mic)
function person(ctx, x, y, s, col, t = 0, sway = 0, arm = 0) {
  ctx.save(); ctx.translate(x + Math.sin(t * 3) * 14 * sway, y); ctx.rotate(Math.sin(t * 3) * .05 * sway); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ellipse(ctx, 0, 250, 90, 18); ctx.fill();
  rrect(ctx, -45, 120, 36, 130, 16); ctx.fillStyle = '#2b2f37'; ctx.fill(); rrect(ctx, 9, 120, 36, 130, 16); ctx.fill();
  rrect(ctx, -70, -20, 140, 160, 50); ctx.fillStyle = col; ctx.fill();
  if (arm > 0) { ctx.save(); ctx.translate(60, 0); ctx.rotate(-1.9 * arm); rrect(ctx, -14, 0, 28, 110, 14); ctx.fillStyle = col; ctx.fill(); circle(ctx, 0, 116, 18); ctx.fillStyle = C.skin0; ctx.fill(); ctx.rotate(Math.PI); mic(ctx, 0, -150, .9); ctx.restore(); }
  circle(ctx, 0, -80, 56); ctx.fillStyle = C.skin0; ctx.fill();
  ctx.beginPath(); ctx.arc(0, -92, 58, Math.PI * 1.05, Math.PI * 1.95); ctx.fillStyle = '#2b1d17'; ctx.fill();
  circle(ctx, -18, -78, 6); circle(ctx, 18, -78, 6); ctx.fillStyle = '#1b1210'; ctx.fill();
  ctx.beginPath(); ctx.arc(0, -60, 16, .1, Math.PI - .1); ctx.lineWidth = 5; ctx.strokeStyle = '#1b1210'; ctx.stroke();
  ctx.restore();
}
// a cringing face: eyes squeezed, teeth showing; hands 0..1 come up over the face
function cringe(ctx, x, y, r, t, k = 1, hands = 0) {
  ctx.save(); ctx.translate(x + Math.sin(t * 25) * 3 * k, y);
  circle(ctx, 0, 0, r); ctx.fillStyle = rad(ctx, -r * .3, -r * .3, r * .1, r * 1.1, [[0, '#f6d2bd'], [1, '#c98f78']]); ctx.fill();
  if (k > 0) { bloom(ctx, -r * .45, r * .25, r * .5, 'rgba(255,90,100,', .5 * k); bloom(ctx, r * .45, r * .25, r * .5, 'rgba(255,90,100,', .5 * k); }
  [-1, 1].forEach(s => { ctx.beginPath(); ctx.moveTo(s * r * .5, -r * .12); ctx.lineTo(s * r * .22, -r * .02); ctx.lineTo(s * r * .5, r * .06); ctx.lineWidth = r * .07; ctx.strokeStyle = '#1b1210'; ctx.lineJoin = 'round'; ctx.stroke(); });
  rrect(ctx, -r * .42, r * .3, r * .84, r * .26, r * .1); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = r * .05; ctx.strokeStyle = '#1b1210'; ctx.stroke();
  for (let i = 1; i < 5; i++) line(ctx, -r * .42 + i * r * .168, r * .3, -r * .42 + i * r * .168, r * .56, r * .03, '#1b1210');
  if (hands > 0) [-1, 1].forEach(s => { const hy = lerp(r * 1.6, -r * .05, easeOut(hands)); rrect(ctx, s * r * .55 - r * .32, hy - r * .4, r * .64, r * .9, r * .3); ctx.fillStyle = C.skin1; ctx.fill(); for (let f = 0; f < 3; f++) line(ctx, s * r * .55 - r * .2 + f * r * .2, hy - r * .35, s * r * .55 - r * .2 + f * r * .2, hy - r * .05, r * .025, 'rgba(120,60,50,.4)'); });
  ctx.restore();
}
function mic(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(-.4);
  rrect(ctx, -14, 20, 28, 120, 12); ctx.fillStyle = '#1d2026'; ctx.fill();
  circle(ctx, 0, 0, 34); ctx.fillStyle = rad(ctx, -10, -10, 4, 36, [[0, '#d9dde3'], [1, '#6b717c']]); ctx.fill();
  ctx.restore();
}
// off-key music notes that wobble out of the mic
function notes(ctx, x, y, t, k = 1, sour = 1) {
  for (let i = 0; i < 5; i++) {
    const ph = (t * .8 + i * .2) % 1, nx = x + ph * 300 + Math.sin(t * 9 + i) * 20 * sour, ny = y - ph * 300;
    ctx.save(); ctx.globalAlpha = (1 - ph) * k; ctx.translate(nx, ny); ctx.rotate(Math.sin(t * 12 + i) * .5 * sour);
    text(ctx, i % 2 ? '♪' : '♫', 0, 0, 70, sour > .5 ? C.red : C.gold, 700, 'Inter'); ctx.restore();
  }
}
function sofa(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  box3d(ctx, -260, -160, 520, 170, 30, lin(ctx, 0, -160, 0, 10, [[0, '#5b4a7a'], [1, '#3e3157']]), '#6b5a8a', '#2e2442', 40);
  box3d(ctx, -280, 0, 560, 120, 30, lin(ctx, 0, 0, 0, 120, [[0, '#6b5a8a'], [1, '#463864']]), '#7a69a0', '#2e2442', 30);
  rrect(ctx, -320, -60, 70, 200, 30); ctx.fillStyle = '#4a3c68'; ctx.fill(); rrect(ctx, 250, -60, 70, 200, 30); ctx.fill();
  ctx.restore();
}
// an MRI-style scanner ring with a bed sliding in
function scanner(ctx, x, y, s, t, inP = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rrect(ctx, -330, 60, 660, 40, 14); ctx.fillStyle = '#2a2e36'; ctx.fill();
  const bx = lerp(-460, -120, easeOut(inP)); rrect(ctx, bx, 20, 420, 46, 20); ctx.fillStyle = '#d9dde3'; ctx.fill();
  circle(ctx, bx + 40, 0, 40); ctx.fillStyle = C.skin0; ctx.fill();
  circle(ctx, 120, -40, 230); ctx.fillStyle = lin(ctx, -110, -270, 350, 190, [[0, '#f1f3f6'], [1, '#aeb4bd']]); ctx.fill();
  circle(ctx, 120, -10, 120); ctx.fillStyle = '#0d0f12'; ctx.fill();
  glow(ctx, () => { ctx.beginPath(); ctx.arc(120, -10, 125, t * 2, t * 2 + 2); }, C.cyan, 4, .8);
  ctx.restore();
}
