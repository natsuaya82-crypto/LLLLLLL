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
  SCRIPT.dir = 'rtl'; SET.plan = 'plus';        /* choosing one is Plus */
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
            '      not wearing the next one\u2019s.');
