/* tools/load-check.mjs — what is read, and when.
   ---------------------------------------------------------------------------
   「開いた時は通知とタイムラインだけでしょ、そのページに進むときに読み込む
   べきなぜ一括なの？そこも直せ」「ダウンロードってそれが普通じゃないの？」
   「ダウンロードは普通⭕️のメーターだろ」 OWNER 2026-09-23
   (docs/FEATURE_RULES.md § 2026-09-23 読むのは開いた画面の分だけ).

   THE SENTENCE IT HOLDS: 読む時は画面が決める ── a screen's reads are asked
   by the one door onto it (www/shell.js § navLand, www/sns.js § PAGE_READS),
   with a cap and a way to the next page; the launch asks what the two launch
   pages read (PAGE_OPEN) and the screen the app opens on; a view draws and
   reads nothing; somebody else's language is read a chapter at a time, when
   ↓ is pressed.

   THE SURFACE IS COUNTED, NOT LISTED. The wire is faked (every request leaves
   through XMLHttpRequest -- www/net.js § the wire, netUp(), netMedia()), the
   routes are asked of the page (`PAGES`), the views are every global called
   v + a capital, and the source is read for the two session questions. A
   route, a view or a read added tomorrow is counted tomorrow.

   THE CLAIMS.
     1. What a launch reads is the owner's list, all of it and nothing past it:
        「開いた時に必要なものは読む」 -- the notices, the timeline, today's
        prompt, the plan, the theme and the interface language (OWNER
        2026-09-24, OPEN_READS below). The timeline and the notices are the launch
        pages (`PAGE_OPEN`, today's prompt is the timeline's own row); the plan
        is `verify-plan` and the theme and the language are this account's
        `profile` row. Nothing is read past those, the first screen's and the
        token.
     2. Every route arrived at through the door reads what its row says and
        nothing else -- printed, route by route, with the tables it asked.
     3. Every read of a list is capped: no GET without `limit=` or an `=eq.`
        on a key, and no `limit=` above NET_PAGE.
     4. A view, and viewReset(), put nothing on the wire.
     5. The bottom of the timeline, a person's page and a thread asks for the
        next page.
     6. Somebody else's language: opening the page reads only the kinds the
        page draws (WLD_PAGE_KINDS) and none of a chapter's; ↓ on a chapter
        reads that chapter's kinds (WLD_DL_KIND) and nothing else, draws the
        ⭕ meter while it is out and ⭕☑️ when it is in.
     7. Whether somebody is signed in is asked by the window alone -- no
        `!netSignedIn()` in www/net.js outside netSend1 -- and `SESS.` is read
        by the session's own functions in www/net.js and nowhere else.

   WHAT IT DOES NOT HOLD, said so silence is not read as a check:
     - The caps themselves. NET_PAGE is a provisional number and the owner's
       (docs/scope/r71-net.md § オーナーへ); this holds that there is ONE.
     - A real network. The fake answers in 2ms, so which answer lands first is
       not the order a phone sees.

   Run: node tools/load-check.mjs        (npm run load)                       */
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { chromium, LAUNCH } from './browser.mjs';
const dir = path.dirname(fileURLToPath(import.meta.url));
const WWW = path.join(dir, '..', 'www');
const INDEX = 'file://' + path.join(WWW, 'index.html');

const bad = [];
function say(ok, line){ console.log('  ' + (ok ? 'ok      ' : 'FAILED  ') + line); if (!ok) bad.push(line); }

/* What a session is, apart from any screen: renewing the token, what this
   account pays (`verify-plan`, 「段は起動とサインインで訊く」 OWNER
   2026-09-11), this account's own `profile` row (the theme and the interface
   language are drawn before any screen, and whether the account is frozen or
   answers reports), and where this handset can be reached (`device`). The
   plan and the profile row are on the owner's launch list as well (OPEN_READS
   below, 2026-09-24). */
const SESSION = /^(auth\/v1\/|functions\/v1\/verify-plan$|rest\/v1\/profile$|rest\/v1\/device$)/;
/* 「開いた時にタイムラインに行くなら、今日のお題も読むべきだし、プランもそう。
   テーマと言語も。開いた時に必要なものは読む」 OWNER 2026-09-24. Each of the
   five, and the read that answers it. */
const OPEN_READS = [['the notices', /^rest\/v1\/rpc\/notices$/],
                ['the timeline', /^rest\/v1\/rpc\/feed_/],
                ['today\'s prompt', /^rest\/v1\/prompt$/],
                ['the plan', /^functions\/v1\/verify-plan$/],
                ['the theme and the interface language', /^rest\/v1\/profile$/]];

/* ---- a server with more rows than any screen should want ---------------- */
function wire(cfg){
  var log = [], out = 0, IN_VIEW = 0, TOOK = [];
  window.__L = { log:log, out:function(){ return out; }, view:function(n){ IN_VIEW += n; } };
  var b64 = function(o){
    return btoa(unescape(encodeURIComponent(JSON.stringify(o))))
      .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  };
  var TOK = 'h.' + b64({ sub:'me1', email:'aya@example.com', app_metadata:{ provider:'email' } }) + '.s';
  try {
    localStorage.setItem('lingua.sess', JSON.stringify({ at:TOK, rt:'r', uid:'me1' }));
    localStorage.setItem('lingua.set', JSON.stringify({ walked:true, done:true, acct:'me1' }));
    localStorage.setItem('lingua.me.me1', JSON.stringify({ uid:'me1', name:'Aya', handle:'aya' }));
    /* a phone that has opened this account's language before: the index says
       which, and nothing of it is in memory (CLAUDE.md rule 22) */
    localStorage.setItem('lingua.langs.me1', JSON.stringify({ L1:{} }));
    localStorage.setItem('lingua.cur.me1', JSON.stringify('L1'));
  } catch (e) {}
  function qs(u, k){ var m = new RegExp('[?&]' + k + '=([^&]*)').exec(u); return m ? decodeURIComponent(m[1]) : ''; }
  var N = cfg.n;
  function rows(make, u){
    var lim = parseInt(qs(u, 'limit'), 10), n = isNaN(lim) ? N : Math.min(lim, N), o = [], i;
    for (i = 0; i < n; i++) o.push(make(i));
    return o;
  }
  function post(i){ return { id:'p' + i, author:'a' + (i % 7), author_handle:'h' + (i % 7), created_at:new Date(2026, 8, 1, 0, 0, N - i).toISOString(),
                             reply_to:null, body:{ ln:'post ' + i, mn:'post ' + i }, likes:0, boosts:0, replies:0 }; }
  function answer(m, u, body){
    var p = u.replace(/^[a-z]+:\/\/[^/]*/, '').split('?')[0];
    if (p === '/auth/v1/token' || p === '/auth/v1/user') return { access_token:TOK, refresh_token:'r', user:{ id:'me1' }, id:'me1' };
    if (p === '/functions/v1/verify-plan') return { plan:'plus' };
    if (p === '/rest/v1/rpc/feed_fo' || p === '/rest/v1/rpc/feed_hot' || p === '/rest/v1/rpc/posts_by'){
      var lim = (body && body.lim) || N, o = [], i;
      for (i = 0; i < Math.min(lim, N); i++) o.push(post(i + ((body && body.off) || 0)));
      return o;
    }
    if (p === '/rest/v1/rpc/notices'){
      var ln = (body && body.lim) || N, ns = [], j;
      for (j = 0; j < Math.min(ln, N); j++) ns.push({ kind:'like', at:new Date(2026, 8, 1).toISOString(), actor_handle:'h' + (j % 7), post:'p' + j });
      return ns;
    }
    if (p.indexOf('/rest/v1/rpc/') === 0) return [];
    if (p === '/rest/v1/profile' || p === '/rest/v1/profile_seen')
      return [{ id:qs(u, 'handle') ? 'x-' + qs(u, 'handle').slice(3) : 'me1', handle:qs(u, 'handle') ? qs(u, 'handle').slice(3) : 'aya',
                display:'Aya', fo:N, fr:N, prefs:{}, staff:false }];
    if (p === '/rest/v1/language' && m === 'GET')
      return /owner=eq\.me1/.test(u) ? [{ id:'L1', owner:'me1', name:'Kela', created_at:'2026-09-01T00:00:00Z', wsys:'alpha' }] : [];
    if (p === '/rest/v1/language_seen')
      return [{ id:'L-other', owner:'x7', name:'Tovi', license:'', published_at:'2026-09-01T00:00:00Z', nwords:N, nletters:3, wsys:'alpha', dl:true }];
    if (p === '/rest/v1/slice' && m === 'GET'){
      var ks = /kind=in\.\(([^)]*)\)/.exec(u), kinds = ks ? ks[1].split(',') : ['words', 'letters', 'script', 'lines', 'phases', 'gram2', 'wld', 'lang'], sl = [], w = [], x;
      for (x = 0; x < N; x++) w.push({ hw:'w' + x, ph:['w'], mn:'m' + x, mns:['m' + x], pos:'n', at:1 });
      for (x = 0; x < kinds.length; x++)
        sl.push({ kind:kinds[x], no:1, at:'A', ed:'2026-09-01T00:00:00Z',
                  body:kinds[x] === 'words' ? JSON.stringify(w)
                     : kinds[x] === 'wld' ? JSON.stringify({ secs:{ words:{ dl:true } } })
                     : (kinds[x] === 'letters' || kinds[x] === 'snd' || kinds[x] === 'lines') ? '[]' : '{}' });
      return sl;
    }
    if (p === '/rest/v1/follow_seen') return rows(function(i){ return { followed_handle:'h' + i, follower_handle:'h' + i }; }, u);
    if (p === '/rest/v1/draft') return rows(function(i){ return { id:'d' + i, body:{ ln:'d' + i }, updated_at:'2026-09-01T00:00:00Z' }; }, u);
    if (p === '/rest/v1/post_seen') return rows(post, u);
    /* a take is remembered, so the answer to 「which did this account take」
       says so after ↓ -- the app waits for the server's word before ⭕☑️ */
    if (p === '/rest/v1/language_take'){
      if (m === 'POST' && body && body.language){ TOOK.push(body.language); return [body]; }
      return TOOK.map(function(l){ return { language:l }; });
    }
    if (p === '/rest/v1/block' || p === '/rest/v1/saved_search' || p === '/rest/v1/recent_search' ||
        p === '/rest/v1/prompt') return [];
    if (p.indexOf('/storage/v1/') === 0) return {};
    return m === 'GET' ? [] : [{ id:'x' }];
  }
  function Fake(){ this.readyState = 0; this.status = 0; this.responseText = ''; this.response = null; }
  Fake.prototype.open = function(m, u){ this.__m = m; this.__u = String(u || ''); this.__v = IN_VIEW; };
  Fake.prototype.setRequestHeader = function(){};
  Fake.prototype.abort = function(){};
  Fake.prototype.getResponseHeader = function(){ return null; };
  Fake.prototype.send = function(d){
    var self = this, parsed = null;
    try { parsed = typeof d === 'string' ? JSON.parse(d) : null; } catch (e) {}
    log.push({ m:self.__m, u:self.__u, body:parsed, view:self.__v > 0 });
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

async function quiet(pg){
  let idle = 0, n = -1;
  for (let i = 0; i < 300; i++){
    const s = await pg.evaluate(() => [window.__L.out(), window.__L.log.length]);
    if (s[0] === 0 && s[1] === n) idle++; else idle = 0;
    n = s[1];
    if (idle >= 8) return;
    await new Promise(r => setTimeout(r, 50));
  }
}
function where(u){ return u.replace(/^[a-z]+:\/\/[^/]*\//, '').split('?')[0]; }
function tables(log){ return Array.from(new Set(log.map(r => where(r.u)))).sort(); }
function short(r){ return r.m + ' ' + r.u.replace(/^[a-z]+:\/\/[^/]*/, '').slice(0, 110); }

const N = 400;
const br = await chromium.launch(LAUNCH);
async function launch(){
  const pg = await br.newPage({ viewport:{ width:390, height:844 } });
  pg.__err = [];
  pg.on('pageerror', e => pg.__err.push(String((e && e.message) || e)));
  await pg.route('https://fonts.googleapis.com/**', r => r.fulfill({ status:200, contentType:'text/css', body:'' }));
  await pg.route('https://fonts.gstatic.com/**', r => r.abort());
  await pg.addInitScript(wire, { n:N });
  await pg.goto(INDEX);
  await pg.waitForSelector('#splash', { state:'detached', timeout:20000 });
  await quiet(pg);
  return pg;
}
async function logOf(pg){ return pg.evaluate(() => window.__L.log.map(r => ({ m:r.m, u:r.u, body:r.body, view:r.view }))); }
async function clear(pg){ await pg.evaluate(() => { window.__L.log.length = 0; }); }

const pg = await launch();
const cap = await pg.evaluate(() => (typeof NET_PAGE === 'number') ? NET_PAGE : 0);
const open = await pg.evaluate(() => (typeof PAGE_OPEN !== 'undefined') ? PAGE_OPEN.slice() : null);
const first = await pg.evaluate(() => ({ r:here().r, a:here().a }));
const boot = await logOf(pg);
console.log('the launch: ' + boot.length + ' requests -- ' + tables(boot).join(', '));
console.log('the launch pages: ' + JSON.stringify(open) + ', the first screen: ' + first.r);
say(!!open && open.slice().sort().join() === 'feed,notif',
    '1 the launch pages are the timeline and the notices (PAGE_OPEN) -- ' + JSON.stringify(open));
{
  const read = tables(boot), missing = OPEN_READS.filter(([, re]) => !read.some((t) => re.test(t)));
  say(missing.length === 0, '1 a launch reads all five things the owner named -- ' +
      OPEN_READS.map(([n]) => n).join(', ') +
      (missing.length ? ' -- NOT READ: ' + missing.map(([n]) => n).join(', ') : ''));
}
/* 「アプリを開いて最初の画面 → タイムラインで」 OWNER 2026-09-24. */
say(first.r === 'feed', '1 the app opens on the timeline -- it opened on ' + first.r);

/* ---- 2. every route, arrived at through the door, with nothing answered -- */
const routes = await pg.evaluate(() => Object.keys(PAGES));
const ARG = { profile:'h3', about:'L-other', thread:'p3', follows:'ers:h3', photo:'p3:0', set:'block' };
const byRoute = {};
const reach = await pg.evaluate(() => typeof pageNeeds === 'function' && typeof navLand === 'function');
say(reach, '2 there is one table of what a page reads (pageNeeds) and one door onto a page (navLand)');
for (const r of routes){
  await pg.evaluate(() => { pullForget(); goTab('plans'); });
  await quiet(pg);
  await clear(pg);
  const err = await pg.evaluate(([r, a]) => { try { go(r, a); return ''; } catch (e) { return String(e.message || e); } }, [r, ARG[r]]);
  await quiet(pg);
  const log = await logOf(pg);
  byRoute[r] = log;
  if (log.length || err)
    console.log('     ' + (r + (ARG[r] ? ' ' + ARG[r] : '')).padEnd(18) + (err ? '(threw: ' + err.slice(0, 60) + ') ' : '') +
                log.length + ' -- ' + tables(log).join(', '));
}
/* and the first screen as the launch arrives at it, with its own argument */
await pg.evaluate(() => { pullForget(); goTab('plans'); });
await quiet(pg);
await clear(pg);
await pg.evaluate(([r, a]) => { if (a) go(r, a); else goTab(r); }, [first.r, first.a]);
await quiet(pg);
const firstLog = await logOf(pg);
console.log('     the first screen, ' + first.r + ': ' + firstLog.length + ' -- ' + tables(firstLog).join(', '));
const quietRoutes = routes.filter(r => !byRoute[r].length);
console.log('     and ' + quietRoutes.length + ' of ' + routes.length + ' routes read nothing on arrival');

/* 1, with the first screen's reads and the two launch pages' in hand */
{
  const allowed = new Set();
  for (const r of (open || [])) for (const t of tables(byRoute[r] || [])) allowed.add(t);
  for (const t of tables(firstLog)) allowed.add(t);
  const extra = boot.filter(x => !allowed.has(where(x.u)) && !SESSION.test(where(x.u)));
  for (const x of extra) console.log('          ' + short(x));
  say(extra.length === 0, '1 a launch reads only what the launch pages and the first screen read, and the session -- ' +
      extra.length + ' request(s) past that');
}

/* ---- 3. every list is capped --------------------------------------------- */
/* What was not capped the day this was counted, and why: tools/load-baseline.txt,
   by table and `select`. */
const BASE = fs.readFileSync(path.join(dir, 'load-baseline.txt'), 'utf8').split('\n')
  .filter(l => l.trim() && l.charAt(0) !== '#' && !/^(signed-in|sess) /.test(l)).map(l => l.split('|')[0].trim());
function readKey(u){
  const m = /[?&]select=([^&]*)/.exec(u);
  return where(u) + ' select=' + (m ? decodeURIComponent(m[1]) : '');
}
{
  const all = boot.concat(firstLog, ...Object.values(byRoute));
  const gets = all.filter(x => x.m === 'GET' && where(x.u).indexOf('rest/v1/') === 0);
  const uncapped = gets.filter(x => !/[?&]limit=\d/.test(x.u) && !/[?&](id|handle|uid|language)=eq\./.test(x.u));
  const open3 = uncapped.filter(x => BASE.indexOf(readKey(x.u)) < 0);
  const rot = BASE.filter(k => !uncapped.some(x => readKey(x.u) === k));
  for (const k of rot) console.log('          baseline line matching no read: ' + k);
  say(rot.length === 0, '3 every line of tools/load-baseline.txt is a read that is still uncapped (' +
      BASE.length + ' lines, ' + rot.length + ' matching nothing)');
  const over = all.filter(x => { const m = /[?&]limit=(\d+)/.exec(x.u); const l = x.body && x.body.lim;
                                 return (m && +m[1] > cap) || (l && l > cap); });
  for (const x of open3) console.log('          no cap: ' + short(x));
  for (const x of over) console.log('          over ' + cap + ': ' + short(x));
  say(cap > 0 && open3.length === 0, '3 every read of a list has a cap (' + gets.length + ' GETs, ' + open3.length +
      ' without, ' + BASE.length + ' in the baseline)');
  say(over.length === 0, '3 and no cap is above NET_PAGE (' + cap + ')');
}

/* ---- 4. a view reads nothing --------------------------------------------- */
{
  const n = await pg.evaluate(() => {
    var k, c = 0;
    function wrap(name){
      var f = window[name];
      window[name] = function(){ window.__L.view(1); try { return f.apply(this, arguments); } finally { window.__L.view(-1); } };
      c++;
    }
    for (k in window){
      try { if (/^v[A-Z]/.test(k) && typeof window[k] === 'function') wrap(k); } catch (e) {}
    }
    wrap('viewReset');
    return c;
  });
  await clear(pg);
  for (const r of routes){
    await pg.evaluate(([r, a]) => { try { NAV = [{ r:r, a:a }]; route = r; render(); } catch (e) {} }, [r, ARG[r]]);
  }
  await pg.evaluate(() => { try { viewReset(); } catch (e) {} });
  await quiet(pg);
  const inView = (await logOf(pg)).filter(x => x.view);
  for (const x of inView) console.log('          from a view: ' + short(x));
  say(inView.length === 0, '4 the ' + n + ' views and viewReset() put nothing on the wire (' + routes.length + ' routes drawn)');
}

/* ---- 5. the bottom of the timeline asks for the next page ---------------- */
{
  await pg.evaluate(() => { goTab('feed'); });
  await quiet(pg);
  await clear(pg);
  await pg.evaluate(() => { window.scrollTo(0, document.body.scrollHeight); window.dispatchEvent(new Event('scroll')); });
  await quiet(pg);
  const more = (await logOf(pg)).filter(x => /feed_(hot|fo)/.test(x.u) && x.body && (x.body.off || x.body.before));
  say(more.length === 1, '5 the bottom of the timeline asks for the next page -- ' + more.length + ' ask(s)');
  /* and the two other lists a page is made of: a person's posts carry on back
     from the oldest one held, a thread down from the newest reply */
  /* a person's page is one question, posts_by(), carrying on from `before`
     (what they wrote and what they passed on, one list) */
  const PAGE_MORE = {
    profile: (x) => /rpc\/posts_by/.test(x.u) && x.body && x.body.before,
    thread:  (x) => /post_seen/.test(x.u) && /reply_to=in\..*created_at=gt\./.test(x.u) };
  for (const [r, a] of [['profile', 'h3'], ['thread', 'p3']]){
    await pg.evaluate(([r, a]) => { go(r, a); }, [r, a]);
    await quiet(pg);
    await clear(pg);
    await pg.evaluate(() => { window.scrollTo(0, document.body.scrollHeight); window.dispatchEvent(new Event('scroll')); });
    await quiet(pg);
    const next = (await logOf(pg)).filter(PAGE_MORE[r]);
    say(next.length === 1, '5 the bottom of ' + r + ' asks for the next page -- ' + next.length + ' ask(s)');
  }
}

/* ---- 6. somebody else's language ------------------------------------------ */
{
  const K = await pg.evaluate(() => ({ page: WLD_PAGE_KINDS.slice(), dl: WLD_DL_KIND }));
  const chapter = new Set([].concat(...Object.values(K.dl)).filter(k => K.page.indexOf(k) < 0));
  const kindsOf = x => (/kind=in\.\(([^)]*)\)/.exec(x.u) || [, 'ALL'])[1].split(',');
  await pg.evaluate(() => { goTab('feed'); });
  await quiet(pg);
  await clear(pg);
  /* a language this run has not opened before, so nothing is answered */
  await pg.evaluate(() => { go('about', 'L-fresh'); });
  await quiet(pg);
  const sl = (await logOf(pg)).filter(x => where(x.u) === 'rest/v1/slice');
  const asked = [].concat(...sl.map(kindsOf));
  const leak = asked.filter(k => k === 'ALL' || chapter.has(k));
  say(leak.length === 0, '6 opening somebody else\'s language reads only what the page draws -- ' +
      JSON.stringify(asked) + (leak.length ? ', and a chapter\'s: ' + JSON.stringify(leak) : ''));
  /* the downloads are a section of their own, and it arrives folded (rule 20) */
  const btn = await pg.evaluate(() => {
    var f = document.querySelector('#app [data-do="abToggle"][data-a*="wlddl"]'), b;
    if (f) f.click();
    b = document.querySelector('#app [data-do="wldGet"]');
    return b ? b.getAttribute('data-a') : '';
  });
  say(!!btn, '6 the page offers ↓ on a chapter -- ' + (btn || 'none'));
  if (btn){
    await clear(pg);
    const during = await pg.evaluate(() => {
      document.querySelector('#app [data-do="wldGet"]').click();
      var m = document.querySelector('#app .wldmeter');
      return m ? m.outerHTML.slice(0, 60) : '';
    });
    await quiet(pg);
    const reads = (await logOf(pg)).filter(x => where(x.u) === 'rest/v1/slice');
    const want = K.dl[JSON.parse(btn)[1]] || [];
    const got = reads.map(kindsOf);
    say(reads.length === 1 && got[0].slice().sort().join() === want.slice().sort().join(),
        '6 ↓ reads that chapter\'s kinds and nothing else -- ' + JSON.stringify(got) + ', the chapter is ' + JSON.stringify(want));
    say(!!during, '6 the ⭕ meter is on the screen while it comes down -- ' + (during || 'nothing drawn'));
    const done = await pg.evaluate(() => !!document.querySelector('#app .wldgot'));
    say(done, '6 and ⭕☑️ when it is in');
  }
}

/* ---- 7. the two session questions, counted in the source ------------------
   「サインインしているかは窓（netSend1）だけが決め、私が誰かは一関数が答える」
   (r73 § 2-5). Whether anybody is signed in is asked by the window and its own
   renewal (netSend1, netFresh, netResume) and by nothing else in www/net.js --
   a request with nobody on it is the window's 401 and nothing more. The ones
   that are a written rule rather than a guard are lines in
   tools/load-baseline.txt, with the rule. And SESS is named by www/core.js
   § session, which READS it (sessRead, and netUid() -- which account this is
   has to be known before anything of an account's is read, § ACCT), and by
   www/net.js, the window, and by no other file; the account's uid and token
   are read by netUid() and netTok() and by nothing else. */
{
  function decomment(s){
    return s.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1');
  }
  function fns(src){
    const out = [], re = /^function\s+(\w+)\s*\(/mg;
    let m, last = null;
    while ((m = re.exec(src))){ if (last) last.end = m.index; last = { name:m[1], at:m.index }; out.push(last); }
    if (last) last.end = src.length;
    return out;
  }
  const WINDOW = ['netSend1', 'netSignedIn', 'netFresh', 'netResume'];
  const RULE = fs.readFileSync(path.join(dir, 'load-baseline.txt'), 'utf8').split('\n')
    .filter(l => /^signed-in /.test(l)).map(l => l.split('|')[0].replace(/^signed-in /, '').trim());
  const net = decomment(fs.readFileSync(path.join(WWW, 'net.js'), 'utf8'));
  let outside = 0;
  const who = [], ruled = [];
  for (const f of fns(net)){
    if (WINDOW.indexOf(f.name) >= 0) continue;
    const n = (net.slice(f.at, f.end).match(/!\s*netSignedIn\s*\(/g) || []).length;
    if (!n) continue;
    if (RULE.indexOf(f.name) >= 0){ ruled.push(f.name); continue; }
    outside += n; who.push(f.name);
  }
  const rot7 = RULE.filter(r => ruled.indexOf(r) < 0);
  say(outside === 0, '7 no !netSignedIn() in www/net.js outside the window -- ' + outside +
      (who.length ? ' (' + who.slice(0, 8).join(', ') + (who.length > 8 ? ', …' : '') + ')' : '') +
      '; ' + ruled.length + ' a written rule in the baseline (' + ruled.join(', ') + ')');
  say(rot7.length === 0, '7 every signed-in line of the baseline is a function that still asks -- ' +
      (rot7.length ? 'matching nothing: ' + rot7.join(', ') : 'all ' + RULE.length));
  const SESSHOME = ['core.js', 'net.js'];
  const files = fs.readdirSync(WWW).filter(f => /\.js$/.test(f) && SESSHOME.indexOf(f) < 0);
  const SESSB = fs.readFileSync(path.join(dir, 'load-baseline.txt'), 'utf8').split('\n')
    .filter(l => /^sess /.test(l)).map(l => l.split('|')[0].replace(/^sess /, '').trim());
  const elsewhere = [], held = [];
  for (const file of files){
    const n = (decomment(fs.readFileSync(path.join(WWW, file), 'utf8')).match(/\bSESS\b/g) || []).length;
    if (!n) continue;
    if (SESSB.indexOf(file) >= 0) held.push(file); else elsewhere.push(file + ' ' + n);
  }
  const rot7b = SESSB.filter(f => held.indexOf(f) < 0);
  /* core.js is the session's reader, and only there: the declaration,
     sessRead() and netUid(). Anywhere else in the file is a second reader. */
  {
    const core = decomment(fs.readFileSync(path.join(WWW, 'core.js'), 'utf8'));
    const keep = fns(core).filter(f => ['sessRead', 'netUid'].indexOf(f.name) >= 0);
    let rest = core;
    for (const f of keep.slice().reverse()){
      const end = f.name === 'netUid' ? core.indexOf('\n', f.at) : core.indexOf('\n}', f.at) + 2;
      rest = rest.slice(0, f.at) + rest.slice(end);
    }
    rest = rest.replace(/^var SESS=null;$/m, '');
    const n = (rest.match(/\bSESS\b/g) || []).length;
    if (n || keep.length !== 2) elsewhere.push('core.js outside sessRead/netUid ' + n + (keep.length !== 2 ? ' (sessRead or netUid is gone)' : ''));
  }
  say(elsewhere.length === 0 && rot7b.length === 0, '7 SESS is named by www/core.js § session (reads it) and www/net.js (the window) and no other file -- ' +
      (elsewhere.length ? elsewhere.join(', ') : files.length + ' files asked') +
      (held.length ? '; ' + held.length + ' in the baseline (' + held.join(', ') + ')' : '') +
      (rot7b.length ? '; baseline lines matching nothing: ' + rot7b.join(', ') : ''));
  const readers = [];
  for (const f of fns(net)){
    if (f.name === 'netUid' || f.name === 'netTok') continue;
    const n = (net.slice(f.at, f.end).match(/\bSESS\.(uid|at)\b/g) || []).length;
    if (n) readers.push(f.name + ' ' + n);
  }
  say(readers.length === 0, '7 the uid and the token are read by netUid() and netTok() alone -- ' +
      (readers.length ? readers.join(', ') : 'nobody else'));
}

/* ---- 8. one read of one shape, in one place ---------------------------------
   「テーブルごとに読む関数は一つ、列は表から」 (r73 § 2-6). Counted over
   www/net.js with the comments out: every `/rest/v1/<table>?select=<columns>`
   written down, and the functions it is written in. The same table read for
   the same columns from two functions is the same question with two answers
   waiting to differ -- seven copies of post_seen's columns had come to leave
   the reactions off two of them. A column list kept in a constant is one
   place however many functions read it. */
{
  function decomment8(s){
    return s.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1');
  }
  const net = decomment8(fs.readFileSync(path.join(WWW, 'net.js'), 'utf8'));
  const re = /^function\s+(\w+)\s*\(/mg, spans = [];
  let m, last = null;
  while ((m = re.exec(net))){ if (last) last.end = m.index; last = { name:m[1], at:m.index }; spans.push(last); }
  if (last) last.end = net.length;
  const by = {};
  for (const f of spans){
    const body = net.slice(f.at, f.end), q = /'\/rest\/v1\/(\w+)\?select=([^'&]*)/g;
    let k;
    while ((k = q.exec(body))){ const key = k[1] + ' ' + k[2]; (by[key] = by[key] || new Set()).add(f.name); }
  }
  const twice = Object.keys(by).filter(k => by[k].size > 1);
  for (const k of twice) console.log('          ' + k + ' -- ' + Array.from(by[k]).join(', '));
  say(twice.length === 0, '8 every table read for the same columns is written in one function -- ' +
      Object.keys(by).length + ' shapes, ' + twice.length + ' written twice');
}

if (pg.__err.length) say(false, 'the page threw: ' + pg.__err.slice(0, 3).join(' | '));
await br.close();
console.log(bad.length ? '\nload-check: ' + bad.length + ' FAILED' : '\nload-check: ok');
process.exit(bad.length ? 1 : 0);
