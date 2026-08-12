/* ---------------------------------------------------------------------------
   tools/card-check.mjs — a card of a post is a picture of that post.

   Run it:   node tools/card-check.mjs

   www/post.js has a line across it, and below that line a post renders from
   the post: what a reader needs is put ON the post when it is written -- the
   name, the handle, the language's name, and the SHAPE of a letter rather
   than a reference to one, because the reader does not have that alphabet.

   The card is the OTHER place a post is drawn, and it had none of that.
   cardPaint() called cardUnits(src.line), which asks findWord() for the
   spelling, ltById()/ltMain() for the letter and wsStrokes() for a shape the
   writing system composes. Every one of those is the open language. So a card
   of somebody else's post was that post re-spelled out of MY dictionary and
   drawn in MY letters -- and it tested green, screenshotted right and demoed
   perfectly, because every post anybody has made so far is their own.

   tools/sides-check.mjs holds the static half: nothing below card.js's line
   may NAME the making side. That is cheap and it is not enough. A function
   below the line can be correct and simply never be the one that runs, and
   what is wanted is not "the words are absent" but "the picture does not
   move". So this drives the real app:

     1  a post is written, and its ink is frozen onto it
     2  the letters and the dictionary are then changed underneath it
     3  the same post's card is opened
     4  what it draws is the ink from step 1, shape for shape
     5  and a post from another language, by another person -- one this phone
        has never had the alphabet for -- draws its own shapes too, not the
        open language's

   Step 2 is the whole test. Freezing ink and then reading it back proves
   nothing on its own: the old code would also have produced the right picture
   for a post whose language had not moved. The letters are REDRAWN between
   writing and reading, so the two answers are different numbers and the check
   can tell which one came out.

   What it cannot see, so that nobody mistakes silence for safety:
     - whether the card LOOKS right. Only which shapes go on it, in which
       order. What the canvas does with them is cardInk()'s business
     - a post with no ink at all. That is a post written in borrowed
       characters, and text is the correct answer for it -- asserted here as
       "text", not as shapes

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
const PORT = 8128;
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

const R = await pg.evaluate(() => {
  const fails = [];
  /* What cardPaint() DRAWS, not what this file thinks it would draw.

     The first version of this asked cardSrc() and then chose between
     cardInkUnits() and cardUnits() itself -- which is a copy of the decision
     under test, so putting the bug back left it green. It has to watch the
     real one: cardInk() is the last thing between the items and the canvas,
     so it is wrapped, cardPaint() is called for real, and what comes back is
     what went on the picture. Break cardPaint and this goes red. */
  const itemsFor = (kind, key) => {
    CARD = { k: kind, v: key };
    const src = cardSrc();
    const real = cardInk;
    let seen = null;
    cardInk = function(x, items){ seen = items; return real.apply(null, arguments); };
    try { cardPaint(document.createElement('canvas')); }
    finally { cardInk = real; }
    if (seen === null) fails.push('cardPaint() drew nothing at all for ' + kind + ':' + key);
    return { src, items: seen || [] };
  };
  const shapes = (items) => JSON.stringify(items.map(
    (u) => u.sp ? ' ' : (u.st ? u.st : ('tx:' + u.tx))));

  /* ---- 1. a post, written now, in this language --------------------- */
  const ln = 'kano tir';
  const p = { id: 'pcard', at: 1, lang: langId, lname: langName, ln,
              who: 'Aya', hd: 'aya', mine: true, mn: 'the mountain is seen',
              ui: 'en', gl: [], ink: postInk(ln) };
  POSTS.push(p);
  if (!p.ink || !p.ink.g.length)
    fails.push('the post carries no ink, so nothing below this is a test of anything');
  const wrote = shapes(itemsFor('p', 'pcard').items);

  /* ---- 2. and then the language moves under it ---------------------- */
  /* Every drawn letter is redrawn as one straight line nothing else uses, and
     the word it was spelled with is deleted. If the card still spells the post
     out of the open language, every shape on it becomes this one. */
  const AFTER = [{ pts: [[100, 100], [900, 900]] }];
  LETTERS.forEach((l) => { if (l.st && l.st.length) l.st = AFTER; });
  WORDS = WORDS.filter((w) => String(w.hw) !== 'kano');
  saveLetters(); save();

  /* ---- 3 & 4. the same card, and it has not moved ------------------- */
  const after = itemsFor('p', 'pcard');
  const read = shapes(after.items);
  if (read !== wrote)
    fails.push('a card of a post changed when the language under it changed.\n' +
               '     wrote: ' + wrote.slice(0, 220) + '\n' +
               '      read: ' + read.slice(0, 220));
  if (read.indexOf(JSON.stringify(AFTER).slice(1, -1)) >= 0)
    fails.push('a card of a post is drawn with letters redrawn AFTER it was ' +
               'written, so it is the open alphabet and not the post');
  if (after.src.nm !== p.lname)
    fails.push('a card of a post is named by the open language rather than by ' +
               'the post: ' + after.src.nm + ' is not ' + p.lname);

  /* And a WORD's card does move -- because a word IS the open language and is
     supposed to. Without this the check above passes on an app where cards
     never draw anything at all. `ke` is spelled with the one fixture letter
     that has strokes on it; `tir` is not, so it would prove nothing. */
  const asWord = shapes(itemsFor('w', 'ke').items);
  if (asWord.indexOf(JSON.stringify(AFTER).slice(1, -1)) < 0)
    fails.push('a card of a WORD did not follow the letters being redrawn, so ' +
               'the test above proves nothing');

  /* ---- 5. somebody else's post, in an alphabet this phone lacks ----- */
  /* The fixture's second post: another language, another person, its shapes
     ON it, and not one of its words in this dictionary. */
  const other = POSTS.filter((x) => !x.mine && x.ink)[0];
  if (!other) {
    fails.push("the fixture has no post by somebody else with ink on it, so the " +
               "case this whole file is about is not being walked");
  } else {
    const it = itemsFor('p', other.id);
    const drew = it.items.filter((u) => u.st).length;
    const want = other.ink.s.filter((x) => typeof x === 'number').length;
    if (drew !== want)
      fails.push("somebody else's post draws " + drew + ' shapes and carries ' +
                 want + ': the card is not reading its ink');
    if (JSON.stringify(it.items.filter((u) => u.st).map((u) => u.st)) !==
        JSON.stringify(other.ink.s.filter((x) => typeof x === 'number')
                                  .map((x) => other.ink.g[x])))
      fails.push("somebody else's post is drawn in shapes that are not the ones " +
                 'on it');
    if (it.src.nm !== other.lname)
      fails.push("somebody else's card is signed with the open language's name");
    other.ln.split(/\s+/).forEach((w) => {
      if (findWord(w))
        fails.push('the fixture dictionary now holds "' + w + '", so a post ' +
                   'meant to be in an unknown language is not one');
    });
  }

  /* ---- and a post with no ink is text, which is right --------------- */
  POSTS.push({ id: 'pnoink', at: 2, lang: 'x', lname: 'Borrowed', ln: 'qq ww',
               who: 'Iri', hd: 'iri', mine: false, mn: '', ui: 'en', gl: [] });
  const plain = itemsFor('p', 'pnoink');
  if (plain.items.some((u) => u.st))
    fails.push('a post with no ink came out with shapes on it, which can only ' +
               'have come from the open language');

  return { fails, wrote: JSON.parse(wrote).length,
           other: other ? other.lname : '', drew: after.items.length };
});

await br.close();
srv.close();

if (R.fails.length) {
  console.error('\ncard: ' + R.fails.length +
                ' thing' + (R.fails.length > 1 ? 's' : '') +
                ' about a card of a post do not hold:\n');
  for (const f of R.fails) console.error('  ' + f + '\n');
  process.exit(1);
}
console.log('card: a post written, the alphabet redrawn and a word deleted under it,\n' +
            '      and its card is still the ' + R.drew + ' shapes it was written with.\n' +
            "      A post from " + R.other + " -- another language, another person, no\n" +
            '      word of it in this dictionary -- draws its own shapes and wears its\n' +
            '      own name. A card of a WORD still follows the letters, and a post\n' +
            '      with no ink is still text.');
