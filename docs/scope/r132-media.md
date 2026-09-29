# r132-media ── プロフィールの「写真」タブ（X のメディアタブと同じ）

ブランチ `claude/r132-media`（integ-0905 から）。決定: オーナー 2026-09-29 写真タブ（`docs/FEATURE_RULES.md` § Owner decision log に書く）。

## 触ってよい
- `www/home.js` ── プロフィールのタブ（`PF_TABS`・`pfSetTab`・`pfList`・`vProfile` の一覧の所）と、写真の格子を描く関数を一つ足す
- `www/sns.js` ── `pageReads('profile')`、`pullOn` に `media` を一行、`askMedia` を足す、`snsMoreOf` の profile の続き
- `www/net.js` ── 写真付きの投稿だけを読む関数を**一つ足す**だけ（`NET_POST_SEL` を使う）。r131-pic が触る写真を読む所（`netMedia*`・`netRow`・`netUpPics`）には触らない
- `www/glyph.js` ── 重なりの印を一つ足す
- `www/index.html` ── プロフィールの格子の CSS だけ（角丸・枠なし）
- `www/i18n/*.js`（タブの名前、写真が無い時の文）、`www/act-map.js`（要れば）
- `tools/load-check.mjs`・`tools/fixture.mjs`・写真タブの検査
- `docs/CHANGELOG.md`・`docs/FEATURE_RULES.md`（決定ログ）・この文書・`shots/r132-*.png`

## 触らない
それ以外すべて。`www/post.js` の写真を描く所（`postThumbs`・`postPics`・`postRow`）は読むだけ ── r131-pic の物。`supabase/schema.sql` は変えない予定（`post_seen` を今の投稿一覧と同じ条件で読む）。
