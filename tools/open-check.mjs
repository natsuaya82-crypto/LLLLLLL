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
      /* THE TWO FACES OF THE DOOR, and what is on each. Apple and Google are
         on BOTH now -- 「作成画面でもアップルもGoogleもおいとけば」OWNER
         2026-09-02 -- because the id_token grant makes the account when the
         identity is new, so 「サインイン」 was creating one without saying so
         and there was no other way in for somebody with only an Apple ID. */
      faces: (function(){
        var out = {}, m;
        for (m = 0; m < 2; m++) {
          try {
            OBM.mode = m ? 'up' : 'in';
            var html = (typeof obFormHTML === 'function') ? obFormHTML(!!m) : '';
            out[m ? 'up' : 'in'] = {
              apple: html.indexOf('obSignInApple') >= 0,
              google: html.indexOf('obSignInGoogle') >= 0,
              /* the ARGUMENT and not the name: obMailGo also carries the
                 「already have one / make one」 toggle at the foot of both
                 faces, so the name alone is true of either. DO() escapes the
                 quotes, so the word is what there is to look for. */
              forgot: html.indexOf('forgot') >= 0,
              /* AND WHETHER IT ASKS FOR A PASSWORD. Only signing in does.
                 「メアドだけ、アカウント作成で」「1アドレス1アカウント」 OWNER
                 2026-09-02 -- a password on the making face is what made that
                 face a SIGNUP, and a signup always makes a new user, so an
                 address that had come in with Google got a second account. */
              pw: html.indexOf('ob-pw') >= 0,
              /* AND THE ONE LINE APPLE ASKS FOR (guideline 1.2). Three
                 separate things, because a sentence with no links and two
                 links with no sentence both look like this feature from a
                 distance and neither is it. The URLs are read off the app's
                 own DOC_TERMS / DOC_PRIVACY rather than written out here --
                 a check that restates the value under test is a copy of it,
                 and a copy always agrees. */
              said: html.indexOf(esc(t('ob.docs'))) >= 0,
              terms: html.indexOf(DOC_TERMS) >= 0,
              privacy: html.indexOf(DOC_PRIVACY) >= 0
            };
          } catch (e) { out[m ? 'up' : 'in'] = { err: String(e && e.message) }; }
        }
        return out;
      })(),
      /* THE WAY BACK OFF EACH FACE OF THE DOOR. Every face except the one
         the door opens on was travelled to from another, and signed out there
         was no chevron on any of them -- obCanBack() answered false for the
         whole door. A person who mistyped their address stood on the
         six-digit screen with no way off it and no way to have the mail sent
         again. 『後追加でメールを確認のボタンに再送信ボタンと戻るボタンが
         ない』 OWNER 2026-09-02. */
      back: (function(){
        var out = {}, ms = ['in', 'up', 'code', 'forgot', 'reset', 'newpw'], i, m, html;
        for (i = 0; i < ms.length; i++) {
          m = ms[i];
          try {
            OBM.mode = m;
            html = (typeof obDoorHTML === 'function') ? obDoorHTML() : '';
            out[m] = { chev: !!obCanBack(), to: obDoorBack(),
                       again: html.indexOf('obMailAgain') >= 0 };
          } catch (e) { out[m] = { err: String(e && e.message) }; }
        }
        return out;
      })(),
      /* And where the chevron actually LANDS, pressed for real through the
         one listener, because obDoorBack() saying 'up' and obBack() going
         there are two statements. */
      landed: (typeof window.__landed === 'undefined') ? null : window.__landed,
      /* what § 2d's drive left behind, carried out in one piece */
      probe: (typeof window.__upTaken === 'undefined') ? null : {
        upTaken: window.__upTaken, upFree: window.__upFree,
        fgNone: window.__fgNone, fgOk: window.__fgOk
      },
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

/* ---- 2b. and both faces of the door carry Apple and Google -------------
   「アップルとかログインで入れちゃうから、アカウント新規作成じゃなくて
   アカウントがないならないですって出ないと」「続けるにすればいいんじゃない？
   同じようにしよう」「作成画面でもアップルもGoogleもおいとけばこれで解決？」
   OWNER 2026-09-02.

   Supabase's id_token grant makes the account when the identity is new, and
   there is no switch that says 「sign in only」. So a button that says
   「サインイン」 and stands on the sign-in face alone was lying twice: it
   created accounts silently, and it was the only road in for somebody who has
   only an Apple ID. Every app answers this the same way -- one button on both
   faces, saying 「続ける」, because which of the two it will be is not known
   until it is pressed. Email is what the faces differ by: a password is the
   one thing that can be WRONG. */
{
  const r = await boot({ 'lingua.set': JSON.stringify({ done: true }) });
  const f = r.faces || {};
  ['in', 'up'].forEach((k) => {
    const face = f[k] || {};
    if (face.err) no('the door face "' + k + '" threw: ' + face.err);
    if (!face.apple) no('the door face "' + k + '" has no Apple button');
    if (!face.google) no('the door face "' + k + '" has no Google button');
  });
  if (f.in && !f.in.forgot) no('the sign-in face lost the forgotten-password way out');
  if (f.up && f.up.forgot)
    no('the account-making face offers a forgotten password — there is nothing yet to have forgotten');
  if (f.up && f.up.pw)
    no('the account-making face asks for a password — that makes it a signup, ' +
       'and a signup makes a SECOND account for an address that came in with Google');
  if (f.in && !f.in.pw)
    no('the sign-in face lost its password field');
  /* AND THE ACCOUNT-MAKING FACE SAYS WHAT SOMEBODY IS AGREEING TO.
     「続けるとの説明は ok」 OWNER 2026-09-02. App Review guideline 1.2 asks an
     app people write in to say it before somebody is in, and the two
     documents were on the plans screen alone -- which somebody who never pays
     never opens. No checkbox: the consent is the press, and the two buttons
     over it already say 「続ける」.

     Three claims and not one, because two of the three ways this breaks leave
     something on the screen that looks like the feature. A sentence whose
     links were dropped is a promise with nothing behind it; two links with no
     sentence is a pair of documents nobody said they were agreeing to; and a
     link built from a hand-typed URL rather than DOC_TERMS is the second copy
     of a contract that www/settings.js is at length about. */
  if (f.up && !f.up.said)
    no('the account-making face does not say what continuing agrees to (App Review 1.2)');
  if (f.up && !f.up.terms) no('the account-making face does not link the terms');
  if (f.up && !f.up.privacy) no('the account-making face does not link the privacy policy');
  /* THE SIGN-IN FACE DOES NOT HAVE IT, and that is the decision rather than
     an oversight: 登録画面だけ. Worth knowing if this ever fails on purpose --
     Apple and Google can make an account from the sign-in face too, because
     the id_token grant makes one when the identity is new. Whether the line
     belongs there as well is the owner's; changing this line is how that
     decision lands, not deleting it. */
  if (f.in && (f.in.said || f.in.terms || f.in.privacy))
    no('the sign-in face carries the agreement line — it was asked for on the ' +
       'account-making face only, and moving it is the owner\'s');
  say('the door: Apple and Google on both faces, and the mail is what they differ by');
  say('the account-making face: what continuing agrees to, said once, with both documents linked');
}

/* ---- 2c. and every face of it has the way back off it -------------------
   『後追加でメールを確認のボタンに再送信ボタンと戻るボタンがない』 OWNER
   2026-09-02. Signed out, appIs() answers 'door' and obCanBack() answered
   false for the whole of it -- the six digits included, which is three
   presses in from the face the door opens on. */
{
  const r = await boot({ 'lingua.set': JSON.stringify({ done: true }) },
                       () => { OBM.mode = 'code'; render();
                               var b = document.querySelector('.obback');
                               if (b) b.click();
                               window.__landed = OBM.mode; });
  const b = r.back || {};
  const BEHIND = { up: 'in', code: 'up', forgot: 'in', reset: 'forgot' };
  /* The face the door OPENS on is the one with nothing behind it: signed out,
     the app IS this screen -- 「他の画面に行かせるな。ログアウトの時は。」 */
  if (b.in && b.in.chev)
    no('signed out, the face the door opens on has a chevron — that is a way ' +
       'into an onboarding somebody finished months ago');
  Object.keys(BEHIND).forEach((k) => {
    const f = b[k] || {};
    if (f.err) return no('the door face "' + k + '" threw: ' + f.err);
    if (!f.chev) no('signed out, the door face "' + k + '" has no way back off it');
    if (f.to !== BEHIND[k])
      no('the door face "' + k + '" says ' + JSON.stringify(f.to) +
         ' is behind it, wanted ' + JSON.stringify(BEHIND[k]));
  });
  /* A mail that did not arrive is the ordinary thing that happens on these
     two, and the only answer used to be killing the app. */
  if (b.code && !b.code.again) no('the six digits of a new account cannot be sent again');
  if (b.reset && !b.reset.again) no('the six digits of a reset cannot be sent again');
  if (b.newpw && b.newpw.again)
    no('the new-password screen offers to send a code again — the code that ' +
       'got there has been spent');
  /* Nothing BEHIND the password: both roads reach it with a session in hand,
     so the screens behind it ask for an address already proved. Signed out
     -- which this boot is -- there is no way off it at all, and that is
     right: without a session there is no app to be let into. The other half,
     signed in, is claim 3b below. */
  if (b.newpw && (b.newpw.chev || b.newpw.to))
    no('the password screen, reached with NO session, has a way back — what ' +
       'is behind it is an address that has already been proved');
  if (r.landed !== 'up')
    no('the chevron on the six digits, pressed for real, landed on ' +
       JSON.stringify(r.landed) + ', wanted "up"');
  say('the door, signed out: every face has the face behind it, the chevron ' +
      'lands on it (' + r.landed + '), and the six digits can be sent again');
}

/* ---- 2d. the door asks whether the address is already an account --------
   「アカウントのあるアドレスで新規作成はいらんやろ。このアカウントは登録されて
   いますの赤文字で。アカウントを作るページなんだけど？」 OWNER 2026-09-03, and
   the other half the same minute: a reset asked for an address with no account
   walked on to a screen waiting for six digits nobody was going to send.

   Neither Supabase endpoint will say which it is -- both answer 200 either way
   -- so the answer comes from supabase/schema.sql § email_taken(). What is
   held here is that the two screens ASK before they send, and that each stops
   on the answer that is wrong for it. The wire is stubbed at netMailTaken(),
   which is the one place the question is asked. */
{
  const r = await boot({ 'lingua.set': JSON.stringify({ done: true }) },
    async () => {
      window.__asked = [];
      window.__sent = [];
      netMailTaken = function(em, ok){ window.__asked.push(em); ok(window.__taken); };
      netMailOtp = function(em, ok){ window.__sent.push('otp:' + em); ok({}); };
      netRecover = function(em, ok){ window.__sent.push('recover:' + em); ok({}); };
      OBM.em = 'a@b.c';
      /* making an account with an address that has one: refused, and nothing
         is sent */
      window.__taken = true;
      OBM.mode = 'up'; OBM.busy = false; OBM.msg = '';
      obMailUp();
      window.__upTaken = { msg: OBM.msg, mode: OBM.mode, sent: window.__sent.length };
      /* and with one that does not: it goes */
      window.__taken = false;
      OBM.busy = false; OBM.msg = '';
      obMailUp();
      window.__upFree = { mode: OBM.mode, sent: window.__sent.join(',') };
      /* a reset for an address with no account: refused */
      window.__sent = [];
      window.__taken = false;
      OBM.mode = 'forgot'; OBM.busy = false; OBM.msg = '';
      obMailForgot();
      window.__fgNone = { msg: OBM.msg, mode: OBM.mode, sent: window.__sent.length };
      /* and for one that has: it goes */
      window.__taken = true;
      OBM.busy = false; OBM.msg = '';
      obMailForgot();
      window.__fgOk = { mode: OBM.mode, sent: window.__sent.join(',') };
    });
  const g = await (async () => r)();
  const st = await (async () => null)();
  const q = r.probe || {};
  if (!q.upTaken) no('2d: the probe did not run');
  else {
    if (!q.upTaken.msg) no('2d: making an account with a taken address says nothing');
    if (q.upTaken.mode !== 'up') no('2d: a taken address still walked on to the digits');
    if (q.upTaken.sent !== 0) no('2d: a taken address still had a code sent to it');
    if (q.upFree.mode !== 'code') no('2d: a free address did not reach the digits');
    if (q.upFree.sent.indexOf('otp:') < 0) no('2d: a free address had no code sent');
    if (!q.fgNone.msg) no('2d: a reset for an unknown address says nothing');
    if (q.fgNone.mode !== 'forgot') no('2d: a reset for an unknown address walked on');
    if (q.fgNone.sent !== 0) no('2d: a reset for an unknown address still sent one');
    if (q.fgOk.mode !== 'reset') no('2d: a reset for a real address did not reach the digits');
    say('the door asks first: a taken address cannot make a second account, and ' +
        'a reset is not offered for an address that has none');
  }
}

/* ---- 3b. and signed in, the password screen lets you into the app -------
   「サインインしたらアプリに移動してください」 OWNER 2026-09-02. The six
   digits were spent to get a session, so somebody standing on the password
   screen is already signed in. One field and one button that goes nowhere is
   a person locked OUT of an app they are inside -- which is what netSetPass()
   failing leaves behind. */
{
  const r = await boot({ 'lingua.set': JSON.stringify({ done: true }), 'lingua.sess': SESS },
                       /* ob.step === OB_IN is the walk's last step, which is
                          what obAtDoor() answers to with a session in hand and
                          no obback: signed in and done, appIs() is the app. */
                       () => { SET.done = false; SET.obback = null; ob.step = OB_IN;
                               OBM.mode = 'newpw'; OBM.fresh = true; render(); });
  const f = (r.back || {}).newpw || {};
  if (!f.chev)
    no('signed in, the password screen has no way off it — netSetPass() ' +
       'failing leaves somebody locked out of an app they are already inside');
  say('the password screen, signed in: there is a way into the app (' + f.chev + ')');
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
