# r5-gram ── 文法の章を埋める（翻訳と文法書が両方成り立つところまで）

- 日付: 2026-09-07
- 枝: `claude/r5-gram`（`origin/master` の `deafe077` から）
- オーナー決定: 2026-09-07「文法のページが中途半端すぎる」「2 を中途半端に
  しないで欲しい」「この文法ページを埋めたら翻訳にもなるし文法書になる」

## 完成の定義

文法の章を埋めれば **(a) 意味（Semantic IR）からその言語の文が作れる＝翻訳、
(b) 章をそのまま並べれば文法書**、の両方が成り立つ形にする。一つの文の
語順だけでは足りない。

## 触るもの

- `www/grammar.js` ── 章そのもの
- `www/phases.js` ── 章が要る語（`CHAP_SLOTS`・`part` の格・`conj` の印）
- `www/grammar-engine/{model,morphology,translate}.js` ── 足りない operation
- `www/wordsheet.js` の `FM_INF` ── 新しい形（人称・法・比較）の一行だけ
- `www/i18n/*.js` ── 10 言語
- `www/act-map.js`・`www/route-map.js` は必要な分だけ
- `www/index.html` は**末尾の `/* ---- r5-gram ---- */` 区画だけ**
- `tools/grammar-engine-check.mjs`・`tools/fixture.mjs`
- `docs/GRAMMAR-V2-SPEC.md`・`docs/FEATURES.md`・`docs/CHANGELOG.md`

## 触らないもの

- `www/index.html` の r5-gram 区画より上（他のセッションが持っている）
- 語順の板が今書いている `STG.order`、既存の 13 の形の章、`fmr` の編集画面
- SNS・キーボード・文字・辞書の画面

## 章の順（一章一 commit）

A2 名詞句の並び → A3 複文 → B4 格を七つに → B6 性・名詞クラス →
B7 冠詞・指示詞 → C10 人称・数 → C12 法（可能・義務・願望）→
C15 コピュラ・存在 → D16 形容詞の比較

## まだ確かめていないこと

- ゲートは回しません（規則 2、リーダーが取り込んだあとに一度）。回すのは
  章ごとに `grammar-engine` と、`www/` を触った commit で hook が回す
  `assets` `es5` と速い側と `i18n`
- 実機では押していません
