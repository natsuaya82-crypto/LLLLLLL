# claude/r54-guides ── 文字を描く面に三本のガイド線

枝は `claude/r54-guides`、`integ-0905`（`f10b8fee`）から。
OWNER 2026-09-23「aやね」── 案 A：点の格子の上に、下・中・上の固定ガイド線を
薄く引く。見るだけで、何も保存しない。

## 触るもの ── これだけ

```
  www/glyph.js          geDraw() のあたり（点の格子の下に三本）、geHintField は判断次第
  www/index.html        色の token 一つ、両テーマ ── 本当に要るときだけ
  docs/FEATURE_RULES.md  § Owner decision log に 2026-09-23 の一件
  docs/CHANGELOG.md      人が気づく変化として
  docs/scope/r54-guides.md
  tools/fixture.mjs / tools/ の check 一本 ── 足すなら
```

## 触らないもの

フォント・キー・タイル・カードに出るもの全部。保存するもの全部。設定・切替・説明文は
作らない。他の枝を merge / rebase / cherry-pick しない。`npm test` は回さない。
