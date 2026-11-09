// ---------- "El hombre que sobrevivió a las dos bombas atómicas" (Tsutomu Yamaguchi) ----------
window.COVER = { t: .5, title: 'Sobrevivió a las *dos* bombas atómicas' };
const sky = (ctx, t, mood, hor = 1350) => { const h = landscape(ctx, t, mood, { hor, sun: [820, 900], ground: 'desierto' }); town(ctx, h, 1, 3, mood === 'dia' ? '#4a4652' : '#25232b'); return h; };

// 0 · hook: a silhouette in front of two distant clouds
shot(0, 'cut', (ctx, lt, t) => {
  const h = sky(ctx, t, 'atardecer');
  ctx.save(); cam(ctx, kf(lt, [[0, 1.35], [.7, 1, easeOut], [3.4, 1.05]]), 540, 1300, t, 1, 540, 1300);
  blast(ctx, 300, h - 40, .55, 0, 1, t); blast(ctx, 800, h - 40, .55, 0, clamp((t - WT('dos')) / .8), t);
  engineer(ctx, 540, 1850, 1.3, { silhouette: true });
  ctx.restore();
  dots(ctx, 2, clamp((t - WT('dos')) / .3) * 2, 540, 620, 100, 34);
  hookTitle(ctx, lt, 'Sobrevivió a las *dos* bombas atómicas', 1.6, 900);
});
// 1 · Tsutomu Yamaguchi, engineer, from Nagasaki
shot(1, 'zoom', (ctx, lt, t) => {
  sky(ctx, t, 'dia');
  engineer(ctx, 540, 1850, 1.5, { look: .3 });
  pill(ctx, 'TSUTOMU YAMAGUCHI', 540, 640, (t - WT('tsutomu')) / .3, C.gold, 38);
  label(ctx, 'INGENIERO', 540, 1350, 860, 1500, (t - WT('ingeniero')) / .4, C.ink, 28);
  pill(ctx, 'NAGASAKI', 540, 760, (t - WT('nagasaki')) / .3, C.ink, 30);
});
// 2 · August 1945: business trip to Hiroshima
shot(2, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 1100, .5, 2);
  chip(ctx, '1945', '', 540, 640, (t - WT('1945')) / .3, C.gold, 80);
  const p = clamp((t - WT('viaje')) / 1.2);
  pill(ctx, 'NAGASAKI', 760, 1500, 1, C.ink, 30); pill(ctx, 'HIROSHIMA', 320, 1000, (t - WT('hiroshima')) / .3, C.red, 30);
  ctx.save(); ctx.setLineDash([18, 14]); ctx.beginPath(); ctx.moveTo(760, 1450); ctx.quadraticCurveTo(700, 1150, 320 + 440 * (1 - p), 1050 + 400 * (1 - p)); ctx.strokeStyle = C.gold; ctx.lineWidth = 6; ctx.stroke(); ctx.restore();
  engineer(ctx, lerp(760, 340, p), lerp(1420, 980, p), .35, {});
});
// 3 · August 6, on his way to the office: the first bomb
shot(3, 'cut', (ctx, lt, t) => {
  const tb = WT('bomba'), h = sky(ctx, t, 'dia');
  calendar(ctx, 820, 700, .6, 'AGOSTO', '6', (t - WT('6')) / .3);
  engineer(ctx, kf(t, [[LINE(3), 200], [tb, 420]]), 1850, 1.1, { look: 1 });
  if (t > tb) blast(ctx, 760, h - 40, .9, clamp(1 - (t - tb) / .6), clamp((t - tb) / 1.5), t);
}, { punch: [WT('bomba')], pc: [540, 1200] });
// 4 · burns, burst eardrums... but he survived
shot(4, 'zoom', (ctx, lt, t) => {
  sky(ctx, t, 'tormenta'); rain(ctx, t, .3);
  engineer(ctx, 540, 1900, 1.7, { hurt: true, eyes: 'closed' });
  label(ctx, 'QUEMADURAS', 470, 1100, 230, 900, (t - WT('quemaduras')) / .4, C.red, 26);
  label(ctx, 'TÍMPANOS', 620, 1150, 850, 900, (t - WT('timpanos')) / .4, C.red, 26);
  pill(ctx, 'SOBREVIVIÓ', 540, 650, (t - WT('sobrevivio', 0, 4)) / .3, C.green, 42);
});
// 5 · next day, injured, he takes a train home
shot(5, 'cut', (ctx, lt, t) => {
  const h = landscape(ctx, t, 'atardecer', { hor: 1300, sun: [300, 1100], ground: 'desierto' });
  train(ctx, kf(lt, [[0, 300], [3.5, 1200]]), h + 60, 1, t);
  pill(ctx, 'DE VUELTA A NAGASAKI', 540, 650, (t - WT('casa')) / .3, C.ink, 34);
});
// 6 · August 9, in his Nagasaki office, telling his boss what he saw
shot(6, 'zoom', (ctx, lt, t) => {
  brickWall(ctx, t, [540, 900]);
  calendar(ctx, 820, 700, .6, 'AGOSTO', '9', (t - WT('9')) / .3);
  desk(ctx, 540, 1600, 1.1);
  engineer(ctx, 330, 1850, 1.05, { hurt: true, arms: 'point', look: 1 }); figure(ctx, 760, 1850, 1.05, { robe: '#3a3f4a', sash: null, hair: '#3a3a3a', skin: '#e2b994', look: -1 });
  bubble(ctx, 330, 900, t, (t - WT('contando')) / .3, 'Hiroshima…');
});
// 7 · when the second bomb fell
shot(7, 'flash', (ctx, lt, t) => {
  const h = sky(ctx, t, 'dia');
  blast(ctx, 540, h - 40, .85, clamp(1 - lt / .5), clamp(lt / 1.4), t);
  dots(ctx, 2, 1 + clamp((t - WT('segunda')) / .3), 540, 640, 100, 34);
}, { punch: [WT('segunda')], pc: [540, 1100] });
// 8 · and again, he survived
shot(8, 'cut', (ctx, lt, t) => {
  sky(ctx, t, 'atardecer'); godRays(ctx, 540, 300, clamp(lt / .6), t);
  engineer(ctx, 540, 1900, 1.6, { hurt: true, eyes: 'closed' });
  pill(ctx, 'OTRA VEZ', 540, 650, (t - WT('otra')) / .3, C.green, 42);
});
// 9 · 2009: the only official survivor of both
shot(9, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 1100, .6, 9);
  chip(ctx, '2009', '', 540, 640, (t - WT('2009')) / .3, C.gold, 80);
  scroll(ctx, 540, 1150, 640, 520, (t - WT('reconocio')) / .6, (c, w, h) => { text(c, 'SOBREVIVIENTE', w / 2, h * .38, 50, '#3a2a1a', 700); text(c, 'DE LAS DOS', w / 2, h * .55, 50, '#a8321f', 700); });
  stamp(ctx, 'ÚNICO', 760, 1500, 80, C.red, (t - WT('unico')) / .25);
});
// 10 · he lived to 93, asking that they never be used again
shot(10, 'cut', (ctx, lt, t) => {
  landscape(ctx, t, 'atardecer', { hor: 1350, sun: [540, 1150], ground: 'hierba' });
  engineer(ctx, 540, 1900, 1.5, { arms: 'pray', eyes: 'closed' });
  chip(ctx, '93', 'años', 540, 640, (t - WT('93')) / .3, C.ink, 80);
  stamp(ctx, 'NUNCA MÁS', 540, 900, 90, C.gold, (t - WT('nunca')) / .25, -.05);
}, { punch: [WT('93'), WT('nunca')], pc: [540, 1200] });
// 11 · luck or destiny? comment
shot(11, 'fade', (ctx, lt, t) => {
  sky(ctx, t, 'noche');
  engineer(ctx, 540, 1900, 1.2, { silhouette: true });
  pill(ctx, 'SUERTE', 300, 900, (t - WT('suerte')) / .3, C.gold, 56); pill(ctx, 'DESTINO', 780, 900, (t - WT('destino')) / .3, C.cyan, 56);
  bubble(ctx, 540, 1150, t, (t - WT('comenta')) / .3);
});
const reframe = (i, tw, tr, z, cx, cy) => { const s = SHOTS[i]; shotAt(tw, tr, (ctx, lt, t) => { ctx.save(); ctx.translate(cx, cy); ctx.scale(z, z); ctx.translate(-cx, -cy); s.draw(ctx, t - s.start, t); ctx.restore(); }); };
reframe(1, WT('ingeniero') - .05, 'zoom', 1.4, 540, 900);
reframe(2, WT('mandaron') - .05, 'zoom', 1.3, 540, 640);
reframe(4, WT('timpanos') - .05, 'cut', 1.4, 540, 1100);
reframe(6, WT('nagasaki', 0, 6) - .05, 'zoom', 1.3, 540, 1200);
reframe(9, WT('unico') - .05, 'zoom', 1.3, 540, 1200);
reframe(2, 8.9, 'cut', 1.25, 540, 800);
reframe(3, WT('oficina') - .05, 'zoom', 1.3, 420, 1500);
reframe(10, WT('paso') - .05, 'zoom', 1.3, 540, 1100);
reframe(11, WT('destino') - .05, 'zoom', 1.25, 540, 1000);
reframe(0, WT('bombas') - .05, 'zoom', 1.3, 540, 1300);
reframe(2, WT('viaje') - .05, 'flash', 1.7, 700, 1350);
reframe(2, WT('hiroshima') - .05, 'zoom', 1.35, 400, 1000);
