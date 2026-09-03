# 扉 ── Google のサインインが「送ったのに載っていない」

`claude/door`。**持っているのは `www/onboard.js` と `ios/App/App/` の Swift、
そして `tools/open-check.mjs`**（最後の一本は下の § 検査を置く場所 で理由を書きます）。
`www/net.js` と `www/sns.js` は `claude/find` のものなので**読むだけ**です。

### Scope

- **Goal:** 「Google で続ける」が通らない。`(nonce id_token:n sent:y)` ──
  こちらは nonce を送っているのに、Google の id_token にその主張が入っていない。
  原因を**動かして**突き止め、扉がネイティブへ何を渡しているかを見る検査を置く。
- **Owns (may change):** `www/onboard.js` / `ios/App/App/**.swift` /
  `tools/open-check.mjs` / `docs/scope/claude-door.md` / `docs/CHANGELOG.md`
- **Does NOT own:** それ以外すべて。とくに `www/net.js`（`netNonce()`
  `netSha256()` `netIdWhy()` `netIdToken()` は読むだけ）、`www/sns.js`、
  `tools/gate.mjs`、`package.json`、`tools/acct-check.mjs`
- **Decision it implements:** 「1アドレス1アカウント」「Google とか Apple の
  ログインはあくまでもメアドより楽な手段を増やしてあげるための手段」
  OWNER 2026-09-02 ── 楽になっていない入口は、入口ではない
- **Check to run:** `npm run open`（`tools/open-check.mjs`）

---

## 分かったこと ── 推測ではありません。三つのソースツリーを読んで確かめました

**原因は `@capgo/capacitor-social-login` の Google の道が二本あることです。**
そして**渡した nonce を使うのは、そのうちの一本だけ**です。

`node_modules/@capgo/capacitor-social-login/ios/Sources/SocialLoginPlugin/GoogleProvider.swift:81`

```swift
if GIDSignIn.sharedInstance.hasPreviousSignIn() && !self.forceAuthCode && self.mode != .OFFLINE {
    GIDSignIn.sharedInstance.restorePreviousSignIn { user, error in
        ...
        user.refreshTokensIfNeeded { refreshedUser, refreshError in
            completion(.success(self.createOnlineLoginResponse(user: refreshedUser)))
        }
    }
} else {
    login()          // ← nonce を渡すのはこっちだけ
}
```

`payload["nonce"]` を読んで `GIDSignIn.signIn(withPresenting:hint:additionalScopes:nonce:)`
へ渡しているのは、`else` の中の `login()` だけです。**上の枝は nonce を一度も
見ません。**`restorePreviousSignInWithCompletion:` は nonce を取る引数を持って
いません（`GoogleSignIn-iOS 9.0.0`、`GIDSignIn.h:124` ── nonce を取るのは
`signInWithPresentingViewController:hint:additionalScopes:nonce:completion:`
だけ、同 `:218`）。

**一度でも Google で入ったことのある端末は、それ以降ずっと上の枝を通ります。**
`forceAuthCode` は `payload["forcePrompt"]` から来ますが、このアプリは渡して
いないので常に `false`。`mode` は初期値 `.ONLINE`。よって条件は
`hasPreviousSignIn()` だけになります。

上の枝が返す id_token は `user.idToken?.tokenString` で、その中身は
`GIDSignIn.m:627` の `refreshTokensIfNeededWithCompletion:` が決めます:

- アクセストークンが期限に近ければ **refresh_token grant** で取り直す
  （`GIDSignIn.m:892 maybeFetchToken` → `tokenRefreshRequestWithAdditionalParameters`）。
  **更新で出る id_token に nonce クレームは載りません** ── OIDC Core § 12.2。
  → `id_token:n`
- 期限まで余裕があれば**取り直さず、憶えている id_token をそのまま返します**。
  それは前回の対話サインインのもので、**AppAuth が勝手に付けた nonce が載って
  います**（次の節）。→ `id_token:y`、しかもこちらのものではない

**オーナーが見たのは前者です。**アクセストークンは一時間で切れるので、押した
ときはたいてい更新側になります。

## そして 106 の謎も解けました ── 付けていたのは AppAuth です

`docs/scope/claude-nonce.md` が「誰が nonce クレームを入れているのか ──
リポジトリの中には居ません」と書いて、**プラグインにも GoogleSignIn にも
Swift にも無い**ところまで追って止まっていたものです。**もう一段下に居ました。**

`AppAuth-iOS`（`GoogleSignIn` の依存）、`Sources/AppAuthCore/OIDAuthorizationRequest.m:182`:

```objc
return [self initWithConfiguration:configuration
                            ...
                             state:[[self class] generateState]
                             nonce:[[self class] generateState]      // ←
                            ...];
```

**nonce を渡さずに作った認可要求には、AppAuth が自分で乱数の nonce を入れます。**
`GIDSignIn.m:731` は `if (options.nonce)` で分岐し、無いときはこの
「便利な初期化子」を呼びます ── だから**こちらが黙っていても、トークンには
nonce が載っていました。**

これで三つの観測が一本の線に乗ります。**どれも作り話ではありません:**

| いつ | 通った道 | id_token の nonce | こちらが送った | 結果 |
|---|---|---|---|---|
| ビルド 106 | 初回なので対話（`login()`）、nonce 無しで呼ぶ → AppAuth が付ける | **有り**（AppAuth の） | 無し | 断られる |
| ビルド 107（2026-09-01、DEVICE CONFIRMED） | 以降は復元。更新で取り直す | **無し** | 無し | **通る** |
| いま（`3170b6c` のあと） | 復元のまま。渡した nonce は読まれない | **無し** | **有り** | 断られる |

**107 が通ったのは、直ったからではありません。**復元の枝に落ちて、両側とも
黙っていたからです。

## だから、リーダーが挙げた二つは、どちらも正しくありません

- **「送るのをやめる」（106 に戻る）** ── 復元の枝では通り、**新しい端末・
  アプリを入れ直した人・`obSignOutSocial()` のあとの人は 106 のまま**です
  （`p.logout()` は `GIDSignIn.signOut()` を呼ぶので `hasPreviousSignIn()` が
  偽に戻ります）。しかも復元の枝でもアクセストークンが生きている間は
  AppAuth の nonce が載ったままなので、**そのときは「Nonces mismatch」**に
  変わります。**復元の枝は、こちらが何を送っても正しくなりません。**
- **「届かせる」** ── **もう届いています。**`p.login({provider, options})` の
  `options` は `SocialLoginPlugin.swift:425` の `call.getObject("options")` に
  そのまま入り、`payload["nonce"]` として `GoogleProvider` に渡ります。
  キーも入れ子も合っています。**届いていないのではなく、読まれない道を
  通っています。**

**正しいのは三つ目です: 復元の枝に落ちないようにする。**`forcePrompt:true` を
options に入れると `forceAuthCode` が真になり、条件が偽になって必ず `login()` を
通ります。そこで初めて、こちらの nonce が認可要求に乗り、Google がそれを
id_token に載せ、Supabase が `sha256(送った raw)` と突き合わせて一致します。
**両側が在って、中身が同じ** ── Supabase が求めている形そのものです。

**これは振る舞いを一つ変えます。**押すたびにアカウントを選ぶ面が出ます
（いまは黙って前の人で入ります）。**それはオーナーが直せと言ったものです:**
「あと違うアカウントでログインしてんのに前のやつ出てくるんだけど？」
OWNER 2026-08-31 ── 前のアカウントが出てくるのは、この復元の枝そのものです。

## 検査を置く場所 ── `tools/open-check.mjs`

リーダーは「ゲートの34本のどれも扉のネイティブ渡しを見ていない」と言いましたが、
**これは違います。**`tools/acct-check.mjs` の **26** が `Capacitor.Plugins.SocialLogin`
を偽物に差し替えて、まさにそれを見ています（`3170b6c` で入りました）。
`acct-check` はゲートの SLOW に入っています。

**それでも通りませんでした。**26 が見ているのは「こちらが nonce を**渡した**か」で、
**渡したものが使われるか**は見ていないからです ── 偽のプラグインは道を一本しか
持っていないので、本物が二本持っていることを表現できません。**「渡している」と
「載っている」は別の主張です**というリーダーの言葉は正しく、26 は前者だけを
押さえていました。

`tools/acct-check.mjs` は `claude/login-billing-code-review-ovfsxa` が触っています。
`tools/gate.mjs` と `package.json` は `claude/find` が今日触っています
（`find-check` を足している）。**どれも避けます。**足すのは
`tools/open-check.mjs` ── **扉の検査で、ゲートに入っていて、いま誰も触って
いません**（`origin/claude/pr-video-recording-x1yrsm` に一件ありますが
master を取り込んだだけの映像用の枝です）。`gate.mjs` も `package.json` も
一行も変えないので、`claude/find` と衝突しません。
