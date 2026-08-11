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

   Exit code is 0 only when all four hold.
   --------------------------------------------------------------------------- */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { seed } from './fixture.mjs';

const require_ = createRequire(import.meta.url);
function loadChromium(){
  try { return require_('playwright').chromium; } catch (e) {}
  try {
    const g = execSync('npm root -g', { encoding: 'utf8' }).trim();
    return require_(path.join(g, 'playwright')).chromium;
  } catch (e) {}
  console.error('playwright is not installed. npm i -g playwright');
  process.exit(2);
}
const chromium = await loadChromium();

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', 'www');
const PORT = 8127;
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const LAUNCH = fs.existsSync(CHROME) ? { executablePath: CHROME } : {};

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
  bkTake(file);
  langStore(); langRead(); ltRead(); noteRead(); stRead(); sndRead(); kbRead();
  const back = { words: WORDS.length, letters: LETTERS.length, known: !!LANGS[id] };
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

  return { fails, before, back, name, missing, kb: +(file.length / 1024).toFixed(1) };
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
if (R.fails.length){
  console.error('\nbackup: ' + R.fails.length + ' thing' + (R.fails.length === 1 ? '' : 's') +
                ' about keeping a language do not hold:\n');
  R.fails.forEach(m => console.error('  ' + m));
  console.error('');
  process.exit(1);
}

console.log('backup: a language of ' + R.before.words + ' words and ' + R.before.letters +
            ' letters packs to ' + R.kb + ' KB in ' + R.before.slices + ' slices,');
console.log('        comes back whole from a storage wipe, and refuses to overwrite a');
console.log('        language that is already there.');
