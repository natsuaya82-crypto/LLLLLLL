/* ---------------------------------------------------------------------------
   tools/marks-check.mjs — a button that does something every phone draws a
   mark for wears that mark, not the word.

   Run it:   node tools/marks-check.mjs          (the check)
             node tools/marks-check.mjs --list   (and every word-only button)

   「あのさ、送信とか共有とかもそうだけど、文字でドカンって共有とか書くの禁止
   してるよね？だから+〇とか送信なら紙飛行機マークにしてるはずなんだけど。
   これ禁止だから全部なくせや」 OWNER 2026-09-23.

   The rule had lived in comments over three marks in www/glyph.js and nowhere
   a session reads first, so 「共有」 went onto the card screen as a word
   beside a post row wearing ICON_SHARE.

   WHAT IS COUNTED IS THE SURFACE, NOT A LIST OF BUTTONS. Every screen and
   every face press walks (the same fixture, the same three lists), the bar a
   real render() puts over each route, and every form: every element carrying
   a `data-do` is looked at. A button is WORD-ONLY when it has letters in it
   and no mark -- no <svg>, <img> or <canvas> -- and its words are the
   interface's own (a string `t()` gives in English), which is what tells an
   operation's label from a word of somebody's language on a tile.

   AND WHICH OPERATIONS HAVE A MARK IS READ OFF THE WORDS, not off names in
   act-map.js: send, share, add, delete, close, back, edit, undo, search,
   settings, more. `MARKED` below is a list of English WORDS, so a button added tomorrow
   whose label is "Share" is caught tomorrow, whatever its action is called.
   A label that is MORE than the verb -- "Delete account" -- is a row that
   says what goes, and is not asked. What is not in it -- sign in, next,
   confirm, save, done -- has no settled mark,
   and which one it gets is the owner's (CLAUDE.md § Deciding); --list prints
   those and they do not fail.
   --------------------------------------------------------------------------- */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seed, obStates, halfDone } from './fixture.mjs';
import { chromium, LAUNCH } from './browser.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', 'www');
const PORT = 8161;
const LIST = process.argv.indexOf('--list') >= 0;

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
const pg = await br.newPage({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 1 });
await pg.goto(`http://127.0.0.1:${PORT}/`);
await pg.waitForTimeout(300);
await pg.evaluate('window.__seed = ' + seed.toString());
await pg.evaluate('window.__obStates = ' + obStates.toString());
await pg.evaluate('window.__halfDone = ' + halfDone.toString());

const R = await pg.evaluate(() => {
  window.confirm = () => false; window.alert = () => {}; window.prompt = () => null;
  const found = {};          /* act + text -> { act, text, keys, at } */
  const unswitched = {};     /* act -> { act, text, at } */
  let looked = 0, screens = 0, switches = 0;

  /* The interface's own English, as the words a button shows. Markup comes
     off and {0} becomes anything, so a label carrying a count still matches. */
  const en = strOf('en');
  const norm = (s) => String(s).replace(/<[^>]*>/g, ' ').replace(/&#10;/g, ' ')
    .replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
  const pats = [];
  Object.keys(en).forEach(k => {
    const s = norm(en[k]);
    if (!s || !/\p{L}/u.test(s)) return;
    const re = new RegExp('^' + s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\\\{\d\\\}/g, '.*') + '$');
    pats.push([k, re]);
  });
  /* A label with no {0} in it is the better answer: "{0}d" also matches "Add". */
  const keysOf = (txt) => {
    const all = pats.filter(p => p[1].test(txt)).map(p => p[0]);
    const exact = all.filter(k => norm(en[k]) === txt);
    return exact.length ? exact : all;
  };

  function look(where){
    screens++;
    /* What a thumb reads as a button. The title over Settings carries a
       data-do (a hidden tap) and is a heading, not an operation's label. */
    const els = document.querySelectorAll('button[data-do], a[data-do], [role="button"][data-do]');
    for (let i = 0; i < els.length; i++) {
      const e = els[i];
      if (e.offsetParent === null && getComputedStyle(e).position !== 'fixed') continue;
      looked++;
      const act = e.getAttribute('data-do');
      /* THE CORNER: what navTop() puts at the right end of the bar -- the bar
         itself, less the arrow back. */
      const corner = !!(e.closest('.navtop') && !e.classList.contains('back'));
      const marked = !!e.querySelector('svg, img, canvas');
      /* A YES OR A NO IS THE SWITCH. 「意味オンオフは ⭕️のトグルにしよう」
         OWNER 2026-09-26 -- the composer's meaning was 「意味」 written out
         and coloured gold while on, which no MARKED word catches because it
         is not a verb. What says a button is an on/off is aria-pressed, and
         every one of them wears the settings screen's .swt (swtHTML). */
      if (e.hasAttribute('aria-pressed')) {
        switches++;
        if (!e.querySelector('.swt') && !unswitched[act])
          unswitched[act] = { act, text: norm(e.textContent), at: where };
      }
      /* What the button is called: its words, or its aria-label when it is a
         mark. Both are the interface's English, so both classify the same. */
      const name = marked ? norm(e.getAttribute('aria-label') || '') : norm(e.textContent);
      /* THE ANSWERS TO A QUESTION ARE WORDS. popAsk() puts the question
         (`.popm`) and its two answers side by side, and an answer is what the
         question is answered WITH -- iOS's own question answers 「削除」 and
         「キャンセル」 in words too. A bin under 「この単語を削除しますか？」 is
         a picture of the answer rather than the answer. */
      if (e.parentNode && e.parentNode.querySelector(':scope > .popm')) continue;
      if (!/\p{L}/u.test(name)) continue;
      const keys = keysOf(name);
      if (!keys.length) continue;           /* somebody's word, not a label */
      const id = act + ' | ' + name + ' | ' + (marked ? 'mark' : 'words') + ' | ' + (corner ? 'corner' : 'page');
      if (!found[id]) found[id] = { act, text: name, keys, at: where, n: 0, marked, corner };
      found[id].n++;
    }
  }
  const show = (html) => { document.getElementById('app').innerHTML = html; };
  const views = Object.keys(window).filter(k =>
    /^v[A-Z]/.test(k) && typeof window[k] === 'function' && k !== 'vOb');
  const opens = Object.keys(window).filter(k =>
    /^open[A-Z]/.test(k) && typeof window[k] === 'function' && k !== 'openForm');
  const argsOf = (r) =>
    r === 'set'  ? [null].concat(SETS.map(x => x.id)) :
    r === 'gram' ? [null].concat(gramArgs()) :
    r === 'fm'   ? ['tira'] : [null];
  const tryDo = (where, f) => { try { f(); look(where); } catch (e) {} };

  for (let s = 0; s < OB_STEPS; s++)
    tryDo('vOb step ' + s, () => { window.__seed(); SET.walked = false; SET.obback = null;
                                   ob.step = s; show(vOb()); });
  ['free','pro'].forEach(plan => views.forEach(v => {
    const r = v.slice(1).toLowerCase();
    argsOf(r).forEach(a => tryDo(v + (a ? ':' + a : '') + ' (' + plan + ')', () => {
      window.__seed(); SET.walked = true; planGot(plan);
      window.route = r; NAV = [{ r: r, a: a }]; show(window[v]()); }));
  }));
  window.__obStates().forEach(([label, run]) =>
    tryDo('ob: ' + label, () => { window.__seed(); SET.walked = false; show(run()); }));
  [['paid', () => planGot('pro')], ['free', () => planGot('free')]].forEach(([who, stand]) =>
    window.__halfDone().forEach(([label, run]) =>
      tryDo(label + ' (' + who + ')', () => { window.__seed(); SET.walked = true; stand(); show(run()); })));
  opens.forEach(o => tryDo(o, () => {
    window.__seed(); SET.walked = true; planGot('pro');
    window.route = 'words'; NAV = [{ r: 'words' }];
    window[o].length ? window[o]('kano') : window[o]();
    render(); }));
  /* The bar. show() builds none, and the corner button is in it. */
  ['free','pro'].forEach(plan => Object.keys(PAGES).forEach(id => argsOf(id).forEach(a =>
    tryDo(id + (a ? ':' + a : '') + ' (' + plan + ', rendered)', () => {
      window.__seed(); SET.walked = true; planGot(plan);
      window.route = id; NAV = [{ r: id, a: a }]; render(); }))));
  tryDo('composer (rendered)', () => { window.__seed(); SET.walked = true; planGot('pro');
    PW = pwBlank(); openPost(); render(); });
  tryDo('tab bar', () => { window.__seed(); SET.walked = true; render(); });

  const ja = strOf('ja');
  return { screens, looked, switches, unswitched: Object.keys(unswitched).map(k => unswitched[k]),
    found: Object.keys(found).sort().map(k => {
    const f = found[k]; f.ja = f.keys.map(x => norm(ja[x] || '')).filter(Boolean)[0] || '';
    return f; }) };
});

await br.close();
srv.close();

/* Operations every phone already draws a mark for, as the English word the
   whole label is. Read the English because `en` is where every key is
   answered first; a label is caught whatever it is called in act-map.js. */
const MARKED = [
  ['send',     /^(send|post|reply)$/i],
  ['share',    /^share$/i],
  ['add',      /^(add|new)$/i],
  ['delete',   /^(delete|remove)$/i],
  ['close',    /^(close|cancel)$/i],
  ['back',     /^back$/i],
  ['edit',     /^edit$/i],
  ['undo',     /^(undo|redo)$/i],
  ['search',   /^(search|find)$/i],
  ['settings', /^settings$/i],
  ['more',     /^more$/i]
];
const kind = (txt) => { const m = MARKED.find(x => x[1].test(txt)); return m ? m[0] : ''; };

/* Two statements, both about the surface.
   1. An operation with a mark is not written as words, anywhere.
   2. The screen's send and share are the mark IN THE CORNER of the bar --
      「右上にしてね。送信も紙飛行機右上、共有も共有マークを右上。」OWNER
      2026-09-23. A send or a share standing anywhere else, mark or words, is
      in the wrong place. (A post row's mark and the word page's open the CARD
      -- they are called "Card", and the card screen's corner is where the
      sharing is.) */
const words = R.found.filter(f => !f.marked);
const bad = words.filter(f => kind(f.text)).map(f =>
  '  FAIL  ' + f.act + ' says "' + f.text + '" (' + f.ja + ') in words on ' + f.at +
  ' -- a ' + kind(f.text) + ' is a mark');
R.found.filter(f => (kind(f.text) === 'send' || kind(f.text) === 'share') && !f.corner).forEach(f =>
  bad.push('  FAIL  ' + f.act + ' ("' + f.text + '") is a ' + kind(f.text) + ' in the page on ' + f.at +
           ' -- a send or a share is the mark at the top right of the bar'));
R.unswitched.forEach(f =>
  bad.push('  FAIL  ' + f.act + ' is an on/off (aria-pressed) drawn as "' + f.text + '" on ' + f.at +
           ' -- a yes or a no is the switch, swtHTML()'));
const rest = words.filter(f => !kind(f.text));
/* The corner in words, counted and printed and not failed: what goes there
   when an operation has no settled mark (Save, Done, Select) is the owner's
   (CLAUDE.md § Deciding). */
const cornerWords = rest.filter(f => f.corner);
if (LIST) {
  console.log('word-only buttons whose words are the interface\'s: ' + words.length);
  words.forEach(f => console.log((kind(f.text) || '-') + '\t' + f.act + '\t' + f.text + '\t' +
                                f.ja + '\t' + f.keys.slice(0, 3).join(',') + '\t' + f.at +
                                (f.corner ? '\tcorner' : '')));
  console.log('\nin the corner of the bar, in words, with no settled mark: ' + cornerWords.length);
  cornerWords.forEach(f => console.log('  ' + f.act + '\t' + f.text + '\t' + f.ja + '\t' + f.at));
}
console.log('marks: ' + R.screens + ' screens, ' + R.looked + ' buttons looked at, ' +
            words.length + ' word-only, ' + rest.length + ' of them with no settled mark, ' +
            cornerWords.length + ' of those in the corner of the bar; ' +
            R.switches + ' on/offs, every one the switch');
if (bad.length) {
  bad.forEach(l => console.log(l));
  console.log('marks: FAIL -- ' + bad.length);
  process.exit(1);
}
console.log('marks: ok');
