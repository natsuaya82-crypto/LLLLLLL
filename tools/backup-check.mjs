/* ---------------------------------------------------------------------------
   tools/backup-check.mjs — the copy that survives the app, actually survives.

   Run it:   node tools/backup-check.mjs

   www/backup.js (chapter 24) writes a language out as one file so that losing
   the app does not lose the language. That is the largest promise this app
   makes -- 「データ消えるのだけはありえない」 -- and until this file existed
   nothing held it. Every other check in the gate opens an app that is working;
   this one breaks it on purpose and asks what comes back.

   It cannot press the native side: keep() and kept() are Swift and there is no
   Swift here. What it holds is everything on this side of that call, which is
   where the two rules live:

     PACKED       every slice of the open language is in the file, by name,
                  as the text that is in storage -- not a reshaped copy. A
                  slice added to SLICES and forgotten here would be a slice
                  that quietly stops being backed up, and nothing would look
                  wrong until somebody needed it.

     RESTORED     wiping every slice the way iOS reclaiming storage would do
                  it, and then reading the file back, gives the same words,
                  the same letters, and the language in the index again.

     NOT CLOBBERED  restoring an OLDER file over a language that is present
                  puts back nothing. This is the one that matters most: the
                  way a backup destroys somebody's work is by winning, and a
                  restore that overwrites is worse than no restore at all.

     ROTATION     the native side keeps two spares. That is Swift and is not
                  run here, so this only checks that the JS asks for the name
                  it says it does -- one file per language, with the id on it,
                  so two languages called the same thing cannot collide.

     COUNTED      every file carries a number that goes up and never down,
                  and a restore drags it forward to whatever the file it read
                  had reached. This is what a cloud will use to tell two
                  copies apart, and it exists before the cloud does because a
                  counter added on the day it is needed starts at zero for
                  everybody who already has a file.

   Exit code is 0 only when all five hold.
   --------------------------------------------------------------------------- */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { seed } from './fixture.mjs';
import { chromium, LAUNCH } from './browser.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', 'www');
const PORT = 8127;

const mime = (f) => f.endsWith('.html') ? 'text/html; charset=utf-8'
  : f.endsWith('.js') ? 'application/javascript; charset=utf-8'
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
await pg.evaluate(seed);

const R = await pg.evaluate(() => {
  const fails = [];
  ltStart(); saveLetters(); save();
  /* The keyboard somebody built, and what the language is FOR. Both are the
     language's and neither was in SLICES, so both were written by the app,
     shown on screen, and left out of every backup -- and nothing here would
     have noticed, because a slice the fixture never writes is absent, and
     absent is not a failure. So this language has one of each. */
  KB = { lay: [{ name: 'main', rows: [[{ k: 'a' }]] }] }; saveKb();
  WLD = { use: 'story', where: 'a valley', who: 'two families',
          note: 'nobody outside the valley speaks it' }; saveWld();

  /* ---- what goes in the file --------------------------------------- */
  const file = JSON.stringify(bkPack());
  const packed = JSON.parse(file);
  const id = langId;
  if (packed.id !== id) fails.push('the file does not carry the language id');
  SLICES.forEach(k => {
    const stored = localStorage.getItem(langKey(k));
    if (stored === null) return;              /* a slice this language has none of */
    if (packed.slice[k] !== stored)
      fails.push('slice "' + k + '" is in storage and not in the file, or not verbatim');
  });
  const missing = SLICES.filter(k => localStorage.getItem(langKey(k)) !== null &&
                                     typeof packed.slice[k] !== 'string');
  const before = { words: WORDS.length, letters: LETTERS.length,
                   slices: Object.keys(packed.slice).length };
  /* Named, not counted. A count says eleven and goes on saying eleven when
     the eleventh is the wrong one. */
  ['kb', 'wld'].forEach(k => {
    if (typeof packed.slice[k] !== 'string')
      fails.push('slice "' + k + '" is in the language and not in the file');
  });

  /* ---- the number on the file -------------------------------------- */
  if (typeof packed.n !== 'number' || packed.n < 1)
    fails.push('the file carries no save number, so nothing can tell two copies apart');
  const n1 = bkPack().n;
  if (n1 !== packed.n)
    fails.push('the save number moved without a file being written: ' + packed.n + ' -> ' + n1);
  bkNoSet(packed.n);
  const n2 = bkPack().n;
  if (n2 !== packed.n + 1)
    fails.push('the save number did not go up after a write: ' + packed.n + ' -> ' + n2);

  /* ---- the name it asks the native side for ------------------------- */
  const name = bkName();
  if (name.indexOf(id) < 0)
    fails.push('the file name does not carry the language id, so two languages ' +
               'called the same thing would write over each other');

  /* ---- the storage is reclaimed, the way iOS would do it ------------ */
  SLICES.forEach(k => localStorage.removeItem(langKey(k)));
  delete LANGS[id];
  langStore(); langRead(); ltRead();
  const wiped = { words: WORDS.length, letters: LETTERS.length, known: !!LANGS[id] };
  if (wiped.words || wiped.letters || wiped.known)
    fails.push('the wipe did not wipe, so nothing below this is a test of anything');

  /* ---- and comes back ---------------------------------------------- */
  bkNoSet(0);
  bkTake(file);
  langStore(); langRead(); ltRead(); noteRead(); stRead(); sndRead(); kbRead(); wldRead();
  const back = { words: WORDS.length, letters: LETTERS.length, known: !!LANGS[id] };
  /* Asked of kbStored() rather than of a field, and the field is the point:
     what was written into the file above is the shape the keyboard had when a
     language held exactly one -- `{lay:[...]}` -- and it holds three now. So
     this is two claims in one line. The keyboard comes back, AND a file
     written before a language could hold three restores into one of the
     three rather than into nothing.

     kbOf() would be the wrong thing to ask: on the free plan it answers with
     kbFixed(), which is built from the letters and always has rows, so it
     would come back true over a language that restored no keyboard at all.
     kbBoards() would be wrong the other way: it is what the SCREEN shows, so
     it puts the free QWERTY in front and answers nothing at all on the free
     plan. What came out of the file is what was built, which is kbStored(). */
  if (!(kbStored().length && kbStored()[0].lay && kbStored()[0].lay.length))
    fails.push('the keyboard did not come back. It is built in the app and it ' +
               'is the language\'s; a backup without it is a backup of most of ' +
               'somebody\'s language.');
  /* And the shape it has NOW, which is the other half: three keyboards and
     which one of them is applied. The applied one is not the first, because
     an index that came back as 0 whatever it was would pass a check that
     asked for a number and be the wrong keyboard on somebody's phone. */
  KB = { kbs: [{ nm: '', pat: 'qwerty', lay: [{ rows: [[{ k: 'lt', v: 'a' }]] }] },
               { nm: '', pat: 'flick',  lay: [{ rows: [[{ k: 'lt', v: 'b' }]] }] },
               { nm: '', pat: 'tap',    lay: [{ rows: [[{ k: 'lt', v: 'c' }]] }] }],
         at: 2 };
  saveKb();
  const three = JSON.stringify(bkPack());
  KB = null; saveKb();
  bkNoSet(0); bkTake(three); kbRead();
  if (kbStored().length !== 3)
    fails.push('three keyboards went into the file and ' + kbStored().length +
               ' came back');
  else if ((KB.at || 0) !== 2)
    fails.push('the keyboards came back but the applied one did not: ' +
               (KB.at || 0) + ' rather than 2, which is a different keyboard ' +
               'on the phone from the one that was there');

  if (world().use !== 'story' || world().where !== 'a valley')
    fails.push('what the language is for did not come back');
  if (bkNo() < packed.n)
    fails.push('a restore left the save number behind the file it restored from (' +
               bkNo() + ' < ' + packed.n + '), so the next save would look older ' +
               'than the copy it came from');
  if (back.words !== before.words)
    fails.push('words did not come back: ' + before.words + ' -> ' + back.words);
  if (back.letters !== before.letters)
    fails.push('letters did not come back: ' + before.letters + ' -> ' + back.letters);
  if (!back.known)
    fails.push('the language came back but the index does not know it exists');

  /* ---- and does not win against what is already there --------------- */
  WORDS = [{ hw: 'ONLYCOPY', mn: 'the good one', mns: ['the good one'], pos: 'n', at: 1 }];
  save();
  const put = bkTake(file);          /* the older file, with all of them in it */
  langRead();
  if (put !== 0)
    fails.push('a restore put ' + put + ' things back over a language that was ' +
               'already there. It must only fill in what is missing.');
  if (WORDS.length !== 1 || WORDS[0].hw !== 'ONLYCOPY')
    fails.push('a restore OVERWROTE a live language. This is the way a backup ' +
               'destroys somebody’s work, and it is the one thing it may not do.');

  /* ---- a dictionary the free plan does not LIST is still all there ----
     A language built on a paid plan and brought back down to free shows the
     first hundred words and no more. That is one list on one screen, and the
     thing it must never become is a language that gets backed up short --
     which is exactly what would happen the day somebody writes bkPack() out
     of what is on screen instead of out of what is stored, and it would look
     perfectly correct on every phone whose owner is paying.

     So: the free plan, five hundred words, and then all three questions.
     What the list shows, what a lookup finds, and what goes in the file. */
  const keepW = WORDS, keepPlan = SET.plan;
  SET.plan = 'free';
  WORDS = keepW.concat(Array.apply(null, { length: 500 })
                            .map((_, i) => ({ hw: 'zz' + i, mns: ['filler'],
                                              pos: 'n', at: 1 })));
  save();
  const far = WORDS[WORDS.length - 1].hw;
  if (wordsSeen().length !== FREE_LIMIT)
    fails.push('the free plan lists ' + wordsSeen().length + ' words, not ' +
               FREE_LIMIT + ', so nothing below this is a test of anything');
  if (!findWord(far))
    fails.push('findWord() cannot find a word past the free ceiling. The app ' +
               'reads the whole dictionary for itself -- a post, a gloss, a ' +
               'spelling -- and only the LIST is short');
  const capped = JSON.parse(JSON.parse(JSON.stringify(bkPack())).slice.words);
  if (capped.length !== WORDS.length)
    fails.push('the backup of a free language past the ceiling carries ' +
               capped.length + ' words and the language has ' + WORDS.length +
               '. A plan decides what somebody may DO, and a dictionary that ' +
               'is merely not listed must go into the file whole');
  WORDS = keepW; SET.plan = keepPlan; save();

  return { fails, before, back, name, missing, no: packed.n,
           kb: +(file.length / 1024).toFixed(1) };
});

/* ---------------------------------------------------------------------------
   And the way back in, which is the half a person only ever meets on the
   worst day they have with this app. sharePlug() is stubbed so kept() can be
   made to answer with any set of generations; what runs is the real
   bkRestore, the real bkTakeGen and the real bkTake.
   --------------------------------------------------------------------------- */
const back = await pg.evaluate(async () => {
  const fails = [];
  let FILES = [];
  window.Capacitor = { nativePromise: (plug, method) =>
    method === 'kept' ? Promise.resolve({ langs: FILES }) : Promise.resolve({}) };

  ltStart(); saveLetters(); save();
  const good = JSON.stringify(bkPack());
  const id = langId;
  const words = WORDS.length, letters = LETTERS.length;
  const junk = '{"v":1,"id":"' + id + '","slice":{"words":"[[[';   /* will not parse */
  /* Parses, and is still not a language: JSON.parse is happy with a number
     and a reader handed one quietly produces an empty dictionary. */
  const shaped = JSON.stringify({ v: 1, n: 9, id: id, name: 'x',
                                  slice: { words: '7', letters: '[]' } });

  const wipe = () => { SLICES.forEach(k => localStorage.removeItem(langKey(k)));
                       delete LANGS[id]; langStore(); langRead(); ltRead(); };
  const now = () => ({ w: WORDS.length, l: LETTERS.length });
  const run = () => new Promise(r => bkRestore(r));

  /* 1. the newest file is wreckage; a spare is not */
  wipe(); FILES = [[junk, good]];
  await run(); langRead(); ltRead();
  if (now().w !== words || now().l !== letters)
    fails.push('the newest file was unreadable and the restore did not fall through to ' +
               'the spare beside it — which is what keeping spares is for');

  /* 1b. two of three gone */
  wipe(); FILES = [[junk, junk, good]];
  await run(); langRead(); ltRead();
  if (now().w !== words)
    fails.push('two unreadable generations stopped the restore reaching the third');

  /* 1c. readable, and still not a language */
  wipe(); FILES = [[shaped, good]];
  await run(); langRead(); ltRead();
  if (now().w !== words)
    fails.push('a file that parses but is not shaped like a language was taken as one; ' +
               'JSON.parse is not the question');

  /* 2. localStorage is PRESENT and is wreckage */
  wipe();
  localStorage.setItem(langKey('words'), '[[[not json');
  LANGS[id] = { name: 'x', mine: true }; langStore();
  FILES = [[good]];
  await run(); langRead(); ltRead();
  if (now().w !== words)
    fails.push('a slice holding unreadable text counted as "there", so a good file was ' +
               'ignored and the wreckage was kept');

  /* 3. and that wreckage must never reach the file */
  wipe();
  localStorage.setItem(langKey('words'), '[[[not json');
  let wrote = null;
  window.Capacitor = { nativePromise: (plug, method, arg) => {
    if (method === 'keep') { wrote = arg; }
    return Promise.resolve({ langs: [] });
  } };
  BK.dirty = true; bkPush();
  if (wrote !== null)
    fails.push('a language whose storage will not read back was written to the file, ' +
               'pushing the last good copy one generation down for nothing');

  /* 4. empty is NOT broken. A wipe, a switch and a new language all look like this. */
  SLICES.forEach(k => localStorage.removeItem(langKey(k)));
  localStorage.setItem(langKey('words'), '[]');
  localStorage.setItem(langKey('letters'), '[]');
  wrote = null; BK.dirty = true; bkPush();
  if (wrote === null)
    fails.push('an EMPTY language was refused. Empty is what a wipe, a language switch ' +
               'and a brand new language all look like — refusing it is the failure ' +
               'this whole design was built to avoid.');

  return { fails };
});

await br.close();
srv.close();

if (pageErrors.length){
  console.error('\nbackup: the app threw while this ran:\n');
  pageErrors.slice(0, 5).forEach(m => console.error('  ' + m));
  process.exit(1);
}
if (R.missing.length){
  console.error('\nbackup: ' + R.missing.length + ' slice' + (R.missing.length === 1 ? '' : 's') +
                ' the language has are not in the file:\n');
  R.missing.forEach(k => console.error('  ' + k));
  console.error('\nbkPack() walks SLICES in core.js. A slice added there and not\n' +
                'reaching the file is a slice that quietly stops being kept, and\n' +
                'nothing looks wrong until somebody needs it back.\n');
  process.exit(1);
}
const ALL = R.fails.concat(back.fails);
if (ALL.length){
  console.error('\nbackup: ' + ALL.length + ' thing' + (ALL.length === 1 ? '' : 's') +
                ' about keeping a language do not hold:\n');
  ALL.forEach(m => console.error('  ' + m));
  console.error('');
  process.exit(1);
}

console.log('backup: a language of ' + R.before.words + ' words and ' + R.before.letters +
            ' letters packs to ' + R.kb + ' KB in ' + R.before.slices + ' slices,');
console.log('        comes back whole from a storage wipe, refuses to overwrite a');
console.log('        language that is already there, and carries save number ' + R.no +
            ', which');
console.log('        goes up and never down.');
console.log('        A restore falls through unreadable generations to a good one,');
console.log('        prefers a good file to wreckage in storage, refuses to write');
console.log('        wreckage out, and writes an empty language without complaint.');
