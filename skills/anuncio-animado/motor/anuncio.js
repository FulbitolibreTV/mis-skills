// anuncio.js · motor de anuncios animados (Canvas 2D, determinista: el mismo segundo da siempre la misma imagen)
// Lo usan render.js (fotogramas para el MP4) y exportar.js (página HTML que se reproduce sola en bucle).
(function (global) {
  'use strict';
  const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const eOut = (t) => 1 - Math.pow(1 - cl(t), 3);
  const eInOut = (t) => { t = cl(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  const eBack = (t) => { t = cl(t); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  const eElastic = (t) => { t = cl(t); if (t === 0 || t === 1) return t; return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1; };
  const tramo = (t, a, d) => cl((t - a) / d);
  const limpia = (p) => String(p).toLowerCase().replace(/[¿?¡!.,:;«»"']/g, '');
  const rnd = (seed) => { let s = (seed * 9301 + 49297) >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };

  const DEF = {
    fps: 30, ancho: 1080, alto: 1920, bucle: true,
    marca: {
      nombre: 'Mi App', eslogan: '', logo: null,
      colores: { principal: '#6C4CF1', secundario: '#FF5C8A', acento: '#FFC93C', fondo: '#F6F1FF', texto: '#1C1340', claro: '#FFFFFF' },
      letra_titulos: 'Fredoka', letra_textos: 'Poppins'
    },
    mascota: { visible: true, forma: 'bocadillo', color: null, accesorio: null },
    escenas: []
  };
  const TIPOS_VALIDOS = ['logo', 'pregunta', 'palabras', 'descubre', 'movil', 'dato', 'tarjeta', 'final', 'texto'];
  const TRANS = ['circulo', 'barrido', 'arriba', 'diagonal'];

  function mezclar(base, extra) {
    if (Array.isArray(extra)) return extra.slice();
    if (extra && typeof extra === 'object') {
      const o = Object.assign({}, base);
      for (const k of Object.keys(extra)) o[k] = (base && typeof base[k] === 'object' && !Array.isArray(base[k]) && base[k] !== null) ? mezclar(base[k], extra[k]) : extra[k];
      return o;
    }
    return extra === undefined ? base : extra;
  }
  function hex(c) { const m = String(c).replace('#', ''); const v = m.length === 3 ? m.split('').map((x) => x + x).join('') : m; return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16)); }
  function tono(c, f) { const [r, g, b] = hex(c); const k = (x) => Math.round(cl(f < 1 ? x * f : x + (255 - x) * (f - 1), 0, 255)); return `rgb(${k(r)},${k(g)},${k(b)})`; }
  function luz(c) { const [r, g, b] = hex(c); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; }

  async function iniciar(canvas, planEntrada, fuentes, cargarImagen) {
    if (planEntrada && planEntrada.estilo === 'limpio') {   // estilo limpio (v1.1): motor aparte, limpio.js
      if (!global.Limpio) throw new Error('Falta motor/limpio.js');
      return global.Limpio.iniciar(canvas, planEntrada, fuentes, cargarImagen);
    }
    const P = mezclar(DEF, planEntrada || {});
    const W = P.ancho, H = P.alto, C = P.marca.colores;
    const FT = P.marca.letra_titulos, FX = P.marca.letra_textos;
    const HZ = W > H * 1.1; // formato horizontal (16:9): los textos a la izquierda y la mascota a la derecha
    const S = HZ ? H / 760 : Math.min(W / 1080, H / 1350), CX = W / 2, CY = H / 2;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const avisos = [];

    for (const f of fuentes || []) {
      try { const ff = new FontFace(f.familia, `url(${f.url})`, { weight: String(f.peso) }); await ff.load(); document.fonts.add(ff); }
      catch (e) { avisos.push(`No se cargó la letra ${f.familia} ${f.peso}`); }
    }
    let logoImg = null;
    if (P.marca.logo && cargarImagen) { try { logoImg = await cargarImagen(P.marca.logo); } catch (e) { avisos.push('No se pudo abrir el logo: se usa el icono con la mascota.'); } }

    // Escenas: ordenadas, con fin (b) y transición
    const esc = (P.escenas || []).map((e, i) => Object.assign({}, e, { i })).sort((x, y) => x.a - y.a);
    if (!esc.length) throw new Error('El plan no tiene escenas.');
    esc.forEach((e, i) => {
      if (!TIPOS_VALIDOS.includes(e.tipo)) { avisos.push(`Escena ${i}: tipo «${e.tipo}» desconocido; se dibuja como «texto».`); e.tipo = 'texto'; }
      if (e.b == null) e.b = i + 1 < esc.length ? esc[i + 1].a : e.a + 1.5;
      if (i + 1 < esc.length && e.b > esc[i + 1].a) e.b = esc[i + 1].a;
      if (e.transicion == null) e.transicion = i === 0 ? 'corte' : TRANS[i % TRANS.length];
      if (e.b - e.a < 0.5) avisos.push(`Escena ${i} (${e.tipo}) dura ${(e.b - e.a).toFixed(2)} s: con la transición (0,26 s) casi no se verá. Júntala con la de al lado o alárgala.`);
      if (e.resaltar && e.resaltar.length) {
        const pal = String(e.texto || '').split(/\s+/).map(limpia);
        for (const r of e.resaltar) for (const x of String(r).split(/\s+/)) if (!pal.includes(limpia(x))) avisos.push(`Escena ${i}: «${x}» de resaltar no está en el texto, no se resalta.`);
      }
      const largo = (v, max, que) => { for (const t of [].concat(v || [])) if (String(t).length > max) avisos.push(`Escena ${i} (${e.tipo}): «${t}» tiene ${String(t).length} caracteres y se cortará (${que}: ${max} como mucho).`); };
      if (e.tipo === 'movil') { largo(e.filas, 18, 'filas'); largo(e.chips, 22, 'chips'); largo(e.boton, 14, 'botón'); largo(e.racha, 10, 'racha'); }
      if (e.tipo === 'palabras') largo(e.palabras, 14, 'palabras');
      if (e.tipo === 'tarjeta') { largo(e.titulo, 22, 'título'); largo(e.subtitulo, 28, 'subtítulo'); largo(e.chip, 10, 'chip'); }
      if (e.tipo === 'final') largo(e.cta, 22, 'botón');
      const nPal = String(e.texto || '').split(/\s+/).filter(Boolean).length;
      if (nPal / Math.max(0.3, e.b - e.a) > 3.5) avisos.push(`Escena ${i} (${e.tipo}): ${nPal} palabras en ${(e.b - e.a).toFixed(1)} s no da tiempo a leerlas (máximo unas 3 por segundo).`);
    });
    const DUR = P.duracion || esc[esc.length - 1].b;

    // ---------- utilidades de dibujo ----------
    const fuente = (peso, tam, fam) => `${peso} ${Math.round(tam)}px "${fam}", "Poppins", sans-serif`;
    function rr(x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
    function txt(str, x, y, o = {}) {
      const { tam = 80, peso = 700, fam = FT, color = C.texto, alinear = 'center', alfa = 1, linea = 1.12, maxAncho = W * 0.86 } = o;
      ctx.save(); ctx.globalAlpha *= alfa; ctx.fillStyle = color; ctx.textAlign = alinear; ctx.textBaseline = 'middle';
      const lineas = String(str).split('\n'); let t = tam; ctx.font = fuente(peso, t, fam);
      const ancho = () => Math.max(...lineas.map((l) => ctx.measureText(l).width));
      while (ancho() > maxAncho && t > 12) { t *= 0.94; ctx.font = fuente(peso, t, fam); }
      const h = t * linea, y0 = y - ((lineas.length - 1) * h) / 2;
      lineas.forEach((l, i) => ctx.fillText(l, x, y0 + i * h));
      const w = ancho(); ctx.restore(); return { tam: t, ancho: w, alto: h * lineas.length };
    }
    // Frase que aparece palabra a palabra; las palabras de "resaltar" van en caja de color
    function frasePop(str, x, y, lt, o = {}) {
      const { tam = 110, peso = 700, fam = FT, color = C.texto, maxAncho = W * 0.84, retardo = 0.07, dur = 0.38, resaltar = [], cajaColor = C.principal, cajaTexto = C.claro } = o;
      const pal = String(str).split(/\s+/).filter(Boolean); let t = tam;
      ctx.save(); ctx.font = fuente(peso, t, fam);
      while (Math.max(...pal.map((p) => ctx.measureText(p).width)) > maxAncho * 0.92 && t > 20) { t *= 0.94; ctx.font = fuente(peso, t, fam); }
      const esp = ctx.measureText(' ').width * 1.15, padX = t * 0.18;
      const anchoDe = (p) => ctx.measureText(p).width + (esResaltada(p) ? padX * 2 : 0);
      function esResaltada(p) { const q = limpia(p); return resaltar.some((r) => String(r).split(/\s+/).some((x) => limpia(x) === q)); }
      const lineas = []; let cur = [], w = 0;
      for (const p of pal) { const pw = anchoDe(p); if (cur.length && w + esp + pw > maxAncho) { lineas.push({ pal: cur, w }); cur = []; w = 0; } w += (cur.length ? esp : 0) + pw; cur.push(p); }
      if (cur.length) lineas.push({ pal: cur, w });
      const lh = t * 1.22, y0 = y - ((lineas.length - 1) * lh) / 2; let k = 0;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      lineas.forEach((ln, li) => {
        let px = x - ln.w / 2; const py = y0 + li * lh;
        for (const p of ln.pal) {
          const pw = anchoDe(p), p0 = tramo(lt, k * retardo, dur); k++;
          if (p0 > 0) {
            const sc = eBack(p0), rot = (1 - eOut(p0)) * -0.18;
            ctx.save(); ctx.globalAlpha *= cl(p0 * 3); ctx.translate(px + pw / 2, py); ctx.rotate(rot); ctx.scale(sc, sc);
            if (esResaltada(p)) { ctx.fillStyle = cajaColor; rr(-pw / 2, -t * 0.62, pw, t * 1.18, t * 0.22); ctx.fill(); ctx.fillStyle = cajaTexto; }
            else ctx.fillStyle = color;
            ctx.fillText(p, 0, t * 0.04); ctx.restore();
          }
          px += pw + esp;
        }
      });
      ctx.restore();
      return { lineas: lineas.length, alto: lineas.length * lh, tam: t };
    }
    function estrella(x, y, r, color, rot = 0) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath();
      for (let i = 0; i < 10; i++) { const a = (i * Math.PI) / 5 - Math.PI / 2, rr2 = i % 2 ? r * 0.45 : r; ctx.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); }
      ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.restore();
    }
    function check(x, y, r, color, fondo) {
      ctx.save(); ctx.fillStyle = fondo; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
      ctx.strokeStyle = color; ctx.lineWidth = r * 0.24; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
      ctx.moveTo(x - r * 0.42, y + r * 0.02); ctx.lineTo(x - r * 0.1, y + r * 0.34); ctx.lineTo(x + r * 0.45, y - r * 0.3); ctx.stroke(); ctx.restore();
    }
    function llama(x, y, r, color) {
      ctx.save(); ctx.translate(x, y); ctx.fillStyle = color; ctx.beginPath();
      ctx.moveTo(0, -r); ctx.bezierCurveTo(r * 0.9, -r * 0.2, r * 0.8, r * 0.8, 0, r); ctx.bezierCurveTo(-r * 0.8, r * 0.8, -r * 0.9, -r * 0.1, -r * 0.2, -r * 0.45);
      ctx.bezierCurveTo(-r * 0.1, -r * 0.1, r * 0.05, -r * 0.3, 0, -r); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(0, r * 0.45, r * 0.3, r * 0.4, 0, 0, 7); ctx.fill(); ctx.restore();
    }

    // ---------- mascota propia (se dibuja con código) ----------
    function mascota(x, y, tam, lt, o = {}) {
      const M = P.mascota; if (!M || M.visible === false) return;
      const { habla = 0, mira = 0, salto = 0, alfa = 1, saluda = 0 } = o;
      const col = M.color || C.principal, lin = C.texto, lw = Math.max(3, tam * 0.045);
      const bob = Math.sin(lt * 6) * tam * 0.02 - salto * tam * 0.18, sq = 1 + Math.sin(lt * 6 + 1) * 0.025;
      ctx.save(); ctx.globalAlpha *= alfa; ctx.translate(x, y + bob); ctx.scale(1 / sq, sq);
      ctx.lineWidth = lw; ctx.strokeStyle = lin; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      // pies
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * tam * 0.2, tam * 0.47, tam * 0.13, tam * 0.075, 0, 0, 7); ctx.fillStyle = tono(col, 0.75); ctx.fill(); ctx.stroke(); }
      // brazo que saluda
      if (saluda > 0) {
        const ang = -0.6 + Math.sin(lt * 14) * 0.45 * saluda;
        ctx.save(); ctx.translate(tam * 0.42, tam * 0.02); ctx.rotate(ang); ctx.beginPath(); ctx.ellipse(tam * 0.12, -tam * 0.12, tam * 0.08, tam * 0.16, 0.5, 0, 7);
        ctx.fillStyle = col; ctx.fill(); ctx.stroke(); ctx.restore();
      }
      // cuerpo
      ctx.beginPath(); const f = M.forma;
      if (f === 'circulo') ctx.arc(0, 0, tam * 0.48, 0, 7);
      else if (f === 'gota') { ctx.moveTo(0, -tam * 0.58); ctx.bezierCurveTo(tam * 0.32, -tam * 0.3, tam * 0.52, 0, tam * 0.48, tam * 0.16); ctx.bezierCurveTo(tam * 0.42, tam * 0.5, -tam * 0.42, tam * 0.5, -tam * 0.48, tam * 0.16); ctx.bezierCurveTo(-tam * 0.52, 0, -tam * 0.32, -tam * 0.3, 0, -tam * 0.58); }
      else if (f === 'cuadrado') { rr(-tam * 0.48, -tam * 0.46, tam * 0.96, tam * 0.9, tam * 0.24); }
      else if (f === 'nube') { for (const [cx2, cy2, r2] of [[-0.24, 0.05, 0.3], [0.24, 0.05, 0.3], [0, -0.16, 0.34], [-0.06, 0.18, 0.3], [0.1, 0.18, 0.3]]) { ctx.moveTo(tam * (cx2 + r2), tam * cy2); ctx.arc(tam * cx2, tam * cy2, tam * r2, 0, 7); } }
      else { rr(-tam * 0.5, -tam * 0.44, tam, tam * 0.84, tam * 0.36); ctx.moveTo(-tam * 0.26, tam * 0.36); ctx.lineTo(-tam * 0.4, tam * 0.56); ctx.lineTo(-tam * 0.06, tam * 0.4); }
      ctx.fillStyle = col; ctx.fill(); if (f !== 'nube') ctx.stroke();
      if (f === 'nube') { ctx.save(); ctx.globalAlpha = 0.9; ctx.stroke(); ctx.restore(); }
      // brillo
      ctx.save(); ctx.globalAlpha = 0.3; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(-tam * 0.26, -tam * 0.26, tam * 0.1, tam * 0.06, -0.6, 0, 7); ctx.fill(); ctx.restore();
      // mofletes
      ctx.save(); ctx.globalAlpha = 0.45; ctx.fillStyle = '#FF7FA6';
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * tam * 0.3, tam * 0.1, tam * 0.07, tam * 0.045, 0, 0, 7); ctx.fill(); } ctx.restore();
      // ojos (parpadean cada 2,7 s)
      const parp = (lt % 2.7) < 0.1 ? 0.15 : 1;
      for (const s of [-1, 1]) {
        const ex = s * tam * 0.17, ey = -tam * 0.07;
        ctx.beginPath(); ctx.ellipse(ex, ey, tam * 0.12, tam * 0.14 * parp, 0, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
        if (parp > 0.5) {
          ctx.beginPath(); ctx.arc(ex + mira * tam * 0.04, ey + tam * 0.02, tam * 0.065, 0, 7); ctx.fillStyle = lin; ctx.fill();
          ctx.beginPath(); ctx.arc(ex + mira * tam * 0.04 - tam * 0.022, ey - tam * 0.005, tam * 0.022, 0, 7); ctx.fillStyle = '#fff'; ctx.fill();
        }
      }
      // boca
      const ab = habla > 0 ? habla * (0.35 + 0.65 * Math.abs(Math.sin(lt * 21))) : 0;
      if (ab > 0.08) {
        ctx.beginPath(); ctx.ellipse(0, tam * 0.17, tam * 0.085, tam * 0.075 * ab + tam * 0.01, 0, 0, 7); ctx.fillStyle = '#6B1834'; ctx.fill(); ctx.stroke();
        ctx.save(); ctx.clip(); ctx.beginPath(); ctx.ellipse(0, tam * 0.17 + tam * 0.06 * ab, tam * 0.06, tam * 0.04, 0, 0, 7); ctx.fillStyle = '#FF7FA6'; ctx.fill(); ctx.restore();
      } else { ctx.beginPath(); ctx.arc(0, tam * 0.1, tam * 0.08, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
      // accesorios
      if (M.accesorio === 'gafas') {
        ctx.save(); ctx.lineWidth = lw * 0.9; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * tam * 0.17, -tam * 0.07, tam * 0.15, 0, 7); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(-tam * 0.03, -tam * 0.08); ctx.lineTo(tam * 0.03, -tam * 0.08); ctx.stroke(); ctx.restore();
      } else if (M.accesorio === 'pajarita') {
        ctx.save(); ctx.translate(0, tam * 0.33); ctx.fillStyle = C.acento; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-tam * 0.12, -tam * 0.07); ctx.lineTo(-tam * 0.12, tam * 0.07); ctx.closePath();
        ctx.moveTo(0, 0); ctx.lineTo(tam * 0.12, -tam * 0.07); ctx.lineTo(tam * 0.12, tam * 0.07); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      } else if (M.accesorio === 'auriculares') {
        ctx.save(); ctx.lineWidth = lw * 1.4; ctx.beginPath(); ctx.arc(0, -tam * 0.05, tam * 0.5, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
        for (const s of [-1, 1]) { rr(s * tam * 0.5 - tam * 0.07, -tam * 0.12, tam * 0.14, tam * 0.24, tam * 0.06); ctx.fillStyle = C.acento; ctx.fill(); ctx.stroke(); } ctx.restore();
      }
      ctx.restore();
    }
    function bocadillo(x, y, texto, p, o = {}) {
      if (p <= 0) return;
      const { tam = 64 * S, fondo = C.claro, color = C.texto, cola = 'izq' } = o;
      ctx.save(); ctx.font = fuente(700, tam, FT);
      const w = ctx.measureText(texto).width + tam * 1.2, h = tam * 1.7, sc = eBack(p);
      const ax = cola === 'izq' ? x - w * 0.35 : x + w * 0.35;
      ctx.translate(ax, y + h / 2); ctx.scale(sc, sc); ctx.translate(-ax, -(y + h / 2));
      ctx.lineWidth = Math.max(3, tam * 0.08); ctx.strokeStyle = C.texto; ctx.fillStyle = fondo;
      rr(x - w / 2, y - h / 2, w, h, h * 0.4); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ax - tam * 0.25, y + h / 2 - 2); ctx.lineTo(ax - (cola === 'izq' ? tam * 0.5 : -tam * 0.5), y + h / 2 + tam * 0.6); ctx.lineTo(ax + tam * 0.3, y + h / 2 - 2);
      ctx.fill(); ctx.stroke(); ctx.fillStyle = fondo; ctx.fillRect(ax - tam * 0.2, y + h / 2 - ctx.lineWidth * 1.5, tam * 0.45, ctx.lineWidth * 2);
      ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(texto, x, y + tam * 0.04); ctx.restore();
    }
    // Icono de la marca: el logo del usuario o un cuadrado redondeado con la mascota
    function icono(x, y, tam, lt, sobreColor) {
      if (logoImg) { const r = Math.min(tam / logoImg.width, tam / logoImg.height); ctx.drawImage(logoImg, x - logoImg.width * r / 2, y - logoImg.height * r / 2, logoImg.width * r, logoImg.height * r); return; }
      ctx.save(); ctx.lineWidth = Math.max(3, tam * 0.03); ctx.strokeStyle = C.texto;
      ctx.fillStyle = sobreColor === C.claro ? C.principal : C.claro;
      rr(x - tam / 2, y - tam / 2, tam, tam, tam * 0.26); ctx.fill(); ctx.stroke(); ctx.restore();
      mascota(x, y + tam * 0.04, tam * 0.66, lt);
    }
    function marcaPalabra(x, y, tam, color, alfa = 1) { return txt(P.marca.nombre, x, y, { tam, peso: 700, color, alfa }); }
    function decor(e, lt) {
      if (e.decor === false || (e.tipo === 'final' && e.decor !== true)) return;  // el final, limpio
      const r = rnd(e.i + 7), base = e._fondo;
      const col = luz(base) > 0.6 ? C.principal : C.claro;
      ctx.save();
      for (let i = 0; i < 9; i++) {
        const x0 = r() * W, y0 = r() * H, s0 = (16 + r() * 34) * S, k = r(), vel = 18 + r() * 30;
        const x = x0 + Math.sin(lt * 0.9 + i) * 14 * S, y = y0 - lt * vel * S;
        ctx.globalAlpha = 0.16 + k * 0.12; ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 6 * S;
        if (i % 3 === 0) { ctx.beginPath(); ctx.arc(x, y, s0, 0, 7); ctx.stroke(); }
        else if (i % 3 === 1) { ctx.beginPath(); ctx.moveTo(x - s0, y); ctx.lineTo(x + s0, y); ctx.moveTo(x, y - s0); ctx.lineTo(x, y + s0); ctx.stroke(); }
        else { ctx.beginPath(); ctx.arc(x, y, s0 * 0.45, 0, 7); ctx.fill(); }
      }
      ctx.restore();
    }

    // ---------- pantalla de la app (para el móvil) ----------
    const pant = (typeof OffscreenCanvas !== 'undefined') ? new OffscreenCanvas(10, 10) : document.createElement('canvas');
    function pintarPantalla(w, h, lt, e) {
      pant.width = Math.round(w); pant.height = Math.round(h); const g = pant.getContext('2d'); const u = w / 400;
      g.fillStyle = C.fondo; g.fillRect(0, 0, w, h);
      g.fillStyle = C.principal; g.fillRect(0, 0, w, 150 * u);
      g.fillStyle = C.claro; g.font = fuente(700, 34 * u, FT); g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText(P.marca.nombre, 28 * u, 92 * u);
      g.font = fuente(600, 20 * u, FX); g.textAlign = 'right'; g.fillText(e.racha || '7 días', w - 28 * u, 92 * u);
      const filas = e.filas || ['Saludar', 'Pedir un café', 'Presentarte'];
      filas.forEach((f, i) => {
        const y = 190 * u + i * 120 * u, p = eOut(tramo(lt, 0.15 + i * 0.15, 0.4));
        g.save(); g.globalAlpha = p; g.translate((1 - p) * 60 * u, 0);
        g.fillStyle = C.claro; g.beginPath(); g.roundRect ? g.roundRect(24 * u, y, w - 48 * u, 100 * u, 22 * u) : g.rect(24 * u, y, w - 48 * u, 100 * u); g.fill();
        g.fillStyle = [C.principal, C.secundario, C.acento][i % 3]; g.beginPath(); g.arc(74 * u, y + 50 * u, 28 * u, 0, 7); g.fill();
        g.fillStyle = C.texto; g.font = fuente(700, 22 * u, FX); g.textAlign = 'left'; g.fillText(f, 118 * u, y + 38 * u);
        g.fillStyle = tono(C.fondo, 0.9); g.fillRect(118 * u, y + 62 * u, 220 * u, 12 * u);
        g.fillStyle = C.principal; g.fillRect(118 * u, y + 62 * u, 220 * u * cl(eOut(tramo(lt, 0.4 + i * 0.2, 0.7)) * [1, 0.7, 0.35][i % 3]), 12 * u);
        g.restore();
      });
      g.fillStyle = C.secundario; g.beginPath(); const by = h - 150 * u; g.roundRect ? g.roundRect(40 * u, by, w - 80 * u, 76 * u, 38 * u) : g.rect(40 * u, by, w - 80 * u, 76 * u); g.fill();
      g.fillStyle = C.claro; g.font = fuente(700, 26 * u, FT); g.textAlign = 'center'; g.fillText(e.boton || 'Empezar', w / 2, by + 39 * u);
      return pant;
    }

    // ---------- tipos de escena ----------
    const T = {
      logo(e, lt, d) {
        const p1 = eOut(tramo(lt, 0, 0.6)), p2 = eOut(tramo(lt, 0.1, 0.7));
        ctx.save(); ctx.strokeStyle = C.claro; ctx.globalAlpha = 1 - p1 * 0.8; ctx.lineWidth = 40 * S * (1 - p1) + 4; ctx.beginPath(); ctx.arc(CX, CY - 60 * S, 520 * S * p1, 0, 7); ctx.stroke();
        ctx.strokeStyle = C.acento; ctx.globalAlpha = 1 - p2 * 0.7; ctx.lineWidth = 26 * S * (1 - p2) + 3; ctx.beginPath(); ctx.arc(CX, CY - 60 * S, 640 * S * p2, 0, 7); ctx.stroke(); ctx.restore();
        const pr = tramo(lt, 0.12, 0.5);
        if (pr > 0 && pr < 1) for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2, r0 = 220 * S + 200 * S * eOut(pr), r1 = r0 + 70 * S * (1 - pr);
          ctx.save(); ctx.strokeStyle = i % 2 ? C.acento : C.claro; ctx.lineWidth = 12 * S; ctx.lineCap = 'round'; ctx.beginPath();
          ctx.moveTo(CX + Math.cos(a) * r0, CY - 60 * S + Math.sin(a) * r0); ctx.lineTo(CX + Math.cos(a) * r1, CY - 60 * S + Math.sin(a) * r1); ctx.stroke(); ctx.restore();
        }
        const sc = eElastic(tramo(lt, 0.05, 0.8));
        ctx.save(); ctx.translate(CX, CY - 60 * S); ctx.scale(sc, sc); ctx.rotate((1 - sc) * 0.5); icono(0, 0, 330 * S, lt, e._fondo); ctx.restore();
        const pw = eOut(tramo(lt, 0.35, 0.4));
        marcaPalabra(CX, CY + 220 * S + (1 - pw) * 40 * S, 120 * S, luz(e._fondo) > 0.6 ? C.principal : C.claro, pw);
      },
      pregunta(e, lt, d) {
        const colT = luz(e._fondo) > 0.6 ? C.texto : C.claro;
        const tx = HZ ? W * 0.34 : CX, ty = HZ ? CY : H * 0.27, mx = HZ ? W * 0.76 : CX - 60 * S, myF = HZ ? CY + 90 * S : H * 0.66;
        frasePop(e.texto || '¿Te apetece aprender algo nuevo?', tx, ty, lt, { tam: (e.tam || 112) * S, color: colT, resaltar: e.resaltar || [], maxAncho: HZ ? W * 0.56 : W * 0.84 });
        const pe = eBack(tramo(lt, 0.15, 0.45)), my = myF + (1 - pe) * H * 0.6;
        mascota(mx, my, (HZ ? 400 : 440) * S, lt, { habla: lt > 0.45 && lt < d - 0.15 ? 1 : 0, mira: HZ ? -0.6 : 0.6, saluda: tramo(lt, 0.3, 0.3) });
        if (e.bocadillo) bocadillo(mx + (HZ ? 60 : 270) * S, myF - 320 * S, e.bocadillo, tramo(lt, 0.45, 0.35), { tam: 60 * S, cola: 'izq' });
      },
      palabras(e, lt, d) {
        const lista = e.palabras && e.palabras.length ? e.palabras : ['Aprende', 'Practica', 'Avanza'];
        const n = lista.length, seg = d / n, k = Math.min(n - 1, Math.floor(lt / seg)), lk = lt - k * seg;
        const cols = (e.colores || ['principal', 'secundario', 'acento']).map((c) => C[c] || c);  // nombre de la marca o hex
        const bg = cols[k % cols.length]; ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
        const tc = luz(bg) > 0.6 ? C.texto : C.claro, p = eOut(lk / 0.22);
        for (let i = 0; i < 4; i++) estrella(W * [0.15, 0.85, 0.2, 0.82][i], H * [0.22, 0.3, 0.75, 0.7][i], (34 + i * 6) * S * p, tc, lt * 2 + i);
        ctx.save(); ctx.translate(CX, CY); const sc = lerp(1.45, 1, p); ctx.scale(sc, sc); ctx.rotate((1 - p) * (k % 2 ? 0.12 : -0.12));
        const r = txt(lista[k], 0, 0, { tam: (e.tam || 200) * S, color: tc, maxAncho: W * 0.88 });
        ctx.fillStyle = tc; ctx.globalAlpha = 0.9; rr(-r.ancho / 2, r.tam * 0.62, r.ancho * eOut(tramo(lk, 0.08, 0.25)), 16 * S, 8 * S); ctx.fill(); ctx.restore();
        for (let i = 0; i < n; i++) { ctx.save(); ctx.globalAlpha = i === k ? 1 : 0.35; ctx.fillStyle = tc; ctx.beginPath(); ctx.arc(CX + (i - (n - 1) / 2) * 44 * S, H * 0.86, (i === k ? 13 : 9) * S, 0, 7); ctx.fill(); ctx.restore(); }
      },
      descubre(e, lt, d) {
        const p = eInOut(tramo(lt, 0, 0.5));
        ctx.save(); ctx.fillStyle = C.principal; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.moveTo(-W * 0.1, H); ctx.lineTo(W * 1.2 * p - W * 0.1, H); ctx.lineTo(W * 0.8 * p - W * 0.3, H * 0.62); ctx.lineTo(-W * 0.3, H * 0.62); ctx.fill();
        ctx.fillStyle = C.secundario; ctx.beginPath(); ctx.moveTo(W * 1.1, 0); ctx.lineTo(W * 1.1 - W * 0.9 * p, 0); ctx.lineTo(W * 1.1 - W * 0.6 * p, H * 0.2); ctx.lineTo(W * 1.1, H * 0.2); ctx.fill(); ctx.restore();
        const p1 = eOut(tramo(lt, 0.05, 0.35));
        txt(e.texto || 'Descubre', CX - (1 - p1) * 200 * S, CY - 170 * S, { tam: 90 * S, peso: 600, fam: FX, color: C.texto, alfa: p1 });
        const p2 = eBack(tramo(lt, 0.15, 0.45));
        ctx.save(); ctx.translate(CX, CY + 10 * S); ctx.scale(p2, p2);
        ctx.font = fuente(700, 150 * S, FT); const wm = Math.min(ctx.measureText(P.marca.nombre).width, W * 0.6), ic = 170 * S;
        icono(-wm / 2 - 20 * S, 0, ic, lt, e._fondo);
        txt(P.marca.nombre, ic / 2 - 0 * S, 0, { tam: 150 * S, color: C.principal, maxAncho: W * 0.6 });
        ctx.restore();
      },
      movil(e, lt, d) {
        const pc = eOut(tramo(lt, 0, 0.5)); ctx.save(); ctx.fillStyle = C.secundario; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(CX, CY, (HZ ? 340 : 470) * S * pc, 0, 7); ctx.fill(); ctx.restore();
        const th = lerp(-1.05, 0.22, eInOut(tramo(lt, 0, d * 0.75))) + Math.sin(lt * 2) * 0.04, fy = Math.sin(lt * 3) * 12 * S;
        const pw = (HZ ? 300 : 440) * S, ph = (HZ ? 620 : 900) * S, sx = Math.cos(th), sk = Math.sin(th) * 0.14, grosor = 28 * S * Math.sin(th);
        const ent = eBack(tramo(lt, 0, 0.45));
        ctx.save(); ctx.translate(CX, CY + fy + (1 - ent) * H * 0.5); ctx.rotate(-0.06 + th * 0.05);
        ctx.save(); ctx.transform(sx, sk, 0, 1, 0, 0);
        ctx.fillStyle = '#0D0B1A'; ctx.save(); ctx.translate(-grosor / Math.max(0.2, Math.abs(sx)), 0); rr(-pw / 2, -ph / 2, pw, ph, 64 * S); ctx.fillStyle = '#2B2740'; ctx.fill(); ctx.restore();
        rr(-pw / 2, -ph / 2, pw, ph, 64 * S); ctx.fillStyle = '#0D0B1A'; ctx.fill();
        if (Math.abs(sx) > 0.06) { const sw = pw - 36 * S, sh = ph - 36 * S; const img = pintarPantalla(sw, sh, lt, e); ctx.save(); rr(-sw / 2, -sh / 2, sw, sh, 48 * S); ctx.clip(); ctx.drawImage(img, -sw / 2, -sh / 2, sw, sh); ctx.restore(); }
        rr(-60 * S, -ph / 2 + 30 * S, 120 * S, 30 * S, 15 * S); ctx.fillStyle = '#0D0B1A'; ctx.fill();
        ctx.save(); ctx.globalAlpha = 0.18 * Math.abs(Math.sin(th)); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-pw / 2, -ph / 2); ctx.lineTo(pw * 0.1, -ph / 2); ctx.lineTo(-pw / 2, ph * 0.2); ctx.fill(); ctx.restore();
        ctx.restore(); ctx.restore();
        const chips = e.chips || [];
        chips.forEach((c, i) => {
          const pp = eBack(tramo(lt, 0.35 + i * 0.22, 0.35)); if (pp <= 0) return;
          const lado = i % 2 ? 1 : -1, x = CX + lado * (HZ ? 480 : 330) * S, y = CY + (HZ ? -170 + i * 150 : -260 + i * 250) * S + Math.sin(lt * 3 + i) * 10 * S;
          ctx.save(); ctx.font = fuente(700, 44 * S, FX); const w = ctx.measureText(c).width + 110 * S;
          const xc = cl(x, w / 2 + 16 * S, W - w / 2 - 16 * S); ctx.translate(xc, y); ctx.scale(pp, pp);
          ctx.fillStyle = C.claro; ctx.strokeStyle = C.texto; ctx.lineWidth = 5 * S; rr(-w / 2, -48 * S, w, 96 * S, 48 * S); ctx.fill(); ctx.stroke();
          check(-w / 2 + 50 * S, 0, 26 * S, C.claro, [C.principal, C.secundario, C.acento][i % 3]);
          ctx.fillStyle = C.texto; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(c, -w / 2 + 88 * S, 2 * S); ctx.restore();
        });
      },
      dato(e, lt, d) {
        const tc = luz(e._fondo) > 0.6 ? C.texto : C.claro, pn = eOut(tramo(lt, 0.05, Math.min(0.7, d * 0.7)));
        const num = Math.round(lerp(e.desde ?? 0, e.numero ?? 100, pn)).toLocaleString('es-ES');
        const sc = 1 + Math.sin(tramo(lt, 0.6, 0.25) * Math.PI) * 0.08;
        ctx.save(); ctx.translate(CX, CY - 80 * S); ctx.scale(sc, sc); txt(`${e.prefijo ?? '+'}${num}${e.sufijo ?? ''}`, 0, 0, { tam: 300 * S, color: tc }); ctx.restore();
        const pl = eOut(tramo(lt, 0.2, 0.35)); txt(e.texto || 'idiomas', CX, CY + 130 * S + (1 - pl) * 30 * S, { tam: 86 * S, peso: 600, fam: FX, color: tc, alfa: pl, maxAncho: HZ ? W * 0.56 : W * 0.8 });
        const pr = tramo(lt, 0.55, 0.5); if (pr > 0 && pr < 1) for (let i = 0; i < 14; i++) { const a = (i / 14) * 6.283 + 0.3, r0 = 360 * S * eOut(pr); estrella(CX + Math.cos(a) * r0, CY - 80 * S + Math.sin(a) * r0 * 0.7, 18 * S * (1 - pr), i % 2 ? C.acento : C.claro, a); }
        const pm = eBack(tramo(lt, 0.25, 0.4)); mascota(W - (HZ ? 115 : 210) * S, H + 80 * S - pm * (HZ ? 250 : 330) * S, (HZ ? 240 : 300) * S, lt, { salto: Math.max(0, Math.sin(tramo(lt, 0.6, 0.4) * Math.PI)), mira: -0.7, saluda: 1 });
      },
      tarjeta(e, lt, d) {
        const p = eBack(tramo(lt, 0, 0.45)), cw = (HZ ? 980 : 860) * S, ch = (HZ ? 480 : 520) * S, y = CY + (1 - p) * H * 0.6;
        ctx.save(); ctx.translate(CX + 30 * S, y + 40 * S); ctx.rotate(0.07); ctx.fillStyle = C.secundario; rr(-cw / 2, -ch / 2, cw, ch, 48 * S); ctx.fill(); ctx.restore();
        ctx.save(); ctx.translate(CX, y); ctx.rotate(-0.02 * (1 - p));
        ctx.fillStyle = 'rgba(0,0,0,.12)'; rr(-cw / 2 + 14 * S, -ch / 2 + 22 * S, cw, ch, 48 * S); ctx.fill();
        ctx.fillStyle = C.claro; ctx.strokeStyle = C.texto; ctx.lineWidth = 6 * S; rr(-cw / 2, -ch / 2, cw, ch, 48 * S); ctx.fill(); ctx.stroke();
        ctx.fillStyle = C.principal; ctx.beginPath(); ctx.arc(-cw / 2 + 120 * S, -ch / 2 + 130 * S, 70 * S, 0, 7); ctx.fill();
        mascota(-cw / 2 + 120 * S, -ch / 2 + 136 * S, 100 * S, lt);
        txt(e.titulo || 'Lección 3', -cw / 2 + 230 * S, -ch / 2 + 105 * S, { tam: 62 * S, alinear: 'left', maxAncho: cw * 0.65 });
        txt(e.subtitulo || 'Pedir un café', -cw / 2 + 230 * S, -ch / 2 + 170 * S, { tam: 44 * S, peso: 500, fam: FX, alinear: 'left', color: tono(C.texto, 1.6), maxAncho: cw * 0.65 });
        const pb = eOut(tramo(lt, 0.25, 0.5)) * (e.progreso == null ? 0.8 : e.progreso), bw = cw - 120 * S;
        ctx.fillStyle = tono(C.fondo, 0.92); rr(-bw / 2, 40 * S, bw, 44 * S, 22 * S); ctx.fill();
        if (pb > 0.01) { ctx.fillStyle = C.principal; rr(-bw / 2, 40 * S, bw * pb, 44 * S, 22 * S); ctx.fill(); }
        txt(`${Math.round(pb * 100)} %`, bw / 2, 130 * S, { tam: 48 * S, alinear: 'right', color: C.principal });
        llama(-bw / 2 + 30 * S, 140 * S, 34 * S, C.secundario); txt(e.racha_texto || 'Racha de 7 días', -bw / 2 + 80 * S, 140 * S, { tam: 40 * S, peso: 600, fam: FX, alinear: 'left' });
        ctx.restore();
        const pc = eBack(tramo(lt, 0.5, 0.35));
        if (pc > 0) { ctx.save(); ctx.translate(CX + cw / 2 - 70 * S, y - ch / 2 - 10 * S); ctx.scale(pc, pc); ctx.rotate(0.12); ctx.font = fuente(700, 52 * S, FT);
          const t2 = e.chip || '+20 XP', w = ctx.measureText(t2).width + 70 * S; ctx.fillStyle = C.acento; ctx.strokeStyle = C.texto; ctx.lineWidth = 5 * S; rr(-w / 2, -45 * S, w, 90 * S, 45 * S); ctx.fill(); ctx.stroke();
          ctx.fillStyle = C.texto; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t2, 0, 3 * S); ctx.restore(); }
        const pk = eBack(tramo(lt, 0.65, 0.3)); if (pk > 0) { ctx.save(); ctx.translate(CX - cw / 2 + 40 * S, y + ch / 2 - 10 * S); ctx.scale(pk, pk); check(0, 0, 58 * S, C.claro, C.principal); ctx.restore(); }
      },
      final(e, lt, d) {
        const pt = eInOut(tramo(lt, 0, 0.6));
        ctx.save(); ctx.strokeStyle = C.principal; ctx.lineWidth = 64 * S; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        const pts = []; for (let i = 0; i <= 60; i++) { const u = i / 60; pts.push([lerp(-0.1 * W, CX, u) + Math.sin(u * 9) * 90 * S * (1 - u), lerp(H * 0.85, CY - 60 * S, u) + Math.cos(u * 7) * 120 * S * (1 - u)]); }
        const lim = Math.floor(pts.length * pt), desv = eOut(tramo(lt, 0.5, 0.35));
        ctx.globalAlpha = 1 - desv; ctx.beginPath(); pts.slice(0, Math.max(1, lim)).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); if (lim > 1) ctx.stroke(); ctx.restore();
        const pi = eElastic(tramo(lt, 0.45, 0.7)); if (pi > 0) { ctx.save(); ctx.translate(CX, CY - (HZ ? 175 : 160) * S); ctx.scale(pi, pi); icono(0, 0, (HZ ? 230 : 290) * S, lt, e._fondo); ctx.restore(); }
        const pw = eOut(tramo(lt, 0.6, 0.35)); marcaPalabra(CX, CY + (HZ ? 35 : 80) * S + (1 - pw) * 30 * S, (HZ ? 115 : 130) * S, C.principal, pw);
        const pe = eOut(tramo(lt, 0.75, 0.35)); if (P.marca.eslogan || e.texto) txt(e.texto || P.marca.eslogan, CX, CY + (HZ ? 135 : 190) * S, { tam: 58 * S, peso: 600, fam: FX, color: C.texto, alfa: pe });
        const pc = eBack(tramo(lt, 0.9, 0.35));
        if (e.cta && pc > 0) { const pulso = 1 + Math.sin(lt * 8) * 0.03; ctx.save(); ctx.translate(CX, CY + (HZ ? 255 : 340) * S); ctx.scale(pc * pulso, pc * pulso); ctx.font = fuente(700, 56 * S, FT);
          const w = ctx.measureText(e.cta).width + 120 * S; ctx.fillStyle = C.secundario; ctx.strokeStyle = C.texto; ctx.lineWidth = 6 * S; rr(-w / 2, -60 * S, w, 120 * S, 60 * S); ctx.fill(); ctx.stroke();
          ctx.fillStyle = C.claro; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(e.cta, 0, 4 * S); ctx.restore(); }
      },
      texto(e, lt, d) {
        const colT = luz(e._fondo) > 0.6 ? C.texto : C.claro;
        frasePop(e.texto || P.marca.nombre, HZ && e.mascota !== false ? W * 0.36 : CX, e.mascota === false || HZ ? CY : H * 0.36, lt, { tam: (e.tam || 120) * S, color: colT, resaltar: e.resaltar || [] });
        if (e.mascota !== false) { const pe = eBack(tramo(lt, 0.1, 0.4)); mascota(HZ ? W * 0.77 : CX, (HZ ? CY + 60 * S : H * 0.7) + (1 - pe) * H * 0.6, 380 * S, lt, { habla: e.habla ? 1 : 0, saluda: e.saluda ? 1 : 0 }); }
      }
    };
    const FONDO_DEF = { logo: 'principal', pregunta: 'fondo', palabras: 'principal', descubre: 'fondo', movil: 'fondo', dato: 'principal', tarjeta: 'fondo', final: 'fondo', texto: 'fondo' };

    function pintar(e, t) {
      const lt = Math.max(0, t - e.a), d = e.b - e.a;
      const f = e.fondo ? (C[e.fondo] || e.fondo) : C[FONDO_DEF[e.tipo]];
      e._fondo = f;
      ctx.save(); ctx.fillStyle = f; ctx.fillRect(0, 0, W, H); decor(e, lt); T[e.tipo](e, lt, d); ctx.restore();
    }
    function recorte(tipo, p) {
      const q = eInOut(p); ctx.beginPath();
      if (tipo === 'circulo') ctx.arc(CX, CY, Math.hypot(W, H) * 0.55 * q, 0, 7);
      else if (tipo === 'barrido') ctx.rect(0, 0, W * q, H);
      else if (tipo === 'arriba') ctx.rect(0, H * (1 - q), W, H * q);
      else { ctx.moveTo(0, 0); ctx.lineTo(W * 2 * q, 0); ctx.lineTo(W * 2 * q - W, H); ctx.lineTo(0, H); }
      ctx.clip();
    }
    const TR = 0.26;
    function dibujar(t) {
      t = cl(t, 0, DUR - 1e-4);
      let i = esc.findIndex((e) => t >= e.a && t < e.b); if (i < 0) i = t < esc[0].a ? 0 : esc.length - 1;
      const e = esc[i], lt = t - e.a;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (i > 0 && e.transicion !== 'corte' && lt < TR) {
        pintar(esc[i - 1], t); ctx.save(); recorte(e.transicion, lt / TR); pintar(e, t); ctx.restore();
      } else pintar(e, t);
      if (P.bucle && i === esc.length - 1 && DUR - t < 0.22) { ctx.save(); ctx.globalAlpha = eInOut(1 - (DUR - t) / 0.22); pintar(esc[0], esc[0].a); ctx.restore(); }
    }
    const info = { fps: P.fps, duracion: +DUR.toFixed(3), fotogramas: Math.round(DUR * P.fps), ancho: W, alto: H, avisos,
      escenas: esc.map((e) => ({ tipo: e.tipo, a: e.a, b: e.b })) };
    return { info, dibujar, canvas };
  }
  global.Anuncio = { iniciar };
})(typeof window !== 'undefined' ? window : globalThis);
