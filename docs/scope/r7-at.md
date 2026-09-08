# claude/r7-at — 宛先の @handle を本文から出す

実機 143（OWNER 2026-09-08）。他人のプロフィールの ＋ から投稿画面を開くと、
本文の欄に「@handle」が入っていて、文字数の輪もそれを数えている。
「リプライング to @〇〇 ってこともだよ？ 文字数に含ませたくないのよ」

宛先の @handle は本文に入れない。欄の上に「Replying to @〇〇」の行として出し、
本文は空、文字数は本文だけ。宛先は `PW.toh` が持つ。

## 触るファイル

- `www/post.js`
- `www/shell.js`
- `www/act-map.js`
- `www/index.html`（投稿画面と戻るの問いの CSS のみ）
- `www/i18n/*.js`
- `tools/post-check.mjs`
- `tools/fixture.mjs`
- `tools/box-baseline.txt`
- `shots/`
- `docs/CHANGELOG.md`
- `docs/BACKLOG.md`

## 触らないもの

上に無いものすべて。ほかの枝のファイル、`supabase/`、`ios/`、
`tools/gate.mjs`、ほかの検査。

## 二つ目：戻るの問いを `popAsk` に揃える

「投稿の時の下書き入れる時のポップを合わせて欲しい」OWNER 2026-09-08。
投稿画面で戻ると出る「下書きとして保存しますか？」が、アプリの他の問い
（`popAsk()`、画面中央の `.pop`）と別の形をしています。一つにします ──
`backQHTML()`・`.bkq*` の CSS・`BACKQ`・`backStay` は削除。別のコミット。

## 三つ目：#今日のお題 の札を、読む人の表示言語で

「なんで英語なのに#今日のお題やねん」「#今日のお題 は #todays prompt みたいに、
言語が変わったら誰の投稿でもそこが変わるように」OWNER 2026-09-08。
**保存は一つの綴りのまま**（`DAY_TAG`、過去のデータを書き換えない）。**描く時**
に読む人の言語へ。`dayTagShow()`／`dayTagStore()` の二関数一か所。別コミット。

追加で触るもの：`www/sns.js`（`DAY_TAG` の周りと `tagHTML`）、`www/card.js`
（`cardSrc`）、`tools/find-check.mjs` 13、`tools/i18n-check.mjs` の
`DAY_TAG` の除外、`docs/FEATURE_RULES.md` の決定ログ。

## 四つ目：写真 4 枚の投稿で横に送れない

「フォト4枚投稿した時にフォトをスライドして次の画像にいけない」OWNER 実機 143。
`vPhoto()` は一枚だけを描き、横に動かす仕組みが無い。帯（`.pvrail`）にする。
別コミット。追加で触るもの：`www/sns.js` の `vPhoto`、`www/index.html` の
`.pview`/`.pvrail` の CSS。

## 触らないと決めたこと

- 投稿への返信（`PW.to`）の画面。OWNER 2026-08-28
  「リプライングトゥーのやついらん」はそこの話で、引用の投稿 `.pwqs` は
  そのまま。
- 宛先を外す手段は作らない（頼まれていない）。`docs/BACKLOG.md` に一行。
