// Comprueba (y arregla lo que puede) todo lo que necesita el motor. Lánzalo desde la carpeta de trabajo:
//   node motor/comprobar.js
// 1. Node 18 o más · 2. ffmpeg · 3. dependencias (npm install, sin permisos de administrador)
// 4. Chromium (Playwright, del sistema o @sparticuz/chromium por npm) · 5. letras · 6. un fotograma de prueba
const fs = require('fs'), path = require('path'), os = require('os');
const { execFileSync, execSync } = require('child_process');
const MOTOR = __dirname;
const bien = (t) => console.log('✓ ' + t), mal = (t) => console.log('✗ ' + t);
let fallos = 0;

const v = +process.versions.node.split('.')[0];
if (v >= 18) bien(`Node ${process.versions.node}`); else { mal(`Node ${process.versions.node}: hace falta la 18 o más`); fallos++; }

try { const l = execFileSync('ffmpeg', ['-version'], { encoding: 'utf8' }).split('\n')[0]; bien(l.split(' Copyright')[0]); }
catch { mal('No hay ffmpeg: instálalo (apt install ffmpeg, brew install ffmpeg o winget install ffmpeg)'); fallos++; }

// npm con caché propia: funciona sin permisos de administrador y aunque la caché global sea de solo lectura
const cache = path.join(os.homedir(), '.cache', 'anuncio-animado', 'npm');
const npm = (extra) => execSync(`npm install --no-audit --no-fund --loglevel=error --cache "${cache}" ${extra || ''}`, { cwd: MOTOR, stdio: ['ignore', 'ignore', 'pipe'], encoding: 'utf8' });
const hay = (m) => { try { require.resolve(m, { paths: [MOTOR] }); return true; } catch { return false; } };
if (!hay('playwright-core') || !fs.existsSync(path.join(MOTOR, 'node_modules/@fontsource/poppins'))) {
  try { fs.mkdirSync(cache, { recursive: true }); npm(); bien('Dependencias instaladas (npm install)'); }
  catch (e) { mal('npm install ha fallado: ' + String(e.stderr || e.message).split('\n').slice(0, 3).join(' ')); fallos++; }
} else bien('Dependencias ya instaladas');

(async () => {
  const { buscarChromium, fuentesDe } = require('./comun.js');
  try { const r = await buscarChromium(); bien('Chromium (' + r.origen + ')'); }
  catch (e) {
    // última opción: el Chromium empaquetado en npm (unos 60 MB), que no necesita permisos de administrador
    try { npm('@sparticuz/chromium@131'); const r = await buscarChromium(); bien('Chromium (' + r.origen + ', recién instalado)'); }
    catch (e2) { mal(e.message); fallos++; }
  }
  const { faltan } = fuentesDe({});
  if (faltan.length) { mal('Faltan letras: ' + faltan.join(', ')); fallos++; } else bien('Letras Fredoka y Poppins');
  if (fallos) { console.log(`\n${fallos} cosa(s) por arreglar antes de seguir.`); process.exit(1); }
  // prueba real: un fotograma del ejemplo
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'anuncio-prueba-'));
  fs.writeFileSync(path.join(tmp, 'anuncio.json'), JSON.stringify({ ancho: 540, alto: 960, marca: { nombre: 'Prueba' }, escenas: [{ tipo: 'logo', a: 0, b: 1 }] }));
  try {
    execFileSync(process.execPath, [path.join(MOTOR, 'render.js'), path.join(tmp, 'anuncio.json'), '--portada', '0.8'], { stdio: 'ignore', timeout: 120000 });
    if (!fs.existsSync(path.join(tmp, 'portada.png'))) throw new Error('no salió la imagen');
    bien('Fotograma de prueba dibujado (estilo clásico)');
    fs.writeFileSync(path.join(tmp, 'anuncio.json'), JSON.stringify({ estilo: 'limpio', ancho: 540, alto: 960, desenfoque: 1, marca: { nombre: 'Prueba' } }));
    fs.rmSync(path.join(tmp, 'portada.png'), { force: true });
    execFileSync(process.execPath, [path.join(MOTOR, 'render.js'), path.join(tmp, 'anuncio.json'), '--portada', '5'], { stdio: 'ignore', timeout: 120000 });
    if (!fs.existsSync(path.join(tmp, 'portada.png'))) throw new Error('no salió la imagen del estilo limpio');
    bien('Fotograma de prueba dibujado (estilo limpio)'); console.log('\nTodo listo.');
  } catch (e) { mal('El fotograma de prueba ha fallado: ' + e.message); process.exit(1); }
  finally { fs.rmSync(tmp, { recursive: true, force: true }); }
})();
