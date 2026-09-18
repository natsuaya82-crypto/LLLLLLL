# r43-namefree ── 二つの決定：くれた名前は姓→名、無料の段は「無料」の語

ブランチ `claude/r43-namefree`（`integ-0905` = `4734f868` から）。
**取り込むのはサブリーダー／リーダー。全ゲート（`npm test`）は回しません。**

**二種類なので commit を分けます** ── 名前の順と、無料の語。それぞれ
`docs/CHANGELOG.md` をコードより先に書きます。

## 決定 1（OWNER 2026-09-18）「山田太郎」── くれた名前は姓→名

`www/onboard.js` の `obGaveName()`（r40 が作った**一箇所**）が今
`givenName + ' ' + familyName` で「太郎 山田」を組んでいます。**姓→名に。**

間の空白は表示言語で決まります ── `uiLang()` が `ja`／`zh`／`ko` なら空白
**なし**（「山田太郎」）、それ以外は空白**一つ**（「Smith John」）。
Google の `name`（丸ごと来る）はそのまま、は今のまま。

## 決定 2（OWNER 2026-09-18）「free」── 無料の段は `$0` をやめて語に

`www/i18n/*.js` の `plan.price.free` が十言語すべてドルの額（八つが `$0`、
de と fr が `0 $`）。**その言語の「無料」の語に。**そして `www/settings.js`
`planPrice()` の中の `term()` で、無料の段は**語だけ**を出し
`plan.per.mo`（「／月」）を付けません ── 値段の無い物に期間はありません。
`term()` の**中の一箇所**で、二つ目の関数は作りません。

`docs/scope/r41-review.md` § 3.1.2-c が突いていた所で、
`docs/BACKLOG.md` の「The plans screen says `$0` in every language」は
決まったので消します（その節にいる「自動更新の開示」の段落は別の話なので
残します）。

## 触る file（宣言）

| file | 何を |
|---|---|
| `www/onboard.js` | `obGaveName()` **だけ** |
| `www/settings.js` | `planPrice()` の中の `term()` **だけ** |
| `www/i18n/*.js` | **`plan.price.free` の行だけ** |
| `tools/acct-check.mjs` | claim 78（赤を見てから直す） |
| `tools/plan-check.mjs` | 要れば |
| `docs/CHANGELOG.md` | コードより先に、二回 |
| `docs/FEATURE_RULES.md` | 決定ログに二行 |
| `docs/BACKLOG.md` | `$0` の節を消す |
| `docs/scope/r43-namefree.md` | これ |
| `shots/` | 下の三枚 |

**触りません**：`www/index.html`、`www/net.js`、`supabase/schema.sql`、
`docs/STATE.md`（リーダーのもの）、`www/i18n/*.js` の**他の行**（別の
session が同じ十 file の `kb.step4` を消すので）、他のどの file も。

## 写真

| | |
|---|---|
| `shots/r40-who-2-name-given.png` | **同じ名前で上書き**（`--lang ja ob`、名前が入っている顔） |
| `shots/r43-plans-before-ja.png` | プラン、前 |
| `shots/r43-plans-after-ja.png` | プラン、後 |

## 貯まる物

**増えません。**`localStorage` の鍵も、サーバーの列も、送る中身も同じです。
移行も削除もありません。`plan.price.free` は画面に出る語で、貯まりません。

## オーナーへ ── これはリーダーの読みです

**「山田太郎」の間の空白**です。オーナーの例は「山田太郎」（空白なし）で、
そこから「日本語なら空白なし・欧文なら空白一つ」と読みました
（「Smith John」を「SmithJohn」にしないため）。**`ja`／`zh`／`ko` だけを
空白なし**にしています ── 中国語と韓国語の名前も姓が先で間を空けないので
同じ扱いです。**人が直せる欄なので、どちらでも止まりはしません。**

## 報告

下に追記します（赤を見た出力、回した check、撮った写真）。
