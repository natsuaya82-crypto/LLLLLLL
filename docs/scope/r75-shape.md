# r75-shape — 画面の形（r73 §2-14 のうち、規則で決まっている物だけ）

### Scope
- Goal: r73 §2-14 のうち CLAUDE.md で既に禁止・決まっている物を、面ごとに一つの形で書き直し、
  その面を数える検査を置く。`.pktabs` の横チップ列 → リスト / 死んだ `#sheet` を消す /
  行の `margin-top` の組 → 区切りの行 / act-check の `on*=`・box-check の長い形と grammar-engine・
  face-check の `font:` 略記 / theme の外の色（`.capwarn` `.thbar`）。
- Owns (may change): www/index.html（CSS） www/home.js（openPick・closeSheet の周りだけ） www/sound.js
  www/settings.js（行の形だけ） www/import.js www/phases.js www/wordsheet.js www/words.js www/grammar.js
  www/notes.js www/numbers.js www/onboard.js（コメントだけ） www/act-map.js www/i18n/*.js
  tools/act-check.mjs tools/box-check.mjs tools/box-baseline.txt tools/face-check.mjs tools/css-baseline.txt
  tools/press.mjs tools/fixture.mjs、検査（要れば一本、package.json・gate.mjs）
  docs/CHANGELOG.md docs/scope/r75-shape.md
- Does NOT own: それ以外すべて。CLAUDE.md は持っていない（r77-docs が触っている）── 直すべき文は
  報告に書いてリーダーへ渡す。keyboard.js（r60-up）にある違反は一覧に書いて止める。
- Decision it implements: CLAUDE.md § Shape（一つ目・五つ目）、§ Rows in one list are one height、
  規則 3（`SHELL_OK`）、規則 17・18、index.html の theme ブロックの一文。
- Check to run: 赤を見るためだけに、担当の検査を一本ずつ（act・box・face・press）。ゲートは回さない。
