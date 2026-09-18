# r41-review ── 次に出す前に、Apple の審査基準を全部なめる

ブランチ `claude/r41-review`（`integ-0905` = `11480dd5` から）。

## このセッションが変えるもの

| | |
|---|---|
| **書く** | `docs/scope/r41-review.md`（このファイル）だけ |
| **撮る** | `shots/r41-*.png`（画面を見た方が早い所だけ） |
| **変えない** | **コードは一行も。** `www/`・`ios/`・`supabase/`・`tools/`・他の `docs/` すべて |
| **回さない** | ゲート（`npm test`）。`npm run rls` も |

読むだけのセッションです。直しは**しません** ── 見つけた物は一行の
「直しの一行」として書いて置き、実際に直すのは別のセッションです。

## なぜ

OWNER 2026-09-18。Apple の審査が一回に一件ずつ返してきます ──
154 は `profile.link` と登録エラー（schema 未反映）、161 は Guideline 4
「Sign in with Apple のあとに名前を打たせている」（`claude/r40` が直し中）。

> 「まとめてレビューして欲しい」

一件直して出して、次の一件が返ってくるのを繰り返すと、一回あたり一日以上
かかります。**だから次に出す前に、こちらで基準を全部なめて、引っかかる所を
一覧にします。**

## なめる項目

- **4.8** Sign in with Apple（`claude/r40` の分以外に残る所 ── メールを訊く所、
  Apple の relay メールの扱い、設定のアカウント室）
- **5.1.1(v)** アカウント削除（設定→アカウント削除が `auth.users` まで消すか）
- **3.1.1／3.1.2** 課金（価格・期間・自動更新の文言、**復元**、規約と
  プライバシーポリシーへのリンク）
- **1.2** UGC（報告・ブロック・運営側の対応 ── 報告した後どうなるか）
- **5.1.1** プライバシー（写真・マイク・カメラの用途文、`PrivacyInfo.xcprivacy`、
  App Privacy の申告）
- **2.1** 完全性（クラッシュ、空の画面、「準備中」の残り、`@demo` 等のダミー）
- **4.0** デザイン（iPad ── 審査は iPad Air でもしている）
- **2.3** メタデータ（スクショ・説明と実物のずれ）
- **キーボード拡張** Full Access の要求と説明、4.0 の keyboard extension 要件

## 書き方

一項目ずつ：**基準の番号と一文** → **このアプリの今**（`file:line`、
押して確かめた物は「押した」、読んだだけは「読んだ」と分ける） →
**落ちる可能性：高／中／低** → **直しの一行**。

**推測で「たぶん大丈夫」と書きません。**確かめていない物は「未確認」と
書きます。最後に「高」だけを上から並べた表。

---

（以下、調査の結果をこの下に書き足していきます）

---

# 調べた結果

**読んだ版**は `claude/r41-review`（`integ-0905` = `11480dd5`）。
`claude/r40` はまだ push されていない（`git branch -r | grep r40` が空）ので、
**161 の指摘（4.8 の名前）はこの木にまだ丸ごと残っている。**下の 4.8-A は
r40 が直している最中のものなので、二重に直さないこと。

**押した／測った／読んだ の区別。**「押した」と書いてあるのは、この
セッションがヘッドレスの実物に対して実際に描いて `getBoundingClientRect()` と
`document.elementFromPoint()` で測ったもの。「読んだ」はコードを読んだだけ。
**実機では一つも押していない**（このセッションからは押せない）。

**外に出られない。**`tokinets.com` への `curl` は proxy に 403 で拒まれた
（`connect_rejected`、organization policy）。だから**規約とプライバシー
ポリシーの二枚が本当に上がっているかは、このセッションからは確かめられない。**

---

## 4.8 Sign in with Apple

### 4.8-A 「Apple が名前をくれているのに、もう一度打たせている」── **高**

> **4.8**: ログインサービスを使うアプリは、同等の選択肢（名前とメール
> アドレスだけを集め、メールを隠せるもの）を提供しなければならない。
> ── 161 のリジェクトはこれ（Guideline 4）。

**このアプリの今**（読んだ）：

- `www/onboard.js:838` `obSignInApple()` は `scopes:['name','email']` を
  渡している。**Apple には名前を要求している。**
- `www/onboard.js:828` ── 返ってきた `r` から読んでいるのは
  `r.result.idToken` **一つだけ**。`r.result.profile`（Apple が初回だけ
  返す `givenName` / `familyName`）は**捨てている**。
- `www/onboard.js:894` `obIn()` が `OBM.mode='who'` に入れ、
  `netMyProfile()` が行を返さなければ（＝新規）そのまま `who` に残る。
- `www/onboard.js:1445` `obWhoHTML()` が**空の**ユーザー名欄と `@id` 欄を
  出す。`www/onboard.js:1476` `obWhoGo()` は `if(!OBM.nm)` で
  `net.needname` を出して**進ませない**。

押した：`shots/r41-48-who.png`（390×844、ja）。**ユーザー名の欄は空**で、
名前を打たなければ「次へ」が通らない。これが審査員の見た画面。

**落ちる可能性：高**（現に 161 で落ちている）。

**直しの一行**：`www/onboard.js:828` で `r.result.profile` の
`givenName`/`familyName` を拾って `OBM.nm` の初期値にし、`obWhoGo()` の
`!OBM.nm` は名前が来なかった時だけの枝にする（`@id` は Apple が持っていない
ものなので訊いてよい）。**※ これは `claude/r40` の担当。**

### 4.8-B Apple は Google と並んでいるか ── **低**

> **4.8**: 他社のログインを出すなら、Sign in with Apple も同等に出す。

押した：`shots/r41-48-door.png`。扉は メール／パスワード → 「または」 →
**Apple で続ける**（黒、Apple のロゴ）→ **Google で続ける**（白）の順。
Apple が上、同じ幅、同じ高さ。`www/onboard.js:838`/`839`。

**落ちる可能性：低。**

### 4.8-C メールを隠した Apple アカウント（relay） ── **低**

読んだ：`www/net.js:153` `netHow()` / `netMail()`。アドレスはトークンの
claim からしか読まない。**`profile` にアドレスの列は無い**
（`supabase/schema.sql` の `profile` に `email` は無い）。Apple が
`@privaterelay.appleid.com` を返せばそれがそのまま入るだけで、アプリが
本物のアドレスを要求する枝はどこにも無い。

使い先は三つだけ（読んだ）：`www/settings.js:84`（アカウント室に
「どの扉で入ったか」を出す）、`www/settings.js:109`・`www/mod.js:305`
（パスワード変更と admin の再認証 ── どちらも `netHow()==='email'` の時だけ、
`www/mod.js:262` `adminLocked()`）。**relay のアドレスにメールを送る道は
無い。**

**落ちる可能性：低。**

### 4.8-D `netMail()` が空の時 ── **未確認**

`www/settings.js:138` が `OBM.em=netMail()` を置く。Apple で入って
`email` claim が空のアカウント（「メールを非公開」ですらなく、二回目以降の
サインインで claim が落ちる場合）に何が出るかは**押していない**。
`www/me.js:66` のコメントは「Apple のアカウントは持っていないことがある」と
言っているので、枝は意識されている。**未確認。**

---

## 5.1.1(v) アカウント削除

> **5.1.1(v)**: アプリ内でアカウントを作れるなら、**アプリ内で**アカウントを
> 削除できなければならない。無効化ではなく削除であること。

**このアプリの今**（読んだ）：

- 設定 → アカウント室に三行（`www/settings.js:327` 付近）── サインアウト／
  **この言語を削除**／**アカウントを削除**。
- `www/settings.js:566` `wipeAll()` → `popAsk(t('confirm.wipe'))` →
  `www/settings.js:616` `wipeAllGo()` → `www/net.js:4821` `netDropMe()`。
- `netDropMe()` は自分の投稿の写真・音声をバケットから落としてから
  `netEndMe()`（`www/net.js:4869`）。
- `supabase/schema.sql:2177` `account_delete()` は
  **`delete from auth.users where id = me;`** ── `auth.users` まで届く。
  引数なし。`profile`・`language`・`post` は `on delete cascade` で落ちる
  （`schema.sql:49`・`249`・`285`）。
- サーバーが答えてから初めて端末に印を付ける（`www/settings.js:600` 前後の
  コメント、`netEnding()` は `account_delete()` の後）。通信エラーなら
  **何も消えず、アカウントも残る**。

**「サブスクリプションは先に解除して」も言っている**（`ja.js:820`
`confirm.wipe`）── Apple が 5.1.1(v) で明示的に求めている一文。

**落ちる可能性：低 ── ただし一点だけ「高」に化ける。**

**それは schema が本物に入っているかどうか。**`account_delete()` が無い
データベースに対しては RPC が 404 を返し、`wipeStopped()` が
「接続できません」を出して**削除できない**。154 が落ちた原因は
まさにそれ（`profile.link` が無かった）で、`docs/STATE.md:109` が
「両方 schema が入っていなかったことが原因」と書いている。
`supabase/schema.sql` の最後の変更は `890d3a75`（2026-09-15、
「schema.sql が本物に一回で入る」）で、`git log -S account_delete` を見ると
`account_delete()` はそれより前から入っている。

**直しの一行**：出す前に、オーナーに
`select proname from pg_proc where proname='account_delete';` と
`select column_name from information_schema.columns where table_name='profile' and column_name='link';`
の二つを Supabase の SQL エディタで打ってもらい、**両方が行を返すことを
確かめる**（`supabase/setup.md` § 2）。**未確認。**

---

## 3.1.2 サブスクリプションの表示

> **3.1.2**: 自動更新サブスクリプションを売る画面に、**サブスクリプション名・
> 期間・期間あたりの価格**、**自動更新される旨**、**利用規約（EULA）と
> プライバシーポリシーへの機能するリンク**が無ければならない。

**このアプリの今**（押した：390×844 ja でプランを描き、一番下までスクロール
してから当たり判定を測った。`shots/r41-plans-ja.png`）：

| 求められるもの | どこ | 測った結果 |
|---|---|---|
| 名前と価格と期間 | `www/settings.js:1031` `term()` の `.plterm` | `Free $0／月`・`Plus $4.99／月`（ブラウザなので打ち込みの控え。実機は `storeAsk()` が App Store の値に差し替える ── `www/store.js:409`） |
| 自動更新の一文 | `www/settings.js:1107` `planTerms()` → `t('plan.renew')` | **「解約するまで自動更新されます。」**出ている |
| 利用規約 | `www/settings.js:39` `docRows()` → `DOC_TERMS` | 出ている。**当たり判定は自分自身**（`elementFromPoint` が `A` を返す）＝押せる |
| プライバシーポリシー | 同上 → `DOC_PRIVACY` | 同上 |
| 復元 | `www/settings.js:1197` `DO('storeRestore')` | 342×50、押せる |
| 解約 | `www/settings.js:1212` `DO('storeManage')` | 342×47、押せる |

**四つとも下タブの帯に埋まっていない。**`.view.plans` に
`padding-bottom:calc(var(--tabh) + 96px)`（`www/index.html:2067`）が
入っているので、一番下まで送れば帯の下から出てくる ── これは測った。
（`shots/r41-plans-ja.png` は fullPage なので帯が中ほどに写っているが、
それは撮り方の都合で、実際は覆っていない。）

**落ちる可能性：低。**

### 3.1.2-b 規約とポリシーの二枚が本当に上がっているか ── **未確認（高になり得る）**

`www/settings.js:52`
`https://tokinets.com/lingua/terms.html` と `privacy.html`。
`target="_blank"` は Capacitor が Safari に投げる
（`node_modules/@capacitor/ios/Capacitor/Capacitor/WebViewDelegationHandler.swift:328`
が `UIApplication.shared.open` を呼ぶ ── 読んだ）ので、**仕組みとしては開く。**

**この二枚が 404 なら 3.1.2 で一発で落ちる。**このセッションからは
`curl` が proxy に拒まれて確かめられない。

**直しの一行**：出す前に、iPhone の Safari でその二つの URL を開いて
中身が出ることをオーナーに見てもらう。**未確認。**

### 3.1.2-c 無料の段だけ `$0` と打ち込んである ── **中**

`www/i18n/ja.js:862` `'plan.price.free' : '$0'` ── **十言語すべて `$0`。**
Plus と Pro の値段は App Store から来る（日本なら円）のに、その隣の Free
だけが**ドル**で出る。押した：`shots/r41-plans-ja.png` の
`$0／月` と `$4.99／月`。

`docs/BACKLOG.md` が既に載せていて、**何と書くかはオーナーの決めごと**
（`0` か、無料という語か、何も出さないか）。

**落ちる可能性：中**（2.3「実物と違う」より 3.1.2 の価格表示として
突かれる形）。**直しの一行**：`plan.price.free` をどうするかをオーナーに
一つ選んでもらう。

---

## 3.1.1 アプリ内課金

> **3.1.1**: デジタルな物や機能の解錠は IAP でのみ。外部の購入手段へ誘導する
> ボタン・リンク・その他の呼びかけを置いてはならない。

**このアプリの今**（読んだ）：

- 買う道は一本 ── `www/settings.js:1236` `setPlan()` → `storeBuy()`
  （`www/store.js:107`）→ `LinguaStore.swift` の StoreKit 2。
- `www/settings.js:1235` `var PLAN_BUY=true`。**`false` のまま出すと
  誰でも自分に Pro を付けられる**とコメントが書いている。今は `true`。
- **段は要求ではなく返事から取る** ── `verify-plan`（Edge Function）が
  Apple の署名を検証して `plan` 表に書き、端末は書けない
  （`docs/STATE.md`「アプリはレシート無しで自分の行に `pro` を書ける」は
  2026-09-06 に閉じた）。
- `www/*.js` に外へ出る URL は**規約とポリシーの二本だけ**
  （`grep` で確かめた）。外部決済への導線は無い。
- 復元：`www/settings.js:1197` → `www/store.js:175` `storeRestore()` →
  `LinguaStore.swift:335` `restore()` が `AppStore.sync()` を呼ぶ。
  **Apple が必須にしているボタンは在る。**

**落ちる可能性：低。**

**ただし「未確認」が二つ**：`verify-plan` が本物に deploy されているか、
`APPLE_ROOT_CA_G3` が入っているか（`supabase/setup.md` § 8b、
`docs/STATE.md` が「オーナーの側で要る」と書いている）。**入っていないと
買っても段が付かない** ── それは 3.1.1 ではなく **2.1（買った物が届かない）**
で落ちる。**未確認。**

---

## 1.2 ユーザー生成コンテンツ

> **1.2**: UGC を扱うアプリは、**不適切な内容を弾く仕組み**、**通報の仕組み**、
> **迷惑な利用者をブロックする手段**、**連絡先の公開**、そして通報への
> **迅速な対応**を備えなければならない。

**このアプリの今**（読んだ）：

| 求められるもの | どこ | 有無 |
|---|---|---|
| 通報 | `www/post.js:4203` `openReport()`、理由は `www/post.js:4191` `REPORT_WHY=['spam','abuse','hate','sexual','other']` | **在る。**投稿の「…」と、人のページの「…」の両方から |
| 通報した後 | `reportGo()` → `netReport()` → `toast(t('report.done'))`＝「送信しました」 | 送ったことは言う。**その後どうなったかは本人に何も返らない** |
| ブロック | `www/me.js:1160` `meBlock()`。ブロックはサーバーの行で、`www/post.js:118` `postBlocked()` がタイムラインから全部落とす。フォローも外れる | **在る** |
| 運営側 | `www/mod.js` ── `profile.staff` を持つ人だけが通報を見て、投稿を取り下げられる | **在る。ただし `staff` はダッシュボードで手で立てるもので、アプリからは誰も立てられない**（`www/mod.js:17`） |
| 連絡先 | `www/sns.js:1337` `APPEAL='mailto:Lingua@tokinets.com'` | **在る。ただし凍結された人の画面にしか出ない** |

**落ちる可能性：中。**通報もブロックも実物が在って動くので、審査員が
押す分には通る。引っかかるとすれば二つ：

1. **`profile.staff` が本物のサーバーで誰にも立っていなければ、通報は
   溜まるだけで誰も見られない。**Apple は「24時間以内に対応する」と
   返信で訊いてくることがある（`www/mod.js` の頭がそう書いている）。
   **未確認** ── オーナーに `select id from profile where staff;` を
   打ってもらう。
2. **連絡先が凍結画面にしかない。**App Store Connect のサポート URL で
   足りるのが普通だが、そこが空なら 1.2 で突かれる。**未確認。**

**直しの一行**：（1）オーナーが自分のアカウントに `staff` を立てる。
（2）App Store Connect のサポート URL と、規約ページに連絡先を載せる。

**※ `docs/BACKLOG.md` に「設定の通報の行を外す」というオーナーの決定が
DELETE REVIEW 待ちで載っている。外すと `mod.js` への唯一の扉が閉じる ──
これは 1.2 と正面から当たるので、出す前には触らないこと。**

---

## 5.1.1 プライバシー（用途文・Privacy manifest・申告）

> **5.1.1**: データの収集は必要最小限で、なぜ要るかを説明し、
> Privacy manifest と App Privacy の申告が実物と合っていること。

### 用途文（`NSxxxUsageDescription`）── **低**

読んだ：`ios/App/App/Info.plist`。三つとも在って、**何に使うかを具体的に
書いている**（Apple が落とすのは「このアプリはカメラを使います」のような
中身の無い文）。

- `NSMicrophoneUsageDescription`「To record your own voice on a post, so
  other people can hear how your language sounds.」
- `NSCameraUsageDescription`「To take a photograph for a post.」
- `NSPhotoLibraryUsageDescription`「To put one of your photographs on a post.」

拒否された時：`www/rec.js:121` が `toast(t('post.vo.deny'))` を出して戻る
（読んだ）。**落ちない。**写真とカメラは `<input type="file">`
（`www/post.js:1100`、`www/me.js:1576`）なので WKWebView 側が扱う。

**未確認**：三つとも**英語だけ**で、日本語のローカライズ
（`InfoPlist.strings`）が無い。日本のストアで日本語の許可ダイアログが
出ないのは落ちる理由にはならないが、指摘されることはある。

### Privacy manifest ── **低**

読んだ：三つ在る（`ios/App/App/`、`LinguaKeyboard/`、`LinguaWidget/`）。

- 本体は 8 種を申告 ── メール、名前、UserID、他のユーザーコンテンツ、
  写真／動画、音声、検索履歴、購入履歴。全部
  `Linked=true` / `Tracking=false` / `AppFunctionality`。**実物と合っている**
  （検索履歴は `SET.recent`、購入履歴は `plan`／`purchase`）。
- キーボードとウィジェットは空。**キーボードは App Group を読むだけで
  何も集めない**（`ios/App/LinguaKeyboard/Shared.swift:154` `board()` は
  読むだけ）ので、空で正しい。
- `NSPrivacyAccessedAPITypes` は三つとも**空**。本体の Swift を
  grep したが `UserDefaults`・`attributesOfItem`・`.modificationDate` は
  一つも無い（`FileManager` は `fileExists`／`createDirectory`／`write`／
  `removeItem` だけ ── どれも required reason API ではない）。
  Capacitor 本体も `UserDefaults` を使っていない（`node_modules` を grep）。
  **空で正しい。**
- 外から入る SDK は `GoogleSignIn 9.0` と `Alamofire 5.10`
  （`@capgo/capacitor-social-login` の podspec）。**どちらも自前の
  manifest を同梱している版。**Facebook SDK は
  `capacitor.config.json` の `facebook:false` を見て
  `scripts/configure-dependencies.js:280` がコメントアウトするので
  **リンクされない**（読んだ）── だから `NSPrivacyTracking=false` と
  矛盾しない。

**落ちる可能性：低。**

### App Privacy の申告（App Store Connect）── **未確認**

manifest の 8 種と、App Store Connect の「App のプライバシー」で答えた
内容が**食い違っていると落ちる**。ここからは見えない。

**直しの一行**：App Store Connect のプライバシーの答えを、上の 8 種と
突き合わせる。**未確認。**

---

## キーボード拡張（4.4.1 / 5.1.2）

> **4.4.1**: キーボード拡張は、**ネットワークと Full Access が無くても
> 機能し続け**なければならない。Full Access を要求するなら、その理由を
> 説明し、プライバシーポリシーを持たなければならない。

### **`RequestsOpenAccess` が `true` だが、何も使っていない ── 中**

**このアプリの今**（読んだ）：

- `ios/App/LinguaKeyboard/Info.plist:33` `RequestsOpenAccess` = **`true`**。
- ところが `ios/App/LinguaKeyboard/KeyboardViewController.swift:66` の
  コメント自身が「**ここに full-access の門は無い、それは意図的だ**」と
  書いていて、`Shared.swift:154` `board()` は「読むだけなら Full Access は要らない」と
  Apple の現行ページを引いている。
- 拡張の Swift 六本を grep した：`UIPasteboard` **0**、`URLSession` **0**、
  `UserDefaults` **0**、App Group への**書き込み 0**。
  **読むだけ。**つまり **Full Access を使う所が一つも無い。**

**Full Access を要求しておきながら使い道が無いのは、審査で
「なぜ必要か」を訊かれる形。**答えが「要りません」なら、その場で
`false` にしろと言われる。

**落ちる可能性：中**（落ちるというより、返事の往復が一回増える形）。

**直しの一行**：`ios/App/LinguaKeyboard/Info.plist:33` を `false` にする。
**ただしこれは振る舞いの変更なので、実機で「Full Access を切った
キーボードが文字を出せるか」を一度押してから**
（`KeyboardViewController.swift:88` が自分で **DEVICE UNCONFIRMED** と
書いている）。**このセッションでは直さない ── オーナーの決めごと。**

### 何も描かれていない時 ── **低**

読んだ：`Shared.swift:193` `Say.nothingYet` ──
「先に Lingua で文字を描いてください。」を **10 言語**持っている
（拡張は App Group が読めない時に何も読めないので、自分で文字列を抱える）。
**一つもキーの無い真っ白なキーボード**にはならない。これは 4.4.1 が
まさに書かれている形なので、直っているのは大きい。

### 地球儀キー ── **低**

読んだ：`KeyboardViewController.swift:104` ──
`needsInputModeSwitchKey` を見て、要らない端末では落とす。正しい形。

---

## 2.1 完全性

> **2.1**: 不完全なアプリ、プレースホルダ、テスト用のコンテンツは通らない。

**このアプリの今**：

- **「準備中」「Coming soon」「TODO」の類は `www/i18n/*.js` に無い**
  （grep した）。**`@demo` のようなダミーのアカウント名も `www/` に無い。**
- `Info.plist` の `__NAME__` プレースホルダは、`assets-check` が
  「workflow が実際に置換する名前か」を見ている（CLAUDE.md § rule 9）。
  `__APPLE_TEAM_ID__` は `.github/workflows/ios-deploy.yml` が置換する
  （読んだ）。**ビルド 86 の `ITMS-90158` はこれで閉じている。**

### 2.1-A **審査用のデモアカウントが要る ── 高**

**扉を通らないと何もできない。**CLAUDE.md § Online が
「タイムラインを読むのも、投稿するのも、**言語を作るのも**アカウントが要る」
と書いていて、サインアウトしていると**フィードも検索も通知もアプリ自身の扉を
出す**（CLAUDE.md、押した数の段 ── 5955 に増えた日の説明）。
**審査員が入れなければ即リジェクト。**

（`obNeed()` は `www/onboard.js:1105`。**これが全部の入口に立っているかは
このセッションでは確かめていない** ── 呼んでいるのは四つのファイルで九か所
だけなので、「全部の書き込みの前に立つ」とは書けない。**未確認。**）

`docs/STATE.md:626` が「まだオーナーの側に残っている」として名指ししている
── しかも**その前に六桁のメールが飛ぶこと**（`supabase/mail.md`）が要る。

**直しの一行**：App Store Connect の「App Review 情報」に、
使えるアカウントのアドレスとパスワードを入れる。言語一つ、文字を何個か、
投稿を二つ三つ入れた状態にしておく。**未確認。**

### 2.1-B 「今日のお題」が古い日のまま出る ── **中**

読んだ：`www/net.js:4515` `netDay()` は
`order=on_day.desc&limit=1` としか訊いていない ── **今日を訊いていない。**
古い行が一つあれば、それが永久に「今日のお題」として出る。
`on_day` は画面のどこにも描かれないので、**見ても分からない。**

`docs/STATE.md` が既に「コードを読んで分かっていて、まだ直っていないもの」
として載せている。

**落ちる可能性：中**（審査員が「今日」と書いてある古い内容を見る）。
**直しの一行**：`netDay()` に `&on_day=eq.<today>` を足す ── ただし
**「お題が無い日に何を出すか」はオーナーの決めごと**なので、勝手に決めない。

### 2.1-C キーボードの設定に飛ばない ── **中・未確認**

`docs/STATE.md` が「オーナーが実機で見つけた、まだ直っていないもの」として
載せている ── `kbSettings()`（`www/keyboard.js`）が
`LinguaShare.settings` を呼び、橋が無い時に**無言で終わる枝**がある。

**押せるのはオーナーだけ。原因は確かめられていない。**
審査員がキーボードを有効にできなければ、キーボードの機能ごと
「動かない」と見なされる。**未確認。**

### 2.1-D Documents が空なのに Files に出る ── **低**

`ios/App/App/Info.plist` の `UIFileSharingEnabled` と
`LSSupportsOpeningDocumentsInPlace` は **`true`**。ところが**その上の
コメントは「言語が Documents にファイルとして書かれる」と言っていて、
その仕組みは rule 11（2026-09-04）で削除済み**
（`www/backup.js` ごと）。

今 Documents に書かれるのは、書き出したシート（`LinguaShare.swift:139`）と
録音（`:310`）だけ。**Files アプリに Lingua のフォルダは出るが、
何もしていなければ空。**落ちる理由にはならないが、
**コメントが falsify されたまま残っている**（CLAUDE.md §「書かれたものは
一緒に直す」）。

---

## 4.0 デザイン ／ iPad

> **4.0**: iPad で審査されることがある。壊れた画面は落ちる。

**このアプリの今**（読んだ）：

`ios/App/App.xcodeproj/project.pbxproj` の
**`TARGETED_DEVICE_FAMILY = "1"` が六つの target 全部にある** ──
**iPhone 専用。**だから iPad では iPhone 互換の窓で動き、
**iPad のレイアウトを審査員が見ることは無い。**
`UISupportedInterfaceOrientations~ipad` が `Info.plist` に残っているが、
`TARGETED_DEVICE_FAMILY=1` なので効かない。

**落ちる可能性：低。**

### 4.0-b 横向き ── **中**

`Info.plist` は iPhone でも **`LandscapeLeft` / `LandscapeRight` を許して
いる**。押した：844×390 でフィードとプランを描いた
（`shots/r41-land-feed.png`、`shots/r41-land-plans.png`）。

`#app{max-width:480px;margin:0 auto}`（`www/index.html:146`）が効いていて、
**844 の幅でも中身は 480 の柱のまま真ん中に立つ ── 崩れない。**
ただし高さが 390 しかないので、**プラン画面は下タブの帯が段の中身に
重なる**（`shots/r41-land-plans.png`）。読めなくなるわけではなく、
送れば出てくる。

**落ちる可能性：中**（「横にすると読めない」と言われる形。落ちるほどでは
ないが、そもそも横向きを許す必要が無いなら閉じるのが安い）。

**直しの一行**：`Info.plist` の `UISupportedInterfaceOrientations` を
`Portrait` だけにする。**ただし「横向きを許すか」はオーナーの決めごと。**

### 4.0-c 規約とポリシーのリンクが 21pt しかない ── **中**

押した（390×844、一番下までスクロールして測った）：

```
利用規約              50 × 21 px   押せる
プライバシーポリシー  127 × 21 px   押せる
購入を復元           342 × 50 px   押せる
サブスクリプションを解除する 342 × 47 px  押せる
```

**下の二つは 44 を超えているが、上の二つは 21。**HIG の 44pt を
割っている。`www/index.html:1890` `.docs` は `<a>` を並べた行で、
`press` が測る `.btn` ではない。

**3.1.2 で審査員が必ず押しにいく二つがこれ**なので、
「リンクが見つからない／押せない」と返ってくる形はあり得る。

**落ちる可能性：中。**
**直しの一行**：`.docs a` に `display:inline-block;padding:12px 0`
（高さ 45 になる）を足す。**角丸も枠線も足さない** ── `box-check` の
baseline に一行も要らない形。**このセッションでは直さない。**

---

## 2.3 メタデータ ── **未確認**

> **2.3**: スクリーンショット・説明文が実物と一致していること。

**ここからは一つも見えない。**App Store Connect の画面の話なので、
このリポジトリには答えが無い（`docs/apple.md` がそう書いている理由と同じ）。

読んだ範囲で**ずれる可能性があるもの**を三つだけ挙げる：

1. **プラン画面の絵はこの人自身のキーボード**（`www/settings.js:1130`
   付近 `kbShotHTML(kbOf().lay)`）。スクショに使うなら、撮った端末の
   文字がそのまま載る。
2. **無料の段が `$0`**（上の 3.1.2-c）── 説明文に「無料」と書いてあって
   画面が `$0` なら、日本のストアで食い違う。
3. **`MARKETING_VERSION = 1.0.0` のまま固定**
   （`project.pbxproj:614`）。`docs/apple.md` が
   「1.0.0 で審査に出したあとに直しを入れるときは 1.0.1 に上げる必要が
   ある」と書いている。**154・161 が落ちているので、次に出すのは
   1.0.1 以降でないと App Store Connect が受け取らない可能性がある。**
   **未確認**（オーナーが 154/161 をどう処理したかによる）。

---

# 「高」だけ、上から

| # | 基準 | 何が | どこ | 直しの一行 | 誰が |
|---|---|---|---|---|---|
| 1 | **4.8** | Apple がくれた名前を捨てて、もう一度打たせている。**161 のリジェクトそのもの** | `www/onboard.js:828`（`r.result.profile` を読まない）、`:1445` `obWhoHTML()`、`:1476` `obWhoGo()` の `!OBM.nm` | `r.result.profile` の `givenName`/`familyName` を `OBM.nm` の初期値にする | **`claude/r40` が作業中** |
| 2 | **2.1** | **審査用のデモアカウントが無い。**扉を通らないと何も見えないので、入れなければ即リジェクト | App Store Connect「App Review 情報」。前提として `supabase/mail.md` の六桁メールが飛ぶこと | アドレスとパスワードを入れる。言語一つ・文字何個か・投稿二三本を入れた状態で | **オーナー・未確認** |
| 3 | **5.1.1(v)** | **`schema.sql` が本物に入っているか。**入っていないと `account_delete()` が 404 で、削除できない。**154 が落ちたのと同じ形** | `supabase/schema.sql:2177`（`account_delete()`）、`:108`（`profile.link`） | SQL エディタで二つ打って行が返ることを確かめる（上の 5.1.1(v) 節） | **オーナー・未確認** |
| 4 | **3.1.2** | **規約とプライバシーポリシーの二枚が上がっているか。**404 なら一発 | `www/settings.js:52`・`:53` | iPhone の Safari でその二つを開いて中身を見る | **オーナー・未確認**（proxy に拒まれて確かめられなかった） |

**この四つのうち、コードを直せば済むのは 1 だけで、それは r40 が
やっている。残りの三つは全部オーナーの側で、しかも全部
「確かめていない」。**154 も 161 も、落ちた原因はコードではなく
**サーバーとストアの側が追いついていなかったこと**だった
（`docs/STATE.md:109`）。次も同じ所で落ちる。

## 「中」（参考）

| 基準 | 何が | どこ |
|---|---|---|
| 4.4.1 | キーボードが Full Access を要求しているが、使う所が一つも無い | `ios/App/LinguaKeyboard/Info.plist:33` |
| 4.0 | 規約とポリシーのリンクが 21pt（44 未満）。審査員が必ず押す二つ | `www/index.html:1890` `.docs` |
| 3.1.2 | 無料の段だけ十言語すべて `$0` と打ち込んである | `www/i18n/*.js` `plan.price.free` |
| 2.1 | 「今日のお題」が今日を訊いていない ── 古い行が永久に今日になる | `www/net.js:4515` `netDay()` |
| 2.1 | キーボードの設定に飛ばない（オーナーが実機で見つけた、原因未確認） | `www/keyboard.js` `kbSettings()` |
| 1.2 | `profile.staff` が誰にも立っていなければ、通報は溜まるだけ | `www/mod.js:17`・ダッシュボード |
| 4.0 | 横向きを許しているが、プランは帯が重なる | `ios/App/App/Info.plist` |

## 「低」（確かめて、問題なかったもの）

4.8-B（Apple が Google の上に同じ大きさで並んでいる ── 押した）・
4.8-C（relay のアドレスを要求する枝が無い）・
3.1.1（買う道は StoreKit 一本、外部決済への導線ゼロ、復元ボタン在り）・
5.1.1 の用途文三つ（具体的で、拒否されても落ちない）・
Privacy manifest 三つ（実物と合っている、`NSPrivacyAccessedAPITypes` が
空なのも正しい、Facebook SDK はリンクされない）・
4.4.1 の「何も描いていない時」（10 言語の一文が出る、真っ白にならない）・
4.0 の iPad（`TARGETED_DEVICE_FAMILY = "1"` ＝ iPhone 専用）・
2.1 のプレースホルダとダミー（`www/` に一つも無い）。

## 撮った絵

| file | 何 |
|---|---|
| `shots/r41-48-door.png` | 扉。Apple が Google の上、同じ幅（4.8-B） |
| `shots/r41-48-who.png` | **161 で落ちた画面。**Apple の後に空のユーザー名欄（4.8-A） |
| `shots/r41-plans-ja.png` | プラン（390×844 ja）。自動更新の一文・復元・規約・解約（3.1.2） |
| `shots/r41-land-plans.png` | プランを横向き 844×390 で（4.0-b） |
| `shots/r41-land-feed.png` | フィードを横向き 844×390 で（4.0-b） |

## このセッションが**しなかった**こと

- **コードは一行も変えていない。**`git diff 11480dd5 -- www/ ios/ supabase/ tools/`
  は空。
- ゲートは回していない（`npm test` も `npm run rls` も）。
- **実機では一つも押していない。**上の「押した」は全部ヘッドレスの
  Chromium で、iPhone ではない。
- `tokinets.com` の二枚は**見られなかった**（proxy が 403）。
