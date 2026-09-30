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

   WORDS MADE UP -- one button on the new-word sheet (OWNER 2026-09-30).
   Pressing it fills everything but the meaning: the spelling, its reading
   and the part of speech. What a word is like is learned from the
   dictionary, per part of speech, so a dictionary whose verbs all end in -a
   makes verbs ending in -a. Too few words and it is the letters' sounds in
   the language's shapes (STG.syl, read and never written). The sheet that
   changes a word has no such button, and the dictionary no door to a list.

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

  /* ---- 2. learned from the dictionary: verbs end in -a -----------------
     Pressed on the sheet itself, forty times, with the part of speech left
     to the dictionary; then with the person's own choice of verb. */
  start();
  WORDS = [
    { hw:'kana', ph:['k','a','n','a'], mns:['x'], pos:'v', at:1 },
    { hw:'tira', ph:['t','i','r','a'], mns:['x'], pos:'v', at:2 },
    { hw:'sema', ph:['s','e','m','a'], mns:['x'], pos:'v', at:3 },
    { hw:'lora', ph:['l','o','r','a'], mns:['x'], pos:'v', at:4 },
    { hw:'pika', ph:['p','i','k','a'], mns:['x'], pos:'v', at:5 },
    { hw:'kan',  ph:['k','a','n'],     mns:['x'], pos:'n', at:6 },
    { hw:'tiron',ph:['t','i','r','o','n'], mns:['x'], pos:'n', at:7 },
    { hw:'sen',  ph:['s','e','n'],     mns:['x'], pos:'n', at:8 },
    { hw:'morin',ph:['m','o','r','i','n'], mns:['x'], pos:'n', at:9 },
    { hw:'pol',  ph:['p','o','l'],     mns:['x'], pos:'n', at:10 }];
  const syl0 = JSON.stringify(STG.syl);
  openAdd(''); screen();
  const press = () => { const b = document.querySelector('#app [data-do="wdGen"]'); if (b) b.click(); return !!b; };
  const made = [], badV = [];
  let btn = true;
  for (let i = 0; i < 40 && btn; i++) {
    btn = press();
    const seq = (wEdit.seq || []).slice();
    made.push({ hw: spWord(wEdit.sp || []), pos: wEdit.pos, seq });
    if (wEdit.pos === 'v' && seq[seq.length - 1] !== 'a') badV.push(spWord(wEdit.sp || []));
  }
  const vs = made.filter(m => m.pos === 'v'), ns = made.filter(m => m.pos === 'n');
  out.said.push('2. forty presses: ' + vs.length + ' verbs (' + vs.slice(0, 5).map(m => m.hw).join(' ') +
    '), ' + ns.length + ' nouns (' + ns.slice(0, 5).map(m => m.hw).join(' ') + ')');
  if (!btn) out.fails.push('2. the new-word sheet has no 自動生成 button to press');
  if (!vs.length) out.fails.push('2. forty presses on a dictionary half verbs made no verb -- the part of speech is not drawn from the dictionary');
  if (!ns.length) out.fails.push('2. forty presses on a dictionary half nouns made no noun');
  if (badV.length) out.fails.push('2. every verb in the dictionary ends in -a and these were made as verbs: ' + badV.slice(0, 6).join(' '));
  const kinds = {}; made.forEach(m => { kinds[m.hw] = 1; });
  if (Object.keys(kinds).length < 10) out.fails.push('2. forty presses gave ' + Object.keys(kinds).length + ' different words -- pressing again is meant to give another');
  /* the person's own part of speech is kept */
  wdSetPos('v');
  const kept = [];
  for (let i = 0; i < 15; i++) { press(); kept.push(wEdit.pos + ':' + spWord(wEdit.sp || [])); }
  const notV = kept.filter(k => k.indexOf('v:') !== 0 || !/a$/.test(k));
  out.said.push('2b. verb chosen on the sheet, fifteen presses: ' + kept.slice(0, 5).join(' '));
  if (notV.length) out.fails.push('2b. verb was chosen on the sheet and a press gave ' + notV.slice(0, 4).join(' '));
  if (JSON.stringify(STG.syl) !== syl0) out.fails.push('2c. pressing wrote STG.syl (' + JSON.stringify(STG.syl) + ') -- it is read, never written');

  /* ---- 3. what a press fills, and what it leaves ---------------------- */
  start();
  openAdd(''); screen();
  press();
  const hw3 = spWord(wEdit.sp || []), rd = (document.getElementById('wd-rd') || {}).textContent || '';
  const ln = (document.getElementById('wd-ln') || {}).value || '';
  out.said.push('3. one press: spelled ' + hw3 + ', reading ' + JSON.stringify(rd) + ', ' + wEdit.pos +
    ', meanings ' + JSON.stringify(wEdit.mns) + ', the field holds ' + JSON.stringify(ln));
  if (!hw3) out.fails.push('3. a press left the spelling empty');
  if (JSON.stringify(spPh(wEdit.sp || [])) !== JSON.stringify(wEdit.seq) || !wEdit.seq.length)
    out.fails.push('3. the reading is not the one the spelling reads');
  if (!rd.trim()) out.fails.push('3. the reading on the sheet is empty after a press');
  if (!ln) out.fails.push('3. the spelling field is empty after a press -- the sheet was not redrawn');
  if (!wEdit.pos) out.fails.push('3. a press left no part of speech');
  if ((wEdit.mns || []).length) out.fails.push('3. a press wrote a meaning: ' + JSON.stringify(wEdit.mns));
  (wEdit.sp || []).forEach(st => { if (!st.l || !ltById(st.l)) out.fails.push('3. ' + hw3 + ' has a position no letter spells'); });
  if (findWord(hw3)) out.fails.push('3. a press put ' + hw3 + ' into the dictionary before Save');
  keepPress();
  if (!findWord(hw3)) out.fails.push('3. Save on the sheet did not put ' + hw3 + ' in');

  /* ---- 4. where it is not --------------------------------------------- */
  start();
  openEdit('kano'); screen();
  const onEdit = !!document.querySelector('#app [data-do="wdGen"]');
  go('words'); screen();
  const door = [...document.querySelectorAll('#app [data-do="go"]')].some(e => /"gen/.test(e.getAttribute('data-a') || ''));
  out.said.push('4. 自動生成 on the edit sheet: ' + onEdit + '; a door from the dictionary to a list: ' + door +
    '; routes gen/gensyl: ' + (!!PAGES.gen || !!PAGES.gensyl));
  if (onEdit) out.fails.push('4. the sheet that changes a word carries 自動生成 -- 「直す画面にいらねえだろ」');
  if (door) out.fails.push('4. the dictionary still has a door to the list of made-up words');
  if (PAGES.gen || PAGES.gensyl) out.fails.push('4. the gen/gensyl routes are still there');

  /* ---- 4b. too few words: the letters' sounds, in STG.syl's shapes ---- */
  start();
  WORDS = []; STG.syl = ['CV'];
  const few = genWords(20, null), badF = [];
  few.forEach(g => { const pat = g.seq.map(x => ipaIsVowel(x) ? 'V' : 'C').join(''); if (!/^(CV)+$/.test(pat)) badF.push(g.hw + ' ' + pat); });
  out.said.push('4b. an empty dictionary with CV chosen: ' + few.slice(0, 5).map(g => g.hw).join(' '));
  if (few.length < 10) out.fails.push('4b. an empty dictionary made ' + few.length + ' words from its letters, not 20');
  if (badF.length) out.fails.push('4b. STG.syl says CV and these were made: ' + badF.slice(0, 4).join(', '));

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
