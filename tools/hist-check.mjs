/* 運営が戻した版が、その人の iPhone に届く。
   ---------------------------------------------------------------------
   「運営が治せる仕様は欲しい。ユーザーが問い合わせてきた時に、アカウントの
   復旧ができるようにしたい、管理画面で」「3 で実装して」 OWNER 2026-09-09.

   THIS IS THE APP HALF AND ONLY THE APP HALF. The table, the trigger, the
   three-version ceiling and who may read or call what are SQL, and they are
   held by `npm run rls` against a real PostgreSQL — 26 attempts, watched
   going red twice before they went green. Re-asserting them here would mean
   writing the trigger a second time in JavaScript, and **a check that
   recomputes the thing under test is a copy of it, and a copy always agrees**
   (CLAUDE.md rule 12). So the stub below is a dumb shelf: it hands back rows
   and records calls. It does not keep a ceiling and it does not decide who is
   staff.

   What is asked here is the half no database can answer:

     1. the recovery screen draws that person's languages, and one language's
        VERSIONS — each the whole language before one save, the three newest,
        newest first, one row each and no part names (「言語を前に戻す →
        『3つ前、まるごと』」 OWNER 2026-09-24); a language with none has no row
     2. pressing a version ASKS FIRST (the app's own popup — confirm() is
        banned) and only 「戻す」 sends admin_restore_lang, carrying the exact
        (language, v) that was on the row
     3. **THE ROAD BACK TO THE PERSON'S PHONE, WHICH IS ONE ROAD.** A restore
        lands on `slice`; it reaches them through netLangsWalk() on their next
        launch and through nothing else. The slices are in memory (rule 22),
        so an app that has been closed is holding nothing and what comes down
        is what it shows.
     4. and the limit that comes with having one road rather than two: an app
        left OPEN is holding the old version and does not take the new one.
        That is written down here as a claim rather than left for somebody to
        find, because it is what the operator has to say out loud —
        「アプリを一度閉じて開き直してください」.

   Run: node tools/hist-check.mjs                                        */
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

/* ---- a shelf behind the one transport ----------------------------------
   netSend() is the only road out of www/net.js, so stubbing it leaves
   netHist(), netRestore(), netLangsWalk() and the merge running for real. */
const SERVER = `
  window.__SRV = { lang:[], slice:[], hist:[], calls:[], deny:false };
  netSend = function(method, p, body, tok, ok, bad){
    var S = window.__SRV;
    S.calls.push({ m:method, p:p, body:body });
    function answer(v){ setTimeout(function(){ ok(v); }, 0); }
    function refuse(){ setTimeout(function(){ bad(null, 400, 'not staff'); }, 0); }
    function arg(k){
      var m = new RegExp('[?&]' + k + '=eq\\\\.([^&]*)').exec(p);
      return m ? decodeURIComponent(m[1]) : '';
    }
    /* THE TWO THE OPERATOR CALLS. Both are is_staff() on the server, so the
       only thing a phone can do about a refusal is show it: S.deny is that
       refusal arriving, not a rule this file keeps. */
    if (p.indexOf('/rest/v1/rpc/admin_hist') === 0){
      if (S.deny) return refuse();
      return answer({ who:'them', langs:S.lang.map(function(l){
                        return { id:l.id, name:l.name }; }),
                      hist:S.hist.slice(0) });
    }
    /* A version is named by v; what each kind was before that save is
       the server's arithmetic (admin_restore_lang, held by npm run rls), so
       the shelf just carries the bodies a version stands for. */
    if (p.indexOf('/rest/v1/rpc/admin_restore_lang') === 0){
      if (S.deny) return refuse();
      var i, h = null, kk;
      for (i = 0; i < S.hist.length; i++)
        if (S.hist[i].language === body.language && S.hist[i].v === body.v) h = S.hist[i];
      if (!h) return refuse();
      for (kk in h.bodies) for (i = 0; i < S.slice.length; i++)
        if (S.slice[i].language === h.language && S.slice[i].kind === kk)
          S.slice[i].body = h.bodies[kk];
      return answer(null);
    }
    /* AND THE REST OF THE OPERATOR'S SCREEN, which adminLoad() asks in one
       press. S.staffDeny is the staff list being refused. */
    if (p.indexOf('/rest/v1/rpc/admin_counts') === 0) return answer({ reports:0 });
    if (method === 'GET' && p.indexOf('/rest/v1/profile?select=id,handle,admin:profile_admin&staff') === 0){
      if (S.staffDeny) return refuse();
      return answer(S.staff || []);
    }
    if (method === 'GET' && p.indexOf('/rest/v1/feedback') === 0) return answer([]);
    if (method === 'GET' && p.indexOf('/rest/v1/slice') === 0){
      var want = arg('language'), out = [], q;
      for (q = 0; q < S.slice.length; q++) if (S.slice[q].language === want)
        out.push({ kind:S.slice[q].kind, body:S.slice[q].body, no:S.slice[q].no || 1 });
      return answer(out);
    }
    if (method === 'GET' && p.indexOf('/rest/v1/language_take') === 0) return answer([]);
    if (method === 'GET' && p.indexOf('/rest/v1/language') === 0)
      return answer(S.lang.map(function(l){
        return { id:l.id, owner:l.owner, name:l.name, wsys:'', published_at:null }; }));
    if (method === 'POST' && p.indexOf('/rest/v1/slice') === 0){
      var rows = (body instanceof Array) ? body : [body], k, r, f, hit;
      for (k = 0; k < rows.length; k++){
        r = rows[k]; hit = null;
        for (f = 0; f < S.slice.length; f++)
          if (S.slice[f].language === r.language && S.slice[f].kind === r.kind) hit = S.slice[f];
        if (hit) hit.body = r.body;
        else S.slice.push({ language:r.language, kind:r.kind, body:r.body, no:r.no });
      }
      return answer([]);
    }
    return setTimeout(function(){ bad(null, 404, 'no route ' + method + ' ' + p); }, 0);
  };
`;

/* ---- 1. the screen ------------------------------------------------------ */
const scr = await pg.evaluate(async ({ s, srv }) => {
  eval('(' + s + ')()');
  SET.walked = true;
  eval(srv);
  SESS = { at:'t', rt:'r', uid:'op', anon:false };
  const S = window.__SRV;
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }

  S.lang = [{ id:'L1', owner:'them', name:'Kano' },
            { id:'L2', owner:'them', name:'Nen' }];
  /* The language's three versions, newest first -- the order admin_hist()
     gives them (`order by sv.at desc`, supabase/schema.sql). THE SCREEN DOES
     NOT SORT OR GROUP THEM AGAIN: which versions there are and in what order
     is the server's answer. One comes in a slightly odd order on purpose
     (22:05 on the 8th after 03:10 on the 9th) so a screen that sorted by
     itself would be caught, and one row of another language is in the list
     so a screen that forgot to pick the language would be. */
  S.hist = [{ language:'L1', v:'p3', at:'2026-09-09T04:20:00Z', bodies:{} },
            { language:'L1', v:'p2', at:'2026-09-09T03:10:00Z', bodies:{} },
            { language:'L3', v:'q1', at:'2026-09-08T23:00:00Z', bodies:{} },
            { language:'L1', v:'p1', at:'2026-09-08T22:05:00Z', bodies:{} }];

  ADMIN_OK = true; ADREC = null; ADREC_H = 'veth'; ADREC_ERR = '';
  window.route = 'admin'; NAV = [{ r:'admin' }, { r:'admin', a:'rec' }];
  adRecFind();
  await wait(60);

  const out = {};
  out.asked = S.calls.filter(function(c){ return c.p.indexOf('admin_hist') >= 0; })
                     .map(function(c){ return c.body.handle; });
  const list = vAdmin();
  out.langs = (list.indexOf('Kano') >= 0) && (list.indexOf('Nen') >= 0);
  /* And the door to one of them is this route wearing another face, so no
     screen had to be registered for it. */
  out.door = list.indexOf('&quot;admin&quot;,&quot;rec:L1&quot;') >= 0 ||
             list.indexOf('["admin","rec:L1"]') >= 0;

  NAV = [{ r:'admin' }, { r:'admin', a:'rec' }, { r:'admin', a:'rec:L1' }];
  const one = vAdmin();
  out.parts = one.split('data-do="adRecPick"').length - 1;
  /* Newest first, as the server said, and nothing of L3's. */
  out.order = one.indexOf('04:20') < one.indexOf('03:10') &&
              one.indexOf('03:10') < one.indexOf('22:05') && one.indexOf('23:00') < 0;
  /* AND NO PART IS NAMED. A version is the whole language, so a heading
     over some of the rows would be the screen saying there are parts to
     choose between -- which is what it said until 2026-09-25. Asked of the
     rows' class: every `.set` on the face is a version or nothing. */
  out.grouped = (one.split('class="set"').length - 1) === out.parts;
  out.rowsOfL2 = (function(){
    NAV = [{ r:'admin' }, { r:'admin', a:'rec:L2' }];
    const two = vAdmin();
    return two.split('data-do="adRecPick"').length - 1;
  })();
  return out;
}, { s: seed.toString(), srv: SERVER });

console.log('\n  復旧の画面');
say(scr.asked.length === 1 && scr.asked[0] === 'veth',
    'handle を打つと admin_hist がその handle で一度だけ出る（' +
    JSON.stringify(scr.asked) + '）');
say(scr.langs, 'その人の言語が並ぶ ── Kano と Nen');
say(scr.door, '一つ押すと同じルートの別の面へ（admin / rec:L1）── ' +
    '新しいルートは登録していない');
say(scr.parts === 3, '言語の版が三つ並ぶ ── 版はその保存の前の言語まるごと（' +
    scr.parts + '）');
say(scr.order, 'サーバーの順を保つ ── 新しい版が上（04:20 → 03:10 → 22:05）、ほかの言語の版は出ない');
say(scr.grouped, '部分の見出しは無い ── 行は全部が版（「3つ前、まるごと」）');
say(scr.rowsOfL2 === 0,
    '版の無い言語は行が無い ── 押せない行を一つも描かない（' + scr.rowsOfL2 + '）');

/* ---- 2. asking before doing it ------------------------------------------ */
const ask = await pg.evaluate(async ({ srv }) => {
  const S = window.__SRV;
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }
  S.slice = [{ language:'L1', kind:'words', body:'["いまの姿"]' },
             { language:'L1', kind:'kb',    body:'["いまの鍵"]' }];
  S.hist = [{ language:'L1', v:'p2', at:'2026-09-09T03:10:00Z',
              bodies:{ words:'["もどした姿"]', kb:'["もどした鍵"]' } }];
  S.calls = [];
  const out = {};

  /* Pressed, then answered NO. Nothing may have gone out. */
  adRecPick('L1', 'p2');
  out.popped = !!(document.getElementById('pop') &&
                  document.getElementById('pop').classList.contains('on'));
  popNo();
  await wait(60);
  out.sentAfterNo = S.calls.filter(function(c){ return c.p.indexOf('admin_restore') >= 0; }).length;

  /* And now YES -- pressed on the ROW, the way the operator does. */
  NAV = [{ r:'admin' }, { r:'admin', a:'rec' }, { r:'admin', a:'rec:L1' }];
  ADREC = { who:'them', langs:[{ id:'L1', name:'Kano' }],
            hist:[{ sid:'L1', v:'p2', at:'2026-09-09T03:10:00Z', ms:Date.parse('2026-09-09T03:10:00Z') }] };
  window.route = 'admin'; render();
  const row = document.querySelector('[data-do="adRecPick"]');
  if (row) row.click();
  popYes();
  await wait(120);
  const r = S.calls.filter(function(c){ return c.p.indexOf('admin_restore') >= 0; });
  out.sent = r.length;
  out.body = r.length ? r[0].body : null;
  out.slice = S.slice[0].body + S.slice[1].body;
  /* And the list is asked for again, so the undo the server just made is a row
     on the screen rather than something the operator has to go and find. */
  out.reasked = S.calls.filter(function(c){ return c.p.indexOf('admin_hist') >= 0; }).length;

  /* And a refusal from the server is what the screen says, rather than a
     restore that quietly did not happen. */
  S.deny = true; S.calls = [];
  adRecPick('L1', 'p2');
  popYes();
  await wait(120);
  out.err = String(ADREC_ERR || '');
  out.offline = t('net.offline');
  S.deny = false;
  return out;
}, { srv: SERVER });

console.log('\n  戻す前に訊く');
say(ask.popped, '版を押すとこのアプリ自身のポップが出る ── 標準の confirm() は禁止');
say(ask.sentAfterNo === 0, '「いいえ」で admin_restore_lang は一度も出ない（' +
    ask.sentAfterNo + '）');
say(ask.sent === 1 && ask.body && ask.body.language === 'L1' && ask.body.v === 'p2' &&
    !('kind' in ask.body),
    '「戻す」で押した行の版そのものが出る ── 言語と版だけで、部分は無い（' +
    JSON.stringify(ask.body) + '）');
say(ask.slice === '["もどした姿"]["もどした鍵"]', 'サーバーの言語がまるごとその版になる ── 単語も鍵も');
say(ask.reasked >= 1, '戻したあと一覧を訊き直す ── 戻すのを戻せる行が出る');
say(!!ask.err && ask.err !== ask.offline,
    '断られたら画面がサーバーの答えを言う ── 「接続できません」ではない（' +
    JSON.stringify(ask.err) + '）');

/* ---- 2b. who answers the reports ---------------------------------------
   The list on the same screen. Two things, and neither can throw:
     - which row is the account above staff is the SERVER's to say --
       `admin:profile_admin` on the row, profile_admin() in
       supabase/schema.sql -- and not a handle the phone compares
       (~~`ADMIN_HANDLE`~~). S.staff is what that database sends.
     - and a staff row is pressable, which is also what shows the list
       arrived at all: with none drawn, 「@lingua is not pressable」 holds
       of an empty list.
     - a list that was refused is not an empty list (CLAUDE.md § Data). */
const staff = await pg.evaluate(async () => {
  const S = window.__SRV;
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }
  const out = {};
  S.staff = [{ id:'u9', handle:'lingua', admin:true }, { id:'u1', handle:'mod', admin:false }];
  ADMIN_OK = true; ADMIN_BUSY = false; window.route = 'admin'; NAV = [{ r:'admin' }];
  adminLoad();
  await wait(150);
  let h = vAdmin();
  out.lingua = h.indexOf('data-do="adminStaffDrop" data-a="[&quot;lingua&quot;]"') >= 0 ||
               h.indexOf('[\"lingua\"]') >= 0 || /adminStaffDrop[^>]*lingua/.test(h);
  out.mod = /adminStaffDrop[^>]*mod/.test(h);
  S.staffDeny = true;
  adminLoad();
  await wait(150);
  out.list = ADMINS;
  /* What a refusal says is netWhy()'s, asked of the page rather than
     written out here, and it has to be ON the screen. */
  out.err = netWhy(null, 400);
  h = vAdmin();
  out.drawn = h.indexOf(esc(out.err)) >= 0;
  S.staffDeny = false;
  return out;
});
console.log('\n  報告に答える人');
say(!staff.lingua, '権限者の行（@lingua）は押せない ── 決めるのはサーバーの ' +
    'admin:profile_admin（端末が handle を比べるのではない）');
say(staff.mod, 'スタッフの行は押せる（@mod）');
say(staff.list === null,
    '断られた一覧は空の一覧ではない ── ADMINS=' + JSON.stringify(staff.list));
say(!!staff.drawn, 'そして画面の一覧の場所に何が起きたかが出る（' + JSON.stringify(staff.err) + '）');

/* ---- 3. the road to the person's phone ---------------------------------- */
const road = await pg.evaluate(async ({ srv }) => {
  const S = window.__SRV;
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }
  const out = {};

  /* THE PERSON, ON THEIR OWN PHONE, OPENING THE APP. The slices are in memory
     (rule 22), so an app that has been closed is holding nothing — which is
     what this empties, and it is the state every cold launch is in. */
  SESS = { at:'t', rt:'r', uid:'them', anon:false };
  LANGS = {}; langId = '';
  for (const x in LSL) if (Object.prototype.hasOwnProperty.call(LSL, x)) delete LSL[x];
  S.lang = [{ id:'L1', owner:'them', name:'Kano' }];
  S.slice = [{ language:'L1', kind:'words', body:'[{"hw":"restored"}]' }];
  /* which languages this account has, and then the language itself, the way
     arriving at one of its screens brings it (www/net.js § netLangFill,
     OWNER 2026-09-23 「読むのは開いた画面の分だけ」) */
  await new Promise(function(f){ netLangsDown(function(){ netLangFill('L1', f, f); }, f); });
  await wait(300);

  /* THE ID ON THIS PHONE IS THE ID ON THE SERVER (2026-09-10). A language has
     one number and the row arriving is filed under its own, so this used to
     hunt the index for the row carrying `L1` as `sid` and now simply asks
     whether `L1` is there. */
  const nid = LANGS['L1'] ? 'L1' : '';
  out.nid = !!nid;
  const k = nid ? langKeyOf(nid, 'words') : '';
  out.cold = !!nid && (slRd(k) || '').indexOf('restored') >= 0;

  /* AND AN APP LEFT OPEN DOES NOT TAKE IT, which is the price of there being
     one road rather than two: netLangFill() fills in what is MISSING and
     stops, because a slice this phone is holding may be a minute of somebody's
     typing that has not gone up yet (docs/DATA_SAFETY.md rule 2). */
  slWr(k, '[{"hw":"still-open"}]');
  S.slice = [{ language:'L1', kind:'words', body:'[{"hw":"restored-again"}]' }];
  /* which languages this account has, and then the language itself, the way
     arriving at one of its screens brings it (www/net.js § netLangFill,
     OWNER 2026-09-23 「読むのは開いた画面の分だけ」) */
  await new Promise(function(f){ netLangsDown(function(){ netLangFill('L1', f, f); }, f); });
  await wait(300);
  out.open = (slRd(k) || '').indexOf('still-open') >= 0;

  /* And the same phone, closed and opened: it takes it. The index survives a
     launch and the slices do not, which is the state rule 22 describes — so
     the entry is still here and the walk fills it. */
  for (const x in LSL) if (Object.prototype.hasOwnProperty.call(LSL, x)) delete LSL[x];
  /* which languages this account has, and then the language itself, the way
     arriving at one of its screens brings it (www/net.js § netLangFill,
     OWNER 2026-09-23 「読むのは開いた画面の分だけ」) */
  await new Promise(function(f){ netLangsDown(function(){ netLangFill('L1', f, f); }, f); });
  await wait(300);
  out.again = (slRd(k) || '').indexOf('restored-again') >= 0;

  /* AND THERE IS NO SECOND ROAD. The restore reached this phone as an ordinary
     slice: nothing in www/ ever asks the server about slice_hist, which is
     also why nobody but the operator can see a version. */
  out.roads = S.calls.filter(function(c){ return c.p.indexOf('slice_hist') >= 0; }).length;
  return out;
}, { srv: SERVER });

console.log('\n  本人の端末に届く道');
say(road.nid, 'サーバーの id そのもので索引に入る ── 番号は一本（2026-09-10）');
say(road.cold, 'アプリを開き直すと戻った中身が出る ── その言語の画面に進むと netLangFill 一本');
say(road.open, 'アプリを開いたままだと届かない ── 端末が持っているものは' +
    '書き換えない（規則：無いものを埋めて止まる）。運営はその人に' +
    '「一度閉じて開き直して」と言うことになる');
say(road.again, 'そのあと閉じて開けば届く');
say(road.roads === 0, '二つ目の同期は無い ── slice_hist を訊く道は www/ に一本も無い（' +
    road.roads + '）');

await br.close();
if (bad.length){
  console.log('\nhist: ' + bad.length + ' 件が赤');
  process.exit(1);
}
console.log('\nhist: ' + '運営が戻した版は、その人がアプリを開き直したときに届く。' +
            '\n      表と天井と誰が読めるかは SQL 側 ── npm run rls');
