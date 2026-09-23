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
