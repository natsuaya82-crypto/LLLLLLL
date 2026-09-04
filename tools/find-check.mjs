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
  netSend = function(m, p, b, t, ok, bad){
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
    snsHits = null; snsMode = 'who'; snsQ = ''; go('explore');
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
  window.__ASK = []; window.__MODE = 'ok'; snsMode = 'posts';
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
    snsMode = 'who'; go('explore');
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
    snsQ = ''; snsHits = null; snsMode = 'who';
    SET.recent = []; snsRecentGot = true; go('explore');
  });
  await pg.waitForTimeout(120);
  await pg.fill('#sns-q', q);
  await pg.waitForTimeout(500);
  const typing = await pg.evaluate(() => ({
    mode: snsMode,
    posts: window.__ASK.filter(function(s){
             return s.indexOf('/rest/v1/post_seen') === 0; }).length }));
  await pg.evaluate(() => { window.__ASK = []; window.__FIELDS = []; });
  await pg.focus('#sns-q');
  await pg.keyboard.press('Enter');
  await pg.waitForTimeout(700);
  const after = await pg.evaluate(() => {
    var e = document.getElementById('sns-hits');
    var n = e ? e.querySelector('.note') : null;
    return { mode: snsMode,
             rows: e ? e.querySelectorAll('.post').length : -1,
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

/* 打っている間は人だけ ── 投稿は一本も訊きに行かない。 */
const p1 = await pressed('kanuko');
say(p1.typing.posts === 0 && p1.typing.mode === 'who',
    '打っている間は人だけ (投稿の問い ' + p1.typing.posts + ' 本)');

/* 押したら投稿を訊きに行く。そして **一度だけ**。
   二度訊いても答えは同じなので何も壊れませんが、検索のたびに同じ問いが二本
   出ていくのは、誰も見ていないところで人数ぶん増える種類の無駄です。
   一箇所で訊く ── 訊くのは画面を描くところ（`vExplore()`）です。 */
say(p1.after.asks === 1,
    '押すと投稿を訊きに行く、そして一度だけ (' + p1.after.asks + ' 本)');
say(p1.after.rows === 1 && p1.after.mode === 'posts',
    'いま書いた投稿が、押したら出てくる (' + p1.after.rows + ' 件)');

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
say(p1.after.fields.join(',') === 'ln,mn,lname',
    '当たるのは行と意味と言語の名前の三つ (' + p1.after.fields.join(',') + ')');
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
  window.__MODE = 'ok'; snsMode = 'posts';
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
  window.__MODE = 'post400'; snsMode = 'posts';
  snsFind('kanuko', function(r){
    window.__MODE = 'ok';
    d({ n:(r.posts || []).length, bad:r.bad || '' });
  });
}));
say(zero.after.rows === 0 && zero.after.note && dead.bad &&
    zero.after.note !== dead.bad,
    '0 件と訊けなかったは別の言葉 (' + JSON.stringify(zero.after.note) +
    ' / ' + JSON.stringify(dead.bad) + ')');

await br.close();
console.log(bad.length ? '\nfind: FAILED ' + bad.length : '\nfind: 人は打てば届き、投稿は押せば出る。途中の言葉でも出て、出ていない投稿は出ない');
process.exit(bad.length ? 1 : 0);
