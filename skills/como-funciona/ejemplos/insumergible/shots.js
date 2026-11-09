// ---------- "La mujer que sobrevivió al Titanic y a sus dos gemelos" (Violet Jessop) ----------
window.COVER = { t: 2.2, title: 'Sobrevivió al *Titanic*… y a sus dos gemelos' };
const SEA = 'rgba(22,63,108,.97)';
const shipAt = (ctx, t, x, hor, s, o = {}) => { const bob = Math.sin(t * 1.3) * 4; liner(ctx, x, hor + 18 + bob + (o.sink || 0), s, o); waterFront(ctx, t, hor + 22, SEA); };
const NUM = (ctx, n, p) => dots(ctx, 3, n * clamp(p), 540, 560, 90, 30);

// 0 · hook: the Titanic sinking at night, then two ghost twins appear
shot(0, 'cut', (ctx, lt, t) => {
  const hor = landscape(ctx, t, 'mar', { hor: 1250, sun: [820, 900] });
  ctx.save(); cam(ctx, kf(lt, [[0, 1.5], [.7, 1, easeOut], [3.8, 1.06]]), 540, 1100, t, 1, 540, 1100);
  const g = clamp((t - WT('gemelos') + .3) / .5);
  ctx.globalAlpha = .35 * g; liner(ctx, 260, hor - 40, .38); liner(ctx, 830, hor - 40, .38); ctx.globalAlpha = 1;
  liner(ctx, 540, hor + 60 + lt * 6, .8, { tilt: .12 + lt * .01, lights: .8 + .2 * Math.sin(t * 20) * (lt > 1 ? 1 : 0) });
  waterFront(ctx, t, hor + 30, SEA);
  ctx.restore();
  pill(ctx, 'TITANIC · 1912', 540, 640, (t - WT('titanic')) / .3, C.gold, 34);
});
// 1 · Violet Jessop, stewardess
shot(1, 'zoom', (ctx, lt, t) => {
  const hor = landscape(ctx, t, 'atardecer', { hor: 1300, sun: [780, 1150], ground: 'mar' });
  shipAt(ctx, t, 760, hor, .55, { lights: .3 });
  violet(ctx, 330, 1700, 1.25, { look: .4 });
  pill(ctx, 'VIOLET JESSOP', 330, 620, (t - WT('violet')) / .3, C.gold, 34);
  label(ctx, 'CAMARERA', 330, 1450, 700, 1500, (t - WT('camarera')) / .4, C.ink, 28);
});
// 2 · 1911: the Olympic hits a warship
shot(2, 'cut', (ctx, lt, t) => {
  const hor = landscape(ctx, t, 'dia', { hor: 1200, sun: [850, 700], ground: 'ninguno' });
  ctx.fillStyle = lin(ctx, 0, hor, 0, H, [[0, '#3f7fb5'], [1, '#123a63']]); ctx.fillRect(0, hor, W, H - hor);
  const tc = WT('choco'), hit = t > tc;
  ctx.save(); cam(ctx, 1, 540, 1100, t, hit ? 3 : 1, 540, 1100);
  const wx = hit ? 820 + Math.sin((t - tc) * 40) * clamp(1 - (t - tc) * 2) * 10 : kf(t, [[LINE(2), 1350], [tc, 820]]);
  liner(ctx, 380, hor + 20, .7); warship(ctx, wx, hor + 15, .6);
  waterFront(ctx, t, hor + 22, 'rgba(40,100,160,.97)');
  if (hit) bloom(ctx, 680, hor - 40, 300, 'rgba(255,220,150,', .6 * clamp(1 - (t - tc) * 1.5));
  ctx.restore();
  chip(ctx, '1911', '', 300, 640, (t - WT('1911')) / .3, C.gold, 70);
  pill(ctx, 'OLYMPIC', 380, 1450, (t - WT('olympic')) / .3, C.ink, 32);
  NUM(ctx, 1, (t - WT('olympic')) / .3);
});
// 3 · the ship held, and so did she
shot(3, 'zoom', (ctx, lt, t) => {
  const hor = landscape(ctx, t, 'dia', { hor: 1250, sun: [850, 700], ground: 'ninguno' });
  ctx.fillStyle = lin(ctx, 0, hor, 0, H, [[0, '#3f7fb5'], [1, '#123a63']]); ctx.fillRect(0, hor, W, H - hor);
  liner(ctx, 540, hor + 20 + Math.sin(t * 1.3) * 4, .85); waterFront(ctx, t, hor + 24, 'rgba(40,100,160,.97)');
  check(ctx, 540, 680, 70, (t - WT('aguanto')) / .4, C.green);
  violet(ctx, 880, 1800, .7, {});
  check(ctx, 880, 1350, 40, (t - WT('tambien')) / .4, C.green);
});
// 4 · the most famous ship in the world
shot(4, 'cut', (ctx, lt, t) => {
  const hor = landscape(ctx, t, 'noche', { hor: 1250, sun: [900, 700], ground: 'mar' });
  ctx.save(); cam(ctx, kf(lt, [[0, 1.25], [3.2, 1]]), 540, 1100, t, .5, 540, 1100);
  shipAt(ctx, t, 540, hor, 1, { lights: 1 }); ctx.restore();
  godRays(ctx, 540, 450, clamp((t - WT('titanic', 0, 4)) / .5) * .7, t);
  pill(ctx, 'TITANIC', 540, 640, (t - WT('titanic', 0, 4)) / .3, C.gold, 48);
  NUM(ctx, 2, (t - WT('titanic', 0, 4)) / .3);
});
// 5 · the iceberg night: lifeboat, and an officer hands her a baby
shotAt(LINE(5) - .25, 'cut', (ctx, lt, t) => {
  const hor = landscape(ctx, t, 'mar', { hor: 1200, sun: [860, 700] });
  iceberg(ctx, 230, hor + 10, .9); waterFront(ctx, t, hor + 14, SEA);
  lifeboat(ctx, 660, kf(t, [[WT('bote') - .4, 900], [WT('bote') + .4, hor + 20]]), 1.2);
  label(ctx, 'ICEBERG', 230, 1000, 180, 700, (t - WT('iceberg')) / .4, C.cyan, 28);
});
shotAt(WT('oficial') - .1, 'zoom', (ctx, lt, t) => {
  landscape(ctx, t, 'mar', { hor: 1500, sun: [800, 900] });
  violet(ctx, 540, 1900, 2.1, { baby: true, eyes: t > WT('cuidara') ? 'closed' : 'open' });
  goldIcon(ctx, 'heart', 820, 760, .45, (t - WT('bebe')) / .4, t);
  pill(ctx, 'BOTE 16', 260, 660, (t - WT('oficial')) / .3, C.ink, 30);
});
// 6 · more than 1,500 died. She survived
shot(6, 'cut', (ctx, lt, t) => {
  const hor = landscape(ctx, t, 'mar', { hor: 1250, sun: [820, 850] });
  const sink = easeIn(clamp(lt / 3)) * 260;
  liner(ctx, 540, hor + 80 + sink, .8, { tilt: .25 + sink / 1500, lights: 0 }); waterFront(ctx, t, hor + 30, SEA);
  chip(ctx, '1.500', 'personas', 540, 680, (t - WT('1.500')) / .3, C.red, 80);
  pill(ctx, 'ELLA SOBREVIVIÓ', 540, 1500, (t - WT('sobrevivio', 0, 6)) / .3, C.green, 38);
});
// 7 · but here comes the incredible part
shot(7, 'flash', (ctx, lt, t) => {
  background(ctx, t, 540, 960, .8, 7);
  rays(ctx, 540, 1000, 800, t, 'rgba(255,200,120,');
  goldIcon(ctx, 'question', 540, 1000, 1.3, lt / .35, t);
}, { punch: [WT('increible')], pc: [540, 1000] });
// 8 · WWI: nurse on the third twin, the hospital ship Britannic
shot(8, 'cut', (ctx, lt, t) => {
  const hor = landscape(ctx, t, 'atardecer', { hor: 1300, sun: [300, 1150], ground: 'mar' });
  shipAt(ctx, t, 600, hor, .8, { hospital: true });
  violet(ctx, 220, 1850, 1, { nurse: true, look: .5 });
  label(ctx, 'ENFERMERA', 220, 1340, 220, 1560, (t - WT('enfermera')) / .4, C.ink, 26);
  pill(ctx, 'BRITANNIC', 600, 1520, (t - WT('britannic')) / .3, C.gold, 38);
  NUM(ctx, 3, (t - WT('tercer')) / .3);
});
// 9 · 1916: a mine, sunk in under an hour
shot(9, 'zoom', (ctx, lt, t) => {
  const tm = WT('mina'), boom = clamp((t - tm) / .15);
  if (t < tm) {
    underwater(ctx, t, 500);
    ctx.fillStyle = '#0e1116'; ctx.beginPath(); ctx.moveTo(100, 480); ctx.lineTo(1000, 480); ctx.lineTo(940, 620); ctx.lineTo(160, 620); ctx.closePath(); ctx.fill();
    seaMine(ctx, kf(t, [[LINE(9), 700], [tm, 560]]), 900, 70, t);
  } else {
    const hor = landscape(ctx, t, 'atardecer', { hor: 1250, sun: [300, 1100], ground: 'mar' });
    const sink = easeIn(clamp((t - tm) / 2.5)) * 200;
    liner(ctx, 560, hor + 40 + sink, .85, { hospital: true, tilt: -.08 - sink / 1800 }); waterFront(ctx, t, hor + 26, SEA);
    bloom(ctx, 760, hor, 500, 'rgba(255,170,80,', .9 * clamp(1 - (t - tm) / .8));
  }
  if (boom > 0 && t - tm < .2) { ctx.fillStyle = `rgba(255,240,200,${.8 * (1 - (t - tm) / .2)})`; ctx.fillRect(0, 0, W, H); }
  chip(ctx, '1916', '', 270, 640, (t - WT('1916')) / .3, C.gold, 70);
  chip(ctx, '< 1', 'hora', 800, 640, (t - WT('hora')) / .3, C.red, 70);
});
// 10 · the propellers shredding the boats; she jumps and hits her head
shot(10, 'cut', (ctx, lt, t) => {
  underwater(ctx, t, 300);
  const sp = t * 9;
  propeller(ctx, 300, 900, 260, sp); propeller(ctx, 800, 1050, 200, -sp * 1.1);
  for (let i = 0; i < 18; i++) { const R = rng(i + 3), a = R() * TAU, d = ((t * 300 + R() * 600) % 700); rrect(ctx, 300 + Math.cos(a) * d, 900 + Math.sin(a) * d, 40, 12, 3); ctx.fillStyle = 'rgba(230,220,200,.7)'; ctx.fill(); }
  const tj = WT('salto'), j = clamp((t - tj) / .8);
  if (j > 0) { ctx.save(); ctx.translate(lerp(820, 640, j), lerp(200, 700, j)); ctx.rotate(j * 1.2); violet(ctx, 0, 0, .6, { nurse: true, arms: 'open', eyes: 'closed' }); ctx.restore(); }
  if (t > WT('golpeo')) stamp(ctx, '¡PUM!', 540, 1450, 90, C.red, (t - WT('golpeo')) / .25);
  pill(ctx, 'HÉLICES', 300, 560, (t - WT('helices')) / .3, C.red, 34);
});
// 11 · and still, she came out alive
shot(11, 'flash', (ctx, lt, t) => {
  const hor = landscape(ctx, t, 'atardecer', { hor: 1350, sun: [540, 1250], ground: 'mar' });
  godRays(ctx, 540, 300, clamp(lt / .6), t);
  violet(ctx, 540, 1900, 1.5, { nurse: true, arms: 'open', eyes: 'closed' });
  pill(ctx, 'VIVA', 540, 700, (t - WT('viva')) / .3, C.green, 50);
});
// 12 · three twins, three disasters, she was on all three
shot(12, 'zoom', (ctx, lt, t) => {
  background(ctx, t, 540, 1000, .6, 12);
  const names = [['OLYMPIC', '1911', 'tres'], ['TITANIC', '1912', 'desastres'], ['BRITANNIC', '1916', 'desastres']];
  names.forEach(([n, y], i) => {
    const yy = 680 + i * 300, p = (t - WT('tres') - i * .35) / .3;
    if (p <= 0) return;
    ctx.save(); ctx.globalAlpha = clamp(p); liner(ctx, 420, yy + 60, .42, { hospital: i === 2 }); ctx.restore();
    caps(ctx, n + ' · ' + y, 420, yy + 110, 26, C.dim);
    stamp(ctx, '✕', 420, yy - 40, 60, C.red, (t - WT('desastres') - i * .2) / .25, 0);
    check(ctx, 860, yy - 20, 50, (t - WT('tres', 1, 12) - i * .2) / .3, C.green);
  });
  violet(ctx, 860, 1650, .55, { look: -.5 });
});
// 13 · "Miss Unsinkable", lived to 83
shot(13, 'cut', (ctx, lt, t) => {
  const hor = landscape(ctx, t, 'atardecer', { hor: 1350, sun: [760, 1200], ground: 'mar' });
  shipAt(ctx, t, 800, hor, .35, { lights: .4 });
  violet(ctx, 380, 1900, 1.45, { look: .3 });
  pill(ctx, 'MISS INSUMERGIBLE', 540, 640, (t - WT('insumergible')) / .3, C.gold, 42);
  chip(ctx, '83', 'años', 800, 900, (t - WT('83')) / .3, C.ink, 70);
}, { punch: [WT('insumergible'), WT('83')], pc: [540, 900] });
// 14 · would you get on a ship again? comment yes or no
shot(14, 'fade', (ctx, lt, t) => {
  const hor = landscape(ctx, t, 'noche', { hor: 1200, sun: [800, 700], ground: 'mar' });
  shipAt(ctx, t, 540, hor, .75, { lights: 1 });
  const ta = WT('comenta');
  pill(ctx, 'SÍ', 330, 1520, (t - ta) / .35, C.green, 70); pill(ctx, 'NO', 750, 1520, (t - ta - .15) / .35, C.red, 70);
  bubble(ctx, 540, 1720, t, (t - ta - .4) / .35);
});

const S = line => line <= 4 ? line : line + 1;   // shot index for a line (line 5 has two shots)
const P = (i, times, pc) => { SHOTS[i].punch = times; if (pc) SHOTS[i].pc = pc; };
P(S(0), [WT('titanic'), WT('gemelos')], [540, 1000]);
P(S(2), [WT('olympic'), WT('choco')], [540, 1100]);
P(S(4), [WT('famoso')], [540, 1100]);
P(S(6), [WT('1.500'), WT('sobrevivio', 0, 6)], [540, 1000]);
P(S(8), [WT('enfermera'), WT('britannic')], [540, 1300]);
P(S(9), [WT('mina'), WT('hora')], [540, 1000]);
P(S(10), [WT('helices'), WT('salto'), WT('golpeo')], [540, 1000]);
P(S(12), [WT('tres'), WT('tres', 1, 12)], [540, 1100]);
P(S(6), [WT('murieron'), WT('1.500'), WT('ella', 0, 6), WT('sobrevivio', 0, 6)], [540, 1000]);
P(S(8), [WT('guerra'), WT('enfermera'), WT('gemelo', 0, 8), WT('britannic')], [540, 1300]);
P(S(12), [WT('gemelos', 0, 12), WT('tres'), WT('estaba', 0, 12), WT('tres', 1, 12)], [540, 1100]);
P(S(14), [WT('volverias'), WT('barco', 0, 14), WT('comenta'), WT('no', 0, 14)], [540, 1300]);
// mid-line reframes of a shot (new camera on the same scene) so nothing stays still too long
const reframe = (i, tw, tr, z, cx, cy) => { const s = SHOTS[i]; shotAt(tw, tr, (ctx, lt, t) => { ctx.save(); ctx.translate(cx, cy); ctx.scale(z, z); ctx.translate(-cx, -cy); s.draw(ctx, t - s.start, t); ctx.restore(); }, { capY: s.capY }); };
reframe(S(6), WT('ella', 0, 6) - .05, 'zoom', 1.5, 540, 680);
reframe(S(8), WT('tercer') - .05, 'zoom', 1.5, 600, 560);
reframe(S(12), WT('estaba', 0, 12) - .05, 'zoom', 1.35, 600, 1150);
reframe(S(13), WT('vivio') - .05, 'cut', 1.5, 540, 640);
reframe(S(14), WT('comenta') - .05, 'zoom', 1.3, 540, 1450);
reframe(S(1), WT('trabajaba') - .05, 'zoom', 1.45, 330, 800);
