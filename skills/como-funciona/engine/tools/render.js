// run from a reel folder:
//   node render.js stills 1.5,3.2      -> stills/s_1.50.jpg ...   ("auto" = one still in the middle of every shot)
//   node render.js spans               -> audio/spans.json  [[start, end, transition], ...] for the sound mix
//   node render.js count               -> prints the number of shots
//   node render.js segments 0,4,8      -> seg/shot_XX.mp4
// (Playwright comes from the kit: make.sh sets NODE_PATH)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');
const fs = require('fs'), path = require('path');
(async () => {
  const mode = process.argv[2];
  const browser = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}), args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('console', m => console.error('[page]', m.text()));
  page.on('pageerror', e => console.error('[err]', e.message));
  await page.goto(pathToFileURL(path.join(process.cwd(), 'web', 'index.html')).href);
  await page.evaluate(async () => { for (const f of ['500 40px Inter', '600 40px Inter', '700 40px Inter', '500 40px "JetBrains Mono"', '800 40px "JetBrains Mono"', '400 40px "Unica One"']) await document.fonts.load(f); });
  await page.evaluate(() => Promise.all(window.IMG_LOADS || []));
  const total = await page.evaluate(() => window.TOTAL_FRAMES);
  const spans = await page.evaluate(() => SHOTS.map(s => [s.start, s.end, s.tr || 'cut']));
  if (mode === 'count') console.log(spans.length);
  else if (mode === 'cover') {
    const d = await page.evaluate(() => { renderCover(); return grab(.95); });
    fs.writeFileSync('portada.jpg', Buffer.from(d.split(',')[1], 'base64')); console.log('portada.jpg');
  } else if (mode === 'audit') {
    // pacing: sample 5 times a second, a "change" is a jump in the picture; flag stretches with nothing new
    const step = 6, TH = +(process.argv[3] || 3.2), MAXGAP = 2.6, ev = [];
    let last = 0, worst = [];
    for (let f = 0; f < total; f += step) {
      const d = await page.evaluate(f => motionSample(f), f), t = f / 30;
      if (f > 0 && d > TH) { if (t - last > MAXGAP) worst.push([last, t]); last = t; ev.push(t); }
    }
    if (total / 30 - last > MAXGAP + 1.5) worst.push([last, total / 30]);
    const first = ev.find(t => t > 0) ?? 99;
    console.log(`cambios visibles: ${ev.length} en ${(total / 30).toFixed(1)} s (uno cada ${(total / 30 / Math.max(1, ev.length)).toFixed(1)} s)`);
    console.log(first <= 1.2 ? `gancho: algo pasa a los ${first.toFixed(1)} s ✓` : `GANCHO: lo primero que cambia llega a los ${first.toFixed(1)} s, haz que algo pase antes de 1 s`);
    if (!worst.length) console.log('ritmo: nada se queda quieto más de ' + MAXGAP + ' s ✓');
    worst.forEach(([a, b]) => console.log(`QUIETO ${a.toFixed(1)}-${b.toFixed(1)} s (${(b - a).toFixed(1)} s): añade un corte, un zoom, una etiqueta o un número`));
  }
  else if (mode === 'spans') { fs.mkdirSync('audio', { recursive: true }); fs.writeFileSync('audio/spans.json', JSON.stringify({ shots: spans, dur: await page.evaluate(() => DUR) })); console.log(spans.length, 'shots'); }
  else if (mode === 'stills') {
    const arg = process.argv[3] || 'auto';
    const times = arg === 'auto' ? spans.map(s => (s[0] + s[1]) / 2) : arg.split(',').map(Number);
    fs.mkdirSync('stills', { recursive: true });
    for (const t of times) {
      const d = await page.evaluate(f => { renderFrame(f); return grab(.9); }, Math.round(t * 30));
      fs.writeFileSync(`stills/s_${t.toFixed(2).padStart(6, '0')}.jpg`, Buffer.from(d.split(',')[1], 'base64'));
    }
    // one contact sheet of all the stills: stills/sheet.jpg
    const list = fs.readdirSync('stills').filter(f => /^s_.*\.jpg$/.test(f)).sort();
    fs.writeFileSync('stills/list.txt', list.map(f => `file '${f}'`).join('\n'));
    await new Promise(r => spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', 'list.txt', '-vf', `scale=360:-1,tile=6x${Math.ceil(list.length / 6)}`, '-frames:v', '1', 'sheet.jpg'], { cwd: 'stills', stdio: 'inherit' }).on('close', r));
    console.log('stills:', times.map(t => t.toFixed(2)).join(' '), '-> stills/sheet.jpg');
  } else if (mode === 'segments') {
    const ids = process.argv[3].split(',').map(Number);
    fs.mkdirSync('seg', { recursive: true });
    for (const id of ids) {
      const f0 = Math.round(spans[id][0] * 30), f1 = id === spans.length - 1 ? total : Math.round(spans[id][1] * 30);
      const tmp = `seg/shot_${String(id).padStart(2, '0')}.part.mp4`, fin = tmp.replace('.part', '');
      const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', '30', tmp], { stdio: ['pipe', 'inherit', 'inherit'] });
      for (let f = f0; f < f1; f++) {
        const d = await page.evaluate(f => { renderFrame(f); return grab(.95); }, f);
        if (!ff.stdin.write(Buffer.from(d.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
      }
      ff.stdin.end(); const code = await new Promise(r => ff.on('close', r));
      if (code === 0) fs.renameSync(tmp, fin); else console.log('ffmpeg failed', id);
      console.log('done shot', id, f1 - f0, 'frames');
    }
  }
  await browser.close();
})();
