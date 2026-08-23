/* ---------------------------------------------------------------------------
   tools/i18n-check.mjs — the net under the translations.

   Run it before every release:   node tools/i18n-check.mjs

   A missing translation is the one bug that ships silently: the screen still
   renders, the button still works, and only a person reading that language
   ever finds out. This walks every screen of the app in all ten languages and
   refuses to let that happen quietly.

   What it checks
     0. no shadowing    no file defines the same key twice. The second wins
                        silently, so the first is a translation nobody will
                        ever see and a change nobody's edit will take effect
     1. key parity      every language answers exactly the keys English asks
     2. placeholders    {0} {1} {2} survive translation, in the same set
     3. markup          <br>, <b>, &#10; survive translation, in the same count
     4. the name        "Lingua" is never translated
     5. the readings    every reading engine survives the samples and the
                        awkward edges without throwing or going blank
     6. the walk        every view, in every language, with T_MISS armed:
                        one fallback to English anywhere and this fails
     7. the source      no user-facing text hard-coded in a screen file;
                        nothing spoken through toast/alert/confirm/prompt as a
                        quoted literal, and nothing painted onto a canvas as
                        one — neither reaches a screen, so check 8 cannot see
                        them. And no screen names a page itself: what a page
                        is called lives in PAGES and comes back through
                        pageName()
     8. the mirror      every view rendered in a pseudo-language whose every
                        string is spelled with accented look-alikes. Anything
                        that comes out in plain letters never passed through
                        t() at all — that is text hard-coded into a template,
                        which no amount of translating would ever reach. Reads
                        placeholders, titles and aria-labels too: they are read
                        by a person but do not look like copy.

   Checks 6 and 8 find the views by asking the page for them (every global
   named v + a capital), so a screen written next year is walked the day it is
   written. Nobody has to remember to add it here.

   What it cannot see, so that nobody mistakes silence for safety:
     - anything outside www/. The iOS side (Info.plist, the store
       listing, permission prompts) has no localisation at all yet
     - whether a translation is any good. It proves a string exists and is
       shaped right; it cannot read Korean
     - a right-to-left language. Nothing sets dir=rtl; Arabic or Hebrew would
       need layout work this check would happily pass
     - plural systems beyond one / few. tn() models English and Russian;
       Arabic and Polish would need more forms
     - a new way of speaking to a person. The list in SPEAKS is by hand;
       add to it when something new starts talking

   Exit code is 0 only when all nine pass.
   --------------------------------------------------------------------------- */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { obStates } from './fixture.mjs';
import { chromium, LAUNCH } from './browser.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', 'www');
/* Everything a screen is built out of: index.html and every .js in www/, asked
   for rather than listed. It was a list, and a list of source files is a thing
   that goes quietly out of date -- a file split in two is half-checked, and a
   new one is not checked at all, in both cases silently.

   The ten language files are excluded because they are where foreign text
   belongs. Anything else that has no user-facing text in it is named here
   with the reason, so that adding to this is a decision rather than a habit. */
const NO_TEXT = {
  'otf5.js': 'the OpenType writer: byte tables, no words'
};
const APP_SRC = ['index.html'].concat(
  fs.readdirSync(ROOT).filter(f => f.endsWith('.js') && !NO_TEXT[f]).sort()
).map(f => path.join(ROOT, f));
const PORT = 8121;
/* Use the browser this machine already has if there is one; on a CI runner
   there is not, and Playwright's own copy is the right answer. */

const fails = [];
const notes = [];
function fail(area, msg){ fails.push(area + ': ' + msg); }

/* ---- 7. the source ------------------------------------------------------- */
/* Everything a person reads lives in one of the ten www/i18n files. Prose in a
   screen file is a string that will never be translated, because there is
   nowhere for the translation to go. */
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
  /* The app used to be one file, and this check meant "anywhere outside
     section 3.6". It is several files now, so it means "any file that is not
     one of the ten languages" — which is the same rule, stated where it can no
     longer drift: a new screen file is covered the moment it exists, and a
     new language needs nothing. */
  APP_SRC.forEach((file) => {
    const rel = path.basename(file);
    const raw = fs.readFileSync(file, 'utf8').split('\n');
    const lines = stripComments(raw.join('\n')).split('\n');

    /* a script other than the Latin one, in a screen file, is text that was
       typed straight into the app instead of into a language */
    const FOREIGN = /[぀-ヿ㐀-鿿가-힯Ѐ-ӿ]/;
    /* prose sitting between two tags in a template: >Save< and the like */
    const PROSE = />([A-Za-z][A-Za-z’\'!?,. -]{3,})</g;
    const OK_PROSE = /^(br|em|b|i|span|div|button|input|style|script|meta|title|link|path|svg|g|defs|use|option|label|textarea|p|h1|h2|h3|small|strong)$/i;
    /* the functions that speak to a person without going through a screen */
    const SPEAKS = /\b(toast|alert|confirm|prompt)\s*\(\s*([\'"][^\'"]*[\'"])/g;
    /* Text painted on a canvas is the same blind spot one step further out.
       Check 8 renders every screen into a mirror and reads what came back —
       but a canvas returns nothing to read, so a word drawn on the card would
       have shipped in English to all ten languages with the walk still green.
       The card is the one thing in this app that leaves the phone, so that is
       exactly the wrong place for it. What is painted must come from t() or
       from the language itself. "Lingua" is never translated. */
    const PAINTS = /\b(fillText|strokeText)\s*\(\s*([\'"][^\'"]*[\'"])/g;
    const OK_PAINT = /^[\'"](LINGUA|Lingua)[\'"]$/;
    /* What a page is called lives in PAGES, once, and is read back through
       pageName(). A screen that reaches for t('tab.x') itself has named that
       page a second time, in a second file, and the two drift the first time
       one of them is edited -- which is how the feed and the search tab came
       to be named twice over, with `tab.find` doing duty for two different
       screens at once. shell.js is where PAGES is, so it is the one file
       allowed to say these out loud. */
    const NAMES = /\bt\(\s*[\'"]tab\.[A-Za-z0-9.]*[\'"]/g;

    /* One table is words in other people's languages ON PURPOSE, and it is
       the one thing on this page that must NOT be translated: IPA_IN says
       where a sound is heard, and pen is pen in all ten. Translating "パン"
       would be answering a different question -- what a Japanese word means
       -- instead of the one asked, which is what that sound sounds like in
       the mouth of somebody who has it. Named, and bounded by the table's
       own braces, so a foreign string anywhere else in ipa.js still fails. */
    let inTable = false;

    lines.forEach((l, i) => {
      const where = rel + ' line ' + (i + 1);
      if (rel === 'ipa.js' && /^var IPA_IN\s*=/.test(l)) inTable = true;
      else if (inTable && /^\};/.test(l)) inTable = false;
      if (FOREIGN.test(l) && !inTable) {
        fail('source', where + ' carries text in another script: ' + raw[i].trim().slice(0, 70));
      }
      let m;
      PROSE.lastIndex = 0;
      while ((m = PROSE.exec(l))) {
        const t = m[1].trim();
        if (OK_PROSE.test(t)) continue;
        if (t.length < 5) continue;
        if (!/ /.test(t)) continue;                 /* single words are usually markup */
        notes.push(where + ' literal prose in a template: ' + t);
      }

      /* Some text never reaches a template at all: the app says it out loud
         through one of these. Check 8 renders screens, so it cannot see them —
         nothing here is called during a render. The rule is simple enough to
         read off the source instead: what they are handed must come from t(),
         never from a quotation mark. Add to the list when something new speaks. */
      SPEAKS.lastIndex = 0;
      while ((m = SPEAKS.exec(l))) {
        fail('source', where + ' says something in English out loud: ' +
          m[1] + '(' + m[2].slice(0, 40) + '…  — it must be t(…), not a literal');
      }
      if (rel !== 'shell.js') {
        NAMES.lastIndex = 0;
        while ((m = NAMES.exec(l))) {
          fail('source', where + ' names a page itself: ' + m[0] +
            ') — a page is named in PAGES and read back with pageName(r)');
        }
      }
      PAINTS.lastIndex = 0;
      while ((m = PAINTS.exec(l))) {
        if (OK_PAINT.test(m[2])) continue;
        fail('source', where + ' paints a literal onto a canvas: ' +
          m[1] + '(' + m[2].slice(0, 40) + '…  — no mirror can read a canvas, ' +
          'so it must be t(…) or the language\'s own');
      }
    });
  });
}

/* ---- 0. no key defined twice in one file ---------------------------------
   Read off the source, not off the page: by the time a language file has been
   evaluated the second definition has already overwritten the first, and the
   page cannot tell that there ever was one. A shadowed key is a translation
   nobody will ever see and, worse, one that swallows an edit silently. */
function checkShadow(){
  fs.readdirSync(path.join(ROOT, 'i18n')).forEach((f) => {
    if (!f.endsWith('.js')) return;
    const src = fs.readFileSync(path.join(ROOT, 'i18n', f), 'utf8');
    const seen = {}, re = /\n *['"]([A-Za-z][A-Za-z0-9._]*)['"] *:/g;
    let m;
    while ((m = re.exec(src))){
      if (seen[m[1]]) fail('shadow', 'i18n/' + f + ' defines ' + m[1] + ' twice — the second one wins and the first is dead');
      seen[m[1]] = 1;
    }
  });
}
checkShadow();

/* ---- everything else runs inside the page -------------------------------- */
/* The app is several files now, and a browser will refuse to run a script
   served as text/plain when it is told not to sniff. Say what things are. */
const mime = (f) => f.endsWith('.html') ? 'text/html; charset=utf-8'
  : f.endsWith('.js') ? 'application/javascript; charset=utf-8'
  : f.endsWith('.css') ? 'text/css; charset=utf-8'
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
/* The door's faces, from the same list act-check walks. The mirror rendered
   vOb once per step and the door has five faces at step 0 -- sign in, make
   an account, the six digits, the reset, and saying who you are -- so four
   of them were screens the mirror had never seen, which is where a
   hard-coded string sits forever. */
await pg.evaluate('window.__obStates = ' + obStates.toString());

const R = await pg.evaluate(() => {
  const out = { keys: [], ph: [], mk: [], name: [], read: [], miss: [], hard: [],
                langs: UI_LANGS.slice(), walked: [], mirrored: 0 };
  const en = LANG.en.str;
  const enK = Object.keys(en);
  out.enKeys = enK.slice();
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
  cands = [{q:['a','e','l','o','r'], on:true}, {q:['n','e','\u03b8','i','s'], on:false}];

  /* Ask the page which views exist rather than keeping a list here — a view
     added later is covered without anyone remembering to come back. vOb is
     the onboarding and is driven by its own step counter, so it is separate.
     Every view is a global named v + a capital and takes no arguments; the
     route it belongs to is its name in lower case. */
  const views  = Object.keys(window).filter(k =>
    /^v[A-Z]/.test(k) && typeof window[k] === 'function' && k !== 'vOb');
  const routes = views.map(v => v.slice(1).toLowerCase());
  /* A screen is a route and its argument, and several screens read that
     argument. vSet with no argument takes none of its six branches; vGram
     with none renders the list instead of a stage. So a walk that only ever
     asks for the argument-less face never renders the inside of a settings
     room or a grammar stage at all.

     Key parity would still catch a key that is missing a translation there.
     What it cannot catch is a string that was never a key -- and the mirror,
     the only check that can, was not looking at those screens. A hard-coded
     line inside a settings room passed all nine checks.

     Asked of the page, like the views themselves, so a room or a stage added
     later is walked the day it is added. tools/act-check.mjs walks the same
     ground for the same reason; see walkArg there. */
  const argsOf = (r) =>
    r === 'set'  ? [null].concat(SETS.map(x => x.id)) :
    r === 'gram' ? [null].concat(stAll().map(p => p.id)) :
    r === 'ltset' ? [null].concat(LT_KINDS) :
    r === 'kb' ? [null].concat(kbBoards().map((x, i) => String(i))) :
    r === 'fm' ? ['tira'] :
    r === 'thread' ? [null].concat(postAll().map(x => x.id)) :
    r === 'photo' ? [null].concat(postAll().filter(x => postPics(x).length).map(x => x.id + ':0')) :
    [null];
  /* The sheets are opened, not routed. openWord needs a headword; the rest
     take nothing. */
  /* openForm is the mechanism every one of these goes through, not a screen
     of its own; calling it with a stub argument renders that argument. */
  const opens  = Object.keys(window).filter(k =>
    /^open[A-Z]/.test(k) && typeof window[k] === 'function' && k !== 'openForm');
  const callOpen = (o) => (window[o].length ? window[o]('Aelin') : window[o]());
  out.walked = views.concat(opens).concat(['vOb']).sort();
  if (views.length < 5) out.miss.push('only found ' + views.length + ' views — the view discovery is broken');

  UI_LANGS.forEach(c => {
    SET.ui = c;
    T_MISS = {};
    /* onboarding, every step. The door is shown for SET.obback rather than
       for a step number now, so the note is cleared before the steps and
       after the faces -- one left behind hides every step of every language
       after it. */
    SET.done = false;
    SET.obback = null;
    for (let s = 0; s < OB_STEPS; s++) { ob.step = s; try { vOb(); } catch (e) { out.miss.push(c + ' vOb step ' + s + ' threw: ' + e.message); } }
    /* and every face a step has, which is the door's five and the borrow
       list -- asked of tools/fixture.mjs, so a face added there is mirrored
       the day it is added rather than the day somebody remembers this line. */
    window.__obStates().forEach(([label, run]) => {
      try { run(); } catch (e) { out.miss.push(c + ' ob "' + label + '" threw: ' + e.message); }
    });
    ob.step = 0; ob.mode = 'draw'; ob.pick = ''; OBM.mode = 'in'; SET.obback = null;
    SET.done = true;

    /* every screen, under every plan and every reading mode, empty and full */
    ['free','plus'].forEach(p => {
      SET.plan = p;
      ['ipa','kana','both'].forEach(rm => {
        SET.read = rm;
        [false, true].forEach(empty => {
          const keep = WORDS, keepL = LINES;
          if (empty) { WORDS = []; LINES = []; }
          views.forEach((v, i) => {
            /* a screen is a route AND its argument now, and several read that
               argument -- so put the trail where the screen expects it rather
               than leaving whatever the last opened form left behind */
            argsOf(routes[i]).forEach(a => {
              route = routes[i]; NAV = [{ r: route, a: a }];
              try { window[v](); } catch (e) { out.miss.push(c + ' ' + v + (a ? ':' + a : '') + ' threw (' + p + '/' + rm + '/' + (empty ? 'empty' : 'full') + '): ' + e.message); }
            });
          });
          WORDS = keep; LINES = keepL;
        });
      });
    });
    SET.plan = 'free'; SET.read = 'both';

    /* The search tab has three faces and only one of them is what a plain
       render gives you: the rest, a list of results, and what one pressed
       sound or letter is in. A view walk would never reach the other two. */
    try {
      fq = ''; fpick = null; findBodyHTML();
      fq = 'a'; findBodyHTML();
      fq = ''; fpick = { k: 's', v: (addedSnd()[0] || 'a') }; findBodyHTML();
      fpick = { k: 'l', v: ((LETTERS[0] || {}).id || 'x') }; findBodyHTML();
      fq = ''; fpick = null;
    } catch (e) { out.miss.push(c + ' the search tab threw: ' + e.message); }

    /* the sheets, which are not routes */
    opens.forEach(o => {
      try { callOpen(o); } catch (e) { out.miss.push(c + ' ' + o + ' threw: ' + e.message); }
    });
    try { closeSheet(); } catch (e) {}

    /* the labels that are looked up, not templated */
    try {
      POS.concat([POS_ALL]).forEach(posLabel);
      /* Word order is three roles, looked up one at a time. The three places
         a word can stand are two sides each, and which side of what depends
         on the decision, so both halves are walked. A stage with none of its
         words made yet shows the "write a few more" line instead of the
         buttons, so a render alone would never reach these. */
      ['S','O','V'].forEach(k => t('gram.role.' + k));
      ['adj','negp','adp'].forEach(id => ['before','after'].forEach(o => gPosLab(id, o)));
      /* the seed words went with the old onboarding: */ // OB_SEEDS.forEach(s => seedLabel(s.k !== undefined ? s.k : s));
    } catch (e) { out.miss.push(c + ' a label lookup threw: ' + e.message); }

    Object.keys(T_MISS).forEach(k => out.miss.push('fell back to English: ' + k));
  });
  T_MISS = null;

  /* ---- the mirror: a language spelled in look-alikes ---------------------
     Every English string is respelled with accented letters, then every view
     is rendered in it. Anything that comes back in plain a-z was written into
     a template instead of into a string table, and would stay English forever
     in all nine other languages. T_MISS cannot see this: text that never asks
     t() for anything never registers as missing. */
  const MIRROR = {a:'å',b:'ƀ',c:'ç',d:'đ',e:'é',f:'ƒ',g:'ğ',h:'ħ',i:'í',j:'ĵ',
    k:'ķ',l:'ĺ',m:'ḿ',n:'ñ',o:'ø',p:'ƥ',q:'ǫ',r:'ŕ',s:'š',t:'ţ',u:'ü',v:'ṽ',
    w:'ŵ',x:'ẋ',y:'ý',z:'ž',A:'Å',B:'Ɓ',C:'Ç',D:'Đ',E:'É',F:'Ƒ',G:'Ğ',H:'Ħ',
    I:'Í',J:'Ĵ',K:'Ķ',L:'Ĺ',M:'Ḿ',N:'Ñ',O:'Ø',P:'Ƥ',Q:'Ǫ',R:'Ŕ',S:'Š',T:'Ţ',
    U:'Ü',V:'Ṽ',W:'Ŵ',X:'Ẋ',Y:'Ý',Z:'Ž'};
  /* Tags, entities and {0} slots are structure, not words: they pass through
     untouched, and so does the name of the app. */
  function mirror(s){
    s = String(s); let o = '', i = 0;
    while (i < s.length){
      const c = s[i];
      if (c === '<'){ let j = s.indexOf('>', i); if (j < 0) j = s.length - 1; o += s.slice(i, j + 1); i = j + 1; continue; }
      if (c === '&'){ const j = s.indexOf(';', i); if (j >= 0 && j - i < 8){ o += s.slice(i, j + 1); i = j + 1; continue; } }
      if (c === '{' && /^\{\d\}/.test(s.slice(i))){ o += s.slice(i, i + 3); i += 3; continue; }
      if (s.slice(i, i + 6) === 'Lingua'){ o += 'Lingua'; i += 6; continue; }
      o += (MIRROR[c] || c); i++;
    }
    return o;
  }
  const zz = {};
  Object.keys(LANG.en.str).forEach(k => { zz[k] = mirror(LANG.en.str[k]); });
  defLang('zz', { label: 'ZZ', rdName: mirror('reading'), all: mirror('all'),
    /* Mirrored from English's own table rather than written out here, so
       adding a part of speech cannot leave the pseudo-language behind and
       have the key itself come out as plain text on the screen. */
    pos: (function(){
      const o = {}, en = LANG.en.pos;
      Object.keys(en).forEach(k => { o[k] = mirror(en[k]); });
      return o;
    })(),
    read: LANG.en.read, str: zz });

  /* Plain letters that are allowed to stay plain: the app's name, the names of
     the paid tiers, the linguistic notation for word order, the roman numerals
     that number the chapters, and the two halves of the wordmark. Everything
     here is a proper noun or a symbol — none of it is a sentence. */
  const PLAIN = {};
  'lingua free plus sov svo vso osv ovs vos ipa csv i ii iii iv v vi vii viii ix x lin ua g'
    .split(' ').forEach(w => { PLAIN[w] = 1; });
  /* and everything that is data: the words themselves, their meanings, their
     readings in every language, their sounds and their syllables */
  function learn(s){ String(s).split(/[^A-Za-z]+/).forEach(w => { if (w) PLAIN[w.toLowerCase()] = 1; }); }
  /* Everything a word can come out as. It is its sounds, so the IPA is the
     sequence itself; the respelling is read off the Latin approximation of
     that sequence, in each of the ten. None of it is copy, so none of it may
     be mistaken for untranslated copy. */
  function learnWord(hw){
    let seq = [];
    try { seq = seqOf(hw); } catch (e) { seq = []; }
    learn(hw); learnSeq(seq);
  }
  function learnSeq(seq){
    learn(seq.join('')); learn(seq.join(' '));
    try { learn(phIpa(seq)); } catch (e) {}
    const rom = (() => { try { return phRoman(seq); } catch (e) { return ''; } })();
    learn(rom);
    try { phCut(seq).forEach(p => learn(p.on.join('') + p.nu.join('') + p.co.join(''))); } catch (e) {}
    try { syl(rom).forEach(s => UI_LANGS.forEach(c => { try { learn(LANG[c].read.syl(s)); } catch (e) {} })); } catch (e) {}
    UI_LANGS.forEach(c => { try { learn(LANG[c].read.word(rom)); } catch (e) {} });
  }
  /* A word carries its sounds now, and what the screens show is built from
     those rather than from the spelling: the sequence, the IPA of it, and the
     syllables it falls into. All three are data, and none of them changes
     with the language being read -- which is the point of them. */
  WORDS.forEach(w => {
    learnWord(w.hw); learn(w.mn);
    try { learn((w.ph || wPh(w)).join(' ')); } catch (e) {}
    try { learn(phIpa(wPh(w))); } catch (e) {}
    try { learn(wordSyl(w)); } catch (e) {}
  });
  LINES.forEach(l => { learn(l.mn); l.ws.forEach(learnWord); });
  learn(langName);
  cands.forEach(c => { try { learnSeq(c.q); } catch (e) {} });
  UI_LANGS.forEach(c => { learn(LANG[c].label); learn(LANG[c].rdName); });
  /* Where a sound is heard, which is words in other people's languages ON
     PURPOSE: pen is pen in all ten, and translating it would answer a
     different question. Learned from the table rather than exempted by name,
     so an example added there is covered the day it is added. */
  Object.keys(IPA_IN).forEach(k => IPA_IN[k].forEach(x => learn(x[1])));
  /* And the names the device already has for the days of the week, which is
     what a calendar column falls back to when the language has not named that
     day yet. The widget asks iOS for them and the preview asks the browser;
     neither string was written in this repository, so neither is copy the
     mirror can ask to see translated. Learned in every language the app
     speaks, because whose phone it is decides which one comes back. */
  for (let i = 0; i < 7; i++){
    const d = new Date(Date.UTC(1970, 0, 4 + i));
    [undefined].concat(UI_LANGS).forEach(loc => {
      ['narrow','short','long'].forEach(w => {
        try { learn(d.toLocaleDateString(loc, { weekday: w, timeZone: 'UTC' })); } catch (e) {}
      });
    });
  }

  const seen = {};
  function words(where, s, how){
    const re = /[A-Za-z][A-Za-z'’]*(?:[ \-][A-Za-z'’]+)*/g;
    let m;
    while ((m = re.exec(String(s)))){
      const w = m[0].trim();
      if (w.length < 3) continue;
      if (!w.split(/[^A-Za-z]+/).filter(x => x && !PLAIN[x.toLowerCase()]).length) continue;
      const key = where + ' ' + how + ' "' + w + '" in every language';
      if (!seen[key]){ seen[key] = 1; out.hard.push(key); }
    }
  }
  /* The words a person reads are not only between the tags. A placeholder, a
     tooltip, a screen-reader label — all of them are read, and all of them are
     easy to leave in English because they do not look like copy. */
  const ATTRS = /(?:placeholder|title|alt|aria-label|aria-description)\s*=\s*"([^"]*)"/gi;
  function look(where, html){
    out.mirrored++;
    const raw = String(html);
    words(where, raw.replace(/<[^>]*>/g, '\n').replace(/&[a-z#0-9]+;/g, ' '), 'shows');
    let a; ATTRS.lastIndex = 0;
    while ((a = ATTRS.exec(raw))) words(where, a[1], 'has an attribute reading');
  }

  SET.ui = 'zz'; SET.done = false; SET.obback = null;
  for (let s = 0; s < OB_STEPS; s++){ ob.step = s; try { look('vOb step ' + s, vOb()); } catch (e) {} }
  window.__obStates().forEach(([label, run]) => {
    try { look('ob "' + label + '"', run()); } catch (e) {}
  });
  ob.step = 0; ob.mode = 'draw'; ob.pick = ''; OBM.mode = 'in'; SET.obback = null;
  SET.done = true;
  ['free','plus'].forEach(p => {
    SET.plan = p;
    [false, true].forEach(empty => {
      const keep = WORDS, keepL = LINES;
      if (empty){ WORDS = []; LINES = []; }
      views.forEach((v, i) => {
        argsOf(routes[i]).forEach(a => {
          route = routes[i]; NAV = [{ r: route, a: a }];
          try { look(v + (a ? ':' + a : ''), window[v]()); } catch (e) {}
        });
      });
      WORDS = keep; LINES = keepL;
    });
  });
  /* The sheets are pages now, so what they render is FORM.html and no longer
     the sheet element -- which is empty forever. Reading the old place would
     have quietly stopped checking every form in the app. */
  opens.forEach(o => {
    try {
      callOpen(o);
      look(o, (typeof FORM !== 'undefined' && FORM) ? FORM.html : '');
    } catch (e) {}
  });
  try { closeSheet(); } catch (e) {}

  return out;
});

await br.close();
srv.close();

/* ---- 10. a key nothing asks for ------------------------------------------
   The other direction, and until now there was only one. Check 1 says the ten
   languages answer the same key set -- en is the source of truth and the other
   nine must match it exactly. Nothing said anything about a key en itself has
   that no screen ever asks for. That is the same shape act-check holds on
   act-map.js ("an entry no screen ever names"), and i18n had half of it.

   It matters because a dead key is not one string, it is ten: it was written
   once and then translated nine times, and it goes on being carried through
   every rebuild of the key set looking exactly like a live one. `ai.*` was
   six keys and sixty strings -- the advisor went out with Studio and its
   translations stayed.

   Read off the source, not off the page: a key is asked for by a screen, and
   the page cannot see which of its strings were never reached.

   A key can be asked for two ways and both count:
     t('word.x')            -- named outright, anywhere in a source file
     t('word.' + kind)      -- built, so every key under that prefix is live
   The second is why this cannot be a plain "is the literal there" scan:
   ipa.p.bilabial is never written down anywhere and is asked for on every
   render of the IPA chart. */
function checkUnused(enKeys){
  if (!enKeys || !enKeys.length) return;
  const files = ['index.html'].concat(
    fs.readdirSync(ROOT).filter((f) => f.endsWith('.js')).map((f) => path.join(ROOT, f)));
  let src = '';
  for (const f of files) src += fs.readFileSync(path.isAbsolute(f) ? f : path.join(ROOT, f), 'utf8');

  /* every prefix that is BUILT rather than written: t('ipa.p.' + place) */
  const prefixes = [];
  for (const m of src.matchAll(/\bt\s*\(\s*['"]([A-Za-z][\w.]*\.)['"]\s*\+/g)) prefixes.push(m[1]);

  const named = new Set();
  for (const m of src.matchAll(/['"]([A-Za-z][\w.]*)['"]/g)) named.add(m[1]);

  /* A key ending .1 or .few is a plural form, and nothing names it: tn('x', n)
     picks the form at run time off the number. So it is alive exactly when its
     base is. Check 1 above already knows this shape; the first version of THIS
     one did not, and called fmr.with.1 dead while wordsheet.js:104 was saying
     tn('fmr.with', made) two lines from where the toast appears. Ten of the
     ninety-eight were that. */
  const VAR = /\.(1|few)$/;
  const asked = (k) => {
    if (named.has(k)) return true;
    for (const p of prefixes) if (k.indexOf(p) === 0) return true;
    return false;
  };
  const dead = enKeys.filter((k) => {
    if (asked(k)) return false;
    if (VAR.test(k) && asked(k.replace(VAR, ''))) return false;
    return true;
  }).sort();

  for (const k of dead)
    fail('unused', 'en defines ' + k + ' and no screen asks for it — ' +
      'it was translated into all ' + R.langs.length + ' languages and every ' +
      'one of those is dead too. Delete it from all of them, or say who says it.');
  return dead.length;
}
const deadKeys = checkUnused(R.enKeys);

/* ---- report -------------------------------------------------------------- */
checkSource();

if (pageErrors.length) fail('page', pageErrors.join(' | '));
R.keys.forEach(m => fail('keys', m));
R.ph.forEach(m => fail('placeholders', m));
R.mk.forEach(m => fail('markup', m));
R.name.forEach(m => fail('the name', m));
R.read.forEach(m => fail('readings', m));
R.miss.forEach(m => fail('the walk', m));
R.hard.forEach(m => fail('hard-coded', m));

console.log('source files read: ' + APP_SRC.length + ' (index.html and every .js in www/ but ' + Object.keys(NO_TEXT).join(', ') + ')');
console.log('languages checked: ' + R.langs.join(' '));
console.log('screens walked (' + R.walked.length + '): ' + R.walked.join(' '));
/* Printed because the walk and the mirror do not cover the same ground and
   nothing in a green run would ever say so. tools/act-check.mjs prints its own
   count for the same reason; when these two drift apart, the smaller one is a
   set of screens where a hard-coded string can sit forever. */
console.log('screens the mirror rendered: ' + R.mirrored);
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
console.log('\nall ten checks pass in all ' + R.langs.length + ' languages: and every key\n' +
  'en defines is one a screen asks for, outright or by a prefix it builds.');
