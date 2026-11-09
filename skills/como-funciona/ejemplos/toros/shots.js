// ---------- "Los toros no odian el rojo" ----------
window.CAPTIONS = 'low';
window.COVER = { t: 1.0, title: 'Los toros *no odian* el *rojo*' };

// 0 · hook: a bull lowers its head at a swinging red cape
shot(0, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 600, .7, 1);
  ctx.save(); cam(ctx, kf(lt, [[0, 1.35], [.5, 1.05, easeOut], [3.4, 1.12]]), 540, 560, t, 1, 540, 560);
  bull(ctx, 470, 470, 1.05, t, clamp(lt / 1.2), Math.sin(t * 4) * .5);
  cape(ctx, 830, 700, .5, t, 1.2);
  ctx.restore();
  label(ctx, '¿ODIA EL ROJO?', 830, 820, 760, 1520, (lt - .4) / .4, C.red);
});
// 1 · your eye: three kinds of colour cells
shot(1, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 600, .4, 2);
  retina(ctx, 540, 560, 400, t, ['#ff3b4e', '#4fd36b', '#508cff']);
  label(ctx, 'CONOS', 540, 420, 540, 1500, (t - WT('celulas')) / .4, C.ink);
  readout(ctx, '3', 'tipos de conos · humano', 820, 1500, 70, (t - WT('3')) / .3, C.ink);
});
// 2 · the bull's eye: only two, the red one is missing
shot(2, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 600, .4, 3);
  retina(ctx, 540, 560, 400, t, ['#4fd36b', '#508cff']);
  const p = clamp((t - WT('dos')) / .4);
  if (p > 0) { ctx.save(); ctx.globalAlpha = p; rrect(ctx, 830, 380, 60, 280, 30); ctx.strokeStyle = C.red; ctx.setLineDash([10, 10]); ctx.lineWidth = 4; ctx.stroke(); ctx.restore(); line(ctx, 800, 450, 920, 590, 10, C.red); line(ctx, 920, 450, 800, 590, 10, C.red); }
  readout(ctx, '2', 'tipos de conos · toro', 540, 1500, 70, (t - WT('dos')) / .3, C.gold);
});
// 3 · how red looks to you vs to the bull (split screen)
shot(3, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 600, .4, 4);
  const p = easeOut(clamp((t - WT('apagado')) / .8));
  ctx.save(); rrect(ctx, 60, 200, 470, 780, 30); ctx.clip(); ctx.fillStyle = '#16181d'; ctx.fillRect(60, 200, 470, 780); cape(ctx, 295, 420, .85, t, .6); ctx.restore();
  ctx.save(); rrect(ctx, 550, 200, 470, 780, 30); ctx.clip(); ctx.fillStyle = '#16181d'; ctx.fillRect(550, 200, 470, 780); ctx.filter = `grayscale(${.85 * p}) brightness(${1 - .25 * p})`; cape(ctx, 785, 420, .85, t, .6); ctx.filter = 'none'; ctx.restore();
  caps(ctx, 'tú', 295, 240, 30, C.ink); caps(ctx, 'el toro', 785, 240, 30, C.gold);
});
// 4 · then why do they charge?
shot(4, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 600, .6, 5);
  bull(ctx, 540, 520, 1.1, t, .6, 0);
  text(ctx, '?', 900, 760, 200, C.gold, 700);
});
// 5 · movement: the cape swings with golden motion trails, the bull's eyes follow
shot(5, 'flash', (ctx, lt, t) => {
  background(ctx, t, 540, 600, .6, 6);
  const sx = Math.sin(t * 5) * 220;
  for (let k = 1; k <= 4; k++) { ctx.save(); ctx.globalAlpha = .12 * (5 - k); cape(ctx, 540 + Math.sin((t - k * .05) * 5) * 220, 360, .65, t - k * .05, 1.4); ctx.restore(); }
  cape(ctx, 540 + sx, 360, .65, t, 1.4);
  glow(ctx, () => { ctx.beginPath(); ctx.arc(540, 480, 300, Math.PI * 1.1, Math.PI * 1.9); }, C.gold, 4, .8);
  label(ctx, 'MOVIMIENTO', 540 + sx, 600, 540, 1500, lt / .3, C.gold, 34);
});
// 6 · the test: red, blue and white cloths, charged the same
shot(6, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 600, .4, 7);
  const cols = [['#d4202f', 'rojo', WT('rojas')], ['#2f6fd4', 'azul', WT('azules')], ['#e9ecef', 'blanco', WT('blancas')]];
  cols.forEach(([c, n, tw], i) => { const x = 180 + i * 330; flag(ctx, x - 60, 300, 1.1, c, t + i); caps(ctx, n, x, 700, 26, C.dim); });
  const ta = WT('atacó'), k = clamp((t - ta) / .3);
  cols.forEach((_, i) => { const p = clamp((t - ta - i * .35) / .3); if (p > 0) { check(ctx, 180 + i * 330, 820, 34, p, C.red); } });
  label(ctx, 'LAS ATACÓ IGUAL', 510, 870, 540, 1500, k, C.red, 30);
});
// 7 · with people: it went for the one moving, not the one in red
shot(7, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 600, .4, 8);
  const tm = WT('movia'), m = clamp((t - tm + .3) / .3);
  person(ctx, 300, 520, 1.3, '#d4202f', t, 0);
  person(ctx, 780, 520, 1.3, '#2f6fd4', t, m);
  caps(ctx, 'quieto · rojo', 300, 900, 26, C.dim); caps(ctx, 'se mueve · azul', 780, 900, 26, C.gold);
  if (m > 0) { glow(ctx, () => { ctx.beginPath(); ctx.moveTo(540, 1460); ctx.quadraticCurveTo(700, 1300, 780, 960); }, C.gold, 6, m); label(ctx, 'AQUÍ VA EL TORO', 780, 960, 540, 1520, m, C.gold, 28); }
});
// 8 · tradition: the cape is red so stains don't show
shot(8, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 600, .5, 9);
  cape(ctx, 540, 300, 1.4, t, .5);
  label(ctx, 'TRADICIÓN', 380, 500, 200, 1480, (t - WT('tradicion')) / .4, C.gold);
  label(ctx, 'NO SE NOTAN LAS MANCHAS', 700, 650, 700, 1560, (t - WT('manchas')) / .4, C.ink, 24);
});
// 9 · punchline: the one who gets mad at red... is not the bull
shot(9, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 600, .5, 10);
  const k = clamp((t - WT('toro', 0, 9) + .2) / .4);
  bull(ctx, 760, 560, .7, t, 0, -.5);
  angryFace(ctx, 300, 560, 170, t, k);
});
// 10 · send it
shot(10, 'fade', (ctx, lt, t) => {
  background(ctx, t, 540, 600, .4, 11);
  shareScene(ctx, lt, WT('amigo') - LINE(10), WT('enoja', 0, 10) - LINE(10) + .2, (c, w, h) => {
    c.fillStyle = '#121418'; c.fillRect(0, 0, w, h); bull(c, w / 2, h * .55, .45, t, .5, 0);
    c.font = '600 22px Inter'; c.fillStyle = '#d8dbe0'; c.textAlign = 'center'; c.fillText('Los toros no odian el rojo', w / 2, 120);
  });
}, { capY: 330 });

const P = (i, times, pc) => { SHOTS[i].punch = times; if (pc) SHOTS[i].pc = pc; };
P(0, [WT('rojo'), WT('ven')], [540, 560]);
P(1, [WT('celulas'), WT('colores')], [540, 560]);
P(3, [WT('rojo', 0, 3), WT('gris')], [540, 560]);
P(6, [WT('rojas'), WT('azules'), WT('blancas'), WT('igual')], [540, 560]);
P(7, [WT('personas'), WT('movia')], [540, 560]);
P(8, [WT('tradicion'), WT('manchas')], [540, 560]);
P(9, [WT('enoja', 0, 9), WT('toro', 0, 9)], [540, 560]);
