# r152-official — 公式アカウントのプロフィールは「DL可能言語」の一行

ブランチ `claude/r152-official`（`integ-0905` から）。

## 仕様（リーダーからの指示、決定ログ 2026-09-30）

公式アカウントのプロフィールでは、言語の一行（今は一番古い言語一つ、
`profile_seen.lang_id`）の代わりに「DL可能言語」という一行を一つ置く。押すと、
そのアカウントが公開している言語の一覧のページへ行く。一覧の一行はその言語の
今あるページ（`about`）を開き、そこで字が見られて、今ある章ごとの ↓ で取る。
ほかの人のプロフィールは今のまま。公式かどうかはサーバーの印が答える。

(1) だけがこのブランチの物。(2)「取った人が自分でキーボードを作る」はやらない。

## 触る物

- `supabase/schema.sql` — `profile.official`（印）、`profile_seen` にその列。
  API からは誰も書けない（insert / update の grant に載せない）
- `supabase/once/2026-09-30-official.sql` — @lingua に印をつけ、5262c1dd の
  `published_at` を空にする。**走らせない**
- `tools/rls-check.mjs` — B が自分にも人にも印をつけられない、anon は何も無い
- `www/net.js` — `NET_WHO_SEL`・`netWhoRow()` に `official`、公開言語を持ち主で
  読む関数を一つ（r150 が同じファイルの `.got` を書く所を触っている。
  重ならない関数だけ）
- `www/me.js` — `whoOf()` の印、`whoCard()`・`meCard()` の言語の一行、一覧の画面
- `www/home.js` — 触らない予定（`wldRow()` は呼ぶ側で差し替える）
- `www/sns.js` — `pullOn`・`pageReads` に一覧の行
- `www/shell.js` — `PAGES` に一行（r148 も別の行を足している）
- `www/route-map.js` — `page()` 一行
- `www/i18n/*.js` — 「DL可能言語」と空の時の一文の鍵だけ（r148・r149 が別の鍵）
- `tools/fixture.mjs`（r148・r150 も触る、足すだけ）、新しいチェック
  `tools/official-check.mjs`、`tools/gate.mjs`・`package.json` に一行ずつ
- `tools/load-check.mjs` — 要れば偽の答えに一覧の分
- `docs/CHANGELOG.md`、`docs/DATA_MODEL.md` など、この変更で嘘になる文
- `shots/r152-*.png`

## 触らない物

`www/core.js`（r149・r150）、`www/sound.js`・`share.js`・`sheet.js`・`post.js`
（r150）、`official/`（r151）、ほかのブランチ。npm test は走らせない。
