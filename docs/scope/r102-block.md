# r102-block ── 字を組み合わせた一マスと、SVG の書き出し（1.0.3）

ブランチ `claude/r102-block`（`integ-0905` から）。決定ログ 2026-09-26「他の道具の強いところを全部入れる」の二項。

## やること

**A. 組み合わせの一マス**（ハングルのように、描いた字を二つ〜四つ組んで一マスに）
- 書き方 `WSYS` に六つ目 `block` を足す。二つ目の仕組みは作らない: アブギダの組み立て `wsStrokes()`
  を「部品と置き場所」の一つの仕組みに書き直し、アブギダは「置き場所がマス全体」、`block` は
  「型で分けた区画」として同じ関数を通る。
- 切り方は音節（`phCut`）: 初声・中声・終声。組んだマスは今アブギダの組んだ字が流れている道
  （`scriptGlyphDefs()` → フォント・打つ面・キー・投稿の ink・カード）にそのまま乗る。
- マスの型: 中声（母音）ごとに「左右」か「上下」、終声があれば下に一段 ── 左右 / 上下 / 左右＋下 / 上下＋下。
  母音ごとの答えは言語の `script` スライスに `SCRIPT.blk`（新しく保存する物 → CHANGELOG に先に書く）。

**B. SVG の書き出し**
- 文字の画面の右上の共有マーク → 「フォント／SVG」。SVG は描いた字ぜんぶを一枚に。
- 一文字の画面の右上に共有マーク → その字の SVG。
- 渡す道は今のフォントと同じ `LinguaShare.sheet`（`ext:'svg'`）→ `shareFile`。Swift は触らない。

## 触ってよいファイル
`www/wsys.js`・`www/sound.js`（文字の画面・一文字の画面・組み合わせの型の画面）・`www/glyph.js`（必要な所だけ）・
`www/share.js`（変換の層が要る書き方の一覧に block）・`www/shell.js`（`PAGES` に行を足すだけ）・`www/act-map.js`・
`www/route-map.js`・`www/i18n/*.js`（書き方・文字の鍵のそばだけ）・`tools/fixture.mjs`・新しい検査と `tools/gate.mjs`・
`www/core.js`（`langRead()` が `script` スライスの欄を全部持つように、それだけ）・`package.json`（その検査の script）・`docs/CHANGELOG.md`・`docs/FEATURE_RULES.md`（決定の実装状況）・このファイル・`shots/r102/`。

## 触らないもの
`www/words.js` と辞書の画面（r101）、`www/index.html`、`ios/`、`supabase/`、他の人のブランチ。

## 決めないこと（既定は全プラン）
- SVG の書き出しを有料にするか: 決めない。全プランで出す。
- `block` を選べるのは他の四つと同じ `can('wsys')`（今の書き方の線をそのまま使う、新しい線は引かない）。
- 決定ログは SVG を「一行を自分の字で」と書き、指示は「文字（一文字・全部）」。指示どおり文字で作り、
  一行（カード）の SVG は作っていない ── オーナーに訊くこと。
- 区画の割合（左右 1:1、終声の段 0.4 など）は見た目の判断で、オーナーのものではまだない。

---

# 報告（2026-09-26）

コミット: `dd6a7d00` scope → `80812116` CHANGELOG（先に） → `6573523d` `langRead()` の書き直し（単独） →
`374632df` 本体（一マスと SVG、検査、写真） → `ffff6ded` docs（偽になった文）。`origin/integ-0905` は取り込み済み（差なし）。

## ファイルと理由

| ファイル | 何を・なぜ |
|---|---|
| `www/wsys.js` | `WSYS` に `block`。`wsStrokes()` を書き直し: `wsParts()`（部品＝音と区画）→ `wsInto()`（区画へ縮める）。アブギダは区画 `null`＝マス全体で、前と同じ物（同じオブジェクト）を返す。`wsSeq()`（単位を音へ戻す、長い音から）、`wsBlkOf()`/`wsBlkSet()`（母音の型）、`wsBlockBoxes()`（区画の割り方、`WS_BLK`）。`wsUnits()` は block をアブギダと同じ一覧に。切り方は音節文字の枝がそのまま（`phCut`）。 |
| `www/core.js` | `langRead()` が `script` スライスの欄を**全部**持つ ── 四つを名前で写していたので、`blk` は次の保存で落ちていた（覆い: 明日足す欄も落ちない）。 |
| `www/sound.js` | 文字の画面: block の時だけ「マスの型」の行。`vBlk()`（母音の一覧、見本一つ＋今の型）、`vBlkv()`（左右／上下の二行、見本二つずつ、選ぶとバーの保存が光る＝KEEP）。共有マーク → `ltOutAsk()`（「フォント／SVG」を `popAsk`）。`ltSvg()`・`ltSvgPath()`（輪郭はフォントと同じ `glyphContours`＋`GPEN`）・`ltSvgOut()`（描いた字ぜんぶ、8 列、字ごとに `<g><title>名前</title><path/>`）・`ltSvgOne()`（一文字の画面の右上）。 |
| `www/shell.js` | `PAGES` に `blk`・`blkv`（`blkv` の名は母音）。 |
| `www/route-map.js`・`www/act-map.js` | 二つの道。`ltOutAsk`・`ltSvgOne`・`blkPick` を足し、画面が名指さなくなった `ltFontOut` を外した（関数は `ltOutAsk` から呼ばれて残る）。 |
| `www/share.js`・`tools/conv-check.mjs` | 打つ単位と書く単位が違う書き方に `block`（ローマ字の面が出る）。conv-check は同じ一覧を持っていたので同じ一語を足した。 |
| `www/i18n/*.js` | `ws.k.block`・`.d`・`.eg`、`blk.title`・`blk.lr`・`blk.tb`、`lt.out`・`lt.out.font`・`lt.out.svg`（10 言語）。`kb.font` は誰も言わなくなったので 10 言語から消した（i18n-check が「unused」で赤にした）。 |
| `www/home.js` | コメントの「five」を six に（一語）。 |
| `tools/block-check.mjs`・`tools/gate.mjs`（SLOW）・`package.json`（`npm run block`） | 新しい検査（下）。 |
| `tools/fixture.mjs` | 面を三つ: block の文字の章、マスの型、一つの母音 ── 足さないと act-check が `blkPick` を「名指す画面が無い」と言う。 |
| docs | `CHANGELOG.md`（先に）、`DATA_MODEL.md`（六つ、`blk`）、`FEATURES.md`（行を二つ）、`FEATURE_RULES.md`（決定の実装状況）。 |

## 挙動

- 設定 → 言語 → 文字の種類に「組み合わせ」。選ぶと語は音節で切られ、`kan` は k・a・n の描いた字を縮めて一マスの一字になる。
  見出し・辞書・wiki・カード（`LinguaScript` の合字の道）に乗る。**写真 `after-words`**: `kano` が二マス。
- 母音ごとに左右（ㅏ の形）か上下（ㅗ の形）。終声のある音節は下に一段足される → 左右／上下／左右＋下／上下＋下。
  何も選んでいない母音は左右。ペンは縮めない（線の太さは同じ）。
- まだ描いていない部品は飛ばす。最初の部品（初声）に形が無ければそのマスは形なし ── アブギダが前からそうだった規則と同じ一つ。
- 文字の画面の共有マーク → 「フォント」「SVG」。フォントは今までどおり Plus（`upStop(can('font'))` は `ltFontOut()` の中）、
  SVG は**全プラン**。一文字の画面は、形のある字だけ右上に共有マーク（SVG）。

## 保存される物

- `script` スライスに `blk`: `{"o":"tb"}`（上下に置く母音だけ）。書き方は今までどおり `language.wsys`（値 `block`、列に制約なし）。
- 消す物は無い。`langRead()` は知らない欄を**残す**ようになった（前は落としていた）。

## 確かめたこと（CODE CONFIRMED のみ）

- `npm run block` 緑、18 行。**赤を見た**: (a) `langRead()` を元の四欄だけに戻す → 「読み直しても上下」が `lr` で赤（連鎖で SVG の行も赤）、
  (b) `wsInto()` を「縮めない」にする → 四つの形が全部赤。どちらも戻して緑。
- アブギダの台: 前（integ-0905）と後で**差 0 画素**（`before-abugida-bench`／`after-abugida-bench`）。
- pre-commit（fast 全部＋i18n）緑。ゲートは回していない（リーダーの物）。conv-check・act-check・press・page-check は走らせていない ──
  `block` が conv-check の書き方の一巡に入るので、リーダーのゲートでそこを見てほしい。

## 確かめていないこと

- **実機**。SVG を共有シートから Files／AirDrop へ出して、Illustrator や Figma で開けるか。`LinguaShare.sheet` は `ext` を英数字で受けるので
  Swift は触っていない（`svg` は通るはず、実機未確認）。
- DEVICE CONFIRMED・OWNER CONFIRMED はどちらも無し。

## 写真（`shots/r102/`、日本語、ライト）

`after-wsys`（六つ目の行）／`before-wsys` ・ `after-letters`（マスの型の行）／`before-letters` ・
`after-letters-ask`（押した後: フォント／SVG）／`before-letters-ask`（前は押すと直接フォント、この環境は共有の口が無いのでトースト） ・
`after-letter-k`（右上に共有と保存）／`before-letter-k` ・ `after-blk`（母音の一覧） ・ `after-blkv-o`（上下が選ばれている）・
`after-blkv-o-pressed`（左右を押した: 印が移り保存が金） ・ `after-blkv-a` ・ `after-words`／`before-words` ・ `after-abugida-bench`／`before-abugida-bench`。

## 知っている限り・オーナー／リーダーに訊くこと

1. **Lingua キーボードで打った欄と投稿の行ではマスは組まれない**（字が一つずつ並ぶ）。これは今のアブギダと同じ所: 打つ面 `LinguaType` は
   字ごとに別の `@font-face` なので合字が掛からず、投稿の ink（`postInkOf()`）は字の id ごとに形を運ぶ。組むには打つ面を合字を持つ一つの
   フォントにし、`postInkOf()` で字の並びを単位に切って `wsStrokes()` を載せる ── 投稿の行と line-check（欄と投稿の行が同じ ink）に
   関わるので、ここでは決めずに止めた。ローマ字で書いた見出し・辞書・カードは組まれる。
2. **SVG の中身**: 決定ログは「一行を自分の字で SVG」、指示は「文字（一文字・全部）」。指示どおり文字を作った。一行（カード）の SVG は未。
3. 区画の割合（間 0.06、終声の段 0.7）は見た目の判断で、オーナーの数ではない。
4. 一文字の画面は右上に共有と保存の二つが並び、`.navdo` がどちらも `margin-left:auto` なので間が割れる（`after-letter-k`）。
   `index.html` は触っていない。
5. SVG を有料にするか: 決めず全プラン。block を選べるのは他の四つと同じ `can('wsys')`。
6. `ios/App/LinguaKeyboard/Compose.swift` のコメントが書き方を五つ並べている（`how` の値は持つだけで分岐していないので動きは同じ）。ios/ は範囲外。
