/* ---------------------------------------------------------------------------
   tools/draft-check.mjs — a post you were half way through goes to the drafts
   when you press back, and does not stay in the composer.

   Run it:   node tools/draft-check.mjs

   OWNER DECISION 2026-08-25: 「戻るをした時は確認ダイアログを入れて下書きに
   入れて欲しい」「もう一回開く時には下書きから選べば出てくるだけで、残って
   ほしくない」. Backing out of a half-written post asks; yes puts it in the
   drafts and leaves the composer empty. Both halves matter -- a post that is
   in the drafts and still in the composer is the same post in two places, and
   the next thing you write starts on top of the last thing you abandoned.

   The confirm is window.confirm and there is no new UI: OWNER DECISION
   2026-08-25「新しい UI を足さない。既存の UI だけ」.

   Three things in this app are half-finished work that lives in memory and
   nowhere else: `PW`, a post being written; `IMP`, a list being read in; and
   `ltDraft`, a letter's name typed and not saved. viewReset() in
   www/shell.js is the list of them, and it is the only thing that throws
   them away.

   `DO('back')` is not only the back button -- the photograph editor's Done is
   `back()` too (www/post.js:1222 and 1228, `.mkr` and `.mkdone`). A guard put
   inside `back()` without a way through would turn Done into "keep this?",
   asked every time somebody finishes putting letters on a picture, about a
   post that is not going anywhere. So Done is walked here as its own case: it
   must come back to the composer, with the post still in it, having asked
   nothing. The way through is the screen you are standing on, not a flag.

   The other two things viewReset() lists -- a letter's name typed and not
   saved, and a list being read in -- are walked too. They are not the
   composer, so back() leaves them alone and asks nothing about them.

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
  const PIC = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

  /* Signed in, because the composer sends you to the feed if you are not --
     openPost() says so itself rather than trusting the trail. The drafts are
     emptied too: they are read off the disk at load and this counts them. */
  const start = () => {
    window.__seed(); SET.done = true; SET.plan = 'pro';
    SESS = { rt: 'a refresh token' };
    DRAFTS.length = 0;
    NAV = [{ r: 'profile' }]; window.route = 'profile';
  };
  /* Every case counts what it was asked and what it answered. "asked nothing"
     is half of what two of these are about. */
  /* WHAT ASKING LOOKS LIKE NOW. It was two window.confirm calls and this
     stubbed confirm, answering from a queue. OWNER 2026-08-25「なんでまず
     作らないの？早くやれよ」-- three answers are one box with three buttons,
     so there is nothing to stub: the box is in the page and the answer is a
     press, exactly like every other choice in this app.

     `asked` therefore means "is the box open", 0 or 1, and it is read off
     BACKQ -- the app's own flag -- rather than counted here. The three
     answers are pressed by name: the same names www/act-map.js registers,
     so a rename that misses one fails here as well as in act-check. */
  let asked = 0;
  const realConfirm = window.confirm;
  /* Nothing may reach the OS dialog any more. If anything does, the box was
     not built and the old road is still live -- which would pass every
     assertion below by accident. */
  window.confirm = function(){ out.fails.push(
    'window.confirm was called -- the three answers are a box in the page now, ' +
    'and the two-step confirm should be gone'); return false; };
  /* Typed the way the field types it -- data-in calls these on every
     keystroke. Setting PW directly would prove the test's own assignment. */
  const write = () => { pwSetLn(LN); pwSetMn(MN); };

  /* ---- yes: it goes to the drafts, and the composer is left empty --------
     OWNER DECISION 2026-08-25. Three things have to be true at once, and the
     third is the one that is easy to miss: the composer reached again is
     EMPTY. 「もう一回開く時には下書きから選べば出てくるだけで、残ってほしく
     ない」 -- a draft that is in the drafts AND still in the composer is the
     same post in two places. */
  start();
  openPost();
  const opened = JSON.stringify(here());
  write();
  back();                                    /* opens the box */
  asked = BACKQ ? 1 : 0;
  backKeep();                                /* はい */
  const kept = DRAFTS[DRAFTS.length - 1] || null;
  out.said.push('a post half written, then back: asked ' + asked +
    ', drafts ' + DRAFTS.length + ', composer left ' +
    (PW.ln ? JSON.stringify(PW.ln) : 'empty') +
    ', landed on ' + JSON.stringify(here()));
  if (opened !== '{"r":"form","a":"post:"}')
    out.fails.push('openPost() did not open the composer -- it opened ' + opened +
      ', so nothing below is about the composer');
  if (asked !== 1)
    out.fails.push('backing out of a half-written post asked ' + asked +
      ' question(s), and it has to ask exactly one');
  if (DRAFTS.length !== 1)
    out.fails.push('backing out of a half-written post left ' + DRAFTS.length +
      ' draft(s), and it has to leave exactly one');
  if (!kept || kept.ln !== LN || kept.mn !== MN)
    out.fails.push('what went into the drafts is not what was typed: ' +
      JSON.stringify(kept));
  if (PW.ln || PW.mn)
    out.fails.push('the post went to the drafts and is STILL in the composer: ' +
      JSON.stringify({ ln: PW.ln, mn: PW.mn }) + ' -- the same post in two places');
  /* Back goes back one page. draftKeep() ends by going to the feed, which is
     what the Save-a-draft button does; the composer here was opened from the
     profile, so the feed would mean the trail was thrown away. */
  if (JSON.stringify(here()) !== '{"r":"profile"}')
    out.fails.push('backing out of the composer landed on ' + JSON.stringify(here()) +
      ' and the composer was opened from the profile -- back goes back one page');

  /* ---- and the composer opened again is empty ---------------------------
     PW being blank is not the whole of it. openForm() keeps the body as a
     STRING, so the composer can be empty in memory and still come back with
     the old text painted on it. */
  openPost();
  const body = (FORM && FORM.html) || '';
  out.said.push('the composer opened again is ' +
    (body.indexOf(LN) < 0 ? 'empty' : 'STILL SHOWING the kept post'));
  if (body.indexOf(LN) >= 0)
    out.fails.push('the composer opened again still shows the post that was ' +
      'put in the drafts -- it must be empty');

  /* ---- no: nothing is kept and nothing is left -------------------------- */
  start();
  openPost();
  write();
  back();                                    /* opens the box */
  asked = BACKQ ? 1 : 0;
  backStay();                                /* キャンセル */
  out.said.push('and answering cancel: asked ' + asked + ', drafts ' + DRAFTS.length +
    ', still on ' + JSON.stringify(here()));
  if (asked !== 1)
    out.fails.push('answering cancel: the box opened ' + asked + ' time(s), and it has to open exactly once');
  if (BACKQ)
    out.fails.push('answering cancel left the box open');
  if (DRAFTS.length !== 0)
    out.fails.push('answering cancel put ' + DRAFTS.length + ' thing(s) in the drafts');
  if (JSON.stringify(here()) !== '{"r":"form","a":"post:"}')
    out.fails.push('answering cancel left the composer anyway -- it is now on ' +
      JSON.stringify(here()));
  if (PW.ln !== LN)
    out.fails.push('answering cancel threw away the line: ' + JSON.stringify(PW.ln));

  /* ---- no: not kept, and not left in the composer either -----------------
     OWNER DECISION 2026-08-25:「いいえは保存せず1画面戻る」. Nothing goes to
     the drafts and the composer is empty, because 「残ってほしくない」 -- a
     post that was not kept is not still sitting there waiting to be written
     on top of. This is the one answer that throws something away, and it is
     thrown away only because somebody said so twice. */
  start();
  openPost();
  write();
  back();                                    /* opens the box */
  asked = BACKQ ? 1 : 0;
  backDrop();                                /* いいえ */
  out.said.push('and answering no: asked ' + asked + ', drafts ' + DRAFTS.length +
    ', composer left ' + (PW.ln ? JSON.stringify(PW.ln) : 'empty') +
    ', landed on ' + JSON.stringify(here()));
  if (asked !== 1)
    out.fails.push('answering no: the box opened ' + asked + ' time(s)');
  if (BACKQ)
    out.fails.push('answering no left the box open');
  if (DRAFTS.length !== 0)
    out.fails.push('answering no put ' + DRAFTS.length + ' thing(s) in the drafts');
  if (PW.ln || PW.mn)
    out.fails.push('answering no left the post in the composer: ' +
      JSON.stringify({ ln: PW.ln, mn: PW.mn }));
  if (JSON.stringify(here()) !== '{"r":"profile"}')
    out.fails.push('answering no landed on ' + JSON.stringify(here()) +
      ' and not one page back');

  /* ---- Done on the photograph editor is back(), and must go through ------
     www/post.js:1222 and 1228. The trail is profile -> composer -> marks, and
     Done pops the marks off it. Nothing is asked, nothing is kept, and the
     draft is still in the composer because you have not left it. A guard put
     in back() with no way through fails this and only this. */
  start();
  openPost();
  write();
  pwPics().push({ u: PIC });
  pwMarkOpen(0);
  const onMarks = JSON.stringify(here());
  back();
  asked = BACKQ ? 1 : 0;                                  /* what .mkr and .mkdone do */
  const afterDone = JSON.stringify(here());
  out.said.push('Done on the photograph editor: asked ' + asked + ', drafts ' +
    DRAFTS.length + ', landed on ' + afterDone);
  if (onMarks.indexOf('marks') < 0)
    out.fails.push('pwMarkOpen() did not open the photograph editor -- it opened ' +
      onMarks + ', so the Done case below proves nothing');
  else {
    if (asked !== 0)
      out.fails.push('Done on the photograph editor asked ' + asked + ' question(s). ' +
        'It is the same back() as the back button, and a guard put in back() ' +
        'without a way through turns finishing a picture into "keep this?"');
    if (DRAFTS.length !== 0)
      out.fails.push('Done on the photograph editor put the post in the drafts');
    if (afterDone !== '{"r":"form","a":"post:"}')
      out.fails.push('Done on the photograph editor did not land back on the ' +
        'composer -- it landed on ' + afterDone);
    if (PW.ln !== LN)
      out.fails.push('Done on the photograph editor emptied the composer: ' +
        JSON.stringify(PW.ln));
  }

  /* ---- an empty composer is not a draft ---------------------------------
     Nothing typed, nothing to keep, nothing to ask about. pwHas() is what
     answers this, and it is the app's own answer rather than a second one. */
  start();
  openPost();
  back();
  asked = BACKQ ? 1 : 0;
  out.said.push('an empty composer backed out of: asked ' + asked + ', drafts ' +
    DRAFTS.length);
  if (asked !== 0)
    out.fails.push('backing out of an EMPTY composer asked ' + asked +
      ' time(s) -- there is nothing to keep');
  if (DRAFTS.length !== 0)
    out.fails.push('backing out of an empty composer made a draft out of nothing');

  /* ---- an edit is not a draft -------------------------------------------
     PW.ed is a post that already exists. The drafts carry no `ed`, so keeping
     one would quietly turn an edit into a second post -- two things that are
     not the same shape sharing one list, which is the rule at the head of
     docs/DATA_SAFETY.md. Backing out of an edit is left as it was. */
  start();
  const mine = POSTS.filter(p => p.mine)[0];
  if (!mine) out.said.push('(no post of my own in the fixture -- the edit case ' +
    'did not run)');
  else {
    postEdit(mine.id);
    const onEdit = JSON.stringify(here());
    back();
    asked = BACKQ ? 1 : 0;
    out.said.push('backing out of an edit: asked ' + asked + ', drafts ' +
      DRAFTS.length);
    if (onEdit !== '{"r":"form","a":"post:"}')
      out.fails.push('postEdit() did not open the composer -- it opened ' + onEdit);
    else {
      if (asked !== 0)
        out.fails.push('backing out of an EDIT opened the box ' + asked + ' time(s)');
      if (DRAFTS.length !== 0)
        out.fails.push('backing out of an edit made a draft, which carries no ' +
          '`ed` -- the edit would come back as a second post');
    }
  }

  /* ---- the other two things viewReset() lists ---------------------------
     A letter's name typed and not saved, and a list being read in. They are
     on the same list as PW and are not the composer, so back() leaves them
     exactly as they were. */
  start();
  ltDraft = 'a letter name typed';
  IMP = impBlank(); IMP.rows = [{ a: 1 }];
  NAV = [{ r: 'letters' }, { r: 'letter', a: 'x' }]; window.route = 'letter';
  back();
  asked = BACKQ ? 1 : 0;
  out.said.push('a letter name typed and a list being read in survive back: ' +
    ((ltDraft === 'a letter name typed' && IMP && IMP.rows && IMP.rows.length === 1)
      ? 'both' : 'NO') + ', asked ' + asked);
  if (asked !== 0)
    out.fails.push('backing off a letter asked ' + asked +
      ' time(s) -- only the composer asks');
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
console.log('a post half written goes to the drafts, and does not stay behind.');
