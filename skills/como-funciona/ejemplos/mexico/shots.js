// ---------- "Cómo México perdió la mitad de su territorio" (modo fotos reales) ----------
window.IMAGES = {}; ['oro', 'sutter', 'alamo', 'santaanna', 'sanjacinto', 'chapultepec', 'ninos', 'tratado', 'mapa2', 'mapa3', 'bandera', 'rio'].forEach(k => window.IMAGES[k] = 'img/' + k + '.jpg');
window.COVER = { t: .5, title: 'Así perdió México *la mitad* de su territorio' };
const dark = (ctx, k = .55) => { ctx.fillStyle = `rgba(0,0,0,${k})`; ctx.fillRect(0, 0, W, H); };

// 0 · hook: gold, 9 days
shot(0, 'cut', (ctx, lt, t) => {
  photoBg(ctx, 'oro', lt, { z0: 1.3, z1: 1.05, dur: 2.5, dark: .35 });
  hookTitle(ctx, lt, 'Así perdió México *la mitad* de su territorio', 2.2, 900, 90);
  chip(ctx, '9', 'días antes', 540, 1350, (t - WT('nueve')) / .3 * (lt > 2.2 ? 1 : 0), C.gold, 120);
});
shotAt(WT('alguien') - .05, 'cut', (ctx, lt, t) => {
  photoBg(ctx, 'sutter', lt, { dark: .4, tint: 'gold', tintK: .45 });
  pill(ctx, 'CALIFORNIA, 1848', 540, 760, lt / .3, C.gold, 44);
  stamp(ctx, 'ORO', 540, 1250, 150, C.gold, (t - WT('oro')) / .25);
  pill(ctx, 'MÉXICO NO LO SABÍA', 540, 1500, (t - WT('sabia')) / .3, C.red, 38);
});
// 1 · 1821: Mexico was huge
shot(1, 'zoom', (ctx, lt, t) => {
  photoBg(ctx, 'bandera', lt, { blur: 8, dark: .7 });
  photoCard(ctx, 'mapa3', 540, 1080, 900, lt / .4, { h: 820, focus: [.3, .3], zoom: 1.25, rot: -.02, label: 'MÉXICO EN 1824', col: '#0f7a3a' });
  ['texas', 'california', 'nevada', 'utah', 'arizona', 'nuevo'].forEach((w, i) => pill(ctx, ['TEXAS', 'CALIFORNIA', 'NEVADA', 'UTAH', 'ARIZONA', 'NUEVO MÉXICO'][i], 230 + (i % 3) * 310, 1620 + Math.floor(i / 3) * 110, (t - WT(w, 0, 1)) / .25, C.ink, 34));
});
// 2 · settlers invited to Texas, became the majority
shot(2, 'cut', (ctx, lt, t) => {
  photoBg(ctx, 'rio', lt, { dark: .45 });
  const n = Math.round(clamp((t - WT('colonos')) / 2.4) * 14);
  for (let i = 0; i < n; i++) figure(ctx, 90 + (i % 7) * 150, 1500 + Math.floor(i / 7) * 260, .45, { silhouette: true, arms: 'down' });
  pill(ctx, 'COLONOS DE EE. UU.', 540, 760, (t - WT('colonos')) / .3, C.blue, 42);
  stamp(ctx, 'MAYORÍA', 540, 1000, 96, C.red, (t - WT('mayoria')) / .25);
});
// 3 · 1836 Texas rebels; Mexico wins at the Alamo
shot(3, 'zoom', (ctx, lt, t) => {
  photoBg(ctx, 'alamo', lt, { dark: .4, focus: [.5, .6] });
  pill(ctx, '1836', 540, 760, lt / .3, C.gold, 60);
  stamp(ctx, 'REBELIÓN', 540, 980, 90, C.red, (t - WT('rebelo')) / .25);
  pill(ctx, 'MÉXICO GANA EN EL ÁLAMO', 540, 1580, (t - WT('alamo')) / .3, '#0f7a3a', 40);
});
// 4 · San Jacinto: Santa Anna captured, signs the withdrawal
shot(4, 'cut', (ctx, lt, t) => {
  photoBg(ctx, 'sanjacinto', lt, { dark: .55, focus: [.5, .5] });
  photoCard(ctx, 'santaanna', 540, 1120, 460, lt / .4, { label: 'SANTA ANNA', col: '#0f7a3a', focus: [.5, .15], gray: clamp((t - WT('capturado')) / .5) * .8 });
  stamp(ctx, 'CAPTURADO', 540, 1180, 96, C.red, (t - WT('capturado')) / .25);
  docSheet(ctx, 820, 1560, .5, 'RETIRADA', (t - WT('firmo')) / .35, { seal: true, rot: .08 });
});
// 5 · 1845 annexation; the border fight (Nueces vs Bravo)
shot(5, 'zoom', (ctx, lt, t) => {
  photoBg(ctx, 'rio', lt, { dark: .45, tint: 'blue', tintK: .5, focus: [.4, .5] });
  chip(ctx, '1845', '', 540, 800, lt / .3, C.gold, 110);
  stamp(ctx, 'ANEXIÓN', 540, 1000, 96, C.blue, (t - WT('anexo')) / .25);
  pill(ctx, 'RÍO NUECES', 300, 1450, (t - WT('frontera')) / .3, '#0f7a3a', 38);
  pill(ctx, 'RÍO BRAVO', 780, 1450, (t - WT('frontera') - .25) / .3, C.blue, 38);
  goldIcon(ctx, 'question', 540, 1450, .45, clamp((t - WT('frontera') - .4) / .4), t);
});
// 6 · 1846 war; US army reaches Mexico City
shot(6, 'cut', (ctx, lt, t) => {
  photoBg(ctx, 'chapultepec', lt, { dark: .4, tint: 'red', tintK: .35, z0: 1.15, z1: 1.35, focus: [.55, .5] });
  pill(ctx, '1846', 540, 760, lt / .3, C.gold, 60);
  stamp(ctx, 'GUERRA', 540, 1000, 130, C.red, (t - WT('guerra')) / .25);
  pill(ctx, 'HASTA LA CIUDAD DE MÉXICO', 540, 1580, (t - WT('ciudad', 0, 6)) / .3, C.ink, 38);
});
// 7 · Chapultepec, the Niños Héroes, Sept 1847
shot(7, 'zoom', (ctx, lt, t) => {
  photoBg(ctx, 'ninos', lt, { dark: .35, focus: [.5, .4] });
  pill(ctx, 'NIÑOS HÉROES', 540, 780, (t - WT('ninos')) / .3, C.gold, 56);
  calendar(ctx, 540, 1450, .6, 'SEPTIEMBRE', '1847', (t - WT('septiembre')) / .3);
});
// 8 · Feb 2 1848: Treaty of Guadalupe Hidalgo
shot(8, 'cut', (ctx, lt, t) => {
  photoBg(ctx, 'tratado', lt, { dark: .5, focus: [.6, .5] });
  calendar(ctx, 300, 820, .55, 'FEBRERO 1848', '2', lt / .3);
  docSheet(ctx, 600, 1250, .95, 'TRATADO', (t - WT('tratado')) / .35, { header: 'GUADALUPE HIDALGO', seal: true, rot: .03 });
});
// 9 · more than half the territory, for 15 million dollars
shot(9, 'zoom', (ctx, lt, t) => {
  photoBg(ctx, 'bandera', lt, { blur: 8, dark: .75 });
  photoCard(ctx, 'mapa2', 540, 1000, 920, lt / .4, { h: 640, focus: [.4, .5], label: 'LO QUE PERDIÓ (1848)', col: C.red, rot: .02 });
  chip(ctx, '+50 %', 'del territorio', 540, 1460, (t - WT('mitad')) / .3, C.red, 110);
  chip(ctx, '$15', 'millones', 540, 1640, (t - WT('dolares')) / .3, C.green, 80);
});
// 10 · the gold was worth far more
shot(10, 'cut', (ctx, lt, t) => {
  photoBg(ctx, 'oro', lt, { dark: .35, z0: 1.05, z1: 1.3 });
  photoCard(ctx, 'sutter', 300, 1350, 360, lt / .4, { label: '9 DÍAS ANTES', col: C.gold, rot: -.08, h: 300, focus: [.5, .5] });
  stamp(ctx, 'MUCHÍSIMO MÁS', 600, 900, 84, C.gold, (t - WT('muchisimo')) / .25);
});
// 11 · comment your state
shot(11, 'fade', (ctx, lt, t) => {
  photoBg(ctx, 'bandera', lt, { dark: .45, focus: [.5, .3] });
  pill(ctx, '¿DE QUÉ ESTADO ERES?', 540, 820, (t - WT('comenta')) / .3, C.gold, 52);
  bubble(ctx, 540, 1060, t, (t - WT('estado')) / .3);
});
const reframe = (i, tw, tr, z, cx, cy) => { const s = SHOTS[i]; shotAt(tw, tr, (ctx, lt, t) => { ctx.save(); ctx.translate(cx, cy); ctx.scale(z, z); ctx.translate(-cx, -cy); s.draw(ctx, t - s.start, t); ctx.restore(); }); };
reframe(2, WT('texas') - .05, 'zoom', 1.25, 480, 900);
reframe(2, WT('nevada') - .05, 'cut', 1.12, 540, 1000);
reframe(2, WT('arizona') - .05, 'zoom', 1.2, 540, 1500);
reframe(6, WT('discutio') - .05, 'zoom', 1.25, 540, 1400);
reframe(7, WT('ejercito') - .05, 'zoom', 1.3, 600, 1300);
reframe(7, WT('ciudad', 0, 6) - .05, 'cut', 1.2, 540, 1500);
reframe(10, WT('cambio') - .05, 'zoom', 1.1, 540, 1400);
reframe(10, WT('dolares') - .05, 'cut', 1.12, 540, 1640);
