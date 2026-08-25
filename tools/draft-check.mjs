/* ---------------------------------------------------------------------------
   tools/draft-check.mjs — what you have half written is still there after you
   press back.

   Run it:   node tools/draft-check.mjs

   Three things in this app are half-finished work that lives in memory and
   nowhere else: `PW`, a post being written; `IMP`, a list being read in; and
   `ltDraft`, a letter's name typed and not saved. viewReset() in
   www/shell.js is the list of them, and it is the only thing that throws
   them away.

   The worry this check was written for was that `back()` threw them away --
   press back off the composer and the sentence you were writing is gone. It
   does not, and that is worth pinning down rather than believing: `back()`
   pops the trail and renders, it does not call viewReset(), and `pwSetLn`
   keeps every keystroke in PW rather than in the field. So the draft is
   still there and the composer reached again is the composer you left.

   Nothing here asserts whether leaving the composer OUGHT to ask anything.
   That is the owner's to say and it is not settled. What is asserted is the
   part that is not a matter of taste: the words must still exist afterwards.

   And one thing that is not taste either. `DO('back')` is not only the back
   button -- the photograph editor's Done is `back()` too (www/post.js:1222
   and 1228, `.mkr` and `.mkdone`). A guard put inside `back()` without a way
   through would turn Done into "throw this away?", asked every time somebody
   finishes putting letters on a picture, with a draft that is not going
   anywhere. So Done is walked here as its own case: it must come back to the
   composer, with the draft whole, having asked nothing.

   Exit code is 0 only when every case holds.
   --------------------------------------------------------------------------- */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seed } from './fixture.mjs';
import { chromium, LAUNCH } from './browser.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', 'www');
const PORT = 8145;

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
const pg = await br.newPage();
await pg.goto(`http://127.0.0.1:${PORT}/`);
await pg.waitForTimeout(300);
await pg.evaluate('window.__seed = ' + seed.toString());

const R = await pg.evaluate(() => {
  const out = { fails: [], said: [] };
  const LN = 'a line half written';
  const MN = 'a meaning half written';

  /* Signed in, because the composer sends you to the feed if you are not --
     openPost() says so itself rather than trusting the trail. */
  const start = () => {
    window.__seed(); SET.done = true; SET.plan = 'pro';
    SESS = { rt: 'a refresh token' };
    NAV = [{ r: 'feed' }]; window.route = 'feed';
  };
  /* Every case counts what it was asked, because "asked nothing" is half of
     what two of them are about. */
  let asked = 0;
  const realConfirm = window.confirm;
  window.confirm = function(){ asked++; return true; };

  /* ---- a post half written, and the back button -------------------------
     Typed through pwSetLn/pwSetMn, which is what the field's data-in calls on
     every keystroke -- not by setting PW behind the app's back, or this would
     prove the test's own assignment and nothing about the app. */
  start();
  openPost();
  const opened = JSON.stringify(here());
  pwSetLn(LN); pwSetMn(MN);
  asked = 0;
  back();
  out.said.push('a post half written, then back: the line is ' +
    (PW.ln === LN ? 'still there' : JSON.stringify(PW.ln)) +
    ', and it asked ' + asked + ' question(s)');
  if (opened !== '{"r":"form","a":"post:"}')
    out.fails.push('openPost() did not open the composer -- it opened ' + opened +
      ', so nothing below is about the composer');
  if (PW.ln !== LN)
    out.fails.push('pressing back off the composer threw away the line: ' +
      JSON.stringify(PW.ln));
  if (PW.mn !== MN)
    out.fails.push('pressing back off the composer threw away the meaning: ' +
      JSON.stringify(PW.mn));

  /* ---- and the composer reached again is the one you left ---------------
     PW surviving is not enough on its own. openForm() keeps the body as a
     STRING, so the draft can be whole in memory and the screen still come
     back empty if FORM.html went stale. pwFresh() is what keeps the two in
     step, and this is the case that would notice it going. */
  openPost();
  const body = (FORM && FORM.html) || '';
  out.said.push('the composer reached again shows what was typed: ' +
    ((body.indexOf(LN) >= 0 && body.indexOf(MN) >= 0) ? 'yes' : 'NO'));
  if (body.indexOf(LN) < 0)
    out.fails.push('the composer was reached again and the line is not on it -- ' +
      'PW kept it and the screen did not');
  if (body.indexOf(MN) < 0)
    out.fails.push('the composer was reached again and the meaning is not on it');

  /* ---- Done on the photograph editor is back(), and must go through ------
     www/post.js:1222 and 1228. The trail is feed -> composer -> marks, and
     Done pops the marks off it. What must be true afterwards: you are on the
     composer, the draft is whole, and nothing was asked. A guard inside
     back() with no way through fails this and only this. */
  start();
  openPost();
  pwSetLn(LN); pwSetMn(MN);
  /* A picture to put letters on. pwMarkOpen() returns without opening
     anything when there is none, and a case that never opened its screen
     proves nothing. One pixel is a picture. */
  pwPics().push({ u: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' });
  pwMarkOpen(0);
  const onMarks = JSON.stringify(here());
  asked = 0;
  back();                                  /* what .mkr and .mkdone do */
  const afterDone = JSON.stringify(here());
  out.said.push('Done on the photograph editor lands on ' + afterDone +
    ' and asked ' + asked + ' question(s)');
  if (onMarks.indexOf('marks') < 0)
    out.fails.push('pwMarkOpen() did not open the photograph editor -- it opened ' +
      onMarks + ', so the Done case below proves nothing');
  else {
    if (afterDone !== '{"r":"form","a":"post:"}')
      out.fails.push('Done on the photograph editor did not land back on the ' +
        'composer -- it landed on ' + afterDone);
    if (asked !== 0)
      out.fails.push('Done on the photograph editor asked ' + asked + ' question(s). ' +
        'It is the same back() as the back button, and a guard put in back() ' +
        'without a way through turns finishing a picture into "throw this away?"');
    if (PW.ln !== LN)
      out.fails.push('Done on the photograph editor threw away the line: ' +
        JSON.stringify(PW.ln));
  }

  /* ---- the other two things viewReset() lists ---------------------------
     A letter's name typed and not saved, and a list being read in. Same
     rule, and they are on the same list, so a change to what back() does
     reaches all three at once. */
  start();
  ltDraft = 'a letter name typed';
  IMP = impBlank(); IMP.rows = [{ a: 1 }];
  NAV = [{ r: 'letters' }, { r: 'letter', a: 'x' }]; window.route = 'letter';
  asked = 0;
  back();
  out.said.push('a letter name typed and a list being read in survive back: ' +
    ((ltDraft === 'a letter name typed' && IMP && IMP.rows && IMP.rows.length === 1)
      ? 'both' : 'NO'));
  if (ltDraft !== 'a letter name typed')
    out.fails.push('pressing back threw away a letter name typed and not saved: ' +
      JSON.stringify(ltDraft));
  if (!IMP || !IMP.rows || IMP.rows.length !== 1)
    out.fails.push('pressing back threw away a list being read in');

  window.confirm = realConfirm;
  return out;
});

await br.close();
srv.close();

R.said.forEach(s => console.log('  ' + s));
if (R.fails.length) {
  R.fails.forEach(f => console.log('FAIL: ' + f));
  process.exit(1);
}
console.log('what you have half written is still there after you press back.');
