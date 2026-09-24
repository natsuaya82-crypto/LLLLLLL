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

   And what it asks besides, because each is the same sentence -- a card of a
   post is the post as the timeline draws it -- or the card's other half:
     - a post with no drawable ink, mine or not, is its TEXT, character for
       character with postLnHTML(), on a line this dictionary CAN spell
     - spaces and newlines are postRuns()'s, on a post and on an example
     - a word's letter is inkGeo()'s shape, a ring included
     - what a post's card says it means is postSay()
     - a card of a post, word or example that is gone is no card at all

   Exit code is 0 only when all of it holds.
   --------------------------------------------------------------------------- */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seed } from './fixture.mjs';
import { chromium, LAUNCH } from './browser.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', 'www');
const PORT = 8128;

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
await pg.evaluate((s) => { eval('(' + s + ')()'); SET.walked = true; SET.ui = 'en'; },
                  seed.toString());

const R = await pg.evaluate(async () => {
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
              ui: 'en', ink: postInk(ln) };
  POSTS.push(p);
  if (!p.ink || !p.ink.g.length)
    fails.push('the post carries no ink, so nothing below this is a test of anything');
  const wrote = shapes(itemsFor('p', 'pcard').items);

  /* ---- a letter nobody has drawn yet is its name ------------------- */
  /* `kano` is stored with its spelling (`sp`, letter ids and no sounds) and
     three of its four letters have no shape: the card read the missing sound
     and wrote "undefined" where the names belong. */
  if (!findWord('kano') || !findWord('kano').sp)
    fails.push('"kano" carries no stored spelling, so a letter named by id alone is not walked');
  /* The headword is the first four things on the page; the family rows under
     it are words too and are asked only for the word "undefined". */
  const kn = itemsFor('w', 'kano').items.map((u) => u.st ? '#' : String(u.tx));
  if (kn.slice(0, 4).join('') !== '#ano' || kn.join('').indexOf('undefined') >= 0)
    fails.push('a word spelt with letters nobody has drawn yet draws ' +
               JSON.stringify(kn.join('')) + ' for them, not their names');

  /* ---- imported letters (sh only, no st) are drawn too --------------- */
  /* A letter brought in from a PDF import carries `sh` -- a ring -- and no
     `st` at all (www/sheet.js's ltNew via 'write'). postCut() and
     postInkOf() used to read `l.st` by hand, so a line spelled with one
     of these letters carried no ink: postInkOK() saw nothing on it and the
     post fell back to plain text. inkGeo(l) is the one place that already
     knows a letter's shape is either st or sh; postCut/postInkOf have to
     ask it instead. */
  LETTERS.push({ id: 'lsh', sh: [[[100, 100], [700, 100], [700, 700], [100, 700]]],
                 ch: '', nm: 'zz', snd: [] });
  const shInk = postInk('zz');
  if (!shInk || !shInk.g.length)
    fails.push('a letter imported with only sh (no st) is not drawn into a ' +
               "post's ink -- postCut() must ask inkGeo(l), not l.st");
  const shIdx = ltPuaOrder().map((l) => l.id).indexOf('lsh');
  const typedInk = shIdx >= 0 ? postInkOf(puaTyped(ltPua(shIdx)).cut) : null;
  if (!typedInk || !typedInk.g.length)
    fails.push('a letter imported with only sh (no st) is not drawn when ' +
               'typed through the keyboard -- postInkOf() must ask ' +
               'inkGeo(l), not l.st');
  LETTERS.pop();

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
    /* In the order the POST's direction says, not the open language's.

       Reading order and drawing order are the same thing for everything
       except a line that runs right to left across the page: that one is the
       same list handed over from the other end, and cardPaint() reverses it
       before anything is placed.

       A line in COLUMNS is not reversed. It used to be -- the card flattened
       ttb-rl to rtl, because the only shape a card had was a band 1920 wide
       and a column had nowhere to go in it. The card has three shapes now and
       sets a column as a column, so the letters come through in the order
       they are read and it is the COLUMNS that run right to left. The fixture
       post is ttb-rl, so this is the case that changed. */
    let wantSt = other.ink.s.filter((x) => typeof x === 'number')
                            .map((x) => other.ink.g[x]);
    if (postDir(other) === 'rtl') wantSt = wantSt.slice().reverse();
    if (JSON.stringify(it.items.filter((u) => u.st).map((u) => u.st)) !==
        JSON.stringify(wantSt))
      fails.push("somebody else's post is drawn in shapes that are not the ones " +
                 'on it, or not in the order its direction says');
    if (postDir(other) === 'ltr')
      fails.push('the fixture post by somebody else runs left to right, so ' +
                 'nothing below is a test of a direction travelling on a post');
    if (it.src.nm !== other.lname)
      fails.push("somebody else's card is signed with the open language's name");
    other.ln.split(/\s+/).forEach((w) => {
      if (findWord(w))
        fails.push('the fixture dictionary now holds "' + w + '", so a post ' +
                   'meant to be in an unknown language is not one');
    });
  }

  /* ---- 6. and the direction is the post's, not the open language's ---
     The same test as redrawing the letters, on the other thing that travels:
     turn the OPEN language round underneath a post that says left to right,
     and the card must not turn with it. Without this, a card that simply
     asked scriptDir() would be green on every line above -- the fixture
     language runs left to right and so does that post. */
  const wasDir = SCRIPT.dir;
  SCRIPT.dir = 'rtl';
  const mineNow = itemsFor('p', 'pcard');
  SCRIPT.dir = wasDir;
  if (shapes(mineNow.items) !== read)
    fails.push('a card of a post turned round when the OPEN language did. The ' +
               "post says " + postDir(p) + ' and the card is drawing it the ' +
               "way this phone's language runs");

  /* ---- 7. and the GAP is the post's, not the open language's --------
     「字と字の間を、言語ごとに設定できるようにする。既定は今と同じ 1 歩。
     0 にすると、端まで描いた線が隣とくっついて一本に繋がる」 OWNER 2026-09-23.

     The gap is the language's, and a post carries the one it was written
     with (`ink.sp`, postInkOf). So the same test a third time: change the
     OPEN language's gap under posts that already exist, and nothing they
     draw on the card may move. Widths and places are compared, not strings:
     a gap is a width. The timeline's own line is tools/line-check.mjs's --
     it is set in the face now, and asked there in pixels. */
  const cardW = (id) => JSON.stringify(itemsFor('p', id).items.map(
    (u) => u.sp ? 'sp' : [u.w, Math.round(u.ax || 0)]));
  const wasSp = SCRIPT.sp;
  SCRIPT.sp = 1;
  const typed = ltPuaOrder().map((l, i) => ltHasShape(l) ? ltPua(i) : '').join('').slice(0, 3);
  const pNew = { id: 'pgap', at: 4, lang: langId, lname: langName, ln: 'x', who: 'Aya',
                 hd: 'aya', mine: true, mn: '', ui: 'en', ink: postInkOf(puaTyped(typed).cut) };
  POSTS.push(pNew);
  if (!pNew.ink || pNew.ink.sp !== 1)
    fails.push('a post written with the language at one step carries sp=' +
               (pNew.ink && pNew.ink.sp) + ', not 1: the gap is not put on the post ' +
               'when it is written');
  const before = { old: cardW('pcard'), now: cardW('pgap') };
  SCRIPT.sp = 0;
  const after0 = { old: cardW('pcard'), now: cardW('pgap') };
  if (after0.old !== before.old)
    fails.push('a card of a post written before a language had a gap moved when ' +
               'the open language was set to 0:\n     ' + before.old.slice(0, 160) +
               '\n     ' + after0.old.slice(0, 160));
  if (after0.now !== before.now)
    fails.push('a card of a post written at one step moved when the open language ' +
               'was set to 0 -- the card is spacing it with the OPEN language');
  /* And the other way round: somebody else's post written at 0, on a phone
     whose own language stands at one step, is drawn JOINED -- every letter
     exactly as wide as its ink. */
  SCRIPT.sp = 1;
  const oj = JSON.parse(JSON.stringify(other || {}));
  if (other) {
    oj.id = 'pjoin'; oj.ink.sp = 0; POSTS.push(oj);
    const it = itemsFor('p', 'pjoin').items.filter((u) => u.st);
    const loose = it.filter((u) => u.w !== Math.round(u.x1 - u.x0));
    if (!it.length || loose.length)
      fails.push("somebody else's post written at 0 is not drawn joined on the card: " +
                 loose.length + ' of ' + it.length + ' letters are wider than their ink');
  }
  SCRIPT.sp = wasSp;

  /* ---- 8. a letter nobody drew is its name, not a borrowed character ---
     「描いていない字はローマ字」 OWNER 2026-09-23. The screens say so
     (sfontHTML, ltLineChar); the card answered with `l.ch` first, so a letter
     somebody had borrowed `α` for and never drawn came out `α` on the picture
     and `a` everywhere else (r73 §2-9, measured). Asked of what cardPaint()
     actually draws, for a word of this dictionary with one of its letters
     made undrawn and borrowed. */
  const bw = findWord('ke'), keSp = bw ? spOf(bw) : [];
  const keL = keSp.length ? ltById(keSp[0].l) : null;
  if (!keL) fails.push('"ke" has no first letter to take the shape off, so section 8 holds nothing');
  else {
    const was = JSON.stringify(keL);
    delete keL.st; delete keL.sh; keL.ch = 'α';
    const it = itemsFor('w', 'ke').items;
    const borrowed = it.filter((u) => u.tx && u.tx.indexOf('α') >= 0).length;
    const named = it.filter((u) => u.tx && u.tx.indexOf(String(ltName(keL))) >= 0).length;
    if (borrowed || !named)
      fails.push('a letter nobody drew is drawn on the card as the character it borrowed (' +
                 borrowed + ' units carry α, ' + named + ' carry its name "' + ltName(keL) +
                 '") -- undrawn is roman (OWNER 2026-09-23)');
    const back = JSON.parse(was);
    Object.keys(keL).forEach((k) => { delete keL[k]; });
    Object.keys(back).forEach((k) => { keL[k] = back[k]; });
  }

  /* ---- every shape ink can arrive in -------------------------------- */
  /* postInkOK() decides, once, for the timeline and the card both. What is
     asserted here is the boundary and NOT a repair: a post whose ink is
     wreckage is drawn as its text, because guessing at what the shapes were
     meant to be would be inventing somebody else's alphabet. Every one of
     these must also come back without throwing -- a card that crashes on a
     malformed post is a timeline that cannot be opened. */
  const G = [[{ pts: [[0, 0], [500, 500]] }]];
  /* The line every one of these carries is one THIS dictionary spells, with a
     letter that has a shape. It used to be 'qq ww', which no dictionary holds
     -- so a card that spelled somebody else's post out of mine drew nothing
     from it either, and every case below was green with that bug in. */
  const SPELT = 'ke tir';
  if (!findWord('ke') || !itemsFor('w', 'ke').items.some((u) => u.st))
    fails.push('"ke" is not a word this dictionary draws, so a post reading "' + SPELT +
               '" is not a test of a card spelling it out of the open language');
  const CASES = [
    ['no ink at all',            undefined,                 'text'],
    ['ink is null',              null,                      'text'],
    ['ink is not an object',     'nonsense',                'text'],
    ['ink is empty',             {},                        'text'],
    ['g and s both empty',       { g: [], s: [] },          'text'],
    ['g missing',                { s: [0] },                'text'],
    ['s missing',                { g: G },                  'text'],
    ['g is not an array',        { g: {}, s: [0] },         'text'],
    ['s is not an array',        { g: G, s: {} },           'text'],
    ['s points past g',          { g: G, s: [5] },          'text'],
    ['s points at -1',           { g: G, s: [-1] },         'text'],
    ['s holds a hole',           { g: [null], s: [0] },     'text'],
    ['s holds an object',        { g: G, s: [{}] },         'text'],
    ['one shape',                { g: G, s: [0] },          'shapes'],
    ['a shape and a space',      { g: G, s: [0, ' ', 0] },  'shapes'],
    ['a text run of several',    { g: G, s: [0, 'ab c'] },  'shapes']
  ];
  CASES.forEach((c, i) => {
    const id = 'pink' + i;
    POSTS.push({ id, at: 3, lang: 'x', lname: 'Edge', ln: SPELT, who: 'Iri',
                 hd: 'iri', mine: false, mn: '', ui: 'en', ink: c[1] });
    let got;
    try { got = itemsFor('p', id); }
    catch (e) {
      fails.push('ink "' + c[0] + '" threw: ' + e.message);
      return;
    }
    const drew = got.items.filter((u) => u.st).length;
    if (c[2] === 'text' && drew)
      fails.push('ink "' + c[0] + '" drew ' + drew + ' shapes. It is not drawable, ' +
                 'so the post is its text -- anything else is invented.');
    if (c[2] === 'shapes' && !drew)
      fails.push('ink "' + c[0] + '" drew nothing, and it is drawable');
    /* And the one that is easy to get wrong: a text run is several characters
       and cardInk() draws one thing per item, so it has to be spread out. */
    if (c[0] === 'a text run of several') {
      const tx = got.items.filter((u) => u.tx).map((u) => u.tx).join('');
      const sp = got.items.filter((u) => u.sp).length;
      if (tx !== 'abc' || sp !== 1)
        fails.push('a text run of "ab c" came out as ' + JSON.stringify(tx) +
                   ' with ' + sp + ' gaps, not "abc" with 1');
    }
  });

  /* ---- and a post with no ink is its text, as on the timeline ------ */
  /* Whoever wrote it. The timeline draws a post whose ink is not drawable as
     its text (postLnHTML), so the card of it is that text too -- the same
     characters, the same spaces, and a newline still a newline. Somebody
     else's post, and one of my own from before a post carried ink: both. */
  const lineText = (items) => items.map((u) => u.br ? '\n' : u.sp ? ' ' : (u.tx || '#')).join('');
  [['somebody else', false, 'x'], ['mine', true, langId]].forEach((c, i) => {
    const id = 'pnoink' + i, ln = 'ke  tir\nke';
    POSTS.push({ id, at: 2, lang: c[2], lname: 'Borrowed', ln, who: 'Iri',
                 hd: 'iri', mine: c[1], mn: '', ui: 'en' });
    const got = itemsFor('p', id).items;
    if (got.some((u) => u.st))
      fails.push('a post (' + c[0] + ') with no ink came out with shapes on it, which ' +
                 'can only have come from the open language -- its line on the ' +
                 'timeline is its text');
    const shown = document.createElement('div');
    shown.innerHTML = postLnHTML(postById(id));
    if (lineText(got) !== shown.textContent)
      fails.push('a post (' + c[0] + ') with no ink reads ' + JSON.stringify(lineText(got)) +
                 ' on its card and ' + JSON.stringify(shown.textContent) + ' on the timeline');
  });

  /* And an example is a line too: its spaces and its newlines are postRuns()'s,
     the same as a post's, and not a split of its own. */
  const keW = findWord('ke'), wasEx = keW.ex;
  keW.ex = [{ ln: 'ke  tir\nke' }];
  const exLine = lineText(itemsFor('x', 'ke#0').items).replace(/#+/g, '#');
  keW.ex = wasEx;
  if (exLine.split('\n').length !== 2 || exLine.indexOf('  ') < 0)
    fails.push('an example written "ke  tir\\nke" reads ' + JSON.stringify(exLine) +
               ' on its card -- its spaces and its line are not the ones postRuns() says');

  /* ---- a word's letters are what inkGeo() says they are -------------- */
  /* A letter written on paper comes in as a ring (`sh`) and no strokes. The
     post's cut asks inkGeo() and draws it; the word's card has to as well. */
  const keLt = spOf(findWord('ke')).map((x) => x.l ? ltById(x.l) : ltMain(x.u))
                                   .filter((l) => l && l.st && l.st.length)[0];
  if (!keLt) fails.push('"ke" has no letter with strokes, so the ring case is not walked');
  else {
    const was = keLt.st;
    keLt.sh = [[[100, 100], [700, 100], [700, 700], [100, 700]]]; keLt.st = [];
    const ring = itemsFor('w', 'ke').items.filter((u) => u.st).length;
    keLt.st = was; delete keLt.sh;
    if (!ring)
      fails.push("a word's card drops a letter whose shape is a ring (sh) -- " +
                 'cardUnit() has to ask inkGeo(), as the post does');
  }

  /* ---- what a post's card says it means is what the timeline says ---- */
  const realDay = dayMap;
  dayMap = function(){ return { en: 'today, in the reader\'s words' }; };
  POSTS.push({ id: 'pday', at: 2, lang: 'x', lname: 'Other', ln: 'ke', who: 'Iri',
               hd: 'iri', mine: false, mn: 'what the writer typed', pr: 'd1', ui: 'en' });
  const said = { card: itemsFor('p', 'pday').src.mn, line: postSay(postById('pday')) };
  dayMap = realDay;
  if (said.card !== said.line)
    fails.push("a post's card means " + JSON.stringify(said.card) + ' and its timeline row ' +
               JSON.stringify(said.line) + ' -- one post, two meanings');

  /* ---- a card of something that is gone draws nothing -------------- */
  /* Not the newest word signed with my handle, which is what it was. A post,
     a word and an example, each asked for by a key nothing answers to. */
  [['p', 'nope'], ['w', 'nope'], ['x', 'ke#99'], ['x', 'nope#0']].forEach((c) => {
    CARD = { k: c[0], v: c[1], sh: '' };
    if (cardSrc() !== null)
      fails.push('a card of ' + c.join(':') + ', which is not there, is a card of ' +
                 JSON.stringify(cardSrc().line));
    cardOpen(c[0], c[1]);
    if (document.getElementById('cardc'))
      fails.push('the card of ' + c.join(':') + ', which is not there, still offers a picture');
  });
  /* And the thing going while its card is open: the fonts arriving paint it
     again, and Save names the file after it. Neither may throw. */
  POSTS.push({ id: 'pgo', at: 2, lang: 'x', lname: 'Other', ln: 'ke', who: 'Iri',
               hd: 'iri', mine: false, mn: '', ui: 'en' });
  cardOpen('p', 'pgo');
  POSTS = POSTS.filter((x) => x.id !== 'pgo');
  try { cardPaint(document.getElementById('cardc')); cardSave(); }
  catch (e) { fails.push('a post gone while its card was open: ' + e.message); }

  return { fails, wrote: JSON.parse(wrote).length, cases: CASES.length,
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
            '      own name. A card of a WORD still follows the letters, a post\n' +
            '      with no ink is its text as on the timeline -- mine or not, spelt\n' +
            '      or not -- it means what its row means, a card of what is gone\n' +
            '      draws nothing, and every one of ' + R.cases +
            ' shapes ink\n      can arrive in -- empty, missing, pointing at nothing -- comes ' +
            'back\n      as text rather than as a guess, without throwing.\n' +
            '      The gap is the post\'s: the open language set to 0 moves no card\n' +
            '      of a post written before it, and one written at 0 elsewhere is\n' +
            '      drawn joined.');
