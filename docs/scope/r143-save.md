# r143-save ── 文字を描いて右上の保存を押しても何も起きない（1.0.3 ビルド 177、2026-09-30 オーナー実機）

ブランチ `claude/r143-save`（`integ-0905` から）。

## 触ってよいもの

- `www/shell.js` の keep / save の部分（`keepSave()` とその周り）
- `www/glyph.js` の保存の部分（`geKeep*`）
- `tools/keep-check.mjs`、`tools/fixture.mjs`
- `shots/r143-*.png`
- `docs/CHANGELOG.md`、この文書

## 触らないもの

- `www/act.js`、`www/net.js` ── r140 が作業中。原因がそこにあれば報告だけする。
- それ以外の全部。

## ビルド 177 が走らせているコード

Actions「iOS Deploy to App Store」run 177 は `master` `a8fc0106`。`integ-0905` `f90bea74` との
`www/` の差は `www/net.js` のコメント 6 行だけで、アプリのコードは同じ。
