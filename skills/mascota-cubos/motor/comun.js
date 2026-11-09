// Utilidades compartidas: Chromium y servidor local
const fs = require('fs'), path = require('path'), http = require('http');
const MOTOR = __dirname;
function buscarChromium() {
  try {
    const pw = require('playwright');
    const exe = pw.chromium.executablePath();
    if (exe && fs.existsSync(exe)) return { pw, exe: undefined, ruta: exe }; // playwright elige su versión sin pantalla
  } catch {}
  let pw; try { pw = require('playwright-core'); } catch { try { pw = require('playwright'); } catch {
    throw new Error('Faltan las dependencias del motor. Desde la carpeta motor/: npm install --no-audit --no-fund'); } }
  const home = process.env.HOME || '/root';
  const cands = [];
  const raices = [process.env.PLAYWRIGHT_BROWSERS_PATH, path.join(home, '.cache/ms-playwright'), '/root/.cache/ms-playwright', '/ms-playwright', '/opt/pw-browsers', '/opt/ms-playwright', path.join(MOTOR, 'node_modules/.remotion')].filter(Boolean);
  for (const raiz of raices) {
    try { for (const d of fs.readdirSync(raiz)) for (const s of ['chrome-linux/chrome', 'chrome-linux64/chrome', 'chrome-headless-shell-linux64/chrome-headless-shell', 'chrome-linux/headless_shell']) cands.push(path.join(raiz, d, s)); } catch {}
  }
  cands.push('/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome');
  const exe = cands.find((c) => fs.existsSync(c));
  if (!exe) throw new Error('No encuentro Chromium. Prueba: npx playwright install chromium');
  return { pw, exe };
}

function servidor(plan) {
  const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.woff': 'font/woff', '.mp3': 'audio/mpeg' };
  const raizPlan = path.dirname(path.resolve(plan));
  return new Promise((ok) => {
    const s = http.createServer((req, res) => {
      let u = decodeURIComponent(req.url.split('?')[0]);
      let f = u.startsWith('/proyecto/') ? path.join(raizPlan, u.slice('/proyecto/'.length)) : path.join(MOTOR, u);
      fs.readFile(f, (err, data) => { if (err) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': tipos[path.extname(f)] || 'application/octet-stream' }); res.end(data); });
    }).listen(0, () => ok(s));
  });
}

module.exports = { buscarChromium, servidor };

// node comun.js → comprueba que hay navegador
if (require.main === module) {
  try { const r = buscarChromium(); console.log('Chromium OK:', r.ruta || r.exe); }
  catch (e) { console.log(e.message); process.exit(1); }
}
