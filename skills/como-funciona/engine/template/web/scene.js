// ---------- props for this reel (microwave, bowl, plate, water molecules) ----------
// microwave seen from the front. o: { light 0..1, timer 'mm:ss', xray 0..1 (front fades to show the magnetron) }
function microwave(ctx, x, y, w, h, t, o = {}) {
  const light = o.light ?? 1, xray = o.xray || 0;
  ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.55)'; ellipse(ctx, x + w / 2 + 30, y + h + 18, w * .55, 34); ctx.fill(); ctx.restore();
  box3d(ctx, x, y, w, h, 70, lin(ctx, 0, y, 0, y + h, [[0, '#3d424c'], [1, '#22252c']]), '#4c525d', '#1b1d22', 30);
  // door window: warm lit cavity with the bowl on the turntable
  const dx = x + 36, dy = y + 40, dw = w * .66, dh = h - 80;
  ctx.save(); rrect(ctx, dx, dy, dw, dh, 18); ctx.clip();
  ctx.fillStyle = lin(ctx, 0, dy, 0, dy + dh, [[0, '#2b2218'], [1, '#120e0a']]); ctx.fillRect(dx, dy, dw, dh);
  if (light > 0) { ctx.globalAlpha = light; ctx.fillStyle = rad(ctx, dx + dw / 2, dy + dh * .2, 0, dw * .8, [[0, 'rgba(255,200,120,.75)'], [.5, 'rgba(200,120,40,.35)'], [1, 'rgba(40,20,5,0)']]); ctx.fillRect(dx, dy, dw, dh); ctx.globalAlpha = 1; }
  const cx = dx + dw / 2, ty = dy + dh * .78;
  ellipse(ctx, cx, ty, dw * .38, dw * .07); ctx.fillStyle = 'rgba(220,230,240,.18)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 2; ctx.stroke();
  plate(ctx, cx, ty - 8, dw * .26, t); bowl(ctx, cx, ty - dw * .17, dw * .19, t, o.steam ?? 1, t * 1.2);
  // glass: dark tint, dot mesh, reflection
  ctx.fillStyle = 'rgba(8,10,14,.28)'; ctx.fillRect(dx, dy, dw, dh);
  ctx.fillStyle = 'rgba(0,0,0,.22)'; for (let yy = dy + 6; yy < dy + dh; yy += 12) for (let xx = dx + 6 + (yy / 12 % 2) * 6; xx < dx + dw; xx += 12) ctx.fillRect(xx, yy, 3, 3);
  ctx.beginPath(); ctx.moveTo(dx + dw * .1, dy); ctx.lineTo(dx + dw * .32, dy); ctx.lineTo(dx + dw * .06, dy + dh); ctx.lineTo(dx - dw * .16, dy + dh); ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fill();
  ctx.restore();
  rrect(ctx, dx, dy, dw, dh, 18); ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 3; ctx.stroke();
  // handle + control panel
  rrect(ctx, dx + dw + 16, dy + 30, 14, dh - 60, 7); ctx.fillStyle = '#5b616d'; ctx.fill();
  const px = dx + dw + 54, pw = x + w - 30 - px;
  rrect(ctx, px, dy + 6, pw, 84, 12); ctx.fillStyle = '#0b0c0f'; ctx.fill();
  mono(ctx, o.timer || '0:30', px + pw / 2, dy + 49, 46, light > .2 ? '#ffb347' : '#5a3d1a');
  for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) { rrect(ctx, px + 6 + c * (pw / 2), dy + 120 + r * 62, pw / 2 - 12, 44, 10); ctx.fillStyle = '#2c3038'; ctx.fill(); }
  circle(ctx, px + pw / 2, dy + dh - 70, pw * .32); ctx.fillStyle = lin(ctx, 0, dy + dh - 120, 0, dy + dh - 20, [[0, '#4d535e'], [1, '#262a31']]); ctx.fill();
  line(ctx, px + pw / 2, dy + dh - 70, px + pw / 2 + Math.cos(t * .8 - 1) * pw * .22, dy + dh - 70 + Math.sin(t * .8 - 1) * pw * .22, 5, '#9aa0aa');
  // x-ray: the panel goes see-through and the magnetron shows behind it
  if (xray > 0) {
    ctx.save(); ctx.globalAlpha = xray;
    rrect(ctx, px - 14, dy - 10, pw + 28, dh + 20, 14); ctx.fillStyle = '#0a0b0e'; ctx.fill();
    ctx.strokeStyle = 'rgba(94,240,212,.35)'; ctx.setLineDash([8, 8]); ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
    magnetron(ctx, px + pw / 2, dy + dh * .55, pw / 260, t, xray);
    // waveguide into the cavity
    glow(ctx, () => { ctx.beginPath(); ctx.moveTo(px + pw / 2, dy + dh * .55 - 120 * pw / 260); ctx.lineTo(px + pw / 2, dy + 30); ctx.lineTo(dx + dw - 30, dy + 30); }, C.gold, 3, .7 * xray);
    ctx.restore();
  }
}
// the magnetron: a copper core with cooling fins and a little antenna on top
function magnetron(ctx, x, y, s, t, k = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  for (let i = -4; i <= 4; i++) { rrect(ctx, -120, i * 22 - 5, 240, 10, 4); ctx.fillStyle = i % 2 ? '#8d939e' : '#a9afb9'; ctx.fill(); }
  rrect(ctx, -70, -110, 140, 220, 22); ctx.fillStyle = lin(ctx, -70, 0, 70, 0, [[0, '#7a4a26'], [.45, '#e09a5c'], [1, '#6b3c1c']]); ctx.fill();
  rrect(ctx, -26, -170, 52, 64, 14); ctx.fillStyle = lin(ctx, -26, 0, 26, 0, [[0, '#888'], [.5, '#ddd'], [1, '#777']]); ctx.fill();
  bloom(ctx, 0, -175, 120, 'rgba(255,190,80,', .55 * k * (.75 + .25 * Math.sin(t * 20)));
  ctx.restore();
}
// side-view bowl: rim centre (cx, cy), radius r. steam 0..1
function bowl(ctx, cx, cy, r, t, steam = 1, spin = 0, soup = ['#ffb55a', '#d9661f']) {
  const ry = r * .3;
  ctx.save();
  ctx.beginPath(); ctx.ellipse(cx, cy, r, ry, 0, Math.PI, 0, true); ctx.bezierCurveTo(cx + r, cy + r * .55, cx + r * .55, cy + r * .82, cx, cy + r * .82); ctx.bezierCurveTo(cx - r * .55, cy + r * .82, cx - r, cy + r * .55, cx - r, cy); ctx.closePath();
  ctx.fillStyle = lin(ctx, cx - r, 0, cx + r, 0, [[0, '#9ea4ad'], [.35, '#f4f5f7'], [1, '#868b93']]); ctx.fill();
  ellipse(ctx, cx, cy, r, ry); ctx.fillStyle = '#e9ecef'; ctx.fill();
  ellipse(ctx, cx, cy + ry * .08, r * .88, ry * .8); ctx.fillStyle = lin(ctx, 0, cy - ry, 0, cy + ry, [[0, soup[0]], [1, soup[1]]]); ctx.fill();
  // moving highlight on the soup (the turntable turns)
  ellipse(ctx, cx + Math.cos(spin) * r * .4, cy + Math.sin(spin) * ry * .3, r * .18, ry * .2); ctx.fillStyle = 'rgba(255,240,200,.45)'; ctx.fill();
  if (steam > 0) {
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const sx = cx + (i - 1) * r * .38, ph = t * 1.4 + i * 2;
      ctx.beginPath(); for (let k = 0; k <= 20; k++) { const yy = cy - 10 - k * r * .055, xx = sx + Math.sin(k * .45 - ph) * r * .07; k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
      ctx.strokeStyle = `rgba(255,255,255,${.22 * steam * (.6 + .4 * Math.sin(t * 2 + i))})`; ctx.lineWidth = r * .07; ctx.stroke();
    }
  }
  ctx.restore();
}
function plate(ctx, cx, cy, r) {
  ellipse(ctx, cx, cy + r * .05, r, r * .26); ctx.fillStyle = '#9aa0a8'; ctx.fill();
  ellipse(ctx, cx, cy, r, r * .25); ctx.fillStyle = lin(ctx, cx - r, 0, cx + r, 0, [[0, '#c9ced5'], [.4, '#f6f7f9'], [1, '#b6bbc3']]); ctx.fill();
  ellipse(ctx, cx, cy, r * .62, r * .15); ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.lineWidth = 3; ctx.stroke();
}
// water molecule: oxygen at (x, y), the two hydrogens point along ang. q = how strongly the charges show
function molecule(ctx, x, y, s, ang, q = 0, heat = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
  [-.91, .91].forEach(a => {
    const hx = Math.cos(a) * 62, hy = Math.sin(a) * 62;
    line(ctx, 0, 0, hx, hy, 14, '#c9cdd4');
    circle(ctx, hx, hy, 30); ctx.fillStyle = rad(ctx, hx - 10, hy - 10, 2, 32, [[0, '#ffffff'], [1, '#aeb4bd']]); ctx.fill();
    if (q > 0) { circle(ctx, hx, hy, 34); ctx.strokeStyle = C.red; ctx.globalAlpha = q; ctx.lineWidth = 4; ctx.stroke(); ctx.globalAlpha = 1; }
  });
  circle(ctx, 0, 0, 46); ctx.fillStyle = rad(ctx, -14, -16, 4, 50, [[0, '#ff8a7a'], [1, '#b8323a']]); ctx.fill();
  if (q > 0) { circle(ctx, 0, 0, 51); ctx.strokeStyle = C.cyan; ctx.globalAlpha = q; ctx.lineWidth = 4; ctx.stroke(); ctx.globalAlpha = 1; }
  if (heat > 0) bloom(ctx, 0, 0, 120, 'rgba(255,150,50,', .35 * heat);
  ctx.restore();
}
