# r93 ── 広告を出さない（AdMob と追跡を外す）

- 日付: 2026-09-25
- 枝: `claude/r93-noads`（`integ-0905` 9c4939c1 から）
- 決定: オーナー 2026-09-25「広告出さないよ？」、2026-09-24 決定ログ「広告: 今は作らない」。
  2026-09-23 の「今は売る人いないから admob を流す」と売れる広告枠を置き換える。
- 理由: App Store の審査への提出が二回 `BINARY_INDICATES_APP_TRACKS_USERS` で断られた
  （AdMob と ATT が入っていて、App Privacy は「追跡しない」）。ビルド 167 に入れる。

## 面（数えた物）

`grep -i "admob|LinguaAds|adm|promo|noads|NSUserTracking|SKAdNetwork|GADApplication|__ADMOB|Google-Mobile-Ads"`
をコードに掛けて出た所、全部:

- iOS: `ios/App/App/LinguaAds.swift`、`project.pbxproj`（参照・グループ・Sources の四行）、
  `Podfile`（`Google-Mobile-Ads-SDK`。`Podfile.lock` は無い）、`Info.plist`
  （`GADApplicationIdentifier`・広告ユニット・`NSUserTrackingUsageDescription`・`SKAdNetworkItems`）、
  **`MainViewController.swift:41` の `registerPluginInstance(LinguaAdsPlugin())`**
  （持ち物の一覧に無いが、課題の「AppDelegate 等に AdMob の初期化があれば消す」がこれ。
  消さないと `LinguaAds.swift` を消した時点でビルドが通らない）。
- workflow: `.github/workflows/ios-deploy.yml` の「Inject AdMob IDs」。
- www: `www/sns.js`（`PROMO`・`snsAdsOff`・`snsPromoAsk`・`snsWithPromo`・`snsRow`・`adm*`・
  `askFeed` の二つ目の問い）、`www/net.js`（`netPromos`）、`www/core.js`（`CAN.noads`）、
  `www/index.html`（`.ppr`・`.padm`・`.padm0` の CSS）。
- 検査: `tools/fixture.mjs`（`fixPromo` と五つの面）、`tools/load-check.mjs`（`promo` の偽の答え）、
  `tools/state-check.mjs`（AdMob の数）、`tools/assets-check.mjs`（コメント）。

## 変えてよい物

課題の一覧のとおり。加えて `ios/App/App/MainViewController.swift` の登録の一行と、その上のコメント。

## 変えない物

- `supabase/schema.sql` と `promo` テーブル（データは消さない ── アプリが読まなくなるだけ）。
  `tools/rls-check.mjs` の promo の件も残す。
- `www/post.js` の PR の角（`p.ad` の時の `<span class="ppr">`）── 持ち物外。`p.ad` を立てる所
  （`netPromos`）が無くなるので出なくなる。消すかどうかは報告に書く。
- `docs/STATE.md`・`CLAUDE.md` ── 持ち物外。直すべき行を報告に書く。
- `store/*.json`・`shipaton/` ── `promotionalText` 等は広告と関係ない。
