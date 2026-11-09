// ---------- props for this reel: road from above, cars, speedometer, brain, building, rain, fuel ----------
const PX = 7.2;   // pixels per metre in the braking diagrams
// physics (dry asphalt): 1 s to react, then about 7 m/s² of braking
const REACT = 1, DEC = 7, DEC_WET = 4.5;
const mps = kmh => kmh / 3.6;
function pos(kmh, s, dec = DEC) { const v = mps(kmh); if (s <= REACT) return v * s; const tb = Math.min(s - REACT, v / dec); return v * REACT + v * tb - dec * tb * tb / 2; }
function speedAt(kmh, s, dec = DEC) { const v = mps(kmh); return s <= REACT ? kmh : Math.max(0, v - dec * (s - REACT)) * 3.6; }
const stopDist = (kmh, dec = DEC) => mps(kmh) * REACT + mps(kmh) ** 2 / (2 * dec);

// a straight road seen from above, cars drive up the screen. scroll in px moves the lane marks down
function road(ctx, x, w, scroll = 0, wet = 0) {
  ctx.save();
  ctx.fillStyle = lin(ctx, x, 0, x + w, 0, [[0, '#15171b'], [.5, '#22252b'], [1, '#15171b']]); ctx.fillRect(x, 0, w, H);
  const R = rng(4); ctx.fillStyle = 'rgba(255,255,255,.035)'; for (let i = 0; i < 300; i++) ctx.fillRect(x + R() * w, ((R() * H + scroll) % H + H) % H, 3, 3);
  ctx.fillStyle = '#d9dce1'; ctx.fillRect(x + 14, 0, 6, H); ctx.fillRect(x + w - 20, 0, 6, H);
  for (let y = (scroll % 120) - 120; y < H; y += 120) { rrect(ctx, x + w / 2 - 4, y, 8, 64, 4); ctx.fill(); }
  if (wet > 0) { ctx.globalAlpha = wet; ctx.fillStyle = lin(ctx, x, 0, x + w, 0, [[0, 'rgba(120,160,220,0)'], [.5, 'rgba(120,160,220,.10)'], [1, 'rgba(120,160,220,0)']]); ctx.fillRect(x, 0, w, H); }
  ctx.restore();
}
// car from above, nose up. brake 0..1 lights the rear lamps
function car(ctx, x, y, s = 1, col = '#d9dde3', brake = 0, ang = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,.45)'; rrect(ctx, -52, -102, 112, 216, 40); ctx.fill();
  rrect(ctx, -50, -110, 100, 220, 38); ctx.fillStyle = lin(ctx, -50, 0, 50, 0, [[0, shade(col, -.25)], [.35, col], [1, shade(col, -.35)]]); ctx.fill();
  rrect(ctx, -40, -58, 80, 46, [18, 18, 6, 6]); ctx.fillStyle = '#0f1216'; ctx.fill();               // windscreen
  rrect(ctx, -38, -12, 76, 70, 10); ctx.fillStyle = shade(col, .08); ctx.fill();                     // roof
  rrect(ctx, -36, 60, 72, 26, [6, 6, 14, 14]); ctx.fillStyle = '#0f1216'; ctx.fill();                // rear window
  ctx.fillStyle = 'rgba(255,255,255,.18)'; rrect(ctx, -32, -54, 18, 36, 8); ctx.fill();
  [[-34, -104], [34, -104]].forEach(([hx, hy]) => { ellipse(ctx, hx, hy, 12, 6); ctx.fillStyle = '#fff6d8'; ctx.fill(); });
  [[-36, 106], [36, 106]].forEach(([bx, by]) => { rrect(ctx, bx - 12, by - 5, 24, 10, 4); ctx.fillStyle = brake > 0 ? '#ff3b4e' : '#6b1f27'; ctx.fill(); if (brake > 0) bloom(ctx, bx, by + 10, 70, 'rgba(255,40,60,', .7 * brake); });
  ctx.fillStyle = shade(col, -.3); rrect(ctx, -60, -46, 12, 18, 5); ctx.fill(); rrect(ctx, 48, -46, 12, 18, 5); ctx.fill();
  ctx.restore();
}
function shade(hex, k) { const n = parseInt(hex.slice(1), 16), f = c => Math.round(clamp(k > 0 ? c + (255 - c) * k : c * (1 + k), 0, 255)); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; }
// speedometer: value in km/h
function speedo(ctx, x, y, r, v, max = 180, accent = C.gold) {
  ctx.save();
  circle(ctx, x, y, r * 1.08); ctx.fillStyle = rad(ctx, x, y - r * .3, r * .1, r * 1.1, [[0, '#2a2e36'], [1, '#0d0f12']]); ctx.fill();
  circle(ctx, x, y, r * 1.08); ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 4; ctx.stroke();
  const a0 = Math.PI * .75, a1 = Math.PI * 2.25, av = lerp(a0, a1, clamp(v / max));
  for (let k = 0; k <= max; k += 10) {
    const a = lerp(a0, a1, k / max), big = k % 20 === 0;
    line(ctx, x + Math.cos(a) * r * (big ? .8 : .86), y + Math.sin(a) * r * (big ? .8 : .86), x + Math.cos(a) * r * .95, y + Math.sin(a) * r * .95, big ? 5 : 3, k >= 120 ? '#ff6b6b' : '#c8ccd3');
    if (big) mono(ctx, String(k), x + Math.cos(a) * r * .66, y + Math.sin(a) * r * .66, r * .1, '#9aa0aa');
  }
  glow(ctx, () => { ctx.beginPath(); ctx.arc(x, y, r * .97, a0, av); }, accent, r * .025, .9);
  line(ctx, x, y, x + Math.cos(av) * r * .82, y + Math.sin(av) * r * .82, r * .035, '#ff4f63');
  circle(ctx, x, y, r * .08); ctx.fillStyle = '#e9ecf0'; ctx.fill();
  mono(ctx, String(Math.round(v)), x, y + r * .48, r * .28, '#fff'); caps(ctx, 'km/h', x, y + r * .7, r * .07, C.dim);
  ctx.restore();
}
// a brain seen from the side, with gold sparks running through it (k = how lit)
function brain(ctx, x, y, s, t, k = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const lobes = [[-60, -30, 80], [10, -55, 85], [75, -15, 70], [-15, 30, 80], [60, 40, 60]];
  ctx.beginPath(); lobes.forEach(([lx, ly, r]) => { ctx.moveTo(lx + r, ly); ctx.arc(lx, ly, r, 0, TAU); });
  ctx.fillStyle = lin(ctx, 0, -140, 0, 120, [[0, '#f2a9b4'], [1, '#c26a7b']]); ctx.fill();
  ctx.strokeStyle = 'rgba(120,40,60,.45)'; ctx.lineWidth = 6;
  for (let i = 0; i < 7; i++) { ctx.beginPath(); for (let j = 0; j <= 12; j++) { const px = -110 + j * 18, py = -90 + i * 26 + Math.sin(j * 1.3 + i) * 10; j ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); }
  rrect(ctx, 20, 90, 40, 110, 18); ctx.fillStyle = '#c26a7b'; ctx.fill();
  if (k > 0) for (let i = 0; i < 6; i++) { const a = t * 3 + i, px = Math.cos(a * 1.3) * 80, py = Math.sin(a) * 60 - 10; bloom(ctx, px, py, 70, 'rgba(255,200,90,', .6 * k); }
  ctx.restore();
}
// a building side view: floors from the ground at y up; hi = floor to highlight
function building(ctx, x, y, w, floors, fh, hi = -1, p = 1) {
  ctx.save();
  box3d(ctx, x, y - floors * fh, w, floors * fh, 40, lin(ctx, x, 0, x + w, 0, [[0, '#3a3f49'], [1, '#262a31']]), '#4a505b', '#1b1d22', 8);
  for (let f = 0; f < floors; f++) {
    const fy = y - (f + 1) * fh;
    for (let c = 0; c < 3; c++) { rrect(ctx, x + 22 + c * (w - 44) / 3, fy + 16, (w - 44) / 3 - 16, fh - 30, 6); ctx.fillStyle = f + 1 === hi ? `rgba(245,196,81,${.3 + .6 * p})` : '#14171c'; ctx.fill(); }
    line(ctx, x, fy, x + w, fy, 2, 'rgba(255,255,255,.08)');
  }
  ctx.restore();
}
function rain(ctx, t, k = 1, seed = 2) {
  if (k <= 0) return;
  const R = rng(seed); ctx.save(); ctx.globalAlpha = .5 * k; ctx.strokeStyle = '#a9c4ea'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (let i = 0; i < 140; i++) { const x = R() * (W + 200) - 100, sp = 1800 + R() * 900, y = ((R() * H + t * sp) % (H + 200)) - 100; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 14, y + 60); ctx.stroke(); }
  ctx.restore();
}
// red warning triangle
function warn(ctx, x, y, s, p = 1) {
  if (p <= 0) return;
  ctx.save(); ctx.translate(x, y); const k = backOut(clamp(p * 1.4)); ctx.scale(s * k, s * k);
  ctx.beginPath(); ctx.moveTo(0, -60); ctx.lineTo(64, 50); ctx.lineTo(-64, 50); ctx.closePath(); ctx.lineJoin = 'round'; ctx.lineWidth = 14; ctx.strokeStyle = C.red; ctx.stroke(); ctx.fillStyle = 'rgba(255,79,99,.15)'; ctx.fill();
  text(ctx, '!', 0, 14, 64, '#fff', 700);
  ctx.restore();
}
// a little gas pump
function pump(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  box3d(ctx, -60, -120, 120, 220, 20, lin(ctx, -60, 0, 60, 0, [[0, '#d9534f'], [1, '#a8322f']]), '#e46b67', '#7d2422', 18);
  rrect(ctx, -40, -95, 80, 60, 10); ctx.fillStyle = '#0b0c0f'; ctx.fill(); text(ctx, 'GAS', 0, -65, 28, C.amber, 700, 'JetBrains Mono');
  ctx.beginPath(); ctx.moveTo(60, -40); ctx.bezierCurveTo(110, -40, 110, 60, 90, 90); ctx.lineWidth = 10; ctx.strokeStyle = '#1c1e23'; ctx.stroke();
  ctx.restore();
}
