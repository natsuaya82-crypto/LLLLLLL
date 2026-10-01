# r148 — レイヤーの欄を Reddit の道具の Layers 欄と同じ形に

決定: docs/FEATURE_RULES.md § Owner decision log 2026-09-30「字を描く画面にベースライン、線ごとの太さ」の最後の追記（r147 のスクショを見て）。

(a) 鉛筆でレイヤーの名前を変える（openForm()、prompt() は使わない）。名前を付けていないレイヤーは「レイヤー n」と出し、何も貯めない。
(b) 目のマークで描く画面の上だけ表示・非表示。隠したレイヤーの線もフォント・キーボード・投稿・カードには入る。隠したかどうかは描く画面の状態で、貯めない（GE の中、画面を離れたら忘れる）。
(c) 欄の絵を今より大きく。44pt 以上。

## 変えてよいもの
- `www/glyph.js` — レイヤーの欄（`geLayersHTML()`、`geLayerInks()`、`geLayer()`、`newGE()` のレイヤー部分、`geDraw()` のほかのレイヤーを描く所、`geNow()`/`geKeep()`/`geOpen()` の名前の持ち運び）、ICON 行に目の印二つ
- `www/shell.js` — `viewLeft()` に一行（字の画面を離れたら隠したのを忘れる）
- `www/act-map.js` — 新しいボタンの名前
- `www/index.html` — `.glayers` の CSS だけ
- `www/i18n/*.js` — `glyph.layer.*` の鍵
- `tools/layer-check.mjs`、`tools/fixture.mjs`（必要なら）
- `shots/r148-*.png`
- `docs/CHANGELOG.md`（コードより先）

## 貯まる物
- 字（`letters` の一行）に `lyn`：レイヤー番号 → 名前。名前を変えた時だけ書く。無ければ既定の名前。何も書き換えない。
- サーバー: `slice_arr()` は字を `id` ごとに行まるごと取るので、知らない欄は落ちない（schema は変えない）。

## 変えないもの
- 線（`ly`、`w`）、フォント、キーボード、投稿、カード、サーバー（`supabase/schema.sql`）
