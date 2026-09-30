# r146 — フォントの書き出しを全プランに

決定: docs/FEATURE_RULES.md § Owner decision log 2026-09-30「フォントの書き出しは無料、ウェブ版も作る」（フォント分のみ。ウェブ版はしない）。

## 変えてよいもの
- `www/core.js` — `CAN.font` を消す、プランの画面の Plus の行から `plan.plus.7` を消す
- `www/sound.js` — `ltFontOut()` の `upStop(can('font'))` を消す（ゲートは keyboard.js ではなくここにあった）
- `www/settings.js` — `plan.plus.7` のアイコンの行
- `www/i18n/*.js` — `plan.plus.7` を 10 言語から消す
- `tools/plan-check.mjs`、`tools/fixture.mjs`
- `tools/acct-check.mjs` 43 — `can('font')` を例に使っているので別の capability（`letters`）へ向け直す
- `shots/r146-*.png`
- `docs/PAID_FEATURES.md`、`docs/FEATURES.md`、`docs/CHANGELOG.md`、`docs/STATE.md`・`CLAUDE.md` の `CAN.font`/`can('font')` を名指す文（docs-check が落ちる分だけ）

## 変えないもの
- `www/glyph.js`・`www/otf5.js`（r145）
- SVG の書き出し（元から全プラン）、ウェブ版
