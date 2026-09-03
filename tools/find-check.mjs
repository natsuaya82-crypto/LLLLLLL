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

await br.close();
console.log(bad.length ? '\nfind: FAILED ' + bad.length : '\nfind: 人の検索は打った通りに届き、答えは画面に出る');
process.exit(bad.length ? 1 : 0);
