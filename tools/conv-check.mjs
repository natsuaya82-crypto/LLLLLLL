/* ---------------------------------------------------------------------------
   tools/conv-check.mjs — the conversion table holds the claims made about it.

   Run it:   node tools/conv-check.mjs

   www/share.js builds two things for a writing system where the unit you TYPE
   and the unit you WRITE are different -- a syllabary, an abugida, a logography
   -- and hands them to the keyboard extension:

     ink   every shape the extension can draw, each written out ONCE
     conv  { how, max, map }  -- a roman spelling to the numbers in ink

   The comments on shareTable(), shareConv() and section 14 of
   docs/keyboard-extension.md make several claims about that pair, in prose,
   with nothing behind any of them:

     - a number in map always resolves inside ink
     - max is the longest key map actually has, because the extension stops
       buffering there and a short max is a word that can never be typed
     - nothing sits in ink that map does not point at -- "an unused shape is
       weight the extension carries for nothing", and the whole reason ink is
       a table of numbers rather than shapes repeated inline is 195 KB against
       4.4 MB
     - a key is already lower case, because the extension lower-cases before
       it looks one up
     - ink has no two entries that are the same shape twice
     - the roman face -- QWERTY, there to spell with -- exists exactly when
       the person CHOSE a writing system that needs one, sits LAST, is
       reached by a key on the person's own first face, and never wears a
       person's own letter: rom, del, sp, lay, next, and nothing else
     - and no face at all where nobody chose. wsGuess() reads 'syll' off one
       letter that writes two sounds, and a guess may not put a page on
       somebody's phone
     - conv.how says what wsys() said

   CLAUDE.md's own rule is the reason this file exists: "A comment saying
   'this is the one place' is worth nothing on its own... Either a check holds
   the claim, or do not make it." Nothing held those. This does.

   HOW MANY there are is not restated in this comment: it said seven in three
   places and eight in a fourth while the run's own last line enumerated nine.
   That line is the list -- read it, and add to it when a claim is added.

   How: boot the real app in a headless browser, seed it the same fixture
   act-check.mjs and press.mjs use, set the paid plan, and for every writing
   system WSYS lists -- asked of the page rather than written out here, so a
   sixth kind is walked the day it is added -- call the real shareKbd() and
   read what came back.

   What it cannot see, so that nobody mistakes silence for safety:
     - whether a shape LOOKS right. Only that the numbers pointing at it and
       the numbers inside it agree with each other
     - a dictionary bigger than the fixture's six words. The 195 KB / 4.4 MB
       figures in the doc were measured on 5000 words and are not reproduced
       here; only the shape of the table is

   Exit code is 0 only when every one of them holds, for every writing system.
   --------------------------------------------------------------------------- */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seed } from './fixture.mjs';
import { chromium, LAUNCH } from './browser.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', 'www');
const PORT = 8126;

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
const pg = await br.newPage();
const pageErrors = [];
pg.on('pageerror', e => pageErrors.push(e.message));
await pg.goto(`http://127.0.0.1:${PORT}/`);
await pg.waitForTimeout(300);

/* The fixture is shared with act-check.mjs and press.mjs, so this walks the
   same app they do rather than a fourth arrangement of it. */
await pg.evaluate(seed);

const R = await pg.evaluate(() => {
  const fails = [], systems = [];
  const ROMAN_KEYS = ['rom', 'del', 'sp', 'lay', 'next'];

  SET.plan = 'pro';

  /* Asked of the page, not written out here -- the same reason act-check
     asks the page for its screens rather than keeping a second list that
     drifts the day a sixth kind of writing is added. */
  const list = WSYS.slice();

  /* Every writing system on BOTH keyboards, because the answer differs and
     the difference is the point. Board 0 is the free QWERTY -- the keyboard
     both plans type on, the one with no editor -- and the conversion face is
     never added to it: it was reaching into its bottom row and putting a key
     to a second page on a keyboard the person cannot open.
     「2ページ目設定してねえのに2が出てくんだよ」
     A keyboard they built takes the face as before.

     The built one is kbFixed()'s own layout rather than kbAdd()'s, which
     blanks every key -- a board with no letters on it has no map and no ink,
     and would make the five claims above vacuous instead of true. */
  const boards = [
    ['the free QWERTY',       () => { KB = null; kbShow = 0; }],
    ['a keyboard they built', () => { KB = { kbs: [{ nm: '', pat: 'qwerty', lay: kbFixed().lay }],
                                             at: 1, v: 2 }; kbShow = 1; }]
  ];

  const pairs = [];
  boards.forEach(([bn, stand]) => list.forEach((w) => pairs.push([w, bn, stand])));

  /* 8. what a key PUTS IN is the code point the typing face draws.
     ------------------------------------------------------------------
     A letter key carries a private use code point -- U+E000 upward, one per
     drawn letter -- because that is the only thing on a phone that tells the
     Lingua keyboard's `a` from the system QWERTY's. `.tfont` is set in
     LinguaType, which carries nothing BUT that range, so a key that puts the
     letter's NAME in falls through to the ordinary font and comes out roman:
     the second face is built, installed, and never once used.

     The code point has to be the one installTypeFont() gave that letter. An
     index off by one types a letter and draws a different one, and nothing
     throws -- the font renders, the key looks right, and the document holds
     somebody else's letter. So this is asked per LETTER and not as a count:
     the counts agreeing while the pairing is shifted is the only way this
     breaks.

     Both plans, because the two got there by different roads -- kbFix()
     overrides `t` on the free QWERTY and shareFace() answers on a keyboard
     somebody built -- and a rule that holds on one plan and not the other is
     the feature existing on one plan.

     A letter with no shape is not in the typing face at all, so its key
     keeps the name. That is the fallback working, not a hole in it. */
  /* What the TYPING FACE was actually built with, read off the font writer's
     own input rather than worked out again here. Recomputing the list would
     make this a copy of the thing under test: shifting installTypeFont()'s
     assignment by one would move the keys and the copy together and the
     check would stay green -- which is exactly how a wrong answer gets a
     tick. LinguaFont.build is wrapped instead, the same way card-check
     wraps cardInk() rather than asking cardSrc(). */
  const faceMap = () => {
    const real = LinguaFont.build;
    let got = null;
    LinguaFont.build = function (defs, opt) {
      if (opt && opt.family === 'LinguaType') got = defs.slice();
      return real.apply(this, arguments);
    };
    try { installScriptFont(); } finally { LinguaFont.build = real; }
    const by = {};
    (got || []).forEach((d) => { by[d.name] = String(d.roman || ''); });
    const want = {};
    LETTERS.forEach((l) => {
      const t = by[glyphName(l.id)];
      if (t) want[l.id] = t;
    });
    return want;
  };
  const puaClaim = (w) => {
    let kbd;
    try { kbd = shareKbd(); } catch (e) { return; }
    const want = faceMap();
    const named = {};
    let drawn = 0, plain = 0;
    /* A key does not say which letter it is -- that is what the face was
       built FROM -- but it does carry the letter's shape when there is one.
       `st` is shareInk(), the contours, and it is present exactly when the
       letter is in the typing face. So the two directions can be said
       without knowing the id:

           a key that draws a shape types a code point
           a key that draws no shape does not

       The first is the one that was missing. The check used to say only
       "a code point that appears must be the right one", so a key that
       fell back to the letter's NAME -- a letter with a shape, typing
       roman -- went past on the third branch and said nothing. That is
       one letter out of thirty typing what the system keyboard types,
       which is the whole bug in miniature and the shape it takes when
       sharePua() answers '' for one letter instead of all of them. */
    (kbd.lay || []).forEach((face) => (face.rows || []).forEach((row) => row.forEach((k) => {
      if (k.k !== 'lt') return;
      const t = String(k.t || '');
      const code = t.charCodeAt(0);
      const isPua = code >= 0xE000 && code <= 0xF8FF;
      const hasShape = !!(k.st && k.st.length);
      /* which letter this key is is found by the code point it claims */
      const mine = Object.keys(want).filter((id) => want[id] === t);
      if (mine.length) {
        named[mine[0]] = 1; drawn++;
        if (!hasShape)
          fails.push(w + ': a key puts in U+' + code.toString(16).toUpperCase() +
            ' and draws no shape -- the typing face has that code point, so' +
            ' the key types a letter it does not show');
        return;
      }
      if (isPua) {
        fails.push(w + ': a key puts in U+' + code.toString(16).toUpperCase() +
          ', which installTypeFont() gave to no letter -- so it types one' +
          ' shape and draws another, or draws nothing');
        return;
      }
      if (hasShape)
        fails.push(w + ': a key draws a shape and puts in ' + JSON.stringify(t) +
          ' -- the letter is in the typing face and the key types its name,' +
          ' so it comes out roman while every other key comes out drawn');
      else plain++;
    })));
    if (!drawn)
      fails.push(w + ': not one letter key puts in a private use code point,' +
        ' so every one of them types what the system keyboard types and comes' +
        ' out roman -- LinguaType is built and never used');
    /* and the fallback: a letter with no shape keeps its name */
    const noShape = LETTERS.filter((l) => !(l.st && l.st.length));
    if (noShape.length && !plain)
      fails.push(w + ': ' + noShape.length + ' letters have no shape, so their' +
        ' keys have nothing in the typing face to draw and must keep their' +
        ' name -- none of them did');
  };

  pairs.forEach(([w0, bn, stand]) => {
    SET.wsys = w0;
    stand();
    const w = w0 + ' on ' + bn;
    /* Claim 8 on both plans. The free QWERTY is what BOTH type on, so it is
       walked twice on purpose -- kbFix()'s override is the same code either
       way and the two must answer alike. */
    ['free','pro'].forEach((pl) => {
      SET.plan = pl; puaClaim(w + ' (' + pl + ')');
    });
    SET.plan = 'pro';
    const onFree = (bn === 'the free QWERTY');
    let kbd;
    try { kbd = shareKbd(); }
    catch (e) { fails.push(w + ': shareKbd() threw -- ' + e.message); return; }

    const ink = kbd.ink || [];
    const conv = kbd.conv;
    const rec = { w: w, ink: ink.length, mapKeys: 0, bytes: 0, roman: false };

    if (!conv) {
      /* Nothing to offer is a legitimate answer -- shareConv() returns null
         on purpose so the keyboard shows no bar rather than an empty one --
         but the fixture seeds words, sounds and drawn letters precisely so
         this never has to be the answer. If it is, none of the claims
         below has anything to be checked against. */
      fails.push(w + ': shareKbd().conv came back null -- the fixture' +
        ' draws letters and has words, so there was nothing to offer a' +
        ' candidate from, which the other six checks below cannot see past');
      systems.push(rec);
      return;
    }

    const map = conv.map;
    const keys = Object.keys(map);
    rec.mapKeys = keys.length;
    rec.bytes = JSON.stringify({ ink: ink, conv: conv }).length;

    /* 1. every index in map points at a real ink entry */
    keys.forEach((k) => {
      (map[k] || []).forEach((ix) => {
        if (!(ix >= 0 && ix < ink.length))
          fails.push(w + ': map["' + k + '"] points at ink[' + ix + '],' +
            ' but ink only has ' + ink.length + ' entries');
      });
    });

    /* 2. conv.max is exactly the longest key in map */
    let longest = 0;
    keys.forEach((k) => { if (k.length > longest) longest = k.length; });
    if (conv.max !== longest)
      fails.push(w + ': conv.max is ' + conv.max + ', but the longest key' +
        ' actually in map is ' + longest + ' ("' +
        keys.filter((k) => k.length === longest)[0] + '")');

    /* 3. no ink entry is unreachable from map */
    const reached = {};
    keys.forEach((k) => (map[k] || []).forEach((ix) => { reached[ix] = 1; }));
    for (let i = 0; i < ink.length; i++) {
      if (!reached[i])
        fails.push(w + ': ink[' + i + '] (' + JSON.stringify(ink[i]) +
          ') is never pointed at by any key in map -- a shape the extension' +
          ' carries and can never draw from a key press');
    }

    /* 4. keys are lower case and non-empty */
    keys.forEach((k) => {
      if (!k) fails.push(w + ': map has an empty key');
      else if (k !== k.toLowerCase())
        fails.push(w + ': map key "' + k + '" is not lower case -- the' +
          ' extension lower-cases what it typed before it looks one up');
    });

    /* 5. ink has no duplicates, compared by JSON.stringify */
    const seenShapes = {};
    ink.forEach((entry, i) => {
      const sig = JSON.stringify(entry);
      if (Object.prototype.hasOwnProperty.call(seenShapes, sig))
        fails.push(w + ': ink[' + i + '] is the same shape as ink[' +
          seenShapes[sig] + '] -- the whole reason ink is a table of' +
          ' numbers is that a repeated shape is 4.4 MB where this is 195 KB');
      else seenShapes[sig] = i;
    });

    /* 6. a roman layer exists iff wsys() is syll, abugida or logo; it is the
       LAST face and not the first, wears only rom/del/sp/lay/next, and
       something on the person's first face reaches it.

       Last, because the first page of somebody's keyboard is their keyboard.
       It used to be first, and what that produced on the phone was an
       alphabet somebody had drawn opening in Messages as a plain roman
       QWERTY. 「1ページ目これになるのやめてくれない？1ページ目が自作のキーボード
       なんだから」 The reachability half is the cost of moving it: a face at
       the end that nothing goes to is a face nobody can use.

       And `rom` NAMES it. The extension has to know which face holds text
       back, and it asked `how` -- what the writing system is. A writing
       system does not type; a face does, and a syllabary's board carries the
       person's own letters as well as the roman face. So every face of a
       syllabary held everything back: pressing your own letter put nothing
       in the document, and pressing a second offered nothing at all, because
       two letter names in a row are not a spelling of anything. That is a
       claim about the pair -- a number in the file and a face in the file --
       which is exactly the kind this check exists for. */
    /* The writing system says a roman face is NEEDED; the keyboard says
       whether it may be added. Both, and they are two different sentences. */
    const needsRoman = (w0 === 'syll' || w0 === 'abugida' || w0 === 'logo') && !onFree;
    if (onFree && kbd.lay.length !== 1)
      fails.push(w + ': the free QWERTY went out with ' + kbd.lay.length +
        ' faces. It has one, it has no editor, and nothing may add a page to it');
    if (onFree && kbd.lay[0].rows.some((r) => r.some((k) => k.k === 'lay')))
      fails.push(w + ': the free QWERTY went out carrying a key to another' +
        ' page. There is no other page, and the person never made one');
    const isRoman = (l) => !!(l && l.rows &&
      l.rows.some((row) => row.some((k) => k.k === 'rom')));
    const romAt = kbd.lay.map((l, i) => (isRoman(l) ? i : -1)).filter((i) => i >= 0);
    const hasRoman = romAt.length > 0;
    rec.roman = hasRoman;
    if (needsRoman && !hasRoman)
      fails.push(w + ': typed unit and written unit differ, so a roman' +
        ' layer is needed, and no face carries rom keys');
    if (!needsRoman && hasRoman)
      fails.push(w + ': typed unit and written unit are the same, so' +
        ' there should be no roman layer, but face ' + romAt[0] + ' carries rom keys');
    if (romAt.length > 1)
      fails.push(w + ': ' + romAt.length + ' roman faces, and there is one');
    if (!hasRoman && kbd.rom !== undefined)
      fails.push(w + ': rom says face ' + kbd.rom + ' is roman and no face' +
        ' carries rom keys, so the extension would hold text back on one of' +
        " the person's own");
    if (hasRoman) {
      const at = romAt[0];
      if (kbd.rom !== at)
        fails.push(w + ': the roman face is ' + at + ' and rom says ' +
          kbd.rom + ' -- the extension reads rom to decide which face holds' +
          ' its text back, so a wrong one is every letter typing nothing');
      if (at !== kbd.lay.length - 1)
        fails.push(w + ': the roman face is at ' + at + ' of ' +
          kbd.lay.length + ' -- it goes last, so the first page is the' +
          " person's own keyboard");
      if (at === 0)
        fails.push(w + ': the roman face is the FIRST page, which is the one' +
          ' thing it must never be');
      const goes = kbd.lay.some((l, i) => i !== at && l.rows &&
        l.rows.some((row) => row.some((k) => k.k === 'lay' && k.to === at)));
      if (!goes)
        fails.push(w + ': nothing goes to the roman face -- a face at the end' +
          ' with no key pointing at it cannot be reached');
      kbd.lay[at].rows.forEach((row, ri) => row.forEach((k, ki) => {
        if (ROMAN_KEYS.indexOf(k.k) < 0)
          fails.push(w + ': roman layer key [' + ri + '][' + ki + '] has' +
            ' k="' + k.k + '", not one of ' + ROMAN_KEYS.join('/') +
            (k.k === 'lt' ? ' -- the roman face is not the person\'s letters' : ''));
      }));
    }

    /* 7. conv.how equals wsys() */
    if (conv.how !== wsys())
      fails.push(w + ': conv.how is "' + conv.how + '" but wsys() says "' +
        wsys() + '"');

    systems.push(rec);
  });

  /* 9. a writing system NOBODY CHOSE adds no face.

     Every pair above sets SET.wsys before it looks, which is the case where
     somebody went to the writing-system screen and said "syllabary". It is
     not the only case: wsys() falls through to wsGuess() when SET.wsys is
     unset, and wsGuess() reads 'syll' off one letter that happens to write
     two sounds. So the claims above were all being made about the road
     the app takes when it is TOLD, and the road it takes when it GUESSES had
     never been walked at all -- which is how a keyboard somebody built one
     face of went to the phone with a roman QWERTY behind it.
     「2ページ目未設定なのに端末で qwerty の2ページ目が出る」

     The guess is asked for first, so this cannot go quietly vacuous: if the
     fixture's language ever stops guessing a converting system, the claim
     below would hold for the wrong reason, and this says so instead. */
  const guessFails = [];
  delete SET.wsys;
  KB = { kbs: [{ nm: '', pat: 'qwerty', lay: kbFixed().lay }], at: 1, v: 2 };
  kbShow = 1;
  const guessed = wsys();
  if (guessed !== 'syll' && guessed !== 'abugida' && guessed !== 'logo')
    guessFails.push('nothing was chosen and wsGuess() answered "' + guessed +
      '", which needs no roman face anyway -- so this claim proves nothing.' +
      ' Give the fixture a letter that writes two sounds');
  else {
    const g = shareKbd();
    if (g.lay.length !== 1)
      guessFails.push('nothing was chosen, wsGuess() said "' + guessed +
        '", and the keyboard went out with ' + g.lay.length + ' faces. The' +
        ' person built one. A guess may not add a page to somebody\'s phone');
    if (g.rom !== undefined)
      guessFails.push('nothing was chosen and rom says face ' + g.rom +
        ' is roman -- there is no roman face to be');
    if (g.lay[0].rows.some((r) => r.some((k) => k.k === 'lay')))
      guessFails.push('nothing was chosen and the one face carries a key to' +
        ' another page. There is no other page');
  }
  guessFails.forEach((m) => fails.push('nothing chosen: ' + m));

  return { fails: fails, systems: systems, listedCount: list.length,
           guessed: guessed };
});

await br.close();
srv.close();

if (pageErrors.length) {
  R.fails.push(...pageErrors.map((m) => 'the page itself: ' + m));
}

console.log('writing systems walked: ' + R.systems.length +
  ' (' + R.systems.map((s) => s.w).join(', ') + ')');
R.systems.forEach((s) => {
  console.log('  ' + s.w + ':  ink ' + s.ink + '  map ' + s.mapKeys +
    ' keys  roman layer ' + (s.roman ? 'yes' : 'no') +
    '  table ' + (s.bytes / 1024).toFixed(1) + ' KB');
});
const largest = R.systems.reduce((m, s) => Math.max(m, s.bytes), 0);
console.log('largest table: ' + (largest / 1024).toFixed(1) + ' KB');
console.log('nothing chosen, wsGuess() said: ' + R.guessed +
  ' -- and no face was added for it');

if (R.fails.length) {
  console.error('\nFAILED (' + R.fails.length + '):');
  R.fails.slice(0, 40).forEach((m) => console.error('  ' + m));
  if (R.fails.length > 40) console.error('  ...and ' + (R.fails.length - 40) + ' more');
  process.exit(1);
}
console.log('\nall nine claims hold, for every writing system: every map index' +
  ' resolves, max is the longest key, nothing in ink goes unreached, every' +
  ' key is lower case and unique, the roman layer appears exactly where the' +
  ' person CHOSE one and never where the app merely guessed, and wears' +
  ' nothing but its own five kinds of key, and' +
  ' conv.how says what wsys() says. And a letter key puts in the code point' +
  ' installTypeFont() gave that letter, on both plans -- so what the Lingua' +
  ' keyboard types is drawn in the letters somebody drew, and what any other' +
  ' keyboard types is not.');
