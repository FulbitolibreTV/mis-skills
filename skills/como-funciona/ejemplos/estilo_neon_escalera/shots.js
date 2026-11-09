// ---------- «Nadie sube solo» (ESTILO neon) ----------
window.ESTILO = 'neon';
window.COVER = { t: 2.5, title: 'Nadie sube *solo*' };
const LV = ['CERO', 'PRIMER TRABAJO', 'NEGOCIO', 'ÉXITO'];
const SX = 300, SW = 180, SH = 180;      // stairs: x, step width, step height
const stepTop = i => [SX + i * SW + SW / 2, FLOOR - (i + 1) * SH];
// where the climber stands at time t: walks up one step per `per` seconds from t0, up to step `to`
const climber = (t, t0, per, to) => { const q = clamp((t - t0) / per, 0, to + 1), i = Math.floor(q), f = q - i;
  if (q <= 0) return [SX - 60, FLOOR, 0]; const a = i === 0 ? [SX - 60, FLOOR] : stepTop(i - 1), b = stepTop(Math.min(i, to));
  return i > to ? [...stepTop(to), 0] : [lerp(a[0], b[0], easeOut(f)), lerp(a[1], b[1], easeOut(f)) - Math.sin(f * Math.PI) * 40, f]; };
const stairs = (ctx, p = 1, lit = 3) => neonStairs(ctx, SX, FLOOR, 4, SW, SH, p, LV.map((l, i) => i <= lit ? l : ''));
const TITLE = (ctx, lt) => neonTitle(ctx, 'NADIE SUBE', 'SOLO.', 250, lt / .4);

// 0 · everyone sees you at the top
shot(0, 'cut', (ctx, lt, t) => {
  neonScene(ctx, t, c => {
    stairs(c, 1);
    const [x, y] = stepTop(3); stick(c, x, y, 1, { pose: t > WT('arriba') ? 'cheer' : 'stand', tie: NC.blue });
    for (let i = 0; i < 3; i++) stick(c, 70 + i * 80, FLOOR, .7, { pose: 'point', look: 1, col: '#9aa0a8', glow: 'rgba(0,0,0,0)' });
  });
  TITLE(ctx, lt);
});
// 1 · nobody sees the steps you climbed alone, at night
shot(1, 'cut', (ctx, lt, t) => {
  neonScene(ctx, t, c => {
    stairs(c, 1, 3);
    const [x, y] = climber(t, LINE(1) + .2, .55, 3); stick(c, x, y, 1, { pose: walkPose(t), tie: NC.blue });
    c.save(); c.globalAlpha = .8; circle(c, 900, 520, 46); c.fillStyle = '#f2f2e6'; c.shadowColor = '#fff'; c.shadowBlur = 30; c.fill(); circle(c, 922, 506, 40); c.fillStyle = '#030304'; c.shadowBlur = 0; c.fill(); c.restore();
  });
  TITLE(ctx, lt + 1);
  neonSay(ctx, 'SOLO.', 540, 1520, (t - WT('solo')) / .4, NC.pink, 40);
});
// 2 · nor the person who held you when you fell
shot(2, 'cut', (ctx, lt, t) => {
  const tf = WT('caiste'), fall = clamp((t - tf) / .35);
  neonScene(ctx, t, c => {
    stairs(c, 1, 3);
    const [hx, hy] = stepTop(1), [fx, fy] = [SX + 2 * SW + 20, lerp(FLOOR - 2 * SH - 60, FLOOR - 1.4 * SH, easeIn(fall))];
    const her = stick(c, 150, FLOOR, 1, { pose: fall > 0 ? 'pull' : 'stand', dress: NC.dress, hair: '#ff8fb0', look: 1 });
    const him = stick(c, fx, fy + (fall > 0 ? 0 : 0), 1, { pose: fall > 0 ? { la: [2.6, 2.8], ra: [-2.4, -2.6], ll: [.5, .2], rl: [-.3, .4], lean: -.2 } : climbPose(t), tie: NC.blue, face: fall > 0 ? 'o' : 'smile' });
    rope(c, her.handR[0], her.handR[1], him.handR[0] - 30, him.handR[1] + 60, fall > 0 ? 6 : 50);
  });
  neonSay(ctx, 'TE TENGO.', 260, 1150, (t - tf - .3) / .5, NC.pink, 30);
});
// 3 · when you get there, don't forget her
shot(3, 'zoom', (ctx, lt, t) => {
  neonScene(ctx, t, c => {
    stairs(c, 1, 3);
    const [x, y] = stepTop(3), k = clamp(lt / 1.4);
    stick(c, x - 40, y, 1, { pose: 'hug', tie: NC.blue });
    stick(c, lerp(150, x + 20, easeOut(k)), lerp(FLOOR, y, easeOut(k)) - Math.sin(k * Math.PI) * 80, 1, { pose: k < 1 ? 'cheer' : 'hug', dress: NC.dress, hair: '#ff8fb0', look: -1 });
    hearts(c, x, y - 230, t, (t - WT('olvides')) / .4, 5);
  });
  neonTitle(ctx, 'NO LA', 'OLVIDES.', 250, (t - WT('olvides')) / .4);
});
// 4 · who helped you? tag them
shot(4, 'fade', (ctx, lt, t) => {
  neonScene(ctx, t, c => { stairs(c, 1, 3); const [x, y] = stepTop(3); stick(c, x - 40, y, 1, { pose: 'hug', tie: NC.blue }); stick(c, x + 20, y, 1, { pose: 'hug', dress: NC.dress, hair: '#ff8fb0', look: -1 }); hearts(c, x, y - 230, t, 1, 5); });
  neonTitle(ctx, '¿QUIÉN TE', 'AYUDÓ A TI?', 250, lt / .4, NC.teal);
  neonSay(ctx, '@ ETIQUÉTALO', 540, 1470, (t - WT('etiquetalo')) / .4, NC.white, 40);
});
