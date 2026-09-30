# r147 — レイヤーの列に中身の小さい絵

決定: docs/FEATURE_RULES.md § Owner decision log 2026-09-30「字を描く画面にベースライン、線ごとの太さ」の追記（スクショを見て）。

## 変えてよいもの
- `www/glyph.js` — レイヤーの列（`geLayersHTML()` と、その絵を描くところ）だけ
- `www/index.html` — `.glayers` の CSS だけ
- `tools/layer-check.mjs`、`tools/fixture.mjs`
- `shots/r147-*.png`
- `docs/CHANGELOG.md` 一行

## 変えないもの
- 描く面、太さ、ベースライン、保存（r145 のまま）
