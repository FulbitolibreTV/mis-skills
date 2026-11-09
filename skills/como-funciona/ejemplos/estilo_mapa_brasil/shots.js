// ---------- «¿Por qué en Brasil hablan portugués?» (ESTILO mapa) ----------
window.ESTILO = 'mapa';
window.COVER = { t: 1.0, title: '¿Por qué en *Brasil* hablan portugués?' };
const ES = MAPC.amarillo, PT = MAPC.verde, LINE_LON = -46.6;
const HISP = ['Argentina', 'Bolivia', 'Chile', 'Colombia', 'Ecuador', 'Paraguay', 'Peru', 'Uruguay', 'Venezuela'];
const SA = ['Brazil', 'Guyana', 'Suriname', 'Falkland Is.', ...HISP];
const vSA = mapFit(-84, -56, -32, 13, 1.02), vAtl = mapFit(-92, 2, 2, 46, 1.0), vIb = mapFit(-11, 35, 4, 44.5, 1.1);
// lands left of the treaty line in one colour, right in another
function splitLands(ctx, names, left, right, k = 1) {
  const [lx] = P(LINE_LON, 0);
  names.forEach(n => land(ctx, n, MAPC.paper));
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, lx, H); ctx.clip(); ctx.globalAlpha = k; names.forEach(n => land(ctx, n, left)); ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.rect(lx, 0, W - lx, H); ctx.clip(); ctx.globalAlpha = k; names.forEach(n => land(ctx, n, right)); ctx.restore();
}
const meridian = (ctx, p) => mapLine(ctx, [[LINE_LON, 75], [LINE_LON, -70]], p, '#fff', { dash: [22, 16], w: 6 });

// 0 · hook: South America, Brazil green, the rest yellow
shot(0, 'cut', (ctx, lt, t) => {
  seaBg(ctx, t); mapCam(kf(lt, [[0, [vSA[0], vSA[1], vSA[2] * 1.25]], [3.5, vSA]]));
  bgLands(ctx, SA); SA.forEach(n => land(ctx, n, HISP.includes(n) ? ES : n === 'Brazil' ? PT : MAPC.paper));
  const [bx, by] = P(-52, -9), [ax, ay] = P(-64, -32);
  flagPole(ctx, 'br', bx + 40, by - 20, 1, t, (t - WT('brasil')) / .4);
  mapLabel(ctx, 'PORTUGUÉS', bx, by + 60, (t - WT('portugues')) / .3, 40);
  mapLabel(ctx, 'ESPAÑOL', ax, ay, (t - WT('espanol')) / .3, 40);
  peg(ctx, ax + 10, ay + 150, 1.1, { body: '#c8332f', hair: '#3a2416', hop: (t * 2) % 1 * clamp((t - WT('espanol')) / .2) });
});
// 1 · 1492: Columbus sails for Spain
shot(1, 'zoom', (ctx, lt, t) => {
  seaBg(ctx, t); mapCam(kf(lt, [[0, vAtl], [4, [vAtl[0] + 4, vAtl[1], vAtl[2] * 1.08]]]));
  bgLands(ctx, ['Spain']); land(ctx, 'Spain', ES);
  const k = clamp((t - WT('colon')) / 2.6), end = mapLine(ctx, [[-7, 37], [-16, 28], [-40, 26], [-62, 24], [-75, 24]], k, '#fff', { dash: [14, 12], w: 5, arrow: true });
  if (k > 0) ship(ctx, end[0], end[1] + 30, .8, t, { flag: 'es_old', flip: true });
  yearTag(ctx, '1492', 540, 1560, lt / .3);
  const [sx, sy] = P(-4, 40); flagPole(ctx, 'es_old', sx, sy, .9, t, (t - WT('espana')) / .4);
});
// 2 · Portugal protests
shot(2, 'cut', (ctx, lt, t) => {
  seaBg(ctx, t); mapCam(kf(lt, [[0, vIb], [3.5, [vIb[0], vIb[1], vIb[2] * 1.06]]]));
  bgLands(ctx, ['Spain', 'Portugal']); land(ctx, 'Spain', ES); land(ctx, 'Portugal', PT);
  const [px, py] = P(-8, 39.5), [sx, sy] = P(-3.5, 40);
  mapLabel(ctx, 'PORTUGAL', px - 20, py + 150, lt / .3, 36); mapLabel(ctx, 'ESPAÑA', sx + 60, sy + 120, lt / .3, 36);
  pj(ctx, 'mapa/rey', px - 10, py + 80, 230, { hop: t > WT('protesto') ? (t * 3) % 1 : 0 });
  pj(ctx, 'mapa/reina', sx + 120, sy + 40, 230, { flip: true });
  stamp(ctx, '¡ESO ES NUESTRO!', 540, 1560, 60, MAPC.rojo, (t - WT('querian')) / .25, -.05);
});
// 3 · 1494: Tordesillas, a line splits the world
shot(3, 'zoom', (ctx, lt, t) => {
  seaBg(ctx, t); mapCam(kf(lt, [[0, vAtl], [6, [vAtl[0] + 6, vAtl[1] - 4, vAtl[2] * .95]]]));
  bgLands(ctx, ['Spain', 'Portugal']); land(ctx, 'Spain', ES); land(ctx, 'Portugal', PT);
  meridian(ctx, (t - WT('linea')) / 1.2);
  yearTag(ctx, '1494', 540, 1560, lt / .3);
  scroll(ctx, 540, 1250, 560, 180, (t - WT('tratado')) / .5, (c, w, h) => { text(c, 'TRATADO DE', w / 2, h / 2 - 26, 34, '#4a2f18', 700); text(c, 'TORDESILLAS', w / 2, h / 2 + 22, 46, '#4a2f18', 700); });
});
// 4 · left Spain, right Portugal
shot(4, 'cut', (ctx, lt, t) => {
  seaBg(ctx, t); mapCam(vAtl[0] + 6, vAtl[1] - 4, vAtl[2] * .95);
  splitLands(ctx, Object.keys(GEO.c), ES, PT, 1); meridian(ctx, 1);
  const [lx] = P(LINE_LON, 0);
  mapLabel(ctx, 'ESPAÑA', lx - 230, 1500, (t - WT('espana', 0, 4)) / .3, 48); mapLabel(ctx, 'PORTUGAL', lx + 230, 1500, (t - WT('portugal', 0, 4)) / .3, 48);
  flagPole(ctx, 'es_old', lx - 230, 1440, 1, t, (t - WT('espana', 0, 4)) / .4); flagPole(ctx, 'pt', lx + 230, 1440, 1, t, (t - WT('portugal', 0, 4)) / .4);
});
// 5 · the line cuts the tip of South America
shot(5, 'zoom', (ctx, lt, t) => {
  seaBg(ctx, t); mapCam(kf(lt, [[0, [vAtl[0] + 6, vAtl[1] - 4, vAtl[2] * .95]], [1.6, vSA]]));
  bgLands(ctx, SA); splitLands(ctx, SA, MAPC.paper, PT, clamp((t - WT('punta')) / .5)); meridian(ctx, 1);
  const [x, y] = P(-40, -8); mapLabel(ctx, 'LA PUNTA', x, y, (t - WT('punta')) / .3, 36);
});
// 6 · 1500: Cabral lands and claims it
shot(6, 'cut', (ctx, lt, t) => {
  const v = mapFit(-56, -26, -30, 2, 1.0);
  seaBg(ctx, t); mapCam(kf(lt, [[0, v], [4, [v[0], v[1], v[2] * 1.08]]]));
  bgLands(ctx, SA); splitLands(ctx, SA, MAPC.paper, PT, 1); meridian(ctx, 1);
  const [cx, cy] = P(-39.1, -16.4), arr = clamp((t - WT('cabral')) / 1.2);
  ship(ctx, lerp(cx + 360, cx + 110, easeOut(arr)), cy + 10, .9, t, { flag: 'pt', flip: true });
  pj(ctx, 'mapa/conquistador', cx - 20, cy + 30, 200, { p: lt / .4 });
  flagPole(ctx, 'pt', cx - 80, cy + 20, 1.1, t, (t - WT('reclamo')) / .4);
  yearTag(ctx, '1500', 540, 1560, lt / .3);
});
// 7 · Portuguese push far beyond the line
shot(7, 'zoom', (ctx, lt, t) => {
  seaBg(ctx, t); mapCam(kf(lt, [[0, vSA], [4, [vSA[0] + 2, vSA[1], vSA[2] * 1.12]]]));
  bgLands(ctx, SA); SA.forEach(n => n !== 'Brazil' && land(ctx, n, HISP.includes(n) ? ES : MAPC.paper));
  const [lx] = P(LINE_LON, 0);
  land(ctx, 'Brazil', MAPC.paper); ctx.save(); ctx.beginPath(); ctx.rect(lx, 0, W, H); ctx.clip(); land(ctx, 'Brazil', PT); ctx.restore();
  const k = clamp((t - WT('mucho')) / 2.2); if (k > 0) { const [ox, oy] = P(-44, -12); ctx.save(); circle(ctx, ox, oy, 1400 * easeOut(k)); ctx.clip(); land(ctx, 'Brazil', PT); ctx.restore(); }
  meridian(ctx, 1);
  for (let i = 0; i < 4; i++) { const q = clamp(k * 1.3 - i * .15), [x, y] = P(lerp(-44, -60 + i * 3, q), -6 - i * 5); if (q > 0) peg(ctx, x, y, .9, { body: '#2f6b3a', hat: i % 2 ? 'casco' : 'sombrero', hop: (t * 2 + i * .3) % 1 }); }
  mapLabel(ctx, 'MÁS ALLÁ DE LA LÍNEA', 540, 1560, (t - WT('alla')) / .3, 40);
});
// 8 · today: Brazil, almost half, speaks Portuguese
shot(8, 'cut', (ctx, lt, t) => {
  seaBg(ctx, t); mapCam(kf(lt, [[0, [vSA[0], vSA[1], vSA[2] * 1.1]], [3.5, vSA]]));
  bgLands(ctx, SA); SA.forEach(n => land(ctx, n, HISP.includes(n) ? ES : n === 'Brazil' ? PT : MAPC.paper));
  meridian(ctx, clamp(1 - lt / .8));
  const [bx, by] = P(-52, -9); flagPole(ctx, 'br', bx + 40, by - 20, 1.1, t, lt / .4);
  yearTag(ctx, '~47 %', bx - 60, by + 80, (t - WT('mitad')) / .3, 80);
  mapLabel(ctx, 'PORTUGUÉS', bx - 60, by + 190, (t - WT('portugues', 0, 8)) / .3, 38);
});
// 9 · comment
shot(9, 'fade', (ctx, lt, t) => {
  seaBg(ctx, t); mapCam(vSA); bgLands(ctx, SA); SA.forEach(n => land(ctx, n, HISP.includes(n) ? ES : n === 'Brazil' ? PT : MAPC.paper));
  commentAsk(ctx, lt, .3, 'LO SABÍA', 'NI IDEA', 300, 780, 1500);
});
