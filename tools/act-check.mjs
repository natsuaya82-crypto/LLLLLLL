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
import { seed, obStates, halfDone } from './fixture.mjs';
import { chromium, LAUNCH } from './browser.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', 'www');
const PORT = 8122;

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
                seen: { do: [], in: [], kd: [] }, threw: [], routes: [], doors: [], pages: 0, placed: 0, views: 0 };
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
  ['free','pro'].forEach(plan => {
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
  /* The door is not one of them any more -- it is shown for SET.obback, not
     for a step number -- so the note has to be off for a step to be seen at
     all, and the door's own faces come out of obStates() below. */
  SET.obback = null;
  for (let s = 0; s < OB_STEPS; s++) {
    ob.step = s;
    try { harvest('vOb step ' + s, vOb()); } catch (e) { out.threw.push('vOb ' + s + ': ' + e.message); }
  }
  const obStates = window.__obStates();
  obStates.forEach(([label, run]) => {
    try { harvest(label, run()); } catch (e) { out.threw.push(label + ': ' + e.message); }
  });
  ob.mode = 'draw';
  SET.obback = null;
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
  ['free','pro'].forEach(pl => {
    SET.plan = pl;
    walkArg('set', vSet, SETS.map(x => x.id), 'vSet ' + pl);
  });
  /* Both plans here too, for the same reason the settings rooms need both:
     a grammar stage is not one screen any more. The calendar's two stages
     carry a stepper -- how many months, how many days in a week -- and it is
     paid, exactly as the base's is, so a free-only walk renders the stage
     without it and calls the two buttons dead.
     The stage LIST is asked for on the paid plan, because stAll() is where a
     stage of somebody's own comes from and a walk that could not see one
     would be walking a shorter app than exists. */
  ['free','pro'].forEach(pl => {
    SET.plan = pl;
    walkArg('gram', vGram, stAll().map(p => p.id), 'vGram ' + pl);
  });
  SET.plan = 'free';
  /* The keyboard chapter is a list and each keyboard is a page. Board 0 is
     the free QWERTY and has no editor; the others have one, and the two are
     different screens. */
  SET.plan = 'pro';
  KB = { kbs: [{ nm: '', pat: 'qwerty', lay: kbFixed().lay }], at: 0, v: 2 };
  walkArg('kb', vKb, ['0', '1'], 'vKb');
  KB = null; kbShow = 0; SET.plan = 'free';
  /* The letters chapter is three lists now and they share no buttons:
     only the digits page carries the base, only the alphabet counts the
     ones with no reading. */
  walkArg('ltset', vLtset, LT_KINDS, 'vLtset');
  /* What a word is of the word it came from, chosen on a screen. It is about
     a word, so it is walked on one -- with no word it is the gone box. */
  walkArg('fm', vFm, ['tira'], 'vFm');
  /* One section of the language's article, open. Asked of the fixture rather
     than written out, so a section somebody seeds tomorrow is walked
     tomorrow. With no id it is the gone box -- and the gone box carries
     neither of the two fields, which are the only place in the app that
     ever names wldArtSet. */
  walkArg('wldart', vWldArt, wldArts().map(x => x.id), 'vWldArt');
  /* A conversation, one per post there is. The thread of a post nobody has
     answered is still a screen -- it is what every post's thread is on the
     day it is written -- and the answered one is in halfDone above. */
  walkArg('thread', vThread, postAll().map(p => p.id), 'vThread');
  /* One photograph of one post. Only a post that HAS one is a screen;
     asked of the fixture rather than written out, so a picture added
     to it tomorrow is walked tomorrow. */
  walkArg('photo', vPhoto, postAll().filter(x => postPics(x).length).map(x => x.id + ':0'), 'vPhoto');

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
  /* A form's bar is part of the form. openForm()'s fifth argument is what
     navTop() draws in the corner, so a button that lives there -- the
     composer's Post, the word page's Edit -- is named by that screen and by
     nothing else, and harvesting FORM.html alone reported it as an entry no
     screen names. */
  forms.forEach(([label, run]) => {
    try {
      run();
      if (FORM && FORM.html) harvest(label, FORM.html + (FORM.right || ''));
    } catch (e) { out.threw.push(label + ': ' + e.message); }
  });
  try { closeSheet(); } catch (e) {}
  /* anything else that opens, in case one is added and forgotten above */
  opens.forEach(o => {
    if (forms.some(f => f[0].split(' ')[0] === o)) return;
    try {
      window[o].length ? window[o]('kano') : window[o]();
      if (FORM && FORM.html) harvest(o, FORM.html + (FORM.right || ''));
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

  /* ---- 6. signed out, every route is the door --------------------------
     OWNER DECISION 2026-08-26: 「ログアウトしたら普通にログイン画面だけ出せば
     いいやろ。それ以外は表示させるな。ログインしてないのに謎に課金できるし
     バカやろ。他の画面に行かせるな。ログアウトの時は。」

     Check 5 above asks what a route SHOWS. This asks what it shows to
     somebody with no account, and it is a different question with a different
     failure: nothing throws, every screen is correct, and the plans screen
     takes money from somebody who is not signed in.

     It drives the real render() rather than calling a view, because the
     decision is render()'s -- appIs() in www/shell.js -- and a check that
     called vPlans() directly would be asking the screen a question the screen
     does not answer. Every route in PAGES is asked, so a screen added next
     month is asked the day it is added; a list of screens to guard is what
     this replaced.

     The bar at the foot is the second half and not a detail: it is painted
     outside every view, so no view's HTML could ever carry it, and 「それ以外
     は表示させるな」 is about the bar too. */
  {
    const wasS = SESS, wasR = window.route, wasN = NAV, wasDone = SET.done,
          wasBack = SET.obback, wasStep = ob.step;
    const app = document.getElementById('app'), tabs = document.getElementById('tabs');
    SESS = null;
    /* Finished, and standing wherever the tour left ob.step -- which is the
       state a person who signs out is actually in, and the one that used to
       show them the app. */
    SET.done = true; SET.obback = null; ob.step = OB_NAME;
    Object.keys(PAGES).forEach(r => {
      window.route = r; NAV = [{ r: r }];
      try { render(); } catch (e) { out.doors.push(r + ' threw: ' + e.message); return; }
      const html = app.innerHTML;
      /* The door is the only thing vOb() draws with a `.ob` on it, and the
         crest is on every face of it. Asked of the PAGE, so a door rebuilt
         out of different markup still answers. */
      if (!/class="ob view/.test(html)) out.doors.push(r + ': not the door');
      else if (!/obcrest/.test(html))   out.doors.push(r + ': the door without its own face');
      if (tabs && tabs.innerHTML.trim()) out.doors.push(r + ': the bar at the foot is up');
      /* And no way off it. The chevron is the onboarding's one way back and
         there is nothing behind a door nobody was sent to. */
      if (/class="obback"/.test(html)) out.doors.push(r + ': a way back into the app');
    });
    /* And that a refusal SAYS so, on the door, in the colour a refusal is.
       ⑱ on the owner's phone: 「メアド／パスワードが違う時、赤文字で出ない」.
       This is not an explanation and the rule says so -- an error is a state,
       and a screen with no cause and no way out is the thing forbidden.

       It is the wire that is stubbed and not netWhy(), because netWhy() being
       right is not the claim: the claim is that a refusal travelling the whole
       way -- XHR, netSend, netSignIn's bad half, obNo, render -- comes out as
       words somebody can read. Every shape GoTrue has shipped its refusal in
       is put through it, plus no connection at all, because a message that
       only survives one of them is a message that stops the day Supabase
       changes a key. */
    const RealXHR = window.XMLHttpRequest;
    const REFUSALS = [
      [400, { code:400, error_code:'invalid_credentials', msg:'Invalid login credentials' }],
      [400, { error:'invalid_grant', error_description:'Invalid login credentials' }],
      [400, { message:'Invalid login credentials' }],
      [401, { msg:'Unauthorized' }],
      [0,   null],
    ];
    SESS = null; SET.done = true; SET.obback = null; ob.step = OB_IN;
    window.route = 'profile'; NAV = [{ r:'profile' }];
    REFUSALS.forEach(([code, body]) => {
      window.XMLHttpRequest = function(){
        this.readyState = 0; this.status = 0; this.responseText = '';
        this.open = function(){}; this.setRequestHeader = function(){};
        const self = this;
        this.send = function(){
          self.readyState = 4; self.status = code;
          self.responseText = body ? JSON.stringify(body) : '';
          if (code === 0) { if (self.onerror) self.onerror(); }
          else if (self.onreadystatechange) self.onreadystatechange();
        };
      };
      OBM.mode = 'in'; OBM.em = 'a@b.c'; OBM.pw = 'wrong'; OBM.msg = ''; OBM.busy = false;
      render();
      try { obMailIn(); } catch (e) { out.doors.push(code + ': threw: ' + e.message); }
      const m = app.querySelector('.obmsg');
      const where = 'a refusal (' + code + ')';
      if (!m) { out.doors.push(where + ': says nothing'); return; }
      if (!m.textContent.trim()) out.doors.push(where + ': an empty line where the reason goes');
      /* The colour a refusal is, read off the page rather than named here --
         every colour lives in the two theme blocks at the top of index.html. */
      const bad = getComputedStyle(document.documentElement).getPropertyValue('--bad').trim();
      const want = (function(){ const d=document.createElement('span');
        d.style.color = bad; document.body.appendChild(d);
        const c = getComputedStyle(d).color; d.remove(); return c; })();
      if (getComputedStyle(m).color !== want)
        out.doors.push(where + ': not the colour a refusal is');
      /* and where somebody can see it: on the door, above the fold */
      const r = m.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight)
        out.doors.push(where + ': off the screen at ' + Math.round(r.top));
    });

    /* ---- and the reset is two steps, with the server deciding the first ---
       「6桁の数字打って正しかったらパスワード入力するようにして」 OWNER
       2026-08-26. Three things have to hold and none of them throws when it
       does not: a wrong code must NOT open the password screen; a right one
       must; and the password screen must not carry the code field with it,
       because a code already spent is a field that can only be got wrong.

       The wire is stubbed rather than the two functions, for the reason the
       refusals above are: what is under test is the whole road, and a check
       that called netRecoverCode() itself would be asking a different
       question than the button asks. */
    const wire = (code, body) => {
      window.XMLHttpRequest = function(){
        this.readyState = 0; this.status = 0; this.responseText = '';
        this.open = function(){}; this.setRequestHeader = function(){};
        const self = this;
        this.send = function(){
          self.readyState = 4; self.status = code;
          self.responseText = body ? JSON.stringify(body) : '';
          if (self.onreadystatechange) self.onreadystatechange();
        };
      };
    };
    const seen = () => ({ mode: OBM.mode,
      code: !!app.querySelector('#ob-code'), pw: !!app.querySelector('#ob-pw') });

    /* Standing where obDoor() puts somebody: it is the one way to this
       screen and it takes SET.done away, which is what keeps the app on the
       door. Without that, the moment the server accepts the code the session
       arrives, appIs() answers 'app', and render() draws a route instead --
       which is what the first run of this check actually did, and it said so
       by failing rather than by passing. */
    SESS = null; SET.done = false; SET.obback = { r:'set', a:'acct' };
    OBM.mode = 'reset'; OBM.em = 'a@b.c'; OBM.code = '000000'; OBM.pw = ''; OBM.msg = '';
    OBM.busy = false; render();
    const step1 = seen();
    if (!step1.code) out.doors.push('the reset does not start on the six digits');
    if (step1.pw)    out.doors.push('the six digits arrive with a password field beside them');

    /* a code the server refuses */
    wire(400, { msg: 'Token has expired or is invalid' });
    try { obResetGo(); } catch (e) { out.doors.push('a refused code threw: ' + e.message); }
    if (OBM.mode !== 'reset')
      out.doors.push('a code the server REFUSED opened the password screen (' + OBM.mode + ')');
    if (!OBM.msg) out.doors.push('a refused code said nothing');

    /* and one it accepts: what comes back is a session, and that is what the
       second screen spends */
    OBM.code = '123456'; OBM.msg = ''; OBM.busy = false;
    wire(200, { access_token: 'h.e.s', refresh_token: 'r', user: { id: 'u' } });
    try { obResetGo(); } catch (e) { out.doors.push('an accepted code threw: ' + e.message); }
    render();
    const step2 = seen();
    if (step2.mode !== 'newpw')
      out.doors.push('a code the server ACCEPTED did not open the password screen (' + step2.mode + ')');
    if (step2.code) out.doors.push('the password screen still carries the spent code field');
    if (!step2.pw)  out.doors.push('the password screen has no password field');

    /* and setting it needs one */
    OBM.pw = ''; OBM.msg = ''; OBM.busy = false;
    let sent = 0;
    window.XMLHttpRequest = function(){
      this.readyState = 0; this.status = 0; this.responseText = '';
      this.open = function(){ sent++; }; this.setRequestHeader = function(){};
      const self = this;
      this.send = function(){ self.readyState = 4; self.status = 200;
        self.responseText = '{}'; if (self.onreadystatechange) self.onreadystatechange(); };
    };
    try { obNewPwGo(); } catch (e) { out.doors.push('an empty password threw: ' + e.message); }
    if (sent) out.doors.push('an empty new password was sent to the server anyway');
    if (!OBM.msg) out.doors.push('an empty new password said nothing');

    window.XMLHttpRequest = RealXHR;
    SESS = null; SET.done = true; SET.obback = null;
    OBM.mode = 'in'; OBM.em = ''; OBM.pw = ''; OBM.code = ''; OBM.msg = ''; OBM.busy = false;

    SESS = wasS; window.route = wasR; NAV = wasN; SET.done = wasDone;
    SET.obback = wasBack; ob.step = wasStep;
    try { render(); } catch (e) { out.doors.push('and back again threw: ' + e.message); }
  }

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

/* A name registered twice.
   ------------------------------------------------------------------
   `act('x', x)` twice is harmless the moment it runs -- the second call
   writes the same function over the first -- so nothing throws, nothing is
   unreached, and both directions above stay green. That is exactly why it
   needs saying: four names were registered twice and no check in the gate
   had an opinion, because every statement the gate made about act-map.js
   was about names it does NOT have rather than names it has twice.

   It matters because act-map.js is the one place a screen's vocabulary is
   written down, and a name appearing twice means two people believed they
   were adding it. The next one to look will read the first entry, change
   it, and be overwritten by an entry they never saw. Read off the source
   rather than the page: at run time the duplicate is already gone. */
const mapSrc = fs.readFileSync(path.join(ROOT, 'act-map.js'), 'utf8')
  /* comments out first: the file opens by SHOWING the shape in prose --
     `act('openWord', openWord);` indented inside a block comment -- and
     reading that as a registration reports the file's own documentation as a
     duplicate of the line it documents. Found by looking at what the first
     version printed rather than by trusting it. */
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');
const regSeen = {}, regTwice = [];
{
  const re = /^\s*(act|actIn|actCh|actKey|actAfter)\s*\(\s*(['"])([^'"]+)\2/gm;
  let m;
  while ((m = re.exec(mapSrc))) {
    const key = m[1] + " '" + m[3] + "'";
    if (regSeen[key]) regTwice.push(key + ' -- registered twice');
    regSeen[key] = 1;
  }
}

const fails = [];
const say = (label, list) => { if (list.length) fails.push([label, list]); };
say('a name registered twice in act-map.js', regTwice);
say('a name with nothing behind it', R.missing);
say('an entry no screen ever names', R.dead);
say('an argument that is not the JSON it was written as', R.bad);
say('JavaScript still inside markup', R.inline);
say('a screen that threw while being walked', R.threw);
say('a page with no view, or a view on no page', R.routes);
say('a screen shown to somebody with no account', R.doors);
say('a screen with no way in', stranded.map((r) =>
  r + ': in PAGES, has a view, and nothing anywhere goes to it'));
if (pageErrors.length) fails.push(['the page itself', pageErrors]);

console.log(`screens walked: ${R.screens}`);
console.log(`routes reached: ${R.pageNames.length - stranded.length}/${R.pageNames.length}`);
console.log(`pages: ${R.pages}  views placed ${R.placed}/${R.views}  (vOb is what the app is, not a place in it)`);
console.log(`names: pressed ${R.seen.do}/${R.have.do}  typed ${R.seen.in}/${R.have.in}  Enter ${R.seen.kd}/${R.have.kd}`);
console.log(`signed out: ${R.pages} routes asked, every one of them the door, no bar, no way off,\n            and a refusal says so on it in five shapes and with no connection at all`);

if (fails.length) {
  console.log('');
  for (const [label, list] of fails) {
    console.log(`FAILED — ${label} (${list.length}):`);
    list.slice(0, 40).forEach(x => console.log('  ' + x));
    if (list.length > 40) console.log(`  ... and ${list.length - 40} more`);
  }
  process.exit(1);
}
console.log('\nall seven checks pass: every name resolves, everything that resolves is named,\nno name is written down twice, and signed out there is one screen and no way past it.');
