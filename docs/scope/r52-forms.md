# r52-forms ── 活用は語にしない。語の「活用」一覧に、ラベルと形のセットで持つ

オーナー 2026-09-23：
「活用は数えないにしよう。無料でなるべく使って欲しい。」
「語ページの活用一覧に出てくる。活用は活用であって単語じゃない。その代わり活用には
ラベルが必要。原型 aa／未来形 aai。ラベルと単語がセットじゃないと登録できない。
ラベル自体は自分でも作れる。キーボードの変換もできるように。」

`integ-0905`（1a7b8db1）から切った `claude/r52-forms` で作業します。

## 触る file

- `www/wordsheet.js`（活用の書き手三つ、語ページの家族欄、活用の追加画面）
- `www/words.js`
- `www/core.js`（`capOK` `wordCap` `wKids` の辺りだけ）
- `www/card.js`（`cardFam` だけ）
- `www/share.js`（`shareMapWords` だけ）
- `www/grammar.js`（`gModel` `gFmRules`）、`www/grammar-engine/*`
- `www/i18n/*.js`（新しい key）、`www/act-map.js`
- `tools/fixture.mjs` `tools/plan-check.mjs` `tools/grammar-engine-check.mjs`
  `tools/conv-check.mjs`、新しい check を一つ（`tools/gate.mjs` と `package.json` に登録）
- `docs/FEATURE_RULES.md` `docs/CHANGELOG.md` `docs/DATA_MODEL.md`、この file

## 触らない file

`www/index.html`（r55 のもの。要るならリーダーに先に訊く）、`www/net.js`、
それ以外すべて。

## やらないこと

- 他の枝を merge / rebase / cherry-pick しない
- ゲート全体は回さない。build もしない
- 古い活用語を辞書一覧でどう見せるかは決めない（選択肢を報告して止まる）
- 接辞の重ね掛け（r46 の話の残り）はこの枝ではしない
