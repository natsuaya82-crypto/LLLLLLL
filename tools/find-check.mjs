/* 人の検索 ── 打った文字が誰に届き、答えが画面に出る。
   ---------------------------------------------------------------------
   人を探すのは、このアプリで知らない誰かに初めて出会う道です。辞書の検索
   にも文字の検索にも検査があるのに、**人の検索には一本もありませんでした**
   ── `netFindWho` / `netFindPosts` / `snsFind` を名前で持っているのは
   `tools/fixture.mjs`（差し替え）と `tools/sides-check.mjs`（禁止語）だけで、
   どちらもこの道が動くことについては何も言っていない。だから壊れても
   三十四本は緑のまま出ます。**同じ苦情が二度来たのがその証拠です。**

   一度目 2026-08-25 (`2e6bfad`)、「検索で @ を打っても誰も出てこない」。
   `snsFind()` が `@` ごとサーバーへ渡していた。先頭の `@` を落として直した。
   二度目 2026-09-03、**同じ画面で同じ言葉**。「@で検索しても出てこない」。
   落としていたのは `/^@+/` ── U+0040 だけで、日本語キーボードが出す
   全角 `＠`（U+FF20）は素通りしていた。`profile.handle` は
   `^[a-z0-9_]{2,24}$` なので `handle.ilike.*＠aya*` は必ず 0 件。
   **一度目の修正に検査が付いていれば、二度目は無かった。**それがこの
   ファイルです。

   偽物は `netSend()` だけ ── `www/net.js` の全部の要求が通る一箇所なので、
   `netLike()` も `netFindWho()` も `netLangNames()` も本物が走ります。
   `netFindWho` を差し替える検査は自分の答えを訊き返すだけです（CLAUDE.md 規則 12）。

   走らせ方: node tools/find-check.mjs                                    */
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

/* ---- 一人だけいるサーバー、輸送の一箇所の裏に ---------------------------
   `handle` は 'aya'、`display` は 'Aya Tanaka'。表示名に空白があるのは
   `netHandleOf()` のような空白潰しをここで使うと壊れるからで、それを
   言うための人です。

   `__MODE` は答え方を変えます: 'ok' 素直に、'profile400' 人の問いが落ちる
   （`alter table profile add column if not exists av` がまだ当たっていない
   データベースがこれ）、'lang400' 言語の名前を訊く二本目だけが落ちる。 */
await pg.evaluate(() => {
  window.__MODE = 'ok';
  window.__ASK = [];
  window.__POSTS = [];
  window.__FIELDS = [];
  window.__RECENT = [];
  window.__BYPR = 0;
  netSend = function(m, p, b, t, ok, bad, up){
    window.__ASK.push(p);
    var M = window.__MODE;
    if (p.indexOf('/rest/v1/profile') === 0){
      if (M === 'profile400'){
        setTimeout(function(){ bad({ message:'column profile.av does not exist' }, 400); }, 0);
        return;
      }
      /* 本物の PostgREST と同じ読み方で `handle.ilike.*…*` を読む。
         中の文字は netLike() が入れたものなので、ここは答えるだけ。 */
      var q = decodeURIComponent(p);
      var mm = /handle\.ilike\.\*([^*,)]*)\*/.exec(q);
      var n = mm ? mm[1].toLowerCase() : null;
      var rows = [];
      if (n !== null && ('aya'.indexOf(n) !== -1 || 'aya tanaka'.indexOf(n) !== -1))
        rows = [{ id:'u-aya', handle:'aya', display:'Aya Tanaka', av:null }];
      setTimeout(function(){ ok(rows); }, 0);
      return;
    }
    if (p.indexOf('/rest/v1/language') === 0){
      if (M === 'lang400'){ setTimeout(function(){ bad({ message:'boom' }, 400); }, 0); return; }
      setTimeout(function(){ ok([]); }, 0);
      return;
    }
    /* ---- 投稿。書いたものを持って、訊かれたら渡す ----------------------
       `post_seen` を先に見ること ── `post` で始まっているので、順番を
       入れ替えると検索の問いが投稿を書く道に落ちます。 */
    if (p.indexOf('/rest/v1/post_seen') === 0){
      if (M === 'post400'){
        setTimeout(function(){ bad({ message:'relation post_seen does not exist' }, 400); }, 0);
        return;
      }
      /* 本物の PostgREST と同じ読み方で `body->>ln.ilike.*…*` を読む。
         `*` は `%`、`ilike` は大文字小文字を区別しない。当たった鍵は
         記録して、検査が「どこに当たったか」を訊けるようにしてある。 */
      var qq = decodeURIComponent(p), pats = [], mm;
      var re = /body->>([a-z]+)\.ilike\.(\*[^*,)]*\*)/g;
      while ((mm = re.exec(qq))) pats.push([mm[1], mm[2]]);
      window.__FIELDS = pats.map(function(a){ return a[0]; });
      /* お題で集める問い ── 本文の文字合わせではなく、列そのものです。
         `prompt` は列で、索引が後ろに在ります（`supabase/schema.sql`）。 */
      var pm = /[?&]prompt=eq\.([^&]*)/.exec(qq);
      if (pm){
        var only = [];
        for (var pi = 0; pi < window.__POSTS.length; pi++)
          if (String(window.__POSTS[pi].prompt || '') === pm[1])
            only.push(window.__POSTS[pi]);
        window.__BYPR = (window.__BYPR || 0) + 1;
        setTimeout(function(){ ok(only); }, 0);
        return;
      }
      var hits = [];
      for (var i = 0; i < window.__POSTS.length; i++){
        var row = window.__POSTS[i], on = !pats.length;
        for (var j = 0; j < pats.length; j++){
          var val = (row.body || {})[pats[j][0]];
          var rx = new RegExp('^' + pats[j][1]
                     .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
                     .replace(/\*/g, '[\\s\\S]*') + '$', 'i');
          if (rx.test(String(val == null ? '' : val))) on = true;
        }
        if (on) hits.push(row);
      }
      setTimeout(function(){ ok(hits); }, 0);
      return;
    }
    /* ---- 履歴の行、本物と同じ規則で ------------------------------------
       `unique (author, q)` があるので、同じ言葉の二行目は入りません。
       `Prefer: resolution=merge-duplicates` が付いていれば PostgREST は
       ぶつかった行を UPDATE します ── 付いていなければ落ちます。**その
       違いがこの検査の全部**なので、送られてきた見出しをそのまま読みます。

       `__MODE` が 'cut' のとき、消す道だけが通って入れる道が落ちます ──
       「消す」と「入れる」の間で電波が切れた瞬間そのものです。 */
    if (p.indexOf('/rest/v1/recent_search') === 0){
      var qq2 = decodeURIComponent(p), mq = /[?&]q=eq\.([^&]*)/.exec(qq2);
      if (m === 'DELETE'){
        var gone = mq ? mq[1] : '';
        window.__RECENT = window.__RECENT.filter(function(r){ return r.q !== gone; });
        setTimeout(function(){ ok(null); }, 0);
        return;
      }
      if (m === 'POST'){
        if (M === 'cut'){ setTimeout(function(){ bad({ message:'offline' }, 0); }, 0); return; }
        var w = String((b || {}).q || ''), at = String((b || {}).at || '') ||
                new Date().toISOString(), was = null, i2;
        for (i2 = 0; i2 < window.__RECENT.length; i2++)
          if (window.__RECENT[i2].q === w) was = window.__RECENT[i2];
        /* 同じミリ秒に三本入ると `at` が並びます。本物のサーバーでは
           起こらないので、入った順を持たせて並びを決めます ── 測って
           いるのはアプリの動きで、時計の刻みではありません。 */
        window.__SEQ = (window.__SEQ || 0) + 1;
        if (was){
          /* ぶつかった。合流を頼まれていなければ本物は 409 です。 */
          if (!up){ setTimeout(function(){ bad({ message:'duplicate key' }, 409); }, 0); return; }
          was.at = at; was.n = window.__SEQ;
        } else window.__RECENT.push({ id:'r' + (window.__RECENT.length + 1),
                                      q:w, at:at, n:window.__SEQ });
        setTimeout(function(){ ok([{ id:'r' }]); }, 0);
        return;
      }
      /* 読むほう ── 新しい順。 */
      var rows2 = window.__RECENT.slice().sort(function(a2, b2){
        return (a2.at < b2.at) ? 1 : (a2.at > b2.at) ? -1 : (b2.n - a2.n); });
      setTimeout(function(){ ok(rows2); }, 0);
      return;
    }
    if (m === 'POST' && p.indexOf('/rest/v1/post') === 0){
      /* 出ていかなかった投稿 ── 信号が無いときに書いたものがこれです。 */
      if (M === 'nosignal'){ setTimeout(function(){ bad({ message:'offline' }, 0); }, 0); return; }
      var sid = 'sv' + (window.__POSTS.length + 1);
      window.__POSTS.push({ id:sid, author:(SESS && SESS.uid) || 'u', body:b.body,
                            prompt:b.prompt || null, reply_to:b.reply_to || null,
                            created_at:new Date().toISOString(), hidden_at:null,
                            author_out:false, likes:0, boosts:0, replies:0,
                            i_like:false, i_boost:false });
      setTimeout(function(){ ok([{ id:sid }]); }, 0);
      return;
    }
    setTimeout(function(){ ok([]); }, 0);
  };
});

/* 検索欄に打つ ── 画面を立て直してから一文字ぶんの `snsSetQ()` を呼ぶ。
   打つ道そのものです（`IN('snsSetQ')` が検索欄に付いている）。 */
async function typed(q, mode){
  await pg.evaluate((mode) => {
    window.__MODE = mode || 'ok';
    snsHits = null; snsQ = ''; go('explore');
  }, mode);
  await pg.waitForTimeout(60);
  await pg.evaluate((q) => { window.__ASK = []; snsSetQ(q); }, q);
  await pg.waitForTimeout(600);
  return await pg.evaluate(() => {
    var e = document.getElementById('sns-hits');
    var n = e ? e.querySelector('.note') : null;
    return { rows: e ? e.querySelectorAll('.whrow').length : -1,
             note: n ? n.textContent : '',
             drew: !!e && e.innerHTML !== '',
             ask: decodeURIComponent(
               (window.__ASK.filter(function(p){ return p.indexOf('/rest/v1/profile') === 0; })[0]) || '') };
  });
}

/* ---- 1. 打った文字が、サーバーへ行く URL のどこにどう入るか ------------
   人を探す問いは `handle` と `display` の両方に、部分一致で当たります。
   どちらか片方になったら、それは別の検索です。 */
const one = await typed('aya');
say(/or=\(handle\.ilike\.\*aya\*,display\.ilike\.\*aya\*\)/.test(one.ask),
    '打った文字は handle と display の両方に部分一致で入る');
say(one.ask.indexOf('/rest/v1/profile') === 0,
    '訊く先は profile');

/* ---- 2. @ を付けても付けなくても、同じ人が返る -------------------------
   `@` は「これは人だ」と言うために打つ記号で、値の一部ではありません。
   電話の上では二通りに書けます ── U+0040 と、日本語 IME の U+FF20。 */
for (const [label, q] of [['半角 @aya (U+0040)', '@aya'],
                          ['全角 ＠aya (U+FF20)', '＠aya'],
                          ['@ を打たない aya', 'aya'],
                          ['大文字 @AYA', '@AYA']]){
  const r = await typed(q);
  say(r.rows === 1, label + ' → 同じ人が一人 (rows=' + r.rows + ')');
}

/* ---- 3. 落とすのは先頭だけ、人を探すときだけ ---------------------------
   真ん中の `@` は打たれた文字です。そして `netLike()` は投稿の検索と
   共有しているので、そこでは `@` は自分自身を意味します ── ここで落とすと
   投稿の検索から `@` が消えます。 */
const mid = await typed('a@ya');
say(mid.ask.indexOf('*a@ya*') !== -1, '真ん中の @ は落とさない');
const post = await pg.evaluate(() => new Promise(function(d){
  window.__ASK = []; window.__MODE = 'ok';
  snsFind('＠aya', function(){ d(decodeURIComponent(window.__ASK.join('|'))); });
}));
say(post.indexOf('＠aya') !== -1, '投稿の検索は ＠ をそのまま訊く');

/* ---- 4. 表示名の空白は潰さない -----------------------------------------
   `netHandleOf()` は空白を全部落とします ── それは「handle とは何か」の
   規則で、`display` にも当たるこの問いには使えません。 */
const sp = await typed('aya tanaka');
say(sp.ask.indexOf('*aya tanaka*') !== -1,
    '表示名の空白は潰さない (netHandleOf を流用しない)');

/* ---- 5. 見つからなかったのと、訊けなかったのは別の画面 -----------------
   「空」と「壊れた」は違う状態で、枝を共有してはいけません（CLAUDE.md）。
   `alter table profile ... add column av` が当たっていないデータベースは
   400 を返します ── そのとき「いません」と出たら、オーナーは自分の @ が
   消えたと思います。 */
const none = await typed('@zzzz');
const err  = await typed('@aya', 'profile400');
say(none.rows === 0 && none.note && err.note && none.note !== err.note,
    '0 件と訊けなかったは別の言葉 (' + JSON.stringify(none.note) + ' / ' +
    JSON.stringify(err.note) + ')');

/* ---- 6. 答えが返ってきたら必ず画面に出る -------------------------------
   `netFindWho()` は人が見つかったとき `netLangNames()` を呼び、その中で
   `ok()` を呼びます。言語の名前は飾りなので、二本目が落ちても人は出なければ
   なりません ── 落ちて `ok` も `bad` も呼ばれなければ、検索は永久に待ちます。 */
const lang = await typed('@aya', 'lang400');
say(lang.rows === 1,
    '言語の名前が訊けなくても人は出る (飾りで待たない, rows=' + lang.rows + ')');

/* ---- 7. 打った言葉を憶える ----------------------------------------------
   「検索した履歴もユーザーはいらんから5個くらい検索履歴出るようにしたい」
   「1件づつ消せるでいいよ」 OWNER 2026-09-03.

   「検索は🔍押したらって言ってるやん」 OWNER 2026-09-03。**入るのは 🔍 を
   押したときだけです。**一文字ごとに走る `snsSetQ()` の中で書けば
   「a」「ay」「aya」が三件残り、検索したのは押した一回で三回ではありません。
   人の行を開く道も**ありません** ── 一度作って、決定で外しました。 */
async function hist(){
  return await pg.evaluate(() => {
    var e = document.getElementById('sns-hits');
    return { words: SET.recent ? SET.recent.slice() : [],
             rows: e ? e.querySelectorAll('.whrow').length : -1,
             chips: e ? e.querySelectorAll('.chip,.chips,.pav').length : -1,
             sent: window.__ASK.filter(function(p){
               return p.indexOf('/rest/v1/recent_search') === 0; }) };
  });
}
/* 画面を空にして立て直す ── 履歴は空の検索欄の下にだけ出る。 */
async function blank(){
  await pg.evaluate(() => {
    window.__MODE='ok'; window.__ASK=[];
    SET.recent = []; snsRecentGot = true; snsQ = ''; snsHits = null;
    go('explore');
  });
  await pg.waitForTimeout(80);
}

await blank();
/* 打っただけでは一件も増えない ── 何文字打っても 0 件のまま。
   「検索は🔍押したらって言ってるやん」 */
for (const q of ['a', 'ay', 'aya', 'ayan', 'ayana', 'k', 'ka', 'kan'])
  await pg.evaluate((q) => snsSetQ(q), q);
await pg.waitForTimeout(400);
let h = await hist();
say(h.words.length === 0,
    '打っただけでは一件も増えない (8回 snsSetQ して: ' + JSON.stringify(h.words) + ')');
say(h.sent.length === 0,
    '打っただけではサーバーにも行かない (' + h.sent.length + '本)');

/* そして人の行を開く道は無い ── 一度作って決定で外したので、戻ってこないよう
   にここで押さえる。答えの中の人を開いても履歴は動かない。 */
await pg.evaluate(() => {
  snsQ = 'aya'; snsHits = { q:'aya', posts:[],
    who:[{ who:'Aya', hd:'aya', av:null, lname:'', mine:false }] };
  render();
});
await pg.waitForTimeout(150);
const opened = await pg.evaluate(() => {
  var b = document.querySelector('#sns-hits .whrow .whgo');
  if (!b) return { none:true };
  b.click();
  return { none:false, words: SET.recent ? SET.recent.slice() : [] };
});
say(!opened.none && opened.words.length === 0,
    '人の行を開いても履歴は動かない (🔍 だけ: ' + JSON.stringify(opened.words || []) + ')');
await blank();
for (const q of ['a', 'ay', 'aya']) await pg.evaluate((q) => snsSetQ(q), q);
await pg.waitForTimeout(300);

/* 🔍 を押すと、その言葉が一件だけ入る。 */
await pg.evaluate(() => { window.__ASK = []; snsGo(); });
await pg.waitForTimeout(300);
h = await hist();
say(h.words.length === 1 && h.words[0] === 'aya',
    '🔍 を押すと打ち終わった言葉が一件入る (' + JSON.stringify(h.words) + ')');
say(h.sent.length > 0, 'サーバーへ行く (' + (h.sent[0] || '(何も出ていない)') + ')');

/* 六件目で一番古いものが落ち、五件のまま。 */
await pg.evaluate(() => {
  SET.recent = []; snsQ = '';
  ['w1','w2','w3','w4','w5'].forEach(function(w){ snsQ = w; snsGo(); });
});
await pg.waitForTimeout(300);
await pg.evaluate(() => { window.__ASK = []; snsQ = 'w6'; snsGo(); });
await pg.waitForTimeout(300);
h = await hist();
say(h.words.length === 5 && h.words[0] === 'w6' && h.words.indexOf('w1') === -1,
    '六件目で一番古いものが落ちて五件のまま (' + JSON.stringify(h.words) + ')');
say(h.sent.join('|').indexOf('w1') !== -1,
    '落ちた一件はサーバーからも消える');

/* 同じ言葉を二度打っても二行にならず、一番上へ動く。 */
await pg.evaluate(() => { snsQ = 'w3'; snsGo(); });
await pg.waitForTimeout(300);
h = await hist();
say(h.words.length === 5 && h.words[0] === 'w3' &&
    h.words.join(',').split('w3').length === 2,
    '同じ言葉は二行にならず一番上へ動く (' + JSON.stringify(h.words) + ')');

/* 空の検索欄の下に縦の一覧で出る。丸い横並びは無い。 */
await pg.evaluate(() => { snsQ = ''; snsHits = null; render(); });
await pg.waitForTimeout(120);
h = await hist();
say(h.rows === 5, '空の検索欄の下に五行 (rows=' + h.rows + ')');
say(h.chips === 0, '丸い横並びは無い (人のアイコンの列: ' + h.chips + ')');
const vert = await pg.evaluate(() => {
  var r = document.querySelectorAll('#sns-hits .whrow');
  if (r.length < 2) return false;
  var a = r[0].getBoundingClientRect(), b = r[1].getBoundingClientRect();
  return b.top >= a.bottom - 1 && Math.abs(a.left - b.left) < 1;
});
say(vert, '行は縦に積まれている (横並びではない)');

/* 一件消すと、その一件だけが消えて他は残る。 */
await pg.evaluate(() => { window.__ASK = []; snsDropRecent('w4'); });
await pg.waitForTimeout(300);
h = await hist();
say(h.words.length === 4 && h.words.indexOf('w4') === -1,
    '一件消すとその一件だけ消える (' + JSON.stringify(h.words) + ')');
say(h.sent.join('|').indexOf('w4') !== -1, '消したことがサーバーへ行く');

/* 検索欄に文字が入っているときは履歴が出ない。 */
await pg.evaluate(() => { snsQ = 'aya'; snsHits = { q:'aya', who:[], posts:[] }; render(); });
await pg.waitForTimeout(120);
const shown = await pg.evaluate(() => {
  var e = document.getElementById('sns-hits');
  return e ? e.innerHTML.indexOf('snsPickRecent') !== -1 : true;
});
say(!shown, '文字が入っているときは履歴を出さない');

/* そして星（`SET.saved`）は別物で、履歴に触られない。 */
const star = await pg.evaluate(() => {
  SET.saved = ['hoshi']; SET.recent = ['rireki']; snsQ = '';
  snsDropRecent('rireki');
  return { saved: SET.saved.slice(), recent: SET.recent.slice() };
});
say(star.saved.length === 1 && star.saved[0] === 'hoshi' && star.recent.length === 0,
    '履歴を消しても星は残る (星と履歴は別の仕組み)');

/* ---- 7b. 同じ言葉をもう一度 ── 一番上へ動くのは一回の書き込み ---------
   履歴が黙って一つ減ることがありました。同じ言葉をもう一度検索すると一番上
   へ動きますが、その動かし方が **「消す」→「入れる」の二回**で、**間で電波
   が切れると消えたまま**になります。手元には残るので画面は正しく見え、次の
   起動で `snsRecentPull()` がサーバーの答えで上書きしたときに初めて減ります
   ── 誰も何も押していないのに、一件だけ無くなる。

   `unique (author, q)` があるから二回に分けていた、というのが元の理由です。
   けれど PostgREST は `Prefer: resolution=merge-duplicates` でぶつかった行を
   更新します。**問い合わせは一本になり、途中というものが無くなります。**
   `recent_edit`（`supabase/schema.sql`）は前からその一本のために在ります。

   `at` を本文に入れるのは、合流したときに更新される列がそれだけだからです
   ── 入れなければ順番は動かず、「一番上へ動く」が起きません。 */
async function server(){
  return await pg.evaluate(() => window.__RECENT.slice().sort(function(a, b){
    return (a.at < b.at) ? 1 : (a.at > b.at) ? -1 : (b.n - a.n);
  }).map(function(r){ return r.q; }));
}
await pg.evaluate(() => {
  window.__MODE = 'ok'; window.__ASK = []; window.__RECENT = []; window.__SEQ = 0;
  SET.recent = []; snsRecentGot = true; snsQ = ''; snsHits = null; go('explore');
});
await pg.waitForTimeout(80);
await pg.evaluate(() => { ['aya','kanuko','mira'].forEach(function(w){ snsQ = w; snsGo(); }); });
await pg.waitForTimeout(500);
say((await server()).join(',') === 'mira,kanuko,aya',
    '三つ検索するとサーバーに三つ、新しい順 (' + (await server()).join(',') + ')');

/* もう一度、電波が切れないとき ── 一番上へ動く。問い合わせは一本。 */
await pg.evaluate(() => { window.__ASK = []; snsQ = 'aya'; snsGo(); });
await pg.waitForTimeout(500);
let sent = await pg.evaluate(() => window.__ASK.filter(function(s){
  return s.indexOf('/rest/v1/recent_search') === 0; }));
say((await server()).join(',') === 'aya,mira,kanuko',
    'もう一度検索するとサーバーでも一番上へ動く (' + (await server()).join(',') + ')');
say(sent.length === 1,
    '動かすのに出ていく問い合わせは一本 ── 消す→入れるの二回ではない (' +
    sent.length + '本: ' + sent.join(' / ') + ')');

/* そして電波が切れたとき ── 何も消えない。 */
await pg.evaluate(() => { window.__MODE = 'cut'; window.__ASK = []; snsQ = 'kanuko'; snsGo(); });
await pg.waitForTimeout(500);
await pg.evaluate(() => { window.__MODE = 'ok'; });
const still = await server();
say(still.length === 3 && still.indexOf('kanuko') !== -1,
    '途中で電波が切れても履歴は減らない (' + JSON.stringify(still) + ')');

/* 次の起動で読み直しても、減ったままにならない。**画面が忘れる所はここ**
   ── サーバーの答えが `SET.recent` を上書きするので、消えていればここで
   初めて人の目に入ります。 */
const back2 = await pg.evaluate(() => new Promise(function(d){
  window.__MODE = 'ok';
  snsRecentAsk = false; snsRecentGot = false; SET.recent = [];
  snsRecentPull();
  setTimeout(function(){ d(SET.recent ? SET.recent.slice() : []); }, 600);
}));
say(back2.length === 3 && back2.indexOf('kanuko') !== -1,
    '次の起動で読み直しても三件 (' + JSON.stringify(back2) + ')');

/* ---- 8. 投稿の検索 ── いま書いたものが、探して出てくる ------------------
   「検索してもツイート出てこないよ」「今ツイートしたやつは検索しても出てこ
   ない？それとも完全一致しか出ない？」 OWNER 2026-09-04.

   ここまでの七つは**人**の検索の話で、投稿の検索については一行も言っていま
   せんでした。投稿の側は道が違います ── 打っている間は人だけで、押して初め
   て投稿を訊きに行く（「ツイートの検索は検索ボタン押したら出てくる。それま
   では人」2026-08-26）。だから「打っても出ない」は正しい姿で、「押しても
   出ない」が壊れている姿です。その二つを分けて押さえます。

   本物の作文画面から本物の `pwSend()` で一件書いて、それを探します。書く側
   と探す側のどちらで落ちているかは、こうしないと分かりません。 */

/* 一件書く。書けたら、その投稿がサーバーに在ることまで確かめる。 */
async function wrote(ln, mn, mode){
  return await pg.evaluate(([ln, mn, mode]) => new Promise(function(d){
    window.__MODE = mode || 'ok';
    go('feed');
    setTimeout(function(){
      openPost('');
      setTimeout(function(){
        PW.ln = ln; PW.mn = mn;
        pwSend();
        setTimeout(function(){
          window.__MODE = 'ok';
          d({ here: POSTS.filter(function(p){ return p.ln === ln; }).length,
              there: window.__POSTS.filter(function(r){
                       return (r.body || {}).ln === ln; }).length });
        }, 900);
      }, 200);
    }, 200);
  }), [ln, mn, mode]);
}
/* 探す。**押す道そのもの**を通す ── 検索欄に打って、改行キーを押す。
   `snsGo()` を直接呼ぶと、押せるものが画面に無くても緑になります。 */
async function pressed(q){
  await pg.evaluate(() => {
    window.__MODE = 'ok'; window.__ASK = []; window.__FIELDS = [];
    snsQ = ''; snsHits = null;
    SET.recent = []; snsRecentGot = true; go('explore');
  });
  await pg.waitForTimeout(120);
  await pg.fill('#sns-q', q);
  await pg.waitForTimeout(500);
  const typing = await pg.evaluate(() => {
    var e = document.getElementById('sns-hits');
    return { rows: e ? e.querySelectorAll('.post').length : -1,
             fields: window.__FIELDS.slice(),
             posts: window.__ASK.filter(function(s){
                      return s.indexOf('/rest/v1/post_seen') === 0; }).length,
             who: window.__ASK.filter(function(s){
                    return s.indexOf('/rest/v1/profile') === 0; }).length };
  });
  await pg.evaluate(() => { window.__ASK = []; window.__FIELDS = []; });
  await pg.focus('#sns-q');
  await pg.keyboard.press('Enter');
  await pg.waitForTimeout(700);
  const after = await pg.evaluate(() => {
    var e = document.getElementById('sns-hits');
    var n = e ? e.querySelector('.note') : null;
    return { rows: e ? e.querySelectorAll('.post').length : -1,
             note: n ? n.textContent : '',
             fields: window.__FIELDS.slice(),
             asks: window.__ASK.filter(function(s){
                     return s.indexOf('/rest/v1/post_seen') === 0; }).length };
  });
  return { typing:typing, after:after };
}
const w1 = await wrote('kanuko mira', 'ねこがすきです');
say(w1.here === 1, 'いま書いた投稿が手元にある (' + w1.here + ' 件)');
say(w1.there === 1, 'いま書いた投稿がサーバーへ出ていく (' + w1.there + ' 件)');

/* 打つだけで出る。押さなくても。
   「検索も#@投稿が一気に検索できるようにして」 OWNER 2026-09-04。

   **2026-08-26 の「ツイートの検索は検索ボタン押したら出てくる。それまでは
   人」を差し替えます。**打つのと押すのが別の意味を持つ形が無くなり、問いは
   一つ、答えも一つ。押す（🔍・改行キー）に残っている仕事は履歴だけで、
   それは 7 番が押さえています。 */
const p1 = await pressed('kanuko');
say(p1.typing.rows === 1,
    '打つだけで投稿が出る ── 押さなくても (' + p1.typing.rows + ' 件)');
/* 一つの言葉に問い合わせは二本 ── 人に一本、投稿に一本。**一文字ごとに
   同じ問いが二本出ていく**のは、誰も見ていないところで人数ぶん増える種類の
   無駄です。訊くのは snsFind() 一箇所で、それぞれ一本ずつ。 */
say(p1.typing.who === 1 && p1.typing.posts === 1,
    '一つの言葉に二本、人と投稿で一本ずつ (人 ' + p1.typing.who +
    ' 本 / 投稿 ' + p1.typing.posts + ' 本)');
say(p1.after.rows === 1,
    '押しても同じものが出ている (' + p1.after.rows + ' 件)');

/* ---- 9. 完全一致ではない ------------------------------------------------
   「それとも完全一致しか出ない？」 */
const part = await pressed('mira');
say(part.after.rows === 1, '途中の言葉でも出る ── 完全一致ではない (' +
    part.after.rows + ' 件)');
const up = await pressed('MIRA');
say(up.after.rows === 1, '大文字小文字は区別しない (' + up.after.rows + ' 件)');
const ja = await pressed('がすき');
say(ja.after.rows === 1, '自分の言葉の文字も途中から出る (' + ja.after.rows + ' 件)');

/* ---- 10. 当たるのは投稿の三つの場所 ------------------------------------
   綴った行と、意味と、言語の名前。書いた人の名前と @ には当たりません ──
   人は人の検索が答えるもので、同じ言葉が二つの答えを持つと、どちらが出たのか
   誰にも分からなくなります。 */
say(p1.typing.fields.join(',') === 'ln,mn,lname',
    '当たるのは行と意味と言語の名前の三つ (' + p1.typing.fields.join(',') + ')');
const byWho = await pressed('aya');
say(byWho.after.rows === 0,
    '書いた人の @ では投稿は出ない (人の検索の仕事: ' + byWho.after.rows + ' 件)');

/* ---- 11. 信号が無いときに書いた投稿は、追いついてから出る -------------
   検索はサーバーのものです ── 手元の五十件を絞ったものは上位五十件ではない、
   とこの画面は既に書いている。だからサーバーに届いていない投稿は、書いた
   本人にも探せません。**そして、それは失われたということではありません。**
   次にタイムラインを引いたときに追いついて上がり、そこから探せます。

   二つを分けて押さえるのは、片方だけ見ると別の結論になるからです ──
   「出ない」だけ見れば消えたように見え、「出る」だけ見れば信号の有無は
   関係ないように見えます。 */
const w2 = await wrote('zzuquat', 'つながっていないときに書いた', 'nosignal');
say(w2.here === 1, '出ていかなくても手元には残る (' + w2.here + ' 件)');
say(w2.there === 0, 'サーバーへは出ていかなかった (' + w2.there + ' 件)');
const before = await pg.evaluate(() => new Promise(function(d){
  window.__MODE = 'ok';
  snsFind('zzuquat', function(r){ d((r.posts || []).length); });
}));
say(before === 0,
    'まだサーバーに無いので、その場では検索に出ない (' + before + ' 件)');
/* 次につながったとき ── タイムラインを引いた背中で追いつきます。 */
const caught = await pg.evaluate(() => new Promise(function(d){
  window.__MODE = 'ok';
  postCatchUp();
  setTimeout(function(){
    d(window.__POSTS.filter(function(r){
        return (r.body || {}).ln === 'zzuquat'; }).length);
  }, 700);
}));
say(caught === 1, '次につながったときに追いついて上がる (' + caught + ' 件)');
const back = await pressed('zzuquat');
say(back.after.rows === 1,
    '上がったあとは検索に出る ── 何も失われていない (' + back.after.rows + ' 件)');

/* ---- 11b. タイムラインは一度訊いて、止まる ---------------------------
   上の二つが 2 件だったのは、投稿を二度書いたからではありません。**画面が
   サーバーに訊き続けていたから**です。`snsPull()` は答えが来たら書き留めて
   描き直し、`vFeed()` は描き直されるたびに訊く ── 一つの答えが画面を作り、
   その画面がまた訊く。誰かがタイムラインを見ている間じゅう、同じ問いが
   出続けていました。何も投げず、何も間違って見えません。

   そして毎回 `postCatchUp()` が走ります。`sid` がまだ返ってきていない投稿は
   「まだ送っていない投稿」なので、最初の送信が空中にある間に同じものが何度も
   上がり、あとで探すと二件出てきました。

   だから訊いた本数を数えます。一本が正しい姿です ── 立てて、一度訊いて、
   答えが来て、止まる。**人が引っ張って訊き直す道はこれとは別**で、そちらは
   `snsPull()` を直に呼ぶので、この数には出てきません。 */
const loop = await pg.evaluate(() => new Promise(function(d){
  window.__MODE = 'ok';
  SNS_GOT = {}; snsTab = 'rec';
  window.__ASK = [];
  go('feed');
  setTimeout(function(){
    d(window.__ASK.filter(function(s){
        return s.indexOf('/rest/v1/rpc/feed_hot') === 0; }).length);
  }, 1500);
}));
say(loop === 1, 'タイムラインは一度訊いて止まる (' + loop + ' 本)');

/* ---- 12. 見つからなかったのと、訊けなかったのは別の画面 ---------------
   人の側で 5 番が言っているのと同じことを、投稿の側でも言う。 */
const zero = await pressed('qqzzxx');
const dead = await pg.evaluate(() => new Promise(function(d){
  window.__MODE = 'post400';
  snsFind('kanuko', function(r){
    window.__MODE = 'ok';
    d({ n:(r.posts || []).length, bad:r.bad || '' });
  });
}));
say(zero.after.rows === 0 && zero.after.note && dead.bad &&
    zero.after.note !== dead.bad,
    '0 件と訊けなかったは別の言葉 (' + JSON.stringify(zero.after.note) +
    ' / ' + JSON.stringify(dead.bad) + ')');

/* ---- 13. タグは本文の文字 -------------------------------------------
   「投稿する時にタグを入れられるようにしろよ」「本文に#つけられるように
   しろよ」「翻訳はいらんから」「しかも何で検索が今日しか出ないの？ありえない
   だろ」「タグは本文中に。」「タグは青く光るからタップしたらタグの検索に
   なる。」「検索は前の日も出るように」 OWNER 2026-09-04.

   **前の版を差し替えます。**タグは `t('day.tag')` の十言語ぶんで、アプリが
   投稿の横に一行として描いていました。人は打てず、十の言い方に割れていて、
   検索は `netFindPrompt()` で**その日のぶんしか**出ませんでした。
   ここが押さえるのは新しい四つです。

   1. **翻訳しない。**`day.tag` の鍵は十言語すべてから消えていて、
      `dayTag()` も `dayTagId()` も無い。一つのタグに綴りは一つ。
   2. **タグは本文の文字で、青くて、押せる。**投稿が持っている文字だけが
      タグになる ── アプリが足す行はもう無い。
   3. **押したらそのタグの検索になる。**箱にその文字が入り、答えは
      ふつうの検索の答え。
   4. **前の日も出る。**集めるのは本文の文字合わせなので、今日という
      言葉がどこにも要らない。「列で集める」は投稿の `pr` のままで、
      そちらは消えていません（OWNER DECISION 2026-08-23 #6）── 消えたのは
      その上に乗っていた二つ目の仕組みです。 */
async function withDay(){
  await pg.evaluate(() => {
    window.__MODE = 'ok'; window.__ASK = []; window.__BYPR = 0;
    DAY = { id: 7, on_day: '2026-08-23', text: 'It is unbearably hot today.',
            says: { en: 'It is unbearably hot today.',
                    ja: '今日はめちゃくちゃ暑い。' } };
    PROMPTS = {}; PROMPT_ASK = {};
    snsFil = null; snsQ = ''; snsHits = null;
  });
}
await withDay();

/* 1. 翻訳された仕組みが残っていないこと。 */
const gone = await pg.evaluate(() => {
  var was = SET.ui, out = { fns:[], keys:[] }, i,
      ls = ['en','es','pt','fr','de','it','ru','zh','ko','ja'];
  if (typeof dayTag === 'function') out.fns.push('dayTag');
  if (typeof dayTagId === 'function') out.fns.push('dayTagId');
  if (typeof netFindPrompt === 'function') out.fns.push('netFindPrompt');
  if (typeof postTagHTML === 'function') out.fns.push('postTagHTML');
  for (i = 0; i < ls.length; i++){
    SET.ui = ls[i];
    if (t('day.tag') !== 'day.tag') out.keys.push(ls[i]);
  }
  SET.ui = was;
  out.one = (typeof DAY_TAG === 'string') ? DAY_TAG : '(DAY_TAG が無い)';
  return out;
});
say(gone.fns.length === 0,
    '翻訳されたタグの仕組みは消えている (' + (gone.fns.join(',') || '無し') + ')');
say(gone.keys.length === 0,
    'day.tag の鍵は十言語すべてから消えている (' + (gone.keys.join(',') || '無し') + ')');
say(gone.one === '#今日のお題',
    'タグの綴りは一つ (' + gone.one + ')');

/* 2. 本文の文字が青くて押せる。アプリが足す行は無い。 */
const drawn = await pg.evaluate(() => {
  var e = document.createElement('div'), b, out = {};
  e.innerHTML = postRow({ id:'t1', at:Date.now(), who:'Iri', hd:'iri',
                          ln:'qel', mn:'あついね #今日のお題 でした',
                          ui:'ja', mine:false });
  b = e.querySelectorAll('button.ptag');
  out.n = b.length;
  out.text = b.length ? b[0].textContent : '';
  out.does = b.length ? b[0].getAttribute('data-do') : '';
  out.arg  = b.length ? b[0].getAttribute('data-a') : '';
  /* そして、タグを持たない投稿には青い言葉が一つも無い ── お題に答えた
     投稿でも、アプリが行を足すことはもう無い。 */
  e.innerHTML = postRow({ id:'t2', at:Date.now(), who:'Aya', hd:'aya',
                          ln:'mos', mn:'nothing here', ui:'en', pr:7,
                          mine:true });
  out.none = e.querySelectorAll('button.ptag').length;
  return out;
});
say(drawn.n === 1 && drawn.text === '#今日のお題',
    '本文の中のタグが一つ、押せる形で出る (' + drawn.n + ' / ' + drawn.text + ')');
say(drawn.does === 'snsTagGo' && drawn.arg.indexOf('#今日のお題') !== -1,
    '押すとそのタグの検索になる (' + drawn.does + ' ' + drawn.arg + ')');
say(drawn.none === 0,
    'タグを持たない投稿には青い言葉が無い ── アプリは行を足さない (' +
    drawn.none + ')');

/* 3. 押したら、その文字が箱に入って検索になる。 */
const tapped = await pg.evaluate(() => {
  snsQ = ''; snsHits = null;
  snsTagGo('#今日のお題');
  return { q: snsQ, where: here().r };
});
say(tapped.q === '#今日のお題' && tapped.where === 'explore',
    '押すと検索の画面にその文字が入る (' + tapped.q + ' / ' + tapped.where + ')');

/* 4. お題から書き始めると、本文にタグが入っている ── これが「前の日も
      出る」を本当に支えている一つです。前の版ではタグはアプリが描く行で、
      **どの投稿の本文にも入っていませんでした**。だから文字合わせの検索は
      何にも当たらず、その日のお題を名指しする問い合わせだけが答えていて、
      それが「今日しか出ない」の正体です。

      そして**外せる**こと。入っているのは行（本文）で、意味ではありません
      ── 意味はお題の下では読み取り専用です（OWNER DECISION 2026-08-23 #5
      「消せないようにしよう そこからのやつは」）。 */
const composed = await pg.evaluate(() => {
  PW = pwBlank();
  openPost('day');
  var out = { ln: PW.ln, mn: PW.mn, pr: PW.pr };
  /* 外せる ── 本文は打てる欄なので、消したら消える。 */
  pwSetLn('');
  out.after = PW.ln;
  out.prAfter = PW.pr;
  /* 意味のほうは読み取り専用のまま。 */
  pwSetMn('べつのこと');
  out.mnAfter = PW.mn;
  PW = pwBlank();
  return out;
});
say(composed.ln.indexOf('#今日のお題') === 0,
    'お題から書き始めると本文にタグが入っている (' +
    JSON.stringify(composed.ln) + ')');
say(composed.after === '' ,
    'そのタグは外せる (' + JSON.stringify(composed.after) + ')');
say(composed.prAfter === 7,
    'タグを外しても、その日に答えたことは投稿に残る ── 集めるのは列 (' +
    composed.prAfter + ')');
say(composed.mn === composed.mnAfter,
    '意味はお題の下では変えられないまま (' + JSON.stringify(composed.mn) + ')');

/* 5. 前の日も出る。二日ぶんの投稿を置いて、タグで探す。 */
const days = await pg.evaluate(() => {
  window.__POSTS = [];
  /* 今日のぶん */
  window.__POSTS.push({ id:'sv-new', author:'u', body:{ ln:'kanuko',
                        mn:'あついね #今日のお題' },
                        prompt:'7', reply_to:null, created_at:'2026-08-23T01:00:00Z',
                        hidden_at:null, author_out:false, likes:0, boosts:0,
                        replies:0, i_like:false, i_boost:false });
  /* 三週間前のぶん ── 別のお題に答えている。ここが前の版で出なかった分。 */
  window.__POSTS.push({ id:'sv-old', author:'u2', body:{ ln:'mirasu',
                        mn:'so hot #今日のお題' },
                        prompt:'3', reply_to:null, created_at:'2026-08-02T02:00:00Z',
                        hidden_at:null, author_out:false, likes:0, boosts:0,
                        replies:0, i_like:false, i_boost:false });
  /* タグを持たない投稿。混ざったら、探しているのはタグではありません。 */
  window.__POSTS.push({ id:'sv-no', author:'u3', body:{ ln:'zzoq', mn:'nothing' },
                        prompt:null, reply_to:null, created_at:'2026-08-23T03:00:00Z',
                        hidden_at:null, author_out:false, likes:0, boosts:0,
                        replies:0, i_like:false, i_boost:false });
  return window.__POSTS.length;
});
say(days === 3, '今日のと前の日のとタグ無しを一つずつ置いた (' + days + ')');

const found = await pg.evaluate(() => new Promise(function(d){
  window.__ASK = [];
  snsFind('#今日のお題', function(r){
    d({ ids:(r.posts || []).map(function(p){ return p.sid; }).sort(),
        ask: decodeURIComponent(window.__ASK.join('|')) });
  });
}));
say(found.ids.join(',') === 'sv-new,sv-old',
    '前の日のタグも出る (' + found.ids.join(',') + ')');
say(found.ask.indexOf('prompt=eq.') === -1,
    'その日のお題を名指しする問い合わせは出ていかない (' + found.ask + ')');
say(found.ask.indexOf('body->>mn') !== -1,
    '当たるのは本文の文字 (' + (found.ask.indexOf('body->>mn') !== -1) + ')');

/* ---- 絞り込みにタグは出しません ---------------------------------------
   「そこに出せなんて頼んでないけど」 OWNER 2026-09-04。一度出して、決定で
   外しました。**戻ってこないようにここで押さえます。** */
await withDay();
const rows = await pg.evaluate(() => {
  window.route = 'filter'; NAV = [{ r:'feed' }, { r:'filter' }];
  var e = document.createElement('div');
  e.innerHTML = vFilter();
  var bs = e.querySelectorAll('button.set'), i, out = [];
  for (i = 0; i < bs.length; i++)
    out.push(bs[i].textContent.replace(/\s+/g, ' ').trim());
  return out;
});
say(!rows.filter(function(r){ return r.indexOf('#') === 0; }).length,
    '絞り込みにタグの行は無い (' + rows.join(' / ') + ')');

await br.close();
console.log(bad.length ? '\nfind: FAILED ' + bad.length : '\nfind: 一つの箱に打てば人も投稿も出る。途中の言葉でも出て、出ていない投稿は出ない');
process.exit(bad.length ? 1 : 0);
