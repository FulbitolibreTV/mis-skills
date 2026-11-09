// ---------- props: price tags, dress on a hanger, demand bars, big hook title ----------
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
// a dress on a hanger
function dress(ctx, x, y, s, col = '#c8486a') {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.arc(0, -330, 30, Math.PI, 0); ctx.strokeStyle = '#c9ced5'; ctx.lineWidth = 10; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -300); ctx.lineTo(-180, -220); ctx.lineTo(180, -220); ctx.closePath(); ctx.strokeStyle = '#c9ced5'; ctx.lineWidth = 10; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-90, -225); ctx.quadraticCurveTo(0, -180, 90, -225); ctx.lineTo(110, -60); ctx.quadraticCurveTo(220, 160, 240, 260); ctx.quadraticCurveTo(0, 300, -240, 260); ctx.quadraticCurveTo(-220, 160, -110, -60); ctx.closePath();
  ctx.fillStyle = lin(ctx, -240, 0, 240, 0, [[0, shade(col, -.25)], [.5, col], [1, shade(col, -.3)]]); ctx.fill();
  rrect(ctx, -115, -70, 230, 26, 10); ctx.fillStyle = shade(col, -.4); ctx.fill();
  ctx.restore();
}
// vertical bars (demand), values 0..1
function bars(ctx, x, y, vals, labels, p = 1, cols) {
  vals.forEach((v, i) => {
    const bx = x + i * 220, h = 420 * v * easeOut(clamp(p - i * .25));
    if (clamp(p - i * .25) <= 0) return;
    rrect(ctx, bx - 70, y - h, 140, h, 14); ctx.fillStyle = lin(ctx, 0, y - h, 0, y, [[0, (cols && cols[i]) || C.gold], [1, shade((cols && cols[i]) || C.gold, -.4)]]); ctx.fill();
    text(ctx, labels[i], bx, y + 50, 46, C.ink, 700);
  });
}
