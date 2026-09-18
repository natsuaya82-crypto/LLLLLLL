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

---

# 報告（2026-09-18）

**CODE CONFIRMED のみ。実機では一度も押していません。**Apple のシートは実機で
しか出ないので、決定 1 の道を実機で確かめられるのはオーナーだけです。決定 2 は
ブラウザで撮った写真が下にあります。

**commit は二本に分けました**（`c42c8537` 名前の順／`e6a768ee` 無料の語）。
scope 宣言 `c3de6e3e` はコードより先に push しています。

## 変えた file と、なぜ

### 決定 1（`c42c8537`）

| file | 何を |
|---|---|
| `www/onboard.js` | `obGaveName()` の**一箇所だけ** ── `f+gap+g`（family + given）。gap は `uiLang()` が `ja`／`zh`／`ko` なら `''`、それ以外は `' '` |
| `tools/acct-check.mjs` | claim 78 を四つの面に。`press78(profile, ui)` |
| `tools/fixture.mjs` | **宣言に無い file を一つ触りました** ── 下の「宣言から外れたこと」 |
| `docs/CHANGELOG.md` | コードより先に |
| `docs/FEATURE_RULES.md` | 決定ログ一本 |
| `shots/r40-who-2-name-given.png` | 同じ名前で上書き |

### 決定 2（`e6a768ee`）

| file | 何を |
|---|---|
| `www/i18n/*.js`（十本） | `plan.price.free` の**一行だけ**。`git diff --numstat` で十本すべて `1 1` |
| `www/settings.js` | `planPrice()` の中の `term()` の**一箇所だけ** ── `free` が真なら `.pper` の欄を出さない |
| `tools/plan-check.mjs` | claim 六本（無料の段を二言語で描く） |
| `docs/CHANGELOG.md` | コードより先に |
| `docs/FEATURE_RULES.md` | 決定ログ一本 |
| `docs/BACKLOG.md` | この件の節を消した |
| `shots/r43-plans-{before,after}-ja.png` | 前後 |

**触っていない**：`www/index.html`、`www/net.js`、`www/core.js`、
`supabase/schema.sql`（**`npm run rls` を回す理由がありません**）、
`docs/STATE.md`（リーダーのもの）、`www/act-map.js`（ボタンは増えていません）、
`www/i18n/*.js` の**他の行**（`kb.step4` を含め一行も）。

## 宣言から外れたこと ── `tools/fixture.mjs` 一箇所

宣言の「触る file」に入れていませんでした。**入れるべきでした。**

「名前が入っている」顔が `OBM.nm = '太郎 山田'` と**打ち込んで**いました。
決定 1 のあと、それは **app がもう立てない状態**です
（`CLAUDE.md` § 5 の `wdMode` と同じ形 ── fixture が app に無い状態を歩く）。
そして打ち込んだままでは、リーダーが頼んだ写真が「山田太郎」になりません。

打ち込みをやめて `obGaveName({givenName:'太郎', familyName:'山田'})` に**訊く**
形にしました。こうすると絵は app 自身の答えで、`--lang ja` と `--lang en` が
別の絵になります（打ち込んだままなら同じ絵）。**check が試験対象を自分で
計算し直したら写しになる**、の裏返しです。

## 赤を見た出力

### 決定 1 ── `node tools/acct-check.mjs`

**今の順（given + ' ' + family）のまま、赤 2 本：**

```
  ✗ 78: **Apple が渡した名前が「山田太郎」になっていない** ── OBM.nm="太郎 山田"、plugin は givenName「太郎」familyName「山田」を渡しています。姓→名で、ja なら間の空白なし（OWNER 2026-09-18「山田太郎」、Apple の審査 4、ビルド 161）
  ✗ 78: 英語の面で「Smith John」になっていない ── OBM.nm="John Smith"。姓→名は言語で変わらず、変わるのは間の空白だけです（ja／zh／ko は無し、他は一つ）

acct-check: 2 件。
```

**そして順番だけ直して空白を残した時（`f+' '+g`）、赤 1 本** ── 空白の半分が
本当に保たれていることを別に見ました：

```
  ✗ 78: **Apple が渡した名前が「山田太郎」になっていない** ── OBM.nm="山田 太郎"、plugin は givenName「太郎」familyName「山田」を渡しています。姓→名で、ja なら間の空白なし
```

**押して measure した所が一つあります。**最初 `SET.ui='ja'` を
`start()` の直後に置いたら、`obGaveName()` の時には `en` に戻っていました。
読んで決めずに probe を入れて測ったところ、`netOut()` が `SET.acct` を **A の
まま**にするので、サインインの `setFor(B)` が「A の預かりへ置いて、B の預かりを
持ってくる」── 置いた `ja` は A の側へ行っていました（`SET.ui` は `SET_PREFS`、
account のもの）。**B の預かりに置く**形に直してから赤を見ています。probe は
外しました。

### 決定 2 ── `node tools/plan-check.mjs`

**無料の段を描く claim は一本もありませんでした。**上の claim は全部
`planPrice(PLANS[1], false)` ── Plus を `free` false で描くので、`term()` の
無料の枝は誰も歩いていませんでした。だから claim を六本足しました。

**今の形（`$0` と `／月`）のまま、赤 4 本：**

```
  FAILED  the free rung is the language's own word for free, not a typed price ($0 / $0)
  FAILED  and there is no dollar sign left on it, in any language
  FAILED  no period beside it -- a thing with no price has no month (／月)
  FAILED  and not by any other road either
```

**期間だけ戻した時（語は「無料」、`.pper` を無条件に出す）、赤 2 本：**

```
  FAILED  no period beside it -- a thing with no price has no month (／月)
  FAILED  and not by any other road either
```

**語だけ戻した時（ja を `$0` に、期間は無し）、赤 2 本：**

```
  FAILED  the free rung is the language's own word for free, not a typed price (Free / $0)
  FAILED  and there is no dollar sign left on it, in any language
```

**二つの仕組みを別々に見ています** ── 語は i18n file のもの、期間は `term()` の
ものなので、片方だけ壊した赤が二通り必要でした。

## 回した check

| check | 出力の最後 |
|---|---|
| `node tools/acct-check.mjs` | `acct-check: 全部通った。`（78 が緑） |
| `node tools/plan-check.mjs` | exit 0、`FAILED` 行なし（無料の段の六本が緑） |
| `node tools/es5-check.mjs` | exit 0 |
| `node tools/dead-check.mjs` | `2294 functions and 545 top-level vars in www/, every one of them reached` / `what money buys: 12 capabilities in CAN` |
| `node tools/act-check.mjs` | exit 0 / `screens walked: 633` / `routes reached: 39/39` |
| `node tools/i18n-check.mjs` | exit 0 / `screens the mirror rendered: 451` / `all ten checks pass in all 10 languages` |
| `node tools/box-check.mjs` | exit 0 |
| `node tools/store-check.mjs` | exit 0 |
| `node tools/paid-check.mjs` | exit 0 |
| `node tools/docs-check.mjs` | exit 0 |
| `tools/pre-commit`（両方の commit で） | 通った |

**`npm test` は回していません**（リーダーが取り込んで回します）。
**`npm run rls` を回す理由がありません** ── `supabase/schema.sql` に触って
いません。

**リーダーへ、数字について。**`screens walked` 633 と
`screens the mirror rendered` 451 は**どちらも動いていません** ── fixture の
顔は増やしておらず、中の一つの文字列が打ち込みから関数呼びに変わっただけです。
`press` は回していませんが、ボタンは増えていないので `buttons pressed` も
動かない見込みです。

## 撮った写真

| | |
|---|---|
| `shots/r40-who-2-name-given.png` | **上書き。**名前欄に「山田太郎」（空白なし）。`--lang ja ob@20` |
| `shots/r43-plans-before-ja.png` | プラン、前 ── `$0／月` の横に `$4.99／月` |
| `shots/r43-plans-after-ja.png` | プラン、後 ── `無料`（期間なし）、`$4.99／月` はそのまま |

三枚とも 390×844。**角丸も枠線も説明文も増えていません。**前後の二枚は
無料の段の一行以外どこも動いていません。

## 貯まる物

**一つも増えません。**`localStorage` の鍵も、サーバーの列も、送る中身も同じ
です。決定 1 は入力欄の初期値の組み方、決定 2 は画面に出る語。**移行も削除も
ありません。**`CAN` は一文字も動いていません ── プランが何を許すかは
どちらの決定でも変わっていません。

## オーナーへ ── 二つ

**一つ目、「山田太郎」の間の空白**（scope の頭にも書いた、リーダーの読み）。
`ja`／`zh`／`ko` だけ空白なし、それ以外は空白一つ。**順番は言語で変わらず、
変わるのは空白だけ**です。人が直せる欄なので止まりはしません。

**二つ目、無料のカードの見出しはまだ `Free` です。**値段の所は「無料」に
なりましたが、その上の**プランの名前**は `PLANS` の `name:'Free'` で、
十言語すべて `Free` のままです（`shots/r43-plans-after-ja.png` の
「Free いま」）。だから日本語の画面は「Free」の下に「無料」と並びます。
**プランの名前を訳すかどうかは訊かれていないので、触っていません**
（`docs/FEATURE_RULES.md` § Deciding ── 文言はオーナーのもの）。
Plus と Pro も同じで、商品名は App Store 側にもあります。
