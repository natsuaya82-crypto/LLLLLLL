# claude/r59-take ── 人の言語の ↓ が状態を言う／wiki は自分の言語だけ

枝は `claude/r59-take`、`integ-0905`（`2a7beb72`）から。

## OWNER 2026-09-23（原文）

「人の言語dlした時にdlできたかわかりにくいから↓を押したら⭕️でダウンロード状況表示。ダウンロードしてる言語は⭕️☑️にして。」
「後人の言語は自分の言語じゃないからwikiページに表示させないように。」
「dlした言語で開いた時だから、そもそも存在しないから無視してもいいよ」（about が回り続ける件 ── 追わない）

## 触るもの ── これだけ

```
  www/home.js            wldGetRow / wldGet（↓ ⭕ ⭕☑️）、wiki の入口の一問
  www/net.js             netTakePut の答えだけ
  www/core.js            langTook* / langWhose のあたりだけ（要れば）
  www/me.js              wldRow() を呼ぶ一行（プロフィールの wiki の入口）
  www/shell.js           入口がそこにあれば
  www/index.html         状態の印の一つのルールだけ（既存で足りなければ）
  www/i18n/*.js          状態の aria-label
  www/act-map.js
  tools/fixture.mjs, 検査一本（要れば。gate.mjs と package.json に登録）
  docs/FEATURE_RULES.md, docs/CHANGELOG.md, docs/scope/r59-take.md
```

`www/me.js` はリーダーの一覧に無い。入口が `me.js:669` にあると測って分かった
ので、呼ぶ一行だけを触る。

## 触らないもの

上に無いもの全部。保存されるものは変えない。何も消さない。
他の枝を merge / rebase / cherry-pick しない。ゲートは回さない。ビルドしない。
