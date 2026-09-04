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
pg.on('pageerror', e => pageErrors.push(e.message + '\n' + (e.stack||'')));
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

  /* ---- every slice has a declared shape ----------------------------- */
  /* BK_SHAPE is what bkSound() tells a slice from wreckage with, and SLICES is
     what a language IS. A slice in the second and not the first does not
     throw: bkSound() falls off the end of its own ladder with `want`
     undefined and answers 「not an array」, which happens to be what 'object'
     means -- so an object slice is right by accident and an ARRAY one would
     be called wreckage and cost a backup. `gram2` sat there for as long as it
     had been a slice. */
  SLICES.forEach(k => {
    if (!Object.prototype.hasOwnProperty.call(BK_SHAPE, k))
      fails.push('slice "' + k + '" is in SLICES and has no shape in BK_SHAPE ' +
                 '(www/backup.js). bkSound() then answers for it by falling ' +
                 'through rather than by being told, and the next one forgotten ' +
                 'will be an array');
  });

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
                   slices: Object.keys(packed.slice).length,
                   count: langCount(), done: SET.done, me: String(SESS.uid || '') };
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
  langStore(); langRead(); ltRead(); ntRead(); stRead(); sndRead(); kbRead(); wldRead();
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

  /* ---- and comes back as SOMEBODY'S -------------------------------- */
  /* The index knowing a language exists and a person having it are two
     different facts, and for four days only the first was held. A row with no
     `uid` belongs to NOBODY once the onboarding is over -- langOwned() answers
     `!SET.done` for one -- so a restored language sat in the index, in
     `lingua.<id>.*`, whole, with every word and every letter in it, and
     appeared in no list and in no count. Nothing threw. This is the file that
     is left when the server and this phone's storage are both gone, so it is
     the last place that may hand somebody's language to nobody.

     Asked three ways because they fail apart: the stamp itself, the question
     every list asks, and the number the ceiling is counted with. A stamp of
     the wrong account would pass the first two of those if they were asked
     loosely, which is why the first names the account rather than asking
     whether there is one. */
  if (!before.done)
    fails.push('this fixture has not finished the onboarding, so nothing below ' +
               'is a test of anything: an unstamped language is the walk\'s and ' +
               'langOwned() says yes to it');
  if (String((LANGS[id] || {}).uid || '') !== before.me)
    fails.push('the language came back without the account on it (' +
               String((LANGS[id] || {}).uid || '(none)') + ' rather than ' +
               before.me + '), so it belongs to nobody: it is in the index and ' +
               'in storage, whole, and in no list');
  if (!langOwned(id))
    fails.push('the language came back and langOwned() says it is not this ' +
               'account\'s, so no screen will show it');
  if (langCount() !== before.count)
    fails.push('languages counted ' + before.count + ' before the wipe and ' +
               langCount() + ' after the restore, so a restored language does ' +
               'not count against the ceiling and cannot be seen');

  /* ---- signed out, nothing is stamped ------------------------------- */
  /* The other half of the same three lines, and it is not decoration: an
     empty string written into `uid` is a FOURTH kind of owner -- not the
     account, not the walk's -- and langOwned() would compare it against a
     real one and answer no for good. Signed out there is no account to name,
     so the row is made exactly as it always was and the door is where it gets
     one. langFirst() in www/core.js stamps nothing for the same reason.

     A different id, because the language above is in the index now and a
     restore that finds one there does not touch it. */
  const outPack = JSON.parse(file);
  outPack.id = id + 'OUT';
  const wasSess = SESS;
  SESS = null;
  bkTake(JSON.stringify(outPack));
  SESS = wasSess;
  if (!LANGS[outPack.id])
    fails.push('signed out, the file did not come back at all. A backup is not ' +
               'a paid feature and it is not an account feature either');
  else if ('uid' in LANGS[outPack.id])
    fails.push('signed out, the restored language was stamped ' +
               JSON.stringify(LANGS[outPack.id].uid) + '. There is no account to ' +
               'name, and an empty owner is a fourth kind of owner rather than none');
  delete LANGS[outPack.id];
  SLICES.forEach(k => localStorage.removeItem(langKeyOf(outPack.id, k)));
  langStore();
  langId = id; langStore(); langRead(); ltRead();

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

  /* ---- and the same sentence for keyboards, which is the one a third plan
     is about to write ------------------------------------------------------
     The words half above holds a language built on a paid plan and brought
     back down: the LIST is short, the lookup still finds, and the file goes
     out whole. Nothing said the same about keyboards, and a plan that allows
     ONE of them -- 「文字+キーボード自由（1個）」 -- is the moment somebody
     writes the ceiling into the wrong place.

     There are three wrong places and only the first is visible:

       kbOf()      SHOULD go short. On a plan with no keyboard of your own it
                   answers kbFixed(), and that is the plan working.
       kbStored()  must NOT. It is what is on the disk, and a plan decides
                   what somebody may DO.
       bkPack()    must NOT. A keyboard that is merely not offered has to go
                   into the file whole, or the backup is short for exactly
                   the people who paid and then stopped.

     Same shape as the dictionary, and the same reason: it would look
     perfectly correct on every phone whose owner is still paying. */
  const keepKB = KB, keepPlan2 = SET.plan;
  SET.plan = 'pro';
  KB = { kbs: [{ nm: 'one',   pat: 'qwerty', lay: [{ rows: [[{ k: 'lt', v: 'a' }]] }] },
               { nm: 'two',   pat: 'flick',  lay: [{ rows: [[{ k: 'lt', v: 'b' }]] }] },
               { nm: 'three', pat: 'tap',    lay: [{ rows: [[{ k: 'lt', v: 'c' }]] }] }],
         at: 2 };
  saveKb();
  SET.plan = 'free'; save();
  if (kbStored().length !== 3)
    fails.push('a language with three keyboards dropped to a plan that offers ' +
               'none, and the disk now holds ' + kbStored().length + '. A plan ' +
               'decides what somebody may DO and nothing about what exists.');
  const packedKb = JSON.parse(JSON.parse(JSON.stringify(bkPack())).slice.kb || 'null');
  const packedN = (packedKb && packedKb.kbs) ? packedKb.kbs.length : 0;
  if (packedN !== 3)
    fails.push('the backup of a language on a plan with no keyboard carries ' +
               packedN + ' of its three. A keyboard that is merely not offered ' +
               'has to go into the file whole -- otherwise the backup is short ' +
               'for exactly the people who paid and then stopped.');
  const shownRows = (kbOf() && kbOf().lay && kbOf().lay[0] && kbOf().lay[0].rows) || [];
  if (!shownRows.length)
    fails.push('the free plan shows no keyboard at all. It is supposed to show ' +
               'the fixed QWERTY -- going short on the SCREEN is the plan ' +
               'working; going short on the disk is the bug this is about.');
  KB = keepKB; saveKb(); SET.plan = keepPlan2; save();

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

  /* 4b. AND A LANGUAGE WITH NO KEYBOARD IS EMPTY RATHER THAN BROKEN, asked of
     what the APP WRITES rather than of keys taken out by hand.

     That difference is the whole of this case. The one above removes the slice
     keys itself, so it asks about a language nothing has ever saved -- and the
     app does not leave that slice absent, it SAVES it: saveKb() runs from
     langSaveAll() every time somebody leaves a language, and with no keyboard
     built it wrote the four characters `null`, which parses and is not an
     object, so bkSound() called the language wreckage and bkPush() refused the
     file from then on.

     Every free language is this one. Free reads kbFixed() -- a QWERTY built
     out of LETTERS on the way to the screen -- and stores no keyboard of its
     own, so on the free plan there is nothing else this can be.
     「無料の分も全部入らないとダメでしょ」 OWNER 2026-09-04. */
  KB = null; saveKb();
  wrote = null; BK.dirty = true; bkPush();
  if (wrote === null)
    fails.push('a language with NO KEYBOARD was refused the file (' + BK.how + '). ' +
               'Every free language is this one, so nothing anybody makes on the free ' +
               'plan reaches a backup after the first time they leave the language. ' +
               '「無料の分も全部入らないとダメでしょ」 OWNER 2026-09-04');

  /* and again. Written once and refused ever after is the same fault arriving
     a day later, which is exactly how this one was going to be found. */
  KB = null; saveKb();
  wrote = null; BK.dirty = true; bkPush();
  if (wrote === null)
    fails.push('a language with no keyboard was written once and refused on the next ' +
               'save (' + BK.how + '). A backup that stops is a backup that is not one.');

  /* ---- the two copies of one language, put together --------------------
     A language belongs to the account now, so it exists twice: on the phone,
     where it is made, and on the server, where it is kept. Putting them back
     together is the same rule as a restore one step further out, and it is
     the same danger: the way a copy destroys somebody's work is by WINNING.

     syMerge() in www/sync.js is what decides, and every line below is a
     shape somebody would lose an afternoon to. No server is stood up: what
     is under test is what a slice IS, which is a string on both sides. */
  const J = (x) => JSON.stringify(x);
  const M = (kind, mine, theirs) => JSON.parse(syMerge(kind, J(mine), J(theirs)) || 'null');
  const hws = (a) => (a || []).map((w) => w.hw).join(',');

  /* The case the owner named: a word added here, a word added there.
     「そりゃあ両方足すだろ」 Both, and the phone's own order first. */
  const both = M('words', [{ hw: 'kano' }, { hw: 'yama' }],
                          [{ hw: 'kano' }, { hw: 'kawa' }]);
  if (hws(both) !== 'kano,yama,kawa')
    fails.push('a word added on this phone and a word added on another came back as ' +
               J(hws(both)) + '. Both are added, and neither is anybody\u2019s to drop');

  /* The same word on both sides is one word, not two. */
  if (M('words', [{ hw: 'kano', mn: 'mountain' }], [{ hw: 'kano', mn: 'hill' }]).length !== 1)
    fails.push('one word written on two phones came back as two words. The headword ' +
               'is what a word IS here');

  /* A letter is its id and not its shape: draw over a letter on one phone and
     it is still that letter, not a second one under the same name. */
  const lts = M('letters', [{ id: 'lA', st: [1] }], [{ id: 'lA', st: [2] }, { id: 'lB' }]);
  if (lts.length !== 2 || lts[0].id !== 'lA' || J(lts[0].st) !== J([1]))
    fails.push('redrawing a letter on this phone and adding one on another came back ' +
               'as ' + J(lts) + '. Two letters, and the redrawn one is this phone\u2019s');

  /* A slice with no id of its own -- a note, a line -- is its own name. Two
     different notes are two notes; the same note twice is one. */
  if (M('notes', [{ t: 'a' }], [{ t: 'b' }]).length !== 2)
    fails.push('two different notes came back as one, so one of them is gone');
  if (M('notes', [{ t: 'a' }], [{ t: 'a' }]).length !== 1)
    fails.push('the same note on both phones came back as two');

  /* Nested, which is what SCRIPT and STG are. A merge that stopped at the top
     level would take one phone's whole drawn script over the other's -- and
     it would look perfectly right, because what came back IS a script. */
  const sc = M('script', { g: { a: [[1]] }, extra: ['x'] },
                          { g: { b: [[2]] }, extra: ['y'] });
  if (!sc.g.a || !sc.g.b)
    fails.push('a letter drawn on this phone and a letter drawn on another came back ' +
               'as ' + J(sc.g) + '. The drawn script is nested and has to be gone into');
  if (J(sc.extra) !== J(['x', 'y']))
    fails.push('the letters nobody has used yet came back as ' + J(sc.extra) +
               ' rather than both');
  /* And where the two disagree about the same thing, the phone keeps its own:
     this is called with what came off the SERVER as `theirs`, and a language
     is edited on a phone. */
  const st = M('phases', { done: { sound: true }, set: { x: 1 } },
                         { done: { sound: false, word: true }, set: { x: 2 } });
  if (st.done.sound !== true || st.set.x !== 1)
    fails.push('where the two copies disagree the phone did not keep its own: ' + J(st));
  if (st.done.word !== true)
    fails.push('a stage finished on the other phone was dropped');

  /* Nothing on one side is not a merge, and this is the case that actually
     happens: a new phone, a reinstall, storage reclaimed. */
  if (syMerge('words', '', J([{ hw: 'kano' }])) !== J([{ hw: 'kano' }]))
    fails.push('a phone with nothing on it did not take the copy from the server, ' +
               'which is what a reinstall is');
  if (syMerge('words', J([{ hw: 'kano' }]), '') !== J([{ hw: 'kano' }]))
    fails.push('a language that has never been up was emptied by a server that has ' +
               'never heard of it');
  /* And wreckage is not a smaller language. Neither side is parseable here,
     so nothing may be decided and the phone's own stands. */
  if (syMerge('words', 'not json', J([{ hw: 'kano' }])) !== 'not json')
    fails.push('a slice that will not read back was replaced by the server\u2019s. ' +
               '"Empty" and "broken" are different states');
  /* The name of a language is the one slice that is not JSON at all. */
  if (syMerge('lang', 'Vaska', 'Shango') !== 'Vaska')
    fails.push('the language was renamed by the other phone without being asked');

  return { fails };
});

/* ---------------------------------------------------------------------------
   And the one act that is meant to destroy: the account going.

   「アカウント削除で残るものねえって言ってんだろ何回言わせんだよ全部消えんだよ。」
   OWNER 2026-08-27.

   Four claims, and the last two are the ones that cannot be undone if they
   are wrong. What is asked is IS THERE / IS THERE NOT and never how many:
   a count is a number that changes the day somebody adds a key, and this
   check exists precisely because keys get added.
   --------------------------------------------------------------------------- */
const gone = await pg.evaluate(async () => {
  const fails = [];
  const keys = () => {
    const out = [];
    for (let i = 0; i < localStorage.length; i++) out.push(localStorage.key(i));
    return out;
  };
  const ours = () => keys().filter(k => k && k.indexOf('lingua.') === 0);

  /* Somebody's phone, with everything on it that has ever been reported as
     surviving a wipe. Written through the app's own savers, not poked into
     localStorage, so a saver that files something somewhere else is caught. */
  ME = { name: 'Ola', handle: 'ola', bio: 'hi', pic: '', link: '', loc: '', avSent: '' };
  saveMe();
  DRAFTS = [{ at: 1, ln: 'kano mos', mn: 'a tall hill', to: '', pr: 0, pics: [], vo: null, pv: false }];
  draftsSave();
  POSTS = [{ id: 'p1', ln: 'kano', at: 1 }];
  savePosts();
  /* A flat key from before a language had an id. The app does not read these
     any more -- 「今の状態の話平キーなんかいらない」 OWNER 2026-09-03 -- and
     deleting the account must not erase it either. See below. */
  localStorage.setItem('lingua.words', '[{"hw":"old"}]');
  SET.theme = 'dark'; SET.ui = 'ja'; save();

  /* A neighbour in the same storage. NOT ours: no dot after the name, and a
     name that merely starts with the same letters. If a wipe takes either of
     these it has taken somebody else's data, which is the one mistake here
     that cannot be corrected. */
  localStorage.setItem('lingua', 'not ours');
  localStorage.setItem('linguaphone.x', 'not ours either');

  const hadDrafts = DRAFTS.length;

  /* 1. one account's keys, asked of the function that does it.

        It was lsWipeNS(), which took every key beginning `lingua.` whoever
        was holding the phone -- and that is the call that destroyed the
        owner's language on 2026-09-03 when a second account was deleted. It
        is gone. lsWipeAcct(uid) is the only one left, and what it takes is
        the languages carrying that account's stamp plus that account's own
        me/posts/drafts. */
  LANGS = { 'Lmine':  { name: 'mine',   mine: true, uid: 'u' },
            'Ltheirs':{ name: 'theirs', mine: true, uid: 'other' } };
  langStore();
  try {
    localStorage.setItem(langKeyOf('Lmine', 'words'), '[{"hw":"a"}]');
    localStorage.setItem(langKeyOf('Ltheirs', 'words'), '[{"hw":"b"}]');
  } catch (e) {}
  lsWipeAcct('u');
  if (localStorage.getItem(langKeyOf('Lmine', 'words')))
    fails.push('lsWipeAcct() left this account\u2019s language behind');
  if (!localStorage.getItem(langKeyOf('Ltheirs', 'words')))
    fails.push('lsWipeAcct() took ANOTHER account\u2019s language ' +
               '\u2014 that is the 2026-09-03 fault');

  /* 3. and it did not reach past the dot. Asked here because the wipe has
        just run; this is the same act as 1 seen from the other side. */
  if (localStorage.getItem('lingua') !== 'not ours' ||
      localStorage.getItem('linguaphone.x') !== 'not ours either')
    fails.push('the wipe took a key that is not this app\u2019s. `lingua.` is the ' +
               'prefix and the dot is part of it');

  return { fails, hadDrafts };
});

/* The whole button, not the function underneath it: wipeAll() asks, tells the
   server, empties the phone and drops the files, and a claim about
   lsWipeAcct() alone would be green with any of those four unwired. The one question there
   is gets its yes pressed -- the app's own popup, not confirm(), which went on
   2026-09-01 (「標準は使わねえって言ってるだろこれも禁止や」). Nothing is
   stubbed: pressing the popup is pressing the screen. */
/* SEEDED AGAIN FIRST, and that is not tidiness. The block above empties the
   account's keys with lsWipeAcct() and leaves this page signed out, with a
   language whose index row is gone and whose slices are not. Pressing the
   delete-account button in THAT state asks about an act nobody can perform:
   there is no account row on the settings screen when nobody is signed in.

   It used to pass anyway, because the button emptied the phone whoever was
   standing there. It does not any more -- 「アカウントごとってずっと言ってるよな？」
   OWNER 2026-09-03 -- so the state the button is pressed in has to be the
   state a person presses it in: signed in, holding their own language.

   A RELAUNCH and not seed() alone: the block above took `lingua.langs` with the
   rest, so the page is standing in a language that is in no index -- seed()
   stamps what is in LANGS and LANGS is empty. Reloading is what a phone does
   between one of these and the next anyway. */
await pg.goto(`http://127.0.0.1:${PORT}/`);
await pg.waitForTimeout(300);
await pg.evaluate(seed);
const wiped = await pg.evaluate(async () => {
  const fails = [];
  const ours = () => {
    const out = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.indexOf('lingua.') === 0) out.push(k);
    }
    return out;
  };
  /* THE ROAD WHERE THE SERVER SAYS YES, and it is the only one the bug is on.
     Left to the real network these calls fail, netEndMe() takes its `bad`
     arm, and the session is still in hand when the phone is emptied -- so a
     check that does not stub anything watches the one road that works and
     calls the button held.

     On the road that matters netEndMe() calls netOut() the instant the row is
     gone (the token is what proves who is being deleted, and it is spent),
     and only then calls back. Whoever reads SESS after that reads nobody. */
  const realGet = netGet, realSend = netSend;
  netGet = (path, ok) => ok([]);
  netSend = (method, path, body, tok, ok) => ok({});

  let dropped = '', droppedNames = null;
  window.Capacitor = { nativePromise: (plug, method, arg) => {
    if (method === 'dropAll' || method === 'dropSome') {
      dropped = method;
      droppedNames = (arg && arg.names) || null;
    }
    if (method === 'kept') return Promise.resolve({ langs: [] });
    return Promise.resolve({});
  } };

  const old = langId;
  /* Both sides of the sentence, put there on purpose. The three above the
     line are this ACCOUNT's and have to go with it; the two below are how
     this HANDSET is set up and have to still be here afterwards. Blank ones
     would let either half pass by accident. */
  SET.plan = 'pro'; SET.saved = ['mountain']; SET.notAt = 99;
  SET.theme = 'dark'; SET.ui = 'ja';
  setKeep();
  ME = { name: 'Ola', handle: 'ola', bio: 'hi', pic: '', link: '', loc: '', avSent: '' };
  saveMe();
  DRAFTS = [{ at: 1, ln: 'kano mos', mn: '', to: '', pr: 0, pics: [], vo: null, pv: false }];
  draftsSave();
  WORDS = [{ hw: 'kano', mn: 'hill' }]; save();

  /* Signed in is the road a real phone takes, and it is not synchronous:
     wipeAll() tells the server FIRST and empties the phone whatever it
     answers, so wipeHere() runs in a callback. Poll rather than guess at a
     delay -- a fixed wait that is one tick short is a check that passes on a
     fast machine and fails on a slow one. */
  wipeAll();
  if (typeof popOn === 'function' && popOn()) popYes();
  else fails.push('wipeAll() put no popup up. 「全部消えんだよ」 is one question, ' +
                  'and it is asked with the app\u2019s own popup');
  for (let i = 0; i < 200 && localStorage.getItem('lingua.me'); i++) {
    await new Promise(r => setTimeout(r, 10));
  }
  if (localStorage.getItem('lingua.me'))
    fails.push('wipeAll() never reached wipeHere() within two seconds. ' +
               'netDropMe() calls it on both roads -- see www/net.js');

  /* Nothing of the person's is readable, and nothing of the OLD language's is
     filed anywhere. A fresh language exists again -- that is what a first run
     is and it is not somebody's data -- so the question is the old id, never
     "is the namespace empty" after the app has drawn itself again. */
  if (ours().some(k => k.indexOf('lingua.' + old + '.') === 0))
    fails.push('a slice of the language that was here is still filed after wipeAll()');
  if (DRAFTS.length) fails.push('the drafts are still in the app after wipeAll()');
  if (ME.name || ME.handle || ME.bio)
    fails.push('the app still knows the person\u2019s name after wipeAll()');
  if (POSTS.length) fails.push('the posts are still in the app after wipeAll()');
  if (localStorage.getItem('lingua.drafts'))
    fails.push('`lingua.drafts` was written back out after wipeAll()');
  if (localStorage.getItem('lingua.me'))
    fails.push('`lingua.me` was written back out after wipeAll()');
  /* AND THE FLAT KEY IS STILL THERE, which is the opposite of what this asked
     until 2026-09-03 and is the same decision read the right way round.
     `langMigrate()` used to copy those eight into a language, so a copy left
     behind after a wipe was a live second dictionary answering to nobody --
     the next person to sign in on this phone would have been handed the first
     person's words. That road is DELETED now, so the danger is gone with it:
     nothing reads `lingua.words`, and an unread key is not somebody's
     belongings for lsWipeAcct() to take.

     What is left is docs/DATA_SAFETY.md's plain rule. The owner said those
     keys are not WANTED; they did not say to erase them, and this app does
     not delete what it merely stopped reading. A phone that has them keeps
     them. tools/migrate-check.mjs § 8 holds the same sentence on the launch
     road; this holds it on the account-deletion road, which is the one place
     that erases on purpose and so the one place it could be got wrong. */
  if (!localStorage.getItem('lingua.words'))
    fails.push('deleting the account ERASED a flat key. The app stopped reading ' +
      'those eight; it does not delete them (docs/DATA_SAFETY.md, and the ' +
      'decision of 2026-09-03 is a road being removed, not data)');
  /* THE ACCOUNT'S FIELDS GO AND THE HANDSET'S SETUP STAYS, and that replaced
     「残るものねえ」 -- read on 2026-08-27 about a phone that held one account,
     when there was no other reading of it. There is now, and it is the only
     one: 「端末ごとにやることなんてねえよ」「アカウントごとってずっと言ってる
     よな？」 OWNER 2026-09-03, after deleting a second account emptied the
     whole namespace and took the owner's only copy of a language with it.

     So the plan, the searches they starred and how far down their notices
     they had read are gone with the account -- setFor() in www/core.js is
     that list and the one place it is written -- and the theme and the
     interface language are how this handset is set up rather than anybody's
     belongings, so they are still here. Asking for them to be blanked is
     asking the app to reset a phone because somebody left it. */
  if (SET.plan !== 'free' || SET.saved !== undefined || SET.notAt !== undefined)
    fails.push('a field of the account\u2019s settings survived the account: ' +
               JSON.stringify([SET.plan, SET.saved, SET.notAt]));
  if (SET.theme !== 'dark' || SET.ui !== 'ja')
    fails.push('the handset\u2019s own setup was wiped with the account ' +
               '(theme ' + SET.theme + ', ui ' + JSON.stringify(SET.ui) + '). ' +
               'The theme and the interface language are how this phone is ' +
               'set up, not the belongings of whoever just left it');

  /* 2. the files in Documents, which are the copies that outlive the app.
        The stub records the call rather than the deletion -- there is no
        Swift on a Linux runner -- so what is held here is that the button
        asks for all three folders and not for the backups alone. */
  /* 2. the files in Documents, which are the copies that outlive the app.
        The stub records the call rather than the deletion -- there is no
        Swift on a Linux runner -- so what is held here is WHICH call and
        WHICH names.

        dropSome and not dropAll, and that is 2026-09-03. dropAll emptied the
        whole directory, which is every account's backups and not this one's
        -- the road that destroyed the owner's language. The names are the
        languages that were just taken, asked for one by one. */
  if (dropped !== 'dropSome')
    fails.push('wipeAll() asked the native side for `' + (dropped || 'nothing') +
               '`. It has to be dropSome: dropAll empties Documents, which is ' +
               'every account\u2019s backups and not the one going ' +
               '(2026-09-03 -- 「別アカウントでログインしてそれのアカウント削除' +
               'したら、俺の元のアカウントが消えてんだよ」)');
  else if (!droppedNames || !droppedNames.length)
    fails.push('wipeAll() asked for dropSome with no names, which drops ' +
               'nothing at all — the backup of the language that just went is ' +
               'still in Documents');

  netGet = realGet; netSend = realSend;
  return { fails };
});

/* And the other direction, which is the one that cannot be undone: an
   ORDINARY save must not take a draft. Every failure of a delete is somebody
   pressing a button; a failure here is the app losing work nobody asked it to
   touch. Two saves in a row and a relaunch, per docs/DATA_SAFETY.md. */
const kept2 = await pg.evaluate(async () => {
  const fails = [];
  DRAFTS = [{ at: 1, ln: 'one', mn: '', to: '', pr: 0, pics: [], vo: null, pv: false },
            { at: 2, ln: 'two', mn: '', to: '', pr: 0, pics: [], vo: null, pv: false }];
  draftsSave();
  WORDS = [{ hw: 'kano', mn: 'hill' }];
  save(); save();                        /* a normal save, and two in a row */
  saveLetters(); saveNotes(); saveStg(); saveSnd();
  draftsRead();
  if (DRAFTS.length !== 2)
    fails.push('an ordinary save lost a draft: 2 saved, ' + DRAFTS.length + ' back');
  /* a relaunch: the globals thrown away and read off storage again */
  DRAFTS = [];
  draftsRead();
  if (DRAFTS.length !== 2 || DRAFTS[0].ln !== 'one' || DRAFTS[1].ln !== 'two')
    fails.push('the drafts did not come back as they were after a relaunch');
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
const ALL = R.fails.concat(back.fails, gone.fails, wiped.fails, kept2.fails);
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
console.log('        Every slice of SLICES has a declared shape in BK_SHAPE.');
console.log('        Deleting the account leaves nothing of THAT account\u2019s and nothing');
console.log('        of anybody else\u2019s touched, and an ordinary save never takes a draft.');
console.log('        A restore falls through unreadable generations to a good one,');
console.log('        prefers a good file to wreckage in storage, refuses to write');
console.log('        wreckage out, and writes an empty language without complaint.');
console.log('        Two copies of one language are put together rather than one');
console.log('        winning: a word added here and a word added there are both');
console.log('        added, a letter redrawn stays one letter, and a drawn script');
console.log('        is gone into rather than replaced whole.');
