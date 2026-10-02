# r161-lines — 文章を書く欄は改行できる

ブランチ `claude/r161-lines`（`origin/integ-0905` から）。
決定：`docs/FEATURE_RULES.md` § 2026-10-02「文章を書く欄は改行できる。一語の欄は一行のまま」。
測定：`docs/scope/r160-newline.md`。

## やること
- 改行できる欄に `lnlines` を付ける（`www/act.js` の keydown が既に聞いている一つの文）。
  `pw-mn`、`wd-exl`・`wd-exg`、`lt-nt`、`cont-b`、`wld-ov-*`。act.js に id の一覧は作らない。
- 例文の欄の Enter が「追加」（`data-kd`）だった所は、追加を ＋ に残し、Enter は改行にする。
  ＋ 以外に追加の道が無い欄は止めて報告する。
- 改行が表示される所（投稿の意味とカード、例文の行とカード、字のメモ、言語ページの概要、問い合わせ）を
  測り、落ちていたら描く一箇所を直す。
- `pua-check` で持つ：上の欄は実 Enter で "\n" が残り受け手に届く、一語の欄は落ちる。
- `docs/CHANGELOG.md`（コードの前）、act.js のコメント、偽になる docs。
- `shots/r161-*.png`。

## 触ってよいもの
`www/act.js`（コメント）、上の欄を作る行（`www/post.js` `www/wordsheet.js` `www/sound.js`
`www/settings.js` `www/home.js` `www/phases.js`）、改行を描く一箇所（`www/index.html` の該当ルール）、
`www/act-map.js`（KD を外したら消える名前）、`tools/pua-check.mjs`、`docs/CHANGELOG.md`、
`docs/scope/r161-lines.md`、偽になる docs の文、`shots/r161-*.png`。

## 触らないもの
一語の欄（名前・ID・リンク・場所・検索・つづり・語形・ラベル・タグ…）。`CLAUDE.md`。保存されたデータ。

## CLAUDE.md（リーダーが直す）
（下に書く）
