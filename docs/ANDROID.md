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

Kotlin は `android/app/src/main/java/com/tokinets/lingua/` の五つのファイルと、
キーボードの `keyboard/`（下の § キーボード）。

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
| LinguaShare.write | できた。`keyboard.json`・`widget.json`・`LinguaScript.otf` をアプリの内部の `LinguaKeyboard/` に書く（iOS の App Group と同じ三つ・同じ名前）。空で渡された物は消す。下の § キーボード |
| LinguaShare.renderPdf | **無いと答える**（reject）。下の § 画面にペンで書いたシート |
| LinguaStore.products | Google Play Billing の値段（基本プランの formattedPrice）。Play Console に商品が無い間は**空の一覧**で、画面は「まだ販売されていません」 |
| LinguaStore.current / buy / restore / manage | Google Play Billing。答えは `google: [{token, product}]`（下の § 課金）。Play ストアの無い端末は `no store` で、`current` の reject は `netPlanVerify([])` に落ち、サーバーがこのアカウントの plan を答えるので、iPhone で買った plan は Android でもそのまま |
| LinguaPush.ask / status | Firebase Cloud Messaging（下の § 通知）。android/app/google-services.json が無い間は**無いと答える**（reject）。`denied` は返さない ── `www/push.js` はそれを「通知は…設定でオフになっています」と描いて設定へ誘い、無い物について偽の文になる。reject なら画面はブラウザと同じ描き方（スイッチだけ） |

**課金は Google Play Billing を直接つなぐ**（RevenueCat は使わない）、値段は
iPhone と同じ（`docs/FEATURE_RULES.md` 2026-09-27）。コードはできていて、
Play Console の商品とサービスアカウントの鍵を待っている（下の § オーナーが
すること）。**通知**も Firebase Cloud Messaging でコードはできていて、Firebase の
プロジェクトと二つの鍵を待っている（下の § 通知）。キーボード（Android の IME）は
下の § キーボード。ウィジェットは次の回（`widget.json` は書いているが、読む物がまだ無い）。

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

## キーボード

`ios/App/LinguaKeyboard/` の Android 版。Android では入力方法（IME）で、
`keyboard/LinguaIme.kt` が InputMethodService。manifest に
入力方法のサービスと `res/xml/method.xml`。Swift と同じ名前の
六つ（`LinguaIme` が `KeyboardViewController` の分）:
`Shared`・`KeyBoardView`・`Compose`・`CandidateBar`・`GlyphView`・`HandPad`。

- **読む物**: `LinguaShare.write` が書いた三つ。同じアプリの中なので App Group
  の代わりは要らない。キーボードは読むだけで、開くたびに読み直す
  （入力が始まるたび）。**言語の写しで、言語の在りかではない**。
- **数**: 横十（`halfCols` = `KB_COLS`）、行の高さは画面の短い辺の 0.1385、
  全体は画面の半分まで、帯 44、両端 8、短い行は `kbStart()` の所。
  `kb-check` が Kotlin から読んで Swift と `www/keyboard.js` に突き合わせる
  （書き写さない）。
- **描いた字**: iPhone と同じ私用領域の文字を入れ、`LinguaScript.otf` で描く。
- **変換・候補・はじき**: `Compose.kt`・`CandidateBar.kt` が Swift と同じ表
  （`shareKbd()` の `conv`）を読む。
- **手書き**: `hand.js` は iOS のファイルそのもの ── `build.gradle` がビルドの
  時に assets に写し、画面に出さない WebView で走らせる。「どの字が近いか」を
  Kotlin で書き直さない（二つの答えになる）。
- **地球儀**: 電話が次のキーボードへの切り替えを持っていない時は落とす。

使う人がすること: 設定 → システム → キーボード（端末で名前が違う）で
「Lingua」をオンにして選ぶ。

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
  オーナーにターミナルは無いので、ビルドの時に Secret GOOGLE_WEB_CLIENT_ID
  から置き換える形を r134（claude/r134-android-build）が作っている ── まだ
  integ-0905 に入っていない。
- **Apple**: Android では渡さず、門にボタンを出さない。**Android に Apple の
  サインインは置かない**（オーナー 2026-09-29「おかない！」）。Android の
  プラグインは Apple の Services ID と戻り先が空だと `initialize` ごと断り、
  Google も道連れになる（前はそれで両方とも押して何も起きなかった）ので、
  渡さないのがそのまま答え。
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

r134 の枝に、鍵を Actions で作る android-keygen.yml と、組んだ AAB を Play に
上げる android-release.yml、鍵が無くても署名なしの AAB を組む変更がある ── まだ
integ-0905 に入っていない。下の § オーナーがすること はそれが入った形で書いてある。

**`workflow_dispatch` は、そのファイルが既定のブランチに在る時だけ押せる。**
既定のブランチに入れば、どのブランチを選んでも押せる。

CI の debug の鍵は毎回作り直されるので、debug の APK では Google の
サインインは通らない（SHA-1 が毎回違う）。サインインを確かめるのは、
アップロード鍵で署名した APK で。

## Play の掲載の文

`store-play/<Play の言語コード>.json` の 10 言語（`store/` の iOS の 10 と同じ言語）。
欄は三つ: `title`（30 字まで）・`shortDescription`（80 字まで）・`fullDescription`
（4000 字まで）。

- `title` と `fullDescription` は iOS の `name` と `description` のまま。iOS の
  説明文には App Store・iPhone・ウィジェットなど Android に無い物の名前が元から
  一つも無く、書いてある機能（自分の文字・フォント・キーボード・辞書・文法・
  タイムライン・写真・声・カード・課金）は全部 Android のコードに在る。
- `shortDescription` は iOS の `promotionalText` を 80 字に縮めた物。日・韓・中は
  そのまま収まり、欧文の 7 言語は後ろ半分（「誰でも読めるタイムラインで」）を落とした。
- **文はオーナーのもの** ── これは案。直すなら `store-play/` の JSON を直す。

`tools/play-listing.mjs` が見る物（一つでも外れたら何も送らない）: 10 言語が揃って
いる・三つの欄だけ・長さ・制御文字（説明の改行は可）・絵文字・`<` と `>`（Play は
説明を HTML として読む）・前後の空白・アプリ名の宣伝の語（free・best・top・#1・new
など）・Android に無い物の名前（iPhone・iOS・App Store・Apple・ウィジェット など）。
`--dry` は鍵なしで見るだけ。Actions の **Play Listing** を押すと入る（「見るだけ」に
チェックで鍵なし）。鍵が無ければ何をすべきかを言って止まる。

## スクリーンショット

Play の決まり（電話）:

| 物 | 決まり |
|---|---|
| 電話のスクショ | 2〜8 枚。JPEG か透過の無い PNG、一枚 8MB まで、辺は 320〜3840 px、長辺は短辺の 2 倍まで。おすすめに載るには 1080 px 以上・9:16 が 4 枚以上 |
| アイコン | 512 × 512 の PNG（32 ビット）、1MB まで。iOS の 1024 の絵（`ios/App/App/Assets.xcassets/AppIcon.appiconset/`）を縮めればよい |
| フィーチャー グラフィック | 1024 × 500 の JPEG か透過の無い PNG。**必須**。Play の頁の上に出る横長の絵で、iOS には無い ── 作るのはオーナー |
| タブレット（7 インチ・10 インチ） | 任意。無ければタブレット向けとしては出ない |

言語ごとに別の絵を置ける。置かない言語には既定の言語の絵が出る。

撮り方: `tools/shot.mjs --play` が Play の枠（1080 × 1920、9:16、一画面、JPEG）で
撮る。`tools/play-shots.mjs` がそれを 10 言語で回して `shots/play/<Play の言語>/` に
番号順に並べ、一枚ずつ大きさを見る。オーナーは Actions の **Play Shots** を押し、
Artifacts の zip を落とす（画面の名前と言語を一つに絞れる）。

**中身は検査用の fixture**（`tools/fixture.mjs` の六語・三文字・「未送信」の投稿）で、
ストアに出す絵ではない。何の画面を何枚、どんな言語を作った状態で見せるかは
オーナーのもの。決まれば、その状態を fixture の一つの面として足して撮る。

## Play Console で手で答える物（答えの案）

どれも**案**で、答えるのはオーナー。Play Console → アプリ → 「アプリのコンテンツ」
（ポリシー → アプリのコンテンツ）に並ぶ。

### プライバシー ポリシー

`https://tokinets.com/lingua/privacy.html`（iOS と同じ、`store/*.json` の
`privacyPolicyUrl`）。

### アプリのアクセス

「一部またはすべての機能が制限されている」。サインインしないと何も見えないので、
審査用のアカウントを渡す: **iOS の審査に渡したのと同じメールとパスワード**
（`docs/apple.md` § 審査ノート）。**ここにもリポジトリにも書かない** ── Play Console
の欄に直接入れる。入り方の一行（案）:

> Open the app, walk through the short introduction, and at the last step choose
> "Sign in with email" and use the account below.

### 広告

「いいえ、広告は含まれていません」。Lingua は広告を出さない（`docs/apple.md` § 9）。
**広告 ID** の申告も「いいえ」（広告 ID を使う物は無い）。ただ、依存が
AD_ID の権限を manifest に足すかは**確かめていない** ── CI が組んだ AAB の manifest
に com.google.android.gms.permission.AD_ID が無いことを見てから答える。

### コンテンツのレーティング（IARC の質問票）

- カテゴリ: 「ソーシャル ネットワーキング、フォーラム、ブログ、UGC 共有」
  （人が書いた物を他の人が読むのが中心）。
- 暴力・恐怖・性的な内容・下品な言葉・薬物・アルコール・たばこ・ギャンブル・
  差別的な表現: **いいえ**（アプリが用意する内容として。人が書く物は下の UGC で答える）。
- ユーザー同士がやり取りする・内容を共有する: **はい**（投稿・返信・写真・声）。
- ユーザーの現在地を他の人に見せる: **いいえ**（プロフィールの「場所」は人が打つ
  文字で、端末の位置は読まない）。
- デジタル商品の購入: **はい**（Plus・Pro の定期購入）。
- ウェブ ブラウザや検索エンジンか: **いいえ**。
- UGC の扱い（問われたら）: 投稿と人を通報できる（`report`）、ブロック・ミュート
  できる、通報は運営が見て投稿を隠す（`www/mod.js`）。

出た値は Play が決める。対象年齢（次）とは別の物で、レーティングが低く出ても
規約の 13 歳以上と食い違いではない。

### 対象年齢と内容

**13〜15・16〜17・18 以上**（規約は 13 歳以上 ── `docs/apple.md` の「13さん以上だね。
snsって基本そうやん」OWNER 2026-08-28）。13 歳未満は選ばない。「子どもの興味を引く
か」は「いいえ」（案）。13 歳未満を選ばない限りファミリー ポリシーの対象にならない。

### ニュース・金融・健康・政府

どれも「いいえ」。

### データ セーフティ

`www/net.js` が送っている先（`rest/v1/…`・`storage/v1/object/post-media`・
`functions/v1/verify-plan`・`auth/v1/…`）と `supabase/schema.sql` の表から数えた。
分析・広告・クラッシュ収集の SDK は無い（`www/` にも `android/app/build.gradle`
にも無い）。

- **集める**: はい。**共有する**: いいえ ── Supabase（サーバー）・Google の Firebase
  （通知）と Play（課金）は Lingua の代わりに処理する業者で、Play の定義で
  「共有」に入らない。投稿が他の人に見えるのは本人が投稿した時で、これも入らない。
- **送る時に暗号化**: はい（全部 HTTPS）。
- **消してもらえる**: はい ── アプリの 設定 → アカウントを削除 で、言語・投稿・
  写真・声・プロフィールが消える（`profile` から `on delete cascade`）。通報と
  ご意見は書いた人の欄が空になって残る（`report.actor`・`feedback.author` は
  `on delete set null`）。Play は**アプリの外から削除を頼めるウェブの
  URL** も求める（下の「足りない物」）。

| Play の種類 | 何か（どこに） | 必須か | 目的 |
|---|---|---|---|
| 個人情報 → メールアドレス | サインイン（Supabase Auth） | 必須 | アプリの機能・アカウント管理 |
| 個人情報 → 名前 | 表示名とハンドル（`profile.display`・`handle`） | 必須 | アプリの機能・アカウント管理 |
| 個人情報 → ユーザー ID | アカウントの uid | 必須 | アプリの機能・アカウント管理 |
| 個人情報 → その他の情報 | 自己紹介・場所・リンク（`profile.bio`・`loc`・`link`、人が打つ文字） | 任意 | アプリの機能 |
| 財務情報 → 購入履歴 | 定期購入（`purchase`、購入トークンと商品 ID と期限） | 任意 | アプリの機能 |
| 写真と動画 → 写真 | 投稿の写真・プロフィールの写真（`post-media`、`profile.av`） | 任意 | アプリの機能 |
| 音声 → 音声録音 | 投稿の 30 秒の声（`post-media`） | 任意 | アプリの機能 |
| アプリのアクティビティ → その他のユーザー作成コンテンツ | 作った言語（`language`・`slice`）・投稿・下書き・通報・ご意見（`post`・`draft`・`report`・`feedback`） | 必須（言語は最初に作る） | アプリの機能 |
| アプリのアクティビティ → アプリ内検索履歴 | 最近の検索・保存した検索（`recent_search`・`saved_search`） | 任意 | アプリの機能 |
| アプリのアクティビティ → その他の操作 | いいね・リポスト・フォロー・ブロック・ミュート | 任意 | アプリの機能 |
| デバイスまたはその他の ID | 通知の宛先の token（`device`） | 任意（通知を許した時だけ） | アプリの機能 |

集めない: 位置情報・連絡先・カレンダー（アプリの暦は言語の中身）・メッセージ
（DM は無い）・健康・ファイル（CSV と紙のシートは端末の中で読み、残るのは言語の
中身として上）・ウェブ閲覧・アプリの情報とパフォーマンス（クラッシュ・診断）。

### 足りない物（オーナーが決める）

- **アカウント削除のウェブの URL**。Play はデータ セーフティにこれを求め、無いと
  出せない。privacy.html に「アプリの 設定 → アカウントを削除、またはメールで
  頼む」節があればその URL（`#` 付き）でよい。無ければ一枚の頁が要る。
  tokinets.com はこのリポジトリの外。
- **アプリのカテゴリ**（ストアの設定）。

決まった物（2026-09-29、`docs/FEATURE_RULES.md` § Owner decision log）: アカウントは
**個人**（手順 12 のクローズド テストが要る）、連絡先のメールは `Lingua@tokinets.com`、
Android に Apple のサインインは**置かない**。

## オーナーがすること

上から順に。**(r134)** の付いた workflow は claude/r134-android-build の枝にあり、
integ-0905 に入ってから押せる（`workflow_dispatch` は既定のブランチに在る物だけ）。
Secret は GitHub の Settings → Secrets and variables → Actions に入れる。

1. **Play Console のデベロッパー アカウント**を作る（登録料 25 ドル、本人確認）。
   **個人のアカウントか組織のアカウントか**で後が変わる ── 2023 年 11 月以降に
   作った個人のアカウントは、本番に出す前に**クローズド テストを 12 人以上で
   14 日間続ける**ことを Play が求める（手順 12）。組織（会社）なら要らないが、
   D-U-N-S 番号が要る。
2. **アプリを作る**: アプリ名 `Lingua — Conlang Builder`、既定の言語、「アプリ」、
   「無料」（定期購入は無料のアプリに付ける。無料を後から有料には変えられない）。
   パッケージ名は最初の AAB を上げた時に `com.tokinets.lingua` に決まる。
3. **アップロード鍵**: Actions の android-keygen.yml **(r134)** を押し、その
   workflow が言うとおりに Secrets に四つ入れる: `ANDROID_KEYSTORE_B64`・
   `ANDROID_KEYSTORE_PASSWORD`・`ANDROID_KEY_ALIAS`・`ANDROID_KEY_PASSWORD`。
   鍵を失くすと同じアプリに上げられなくなるので、手元にも保管する。
4. **Firebase（通知）**（§ 通知。入れるまで Android は「無い」と答える）:
   - Firebase コンソールでプロジェクトを作り（Google Cloud の既存のプロジェクトに
     足してよい）、Android アプリを足す（パッケージ名 `com.tokinets.lingua`）。
   - **google-services.json** をダウンロードし、GitHub の画面で `android/app/` に
     アップロードする（Add file → Upload files。鍵ではなく、どのプロジェクトかを
     言うだけのファイル）。
   - 「プロジェクトの設定 → サービス アカウント」で**新しい秘密鍵**（JSON）を作り、
     中身をまるごと Secret `FCM_SERVICE_ACCOUNT` に入れ、Actions の Supabase Deploy
     を `push-send` で回す。
   - `device.platform` の列は 2026-09-29 に本番に入っている。
5. **Google のサインイン**（Google Cloud → API とサービス → 認証情報）:
   - 種類「ウェブ アプリケーション」の OAuth クライアント ID（Supabase の
     Authentication → Providers → Google の Client IDs に入っている物）を、
     Secret GOOGLE_WEB_CLIENT_ID **(r134)** に入れる。ビルドの時に `GOOGLE_WEB_ID`
     に入る。入るまで Android の Google のボタンは閉じている。
   - 種類「Android」を作る: パッケージ名 `com.tokinets.lingua`、SHA-1 はアップロード
     鍵の物（android-keygen.yml **(r134)** が出す）。アプリ署名鍵の SHA-1 は手順 7 の
     後に Play Console の「アプリの署名」に出るので、それでもう一つ作る。
6. **組む**: Actions の **Android build** を押し、Artifacts から AAB を落とす。
7. **最初の AAB を手で上げる**: Play Console → テスト → 内部テスト → 新しい
   リリース に落とした AAB を上げる。この時 **Play App Signing** を有効にする。
   Play は最初の一つを画面から上げるまで API を開かない（手順 8 以降の道具は
   それから動く）。テスターのメール（自分）を足す。
8. **Play の鍵（サービス アカウント）**:
   - Google Cloud で **Google Play Android Developer API** を有効にし、サービス
     アカウントを作り、**JSON 鍵**を作る。
   - Play Console の「ユーザーと権限」でそのメールを招待し、このアプリに:
     「財務データの表示」「注文と定期購入の管理」（課金の確認）、「ストアの掲載情報の
     管理」（Play Listing）、「テストトラックへのリリース」「製品版へのリリース」
     （android-release.yml **(r134)**）。
   - 中身をまるごと Secret `GOOGLE_PLAY_SERVICE_ACCOUNT` に入れ、Actions の Supabase
     Deploy を `verify-plan` で回す。
9. **定期購入を四つ**（収益化 → 定期購入）: 商品 ID `com.tokinets.lingua.plus.monthly`・
   `com.tokinets.lingua.plus.yearly`・`com.tokinets.lingua.pro.monthly`・
   `com.tokinets.lingua.pro.yearly`。各々に基本プランを一つ（自動更新、月か年、
   ID は例えば `monthly` / `yearly`）、値段は iPhone と同じ。有効にする。
   試すのは「ライセンス テスト」に入れた Google アカウントで。
10. **ストアの掲載**: `store-play/` の文を読んで直し、Actions の **Play Listing** を
    「見るだけ」で押し、緑なら普通に押す。アイコン（512）・フィーチャー グラフィック
    （1024 × 500）・スクショを Play Console に上げる（§ スクリーンショット。どの画面を
    見せるか決まったら **Play Shots** で撮る）。カテゴリと連絡先のメールも。
11. **アプリのコンテンツ**: § Play Console で手で答える物 の案で答える。アカウント
    削除の URL を用意する。
12. **クローズド テスト**（手順 1 で個人のアカウントの時だけ）: クローズド テストの
    トラックに同じ AAB を出し、12 人以上に入ってもらい 14 日間続ける。その後
    Play Console から本番へのアクセスを申し込む。
13. **本番**: android-release.yml **(r134)** で製品版のトラックに上げる（または
    Play Console で内部テストのリリースを製品版へ昇格）、審査に出す。
14. 実機で見る物は下の § 端末で見ていないこと。

## 端末で見ていないこと

すべて CODE CONFIRMED のみ。この環境には Android SDK も androidx も無く
（`dl.google.com` が 403）、gradle のビルドは CI が最初の確かめになる。
Kotlin は Robolectric の android-all と Capacitor の core を相手にコンパイル
して、android.* と Capacitor への呼び出しが通ることだけを見た。

実機で見るもの: ビルドが通るか、起動するか、キーボードで揺れないか、写真を
選ぶ・消すの一覧、写真ピッカー（一枚と四枚）、紙のシートの共有、声の録音と
再生（再生中に他のアプリの音楽が止まらないか ── WebView が音声の
フォーカスを取るかは見ていない）、設定を開く、評価のお願い（Play から入れた
アプリでしか出ない）。キーボード: 設定に「Lingua」が出るか、行の数と高さが iPhone と
同じか、描いた字が入って描かれるか、変換の帯・はじき・手書き（hand.js が assets
に入っているか）、地球儀と次のキーボード、サインアウトで前の人の字が消えるか。
課金: 値段が出るか、買う・Plus から Pro に替える
（二重に請求されないか）・保留の購入・復元・定期購入のページから戻る、別の
Supabase アカウントでは付かないこと、三日後に返金されていないこと（承認が
効いたこと）。Play Billing は Google の Maven に届かずコンパイルしていない。
通知: 許可の問いが出るか（Android 13 以降）、token が `device` に `android` で
入るか、閉じている時・後ろにある時・前にある時の三つで届くか、押して開く画面、
ミュートした人から来ないこと、アプリを消した電話の行が消えること。
LinguaPushPlugin.kt と LinguaPushService.kt（`android/app/src/main/java/com/tokinets/lingua/`） は Firebase と androidx.core に
届かずコンパイルしていない（CI のビルドが最初）。
