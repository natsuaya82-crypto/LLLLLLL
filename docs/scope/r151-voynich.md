# r151-voynich ── ヴォイニッチの字を Lingua の字として描き起こす

ブランチ `claude/r151-voynich`（integ-0905 から）。決定: `docs/FEATURE_RULES.md`
§ 2026-09-30 Unicode に無い字を Lingua 公式アカウントで用意する。まずヴォイニッチ。

これは**データ**で、機能ではない。アプリのコードは変えない。

## 触ってよい
- `official/voynich.json` ── 字（`letters` スライスの形そのまま）と言語の名前・書き方
- `official/voynich-draw.mjs` ── 線の元（格子の目で書いた字の形）から `voynich.json` を書く小さな Node の道具
- `tools/official-shot.mjs` ── 本物のアプリを起動し、その言語を読み込んで絵を撮る（ゲートに入れない）
- `shots/r151-*.png`、`shots/r151b-*.png`
- `official/ref/` ── 比較に使う写本のページ（Beinecke/Yale 2014 の撮影、パブリックドメイン）と `SOURCE.md`
- `official/voynich-eva.py` ── 線の点と、見本の絵に重ねて確かめる道具
- この文書

## 触らない
- `www/` の下すべて、`supabase/schema.sql`、`package.json`、`tools/gate.mjs`、ほかの tools、ほかの docs。
- サーバーへ置くのはリーダー。この枝は置かない。

## 字の形の出どころ
**EVA Hand A を見本の絵として**描き起こす（2026-09-30 の追記、オーナー「一旦見本の絵としてやってみて」）。フォントを大きく表示し、アプリの格子を重ね、線の真ん中に目で点を置く。フォントのファイルから輪郭・点・経路は取り出さず、ファイルはリポジトリに入れない。
写本の画像は `official/ref/f1r.jpg` だけ残す ── 比較の絵に使う。出どころは `official/ref/SOURCE.md`。
