# r98-count ── 引用はリポストの数に入る／キーボードの高さの測りを消す

ブランチ `claude/r98-count`（`integ-0905` から）。決定ログ `docs/FEATURE_RULES.md` 2026-09-26「1.0.3 の残りの答え」。

## 持ち物（これ以外は触らない）
- `www/store.js`、`tools/plan-check.mjs`（リーダーの追加 2026-09-26）
- `supabase/schema.sql` ── `post_seen.boosts` の数え方一か所
- `tools/rls-check.mjs`、`tools/tl-check.mjs`
- `www/net.js`・`www/post.js`（数を読む所だけ、要れば）
- `www/core.js`（設定の読みの一か所だけ）
- `tools/store-check.mjs` と関係する検査
- `docs/CHANGELOG.md`、この文書

## しないこと
- `react_seen`（リポストした人の一覧）に引用した人を混ぜない（未決定、今の形のまま）
- `feed_hot()` の並びの重み（boost=3）は変えない（数ではなく並べ方、指示の外）
- ゲートは回さない（作った検査・FAST・rls のみ）

## 報告（2026-09-26）

### A. 引用はリポストの数に入る
- 数え方の一か所: `supabase/schema.sql` の `post_seen.boosts` を「`react` の boost ＋ `quote_of` がこの投稿の投稿」に書き直した。
  数える引用は返信の数と同じ条件（下げられていない・本人だけ〈`pv`〉でない）。`feed_hot()`・`feed_fo()` などはこの列を
  そのまま渡すだけなので、タイムライン・スレッド・プロフィールは同じ数になる。電話の読み（`netRow()` の `r.boosts`）は変えていない。
- 電話側の穴: 返信は届いた時・消した時に答え元の数を訊き直していたが、引用は引用元を訊き直していなかった（引用しても
  開き直すまで数が動かない）。`postCountsUnder()`（`www/post.js`）一か所に書き直し、送れた時（`postSend`）と消した時
  （`postDelDone`）の両方がこれを呼ぶ。
- 検査: `rls-check` に「B が引用 → A から見て boosts=1、本人だけの引用は数えない、消せば 0」。数え方を戻して
  「one quote is one repost on the count」の赤を確認。`tl-check` 14b「引用を送ると引用元の数が 4->5」。
  `postCountsUnder` の引用の一行を抜いて 4->4 の赤を確認。`del-check` は抜き出した関数の偽物に `postCountsUnder` を足しただけ。
- **決まっていないので今のまま**: リポストした人の一覧（`react_seen`、長押し）は `react` の行だけ。引用した人は入っていない。
  数は「リポスト＋引用」、一覧は「リポストだけ」なので、数が 3 で一覧に 2 人、ということが起きる。混ぜるかはオーナーの判断。
- 指示の外で触らなかった物: `feed_hot()`（人気順）の重みはリポスト 3・返信 5 のまま、引用は重みに入らない。
- 見た目: 画面の形は変わらない（数の値だけ）。スクショは撮っていない。

### B. `SET.vvkb` を消す
- `setVvkbDrop()`（`www/core.js`）一か所。起動時、設定を読む前に `lingua.set` と `lingua.set.<uid>` を見て、`vvkb` を持つ物
  だけその欄を取って書き戻す。他の欄・他の鍵・サーバーは触らない。
- `store-check`: 書き戻しを ROADS に（`core.js:k`、whose `same`）。`vvkb` の注記を今に。
- `migrate-check`: 設定の写し三つで `vvkb` を数えて 0、メモリの `SET` にも無い、他の欄と設定でない鍵はそのまま。
  呼び出しを外して 3 of 3 の赤を確認。
- `docs/CHANGELOG.md` 2026-09-26 に DELETE REVIEW の決定（消す）を足した。2026-09-25 の項は書き換えていない。

### C.（追加）購入の後の表示はサーバーの答え
- `www/store.js`: `storeSaid(p, want, r, d)` 一つに書き直した。「〇〇になりました」はサーバーの答え `p` が押したプラン
  以上（`PLAN_ORDER` で比べる、この関数の一行だけ）の時だけ、押したプランの名前で。それ以外は復元と同じ
  `store.none` ＋ `storeWhyNone()` の数字。購入（`storeBuy`）も復元（`storeRestore`）もこれを呼び、文は一つ。
  押したプランが分からない古いネイティブは、復元と同じくサーバーの答えの名前で言う。
- `has()` は使えなかった（`dead-check`: `has()` は core.js の外で呼ばない）ので、`PLAN_ORDER` で比べている。
- `plan-check`: 「Pro を押してサーバーが free → 『になりました』を出さず復元の文と数字、プランは free のまま」
  「Pro を押してサーバーが Plus → Pro とは言わない」。直す前のコードで二つとも赤（「Pro is on」）を見てから直した。
  `term-check` も緑。i18n の鍵は増えていない（既存の `toast.plan.other`・`store.none` だけ）。
- 見た目: 知らせの文が失敗の時に変わるだけで、画面は変わらない。スクショは撮っていない。

### 回した物
FAST のうち assets docs es5 dead sides store writes del（と pre-commit の全部）、`rls`、`tl`、`migrate`、`plan`、`term`。ゲート全体は回していない。

### リーダーへ
- `docs/FEATURE_RULES.md` 2026-09-26 の Implementation status「未（消すのと数え方）」は、持ち物の外なので直していない。
  CODE CONFIRMED（実機未確認）に直してほしい。
- CODE CONFIRMED のみ。DEVICE / OWNER CONFIRMED ではない。
