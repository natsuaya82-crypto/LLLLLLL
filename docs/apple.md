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
- ビルド番号を GitHub の run 番号で上書き（**番号はここに書きません** ──
  run ごとに増えるので、Actions の run 番号がそのままビルド番号です）
- 配布証明書とプロビジョニングを Secret から入れる
- Archive → Export → App Store Connect へアップロード

つまり Mac は要りません。**あなたが Apple 側でやるのは、上がってきたビルドを
配るところから先だけ**です。

バージョン（`MARKETING_VERSION`）は `1.0.0` のまま固定です。ビルド番号だけが
毎回増えます。1.0.0 で審査に出したあとに直しを入れるときは、`1.0.1` に上げる
必要があります（`ios/App/App.xcodeproj/project.pbxproj` の 2 か所）。

---

## 1. 上がったビルドを TestFlight で配る

1. **App Store Connect** → マイ App → Lingua → **TestFlight**
2. その run 番号のビルドが出るまで待つ。アップロード完了から **10〜30 分**。
   「処理中」のまま 1 時間を超えたら失敗しているので言ってください。
3. 輸出コンプライアンスの質問は出ません。`Info.plist` に
   `ITSAppUsesNonExemptEncryption = false` を入れてあります（HTTPS しか
   使っていないので、これが正しい答えです）。
4. **内部テスト**（App Store Connect のユーザーを 100 人まで、審査なし、すぐ配れる）
   - TestFlight → 内部テスト → グループを作る → そのビルドを追加
   - 自分のメールを入れる
5. 自分の iPhone に **TestFlight アプリ**（App Store から）を入れて、届いた
   招待から入れる。

外部テスター（誰でも、最大 1 万人）に配るときは初回だけ **ベータ App 審査**が
入ります。1 日前後。内部テストだけなら不要です。

---

## 1b. 実機で押す ── **133 は、まだ一つも押していません**

**133 が上がっています**（2026-09-04、成功）。**このビルドはコードの確認だけで
通っています。実機では誰も一つも押していません。**セッションからは押せません。

**とくに見てほしいもの。**どれも直したばかりの所か、直したつもりの所です。

- [ ] **検索の 🔍 を押して、投稿が出るか。**押せない状態だったのを直しました
- [ ] **取り込んだ単語を開いて保存を押し、発音が消えないか。**消えていました。
      **消えるのではなく、綴りから作った推測に置き換わります** ── 無くなれば
      気づけますが、これは気づけません。**画面には発音が一つも出ていないので、
      意味だけ直して保存を押しても起きます**
- [ ] **投稿に写真を付けて、電波の悪い所で出す。**二重に上がらないか。
      写真が落ちないか
- [ ] **無料のキーボード画面。**一行と、右下の＋。＋を押すとポップが出るか
- [ ] **上限のポップ。**後ろの画面が閉じないか。プランから戻ったとき、
      元の画面に戻るか

**押して何か違ったら、そのまま書いてください。**「押したらこうなった」が
一番強い報告です。

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

**2026-08-23、ビルド #83 がまさにこれで落ちました。** エラーはこう出ます:

```
error: Provisioning profile "Lingua Distribution" doesn't include
       the Sign In with Apple capability.  (in target 'App')
error: Provisioning profile "Lingua Distribution" doesn't include
       the com.apple.developer.applesignin entitlement.
```

#82 が通っていたのは、`App.entitlements` にあの行が入る前だったからです。
**新しく壊れたのではなく、上の 1〜3 がまだ一度も済んでいません。**

---

## 2b. ウィジェットのプロファイル（#83 で新しく必要になった）

ホーム画面のウィジェット（`LinguaWidget`）が追加されました。中身は
`ios/App/LinguaWidget/` ── 時計・日付・カレンダーで、どれも自作文字の数字で
描きます。読むのは App Group の `widget.json` だけで、アプリには何も訊きません。

**専用の App ID とプロファイルが要ります。** これが無いと Archive はこう
落ちます:

```
error: No profile for team '***' matching 'Lingua Widget Distribution' found
       (in target 'LinguaWidget')
```

キーボードのときとまったく同じ形なので、**キーボードのプロファイルを作った
ときの手順をそのまま繰り返します。** 違うのは名前と ID だけです。

| | 値 |
|---|---|
| Bundle ID | `com.tokinets.lingua.widget` |
| プロファイル名 | **`Lingua Widget Distribution`** |
| App Group | `group.com.tokinets.lingua`（本体・キーボードと同じ） |
| 種類 | App Store Distribution |

名前は `ios/App/App.xcodeproj/project.pbxproj` の
`PROVISIONING_PROFILE_SPECIFIER` に書いてあるものと**一字一句同じ**でなければ
なりません。違うと「見つからない」で落ちます。

### 順番

1. **Identifiers → ＋ → App IDs → App**
   - Description: `Lingua Widget`
   - Bundle ID: **Explicit**、`com.tokinets.lingua.widget`
   - Capabilities: **App Groups だけ**にチェック → **その右の Configure を
     押して** `group.com.tokinets.lingua` を選ぶ → Continue → Save
     （チェックだけで済ませると配列が空のまま出てきます。下の
     「チェックを入れただけでは入りません」を読んでください）
   - Sign in with Apple は**要りません**。ログインするのは本体だけです
   - Continue → Register

2. **Profiles → ＋ → App Store Connect（Distribution）**
   - App ID に `com.tokinets.lingua.widget` を選ぶ
   - 証明書は本体・キーボードと同じ配布証明書
   - **Provisioning Profile Name に `Lingua Widget Distribution`** と入れる
   - Generate → **Download**

3. **base64 にして GitHub の Secret に入れる**
   ```
   base64 -i Lingua_Widget_Distribution.mobileprovision | pbcopy
   ```
   - GitHub → Settings → Secrets and variables → Actions → New secret
   - 名前: **`WIDGET_PROVISIONING_PROFILE_BASE64`**
   - 値: 上でコピーしたもの

   **改行が混ざらないように。** Mac の `base64` は既定で一行に出しますが、
   コピーの途中で折り返しが入ると復号に失敗し、
   「has no application-groups entitlement」で止まります。

4. `.github/workflows/ios-deploy.yml` の「Install Provisioning Profiles」が
   その Secret を読むようになっている必要があります（#83 の時点では本体と
   キーボードの二つしか読んでいませんでした。同じコミットで直してあります）。

### 三つが揃っているかの見分け方

ビルドのログの「Install Provisioning Profiles」に、三行こう出ます:

```
app.mobileprovision: Lingua Distribution
kb.mobileprovision: Lingua Keyboard Distribution
wg.mobileprovision: Lingua Widget Distribution
```

名前が違うもの、または行が足りないものがあれば、そこが原因です。**Archive
まで進んでから落ちるのを待つ必要はありません。**

すぐ下に App Group も三行出ます。**空だったらそこで止まります。**

```
app.mobileprovision app groups: Array {
    group.com.tokinets.lingua
}
```

### チェックを入れただけでは入りません（実際に踏んだ）

1 枚目の `Lingua Widget Distribution` はこうなっていました:

```xml
<key>com.apple.security.application-groups</key>
<array></array>
```

キーはある、配列は空。**Identifier 画面で App Groups に *チェックを入れた*
だけで、その右の *Configure* を押して `group.com.tokinets.lingua` を選んで
いない**とこうなります。チェックボックスは「この capability を使う」としか
言っておらず、どのグループかは Configure の中にあります。

これが厄介なのは、何も落ちないからです。プロファイルは正しい名前と正しい
バンドル ID を持っていて、署名は通り、Archive は緑で、TestFlight にも上がる。
**App Group のファイルが読めないウィジェットだけが出荷されます。**
ウィジェットが App Group を読むためだけに存在することを考えると、それは
「ビルドが失敗した」より悪い状態です。

ワークフローの見張りも、最初はこれを通していました
(`PlistBuddy -c 'Print :Entitlements:com.apple.security.application-groups'`
は**空配列でも成功する**)。今は `group.com.tokinets.lingua` という文字列が
入っているかを訊きます。

**直したら、プロファイルは作り直してください。** App ID を直しても、既に
発行済みのプロファイルはその capability を後から拾いません
── `ios/App/App/App.entitlements` の
"An old profile does not gain a capability by the app claiming one" と
同じ罠です。Profiles の一覧で古いものを削除して、＋ から作り直します。


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

### 商品 4 つ（2 段 × 月・年）

段は Plus と Pro の 2 つです（決定: `docs/FEATURE_RULES.md` 2026-08-23）。
Studio が売っていたのは通したモデルで、それはまだありません
（`www/core.js` の `PLANS` の注）。**無いものに値段を付けない**ので、
Studio の商品は作りません。

| | Plus 月 | Plus 年 | Pro 月 | Pro 年 |
|---|---|---|---|---|
| 参照名 | Lingua Plus | Lingua Plus Yearly | Lingua Pro | Lingua Pro Yearly |
| **製品 ID** | `com.tokinets.lingua.plus.monthly` | `com.tokinets.lingua.plus.yearly` | `com.tokinets.lingua.pro.monthly` | `com.tokinets.lingua.pro.yearly` |
| 期間 | 1 か月 | 1 年 | 1 か月 | 1 年 |
| 価格 | **USD 4.99** | **USD 49.99** | **USD 9.99** | **USD 99.99** |
| グループ内のレベル | 2（下） | 2 | 1（上） | 1 |

**この 4 つの ID は、アプリのコードに既に書いてあります**
（`ios/App/App/LinguaStore.swift` の `plans`）。無い商品を聞いても StoreKit は
それを返さないだけなので、**先に作った分から順に売り物として出てきます**。
Plus を先に作れば Plus だけが並びます。

製品 ID は**あとから変えられません**。上のもので問題なければそのままで、
変えたいなら**コードを直すので先に言ってください**。

**グループ内のレベル**は、上げ下げのときに Apple がどちらが上かを知るための
ものです。Pro を 1（上）、Plus を 2（下）。同じグループに入れておくと、
Plus → Pro は「アップグレード」として即時に切り替わり、日割りも Apple が
やります。別々のグループにすると両方同時に契約できてしまいます
（コード側は両方持っている人には**高いほうを渡す**ので壊れはしませんが、
二重に課金されるのは親切ではありません）。

### 値段は国ごとに変わります（一つずつ設定しなくていい）

「てか国によって値段変わる？ それぞれひとつづつ設定したほうがいいかな」 —
2026-08-23 の質問。**変わります。一つずつ設定する必要はありません。**

商品ごとに決めるのは**基準にする一国の値段だけ**です。そこを決めると Apple が
残り 174 のストアフロントを自動で埋めます — 為替、その国の税、その国で自然な
丸め方まで込みで。気に入らない国だけ**あとから個別に上書き**できます。為替が
動いたときに他の国を追随させるかどうかも選べます。

### 決まったこと（2026-08-23、owner）

- **基準は上の表の USD**。Plus 月 4.99 / 年 49.99、Pro 月 9.99 / 年 99.99。
  「基準はさっき値段決めたやろ」
- **各国はキリのいい数字に手で直す**。「各国がキリ良くしたい。」
  Apple の自動変換は税と為替で端数が出るので、そこを一段まるめます。

USD 4.99 を基準にすると日本は 1,500 円あたりになります。

**現実的なやり方**: 175 全部を手で見るものではありません。Apple の価格は
もともと各国で使われる刻みから選ばれるので、多くの国は最初からキリのいい
数字です。**売れる国から順に見て、端数が出ているものだけ直す**のが実際の
作業になります（日本・アメリカ・ユーロ圏・イギリス・韓国・台湾あたり）。
残りは Apple の自動のままで問題ありません。

**手で直すと、年額の割引率が国ごとにずれます。** 例えば月 750 円・年 7,500 円
なら 17% 引き、月 800 円・年 8,000 円でも 17% 引きですが、月 750 円・年 8,000
円にすると 11% 引きです。**アプリはそこを Apple が返した数値から計算するので、
何を入れても画面は正しくなります**（2026-08-23 の変更）。`PLANS` に書いてある
17 は実機では使われません。

**アプリ側は何も知りません。** 画面に出るのは `LinguaStore.products` が返す
`displayPrice` — その人の通貨で、その地域の書式で、Apple が組み立てた文字列
です。年額が何％安いかも、Apple が返した数値から計算します。**Apple は国ごとに
別々に丸めるので、ドルで 17% 引きの年額は円では 17% 引きではありません**。
`www/i18n` に書いてある `$4.99` はブラウザとスクリーンショット用の控えで、
実機では上書きされます。

なので**ここで値段を変えても、アプリのコードを直す必要はありません**。
（製品 ID を変えるときだけコードを直します。上の表の注のとおりです。）

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
- **年齢制限**（アンケートに答えると決まります）。**規約は13歳以上のみ**と
  決まりました（OWNER 2026-08-28「13さん以上だね。snsって基本そうやん」）ので、
  4+ にはなりません。アンケートで出た値が規約と食い違ったら止めて報告すること
- **アカウント削除**: アプリ内に削除の導線が要ります。設定 →
  アカウント設定に入っています
- **サインイン方法**: Apple 以外のサインイン（メール）を出すなら、
  「Sign in with Apple」も要ります。**両方入っています** ──
  `obSignInApple()`（`www/onboard.js`）が扉に並んでおり、
  `ios/App/App/App.entitlements` が `com.apple.developer.applesignin` を
  宣言しています。プロファイル側は 2 節が済んでいることが条件です

---


### プライバシーの一覧表 ── **まだ在りません。上げる前に要ります**

上の「App のプライバシー」は**画面で答える申告**です。それとは別に、
**アプリの中に入れる一覧表**（`PrivacyInfo.xcprivacy`）が要ります。

**探して確かめました。この repo には一つも在りません。**

**オーナーがやることは、いまはありません。**作るのはセッション側の仕事で、
別のところが持っています（`docs/scope/aud-reject.md` § 1）。

**オーナーに見てほしいのは、その次です。**入ってから上げたビルドで、
**Apple から警告のメールが来ないか。**アップロードは通っても、
「申告が足りない」という便りが後から届く形で落ちます。

- [ ] 一覧表が入ったビルドを上げた
- [ ] Apple から警告のメールが来ていない

---

## 5b. 上げる前に、二つの購読と TestFlight を見ておく

**セッションからは App Store Connect に入れません。**いまどうなっているかを
知っているのはオーナーだけです。

- [ ] **3 節の三つ**（有料 App 契約・銀行口座・税務情報）が全部「有効」か。
      **数日かかることがあります。**ここが済むまで、商品を作っても
      「送信準備完了」になりません
- [ ] **4 節の商品**が四つとも出来ているか。**商品が無いあいだ、アプリの
      値段は打ち込みの数字に落ちます**
- [ ] **TestFlight で 133 が配れているか。**内部テストなら審査は要りません

---

## 6. 買う道はつながっています。足りないのはサーバー側です

**両側とも在ります。** `ios/App/App/LinguaStore.swift` に `products` / `buy` /
`restore` / `current` / `manage` があり、署名が通らない取引は拒み、消費した
取引は finish し、アプリを閉じている間に届く更新も `Transaction.updates` で
見ています。プラグインは使っていません（このアプリは `@capacitor/core` を
読み込まないので、使えません。`www/share.js` の長い注を参照）。
`www/` 側は `www/store.js` 一枚で、`setPlan()`（`www/settings.js`）が
`storeBuy()` の唯一の呼び出し元、`PLAN_BUY` は `true` です。

画面のほうも揃っています ── 三段のカード、月と年の二つのボタン、購入、
購入を復元、サブスクリプションの管理、そして Guideline 3.1.2 の開示
（自動更新の一文と、規約とプライバシーの二つのリンク。`npm run term`）。
**Plus の値段の文字列は十言語ぜんぶに入っています**（`plan.price.plus` /
`plan.price.plus.yr`）。

**実機では一度も走っていません。**ブラウザには App Store が無いので
`storeOn()` が false になり、検査もスクリーンショットもそちらを歩きます。

**足りないのはレシートの検証です。いま、段を決めているのは端末です。**

**プランがアカウントに乗るところまでは出来ています** ── `supabase/schema.sql`
の `plan` テーブルに `netPlanUp()` が書き、`netPlanSync()` が読み戻して**高い
ほうの段**を採ります（OWNER 2026-09-01「課金とアカウントとキーボードはアカウント
に結びつく」）。

**その行に載るのは、端末が言ったことです。**サーバーは Apple に一度も訊いて
いません。`is_member()` はサインインしているかしか見ません。だから改造した端末
は自分を Pro だと言えて、サーバーはそれを書き留めます。

**これから直します。**「だから端末でやるわけねえだろ」OWNER 2026-09-03 ──
サーバーが Apple に訊き、段はその答えで決まる形にします。別のセッションの
担当で、`docs/FEATURES.md` § 1 に置いてあります。

なので:

- **TestFlight で配って中身を見てもらうのは、今のままで問題ありません。**
- **App Store の審査に出すのは、4 節の商品を作ってからです。** 商品が無い
  あいだ StoreKit は何も返さず、画面は打ち込みの値段に落ちます。有料の機能を
  出しておいて App 内課金を通していないアプリは Guideline 3.1.1 で落ちます。

残っている作業は一つだけで、上のレシート検証です。`plan` の行と RLS は
`supabase/schema.sql` に在るので、足りないのは**サーバーが Apple に訊く一本**
です。

**そちらでやることは 4 節（商品 4 つ）です。** 作った商品から順に
アプリに出てくるので、Plus を先に作っても問題ありません。

---

## 7. 詰まったときの見どころ

- ビルドが TestFlight に出てこない → GitHub Actions の run が緑か。
  緑なのに出ない → App Store Connect のメール（Apple から却下の理由が来ます）
- 「Invalid Signature」→ `DISTRIBUTION_P12_BASE64` か
  `APPLE_PROVISIONING_PROFILE_BASE64` の期限切れ。1 年で切れます
- 「ビルド番号が既に使われています」→ run 番号は増え続けるので普通は
  起きません。起きたら誰かが手で番号を戻しています
