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
| `DATA_SAFETY.md` | how a language is not lost; the backup rules; DELETE REVIEW |
| `FEATURES.md` | every feature, its plan, its data, and whether the owner has decided it |
| `FEATURE_RULES.md` | the order, the owner decision log, scope for parallel sessions, what "done" is |
| `PAID_FEATURES.md` | `CAN`, the three plans, and what money may never touch |
| `TESTING.md` | what to run when; how to fix a bug; what needs a device |
| `CHANGELOG.md` | what a person would notice, and every change to stored data |
| `BACKLOG.md` | found and deliberately not done, and why |

**Every section below was read against the code on 2026-09-03.** Where a claim
can go stale it carries the command that re-checks it. **Run the command; do not
believe the sentence.**

**This file is the leader's, and the leader writes it.** A stale RULE is doubted.
A stale statement of FACT is simply believed — which is why nothing here may sit
un-re-read.

---

## 0-a. 2026-09-03 ── いまの状況

**sha はここに書きません。**一日で古くなります。訊く一行:

```
git fetch --all --prune && git log --oneline -1 origin/master
```

**実機で見ているのはオーナーだけです。**ここに書いてあるものは、断りが無ければ
CODE CONFIRMED だけ。**検査の緑は証拠になりません。**

**出ているビルドの番号もここには書きません。**ワークフローの run number が
唯一の出所で、それは GitHub Actions の履歴にしかなく、このリポジトリからは
読めません（§6）。

### 今日の決定 ── 一日で三つ、どれも仕様

**「1アドレス1アカウント」「これは絶対課金もアカウントごと言語もそう」**
「GoogleとかAppleのログインはあくまでもメアドより楽な手段を増やしてあげるための
手段」「Googleでも同じアカウントならメアドで入っても同じアカウントでログイン
させればいいやろ」 OWNER 2026-09-02。

Apple も Google もメールも、**同じアドレスなら同じアカウントへの三つの入口**です。
OAuth 同士は Supabase が自分で束ねます。束ねられなかったのはメールの道で、
`/auth/v1/signup` が「新しい人を作る」要求だったから ── オーナーが実機で
Google と同じアドレスを打って二つ目のアカウントを立ててしまい、それで見つかりました。
**いまは `/auth/v1/otp`** です（`netMailOtp()`）。あれば入り、無ければ作る。

**扉の道は アドレス → 六桁 → パスワード** です。「普通に6桁のコード打ってから
パスワード要求だろ」。作成の面はアドレスだけを訊きます。パスワードは六桁が
通ったあと、再設定と同じ画面で決めます（見出しだけ道で分かれる ── `OBM.fresh`）。

**課金は同じ iPhone でも引き継ぎません**（決定ログ `d47a578`）。**未実装です。**

**今は iPhone だけ。**そのあと iPad、Android。

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

`claude/door`（Google の扉）と `claude/rc`（RevenueCat、公開キー待ち）が
未取り込み。保存のポップは決定だけあって未着手です（決定ログ `9bbd83d3`）。

**この二行を信じないでください。**枝が取り込まれているかは名前からもこの行
からも推測せず、訊くこと ── この段落は半日で二度変わりました:

```
git merge-base --is-ancestor origin/<枝> origin/master && echo IN || echo NOT
```

### まだ直っていないと分かっているもの

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

Always in sync, on every plan. Making a language works with no network and
catches up on the next one; **making a language still needs an account**, and
deleting the account takes the languages with it. The file in Documents
(`www/backup.js`, chapter 24) is the one thing that is not the server's.

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

Three things only a person with a browser and a login can do. Each has a file
that says exactly what to click, because that is the only form they can take
here.

| what | where it is written | who does it |
|---|---|---|
| Everything in the Supabase dashboard, in order, and how to tell whether it worked | `supabase/setup.md` | the account owner |
| The confirmation and reset mail — SMTP fields, DNS records, templates | `supabase/mail.md` | the account owner, in the Supabase and Resend dashboards |
| TestFlight, the two subscriptions, certificates and profiles | `docs/apple.md` | the account owner, in App Store Connect and the Apple developer site |
| The GitHub Secrets the iOS build reads | `.github/workflows/ios-deploy.yml` names them | the account owner, in the GitHub UI |

**No agent can write a GitHub Secret**, so a build failing on a missing one is
never something to fix in the repository.

**The `service_role` key must never appear here, and does not.** The key in
`www/net.js` is the *publishable* key, which is public by design and is meant to
sit in a phone. Passwords are never held, stored or logged by the app: the field
goes to Supabase over TLS and only the token pair is kept, in `localStorage`
under `lingua.sess`.

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

`npm test` is **thirty-nine** checks and is the specification. `CLAUDE.md` →
"The rules the gate enforces" -- **and those two numbers are not the same kind
of thing.** One counts RULES that are written down; this one counts CHECKS that
run. They have never been equal and making them equal would be wrong: one rule
can take three checks and one check can hold two rules.

`tools/gate.mjs` runs the **twelve** that need no browser first, in about two
seconds, then the **twenty-seven** browser ones four at a time (`WIDE` is
`min(4, cpus)`). Run one after another they were about ten minutes in this
container, which is a figure nobody has re-measured since the count grew.

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
