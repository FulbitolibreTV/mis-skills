// ---------- props for the election reel: Capitol dome, seat arcs, ballot ----------
// the Capitol seen from the front
function capitol(ctx, x, y, s, t, lit = .5) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  bloom(ctx, 0, -260, 520, 'rgba(255,220,160,', .35 * lit);
  // wings
  rrect(ctx, -460, -60, 920, 160, 8); ctx.fillStyle = lin(ctx, 0, -60, 0, 100, [[0, '#eef1f5'], [1, '#c4c9d1']]); ctx.fill();
  for (let i = -20; i <= 20; i++) { if (Math.abs(i) < 4) continue; rrect(ctx, i * 22 - 5, -40, 10, 120, 3); ctx.fillStyle = 'rgba(120,130,145,.5)'; ctx.fill(); }
  // portico
  ctx.beginPath(); ctx.moveTo(-120, -60); ctx.lineTo(0, -130); ctx.lineTo(120, -60); ctx.closePath(); ctx.fillStyle = '#e4e8ee'; ctx.fill();
  for (let i = -3; i <= 3; i++) { rrect(ctx, i * 32 - 7, -60, 14, 140, 4); ctx.fillStyle = '#f6f7f9'; ctx.fill(); }
  // drum + dome
  rrect(ctx, -150, -230, 300, 110, 10); ctx.fillStyle = '#e9ecf0'; ctx.fill();
  for (let i = -6; i <= 6; i++) { rrect(ctx, i * 22 - 4, -222, 8, 92, 3); ctx.fillStyle = 'rgba(120,130,145,.45)'; ctx.fill(); }
  ctx.beginPath(); ctx.ellipse(0, -230, 150, 170, 0, Math.PI, 0); ctx.closePath(); ctx.fillStyle = lin(ctx, -150, 0, 150, 0, [[0, '#c9ced5'], [.45, '#ffffff'], [1, '#b6bbc3']]); ctx.fill();
  rrect(ctx, -18, -450, 36, 60, 10); ctx.fillStyle = '#e9ecf0'; ctx.fill(); circle(ctx, 0, -465, 14); ctx.fillStyle = '#d9b44a'; ctx.fill();
  ctx.restore();
}
// a hemicycle of seats: n seats, dem = how many are blue (rest red), p = how many have filled in (0..1)
function seats(ctx, cx, cy, r, n, dem, p = 1, label = '') {
  const rows = n > 200 ? 9 : 5, per = []; let total = 0;
  for (let i = 0; i < rows; i++) { const rr = r * (.45 + .55 * i / (rows - 1)); per.push(rr); total += rr; }
  let k = 0; const dots = [];
  per.forEach(rr => { const m = Math.round(n * rr / total); for (let j = 0; j < m; j++) dots.push([rr, Math.PI - Math.PI * (j + .5) / m]); });
  dots.sort((a, b) => b[1] - a[1]);
  const show = Math.round(dots.length * p), dotR = n > 200 ? r * .028 : r * .055;
  dots.forEach(([rr, a], i) => { circle(ctx, cx + Math.cos(a) * rr, cy - Math.sin(a) * rr, dotR); ctx.fillStyle = i >= show ? '#2a2e36' : (i < dem ? '#3b6fe0' : '#e0453b'); ctx.fill(); });
  if (label) caps(ctx, label, cx, cy + 40, 28, C.dim);
}
// seats with an explicit split: dem blue, rep red, the rest grey (still counting). p = how many have filled in
function seats2(ctx, cx, cy, r, n, dem, rep, p = 1) {
  const rows = n > 200 ? 9 : 5, per = []; let total = 0;
  for (let i = 0; i < rows; i++) { const rr = r * (.45 + .55 * i / (rows - 1)); per.push(rr); total += rr; }
  const dots = [];
  per.forEach(rr => { const m = Math.round(n * rr / total); for (let j = 0; j < m; j++) dots.push([rr, Math.PI - Math.PI * (j + .5) / m]); });
  dots.sort((a, b) => b[1] - a[1]);
  const N = dots.length, show = Math.round(N * p), dotR = n > 200 ? r * .028 : r * .055;
  dots.forEach(([rr, a], i) => {
    const col = i >= show ? '#2a2e36' : i < dem ? '#3b6fe0' : i >= N - rep ? '#e0453b' : '#4a4f5a';
    circle(ctx, cx + Math.cos(a) * rr, cy - Math.sin(a) * rr, dotR); ctx.fillStyle = col; ctx.fill();
  });
}
// a state tile that flips from red to blue at k (0..1)
function stateTile(ctx, x, y, s, name, k) {
  ctx.save(); ctx.translate(x, y); ctx.scale(Math.abs(Math.cos(k * Math.PI)) * .9 + .1, 1);
  rrect(ctx, -s / 2, -s / 2, s, s, 18); ctx.fillStyle = k < .5 ? '#c93a33' : '#2f63d6'; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 3; ctx.stroke();
  text(ctx, name, 0, 2, s * .3, '#fff', 700);
  ctx.restore();
}
// a sheet of paper (a bill) with lines; sign 0..1 = signature appears
function bill(ctx, x, y, s, sign = 0, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  rrect(ctx, -110, -150, 220, 300, 10); ctx.fillStyle = '#f3efe4'; ctx.fill();
  text(ctx, 'LEY', 0, -110, 30, '#2a2e36', 700);
  for (let i = 0; i < 6; i++) line(ctx, -80, -60 + i * 30, 80 - (i % 2) * 30, -60 + i * 30, 6, 'rgba(40,46,54,.35)');
  if (sign > 0) { ctx.beginPath(); for (let i = 0; i <= 40 * sign; i++) { const xx = -70 + i * 3.5, yy = 115 + Math.sin(i * .7) * 10; i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.strokeStyle = '#1d3f9e'; ctx.lineWidth = 5; ctx.stroke(); }
  ctx.restore();
}
// a big rubber stamp word that slams in at p
function stamp(ctx, txt, x, y, size, col, p, rot = -.15) {
  if (p <= 0) return;
  const k = clamp(p), z = lerp(2, 1, easeOut(k)); ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(z, z); ctx.globalAlpha = k;
  ctx.font = `700 ${size}px Inter`; const w = ctx.measureText(txt).width + size * .8;
  rrect(ctx, -w / 2, -size * .75, w, size * 1.5, 16); ctx.fillStyle = 'rgba(10,10,14,.6)'; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = size * .1; ctx.stroke();
  text(ctx, txt, 0, 4, size, col, 700);
  ctx.restore();
}
// stacks of money; n = how many stacks
function cash(ctx, x, y, s, n) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  for (let i = 0; i < n; i++) { const cx = (i - (n - 1) / 2) * 150; for (let j = 0; j < 6; j++) { rrect(ctx, cx - 65, -j * 22, 130, 20, 4); ctx.fillStyle = j % 2 ? '#3fa36b' : '#55b97f'; ctx.fill(); } rrect(ctx, cx - 18, -112, 36, 24, 4); ctx.fillStyle = '#e9d9a0'; ctx.fill(); text(ctx, '$', cx, -60, 40, 'rgba(255,255,255,.75)', 700); }
  ctx.restore();
}
// magnifying glass
function magnifier(ctx, x, y, r, t) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(.15 * Math.sin(t * 1.5));
  line(ctx, r * .7, r * .7, r * 1.6, r * 1.6, r * .22, '#3a3e47');
  circle(ctx, 0, 0, r); ctx.fillStyle = 'rgba(160,210,255,.12)'; ctx.fill(); ctx.strokeStyle = '#c9ced5'; ctx.lineWidth = r * .12; ctx.stroke();
  ctx.restore();
}
// a calendar page
function calendar(ctx, x, y, s, top, big, p) {
  if (p <= 0) return;
  ctx.save(); ctx.translate(x, y); const k = backOut(clamp(p)); ctx.scale(s * k, s * k);
  rrect(ctx, -170, -190, 340, 380, 30); ctx.fillStyle = '#f4f5f7'; ctx.fill();
  ctx.save(); rrect(ctx, -170, -190, 340, 100, 30); ctx.clip(); ctx.fillStyle = '#e0453b'; ctx.fillRect(-170, -190, 340, 100); ctx.restore();
  text(ctx, top, 0, -140, 40, '#fff', 700); text(ctx, big, 0, 40, 170, '#16181d', 700);
  ctx.restore();
}
// a simple figure (judge, minister, president): body colour col
function official(ctx, x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rrect(ctx, -60, 10, 120, 170, 40); ctx.fillStyle = col; ctx.fill();
  circle(ctx, 0, -40, 48); ctx.fillStyle = rad(ctx, -15, -55, 5, 60, [[0, C.skin0], [1, C.skin1]]); ctx.fill();
  ctx.restore();
}
