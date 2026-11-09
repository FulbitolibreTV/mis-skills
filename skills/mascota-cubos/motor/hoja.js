// Hoja de personaje (4 vistas, 8 poses y 7 caras) → <proyecto>/hoja.png
// node hoja.js proyecto/reel.json
const path = require('path');
const { buscarChromium, servidor } = require('./comun.js');
const plan = process.argv.find((a) => a.endsWith('.json')) || 'proyecto/reel.json';
(async () => {
  const { pw, exe } = buscarChromium(); const srv = await servidor(plan);
  const nav = await pw.chromium.launch({ executablePath: exe, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await nav.newPage({ viewport: { width: 2400, height: 1560 } });
  p.on('pageerror', (e) => console.log('error en página:', e.message));
  await p.goto(`http://localhost:${srv.address().port}/hoja.html?plan=proyecto/${path.basename(plan)}`);
  await p.waitForFunction('window.listo === true', null, { timeout: 120000 });
  const out = path.join(path.dirname(path.resolve(plan)), 'hoja.png');
  await p.screenshot({ path: out }); await nav.close(); srv.close();
  console.log('Hoja:', out);
})();
