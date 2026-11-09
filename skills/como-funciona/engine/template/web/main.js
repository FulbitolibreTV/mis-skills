// ---------- compositor: shots, transitions, grade, top captions ----------
const canvas = document.getElementById('c'); canvas.width = W; canvas.height = H;
const out = canvas.getContext('2d');
const bufA = document.createElement('canvas'); bufA.width = W; bufA.height = H; const actx = bufA.getContext('2d');
const bufB = document.createElement('canvas'); bufB.width = W; bufB.height = H; const bctx = bufB.getContext('2d');
SHOTS.sort((a, b) => a.start - b.start);
SHOTS.forEach((s, i) => { s.end = i < SHOTS.length - 1 ? SHOTS[i + 1].start : DUR; });
window.SHOT_SPANS = SHOTS.map(s => [s.start, s.end]);
const TOTAL_FRAMES = Math.round(DUR * FPS);

// grain tiles
const grains = [];
for (let k = 0; k < 4; k++) { const g = document.createElement('canvas'); g.width = g.height = 256; const gc = g.getContext('2d'); const id = gc.createImageData(256, 256); const R = rng(k + 11); for (let i = 0; i < id.data.length; i += 4) { const v = 128 + (R() - .5) * 120; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } gc.putImageData(id, 0, 0); grains.push(g); }

// ---- captions: short phrases, said words dim to grey, the current word is white and bold,
// key words (*word* in script.json) stay white with a blue selection box.
// Where: window.CAPTIONS = 'top' (default, like the references) or 'low' (a little below the centre), set in shots.js
// window.ESTILO changes the caption look: 'mapa' (white with a dark rim), 'tech' (lowercase display font, key words orange, low),
// 'neon' (mono capitals, key words pink). window.CAPTIONS = 'none' hides them.
const EST = window.ESTILO || '';
const CAPF = EST === 'tech' ? { font: "'Unica One'", w0: 400, w1: 400, size: 66, y: 1400, said: '#f5efe9', key: '#ff7a1a', lower: true }
  : EST === 'neon' ? { font: "'JetBrains Mono'", w0: 800, w1: 800, size: 44, y: 1600, said: '#9a9aa2', key: '#ff5c8a', upper: true }
  : EST === 'mapa' ? { font: 'Inter', w0: 700, w1: 700, size: 52, y: 330, said: '#ffffff', rim: true }
  : { font: 'Inter', w0: 500, w1: 700, size: 50, y: 330, said: '#8a8f99' };
const CAP_Y = window.CAPTIONS === 'low' ? 1180 : CAPF.y, CAP_SIZE = window.CAPTIONS === 'low' ? 54 : CAPF.size, CAP_MAXW = 780, CAP_LINE = CAP_SIZE * 1.3;
const capTxt = w => CAPF.lower ? w.toLowerCase() : CAPF.upper ? w.toUpperCase() : w;
const CHUNKS = (() => {
  const ch = []; let cur = null;
  WORDS.forEach((w, i) => {
    const prev = WORDS[i - 1];
    const len = cur ? cur.words.reduce((n, x) => n + x.w.length + 1, 0) : 0;
    const brk = !cur || (prev && prev.line !== w.line) || len + w.w.length > 30 || (/[.?!:;]$/.test(prev.w)) || (/,$/.test(prev.w) && cur.words.length >= 2) || cur.words.length >= 6;
    if (brk) { cur = { words: [w], s: w.s }; ch.push(cur); } else cur.words.push(w);
  });
  ch.forEach((c, i) => { const n = ch[i + 1], last = c.words[c.words.length - 1]; c.e = n ? n.s : last.e + .9; });
  return ch;
})();
function layoutChunk(ctx, c) {
  if (c.lay) return c.lay;
  ctx.font = `${CAPF.w1} ${CAP_SIZE}px ${CAPF.font}`; const sp = ctx.measureText(' ').width;
  const rows = [[]]; let rw = 0;
  // key words get a little extra room so their selection box clears the neighbours
  c.words.forEach(w => { const ww = ctx.measureText(capTxt(w.w)).width + (w.k && !CAPF.key ? 18 : 0); if (rows[rows.length - 1].length && rw + sp + ww > CAP_MAXW) { rows.push([]); rw = 0; } rows[rows.length - 1].push({ w, ww }); rw += (rw ? sp : 0) + ww; });
  const lay = [];
  rows.forEach((r, ri) => {
    const tot = r.reduce((n, x) => n + x.ww, 0) + sp * (r.length - 1); let x = W / 2 - tot / 2;
    const y = (ri - (rows.length - 1) / 2) * CAP_LINE;   // relative: the shot may move the captions (shot.capY)
    r.forEach(it => { lay.push({ ...it, x, y }); x += it.ww + sp; });
  });
  return (c.lay = lay);
}
function drawCaption(ctx, t) {
  if (window.CAPTIONS === 'none') return;
  const c = CHUNKS.find(c => t >= c.s && t < c.e); if (!c) return;
  const lay = layoutChunk(ctx, c), fadeOut = clamp((c.e - t) / .12);
  const sh = SHOTS.find(s => t >= s.start && t < s.end), cy = (sh && sh.capY) || CAP_Y;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 16;
  lay.forEach(({ w, ww, x, y: dy }, i) => {
    const y = cy + dy;
    if (t < w.s - .02) return;
    const a = easeOut(clamp((t - w.s + .02) / .12)), nxt = lay[i + 1], current = !nxt || t < nxt.w.s;
    const hot = current || w.k;
    ctx.globalAlpha = a * fadeOut; ctx.font = `${hot ? CAPF.w1 : CAPF.w0} ${CAP_SIZE}px ${CAPF.font}`;
    ctx.fillStyle = w.k && CAPF.key ? CAPF.key : hot ? '#ffffff' : CAPF.said;
    // keep the slot width stable when the weight changes
    const s = capTxt(w.w), mw = ctx.measureText(s).width, yy = y + (1 - a) * 10;
    if (CAPF.rim) { ctx.save(); ctx.shadowBlur = 0; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(20,30,35,.85)'; ctx.lineWidth = CAP_SIZE * .2; ctx.strokeText(s, x + (ww - mw) / 2, yy); ctx.restore(); }
    ctx.fillText(s, x + (ww - mw) / 2, yy);
    if (w.k && !CAPF.key) {
      const p = easeOut(clamp((t - w.s) / .18)), pad = -2, bx = x - pad, by = y - CAP_SIZE * .62, bw = ww + pad * 2, bh = CAP_SIZE * 1.22;
      ctx.shadowBlur = 0; ctx.strokeStyle = C.blue; ctx.lineWidth = 2.5;
      ctx.strokeRect(bx, by, bw * p, bh);
      if (p > .9) [[bx, by], [bx + bw, by + bh]].forEach(([hx, hy]) => { circle(ctx, hx, hy, 6); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke(); });
      ctx.shadowBlur = 16;
    }
  });
  ctx.restore();
}

function renderShot(ctx, i, t) {
  const s = SHOTS[i];
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  ctx.fillStyle = C.bg0; ctx.fillRect(0, 0, W, H);
  ctx.save();
  // punch: {punch: [times], pc: [x, y]} in the shot options = a quick zoom jump at each time (on key words), so long shots keep moving
  if (s.punch) { let z = 1; s.punch.forEach(w => { if (w != null) z += .1 * easeOut(clamp((t - w) / .14)); }); const [px, py] = s.pc || [540, 700]; ctx.translate(px, py); ctx.scale(z, z); ctx.translate(-px, -py); }
  s.draw(ctx, t - s.start, t); ctx.restore();
}
// transitions into a shot: 'cut' | 'fade' | 'zoom' (push through: old grows and fades, new settles in) | 'flash'
const TR = { fade: .3, zoom: .32, flash: .25 }, LOOP_T = .45;
function renderFrame(f, noCaption = false) {
  const t = Math.min(f / FPS, DUR - 1e-3);
  let i = SHOTS.findIndex(s => t >= s.start && t < s.end); if (i < 0) i = SHOTS.length - 1;
  const s = SHOTS[i], tr = s.tr || 'cut', d = TR[tr] || 0, k = d ? clamp((t - s.start) / d) : 1;
  out.setTransform(1, 0, 0, 1, 0, 0); out.globalAlpha = 1; out.globalCompositeOperation = 'source-over';
  renderShot(actx, i, t);
  if (k < 1 && i > 0 && tr !== 'flash') {
    renderShot(bctx, i - 1, Math.min(t, SHOTS[i - 1].end - 1e-3));
    out.drawImage(bufB, 0, 0);
    out.save(); out.globalAlpha = easeOut(k);
    if (tr === 'zoom') { const sc = lerp(.86, 1, easeOut(k)); out.translate(W / 2, H / 2); out.scale(sc, sc); out.translate(-W / 2, -H / 2); }
    out.drawImage(bufA, 0, 0); out.restore();
  } else out.drawImage(bufA, 0, 0);
  if (tr === 'flash' && k < 1) { out.fillStyle = `rgba(255,240,210,${.55 * (1 - k)})`; out.fillRect(0, 0, W, H); }
  // loop: the last moments melt into the first frame, so the replay starts without a seam (window.LOOP = false in shots.js turns it off)
  const lk = clamp((t - (DUR - LOOP_T)) / LOOP_T);
  if (window.LOOP !== false && lk > 0) { renderShot(bctx, 0, 0); out.save(); out.globalAlpha = ease(lk); out.drawImage(bufB, 0, 0); out.restore(); }
  // grade: vignette + grain
  out.save(); out.setTransform(1, 0, 0, 1, 0, 0);
  out.fillStyle = rad(out, 540, 960, 520, 1300, [[0, 'rgba(0,0,0,0)'], [1, `rgba(0,0,0,${EST === 'mapa' ? .3 : .55})`]]); out.fillRect(0, 0, W, H);
  out.globalCompositeOperation = 'overlay'; out.globalAlpha = .06; out.fillStyle = out.createPattern(grains[f % 4], 'repeat'); out.translate((f * 37) % 256, (f * 91) % 256); out.fillRect(-256, -256, W + 512, H + 512);
  out.restore();
  // soft dark band behind the captions so they always read
  if (EST || window.CAPTIONS === 'none') { /* the extra styles keep their own clean look */ }
  else if (CAP_Y < 600) { out.fillStyle = lin(out, 0, 0, 0, 560, [[0, 'rgba(0,0,0,.55)'], [1, 'rgba(0,0,0,0)']]); out.fillRect(0, 0, W, 560); }
  else if (!noCaption) { out.fillStyle = lin(out, 0, CAP_Y - 190, 0, CAP_Y + 190, [[0, 'rgba(0,0,0,0)'], [.5, 'rgba(0,0,0,.45)'], [1, 'rgba(0,0,0,0)']]); out.fillRect(0, CAP_Y - 190, W, 380); }
  // small brand mark at the top (window.BRAND = 'tu marca' in shots.js), like the references' account name
  if (window.BRAND) { out.save(); out.globalAlpha = .55; caps(out, window.BRAND, 540, 70, 20, '#ffffff', 600, 'center', .35); out.restore(); }
  if (!noCaption) drawCaption(out, t);
}
// ---- cover: a frame of the reel with the question big in the middle. COVER = {t, title} in shots.js; *word* = gold
function renderCover() {
  const cv = window.COVER || {}; renderFrame(Math.round((cv.t ?? 1.2) * FPS), true);
  out.save(); out.setTransform(1, 0, 0, 1, 0, 0);
  out.fillStyle = lin(out, 0, 520, 0, 1200, [[0, 'rgba(0,0,0,0)'], [.25, 'rgba(0,0,0,.62)'], [.75, 'rgba(0,0,0,.62)'], [1, 'rgba(0,0,0,0)']]); out.fillRect(0, 520, W, 680);
  const words = (cv.title || '').split(/\s+/).filter(Boolean), size = 104, lh = 118;
  out.font = `700 ${size}px Inter`; out.textBaseline = 'middle'; out.textAlign = 'left';
  const sp = out.measureText(' ').width, rows = [[]]; let rw = 0;
  words.forEach(w => { const ww = out.measureText(w.replace(/\*/g, '')).width; if (rows[rows.length - 1].length && rw + sp + ww > 900) { rows.push([]); rw = 0; } rows[rows.length - 1].push([w, ww]); rw += (rw ? sp : 0) + ww; });
  rows.forEach((r, ri) => {
    const tot = r.reduce((n, x) => n + x[1], 0) + sp * (r.length - 1); let x = W / 2 - tot / 2; const y = 860 + (ri - (rows.length - 1) / 2) * lh;
    r.forEach(([w, ww]) => { const key = w.includes('*'); out.shadowColor = 'rgba(0,0,0,.8)'; out.shadowBlur = 24; out.fillStyle = key ? C.gold : '#fff'; out.fillText(w.replace(/\*/g, ''), x, y); x += ww + sp; });
  });
  out.restore();
}
// ---- pacing audit: how much the picture changes between two moments (captions band left out), 0..255
const small = document.createElement('canvas'); small.width = 54; small.height = 96; const sctx = small.getContext('2d', { willReadFrequently: true });
let prevPix = null;
function motionSample(f) {
  renderFrame(f, true); sctx.drawImage(canvas, 0, 0, W, H, 0, 0, 54, 96);
  const px = sctx.getImageData(0, 0, 54, 96).data; let d = 0;
  if (prevPix) for (let i = 0; i < px.length; i += 4) d += Math.abs(px[i] - prevPix[i]) + Math.abs(px[i + 1] - prevPix[i + 1]) + Math.abs(px[i + 2] - prevPix[i + 2]);
  prevPix = px; return d / (54 * 96 * 3);
}
window.renderCover = renderCover; window.motionSample = motionSample;
window.renderFrame = renderFrame; window.TOTAL_FRAMES = TOTAL_FRAMES; window.DUR = DUR;
window.grab = (q = .93) => canvas.toDataURL('image/jpeg', q);
