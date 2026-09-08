# claude/r7-slow — 遅さを測って、直列を一本にする

実機 143（OWNER 2026-09-08）
「他人のフォロー／フォロワーとか見る時すんごいくるくる回ってるけど、なんか
全体的に遅くない？」

## やること

1. **測る（先）。** 一本 300ms 固定の偽サーバーを立て、七つの画面ごとに
   (a) 要求の本数、(b) 直列の段数、(c) 押してから出るまでの ms を表にする。
   `tools/slow-check.mjs` として残し、gate の SLOW に足す。
   主張は「各画面の直列の段数が N 以下」。
2. **直す（後、別コミット）。** 直列になっている所を一本にするか並列に。

## 触るファイル

- `www/net.js`
- `www/me.js` の follows の道（`followsOpen` / `folWait` / `whoNeed` 周り）
- `www/sns.js` の pull
- `www/boot.js`
- `supabase/schema.sql`
- `tools/slow-check.mjs`（新規）
- `tools/gate.mjs`、`package.json`
- `tools/rls-check.mjs`
- `docs/CHANGELOG.md`、`docs/BACKLOG.md`

## 触らないファイル

- `www/index.html`、`www/post.js`、`www/core.js` ── 別セッション。
- `www/me.js` のプロフィール描画（571・1180 付近）と
  `www/net.js` の profile の select/body（846・885 付近） ── r7-acct のもの。

## 回す検査

速いものと `npm run slow`、`npm run tl`、`npm run acct` だけ。
`npm test` はリーダーが回す。
