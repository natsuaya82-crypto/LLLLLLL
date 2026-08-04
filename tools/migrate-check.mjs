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
  'lingua.set':     JSON.stringify({ theme: 'dark', plan: 'free', done: true })
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
  notes: NOTES.length, note0: NOTES[0] && NOTES[0].t,
  talk: TALK.length, talk0: TALK[0] && TALK[0].q, sound: !!STG.done.sound,
  script: Object.keys(SCRIPT.g).join(','),
  theme: SET.theme, done: SET.done, plan: SET.plan,
  langs: Object.keys(LANGS).length, id: langId,
  mine: !!(LANGS[langId] && LANGS[langId].mine),
  indexName: LANGS[langId] && LANGS[langId].name,
  oldKept: localStorage.getItem('lingua.words') !== null,
  filed: localStorage.getItem('lingua.' + langId + '.words') !== null
});

const fails = [];
const want = (label, got, expected) => {
  if (got !== expected) fails.push(`${label}: got ${JSON.stringify(got)}, wanted ${JSON.stringify(expected)}`);
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
want('letters carried over', a.letters, 3);
want('and they are the letters that were drawn, not ones rebuilt from the glyphs',
     a.letterIds, 'lA,lB,lC');
want('notes carried over', a.notes, 1);
want('and it is what they wrote', a.note0, 'a note');
want('talk carried over', a.talk, 1);
want('and it is what was said', a.talk0, 'hi');
want('the stage they had finished is still finished', a.sound, true);
want('the drawn script carried over', a.script, 't');
want('their theme survived', a.theme, 'dark');
want('their onboarding is still done', a.done, true);
want('their plan survived', a.plan, 'free');
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
want('still their letters', b.letterIds, 'lA,lB,lC');
want('still their name', b.name, 'Vaska');

/* ---- 4: a phone that never had this app --------------------------------- */
await pg.evaluate(() => localStorage.clear());
await pg.reload();
const c = await pg.evaluate(REPORT);
want('a fresh install gets one language', c.langs, 1);
want('and it is theirs to write in', c.mine, true);
want('with nothing in it', c.words, 0);
want('and it is the one that is open', c.id, await pg.evaluate(() => langId));

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
