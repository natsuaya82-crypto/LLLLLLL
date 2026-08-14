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

**Storage の画面でバケットを手で作らないでください。** SQL が作ります。手で作ると
名前や public の設定が食い違って、写真が表示されない原因になります。

### エラーが出たら

- `permission denied for schema storage` — SQL Editor は既定で十分な権限を持って
  います。出たらそのまま貼ってください、こちらで直します。
- `must be owner of table objects` — 同上。`storage.objects` の RLS 有効化は
  Supabase が既に済ませているので、その行だけ落として流せば残りは通ります。

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

## 4. 動いているかの確かめ方

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

## 5. まだ無いもの

- **投稿の編集はサーバーに反映されません。** `post_edit` ポリシーはありますが
  アプリが `PATCH` を投げていません
- **`profile.av` はアカウントを作った時の顔のまま**です。文字を描き直しても
  変わりません。`docs/BACKLOG.md` に理由を書いてあります
- **`prompt`（その日の一文）は誰も書けません。** insert ポリシーが存在しない
  ので、API からは作れません。service_role でしか入れられず、それは意図です
- **`language` `publication` `quote` は書かれていません。** テーブルとポリシー
  はありますが、アプリがまだ触っていません
