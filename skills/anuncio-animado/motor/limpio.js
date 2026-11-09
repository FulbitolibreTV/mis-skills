// limpio.js · estilo «limpio» de anuncio-animado (v1.1): el de los anuncios de motion graphics de las apps grandes.
// Fondo blanco, un solo color de marca con sus tonos, trazos gruesos que cruzan el plano, letra redondeada,
// móvil 3D entre aros y desenfoque de movimiento de verdad (varias sub-imágenes por fotograma).
// Estructura fija de 8 tiempos (logo · pregunta · palabras · descubre · móvil · dato · tarjeta · final);
// los textos, el color, el logo y los tiempos de cada parte salen del plan. Determinista: el mismo segundo, la misma imagen.
// Se usa a través de anuncio.js cuando el plan dice "estilo": "limpio".
(function (global) {
  'use strict';
  const D = [0, 1.0, 2.45, 3.4, 4.42, 6.0, 7.15, 7.76, 9.54];          // tiempos del diseño (segundos)
  const QUIETO = [0.82, 2.0, 3.38, 4.02, 5.0, 7.06, 7.5, 9.25];      // instantes sin movimiento de cada parte (diseño)
  const NOMBRES = ['logo', 'pregunta', 'palabras', 'descubre', 'movil', 'dato', 'tarjeta', 'final'];
  const ICONOS = ['engranaje', 'flecha', 'libro', 'estrella', 'altavoz', 'micro', 'reloj', 'corazon', 'check', 'calendario', 'ninguno'];

  function hex(c) { const m = String(c || '').replace('#', ''); const v = m.length === 3 ? m.split('').map((x) => x + x).join('') : m; const r = [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16)); return r.some(isNaN) ? null : r; }
  function mezcla(c, con, f) { const a = hex(c), b = hex(con); return '#' + a.map((x, i) => Math.round(x + (b[i] - x) * f).toString(16).padStart(2, '0')).join(''); }
  function luz(c) { const [r, g, b] = hex(c); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; }

  async function iniciar(canvas, plan, fuentes, cargarImagen) {
    const P = plan || {}, avisos = [];
    const W = P.ancho || 1080, H = P.alto || 1920, FPS = P.fps || 30, DUR = P.duracion || 9.54;
    const M = P.marca || {}, Cc = M.colores || {};
    let principal = Cc.principal || '#7B4DFF';
    if (!hex(principal)) { avisos.push(`El color principal «${principal}» no es un color #RRGGBB: uso #7B4DFF.`); principal = '#7B4DFF'; }
    if (luz(principal) > 0.72) avisos.push('El color principal es muy claro: el texto blanco encima no se leerá bien. Usa un tono más oscuro.');
    const K = { p: principal, pd: mezcla(principal, '#000000', 0.2), pdd: mezcla(principal, '#000000', 0.52), pl: mezcla(principal, '#ffffff', 0.42),
      pll: mezcla(principal, '#ffffff', 0.86), brillo: mezcla(principal, '#ffffff', 0.3), brillo2: mezcla(principal, '#ffffff', 0.16), bl: '#FFFFFF',
      tx: hex(Cc.texto) ? Cc.texto : '#1E1640', rosa: hex(Cc.secundario) ? Cc.secundario : '#FF8FB1', movil: '#17141F', pantalla: '#221D33', tarjeta: '#2A2538' };
    const FT = M.letra_titulos || 'Fredoka';
    const F = (peso, tam) => `${peso} ${Math.round(tam)}px "${FT}", "Fredoka", "Poppins", sans-serif`;
    const NOMBRE = M.nombre || 'Mi App';
    const T0 = P.textos || {};
    const X = {
      pregunta: T0.pregunta || '¿Quieres probar algo nuevo?', bocadillo: T0.bocadillo || '¡Yo te ayudo!',
      palabras: [].concat(T0.palabras || ['Prueba', 'Avanza', 'Disfruta']).slice(0, 3), iconos: [].concat(T0.iconos || ['engranaje', 'flecha', 'libro']),
      descubre: T0.descubre == null ? 'Descubre' : T0.descubre, movil: T0.movil || NOMBRE, dato: T0.dato || '',
      tarjeta: Object.assign({ titulo: 'Tu primer paso', frase: 'Empieza hoy', boton: 'TOCA PARA EMPEZAR', icono_frase: 'estrella', icono_boton: 'flecha' }, T0.tarjeta || {}),
      iconos_movil: [].concat(T0.iconos_movil || ['estrella', 'libro', 'altavoz', 'estrella', 'micro', 'libro']).slice(0, 6)
    };
    while (X.palabras.length < 3) X.palabras.push(X.palabras[X.palabras.length - 1] || NOMBRE);
    while (X.iconos_movil.length < 6) X.iconos_movil.push(X.iconos_movil[X.iconos_movil.length % 3] || 'estrella');
    const revisa = (lista, que) => lista.forEach((i, k) => { if (!ICONOS.includes(i)) { avisos.push(`Icono «${i}» (${que}) desconocido (valen: ${ICONOS.join(', ')}): uso «ninguno».`); lista[k] = 'ninguno'; } });
    revisa(X.iconos, 'iconos'); revisa(X.iconos_movil, 'iconos_movil');
    for (const c of ['icono_frase', 'icono_boton']) if (!ICONOS.includes(X.tarjeta[c])) { avisos.push(`Icono «${X.tarjeta[c]}» (tarjeta.${c}) desconocido: uso «ninguno».`); X.tarjeta[c] = 'ninguno'; }
    const CONMASCOTA = !(P.mascota === false || (P.mascota && P.mascota.visible === false));
    const largo = (txt, max, que) => { if (String(txt).length > max) avisos.push(`«${txt}» (${que}) tiene ${String(txt).length} caracteres: con más de ${max} la letra se hace pequeña. Acórtalo.`); };
    largo(X.pregunta, 38, 'pregunta'); largo(X.bocadillo, 18, 'bocadillo'); X.palabras.forEach((p) => largo(p, 11, 'palabras'));
    largo((X.descubre + ' ' + NOMBRE).trim(), 18, 'descubre + nombre'); largo(X.dato, 30, 'dato'); largo(X.movil, 22, 'móvil');
    largo(X.tarjeta.titulo, 22, 'tarjeta.titulo'); largo(X.tarjeta.frase, 14, 'tarjeta.frase'); largo(X.tarjeta.boton, 20, 'tarjeta.boton'); largo(NOMBRE, 10, 'nombre');
    // tiempos: los 8 inicios del plan (o los del diseño, estirados a la duración)
    let T = (P.tiempos && P.tiempos.length === 8) ? P.tiempos.map(Number).concat([DUR]) : D.map((d) => d * DUR / D[8]);
    if (P.tiempos && P.tiempos.length !== 8) avisos.push(`"tiempos" necesita 8 inicios (uno por parte: ${NOMBRES.join(', ')}); tiene ${P.tiempos.length}. Uso los del diseño.`);
    for (let i = 0; i < 8; i++) if (!(T[i + 1] - T[i] >= 0.4)) { avisos.push(`La parte ${i + 1} (${NOMBRES[i]}) dura ${(T[i + 1] - T[i]).toFixed(2)} s: cada parte necesita 0,4 s como mínimo. Uso los tiempos del diseño.`); T = D.map((d) => d * DUR / D[8]); break; }
    const aDiseno = (t) => { let i = 0; while (i < 7 && t >= T[i + 1]) i++; return D[i] + (t - T[i]) * (D[i + 1] - D[i]) / (T[i + 1] - T[i]); };

    for (const f of fuentes || []) {
      try { const ff = new FontFace(f.familia, `url(${f.url})`, { weight: String(f.peso) }); await ff.load(); document.fonts.add(ff); }
      catch (e) { avisos.push(`No se cargó la letra ${f.familia} ${f.peso}`); }
    }
    let LOGO = null;
    if (M.logo && cargarImagen) { try { LOGO = await cargarImagen(M.logo); } catch (e) { avisos.push('No se pudo abrir el logo: se usa el icono con la mascota.'); } }

    // Encuadre: el diseño mide 1280×720 y se escala; en vertical se ve más arriba y más abajo
    const S = H > W ? W / 920 : Math.min(W / 1280, H / 720), VW = W / S, VH = H / S;
    const CX = 640, CY = 360, VL = CX - VW / 2, VT = CY - VH / 2, VB = CY + VH / 2, RC = Math.hypot(VW, VH) / 2 + 60;
    canvas.width = W; canvas.height = H;
    const lienzo = canvas.getContext('2d'), tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H;
    const ctx = tmp.getContext('2d');
  const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const tr = (t, a, b) => cl((t - a) / (b - a));
  const eOut = (t) => 1 - Math.pow(1 - cl(t), 3);
  const eIn = (t) => Math.pow(cl(t), 3);
  const eIO = (t) => { t = cl(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  const eBack = (t) => { t = cl(t); const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const eEl = (t) => { t = cl(t); if (t === 0 || t === 1) return t; return Math.pow(2, -9 * t) * Math.sin((t * 9 - 0.75) * (2 * Math.PI / 3)) + 1; };

  // ---------- piezas ----------
  function rr(x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function circulo(x, y, r, c) { if (r <= 0) return; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
  function fondo(c) { ctx.fillStyle = c; ctx.fillRect(0, 0, W, H); }

  // Trazo grueso de pincel (cúbicas encadenadas), recortado entre a y b (0–1 de su longitud)
  function camino(puntos) {
    const pts = [];
    for (let i = 0; i + 3 < puntos.length; i += 3) {
      const [p0, p1, p2, p3] = [puntos[i], puntos[i + 1], puntos[i + 2], puntos[i + 3]];
      for (let k = (i ? 1 : 0); k <= 60; k++) {
        const u = k / 60, v = 1 - u;
        pts.push([v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0], v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1]]);
      }
    }
    const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return { pts, L, total: L[L.length - 1] };
  }
  function trazo(cam, a, b, ancho, color = K.p) {
    a = cl(a); b = cl(b); if (b - a < 0.002) { if (b > 0 && a < 1) { const p = punto(cam, a); circulo(p[0], p[1], ancho / 2, color); } return; }
    const la = a * cam.total, lb = b * cam.total, sel = [];
    sel.push(punto(cam, a)); for (let i = 0; i < cam.pts.length; i++) if (cam.L[i] > la && cam.L[i] < lb) sel.push(cam.pts[i]); sel.push(punto(cam, b));
    const linea = (dx, dy, w, c, alfa = 1) => { ctx.save(); ctx.globalAlpha *= alfa; ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); sel.forEach((p, i) => (i ? ctx.lineTo(p[0] + dx, p[1] + dy) : ctx.moveTo(p[0] + dx, p[1] + dy))); ctx.stroke(); ctx.restore(); };
    linea(0, ancho * 0.12, ancho, K.pd); linea(0, 0, ancho, color); linea(-ancho * 0.08, -ancho * 0.16, ancho * 0.32, K.pl, 0.55);
  }
  function punto(cam, f) {
    const l = cl(f) * cam.total; let i = 1; while (i < cam.L.length - 1 && cam.L[i] < l) i++;
    const s = (l - cam.L[i - 1]) / Math.max(1e-6, cam.L[i] - cam.L[i - 1]);
    return [lerp(cam.pts[i - 1][0], cam.pts[i][0], s), lerp(cam.pts[i - 1][1], cam.pts[i][1], s)];
  }

  // Charlo: bocadillo de diálogo con ojos, con volumen (degradados) como la mascota 3D del original
  function mascota(x, y, s, o = {}) {
    const { rot = 0, mira = [0.3, -0.2], parpadeo = 0, escala = 1, boca = 0.5 } = o;
    if (escala <= 0.001) return;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(escala, escala);
    // sombra en el suelo
    ctx.save(); ctx.globalAlpha *= 0.12; ctx.fillStyle = K.tx; ctx.beginPath(); ctx.ellipse(0, s * 0.56, s * 0.42, s * 0.07, 0, 0, 7); ctx.fill(); ctx.restore();
    // cuerpo + rabito
    const g = ctx.createRadialGradient(-s * 0.2, -s * 0.28, s * 0.05, 0, 0, s * 0.75);
    g.addColorStop(0, K.brillo); g.addColorStop(0.55, K.p); g.addColorStop(1, K.pd);
    ctx.fillStyle = g;
    rr(-s * 0.5, -s * 0.44, s, s * 0.86, s * 0.4); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-s * 0.3, s * 0.3); ctx.quadraticCurveTo(-s * 0.36, s * 0.52, -s * 0.5, s * 0.6); ctx.quadraticCurveTo(-s * 0.12, s * 0.56, -s * 0.02, s * 0.36); ctx.closePath(); ctx.fillStyle = K.pd; ctx.fill();
    // brillo
    ctx.save(); ctx.globalAlpha *= 0.35; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(-s * 0.24, -s * 0.3, s * 0.16, s * 0.07, -0.5, 0, 7); ctx.fill(); ctx.restore();
    // ojos
    for (const lado of [-1, 1]) {
      const ex = lado * s * 0.2, ey = -s * 0.06, rx = s * 0.15, ry = s * 0.18 * (1 - 0.92 * cl(parpadeo));
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(ex, ey, rx, Math.max(1, ry), 0, 0, 7); ctx.fill();
      if (parpadeo < 0.6) {
        const px = ex + mira[0] * s * 0.06, py = ey + mira[1] * s * 0.06;
        ctx.fillStyle = K.tx; ctx.beginPath(); ctx.ellipse(px, py, s * 0.085, s * 0.095 * (1 - cl(parpadeo)), 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(px - s * 0.03, py - s * 0.035, s * 0.028, 0, 7); ctx.fill();
      }
    }
    // mofletes y boca
    ctx.save(); ctx.globalAlpha *= 0.65; ctx.fillStyle = K.rosa;
    for (const lado of [-1, 1]) { ctx.beginPath(); ctx.ellipse(lado * s * 0.34, s * 0.12, s * 0.07, s * 0.04, 0, 0, 7); ctx.fill(); }
    ctx.restore();
    ctx.strokeStyle = K.tx; ctx.lineWidth = s * 0.035; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, s * 0.13, s * 0.07 * (0.6 + boca * 0.6), 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    ctx.restore();
  }
  // Icono de la app: cuadrado redondeado con la cara de Charlo
  function icono(x, y, s, cara = 1, rot = 0) {
    if (s <= 0.5) return;
    if (LOGO) {                                  // logo del usuario: entero, sin deformar, en un cuadrado de lado s
      const k = s / Math.max(LOGO.width, LOGO.height); ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      ctx.drawImage(LOGO, -LOGO.width * k / 2, -LOGO.height * k / 2, LOGO.width * k, LOGO.height * k); ctx.restore(); return;
    }
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const g = ctx.createLinearGradient(0, -s / 2, 0, s / 2); g.addColorStop(0, K.brillo2); g.addColorStop(1, K.pd);
    ctx.fillStyle = K.pdd; rr(-s / 2, -s / 2 + s * 0.06, s, s, s * 0.28); ctx.fill();
    ctx.fillStyle = g; rr(-s / 2, -s / 2, s, s, s * 0.28); ctx.fill();
    if (cara > 0) {
      const c = eBack(cara);
      for (const lado of [-1, 1]) {
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(lado * s * 0.19, -s * 0.02, s * 0.14 * c, s * 0.17 * c, 0, 0, 7); ctx.fill();
        ctx.fillStyle = K.tx; ctx.beginPath(); ctx.arc(lado * s * 0.19 + s * 0.025, s * 0.0, s * 0.075 * c, 0, 7); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(lado * s * 0.19, -s * 0.03, s * 0.025 * c, 0, 7); ctx.fill();
      }
      ctx.save(); ctx.globalAlpha *= 0.6 * cl(cara); ctx.fillStyle = K.rosa;
      for (const lado of [-1, 1]) { ctx.beginPath(); ctx.ellipse(lado * s * 0.3, s * 0.2, s * 0.06, s * 0.035, 0, 0, 7); ctx.fill(); }
      ctx.restore();
    }
    ctx.restore();
  }
  // Texto que se escribe letra a letra (la última entra con fundido)
  function texto(str, x, y, tam, color, o = {}) {
    const { peso = 600, alinear = 'center', escribe = 1, alfa = 1, maxAncho = VW - 90 } = o;
    tam = ajustar(str, tam, maxAncho, peso); ctx.save(); ctx.font = F(peso, tam); ctx.textBaseline = 'middle'; ctx.fillStyle = color; const base = ctx.globalAlpha * alfa;
    const total = ctx.measureText(str).width; let x0 = alinear === 'center' ? x - total / 2 : alinear === 'right' ? x - total : x;
    const n = escribe * str.length;
    for (let i = 0; i < str.length && i < n; i++) {
      const ch = str[i], w = ctx.measureText(ch).width; ctx.globalAlpha = base * cl(n - i);
      ctx.fillText(ch, x0, y); x0 += w;
    }
    ctx.restore(); return total;
  }
  function ajustar(str, tam, max, peso = 600) { let t = tam; while (t > 10 && medir(str, t, peso) > max) t *= 0.95; return t; }
  function medir(str, tam, peso = 600) { ctx.save(); ctx.font = F(peso, tam); const w = ctx.measureText(str).width; ctx.restore(); return w; }
  // iconos pequeños (trazo)
  function ico(tipo, x, y, s, c) {
    ctx.save(); ctx.translate(x, y); ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = s * 0.14; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (tipo === 'engranaje') { ctx.beginPath(); for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, r = i % 2 ? s * 0.36 : s * 0.5; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, s * 0.15, 0, 7); ctx.stroke(); }
    if (tipo === 'flecha') { ctx.beginPath(); ctx.moveTo(-s * 0.5, s * 0.3); ctx.lineTo(-s * 0.1, -s * 0.05); ctx.lineTo(s * 0.1, s * 0.12); ctx.lineTo(s * 0.5, -s * 0.3); ctx.stroke(); ctx.beginPath(); ctx.moveTo(s * 0.22, -s * 0.32); ctx.lineTo(s * 0.5, -s * 0.3); ctx.lineTo(s * 0.48, -s * 0.04); ctx.stroke(); }
    if (tipo === 'libro') { rr(-s * 0.45, -s * 0.38, s * 0.9, s * 0.76, s * 0.1); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, -s * 0.38); ctx.lineTo(0, s * 0.38); ctx.stroke(); }
    if (tipo === 'altavoz') { ctx.beginPath(); ctx.moveTo(-s * 0.45, -s * 0.15); ctx.lineTo(-s * 0.2, -s * 0.15); ctx.lineTo(s * 0.05, -s * 0.4); ctx.lineTo(s * 0.05, s * 0.4); ctx.lineTo(-s * 0.2, s * 0.15); ctx.lineTo(-s * 0.45, s * 0.15); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.arc(s * 0.1, 0, s * 0.3, -0.9, 0.9); ctx.stroke(); }
    if (tipo === 'micro') { rr(-s * 0.15, -s * 0.45, s * 0.3, s * 0.55, s * 0.15); ctx.fill(); ctx.beginPath(); ctx.arc(0, -s * 0.05, s * 0.3, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, s * 0.25); ctx.lineTo(0, s * 0.45); ctx.stroke(); }
    if (tipo === 'reloj') { ctx.beginPath(); ctx.arc(0, 0, s * 0.45, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, -s * 0.25); ctx.lineTo(0, 0); ctx.lineTo(s * 0.2, s * 0.12); ctx.stroke(); }
    if (tipo === 'corazon') { ctx.beginPath(); ctx.moveTo(0, s * 0.4); ctx.bezierCurveTo(-s * 0.6, 0, -s * 0.4, -s * 0.55, 0, -s * 0.2); ctx.bezierCurveTo(s * 0.4, -s * 0.55, s * 0.6, 0, 0, s * 0.4); ctx.fill(); }
    if (tipo === 'check') { ctx.beginPath(); ctx.moveTo(-s * 0.4, 0); ctx.lineTo(-s * 0.1, s * 0.3); ctx.lineTo(s * 0.45, -s * 0.3); ctx.stroke(); }
    if (tipo === 'calendario') { rr(-s * 0.42, -s * 0.34, s * 0.84, s * 0.74, s * 0.1); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-s * 0.42, -s * 0.1); ctx.lineTo(s * 0.42, -s * 0.1); ctx.moveTo(-s * 0.2, -s * 0.48); ctx.lineTo(-s * 0.2, -s * 0.28); ctx.moveTo(s * 0.2, -s * 0.48); ctx.lineTo(s * 0.2, -s * 0.28); ctx.stroke(); }
    if (tipo === 'estrella') { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, r = i % 2 ? s * 0.22 : s * 0.5; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }
  function bocadillo(x, y, str, esc) {
    if (esc <= 0.01) return; const tam = ajustar(str, 34, 520), w = medir(str, tam) + 52, h = 64;
    ctx.save(); ctx.translate(x, y); ctx.scale(esc, esc); ctx.rotate(-0.05);
    ctx.fillStyle = K.pd; rr(-w / 2, -h / 2 + 5, w, h, 32); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.strokeStyle = K.p; ctx.lineWidth = 3; rr(-w / 2, -h / 2, w, h, 32); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-w / 2 + 22, h / 2 - 2); ctx.lineTo(-w / 2 + 8, h / 2 + 16); ctx.lineTo(-w / 2 + 40, h / 2 - 2); ctx.fillStyle = '#fff'; ctx.fill();
    texto(str, 0, 1, tam, K.p); ctx.restore();
  }
  // Móvil «3D»: giro en Y simulado (ancho × cos y canto lateral) e inclinación
  function movil(x, y, esc, giroY, inclina, t) {
    if (esc <= 0.01) return;
    const w = 240, h = 480, k = Math.cos(giroY), canto = Math.sin(giroY) * 26;
    ctx.save(); ctx.translate(x, y); ctx.rotate(inclina); ctx.scale(esc, esc);
    ctx.save(); ctx.translate(canto, 10); ctx.scale(k, 1); ctx.fillStyle = '#0B0A10'; rr(-w / 2, -h / 2, w, h, 40); ctx.fill(); ctx.restore();   // canto
    ctx.save(); ctx.scale(k, 1);
    ctx.fillStyle = K.movil; rr(-w / 2, -h / 2, w, h, 40); ctx.fill();
    ctx.fillStyle = K.pantalla; rr(-w / 2 + 12, -h / 2 + 12, w - 24, h - 24, 30); ctx.fill();
    ctx.fillStyle = '#000'; rr(-30, -h / 2 + 20, 60, 14, 7); ctx.fill();
    ctx.fillStyle = K.p; rr(-w / 2 + 24, -h / 2 + 46, w - 48, 34, 12); ctx.fill();
    ctx.save(); ctx.globalAlpha = 0.85; texto(X.movil, 0, -h / 2 + 64, 15, '#fff', { peso: 500 }); ctx.restore();
    const icos = X.iconos_movil;
    for (let i = 0; i < 6; i++) {
      const bx = Math.sin(i * 1.1) * 46, by = -h / 2 + 130 + i * 56, ap = eBack(tr(t, 4.62 + i * 0.05, 4.9 + i * 0.05));
      if (ap <= 0) continue;
      ctx.save(); ctx.translate(bx, by); ctx.scale(ap, ap);
      ctx.fillStyle = K.pdd; ctx.beginPath(); ctx.ellipse(0, 5, 30, 25, 0, 0, 7); ctx.fill();
      ctx.fillStyle = i < 3 ? K.p : '#4A4460'; ctx.beginPath(); ctx.ellipse(0, 0, 30, 25, 0, 0, 7); ctx.fill();
      if (icos[i] !== 'ninguno') ico(icos[i], 0, 0, 22, '#fff'); ctx.restore();
    }
    // reflejo del cristal
    ctx.save(); ctx.globalAlpha = 0.08 + 0.06 * Math.sin(giroY * 2); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-w / 2 + 12, -h / 2 + 60); ctx.lineTo(w / 2 - 12, -h / 2 + 12); ctx.lineTo(w / 2 - 12, -h / 2 + 120); ctx.lineTo(-w / 2 + 12, -h / 2 + 200); ctx.fill(); ctx.restore();
    ctx.restore();
    ctx.restore();
  }
  function tarjeta(x, y, esc, rot, alfa) {
    if (esc <= 0.01 || alfa <= 0) return; const w = 470, h = 260;
    ctx.save(); ctx.globalAlpha *= alfa; ctx.translate(x, y); ctx.rotate(rot); ctx.transform(1, 0, -0.12, 1, 0, 0); ctx.scale(esc, esc);
    ctx.save(); ctx.globalAlpha *= 0.25; ctx.fillStyle = '#000'; rr(-w / 2 + 14, -h / 2 + 22, w, h, 30); ctx.fill(); ctx.restore();
    ctx.fillStyle = K.tarjeta; rr(-w / 2, -h / 2, w, h, 30); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 2; rr(-w / 2, -h / 2, w, h, 30); ctx.stroke();
    texto(X.tarjeta.titulo, -w / 2 + 30, -h / 2 + 38, 21, '#fff', { alinear: 'left', maxAncho: w - 60 });
    if (CONMASCOTA) mascota(-w / 2 + 92, 10, 92, { mira: [0.8, -0.3] }); else icono(-w / 2 + 92, 6, 84, 1);
    ctx.fillStyle = '#3A3450'; rr(-30, -36, 225, 56, 18); ctx.fill(); ctx.strokeStyle = '#5A5275'; ctx.lineWidth = 2; ctx.stroke();
    if (X.tarjeta.icono_frase !== 'ninguno') ico(X.tarjeta.icono_frase, -2, -8, 22, K.pl); texto(X.tarjeta.frase, 20, -8, 24, '#fff', { alinear: 'left', maxAncho: 165 });
    ctx.strokeStyle = '#4A4460'; ctx.lineWidth = 3; rr(-w / 2 + 30, h / 2 - 66, w - 60, 44, 22); ctx.stroke();
    if (X.tarjeta.icono_boton !== 'ninguno') ico(X.tarjeta.icono_boton, -80, h / 2 - 44, 20, K.pl); texto(X.tarjeta.boton, -60, h / 2 - 43, 17, K.pl, { alinear: 'left', peso: 600, maxAncho: w / 2 + 20 });
    ctx.restore();
  }
  function aros(x, y, r, partes) { // anillos concéntricos (oscuro, marca, claro) como detrás del móvil del original
    const cols = [K.pdd, K.p, K.pl, K.pd];
    partes.forEach((f, i) => circulo(x, y, r * f, cols[i % cols.length]));
  }


  let PREG2 = null;
  if (ajustar(X.pregunta, 62, VW - 90) < 62 * 0.85 && X.pregunta.includes(' ')) {
    const pal = X.pregunta.split(' '); let mejor = null;
    for (let i = 1; i < pal.length; i++) { const l = [pal.slice(0, i).join(' '), pal.slice(i).join(' ')], w = Math.max(medir(l[0], 62), medir(l[1], 62)); if (!mejor || w < mejor.w) mejor = { l, w }; }
    PREG2 = mejor.l;
  }
  // ---------- trazos ----------
  const T1 = camino([[CX, VT - 60], [CX, 20], [CX - 10, 60], [CX, 100]]);
  const T2 = camino([[CX, VB + 60], [CX, 700], [CX + 10, 660], [CX, 620]]);
  const T3 = camino([[VL - 80, 330], [200, 80], [420, 40], [CX, 70], [860, 100], [1000, 520], [VL + VW + 80, 430]]);
  const T4 = camino([[420, VT - 60], [560, 200], [700, 420], [900, 520], [1050, 590], [1200, 560], [VL + VW + 80, 470]]);
  const T5 = camino([[VL - 60, 360], [200, 330], [380, 520], [CX, 470], [800, 430], [880, 330], [CX + 20, CY]]);
  const T6 = camino([[VL - 60, 640], [300, 700], [700, 580], [880, 420], [980, 280], [720, 150], [580, 240], [480, 330], [560, 470], [CX, 450]]);

  function escena(t) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.fillStyle = K.bl; ctx.fillRect(0, 0, W, H);
    ctx.setTransform(S, 0, 0, S, W / 2 - CX * S, H / 2 - CY * S);
    // 1 · logo: la mascota (o el icono) salta, aro y trazos que la rodean
    if (t < 1.05) {
      const sale = eIn(tr(t, 0.88, 1.02));
      ctx.save(); ctx.translate(CX, CY); ctx.scale(1 - sale, 1 - sale); ctx.translate(-CX, -CY);
      const aro = eBack(tr(t, 0.36, 0.6)), claro = eOut(tr(t, 0.6, 0.8));
      circulo(CX, CY, 270 * aro, K.pdd); circulo(CX, CY, 232 * aro, K.p); circulo(CX, CY, 212 * aro, claro > 0.5 ? K.pll : K.pl);
      trazo(T1, eOut(tr(t, 0.3, 0.6)), eOut(tr(t, 0.12, 0.42)), 34); trazo(T2, eOut(tr(t, 0.3, 0.6)), eOut(tr(t, 0.14, 0.44)), 34);
      trazo(T3, eIO(tr(t, 0.72, 1.0)), eIO(tr(t, 0.56, 0.92)), 34);
      const e = eEl(tr(t, 0.12, 0.62));
      if (CONMASCOTA) mascota(CX, CY + 10, 290, { escala: e, rot: Math.sin(t * 9) * 0.04 * (1 - tr(t, 0.3, 0.8)), mira: [0, 0.1] });
      else icono(CX, CY, 240 * e, 1);
      ctx.restore();
    }
    // 2 · pregunta y la mascota que asoma por abajo con su bocadillo
    if (t >= 0.98 && t < 2.5) {
      const entra = eOut(tr(t, 0.98, 1.24)), sube = eIO(tr(t, 1.45, 1.78)), sefue = eIn(tr(t, 2.1, 2.42));
      const x = lerp(VL - 640, CX, entra), y = lerp(CY, Math.max(VT + 96, CY - 300), sube) - sefue * 60, tam = lerp(62, 58, sube);
      const alfa = lerp(1, 0.85, sube) * (1 - sefue);
      if (PREG2) { texto(PREG2[0], x, y - tam * 0.62, tam, K.p, { alfa }); texto(PREG2[1], x, y + tam * 0.62, tam, K.p, { alfa }); }
      else texto(X.pregunta, x, y, tam, K.p, { alfa });
      const asoma = eOut(tr(t, 1.45, 1.8)), vete = eIn(tr(t, 2.28, 2.46)), suelo = Math.min(VB - 110, CY + 330);
      const mx = lerp(VL - 120, VL + 150, asoma) - vete * 300, my = lerp(suelo + 250, suelo, asoma) + vete * 260;
      if (CONMASCOTA) {
        mascota(mx, my, 270, { rot: -0.18 + Math.sin(t * 6) * 0.03, mira: [0.8, -0.6], parpadeo: Math.max(0, 1 - Math.abs(t - 2.12) / 0.05) });
        if (X.bocadillo) bocadillo(mx + 250, my - 148, X.bocadillo, eBack(tr(t, 1.74, 1.96)) * (1 - vete));
      } else if (X.bocadillo) bocadillo(CX, lerp(CY + 40, CY, sube), X.bocadillo, eBack(tr(t, 1.74, 1.96)) * (1 - vete));
    }
    // 3 · tres palabras con el fondo que cambia (punto → círculo que lo llena)
    if (t >= 2.45 && t < 3.45) {
      if (t < 2.62) circulo(CX, CY, 14 * eOut(tr(t, 2.45, 2.58)), K.p);
      const pal = [[X.palabras[0], X.iconos[0], 2.62, K.p, '#fff'], [X.palabras[1], X.iconos[1], 2.95, '#fff', K.p], [X.palabras[2], X.iconos[2], 3.17, K.p, '#fff']];
      for (let n = 0; n < 3; n++) {
        const [p, ic, a, fondoC, letra] = pal[n];
        if (t < a || (n < 2 && t >= pal[n + 1][2] + 0.1)) continue;
        circulo(CX, CY + 40, eOut(tr(t, a, a + 0.12)) * RC, fondoC);
        const e = eBack(tr(t, a + 0.03, a + 0.2)), conIco = ic && ic !== 'ninguno', tam = ajustar(p, 100, VW - 90 - (conIco ? 110 : 0));
        ctx.save(); ctx.translate(CX, CY); ctx.scale(lerp(0.75, 1, e), lerp(0.75, 1, e)); ctx.globalAlpha = cl(e * 2);
        const w = medir(p, tam); texto(p, conIco ? -48 : 0, 0, tam, letra); if (conIco) ico(ic, w / 2 + 22, -2, 66 * tam / 100, letra); ctx.restore();
        const bola = tr(t, a + 0.02, a + 0.26);
        if (bola > 0 && bola < 1) circulo(lerp(CX + 260, CX + 560, eOut(bola)), lerp(CY + 90, CY - 10, bola), 20, letra);
      }
    }
    // 4 · el icono salta y «Descubre Nombre» se escribe; luego se aleja
    if (t >= 3.4 && t < 4.48) {
      circulo(CX, CY, eOut(tr(t, 3.4, 3.5)) * RC, '#fff');
      const lejos = eIO(tr(t, 4.02, 4.4)), fin = eIn(tr(t, 4.36, 4.48));
      ctx.save(); ctx.translate(CX, CY); const z = lerp(1, 0.52, lejos) * (1 - 0.5 * fin); ctx.scale(z, z); ctx.globalAlpha = 1 - fin; ctx.translate(-CX, -CY);
      const frase = (X.descubre + ' ' + NOMBRE).trim(), tam = ajustar(frase, 80, VW - 90 - 170), wf = medir(frase, tam), si = 140 * tam / 80;
      const ix = lerp(CX, CX - (wf + si + 30) / 2 + si / 2, eIO(tr(t, 3.66, 3.9)));
      icono(ix, CY, si * eBack(tr(t, 3.46, 3.62)), tr(t, 3.6, 3.76));
      texto(frase, ix + si / 2 + 34, CY + 4, tam, K.p, { alinear: 'left', escribe: tr(t, 3.74, 4.02) });
      ctx.restore();
    }
    // 5 · móvil 3D entre aros que se cierran, trazo que cruza y salida rápida
    if (t >= 4.42 && t < 6.0) {
      const llega = eOut(tr(t, 4.42, 4.78)), cierra = eIO(tr(t, 4.9, 5.2)), cierra2 = eIn(tr(t, 5.12, 5.3)), z = lerp(3.2, 1, llega);
      ctx.save(); ctx.translate(CX, CY); ctx.scale(z, z); ctx.translate(-CX, -CY);
      const r = 330 * (1 - cierra * 0.55) * (1 - cierra2);
      if (r > 1) { circulo(CX, CY, r, K.pdd); circulo(CX, CY, r * lerp(0.84, 0, cierra), K.p); circulo(CX, CY, r * lerp(0.66, 0, cierra), K.pl); circulo(CX, CY, r * lerp(0.5, 0.9, cierra), K.pdd); }
      const vete = eIn(tr(t, 5.62, 5.85));
      const mx = CX - vete * (VW / 2 + 400), giro = lerp(-0.7, 0.55, eIO(tr(t, 4.45, 5.6))), incl = lerp(-0.32, 0.28, eIO(tr(t, 4.45, 5.6)));
      trazo(T4, eIO(tr(t, 5.32, 5.9)), eIO(tr(t, 5.1, 5.6)), 26);
      movil(mx, CY, 0.95, giro, incl, t);
      if (CONMASCOTA) {
        const asoman = eBack(tr(t, 4.72, 4.95)) * (1 - vete);
        mascota(mx + 120, CY - 140, 78, { escala: asoman, rot: 0.3, mira: [-0.6, 0.2] });
        mascota(mx - 125, CY + 120, 84, { escala: asoman, rot: -0.25, mira: [0.6, -0.4] });
      }
      ctx.restore();
      trazo(T5, eIO(tr(t, 5.72, 6.0)), eIO(tr(t, 5.6, 5.9)), 26);
    }
    // 6 · punto → círculo de color y el dato que se escribe
    if (t >= 6.0 && t < 7.2) {
      circulo(CX + 20, CY, t < 6.38 ? 13 : eOut(tr(t, 6.38, 6.62)) * RC, K.p);
      if (t >= 6.42 && X.dato) {
        const z = lerp(1.3, 1, eOut(tr(t, 6.42, 7.05))), rot = lerp(-0.07, 0, eOut(tr(t, 6.42, 7.0)));
        ctx.save(); ctx.translate(CX, CY); ctx.rotate(rot); ctx.scale(z, z);
        texto(X.dato, 0, 0, 70, '#fff', { escribe: tr(t, 6.45, 6.95), maxAncho: (VW - 90) / 1.3 }); ctx.restore();
      }
    }
    // 7 · tarjeta de la app que entra volando y se aleja
    if (t >= 7.15 && t < 8.0) {
      const encoge = eIO(tr(t, 7.32, 7.56)), cierra = eIn(tr(t, 7.56, 7.78));
      circulo(CX, CY, lerp(RC, 330, encoge) * (1 - cierra), K.p);
      const llega = eOut(tr(t, 7.15, 7.36)), aleja = eIO(tr(t, 7.6, 7.95)), base = Math.min(1.4, (VW - 120) / 470);
      tarjeta(lerp(CX + VW / 2 + 400, CX, llega) + aleja * 80, CY - aleja * 40, lerp(base * 1.43, base, llega) * lerp(1, 0.55, aleja), lerp(-0.3, -0.12, llega), 1 - eIn(tr(t, 7.78, 7.95)));
    }
    // 8 · trazo que se enrosca, se convierte en el icono y el nombre se escribe; luego todo se desvanece a blanco
    if (t >= 7.76) {
      ctx.save(); ctx.globalAlpha = 1 - eIO(tr(t, 9.3, 9.54));
      const forma = eOut(tr(t, 8.38, 8.56));
      trazo(T6, eIO(tr(t, 7.98, 8.5)), eIO(tr(t, 7.76, 8.26)), 30);
      const tam = ajustar(NOMBRE, 108, VW - 90 - 190, 700), wn = medir(NOMBRE, tam, 700), si = 160 * tam / 108;
      const ix = lerp(CX, CX - (wn + si + 30) / 2 + si / 2, eIO(tr(t, 8.72, 9.0)));
      icono(ix, CY, si * lerp(0.6, 1, eBack(forma)) * (forma > 0 ? 1 : 0), tr(t, 8.55, 8.72), (1 - forma) * 0.4);
      texto(NOMBRE, ix + si / 2 + 38, CY + 4, tam, K.p, { alinear: 'left', escribe: tr(t, 8.82, 9.22), peso: 700 });
      ctx.restore();
    }
  }

  // Desenfoque de movimiento: media de N sub-imágenes dentro del obturador (180°). En la página HTML, menos sub-imágenes.
  const SUB = P.desenfoque == null ? 8 : Math.max(1, Math.round(P.desenfoque));
  function dibujar(t, sub) {
    const n = sub || SUB; t = cl(t, 0, DUR - 1e-4);
    lienzo.setTransform(1, 0, 0, 1, 0, 0);
    for (let k = 0; k < n; k++) {
      const tk = n > 1 ? t + ((k + 0.5) / n - 0.5) * 0.5 / FPS : t;
      escena(aDiseno(cl(tk, 0, DUR - 1e-4)));
      lienzo.globalAlpha = 1 / (k + 1); lienzo.drawImage(tmp, 0, 0);
    }
    lienzo.globalAlpha = 1;
  }
  const info = { fps: FPS, duracion: +DUR.toFixed(3), fotogramas: Math.round(DUR * FPS), ancho: W, alto: H, avisos, estilo: 'limpio',
    // momento de cada parte en que todo está quieto y completo (para la hoja de muestras)
    escenas: NOMBRES.map((tipo, i) => ({ tipo, a: +T[i].toFixed(3), b: +T[i + 1].toFixed(3),
      muestra: +(T[i] + (QUIETO[i] - D[i]) * (T[i + 1] - T[i]) / (D[i + 1] - D[i])).toFixed(3) })) };
  return { info, dibujar, canvas };
  }
  global.Limpio = { iniciar, NOMBRES, ICONOS };
})(typeof window !== 'undefined' ? window : globalThis);
