/* ---------------------------------------------------------------------------
   tools/storeshot.mjs — the pictures on the App Store page.

   Run it:  node tools/storeshot.mjs                 1242x2688, English
            node tools/storeshot.mjs --lang ja       a Japanese set
            node tools/storeshot.mjs --w 1284 --h 2778

   ONE SET PER COUNTRY. App Store Connect holds a separate set of pictures
   for every localisation of the product page, so `--lang` moves both halves
   at once -- the words on the board (tools/pv/store-copy.mjs) and the
   language the app itself is running in (www/i18n/). A locale with no copy
   written stops the tool; it does not make an English board over a phone
   speaking something else.

   THE SIZE IS 1242 x 2688 AND IT IS NOT A GUESS. natsuaya82-crypto/jjjj's
   `store/README.md` says what App Store Connect took and what it refused,
   from having been refused: it accepts 1242x2688 / 2688x1242 / 1284x2778 /
   2778x1284, and **the 6.9-inch 1320x2868 was rejected**. All seven of that
   app's shipped pictures measure 1242x2688. 「結構リジェクトされるサイズ
   うるさいから」

   It happens to be exactly right for this app: 390 x 844 at 3.1848 is
   1242 x 2688, so the screen fills the picture with nothing cropped off
   either edge.

   Two rules from that same README, learned the same way:
     - every headline is TWO LINES. One short one in the set leaves a gap
       between the words and the screen, and the row of pictures steps.
     - the screen goes edge to edge. Anything hanging over the side loses
       the ends of what is on it.

   Made the way the film is made -- the real app, filled from
   tools/pv/seed.mjs, photographed at full size. The language in these
   pictures is the language in the trailer, because it is the same seed.
   --------------------------------------------------------------------------- */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium, LAUNCH } from './browser.mjs';
import { seedFilm } from './pv/seed.mjs';
import { COPY, FACES, LOCALES } from './pv/store-copy.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const WWW = path.join(ROOT, 'www');
const OUT = path.join(ROOT, 'pv', 'store');
const PORT = 8137;
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css',
               '.mjs':'text/javascript', '.png':'image/png' };

const argv = process.argv.slice(2);
const val = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i+1] : d; };
const W = Number(val('--w', '1242'));
const H = Number(val('--h', '2688'));
const UI = val('--lang', 'en');

/* The words and the app move together or not at all. A locale with no table
   in store-copy.mjs stops here rather than making an English board over a
   phone speaking something else. */
const SAY = COPY[UI];
if (!SAY) {
  console.error('no store copy for "' + UI + '". written: ' + LOCALES.join(' ') +
                '\n  add it to tools/pv/store-copy.mjs -- the words are the owner\'s.');
  process.exit(1);
}
const FACE = FACES[SAY.face];

const srv = http.createServer((q, r) => {
  const u = q.url.split('?')[0];
  const f = u.indexOf('/pv/') === 0 ? path.join(HERE, u.slice(1))
          : path.join(WWW, u === '/' ? 'index.html' : u);
  let b;
  try { b = fs.readFileSync(f); } catch (e) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain',
                     'Cache-Control': 'no-store' });
  r.end(b);
}).listen(PORT);

/* Each one is a screen the app really has, and where to stand on it. The
   WORDS are not here -- they are in tools/pv/store-copy.mjs, one table per
   country, because the product page holds a separate set of pictures for
   every localisation.

   `snap` beats a number: `scroll: 690` is a number counted once, on one
   build, and the day a post grows a line it cuts the next one in half. Snap
   says which row lands under the bar and the page works out the pixels. */
const SHOTS = [
  { name: 'timeline', snap: { sel: '.post', n: 1 },
    go: function(){ go('feed'); render(); } },
  { name: 'draw', scroll: 0,
    go: function(){
      var l = null, i;
      for (i = 0; i < LETTERS.length; i++)
        if (String(ltName(LETTERS[i]) || '') === 'c') l = LETTERS[i];
      editLetter(l.id); render();
    } },
  { name: 'alphabet', scroll: 210,
    go: function(){ go('ltset', 'all'); render(); } },
  { name: 'keyboard', scroll: 0,
    go: function(){ go('kb'); render(); } },
  { name: 'lexicon', snap: { sel: '.ebody', n: 1 },
    go: function(){ go('words'); render(); } },
  { name: 'theirs', scroll: 210,
    go: function(){ ABOPEN.wlddl = true; go('about', 'seen-vethi'); render(); } }
];

const br = await chromium.launch(LAUNCH);
const pg = await br.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await pg.goto(`http://localhost:${PORT}/pv/store.html`);
const ifr = await pg.$('#ph');
const app = await ifr.contentFrame();
await app.waitForSelector('#splash', { state: 'detached', timeout: 20000 });
await pg.evaluate(() => document.fonts.ready);
await app.evaluate(() => document.fonts.ready);
console.log('  letters drawn: ' + await seedFilm(app));
if (UI !== 'en') await app.evaluate((u) => { SET.ui = u; render(); }, UI);

/* Type is set to the picture rather than to a number, so 1242 wide and 1284
   wide are two sizes of one design instead of two designs. */
await pg.evaluate(({ w, f }) => {
  const q = (id) => document.getElementById(id);
  q('kick').style.fontFamily = f.kick;
  q('kick').style.letterSpacing = f.kickTrack;
  q('head').style.fontFamily = f.head;
  q('head').style.fontWeight = f.headWeight;
  q('kick').style.fontSize = Math.round(w * 0.0193) + 'px';
  q('kick').style.marginBottom = Math.round(w * 0.027) + 'px';
  q('head').style.fontSize = Math.round(w * 0.079) + 'px';
  q('cap').style.paddingTop = Math.round(w * 0.100) + 'px';
  q('cap').style.paddingLeft = q('cap').style.paddingRight = Math.round(w * 0.068) + 'px';
}, { w: W, f: FACE });

fs.mkdirSync(OUT, { recursive: true });
/* The phone is 80% of the width, and it hangs off the bottom edge. */
const S = (W * 0.80) / 390;
const TOP = Math.round(H * 0.262);
let n = 0;
for (const s of SHOTS){
  await app.evaluate('(' + s.go.toString() + ')()');
  if (s.snap) await app.evaluate(({ sel, n }) => {
    const bar = document.querySelector('.navtop');
    const h = bar ? bar.getBoundingClientRect().height : 0;
    const row = document.querySelectorAll(sel)[n];
    if (!row) return;
    const y = row.getBoundingClientRect().top + window.scrollY - h;
    window.scrollTo(0, Math.max(0, Math.round(y)));
  }, s.snap);
  else await app.evaluate((y) => window.scrollTo(0, y), s.scroll || 0);
  await pg.waitForTimeout(240);
  await pg.evaluate(({ S, W, TOP, kick, head }) => {
    const p = document.getElementById('phone');
    p.style.transform = 'translate(' + (W / 2 - 195 * S) + 'px,' + TOP + 'px) scale(' + S + ')';
    document.getElementById('kick').textContent = kick;
    document.getElementById('head').innerHTML = head;
  }, { S, W, TOP, kick: SAY[s.name].kick, head: SAY[s.name].head });
  await pg.waitForTimeout(140);
  n++;
  const f = path.join(OUT, String(n).padStart(2, '0') + '-' + s.name +
                      (UI === 'en' ? '' : '-' + UI) + '.png');
  await pg.screenshot({ path: f });
  console.log('  ' + f);
}
await br.close();
srv.close();
console.log(n + ' pictures  ' + W + 'x' + H + '  ' + UI);
