# Lingua

## このアプリが目指すもの（北極星）

> **言語をつくりたいけど、知識がなくて諦めてきた人のためのアプリ。**

いま言語をつくれている人は、みんなある程度の言語学の知識を持っている。でもそれは
「知識がなかった人が全員あきらめた結果」でしかない。その**あきらめた側**が本当の対象。

素人がひとりでは越えられない壁は3つある：

1. **発音がわからない** → つづりを書いた瞬間に**発音記号（IPA）**と読みが決まり、声が出る
2. **単語が思いつかない・数が揃わない** → いまある語から規則を読み取り、その規則のまま量産する
3. **リンキングなど、音のつながりが難しい** → 語をつないだときどう聞こえるかを自動で見せる

### いちばん大事な線引き：これは全部「無料」

上の3つは **AI ではなく、端末の中のただの計算**でやっている。音節の切り出し、語末規則の集計、
つづり→IPA／カナの導出、再音節化、規則を守った語の生成。通信もアカウントも要らない。
だから **無料のまま、自分の手で言語を1本まるごと作りきれる**。

AI は「これがないと何もできない前提」ではなく、**上乗せ**。
意味からつづりを相談する、文法を一緒に設計する、テーマから語彙をまとめて作る──そこだけが Studio。

| プラン | 価格 | 中身 |
|---|---|---|
| Free | ¥0 | 自分の手でつくる全部・規則の自動分析・読みの自動導出・リンキング・規則にそった量産・端末保存 100語まで |
| Plus | $9/月 | 単語数 無制限・クラウド保存・CSV取り込み／書き出し（＋Free） |
| Studio | $19/月 | AIと共作（語形の相談・文法設計・例文）・テーマから語彙生成（＋Plus） |

### 見た目

**ダークとライトの2つ**。設定 →「見た目」で システム／ライト／ダーク を切り替える。
既定は「システム」。色は CSS の `html[data-theme]` 2ブロックにしか書いていないので、
画面側のコードを触らずに配色を足せる。

### 読みの見せかた（発音記号がいちばん上）

読みは **IPA（発音記号）が本体**で、カタカナは日本語話者むけの近似にすぎない。設定 →「ことばの読み」で
**発音記号／カタカナ／両方**（既定は両方）を選ぶ。`/ /` の中の `.` は音節の切れ目、`ː` は長音。
一語の詳細では音節ごとに IPA と読みを並べて出し、II 音 では在庫の子音・母音の一つひとつに IPA を添える。

### 多言語（何が言語に依存し、何が依存しないか）

3つの層に分かれていて、**依存しているのは真ん中の1層だけ**。

1. **発音記号（IPA）— 言語に依存しない。** 世界共通の記号なので、どの国の人が見ても同じものが出る。
   だからこれを本体に置いた。重複判定（`taken()` / `makeWord()`）も、カナではなく **IPA で衝突を見る**ので、
   UIの言語を変えても「同じ音の語が2つできる」ことは起きない。
2. **読みの近似 — 言語ごとに差し替わる（`APPROX` / `LANGS`）。** カタカナは日本語話者むけの近似で、
   英語話者には `AY-leen`（大文字＝強く読むところ）のような**綴り直し（respelling）**を出す。
   既定は端末の言語（`autoLang()`）、設定 →「読みを出すことば」で手で選べる（`SET.ui`）。
   ハングルでも拼音でも、`APPROX` と `LANGS` に1行ずつ足すだけで増える。読みを出す場所は全部
   `rd()` / `rdSyl()` の1本を通っているので、足したその瞬間に辞書・詳細・音節・リンキング・文・CSV の全部に効く。
3. **画面の文言 — まだ日本語だけ。** ここは未着手（日本語の文字列が371種）。ただし**保存されるデータに
   日本語は一切残っていない**ので、あとから訳しても既存の辞書は壊れない。品詞は `名詞` ではなく
   `n` / `v` / `adj` / `x` という鍵で保存し、画面に出すときだけ `posLabel()` が言語ごとの見出しに変える
   （古い形式で保存された辞書は起動時に自動で鍵へ移し替える）。**これが順番として先に必要だった部分。**

**わかっている制限：** 音韻エンジンはラテン文字を前提にしている（`VOW='aeiouy'` / `CONS` / `th`・`sh`・`ch` の二重字）。
キリル文字や梵字系のつづりを直接は扱えない。人工言語はローマ字表記で作るのが普通なので、当面はここで割り切る。

### 声（アプリ化後も鳴らすための作り）

WKWebView（＝Capacitor で包んだ iOS アプリ）でも Web Speech API は動く。ハマるのは3点だけで、全部対策済み：

1. **起動直後は `getVoices()` が空** → `voiceschanged` を待って読み直す（`loadVoices()`）
2. **その言語の声が端末に無い** → `VOICE_PREF`（it→es→pt→fi→ro→id→sw→la→ja→en）で近い母音体系の声を自動選択。設定 →「声」で手動選択もできる（`SET.voice`）。日本語の声しか無い端末では、つづりではなくカナを読ませる
3. **本体の消音スイッチ／音量0** → 設定の「声」に日本語で明記。`u.onerror` でトーストも出す

さらに保険として、`Capacitor.Plugins.TextToSpeech` が存在すればそちらを優先して呼ぶ分岐が入っている。
実機で Web Speech が鳴らなかった場合、`npm i @capacitor-community/text-to-speech && npx cap sync ios` の
1コマンドでネイティブ再生に切り替わる（JS側の変更は不要）。

### 画面の構成

オンボーディング（名前 → 最初の3語を自分で書く → 規則が見えはじめる）から始まり、
そのあとは**扉と目次**：I ことば / II 音 / III 規則 / IV 文 / V つくる、右上の歯車から設定。
初期辞書は入っていない。入っている語はすべて、その人が自分で書いたもの。

- **I ことば** … 辞書。語をタップすると詳細（IPA・読み・音節の切れ目とその音・意味・品詞）が開き、**なおす／消す**ができる
- **II 音** … 子音の在庫・使っていない音・母音（それぞれ IPA つき）・語をつないだときのリンキング
- **III 規則** … 見つかった癖の一覧と「つぎの一手」
- **IV 文** … **語数も並びも縛らない自由な編み台**。下の一覧から語をタップすると後ろに足され、
  タップして選べば前後に動かす・外すができる。同じ語を何度でも置ける。並べるそばから
  リンキング込みの IPA／カナが出て、そのまま声に出せる。
  語順（SOV／SVO／VSO）は**縛りではなく「自分で決めた規則」**として持っておき、
  主語・目的語・動詞の形になったときだけ「いまの並びは SOV です／決めた語順と違います」と**答え合わせ**する
  （`orderCheck()` / `fixOrder()`）。残した文は目次の扉にも出る
- **V つくる** … 規則を守った語の量産

### 中身（`www/index.html` の作り）
- `analyze()` … 辞書全体を読んで音節・音の在庫・品詞ごとの語末規則・語頭に立てる子音を**実際に集計**する
- `syl()` / `onsetOK()` … 音節に切る。語中の子音のかたまりは「頭に立てられる分」だけ次の音節に渡し、
  残りは前の音節の尻に置く（`silva` → `sil.va`、`ondra` → `on.dra`）
- `kana()` / `resp()` … つづりから読みを機械的に導出（人が読みを考えなくていい）。カナは日本語話者むけ、`resp()` は英語話者むけの綴り直し
- `APPROX` / `LANGS` / `rd()` / `rdSyl()` / `autoLang()` … 読みの近似を言語ごとに差し替える1か所。ここに1行足せば言語が増える
- `POS` / `posLabel()` / `posKey()` … 品詞は `n`/`v`/`adj`/`x` の鍵で保存し、見出しだけ言語ごとに変える。古い日本語の値は起動時に移行
- `srcKey()` … 検索はつづり・意味・読み・発音記号のどれに当たっても拾う
- `ipa()` / `ipaSyl()` … つづりから発音記号を導出。`.` は音節境界、同じ母音の連続は `ː`
- `readOut()` / `readLink()` / `readMode()` … 設定の「ことばの読み」に応じて IPA／読み／両方を出し分ける単一の窓口
- `loadVoices()` / `pickVoice()` / `speak()` … 声まわり。`voiceschanged` 待ち・言語優先順位・
  手動選択・日本語声へのカナ差し替え・ネイティブTTSプラグインへの分岐が全部ここ
- `linked()` … 語末子音を次の語の頭にくっつけて再音節化＝リンキングの可視化。IPAと読みの両方を返す
- `makeWord()` … 推定した規則（語末・音節数・音素配列）を守って新語を生成。つづりも読みも既存語と衝突しないようにする
- `findings()` / `nextHint()` … 見つかった癖を日本語の文にし、次に何を書けば規則が増えるかを返す
- `vSent()` / `comp[]` / `compAdd()` … 自由な文の編み台（語数無制限・重複可・並べ替え・取り消し）
- `ORDERS` / `orderCheck()` / `fixOrder()` … 語順は規則として保持し、並びの答え合わせにだけ使う。文は `lingua.lines` に保存
- `openWord()` / `saveWord()` / `delWord()` … 一語の詳細・修正・削除
- `PLANS` / `has()` / `capOK()` … プランの線引きはここ1か所だけ
- 旧版は `www/_v1-notebook.html.bak`（黒×金）と `www/_v2-paper.html.bak`（紙×赤）に残してある

---

# iOS 配信（JPEL Manager 手順書ベース）

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

---

# Web版プレビュー（Vercel）— 開発中にスマホで触る用

App Store版とは別に、**同じ `www/index.html` を Vercel で公開**して、開発中いつでもスマホで最新を触れるようにできます（審査・証明書・Mac不要）。

- リポジトリ直下の `vercel.json` により、**Vercelは追加設定ゼロ**で `www/` を配信します（`public/` にコピーして静的公開）。
- Vercel でこのGitHubリポジトリをインポート → ドメインに `lingua.tokinets.com` を追加するだけ。
- 以降は **main へ push するたび自動で本番反映**。iOSアプリのビルドは `build-*` タグの時だけなので、**普段のpush＝Web更新／タグ＝アプリ配信**ときれいに分かれます。
- 追加した単語・言語名は端末に**保存(localStorage)**されるので、リロードしても消えません。

## 帰宅後の go-live 手順（PCがあれば5分）
1. このリポジトリを GitHub に push（`git push`。いつもの保存済みログインでOK）
2. Vercel → Add New → Project → このリポジトリをインポート（設定はそのままでOK。`vercel.json` が効きます）
3. Vercel の Project → Settings → Domains → `lingua.tokinets.com` を追加
4. 反映を確認 → 以降は push するたび自動更新
