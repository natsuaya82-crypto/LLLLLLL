# r140-spin ── 文字の保存で星が見えない（実機 1.0.3）

ブランチ `claude/r140-spin`（integ-0905 から）。

触る: `www/index.html` の `.netspin` の規則だけ（原因がそこにある場合）、`tools/spin-check.mjs`、
`tools/fixture.mjs`（必要なら）、`shots/r140-*.png`、`docs/CHANGELOG.md`、この文書。
`www/act.js`・`www/net.js`・`www/core.js`・`www/shell.js`・`www/glyph.js` は原因がそこにあると測れた時だけ。

触らない: `www/home.js`（r136）、`www/words.js`・`www/wordsheet.js`（r138）、`www/sns.js`（r139）。
