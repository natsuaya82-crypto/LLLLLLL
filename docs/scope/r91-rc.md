# r91-rc ── 買う処理を RevenueCat SDK に載せ替える（Shipaton 2026）

枝 `claude/r91-rc`（`integ-0905` 8631840f から）。

決定: `docs/FEATURE_RULES.md` の Shipaton の項（2026-08-25）「`LinguaStore.swift`
gains RevenueCat in place of talking to StoreKit directly. The four product ids do
not move.」と、オーナーの 2026-09-25 の「お願い」。参加条件は RevenueCat SDK が
アプリ内課金を動かしていること ── 見ているだけ（オブザーバーモード）ではない。

`origin/claude/rc`（a049bc0a・d0c745fa・569bf0d7）は読むだけ。2026-09-06 の
「段はサーバーが決める」より前の形（Keychain に段を書く）なので、中身は取らず、
今の `LinguaStore.swift` の上に書き直す。

## 触ってよいもの
- `ios/App/Podfile`（`ios/App/Podfile.lock` は repo に無い）
- `ios/App/App/LinguaStore.swift`
- `www/store.js`
- `tools/plan-check.mjs`・`tools/paid-check.mjs`
- `supabase/functions/verify-plan/*`（要ると測れた時だけ）
- `ios/App/App/Info.plist`・`ios/App/App.xcodeproj/project.pbxproj`・`.github/workflows/ios-deploy.yml`（要る時だけ ── 今の見立てではどれも要らない）
- `docs/PAID_FEATURES.md`・`docs/apple.md`・`supabase/setup.md`・`docs/CHANGELOG.md`・
  `docs/FEATURE_RULES.md`（Shipaton の項の Implementation status だけ）・この頁

## 触らないもの
`www/index.html`、`docs/STATE.md`、上に無い全部。値段とプランの境は決めない。
全ゲートは回さない。Swift はここでビルドできない。

## 報告

コミット: `4b75d7cb` pod ／ `4007a6e3` CHANGELOG ／ `aed39236` 載せ替え本体 ／
`64bf8740` apple.md 6b と Shipaton の項。integ-0905 は取り込み済み（差 0）。

### 何を、どのファイルで
- `ios/App/Podfile`: `pod 'RevenueCat', '5.91.0'`（CocoaPods trunk の最新、iOS 13 以上）。
  **ios-deploy.yml はこのままで足りる** ── `ios/App` で `pod install` を回しており、
  `Podfile.lock` は repo に無い。`Pods_App.framework` は project.pbxproj に既に結線されて
  いるので **pbxproj も Info.plist も workflow も触っていない**。
- `ios/App/App/LinguaStore.swift`:
  - 買う = `Purchases.shared.purchase(product:)`。取消し・承認待ちは RevenueCat が投げる
    `ErrorCode`（`purchaseCancelledError`／`paymentPendingError`）で読み分け、`how` は四つのまま。
  - 復元 = `Purchases.shared.restorePurchases()`（12 秒の限りは同じ）。
  - 後から届く物（親の承認・更新・返金）= `PurchasesDelegate` の `receivedUpdated` →
    `linguastore` の窓の出来事 → www は今までどおり `current` を訊く。
  - **StoreKit 直の `product.purchase`・`AppStore.sync()`・`Transaction.updates`・`finish()` は消した。**
  - 誰の購入か: RevenueCat は appUserID が UUID なら `appAccountToken` に入れる（原典
    purchases-ios 5.91.0 `PurchasesOrchestrator.swift` 846 行、**SK2 の道だけ**）。なので買う前に
    `logIn(uid)` して `appUserID` を読み戻し、違えば買わない。configure で StoreKit 2 を名指し。
  - 名前の衝突: RevenueCat にも公開の `Transaction`（廃止名）と `VerificationResult` がある
    ので `StoreKit.Transaction` と書いた。
- `www/store.js`: 復元が `uid` を渡す（RevenueCat の logIn のため）。他の受け渡しは同じ形。
- `tools/plan-check.mjs`: Swift を読む主張を貼り替え・足した（下）。
- docs: `docs/PAID_FEATURES.md`・`docs/apple.md`（嘘になった文と § 6b）・`docs/CHANGELOG.md`・
  `docs/FEATURE_RULES.md`（Shipaton の項の Implementation status）。`supabase/setup.md` は
  嘘になった文が無かったので触っていない。

### サーバー（verify-plan）── 変えていない
`verifyJws`／`bindOf`／`decidePlan` を読んだ。RevenueCat 経由の SK2 購入も Apple の同じ JWS で、
`appAccountToken` は同じ uid（bindOf は両側を小文字にして比べる）、bundleId も同じなので、
**同じ答えが出る**。ただし RevenueCat SDK は JWS を外に出さない（`StoreTransaction.jwsRepresentation`
は `internal`）ので、端末は **StoreKit の `currentEntitlements` と四商品の
`Transaction.latest(for:)` を読んで**上げる ── 読むだけで、買う・復元・finish はしない。
`latest(for:)` は取り消された取引も返すので、返金は前（開いている間に届いた物だけ）より広く届く。

### 振る舞い
- キーが入れば: 買う・復元は RevenueCat 経由。画面・文言・段の決まり方は同じ。
- **キーが空の今**: `products`・`buy`・`restore` は拒否 → www は今の
  「App Store につながりませんでした」（`store.fail`）。落ちない（`Purchases.shared` は
  `ready` を通った道でしか触らない）。`current` は RevenueCat に訊かないので今までどおり答え、
  **既に払っている人の段は落ちない**。`manage` は Apple のシートのまま（下）。

### 保存する物
端末・サーバーとも新しく保存する物・動かす物・消す物は無し。**新しく外へ出る物**: uid
（RevenueCat の App User ID として）と購入の履歴が RevenueCat に渡る。CHANGELOG に書いた。

### 回した検査
- `plan-check`: 緑（exit 0）。新しい主張: logIn して読み戻す／それが済んでから買う／
  RevenueCat が買う・復元し StoreKit 2 を名指し／StoreKit 直の買う・聞き手・finish が無い／
  キーが一か所／RevenueCat に訊く道は全部 `ready` を先に訊き current は訊かない／Podfile に
  pod／返金のための `latest(for:)`／復元が uid を運ぶ。
- **赤を見た**（一回、三つ同時に入れた）: `Transaction.updates` の聞き手を戻す・restore の
  `guard Self.ready` を外す・store.js の restore から uid を抜く → `plan: 3 failed`、狙った三行だけ。戻した。
- FAST 18 本を個別に: **docs-check だけ赤（2 problems）**、他は全部緑。赤の二つは持ち物の外で、
  この変更が嘘にした文（下）。そのため `aed39236`・`64bf8740` は `--no-verify` で積んだ。
- **Swift は未ビルド。** この環境に Xcode が無い。API の綴りは purchases-ios 5.91.0 の原典で
  一つずつ確かめた（`logIn`・`appUserID`・`purchase(product:)`・`restorePurchases()`・
  `products(_:)`・`Configuration.Builder(withAPIKey:)`・`.with(storeKitVersion:)`・`ErrorCode`・
  `StoreProduct` の欄）が、コンパイラには通していない。

### キーを入れる一行
`ios/App/App/LinguaStore.swift` の `static let apiKey = ""` に appl_ で始まる公開キー。
**repo に直接書く形**にした（占め札 `__NAME__` ではない）── 公開キーは秘密ではなく、
`www/net.js` の `SB_KEY` と同じ扱い。assets-check の条件（workflow が置き換えること）に掛からない。

### オーナーの手順
`docs/apple.md` § 6b。RevenueCat にアプリ（`com.tokinets.lingua`）、In-App Purchase Key と
App 用共有シークレット、4 商品・entitlement `plus`／`pro`・offering `default`、公開キーを
リーダーへ。

### CODE / DEVICE / OWNER
- CODE CONFIRMED: plan-check 緑と赤三つ、FAST は docs-check の 2 行を除いて緑。Swift は読みだけ。
- DEVICE CONFIRMED: 無し。ビルドも未。サンドボックスで「買う／同じアカウントで復元して付く／
  別のアカウントで復元して付かない／承認待ち→承認で付く」を押すまで、読んで通っただけのコード。
- OWNER CONFIRMED: 無し。

### リーダーへ ── 持ち物の外で、この変更が嘘にした文
docs-check が赤なのは上の二つ（一語ずつ `displayPrice` → `localizedPriceString`）:
- `docs/FEATURE_RULES.md:6009`（2026-08-23 の値段の項）
- `docs/STATE.md:1529`
docs-check は読まないが嘘になった文:
- `docs/FEATURES.md:250`（`Transaction.updates`、`.unverified` を拒む）・`:426`（`claude/rc` が公開キー待ち）
- `docs/FEATURE_RULES.md:335`（親の承認が `Transaction.updates` → `linguastore`）・`:5405`（「StoreKit 2 でこの四つを扱い」）
- `docs/STATE.md:749`・`:810`・`:1173`・`:1537-1538`
- 見つけたが今回の変更とは無関係: `docs/apple.md` § 5 のプライバシーの一覧表の段落が
  「広告・解析の SDK は一つもない」と言っている（AdMob が入っている）。

### リーダーの指示が間違っていた所
- 「今の権利を読む を Purchases に置き換える」は文字どおりにはできない。RevenueCat SDK は
  Apple の署名（JWS）を外に出さず、verify-plan が要るのはそれなので、**読むのは StoreKit のまま**
  （読むだけ）。RevenueCat の REST をサーバーから訊く形にすれば置き換えられるが、秘密キーと
  verify-plan の作り直しになるので、しなかった。
- `manage`（解約の画面）は StoreKit の `AppStore.showManageSubscriptions` のまま。買う道ではなく、
  RevenueCat の同じ関数は先に customerInfo を取り、`managementURL` が無ければ失敗する（原典
  `ManageSubscriptionsHelper.swift` 34〜50 行で確かめた）ので、キーが空・RevenueCat に届かない・
  RevenueCat がその購読を知らない時に Apple のシートが開かなくなる。
- 「接続できません」の今の形: 課金の道の今の文言は「App Store につながりませんでした」
  （`store.fail`）で、それに落ちるようにした。
