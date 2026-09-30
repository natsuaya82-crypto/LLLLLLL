# r154 — 太さは点、新しい線は真ん中から、「レイヤー　＋」の見出し

決定: docs/FEATURE_RULES.md § Owner decision log 2026-09-30「字を描く画面にベースライン、線ごとの太さ」の追記（r148 のスクショを見て）。

1. 太さは点の列だけ。スライド式（`GEWV` の 'slide' とそのコード・CSS・フィクスチャの顔）は消す。
2. 新しく引く線は真ん中の点（14）から始まる。`w` の無い今までの線は 24 のまま読む ── 何も書き換えない。
3. 線を選んで（投げ縄）点を押すとその線の太さが変わり、一つ戻すで戻る。
4. 並び: 点の列 → 区切りの線（今ある線と同じ、箱・角丸なし）→「レイヤー」と右端に＋の見出し → レイヤーの行（r148 のまま）。下の＋の行は消す。最後の行がタブバーの下に隠れない。

## 変えてよいもの
- `www/glyph.js` — 字を描く画面の太さとレイヤーの欄（`GEW`、`GEWV`、`geWidth()`、`geWidthHTML()`、`geLayersHTML()`、`geNewSt()`）
- `www/index.html` — 字を描く画面の `.gwidth` / `.glayers` の CSS だけ
- `www/i18n/*.js` — 足す鍵だけ
- `www/act-map.js` — 足す・消す行だけ
- `tools/layer-check.mjs`、`tools/fixture.mjs` の字の画面の顔
- `shots/r154-*.png`
- `docs/CHANGELOG.md`（コードより先）

## 貯まる物
- 新しい線に `w:14` が付く（今までは 24 なら何も付かなかった）。`w` の無い線は 24 として読む。何も書き換えない。

## 変えないもの
- `inkW()` の読み方、フォント、キーボード、投稿、カード、サーバー、core.js、settings.js、sound.js、share.js、sheet.js、post.js、プロフィール
