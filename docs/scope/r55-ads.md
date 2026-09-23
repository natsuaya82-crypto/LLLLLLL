# r55 ── 広告（タイムラインの PR 枠）

- 日付: 2026-09-23
- 枝: `claude/r55-ads`（`integ-0905` の `1a7b8db1` から）
- 仕様: OWNER 2026-09-23「広告の形は、Twitterと同じ。ツイート擬態右上にprとつく。
  広告枠が売れる形にする。今は売る人いないからadmobを流す。proのみ表示なし。」

## 触ってよいもの（leader が名指し）

`www/sns.js`、`www/post.js`（投稿の頭の PR だけ）、`www/core.js`（`CAN` の一行だけ）、
`www/net.js`（広告を取る）、`www/index.html`（PR の CSS だけ）、`www/i18n/*.js`（PR の鍵）、
`www/act-map.js`（ボタンを足すなら）、`supabase/schema.sql`、`tools/rls-check.mjs`、
`tools/fixture.mjs`、`docs/FEATURE_RULES.md`、`docs/CHANGELOG.md`、
`docs/PAID_FEATURES.md`、`docs/apple.md`、この文書。

## 触らないもの

`ios/` の下は一切（leader が言うまで）。AdMob / ネイティブのコードは書かない
（調べて報告して止まる）。r52 の領分 ── `www/core.js` の capOK・語数、
`www/wordsheet.js`、`www/share.js`、`www/card.js`。

## 同じファイルにいる他の枝

`git log --all` で見えたもの: `www/sns.js` `www/net.js` に r48・r51・r53、
`www/post.js` に r53・r54、`supabase/schema.sql` に r47・r51・r53、
`tools/fixture.mjs` に r54。統合は leader。

## 調べ（AdMob をどう出すか）

**出典の注意**：この環境からは developers.google.com・support.google.com・caa.go.jp が
開けず、下は検索結果の要約（公式 URL を示しているもの）から。全文を読んだのは
BrandonKnudsen の README だけ。確かめられなかったものは「未確認」と書く。

### 問題

タイムラインは WKWebView の中の HTML。AdMob のネイティブ広告（動画を含む）は
`GADNativeAdView` / `GADMediaView` という**ネイティブの view** で描かないといけない。
HTML の投稿と投稿の間に、そのまま置くことはできない。

### 案 (a) ネイティブの広告 view を HTML の空き枠の上に重ね、スクロールに合わせて動かす

- やり方：タイムラインに透明な空き枠（PR 行の高さ）を置き、その画面上の位置を
  `getBoundingClientRect()` で Swift に渡して、`GADNativeAdView` をその上に重ねる。
  スクロールするたびに位置を合わせ、画面の外に出たら隠す。
  既存の例：`@brandonknudsen/admob-native-advanced`
  （https://github.com/BrandonKnudsen/admob-native-advanced）がこの形。
  `@capacitor-community/admob` はバナー・全画面・リワードだけで、ネイティブ広告は無い
  （https://github.com/capacitor-community/admob/issues/110）。
- 動画：**流せる**（MediaView）。https://developers.google.com/admob/ios/native/advanced
- 規約：広告の上に、アプリの物（上のバー・下のタブ・＋ボタン）を重ねてはいけない。
  AdChoices の印も隠してはいけない（https://support.google.com/admob/answer/6329638）。
  → バーやタブの下にかかる所では、広告を切るか隠す必要がある。重ねる形そのものについて
  Google がはっきり書いた物は見つからなかった（未確認）。
- 費用：**中〜大**。Swift のプラグイン（読み込み・表示・位置・隠す）、JS 側の位置合わせ、
  勢いのあるスクロールで遅れて見えるずれへの対処。`ios/` と `project.pbxproj` に入る。
  AdMob Plus の資料には、webview とネイティブを混ぜるとスクロールがもたつくという注意がある。
- **規約に沿って、しかも動画も流せるのはこの案だけ。**

### 案 (b) Google Mobile Ads SDK の「WebView API for Ads」

- **AdMob の広告を WebView の中に出す仕組みではない。**WebView の中に置いた
  **ウェブ用の広告タグ**（AdSense、Ad Manager の GPT、動画なら IMA HTML5）に、
  アプリの情報を足すための物（`MobileAds.shared.register(webView)`）。
  https://developers.google.com/admob/ios/browser/webview/api-for-ads
- つまり中身は AdMob ではなく **Ad Manager か AdSense**。AdSense は審査で「サイト」が要り、
  このアプリのタイムラインには公開された URL が無いので、通るかは疑わしい（未確認）。
  Ad Manager は小さな運営者でも使える（AdSense のアカウントが要る）。
  https://support.google.com/admanager/answer/7084151
- 良い所：広告が本当に HTML の一行になる。Ad Manager なら「直接売った枠」も同じ仕組みで入る。
- 動画：IMA HTML5 は WebView・Cordova を公式には対応しないと言われ、WKWebView で
  押せない報告がある → **動画は未確認で危ない**。
- 費用：Swift は一行の登録だけで小さい。ただし Ad Manager の審査と設定が要る。

### 案 (c) そのほか

- **AdMob の中身（見出し・画像・ボタン）を取り出して自分の HTML で描く** → **規約違反**。
  中身は `GADNativeAdView` の中に置かないと、表示と押された数が数えられない。一番危ない。
- **画面の下に固定のバナー / 全画面の広告**：`@capacitor-community/admob` で簡単。
  ただしタイムラインの中の一行ではない（オーナーの言う形ではない）。
- **売った枠**（今回作った物）：自分の HTML で描く PR の行。Google の規約は関係なく、
  日本の法律（下）だけ。

### 表示の言葉 ── **オーナーに訊くこと**

- 日本のステマ規制（景品表示法、2023-10-01 から）：「広告」「宣伝」「プロモーション」「PR」の
  どれでもよく、見つけやすい場所にはっきり書くこと。→ **PR で足りる。**
  https://www.caa.go.jp/policies/policy/representation/fair_labeling/faq/stealth_marketing/
- **Google（AdMob のネイティブ広告）**：「Ad」「Advertisement」「Sponsored」
  （その国の言葉で）の印が要る。15px 以上、広告の上の方。
  https://support.google.com/admob/answer/6329638
  **「PR」でこれを満たすかは確かめられなかった**（PR は Ad の訳ではない）。
  → AdMob で埋める行だけは「広告」と出すのが安全。売った枠は「PR」のままでよい。
  **オーナーの「右上に pr」と食い違う可能性があるので、決めずに上げる。**
- AdChoices の印は SDK が角に付ける。PR を右上にするなら、AdChoices は別の角に。

### 設定で要るもの（案 a でも b でも）

- Info.plist：`GADApplicationIdentifier`、`SKAdNetworkItems`（Google の一覧）。
- SDK：v13（2026-02、iOS 13 以上）。Swift Package Manager で入れられる。
  https://ads-developers.googleblog.com/2026/02/announcing-ios-google-mobile-ads-sdk.html
- ATT（`NSUserTrackingUsageDescription` と許可のダイアログ）：**入れなくても広告は出る**。
  入れないと IDFA 無しで収入が下がる。https://developers.google.com/admob/ios/privacy/strategies
  → **オーナーが決めること。**許可のダイアログは「システムのダイアログ禁止」の例外に当たるかも
  オーナーの判断（iOS が出す物で、アプリからは描き方を選べない）。
- ヨーロッパ・イギリス・スイスで個人向けの広告を出すなら、同意の画面（UMP）が要る。
  https://support.google.com/admob/answer/13554116
- App Store のプライバシー一覧表の書き直し：https://developers.google.com/admob/ios/privacy/data-disclosure
- オーナーが作るもの：`docs/apple.md` § 9（AdMob のアカウント、アプリ ID、広告ユニット ID、
  app-ads.txt、支払い）。それまでは Google のテスト用 ID。

### 私の見立て（決めるのはオーナー）

動画込みで、投稿の形で、AdMob なら **(a)**。代わりに (b) にすると広告は本当に HTML の一行になるが、
中身は AdMob ではなく Ad Manager/AdSense で、審査が要り、動画は当てにならない。

## 作った物（オーナーの選択が要らない分）

- `supabase/schema.sql`：`promo`（どの投稿を・いつからいつまで）。**一つの描き方（`postRow`）**のために、
  広告は「広告主のアカウントの普通の投稿」で、`promo` はそれを指すだけ。Twitter と同じ形で、
  いいね・返信・通報がサーバー側ではそのまま効く形（アプリ側の制限は下）。`post` の列にしなかったのは、作者が自分の投稿を編集できる
  （`post_edit`）ので、自分で自分に枠を売れてしまうから。
- `tools/rls-check.mjs`：B と anon が読む・作る・変える・消すを試すケースを 9 本。
- `www/net.js` `netPromos()`、`www/sns.js` `snsPromoAsk()` / `snsWithPromo()` / `PROMO_EVERY`（10、OWNER 2026-09-23「10で。少ない時は出さない！」）、
  `www/core.js` `CAN.noads`、`www/post.js` の PR、`www/index.html` `.ppr`、`www/i18n/*.js` `post.pr`。
- `tools/fixture.mjs`：「the timeline with a place sold in it」「the same timeline on pro, with no place」。

## 分かっている制限

- **PR の行でいいね・リポスト・返信を押しても、その場では何も起きない。**`postLike()` などは
  `postById()` で `POSTS` の中だけを探し、宣伝の投稿は `POSTS` に入れていないため
  （入れると検索・おすすめ・端末のコピーにも混ざる）。行をタップしてスレッドを開けば
  `netPostById()` で `POSTS` に入り、そこから先は押せる。直すには `postById()` に手を入れる必要があり、
  それは私の担当（`post.js` は PR だけ）の外。
- スレッドを開いた後は、その投稿が普通の投稿として「おすすめ」にも出る。
- **pro に PR が出ないこと**を止めるチェックは無い。スクリーンショットで見ただけ。
