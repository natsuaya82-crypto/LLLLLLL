# r83-make ── 2026-09-24 オーナーの答えのうち、作る側の五つ

枝 `claude/r83-make`（`integ-0905` 04667bc2 から）。決定は `docs/FEATURE_RULES.md`
「2026-09-24 オーナーの答え（確認事項 40 項への返事）」。

## 実装する物

- A. 自作文字のスイッチ（`myFontWant()`）を切ったら、ホーム画面のウィジェットもローマ字（「合わせて」）。
- B. 単語のつづりを打つ欄を描いた字で出す（「綴りはローマ字でいいわけないやろ」）。欄はすべて同じ答え。
- C. 紙に描いて取り込んだ字を描き直す時、紙の形を下に薄く敷く（「薄くして欲しい」）。
- D. スマホのキーボードの短い行を、作る画面（`kbStart()`）と同じく真ん中に（「合わせて」）。
- E. キーを持って運ぶ長押しの判定を 10px に（「あわせて」）。

## 持ち物（これ以外は触らない）

www/share.js www/glyph.js www/keyboard.js www/letters.js www/words.js www/wordsheet.js（B に要る所だけ）
www/index.html（B・C の CSS だけ） ios/App/LinguaWidget/*.swift ios/App/LinguaKeyboard/*.swift
上の項を持つ検査（kb-check・line-check・pua-check など） docs/CHANGELOG.md、このファイル。

## 触らない

`tools/fixture.mjs`（r82 の物 ── 要ると分かったら止めて報告）。それ以外の `www/`。

## やり方

CLAUDE.md § Simple・§ COVERED。直した物は検査が赤になるのを一度見る。見た目が変わった物は前後の写真を shots/ に。
Swift はここでビルドできない ── 変えた所を報告に書く。全ゲートは回さない。

## 報告

**CODE CONFIRMED のみ**（直した物はどれも、直す前の形で検査が赤になるのを一度見た）。DEVICE・OWNER は無い。全ゲートは回していない。

| 項 | 直した所 | 検査 | 写真 |
|---|---|---|---|
| A ウィジェット | `shareWidget()`（share.js）が `myFontWant()` を訊き、切れていれば形を渡さない。`shareSig()` にスイッチ。Swift は変えていない（形が無い時のローマ字の道を通る） | base-check 3 行 | shots/r83-A-widget-before/after.png |
| B つづりの欄 | `spTypeField()`（letters.js）が面と中身を決める。中身が字の名前だったのが原因（測った）。fmmk・rel-hw も通す。`myFontField()` は TFONT を訊く | pua-check F | shots/r83-B-spell-before/after/after-off.png |
| C 紙の形 | `newGE()` が `GE.under`、`geDraw()` が 0.16 で下に | fill-check 3 行 | shots/r83-C-paper-before/after/after-drawing.png |
| D スマホの短い行 | `KeyBoardView.swift` `layoutSubviews()` が半列 20 で数え、十未満の行を `kbStart()` の位置に | kb-check（`halfCols` = `KB_COLS`）。位置そのものは実機 | 撮れない（拡張） |
| E 長押し 10px | keyboard.js `kbDragTo`・letters.js `ltDrag` を `HOLD_SLOP` に | kb-check（www/ の長押しを全部数える） | 見た目は変わらない |

**持ち物外で触った物**：CLAUDE.md 規則 19 の一文（「短い行は…まだ訊いていない」を D の事に）。同じコミットで直す決まりに従った。

**持ち物外で残した物**：
- `www/home.js` `wldDragMove()`（言語のページの並べ替え）は縦横 8px。kb-check の `HOLD_LEFT` に名指し ── 直したら名前を消さないと赤。
- 投稿欄 `#pw-ln`（post.js / index.html）はスイッチに関係なく描いた字。つづりの欄はスイッチに従う。「欄はすべて同じ答え」なら投稿欄も `myFontField()` に ── post.js は持ち物外。
- 例文の行（`wd-exl`）・文法の語（grammar.js `gpol-w`、`.tfont` は付くが中身は空で始まる）は「つづり」ではないので触っていない。
- D：地球キー（share.js が最後の行の頭に足す）を残すホームボタンの iPhone では、最後の行が一キー広くなってその幅で真ん中に来る。
- pua-check F が見つけるつづりの欄は 3（wd-ln・rel-hw・fmr-add）。wfm-f・fmmk-* は同じ `spTypeField()` を通るが、受け手が打った時に `spType()` を呼ばない／fixture の顔に出ないので数えられていない。
