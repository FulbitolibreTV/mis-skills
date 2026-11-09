// ---------- "Ganaron los demócratas: ¿qué pasa ahora con los inmigrantes?" ----------
window.COVER = { t: .5, title: '¿Qué pasa ahora con los *inmigrantes*?' };
const city = (ctx, t, mood = 'noche', hor = 1500) => { const h = landscape(ctx, t, mood, { hor, ground: 'ninguno' }); skyline(ctx, t, h, 1, 3, .4); ctx.fillStyle = lin(ctx, 0, h, 0, H, [[0, '#23262d'], [1, '#101216']]); ctx.fillRect(0, h, W, H - h); return h; };

// 0 · hook: night, the Capitol lit blue, crowd below
shot(0, 'cut', (ctx, lt, t) => {
  const h = city(ctx, t, 'noche', 1500);
  ctx.save(); cam(ctx, kf(lt, [[0, 1.5], [.7, 1, easeOut], [3.4, 1.08]]), 540, 1300, t, 1, 540, 1300);
  glow(ctx, () => { ellipse(ctx, 540, 1250, 420, 260); }, C.blue, 60, .5);
  capitol(ctx, 540, h, 1.05, '#e9eef8');
  for (let i = 0; i < 11; i++) figure(ctx, 60 + i * 96, H - 60, .55, { silhouette: true, arms: i % 3 ? 'down' : 'open' });
  ctx.restore();
  hookTitle(ctx, lt, '¿Qué pasa ahora con los *inmigrantes*?', 2.4, 760);
});
// 1 · deportations don't stop tomorrow: the van keeps driving
shot(1, 'zoom', (ctx, lt, t) => {
  const h = city(ctx, t, 'noche', 1350);
  van(ctx, kf(lt, [[0, -350], [1.2, 540, easeOut], [3.5, 640]]), h + 300, 1.15, t);
  stamp(ctx, 'NO SE DETIENEN', 540, 900, 84, C.red, (t - WT('detienen')) / .25);
});
// 2 · ICE answers to the president, not Congress
shot(2, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 1100, .4, 2);
  van(ctx, 540, 1600, .75, 0);
  const p = clamp((t - WT('presidente')) / .5);
  line(ctx, 540, 1430, 540, lerp(1430, 1080, p), 10, C.gold);
  woodSign(ctx, 540, 960, 1.3, 'DEPENDE DEL', 'PRESIDENTE', p);
  stamp(ctx, 'NO EL CONGRESO', 540, 700, 60, C.red, (t - WT('congreso')) / .25);
});
// 3 · ICE already has its money: ~$240 billion approved
shot(3, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 1200, .6, 3);
  const g = clamp((t - WT('dinero')) / 2.4);
  [[240, 1650], [540, 1700], [840, 1650]].forEach(([x, y], i) => moneyStack(ctx, x, y, 1.2, Math.round(g * (14 + i * 4))));
  chip(ctx, '$240.000', 'millones', 540, 880, (t - WT('doscientos')) / .3, C.green, 96);
  pill(ctx, 'YA APROBADO', 540, 1080, (t - WT('aprobados')) / .3, C.gold, 34);
});
// 4 · from Jan 3, Democrats run the committees
shot(4, 'cut', (ctx, lt, t) => {
  const h = city(ctx, t, 'dia', 1550);
  capitol(ctx, 540, h, 1.0);
  calendar(ctx, 300, 820, .6, 'ENERO', '3', (t - WT('enero')) / .3);
  pill(ctx, 'COMISIONES', 760, 820, (t - WT('comisiones')) / .3, C.blue, 36);
});
// 5 · they can investigate ICE, call witnesses, demand documents
shot(5, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 1100, .5, 5);
  folder(ctx, 540, 1150, 1.2, 'ICE', 1);
  magnifier(ctx, kf(lt, [[0, 300], [1.4, 600, easeOut], [3, 640]]), kf(lt, [[0, 1300], [1.4, 1100, easeOut]]), 1.1);
  pill(ctx, 'TESTIGOS', 300, 1650, (t - WT('testigos')) / .3, C.gold, 34);
  pill(ctx, 'DOCUMENTOS', 780, 1650, (t - WT('documentos')) / .3, C.gold, 34);
});
// 6 · the new budget: no more money without rules for raids
shot(6, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 1200, .6, 6);
  moneyStack(ctx, 540, 1500, 1.6, 16);
  stamp(ctx, 'SIN REGLAS, NO', 540, 1300, 76, C.red, (t - WT('reglas')) / .25);
  pill(ctx, 'PRESUPUESTO NUEVO', 540, 800, (t - WT('presupuesto')) / .3, C.gold, 34);
  pill(ctx, 'REDADAS', 540, 1750, (t - WT('redadas')) / .3, C.ink, 32);
});
// 7 · they can't pass a reform alone: the president has the veto
shot(7, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 1150, .4, 7);
  scroll(ctx, 540, 1150, 620, 640, clamp(lt / .5), (c, w, h) => { text(c, 'REFORMA', w / 2, h / 2 - 50, 70, '#4a2e12', 700); text(c, 'MIGRATORIA', w / 2, h / 2 + 40, 56, '#4a2e12', 700); });
  stamp(ctx, 'VETO', 540, 1260, 150, C.red, (t - WT('veto')) / .25);
});
// 8 · summary: more watch over ICE, today's rules stay
shot(8, 'cut', (ctx, lt, t) => {
  const h = city(ctx, t, 'atardecer', 1500);
  van(ctx, 540, h + 260, .8, 0);
  magnifier(ctx, 760, 1200, .7);
  pill(ctx, '+ VIGILANCIA', 540, 820, (t - WT('vigilancia')) / .3, C.green, 40);
  pill(ctx, 'REGLAS: IGUAL', 540, 950, (t - WT('hoy')) / .3, C.amber, 40);
});
// 9 · know your rights; sign nothing without a lawyer
shot(9, 'zoom', (ctx, lt, t) => {
  landscape(ctx, t, 'dia', { hor: 1600, sun: [800, 700], ground: 'ninguno' });
  figure(ctx, 380, 1720, 1.3, { arms: 'crossed', robe: '#3b4a63', sash: null, skin: '#b8835a', hair: '#1c140f' });
  shield(ctx, 780, 1250, 1, (t - WT('derechos')) / .4);
  pill(ctx, 'CONOCE TUS DERECHOS', 540, 800, (t - WT('derechos')) / .3, C.gold, 36);
  stamp(ctx, 'NO FIRMES', 780, 1600, 56, C.red, (t - WT('firmes')) / .25);
  pill(ctx, 'ABOGADO', 780, 1760, (t - WT('abogado')) / .3, C.green, 32);
});
// 10 · do you think anything will change? comment yes or no
shot(10, 'fade', (ctx, lt, t) => {
  city(ctx, t, 'noche', 1600);
  capitol(ctx, 540, 1600, .8, '#e9eef8');
  pill(ctx, 'SÍ', 330, 800, (t - WT('si', 0, 10)) / .3, C.green, 80); pill(ctx, 'NO', 750, 800, (t - WT('no', 0, 10)) / .3, C.red, 80);
  bubble(ctx, 540, 1010, t, (t - WT('comenta')) / .3);
});
const reframe = (i, tw, tr, z, cx, cy) => { const s = SHOTS[i]; shotAt(tw, tr, (ctx, lt, t) => { ctx.save(); ctx.translate(cx, cy); ctx.scale(z, z); ctx.translate(-cx, -cy); s.draw(ctx, t - s.start, t); ctx.restore(); }); };
reframe(2, WT('trump') - .05, 'cut', 1.3, 540, 1500);
reframe(3, WT('aprobados') - .05, 'zoom', 1.3, 540, 1000);
reframe(4, WT('democratas', 0, 4) - .05, 'cut', 1.3, 540, 1200);
reframe(5, WT('llamar') - .05, 'zoom', 1.3, 600, 1150);
reframe(6, WT('dicen') - .05, 'cut', 1.25, 540, 1400);
reframe(7, WT('presidente', 0, 7) - .05, 'zoom', 1.3, 540, 1200);
reframe(9, WT('nada') - .05, 'cut', 1.3, 780, 1500);
reframe(2, WT('presidente', 1) - .05, 'zoom', 1.25, 540, 960);
reframe(3, WT('dinero') - .05, 'cut', 1.15, 540, 1500);
reframe(3, WT('dolares') - .05, 'zoom', 1.3, 540, 900);
reframe(3, WT('veinticinco') - .05, 'cut', 1.2, 540, 1300);
reframe(8, WT('vigilancia') - .05, 'zoom', 1.25, 760, 1200);
reframe(8, WT('reglas', 0, 8) - .05, 'cut', 1.3, 540, 950);
reframe(10, WT('cambiar') - .05, 'zoom', 1.2, 540, 1400);
reframe(10, WT('comenta') + .9, 'cut', 1.15, 540, 1000);
reframe(7, WT('reforma') - .05, 'cut', 1.2, 540, 1100);
