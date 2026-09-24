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
