# r149 — 作れる言語と DL 言語の数を 1・3・無限に

決定: docs/FEATURE_RULES.md § Owner decision log 2026-09-30「作れる言語と DL 言語の数は 1・3・無限。人の言語は使うだけ」の (1) だけ。(2)（外へ出す道を閉じる）はしない。

## 変えてよいもの
- `www/core.js` — `langCap()`・`dlCap()` とその定数、`CAN.dl`、`planTopFull()`・`langFull()`・`dlFull()`、`dlStop()`・`langStop()`、`PLANS` の行
- `www/home.js` — `wldGetRow()`・`wldGet()`・`langAddRow()` の天井を訊くところだけ
- `www/i18n/*.js` — `plan.*` の行だけ（r148 が同じ十本の別の鍵を触っている）
- `tools/plan-check.mjs`、`tools/dl-check.mjs`、`tools/paid-check.mjs`、`tools/fixture.mjs`（要れば）
- `docs/PAID_FEATURES.md`、`docs/FEATURES.md`、`docs/DATA_MODEL.md`、`docs/STATE.md`、`docs/FEATURE_RULES.md`（この数が偽にする文と、差し替わった決定の印）、`docs/CHANGELOG.md`
- `shots/r149-*.png`

## 変えないもの
- 畳み方（`langsSeen()`・`langMainFall()`）。上限を超えた言語は今日のまま残り、今日のまま畳まれる
- 人の言語の編集・外へ出す道（(2)）
- サーバー（`supabase/schema.sql`）
