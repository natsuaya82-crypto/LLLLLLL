# r151-voynich ── ヴォイニッチの字を Lingua の字として描き起こす

ブランチ `claude/r151-voynich`（integ-0905 から）。決定: `docs/FEATURE_RULES.md`
§ 2026-09-30 Unicode に無い字を Lingua 公式アカウントで用意する。まずヴォイニッチ。

これは**データ**で、機能ではない。アプリのコードは変えない。

## 触ってよい
- `official/voynich.json` ── 字（`letters` スライスの形そのまま）と言語の名前・書き方
- `official/voynich-draw.mjs` ── 線の元（格子の目で書いた字の形）から `voynich.json` を書く小さな Node の道具
- `tools/official-shot.mjs` ── 本物のアプリを起動し、その言語を読み込んで絵を撮る（ゲートに入れない）
- `shots/r151-*.png`、`shots/r151b-*.png`
- `official/ref/` ── 使った写本のページ（Beinecke/Yale 2014 の撮影、パブリックドメイン）と `SOURCE.md`、字ごとの切り抜き `official/ref/glyphs/`
- `official/voynich-trace.py` ── 写本の画像から線を起こす道具
- この文書

## 触らない
- `www/` の下すべて、`supabase/schema.sql`、`package.json`、`tools/gate.mjs`、ほかの tools、ほかの docs。
- サーバーへ置くのはリーダー。この枝は置かない。

## 字の形の出どころ
Yale（Beinecke MS 408、パブリックドメイン）の写本の画像から**なぞる**（2026-09-30 の追記）。EVA は「どの形がどの字か」を知るためだけに使う。字ごとに写本から 2〜3 例を切り抜き、いちばん読める一つの中心線を取り、アプリの格子の目に合わせて線にする。
既存のヴォイニッチ用フォント（EVA Hand・pk「ヴォイニッチ手稿」・ヴォイニッチ等幅・Megami Voynich ほか）のファイルは開かない・なぞらない・読まない。
画像は GitHub の `sunkencity999/voynich-atlas` の `images/web/` から取る（ウェブの Yale・archive.org・Wikimedia はネットワークで止まっている）。出どころは `official/ref/SOURCE.md`。
