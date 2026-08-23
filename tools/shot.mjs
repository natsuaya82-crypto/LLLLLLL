/* ---------------------------------------------------------------------------
   tools/shot.mjs — a picture of a screen, so a person can look at it.

   Run it:   node tools/shot.mjs home words gram:neg
             node tools/shot.mjs --all
             node tools/shot.mjs --dark home
             node tools/shot.mjs --lang ja home

   NOT a gate. The checks prove a screen renders, that every button resolves
   and that nothing is hard-coded. None of them can say whether it looks
   right, and nobody should be asked to approve a change to a screen by
   reading a diff of string concatenation.

   A route and its argument are one name: `gram:neg` is the negation stage,
   `set:voice` is that room of the settings. Bare `gram` is the list, which is
   a different screen, and both are worth looking at.

   `ob` is the exception, because the onboarding is the one screen with no
   route -- it is what the app is until SET.done, not a place you go. It is
   also the screen that gets rebuilt most often, and it was the only one
   nobody could ask for a picture of. `ob` is every step; `ob:2` is one. The
   steps with a second face -- borrowing, the sound offered again -- come from
   obStates() in tools/fixture.mjs, the same list act-check and press walk, so
   a face added there is photographed without touching this file.

   The app is filled from tools/fixture.mjs first -- the same six words and
   three letters the checks walk -- so two pictures taken a week apart differ
   because the screen changed and for no other reason.

   Pictures land in shots/ and that directory is not committed. They are for
   looking at once and throwing away; the screen is what gets kept.
   --------------------------------------------------------------------------- */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seed, obStates, halfDone } from './fixture.mjs';
import { chromium, LAUNCH } from './browser.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const WWW = path.join(ROOT, 'www');
const OUT = path.join(ROOT, 'shots');
const PORT = 8124;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

const argv = process.argv.slice(2);
const all = argv.indexOf('--all') >= 0;
/* --half: every screen that only exists once something is half-done. They are
   not routes, so --all does not reach them. */
const half = argv.indexOf('--half') >= 0;
const dark = argv.indexOf('--dark') >= 0;
const paid = argv.indexOf('--paid') >= 0;
const mine = argv.indexOf('--myfont') >= 0;
const li = argv.indexOf('--lang');
const uiLang = li >= 0 ? argv[li + 1] : 'en';
/* everything that is not a flag, and not the word after --lang. li is -1 when
   there is no --lang, and li + 1 is then 0, which silently ate whichever
   screen was asked for first. */
const named = argv.filter((a, i) => !a.startsWith('--') && !(li >= 0 && i === li + 1));

const srv = http.createServer((q, r) => {
  const f = path.join(WWW, q.url === '/' ? 'index.html' : q.url.split('?')[0]);
  let body;
  try { body = fs.readFileSync(f); } catch (e) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain',
                     'Cache-Control': 'no-store' });
  r.end(body);
}).listen(PORT);

fs.mkdirSync(OUT, { recursive: true });

/* A phone, not a desktop window: this is a Capacitor app and a screen that
   only holds together at 1200 px wide is not a screen anyone will see. */
const br = await chromium.launch(LAUNCH);
const pg = await br.newPage({ viewport: { width: 390, height: 844 },
                              deviceScaleFactor: 2 });
await pg.goto(`http://localhost:${PORT}/`);
/* index.html holds a splash over everything for the later of 900 ms and the
   first draw, then fades it for another 420. Waiting a fixed moment
   photographed the splash instead of the screen -- and a picture of the
   splash looks like a screen that renders, so nothing said otherwise. Wait
   for it to be gone, and refuse to take the picture if it is not. */
await pg.waitForSelector('#splash', { state: 'detached', timeout: 10000 });

/* As a string, so it is evaluated in the page's own global scope. Handed to a
   function instead, the closures it returns capture this file's scope -- and
   the parameter holding the source was called `ob`, which is also the name of
   the app's onboarding state, so every `ob.step = 1` inside them set a
   property on a string and the faces silently never happened. act-check and
   press already did it this way. */
await pg.evaluate('window.__seed = ' + seed.toString());
await pg.evaluate('window.OB_STATES = (' + obStates.toString() + ')()');
/* And the screens that only exist once something is half-done -- a menu open,
   an account frozen, a post taken down. They are not routes and nothing at
   rest shows them, so `--all` never photographed one; `hd@N`, or `--half`
   for the lot. Same list act-check and press walk. */
await pg.evaluate('window.HALF = (' + halfDone.toString() + ')()');
await pg.evaluate(({ s, ui, dk, pd, mf }) => {
  eval('(' + s + ')()');           /* the fixture, run inside the page */
  SET.done = true;                 /* past the onboarding, unless it is what was asked for */
  if (pd) SET.plan = 'pro';       /* --paid: the faces the free plan does not show */
  if (mf) SET.myfont = true;       /* --myfont: the app in the letters somebody drew */
  SET.ui = ui;
  SET.theme = dk ? 'dark' : 'light';
  /* SET.theme is what is stored; applyTheme() is what puts data-theme on the
     document. Setting the one without calling the other photographed the
     light theme with --dark on the command line, and the picture looked
     perfectly fine -- which is how it would have gone unnoticed. */
  if (typeof applyTheme === 'function') applyTheme();
}, { s: seed.toString(), ui: uiLang, dk: dark, pd: paid, mf: mine });

/* Every route the app has, and every argument each one takes, asked of the
   page rather than listed here -- so a screen added tomorrow can be
   photographed tomorrow. */
const routes = await pg.evaluate(() => Object.keys(PAGES));
/* A screen is a route AND its argument -- vSet with none takes none of its
   six branches, vGram with none is the list rather than a stage. --all means
   all of them, and the list comes from the app the way act-check and
   i18n-check get theirs, so a stage added tomorrow is photographed tomorrow. */
const withArgs = await pg.evaluate((rs) => {
  const argsOf = (r) =>
    r === 'set'  ? [null].concat(SETS.map((x) => x.id)) :
    r === 'gram' ? [null].concat(stAll().map((p) => p.id)) :
    r === 'ltset' ? [null].concat(LT_KINDS) :
    r === 'fm' ? ['tira'] :
    r === 'thread' ? [null].concat(POSTS.map((x) => x.id)) :
    r === 'photo' ? [null].concat(POSTS.filter((x) => postPics(x).length).map((x) => x.id + ':0')) :
    [null];
  const out = [];
  rs.forEach((r) => argsOf(r).forEach((a) => out.push(a === null ? r : r + ':' + a)));
  return out;
}, routes);
/* The onboarding's steps, and the extra faces some of them have, asked of the
   app the same way. OB_STEPS is the app's count, obStates() is the fixture's
   list -- neither is written out again here. */
const obShots = await pg.evaluate(() =>
  [].concat(Array.apply(null, { length: OB_STEPS }).map((_, i) => 'ob:' + i),
            OB_STATES.map((_, i) => 'ob@' + i)));
/* A face is filed under what the fixture calls it, because "ob@2" says
   nothing and "saying what a letter reads" is the whole point of looking. */
const obLabel = await pg.evaluate(() =>
  OB_STATES.map((s) => s[0].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')));
const hdShots = await pg.evaluate(() => HALF.map((_, i) => 'hd@' + i));
const hdLabel = await pg.evaluate(() =>
  HALF.map((s) => s[0].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')));
const expand = (s) => (s === 'ob' ? obShots : s === 'half' ? hdShots : [s]);
const shots = (all
  ? withArgs.concat(obShots).concat(hdShots)
  : half ? hdShots
  : named.length ? named : ['profile']).reduce((a, s) => a.concat(expand(s)), []);

const made = [];
for (const spec of shots) {
  const ob = /^ob[:@](\d+)$/.exec(spec);
  const hd = /^hd@(\d+)$/.exec(spec);
  /* Only the first colon separates the route from its argument. A form's
     argument has colons of its own -- `form:card:w/kano` is the card of the
     word kano -- and splitting on all of them handed vForm the word "card",
     which is not a form key, so every sheet in the app photographed as
     "this form is gone". */
  const ci = spec.indexOf(':');
  const r = ci < 0 ? spec : spec.slice(0, ci);
  const a = ci < 0 ? undefined : spec.slice(ci + 1);
  if (!ob && !hd && routes.indexOf(r) < 0) { console.error(`  no route called ${r}`); continue; }
  const err = hd
    ? await pg.evaluate((n) => {
        try {
          /* The entry sets the app up and RETURNS the html. render() is what
             puts it on the screen, and it rebuilds from the state the entry
             just set -- which is why an entry that tidied up after itself
             photographs the screen it tidied back to. */
          SET.done = true;
          window.__seed();
          HALF[n][1]();
          render();
          return null;
        } catch (e) { return String(e && e.message || e); }
      }, Number(hd[1]))
    : ob
    ? await pg.evaluate(({ n, face }) => {
        try {
          /* The onboarding is not somewhere you go: it is what render() shows
             while SET.done is false, so that is how it is asked for. */
          SET.done = false;
          SET.obback = null;      /* the door is shown for this, not for a step */
          window.ob.step = n; window.ob.mode = ''; window.ob.lid = '';
          if (face) OB_STATES[n][1]();   /* sets ob.* and returns the html render() rebuilds */
          render();
          return null;
        } catch (e) { return String(e && e.message || e); }
      }, { n: Number(ob[1]), face: spec.charAt(2) === '@' })
    : await pg.evaluate(({ r, a }) => {
        try { SET.done = true; go(r, a === undefined ? undefined : a); render(); return null; }
        catch (e) { return String(e && e.message || e); }
      }, { r, a });
  if (err) { console.error(`  ${spec} threw: ${err}`); continue; }
  await pg.waitForTimeout(120);            /* fonts and any transition settle */
  const covered = await pg.evaluate(() => !!document.getElementById('splash') ||
                                          !document.getElementById('app') ||
                                          !document.getElementById('app').innerHTML.trim());
  if (covered) { console.error(`  ${spec}: the splash is still up, or #app is empty`); continue; }
  /* Every separator a route may carry becomes a dash: a form key with a
     slash in it wrote the picture into a directory named after half of it. */
  const name = (hd ? 'half-' + hdLabel[Number(hd[1])]
                   : spec.charAt(2) === '@' ? 'ob-' + obLabel[Number(ob[1])]
                                            : spec.replace(/[:/#]+/g, '-')) +
               (dark ? '-dark' : '') +
               (uiLang === 'en' ? '' : '-' + uiLang) + '.png';
  const file = path.join(OUT, name);
  await pg.screenshot({ path: file, fullPage: true });
  made.push(path.relative(ROOT, file));
}

await br.close();
srv.close();

if (!made.length) { console.error('nothing was photographed.'); process.exit(1); }
console.log(made.join('\n'));
