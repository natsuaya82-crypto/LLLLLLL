# r30-sns ── 検索の `@`、投稿の頭から人へ、`#` から一覧へ

### Scope
- Goal: オーナーが 2026-09-11 に実機で見た三件（`@` の検索、投稿の頭から
  プロフィール、`#` から投稿一覧）を**測ってから**直す。
- Owns (may change): `www/sns.js` `www/post.js` `www/net.js`（検索の関数だけ）
  `www/act-map.js` `tools/find-check.mjs` `tools/post-check.mjs`
  `tools/fixture.mjs` `docs/` `shots/`
- Does NOT own: それ以外すべて。`supabase/schema.sql` は**読むだけ**。
  `netLangRow` / `netLangsDown` / プロフィール保存の道は触らない。
- Check to run: 触った物の check と、最後に `npm run press` 一回。ゲートは回さない。

---

## 〇。測った道具と、測れなかったもの

**本物の Supabase には届きません。** この容器の出口 policy が拒みます:

```
iimwukyyasbybfrirhsf.supabase.co:443 — connect_rejected
gateway answered 403 to CONNECT (policy denial or upstream failure)
```

なので捨てアカウントで本物を歩くことはできませんでした。**サーバーが何を
返すかは測れていません。** 下で「サーバー側」と書いた所がそれです。

代わりに `origin/claude/r21-hunt` の `tools/hunt.mjs`（憶える偽サーバー＋
Dev）を scratchpad に写して使いました。**取り込んでいません。**
写した側に一つ足しています ── 元の `keep()` は知らない operator に `true` を
返すので、`or=(handle.ilike.*x*,display.ilike.*x*)` が**全行を返して**いま
した（hunt.mjs:95-117）。つまり**素の偽サーバーでは検索は常に当たって見え、
1 件目は再現しません**。PostgREST の `or=` と `ilike` を実装してから測って
います。

## 〇-a。オーナーの実機に入っているコード

一番新しいビルドは **run 154、`23ad34f5`、2026-09-10 23:00 UTC**（`master` の
祖先）。三つの道はどれもそのビルドに**入っています**:

| | build 154 |
|---|---|
| `netAtOff`（`@` を外す） | 在る |
| `atHTML`（本文の `@` を押せる） | 在る |
| `snsAtGo` → `profileOpen` | 在る |
| `snsTagGo` | 在る |
| `postAvHTML` の `DO('profileOpen', …)` | 在る |
| 頭の `@` | `<span class="phandle">`（build 154 の post.js:3477） |

ビルド 154 → 手元（`integ-0905`）で `www/sns.js` は 9+/29-、`www/post.js` は
49+/156- しか動いていません。**「まだ作られていない」ではありません。**

## 一。検索で `@まるまる` と打っても誰も出てこない

**このコードでは再現しませんでした。**

歩いた形: アカウント A（`@aya`）でサインイン、別人 `@beni`（display `ベニ`）を
サーバーに置いて、`#sns-q` に四通り打つ。出て行った要求を `netGet` を包んで
読みました。

| 打った字 | `netFindWho` が受け取った語 | サーバーへ出た要求 | 画面 |
|---|---|---|---|
| `beni` | `beni` | `or=(handle.ilike.*beni*,display.ilike.*beni*)` | 人が出る |
| `@beni` | `beni` | 同上 | 人が出る |
| `＠beni`（全角） | `beni` | 同上 | 人が出る |
| `ベニ` | `ベニ` | `…ilike.*ベニ*` | 人が出る |

`@` を外しているのは `netAtOff()`（`www/net.js:2859`、`/^[@＠]+/`）で、
`snsFind()`（`www/sns.js:2058`）が人の側にだけ掛けています。**半角も全角も
外れていて、`@` を付けたままサーバーへ送ってはいません。**

だから **原因はこの三行ではありません。** 測れていない所が二つ残ります:

- **サーバー側:** 本物の `profile_seen`（`supabase/schema.sql:1168`）に
  上の URL をそのまま投げたとき何が返るか。view は `grant select on
  profile_seen to anon, authenticated`（:1183）で、`profile` の読みの policy
  と、`left join lateral` の先の `language_seen` が絡みます。**ここは
  オーナーか、外へ出られるセッションが一度叩けば片が付きます。**
- **打った語そのもの:** `handle` は `^[a-z0-9_]{2,24}$` なので**日本語の
  handle は存在できません**。`@まるまる` が当たるとしたら `display` の側
  だけです。オーナーが探した人の handle が romaji で display が別の語なら、
  出ないのは仕様どおりの答えになります。**どの人を探したかを一度伺いたい。**

## 二。顔と青い `@` を押しても人のページへ飛ばない

**半分だけ再現しました。そして再現した半分が、原因の分かっている本物のバグです。**

一つの投稿に `@` は**二つ**あり、片方だけが道です:

| 押した所 | 何が載っているか | 押した結果（測定） |
|---|---|---|
| 顔 | `<button class="pav pavb" data-do="profileOpen" data-a='["beni"]'>`（`www/post.js:3297`） | `go(["profile","beni"])` ── **飛ぶ** |
| **頭の `@beni`** | `<span class="phandle">`、`data-do` **無し**（`www/post.js:3390`） | `go(["thread","post-beni-1"])` ── **スレッドが開く** |
| 本文の青い `@beni` | `<button class="ptag" data-do="snsAtGo" data-a='["beni"]'>`（`atHTML`、`www/sns.js:1580`） | `profileOpen` → `go(["profile","beni"])` ── **飛ぶ** |

頭の `@` に名前が無いので、押しは外側の `<div class="post" data-do="postOpen">`
（`www/post.js:3325-3327`）に落ちます。`act.js:101` の `actOf(e.target,'data-do')` は
**一番近い** `data-do` を拾うので、名前の無い span を押すと親の `postOpen` が
走ります ── 何も throw せず、画面は動き、**別の正しい画面**が出ます。
`act-check` も `press` も「押せる」と言い続けます。押した先が正しいかは
どちらも訊いていません。

`atHTML()` の自分のコメントが「THE ONE PLACE a handle becomes a thing you
press」と書いていますが、**投稿の頭はそこを通っていません。** CLAUDE.md
§ One place, not fifteen の形そのものです。

顔については、この偽サーバー越しでは**飛びました**。実機で飛ばないなら残るのは
`profileOpen()`（`www/me.js:809`）の待ちで、これは `whoWait` と `pfPosts` の
**両方が返るまで画面を動かしません**（OWNER 2026-09-07「全部読み込んでから
開く」「くるくるも出さない」）。返らなければ `netPop()` が出ます。
**サーバー側:** 本物で `profile_seen?handle=eq.<hd>` と
`post_seen?author=eq.<uuid>` が返るかどうか。ここは測れていません。

## 三。`#まるまる` を押しても投稿一覧へ飛ばない

**「飛ばない」は再現しませんでした。**ただし**一回の押しでサーバーへ二度
訊いています。**

`#さくら` を押した結果（測定）:

```
goTab(["explore"]) , render() , snsFind(["#さくら"]) , netFindWho , netFindPosts ,
                     render() , snsFind(["#さくら"]) , netFindWho , netFindPosts
route now: {"r":"explore"}   欄: "#さくら"   画面: その投稿が出ている
```

出た要求も二組、同じものです:

```
GET /rest/v1/profile_seen?…&or=(handle.ilike.*#さくら*,display.ilike.*#さくら*)…
GET /rest/v1/post_seen?…&or=(body->>ln.ilike.*#さくら*,body->>mn.ilike.*#さくら*,
                             body->>lname.ilike.*#さくら*)…
     ×2
```

`snsTagGo()`（`www/sns.js:1636`）が `goTab('explore')` と `snsGo()` を**両方**
呼びます。`goTab` が描いた時点で `vExplore()` が「語が在って答が無い」ので
訊き、その答が着く前に `snsGo()` が `render()` をもう一度掛けるので、また
訊きます。`snsFind` の上のコメントは *「One place asks and it is
vExplore()」* と書いていて、`snsTagGo` はその外にある**二本目の道**です。

何も throw せず、二つの答は同じなので画面は正しく見えます。見えるのは
**検索している人数だけ倍になるサーバーの負荷**です。

「飛ばない」の側で測れていないもの ── **サーバー側:** 本物の `post_seen` が
`body->>ln.ilike.*#さくら*` に答えるか。`post_seen`（`supabase/schema.sql`）の
`body` は `case when hidden_at is null … then p.body else '{}'` の**式**なので、
そこに `->>` の filter が掛かります。偽サーバーでは素の JSON を持っているので
**この差は測れていません。**

## 四。やったこと

| | 状態 |
|---|---|
| 1. `@` の検索 | **直していません。**このコードでは再現せず、原因が見つかりません。下の「まだ要るもの」 |
| 2. 頭の `@` | **直しました。**`atHTML()` を通す。`post-check` に claim、赤を三本見た。写真あり |
| 2. 顔 | **元から飛びます。**既に `post-check` が押さえていて、道を外して赤を見て確かめました |
| 3. `#` から一覧 | **「飛ばない」は再現せず。**一回の押しで二度訊いていたのを一度にした。`find-check` に claim、赤を見た |

写真（ja、走っているアプリ、偽サーバー）:

- `shots/r30-1-find-at-beni-ja.png` ── `@beni` と打って人が出ている
- `shots/r30-1-find-zenkaku-at-beni-ja.png` ── 全角 `＠beni` でも人が出る
- `shots/r30-2-post-head-at-before-ja.png` / `-after-ja.png` ── 頭の @ が灰から青へ
- `shots/r30-2-after-pressing-at-ja.png` ── @ を押した先（その人のページ）
- `shots/r30-3-after-pressing-tag-ja.png` ── `#` を押した先（その語の検索）

## 五。まだ要るもの ── 一件目

**このコードの中に原因が見つかりません。勝手に直しません。** 片が付くのは
次の二つのどちらかです:

1. **サーバーを一度叩く**（外へ出られる所から、anon key で読むだけ）:

   ```
   GET /rest/v1/profile_seen?select=id,handle,display&or=(handle.ilike.*aya*,display.ilike.*aya*)&order=handle.asc&limit=50
   ```

   これが人を返せば、原因はアプリでもサーバーでもなく 2 の側です。
   返さなければ**サーバー側**で、`supabase/schema.sql:1168` の view と
   `profile_read`（:854、`using (true)`）を見ることになります。

2. **オーナーに一つ伺う** ── どの人を探しましたか。`handle` は
   `^[a-z0-9_]{2,24}$` なので**日本語のハンドルは存在できません**。
   `@まるまる` が当たるとしたら `display`（表示名）の側だけです。探した人の
   表示名がその字でなければ、出ないのは仕様どおりの答えになります。

## 六。直す順と、押さえる check（作業前の見立て）

1. **二件目（頭の `@`）** ── 確かめた原因が一つあるのはこれだけ。
   `postRow` の頭の `@` を `atHTML()` に通す。二つある `@` が一本の道になる。
   claim は `tools/post-check.mjs`。バグを戻して赤を見てから緑にする。
2. **三件目（二度訊く）** ── `snsTagGo` の二本目の道を消す（`goTab` のあとに
   `render()` を重ねない）。claim は `tools/find-check.mjs`。
3. **一件目** ── このコードの中に原因が見つかりません。上の二つの
   「サーバー側」と「どの人を探したか」が要ります。**勝手に直しません。**

**CODE CONFIRMED**: 上の表の測定は走っているアプリで押して取りました。
二件とも、バグを戻して担当の check が赤くなるのを見てから緑にしています。
**DEVICE CONFIRMED**: 無し。実機は押していません。
**OWNER CONFIRMED**: 無し。

**この枝は `origin/master` を取り込んであります**（`a5693635`）。最初は
`integ-0905` が master と無関係な履歴に見えましたが、**クローンが浅かった**
だけでした（`git fetch --unshallow` で共通祖先が出ます）。同じことで止まった
人のために書いておきます。
