# r151-voynich ── ヴォイニッチの字を Lingua の字として描き起こす

ブランチ `claude/r151-voynich`（integ-0905 から）。決定: `docs/FEATURE_RULES.md`
§ 2026-09-30 Unicode に無い字を Lingua 公式アカウントで用意する。まずヴォイニッチ。

これは**データ**で、機能ではない。アプリのコードは変えない。

## 触ってよい
- `official/voynich.json` ── 字（`letters` スライスの形そのまま）と言語の名前・書き方
- `official/voynich-draw.mjs` ── 線の元（格子の目で書いた字の形）から `voynich.json` を書く小さな Node の道具
- `tools/official-shot.mjs` ── 本物のアプリを起動し、その言語を読み込んで絵を撮る（ゲートに入れない）
- `shots/r151-*.png`
- この文書

## 触らない
- `www/` の下すべて、`supabase/schema.sql`、`package.json`、`tools/gate.mjs`、ほかの tools、ほかの docs。
- サーバーへ置くのはリーダー。この枝は置かない。

## 字の形の出どころ
手稿（15 世紀、パブリックドメイン）の手の形を知識から描く。既存のヴォイニッチ用フォント（EVA Hand・Voynich 101 など）のファイルは開かない・なぞらない・読まない。
