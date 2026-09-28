# r122-android-signin ── Android のサインイン（Google は webClientId、Apple は出さない）

ブランチ `claude/r122-android-signin`（integ-0905 から）。`docs/ANDROID.md` § サインイン。

## 触ってよい
- `www/onboard.js` ── サインインの初期化（`obReady()`）と門の Apple・Google のボタンだけ
- `www/net.js` ── Android の Google の定数一つだけ（`GOOGLE_IOS_ID` の隣）
- `tools/fixture.mjs` ── 電話の種類の切り替えだけ
- `docs/ANDROID.md` § サインイン・§ オーナーがすること、`docs/CHANGELOG.md`、この文書、`shots/r122-*`

## 触らない
それ以外すべて。`www/settings.js` の Apple・Google の行も（持っていない ── 報告に書く）。
`www/store.js`・verify-plan は r121、キーボードは r123、通知は r124。
