# Apple 側でやること

App Store Connect と Apple Developer の画面で入力するものだけを書いています。
どれもコードに書ける場所がないので、ここが唯一の置き場所です。
`supabase/mail.md` と同じ理由でここにあります。

アプリ: **Lingua** / Bundle ID **com.tokinets.lingua** / チーム ID は
GitHub の Secret `APPLE_TEAM_ID`。

---

## 0. 機械がやること・人がやること

CI（`.github/workflows/ios-deploy.yml`, `macos-latest`）が毎回やること:

- `npx cap sync ios`（`www/` を iOS に入れる）
- ビルド番号を GitHub の run 番号で上書き（今回のビルドは **38**）
- 配布証明書とプロビジョニングを Secret から入れる
- Archive → Export → App Store Connect へアップロード

つまり Mac は要りません。**あなたが Apple 側でやるのは、上がってきたビルドを
配るところから先だけ**です。

バージョン（`MARKETING_VERSION`）は `1.0.0` のまま固定です。ビルド番号だけが
毎回増えます。1.0.0 で審査に出したあとに直しを入れるときは、`1.0.1` に上げる
必要があります（`ios/App/App.xcodeproj/project.pbxproj` の 2 か所）。

---

## 1. 今回のビルド（#38）を TestFlight で配る

1. **App Store Connect** → マイ App → Lingua → **TestFlight**
2. ビルド 38 が出るまで待つ。アップロード完了から **10〜30 分**。
   「処理中」のまま 1 時間を超えたら失敗しているので言ってください。
3. 輸出コンプライアンスの質問は出ません。`Info.plist` に
   `ITSAppUsesNonExemptEncryption = false` を入れてあります（HTTPS しか
   使っていないので、これが正しい答えです）。
4. **内部テスト**（App Store Connect のユーザーを 100 人まで、審査なし、すぐ配れる）
   - TestFlight → 内部テスト → グループを作る → ビルド 38 を追加
   - 自分のメールを入れる
5. 自分の iPhone に **TestFlight アプリ**（App Store から）を入れて、届いた
   招待から入れる。

外部テスター（誰でも、最大 1 万人）に配るときは初回だけ **ベータ App 審査**が
入ります。1 日前後。内部テストだけなら不要です。

---

## 2. Sign in with Apple を有効にして、プロファイルを作り直す

**これが済むまで、次のビルドは必ず失敗します。** アプリ側は
`ios/App/App/App.entitlements` で「このアプリは Apple ログインを使う」と
宣言済みで、宣言だけあってプロファイルに入っていないと Archive が落ちます。
エラーは署名の話に見えて、Apple ログインの話だとはどこにも書かれません。

順番があります。**1 → 2 → 3 の順でないと意味がありません。**

1. **developer.apple.com → Certificates, Identifiers & Profiles →
   Identifiers → `com.tokinets.lingua`**
   - Capabilities の一覧から **Sign in with Apple** にチェック → Save
   - キーボード拡張（`com.tokinets.lingua.LinguaKeyboard`）のほうは
     **触らないでください。** ログインするのは本体だけです

2. **Profiles → 本体の配布用プロファイル**
   - **Edit → そのまま Save** で作り直します。既存のプロファイルは、App ID に
     機能を足しても自動では追いつきません。作り直して初めて入ります
   - **Download** して手元に置く

3. **GitHub → Settings → Secrets and variables → Actions**
   - `PROVISIONING_PROFILE_BASE64` を、2 でダウンロードしたファイルの
     base64 に差し替える
   - Mac なら `base64 -i Lingua.mobileprovision | pbcopy`
   - キーボードのほう（`KEYBOARD_PROVISIONING_PROFILE_BASE64`）は
     **そのままで構いません。**変えていないので

済んだかどうかは、次のビルドが通るかどうかでしか分かりません。1 と 2 の
どちらかを飛ばすと、`App.entitlements` に書いた
`com.apple.developer.applesignin` がプロファイルに無い、という趣旨のエラーで
Archive が止まります。

Supabase 側は `supabase/setup.md` の 4-1 です。あちらは**この節の後**で
構いません（順番はどちらでもいいのですが、ビルドが通らないと試せません）。

---

## 3. 有料にする前に、必ず先に済ませるもの

ここが済んでいないと、サブスクリプションの商品を作っても「送信準備完了」に
なりません。App Store Connect → **ビジネス**（旧 契約/税金/口座情報）で:

1. **有料 App 契約**（Paid Applications Agreement）に同意
   - Account Holder（アカウント責任者）本人しか同意できません
2. **銀行口座**を登録
   - 日本の口座なら、支店コードと口座名義（半角英字）が要ります
3. **税務情報**
   - 日本 / 米国 / その他 の 3 つを埋めます。米国の W-8BEN が一番手間です

この 3 つが全部「有効」になるまで、**数日**かかることがあります。先に始めて
おいてください。

---

## 4. サブスクリプションの商品を作る

App Store Connect → Lingua → **収益化** → **サブスクリプション**。

### サブスクリプショングループ

1 つ作ります。名前は `Lingua`。**グループが同じ商品どうしは、ユーザーが
アップグレード・ダウングレードできます**。あとで Studio を出すときも同じ
グループに入れてください。別グループにすると両方同時に契約できてしまいます。

### ウィジェットのプロビジョニングプロファイル

キーボードと同じことが、ウィジェットにもう一つ要ります。

| | |
|---|---|
| バンドル ID | `com.tokinets.lingua.widget` |
| プロファイル名 | `Lingua Widget Distribution` |
| App Group | `group.com.tokinets.lingua`（キーボードと同じもの） |

Identifiers に `com.tokinets.lingua.widget` を作り、App Groups を有効にして
上のグループを選び、配布用プロファイルを `Lingua Widget Distribution` の名前で
作ります。**これが無いと署名が通らず、ビルドが止まります。**

拡張の中身は `ios/App/LinguaWidget/`。ホーム画面に置く時計と日付で、
どちらも自作文字の数字で描きます。読むのは App Group の `widget.json` だけで、
アプリには何も訊きません。

---

### 商品 1 つ

出すのは Plus だけです。Studio が売っていたのは通したモデルで、それは
まだありません（`www/core.js` の `PLANS` の注）。**無いものに値段を付けない**
ので、商品も今は作りません。モデルが入る日に、同じグループの上の段として
足します。

| | Plus |
|---|---|
| 参照名 | Lingua Plus |
| **製品 ID** | `com.tokinets.lingua.plus.monthly` |
| 期間 | 1 か月 |
| 価格 | **USD 9.99** |
| グループ内のレベル | 1（下） |

製品 ID は**あとから変えられません**。上のもので問題なければそのままで、
変えたいなら先に言ってください。

価格は米ドルで入れると、他の国は Apple が自動で決めます。日本円は
1,500 円あたりになります。国別に手で直すこともできます。

### それぞれに要るもの

- **表示名**（ユーザーに見える名前）と**説明**
- **ローカライズ**: 少なくとも英語と日本語。アプリが 10 言語あるので、
  10 言語ぶん入れると揃います
- **審査用のスクリーンショット**: 課金画面（アプリ内の「プラン」画面）を
  1 枚。iPhone の実機で撮ったものでかまいません

---

## 5. App の情報（初回審査で必ず要るもの）

App Store Connect → Lingua → **App Store** タブ:

- **スクリーンショット**: 6.9 インチ（iPhone 17 Pro Max など）が必須。
  ほかのサイズは自動で流用されます。3〜10 枚
- **説明文 / キーワード / サポート URL / マーケティング URL**
- **プライバシーポリシーの URL** — **必須**。アカウント（メール）と
  投稿をサーバー（Supabase）に置くので、これがないと審査に落ちます
- **App のプライバシー**（データ収集の申告）:
  - 連絡先情報 → メールアドレス → アカウント管理に使用、ユーザーに紐づく
  - ユーザーコンテンツ → 投稿、アプリ機能に使用、ユーザーに紐づく
- **年齢制限**（アンケートに答えると決まります。たぶん 4+）
- **アカウント削除**: アプリ内に削除の導線が要ります。設定 →
  アカウント設定に入っています
- **サインイン方法**: Apple 以外のサインイン（メール）を出すなら、
  「Sign in with Apple」も要ります。**今はメールだけなので、ここは
  審査で止まる可能性があります。**

---

## 6. 先に言っておくこと — 課金はまだ動きません

**アプリに StoreKit（App 内課金）のコードが一行も入っていません。**

いまの「プラン」画面のボタンは `SET.plan` を書き換えるだけで、端末の中の
フラグが変わるだけです。お金は 1 円も動きません。誰でも押せます。

なので:

- **TestFlight で配って中身を見てもらうのは、今のままで問題ありません。**
- **App Store の審査に出すのは、まだです。** 有料の機能を出しておいて
  App 内課金を通していないアプリは、Guideline 3.1.1 で確実に落ちます。

課金を通すのに要る作業は、こちらの側です:

1. `@capacitor-community/in-app-purchases` などのプラグインを入れる
   （`npx cap sync ios` は CI がやるので、Mac は要りません）
2. プラン画面のボタンを「購入」に変える
3. **レシート検証**。ここが本番で、端末の中のフラグを信じてはいけません。
   `SET.plan` は誰でも書き換えられるので、サーバー（Supabase）側で
   Apple に問い合わせて、そのアカウントが本当に払っているかを持つ必要が
   あります。`supabase/schema.sql` に列と RLS が要ります
4. 「購入を復元」ボタン（**必須**。ないと落ちます）

やっていいなら言ってください。順番としては、**2 の契約・口座・税務を先に
始めておいて**、その間にこちらで 1〜4 を書く、が一番早いです。

---

## 7. 詰まったときの見どころ

- ビルドが TestFlight に出てこない → GitHub Actions の run が緑か。
  緑なのに出ない → App Store Connect のメール（Apple から却下の理由が来ます）
- 「Invalid Signature」→ `DISTRIBUTION_P12_BASE64` か
  `APPLE_PROVISIONING_PROFILE_BASE64` の期限切れ。1 年で切れます
- 「ビルド番号が既に使われています」→ run 番号は増え続けるので普通は
  起きません。起きたら誰かが手で番号を戻しています
