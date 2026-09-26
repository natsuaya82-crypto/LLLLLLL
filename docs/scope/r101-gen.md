# r101-gen ── 単語の自動生成と語源の系統図（1.0.3）

ブランチ `claude/r101-gen`（`integ-0905` から）。決定ログ `docs/FEATURE_RULES.md` 2026-09-26
「他の道具の強いところを全部入れる」の最初の二つ。

## 持ち物（これ以外は触らない）
- `www/assist.js` ── 候補を作る計算（新しく一つ、`genWords()`）
- `www/words.js` ── 辞書の帯に生成への扉、生成の画面 `vGen`・音節の形の画面 `vGenSyl`
- `www/wordsheet.js` ── 語を選ぶ画面 `vRelate` に「由来の語」の面、編集画面に由来の行、語のページから系統図への扉、
  系統図 `vEty`、`wDrop()`（親が消えても子の `from` を残す）
- `www/phases.js` ── `STG_DEF` に `syl`（音節の形、この言語の物）
- `www/shell.js` ── `PAGES` に `gen`・`gensyl`・`ety` の三行、`pageName()` の relate の名
- `www/route-map.js`・`www/act-map.js` ── その三つの `page(...)` と押す名前
- `www/i18n/*.js` 十言語 ── 新しい鍵
- `tools/fixture.mjs`（面が要れば）、新しい検査 `tools/gen-check.mjs` と `package.json`・`tools/gate.mjs` の一行
- `docs/CHANGELOG.md`・`docs/FEATURES.md`（該当の行）・この文書

## しないこと
- 新しい slice は作らない（語の由来は既にある `word.from`、音節の形は `phases` slice の `STG.syl`）
- 昔の Make 画面は戻さない、`makeWord()`/`asWord()` の挙動は変えない
- 無料/有料の線・候補の数の上限は決めない ── 既定のまま全プラン・上限なし（`can()` を足さない）
- ゲートは回さない（一つの検査と FAST だけ）

## 決まっていないこと（作らずに書いておく）
- 生成の扉のマーク ── 「生成」に決まったマークが無いので、帯に字（`選択` と同じ形）で置く。マークはオーナーが決める。
