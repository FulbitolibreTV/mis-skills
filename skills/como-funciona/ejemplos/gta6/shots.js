// ---------- "GTA 6 sale en 15 días: lo que tienes que saber" ----------
window.COVER = { t: .5, title: '*GTA 6* sale en 15 días' };

// 0 · hook: neon city, a car speeds across, the game case pops
shot(0, 'cut', (ctx, lt, t) => {
  neonCity(ctx, t, 1250);
  palm(ctx, 120, 1700, 1.3, t); palm(ctx, 960, 1720, 1.15, t + 1);
  car(ctx, kf(lt, [[0, -500], [1.1, 540, easeOut], [5, 620]]), 1650, 1);
  gameCase(ctx, 540, 1100, .9, '6', (lt - 1.8) / .4, -.05);
  hookTitle(ctx, lt, '*GTA 6* sale en 15 días', 1.7, 760, 104);
  pill(ctx, '15 DÍAS', 540, 760, (lt - 1.9) / .3, C.gold, 48);
});
// 1 · out Nov 19, already delayed twice
shot(1, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 1100, .6, 1);
  calendar(ctx, 540, 1150, 1.1, 'NOVIEMBRE', '19', (t - WT('noviembre')) / .3);
  stamp(ctx, 'RETRASADO x2', 540, 1600, 70, C.red, (t - WT('retrasaron')) / .25);
});
// 2 · timeline: fall 2025 -> May 2026 -> Nov 2026
shot(2, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 1100, .5, 2);
  const g = clamp(lt / 4); line(ctx, 170, 760, 170, 760 + 720 * g, 14, C.gold); circle(ctx, 170, 760 + 720 * g, 26); ctx.fillStyle = C.gold; ctx.fill();
  const items = [['OTOÑO 2025', WT('otoño')], ['MAYO 2026', WT('mayo')], ['NOV 2026', WT('noviembre', 0, 2)]];
  items.forEach(([s, w], i) => {
    const y = 820 + i * 300, p = i ? clamp((t - w) / .3) : clamp(lt / .3);
    pill(ctx, s, 540, y, p, i < 2 ? C.ink : C.gold, 58);
    if (i < 2) { const k = clamp((t - items[i + 1][1]) / .3); if (k > 0) line(ctx, 300, y, 300 + 480 * k, y, 12, C.red); }
  });
});
// 3 · only PS5 and Xbox Series; PS4 won't work
shot(3, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 1100, .4, 3);
  consoleBox(ctx, 260, 1100, .9, 'PS5', '#eef0f4', (t - WT('playstation')) / .3);
  consoleBox(ctx, 540, 1100, .9, 'XBOX', '#2b2f35', (t - WT('xbox')) / .3);
  consoleBox(ctx, 820, 1100, .9, 'PS4', '#26314d', (t - WT('ps')) / .3, t < WT('servir') - .2);
});
// 4 · PC? not announced; rumors say early 2027
shot(4, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 1100, .5, 4);
  rrect(ctx, 240, 900, 600, 380, 24); ctx.fillStyle = '#1b1f2b'; ctx.fill(); rrect(ctx, 270, 930, 540, 320, 12); ctx.fillStyle = '#0b0d14'; ctx.fill();
  rrect(ctx, 500, 1280, 80, 90, 6); ctx.fillStyle = '#1b1f2b'; ctx.fill(); rrect(ctx, 400, 1360, 280, 24, 12); ctx.fill();
  goldIcon(ctx, 'question', 540, 1090, 1, clamp((t - WT('pc')) / .4), t);
  pill(ctx, 'NO ANUNCIADO', 540, 760, (t - WT('anunciado')) / .3, C.red, 40);
  pill(ctx, 'RUMOR: 2027', 540, 1560, (t - WT('principios')) / .3, C.amber, 44);
});
// 5 · price: $80 standard, $100 ultimate
shot(5, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 1150, .7, 5);
  priceTag(ctx, 540, 1100, .95, '$79.99', { p: lt / .35, t, w: 700, hi: clamp((t - WT('ochenta')) / .3) });
  priceTag(ctx, 540, 1550, .8, '$99.99', { p: (t - WT('ultimate')) / .35, t: t + 1, bg: '#ffd56b', w: 700 });
});
// 6 · preload from Nov 12
shot(6, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 1100, .5, 6);
  calendar(ctx, 540, 900, .8, 'NOVIEMBRE', '12', clamp(lt / .3));
  const k = clamp((t - WT('descargar')) / 2.2);
  drive(ctx, 540, 1400, 760, k, 'DESCARGA ANTICIPADA ' + Math.round(k * 100) + '%');
});
// 7 · rumored 200+ GB
shot(7, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 1100, .4, 7);
  chip(ctx, '200+', 'GB', 540, 950, (t - WT('doscientos')) / .3, C.amber, 130);
  drive(ctx, 540, 1350, 760, .25 + .7 * clamp((t - WT('doscientos')) / 1), 'ESPACIO EN TU CONSOLA');
  pill(ctx, 'RUMOR', 540, 1650, (t - WT('rumorea')) / .3, C.ink, 36);
});
// 8 · Leonida, a made-up Florida; Vice City = its Miami
shot(8, 'cut', (ctx, lt, t) => {
  neonCity(ctx, t, 1350);
  palm(ctx, 140, 1800, 1.4, t); palm(ctx, 930, 1780, 1.2, t + 2); palm(ctx, 760, 1850, .9, t + 4);
  pill(ctx, 'LEONIDA', 540, 760, (t - WT('leonida')) / .3, C.gold, 56);
  pill(ctx, '= FLORIDA', 540, 880, (t - WT('florida')) / .3, C.ink, 40);
  pill(ctx, 'VICE CITY = MIAMI', 540, 1010, (t - WT('vice')) / .3, '#ff6fb5', 44);
});
// 9 · first woman lead in the modern series: Lucia, with Jason
shot(9, 'zoom', (ctx, lt, t) => {
  neonCity(ctx, t, 1450);
  figure(ctx, 400, 1820, 1.2, { silhouette: true, arms: 'crossed' });
  figure(ctx, 680, 1820, 1.3, { silhouette: true, arms: 'down' });
  pill(ctx, 'LUCÍA', 400, 1000, (t - WT('lucia')) / .3, '#ff6fb5', 50);
  pill(ctx, 'JASON', 680, 1000, (t - WT('jason')) / .3, C.blue, 50);
  pill(ctx, '1.ª PROTAGONISTA MUJER', 540, 800, (t - WT('mujer')) / .3, C.gold, 38);
});
// 10 · GTA V sold 210M+; will this beat it?
shot(10, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 1200, .6, 10);
  bars(ctx, 430, 1550, [1, clamp((t - WT('supera')) / 1.2) * 1.15], ['GTA 5', 'GTA 6'], clamp((t - WT('vendio')) / .8) * 2, [C.blue, '#ff6fb5']);
  chip(ctx, '210', 'millones', 540, 820, (t - WT('doscientos', 0, 10)) / .3, C.gold, 110);
  goldIcon(ctx, 'question', 650, 1000, .7, clamp((t - WT('supera')) / .4), t);
});
// 11 · buying day one? comment yes or no
shot(11, 'fade', (ctx, lt, t) => {
  neonCity(ctx, t, 1500);
  gameCase(ctx, 540, 1450, .7, '6', 1, .04);
  pill(ctx, 'SÍ', 330, 800, (t - WT('si', 0, 11)) / .3, C.green, 80); pill(ctx, 'NO', 750, 800, (t - WT('no', 0, 11)) / .3, C.red, 80);
  bubble(ctx, 540, 1010, t, (t - WT('comenta')) / .3);
});
const reframe = (i, tw, tr, z, cx, cy) => { const s = SHOTS[i]; shotAt(tw, tr, (ctx, lt, t) => { ctx.save(); ctx.translate(cx, cy); ctx.scale(z, z); ctx.translate(-cx, -cy); s.draw(ctx, t - s.start, t); ctx.restore(); }); };
reframe(0, WT('saber') - .05, 'zoom', 1.3, 540, 1100);
reframe(1, WT('retrasaron') - .05, 'cut', 1.25, 540, 1400);
reframe(3, WT('ps') - .05, 'zoom', 1.4, 820, 1100);
reframe(4, WT('rumores') - .05, 'zoom', 1.25, 540, 1300);
reframe(5, WT('ultimate') - .05, 'cut', 1.25, 540, 1400);
reframe(6, WT('jugar') - .05, 'zoom', 1.25, 540, 1300);
reframe(8, WT('vice') - .05, 'zoom', 1.25, 540, 1000);
reframe(9, WT('lucia') - .05, 'cut', 1.35, 400, 1300);
reframe(10, WT('supera') - .05, 'zoom', 1.2, 540, 1300);
reframe(6, WT('antes', 0, 6) - .05, 'cut', 1.2, 540, 1100);
reframe(7, WT('espacio') - .05, 'zoom', 1.25, 540, 1200);
reframe(7, WT('gigas') - .05, 'cut', 1.3, 540, 950);
reframe(8, WT('inventada') - .05, 'zoom', 1.2, 540, 900);
reframe(9, WT('saga') - .05, 'zoom', 1.2, 540, 1300);
reframe(9, WT('jason') - .05, 'cut', 1.35, 680, 1300);
reframe(10, WT('copias') - .05, 'cut', 1.2, 540, 1000);
reframe(10, WT('este', 0, 10) - .05, 'zoom', 1.15, 540, 1400);
reframe(2, WT('luego') - .05, 'zoom', 1.15, 540, 1100);
reframe(2, WT('ahora', 0, 2) - .05, 'cut', 1.25, 540, 1400);
reframe(4, WT('veintisiete') - .05, 'cut', 1.3, 540, 1450);
reframe(10, WT('vendio') - .05, 'zoom', 1.2, 540, 900);
reframe(2, WT('otoño') - .05, 'zoom', 1.2, 540, 820);
