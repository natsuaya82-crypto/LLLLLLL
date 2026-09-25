# オーナーのやること

**明日（2026-09-24）まとめて。1・2 が済んだらリーダーのセッションに「済んだ」→ 166 が出る。**

オーナーの To-Do セッションが書く。リーダーはここを読む。
上から順番に。飛ばすとビルドが落ちるか、通知が一通も出ない。
手順の元：docs/apple.md § 8・§ 9、supabase/setup.md § 2・§ 9-5・§ 12、
.github/workflows/supabase-deploy.yml（integ-0905 46280fcb で読んだもの）。

## 一覧

| # | 何 | 状態 |
|---|---|---|
| 1 | Apple：App ID に Push Notifications | 済み（2026-09-25） |
| 2 | Apple：配布プロファイル作り直し → GitHub Secret 差し替え → リーダーに「済んだ」 | まだ |
| 11 | Supabase：今日のお題が 9/20 で止まっている理由を見る（2 の次に） | まだ |
| 3 | Apple：APNs の鍵 → GitHub Secrets 二つ | まだ |
| 4 | Supabase：Webhooks を ON | まだ |
| 5 | Supabase：schema.sql を流し直す（4 の後） | まだ |
| 12 | GitHub：verify-plan を置き直す（5 の後。逆だと購入の確かめが 500） | まだ |
| 6 | GitHub：push-send を置く（3・5・12 の後） | まだ |
| 7 | Supabase：Cron `daily-prompt` の時刻 | まだ |
| 8 | AdMob：アプリ登録・広告ユニット・Secrets・app-ads.txt | まだ |
| 9 | App Store Connect：App のプライバシー | まだ |
| 10 | 166 を実機で見る | 待ち：166 が届くまで（1・2 の後） |
| 13 | 屋号で出す ── 開業届 → D-U-N-S → Apple と Google を事業用に（Android 版の前に） | 今はやらない（あとで） |

---

## 1. Apple：App ID に Push Notifications を付ける

**何のため：** 通知。これと 2 が無いと、ビルド 166 が Archive で落ちる。

1. パソコンで developer.apple.com を開いてサインイン
2. **Account** → **Certificates, Identifiers & Profiles**
3. 左の **Identifiers**
4. 一覧から **`com.tokinets.lingua`** を押す
   （`com.tokinets.lingua.LinguaKeyboard` は**触らない**）
5. **Capabilities** の一覧で **Push Notifications** にチェック
   （横に Configure ボタンが出ても押さなくていい）
6. 右上の **Save** → 確認が出たら **Confirm**

**終わったら見えるもの：** `com.tokinets.lingua` を開き直すと Push Notifications にチェックが付いている。

---

## 2. Apple：配布プロファイルを作り直して、GitHub の Secret を差し替える

**何のため：** 1 のチェックはプロファイルに自動では入らない。作り直して初めて入る。

1. 同じ画面の左の **Profiles**
2. **Lingua Distribution** を押す（本体の方。キーボードの方ではない）
3. **Edit**
4. 何も変えずに **Save**
5. **Download** → `Lingua.mobileprovision`（名前は多少違ってもいい）が落ちる
6. Mac のターミナルで、落ちたファイルのあるフォルダで：
   ```
   base64 -i Lingua.mobileprovision | pbcopy
   ```
   （これで中身がコピーされる。画面には何も出ない）
7. github.com → **natsuaya82-crypto/LLLLLLL** → **Settings** → 左の
   **Secrets and variables** → **Actions**
8. **`PROVISIONING_PROFILE_BASE64`** の右の鉛筆（Update）→ 中を全部消して貼り付け → **Update secret**
9. **`KEYBOARD_PROVISIONING_PROFILE_BASE64` はそのまま**
10. **リーダーのセッションに「1 と 2 済んだ」と言う** → 166 が出る

**終わったら見えるもの：** Secrets の一覧で `PROVISIONING_PROFILE_BASE64` の更新日が今日。166 が Archive を通る。

---

## 11. Supabase：今日のお題が 9/20 で止まっている理由を見る（2 の次に）

**何のため：** アプリはサーバーの `prompt` 表の一番新しい行を出すだけで、9/21 以降の行が無い。
行を書くのは関数 `daily-prompt`。9/13 から repo で daily-prompt・cron・鍵を触った変更は無い
（リーダーが測った）。だから原因はサーバーの中で、Supabase に入れるのはオーナーだけ。

**11-1 呼ばれているか**
1. supabase.com → Lingua のプロジェクト → 左の **Edge Functions**
2. **daily-prompt** → 上のタブの **Invocations**（無ければ **Logs**）
3. 9/21 以降の行があるか、あれば**その行の状態の数字**を見る：

| 数字 | 意味 |
|---|---|
| 行が一つも無い | 予約の方 → 11-2 |
| 401 | 合言葉（`CRON_SECRET`）が Cron と関数でずれている |
| 500 | `GEMINI_API_KEY` が入っていない |
| 502 | Gemini が断った（鍵・上限・モデル名）か、返事が JSON でなかった |
| 422 | Gemini の文が決まりを破ったので書かなかった |
| 200 | 呼ばれて書けている（→ それでも行が無いならリーダーに） |

**⚠ この関数はログに文を出さない。**画面に出るのは数字だけ。
文そのものが要る時は 11-3。

**11-2 行が一つも無い時：予約を見る**
1. 左の **Integrations** → **Cron**（無ければ Database → **Cron Jobs**）
2. **`daily-prompt`** の Job があるか。**Active（有効）**になっているか
3. その Job の **History（実行履歴）** を開く → 9/20 の後に行があるか、あれば Status と Message

**11-3 文を見たい時（任意）**
Mac のターミナルで（`<CRON_SECRET>` は Supabase の Edge Functions → Secrets に入れた合言葉）：
```
curl -X POST "https://iimwukyyasbybfrirhsf.supabase.co/functions/v1/daily-prompt" \
  -H "x-cron-secret: <CRON_SECRET>"
```
返ってきた一行がそのまま原因。動けばその場で今日のお題が一つ書かれる（それで構わない）。

**終わったら見えるもの：** 数字（か 11-2 の Status／Message、か 11-3 の一行）を**リーダーのセッションに送る**。
リーダーが原因を決めて直す。

---

## 3. Apple：APNs の鍵を作って GitHub に入れる

**何のため：** サーバーが iPhone に通知を送るための鍵。

1. developer.apple.com → Certificates, Identifiers & Profiles → 左の **Keys**
2. **＋**
3. Key Name：`Lingua APNs`（何でもいい）
4. **Apple Push Notifications service (APNs)** にチェック（Configure が出たら、環境は Sandbox & Production のまま）
5. **Continue** → **Register**
6. **Download** → `AuthKey_XXXXXXXXXX.p8` が落ちる
   **⚠ 一度しか落とせない。**失くしたら Revoke して作り直し
7. 画面の **Key ID**（10 文字）を控える
8. github.com → LLLLLLL → Settings → Secrets and variables → Actions → **New repository secret** を二回：
   - Name `APNS_KEY_ID` ／ Secret：7 の 10 文字
   - Name `APNS_P8` ／ Secret：`.p8` をテキストエディタで開いて**中身を全部**
     （`-----BEGIN PRIVATE KEY-----` から `-----END PRIVATE KEY-----` まで、**改行ごと**。一行に潰さない）
9. `APPLE_TEAM_ID` は既に入っている（触らない）

**終わったら見えるもの：** Secrets の一覧に `APNS_KEY_ID` と `APNS_P8`。

---

## 4. Supabase：Webhooks を ON にする（5 より先）

**何のため：** 通知のトリガーが使う pg_net を入れる。これが無いと通知は一通も出ない。

1. supabase.com → Lingua のプロジェクト
2. 左の **Database** → **Webhooks**
3. **Enable webhooks** を押す
4. **それだけ。**画面で Webhook を作らない（Create a new hook は押さない）

**終わったら見えるもの：** Webhooks の画面が「有効にする」ボタンではなく一覧の画面になる。

---

## 5. Supabase：schema.sql を流し直す（4 の後）

**何のため：** 通知の種類（お題の通知を含む）と広告の表をサーバーに入れる。
今日（9/24）のブロックの変更（ブロックした相手の投稿・返信・リポスト・通知をサーバーが外す）もここで入る。
流す前も端末の方で外しているので、画面の上では変わらない（setup.md § 2 の 2026-09-24 の項）。
購入の確かめ（`plan_put()`）と通知を一回だけ鳴らす仕組み（`push_once()`）もここで入る ── **だから 12 と 6 は必ずこの後。**

1. ブラウザで下を開く → 全部選んでコピー：
   ```
   https://raw.githubusercontent.com/natsuaya82-crypto/LLLLLLL/integ-0905/supabase/schema.sql
   ```
   **⚠ integ-0905 の方。**setup.md に書いてある master の URL の方には、今日の分が入っていない
2. Supabase → 左の **SQL Editor** → **New query**
3. 貼り付け → **Run**
4. `Success. No rows returned` が出れば通っている
5. 下を New query に貼って Run：
   ```sql
   select g.tgname, g.tgrelid::regclass as "表"
     from pg_trigger g join pg_proc f on f.oid = g.tgfoid
    where f.proname = 'push_ping'
    order by g.tgname;
   ```
6. 四行出れば済み：`push_on_follow` `push_on_prompt` `push_on_react` `push_on_reply`
7. 左の **Storage** → `post-media` が **Public ではない**ことを見る

**四行出ない／NOTICE: push-send: Database -> Webhooks has not been turned on… が出たら：**
4 をやってから、もう一度 1〜3。壊れてはいない。

---

## 12. GitHub：verify-plan を置き直す（5 の後）

**何のため：** 購入の確かめをする関数を、5 で入れた新しい仕組み（`plan_put()`）を使う版にする。
**⚠ 順番を逆にする（5 より先に置く）と、5 を流すまで購入の確かめが全部 500 で失敗する。**
5 → 12 の順なら何も壊れない（setup.md § 2 の 2026-09-24 の項）。

1. github.com → LLLLLLL → 上の **Actions**
2. 左の **Supabase Deploy**
3. 右の **Run workflow**
4. **どの関数を置くか** が **`verify-plan`** になっているのを確かめる（最初からこれ。変えない）
5. 緑の **Run workflow**
6. 一分ほどで行が出る

**終わったら見えるもの：** 緑のチェック。最後の step「確かめる」に `HTTP 401 {"why":"no session"}` と出ていれば正しい形。

---

## 6. GitHub：push-send を置く（3・5・12 の後）

**何のため：** 通知を実際に送る関数を Supabase に置く。

1. github.com → LLLLLLL → 上の **Actions**
2. 左の **Supabase Deploy**
3. 右の **Run workflow**
4. **どの関数を置くか** を **`push-send`** に変える（最初は `verify-plan` になっている。**そのまま押さない**）
5. 緑の **Run workflow**

**終わったら見えるもの：** 緑のチェック。
赤で Secret の名前が出たら、その Secret が空（3 を見直す）。

---

## 7. Supabase：Cron `daily-prompt` の時刻を変える

**何のため：** 毎日のお題（と通知）を、夏も冬もアメリカ太平洋時間の 0 時に出す。今の `5 7 * * *` だと冬（11 月〜）は 23 時間ずれる。

1. Supabase → 左の **Integrations** → **Cron**（無ければ Database → **Cron Jobs**）
2. **`daily-prompt`** の行 → 編集（… → Edit）
3. **Schedule** を **`0 7,8 * * *`** に書き換え
4. 他は触らない → **Save**

**終わったら見えるもの：** 一覧の `daily-prompt` の Schedule が `0 7,8 * * *`。

---

## 8. AdMob：本物の広告にする

**何のため：** 今は Google のテスト用 ID で動いている（ビルドは通る）。本物の広告と収益にはこれが要る。
**⚠ 本物の ID が入ったビルドで、自分の広告を押さない**（アカウントが止まる）。

**8-1 アプリを登録**
1. admob.google.com（jpel と同じアカウント pub-2442181569589497）
2. 左の **アプリ** → **アプリを追加**
3. プラットフォーム **iOS** → 「App Store に公開済み」**はい** → 「Lingua」で検索 → 選ぶ → 追加
4. 出てきた **アプリ ID**（`ca-app-pub-2442181569589497~` で始まる、`~` の方）を控える

**8-2 広告ユニットを作る**
1. そのアプリ → **広告ユニット** → **広告ユニットを追加**
2. **ネイティブ アドバンス** を選ぶ
3. 名前：`timeline`
4. **詳細設定** → **動画を許可** をオン
5. 作成 → **広告ユニット ID**（`ca-app-pub-2442181569589497/` で始まる、`/` の方）を控える

**8-3 レーティング**
1. そのアプリ → **アプリの設定** → **広告コンテンツのレーティング** を **T（ティーン）**（jpel と同じ）

**8-4 GitHub に入れる**
1. github.com → LLLLLLL → Settings → Secrets and variables → Actions → **New repository secret** を二回：
   - `ADMOB_APP_ID` ／ 8-1 の `~` の方
   - `ADMOB_NATIVE_UNIT` ／ 8-2 の `/` の方
2. 次のビルドから本物になる（片方だけだと、もう片方はテスト用のまま）

**8-5 app-ads.txt**
1. AdMob → アプリ → **app-ads.txt** の画面に出る一行をコピー
2. App Store Connect の「マーケティング URL」（無ければサポート URL）のサイトの一番上に `app-ads.txt` というファイルで置く
   （例：`https://そのドメイン/app-ads.txt` で開けるように）
3. AdMob 側の確認は最大 24 時間

**終わったら見えるもの：** Secrets に `ADMOB_APP_ID` と `ADMOB_NATIVE_UNIT`。AdMob の app-ads.txt が「確認済み」。

---

## 9. App Store Connect：App のプライバシーを書き直す

**何のため：** 広告の SDK が集めるものを申告する。

1. appstoreconnect.apple.com → **アプリ** → **Lingua** → 左の **App のプライバシー**
2. データの種類に下を足す（**編集**）：

| 種類 | 用途 | ユーザーに関連付け | トラッキング |
|---|---|---|---|
| 識別子 → デバイス ID | 他社の広告、分析 | — | **はい** |
| 使用状況データ → 広告データ | 他社の広告、分析 | — | **はい** |
| 使用状況データ → 製品の操作 | 他社の広告、分析 | — | — |
| 位置情報 → おおよその場所 | 他社の広告 | — | — |
| 診断 → クラッシュデータ、パフォーマンスデータ | 分析 | — | — |

3. 「トラッキングに使用」の質問は **はい**（デバイス ID と広告データ）
4. **公開**

元：apple.md § 9-4（Google の一覧 https://developers.google.com/admob/ios/privacy/data-disclosure ）。
「ユーザーに関連付け」は apple.md に書いていない。**わからなければ聞いて**、調べてから答える。

---

## 10. 166 が届いたら実機で見る

TestFlight で 166 を入れて：

- docs/CHECK-0907.md の項目
- 書いている時と、投稿した後の見た目が同じ（改行も）
- 字を描く画面に、田の字の目安の線
- 設定 → 言語 → 字間 の画面
- 投稿の共有ボタン → カード → 共有シートに X や Reddit が出る
- App Store の説明が多言語
- ホームのタイムラインに広告（テスト用）、初めての時に「追跡を許可しますか」が一度出る（断っても広告は出る）
- 通知（3〜6 が済んでから）：フォロー・返信・いいね、それとお題が変わった時
- キーボードを作る画面で、キーを直して**保存を押さずに戻る** → 直したキーは残っていない
- キーに入れる字を選ぶ画面に「確定」が無く、押した字がそのままキーに入る
- 別のアカウントで入り直すと、前の人の設定・下書きが出ない
- ブロックした相手の投稿がタイムラインに出ない
- 機内モードでプランの画面を開くと「接続できません」

**見えたものをスクショで送ってくれれば、どれが通ってどれがダメか書く。**

---

## 13. 屋号で出す ── 開業届 → D-U-N-S → Apple と Google を事業用に（Android 版の前に）

**状態：今はやらない（あとで）。**手順は残してある。

**何のため：** 事業用（組織）にすると、App Store・Google Play の販売元が本名ではなく屋号になり、
Google Play の「テスター 12 人・14 日」が無くなる。法人でなくていい（個人事業主の屋号で通った実例が複数ある）。

**⚠ 先に知っておくこと（2026-09-24 に調べた）**
- **Apple の公式ページは「屋号（DBA・trade name）は受け付けない、個人事業主は個人で登録」と書いている**
  （developer.apple.com/support/D-U-N-S/）。一方で、日本の個人事業主が開業届＋D-U-N-S で組織にできた体験記は複数ある。
  どれも **Web の手続きは「法人であることを確認できない」で止まり、Apple サポートに電話して手で通してもらった**。
  → 13-3 は電話前提。
- **Apple の切り替え中は Certificates, Identifiers & Profiles が使えない**（体験記より）。
  プロファイルの作り直し（2 など）やビルドと重ならない日にする。スムーズで 3〜4 日。
- 「アカウントの種別変更」と「既存アプリの販売元の名前を変える」は**別々の依頼**（体験記より）。

**13-1 開業届を出す（屋号を書く）**
1. マイナンバーカードを用意（e-Tax にログインするのに使う。4 桁の暗証番号も）
2. どれか一つで作る：
   - e-Tax（www.e-tax.nta.go.jp）→ ログイン（マイナンバーカード方式）→ 申請・届出 → **個人事業の開業・廃業等届出書**
   - freee 開業 などの無料ツールで作って、最後に e-Tax で送る
3. 入れるもの：氏名、住所、生年月日、マイナンバー、職業（例：アプリ開発）、**屋号**、開業日
4. 送信 → e-Tax の**メッセージボックス**に「受信通知」が来る → **PDF で保存**
   （オンラインだと紙の控えは出ない。この受信通知が控えの代わり。13-2 と 13-4 で出すことがある）
5. 屋号の英語表記もここで決めておく（D-U-N-S と Apple・Google で同じ綴りを使う）

**13-2 D-U-N-S 番号を取る（無料）**
1. developer.apple.com の **D-U-N-S Lookup**（developer.apple.com/enroll/duns-lookup/）を開く
2. 屋号（組織の名前）、住所、連絡先を入れて検索 → 見つからなければ、そのまま **申請（Submit）**
3. 数日で**東京商工リサーチ（TSR）から確認メール**が来る → 返信する
   （聞かれるもの：屋号の日本語と読み、英語名、個人事業主であることの証明＝**開業届の控え（13-1 の受信通知）**、
   事業所の住所、電話（携帯可）、代表者名の漢字・かな・英字、業種）
4. D-U-N-S 番号（9 桁）の発行メールが来る → 控える
5. Apple 側に反映されるまでさらに最大 2 営業日。合わせて 1〜2 週間
   （東京商工リサーチに直接頼むと 3,300 円。Apple のページからなら無料）

**13-3 Apple：個人のアカウントを組織へ切り替える（作り直しではない）**
1. **依頼する前にリーダーのセッションに「13-3 やる」と一声かける**
   （切り替えの間、今のアプリの配信・定期購入・TestFlight がどう扱われるかをリーダーが確かめる）
2. リーダーの OK の後：developer.apple.com → **Contact Us**（サポートへの連絡）→ Membership and Account → 電話を選ぶ
   （体験記ではメールより電話がずっと早い）
3. 伝えること：個人から組織への切り替え、D-U-N-S 番号、屋号、個人事業主であること
4. Apple から書類（開業届の控えなど）を求められたら出す
5. 切り替えが済んだら、**既存アプリの販売元の名前を屋号にする**のを別に依頼する

**13-4 Google Play Console：組織のアカウントを作る**
1. play.google.com/console で新しく登録 → アカウントの種類で **組織（Organization）** を選ぶ
2. D-U-N-S 番号、屋号、住所、連絡先を入れる（D-U-N-S の登録内容と同じ綴り・住所に揃える）
3. **お支払いプロファイル**を組織で作る
4. 登録料 **25 米ドル**（一回だけ）を払う
5. 組織の確認で書類を求められたら、開業届の控え（13-1 の受信通知）を出す
   （体験記より：税務署は 2025 年から紙の控えに受付印を押していない）
6. 組織なので、テスター 12 人・14 日の決まりは無い

**終わったら見えるもの：** App Store の Lingua の販売元が屋号。Play Console のアカウントの種類が「組織」。

参考：
- https://developer.apple.com/support/D-U-N-S/ （Apple 公式。上の ⚠ の文はここ）
- https://support.google.com/googleplay/android-developer/answer/13634885 （Google 公式：アカウントの種類）
- https://zenn.dev/tomlife43/articles/eee8f6b90b22a1
- https://note.com/_nanakosan_/n/ne688478bb2a8
- https://qiita.com/GoHiromi/items/890de3fe5811d357e4bc

（このセッションの環境からは Google の公式ページと上の三つの記事を開けなかった。検索結果の要約で書いている。
画面の名前が違ったらスクショを送ってくれれば直す。）
