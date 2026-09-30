# r145 字を描く画面：ベースライン、線ごとの太さ、レイヤー (claude/r145-glyph)

Owner decision 2026-09-30 「字を描く画面にベースライン、線ごとの太さ」 and its 追記
(docs/FEATURE_RULES.md).

May change: `www/glyph.js`, `www/otf5.js`; `www/post.js` / `www/card.js` /
`www/keyboard.js` / `www/sound.js` only where ink is drawn and only to pass a
stroke's width through; `www/index.html` (CSS of the glyph editor only);
`www/act-map.js`; `www/i18n/*.js` (aria-labels); `tools/*-check.mjs` added or
extended for this; `tools/fixture.mjs`; `tools/gate.mjs` + `package.json` if a
check is added; `shots/r145-*.png`; `docs/CHANGELOG.md`; `docs/DATA_MODEL.md`;
this file.

May not change: the lasso's behaviour (r144), ROUND, fill, anything outside the
glyph editor and the places ink is drawn. No stored stroke is rewritten.
