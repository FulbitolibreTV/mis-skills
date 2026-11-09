// ---------- "Los demócratas ganan el Congreso: qué cambia" (neutral, resultados del 3-4 nov 2026) ----------
window.CAPTIONS = 'low';
window.COVER = { t: 1.9, title: 'Demócratas ganan el *Congreso*: ¿qué cambia?' };
const BLUE = '#5b8cff';

// 0 · hook: the Capitol lights up blue
shot(0, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 500, .6, 1, 'noche');
  const k = clamp((t - WT('congreso')) / .5);
  ctx.save(); cam(ctx, kf(lt, [[0, 1.35], [.6, 1, easeOut], [4.5, 1.07]]), 540, 600, t, 1, 540, 600);
  bloom(ctx, 540, 500, 700, 'rgba(70,120,255,', .55 * k);
  capitol(ctx, 540, 780, 1, t, 1);
  ctx.restore();
  pill(ctx, 'ELECCIONES 2026', 540, 190, lt / .3, C.gold, 40);
  pill(ctx, 'CONGRESO: DEMÓCRATAS', 540, 300, (t - WT('congreso')) / .3, BLUE, 34);
});
// 1 · House: 218 of 435
shot(1, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 560, .4, 2);
  const p = clamp((t - WT('218') + .3) / 1.6), q = clamp((t - WT('pasaron')) / .8);
  seats2(ctx, 540, 720, 440, 435, Math.round(lerp(0, 218, p) + 22 * q), 0, 1);
  caps(ctx, 'cámara de representantes · 435', 540, 780, 26, C.dim);
  readout(ctx, String(Math.round(lerp(0, 218, p))) + (q > .5 ? '+' : ''), 'mayoría', 540, 560, 100, (t - WT('218')) / .3, BLUE);
  pill(ctx, 'PROYECCIÓN', 540, 200, (t - WT('proyecciones')) / .3, C.gold, 30);
});
// 2 · Senate: 54 of 100, two still counting
shot(2, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 560, .4, 3);
  const a = clamp((t - WT('51') + .2) / .8), b = clamp((t - WT('54') + .1) / .5);
  const d = Math.round(lerp(0, 51, a) + 3 * b);
  seats2(ctx, 540, 720, 420, 100, d, b > .5 ? 44 : 0, 1);
  caps(ctx, 'senado · 100', 540, 780, 26, C.dim);
  readout(ctx, String(d), b > .5 ? 'demócratas' : 'mayoría', 540, 560, 100, (t - WT('51')) / .3, BLUE);
  pill(ctx, '2 POR CONTAR: ALASKA · MISISIPI', 540, 200, (t - WT('faltan')) / .3, C.ink, 26);
});
// 3 · seven seats flipped
shot(3, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 560, .5, 4);
  const S = ['OH', 'IA', 'NC', 'SC', 'ME', 'TX', 'KS'];
  S.forEach((s, i) => {
    const big = i >= 5, x = big ? 360 + (i - 5) * 360 : 220 + i * 160, y = big ? 640 : 330, sz = big ? 260 : 130;
    const tw = big ? WT(i === 5 ? 'texas' : 'kansas') : WT('siete') + i * .25;
    stateTile(ctx, x, y, sz, s, clamp((t - tw) / .35));
  });
  readout(ctx, '7', 'cambiaron de color', 540, 930, 70, (t - WT('siete')) / .3, BLUE);
});
// 4 · divided government: president red, congress blue
shot(4, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 520, .5, 5, 'noche');
  const k = clamp((t - WT('dividido')) / .4);
  line(ctx, 540, 260, 540, 980, 6, `rgba(255,255,255,${.1 + .5 * k})`);
  bloom(ctx, 270, 560, 360, 'rgba(255,70,80,', .45); bloom(ctx, 810, 560, 360, 'rgba(70,120,255,', .45);
  official(ctx, 270, 520, 1.6, '#c93a33');
  capitol(ctx, 810, 680, .45, t, 1);
  pill(ctx, 'PRESIDENTE', 270, 860, (t - WT('presidente', 0, 4)) / .3, C.red, 30);
  pill(ctx, 'CONGRESO', 810, 860, (t - WT('republicano')) / .3, BLUE, 30);
  pill(ctx, 'GOBIERNO DIVIDIDO', 540, 200, k, C.gold, 38);
});
// 5 · how a law gets out: House -> Senate -> President
shot(5, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 560, .4, 6);
  const t1 = WT('camaras') - .6, t2 = WT('camaras'), t3 = WT('firma');
  const x = kf(t, [[t1 - .4, 200], [t2, 540], [t3, 840]]);
  [['CÁMARA', 180], ['SENADO', 540], ['PRESIDENTE', 900]].forEach(([s, xx], i) => { caps(ctx, s, xx, 900, 26, C.dim); check(ctx, xx, 820, 34, (t - [t1, t2, t3 + .3][i]) / .3, C.green); });
  glow(ctx, () => { ctx.beginPath(); ctx.moveTo(180, 820); ctx.lineTo(900, 820); }, C.gold, 3, .5);
  bill(ctx, x, 480, 1.1, clamp((t - t3 - .1) / .6), Math.sin(t * 2) * .04);
});
// 6 · negotiate: two sides come together
shot(6, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 560, .5, 7);
  const k = easeOut(clamp((t - WT('negociar') + .2) / .6));
  bill(ctx, 540, 520, 1, 0);
  official(ctx, lerp(130, 330, k), 520, 1, '#c93a33'); official(ctx, lerp(950, 750, k), 520, 1, '#2f63d6');
  pill(ctx, 'NO PUEDE SOLO', 540, 200, (t - WT('solo')) / .3, C.red, 34);
  pill(ctx, 'NEGOCIAR', 540, 880, (t - WT('negociar')) / .3, C.gold, 40);
});
// 7 · the money: the budget, or a shutdown
shot(7, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 560, .6, 8);
  cash(ctx, 540, 680, 1.2, Math.min(5, 1 + Math.floor(clamp((t - WT('dinero')) / 1.2) * 4)));
  pill(ctx, 'PRESUPUESTO', 540, 220, (t - WT('presupuesto')) / .3, C.green, 36);
  stamp(ctx, 'CIERRE', 540, 480, 110, C.red, (t - WT('cierre')) / .25);
});
// 8 · senate confirms judges and cabinet: now it can say no
shot(8, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 560, .5, 9);
  [[200, '#1b1d22'], [420, '#1b1d22'], [660, '#3a4a6a'], [880, '#3a4a6a']].forEach(([x, c]) => official(ctx, x, 560, 1, c));
  caps(ctx, 'jueces', 310, 820, 26, C.dim); caps(ctx, 'gabinete', 770, 820, 26, C.dim);
  stamp(ctx, 'NO', 540, 520, 200, C.red, (t - WT('no', 0, 8)) / .25);
});
// 9 · investigate
shot(9, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 560, .4, 10);
  bill(ctx, 480, 560, 1.3, 0, -.05);
  magnifier(ctx, kf(t, [[WT('investigar') - .3, 760], [WT('testigos'), 520]]), 470, 150, t);
  pill(ctx, 'INVESTIGAR', 540, 200, (t - WT('investigar')) / .3, C.gold, 38);
  pill(ctx, 'TESTIGOS', 540, 920, (t - WT('testigos')) / .3, C.ink, 32);
});
// 10 · the veto, and the 2/3 bar
shot(10, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 560, .5, 11);
  bill(ctx, 540, 440, 1, 0);
  stamp(ctx, 'VETO', 540, 440, 130, C.red, (t - WT('veto')) / .25);
  const k = easeOut(clamp((t - WT('2/3') + .1) / .8));
  rrect(ctx, 190, 820, 700, 50, 25); ctx.fillStyle = '#2a2e36'; ctx.fill();
  if (k > 0) { rrect(ctx, 190, 820, Math.max(50, 700 * .667 * k), 50, 25); ctx.fillStyle = lin(ctx, 190, 0, 890, 0, [[0, C.blue], [1, C.gold]]); ctx.fill(); }
  line(ctx, 190 + 700 * .667, 800, 190 + 700 * .667, 890, 5, C.gold);
  caps(ctx, 'para anular un veto', 190, 780, 24, C.dim, 700, 'left');
  text(ctx, '2/3', 190 + 700 * .667, 935, 40, C.gold, 700);
});
// 11 · January 3
shot(11, 'flash', (ctx, lt, t) => {
  background(ctx, t, 540, 560, .6, 12, 'noche');
  capitol(ctx, 540, 900, .55, t, .8);
  calendar(ctx, 540, 400, 1, 'ENERO 2027', '3', (t - WT('3') + .1) / .4);
  pill(ctx, 'JURA EL NUEVO CONGRESO', 540, 980, (t - WT('jura')) / .3, C.gold, 30);
});
// 12 · comment yes or no
shot(12, 'fade', (ctx, lt, t) => {
  background(ctx, t, 540, 560, .5, 13, 'noche');
  capitol(ctx, 540, 1100, .8, t, .7);
  const ta = WT('comenta');
  pill(ctx, 'SÍ', 330, 1450, (t - ta) / .35, C.green, 70); pill(ctx, 'NO', 750, 1450, (t - ta - .15) / .35, C.red, 70);
  bubble(ctx, 540, 1660, t, (t - ta - .4) / .35);
}, { capY: 330 });

const P = (i, times, pc) => { SHOTS[i].punch = times; if (pc) SHOTS[i].pc = pc; };
P(1, [WT('218'), WT('pasaron')], [540, 600]);
P(2, [WT('51'), WT('54')], [540, 600]);
P(3, [WT('texas'), WT('kansas')], [540, 560]);
P(4, [WT('republicano'), WT('dividido')], [540, 560]);
P(5, [WT('ley'), WT('firma')], [540, 560]);
P(7, [WT('dinero'), WT('cierre')], [540, 560]);
P(8, [WT('jueces'), WT('no', 0, 8)], [540, 560]);
P(9, [WT('investigar'), WT('testigos')], [540, 560]);
P(10, [WT('veto'), WT('2/3')], [540, 560]);
