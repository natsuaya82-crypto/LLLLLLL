/* ---------------------------------------------------------------------------
   tools/migrate-check.mjs — the language somebody already has still opens.

   Run it:   node tools/migrate-check.mjs

   Every other check in this repo opens the app in an empty browser, which is
   the one kind of phone that does not exist: nobody installs this and has
   nothing. The people who matter most have a language they have been building
   for months, stored the way the shipped version stored it — eight flat keys,
   lingua.words through lingua.talk.

   Storage moved under a language id so that one person can hold their own
   language and read other people's. That move runs exactly once, on a phone,
   against the only copy. No browser run and no CI runner would show it going
   wrong, because a fresh profile has nothing to move: the check would pass on
   a migration that silently dropped every letter somebody had drawn.

   So this seeds the old keys first, then loads the app, and asks what came
   through.

   What it checks
     1. an old install     all eight slices arrive in the globals the screens
                           read, the person's settings survive, and the new
                           index lists one language, theirs
     2. the old keys stay  the migration copies. It never removes what it read,
                           because a few hundred kilobytes is nothing next to
                           the one copy of something somebody spent months on
     3. running it twice   a second load migrates nothing further and does not
                           make a second language. This is what happens every
                           time they open the app after the update
     4. a fresh install    nothing to migrate, so one empty language of their
                           own, not zero and not a broken half-language
     5. switching          opening a second language puts the first one away
                           and brings the second one out -- all of it, and
                           nothing of the first. This is the one that can lose
                           somebody's dictionary rather than fail to show it:
                           write A's words while B is open and they are B's
                           words now, under B's key, and A's copy is gone the
                           next time A is saved. Nothing on screen would look
                           wrong at any point

   Exit code is 0 only when all four hold.
   --------------------------------------------------------------------------- */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const req = createRequire(import.meta.url);
function loadChromium(){
  try { return req('playwright').chromium; } catch (e) {}
  try {
    const g = execSync('npm root -g', { encoding: 'utf8' }).trim();
    return req(path.join(g, 'playwright')).chromium;
  } catch (e) {}
  console.error('playwright is not installed. npm i -g playwright');
  process.exit(2);
}
const chromium = loadChromium();

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WWW = path.join(HERE, '..', 'www');
const PORT = 8123;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';

const srv = http.createServer((q, r) => {
  const f = path.join(WWW, q.url === '/' ? 'index.html' : q.url.split('?')[0]);
  let body;
  try { body = fs.readFileSync(f); } catch (e) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain',
                     'Cache-Control': 'no-store' });
  r.end(body);
}).listen(PORT);

/* Exactly what a shipped version wrote: eight flat keys, no id anywhere. */
const OLD = {
  'lingua.words':   JSON.stringify([{ hw: 'tuf', gl: 'hello' }, { hw: 'ark', gl: 'fish' }]),
  'lingua.lang':    'Vaska',
  'lingua.lines':   JSON.stringify([{ a: 'tuf ark' }]),
  'lingua.letters': JSON.stringify([{ id: 'lA', sym: 't' }, { id: 'lB', sym: 'u' },
                                    { id: 'lC', sym: 'f' }]),
  'lingua.notes':   JSON.stringify([{ t: 'a note' }]),
  'lingua.phases':  JSON.stringify({ done: { sound: true }, notes: {}, set: {}, extra: [] }),
  'lingua.talk':    JSON.stringify([{ q: 'hi' }]),
  'lingua.script':  JSON.stringify({ g: { t: [[1, 2]] }, extra: [] }),
  'lingua.set':     JSON.stringify({ theme: 'dark', plan: 'free', done: true,
                                     snd: ['k', 't', 'a'] })
};

/* Everything a screen would read, plus what the storage layer thinks it did.
   These report what a thing IS, not how many of them there are. A count is
   reproducible by accident -- the first version of this fixture stored one
   letter and one drawn glyph, the app rebuilds letters it cannot find from
   the glyphs, and "1 letter" came out true whether the letters had been
   migrated or silently reconstructed. An id cannot be arrived at twice. */
const REPORT = () => ({
  words: WORDS.length, word0: WORDS[0] && WORDS[0].hw, gloss0: WORDS[0] && WORDS[0].gl,
  name: langName, lines: LINES.length, line0: LINES[0] && LINES[0].a,
  letters: LETTERS.length, letterIds: LETTERS.map(function(x){ return x.id; }).join(','),
  /* Which of the free plan's twenty-eight slots nothing answers to. Empty is
     the answer on every language a free phone can be holding. */
  gaps: LT_START.split('').filter(function(c){
          return !LETTERS.filter(function(l){
            return String(ltName(l)||'').toLowerCase() === c; }).length;
        }).join(''),
  notes: NOTES.length, note0: NOTES[0] && NOTES[0].t,
  talk: TALK.length, talk0: TALK[0] && TALK[0].q, sound: !!STG.done.sound,
  snd: addedSnd().join(','), sndInSet: SET.snd === undefined,
  sndFiled: localStorage.getItem('lingua.' + langId + '.snd') !== null,
  script: Object.keys(SCRIPT.g).join(','),
  theme: SET.theme, done: SET.done, plan: SET.plan,
  langs: Object.keys(LANGS).length, id: langId,
  mine: !!(LANGS[langId] && LANGS[langId].mine),
  indexName: LANGS[langId] && LANGS[langId].name,
  cur: localStorage.getItem('lingua.cur'),
  oldKept: localStorage.getItem('lingua.words') !== null,
  filed: localStorage.getItem('lingua.' + langId + '.words') !== null
});

const fails = [];
const addedSndLen = (s) => (s ? s.split(',').length : 0);
const want = (label, got, expected) => {
  if (got !== expected) fails.push(`${label}: got ${JSON.stringify(got)}, wanted ${JSON.stringify(expected)}`);
};
/* All of these, still in this order, in a list that may be longer.

   The alphabet is no longer only what somebody made: on the free plan
   ltStart fills it out to a-z and the two marks, so a language that arrives
   with three letters is holding thirty-one a moment later. What has to hold
   is that not one of the three was dropped, reordered or renumbered on the
   way -- which is what a subsequence says, and what a whole-list comparison
   can only say by also forbidding the twenty-eight. */
const keeps = (label, got, expected) => {
  const g = String(got || '').split(',').filter(Boolean);
  const e = String(expected || '').split(',').filter(Boolean);
  let i = 0;
  for (const x of g) if (x === e[i]) i++;
  if (i !== e.length)
    fails.push(`${label}: got ${JSON.stringify(got)}, wanted all of ${JSON.stringify(expected)}, in order`);
};
/* And the other direction, which is the only thing the empty list was ever
   saying: none of these, in a list that is allowed to hold other things. */
const lacks = (label, got, unwanted) => {
  const g = String(got || '').split(',').filter(Boolean);
  const bad = String(unwanted || '').split(',').filter(Boolean).filter((x) => g.indexOf(x) >= 0);
  if (bad.length)
    fails.push(`${label}: got ${JSON.stringify(got)}, which still has ${bad.join(',')}`);
};

const br = await chromium.launch(fs.existsSync(CHROME) ? { executablePath: CHROME } : {});
const pg = await br.newPage();
await pg.goto(`http://localhost:${PORT}/`);

/* ---- 1 and 2: an old install ------------------------------------------- */
await pg.evaluate((old) => {
  localStorage.clear();
  Object.keys(old).forEach((k) => localStorage.setItem(k, old[k]));
}, OLD);
await pg.reload();
const a = await pg.evaluate(REPORT);

want('words carried over', a.words, 2);
want('and they are the words that were there', a.word0, 'tuf');
want('with their meanings', a.gloss0, 'hello');
want('the language kept its name', a.name, 'Vaska');
want('lines carried over', a.lines, 1);
want('and it is the line that was there', a.line0, 'tuf ark');
keeps('the letters that were drawn carried over, not ones rebuilt from the glyphs',
      a.letterIds, 'lA,lB,lC');
/* And the free plan's twenty-eight slots were filled in around them rather
   than instead of them. */
want('and the alphabet was filled out around them', a.gaps, '');
want('notes carried over', a.notes, 1);
want('and it is what they wrote', a.note0, 'a note');
want('talk carried over', a.talk, 1);
want('and it is what was said', a.talk0, 'hi');
want('the stage they had finished is still finished', a.sound, true);
want('the drawn script carried over', a.script, 't');
want('their theme survived', a.theme, 'dark');
want('their onboarding is still done', a.done, true);
want('their plan survived', a.plan, 'free');
/* The sounds were the person's, in lingua.set, and are the language's now.
   They arrive, they are filed under the language, and nothing reads them off
   the settings any more. */
want('their sounds carried over', a.snd, 'k,t,a');
want('and are filed under the language', a.sndFiled, true);
want('and are off the settings', a.sndInSet, true);
want('one language is listed', a.langs, 1);
want('and it is theirs', a.mine, true);
want('the index knows what it is called', a.indexName, 'Vaska');
want('it is filed under its id', a.filed, true);
want('the old keys were left alone', a.oldKept, true);

/* ---- 3: the same phone, opened again ------------------------------------ */
await pg.reload();
const b = await pg.evaluate(REPORT);
want('still one language on the second load', b.langs, 1);
want('still the same language', b.id, a.id);
want('still their words', b.words, 2);
keeps('still their letters', b.letterIds, 'lA,lB,lC');
want('still their name', b.name, 'Vaska');
want('still their sounds', b.snd, 'k,t,a');

/* ---- 4: a phone that never had this app --------------------------------- */
await pg.evaluate(() => localStorage.clear());
await pg.reload();
const c = await pg.evaluate(REPORT);
want('a fresh install gets one language', c.langs, 1);
want('and it is theirs to write in', c.mine, true);
want('with nothing in it', c.words, 0);
/* not nothing at all: a language with no sounds is one where every letter
   drawn in it reads nothing, so a fresh one is given a set to start from */
want('and sounds to start from', addedSndLen(c.snd) > 0, true);
want('and it is the one that is open', c.id, await pg.evaluate(() => langId));

/* ---- 5: two languages, and the door between them ------------------------
   Built straight into storage rather than through the app, because the app
   has no way to make a second language yet and this is what it will have to
   survive when it does. A is somebody's real language; B is the empty one
   they just started, which is the case that matters -- the emptiness has to
   arrive along with it, or A's words are still sitting in WORDS when B is
   saved. */
await pg.evaluate(() => {
  localStorage.clear();
  var A = 'LA', B = 'LB';
  localStorage.setItem('lingua.langs', JSON.stringify({
    LA: { name: 'Vaska', mine: true }, LB: { name: 'Toko', mine: false } }));
  localStorage.setItem('lingua.cur', A);
  localStorage.setItem('lingua.LA.words', JSON.stringify(
    [{ hw: 'tuf' }, { hw: 'ark' }, { hw: 'geb' }]));
  localStorage.setItem('lingua.LA.lang', 'Vaska');
  localStorage.setItem('lingua.LA.letters', JSON.stringify(
    [{ id: 'aA' }, { id: 'aB' }, { id: 'aC' }]));
  localStorage.setItem('lingua.LA.notes', JSON.stringify([{ t: 'A note' }]));
  localStorage.setItem('lingua.LA.talk', JSON.stringify([{ q: 'A talk' }]));
  localStorage.setItem('lingua.LA.phases', JSON.stringify(
    { done: { sound: true }, notes: {}, set: {}, extra: [] }));
  localStorage.setItem('lingua.LA.script', JSON.stringify({ g: { t: [[1, 2]] }, extra: [] }));
  localStorage.setItem('lingua.LA.snd', JSON.stringify(['t', 'u', 'f']));
  /* B has nothing at all: no keys, not empty ones. A language somebody has
     only just made. */
});
await pg.reload();

const A1 = await pg.evaluate(REPORT);
want('A opens as itself', A1.word0, 'tuf');
keeps('with its letters', A1.letterIds, 'aA,aB,aC');

/* over to B */
await pg.evaluate(() => langOpen('LB'));
const B1 = await pg.evaluate(REPORT);
want('B is open now', B1.id, 'LB');
want('and localStorage agrees', B1.cur, 'LB');
want('B has no words of A\'s', B1.words, 0);
lacks('nor A\'s letters', B1.letterIds, 'aA,aB,aC');
want('nor A\'s notes', B1.notes, 0);
want('nor A\'s conversation', B1.talk, 0);
want('nor how far A had got', B1.sound, false);
want('nor A\'s name', B1.name, '');
want('nor A\'s drawn script', B1.script, '');
/* B gets its own set rather than A's -- this is the one that would have been
   invisible: the sounds looked right because they were somebody's. */
want('nor A\'s sounds', B1.snd.indexOf('t,u,f'), -1);

/* saving B is what makes a leak permanent, so do it before going back */
await pg.evaluate(() => { save(); saveLetters(); saveNotes(); saveStg(); saveTalk(); });
const leaked = await pg.evaluate(() =>
  (localStorage.getItem('lingua.LB.words') || '').indexOf('tuf') >= 0);
want('and B did not save them under its own id', leaked, false);

/* and back */
await pg.evaluate(() => langOpen('LA'));
const A2 = await pg.evaluate(REPORT);
want('A is still A', A2.word0, 'tuf');
want('with all of its words', A2.words, 3);
keeps('and all of its letters', A2.letterIds, 'aA,aB,aC');
want('and its note', A2.note0, 'A note');
want('and its conversation', A2.talk0, 'A talk');
want('and the stage it had finished', A2.sound, true);
want('and its name', A2.name, 'Vaska');
want('and its drawn script', A2.script, 't');
want('and its sounds', A2.snd, 't,u,f');

await br.close();
srv.close();

if (fails.length) {
  console.error(`the language somebody already has did not survive (${fails.length}):\n`);
  fails.forEach((f) => console.error('  ' + f));
  console.error('\nThis runs once, on a phone, against the only copy. Nothing here is\n' +
                'recoverable afterwards, so none of it may be shipped red.');
  process.exit(1);
}
console.log('migration: an old install opens with everything in it, twice over, ' +
            'and a new one starts with a language of its own.');
