# r55 ── 広告（タイムラインの PR 枠）

- 日付: 2026-09-23
- 枝: `claude/r55-ads`（`integ-0905` から。途中で `integ-0905` を取り込み済み）
- 仕様（OWNER 2026-09-23）：「広告の形は、Twitterと同じ。ツイート擬態右上にprとつく。
  広告枠が売れる形にする。今は売る人いないからadmobを流す。proのみ表示なし。」
  「10で。少ない時は出さない！」
- 土台：オーナーの別アプリ jpel（`natsuaya82-crypto/JJJJ`）の AdMob の入れ方 ──
  Teen までの広告、ATT は未回答の時だけ、買った人には表示の直前で出さない。

## 触ってよいもの（leader が名指し）

`www/sns.js`、`www/post.js`（投稿の頭の PR だけ）、`www/core.js`（`CAN` の一行だけ）、
`www/net.js`（広告を取る）、`www/index.html`（PR と広告の行の CSS だけ）、
`www/i18n/*.js`（PR の鍵）、`supabase/schema.sql`、`tools/rls-check.mjs`、
`tools/fixture.mjs`、`ios/App/App/Info.plist`、`ios/App/App/LinguaAds.swift`、
`ios/App/App/MainViewController.swift`（登録の一行）、`ios/App/App.xcodeproj/project.pbxproj`
（Sources）、`ios/App/Podfile`、`.github/workflows/ios-deploy.yml`（ID の差し込み）、
`docs/FEATURE_RULES.md`、`docs/CHANGELOG.md`、`docs/PAID_FEATURES.md`、`docs/apple.md`、
`docs/BACKLOG.md`（UMP の一行）、この文書。

## 触らないもの

r52 の領分 ── `www/core.js` の capOK・語数、`www/wordsheet.js`、`www/share.js`、`www/card.js`。
`www/glyph.js`（`renderMount`）と `tools/dead-check.mjs` にも触らない（下の「作り方」の 4）。

## 同じファイルにいる他の枝

`git log --all` で見えたもの: `www/sns.js` `www/net.js` に r48・r51・r53、
`www/post.js` に r53・r54、`supabase/schema.sql` に r47・r51・r53、
`tools/fixture.mjs` に r54。統合は leader。

## 何を作るか

- ホームのタイムラインで、投稿 10 件ごとに一つ枠（`PROMO_EVERY`、10 件に届かなければ無い）。
- 枠 k は、宣伝の投稿（`promo`）があればそれ、無ければ AdMob。
- 宣伝の投稿は `postRow()` がほかの投稿と同じに描き、右上に `PR`。
- AdMob の枠は、投稿の形をしたネイティブの行（顔・名前・広告主・右上に `PR`・本文・
  画像か動画・行動の言葉）。**動画あり**（`MediaView`、音は消して始まる）。
- pro（`can('noads')`）には枠が一つも無く、AdMob も呼ばない。

## 作り方 ── 測って決めたこと

**問題**：タイムラインは WKWebView の中の HTML。AdMob のネイティブ広告は Google の
view（`NativeAdView`・`MediaView`）で描かないといけない ── 見出しや画像を取り出して
HTML で描くのはネイティブ広告の規約違反（表示と押された数を数えるのが view だから）。
`@capacitor-community/admob`（jpel が使う物）はバナー・全画面・リワードだけで、
列の中のネイティブ広告は出せない。「WebView API for Ads」は AdMob の広告を WebView に
出す物ではなく、ウェブ用の広告タグ（AdSense・Ad Manager）向け。

**だから**：HTML には空の行（`.padm`、広告と同じ高さ）を置き、ネイティブの広告を
その上に重ねる。どう重ねるかは、ブラウザでタイムラインを動かして測って決めた：

1. **スクロールするのはページそのもの**（`window.scrollY` が 800 動くと投稿も 800 動く。
   中でスクロールする要素は無い）。iOS ではこれは WKWebView 自身の `scrollView`。
   → 広告は `scrollView` の**中**の箱（`AdBox`）に置く。
   - 指が広告の上から始まっても、タイムラインはそのままスクロールする（`scrollView` の
     指の認識は子の view の上でも働く）。
   - 箱は `contentOffset` が変わるたびに、見えている範囲へ動かす（KVO）。UIKit のスクロールと
     同じコマで動くので、HTML とずれない。**JS はスクロール中に何もしない** ── 行の位置は
     ページの座標で渡すので、スクロールでは変わらない。
2. **上のバーは `sticky`、下のタブと ＋ は `fixed`**（`.navtop`、`.tabbar`、`.fab`）。
   ネイティブの view は HTML より上に描かれるので、そのままだと広告がバーやタブの上に出る。
   → **アプリが画面に固定している物は、箱から切り抜く**（描くのも、押すのも）。
   どれを切るかは名前で並べず、**body の子とバーのうち、fixed か sticky で、見えている物
   全部**を毎回数える（`admCover()`）。明日足された固定の物も、その日から切り抜かれる。
   画面全体を覆う物（シートの背景・問い・回る印）が出ている間は、広告を隠す。
3. 広告の高さはネイティブが組んで答え（`load` → `h`）、JS は空の行をその高さにする。
   答えが来るまで・広告が来なかった時は、行は高さ 0 で線も無い（何も無い）。
4. ページが動いたこと（描き直し、シートやトーストの出入り、回転）は、広告が出ている間
   **毎コマ一度訊いて、変わった時だけ**ネイティブに渡す。`MutationObserver` は
   `dead-check` の知らない名前で、描き直しの後の一箇所（`www/glyph.js` の `renderMount`）
   は持ち場の外なので、使わなかった。

**最終防衛線**：`place` は毎回 `on: !can('noads')` を持って行き、ネイティブは `on:false`
なら何かを描く前に全部の広告を捨てる（jpel の `adsDisabled` を表示の直前で見る形）。
JS 側も `can('noads')` を呼ぶたびに訊き、pro なら `drop` する。

**設定**（jpel と同じ）：
- 出す広告は **Teen まで**（`GADMaxAdContentRating.teen`）。
- **ATT**：`start` の中で、誰もまだ答えていない（`notDetermined`）時だけ訊く。断っても
  広告は出る（追跡で選ばない広告になる）。**これは iOS 自身が出す許可の画面で、
  `CLAUDE.md` の禁止（`www/` の `confirm()` `alert()` `prompt()`）とは別物。**
- **UMP（ヨーロッパの同意画面）は入れない** ── jpel に無い。`docs/BACKLOG.md` に一行。
- AdChoices の印（Google が付ける）は右下。PR が右上なので重ならない。

**SDK**：`Google-Mobile-Ads-SDK` 13.6.0（jpel の `@capacitor-community/admob` 8 が固定する版）。
この app は CocoaPods で組んでいて CI が `pod install` を回すので、`Podfile` に一行。
（leader は SPM と言ったが、このプロジェクトの依存の入れ方は Pods なので、それに合わせた。）
Swift の名前は v12 以降の物（`AdLoader`・`NativeAdView`・`MediaView`・`MobileAds.shared`）で、
Google の公式サンプル（googleads-mobile-ios-examples、2026-09-22）と
`@capacitor-community/admob` の iOS のコードで確かめた。**この Linux ではコンパイルしていない。**
`LinguaAds.swift` の Google の名前は全部照らした（2026-09-23）── `MobileAds.shared`・
`requestConfiguration.maxAdContentRating`・`start(completionHandler:)`・`VideoOptions.shouldStartMuted`・
`NativeAdViewAdOptions.preferredAdChoicesPosition`（`.bottomRightCorner`）・
`AdLoader(adUnitID:rootViewController:adTypes:[.native]:options:)`・`Request()`・`NativeAdLoaderDelegate`
（`didReceive nativeAd: NativeAd`／`didFailToReceiveAdWithError`）・`NativeAd`・`NativeAdView` と
その `iconView` `headlineView` `advertiserView` `bodyView` `mediaView` `callToActionView` `nativeAd`・
`MediaView`・`mediaContent.aspectRatio`・`icon?.image`。どれも公式サンプルか 13.6.0 のプラグインに同じ形で在る。
`GAD` の付いた名前は残っていない ── Teen は型に頼る `= .teen` と書く（接頭辞付きの型名は書かない）。
SDK のヘッダそのもの（dl.google.com）はこの環境の網で断られて読めていない。

**ID**：`Info.plist` に `__ADMOB_APP_ID__`（`GADApplicationIdentifier`）と
`__ADMOB_NATIVE_UNIT__`（`LinguaAdUnit`）。`ios-deploy.yml` が GitHub の Secret
`ADMOB_APP_ID` / `ADMOB_NATIVE_UNIT` から入れ、Secret が無い間は Google の**テスト用 ID**
を入れる。オーナーのアカウントは `pub-2442181569589497`。手順は `docs/apple.md` § 9。

## 表示の言葉

右上は `PR`（オーナーの言葉のまま）。日本のステマ規制は「PR」で足りる。Google の
ネイティブ広告の規約は「広告」「Ad」「Sponsored」の印を求めていて、「PR」でそれを
満たすかはこちらで確かめられていない ── 審査で言われたら、`post.pr` の文字を変える
だけで済む形にしてある（AdMob の行の印は JS が `t('post.pr')` を渡している）。

## 分かっている制限

- **宣伝の投稿（PR の行）でいいね・リポスト・返信を押しても、その場では何も起きない。**
  `postLike()` などは `postById()` で `POSTS` の中だけを探し、宣伝の投稿は `POSTS` に
  入れていないため。行をタップしてスレッドを開けば押せる。直すのは `post.js` の持ち場の外。
- スレッドを開いた後は、その投稿が普通の投稿として「おすすめ」にも出る。
- 引っ張って更新している間は、HTML が指について下がり、広告はついて来ない（指を離すと戻る）。
- ＋ボタンの丸の外の四隅も、四角として切り抜く。
- **pro に枠が出ないこと・10 件未満で出ないこと**を止めるチェックは無い。スクリーンショットで見ただけ。
- **実機で一度も動かしていない**。ブラウザでは本物の広告は出ない（`Capacitor` が無いと
  枠そのものを作らない）。
