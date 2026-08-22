# Supabase でやること

ブラウザとログインが要る作業だけを書いています。コードに書ける場所がないので、
ここが唯一の置き場所です。`supabase/mail.md`（メール）と `docs/apple.md`（Apple）
と同じ理由でここにあります。

プロジェクト: `iimwukyyasbybfrirhsf`

**上から順にやってください。** 前が済まないと次が意味を持ちません。

---

## 0. 先に知っておくこと

**`schema.sql` は毎回ぜんぶ貼って流します。** どこまで流したかを覚える必要は
ありません。テーブルは `if not exists`、ポリシーは作る前に `drop`、バケットは
`on conflict do nothing`、関数は `create or replace` で書いてあるので、何度
流しても同じ状態になります。`npm run rls` がこのファイルを**2回続けて流して
から**攻撃を始めるので、「もう一度流せる」は検査で押さえてあります。

**service_role キーは絶対にどこにも貼らないでください。** アプリが持っている
のは publishable キーで、こちらは公開前提です。あらゆるテーブルが既定で拒否に
なっていて、`schema.sql` のポリシーが1つずつ開けています。service_role はその
全部を素通りします。

---

## 1. 匿名サインインを ON にする

**Authentication → Providers → Anonymous sign-ins → 有効化**

`schema.sql` の `is_member()` が JWT の `is_anonymous` を見ています。アカウントを
作っていない人が読むだけ、という状態がここで成立します。

これを ON にしないと `is_member()` が常に false になり、**サインイン済みの人でも
投稿できません。**

---

## 2. schema.sql を流す

**SQL Editor → New query → 全部貼る → Run**

ファイルはリポジトリの `supabase/schema.sql` です。ブラウザからなら:

```
https://raw.githubusercontent.com/natsuaya82-crypto/LLLLLLL/claude/save/supabase/schema.sql
```

`Success. No rows returned` が出れば通っています。

### 流したあとに見るところ

| 見る場所 | あるべきもの |
|---|---|
| Table Editor | `profile` `language` `publication` `prompt` `post` `quote` `react` `follow` の8つ |
| Table Editor → `post` | 列に `reply_to` がある |
| Table Editor → `profile` | 列に `av` がある |
| Storage | `post-media` があり、**Public** になっている |
| Database → Functions | `notices` と `account_delete` と `is_member` |

### エラーが出たら

そのままこちらに貼ってください。直します。

`schema.sql` の中で「持ち主でないと通らない」statement は2つだけで、それは
`storage.objects` と `storage.buckets` の RLS 有効化です。Supabase は Storage の
RLS を最初から有効にしているので、この2行はホストされたプロジェクトでは要りません。
断られても止まらないように囲ってあり、NOTICE を出して先へ進みます。

---

## 3. メール

`supabase/mail.md` に全部書いてあります。要点だけ:

1. Resend にドメインを足して DNS を3つ入れる（**ホスト欄は `send`。ルートに
   入れると既存のメールが死にます**）
2. Resend の API キーを作る
3. **Authentication → Emails → SMTP Settings** に入れる
   （Username は文字どおり `resend`。メールアドレスではありません）
4. **Authentication → Rate Limits → emails → 30/hour**
5. **Authentication → Emails → Templates → Confirm signup** の
   `{{ .ConfirmationURL }}` を **`{{ .Token }}`** に置き換える

**5 を飛ばすと確認コードが一生届きません。** Capacitor アプリなのでリンクの
着地先が存在せず、アプリは6桁コードを受け取る作りです。

---

## 4. Apple と Google のログインを ON にする

アプリにボタンは出ています。**ここを ON にするまで、押しても「ログインでき
ません」で終わります。** メールのログインは 3 で終わっているので、この節を
飛ばしても出せます。飛ばすなら、Apple も Google も両方飛ばしてください
（片方だけ出すのは Apple の審査規約 4.8 に引っかかります）。

### 4-1. Apple

**Authentication → Providers → Apple → 有効化**

`Client IDs` に **`com.tokinets.lingua`** と入れて保存。それだけです。

`Secret Key` の欄は空のままで構いません。あれは Web と Android の、ブラウザを
開くログイン用です。iPhone のログインは iOS が自分でシートを出して身分証
（id_token）を渡してくるので、Supabase 側は「その身分証がこのアプリ宛か」を
`Client IDs` と突き合わせるだけで済みます。

Apple 側（developer.apple.com）でやることは `docs/apple.md` の 2 節です。
**そちらが先**です。ここだけ ON にしてもビルドが通りません。

### 4-2. Google — まず Google Cloud で ID を作る

Supabase ではなく **console.cloud.google.com** です。

1. プロジェクトを作る（名前は何でもいい）
2. **APIs & Services → OAuth consent screen**。External を選び、アプリ名と
   連絡先メールだけ埋めて保存。審査に出す必要はありません
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**
4. Application type に **iOS**、Bundle ID に **`com.tokinets.lingua`**
5. できあがった Client ID
   （`123456-abcdefg.apps.googleusercontent.com` の形）をコピー

コピーしたら、リポジトリで一度だけこれを実行します。

```
node tools/google-id.mjs 123456-abcdefg.apps.googleusercontent.com
```

`www/net.js` と `ios/App/App/Info.plist` の両方が書き変わります。**片方だけ
手で直さないでください** — 食い違うと、Google のシートは開くのに戻ってこない、
という一番分かりにくい壊れ方をします。何が入っているかは引数なしで実行すると
出ます。

### 4-3. Google — Supabase 側

**Authentication → Providers → Google → 有効化**

`Client IDs` に 4-2 でコピーした iOS のクライアント ID を入れて保存。

`Client Secret` は空で構いません。Apple と同じ理由で、iPhone のログインは
ブラウザを開かないからです。空だと保存できないと言われた場合は、Google Cloud
で **Web application** のクライアントも作って、その ID と Secret を入れ、
`Client IDs` の欄は **iOS の ID をカンマで足して両方**にしてください。

---

## 5. 通報を読む人を決める

通報は誰でも出せます。**読めるのは `profile.staff` が `true` のアカウントだけ**で、
これはここで手で立てる以外に立てる方法がありません。アプリの中に「自分をスタッフに
する」画面は無いし、作りません（`schema.sql` の末尾で、アプリがログインに使う
ロールから `staff` 列の更新権限を取り上げています）。

**先に、そのアカウントでアプリにサインインして、ハンドルを1つ決めておいてください。**
プロフィールの行が無いと立てるものがありません。

`SQL Editor` で、自分のハンドルを入れて実行します。

```sql
update profile set staff = true where handle = 'ここに自分のハンドル';
```

`UPDATE 1` と出れば終わりです。`UPDATE 0` はハンドルが違います。

アプリを開き直すと、**設定の一番下に「通報」が増えます**。無い場合は、そのアカウントで
サインインしているか確かめてください。起動時に1回だけ訊きにいく作りなので、
サインインし直すか、アプリを閉じて開き直すと出ます。

できることは2つです。

| | |
|---|---|
| 通報を読む | 新しい順。通報された投稿の本文と、理由と、あれば一言 |
| 投稿を下ろす | 他の人から見えなくなる。**消えるわけではない** |
| その人を止める | 書き込みが全部通らなくなる。読むのはできる |

下ろした投稿は、書いた本人には「下ろされました」と出た状態で残ります。間違いだったら
同じ画面から戻せます。止めたアカウントも同じ画面から戻せます。

止めても**消えません**。書いたものはそのまま、サインアウトもされません。止まるのは
書き込みだけで、読むのと、**自分でアカウントを削除するのは**そのままできます
（追い出された人が出口を塞がれる理由はないので）。

App Store の審査は「投稿を消すこと」と「その人を締め出すこと」の両方を訊いてきます。
両方あります。

---

## 6. 動いているかの確かめ方

実機で1件投稿してから、ダッシュボードで見ます。

| 何をする | どこを見る | あるべきもの |
|---|---|---|
| 文字だけの投稿 | Table Editor → `post` | 行が1つ。`body` に `ln` `ink` `who` `hd` などが入っている |
| 写真つきの投稿 | Storage → `post-media` | `<uuid>/<uuid>/0.jpg` |
| 同上 | Table Editor → `post` | `body` に `pu`（パスの配列） |
| 声つきの投稿 | Storage → `post-media` | `<uuid>/<uuid>/vo.m4a` |
| いいねを押す | Table Editor → `react` | 行が1つ、`kind` が `like` |
| 誰かをフォロー | Table Editor → `follow` | 行が1つ |
| 投稿を消す | `post` と Storage | 行も、その投稿のファイルも無くなっている |

**タイムラインを開き直すと、端末にある古い投稿が4件ずつ上がっていきます**
（`postCatchUp`）。`post` の行が増えていくのが見えるはずです。

### 何も起きないとき

アプリはネットワークを待ちません。投稿は端末に書かれた瞬間に画面に出て、
サーバーには後から送られます。**画面が正しく見えることは、サーバーに届いた
証拠になりません。** 必ず Table Editor を見てください。

見るべき順:

1. **Authentication → Users** に自分がいるか。いなければアカウントができて
   いません（3 のメールの問題です）
2. `profile` に自分の行があるか。無ければハンドルの登録が終わっていません
3. `post` に行が来ないなら、Logs → API のエラーを見てください。`42501` は
   ポリシーによる拒否です（1 の匿名サインインが OFF の可能性が高い）

---

## 7. まだ無いもの

- **投稿の編集はサーバーに反映されません。** `post_edit` ポリシーはありますが
  アプリが `PATCH` を投げていません
- **`profile.av` はアカウントを作った時の顔のまま**です。文字を描き直しても
  変わりません。`docs/BACKLOG.md` に理由を書いてあります
- **`prompt`（その日の一文）は誰も書けません。** insert ポリシーが存在しない
  ので、API からは作れません。service_role でしか入れられず、それは意図です
- **`language` `publication` `quote` は書かれていません。** テーブルとポリシー
  はありますが、アプリがまだ触っていません
