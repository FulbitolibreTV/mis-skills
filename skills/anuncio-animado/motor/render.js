// Renderiza el anuncio. Se puede relanzar: salta los fotogramas que ya existen.
//   node render.js mi_anuncio/anuncio.json --muestras        → mi_anuncio/muestras.jpg (una hoja con un fotograma de cada escena)
//   node render.js mi_anuncio/anuncio.json --solo 1.2,4.5    → esos segundos a tamaño real, en mi_anuncio/muestras/
//   node render.js mi_anuncio/anuncio.json                   → fotogramas y, cuando están todos, mi_anuncio/anuncio.mp4
//   node render.js mi_anuncio/anuncio.json --portada auto    → mi_anuncio/portada.png (el final ya completo; o un segundo: --portada 4.5)
//   Opciones del MP4: --musica cancion.mp3 (con fundido al final) · --vueltas 2 (repite el anuncio) · --crf 18 · --limite 150 (segundos por tanda)
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const { abrirNavegador, servidor, fuentesDe } = require('./comun.js');

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d; };
const flag = (n) => args.includes('--' + n);
const plan = args.find((a) => a.endsWith('.json'));
if (!plan || !fs.existsSync(plan)) { console.log('Uso: node render.js carpeta/anuncio.json [--muestras | --solo 1.5,3 | --portada auto]'); process.exit(1); }
const dirProy = path.dirname(path.resolve(plan));
const P = JSON.parse(fs.readFileSync(plan, 'utf8'));
const salida = P.salida || 'anuncio';
const dirFot = path.join(dirProy, 'fotogramas');
const nombre = (f) => `f_${String(f).padStart(5, '0')}.jpg`;
const ffmpeg = (a) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...a], { stdio: ['ignore', 'ignore', 'inherit'] });

async function abrir() {
  const { faltan } = fuentesDe(P);
  if (faltan.length) console.log(`Aviso: faltan las letras ${faltan.join(', ')} (npm install @fontsource/<nombre>); se usa otra.`);
  const { nav, origen } = await abrirNavegador();
  const srv = await servidor(plan);
  const p = await nav.newPage({ viewport: { width: 400, height: 400 } });
  p.on('pageerror', (e) => console.log('Error en la página:', e.message));
  await p.goto(`http://127.0.0.1:${srv.address().port}/anuncio.html?plan=/proyecto/${encodeURIComponent(path.basename(plan))}`);
  await p.waitForFunction('window.listo === true', null, { timeout: 120000 });
  const err = await p.evaluate(() => window.errorMotor);
  if (err) { console.log('El plan tiene un error:', err); await nav.close(); srv.close(); process.exit(1); }
  const info = await p.evaluate(() => window.info);
  for (const a of info.avisos) console.log('Aviso:', a);
  return { p, info, origen, cerrar: async () => { await nav.close(); srv.close(); } };
}
const guardar = (dataUrl, archivo) => fs.writeFileSync(archivo, Buffer.from(dataUrl.split(',')[1], 'base64'));

(async () => {
  const { p, info, origen, cerrar } = await abrir();
  const resumen = `${info.ancho}×${info.alto} · ${info.duracion} s · ${info.fotogramas} fotogramas · Chromium: ${origen}`;

  if (flag('muestras')) {
    const tmp = path.join(dirProy, '_muestras_tmp'); fs.mkdirSync(tmp, { recursive: true });
    const tiempos = info.escenas.map((e, i) => e.muestra != null ? e.muestra : +(e.tipo === 'final' || i === info.escenas.length - 1 ? Math.max(e.a, e.b - 0.25) : e.a + Math.min(0.75, (e.b - e.a) * 0.6)).toFixed(2));  // el final, ya completo
    for (let i = 0; i < tiempos.length; i++) guardar(await p.evaluate((f) => window.fotograma(f, 0.9), Math.round(tiempos[i] * info.fps)), path.join(tmp, `m_${String(i).padStart(2, '0')}.jpg`));
    await cerrar();
    const cols = tiempos.length % 4 === 0 ? 4 : (info.ancho > info.alto ? 3 : 4), filas = Math.ceil(tiempos.length / cols), anchoMini = info.ancho > info.alto ? 330 : 240;
    ffmpeg(['-framerate', '1', '-i', path.join(tmp, 'm_%02d.jpg'), '-vf', `scale=${anchoMini}:-2,pad=iw+8:ih+8:4:4:white,tile=${cols}x${filas}`, '-frames:v', '1', '-q:v', '3', path.join(dirProy, 'muestras.jpg')]);
    fs.rmSync(tmp, { recursive: true, force: true });
    console.log(`Hoja de muestras: ${path.join(dirProy, 'muestras.jpg')} (${resumen})`);
    console.log('Escenas:', info.escenas.map((e, i) => `${i}:${e.tipo} ${e.a}–${e.b} s (muestra en ${tiempos[i]} s)`).join(' · '));
    return;
  }
  if (opt('solo', null)) {
    const dir = path.join(dirProy, 'muestras'); fs.mkdirSync(dir, { recursive: true });
    for (const t of opt('solo').split(',').map(Number)) guardar(await p.evaluate((f) => window.fotograma(f, 0.93), Math.round(t * info.fps)), path.join(dir, `seg_${t.toFixed(2)}.jpg`));
    await cerrar(); console.log(`Muestras en ${dir}`); return;
  }
  if (opt('portada', null)) {
    const ult = info.escenas[info.escenas.length - 1], tp = isNaN(+opt('portada')) ? Math.max(ult.a, ult.b - 0.25) : +opt('portada');  // «auto»: el final ya completo
    const png = path.join(dirProy, 'portada.png'), tmpPng = path.join(dirProy, '_portada.png');
    guardar(await p.evaluate((t) => window.png(t), tp), tmpPng);
    ffmpeg(['-i', tmpPng, '-pix_fmt', 'rgb24', png]); fs.rmSync(tmpPng, { force: true });   // sin canal alfa
    await cerrar(); console.log(`Portada: ${path.join(dirProy, 'portada.png')}`); return;
  }

  // Render completo, por tandas
  fs.mkdirSync(dirFot, { recursive: true });
  for (const x of fs.readdirSync(dirFot)) if (+x.slice(2, 7) >= info.fotogramas) fs.unlinkSync(path.join(dirFot, x));
  const limite = +opt('limite', 150), t0 = Date.now(); let hechos = 0;
  for (let f = 0; f < info.fotogramas; f++) {
    const archivo = path.join(dirFot, nombre(f));
    if (fs.existsSync(archivo)) continue;
    if ((Date.now() - t0) / 1000 > limite) break;
    guardar(await p.evaluate((ff) => window.fotograma(ff, 0.93), f), archivo); hechos++;
  }
  await cerrar();
  const listos = fs.readdirSync(dirFot).filter((x) => x.endsWith('.jpg')).length;
  console.log(`${listos}/${info.fotogramas} fotogramas (${hechos} en esta tanda, ${((Date.now() - t0) / 1000).toFixed(0)} s) · ${resumen}`);
  if (listos < info.fotogramas) { console.log('Faltan fotogramas: vuelve a lanzar el mismo comando.'); return; }

  const mp4 = path.join(dirProy, `${salida}.mp4`), vueltas = Math.max(1, +opt('vueltas', 1)), crf = opt('crf', '18');
  const entrada = ['-framerate', String(info.fps), '-i', path.join(dirFot, 'f_%05d.jpg')];
  const video = ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', crf, '-pix_fmt', 'yuv420p', '-movflags', '+faststart'];
  const durTotal = info.duracion * vueltas;
  if (vueltas > 1) entrada.unshift('-stream_loop', String(vueltas - 1));
  const musica = opt('musica', null);
  if (musica) {
    if (!fs.existsSync(musica)) { console.log('No encuentro la música:', musica); process.exit(1); }
    ffmpeg([...entrada, '-i', musica, '-map', '0:v', '-map', '1:a', ...video, '-af', `afade=t=out:st=${Math.max(0, durTotal - 0.6).toFixed(2)}:d=0.6`, '-c:a', 'aac', '-b:a', '192k', '-t', durTotal.toFixed(3), mp4]);
  } else ffmpeg([...entrada, ...video, '-t', durTotal.toFixed(3), mp4]);
  fs.rmSync(dirFot, { recursive: true, force: true });
  console.log(`¡Listo! ${mp4} (${(fs.statSync(mp4).size / 1048576).toFixed(1)} MB, ${durTotal.toFixed(1)} s). Fotogramas temporales borrados.`);
})().catch((e) => { console.log('Error:', e.message); process.exit(1); });
