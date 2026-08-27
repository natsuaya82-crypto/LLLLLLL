/* ---------------------------------------------------------------------------
   tools/post-check.mjs — what a post carries when it leaves the composer.

   Run it:   node tools/post-check.mjs

   Posting is the one moment in this app where the making side becomes
   past-tense data. Everything on the other side of it -- the timeline, the
   card, somebody else's phone -- has already been made to read from the post
   and nothing else (tools/sides-check.mjs, tools/card-check.mjs). What none of
   them can see is whether the right things were put ON the post in the first
   place, because a post that is missing something looks perfectly correct for
   as long as the only person reading it is the person who wrote it.

   So this drives the real pwSend():

     1  a photograph, with letters placed on it, and the letters are IN the
        file that goes out -- not a list of positions a reader would have to
        compose with an alphabet they do not have
     2  the picture that goes out is not the picture that came in
     3  the marks do not travel. There is a picture on the post and nothing
        else about them
     4  which way the line runs is frozen on, from the LANGUAGE, at the moment
        of writing
     5  the composer is empty afterwards, marks and all, so the next post does
        not inherit the last one's letters
     6  a recording goes out as a FILE and comes back as a NAME. None of its
        bytes are on the post -- 240 KB of audio in the localStorage the whole
        language lives in is how somebody loses a language to a microphone
     7  deleting that post deletes that ONE file, the one it named, and no
        other. 「投稿消した声も消していいよ」 -- and the DELETE REVIEW that
        allows it says one file, named by the post, nothing walked and
        nothing tidied
     8  a reply that is deleted stops being counted on the post it answered.
        The count is added in one place and taken away in one place
     9  a post does not have to have a line. A photograph on its own is a
        post and so is a voice; nothing at all still is not
    10  a reply carries the HANDLE of whoever it answers, not only the id.
        The id finds the post on a phone that has it; the handle is what a
        reader is shown, and a reply can outlive the thing it answers

   Claim 1 is checked by reading the pixels of the file that came out, because
   "the string is different" would also be true of a bake that drew nothing.

   Exit code is 0 only when all ten hold.
   --------------------------------------------------------------------------- */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seed } from './fixture.mjs';
import { chromium, LAUNCH } from './browser.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', 'www');
const PORT = 8129;

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
const pg = await br.newPage({ viewport: { width: 390, height: 844 } });
await pg.goto(`http://localhost:${PORT}/`);
await pg.waitForSelector('#splash', { state: 'detached', timeout: 10000 });
await pg.evaluate((s) => { eval('(' + s + ')()'); SET.done = true; SET.ui = 'en'; },
                  seed.toString());

const R = await pg.evaluate(async () => {
  const fails = [];

  /* A photograph that is black everywhere, so a white letter drawn into it is
     the only light thing there can be. A gradient would leave the answer to
     "is that ink or is that the sky". */
  const blackPic = (() => {
    const c = document.createElement('canvas');
    c.width = 400; c.height = 400;
    const x = c.getContext('2d');
    x.fillStyle = '#000'; x.fillRect(0, 0, 400, 400);
    return c.toDataURL('image/jpeg', 0.9);
  })();
  /* How much of a picture is light, as a share of its pixels.

     Not one pixel in the middle: inkStrokes() draws the OUTLINE a pen leaves,
     not a filled shape, so the middle of a triangle is background and a check
     that sampled it would fail on a bake that worked. What is being asked is
     "is there ink in this file at all", and on a photograph that is black
     everywhere the answer is a count. */
  const lightShare = (url) => new Promise((done) => {
    const im = new Image();
    im.onload = () => {
      const c = document.createElement('canvas');
      c.width = im.width; c.height = im.height;
      const x = c.getContext('2d');
      x.drawImage(im, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height).data;
      let n = 0;
      for (let i = 0; i < d.length; i += 4)
        if ((d[i] + d[i + 1] + d[i + 2]) / 3 > 150) n++;
      done(n / (c.width * c.height));
    };
    im.onerror = () => done(-1);
    im.src = url;
  });

  /* The letter to place: the first one in this alphabet with a shape on it. */
  const drawn = LETTERS.filter(l => l.st && l.st.length)[0];
  if (!drawn) fails.push('the fixture alphabet has no drawn letter, so nothing below ' +
                         'this is a test of anything');

  /* ---- a post, written the way a person writes one ------------------ */
  const before = POSTS.length;
  SCRIPT.dir = 'rtl'; SET.plan = 'pro';        /* choosing one is Plus */
  PW = pwBlank();
  PW.ln = 'kano tir';
  PW.mn = 'the mountain is seen';
  PW.pics = [{ u: blackPic,
               marks: [{ tx: 'kano', x: 0.5, y: 0.5, s: 0.5, c: PW_COLS[0] }] }];
  pwSend();
  /* pwSend bakes, and a bake is an image loading. */
  await new Promise(r => setTimeout(r, 300));
  SET.plan = 'free'; SCRIPT.dir = '';

  const p = POSTS[POSTS.length - 1];
  if (POSTS.length !== before + 1 || !p || p.ln !== 'kano tir') {
    fails.push('pwSend() did not put a post on the timeline at all');
    return { fails };
  }

  /* ---- 1. the letters are IN the picture ---------------------------- */
  /* The photograph first, so a bake that drew nothing cannot pass by the
     picture having been light all along. */
  const wasLight = await lightShare(blackPic);
  /* Through postPics(), which is the one place that answers what pictures a
     post has -- `pics` now, `pic` on everything written before. */
  const out = postPics(p);
  if (out.length !== 1)
    fails.push('the post carries ' + out.length + ' pictures and one was sent');
  const nowLight = await lightShare(out[0] || '');
  if (wasLight > 0.002)
    fails.push('the photograph this test puts in is not black (' +
               (wasLight * 100).toFixed(1) + '% light), so nothing below it ' +
               'proves anything');
  if (nowLight < 0) fails.push("the post's picture will not load");
  else if (nowLight < 0.005)
    fails.push('the posted picture is ' + (nowLight * 100).toFixed(2) + '% light ' +
               'and the photograph was ' + (wasLight * 100).toFixed(2) + '%, so ' +
               'the white letter placed in the middle of it was never drawn in. ' +
               'A reader has no alphabet to compose one with -- if it is not in ' +
               'the file it does not exist');

  /* ---- 2. and it is not the picture that went in -------------------- */
  if (out[0] === blackPic)
    fails.push('the posted picture is byte-for-byte the one that was chosen, ' +
               'so pwBake() did not run');

  /* ---- 3. the marks themselves do not travel ------------------------ */
  if (p.marks !== undefined || (p.pics && p.pics.some((x) => typeof x !== 'string')))
    fails.push('the post carries `marks`. Letters on a picture are baked in, ' +
               'so nothing about where they sat is a reader\'s business -- and ' +
               'a position without the shape beside it is unusable to somebody ' +
               'who does not have this alphabet');

  /* ---- 4. which way it runs is frozen on ---------------------------- */
  if (p.dir !== 'rtl')
    fails.push('the post says dir=' + JSON.stringify(p.dir) + ' and the language ' +
               'said rtl when it was written. A direction that is not on the post ' +
               'is a direction the reader takes from THEIR language');

  /* ---- 5. and the composer is empty ---------------------------------- */
  if (PW.ln || (PW.pics && PW.pics.length))
    fails.push('the composer still holds the post that was just sent, so the ' +
               'next one starts with the last one\'s letters on it');

  /* ---- 6. the voice: the file goes out, its NAME comes back ---------- */
  /* There is no native side on a runner, so one is stood up here and asked
     what it was told to do. That is the whole of what can be held from this
     side of the bridge -- and it is the half that decides.

     A recording is not made either: getUserMedia is never going to answer on
     a Linux box. What is driven is everything downstream of it, which is
     where the design lives. */
  const said = [];
  const files = {};
  window.Capacitor = { nativePromise: (plug, method, arg) => {
    said.push({ m: method, a: arg });
    if (method === 'keepVoice') {
      if (files[arg.name]) return Promise.reject(new Error('already here'));
      files[arg.name] = arg.b64;
      return Promise.resolve({});
    }
    if (method === 'dropVoice') { delete files[arg.name]; return Promise.resolve({}); }
    if (method === 'voice') {
      return files[arg.name] ? Promise.resolve({ b64: files[arg.name] })
                             : Promise.reject(new Error('no voice'));
    }
    return Promise.resolve({});
  } };

  PW = pwBlank();
  PW.ln = 'kano';
  PW.vo = { b64: 'AAECAwQF', mime: 'audio/mp4', ms: 7200 };
  pwSend();
  await new Promise(r => setTimeout(r, 300));
  const v = POSTS[POSTS.length - 1];

  const kept = said.filter(x => x.m === 'keepVoice');
  if (kept.length !== 1)
    fails.push('sending a post with a recording on it asked the phone to keep a ' +
               'voice ' + kept.length + ' times, and once is what it should be');
  if (kept[0] && kept[0].a.b64 !== 'AAECAwQF')
    fails.push('the bytes that went to the file are not the bytes that were ' +
               'recorded');
  if (!v || !v.vo || !v.vo.f)
    fails.push('the post carries no voice at all, so the recording went to a ' +
               'file and nothing points at it');
  else {
    if (kept[0] && v.vo.f !== kept[0].a.name)
      fails.push('the post names ' + JSON.stringify(v.vo.f) + ' and the file that ' +
                 'was written is ' + JSON.stringify(kept[0].a.name) + '. A name ' +
                 'pointing at nothing is a post claiming a voice it does not have');
    if (v.vo.ms !== 7200)
      fails.push('the post says the recording is ' + v.vo.ms + 'ms and it is 7200');
    if (v.vo.b64 !== undefined || String(JSON.stringify(v)).indexOf('AAECAwQF') >= 0)
      fails.push('the BYTES of the recording are on the post, which is 240 KB of ' +
                 'audio in the localStorage the whole language lives in. The post ' +
                 'carries a name; the bytes are a file');
  }

  /* ---- 7. deleting the post deletes that one file ------------------- */
  /* 「投稿消した声も消していいよ」 -- and the DELETE REVIEW in
     docs/CHANGELOG.md says exactly one file, named by the post being
     deleted, and nothing else touched. Both halves are asked. */
  const other = POSTS.filter(x => x.vo && x !== v).map(x => x.vo.f);
  const wasConfirm = window.confirm;
  window.confirm = () => true;
  said.length = 0;
  postDel(v ? v.id : '');
  window.confirm = wasConfirm;

  const dropped = said.filter(x => x.m === 'dropVoice').map(x => x.a.name);
  if (v && v.vo) {
    if (dropped.length !== 1 || dropped[0] !== v.vo.f)
      fails.push('deleting a post asked the phone to drop ' +
                 JSON.stringify(dropped) + ' and the post named ' +
                 JSON.stringify(v.vo.f) + '. One file, the one this post named');
    if (files[v.vo.f] !== undefined)
      fails.push("the voice file of a deleted post is still on the disk");
  }
  for (const f of other)
    if (dropped.indexOf(f) >= 0)
      fails.push('deleting one post dropped ' + JSON.stringify(f) + ' as well, ' +
                 'which belongs to a post nobody deleted. That is a cleanup, and ' +
                 'a cleanup is what docs/DATA_SAFETY.md forbids');
  if (POSTS.some(x => v && x.id === v.id))
    fails.push('the post itself is still on the timeline after postDel()');

  /* And a post with no voice must not ask for a file to be dropped at all --
     a name of '' or undefined reaching the phone is a delete with no target. */
  const plain = POSTS.filter(x => !x.vo)[0];
  said.length = 0;
  if (plain) {
    window.confirm = () => true;
    postDel(plain.id);
    window.confirm = wasConfirm;
    if (said.some(x => x.m === 'dropVoice'))
      fails.push('deleting a post that never had a voice still asked the phone ' +
                 'to drop one');
  }

  /* ---- 8. a reply that is deleted stops being counted ---------------- */
  /* 「リプライ消したのに数字1のまま」 -- pwSendWith() adds one to the post
     being answered and nothing ever took it back, so a post whose only reply
     was deleted said 1 forever, pointing at nothing. */
  const host = POSTS.filter(x => !x.to)[0];
  const wasRe = (host && host.re) || 0;
  PW = pwBlank(); PW.to = host.id; PW.ln = 'sar';
  pwSend();
  await new Promise(r => setTimeout(r, 200));
  if (((host.re) || 0) !== wasRe + 1)
    fails.push('a reply did not count on the post it answered, so nothing ' +
               'below this is a test of taking it back');
  const reply = POSTS.filter(x => x.to === host.id).pop();
  const wasConfirm2 = window.confirm;
  window.confirm = () => true;
  postDel(reply ? reply.id : '');
  window.confirm = wasConfirm2;
  if (((host.re) || 0) !== wasRe)
    fails.push('the post says ' + host.re + ' replies and its reply was ' +
               'deleted. A count of something that is gone points at nothing, ' +
               'and there is no way to press it and find out');
  /* And it must not go under: a count that was already wrong is not put right
     by being made negative. */
  window.confirm = () => true;
  host.re = 0;
  PW = pwBlank(); PW.to = host.id; PW.ln = 'mos';
  pwSend();
  await new Promise(r => setTimeout(r, 200));
  const r2 = POSTS.filter(x => x.to === host.id).pop();
  host.re = 0;
  postDel(r2 ? r2.id : '');
  window.confirm = wasConfirm2;
  if (((host.re) || 0) < 0)
    fails.push('deleting a reply took a count below zero');

  /* ---- 9. a post does not have to have a line ----------------------- */
  /* 「文字無しでもポストできるようにできない？」 A photograph with somebody's
     own letters drawn onto it is most of what this app is for, and it could
     not be posted on its own. Empty is still empty. */
  const wasN = POSTS.length;
  PW = pwBlank();
  PW.pics = [{ u: blackPic, marks: [] }];
  pwSend();
  await new Promise(r => setTimeout(r, 300));
  if (POSTS.length !== wasN + 1)
    fails.push('a photograph with no line was refused, and a picture with '
             + 'somebody\'s own letters on it is most of what a post is for');
  else {
    const only = POSTS[POSTS.length - 1];
    if (only.ln !== '') fails.push('a post sent with no line carries ' +
      JSON.stringify(only.ln));
    if (postRow(only).indexOf('class="pline') >= 0)
      fails.push('a post with no line still draws the row its line goes in, ' +
                 'which is a gap above the picture that nothing explains');
  }

  const wasN2 = POSTS.length;
  PW = pwBlank();
  PW.vo = { b64: 'AAECAwQF', mime: 'audio/mp4', ms: 3000 };
  pwSend();
  await new Promise(r => setTimeout(r, 300));
  if (POSTS.length !== wasN2 + 1)
    fails.push('a voice with no line was refused, and thirty seconds of a '
             + 'language being spoken is a post');

  /* ---- 10. a reply carries who it answers ---------------------------- */
  /* Rule 13: what a post carries is put on it when it is written. A reply had
     `to` and nothing else -- an id, which is a way to FIND the post on a
     phone that has it and says nothing at all to a reader who does not. The
     handle goes on at the moment of writing, the same as the author's name,
     the language's name and the shapes of the letters, and for the same
     reason: the making side is where it is known and the reading side is
     where it is needed. */
  const par = POSTS.filter(x => !x.to)[0];
  par.hd = 'iri';
  PW = pwBlank(); PW.to = par.id; PW.ln = 'tir';
  pwSend();
  await new Promise(r => setTimeout(r, 200));
  const rep = POSTS.filter(x => x.to === par.id).pop();
  if (!rep) fails.push('a reply was not written at all, so nothing below this ' +
                       'is a test of what one carries');
  else {
    if (rep.toh !== 'iri')
      fails.push('a reply carries ' + JSON.stringify(rep.toh) + ' as the handle ' +
                 'it answers, and the post it answers is @iri. An id on its own ' +
                 'is unreadable to anybody who does not have that post');
    /* And it is READ off the reply, not off the post it answers -- which is
       the whole difference. Deleting the parent must not take the line with
       it: this is the same statement the ink makes, one field along. */
    const wasConfirm3 = window.confirm;
    window.confirm = () => true;
    postDel(par.id);
    window.confirm = wasConfirm3;
    if (postToWho(rep) !== 'iri')
      fails.push('the reply stopped saying who it answers the moment that post ' +
                 'was gone, which is exactly the reader who needed it said');
    if (postRow(rep).indexOf('@iri') < 0)
      fails.push('the row of a reply whose parent is gone does not say who it ' +
                 'answers, though the reply carries the handle');
  }

  /* And nothing at all is still nothing at all. */
  const wasN3 = POSTS.length;
  PW = pwBlank();
  pwSend();
  await new Promise(r => setTimeout(r, 200));
  if (POSTS.length !== wasN3)
    fails.push('an empty composer made a post. No line, no photograph, no '
             + 'voice -- there is nothing there to put on a timeline');

  /* ---- a post that has not reached the server says so ----------------
     netPush() was handed an empty failure function, so a post the server
     refused looked exactly like one it took: the timeline showed it, nothing
     was said, and the only way to find out was somebody's dashboard.
     「spl流したのにまだ投稿載らんの？」

     There is no server here and there is not meant to be -- which makes this
     the honest case rather than a contrived one: every post written in this
     check is a post that did not go up. `sid` is the server's name for it and
     postSid() is the only thing that writes one. */
  const unsent = POSTS.filter(p => p.mine && !p.pv && !p.sid);
  if (!unsent.length)
    fails.push('every post in this check reached a server that is not there, ' +
               'so nothing below is a test of anything');
  else if (postRow(unsent[0]).indexOf(ICON_UNSENT) < 0)
    fails.push('a post that never reached the server is drawn exactly like one ' +
               'that did. Nothing on the row, nothing on the screen, and the ' +
               'only place the truth is written is a dashboard');

  /* ---- and none of it happens without an account --------------------
     A post has a writer. The three sns tabs and the composer were built when
     there was no server -- a post was an object in localStorage with nowhere
     to go -- so nothing ever asked whose it was, while every write in
     supabase/schema.sql went through is_member() from the first day. Signed
     out, somebody could write a post that went nowhere, to a timeline nobody
     else was on. 「なんでログインしてないアカウントで投稿できんの？」

     Driven rather than read: the session is taken away and the real vFeed()
     and the real openPost() are asked what they do. A grep for netSignedIn()
     would pass over a guard that runs after the composer is already open. */
  const rows = (html) => (String(html).match(/class="post[ "]/g) || []).length;
  const wasSess = SESS;
  SESS = null;
  const shut = vFeed();
  if (rows(shut))
    fails.push('the timeline draws ' + rows(shut) + ' posts with nobody signed ' +
               'in. A post has a writer, and a timeline read by nobody is the ' +
               'app being half-online');
  if (shut.indexOf('obform') < 0 && shut.indexOf('obcrest') < 0)
    fails.push('the timeline signed out is neither the timeline nor the door -- ' +
               'it shows something else, which is a screen nobody can act on');
  const wasForm = (typeof FORM !== 'undefined' && FORM) ? FORM.html : '';
  openPost();
  const nowForm = (typeof FORM !== 'undefined' && FORM) ? FORM.html : '';
  if (nowForm !== wasForm)
    fails.push('the composer opened with nobody signed in, so a post could be ' +
               'written by nobody');
  SESS = wasSess;

  /* ---- 11b. the day does not follow the + button ---------------------
     PW outlives the screen on purpose -- going to look a word up must not
     throw away what was typed -- so openPost('new') has to drop what made
     the composer NOT an ordinary post, by name. `to` was on that list and
     `ed` was added to it; `pr` was never on it, so opening the day's
     sentence, leaving, and pressing + an hour later came back to the day.
     「お題じゃないところ+から入ったのに戻ってまた投稿しようとするとそこになる」

     mn goes with pr and the LINE stays, which is not symmetry for its own
     sake: under `pr` the meaning field is readonly (pwSetMn returns early),
     so that text is daySay() and nobody typed it -- while the line is the
     one thing somebody did type, and this button is not a delete. */
  {
    const wasDay = DAY;
    DAY = { id: 7, on_day: '2026-08-23', text: 'It is unbearably hot today.',
            says: 'It is unbearably hot today.' };
    PW = pwBlank();
    openPost('day');
    if (PW.pr !== 7 || !PW.mn)
      fails.push('the composer did not take the day at all (pr=' + PW.pr +
                 ', mn=' + JSON.stringify(PW.mn) + '), so nothing below this ' +
                 'is a test of anything');
    PW.ln = 'kano tir';                       /* somebody types their line */
    openPost('new');                          /* an hour later, the + button */
    if (PW.pr)
      fails.push('pressing + came back to the day: PW.pr is still ' + PW.pr +
                 '. The + button is an ordinary post every time');
    if (PW.mn)
      fails.push('pressing + left the day’s words in the meaning (' +
                 JSON.stringify(PW.mn) + '). Under `pr` that field is readonly, ' +
                 'so nobody typed it and it is not theirs to keep');
    if (PW.ln !== 'kano tir')
      fails.push('pressing + threw away the line somebody typed (' +
                 JSON.stringify(PW.ln) + '). Dropping the day is not a delete');
    DAY = wasDay;
    PW = pwBlank();
  }

  /* ---- 11c. the drafts control is on the keyboard, beside the mic -----
     Neither of the two faces had been deleted, and neither could be found on
     a phone: they were drawn in the top bar, which is 390 points wide and
     already holds a back arrow, a screen name and a filled button, so the
     control was shown only when it had something to say -- and on a first
     post it has nothing. Correct, and invisible.
     「マイクの横に下書きの保存されてるボタン出てこないし」
     「下書き1とか下書きに保存するみたいなボタン無くしたんだけど？」

     Asked of pwAddHTML(), which IS the row over the keyboard, rather than of
     the whole screen -- the screen would say yes to it sitting anywhere. */
  {
    const wasDrafts = DRAFTS.slice();
    const wasPW = PW;

    PW = pwBlank(); PW.ln = 'kano tir';        /* something to save */
    const typed = pwAddHTML();
    if (typed.indexOf('draftKeep') < 0)
      fails.push('with a line typed, the row over the keyboard offers no way ' +
                 'to save a draft: pwAddHTML() does not name draftKeep');

    /* Nothing typed and none saved: the MARK is here and the NUMBER is not.
       「あと下書きマークは0でも出して。」 OWNER 2026-08-27, which replaces
       what this block used to demand -- that the row draw nothing at all in
       that state. It was the state everybody's first post is in, so the one
       screen where the drafts control was never once shown was the first one
       anybody sees. The count is the half that still goes: a disc reading 0
       counts nothing. */
    PW = pwBlank();                            /* nothing typed, none saved */
    DRAFTS.length = 0;
    const bare = pwAddHTML();
    if (bare.indexOf('draftKeep') >= 0)
      fails.push('with nothing typed, the row offers to SAVE a draft. There ' +
                 'is nothing to save');
    if (bare.indexOf('drafts') < 0)
      fails.push('with no drafts saved, the row over the keyboard draws no ' +
                 'drafts mark at all, so the one screen everybody starts on ' +
                 'is the one that never says drafts exist');
    if (bare.indexOf('pwabn') >= 0)
      fails.push('with no drafts saved, the mark still carries a count. A ' +
                 'disc reading 0 is the number of things there are none of');

    DRAFTS.push({ at: 1, ln: 'kano', mn: '', to: '', pr: 0, pics: [] });
    const saved = pwAddHTML();
    if (saved.indexOf('drafts') < 0)
      fails.push('a draft is saved and the row over the keyboard does not say ' +
                 'so, so the only way back to it is a screen nobody can reach');
    if (saved.indexOf('pwabn') < 0 || saved.indexOf('>1<') < 0)
      fails.push('a draft is saved and the mark carries no count, so the mark ' +
                 'says the same thing with one saved as with none');

    /* And it is not ALSO in the top bar, which is where it could not be seen.
       openPost() builds that bar; a control in both places is two controls. */
    openPost('new');
    const bar = (typeof FORM !== 'undefined' && FORM) ? String(FORM.right || '') : '';
    if (bar.indexOf('draftKeep') >= 0 || bar.indexOf('drafts') >= 0)
      fails.push('the drafts control is in the top bar as well as the row: ' +
                 'the same button twice, one of them where nobody found it');

    DRAFTS.length = 0;
    for (const d of wasDrafts) DRAFTS.push(d);
    PW = wasPW;
  }

  /* ---- 11d. on a reply, the person's own side still fits two fields ---
     The composer is laid out to --vvmin, which is the smallest the visible
     part has been -- that is, the screen with the keyboard up. A reply puts
     two more things in that box: who you are answering, and the post itself.
     What gave way was the part somebody is writing in.
     「返信のところ自分の狭すぎやろ、、、もっと広くしてくれ」

     Measured rather than read. --vvmin is set here to a real one: 300 is an
     ordinary Japanese keyboard on an ordinary phone, and it is the number the
     rule above this one in index.html was already written against. */
  {
    const wasPW = PW;
    const root = document.documentElement;
    const hadMin = root.style.getPropertyValue('--vvmin');
    root.style.setProperty('--vvmin', '300px');

    const other = POSTS.filter(q => q.id !== p.id)[0] || p;
    PW = pwBlank(); PW.to = other.id;
    openPost();
    render();
    await new Promise(r => requestAnimationFrame(() => r()));

    const scroll = document.querySelector('.view.fit .pwscroll');
    const quote  = document.querySelector('.view.fit .pwqs');
    if (!scroll || !quote) {
      fails.push('the reply composer drew no quote or no writing area at all ' +
                 '(scroll=' + !!scroll + ', quote=' + !!quote + ')');
    } else {
      const h = Math.round(scroll.getBoundingClientRect().height);
      if (h < 88)
        fails.push('the reply composer leaves ' + h + 'px for what the person ' +
                   'is writing. There are two fields there -- the line and the ' +
                   'meaning -- so one 44pt row is not enough by construction');
      const ln = document.getElementById('pw-ln');
      if (ln) {
        const lb = ln.getBoundingClientRect(), sb = scroll.getBoundingClientRect();
        if (lb.height < 1 || lb.bottom > sb.bottom + 1)
          fails.push('the line being typed into is cut off by the box it is in ' +
                     '(' + Math.round(lb.bottom - sb.bottom) + 'px past the ' +
                     'bottom): the field somebody is looking at is the one that ' +
                     'gave way');
      }
    }
    if (hadMin) root.style.setProperty('--vvmin', hadMin);
    else root.style.removeProperty('--vvmin');
    PW = wasPW;
  }

  /* ---- 11d2. and the MEANING is in that box, not under it -------------
     「自分の言語で一行と意味がこのページで見れるように。」OWNER 2026-08-27

     11d above asks whether the box somebody writes in is big enough and
     whether the LINE is inside it. It never asked about the field under the
     line, and that is the field the owner could not find on a real phone.
     Nothing throws: `.pwscroll` scrolls, so the meaning is 29px under the
     fold, perfectly rendered, with no scrollbar on a phone to say it is
     there. Every screenshot of this screen is right.

     It is measured over four things at once because the fault is different in
     each and the first reading of it -- one reply, one direction, one
     viewport -- said the screen was fine:

       the visible viewport   The reply was measured once at 508, which is a
                              390x844 phone with the system keyboard up, and
                              at 508 the horizontal case does fit. At 380 it
                              is 9px out and at 300 it is 29px out. A number
                              that holds at the top of the range and nowhere
                              else is the shape a single measurement gives.

       which way the language  A column is the case that is wrong at EVERY
                              size and gets WORSE as the phone gets bigger --
                              153px out at 560 against 128 at 300 -- because
                              the column asked for its height as a share of
                              the whole screen while it sits in a box that is
                              a fraction of it. Backwards from every other
                              rule here, and invisible to anybody testing on
                              one phone in one language.

       reply or not           A reply is where it bites, because the thread
                              over it takes the room. It is not only a reply:
                              a column on a small viewport is out by 48px with
                              nothing quoted at all.

       a photograph           The strip is in the same column as the two
                              fields, so it competes with them.

     Asked of the RECTANGLE, per case, and never as a count of what is on the
     page: `#pw-mn` is drawn in every one of these and always was. Whether it
     is on the screen is where it IS. */
  {
    const wasPW = PW, root = document.documentElement;
    const hadMin = root.style.getPropertyValue('--vvmin');
    const hadKb  = root.style.getPropertyValue('--vvkb');
    const wasPlan = SET.plan, wasDir = SCRIPT.dir;
    /* A column is what money buys (`CAN.dir` is 'pro'), so free is the one
       plan where this case cannot be reached at all. Asking for it on the
       plan the walks run on would be measuring the horizontal field twice. */
    SET.plan = 'pro';
    const other = POSTS.filter(q => q.id !== p.id)[0] || p;

    /* 260 is the smallest a phone leaves: the extension caps a keyboard at
       0.55 of the screen, and 0.45 of an SE's 568 is 255. 508 is a 390x844
       with the system keyboard up, which is where this was measured when it
       looked fine. */
    for (const vv of [260, 380, 508]) {
      for (const dir of ['ltr', 'ttb-rl']) {
        for (const reply of [false, true]) {
          for (const pic of [false, true]) {
            root.style.setProperty('--vvmin', vv + 'px');
            root.style.setProperty('--vvkb', (844 - vv) + 'px');
            SCRIPT.dir = dir;
            PW = pwBlank();
            if (reply) PW.to = other.id;
            if (pic && p.pic) PW.pics = [p.pic];
            openPost();
            render();
            await new Promise(r => requestAnimationFrame(() => r()));

            const scroll = document.querySelector('.view.fit .pwscroll');
            const mn = document.getElementById('pw-mn');
            const where = vv + 'px of visible screen, ' +
              (dir === 'ltr' ? 'a line across' : 'a column down') +
              (reply ? ', replying' : ', a new post') +
              (pic ? ', with a photograph' : '');
            if (!scroll || !mn) {
              fails.push('the composer drew no writing area or no meaning at ' +
                         'all (' + where + ')');
              continue;
            }
            const sb = scroll.getBoundingClientRect();
            const mb = mn.getBoundingClientRect();
            const under = Math.round(mb.bottom - sb.bottom);
            if (under > 1)
              fails.push('the meaning is ' + under + 'px under the fold of the ' +
                         'box it is in (' + where + '). It is drawn, it is ' +
                         'reachable by scrolling a box with no scrollbar on a ' +
                         'phone, and somebody writing a post cannot see what ' +
                         'their line means');
            const over = Math.round(sb.top - mb.top);
            if (over > 1)
              fails.push('the meaning is ' + over + 'px above the top of the ' +
                         'box it is in (' + where + ')');
          }
        }
      }
    }

    SET.plan = wasPlan; SCRIPT.dir = wasDir; PW = wasPW;
    if (hadMin) root.style.setProperty('--vvmin', hadMin);
    else root.style.removeProperty('--vvmin');
    if (hadKb) root.style.setProperty('--vvkb', hadKb);
    else root.style.removeProperty('--vvkb');
  }

  /* ---- 11d2. the row over the keyboard does not move while one arrives --
     「2枚目が正解なのに1枚目みたいにまだガチャガチャうごくのうざい。
     写真とかは固定でしょ？」 OWNER 2026-08-27, two photographs a second
     apart: no row in the first, the row in the second, one screen.

     `.view.fit .pwbar` hangs off `--vvkb`, which vvFit() recomputes on every
     `resize` and every `scroll` visualViewport sends. Two things follow and
     both were live: while the keyboard is rising and the viewport has not
     been told yet, `innerHeight - height` is 0 -- the same answer as no
     keyboard -- so the row was at the foot of the page, UNDER the keyboard;
     and every intermediate value iOS hands over on the way moved it again.

     visualViewport is replaced with one this check can drive. That is the
     only way to ask this on a Linux runner: a headless browser has no soft
     keyboard, so nothing here ever sends the events a phone sends. What is
     held is vvFit()'s answer to each value -- how many values a real iPhone
     sends, and when, is the phone's business and is not knowable from here.

     The ramp is fed twice on purpose. The FIRST keyboard of a launch has
     never been measured, so the row rises with it; the second must not move
     at all, and neither must the third if the phone sends one event rather
     than twenty. */
  {
    const wasPW = PW, root = document.documentElement;
    const hadKb = root.style.getPropertyValue('--vvkb');
    const KB = 336;                       /* a JP keyboard on a 390x844 */
    const real = Object.getOwnPropertyDescriptor(window, 'visualViewport');
    const fake = { height: window.innerHeight, offsetTop: 0,
                   addEventListener: function () {}, removeEventListener: function () {} };
    Object.defineProperty(window, 'visualViewport',
      { configurable: true, get: function () { return fake; } });

    const field = () => document.querySelector('.view.fit .lnin') ||
                        document.querySelector('.view.fit input, .view.fit textarea');
    const barTop = () => {
      const b = document.querySelector('.pwbar');
      return b ? Math.round(b.getBoundingClientRect().top) : null;
    };
    const ramp = [0.08, 0.22, 0.41, 0.6, 0.78, 0.92, 1];
    const open = () => {
      PW = pwBlank(); openPost(); render();
      const f = field(); if (f) f.focus();
      fake.height = window.innerHeight; fake.offsetTop = 0; vvFit();
      const seen = [barTop()];
      for (const fr of ramp) {
        fake.height = Math.round(window.innerHeight - KB * fr);
        vvFit(); seen.push(barTop());
      }
      return seen;
    };
    const shut = () => {
      const f = field(); if (f) f.blur();
      document.body.focus();
      fake.height = window.innerHeight; fake.offsetTop = 0; vvFit();
    };

    const first = open();
    const settled = first[first.length - 1];
    shut();
    const down = barTop();
    const second = open();
    const moved = second.filter(y => y !== settled).length;

    if (moved)
      fails.push('with a keyboard already measured, the row over the keyboard ' +
                 'moved ' + moved + ' time(s) while the next one came up (' +
                 second.join(' -> ') + '). It is meant to be standing on the ' +
                 'keyboard before iOS says anything and not to move again');
    if (second[0] !== settled)
      fails.push('the row over the keyboard starts at ' + second[0] + ' and ' +
                 'ends at ' + settled + ', so it is drawn under the keyboard ' +
                 'until the viewport reports -- which is the frame the owner ' +
                 'photographed with no row on it');
    /* and it still comes back down: a row welded to the last keyboard would
       pass everything above and hang in the middle of a screen with none. */
    if (down === null || down <= settled)
      fails.push('with the keyboard down and nothing focused the row is at ' +
                 down + ', not at the foot of the screen. It is welded to a ' +
                 'keyboard that is not there');
    /* iOS lifts the page to clear the focused field; the keyboard has not
       moved, so the row has to come down by exactly that much to stay on it. */
    fake.height = window.innerHeight - KB; fake.offsetTop = 0; vvFit();
    const flat = barTop();
    fake.offsetTop = 40; vvFit();
    const lifted = barTop();
    if (lifted !== flat + 40)
      fails.push('iOS scrolled the page up by 40 and the row moved by ' +
                 (lifted - flat) + ' in the page instead of 40, so it is no ' +
                 'longer on the keyboard while the page is held up');

    if (real) Object.defineProperty(window, 'visualViewport', real);
    else delete window.visualViewport;
    const f = field(); if (f) f.blur();
    document.body.focus();
    if (hadKb) root.style.setProperty('--vvkb', hadKb);
    else root.style.removeProperty('--vvkb');
    PW = wasPW;
  }

  /* ---- 11e. the face on a post is the way to whoever wears it ---------
     「タイムライン検索含めて人のツイートのアイコン押したらその人のホーム画面に
     飛ぶようにしてよ。自分ならプロフィールのページ。」

     The search row has done this since it was written; the timeline had not,
     so the same face was a door in one list and scenery in the other.

     Asked of the ROW, and asked per post rather than as a count: the counts
     agreeing while the handles are shifted by one is the only way this breaks
     in a way nobody would see -- every avatar opens somebody, just not the
     one under the thumb. */
  {
    const mine   = { id: 901, mine: true,  hd: 'me',    who: 'Me',    ln: 'a' };
    const theirs = { id: 902, mine: false, hd: 'shiro', who: 'Shiro', ln: 'a' };
    const older  = { id: 903, mine: false, hd: '',      who: 'Old',   ln: 'a' };

    const rMine = postRow(mine), rTheirs = postRow(theirs), rOld = postRow(older);

    /* Built with DO() rather than grepped for a word: the handle is on the row
       in three other places, so 'shiro' appearing somewhere is not the face
       being a door -- which is exactly how the first version of this passed
       with the bug in. */
    const doorTo = (h) => '<button class="pav pavb"' + DO('go', ['profile', h]);
    if (rTheirs.indexOf(doorTo('shiro')) < 0)
      fails.push('somebody else’s face on the timeline is not a way to them: ' +
                 'the only place a person can be opened from is the search');
    if (rMine.indexOf('<button class="pav pavb"' + DO('goTab', ['profile'])) < 0)
      fails.push('your own face on the timeline does not go to your profile');
    if (rMine.indexOf(doorTo('me')) >= 0)
      fails.push('your own face is opened as if you were somebody else');
    if (rOld.indexOf('<button class="pav') >= 0)
      fails.push('a post with no handle on it draws a face you can press, and ' +
                 'it opens nobody. Everything written before posts carried a ' +
                 'handle is in that state');
  }

  /* ---- 11f. backing out asks about anything somebody typed ------------
     The latch on back() asked pwHas(), which is "is there a post here" -- the
     question the send button needs. A meaning on its own is not a post, so a
     meaning typed on its own was thrown away silently on the way out.
     「何か入ってる時は下書きに保存するかどうかをやるんじゃないの？」

     Driven: the real back() is pressed on the real composer, and what is
     asked is whether the arrow was taken over. */
  {
    const wasPW = PW, wasNav = NAV.slice(), wasQ = BACKQ;
    const asks = () => {
      BACKQ = 0;
      openPost();
      back();
      const q = !!BACKQ;
      BACKQ = 0;
      return q;
    };

    PW = pwBlank(); PW.mn = 'the mountain is seen';
    if (!asks())
      fails.push('a meaning typed on its own is thrown away by the back arrow ' +
                 'without asking. It is somebody’s words in a field they typed ' +
                 'them into');

    PW = pwBlank(); PW.mn = 'It is unbearably hot today.'; PW.pr = 7;
    if (asks())
      fails.push('backing out of the day’s sentence asks whether to keep words ' +
                 'nobody wrote: under PW.pr the meaning is readonly and holds ' +
                 'daySay(). That teaches somebody to press No without reading');

    PW = pwBlank();
    if (asks())
      fails.push('an empty composer asks on the way out');

    PW = pwBlank(); PW.ln = 'kano tir';
    if (!asks())
      fails.push('a line typed is thrown away by the back arrow without asking');

    BACKQ = wasQ; NAV = wasNav; PW = wasPW;
  }

  /* ---- 12. the timeline is sent the small copy, not the photograph ----
     A row shows a picture a few hundred pixels across and was being sent one
     nine hundred across. Nothing looked wrong and nothing could: the browser
     scales it down on arrival, so the only difference is the bytes, and bytes
     are the one thing a screenshot cannot show. What runs out first on a $25
     Supabase is egress, and the timeline is the only thing anybody scrolls. */
  const sizeOf = (u) => new Promise((res) => {
    const im = new Image();
    im.onload = () => res(im.width + 'x' + im.height);
    im.onerror = () => res('');
    im.src = String(u || '');
  });
  const big = window.__fixPic(900, 600);
  const small = await new Promise((res) => postThumb(big, res));
  const smallWH = await sizeOf(small);
  if (smallWH !== '300x200')
    fails.push('the small copy of a 900x600 photograph is ' +
               JSON.stringify(smallWH) + ' and POST_THUMB is ' + POST_THUMB);
  /* Not "different bytes": a copy that re-encoded at the same size would also
     be different bytes and would save nothing at all. */
  if (!(small.length < big.length / 2))
    fails.push('the small copy is ' + Math.round(small.length / 1024) + ' KB ' +
               'against the photograph\u2019s ' + Math.round(big.length / 1024) +
               ' KB, which is not a saving worth a second file');
  /* A picture already smaller than POST_THUMB gets no second file rather than
     a second copy of the same bytes. */
  const none = await new Promise((res) => postThumb(window.__fixPic(200, 120), res));
  if (none !== '')
    fails.push('a picture already smaller than POST_THUMB was given a small ' +
               'copy of itself, which is a second file for nothing');

  /* And what each of the two screens is handed. Per picture, because `pt` is
     allowed to have a hole in it: a small copy that failed to go up must fall
     back to the photograph IN ITS OWN PLACE. A list that closed the hole
     would put picture two’s thumbnail under picture one, which is the
     wrong picture shown with nothing throwing. */
  const A = 'u/p/0.jpg', B = 'u/p/1.jpg', TA = 'u/p/0.t.jpg', TB = 'u/p/1.t.jpg';
  const tail = postThumbs({ pu: [A, B], pt: [TA] });
  if (tail[0] !== netMediaURL(TA) || tail[1] !== netMediaURL(B))
    fails.push('with a small copy for the first picture only, the timeline ' +
               'draws ' + JSON.stringify(tail) + ' -- it has to be the small ' +
               'copy then the photograph');
  const lead = []; lead[1] = TB;
  const holed = postThumbs({ pu: [A, B], pt: lead });
  if (holed[0] !== netMediaURL(A) || holed[1] !== netMediaURL(TB))
    fails.push('with a small copy for the SECOND picture only, the timeline ' +
               'draws ' + JSON.stringify(holed) + ' -- picture one is wearing ' +
               'picture two\u2019s thumbnail');
  const opened = postPics({ pu: [A, B], pt: [TA, TB] });
  if (opened[0] !== netMediaURL(A))
    fails.push('opening a photograph shows the small copy, so there is no way ' +
               'to see the photograph at all');
  /* On this phone the picture is in hand. Nothing is downloaded either way,
     so a smaller copy would cost a frame to save nothing. */
  if (postThumbs({ pics: [big] })[0] !== big)
    fails.push('a post written on this phone does not draw its own picture');
  /* A post from before any of this has no `pt` and draws the photograph. */
  if (postThumbs({ pu: [A] })[0] !== netMediaURL(A))
    fails.push('a post written before there were small copies draws nothing');

  /* And the row itself, which is the half that matters and the half a check
     of postThumbs() alone cannot see: a function can be perfectly correct and
     simply never be the one that runs. Asked of the HTML a timeline actually
     draws, with the photograph's own URL forbidden in it -- "the small copy
     appears" is also true of a row that asks for both. */
  const seen = POSTS.filter((x) => !x.to)[0];
  if (!seen) fails.push('there is no post to draw');
  else {
    const wasP = seen.pics, wasU = seen.pu, wasT = seen.pt;
    delete seen.pics;
    seen.pu = [A]; seen.pt = [TA];
    const drawn = String(postRow(seen) || '');
    seen.pics = wasP; seen.pu = wasU; seen.pt = wasT;
    if (wasP === undefined) delete seen.pics;
    if (wasU === undefined) delete seen.pu;
    if (wasT === undefined) delete seen.pt;
    if (drawn.indexOf(netMediaURL(TA)) < 0)
      fails.push('the row a timeline draws does not ask for the small copy at all');
    if (drawn.indexOf(netMediaURL(A)) >= 0)
      fails.push('the row a timeline draws still asks for the photograph, so ' +
                 'every picture scrolled past costs its full size. Nothing looks ' +
                 'wrong -- the browser scales it down on arrival -- and the only ' +
                 'difference is the bytes');
  }

  /* ---- 13. a post taken down leaves a tombstone, and only where it was ---
     The post somebody came to read went. A gap there reads as "never
     existed", which is the opposite of what happened, so the thread says so.
     Everything ELSE in the conversation is somebody else's line and is not a
     hole to be marked -- 「スレッドは本ツイートだけね？それ以外の会話は本
     ツイートとは関係ないものとする」 -- so vThread() draws the tombstone for
     the ONE post and drops the rest.

     post_seen in supabase/schema.sql is the other half: the body is emptied
     on the server, so what arrives here has nothing in it to leak. */
  const gone = { id: 'gone1', at: 2, hd: 'iri', who: 'Iri', ln: '', down: true, mine: false };
  const own  = { id: 'gone2', at: 3, hd: 'aya', who: 'Aya', ln: 'mine', down: true, mine: true };
  POSTS.push(gone, own);
  const tomb = String(postTomb() || '');
  if (tomb.indexOf('ptomb') < 0)
    fails.push('there is no tombstone to draw');
  if (tomb.indexOf('iri') >= 0 || tomb.indexOf('postOpen') >= 0)
    fails.push('a tombstone names somebody or is a thing you can press. Nothing is ' +
               'left of the post, which is the point of taking it down');
  /* And a ROW is still a row. postRow() draws the rest of the conversation
     and must not have become a tombstone factory. */
  if (String(postRow(gone) || '').indexOf('ptomb') >= 0)
    fails.push('every taken-down post in a thread draws a tombstone, so a ' +
               'conversation is a column of them');
  const feed = postAll().map((x) => x.id);
  if (feed.indexOf('gone1') >= 0)
    fails.push('a post taken down is back in the timeline, in front of everybody ' +
               'it was taken from');
  /* And your own stays where it was. The person it happened to is told by
     their own post -- the chip beside "edited" -- and there is no notice.
     「通知はいらんてホーム画面にバンでいいやん」 */
  if (feed.indexOf('gone2') < 0)
    fails.push('your own post taken down vanished from your own timeline, so the ' +
               'one person who has to be told is the one who is not');
  const mineRow = String(postRow(own) || '');
  if (mineRow.indexOf('ptomb') >= 0)
    fails.push('your own post taken down is drawn to you as a stranger\u2019s tombstone');
  if (mineRow.indexOf('pdown') < 0)
    fails.push('your own post taken down says nothing about being taken down');
  POSTS.pop(); POSTS.pop();

  /* Only what the Lingua keyboard typed becomes this language's letters.
     That keyboard inserts private use code points and nothing else on a phone
     does, so the ink is cut on the character: a code point in the range is a
     shape, and roman typed on the phone's own QWERTY is text and stays text.
     Before this the ink was cut from the ROMAN line with the alphabet, so a
     sentence typed on any keyboard came out in the drawn letters.
     「システムキーボードで打ったものが勝手に自作文字になるのはおかしい」

     Nothing throws when it is wrong: the post renders, in somebody's own
     letters, saying something they never said in that language. */
  (function(){
    const o = GGRID.inset, D = geStep();
    /* EVERY letter gets a shape, including the ones ` hello` is spelled with.
       With only the first three drawn, the old cut and the new one give the
       same answer -- h, e, l and o have no shape either way -- and the check
       could not tell them apart. */
    ltOrder(LETTERS).forEach((l, i) => {
      l.st = [{ pts: [[o + (2 + (i % 16)) * D, o + 4 * D],
                      [o + (2 + (i % 16)) * D, o + 16 * D]] }];
    });
    saveLetters(); installScriptFont();
    const lts = ltOrder(LETTERS.filter(l => l.st && l.st.length));
    let pua = '', names = '';
    for (let i = 0; i < 3; i++) { pua += String.fromCharCode(0xE000 + i); names += ltName(lts[i]); }
    go('feed'); openPost();
    PW.ln = pua + ' hello'; PW.mn = 'a line';
    pwSend();
    const p = POSTS.slice().sort((a, b) => (b.at || 0) - (a.at || 0))[0];
    if (String(p.ln) !== names + ' hello')
      fails.push('a post keeps the roman spelling, not what the keyboard typed: ' +
                 JSON.stringify(p.ln) + ' where ' + JSON.stringify(names + ' hello') +
                 ' was typed. A private use code point is a square box on ' +
                 "somebody else's phone.");
    if (/[\uE000-\uF8FF]/.test(String(p.ln)))
      fails.push('a private use code point reached what is stored: ' + JSON.stringify(p.ln));
    const sk = (p.ink && p.ink.s) || [];
    if (sk.length !== 4 || typeof sk[0] !== 'number' || typeof sk[1] !== 'number' ||
        typeof sk[2] !== 'number' || sk[3] !== ' hello')
      fails.push('the ink covers more than the Lingua keyboard typed: ' +
                 JSON.stringify(sk) + ' -- three shapes and then " hello" as text ' +
                 'is what was typed.');
  }());

  /* ---- the face on the profile row follows the face on the phone --------
     netMakeProfile() wrote `av` once, the day the account was made, and
     nothing ever wrote it again. So drawing a new first letter or setting a
     photograph changed what postAvatar() answers everywhere in the app except
     the little face beside "somebody liked this", which is the one place that
     reads the profile row. A notice could draw a face somebody had not worn
     for a month.

     Nothing about the timeline was wrong -- a post freezes its own face when
     it is written -- so this is not visible anywhere a check was looking.

     Three things, and the middle one is the reason it sat in the backlog
     rather than being fixed: sending on every change would be a request per
     letter drawn. It is not -- postAvatar() answers the photograph, else the
     FIRST drawn letter -- but "it only sends when it moved" has to be held or
     the cheap version silently becomes the expensive one.

     The requests are counted rather than the state read: what is being held
     is what goes OUT. netSend is wrapped and answers success without a
     server, the same way conv-check wraps LinguaFont.build. */
  const realSend = netSend;
  let sent = [];
  netSend = function (method, path, body, tok, ok, bad) {
    if (String(path).indexOf('/rest/v1/profile') === 0) {
      sent.push({ method, av: JSON.stringify((body && body.av) || null) });
      if (ok) ok(null);
      return;
    }
    return realSend.apply(this, arguments);
  };
  try {
    ME.avSent = '';
    ME.pic = '';
    sent = [];
    netAvSync();
    const first = sent.length;

    netAvSync();                                  /* nothing moved */
    const again = sent.length;

    ME.pic = 'data:image/jpeg;base64,AAAA';       /* the face moves */
    netAvSync();
    const moved = sent.length;

    netAvSync();                                  /* and settles again */
    const settled = sent.length;

    if (first !== 1)
      fails.push('the face was never sent: netAvSync() made ' + first +
                 ' requests for a profile that has never had one');
    if (again !== first)
      fails.push('the face was sent again with nothing changed (' + again +
                 ' requests) -- that is a request every launch for a face ' +
                 'that has not moved');
    if (moved !== first + 1)
      fails.push('the face changed and ' + (moved - again) + ' requests went ' +
                 'out: a notice goes on drawing a face somebody has stopped ' +
                 'wearing');
    if (settled !== moved)
      fails.push('after the change it kept sending (' + settled + ')');
    if (moved > first && sent[sent.length - 1].method !== 'PATCH')
      fails.push('the face was updated with ' + sent[sent.length - 1].method +
                 ' rather than PATCH -- schema.sql grants update(handle, ' +
                 'display, av), and an insert on a row that exists is a 409');
  } finally { netSend = realSend; }

  return { fails, mid: (nowLight * 100).toFixed(1), corner: (wasLight * 100).toFixed(1),
           bytes: Math.round(String(out[0] || '').length / 1024),
           thumb: Math.round(small.length / 1024), full: Math.round(big.length / 1024),
           vof: (v && v.vo && v.vo.f) || '' };
});

await br.close();
srv.close();

if (R.fails.length) {
  console.error('\npost: ' + R.fails.length +
                ' thing' + (R.fails.length > 1 ? 's' : '') +
                ' about what a post carries do not hold:\n');
  for (const f of R.fails) console.error('  ' + f + '\n');
  process.exit(1);
}
console.log('post: a letter placed on a black photograph is IN the file that goes\n' +
            '      out -- ' + R.mid + '% of it is light where the photograph was ' +
            R.corner + '%, ' + R.bytes + ' KB.\n' +
            '      The post carries a picture and nothing about where the letter\n' +
            '      sat, it carries the direction its language ran in, and the\n' +
            '      composer is empty behind it.\n' +
            '      A voice goes out as a file and comes back as a name (' + R.vof + ')\n' +
            '      with none of its bytes on the post; deleting that post drops\n' +
            '      that one file and no other, and a post with no voice asks for\n' +
            '      nothing to be dropped at all. A deleted reply stops being\n' +
            '      counted on the post it answered, and never counts below zero.\n' +
            '      A photograph on its own and a voice on its own are both posts,\n' +
            '      neither draws an empty line, and an empty composer still is not.\n' +
            '      A reply carries the handle of whoever it answers, and goes on\n' +
            '      saying so after that post has been deleted.\n' +
            '      With nobody signed in the timeline is the door and nothing\n' +
            '      else, and the composer will not open at all. A post that has\n' +
            '      not reached the server says so on its own row.\n' +
            '      The timeline is sent a small copy -- ' + R.thumb + ' KB against ' +
            R.full + ' KB --\n' +
            '      and pressing it still opens the photograph. A picture whose\n' +
            '      small copy never went up is drawn full size in its own place,\n' +
            '      not wearing the next one\u2019s.\n' +
            '      A post taken down leaves a tombstone where the post somebody\n' +
            '      came to read was, and nowhere else; it is out of the timeline,\n' +
            '      and your own stays, wearing the word for it.');
