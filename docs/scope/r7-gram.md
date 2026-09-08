# claude/r7-gram — 文法一覧の「この言語について」を削除

OWNER 2026-09-08：「この言語については非表示にしてよ 文法ページ」。

## 何を消すか
文法の一覧の最後の章「この言語について」。中身は単語数・活用の数・派生の数の
三つの数だけで、目次にも同じ名前の章があり、そちらが本物。

- `www/grammar.js` — `g2Chaps()` の `{id:'st', body:g2Status, nm:t('wld.about')}`、
  `g2Status()`、それだけが使う `g2Stat()`
- `www/i18n/*.js` 10言語 — `g2.forms` と `g2.der`。`g2.words` は
  `g2FmMade()` が今も使うので残す
- `www/index.html` — `.gside` `.gsl` `.gsw` を着るのは `g2Stat()` だけなので、
  その四行と `html[data-script="on"] .gsw` を落とす。着る者のいない CSS は
  `css-baseline` が拾う

`wld.about` の鍵は目次とプロフィールが使うので残す。

## 触らないもの
`www/index.html` は上の五行だけ。角丸・枠は足さない。他のファイルは触らない。

## 回すもの
`npm run dead` `npm run i18n` `npm run act` `npm run es5`。
`npm test` はリーダー。写真は `node tools/shot.mjs --lang ja gram`。
