# r138-add — 単語を足す入口・確定の「保存」・戻る時の確認

Branch: `claude/r138-add`（`integ-0905` から）。決定: `docs/FEATURE_RULES.md` § Owner decision log 2026-09-30。

## 触ってよい
`www/words.js`、`www/wordsheet.js`、`www/shell.js`（keep/leave の部分だけ、原因がそこにある時）、
`www/i18n/*.js`、`www/act-map.js`（名前が変わる時）、`tools/keep-check.mjs` または `tools/word-check.mjs`、
`tools/fixture.mjs`、`shots/r138-*.png`、`docs/CHANGELOG.md`、この文書。

## 触らない
上に無いもの全部。原因が外にあれば報告して止まる。

## やること
- A. 辞書の右上から生成の入口を外し、「＋」から入る。「＋」が今そのまま足す画面へ行くなら、形を二つ報告して止まる。
- B. 足す画面の確定を「＋」の印から「保存」の文字へ（t()、10 言語）。
- C. 足す画面で入力して戻る時の「保存しますか」。原因を測ってから、今ある一つの仕組みに通す。
