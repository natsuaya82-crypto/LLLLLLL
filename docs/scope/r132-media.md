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

## 報告（2026-09-29）

**CODE CONFIRMED のみ。実機未確認。OWNER 未確認。**

- 読む: `netMediaBy()`（`www/net.js`）── `post_seen` を `author=eq.<uid>&body->pu=not.is.null`、新しい順、`limit=NET_PAGE`、続きは `created_at=lt.<一番古いタイル>`。列は `NET_POST_SEL`。ミュートで絞らない（`posts_by()` の書いた物の側と同じ）。**`schema.sql` は変えていないので `npm run rls` は回していない。**
- 問い `media`（`www/sns.js`）: `askMedia()` は `askPosts()` と同じ形、`pageReads('profile')` は写真タブの時だけ `['media', h]` を足す、`snsMoreOf()` は写真タブなら `media` を続ける。`pfSetTab()` はその表で待ってから描く。
- 描く（`www/home.js`）: `pfMedia()` ── その人が書いた投稿（返信を含む、リポストは入らない）のうち `postThumbs(p)` がある物を、サーバーの答えが届いた所（`MORE_AT`）まで新しい順。`pfGrid()` ── 3 列の正方形、`postThumbs(p)[0]` を `netMediaSrc()` で（時系列と同じ道 ── r131 の直しがそのまま効く）、2 枚以上で `ICON_MANY`。押すと `postOpen`。空は他のタブと同じ `.note`（「まだ写真がありません。」）。
- 検査: `load-check` 9（11 行）。今の形で赤（9 件 FAIL）を見てから実装。バグを三つ戻して赤を見た ── 続きが最初のページを読み直す（2 FAIL）、写真で絞らない（4 FAIL）、続きが投稿の問いを読む（2 FAIL）。
- 回した物: FAST 全部、`load-check`、`i18n`、`act` ── 緑。press・page・marks などは回していない（fixture に顔を三つ足したので press の数は動く）。
- 絵: `shots/r132-media-mine-ja.png`（自分・写真あり）、`r132-media-none-ja.png`（写真なし）、`r132-media-other-ja.png`（人のページ）。
- 知っている限り: タブは画面をまたいで残る（今の三つのタブと同じ振る舞い、変えていない）。写真を `pu` でなく古い `pic` だけで持つ投稿はサーバーの問いに入らない。
