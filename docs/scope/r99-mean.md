# r99-mean ── 意味のオン・オフは丸いトグル、意訳は欄の中身の字

ブランチ `claude/r99-mean`（integ-0905 から）。決定: `docs/FEATURE_RULES.md` § 2026-09-26 意味のオン・オフは丸いトグル。

## 触ってよい
- `www/post.js` ── 投稿画面の意味の欄・切り替え・`pwMn()`・`pwSetMn()`・`pwSetLn()`・`openPost()`・`draftOpen()`・`postEdit`/`pwSaveEdit()` の意味の行・`pwSend` の `mn` の行。r98 が持つ `postSend`・`postTake`・`postCountsPull`・`postDel*` は触らない。
- `www/index.html` の投稿画面の節（`.pwmnrow`・`.pwmnsw`）だけ
- `www/i18n/*.js`、`www/act-map.js`
- `tools/post-check.mjs`、`tools/marks-check.mjs`、`tools/fixture.mjs`（tl-check は r98 が触っているので使わない）
- `docs/CHANGELOG.md`、この文書、`shots/r99-*.png`

## 触らない
それ以外すべて。schema.sql は r98。
