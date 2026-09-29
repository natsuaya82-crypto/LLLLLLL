# r142-add — 自動生成は新しい単語の画面のボタン、足す画面の確定は「保存」、戻る時の確認

Owner decision: docs/FEATURE_RULES.md § Owner decision log 2026-09-30.

A. 「自動生成」ボタンを新しい単語の画面（New word、`openAdd`）だけに置く。押すと
   つづり・読み・品詞が埋まり、意味は空のまま。つづりは辞書から学ぶ（音の頻度、
   音節の数、品詞ごとの語末）。辞書が小さい時は言語の音（今の `genShapes`/`genWords`、
   `www/assist.js`）── 一つのエンジンを広げる。辞書の右上の「作る」、`vGen`・`vGenSyl`、
   その道・PAGES・`genTake`/`genAgain`/`genSylSet`・help・i18n を消す。`STG.syl` は
   書かなくなり、あれば読む。
B. 足す画面の右上は「保存」。
C. 足す画面で書いて戻ると「保存しますか」。測った原因：その画面は KEEP に何も
   登録しない（`wdFormHTML` の `if(!mk)` と `wdKeepOn` の `addW` の門）。同じ一つの
   仕組み（`wdKeepOn` → `keepOn`）に乗せる。B はその仕組みの角の「保存」。

May change: www/words.js, www/wordsheet.js, www/assist.js (the engine lives here, not in
words.js — nobody else is in it), www/shell.js (PAGES gen/gensyl; keep/leave only if C's
cause is there), www/route-map.js, www/act-map.js, www/i18n/*.js, www/index.html (CSS of
removed screens only), tools/gen-check.mjs (holds A), tools/keep-check.mjs,
tools/word-check.mjs, tools/fixture.mjs, other tools only to drop gen/gensyl,
shots/r142-*.png, docs/CHANGELOG.md, docs/FEATURE_RULES.md (status lines).

May not change: home.js (r136), sns.js (r139), act.js/net.js (r140), the glyph guide (r141),
www/phases.js (the grammar-slot sheet keeps its own ＋ — reported, not touched), anything else.
