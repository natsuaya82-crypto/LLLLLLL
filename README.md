# Lingua — iOS（GitHub → App Store Connect 自動アップロード）

作った言語をノートのように育てるアプリ「Lingua」を、**GitHub に push すると自動で TestFlight（App Store Connect）へ上がる**構成にしたリポジトリです。

- 中身：今のプロトタイプ（`www/index.html`）を **Capacitor** で iOS 実アプリ化
- ビルド：**GitHub Actions の macOS ランナー**が Xcode でビルド&署名（＝あなたの Mac は不要）
- 署名：**App Store Connect API キー + Xcode のクラウド署名**（証明書の書き出し不要）
- アップロード：**Fastlane** が TestFlight へ送信

---

## 全体の流れ（ざっくり）

```
あなた: ①アプリ登録 → ②APIキー発行 → ③GitHubにSecrets登録 → ④push
                                                        │
GitHub Actions(mac): ⑤ビルド&署名 → ⑥TestFlightへアップロード（自動）
                                                        │
App Store Connect: ⑦TestFlightで実機確認 → ⑧審査に提出 → 公開
```

あなたがやるのは ①〜④ だけ。⑤⑥は push すると勝手に走ります。

---

## 準備するもの

- **Apple Developer Program**（年 $99）に加入済みであること
- **GitHub リポジトリ**（このフォルダを push する先）

---

## ① App Store Connect でアプリを登録

1. https://appstoreconnect.apple.com → 「マイApp」→「＋」→「新規App」
2. 次のとおり入力：
   - プラットフォーム：iOS
   - 名前：`Lingua`（※ストア表示名。重複不可なので取れなければ変更）
   - プライマリ言語：日本語
   - **バンドルID：`com.tokinets.lingua`**（このリポジトリと一致させる。後述の変更方法も参照）
   - SKU：`lingua`（任意の管理用ID）
3. 保存。まだ審査提出はしません（TestFlightに上げてからでOK）。

> バンドルIDが未登録だと選べないことがあります。その場合は
> https://developer.apple.com/account/resources/identifiers → 「＋」→ App IDs → App
> で `com.tokinets.lingua` を先に登録してください。

---

## ② App Store Connect API キーを発行（3つの値 + .p8 ファイル）

1. App Store Connect →「ユーザーとアクセス」→「Integrations（統合）」→「App Store Connect API」
2. 「＋」でキーを作成。**アクセス権は「App Manager」**を選択
3. 発行後に控える／取得する：
   - **Issuer ID**（ページ上部の長いID）→ Secret `ASC_ISSUER_ID`
   - **Key ID**（作ったキーの行に表示）→ Secret `ASC_KEY_ID`
   - **APIキー（.p8ファイル）**をダウンロード（**1回しか落とせません**。大切に保管）

### .p8 を base64 文字列に変換する
GitHub の Secret にはファイルを直接入れられないので、テキスト化します。

- Mac / Linux のターミナル：
  ```bash
  base64 -i AuthKey_XXXXXX.p8 | pbcopy      # Mac: クリップボードにコピー
  base64 -w0 AuthKey_XXXXXX.p8              # Linux: 出力をコピー
  ```
- Windows(PowerShell)：
  ```powershell
  [Convert]::ToBase64String([IO.File]::ReadAllBytes("AuthKey_XXXXXX.p8"))
  ```
  出てきた1行の文字列が Secret `ASC_KEY_P8` の値です。

### Team ID を確認
https://developer.apple.com/account →「Membership details」の **Team ID**（10桁）→ Secret `APPLE_TEAM_ID`

---

## ③ GitHub にリポジトリを作って push

このフォルダの中で：

```bash
git init
git add .
git commit -m "Lingua iOS: Capacitor + TestFlight CI"
git branch -M main
git remote add origin https://github.com/<あなた>/<リポジトリ名>.git
git push -u origin main
```

> `node_modules/` は `.gitignore` 済みなので上がりません（CI 側で入れ直します）。

### Secrets を登録
GitHub リポジトリ →「Settings」→「Secrets and variables」→「Actions」→「New repository secret」で、次の**4つ**を登録：

| Secret 名 | 値 |
|---|---|
| `ASC_KEY_ID` | ②の Key ID |
| `ASC_ISSUER_ID` | ②の Issuer ID |
| `ASC_KEY_P8` | ②の .p8 を base64 化した1行文字列 |
| `APPLE_TEAM_ID` | ②の Team ID（10桁） |

---

## ④ ビルドを走らせる

- `main` に push すると自動で走ります。
- 手動で試すなら：GitHub の「Actions」タブ →「iOS → TestFlight」→「Run workflow」。

進行はActionsのログで見られます。成功すると数分〜十数分で TestFlight にビルドが現れます（App Store Connect →「TestFlight」タブ）。

---

## ⑤ 実機で確認 → 審査へ

1. App Store Connect →「TestFlight」に出たビルドを、自分の Apple ID で **TestFlight アプリ**からインストールして実機確認。
2. 問題なければ「App Store」タブ → スクリーンショット・説明文・プライバシー情報などを埋めて **審査に提出**。

---

## ⚠️ 審査で一番ありがちな落とし穴（読んでおくと安全）

Apple のガイドライン **4.2（最低限の機能）** では、「Webサイトをそのまま包んだだけ」のアプリはリジェクトされることがあります。今回は Web ベースのため、審査を通しやすくするには：

- 単なる情報表示でなく、**アプリならではの操作**（このアプリなら辞書づくり・オフライン編集・保存など）がちゃんと機能していること
- **オフラインでも起動して使える**こと（今の作りは端末内で動くのでOK寄り）
- 将来的に **通知・共有・書き出し** などネイティブ機能を1つ足すと、より安全

もし 4.2 で弾かれたら、機能を足して再提出、が基本対応です。ここは必要になったら一緒に強化しましょう。

---

## よくある調整

**バンドルIDを変えたいとき**（例：`com.あなたの会社.lingua`）
1. `capacitor.config.json` の `appId`
2. `fastlane/Appfile` の `app_identifier`
3. Xcode プロジェクトの `PRODUCT_BUNDLE_IDENTIFIER`（`ios/App/App.xcodeproj/project.pbxproj` 内、2箇所）
の3つを揃えて変更 → ①のアプリ登録も同じIDで。

**アプリの表示名を変えたいとき**
`ios/App/App/Info.plist` の `CFBundleDisplayName`。

**バージョン番号（1.0.0 など）を上げたいとき**
`ios/App/App.xcodeproj/project.pbxproj` の `MARKETING_VERSION`。
ビルド番号は CI が push ごとに自動で更新します（`github.run_number`）。

**中身（画面）を直したいとき**
`www/index.html` を編集して push するだけ。CI が反映してまた TestFlight に上げます。

---

## 署名がうまくいかない場合の代替（fastlane match）

クラウド署名が環境により通らないことがあります。その場合は証明書を `fastlane match` で管理する方式に切り替えます（証明書用の非公開Gitリポジトリと `MATCH_PASSWORD` が追加で必要）。必要になったら手順を用意します。

---

## このリポジトリの構成

```
lingua/
├─ www/index.html                 # アプリ本体（プロトタイプ）
├─ capacitor.config.json          # Capacitor 設定（appId / appName）
├─ package.json / package-lock.json
├─ Gemfile                        # fastlane
├─ fastlane/
│  ├─ Appfile                     # バンドルID
│  └─ Fastfile                    # ビルド&アップロードのlane（beta）
├─ .github/workflows/ios.yml      # GitHub Actions（macOSでビルド→TestFlight）
└─ ios/                           # Capacitor が生成した Xcode プロジェクト
```
