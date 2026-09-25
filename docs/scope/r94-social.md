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
