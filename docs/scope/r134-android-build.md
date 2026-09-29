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

---

# 報告（2026-09-29）

## どこまで通ったか

| run | 結果 | 何が分かったか |
|---|---|---|
| Android build #1 | 失敗 | `res/xml/file_paths.xml` のコメントに `--` があり、XML として読めない（`mergeDebugResources`、ログで確認）。`:` に書き換えた。他の XML は全部読めることを確かめた |
| Android build #2 | 取り消し | 直す前のコミットのまま投げてしまった物 |
| Android build #3 | **成功** | Kotlin も全部コンパイルが通り、debug の APK と署名なしの AAB（`lingua-android-3`） |
| Android build #4 | **成功** | GOOGLE_WEB_ID を入れる段を足した後。Secret が無いので「Google は閉じている」の警告で通る |

- **CODE CONFIRMED**: 鍵が無い時の道（debug APK + 署名なし AAB）、`GOOGLE_WEB_ID` の段の三通り（無い・正しい・形が違う）を手元で、`assets-check` の新しい一文が赤くなるのを見た（`net.js` の行を書き換えて 0 回 → 戻して緑）。`android-keygen` の中身を手元の keytool で同じ手順で回した（jks・base64・SECRETS.txt ができ、指紋が出る。パスワードは紙にだけ）。`tools/play-upload.mjs` は偽のサービスアカウントで Google まで届き、`account not found` と断られる所まで。
- **Actions で回していない**: `android-keygen.yml` と `android-release.yml`。新しい workflow は**既定の枝に入るまで手で押せない**（dispatch が 404）。一時的に push で動かす道は取らなかった。署名した AAB を作る段も、鍵が Secrets に入るまで回らない。
- **DEVICE**: 見ていない（APK を端末に入れていない）。

## 変えた物

- `android/app/src/main/res/xml/file_paths.xml` ── コメントの `--` だけ。
- `.github/workflows/android-build.yml` ── 鍵が無い時も `bundleRelease`（署名なし AAB）を組む。`GOOGLE_WEB_CLIENT_ID` を写しの `net.js` に入れる段。頭のコメント。
- `.github/workflows/android-keygen.yml`（新）── 押すとアップロード鍵。成果物 `lingua-upload-key`（3 日）に `upload.jks`・`upload.jks.b64`・`SECRETS.txt`。ログと Summary には指紋（SHA-1 / SHA-256）だけ。
- `.github/workflows/android-release.yml`（新）── 成功した「Android build」の成果物の AAB を、署名を確かめてから内部テストへ。run 番号を選べる（空なら一番新しい成功）。`completed` / `draft` を選ぶ。`GOOGLE_PLAY_SERVICE_ACCOUNT` が無ければ手順を書いて止まる。
- `tools/play-upload.mjs`（新）── 依存なし。サービスアカウントの JWT → token → edits.insert → bundles.upload → tracks.update → commit。
- `tools/assets-check.mjs` ── `android-build.yml` の `WEB_ID_LINE` を読み、`www/net.js` にその行がちょうど一つあること。
- `www/net.js` ── `GOOGLE_WEB_ID` の上のコメントだけ（値の行は空のまま）。

**保存される物・消える物**: 無い。言語もアカウントも触らない。

## 決めたこと（理由つき、オーナーのものではない仕組みの形）

- **`__NAME__` の置き換えにしなかった**: `www/` は iPhone にも入る。`net.js` に `__GOOGLE_WEB_CLIENT_ID__` と書くと iOS には埋まらないまま出る ── build 86（ITMS-90158）と同じ形。だから空の行はそのままで、Android の写しの中の**その行**を置き換え、行が無ければビルドが止まる。
- **versionCode の番号は一本**: 上げる workflow は組み立てず、「Android build」の成果物を上げる。versionCode はその run 番号。二つの workflow が別々に番号を持つと同じ番号がぶつかる。
- **`GOOGLE_PLAY_SERVICE_ACCOUNT` は `verify-plan` と同じ名前**: 同じサービスアカウントに、リリースの権限を足せば一つで済む。

## docs/ANDROID.md（r135）とずれる所 ── 私は触っていない

- § オーナーがすること 2 は「手元で keytool」── 今は Actions の「Android keygen」を押す。
- § 4 は「`www/net.js` の引用符の中に入れる」── 今は Secret `GOOGLE_WEB_CLIENT_ID`。コードは触らない。
- § ビルドは「無い時: debug の APK だけ」「Play への提出はしない」── 今は署名なし AAB も作り、`android-release.yml` がある。

---

# オーナーがする作業（この順番で）

GitHub の画面と Google の画面だけ。ターミナルは要らない。

**0. 待つこと**: この枝が既定の枝（`master`）に取り込まれるまで、1〜で使う「Android keygen」「Android release」は Actions に出てこない（取り込むのはリーダー／サブリーダー）。

1. **Play Console に登録** ── play.google.com/console → デベロッパー アカウントを作成（登録料・本人確認）。個人か組織かを選ぶ所がある。**個人で作ると、本番に出す前に「クローズド テストで 12 人・14 日」が要る**（Google の決まり）。組織なら要らない。
2. **Play Console → アプリを作成** ── 名前 Lingua、アプリ、無料、宣言にチェック。
3. **GitHub → Actions → Android keygen → Run workflow**（一度だけ。二回押すと別の鍵ができる）。終わったら run の画面の下の **Artifacts → lingua-upload-key** をダウンロード（3 日で消える）。zip の中の三つのファイルを、失くさない所（パスワードのかかる場所）に保管する。**この鍵を失くすと、このアプリに二度と上げられない**（Google に鍵の差し替えを頼むことはできる）。
4. **GitHub → Settings → Secrets and variables → Actions → New repository secret** を四回。名前と値は `SECRETS.txt` に書いてある通り:
   `ANDROID_KEYSTORE_B64`（`upload.jks.b64` の中身まるごと）・`ANDROID_KEYSTORE_PASSWORD`・`ANDROID_KEY_ALIAS`・`ANDROID_KEY_PASSWORD`。
5. **GitHub → Actions → Android build → Run workflow**。成功したら Artifacts の **lingua-android-<番号>** に署名した AAB（`bundle/release/app-release.aab`）と APK。
6. **Play Console → Lingua → テスト → 内部テスト → テスター** でテスターのメールを入れる。→ **新しいリリースを作成** → アプリの署名は「Google に管理させる」（初めの一回だけ聞かれる）→ 5 の **AAB を手でアップロード** → 保存 → 公開。**最初の一つは手で上げる**（API は一度も上がっていないアプリに上げられないことがあるため。2 回目からは 10）。
7. **Play Console → Lingua → テストとリリース → 設定 → アプリの完全性 → アプリの署名** で「アプリ署名鍵の証明書」の **SHA-1** を控える。
8. **Google Cloud Console**（iPhone の Google サインインと同じプロジェクト）→ **API とサービス → 認証情報 → 認証情報を作成 → OAuth クライアント ID**:
   - 種類 **Android**、パッケージ名 `com.tokinets.lingua`、SHA-1 は 7 の物。もう一つ同じく **Android** で、SHA-1 は 3 の `SECRETS.txt` の物（Actions の APK を直接入れた時の分）。
   - 種類 **ウェブ アプリケーション** のクライアント ID（Supabase の Google の設定に既にあればそれ）。その ID を **GitHub の Secrets に `GOOGLE_WEB_CLIENT_ID`** として入れる。コードは触らない。
   - **Supabase → Authentication → Providers → Google → Client IDs** にそのウェブの ID が入っていること。
9. **サービスアカウント**（購入の確かめと、Play へ上げる両方に使う一つ）:
   - Google Cloud Console → **API とサービス → ライブラリ → Google Play Android Developer API** を有効にする。
   - **IAM と管理 → サービス アカウント → 作成** → 作ったアカウント → **鍵 → 鍵を追加 → JSON**（ファイルが落ちる）。
   - Play Console → **ユーザーと権限 → 新しいユーザーを招待** → そのアカウントのメール → アプリ Lingua に「財務データの表示」「注文と定期購入の管理」「テスト版トラックへのリリース」（本番も Actions から出すなら「製品版へのリリース」も）。
   - GitHub の Secrets に **`GOOGLE_PLAY_SERVICE_ACCOUNT`**（JSON を丸ごと）。Actions の Supabase Deploy を `verify-plan` で回す（docs/ANDROID.md § 課金）。
10. **これから毎回の出し方**: Actions → **Android build** → Run workflow → 成功したら Actions → **Android release** → Run workflow（build は空のままでよい、status は `completed`）。内部テストのテスターに届く。「draft しか受け取らない」と Google が答えたら `draft` で押し、Play Console で公開を押す。
11. **定期購入を四つ**（Play Console → 収益化 → 定期購入。6 で一度上げた後でないと作れない）: `com.tokinets.lingua.plus.monthly`・`.plus.yearly`・`.pro.monthly`・`.pro.yearly`、各々に基本プラン一つ（`monthly` / `yearly`）、値段は iPhone と同じ、有効に。先に **お支払いプロファイル** が要る。
12. **通知（Firebase）** ── docs/ANDROID.md § オーナーがすること 7 の通り。`google-services.json` は GitHub の画面の **Add file → Upload files** で `android/app/` に置ける。
13. **本番に出す前に Play Console が求める物**: ストアの掲載情報（説明・スクリーンショット・アイコン）、プライバシー ポリシーの URL、データ セーフティ、コンテンツのレーティング、ターゲット ユーザー、**アカウント削除の URL**。どれも画面の「ダッシュボード」に残りの一覧として出る。言葉はオーナーのもの。
