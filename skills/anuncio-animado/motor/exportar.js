// Crea una página HTML que reproduce el anuncio en bucle, sin internet y en un solo archivo (letras y logo dentro).
//   node exportar.js mi_anuncio/anuncio.json   → mi_anuncio/anuncio.html
// Toca la pantalla para pausar; la página se adapta a cualquier tamaño de ventana.
const fs = require('fs'), path = require('path');
const { fuentesDe, MOTOR } = require('./comun.js');
const plan = process.argv.slice(2).find((a) => a.endsWith('.json'));
if (!plan || !fs.existsSync(plan)) { console.log('Uso: node exportar.js carpeta/anuncio.json'); process.exit(1); }
const dirProy = path.dirname(path.resolve(plan));
const P = JSON.parse(fs.readFileSync(plan, 'utf8'));
const tipos = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
const fuentes = fuentesDe(P).lista.map((f) => ({ familia: f.familia, peso: f.peso, url: 'data:font/woff2;base64,' + fs.readFileSync(f.archivo).toString('base64') }));
let logo = null;
if (P.marca && P.marca.logo) {
  const f = path.join(dirProy, P.marca.logo);
  if (fs.existsSync(f)) logo = `data:${tipos[path.extname(f).toLowerCase()] || 'image/png'};base64,` + fs.readFileSync(f).toString('base64');
  else console.log('Aviso: no encuentro el logo', f);
}
const motor = fs.readFileSync(path.join(MOTOR, 'limpio.js'), 'utf8') + '\n' + fs.readFileSync(path.join(MOTOR, 'anuncio.js'), 'utf8');
const titulo = ((P.marca && P.marca.nombre) || 'Anuncio').replace(/[<>&"]/g, '');
const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${titulo} · anuncio</title>
<style>html,body{margin:0;height:100%;background:#111}body{display:flex;align-items:center;justify-content:center}
canvas{max-width:100vw;max-height:100vh;width:auto;height:auto;box-shadow:0 10px 40px rgba(0,0,0,.5)}
#pausa{position:fixed;bottom:12px;left:50%;transform:translateX(-50%);font:600 13px system-ui,sans-serif;color:#bbb}</style></head>
<body><canvas id="c"></canvas><div id="pausa">Toca para pausar</div>
<script>${motor.replace(/<\/script/gi, '<\\/script')}</script>
<script>
const PLAN = ${JSON.stringify(P)};
const FUENTES = ${JSON.stringify(fuentes)};
const LOGO = ${JSON.stringify(logo)};
(async () => {
  const cargar = () => new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = LOGO; });
  const A = await Anuncio.iniciar(document.getElementById('c'), PLAN, FUENTES, LOGO ? cargar : null);
  let t0 = performance.now(), pausa = false, tp = 0;
  document.body.addEventListener('click', () => { pausa = !pausa; if (!pausa) t0 = performance.now() - tp * 1000; document.getElementById('pausa').textContent = pausa ? 'En pausa · toca para seguir' : 'Toca para pausar'; });
  const bucle = (ahora) => { if (!pausa) { tp = ((ahora - t0) / 1000) % A.info.duracion; A.dibujar(tp, 2); } requestAnimationFrame(bucle); };
  requestAnimationFrame(bucle);
})();
</script></body></html>`;
const salida = path.join(dirProy, `${P.salida || 'anuncio'}.html`);
fs.writeFileSync(salida, html);
console.log(`Página: ${salida} (${(html.length / 1024).toFixed(0)} KB). Se abre con doble clic y funciona sin internet.`);
