# キーボードを iPhone のキーボードにする — Apple 側の手順

**まだ作っていません。** これは作る場合に必要なものの一覧です。

先に切り分け:

| | Apple 側の設定 |
|---|---|
| **いまのアプリ内キーボード** | **要りません。** webview の中の HTML なので、App Store Connect にも Apple Developer にも登録するものがありません |
| **システムキーボード（Keyboard Extension）** | 要ります。以下が全部 |

「LINE でも X でも Lingua のキーボードが出る」やつが後者です。

---

## 1. Apple Developer（developer.apple.com）

Certificates, Identifiers & Profiles で。**全部で 20〜30 分**です。

### 1-1. 拡張の App ID を作る

Identifiers → **＋** → App IDs → App → **Explicit**

- Description: `Lingua Keyboard`
- Bundle ID: **`com.tokinets.lingua.keyboard`**
  （本体の Bundle ID の前方一致でないと拡張として認められません）
- Capabilities: **App Groups** にチェック

### 1-2. App Group を作る

Identifiers → 右上のプルダウンを **App Groups** に切り替える → **＋**

- Description: `Lingua Shared`
- Identifier: **`group.com.tokinets.lingua`**

これがアプリと拡張の間の唯一の通り道です。書いた文字もフォントもここを通ります。

### 1-3. 両方の App ID をグループに入れる

- `com.tokinets.lingua`（本体）を開く → App Groups → **Edit** → 上のグループを選ぶ → Save
- `com.tokinets.lingua.keyboard` も同じ

### 1-4. プロビジョニングを2枚

Profiles → **＋** → Distribution → **App Store Connect**

- 拡張用: App ID = `com.tokinets.lingua.keyboard` / 名前 `Lingua Keyboard Distribution` → Download
- 本体用: **既存の `Lingua Distribution` を Edit → Generate → Download**
  （capability を足したので、古いものは使えません。作り直しが必要です）

### 1-5. GitHub の Secret に入れる

`.mobileprovision` を base64 にして:

- 本体 → 既存の `APPLE_PROVISIONING_PROFILE_BASE64` を**差し替え**
- 拡張 → 新しく `APPLE_KB_PROVISIONING_PROFILE_BASE64`

`base64 -i Lingua_Keyboard_Distribution.mobileprovision | pbcopy`

Mac がなくても、ファイルを送ってもらえればこちらで変換して Secret の値を返せます。
（Secret 自体はあなたが GitHub の画面で貼ってください。こちらからは書けません）

---

## 2. App Store Connect

**拡張の App レコードは作りません。** 本体アプリの中に入って一緒に出ます。

やることは1つだけ:

- **App のプライバシー** — フルアクセス（後述）を取るので、審査で
  「何に使うのか」を聞かれることがあります。何もサーバーに送らないなら、
  プライバシーポリシーにその一文を足しておくのが安全です

---

## 3. あなたの iPhone でやること（毎回の使用者がやること）

インストールしただけでは出ません。**使う人が必ず自分でやります**:

1. **設定** → **一般** → **キーボード** → **キーボード**
2. **新しいキーボードを追加** → 他社製キーボードの **Lingua**
3. 追加したあと、**もう一度 Lingua をタップ**
4. **フルアクセスを許可** をオン → 警告に「許可」

4 が要る理由: フルアクセスがないと、拡張は App Group の中を読めません。
つまり**あなたが描いた文字を取り出せません**。オフのままだと空のキーボードです。

iOS はここで「入力したすべての情報にアクセスできる可能性があります」という
強い警告を出します。これは iOS が全部の他社製キーボードに出す文言で、消せません。

使うとき: どのアプリでも **🌐 を長押し → Lingua**。

---

## 4. 審査で落ちるところ

- **🌐 キー（次のキーボードに切り替える）が必須。** これが無い他社製キーボードは
  通りません
- **メモリ**が本体よりずっと厳しい。フォントを組み立てる処理を拡張の中で
  やると落ちます。作るなら、本体で組んだ結果を App Group に置いて、拡張は
  読むだけにします
- フルアクセスを取る他社製キーボードは、**何のために取るのか**を聞かれます

---

## 5. 先に知っておいてほしいこと（ここが本題）

**他のアプリの入力欄に入るのは「文字」であって「字の形」ではありません。**

キーボードができるのは、相手のアプリに文字（`a` `b` `c` …）を渡すことだけです。
それをどう描くかは相手のアプリが決めます。LINE も X もメッセージも自分の
フォントで描くので、**Lingua で描いた字の形にはなりません。**
あなたが前に言った通りです。

抜け道は1つだけあります。iOS 13 から、アプリはフォントを**システムに**入れられます
（`CTFontManagerRegisterFontURLs` の persistent）。入れると:

- **フォントを選べるアプリ**（Pages / Keynote / メール / メモ / Word など）では
  Lingua のフォントを選べて、**そこでは自作の字で出ます**
- **フォントを選べないアプリ**（LINE / X / メッセージ）では出ません。ここは
  どうやっても無理です

そしてこの抜け道には、**キーボード拡張は要りません。**
フォントをシステムに入れるだけで済みます。

---

## 6. どっちを作るか

| | できること | こちらの作業 |
|---|---|---|
| **A. 何もしない**（いま） | アプリの中では自作の字で書ける | 済み |
| **B. フォントをシステムに入れる** | Pages・メモなどで自作の字が使える。Apple 側の設定は**不要** | 小。本体に登録処理を足すだけ |
| **C. キーボード拡張** | どのアプリでもキー配列は Lingua。ただし**字の形は出ない**（B を併用して、B が効くアプリでだけ出る） | 大。Swift の新ターゲット、App Group、キーを Core Graphics で描き直し、pbxproj を手で編集、CI に2枚目のプロファイル |

**C だけを作っても、見た目は何も変わりません。** B と組み合わせて初めて
意味が出て、その B は Apple 側の設定が1つも要りません。

やるなら **B から**を勧めます。C も要るなら言ってください。
