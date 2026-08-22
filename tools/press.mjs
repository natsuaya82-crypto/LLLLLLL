/* ---------------------------------------------------------------------------
   tools/press.mjs — press every button and see whether anything breaks.

   Run it:   node tools/press.mjs

   tools/act-check.mjs proves that every name a screen says has a function
   behind it. That is a statement about the table, and it is worth having, but
   it is not the same statement as "the button works". A name can resolve to a
   function that throws the moment it runs — on a word with no meanings yet, on
   a letter that was borrowed rather than drawn, on the free plan. act-check
   would call that button fine, because the name is in the table and the table
   points at a real function. Only pressing it finds out.

   So this presses them. Every button on every screen, one at a time, with the
   screen rebuilt from the same fixture before each press so that what the last
   press did cannot change what the next one sees.

   What it checks
     1. nothing throws    an uncaught error during a press fails, named with
                          the screen and the button that caused it
     2. nothing goes      the app still has a screen in it afterwards. A press
        blank             that empties #app is the white screen this whole
                          family of checks exists to prevent

   How a press is made: the real thing. The click is dispatched on the element,
   so it travels through the one delegated listener in www/act.js, is looked up
   in the same table the app uses, and is called with the arguments the markup
   carried. Nothing here knows the name of a single function in the app.

   What it cannot see, so that nobody mistakes silence for safety:
     - whether the button did the right thing. This proves it did not throw
       and did not empty the screen, not that it worked
     - anything behind a confirm. confirm() is answered no, so a press that
       asks before destroying something takes the "no" branch here. Answering
       yes would delete the fixture out from under the rest of the walk
     - anything that needs a second press to reach. Each press starts from a
       freshly built screen, so a two-step gesture is only ever half made
     - anything asynchronous. A press that fails inside a promise or a timer
       resolves after this has moved on and is not attributed to it
     - the drawing surface. A canvas is drawn on with a finger, not pressed

   Exit code is 0 only when both pass.
   --------------------------------------------------------------------------- */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { seed, obStates, halfDone } from './fixture.mjs';

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
const PORT = 8130;
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const LAUNCH = fs.existsSync(CHROME) ? { executablePath: CHROME } : {};

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
await pg.goto(`http://127.0.0.1:${PORT}/`);
await pg.waitForTimeout(300);

/* The fixture is shared with act-check, so the two press and walk the same
   app. It goes in as a page global because it has to be called again before
   every screen: a press is allowed to change things, and the next screen must
   not inherit what the last one did. */
await pg.evaluate('window.__seed = ' + seed.toString());
/* The same half-done screens act-check walks. Shared rather than copied: a
   screen added to one list has to be pressed by this one too, and a second
   copy would drift the first time somebody added to only one of them. */
await pg.evaluate('window.__obStates = ' + obStates.toString());
await pg.evaluate('window.__halfDone = ' + halfDone.toString());

const R = await pg.evaluate(async () => {
  const out = { screens: 0, pressed: 0, threw: [], blank: [], skipped: [], names: [], never: [],
                small: [], big: [], bent: [], picsSeen: 0, tall: [], rowsSeen: 0, classes: [] };
  /* Apple's floor for anything a thumb has to hit is 44pt, and this file is
     already standing in front of every screen with a phone-sized viewport, so
     it measures while it is here.

     Nothing checked it, and nothing would have: .cand .rr said min-width:44px
     and then a second rule for the same class three hundred lines further
     down said 26, so the two controls on every row of the make screen were
     half a target wide. It looked fine. It always looks fine. */
  const TAP = 44;
  const seenSmall = {};
  function measure(where){
    const els = document.querySelectorAll('#app button, #app input, #app select, #app textarea');
    for (let i = 0; i < els.length; i++) {
      const e = els[i], r = e.getBoundingClientRect();
      if (!r.width || !r.height) continue;          /* hidden is not small */
      /* A key of a keyboard is measured on its height only. Ten letters in a
         row is what QWERTY is, and ten of anything across a phone is 35pt on
         every phone ever made -- Apple's own keyboard included. The floor
         that means something for a key is how tall it is, and that one still
         holds here. Widening it to 44 would not make a keyboard safer to
         type on; it would forbid a keyboard.

         The editor's sheet has two more of exactly that shape, and they are
         here for the same reason rather than for convenience. A column's
         letter takes that column away, so it is the width of the column it
         names -- widen it and it names a different column, or none. The row's
         number takes that row away, and sits in the margin the board leaves
         beside itself. Both are as WIDE as the thing they point at, which is
         not a number this file gets to choose; both are as TALL as they like,
         and both are held to 44 there. */
      const cn = ' ' + e.className + ' ';
      if (cn.indexOf(' kbk ') >= 0 || cn.indexOf(' kbcl ') >= 0 ||
          cn.indexOf(' kbn ') >= 0) {
        if (r.height >= TAP) continue;
      } else
      if (r.width >= TAP && r.height >= TAP) continue;
      const k = (e.className || e.tagName) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height);
      if (seenSmall[k]) continue;
      seenSmall[k] = 1;
      out.small.push(where + ': ' + k + ' -- under ' + TAP);
    }
  }
  /* Rows in one list are one height.
     ------------------------------------------------------------------
     The fault it is written after: `.set` set no type of its own, so the row
     took whatever the TAG gives -- a <button> takes the browser's
     13.3px/normal and an <a> takes the body's -- and the same row came out
     49px as one and 57px as the other, in one list, on one screen. Nothing
     threw. It looked like a list with one slightly wrong row in it, which is
     what it was.

     ── what is asked, and why it is asked this way ────────────────────
     Siblings, under one parent, wearing the SAME class, differing in height,
     AND differing in the computed font-size or line-height. All four.

     The first version asked the first three plus "different TAG", on the
     reasoning that a two-line row is taller than a one-line row and that is a
     row doing its job, while the same class coming out two heights across two
     tags is the fault. Watching it fail is what showed that reasoning up: the
     synthetic <a> it caught was still 50px against 62px with `.set`'s
     font-size and line-height PUT BACK, because the difference was never the
     type -- it was that the anchor carried one span where the buttons carry
     two. A different tag is not a cause. It is a thing that is often true
     when the cause is present, which is exactly what a proxy is, and a check
     built on one reports the right answer for the wrong reason until the day
     it does not.

     So it asks the cause the rule itself names: 「Set font-size and
     line-height on the row class rather than letting the tag decide」. Two
     rows of one class rendering at two type sizes is that sentence being
     broken, whatever tags they are, and content differences -- one line
     against two -- are left alone because they share their type. */
  const ROW_SLACK = 1;                              /* sub-pixel layout, not a difference */
  const seenTall = {};
  function measureRows(where){
    const parents = document.querySelectorAll('#app *');
    for (let i = 0; i < parents.length; i++) {
      const kids = parents[i].children;
      if (kids.length < 2) continue;
      const byClass = {};
      for (let j = 0; j < kids.length; j++) {
        const e = kids[j], cls = (e.getAttribute('class') || '').trim();
        if (!cls) continue;
        const r = e.getBoundingClientRect();
        if (!r.height) continue;                    /* hidden is not a row */
        const cs = getComputedStyle(e);
        (byClass[cls] = byClass[cls] || []).push({
          tag: e.tagName, h: r.height,
          type: cs.fontSize + '/' + cs.lineHeight
        });
      }
      for (const cls in byClass) {
        const g = byClass[cls];
        if (g.length < 2) continue;
        out.rowsSeen++;
        let lo = g[0], hi = g[0];
        const types = {};
        for (let j = 0; j < g.length; j++) {
          if (g[j].h < lo.h) lo = g[j];
          if (g[j].h > hi.h) hi = g[j];
          types[g[j].type] = g[j].tag;
        }
        if (hi.h - lo.h <= ROW_SLACK) continue;
        const kinds = [];
        for (const t in types) kinds.push(t);
        if (kinds.length < 2) continue;             /* one type: a taller row, not this fault */
        /* Name the rows that DEMONSTRATE it, not the tallest and the shortest.
           The first version printed lo and hi, and they were 49px and 62px at
           the same 13.3333px/normal -- two rows that agree, offered as proof
           that something disagreed. What differs is the TYPE, so what is
           printed is one row per type. */
        const say = kinds.sort().map((t) => {
          let low = null, high = null;
          for (let j = 0; j < g.length; j++) {
            if (g[j].type !== t) continue;
            if (low === null || g[j].h < low) low = g[j].h;
            if (high === null || g[j].h > high) high = g[j].h;
          }
          return types[t] + ' ' + (low === high ? Math.round(low) + 'px'
                 : Math.round(low) + '-' + Math.round(high) + 'px') + ' at ' + t;
        });
        const k = cls + ' ' + say.join(' ');
        if (seenTall[k]) continue;
        seenTall[k] = 1;
        out.tall.push(where + ': .' + cls.replace(/\s+/g, '.') + ' -- ' +
          say.join('  vs  ') + '. One list, one height: set font-size and ' +
          'line-height on the row class rather than letting the tag decide.');
      }
    }
  }
  /* Which class is actually WORN by something.
     ------------------------------------------------------------------
     A screen can be deleted and its CSS stay. `a.set{text-decoration:none}`
     is still in index.html under a comment naming "the two documents at the
     foot of the settings list", and there is no <a class="set"> anywhere in
     www/ any more. `.weave` is the sentence-weaving chapter and the word
     `weave` does not appear in a single .js file. Both were found by accident
     in one afternoon, which is how many there are likely to be.

     dead-check asks this of every FUNCTION. Nothing has ever asked it of a
     selector, and a grep cannot: a class is worn from a string built by
     concatenation ('set' + (on ? ' on' : '')), from classList.add, and from
     index.html's own markup. Reading the source would call live rules dead
     and delete somebody's screen.

     So it is asked of the PAGE, from here, because this file is the one that
     builds every screen AND presses every button -- a render-only walk would
     never reach `.on`, and a rule that only a pressed state wears would be
     reported as dead. It is collected after each build and after each press
     for exactly that reason. */
  const seenClass = {};
  function collectClasses(){
    const all = document.querySelectorAll('*');
    for (let i = 0; i < all.length; i++) {
      const c = all[i].getAttribute && all[i].getAttribute('class');
      if (!c) continue;
      const parts = String(c).split(/\s+/);
      for (let j = 0; j < parts.length; j++) if (parts[j]) seenClass[parts[j]] = 1;
    }
  }
  /* And the other way round, for the one thing on a screen that is not a
     target: a photograph. It was drawn at `width:100%` and up to 60vh, so a
     landscape picture was BLOWN UP past the 900 pixels that are stored and one
     post could be most of the phone. Nothing said so, and nothing could have
     -- the fixture's photograph was a single transparent pixel, which looks
     exactly the same stretched as it does left alone.

     Two claims:

       every photograph is drawn in the SAME box, and that box is the one
       index.html sets 「画像サイズが違うのが嫌なの表示上の」
       and it is filled with `cover`, which is the only value that fills a box
       without stretching what is in it 「xと同じって言ってるやんずっと」

     `fill` would pass a box check and be a squashed photograph; `contain`
     would pass it and be a wide photograph sitting in a square. The box and
     the fit are two different questions and both have to be asked. */
  function measurePics(where){
    /* The same number index.html sets, read rather than repeated -- and a
       plain 33 rather than `33vw` for exactly that reason: a custom property
       holding a length comes back as the token, not as pixels. */
    const pct = parseFloat(getComputedStyle(document.documentElement)
                  .getPropertyValue('--picpct')) || 0;
    const box = window.innerWidth * pct / 100;
    const els = document.querySelectorAll('#app img.ppic');
    for (let i = 0; i < els.length; i++) {
      const e = els[i], r = e.getBoundingClientRect();
      if (!r.width || !r.height || !e.naturalWidth) continue;
      out.picsSeen++;
      if (pct && (Math.abs(r.width - box) > 1 || Math.abs(r.height - box) > 1))
        out.big.push(where + ': a photograph drawn ' + Math.round(r.width) + 'x' +
                     Math.round(r.height) + ', and every one of them is ' +
                     Math.round(box) + 'x' + Math.round(box));
      const fit = getComputedStyle(e).objectFit;
      if (fit !== 'cover')
        out.bent.push(where + ': a photograph drawn with object-fit:' + fit +
                      ' -- fill squashes it and contain leaves the box showing ' +
                      'round it, and only cover fills the box with the picture ' +
                      'still the shape it is');
    }
  }

  /* An exception inside a click listener does not come back out of .click() —
     the browser reports it and carries on. So catch it where it is reported,
     and read the list after each press to know which press caused it. */
  let errs = [];
  window.addEventListener('error', (e) => errs.push(e.message || String(e.error)));
  window.onunhandledrejection = (e) => errs.push('unhandled rejection: ' + e.reason);

  /* Nothing may stop and wait for a person. confirm answers no, so a button
     that asks before destroying something leaves the fixture alone. */
  window.confirm = () => false;
  window.alert = () => {};
  window.prompt = () => null;

  const app = () => document.getElementById('app');
  const buttons = () => Array.prototype.slice.call(app().querySelectorAll('[data-do]'));

  /* Every screen is a route and its argument, so the rooms and the stages are
     each their own screen. Asked of the page, like everywhere else. */
  const views = Object.keys(window).filter(k =>
    /^v[A-Z]/.test(k) && typeof window[k] === 'function' && k !== 'vOb');
  const opens = Object.keys(window).filter(k =>
    /^open[A-Z]/.test(k) && typeof window[k] === 'function' && k !== 'openForm');
  const argsOf = (r) =>
    r === 'set'  ? [null].concat(SETS.map(x => x.id)) :
    r === 'gram' ? [null].concat(stAll().map(p => p.id)) :
    /* The form picker is about a word, and with no word it is the gone box. */
    r === 'fm'   ? ['tira'] :
    [null];

  /* A screen is a label and the way back to it. Rebuilding rather than
     remembering is the point: a press may navigate, delete, or open a form,
     and the next press has to start from the same place this one did.

     The screen is put into the page by hand rather than by calling render().
     render() dispatches on the route, and its first act is to send everything
     to the onboarding while SET.done is false -- so a walk that trusted it
     would press the same two onboarding buttons a thousand times and report a
     thousand presses. Asking the view for its own HTML says what screen this
     is with no way to be quietly redirected. The press itself is still the
     real thing: it is dispatched on the element, travels through the one
     listener www/act.js wired to #app at boot, and is looked up in the same
     table the app uses. */
  const show = (html) => { document.getElementById('app').innerHTML = html; };
  const hit = {};
  const screens = [];

  /* Onboarding, which is the one screen render() reaches on its own. Its
     own count, because the door left it: vOb() shows the door for SET.obback
     and the steps for ob.step, so a step number no longer reaches it and a
     leftover note would hide every step behind it. */
  for (let s = 0; s < OB_STEPS; s++) {
    screens.push({
      label: 'vOb step ' + s,
      build: () => { window.__seed(); SET.done = false; SET.obback = null;
                     ob.step = s; show(vOb()); }
    });
  }

  /* Every view, under both plans, because a button behind the paywall is a
     button and the lock offered in its place is another one. */
  ['free','plus'].forEach(plan => {
    views.forEach(v => {
      const r = v.slice(1).toLowerCase();
      argsOf(r).forEach(a => {
        screens.push({
          label: v + (a ? ':' + a : '') + ' (' + plan + ')',
          build: () => { window.__seed(); SET.done = true; SET.plan = plan;
                         window.route = r; NAV = [{ r: r, a: a }]; show(window[v]()); }
        });
      });
    });
  });

  /* The onboarding's second faces, and the screens that only exist once
     something is half-done. Both lists come from tools/fixture.mjs, which is
     also where act-check gets them. */
  window.__obStates().forEach(([label, run]) => {
    screens.push({ label: 'ob: ' + label,
      build: () => { window.__seed(); SET.done = false; show(run()); } });
  });
  /* Under three standings, not one. A button can exist only for somebody who
     has not paid, and one of them -- the offer to upgrade -- appears only once
     the free allowance is also spent. Pressing every screen as a paid account
     would never render either. */
  const standings = [
    ['paid',        () => { SET.plan = 'plus'; }],
    ['free',        () => { SET.plan = 'free'; }],
    ['out of room', () => { SET.plan = 'free'; SET.aiDay = ''; SET.aiN = 999; }]
  ];
  standings.forEach(([who, stand]) => {
    window.__halfDone().forEach(([label, run]) => {
      screens.push({ label: label + ' (' + who + ')',
        build: () => { window.__seed(); SET.done = true; stand(); show(run()); } });
    });
  });

  /* The tab bar. It is on every screen and belongs to none of them -- it
     lives beside #app and render() paints it -- so it is pressed here, once,
     as a screen of its own. It goes into #app for the press like everything
     else does: the point is that each of the five names resolves and runs. */
  screens.push({
    label: 'the tab bar',
    build: () => { window.__seed(); SET.done = true;
                   window.route = 'feed'; NAV = [{ r: 'feed' }]; show(tabBar()); }
  });

  /* The forms, which are opened rather than routed to. They render into
     FORM.html, and openForm()'s fifth argument into the bar -- the composer's
     Post, the word page's Edit. A button in the bar is a button of that form
     and of no other screen, so both halves go on the page. */
  opens.forEach(o => {
    screens.push({
      label: o,
      build: () => { window.__seed(); SET.done = true; SET.plan = 'plus';
                     window.route = 'words'; NAV = [{ r: 'words' }];
                     window[o].length ? window[o]('kano') : window[o]();
                     show((typeof FORM !== 'undefined' && FORM && FORM.html)
                            ? FORM.html + (FORM.right || '') : ''); }
    });
  });

  screens.forEach(sc => {
    let n = 0;
    try { sc.build(); n = buttons().length; }
    catch (e) { out.skipped.push(sc.label + ' would not build: ' + e.message); return; }
    out.screens++;
    measure(sc.label);
    measureRows(sc.label);
    collectClasses();
    for (let i = 0; i < n; i++) {
      try { sc.build(); } catch (e) { out.skipped.push(sc.label + ' #' + i + ': ' + e.message); continue; }
      const els = buttons();
      if (i >= els.length) break;     /* the screen got shorter; nothing left at i */
      const name = els[i].getAttribute('data-do');
      hit[name] = 1;
      /* A second name on the same press. The click below fires both, so the
         one in data-do2 is pressed exactly as hard as the one in data-do --
         it was simply never written down, which made every AFTER name look
         unreachable forever. */
      const also = els[i].getAttribute('data-do2');
      if (also) hit[also] = 1;
      errs = [];
      els[i].click();
      out.pressed++;
      collectClasses();               /* `.on` is only worn after a press */
      errs.forEach(m => out.threw.push(sc.label + ' -> ' + name + ': ' + m));
      const left = app() ? app().innerHTML.trim().length : 0;
      if (left < 20) out.blank.push(sc.label + ' -> ' + name + ' left the screen empty');
    }
  });
  out.names = Object.keys(hit).sort();
  out.never = Object.keys(ACT).filter(k => !hit[k]).sort();
  /* A second pass, and it has to be its own: an <img> has no size until it has
     loaded, and the walk above is synchronous from first screen to last. So
     the screens that carry a photograph are built again and waited for. Only
     those -- everything else falls out on the first line. */
  for (const sc of screens) {
    try { sc.build(); } catch (e) { continue; }
    const pics = document.querySelectorAll('#app img.ppic');
    if (!pics.length) continue;
    for (let i = 0; i < pics.length; i++) {
      try { await pics[i].decode(); } catch (e) {}
    }
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    measurePics(sc.label);
  }

  /* And one more pass, through the REAL render(), purely to collect classes.
     Everything above puts a view's HTML straight into #app, which is what
     lets a press be repeated from a known screen -- but it means the SHELL
     never exists: the root bar, the tabs, the splash. The first version of
     the class collector reported `.bar` as worn by nothing, which is not a
     dead rule, it is this blind spot. A baseline frozen then would have been
     a record of the check's own gap.

     Kept separate from the walk above rather than folded into it: measure()
     and measureRows() are calibrated on what show() builds, and moving them
     onto render() would change what 44pt and the row heights are measured
     against. This loop touches nothing but seenClass. */
  ['free','plus'].forEach(function(plan){
    Object.keys(PAGES).forEach(function(id){
      argsOf(id).forEach(function(a){
        try {
          window.__seed(); SET.done = true; SET.plan = plan;
          window.route = id; NAV = [{ r: id, a: a }];
          render();
          collectClasses();
        } catch (e) { /* a route that will not render is act-check's to report */ }
      });
    });
  });
  try { window.__seed(); SET.done = false; render(); collectClasses(); } catch (e) {}

  out.classes = Object.keys(seenClass).sort();
  return out;
});

/* ---- and what a thumb does when it does not let go ----------------------
   Everything above is a press. Holding something and carrying it is the other
   gesture this app has, it is in two places -- the alphabet and the keyboard
   being built -- and nothing was watching either. Both were broken, in the
   same line, from the day they were written: the thing being carried is under
   the finger and lifted above its neighbours, so elementFromPoint answered
   with IT, `over === the one being dragged` sent the drag home, and a letter
   or a key could be held and walked across the whole screen without ever
   swapping with anything. Nothing threw. Every screen looked right.

   So this holds the gesture and not the code: touchstart, wait past the lift,
   touchmove onto something else, and the order afterwards has to be a
   different order. */
const HELD = await pg.evaluate(async () => {
  const out = [];
  const sp = document.getElementById('splash');
  if (sp && sp.parentNode) sp.parentNode.removeChild(sp);
  const T = (el, type, x, y) => {
    const t = new Touch({ identifier: 1, target: el, clientX: x, clientY: y });
    el.dispatchEvent(new TouchEvent(type, {
      touches: type === 'touchend' ? [] : [t],
      targetTouches: type === 'touchend' ? [] : [t],
      changedTouches: [t], bubbles: true, cancelable: true }));
  };
  /* One hold, one carry, one let go -- and what the order was either side. */
  const carry = async (what, gridSel, cellSel, from, to) => {
    const g = document.querySelector(gridSel);
    if (!g) return out.push(what + ': no ' + gridSel);
    const cs = [].slice.call(g.querySelectorAll(cellSel));
    if (cs.length <= to) return out.push(what + ': only ' + cs.length + ' to carry');
    const a = cs[from], b = cs[to];
    const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    const order = () => [].slice.call(g.querySelectorAll(cellSel)).indexOf(a);
    const was = order();
    T(a, 'touchstart', ra.left + ra.width / 2, ra.top + ra.height / 2);
    /* past the 380ms the lift waits, because the lift IS the gesture */
    await new Promise(r => setTimeout(r, 460));
    T(a, 'touchmove', rb.left + rb.width / 2, rb.top + rb.height / 2);
    const now = order();
    T(a, 'touchend', rb.left + rb.width / 2, rb.top + rb.height / 2);
    if (now === was) out.push(what + ': held and carried and it did not move');
  };
  window.__seed(); SET.done = true; SET.plan = 'plus';
  go('ltset', 'alpha');
  await carry('a letter of the alphabet', '#ltgrid', '.ltc', 0, 2);
  go('kb');
  if (kbBoards().length < 2) kbAdd(KB_PATS[0]);
  kbGoBoard(1);
  await carry('a key of a keyboard', '#kb', '.kbk[data-r]', 0, 3);
  return out;
});

await br.close();
srv.close();

/* ---- a class in the stylesheet that nothing wears -------------------------
   The other half of what the page just collected. Every class NAMED in
   index.html's stylesheet is compared with every class actually worn on any
   element of any screen, before and after every press.

   It is a ratchet, the same shape as box-check, and for the same reason: this
   found selectors that have been dead for months, and deleting all of them is
   a change to the stylesheet rather than a check. `tools/css-baseline.txt` is
   what was unworn the day this was written; a NEW one fails, and a line that
   no longer describes anything must be deleted or the list rots.

   What it cannot see, said out loud: a class only worn in a state the walk
   never reaches -- an error, a plan the fixture is not on, a screen behind a
   half-done state nobody seeded. That is why a find is not a deletion. The
   check says "nothing here wore it"; whether it is dead is read by a person.
   Adding the seed that reaches it is the other way to clear a line, and the
   better one. */
const CSS_BASE = path.join(HERE, 'css-baseline.txt');
const cssTxt = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, ' ');
const styleBlocks = (cssTxt.match(/<style[^>]*>[\s\S]*?<\/style>/g) || []).join('\n');
const named = new Set();
for (const m of styleBlocks.matchAll(/\.(-?[A-Za-z_][\w-]*)/g)) named.add(m[1]);
const worn = new Set(R.classes || []);
const unworn = [...named].filter(c => !worn.has(c)).sort();

let cssAllowed = new Set();
if (fs.existsSync(CSS_BASE))
  cssAllowed = new Set(fs.readFileSync(CSS_BASE, 'utf8').split('\n')
    .map(l => l.trim()).filter(l => l && l.charAt(0) !== '#'));
else if (process.env.CSS_BASELINE_WRITE) {
  fs.writeFileSync(CSS_BASE,
    '# Classes index.html styles that nothing wore on any screen, before or\n' +
    '# after any press, the day tools/press.mjs learned to ask.\n' +
    '# A NEW one fails. Taking a line OUT is progress and needs nobody --\n' +
    '# either the rule went, or a seed was added that reaches the state that\n' +
    '# wears it, which is the better way.\n' + unworn.join('\n') + '\n');
  console.log('css baseline written: ' + unworn.length);
}

const fails = [];
if (fs.existsSync(CSS_BASE)) {
  unworn.filter(c => !cssAllowed.has(c)).forEach(c =>
    fails.push('nothing wears .' + c + ' — index.html styles it and no screen ' +
      'put it on any element, before or after any press. Either the screen it ' +
      'dressed is gone, or the state that wears it is one nothing here reaches ' +
      '(add the seed; that is the better fix). Not a deletion on its own.'));
  [...cssAllowed].filter(c => !named.has(c)).sort().forEach(c =>
    fails.push('tools/css-baseline.txt names .' + c + ' and the stylesheet no ' +
      'longer does — delete the line.'));
  [...cssAllowed].filter(c => named.has(c) && worn.has(c)).sort().forEach(c =>
    fails.push('tools/css-baseline.txt says nothing wears .' + c + ' and ' +
      'something does now — delete the line.'));
}
HELD.forEach(m => fails.push('held: ' + m));
R.threw.forEach(m => fails.push('threw: ' + m));
R.blank.forEach(m => fails.push('blank: ' + m));
R.small.forEach(m => fails.push('too small to hit: ' + m));
R.tall.forEach(m => fails.push('one list, two row heights: ' + m));
R.big.forEach(m => fails.push('drawn too big: ' + m));
R.bent.forEach(m => fails.push('drawn out of shape: ' + m));

console.log('screens built: ' + R.screens);
console.log('classes worn: ' + (R.classes || []).length +
            ', styled and unworn: ' + unworn.length +
            (fs.existsSync(CSS_BASE) ? ' (baseline ' + cssAllowed.size + ')' : ' (no baseline yet)'));
console.log('nothing under 44pt: ' + (R.small.length ? R.small.length + ' FOUND' : 'held'));
console.log('rows in one list are one height: ' +
            (R.tall.length ? R.tall.length + ' FOUND' : R.rowsSeen + ' lists measured'));
console.log('photographs all one box, filled, none stretched: ' +
            ((R.big.length || R.bent.length)
              ? (R.big.length + R.bent.length) + ' FOUND'
              : R.picsSeen + ' measured'));
console.log('held and carried: ' + (HELD.length ? HELD.length + ' FOUND' : 'the alphabet and a keyboard both moved'));
console.log('buttons pressed: ' + R.pressed +
            '  (' + R.names.length + '/' + (R.names.length + R.never.length) + ' distinct names)');
/* Printed, not silently tolerated. A name nothing here presses is a button
   this check says nothing about, and a reader who saw only a green line would
   reasonably think otherwise. act-check proves these names resolve; it is
   this one that cannot reach them. */
if (R.never.length) {
  console.log('\nnever pressed (' + R.never.length + '), so nothing here is claimed about them:');
  console.log('  ' + R.never.join(' '));
}
if (R.skipped.length) {
  console.log('\ncould not be built (' + R.skipped.length + '):');
  R.skipped.slice(0, 20).forEach(m => console.log('  ' + m));
}
if (fails.length) {
  console.error('\nFAILED (' + fails.length + '):');
  fails.slice(0, 40).forEach(m => console.error('  ' + m));
  if (fails.length > 40) console.error('  ...and ' + (fails.length - 40) + ' more');
  process.exit(1);
}
console.log('\nevery button pressed: nothing threw, nothing went blank.');
