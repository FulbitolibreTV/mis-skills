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
// ---------- props: capitol, ICE van, money stacks, magnifier, folder, shield ----------
function capitol(ctx, x, y, s = 1, col = '#eef0f3') {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const g = lin(ctx, 0, -420, 0, 0, [[0, shade(col, .05)], [1, shade(col, -.25)]]);
  ctx.fillStyle = g; ctx.fillRect(-420, -150, 840, 150);                       // wings
  ctx.fillRect(-180, -230, 360, 80);                                            // drum base
  for (let i = 0; i < 17; i++) { ctx.fillStyle = 'rgba(40,46,60,.35)'; ctx.fillRect(-400 + i * 48, -130, 16, 110); }
  ctx.beginPath(); ctx.moveTo(-200, -230); ctx.lineTo(0, -270); ctx.lineTo(200, -230); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
  ctx.fillRect(-120, -330, 240, 100);
  for (let i = 0; i < 9; i++) { ctx.fillStyle = 'rgba(40,46,60,.3)'; ctx.fillRect(-110 + i * 27, -320, 10, 80); }
  ctx.beginPath(); ctx.ellipse(0, -330, 130, 140, 0, Math.PI, 0); ctx.fillStyle = g; ctx.fill();
  ctx.fillRect(-14, -520, 28, 60); circle(ctx, 0, -525, 18); ctx.fill();
  ctx.restore();
}
function van(ctx, x, y, s = 1, flash = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ellipse(ctx, 0, 8, 300, 22); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(-290, -10); ctx.lineTo(-290, -170); ctx.quadraticCurveTo(-285, -200, -250, -200); ctx.lineTo(150, -200); ctx.lineTo(250, -110); ctx.lineTo(290, -100); ctx.lineTo(290, -10); ctx.closePath();
  ctx.fillStyle = lin(ctx, 0, -200, 0, 0, [[0, '#f2f4f7'], [1, '#a9b0ba']]); ctx.fill();
  rrect(ctx, -250, -180, 120, 60, 8); ctx.fillStyle = '#26303d'; ctx.fill(); rrect(ctx, -110, -180, 120, 60, 8); ctx.fill();
  ctx.beginPath(); ctx.moveTo(30, -180); ctx.lineTo(140, -180); ctx.lineTo(220, -115); ctx.lineTo(30, -115); ctx.closePath(); ctx.fill();
  rrect(ctx, -290, -95, 580, 18, 4); ctx.fillStyle = '#1f3a6b'; ctx.fill();
  text(ctx, 'ICE', -60, -55, 54, '#1f3a6b', 700);
  [-180, 180].forEach(wx => { circle(ctx, wx, -10, 48); ctx.fillStyle = '#16181c'; ctx.fill(); circle(ctx, wx, -10, 20); ctx.fillStyle = '#8a9099'; ctx.fill(); });
  const on = Math.sin(flash * 18) > 0;
  rrect(ctx, -60, -222, 50, 22, 6); ctx.fillStyle = on ? '#ff3b3b' : '#5a1a1a'; ctx.fill();
  rrect(ctx, 10, -222, 50, 22, 6); ctx.fillStyle = on ? '#2a4a7a' : '#3b8bff'; ctx.fill();
  if (flash) { ctx.globalAlpha = .25; circle(ctx, on ? -35 : 35, -212, 90); ctx.fillStyle = on ? '#ff3b3b' : '#3b8bff'; ctx.fill(); }
  ctx.restore();
}
function moneyStack(ctx, x, y, s, n) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  for (let i = 0; i < n; i++) { const yy = -i * 22; rrect(ctx, -110, yy - 20, 220, 22, 4); ctx.fillStyle = i % 2 ? '#3f8f5a' : '#4fa46a'; ctx.fill(); ctx.fillStyle = '#d7efd9'; ctx.fillRect(-20, yy - 20, 40, 22); }
  ctx.restore();
}
function magnifier(ctx, x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  line(ctx, 90, 90, 210, 210, 34, '#5a3a22');
  circle(ctx, 0, 0, 130); ctx.fillStyle = 'rgba(180,220,255,.18)'; ctx.fill(); ctx.strokeStyle = '#d9b45a'; ctx.lineWidth = 22; ctx.stroke();
  ctx.restore();
}
function folder(ctx, x, y, s, label, p = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha = clamp(p);
  rrect(ctx, -200, -170, 160, 50, 12); ctx.fillStyle = '#c99a4a'; ctx.fill();
  rrect(ctx, -200, -140, 400, 280, 14); ctx.fillStyle = lin(ctx, 0, -140, 0, 140, [[0, '#e8bd6a'], [1, '#c3923f']]); ctx.fill();
  text(ctx, label, 0, 0, 80, '#4a2e12', 700);
  ctx.restore();
}
function shield(ctx, x, y, s, p = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * easeOut(clamp(p)), s * easeOut(clamp(p)));
  ctx.beginPath(); ctx.moveTo(0, -150); ctx.lineTo(130, -100); ctx.quadraticCurveTo(130, 80, 0, 160); ctx.quadraticCurveTo(-130, 80, -130, -100); ctx.closePath();
  ctx.fillStyle = lin(ctx, 0, -150, 0, 160, [[0, '#ffd77a'], [1, '#c99430']]); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-55, 0); ctx.lineTo(-10, 50); ctx.lineTo(65, -50); ctx.strokeStyle = '#3a2a10'; ctx.lineWidth = 24; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.restore();
}
