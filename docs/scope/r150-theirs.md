# r150 — 人の言語はサーバーにだけ。外へ出さない、端末に置かない

決定: docs/FEATURE_RULES.md § Owner decision log 2026-09-30「作れる言語と DL 言語の数は 1・3・無限。人の言語は使うだけ」の (2) と追記。

## 変えてよいもの
- `www/core.js` — 「この言語の中身がメモリの外へ出てよいか」を答える一つの関数（`langOut()`）と、`.got` の写し（`slGot()`）・取った言語の写し（`langTookGot()`／`acctKeep('take')`）がそれを聞くところ。**`langCap`／`dlCap`／`CAN` とプランの画面には触らない（r149）**
- `www/net.js` — `.got` を書く所（`netLangsWalk`・`netLangFill`・`netSliceUp`）の順番と問い
- `www/sound.js` — フォント・SVG の書き出し（`ltFontOut`・`ltSvgSend`・`vLtOut`・一字の共有・文字の画面の右上）
- `www/sheet.js` — 書き取りシート（`shMake`・`openWrOut`・入口）
- `www/post.js` — コピー（`postCopy`）
- `www/share.js` — iPhone のキーボードへ渡す（`shareSig`）
- `www/card.js`（`cardOut()`・`cardSave`・右上の共有）と `www/wordsheet.js`（単語・例文のカードの共有マーク）── 単語と例文のカードは言語の中身のファイルなので
- `tools/theirs-check.mjs`（新しい）、`tools/store-check.mjs`、`tools/gate.mjs`、`package.json`
- 旧仕様（取った言語の写しがディスクに在る／App Group に前の人の言語を渡す）を主張していた `tools/again-check.mjs`・`tools/conv-check.mjs`、`slGot()` の引数が変わった `tools/acct-check.mjs`・`tools/state-check.mjs`
- `CLAUDE.md`（規則 22 と Online の節）、`docs/DATA_MODEL.md`、`docs/DATA_SAFETY.md`、`docs/CHANGELOG.md`、`docs/FEATURE_RULES.md`（決定ログの実装状況の行）
- `shots/r150-*.png`

## 変えないもの
- 編集を止める `langLocked()` の中身
- 投稿のカードが出ること（`cardSave` の投稿の場合、`www/card.js`）── 「カード投稿はok」
- 電話に既にある人の言語の写し ── 自動では消さない。消すかどうかはオーナーに聞く
- `docs/STATE.md`（リーダーのもの。直す文はリーダーに渡す）
