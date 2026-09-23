# claude/r56-guide-sp ── 字を描く面の目安線を田に、字間を自分のページに

枝は `claude/r56-guide-sp`、`integ-0905`（`1a7b8db1`）から。OWNER 2026-09-23 の二つ。

## 触るもの ── これだけ

```
  www/glyph.js          geDraw() の目安線のところだけ（口と十）
  www/wsys.js           字間のスライダーと見本（横と縦）
  www/settings.js       設定→言語の「字間」を > の行に
  www/shell.js          PAGES に一行
  www/route-map.js      page(...) 一行
  www/act-map.js        要るなら
  www/i18n/*.js         本当に要る鍵だけ
  tools/guide-check.mjs 口と十を持つように書き直す
  tools/fixture.mjs     新しいページの面
  docs/FEATURE_RULES.md 決定ログ
  docs/CHANGELOG.md     記録
```

## 触らないもの

`www/index.html`（r55 のもの。既存のクラスを使う）、`www/sns.js` `post.js`
`core.js` `wordsheet.js` `share.js` `card.js`。他の枝を merge / rebase /
cherry-pick しない。ゲート全体は回さない。ビルドしない。
