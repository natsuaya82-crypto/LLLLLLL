/* The access token lasts an hour, and the app does not close.
   ---------------------------------------------------------------------
   netResume() is called from one place -- www/boot.js, on the launch. For as
   long as that was the only place, an app left open for an hour went on
   sending a dead token to everything, and nothing threw: every write answered
   401, and for a slice, a plan and a draft the 401 went to an empty function.
   So a person who opened Lingua in the morning and saved a word in the
   afternoon saved it to the phone and to nothing else, and was told it had
   gone up. 「保存押せば起動されないの？」 OWNER 2026-09-02 -- no: saving sends
   the token that is in hand, and nothing ever replaced it.

   WHAT IS STUBBED IS XMLHttpRequest, and only that. netSend() -- the retry,
   the queue, the three conditions -- runs for real. A check that stubbed
   netSend() would be asking its own answer back (CLAUDE.md rule 12), and it
   is exactly what tools/again-check.mjs has to do for a different question,
   which is why this is a separate file rather than six more claims there.

   Run: node tools/token-check.mjs                                        */
import { fileURLToPath } from 'url';
import path from 'path';
import { chromium, LAUNCH } from './browser.mjs';
const dir = path.dirname(fileURLToPath(import.meta.url));

const bad = [];
function say(ok, line){ console.log('  ' + (ok ? '' : 'FAILED  ') + line); if (!ok) bad.push(line); }

const br = await chromium.launch(LAUNCH);
const pg = await br.newPage({ viewport:{ width:390, height:844 } });
await pg.goto('file://' + path.join(dir, '..', 'www', 'index.html'));
await pg.waitForSelector('#splash', { state:'detached', timeout:20000 });

/* ---- a wire that can refuse ---------------------------------------------
   __X.refuse is a function given every request and answering a status. The
   default is 200, so a claim only has to say which requests it wants refused
   and everything else -- the profile, the languages, whatever netTook() asks
   for when a session lands -- simply works. */
const WIRE = `
  window.__X = { sent:[], refuse:function(){ return 200; } };
  function FakeX(){ this.h = {}; this.readyState = 0; this.status = 0;
                    this.responseText = ''; }
  FakeX.prototype.open = function(m, u){ this.m = m; this.u = u; };
  FakeX.prototype.setRequestHeader = function(k, v){ this.h[k] = v; };
  FakeX.prototype.send = function(b){
    var self = this;
    var rec = { m:this.m, u:this.u, tok:String(this.h['Authorization'] || ''),
                pre:String(this.h['Prefer'] || ''), ct:String(this.h['Content-Type'] || ''),
                body:b, to:this.timeout, blob:this.responseType === 'blob' };
    window.__X.sent.push(rec);
    var st = window.__X.refuse(rec);
    setTimeout(function(){
      self.readyState = 4; self.status = st;
      /* A refresh has to answer with a SESSION or netTook() refuses it, and a
         refusal here would look exactly like the server saying no. */
      self.responseText = (st === 200 && /grant_type=refresh_token/.test(rec.u))
        ? JSON.stringify({ access_token:'AT' + window.__X.sent.length,
                           refresh_token:'RT', user:{ id:'me' } })
        : '[]';
      /* a picture asked for as bytes comes back as bytes */
      self.response = (rec.blob && st === 200) ? new Blob(['img'], { type:'image/jpeg' }) : null;
      if (self.onreadystatechange) self.onreadystatechange();
    }, 0);
  };
  window.XMLHttpRequest = FakeX;
  window.__reset = function(){ window.__X.sent = []; window.__X.refuse = function(){ return 200; }; };
  window.__count = function(re){
    return window.__X.sent.filter(function(r){ return new RegExp(re).test(r.u); }).length;
  };
  window.__of = function(re){
    return window.__X.sent.filter(function(r){ return new RegExp(re).test(r.u); });
  };
`;

/* THE SLICE WRITE, built by the app's own table (www/net.js § NET_PUT) and
   sent down the one wire -- what a save sends, minus netLangRow() in front of
   it, which is a read and is not what this is about. */
const wait = `function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }
function slicePut(kind, ok, bad){
  var w = NET_PUT.slice('srv1', { kind: kind, body: '[]' });
  netSend(w.method, w.path, w.body, netTok(), ok, bad);
}`;

console.log('');

/* ---- 1. the save that arrives an hour later ----------------------------- */
const one = await pg.evaluate(async ({ w, s }) => {
  eval(w); eval(s);
  SESS = { at:'OLD', rt:'r', uid:'me', anon:false };
  window.__reset();
  /* the first slice write is refused the way an expired token is refused */
  var first = true;
  window.__X.refuse = function(r){
    if (/rpc\/slice_put/.test(r.u) && first){ first = false; return 401; }
    return 200;
  };
  var got = null;
  slicePut('words', function(){ got = 'ok'; },
                                        function(d, st){ got = 'bad ' + st; });
  await wait(120);
  var sl = window.__of('rpc/slice_put');
  return { got: got,
           tries: sl.length,
           firstTok: sl[0] && sl[0].tok,
           lastTok: sl[sl.length - 1] && sl[sl.length - 1].tok,
           refreshes: window.__count('grant_type=refresh_token'),
           at: SESS && SESS.at };
}, { w: WIRE, s: wait });

say(one.got === 'ok' && one.tries === 2,
    'a save an hour later is refused, the token is renewed, and it goes again: ' +
    one.tries + ' tries, ' + one.got);
say(one.firstTok === 'Bearer OLD' && one.lastTok === 'Bearer ' + one.at &&
    one.lastTok !== one.firstTok,
    'and the second one carries the NEW token, not the one that was refused: ' +
    one.firstTok + ' then ' + one.lastTok);
say(one.refreshes === 1, 'one refresh, not none and not two: ' + one.refreshes);

/* ---- 2. twenty writes, one refresh -------------------------------------- */
const two = await pg.evaluate(async ({ w, s }) => {
  eval(w); eval(s);
  SESS = { at:'OLD', rt:'r', uid:'me', anon:false };
  window.__reset();
  var dead = {};
  window.__X.refuse = function(r){
    /* every slice write is refused ONCE -- which is what an hour looks like
       when a launch sends every slice at the same moment */
    if (/rpc\/slice_put/.test(r.u) && r.tok === 'Bearer OLD') return 401;
    return 200;
  };
  var done = 0, i;
  for (i = 0; i < 20; i++)
    slicePut('k' + i, function(){ done++; }, function(){});
  await wait(200);
  return { done: done,
           tries: window.__count('rpc/slice_put'),
           refreshes: window.__count('grant_type=refresh_token') };
}, { w: WIRE, s: wait });

say(two.refreshes === 1,
    'twenty writes refused at once spend the refresh token ONCE, not twenty times: ' +
    two.refreshes + ' refresh for ' + two.tries + ' attempts');
say(two.done === 20, 'and all twenty arrive: ' + two.done);

/* ---- 3. what is NOT retried --------------------------------------------- */
const three = await pg.evaluate(async ({ w, s }) => {
  eval(w); eval(s);
  SESS = null;
  window.__reset();
  window.__X.refuse = function(){ return 401; };
  var got = null;
  /* signed out, netGet() sends the publishable key. A 401 there is the server
     saying no to this request, not a session expiring. */
  netGet('/rest/v1/profile?select=id', function(){ got = 'ok'; },
                                       function(d, st){ got = 'bad ' + st; });
  await wait(120);
  var a = { got: got,
            tries: window.__count('/rest/v1/profile'),
            refreshes: window.__count('grant_type=refresh_token') };

  /* and a refresh that is itself refused must not refresh again */
  window.__reset();
  SESS = { at:'OLD', rt:'r', uid:'me', anon:false };
  window.__X.refuse = function(r){ return /rpc\/slice_put|refresh_token/.test(r.u) ? 401 : 200; };
  var got2 = null;
  slicePut('words', function(){ got2 = 'ok'; },
                                        function(d, st){ got2 = 'bad ' + st; });
  await wait(200);
  a.got2 = got2;
  a.tries2 = window.__count('rpc/slice_put');
  a.refreshes2 = window.__count('grant_type=refresh_token');
  a.out = !netSignedIn();
  return a;
}, { w: WIRE, s: wait });

say(three.refreshes === 0 && three.got === 'bad 401',
    'a request sent with the publishable key is not a session expiring — ' +
    'no refresh, and the refusal reaches the caller: ' + three.got);
say(three.refreshes2 === 1 && three.tries2 === 1,
    'a refresh token the server refuses is not refreshed again — no loop: ' +
    three.refreshes2 + ' refresh, ' + three.tries2 + ' attempt');
say(three.got2 === 'bad 401' && three.out,
    'and the phone is signed out and the caller is told, rather than left ' +
    'waiting: ' + three.got2 + ', signed out ' + three.out);

/* ---- 4. refused twice ---------------------------------------------------- */
const four = await pg.evaluate(async ({ w, s }) => {
  eval(w); eval(s);
  SESS = { at:'OLD', rt:'r', uid:'me', anon:false };
  window.__reset();
  window.__X.refuse = function(r){ return /rpc\/slice_put/.test(r.u) ? 401 : 200; };
  var got = null;
  slicePut('words', function(){ got = 'ok'; },
                                        function(d, st){ got = 'bad ' + st; });
  await wait(200);
  return { got: got, tries: window.__count('rpc/slice_put'),
           refreshes: window.__count('grant_type=refresh_token') };
}, { w: WIRE, s: wait });

say(four.tries === 2 && four.got === 'bad 401',
    'a 401 that survives a good refresh is the server refusing the person, ' +
    'not the clock — it goes once more and then stops: ' +
    four.tries + ' attempts, ' + four.got);

/* ---- 5. the receipts go up the same wire ---------------------------------
   It was the plan that went up here until 2026-09-06 -- `netPlanUp()`, the
   phone writing its own row. What goes up now is the signed transaction and
   what comes back is the plan (supabase/functions/verify-plan). The claim is
   the same one and it is about the WIRE: this call is inside the token
   renewal, which is the thing it used to be outside of. */
const five = await pg.evaluate(async ({ w, s }) => {
  eval(w); eval(s);
  SESS = { at:'OLD', rt:'r', uid:'me', anon:false };
  window.__reset();
  var first = true;
  window.__X.refuse = function(r){
    if (/verify-plan/.test(r.u) && first){ first = false; return 401; }
    return 200;
  };
  netPlanVerify(['J1'], function(){});
  await wait(150);
  var p = window.__of('/functions/v1/verify-plan');
  return { tries: p.length,
           lastTok: p[p.length - 1] && p[p.length - 1].tok,
           at: SESS && SESS.at,
           body: p[0] && p[0].body,
           table: window.__of('/rest/v1/plan').length,
           refreshes: window.__count('grant_type=refresh_token') };
}, { w: WIRE, s: wait });

say(five.tries === 2 && five.lastTok === 'Bearer ' + five.at,
    'the receipts go up the same wire, so the call is renewed too — this is ' +
    'the write that used to vanish on a launch: ' + five.tries + ' tries');
say(/"jws"/.test(five.body || '') && !/"plan"/.test(five.body || '') && five.table === 0,
    'and what goes up is the RECEIPT and never a plan word — the table is not ' +
    'touched at all (' + (five.body || '') + ')');

/* ---- 6. every request carries a deadline --------------------------------
   www/net.js had no `timeout` anywhere. A connection that is accepted and
   never answered is not an error and never becomes one: the phone waits on a
   spinner until somebody kills the app. The comment over netSend() said
   「Both callbacks are always called, so nothing is left waiting on a
   spinner」, and that was true of every road except the one that matters.
   「20で」 OWNER 2026-09-04. */
const six = await pg.evaluate(async ({ w, s }) => {
  eval(w); eval(s); window.__reset();
  netGet('/rest/v1/profile?select=*', function(){}, function(){});
  await wait(30);
  var r = window.__of('/rest/v1/profile')[0] || {};
  return { to: r.to, wait: (typeof NET_WAIT === 'number') ? NET_WAIT : null };
}, { w: WIRE, s: wait });

say(typeof six.to === 'number' && six.to > 0,
    'a request carries a deadline rather than waiting for ever: timeout=' +
    JSON.stringify(six.to));
say(six.wait !== null && six.to === six.wait,
    'and the deadline is one named number rather than a figure typed at the ' +
    'call: NET_WAIT=' + JSON.stringify(six.wait));

/* ---- 7. and running out is the road that already exists ------------------
   A timed-out XHR reaches readyState 4 with status 0 -- MEASURED in Chromium,
   not read off a specification -- which is the same thing netSend() already
   sees when a request goes and nothing comes back. So there is no `ontimeout`
   here: adding one would call `bad` a SECOND time, because readystatechange
   fires too. One road out, and this is what says so. */
const seven = await pg.evaluate(async ({ w, s }) => {
  eval(w); eval(s); window.__reset();
  window.__X.refuse = function(){ return 0; };        /* what running out looks like */
  var calls = [];
  netGet('/rest/v1/profile?select=*', function(){ calls.push('ok'); },
                                      function(d, st){ calls.push('bad ' + st); });
  await wait(120);
  return calls;
}, { w: WIRE, s: wait });

say(seven.length === 1 && seven[0] === 'bad 0',
    'and running out ends in the same one place a dead network does, exactly ' +
    'once -- no second way out: ' + JSON.stringify(seven));

/* ---- 7b. and a dead network is answered once too --------------------------
   What a request with no network does in a WebView: readyState 4 with status
   0, AND THEN `error` -- both, one after the other. Each of the two used to
   call `bad`, so netPop() was handed two ［再接続］ closures for one press and
   the retry sent everything twice (docs/reports/rule-audit-2026-09-27-core.md
   N1). The wire here does exactly what a dead network does. */
const sevenB = await pg.evaluate(async ({ w, s }) => {
  eval(w); eval(s); window.__reset();
  var send = FakeX.prototype.send;
  FakeX.prototype.send = function(b){
    var self = this;
    window.__X.sent.push({ m:this.m, u:this.u });
    setTimeout(function(){
      self.readyState = 4; self.status = 0; self.responseText = '';
      if (self.onreadystatechange) self.onreadystatechange();
      if (self.onerror) self.onerror();
    }, 0);
  };
  var calls = [];
  netGet('/rest/v1/profile?select=*', function(){ calls.push('ok'); },
                                      function(d, st){ calls.push('bad ' + st); });
  await wait(120);
  FakeX.prototype.send = send;
  return calls;
}, { w: WIRE, s: wait });

say(sevenB.length === 1 && sevenB[0] === 'bad 0',
    'a dead network (readyState 4 AND error) answers once, not twice: ' +
    JSON.stringify(sevenB));

/* ---- 8. and the file and the picture leave by the same exit ------------
   「一本化してくれ」「通信する場所」 OWNER 2026-09-27. netUp() (a file going up)
   and netMedia() (a picture coming down) each had an XMLHttpRequest of their
   own: their own copy of the deadline, and NO renewal -- so an hour after the
   launch a photograph would not go up and the timeline drew no pictures. Both
   go through netSend1() now, so what is asked of them is what is asked of
   every write above: refused for an old token, renewed once, sent again with
   the new one, and landed. The picture is also asked not to be a PRESS: it
   fills in behind the text, and counting it would dim the screen for every
   photograph on a timeline (www/net.js § NET_OUT). */
const eight = await pg.evaluate(async ({ w, s }) => {
  eval(w); eval(s); window.__reset();
  SESS = { at:'OLD', rt:'r', uid:'me', anon:false };
  var first = true, got = null;
  window.__X.refuse = function(r){
    if (/\/storage\/v1\/object\/post-media\//.test(r.u) && first){ first = false; return 401; }
    return 200;
  };
  netUp('p/1.jpg', 'AAECAwQ=', 'image/jpeg', function(p){ got = 'ok ' + p; },
                                             function(d, st){ got = 'bad ' + st; });
  await wait(150);
  var up = window.__of('/storage/v1/object/post-media/');
  var a = { got: got, tries: up.length, first: up[0] ? up[0].tok : '',
            last: up.length ? up[up.length - 1].tok : '', at: SESS && SESS.at,
            ct: up[0] ? up[0].ct : '', bytes: up[0] && up[0].body ? up[0].body.length : 0,
            to: up[0] ? up[0].to : null, wait: NET_WAIT };
  window.__reset();
  SESS = { at:'OLD2', rt:'r', uid:'me', anon:false };
  first = true;
  window.__X.refuse = function(r){
    if (/object\/authenticated\/post-media\//.test(r.u) && first){ first = false; return 401; }
    return 200;
  };
  var u = null, counted = -1;
  netPressed(function(){ netMedia('u/p/0.jpg', function(x){ u = x; }); counted = NET_OUT; });
  await wait(150);
  var pic = window.__of('object/authenticated/post-media/');
  a.pic = { drawn: !!u && u.indexOf('blob:') === 0, tries: pic.length,
            last: pic.length ? pic[pic.length - 1].tok : '', at: SESS && SESS.at,
            counted: counted, to: pic[0] ? pic[0].to : null };
  return a;
}, { w: WIRE, s: wait });

say(eight.got === 'ok p/1.jpg' && eight.tries === 2 && eight.first === 'Bearer OLD' &&
    eight.last === 'Bearer ' + eight.at,
    'a file an hour after the launch is refused, the token is renewed, and it goes ' +
    'again with the new one and lands: ' + eight.tries + ' tries, ' + eight.got);
say(eight.ct === 'image/jpeg' && eight.bytes === 5,
    'and it goes as the BYTES of the file with its own type, not as JSON: ' +
    JSON.stringify(eight.ct) + ', ' + eight.bytes + ' bytes');
say(typeof eight.to === 'number' && eight.to > 0 && eight.to === eight.wait,
    'and it carries the one deadline: timeout=' + JSON.stringify(eight.to) +
    ' NET_WAIT=' + JSON.stringify(eight.wait));
say(eight.pic.drawn && eight.pic.tries === 2 && eight.pic.last === 'Bearer ' + eight.pic.at &&
    eight.pic.to === eight.wait,
    'a picture an hour after the launch is renewed the same way and drawn: ' +
    eight.pic.tries + ' tries, drawn ' + eight.pic.drawn);
say(eight.pic.counted === 0,
    'and a picture filling in is not a press, even when one is under way — ' +
    'nothing to dim the screen for: ' + eight.pic.counted + ' counted');

/* ---- 9. and there is ONE way out, counted rather than listed -------------
   Every way a page can reach a server, looked for in every file under www/
   with the comments taken out. One, and it is in netSend1(). A second one
   written tomorrow -- for a new kind of file, a new service -- fails here the
   day it is written, before it has had the chance to be the one road the
   renewal does not reach. */
{
  const fs = await import('fs');
  const www = path.join(dir, '..', 'www');
  const hits = [];
  for (const f of fs.readdirSync(www).filter((n) => n.endsWith('.js'))) {
    const src = fs.readFileSync(path.join(www, f), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
    const re = /new\s+XMLHttpRequest\b|\bfetch\s*\(|\bsendBeacon\b|new\s+WebSocket\b|new\s+EventSource\b|\bimportScripts\b/g;
    let m;
    while ((m = re.exec(src))) {
      const line = src.slice(0, m.index).split('\n').length;
      const before = src.slice(0, m.index);
      const decl = [...before.matchAll(/function\s+(\w+)\s*\(/g)];
      const fn = decl.length ? decl[decl.length - 1][1] : '?';
      hits.push(f + ':' + line + ' ' + m[0] + ' in ' + fn);
    }
  }
  say(hits.length === 1 && /^net\.js:\d+ new XMLHttpRequest in netSend1$/.test(hits[0]),
      'every way out of www/ is one, and it is netSend1(): ' + JSON.stringify(hits));
}

await br.close();
console.log('');
if (bad.length){
  console.log('token FAILED (' + bad.length + ')');
  process.exit(1);
}
console.log('token: the hour runs out and the app is still open — every write ' +
            'renews and goes again, once, and the wire that carries it is one wire.');
