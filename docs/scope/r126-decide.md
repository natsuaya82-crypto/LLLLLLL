# r126-decide ── オーナーの決定 2026-09-28（owner-asks 1〜10 とミュートの通知）

ブランチ `claude/r126-decide`（integ-0905 から）。決定: `docs/FEATURE_RULES.md` § 2026-09-28 オーナーに訊いた十件の答え。

## 触ってよい
- `supabase/schema.sql` ── ブロックの時にフォローを両向きに外すトリガー、ピン留めの列、検索の話題順（r124 の device の節 1560〜1620 は触らない）
- `tools/rls-check.mjs` ── 上の三つの CASES（r124 の KNOCK の節と CASES の末尾は触らない）
- `www/post.js` ── `pwSendFell`・`postUpAll`・`pwSend` の焼きの失敗・`migratePostInk`・`postPin`・`postLike`
- `www/net.js` ── `postUpAll` の呼び出し（扉）、ピン留めの読み書き、`netFindPosts` の並び
- `www/sns.js` ── `snsSetSort` と検索の並び
- `www/core.js` ── `migratePostInk` の呼び出し
- `www/home.js` ── `langDrop` の確認、↓ のメーター
- `www/keyboard.js` ── `kbDelRow`・`kbDelCol` の前の確認
- `www/i18n/*.js`、`www/act-map.js`、`www/index.html`（必要な行だけ）
- 各変更を持つ検査（`tools/*-check.mjs`、`tools/fixture.mjs`）
- `CLAUDE.md` 規則 12・19、`docs/FEATURE_RULES.md`、`docs/DATA_MODEL.md`、`docs/CHANGELOG.md`、この文書、`shots/r126-*.png`

## 触らない
- `supabase/functions/push-send/*`・`tools/push-check.mjs` ── `claude/r124-android-push` が同じ所を書き換えている。
  ミュートした人の通知は、r124 が取り込まれてからにする（リーダーへ）。
- それ以外すべて。本番には何も当てない。
