// ---------- cinematic worlds, characters, gold icons and counters (added from the second set of references) ----------
// Everything here is generic: use it for any topic (history, body, money, faith, nature, stories...).

// ===== landscapes =====
// mood: 'atardecer' | 'tormenta' | 'noche' | 'dia' | 'mar' | 'espacio' | 'muro'
// o.hor = horizon y (default 1150), o.sun = [x, y] (sun or moon), o.ground = 'desierto' | 'hierba' | 'mar' | 'ninguno',
// o.drift = cloud speed, o.seed. Returns the horizon y so props can stand on it.
const SKIES = {
  atardecer: [[0, '#231a45'], [.35, '#5d2f63'], [.6, '#c2574f'], [.8, '#f39a4e'], [1, '#ffd27a']],
  tormenta: [[0, '#151a28'], [.5, '#2c3346'], [.85, '#4a4f63'], [1, '#6a6070']],
  noche: [[0, '#05081a'], [.6, '#101741'], [1, '#2a2c5c']],
  dia: [[0, '#3f7fd6'], [.6, '#8fc1ef'], [1, '#f3e6c0']],
  mar: [[0, '#050c22'], [.7, '#13305e'], [1, '#2c5a8c']],
  espacio: [[0, '#05030f'], [.5, '#1a0f3a'], [1, '#0a0716']],
};
const GROUNDS = { desierto: ['#5a3a22', '#2a1a10'], hierba: ['#5f9a3e', '#2f5a24'], mar: ['#0d2a52', '#040d1f'] };
function landscape(ctx, t, mood = 'atardecer', o = {}) {
  const hor = o.hor ?? 1150, seed = o.seed ?? 1, drift = o.drift ?? 1;
  if (mood === 'muro') { brickWall(ctx, t, o.spot ?? [540, 700]); return hor; }
  const stops = SKIES[mood] || SKIES.atardecer;
  ctx.fillStyle = lin(ctx, 0, 0, 0, mood === 'espacio' ? H : hor, stops); ctx.fillRect(0, 0, W, H);
  if (mood === 'noche' || mood === 'mar' || mood === 'espacio') stars(ctx, t, mood === 'espacio' ? 260 : 140, seed, mood === 'espacio' ? H : hor * .8);
  if (mood === 'espacio') { bloom(ctx, 300, 600, 500, 'rgba(140,80,255,', .35); bloom(ctx, 820, 1300, 600, 'rgba(60,120,255,', .25); return hor; }
  const [sx, sy] = o.sun || [540, hor - 180];
  if (mood === 'atardecer' || mood === 'dia') {
    bloom(ctx, sx, sy, 900, 'rgba(255,190,90,', mood === 'dia' ? .35 : .65);
    circle(ctx, sx, sy, 130); ctx.fillStyle = rad(ctx, sx, sy, 0, 130, [[0, '#fffbe6'], [.7, '#ffe9a8'], [1, '#ffd27a']]); ctx.fill();
  } else if (mood === 'noche' || mood === 'mar') {
    moon(ctx, sx, Math.min(sy, hor - 500), 70);
  }
  if (mood === 'tormenta') { bloom(ctx, sx, hor, 700, 'rgba(255,150,80,', .35); }
  clouds(ctx, t, hor * .25, 5, mood === 'tormenta' ? 'rgba(40,45,60,.85)' : mood === 'dia' ? 'rgba(255,255,255,.85)' : 'rgba(70,50,90,.55)', seed, drift);
  if (mood !== 'dia') clouds(ctx, t, hor * .55, 4, mood === 'tormenta' ? 'rgba(25,28,40,.8)' : 'rgba(120,60,90,.35)', seed + 3, drift * 1.6);
  const g = o.ground || (mood === 'mar' ? 'mar' : mood === 'dia' ? 'hierba' : 'desierto');
  if (g === 'ninguno') return hor;
  if (g === 'mar') { sea(ctx, t, hor, sx); return hor; }
  ridge(ctx, t, hor - 20, 70, seed + 7, mood === 'dia' ? '#6d8fb0' : 'rgba(60,35,55,.9)');
  const [g0, g1] = GROUNDS[g];
  ctx.fillStyle = lin(ctx, 0, hor, 0, H, [[0, g0], [1, g1]]); ctx.fillRect(0, hor, W, H - hor);
  if (mood === 'atardecer') { ctx.fillStyle = lin(ctx, 0, hor, 0, hor + 220, [[0, 'rgba(255,170,90,.35)'], [1, 'rgba(255,170,90,0)']]); ctx.fillRect(0, hor, W, 220); }
  return hor;
}
// a soft mountain ridge on the horizon
function ridge(ctx, t, base, amp, seed, col) {
  const R = rng(seed * 13); const pts = []; for (let i = 0; i <= 8; i++) pts.push(base - R() * amp);
  ctx.beginPath(); ctx.moveTo(-20, base + 40);
  pts.forEach((y, i) => { const x = -20 + i * (W + 40) / 8; i ? ctx.quadraticCurveTo(x - (W + 40) / 16, y - amp * .3, x, y) : ctx.lineTo(x, y); });
  ctx.lineTo(W + 20, base + 40); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
}
// puffy clouds drifting sideways
function clouds(ctx, t, y, n, col, seed = 1, speed = 1) {
  const R = rng(seed * 71); ctx.save(); ctx.fillStyle = col; ctx.filter = 'blur(14px)';
  for (let i = 0; i < n; i++) {
    const w = 320 + R() * 420, cx = ((R() * (W + 700) + t * (8 + R() * 10) * speed) % (W + 700)) - 350, cy = y + (R() - .5) * 220;
    ctx.beginPath();
    for (let j = 0; j < 7; j++) { const px = cx + (j - 3) * w * .13, py = cy - Math.sin(j / 6 * Math.PI) * w * .09 + (R() - .5) * 20; ctx.moveTo(px + w * .16, py); ctx.ellipse(px, py, w * .16, w * .09, 0, 0, TAU); }
    ctx.ellipse(cx, cy + w * .04, w * .48, w * .06, 0, 0, TAU); ctx.fill();
  }
  ctx.filter = 'none';
  ctx.restore();
}
function stars(ctx, t, n = 120, seed = 1, maxY = H) {
  const R = rng(seed * 5 + 11); ctx.save();
  for (let i = 0; i < n; i++) { const x = R() * W, y = R() * maxY, r = .6 + R() * 2, ph = R() * TAU; ctx.globalAlpha = .4 + .6 * (.5 + .5 * Math.sin(t * 2 + ph)); circle(ctx, x, y, r); ctx.fillStyle = '#fff'; ctx.fill(); }
  ctx.restore();
}
function moon(ctx, x, y, r) {
  bloom(ctx, x, y, r * 5, 'rgba(220,230,255,', .3);
  circle(ctx, x, y, r); ctx.fillStyle = rad(ctx, x - r * .3, y - r * .3, 0, r * 1.2, [[0, '#ffffff'], [1, '#d8def0']]); ctx.fill();
}
// night sea from the horizon down, with moving wave lines and a path of light under the sun/moon at sunX
function sea(ctx, t, hor, sunX = 540) {
  ctx.fillStyle = lin(ctx, 0, hor, 0, H, [[0, '#1d4a7c'], [.4, '#0c2648'], [1, '#03091a']]); ctx.fillRect(0, hor, W, H - hor);
  ctx.save();
  for (let i = 0; i < 40; i++) {
    const y = hor + 8 + Math.pow(i / 40, 1.6) * (H - hor), amp = 3 + i * .4, a = .08 + .25 * (1 - i / 40);
    ctx.beginPath(); for (let x = -20; x <= W + 20; x += 30) { const yy = y + Math.sin(x / (60 + i * 4) + t * (1 + i * .05) + i) * amp; x < 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); }
    ctx.strokeStyle = `rgba(160,200,255,${a})`; ctx.lineWidth = 2; ctx.stroke();
  }
  for (let i = 0; i < 24; i++) { const y = hor + 10 + i * 18, w = 40 + i * 10 + Math.sin(t * 3 + i) * 20; rrect(ctx, sunX - w / 2, y, w, 4, 2); ctx.fillStyle = `rgba(255,240,200,${.5 - i * .018})`; ctx.fill(); }
  ctx.restore();
}
// stone wall lit by a spotlight (interiors, prisons, "the wall of your mistakes")
function brickWall(ctx, t, spot = [540, 700]) {
  ctx.fillStyle = '#1d1a18'; ctx.fillRect(0, 0, W, H);
  for (let y = 0, r = 0; y < H; y += 120, r++) for (let x = (r % 2) * -110; x < W; x += 220) { rrect(ctx, x + 4, y + 4, 212, 112, 8); ctx.fillStyle = r % 3 ? '#2b2724' : '#26221f'; ctx.fill(); }
  ctx.fillStyle = rad(ctx, spot[0], spot[1], 0, 900, [[0, 'rgba(255,220,180,.28)'], [1, 'rgba(0,0,0,.55)']]); ctx.fillRect(0, 0, W, H);
}
// falling rain; k = strength 0..1
function rain(ctx, t, k = 1, seed = 1) {
  if (k <= 0) return; const R = rng(seed * 17); ctx.save(); ctx.strokeStyle = `rgba(200,210,230,${.35 * k})`; ctx.lineWidth = 2;
  for (let i = 0; i < 260 * k; i++) { const x0 = R() * (W + 300), sp = 1400 + R() * 600, y = ((R() * H + t * sp) % (H + 100)) - 50, x = x0 - y * .18; line(ctx, x, y, x - 10, y + 46, 2, `rgba(200,210,230,${.25 * k + R() * .2})`); }
  ctx.restore();
}
// a lightning bolt that strikes at tStrike (and lights the whole frame for a moment)
function lightning(ctx, t, tStrike, x0 = 540, seed = 3) {
  const d = t - tStrike; if (d < 0 || d > .35) return;
  const k = d < .05 ? 1 : 1 - (d - .05) / .3, R = rng(seed);
  ctx.save(); ctx.fillStyle = `rgba(220,230,255,${.35 * k})`; ctx.fillRect(0, 0, W, H);
  const path = () => { ctx.beginPath(); let x = x0, y = -20; ctx.moveTo(x, y); while (y < 1250) { x += (R() - .5) * 140; y += 60 + R() * 70; ctx.lineTo(x, y); } };
  glow(ctx, path, '#e8eeff', 5, k); ctx.restore();
}
// beams of light falling from above (x, y = where they come from); k = 0..1
function godRays(ctx, x, y, k = 1, t = 0, col = 'rgba(255,240,200,') {
  if (k <= 0) return; ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 9; i++) {
    const a = -.35 + i * .09 + Math.sin(t * .4 + i) * .02, w = 30 + (i % 3) * 25, len = 1700;
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.fillStyle = lin(ctx, 0, 0, 0, len, [[0, col + (.28 * k) + ')'], [1, col + '0)']]); ctx.fillRect(-w / 2, 0, w, len); ctx.restore();
  }
  ctx.restore();
}
// sunburst rays behind an icon (seen behind the eye and the heart)
function rays(ctx, x, y, r, t, col = 'rgba(160,190,255,', n = 24) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(t * .05);
  for (let i = 0; i < n; i++) { ctx.rotate(TAU / n); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-r * .06, r); ctx.lineTo(r * .06, r); ctx.closePath(); ctx.fillStyle = lin(ctx, 0, 0, 0, r, [[0, col + '.35)'], [1, col + '0)']]); ctx.fill(); }
  ctx.restore();
}

// ===== characters =====
// A flat, friendly person standing with feet at (x, y). About 520 px tall at s = 1.
// o: robe, sash (null = none), skin, hair, beard (colour or null), arms 'down' | 'crossed' | 'open' | 'point' | 'staff' | 'pray',
//    eyes 'open' | 'closed', look -1..1 (head turn), silhouette true (dark shape with a gold rim, like a figure against the sun), walk (phase, or null)
function figure(ctx, x, y, s = 1, o = {}) {
  const robe = o.robe || '#e9e4da', sash = o.sash === undefined ? '#3b6fd6' : o.sash, skin = o.skin || C.skin0, hair = o.hair || '#4a2e1f';
  const sil = !!o.silhouette, dark = '#120c08', arms = o.arms || 'down', look = o.look || 0;
  const bob = o.walk != null ? Math.abs(Math.sin(o.walk)) * 6 : 0;
  ctx.save(); ctx.translate(x, y - bob); ctx.scale(s, s);
  const fill = (c) => sil ? dark : c;
  // shadow
  if (!sil) { ellipse(ctx, 0, bob + 4, 120, 18); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fill(); }
  // feet
  [-1, 1].forEach(k => { const st = o.walk != null ? Math.sin(o.walk) * 22 * k : 0; ellipse(ctx, k * 34 + st, -8, 34, 14); ctx.fillStyle = fill('#5a3a26'); ctx.fill(); });
  // robe (a slightly flared body)
  ctx.beginPath(); ctx.moveTo(-70, -330); ctx.quadraticCurveTo(-100, -150, -110, -14); ctx.lineTo(110, -14); ctx.quadraticCurveTo(100, -150, 70, -330); ctx.quadraticCurveTo(0, -360, -70, -330); ctx.closePath();
  ctx.fillStyle = sil ? dark : lin(ctx, -110, 0, 110, 0, [[0, shade(robe, -.18)], [.45, robe], [1, shade(robe, -.28)]]); ctx.fill();
  if (!sil) { for (let i = -2; i <= 2; i++) line(ctx, i * 34, -200, i * 40, -20, 3, 'rgba(0,0,0,.08)'); }
  // sash and belt
  if (sash && !sil) {
    ctx.beginPath(); ctx.moveTo(-70, -330); ctx.lineTo(-40, -340); ctx.lineTo(75, -170); ctx.lineTo(50, -150); ctx.closePath(); ctx.fillStyle = lin(ctx, -70, -330, 75, -150, [[0, shade(sash, .15)], [1, sash]]); ctx.fill();
    rrect(ctx, -82, -180, 164, 16, 8); ctx.fillStyle = '#5a3a26'; ctx.fill();
  }
  // arms
  const arm = (x0, y0, ang, len = 170, hand = true) => {
    ctx.save(); ctx.translate(x0, y0); ctx.rotate(ang);
    rrect(ctx, -24, 0, 48, len, 24); ctx.fillStyle = sil ? dark : lin(ctx, -24, 0, 24, 0, [[0, shade(robe, -.25)], [1, shade(robe, -.05)]]); ctx.fill();
    if (hand) { circle(ctx, 0, len + 6, 22); ctx.fillStyle = fill(skin); ctx.fill(); }
    ctx.restore();
  };
  if (arms === 'crossed') { rrect(ctx, -86, -270, 172, 52, 26); ctx.fillStyle = fill(shade(robe, -.12)); ctx.fill(); circle(ctx, 70, -250, 20); circle(ctx, -70, -236, 20); ctx.fillStyle = fill(skin); ctx.fill(); }
  else if (arms === 'pray') { arm(-62, -320, -.55, 120, false); arm(62, -320, .55, 120, false); ellipse(ctx, 0, -228, 20, 36); ctx.fillStyle = fill(skin); ctx.fill(); }
  else if (arms === 'open') { arm(-66, -320, 1.15); arm(66, -320, -1.15); }
  else if (arms === 'point') { arm(-66, -320, .12); arm(66, -320, -1.5, 190); }
  else if (arms === 'staff') {
    arm(-66, -320, .12);
    line(ctx, 112, -470, 112, 0, 12, sil ? dark : '#7a5230'); ctx.beginPath(); ctx.arc(92, -470, 20, 0, Math.PI, true); ctx.strokeStyle = sil ? dark : '#7a5230'; ctx.lineWidth = 12; ctx.stroke();
    arm(66, -320, -.25, 150);
  } else { arm(-66, -320, .12); arm(66, -320, -.12); }
  // neck and head
  rrect(ctx, -20, -370, 40, 40, 10); ctx.fillStyle = fill(shade(skin, -.12)); ctx.fill();
  ctx.save(); ctx.translate(look * 8, 0);
  ellipse(ctx, 0, -430, 62, 72); ctx.fillStyle = sil ? dark : rad(ctx, -20, -455, 5, 80, [[0, skin], [1, shade(skin, -.15)]]); ctx.fill();
  // hair cap
  ctx.beginPath(); ctx.ellipse(0, -448, 66, 60, 0, Math.PI * 1.02, Math.PI * 1.98); ctx.quadraticCurveTo(70, -420, 60, -400); ctx.lineTo(52, -440); ctx.quadraticCurveTo(0, -470, -52, -440); ctx.lineTo(-60, -400); ctx.quadraticCurveTo(-70, -420, -66, -452); ctx.closePath(); ctx.fillStyle = fill(hair); ctx.fill();
  if (o.beard) { ctx.beginPath(); ctx.moveTo(-58, -430); ctx.quadraticCurveTo(-55, -350, 0, -340); ctx.quadraticCurveTo(55, -350, 58, -430); ctx.quadraticCurveTo(30, -395, 0, -398); ctx.quadraticCurveTo(-30, -395, -58, -430); ctx.fillStyle = fill(o.beard); ctx.fill(); }
  if (!sil) {
    const ey = -432;
    if (o.eyes === 'closed') [-1, 1].forEach(k => { ctx.beginPath(); ctx.arc(k * 22 + look * 6, ey, 8, .15 * Math.PI, .85 * Math.PI); ctx.strokeStyle = '#2a1c18'; ctx.lineWidth = 4; ctx.stroke(); });
    else [-1, 1].forEach(k => { ellipse(ctx, k * 22 + look * 8, ey, 6, 8); ctx.fillStyle = '#2a1c18'; ctx.fill(); });
    if (!o.beard) { ctx.beginPath(); ctx.arc(look * 6, -404, 12, .15 * Math.PI, .85 * Math.PI); ctx.strokeStyle = '#8a4a3c'; ctx.lineWidth = 4; ctx.stroke(); }
  }
  ctx.restore();
  ctx.restore();
  // gold rim light for silhouettes against a bright sky
  if (sil && o.rim !== false) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; bloom(ctx, x + 60 * s, y - 300 * s, 260 * s, 'rgba(255,190,90,', .25); ctx.restore(); }
}
// darken (k < 0) or lighten (k > 0) a #rrggbb colour
function shade(hex, k) { if (hex[0] !== '#') return hex; const p = [1, 3, 5].map(i => parseInt(hex.substr(i, 2), 16)); return '#' + p.map(v => Math.round(clamp(k < 0 ? v * (1 + k) : v + (255 - v) * k, 0, 255)).toString(16).padStart(2, '0')).join(''); }

// ===== big gold icons =====
// kind: 'heart' | 'eye' | 'question' | 'star' | 'bulb' | 'check' | 'cross'. p = pop-in, s = scale (about 300 px at s = 1)
function goldIcon(ctx, kind, x, y, s = 1, p = 1, t = 0) {
  if (p <= 0) return;
  const k = backOut(clamp(p * 1.4)), bobY = Math.sin(t * 2) * 6;
  ctx.save(); ctx.translate(x, y + bobY); ctx.scale(s * k, s * k);
  bloom(ctx, 0, 0, 260, 'rgba(255,200,90,', .45);
  const gold = lin(ctx, -150, -150, 150, 150, [[0, '#fff3c2'], [.35, '#f8cf5a'], [.75, '#d99a2b'], [1, '#9b6417']]);
  const out = (path, w = 14) => { path(); ctx.lineJoin = 'round'; ctx.strokeStyle = '#3a2410'; ctx.lineWidth = w; ctx.stroke(); path(); ctx.fillStyle = gold; ctx.fill(); };
  if (kind === 'heart') {
    const hp = () => { ctx.beginPath(); ctx.moveTo(0, 130); ctx.bezierCurveTo(-170, 20, -150, -130, -60, -130); ctx.bezierCurveTo(-20, -130, 0, -100, 0, -75); ctx.bezierCurveTo(0, -100, 20, -130, 60, -130); ctx.bezierCurveTo(150, -130, 170, 20, 0, 130); ctx.closePath(); };
    hp(); ctx.fillStyle = gold; ctx.fill(); ellipse(ctx, -60, -70, 40, 24, -.6); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fill();
  } else if (kind === 'eye') {
    const ep = () => { ctx.beginPath(); ctx.moveTo(-170, 0); ctx.quadraticCurveTo(0, -150, 170, 0); ctx.quadraticCurveTo(0, 150, -170, 0); ctx.closePath(); };
    out(ep, 16); ep(); ctx.save(); ctx.clip(); ctx.fillStyle = '#fbf6ea'; ctx.fillRect(-180, -150, 360, 300);
    circle(ctx, 0, 0, 74); ctx.fillStyle = rad(ctx, 0, 0, 10, 74, [[0, '#7a4a12'], [1, '#c98a2c']]); ctx.fill();
    circle(ctx, 0, 0, 34); ctx.fillStyle = '#1a0f05'; ctx.fill(); circle(ctx, -22, -22, 14); ctx.fillStyle = '#fff'; ctx.fill(); ctx.restore();
  } else if (kind === 'question') {
    const qp = () => { ctx.beginPath(); ctx.moveTo(-95, -60); ctx.bezierCurveTo(-95, -160, 100, -170, 100, -60); ctx.bezierCurveTo(100, 10, 30, 10, 30, 70); ctx.lineTo(-30, 70); ctx.bezierCurveTo(-30, -15, 40, -10, 40, -60); ctx.bezierCurveTo(40, -110, -35, -110, -35, -60); ctx.closePath(); };
    out(qp, 18); circle(ctx, 0, 130, 38); ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 18; ctx.stroke(); ctx.fillStyle = gold; ctx.fill();
  } else if (kind === 'star') {
    const sp = () => { ctx.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 65 : 150, a = -Math.PI / 2 + i * Math.PI / 5; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); };
    out(sp, 12);
  } else if (kind === 'bulb') {
    const bp = () => { ctx.beginPath(); ctx.arc(0, -40, 110, Math.PI * .8, Math.PI * .2); ctx.lineTo(45, 90); ctx.lineTo(-45, 90); ctx.closePath(); };
    out(bp, 14); rrect(ctx, -50, 95, 100, 50, 12); ctx.fillStyle = '#8a8f99'; ctx.fill();
  } else if (kind === 'check') {
    const cp = () => { ctx.beginPath(); ctx.moveTo(-130, 0); ctx.lineTo(-40, 90); ctx.lineTo(140, -100); ctx.lineTo(100, -140); ctx.lineTo(-40, 10); ctx.lineTo(-90, -40); ctx.closePath(); };
    out(cp, 14);
  } else if (kind === 'cross') {
    const xp = () => { rrect(ctx, -28, -150, 56, 300, 10); rrect(ctx, -100, -80, 200, 56, 10); };
    xp(); ctx.fillStyle = gold; ctx.fill();
  }
  ctx.restore();
}

// ===== props that carry words =====
// wooden sign on a post with one or two lines of text (the second in red)
function woodSign(ctx, x, y, s, l1, l2 = '', p = 1) {
  if (p <= 0) return; const k = backOut(clamp(p * 1.4));
  ctx.save(); ctx.translate(x, y); ctx.scale(s * k, s * k);
  rrect(ctx, -14, 40, 28, 220, 6); ctx.fillStyle = '#5a3a22'; ctx.fill();
  rrect(ctx, -230, -110, 460, 180, 18); ctx.fillStyle = lin(ctx, 0, -110, 0, 70, [[0, '#a8713f'], [1, '#6e4524']]); ctx.fill();
  for (let i = 0; i < 3; i++) line(ctx, -215, -60 + i * 50, 215, -60 + i * 50, 3, 'rgba(60,35,15,.35)');
  text(ctx, l1, 0, l2 ? -48 : -20, 60, '#fff3dc', 700); if (l2) text(ctx, l2, 0, 22, 60, C.red, 700);
  ctx.restore();
}
// parchment scroll that unrolls (p 0..1); inside(ctx, w, h) draws on it
function scroll(ctx, x, y, w, h, p = 1, inside) {
  if (p <= 0) return; const hh = h * easeOut(clamp(p));
  ctx.save(); ctx.translate(x, y);
  rrect(ctx, -w / 2, -hh / 2, w, hh, 8); ctx.fillStyle = lin(ctx, 0, -hh / 2, 0, hh / 2, [[0, '#efe0b8'], [.5, '#f7ecd0'], [1, '#e2cd9b']]); ctx.fill();
  if (inside && p > .6) { ctx.save(); rrect(ctx, -w / 2, -hh / 2, w, hh, 8); ctx.clip(); ctx.globalAlpha = clamp((p - .6) / .3); ctx.translate(-w / 2, -h / 2); inside(ctx, w, h); ctx.restore(); }
  [-1, 1].forEach(k => { rrect(ctx, -w / 2 - 20, k * hh / 2 - 18, w + 40, 36, 18); ctx.fillStyle = lin(ctx, 0, k * hh / 2 - 18, 0, k * hh / 2 + 18, [[0, '#c9a46a'], [1, '#7d5a2c']]); ctx.fill(); });
  ctx.restore();
}
// big rubber stamp word that slams in at p ("CIERRE", "VETO", "FALSO")
function stamp(ctx, txt, x, y, size, col, p, rot = -.15) {
  if (p <= 0) return;
  const k = clamp(p), z = lerp(2, 1, easeOut(k)); ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(z, z); ctx.globalAlpha = k;
  ctx.font = `700 ${size}px Inter`; const w = ctx.measureText(txt).width + size * .8;
  rrect(ctx, -w / 2, -size * .75, w, size * 1.5, 16); ctx.fillStyle = 'rgba(10,10,14,.6)'; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = size * .1; ctx.stroke();
  text(ctx, txt, 0, 4, size, col, 700);
  ctx.restore();
}
// calendar page: top = month, big = day
function calendar(ctx, x, y, s, top, big, p = 1) {
  if (p <= 0) return;
  ctx.save(); ctx.translate(x, y); const k = backOut(clamp(p)); ctx.scale(s * k, s * k);
  rrect(ctx, -170, -190, 340, 380, 30); ctx.fillStyle = '#f4f5f7'; ctx.fill();
  ctx.save(); rrect(ctx, -170, -190, 340, 100, 30); ctx.clip(); ctx.fillStyle = '#e0453b'; ctx.fillRect(-170, -190, 340, 100); ctx.restore();
  text(ctx, top, 0, -140, 40, '#fff', 700); text(ctx, big, 0, 40, 170, '#16181d', 700);
  ctx.restore();
}

// ===== counters =====
// dark chip with a big number and a small unit ("969 años"); col = number colour
function chip(ctx, big, unit, x, y, p = 1, col = C.ink, size = 70) {
  if (p <= 0) return; const k = backOut(clamp(p * 1.4));
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.font = `700 ${size}px Inter`; const bw = ctx.measureText(big).width; ctx.font = `700 ${size * .42}px Inter`; const uw = unit ? ctx.measureText(unit).width + size * .15 : 0;
  const w = bw + uw + size * .7, h = size * 1.35;
  rrect(ctx, -w / 2, -h / 2, w, h, size * .3); ctx.fillStyle = 'rgba(16,18,24,.85)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 3; ctx.stroke();
  text(ctx, big, -w / 2 + size * .35, 2, size, col, 700, 'Inter', 'left');
  if (unit) text(ctx, unit, -w / 2 + size * .35 + bw + size * .15, size * .18, size * .42, C.ink, 700, 'Inter', 'left');
  ctx.restore();
}
// a glowing time bar that fills segment by segment (a sum: 187 + 182 + 600 = 969).
// segs = [{v, col, label}], p = how much of the total is filled (0..1), y = bar centre
function segBar(ctx, x, y, w, segs, p = 1, h = 14) {
  const tot = segs.reduce((a, s) => a + s.v, 0); let acc = 0;
  rrect(ctx, x, y - h / 2, w, h, h / 2); ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fill();
  segs.forEach(s => {
    const a = acc / tot, b = (acc + s.v) / tot, e = Math.min(b, p); acc += s.v;
    if (e > a) {
      glow(ctx, () => { ctx.beginPath(); ctx.moveTo(x + w * a, y); ctx.lineTo(x + w * e, y); }, s.col || C.gold, h * .7, 1);
      if (s.label && e >= b - .001) chip(ctx, s.label, '', x + w * (a + b) / 2, y + 70, 1, s.col || C.gold, 40);
    }
  });
}
// tally marks in groups of five, glowing; n marks, drawn up to p (0..1)
function tally(ctx, x, y, n, size = 80, col = C.red, p = 1, cols = 5) {
  const show = Math.floor(n * clamp(p)), gw = size * 1.15, gh = size * 1.4;
  for (let i = 0; i < show; i++) {
    const g = Math.floor(i / 5), j = i % 5, gx = x + (g % cols) * gw * 1.25, gy = y + Math.floor(g / cols) * gh;
    if (j < 4) glow(ctx, () => { ctx.beginPath(); ctx.moveTo(gx + j * size * .25, gy); ctx.lineTo(gx + j * size * .25, gy + size); }, col, size * .07, 1);
    else glow(ctx, () => { ctx.beginPath(); ctx.moveTo(gx - size * .12, gy + size * .75); ctx.lineTo(gx + size * .9, gy + size * .2); }, col, size * .07, 1);
  }
}
// numbered round badges 1..n (gold by default), the ones up to `active` lit
function dots(ctx, n, active, x, y, gap = 70, r = 24, col = C.gold) {
  for (let i = 0; i < n; i++) {
    const cx = x + (i - (n - 1) / 2) * gap, k = clamp(active - i);
    if (k > 0) bloom(ctx, cx, y, r * 2.4, 'rgba(255,200,90,', .45 * k);
    circle(ctx, cx, y, r); ctx.fillStyle = k > 0 ? lerpCol('#2a2d33', col, k) : 'rgba(30,32,38,.8)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 3; ctx.stroke();
    text(ctx, String(i + 1), cx, y + 1, r, k > .5 ? '#1a1206' : '#7d828b', 700);
  }
}

// ===== pictures (paintings, photos) with a slow Ken Burns move =====
// Put images in web/img/ and list them at the top of shots.js: window.IMAGES = { cuadro: 'img/cuadro.jpg' }.
// Only use images the user gives you or that are free to use (public domain art, own photos). Ask before downloading.
const IMG = {}; window.IMG_LOADS = [];
addEventListener('DOMContentLoaded', () => {
  Object.entries(window.IMAGES || {}).forEach(([k, src]) => { const im = new Image(); IMG[k] = im; window.IMG_LOADS.push(new Promise(r => { im.onload = im.onerror = r; })); im.src = src; });
});
// draws the picture to cover the frame; z0 -> z1 zoom over the shot, focus = [fx, fy] 0..1 point to zoom into
function picture(ctx, name, lt, dur = 4, z0 = 1, z1 = 1.15, focus = [.5, .5], warm = .3) {
  const im = IMG[name]; if (!im || !im.naturalWidth) { ctx.fillStyle = '#222'; ctx.fillRect(0, 0, W, H); return; }
  const z = lerp(z0, z1, ease(clamp(lt / dur))), sc = Math.max(W / im.naturalWidth, H / im.naturalHeight) * z;
  const dw = im.naturalWidth * sc, dh = im.naturalHeight * sc, dx = (W - dw) * focus[0], dy = (H - dh) * focus[1];
  ctx.drawImage(im, dx, dy, dw, dh);
  ctx.fillStyle = rad(ctx, W / 2, H * .45, 200, 1200, [[0, `rgba(255,190,110,${.12 * warm})`], [1, 'rgba(0,0,0,.55)']]); ctx.fillRect(0, 0, W, H);
}

// ===== MODO FOTOS REALES: real photos as stage, framed cards and props on top =====
// Photos come from tools/fotos.py (free licences only) into web/img/. List them in shots.js: window.IMAGES = { capitolio: 'img/capitolio.jpg' }.
// photoBg: a real photo filling the frame, slow push-in, optional colour wash (tint 'red' | 'blue' | 'gold' | '#hex'),
// darkened top for captions and a soft vignette. Returns nothing; draw props over it.
function photoBg(ctx, name, lt, o = {}) {
  const im = IMG[name]; if (!im || !im.naturalWidth) { ctx.fillStyle = '#15171c'; ctx.fillRect(0, 0, W, H); return; }
  const dur = o.dur ?? 5, z = lerp(o.z0 ?? 1.04, o.z1 ?? 1.16, ease(clamp(lt / dur))), f = o.focus || [.5, .5];
  const sc = Math.max(W / im.naturalWidth, H / im.naturalHeight) * z, dw = im.naturalWidth * sc, dh = im.naturalHeight * sc;
  ctx.save(); if (o.blur) ctx.filter = `blur(${o.blur}px)`;
  ctx.drawImage(im, (W - dw) * f[0] + (o.panX || 0) * lt, (H - dh) * f[1], dw, dh); ctx.restore();
  const tints = { red: '#c8102e', blue: '#1b4fd8', gold: '#c99a2e' }, tc = tints[o.tint] || o.tint;
  if (tc) { ctx.save(); ctx.globalCompositeOperation = 'color'; ctx.globalAlpha = o.tintK ?? .75; ctx.fillStyle = tc; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = .5; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  const dk = o.dark ?? .45;
  ctx.fillStyle = lin(ctx, 0, 0, 0, 640, [[0, `rgba(0,0,0,${.75 * dk + .2})`], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(0, 0, W, 640);
  ctx.fillStyle = rad(ctx, W / 2, H * .5, 300, 1250, [[0, 'rgba(0,0,0,0)'], [1, `rgba(0,0,0,${dk + .2})`]]); ctx.fillRect(0, 0, W, H);
}
// photoCard: a framed photo (white border, shadow) that drops in at p 0..1, with a coloured name tag.
// o: label, col (tag colour), rot, h (height, default w*1.2), focus [fx, fy] (face ~[.5,.3]), gray 0..1 (loser / past), filter (any canvas filter, e.g. 'hue-rotate(180deg)'), glow colour, sub (small word under tag)
function photoCard(ctx, name, x, y, w, p = 1, o = {}) {
  if (p <= 0) return; const im = IMG[name], h = o.h || w * 1.2, k = backOut(clamp(p)), bw = w * .05;
  ctx.save(); ctx.translate(x, y - (1 - clamp(p * 1.5)) * 120); ctx.rotate((o.rot ?? -.04) + (1 - k) * .25); ctx.scale(k, k);
  if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = 60; }
  else { ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 16; }
  ctx.fillStyle = o.frame || '#f4f1ea'; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.shadowColor = 'transparent';
  const iw = w - 2 * bw, ih = h - 2 * bw - (o.label ? bw * 1.4 : 0);
  ctx.save(); ctx.beginPath(); ctx.rect(-iw / 2, -h / 2 + bw, iw, ih); ctx.clip();
  if (im && im.naturalWidth) {
    const f = o.focus || [.5, .3], sc = Math.max(iw / im.naturalWidth, ih / im.naturalHeight) * (o.zoom || 1);
    const dw = im.naturalWidth * sc, dh = im.naturalHeight * sc;
    if (o.gray) ctx.filter = `grayscale(${o.gray}) brightness(${1 - .45 * o.gray})`;
    if (o.filter) ctx.filter = o.filter;
    ctx.drawImage(im, -iw / 2 + (iw - dw) * f[0], -h / 2 + bw + (ih - dh) * f[1], dw, dh); ctx.filter = 'none';
  } else { ctx.fillStyle = '#333'; ctx.fillRect(-iw / 2, -h / 2 + bw, iw, ih); }
  ctx.restore();
  if (o.label) {
    const fs = Math.max(22, w * .085); ctx.font = `700 ${fs}px Inter`; const tw = ctx.measureText(o.label).width + fs * 1.2;
    ctx.save(); ctx.translate(0, h / 2 - bw * 1.1); ctx.rotate(.03);
    rrect(ctx, -tw / 2, -fs * .75, tw, fs * 1.5, 6); ctx.fillStyle = o.col || C.red; ctx.fill();
    text(ctx, o.label, 0, 2, fs, '#fff', 700); ctx.restore();
  }
  if (o.sub) pill(ctx, o.sub, 0, h / 2 + 70, 1, o.subCol || C.ink, Math.max(24, w * .1));
  ctx.restore();
}
// numbered gold coins on an arc above (cx, cy): "cinco cosas cambian". active = how many lit (can be fractional for pop-in)
function numCoins(ctx, n, shown, cx, cy, r = 330, lit = -1, t = 0) {
  for (let i = 0; i < n; i++) {
    const p = clamp(shown - i); if (p <= 0) continue;
    const a = Math.PI * (1.15 + .7 * i / Math.max(1, n - 1)), x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * .55;
    const k = backOut(p), on = lit < 0 || lit === i + 1, rr = 42 * k;
    ctx.save(); ctx.globalAlpha = on ? 1 : .45; ctx.shadowColor = 'rgba(255,200,80,.7)'; ctx.shadowBlur = on ? 30 : 0;
    circle(ctx, x, y + Math.sin(t * 2 + i) * 4, rr); ctx.fillStyle = rad(ctx, x - rr * .3, y - rr * .3, 2, rr * 1.2, [[0, '#fff1b8'], [.5, '#f5c451'], [1, '#a8741a']]); ctx.fill();
    ctx.shadowBlur = 0; text(ctx, String(i + 1), x, y + Math.sin(t * 2 + i) * 4 + 2, rr * 1.05, '#4a2e08', 700); ctx.restore();
  }
}
// an official-looking document (CITACIÓN, LEY...) with header, title, lines and an optional red wax seal
function docSheet(ctx, x, y, s, title, p = 1, o = {}) {
  if (p <= 0) return; const k = backOut(clamp(p));
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot ?? -.03); ctx.scale(s * k, s * k);
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 14;
  rrect(ctx, -230, -300, 460, 600, 6); ctx.fillStyle = lin(ctx, 0, -300, 0, 300, [[0, '#f6f1e4'], [1, '#e2d9c2']]); ctx.fill(); ctx.shadowColor = 'transparent';
  if (o.header) text(ctx, o.header, 0, -250, 18, '#5a5244', 700);
  text(ctx, title, 0, -190, 56, '#2a2620', 700); line(ctx, -170, -150, 170, -150, 3, '#2a2620');
  for (let i = 0; i < 9; i++) { ctx.fillStyle = 'rgba(60,55,45,.55)'; ctx.fillRect(-170, -110 + i * 34, i % 3 === 2 ? 200 : 340, 8); }
  ctx.beginPath(); ctx.moveTo(-160, 230); ctx.bezierCurveTo(-120, 200, -90, 260, -40, 225); ctx.strokeStyle = '#2b3a6b'; ctx.lineWidth = 4; ctx.stroke();
  if (o.seal) { circle(ctx, 150, 220, 52); ctx.fillStyle = rad(ctx, 135, 205, 4, 60, [[0, '#ff5a5a'], [1, '#9a1010']]); ctx.fill(); circle(ctx, 150, 220, 30); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 4; ctx.stroke(); }
  if (o.stampTxt) stamp(ctx, o.stampTxt, 0, 120, 70, C.red, o.stampP ?? 1);
  ctx.restore();
}
// paper sheets bursting out of (x, y) from time t0; n sheets fly up and fall
function paperBurst(ctx, x, y, t, t0, n = 26, seed = 3) {
  const dt = t - t0; if (dt < 0 || dt > 3) return; const R = rng(seed);
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (R() - .5) * 2.6, v = 700 + R() * 900, px = x + Math.cos(a) * v * dt, py = y + Math.sin(a) * v * dt + 900 * dt * dt;
    ctx.save(); ctx.translate(px, py); ctx.rotate(R() * 6 + dt * (R() * 6 - 3)); ctx.globalAlpha = clamp((3 - dt) / .6);
    ctx.fillStyle = '#f4f1ea'; ctx.fillRect(-34, -44, 68, 88); ctx.fillStyle = 'rgba(60,55,45,.5)';
    for (let j = 0; j < 4; j++) ctx.fillRect(-24, -30 + j * 16, 48, 4); ctx.restore();
  }
}
// prison bars dropping over the frame (p 0..1), metallic
function jailBars(ctx, p, n = 6, col = '#b9bec6') {
  if (p <= 0) return; const drop = (1 - easeOut(clamp(p))) * -H, gap = W / n;
  ctx.save(); ctx.translate(0, drop);
  for (let i = 0; i < n; i++) { const x = gap * (i + .5); ctx.fillStyle = lin(ctx, x - 14, 0, x + 14, 0, [[0, '#5d636c'], [.45, col], [1, '#3e434a']]); ctx.fillRect(x - 14, 0, 28, H); }
  [H * .3, H * .72].forEach(y => { ctx.fillStyle = lin(ctx, 0, y - 16, 0, y + 16, [[0, '#6d737c'], [.5, col], [1, '#3e434a']]); ctx.fillRect(0, y - 16, W, 32); });
  ctx.restore();
}
// a glass that fills to `level` 0..1 with a dashed target line and its number ("faltan 67")
function glassMeter(ctx, x, y, w, h, level, target, label, col = '#4fa8ff') {
  const lv = clamp(level);
  ctx.save(); ctx.beginPath(); ctx.moveTo(x - w / 2, y - h); ctx.lineTo(x - w * .42, y); ctx.lineTo(x + w * .42, y); ctx.lineTo(x + w / 2, y - h); ctx.closePath();
  ctx.fillStyle = 'rgba(200,220,255,.08)'; ctx.fill(); ctx.strokeStyle = 'rgba(220,235,255,.7)'; ctx.lineWidth = 6; ctx.stroke(); ctx.clip();
  const ly = y - h * lv; ctx.fillStyle = lin(ctx, 0, ly, 0, y, [[0, col], [1, shade(col, -.4)]]); ctx.fillRect(x - w, ly, w * 2, h);
  ctx.restore();
  line(ctx, x - w * .38, y - h + 30, x - w * .38, y - 30, 8, 'rgba(255,255,255,.25)');
  if (target != null) { const ty = y - h * target; ctx.setLineDash([18, 12]); line(ctx, x - w * .6, ty, x + w * .6, ty, 5, C.red); ctx.setLineDash([]); if (label) text(ctx, label, x + w * .6 + 60, ty, 52, C.red, 700); }
}

// ===== reusable from past videos =====
// big hook title in the middle of the first frames (so the thumbnail shows the question). *word* = gold
function hookTitle(ctx, lt, txt, until = 1.8, y = 1050, size = 92) {
  const a = clamp((until - lt) / .3); if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a; ctx.font = `700 ${size}px Inter`;
  const words = txt.split(' '), lines = []; let cur = '';
  words.forEach(w => { const test = (cur ? cur + ' ' : '') + w; if (ctx.measureText(test.replace(/\*/g, '')).width > 900 && cur) { lines.push(cur); cur = w; } else cur = test; });
  lines.push(cur);
  lines.forEach((ln, i) => {
    const yy = y + (i - (lines.length - 1) / 2) * size * 1.15; const full = ln.replace(/\*/g, ''); let x = 540 - ctx.measureText(full).width / 2;
    ln.split(' ').forEach(w => { const gold = w.includes('*'), s = w.replace(/\*/g, '') + ' '; ctx.shadowColor = 'rgba(0,0,0,.85)'; ctx.shadowBlur = 24; text(ctx, s, x, yy, size, gold ? C.gold : '#fff', 700, 'Inter', 'left'); x += ctx.measureText(s).width; });
  });
  ctx.restore();
}
// a hanging price tag. hi = highlight of the first digit 0..1 (gold box around it), col = price colour
function priceTag(ctx, x, y, s, price, o = {}) {
  const p = o.p ?? 1; if (p <= 0) return;
  const sw = Math.sin((o.t || 0) * 1.6) * .05 * (o.swing ?? 1), k = backOut(clamp(p * 1.4));
  ctx.save(); ctx.translate(x, y - 260 * s); ctx.rotate(sw); ctx.scale(s * k, s * k);
  line(ctx, 0, -200, 0, 60, 4, 'rgba(230,220,200,.7)');
  const w = o.w || 560, h = 280;
  ctx.beginPath(); ctx.moveTo(-w / 2 + 70, 60); ctx.lineTo(w / 2, 60); ctx.lineTo(w / 2, 60 + h); ctx.lineTo(-w / 2 + 70, 60 + h); ctx.lineTo(-w / 2, 60 + h / 2); ctx.closePath();
  ctx.fillStyle = lin(ctx, 0, 60, 0, 60 + h, [[0, o.bg || '#fbf3dd'], [1, shade(o.bg || '#fbf3dd', -.12)]]); ctx.fill();
  circle(ctx, -w / 2 + 70, 60 + h / 2, 18); ctx.fillStyle = '#2a2420'; ctx.fill();
  ctx.font = `700 150px Inter`; const tw = ctx.measureText(price).width, x0 = 40 - tw / 2;
  const first = price.match(/\d/), fi = first ? price.indexOf(first[0]) : 0, pre = ctx.measureText(price.slice(0, fi)).width, dw = ctx.measureText(price[fi]).width;
  const hi = o.hi || 0, dim = o.dim || 0;
  text(ctx, price.slice(0, fi), x0, 60 + h / 2 + 6, 150, o.col || '#1d1a17', 700, 'Inter', 'left');
  text(ctx, price[fi], x0 + pre, 60 + h / 2 + 6, 150, hi > .5 ? '#c27a00' : (o.col || '#1d1a17'), 700, 'Inter', 'left');
  ctx.globalAlpha = 1 - .75 * dim; text(ctx, price.slice(fi + 1), x0 + pre + dw, 60 + h / 2 + 6, 150, o.col || '#1d1a17', 700, 'Inter', 'left'); ctx.globalAlpha = 1;
  if (hi > 0) { ctx.globalAlpha = hi; ctx.strokeStyle = C.blue; ctx.lineWidth = 6; ctx.strokeRect(x0 + pre - 10, 60 + h / 2 - 80, dw + 20, 170); circle(ctx, x0 + pre - 10, 60 + h / 2 - 80, 12); circle(ctx, x0 + pre + dw + 10, 60 + h / 2 + 90, 12); ctx.fillStyle = '#fff'; ctx.fill(); ctx.globalAlpha = 1; }
  ctx.restore();
}
// bar chart: vals 0..1, labels under each bar, grows in at p 0..2
function bars(ctx, x, y, vals, labels, p = 1, cols) {
  vals.forEach((v, i) => {
    const bx = x + i * 220, h = 420 * v * easeOut(clamp(p - i * .25));
    if (clamp(p - i * .25) <= 0) return;
    rrect(ctx, bx - 70, y - h, 140, h, 14); ctx.fillStyle = lin(ctx, 0, y - h, 0, y, [[0, (cols && cols[i]) || C.gold], [1, shade((cols && cols[i]) || C.gold, -.4)]]); ctx.fill();
    text(ctx, labels[i], bx, y + 50, 46, C.ink, 700);
  });
}
