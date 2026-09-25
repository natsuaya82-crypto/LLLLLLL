# r94 ── いいね・リポストした人の一覧、引用リポスト、解除の確認、投稿の詳しい時刻（1.0.3）

- 日付: 2026-09-25
- 枝: `claude/r94-social`（`integ-0905` 59678c5d から）
- 決定: `docs/FEATURE_RULES.md`「### 2026-09-25 いいね・リポストした人の一覧、引用リポスト、解除の確認、投稿の詳しい時刻（1.0.3）」
- 1.0.3 に入れる。1.0.2 は審査中なので急がない。

## 面（数えた物）

- **長押し**: `data-hold` を読むのは `www/shell.js` の `holdStart()` 一つで、行き先が中に書いてある
  （プロフィールのタブ → 言語の一覧）。二つ目の長押しは、`data-hold` が `data-do` と同じく**名前**を持ち
  `holdStart()` がそれを動かす形に書き直す（一つの仕組み）。`act-check` の名前の収穫に `hold` を足す
  （act-map を持っているので、その検査も持ち物と読む）。`tools/press.mjs` は全ての `data-hold` を長押しする
  ── 触らない。
- **人の一覧**: フォロー一覧は `www/me.js` の `fol*`（ページで切る・続き・人と関係を読む）と
  `www/net.js` の `netFollowRows()`（keyset）、`vFollows()`、`www/sns.js` の `pullOn('fols')`・
  `pageReads('follows')`・`snsMore()`。いいね・リポストした人の一覧は**この同じ仕組み**に載せる
  ── 一覧の鍵をルートの引数（`ers:h` `ing:h` に `like:<投稿>` `boost:<投稿>` を足す）にして、
  読む先だけ違う。二つ目の一覧の仕組みは作らない。サーバーは `react_seen`（`follow_seen` の形、
  `block_hides`・`mute_hides` で外す）。
- **引用**: `post` に列 `quote_of`（`supabase/schema.sql`）。書く側 ── `post_make` に
  `post_blocks(quote_of)`、`grant insert (...)` に列。読む側 ── `post_seen` に `quote_of` と、今の
  元の投稿（見えない時は null）。`feed_hot()`・`feed_fo()` は `post_seen` と同じ列を返すので同じ二つを足す。
  `notices()` に `quote` の枝。端末 ── `netPush()`（列）、`netRow()`（元の投稿）、`postRow()`（下に小さく）、
  作る画面（`pwHTML()`）、リポストの印を押した時の `popAsk()`、通知の行（`www/sns.js`）。
- **解除の確認**: リポストを取り消す所は `postBoost()`（`www/post.js`）一つ、フォローを外す所は
  `meFollow()`（`www/me.js`）一つ。確認はそこで、削除の確認（`postDel()`）と同じ `popAsk()`。
- **詳しい時刻**: 時刻は `postWhen()` 一つ、スレッドで開いた投稿は `postFocus()` が言う。

## 変えてよい物

リーダーの一覧のとおり: `www/post.js` `www/sns.js` `www/me.js` `www/net.js` `www/shell.js`
`www/route-map.js` `www/act-map.js` `www/i18n/*.js`、`supabase/schema.sql`（post の引用の列・policy、
notices、react/follow の読みの view）、`supabase/functions/push-send/*`、上を持つ `tools/*-check.mjs`、
`tools/rls-check.mjs`（CASES）、`tools/fixture.mjs`、`tools/load-baseline.txt`、
`docs/FEATURE_RULES.md`（その決定の Implementation status の行だけ）、`docs/CHANGELOG.md`、この紙、
`www/index.html`（新しい画面・引用の枠の CSS だけ、角丸・枠線なし）。

## 変えない物

- `www/push.js`・`www/core.js` ── 持っていない。**引用の iPhone の通知は、種類を一つ足すと設定の
  通知の部屋に一行（`PUSH_KINDS`・`pushSw()`、`www/push.js`）と `SET_PREFS`（`www/core.js`）が要る**
  （push-check がこの三つが揃うことを数える）。持っていないので止めて報告する。アプリの中の通知
  （通知タブ）は `notices()` と `www/sns.js` で出る。
- `tools/press.mjs`、`docs/STATE.md`、`CLAUDE.md`。
- 引用の数を出すか・どこに出すか（決まっていない）。リポストの数に引用は入らない（別の表）。

---

# 報告（2026-09-25）

## 何を、どのファイルで

| コミット | 何 |
|---|---|
| `8887fa5c` | scope 宣言（この紙） |
| `0cf523a3` | D（最初の形）: スレッドで開いた投稿の頭の時刻を詳しい日時に。**後で決定が変わった ── 下の D2** |
| `d4421137` | C: `postBoost()` は取り消す時だけ `popAsk('post.unboost.q')`、送るのは `postBoostGo()`。フォローの押しは `meFollowPress()`（外す時だけ `me.unfollow.q`）、行いは `meFollow()` のまま ── ブロックが外すフォロー・オンボーディングの @lingua・［再接続］は訊かない。`act-map` の `meFollow` → `meFollowPress`。i18n 三つ×10 |
| `ea3061cc` | リファクタ: `data-hold` は行いの表の名前を持ち、`holdStart()` が `actRun(ACT, el, 'data-hold')`（`data-a` も同じ要素の物）。プロフィールのタブは `holdLangs`（前と同じ行き先）。`act-check` が `hold` を押す名前として数える |
| `f1f4b698` | サーバー A: `react_seen`（`follow_seen` の形: post・kind・created_at・actor_handle、`block_hides` 両向き・`mute_hides`・`post_blocks` で外す）。`rls-check` 五行 |
| `658caf9d` | リファクタ: 人の一覧の一ページ（keyset）を `netPplPage()` に、`netFollowRows()` がそれを呼ぶ |
| `8fdceacb` | A: 一覧の鍵をルートの引数に（`folList()`: `ing[:h]` `ers[:h]` に `like:<sid>` `boost:<sid>`）、`folPull(L, …)`・`folsAsk`・`folsGot`・`folMore` がそれを読む。`vReacts()` と `vFollows()` は `folPage()` 一つで描く。ルート `reacts`（`PAGES`・`route-map`・`pageReads` は `fols`・`MORE_ON`・`snsMore`・`pageName`）。`netReacters()`。ハート・リポストに `data-hold`（`postHoldLikes`・`postHoldBoosts`、sid があり数が 0 でない時だけ）。`folGot` は呼ぶ所が無くなって消した。i18n 四つ×10。fixture 三面 |
| `8d8cf2c0` `54787183` | CHANGELOG（コードの前に）: `post.quote_of`、写しの `qt`・`qp`、下書きの `qt` |
| `8ed7d0ae` | サーバー B: `post.quote_of uuid`（外部キー無し）＋索引、`post_make` が `post_blocks(quote_of)`、`grant insert` に列（update には無し）、`post_seen.quote_of`・`quoted`（今の元の投稿、消えた・非表示・凍結・非公開・ブロックは null）、`feed_hot`・`feed_fo` に同じ二列（`feed_fo` も名前で drop）、`notices()` に `quote` の枝。`rls-check` 十三行 |
| `52a02005` | B: リポストの印 → `popAsk('', リポスト, 引用)`（sid の無い投稿は今まで通り）。`postQuote()` → 投稿画面、`PW.qt`。`netPush` が `quote_of`、`netBody` は `qt`・`qp` を運ばない、`netRow` が `quoted` → `qp`、`NET_POST_SEL` に二列、`postFresh` が `qp`。`postQuoteHTML()` 一つでタイムラインの行（押すと元の投稿）と投稿画面。下書きに `qt`。`openPost('new')` は `qt` も落とす。通知の `quote`（リポストの印、`notif.quote`）。`popAsk` は問いが空なら行を描かない。CSS `.pqt`（左の一本の線、枠・角丸なし）。i18n 四つ×10。fixture 三面 |
| `12206b6c` | integ-0905 を取り込む |
