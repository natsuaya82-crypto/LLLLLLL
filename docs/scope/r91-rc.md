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
（作業の後にここへ書く）
