# Lingua — iOS 配信（JPEL Manager 手順書ベース）

つばさんのチームの手順書（`appstoredeployguide.md`）の配線をそのまま踏襲したリポジトリです。
**`build-*` タグを push すると、GitHub Actions(macOS) が Xcode ビルド→手動署名→App Store Connect(TestFlight) へ自動アップロード**します。Mac は不要です。

## 手順書との違い（2点だけ）

このアプリは JPEL Manager と少し前提が違うので、手順書から次の2点だけ調整しています。

1. **Web が Vite/TS ではなく静的HTML1枚**（`www/index.html`）。なので `npm run build` と「バージョン整合性チェック（appMeta.ts）」のステップは無し。`npm ci` → `npx cap sync ios` だけ。
2. **Team ID を GitHub Secret にした**（手順書は pbxproj に直書き）。ソースを一切編集せず、Secret 登録だけで済むようにするため。CI がビルド直前に pbxproj のプレースホルダ `__APPLE_TEAM_ID__` を差し込みます。

それ以外（.p12 手動署名 / プロビジョニングプロファイル / `apple-actions` / ExportOptions.plist / `build-*` タグ起動）は手順書どおりです。

## このアプリ固有の確定値（Apple側の設定を合わせる）

| 項目 | 値 |
|---|---|
| Bundle ID | **`com.tokinets.lingua`** |
| プロビジョニングプロファイル名 | **`Lingua Distribution`**（この名前で作成してください） |
| アプリ表示名 | `Lingua` |

Bundle ID とプロファイル名は pbxproj / ExportOptions に**この値で固定済み**なので、あなたはコード編集不要です。Apple 側でこの名前・IDで作るだけで揃います。

---

# あなたがやること

## Apple 側（一度きり）— 手順書の STEP 1〜6

これは Apple アカウントでの操作なので、あなたにしかできません。手順書の該当STEPを、上記の確定値で進めてください。

1. **App ID 登録**（STEP1）: Developer → Identifiers → App IDs → App、Bundle ID = `com.tokinets.lingua`（Explicit）
2. **App Store Connect にアプリ枠**（STEP2）: マイApp → ＋ → 新規App、名前 `Lingua`、上のバンドルID、SKU 任意
3. **API キー(.p8)**（STEP3）: ユーザーとアクセス → 統合 → App Store Connect API → App Manager 権限で発行 → `.p8`・Issuer ID・Key ID を控える
4. **配布証明書(.p12)**（STEP4）: Apple Distribution 証明書を作成 → `.p12` に書き出し（パスワード設定）。Mac 無しなら手順書の openssl 手順でOK
5. **配布プロファイル**（STEP5）: Profiles → ＋ → App Store Connect配布 → App ID=`com.tokinets.lingua`、証明書=STEP4、**名前は必ず `Lingua Distribution`** → `.mobileprovision` をダウンロード
6. **Team ID 確認**（STEP6）: Membership の Team ID（10桁）

## GitHub 側

### リポジトリに push
```bash
git init
git add .
git commit -m "Lingua iOS: TestFlight CI"
git branch -M main
git remote add origin https://github.com/<あなた>/<リポジトリ名>.git
git push -u origin main
```
（`node_modules/` は .gitignore 済み。CI 側で入れ直します）

### Secrets を登録（手順書の6つ + Team ID = 計7つ）
Settings → Secrets and variables → Actions → New repository secret：

| Secret 名 | 中身 | 作り方 |
|---|---|---|
| `DISTRIBUTION_P12_BASE64` | 配布証明書.p12 の base64 | `base64 -w0 distribution.p12`（Macは `base64 -i distribution.p12 \| pbcopy`） |
| `DISTRIBUTION_P12_PASSWORD` | STEP4で決めた .p12 パスワード | そのまま |
| `PROVISIONING_PROFILE_BASE64` | .mobileprovision の base64 | `base64 -w0 Lingua_Distribution.mobileprovision` |
| `APP_STORE_CONNECT_ISSUER_ID` | STEP3 の Issuer ID | そのまま |
| `IOS_KEY_ID` | STEP3 の Key ID（10桁） | そのまま |
| `IOS_API_KEY` | STEP3 の `.p8` の**中身そのまま**（base64にしない） | `-----BEGIN...` から `-----END...` まで全文貼る |
| `APPLE_TEAM_ID` | STEP6 の Team ID（10桁） | そのまま |

> ⚠️ 手順書のハマりどころ再掲：**証明書とプロファイルは base64、`IOS_API_KEY`(.p8) だけは生のまま**。逆にしない。

---

# 配信する（日常運用）— 手順書の STEP 10

コードを直したら、タグを打って push するだけ。ビルド番号は CI が自動で更新します（手動で pbxproj を触る必要なし）。

```bash
git add -A && git commit -m "build-1"
git tag build-1
git push origin main
git push origin build-1      # ← この build-* タグの push が CI を起動する
```

数分〜十数分で App Store Connect の **TestFlight** に新ビルドが出ます。そこから自分の iPhone の **TestFlight アプリ**で実機確認 → 問題なければ「審査へ提出」。

次回以降は番号を上げるだけ：`git tag build-2 && git push origin build-2` …

> 画面（中身）を直したいときは `www/index.html` を編集して、同じくタグ push するだけで反映されます。

---

# 審査の注意（Web ベース特有）

Apple ガイドライン **4.2（最低限の機能）** で「Webを包んだだけ」に見えると弾かれることがあります。オフラインで起動・操作できること（本アプリは端末内で動くのでOK寄り）に加え、通知・共有・書き出しなどネイティブ機能を1つ足すとより安全です。弾かれたら機能追加して再提出、が定石。ここは必要になったら一緒に強化します。

---

# 構成

```
lingua/
├─ www/index.html                    # アプリ本体（プロトタイプ）
├─ capacitor.config.json             # appId=com.tokinets.lingua / appName=Lingua / webDir=www
├─ package.json / package-lock.json
├─ .github/workflows/ios-deploy.yml  # build-* タグで起動（手順書STEP9ベース）
└─ ios/                              # Capacitor(CocoaPods)生成の Xcode プロジェクト
    └─ App/
        ├─ App.xcworkspace           # ← CIはこれをビルド
        ├─ Podfile
        └─ App.xcodeproj             # Release=手動署名(Apple Distribution / Lingua Distribution)
```

## よくある変更
- **表示名**：`ios/App/App/Info.plist` の `CFBundleDisplayName`
- **ストア表示バージョン**：`project.pbxproj` の `MARKETING_VERSION`（例 1.0.0→1.0.1）。ビルド番号(CURRENT_PROJECT_VERSION)はCIが自動更新
- **Bundle ID を変える**：`capacitor.config.json` の `appId` / pbxproj の `PRODUCT_BUNDLE_IDENTIFIER` / workflow の ExportOptions の Bundle IDキー を揃える（＋Apple側も同じIDで）

## 署名で詰まったら
手順書の「ハマりどころ集」を参照。特に **Bundle ID / プロファイル名 `Lingua Distribution` / Team ID の完全一致**を指差し確認。`does not support provisioning profiles` が出たら、xcodebuild に署名引数を渡していないか（＝pbxproj側で持てているか）を確認。
