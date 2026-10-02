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

## 止めたこと（オーナー／リーダーに聞く）
**文法の章の例文 `sx-ln`・`sx-gl` は変えていない。** 例文を足す道は Enter（KD `stAddEx`）だけ:
見出しの ＋（`stExOpen`）は `stExNew` を立てて欄を開くだけで欄を読まず、バーの保存（`stExKeepOn`）は
バッファ `ex` を書くだけで欄を読まない。Enter を改行にすると例文を足す道が無くなる。指示どおりボタンを
作らずに止めた。選択肢（決めるのはオーナー）:
1. 語の例文と同じにする ── ＋ を押すと欄の中身を足してから次の欄を開く（`wdOpenMore()` の形）。
2. バーの保存が欄の中身も取り込む。
3. 一行のまま（Enter で追加）。

## 測ったこと（2026-10-02、`pua-check` H と同じ測り方）
直す前、"\n" を入れて描いた結果：投稿の意味（タイムライン・カード）、例文の行と訳（語のページ）、
例文の訳（例文のカード・語のカード）、字のメモ（人の言語の読む面）、言語ページの概要（読む面、名前と値）
── 全部一行に畳まれていた。例文の行のカードと問い合わせが送る本文は前から二行。

## 見つけたが触っていない
- 語のメモ `wd-nt`・語源 `wd-ety` は欄では改行できるが、語のページで読む `.note` は pre-wrap が無く一行に
  畳まれるはず（`www/index.html` を読んだだけで、測っていない。今回の欄ではないので変えていない）。

## CLAUDE.md（リーダーが直す）
CLAUDE.md には今 `lnlines` の文が無い。足すなら一文:
「文章を書く欄は `lnlines` を付け、Enter が改行になる（OWNER 2026-10-02）。見せる所は `www/index.html`
の pre-wrap 一行とカードの `cardWrap()`。`pua-check` G・H が持つ。」
