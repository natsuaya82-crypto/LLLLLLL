/* tools/slow-check.mjs — how many times a screen goes to the server, and how
   many of those it waits for one before asking the next.
   ---------------------------------------------------------------------------
   「他人のフォロー／フォロワーとか見る時すんごいくるくる回ってるけど、なんか
   全体的に遅くない？」 OWNER 2026-09-08, on a phone (143).

   THE NUMBER THAT MATTERS IS NOT HOW MANY REQUESTS A SCREEN MAKES. Ten
   requests put at once cost one round trip; three put one after another cost
   three. A phone on a mobile network pays 100-300ms for each round trip
   whatever is in it, so what a person feels is the DEPTH -- the longest chain
   of 「ask, wait for the answer, ask the next thing」 -- and nothing else on
   this page is a proxy for it. A screen can get faster while its request
   count goes UP.

   So this stands a server up that is nothing but a fixed delay: every request
   is answered with the shape the app expects, LAT ms later, whatever it asked
   for. Then depth falls out of the log by itself -- a request that STARTED
   after another one FINISHED was waiting for it, and that is the only thing
   「直列」 means. Nothing here reads the app's source or counts call sites: a
   check that works the answer out again from the code is a copy of the code
   and always agrees with it (CLAUDE.md rule 10).

   IT IS THE WIRE THAT IS FAKED AND NOT netSend(). Every request this app
   makes goes out of one of two XMLHttpRequests (www/net.js § the wire, and
   netUp() at its foot), so replacing XMLHttpRequest counts both and cannot
   miss a road that was added beside netSend() -- which is exactly what
   happened twice in that file's history.

   Run: node tools/slow-check.mjs        (npm run slow)                       */
import { seed } from './fixture.mjs';
import { fileURLToPath } from 'url';
import path from 'path';
import { chromium, LAUNCH } from './browser.mjs';
const dir = path.dirname(fileURLToPath(import.meta.url));

/* One round trip. Chosen to be far longer than anything the page does on its
   own, so a gap in the log is a gap in the wire and never a slow render. */
const LAT = 300;

/* WHAT EACH SCREEN MAY COST, in round trips. These are the claim: a road that
   grows a stage fails here rather than on somebody's phone. */
const MAX = {
  'launch':   3,
  'feed':     1,
  'profile':  2,
  'follows':  2,
  'notif':    1,
  'thread':   1,
  'save':     2
};

/* ---- the server, which is a delay ---------------------------------------
   Installed before a line of the app runs, so the launch is measured too.  */
function fakeNet(lat){
  var log = [], out = 0;
  window.__NET = {
    log: log,
    out: function(){ return out; },
    reset: function(){ log.length = 0; if (this.stalls) this.stalls.length = 0; }
  };

  var b64 = function(o){
    return btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_')
      .replace(/=+$/, '');
  };
  var TOK = 'h.' + b64({ sub: 'u', email: 'aya@example.com',
                         app_metadata: { provider: 'email' } }) + '.s';

  /* Signed in before the app loads, which is what a launch IS. */
  try {
    localStorage.setItem('lingua.sess',
      JSON.stringify({ at: TOK, rt: 'r', uid: 'u', anon: false }));
    localStorage.setItem('lingua.set', JSON.stringify({ done: true }));
  } catch (e) {}

  /* People for the lists to be about. */
  var HANDLES = ['iri', 'p1', 'p2', 'p3', 'p4', 'p5'];
  var WHO = {};
  for (var i = 0; i < HANDLES.length; i++) {
    WHO[HANDLES[i]] = { id: 'U-' + HANDLES[i], handle: HANDLES[i],
                        display: 'Name ' + HANDLES[i], av: null,
                        bio: 'hello', banned_at: null, fo: 2, fr: 5 };
  }

  function qs(u, k) {
    var m = new RegExp('[?&]' + k + '=([^&]*)').exec(u);
    return m ? decodeURIComponent(m[1]) : '';
  }
  /* `in.(a,b)` and `eq.a` both mean 「these handles」 to the caller. */
  function asked(v) {
    var m = /^in\.\((.*)\)$/.exec(v);
    if (m) return m[1] ? m[1].split(',').map(decodeURIComponent) : [];
    if (v.indexOf('eq.') === 0) return [decodeURIComponent(v.slice(3))];
    return [];
  }

  function answer(m, u) {
    var p = u.split('?')[0].replace(/^[a-z]+:\/\/[^/]*/, '');
    var j, hs, sel, side, rows;
    if (p === '/auth/v1/token')
      return { access_token: TOK, refresh_token: 'r', user: { id: 'u' } };
    if (p === '/rest/v1/profile_seen' || p === '/rest/v1/profile') {
      hs = asked(qs(u, 'handle'));
      rows = [];
      for (j = 0; j < hs.length; j++) if (WHO[hs[j]]) rows.push(WHO[hs[j]]);
      return rows;
    }
    if (p === '/rest/v1/follow') {
      sel = qs(u, 'select');
      side = sel.indexOf('follower(') === 0 ? 'follower' : 'followed';
      rows = [];
      for (j = 1; j <= 5; j++) {
        var r = {};
        r[side] = { handle: 'p' + j };
        rows.push(r);
      }
      return rows;
    }
    if (p === '/rest/v1/language') {
      /* Only the 「whose language is this」 question answers with rows: the
         others are a launch's, and inventing languages there would make this
         a check about netLangsDown() instead. */
      hs = asked(qs(u, 'owner'));
      rows = [];
      for (j = 0; j < hs.length; j++)
        rows.push({ id: 'L-' + hs[j], owner: hs[j], name: 'Vethi',
                    published_at: '2026-01-01' });
      return rows;
    }
    if (p === '/rest/v1/slice') return [];
    return m === 'GET' ? [] : {};
  }

  function Fake() { this.readyState = 0; this.status = 0; this.responseText = ''; }
  Fake.prototype.open = function (m, u) { this.__m = m; this.__u = u; };
  Fake.prototype.setRequestHeader = function () {};
  Fake.prototype.abort = function () {};
  Fake.prototype.getResponseHeader = function () { return null; };
  Fake.prototype.send = function () {
    var self = this;
    var rec = { m: self.__m, u: String(self.__u || ''),
                t0: performance.now(), t1: 0 };
    log.push(rec);
    out++;
    setTimeout(function () {
      out--;
      rec.t1 = performance.now();
      self.readyState = 4;
      self.status = 200;
      try { self.responseText = JSON.stringify(answer(self.__m, rec.u)); }
      catch (e) { self.responseText = 'null'; }
      if (self.onreadystatechange) self.onreadystatechange();
    }, lat);
  };
  window.XMLHttpRequest = Fake;

  /* ---- AND WHETHER THE PHONE IS BUSY RATHER THAN WAITING -----------------
     「すんごいくるくる回ってる」 has two causes that look identical: the
     answer has not come, or it has come and the phone cannot draw. A mark
     turns by CSS, so a blocked main thread freezes it in place -- and no
     count of requests can tell the two apart. This is a metronome: it asks
     to be run every 50ms, and how late it is is how long the thread was
     busy. Nothing about it is a guess. */
  var STALL = [], last = performance.now();
  window.__NET.stalls = STALL;
  (function tick(){
    var now = performance.now(), late = now - last - 50;
    if (late > 100) STALL.push(Math.round(late));
    last = now;
    setTimeout(tick, 50);
  })();
}

/* ---- the depth, read off the log ----------------------------------------
   A request that started after another one finished was waiting for it. That
   is the whole definition, and it is the only one that does not need to know
   which function made which call.                                          */
function levels(log) {
  const lv = log.map(() => 1);
  const ord = log.map((r, i) => i).sort((a, b) => log[a].t0 - log[b].t0);
  for (const i of ord) {
    for (const j of ord) {
      if (j === i) continue;
      /* 1ms of slack: a callback that fires the next request does it in the
         same turn, so the two stamps are the same millisecond. */
      if (log[j].t1 && log[j].t1 <= log[i].t0 + 1 && lv[j] + 1 > lv[i])
        lv[i] = lv[j] + 1;
    }
  }
  return lv;
}
function tag(r) {
  const p = String(r.u).split('?')[0].replace(/^[a-z]+:\/\/[^/]*/, '');
  const bits = p.split('/');
  return (r.m === 'GET' ? '' : r.m.toLowerCase() + ' ') + (bits[bits.length - 1] || p);
}

const br = await chromium.launch(LAUNCH);
const rows = [];
const errs = [];

/* Every screen gets its own page: a cache filled by the last measurement is
   a screen that asks for nothing and looks fast for the wrong reason. */
async function measure(name, run) {
  const pg = await br.newPage({ viewport: { width: 390, height: 844 } });
  pg.on('pageerror', (e) => errs.push(name + ': ' + String((e && e.message) || e)));
  /* ---- AND THE ONE REQUEST THIS APP MAKES THAT IS NOBODY'S CODE ---------
     www/index.html carries a render-blocking <link> to fonts.googleapis.com.
     It is not netSend() and it is not on any road this check measures, but
     the page will not reach DOMContentLoaded until it answers -- measured
     here at 12.7s of the launch's 14.2s, because this container's proxy
     refuses that host. Answered instantly with nothing, so the wall clock
     below is the app and not a third party. What that <link> costs a phone
     is a real question and it is a different one; docs/BACKLOG.md carries
     it, and www/index.html is not this session's to change. */
  await pg.route('https://fonts.googleapis.com/**', (r) =>
    r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await pg.route('https://fonts.gstatic.com/**', (r) => r.abort());
  await pg.addInitScript(fakeNet, LAT);
  const t0 = Date.now();
  await pg.goto('file://' + path.join(dir, '..', 'www', 'index.html'));
  await pg.waitForSelector('#splash', { state: 'detached', timeout: 15000 });
  /* The launch is measured up to here; everything else starts from quiet. */
  const splashMs = Date.now() - t0;
  await quiet(pg);
  let ms = Date.now() - t0;
  if (run) {
    await pg.evaluate(({ s }) => {
      eval('(' + s + ')()');
      /* THE FIXTURE IS A PHONE THAT IS UP TO DATE, and it has to be said out
         loud twice. seed() writes, so it leaves a save on the debounce timer;
         and every post it makes is one this phone has never sent, so the
         first pull of a timeline carries four posts and their photographs up
         with it (postCatchUp, www/post.js). Both are real roads and neither
         is what these seven screens are being asked about -- a phone with an
         afternoon of unsent work is a question of its own. */
      if (typeof NET_UPT !== 'undefined' && NET_UPT) {
        clearTimeout(NET_UPT); NET_UPT = null;
      }
      NET_SYNCING = false;
      for (var i = 0; i < POSTS.length; i++) POSTS[i].sid = POSTS[i].id;
    }, { s: seed.toString() });
    await quiet(pg);
    await pg.evaluate(() => { window.__NET.reset(); });
    const t1 = Date.now();
    await pg.evaluate(run);
    await quiet(pg);
    ms = Date.now() - t1;
  }
  const log = await pg.evaluate(() => window.__NET.log.map(
    (r) => ({ m: r.m, u: r.u, t0: r.t0, t1: r.t1 })));
  const stalls = await pg.evaluate(() => window.__NET.stalls.slice());
  const lv = levels(log);
  const d = lv.length ? Math.max.apply(null, lv) : 0;
  /* What went out, laid out by the stage it went out in: stage 2 is what the
     app could not ask for until stage 1 had answered, and so on. */
  const stage = [];
  for (let i = 0; i < log.length; i++) {
    (stage[lv[i] - 1] = stage[lv[i] - 1] || []).push(tag(log[i]));
  }
  /* The wire alone: first question out to last answer in. The wall clock
     above it carries the splash's own 900ms floor and whatever the phone was
     busy drawing, and neither of those is what this check is about. */
  const netMs = log.length
    ? Math.round(Math.max.apply(null, log.map((r) => r.t1)) -
                 Math.min.apply(null, log.map((r) => r.t0))) : 0;
  const busy = stalls.reduce((a, b) => a + b, 0);
  rows.push({ name, n: log.length, d, ms, netMs, busy,
              worst: stalls.length ? Math.max.apply(null, stalls) : 0,
              splashMs: run ? 0 : splashMs, stage });
  await pg.close();
}

/* Nothing in the air, and nothing started since. A chained request is made
   from inside its own callback, so one empty poll after an empty one is
   enough -- a gap of a whole poll with nothing out is the end. */
async function quiet(pg) {
  let idle = 0, n = -1;
  for (let i = 0; i < 400; i++) {
    const s = await pg.evaluate(() => [window.__NET.out(), window.__NET.log.length]);
    if (s[0] === 0 && s[1] === n) idle++; else idle = 0;
    n = s[1];
    if (idle >= 2) return;
    await new Promise((r) => setTimeout(r, 40));
  }
}

await measure('launch', null);

await measure('feed', () => {
  PULL_GOT = {}; PULL_OUT = {};
  pullGo('feed');
});

await measure('profile', () => {
  WHO_HAVE = {}; WHO_ASKED = {};
  profileOpen('iri');
});

await measure('follows', () => {
  WHO_HAVE = {}; WHO_ASKED = {}; FOL_HAVE = {}; FOL_ASKED = {};
  followsOpen('ers:iri');
});

await measure('notif', () => {
  PULL_GOT = {}; PULL_OUT = {};
  pullGo('notif');
});

await measure('thread', () => {
  PULL_GOT = {}; PULL_OUT = {};
  NAV = [{ r: 'thread', a: POSTS[0].id }];
  pullGo('thread');
});

await measure('save', () => {
  /* A language already up, which is what a save on a phone that has been
     open for a minute is: netLangRow() answers with no request at all. */
  LANGS[langId].sid = 'L-u';
  LANGS[langId].uid = 'u';
  /* One word typed and saved, which is the road every write takes:
     save() → bkTouch() → netSaveUp(), with the wait taken off it. */
  WORDS.push({ w: 'kefu', m: 'stone' });
  save();
  netSaveNow(function () {});
});

await br.close();

/* ---- the table ---------------------------------------------------------- */
let bad = 0;
console.log('slow-check — one round trip = ' + LAT + 'ms');
console.log('');
console.log('screen    requests  serial  wire ms  wall ms  allowed');
console.log('--------  --------  ------  -------  -------  -------');
for (const r of rows) {
  const m = MAX[r.name];
  const ok = r.d <= m;
  if (!ok) bad++;
  console.log(
    r.name.padEnd(10) +
    String(r.n).padStart(6) + '    ' +
    String(r.d).padStart(4) + '    ' +
    String(r.netMs).padStart(7) + '  ' +
    String(r.ms).padStart(7) + '  ' +
    String(m).padStart(7) + (ok ? '' : '  !'));
}
console.log('');
/* And what each stage waited for the one above it to answer. */
for (const r of rows) {
  console.log(r.name +
    (r.splashMs ? '   (splash down at ' + r.splashMs + 'ms)' : '') +
    (r.busy ? '   (main thread busy ' + r.busy + 'ms, longest ' + r.worst + 'ms)' : ''));
  for (let i = 0; i < r.stage.length; i++)
    console.log('  ' + (i + 1) + '. ' + r.stage[i].join('  '));
}
console.log('');
for (const r of rows)
  if (r.d > MAX[r.name])
    console.log('FAIL ' + r.name + ': ' + r.d + ' round trips in a row, ' +
                MAX[r.name] + ' allowed');
if (errs.length) { bad++; errs.forEach((e) => console.log('FAIL ' + e)); }
console.log(rows.length + ' screens measured, ' +
            (bad ? bad + ' over' : 'all within') + ' the allowance');
process.exit(bad ? 1 : 0);
