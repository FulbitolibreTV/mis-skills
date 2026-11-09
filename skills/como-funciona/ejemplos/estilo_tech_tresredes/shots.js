// ---------- «Así programo un vídeo en 3 redes» (ESTILO tech) ----------
window.ESTILO = 'tech';
window.COVER = { t: 1.2, title: 'Un vídeo en *3 redes* sin tocar el móvil' };
// a little drawn "video" for the phone screens: map frame with a moving dot
const miniVideo = (ctx, w, h, t) => {
  ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, '#3c8f96'], [1, '#1f5f66']]); ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#d9c391'; ctx.beginPath(); ctx.ellipse(w * .45, h * .55, w * .32, h * .2, -.4, 0, TAU); ctx.fill();
  circle(ctx, w * (.35 + Math.sin(t * 2) * .12), h * .52, 10); ctx.fillStyle = '#ff7a1a'; ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(0, h * .82, w, h * .18); ctx.fillStyle = '#fff'; ctx.fillRect(w * .08, h * .88, w * .84 * ((t * .2) % 1), 5);
};
const NETS = [['YouTube', '#ff3b30'], ['Facebook', '#3b82f6'], ['Instagram', '#e1306c']];

// 0 · hook: a phone with the video, "sin tocar el móvil"
shot(0, 'cut', (ctx, lt, t) => {
  techBg(ctx, t);
  techPhone(ctx, 540, 820, 380, lt / .4, (c, w, h) => miniVideo(c, w, h, t), { rot: Math.sin(t) * .02 });
  techPill(ctx, 'sin tocar el móvil', 540, 1260, (t - WT('movil')) / .3);
});
shotAt(WT('tres') - .05, 'zoom', (ctx, lt, t) => {
  techBg(ctx, t);
  NETS.forEach(([n, col], i) => techPhone(ctx, 240 + i * 300, 820 + Math.abs(i - 1) * 40, 250, (lt - i * .12) / .35, (c, w, h) => { miniVideo(c, w, h, t + i); c.fillStyle = col; c.fillRect(0, 0, w, 40); text(c, n, w / 2, 21, 20, '#fff', 700); }, { rot: (i - 1) * .08 }));
});
// 1 · Claude writes the script and draws it frame by frame
shot(1, 'cut', (ctx, lt, t) => {
  techBg(ctx, t);
  techWindow(ctx, 540, 640, 820, 420, lt / .35, (c, w, h) => {
    const k = clamp((t - WT('guion')) / 1.2), lines = ['¿Por qué en Brasil hablan portugués?', 'En 1492, Colón llegó a América...', 'Portugal protestó...', 'Así que firmaron el Tratado...'];
    lines.forEach((l, i) => { const q = clamp(k * 4 - i); if (q > 0) text(c, l.slice(0, Math.ceil(l.length * q)), 36, 50 + i * 72, 30, i ? '#cfc6c0' : '#fff', i ? 500 : 700, 'Inter', 'left'); });
  }, { title: 'guion.json' });
  techGrid(ctx, 540, 900, 820, 6, 3, (t - WT('dibuja')) / .9, [], 5);
});
// 2 · compressed under 10 MB
shot(2, 'zoom', (ctx, lt, t) => {
  techBg(ctx, t);
  techBig(ctx, '10', 'mb', 540, 760, 260, (t - WT('diez')) / .5);
  techBar(ctx, 540, 1000, 640, clamp(lt / 2.4), 'comprimiendo...');
  techPill(ctx, 'sube rápido', 540, 1200, (t - WT('rapido')) / .3, false);
});
// 3 · opens each network and schedules it
shot(3, 'cut', (ctx, lt, t) => {
  techBg(ctx, t);
  NETS.forEach(([n, col], i) => {
    const y = 560 + i * 170, tw = WT(n.toLowerCase(), 0, 3);
    techChip(ctx, 'carpeta', n, 540, y, 660, (t - tw) / .3, col);
    if (t > WT('programa', 0, 3) + i * .25) { techIcon(ctx, 'check', 800, y, 1.2, '#33d17a'); }
  });
  const ck = WT('programa', 0, 3); techCursor(ctx, lerp(900, 790, clamp((t - ck + .4) / .4)), 600 + 170 * Math.min(2, Math.max(0, Math.floor((t - ck) / .25))), t, ck);
  techPill(ctx, 'programado', 540, 1150, (t - WT('cada')) / .3);
});
// 4 · you only need an idea and a time
shot(4, 'cut', (ctx, lt, t) => {
  techBg(ctx, t);
  text(ctx, 'solo necesitas', 540, 520, 90, TC.ink, 400, "'Unica One'");
  techChip(ctx, 'sol', 'una idea', 540, 740, 560, (t - WT('idea')) / .3);
  techChip(ctx, 'reloj', 'a qué hora', 540, 900, 560, (t - WT('hora')) / .3);
});
// 5 · comment "vídeo"
shot(5, 'zoom', (ctx, lt, t) => {
  techBg(ctx, t);
  techBig(ctx, 'comenta', '', 540, 640, 150, lt / .4);
  techPill(ctx, 'vídeo', 540, 860, (t - WT('video', 0, 5)) / .3, true, 60);
  bubble(ctx, 540, 1100, t, (t - WT('video', 0, 5) - .3) / .3);
}, { capY: 1400 });
