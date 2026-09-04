/* 起動の同じ瞬間に、降ろす道と上げる道が両方走る。
   ---------------------------------------------------------------------
   **同じ言語が、一覧に二つ並ぶことがあります。**

   `bootSession()`（`www/boot.js`）は `netLangsDown()` と `netLangSync()` を
   続けて呼び、**どちらも待ちません。**片方はサーバーの言語をこの iPhone に
   降ろす道で、もう片方はこの iPhone の言語をサーバーへ上げる道です。

     netLangsDown()  GET  /rest/v1/language?owner=eq.<me>
     netLangSync()   POST /rest/v1/language          ← まだ `sid` が無いとき

   `netLangsDown()` は「この iPhone が既に持っている `sid`」を**問い合わせを
   出す前に**控えて、答えが返ってきたときにそれと突き合わせます。ところが
   その間に `netLangSync()` の POST が通ると、**同じ言語の行がサーバーに
   出来て、控えには無い**。だから `langMint()` が走って、**同じ一つの言語が
   二つ目の入れ物を持ちます。**

   **その言語が初めてサーバーへ上がる一回だけ**です ── 二度目からは `sid`
   が付いているので控えに入り、上げる道も何も作りません。だから一度きりで、
   しかも起こったあとは消えません。

   偽物は `netSend()` だけ ── `www/net.js` の全部の要求が通る一箇所なので、
   `netLangRow()` も `netLangsDown()` も `netLangSync()` も本物が走ります。
   そして押すのは `bootSession()` そのものです。二本を検査から順に呼べば、
   検査が起動の順番を書き直したことになります（CLAUDE.md 規則 12）。

   走らせ方: node tools/twice-check.mjs                                   */
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
await pg.evaluate(seed);

/* ---- 配列で出来たサーバー、輸送の一箇所の裏に --------------------------
   `GET /rest/v1/language` だけが遅れて答えます。**それがこの検査の全部**で、
   本物の順番のうち「POST が先に処理された」ほうを選んで見せています ──
   同じ瞬間に出た二本にどちらが先という約束は無いので、これは起こる順番の
   一つです。行はサーバーが**答えるとき**に読みます（受け取ったときでは
   なく）。本物のサーバーもそうします。 */
await pg.evaluate(() => {
  window.__SRV = { lang:[], slice:[], n:0, log:[] };
  netSend = function(method, p, body, tok, ok, bad){
    var S = window.__SRV;
    S.log.push(method + ' ' + p.split('?')[0]);
    function answer(v, ms){ setTimeout(function(){ ok(v); }, ms || 0); }
    function arg(k){
      var m = new RegExp('[?&]' + k + '=eq\\.([^&]*)').exec(p);
      return m ? decodeURIComponent(m[1]) : '';
    }
    if (method === 'POST' && p.indexOf('/rest/v1/language') === 0){
      var id = 'srv' + (++S.n);
      S.lang.push({ id:id, owner:body.owner, name:body.name || '' });
      return answer([{ id:id }]);
    }
    if (method === 'GET' && p.indexOf('/rest/v1/language') === 0){
      var own = arg('owner'), byId = arg('id');
      /* 遅れて答える。答えを作るのは答える瞬間。 */
      setTimeout(function(){
        var out = [], z;
        for (z = 0; z < S.lang.length; z++)
          if ((own && S.lang[z].owner === own) || (byId && S.lang[z].id === byId))
            out.push({ id:S.lang[z].id, owner:S.lang[z].owner, name:S.lang[z].name });
        S.log.push('ANSWER GET /rest/v1/language');
        ok(out);
      }, 250);
      return;
    }
    if (method === 'POST' && p.indexOf('/rest/v1/slice') === 0){
      var rows = (body instanceof Array) ? body : [body], k, r, f, hit;
      for (k = 0; k < rows.length; k++){
        r = rows[k]; hit = null;
        for (f = 0; f < S.slice.length; f++)
          if (S.slice[f].language === r.language && S.slice[f].kind === r.kind) hit = S.slice[f];
        if (hit){ hit.body = r.body; hit.no = r.no; }
        else S.slice.push({ language:r.language, kind:r.kind, body:r.body, no:r.no });
      }
      return answer([]);
    }
    if (method === 'GET' && p.indexOf('/rest/v1/slice') === 0){
      var want = arg('language'), out2 = [], q;
      for (q = 0; q < S.slice.length; q++) if (S.slice[q].language === want)
        out2.push({ kind:S.slice[q].kind, body:S.slice[q].body, no:S.slice[q].no });
      return answer(out2);
    }
    /* 起動が訊く残りぜんぶ ── プラン、プロフィール、通報の係。この検査が
       何も言わないものは、素直に空で答えます。 */
    return answer([]);
  };
});

/* ---- 一度も上がったことのない言語を一つ持って、起動する ----------------
   `sid` が無いのが「初めて上がる」という状態そのものです。`uid` は押します
   ── `langOwned()` が答えないと `langMineIds()` に入らず、上げる道が
   走りません。それはこの検査が見たい場面ではありません。 */
async function boot(){
  return await pg.evaluate(() => new Promise(function(done){
    var id;
    window.__SRV.lang = []; window.__SRV.slice = []; window.__SRV.n = 0;
    window.__SRV.log = [];
    SET.done = true;
    SESS = { at:'t', rt:'r', uid:'me', anon:false };
    NET_SYNCING = false;
    for (id in LANGS){
      if (!Object.prototype.hasOwnProperty.call(LANGS, id)) continue;
      delete LANGS[id].sid;
      LANGS[id].uid = 'me';
      LANGS[id].mine = true;
    }
    langStore();
    var before = 0;
    for (id in LANGS) if (Object.prototype.hasOwnProperty.call(LANGS, id)) before++;
    bootSession();
    setTimeout(function(){
      var here = [], sids = {}, twice = 0, k;
      for (k in LANGS){
        if (!Object.prototype.hasOwnProperty.call(LANGS, k)) continue;
        here.push(k + (LANGS[k].sid ? ':' + LANGS[k].sid : ':-'));
        if (LANGS[k].sid){
          if (sids[LANGS[k].sid]) twice++;
          sids[LANGS[k].sid] = 1;
        }
      }
      done({ before:before, after:here.length, here:here, twice:twice,
             rows:window.__SRV.lang.length, log:window.__SRV.log.slice() });
    }, 2000);
  }));
}

const r = await boot();
say(r.before === 1, '起動の前、この iPhone の言語は一つ (' + r.before + ')');
say(r.rows === 1,
    '起動のあと、サーバーの言語も一つ (' + r.rows + ' 行)');
say(r.after === 1,
    '起動のあとも、この iPhone の言語は一つ ── 二つに増えない (' +
    r.after + ': ' + r.here.join(' ') + ')');
say(r.twice === 0,
    '同じ sid を持つ入れ物は二つ無い (重なり ' + r.twice + ')');

/* ---- 降ろし終わってから上げる ------------------------------------------
   上の四本は「そうなっている」ことしか言いません。**なぜそうなるか**は
   順番で、そこが崩れれば四本とも別の理由で緑になり得ます ── 例えば偽の
   サーバーが速く答えただけ、というように。だから順番そのものを測ります。

   **降ろす GET が答えるより先に**、言語を作る POST が出てはいけません。
   出ていく順ではなく答えが返る順です ── 二本とも同じ瞬間に出ていくのが
   いまの姿なので、「出ていった順」を測ると壊れたままでも緑になります。 */
const order = r.log.filter(function(l){ return l.indexOf('language') !== -1; });
const iGet  = order.indexOf('ANSWER GET /rest/v1/language');
const iPost = order.indexOf('POST /rest/v1/language');
say(iGet !== -1, '降ろす道は走って答えた (GET /rest/v1/language)');
say(iPost !== -1, '上げる道も走った (POST /rest/v1/language)');
say(iGet !== -1 && iPost !== -1 && iGet < iPost,
    '降ろす道が答えてから上げる道が出る (' + order.join(' | ') + ')');

/* ---- 二度目の起動では何も作らない --------------------------------------
   `sid` が付いたので、降ろす道は控えでそれを見つけて何もせず、上げる道は
   行を作りません。ここが緑でないと、上の四本は「毎回二つ増える」を
   「一度だけ増える」と読み違えていることになります。 */
const again = await pg.evaluate(() => new Promise(function(done){
  window.__SRV.log = [];
  NET_SYNCING = false;
  var rows = window.__SRV.lang.length;
  bootSession();
  setTimeout(function(){
    var n = 0, k;
    for (k in LANGS) if (Object.prototype.hasOwnProperty.call(LANGS, k)) n++;
    done({ langs:n, rows:window.__SRV.lang.length, was:rows,
           made:window.__SRV.log.filter(function(l){
             return l === 'POST /rest/v1/language'; }).length });
  }, 2000);
}));
say(again.langs === 1 && again.rows === again.was && again.made === 0,
    'もう一度起動しても増えない (言語 ' + again.langs + ' / 行 ' +
    again.rows + ' / 作った ' + again.made + ')');

await br.close();
console.log(bad.length ? '\ntwice: FAILED ' + bad.length
                       : '\ntwice: 起動は先に降ろしてから上げる。同じ言語が二つに増えない');
process.exit(bad.length ? 1 : 0);
