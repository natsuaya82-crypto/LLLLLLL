# r14-keep ── 保存ボタンが光らない所を一本化する

オーナー 2026-09-10：「書き換えてもセーブボタン光らないとこ多いからこれも一本化してね」

`integ-0905` の `982ae856` から切った `claude/r14-keep` で作業します。

## 触る file

- `www/shell.js`（`KEEP` と § THE BUTTON IN THE CORNER THAT DECIDES）
- `keepOn()` を呼ぶ 13 箇所の file ── `www/glyph.js` `www/grammar.js`
  `www/home.js` `www/keyboard.js` `www/letters.js` `www/me.js`
  `www/notes.js` `www/phases.js` `www/sound.js` `www/wordsheet.js`
- `www/act-map.js`
- `tools/keep-check.mjs`、`tools/fixture.mjs`
- `docs/scope/r14-keep.md`（この file）、`docs/CHANGELOG.md`

## 触らない file

`www/index.html`、`www/net.js`、`www/core.js`。必要になったら止まって理由を書きます。

## やらないこと

- 他の枝を merge / rebase / cherry-pick しない
- ゲート全体（`npm test`）は回さない。`npm run keep`、`npm run press`、
  速い九つだけ
- 見た目を変えない（ボタンが金になる**瞬間**は変わる）

## 表 ── 測ったもの

「測る」が終わったらここに書きます。
