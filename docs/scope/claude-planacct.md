# claude/planacct ── 段は買ったアカウントのもの

「1アドレス1アカウント」「これは絶対課金もアカウントごと言語もそう」
「Xは違うアカウントだと課金も引き継がれない」 OWNER 2026-09-02

同じ iPhone で別のアカウントに入った人は、その端末で買った購読を引き継ぎません。
段はアカウントのもので、Apple ID のものでも端末のものでもありません。

## いま起きていること

`SET.plan` を書く場所は五つ、戻す場所はゼロ。`ios/App/App/LinguaPlan.swift` に
`uid` の字は一つもありません。

```
A（Pro）がサインアウト → B がサインイン
端末の SET.plan はまだ pro（Keychain は Apple ID のもの、誰のものでもない）
次の起動 → netPlanSync：B の行は空 → best='pro' → netPlanUp('pro')
→ B のアカウントに Pro が付く
```

`SET.planWas` も端末に残るので、B が別人の段を基準にした
「プランが終わりました」のシート（`capLapse()`）を見ることがあります。

## 直しの形

**Keychain に段と一緒に「買ったアカウントの uid」を入れ、uid が合わない
セッションはサーバーの答えが来るまで free から始める。**

`window.__plan` は `www/core.js` の頭で `SET.plan` に入ります。そこは `net.js`
より前で、誰がサインインしているか分かりません。**その順番が要点** ── uid も
一緒に注入して、`netTook()` が uid を知った時点で照合します。

- 「高いほうを採る」（`netPlanSync`）は**別の人を守っている規則で、触りません**。
  別の端末で買った段、圏外の間に買った段を取り上げないためのものです
- 合わないときに Keychain へ書き戻しません。A の買ったものは A のものとして
  Keychain に残り、A が戻ってきたらそのまま戻ります
- `SET.planWas` もアカウントが変わったら初期化します

## 私のファイル

```
ios/App/App/LinguaPlan.swift   ios/App/App/LinguaStore.swift
www/core.js   www/net.js
tools/plan-check.mjs   tools/acct-check.mjs   tools/store-check.mjs
docs/CHANGELOG.md   docs/scope/claude-planacct.md
```

`www/store.js` `www/settings.js` `www/backup.js` `www/home.js` は他のセッションの
ものです。`www/index.html` は要りません。

## 測れないこと

**Swift は この容器でコンパイルできません。**このリポジトリはビルドで四回
落ちています（#89 #94 #95 #117）。`LinguaPlan.swift` と `LinguaStore.swift` に
ついて書けるのは目で二度読んだということだけで、`CODE CONFIRMED` にも
なりません。Keychain の往復は実機でしか見られません。
