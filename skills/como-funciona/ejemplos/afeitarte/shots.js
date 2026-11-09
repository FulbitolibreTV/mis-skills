// ---------- "¿Afeitarte hace que el pelo salga más grueso?" ----------
window.CAPTIONS = 'low';
window.COVER = { t: 1.0, title: '¿Afeitarte hace el pelo *más grueso*?' };

// 0 · hook: a razor glides over stubble, a big NO
shot(0, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 560, .5, 1, 'piel');
  ctx.save(); cam(ctx, kf(lt, [[0, 1.4], [.5, 1.05, easeOut], [2.9, 1.1]]), 540, 560, t, 1, 540, 560);
  chin(ctx, 540, 520, 1.2, t, 1);
  razor(ctx, kf(lt, [[0, 200], [1.6, 860]]), 600, 1.1);
  ctx.restore();
  const p = clamp((t - WT('no') + .05) / .25);
  if (p > 0) { ctx.save(); ctx.globalAlpha = p; text(ctx, 'NO', 540, 300, 220 * backOut(p), C.red, 700); ctx.restore(); }
});
// 1 · proven almost 100 years ago
shot(1, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 560, .4, 2);
  readout(ctx, '1928', 'primer estudio', 540, 420, 120, (t - WT('comprobo')) / .3, C.gold);
  steps(ctx, 4, clamp((t - WT('repetido') + .2) / .9) * 4, 540, 720, 140, 80);
  caps(ctx, 'se ha repetido', 540, 800, 26, C.dim);
});
// 2 · hair grows from the root, under the skin; the blade never gets there
shot(2, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 400, .3, 3);
  ctx.save(); cam(ctx, kf(lt, [[0, .75], [4, .85]]), 540, 760, t, .5, 540, 640);
  skin(ctx, t);
  [280, 540, 800].forEach((x, i) => hair(ctx, x, 260 + i * 20, 0, 22, clamp((t - WT('raiz')) / .4)));
  razor(ctx, kf(t, [[WT('cuchilla') - .2, 0], [WT('cuchilla') + 1.4, 1100]]), SKIN_Y - 6, .9);
  ctx.restore();
  label(ctx, 'RAÍZ', 540, 800, 820, 1500, (t - WT('raiz')) / .4, C.gold, 34);
  pill(ctx, 'LA CUCHILLA NO LLEGA', 540, 180, (t - WT('nunca')) / .3, C.red, 30);
});
// 3 · what changes is the tip
shot(3, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 400, .3, 4);
  ctx.save(); cam(ctx, 2.2, 540, SKIN_Y - 300, t, 1, 540, 520); skin(ctx, t); hair(ctx, 540, 420, 0, 34); ctx.restore();
  label(ctx, 'PUNTA', 540, 280, 800, 180, (t - WT('punta')) / .4, C.gold, 34);
});
// 4 · an uncut hair ends thin, like a pencil tip
shot(4, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 500, .4, 5);
  ctx.save(); cam(ctx, 1.6, 540, SKIN_Y - 250, t, .6, 300, 520); skin(ctx, t); hair(ctx, 540, 420, 0, 34); ctx.restore();
  pencil(ctx, 720, 780, 1, 1);
  label(ctx, 'FINO', 300, 290, 300, 160, (t - WT('fino')) / .4, C.cyan, 30);
  text(ctx, '=', 540, 640, 90, C.gold, 700);
});
// 5 · shave it: you cut it at its widest, the tip is flat
shot(5, 'flash', (ctx, lt, t) => {
  background(ctx, t, 540, 500, .4, 6);
  const tc = WT('cortas'), cut = clamp((t - tc) / .3);
  ctx.save(); cam(ctx, 1.6, 540, SKIN_Y - 150, t, .6, 300, 600);
  skin(ctx, t); hair(ctx, 540, lerp(420, 30, cut), cut, 34);
  razor(ctx, kf(t, [[tc - .4, 100], [tc + .4, 1000]]), SKIN_Y - 30, 1);
  ctx.restore();
  pencil(ctx, 720, 860, 1, 1 - clamp((t - WT('plana')) / .3));
  label(ctx, 'PLANA', 300, 552, 300, 220, (t - WT('plana')) / .4, C.red, 30);
});
// 6 · so it feels rough and looks darker on the skin
shot(6, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 560, .5, 7, 'piel');
  chin(ctx, 540, 480, 1.25, t, 1.4);
  pill(ctx, 'MÁS ÁSPERO', 300, 920, (t - WT('aspero')) / .3, C.ink, 32);
  pill(ctx, 'MÁS OSCURO', 780, 920, (t - WT('oscuro')) / .3, C.ink, 32);
});
// 7 · but same thickness, same speed
shot(7, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 400, .3, 8);
  ctx.save(); cam(ctx, 1.1, 540, SKIN_Y - 120, t, .5, 540, 560);
  skin(ctx, t); hair(ctx, 380, 300, 0, 30); hair(ctx, 700, 300, 1, 30);
  ctx.restore();
  readout(ctx, '=', 'mismo grosor', 540, 220, 90, (t - WT('mismo')) / .3, C.green);
  pill(ctx, 'IGUAL DE RÁPIDO', 540, 920, (t - WT('rapido')) / .3, C.green, 32);
});
// 8 · send it
shot(8, 'fade', (ctx, lt, t) => {
  background(ctx, t, 540, 560, .4, 9);
  shareScene(ctx, lt, WT('amigo') - LINE(8), WT('tupido') - LINE(8) + .2, (c, w, h) => {
    c.fillStyle = '#2a1d18'; c.fillRect(0, 0, w, h); chin(c, w / 2, h * .62, .5, t, .6, 1);
    c.font = '600 22px Inter'; c.fillStyle = '#d8dbe0'; c.textAlign = 'center'; c.fillText('¿Afeitarte hace el pelo más grueso?', w / 2, 120);
  });
}, { capY: 330 });

const P = (i, times, pc) => { SHOTS[i].punch = times; if (pc) SHOTS[i].pc = pc; };
P(2, [WT('raiz'), WT('cuchilla')], [540, 560]);
P(4, [WT('fino'), WT('lapiz')], [540, 560]);
P(6, [WT('aspero'), WT('oscuro')], [540, 560]);
P(7, [WT('mismo'), WT('rapido')], [540, 560]);
