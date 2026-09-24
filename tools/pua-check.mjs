/* ---------------------------------------------------------------------------
   pua-check — the Lingua keyboard's characters go no further than the field.

   「PUA は入力欄の外へ出ない。IN の配達一か所でローマ字に戻す。編集は書いた時の
   ink を保ち、切り直すのは行が打ち直された時だけ」 (r73 §2-10).

   The Lingua keyboard types U+E000 upward, one code point per drawn letter,
   and a code point means a letter only in this alphabet's order at this
   moment. So one that leaves the field -- stored on a draft, a post, a name,
   a search -- is a box on somebody else's phone today and somebody else's
   letter here tomorrow, once a letter is drawn or taken away. Nothing throws
   either way.

   What is counted is the SURFACE, so a field added tomorrow is asked
   tomorrow:

   A. Every field the app draws -- every route, and every face the fixture
      holds -- is typed into with private use characters through the real
      listener (www/act.js), `input` and `change` both, and every argument
      its receiver is handed is asked for one. None.
   B. Every read of a field's `.value` in www/ goes through actVal(), the
      same reading. What is left in files this branch does not own is OWED,
      and a line there that stops matching fails, so the list only shrinks.
   C. The composer end to end, through the real field: what a kept draft
      carries, what a post carries, and a post edited with its line untouched
      keeps the ink it was written with, byte for byte.
   D. A line of a letter with no name is a line, and is posted.
   E. A line on a photograph: a newline typed there is a second line, and a
      space is the ordinary face's space (inkSpace), as on the post.

   A browser, on its own port.
   --------------------------------------------------------------------------- */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seed, halfDone } from './fixture.mjs';
import { chromium, LAUNCH } from './browser.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
const PORT = 8247;
const fails = [];

/* ---- B, static ---------------------------------------------------------- */
function strip(src) {
  let out = '', i = 0; const n = src.length;
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '*') { const e = src.indexOf('*/', i + 2); const k = e < 0 ? n : e + 2;
      out += src.slice(i, k).replace(/[^\n]/g, ' '); i = k; continue; }
    if (c === '/' && d === '/') { const e = src.indexOf('\n', i); const k = e < 0 ? n : e;
      out += ' '.repeat(k - i); i = k; continue; }
    if (c === "'" || c === '"') { let k = i + 1;
      while (k < n && src[k] !== c) { if (src[k] === '\\') k++; k++; }
      out += c + ' '.repeat(Math.max(0, k - i - 1)) + c; i = k + 1; continue; }
    out += c; i++;
  }
  return out;
}
/* Reads of a field's value in files this branch does not own
   (claude/leader-briefs brief-r78-sides). Each is `file: count`, and the
   count has to be exactly what is there: fewer is progress -- lower it --
   and more is a new road out. The fix in each is actVal(el). */
const OWED = { 'home.js': 1, 'import.js': 1, 'onboard.js': 1, 'phases.js': 5 };
/* Things called `.value` that are not a field, each with what it is. */
const NOT_FIELDS = {
  'grammar.js': { r: 'a rule the grammar engine answers with; r.value is the feature it sets' }
};
/* `.value` read -- not written (`.value=`), not asked its type or length,
   and not compared with what is about to be written back into the field
   (`e.value!==v`), which keeps the caret and takes nothing out. */
const READ = /([A-Za-z_$][\w$]*)\.value\b(?!\s*=[^=])(?!\.length)(?!\s*[!=]==)/g;
let reads = 0;
for (const f of fs.readdirSync(ROOT).filter((x) => x.endsWith('.js')).sort()) {
  if (f === 'act.js') continue;
  const src = strip(fs.readFileSync(path.join(ROOT, f), 'utf8'));
  const lines = src.split('\n');
  let n = 0; const where = [];
  lines.forEach((l, i) => {
    const t = l.replace(/typeof\s+[\w.]+\.value/g, '');
    let m; READ.lastIndex = 0;
    while ((m = READ.exec(t))) {
      if (NOT_FIELDS[f] && NOT_FIELDS[f][m[1]]) continue;
      n++; where.push(f + ':' + (i + 1));
    }
  });
  reads += n;
  const owe = OWED[f] || 0;
  if (n > owe)
    fails.push('B  ' + where.join(', ') + ' -- a field read straight off `.value`, so what the Lingua ' +
               'keyboard typed leaves the field as it was typed. Read it with actVal() (www/act.js)');
  else if (n < owe)
    fails.push('B  OWED says www/' + f + ' reads `.value` ' + owe + ' times and it reads it ' + n +
               ' -- lower the number');
}

/* ---- the page ------------------------------------------------------------ */
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
const pg = await br.newPage({ viewport: { width: 390, height: 844 } });
const errs = [];
pg.on('pageerror', (e) => errs.push(e.message));
await pg.goto(`http://localhost:${PORT}/`);
await pg.waitForSelector('#splash', { state: 'detached', timeout: 10000 });
await pg.evaluate('window.__seed = ' + seed.toString());
await pg.evaluate('window.__halfDone = ' + halfDone.toString());
await pg.evaluate(() => { window.__seed(); SET.walked = true; SET.ui = 'en';
                          window.pageWait = function (r, a, done) { done(true); }; });

/* ---- A. every field, through the real listener ---------------------------- */
const A = await pg.evaluate(() => {
  const PUA = /[-]/;
  const typed = String.fromCharCode(0xE000) + String.fromCharCode(0xE001) + ' x' +
                String.fromCharCode(0xF8FF);
  const out = { fields: 0, screens: 0, names: {}, leaked: [] };
  const real = {};
  Object.keys(ACT_IN).forEach((k) => { real[k] = ACT_IN[k]; });
  const seen = (name, args) => {
    out.names[name] = 1;
    const s = JSON.stringify(args);
    if (PUA.test(s)) out.leaked.push(name + ' ' + s.slice(0, 80));
  };
  Object.keys(ACT_IN).forEach((k) => { ACT_IN[k] = function () { seen(k, [].slice.call(arguments)); }; });
  const app = document.getElementById('app');
  const walk = () => {
    out.screens++;
    app.querySelectorAll('[data-in],[data-ch]').forEach((el) => {
      if (!('value' in el) || el.type === 'range' || el.type === 'file' || el.type === 'checkbox') return;
      out.fields++;
      try { el.value = typed; } catch (e) { return; }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
  };
  Object.keys(PAGES).forEach((r) => {
    try { window.__seed(); SET.walked = true; window.route = r; NAV = [{ r: r }]; render(); walk(); }
    catch (e) {}
  });
  window.__halfDone().forEach(([label, run]) => {
    try { window.__seed(); SET.walked = true; app.innerHTML = run(); walk(); } catch (e) {}
  });
  Object.keys(real).forEach((k) => { ACT_IN[k] = real[k]; });
  return out;
});
if (A.leaked.length)
  fails.push('A  a receiver was handed what the Lingua keyboard typed, private use characters and ' +
             'all: ' + A.leaked.slice(0, 6).join(' | '));
if (A.fields < 20)
  fails.push('A  only ' + A.fields + ' fields were typed into, so A holds nothing');

/* ---- C. the composer, end to end ------------------------------------------ */
const C = await pg.evaluate(() => {
  const PUA = /[-]/;
  window.__seed(); SET.walked = true; planGot('plus'); installScriptFont();
  const out = {};
  const typeInto = (id, v) => {
    const e = document.getElementById(id);
    if (!e) return false;
    e.value = v;
    e.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  };
  const three = ltPua(0) + ltPua(1) + ltPua(2) + ' hi';
  const up = [], edits = [];
  const was = { du: netDraftUp, ps: postSend, pe: netPostEdit };
  netDraftUp = function (d, ok) { up.push(JSON.parse(JSON.stringify(d))); ok(null); };
  postSend = function (p, ok) { up.push(JSON.parse(JSON.stringify(p))); ok('sid-' + up.length); };
  netPostEdit = function (sid, q, ok) { edits.push(JSON.parse(JSON.stringify(q))); ok(); };
  try {
    /* a draft */
    PW = pwBlank(); go('feed'); openPost(); render();
    out.field = typeInto('pw-ln', three);
    draftKeep();
    out.draft = up[up.length - 1] || null;
    /* a post */
    PW = pwBlank(); go('feed'); openPost(); render();
    typeInto('pw-ln', three);
    const n = POSTS.length;
    pwSend();
    out.post = POSTS.length > n ? JSON.parse(JSON.stringify(POSTS.slice().sort((a, b) => (b.at || 0) - (a.at || 0))[0])) : null;
    /* the same post edited, its line untouched -- after the language moved
       under it: a letter redrawn and the gap changed. Without that, cutting
       the line again gives the same ink and says nothing. */
    if (out.post) {
      const p = postById(out.post.id);
      const l0 = ltPuaOrder()[0];
      inkSet(l0, [{ pts: [[100, 700], [700, 100]] }]);
      SCRIPT.sp = (SCRIPT.sp || 0) + 2;
      installScriptFont();
      p.sid = p.sid || 'sid-e';
      postEdit(p.id); render();
      out.editField = (document.getElementById('pw-ln') || {}).value || '';
      PW.mn = 'a new meaning';
      pwSend();
      out.edited = edits.length ? edits[edits.length - 1] : null;
    }
  } finally {
    netDraftUp = was.du; postSend = was.ps; netPostEdit = was.pe;
  }
  out.leaks = [];
  [['draft', out.draft], ['post', out.post], ['edit', out.edited]].forEach(([k, v]) => {
    if (v && PUA.test(JSON.stringify(v))) out.leaks.push(k);
  });
  out.fieldPua = PUA.test(out.editField || '');
  return out;
});
if (!C.field) fails.push('C  the composer has no #pw-ln to type into, so C holds nothing');
if (!C.draft || !C.post) fails.push('C  typing three drawn letters made ' + (C.draft ? '' : 'no draft ') +
                                    (C.post ? '' : 'no post'));
if (C.leaks.length)
  fails.push('C  what the Lingua keyboard typed reached what goes up, as it was typed: ' + C.leaks.join(', '));
if (C.draft && !(C.draft.cut && C.draft.cut.filter((u) => u.id !== undefined).length === 3))
  fails.push('C  a kept draft does not carry the three letters that were typed, by id: ' +
             JSON.stringify(C.draft.cut));
if (C.post && !(C.post.ink && C.post.ink.g && C.post.ink.g.length))
  fails.push('C  a post of three drawn letters carries no ink: ' + JSON.stringify(C.post.ink));
if (C.post && !C.edited)
  fails.push('C  editing the post sent nothing, so the ink it keeps is not asked');
if (C.edited && JSON.stringify(C.edited.ink) !== JSON.stringify(C.post.ink))
  fails.push('C  a post edited with its line untouched came back with other ink -- written ' +
             JSON.stringify(C.post.ink && C.post.ink.s) + ', after the edit ' +
             JSON.stringify(C.edited.ink && C.edited.ink.s) + '. The past is not re-cut from the present');
if (C.post && !C.fieldPua)
  fails.push('C  the field a post is edited in opened as roman, not as the post was typed');

/* ---- D. a letter with no name ---------------------------------------------- */
const D = await pg.evaluate(() => {
  window.__seed(); SET.walked = true; installScriptFont();
  const l = { id: 'nameless', st: [{ pts: [[200, 200], [600, 600]] }] };
  LETTERS.push(l); installScriptFont();
  const k = ltPuaOrder().indexOf(l);
  const was = postSend;
  postSend = function (p, ok) { ok('sid'); };
  let out = { k: k };
  try {
    PW = pwBlank(); go('feed'); openPost(); render();
    const e = document.getElementById('pw-ln');
    e.value = ltPua(k);
    e.dispatchEvent(new Event('input', { bubbles: true }));
    const n = POSTS.length;
    out.on = pwOn();
    pwSend();
    const p = POSTS.length > n ? POSTS.slice().sort((a, b) => (b.at || 0) - (a.at || 0))[0] : null;
    out.posted = !!p;
    out.shapes = p && p.ink ? p.ink.g.length : 0;
    window.route = 'feed'; NAV = [{ r: 'feed' }]; render();
    out.drawn = p ? !!document.querySelector('[data-a*="' + p.id + '"] .pline') : false;
  } finally { postSend = was; LETTERS.pop(); installScriptFont(); }
  return out;
});
if (D.k < 0) fails.push('D  a letter with no name is not in the typing face, so D holds nothing');
else if (!D.on || !D.posted || D.shapes !== 1 || !D.drawn)
  fails.push('D  a line of one letter with no name: the send is ' + (D.on ? 'up' : 'down') + ', ' +
             (D.posted ? 'posted' : 'not posted') + ', ' + D.shapes + ' shapes on it, ' +
             (D.drawn ? 'drawn' : 'no line on the timeline'));

/* ---- E. a line on a photograph ----------------------------------------------- */
const E = await pg.evaluate(() => {
  window.__seed(); SET.walked = true; installScriptFont();
  const m = { tx: '', cut: puaTyped(ltPua(0) + ' ' + ltPua(1) + '\n' + ltPua(2)).cut, x: 0.5, y: 0.5, s: 0.1 };
  const lines = pwMarkLines(m);
  const sp = lines[0] ? lines[0].filter((u) => u.sp).map((u) => pwMarkW(u)) : [];
  return { n: lines.length, sp: sp, face: inkSpace() };
});
if (E.n !== 2)
  fails.push('E  a line typed on a photograph with a newline in it came out as ' + E.n + ' lines');
if (E.sp.length !== 1 || E.sp[0] !== E.face)
  fails.push('E  a space on a photograph is ' + JSON.stringify(E.sp) + ' wide where the line and the ' +
             'card give it ' + E.face + ' (inkSpace)');

if (errs.length) fails.push('the page threw: ' + errs.slice(0, 3).join(' | '));
await br.close();
srv.close();

if (fails.length) {
  console.error('\npua: ' + fails.length + ' thing' + (fails.length > 1 ? 's' : '') +
                ' about the Lingua keyboard’s characters do not hold:\n');
  for (const f of fails) console.error('  ' + f + '\n');
  process.exit(1);
}
console.log('pua: ' + A.fields + ' fields on ' + A.screens + ' screens typed into, ' +
            Object.keys(A.names).length + ' receivers handed roman and nothing else;\n' +
            '     ' + reads + ' reads of .value outside www/act.js, ' +
            Object.values(OWED).reduce((a, b) => a + b, 0) + ' of them owed in files this branch does not own;\n' +
            '     a draft carries its letters by id, a post its ink, an edit keeps the ink it was\n' +
            '     written with; a letter with no name posts; a line on a photograph breaks at a\n' +
            '     newline and spaces with the ordinary face.');
