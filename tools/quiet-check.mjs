/* tools/quiet-check.mjs — the server hears a person, and nothing else.
   ---------------------------------------------------------------------------
   「サーバーが聞くのは、人が今つくった・押したもの、そのものだけ。起動・
   サインイン・他の答えの後ろで、端末の写しが勝手に上がる道は無い。そして
   上がるのは変わった所だけで、端末にあるものを丸ごと送らない。」
   (docs/scope/brief-r60-up.md; CLAUDE.md rule 22 「A copy that can travel
   back is a copy that can win」; OWNER 2026-09-05 「保存するタイミングで
   エラーが起きるなら、保存されない」「なら失敗して残るにするべき」.)

   THE SURFACE IS COUNTED, NOT LISTED. Every request this app makes leaves
   through XMLHttpRequest (www/net.js § the wire, netUp(), netMedia()), so the
   wire is what is faked here, and a road added tomorrow -- a new function, a
   third XMLHttpRequest -- is on it the day it is added. Nothing here names a
   function in www/ that writes.

   WHAT IS A WRITE IS THE SERVER'S ANSWER, NOT THIS FILE'S. A GET reads. A
   POST to /rest/v1/rpc/<f> reads when supabase/schema.sql declares <f>
   `stable` or `immutable` -- Postgres refuses a write inside one -- and writes
   otherwise, which is the side a function nobody marked falls to: a wrong
   answer here is a red run, never a green one. Everything else that is not a
   GET writes, except two things that are not anybody's data:

     /auth/v1/*                 the door -- www/net.js § netDoor, the session
                                itself being renewed or made
     /functions/v1/verify-plan  the plan, asked at a launch and at a door --
                                「段は起動とサインインで訊く」 OWNER 2026-09-11.
                                What it carries is what Apple signed (`jws`)
                                and nothing this phone holds; the run checks
                                that too.

   THE CLAIMS.
     1. A launch nobody touches writes nothing -- with a phone holding every
        kind of copy that can disagree with the server: the picture of a
        language that has lost a word since, the disk an older version left,
        a photograph the account has replaced, settings another phone changed,
        a post that never went, a draft from before there was a server.
     2. And the server holds after it exactly what it held before.
     3. A person adding one word sends the one slice that moved.
     4. Opening another language sends nothing.
     5. Signing in and pressing nothing sends nothing, and the account's
        profile and parked settings are what this phone then holds.
     6. Changing one setting sends that one setting.
     7. A copy on the disk is filed under whoever wrote it, not whoever
        launched.

   WHAT IT DOES NOT HOLD, said so silence is not read as a check:
     - The door. netTook() sends the walk's language as a session ARRIVES
       and that is the one exception CLAUDE.md names; acct-check holds it.
     - A language whose `language.name` column is empty has it filled, on the
       launch, from the `lang` slice the server already holds (netLangsWalk →
       netLangNamePut). Measured 2026-09-23: one PATCH. It is the server's
       own name moved from one of its places to the other, not a copy winning
       -- and the place for a move like that is the server (one UPDATE in
       supabase/schema.sql), which is not this branch's to write. The phone
       here has every column filled, so it is not exercised.
       docs/scope/r60-up.md § B3.

   Run: node tools/quiet-check.mjs        (npm run quiet)                      */
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { chromium, LAUNCH } from './browser.mjs';
const dir = path.dirname(fileURLToPath(import.meta.url));
const INDEX = 'file://' + path.join(dir, '..', 'www', 'index.html');

const bad = [];
function say(ok, line){ console.log('  ' + (ok ? 'ok      ' : 'FAILED  ') + line); if (!ok) bad.push(line); }

/* ---- which rpc reads, asked of the schema -------------------------------- */
const SQL = fs.readFileSync(path.join(dir, '..', 'supabase', 'schema.sql'), 'utf8');
const READS = {};
let nRead = 0, nWrite = 0;
{
  const re = /create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?(\w+)\s*\(([\s\S]*?)\$\$[\s\S]*?\$\$([^;]*);/gi;
  let m;
  while ((m = re.exec(SQL))) {
    const r = /\b(stable|immutable)\b/i.test(m[2] + ' ' + m[3]);
    READS[m[1]] = r;
    if (r) nRead++; else nWrite++;
  }
}
function writes(m, u){
  const p = u.replace(/^[a-z]+:\/\/[^/]*/, '').split('?')[0];
  if (m === 'GET') return false;
  if (p.indexOf('/auth/v1/') === 0) return false;
  if (p === '/functions/v1/verify-plan') return false;
  const rpc = /^\/rest\/v1\/rpc\/(\w+)$/.exec(p);
  if (rpc) return !READS[rpc[1]];
  return true;
}

/* ---- a server that remembers ------------------------------------------- */
function wire(cfg){
  var S = JSON.parse(JSON.stringify(cfg.srv)), log = [], out = 0;
  window.__Q = { log:log, out:function(){ return out; }, srv:function(){ return S; } };
  var b64 = function(o){
    return btoa(unescape(encodeURIComponent(JSON.stringify(o))))
      .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  };
  var TOK = 'h.' + b64({ sub:'u', email:'aya@example.com', app_metadata:{ provider:'email' } }) + '.s';
  window.__TOK = TOK;
  try {
    var d = cfg.disk, k;
    if (!cfg.out)
      localStorage.setItem('lingua.sess', JSON.stringify({ at:TOK, rt:'r', uid:'u', anon:false }));
    for (k in d) if (Object.prototype.hasOwnProperty.call(d, k)) localStorage.setItem(k, d[k]);
  } catch (e) {}
  function qs(u, k){ var m = new RegExp('[?&]' + k + '=([^&]*)').exec(u); return m ? decodeURIComponent(m[1]) : ''; }
  function asked(v){
    var m = /^in\.\((.*)\)$/.exec(v);
    if (m) return m[1] ? m[1].split(',').map(decodeURIComponent) : [];
    if (v.indexOf('eq.') === 0) return [decodeURIComponent(v.slice(3))];
    return [];
  }
  function pick(row, sel){
    if (!sel || sel === '*') return row;
    var o = {}, c = sel.split(','), i;
    for (i = 0; i < c.length; i++) o[c[i]] = row[c[i]];
    return o;
  }
  function answer(m, u, body){
    var p = u.replace(/^[a-z]+:\/\/[^/]*/, '').split('?')[0], rows, i, k, bag;
    if (p === '/auth/v1/token') return { access_token:TOK, refresh_token:'r', user:{ id:'u' } };
    if (p === '/functions/v1/verify-plan') return { plan:'free' };
    if (p === '/rest/v1/profile' || p === '/rest/v1/profile_seen'){
      if (m === 'PATCH'){ for (k in body) S.profile[k] = body[k]; return [S.profile]; }
      if (m === 'GET') return [pick(S.profile, qs(u, 'select'))];
      return [S.profile];
    }
    if (p === '/rest/v1/language'){
      if (m === 'GET'){
        rows = [];
        for (i = 0; i < S.lang.length; i++){
          if (qs(u, 'owner') && asked(qs(u, 'owner')).indexOf(S.lang[i].owner) < 0) continue;
          if (qs(u, 'id') && asked(qs(u, 'id')).indexOf(S.lang[i].id) < 0) continue;
          rows.push(pick(S.lang[i], qs(u, 'select')));
        }
        return rows;
      }
      return [];
    }
    if (p === '/rest/v1/slice'){
      if (m === 'POST'){
        S.slice[body.language] = S.slice[body.language] || {};
        S.slice[body.language][body.kind] = { kind:body.kind, body:String(body.body||''), no:body.no, at:body.at };
        return [];
      }
      bag = S.slice[asked(qs(u, 'language'))[0] || ''] || {};
      var kinds = asked(qs(u, 'kind')), cols = (qs(u, 'select') || 'kind,body,no,at').split(',');
      rows = [];
      for (k in bag) if (Object.prototype.hasOwnProperty.call(bag, k)){
        if (kinds.length && kinds.indexOf(k) < 0) continue;
        var r = {}, c;
        for (c = 0; c < cols.length; c++) r[cols[c]] = bag[k][cols[c]];
        rows.push(r);
      }
      return rows;
    }
    if (p === '/rest/v1/draft') return m === 'GET' ? S.draft : [];
    if (p === '/rest/v1/saved_search') return m === 'GET' ? S.saved : [];
    if (p.indexOf('/storage/v1/') === 0) return { Key:'ok' };
    return m === 'GET' ? [] : (p.indexOf('/rest/v1/rpc/') === 0 ? [] : [{ id:'x' }]);
  }
  function Fake(){ this.readyState = 0; this.status = 0; this.responseText = ''; this.response = null; }
  Fake.prototype.open = function(m, u){ this.__m = m; this.__u = String(u || ''); };
  Fake.prototype.setRequestHeader = function(){};
  Fake.prototype.abort = function(){};
  Fake.prototype.getResponseHeader = function(){ return null; };
  Fake.prototype.send = function(d){
    var self = this, parsed = null;
    try { parsed = typeof d === 'string' ? JSON.parse(d) : null; } catch (e) {}
    log.push({ m:self.__m, u:self.__u, body:parsed });
    out++;
    setTimeout(function(){
      out--;
      self.readyState = 4; self.status = 200;
      try { self.responseText = JSON.stringify(answer(self.__m, self.__u, parsed)); }
      catch (e) { self.responseText = 'null'; }
      if (self.onreadystatechange) self.onreadystatechange();
    }, 2);
  };
  window.XMLHttpRequest = Fake;
}

/* Nothing on the wire, and nothing started, for long enough that the save
   road's own wait (NET_UPMS, 1.2s) has run out twice. */
async function quiet(pg){
  let idle = 0, n = -1;
  for (let i = 0; i < 300; i++){
    const s = await pg.evaluate(() => [window.__Q.out(), window.__Q.log.length]);
    if (s[0] === 0 && s[1] === n) idle++; else idle = 0;
    n = s[1];
    if (idle >= 30) return;
    await new Promise(r => setTimeout(r, 100));
  }
}

/* ---- the phone and the server, disagreeing about everything ------------- */
function W(hw){ return { hw:hw, ph:hw.split(''), mn:hw, mns:[hw], pos:'n', at:1 }; }
/* what the server has -- and `mi` is a word somebody emptied the sounds of,
   which the launch must leave empty (no guess written, r73 § 2-8) */
const NOW = JSON.stringify([W('ka'), Object.assign(W('mi'), { ph:[] })]);
const PIC_OLD = 'data:image/jpeg;base64,T0xE';          /* this phone's photograph */
const PIC_NEW = 'data:image/jpeg;base64,TkVX';          /* the account's, from another phone */
const SRV = {
  profile:{ id:'u', handle:'aya', display:'Aya', bio:'hello', link:'', loc:'',
            av:{ pic:PIC_NEW }, prefs:{ theme:'light' }, banned_at:null },
  lang:[ { id:'L-1', owner:'u', name:'Shango', published_at:null, wsys:'alpha', created_at:'2026-01-01' },
         { id:'L-2', owner:'u', name:'Vethi',  published_at:null, wsys:'alpha', created_at:'2026-02-01' } ],
  slice:{
    'L-1':{ words: { kind:'words',  body:NOW,  no:3, at:'A1' },
            lines: { kind:'lines',  body:'[]', no:1, at:'A2' },
            script:{ kind:'script', body:JSON.stringify({ g:{}, extra:[] }), no:1, at:'A3' } },
    'L-2':{ words: { kind:'words',  body:JSON.stringify([W('ta')]), no:2, at:'B1' } } },
  draft:[],
  saved:[ { q:'kano' } ]
};
const DISK = {
  /* a starred search the account has since changed on another phone -- the
     answer is written with save() on this phone before 2026-09-23, which
     wrote the picture of the dictionary as this phone's own (r63-audit 0-1) */
  /* ...and what the language is for, from before it moved into the language
     (migrateWorld): moved when the language arrives, not lost to a save the
     picture refused (r69-misc 申し送り 1) */
  'lingua.set':   JSON.stringify({ done:true, theme:'dark', saved:['tir'], savedUp:true,
                                   world:{ where:'the old coast' } }),
  'lingua.langs': JSON.stringify({ 'L-1':{}, 'L-2':{} }),
  'lingua.cur':   'L-1',
  /* the picture of L-1, from before `zo` was deleted on another phone -- and
     `zo` with no sounds yet, which is what migratePh() fills in, so the launch's own
     migrations have something to save */
  'lingua.L-1.words.got': JSON.stringify([W('ka'), W('mi'), { hw:'zo', ph:'', mn:'zo', pos:'n', at:1 }]),
  'lingua.L-1.owner.got': 'u',
  /* what a version from before 2026-09-04 left of L-2 */
  'lingua.L-2.words':     JSON.stringify([W('ta'), W('zo')]),
  'lingua.L-2.words.was': JSON.stringify([W('ta'), W('zo')]),
  'lingua.me': JSON.stringify({ name:'Aya', handle:'aya', bio:'hello', pic:PIC_OLD,
                                avSent:JSON.stringify({ pic:'data:image/jpeg;base64,QU5DSUVOVA' }),
                                uid:'u' }),
  /* an unsent post, and one kept to yourself from before those went up
     (2026-09-23): both go at the door and a launch sends neither */
  'lingua.posts':  JSON.stringify([{ id:'p-local', mine:true, at:1, ln:'ka', mn:'ka' },
                                   { id:'p-kept',  mine:true, at:2, ln:'mi', mn:'mi', pv:1 }]),
  'lingua.drafts': JSON.stringify([{ id:'d-local', at:1, ln:'mi', mn:'mi' }])
};

const br = await chromium.launch(LAUNCH);
const pg = await br.newPage({ viewport:{ width:390, height:844 } });
const ERR = [];
pg.on('pageerror', e => ERR.push(String((e && e.message) || e)));
await pg.route('https://fonts.googleapis.com/**', r => r.fulfill({ status:200, contentType:'text/css', body:'' }));
await pg.route('https://fonts.gstatic.com/**', r => r.abort());
await pg.addInitScript(wire, { srv:SRV, disk:DISK });
await pg.goto(INDEX);
await pg.waitForSelector('#splash', { state:'detached', timeout:20000 });
await quiet(pg);

console.log('what writes is the server\'s answer: ' + nRead + ' functions read, ' + nWrite +
            ' write (supabase/schema.sql)');

/* ---- 1 and 2. a launch nobody touches ----------------------------------- */
const launch = await pg.evaluate(() => window.__Q.log.map(r => ({ m:r.m, u:r.u, body:r.body })));
const wrote = launch.filter(r => writes(r.m, r.u));
console.log('a launch nobody touched: ' + launch.length + ' requests, ' + wrote.length + ' of them writes');
for (const r of wrote)
  console.log('          ' + r.m + ' ' + r.u.replace(/^[a-z]+:\/\/[^/]*/, '').slice(0, 70) +
              (r.body && r.body.kind ? '  (' + r.body.kind + ')' : ''));
say(wrote.length === 0, '1 a launch nobody touched writes nothing');
const plan = launch.filter(r => /verify-plan/.test(r.u));
say(plan.every(r => r.body && Object.keys(r.body).join() === 'jws'),
    '1 what the plan question carries is what Apple signed and nothing else');

const after = await pg.evaluate(() => JSON.stringify(window.__Q.srv()));
say(after === JSON.stringify(SRV), '2 the server holds exactly what it held before the launch');

const seen = await pg.evaluate(() => ({ pic:ME.pic, theme:SET.theme,
  words:WORDS.map(function(w){ return w.hw; }).join(',') }));
say(seen.pic === PIC_NEW, '2 the photograph on screen is the account\'s, not the one this phone had' +
    (seen.pic === PIC_NEW ? '' : ' -- ' + String(seen.pic).slice(0, 32)));
say(seen.words === 'ka,mi', '2 the language on screen is the server\'s -- ' + seen.words);
const emptied = await pg.evaluate(() => {
  var w = WORDS.filter(function(x){ return x.hw === 'mi'; })[0];
  return w ? JSON.stringify(w.ph) : 'no word';
});
say(emptied === '[]', '2 and a word whose sounds somebody emptied is still empty -- no guess written back -- ' + emptied);
const moved = await pg.evaluate(() => ({ where:WLD.where, mark:!!SET.wldMoved }));
say(moved.where === 'the old coast' && moved.mark,
    '2 and the launch\'s migrations land when the language does -- ' + JSON.stringify(moved));

/* What went out as writes while `fn` ran and the wire went quiet again. */
async function writesDuring(fn, arg){
  await pg.evaluate(() => { window.__Q.log.length = 0; });
  await pg.evaluate(fn, arg);
  await quiet(pg);
  const log = await pg.evaluate(() => window.__Q.log.map(r => ({ m:r.m, u:r.u, body:r.body })));
  return log.filter(r => writes(r.m, r.u));
}
function named(ws){
  return ws.map(r => r.m + ' ' + r.u.replace(/^[a-z]+:\/\/[^/]*/, '').split('?')[0] +
                     (r.body && r.body.kind ? ' (' + r.body.kind + ')' : '')).join(', ');
}

/* ---- 4. a person opens another language ---------------------------------
   langOpen() writes the one it leaves and works over the one it opens -- the
   free alphabet's slots, the keyboard's migration, ids for an old board. None
   of that is somebody changing their language (r63-audit 0-2). */
{
  const w = await writesDuring(() => { langOpen('L-2'); });
  say(w.length === 0, '4 opening another language sends nothing' + (w.length ? ' -- ' + named(w) : ''));
  await pg.evaluate(() => { langOpen('L-1'); });
  await quiet(pg);
}

/* ---- 3. a person adds one word ------------------------------------------ */
await pg.evaluate(() => { window.__Q.log.length = 0; WORDS.push({ hw:'lo', ph:['l','o'], mn:'lo', mns:['lo'], pos:'n', at:2 }); save(); });
await quiet(pg);
const one = await pg.evaluate(() => window.__Q.log.map(r => ({ m:r.m, u:r.u, body:r.body })));
const up = one.filter(r => writes(r.m, r.u));
const kinds = up.map(r => (r.body && r.body.kind) || r.u.replace(/^[a-z]+:\/\/[^/]*/, '').split('?')[0]);
console.log('one word added: ' + kinds.join(', '));
say(kinds.join() === 'words', '3 one word added sends the words slice and nothing else');

/* ---- 5. somebody signs in, and presses nothing after ----------------------
   The door is the one place the phone sends what it made before there was an
   account (netTook) -- and a phone that made nothing sends nothing. What the
   door DOES do is put the account's profile on ME, whole: a copy this phone
   adopted from nobody (meFor) does not keep its own photograph and line
   about itself (r63-audit A1 漏れ 3, r61-face 止めたこと 1). */
{
  const pg2 = await br.newPage({ viewport:{ width:390, height:844 } });
  pg2.on('pageerror', e => ERR.push(String((e && e.message) || e)));
  await pg2.route('https://fonts.googleapis.com/**', r => r.fulfill({ status:200, contentType:'text/css', body:'' }));
  await pg2.route('https://fonts.gstatic.com/**', r => r.abort());
  await pg2.addInitScript(wire, { srv:SRV, out:true, disk:{
    'lingua.me': JSON.stringify({ name:'', handle:'', bio:'an old line', pic:PIC_OLD }),
    /* settings that name nobody (an account was deleted on this phone), and
       what this account parked here the last time it left (r63-audit L1) */
    'lingua.set':   JSON.stringify({ done:true }),
    'lingua.set.u': JSON.stringify({ notAt:99, savedUp:true })
  } });
  await pg2.goto(INDEX);
  await pg2.waitForSelector('#splash', { state:'detached', timeout:20000 });
  await quiet(pg2);
  await pg2.evaluate(() => { window.__Q.log.length = 0;
    netTook({ access_token:window.__TOK, refresh_token:'r', user:{ id:'u' } });
    netMyProfile(function(){}, function(){}); });
  await quiet(pg2);
  const door = await pg2.evaluate(() => window.__Q.log.map(r => ({ m:r.m, u:r.u, body:r.body })));
  const dw = door.filter(r => writes(r.m, r.u));
  say(dw.length === 0, '5 a sign-in nobody presses anything after writes nothing' +
      (dw.length ? ' -- ' + named(dw) : ''));
  const me = await pg2.evaluate(() => ({ bio:ME.bio, pic:ME.pic }));
  say(me.bio === 'hello' && me.pic === PIC_NEW, '5 and the profile on this phone is the account\'s -- bio ' +
      JSON.stringify(me.bio) + ', photograph ' + (me.pic === PIC_NEW ? 'the account\'s' : String(me.pic).slice(0, 30)));
  const notAt = await pg2.evaluate(() => SET.notAt);
  say(notAt === 99, '5 and what this account parked on this phone is its settings again -- notAt ' +
      JSON.stringify(notAt));
  await pg2.close();
}

/* ---- 7. what is on the disk is filed under whoever wrote it ----------------
   A launch as `u` on a phone whose copies were written under somebody else:
   their posts are parked under their name and are not `u`'s (r63-audit L3).
   Nothing is deleted -- the park is where signing back in finds them. */
{
  const pg3 = await br.newPage({ viewport:{ width:390, height:844 } });
  pg3.on('pageerror', e => ERR.push(String((e && e.message) || e)));
  await pg3.route('https://fonts.googleapis.com/**', r => r.fulfill({ status:200, contentType:'text/css', body:'' }));
  await pg3.route('https://fonts.gstatic.com/**', r => r.abort());
  await pg3.addInitScript(wire, { srv:SRV, disk:{
    'lingua.set':   JSON.stringify({ done:true, acct:'other' }),
    'lingua.posts': JSON.stringify([{ id:'p-other', mine:true, at:1, ln:'theirs', mn:'theirs', sid:'s-other' }])
  } });
  await pg3.goto(INDEX);
  await pg3.waitForSelector('#splash', { state:'detached', timeout:20000 });
  await quiet(pg3);
  const r7 = await pg3.evaluate(() => ({
    here: POSTS.filter(function(p){ return p.id === 'p-other'; }).length,
    parked: String(localStorage.getItem('lingua.posts.other') || '').indexOf('p-other') >= 0 }));
  say(r7.here === 0 && r7.parked, '7 somebody else\'s copy is filed under them, not handed to whoever launched -- ' +
      'on screen ' + r7.here + ', parked ' + r7.parked);
  await pg3.close();
}

/* ---- 6. a person changes one setting -------------------------------------
   `prefs` is one column, and a PATCH of it replaced every setting the account
   has with this phone's (r63-audit SQ1・L2). What goes up is the one that
   moved, through prefs_put(), which lays it over what is there. */
{
  const w = await writesDuring(() => { SET.theme = (SET.theme === 'dark') ? 'light' : 'dark'; netPrefsPut(); });
  const one = w.length === 1 && /\/rpc\/prefs_put$/.test(w[0].u.split('?')[0]) &&
              w[0].body && w[0].body.p && Object.keys(w[0].body.p).join() === 'theme';
  say(one, '6 one setting changed sends that one setting -- ' +
      (w.length ? w.map(r => r.u.replace(/^[a-z]+:\/\/[^/]*/, '') + ' ' + JSON.stringify(r.body)).join(', ') : 'nothing'));
}
if (ERR.length) say(false, 'the page threw: ' + ERR.join(' | '));
await br.close();
console.log(bad.length ? '\nquiet-check: ' + bad.length + ' FAILED' : '\nquiet-check: ok');
process.exit(bad.length ? 1 : 0);
