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

## 測った表 ── 直す前と直したあと

`acct-check` と同じ形で流しました（本物のアプリ、`netTook()` で入る）。

| 案件 | 直す前 | 直したあと |
|---|---|---|
| (a) A が pro・印 A の端末に B が入る | 段 **free**、planWas free | 段 free、planWas free |
| (b) **印の無い端末**に pro が残っていて B が入る | 段 **pro**、planWas **pro** | 段 **free**、planWas free |
| (b2) その端末で capLapse() | **何も言わない**（planWas も pro なので） | 何も言わない（両方 free なので） |
| (c) A が戻る（起動、Keychain の二つ） | 段 pro | 段 pro |
| (c2) A が戻る（Keychain 無し・同じ起動のうち） | 段 **pro**（預け写しから） | 段 free → **サーバーが pro を答える** |
| (d) 預け写し `lingua.set.<A>` の中身 | `plan: 'pro'` が入っている | 段も planWas も入らない |

**(b) が穴です。**印のある端末（a）は 2026-09-06 から既に free でした。
**(c2) と (d) が二つ目の答え**で、実機ではそれが PC のバックアップに入る
ファイルです ── `setOnDisk()` が段を設定ファイルから外している、その一行を
預ける側が通っていませんでした。

## 直した形（一行）

段は「サーバーが uid に答えたもの」一本。`planFor()` は**比較する一箇所**に
なり、**枝は二つだけ** ── 段に付いている持ち主（`SET.planUid`）と入ってくる
uid が合えば端末の写しをそのまま、**合わなければ（空も含め、例外なく）
`plan`/`planWas` を free にしてサーバーに訊く**。あわせて**段は設定の預け写しに
入れない**（`var SET_PLAN=['plan','planWas']`、`setAcctKeys()` が飛ばす）ので、
`setFor()` は「段」という語を一つも持たなくなります。Keychain には書き戻さない
ので、A のものは A のまま。

## やったこと

1. 測った（上の表）。
2. 書き直した ── `planFor()` から「印が空なら動かさない」枝を**消した**
   （後付けせず、古い枝は削除）。`SET_PLAN` で段を預け写しから外した。
   `setFor()` の `else if(k==='plan'/'planWas')` の二行は消えました。
3. `acct-check` 40 を新しい答えに書き換え、40b・40c を足した。**赤を見た** ──
   40 は枝を戻すと「持ち主の書かれていない端末の段が、入った人に付いてきた —
   pro」、40b は `SET_PLAN` を読ませないと預け写しが `plan` と `planWas` を
   持って出てくる。
4. 決定ログ（2026-09-02 の Implementation status と 2026-09-11 の新しい項目）、
   `docs/STATE.md`、`docs/PAID_FEATURES.md`、`docs/CHANGELOG.md`（DELETE
   REVIEW）を同じ commit で。

## リーダーへ ── 私のファイルの外に、古くなった一文が一つ

`tools/store-check.mjs` の `'core.js:setParkKey(was)'` の行が、預け写しを
「another account's **plan**, starred searches and notice marker」と説明して
います。段は乗らなくなったので、この一文は古いです（機械的には何も赤く
なりません ── そこは鍵が書かれているかだけを見ています）。`store-check.mjs`
は私のファイル一覧に無いので**直していません**。一語の話です。

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
