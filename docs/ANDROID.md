# Android

「Android版作りたいから移行できるもの全部移行しつつ、作り直しで必要なところは
ルールに則って作って欲しい。」OWNER 2026-09-27。同じリポジトリで作る。

`android/` は Capacitor の Android プロジェクトで、`www/` をそのまま載せる。
ビルドの工程は無い ── `npx cap sync android` が `www/` を
`android/app/src/main/assets/public` に写し、そこは `.gitignore` 済み。
appId は `com.tokinets.lingua`、webDir は `www`（`capacitor.config.json`、
iOS と同じ一つ）。

画面は Android か iPhone かを知らない。ネイティブは
`Capacitor.nativePromise(名前, メソッド, 引数)` の一つの道だけで呼ばれ、
Android の Kotlin は iOS の Swift と**同じ名前・同じメソッド・同じ答えの形**で
答える。`tools/assets-check.mjs` がそれを持つ: `www/` が書く
プラグインとメソッドの組はすべて Kotlin に在る、Kotlin の表は Swift の表と
両方向で同じ、Kotlin のプラグインはすべて `MainActivity.kt` で橋に渡されて
いる。走らせると `android:` の行が数を言う。

## 何ができて、何が「無い」と答えるか

Kotlin は `android/app/src/main/java/com/tokinets/lingua/` の五つのファイル。

| プラグイン.メソッド | Android の答え |
|---|---|
| LinguaShare.ask | できた。Android 標準の AlertDialog の一覧（CLAUDE.md の「システムのダイアログが許される二つ」の一つ目の Android 版）。destroy の一つは赤。キャンセル・戻る・外を押すは全部 `i: -1` |
| LinguaShare.pickPhoto | できた。Android の写真ピッカー（権限は要らない。古い端末では androidx が文書の選択に落とす）。長辺 `max` まで、EXIF の向き、白地、JPEG 0.9。`b64` と `b64s` |
| LinguaShare.sheet / shareFile | できた。キャッシュの `Sheets/` に書き、Android の共有シートで渡す |
| LinguaShare.dropOldSheets | できた。キャッシュの `Sheets/` を消す |
| LinguaShare.settings | できた。このアプリの設定ページ |
| LinguaShare.audio | 何もせず答える。iOS が切り替える「音声の種類」が Android には無い |
| LinguaShare.voice / dropVoice / sweepVoices | 事実を答える。iOS では前の版が残した声のファイルを読む・消すためのもの。Android には前の版が無く、そのフォルダは一度も無い |
| LinguaStore.review | できた。Google Play の In-App Review |
| LinguaShare.write | **無いと答える**（reject）。Android にはまだキーボードもウィジェットも無い。`www/share.js` が reject を `SHARE.how` に残す |
| LinguaShare.renderPdf | **無いと答える**（reject）。下の § 画面にペンで書いたシート |
| LinguaStore.products | Google Play Billing の値段（基本プランの formattedPrice）。Play Console に商品が無い間は**空の一覧**で、画面は「まだ販売されていません」 |
| LinguaStore.current / buy / restore / manage | Google Play Billing。答えは `google: [{token, product}]`（下の § 課金）。Play ストアの無い端末は `no store` で、`current` の reject は `netPlanVerify([])` に落ち、サーバーがこのアカウントの plan を答えるので、iPhone で買った plan は Android でもそのまま |
| LinguaPush.ask / status | Firebase Cloud Messaging（下の § 通知）。android/app/google-services.json が無い間は**無いと答える**（reject）。`denied` は返さない ── `www/push.js` はそれを「通知は…設定でオフになっています」と描いて設定へ誘い、無い物について偽の文になる。reject なら画面はブラウザと同じ描き方（スイッチだけ） |

**課金は Google Play Billing を直接つなぐ**（RevenueCat は使わない）、値段は
iPhone と同じ（`docs/FEATURE_RULES.md` 2026-09-27）。コードはできていて、
Play Console の商品とサービスアカウントの鍵を待っている（下の § オーナーが
すること）。**通知**も Firebase Cloud Messaging でコードはできていて、Firebase の
プロジェクトと二つの鍵を待っている（下の § 通知）。キーボード（Android の IME）と
ウィジェットは次の回。

### 課金

**端末は確かめない。** App Store は端末に署名つきの取引（`jws`）を渡すが、
Google Play が渡すのは購入トークンだけ。だから Android の `LinguaStore` の
答えは、`jws` の代わりに **`google: [{token, product}]`** ── 購入トークンと
商品 ID の組の一覧（`saw` など他は iPhone と同じ）。

1. **Kotlin**（`LinguaStorePlugin.kt`、`com.android.billingclient:billing:8.0.0`）:
   `products` は基本プランの値段、`buy` は obfuscatedAccountId に Supabase の
   uid を入れて買う（iOS の `appAccountToken` に当たる「誰の購入か」）。
   `current` と `restore` は Play が今持っている定期購入を組にする（Play には
   App Store のような「復元」の操作が無く、毎回そのまま読める）。`manage` は
   Google Play の定期購入のページを開き、戻った時に `linguastore` の知らせで
   画面が訊き直す。Play が後から言ったこと（保留が通った・更新）も同じ知らせ。
   **承認（acknowledge）は端末でしない** ── サーバーが uid を確かめてから。
2. **`www/store.js`**: `storeJws()` が `jws` か `google` を読む。どちらの電話かを
   区別するのはこの一か所。どちらも同じ `netPlanVerify()` の同じ配列で上がる。
3. **`supabase/functions/verify-plan`**: 配列の文字列は Apple（今まで通り）、
   `{token, product}` は Google（`google.mjs`）。secret
   `GOOGLE_PLAY_SERVICE_ACCOUNT` の鍵で `purchases.subscriptionsv2.get` を訊き、
   `obfuscatedExternalAccountId` が呼んだ人の uid と同じ時だけ数える。期限は
   Google の `expiryTime`。数えるのは ACTIVE・CANCELED（期限まで）・
   IN_GRACE_PERIOD。承認待ちなら、uid が一致した時だけここで承認する（三日
   以内にしないと Google が返金する）。行は `purchase` の今の形のまま ──
   `orig_tx` は `gp:` と購入トークン、`env` は `Google` か `GoogleTest`。
   呼び出しごとに、この uid の `gp:` の行でまだ数えているものを訊き直す
   （解約・返金は Google にだけ起き、端末からは送られてこない）。
   鍵が無い間は Google の組を一つも数えず、`left` にそう書く。
4. **商品 ID**: iPhone と同じ四つの名前 ── `com.tokinets.lingua.plus.monthly`・
   `.plus.yearly`・`.pro.monthly`・`.pro.yearly` ── を、**四つの別々の定期購入**
   にし、各々に**基本プランを一つ**置く（基本プランの ID はピリオドを使えない
   ので、例えば `monthly` / `yearly`）。`verify.mjs` の `PRODUCTS` は一つのまま
   両方の電話に効く。
5. **プランを変える時**: Play には App Store の「グループ」が無く、Plus を
   持ったまま Pro を買うと二つの定期購入・二重の請求になる。だから `buy` は
   持っている方を古い購入として渡し、残りの時間を差し引いてすぐ替える
   （WITH_TIME_PRORATION）。

**画面の言葉**: 「App Store に問い合わせ中…」「App Store につながりませんでした」
（`store.wait`・`store.fail`）は Android でもそのまま出る。言葉はオーナーのもの
で、`www/i18n/` はこの回が持っていない。

**すぐ知る道は入れていない**: Real-time developer notifications（Pub/Sub）。
解約・返金は、次にその人が起動した時（`verify-plan` が訊き直す時）に反映する。

### 画面にペンで書いたシート

iOS の `LinguaPdf.swift` の頭に理由が全部書いてある: 画面にペンで書いたものは
PDF の**注釈**として保存され、ページの本文だけを描く描き手では白紙に戻る。
Android 標準の PdfRenderer がそれで、四隅の印は見つかり、帯は読め、名前は二十
返り、枠は全部空になる ── 正しく見えて人の書いたものが抜けた答え。だから
Android では描かずに断り、画面は「読めませんでした」と言う。

写真で撮った・スキャンしたシートはここを通らない（`www/sheet.js` が PDF から
JPEG をそのまま取り出す）ので、紙を読むこと自体は Android でも動く。欠けて
いるのは画面に書いたシートだけ。

道は注釈まで描く PDFium の Android 版（Maven Central に `io.legere:pdfiumandroid`
2.0.3 がある）。ネイティブ込みでおよそ 10MB、Kotlin 2.4 で作られていてビルド
全体の Kotlin をそれに合わせる必要があり、この環境では確かめられないので、
入れるかどうかはリーダーの判断に残す。

### 通知

**Firebase Cloud Messaging**。iPhone と同じ五つと今日のお題が、同じ文で届き、押すと
同じ画面が開く（その投稿・通知タブ・タイムライン）。

- **端末**: `LinguaPushPlugin.kt` が `LinguaPush.swift` と同じ `ask` / `status` を
  答える。`ask` は Android 13 以降なら Android の許可の問い（POST_NOTIFICATIONS、
  manifest に書いてある）を出し、許されれば FCM の token を
  `{token, platform: 'android'}` で返す。二十秒で Google が答えなければ reject
  （iPhone と同じ）。`status` は `authorized` / `notDetermined`（Android 13 以降で
  まだ訊いていない）/ `denied`。**google-services.json が無ければ両方とも無いと
  答える**（FirebaseApp が無い）。ビルドは google-services.json 無しで通る
  （`build.gradle` はファイルがある時だけ Google サービスのプラグインを当てる）。
- **住所の行**: `www/push.js` が token と `platform` を `netDevicePut()` に渡し、
  `device` の行が `platform = 'android'` を持つ。iPhone は何も付けず、列の既定
  `ios` が答える。token の検査は電話ごと（`supabase/schema.sql` の
  `device_token_check`）。
- **押した通知**: アプリが閉じている・後ろにある時は Android が通知を出し、押すと
  `data` の `kind` と `post` が起動の intent に載る。`LinguaPushPlugin` がその二つ
  だけを取って `window.pushOpened()` に渡す（ページが読まれるまで持っておく ──
  `LinguaPush.swift` の `pending` と同じ）。アプリが前にある時は Firebase は何も
  出さないので、`android/app/src/main/java/com/tokinets/lingua/LinguaPushService.kt` が同じ文・同じ二つの鍵で出す（iPhone の
  前にある時のバナーと同じ）。チャンネルは `lingua`（push-send の `CHANNEL`、
  `push-check` が二つの名前を突き合わせる）。
- **サーバー**: `push-send` が `platform` で APNs と FCM HTTP v1 に分ける
  （`pushPlan()` 一つ ── 誰に・何を・ミュートは道を問わず同じ）。FCM の鍵
  （`FCM_SERVICE_ACCOUNT`）が無い間は Android の行にだけ送らず、iPhone は止めない。
  FCM が `404 UNREGISTERED` と答えた token の行だけを消す（DELETE REVIEW は
  `docs/CHANGELOG.md` 2026-09-27）。

## iOS と違うところ

- **共有シートが閉じてもファイルは消えない。** iOS は閉じた時に消す
  （「書き出したシートは渡したら端末に残さない」OWNER 2026-09-26）。Android
  では選ばれたアプリがファイルを読み終わる時を知る手段が無く、戻った時に消す
  と読みかけのものを消す。次の起動で `www/sheet.js` の `shDropOld()` が
  `dropOldSheets` を呼んで消す。Android が先にキャッシュを空けることもある。
  これで足りるかはオーナーのもの。
- **声が webm になりうる。** `voMime()` は `audio/mp4` を先に訊き、録れない
  WebView では `audio/webm;codecs=opus` を選んで `.webm` にする。Android の
  WebView がどちらを答えるかは版による ── 確かめていない。webm になった声を
  iPhone が鳴らせるかも確かめていない。
- **origin が違う。** Android は `https://localhost`、iOS は
  `capacitor://localhost`。`localStorage` は端末ごとの写しなので影響は無く、
  `www/` に origin を見る所は無い。

## キーボードで画面が縮むこと

iOS は `MainViewController.swift` の `keepStill()` で、ウェブビューの足を
キーボードの上端に合わせている。Android では:

- Android 15 未満: `android/app/src/main/AndroidManifest.xml` の `windowSoftInputMode="adjustResize"`
  で窓がキーボードの分だけ縮む。
- Android 15 以降（targetSdk 36 はすべて edge-to-edge で、adjustResize は縮め
  ない）: Capacitor 8 の SystemBars がウェブビューの親の下にキーボードの高さの
  余白を付ける。
- iOS の `bounces = false` に当たるオーバースクロールは止めている。
- iOS が消している「∧ ∨ ✓」の帯は、Android の WebView には無い。

**端末で見ていない。** 揺れないかは実機でしか分からない。

## サインイン

電話ごとに何をプラグイン（`@capgo/capacitor-social-login`）に渡すかは
`www/onboard.js` の `obSocialCfg()` 一つで、`obReady()`・`obSignInApple()`・
`obSignInGoogle()`・門のボタンがそれを訊く。どの電話かは
`Capacitor.getPlatform()` をそこでだけ訊く。

- **Google**: Android では webClientId（Web アプリケーションの OAuth
  クライアント ID）を渡す。Android 側は `iOSClientId` を読まない。値は
  `www/net.js` の `GOOGLE_WEB_ID`（`GOOGLE_IOS_ID` の隣、秘密ではない）。
  **今は空** ── 空の間、Android の Google は iPhone で `GOOGLE_IOS_ID` が
  空の時と同じく閉じていて、押すと「このビルドには無い」と言う。
- **Apple**: Android では渡さず、門にボタンを出さない。**Android に Apple の
  サインインを置くかはオーナーの決定待ち。** 置くなら Apple の Services ID と
  戻り先が要る ── Android のプラグインはこの二つが空だと `initialize` ごと
  断り、Google も道連れになる（前はそれで両方とも押して何も起きなかった）。
- **設定のアカウントの部屋**（`www/settings.js`）の Apple・Google の行は
  まだ電話を訊かず、Android でも Apple の行が出る（押すと「このビルドには
  無い」）。r122 の持ち物ではなかった。

**Android 用の OAuth クライアント ID はアプリに入らない。** Google Cloud に
パッケージ名と署名の SHA-1 で登録するだけで、アプリが渡すのは
webClientId。だから Secrets から置き換える値は無く、`capacitor.config.json`
も変えていない。

`scopes` を渡さない online の道なので、`MainActivity` の書き換えは要らない
（@capgo が要求するのは scopes か offline の時だけ）。nonce は Credential
Manager がそのまま id token に載せるので、`netNonce()` の組はそのまま効く。

## ビルド

`.github/workflows/android-build.yml`、**手で押すだけ**。

- 署名の鍵が Secrets にある時: AAB（Play に上げる形）と、同じ鍵の APK。
- 無い時: debug の鍵の APK だけ ── 手元の Android に入れて確かめるもの。
  署名の無い release の APK は端末に入らないので作らない。
- どちらも Artifacts に残る。Play への提出はしない。
- versionCode は run 番号、versionName は `package.json` の `version`
  （iOS と同じ一箇所）。

**`workflow_dispatch` は、そのファイルが既定のブランチに在る時だけ押せる。**
既定のブランチに入れば、どのブランチを選んでも押せる。

CI の debug の鍵は毎回作り直されるので、debug の APK では Google の
サインインは通らない（SHA-1 が毎回違う）。サインインを確かめるのは、
アップロード鍵で署名した APK で。

## オーナーがすること

1. **Google Play Console** のデベロッパーアカウントを作り、アプリを作る
   （パッケージ名 `com.tokinets.lingua`）。アプリ名と説明文はオーナーのもの。
2. **アップロード鍵**を作る（例:
   `keytool -genkeypair -v -keystore upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload`）。
   GitHub の Secrets に四つ入れる: `ANDROID_KEYSTORE_B64`（`base64 -w0 upload.jks`
   の出力）、`ANDROID_KEYSTORE_PASSWORD`、`ANDROID_KEY_ALIAS`、
   `ANDROID_KEY_PASSWORD`。鍵のファイルはリポジトリに入れない。失くすと
   同じアプリに上げられなくなるので、手元に保管する。
3. Play Console で **Play App Signing** を有効にする（初回の AAB を上げる時に
   求められる）。
4. **Google Cloud の OAuth クライアント**:
   - 種類「Android」を作る。パッケージ名 `com.tokinets.lingua`、SHA-1 は
     アップロード鍵のもの（`keytool -list -v -keystore upload.jks`）と、
     Play Console の「アプリの署名」にあるアプリ署名鍵のもの。二つとも。
   - 種類「ウェブ アプリケーション」のクライアント ID を用意する（Supabase の
     Google の設定に既にあればそれ）。これが webClientId になる。
     その値を `www/net.js` の `GOOGLE_WEB_ID = ''` の引用符の中に入れる
     （`<数字>-<英数字>.apps.googleusercontent.com`）。入れるまで Android の
     Google のボタンは閉じている。
   - Supabase の Authentication → Providers → Google の Client IDs に、
     その ウェブ のクライアント ID が入っていること（id token の audience に
     なる）。
5. **Play Console に定期購入を四つ作る**（収益化 → 定期購入）。商品 ID は
   `com.tokinets.lingua.plus.monthly`・`com.tokinets.lingua.plus.yearly`・
   `com.tokinets.lingua.pro.monthly`・`com.tokinets.lingua.pro.yearly`。各々に
   基本プランを一つ（自動更新、期間は月か年、ID は例えば `monthly` / `yearly`）、
   値段は iPhone と同じ。有効にする。定期購入はアプリを一度 Play に上げて
   （内部テストでよい）からでないと作れない。
6. **Google Play の購入を確かめる鍵**:
   - Google Cloud でプロジェクトを選び（無ければ作る）、**Google Play Android
     Developer API** を有効にする。
   - サービスアカウントを作り、**JSON 鍵**を作ってダウンロードする。
   - Play Console の「ユーザーと権限」でそのサービスアカウントのメールを招待し、
     このアプリに「財務データの表示」と「注文と定期購入の管理」を与える。
   - JSON 鍵の中身をまるごと GitHub の Secrets に `GOOGLE_PLAY_SERVICE_ACCOUNT`
     として入れ、Actions の Supabase Deploy を `verify-plan` で回す（その段が
     Supabase の secret に入れる）。鍵のファイルはリポジトリに入れない。
   - 試すのは Play Console の「ライセンス テスト」に入れた Google アカウントで。
7. **通知（Firebase）**（§ 通知。入れるまで Android は「無い」と答える）:
   - Firebase コンソールでプロジェクトを作る（Google Cloud の既存のプロジェクトに
     足してよい）。Android アプリを足す（パッケージ名 `com.tokinets.lingua`）。
   - **google-services.json** をダウンロードし、android/app/google-services.json
     に置いてコミットする（鍵ではなく、アプリがどのプロジェクトかを言うだけの
     ファイル）。`android/app/build.gradle` がそれを見て Google サービスの
     プラグインを当てる。
   - Firebase の「プロジェクトの設定 → サービス アカウント」で**新しい秘密鍵**
     （JSON）を作る。中身をまるごと GitHub の Secrets に `FCM_SERVICE_ACCOUNT`
     として入れ、Actions の Supabase Deploy を `push-send` で回す（その段が
     Supabase の secret に入れる）。鍵のファイルはリポジトリに入れない。
   - `device.platform` の列はサーバーにまだ無い（`supabase/schema.sql` を本番に
     流すのはリーダー）。列が無い間に Android から出た行は落ちる ── 流してから
     google-services.json を入れたビルドを出す。

## 端末で見ていないこと

すべて CODE CONFIRMED のみ。この環境には Android SDK も androidx も無く
（`dl.google.com` が 403）、gradle のビルドは CI が最初の確かめになる。
Kotlin は Robolectric の android-all と Capacitor の core を相手にコンパイル
して、android.* と Capacitor への呼び出しが通ることだけを見た。

実機で見るもの: ビルドが通るか、起動するか、キーボードで揺れないか、写真を
選ぶ・消すの一覧、写真ピッカー（一枚と四枚）、紙のシートの共有、声の録音と
再生（再生中に他のアプリの音楽が止まらないか ── WebView が音声の
フォーカスを取るかは見ていない）、設定を開く、評価のお願い（Play から入れた
アプリでしか出ない）。課金: 値段が出るか、買う・Plus から Pro に替える
（二重に請求されないか）・保留の購入・復元・定期購入のページから戻る、別の
Supabase アカウントでは付かないこと、三日後に返金されていないこと（承認が
効いたこと）。Play Billing は Google の Maven に届かずコンパイルしていない。
通知: 許可の問いが出るか（Android 13 以降）、token が `device` に `android` で
入るか、閉じている時・後ろにある時・前にある時の三つで届くか、押して開く画面、
ミュートした人から来ないこと、アプリを消した電話の行が消えること。
LinguaPushPlugin.kt と LinguaPushService.kt（`android/app/src/main/java/com/tokinets/lingua/`） は Firebase と androidx.core に
届かずコンパイルしていない（CI のビルドが最初）。
