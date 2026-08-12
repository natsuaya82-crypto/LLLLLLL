# システムキーボード（Keyboard Extension）— 必要なもの全部

**書きました。**この文書は仕様書であり、いまは書いたものの説明でもあります。
実機で動かしたことはまだありません（J）。

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

## 3. リポジトリに増えたファイル

```
ios/App/
  App/
    App.entitlements                  ← 本体に App Group を付ける
  LinguaKeyboard/                     ← 拡張のターゲット
    Info.plist
    LinguaKeyboard.entitlements
    KeyboardViewController.swift      ← 入口。読み込みと組み立て、三つの状態
    KeyBoardView.swift                ← キーの並びと当たり判定・フリック
    Compose.swift                     ← 打っているが未確定のもの（変換・綴り候補）
    CandidateBar.swift                ← キーの上の1本のバー。Compose を描くだけ
    GlyphView.swift                   ← 1文字を Core Graphics で描く
    Shared.swift                      ← App Group から JSON を読む。Face/Key/Layer/Board/Conv
ios/App/App.xcodeproj/project.pbxproj ← 手で編集（後述）

www/
  share.js                            ← App Group に書き出す側（第23章）
  index.html                          ← share.js の script タグ

（Capacitor プラグイン）
  ios/App/App/LinguaShare.swift       ← www から呼ばれる native 側
                                         書き出し＋フォントのシステム登録
```

4つと書いていたのは古い数です。**Swift ファイルは6つ**あります。
`Compose.swift` と `CandidateBar.swift` は §14 の変換（ピンイン式）のために
アプリ内キーボードが消えた後で足されました — バーと溜まりは、変換のある
書き方でもアルファベットでも同じ機械が動くので、1ファイルです（§14参照）。

**この2つと、それに合わせた `KeyboardViewController.swift`／`Shared.swift`
の変更分は、#41 より後に足されたコードで、まだ一度もコンパイルされて
いません。** #41 でコンパイルが通って TestFlight に上がったのは、この2ファイル
が無かった時点の拡張です。今リポジトリにある拡張のコードそのもの
（変換を含む今の6ファイル一式）は、#41 以降ビルドが一度も回っていないので、
**まとめて通るかどうかはまだ分かっていません。**（§12参照）

アプリ内キーボード（`www/keyboard.js` の `kbField`/`kbUp`/`kbFlick` ほか）は
**もう無い**。「アプリ内キーボードいらないでしょ。アップル拡張だけ。」で
削除済みで、キーボードが打てる場所はこの拡張だけです。

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
書いているのは `www/share.js`（第23章）です。

```json
{
  "v": 1,
  "lang": "L7",
  "name": "Shango",
  "box": 800,
  "lay": [
    {
      "rows": [
        [
          { "k": "lt",
            "t": "a",
            "st": [ [[370,40],[430,40],[430,760],[370,760]] ],
            "w": 1,
            "f": [
              { "t": "i", "st": [ [[200,200],[600,200],[600,300]] ] },
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
| `st` | **塗る多角形の列。**閉じた凸多角形が `[[x,y],…]` で並ぶ |
| `box` | `st` の座標系。一辺 `box` の正方形、x は右、**y は下** |
| `w` | 行の中の取り分 |
| `f` | フリック 上・右・下・左。無い向きは `null`。全部無ければ `f` ごと無し |

**`st` は線ではなく、塗り終わった形です。** ここが仕様から変わった一点で、
理由は §0 に書いてある通りです。線を送ると、拡張が b スプライン・角丸め・
ペン先の凸包（`LinguaFont.glyphContours` 全部）を Swift で書き直すことに
なります。`GPEN` を一度でも触った日に、キーの上の文字とアプリの中の文字が
黙って食い違います。凸包はここで一度だけ計算します。`inkStrokes` が画面に
塗るのと同じ呼び出しです。

だから `pen` は載せません。ペンはもう形の中にあります。

**拡張がキーの面を描く規則は3行です** — アプリの `ltInk()` と同じ順番:

1. `st` があれば、その多角形を塗る
2. 無くて `ch` があれば（`Ϙ` のような借りてきた文字）、それを文字として描く
3. どちらも無ければ `t` をそのまま文字として描く

- **`next`（🌐）はアプリが足します。** アプリの中のキーボードには行き先が
  無いので、誰も置いていません。Apple は拡張に必ず要求します。だから
  `shareRows()` が最後の行の**左端**に足します。どの iPhone のキーボードも
  そこに置いている場所です。**人が置いていない唯一のキー**
- **書くタイミング**: `render()` の中で署名が変わったときだけ。
  文字・レイアウト・プラン・開いている言語のどれが動いても署名が動きます。
  `saveLetters()` と `saveKb()` と `langOpen()` の3箇所に書くと3箇所忘れ
  られるので、`installScriptFont()` がフォントを建て直すのと同じ一行で、
  同じ理由です
- **フォントは同じ1回の呼び出しで渡します** — `p.write({json, font})` の
  `font` が `LinguaScript.otf` の base64。プラグインが2つのファイルに
  書き分けます（§9）

---

## 6. 拡張の中身（Swift）— 書いてあるものを読んだ結果

**状態が2つに分かれています。** #41 でコンパイルが通って TestFlight に
上がったのは、`KeyboardViewController`・`KeyBoardView`・`GlyphView`・`Shared`
が変換をまだ知らなかった時点のコードです。そのあとに足された変換
（`Compose`・`CandidateBar`、そして `KeyboardViewController`/`Shared` の
変換対応の追加分）は、**まだ一度もコンパイルされていません。** 以下は
今リポジトリにあるコードそのものの説明で、どちらの状態のコードかは
その場で書きます。実機で動いたことは、どちらの状態についても
**まだ一度もありません。**

### KeyboardViewController

**三つの状態**を持ち、自分がどれにいるかだけを言います。空のキーボードには
絶対になりません。

```
UIInputViewController を継承

build()（毎回、全部作り直す。層の切替もこれ一本）
  hasFullAccess が false
    → Say.full()「設定 → 一般 → キーボード → キーボード → Lingua →
       フルアクセスを許可」を1行出す

  hasFullAccess は true だが Shared.board() が nil
  （App Group が読めない／keyboard.json が無い／lay が空）
    → Say.draw()「先に Lingua で文字を描いてください」を1行出す

  board が読めた
    → KeyBoardView を貼る。board.conv があれば Compose を作り、
       その上に CandidateBar も貼る（無ければバーは無し）
```

高さは `rowHeight(54) × 行数 + 8 + (バーがあれば barHeight(44))` を
`NSLayoutConstraint` 1本で持ち、次の `build()` では作り直さず値だけ書き換えます
（作り直すと制約が1回ごとに積み上がって iOS が壊し始めるため）。

`needsInputModeSwitchKey` が false の場合だけ 🌐 を落とします
（iPad の外付けキーボードなど、拡張自身に聞かないと分からないので）。

**キー入力の流れ**は `KeyBoardView` からの delegate 1本 —
`keyboard(_:didPress:face:)` — を `KeyboardViewController` が受けて、
`textDocumentProxy` を叩くのはここだけです。`KeyBoardView` 自身は
文字を挿しません。

**ここから下（`typed`/`back`/`settle`/`drop`/`commit`、`CandidateBarDelegate`、
`compose`/`bar` フィールド）は変換のために足された分で、#41 には無く、
まだコンパイルされていません。** #41 で通ったのは `lt`/`sp`/`del`/`next`/`lay`
を素直に `insertText`/`deleteBackward` に渡すだけの、もっと単純な版です。

- `lt` / `rom`（フリック含む）→ `typed(_:)` → `Compose` があれば
  `push()`。`holdsText`（= ローマ字面）でなければ**押した瞬間に挿す**。
  ローマ字面は溜めるだけで挿さない
- `sp` → `settle()`（先頭候補を確定。無ければ溜まりをそのまま挿す）→
  スペースを1つ挿す
- `del` → `back()`。溜まりがあれば1つ減らす。ローマ字面でなければ
  ドキュメント側も1文字消す
- `lay` → 溜まりを捨てて層を差し替え、`build()` をもう一度
- `next` → 溜まりを捨てて `advanceToNextInputMode()`
- バーの候補をタップ → `commit(_:)`。ローマ字面でなければ挿してある溜まりを
  `deleteBackward()` で戻してから候補を挿す
- `viewWillAppear` のたびに `compose` を捨てて `build()` をやり直す —
  裏にいる間にアプリが文字を描き足しているかもしれないので

`Compose` が無い言語（`board.conv` が無い、= `wsys()` が `alpha`/`abjad`）
では、キーはそのまま挿すだけで、これは元の仕様どおりです。

### KeyBoardView

- **UIStackView ではありません。** `layoutSubviews()` で自前に幅を計算します
  — 行の中の `w` の合計に対する比で `bounds.width` を割るだけの算数で、
  StackView の multiplier より短いという判断です
- **1行10キーで1キー約35pt** になります。iOS 標準と同じで、これが普通です
- タップ / フリックの結果は `didPress` 1本で `KeyboardViewController` に渡すだけ
  — `insertText` はここでは一切呼びません
- **フリック**: `touchesBegan` で開始点、`touchesEnded` で移動量。
  **18pt 未満（2乗で324）はタップ**、それ以上なら縦横の大きい方の向き。
  `www/keyboard.js` の `kbUp()` と同じ数字・同じ判定にします
- 押している間のハイライト（`KeyView.hold()`）。フリック中の方向プレビューは
  **まだありません**

`lay` キーが行き先の層の頭文字を自分の顔にする分（第2面のため）は #41 の
あとに足された小さな変更で、これもまだコンパイルされていません。

### Compose

**新規ファイル。まだコンパイルされていません。**「打っているが、まだ
文書に確定していないもの」を持ちます。§14 の変換とアルファベットの
綴り候補は、同じ機械の2つの見え方で、だから1ファイルです。

- `romanKeys`（`conv.how` が `syll`/`abugida`/`logo`）なら、押しても
  **何も挿さず**溜める側。それ以外（`alpha`/`abjad`）は押した文字が
  そのまま挿さり、溜まりは「続きの候補」を出すためだけに存在します
- `candidates()` — 完全一致を先頭に、あとは前方一致を短い順・辞書順。
  最大24件。押すたびに並びが変わらないのは、狙って押すためです
- `push`/`back`/`clear`、`first()`（スペース確定用）
- 値型（struct）です。1回のキー入力が1回の代入で、溜まりを捨てるのが
  1行で済むのはこのためです

### CandidateBar

**新規ファイル。まだコンパイルされていません。** キーの上の1本のバー。
**中身は Compose が決め、バー自身は何も判断しません。** 左に固定で今の溜まり、
右にスクロールする候補（`CandidateCell`、各候補は正方形のグリフを横に
並べたもの）。候補をタップで `didPick` を発火します。

### GlyphView

#41 以降、ここは触っていません。**多角形を塗るだけです。**

ここは元々「`www/otf5.js` の `bar` / `hull` を Swift に写す。同じ規則を
2回書くことになる」と書いてありました。**書かずに済みました** —
`st` を線から塗り終わった形に変えたのが F で、その理由がこれです。

写していたら、b スプライン・角丸め・ペン先の凸包が Swift 側にもう一組
できていました。`GPEN` を触った日に、キーの上の文字とアプリの中の文字が
黙って食い違って、**どちらの側の check にも見えません**。

- `st` の多角形を `CGContext` で `fillPath()`
- `st` が無ければ `ch` を文字として描く
- `ch` も無ければ `t`（＝文字の名前）を描く

3つの順番は `ltInk()` と同じです。同じ質問だからです。

**正方形に収めます。** `box` を辺とする正方形をビューの短辺に合わせて中央に
置きます。タイルとキーは正方形というのが本体の規則で（`inkCanvases`）、
1行に並べるときの規則はそれとは別（`inkAdv`）。キーはタイル側です。
`CandidateBar` の1候補の中でも同じ規則で、`inkAdv` 側の詰め方はしていません
（§14「拡張の中で何が起きるか」の下に理由あり）。

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

書いてあるのは `ios/App/App/LinguaShare.swift` です。Capacitor プラグイン
1枚で、メソッドは2つしかありません。

| | |
|---|---|
| `write({json, font})` | `keyboard.json` と `LinguaScript.otf` を App Group に置く。`www/share.js` が呼ぶ |
| `registerFont()` | その otf を iOS に登録する。**まだ誰も呼んでいません**（下） |

`write` の細かいところ2つ。どちらも実機でしか出ない類です:

- **`.atomic`** — 拡張が読んでいる最中かもしれないので、丸ごと置き換わるか
  何も起きないかのどちらかにします。半分書けた JSON はキーの無い
  キーボードです
- **`.completeFileProtectionUntilFirstUserAuthentication`** — 既定の保護
  だとロック中のファイルが読めません。キーボード拡張はアプリが見ない状態で
  起こされるので、既定のままだと**再起動後に文字が消えます**。誰も再現
  できないバグになります

`registerFont` はボタンです。**自動では絶対に呼びません** — iOS が毎回
「Lingua がフォントを追加しようとしています」と確認を出すので、文字を1画
描くたびにそれが出ることになります。ボタンはまだ作っていません（画面が
増えるので、見てもらってから）。

- native 側で `CTFontManagerRegisterFontURLs(urls, .persistent, true, ...)`
  — その前に必ず unregister します。文字を描くたびにフォントは建て直される
  のに、同じ URL の二度目の登録はエラーで、登録し直さないと**最初に登録した
  日のアルファベットが出続けます**
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

`A` `B` `C` `D` `E` `F` `G` `I` は済みました。ビルドは3回回っています:

| # | 中身 | 結果 |
|---|---|---|
| #39 | 本体のみ（拡張は入れていない） | **成功。** TestFlight に上がった |
| #40 | 拡張を初めて足したビルド | **失敗。** 拡張が Swift のコンパイルで止まった |
| #41 | #40 のコンパイルエラーを直したもの | **成功。拡張が埋め込まれて** TestFlight に上がっている |

残っているのは **`J` だけ**です。`I` は「書いた」も「コンパイルが通った」も
済んでいますが、**実機で動かしたことはまだありません。** #41 が意味するのは
アーカイブが通って TestFlight に上がったということだけで、フルアクセスを
与えて文字を打ってみたということではありません。それを確かめるのが `J` です。

| | 値 |
|---|---|
| Team ID | `9B2R9YPV5B` |
| 本体 | `com.tokinets.lingua` / プロファイル `Lingua Distribution` |
| 拡張 | `com.tokinets.lingua.keyboard` / プロファイル `Lingua Keyboard Distribution` |
| App Group | `group.com.tokinets.lingua` |
| 期限 | 2枚とも 2027-06-26 |

両方のプロファイルに `group.com.tokinets.lingua` が入っているのを、
ファイルを読んで確認済みです。

### #40 で何が起きたか

Archive は最初のエラーで止まり、その1つ先が見えません。1つ直してはまた回す
のではなく、ファイルを開いて拾えるだけ拾って一度に直しました:

- `KeyView` の真ん中の `GlyphView` を `center` という名前にしていた —
  `UIView` に既にある `CGPoint` の `center` と衝突していた
- `KeyBoardView.init` の最初の引数ラベルが `layer` だった — 通る名前だが
  紛らわしいので変更
- `KeyboardViewController` の `layer`（層番号の `Int`）が、隣に
  `CALayer` を持つ十数個のビューと同じ名前だった
- `UILayoutPriority` を算術式のまま使っていた — `UILayoutPriority(999)`
  と書き直した
- `Shared.swift` が `import Foundation` だけで `CGFloat` を使っていた

直したのが #41 です。**それ以降、拡張のコンパイルが失敗したことはありません。**

### 残っている手順

| # | 誰 | やること | 状態 |
|---|---|---|---|
| A | あなた | Secret `KEYBOARD_PROVISIONING_PROFILE_BASE64` を新規で入れる | 済（#41 で実際に読まれ、署名に使われた） |
| B | あなた | Identifiers → `com.tokinets.lingua` → App Groups に `group.com.tokinets.lingua` | 済 |
| C | あなた | `Lingua Distribution` を Generate し直して送る | 済 |
| D | こちら | C を base64 にして返す | 済 |
| E | あなた | Secret `PROVISIONING_PROFILE_BASE64` を上書き | 済（#39 が `ad97daaf` で署名） |
| F | こちら | `www/share.js` — 本体が `keyboard.json` を書き出す（§5） | 済 |
| G | こちら | `LinguaShare.swift` — App Group への書き出しとフォント登録（§9） | 済 |
| H | あなた | ビルドの許可 → TestFlight（拡張なし） | 済（#39） |
| I | こちら | 拡張ターゲット・Swift・Info.plist・entitlements・CI（§3,4,6,7,8） | 済（#41 でコンパイルが通り、埋め込まれて TestFlight に上がった。**実機は未確認**） |
| **J** | **あなた** | **実機でフルアクセスを与え、キーボードを開いて打ってみる** | **残** |

### H・I で確認できたこと／できていないこと

H（#39）は**拡張の入っていないビルド**でした。確認できたのは、本体が
App Group に書けているかどうかだけで、それは画面には出ません。

I（#41）で拡張は初めてコンパイルを通り、`.appex` として本体に埋め込まれ、
TestFlight に上がりました。**これでも確認できたのはアーカイブが通ることまでです。**
拡張はまだ一度も起動していません。フルアクセスの画面も、実際のキーの並びも、
フリックも、実機の指では一度も触られていません。

**しかも #41 が通したのは、変換を知らない時点のコードです。** §14 の変換
（`Compose`・`CandidateBar`、`KeyboardViewController`/`Shared` の変換対応
部分）は #41 のあとに足されたもので、**まだコンパイルすらされていません。**
（§3・§6参照）候補が正しく出るかも `space` で確定するかも以前に、この分を
含めた拡張全体がもう一度コンパイルを通るかどうかが、まだ確かめられていません。

キーボードが Messages や設定の一覧に出るかどうかは `J` です。

ビルドは毎回、許可をもらってから回します。

---

## 13. 最後に、出ないもの

**LINE・X・メッセージで、描いた字の形は出ません。** キーボードが渡せるのは
文字コードだけで、描くのは相手のアプリです。9 のフォント登録が効くのは
フォントを選べるアプリだけです。

**借りてきた文字**（`Ϙ` のような既存の記号を当てた文字）は例外で、
本物の Unicode 文字なので**どのアプリでも出ます。**

---

## 13.5 キーの隅の、そのキーが打つ文字

自作文字を貼ったキーは、**それがどのキーなのかを何も言いません。**
QWERTY は覚えている人にとっての配置であって、キーボードを見て読み取れる
ものではないので、覚えていない人には「形が30個あるだけ」になります。

> 「qwarty暗記してない人は自作文字でどのアルファベットかわからなくなるやん？
>   小さく右下にアルファベット表示とかできないかな？」

`Key.t`（そのキーが打つ文字）は最初から拡張に渡っていました。描いていなかった
だけです。`KeyView` が右下の隅に小さく出します。

条件は2つ。

```
  k == "lt"        文字のキーだけ。space も delete も globe も要らない
  st != nil        面が「描かれた形」のときだけ
                   面がすでに文字や借用文字なら、同じことを二度言うことになる
```

四方向のフリック面は辺の中点に置かれているので、**隅は空いています。**
4つ全部が埋まっているキーでも重なりません。

**実機でしか見られません。**Linux 側に Swift はないので、`npm test` も
`assets-check` もこの見た目については何も言いません。確認はビルド後の
実機で。

## 14. 変換（ピンイン式）— 設計

**まだ作っていません。**これは決めたことの記録です。

### なぜ要るのか、どの言語に要るのか

「qwertyでうって変換する中国語のピン音スタイルもあるやん？」

アルファベットの言語には要りません。`a` を押せば自分の a が出るので、それが
`kbFixed()` そのものです。要るのは、**打つ単位と書く単位が違う**書き方です。

| `wsys()` | ローマ字面 | バーに出るもの |
|---|---|---|
| `syll` 音節文字 | 要る | 変換候補。`ka` と打って **ka** を書く1文字 |
| `abugida` | 要る | 同上。子音＋母音記号を組んだ1文字 |
| `logo` 表語文字 | 要る | 同上。単語まるごと |
| `alpha` アルファベット | 要らない | **綴りの候補**。打ちかけの単語で始まる辞書の語 |
| `abjad` アブジャド | 要らない | 同上 |

**設定はありません。**`wsys()` が既に答えを持っているので、そこから決まります。
無料プランは必ず `alpha` なので、ローマ字面は有料だけの話です。

**バーは1本で、中身が変わるだけです。**アルファベットの人に出るのは
スペルチェックですが、それは同じバーの別の中身であって、別の部品ではありません。
`ink` と `map` はどちらの用途でも同じものを読みます。

### 何を渡すか

`keyboard.json` に2つ足します。

```json
"ink":  [ {"t":"ka","st":[…]}, {"t":"ki","st":[…]}, … ],
"conv": { "how":"syll", "max":12,
          "map": { "ka":[0], "ki":[1], "kano":[0,7] } }
```

| 鍵 | 意味 |
|---|---|
| `ink` | 出てくる形を**1つずつ1回だけ**。`lay` のキーと同じ `{t,st,ch}` |
| `conv.how` | `wsys()` の値そのまま。無ければ変換なし |
| `conv.max` | `map` の鍵の最大長。拡張はこれ以上溜めても当たらないと分かる |
| `conv.map` | 打ったローマ字 → `ink` の番号の並び |

**番号で指すのは飾りではありません。**同じ文字が何十語にも出るので、形を
`map` に直に入れると桁が変わります。音節文字180字・辞書5000語で測った値:

```
  ink                                51.1 KB
  map（文字＋単語）                 144.2 KB
  合計                              195.2 KB
  文字だけ（単語を入れない場合）      53.1 KB
  形を map に直に入れた場合         4396.7 KB   ← やってはいけない方
```

単語ぶんは +142 KB。拡張のメモリで問題になる大きさではありません。**単語は
入れます。**

これは §5 の「id も参照も入れません。載せます」に反していません。参照先は
**同じファイルの中**で、読む側は何も持っていなくても解けます。禁じているのは
**アプリ側の id**（`LETTERS` の `l3_2_5`）を渡すことで、それは拡張が解けません。

### 拡張の中で何が起きるか

ローマ字面のキーは**文字を挿しません。**溜まります。

```
┌────────────────────────────────────────┐
│  ka                 ⌐  ㇰ  ㇱ         │ ← バー。左に溜まり、右に候補
├────────────────────────────────────────┤
│  q  w  e  r  t  y  u  i  o  p          │ ← ローマ字。自分の文字ではない
│   a  s  d  f  g  h  j  k  l            │
│    z  x  c  v  b  n  m       ⌫        │
│  🌐  あ            space               │
└────────────────────────────────────────┘
```

- 候補を押す → その並びを挿し、溜まりを空にする
- **space → 先頭の候補で確定**（ピンインと同じ）
- `⌫` → 溜まりが1文字減る。空なら `deleteBackward()`
- 溜まっている間に面を変えたら、溜まりは捨てる
- `max` を超えても当たらなければ、溜まりを捨ててローマ字をそのまま挿す

`alpha` の側は溜まりが違います。**押した自分の文字が溜まり**、辞書の語で
それに続くものがバーに出ます。押すと残りが入る。ローマ字面は出しません。

### 打ちかけを本文に出すのは、後

日本語入力の下線付きの未確定文字は `setMarkedText` で、iOS 13 で他社製
キーボードにも開いたはずですが、**Linux では確認できません。**

順番:

1. **バーだけ**で作る。どのアプリでも確実に動く
2. 未確定の本文表示は、実機で API が生きているのを確かめてから足す

逆順にすると、動かなかった時に作り直しになります。

### 決まっていること

- 単語も候補に入れる
- ローマ字面は、変換が要る書き方では**1面目**にする（音節文字を作った人は
  ほぼ常にローマ字で打つので、毎回切り替えさせる理由がない）
- バーは1本。中身は `wsys()` が決める。設定は作らない
