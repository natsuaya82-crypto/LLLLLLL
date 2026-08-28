# Google のサインインが通らない ── nonce の食い違い

`claude/nonce` が調べたもの。**`www/onboard.js` は一文字も触っていません。**
オーナーのファイルなので、当てられる形にして置いてあります。

---

## 0. 先に一つ訊いてください

**手元の `www/onboard.js` で、Google の login に nonce を渡していませんか。**

渡していれば、それが原因です（下の §1 がなぜかを書いています）。答えが
`はい` なら §3 の A、`いいえ` なら §3 の B です。

---

## 1. 何が起きているか

Supabase は OIDC の入口でこう見ています（`internal/api/token_oidc.go:294-306`）:

```go
if !skipNonceCheck {
    tokenHasNonce := idToken.Nonce != ""
    paramsHasNonce := params.Nonce != ""
    if tokenHasNonce != paramsHasNonce {
        return ... "Passed nonce and nonce in id_token should either both exist or not."
    } else if tokenHasNonce && paramsHasNonce {
        hash := fmt.Sprintf("%x", sha256.Sum256([]byte(params.Nonce)))
        if hash != idToken.Nonce {
            return ... "Nonces mismatch"
        }
    }
}
```

読み取れることが三つあります。

**(1) 出ているエラーは上の一本目です。**アプリは nonce を送っていないので
`paramsHasNonce` は false。ということは `tokenHasNonce` が true ──
**id_token の側に nonce クレームが在る**、というのが Supabase の言い分です。

**(2) Supabase は provider で分岐しません。**`params.Nonce` を**必ず**
SHA-256 して `idToken.Nonce` と比べます。組み込み provider は
`SkipNonceCheck: false`（180行）で、skip されるのは Facebook だけ（96-97行）。
つまり **Apple も Google も同じ形**です:

```
    P = 生の乱数
    provider へ渡すのは   sha256(P)
    Supabase へ送るのは   P
```

**(3) だから「トークンの nonce クレームをそのまま送り返す」は通りません。**
`sha256(クレーム) != クレーム` なので `"Nonces mismatch"` に変わるだけで、
`sha256(P) == N` になる `P` は逆算できません。**`net.js` の中だけで閉じる
直しは原理的に作れない**、というのがここの結論です。

---

## 2. 誰がクレームを入れているのか ── リポジトリの中には居ません

全部落として読みました。

| 見たもの | 結果 |
|---|---|
| `@capgo/capacitor-social-login` **8.4.4** の tarball（`package-lock.json` の integrity と一致を確認） | `ios/Sources/` 全体で nonce は三箇所。Google は `GoogleProvider.swift:53` の `payload["nonce"]` **以外から作りません** |
| 同 **8.4.5** と **8.5.0** | 同じ。`package.json` は `^8.4.4` だが、**その範囲に自分で nonce を作る版は無い**。`.github/workflows/ios-deploy.yml` は `npm ci` なのでロック通りでもある |
| **GoogleSignIn-iOS 9.0.0**（podspec `~> 9.0.0`）を clone | `GIDSignIn.m:731-746` が `if (options.nonce)` で分岐し、**無ければ nonce を持たない `OIDAuthorizationRequest` を作る**。SDK が勝手に足す道は無い |
| `dist/esm/google-provider.js:44` | `options.nonce \|\| Math.random()...` で**勝手に作る**が、これは web 実装（`GoogleSocialLogin extends BaseSocialLogin`）。このアプリは `@capacitor/core` を読み込まないので端末では走らない |
| `ios/App/` の Swift 全部 | Google サインインに触るものは無い |
| `git log -S nonce -- www/` | このアプリは**一度も** nonce を送っていない |

**つまり master のコードでは、両方とも無いはずで、このエラーは出ません。**
出ている以上、端末で走っているものが master の `onboard.js` ではないか、
まだ誰も見つけていない何かが起きています。

`p.login({provider, options})` の `options` が nonce を入れられる唯一の場所で、
それは `www/onboard.js` です。**Apple だけ通っているのも合います** ──
触ったのが Google の呼び出しだけなら、Apple は両方無いままなので。

---

## 3. 当てる形

### A. 渡している場合 ── 外す（いちばん小さい）

`obSocial('google', …)` に渡している `options` から `nonce` を消すだけです。
両方無い状態に戻り、それは **Apple がいま通っていることで動く証明が出ています。**

### B. 渡していない場合 ── こちらが nonce を握る

**B は原因が分からなくても効きます。**こちらが `options.nonce` に
`sha256(P)` を渡し、Supabase に `P` を送れば、**誰がクレームを入れていようと
中身はこちらの決めたものになり、両側が揃います。**これが B の本当の値打ちです。

二つのファイルに当たります。**両方を同時に当ててください**（理由は §4）。

#### B-1. `www/net.js` ── `netUUID()` の下に足す

```js
function netRotr(x, n){ return (x>>>n)|(x<<(32-n)); }
function netSha256(str){
  var K=[
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  var H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  var b=[], w=[], i, j, c, n, hi, lo, s0, s1, t1, t2, a, bb, cc, dd, e, f, g, h, out='';
  for(i=0;i<str.length;i++){
    c=str.charCodeAt(i);
    if(c<0x80) b.push(c);
    else if(c<0x800) b.push(0xc0|(c>>6), 0x80|(c&63));
    else b.push(0xe0|(c>>12), 0x80|((c>>6)&63), 0x80|(c&63));
  }
  n=b.length;
  b.push(0x80);
  while(b.length%64!==56) b.push(0);
  hi=Math.floor(n/536870912); lo=(n<<3)>>>0;
  b.push((hi>>>24)&255,(hi>>>16)&255,(hi>>>8)&255,hi&255);
  b.push((lo>>>24)&255,(lo>>>16)&255,(lo>>>8)&255,lo&255);
  for(i=0;i<b.length;i+=64){
    for(j=0;j<16;j++)
      w[j]=(b[i+j*4]<<24)|(b[i+j*4+1]<<16)|(b[i+j*4+2]<<8)|b[i+j*4+3];
    for(j=16;j<64;j++){
      s0=netRotr(w[j-15],7)^netRotr(w[j-15],18)^(w[j-15]>>>3);
      s1=netRotr(w[j-2],17)^netRotr(w[j-2],19)^(w[j-2]>>>10);
      w[j]=(w[j-16]+s0+w[j-7]+s1)|0;
    }
    a=H[0];bb=H[1];cc=H[2];dd=H[3];e=H[4];f=H[5];g=H[6];h=H[7];
    for(j=0;j<64;j++){
      s1=netRotr(e,6)^netRotr(e,11)^netRotr(e,25);
      t1=(h+s1+((e&f)^(~e&g))+K[j]+w[j])|0;
      s0=netRotr(a,2)^netRotr(a,13)^netRotr(a,22);
      t2=(s0+((a&bb)^(a&cc)^(bb&cc)))|0;
      h=g;g=f;f=e;e=(dd+t1)|0;dd=cc;cc=bb;bb=a;a=(t1+t2)|0;
    }
    H[0]=(H[0]+a)|0;H[1]=(H[1]+bb)|0;H[2]=(H[2]+cc)|0;H[3]=(H[3]+dd)|0;
    H[4]=(H[4]+e)|0;H[5]=(H[5]+f)|0;H[6]=(H[6]+g)|0;H[7]=(H[7]+h)|0;
  }
  for(i=0;i<8;i++){
    c=H[i]>>>0;
    for(j=28;j>=0;j-=4) out+=((c>>>j)&15).toString(16);
  }
  return out;
}
function netNonce(){
  var p=netUUID();
  return { raw:p, hash:netSha256(p) };
}
```

#### B-2. `www/onboard.js` ── `obSocial()` の中、三行足して一行変える

いまこうなっています:

```js
    obReady(p, function(){
      p.login({ provider:who, options:opts }).then(function(r){
        var tok=r && r.result && r.result.idToken;
        if(!tok){ obShrug(); return; }
        netIdToken(who, tok, '', obIn, obNo);
      })['catch'](obShrug);
    });
```

こうします:

```js
    obReady(p, function(){
      /* Google だけ。Apple はいま通っていて、通っている理由は両側に nonce が
         無いこと -- そこに片方だけ足すのが、まさにこの不具合そのものになる。 */
      var nn=(who==='google')? netNonce() : null;
      if(nn) opts.nonce=nn.hash;
      p.login({ provider:who, options:opts }).then(function(r){
        var tok=r && r.result && r.result.idToken;
        if(!tok){ obShrug(); return; }
        netIdToken(who, tok, nn? nn.raw : '', obIn, obNo);
      })['catch'](obShrug);
    });
```

**Apple の道は一行も変わりません。**`who==='google'` の外に出ないので、
Apple は `nn` が `null` のまま、いままでと同じ `''` を送ります。

---

## 4. 二つを同時に当てる理由 ── 測ってあります

**`net.js` の半分だけ先に入れることはできません。**`netNonce()` を呼ぶのは
`onboard.js` なので、片方だけ入れると `dead-check` が落ちます:

```
$ npm run dead
1 function nothing reaches:
  www/net.js:1551  netNonceProbe
exit 1
```

（実際に入れて赤を見て、戻してあります。戻すと exit 0。）

CLAUDE.md の規則5そのもので、**正しい落ち方**です。だから B は一つのコミットで
二ファイルです。

---

## 5. crypto.subtle を使わなかった理由

`crypto.subtle.digest()` ではなく SHA-256 を書き出しています。三つあります。

1. **Promise を返します。**`obSocial()` の中がもう一段ネストし、**手で当てる
   パッチが三行から作り直しに変わります。**同期なら三行で済みます
2. **secure context でしか在りません。**このアプリの WKWebView は
   `capacitor://localhost`（`capacitor.config.json` の `"iosScheme": "capacitor"`）。
   仕様上はホストが `localhost` なので secure context に**なるはず**ですが、
   **確かめていません。**ここに iOS は無く、`grep -rn "subtle" www/` は空 ──
   **このアプリは crypto.subtle を一度も使ったことがなく、実機の証拠がゼロです**
3. 乱数のほうは事情が違って、`netUUID()` が `crypto.getRandomValues` を
   すでに使っています（`Math.random` の落とし先つき）。だから `netNonce()` は
   それを呼ぶだけで、**乱数の作り方は一箇所のまま**です

### 書き出した SHA-256 が正しいことの確認

node で直に走らせています（実機不要）:

- NIST の公表値と一致 ── `""` → `e3b0c442…7852b855`、`"abc"` → `ba7816bf…f20015ad`
- node の `crypto.createHash('sha256')` と一致 ── 空文字・1文字・長文・
  `abcdbcde…`・UUID・**日本語（UTF-8 マルチバイト）**・1000字
- **無作為な hex 文字列 1000 本、全部一致**
- `npm run es5` 緑（このパッチの本文そのもので確認）

---

## 6. すでに入っているもの（`claude/nonce` ブランチ、`www/net.js`）

`netIdWhy()` ── 断り文句が nonce の話だったときだけ、サーバーの文の後ろに
**どちら側に在るか**が付きます:

```
Passed nonce and nonce in id_token should either both exist or not. (nonce id_token:y sent:n)
```

`y` 在る / `n` 無い / `?` トークンが読めなかった。**値そのものは出しません**
（資格情報の片割れなので）。nonce と無関係な失敗は一文字も変わりません。

**§0 の質問の答えが分からなくても、これが入ったビルドを一度動かせば
どちら側かが画面に出ます。**

---

## 7. 実機で、どこに何が出るか

**押すのは画面のいちばん下の Google、出るのはその上です。**同じ画面ですが
指の位置とは離れているので、そこを見てください。

扉（オンボーディングの最後、サインインの面）はこの並びです:

```
            〔紋〕

     メールアドレス
     パスワード

     ← ここに赤い一行が出ます           .obmsg / 赤 (--bad) / 0.9rem
     [ ログイン ]
       パスワードを忘れた
     ───────── または ─────────
     [  Apple でサインイン  ]
     [ Google でサインイン  ]    ← 押すのはここ
```

出る文字は、サーバーの文のうしろに丸かっこが付いた形です:

```
Passed nonce and nonce in id_token should either both exist or not. (nonce id_token:y sent:n)
```

**読むのは最後の丸かっこの中だけです。**前半はサーバーの文で、いままでと
同じものです。

| 見えるもの | 意味 | どうする |
|---|---|---|
| `(nonce id_token:y sent:n)` | **トークンに在って、こちらは送っていない** | §0 の答えは「渡している」。**§3 の A**（options から外す） |
| `(nonce id_token:n sent:y)` | 送ったのにトークンに入らなかった | §3 の B が入ったあとにこれが出たら、渡し方が効いていない。報告してください |
| `(nonce id_token:?  sent:n)` | トークンが読めなかった | id_token が JWT の形をしていない。別の話なので報告してください |
| 丸かっこが**付かない** | この判定に入っていない | nonce とは別の失敗です。文の前半を読んでください |

**丸かっこが出るのは、サーバーの文に nonce と書いてあるときだけです。**
ほかの失敗（パスワード違い、通信断など）は、いままでと一文字も変わりません。

**値そのものは出しません。**在るか無いかだけです ── nonce は資格情報の
片割れなので、画面に出す種類のものではありません。

この一行が入っているのは `claude/nonce` ブランチです。**master にはまだ
入っていません。**取り込みはサブリーダーの判断です。
