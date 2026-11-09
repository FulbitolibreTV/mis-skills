// ---------- "¿Qué pasaría si te consiguieras una chamba?" (humor) ----------
window.CAPTIONS = 'low';
window.COVER = { t: 1.4, title: '¿Y si te consigues una *chamba*? 😂' };
const DAY = (ctx, n, p) => pill(ctx, 'DÍA ' + n, 540, 170, p, C.gold, 40);

// 0 · hook: you on the couch with the phone vs. a job offer
shot(0, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 600, .5, 1, 'noche');
  ctx.save(); cam(ctx, kf(lt, [[0, 1.35], [.5, 1, easeOut], [3.8, 1.08]]), 540, 600, t, 1, 540, 600);
  sofa(ctx, 540, 760, 1.1); person(ctx, 540, 640, 1, '#7a7f8c', t);
  box3d(ctx, 232, 760, 616, 132, 0, lin(ctx, 0, 760, 0, 892, [[0, '#6b5a8a'], [1, '#463864']]), '#7a69a0', '#2e2442', 30);
  phone(ctx, 600, 560, 90, 160, (c, w, h) => { c.fillStyle = '#ff3b6b'; c.fillRect(0, 0, w, h); });
  ctx.restore();
  pill(ctx, '💼 SE BUSCA PERSONAL', 540, 200, (t - WT('chamba')) / .3, C.green, 34);
});
// 1 · day 1: the alarm at 7
shot(1, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 600, .4, 2, 'noche');
  const tr = WT('alarma');
  bed(ctx, 540, 820, 1.1, t, t < tr ? 1 : 0);
  alarm(ctx, 540, 420, 1.1, t, clamp((t - tr) / .2));
  DAY(ctx, 1, (t - WT('1')) / .3);
  readout(ctx, '7:00', 'a.m.', 860, 420, 60, (t - WT('7')) / .3, C.red);
});
// 2 · in a week the body clock settles, you sleep better
shot(2, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 600, .5, 3, 'noche');
  bed(ctx, 540, 820, 1.1, t, 1);
  const k = easeOut(clamp((t - WT('dormir')) / .8));
  rrect(ctx, 190, 420, 700, 50, 25); ctx.fillStyle = '#2a2e36'; ctx.fill();
  rrect(ctx, 190, 420, 700 * (.3 + .7 * k), 50, 25); ctx.fillStyle = lin(ctx, 190, 0, 890, 0, [[0, C.cyan], [1, C.green]]); ctx.fill();
  caps(ctx, 'calidad de sueño', 190, 390, 26, C.dim, 700, 'left');
  pill(ctx, 'RELOJ INTERNO', 540, 240, (t - WT('reloj')) / .3, C.cyan, 34);
});
// 3 · day 5: no more fridge every 20 minutes
shot(3, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 600, .5, 4, 'noche');
  fridge(ctx, 420, 560, 1, .3 + .3 * Math.sin(t * 2));
  line(ctx, 260, 300, 580, 820, 16, C.red); line(ctx, 580, 300, 260, 820, 16, C.red);
  DAY(ctx, 5, (t - WT('5')) / .3);
  readout(ctx, '−20 min', 'de refri', 820, 560, 56, (t - WT('refri')) / .3, C.green);
});
// 4 · day 10: finishing a task feels good
shot(4, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 560, .5, 5);
  const k = clamp((t - WT('bien')) / .4);
  brain(ctx, 540, 520, 2, t, 0, 0, k);
  check(ctx, 800, 300, 60, (t - WT('terminar')) / .4, C.green);
  DAY(ctx, 10, (t - WT('10')) / .3);
});
// 5 · same reward system as the phone, but working for you
shot(5, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 560, .5, 6);
  brain(ctx, 540, 380, 1.4, t, 0, 0, 1);
  phone(ctx, 140, 600, 220, 380, (c, w, h) => { c.fillStyle = '#ff3b6b'; c.fillRect(0, 0, w, h); text(c, '♥ ∞', w / 2, h / 2, 50, '#fff', 700); });
  const k = clamp((t - WT('favor')) / .4);
  ctx.save(); ctx.globalAlpha = k; rrect(ctx, 700, 600, 240, 300, 30); ctx.fillStyle = '#2a2e36'; ctx.fill(); check(ctx, 820, 750, 60, k, C.green); ctx.restore();
  glow(ctx, () => { ctx.beginPath(); ctx.moveTo(400, 480); ctx.quadraticCurveTo(300, 560, 260, 610); }, C.red, 4, .8 * (1 - k));
  glow(ctx, () => { ctx.beginPath(); ctx.moveTo(680, 480); ctx.quadraticCurveTo(780, 540, 820, 600); }, C.green, 4, k);
  pill(ctx, 'RECOMPENSA', 540, 140, (t - WT('recompensa')) / .3, C.gold, 34);
});
// 6 · day 15: payday
shot(6, 'flash', (ctx, lt, t) => {
  background(ctx, t, 540, 560, .7, 7);
  money(ctx, 540, 640, 1.4, t, clamp(lt * 4, 1, 6) | 0);
  DAY(ctx, 15, (t - WT('15')) / .3);
  pill(ctx, 'QUINCENA 💸', 540, 900, (t - WT('quincena')) / .3, C.green, 40);
});
// 7 · mom asks if you ate: "yes, and it's on me"
shot(7, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 600, .6, 8, 'noche');
  person(ctx, 300, 520, 1, '#c94f8a', t); person(ctx, 780, 520, 1, '#3c7dd9', t);
  table(ctx, 540, 820, 1);
  bubble(ctx, 300, 200, t, (t - WT('mama')) / .3, '¿Ya comiste?');
  bubble(ctx, 780, 200, t, (t - WT('invito')) / .3, '¡Yo invito!');
});
// 8 · the serious part: routine, coworkers, feeling useful protect mental health
shot(8, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 560, .4, 9);
  brain(ctx, 540, 330, 1.2, t, 0, 0, clamp((t - WT('mental')) / .5));
  steps(ctx, 3, clamp((t - WT('rutina') + .2) / .5) + clamp((t - WT('companeros') + .2) / .5) + clamp((t - WT('util') + .2) / .5), 540, 640, 200, 90);
  caps(ctx, 'rutina', 340, 720, 22, C.dim); caps(ctx, 'compañeros', 540, 720, 22, C.dim); caps(ctx, 'sentirte útil', 740, 720, 22, C.dim);
  pill(ctx, 'SALUD MENTAL', 540, 880, (t - WT('salud')) / .3, C.green, 36);
});
// 9 · day 30: schedule, money, stories... and a coworker you can't stand
shot(9, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 560, .5, 10);
  DAY(ctx, 30, (t - WT('30')) / .3);
  [['⏰ horario', WT('horario')], ['💸 dinero', WT('dinero', 0, 9)], ['💬 historias', WT('historias')]].forEach(([s, tw], i) => pill(ctx, s, 540, 330 + i * 110, (t - tw) / .3, C.ink, 32));
  const k = clamp((t - WT('compa') + .1) / .3);
  if (k > 0) { angryFaceLite(ctx, 540, 790, 110 * k, t); }
});
function angryFaceLite(ctx, x, y, r, t) {
  circle(ctx, x, y, r); ctx.fillStyle = rad(ctx, x - r * .3, y - r * .3, r * .1, r * 1.1, [[0, '#f3c9b1'], [1, '#c98f78']]); ctx.fill();
  [-1, 1].forEach(s => { circle(ctx, x + s * r * .35, y - r * .05, r * .09); ctx.fillStyle = '#1b1210'; ctx.fill(); line(ctx, x + s * r * .55, y - r * .4, x + s * r * .15, y - r * .22, r * .07, '#1b1210'); });
  line(ctx, x - r * .3, y + r * .45, x + r * .3, y + r * .4, r * .07, '#1b1210');
}
// 10 · a normal life
shot(10, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 600, .6, 11, 'noche');
  person(ctx, 540, 560, 1.3, '#2fa37a', t, .3, 0);
  check(ctx, 760, 300, 60, (t - WT('normal')) / .3, C.green);
  pill(ctx, 'VIDA NORMAL ✨', 540, 900, (t - WT('normal')) / .3, C.gold, 40);
});
// 11 · send it
shot(11, 'fade', (ctx, lt, t) => {
  background(ctx, t, 540, 560, .4, 12);
  shareScene(ctx, lt, WT('amigo') - LINE(11), WT('buscar') - LINE(11) + .2, (c, w, h) => {
    c.fillStyle = '#20182e'; c.fillRect(0, 0, w, h); c.save(); c.translate(w / 2, h * .62); c.scale(.4, .4); sofa(c, 0, 0, 1); c.restore();
    c.font = '600 22px Inter'; c.fillStyle = '#d8dbe0'; c.textAlign = 'center'; c.fillText('¿Y si te consigues una chamba?', w / 2, 120);
  });
}, { capY: 330 });

const P = (i, times, pc) => { SHOTS[i].punch = times; if (pc) SHOTS[i].pc = pc; };
P(1, [WT('alarma'), WT('nada')], [540, 560]);
P(2, [WT('semana'), WT('dormir')], [540, 560]);
P(4, [WT('raro'), WT('bien')], [540, 560]);
P(5, [WT('celular'), WT('favor')], [540, 560]);
P(7, [WT('primera', 0, 7), WT('comiste'), WT('invito')], [540, 560]);
P(8, [WT('serio'), WT('dinero', 0, 8), WT('util'), WT('mental')], [540, 560]);
P(9, [WT('horario'), WT('historias'), WT('compa')], [540, 560]);
