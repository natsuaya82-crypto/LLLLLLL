# r37-migrate ── migrate-check の赤（scope 宣言）

ブランチ `claude/r37-migrate`（`integ-0905` = `5b12a3d7` から）。

## 何をする

`integ-0905` = `5b12a3d7`（r36-index を取り込んだ直後）でゲートを回すと
**migrate-check だけ赤**。`890d3a75`（r36 の直前）では緑だったので、r36 の
変更で赤くなっている。単体（`npm run migrate`）でも同じ赤：

```
the language somebody already has did not survive (6):

  every letter of a free alphabet reads a sound the chart has: got "a: no letter / … / z: no letter", wanted ""
  g is the velar and not the palatal: got "", wanted "ɡ"
  c is k: got "", wanted "k"
  q is k: got "", wanted "k"
  x is k: got "", wanted "k"
  y is j: got "", wanted "j"
```

昔の版がディスクに残した `lingua.<id>.<slice>` の鍵を持つ端末で、その言語が
今の版で**そのまま開く**ことを持つ検査（規則 6・規則 22）。文字が一つも無い。

1. 原因を**押して測る**（読んで当てない）。probe を入れて、サインイン後に
   どこで止まっているかを出す。
2. 直す形は r36 の設計を崩さない ── 一覧は答えそのもの、数えない・決めない・
   上らない。だが規則 22「前に読み込んだ分は出て欲しい」（OWNER 2026-09-04）：
   答えが来ていない端末でも、**この端末が中身を持っている言語は眺めるために
   開く**。patch ではなく `langForAcct()` が何を訊くべきかの rewrite。
3. acct・again・dl・plan・store・migrate・press を単体で回す。

## 触る file

`www/core.js`（`langForAcct` と § LMINE 周り）、`www/net.js`（必要な範囲）、
`tools/migrate-check.mjs`（probe は**外す**か claim に育てる）、
`tools/acct-check.mjs`、`docs/CHANGELOG.md`（振る舞いが変わるなら先に）、
`docs/scope/r37-migrate.md`。

## 触らない file

`www/index.html`、`docs/STATE.md`、他のセッションの持ち場。

## 回さない

全ゲート（`npm test`）── リーダーが回す。
