# r103 ── 「?」の中に使い方（1.0.3）

ブランチ `claude/r103-help`（`integ-0905` `f4768ac0` から）。決定: `docs/FEATURE_RULES.md` 2026-09-26
「他の道具の強いところを全部入れる」の「使い方は各画面の「?」の中にたくさん描く」。

## 仕組み

二つ目は作らない。`HELP.<k>`（`www/home.js`）に登録し、バーに `helpQ(k)` を渡す。開くと `openHelp(k)` →
`openForm('help:'+k, …)`。「?」の外には一文字も足さない。

## 数えた（着手時）── 今「?」を持っている物

| HELP | 画面 | 中身 |
|---|---|---|
| `glyph` | 字を描く | 描く・ズーム・道具五つ |
| `wsys` | 書き方の種類 | 種類ごとの例・方向 |
| `kb` | キーボードの一覧 | iPhone でオンにする三手順（編集の仕方は無い） |
| `pub` | 設定→この言語 | 公開・DL |
| `wr` | 用紙 | 四手順 |
| `g2.*` | 文法の各章 | 形の意味と例 |

（`fmQ()` の行の「?」と `ipaq` の IPA の群の「?」は行ごとの物で、バーの「?」とは別。触らない。）

## 「?」の無い作る画面 ── 足す

文字の一覧（`letters`、書き出し＝フォント／SVG を含む）、一文字（`letter`）、文字の設定（`ltset`）、
アブギダ（`abugida`）、組み合わせの一マス（`blk`・`blkv`）、字の間（`sp`）、音（`snd:` の用紙）、
辞書（`words`）、一語（`word:`・`edit:`）、単語の自動生成（`gen`・`gensyl`）、語源（`ety`）、
文法の一覧（`gram`）、キーボードの編集（`kb` の一枚の画面）、wiki（`world`・`about`・`wldart`）、
投稿（`post:`）、つづり（`spell`）、関係（`relate`）、形（`fm`）、品詞（`pos`）、語域（`reg`）、下位（`sub`）、ノート（`notes`）。
既にある `glyph`・`wsys`・`kb` は中身を足す（手順）。

## 触ってよいファイル

`www/sound.js` `www/glyph.js` `www/wsys.js` `www/words.js` `www/wordsheet.js` `www/home.js`（HELP 登録と wiki のバー）
`www/phases.js` `www/keyboard.js` `www/post.js` `www/notes.js` `www/i18n/*.js`（10 言語）、`shots/r103/`、この文書。

## 触らない

保存・データ・プラン・サーバー。画面の本体（「?」の外）。`index.html`（CSS は今ある `.sec` `.note` を使う）。
