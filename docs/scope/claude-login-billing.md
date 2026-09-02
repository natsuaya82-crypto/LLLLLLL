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

---

# 追記 2026-09-02 ── 原則「1アドレス1アカウント」に照らして

## オーナー決定 2026-09-02（これが仕様。今日の言葉で、前のものに優先する）

  「1アドレス1アカウント」
  「これは絶対課金もアカウントごと言語もそう」
  「GoogleとかAppleのログインはあくまでもメアドより楽な手段を増やして
    あげるための手段の話であるのよ」

Google / Apple / メールは、同じアドレスなら同じアカウントへの三つの入口。
実測済み：Google で登録したアドレスと同じアドレスでメール登録すると、
六桁が届いて別垢が立つ。

## A. 「1アドレス1アカウント」に反しているところ

**A-1【サーバー側】新規登録は必ず新しい uid を作る。**`netSignUp()`
（`www/net.js:346`）はセッションを載せずに `/auth/v1/signup` を叩く。
`supabase/schema.sql:547` に同じ形の注意書きが既にある。`www/` では直せない。
場所は三つ ── Supabase の identity 自動リンク設定 / `auth.users` のトリガ /
登録前の Edge Function。どれもオーナーの決めごと。

**A-2【`www/` で直せる。原則そのものが欠けている場所】パスワードを足す道が、
メールで入った人にしか無い。**`www/settings.js:270` が row を
`netHow()==='email'` で出し分けている。Google / Apple で入った人には
「このアカウントにパスワードを足す」画面が無い。だからその人がメールでも
入りたくなったら扉の新規登録しか道がなく、それが A-1 で別垢になる。
**アプリが人を別垢へ誘導している。**`netSetPass()`（`net.js:383`）は
セッションだけで通り、パスワード再設定の道が既にこれを使っている。
`setPwGo()`（`settings.js:106`）は今 `netSignIn()` で古いものを確かめてから
書くので、そこは分岐が要る。セッションだけで書かせてよいかは判断が要る。

**A-3【原則では覆えない】**Apple の「メールを非公開」はアプリごとのリレー
アドレスを配る。同じ人の gmail とは別のアドレスなので、原則どおり別垢になる。

## B. 「課金もアカウントごと」に反しているところ

**B-1 段が端末に付いている。**`ios/App/App/LinguaPlan.swift` の Keychain 項目
は service と account が固定で、どのアカウントが買ったかを持たない。
`www/core.js:358` で `window.__plan` がそのまま `SET.plan` に入る ── 誰が
サインインしているか分かる前。

**B-2 アカウントが変わっても `SET.plan` を戻す場所が無い。**書き手は五つ
（`core.js:358` `core.js:397` `net.js:621` `settings.js:862` `store.js:58`）、
戻す場所はゼロ。`netTook()`（`net.js:245`）も `netOut()`（`net.js:322`）も
段に触らない。A（Pro）が出て B が入ると、次の起動で `netPlanSync` が B の
空の行に pro を書く。`SET.planWas` も残るので、B が別人の段を基準にした
「プランが終わりました」を見ることがある。

**B-3 段は上がるだけで下がらない。**`netPlanSync()`（`net.js:607`、
書き戻しは 613-626）は `planBest` で高いほうを採り、`planKeep` で Keychain
まで書き戻す。

**B-4〜B-7** は上の 1〜5 と同じ（トークン更新、解約の取り消し、Keychain の
読み取り失敗、レシート検証なし）。

## C. 「言語もアカウントごと」に反しているところ

**C-1 uid の無い言語は、訊いた人のものになる。**`langOwned()`
（`www/core.js:720-727`）の 725 行 ── `if(!L.uid) return true;`。
`netLangRow()`（`net.js:710-736`）の四つ目の状態も同じで、コメント自身が
「THE FOURTH IS THE ONE THE OWNER HAS TO DECIDE」と書いている。
**今日の原則で決まった** ── 拾ってよいのはオンボーディングの扉だけ。
直すコミットでそのコメント段落も書き換えること。

**C-2 ＋ で言語を作ると uid が押されない。**`langMint()` を呼ぶ四箇所のうち
押しているのは二つだけ。`core.js:282 langFirst()` 押さない（オンボーディング、
正しい）／`core.js:457 langNew()` 押さない（**ここが穴**）／
`core.js:842 langForAcct()` 押す（857-859）／`net.js:987 netLangsDown()` 押す。
uid は `netLangRow()` が上げ切ったとき（`net.js:733`）に初めて付くので、
圏外で作った言語と送信が落ちた言語は uid 無しのまま残り、C-1 に落ちる。
直しは一行。

**C-3 ＋ はアカウントを訊かない。**`langNew()` の前に立っているのは
`langStop()`（言語数の上限）だけ。`makeNeed()` / `obNeed()`
（`onboard.js:926,949`）は文字・単語・文法・メモの四つに掛かっていて、
言語を作ることには掛かっていない。CLAUDE.md は「making a language
「言語はアカウントないと作れないです」」と書いているが、止めているものは無い。

## 直す順

  1. C-2 / C-3   www/core.js。一行 + gate 一つ。いちばん小さくて漏れている
  2. B-5(旧1)    www/net.js のみ。入ると B-4(旧2) が半分直る
  3. B-4(旧2)    www/net.js  www/core.js  www/boot.js
                 + tools/store-check.mjs に道（規則22）+ CHANGELOG が先
  4. B-6(旧4)    ios/App/App/LinguaStore.swift  tools/plan-check.mjs
  5. A-2         www/settings.js  www/onboard.js  www/i18n/*.js ×10
  6. B-1 / B-2   LinguaPlan.swift  LinguaStore.swift  core.js  net.js
  7. A-1         Supabase 側

www/index.html は一行も要らない。www/net.js を A-2 以外のほぼ全部が欲しがる。
