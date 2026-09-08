# claude/r7-at — 宛先の @handle を本文から出す

実機 143（OWNER 2026-09-08）。他人のプロフィールの ＋ から投稿画面を開くと、
本文の欄に「@handle」が入っていて、文字数の輪もそれを数えている。
「リプライング to @〇〇 ってこともだよ？ 文字数に含ませたくないのよ」

宛先の @handle は本文に入れない。欄の上に「Replying to @〇〇」の行として出し、
本文は空、文字数は本文だけ。宛先は `PW.toh` が持つ。

## 触るファイル

- `www/post.js`
- `www/index.html`（投稿画面の CSS のみ）
- `www/i18n/*.js`
- `tools/post-check.mjs`
- `tools/fixture.mjs`
- `shots/`
- `docs/CHANGELOG.md`
- `docs/BACKLOG.md`

## 触らないもの

上に無いものすべて。ほかの枝のファイル、`supabase/`、`ios/`、
`tools/gate.mjs`、ほかの検査。

## 触らないと決めたこと

- 投稿への返信（`PW.to`）の画面。OWNER 2026-08-28
  「リプライングトゥーのやついらん」はそこの話で、引用の投稿 `.pwqs` は
  そのまま。
- 宛先を外す手段は作らない（頼まれていない）。`docs/BACKLOG.md` に一行。
