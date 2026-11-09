// ---------- "¿Por qué casi todo cuesta 4,99 y no 5?" ----------
window.COVER = { t: .5, title: '¿Por qué todo cuesta *4,99* y no 5?' };

// 0 · hook: a $4.99 tag swings in, then $5.00 next to it
shot(0, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 1100, .8, 1);
  ctx.save(); cam(ctx, kf(lt, [[0, 1.4], [.6, 1, easeOut], [3.6, 1.05]]), 540, 1200, t, 1, 540, 1200);
  priceTag(ctx, 540, 1250, 1.05, '$4.99', { t, p: lt / .3 });
  priceTag(ctx, 800, 1650, .55, '$5.00', { t: t + 1, p: (t - WT('cinco')) / .3 });
  ctx.restore();
  hookTitle(ctx, lt, '¿Por qué todo cuesta *4,99* y no 5?', 1.7, 620);
});
// 1 · your brain reads left to right and keeps the first number
shot(1, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 1100, .6, 2);
  const tp = WT('primer');
  priceTag(ctx, 540, 1250, 1.1, '$4.99', { t, swing: .3, hi: clamp((t - tp) / .3) });
  const sx = kf(t, [[WT('izquierda'), 230], [WT('derecha') + .3, 880], [tp - .05, 880], [tp + .3, 420]]);
  glow(ctx, () => { ctx.beginPath(); ctx.moveTo(sx - 60, 1440); ctx.lineTo(sx + 60, 1440); }, C.gold, 8, 1);
  goldIcon(ctx, 'eye', sx, 700, .45, (t - WT('lee')) / .3, t);
  label(ctx, 'IZQUIERDA → DERECHA', 540, 1440, 540, 1560, (t - WT('izquierda')) / .4, C.gold, 26);
});
// 2 · you see a 4 and feel it cheaper
shot(2, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 1100, .6, 3);
  priceTag(ctx, 540, 1300, 1.25, '$4.99', { t, swing: .2, hi: 1, dim: clamp((t - WT('antes')) / .5) });
  pill(ctx, 'SE SIENTE BARATO', 540, 650, (t - WT('barato')) / .3, C.green, 40);
});
// 3 · only one cent apart
shot(3, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 1100, .6, 4);
  priceTag(ctx, 540, 900, .75, '$4.99', { t, swing: .3 }); priceTag(ctx, 540, 1450, .75, '$5.00', { t: t + 1.3, swing: .3 });
  chip(ctx, '1', 'centavo', 860, 1180, (t - WT('centavo')) / .3, C.gold, 70);
  dimLine(ctx, 760, 900, 760, 1450, '', clamp((t - WT('diferencia')) / .5), C.gold);
});
// 4 · the left-digit effect
shot(4, 'flash', (ctx, lt, t) => {
  background(ctx, t, 540, 1000, .8, 5);
  rays(ctx, 540, 1000, 800, t, 'rgba(255,200,120,');
  goldIcon(ctx, 'bulb', 540, 950, 1.1, lt / .35, t);
  pill(ctx, 'EFECTO DEL DÍGITO IZQUIERDO', 540, 1450, (t - WT('digito')) / .3, C.gold, 36);
});
// 5 · the dress experiment: $34 -> $39 sold a third more
shot(5, 'cut', (ctx, lt, t) => {
  background(ctx, t, 300, 1000, .6, 6);
  dress(ctx, 300, 1200, 1.1);
  const t39 = WT('$39');
  priceTag(ctx, 760, 1080, .55, t < t39 ? '$34' : '$39', { t, w: 420, col: t < t39 ? '#1d1a17' : '#c27a00' });
  bars(ctx, 650, 1650, [.55, .55 * (1 + .33 * clamp((t - WT('tercio')) / .5))], ['$34', '$39'], clamp((t - WT('vendio')) / .6), ['#8a8f99', C.green]);
  chip(ctx, '+⅓', 'ventas', 760, 640, (t - WT('tercio')) / .3, C.green, 70);
  if (t < WT('vestido')) pill(ctx, 'CATÁLOGO DE ROPA', 300, 640, (t - WT('catalogo')) / .3, C.ink, 28);
}, { punch: [WT('$39'), WT('tercio')], pc: [540, 1200] });
// 6 · but at $44: nothing changed
shot(6, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 1000, .6, 7);
  bars(ctx, 320, 1500, [.55, .73, .55], ['$34', '$39', '$44'], clamp(lt / .6), ['#8a8f99', C.green, '#8a8f99']);
  stamp(ctx, 'IGUAL', 760, 900, 90, C.red, (t - WT('nada')) / .25);
  goldIcon(ctx, 'question', 540, 760, .45, (t - WT('curioso')) / .3, t);
});
// 7 · the 9 screams "deal"
shot(7, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 1100, .9, 8);
  rays(ctx, 540, 1100, 900, t, 'rgba(255,90,90,');
  const k = backOut(clamp(lt / .35)); ctx.save(); ctx.translate(540, 1100); ctx.scale(k, k); ctx.shadowColor = 'rgba(255,200,90,.9)'; ctx.shadowBlur = 50; text(ctx, '9', 0, 0, 520, C.gold, 700); ctx.restore();
  stamp(ctx, 'OFERTA', 540, 1560, 100, C.red, (t - WT('oferta')) / .25);
});
// 8 · luxury shops do the opposite: round prices
shot(8, 'zoom', (ctx, lt, t) => {
  ctx.fillStyle = '#0b0a08'; ctx.fillRect(0, 0, W, H); bloom(ctx, 540, 1100, 900, 'rgba(255,200,110,', .35); dust(ctx, t, 50, 9);
  priceTag(ctx, 540, 1250, 1.1, '$100', { t, swing: .2, bg: '#1b1813', col: C.gold });
  pill(ctx, 'LUJO', 540, 640, (t - WT('lujo')) / .3, C.gold, 40);
  pill(ctx, 'REDONDO = CALIDAD', 540, 1600, (t - WT('redondos')) / .3, C.gold, 34);
});
// 9 · round up next time
shot(9, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 1100, .6, 10);
  const tr = WT('redondea'), up = t > tr + .2;
  priceTag(ctx, 540, 1250, 1.1, up ? '$5' : '$4.99', { t, swing: .3, col: up ? C.green : '#1d1a17' });
  glow(ctx, () => { ctx.beginPath(); ctx.moveTo(900, 1400); ctx.lineTo(900, 900); ctx.moveTo(860, 960); ctx.lineTo(900, 900); ctx.lineTo(940, 960); }, C.green, 10, clamp((t - tr) / .4));
  pill(ctx, 'REDONDEA ↑', 540, 1600, (t - tr) / .3, C.green, 40);
}, { punch: [WT('redondea')], pc: [540, 1200] });
// 10 · send it to that friend
shot(10, 'fade', (ctx, lt, t) => {
  background(ctx, t, 540, 1000, .5, 11);
  shareScene(ctx, lt, WT('amigo') - LINE(10), WT('ofertas') - LINE(10) + .1, (c, w, h) => {
    c.fillStyle = '#121418'; c.fillRect(0, 0, w, h); c.save(); c.translate(w / 2, h * .95); c.scale(.4, .4); priceTag(c, 0, 0, 1, '$4.99', { t }); c.restore();
    c.font = '600 22px Inter'; c.fillStyle = '#d8dbe0'; c.textAlign = 'center'; c.fillText('¿Por qué todo cuesta 4,99?', w / 2, 90);
  });
});
const P = (i, times, pc) => { SHOTS[i].punch = times; if (pc) SHOTS[i].pc = pc; };
P(1, [WT('cerebro'), WT('primer')], [540, 1200]);
P(2, [WT('cuatro', 0, 2), WT('barato')], [540, 1250]);
P(3, [WT('diferencia'), WT('centavo')], [540, 1200]);
P(6, [WT('curioso'), WT('$44'), WT('nada')], [540, 1200]);
P(8, [WT('lujo'), WT('redondos'), WT('calidad')], [540, 1200]);
const reframe = (i, tw, tr, z, cx, cy) => { const s = SHOTS[i]; shotAt(tw, tr, (ctx, lt, t) => { ctx.save(); ctx.translate(cx, cy); ctx.scale(z, z); ctx.translate(-cx, -cy); s.draw(ctx, t - s.start, t); ctx.restore(); }); };
reframe(2, WT('leer') - .05, 'zoom', 1.6, 470, 1300);
reframe(5, WT('vestido') - .05, 'zoom', 1.35, 300, 1150);
reframe(7, WT('aunque', 0, 7) - .05, 'cut', 1.4, 540, 1300);
reframe(8, WT('precios', 0, 8) - .05, 'zoom', 1.4, 540, 1250);
reframe(1, WT('derecha') - .05, 'zoom', 1.35, 540, 1250);
reframe(5, WT('$39') - .05, 'cut', 1.4, 760, 700);
reframe(5, WT('vendio') - .05, 'zoom', 1.25, 700, 900);
reframe(5, WT('catalogo') - .05, 'cut', 1.25, 300, 700);
