# r150 — 人の言語はサーバーにだけ。外へ出さない、端末に置かない

決定: docs/FEATURE_RULES.md § Owner decision log 2026-09-30「作れる言語と DL 言語の数は 1・3・無限。人の言語は使うだけ」の (2) と追記。

## 変えてよいもの
- `www/core.js` — 「この言語の中身がメモリの外へ出てよいか」を答える一つの関数（`langOut()`）と、`.got` の写し（`slGot()`）・取った言語の写し（`langTookGot()`／`acctKeep('take')`）がそれを聞くところ。**`langCap`／`dlCap`／`CAN` とプランの画面には触らない（r149）**
- `www/net.js` — `.got` を書く所（`netLangsWalk`・`netLangFill`・`netSliceUp`）の順番と問い
- `www/sound.js` — フォント・SVG の書き出し（`ltFontOut`・`ltSvgSend`・`vLtOut`・一字の共有・文字の画面の右上）
- `www/sheet.js` — 書き取りシート（`shMake`・`openWrOut`・入口）
- `www/post.js` — コピー（`postCopy`）
- `www/share.js` — iPhone のキーボードへ渡す（`shareSig`）── 追記（同日）で、渡すのは出口ではないので `langOut()` を訊かない形に戻す
- `docs/keyboard-extension.md`・`docs/FEATURES.md`・`docs/PAID_FEATURES.md` の、人の言語をキーボードへ渡さない／単語カードを出さないと言う文
- `www/card.js` と `www/wordsheet.js` ── 追記（同日）「カードはok」で、単語・例文のカードを人の言語でも出す形に戻す（`cardOut()` を消す）
- `tools/theirs-check.mjs`（新しい）、`tools/store-check.mjs`、`tools/gate.mjs`、`package.json`
- 旧仕様（取った言語の写しがディスクに在る／App Group に前の人の言語を渡す）を主張していた `tools/again-check.mjs`・`tools/conv-check.mjs`、`slGot()` の引数が変わった `tools/acct-check.mjs`・`tools/state-check.mjs`
- `CLAUDE.md`（規則 22 と Online の節）、`docs/DATA_MODEL.md`、`docs/DATA_SAFETY.md`、`docs/CHANGELOG.md`、`docs/FEATURE_RULES.md`（決定ログの実装状況の行）
- `shots/r150-*.png`

## 変えないもの
- 編集を止める `langLocked()` の中身
- 投稿のカードが出ること（`cardSave` の投稿の場合、`www/card.js`）── 「カード投稿はok」
- 電話に既にある人の言語の写し ── 自動では消さない。消すかどうかはオーナーに聞く
- `docs/STATE.md`（リーダーのもの。直す文はリーダーに渡す）

## 追記（2026-09-30、同日）── キーボードへ渡すのとカードは出口ではない
オーナーの追記「Lingua キーボードへ渡すこと（App Group）は「端末に置く」「持ち出し」に当たらない」「カードはok」。
- `shareSig()` から `langOut()` の一行を消す。App Group は `theirs-check` の数える出口の種類から外す（例外ではなく、出口ではない）。
- `cardOut()` を消し、単語・例文のカードを元の形に戻す。`cardSave` は `theirs-check` の `NOT_OUT` に一文で載せる。
- `theirs-check` に 1b・6c・7c・8b を足す。`conv-check` のアカウントが替わった時の主張を r150 前の形に戻す。

## CLAUDE.md（リーダーが直す）
このセッションは CLAUDE.md を編集できない（自己変更の防御）。§ Online の次の文が、この変更で偽になる。

旧（CLAUDE.md 68〜77 行）:
> It is USED inside Lingua — its letters shown
> and typed in this app's fields, posts written in it, its meanings read — and
> nothing of it leaves: not a file (font, SVG, the handwriting sheet, a word's
> card), not the clipboard, not the system keyboard's App Group, and not this
> phone's disk, so with no signal it is not shown. A card of a POST is the one
> picture of it that leaves. `langOut()` (`www/core.js`) is the one question —
> langWhose()'s 「mine」, so 「nobody has answered」 is not mine — and every way
> out asks it. **`theirs-check` holds it**: it counts every way out in `www/` by
> what it is and fails one that does not ask, and takes a language from another
> account and finds nothing of it on the disk and no way out on its screens.

新（案）:
> It is USED inside Lingua — its letters shown
> and typed in this app's fields and on the Lingua keyboard, posts written in
> it, its meanings read — and nothing of it leaves: not a file (font, SVG, the
> handwriting sheet), not the clipboard, and not this phone's disk, so with no
> signal it is not shown. Two roads are not leaving and do not ask: a card — of
> a post, a word or an example — is a picture 「カードはok」, and the Lingua
> keyboard's App Group is how anybody types drawn letters inside Lingua, so a
> taken language is handed over there as one's own is 「端末に置くものがそもそも
> ないでしょ？」 OWNER 2026-09-30. `langOut()` (`www/core.js`) is the one
> question — langWhose()'s 「mine」, so 「nobody has answered」 is not mine — and
> every way out asks it. **`theirs-check` holds it**: it counts every way out in
> `www/` by what it is and fails one that does not ask, and takes a language
> from another account and finds nothing of it on the disk, no way out on its
> screens, its word's card offered and its keyboard handed over.

最初の行「「カード投稿はok」「svgやファイル書き出しはng」「だから端末に置くのもng」」はそのままでよい。
