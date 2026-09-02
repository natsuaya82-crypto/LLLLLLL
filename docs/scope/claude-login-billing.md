# claude/login-billing ── ログインと課金の読み合わせ

2026-09-02。`origin/master` は `cb1d78b`。**コードを読んだだけです**
（CODE CONFIRMED）。実機では一つも見ていません。`npm run plan` と
`npm run store` は緑で、下の四つは**どれも緑のまま通ります**。

範囲: `www/net.js` `www/store.js` `www/core.js` `www/settings.js`
`www/boot.js` `www/onboard.js` `ios/App/App/LinguaStore.swift`
`ios/App/App/LinguaPlan.swift` `supabase/schema.sql`。

**何も直していません。** どれを直すかは決めごとを含むので、報告だけです。

---

## 1. アクセストークンを更新するのは起動の一回だけ

`netResume()` の呼び出し元は `www/boot.js:106` の一箇所きりです
（`grep -rn "netResume" www/`）。Supabase のアクセストークンは既定で
一時間。401 を受けて更新し直す道も、復帰したときに更新する道もありません。

アプリのプロセスは iOS では何日も生きます。**一時間を越えて開いたままの
セッションでは、サーバーへの書き込みが全部黙って落ちます** ── 投稿、
`netLangSync()`（＝言語がサーバーに届かない）、下書き、プロフィール、
プランの書き込み。

そのうえ `netWhy()` は 401 を `t('net.badlogin')`
（メールアドレスかパスワードが違う）に訳します。期限切れは入力の誤りでは
ないので、出る言葉も違うものです。

言語はサーバーが本体（CLAUDE.md § Online）なので、これは課金より先に
効いてくる穴です。

## 2. 解約が次の起動で取り消される

順番がすべてです。

```
boot.js:106  netResume(bootSession, …)    ← 非同期。まだ返ってこない
boot.js:127  capLapse()                   ← 同期。ここで走る
```

`capLapse()` は段が動いたときに `netPlanUp(now)` を投げます（`core.js:1169`）。
`netPlanUp` は `SESS.at` をそのまま使う ── そして**この時点の `SESS.at` は
前回の起動のもの**で、一日ぶりに開いた端末では期限切れです。`netPlanUp` は
`onreadystatechange` も `onerror` も空関数なので、401 は誰にも見えません。

そのあと `bootSession()` から `netPlanSync()` が走り、サーバーの古い `pro` と
端末の `free` を較べて**高いほうを採り**、`planKeep(best)` で **Keychain まで
`pro` に書き戻します**（`net.js:613-626`）。Apple が「終わった」と言ったものを
アプリが上書きする形です。

```
解約 → Transaction.updates → Keychain 'free'
次の起動 → capLapse が free を送る（401 で消える）
        → netPlanSync が pro を読む → 端末も Keychain も pro に戻る
        → planWas も pro になるので capLapse は二度と鳴らない
```

`plan` 行を下げる道は `capLapse()` の投げっぱなし一本だけで、`netPlanSync()`
は定義上**上げることしかしません**（`if(there!==best) netPlanUp(best)` の
`best` は必ず `there` 以上）。一度上がった行は下がりません。

## 3. アカウントを変えても端末の段が残る

`SET.plan` を書く場所は五つで、**アカウントが変わったときに戻す場所は
ありません**（`grep -rn "SET\.plan *=" www/`）。`netTook()` は `meFor()` で
名前を、`langForAcct()` で言語を入れ替えますが、段には触りません。
`netOut()` も同じです。

```
A（Pro）がサインアウト → B がサインインする
端末の SET.plan はまだ 'pro'（Keychain は Apple ID のもの）
次の起動 → netPlanSync: B の行は空 → best='pro' → netPlanUp('pro')
→ B のアカウントに Pro が付く。そして 2 のとおり下がらない
```

一つの Apple ID の購読から、いくつでもアカウントに Pro を配れます。
「アカウント変えたら無限に言語作れるやん」（OWNER 2026-09-01）を閉じる
ために段をアカウントへ移したので、閉じたかった穴が別の口で開いています。

## 4. 読めなかった Keychain と、空の Keychain が同じ枝にいる（Swift 側）

`LinguaStore.swift` § `writeDown(mayLower:false)`:

```swift
if !mayLower {
  let (held, st) = LinguaPlanPlugin.readPlan()
  if st == errSecSuccess, !held.isEmpty, Self.best(seen, held) != seen {
    return held
  }
}
LinguaPlanPlugin.set(seen)      // ← 読めなかったときもここへ落ちる
```

読みが失敗したとき（`errSecSuccess` 以外で `errSecItemNotFound` でもない
とき）、守りは効かずに `seen` を書きます。`seen` は
`Transaction.currentEntitlements` が空なら `free` で、空は
「持っていない」と同じくらい「答えが来なかった」でもある ── この
ファイル自身のコメントがそう書いています。`LinguaPlan.inject()` は
`errSecItemNotFound` を「答えた」に数えて区別しているのに、こちらは
していません。

`plan-check` はここを持っていません。当たっているのは
`/st\s*==\s*errSecSuccess/` という**正規表現**で（`tools/plan-check.mjs:1048`）、
文字列があることしか言っていません。落ちたときに何が起きるかは測って
いないので、この枝は緑のまま通ります。

前景でしか通らない道なので確率は低いです。ただし二度刺された形と同じ形です。

## 5. すでに書いてあること ── レシートの検証がない

新しい発見ではありません。`docs/scope/claude-acct2.md` と
`supabase/schema.sql:414` が書いているとおり、`plan` 行を書くのは端末で、
端末は本人なので、**自分の行に `'pro'` を書けます**。RLS で閉じられるのは
「他人の段を読み書きできない」までです。

閉じ方は三つ書いてあり、どれもオーナーの決めごとです。上の 2 と 3 は
それとは別で、**払っている人の側で勝手に起きる**ぶんだけ性質が違います。

---

## 見た範囲で、問題がなかったもの

- `netTook()` が `access_token` と `refresh_token` の両方を要求する
- 買った返事の段を**要求ではなく返事から**採る（`storeTook`）
- `plBuy()` が同じ段と下の段の二度目の購入を断る
- `restore` / `manage` / `buy` が段を下げない（Apple が言った時だけ下げる）
- nonce は自前で持ち、Apple には送らない
- 価格は `displayPrice`、割引率は二つの `amount` から。取り消し線に打った値はない
- `plan` の RLS は自分の行だけ
- 課金画面と扉の文言は十言語すべてに揃っている
