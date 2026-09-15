# r38-about ── 「この言語について」が一生まわる

ブランチ `claude/r38-about`（`integ-0905` = `8a48c6d6` から）。
**取り込むのはサブリーダー／リーダー。全ゲートは回しません。**

## 何を見ているか

オーナー、実機 159（= `master` 8a48c6d6、2026-09-15 21:33 JST）：

> 設定→言語 の自分の言語 → この言語について（route `about`、`vAbout()` →
> `wldPage()`、`www/home.js`）が**一生「通信中」で進まない**。

158 では出ていなかった。159 に入ったのは r36（一覧はサーバーの答えそのもの）と
r37（扉で `pullForget()`）。同じ 159 で 設定→言語 は 1 本になり、「言語を追加」も
新規登録も通った（実機）。

## 触ってよい file（リーダーが名指しした territory）

`www/home.js`（`vAbout`／`wldPage` 周り）・`www/net.js`・`www/sns.js`（pull の表）・
`www/core.js`・`tools/acct-check.mjs`・`tools/page-check.mjs`・`tools/fixture.mjs`・
`docs/CHANGELOG.md`・`docs/CHECK-0907.md`（「ビルド 160」の節）・
`docs/scope/r38-about.md`（これ）。

**触らない**：`www/index.html`、`docs/STATE.md`、その他すべて。

## やること

1. 原因を**押して測る**（読んで当てない）。headless の偽サーバーで再現し、
   何を待っているのかを probe で出す。
2. 赤を claim にする。**バグを入れたまま赤を見てから**直す。
3. 直しは rewrite（patch 禁止）。r36・r37 の設計は崩さない。
4. 単体で回す：acct / again / dl / plan / migrate / page / press / es5 / dead。
   全ゲート（`npm test`）はリーダーが回す。

## 状態

着手。probe はこれから。
