// ---------- "¿Por qué casi todos los aviones son blancos?" ----------
window.COVER = { t: .5, title: '¿Por qué los aviones son *blancos*?' };
const tarmac = (ctx, t, hor = 1350) => { const h = landscape(ctx, t, 'dia', { hor, sun: [850, 600], ground: 'ninguno' }); ctx.fillStyle = lin(ctx, 0, h, 0, H, [[0, '#6b6f76'], [1, '#2f3237']]); ctx.fillRect(0, h, W, H - h); for (let i = 0; i < 6; i++) { rrect(ctx, 80 + i * 180, h + 200, 100, 14, 4); ctx.fillStyle = 'rgba(255,230,120,.7)'; ctx.fill(); } return h; };

// 0 · hook: a white plane flies across the sky
shot(0, 'cut', (ctx, lt, t) => {
  landscape(ctx, t, 'dia', { hor: 1700, sun: [850, 600], ground: 'ninguno' });
  ctx.save(); cam(ctx, kf(lt, [[0, 1.4], [.6, 1, easeOut], [2.6, 1.06]]), 540, 1250, t, 1, 540, 1250);
  plane(ctx, kf(lt, [[0, -300], [.8, 400, easeOut], [2.7, 700]]), 1250, .95, { tilt: -.04 });
  ctx.restore();
  hookTitle(ctx, lt, '¿Por qué los aviones son *blancos*?', 1.6, 720);
});
// 1 · not for style: at least four reasons
shot(1, 'zoom', (ctx, lt, t) => {
  landscape(ctx, t, 'dia', { hor: 1700, sun: [850, 600], ground: 'ninguno' });
  const k = clamp((t - WT('estilo')) / .3);
  plane(ctx, 540, 1200, .85, { body: '#e65f8e', tail: '#7a3fd0', stripe: '#ffd34d' });
  stamp(ctx, 'NO ES ESTILO', 540, 1200, 80, C.red, k);
  dots(ctx, 4, clamp((t - WT('cuatro')) / .6) * 4, 540, 700, 110, 40);
});
// 2 · one: white reflects the sun; a parked plane heats much less
shot(2, 'cut', (ctx, lt, t) => {
  const h = tarmac(ctx, t, 1150);
  rays(ctx, 850, 600, 900, t, 'rgba(255,220,120,');
  plane(ctx, 300, h + 160, .5, {}); plane(ctx, 780, h + 420, .5, { body: '#2b2f38', tail: '#2b2f38' });
  thermometer(ctx, 300, h - 60, .7, .3, C.cyan); thermometer(ctx, 780, h + 200, .7, clamp((t - WT('calienta')) / .8) * .6 + .3, C.red);
  dots(ctx, 4, 1, 540, 640, 110, 34);
  pill(ctx, 'REFLEJA', 300, 1700, (t - WT('refleja')) / .3, C.gold, 34);
});
// 3 · two: cracks, dents and oil leaks show up on white
shot(3, 'zoom', (ctx, lt, t) => {
  tarmac(ctx, t, 1500);
  ctx.save(); cam(ctx, 2.2, 140, 0, t, .5, 540, 1150); plane(ctx, 0, 0, 1, { crack: clamp((t - WT('grietas')) / .4), drip: clamp((t - WT('fugas')) / .8) }); ctx.restore();
  dots(ctx, 4, 2, 540, 640, 110, 34);
  pill(ctx, 'GRIETAS', 300, 1700, (t - WT('grietas')) / .3, C.red, 30); pill(ctx, 'FUGAS', 780, 1700, (t - WT('fugas')) / .3, C.red, 30);
});
// 4 · three: paint is heavy — hundreds of kilos, more coats for bright colours
shot(4, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 1200, .6, 4);
  dots(ctx, 4, 3, 540, 640, 110, 34);
  const n = Math.min(6, 1 + Math.floor(clamp((t - WT('pintar')) / 2) * 6));
  const cols = ['#f4f6f8', '#e65f8e', '#ffd34d', '#4f7cff', '#2fa37a', '#d83a3a'];
  for (let i = 0; i < n; i++) bucket(ctx, 240 + (i % 3) * 300, 1450 - Math.floor(i / 3) * 230, .9, cols[i]);
  chip(ctx, 'cientos', 'de kg', 540, 900, (t - WT('cientos')) / .3, C.gold, 70);
  pill(ctx, 'MÁS CAPAS', 540, 1700, (t - WT('capas')) / .3, C.ink, 32);
});
// 5 · more weight = more fuel each flight
shot(5, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 1200, .6, 5);
  fuelGauge(ctx, 540, 1150, 280, lerp(.9, .35, clamp((t - WT('combustible')) / 1.2)));
  pill(ctx, '+ PESO = + COMBUSTIBLE', 540, 1600, (t - WT('combustible')) / .3, C.amber, 34);
});
// 6 · four: colours fade, repainting costs a lot and grounds the plane for days
shot(6, 'cut', (ctx, lt, t) => {
  const h = tarmac(ctx, t, 1250);
  const f = clamp((t - WT('destinen')) / 1.4);
  plane(ctx, 540, h + 260, .85, { body: lerpCol('#e65f8e', '#e9cfd6', f), tail: lerpCol('#7a3fd0', '#c9bde0', f) });
  dots(ctx, 4, 4, 540, 640, 110, 34);
  calendar(ctx, 840, 900, .55, 'EN TALLER', 'DÍAS', (t - WT('dias')) / .3);
  stamp(ctx, 'SIN VOLAR', 360, 900, 70, C.red, (t - WT('volar')) / .25);
});
// 7 · planes are leased and resold: a white one only needs a new logo
shot(7, 'zoom', (ctx, lt, t) => {
  const h = tarmac(ctx, t, 1250);
  const sw = t > WT('logo') - .1;
  plane(ctx, 540, h + 260, .85, { tail: sw ? '#2f63d6' : '#d83a3a', logo: sw ? 'B' : 'A' });
  pill(ctx, 'SE REVENDEN', 540, 800, (t - WT('revenden')) / .3, C.gold, 36);
  pill(ctx, 'SOLO CAMBIAS EL LOGO', 540, 1700, (t - WT('logo')) / .3, C.green, 32);
});
// 8 · that's why airlines only paint the tail
shot(8, 'cut', (ctx, lt, t) => {
  landscape(ctx, t, 'atardecer', { hor: 1700, sun: [300, 1300], ground: 'ninguno' });
  ctx.save(); cam(ctx, kf(lt, [[0, 1], [2.5, 1.5]]), 220, 1050, t, .5, 540, 1100); plane(ctx, 540, 1150, 1, { tail: '#ffb000' }); ctx.restore();
  pill(ctx, 'EL COLOR, EN LA COLA', 540, 800, (t - WT('cola')) / .3, C.gold, 36);
});
// 9 · which one didn't you know? comment the number
shot(9, 'fade', (ctx, lt, t) => {
  landscape(ctx, t, 'dia', { hor: 1700, sun: [850, 600], ground: 'ninguno' });
  plane(ctx, kf(lt, [[0, 300], [2.5, 760]]), 1450, .6, {});
  ['1', '2', '3', '4'].forEach((n, i) => pill(ctx, n, 240 + i * 200, 900, (t - WT('cual') - i * .12) / .3, C.ink, 70));
  bubble(ctx, 540, 1150, t, (t - WT('comenta')) / .3);
});
const reframe = (i, tw, tr, z, cx, cy) => { const s = SHOTS[i]; shotAt(tw, tr, (ctx, lt, t) => { ctx.save(); ctx.translate(cx, cy); ctx.scale(z, z); ctx.translate(-cx, -cy); s.draw(ctx, t - s.start, t); ctx.restore(); }); };
reframe(2, WT('avion') - .05, 'zoom', 1.3, 780, 640);
reframe(3, WT('golpes') - .05, 'cut', 1.3, 540, 640);
reframe(4, WT('colores') - .05, 'zoom', 1.3, 540, 900);
reframe(6, WT('repintar') - .05, 'zoom', 1.3, 540, 640);
reframe(7, WT('blanco', 0, 7) - .05, 'cut', 1.35, 300, 1450);
reframe(6, WT('dias') - .05, 'cut', 1.5, 700, 900);
reframe(7, WT('alquilan') - .05, 'cut', 1.3, 540, 800);
reframe(8, WT('color', 0, 8) - .05, 'zoom', 1.3, 540, 800);
reframe(9, WT('comenta') - .05, 'zoom', 1.25, 540, 900);
reframe(1, WT('hay') - .05, 'zoom', 1.3, 540, 700);
reframe(4, WT('pintar') - .05, 'cut', 1.3, 540, 760);
reframe(4, WT('cientos') - .05, 'zoom', 1.4, 540, 900);
reframe(6, WT('sol', 0, 6) - .05, 'cut', 1.3, 540, 1400);
