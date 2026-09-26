# r104-blk ── マスの型は母音の文字のページへ、置き方は四分割まで、書き出しは画面（1.0.3）

ブランチ `claude/r104-blk`（`integ-0905` `96a85757` から）。今ほかのワーカーは動いていない。

オーナーの言葉（2026-09-26、仕様）:「4分割までで作れればいいんちゃう？組み合わせは文字のページでうまくできるように」
「ますの形ってなに？」「それは文字のページの文字設定の時に作れれば良くない？」「そのポップでフォントとsvg出すのはやめてくれ」
「カードはいらん。文字書いた後の書き出し。」

## やること

A. 組み合わせの一マス（r102、書き方 `block`）の「マスの型」を、一覧 `vBlk` と母音の画面 `vBlkv` から、**母音の文字の一文字のページ**
   （`vLetter`）へ移す。そのページの保存（`ltKeepOn` の KEEP）で書く。`vBlk`・`vBlkv`・`PAGES` の `blk`/`blkv`・文字の章の「マスの型」の行・
   それらの act-map・route-map・fixture の面・i18n の鍵は消す（二つ目の道を残さない）。保存は今の `SCRIPT.blk`（母音ごと）。今ある値は一つも消さない。
B. 置き方を最大 4 分割に: 左右／上下／左右＋下／上下＋下／田の字。母音ごとに選ぶのは三つ（左右・上下・田）で、終声があれば
   左右・上下は下に一段（前と同じ）、田は下の段を左右に割る（終声一つなら左だけ）。四つより多い字の音節は組まない。
   割り方は `wsBlockBoxes()`（`WS_BLK`）一か所。`SCRIPT.blk` に `q` という値が増える → CHANGELOG に先に。block-check に田の行。
C. 文字の画面の共有マークのポップ（`ltOutAsk`）をやめ、共有マークは「書き出し」の画面（`PAGES` に一行）へ。
   その画面は「フォント」「SVG」の二行、押すとそのまま書き出す。一文字のページの共有マークは今のまま。カードの SVG は作らない。
「?」の中（r103 の `HELP.blk`・`HELP.letter`・`HELP.letters`）を今の形に直す。

## 触ってよいファイル
`www/wsys.js`・`www/sound.js`・`www/letters.js`（`ltKeepOn`/`ltSave` に型を足すだけ）・`www/shell.js`（`PAGES` の行）・`www/act-map.js`・
`www/route-map.js`・`www/i18n/*.js`（blk・lt.out・hp の鍵のそばだけ）・`tools/fixture.mjs`・`tools/block-check.mjs`・`docs/CHANGELOG.md`・
`docs/FEATURE_RULES.md`（決定ログ一項、古い文は消す）・`docs/FEATURES.md`・`docs/DATA_MODEL.md`（`blk` の値）・このファイル・`shots/r104/`。

## 触らないもの
`www/index.html`、`ios/`、`supabase/`、`www/words.js`、他の人のブランチ。ゲートは回さない。
