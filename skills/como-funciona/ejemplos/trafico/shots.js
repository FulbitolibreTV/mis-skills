// ---------- "¿Cómo se forma el tráfico si no pasó nada?" (atasco fantasma) ----------
window.COVER = { t: .5, title: '¿Por qué hay *tráfico* si no pasó nada?' };
// a row of cars on the highway; brakeAt(i) = time car i hits the brakes (wave going backwards)
const row = (ctx, t, y, x0, gap, n, s, brakeAt = () => 1e9, stopAt = () => 1e9) => {
  for (let i = 0; i < n; i++) { const b = clamp((t - brakeAt(i)) / .2), st = clamp((t - stopAt(i)) / .3); car(ctx, x0 - i * gap + st * 30, y, s, CAR_COLS[i % CAR_COLS.length], b); }
};

// 0 · hook: endless jam at dusk, nothing ahead
shot(0, 'cut', (ctx, lt, t) => {
  const y = highway(ctx, t, 1500);
  ctx.save(); cam(ctx, kf(lt, [[0, 1.5], [.8, 1, easeOut], [4.2, 1.06]]), 540, 1400, t, 1, 540, 1400);
  row(ctx, t, y + 60, 1000 + Math.sin(lt * 1.5) * 12, 330, 6, .5, i => (i % 2 ? .3 + i * .25 : 0));
  ctx.restore();
  hookTitle(ctx, lt, '¿Por qué hay *tráfico* si no pasó nada?', 1.8, 760, 92);
  stamp(ctx, 'NI ACCIDENTE', 540, 900, 64, C.red, (t - WT('accidente')) / .25);
  stamp(ctx, 'NI OBRAS', 540, 1050, 64, C.red, (t - WT('obras')) / .25, .1);
  stamp(ctx, 'NI SEMÁFORO', 540, 1200, 64, C.red, (t - WT('semaforo')) / .25);
});
// 1 · it's called a phantom jam; it starts with one tap of the brakes
shot(1, 'zoom', (ctx, lt, t) => {
  const y = highway(ctx, t, 1450);
  car(ctx, 540, y + 60, .9, '#4f8cff', t > WT('frenazo') ? 1 : 0);
  pill(ctx, 'ATASCO FANTASMA', 540, 800, (t - WT('fantasma')) / .3, C.gold, 52);
  goldIcon(ctx, 'question', 540, 1050, .7, clamp((t - WT('fantasma')) / .4), t);
});
// 2 · one driver brakes a bit; the one behind brakes a bit MORE
shot(2, 'cut', (ctx, lt, t) => {
  const y = highway(ctx, t, 1450);
  const t1 = WT('frena'), t2 = WT('mas', 0, 2);
  car(ctx, 820, y + 60, .55, CAR_COLS[0], t > t1 ? 1 : 0); car(ctx, 330, y + 60, .55, CAR_COLS[1], t > WT('atras') ? 1 : 0);
  chip(ctx, '-5', 'km/h', 820, 1050, (t - t1) / .3, C.amber, 70);
  chip(ctx, '-10', 'km/h', 330, 1050, (t - t2) / .3, C.red, 70);
});
// 3 · and the next, more... until 100 cars back someone stops
shot(3, 'zoom', (ctx, lt, t) => {
  const y = highway(ctx, t, 1400);
  ctx.save(); cam(ctx, kf(lt, [[0, 1], [3.5, .55, ease]]), 540, y, t, .3, 540, y);
  row(ctx, t, y + 60, 1000, 330, 12, .5, i => LINE(3) + .2 + i * .3, i => (i > 7 ? WT('parado') - .3 + (i - 8) * .1 : 1e9));
  ctx.restore();
  chip(ctx, '100', 'coches atrás', 540, 820, (t - WT('cien')) / .3, C.gold, 90);
  stamp(ctx, 'PARADO', 540, 1050, 90, C.red, (t - WT('parado')) / .25);
});
// 4 · Japan tested it: 22 cars on a circle, no traffic lights
shot(4, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 1150, .4, 4);
  ring(ctx, 540, 1250, 360, lt * 3, t);
  pill(ctx, 'JAPÓN, 2008', 540, 700, (t - WT('japon')) / .3, C.gold, 44);
  chip(ctx, '22', 'coches', 540, 1250, (t - WT('veintidos')) / .3, C.ink, 90);
});
// 5 · same speed for everyone... and a jam appears on its own (sped up)
shot(5, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 1150, .4, 5);
  const k = clamp((t - WT('pocos')) / 2.4);
  ring(ctx, 540, 1250, 360, 15 + lt * 3 + k * 110, t);
  pill(ctx, 'MISMA VELOCIDAD', 540, 700, (t - WT('misma')) / .3, C.green, 40);
  if (k > 0 && k < 1) pill(ctx, 'CÁMARA RÁPIDA', 540, 1250, 1, C.dim, 30);
  pill(ctx, 'ATASCO', 540, 1250, (t - WT('atasco', 0, 5) - .4) / .3, C.red, 50);
});
// 6 · the jam travels BACKWARDS at ~20 km/h
shot(6, 'cut', (ctx, lt, t) => {
  background(ctx, t, 540, 1150, .4, 6);
  const s = 160 + lt * 4; ring(ctx, 540, 1250, 360, s, t);
  const a = jamAngle(s); ctx.save(); ctx.translate(540 + Math.cos(a) * 480, 1250 + Math.sin(a) * 480); ctx.rotate(a - Math.PI / 2);
  line(ctx, -60, 0, 60, 0, 14, C.gold); ctx.beginPath(); ctx.moveTo(90, 0); ctx.lineTo(50, -30); ctx.lineTo(50, 30); ctx.closePath(); ctx.fillStyle = C.gold; ctx.fill(); ctx.restore();
  pill(ctx, 'HACIA ATRÁS', 540, 700, (t - WT('atras', 0, 6)) / .3, C.gold, 48);
  chip(ctx, '~20', 'km/h', 540, 1250, (t - WT('veinte')) / .3, C.amber, 90);
});
// 7 · that's why when you get out, there's nothing there
shot(7, 'zoom', (ctx, lt, t) => {
  const y = highway(ctx, t, 1450);
  car(ctx, kf(lt, [[0, 300], [3, 900, easeIn]]), y + 60, .6, CAR_COLS[3]);
  goldIcon(ctx, 'question', 380, 1000, .8, clamp((t - WT('nada')) / .4), t);
  pill(ctx, 'NADA', 700, 1000, (t - WT('nada')) / .3, C.ink, 70);
});
// 8 · how to help: leave space, don't brake hard
shot(8, 'cut', (ctx, lt, t) => {
  const y = highway(ctx, t, 1450);
  const g = clamp((t - WT('espacio')) / .8);
  car(ctx, 800, y + 60, .45, CAR_COLS[0]); car(ctx, lerp(500, 260, g), y + 60, .45, CAR_COLS[2]);
  if (g > 0) { line(ctx, lerp(500, 260, g) + 160, y - 60, 640, y - 60, 8, C.green); pill(ctx, 'ESPACIO', lerp(570, 450, g), y - 140, g, C.green, 40); }
  stamp(ctx, 'SIN FRENAZOS', 540, 900, 70, C.red, (t - WT('golpe')) / .25);
});
// 9 · steady speed absorbs the wave; the jam dissolves
shot(9, 'zoom', (ctx, lt, t) => {
  const y = highway(ctx, t, 1450);
  for (let i = 0; i < 5; i++) car(ctx, 1000 - i * 260 + ((lt * 120) % 260), y + 60, .35, CAR_COLS[i]);
  pill(ctx, 'VELOCIDAD CONSTANTE', 540, 800, (t - WT('constante')) / .3, C.green, 40);
  stamp(ctx, 'SE DESHACE', 540, 1050, 80, C.green, (t - WT('deshace')) / .25);
});
// 10 · send it to that friend who tailgates
shot(10, 'fade', (ctx, lt, t) => {
  const y = highway(ctx, t, 1500);
  car(ctx, 760, y + 60, .5, CAR_COLS[5], t > WT('pegado') ? 1 : 0); car(ctx, kf(lt, [[0, 300], [3, 440, easeOut]]), y + 60, .5, CAR_COLS[1]);
  pill(ctx, 'ENVÍASELO', 540, 800, (t - WT('enviaselo')) / .3, C.gold, 60);
  bubble(ctx, 540, 1050, t, (t - WT('pegado')) / .3);
});
const reframe = (i, tw, tr, z, cx, cy) => { const s = SHOTS[i]; shotAt(tw, tr, (ctx, lt, t) => { ctx.save(); ctx.translate(cx, cy); ctx.scale(z, z); ctx.translate(-cx, -cy); s.draw(ctx, t - s.start, t); ctx.restore(); }); };
reframe(1, WT('empieza') - .05, 'cut', 1.3, 540, 1450);
reframe(2, WT('atras') - .05, 'zoom', 1.25, 330, 1300);
reframe(4, WT('circulo') - .05, 'zoom', 1.15, 540, 1250);
reframe(6, WT('veinte') - .05, 'cut', 1.2, 540, 1250);
reframe(8, WT('frenes') - .05, 'zoom', 1.2, 540, 1200);
reframe(9, WT('absorbes') - .05, 'cut', 1.2, 540, 1300);
reframe(0, WT('accidente') - .05, 'zoom', 1.25, 540, 1500);
reframe(7, WT('sales') - .05, 'cut', 1.25, 540, 1300);
reframe(7, WT('causara') - .05, 'zoom', 1.2, 540, 1000);
reframe(8, WT('ayudas') - .05, 'cut', 1.2, 540, 1400);
reframe(10, WT('amigo', 0, 10) - .05, 'zoom', 1.3, 600, 1500);
reframe(10, WT('adelante', 0, 10) - .05, 'cut', 1.15, 540, 1000);
