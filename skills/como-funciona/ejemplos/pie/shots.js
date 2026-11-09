// ---------- "¿Por qué se te duerme el pie?" ----------
window.CAPTIONS = 'low';
window.COVER = { t: 1.4, title: '¿Por qué se te *duerme el pie*?' };

// 0 · hook: a foot buzzing with pins
shot(0, 'cut', (ctx, lt, t) => {
  background(ctx, t, 760, 560, .6, 1);
  ctx.save(); cam(ctx, kf(lt, [[0, 1.6], [.6, 1.15, easeOut], [3.1, 1.22]]), 760, 560, t, 1, 640, 560);
  leg(ctx, t, 0, .6); nerve(ctx, t, 'chaos', .8); pins(ctx, t, 1);
  ctx.restore();
});
// 1 · not just the blood
shot(1, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 560, .4, 2);
  leg(ctx, t, 0, 0);
  // a blood vessel that keeps flowing
  glow(ctx, () => { ctx.beginPath(); for (let x = -40; x <= 980; x += 15) x === -40 ? ctx.moveTo(x, LEG_Y - 20 + Math.sin(x / 70) * 8) : ctx.lineTo(x, LEG_Y - 20 + Math.sin(x / 70) * 8); }, '#ff4f63', 4, .6);
  pill(ctx, 'NO SOLO LA SANGRE', 540, 900, (t - WT('sangre')) / .3, C.red, 34);
});
// 2 · sitting on the leg squeezes a nerve
shot(2, 'cut', (ctx, lt, t) => {
  background(ctx, t, 330, 560, .5, 3);
  const sq = easeOut(clamp((t - WT('sientas')) / .6));
  leg(ctx, t, sq, 0); nerve(ctx, t, 'flow', clamp((t - WT('nervio')) / .4));
  label(ctx, 'NERVIO', 600, LEG_Y + 34, 640, 900, (t - WT('nervio')) / .4, C.gold, 34);
});
// 3 · nerves are cables carrying messages to the brain
shot(3, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 560, .4, 4);
  brain(ctx, 200, 300, 1, t, 0, 0, .4);
  ctx.save(); cam(ctx, .8, 540, 560, t, .5, 600, 640); leg(ctx, t, 0, 0); nerve(ctx, t, 'flow', 1); ctx.restore();
  glow(ctx, () => { ctx.beginPath(); ctx.moveTo(250, 400); ctx.quadraticCurveTo(220, 560, 140, 670); }, C.gold, 4, .8);
  pill(ctx, 'PIE → CEREBRO', 540, 940, (t - WT('mensajes')) / .3, C.gold, 34);
});
// 4 · squeeze it and the messages stop: the brain loses the foot
shot(4, 'cut', (ctx, lt, t) => {
  background(ctx, t, 330, 560, .4, 5);
  ctx.save(); cam(ctx, .85, 540, 560, t, .5, 600, 660); leg(ctx, t, 1, clamp((t - WT('senal')) / .8)); nerve(ctx, t, 'blocked', 1); ctx.restore();
  brain(ctx, 200, 280, .9, t, 0, 0, 0);
  const p = clamp((t - WT('senal')) / .3);
  pill(ctx, 'SIN SEÑAL', 560, 230, p, C.red, 40);
});
// 5 · you can't feel it, it's hard to move
shot(5, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 760, 560, .3, 6);
  ctx.save(); cam(ctx, 1.4, 820, 560, t, 1, 600, 560); leg(ctx, t, 0, 1); ctx.restore();
  ctx.save(); ctx.setLineDash([14, 12]); ellipse(ctx, 700, 560, 330, 200); ctx.strokeStyle = 'rgba(160,190,255,.6)'; ctx.lineWidth = 4; ctx.stroke(); ctx.restore();
  pill(ctx, '¿Y MI PIE?', 700, 900, (t - WT('sientes')) / .3, C.cyan, 36);
});
// 6 · stand up: the nerve wakes up at once
shot(6, 'flash', (ctx, lt, t) => {
  background(ctx, t, 540, 560, .6, 7);
  const k = easeOut(clamp((t - WT('despierta')) / .3));
  ctx.save(); cam(ctx, .9, 540, 560, t, .8, 560, 600); leg(ctx, t, 1 - k, 1 - k); nerve(ctx, t, k > .5 ? 'chaos' : 'blocked', k); ctx.restore();
  bloom(ctx, 540, 600, 700, 'rgba(255,210,120,', .3 * k);
});
// 7 · chaotic signals all at once
shot(7, 'cut', (ctx, lt, t) => {
  background(ctx, t, 760, 560, .6, 8);
  ctx.save(); cam(ctx, 1.25, 760, 560, t, 1.5, 600, 560); leg(ctx, t, 0, .4); nerve(ctx, t, 'chaos', 1); ctx.restore();
  brain(ctx, 870, 230, .7, t, 0, 0, .9 + .1 * Math.sin(t * 20));
  for (let i = 0; i < 5; i++) { const ph = (t * 2 + i * .2) % 1; text(ctx, '!', 150 + i * 70, 260 - ph * 80, 60, C.gold, 700); }
});
// 8 · the tingling: noise while things go back to normal
shot(8, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 760, 560, .5, 9);
  const back = clamp((t - WT('normalidad')) / .6);
  ctx.save(); cam(ctx, 1.15, 760, 560, t, 1, 600, 560); leg(ctx, t, 0, .4 * (1 - back)); nerve(ctx, t, back > .5 ? 'flow' : 'chaos', 1); pins(ctx, t, 1 - back); ctx.restore();
  pill(ctx, 'HORMIGUEO', 540, 230, (t - WT('hormigueo')) / .3, C.gold, 44);
  check(ctx, 900, 230, 40, back, C.green);
});
// 9 · send it
shot(9, 'fade', (ctx, lt, t) => {
  background(ctx, t, 540, 560, .4, 10);
  shareScene(ctx, lt, WT('amigo') - LINE(9), WT('cojeando') - LINE(9) + .2, (c, w, h) => {
    c.fillStyle = '#121418'; c.fillRect(0, 0, w, h); c.save(); c.translate(0, h * .15); c.scale(.6, .6); leg(c, t, 0, .5); pins(c, t, 1); c.restore();
    c.font = '600 22px Inter'; c.fillStyle = '#d8dbe0'; c.textAlign = 'center'; c.fillText('¿Por qué se te duerme el pie?', w / 2, 120);
  });
}, { capY: 330 });

const P = (i, times, pc) => { SHOTS[i].punch = times; if (pc) SHOTS[i].pc = pc; };
P(2, [WT('pierna'), WT('nervio')], [540, 560]);
P(3, [WT('cables'), WT('cerebro', 0, 3)], [540, 560]);
P(4, [WT('aprietas'), WT('senal')], [540, 560]);
P(7, [WT('desordenadas'), WT('vez')], [540, 560]);
P(8, [WT('hormigueo'), WT('ruido'), WT('normalidad')], [540, 560]);
