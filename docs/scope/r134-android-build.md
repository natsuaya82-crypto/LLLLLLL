# r134-android-build — Android を Actions で組み上げ、鍵と Play への道を作る

枝: `claude/r134-android-build`（`integ-0905` から）。オーナー 2026-09-29
「Android一気に進めて欲しい」「俺がやる作業終わったらもうリリースできるくらいまで詰めて欲しい」
「（署名の鍵を Actions で作る仕組みを）作って」。

## 変えてよい物

- `android/`（Kotlin・gradle の、組み上がらない所）
- `.github/workflows/android-*.yml`（`android-build.yml` と、新しく作る `android-keygen.yml` `android-release.yml`）
- `tools/` の Android 用の新しい道具
- `www/net.js` の `GOOGLE_WEB_ID` の一行（ビルドの時に Secrets から置き換える形）
- `tools/assets-check.mjs` の置き換えの名前の規則（Android の workflow も読む）
- この文書

## 変えない物

`docs/ANDROID.md`（r135 の物）。オーナーの手順はこの文書の報告に書く。
`www/` のそれ以外、`ios/`、ほかの workflow。

## 触る前に見た他の枝

`git log origin/integ-0905..<枝> -- android .github/workflows www/net.js tools/assets-check.mjs`
は r115・r121〜r124・r130〜r133 のどれも 0。
