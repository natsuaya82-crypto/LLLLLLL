/* 表を出すためだけのもの。ゲートには入れない。
   サーバーから何かを取ってくる画面を全部あげて、今どれに引き下ろしが有り、
   どれに無いか ── **読んで数えるのではなく、実際に開いて数える。**
   netSend() だけを偽物にして、画面に入ってから 1.2 秒に出て行った要求を数える。
   node tools/pull-table.mjs                                                */
import { seed } from './fixture.mjs';
import { fileURLToPath } from 'url';
import path from 'path';
import { chromium, LAUNCH } from './browser.mjs';
const dir = path.dirname(fileURLToPath(import.meta.url));

const br = await chromium.launch(LAUNCH);
const pg = await br.newPage({ viewport:{ width:390, height:844 } });
await pg.goto('file://' + path.join(dir, '..', 'www', 'index.html'));
await pg.waitForSelector('#splash', { state:'detached', timeout:20000 });

const SETUP = "(function(){\n  eval('(' + s + ')()');\n  SET.done = true; SET.plan = 'pro';\n  SESS = { at:'t', rt:'r', uid:'me3', anon:false };\n  if (typeof ME !== 'undefined' && ME && !ME.handle) ME.handle = 'lingua';\n  LANGS[langId].uid = 'me3'; LANGS[langId].mine = true;\n  LANGS[langId].sid = 'srv-known'; langStore();\n  /* 一つの窓だけを偽物にする。上の netLangRow / netSlices / netSlicePut などは\n     本物のまま走る（CLAUDE.md 規則12）。 */\n  window.__ASK = [];\n  netSend = function(method, p, body, tok, ok, bad){\n    window.__ASK.push(method + ' ' + String(p).split('?')[0]);\n    setTimeout(function(){ ok([]); }, 0);\n  };\n})";
async function fresh(){
  await pg.reload();
  await pg.waitForSelector('#splash', { state:'detached', timeout:20000 });
  await pg.evaluate(({ s, body }) => { eval('(' + s + ')()'); eval('(' + body + ')()'); },
    { s: seed.toString(), body: SETUP });
}
await fresh();

/* どの画面に、どの引数の顔があるか。act-check の walkArg と同じ考えで、
   引数を取る画面は代表を一つ開く。 */
const faces = await pg.evaluate(() => {
  var out = [], r;
  var arg = {
    set: 'data', gram: (typeof gramArgs === 'function' && gramArgs()[0]) || '',
    kb: '0', ltset: (typeof LT_KINDS !== 'undefined' && LT_KINDS[0]) || '',
    fm: 'tira',
    wldart: (typeof wldArts === 'function' && (wldArts()[0] || {}).id) || '',
    thread: (typeof postAll === 'function' && (postAll()[0] || {}).id) || '',
    photo: (function(){ var ps = (typeof postAll === 'function') ? postAll() : [];
             for (var i = 0; i < ps.length; i++) if (postPics(ps[i]).length) return ps[i].id + ':0';
             return ''; })(),
    follows: 'ers', letters: '', words: '', notes: '',
    profile: (typeof meFollowing === 'function' && meFollowing()[0]) || '',
    about: '', world: ''
  };
  for (r in PAGES) if (Object.prototype.hasOwnProperty.call(PAGES, r))
    out.push({ r: r, a: Object.prototype.hasOwnProperty.call(arg, r) ? arg[r] : '',
               tab: PAGES[r].tab || '', pull: !!(typeof PULL_ON !== 'undefined' && PULL_ON[r]) });
  return out;
});

const rows = [];
for (const f of faces){
  /* **画面ごとにアプリを開き直す。**そうしないと、前の画面が始めた
     やり直しのタイマー（dayAgain の 1→2→4 秒、notices の呼び直し）が
     次の画面の数に混ざる ── 一度それで数えて、build にも kb にも plans にも
     prompt が立っていた。あれは前の画面の続きで、その画面が訊いたものでは
     ない。 */
  await fresh();
  const got = await pg.evaluate(async ({ r, a }) => {
    function wait(ms){ return new Promise(function(x){ setTimeout(x, ms); }); }
    /* **起動そのものが出す要求を先に済ませてから数える。**開き直した直後は
       notices の札と netLangsDown/netLangSync が必ず走るので、そのままだと
       どの画面にも同じ三件が付いて、画面が訊いたものと区別がつかない ──
       一度それで数えて、37 画面ぜんぶが「要求あり」になった。 */
    await wait(1800);
    window.__ASK = [];
    var threw = '';
    try { go(r, a); render(); } catch (e) { threw = e.message; }
    await wait(1200);
    return { ask: window.__ASK.slice(), threw: threw,
             screen: JSON.stringify(NAV[NAV.length - 1] || null) };
  }, f);
  rows.push(Object.assign({}, f, got));
}

/* 自分のプロフィール（引数なし）も別の顔として見る */
console.log('');
console.log('route          tab       引数        引き下ろし  開いて出た要求');
console.log('-------------- --------- ----------- ----------- ------------------------------');
for (const x of rows){
  const uniq = [];
  x.ask.forEach(q => { if (uniq.indexOf(q) < 0) uniq.push(q); });
  console.log(
    x.r.padEnd(14) + ' ' + (x.tab || '-').padEnd(9) + ' ' +
    (x.a || '-').slice(0, 11).padEnd(11) + ' ' +
    (x.pull ? '有り' : '**無し**').padEnd(13) + ' ' +
    (x.threw ? 'THREW ' + x.threw : (uniq.length ? x.ask.length + '件 ' + uniq.join(' / ') : '0件')));
}
console.log('');
console.log('画面の数 ' + rows.length + '、うち開いて要求が出たもの ' +
  rows.filter(x => x.ask.length).length + '、引き下ろしが有るもの ' +
  rows.filter(x => x.pull).length);
await br.close();
