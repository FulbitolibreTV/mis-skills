// ---------- core helpers ----------
const W = 1080, H = 1920, FPS = 30;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const inv = (a, b, v) => clamp((v - a) / (b - a));
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeIn = t => t * t * t;
const backOut = t => { const c1 = 1.7, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const TAU = Math.PI * 2;

// keyframes: [[t, v], ...] (v number or array), easing per segment
function kf(t, keys, fn = ease) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i], [t1, v1] = keys[i + 1];
    if (t <= t1) {
      const e = (keys[i + 1][2] || fn)(inv(t0, t1, t));
      if (Array.isArray(v0)) return v0.map((x, j) => lerp(x, v1[j], e));
      return lerp(v0, v1, e);
    }
  }
  return keys[keys.length - 1][1];
}
// deterministic pseudo random
function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }

// ---------- primitives ----------
function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.max(.01, r), 0, TAU); }
function ellipse(ctx, x, y, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(.01, rx), Math.max(.01, ry), rot, 0, TAU); }
function line(ctx, x1, y1, x2, y2, lw, col) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineWidth = lw; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.stroke(); }
function lin(ctx, x0, y0, x1, y1, stops) { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; }
function rad(ctx, x, y, r0, r1, stops, x1 = x, y1 = y) { const g = ctx.createRadialGradient(x, y, r0, x1, y1, r1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; }
function text(ctx, str, x, y, size, fill = '#fff', weight = 700, font = 'Inter', align = 'center') {
  ctx.font = `${weight} ${size}px ${font}`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillStyle = fill; ctx.fillText(str, x, y);
}
// number with Spanish thousands dots: 2450000000 -> "2.450.000.000"
const fmt = n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
