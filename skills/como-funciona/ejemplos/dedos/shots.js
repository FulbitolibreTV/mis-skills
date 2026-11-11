// ---------- «¿Por qué se te arrugan los dedos en el agua?» ----------
window.THEME = 'piel';
window.COVER = { t: 1.3, title: '¿Por qué se te arrugan los *dedos*?' };
const WRINKLE = (t, t0, d = 1.2) => easeOut(clamp((t - t0) / d));

// 0 · hook: a giant fingertip under water wrinkling before our eyes
shot(0, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 900, .6, 1);
  ctx.save(); cam(ctx, kf(lt, [[0, 1.9], [.7, 1.15, easeOut], [3, 1.22]]), 540, 1000, t, 1, 540, 1000);
  fingerUp(ctx, 540, 560, 1.15, t, WRINKLE(lt, .2, 1.6)); water(ctx, t, 760, 1);
  ctx.restore();
  if (!window.__cov) hookTitle(ctx, lt, '¿Por qué se te arrugan los *dedos*?', 1.9, 1250, 88);
});
// 0b · ...but the arms don't: side by side
shotAt(WT('pero') - .05, 'flash', (ctx, lt, t) => {
  background(ctx, t, 540, 960, .5, 2);
  ctx.save(); cam(ctx, 1, 540, 960, t, 1);
  fingerUp(ctx, 290, 620, .8, t, 1); armPatch(ctx, 590, 560, 400, 1100, t);
  water(ctx, t, 820, .9);
  ctx.restore();
  pill(ctx, 'DEDO: ARRUGADO', 290, 1540, lt / .3, C.ink, 34);
  pill(ctx, 'BRAZO: LISO', 790, 1540, (t - WT('brazos')) / .3, C.cyan, 34);
}, { punch: [WT('brazos')], pc: [540, 1000] });
// 1 · the myth: the skin soaks up water and swells
shot(1, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 900, .4, 3);
  ctx.save(); cam(ctx, kf(lt, [[0, 1.1], [4, 1.2]]), 540, 900, t, 1);
  section(ctx, t, { soak: 1, vr: 1 });
  ctx.restore();
  label(ctx, 'PIEL', 300, 700, 300, 540, (t - WT('piel')) / .4, C.ink, 32);
  pill(ctx, '¿ABSORBE AGUA?', 650, 540, (t - WT('absorbe')) / .3, '#7cc4ff', 36);
  stamp(ctx, 'FALSO', 540, 1150, 110, C.red, (t - WT('eso')) / .25);
}, { punch: [WT('absorbe'), WT('eso')], pc: [540, 900] });
// 2 · ninety years ago: with the nerve cut, the finger never wrinkles
shot(2, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 960, .5, 4);
  const cut = clamp((t - WT('cortado')) / .3);
  ctx.save(); cam(ctx, kf(lt, [[0, 1.05], [6, 1.14]]), 540, 1000, t, 1);
  fingerUp(ctx, 300, 640, .78, t, WRINKLE(t, WT('nervio'), 1.4), { nerve: 1 });
  fingerUp(ctx, 780, 640, .78, t, 0, { nerve: 1, cut });
  water(ctx, t, 900, .85);
  ctx.restore();
  chip(ctx, '1935', 'aprox.', 540, 600, lt / .35, C.gold, 70);
  label(ctx, 'NERVIO', 300, 1250, 300, 1560, (t - WT('nervio')) / .4, C.gold, 32);
  pill(ctx, 'NERVIO CORTADO', 780, 1560, (t - WT('cortado')) / .3, C.red, 30);
  pill(ctx, 'NO SE ARRUGA', 780, 1460, (t - WT('arruga')) / .3, C.ink, 30);
}, { punch: [WT('raro'), WT('cortado')], pc: [540, 1000] });
// 3 · it's your nervous system: brain -> spinal cord -> hand, signals flowing down
shot(3, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 900, .5, 5);
  const k = clamp((t - WT('sistema')) / .4);
  brain(ctx, 540, 640, 1.25, t, .3 + .7 * k);
  const path = () => { ctx.beginPath(); ctx.moveTo(580, 830); ctx.bezierCurveTo(600, 1050, 420, 1150, 470, 1350); ctx.lineTo(520, 1560); };
  glow(ctx, path, C.gold, 6, .5 + .5 * k);
  for (let i = 0; i < 4; i++) { const u = (t * .9 + i * .25) % 1, y = lerp(830, 1560, u), x = lerp(580, 520, u) + Math.sin(u * 3.2) * -90; bloom(ctx, x, y, 70, 'rgba(255,210,100,', .9 * k); }
  ctx.save(); ctx.translate(520, 1600); ctx.scale(.45, .45); fingerUp(ctx, 0, 0, 1, t, k); ctx.restore();
  stamp(ctx, 'NO ES EL AGUA', 540, 1080, 52, '#7cc4ff', (t - WT('agua', 0, 3)) / .25, .08);
  pill(ctx, 'SISTEMA NERVIOSO', 540, 520, (t - WT('sistema')) / .3, C.gold, 40);
}, { punch: [WT('sistema')], pc: [540, 900] });
// 4 · zoom through the fingertip: minutes later, nerves close the blood vessels
shot(4, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 900, .4, 6);
  const z = kf(lt, [[0, 1], [.9, 5.5, easeIn]]);
  if (lt < .9) { ctx.save(); cam(ctx, z, 540, 900, t, .4); fingerUp(ctx, 540, 600, 1.1, t, 0); ctx.restore(); ctx.fillStyle = `rgba(242,193,168,${clamp((lt - .6) / .3)})`; ctx.fillRect(0, 0, W, H); return; }
  const vr = lerp(1, .35, easeOut(clamp((t - WT('cierran')) / 1.2)));
  ctx.save(); cam(ctx, kf(lt, [[.9, 1.25], [2, 1.05, easeOut], [6, 1.1]]), 540, 1100, t, 1, 540, 1100);
  section(ctx, t, { vr, nerve: 1, signal: clamp((t - WT('nervios')) / .4) });
  ctx.restore();
  pill(ctx, 'A LOS POCOS MINUTOS', 540, 530, (t - WT('minutos')) / .3, C.ink, 32);
  label(ctx, 'VASOS DE SANGRE', 820, 980, 760, 1650, (t - WT('vasos')) / .4, C.red, 30);
  label(ctx, 'NERVIO', 760, 900, 820, 760, (t - WT('nervios')) / .4, C.gold, 30);
}, { punch: [WT('cierran'), WT('yemas')], pc: [540, 1100] });
// 5 · the pad loses volume and the skin, stuck underneath, folds
shot(5, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 900, .4, 7);
  const f = easeOut(clamp((t - WT('volumen')) / 2.2)), f2 = Math.max(f * .7, easeOut(clamp((t - WT('pliega')) / .5)));
  ctx.save(); cam(ctx, kf(lt, [[0, 1.05], [5, 1.15]]), 540, 1000, t, 1);
  section(ctx, t, { vr: .35, fold: f2, nerve: .5 });
  ctx.restore();
  pill(ctx, 'PIERDE VOLUMEN', 540, 540, (t - WT('volumen')) / .3, C.cyan, 38);
  label(ctx, 'PIEL PEGADA ABAJO', 380, 820, 380, 1500, (t - WT('pegada')) / .4, C.ink, 30);
  pill(ctx, 'SE PLIEGA', 760, 1650, (t - WT('pliega')) / .3, C.gold, 40);
}, { punch: [WT('pliega')], pc: [540, 900] });
// 6 · the open loop: but why?
shot(6, 'flash', (ctx, lt, t) => {
  background(ctx, t, 540, 960, .6, 8);
  ctx.save(); ctx.globalAlpha = .45; cam(ctx, 1.05, 540, 1000, t, 1); fingerUp(ctx, 540, 700, 1, t, 1); ctx.restore();
  rays(ctx, 540, 1000, 700, t, 'rgba(255,220,140,');
  goldIcon(ctx, 'question', 540, 1000, 1.3, (t - WT('para')) / .4, t);
}, { punch: [WT('curioso')], pc: [540, 1000] });
// 7 · like a tyre tread: channels push the water out so you grip better
shot(7, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 960, .5, 9);
  const k = clamp((t - WT('llanta')) / .4), fl = clamp((t - WT('sacan')) / .4);
  ctx.save(); cam(ctx, kf(lt, [[0, 1.1], [5, 1.18]]), 540, 1050, t, 1);
  tread(ctx, 90, 620, 400, 900, t, fl);
  fingerUp(ctx, 790, 640, .78, t, 1);
  if (fl > 0) for (let i = 0; i < 9; i++) { const u = (t * 1.1 + i * .17) % 1, side = i % 2 ? 1 : -1, x = 790 + side * u * 170, y = 820 + (i % 4) * 80 + u * 40; circle(ctx, x, y, 11); ctx.fillStyle = `rgba(120,200,255,${fl * (1 - u)})`; ctx.fill(); }
  ctx.restore();
  pill(ctx, 'LLANTA', 290, 1650, k, C.ink, 34);
  pill(ctx, 'TU DEDO', 790, 1650, (t - WT('llanta') - .3) / .3, C.ink, 34);
  pill(ctx, 'AGARRAS MEJOR', 540, 1520, (t - WT('agarras')) / .3, C.green, 40);
}, { punch: [WT('dibujo'), WT('agarras')], pc: [540, 1050] });
// 8 · the study: moving wet marbles, 12% faster
shot(8, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 960, .5, 10);
  const n = Math.min(8, Math.floor(clamp((t - WT('canicas')) / 2) * 8));
  bowl(ctx, 290, 760, 200, t, 8 - n, 1); bowl(ctx, 790, 760, 200, t, n, 3);
  // a marble flying from one bowl to the other
  const u = ((t - WT('canicas')) * 4) % 1;
  if (t > WT('canicas') && n < 8) marble(ctx, lerp(290, 790, u), 700 - Math.sin(u * Math.PI) * 180, 24, '#5b8cff');
  stopwatch(ctx, 540, 560, 70, t, t > WT('canicas') ? 1 : 0);
  const pb = clamp((t - WT('12')) / .5);
  bars(ctx, 260, 1500, [1, .88], ['LISOS', 'ARRUG.'], pb, ['#8a8f99', C.gold]);
  readout(ctx, '12 %', 'más rápido', 800, 1300, 80, (t - WT('12')) / .4, C.gold);
}, { punch: [WT('arrugados'), WT('12')], pc: [540, 1150] });
// 9 · send it
shot(9, 'fade', (ctx, lt, t) => {
  background(ctx, t, 540, 960, .4, 11);
  shareScene(ctx, lt, WT('amigo') - LINE(9), WT('ducha') - LINE(9) + .2, (c, w, h) => {
    c.fillStyle = '#e2ae93'; c.fillRect(0, 0, w, h); c.save(); c.translate(w / 2, h * .25); c.scale(.5, .5); fingerUp(c, 0, 0, 1, t, 1); c.restore();
    c.font = '600 22px Inter'; c.fillStyle = '#2a1c18'; c.textAlign = 'center'; c.fillText('¿Por qué se arrugan los dedos?', w / 2, 60);
  });
}, { capY: 330 });

// extra punches so no stretch stays still
const PU = (i, times) => { SHOTS[i].punch = (SHOTS[i].punch || []).concat(times); };
PU(6, [WT('volumen')]);
PU(7, [WT('para')]);
PU(3, [WT('medicos')]);
PU(6, [WT('piel', 0, 5)]);
// the cover already prints the question: hide the hook title while it renders
window.addEventListener('load', () => { const rc = window.renderCover; window.renderCover = () => { window.__cov = 1; rc(); window.__cov = 0; }; });
