# r95-kbfont — キーボードは誰でも作れる、自作文字のキーボードとフォントの書き出しは Plus（1.0.3）

枝: `claude/r95-kbfont`（`integ-0905` から）。決定: `docs/FEATURE_RULES.md`
「### 2026-09-25 キーボードは誰でも作れる、自作文字のキーボードとフォントの書き出しは Plus から（1.0.3）」。

## 変えてよい物

- `www/keyboard.js` `www/share.js`
- `www/core.js` ── `CAN`・`kbCap` の所と、プランの行（`PLANS` の `lines`）だけ
- `www/settings.js` ── プランの画面の行（`planMark`）だけ
- `www/glyph.js` ── 書き出しの呼び出しだけ／`www/otf5.js` `www/letters.js` `www/home.js` ── 要る時だけ
- `www/act-map.js` `www/i18n/*.js`（末尾に足すだけ、r94 と行を分ける）
- `ios/App/App/` の新しい Swift 一つ（書き出し）と `project.pbxproj` の Sources、登録に要る所だけ
- `tools/*-check.mjs` のうち上を持つ物、`tools/fixture.mjs`
- `docs/PAID_FEATURES.md` `docs/FEATURES.md` `docs/FEATURE_RULES.md`（その決定の Implementation status だけ）`docs/CHANGELOG.md` この文書

## 変えない物

`www/post.js` `www/sns.js` `www/me.js` `www/index.html`（r94-social の物）。CSS が要れば止めて報告。
値段・プランの境は決めない。

## 触る前に見た他の枝

`origin/claude/r94-social` が `www/act-map.js` と `www/i18n/*.js` にコミットを持つ（`ea3061cc` `d4421137` `0cf523a3`）。
こちらは両方とも末尾に足すだけにする。
