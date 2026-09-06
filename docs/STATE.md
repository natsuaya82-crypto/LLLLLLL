# Where this project actually stands

`CLAUDE.md` says how the code has to be written. This says what has been built,
what has not, and what is not the repository's to hold. Read it before doing
anything in a session that did not build the thing it is about to change.

The rest of `docs/` is the working detail behind the rules at the head of
`CLAUDE.md`:

| | |
|---|---|
| `ARCHITECTURE.md` | the shape of the app, and where each thing is the truth |
| `DATA_MODEL.md` | every stored thing, its owner, and whether it may change under somebody |
| `DATA_SAFETY.md` | how a language is not lost; what a save owes the server; DELETE REVIEW |
| `FEATURES.md` | every feature, its plan, its data, and whether the owner has decided it |
| `FEATURE_RULES.md` | the order, the owner decision log, scope for parallel sessions, what "done" is |
| `PAID_FEATURES.md` | `CAN`, the three plans, and what money may never touch |
| `TESTING.md` | what to run when; how to fix a bug; what needs a device |
| `CHANGELOG.md` | what a person would notice, and every change to stored data |
| `BACKLOG.md` | found and deliberately not done, and why |
| `RECOVERY.md` | バグで人のものが消えたときに運営側で戻す案。三つ並べてある。**まだ決まっていません** |
| `DUPLICATES.md` | 同じものが二箇所以上に直書きされている所の一覧。食い違っているものが八件、まだ一致しているものが十二件 |

**§ 0 was written on 2026-09-05 and § 0-a re-read that night. Every other section was read
on 2026-09-03 and has not been re-read since.** Where a claim can go stale it
carries the command that re-checks it. **Run the command; do not believe the
sentence.**

**This file is the leader's, and the leader writes it.** A stale RULE is doubted.
A stale statement of FACT is simply believed — which is why nothing here may sit
un-re-read.

---

## 2026-09-06 の夜 ── ビルド 140（一番新しい）

`master` = `5484f390`、ゲート 41/41 緑、ビルド 140 = run 34055280829。三回目の実機
指摘 22 件（キーボード 8・単語と文法とメモ 7・SNS と設定 6・取り込み 1）が全部
入った。4 枝（`claude/r3-kb` `r3-words` `r3-sns` `r3-import`）を `integ-0905` に
取り込んで ff。

**実機で確認する場所は `docs/CHECK-0907.md`** ── 番号は指摘の番号、画面の言葉
だけ。入らなかったもの・判断待ちは末尾（語順ボードの例文の行は保存前は古い順、
フォロー数は「前の値を見せて差し替え」で頼まれた形と違う、増えたキーボードは
手で消す、左端スワイプの検査の揺れは検査側で直し中）。

ゲートについてもう一つ：**コンテナが再開するとバックグラウンドのゲートは死ぬ**
（この夜 2 回、ログが fast の 124 行で止まった）。Monitor でセッションを起こした
まま回すと通る。

## 2026-09-06 ── ビルド 139

`master` = fd9de7a8、ゲート 41/41、ビルド 139（run 34038446395）。この日に入ったのは
headless の手歩き（記録は枝 `claude/walk` と `claude/walk-words` `-sns` `-kb`
`-gram` `-set` の上の WALK ファイル、`master` には入れていない。バグ 26 件）から
直した 22 件と、
オーナーの決定（上限のポップは一文に統一、未送信の印、保存はサーバーが先、
文法一覧の重複を消す、名前を空にしたら「未設定」、プランが終了しましたの説明文、
案内はキーボード1 を押して開いて戻る）。

**実機で確認する場所は `docs/CHECK-0906.md`** ── 画面の言葉だけで、★ が直した所、
◇ が実機かサーバー越しでしか見られない所。オーナーが確認する。

ゲートについて一つ：**ゲートが走っている間は作業ツリーに取り込まない。**
browser の check は www/ を生で読むので、途中で取り込むと違うコードを検査する
（この日 3 本赤になった原因）。

## 2026-09-05 の夜 ── いまの状況（一番新しい）

**訊く一行**（sha は書かない。一日で古くなる）:

```
git fetch --all --prune && git log --oneline -1 origin/master
```

**master は 2026-09-05 の 45 件を全部持っています。** オーナーが 9/5 の昼から
夜に言った 45 件（`docs/CHANGELOG.md` 2026-09-05 の節が全部）を、リーダーが
場所を指名し、8 本のセッション（opus 5・sonnet 3、`claude/tr g1 k1 c1 n1 q2 m2
u2`）が直して push し、`integ-0905` に取り込み、ゲート 41 本を緑にして master を
二度進めました（`97666ade` → `3ca3049c`）。**ビルドは出していません** ──
「全部入ったら」「朝見てから」。

**全部 CODE CONFIRMED だけです。実機で押したものは一つもありません。** 各件の
スクショは `shots/` の 9/5 分（`git log --diff-filter=A --name-only
f01b483d..origin/master -- shots/`）。

### オーナーが自分で流すもの ── `supabase/schema.sql`、一回

「3sqlはshimaみたいなやつに入れてほしい。1回で全部流すから。」 今日足した分は
三つ、どれも `drop … if exists` → `create` で何度流しても同じ:

- `report_drop(r bigint)`（:1757）── staff が通報を消す。
- `plan_staff_hold()` と `plan` のトリガー（:1957〜）── staff の `plan` は常に `pro`。
- `profile_staff_plan()` と `profile` のトリガー（:1974〜）── staff にした瞬間に
  `plan` の行を `pro` で作る。

流したら `npm run rls` の CASE が増えている分（staff でない B は消せない、
staff の plan は free に戻らない）が実物でも真になります。

### 今日、形が変わったもの ── 索引。中身は CHANGELOG

- **投稿の意味欄は辞書と文法で組む。機械翻訳は無い。** `www/post.js` の `pwMn()`
  → `LinguaGrammarEngine.translate.toNatural(model, line, lang)`。`postTr()`・
  `TR_SEAM`・`post.tr` は削除。「単語はその単語の意味を 文法は並び替えた単語たち
  が文章として成り立つように。きかいほんやくはつかわない。」
- 文法ページ: 語順は常に出る、規則の画面は「足す文字」と「前後」だけ、時制・相の
  章、規則と例文は一枚。単語に `sub`（下位分類）。
- 通報画面: 誰の投稿を誰が通報したか、投稿を消す／凍結／通報を消す。
- メモは本文一枚、削除は一覧のスワイプ。キーボード編集は保存ボタンが KEEP の道。
- 保存の成功は `back()`。スワイプで戻るは引数の変わった画面でも。

### リーダーのやり方 ── `docs/LEADER.md`

一往復（オーナーの言葉 → リーダーがコードを読んで行まで指名 → セッションは直す
だけ → 15 分）、15 分監査、`create_session` には `source_url` を必ず、sonnet は
この指示の形だと「注入では」と止まるので opus で立てる、`fire_trigger` に `text`
を付けると別のセッションが立つので一通ごとに trigger を作る。全部 9/5 に起きた
ことで、そこに書いてあります。

### まだ直っていないもの ── 9/5 の 45 件の外

- 「文字増殖バグは治ったの？」── 押していないので分かりません。
- 「保存できませんでした」の `save.no`、`syMerge()` の片道、電波の無いときの
  写し ── 9/4 の五つの決定のうち着手していないものはそのまま（下の § 0-a）。

---

## 0-a. 2026-09-04 ── いまの状況

**sha はここに書きません。**一日で古くなります。訊く一行:

```
git fetch --all --prune && git log --oneline -1 origin/master
```

**実機で見ているのはオーナーだけです。**ここに書いてあるものは、断りが無ければ
CODE CONFIRMED だけ。**検査の緑は証拠になりません。**

**出ているビルドの番号もここには書きません。**ワークフローの run number が
唯一の出所で、それは GitHub Actions の履歴にしかなく、このリポジトリからは
読めません（§6）。

### 2026-09-04 の夜に決まったこと ── 五つ。全部が仕様

**オーナーの言葉そのものは `docs/FEATURE_RULES.md` の決定ログの一番上の五件に
あります。ここは索引です。要約で仕事をしないでください。**

1. **「保存されない」は仕様です。**アプリが落ちて消えること、電波が無くて言語が
   開かないこと、送れていない分が次の起動まででなくなること ── 全部です。
   オーナーが自分で読んだうえで決めました。**但し書きとして書かないこと。
   「オーナーに確認が要る」ものではありません。**
2. **ただし「失敗して黙って消える」は仕様ではありません。**保存がサーバーで
   失敗しても、人が作ったものは目の前に残ります。もう一度押せば送れる。
   **着手していません** ── `www/core.js` の `save()` の catch はまだ空です。
3. **電波が無いときは、前に読み込んだ分を出します。見るだけです。**作れない、
   保存できない。**その写しはサーバーへ戻りません ── 片道です。**理由は
   `syMerge()`（`www/sync.js`）が壊れた写しでサーバーの正しいほうを上書きする
   バグだからです。**着手していません。**いまスライスはメモリだけなので、電波が
   無いと出せるものがありません。
4. **`ONE.md` を消しました。**承認されなかった案です。次の人が仕様として読む
   危険がありました。
5. **オンラインは進める。パッチはオーナーが後で流します。**アプリ側は待ちません。

### 2026-09-04 に書かれたもの ── オンライン一本化。**master に入っています（9/5）**

**訊く一行:**

```
git merge-base --is-ancestor origin/claude/online origin/master && echo IN || echo NOT
```

- **保存を押した瞬間にサーバーへ行きます。**前は起動と扉の二回だけでした
  （`netSaveUp()` を `bkTouch()` から）。
- **バックアップのファイルが無くなりました。**書く側、読む側、設定の一覧、
  Swift ごと。**`tools/backup-check.mjs` も丸ごと消えました。**
- **言語の写しは iPhone のディスクにありません。**スライスはメモリ（`LSL`）。
  古い鍵はまだ読みます ── 更新した人の言語が空にならないように。
- **アカウントを消したら検索履歴も消えます**（引き継ぎ書六章の1）。手で書いた
  一覧をやめて、数える形にしました。

**四つとも master にあります**（9/5 に取り込み。`git show origin/master:www/core.js | grep SET_PHONE`）。

### ゲートの本数 ── master は41本

**数えました**（`tools/gate.mjs` の `FAST` と `SLOW`）。14 + 27 = 41。
**`backup-check` は無くなりました。**
**本数はここではなく、走らせた最後の行で読んでください。**

### 引き継ぎ書六章の11件 ── 十件は master、一件は枝の上

**確かめたのは「そのコミットが master の先祖か」だけです。押していません。**
実機で見ているのはオーナーだけです。

| 六章の | 何 | どこ |
|---|---|---|
| 0 | 文字の増殖 | **master**（`claude/dup` を `77bba34b` で取り込み） |
| 10 | キーボードの一番下の ＋ | **master**（同じ取り込み、CSS は `6a6056f8`） |
| 1 | アカウントを消したのに検索履歴が残る | **`claude/online` / `claude/rules`。master にはまだありません**（`1e3eed4b`） |
| 2・3・4〜9 | 更新できない、フォロワーの数、実機の写真の六つ | **master**（`claude/tl2`。報告は `docs/reports/tl2-2026-09-04.md`） |
| 6（バッジ） | 相手の画面に有料のバッジが出ない | **アプリ側は済み。サーバーの列がまだで、そこはオーナーが SQL を流すまで動きません** |

**バッジだけがオーナー待ちです。**流す SQL は書けていて、本物の PostgreSQL で
確かめてあります ── `docs/reports/badge-sql-2026-09-04.md`。`profile_seen` と
`post_seen` に「この人はプロか」を出す列一つです。**`supabase/schema.sql` には
まだ入っていません。**

### 2026-09-03 の決定 ── 一日で三つ、どれも仕様

**「1アドレス1アカウント」「これは絶対課金もアカウントごと言語もそう」**
「GoogleとかAppleのログインはあくまでもメアドより楽な手段を増やしてあげるための
手段」「Googleでも同じアカウントならメアドで入っても同じアカウントでログイン
させればいいやろ」 OWNER 2026-09-02。

Apple も Google もメールも、**同じアドレスなら同じアカウントへの三つの入口**です。
OAuth 同士は Supabase が自分で束ねます。束ねられなかったのはメールの道で、
`/auth/v1/signup` が「新しい人を作る」要求だったから ── オーナーが実機で
Google と同じアドレスを打って二つ目のアカウントを立ててしまい、それで見つかりました。
**いまは `/auth/v1/otp`** です（`netMailOtp()`）。あれば入り、無ければ作る。

**扉の道は アドレス → コード → パスワード** です。「普通に6桁のコード打ってから
パスワード要求だろ」OWNER 2026-09-02 ── 引かれているのは順番です。作成の面は
アドレスだけを訊きます。パスワードはコードが通ったあと、再設定と同じ画面で
決めます（見出しだけ道で分かれる ── `OBM.fresh`）。**コードを打つ画面は一枚**
（`obCodeHTML`）。登録の道も再設定の道もそこに来ます。

**コードは8桁、再送信は60秒**「8桁で60秒再送信、有効期限は知らん」OWNER
2026-09-03。**桁数を決めているのはアプリではなく Supabase の設定**です
（`supabase/setup.md` の 8 番）。www/ は桁を一度も数えません ── 数えると同じ
問いを二箇所で答えることになり、設定が動いた日にアプリだけが断ります。
アプリが持っているのは秒のほうだけ。**有効期限はまだ決まっていません。**

**課金は同じ iPhone でも引き継ぎません**（決定ログ `d47a578`）。**未実装です。**

**今は iPhone だけ。**そのあと iPad、Android。

### ログインの決定 ── OWNER 2026-09-03。全部が仕様

1. **1アドレス1アカウント。**「1アドレス1アカウントこれも徹底ね。ルール。」
   Apple の「メールを非公開」は別のアドレスなので**別アカウントで正しい**。
2. **アドレスの大文字小文字は区別しない。**「文字列が同じなら」同じアカウント。
3. メアド・Google・Apple は**同じアドレスなら同じアカウントへの三つの入口**。
4. **Google と Apple で作った人はパスワードが無いのでメアドでは入れない。**
5. **設定からパスワードを付けられる。**「設定からつけれるように。」付ければ
   メアドでも入れる。**新しい道は作らない** ── 既にある「パスワードを忘れた」
   と中身は同じ。
6. **ログアウトしたら前の人のものは何も見えない。**「プライバシー的にもやばい
   だろ」。
7. **ログイン中に別のアカウントには入れない。**先にログアウトが要る。
8. **アカウント削除はサーバーで消し切るまで完了しない。**「削除し切ってないと
   消えない」。途中で切れたら消えていない扱いで、次に開いたとき続きから消す。
9. **同じアカウントで二つから入っていて片方が消したら、もう片方も確実に消える。**
   もう片方はログアウトされ、画面ごと出される。
10. **ネットが無いときはログインできない。**そう出す。

**復旧はバグで消えたときだけ。**「復旧は自分で消した時じゃなくてバグで消えた時
の話な」「バグが多すぎて、セーフティーネットを作らないと炎上するだろ」。
自分で消したものは戻しません。案は `docs/RECOVERY.md`、**残す期間はまだ
オーナーが決めていません。**

### 決定ボタンの決定 ── OWNER 2026-09-03

**「なにもない時は薄い灰色、何か打ったら金にする」「これが決定ボタンのルール」。**
右上の決定ボタンは `navDo()`（`www/shell.js`）が作る一箇所だけ。状態は二つで、
金は `navon` が付いているとき。角も枠も塗りも無く、動くのは文字の色だけです。
`keep-check` が八つの画面で押さえています。

同じボタンが `navdo` `navq navdone` `navq navsave` の三通りに直書きされていて、
三つ目には色の定義が無く、**文字を描く画面の保存だけ一度も光りませんでした。**
「同じボタンは共有して使用すればいいのに直書きで書いてるだろだからこう言うこと
が起きてる」。**他の直書きは `docs/DUPLICATES.md`** ── 食い違っているものが
八件、まだ一致しているものが十二件。**いつ直すかはオーナーの判断待ちです。**

### 2026-09-02 に入ったもの

- **一時間たっても保存が届く。**`netResume()` は起動の一回だけで、アクセス
  トークンは一時間で切れる。開いたままのアプリはサーバーへの書き込みが全部
  黙って落ちていた ── slice も plan も draft も `bad` が空関数。`netSend()` が
  401 で更新して一度だけ投げ直します。`netPlanUp()` と `netSlicePut()` は
  自前の XHR をやめて `netSend()` に乗りました（その二つが線の外にいた）。
  `tools/token-check.mjs`（新）が `XMLHttpRequest` だけを偽物にして持ちます。
- **メール確認の画面に戻ると再送信。**`obCanBack()` が `appIs()==='door'` で
  扉ぜんぶに false を返していて、六桁の画面から降りる道が無かった。
  `obAtDoor()` / `obDoorBack()` が一箇所。`open-check` 2c。
- **1アドレス1アカウント**（上）。`open-check` 2b。
- **言語にアカウントの印。**言語を作る道は全部 `SESS.uid` を押します ──
  `langNew()`、`langForAcct()`、`langSeenAdd()`、`netLangsDown()`、
  `bkRestore()`、そして `langMigrate()` は `mig` を通して。印の無い言語を
  自分のものと答えるのはオンボーディングの歩きの途中（`SET.done` が偽）だけで、
  扉を出た `obFinish()` がそこで印を付けます。どの iPhone かを憶える仕掛けはありません。
- **Keychain。**読めなかった Keychain に段を書きません。`Transaction.updates` は
  届いた取引が終わり（返金・過ぎた失効日）を言った時だけ下げます ── 更新も
  家族の購入も同じ口に届くので、権利一覧が追いつく前に払ったばかりの人の段が
  消えていました。`isUpgraded` は除きます（格上げは失効日が過去になる）。

### 2026-09-03 に入ったもの

**ビルドに乗ったかは Actions の履歴を見ること。**このリポジトリからは読めません。

- **`shell.js` が読み込みの途中で止まる欠陥。**`migratePos()` は `save()` を
  呼び、`save()` は `www/backup.js` の `bkTouch()` で始まり、`backup.js` は
  `shell.js` より**後**に読まれます。だから古い品詞ラベルを一つでも持っている
  iPhone では、`shell.js` がその行で投げて**その下の定義が全部消えました。**
  画面には何も出ません。呼ぶ場所を `www/boot.js` へ移しました ── boot.js は
  最後に読まれ、移行を走らせるためだけにあります。定義は `shell.js` のままです。
- **アカウント削除が平キー八つも消す。**`LS_FLAT` は言語に id が無かった頃の
  八つ（`lingua.words` `lines` `lang` `script` `letters` `notes` `phases`
  `talk`）で、`langMigrate()` がそこから言語へ写し、`lsWipeAcct()` が
  アカウントと一緒に持っていきます。**一箇所に書いて二つが読む**ので、
  片方だけ足すことができません。
- **全角 ＠ で人が検索できる。**`netHandleOf()` が落とすのは `/^[@＠]+/` で、
  U+FF20 も落ちます。日本語キーボードが出すのは全角のほうで、
  `handle.ilike.*＠aya*` は `^[a-z0-9_]{2,24}$` に絶対当たりませんでした。
  **同じ苦情が二度来て初めて検査が付きました** ── `tools/find-check.mjs`。
- **検索の履歴 五件。**`SNS_RECENT=5`、サーバーの `recent_search` が記録で
  `SET.recent` が写し。**入る道は `snsGo()` の一本だけ**で、🔍 を押した時だけ
  入ります ── `snsSetQ()` は一文字ごとに走るので、そこから書くと
  「a」「ay」「aya」が三件になります。一件ずつ消せます（`snsDropRecent()`）。
  ★（`saved_search`）とは別のテーブルで、混ぜてはいけません。
- **一行の欄で Enter が効かない。**`www/act.js` の一箇所だけが言います。
  markup には `on*=` を書かないので（規則 3）、Enter は前からこのアプリのもの
  でした。
- **戻るスワイプは、後ろに画面があるときだけ。**`navBackTo()` が `NAV` の
  最後から二つ目を答え、`swPrev()` はそれと `NAVBK` が指す画面が一致したときだけ
  絵を返します。タブを押すと `NAV` は捨てられるので、タブの画面には後ろが
  ありません。
- **`lsWipeNS()` と `netMember()` が消えました。**前者は `lingua.` で始まる
  キーを全部持っていく関数で、**別アカウントの言語まで消していました。**
  後者は §3 に書いてある通りです。
- **`admin` は `handle = 'lingua'` で決まります。**`ADMIN_HANDLE` が
  `www/net.js` に、`is_admin()` が `supabase/schema.sql` に。
  `profile.admin` の列は落としていませんが、誰が上かを決めるのは handle です。
- **おすすめの刻みは 4 時間・太平洋時間**（`supabase/schema.sql`、
  `now() at time zone 'America/Los_Angeles'` を4時間で切り下げる）。


- **パスワードの画面からアプリに入れる**（`db40b2e`）。六桁はセッションを取る
  ために使われるので、そこに立つ人は既にサインイン済み。`netSetPass()` が
  通らないと閉め出された形で止まっていました。
- **カードの共有**（`d09cc16`）。`navigator.share` も `<a download>` も
  WKWebView では落ちるのに、必ず「保存しました」と出ていました。ネイティブに
  PNG を書かせて `LinguaShare.shareFile` に渡します（手書き用紙の PDF と同じ道）。
  **うまくいったときは何も言いません** ── シートが開いたことが答えで、そのあと
  保存するか送るかキャンセルするかは分からないので。
- **値段と、買った直後の一言**（`e5a10cc`）。値段の問い合わせに 25 秒の上限が
  付き、値段の場所に状態が出ます ── 打ち込みの `$99.99` が出続けていたのは、
  返事が来ないと印が立ったままで二度と訊き直さなかったから。買った直後の一言は
  「押したもの」を言います（`r.bought`）。持っている一番上の段ではありません。

### 走っているセッション ── 2026-09-03

`claude/rc`（RevenueCat、公開キー待ち）が未取り込み。
保存のポップは決定だけあって未着手です（決定ログ `9bbd83d3`）。

**この二行を信じないでください。**枝が取り込まれているかは名前からもこの行
からも推測せず、訊くこと ── この段落は半日で二度変わりました:

```
git merge-base --is-ancestor origin/<枝> origin/master && echo IN || echo NOT
```

### まだ直っていないと分かっているもの

- **キーボードの設定に飛ばない。**オーナーが実機で見つけたもの。
  `kbSettings()`（`www/keyboard.js`）が `LinguaShare.settings` を呼び、
  ネイティブは `UIApplication.openSettingsURLString` を開きます。橋が無いときに
  無言で終わる枝があります。**どこで止まっているかは押さないと分かりません。**
  押せるのはオーナーだけです。原因を並べるのは直すことではありません。
- **アプリはレシート無しで自分の行に `pro` を書ける。**`schema.sql` の RLS が
  閉じられるのは「他人の段を読み書きできない」まで。`www/net.js` の
  `netPlanUp()` の上のコメントが同じことを書いています。**決めごと** ──
  閉じるには Apple のレシートを iPhone でないものが検証する必要があり、
  それは一行のコードではなく決定です（`docs/scope/claude-acct2.md`）。

### オーナーの側に残っているもの ── 2026-09-03 現在

**下の六つは一つもこのリポジトリから見えません。**Supabase と App Store
Connect と DNS のダッシュボードの話なので、**済んだかどうかはオーナーに
訊くしかありません。**ここに「済み」と書けるのは、オーナーがそう言った日と
一緒だけです。

1. **`supabase/schema.sql` をダッシュボードに流す**（`supabase/setup.md` § 2）。
   流すまで、人の言語のページで単語と文法の ↓ を押しても何も落ちてきません。
2. **メールの送信設定と DNS**（`supabase/mail.md`）。**これが先です** ── 六桁が
   飛ばないと審査用のデモアカウントも作れません。
3. **審査用のデモアカウント。**扉を通らないと何もできないので、審査員が入れ
   なければ即リジェクト。`natsuaya82+demo@gmail.com` のように自分のアカウントと
   分けること（審査員にパスワードを渡すため）。言語一つ、文字を何個か、投稿を
   二つ三つ入れておくこと。
4. **Supabase の Authentication → Sessions の二つの値**を見て
   `supabase/setup.md` に書く。「久しぶりに開いたらサインアウトされるか」に
   このリポジトリは答えを持っていません。
5. ウィジェットのプロビジョニングプロファイル、Apple / Google サインインが ON か、
   スタッフと admin、請求の上限 ── `docs/apple.md` § 4、`supabase/setup.md` § 4 § 5 § 6。

## 0. ずっと効いている決めごと

**役割。**取り込むのは**サブリーダー①**（OWNER「取り込むのはサブリね？」）。
そのままゲートもそこで回します。**リーダーは配ってビルドを引くだけで、
取り込まず、ゲートを回さず、コードを書きません**（OWNER「君が作業するんじゃ
なよね？」）。`docs/SESSIONS.md` と `CLAUDE.md` が本体です。

コードを読んで分かっていて、まだ直っていないもの:

| 何 | 分かったこと | どこ |
|---|---|---|
| 今日のお題の日付 | `netDay()` が `order=on_day.desc&limit=1` と訊いていて、**今日を訊いていない。**古い行が一つあれば、それが永久に「今日」として出ます。`on_day` はどこにも描かれません | `www/net.js` `netDay()` |

**オーナーは iPhone SE2 と iPhone 17 で実機確認しています。**OWNER 2026-08-28
「iPhone se2と17で作業してる」。**一番狭い iPhone と一番広い iPhone の両方**なので、
画面の話はその二つで成り立つかを考えること ── `press` が測っているのは 402pt の
一台だけで、SE2 の 320pt はそこに入っていません。

**でんわ、という語を使わないこと。iPhone と書く。**二度言われた。二度目は
「使うなって言ってんだから使うな」。報告でも、コメントでも、画面の文字でも、docs でも。
**リポジトリ全体で 0 件にしてある。増やさないこと。**

**そして「端末ごと」という単位も使わないこと。**「端末という単位は使わない。全部
アカウントごと」OWNER 2026-09-03。持ち物は全部アカウントのもので、iPhone は窓です。
一台を指して言う必要があるときだけ iPhone と書く。

**そして、オーナーが言っていないものを「」で囲まないこと。**一度目のとき、その語を
7行だけ残した ── 理由は「オーナーの原文だから」だった。**そんな発言は無かった。**
私たちが書いた地の文に括弧を付けていただけで、オーナーに「言ってねえよ」と言われた。
**括弧の中はオーナーが実際に言った言葉だけ。**それ以外は地の文で書く。

---

## 1. `master` is the app again. Keep it that way.

A fresh clone of `master` is the current app. **No sha is written here** — a sha
has a shelf life of about a day.

The gate is **39 checks** — twelve that need no browser and twenty-seven that do.
Count `FAST` and `SLOW` in `tools/gate.mjs`, which is the only place the number
lives.

**Never write "the gate is green" here unless you watched it go green.** A
sentence in this file claiming a green nobody saw is the failure this file
exists to prevent. The gate is run once, by whoever integrates, after
integrating.

**Never name a branch or a sha here.** Both have a shelf life of about a day.
Which branches are in is a command, not a sentence:

```
for b in $(git branch -r | grep -v HEAD); do \
  git merge-base --is-ancestor $b origin/master && echo "$b"; done
```

**A branch being an ancestor and a branch being finished are different facts.**

Before deciding anything is missing:

```
git fetch --all --prune                      # ALL of it, not just master
git branch -r                                # what actually exists
for b in $(git branch -r | grep -v HEAD); do \
  echo "$b +$(git rev-list --count origin/master..$b)"; done
```

**Before believing any of that: `git branch -r` can be lying, and on a fresh
clone it usually is.** The `git clone --depth 1` that `add_repo` tells a
session to run leaves a fetch refspec that names ONE branch:

```
git config --get-all remote.origin.fetch
  → +refs/heads/master:refs/remotes/origin/master      # master, and nothing else
```

With that in place `git fetch --all --prune` brings back master and nothing
else, and `git branch -r` prints `origin/master` alone — **and that looks
exactly like a remote with one branch on it.** The repair, which every session
should run before the three lines below:

```
git config --unset-all remote.origin.fetch
git config --add remote.origin.fetch '+refs/heads/*:refs/remotes/origin/*'
git fetch --all --prune
git ls-remote origin | wc -l        # the remote's own answer, not the clone's
```

**`--all`, and `git branch -r`, are the point.** Comparing HEAD against
`origin/master` alone cannot see `master` itself being the stale thing. **Two
zeros against `master` prove you match `master`. They prove nothing about
whether `master` is the app.**

If a branch is ahead of `master`, find out why before writing a line, and say
so to whoever is running it — a number here is the difference between "not
built" and "not fetched".

The branch has only ever been ahead of `master` in a straight line, never
beside it, so bringing `master` up is a fast-forward and cannot conflict.
Pushing to `master` is the owner's call and is asked for each time.

---

## 2. What is built and works

- **The free plan, whole.** Thirty-eight letters — `a`–`z`, `!`, `?` and a
  digit for every value of the base — your own shapes on them, the dictionary,
  the grammar stages, the notebook. (Twenty-eight is what it was before the
  free plan got its own digits; measured on a fresh free language it is 38.) `CLAUDE.md`
  → "What the free plan is" is the specification and is current.
- **The system keyboard**, `ios/App/LinguaKeyboard/` — six Swift files. It is
  built, it is on TestFlight, and a person has typed their own letters on it on
  a real phone. App Group `group.com.tokinets.lingua`; appId
  `com.tokinets.lingua`.
- **The hand-over from app to keyboard**, `www/share.js` (chapter 23) — the
  keys with the shapes already cut onto them. The call is
  `Capacitor.nativePromise('LinguaShare','write',…)` and **not**
  `Capacitor.Plugins.*`; `docs/keyboard-extension.md` says why, and it cost four
  builds to learn.
- **Accounts.** Sign up, sign in, verify, sign out, password reset, and a
  profile with a handle. `www/net.js`.
- **The onboarding, in the owner's order** 「オンボーディング→最後にログイン」.
  Draw one letter, be walked through the app, name the language, **then** the
  door — `OB_DRAW=0, OB_NAME=1, OB_IN=2` in `www/onboard.js`, with `OB_TOUR=3`
  outside the counted range because the walk is not a screen of that file.
  There is no way past the door: 「あとで」 went on 2026-08-26 and stayed gone.
  What the walk made before the account existed goes to the server at the
  door — `obFinish()` calls `netLangSync()`.

  **`open-check` is what holds the order.** It boots from an empty
  `localStorage` and reads `#app` rather than asking `appIs()`, because
  `appIs()` can answer correctly while the screen is wrong. **Four** states,
  four screens: new phone → the onboarding; part-way through the walk → the app
  dimmed with one thing lit; finished then signed out → the door; finished and
  signed in → the app.

  `appIs()` answers `'app'` for the walk before it asks about the session — the
  walk IS the app. Without that, a new phone draws its first letter, presses
  done, and is shown the door. `obTourOn()` is
  `!SET.done && ob.step===OB_TOUR`, false for every finished phone.

## 3. What is NOT built, however much it looks like it is

**The timeline is on the server.** Re-check rather than believe:

```
grep -n "rest/v1" www/net.js          # what the app actually asks the server for
```

Today that is `profile`, `post`, `react`, `follow`, `block`, `report`,
`draft`, `saved_search`, `recent_search`, `post_seen`, `profile_seen`,
`language_seen`, `prompt`, `language`, `slice`, `plan` and the RPCs. `netPush()` sends a post — its photographs and its voice with it, through
`netUpPics()` and `netUpVoice()` into the `post-media` bucket — `netFeed()`
reads the two timelines, `netNotices()` reads the notices, `netDraftUp()` sends
a draft, `netLangSync()` sends and merges the language, and `postCatchUp()`
sends whatever this phone has that the server has not. **`lingua.posts` is a
copy and not a home**: the phone keeps what works with no signal.

**An account is required to read the timeline or post to it**, decided
2026-08-18 and held by `post-check`. `vFeed`/`vExplore`/`vNotif` answer with the
app's own door when there is no session.

**There is one kind of account and there are no anonymous ones**
「匿名アカウントはねえよ」. **There is one question and it is `netSignedIn()`.**
`netMember()` was the second one — a session that also carries a name — and with
no anonymous accounts it could never answer no, so it was a true question with
nothing left to ask. It and `netAnonTok()` are **deleted**, and every one of the
twenty-eight callers asks `netSignedIn()`. Do not put either back; the comment
above `netOut()` in `www/net.js` says why at length.

There is no `netAnon()` either — the comment where it stood says so — and
`supabase/schema.sql` **drops** `has_account()`
(`drop function if exists has_account()`), so every policy that used to ask it
asks `is_member()` now.

**OWNER DECISION 2026-08-26**, and it settles what the paragraph above was
groping at:

```
  基本は全部サーバー管理  言語周りだけバックアップに file 使う
  制作はオフラインでも可能  次つながった時に更新される
  言語はアカウントないと作れないです
  SNS部分はオフラインでは動かないよ　そりゃそう
  アカウント消したら残るわけがない
```

**Two lines of that block were replaced on 2026-09-04 and the rest stands.**
「言語周りだけバックアップに file 使う」 — there is no file: `www/backup.js` is
one function now (`bkTouch`), and the writing, the three generations, the list
on the settings screen and the Swift behind it are deleted. 「制作はオフライン
でも可能　次つながった時に更新される」 — making and saving need a signal, and a
save reaches the server the moment it is made. With no signal what the app shows
is what was loaded before, to look at (`CLAUDE.md` rule 22). **What still
stands:** always in sync, on every plan; **making a language still needs an
account**; deleting the account takes the languages with it; the SNS side does
not work offline. The newer decisions are in `docs/FEATURE_RULES.md` under
「オンライン前提に切り替える」 and 「電波が無いときは、前に読み込んだ分を出す。
見るだけ」.

**`language` and `slice` are written and read.** **Count it rather than believe
it:**

```
grep -o "rest/v1/[a-z_]*" www/net.js | sort | uniq -c | sort -rn
```

On 2026-09-03 that answers: `profile` 13, `rpc` 12, `language` 8, `follow` 4,
`draft` 4, `saved_search` 3, `report` 3, `recent_search` 3, `react` 3,
`post_seen` 3, `post` 3, `block` 3, `slice` 2, `prompt` 2, `plan` 2,
`profile_seen` 1, `language_seen` 1 — and the twelve `rpc` are `account_ban`
`account_delete` `account_unban` `admin_counts` `email_taken` `feed_fo`
`feed_hot` `notices` `post_hide` `post_show` `staff_add` `staff_drop`.
`netLangSync()` is fired by `boot.js` at launch, and `syMerge()`
(`www/sync.js` ch 26) is what puts two copies together by adding both.

**Still unused: `quote` and `publication`. Those two, and nothing else.**

**`prompt` is used now**, from 2026-08-23: the day's sentence stands at the top
of the timeline and the composer opens with it already in the meaning, where it
cannot be edited. `post.prompt` — a column that had been written and never
filled — is what says which day a post answers. The app side is in; **the
server side is not**, and until somebody does `supabase/setup.md` § 9 (a Gemini
key, the `daily-prompt` function, a cron line) there is no row for today and the
top of the timeline is the plain write-row it has always been. That is the
degrade, and it is deliberate: no half-working screen.

**The online half was redesigned on 2026-08-22 and settled on 2026-08-26.**
Everything belongs to the account, and **the server is where things live — the
timeline and the language both.** The entries at the head of
`docs/FEATURE_RULES.md` § Owner decision log say it.

Order, and where it stands:

1. **One kind of account — done.** There are no anonymous ones
   「匿名アカウントはねえよ」. `netSignedIn()` is the one question, and
   `obNeed()` asks it at the six things other people would see — a post, a
   like, a boost, a report, a follow, a block.
   The door is the LAST step of the onboarding and there is no way past it.
   Held by `open-check` and by `migrate-check` case 7.
2. **`is_member()` is the one question — done.** `has_account()` is dropped in
   `schema.sql`, and the `language` write policies that used to ask it ask
   `is_member()`. `language.owner` points at `auth.users` rather than
   `profile`. Held by `npm run rls`.
3. **The language living on the server — done.** `language` holds the name,
   the licence, the date and `published_at`; **`slice` holds every slice of
   it**, one row per slice of `SLICES`, carrying exactly the string
   `localStorage` holds. `netLangRow()` makes the row, `netSlicePut()` upserts
   a slice, `netSlices()` reads them back, and `netLangSync()` — fired from
   `boot.js` at launch — puts the two copies together through `syMerge()`,
   which adds both sides and lets neither win by being newer.
4. **The plan — on the account, done.** OWNER 2026-09-01: 「課金とアカウントと
   キーボードはアカウントに結びつく」. It is **its own table and not a column on
   `profile`** — `plan` in `supabase/schema.sql`, one row per uid.
   `netPlanUp()` posts it, `netPlanSync()` reads both copies back and takes the
   higher rung, and `SET.planPend` holds what a launch with no signal could not
   send. On the device `setFor()` parks the six per-account settings under the
   uid that had them, so signing in as somebody else does not inherit a plan.

   **What is still missing is the receipt.** The phone writes its own row, so
   anybody who can reach this database can set their own plan. Closing that
   needs Apple's receipt checked by something that is not the phone, which is a
   decision rather than a line of code — `docs/scope/claude-acct2.md` holds the
   three ways and why none is written.
5. The rest of moderation — **the tombstone in a thread (`postTomb()`), the
   notices (`vNotif`) and the frozen state are in.** What is left is the ⋯
   menu on a profile.
6. Terms and privacy, under `/home/user/tokine2`, linked from Settings and not
   from the onboarding. Not started.
7. What a purchase OPENS. StoreKit is **written** ── `ios/App/App/LinguaStore.swift`,
   `www/store.js`, and `setPlan` in `www/settings.js` is `storeBuy`'s one caller.
   The plan now reaches the server too (item 4). **What is not done is the
   receipt**: nothing but the phone says the purchase happened.

**Everything still to do that needs the server is one list**, in
`docs/FEATURES.md` → "What is left to do online": the plan (the one with money
on it), cloud storage, publishing a language, quoting, the day's sentence, and
push. Read that before starting anything online. Blocking, reporting, reading
the reports, taking a post down, ejecting somebody and deleting an account are
all done — both halves of what App Store guideline 1.2 asks for.

**Somebody has to be made staff before any of it is reachable.** One SQL line
in the Supabase dashboard, `supabase/setup.md` § 5. Nothing in the app grants
it and nothing is meant to.

**Apple sign-in and Google sign-in are both wired, on both sides.**
The buttons went from "not in this build" to a real plugin —
`@capgo/capacitor-social-login`, both providers, Facebook and X switched off in
`capacitor.config.json` so their SDKs are never linked.

- **Apple: done.** `com.apple.developer.applesignin` is in
  `ios/App/App/App.entitlements`, and the owner reports the App ID capability
  and the regenerated profile done (2026-08-27).
- **Google: done, and DEVICE CONFIRMED 2026-09-01.** The owner pressed it on
  build #107: 何も出ません押したら普通にログインされるけど？ The sheet opens and
  comes back with a session. `GOOGLE_IOS_ID` in `www/net.js` and the reversed
  scheme in `Info.plist`'s `CFBundleURLTypes` are the same client id, the
  Supabase provider is on, and neither value is a secret: the id names the app
  and proves nothing.

  **The nonce question is closed, and the answer is: send none.** It was open
  because `www/onboard.js`'s comment argues it from APPLE's behaviour, and
  nobody had checked that Google's SDK behaves the same. It does —
  `@capgo/capacitor-social-login` 8.4.4 only puts a nonce in the request when
  it is handed one, so with `netIdToken(who, tok, '', …)` both sides stay
  quiet and Supabase's 「Passed nonce and nonce in id_token should either both
  exist or not」 never fires. `netIdWhy()` stays: it costs nothing and it is
  the only thing that could name the side if this ever comes back.

**What this file cannot see.** App Store Connect, the Apple developer site,
Google Cloud and the Supabase dashboard are outside the repository. Where a
line above says one of those is done, it is because the OWNER said so, on the
date given — it is not something anybody verified from here, and it must not be
written as though it were. Read `git grep` for the repo side; ask for the rest.

**StoreKit is written, and has never run on a device.** `LinguaStore.swift`
holds the four products, `www/store.js` is the only thing in `www/` that talks
to it, and `setPlan` in `www/settings.js` is `storeBuy`'s one caller. The owner
reports the four subscription products made in App Store Connect (2026-08-27) —
which this repository cannot see. Asking for a product that does not exist is
not an error: StoreKit returns nothing for it, so a missing product looks
exactly like a button that does nothing. That is what to expect if a purchase
does not start. The plan itself lives in the Keychain rather than in the
settings file — `ios/App/App/LinguaPlan.swift` says why, and what it does not
stop.

**No landing page in this repository.** `vercel.json` copies `www/` into
`public/` and serves the app itself as a static site. There is no marketing
page, no separate site, and no `/lp` anywhere. Anything of that kind is a new
thing, not an edit to an existing one.

## 4. What is not the repository's to hold, and never will be

Things only a person with a browser and a login can do. Each has a file that
says exactly what to click, because that is the only form they can take here.
**The last row is different in kind: it is not a click but a decision, and § 4a
below is where those wait.**

| what | where it is written | who does it |
|---|---|---|
| Everything in the Supabase dashboard, in order, and how to tell whether it worked | `supabase/setup.md` | the account owner |
| The confirmation and reset mail — SMTP fields, DNS records, templates | `supabase/mail.md` | the account owner, in the Supabase and Resend dashboards |
| TestFlight, the two subscriptions, certificates and profiles | `docs/apple.md` | the account owner, in App Store Connect and the Apple developer site |
| The GitHub Secrets the iOS build reads | `.github/workflows/ios-deploy.yml` names them | the account owner, in the GitHub UI |
| **The decisions themselves — what only the owner can settle** | **§ 4a below** | **the account owner** |

**No agent can write a GitHub Secret**, so a build failing on a missing one is
never something to fix in the repository.

**The `service_role` key must never appear here, and does not.** The key in
`www/net.js` is the *publishable* key, which is public by design and is meant to
sit in a phone. Passwords are never held, stored or logged by the app: the field
goes to Supabase over TLS and only the token pair is kept, in `localStorage`
under `lingua.sess`.

## 4a. オーナーが決めること ── いま待っているもの

**ここに並べるのは、コードでは片づかないものだけです。**セッションが調べて、
選択肢まで作って、**最後の一行だけが空いているもの**です。

**重い順です。上の二つが決まらないと、下は進みません。**
**コードの言葉（ファイル名・関数名・行番号）は、この節の一番下にだけ置いて
あります。本文には出しません。**

**サーバーの管理画面ですることは `supabase/setup.md` § 11、Apple まわりと
実機で押すことは `docs/apple.md` にあります。ここには置きません。**

---

### 一 ── **【決まりました】「消えないための仕組みを一本にする」設計**

**オーナーが通しました** ──「オンライン進めて。パッチは俺が後で流す」
（2026-09-04）。**書き始めています。**`claude/online` の上に、保存が押した瞬間
にサーバーへ行く形、バックアップのファイルの削除、スライスのメモリ化が入って
います。**master にはまだありません**（§ 0-a）。

**止めていた二つの穴には、どちらも答えが出ました。**壊れたものが無事な
サーバーを上書きする件は、電波が無いときの写しに**サーバーへ戻る道を作らない**
ことで消えます。保存の失敗が黙って済まされる件は「なら失敗して残るにするべき」
と決まりました。**どちらもコードは着手していません。**

---

### 二 ── **版は、どの大きさで積むか**　【一を通したら、これが最初】

**決めること:** 「前の状態に戻せる」を作るとき、**何を一つのかたまりとして
残すか。**

**いまどうなっているか。** **読んで確かめました。押していません。**
サーバーには、言語一本につき**いまの姿が一つあるだけ**です。前の姿はどこにも
残りません。上書きされた瞬間に消えます。断る所はサーバーにも通信にも
ありません。

**選ぶと何が変わるか。**保存を一回押すたびに、サーバーに積まれる量です
（5000 語の言語で測った数字）。

| 積み方 | 一回ぶん | 人にとって何が変わるか |
|---|---|---|
| **言語まるごと** | 685 KB | 一番単純。**文字を一つ直しただけでも、言語ぜんぶが積まれます** |
| **部分ごと**（単語・文字・音…） | 12 KB 〜 685 KB | **いまの保存の単位のまま。**作り直しが一番少なく済みます |
| **一語ごと** | 0.14 KB | 四千分の一。ただし**アプリのほぼ全部を書き直すことになります** |

**勧め:** **部分ごと。**

---

### 三 ── **【済みました】空のキーボードが「壊れている」と数えられていた件**

**直っています。**`saveKb()`（`www/keyboard.js`）は、キーボードが無いとき
`"null"` という四文字ではなく**その欄ごと書きません** ── 無いことと壊れて
いることは別の状態、という線に揃いました。判定のほうは触っていません。
**この節が守っていた控えのファイルは、そもそも無くなりました**（§ 0-a）。

---

### 四 ── **戻す画面を、人に見せるか**　【**版が積まれるまで訊けません**】

**決めること:** 前の版に戻すのを、**人が自分でやれるようにするか。運営だけか。**

**いまどうなっているか。** **戻せる版がありません。**設定→データにあった控えの
一覧は、バックアップのファイルごと無くなりました（§ 0-a）。サーバーの `slice`
は言語一本につきいまの姿が一つあるだけで、**前の姿はどこにも残りません**（二）。
**だからこの問いは、二が決まって版が積まれるようになるまで意味を持ちません。**

- **見せない** ── 戻すのは運営だけ。人は「消えた」と言ってきます。
  **画面が一つも増えません。**「復旧はバグで消えた時の話」という線に合います。
- **見せる** ── 設定に「前の版」の一覧が並びます。**日付が並ぶので、その人が
  いつ直したかを本人に見せることになります。**

**勧め:** **見せない。**リリース前に増やす画面を減らせます。あとから足せます。

---

### 五 ── **戻すときは、言語まるごとか、一部だけか**　【二が「部分ごと」なら要ります】

**決めること:** 「単語だけ三日前に戻す」を**できるようにするか。**

**いまどうなっているか。** **読んでいません。確かめていません。**単語が文字を
指しているかどうか、その形をまだ見ていません。**だから「食い違いが起きる」は、
いまは推測です。**

- **まとめてだけ許す** ── 言語ぜんぶが同じ日に戻ります。**食い違いが作れません。
  安全です。**
- **一部だけも許す** ── 細かく戻せます。ただし**三日前に無かった文字を指して
  いる単語**が残るかもしれません。**運営が気をつけることになります。**

**勧め:** **まとめてだけ。**細かく戻したい場面が実際に出てから足す。

---

### 六 ── **「小さくなったら書かない」という守りを、外してよいか**

**決めること:** 守りを一つ外します。**オーナーの一行が要ります。**

**いまどうなっているか。** **読んで確かめました。押していません。**いま、
合わせた結果が今あるものより小さかったら、サーバーに**書きません。**間違って
消えるのを防ぐためです。

**版が積まれるようになると、前の版がサーバーに残るので取り返せます。**そう
なるとこの守りは、**「小さくなった書き込みは記録されない」という別の答え**
として残り続けます。

- **外す** ── 記録されないものが無くなります。**仕組みが一本減ります。**
- **残す** ── 版とは別に、この答えがもう一つ残ります。

**勧め:** **外す。ただし版が積まれるようになってからです。**先に外すと、いまは
取り返せません。

---

### 七 ── **既定のままの値は、人が答えたことになるか**

**決めること:** その人が一度も触っていない設定を、**「その人の答え」として
残すか。**

**いまどうなっているか。** **本物のアプリを走らせて確かめました。実機では
押していません。**語順の設定を一度も触っていない iPhone にも、**既定の値が
「その人の答え」として書き込まれます。**書き込まれると、そこは「もう埋まって
いる」ことになるので、**あとでサーバーから穴埋めされなくなります。**

- **既定も答えとして書く**（いまの形）── その人がずっと従っていた値なので
  移すのは正しい、という読み方です。**ただし穴埋めが効かなくなります。**
- **触っていないものは空のままにする** ── サーバーから戻せます。
  **人の目には何も変わりません。**

**勧め:** **触っていないものは空のまま。**「無い」と「空」は別、という線が
すでに引いてあり、そこに揃います。

---

### 八 ── ★を50件付けたあと、51件目を付けたらどうなるか

**決まりました。押し出します** ──「古いのの押し出していいよ」（OWNER
2026-09-04）。上限50はそのまま（「50でいいよ。それ以上は増えないで」）。
断らずに、一番古いものが出ます。**いまのコードがそう動いています。読んだだけ
です。押していません。**

**もう一つ、同じ所で起きていること。**★を50件より多く付けている人が起動すると、
その iPhone の一覧が**新しい50件で置き換わり**、51件目より古い★は画面から
消えます。**続きへ行く道がありません。**サーバーの記録は消えていません。

---

### 九 ── **【無くなりました】控えのファイルの三世代**

訊く相手がありません。**ファイルごと消えました**（§ 0-a、決定ログ
「バックアップのファイルも無くす」）。三世代も、それを書いていた Swift も
ありません。

---

### 十 ── どの画面に保存ボタンがあって、どの画面に無いか　【**数えてから訊きます**】

「保存を押したときだけ、保存されているものが変わる」と決まりました
（2026-09-04）。**押す場所が無ければ、この決まりは成り立ちません。**打つそばから
書き込む画面には、人が「これでいい」と決めた瞬間がありません。

**まだ数えていません。**読んで当てるのは推測なので、**全画面を並べた表を作って
から訊きます** ──「これも6以降の次の調査でやって欲しい」2026-09-04。

---

### 十一 ── 小さい二つ。**直す順番だけ決めてほしい**

**どちらも読んだだけです。押していません。どちらも直しは小さいものです。**

- **検索の履歴が、黙って一つ減ることがあります。**一度検索した言葉をもう一度
  検索すると、履歴の一番上へ動きます。その動かし方が**「消す」→「入れる」の
  二回**で、間で電波が切れると**消えたまま**になります。まれです。
- **同じ言語が、一覧に二つ並ぶことがあります。**中身は同じです。起動の同じ
  瞬間に、サーバーから降ろす道と上げる道が**両方走り、どちらも待ちません。**
  **その言語が初めてサーバーへ上がる一回だけ**です。まれです。

**ビルド前に潰すか、後にするか。**

---

### すでに答えが出ていて、**訊かなくてよくなったもの**

**同じことを二度訊かないために書いています。**

- **オフラインをどうするか** ── 決まっています。「オンライン前提のアプリに
  切り替えよう」「オフラインをなくそう。写しも別に今はいらなくない？」
  2026-09-04。**保存を押した瞬間にサーバーへ行き、繋がっていなければ保存
  できません。**その代わり、**電波が無いと自分の辞書を開いて眺めることも
  できません。**その一点を出したうえでの決定です。
- **時計がずれた iPhone をどう扱うか**（どこまで先の時刻を受け取るか、断った
  とき人に何と言うか）── **要らなくなりました。**オンライン前提では**番号を
  サーバーが配り、iPhone の時刻を使いません。**設計の文書にはまだ質問として
  残っていますが、**答える必要はありません。**
- **どのくらい残すか** ── 決まっています。「人が作ったものに期限は無い」。
  **期限も掃除も作りません。**
- **積むのはファイルかサーバーか** ── 決まっています。**サーバーです。**
- **一筆の160点** ── 決まっています。「160で止めないで」。**外します。未実装。**
- **無料で使えないものの見せ方**（六件）── 決まっています。「全部一緒。有料と
  同じ画面に同じ形で出して、押したら有料へ」。**未実装。**
- **`？` の中の説明二行** ── そのままで正解です。
- **「端末」という言葉** ── 禁じられていません。取り下げです。

---

### 行番号 ── **ここだけコードの言葉です。本文には出しません**

| 本文のどこ | コードでの場所 |
|---|---|
| 一 設計を通すか | `docs/FEATURE_RULES.md` §「消えないための仕組みを一本にする」 |
| 一 止まっている二つの穴 | 壊れたものの上書き＝`www/sync.js` の `syMerge()`、保存の失敗＝`www/core.js` の `save()` の catch が空 |
| 二 版の大きさ | `slice` テーブル、`netSlicePut()` |
| 二 直した時刻の粒度 | `docs/FEATURE_RULES.md` §「同期でぶつかったら、後から『直した』ほうが残るべき」 |
| 三 空のキーボード | `www/keyboard.js` の `saveKb()` ── 直っています。`docs/EXPIRY.md`（`claude/keep2`・`claude/keep4`）1番 |
| 四 戻す画面 | `bkTake()` / `bkRestore()`、`docs/RECOVERY.md` |
| 五 まとめてか一部か | 集めた先が消えました（下） |
| 六 小さくなったら書かない | `netKeeps()` / `NET_SHRANK` |
| 七 既定の値 | `www/phases.js:98-125` `migrateGramLang()`、`www/core.js:220` `setDefaults()` が `order:'SOV'` を入れる。`docs/EXPIRY.md`（`claude/keep4`）4番の末尾 |
| 八 ★50 | `www/net.js:2295-2296` `netSearchSaved()`、`NET_PAGE=50`（`www/net.js:1490`）、`www/sns.js:1272` `SET.saved=got;`。`docs/EXPIRY.md` 5番 |
| 九 三世代 | 無くなりました。`docs/CHANGELOG.md` 2026-09-04 の DELETE REVIEW |
| 十 保存ボタンの有無 | `docs/FEATURE_RULES.md` §「保存を押したときだけ、保存されているものが変わる」 |
| 十一 検索履歴 | `www/net.js:2357-2364` `netRecentAdd()`（消す側は成功、入れる側の失敗の受け口が `bad \|\| function(){}`）。`docs/RISK.md`（`claude/risk`）7番 |
| 十一 言語が二つ | `www/boot.js:102` `netLangsDown()` と `:110` `netLangSync()`、`www/net.js:1270-1272`、`www/net.js:984` `netLangRow()`。扉側は `www/onboard.js:880` と `:1817`。`docs/RISK.md` 8番 |
| 訊かなくてよくなったもの | `docs/FEATURE_RULES.md` §「オンライン前提に切り替える」（その下の項目は SUPERSEDED）、同 §「★は50件まで。一筆の160点は外す」、同 §「できないことは、有料と同じ画面に同じ形で出す」、`docs/HIDEFREE.md`（`claude/kbfree3`） |

**集めた先:** `docs/EXPIRY.md`（`claude/keep4`
と `claude/keep2`）、`docs/HIDEFREE.md`（`claude/kbfree3`）、`docs/RISK.md`
（`claude/risk`）7番・8番、`docs/FEATURE_RULES.md` の 2026-09-04 の決定ログ。
**集めたセッションはコードを一行も変えていません。検査も一本も回していません。
他のブランチは取り込んでいません。**

## 4b. More than one session at a time

**The page to hand a session is `docs/SESSIONS.md`.** The rule that prevents a
collision rather than finding one is in it: the leader — another session above
this one — names the files a session owns, and a session edits nothing else. `www/index.html` holds every screen's
CSS and is where sessions collide first — one session at a time owns it.

Sessions run in separate containers and share exactly one thing: the remote.
Everything below is about making work visible there early enough to be avoided.
The body is in `docs/FEATURE_RULES.md` § several sessions at once.

```
  one session, one branch          claude/<area>, never anybody else's
  fetch before deciding            git fetch --all --prune
  read before changing a file      git log --oneline --all -- <file>
  push the scope FIRST             before the first line of code
  push after every commit          a branch nobody can see cannot be avoided
  never integrate                  no merge, no rebase, no cherry-pick of
                                   another branch -- the leader does that
```

A commit on a file from a branch that is not yours means another session is in
that file. Stop and report there, not when a merge fails.

**The split is by FILE, not by feature.** That is the only split that prevents
a collision. Not one file may appear in two sessions' lists — and when a feature
wants both markup and CSS, the feature is split to fit the file ownership rather
than the other way round. `www/index.html` goes to exactly one session; everyone
else writes the line they need in the commit body and the leader carries it
across.

**Who the sessions are is not written here.** A session list has the same shelf
life as a branch name.

**Three things about this environment, all measured:**

- **A leader can only speak at birth.** `ListAgents` returns nobody and
  `SendMessage` reaches nobody — sessions are separate containers. The whole
  instruction has to be in `create_session`'s prompt. There is no "I will tell
  them later".
- **The reverse direction works, and it is git.** So every session is told, in
  the hard half of its instructions: *what is unfinished, what you are stuck
  on, and where the leader was wrong go in the COMMIT BODY, not in chat.*
- **The session tools come and go.** `create_session` / `archive_session`
  resolved under `mcp__bf7c680d-…__` and, for one call each, under
  `mcp__Claude_Code_Remote__`; the second name stopped resolving mid-session
  with the first still working. **Archive while the tool answers.** If it stops
  answering, only the owner can close a session.

## 5. The gate, and what CI does not run

`npm test` is the specification. `CLAUDE.md` → "The rules the gate enforces"
-- **and those two numbers are not the same kind of thing.** One counts RULES
that are written down; this one counts CHECKS that run. They have never been
equal and making them equal would be wrong: one rule can take three checks and
one check can hold two rules.

**How many checks there are is printed on the run's last line. Read it there.**
Counted on 2026-09-04: master is 14 + 28 = **42**, and `claude/online` is
14 + 27 = **41** — `backup-check` went with the file it held (§ 0-a).

`tools/gate.mjs` runs the ones that need no browser first, in about two seconds,
then the browser ones four at a time (`WIDE` is `min(4, cpus)`). Run one after
another they were about ten minutes in this container, which is a figure nobody
has re-measured since the count grew.

**It is run once before pushing**, not once per commit — the owner's rule, and
`docs/TESTING.md` has all three. While working, run the one check that holds
what you are changing, by name, plus the six fast ones.

**GitHub Actions runs three of them** — `assets`, `es5`, `i18n`
(`.github/workflows/i18n.yml`). A green tick on a push does not mean the gate
passed. **The other thirty-two run only where somebody runs them**, which means
locally, which means you.

The names are deliberately not listed here. A list of thirty-two check names is
a list that goes stale the next time one is added, and this file has been wrong
about that list twice. The command:

```
node -e "const s=require('fs').readFileSync('tools/gate.mjs','utf8');
  for(const m of s.matchAll(/const (FAST|SLOW) = \[([^\]]*)\]/g))
    console.log(m[1], m[2].split(',').length)"
```

**Every browser check loads Chromium through `loadChromium()`**, which falls
back to a global playwright install. A check that writes
`import { chromium } from 'playwright'` instead dies at module load on any
machine without playwright in `node_modules` — and since `npm test` chains on
`&&`, everything after it silently never runs. **A check nobody can run is a
check that is not in the gate.**

`npm run rls` is not in `npm test` at all: it stands up a real PostgreSQL.
Run it whenever `supabase/schema.sql` changes, which is the only time it can
start failing.

## 6. Builds

`.github/workflows/ios-deploy.yml`, on `workflow_dispatch` or a `build-*` tag.
It runs on `macos-latest` and takes about three minutes — the app is a WebView
and the archive is small.

**Do not start one without being asked.** This is a standing instruction from
the owner of the repository, not a suggestion, and it has been said more than
once.

Build numbers are the workflow's **run numbers** (`github.run_number`), and
that matters more than it looks: the `build-*` tag is a trigger and a record,
never the source of the number. A `workflow_dispatch` run gets a build number
exactly the same way.

**Which build is the latest is not written here, and cannot be.** The number is
the workflow's run number, it lives in the Actions tab, and no session can read
it. Ask, or open the Actions tab.

`workflow_dispatch` is what gets used; the tag is a record, not the trigger.

**A green tick is not a delivery.** The workflow passes
`wait-for-processing: false`, so it goes green the moment the bytes are
accepted and never waits for Apple to process them. Build 86 went green and
was refused an hour later **by email** (`ITMS-90158`) — the only failure here
that does not arrive as a red tick. The upload step's own log is the thing to
read: `Finished uploading build chunks` / `Marked build upload as complete;
waiting for processing` means the bytes arrived and nothing more.

**A tag cannot be pushed from a Claude Code session.** Measured 2026-08-25:
`git push origin build-25` returns HTTP 403 while a branch push to the same
remote succeeds, because the session's git credentials are scoped to
`refs/heads/*`. This is not a network fault and retrying does not help. Use
`workflow_dispatch`; if the tag is wanted as a record, a person pushes it.

iOS work beyond triggering that workflow — opening the project, running on a
simulator, `npx cap sync ios` — needs a Mac with Xcode and cannot be done from
a Linux session.

---

## 7. What is next

Ordered by what blocks shipping. Anything not on this
list has either been done or was never agreed to — check `git log` before
assuming a thing is waiting for you.

### Dug out of the code, and still open

- **「今日のお題」is not a bug in the day feature.** The mechanism is entirely
  intact — `dayRow()` puts it at the top of the feed, `openPost('day')` carries
  it into the composer, `PW.pr` pins the answer to it so it cannot be edited
  away. What is missing is the row. `schema.sql` says the day's sentence *can
  only come from the service role*, and `prompt` has `on_day date not null
  unique` — **somebody puts one in from the dashboard, one per day**, and
  nobody has. That part is the owner's, like the rest of §7's Supabase work.
  **But two real bugs sit beside it**, and both are the client's:
  `netDay()` asks `order=on_day.desc&limit=1` and **never asks for today**, so
  one stale row would be served as "today" forever; and `on_day` is rendered
  nowhere, which is what 「日付ないし」 means.
- **The 通報 row came off account settings, and `mod.js` kept a door.**
  「設定の通報ボタン消せ」OWNER 2026-08-26. The row was the *other* side — where
  a report is read and a post is taken down — and it was also the one thing on
  that page telling whoever held the phone that there is a staff at all. It is
  gone; the way in is now the seven presses on the heading that open `vAdmin()`,
  which draws the same queue with the same `modRow()`. Reports keep landing in
  the table either way. **Nothing here is outstanding** — it is written down
  because "the row was deleted" and "moderation was deleted" are one grep apart.
- **A PDF that was traced on a screen still cannot be read.** The scanned kind
  works and has since `claude/sheet` landed. `sheet.js` sorts an arriving file
  into four kinds and `'drawn'` — ink drawn rather than photographed — is on
  the *cannot* side, by design and in writing: *"That is a renderer, and the
  phone has one (PDFKit, native) while this file does not."* So
  「上からなぞった文字のみ利用できる」 is a native-Swift job nobody holds, not
  a rename. Said here because the file's surface makes it look done.

**A duplicate CSS declaration is invisible to every check in the gate.** A
second `.wldrow` overriding `border` while never mentioning `border-radius`
leaves the radius standing on a bottom-only line, and nothing red says so.
Declare a class once.

### 二つの規則、ゲートについて

**A check enters the gate in the same commit that adds it, or it does not enter
at all.** A check in `tools/` and in no list is silent, not green, and a silent
check is the failure this repository is bitten by most often.

**Count `FAST` and `SLOW`; never believe a sentence about the number.**
`CLAUDE.md`'s count of RULES is a different number from this count of CHECKS and
**must not be made to match it**: one rule can take three checks and one check
can hold two rules.

### Open, and the owner's

- **How many keyboards a plan buys — settled and implemented.**
  Free 1 language and the fixed QWERTY; Plus 1 language and 4 keyboards pooled;
  Pro 3 languages and no ceiling. In the code: `CAN.kb` is `'plus'` (the DOOR),
  `kbCap()` is the NUMBER — `FREE_KB=1`, `PLUS_KB=4`, `Infinity` on pro — and it
  is a pool **across languages**, counted by `kbCount()`. `KB_MAX` is gone;
  a number that is three facts is a function. The language ceiling is
  `langCap()` — `FREE_LANGS=1`, `PRO_LANGS=3`, and Plus is deliberately the same
  as free. `edit` and `badge` are both in `CAN` now.
- **The price of Pro is decided.** The four products and their prices are in
  `docs/apple.md` § 4 and written into `ios/App/App/LinguaStore.swift`. What is
  left is **entering them in App Store Connect**, which is nobody's but the
  owner's.
- **Whether the sheet says anything about what to write with.** The box is a
  fixed 37mm and a pen of about 1mm matches the app's own exactly; a person's
  own pen came in about a quarter lighter. Words on a sheet, so it is next to
  「アプリ内に説明書くの禁止」 as well as being a taste.
  **Two writing tools are still unmeasured: a brush and a pencil.** What came
  back and was measured was a pen. Whether a hard pencil clears the
  「紙より 0.85 倍暗い」 floor the reader uses has not been checked, so a
  pencil-drawn sheet may simply not be seen. Measuring it needs a printed
  sheet and a person, not a check.
- **RevenueCat Shipaton 2026 — whether to enter.** Recorded here on
  2026-08-25 because it existed in one session's chat and nowhere in this
  repository, and a fact that lives only in a chat is a fact that is about to
  be lost. **None of it is verified against RevenueCat's own page** — it is
  written down as the previous leader reported it, and the first thing to do
  with it is check it:
  entry closes 2026-09-30, and an app is disqualified unless its first public
  release falls between 2026-08-01 and 2026-09-30. Lingua has never been
  released publicly, so on that reading it qualifies.
  The decision is not a technical one and is nobody's but the owner's: **is
  there an intention to be on the App Store by 9/30?** Swapping the store
  layer to RevenueCat's SDK is the small part — `ios/App/App/LinguaStore.swift`
  is the only file that talks to StoreKit — and it is downstream of §7 items
  16a and 17, neither of which any agent can do.

### Blocks shipping the free version

- **Signing in from Settings** is written and has not been opened on a phone.
  `obBackTo`/`obReturn` in `www/onboard.js`.

Everything else on this list is done. What holds each: posts, Explore and
Notices read the server (`netPush`, `netFeed`, `netNotices`, `postCatchUp`);
the reset mail is a six-digit code because a link has nowhere to land in a
Capacitor app (`supabase/mail.md`, template `{{ .Token }}`); and **there is one
free ceiling**, asked by `capStop()` at the moment a word will not fit, on the
screen the person was typing on. `quote` and `publication` are still unused.

### Found and left alone, deliberately

- **`tools/verify-script.mjs` runs again** — three breakages, not one:
   `gstep`→`geStep`, `scriptDrawn` gone since `9226dd6`, and every click was
   landing on `#splash` because it waited 250 ms where every other check waits
   for the selector. It is not a font experiment: it is the only end-to-end
   proof of the PUA font path. It now reports 13 ok / 19 FAIL, and each of the
   nineteen has to be triaged as app-wrong or test-old before it can go in the
   gate. `docs/BACKLOG.md`.

### Offered and not yet answered

- **Find the strings nothing says.** 270 of 692 keys in `en.js` never appear
    as a literal in `www/`, but most are built — `t('stg.'+p.id+'.t')` — so a
    grep cannot tell. `i18n-check` already renders 271 screens in 10 languages;
    recording what `t()` was asked for would say it properly. It has to be a
    report, not a failure: a toast on an error is real and unwalked.
12. **Two questions about screens, open since before the keyboard work.**
    Whether the post composer's line needs a visible border, and whether the
    word sheet's letter grid stays.

### Agreed long ago, never started

13. The onboarding as motion only.
14. Vertical writing — **written.** `DIRS` in `www/wsys.js`, bought with
    `can('dir')`. This line was stale.
15. A selectable line gap.

### The owner's, in a browser

**Still open, and all of it is in a browser:**

- Supabase — **one SQL line making yourself staff**, or the reports are on
  nobody's screen (`supabase/setup.md` § 5). Sign in on the phone first: it
  updates a row that has to exist.
- Supabase — **Spend Cap ON**, `supabase/setup.md` § 6. Pro is not a price that
  stops at $25: 250 GB of egress is included and $0.09/GB is added after it,
  with no ceiling until this is switched on. What runs out first is the
  timeline's photographs, and the way it goes wrong is a month that is already
  spent by the time anybody looks.
- Supabase — the reset mail template and the Redirect URLs.

**Before asking the owner for a value, grep for it.** The Google iOS client id
sat written down in a handover file for a day while nobody put it in the code.

**The four products, kept here because a price that changes has to change in one
known place** (`docs/apple.md` § 4 has every field):

    | 参照名 | 製品 ID | 期間 | 価格 | レベル |
    |---|---|---|---|---|
    | Lingua Plus | `com.tokinets.lingua.plus.monthly` | 1 か月 | USD 4.99 | 2 |
    | Lingua Plus Yearly | `com.tokinets.lingua.plus.yearly` | 1 年 | USD 49.99 | 2 |
    | Lingua Pro | `com.tokinets.lingua.pro.monthly` | 1 か月 | USD 9.99 | 1 |
    | Lingua Pro Yearly | `com.tokinets.lingua.pro.yearly` | 1 年 | USD 99.99 | 1 |

    **One group, Pro above Plus**, so Plus → Pro is an upgrade Apple
    prorates rather than two subscriptions somebody pays for twice. A product
    id can never be changed once it exists, and these four are already written
    into `ios/App/App/LinguaStore.swift`; changing one means changing the code
    first. Asking for a product that does not exist is not an error — StoreKit
    returns nothing for it — so **they can be made one at a time** and each
    appears in the app the moment it exists.

    **What is decided per product is one country's price, not 175.** Apple
    generates every other storefront from it — its own rounding, its own tax,
    its own currency — and any of them can be overridden afterwards, one at a
    time. The only real choice is which country is the base: with Japan as the
    base the yen are a number somebody chose, with USD as the base they are a
    number Apple rounded to. `docs/apple.md` § 4.

    **Changing a price here needs no change in the app**, and that is new
    since 2026-08-23: the plans screen shows `displayPrice` as the App Store
    gives it, and works the yearly saving out from the two amounts rather than
    from the 17 on `PLANS`, because Apple rounds each storefront separately
    and 17% off in dollars is not 17% off in yen. The `$4.99` in `www/i18n` is
    the browser's fallback and nothing else. Only a **product id** still means
    changing code first.

    The code side of this is done as far as it can be here:
    `LinguaStore.swift` (`products` `buy` `restore` `current` `manage`, the
    `Transaction.updates` listener, and an id→plan map that answers with the
    HIGHEST entitlement) and `www/store.js`, which `setPlan()` goes through on
    a phone. The three things that were waiting on another session's files are
    in: Restore (**Apple requires it**), Plus's own card, and Cancel opening
    Apple's own sheet rather than setting a flag. What the screen still lacks
    is **the subscription text Apple requires beside a price** — that it
    renews until cancelled, with the term and the price, and links to Terms
    and to the privacy policy. **The two pages exist and are live**, checked
    2026-09-01 in `natsuaya82-crypto/tokine2` on `main`: `lingua/terms.html`
    (140 lines, dated 2026-08-28, and § 12 Governing law — Japanese law,
    Tokyo District Court — is written, so the clause that once blocked it is
    not open) and `lingua/privacy.html` (141 lines). The app already points
    at them: `DOC_TERMS` / `DOC_PRIVACY` in `www/settings.js:52-53`. Vercel
    serves the repo root with `cleanUrls: true`, so `/lingua/terms.html`
    redirects to `/lingua/terms` — a redirect a browser follows, not a 404.

    **What is missing is the sentence in the app.** Not one of the ten
    `www/i18n/*.js` carries an auto-renew disclosure; `set.terms` and
    `set.privacy` are the link labels and nothing else. `claude/pay` has it.
17a. **Sandbox testing**, once the products exist: buy, then `restore` after
    deleting and reinstalling, then a renewal arriving while the app is shut,
    and — new since the middle tier — **a Plus receipt reading as Plus and not
    as Pro**. None of it can be seen anywhere in this repository.
17b. TestFlight, as before. `docs/apple.md`.
18. GitHub Secrets, if a build ever needs a new one. No agent can write one.

### The drawn letters on the keyboard, and what is still unproved

**A letter key inserts a private use code point**, `sharePua()` in
`share.js`, on both plans — `shareFace()` for a keyboard somebody built, and the free QWERTY
(`kbFixed()`) on the same road. Held by `conv-check`, per letter and
not as a count (it prints how many claims it makes in its own last line; do not
carry an ordinal in prose). Nothing stored changes: the private use area exists
in the input field and inside the extension and nowhere else.

**Decided, not a defect:** used in Messages this keyboard sends tofu —
「Lingua キーボードは Lingua の中で使うもの」.

**`DEVICE CONFIRMED` — no.** Whether the extension actually inserts U+E000
upward, and whether what it inserts is drawn in `LinguaType`, cannot be checked
anywhere in this repo.

### The two native traps, and both are the same trap

- **Reach the native side with `Capacitor.nativePromise` and nothing else.**
    `Capacitor.Plugins` and `Capacitor.registerPlugin` are filled by
    `@capacitor/core`, which this app does not load — there is no bundler, only
    plain script tags. `planKeep()` asked `Capacitor.Plugins` for `LinguaPlan`
    and every write was the early return.
- **A native call that fails silently is invisible to every check here.**
    In a browser `PLAN_NATIVE` is false and the plan stays in the settings file,
    so everything is green; on a phone `setOnDisk()` takes the plan out of that
    file on the grounds that the Keychain holds it, and if the write never
    landed nothing holds it at all. **Plus came back as free at the next
    launch.** Written correctly now, and **device unconfirmed** — no check here
    can raise it.

### Waiting on a phone

21. **「接続できません」 that the app can now name, and one that only a phone
    can answer.** OWNER 2026-08-27, Apple sign-in on a real device:
    「Appleでログインしたあと前のアカウントが出てくるんだけどなんで？ あと
    このあと接続できませんって出るけど？」 `claude/acct` settled the first
    half in code and made the second half answerable, and did not answer it.

    **What was settled without a phone, and is worth not re-deriving:
    the Apple provider IS enabled in Supabase.** Reaching the 「ユーザー名と
    ID」 screen at all is the proof. `OBM.mode='who'` is set in exactly one
    place — `www/onboard.js`, the first line of `obIn()` — and `obIn` is
    passed to `netIdToken()` as the SUCCESS callback and nowhere else. A
    disabled provider answers `/auth/v1/token?grant_type=id_token` with 400,
    `obNo` runs, and the person stays on the door. So `supabase/setup.md` §4-1
    is done. **§4-2 and §4-3 — Google — are done too** (the owner,
    2026-08-27), and Google sign-in is **DEVICE CONFIRMED** on build #107
    (the owner, 2026-09-01). Nothing about Google is outstanding.

    **What could NOT be settled here.** `status` 0 had three roads into one
    sentence — the request went and nothing came back, the request was never
    made, and a 200 that was not a session. Which one the phone is on cannot
    be read off this repository. It carries a mark now, so one screenshot
    decides it:

    ```
    接続できません (profile 0)      a REST GET went and nothing came back
    接続できません (mkprofile −)    never sent; the app judged it had no session
    接続できません (token ≠)        200, and what came back was not a session
    ```

    **The reasoning that narrows it, for whoever gets the screenshot.** The
    handle in the photograph, `lingua2`, was ALREADY the previous account's.
    So if `netHandleFree()`'s GET had reached the server, the answer would
    have been 「その ID は使われています」 and not this. That the offline
    sentence appeared instead says the REST call did not complete — which
    also means `netMyProfile()`, the same shape a moment earlier, is the
    thing to look at first. **`/auth/v1/` worked and `/rest/v1/` apparently
    did not, in one sitting, on one network** — that is the shape of the
    thing, and no check in this repository can see it.

    Also found and NOT changed, because it is only reachable by guessing:
    `netTook()` reads
    `uid:(d.user && d.user.id) || (SESS && SESS.uid) || ''`. The middle term
    is there for the refresh, which may answer without a `user`. It also
    means that switching accounts WITHOUT signing out first — the door opened
    from Settings while a session is still held — would hand the new account
    the old one's uid if the grant ever answered without a `user`. Supabase
    always sends one, so this is a hazard rather than a bug; it is written
    down because `www/me.js` now decides whose phone it is off that uid, so
    the cost of it being wrong went up.


19. Build **#82** is green and on TestFlight. What it has not had is a person:
    tapping three dots with round off should give a corner, and saving a letter
    should land on the letters list.
20d. **The widgets' layout is written down three times** and two of them are
    doubles: `ios/App/LinguaWidget/` is the real one, `www/numbers.js`
    § numClockHTML() is the preview the digits room shows, and
    `tools/widget-shot.mjs` is the picture that stood in for a simulator. The
    first two are genuinely separate programs — one is SwiftUI on a home
    screen, one is HTML in the app — and neither can call the other. The
    third is a test double and exists because there is no Swift here. Nothing
    holds the three together; if the Swift's em changes and the preview's does
    not, the app shows a clock the phone will not draw. Worth collapsing the
    third into the second when somebody can build the first.

20c. `ios/App/LinguaWidget/` — a whole new app-extension target, added to
    `project.pbxproj` by hand. That it opens in Xcode and builds is the first
    thing to find out; then the clock on a home screen, and a language whose
    digits are drawn against one whose are not.
    **`docs/apple.md` § the widget: it needs its own provisioning profile**
    (`Lingua Widget Distribution`, bundle id `com.tokinets.lingua.widget`) the
    same way the keyboard does, and nothing signs until that exists.

20b. `ios/App/App/LinguaStore.swift` — that it compiles at all, and then:
    buying in the sandbox, `restore` after deleting and reinstalling, and a
    renewal arriving while the app is closed. None of it can be seen here;
    there is no Swift toolchain in this container.

20. The free plan's keyboard chapter — the iOS steps, the hand-over state line,
    and the QWERTY with nothing to press — has only been seen in a browser,
    where the state line is always the red one because there is no bridge.

## If you are taking this over

1. Do what §1 says, in full — `git fetch --all` and `git branch -r`, not the
   two `rev-list` lines alone. This line used to read "check out the branch in
   §1, do not work on `master`" while §1 said `master` **was** the app and
   nothing needed checking out. The two were read together exactly once, by a
   session that then worked on the wrong copy for a day.
2. Read `CLAUDE.md` end to end. It is the specification, not an overview, and
   every rule in it is a bug that already shipped once.
3. Run `npm test` before touching anything, so you know what green looks like
   here. It prints counts — screens walked, screens the mirror rendered,
   buttons pressed — and a change meant to alter nothing has to leave them
   where they are. **The three numbers are not written here on purpose:** they
   were last measured on 2026-08-22, dozens of branches have gone in since, and
   nobody has re-measured. Take the numbers from your own first run and compare
   your second run against those. A stale number in this file is worse than no
   number, because it turns a correct run into a false alarm.
4. If what you are about to do is in §3, you are starting it, not continuing it.
