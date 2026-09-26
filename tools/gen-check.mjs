/* ---------------------------------------------------------------------------
   tools/gen-check.mjs — words the app makes up, and where a word came from.

   Run it:   node tools/gen-check.mjs

   Two chapters of 2026-09-26 (docs/FEATURE_RULES.md 「他の道具の強いところを
   全部入れる」), and neither of them can throw:

   THE PAST. A word derived from another carries its parent's spelling in
   `from` -- a value, written when it was made. Deleting the parent used to
   delete that value off every child (wDrop), so a word's history went with a
   word that was not it. CLAUDE.md § The past: what a thing meant when it was
   made goes ON it, and nothing re-generates it from the present.

   WORDS MADE UP (vGen). A candidate is the language's sounds in its syllable
   shapes, and can be spelled with its letters; the shapes chosen are the
   language's (STG.syl, the `phases` slice); a candidate pressed is the add
   sheet with its spelling, and Add puts it in.

   WHERE A WORD CAME FROM. Chosen on the relate list (no ring), a draft of the
   edit sheet until Save, drawn as a tree up and down (vEty), and the trail
   follows the word the tree is open on.

   Driven through the real functions against the shared fixture.
   Exit code is 0 only when every case holds.
   --------------------------------------------------------------------------- */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seed } from './fixture.mjs';
import { chromium, LAUNCH } from './browser.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', 'www');
const PORT = 8262;

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
const errs = [];
pg.on('pageerror', e => errs.push(String(e && e.message || e)));
await pg.goto(`http://127.0.0.1:${PORT}/`);
await pg.waitForTimeout(300);
await pg.evaluate('window.__seed = ' + seed.toString());

const R = await pg.evaluate(() => {
  const out = { fails: [], said: [] };
  const start = () => {
    window.__seed(); SET.walked = true; planGot('free');
    window.route = 'words'; NAV = [{ r: 'words' }];
  };
  const screen = () => {
    render();
    const a = document.getElementById('app');
    return a ? a.textContent : '';
  };

  /* ---- 1. a parent deleted leaves its children's `from` where it was ---- */
  start();
  wDrop('tir');
  const kid = findWord('tiror');
  out.said.push('1. `tir` deleted: tiror.from is ' + JSON.stringify(kid && kid.from));
  if (!kid) out.fails.push('1. tiror went with its parent -- nothing but tir was deleted');
  else if (kid.from !== 'tir')
    out.fails.push('1. deleting `tir` took `from` off tiror (' + JSON.stringify(kid.from) +
      ') -- the spelling a word came from is the value it was made with, and ' +
      'a parent going does not change what the child was made from (CLAUDE.md § The past)');

  /* and an inflection stored as a word before 2026-09-23 (tira, the past of
     tir) is listed under its parent's forms and nowhere else. With the parent
     gone there is no page to list it on, so it is a word in the list again --
     keeping its `from` must not hide it. */
  const seen = wordsSeen().map(w => w.hw);
  out.said.push('1b. with `tir` gone the list holds tira: ' + (seen.indexOf('tira') >= 0));
  if (seen.indexOf('tira') < 0)
    out.fails.push('1b. `tir` was deleted and its old past tense `tira` is in no list and ' +
      'on no page -- still in WORDS, and nowhere a person can reach it');

  /* ---- 2. the shapes a language makes words in -------------------------
     None chosen: read off the dictionary (tir is one CVC syllable). Chosen
     on the screen, by pressing: CV and nothing else. What was chosen is the
     language's -- in the `phases` slice, which is on the road up. */
  start();
  const read = genShapes().slice();
  out.said.push('2. shapes read off the fixture dictionary: ' + read.join(' '));
  if (read.indexOf('CVC') < 0)
    out.fails.push('2. `tir` is a CVC word and the shapes read off the dictionary are ' +
      JSON.stringify(read));
  if ((STG.syl || []).length)
    out.fails.push('2. reading the shapes wrote them onto the language (' +
      JSON.stringify(STG.syl) + ') -- nobody pressed anything');
  go('gen'); screen(); go('gensyl'); screen();
  if (genShapes().indexOf('CV') < 0) genSylSet('CV');
  genShapes().slice().forEach(s => { if (s !== 'CV') genSylSet(s); });
  const kept = slRd(langKey('phases')) || '';
  out.said.push('2b. chosen by pressing: STG.syl ' + JSON.stringify(STG.syl) +
    ', and the phases slice carries ' + JSON.stringify((JSON.parse(kept || '{}') || {}).syl));
  if (JSON.stringify(STG.syl) !== '["CV"]')
    out.fails.push('2b. CV alone was pressed on, and STG.syl is ' + JSON.stringify(STG.syl));
  if (kept.indexOf('"syl":["CV"]') < 0)
    out.fails.push('2b. the shapes were chosen and the `phases` slice does not carry them -- ' +
      'they would not reach the server and would be gone at the next launch');
  if (SLICES.indexOf('phases') < 0)
    out.fails.push('2b. `phases` is not in SLICES, so nothing puts it up');
  /* and the last one stays on */
  genSylSet('CV');
  if (JSON.stringify(STG.syl) !== '["CV"]')
    out.fails.push('2c. the last shape was taken off (' + JSON.stringify(STG.syl) + ') -- none ' +
      'chosen reads the dictionary again, so the shapes being taken off come back ticked');

  /* ---- 3. the words it makes ------------------------------------------ */
  const S = genSounds(), all = S.c.concat(S.v);
  const ws = genWords(30);
  const bad = [];
  ws.forEach(g => {
    const pat = g.seq.map(x => ipaIsVowel(x) ? 'V' : 'C').join('');
    if (!/^(CV)+$/.test(pat)) bad.push(g.hw + ' is ' + pat + ', not CV syllables');
    g.seq.forEach(x => { if (all.indexOf(x) < 0) bad.push(g.hw + ' has /' + x + '/, which no letter writes'); });
    g.sp.forEach(st => { if (!st.l || !ltById(st.l)) bad.push(g.hw + ' has a position no letter spells'); });
    if (JSON.stringify(spPh(g.sp)) !== JSON.stringify(g.seq)) bad.push(g.hw + ' is spelled with letters that read ' + spPh(g.sp).join('') + ', not ' + g.seq.join(''));
    if (findWord(g.hw)) bad.push(g.hw + ' is already in the dictionary');
    if (taken()[g.seq.join('')]) bad.push(g.hw + ' sounds like a word the dictionary has');
  });
  out.said.push('3. ' + ws.length + ' words made in CV out of ' + all.length +
    ' sounds the letters write, e.g. ' + ws.slice(0, 4).map(g => g.hw + ' ' + phIpa(g.seq)).join(', '));
  if (ws.length < 10) out.fails.push('3. asked for 30 words and got ' + ws.length);
  bad.slice(0, 6).forEach(b => out.fails.push('3. ' + b));

  /* ---- 4. one pressed goes onto the add sheet, and in by Add ---------- */
  go('gen'); screen();
  const g0 = GEN.ws[0];
  genTake(0);
  const onSheet = here().r === 'form' && JSON.stringify(spWord(wEdit.sp)) === JSON.stringify(g0.hw);
  out.said.push('4. pressed ' + g0.hw + ': standing on ' + here().r + ':' + here().a +
    ', the sheet is spelled ' + spWord(wEdit.sp || []));
  if (!onSheet) out.fails.push('4. pressing a made-up word did not open the add sheet with its spelling');
  screen();
  addOne();
  const got = findWord(g0.hw);
  if (!got || JSON.stringify(wPh(got)) !== JSON.stringify(g0.seq))
    out.fails.push('4. Add on the sheet did not put ' + g0.hw + ' into the dictionary reading ' +
      phIpa(g0.seq) + ' (' + JSON.stringify(got && wPh(got)) + ')');

  /* ---- 5. choosing the word one came from ----------------------------- */
  start();
  go('relate', 'from:kano'); const picker = screen();
  wFromSet('kano', 'sar');
  const k1 = findWord('kano').from;
  wFromSet('sar', 'kano');           /* a ring: sar -> kano -> sar */
  const s1 = findWord('sar').from;
  go('relate', 'from:sar'); const pickSar = screen();
  const offered = [...document.querySelectorAll('#app .entry .hw')].map(e => e.textContent);
  wFromSet('kano', 'sar');           /* the same one again takes it off */
  const k2 = findWord('kano').from;
  out.said.push('5. kano.from after choosing sar: ' + JSON.stringify(k1) + ', sar.from after ' +
    'choosing kano: ' + JSON.stringify(s1) + ', kano offered on sar\'s list: ' +
    (offered.indexOf('kano') >= 0) + ', kano.from after pressing sar again: ' + JSON.stringify(k2));
  if (k1 !== 'sar') out.fails.push('5. choosing sar as where kano came from did not set it');
  if (s1) out.fails.push('5. sar was given kano as its origin while kano comes from sar -- a ring');
  if (offered.indexOf('kano') >= 0) out.fails.push('5. sar\'s list offers kano, which came from sar');
  if (k2) out.fails.push('5. pressing the chosen word again did not take it off');
  if (!/sar/.test(picker)) out.fails.push('5. the list kano\'s origin is chosen on does not offer sar');

  /* ---- 5b. chosen on the sheet, it is the sheet's until Save ----------
     The edit sheet is a draft (www/shell.js § KEEP). The origin -- and the
     same words for what means the same -- are chosen on a list the sheet
     opens, and leaving without Save has to ask, and 「いいえ」 has to put
     them back. */
  ['from', 'syn'].forEach(k => {
    start();
    openWord('kano'); screen(); openEdit('kano'); screen();
    go('relate', k + ':kano'); screen();
    if (k === 'from') wFromSet('kano', 'sar'); else wRelToggle('kano', 'syn', 'sar');
    back(); screen();
    back();                          /* not redrawn: render() takes a question down */
    const p = document.getElementById('pop');
    const asked = !!(p && /(^|\s)on(\s|$)/.test(p.className));
    if (asked) popNo();
    screen();
    const v = findWord('kano')[k];
    const left = k === 'from' ? v === 'sar' : (v || []).indexOf('sar') >= 0;
    out.said.push('5b. ' + k + ' chosen on the edit sheet, then back without Save: asked ' + asked +
      ', and after 「いいえ」 kano.' + k + ' is ' + JSON.stringify(v));
    if (!asked) out.fails.push('5b. ' + k + ' was chosen on the edit sheet and leaving it without ' +
      'Save asked nothing -- the change stays in memory and rides the next save anywhere');
    if (left) out.fails.push('5b. 「いいえ」 left kano.' + k + ' as it was chosen');
  });

  /* ---- 6. the tree ---------------------------------------------------- */
  start();
  findWord('tiror').from = 'tir';
  WORDS.push({ hw:'tirorin', ph:['t','i','r','o','r','i','n'], mns:['little watcher'], pos:'n', from:'tiror', at:20 });
  go('ety', 'tiror'); screen();
  const rows = [...document.querySelectorAll('#app .wdrow .wdroww')].map(e => e.textContent);
  out.said.push('6. the tree of tiror: ' + rows.join(' / '));
  if (rows.join('/') !== 'tir/tiror/tirorin')
    out.fails.push('6. the tree of tiror should be tir, tiror, tirorin -- it is ' + rows.join(', '));
  go('ety', 'tir'); screen();
  const rowsT = [...document.querySelectorAll('#app .wdrow .wdroww')].map(e => e.textContent);
  if (rowsT.indexOf('tira') >= 0)
    out.fails.push('6. the past tense tira is one of tir\'s forms and is drawn in the tree as a word');
  if (rowsT.indexOf('tirorin') < 0)
    out.fails.push('6. tir\'s tree stops at its children -- tirorin, a grandchild, is not in it');
  wDrop('tir'); go('ety', 'tiror'); screen();
  const gone = [...document.querySelectorAll('#app .wdrow')];
  const first = gone[0];
  out.said.push('6b. with tir deleted, the first row reads ' + JSON.stringify(first && first.textContent) +
    ' and is down: ' + !!(first && first.disabled));
  if (!first || first.textContent.indexOf('tir') !== 0 || !first.disabled)
    out.fails.push('6b. tir was deleted and the tree of tiror does not show the spelling it came from');
  openWord('tiror'); const page = screen();
  if (page.indexOf('tir') < 0 || !document.querySelector('#app button.wdrow[disabled]'))
    out.fails.push('6b. the page of tiror does not show where it came from once tir is gone');

  /* ---- 7. the trail follows a word the tree is open on ---------------- */
  start();
  NAV = [{ r:'words' }, { r:'ety', a:'tiror' }];
  wRename('tiror', 'tirora');
  const after = NAV.map(n => n.r + ':' + (n.a || '')).join(' ');
  openHw = 'tirora'; delWordGo();
  out.said.push('7. the trail after renaming tiror: ' + after);
  if (after.indexOf('ety:tirora') < 0)
    out.fails.push('7. tiror was renamed and the tree behind you still asks for the old name');
  if (NAV.some(n => n.r === 'ety'))
    out.fails.push('7. tirora was deleted and its tree is still on the trail');

  return out;
});

await br.close();
srv.close();

R.said.forEach(s => console.log('  ' + s));
errs.forEach(e => R.fails.push('the page threw: ' + e));
if (R.fails.length) {
  R.fails.forEach(f => console.log('FAIL: ' + f));
  process.exit(1);
}
console.log('words made up fit the language, and a word keeps where it came from.');
