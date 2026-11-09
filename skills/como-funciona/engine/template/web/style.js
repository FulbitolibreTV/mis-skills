// ---------- the look: dark studio, illustrated objects, golden glow, technical labels ----------
const C = {
  bg0: '#06070a', bg1: '#12141a',
  gold: '#f5c451', goldHot: '#fff0c4', amber: '#ff9f2e',
  cyan: '#5ef0d4', red: '#ff4f63', green: '#33d17a', blue: '#5b8cff',
  ink: '#eef1f5', dim: '#80858f', faint: '#3a3e47',
  skin0: '#f3c9b1', skin1: '#d39a82', skin2: '#a96f5c', nail: '#f7ddd2',
  slate0: '#4a505b', slate1: '#2a2e36', slate2: '#16191e',
};

// the world behind the objects. theme (or window.THEME for the whole reel), chosen to fit the topic:
//   'estudio' near-black studio with a warm pool of light and dust (default, objects and devices)
//   'piel'    warm skin filling the frame, for the body seen up close (eyes, hands, muscles)
//   'noche'   navy night over a warm desk or floor, for everyday-life scenes (stress, sleep, habits)
//   'neon'    a night city with lit windows under a purple sky, for metaphors and big-picture ideas
function background(ctx, t, gx = 540, gy = 960, warm = .5, seed = 1, theme = window.THEME || 'estudio') {
  if (theme === 'piel') {
    ctx.fillStyle = lin(ctx, 0, 0, 0, H, [[0, '#9c6a55'], [.35, '#e2ae93'], [.65, '#d99f84'], [1, '#8a5a47']]); ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = rad(ctx, gx, gy, 0, 900, [[0, 'rgba(255,225,205,.35)'], [1, 'rgba(255,225,205,0)']]); ctx.fillRect(0, 0, W, H);
    const R = rng(seed + 5); ctx.fillStyle = 'rgba(120,60,45,.10)'; for (let i = 0; i < 420; i++) { circle(ctx, R() * W, R() * H, 1 + R() * 2); ctx.fill(); }
    return;
  }
  if (theme === 'noche') {
    ctx.fillStyle = lin(ctx, 0, 0, 0, H, [[0, '#0b1230'], [.55, '#1a2350'], [.56, '#3a2716'], [1, '#1c120a']]); ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = rad(ctx, gx, gy, 0, 800, [[0, `rgba(255,190,110,${.3 * warm})`], [1, 'rgba(255,190,110,0)']]); ctx.fillRect(0, 0, W, H);
    dust(ctx, t, 30, seed); return;
  }
  if (theme === 'neon') {
    ctx.fillStyle = lin(ctx, 0, 0, 0, H, [[0, '#1a0f3a'], [.45, '#3b1d63'], [.62, '#a3366f'], [.7, '#20123d'], [1, '#0a0716']]); ctx.fillRect(0, 0, W, H);
    skyline(ctx, t, 1340, .55, seed + 1, .5); skyline(ctx, t, 1420, 1, seed + 2, 1);
    return;
  }
  ctx.fillStyle = lin(ctx, 0, 0, 0, H, [[0, C.bg0], [.55, C.bg1], [1, C.bg0]]); ctx.fillRect(0, 0, W, H);
  if (warm > 0) { ctx.fillStyle = rad(ctx, gx, gy, 0, 900, [[0, `rgba(120,80,30,${.35 * warm})`], [.45, `rgba(60,40,20,${.18 * warm})`], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(0, 0, W, H); }
  dust(ctx, t, 46, seed);
}
// rows of towers with warm lit windows; depth 0..1 (far towers are smaller, darker and drift slower)
function skyline(ctx, t, base, depth = 1, seed = 1, drift = 1) {
  const R = rng(seed * 31); let x = -60 - ((t * 14 * drift) % 200);
  ctx.save();
  while (x < W + 60) {
    const w = (70 + R() * 90) * depth, h = (250 + R() * 650) * depth, top = base - h;
    ctx.fillStyle = depth < .8 ? '#24173f' : '#170f2c'; ctx.fillRect(x, top, w, h + 600);
    for (let wy = top + 14; wy < base - 10; wy += 22 * depth) for (let wx = x + 8; wx < x + w - 8; wx += 16 * depth)
      if (R() < .42) { ctx.fillStyle = R() < .8 ? `rgba(255,214,140,${.5 + .5 * depth})` : 'rgba(150,200,255,.8)'; ctx.fillRect(wx, wy, 6 * depth, 9 * depth); }
    x += w + 6 + R() * 20;
  }
  ctx.restore();
}
function dust(ctx, t, n = 40, seed = 1) {
  const R = rng(seed * 97 + 3); ctx.save();
  for (let i = 0; i < n; i++) {
    const x0 = R() * W, y0 = R() * H, sp = 6 + R() * 14, r = .8 + R() * 2.2, ph = R() * TAU;
    const x = (x0 + Math.sin(t * .3 + ph) * 18 + W) % W, y = ((y0 - t * sp) % H + H) % H;
    ctx.globalAlpha = (.25 + .45 * R()) * (.6 + .4 * Math.sin(t * 1.3 + ph)); circle(ctx, x, y, r); ctx.fillStyle = '#d8d3c4'; ctx.fill();
  }
  ctx.restore();
}

// camera: zoom s around world point (cx, cy) placed at screen (px, py); slow handheld drift
function cam(ctx, s, cx = 540, cy = 960, t = 0, drift = 1, px = 540, py = 960) {
  const dx = drift * (Math.sin(t * .7) * 6 + Math.sin(t * 1.9 + 1) * 2), dy = drift * (Math.sin(t * .55 + 2) * 6 + Math.sin(t * 1.6) * 2);
  ctx.translate(px + dx, py + dy); ctx.scale(s, s); ctx.translate(-cx, -cy);
}

// glowing stroke: wide soft passes + bright core, added with 'lighter'
function glow(ctx, drawPath, col = C.gold, w = 4, k = 1) {
  if (k <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  [[w * 7, .05], [w * 3.5, .12], [w * 1.6, .35]].forEach(([lw, a]) => { drawPath(); ctx.lineWidth = lw; ctx.strokeStyle = col; ctx.globalAlpha = a * k; ctx.stroke(); });
  drawPath(); ctx.lineWidth = w; ctx.strokeStyle = col; ctx.globalAlpha = Math.min(1, k); ctx.stroke();
  drawPath(); ctx.lineWidth = w * .4; ctx.strokeStyle = C.goldHot; ctx.globalAlpha = .8 * Math.min(1, k); ctx.stroke();
  ctx.restore();
}
// soft light blob (additive)
function bloom(ctx, x, y, r, col = 'rgba(255,190,80,', a = .5) {
  if (a <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = rad(ctx, x, y, 0, r, [[0, col + a + ')'], [.4, col + a * .35 + ')'], [1, col + '0)']]); ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  ctx.restore();
}
// a glowing sine wave from x1 to x2 (progress p draws it left to right)
function wave(ctx, x1, x2, y, amp, len, phase, col = C.gold, w = 4, k = 1, p = 1) {
  const xe = lerp(x1, x2, p); if (xe <= x1 + 1) return;
  glow(ctx, () => { ctx.beginPath(); for (let x = x1; x <= xe; x += 6) { const y2 = y + Math.sin((x - x1) / len * TAU - phase) * amp; x === x1 ? ctx.moveTo(x, y2) : ctx.lineTo(x, y2); } }, col, w, k);
}

// technical label: a dot on the object, a thin leader line, CAPS text. p = 0..1 reveal
function label(ctx, txt, ax, ay, tx, ty, p = 1, col = C.ink, size = 30) {
  if (p <= 0) return;
  const a = easeOut(clamp(p * 1.6)), b = clamp((p - .35) / .65);
  ctx.save();
  circle(ctx, ax, ay, 6); ctx.fillStyle = col; ctx.globalAlpha = a; ctx.fill(); circle(ctx, ax, ay, 12 * a); ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.globalAlpha = .4 * a; ctx.stroke();
  ctx.globalAlpha = 1; line(ctx, ax, ay, lerp(ax, tx, a), lerp(ay, ty + (ty > ay ? -size * .7 : size * .7), a), 2, col);
  ctx.globalAlpha = b; ctx.translate(0, (1 - easeOut(b)) * 8); caps(ctx, txt, tx, ty, size, col);
  ctx.restore();
}
// CAPS with letter spacing
function caps(ctx, txt, x, y, size = 30, col = C.ink, weight = 700, align = 'center', sp = .14) {
  ctx.save(); ctx.font = `${weight} ${size}px Inter`; ctx.letterSpacing = `${size * sp}px`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillStyle = col;
  ctx.fillText(txt.toUpperCase(), x + (align === 'center' ? size * sp / 2 : 0), y); ctx.restore();
}
function mono(ctx, txt, x, y, size = 40, col = C.ink, align = 'center') { text(ctx, txt, x, y, size, col, 500, 'JetBrains Mono', align); }
// big readout: a number with a small caps unit line under it, in a dark pill
function readout(ctx, big, small, x, y, size = 92, p = 1, col = C.ink) {
  if (p <= 0) return;
  ctx.save(); ctx.globalAlpha = clamp(p * 2); ctx.translate(x, y); ctx.scale(.9 + .1 * easeOut(clamp(p * 2)), .9 + .1 * easeOut(clamp(p * 2)));
  ctx.font = `500 ${size}px JetBrains Mono`; const w = Math.max(ctx.measureText(big).width, 200) + 80;
  rrect(ctx, -w / 2, -size * .75, w, size * (small ? 1.9 : 1.5), 22); ctx.fillStyle = 'rgba(12,13,16,.86)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 2; ctx.stroke();
  mono(ctx, big, 0, 0, size, col); if (small) caps(ctx, small, 0, size * .82, size * .26, C.dim, 700);
  ctx.restore();
}
// dimension line between two points with a mono value
function dimLine(ctx, x1, y1, x2, y2, txt, p = 1, col = C.ink) {
  if (p <= 0) return;
  const e = easeOut(p), mx = (x1 + x2) / 2, my = (y1 + y2) / 2, ang = Math.atan2(y2 - y1, x2 - x1), nx = -Math.sin(ang) * 12, ny = Math.cos(ang) * 12;
  ctx.save(); ctx.globalAlpha = .9;
  line(ctx, lerp(mx, x1, e), lerp(my, y1, e), lerp(mx, x2, e), lerp(my, y2, e), 2, col);
  [[x1, y1], [x2, y2]].forEach(([x, y]) => line(ctx, x - nx, y - ny, x + nx, y + ny, 2, col));
  ctx.globalAlpha = clamp(p * 2 - 1); mono(ctx, txt, mx + nx * 4, my + ny * 4, 28, col, 'left');
  ctx.restore();
}
// Figma-like check / cross badges
function check(ctx, x, y, r, p, col = C.green) {
  if (p <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(backOut(clamp(p * 1.5)), backOut(clamp(p * 1.5)));
  circle(ctx, 0, 0, r); ctx.fillStyle = col; ctx.fill();
  const q = clamp(p * 2 - .6); ctx.beginPath(); ctx.moveTo(-r * .42, 0); ctx.lineTo(-r * .1, r * .3); ctx.lineTo(r * .45, -r * .32);
  ctx.setLineDash([r * 2, r * 2]); ctx.lineDashOffset = r * 2 * (1 - q); ctx.lineWidth = r * .18; ctx.strokeStyle = '#fff'; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.restore();
}

// ---------- props ----------
// a finger: tip at (x, y), pointing along angle ang (radians, 0 = right), s = scale. press 0..1 flattens the pad a little
function finger(ctx, x, y, ang, s = 1, len = 520, press = 0) {
  const wd = 150;
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
  // drop shadow
  ctx.save(); ctx.translate(-len / 2, 26); ctx.scale(1, .5); ctx.fillStyle = 'rgba(0,0,0,.35)'; ellipse(ctx, 0, 0, len / 2 + 30, wd * .55); ctx.fill(); ctx.restore();
  const body = () => { ctx.beginPath(); ctx.moveTo(-len, -wd / 2); ctx.lineTo(-wd / 2, -wd / 2); ctx.arc(-wd / 2, 0, wd / 2, -Math.PI / 2, Math.PI / 2); ctx.lineTo(-len, wd / 2); ctx.closePath(); };
  body(); ctx.fillStyle = lin(ctx, 0, -wd / 2, 0, wd / 2, [[0, C.skin0], [.55, C.skin1], [1, C.skin2]]); ctx.fill();
  // tip warmth + pad
  ctx.save(); body(); ctx.clip();
  ctx.fillStyle = rad(ctx, -wd * .3, wd * .2, 0, wd * .9, [[0, 'rgba(240,150,130,.35)'], [1, 'rgba(240,150,130,0)']]); ctx.fillRect(-wd * 1.4, -wd, wd * 1.5, wd * 2);
  // creases
  ctx.strokeStyle = 'rgba(120,60,50,.35)'; ctx.lineWidth = 3;
  [1.9, 2.15].forEach(k => { ctx.beginPath(); ctx.ellipse(-wd * k, 0, wd * .12, wd * .42, 0, -1.2, 1.2); ctx.stroke(); });
  ctx.restore();
  // nail on the top side
  rrect(ctx, -wd * 1.15, -wd / 2 + 4, wd * .95, wd * .3, [wd * .18, wd * .3, wd * .3, wd * .18]); ctx.fillStyle = lin(ctx, 0, -wd / 2, 0, -wd * .2, [[0, '#fff3ec'], [1, C.nail]]); ctx.fill();
  rrect(ctx, -wd * .52, -wd / 2 + 6, wd * .3, wd * .25, wd * .12); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fill();
  if (press > 0) { ellipse(ctx, -wd * .25, wd * .42, wd * .3 * press, wd * .08 * press); ctx.fillStyle = 'rgba(255,220,200,.4)'; ctx.fill(); }
  ctx.restore();
}
// pseudo-3D box: front face (x, y, w, h), top face going back by d (perspective up), r = corner radius
function box3d(ctx, x, y, w, h, d, front, top, side, r = 26) {
  ctx.save();
  if (d > 0) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + d * .6 + r, y - d); ctx.lineTo(x + w + d * .6 - r, y - d); ctx.lineTo(x + w - r, y); ctx.closePath(); ctx.fillStyle = top; ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + w - 2, y + r); ctx.lineTo(x + w + d * .6 - 2, y - d + r); ctx.lineTo(x + w + d * .6 - 2, y + h - d - r); ctx.lineTo(x + w - 2, y + h - r); ctx.closePath(); ctx.fillStyle = side; ctx.fill();
  }
  rrect(ctx, x, y, w, h, r); ctx.fillStyle = front; ctx.fill();
  rrect(ctx, x + 1, y + 1, w - 2, h - 2, r); ctx.strokeStyle = 'rgba(255,255,255,.10)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
}
// a phone: body + screen callback drawn in screen coords (0,0)-(sw,sh)
function phone(ctx, x, y, w, h, drawScreen) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.5)'; rrect(ctx, x + 10, y + 24, w, h, 70); ctx.fill();
  rrect(ctx, x, y, w, h, 70); ctx.fillStyle = lin(ctx, x, 0, x + w, 0, [[0, '#2b2f37'], [.5, '#191b20'], [1, '#2b2f37']]); ctx.fill();
  const m = 16, sx = x + m, sy = y + m, sw = w - 2 * m, sh = h - 2 * m;
  rrect(ctx, sx, sy, sw, sh, 56); ctx.fillStyle = '#0c0d10'; ctx.fill(); ctx.save(); rrect(ctx, sx, sy, sw, sh, 56); ctx.clip(); ctx.translate(sx, sy); drawScreen && drawScreen(ctx, sw, sh); ctx.restore();
  rrect(ctx, x + w / 2 - 70, y + 34, 140, 40, 20); ctx.fillStyle = '#000'; ctx.fill();
  rrect(ctx, x + 1, y + 1, w - 2, h - 2, 70); ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = 3; ctx.stroke();
  ctx.restore();
}
// simple flat avatar
function avatar(ctx, x, y, r, skin, hair, shirt, bg) {
  ctx.save(); circle(ctx, x, y, r); ctx.fillStyle = bg; ctx.fill(); ctx.clip();
  ellipse(ctx, x, y + r * .95, r * .75, r * .5); ctx.fillStyle = shirt; ctx.fill();
  circle(ctx, x, y + r * .02, r * .38); ctx.fillStyle = skin; ctx.fill();
  ctx.beginPath(); ctx.arc(x, y - r * .08, r * .42, Math.PI * 1.05, Math.PI * 1.95); ctx.closePath(); ctx.fillStyle = hair; ctx.fill();
  circle(ctx, x - r * .13, y + r * .04, r * .04); circle(ctx, x + r * .13, y + r * .04, r * .04); ctx.fillStyle = '#2a1c18'; ctx.fill();
  ctx.restore();
}
// ending call to action: a share sheet on a phone, a finger taps a contact, then "Enviar".
// lt = time in the shot; tTap / tSend = when the finger taps; preview(ctx, w, h) draws the video thumbnail
function shareScene(ctx, lt, tTap, tSend, preview) {
  const rise = easeOut(clamp(lt / .5)), px = 200, pw = 680, ph = 1180, py = lerp(1900, 470, rise);
  const people = [['Carla', C.skin0, '#3b2418', '#d9534f', '#f0a35e'], ['Leo', '#c98a6b', '#1d1512', '#3c7dd9', '#7ac1a4'], ['Nuria', '#f1c7a5', '#a5462a', '#8e5bd6', '#e7c75a'], ['Iván', '#b9785c', '#2b1d17', '#2fa37a', '#e38fb1']];
  const tapped = lt > tTap + .12, sent = lt > tSend + .12;
  phone(ctx, px, py, pw, ph, (c, sw, sh) => {
    c.fillStyle = '#0e0f13'; c.fillRect(0, 0, sw, sh);
    c.save(); preview && preview(c, sw, sh * .48); c.restore();
    const sy = sh * .44; rrect(c, 0, sy, sw, sh - sy + 60, 40); c.fillStyle = '#1b1d22'; c.fill();
    rrect(c, sw / 2 - 40, sy + 16, 80, 8, 4); c.fillStyle = '#4a4d55'; c.fill();
    rrect(c, 30, sy + 50, sw - 60, 64, 18); c.fillStyle = '#2a2d33'; c.fill(); text(c, 'Buscar', 80, sy + 82, 26, '#8b8f97', 500, 'Inter', 'left');
    circle(c, 58, sy + 82, 10); c.strokeStyle = '#8b8f97'; c.lineWidth = 3; c.stroke();
    people.forEach(([n, sk, hr, sh2, bg], i) => {
      const ax = 95 + i * (sw - 190) / 3, ay = sy + 220;
      avatar(c, ax, ay, 56, sk, hr, sh2, bg); text(c, n, ax, ay + 88, 24, '#d5d8de', 600);
      if (i === 1) { if (tapped) { circle(c, ax, ay, 63); c.strokeStyle = C.blue; c.lineWidth = 5; c.stroke(); } check(c, ax + 42, ay + 40, 18, clamp((lt - tTap - .1) / .3), C.blue); }
    });
    rrect(c, 30, sy + 360, sw - 60, 60, 16); c.fillStyle = '#24272d'; c.fill(); text(c, 'Escribe un mensaje…', 56, sy + 390, 24, '#6f737b', 500, 'Inter', 'left');
    const by = sy + 445, pressed = Math.abs(lt - tSend - .06) < .08;
    rrect(c, 30, by, sw - 60, 80, 20); c.fillStyle = sent ? '#2a2d33' : (tapped ? (pressed ? '#3f6fd8' : C.blue) : '#33405e'); c.fill();
    text(c, sent ? '✓ Enviado' : 'Enviar', sw / 2, by + 41, 30, '#fff', 700);
  });
  // the finger comes in from the bottom right, taps the contact, then the button
  const sx = px + 16, sy = py + 16 + (ph - 32) * .44, ax = sx + 95 + (pw - 32 - 190) / 3, ay = sy + 220, bx = px + pw / 2 + 60, byy = sy + 445 + 40;
  const fx = kf(lt, [[tTap - .6, 1150], [tTap, ax], [tTap + .35, ax + 40], [tSend - .05, bx], [tSend + .6, 1150]]);
  const fy = kf(lt, [[tTap - .6, 1900], [tTap, ay + 10], [tTap + .35, ay + 80], [tSend - .05, byy], [tSend + .6, 1900]]);
  const press = Math.max(clamp(1 - Math.abs(lt - tTap) / .12), clamp(1 - Math.abs(lt - tSend) / .12));
  if (lt > tTap - .6 && lt < tSend + .6) finger(ctx, fx, fy, -Math.PI / 2 - .35, .62 * (1 - .04 * press), 640, press);
}

// ---------- extra pieces seen in the references ----------
// dark rounded pill with a short caps label ("DÍA 1", "IZQUIERDO", "link en la bio"); p = pop-in progress
function pill(ctx, txt, x, y, p = 1, col = C.ink, size = 28, bg = 'rgba(20,22,28,.82)') {
  if (p <= 0) return;
  ctx.save(); ctx.translate(x, y); const k = backOut(clamp(p * 1.5)); ctx.scale(k, k);
  ctx.font = `700 ${size}px Inter`; const w = ctx.measureText(txt).width + size * 1.4;
  rrect(ctx, -w / 2, -size * .9, w, size * 1.8, size * .5); ctx.fillStyle = bg; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = 2; ctx.stroke();
  text(ctx, txt, 0, 1, size, col, 700);
  ctx.restore();
}
// numbered step badges 1..n in a row, the ones up to `active` lit (for "1, 2, 3" lists or causes)
function steps(ctx, n, active, x, y, gap = 120, size = 64) {
  for (let i = 0; i < n; i++) {
    const cx = x + (i - (n - 1) / 2) * gap, on = i < active, k = clamp(active - i);
    rrect(ctx, cx - size / 2, y - size / 2, size, size, 14); ctx.fillStyle = on ? lerpCol('#2a2d33', '#ff4f63', k) : 'rgba(30,32,38,.75)'; ctx.fill();
    text(ctx, String(i + 1), cx, y + 2, size * .5, on ? '#fff' : '#7d828b', 700);
  }
}
function lerpCol(a, b, k) { const p = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16)); const A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], k))).join(',')})`; }
// comment bubble that "types" (three dots) and can then show a short text
function bubble(ctx, x, y, t, p = 1, txt = '') {
  if (p <= 0) return;
  ctx.save(); ctx.translate(x, y); const k = backOut(clamp(p * 1.5)); ctx.scale(k, k);
  const w = txt ? Math.max(170, txt.length * 22 + 60) : 170;
  rrect(ctx, -w / 2, -52, w, 104, 30); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(-w / 2 + 40, 40); ctx.lineTo(-w / 2 + 30, 82); ctx.lineTo(-w / 2 + 78, 46); ctx.fill();
  if (txt) text(ctx, txt, 0, 0, 36, '#16181d', 700);
  else for (let i = 0; i < 3; i++) { circle(ctx, (i - 1) * 34, Math.sin(t * 9 - i) * 5, 11); ctx.fillStyle = '#3a3e47'; ctx.fill(); }
  ctx.restore();
}
// "comment A or B" ending: two option pills over the scene and a typing bubble. tAsk = when the question is said
function commentAsk(ctx, lt, tAsk, a, b, ax = 300, bx = 780, y = 1420) {
  pill(ctx, a, ax, y, (lt - tAsk) / .35, C.ink); pill(ctx, b, bx, y, (lt - tAsk - .15) / .35, C.ink);
  bubble(ctx, 540, y + 190, lt, (lt - tAsk - .4) / .35);
}
