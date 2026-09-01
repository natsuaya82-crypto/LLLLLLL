/* What Apple asks for beside a price, asked of the screen.
   ---------------------------------------------------------------------
   App Store Review Guideline 3.1.2. An auto-renewing subscription may not be
   offered without, next to what it costs:

     · how long a term is, and what that term costs
     · a sentence saying it renews by itself until somebody stops it
     · working links to the terms of use and the privacy policy

   None of that has a failure a machine sees. The screen renders, every other
   check is green, the app works on a phone -- and the build is REFUSED, by a
   person, days later, with the whole release behind it. It is exactly the
   shape of bug this directory exists for, and nothing here held it: the ten
   www/i18n files had `set.terms` and `set.privacy` (two link captions in the
   account room) and not one sentence about renewal anywhere.

   WHAT THIS CHECK IS NOT: a copy of planTerms(). It never asks the source
   what it should have drawn. It opens the real app, walks to the real plans
   screen, and reads the DOM the browser actually built -- where the block
   sits relative to the prices and the Restore button, what the anchors' hrefs
   really resolve to, and what the browser COMPUTED for the border and the
   corner. A check that asserted `vPlans().indexOf(t('plan.renew')) !== -1`
   would stay green with the sentence rendered off the bottom of the page,
   inside a box, or on the wrong screen.

   Run: node tools/term-check.mjs                                        */
import { seed } from './fixture.mjs';
import { fileURLToPath } from 'url';
import path from 'path';
import { chromium, LAUNCH } from './browser.mjs';
const dir = path.dirname(fileURLToPath(import.meta.url));

const br = await chromium.launch(LAUNCH);
const pg = await br.newPage({ viewport: { width: 390, height: 844 } });
await pg.goto('file://' + path.join(dir, '..', 'www', 'index.html'));
await pg.waitForSelector('#splash', { state: 'detached', timeout: 10000 });

const r = await pg.evaluate(({ s }) => {
  /* The app as somebody who has used it: a language, letters, words. The
     plans screen draws this phone's own keyboard at the top of it, so a page
     with no letters on it is not the page anybody buys from. */
  eval('(' + s + ')()');
  var out = {};
  SET.done = true;

  /* The real screen, reached the way a person reaches it, and rendered by the
     app rather than by this file: go() then render() is what a press does. */
  function open(ui){
    SET.ui = ui; save();
    go('plans');
    render();
    return document.querySelector('.view');
  }
  /* Every element between two others, in the order the document has them.
     Document order is the claim -- 「next to the price」 -- and it is the one
     thing a string search cannot ask. */
  function between(root, after, before){
    var all = [].slice.call(root.querySelectorAll('*')), i,
        a = all.indexOf(after), b = all.indexOf(before), got = [];
    if (a < 0 || b < 0 || b < a) return null;
    for (i = a + 1; i < b; i++) if (!after.contains(all[i])) got.push(all[i]);
    return got;
  }
  function text(el){ return (el.textContent || '').replace(/\s+/g, ' ').trim(); }

  var v = open('en');
  var rail = v.querySelector('.plrail');
  var restore = v.querySelector('.plfoot');
  out.hasRail = !!rail;
  out.hasRestore = !!restore;

  /* ---- 1. it is between the prices and the Restore button --------------- */
  var mid = (rail && restore) ? between(v, rail, restore) : null;
  out.midCount = mid ? mid.length : -1;
  out.midText = mid ? text({ textContent: mid.map(function(e){
    return e.children.length ? '' : (e.textContent || '');
  }).join(' ') }) : '';

  /* ---- 2. the sentence is really on the screen -------------------------- */
  var note = v.querySelector('.plrail ~ .docs');
  out.noteText = note ? text(note) : '';
  out.noteBeforeRestore = !!(note && mid && mid.indexOf(note) >= 0);

  /* ---- 3. and so is what a term is and what it costs --------------------
     Not re-derived: the two spans the term buttons draw, read off the page. */
  var pers = [].slice.call(v.querySelectorAll('.plterm .pper')).map(text);
  var pps  = [].slice.call(v.querySelectorAll('.plterm .pp')).map(text);
  out.terms = pers.join('|');
  out.prices = pps.filter(function(x){ return x; }).length;

  /* ---- 4. two links, and they are the two published pages -------------- */
  var as = mid ? mid.filter(function(e){ return e.tagName === 'A'; }) : [];
  out.hrefs = as.map(function(a){ return a.getAttribute('href'); }).join(' ');
  /* .href and not getAttribute: what the browser would actually OPEN. A
     relative path that reads fine in the source resolves to a file:// URL on
     the phone, which is a link Apple counts as broken. */
  out.opens = as.map(function(a){ return a.href; }).join(' ');
  out.linkText = as.map(text).join('|');
  out.docConsts = DOC_TERMS + ' ' + DOC_PRIVACY;

  /* ---- 5. no box, read off the browser and not off the stylesheet ------- */
  var boxed = [], k;
  function look(e){
    var s = getComputedStyle(e), i, sides = ['Top', 'Right', 'Bottom', 'Left'], w = 0, cr = 0;
    for (i = 0; i < 4; i++){
      w += parseFloat(s['border' + sides[i] + 'Width']) || 0;
      cr += parseFloat(s['border' + sides[i] + 'LeftRadius']) || 0;
    }
    cr = ['borderTopLeftRadius', 'borderTopRightRadius',
          'borderBottomLeftRadius', 'borderBottomRightRadius']
         .reduce(function(a, p){ return a + (parseFloat(s[p]) || 0); }, 0);
    if (w > 0 || cr > 0) boxed.push((e.className || e.tagName) + ' b=' + w + ' r=' + cr);
    if (e.getAttribute('style')) boxed.push((e.className || e.tagName) + ' style=');
  }
  if (mid) for (k = 0; k < mid.length; k++) look(mid[k]);
  out.boxed = boxed.join(', ');

  /* ---- 6. and nothing about the plan pages moved ----------------------- */
  out.pages = [].slice.call(v.querySelectorAll('.plpage .plname .pn')).map(text).join(' ');
  out.termBtns = v.querySelectorAll('button.btn.plterm').length;
  out.planNames = PLANS.map(function(p){ return p.name; }).join(' ');

  /* ---- 7. ten languages, and the nine are not the English one ---------- */
  out.said = {};
  for (k = 0; k < UI_LANGS.length; k++){
    var L = UI_LANGS[k], w = open(L), n = w.querySelector('.plrail ~ .docs');
    out.said[L] = n ? text(n) : '';
  }
  out.uiCount = UI_LANGS.length;
  open('en');
  return out;
}, { s: seed.toString() });
await br.close();

const bad = [];
function say(ok, line){ console.log('  ' + (ok ? '' : 'FAILED  ') + line); if (!ok) bad.push(line); }

console.log('\nthe disclosure Apple asks for, beside the price (Guideline 3.1.2)\n');

say(r.hasRail && r.hasRestore, 'the plans screen has its prices and its Restore button');

/* The guideline's own words are 「next to the price」, so where it is IS the
   claim. Between the rail and Restore, in document order, on the real page. */
say(r.noteBeforeRestore,
    'the renewal sentence is between the prices and the buttons under them');
say(r.noteText.length > 0, 'and it says something: "' + r.noteText + '"');
say(/automatically/i.test(r.noteText) && /cancel/i.test(r.noteText),
    'which is that it renews by itself until somebody cancels');

say(r.terms.indexOf('month') >= 0 && r.terms.indexOf('year') >= 0,
    'how long a term is, beside it (' + r.terms + ')');
say(r.prices >= 4, 'and what each term costs (' + r.prices + ' prices drawn)');

const want = r.docConsts.split(' ');
say(r.hrefs === r.docConsts,
    'the two links are DOC_TERMS and DOC_PRIVACY, and no third URL (' + r.hrefs + ')');
say(r.opens === r.docConsts,
    'and what the browser would OPEN is those two, not a path resolved against file://');
say(r.linkText.split('|').length === 2 && r.linkText.split('|').every((x) => x),
    'both are captioned (' + r.linkText + ')');

/* Rule 18. Read off getComputedStyle rather than off the stylesheet, because
   this branch does not hold www/index.html: box-check reads the sheet and
   would not see a rule a later session adds against these classes. */
say(r.boxed === '',
    'NO ROUNDED BOX: nothing in it has a border, a corner or a style attribute' +
    (r.boxed ? ' — ' + r.boxed : ''));

/* 「アプリ内に説明書くの禁止」. The exception is the sentence Apple requires
   and the two links; anything else appearing here is the ban being lost. */
const only = [r.noteText].concat(r.linkText.split('|')).concat(['·']);
const extra = r.midText.split(' ').join(' ');
say(only.reduce((s, x) => s.split(x).join(' '), extra).replace(/\s+/g, '') === '',
    'and it is that sentence and those two links and nothing else — ' +
    'the ban on explaining has one exception, not a corner to grow in');

say(r.pages === r.planNames,
    'the three plan pages are where they were, in PLANS\' order (' + r.pages + ')');
say(r.termBtns === 4, 'and the four term buttons are still the four (' + r.termBtns + ')');

const miss = Object.keys(r.said).filter((l) => !r.said[l]);
const same = Object.keys(r.said).filter((l) => l !== 'en' && r.said[l] === r.said.en);
say(r.uiCount === 10, 'ten interface languages (' + r.uiCount + ')');
say(miss.length === 0, 'every one of them says it' + (miss.length ? ' — ' + miss.join(' ') : ''));
say(same.length === 0,
    'and none of the nine is the English sentence falling through' +
    (same.length ? ' — ' + same.join(' ') : ''));
Object.keys(r.said).forEach((l) => console.log('      ' + l + '  ' + r.said[l]));

if (bad.length) { console.error('\nterm: ' + bad.length + ' failed'); process.exit(1); }
console.log('\nthe price, the term, the sentence and the two documents are on the\n' +
            'screen somebody buys from — which is where Guideline 3.1.2 wants them.');
