/* ---------------------------------------------------------------------------
   tools/open-check.mjs — what is ON THE SCREEN when the app opens.

   Run it:   node tools/open-check.mjs

   There are three states a phone can be in when Lingua starts, and they are
   three different screens:

     nothing on the phone at all      the onboarding, from its first step
     part-way through, in the walk    the app, dimmed, with one thing lit
     finished, then signed out        the door, and nothing but the door
                                      「ログアウトはオンボーディングでねえのが
                                        正解」「ログアウトした時はログイン画面
                                        から動かさない」 OWNER
     finished, and signed in          the app

   `appIs()` in `www/shell.js` is where that is decided and it has been right
   since 2026-08-27. **It was right on the day the owner's phone opened on the
   wrong screen**, which is the whole reason this file exists: `appIs()`
   answered `'ob'` for a brand new phone, correctly, and what got drawn was
   the door — because `vOb()` draws the door for whichever step `ob.step` is
   sitting on, and the first step WAS the door.

   So a check that calls `appIs()` and compares the string is a check that
   would have been green through the whole of it. This one reads `#app` after
   a real boot instead. The leader measured the fault exactly this way:

     open the page with an empty localStorage -> read #app's innerText
     -> if 「Sign in」 is on it, red

   Each state gets a browser context of its own, so `localStorage` is
   genuinely empty rather than emptied: the app writes its settings and mints
   its first language during boot, and a state seeded into a context that has
   already booted once is a state on top of somebody else's phone.

   What it does NOT hold: which of the onboarding's steps comes first beyond
   "not the door", and what the door says. The order is `www/onboard.js`'s and
   the words are `t()`'s. What is held is the property the owner's phone did
   not have — a new phone is not shown a door, and a signed-out one is shown
   nothing else.
   --------------------------------------------------------------------------- */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium, LAUNCH } from './browser.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', 'www');
const PORT = 8152;

const mime = (f) => f.endsWith('.html') ? 'text/html; charset=utf-8'
  : f.endsWith('.js') ? 'application/javascript; charset=utf-8'
  : 'text/plain; charset=utf-8';
const srv = http.createServer((rq, rs) => {
  const f = path.join(ROOT, rq.url === '/' ? 'index.html' : rq.url.split('?')[0]);
  let d = null;
  try { d = fs.readFileSync(f); } catch (e) { d = null; }
  if (d === null) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': mime(f) });
  rs.end(d);
});
await new Promise(r => srv.listen(PORT, r));

const br = await chromium.launch(LAUNCH);
const fails = [], said = [];
const no = (m) => fails.push(m);
const say = (m) => said.push(m);

/* A phone in a given state, booted from nothing. `pre` is written into
   localStorage BEFORE any of the app's scripts run -- core.js reads its
   settings and net.js reads its session at load, so a state set after the
   boot is a state the boot never saw. */
async function boot(pre, drive) {
  const cx = await br.newContext({ viewport: { width: 390, height: 844 } });
  const pg = await cx.newPage();
  if (pre) await pg.addInitScript((kv) => {
    try { for (const k in kv) localStorage.setItem(k, kv[k]); } catch (e) {}
  }, pre);
  await pg.goto(`http://127.0.0.1:${PORT}/`);
  await pg.waitForSelector('#splash', { state: 'detached', timeout: 15000 }).catch(() => {});
  await pg.waitForTimeout(400);
  /* `drive` is a step of the walk taken for real, for the states that are not
     a boot: `ob` is in memory and nothing else, so the walk cannot be seeded
     into localStorage the way the finished ones can. */
  if (drive) { await pg.evaluate(drive); await pg.waitForTimeout(300); }
  /* What is on the screen, and what the app thinks it is -- both, because the
     fault this file was written for is the two disagreeing. */
  const r = await pg.evaluate(() => {
    const app = document.getElementById('app');
    const has = (s) => !!(app && app.querySelector(s));
    return {
      is: (typeof appIs === 'function') ? appIs() : '(no appIs)',
      step: (typeof ob === 'object' && ob) ? ob.step : null,
      done: !!(typeof SET === 'object' && SET && SET.done),
      inS: (typeof netSignedIn === 'function') ? netSignedIn() : null,
      /* The onboarding and the door are one view -- vOb() -- so the wrapper
         says "one of the two" and the buttons say which. */
      ob: has('.ob'),
      door: has('[data-do="obSignInApple"]') || has('[data-do="obMailGo"]'),
      draw: has('#gcanv'),
      /* The walk's grey, cut around the one lit thing. obPane() in
         www/onboard.js is what draws it; render() adds it last, after the
         app's own screen is on the page, because the hole is MEASURED. */
      dim: document.querySelectorAll('[data-dim="1"]').length,
      text: (app ? app.innerText : '').replace(/\s+/g, ' ').trim().slice(0, 120)
    };
  });
  await cx.close();
  return r;
}

/* A session the way netTook() stores one: `rt` is the whole of what
   netSignedIn() asks for. The access token is not a real JWT and does not
   need to be -- netAnonTok() answers false for what it cannot read, and false
   is what a real account is. */
const SESS = JSON.stringify({ at: 'not a jwt', rt: 'a refresh token',
                              uid: '11111111-1111-4111-8111-111111111111', anon: false });

/* ---- 1. a phone with nothing on it ------------------------------------- */
{
  const r = await boot(null);
  say('new phone: appIs()=' + r.is + '  ob.step=' + r.step + '  screen=' + JSON.stringify(r.text));
  if (r.is !== 'ob') no('a phone with nothing on it: appIs() said ' + r.is + ', wanted ob');
  if (!r.ob) no('a phone with nothing on it: the onboarding is not on the screen at all');
  /* THE ONE THIS FILE EXISTS FOR. */
  if (r.door) no('a phone with nothing on it OPENS ON THE DOOR -- ' +
                 'the first step of the onboarding is signing in. ' + JSON.stringify(r.text));
  if (/sign\s*in/i.test(r.text)) no('a phone with nothing on it has "Sign in" on the screen: ' +
                                    JSON.stringify(r.text));
  if (!r.draw) no('a phone with nothing on it does not open on the drawing step');
}

/* ---- 2. finished, and signed out --------------------------------------- */
{
  const r = await boot({ 'lingua.set': JSON.stringify({ done: true }) });
  say('signed out: appIs()=' + r.is + '  screen=' + JSON.stringify(r.text));
  if (r.is !== 'door') no('finished then signed out: appIs() said ' + r.is + ', wanted door');
  if (!r.door) no('finished then signed out: the door is not on the screen');
  /* 「ログアウトした時はログイン画面から動かさない」 -- the door, and the
     onboarding's own screens are not behind it. */
  if (r.draw) no('finished then signed out: the drawing step is on the screen, not the door');
}

/* ---- 3. finished, and signed in ---------------------------------------- */
{
  const r = await boot({ 'lingua.set': JSON.stringify({ done: true }), 'lingua.sess': SESS });
  say('signed in: appIs()=' + r.is + '  screen=' + JSON.stringify(r.text));
  if (!r.inS) no('finished and signed in: the fixture session did not take');
  if (r.is !== 'app') no('finished and signed in: appIs() said ' + r.is + ', wanted app');
  if (r.ob) no('finished and signed in: the onboarding or the door is on the screen, not the app');
}

/* ---- 4. the walk through the app, which IS the app --------------------- */
{
  /* Every road out of the drawing step ends here -- obDone() and
     obTakeCh() both set OB_TOUR and start the walk -- so this is the screen
     after the first one a new phone ever shows. It is not a face of vOb():
     it is the app with everything but one thing greyed out, and render() in
     www/glyph.js falls through to the ordinary render to build it.

     What decides that fall-through is appIs(), and until the door moved back
     to the end this state was always signed in by the time it ran. Now it
     never is -- the account comes AFTER -- so an appIs() that asks only
     "is there a session" answers 'door', and somebody who has just drawn
     their first letter is shown a sign-in form instead of their app. */
  /* Borrowing a character is the road that needs no drawing. It was
     obSkipDraw() until 「後で描く」 came off the screen on 2026-08-28 -- the
     button was removed, so the function went with it (nothing may be left
     that no screen names), and this drives the road that is still there. */
  const r = await boot(null, () => { obTakeCh('\u16a0'); });
  say('the walk: appIs()=' + r.is + '  ob.step=' + r.step + '  screen=' + JSON.stringify(r.text));
  if (r.step === null) no('the walk: could not be started at all');
  if (r.door) no('THE WALK SHOWS THE DOOR. A new phone draws a letter and is ' +
                 'asked to sign in, in the middle of the onboarding. ' + JSON.stringify(r.text));
  if (r.ob) no('the walk: vOb() is on the screen -- the walk is the app, dimmed, ' +
               'not a face of the onboarding');
  if (r.is !== 'app') no('the walk: appIs() said ' + r.is + ', wanted app -- the walk IS the app');
  /* And that it is the WALK and not merely the app: the grey with a hole in
     it. "Not the door" is also true of the app with no overlay on it, which
     would be the onboarding having quietly ended. */
  if (!r.dim) no('the walk: nothing is dimmed -- the app is on screen with no walk over it');
}

await br.close();
srv.close();

said.forEach(s => console.log('  ' + s));
if (fails.length) {
  console.error('\nopen-check FAILED');
  fails.forEach(f => console.error('  - ' + f));
  process.exit(1);
}
console.log('open-check: four states, four screens -- and none of them the wrong one.');
