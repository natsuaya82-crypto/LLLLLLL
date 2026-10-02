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
      same reading. None is read straight off.
   C. The composer end to end, through the real field: what a kept draft
      carries, what a post carries, and a post edited with its line untouched
      keeps the ink it was written with, byte for byte.
   D. A line of a letter with no name is a line, and is posted.
   E. A line on a photograph: a newline typed there is a second line, and a
      space is the ordinary face's space (inkSpace), as on the post.
   F. A field a spelling is typed into is set in the drawn letters.
   G. Enter is a new line in a field that is sentences, and nothing in one
      that is a word -- every `.lnin` on every route and face.
   H. Where those sentences are shown, the new line is still there.

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
  if (n)
    fails.push('B  ' + where.join(', ') + ' -- a field read straight off `.value`, so what the Lingua ' +
               'keyboard typed leaves the field as it was typed. Read it with actVal() (www/act.js)');
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
    out.on = pwHas();
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

/* ---- F. a field a spelling is typed into is set in the drawn letters ---------
   「綴りはローマ字でいいわけないやろ」 OWNER 2026-09-24: every field a word is
   SPELT in shows the letters somebody drew, the way the composer's line does,
   and all of them give the same answer (myFontField(), www/glyph.js).

   The surface is found, not listed. A spelling field is one whose receiver
   cuts what was typed into letters -- spType() -- so every field on every
   route and every face of the fixture is typed into through the real
   listener and the ones that reach spType() are the surface. A field read
   only on a press has no receiver to catch, so the functions under www/ that
   call spType() are read too and every id they fetch is on it.

   Asked both ways: with the drawn letters ON each wears .tfont and shows no
   drawn letter by its roman name; switched OFF, it wears neither the face nor
   a private use character, which would be a box. */
const SPID = new Set();
for (const f of fs.readdirSync(ROOT).filter((x) => x.endsWith('.js'))) {
  const src = strip(fs.readFileSync(path.join(ROOT, f), 'utf8'));
  const raw = fs.readFileSync(path.join(ROOT, f), 'utf8');
  for (const m of src.matchAll(/function\s+([\w$]+)\s*\([^)]*\)\s*\{/g)) {
    let d = 0, i = m.index + m[0].length - 1, e = i;
    for (; e < src.length; e++) { if (src[e] === '{') d++; else if (src[e] === '}' && --d === 0) break; }
    if (m[1] === 'spType' || !/\bspType\(/.test(src.slice(i, e))) continue;
    /* Only the field whose value FLOWS into spType(): fetched into a name,
       read by actVal() into another, and that one cut. The same function
       reads the meaning beside it, and a meaning is not a spelling. */
    const body = raw.slice(i, e), el = {}, val = {};
    for (const g of body.matchAll(/(\w+)\s*=\s*document\.getElementById\('([\w-]+)'\)/g)) el[g[1]] = g[2];
    for (const g of body.matchAll(/(\w+)\s*=\s*actVal\((\w+)\)/g)) if (el[g[2]]) val[g[1]] = el[g[2]];
    for (const g of body.matchAll(/spType\((\w+)\)/g)) if (val[g[1]]) SPID.add(val[g[1]]);
  }
}
const F = await pg.evaluate((ids) => {
  const out = { found: {}, bad: [] };
  const realSp = spType;
  let hit = false;
  spType = function () { hit = true; return realSp.apply(this, arguments); };
  const app = document.getElementById('app');
  const PUA = /[-]/;
  const ask = (on, where) => {
    const drawn = ltPuaOrder().map((l) => String(ltName(l) || '')).filter(Boolean);
    app.querySelectorAll('textarea, input').forEach((el) => {
      if (!el.id) return;
      const v = el.value, cls = ' ' + el.className + ' ';
      let spell = ids.indexOf(el.id) !== -1;
      if (!spell && el.getAttribute('data-in')) {
        hit = false;
        try { el.value = v + ltPua(0); el.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) {}
        el.value = v;
        spell = hit;
      }
      if (!spell) return;
      out.found[el.id.replace(/-\w{6,}$/, '-*')] = 1;
      if (on) {
        const romanOf = puaTyped(v).cut.filter((u) => u.t !== undefined)
          .map((u) => u.t).join(' ');
        const shown = drawn.filter((n) => romanOf.indexOf(n) !== -1);
        if (cls.indexOf(' tfont ') === -1) out.bad.push(where + ' #' + el.id + ' is not set in the drawn letters');
        else if (shown.length) out.bad.push(where + ' #' + el.id + ' shows the drawn ' + shown.join(',') +
                                            ' by name: "' + v + '"');
      } else if (cls.indexOf(' tfont ') !== -1 || PUA.test(v)) {
        out.bad.push(where + ' #' + el.id + ' with the drawn letters switched off still wears them: "' + v + '"');
      }
    });
  };
  /* The receivers run for real on the probe: spType() is reached through them. */
  const walkOn = (on) => {
    Object.keys(PAGES).forEach((r) => {
      try { window.__seed(); SET.walked = true;
        if (on) delete SET.myfont; else SET.myfont = false;
        installScriptFont(); installTypeFont();
        window.route = r; NAV = [{ r: r }]; render(); ask(on, r); } catch (e) {}
    });
    window.__halfDone().forEach(([label, run]) => {
      try { window.__seed(); SET.walked = true;
        if (on) delete SET.myfont; else SET.myfont = false;
        installScriptFont(); installTypeFont();
        app.innerHTML = run(); ask(on, label); } catch (e) {}
    });
  };
  walkOn(true); walkOn(false);
  spType = realSp;
  return out;
}, [...SPID]);
const spFound = Object.keys(F.found).sort();
if (spFound.length < 3)
  fails.push('F  only ' + spFound.length + ' spelling fields were found (' + spFound.join(' ') + '), so F holds nothing');
if (F.bad.length)
  fails.push('F  a field a spelling is typed into does not show the drawn letters the same way as the rest: ' +
             [...new Set(F.bad)].slice(0, 8).join(' | '));

/* ---- G. Enter: a new line where a sentence is written, nothing elsewhere ---
   「改行はできるべきでしょ」「一行のままのやつはそのままにしてバランス見てるの
   よ」 OWNER 2026-10-02. The fields that are sentences are the owner's list
   and are written here as that list; every OTHER `.lnin` is a word and
   drops Enter (2026-09-03). The surface is every field on every route and
   face, so a field added tomorrow is one or the other tomorrow.

   A REAL Enter, through the keyboard -- a synthetic keydown inserts nothing
   whether or not it is stopped -- then `c`, and what the field holds and what
   its receiver was handed are read.

   `sx-ln` and `sx-gl`, a grammar chapter's example, joined the list when
   their ＋ took over adding one 「文法の章の例文も」 OWNER 2026-10-02. */
const LINES = ['pw-ln', 'pw-mn', 'wd-exl', 'wd-exg', 'sx-ln', 'sx-gl', 'lt-nt', 'cont-b', 'wld-ov-*'];
const gKey = (id) => /^wld-ov-/.test(id) ? 'wld-ov-*' : id;
const Gfaces = await pg.evaluate(() => {
  const faces = [], seen = {};
  window.__faces = [];
  Object.keys(PAGES).forEach((r) => window.__faces.push(['route', r]));
  window.__halfDone().forEach(([label], i) => window.__faces.push(['face', label, i]));
  window.__show = (k) => {
    const f = window.__faces[k], app = document.getElementById('app');
    window.__seed(); SET.walked = true;
    if (f[0] === 'route') { window.route = f[1]; NAV = [{ r: f[1] }]; render(); }
    else app.innerHTML = window.__halfDone()[f[2]][1]();
  };
  window.__faces.forEach((f, k) => {
    try { window.__show(k); } catch (e) { return; }
    document.querySelectorAll('#app textarea.lnin[id]').forEach((el) => {
      const key = /^wld-ov-/.test(el.id) ? 'wld-ov-*' : el.id;
      if (!seen[key]) { seen[key] = { ks: [], id: el.id, key: key }; faces.push(seen[key]); }
      seen[key].ks.push(k);
    });
  });
  return faces;
});
const G = { asked: 0, bad: [], found: {} };
for (const f of Gfaces) {
  /* A field is asked on the first face that draws it again: some faces are
     what an earlier one left behind, which is what the walk saw. */
  const ok = await pg.evaluate(({ ks, key }) => {
    let el = null;
    for (let i = 0; i < ks.length && !el; i++) {
      try { window.__show(ks[i]); } catch (e) { continue; }
      el = [...document.querySelectorAll('#app textarea.lnin[id]')]
        .filter((e) => (/^wld-ov-/.test(e.id) ? 'wld-ov-*' : e.id) === key)[0] || null;
    }
    window.__got = null;
    window.__real = { i: {}, k: {} };
    Object.keys(ACT_IN).forEach((n) => { window.__real.i[n] = ACT_IN[n];
      ACT_IN[n] = function () { window.__got = [].slice.call(arguments); }; });
    Object.keys(ACT_KEY).forEach((n) => { window.__real.k[n] = ACT_KEY[n]; ACT_KEY[n] = function () {}; });
    if (!el) return null;
    el.value = 'ab'; el.focus(); el.setSelectionRange(2, 2);
    return document.activeElement === el ? el.id :
      'could not be focused (' + (el.readOnly ? 'readonly ' : '') + getComputedStyle(el).display + ')';
  }, f);
  if (!ok || ok.indexOf(' ') !== -1) { G.bad.push('#' + f.id + ' ' + (ok || 'not drawn again')); continue; }
  f.id = ok;
  await pg.keyboard.press('Enter');
  await pg.keyboard.type('c');
  const r = await pg.evaluate((id) => {
    const el = document.getElementById(id), v = el ? el.value : null,
          got = window.__got, inn = el && el.getAttribute('data-in');
    Object.keys(window.__real.i).forEach((n) => { ACT_IN[n] = window.__real.i[n]; });
    Object.keys(window.__real.k).forEach((n) => { ACT_KEY[n] = window.__real.k[n]; });
    if (el) el.blur();
    return { v: v, got: inn ? JSON.stringify(got) : null };
  }, f.id);
  G.asked++;
  G.found[f.key] = 1;
  const lines = LINES.indexOf(f.key) !== -1;
  if (lines && r.v !== 'ab\nc')
    G.bad.push('#' + f.id + ' is sentences and Enter gave ' + JSON.stringify(r.v) + ', not a new line');
  else if (lines && r.got !== null && r.got.indexOf('ab\\nc') === -1)
    G.bad.push('#' + f.id + ' kept the new line and its receiver was handed ' + r.got);
  else if (!lines && r.v !== 'abc')
    G.bad.push('#' + f.id + ' is one word and Enter gave ' + JSON.stringify(r.v));
}
LINES.forEach((k) => { if (!G.found[k]) G.bad.push(k + ' is on the list and no screen drew it, so G holds nothing for it'); });
/* and the word's example, all the way in: two lines typed with Enter go
   onto the word by the ＋ */
const Gex = await pg.evaluate(() => {
  window.__seed(); SET.walked = true;
  openWord('kano'); openEdit('kano'); wdExNew = true;
  document.getElementById('app').innerHTML = vForm();
  const n = (wdW().ex || []).length, e = document.getElementById('wd-exl');
  if (!e) return 'no #wd-exl';
  e.value = 'kano'; e.focus(); e.setSelectionRange(4, 4);
  return n;
});
if (typeof Gex === 'string') G.bad.push('the word sheet: ' + Gex);
else {
  await pg.keyboard.press('Enter');
  await pg.keyboard.type('tir');
  const last = await pg.evaluate((n) => {
    const b = document.querySelector('#app [data-do="wdExOpen"]');
    if (!b) return 'no ＋';
    b.click();
    const ex = wdW().ex || [];
    return ex.length > n ? ex[ex.length - 1].ln : 'nothing added';
  }, Gex);
  if (last !== 'kano\ntir') G.bad.push('an example typed on two lines went onto the word as ' + JSON.stringify(last));
}
/* and a grammar stage's example the same way: two lines with Enter in each
   box, nothing added by Enter, and the ＋ puts both on the list as typed */
const Gst = await pg.evaluate(() => {
  window.__seed(); SET.walked = true;
  popOff(); viewReset();
  const id = stAll()[0].id;
  window.__stid = id;
  stExNew = ''; openStEx(id); stExOpen(id); render();
  window.__stn = stExKept(id).length;
  const e = document.getElementById('sx-ln');
  if (!e) return 'no #sx-ln';
  e.focus(); return null;
});
if (Gst) G.bad.push('a grammar stage: ' + Gst);
else {
  await pg.keyboard.type('kano');
  await pg.keyboard.press('Enter');
  await pg.keyboard.type('tir');
  await pg.evaluate(() => document.getElementById('sx-gl').focus());
  await pg.keyboard.type('AA');
  await pg.keyboard.press('Enter');
  await pg.keyboard.type('BB');
  const st = await pg.evaluate(() => {
    const id = window.__stid, was = window.__stn, now = stExKept(id).length;
    if (now !== was) return 'Enter added ' + (now - was) + ' examples';
    const b = document.querySelector('#app [data-do="stExOpen"]');
    if (!b) return 'no ＋';
    b.click();
    const a = stExKept(id), x = a[a.length - 1];
    if (a.length !== was + 1) return 'the ＋ left ' + a.length + ' examples where there were ' + was;
    const f = document.getElementById('sx-ln');
    if (!f || f.value !== '') return 'the ＋ did not open an empty box after it (' + (f ? JSON.stringify(f.value) : 'none') + ')';
    return x.ln + '|' + x.gl;
  });
  if (st !== 'kano\ntir|AA\nBB') G.bad.push('a grammar stage\'s example typed on two lines: ' + JSON.stringify(st));
}
if (G.asked < 30) fails.push('G  only ' + G.asked + ' fields were pressed Enter in, so G holds nothing');
if (G.bad.length) fails.push('G  Enter: ' + G.bad.slice(0, 8).join(' | '));

/* ---- H. where those sentences are SHOWN, they are two lines ---------------
   Measured on the page: the second line's top is below the first's, in the
   real drawer. The card is a canvas, so what fillText() was handed is read. */
const H = await pg.evaluate(() => {
  const out = {};
  const app = document.getElementById('app');
  const two = (root, A, B) => {
    if (!root) return 'not drawn';
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let a = null, b = null, n;
    while ((n = w.nextNode())) {
      const i = n.data.indexOf(A), j = n.data.indexOf(B, i >= 0 ? i + A.length : 0);
      if (i >= 0 && a === null) { const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + A.length);
        a = r.getBoundingClientRect().top; }
      if (j >= 0 && b === null) { const r = document.createRange(); r.setStart(n, j); r.setEnd(n, j + B.length);
        b = r.getBoundingClientRect().top; }
    }
    if (a === null || b === null) return 'not drawn';
    return b > a + 2 ? 'two' : 'one line';
  };
  const painted = (k, v) => {
    const P = CanvasRenderingContext2D.prototype, real = P.fillText, seen = [];
    P.fillText = function (s) { seen.push(String(s)); return real.apply(this, arguments); };
    CARD = { k: k, v: v };
    try { cardPaint(document.createElement('canvas')); } finally { P.fillText = real; }
    const a = seen.filter((s) => s.indexOf('AAAA') >= 0), b = seen.filter((s) => s.indexOf('BBBB') >= 0);
    if (!a.length || !b.length) return 'not painted';
    return a.some((s) => s.indexOf('BBBB') >= 0) ? 'one line' : 'two';
  };
  window.__seed(); SET.walked = true;
  const p = POSTS.filter((q) => !q.nm && !q.pr)[0];
  p.mn = 'AAAA\nBBBB';
  window.route = 'feed'; NAV = [{ r: 'feed' }]; render();
  out['a post\'s meaning on the timeline'] = two(app, 'AAAA', 'BBBB');
  out['a post\'s meaning on its card'] = painted('p', p.id);
  const w = findWord('kano');
  w.ex = [{ ln: 'kano\ntir', gl: 'AAAA\nBBBB' }];
  openWord('kano');
  out['an example\'s line on the word'] = two(app.querySelector('.exl'), 'kano', 'tir');
  out['an example\'s translation on the word'] = two(app, 'AAAA', 'BBBB');
  out['an example\'s translation on its card'] = painted('x', 'kano#0');
  out['an example\'s translation on the word\'s card'] = painted('w', 'kano');
  const sid = stAll()[0].id;
  stEx(sid).splice(0, stEx(sid).length, { lb: '', ln: 'kano\ntir', gl: 'CCCC\nDDDD' });
  popOff(); viewReset(); stExNew = ''; openStEx(sid); render();
  out['a stage\'s example\'s line'] = two(app.querySelector('.exl'), 'kano', 'tir');
  out['a stage\'s example\'s translation'] = two(app, 'CCCC', 'DDDD');
  const l = LETTERS.filter((x) => inkGeo(x))[0];
  l.nt = 'AAAA\nBBBB';
  LOWN[langId] = 'somebody-else';
  window.route = 'letter'; NAV = [{ r: 'letter', a: l.id }]; render();
  out['a letter\'s note, read'] = two(app, 'AAAA', 'BBBB');
  delete LOWN[langId];
  window.__seed(); SET.walked = true;
  world().ovs = [{ id: 'O1', k: 'AAAA\nBBBB', v: 'CCCC\nDDDD' }];
  wldPubGot(langId, true);
  wldSecs().forEach(function (sec) { ABOPEN[sec.r] = true; });
  window.route = 'about'; NAV = [{ r: 'about' }]; render();
  out['an overview row\'s name, read'] = two(app, 'AAAA', 'BBBB');
  out['an overview row\'s value, read'] = two(app, 'CCCC', 'DDDD');
  const was = netFeedbackSend; let sent = null;
  netFeedbackSend = function (k, txt) { sent = txt; };
  try { CONT = { kind: 'opinion', body: 'AAAA\nBBBB', busy: false }; contactGo(); }
  finally { netFeedbackSend = was; CONT = { kind: 'opinion', body: '', busy: false }; }
  out['the contact, as sent'] = sent === 'AAAA\nBBBB' ? 'two' : JSON.stringify(sent);
  return out;
});
const Hbad = Object.keys(H).filter((k) => H[k] !== 'two');
if (Hbad.length) fails.push('H  a sentence typed on two lines is shown as: ' +
                            Hbad.map((k) => k + ' -- ' + H[k]).join(' | '));

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
            '     ' + reads + ' reads of .value outside www/act.js;\n' +
            '     a draft carries its letters by id, a post its ink, an edit keeps the ink it was\n' +
            '     written with; a letter with no name posts; a line on a photograph breaks at a\n' +
            '     newline and spaces with the ordinary face;\n' +
            '     ' + spFound.length + ' spelling fields (' + spFound.join(' ') + ') show the drawn letters, and\n' +
            '     none of them does with the switch off;\n' +
            '     Enter pressed in ' + G.asked + ' fields: ' + LINES.length + ' kinds take a new line and it reaches\n' +
            '     their receivers, every other one-word field drops it; a word\'s and a stage\'s ＋ add two lines;\n' +
            '     ' + Object.keys(H).length + ' places a sentence is shown keep its two lines.');
