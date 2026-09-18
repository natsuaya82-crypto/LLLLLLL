# r40-siwa ── Sign in with Apple が渡した名前を、名前欄に入れて出す

ブランチ `claude/r40-siwa`（`integ-0905` = `11480dd5` から）。
**取り込むのはサブリーダー／リーダー。全ゲート（`npm test`）は回しません。**

## なぜ

Apple の審査（ビルド 161、2026-09-18、Guideline 4）:

> Sign in with Apple のあとに、名前かメールを入力させている。
> Authentication Services が既に渡している。

## オーナーの決定（2026-09-18、形 A）

**Apple／Google がくれた名前を「名前と @」の顔の名前欄に入れた状態で出す**
（人は直せる）。**@ は今までどおり打つ** ── Apple は持っていないので。
**名前が来なかった時は今どおり空欄**（Apple は初回の認可でしか名前を返さない）。
**メールは何にも使わない**（Apple の relay があるので）。

**一つの仕組み**：`obSocial()` が plugin の `profile` を `obIn()` へ渡し、
`obIn()` の「行が無い」枝がそれを `OBM.nm` に入れる。二つ目の道は作らない。

## 触る file（宣言）

| file | 何を |
|---|---|
| `www/onboard.js` | `obSocial()` が profile を渡す、`obIn(prof)` の「行が無い」枝、名前を組む一箇所 |
| `www/i18n/*.js` | 要れば（新しい文字列は今のところ無い見込み） |
| `tools/acct-check.mjs` | claim 一本（赤を見てから直す） |
| `tools/fixture.mjs` | 「名前と @」の顔をもう一つ（名前が入っている側） |
| `docs/CHANGELOG.md` | コードより先に |
| `docs/scope/r40-siwa.md` | これ |
| `shots/` | 「名前と @」の二枚（入っている／空） |

**触らない**：`www/index.html`、`www/net.js`、`supabase/schema.sql`、
`docs/STATE.md`（リーダーのもの）、他のどの file も。

## 貯まる物

**増えません。**名前は今までどおり `netMakeProfile(h, nm)` で上がります。
`localStorage` の鍵は一つも増えません。

## 報告

下に追記します（赤を見た出力、回した check、撮った写真）。

---

# 報告（2026-09-18）

**CODE CONFIRMED のみ。実機では一度も押していません。**Apple のシートは実機で
しか出ないので、`obSocial()` から先を実機で確かめたのはオーナーだけができます。

## 変えた file と、なぜ

| file | 何を |
|---|---|
| `www/onboard.js` | `obSocial()` が `r.result.profile` を拾って `obIn(prof)` へ渡す（捨てていた行）。`obIn(prof)` の「行が無い」枝が `OBM.nm=obGaveName(prof)`。`obGaveName()` を新設 ── plugin の profile から名前を組む**一箇所**。`netSignIn()` の ok を `function(){ obIn(); }` に（`obIn` の引数が意味を持ったので、auth の答えがそこへ流れ込まないように） |
| `tools/acct-check.mjs` | claim 78（下） |
| `tools/fixture.mjs` | 「名前と @」の顔をもう一つ ── `saying who you are, name given`。**両方撮るため**で、欠けているほうにバグが出るからです |
| `docs/CHANGELOG.md` | コードより先に書きました |
| `shots/` | `r40-who-1-empty.png` / `r40-who-2-name-given.png`（どちらも ja） |

**触っていない**：`www/index.html`、`www/net.js`、`www/i18n/*.js`（**新しい文字列は
ありません**）、`supabase/schema.sql`（**`npm run rls` を回す理由がありません**）、
`docs/STATE.md`（リーダーのもの）、`www/act-map.js`（ボタンは増えていません）。

## 振る舞い

Apple か Google で**行の無い新しい account** が入ると、「ユーザー名とID」の顔に
**名前が既に入って**立ちます。空欄で立って「名前を入れてください」で止まっていた
のが、Apple の審査（4）が指していた所です。

- **@ は今までどおり空**で、人が打ちます ── Apple も Google も handle を
  持っていません。アドレスは handle ではなく、Apple のは relay です。
- **名前が来なかった時は空のまま。**Apple が名前を渡すのは**初回の認可の時だけ**
  で、二度目からは `null` で来ます。そこを埋めるのは名前を発明することです。
- **メールは何にも使いません。**
- **profile の行がある人はこの枝を通りません** ── 一行上で返ります。provider の
  渡した名前が、その account が持っている名前を上書きすることはありません。
- **自動で account を作りません。**入るのは欄の初期値だけで、上がるのは人が
  「次へ」を押した時、今までどおり `netMakeProfile(h, nm)` です。

**名前の組み方は一箇所（`obGaveName()`）。**`name` があればそれ（Google が
持っています）、無ければ `givenName` + ' ' + `familyName`。読めない物は全部 `''`
＝空欄。**二つ目の道は作っていません。**

## 貯まる物

**一つも増えません。**`localStorage` の鍵も、サーバーの列も、送る中身も同じです。
名前は今までどおり `profile.display`。**移行も削除もありません。**

## 赤を見た出力（バグを入れたまま）

`node tools/acct-check.mjs`：

```
  78: Apple／Google が渡した名前は「名前と @」の名前欄に入って出る ── 来なかった時は空のまま（Apple の審査 4、ビルド 161）

  ✗ 78: **Apple が渡した名前が名前欄に入っていない** ── OBM.nm=""、plugin は givenName「太郎」familyName「山田」を渡しています（Apple の審査 4、ビルド 161）

acct-check: 1 件。
```

赤は**この一本だけ**でした。同じ case の前提（`OBM.mode` が `who` になっている、
`@` が空、名前の来ない面で名前欄が空）は三つとも緑 ── つまり道は本物に通って
いて、落ちていたのは名前だけです。

**押して測っています。**偽の `SocialLogin` plugin と偽の `netSend` を置いて、
本物の `obSignInApple()` → `obSocial()` → `netIdToken()` → `obIn()` を最後まで
走らせ、`OBM.nm` を読みます。`obIn()` を直接呼ぶ形にはしていません ── 捨てて
いたのは `obSocial()` なので、そこを飛ばすと何も測っていないことになります。

## 回した check

| check | 出力の最後 |
|---|---|
| `node tools/acct-check.mjs` | `acct-check: 全部通った。`（78 が緑） |
| `node tools/es5-check.mjs` | exit 0 |
| `node tools/dead-check.mjs` | `2294 functions and 545 top-level vars in www/, every one of them reached`（`obGaveName` を含む） |
| `node tools/act-check.mjs` | `all 10 checks pass` / `screens walked: 633` / `routes reached: 39/39` |
| `tools/i18n-check`（pre-commit が回した） | `screens the mirror rendered: 451` / `all ten checks pass in all 10 languages` |

**`npm test` は回していません**（リーダーが取り込んで回します）。

**リーダーへ、数字について。**`tools/fixture.mjs` に顔を**一つ**足したので、
`press` の `buttons pressed` と `i18n` の `screens the mirror rendered` はその
一顔ぶん上がります。**意図した動き**で、中身は「ユーザー名とID」の顔の、名前が
入っているほうです。

## 撮った写真

| | |
|---|---|
| `shots/r40-who-1-empty.png` | 名前が来なかった時（今までと同じ ── プレースホルダの「ユーザー名」） |
| `shots/r40-who-2-name-given.png` | 来た時（欄に「太郎 山田」が入っている） |

どちらも `node tools/shot.mjs --lang ja ob`、390×844。角丸も枠も説明文も
増えていません。

## オーナーへ ── 訊いていないこと

**名前の並び順**です。Apple は `givenName`／`familyName` を別々に渡すので、
くっつける順番はこちらが決めることになります。いまは **given + ' ' + family**
（「太郎 山田」）です。日本語の名前として「山田 太郎」にしたいかどうかは
**決めていただく物**なので（`docs/FEATURE_RULES.md` § Deciding）、こちらでは
決めていません。人が直せる欄なので、どちらでも止まりはしません。
