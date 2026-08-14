/* ---------------------------------------------------------------------------
   tools/act-check.mjs — the net under the buttons.

   Run it before every release:   node tools/act-check.mjs

   Until this existed, a button carried its own JavaScript inside the markup:

     '<button onclick="wdRelHTML()">'

   which is a function name written as text, in a string, inside an attribute.
   Nothing read it. Renaming the function did not break the build. Deleting it
   did not break the build. What broke was the button, on somebody's phone,
   with `wdRelHTML is not defined` in a console nobody was looking at. That
   shipped once already.

   Now a button carries a name and nothing else:

     '<button' + DO('openWord', ['kan']) + '>'   ->  data-do="openWord" data-a=…

   and every name a screen is allowed to say is written once, by hand, in
   www/act-map.js, with the function itself as the second argument. This walks
   every screen in every language and proves both directions.

   What it checks
     1. nothing missing   every name in every rendered screen is in a table.
                          A name with nothing behind it is a dead button
     2. nothing dead      every entry in every table is asked for by some
                          screen. An entry nobody names is a button that used
                          to exist, and it will rot silently
     3. the arguments     every data-a and data-b parses as JSON. They are
                          written by JSON.stringify, so a failure here means
                          something escaped the escaping
     4. no code left      no on-anything attribute survives anywhere in any
                          rendered screen. One is enough to bring the whole
                          class of bug back
     5. every page shows   every route in PAGES has a view on it, and every
        something, and     view belongs to a route. A route with no view fell
        every view is a    through to the home screen under another screen's
        page               name and looked like nothing was wrong; a view with
                           no route simply stopped being reachable. vOb is the
                           one exception -- the onboarding is what the app is
                           until SET.done, not somewhere you navigate to --
                           and it is exempt by name so a second one cannot
                           quietly join it

   What it cannot see, so that nobody mistakes silence for safety:
     - whether the function does the right thing. It proves the button is
       wired to something that exists, not that the something is correct
     - arguments of the wrong shape. openWord('kan') and openWord(7) are the
       same to this check
     - anything reached only after a press. A screen that only appears once
       something has been tapped is walked here only if some view or open*
       function renders it

   Exit code is 0 only when all four pass.
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
const PORT = 8122;
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
const pageErrors = [];
pg.on('pageerror', e => pageErrors.push(e.message));
await pg.goto(`http://127.0.0.1:${PORT}/`);
await pg.waitForTimeout(300);

/* Fill the app with something to walk. Shared with tools/press.mjs so the two
   never drift into walking different apps. */
await pg.evaluate(seed);
/* The half-done screens go in as page globals rather than staying inline here,
   because tools/press.mjs has to build each of them again before every press
   and a second copy of this list would drift the first time one was added. */
await pg.evaluate('window.__obStates = ' + obStates.toString());
await pg.evaluate('window.__halfDone = ' + halfDone.toString());

const R = await pg.evaluate(() => {
  const out = { missing: [], dead: [], bad: [], inline: [], screens: 0,
                seen: { do: [], in: [], kd: [] }, threw: [], routes: [], pages: 0, placed: 0, views: 0 };
  const seenDo = {}, seenIn = {}, seenKd = {}, named = {};

  /* Every name this piece of markup asks for, and whether its arguments are
     the JSON they were written as. */
  function harvest(where, html){
    let m, lastDo = '';
    const attr = /\sdata-(do2?|in|ch|kd|a|b)="([^"]*)"/g;
    while ((m = attr.exec(html))) {
      const k = m[1];
      /* the browser has already turned &quot; back into " for us? no — this is
         the raw string, so undo the one escape esc() makes */
      const v = m[2].replace(/&quot;/g, '"').replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      if (k === 'a' || k === 'b') {
        try {
          const args = JSON.parse(v);
          /* The route a button goes to. data-a follows its data-do on the same
             element, so the name just read is the one these belong to. */
          if (/^go(In|Tab)?$/.test(lastDo) && args.length && typeof args[0] === 'string')
            named[args[0]] = 1;
        } catch (e) { out.bad.push(where + ': ' + v); }
        continue;
      }
      if (k === 'do' || k === 'do2') {
        seenDo[v] = 1;
        lastDo = v;
        if (!ACT[v]) out.missing.push(where + ': pressed -> ' + v);
      } else if (k === 'in' || k === 'ch') {
        seenIn[v] = 1;
        if (!ACT_IN[v]) out.missing.push(where + ': typed -> ' + v);
      } else {
        seenKd[v] = 1;
        if (!ACT_KEY[v]) out.missing.push(where + ': Enter -> ' + v);
      }
    }
    /* A colour written into the markup. Six screens carried
       style="color:#c9553f" for the same delete red, and this file carried a
       seventh -- none of which changed when the theme did, because a hex in a
       style attribute cannot. Colours are variables in index.html. Brand marks
       are not caught by this: they use fill= on a path, which is what a logo
       is, not what a screen decides. */
    const paint = /\sstyle="[^"]*(?:color|background)\s*:\s*(#[0-9a-fA-F]{3,8}|rgb)/gi;
    let pm;
    while ((pm = paint.exec(html))) out.inline.push(where + ': a colour in the markup -- ' + pm[1]);
    /* Any on-anything attribute at all is the old disease coming back. */
    const inline = /\son(click|input|change|keydown|pointerdown|touchstart|submit|focus|blur)\s*=/gi;
    while ((m = inline.exec(html))) out.inline.push(where + ': ' + m[0].trim());
    out.screens++;
  }

  /* The fixture was seeded by tools/fixture.mjs before this ran. */

  const views  = Object.keys(window).filter(k =>
    /^v[A-Z]/.test(k) && typeof window[k] === 'function' && k !== 'vOb');
  const opens  = Object.keys(window).filter(k =>
    /^open[A-Z]/.test(k) && typeof window[k] === 'function' && k !== 'openForm');

  /* Every screen, under both plans and with and without a dictionary, because
     a button that only exists when there is nothing yet is still a button. */
  ['free','plus'].forEach(plan => {
    SET.plan = plan;
    [false, true].forEach(empty => {
      const keep = WORDS;
      if (empty) WORDS = [];
      views.forEach(v => {
        const route = v.slice(1).toLowerCase();
        window.route = route; NAV = [{ r: route }];
        try { harvest(v, window[v]()); }
        catch (e) { out.threw.push(v + ' (' + plan + '/' + (empty?'empty':'full') + '): ' + e.message); }
      });
      WORDS = keep;
    });
  });
  SET.plan = 'free';

  /* Onboarding, every step -- and the steps that have a second face: the
     writing systems to choose from, the sounds offered again, the characters
     on offer to borrow. */
  SET.done = false;
  for (let s = 0; s <= 4; s++) {
    ob.step = s;
    try { harvest('vOb step ' + s, vOb()); } catch (e) { out.threw.push('vOb ' + s + ': ' + e.message); }
  }
  const obStates = window.__obStates();
  obStates.forEach(([label, run]) => {
    try { harvest(label, run()); } catch (e) { out.threw.push(label + ': ' + e.message); }
  });
  ob.mode = 'draw';
  SET.done = true;

  /* A screen that takes an argument is a different screen for each argument:
     a settings room, a grammar stage, a letter in the editor. A walk that
     only ever renders the argument-less face of these would call half the
     buttons in the app dead. */
  function walkArg(route, view, args, label){
    args.forEach(a => {
      window.route = route; NAV = [{ r: route, a: a }];
      try { harvest(label + ':' + a, view()); }
      catch (e) { out.threw.push(label + ':' + a + ': ' + e.message); }
    });
  }
  /* The data room only offers its rows on the paid plan; on the free one it
     offers the lock instead, and both are screens with buttons on them. */
  ['free','plus'].forEach(pl => {
    SET.plan = pl;
    walkArg('set', vSet, SETS.map(x => x.id), 'vSet ' + pl);
  });
  SET.plan = 'free';
  walkArg('gram', vGram, stAll().map(p => p.id), 'vGram');
  /* The letters chapter is three lists now and they share no buttons:
     only the digits page carries the base, only the alphabet counts the
     ones with no reading. */
  walkArg('ltset', vLtset, LT_KINDS, 'vLtset');
  /* A conversation, one per post there is. The thread of a post nobody has
     answered is still a screen -- it is what every post's thread is on the
     day it is written -- and the answered one is in halfDone above. */
  walkArg('thread', vThread, postAll().map(p => p.id), 'vThread');

  /* the forms, which are pages reached by opening rather than by routing */
  const forms = [
    ['openWord',      () => openWord('kano')],
    ['openAdd',       () => openAdd()],
    ['openAdd child', () => openAdd('kano')],
    ['openNote',      () => openNote(0)],
    ['openNote new',  () => openNote(-1)],
    ['openSlot',      () => openSlot('greet','yes')],
    ['openOwnPhase',  () => openOwnPhase()],
    ['openPick',      () => openPick('m')],
    ['openImport',    () => openImport()]
  ];
  forms.forEach(([label, run]) => {
    try {
      run();
      if (FORM && FORM.html) harvest(label, FORM.html);
    } catch (e) { out.threw.push(label + ': ' + e.message); }
  });
  try { closeSheet(); } catch (e) {}
  /* anything else that opens, in case one is added and forgotten above */
  opens.forEach(o => {
    if (forms.some(f => f[0].split(' ')[0] === o)) return;
    try {
      window[o].length ? window[o]('kano') : window[o]();
      if (FORM && FORM.html) harvest(o, FORM.html);
    } catch (e) { out.threw.push(o + ': ' + e.message); }
  });
  try { closeSheet(); } catch (e) {}

  /* Screens whose buttons only exist once something is half-done: a word
     being spelled, a letter being drawn, suggestions on the table. */
  const states = window.__halfDone();
  states.forEach(([label, run]) => {
    try { harvest(label, run() || ''); }
    catch (e) { out.threw.push(label + ': ' + e.message); }
  });

  /* The tab bar, which is on every screen and part of none of them: it lives
     beside #app and render() paints it, so no view's HTML carries it. This is
     where the five roots get named. */
  try { harvest('the tab bar', tabBar()); }
  catch (e) { out.threw.push('the tab bar: ' + e.message); }

  /* the three faces of the search tab, which a plain render never reaches */
  try {
    fq = 'a'; harvest('vFind searched', findBodyHTML());
    fq = ''; fpick = { k:'s', v:'k' }; harvest('vFind by sound', findBodyHTML());
    fpick = { k:'l', v:'l1' }; harvest('vFind by letter', findBodyHTML());
    fq = ''; fpick = null;
  } catch (e) { out.threw.push('the search tab: ' + e.message); }

  /* the other direction: an entry nobody ever names */
  Object.keys(ACT).forEach(k => { if (!seenDo[k]) out.dead.push('pressed: ' + k); });
  Object.keys(ACT_IN).forEach(k => { if (!seenIn[k]) out.dead.push('typed: ' + k); });
  Object.keys(ACT_KEY).forEach(k => { if (!seenKd[k]) out.dead.push('Enter: ' + k); });

  /* ---- 5. the routes ---------------------------------------------------
     PAGES says what a route is called; www/route-map.js says what it shows.
     Both directions, for the same reason the action table is checked both
     ways: a page with no view is a screen that silently becomes the home
     screen, and a view with no page is a screen nobody can reach. */
  out.pageNames = Object.keys(PAGES);
  Object.keys(PAGES).forEach(r => {
    out.pages++;
    if (typeof PAGES[r].view !== 'function') out.routes.push('PAGES.' + r + ' shows nothing');
  });
  const shown = Object.keys(PAGES).map(r => PAGES[r].view).filter(Boolean);
  Object.keys(window).filter(k => /^v[A-Z]/.test(k) && typeof window[k] === 'function')
    .forEach(v => {
      if (v === 'vOb') return;            /* what the app is, not a place in it */
      out.views++;
      if (shown.indexOf(window[v]) < 0) out.routes.push(v + ' is on no page');
      else out.placed++;
    });

  out.named = Object.keys(named);
  out.seen.do = Object.keys(seenDo).length;
  out.seen.in = Object.keys(seenIn).length;
  out.seen.kd = Object.keys(seenKd).length;
  out.have = { do: Object.keys(ACT).length, in: Object.keys(ACT_IN).length, kd: Object.keys(ACT_KEY).length };
  return out;
});

await br.close();
srv.close();

/* ---- 6. a screen somebody can get to ---------------------------------
   Check 5 proves every route has a view and every view has a route. It does
   not ask whether anybody can arrive: `pickltr` had a view, was on a page,
   and the only two buttons that opened it had been deleted -- so it passed,
   green, holding the one remaining way to break a rule the rest of the app
   enforced. Nothing was wrong with it except that it was gone.

   A route is reached by a button that names it -- go / goIn / goTab, which
   the walk above collected -- or by a function that calls go('x') with the
   name written out. The second is why this reads the source as well as the
   screens: editGlyph() lands on `glyph` and no markup says so. */
const goCalls = {};
for (const f of fs.readdirSync(ROOT)) {
  if (!f.endsWith('.js')) continue;
  const src = fs.readFileSync(path.join(ROOT, f), "utf8");
  let m;
  const re = /\bgo(?:In|Tab)?\s*\(\s*(['"])([a-z]+)\1/g;
  while ((m = re.exec(src))) goCalls[m[2]] = f;
}
/* home is where the app opens, so nothing has to name it. */
const reachable = { home: 1 };
R.named.forEach((r) => { reachable[r] = 1; });
Object.keys(goCalls).forEach((r) => { reachable[r] = 1; });
const stranded = R.pageNames.filter((r) => !reachable[r]);

const fails = [];
const say = (label, list) => { if (list.length) fails.push([label, list]); };
say('a name with nothing behind it', R.missing);
say('an entry no screen ever names', R.dead);
say('an argument that is not the JSON it was written as', R.bad);
say('JavaScript still inside markup', R.inline);
say('a screen that threw while being walked', R.threw);
say('a page with no view, or a view on no page', R.routes);
say('a screen with no way in', stranded.map((r) =>
  r + ': in PAGES, has a view, and nothing anywhere goes to it'));
if (pageErrors.length) fails.push(['the page itself', pageErrors]);

console.log(`screens walked: ${R.screens}`);
console.log(`routes reached: ${R.pageNames.length - stranded.length}/${R.pageNames.length}`);
console.log(`pages: ${R.pages}  views placed ${R.placed}/${R.views}  (vOb is what the app is, not a place in it)`);
console.log(`names: pressed ${R.seen.do}/${R.have.do}  typed ${R.seen.in}/${R.have.in}  Enter ${R.seen.kd}/${R.have.kd}`);

if (fails.length) {
  console.log('');
  for (const [label, list] of fails) {
    console.log(`FAILED — ${label} (${list.length}):`);
    list.slice(0, 40).forEach(x => console.log('  ' + x));
    if (list.length > 40) console.log(`  ... and ${list.length - 40} more`);
  }
  process.exit(1);
}
console.log('\nall five checks pass: every name resolves, and everything that resolves is named.');
