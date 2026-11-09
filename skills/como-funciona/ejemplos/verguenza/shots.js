// ---------- "¿Por qué sientes vergüenza ajena?" ----------
window.CAPTIONS = 'low';
window.COVER = { t: 1.2, title: '¿Por qué sientes *vergüenza ajena*?' };

// 0 · hook: someone sings off-key on stage, you cringe
shot(0, 'cut', (ctx, lt, t) => {
  background(ctx, t, 300, 500, .8, 1);
  bloom(ctx, 300, 300, 420, 'rgba(255,220,160,', .35);
  ctx.save(); cam(ctx, kf(lt, [[0, 1.3], [.5, 1, easeOut], [4.4, 1.08]]), 540, 560, t, 1, 540, 560);
  person(ctx, 300, 520, 1.15, '#e0a030', t, 1, 1); notes(ctx, 470, 300, t, 1, 1);
  cringe(ctx, 790, 640, 170, t, clamp(lt / .8), clamp((lt - 1.6) / .5));
  ctx.restore();
});
// 1 · it has a name
shot(1, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 600, .5, 2);
  cringe(ctx, 540, 560, 230, t, 1, .6 + .1 * Math.sin(t * 3));
  pill(ctx, 'VERGÜENZA AJENA', 540, 900, (t - WT('ajena')) / .3, C.gold, 44);
});
// 2 · your brain really feels it
shot(2, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 560, .5, 3);
  brain(ctx, 540, 540, 2.2, t, 0, 0, clamp((t - WT('cerebro')) / .5));
  label(ctx, 'DE VERDAD', 700, 420, 860, 180, (t - WT('verdad')) / .4, C.gold);
});
// 3 · the study: a scanner while they watch awkward scenes
shot(3, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 560, .4, 4);
  scanner(ctx, 480, 640, 1.15, t, clamp(lt / 1.2));
  phone(ctx, 760, 180, 240, 300, (c, w, h) => { c.fillStyle = '#20232a'; c.fillRect(0, 0, w, h); person(c, w / 2, h * .45, .55, '#e0a030', t, 1, 1); });
  pill(ctx, 'ALEMANIA · 2011', 300, 220, (t - WT('alemania')) / .3, C.ink, 26);
  label(ctx, 'ESCÁNER', 600, 600, 300, 1500, (t - WT('escaner')) / .4, C.cyan);
});
// 4 · two regions light up
shot(4, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 560, .4, 5);
  const a = clamp((t - WT('insula')) / .4), b = clamp((t - WT('cingulada')) / .4);
  brain(ctx, 540, 560, 2.4, t, a, b);
  label(ctx, 'ÍNSULA', 540 + 20 * 2.4, 560 + 20 * 2.4, 820, 1480, a, C.gold);
  label(ctx, 'CORTEZA CINGULADA', 540 - 10 * 2.4, 560 - 40 * 2.4, 360, 160, b, C.gold, 26);
});
// 5 · the same zones as someone else's pain
shot(5, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 560, .4, 6);
  brain(ctx, 330, 520, 1.5, t, 1, 1);
  const p = clamp((t - WT('dolor')) / .3);
  finger(ctx, 800, 600, Math.PI * .85, .7, 480, p);
  if (p > 0) { bloom(ctx, 800, 600, 180, 'rgba(255,60,80,', .7 * p); line(ctx, 770, 560, 760, 500, 6, C.red); line(ctx, 820, 560, 850, 505, 6, C.red); }
  text(ctx, '=', 610, 540, 120, C.gold, 700);
  pill(ctx, 'LAS MISMAS ZONAS', 540, 940, (t - WT('mismas')) / .3, C.gold, 34);
});
// 6 · your brain steps into their shoes while you sit calm on the sofa
shot(6, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 600, .5, 7, 'noche');
  sofa(ctx, 540, 760, 1.1);
  person(ctx, 540, 560, 1, '#3c7dd9', t);
  box3d(ctx, 232, 760, 616, 132, 0, lin(ctx, 0, 760, 0, 892, [[0, '#6b5a8a'], [1, '#463864']]), '#7a69a0', '#2e2442', 30);
  const k = clamp((t - WT('zapatos')) / .4);
  ctx.save(); ctx.globalAlpha = k; rrect(ctx, 640, 120, 330, 230, 40); ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.fill(); person(ctx, 805, 225, .42, '#e0a030', t, 1, 1); ctx.restore();
  brain(ctx, 540, 340, .5, t, k, k);
  pill(ctx, 'TRANQUILO EN TU SILLÓN', 540, 940, (t - WT('sillon')) / .3, C.ink, 28);
});
// 7 · even when they don't notice: the dancer is happy, you suffer
shot(7, 'cut', (ctx, lt, t) => {
  background(ctx, t, 300, 500, .7, 8);
  person(ctx, 290, 560, 1.15, '#e0a030', t, 1.6, .5 + .5 * Math.sin(t * 6));
  notes(ctx, 300, 300, t, 1, 0);
  cringe(ctx, 800, 620, 150, t, 1, clamp((t - WT('cuenta')) / .4));
  pill(ctx, 'NI SE DA CUENTA', 290, 940, (t - WT('cuenta')) / .3, C.green, 28);
});
// 8 · your uncle's karaoke
shot(8, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 500, .8, 9);
  bloom(ctx, 540, 260, 500, 'rgba(255,120,200,', .3);
  person(ctx, 540, 520, 1.3, '#2fa37a', t, 1.4, 1); notes(ctx, 720, 280, t, 1, 1.5);
  pill(ctx, 'TU TÍO', 540, 940, (t - WT('tio')) / .3, C.gold, 34);
});
// 9 · empathy meter
shot(9, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 560, .4, 10);
  const k = easeOut(clamp((t - WT('empaticas') + .2) / 1.2));
  brain(ctx, 540, 480, 1.8, t, k, k, k);
  rrect(ctx, 190, 820, 700, 50, 25); ctx.fillStyle = '#2a2e36'; ctx.fill();
  rrect(ctx, 190, 820, 700 * (.2 + .8 * k), 50, 25); ctx.fillStyle = lin(ctx, 190, 0, 890, 0, [[0, C.cyan], [1, C.gold]]); ctx.fill();
  caps(ctx, 'empatía', 190, 790, 26, C.dim, 700, 'left');
});
// 10 · a good sign
shot(10, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 560, .5, 11);
  cringe(ctx, 540, 520, 200, t, .6, .4);
  check(ctx, 760, 330, 70, (t - WT('buena')) / .4, C.green);
  pill(ctx, 'BUENA SEÑAL', 540, 920, (t - WT('buena')) / .3, C.green, 40);
});
// 11 · comment
shot(11, 'fade', (ctx, lt, t) => {
  background(ctx, t, 540, 560, .5, 12);
  cringe(ctx, 540, 440, 170, t, 1, .5);
  bubble(ctx, 540, 820, t, (t - WT('comenta')) / .35);
});

const P = (i, times, pc) => { SHOTS[i].punch = times; if (pc) SHOTS[i].pc = pc; };
P(0, [WT('ridiculo'), WT('nada')], [540, 560]);
P(2, [WT('cerebro'), WT('verdad')], [540, 560]);
P(3, [WT('alemania'), WT('escaner'), WT('incomodas')], [540, 560]);
P(4, [WT('insula'), WT('cingulada')], [540, 560]);
P(6, [WT('zapatos'), WT('sillon')], [540, 560]);
P(7, [WT('curioso'), WT('cuenta'), WT('ridiculo', 0, 7)], [540, 560]);
P(8, [WT('karaoke'), WT('tio')], [540, 560]);
P(10, [WT('sufres'), WT('buena')], [540, 560]);
