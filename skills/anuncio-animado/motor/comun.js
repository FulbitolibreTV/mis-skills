// Utilidades compartidas: buscar Chromium, letras y servidor local
const fs = require('fs'), path = require('path'), http = require('http');
const MOTOR = __dirname;

// Busca un Chromium que funcione, por este orden: el de Playwright, uno del sistema y el de @sparticuz/chromium (se instala con npm)
async function buscarChromium() {
  let pw;
  try { pw = require('playwright-core'); } catch { try { pw = require('playwright'); } catch {
    throw new Error('Faltan las dependencias del motor. Desde la carpeta motor/: npm install --no-audit --no-fund'); } }
  try { const exe = pw.chromium.executablePath(); if (exe && fs.existsSync(exe)) return { pw, exe, args: [], origen: 'playwright' }; } catch {}
  const home = process.env.HOME || '/root', cands = [];
  const raices = [process.env.PLAYWRIGHT_BROWSERS_PATH, path.join(home, '.cache/ms-playwright'), '/root/.cache/ms-playwright', '/ms-playwright', '/opt/pw-browsers', '/opt/ms-playwright'].filter(Boolean);
  for (const raiz of raices) {
    try { for (const d of fs.readdirSync(raiz)) for (const s of ['chrome-linux/chrome', 'chrome-linux64/chrome', 'chrome-headless-shell-linux64/chrome-headless-shell', 'chrome-linux/headless_shell']) cands.push(path.join(raiz, d, s)); } catch {}
  }
  cands.push('/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable',
    'C:/Program Files/Google/Chrome/Application/chrome.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
  const exe = cands.find((c) => fs.existsSync(c));
  if (exe) return { pw, exe, args: [], origen: 'sistema' };
  try {
    const sp = require('@sparticuz/chromium');
    return { pw, exe: await sp.executablePath(), args: sp.args, origen: '@sparticuz/chromium' };
  } catch {}
  throw new Error('No encuentro Chromium. Desde motor/: npm install @sparticuz/chromium@131 --no-audit --no-fund (o npx playwright install chromium) y vuelve a probar.');
}

async function abrirNavegador() {
  const { pw, exe, args, origen } = await buscarChromium();
  const nav = await pw.chromium.launch({ executablePath: exe, headless: true, args: [...new Set([...(args || []), '--disable-dev-shm-usage'])] });
  return { nav, origen };
}

// Letras: busca en node_modules/@fontsource/<familia> los pesos 400–800 (subconjunto latino: tildes, ñ, ¿ y ¡)
function slug(f) { return String(f).toLowerCase().trim().replace(/\s+/g, '-'); }
function fuentesDe(plan) {
  const m = (plan && plan.marca) || {};
  const fams = [...new Set([m.letra_titulos || 'Fredoka', m.letra_textos || 'Poppins', 'Poppins'])];
  const lista = [], faltan = [];
  for (const fam of fams) {
    const dir = path.join(MOTOR, 'node_modules/@fontsource', slug(fam), 'files');
    let hay = 0;
    for (const peso of [400, 500, 600, 700, 800]) {
      const f = `${slug(fam)}-latin-${peso}-normal.woff2`;
      if (fs.existsSync(path.join(dir, f))) { lista.push({ familia: fam, peso, archivo: path.join(dir, f), url: `/node_modules/@fontsource/${slug(fam)}/files/${f}` }); hay++; }
    }
    if (!hay) faltan.push(fam);
  }
  return { lista, faltan };
}

function servidor(rutaPlan) {
  const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2' };
  const raizPlan = path.dirname(path.resolve(rutaPlan));
  return new Promise((ok) => {
    const s = http.createServer((req, res) => {
      const u = decodeURIComponent(req.url.split('?')[0]);
      if (u === '/fuentes.json') {
        const plan = JSON.parse(fs.readFileSync(rutaPlan, 'utf8'));
        res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(fuentesDe(plan).lista.map(({ familia, peso, url }) => ({ familia, peso, url })))); return;
      }
      const f = u.startsWith('/proyecto/') ? path.join(raizPlan, u.slice('/proyecto/'.length)) : path.join(MOTOR, u);
      fs.readFile(f, (err, data) => { if (err) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': tipos[path.extname(f).toLowerCase()] || 'application/octet-stream' }); res.end(data); });
    }).listen(0, '127.0.0.1', () => ok(s));
  });
}

module.exports = { buscarChromium, abrirNavegador, fuentesDe, servidor, MOTOR };

// node comun.js → comprueba que hay navegador y letras
if (require.main === module) {
  (async () => {
    try { const r = await buscarChromium(); console.log('Chromium OK (' + r.origen + ')'); }
    catch (e) { console.log(e.message); process.exit(1); }
    const { faltan } = fuentesDe({});
    console.log(faltan.length ? 'Faltan letras: ' + faltan.join(', ') + ' → npm install --no-audit --no-fund' : 'Letras OK (Fredoka y Poppins)');
  })();
}
