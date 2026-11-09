// ---------- props: ocean liners, warship, iceberg, lifeboat, sea mine, propeller, Violet ----------
// an ocean liner seen from the side, waterline at (x, y), ~1000 px long at s = 1.
// o: hospital (white hull + green band + red crosses), tilt (radians), lights 0..1
function liner(ctx, x, y, s = 1, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.tilt || 0); ctx.scale(s, s);
  const hosp = !!o.hospital, hull = hosp ? '#eef0f2' : '#15171c';
  for (let i = 0; i < 4; i++) { const fx = -270 + i * 150; rrect(ctx, fx - 32, -330, 64, 160, 6); ctx.fillStyle = '#d9a24a'; ctx.fill(); rrect(ctx, fx - 32, -330, 64, 40, 6); ctx.fillStyle = '#121316'; ctx.fill(); }
  rrect(ctx, -400, -180, 760, 90, 8); ctx.fillStyle = '#f2efe6'; ctx.fill();
  rrect(ctx, -330, -230, 600, 60, 8); ctx.fillStyle = '#e9e5da'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(-500, -100); ctx.lineTo(500, -100); ctx.lineTo(460, 40); ctx.lineTo(-440, 40); ctx.quadraticCurveTo(-500, 0, -500, -100); ctx.closePath();
  ctx.fillStyle = lin(ctx, 0, -100, 0, 40, [[0, shade(hull, .08)], [1, shade(hull, -.25)]]); ctx.fill();
  if (hosp) { rrect(ctx, -490, -40, 960, 18, 4); ctx.fillStyle = '#2f9a55'; ctx.fill(); [-250, 0, 250].forEach(cx => { ctx.fillStyle = '#d83a3a'; rrect(ctx, cx - 10, -95, 20, 50, 3); ctx.fill(); rrect(ctx, cx - 25, -80, 50, 20, 3); ctx.fill(); }); }
  else { rrect(ctx, -500, 10, 960, 30, 2); ctx.fillStyle = '#8a2a22'; ctx.fill(); }
  const L = o.lights ?? 0;
  for (let i = 0; i < 26; i++) { circle(ctx, -440 + i * 35, -70, 6); ctx.fillStyle = L > 0 ? `rgba(255,220,140,${.4 + .6 * L})` : (hosp ? 'rgba(40,50,70,.5)' : 'rgba(255,255,255,.25)'); ctx.fill(); }
  for (let i = 0; i < 18; i++) { rrect(ctx, -380 + i * 40, -160, 22, 14, 3); ctx.fillStyle = L > 0 ? `rgba(255,214,140,${.5 + .5 * L})` : 'rgba(60,70,90,.6)'; ctx.fill(); }
  if (L > 0) bloom(ctx, 0, -120, 600, 'rgba(255,200,110,', .18 * L);
  ctx.restore();
}
// waves in front of a ship so it sits in the water (draw after the ship)
function waterFront(ctx, t, y, col = 'rgba(10,30,60,.95)') {
  ctx.beginPath(); ctx.moveTo(-20, H); ctx.lineTo(-20, y);
  for (let x = -20; x <= W + 20; x += 20) ctx.lineTo(x, y + Math.sin(x / 70 + t * 2) * 8);
  ctx.lineTo(W + 20, H); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
}
// a grey warship (the cruiser that hit the Olympic)
function warship(ctx, x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-360, -60); ctx.lineTo(380, -60); ctx.lineTo(300, 30); ctx.lineTo(-330, 30); ctx.closePath(); ctx.fillStyle = '#5c6470'; ctx.fill();
  rrect(ctx, -160, -150, 260, 90, 6); ctx.fillStyle = '#6c7480'; ctx.fill();
  [-100, 0].forEach(fx => { rrect(ctx, fx - 18, -230, 36, 90, 4); ctx.fillStyle = '#4a515c'; ctx.fill(); });
  line(ctx, 160, -100, 300, -130, 12, '#4a515c'); line(ctx, -200, -100, -330, -130, 12, '#4a515c');
  ctx.restore();
}
function iceberg(ctx, x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  bloom(ctx, 0, -150, 400, 'rgba(180,220,255,', .25);
  ctx.beginPath(); ctx.moveTo(-260, 0); ctx.lineTo(-180, -160); ctx.lineTo(-90, -120); ctx.lineTo(-20, -330); ctx.lineTo(70, -200); ctx.lineTo(150, -240); ctx.lineTo(260, 0); ctx.closePath();
  ctx.fillStyle = lin(ctx, -260, -330, 260, 0, [[0, '#ffffff'], [.5, '#cfe6f5'], [1, '#7fa9c9']]); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-20, -330); ctx.lineTo(70, -200); ctx.lineTo(10, 0); ctx.lineTo(-90, -120); ctx.closePath(); ctx.fillStyle = 'rgba(120,170,210,.35)'; ctx.fill();
  ctx.restore();
}
// a lifeboat with a few heads in it
function lifeboat(ctx, x, y, s = 1, heads = 4) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  for (let i = 0; i < heads; i++) { circle(ctx, -110 + i * 75, -50, 24); ctx.fillStyle = i % 2 ? C.skin1 : C.skin0; ctx.fill(); rrect(ctx, -132 + i * 75, -30, 44, 30, 10); ctx.fillStyle = '#2a3446'; ctx.fill(); }
  ctx.beginPath(); ctx.moveTo(-200, -20); ctx.lineTo(200, -20); ctx.quadraticCurveTo(180, 40, 120, 45); ctx.lineTo(-120, 45); ctx.quadraticCurveTo(-180, 40, -200, -20); ctx.closePath();
  ctx.fillStyle = lin(ctx, 0, -20, 0, 45, [[0, '#f2efe6'], [1, '#b9b3a3']]); ctx.fill();
  ctx.restore();
}
// a sea mine: spiky sphere on a chain
function seaMine(ctx, x, y, r, t) {
  line(ctx, x, y + r, x, y + 900, 4, 'rgba(60,70,80,.8)');
  for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + t * .2; line(ctx, x + Math.cos(a) * r * .8, y + Math.sin(a) * r * .8, x + Math.cos(a) * r * 1.3, y + Math.sin(a) * r * 1.3, r * .14, '#3a3f47'); }
  circle(ctx, x, y, r); ctx.fillStyle = rad(ctx, x - r * .3, y - r * .3, 2, r, [[0, '#6a707a'], [1, '#22262c']]); ctx.fill();
}
// a big ship propeller spinning (ang = rotation)
function propeller(ctx, x, y, r, ang) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  for (let i = 0; i < 3; i++) { ctx.rotate(TAU / 3); ctx.beginPath(); ctx.ellipse(r * .5, 0, r * .55, r * .22, .3, 0, TAU); ctx.fillStyle = lin(ctx, 0, -r * .2, r, r * .2, [[0, '#c89a4a'], [1, '#7a5626']]); ctx.fill(); }
  circle(ctx, 0, 0, r * .18); ctx.fillStyle = '#5a4020'; ctx.fill();
  ctx.restore();
}
// underwater: deep blue with light from the surface at y0
function underwater(ctx, t, y0 = 0) {
  ctx.fillStyle = lin(ctx, 0, y0, 0, H, [[0, '#1f5d8f'], [.5, '#0b2c4f'], [1, '#030b18']]); ctx.fillRect(0, 0, W, H);
  godRays(ctx, 540, y0 - 100, .6, t, 'rgba(180,220,255,');
  const R = rng(9); for (let i = 0; i < 50; i++) { const x = R() * W, y = ((R() * H - t * (40 + R() * 60)) % H + H) % H; circle(ctx, x, y, 2 + R() * 5); ctx.strokeStyle = 'rgba(200,230,255,.35)'; ctx.lineWidth = 2; ctx.stroke(); }
}
// Violet: a woman in a dark uniform with apron (or a white nurse dress and cap) and her hair in a bun. baby = holds a bundle
function violet(ctx, x, y, s = 1, o = {}) {
  const nurse = !!o.nurse, hair = '#3a2416';
  if (!o.silhouette) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); circle(ctx, 0, -505, 34); ctx.fillStyle = hair; ctx.fill(); ctx.restore(); }
  figure(ctx, x, y, s, { robe: nurse ? '#f1f2f4' : '#1f2433', sash: null, hair, arms: o.baby ? 'crossed' : (o.arms || 'down'), eyes: o.eyes, look: o.look, silhouette: o.silhouette, skin: '#f2c7ad' });
  if (o.silhouette) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  if (!nurse) { rrect(ctx, -40, -170, 80, 140, 12); ctx.fillStyle = 'rgba(240,240,236,.9)'; ctx.fill(); }
  else { rrect(ctx, -60, -505, 120, 34, 10); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.fillStyle = '#d83a3a'; rrect(ctx, -8, -503, 16, 30, 3); ctx.fill(); rrect(ctx, -15, -496, 30, 16, 3); ctx.fill(); }
  if (o.baby) { ellipse(ctx, 0, -258, 82, 48, -.15); ctx.fillStyle = '#f6efe2'; ctx.fill(); circle(ctx, -42, -272, 28); ctx.fillStyle = '#f4cdb4'; ctx.fill(); }
  ctx.restore();
}
