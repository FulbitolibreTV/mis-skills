// Export a seek(t) animation to frames/MP4.
//   node export.js <dir> stills 1,2.5,9      -> <dir>/stills/*.jpg + sheet.jpg
//   node export.js <dir> video <out.mp4> [workers]
const { chromium } = require('playwright'); const { spawn, execFileSync } = require('child_process');
const path = require('path'), fs = require('fs');
const [dir, mode, arg, wk] = process.argv.slice(2);
const url = 'file://' + path.resolve(dir, 'index.html');
async function page(b) { const p = await b.newPage({ viewport: { width: 1080, height: 1920 } }); p.on('pageerror', e => console.log('[err]', e.message)); await p.goto(url); await p.evaluate(() => document.fonts.ready); return p; }
(async () => {
  const b = await chromium.launch();
  if (mode === 'stills') {
    const p = await page(b); fs.mkdirSync(path.join(dir, 'stills'), { recursive: true });
    const ts = arg.split(',').map(Number), files = [];
    for (const t of ts) { const d = await p.evaluate(t => { seek(t); return grab(.9); }, t); const f = path.join(dir, 'stills', `s_${t.toFixed(2)}.jpg`); fs.writeFileSync(f, Buffer.from(d.split(',')[1], 'base64')); files.push(f); }
    const cols = Math.min(6, files.length), rows = Math.ceil(files.length / cols);
    execFileSync('ffmpeg', ['-v', 'error', '-y', ...files.flatMap(f => ['-i', f]), '-filter_complex', files.map((_, i) => `[${i}]scale=360:-1[v${i}]`).join(';') + ';' + files.map((_, i) => `[v${i}]`).join('') + `xstack=inputs=${files.length}:layout=` + files.map((_, i) => `${(i % cols) * 360}_${Math.floor(i / cols) * 640}`).join('|') + `:fill=black`, path.join(dir, 'stills', 'sheet.jpg')]);
    console.log('sheet', path.join(dir, 'stills', 'sheet.jpg'));
  } else {
    const p0 = await page(b); const DUR = await p0.evaluate(() => DUR), FPS = 30, N = Math.round(DUR * FPS), W = +(wk || 4);
    const seg = path.join(dir, 'seg'); fs.mkdirSync(seg, { recursive: true });
    const per = Math.ceil(N / W);
    await Promise.all([...Array(W).keys()].map(async w => {
      const p = w ? await page(b) : p0, a = w * per, z = Math.min(N, a + per);
      const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', path.join(seg, `p${w}.mp4`)]);
      for (let f = a; f < z; f++) { const d = await p.evaluate(t => { seek(t); return grab(.93); }, f / FPS); if (!ff.stdin.write(Buffer.from(d.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r)); }
      ff.stdin.end(); await new Promise(r => ff.on('close', r));
    }));
    fs.writeFileSync(path.join(seg, 'list.txt'), [...Array(W).keys()].map(w => `file 'p${w}.mp4'`).join('\n'));
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(seg, 'list.txt'), '-c', 'copy', path.join(dir, 'silent.mp4')]);
    console.log('frames', N, 'dur', DUR.toFixed(2));
  }
  await b.close();
})();
