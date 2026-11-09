// Portada 1080×1920 (sirve para Instagram y TikTok) → proyecto/portada.jpg y comprobación del recorte 3:4
// node portada.js proyecto/reel.json   (usa "portada": { etiqueta, titulo: [...], clave, sub, pose, cielo } del plan)
const path = require('path');
const { execFileSync } = require('child_process');
const { buscarChromium, servidor } = require('./comun.js');
const plan = process.argv.find((a) => a.endsWith('.json')) || 'proyecto/reel.json';
(async () => {
  const { pw, exe } = buscarChromium(); const srv = await servidor(plan);
  const nav = await pw.chromium.launch({ executablePath: exe, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await nav.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', (e) => console.log('error en página:', e.message));
  await p.goto(`http://localhost:${srv.address().port}/reel.html?plan=proyecto/${path.basename(plan)}`);
  await p.waitForFunction('window.listo === true', null, { timeout: 180000 });
  await p.evaluate(() => window.dibujarPortada());
  const dir = path.dirname(path.resolve(plan)), out = path.join(dir, 'portada.jpg');
  await p.screenshot({ path: out, type: 'jpeg', quality: 94 }); await nav.close(); srv.close();
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', out, '-vf', 'crop=1080:1440:0:240,scale=120:-1', path.join(dir, 'portada_cuadricula.png')]);
  console.log('Portada:', out, '· vista de cuadrícula (120 px):', path.join(dir, 'portada_cuadricula.png'));
})();
