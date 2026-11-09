// Renderiza los fotogramas del reel a JPG. Se puede relanzar: salta los que ya existen.
//   node render.js proyecto/reel.json [--limite 500]          → render completo, por tandas
//   node render.js proyecto/reel.json --muestras              → un fotograma a mitad de cada escena, en proyecto/muestras/
//   node render.js proyecto/reel.json --solo 30,200           → esos fotogramas, en proyecto/muestras/
//   node render.js proyecto/reel.json --rehacer 4.2-7.3       → borra y vuelve a hacer ese tramo (segundos)
//   --procesos N solo compensa con 4 núcleos o más (con 2, uno va más rápido)
//   Con "base": "../otro/reel.json" en el plan (lo pone final.py), copia de esa versión los fotogramas que no cambian
const fs = require('fs'), path = require('path');
const { spawn } = require('child_process');

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d; };
const flag = (n) => args.includes('--' + n);
const plan = args.find((a) => a.endsWith('.json')) || 'proyecto/reel.json';
const dirProy = path.dirname(path.resolve(plan));
const dirFot = path.join(dirProy, 'fotogramas'), dirMue = path.join(dirProy, 'muestras');
const procesos = +opt('procesos', 1), limite = +opt('limite', 520);
const hijo = opt('hijo', null);
const P = JSON.parse(fs.readFileSync(plan, 'utf8'));
const nombre = (f) => `f_${String(f).padStart(5, '0')}.jpg`;

const { buscarChromium, servidor } = require('./comun.js');

async function abrir() {
  const { pw, exe } = buscarChromium();
  const srv = await servidor(plan);
  const nav = await pw.chromium.launch({ executablePath: exe, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'] });
  const p = await nav.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', (e) => console.log('error en página:', e.message));
  p.on('console', (m) => { if (m.type() === 'error') console.log('consola:', m.text()); });
  await p.goto(`http://localhost:${srv.address().port}/reel.html?plan=proyecto/${path.basename(plan)}`);
  await p.waitForFunction('window.listo === true', null, { timeout: 180000 });
  const info = await p.evaluate(() => window.info);
  fs.writeFileSync(path.join(dirProy, 'info.json'), JSON.stringify({ ...info, eventos: await p.evaluate(() => window.eventos()) }, null, 1));
  return { p, info, cerrar: async () => { await nav.close(); srv.close(); } };
}

// Dos finales: los fotogramas anteriores a la primera escena distinta se copian de la versión base (0,4 s de margen por las transiciones)
function reusarBase(info, lista) {
  if (!P.base) return 0;
  const dirBase = path.dirname(path.resolve(dirProy, P.base));
  let bi; try { bi = JSON.parse(fs.readFileSync(path.join(dirBase, 'info.json'))); } catch { console.error('Aviso: la versión base no tiene info.json; renderízala antes. Se hace todo.'); return 0; }
  if (bi.firma !== info.firma || bi.fps !== info.fps) { console.error('Aviso: la versión base tiene otro personaje, colores o ajustes; no se reutiliza nada.'); return 0; }
  let d = 0;
  while (d < info.escenas.length && d < (bi.escenas || []).length && ['tipo', 'a', 'b', 'firma'].every((x) => info.escenas[d][x] === bi.escenas[d][x])) d++;
  const corte = (d < info.escenas.length ? info.escenas[d].a : info.duracion) - 0.4;
  let n = 0;
  for (const f of lista) {
    if (f / info.fps >= corte) continue;
    const src = path.join(dirBase, 'fotogramas', nombre(f)), dst = path.join(dirFot, nombre(f));
    if (!fs.existsSync(dst) && fs.existsSync(src)) { fs.copyFileSync(src, dst); n++; }
  }
  if (n) console.error(`Reutilizados ${n} fotogramas de la versión base (hasta el segundo ${corte.toFixed(1)}).`);
  return n;
}

async function trabajar(indice, total) {
  const { p, info, cerrar } = await abrir();
  fs.mkdirSync(dirFot, { recursive: true });
  const lista = Array.from({ length: info.fotogramas }, (_, f) => f).filter((f) => f % total === indice);
  reusarBase(info, lista);
  const t0 = Date.now(); let hechos = 0;
  for (const f of lista) {
    const archivo = path.join(dirFot, nombre(f));
    if (fs.existsSync(archivo)) continue;
    if ((Date.now() - t0) / 1000 > limite) break;
    await p.evaluate((ff) => window.dibujar(ff), f);
    await p.screenshot({ path: archivo, type: 'jpeg', quality: 92 });
    hechos++;
  }
  await cerrar();
  return { hechos };
}

async function muestras(lista) {
  const { p, info, cerrar } = await abrir();
  fs.mkdirSync(dirMue, { recursive: true });
  if (!lista) lista = info.escenas.map((e) => Math.round(((e.a + e.b) / 2) * info.fps));
  lista = lista.filter((f) => f >= 0 && f < info.fotogramas);
  for (const f of lista) {
    await p.evaluate((ff) => window.dibujar(ff), f);
    await p.screenshot({ path: path.join(dirMue, nombre(f)), type: 'jpeg', quality: 90 });
  }
  await cerrar();
  console.log(`Muestras en ${dirMue}: ${lista.map(nombre).join(', ')}`);
  console.log('Escenas:', info.escenas.map((e, i) => `${i}:${e.tipo} ${e.a}–${e.b} s`).join(' · '));
}

(async () => {
  if (hijo !== null) { const r = await trabajar(+hijo, procesos); console.log(JSON.stringify(r)); return; }
  if (flag('muestras')) return muestras(null);
  if (opt('solo', null)) return muestras(opt('solo').split(',').map(Number));
  const rehacer = opt('rehacer', null);
  if (rehacer && fs.existsSync(dirFot)) {
    const [a, b] = rehacer.split('-').map(Number), fps = 30;
    let n = 0;
    for (let f = Math.floor(a * fps); f <= Math.ceil(b * fps); f++) { const x = path.join(dirFot, nombre(f)); if (fs.existsSync(x)) { fs.unlinkSync(x); n++; } }
    console.log(`Borrados ${n} fotogramas entre ${a} y ${b} s; se vuelven a hacer.`);
  }
  const t0 = Date.now();
  await Promise.all(Array.from({ length: procesos }, (_, i) => new Promise((ok) => {
    const c = spawn(process.execPath, [__filename, plan, '--hijo', String(i), '--procesos', String(procesos), '--limite', String(limite)], { stdio: ['ignore', 'pipe', 'inherit'] });
    c.on('close', ok);
  })));
  if (!fs.existsSync(path.join(dirProy, 'info.json'))) { console.log('No se pudo abrir el motor: mira el error de arriba (lo normal es que falte Chromium o las dependencias).'); process.exit(1); }
  const info = JSON.parse(fs.readFileSync(path.join(dirProy, 'info.json')));
  // borra fotogramas que sobran de un plan anterior más largo
  for (const x of fs.readdirSync(dirFot)) { const f = +x.slice(2, 7); if (x.endsWith('.jpg') && f >= info.fotogramas) fs.unlinkSync(path.join(dirFot, x)); }
  let hechos = 0; for (let f = 0; f < info.fotogramas; f++) if (fs.existsSync(path.join(dirFot, nombre(f)))) hechos++;
  console.log(`${hechos}/${info.fotogramas} fotogramas (${((Date.now() - t0) / 1000).toFixed(0)} s esta tanda)${hechos < info.fotogramas ? ' · faltan: vuelve a lanzar el mismo comando' : ' · ¡completo!'}`);
})();
