/* ---------------------------------------------------------------------------
   tools/word-check.mjs — a word you were looking at is still the word you
   were looking at after you change it.

   Run it:   node tools/word-check.mjs

   The dictionary is a place you move around in: a word page names its family,
   its synonyms and its opposites, every one of those is a row you press, and
   each lands you on another word page. So the trail behind you is a list of
   words, and `back()` walks it.

   A word is not a fixed thing. Its spelling is the only name it has, and
   editing a word can change it — that is what editing a word mostly IS. So
   `wRename()` goes round telling everything that points at a word its new
   name: the words derived from it, what means the same, what means the
   opposite, the lines it appears in. The trail points at it too, and nobody
   was telling the trail.

   What that looked like: open a word, press Edit, change one letter, Save —
   and land on "that is no longer here". Not an error, not a blank screen, and
   nothing thrown; the word was saved perfectly, under its new name, and the
   screen behind you was still asking for the old one. Deleting had the same
   shape: the page of the word you just deleted is still on the trail.

   Neither can be caught by pressing buttons. press-check builds a screen,
   presses one thing and rebuilds — it never presses two in a row, and this
   needs three: open, edit, save. So it is here, driving the real functions in
   the real app against the shared fixture.

   Exit code is 0 only when every case holds.
   --------------------------------------------------------------------------- */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { seed } from './fixture.mjs';
import { chromium, LAUNCH } from './browser.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', 'www');
const PORT = 8144;

const mime = (f) => f.endsWith('.html') ? 'text/html; charset=utf-8'
  : f.endsWith('.js') ? 'application/javascript; charset=utf-8'
  : 'text/plain; charset=utf-8';
const srv = http.createServer((rq, rs) => {
  const f = path.join(ROOT, rq.url === '/' ? 'index.html' : rq.url.split('?')[0]);
  let d = null;
  try { d = fs.readFileSync(f); } catch (e) { d = null; }
  if (d === null) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': mime(f) });
  rs.end(d);
});
await new Promise(r => srv.listen(PORT, r));

const br = await chromium.launch(LAUNCH);
const pg = await br.newPage();
await pg.goto(`http://127.0.0.1:${PORT}/`);
await pg.waitForTimeout(300);
await pg.evaluate('window.__seed = ' + seed.toString());

const R = await pg.evaluate(() => {
  const out = { fails: [], said: [] };
  const start = () => {
    window.__seed(); SET.done = true; SET.plan = 'plus';
    window.route = 'words'; NAV = [{ r: 'words' }];
  };
  const screen = () => {
    render();
    const a = document.getElementById('app');
    return a ? a.textContent : '';
  };

  /* ---- a word renamed from its own page ---------------------------------
     Open it, edit it, lengthen the spelling by one step so the headword
     changes, save. The screen left in front of you must be the word — under
     its new name — and not the one the trail was still asking for. */
  start();
  openWord('tira');
  openEdit('tira');
  wEdit.sp = wEdit.sp.concat([JSON.parse(JSON.stringify(wEdit.sp[wEdit.sp.length - 1]))]);
  wdSync();
  saveWord();
  const named = WORDS.filter(w => w.from === 'tir' && w.hw !== 'tiran' &&
                                  w.hw !== 'tiror' && w.hw !== 'tirok')[0];
  const now = named ? named.hw : '(the word is gone)';
  const seen = screen();
  out.said.push('a word renamed from its own page is ' + now);
  if (here().r !== 'form' || here().a !== 'word:' + now)
    out.fails.push('renamed to ' + now + ', and the screen behind is ' +
                   JSON.stringify(here()) + ' -- the trail still names the old word');
  if (seen.indexOf(now) < 0)
    out.fails.push('renamed to ' + now + ', and its page does not say so: ' +
                   JSON.stringify(seen.slice(0, 80)));

  /* ---- a word deleted from its own page ---------------------------------
     Same three steps, ending in Delete. The word is gone, so its page cannot
     be where you are put back down -- the trail has to lose it as well. */
  start();
  openWord('tira');
  openEdit('tira');
  window.confirm = function(){ return true; };
  delWord();
  out.said.push('a word deleted from its own page leaves you on ' +
                JSON.stringify(here()));
  if (here().r === 'form' && String(here().a).indexOf('tira') >= 0)
    out.fails.push('deleted tira, and the screen behind is ' +
                   JSON.stringify(here()) + ' -- the trail still names it');
  /* Not "the screen does not say tira" -- tiran and tirara both contain it.
     What must not be there is the screen that says the thing you asked for
     has gone, which is what you got by being put back down on its page. */
  if (screen().indexOf(t('form.gone')) >= 0)
    out.fails.push('deleted tira, and you were put down on "that is no longer here"');

  return out;
});

await br.close();
srv.close();

R.said.forEach(s => console.log('  ' + s));
if (R.fails.length) {
  R.fails.forEach(f => console.log('FAIL: ' + f));
  process.exit(1);
}
console.log('a word you change is still the word you were looking at.');
