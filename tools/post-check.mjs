/* ---------------------------------------------------------------------------
   tools/post-check.mjs — what a post carries when it leaves the composer.

   Run it:   node tools/post-check.mjs

   Posting is the one moment in this app where the making side becomes
   past-tense data. Everything on the other side of it -- the timeline, the
   card, somebody else's phone -- has already been made to read from the post
   and nothing else (tools/sides-check.mjs, tools/card-check.mjs). What none of
   them can see is whether the right things were put ON the post in the first
   place, because a post that is missing something looks perfectly correct for
   as long as the only person reading it is the person who wrote it.

   So this drives the real pwSend():

     1  a photograph, with letters placed on it, and the letters are IN the
        file that goes out -- not a list of positions a reader would have to
        compose with an alphabet they do not have
     2  the picture that goes out is not the picture that came in
     3  the marks do not travel. There is a picture on the post and nothing
        else about them
     4  which way the line runs is frozen on, from the LANGUAGE, at the moment
        of writing
     5  the composer is empty afterwards, marks and all, so the next post does
        not inherit the last one's letters

   Claim 1 is checked by reading the pixels of the file that came out, because
   "the string is different" would also be true of a bake that drew nothing.

   Exit code is 0 only when all five hold.
   --------------------------------------------------------------------------- */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { seed } from './fixture.mjs';

async function loadChromium(){
  const { createRequire } = await import('module');
  const req = createRequire(import.meta.url);
  try { return req('playwright').chromium; } catch (e) {}
  try {
    const g = execSync('npm root -g', { encoding: 'utf8' }).trim();
    return req(path.join(g, 'playwright')).chromium;
  } catch (e) {}
  console.error('playwright is not installed. npm i -g playwright');
  process.exit(2);
}
const chromium = await loadChromium();

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', 'www');
const PORT = 8129;
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const LAUNCH = fs.existsSync(CHROME) ? { executablePath: CHROME } : {};

const mime = (f) => f.endsWith('.html') ? 'text/html; charset=utf-8'
  : f.endsWith('.js') ? 'application/javascript; charset=utf-8'
  : f.endsWith('.css') ? 'text/css; charset=utf-8'
  : 'text/plain; charset=utf-8';
const srv = http.createServer((req, res) => {
  const f = path.join(ROOT, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  let d = null;
  try { d = fs.readFileSync(f); } catch (e) { d = null; }
  if (d === null) { res.writeHead(404); res.end('no'); return; }
  res.writeHead(200, { 'Content-Type': mime(f) });
  res.end(d);
});
await new Promise(r => srv.listen(PORT, r));

const br = await chromium.launch(LAUNCH);
const pg = await br.newPage({ viewport: { width: 390, height: 844 } });
await pg.goto(`http://localhost:${PORT}/`);
await pg.waitForSelector('#splash', { state: 'detached', timeout: 10000 });
await pg.evaluate((s) => { eval('(' + s + ')()'); SET.done = true; SET.ui = 'en'; },
                  seed.toString());

const R = await pg.evaluate(async () => {
  const fails = [];

  /* A photograph that is black everywhere, so a white letter drawn into it is
     the only light thing there can be. A gradient would leave the answer to
     "is that ink or is that the sky". */
  const blackPic = (() => {
    const c = document.createElement('canvas');
    c.width = 400; c.height = 400;
    const x = c.getContext('2d');
    x.fillStyle = '#000'; x.fillRect(0, 0, 400, 400);
    return c.toDataURL('image/jpeg', 0.9);
  })();
  /* How much of a picture is light, as a share of its pixels.

     Not one pixel in the middle: inkStrokes() draws the OUTLINE a pen leaves,
     not a filled shape, so the middle of a triangle is background and a check
     that sampled it would fail on a bake that worked. What is being asked is
     "is there ink in this file at all", and on a photograph that is black
     everywhere the answer is a count. */
  const lightShare = (url) => new Promise((done) => {
    const im = new Image();
    im.onload = () => {
      const c = document.createElement('canvas');
      c.width = im.width; c.height = im.height;
      const x = c.getContext('2d');
      x.drawImage(im, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height).data;
      let n = 0;
      for (let i = 0; i < d.length; i += 4)
        if ((d[i] + d[i + 1] + d[i + 2]) / 3 > 150) n++;
      done(n / (c.width * c.height));
    };
    im.onerror = () => done(-1);
    im.src = url;
  });

  /* The letter to place: the first one in this alphabet with a shape on it. */
  const drawn = LETTERS.filter(l => l.st && l.st.length)[0];
  if (!drawn) fails.push('the fixture alphabet has no drawn letter, so nothing below ' +
                         'this is a test of anything');

  /* ---- a post, written the way a person writes one ------------------ */
  const before = POSTS.length;
  SCRIPT.dir = 'rtl'; SET.plan = 'plus';        /* choosing one is Plus */
  PW = pwBlank();
  PW.ln = 'kano tir';
  PW.mn = 'the mountain is seen';
  PW.pic = blackPic;
  PW.marks = [{ l: drawn ? drawn.id : '', x: 0.5, y: 0.5, s: 0.5, w: 1 }];
  pwSend();
  /* pwSend bakes, and a bake is an image loading. */
  await new Promise(r => setTimeout(r, 300));
  SET.plan = 'free'; SCRIPT.dir = '';

  const p = POSTS[POSTS.length - 1];
  if (POSTS.length !== before + 1 || !p || p.ln !== 'kano tir') {
    fails.push('pwSend() did not put a post on the timeline at all');
    return { fails };
  }

  /* ---- 1. the letters are IN the picture ---------------------------- */
  /* The photograph first, so a bake that drew nothing cannot pass by the
     picture having been light all along. */
  const wasLight = await lightShare(blackPic);
  const nowLight = await lightShare(p.pic);
  if (wasLight > 0.002)
    fails.push('the photograph this test puts in is not black (' +
               (wasLight * 100).toFixed(1) + '% light), so nothing below it ' +
               'proves anything');
  if (nowLight < 0) fails.push("the post's picture will not load");
  else if (nowLight < 0.005)
    fails.push('the posted picture is ' + (nowLight * 100).toFixed(2) + '% light ' +
               'and the photograph was ' + (wasLight * 100).toFixed(2) + '%, so ' +
               'the white letter placed in the middle of it was never drawn in. ' +
               'A reader has no alphabet to compose one with -- if it is not in ' +
               'the file it does not exist');

  /* ---- 2. and it is not the picture that went in -------------------- */
  if (p.pic === blackPic)
    fails.push('the posted picture is byte-for-byte the one that was chosen, ' +
               'so pwBake() did not run');

  /* ---- 3. the marks themselves do not travel ------------------------ */
  if (p.marks !== undefined)
    fails.push('the post carries `marks`. Letters on a picture are baked in, ' +
               'so nothing about where they sat is a reader\'s business -- and ' +
               'a position without the shape beside it is unusable to somebody ' +
               'who does not have this alphabet');

  /* ---- 4. which way it runs is frozen on ---------------------------- */
  if (p.dir !== 'rtl')
    fails.push('the post says dir=' + JSON.stringify(p.dir) + ' and the language ' +
               'said rtl when it was written. A direction that is not on the post ' +
               'is a direction the reader takes from THEIR language');

  /* ---- 5. and the composer is empty ---------------------------------- */
  if (PW.ln || PW.pic || (PW.marks && PW.marks.length))
    fails.push('the composer still holds the post that was just sent, so the ' +
               'next one starts with the last one\'s letters on it');

  return { fails, mid: (nowLight * 100).toFixed(1), corner: (wasLight * 100).toFixed(1),
           bytes: Math.round(String(p.pic || '').length / 1024) };
});

await br.close();
srv.close();

if (R.fails.length) {
  console.error('\npost: ' + R.fails.length +
                ' thing' + (R.fails.length > 1 ? 's' : '') +
                ' about what a post carries do not hold:\n');
  for (const f of R.fails) console.error('  ' + f + '\n');
  process.exit(1);
}
console.log('post: a letter placed on a black photograph is IN the file that goes\n' +
            '      out -- ' + R.mid + '% of it is light where the photograph was ' +
            R.corner + '%, ' + R.bytes + ' KB.\n' +
            '      The post carries a picture and nothing about where the letter\n' +
            '      sat, it carries the direction its language ran in, and the\n' +
            '      composer is empty behind it.');
