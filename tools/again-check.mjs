/* A language comes back on a phone that has never seen it.
   ---------------------------------------------------------------------
   「基本は全部サーバー管理」「アカウント消したら残るわけがない」 OWNER
   2026-08-26. The server is the record and the phone is the copy that works
   with no signal — and `netOut()` only drops the session, so on the SAME
   phone signing back in finds everything in localStorage and the claim looks
   true. On a new phone it was not: nothing in `www/` had ever read a
   `language` row back, so `LANGS` came up empty, `sid` was gone, and
   `netLangRow()` made a SECOND language on the server. The first one stayed
   there with nothing pointing at it.

   The same root, twice: `netLangSync()` read `langId` — the one language that
   happens to be open — so a second or third language never went up at all.
   There was nothing to come back.

   What is stubbed is `netSend()`, and only that: it is the one place every
   request in www/net.js goes through, so everything above it — netLangRow,
   netSlices, netSlicePut, the merge — runs for real against a server made of
   two arrays. A check that stubbed netSlices or netLangSync would be asking
   its own answer back (CLAUDE.md rule 12).

   Run: node tools/again-check.mjs                                        */
import { seed } from './fixture.mjs';
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

/* ---- a server made of two arrays, behind the one transport -------------- */
const SERVER = `
  window.__SRV = { lang:[], slice:[], n:0, down:false, sent:[], tried:[] };
  netSend = function(method, p, body, tok, ok, bad){
    var S = window.__SRV;
    /* A WIRE SAYS HOW MANY REQUESTS IT IS HOLDING, and this stands in for the
       wire. netOn()/netOff() are the app's own counter (www/net.js § NET_OUT)
       and are what tells 「答えを待っている」 from 「訊くものが無かった」 --
       ［再接続］ reads it to decide whether the mark turns. Calling them here
       is not a second rule: it is this stub playing the part it took over.
       The real one stamps the XMLHttpRequest, so anything with a place to put
       the stamp will do. */
    var wire = {};
    netOn(wire);
    var realOk = ok, realBad = bad;
    ok = function(v){ netOff(wire); realOk(v); };
    bad = function(d, st, m){ netOff(wire); realBad(d, st, m); };
    /* WHAT WAS ASKED, before it is decided whether it is answered. S.sent is
       written inside each route and so records only what got through -- which
       is the right list for 「did this arrive」 and the wrong one for 「did
       the app even try」. A save that is refused has to be seen to have gone
       out, or 「押した瞬間に出て行く」 cannot be told from 「never sent」. */
    S.tried.push(method + ' ' + p);
    if (S.down){ setTimeout(function(){ bad(null, 0, 'down'); }, 0); return; }
    /* The write that actually carries a person's work, refused on its own.
       It is not a contrived case: the language row is already known and the
       GET of the slices is cached or small, so the POST is the request most
       likely to be the one that does not make it. */
    if (S.downSlice && method === 'POST' && p.indexOf('/rest/v1/slice') === 0){
      setTimeout(function(){ bad(null, 0, 'down'); }, 0); return;
    }
    function answer(v){ setTimeout(function(){ ok(v); }, 0); }
    function arg(k){
      var m = new RegExp('[?&]' + k + '=eq\\\\.([^&]*)').exec(p);
      return m ? decodeURIComponent(m[1]) : '';
    }
    if (method === 'POST' && p.indexOf('/rest/v1/language') === 0){
      var id = 'srv' + (++S.n);
      S.lang.push({ id:id, owner:body.owner, name:body.name || '', published_at:null });
      S.sent.push('language:' + id);
      return answer([{ id:id }]);
    }
    if (method === 'PATCH' && p.indexOf('/rest/v1/language') === 0){
      var lid = arg('id'), j;
      for (j = 0; j < S.lang.length; j++) if (S.lang[j].id === lid)
        S.lang[j].published_at = body.published_at;
      return answer([]);
    }
    if (method === 'POST' && p.indexOf('/rest/v1/slice') === 0){
      var rows = (body instanceof Array) ? body : [body], k, r, f, hit;
      for (k = 0; k < rows.length; k++){
        r = rows[k]; hit = null;
        for (f = 0; f < S.slice.length; f++)
          if (S.slice[f].language === r.language && S.slice[f].kind === r.kind) hit = S.slice[f];
        if (hit){ hit.body = r.body; hit.no = r.no; }
        else S.slice.push({ language:r.language, kind:r.kind, body:r.body, no:r.no });
        S.sent.push('slice:' + r.language + ':' + r.kind);
      }
      return answer([]);
    }
    if (method === 'GET' && p.indexOf('/rest/v1/slice') === 0){
      var want = arg('language'), out = [], q;
      for (q = 0; q < S.slice.length; q++) if (S.slice[q].language === want)
        out.push({ kind:S.slice[q].kind, body:S.slice[q].body, no:S.slice[q].no });
      return answer(out);
    }
    if (method === 'GET' && p.indexOf('/rest/v1/language') === 0){
      /* language_read: your own, or anybody's that is published. This asks
         with owner=eq., which is the half a person asks about themselves. */
      var own = arg('owner'), o2 = [], z;
      for (z = 0; z < S.lang.length; z++) if (S.lang[z].owner === own)
        o2.push({ id:S.lang[z].id, owner:S.lang[z].owner, name:S.lang[z].name,
                  published_at:S.lang[z].published_at });
      return answer(o2);
    }
    return setTimeout(function(){ bad(null, 404, 'no route ' + method + ' ' + p); }, 0);
  };
  /* netSlicePut() used to open its own XMLHttpRequest, so it was a SECOND
     transport this stub could not see and had to be replaced here as well.
     On 2026-09-02 it moved onto netSend() -- it differed by one header and by
     being outside the token renewal -- so the stub above is now the only
     transport again, and nothing extra is needed. */
`;

/* ---- 1. two languages, one of them not open ----------------------------- */
const up = await pg.evaluate(async ({ s, srv }) => {
  eval('(' + s + ')()');
  SET.done = true;
  eval(srv);
  SESS = { at:'t', rt:'r', uid:'me', anon:false };
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }

  /* the one the fixture made is open; a second one beside it, written and
     then LEFT — which is the ordinary state of a person's other language */
  var first = langId;
  langName = 'Vaska'; save();
  var second = langMint(); langStore();
  var was = langId;
  langOpen(second);
  langName = 'Toko';
  WORDS = [{ hw:'sula', ph:['s','u','l','a'], mn:'star', mns:['star'], pos:'n', at:1 }];
  save();
  langOpen(was);
  /* AND BOTH OF THEM BELONG TO THE ACCOUNT THAT IS SIGNED IN HERE. A language
     with no `uid` belongs to nobody once SET.done is true (langOwned), so it
     is in no list, in no count, and -- what this file is about -- in nothing
     langMineIds() hands to netLangSync(). The fixture stamps its own with the
     uid IT signs in as; this check signs in as somebody else two dozen lines
     up, and langMint() is the bare mint rather than langNew(), which is what
     stamps on the real road. Both of those are why this is here rather than
     in the fixture. */
  for (var __i in LANGS)
    if (Object.prototype.hasOwnProperty.call(LANGS, __i)) LANGS[__i].uid = SESS.uid;
  langStore();
  /* and a language that is only READ, which must never go up */
  langSeenAdd('theirs-1', 'Shango');
  slWr(langKeyOf('theirs-1', 'letters'), '[{"id":"x"}]');

  await new Promise(function(f){ netLangSync(function(){ f(); }); });
  await wait(120);

  var S = window.__SRV, names = S.lang.map(function(r){ return r.name; }).sort();
  return {
    first: first, second: second,
    rows: S.lang.length, names: names,
    sids: [LANGS[first] && LANGS[first].sid, LANGS[second] && LANGS[second].sid],
    /* every slice that went up, by language */
    upFirst: S.slice.filter(function(r){ return r.language === (LANGS[first]||{}).sid; }).length,
    upSecond: S.slice.filter(function(r){ return r.language === (LANGS[second]||{}).sid; }).length,
    theirsSent: S.sent.filter(function(x){ return x.indexOf('theirs-1') >= 0; }).length,
    theirsRow: !!LANGS['theirs-1'] && LANGS['theirs-1'].mine === false,
    srv: JSON.stringify({ lang:S.lang, slice:S.slice })
  };
}, { s: seed.toString(), srv: SERVER });

console.log('');
say(up.rows === 2, 'both of a person’s languages are on the server, the open one ' +
    'and the one they are not looking at: ' + up.rows + ' rows (' + up.names.join(', ') + ')');
say(!!up.sids[0] && !!up.sids[1] && up.sids[0] !== up.sids[1],
    'and each carries the server’s id for it, so nothing makes a second row later: ' +
    JSON.stringify(up.sids));
say(up.upFirst > 0 && up.upSecond > 0,
    'with the slices of both: ' + up.upFirst + ' and ' + up.upSecond);
say(up.theirsRow && up.theirsSent === 0,
    'and a language that is only READ went nowhere — syMerge adds both sides, ' +
    'and one pass would put something into a language somebody else wrote (' +
    up.theirsSent + ' requests about it)');

/* ---- 2. a new phone: nothing in storage, the same person signs in ------- */
const back = await pg.evaluate(async ({ s, srv, saved }) => {
  /* the phone is replaced: every byte of localStorage is gone. The server is
     the only thing left, which is the whole claim. */
  localStorage.clear();
  return { srv: saved };
}, { s: seed.toString(), srv: SERVER, saved: up.srv });
await pg.reload();
await pg.waitForSelector('#splash', { state:'detached', timeout:20000 });

const came = await pg.evaluate(async ({ srv, saved }) => {
  eval(srv);
  var S = window.__SRV, keep = JSON.parse(saved);
  S.lang = keep.lang; S.slice = keep.slice;
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }

  var before = Object.keys(LANGS).length;
  /* signing in is netTook() -- the one place that knows a session arrived */
  netTook({ access_token:'t', refresh_token:'r', user:{ id:'me' } });
  await wait(400);
  var ids = Object.keys(LANGS), i, out = [];
  for (i = 0; i < ids.length; i++)
    out.push({ id:ids[i], name:LANGS[ids[i]].name, mine:LANGS[ids[i]].mine,
               words:(slRd(langKeyOf(ids[i], 'words')) || '').length });
  return { before: before, after: ids.length, langs: out };
}, { srv: SERVER, saved: up.srv });

const names = came.langs.map(l => l.name).sort().join(',');
say(names.indexOf('Vaska') >= 0 && names.indexOf('Toko') >= 0,
    'on a phone with an empty storage, signing in brings both back by name: ' +
    (names || 'nothing'));
say(came.langs.filter(l => l.words > 2).length >= 2,
    'and with what was in them, not just their names: ' +
    JSON.stringify(came.langs.map(l => l.name + ' ' + l.words + 'B')));
say(came.langs.every(l => l.mine === true),
    'and both are the person’s own');

/* ---- 3. it FILLS IN, and never wins ------------------------------------- */
const holds = await pg.evaluate(async ({ srv, saved }) => {
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }
  eval(srv);
  var S = window.__SRV, keep = JSON.parse(saved);
  S.lang = keep.lang; S.slice = keep.slice;
  /* this phone has a language already, and its words differ from the server's */
  /* A language the SERVER also has, and not the empty one this phone minted
     for itself at load -- the restore has nothing to write over that one, so
     pointing the claim at it makes the claim green whatever the code does.
     That is exactly what it was, until the diagnostics were printed. */
  var ids = Object.keys(LANGS), one = '', z0;
  for (z0 = 0; z0 < S.lang.length; z0++) if (LANGS[S.lang[z0].id]) one = S.lang[z0].id;
  /* This phone's copy of a language the SERVER also has, and it says something
     different. A restore that wins writes the server's over it; a restore that
     fills in leaves it. */
  slWr(langKeyOf(one, 'words'),
    JSON.stringify([{ hw:'ONPHONE', ph:['o'], mn:'here', mns:['here'], pos:'n', at:9 }]));
  var was = slRd(langKeyOf(one, 'words'));
  /* netLangBack() runs once per account per launch, so a second netTook()
     with the same uid returns at the door. Cleared here, or the two claims
     below are green because nothing ran -- which is what they were the first
     time this was written. */
  NET_BACK = '';
  netTook({ access_token:'t', refresh_token:'r', user:{ id:'me' } });
  await wait(400);
  var now = slRd(langKeyOf(one, 'words'));
  /* and a server that does not answer at all */
  S.down = true;
  NET_BACK = '';
  var langsWas = JSON.stringify(LANGS);
  var slicesWas = ids.map(function(i2){ return slRd(langKeyOf(i2, 'words')); }).join('|');
  netTook({ access_token:'t', refresh_token:'r', user:{ id:'me' } });
  await wait(400);
  S.down = false;
  return {
    srvWords: (function(){ var q, w=''; for(q=0;q<S.slice.length;q++)
        if(S.slice[q].language===one && S.slice[q].kind==='words') w=S.slice[q].body;
        return String(w).slice(0,40); })(),
    langsNow: Object.keys(LANGS).join(','),
    one: one,
    kept: (now || '').indexOf('ONPHONE') >= 0,
    keptWhat: String(now || '').slice(0, 60),
    ran: NET_BACK,
    downLangs: JSON.stringify(LANGS) === langsWas,
    downSlices: ids.map(function(i2){ return slRd(langKeyOf(i2, 'words')); }).join('|') === slicesWas
  };
}, { srv: SERVER, saved: up.srv });

say(holds.kept,
    'what is already on the phone is not written over by what is on the server — ' +
    'a restore fills in what is missing and stops (docs/DATA_SAFETY.md): the ' +
    'phone still says `' + holds.keptWhat + '`');
say(holds.downLangs && holds.downSlices,
    'and a server that does not answer changes nothing at all — 「the plan is ' +
    'unknown」 and 「this person has no data」 are not the same state');

/* ---- 4. AND NOTHING EVER SHRINKS -----------------------------------------
   The condition this whole piece of work is written under: 「この変更で
   localStorage からキーを一本も消さないこと」. The three ways a server says
   nothing are three different states and none of them is 「this person has no
   languages」 -- an empty array, a 500, and a connection that dies. All three
   have to leave the phone exactly as it was.

   Measured as bytes AND as a count of keys, because "the language is still in
   the index" is also true of one whose slices have been emptied. */
const safe = await pg.evaluate(async ({ srv, saved }) => {
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }
  eval(srv);
  var S = window.__SRV, keep = JSON.parse(saved), out = {};
  S.lang = keep.lang; S.slice = keep.slice;
  function snap(){
    var m = {}, i, k;
    for (i = 0; i < localStorage.length; i++){
      k = localStorage.key(i);
      m[k] = String(localStorage.getItem(k) || '').length;
    }
    return m;
  }
  function lost(was, now){
    var k, gone = [];
    for (k in was){
      if (!Object.prototype.hasOwnProperty.call(was, k)) continue;
      if (!(k in now)) { gone.push(k + ' GONE'); continue; }
      if (now[k] < was[k]) gone.push(k + ' ' + was[k] + '→' + now[k]);
    }
    return gone;
  }
  async function against(how){
    var was = snap(), keys = Object.keys(was).length;
    NET_BACK = '';
    if (how === 'empty'){ S.lang = []; S.slice = []; }
    if (how === 'down'){ S.down = true; }
    netTook({ access_token:'t', refresh_token:'r', user:{ id:'me' } });
    await new Promise(function(f){ netLangSync(function(){ f(); }); });
    await wait(300);
    S.down = false; S.lang = keep.lang; S.slice = keep.slice;
    var now = snap();
    return { lost: lost(was, now), keys: keys, keysNow: Object.keys(now).length };
  }
  out.empty = await against('empty');
  out.down  = await against('down');

  /* and twice over, which is the other way a merge goes wrong */
  var one = '', z;
  for (z = 0; z < S.lang.length; z++) if (LANGS[S.lang[z].id]) one = S.lang[z].id;
  function words(){
    try { return (JSON.parse(slRd(langKeyOf(one, 'words')) || '[]') || []).length; }
    catch (e) { return -1; }
  }
  await new Promise(function(f){ netLangSync(function(){ f(); }); });
  await wait(200);
  var n1 = words();
  await new Promise(function(f){ netLangSync(function(){ f(); }); });
  await wait(200);
  out.twice = [n1, words()];
  /* and a slice that came back SMALLER is refused rather than written. Driven
     by handing the merge a shorter body than the phone has -- the one shape
     the condition names, made to happen rather than reasoned about. */
  var big = JSON.stringify([{hw:'a'},{hw:'b'},{hw:'c'},{hw:'d'}]);
  slWr(langKeyOf(one, 'words'), big);
  var oldMerge = syMerge;
  syMerge = function(){ return JSON.stringify([{hw:'a'}]); };
  NET_SHRANK = [];
  await new Promise(function(f){ netLangSync(function(){ f(); }); });
  await wait(200);
  syMerge = oldMerge;
  out.shrankKept = slRd(langKeyOf(one, 'words')) === big;
  out.shrankSaid = NET_SHRANK.length > 0;
  return out;
}, { srv: SERVER, saved: up.srv });

say(safe.empty.lost.length === 0 && safe.empty.keysNow >= safe.empty.keys,
    'a server that answers with an EMPTY LIST takes nothing away — an empty ' +
    'answer is not 「this person has no languages」: ' + safe.empty.keys + ' keys ' +
    'before, ' + safe.empty.keysNow + ' after' +
    (safe.empty.lost.length ? ', LOST ' + safe.empty.lost.join(', ') : ''));
say(safe.down.lost.length === 0 && safe.down.keysNow >= safe.down.keys,
    'and a server that does not answer at all takes nothing away: ' +
    safe.down.keys + ' keys before, ' + safe.down.keysNow + ' after' +
    (safe.down.lost.length ? ', LOST ' + safe.down.lost.join(', ') : ''));
say(safe.twice[0] === safe.twice[1] && safe.twice[0] > 0,
    'and syncing twice in a row does not grow the dictionary — syMerge adds ' +
    'both sides, so a language that gains a word every launch is the other way ' +
    'this goes wrong: ' + safe.twice.join(' then '));

say(safe.shrankKept && safe.shrankSaid,
    'and a merge that comes back SMALLER than what is on the phone is skipped ' +
    'and said out loud, never written — 「同じキーを、今より少ない中身で書かない」: ' +
    (safe.shrankKept ? 'the phone kept its four words' : 'THE PHONE LOST WORDS') +
    ', ' + (safe.shrankSaid ? 'and it was recorded' : 'and nothing said so'));

/* ---- waiting is not empty, and a refusal is not an answer ----------------
   Two sentences the timeline used to say before the server had said anything.

   「snsで一瞬何も出ないとかあり得んやろ」「後お題も出てこない1秒待つけど」
   OWNER 2026-09-02. A phone with no local copy drew 「まだ何も無い」 while the
   first answer was still out -- a statement about the SERVER made before it
   answered -- and the day's sentence asked once, so a first ask that failed
   was the last one for that session.

   Nothing here is stubbed but the two answers themselves: what is under test
   is what the screen says while it has none, and what happens after a
   refusal. */
const W = await pg.evaluate(async () => {
  function wait(ms){ return new Promise(function (r){ setTimeout(r, ms); }); }
  const out = {};
  /* Past the door, or render() draws the onboarding and never reaches the
     timeline at all -- which is what this measured the first time.

     AND THE ACCOUNT HAS A NAME. appIs() answers 'door' for a session whose
     account has never been named (www/shell.js, 2026-09-03) -- that is the
     last step of the door and it is why a new Google account can no longer
     walk straight into the app. A phone with a timeline on it is past that,
     so this one is too. */
  SET.done = true;
  ME.name = 'Aya'; ME.handle = 'aya'; saveMe();
  POSTS = []; SNS_GOT = {}; snsTab = 'fo';
  window.route = 'feed'; NAV = [{ r:'feed' }]; render();
  out.markTurns = !!document.querySelector('#app .snswait .pullrule');
  out.saidNoneWaiting = document.querySelector('#app .empty .eb') !== null;
  /* An answer that came back EMPTY is still an answer, and now it may say so. */
  SNS_GOT['fo'] = 1; render();
  out.saysNoneAfter = document.querySelector('#app .empty .eb') !== null;
  out.markGone = !document.querySelector('#app .snswait');
  /* And the day's sentence, refused twice. */
  let asks = 0;
  window.netDay = function (ok){
    asks++;
    ok(asks < 3 ? null
                : { id:'p1', on_day:'2026-09-02', text:'the sea', says:{ en:'the sea' } });
  };
  DAY = null; dayPulling = false; dayWait = 20;
  dayPull();
  await wait(500);
  out.asks = asks;
  out.gotDay = !!(DAY && DAY.text);
  return out;
});
say(W.markTurns && !W.saidNoneWaiting,
    'a timeline with no answer yet turns the app own mark and claims nothing ' +
    'about what is on the server (' + (W.markTurns ? 'mark' : 'NO MARK') + ', ' +
    (W.saidNoneWaiting ? 'AND SAID EMPTY' : 'said nothing') + ')');
say(W.saysNoneAfter && W.markGone,
    'and an answer that came back empty is when it says so, with the mark gone');
say(W.asks === 3 && W.gotDay,
    'the day sentence asks again after a refusal instead of giving up for the ' +
    'session (' + W.asks + ' asks, ' + (W.gotDay ? 'got it' : 'NEVER GOT IT') + ')');

/* ---- and the three screens beside the timeline -------------------------
   「なんか全体的に前のが残ってたりするからちゃんとローディングさせられないの？」
   OWNER 2026-09-03.

   The timeline was made honest above and the screens either side of it were
   not: each of them drew NOTHING AT ALL where the answer was still out, and
   nothing at all is what those same screens draw when the answer came back
   with none in it. So 「空」 and 「まだ来ていない」 shared a branch on three
   more screens -- CLAUDE.md § Data, the same sentence the timeline needed.

   A phone that has never held this account's lists is in the second state
   EVERY time it signs in, which is why it is the state a new phone always
   sees and the one nothing was measuring.

   `netSend` is not stubbed here: what is under test is what the screen says
   while it has no answer, so the answer is simply withheld -- the flags the
   screens read (`snsHits`, `snsSavedGot`, `snsRecentGot`) are the answer
   arriving, and setting them by hand is the answer landing. Nothing else is
   replaced. */
const V = await pg.evaluate(() => {
  const out = {};
  function markOn(){ return !!document.querySelector('#app .snswait .pullrule'); }
  function noteOn(){ return !!document.querySelector('#app .note'); }
  SET.done = true;
  ME.name = 'Aya'; ME.handle = 'aya'; saveMe();

  /* THE SEARCH, with a word typed and the answer still out. */
  window.route = 'explore'; NAV = [{ r:'explore' }];
  snsQ = 'sea'; snsHits = null; render();
  out.findTurns = markOn();
  out.findSaidNone = noteOn();
  /* And the answer, come back with nobody and nothing in it. */
  snsHits = { q:'sea', who:[], posts:[] }; render();
  out.findSaysNone = noteOn();
  out.findMarkGone = !markOn();

  /* THE WORDS THIS ACCOUNT HAS TYPED, under an empty field. */
  snsQ = ''; snsHits = null; SET.recent = []; snsRecentGot = false; render();
  out.recentTurns = markOn();
  snsRecentGot = true; render();
  out.recentMarkGone = !markOn();

  /* THE WORDS IT HAS KEPT, on the screen that lists them. */
  window.route = 'filter'; NAV = [{ r:'filter' }];
  SET.saved = []; snsSavedGot = false; render();
  out.savedTurns = markOn();
  snsSavedGot = true; render();
  out.savedMarkGone = !markOn();
  return out;
});
say(V.findTurns && !V.findSaidNone,
    'a search with its answer still out turns the mark and does not say ' +
    'nothing was found (' + (V.findTurns ? 'mark' : 'NO MARK') + ', ' +
    (V.findSaidNone ? 'AND SAID NOTHING FOUND' : 'said nothing') + ')');
say(V.findSaysNone && V.findMarkGone,
    'and an answer that really came back empty is when it says so, mark gone');
say(V.recentTurns && V.recentMarkGone,
    'the words this account has typed turn the mark until the list has come ' +
    'back, and stop when it has (' + (V.recentTurns ? 'mark' : 'NO MARK') + ', ' +
    (V.recentMarkGone ? 'then gone' : 'AND KEPT TURNING') + ')');
say(V.savedTurns && V.savedMarkGone,
    'and so do the words it has kept (' + (V.savedTurns ? 'mark' : 'NO MARK') +
    ', ' + (V.savedMarkGone ? 'then gone' : 'AND KEPT TURNING') + ')');

/* ---- a word somebody deleted stays deleted -------------------------------
   docs/RISK.md item 4. This file already holds the other direction -- that
   syncing twice does not GROW the dictionary, and that a merge coming back
   smaller is refused -- and neither of those is this one. Nothing anywhere
   asked whether something the person removed is still removed afterwards.

   Measured before it was written: delete a word, sync once, and the word is
   back at the END of the list and has been written UP to the server as well,
   so the phone has now taught the server its own mistake.

   「消すも保存もそうだけど、そういったものが動く時はサーバーに行かないと。
   オフラインで作業できるのはオンラインに復帰した時にそれが最新データになる
   んだから」 OWNER 2026-09-04. */
/* THE PAGE IS RELOADED FIRST, and that is not tidiness. The scenario above
   replaces `syMerge` itself with a stub -- `function(){ return [{hw:'a'}] }`,
   to prove that a merge coming back smaller is refused -- and never puts the
   real one back. Every scenario after it therefore runs against that stub, in
   one page, in silence. Written without this reload, the claims below went red
   for the wrong reason and looked exactly like the bug they were written for.
   A fresh page is the only thing that gives them the real sync.js back. */
await pg.evaluate(() => localStorage.clear());
await pg.reload();
await pg.waitForSelector('#splash', { state:'detached', timeout:20000 });

const del = await pg.evaluate(async ({ s, srv }) => {
  eval('(' + s + ')()');
  SET.done = true;
  eval(srv);
  SESS = { at:'t', rt:'r', uid:'me', anon:false };
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }
  for (var i in LANGS)
    if (Object.prototype.hasOwnProperty.call(LANGS, i)) LANGS[i].uid = SESS.uid;
  langStore();
  /* On the disk before anything is sent. The seed fills the globals; a slice
     is what localStorage holds, and the sync reads it from there. */
  save(); saveLetters();

  /* 1. the dictionary goes up, so the server is holding it */
  await new Promise(function(f){ netLangSync(function(){ f(); }); });
  await wait(150);
  var S = window.__SRV, sid = (LANGS[langId] || {}).sid;
  function onServer(){
    var r = S.slice.filter(function(x){ return x.language === sid && x.kind === 'words'; })[0];
    try { return r ? JSON.parse(r.body).map(function(w){ return String(w.hw); }) : []; }
    catch (e) { return []; }
  }
  var hw = function(){ return WORDS.map(function(w){ return String(w.hw); }); };
  var out = { server0: onServer() };

  /* 2. somebody deletes one, the way the button does */
  out.gone = hw()[0];
  wDrop(out.gone); save();
  out.storedAfterDelete = JSON.parse(slRd(langKey('words')) || '[]')
    .map(function(w){ return String(w.hw); });
  out.afterDelete = hw();

  /* 3. and the app speaks to the server again */
  await new Promise(function(f){ netLangSync(function(){ f(); }); });
  await wait(180);
  out.afterSync = hw();
  out.server1 = onServer();

  /* 4. and once more -- "it comes back on the launch after" is the shape */
  await new Promise(function(f){ netLangSync(function(){ f(); }); });
  await wait(180);
  out.afterTwice = hw();
  out.server2 = onServer();
  return out;
}, { s: seed.toString(), srv: SERVER });

say(del.server0.indexOf(del.gone) >= 0,
    'the word was on the server before it was deleted, so this is about a ' +
    'deletion and not about a word that never went up: ' + JSON.stringify(del.gone));
say(del.afterDelete.indexOf(del.gone) < 0,
    'deleting it takes it out of the dictionary on the phone');
say(del.storedAfterDelete.indexOf(del.gone) < 0,
    'and out of storage, so what follows is about the sync and not about a ' +
    'delete that never landed: ' + JSON.stringify(del.storedAfterDelete));
say(del.afterSync.indexOf(del.gone) < 0,
    'AND IT IS STILL GONE after the app has spoken to the server: ' +
    JSON.stringify(del.afterSync));
say(del.server1.indexOf(del.gone) < 0,
    'and the SERVER was told -- deleting is a thing that goes up, not a thing ' +
    'that happens only here: ' + JSON.stringify(del.server1));
say(del.afterTwice.indexOf(del.gone) < 0,
    'and it does not come back on the launch after that one either');
say(del.afterSync.length === del.afterDelete.length,
    'and nothing else moved: ' + del.afterDelete.length + ' words before the ' +
    'sync, ' + del.afterSync.length + ' after');

/* ---- 保存を押した瞬間にサーバーへ行く ------------------------------------
   「オンラインは一本化ね？」「簡単よ」「保存としたらオンラインおしまい」
   OWNER 2026-09-04。

   **起動と扉の二回しか無かった。**`netLangSync()` を呼ぶのは `www/boot.js` と
   `www/onboard.js` だけで、その間にサーバーへ行く道は一本も無かった（数えて
   確認）。一時間書いて閉じた人の作ったものは、次に開くまでこの iPhone の中に
   しかない。

   ここが訊くのは四つ。**起動を一度も挟まずに**、押した保存が届くこと。
   動いた欄だけを訊いて、動いた欄だけを送ること ── 全部訊くと大きい言語で
   毎回 685 KB になる。動いていなければ何も送らないこと。そして署名が
   無ければ何も送らず、何も失わないこと。

   `netSend` の下の偽サーバーは上のものをそのまま使う。`netSaveUp` も
   `netSlices` も本物が走る。 */
const up2 = await pg.evaluate(async ({ s, srv }) => {
  eval('(' + s + ')()');
  SET.done = true;
  eval(srv);
  SESS = { at:'t', rt:'r', uid:'me2', anon:false };
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }
  const out = {};
  /* 待つのは NET_UPMS ＋ 往復のぶん。数はコードから読む ── ここに書くと
     片方だけ動いたときに黙って通る。 */
  const settle = () => wait(NET_UPMS + 400);

  var id = langId;
  LANGS[id].uid = 'me2'; LANGS[id].mine = true; langStore();
  langName = 'Save Now'; save();

  /* まず一度合わせて、両者が同じものを持っている所から始める。ここから先の
     送信だけを見たいので、記録を空にする。 */
  await new Promise(function(f){ netLangSync(f); });
  window.__SRV.sent = [];
  window.__SRV.asked = [];
  /* GET が何を訊いたかを見る。上の stub は kind の絞りを読まないので、
     絞れているかは「訊いた道」で見るしかない。 */
  var realSend = netSend;
  netSend = function(m, p, b, tk, ok, bd){
    if (m === 'GET' && p.indexOf('/rest/v1/slice') === 0) window.__SRV.asked.push(p);
    return realSend(m, p, b, tk, ok, bd);
  };

  /* 一. 単語を一つ足して保存する。起動はしない。扉も通らない。 */
  WORDS.push({ hw:'nyala', gl:'a word added after the launch' });
  save();
  out.sentAtOnce = window.__SRV.sent.slice();   /* 押した直後 ── まだ空のはず */
  await settle();
  out.sentAfter = window.__SRV.sent.slice();
  out.asked = window.__SRV.asked.slice();
  out.onServer = (function(){
    var S = window.__SRV, sid = LANGS[id].sid, i;
    for (i = 0; i < S.slice.length; i++)
      if (S.slice[i].language === sid && S.slice[i].kind === 'words')
        return S.slice[i].body.indexOf('nyala') >= 0;
    return false;
  })();

  /* 二. 何も動かしていない保存は、何も送らない。 */
  window.__SRV.sent = [];
  save();
  await settle();
  out.sentIdle = window.__SRV.sent.slice();

  /* 三. 一続きに打っても、送るのは一度。十回保存して一回。 */
  window.__SRV.sent = [];
  for (var n = 0; n < 10; n++){ WORDS.push({ hw:'burst' + n, gl:'x' }); save(); }
  await settle();
  out.sentBurst = window.__SRV.sent.slice();

  /* 四. 署名が無ければ何も送らない。そして何も失わない ── 言語はこの iPhone に
     そのまま在る。「電波が無いときはログインできない」はオーナーの決定だが、
     それは画面の話で、書いたものが消えてよいという意味ではない。 */
  window.__SRV.sent = [];
  var keep = SESS; SESS = null;
  WORDS.push({ hw:'offline', gl:'written with nobody signed in' });
  save();
  await settle();
  out.sentOut = window.__SRV.sent.slice();
  out.keptOut = (slRd(langKeyOf(id, 'words')) || '').indexOf('offline') >= 0;
  SESS = keep;
  netSend = realSend;
  return out;
}, { s: seed.toString(), srv: SERVER });

say(up2.sentAtOnce.length === 0 && up2.sentAfter.length > 0,
    '保存を押したらサーバーへ行く ── 起動も扉も通らずに（押した直後 ' +
    up2.sentAtOnce.length + ' 件、落ち着いてから ' + up2.sentAfter.length + ' 件）');
say(up2.onServer,
    'そして足した単語がサーバーの行に入っている');
say(up2.sentAfter.length === 1 && up2.sentAfter[0].indexOf(':words') > 0,
    '送るのは動いた欄だけ ── 十二本ではなく一本: ' + JSON.stringify(up2.sentAfter));
say(up2.asked.length === 1 && up2.asked[0].indexOf('kind=in.(words)') > 0,
    'そして訊くのも動いた欄だけ ── 全部降ろすと大きい言語で毎回 685 KB: ' +
    JSON.stringify(up2.asked));
say(up2.sentIdle.length === 0,
    '何も動いていない保存は、何も送らない: ' + JSON.stringify(up2.sentIdle));
say(up2.sentBurst.length === 1,
    '続けて十回保存しても送るのは一度 ── 一続きは一回（' +
    up2.sentBurst.length + ' 件）');
say(up2.sentOut.length === 0 && up2.keptOut,
    '署名が無ければ何も送らず、書いたものはこの iPhone に残る（送信 ' +
    up2.sentOut.length + ' 件、' + (up2.keptOut ? '残っている' : '**消えた**') + '）');

/* ---- 保存を押して通信が落ちたら、何も進まない ------------------------------
   「後通信なくても文字書いて保存できたけど、これって消えない？
     普通ボタン押したら通信できませんになるはずだよね？」 OWNER 2026-09-05
   「通信エラーなら進むわけねえだろ全部」 OWNER 2026-09-05。

   **上の四つは「届く」だけを訊いていて、届かなかったときを訊いていなかった。**
   それが 2026-09-05 に実機で出た形です ── 電波の無いところで文字を書いて保存を
   押すと、画面はレターの一覧へ進み、「保存しました」と出て、要求はその 1.2 秒
   後にはじめて出て行きました。保存は netSaveUp() の溜め（NET_UPMS）で、押した
   ボタンはその結果を一度も訊いていませんでした。

   **ここは押します。**geSave() を呼ぶのではなく、画面に立って、バーの保存を
   クリックします ── 訊いているのは「ボタンが何をするか」で、関数が何をするか
   ではないからです。関数を呼ぶ検査は、ボタンがその関数に繋がっていない日に
   緑のままになります。

   落ち方は二つあり、**二つ目が黙っていたほうです**:

     S.down       通信ごと落ちる。GET も POST も返らない
     S.downSlice  言語の欄は分かっていて、**その人の作ったものを運ぶ POST だけ**
                  が落ちる。netSlice1() の netSlicePut 失敗が done() を呼んで
                  いたので、五本落ちてもポップは一つも立ちませんでした

   そして三つ目に、**電波があるときは今までどおり進む**ことを訊きます。落ちた
   ときに止める直しは、止まったままにする直しと一行しか違わないので。 */
async function pressSave(how){
  const set = await pg.evaluate(async ({ s, srv, how }) => {
    eval('(' + s + ')()');
    SET.done = true;
    eval(srv);
    SESS = { at:'t', rt:'r', uid:'me3', anon:false };
    function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }
    var id = langId;
    LANGS[id].uid = 'me3'; LANGS[id].mine = true;
    /* この言語はもうサーバーに欄がある ── 一度でも保存した iPhone がそうです。
       欄が無い状態だけを見ると、落ちるのは POST /language になり、その人の
       作ったものを運ぶ POST は一度も試されません。 */
    LANGS[id].sid = 'srv-known'; langStore();
    var l = LETTERS[0];
    /* **文字の編集に入る道は editLetter() で、go('glyph', id) ではありません。**
       GE を作るのは editLetter()/editGlyph() のほうで、go() だけで入ると
       vGlyph() の「冷えたまま歩く検査のための」逃げ道 newGE('a') が立ちます
       ── 'a' という id の文字はこの言語に無いので ltSetStrokes() は先頭の
       `if(!l) return null` で返り、書いた線はどこにも載りません。それで下の
       inkKept は fixture が l1 に最初から持たせている別の線を読んでいて、
       線を取り上げる実装に変えても緑のままでした。 */
    editLetter(l.id); render();
    await wait(200);
    /* 指が一本置いていったのと同じもの。**アプリ自身が作る形で書く** ──
       線の点は 0..800 の格子の [x,y] の並びで（GPLACE も保存された線もそう）、
       {x:0.2,y:0.8} のような形はアプリが一度も作らず、画面にも何も描かれま
       せん。そして l1 が最初から持っている三角とは別の形にする ── 同じ形だと
       「書いた線が載った」と「元から載っていた」が見分けられません。 */
    GE.st = [{ pts:[[112,688],[400,400],[688,688],[400,112],[112,400]] }];
    render();
    await wait(50);
    window.__SRV.down = (how === 'down');
    window.__SRV.downSlice = (how === 'slice');
    window.__SRV.sent = []; window.__SRV.tried = [];
    return { drew: geDirty(), screen: JSON.stringify(NAV[NAV.length - 1]),
             /* 触っている文字と、そこに書いた線そのもの。長さではなく中身で
                見るので、元からある線と取り違えません。 */
             lid: GE.lid, ink: JSON.stringify(geInk(GE.st)),
             hasBtn: !!document.querySelector('[data-do="geSave"]') };
  }, { s: seed.toString(), srv: SERVER, how });
  if (!set.hasBtn) return Object.assign(set, { noButton:true });
  await pg.click('[data-do="geSave"]');
  /* 溜めの時間より長く待つ。ここで通るなら、押した瞬間に出て行っています ──
     NET_UPMS をコードから読むので、溜めが変わってもこの検査は付いていきます。 */
  await pg.waitForTimeout(await pg.evaluate(() => NET_UPMS + 900));
  return await pg.evaluate(({ lid, ink }) => ({
    screen: JSON.stringify(NAV[NAV.length - 1]),
    pop: popOn(),
    toast: String((document.querySelector('.toast, #toast') || {}).textContent || ''),
    /* 描いたものは、落ちても取り上げない。docs/DATA_SAFETY.md
       「人が作ったものは消さない」── 落ちた送信は、手を戻す理由ではない。
       **書いた線そのものと引き比べる。**「何か線が在る」では、この文字が最初
       から持っている線に当たって、取り上げる実装でも緑になります。 */
    inkKept: JSON.stringify((ltById(lid) || {}).st || []) === ink,
    inkNow: JSON.stringify((ltById(lid) || {}).st || []),
    ink: ink,
    sent: window.__SRV.sent.slice(),
    tried: window.__SRV.tried.slice()
  }), { lid: set.lid, ink: set.ink });
}

const sv = { down: await pressSave('down'), slice: await pressSave('slice'),
             up: await pressSave('up') };

say(sv.down.screen.indexOf('glyph') >= 0 && sv.down.pop && !sv.down.toast,
    '**通信ごと落ちたら、保存は何も進めない** ── 画面はレターのまま、ポップが ' +
    '立ち、「保存しました」は出ない（画面 ' + sv.down.screen + '、ポップ ' +
    (sv.down.pop ? 'あり' : '**なし**') + '、文 ' +
    (sv.down.toast ? '**「' + sv.down.toast + '」**' : 'なし') + '）');
say(sv.slice.screen.indexOf('glyph') >= 0 && sv.slice.pop && !sv.slice.toast,
    '**その人の作ったものを運ぶ POST だけが落ちても、同じ** ── これが黙って ' +
    'いたほうで、五本落ちてポップが零だった（画面 ' + sv.slice.screen +
    '、ポップ ' + (sv.slice.pop ? 'あり' : '**なし**') + '、文 ' +
    (sv.slice.toast ? '**「' + sv.slice.toast + '」**' : 'なし') + '）');
say(sv.down.inkKept && sv.slice.inkKept,
    'そして描いたものは取り上げない ── 落ちた送信は手を戻す理由ではない' +
    '（書いた線 ' + sv.down.ink + '。通信ごと ' +
    (sv.down.inkKept ? '同じものが在る' : '**' + sv.down.inkNow + '**') +
    '、POST だけ ' +
    (sv.slice.inkKept ? '同じものが在る' : '**' + sv.slice.inkNow + '**') + '）');
say(sv.down.tried.length > 0 && sv.slice.tried.length > 0,
    '押した瞬間に出て行く ── 溜め（NET_UPMS）を待たずに（通信ごと ' +
    sv.down.tried.length + ' 件、POST だけ ' + sv.slice.tried.length + ' 件）');
say(sv.up.screen.indexOf('glyph') < 0 && !sv.up.pop && !!sv.up.toast,
    'そして電波があれば今までどおり進む ── レターの一覧へ戻り、保存したと言う' +
    '（画面 ' + sv.up.screen + '、文 ' +
    (sv.up.toast ? '「' + sv.up.toast + '」' : '**なし**') + '）');

/* ---- 電波が無いとき、前に読み込んだ分が出る ------------------------------
   「Twitterとかは電波がないと開かないでしょ？」
   「前に読み込んだ分は出て欲しい。制作も眺めたい人はいるだろうし、」
   「スタンダードに合わせて作りたいから間違ってることあったら言って。」
   OWNER 2026-09-05。

   2026-09-04 にスライスを記憶へ移してから、**閉じたアプリは言語を一文字も
   持っていない。**電波が無ければ `netResume()` は返らず `netLangsDown()` も
   走らないので、開いた人は自分の言語が空になっているのを見る。

   訊くのは四つ。最初の一つは土台で、残りの三つのうち後ろ二つが「危ないほう」
   ── 写しが勝つこと、写しが出て行くことは、どちらも黙って起きる：

     一. サーバーから降りた分がディスクに写してある（土台）
     二. 電波を落としたまま閉じて開き直すと、前の言語が画面に出る
     三. 写しはサーバーの答えに一度も勝たない ── 答えが来たら上書きされる
     四. 写しはサーバーへ一度も出て行かない

   **電波が無いというのを本物でやる。**`netSend` は差し替えず、Supabase への
   要求そのものを `pg.route` で落とす。起動は本物の道を通って失敗する。 */
await pg.evaluate(() => localStorage.clear());
await pg.reload();
await pg.waitForSelector('#splash', { state:'detached', timeout:20000 });

/* 一段目 ── 署名して、言語をサーバーへ上げる。ここで写しが書かれる。
   名前と ID も書く： appIs() は名前の無いアカウントに扉を出すので、それが
   無いと二番目は「言語が出ない」ではなく「扉が出た」で赤くなる。 */
const seenUp = await pg.evaluate(async ({ s, srv }) => {
  eval('(' + s + ')()');
  SET.done = true; setKeep();
  eval(srv);
  SESS = { at:'t', rt:'r', uid:'me3', anon:false };
  ME.name = 'Aya'; ME.handle = 'aya'; saveMe();
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }
  var id = langId;
  LANGS[id].uid = 'me3'; LANGS[id].mine = true; langStore();
  langName = 'Kela';
  WORDS.push({ hw:'kelasu', gl:'a word that was on the screen before the signal went' });
  save();
  await new Promise(function(f){ netLangSync(function(){ f(); }); });
  await wait(200);
  netSave();
  var S = window.__SRV, got = 0, i, k;
  for (i = 0; i < localStorage.length; i++){
    k = localStorage.key(i);
    if (k && k.indexOf('.got') === k.length - 4) got++;
  }
  return { id:id, gotKeys:got, srv:JSON.stringify({ lang:S.lang, slice:S.slice }) };
}, { s: seed.toString(), srv: SERVER });

say(seenUp.gotKeys > 0,
    'サーバーから降りた分がディスクに写してある ── これが無ければ下の三つは ' +
    '「まだ何も無い」を測っているだけになる（' + seenUp.gotKeys + ' 本）');

/* 二段目 ── アプリを閉じて、電波の無いところで開く。localStorage は消さない。
   それが「閉じた」であって「機種変」ではない（機種変は上の 2 番）。 */
await pg.route('https://*.supabase.co/**', r => r.abort());
await pg.reload();
await pg.waitForSelector('#splash', { state:'detached', timeout:20000 });

const offline = await pg.evaluate(async () => {
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }
  await wait(400);
  window.route = 'words'; NAV = [{ r:'words' }]; render();
  var app = document.getElementById('app');
  return { words:WORDS.length, name:langName, signed:netSignedIn(),
           onScreen:(app ? app.textContent : '').indexOf('kelasu') >= 0 };
});

say(offline.words > 0 && offline.name === 'Kela',
    '**電波が無くても、前に読み込んだ言語が出る**（' + offline.words + ' 語、' +
    (offline.name || '名前なし') + '）');
say(offline.onScreen,
    'そして辞書の画面に本当に並んでいる ── 変数に入っているだけではない');

/* 三段目と四段目 ── 電波が戻る。
   **記憶の側を空にしてから訊く。**起動のあいだに走る移行と ltStart() は、
   何か直すことがあれば直したものを保存する ── それはこの iPhone が持っていて
   サーバーがまだ知らないものなので、上がって正しい。ここで見たいのはその手前、
   **移行が何もしなかった起動**、つまり写しだけがある状態で、写しがどう扱われる
   かである。だから手で空にする。 */
await pg.unroute('https://*.supabase.co/**');
const road = await pg.evaluate(async ({ srv, saved }) => {
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }
  eval(srv);
  var S = window.__SRV, keep = JSON.parse(saved), k, i, out = {};
  for (k in LSL) if (Object.prototype.hasOwnProperty.call(LSL, k)) delete LSL[k];
  var wk = langKeyOf(langId, 'words');
  out.screenSees = (slRd(wk) || '').indexOf('kelasu') >= 0;
  out.roadSees = slMine(wk) !== null;

  /* 四. サーバーがこの言語の欄を一本も持っていない所へ同期する。写しが上りの
     道から見えていれば、ここで写しがまるごと送られる。 */
  S.lang = keep.lang; S.slice = []; S.sent = [];
  SESS = { at:'t', rt:'r', uid:'me3', anon:false };
  await new Promise(function(f){ netLangSync(function(){ f(); }); });
  await wait(300);
  out.sent = S.sent.filter(function(x){ return x.indexOf('slice:') === 0; });

  /* 三. 別の iPhone がこの言語に一語足した、という形にして降ろす。 */
  for (k in LSL) if (Object.prototype.hasOwnProperty.call(LSL, k)) delete LSL[k];
  S.slice = keep.slice.map(function(r){ return { language:r.language, kind:r.kind, body:r.body, no:r.no }; });
  for (i = 0; i < S.slice.length; i++)
    if (S.slice[i].kind === 'words')
      S.slice[i].body = JSON.stringify(
        JSON.parse(S.slice[i].body).concat([{ hw:'newer', gl:'added on another phone' }]));
  await new Promise(function(f){ netLangsDown(function(){ f(); }); });
  await wait(300);
  out.words = WORDS.map(function(w){ return String(w.hw); });
  return out;
}, { srv: SERVER, saved: seenUp.srv });

say(road.screenSees && !road.roadSees,
    '写しは画面には見え、上りの道からは見えない ── slRd() と slMine() は別の ' +
    '問いで、それが仕組みの全部（画面 ' + (road.screenSees ? '見える' : '**見えない**') +
    '、上り ' + (road.roadSees ? '**見える**' : '見えない') + '）');
say(road.sent.length === 0,
    '**写しはサーバーへ一度も出て行かない** ── サーバーがこの言語の欄を一本も ' +
    '持っていなくても、写しは送られない（送信 ' + road.sent.length + ' 件' +
    (road.sent.length ? ': ' + JSON.stringify(road.sent) : '') + '）');
say(road.words.filter(w => w === 'newer').length === 1,
    '**写しはサーバーの答えに勝たない** ── 答えが来たらその上に書かれる: ' +
    JSON.stringify(road.words));

/* ---- 引き下ろしも、待ちも、落ちたときのポップも、一本 ---------------------
   「全部の画面でプルトゥーリフレッシュ入れないと動かないとこ出てくるぜ」
   「設定はいらんよ？」「通信のくるくるも全部20秒で良くない？」
   「再思考もポップ消えてくるくるみたいな。」
   「エラーになったらエラー用のポップ出して再更新とかおさせればいいやんそれ
     だけで1個作れば全部に使えるやん」 OWNER 2026-09-05。

   **画面を一つずつ押して回らないための節です。**四本あった引き下ろしは
   pullRun() 一本になったので、訊くべきは「三十七画面がそれぞれ正しいか」では
   なく「一本の道が正しいか」と「三十七画面がその道に繋がっているか」の二つ
   です。前者は下で実際に落として押します。後者は表を読みます ── PAGES が
   ルートの全部なので、そこに在って PULL_ON にも PULL_NOT にも無いものが零で
   あれば、忘れられた画面は在りません。

   そして PULL_NOT の中身も訊きます。除外の表は放っておくと育つもので、
   「設定はいらん」以外の一行が黙って入っていたら、それはこの決定ではなく
   誰かの判断です。 */
const one = await pg.evaluate(({ s, srv }) => {
  eval('(' + s + ')()');
  SET.done = true;
  eval(srv);
  SESS = { at:'t', rt:'r', uid:'me3', anon:false };
  var out = {}, r, miss = [], not = [], slipped = [];
  for (r in PAGES) if (Object.prototype.hasOwnProperty.call(PAGES, r)){
    if (PULL_NOT[r]){ not.push(r); if (PULL_ON[r]) slipped.push(r); }
    else if (!PULL_ON[r]) miss.push(r);
  }
  out.missing = miss;
  out.excluded = not.sort();
  /* 外したはずのものが引けてしまっていないか。表に名前が在ることと、その画面が
     本当に引かないことは別で、後者が決定のほう。 */
  out.slipped = slipped;
  out.routes = Object.keys(PAGES).length;
  /* 待ちは一つ。net.js が言い、store.js がそれを読む。 */
  out.wait = NET_WAIT;
  out.storeWait = STORE_WAIT;
  return out;
}, { s: seed.toString(), srv: SERVER });

say(one.missing.length === 0,
    '**引き下ろしはどの画面にも在る** ── PAGES の ' + one.routes +
    ' ルートに、表の無いものは零（' +
    (one.missing.length ? '**' + one.missing.join(' ') + '**' : 'なし') + '）');
say(one.excluded.length === 2 && one.excluded[0] === 'set' &&
    one.excluded[1] === 'settings' && one.slipped.length === 0,
    'そして外れているのは設定の二つだけで、その二つは本当に引かない ── ' +
    '「設定はいらんよ？」（' + one.excluded.join(' ') +
    (one.slipped.length ? '、**' + one.slipped.join(' ') + ' が引ける**' : '') + '）');
say(one.wait === 20000 && one.storeWait === one.wait,
    '**待ちは一箇所** ── NET_WAIT が ' + one.wait + '、App Store もそれを読む（' +
    one.storeWait + '）');

/* 落ちたときの道を、実際に落として押す。**画面ごとに書き分けられていない
   ことが訊きたいこと**なので、別々の三画面から落として、ポップが一つで
   あることと、［再接続］がその三つとも出し直すことを見ます。 */
const pop = await pg.evaluate(async ({ s, srv }) => {
  eval('(' + s + ')()');
  SET.done = true;
  eval(srv);
  SESS = { at:'t', rt:'r', uid:'me3', anon:false };
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }
  var id = langId;
  LANGS[id].uid = 'me3'; LANGS[id].mine = true;
  LANGS[id].sid = 'srv-known'; langStore();
  var out = {};
  window.__SRV.down = true;
  /* 三つの別の画面が、それぞれ自分のものを訊いて、落ちる。タイムライン、
     言語を作る画面、通知 ── 昔は三本の別々の関数でした。 */
  window.__SRV.tried = [];
  go('feed'); render();     pullGo('feed');
  go('letters'); render();  pullGo('letters');
  pullGo('notif');
  await wait(300);
  out.fellTried = window.__SRV.tried.length;
  out.pops = document.querySelectorAll('#pop.on').length;
  out.popUp = popOn();
  out.spinning = document.getElementById('netspin').className.indexOf('on') >= 0;
  /* ［再接続］。人が押すのと同じ道 ── ポップのボタンをクリックする。 */
  window.__SRV.tried = [];
  var y = document.querySelector('#pop [data-do="popYes"]');
  if (y) y.click();
  out.popAfterPress = popOn();
  out.spinAfterPress = document.getElementById('netspin').className.indexOf('on') >= 0;
  out.inTheAir = NET_OUT;
  await wait(300);
  /* 通らなかったので、またポップ。そしてマークは止まっている。 */
  out.againTried = window.__SRV.tried.length;
  out.popAgain = popOn();
  out.spinAgain = document.getElementById('netspin').className.indexOf('on') >= 0;
  /* 通れば、マークは自分で降りる。 */
  window.__SRV.down = false;
  var y2 = document.querySelector('#pop [data-do="popYes"]');
  if (y2) y2.click();
  await wait(600);
  out.spinAfterUp = document.getElementById('netspin').className.indexOf('on') >= 0;
  out.popAfterUp = popOn();
  return out;
}, { s: seed.toString(), srv: SERVER });

say(pop.fellTried > 0 && pop.pops === 1 && pop.popUp && !pop.spinning,
    '**三つの画面が別々に落ちて、ポップは一つ** ── 出て行った要求 ' +
    pop.fellTried + ' 件、立っているポップ ' + pop.pops + ' 個（' +
    (pop.popUp ? 'あり' : '**なし**') + '）、そのときマークは回っていない');
say(!pop.popAfterPress && pop.spinAfterPress && pop.inTheAir > 0,
    '**［再接続］でポップが消えて、マークが回る** ── 押した瞬間に ' +
    pop.inTheAir + ' 件が空へ出ている（ポップ ' +
    (pop.popAfterPress ? '**残っている**' : '消えた') + '、マーク ' +
    (pop.spinAfterPress ? '回っている' : '**止まっている**') + '）');
say(pop.againTried >= pop.fellTried && pop.popAgain && !pop.spinAgain,
    '**通らなければ、またポップ** ── ためた道が全部もう一度出て（' +
    pop.againTried + ' 件、落ちたときは ' + pop.fellTried + ' 件）、' +
    'ポップが戻り、マークは止まる');
say(!pop.spinAfterUp && !pop.popAfterUp,
    'そして通れば、マークは自分で降りる ── 待つものが空になったとき（マーク ' +
    (pop.spinAfterUp ? '**回ったまま**' : '止まった') + '、ポップ ' +
    (pop.popAfterUp ? '**あり**' : 'なし') + '）');

await br.close();
if (bad.length){
  console.log('\nagain: ' + bad.length + ' problem' + (bad.length > 1 ? 's' : '') + '.\n');
  process.exit(1);
}
console.log('\nagain: every language a person made is on the server, and a phone that has\n' +
            '       never seen them gets them all back by signing in — without one byte\n' +
            '       of what is already there being written over.');
