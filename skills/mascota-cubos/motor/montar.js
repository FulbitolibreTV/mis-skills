// Monta el vídeo final: fotogramas + voz + efectos de sonido, normalizado a −14 LUFS.
// node montar.js proyecto/reel.json [--sin-efectos]
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const plan = process.argv.find((a) => a.endsWith('.json')) || 'proyecto/reel.json';
const dir = path.dirname(path.resolve(plan));
const P = JSON.parse(fs.readFileSync(plan, 'utf8'));
if (!fs.existsSync(path.join(dir, 'info.json'))) { console.log('Falta info.json: renderiza antes con render.js.'); process.exit(1); }
const info = JSON.parse(fs.readFileSync(path.join(dir, 'info.json'), 'utf8'));
const conEfectos = !process.argv.includes('--sin-efectos');
const ff = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' });

const faltan = [];
for (let f = 0; f < info.fotogramas; f++) if (!fs.existsSync(path.join(dir, 'fotogramas', `f_${String(f).padStart(5, '0')}.jpg`))) faltan.push(f);
if (faltan.length) { console.log(`Faltan ${faltan.length} fotogramas (el primero, ${faltan[0]}). Vuelve a lanzar render.js.`); process.exit(1); }

// efectos sintetizados (sin archivos externos ni licencias)
const sfxDir = path.join(__dirname, 'sfx'); fs.mkdirSync(sfxDir, { recursive: true });
const SFX = {
  pop: ['-f', 'lavfi', '-i', "aevalsrc='0.55*sin(2*PI*(950-3800*t)*t)*exp(-38*t)':d=0.14:s=48000"],
  click: ['-f', 'lavfi', '-i', "aevalsrc='0.45*sin(2*PI*2100*t)*exp(-110*t)+0.2*sin(2*PI*900*t)*exp(-60*t)':d=0.07:s=48000"],
  ding: ['-f', 'lavfi', '-i', "aevalsrc='0.28*(sin(2*PI*1320*t)+0.5*sin(2*PI*1980*t)+0.25*sin(2*PI*2640*t))*exp(-5*t)':d=0.7:s=48000"],
  whoosh: ['-f', 'lavfi', '-i', 'anoisesrc=d=0.5:c=pink:a=0.55:r=48000', '-af', 'highpass=f=350,lowpass=f=3200,afade=t=in:d=0.28,afade=t=out:st=0.28:d=0.22'],
};
for (const [n, a] of Object.entries(SFX)) { const o = path.join(sfxDir, n + '.wav'); if (!fs.existsSync(o)) ff([...a, '-ac', '2', o]); }

const salida = path.join(dir, P.salida || 'reel.mp4');
const ent = ['-framerate', String(info.fps), '-i', path.join(dir, 'fotogramas', 'f_%05d.jpg')];
const filtros = []; let n = 1; const pistas = [];
const voz = P.voz ? path.join(dir, P.voz) : null;
if (voz && fs.existsSync(voz)) { ent.push('-i', voz); pistas.push(`[${n}:a]aresample=48000,aformat=channel_layouts=stereo[voz]`); n++; }
const ev = conEfectos ? info.eventos : [];
ev.forEach((e, i) => {
  ent.push('-i', path.join(sfxDir, e.s + '.wav'));
  const ms = Math.max(0, Math.round(e.t * 1000));
  const vol = { pop: 0.45, click: 0.5, ding: 0.35, whoosh: 0.4 }[e.s] || 0.4;
  filtros.push(`[${n}:a]adelay=${ms}|${ms},volume=${vol}[e${i}]`); n++;
});
const nombres = [...(pistas.length ? ['[voz]'] : []), ...ev.map((_, i) => `[e${i}]`)];
let mapa = [];
if (nombres.length) {
  const grafo = [...pistas, ...filtros, `${nombres.join('')}amix=inputs=${nombres.length}:normalize=0:duration=longest,apad,atrim=0:${info.duracion.toFixed(3)},loudnorm=I=-14:TP=-1.5:LRA=7[a]`].join(';');
  ent.push('-filter_complex', grafo); mapa = ['-map', '0:v', '-map', '[a]', '-c:a', 'aac', '-b:a', '192k'];
} else mapa = ['-map', '0:v'];
const codifica = (crf) => ff([...ent, ...mapa, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', String(crf), '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-t', info.duracion.toFixed(3), salida]);
codifica(20);
let mb = fs.statSync(salida).size / 1e6;
if (mb > 28) { codifica(26); mb = fs.statSync(salida).size / 1e6; }
console.log(`Listo: ${salida} (${mb.toFixed(1)} MB, ${info.duracion.toFixed(1)} s, ${ev.length} efectos${voz && fs.existsSync(voz) ? ', con voz' : ', sin voz'})`);
