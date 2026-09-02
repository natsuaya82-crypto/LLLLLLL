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

---

# 二回目の読み直し ── 2026-09-02 夕

`origin/master` = `5d56063`（`claude/keychain` と `claude/langacct` を取り込んだ
あと）で読み直しました。**コードは変えていません。実機は見ていません。**

前回の指摘のうち、1（トークンの更新）と 4（Keychain）と C-1〜C-3（言語の印）は
入りました。**残っているものは下の「まだ開いている」に。**

## 新しく見つけたもの

### N-1【重い】扉を抜けた言語が「誰のものでもない」状態を通る

`langOwned()`（`www/core.js`）が今日からこうなっています。

```js
if(!L.uid) return !SET.done;
```

印の無い言語は、`SET.done` が true になった行の次から**誰のものでもなく**
なります。そして `obFinish()`（`www/onboard.js`）はこうです。

```js
SET.done=true; save();
...
if(typeof netLangSync==='function') netLangSync();
```

**印を付けるのはこの `netLangSync()` が返ってきた時だけ** ── `netLangRow()` の
`L.uid=me`（`www/net.js:823,833`）。ネットワーク越しで、非同期です。
`obFinish()` はセッションを持っているのに、自分では印を押しません。

上がらなかったら（圏外、サーバーの拒否、`language` の insert 失敗）印は付かず、
次の起動で `langForAcct()` がその言語を自分のものでないと読み、他に無いので
**新しい空の言語を作って開きます。** 歩きで描いた文字が目の前から消える。
消えてはいない（`localStorage` には在る）が、人にとっては同じことです。

**同じ形の穴が、あと二つあります。言語の入れ物を作る場所は六つで、印を押すのは
三つだけです。**

| 場所 | 印 | |
|---|---|---|
| `langNew()` core.js:492 | 押す | 今日入った |
| `langForAcct()` core.js:918 | 押す | |
| `netLangsDown()` net.js | 押す | |
| `langFirst()` core.js | 押さない | **正しい** ── 口座より前 |
| `langMigrate()` core.js | 押さない | net.js より前に走るので押せない |
| `bkRestore()` backup.js:272 | 押さない | **バックアップからの復元** |

`bkRestore()` が一番効きます。復元は「他が全部無くなった時に残る最後のもの」で、
`docs/DATA_SAFETY.md` がそのために在ります。そこから戻した言語が、印が無いために
アプリに出てこない ── 出てこないだけで消えてはいませんが、その人にとっては
同じです。`langMigrate()` は古い平らなキーからの移行で、当たる端末はおそらく
オーナーのものだけですが、コードの中には残ります。

どれも `netLangSync()` が一度成功すれば直ります（`langMineIds()` は `langMine()`
で選ぶので、印の無い言語も送信の対象に入っています）。つまり**ネットワークが
あれば自己修復し、無ければ空の言語が一つ増える。**

直しの形は二つあります。決めるのは実装する人ではありません。

1. **押す場所を増やす** ── `obFinish()` で `SESS.uid` を押してから
   `netLangSync()`。`bkRestore()` も同じ三行。`langMigrate()` は net.js より
   前なので、後から押す一行が要ります。
2. **`langOwned()` の答え方を変える** ── `!SET.done` は**時刻**の答えで、
   訊かれているのは**持ち主**です。`SET.done` が立った瞬間に、押せなかった
   道が作ったものまで一緒に他人のものになります。

`tools/acct-check.mjs` の 34・35・36 はこの三つを持っていません ── 持っている
のは「＋ で作ったものに印が付く」「拾うのは扉だけ」「＋ はアカウントを訊く」で、
**扉が自分で押さないこと**は誰も見ていません。

### N-2【中】パスワードの画面から出られない

`obDoorBack()`（`www/onboard.js:605`）は `newpw` に `''` を返し、
`obNewPwHTML()` は欄一つとボタン一つだけです。**扉の面でこれだけが、戻るも
飛ばすも持っていません。**

そこに立っている人は**もうセッションを持っています**（六桁が作った）。
`netSetPass()` が通らないと ── 圏外になった、サーバーが拒んだ ── その人は
サインイン済みのままアプリに入れません。アプリを落として入り直しても、
`SET.done` がまだ false なので扉に戻り、アドレスから六桁からやり直しです。

設定から開いた扉には `obPending()` があるので出られます。**オンボーディングの
道にだけ出口がありません。**

## まだ開いているもの ── `5d56063` で確認

**課金、二つ。どちらも誰も持っていません。**

- 解約が次の起動で取り消される。`boot.js:106` が非同期で `boot.js:127` が同期、
  という順番はそのまま。`netPlanSync()`（`net.js:721`）も上げるだけのまま。
- アカウントを変えても段が残る。`SET.plan` を戻す場所は無いまま。
  `LinguaPlan.swift` に `uid` の字は一つもありません（決定は `d47a578`）。

**審査、六つ。全部そのまま。**

- 401 の文言（`net.js:310` が `net.badlogin` のまま）
- 登録画面の規約の一行（`onboard.js` に `docRows` は 0 件）
- アカウント削除の行の文言（`set.wipe`「データを消去」のまま）
- 削除のポップの購読の一文（`confirm.wipe` に無い）
- `TARGETED_DEVICE_FAMILY` が六つ全部 `"1,2"` のまま
- キーボードの Full Access（`RequestsOpenAccess` 1 件、`hasFullAccess` の guard も）

## 見て、変わらず問題が無かったもの

六桁の道（`netMailOtp` → `netVerify` type `email`）は、既にある口座なら
そこに入り、無ければ作る、の一本道になっています。Google で入った人が同じ
アドレスを打てば同じ口座のセッションが返り、そこでパスワードを決められる ──
「後から足す道が無い」は解消しています。再送信と戻るも付きました。

---

# 三回目 ── 実機から来たもの（2026-09-02 夜）

オーナーが実機で見たもの三つと、それを追って分かったこと。
**コードは変えていません。**

## N-3【重い】値段が打ち込みのドルのまま出る。原因は「訊いた印」

実機:「日本語だと 15000 円って出るのに、画面表示だと 99.99 ドル」
「サンドボックスだとちゃんと 15000 なのにアプリ内の画面がどの言語でも 99.99」

**「どの言語でも」が決定的です。** `plan.price.pro.yr` は十の言語ファイル
すべてに `$99.99` と**同じ文字**で打ち込んであります。だから言語の問題では
なく、**打ち込みが出ている** ＝ App Store の答えが画面に届いていない。

原因は `storeAsk()`（`www/store.js`）です。

```js
if(!np || STORE_ASK) return;
STORE_ASK=true;                    // ← 訊く「前」に立てる
np('LinguaStore','products',{})
  .then(...)                       // 下ろす
  ['catch'](...);                  // 下ろす
```

**答えが返ってこなかった場合、印は立ったままです。** その起動のあいだ、
プラン画面を何度開き直しても二度と訊かず、打ち込みのドルが出続けます。

**Restore で既に踏んだのと同じ形です。**「購入を復元を押しても問い合わせ中
しか出ない」（OWNER 2026-09-02）── あちらは `syncWithin` と 25 秒の
`STRT` で直しました。`www/store.js` にある `setTimeout` はその一つだけで、
**値段の問い合わせには上限がありません。**

直し、二つ:
1. 問い合わせに上限を付ける。`storeRestore()` が既にやっている形。
2. **値段のところに状態を出す。** いま失敗は 1.9 秒で消えるトーストで、
   値段が違うという一番大事なことがそれ。エラーは状態であって説明ではない
   （CLAUDE.md § Explaining の narrowing 側）。

切り分け: プラン画面を閉じてもう一度開く。二度目に ¥15,000 なら一度目が
失敗して印が下りていた。二度目も $99.99 なら**返ってきていない** ＝ 上の原因。

## N-4【重い】買った直後の一言が、押したものではなく「一番上の段」を言う

実機:「plus で課金しても pro になりましたって出る」

`storeBuy()`（`www/store.js`）の最後:

```js
storeTook(r);
if(how === 'bought') toast(t('toast.plan.other', planName(plan())));
```

`storeTook()` は `planBest(答え, いまの段)` を書くので、`plan()` は
**いま持っている一番上の段**です。押したものではありません。

Swift 側は買った取引から `planOf(t.productID)` で「何を買ったか」を知って
います（`LinguaStore.swift § buy`）。それを別に返して、それを言えば直ります。
段の値そのものは触らないこと ── 上を採る規則は正しく、言葉だけが嘘です。

**そしてこれは、Plus と Pro が同時に生きている証拠でもあります。**
一つのサブスクリプショングループなら Apple が入れ替えて、Pro は止まり Plus が
始まります。二つだと両方走り、両方請求されます。`docs/apple.md` § 4 は最初から
一つのグループと書いていて、**いまは二つ**（`docs/STATE.md` §0-a）。
アプリでは直せません。

## 解約について ── どこまでが正常か

**解約は期間の終わりまで効きません。**払った期間は使えます。サンドボックス
なら数分、本番なら次の請求日まで。**だから解約直後に Pro のままなのは正常。**

期間が過ぎても Pro のままなら、それが前report の「解約が次の起動で
取り消される」です。切り分ける材料は**解約からどれだけ経ったか**だけ。

## N-1 を狭めます ── 扉の場合は起きません

オーナー:「圏外で扉抜けれないでしょログイン必要で通信必要なんだから」
**そのとおりです。**サインインに通信が要るので、圏外で扉は抜けられません。
扉の例は取り下げます。

**残る二つは扉を通りません** ── `bkRestore()`（`backup.js:272`）と
`langMigrate()`（`core.js`）。どちらも印を押さず、`SET.done` が立った端末で
走ります。復元は他が全部無くなった時に残る最後のもので、そこから戻した言語が
アプリに出てこない。

**そして根の理由はオーナーが言ったとおりです。**
「上がるまでの間は制作はオフラインでもできるって話ならその言語のものに
ならないのはなぜ？」── **理由はありません。**サインインしていればアカウントは
その場で分かっていて、サーバーの返事を待つ理由がない。いまは
`netLangRow()` が返ってきたときに初めて押している。
**作った瞬間に押す。** ＋（`langNew`）は今日そうなり、扉・復元・移行がまだ。

なお**上がること自体は既に正しい**: `langMineIds()` は `langMine()` で
選ぶので、印の無い言語も送信の対象に入っていて、次につながった起動で上がり、
そこで印も付きます。問題は上がるまでの間だけです。

## N-2 の答え ── 決まりました

OWNER 2026-09-02:「サインインしたらアプリに移動してください」。
六桁が通った時点でセッションは在るので、パスワードの画面で止めない。

## カードの共有（前 report B-5）の正解 ── 道は既にあります

`LinguaShare` に **`shareFile`** があり、本物の `UIActivityViewController` を
出します（`LinguaShare.swift:361`）。手書き用紙の PDF が既に使っています
（`www/sheet.js:1185`）。順番も既にあり ── ネイティブに書かせて、返ってきた
**本当のファイル名**を `shareFile` に渡す。

`www/card.js` の `navigator.share` と `<a download>` は両方消すこと。
そして**「保存しました」は、ネイティブが出したと言ったときだけ。**
いまは何が起きても出ます。

Swift を一箇所だけ: ファイルを書く `sheet`（`LinguaShare.swift:310`）が
拡張子を `.pdf` に決め打ちしているので、拡張子を受け取れるようにする。
