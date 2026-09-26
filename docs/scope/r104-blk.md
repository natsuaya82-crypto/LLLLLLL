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

---

# 報告（2026-09-26）

コミット: `7874f785` scope → `df047978` CHANGELOG（先に） → `27ccd003` 本体（コード・検査・写真） → `97c9b20d` docs（決定ログ・偽になった文）。
`origin/integ-0905` は取り込み済み（`96a85757` から動いておらず「Already up to date」）。

## ファイルと理由

| ファイル | 何を・なぜ |
|---|---|
| `www/wsys.js` | `WS_BLK_CUTS`（`lr`・`tb`・`q`）をここへ。`wsBlkOf()` は知らない値を左右として読む（値は残す）。`wsBlkVowOf(l)`（その文字の母音）。`wsBlockBoxes()` に田の字: 上の段は初声・母音、下の段は常に二つに割って終声を左から。終声が無ければ左右と同じ。田に収まらない音節（上の段に三つ、終声三つ）は `null`。`wsParts()` は四つより多い字の音節を組まない。 |
| `www/sound.js` | `vLetter` に「置き方」の三行（`ltCutRows()`、見本の絵二つずつ、選んだ物に印、`ltCutPick()`）── 書き方が組み合わせで、その文字が母音の時だけ。`vBlk`・`vBlkv`・`blkV`・`blkPick`・`blkKeepSave`・`HELP.blk`・文字の章の行を消した。`ltOutAsk` を消し、共有マークは `go('ltout')`、`vLtOut()` はフォント・SVG の二行で押すとそのまま書き出す。`HELP.letter` に組み合わせの時だけ置き方の説明（旧 `HELP.blk` の中身を今の形に）。 |
| `www/letters.js` | 一文字のページの KEEP に `cut`（母音の時だけ）。`ltSave()` は型が**変わった時だけ**書く ── バッファは全部の欄を渡すので、そのままだと知らない値を左右で上書きしてしまう。 |
| `www/shell.js`・`www/route-map.js`・`www/act-map.js` | `blk`・`blkv` → `ltout`。`blkPick`・`ltOutAsk` → `ltCutPick`・`ltFontOut`・`ltSvgOut`。 |
| `www/i18n/*.js`（10 言語） | `blk.title`（マスの型）→ `blk.h`（置き方）、`blk.q`（田の字）を足した。`hp.bk.1`・`.1.d`・`.2.d`・`.3.d`・`hp.lt.out.d`・`hp.lt.ab.d` を今の形に。 |
| `tools/fixture.mjs` | 二つの面（型の一覧・一つの母音）を「組み合わせの母音の文字のページ」一つに。block の文字の章の面は行が無くなったので消した。 |
| `tools/block-check.mjs` | 田の三行（ka は左右と同じ、kan は終声が左下だけ、kant は四つ）、五字の音節は組まない、古い route が無い、母音の文字のページで田→保存・上下→保存、子音のページに行が無い、共有マークは書き出しの画面でポップは出ない・二行。 |
| docs | `CHANGELOG.md`（先に）、`FEATURE_RULES.md`（決定ログ一項、2026-09-26「他の道具…」の二行と実装状況を今に）、`DATA_MODEL.md`（`blk` の値）、`FEATURES.md`（二行）。 |

## 挙動

- 書き方が組み合わせの時、母音の文字（例 a）のページに「置き方」── 左右・上下・田の字の三行、見本は「子音＋母音」と「子音＋母音＋終声」
  （田は終声二つ）。押すと印が移り保存が金、保存で書く。子音のページには出ない。
- 田の字: 初声左上・母音右上・終声は左下→右下。終声一つなら左下だけ、無ければ左右と同じ。
- **五つ以上の字の音節は一マスに組まない**（前は詰めていた）── その単位は形なし（描いた字があればそれ）。
- 文字の章の右上の共有マーク → 「書き出す」の画面 → フォント（Plus、今どおり `can('font')`）／SVG（全プラン）。一文字のページの共有マークは今のまま一押し。

## 保存

`script` スライスの `blk` に値 `q` が増える（`{"a":"q"}`）。今ある値は一つも書き換えない（知らない値は左右として描き、選び直さない限り残る）。消える物は無い。

## 確かめたこと（CODE CONFIRMED のみ）

- `npm run block` 緑。**赤を三つ見た**: (a) 田の下の段を字の数で割る → 「kan in four」赤、(b) 四つの上限を外す → 「five letters」赤
  （最初は田の自分の形の判定が先に拒んで緑のままだった ── 左右で訊くよう検査を直してから赤を見た）、(c) 一文字のページから行を外す → 9 行赤。どれも戻して緑。
- pre-commit（fast 全部＋i18n、10 言語、`vLtOut` を含む 73 画面）緑。
- ゲートは回していない。act-check・press・page-check・load-check・marks-check は走らせていない ── 新しい route `ltout` と面が一つ変わったので、リーダーのゲートで見てほしい。

## 確かめていないこと

実機（DEVICE CONFIRMED 無し）。OWNER CONFIRMED 無し。フォント・SVG の共有シートは実機未確認（r102 と同じ）。

## 写真（`shots/r104/`、日本語、ライト、有料、描いた字 k a o n t）

- 前: `before-letters`（「マスの型」の行）・`before-letters-share-pressed`（ポップ）・`before-blk`・`before-blkv-a`・`before-letter-a`（行なし）
- 後: `after-letters`（行なし）・`after-letters-share-pressed`（書き出しの画面）・`after-ltout-shot-ja`（`tools/shot.mjs` で）・
  `after-letter-a`（押していない、左右に印）・`after-letter-a-q-pressed`（田を押した、保存が金）・`after-letter-a-q-saved`・
  `after-letter-k`（子音、行なし）・`after-words-q`（田で組んだ kan・kant の一覧）

## 知っていること・訊くこと

1. 区画の割合（間 0.06、左右・上下の終声の段 0.7、田は四等分）は見た目で仮に決めた。
2. 田の字で終声が無い音節は左右と同じ形にした（上半分だけにはしない）── 見た目の判断。
3. 「置き方」という名（前は「マスの型」）は指示の言葉から取った。
4. 母音が二つ続く音節（二重母音）は田には収まらず組まない。左右・上下は四つ以下なら今までどおり組む。
