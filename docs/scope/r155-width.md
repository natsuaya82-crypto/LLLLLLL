# r155 — 太さの点は 12・18・24・32・40、新しい線は真ん中の 24 から

決定: docs/FEATURE_RULES.md § Owner decision log 2026-09-30「字を描く画面にベースライン、線ごとの太さ」の追記（同日、夜）── 案 A。r154 の「真ん中の 14 から」はこれに差し替え。

1. 点は 12・18・24・32・40（今は 6・10・14・19・24）。`GE_W` (`www/glyph.js`) が一か所。
2. 新しい線は真ん中の点 24 から ＝ `GPEN.width` と同じなので、新しい線は `w` を書かない（r154 以前と同じ）。
3. `w` の無い線は 24 のまま。r154 で保存された `w:6/10/14/19` はその値のまま読む ── 読みの下限（`GE_W.min`）は 6 のまま残し、点だけを変える。何も書き換えない（docs/DATA_SAFETY.md）。
4. 読みの上限（`GE_W.max`）は 40。

## 変えてよいもの
- `www/glyph.js` — `GE_W` とその上のコメント、`GEW` / `geWidth()` / `geWidthHTML()` / `geNewSt()` のコメント
- `tools/layer-check.mjs`、`tools/fixture.mjs` の字の画面の顔
- `shots/r155-*.png`
- `docs/CHANGELOG.md`（コードより先）、`docs/scope/r155-width.md`、6〜24・14 と言っている文書の文

## 変えないもの
- `GPEN`（24）、`inkW()` の読み方（下限 6 はそのまま）、フォントの asc/desc、`www/otf5.js`、キーボード、投稿、カード、サーバー、ほかの画面、CLAUDE.md
