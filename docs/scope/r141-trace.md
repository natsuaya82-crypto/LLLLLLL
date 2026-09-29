# r141-trace ── 紙から取り込んだ字の下絵を薄く

触ってよい: `www/glyph.js`（geDraw の下絵の一か所）、`tools/fixture.mjs`、
下絵を持つ一つのチェック、`shots/r141-*.png`、`docs/CHANGELOG.md`。
触らない: home.js, words.js, wordsheet.js, sns.js, act.js, net.js（他セッション）。

## 測ったこと（2026-09-29、integ-0905 `f5b17245`）

- 下絵は `www/glyph.js:3032-3036` の一か所だけで描かれる：`GE.under` を
  `x.globalAlpha=0.16` で `inkStrokes(..., cssVar('--tx'))`。`GE.under` を読む所は他に無い。
- 1.0.3 のビルド 172-174（master `5988eb1b`）にも同じ 0.16 が入っている。
- Chromium で紙の輪を持つ字を開き一本描いた状態：下絵の画素の不透明度は
  約 0.16（α≈41/255）、描いた線は 255。明・暗どちらも灰色の薄い面に見える。
- 紙の字が `sh` のまま `GE.under` に行かず全濃度で出る道（ltNew / inkSet /
  保存 / 再オープン / 下のヒント枠）は見つからなかった。

実機の「濃く出る」の原因は分かっていない。
