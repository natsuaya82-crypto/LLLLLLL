/* The mark turns while a press is waiting on the server, and only then.
   ---------------------------------------------------------------------
   「通信とかしてる時はダイヤくるくる回してね。押したのに通信中何もないと
   普通にバグかと思って連打しちゃうから」「通信してる箇所には出るように
   して」「2箇所で追加しますみたいなやり方だと後で機能追加した時にまた
   書かないといけないでしょ」 OWNER 2026-09-27.

   It is the wire's (www/net.js § HOW MANY REQUESTS SOMEBODY IS WAITING ON):
   actRun() runs every press inside netPressed(), and netSend1()/netUp()
   count a request that went out inside one. Asked here of the REAL wire --
   the XMLHttpRequest, not a stub of netSend -- with a server that answers
   late, so there is a moment to look at:

     1  Save on the drawing screen: the mark is up while the save is out
     2  and down once it has landed, and the save did land
     3  the request a save sends from the answer to the one before it is the
        same press: the mark did not come down between them
     4  a press that sends nothing turns nothing
     5  a request nobody pressed for (a list read on its own) turns nothing

   Run: node tools/spin-check.mjs
        node tools/spin-check.mjs --shot r111   (also photographs the save
        in Japanese while it is out, into shots/r111-saving.png)        */
import { seed } from './fixture.mjs';
import { fileURLToPath } from 'url';
import path from 'path';
import { chromium, LAUNCH } from './browser.mjs';
const dir = path.dirname(fileURLToPath(import.meta.url));
const si = process.argv.indexOf('--shot');
const shot = si >= 0 ? process.argv[si + 1] : '';

const br = await chromium.launch(LAUNCH);
const pg = await br.newPage({ viewport:{ width:390, height:844 } });
const errs = [];
pg.on('pageerror', (e) => errs.push(String(e && e.message || e)));
/* a server that answers everything, 300ms late */
let asked = 0;
await pg.route(/\/(rest|storage|auth)\/v1\//, async (route) => {
  asked++;
  const req = route.request(), u = req.url(), m = req.method();
  await new Promise((f) => setTimeout(f, 300));
  let body = '[]', status = 200;
  if (m === 'POST' && u.indexOf('/rest/v1/language') >= 0) {
    let b = {}; try { b = JSON.parse(req.postData() || '{}'); } catch (e) {}
    body = JSON.stringify([{ id: b.id || 'srv1' }]);
  }
  /* one slice up: what supabase/schema.sql § slice_put answers */
  if (m === 'POST' && u.indexOf('/rest/v1/rpc/slice_put') >= 0) body = JSON.stringify({ no: 1, said: '', body: null });
  await route.fulfill({ status, body, headers: {
    'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': '*', 'Content-Type': 'application/json' } });
});
await pg.goto('file://' + path.join(dir, '..', 'www', 'index.html'));
await pg.waitForSelector('#splash', { state:'detached', timeout:10000 });
await pg.evaluate(({ s, ja }) => {
  eval('(' + s + ')()');
  SET.walked = true;
  if (ja) SET.ui = 'ja';
  NAV = [{ r:'letters' }]; route = 'letters'; render();
}, { s: seed.toString(), ja: !!shot });
await pg.waitForTimeout(800);

const spin = () => pg.evaluate(() => document.getElementById('netspin').className.indexOf('on') >= 0);
let fails = 0, n = 0;
function say(ok, what, got) {
  n++; if (!ok) fails++;
  console.log((ok ? '  ok  ' : '  FAIL') + ' ' + n + '. ' + what + (ok ? '' : '  -- ' + JSON.stringify(got)));
}

/* 1-3: draw, press Save, watch the mark the whole way */
await pg.evaluate(() => { var l = LETTERS[0]; go('letter', l.id); });
await pg.waitForTimeout(700);
await pg.click('[data-do="editLetter"]');
await pg.waitForTimeout(200);
await pg.evaluate(() => { GE.st = [{ pts:[[100,100],[400,400]] }]; render(); });
const before = asked;
await pg.click('[data-do="keepPress"]');
const seen = [], still = [];
const t0 = Date.now();
while (Date.now() - t0 < 5000) {
  const on = await spin();
  const done = await pg.evaluate(() => here().r !== 'glyph');
  seen.push(on);
  if (shot && seen.length === 8) await pg.screenshot({ path: path.join(dir, '..', 'shots', shot + '-saving.png') });
  if (!done) still.push(on);
  if (done && !on) break;
  await pg.waitForTimeout(20);
}
const landed = await pg.evaluate(() => ({ r: here().r, toast: (document.getElementById('toast') || {}).textContent || '' }));
const sent = asked - before;
say(seen[0] === true, 'Save pressed: the mark is up at once', seen.slice(0, 3));
say(landed.r === 'letter' && !(await spin()), 'the save landed (' + landed.r + ', ' + sent + ' requests) and the mark is down', landed);
say(sent >= 2 && still.length > 3 && still.every((v) => v === true),
    'the mark stayed up across all ' + sent + ' requests of the one press, for as long as it was out (' + still.length + ' looks)',
    still.map((v) => v ? 1 : 0).join(''));

/* 4: a press that sends nothing */
const b4 = asked;
await pg.evaluate(() => { var b = document.querySelector('[data-do="openSnd"]'); if (b) b.click(); });
const s4 = await spin();
say(asked === b4 && !s4, 'a press that sends nothing turns nothing', { asked: asked - b4, s4 });
await pg.evaluate(() => back());
await pg.waitForTimeout(100);

/* 5: a read nobody pressed for */
const b5 = asked;
await pg.evaluate(() => { PULL_GOT['feed'] = 0; pullGo('feed'); });
await pg.waitForTimeout(60);
const s5 = await spin();
await pg.waitForTimeout(500);
say(asked > b5 && !s5, 'a read nobody pressed for turns nothing (' + (asked - b5) + ' asked)', { s5 });

/* 6-7: ♡ AND ↓ ARE PRESSES LIKE ANY OTHER 「↓のメーターと♡も星で」 OWNER
   2026-09-28 -- one mechanism, no exceptions. The star is up at once; the ♡ is
   not lit before the answer, and no row draws a meter of its own. */
const pl = await pg.evaluate(() => {
  /* on your own page, which draws the posts held -- the feed draws its own
     pulled answer, which this server leaves empty */
  var p = POSTS.filter(function (x){ return x.mine && !x.to && !x.toh; })[0], b;
  if (!p.sid) p.sid = 'S-spin';
  p.ilike = false;
  NAV = [{ r:'profile' }]; route = 'profile'; render();
  b = document.querySelector('#app [data-do="postLike"][data-a=\'' + JSON.stringify([p.id]) + '\']');
  if (b) b.click();
  return p.id;
});
const s6 = await spin();
const lit6 = await pg.evaluate((id) => postILike(postById(id)), pl);
if (shot) { await pg.waitForTimeout(200); await pg.screenshot({ path: path.join(dir, '..', 'shots', shot + '-like.png') }); }
await pg.waitForTimeout(900);
say(s6 && !lit6, '\u2661 pressed: the star is up at once and the \u2661 is not lit before the answer', { s6, lit6 });
say(!(await spin()), 'and the star is down once it has answered', {});

const lid7 = await pg.evaluate(() => {
  var lid = 'spin-lang-1';
  planGot('plus');
  WLD_HAVE[lid] = { id:lid, name:'Necwe', owner:'somebody-else', pub:'2026-08-01' };
  WLDS_HAVE[lid] = { wld:{ body: JSON.stringify({ dl:true }), no:1 } };
  langOwnGot(lid, 'somebody-else');
  ABOPEN.wlddl = true;
  NAV = [{ r:'about', a:lid }]; route = 'about'; render();
  return lid;
});
await pg.waitForTimeout(300);
const had7 = await pg.evaluate(() => {
  var b = document.querySelector('#app [data-do="wldGet"]');
  if (b) b.click();
  return !!b;
});
const s7 = await spin();
const busy7 = await pg.evaluate(() => !!document.querySelector('#app [aria-busy="true"]'));
if (shot) { await pg.waitForTimeout(200); await pg.screenshot({ path: path.join(dir, '..', 'shots', shot + '-dl.png') }); }
await pg.waitForTimeout(900);
say(had7 && s7 && !busy7, '\u2193 pressed: the star is up at once, and no row draws a meter of its own', { had7, s7, busy7, lid7 });

say(errs.length === 0, 'nothing threw', errs);
await br.close();
console.log(fails ? 'spin-check: ' + fails + ' of ' + n + ' FAILED' : 'spin-check: ' + n + ' of ' + n + ' held');
process.exit(fails ? 1 : 0);
