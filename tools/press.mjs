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
/* A phone. This file measures how wide a thumb target is, how tall the rows
   of a list are, and what shape a photograph comes out -- and every one of
   those answers depends on how wide the window is. It was asking them at
   Playwright's default 1280x720, which is not a phone and is not any device
   this app runs on: a control that is `flex:1` is three times too wide there,
   a label that wraps to two lines on a phone does not wrap at all, and both
   come out fine. The same numbers verify-script uses, because there is one
   phone and it should not be described twice. */
const pg = await br.newPage({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3 });
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
  const out = { screens: 0, pressed: 0, threw: [], blank: [], skipped: [], names: [], never: [], mute: [],
                small: [], big: [], bent: [], picsSeen: 0, picsSkip: [], picsAt: {}, tall: [], rowsSeen: 0, classes: [],
                wide: [], widthsSeen: 0 };
  /* Apple's floor for anything a thumb has to hit is 44pt, and this file is
     already standing in front of every screen with a phone-sized viewport, so
     it measures while it is here. (It was not. See the viewport above.)

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
         and both are held to 44 there.

         The walk's pad is the third, and it is the same argument arriving
         from the other end: it is not a button of its own at all, it is laid
         exactly over the thing the onboarding has lit, so its width is that
         thing's width. One of the stops lights a key. Widening the pad would
         put it over the keys beside the lit one, which is the tour pointing
         at the wrong letter.

         .kbnewt is the fourth, and it was found the day this file was first
         put in front of a phone: 29x44. The three tiles a new key is dragged
         off are THE SIZE OF THE KEY THEY MAKE -- one wide, two wide, three
         wide -- because being a different size from the thing they make is
         what somebody said was confusing about them.
         「1マスとキーボードの1マスのサイズが一緒じゃないから分かりにくいよ」
         The width is kbCellW(), a calc over --kbw and the column count, which
         is the layout's answer and not this file's; taking the narrowest to
         44 would make it the size of the two-wide one and there would be two
         of those. The height is already pinned at 44 in the stylesheet, and
         that is the floor that means something here. */
      const cn = ' ' + e.className + ' ';
      if (cn.indexOf(' kbk ') >= 0 || cn.indexOf(' kbcl ') >= 0 ||
          cn.indexOf(' kbn ') >= 0 || cn.indexOf(' obtap ') >= 0 ||
          cn.indexOf(' kbnewt ') >= 0) {
        if (r.height >= TAP) continue;
      } else
      if (r.width >= TAP && r.height >= TAP) continue;
      const k = (e.className || e.tagName) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height);
      if (seenSmall[k]) continue;
      seenSmall[k] = 1;
      out.small.push(where + ': ' + k + ' -- under ' + TAP);
    }
  }
  /* Looks pressable, and is not.
     ------------------------------------------------------------------
     Everything above asks whether a button works. This asks the question one
     step earlier: whether the thing somebody is going to press is a button at
     all. Five faults in one day were this shape, and all thirty checks were
     green through every one of them, because a control that was never wired
     up is not a control that fails -- it is a `<span>`.

     「ダウンロードボタン押しても言語追加されない」 was the one that named it.
     `abdlm` in www/home.js is an icon and an `aria-label` in a `<span>`, with
     no `DO()` on it, so the mark saying a section may be taken away looked
     exactly like the mark that takes it away.

     WHAT "LOOKS PRESSABLE" IS WAS MEASURED, not chosen. Three candidates were
     run over every screen this file walks, and the counts decided it:

       cursor:pointer, not pressable       0 distinct -- catches nothing at all
       an svg.ic and no text, not pressable  7 -- and five of them are ornament:
                                              .lens .ltck .gsep .kbc .kbsk
       aria-label, not pressable           3 -- .abdlm, and two that are fine

     So it is the `aria-label`, and the reason it is the right one is not that
     it is the smallest: an aria-label is somebody SAYING WHAT THIS CONTROL IS
     CALLED. Putting one on a thing that is not a control is the fault itself,
     written down by the person making it. A decoration does not get a name --
     `.lens`, the magnifier in the search field, correctly has none.

     The two it caught that are fine are both fine for a reason with a name,
     and neither is an exception carved for a class:

       a <label> that labels a control     `.pwab` wraps <input type="file">.
                                           Pressing it opens the picker,
                                           through the browser's own
                                           label-to-control wiring -- which is
                                           neither a data-do nor a button and
                                           is a real way for something to be
                                           pressable
       a role that is not a control        `.segs` is role="group". An
                                           aria-label on a group NAMES THE
                                           GROUP. A role that IS a control and
                                           has no action behind it fails
                                           louder than the no-role case, not
                                           quieter

     What it cannot see, said out loud: something that looks pressable and
     carries no name at all. That is the same fault with nothing written down
     on it, and there is nothing here to read. */
  const ACTATTR = ['data-do','data-do2','data-hold','data-in','data-ch','data-kd'];
  const CTRL = { BUTTON:1, INPUT:1, SELECT:1, TEXTAREA:1 };
  /* Roles that ARE a control. An aria-label on one of these with nothing
     behind it is the fault stated outright. */
  const ROLE_LIVE = { button:1, link:1, checkbox:1, switch:1, tab:1, radio:1,
                      option:1, slider:1, spinbutton:1, textbox:1, combobox:1,
                      searchbox:1, menuitem:1, menuitemcheckbox:1, menuitemradio:1 };
  const seenMute = {};
  function isCtrl(e){
    if (CTRL[e.tagName]) return true;
    if (e.tagName === 'A' && e.getAttribute('href')) return true;
    /* a <label> is pressable when it labels a control, which is the browser's
       own wiring and not this app's */
    if (e.tagName === 'LABEL' &&
        (e.getAttribute('for') || e.querySelector('input,select,textarea'))) return true;
    for (let j = 0; j < ACTATTR.length; j++)
      if (e.getAttribute(ACTATTR[j])) return true;
    return false;
  }
  function looksLive(where){
    const els = document.querySelectorAll('#app *');
    for (let i = 0; i < els.length; i++) {
      const e = els[i];
      /* inside a drawing: an <svg> and its parts are painted, not pressed */
      if (e.tagName === 'svg' || e.ownerSVGElement) continue;
      const lab = e.getAttribute('aria-label');
      if (!lab) continue;
      let up = e, live = false;
      while (up && up.nodeType === 1 && !live) { live = isCtrl(up); up = up.parentNode; }
      if (live) continue;
      const role = String(e.getAttribute('role') || '');
      if (role && !ROLE_LIVE[role]) continue;      /* it names its role, not a control */
      const cls = (e.getAttribute('class') || '').trim().split(/\s+/)[0];
      const k = e.tagName.toLowerCase() + (cls ? '.' + cls : '') + (role ? '[' + role + ']' : '');
      if (seenMute[k]) continue;
      seenMute[k] = 1;
      out.mute.push(where + ': <' + e.tagName.toLowerCase() + (cls ? ' class="' + cls + '"' : '') +
        (role ? ' role="' + role + '"' : '') + ' aria-label="' + lab + '">' +
        ' — it is named like a control and nothing presses it: no data-do, ' +
        'no data-hold, not a button, not a link, not a label for a field');
    }
  }
  /* Nothing goes off the side.
     ------------------------------------------------------------------
     A phone is 402pt across and there is no more. A page that is wider than
     that does not shrink to fit and does not warn anybody: it pans, so half
     of a screen is reached by dragging it sideways -- and the half that is
     off the edge is the half nobody knows is there. It is the one layout
     fault that cannot be seen in a screenshot of the part that fits.

     Two questions, because a page can be too wide two ways.

     The page itself: documentElement.scrollWidth against its clientWidth.
     This has no exceptions. A screen of this app is a column and the column
     is the width of the phone.

     A box that clips: an element whose own scrollWidth is past its
     clientWidth is holding something wider than itself. That is only a LOSS
     where the box clips -- `overflow-x:hidden` and nothing else. `visible`
     paints the overshoot and it is read: a badge sitting at right:-6px, a
     shadow, a tile that overhangs its cell. `auto` and `scroll` slide, which
     a strip of photographs and a keyboard are supposed to do. And a box
     saying `text-overflow:ellipsis` has been told what to do when the words
     run long and is doing it -- the cut is the answer, and the … says so.
     What is left is a box that swallows the end of a sentence in silence.

     Slack is 1px for sub-pixel layout, and a text box is allowed one more:
     a glyph's ink can sit a fraction past its advance without a word of it
     being lost. */
  const SIDE_SLACK = 2;
  const seenWide = {};
  function measureWidth(where){
    const de = document.documentElement;
    out.widthsSeen++;
    if (de.scrollWidth > de.clientWidth + SIDE_SLACK) {
      const k = 'the page ' + de.scrollWidth + ' wide in ' + de.clientWidth;
      if (!seenWide[k]) { seenWide[k] = 1;
        out.wide.push(where + ': ' + k + ' -- the screen pans sideways'); }
    }
    const els = document.querySelectorAll('#app *');
    for (let i = 0; i < els.length; i++) {
      const e = els[i];
      if (e.scrollWidth <= e.clientWidth + SIDE_SLACK) continue;
      if (!e.clientWidth) continue;                 /* nothing laid out */
      const cs = getComputedStyle(e);
      if (cs.overflowX !== 'hidden') continue;          /* painted, or slides */
      if (cs.textOverflow === 'ellipsis') continue;     /* told what to do */
      const k = (e.getAttribute('class') || e.tagName) + ' ' +
                e.scrollWidth + ' in ' + e.clientWidth;
      if (seenWide[k]) continue;
      seenWide[k] = 1;
      out.wide.push(where + ': ' + k + ' -- cut off with nothing to say so');
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
      /* An <img> that never loaded has no naturalWidth, so it cannot be
         measured -- and skipping it in silence is the one thing this must not
         do. `photographs: 82` and `photographs: 81` look like the same kind
         of number, so a picture that stopped loading reads as a picture that
         was removed on purpose, and the walk says nothing either way. It is
         named here instead. */
      out.picsAt[where] = (out.picsAt[where] || 0) + 1;
      if (!r.width || !r.height || !e.naturalWidth) {
        out.picsSkip.push(where + ': a photograph that never loaded' +
                          ' (' + Math.round(r.width) + 'x' + Math.round(r.height) +
                          ', natural ' + e.naturalWidth + ')');
        continue;
      }
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
    /* gramArgs() and not stAll(), which is the stages alone. The chapters of
       the new grammar page are routes of `gram` too, and this walk was the
       one of the three that never got told: act-check and i18n-check were
       moved onto gramArgs() the day it was written and this line was not, so
       every chapter page went unpressed while both other walks covered them.
       It is invisible in a green run except as a count that does not move --
       eight pages of buttons were added over three commits and `buttons
       pressed` did not change by one. */
    r === 'gram' ? [null].concat(gramArgs()) :
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
  ['free','pro'].forEach(plan => {
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
    ['paid',        () => { SET.plan = 'pro'; }],
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

  /* The forms, which are opened rather than routed to. openForm() routes to
     `form`, so vForm() is what the app puts on the screen for one: the view,
     the top bar with openForm()'s fifth argument in it -- the composer's
     Post, the word page's Edit -- and FORM.html inside `.body`.

     It used to show FORM.html and the bar concatenated, which is the sheet
     with the page taken off it. Nothing threw, and on a 1280px window nothing
     looked wrong either; on a phone it is 48px of padding that is not there,
     so every width this file measured on a form was the width of a form
     nobody will ever see. .sec.secadd carries margin-right:-8px to hang its
     plus over the body's padding, and with no body to hang over it hung 8px
     off the side of the phone instead. */
  opens.forEach(o => {
    screens.push({
      label: o,
      build: () => { window.__seed(); SET.done = true; SET.plan = 'pro';
                     window.route = 'words'; NAV = [{ r: 'words' }];
                     window[o].length ? window[o]('kano') : window[o]();
                     show((typeof FORM !== 'undefined' && FORM && FORM.html)
                            ? vForm() : ''); }
    });
  });

  screens.forEach(sc => {
    let n = 0;
    try { sc.build(); n = buttons().length; }
    catch (e) { out.skipped.push(sc.label + ' would not build: ' + e.message); return; }
    out.screens++;
    measure(sc.label);
    looksLive(sc.label);
    measureRows(sc.label);
    measureWidth(sc.label);
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
  ['free','pro'].forEach(function(plan){
    Object.keys(PAGES).forEach(function(id){
      argsOf(id).forEach(function(a){
        try {
          window.__seed(); SET.done = true; SET.plan = plan;
          window.route = id; NAV = [{ r: id, a: a }];
          render();
          collectClasses();
          /* The shell only exists here, so anything named like a control in
             the bar or the tabs is only reachable from this pass. */
          looksLive(id + (a ? ':' + a : '') + ' (' + plan + ', rendered)');
        } catch (e) { /* a route that will not render is act-check's to report */ }
      });
    });
  });
  try { window.__seed(); SET.done = false; render(); collectClasses(); } catch (e) {}
  /* AND ONE REAL RENDER OF A ONE-SCREEN FORM. Everything above puts a view's
     HTML into #app, so render() -- and tabPaint() with it -- never runs for a
     form that is `fit`. What that misses is the class the DOCUMENT wears
     while one is open (`html.fitlock`, which stops the page rubber-banding
     under a screen pinned to the visual viewport): worn by <html>, set by
     render(), and invisible to a walk that never calls render(). It was
     reported here as a rule nothing wears, which is the check saying "add the
     seed" -- this is the seed. */
  try {
    window.__seed(); SET.done = true; SET.plan = 'pro';
    PW = pwBlank(); openPost(); render(); collectClasses();
    back(); render();
  } catch (e) {}

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
const HELDR = await pg.evaluate(async () => {
  const out = [], seen = [];
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
  window.__seed(); SET.done = true; SET.plan = 'pro';
  go('ltset', 'alpha');
  await carry('a letter of the alphabet', '#ltgrid', '.ltc', 0, 2);
  go('kb');
  if (kbBoards().length < 2) kbAdd(KB_PATS[0]);
  kbGoBoard(1);
  await carry('a key of a keyboard', '#kb', '.kbk[data-r]', 0, 3);

  /* ---- and what is HELD rather than carried -----------------------------
     `data-hold` is the app's third gesture and NOTHING HAD EVER MADE IT.
     Everything above this line is a click, and a click is mousedown and
     mouseup in the same millisecond -- so `holdStart`'s 500ms timer was
     cleared before it could fire, on every screen, on every run, for as long
     as the gesture has existed. A hold that stopped working would have cost
     nothing to notice: green, every time.

     What it holds is the gesture and not the code. Something has to CHANGE --
     the route, or what is on the screen -- and this file is not told what.

     The touch is started from the DEEPEST node under the middle of the
     element, not from the element itself, because that is what a thumb hits:
     a tab is a `<svg>` with `<path>` in it, and `holdStart` finds its way up
     from wherever the finger landed by walking parents while `getAttribute`
     is there. If that walk ever stops short, this is where it shows.

     And if there is no `data-hold` on any screen at all, that fails too. A
     gesture nobody can find is the exact shape of the fault this pass was
     written after: something that is not there, and nothing saying so. */
  /* One hold, at one amount of wobble, and WHERE IT LANDED.
     ------------------------------------------------------------------
     `slop` is how far the thumb moves BEFORE the timer would fire, which is
     the whole of what this asks. A thumb is not a tripod, and a hold that
     only survives perfect stillness is a hold nobody can make. Measured on a
     phone: still → the language switcher, one pixel → nothing.

     WHAT IT COMPARES AGAINST IS THE STILL HOLD'S OWN ANSWER, and that is not
     tidiness -- the first version asked "did anything change" and passed on
     the feed for the wrong reason. The pull-to-refresh in www/sns.js listens
     on the same `touchmove`, so a wobble there redraws the timeline whether
     the hold lived or died, and "something is different" was true either way.
     A hold with a thumb on it has to do WHAT A HOLD WITH A TRIPOD ON IT DOES,
     which is a claim this file can make without being told what that is. */
  const holdOnce = async (el, slop, where) => {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) { out.push(where + ': a data-hold element with no size'); return null; }
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const deep = document.elementFromPoint(x, y) || el;
    const from = '<' + String(deep.tagName).toLowerCase() + '>' +
                 (deep === el ? '' : ' inside <' + String(el.tagName).toLowerCase() + '>');
    const was = JSON.stringify(here());
    T(deep, 'touchstart', x, y);
    if (slop) {
      /* well before HOLD_MS: the thumb settling, not the thumb leaving */
      await new Promise(r2 => setTimeout(r2, 120));
      T(deep, 'touchmove', x + slop, y);
    }
    /* and then past HOLD_MS, because the WAIT is the gesture */
    await new Promise(r2 => setTimeout(r2, 620));
    T(deep, 'touchend', x + slop, y);
    return { from: from, was: was, now: JSON.stringify(here()),
             how: slop ? 'thumb moved ' + slop + 'px at 120ms' : 'perfectly still' };
  };
  /* Below the threshold it must hold; well above it, it must NOT.
     A threshold that never lets go is not a threshold, it is the listener
     deleted -- and that would be a hold that survives being dragged across
     the screen, which is a different bug wearing this one's clothes. 40px is
     a drag by anybody's hand. */
  const SLOP_HOLDS = [1, 6];
  const SLOP_DRAGS = 40;
  const held = async (where) => {
    const els = [].slice.call(document.querySelectorAll('[data-hold]'));
    if (!els.length) return 0;
    for (let i = 0; i < els.length; i++) {
      /* the screen is put back between gestures: a hold that WORKED walked
         off to another route, and the next one would be thrown at nothing */
      const fresh = () => { window.__seed(); SET.done = true; SET.plan = 'pro';
                            go(where); render();
                            return document.querySelectorAll('[data-hold]')[i]; };
      let el = fresh(); if (!el) break;
      const ref = await holdOnce(el, 0, where);
      if (!ref) continue;
      if (ref.now === ref.was) {
        out.push(where + ': held ' + ref.from + ' perfectly still for 620ms and the ' +
                 'route did not move — it is still ' + ref.was);
        continue;
      }
      seen.push(where + ': ' + ref.from + ' ' + ref.how + ' -> ' + ref.now);
      for (let j = 0; j < SLOP_HOLDS.length; j++) {
        el = fresh(); if (!el) break;
        const got = await holdOnce(el, SLOP_HOLDS[j], where);
        if (!got) continue;
        if (got.now !== ref.now)
          out.push(where + ': ' + got.from + ', ' + got.how + ', let go at 740ms — landed on ' +
                   got.now + ' and a hold that never moved lands on ' + ref.now + '. ' +
                   'A thumb is not a tripod: if a pixel kills the hold, the hold cannot be ' +
                   'made on a phone.');
        else seen.push(where + ': ' + got.from + ' ' + got.how + ' -> ' + got.now);
      }
      el = fresh(); if (!el) break;
      const drag = await holdOnce(el, SLOP_DRAGS, where);
      if (drag && drag.now === ref.now)
        out.push(where + ': ' + drag.from + ' was DRAGGED ' + SLOP_DRAGS + 'px and still ' +
                 'held — a hold that survives a drag is a hold with nothing cancelling it, ' +
                 'and that is a threshold removed rather than widened.');
      else if (drag) seen.push(where + ': ' + drag.from + ' ' + drag.how + ' -> ' +
                 drag.now + ' (a drag, correctly not a hold)');
    }
    return els.length;
  };
  let holdsFound = 0;
  for (const r of ['words', 'build', 'feed', 'profile']) {
    window.__seed(); SET.done = true; SET.plan = 'pro';
    go(r); render();
    holdsFound += await held(r);
  }
  if (!holdsFound)
    out.push('no element on any screen carries data-hold — either the gesture ' +
             'was taken out and nothing said so, or the tab bar did not render ' +
             'here. Both are this check failing, and neither is silence.');
  return { out: out, seen: seen };
});

/* ---- THE POPUP, WHICH IS THE ONE THING NOT INSIDE #app -------------------
   Everything above puts a screen into `#app` and presses what is in it, and
   the tab bar is pressed by putting its own HTML there too -- which proves
   the NAME resolves and says nothing about whether the real element is
   anywhere a listener can hear it.

   The popup is the case that showed the gap. `popAsk()` draws two buttons
   into `#pop`, which lives inside `#sbg` -- and boot.js wired `#app` and
   `#tabs` and nothing else, so 閉じる was a button with a registered name,
   a real function behind it, and no listener between the two. Nothing threw
   and every check was green. 「ポップの閉じるとかボタン押しても閉じれない
   よ」 OWNER 2026-09-01.

   So this presses it WHERE IT IS: a real click on the real element, with the
   app's own wiring in between. */
const POPR = await pg.evaluate(async () => {
  const out = [], seen = [];
  /* A HOLD THAT SUCCEEDED EATS THE NEXT CLICK, on purpose -- www/shell.js's
     holdEat: the press that ends a long press is not also delivered. The
     block above this one ends on a hold that worked, so without this the
     first click here is swallowed and the popup is reported as dead when it
     is not. It cost one false red. Put down here rather than in the app: it
     is the check standing where a thumb would have lifted. */
  if (typeof HELD !== 'undefined') HELD = false;
  if (typeof SLDN !== 'undefined') SLDN = 0;
  const click = (el) => el.dispatchEvent(
    new MouseEvent('click', { bubbles: true, cancelable: true }));
  const btn = (name) => document.querySelector('#pop [data-do="' + name + '"]');
  window.__seed(); SET.done = true; SET.plan = 'free';
  go('feed'); render();

  let said = 0;
  popAsk('press-check', () => { said++; });
  if (!popOn()) out.push('popAsk() did not put the popup up at all.');
  const no = btn('popOff');
  if (!no) out.push('the popup has no 閉じる button carrying a name.');
  else {
    click(no);
    if (popOn()) out.push('the popup was up, its 閉じる was clicked where it ' +
      'actually stands, and it is STILL up. The name resolves and the ' +
      'function exists -- what is missing is a listener above the element. ' +
      'boot.js wires #app, #tabs and #sbg; #pop is inside the third.');
    else seen.push('閉じる closed the popup');
  }
  popOff();

  popAsk('press-check', () => { said++; });
  const yes = btn('popYes');
  if (!yes) out.push('the popup has no yes button carrying a name.');
  else {
    click(yes);
    if (popOn()) out.push('the popup stayed up after its yes was pressed.');
    if (said !== 1) out.push('the popup\'s yes did not run what was handed ' +
      'to popAsk() -- said=' + said + ', and a popup whose answer goes ' +
      'nowhere is a question nobody hears.');
    else seen.push('yes ran what popAsk() was given, once, and closed');
  }
  popOff();

  /* ---- AND THE THUMB SLID DOWN THE MARKS -----------------------------
     The button it replaced acted on rows nobody could see; this acts on the
     rows a thumb crossed. 「全て選択ってボタン出さないで欲しい…その代わり
     スライドで下ビューで選択できるようにしたい」 OWNER 2026-09-01.

     Real touch events, on the real marks, through the app's own wiring --
     the same reason the popup above is pressed where it stands. The splash
     is taken off first: it covers the page until the app has drawn, and
     elementFromPoint answers with IT rather than with the row underneath. */
  const sp = document.getElementById('splash');
  if (sp && sp.parentNode) sp.parentNode.removeChild(sp);
  window.__seed(); SET.done = true; SET.plan = 'pro';
  window.route = 'words'; NAV = [{ r: 'words' }];
  wSel = {}; render();
  const marks = [].slice.call(document.querySelectorAll('#app .ltck[data-sel]'));
  if (marks.length < 3) out.push('the dictionary being chosen from has ' +
    marks.length + ' marks carrying data-sel — a thumb has nothing to slide ' +
    'down, and the select-all button it replaced is gone.');
  else {
    const mid = (el) => { const b = el.getBoundingClientRect();
                          return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; };
    const T = (el, type, p) => { const t = new Touch({ identifier: 1, target: el,
        clientX: p.x, clientY: p.y });
      el.dispatchEvent(new TouchEvent(type, { bubbles: true, cancelable: true,
        touches: type === 'touchend' ? [] : [t], changedTouches: [t] })); };
    const p0 = mid(marks[0]), p1 = mid(marks[1]);
    T(marks[0], 'touchstart', p0);
    T(marks[0], 'touchmove', p1);
    T(marks[0], 'touchend', p1);
    const n = Object.keys(wSel).length;
    if (n < 2) out.push('a thumb put on the first mark and slid onto the ' +
      'second chose ' + n + ' rows. The mark is where the slide lives -- the ' +
      'row itself must still scroll -- so a slide that chooses nothing is the ' +
      'gesture missing, and there is no other way to choose a run of rows.');
    else seen.push('a thumb slid down two marks chose ' + n + ' rows');
  }
  wSel = null;
  return { out: out, seen: seen };
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
const HELD = HELDR.out;
HELD.forEach(m => fails.push('held: ' + m));
POPR.out.forEach(m => fails.push('popup: ' + m));
R.threw.forEach(m => fails.push('threw: ' + m));
R.blank.forEach(m => fails.push('blank: ' + m));
R.mute.forEach(m => fails.push('looks pressable and is not — ' + m));
R.small.forEach(m => fails.push('too small to hit: ' + m));
/* The three screens that were already panning the day this was written, kept
   by name so a FOURTH fails. All three are one fault and it is not this
   file's to fix: the three tiles a new key is dragged off are the size of the
   key they make -- one, two and three keys wide, six keys in all -- and the
   sheet they sit on is as wide as the BOARD. On QWERTY that is ten keys and
   they fit with room over. On a board three keys across they are twice the
   sheet, and on one two keys across they are three times it.
   「1マスとキーボードの1マスのサイズが一緒じゃないから分かりにくいよ」 and
   「つまりすぎだから幅いっぱいに使ってすきまあっちいから」 are both being
   kept, and on a narrow board they cannot both be: three tiles of six keys
   do not go into three. Which one gives is a decision about what the screen
   should look like, so it is asked and not guessed. */
const SIDE_BASE = path.join(HERE, 'side-baseline.txt');
const sideAllowed = new Set(fs.existsSync(SIDE_BASE)
  ? fs.readFileSync(SIDE_BASE, 'utf8').split('\n')
      .map(l => l.trim()).filter(l => l && l[0] !== '#')
  : []);
const sideSeen = new Set(R.wide.map(m => m.split(':')[0].trim()));
R.wide.filter(m => !sideAllowed.has(m.split(':')[0].trim()))
  .forEach(m => fails.push('off the side: ' + m));
[...sideAllowed].filter(l => !sideSeen.has(l)).sort().forEach(l =>
  fails.push('tools/side-baseline.txt allows "' + l + '" to pan sideways and it ' +
    'no longer does — delete the line. A baseline that outlives what it ' +
    'described is permission nobody asked for.'));
R.tall.forEach(m => fails.push('one list, two row heights: ' + m));
R.big.forEach(m => fails.push('drawn too big: ' + m));
R.bent.forEach(m => fails.push('drawn out of shape: ' + m));

console.log('screens built: ' + R.screens);
console.log('classes worn: ' + (R.classes || []).length +
            ', styled and unworn: ' + unworn.length +
            (fs.existsSync(CSS_BASE) ? ' (baseline ' + cssAllowed.size + ')' : ' (no baseline yet)'));
console.log('nothing under 44pt: ' + (R.small.length ? R.small.length + ' FOUND' : 'held'));
console.log('nothing off the side of a 402pt phone: ' +
            (R.wide.length ? R.wide.length + ' known (baseline ' + sideAllowed.size + ')'
                           : R.widthsSeen + ' screens measured'));
console.log('rows in one list are one height: ' +
            (R.tall.length ? R.tall.length + ' FOUND' : R.rowsSeen + ' lists measured'));
console.log('photographs all one box, filled, none stretched: ' +
            ((R.big.length || R.bent.length)
              ? (R.big.length + R.bent.length) + ' FOUND'
              : R.picsSeen + ' measured'));
if (process.env.PICS_AT) {
  Object.keys(R.picsAt).sort().forEach(k => console.log('  pics ' + R.picsAt[k] + '  ' + k));
}
if (R.picsSkip.length) {
  console.log('photographs that never loaded: ' + R.picsSkip.length);
  R.picsSkip.forEach(m => console.log('  ' + m));
}
console.log('held and carried: ' + (HELD.length ? HELD.length + ' FOUND' : 'the alphabet and a keyboard both moved'));
console.log('held long enough for the timer: ' +
            (HELDR.seen.length ? HELDR.seen.length + ' data-hold, every one of them answered'
                               : 'NONE — see the failures'));
if (process.env.HOLD_AT) HELDR.seen.forEach(m => console.log('  ' + m));
console.log('the popup, pressed where it stands: ' +
            (POPR.out.length ? POPR.out.length + ' FOUND' : POPR.seen.join('; ')));
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
