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

Kotlin は `android/app/src/main/java/com/tokinets/lingua/` の四つのファイル。

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
| LinguaStore.products | **空の一覧**。画面は「まだ販売されていません」── Android では事実 |
| LinguaStore.current / buy / restore / manage | **無いと答える**（`no store`）。`current` の reject は `netPlanVerify([])` に落ち、サーバーがこのアカウントの plan を答えるので、iPhone で買った plan は Android でもそのまま |
| LinguaPush.ask / status | **無いと答える**（reject）。`denied` は返さない ── `www/push.js` はそれを「通知は…設定でオフになっています」と描いて設定へ誘い、Android では偽の文になる。reject なら画面はブラウザと同じ描き方（スイッチだけ） |

**課金は決まっていて、まだ作っていない**: Google Play の課金を直接つなぐ
（RevenueCat は使わない）、値段は iPhone と同じ（`docs/FEATURE_RULES.md`
2026-09-27）。Kotlin の課金と、`verify-plan` が Google Play の購入を確かめる
ことは別の回。**待っているもの**（オーナーの決定）: 通知の仕組み（Firebase
Cloud Messaging と `push-send` の Android 対応）。キーボード（Android の IME）と
ウィジェットは次の回。

### 課金 ── Play Billing をこの回で書かなかった理由と、要る変更

リーダーから「Play Billing のライブラリを入れて、iOS と同じ答えの形で書ける
所まで書いてよい」と来たが、書いていない。

- **同じ答えの形が無い。** iOS の道はすべて `jws`（Apple が署名した取引）を
  答え、`verify-plan` はその署名を Apple の根で確かめる。Google Play には
  端末が受け取る署名つきの取引が無い。サーバーが要るのは購入トークンと
  商品 ID で、サーバーが Google Play Developer API に訊いて確かめる。
  トークンを `jws` に入れれば `verify-plan` は Apple の署名として読み、断る。
- 答えの形は決定が「課金のセッションで決める前に報告」としている。ここで
  書けば、決める前に形を決めることになる。
- この環境では Play Billing をコンパイルできず（Google の Maven に届かない）、
  商品が無いので書いても走らない。

要る変更（`www/` と `supabase/` は持っていないので、ここは列挙だけ）:

1. **Kotlin**: Play Billing で buy / restore / current を作る。買う時に
   obfuscatedAccountId を Supabase の uid にする ── iOS の `appAccountToken`
   に当たる「誰の購入か」。答えは購入トークンと商品 ID の組の一覧。
2. **`www/store.js`**: `storeJws()` の代わりに Google の組を読み、
   `netPlanVerify()` に渡す。どちらの電話かを画面が区別するのはこの一か所。
3. **`supabase/functions/verify-plan`**: Google の組を受け、サービス
   アカウントで purchases.subscriptionsv2.get を訊く。
   obfuscatedExternalAccountId が呼んだ人の uid と同じ時だけ数える。期限は
   Google の答えから取り、購入の承認（acknowledge、三日以内）もここでする。
   更新・解約をすぐ知るなら Real-time developer notifications（Pub/Sub）。
4. **商品 ID**: iOS と同じ名前（`com.tokinets.lingua.plus.monthly` など四つ）は、
   Play の定期購入の ID として使える。Play の基本プラン（base plan）の ID は
   ピリオドを使えないので、四つを別々の定期購入にして各々に基本プランを一つ
   置く形になる。もう一つの形は、plus と pro の二つの定期購入に monthly・
   yearly の基本プランを置くもの。どちらにするかは課金の回のもの。
5. **オーナー**: Play Console に商品を作る。Google Cloud のサービスアカウントを
   Play Console に招待し、その鍵を Supabase の secrets に入れる。

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
5. Play Console に定期購入の商品を作る（課金は Google Play 直結・値段は
   iPhone と同じ、と決まっている。商品 ID の形は課金の回で報告する）。
6. 通知を Android でどうするかを決める（それまで「無い」と答えている）。
   通知に Firebase を使うなら、Firebase のプロジェクトと
   google-services.json（`android/app/` に置くと
   `android/app/build.gradle` が Google サービスのプラグインを当てる）。

## 端末で見ていないこと

すべて CODE CONFIRMED のみ。この環境には Android SDK も androidx も無く
（`dl.google.com` が 403）、gradle のビルドは CI が最初の確かめになる。
Kotlin は Robolectric の android-all と Capacitor の core を相手にコンパイル
して、android.* と Capacitor への呼び出しが通ることだけを見た。

実機で見るもの: ビルドが通るか、起動するか、キーボードで揺れないか、写真を
選ぶ・消すの一覧、写真ピッカー（一枚と四枚）、紙のシートの共有、声の録音と
再生（再生中に他のアプリの音楽が止まらないか ── WebView が音声の
フォーカスを取るかは見ていない）、設定を開く、評価のお願い（Play から入れた
アプリでしか出ない）。
