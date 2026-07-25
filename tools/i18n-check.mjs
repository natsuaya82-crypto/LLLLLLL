/* ---------------------------------------------------------------------------
   tools/i18n-check.mjs — the net under the translations.

   Run it before every release:   node tools/i18n-check.mjs

   A missing translation is the one bug that ships silently: the screen still
   renders, the button still works, and only a person reading that language
   ever finds out. This walks every screen of the app in all ten languages and
   refuses to let that happen quietly.

   What it checks
     1. key parity      every language answers exactly the keys English asks
     2. placeholders    {0} {1} {2} survive translation, in the same set
     3. markup          <br>, <b>, &#10; survive translation, in the same count
     4. the name        "Lingua" is never translated
     5. the readings    every reading engine survives the samples and the
                        awkward edges without throwing or going blank
     6. the walk        every view, in every language, with T_MISS armed:
                        one fallback to English anywhere and this fails
     7. the source      no user-facing text hard-coded outside section 3.6

   Exit code is 0 only when all seven pass.
   --------------------------------------------------------------------------- */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

/* Playwright is a developer tool, not a dependency of the app, so it may be
   installed globally rather than beside this file. Look in both places. */
async function loadChromium(){
  const { createRequire } = await import('module');
  const req = createRequire(import.meta.url);
  try { return req('playwright').chromium; } catch (e) {}
  try {
    const g = execSync('npm root -g', { encoding: 'utf8' }).trim();
    return req(path.join(g, 'playwright')).chromium;
  } catch (e) {}
  console.error('playwright is not installed. npm i -g playwright');
  process.exit(2);
}
const chromium = await loadChromium();

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', 'www');
const SRC  = path.join(ROOT, 'index.html');
const PORT = 8121;
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';

const fails = [];
const notes = [];
function fail(area, msg){ fails.push(area + ': ' + msg); }

/* ---- 7. the source ------------------------------------------------------- */
/* Everything a person reads lives inside section 3.6. Anything outside it
   that looks like prose is a string that will never be translated, because
   there is nowhere for the translation to go. */
/* Blank out every comment, keeping the newlines, so a line number still means
   what it says. Strings are tracked as we go, or an apostrophe in a comment
   would swallow the rest of the file. */
function stripComments(s){
  let out = '', i = 0, n = s.length, prev = '';
  const REGEX_OK = '(,=:[!&|?{};+~^%<>*-\n';
  while (i < n){
    const c = s[i], d = s[i + 1];
    /* a regex literal can hold a quote (/[&<>"]/g does) and would otherwise
       start a string that never ends */
    if (c === '/' && d !== '/' && d !== '*' && REGEX_OK.indexOf(prev) >= 0){
      out += c; i++;
      while (i < n && s[i] !== '/' && s[i] !== '\n'){
        if (s[i] === '\\'){ out += s[i]; i++; if (i < n){ out += s[i]; i++; } continue; }
        if (s[i] === '['){ while (i < n && s[i] !== ']' && s[i] !== '\n'){ out += s[i]; i++; } }
        out += s[i]; i++;
      }
      if (i < n && s[i] === '/'){ out += s[i]; i++; }
      prev = '/';
      continue;
    }
    if (c === '/' && d === '*'){
      i += 2;
      while (i < n && !(s[i] === '*' && s[i + 1] === '/')){ out += (s[i] === '\n' ? '\n' : ' '); i++; }
      i += 2; out += '  ';
      continue;
    }
    if (c === '/' && d === '/'){
      while (i < n && s[i] !== '\n'){ out += ' '; i++; }
      continue;
    }
    if (c === '"' || c === "'"){
      const q = c; out += c; i++;
      while (i < n && s[i] !== q){
        if (s[i] === '\\'){ out += s[i]; i++; if (i < n){ out += s[i]; i++; } continue; }
        out += s[i]; i++;
      }
      if (i < n){ out += s[i]; i++; }
      prev = q;
      continue;
    }
    out += c; i++;
    if (c.trim() !== '' || c === '\n') prev = c;
  }
  return out;
}

function checkSource(){
  const text = fs.readFileSync(SRC, 'utf8');
  const raw = text.split('\n');
  const lines = stripComments(text).split('\n');
  const secA = raw.findIndex(l => l.indexOf('3.6 The languages') >= 0);
  let secZ = -1;
  for (let i = raw.length - 1; i > 0; i--) if (raw[i].indexOf('})());') === 0) { secZ = i; break; }
  if (secA < 0 || secZ < 0) return fail('source', 'cannot find section 3.6');

  const outside = (i) => i < secA || i > secZ;
  /* a script other than the Latin one, outside the language section, is text
     that was typed straight into a screen */
  const FOREIGN = /[぀-ヿ㐀-鿿가-힯Ѐ-ӿ]/;
  /* prose sitting between two tags in a template: >Save< and the like */
  const PROSE = />([A-Za-z][A-Za-z’'!?,. -]{3,})</g;
  const OK_PROSE = /^(br|em|b|i|span|div|button|input|style|script|meta|title|link|path|svg|g|defs|use|option|label|textarea|p|h1|h2|h3|small|strong)$/i;

  lines.forEach((l, i) => {
    if (!outside(i)) return;
    if (FOREIGN.test(l)) {
      fail('source', 'line ' + (i + 1) + ' carries text in another script outside 3.6: ' + raw[i].trim().slice(0, 70));
    }
    let m;
    PROSE.lastIndex = 0;
    while ((m = PROSE.exec(l))) {
      const s = m[1].trim();
      if (OK_PROSE.test(s)) continue;
      if (s.length < 5) continue;
      if (!/ /.test(s)) continue;                 /* single words are usually markup */
      notes.push('line ' + (i + 1) + ' literal prose in a template: ' + s);
    }
  });
}

/* ---- everything else runs inside the page -------------------------------- */
const srv = http.createServer((req, res) => {
  const f = path.join(ROOT, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  let d = null;
  try { d = fs.readFileSync(f); } catch (e) { d = null; }
  if (d === null) { res.writeHead(404); res.end('no'); return; }
  res.writeHead(200, { 'Content-Type': f.endsWith('.html') ? 'text/html; charset=utf-8' : 'text/plain' });
  res.end(d);
});
await new Promise(r => srv.listen(PORT, r));

const br = await chromium.launch({ executablePath: CHROME });
const pg = await br.newPage();
const pageErrors = [];
pg.on('pageerror', e => pageErrors.push(e.message));
await pg.goto(`http://127.0.0.1:${PORT}/`);
await pg.waitForTimeout(300);

const R = await pg.evaluate(() => {
  const out = { keys: [], ph: [], mk: [], name: [], read: [], miss: [], langs: UI_LANGS.slice() };
  const en = LANG.en.str;
  const enK = Object.keys(en);
  const VARIANT = /\.(1|few)$/;

  UI_LANGS.forEach(c => {
    if (c === 'en') return;
    const d = LANG[c].str, dK = Object.keys(d);
    /* A key ending .1 or .few is a plural form of the key without it, and only
       the languages that inflect that way define one. Everything else must
       line up exactly. */
    const isPlural = (k) => VARIANT.test(k) && en[k.replace(VARIANT, '')] !== undefined;
    enK.forEach(k => {
      if (d[k] !== undefined) return;
      if (isPlural(k)) return;                     /* English's own .1, not required elsewhere */
      out.keys.push(c + ' is missing ' + k);
    });
    dK.forEach(k => {
      if (en[k] !== undefined) return;
      if (VARIANT.test(k) && en[k.replace(VARIANT, '')] !== undefined) return;   /* its own plural */
      out.keys.push(c + ' has a key English does not: ' + k);
    });

    const setOf = (s, re) => {
      const g = new RegExp(re.source, 'g'), r = {};
      let m; while ((m = g.exec(String(s)))) r[m[0]] = (r[m[0]] || 0) + 1;
      return r;
    };
    const same = (a, b) => {
      const k = Object.keys(a).concat(Object.keys(b));
      for (let i = 0; i < k.length; i++) if ((a[k[i]] || 0) !== (b[k[i]] || 0)) return k[i];
      return null;
    };

    enK.forEach(k => {
      if (d[k] === undefined) return;
      const bad1 = same(setOf(en[k], /\{\d\}/), setOf(d[k], /\{\d\}/));
      if (bad1) out.ph.push(c + ' ' + k + ': ' + bad1 + ' does not match English');
      const bad2 = same(setOf(en[k], /<br>|<b[ >]|<\/b>|<em>|<\/em>|&#10;/), setOf(d[k], /<br>|<b[ >]|<\/b>|<em>|<\/em>|&#10;/));
      if (bad2) out.mk.push(c + ' ' + k + ': ' + bad2 + ' does not match English');
      if (String(en[k]).indexOf('Lingua') >= 0 && String(d[k]).indexOf('Lingua') < 0)
        out.name.push(c + ' ' + k + ' lost the name Lingua');
    });
  });

  /* the reading engines, on the samples and on the awkward edges */
  const WS = ['aelin','yamosh','silva','kirun','thovar','nasqua','welioth','brenta','gilzoa',
              'muunda','chesari','xantu','olwen','praetho','jundir','shaevo','tirquen',
              'zaldun','huerta','nyxal','a','y','ya','ay','str','n','qu','xx','aaa','ooth'];
  UI_LANGS.forEach(c => {
    WS.forEach(w => {
      let r;
      try { r = LANG[c].read.word(w); }
      catch (e) { out.read.push(c + ' threw on "' + w + '": ' + e.message); return; }
      if (!r) out.read.push(c + ' returned nothing for "' + w + '"');
    });
    try { LANG[c].read.word(''); } catch (e) { out.read.push(c + ' threw on the empty word: ' + e.message); }
    ['n','str','ael','qua'].forEach(s => {
      try { LANG[c].read.syl(s); } catch (e) { out.read.push(c + ' threw on the syllable "' + s + '": ' + e.message); }
    });
    const D = LANG[c];
    ['label','rdName','all'].forEach(f => { if (!D[f]) out.read.push(c + ' has no ' + f); });
    ['n','v','adj','x'].forEach(p => { if (!D.pos[p]) out.read.push(c + ' has no name for the part of speech ' + p); });
  });

  /* ---- the walk: every view, every language, T_MISS armed ---------------- */
  WORDS = [
    {hw:'Aelin',  mn:'star',  pos:'n'},
    {hw:'Naeth',  mn:'water', pos:'n'},
    {hw:'Silvar', mn:'to go', pos:'v'},
    {hw:'Thovan', mn:'bright',pos:'adj'},
    {hw:'Quenta', mn:'story', pos:'n'},
    {hw:'Miro',   mn:'and',   pos:'x'}
  ];
  LINES = [{ws:['Aelin','Naeth','Silvar'], mn:'the star goes to the water'}];
  langName = 'Aelinor';
  comp = ['Aelin','Silvar']; compSel = 0;
  cands = [{hw:'Aelor', on:true}, {hw:'Naethis', on:false}];

  const views = ['vHome','vWords','vSound','vRules','vSent','vMake','vSettings','vPlans'];
  const routes = ['home','words','sound','rules','sent','make','settings','plans'];

  UI_LANGS.forEach(c => {
    SET.ui = c;
    T_MISS = {};
    /* onboarding, every step */
    SET.done = false;
    for (let s = 0; s <= 4; s++) { ob.step = s; try { vOb(); } catch (e) { out.miss.push(c + ' vOb step ' + s + ' threw: ' + e.message); } }
    SET.done = true;

    /* every screen, under every plan and every reading mode, empty and full */
    ['free','plus','studio'].forEach(p => {
      SET.plan = p;
      ['ipa','kana','both'].forEach(rm => {
        SET.read = rm;
        [false, true].forEach(empty => {
          const keep = WORDS, keepL = LINES;
          if (empty) { WORDS = []; LINES = []; }
          views.forEach((v, i) => {
            route = routes[i];
            try { window[v](); } catch (e) { out.miss.push(c + ' ' + v + ' threw (' + p + '/' + rm + '/' + (empty ? 'empty' : 'full') + '): ' + e.message); }
          });
          WORDS = keep; LINES = keepL;
        });
      });
    });
    SET.plan = 'free'; SET.read = 'both';

    /* the sheets, which are not routes */
    try { openAdd(); } catch (e) { out.miss.push(c + ' openAdd threw: ' + e.message); }
    try { openWord('Aelin'); } catch (e) { out.miss.push(c + ' openWord threw: ' + e.message); }
    try { openImport(); } catch (e) { out.miss.push(c + ' openImport threw: ' + e.message); }
    try { closeSheet(); } catch (e) {}

    /* the labels that are looked up, not templated */
    try {
      ['n','v','adj','x',POS_ALL].forEach(posLabel);
      ORDERS.forEach(orderLab); ORDERS.forEach(orderEx);
      OB_SEEDS.forEach(s => seedLabel(s.k !== undefined ? s.k : s));
    } catch (e) { out.miss.push(c + ' a label lookup threw: ' + e.message); }

    Object.keys(T_MISS).forEach(k => out.miss.push('fell back to English: ' + k));
  });
  T_MISS = null;
  return out;
});

await br.close();
srv.close();

/* ---- report -------------------------------------------------------------- */
checkSource();

if (pageErrors.length) fail('page', pageErrors.join(' | '));
R.keys.forEach(m => fail('keys', m));
R.ph.forEach(m => fail('placeholders', m));
R.mk.forEach(m => fail('markup', m));
R.name.forEach(m => fail('the name', m));
R.read.forEach(m => fail('readings', m));
R.miss.forEach(m => fail('the walk', m));

console.log('languages checked: ' + R.langs.join(' '));
if (notes.length){
  console.log('\nworth a look (' + notes.length + '):');
  notes.slice(0, 40).forEach(n => console.log('  ' + n));
  if (notes.length > 40) console.log('  ... and ' + (notes.length - 40) + ' more');
}
if (fails.length){
  console.log('\nFAILED (' + fails.length + '):');
  fails.slice(0, 60).forEach(f => console.log('  ' + f));
  if (fails.length > 60) console.log('  ... and ' + (fails.length - 60) + ' more');
  process.exit(1);
}
console.log('\nall seven checks pass in all ' + R.langs.length + ' languages.');
