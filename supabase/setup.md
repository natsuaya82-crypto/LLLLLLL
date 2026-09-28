# Supabase でやること

ダッシュボードとログインが要る作業を書いています。SQL と関数を置くのは GitHub の
Actions がやります（オーナーにはターミナルが無い ── OWNER 2026-09-13）:

| Actions | やること |
|---|---|
| **Supabase Schema** → `check` | 読むだけ。通知の道・お題・cron・一度だけの SQL の記録を出す |
| **Supabase Schema** → `logs` | 読むだけ。直近 6 時間の断られた要求と Postgres のエラー |
| **Supabase Schema** → `apply` | `supabase/schema.sql` を丸ごと流す。本番を書き換える ── 押すのはオーナーか、オーナーが「押して」と言った時だけ |
| **Supabase Schema** → `once` | `supabase/once/` の、`file` に名前を書いた一つを一度だけ流す。同じ名前は二度流れない（`schema_step` に `once/<名前>`） |
| **Supabase Deploy** | 関数（`verify-plan`・`daily-prompt`・`push-send`）を置く |

`supabase/mail.md`（メール）と `docs/apple.md`（Apple）は、ダッシュボードにしか
置けないものの続きです。

プロジェクト: `iimwukyyasbybfrirhsf`

**上から順にやってください。** 前が済まないと次が意味を持ちません。
**§ 11 のバックアップだけは順番と関係なく、一番先に。**

---

## 0. 先に知っておくこと

**`schema.sql` は毎回ぜんぶ流します。** テーブルは `if not exists`、ポリシーは作る前に
`drop`、バケットは `on conflict do nothing`、関数は `create or replace` で書いてあるので、
何度流しても同じ状態になります。`npm run rls` がこのファイルを古い形の上に重ねて
**2回続けて流してから**攻撃を始めるので、「もう一度流せる」は検査で押さえてあります。

**順番: schema.sql が先、関数とアプリのビルドが後。**関数とアプリは schema.sql が
作るもの（`plan_put()`・`push_once()`・`slice_put()`、列）を呼ぶので、先に置くと
流すまで 500 や 404 で断られます。逆の順なら何も壊れません。

**service_role キーは絶対にどこにも貼らないでください。** アプリが持っているのは
publishable キーで、こちらは公開前提です。service_role は全部の policy を素通りします。

---

## 1. 匿名サインイン

**Authentication → Sign In / Providers → Anonymous sign-ins は OFF。**
アカウントは一種類で、匿名はありません（OWNER 2026-08-26）。アプリは匿名サインインを
叩かず、叩かれても `is_member()`（schema.sql）が書き込みを全部断ります。

---

## 2. schema.sql を流す

**Actions → Supabase Schema → `apply`**（押すのはオーナー）。`HTTP 200` で通っています。
流した後に `check` と同じものが出ます。

Actions が使えない時だけ、**SQL Editor → New query → 全部貼る → Run**。ファイルは:

```
https://raw.githubusercontent.com/natsuaya82-crypto/LLLLLLL/master/supabase/schema.sql
```

### 流したあとに見るところ

**Actions → Supabase Schema → `check`** が出す行で見ます。

| 行 | あるべきもの |
|---|---|
| `webhooks` | `1`（§ 12 の Webhooks が ON） |
| `triggers` | `push_on_follow,push_on_post,push_on_prompt,push_on_react` |
| `cronjob daily-prompt` | `0 7,8 * * * active=true timeout=60000 headers=vault`（§ 9-5） |
| `prompt …` | 今日（太平洋時間）の行がある |

ダッシュボードで見るなら: Storage → `post-media` が **Public ではない**。

### schema.sql が自分で断りを言う所

流してもエラーにせず、NOTICE を出して先へ進む所が四つあります。どれも「空」と
「壊れている」を分けるためです。

- Storage の RLS 有効化と、Storage を anon から外す revoke ── Supabase が既にやって
  いて、この役割では持ち主でないので断られうる。
- 通知の trigger ── § 12 の Webhooks（pg_net）が無いと作らない。
- お題の cron ── pg_cron・pg_net・Vault が無い、または見出しが無いと作らない（§ 9-5）。

### エラーが出たら

そのままこちらに貼ってください。直します。

### 自動で消えるもの

`schema.sql` の中で、人が押さずに消えるものは三つで、どれも DELETE REVIEW が
`docs/CHANGELOG.md` にあります。

- `slice_hist` の 4 版目（`slice_hist_keep()`、2026-09-09）── 言語の版は一つの部分につき 3 つまで
- 同じ iPhone の宛先を持つ別のアカウントの行（`device_one()`、2026-09-24）
- Apple が 410 と答えた宛先（push-send、2026-09-22）

---

## 3. メール

`supabase/mail.md` に全部書いてあります。要点だけ:

1. Resend にドメインを足して DNS を3つ入れる（**ホスト欄は `send`。ルートに
   入れると既存のメールが死にます**）。ルートには `_dmarc` の TXT を一つ**新しく**
   足す（既存のものは触らない ── `mail.md`）
2. Resend の API キーを作る
3. **Authentication → Emails → SMTP Settings** に入れる
   （Username は文字どおり `resend`。メールアドレスではありません）
4. **Authentication → Rate Limits → emails → 30/hour**
5. **Authentication → Emails → Templates → Confirm signup** の
   `{{ .ConfirmationURL }}` を **`{{ .Token }}`** に置き換える
6. **Authentication → Emails → Templates → Reset Password** でも
   **同じことをする**
7. **Authentication → Emails → Templates → Magic Link** でも
   **同じことをする**
8. **Authentication → Sign In / Providers → Email → OTP Settings → OTP Length**
   を **8** にする（6〜10 が入ります）
9. **Authentication → Sign In / Providers → Email → Confirm email** を **ON**

**5 と 6 と 7 は別のテンプレートです。一つ直しても、他は直りません。**
扉は `/auth/v1/otp` を叩くので、登録のコードは Magic Link（7）で届きます。
**押す一覧に無い手順は、押されません。**

**貼るものは英語です。**「bで」OWNER 2026-09-03 ── 英語だけ／英語と日本語を
並べる／本当に十言語、の三択で英語だけを選んだ。Supabase はひな形を種類ごとに
一つしか持たず、読む人の言語で切り替える仕組みがない。**アプリは十言語、メールは
一言語なので、その一つは英語。**十言語にするなら Send Email Hook でこちらが
メールを組むことになり、それは `docs/BACKLOG.md`。

Confirm signup と Magic Link（5 と 7）:

    Subject   Your Lingua verification code

```html
<p>Your Lingua verification code:</p>
<p style="font-size:28px;letter-spacing:4px"><b>{{ .Token }}</b></p>
<p>Enter it in the app.</p>
```

Reset Password（6）:

    Subject   Reset your Lingua password

```html
<p>Your Lingua password reset code:</p>
<p style="font-size:28px;letter-spacing:4px"><b>{{ .Token }}</b></p>
<p>Enter it in the app.</p>
```

**飛ばすとコードが一生届きません。** Capacitor アプリなのでリンクの着地先が
存在せず、アプリはコードを受け取る作りです ── `netVerify()` が登録の側、
`netRecoverCode()` が再設定の側で、どちらも `/auth/v1/verify` に打たれたものを
そのまま投げます。

### 桁数は 8。決めているのはここで、アプリではありません

**「8桁で60秒再送信、有効期限は知らん」OWNER 2026-09-03。**

上の 8 番がその設定です。**アプリは桁数を一度も数えていません** ── 欄に
`maxlength` は無く、`obMailCode()` も `obResetGo()` も打たれた文字列をそのまま
`/auth/v1/verify` に渡します。だから桁数はここだけで決まり、ここを変えれば
アプリは何もしなくてもそれに従います。**逆に、ここを直さずアプリ側で数えると、
同じことを二箇所で決めることになります。**

**有効期限はまだ決まっていません。**「知らん」ですので、ここには書きません。
Supabase 側の既定のままです。**勝手に決めないでください。**

**再送信は 60 秒あけてから**（`obAgainLeft()`、`www/onboard.js`）。

**直ったかの見分け方**: アプリから送って、届いたメールに**大きな数字**が
出ていれば直っています。リンクが1本だけならまだです。

---

## 4. Apple と Google のログインを ON にする

アプリにボタンは出ています。**ここを ON にするまで、押しても「ログインでき
ません」で終わります。** メールのログインは 3 で終わっているので、この節を
飛ばしても出せます。飛ばすなら、Apple も Google も両方飛ばしてください
（片方だけ出すのは Apple の審査規約 4.8 に引っかかります）。

### 4-1. Apple

**Authentication → Sign In / Providers → Apple → 有効化**

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

**Authentication → Sign In / Providers → Google → 有効化**

`Client IDs` に 4-2 でコピーした iOS のクライアント ID を入れて保存。

`Client Secret` は空で構いません。Apple と同じ理由で、iPhone のログインは
ブラウザを開かないからです。空だと保存できないと言われた場合は、Google Cloud
で **Web application** のクライアントも作って、その ID と Secret を入れ、
`Client IDs` の欄は **iOS の ID をカンマで足して両方**にしてください。

---

## 5. 通報を読む人を決める

通報は誰でも出せます。**読めるのは `profile.staff` が `true` のアカウントだけ**です。

### 5-1. 最初の一人。ここでやることは、ありません

**ハンドルが `lingua` のアカウントが、自動的に「権限者」になります。**
`schema.sql` にそう書いてあるので、ダッシュボードで押すものはありません。

- そのアカウントが**まだ無い**なら → アプリでハンドルを `lingua` にしてアカウントを
  作った瞬間、権限者になります（あとから `lingua` へ改名することはできません）
- そのアカウントが**もう有る**なら → `schema.sql` を流した時点で権限者になります

どちらの順でも同じ結果になるように書いてあるので、順番を覚えておく必要はありません。

> ⚠ **新しいプロジェクトを作った時だけ注意。** まだ誰も `lingua` を取っていない
> データベースでは、**最初にそのハンドルを取った人が権限者になります。**
> ハンドルは早い者勝ちで一意なので、あなたが取った時点でこの窓は閉じます。
> 新しく作ったら、まず自分がサインインしてください。

### 5-2. スタッフを足す・外す

**アプリの中からできます。** ダッシュボードは要りません。

権限者が管理画面（5-3）を開くと、今のスタッフの一覧と、`@ハンドル` を入れる欄が
あります。入れて「追加」で、その人が通報を読めるようになります。一覧のスタッフを
押すと外れます。

**権限者だけが外せません。** 一覧には出ますが押せません ── スタッフにした人が
おかしくなった時にあなたが締め出される、が起きないようにするためです。

| | |
|---|---|
| 権限者 | @lingua。管理画面に入れる。スタッフを足す・外す。**誰にも外せない** |
| スタッフ | 通報を読む。投稿を下ろす。アカウントを止める。管理画面には**入れない** |

**アプリの中に「自分をスタッフにする」画面はありません**（`schema.sql` の末尾で、
アプリがログインに使うロールから `staff` の列の更新権限を取り上げています。
足せるのは `staff_add()` という関数だけで、その関数は中で「訊いているのは
権限者か」を確かめます）。

**権限者は @ で決まります**（2026-09-03）。どの行が権限者かを言うのは
`profile_admin()` 一つで、`is_admin()` も `staff_drop()` もそれに訊きます。
立てたり外したりする欄はありません。`lingua` に改名することも、`lingua` から
改名することもできません（`profile_rename()`）。@lingua を外そうとすると
`staff_drop()` が断ります。`profile.admin` という欄は残っていますが、
**もう誰も読みませんし、誰も書きません。**

### 5-3. 管理画面の入り方

**設定を開いて、いちばん上の見出し「設定」を7回押します。**

7回押しても、権限者でなければ**何も起きません**。エラーも出ません。
「パスワードが違います」と出る扉は、そこに扉があると教えてしまうからです。

権限者なら管理画面が開き、**パスワードを訊かれます。** これはアプリの中で合言葉を
照らし合わせているのではなく、**そのパスワードを Supabase に送って、Supabase に
答えさせています**（設定の「パスワードを変える」が古いパスワードを確かめるのと
同じ道です）。アプリの中には合言葉がどこにも書かれていないし、どこにも保存されません
── `www/` のファイルは全部、アプリを落とした人が読めるからです。

アプリを閉じると、また訊かれます。**Apple や Google でサインインしている
アカウントには訊きません** ── 入れ直すパスワードが存在しないからです。
**つまりその二つの道で入った場合、七回タップだけで管理画面が開きます。**
どうするかは決まっていません（`docs/BACKLOG.md`）。

**7回タップもパスワードも、守っているのは画面だけです。**
データを守っているのは `is_admin()` と `is_staff()` で、**サーバが**毎回訊いて
います。7回タップを見つけた人がいても、パスワードを当てた人がいても、権限者で
なければ数も通報も何ひとつ返ってきません。この二つは「サインインしたままの端末を
人に渡したとき」のためのものです。

管理画面に出るもの: 通報（件数）、復旧、お問い合わせ（件数）、スタッフの一覧と
`@ハンドル` を入れる欄。

### 5-4. 通報の画面

通報の画面へは、管理画面（5-3）の「通報」から入ります。**入口はそこ一つで、管理画面に
入れるのは権限者だけです** ── @lingua でないスタッフには、今のところ通報の画面への道が
ありません（設定の「通報」はオーナーの決定で消えた。どうするかはオーナー ──
`docs/reports/rule-audit-2026-09-27-server.md` O4）。サーバーはスタッフ全員に通報を
読ませます（`report_read` は `is_staff()`）。

| | |
|---|---|
| 通報を読む | 新しい順。通報された投稿の本文と、理由と、あれば一言 |
| 投稿を下ろす・戻す | 他の人から見えなくなる。**消えるわけではない** |
| その人を止める・戻す | 書き込みが全部通らなくなる。読むのはできる |
| 通報を消す | 見て、問題が無かった通報を列から外す（`report_drop()`） |

下ろした投稿は、書いた本人には「下ろされました」と出た状態で残ります。間違いだったら
同じ画面から戻せます。止めたアカウントも同じ画面から戻せます。

止めても**消えません**。書いたものはそのまま、サインアウトもされません。止まるのは
書き込みだけで、読むのと、**自分でアカウントを削除するのは**そのままできます
（追い出された人が出口を塞がれる理由はないので）。

App Store の審査は「投稿を消すこと」と「その人を締め出すこと」の両方を訊いてきます。
両方あります。

---

## 6. 請求の上限を入れる

Pro は $25 で止まる料金ではありません。含まれているのは 8 GB のデータベース、
100 GB のファイル、**月 250 GB の通信**で、超えた分は $0.09/GB が足されます。
止めなければ上限はありません。

タイムラインを開くたびに写真が流れるので、先に無くなるのは通信です。Reddit で一日に
何千人か来た月に、気づいたときには請求が終わっている、という壊れ方をします。

`Settings` → `Billing` → **`Spend Cap`** を **ON**。

ON にすると、含まれている分を使い切った時点で**課金が増える代わりにサービスが
止まります**。どちらが良いかはその時に決められる話で、決めていない状態だけが選べません。

止まったときに何が起きるかは知っておいてください。**書き込みと読み込みが両方止まり、
データは消えません。** 言語はサーバーにあるので、作るのも保存もタイムラインも止まり、
電話に残るのは前に読み込んだ分を見ることだけです。

上限を上げたくなったら Spend Cap を OFF にするだけで、その場で再開します。

どれくらい保つかの目安です。毎日開く人の数で決まります。登録者数ではありません。

| 毎日開く人 | 月の通信 | |
|---|---|---|
| 500 人 | 約 15 GB | 余裕 |
| 2,000 人 | 約 60 GB | 余裕 |
| 8,000 人 | 約 240 GB | ここで 250 GB に当たる |
| 20,000 人 | 約 600 GB | 超過 +$32/月 |

サムネイルが入っている前提の数字です（タイムラインには小さい版を流し、押したときだけ
原寸を取りにいく）。原寸をそのまま流すとこの 10 倍になります。

---

## 7. 動いているかの確かめ方

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

### 何も起きないとき

送れなかった投稿は「未送信」と出ます。**画面に出ていることは、サーバーに届いた
証拠になりません。** 必ず Table Editor を見てください。

見るべき順:

1. **Authentication → Users** に自分がいるか。いなければアカウントができて
   いません（3 のメールの問題です）
2. `profile` に自分の行があるか。無ければハンドルの登録が終わっていません
3. `post` に行が来ないなら、**Actions → Supabase Schema → `logs`** を見てください。
   `42501` はポリシーによる拒否です（止められたアカウント ＝ `profile.banned_at`、
   または自分の行でない）

---

## 8. まだ無いもの

- **描いた文字の顔（`profile.av`）は、文字を描き直しても変わりません。**写真の顔は
  変わります。`docs/BACKLOG.md` に理由を書いてあります
- **`prompt`（その日の一文）は API からは誰も書けません。** insert ポリシーが
  存在しないので、service_role でしか入れられません。それは意図で、入れるのは
  § 9 の関数です
- **`publication` `quote` は書かれていません。** テーブルとポリシーはありますが、
  アプリがまだ触っていません
- **`plan` と `purchase` は API からは誰も書けません。** insert も update も
  ポリシーがありません。それは意図で、書くのは § 8b の関数だけです

---

## 8b. 課金の検証 ── verify-plan（**schema.sql を流し直してから**）

段（plus/pro）を決めるのはサーバーです。「だから端末でやるわけねえだろ」OWNER
2026-09-03、「アカウントごとなんだから、違うアカウントで復元できるのおかしい
だろ。検証して」OWNER 2026-09-06。

**これをやるまで、誰にも段が付きません。**函数が置かれていないか、根の証明書
が入っていないと、端末が受領書を送っても答えが返らず、みんな free のままです。
free の側に間違えるのが、間違えてよい側なので、そういう作りにしてあります。

### 8b-1. schema.sql を流す

§ 2 のとおり（Actions → Supabase Schema → `apply`）。`purchase` 表と、本人だけが
読む `purchase_read`・`plan_read` が入り、`plan` と `purchase` を書く policy は
一つもありません。

### 8b-2. Apple のルート証明書

Apple の公開証明書で、秘密ではありません。8b-3 の Actions が apple.com から落として
`APPLE_ROOT_CA_G3` に入れるので、人が打つものはありません。Apple が根を更新する
日が来たら、その Secret に**カンマで区切って二つ書けます**（古いものと新しいものが
並ぶ期間のため）。

`SUPABASE_URL` `SUPABASE_ANON_KEY` `SUPABASE_SERVICE_ROLE_KEY` は Supabase が
函数に自動で持たせるので、入れる必要はありません。

### 8b-3. 関数を置く（GitHub の Actions で）

ターミナルは要りません（OWNER 2026-09-13「パソコンのターミナルないよ。全部
ギットハブでなってる」）。`.github/workflows/supabase-deploy.yml` が
根の証明書の `supabase secrets set` と `functions deploy` を打ちます。

一度だけ、鍵を一つ入れます:

1. https://supabase.com/dashboard/account/tokens → **Generate new token**
   （名前は何でも）→ 出た文字列をコピー。
2. https://github.com/natsuaya82-crypto/LLLLLLL/settings/secrets/actions →
   **New repository secret** → Name `SUPABASE_ACCESS_TOKEN`、Secret にその
   文字列 → **Add secret**。

置く:

3. https://github.com/natsuaya82-crypto/LLLLLLL/actions/workflows/supabase-deploy.yml
   → 右の **Run workflow** → function は `verify-plan` のまま → 緑の
   **Run workflow**。
4. 一分ほどで行が出る。緑なら置けた。最後の step「確かめる」に
   `HTTP 401` と印字されているのが正しい形（サインインしていない呼び出しは、
   関数の一行目より前に Supabase が断る）。

`daily-prompt` も同じ画面で function を替えれば置けます。

### 8b-4. 確かめる

セッションからは実機の受領書が作れないので、ここで確かめられるのは**断ること**
だけです。それでも意味があります ── 誰でも通ってしまう状態がいちばん危ないので。

```
curl -X POST "https://<ref>.supabase.co/functions/v1/verify-plan" \
  -H "Content-Type: application/json" -d '{"jws":[]}'
```

| 返り | 意味 |
|---|---|
| `401` | 正しい。サインインしていない人には何も答えません |

**残りは実機です。**サンドボックスで ①買う ②同じアカウントで復元して付く
③別のアカウントで復元して**付かない**、の三つ。これは電話でしか答えが出ません。

---

## 8c. 段が終わった知らせ（**8b のあと。流す物が二つあります**）

「プランが終了しました」を出すのはサーバーの答えです。「オンラインで出してね
流石に」OWNER 2026-09-12。

**両方やるまで、このポップは誰にも出ません。**答えに `was` が無ければアプリは
出さないので、途中で止まっていても嘘は言いません ── 出ないだけです。

### 8c-1. schema.sql を流す

§ 2 のとおり。ここで使うのは三つ:

- `plan` 表に **`was`**（下がる前の段。下がった時だけ入る）
- `plan` 表に **`lapse_seen_at`**（本人が「今後表示しない」と言った時刻）
- **`plan_lapse_seen()`**（本人がその印を書く道。引数なし、書くのは自分の行だけ）

**`plan` 表への直接の書き込みはありません。**書けるのは `verify-plan`（service role）
と、この関数の一列だけです。

### 8c-2. verify-plan を置き直す

段を書く所が `was` も書くようになったので、**関数を置き直します**。
8b-3 の 3 と同じ ── Actions の Supabase Deploy を `verify-plan` で回すだけ。

### 8c-3. 確かめる

**SQL Editor で二つ。**列と関数が在ることだけなら、電話は要りません。

```sql
select column_name from information_schema.columns
 where table_name='plan' order by ordinal_position;
```

| 返り | 意味 |
|---|---|
| `id plan at was lapse_seen_at` | 正しい |
| `was` と `lapse_seen_at` が無い | 8c-1 がまだです |

```sql
select proname, prosecdef from pg_proc where proname='plan_lapse_seen';
```

| 返り | 意味 |
|---|---|
| `plan_lapse_seen  t` | 正しい（`t` = security definer） |
| 0 行 | 8c-1 がまだです |

**残りは実機です。**サンドボックスで有料を買って、期限を切らせて（あるいは
Dashboard の SQL Editor で `update plan set plan='free', was='plus',
lapse_seen_at=null where id='<その uid>'` と置いて）**次の起動で一度出ること**、
「今後表示しない」を付けて閉じたら **`lapse_seen_at` に時刻が入り、次の起動では
出ないこと**、付けずに閉じたら**また出ること**。これは電話でしか答えが出ません。

---

## 9. その日の一文を、毎日ひとつ書かせる

タイムラインの一番上に出る一文です。**全員が同じ文を見て、それぞれ自分の言語に
訳して投稿する** ── 読めない二百の文字の並びが、読める二百の文になる、という
のがこの機能の全部です。

書くのは Gemini で、**一日一回**。モデルが混んでいる（503・429）時だけ、同じ回の中で
三回まで聞き直します。無料枠で足ります。

### 9-1. Gemini の鍵をとる

https://aistudio.google.com/apikey → **Create API key**

**この鍵はアプリに入れません。** 端末は Supabase と直接しゃべっていて、その間に
うちのサーバーは無いので、**アプリが持っているものは全部公開されています**
（`www/net.js` の `SB_KEY` のコメントがそう言っています）。鍵は次で Supabase の
中にだけ置きます。

### 9-2. Supabase に鍵を預ける

Dashboard → **Edge Functions** → **Secrets**（左の Manage secrets）

| Name | Value |
|---|---|
| `GEMINI_API_KEY` | 9-1 でとった鍵 |
| `CRON_SECRET` | 適当に長い文字列を自分で決める（後で使う） |

`CRON_SECRET` は、URL を見つけた誰かが勝手に叩いて一日の枠を使い切らないための
合言葉です。関数はこれが合わなければ 401 を返して何もしません。

### 9-3. 関数を置く

**Actions → Supabase Deploy → `daily-prompt`**（§ 8b-3 と同じ画面）。

### 9-4. 一度、手で叩いて確かめる

```
curl -X POST "https://<ref>.supabase.co/functions/v1/daily-prompt" \
  -H "x-cron-secret: <9-2 で決めた CRON_SECRET>" \
  -H "Authorization: Bearer <anon の鍵（JWT）>"
```

関数は JWT の検証ありで置かれているので、`Authorization` が無いと関数が走る前に
Supabase が 401 を返します。anon の鍵は公開前提の鍵です（Project Settings → API
Keys → Legacy の `anon`。service_role は使わない）。

返ってくるもので、どこまで行ったかが分かります:

| 返り | 意味 |
|---|---|
| `{"day":"2026-08-23","wrote":"..."}` | 入りました |
| `{"day":"...","already":true}` | その日の分はもうあります。二度目は何もしません |
| `no`（401） | `x-cron-secret` が違うか、`CRON_SECRET` を入れていない |
| `GEMINI_API_KEY is not set` | 9-2 を飛ばしています |
| `refused: ja: ...` | モデルの答えが決まりを破ったので**書きませんでした**。もう一度叩けば別の文で試します |

Table Editor → `prompt` に行が一つ増えていて、`says` に十言語ぶん入っていれば
正解です。

### 9-5. 毎日にする

**時刻と待ちは `supabase/schema.sql` が言います**（末尾の daily-prompt の block）:
名前 `daily-prompt`、`0 7,8 * * *`、待ち 60000ms。cron が鳴るたびに、関数の入口に
渡す見出しを **Vault の `daily_prompt_headers`** から読みます ── 秘密はリポジトリに
ありません。

**今の本番**: ダッシュボードで作った job があるので、§ 2 の `apply` を押すと、その
job が持っている見出しを Vault に写してから、Vault を読む形に張り替えます。
押した後の `check` で `cronjob daily-prompt  0 7,8 * * * active=true timeout=60000
headers=vault` と出れば済みです。`headers=in the command` のままなら写せなかった
ということで、job は前のまま動いています（`apply` の出力の NOTICE に理由）。

**新しいプロジェクト**では、写す元がありません:

1. **Integrations → Cron** を有効にする（pg_cron）。§ 12 の Webhooks（pg_net）も要る。
2. **Integrations → Vault** で **Add new secret**、名前 `daily_prompt_headers`、中身は
   一行の JSON:
   `{"x-cron-secret":"<9-2 の CRON_SECRET>","Authorization":"Bearer <anon の鍵（JWT）>"}`
3. § 2 の `apply`。

**cron は UTC で、日付はアメリカ太平洋時間の 0 時に変わります**（「日付は
アメリカ時間の0時から」OWNER 2026-08-23）。太平洋時間の 0 時は、夏時間（3 月〜
11 月、PDT）は **07:00 UTC**、冬（PST）は **08:00 UTC** で、一つの時刻では両方に
当たりません。だから二回鳴らします。関数はその日の行があれば何もしないので、
**どちらの季節でも書くのは 0 時ちょうどの一回だけで、もう一回は何もしません**
── そして行が入った瞬間がお題の通知です（§ 12）。

2026-09-23 に測ったもの（関数と同じ `Intl` で、`America/Los_Angeles` の日付）:

| 鳴る時刻 (UTC) | 夏 2026-07-15 | 冬 2026-12-15 |
|---|---|---|
| 07:00 | 00:00 PDT、日付 07-15 → **書く** | 23:00 PST、日付 12-14 → 前日の行があるので何もしない |
| 08:00 | 01:00 PDT、日付 07-15 → もうあるので何もしない | 00:00 PST、日付 12-15 → **書く** |

切り替わりの日も同じです：2026-11-01（夏時間の終わり）は 07:00 UTC が 00:00 PDT で
書き、翌日からは 08:00 UTC が 00:00 PST で書く。2026-03-08（始まり）は 08:00 UTC が
00:00 PST で書き、翌日からは 07:00 UTC が 00:00 PDT で書く。

**冬の 07:00 UTC は前日の 23:00 です。**前日の 0 時の回が失敗していて前日の行が
無ければ、この回が前日の行を書き、前日のお題の通知がその 23:00 に出ます。

### 9-6. 文が気に入らない日は

Table Editor → `prompt` → その日の行を直接書き換えてください。`text` が英語、
`says` が十言語の JSON です。アプリは `says` の中から見ている人の言語のものを
出し、無ければ `text` に落ちます。

丸ごと消せば、その日はお題の無い日になります ── タイムラインの一番上は、今まで
通りの「書く行」に戻るだけで、壊れません。

---

## 10. 売上とアナリティクスの鍵（App Store Connect）── **もう要りません**

**OWNER 2026-09-02「revenue cat 入れたから、App Store Connect キーいらんわ」。**
下の 10-1 から 10-6 はやらないでください。鍵を作る必要はありません。

**売上とアナリティクスは RevenueCat の画面で見ます。**
「RevenueCatで見るって話してるんだけど」 OWNER 2026-09-02。アプリの中では
見ません。だから App Store Connect のキーも要りません。

**コードは 2026-09-02 に消しました。**やることはありません。

---

## 11. バックアップ ── **いま一番大事。ここだけは順番を飛ばして、先にやってください**

**やること:** ダッシュボードで、このプロジェクトのバックアップが入っているか
見る。入っていなければ入れる。**そして分かったことを、この節の下の表に書く。**

**いまどうなっているか。**
**分かりません。**下の表が空です。セッションからはダッシュボードに入れず、
画面は誰も見ていません。

**なぜ一番大事か。**
2026-09-04 に**オンライン前提に切り替える**と決まりました ──
「オフラインをなくそう。写しも別に今はいらなくない？」。
**サーバーが唯一の本物です。**iPhone にあるのは前に読み込んだ分の読むだけの
写しで、そこからサーバーへ戻る道はありません。

SNS の分（投稿・下書き・プロフィール・フォロー）もサーバー一箇所にしか
ありません。それが普通で、X もインスタも同じです ──
**あちらが消えないのは、運営がサーバーごとバックアップを取っているからです。**

**だから、ここが全部の土台です。ここが無ければ、上に何を積んでも意味が
ありません。**

### 見るところ

`Database` の左の列に **`Backups`** があります。見当たらなければ `Settings` の
中です。**この節はダッシュボードを見ずに書いているので、画面の名前が違ったら
実際の画面のほうが正しい。**

**三つ見てください。**

1. **入っているか。**「毎日取っている」と出ているか、それとも何も無いか。
2. **どこまで遡れるか。**今日ぶんだけか、一週間ぶんか。**画面に出ている
   一番古い日付**がその答えです。
3. **写真と声。**これは**別の入れ物**です（`Storage`）。データベースを
   巻き戻しても、**写真と声は戻りません。**投稿の本文だけが戻って、
   写真が消えたままになります。そこがどうなっているかも見てください。

### 入っていなかったら

`Backups` の画面から入れます。**Pro なら日ごとのバックアップは含まれています。**
**「どの時点にでも戻せる」ほうは別料金**です。どちらにするかは、
**遡れる幅がいくら要るか**で決めてください ── 日ごとだと、戻せるのは
**その日の朝の姿**で、その後に作られたものは戻りません。

### 済んだら、ここに書いてください

| | |
|---|---|
| 入っていたか | |
| どこまで遡れるか（一番古い日付） | |
| 写真と声はどうなっているか | |
| 見た日 | |

**この表が埋まるまで、「消えないための仕組み」は一つも完成しません。**

---

## 12. 通知（Database → Webhooks を一度だけ ON）

**ここは一クリックです。そして、そのクリックが無いと通知は一通も出ません。**

オーナーの決定（2026-09-22）：「通知作ろう。アップルのネイティブ通知で、
フォローされた時、返信きた時みたいな感じでSNS部分であるやつ。それに加えて設定で
個別通知のオンオフできるように。」

オーナーの決定（2026-09-23）：「通知なんだけど、今日のお題が変わった時にも出るように
できる？」「時間が決まってるでしょ。アメリカ時間の0時。それに合わせるのは？」
── お題は全員宛てで、§ 9-5 の cron がアメリカ太平洋時間の 0 時に行を入れた瞬間に
出ます。**引用された時も出ます**（引用、r94）。

### なぜ Dashboard でしかできないのか

`supabase/schema.sql` は、フォローされた・返信された・引用された・いいね／リポストされた瞬間と、
**その日のお題の行が入った瞬間**に edge function `push-send` を叩く**トリガー**を
作ります（どの表に作るかは `supabase/functions/push-send/push.mjs` の `PUSH` が
言います）。その叩く道は
**pg_net**（`net.http_post`）で、**これは PostgreSQL の物でも `schema.sql` の物でも
ありません** ── Supabase が、Database → Webhooks を有効にした時に入れます。
だから `mail.md` と同じで、ここが唯一の置き場所です。

### やること

**Dashboard → Database → Webhooks → Enable webhooks**（ボタン一つ）。

画面で Webhook を**作らないでください。**要るのはこのボタンが入れる **pg_net**
（`net` schema）だけで、トリガーは `schema.sql` が自分で作ります ── 画面で作る
ふつうの Webhook は、呼び出し人の署名を運べません（下）。

### 順番

1. **先にここ（§ 12）の Enable webhooks。**
2. そのあと **§ 2 の schema.sql を流す。**
3. そのあと **Actions → Supabase Deploy → `push-send`**（`docs/apple.md` § 8 に、
   その前に Apple 側でやることが順に書いてあります）。

### 逆の順でやってしまったら

**壊れません。もう一度 schema.sql を流すだけです。**

`schema.sql` の末尾近くにあるトリガーを作る所は、「pg_net（`net.http_post`）が
あれば作る、無ければ飛ばす」形にしてあります。だから Webhooks が OFF のまま貼っても、
**ファイルの残りは全部入ります** ── 2026-09-15 に、途中で止まったペーストが
`profile.link` も `plan.was` も入れずに終わり、Apple の審査が落ちて、全部の端末が
free と表示された、あの壊れ方をしないためです。

飛ばした時は SQL Editor の出力に **NOTICE** が出ます：

```
NOTICE:  push-send: Database -> Webhooks has not been turned on for this
project, so the notification triggers were NOT made. Everything else in
this file is in. See supabase/setup.md section 12, then run this file again.
```

### 入ったかどうかを見るところ

**Database → Triggers**（または SQL Editor で下を実行）。四つとも在れば済みです。

```sql
select g.tgname, g.tgrelid::regclass as "表"
  from pg_trigger g join pg_proc f on f.oid = g.tgfoid
 where f.proname = 'push_ping'
 order by g.tgname;
```

| あるべきもの | 表 |
|---|---|
| `push_on_follow` | `follow` |
| `push_on_prompt` | `prompt` |
| `push_on_post` | `post`（返信と引用） |
| `push_on_react` | `react` |

**四行出なければ、足りない種類の通知は出ません。**Enable webhooks をしてから、
§ 2 をもう一度流してください。

### 通知が来ないとき、どこを見るか

上から順に、どれか一つで止まります。

| 見るところ | 入っていなければ |
|---|---|
| Database → Triggers（上の四つ） | この節をやり直す |
| Edge Functions → `push-send` → Logs | 置かれていない（Actions → Supabase Deploy） |
| そのログの `not set: …` | Apple の鍵が入っていない（`docs/apple.md` § 8） |
| そのログの `switched off` | その人が設定でその種類を切っている |
| そのログの `no device` | その iPhone が通知を許可していない |
| そのログの `their own` | 自分でやったこと（仕様 ── 自分には送りません） |
| そのログの `already rung` | その行はもう鳴らした（一つの行は一度だけ、`push_once()`） |
| そのログの `no session` / HTTP 401 | 呼び出しに署名が付いていない。`request.headers` に `authorization` が来ていない可能性 |
| そのログの `not theirs to ring` | 行の actor と、叩いた人が違う。お題なら、行を入れたのが daily-prompt（service role の鍵）ではない |
| お題の通知だけ来ない | Actions → Supabase Schema → `check` の `cronjob` 行が § 9-5 のとおりか。daily-prompt の Logs に `wrote` があるか |

**`push-send` はサインインした本人しか叩けません。**「サインインなしで勧める
ものないけど」OWNER 2026-09-22。トリガーは**行を入れた人の Authorization を
そのまま持って行き**、函数は JWT の検証ありで置かれているので、署名の無い
呼び出しは函数が走る前に断られます。そのうえで函数は、**誰から来たかを
Supabase 自身に訊き直し**、その人がやった行でなければ何も送りません ──
サインインした他人が、他人の iPhone を鳴らすこともできません。

**お題だけは全員宛てで、それを鳴らせるのは service role の鍵だけです。**お題の
行を入れるのは daily-prompt で、それは service role の鍵で REST を叩きます。
トリガーはその Authorization を持って行き、`push-send` は「その鍵そのものか」を
見て、そうでなければ全員宛てを一通も出しません。`prompt` の表にはアプリから
書く道が無い（insert の policy も grant も無い）ので、サインインした人がお題の
行を作って全員を鳴らすことはできません ── `npm run rls` が B と anon で試して
います。

**だから `supabase_functions.http_request()`（Webhooks の画面で作るふつうの
Webhook）は使っていません。**あれの header は**トリガーの引数**で、
PostgreSQL はそれを作成時の文字列定数にします ── 呼び出し人の token を
入れる場所がありません。同じ一クリックで入る pg_net（`net.http_post`）は
header を値で受け取るので、`push_ping()` がそれを使います。**画面で Webhook
を作らないのはそのためです。**
