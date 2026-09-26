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

---

# 報告（2026-09-26）

コミット: `eb947bf6`（refactor: `shStep()` を `helpStep()` へ、見た目は同じ）、`124e465a`（本体）、この報告の
コミット（中国語・韓国語・日本語で、行の名前を画面の名前どおりに直した ── 由来の語／来源词／유래어）。
`origin/integ-0905` はブランチを切った `f4768ac0` から動いていない（merge は「Already up to date」）。

## 画面ごと

| HELP | 画面（route／用紙） | 中身 | 写真（`shots/r103/`） |
|---|---|---|---|
| `letters` 新 | 文字の章 `letters` | 段落・3 手順・書き出し（共有マーク：フォント／SVG）・用紙・アブギダ／組み合わせの行 | `form-help-letters-ja.png` `bar-letters-ja.png` |
| `ltset` 新 | 文字の部屋 `ltset:*` | 3 手順（開く・長押しで並べ替え／−で外す・ペンのマス）・＋・絞り込みと並び・最初からある文字 | `form-help-ltset-ja.png` `bar-ltset-alpha-ja.png` |
| `letter` 新 | 一文字 `letter:*` | 描く・名前・音・メモ・保存・既存文字から選ぶ・SVG | `form-help-letter-ja.png` `bar-letter-l1-ja.png` |
| `glyph` 足した | 字を描く `glyph:*` | 3 手順（線を引く・整える・保存）の後に前からのズームと道具五つ | `form-help-glyph-ja.png` `bar-glyph-l1-ja.png` |
| `wsys` 足した | 書き方 `wsys` | 2 手順（選ぶ・保存）の後に前からの種類（`block` を含む）と方向 | `form-help-wsys-ja.png` |
| `abugida` 新 | 母音の台 `abugida` | 段落・3 手順 | `form-help-abugida-ja.png` |
| `blk` 新 | マスの型 `blk`・`blkv` | 段落・3 手順（母音・型・終わりの子音）・自分の字で描かれる | `form-help-blk-ja.png` |
| `sp` 新 | 字間 `sp` | 段落・2 手順・投稿は書いた時の字間 | `form-help-sp-ja.png` `bar-sp-ja.png` |
| `snd` 新 | 音の表（用紙 `snd:*`） | 選ぶ（もう一度で外す）・保存・群の開閉と群の ? | `form-help-snd-ja.png` |
| `words` 新 | 辞書 `words` | ＋・開く・検索／絞り込み／並び・作る・選択 | `form-help-words-ja.png` `bar-words-ja.png` |
| `word` 新 | 一語（用紙 `word:*`・`edit:*`・`add:*`） | 編集・つづり・意味と例文・関連語・保存・系統図・カード | `form-help-word-ja.png` `bar-form-word-kano-ja.png` |
| `gen` 新 | 単語を作る `gen`・`gensyl` | 段落・3 手順・綴れる語だけ | `form-help-gen-ja.png` `bar-gen-ja.png` |
| `ety` 新 | 系統図 `ety:*` | 上・下・変える・押せない行 | `form-help-ety-ja.png` `bar-ety-kano-ja.png` |
| `spell` 新 | 読み `spell` | 音を押す・再生 | `form-help-spell-ja.png` |
| `rel` 新 | 関連語を選ぶ `relate:*` | 選ぶ・ここで作る・由来の語は一つ | `form-help-rel-ja.png` |
| `gram` 新 | 文法の本と章 `gram`・`gram:book:*` | 段落・3 手順・節の ? | `form-help-gram-ja.png` `bar-gram-ja.png` |
| `kb` 足した | キーボード一覧 `kb` | 前からの iPhone の三手順の後に「キーボードを作る」: 足す・選ぶ・①②③と確定・端末に適用、マーク（キーの設定・結合・寄せ・＋・消す・戻す進む）、長押しで動かす | `form-help-kb-ja.png` |
| `wld` 新 | 言語のページ `about`・`world`・`wldart:*` | 段落・読む・書く・公開・DL可 | `form-help-wld-ja.png` `bar-about-ja.png` |
| `post` 新 | 投稿（用紙 `post:`） | 一行・意味・写真・声・送る（長押しで自分だけ）・下書き | `form-help-post-ja.png` `bar-form-post--ja.png` |
| `notes` 新 | メモ `notes` | 段落・＋・読む／直す・消す | `form-help-notes-ja.png` `bar-notes-ja.png` |

キーボードの編集の説明は一覧の「?」一つに入れた。2026-09-06「一か所」（板のページには置かない）と今日の指示の両方を満たす形。
板のページに二つ目の「?」が要るならオーナーの判断。

**足さなかった作る画面**（判断を仰ぐ）: `pos`・`reg`・`sub`（一つ選ぶだけの一覧）、`fm`（行ごとに前からの ? がある）、
`find`、`build`（目次）。同じ仕組みで一行ずつ足せる。
（`fmSay()` は行の「?」を `toast()` で出していて、バーの「?」と別の出し方。触っていない ── `docs/BACKLOG.md` 行き候補。）

## ファイル

`www/home.js`（`helpPara`／`helpNote`／`helpStep`／`helpMark`、`HELP.wld`、言語のページのバー）、`www/sound.js`、`www/glyph.js`、
`www/wsys.js`、`www/words.js`、`www/wordsheet.js`、`www/phases.js`、`www/keyboard.js`、`www/post.js`、`www/notes.js`、
`www/sheet.js`（`shStep` を消した）、`www/i18n/*.js`（`hp.*` 149 個 × 10 言語）、`docs/CHANGELOG.md`、`docs/FEATURE_RULES.md`（実装状況の一文）。
保存する物・消す物・プラン・サーバーは触っていない。`index.html` も触っていない。

## 確かめたこと（CODE CONFIRMED）

- pre-commit（fast 全部＋i18n、10 言語、`openHelp` の面を含む 74 の面）が二回とも緑。手元で es5・dead・sides・box・face を走らせて緑。
- 20 の「?」を日本語で開いて撮り、目で見た（上の表）。二つの段落が続くと詰まっていたのを直した（`helpPara` は上に間、手順の下の行は `helpNote`）。
- 書いた事実は画面のコードで確かめた: 音はもう一度押すと外れる（`ltTakeSnd`）、端末に適用はどのキーボードで打つか（`kbApply`）、
  メモ・キーボード・辞書の＋は下の丸、読みの押しは末尾に一音足す（`spAdd`）、画面で言葉のボタン（作る・選択・用紙・既存文字から選ぶ・系統図・カード）にはマークを描かない。

## 確かめていないこと

- ゲート全体（press・act ほか）は回していない ── リーダーの番。「?」がバーに一つ増えた画面は press の押す数が増えるはず。
- 英語以外の 8 言語の文は自分で書いた訳で、話者は読んでいない。写真は日本語だけ。
- DEVICE: 実機は見ていない。バーが狭い投稿画面は写真では収まっている。
- OWNER: 文の中身（何を書き、何を書かないか）はオーナーが「?」を開いて読むまで決まっていない。
