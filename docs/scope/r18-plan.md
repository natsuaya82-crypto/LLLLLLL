# claude/r18-plan ── 1アカウントに1課金。印の無い端末も例外にしない

```
1アカウントに1課金ですけど。他のアカウントについてくるわけねえだろ
```
OWNER 2026-09-11。これが仕様で、**例外は無い**。

2026-09-02 の決定（「課金はメールアドレスのアカウントに紐づく。端末が同じでも
引き継がない」、`docs/FEATURE_RULES.md`）の残りです。その決定は
`Implementation status: **未実装。**` のまま置かれていますが、**半分は入って
います** ── `acct-check` 37・38・39・41・42 が持っています。残っているのは
**印の無い端末**という一つの例外で、それを閉じるのがこの枝です。

## 読んで分かったこと（測る前）

**一。段の答えが二つある。** `planFor()` は `setFor()` そのもので、`setFor()` は
`lingua.set.<uid>` に預けた**設定の写しから段を戻します**。もう一方は
Keychain →`window.__plan` →`SET.plan` の道（`www/core.js` 冒頭）と、サーバーの
答え（`netPlanVerify()` →`planTook()`）。**預けた写しは生の `SET` から作られ、
`setOnDisk()` を通っていません** ── 実機で段を設定ファイルから外している
（`setOnDisk()`）のとちょうど逆で、預ける側にはその一行がありません。

**二。`SET.planUid` が二つの意味を持っている。** 書いてある場所が二つあり、
二つとも別のことを言っています：

| どこ | 何と書いてあるか |
|---|---|
| `tools/store-check.mjs` FIELDS | 「the account that **bought** the plan this phone is holding」 |
| `www/core.js` § SET_PHONE | 「which account's **settings** are live here」 |

`setFor()` はあとの意味で読み（`was`）、Keychain の seed（`core.js:1042`）は
さきの意味で書きます。**印の無い端末という例外はこの重なりから出てきます** ──
設定の写しにとって「印が無い」は「この人のものとして引き取る」が正しく
（`meFor()` と同じ形）、段にとっては「誰が買ったか誰も言えない」です。一つの
欄が両方を答えているので、片方の正しさがもう片方の穴になっています。

**三。`acct-check` 40 が、その例外を今の答えとして持っています。**
「持ち主の書かれていない端末は、名前を書き留めるだけで段は動かさない」。
オーナーの 2026-09-11 の一文がこれを置き換えます。書き換えて、赤を見ます。

## やること

1. **測る。**(a) A が買った端末で B が入る (b) 印の無い端末に有料が残っていて
   B が入る (c) A が戻る ── の三つを `acct-check` の形で流し、表にしてここに
   足す。
2. **書き直す。**「この人の段は何か」の答えを一つにする。形はこのファイルに
   一行で足してから書きます（リーダーが見る）。後付け禁止、古い道は削除。
   **課金した本人からは何も取らない** ── A が戻れば A の段はサーバーが答える。
3. **検査。**`acct-check` に (a)(b)(c)。バグを戻して赤を見る。
4. 決定ログの「未実装」を今の形に、`docs/STATE.md` の「未実装です。」も同じ
   commit で。`docs/CHANGELOG.md` に DELETE REVIEW。

## 私のファイル

```
www/core.js（plan/planFor/Keychain の周りだけ）  www/store.js
www/settings.js（サインアウトの周りだけ）
tools/acct-check.mjs  tools/plan-check.mjs  tools/fixture.mjs
docs/scope/r18-plan.md  docs/CHANGELOG.md  docs/FEATURE_RULES.md
docs/STATE.md  docs/PAID_FEATURES.md
```

`www/index.html` は触りません。**`ios/` は触りません** ── Swift が要ると
分かったら止まって書きます。他のブランチは merge も rebase も
cherry-pick もしません。ゲート全体は回しません（`npm run acct`・`plan`・
`store` と速い九つだけ）。

## 測れないこと

**Swift はこの容器でコンパイルできません。**Keychain の往復は実機でしか
見られないので、`ios/App/App/LinguaPlan.swift` について書けるのは目で読んだ
ということだけで、`CODE CONFIRMED` にもなりません。
