# システムキーボード（Keyboard Extension）— 必要なもの全部

**まだ作っていません。** これは作るための仕様書です。

名前は **`Lingua`**。ビルド時に決まり、あとから誰も変えられません（言語ごとにも
変えられません。拡張は1つ、名前も1つ）。

---

## 0. 全体の形

```
  Lingua 本体（webview）                     Lingua キーボード（Swift）
  ─────────────────────                      ────────────────────────
  文字を描く                                  App Group から読むだけ
  キーボードを組む            App Group        キーを Core Graphics で描く
  フォントを組み立てる   ──────────────→      押されたら文字を挿す
  ぜんぶ書き出す              （共有領域）     組み立ては一切しない
```

**拡張は読むだけ**です。フォントの組み立ても、文字の並べ替えも、IPA も、
一切やりません。拡張のメモリは本体よりずっと厳しく、`otf5.js` に当たる処理を
中でやると落ちます。

これは `www/post.js` の線と同じ話です。拡張は**読む側**なので、
作る側の都合（`LETTERS` の id、`SND`、`ltName()`）を一切知りません。
必要なものは全部、本体が書き出すときに**載せて**渡します。

---

## 1. あなたが Apple でやること

### 1-1. 拡張の App ID

developer.apple.com → Certificates, Identifiers & Profiles → **Identifiers** → **＋**

1. **App IDs** を選んで Continue
2. **App** を選んで Continue
3. Description: `Lingua Keyboard`
4. Bundle ID: **Explicit** を選んで **`com.tokinets.lingua.keyboard`**
   - 本体の Bundle ID の前方一致でないと拡張として認められません
5. Capabilities の一覧から **App Groups** にチェック
6. Continue → Register

### 1-2. App Group

Identifiers の画面で、**右上のプルダウン（App IDs と出ている所）を
`App Groups` に切り替える** → **＋**

- Description: `Lingua Shared`
- Identifier: **`group.com.tokinets.lingua`**

→ Continue → Register

**これがアプリと拡張の間の唯一の通り道です。** 文字もキーボードもフォントも
全部ここを通ります。

### 1-3. 両方の App ID をそのグループに入れる

プルダウンを **App IDs** に戻して:

**本体** `com.tokinets.lingua` を開く
1. App Groups の行の **Edit**（または Configure）
2. `Lingua Shared` にチェック → Continue
3. Save → 「変更すると既存のプロファイルが無効になる」という警告に OK

**拡張** `com.tokinets.lingua.keyboard` も同じ

### 1-4. プロビジョニングプロファイル 2枚

**Profiles** → **＋** → Distribution の **App Store Connect** → Continue

**拡張用（新規）**
- App ID: `com.tokinets.lingua.keyboard`
- Certificate: いま使っている **Apple Distribution** の証明書
- Profile Name: **`Lingua Keyboard Distribution`**（この文字列をそのまま使います）
- Generate → **Download**

**本体用（作り直し）**
- 既存の `Lingua Distribution` を開く → **Edit** → 何も変えず **Generate**
  → **Download**
- 1-3 で capability を足したので、**古いものは使えません。**
  これを忘れると Archive が「provisioning profile doesn't include the
  com.apple.security.application-groups entitlement」で落ちます

### 1-5. App Store Connect

**拡張の App レコードは作りません。** 本体の中に入って一緒に出ます。

やることは1つだけ:
- **App のプライバシー** / プライバシーポリシー に、キーボードが
  「入力内容をどこにも送らない」ことを1文書いておく。フルアクセスを
  取る他社製キーボードは、審査で理由を聞かれます

---

## 2. GitHub Secrets

`.mobileprovision` を base64 にして、リポジトリの Settings → Secrets and
variables → Actions で:

| Secret | 中身 |
|---|---|
| `PROVISIONING_PROFILE_BASE64` | **本体用（1-4 で作り直した方）に差し替え** |
| `KEYBOARD_PROVISIONING_PROFILE_BASE64` | 拡張用（新規） |

変換:
```
base64 -i "Lingua_Keyboard_Distribution.mobileprovision" | pbcopy
```

Mac がないなら、2つの `.mobileprovision` を送ってもらえればこちらで
base64 にして値を返します。**Secret に貼るのはあなたです**（こちらからは
書き込めません）。

---

## 3. リポジトリに増えるファイル

```
ios/App/
  App/
    App.entitlements                  ← 新規。本体に App Group を付ける
  LinguaKeyboard/                     ← 新規。拡張のターゲット
    Info.plist
    LinguaKeyboard.entitlements
    KeyboardViewController.swift      ← 入口。読み込みと組み立て
    KeyBoardView.swift                ← キーの並びと当たり判定・フリック
    GlyphView.swift                   ← 1文字を Core Graphics で描く
    Shared.swift                      ← App Group から JSON を読む
ios/App/App.xcodeproj/project.pbxproj ← 手で編集（後述）

www/
  share.js                            ← 新規。App Group に書き出す側
  index.html                          ← script タグ1本追加

（Capacitor プラグイン）
  ios/App/App/LinguaShare.swift       ← www から呼ばれる native 側
                                         書き出し＋フォントのシステム登録
```

拡張は **Capacitor も CocoaPods も使いません**（純粋な Swift）。
なので `Podfile` は変わらず、`npx cap sync ios` も拡張のターゲットを
触りません。

---

## 4. project.pbxproj に足すもの

Xcode がない環境で手で書きます。ここが一番慎重にやる所です。

- `PBXNativeTarget` を1つ（productType = `com.apple.product-type.app-extension`）
- そのターゲットの `PBXSourcesBuildPhase` / `PBXResourcesBuildPhase` /
  `PBXFrameworksBuildPhase`
- 本体ターゲットに **`Embed App Extensions`** の `PBXCopyFilesBuildPhase`
  （dstSubfolderSpec = 13）を追加して、`.appex` を入れる
- 本体ターゲットの `PBXTargetDependency` に拡張を追加
- 拡張の Build Settings:
  - `PRODUCT_BUNDLE_IDENTIFIER = com.tokinets.lingua.keyboard`
  - `INFOPLIST_FILE = LinguaKeyboard/Info.plist`
  - `CODE_SIGN_ENTITLEMENTS = LinguaKeyboard/LinguaKeyboard.entitlements`
  - `CODE_SIGN_STYLE = Manual`
  - `CODE_SIGN_IDENTITY = "Apple Distribution"`
  - `PROVISIONING_PROFILE_SPECIFIER = "Lingua Keyboard Distribution"`
  - `DEVELOPMENT_TEAM = __APPLE_TEAM_ID__`（CI が置換）
  - `IPHONEOS_DEPLOYMENT_TARGET = 15.0`（本体と同じ。本体より上げると不可）
  - `SWIFT_VERSION = 5.0`
  - `SKIP_INSTALL = YES`
- 本体ターゲットに `CODE_SIGN_ENTITLEMENTS = App/App.entitlements`

**バージョンは本体と一致していないと ASC に弾かれます。**
CI の `sed` は `CURRENT_PROJECT_VERSION` を `/g` で全部書き換えるので
自動で揃います。`MARKETING_VERSION = 1.0.0` も拡張側に同じ値を書いておきます
（現在2か所 → 3か所になります）。

---

## 5. App Group に何を置くか

`group.com.tokinets.lingua` のコンテナ直下:

```
keyboard.json      いま開いている言語のキーボード、全部入り
LinguaScript.otf   その言語のフォント（フォントのシステム登録に使う）
```

`keyboard.json` の形。**id も参照も入れません。載せます。**

```json
{
  "v": 1,
  "lang": "L7",
  "name": "Shango",
  "pen": 60,
  "box": 1000,
  "lay": [
    {
      "rows": [
        [
          { "k": "lt",
            "t": "a",
            "st": [ [[112,112],[688,112],[400,688]] ],
            "w": 1,
            "f": [
              { "t": "i", "st": [ [[200,200],[600,300]] ] },
              null, null, null
            ] },
          { "k": "sp", "w": 4 },
          { "k": "del", "w": 1 },
          { "k": "lay", "to": 1, "w": 1 },
          { "k": "next", "w": 1 }
        ]
      ]
    }
  ]
}
```

| 鍵 | 意味 |
|---|---|
| `k` | `lt` 文字 / `sp` スペース / `del` 削除 / `lay` 層の切替 / `next` 🌐 |
| `t` | 挿し込む文字列。**文字の名前**。これがフォントの符号そのもの |
| `st` | キーに描く線。`box` を一辺とする正方形の中の座標 |
| `pen` | 線の太さ（同じ `box` の単位） |
| `w` | 行の中の取り分 |
| `f` | フリック 上・右・下・左。無い向きは `null` |

- **本体が正規化してから書きます。** 拡張は `geStep()` も `geInkTop()` も
  知りません
- 文字を借りている（`Ϙ` のような既存文字）場合は `st` の代わりに
  `"ch": "Ϙ"` を載せます。拡張はそれをそのまま描きます
- **書くタイミング**: 文字を描いたとき・消したとき、キーボードを直したとき、
  言語を切り替えたとき。`saveLetters()` / `saveKb()` / `langOpen()` から
  1本呼ぶだけにします（＝一箇所）

---

## 6. 拡張の中身（Swift）

### KeyboardViewController

```
UIInputViewController を継承

viewDidLoad
  hasFullAccess を見る
    false → 「設定 → 一般 → キーボード → Lingua → フルアクセスを許可」
             とだけ出す。空のキーボードにはしない
    true  → App Group の keyboard.json を読む
             読めない / 言語に文字が1つも無い → 「Lingua で文字を描いてください」
  高さを決める（行数 × 1行の高さ + 余白）を NSLayoutConstraint で
  KeyBoardView を貼る

needsInputModeSwitchKey が true のときだけ 🌐 を出す
（iPad の外付けキーボード等では不要になる）
```

### KeyBoardView

- 行を縦、キーを横に並べる。幅は `w` の比で分ける（UIStackView の
  `distribution = .fill` + `widthAnchor` の multiplier）
- **1行10キーで1キー約35pt** になります。iOS 標準と同じで、これが普通です
- タップ → `textDocumentProxy.insertText(t)`
- `del` → `deleteBackward()`
- `sp` → `insertText(" ")`
- `lay` → 層を差し替えて組み直し
- `next` → `advanceToNextInputMode()`
- **フリック**: `touchesBegan` で開始点、`touchesEnded` で移動量。
  **18pt 未満はタップ**、それ以上なら縦横の大きい方の向き。
  `www/keyboard.js` の `kbUp()` と同じ数字・同じ判定にします
- 押している間のハイライトと、フリック中に方向のプレビュー

### GlyphView

`st` の折れ線を `UIBezierPath` で描きます。**本体と同じ描き方**にします:

- 線分ごとに向きに合わせた長方形（`bar()` と同じ）
- 継ぎ目に凸包（`hull()` と同じ）
- 端は角のまま（丸めない）
- 点1つは正方形（`nib()` と同じ）

`www/otf5.js` の `bar` / `hull` を Swift に写します。ここだけは
**同じ規則を2回書く**ことになるので、写した所にその旨を書きます
（言語が違うので共有できません）。

---

## 7. Info.plist と entitlements

### `ios/App/LinguaKeyboard/Info.plist`

```xml
<key>CFBundleDisplayName</key><string>Lingua</string>
<key>CFBundleName</key><string>LinguaKeyboard</string>
<key>NSExtension</key>
<dict>
  <key>NSExtensionPointIdentifier</key>
  <string>com.apple.keyboard-service</string>
  <key>NSExtensionPrincipalClass</key>
  <string>$(PRODUCT_MODULE_NAME).KeyboardViewController</string>
  <key>NSExtensionAttributes</key>
  <dict>
    <key>IsASCIICapable</key><false/>
    <key>PrefersRightToLeft</key><false/>
    <key>PrimaryLanguage</key><string>mul</string>
    <key>RequestsOpenAccess</key><true/>
  </dict>
</dict>
```

- `CFBundleDisplayName` が **設定と 🌐 に出る名前**です
- `PrimaryLanguage = mul`（多言語）。作った言語が何語かは Apple の一覧に
  無いので、これが正直な答えです
- `RequestsOpenAccess = true` が**フルアクセス**。これが無いと App Group を
  読めず、あなたの文字を取り出せません

### 両方の entitlements

```xml
<key>com.apple.security.application-groups</key>
<array><string>group.com.tokinets.lingua</string></array>
```

`App/App.entitlements` と `LinguaKeyboard/LinguaKeyboard.entitlements` の
両方に、同じものを書きます。

---

## 8. CI の変更（`.github/workflows/ios-deploy.yml`）

**Install Provisioning Profile** を2枚に:

```yaml
- name: Install Provisioning Profiles
  env:
    PROFILE_BASE64: ${{ secrets.PROVISIONING_PROFILE_BASE64 }}
    KB_PROFILE_BASE64: ${{ secrets.KEYBOARD_PROVISIONING_PROFILE_BASE64 }}
  run: |
    mkdir -p ~/Library/MobileDevice/Provisioning\ Profiles
    echo "$PROFILE_BASE64"    | base64 --decode > app.mobileprovision
    echo "$KB_PROFILE_BASE64" | base64 --decode > kb.mobileprovision
    cp app.mobileprovision kb.mobileprovision ~/Library/MobileDevice/Provisioning\ Profiles/
```

**ExportOptions.plist** に2つ目を:

```xml
<key>provisioningProfiles</key>
<dict>
  <key>com.tokinets.lingua</key>
  <string>Lingua Distribution</string>
  <key>com.tokinets.lingua.keyboard</key>
  <string>Lingua Keyboard Distribution</string>
</dict>
```

Archive は `-scheme App` のままで大丈夫です。Embed App Extensions の
ビルドフェーズが入っていれば、拡張も一緒に入ります。

---

## 9. フォントをシステムに入れる（自作文字が他アプリで出る唯一の道）

拡張とは別物で、**Apple 側の設定は要りません。**

- `www/glyph.js` の `installScriptFont()` はすでに OTF のバイト列を
  作っています（`f.dataUrl()`）。それを App Group に `.otf` として置きます
- native 側で `CTFontManagerRegisterFontURLs(urls, .persistent, true, ...)`
- iOS が「Lingua がフォントを追加しようとしています」と確認を出す →
  許可すると、**フォントを選べるアプリ**でフォント名 `LinguaScript` が
  選べるようになります
- 設定 → 一般 → フォント に入り、そこから消せます

**出るアプリ**: メモ・メール・Pages・Keynote・Numbers・Word・Pixelmator など
フォントピッカーがあるもの
**出ないアプリ**: LINE・X・メッセージ・Instagram。フォントを変える手段が
ないので、どうやっても無理です

---

## 10. 制約・落とし穴

- **メモリ**。拡張は本体よりずっと少ない予算で動きます。フォントの組み立ては
  絶対に中でやりません（だから App Group に置きます）
- **起動の速さ**。キーボードは文字欄をタップするたびに起動します。
  JSON を読んで描くだけにします
- **webview は使えません。** アプリ内キーボードのコードは流用できず、
  Swift で書き直しです。だから `keyboard.json` の形を先に決めます
- **フルアクセスがオフのまま**の人が必ずいます。空の板ではなく、
  何をすればいいか書いた板を出します
- **文字を消した / 言語を切り替えた**あと、拡張が古い JSON を持っています。
  本体が書き出したら即反映されるよう、拡張は起動のたびに読み直します
- **`npx cap sync ios` は拡張に触りません**（Podfile も変わりません）。
  ただし pbxproj を壊す変更が Capacitor 側から来ないとは限らないので、
  拡張の追加後は毎回 Archive が通ることを CI で確認します

---

## 11. 審査

- **🌐 キーは必須。** これが無い他社製キーボードは通りません
- フルアクセスを取る理由を聞かれます。「利用者が自分で描いた文字の形を
  読むため。入力内容はどこにも送らない」
- プライバシーポリシーにその1文を書いておきます

---

## 12. 順番と、どこであなたを待つか

`1〜5` は済んでいます。プロファイル2枚を読んで確認しました。

| | 値 |
|---|---|
| Team ID | `9B2R9YPV5B` |
| 本体 | `com.tokinets.lingua` / プロファイル `Lingua Distribution` |
| 拡張 | `com.tokinets.lingua.keyboard` / プロファイル `Lingua Keyboard Distribution` |
| App Group | `group.com.tokinets.lingua` |
| 期限 | 2枚とも 2027-06-26 |

**拡張側のプロファイルには App Group が入っています。**
**本体側には入っていません。** 1-3 の本体の分だけが残っています。

### 残っている手順

| # | 誰 | やること | 次を止めるか |
|---|---|---|---|
| A | あなた | Secret `KEYBOARD_PROVISIONING_PROFILE_BASE64` を新規で入れる | 止めない |
| B | あなた | Identifiers → `com.tokinets.lingua` → App Groups にチェック → `group.com.tokinets.lingua` → Save | 止めない |
| C | あなた | Profiles → `Lingua Distribution` → Edit → Generate → Download → 送る | 止めない |
| D | こちら | C を base64 にして返す | |
| E | あなた | Secret `PROVISIONING_PROFILE_BASE64` を D で**上書き** | **F を止める** |
| F | こちら | `www/share.js` — 本体が `keyboard.json` を書き出す（§5） | |
| G | こちら | Capacitor プラグイン — App Group への書き出しとフォント登録（§9） | |
| H | あなた | ビルドの許可 → TestFlight で G を確認 | |
| I | こちら | 拡張ターゲット・Swift・Info.plist・entitlements・CI（§3,4,6,7,8） | E が要ります |
| J | あなた | ビルドの許可 → 実機で設定 → キーボード → フルアクセス → 確認 | |

**F と G は Apple 側を待ちません。** A〜E と並行してこちらで進めます。

**E を飛ばすと I の Archive が落ちます** — `provisioning profile doesn't
include the com.apple.security.application-groups entitlement`。
本体は App Group に**書く**側なので、拡張と同じだけの権限が要ります。

ビルドは毎回、許可をもらってから回します。

---

## 13. 最後に、出ないもの

**LINE・X・メッセージで、描いた字の形は出ません。** キーボードが渡せるのは
文字コードだけで、描くのは相手のアプリです。9 のフォント登録が効くのは
フォントを選べるアプリだけです。

**借りてきた文字**（`Ϙ` のような既存の記号を当てた文字）は例外で、
本物の Unicode 文字なので**どのアプリでも出ます。**
