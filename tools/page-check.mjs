/* ONE ROUTE IS DRAWN BY ONE FUNCTION.
   ---------------------------------------------------------------------
   CLAUDE.md § One place, not fifteen says do not make a second of something
   that already has one, and it says of itself: "A comment saying 'this is the
   one place' is worth nothing on its own... Either a check holds the claim, or
   do not make it." Nothing held it. It was broken on 2026-09-01 and the whole
   gate was green.

   `wldPage()` in www/home.js is the language's page -- ABOUT THIS LANGUAGE,
   the wiki with Overview / Phonology / Letters / Lexicon / Grammar / Keyboard
   down it. Its own comment is the rule written out: "There is no separate
   editor screen any more. There were two screens with two layouts for one
   thing... One function draws both now, so a section cannot appear in one and
   not the other." Then somebody else's published language needed drawing, and
   what was written was `wldSeenHTML()` -- a SECOND page on the same route,
   under a different name, with a different set of sections, reached by giving
   `about` an argument:

     function vAbout(){
       var a=String(here().a||'');
       return a? wldSeenHTML(a) : wldPage(false);      // two pages, one route
     }

   Nothing throws. Every screenshot is right. The owner found it by standing a
   real phone next to the article and reading the two.

   THE THING THAT IS WATCHED, and it is watched rather than worked out again.
   Every global function is wrapped, then each route's view is called for each
   of its faces, and the DRAWER is the innermost wrapped function whose return
   value IS the string the view returned. `(inline)` when the view built the
   page itself. A route with two drawers across its faces is two pages.

   That is an observation of the real call, not a copy of the decision under
   test -- docs/TESTING.md: "A check that recomputes the thing under test is a
   copy of it, and a copy always agrees." Nothing here reads `vAbout`'s source,
   restates its branch, or knows the name `wldSeenHTML`. Shift the branch and
   the observation shifts with the app.

   THE FACES ARE ASKED OF THE PAGE. A screen is a route AND its argument, and
   the reason twenty-nine checks were green is that no walk had ever handed
   `about` one -- `argsOf` in i18n-check and `walkArg` in act-check are lists
   somebody has to remember to add a route to, and nobody did. So this asks the
   app instead:

     - every `data-do="go"` with a two-element `data-a` found in any face
       rendered here is a door the app itself offers, and its argument is real;
     - plus two arguments nothing knows, because a page reached only from a
       door that has not been built yet is still a second page. `wldSeenHTML`
       shipped BEFORE the row on a profile became pressable, and a check that
       waited for the door would have waited a commit.

   WHAT THIS DOES NOT HOLD, said out loud so silence is not read as approval:

     - a second page written INLINE, inside the view function itself, reports
       `(inline)` on both faces and passes. What is held is a second page with
       a name, which is the shape this was written after and the shape the
       prefix rules in CLAUDE.md § Names push people towards.
   `viewGone()` IS NOT A FACE OF A ROUTE. "The thing you came back for is gone"
   is the route declining to draw, and CLAUDE.md § One place, not fifteen names
   it as one of the six the audit pulled into one place -- five screens in four
   files used to hand-roll it. Every route that takes an id answers with it for
   an id that is not there, so `wldart` really is drawn by `vWldArt` for A1 and
   by `viewGone` for an argument nothing knows, and that is right. It is left
   out of the count by NAME, and the name is held: if `viewGone` stops drawing
   anything at all, this fails, because an exemption matching nothing is what
   box-check's baseline says a stale line becomes -- permission.

     - two routes sharing one drawer is not a fault and is not asked about.
       `wldPage` draws `about` and `world` on purpose -- "the reading face and
       the writing one -- the same page". This holds one route to one function,
       never one function to one route.
     - byte equality between a route's faces was measured and rejected: six of
       thirty-seven routes use their argument to filter or to name somebody, so
       an unknown argument legitimately changes `profile` `letters` `kb`
       `words` `gram` and `notes`. A check with a baseline of six there would
       rot into permission.

   No port: index.html is opened off the disk, the way world-check and
   shape-check do, so there is nothing to collide with when the gate runs four
   at a time.

   Run: node tools/page-check.mjs                                          */
import { seed } from './fixture.mjs';
import { fileURLToPath } from 'url';
import path from 'path';
import { chromium, LAUNCH } from './browser.mjs';
const dir = path.dirname(fileURLToPath(import.meta.url));

const br = await chromium.launch(LAUNCH);
const pg = await br.newPage({ viewport: { width: 390, height: 844 } });
const boom = [];
pg.on('pageerror', (e) => boom.push(String(e && e.message || e)));
await pg.goto('file://' + path.join(dir, '..', 'www', 'index.html'));
await pg.waitForSelector('#splash', { state: 'detached', timeout: 15000 });

const r = await pg.evaluate(({ s }) => {
  eval('(' + s + ')()');
  /* The paid plan, so the paid screens are pages rather than locked doors --
     the same thing act-check and world-check do for the same reason. */
  SET.done = true; SET.plan = 'pro';

  var out = { rows: [], doors: 0, err: [] };
  /* Asked of the table, not written out here: a route added tomorrow is
     walked tomorrow. vOb has no route and is not one of these. */
  var routes = Object.keys(PAGES).filter(function(k){ return PAGES[k].view; });
  if (routes.length < 20) out.err.push('only ' + routes.length + ' routes carry a view — the discovery is broken');

  /* ---- the wrap ------------------------------------------------------- */
  /* Every global function, so nothing has to be named here. `PAGES[r].view`
     holds the function OBJECT that route-map.js handed it, so the view itself
     is called unwrapped and a view that builds its own page leaves no entry --
     which is what `(inline)` means. Anything it calls by global name goes
     through the wrapper. */
  var log = [];
  Object.keys(window).forEach(function(n){
    if (!/^[a-zA-Z]/.test(n)) return;
    var f;
    try { f = window[n]; } catch(e){ return; }
    if (typeof f !== 'function') return;
    if (String(f).indexOf('[native code]') !== -1) return;
    try {
      window[n] = function(){
        var v = f.apply(this, arguments);
        /* A page is long. The floor keeps esc() and the little helpers out of
           a list that is scanned once per face. */
        if (typeof v === 'string' && v.length > 200) log.push([n, v]);
        return v;
      };
    } catch(e){}
  });

  /* ---- one face ------------------------------------------------------- */
  function face(rt, a){
    log = [];
    var S;
    try {
      /* A screen is a route AND its argument, and here() reads NAV. Setting
         the route by hand and not through go() is deliberate: go() would run
         render() and viewReset(), and what is wanted is the view's own string
         for exactly this pair. */
      window.route = rt; NAV = [{ r: rt, a: a }];
      S = PAGES[rt].view();
    } catch(e){
      return { drew: 'THREW: ' + String(e && e.message || e).slice(0, 60), html: '' };
    }
    if (typeof S !== 'string') return { drew: '(not a string)', html: '' };
    /* The innermost one that returned the whole page. Inner returns first, so
       the first match is the one nearest the drawing. */
    for (var i = 0; i < log.length; i++) if (log[i][1] === S) return { drew: log[i][0], html: S };
    return { drew: '(inline)', html: S };
  }

  /* ---- the doors the app itself offers -------------------------------- */
  /* Harvested from what was rendered, never from a list here: `go` with a
     two-element argument is the app saying this route takes that value. */
  var doors = {};
  function harvest(html){
    if (!html) return;
    var d = document.createElement('div');
    d.innerHTML = html;
    var n = d.querySelectorAll('[data-do="go"]'), i, a;
    for (i = 0; i < n.length; i++){
      try { a = JSON.parse(n[i].getAttribute('data-a') || '[]'); } catch(e){ continue; }
      if (a.length >= 2 && a[1] != null && a[1] !== '' && PAGES[a[0]] && PAGES[a[0]].view){
        (doors[a[0]] = doors[a[0]] || {})[String(a[1])] = 1;
      }
    }
  }
  /* Two passes. The first is what an argument-less app offers; the second is
     what the doors found in it open onto, so a door behind a door is walked. */
  var first = {};
  routes.forEach(function(rt){
    var f = face(rt, null);
    first[rt] = f;
    harvest(f.html);
  });
  routes.forEach(function(rt){
    Object.keys(doors[rt] || {}).forEach(function(a){ harvest(face(rt, a).html); });
  });
  out.doors = routes.reduce(function(n, rt){ return n + Object.keys(doors[rt] || {}).length; }, 0);

  /* ---- and the answer -------------------------------------------------- */
  routes.forEach(function(rt){
    var faces = {};
    function put(label, f){ (faces[f.drew] = faces[f.drew] || []).push(label); }
    put('(no argument)', first[rt]);
    Object.keys(doors[rt] || {}).sort().forEach(function(a){ put(a, face(rt, a)); });
    /* An argument nothing knows. A second page that is not reachable yet is
       still a second page -- the one this was written after shipped a commit
       before its door did. Two of them, because a drawer that differs between
       two unknown arguments is telling us about the check rather than the app. */
    put('(an argument nothing knows)', face(rt, 'PAGECHECKPROBE1'));
    put('(another one)', face(rt, 'PAGECHECKPROBE2'));
    out.rows.push({ r: rt, drew: faces });
  });
  return out;
}, { s: seed.toString() });

const fails = [];
const say = (m) => fails.push(m);
r.err.forEach(say);
boom.forEach((m) => say('the page threw while this ran: ' + m));

const rows = r.rows || [];
if (rows.length < 20) say('only ' + rows.length + ' routes were walked at all.');

/* Declining to draw is not a face. See the head of this file — and the name is
   held below, so it cannot quietly stop meaning anything. */
const NOT_A_FACE = ['viewGone'];
let sawExempt = 0;

let inline = 0, named = 0;
for (const row of rows){
  NOT_A_FACE.forEach((n) => { if (row.drew[n]) sawExempt++; });
  const drawers = Object.keys(row.drew).filter((d) => NOT_A_FACE.indexOf(d) === -1);
  if (drawers.length === 1 && drawers[0] === '(inline)') inline++;
  else if (drawers.length === 1) named++;
  const threw = drawers.filter((d) => d.indexOf('THREW:') === 0);
  if (threw.length)
    say('the route `' + row.r + '` threw on ' + row.drew[threw[0]].join(', ') +
        ' — ' + threw[0] + '. A route has to draw something for every argument ' +
        'it can be given; nothing below this line was asked about it.');
  else if (drawers.length > 1)
    say('the route `' + row.r + '` is drawn by ' + drawers.length + ' different ' +
        'functions:\n' +
        drawers.map((d) => '      ' + d + '  ← ' + row.drew[d].join(', ')).join('\n') +
        '\n    One route is one page. CLAUDE.md § One place, not fifteen — a second ' +
        'function drawing the same route is the second of something that already ' +
        'had one, and it does not throw, does not look broken, and is found by ' +
        'somebody holding a phone. Draw both faces from the one function, the way ' +
        '`wldPage(ed)` draws the article and its writing face.');
}

if (!sawExempt)
  say('nothing was drawn by ' + NOT_A_FACE.join(' or ') + ' on any route. That name ' +
      'is left out of this count, and an exemption matching nothing is permission ' +
      '— either it was renamed, in which case fix it here, or "the thing you came ' +
      'back for is gone" has stopped being one place.');

console.log(rows.map((x) => '  ' + x.r.padEnd(10) + ' ' + Object.keys(x.drew).join('  +  ')).join('\n'));
console.log('\nroutes walked: ' + rows.length + '  (' + named + ' drawn by a named function, ' +
            inline + ' drawn inline)');
console.log('faces that were ' + NOT_A_FACE.join('/') + ' — the route declining, not a page: ' + sawExempt);
console.log('arguments the app itself offered: ' + r.doors +
            ', plus two nothing knows, on every route');

await br.close();
if (fails.length){
  console.error('\nFAILED (' + fails.length + '):');
  fails.forEach((m) => console.error('  ' + m));
  process.exit(1);
}
console.log('\none route is drawn by one function.');
