# r53-line ── 一行を描く仕組みを一つに（OWNER DECISION 2026-09-23）

- ブランチ: `claude/r53-line`（`origin/integ-0905` の `0b4cf80b` から）
- 決定: 「一行を描く仕組みを一つにして、入力欄も投稿もそれで描くように書き直す。
  書いている時の見た目が、そのまま投稿の見た目になること。字間の設定も同じ話なので一緒に見てほしい。」

## 一つの文

**一行（字・文字・スペース・改行・字間）を並べるのは一つの関数。入力欄も投稿もカードもそれで描く。**

## 触るファイル（リーダーが指定した範囲だけ）

- `www/post.js`、`www/glyph.js`（inkLine/inkAdv の辺りだけ）、`www/card.js`（行を描く部分だけ）
- `www/wsys.js`（プレビューの呼び出しだけ）、`www/numbers.js`（inkLine の呼び出しだけ、要れば）
- `www/index.html`（行と入力欄の CSS だけ）、`www/shell.js`（lnField、要れば）
- `www/act-map.js`、`www/i18n/*`（本当に要る言葉だけ）
- `tools/fixture.mjs`、検査一つ（新規なら `tools/gate.mjs` と `package.json`）
- `docs/CHANGELOG.md`、この文書、`CLAUDE.md` 規則 8 の inkAdv/inkLine の段落

## 触らないもの

- 保存されている投稿（過去の投稿は載っているもので描く。切り直さない）
- 上以外の全ファイル

## 指定の外で触ったもの（理由つき）

- `www/glyph.js` の `installTypeFont()` ── キーボードの書体と投稿の書体を同じ `inkFaceCSS()` で作るため。二つの作り方を残すと「一つの仕組み」にならない。
- `tools/card-check.mjs` §7 ── 消した canvas を測っていた。線の半分を `line-check` へ移し、カードの半分だけ残した。
- `tools/sheet-check.mjs` §3c ── カレンダーの数字に canvas を求めていた。同じ主張を、書体の墨として画素で訊く形に。
- `tools/post-check.mjs` 1328 行の前提一つ ── 「短い投稿に描いた字がある」を canvas ではなく私用領域の文字で訊く。`claude/r50-composer` の未取り込みの一コミットとは重ならない場所。

## リーダーの追加指示（2026-09-23 06:17）

入力欄の textarea はキーを受けるだけにし、文字は透明。見える一行とカーソルは
`postLnHTML()` が描く（カーソルは行末だけ）。空白と改行の判定は `postRuns()` 一か所で、
カード（`cardInkUnits`）もそれを読む。
