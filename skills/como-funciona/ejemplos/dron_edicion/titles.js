// renders transparent 1080x1920 text overlays: title.png (start) and end.png (outro)
const { chromium } = require('C:/Users/josetumbado/claude-animation-skills/kit/node_modules/playwright');
const path = require('path'), fs = require('fs'), url = require('url');
const FONTS = 'file:///C:/Users/josetumbado/mis-skills/como-funciona/engine/template/web/fonts/';
const page = body => `<!doctype html><html><head><style>
@font-face{font-family:Inter;font-weight:700;src:url(${FONTS}inter-700-normal.woff2)}
@font-face{font-family:Inter;font-weight:500;src:url(${FONTS}inter-500-normal.woff2)}
html,body{margin:0;background:transparent}</style></head><body><canvas id=c width=1080 height=1920></canvas><script>
const x=document.getElementById('c').getContext('2d');
function t(s,cx,cy,size,col,w=700,sp=0){x.font=w+' '+size+'px Inter';x.textAlign='center';x.textBaseline='middle';x.letterSpacing=sp+'px';x.shadowColor='rgba(0,0,0,.55)';x.shadowBlur=30;x.fillStyle=col;x.fillText(s,cx,cy);x.shadowBlur=0;}
Promise.all([document.fonts.load('700 50px Inter'),document.fonts.load('500 50px Inter')]).catch(()=>{}).then(()=>{${body};document.title='ok'});
</script></body></html>`;
const title = `t('UN DÍA EN EL',540,760,62,'#ffffff',500,18); t('RÍO',540,900,230,'#ffffff',700,10);
x.fillStyle='#f5c451';x.fillRect(440,1035,200,8);`;
const end = `t('¿TE SUBIRÍAS?',540,860,110,'#ffffff',700,4); t('comenta 👇',540,990,58,'#f5c451',500,2);`;
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME, args: ['--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  for (const [name, body] of [['title.png', title], ['end.png', end]]) {
    const f = path.join(__dirname, 'tmp.html'); fs.writeFileSync(f, page(body));
    await p.goto(url.pathToFileURL(f).href); await p.waitForFunction(() => document.title === 'ok');
    await p.locator('#c').screenshot({ path: path.join(__dirname, name), omitBackground: true });
  }
  fs.unlinkSync(path.join(__dirname, 'tmp.html')); await b.close();
})();
