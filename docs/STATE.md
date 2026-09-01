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

Everything below was checked against the repository on **2026-08-11**, §3 and
§5 again on **2026-08-19**, the whole file again on **2026-08-21**, §1, §4b
and §7 on **2026-08-25**, §4b, §6 and §7 once more later that same day after
build #91 went to a real phone, **§1 and §3 again on 2026-08-26**, and **§0 is
2026-08-28's own reading** — not remembered. Where a claim can go stale, it
says how to re-check it — and §3 is the proof that it does: it went on saying
the timeline was not on the server for a week after it was, **and then said
the languages were not, for as long again.** Both are. The command that
answers it is in §3 and takes a second.

---

## 0-a. 2026-09-01 ── いまの状況

**master は `523c3af`。ビルド #107 が TestFlight に出ています。**

**#107 に ② は入っていません。**取り込む前に出したビルドなので。

**実機で見ているのはオーナーだけです。**ここに書いてあるものは、断りが無ければ
CODE CONFIRMED だけです。**検査の緑は証拠になりません** ── 俺は実機で確認した話を
してるからな（OWNER 2026-09-01）。

### 走っているセッションは三つ。ほかは畳んであります

| 枝 | 先行 | 押し済み | いま |
|---|---|---|---|
| `claude/scan` | +15 | 用紙・フォント・②説明の二重・取り込み前の確認・`wldSeenHTML` 削除・④・無料プランで用紙から文字が増える穴 | **⑫ ダウンロード** |
| `claude/words2` | +11 | ⑤並べ替え・⑥セーブ右上/デリート最下・⑦一括削除 | **⑬ 長押し** |
| `claude/lingua8` | +12 | ⑧@lingua 自動フォロー・⑨他人の投稿の `⋯`・⑩語順 | 済み。セッションは畳んだ |

**三本とも master に取り込んでいません。**取り込むのもゲート30本を回すのも
リーダーです（サブリーダーが居ないので）。

### ⑫ ダウンロード ── 決まったこと

画面はこの形で確定です。**他の節と同じ折りたたみ**で、`›` を押すと開きます。

```
› Overview
› Phonology
› Letters
› Keyboard
› Seasons
› ダウンロード
    単語      ↓
    文字      ↓
    文法      ↓
    キーボード ↓
```

四つです（OWNER 2026-09-01 文法もいれて）。並べるのは `wldSecs()` の `dl:1` で、
そこが唯一の一覧です。`›` の位置も統一します ── いまは Letters と Keyboard に
左の `›`（`abshf`）と右の `›`（`abshg`）が両方あり、一行に押す所が三つあります。

**そして、これは画面の仕事ではありません。**ダウンロードそのものが
**一度も作られていません**。読む側（`netSlices()`、`www/net.js:579`）は在って、
着地する側が無い。`LANGS[id].mine` は `www/core.js` の三箇所すべてが `true` を
書いていて、**このアプリで `false` になったことが一度もありません。**
いつまでもfalseだったとかやめてね（OWNER 2026-09-01）。

四つの未決は 2026-09-01 に全部答えが出て、`docs/FEATURE_RULES.md` の決定ログと
`docs/DATA_MODEL.md` §「A language that is only read」に入れてあります。

### ⑬ 長押し ── 原因は測ってある

`www/shell.js:756` の `touchmove` に閾値がありません。実測:

```
  親指が完全に静止   → langs（動く）
  一画素動いた       → feed（死ぬ）
```

実機の親指は必ず一画素動くので、**実機では一度も成立していません。**
`touchcancel`（757行）でも死にます ── iOS が `<button>` の長押しで callout を
始めるため。`www/sns.js:368` にも同じ形があります。
**SVG は原因ではありません**（`SVGElement` は `getAttribute` を持つ。測定済み）。

`tools/press.mjs` の長押し検査は**これを測っていません** ── 460ms 待ってから
動かす「持ち運び」の身振りなので、バグが入ったままでも緑になります。

### 残っているオーナーの仕事

- **`supabase/schema.sql` がまだ当たっていません。**当たるまで、通知のまとめ・
  フォロー数／フォロワー数・他人の言語ページは動きません。**ダッシュボードは
  オーナーだけ**で、ここからは絶対に当てません。
- **#108 はまだ出しません。**全部揃ってから、その場で許可を取ります。
  **前にもらった許可を次の回に使い回さない。**

### やり方（OWNER 2026-08-28 / 09-01）

```
言われたこと確認して本当に治すべきかどう治すかをこっちに投げて承認されたら進む
```
```
ui変更は俺が頼んだの以外は勝手な判断でやるなよ？
もうほぼ見た目は完成してるのよ。
```
```
これ終わったらもう新機能出すのやめて、、全部バグ確認に入る
```
```
古いのは必ず消してね。
```

**見た目はもう出来上がっています。**頼まれていない画面の変更は禁止。直す前に
事実・直すべきか・どう直すかをオーナーに投げ、承認されてから書きます。

**言葉:** でんわ と書かない（端末 か iPhone）。プロフィール画像を 顔 と呼ばない。
スクショを 絵 と呼ばない。**オーナーが言っていない言葉に鉤括弧を付けない。**

---

---

## 0. 2026-08-28 に分かったこと ── 調べ直さないために

**この節は答えです。**下の七つは実際にコードを読み、走らせて確かめたものです。
同じことをもう一度調べないでください。**直っているとは書いていません** ── どこが
原因かが書いてあります。

**役割が変わりました。**取り込むのは**サブリーダー①**（OWNER「取り込むのは
サブリね？」）。そのままゲート28本もそこで回します。**リーダーは配ってビルドを
引くだけで、取り込まず、ゲートを回さず、コードを書きません**（OWNER「君が作業
するんじゃなよね？」）。`docs/SESSIONS.md` と `CLAUDE.md` は直してあります。

今日の決定は `docs/FEATURE_RULES.md` § Owner decision log の上から三つ
（規約の三つ／消す行は三本／取り込むのはサブリーダー）。

| 何 | 分かったこと | どこ |
|---|---|---|
| パスワードを変更 | **忘れた人の出口がこの画面に無い。**忘れた道（メール→コード→新しいもの）は扉にだけある | `settings.js` `id==='pw'` / `onboard.js` `obMailForgot` |
| 消す行 | **三本あるべきで、二本しか無い。**無いのは「端末のデータを消す」＝端末の言語データが全部消えて SNS は消えない。`set.wipe` は全部消す方 | `settings.js` `id==='acct'` |
| 読みの表示 | IPA／カタカナ／両方の三択。**部屋ごと消すと決まった** | `settings.js` `id==='read'` |
| 自作文字の用紙 | **`LinguaPdf.page()` がページを等倍のまま描いている。**`page.draw(with:to:)` は文脈に合わせて拡大しない。印は 14px、`shScan()` が受けるのは 18.3〜73.2px → 四つとも捨てられる。上下反転も同じ箇所。**読み取り側は正常**（往復 0〜18°で二十個一致、印のずれ 0px） | `ios/App/App/LinguaPdf.swift` |
| キーボード | ① 長押しで入る揺れの状態が全キーから `kbTapKey` を外す ── 理由だった ⊖ は既に削除済みで、外すほうだけ残っていた。② 余りが一列＝キー半分のとき空きマスとして描かれるが `kbCellAdd` はキー一つ分を要求するので絶対に入らない | `keyboard.js:1933` / `kbCellHTML` |
| 文法ページ | **誰も動かしていない。**`feature/grammar-engine`（`claude/grammar2` を含む）が master より **364進み・281遅れ**、140ファイル。`index.html` `act-map.js` `core.js` `glyph.js` i18n×10 に触る | `origin/feature/grammar-engine` |
| 絞り込みの⭐️ | `snsPickSaved()` が `goTab('explore')` で**検索タブへ飛ぶ**。決定は「その言葉で検索し直す（飛ばすのではない）」 | `sns.js` `snsPickSaved` |

**オーナーは iPhone SE2 と iPhone 17 で実機確認しています。**OWNER 2026-08-28
「iPhone se2と17で作業してる」。**一番狭い端末と一番広い端末の両方**なので、
画面の話はその二つで成り立つかを考えること ── `press` が測っているのは 402pt の
一台だけで、SE2 の 320pt はそこに入っていません。

**でんわ、という語を使わないこと。端末、または iPhone。**OWNER 2026-08-28、
二度言われた。二度目は「使うなって言ってんだから使うな」。報告でも、コメントでも、
画面の文字でも、docs でも。**リポジトリ全体で 0 件にしてある。増やさないこと。**

**そして、オーナーが言っていないものを「」で囲まないこと。**一度目のとき、その語を
7行だけ残した ── 理由は「オーナーの原文だから」だった。**そんな発言は無かった。**
私たちが書いた地の文に括弧を付けていただけで、オーナーに「言ってねえよ」と言われた。
**括弧の中はオーナーが実際に言った言葉だけ。**それ以外は地の文で書く。

**オンボーディングはオーナーが直しています。誰も触らないこと。**
「オンボーディングはこっちで直してるからいじらないで」OWNER 2026-08-28。
`www/onboard.js` は誰にも渡しません。`master` の `fb2dab6` までは入っています
（`claude/ob3` の並び直しと、SNS の段を本物のタイムラインにした分）が、
**その先はオーナーのものです。**

---

## 1. `master` is the app again. Keep it that way.

`master` is at `523c3af` (2026-09-01) and a fresh clone is the current app.
The gate is **33 checks** — count `FAST` and `SLOW` in `tools/gate.mjs`, which
is the only place the number lives.

**It has NOT been run on this `master`.** That is a statement about today, not
a worry: three branches are out and the gate is run once, by whoever
integrates, after integrating. Do not write "the gate is green" here again
unless you watched it. A sentence in this file claiming a green nobody saw is
the failure this file exists to prevent.

**Four branches went in on 2026-08-26** -- `translate` `wiki` `draft` `me2` --
on top of the six that went in the day before. Do not read that as the whole
list: seventeen branch tips are ancestors of `master` now, and the way to
count is the command rather than this sentence:

```
for b in $(git branch -r | grep -v HEAD); do \
  git merge-base --is-ancestor $b origin/master && echo "$b"; done
```

`wiki` is in **as far as `03fcfa3`** and has moved since -- a branch being an
ancestor and a branch being finished are different facts.

It said `1941783` for **66 commits** after that stopped being true, and the
sentence around it -- "four branches were integrated into it that day" -- went
on being read as the whole of the day. It was not: fifteen commits in that
range say 「を取り込む」. Nobody wrote a wrong number; somebody wrote a right
one and the ground moved under it, which is what the next paragraph is about
and why the two lines below exist. **Counting it is one command**, which is the
only reason this correction could be made at all:

```
git rev-list --count <the sha this file names>..origin/master     # 0 if current
```

That commit is a fact with a shelf life. **Run the two lines below rather than
believing this paragraph** — it has been wrong before and the way it goes wrong
is silent.

Do not name a branch here again. This paragraph has said "master and
`<branch>` are the same commit" three times and been wrong twice, because a
branch name is a fact with a shelf life of about a day.
`claude/cowork-migration-review-wfx1ra`, which it named until 2026-08-22, is
**233 commits behind**.

That is worth a paragraph because it was not true, and the way it failed is the
way it will fail again. `master` sat at 2026-08-04 while 144 commits of work
went onto the branch, so it had **no** `www/share.js`, **no**
`ios/App/LinguaKeyboard/`, **no** `tools/conv-check.mjs` and **no**
`docs/keyboard-extension.md`. A second session cloned the repository, landed on
the default branch, and reported that the system keyboard was not built and the
gate was nine checks. It was right about what it was looking at, and there was
nothing in the repository that could have told it otherwise.

So, before deciding anything is missing:

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

**This has now caught two sessions on one day.** `claude/pw3` ran the collision
test against one branch on 2026-08-27 and found out after pushing
(`docs/reports/pw3-2026-08-27.md` § the hole, `5f33611`), and asked for this
line here; `claude/acct` did the same thing a few hours later, reported "no
live branches on this remote", and found **45** — eleven of them ahead of
master, five of them touched within the same minutes — when a stop hook
complained about something else entirely. Neither session was wrong about what
it was looking at. **It is the same failure as the paragraph above and the
opposite half of it**: that one is `master` being stale, this one is `master`
being all you can see. Both end in believing two zeros.

**`--all`, and `git branch -r`, are the point.** The two lines that used to be
here compared HEAD against `origin/master` and nothing else, so they cannot see
the case that has now happened twice: `master` itself being the stale thing. On
2026-08-22 a session ran them, got two zeros, believed it, and spent a day
refactoring a copy of the app that was **208 commits behind** — `claude/save`
and `claude/yoo-kwdg28` were on the remote the whole time and a fresh clone had
fetched neither. Two zeros against `master` proves you match `master`. It
proves nothing about whether `master` is the app.

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

  **It was the other way round for two days and that is why `open-check`
  exists.** A session read 「言語はアカウントないと作れないです」 as "so the
  door is first" and moved it (`b64c491`), and the owner's phone opened on a
  sign-in form 「そんなの俺頼んでねえぞ」. Every check stayed green: `appIs()`
  answered `'ob'` for a brand new phone, correctly, and `vOb()` drew the door
  anyway because the door was the step `ob.step` was sitting on. So
  `open-check` boots from an empty `localStorage` and reads `#app` rather than
  asking `appIs()` — **four** states, four screens: new phone → the
  onboarding, part-way through in the walk → the app dimmed with one thing
  lit, finished then signed out → the door, finished and signed in → the app.

  The fourth is there because putting the door back at the end turned it up.
  `appIs()` answers `'app'` for the walk before it asks about the session —
  the walk IS the app — and it did not have to while the door was first,
  because by then somebody was always signed in. Without that line a new
  phone draws its first letter, presses done, and is shown the door. The
  three answers `b62ac29` decided are unchanged: `obTourOn()` is
  `!SET.done && ob.step===OB_TOUR`, false for every finished phone.

## 3. What is NOT built, however much it looks like it is

**The timeline IS on the server now, and this section used to say the
opposite.** It said so correctly on 2026-08-11 and went on saying it after the
work was done, which is the exact failure §1 is about — a file that is trusted
and is out of date is worse than no file. Re-check rather than believe:

```
grep -n "rest/v1" www/net.js          # what the app actually asks the server for
```

Today that is `profile`, `post`, `react`, `follow`, `block`, `report`,
`draft`, `saved_search`, `post_seen`, `prompt`, `language`, `slice` and the
RPCs. `netPush()` sends a post — its photographs and its voice with it, through
`netUpPics()` and `netUpVoice()` into the `post-media` bucket — `netFeed()`
reads the two timelines, `netNotices()` reads the notices, `netDraftUp()` sends
a draft, `netLangSync()` sends and merges the language, and `postCatchUp()`
sends whatever this phone has that the server has not. **`lingua.posts` is a
copy and not a home**: the phone keeps what works with no signal.

**An account is required to read the timeline or post to it**, decided
2026-08-18 and held by `post-check`. `vFeed`/`vExplore`/`vNotif` answer with the
app's own door when there is no session.

**There is one kind of account and there are no anonymous ones**
「匿名アカウントはねえよ」. `netSignedIn()` asks whether there is a session at
all and `netMember()` asks whether it carries somebody's name; nothing asks a
third question about what kind of account it is. There is no `netAnon()` — the
comment where it stood (`net.js:268`) says so — and `supabase/schema.sql`
**drops** `has_account()` (`drop function if exists has_account()`), so every
policy that used to ask it asks `is_member()` now.

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

On 2026-09-01 that answers: `profile` 11, `rpc` 10, `follow` 5, `draft` 4,
`saved_search` 3, `report` 3, `post` 3, `language` 3, `block` 3, `slice` 2,
`react` 2, `post_seen` 2, `prompt` 1 — and the ten `rpc` are `account_ban`
`account_delete` `account_unban` `admin_counts` `feed_hot` `notices`
`post_hide` `post_show` `staff_add` `staff_drop`. `netLangSync()` is fired by
`boot.js` at launch, and `syMerge()` (`www/sync.js` ch 26) is what puts two
copies together by adding both.

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
   「匿名アカウントはねえよ」. `netSignedIn()` is a session, `netMember()` is a
   session with a name, and `obNeed()` asks the second at the six things other
   people would see — a post, a like, a boost, a report, a follow, a block.
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
4. **The plan.** OWNER 2026-09-01: 「課金とアカウントとキーボードはアカウントに
   結びつく」 — the plan is the account's, so it belongs on `profile` and
   follows the person to whatever phone they sign in on. **Not there yet**:
   `profile` has no plan column, `www/net.js` never sends one, and the value
   is `SET.plan` on the device, set by hand. This is the gap between the
   decision and the code, and it is item 7's other half.
5. The rest of moderation — **the tombstone in a thread (`postTomb()`), the
   notices (`vNotif`) and the frozen state are in.** What is left is the ⋯
   menu on a profile.
6. Terms and privacy, under `/home/user/tokine2`, linked from Settings and not
   from the onboarding. Not started.
7. What a purchase OPENS. StoreKit itself is **written** ── `ios/App/App/LinguaStore.swift`,
   `www/store.js`, and `setPlan` in `www/settings.js` is `storeBuy`'s one caller.
   What is not done is the other half: a purchase has to reach the server and
   set the plan on `profile` (item 4).

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

**On 2026-08-25 there were three sessions and a leader**, and the territory was
named by the leader rather than found by colliding. Who they are is not written
here — a session list is a fact with the same shelf life as a branch name. What
IS worth keeping is the shape, because it is the first time it was done this
way and it held:

```
  the sheet          www/sheet.js (new), www/index.html, route-map, act-map,
                     www/sound.js, www/letters.js, www/i18n/*, and the gate
  the shape          www/otf5.js and the ink-drawing half of www/glyph.js
  the grammar        www/grammar-engine/*, www/grammar.js
```

`www/index.html` went to exactly one of the three, and the other two send their
one line — a `<script src>`, a CSS rule — to the leader. That is what made
three sessions possible at all: on 2026-08-25 four branches were touching that
file at once, and every one of the four conflicts in the last integration came
out of a branch that had fallen behind.

**Later the same day it was done again with six**, after the owner spent an
hour on a real phone at build #91 and came back with about twenty-five things.
The split was by FILE, not by feature, which is the only split that actually
prevents a collision:

```
  post      www/post.js, www/sns.js, www/index.html, tools/box-baseline.txt
  letters   www/letters.js, www/sound.js
  me        www/me.js, www/settings.js, www/store.js, www/mod.js
  sheet2    www/sheet.js
  grammar2  www/grammar.js, www/phases.js, www/wordsheet.js
  world     www/home.js
```

Not one file is in two rows. Several of the owner's items wanted both markup
and CSS — the post header row, the line height under a drawn font, the rounded
underline — and every one of those went to the session that holds
`index.html`, rather than the session that holds the screen. **The feature was
split to fit the file ownership, not the other way round.** The other five were
told: if you find you need CSS, stop and write the line you need in the commit
body, and the leader carries it across.

**Three things about this environment, all measured, all of which shape the
instructions:**

- **A leader can only speak at birth.** `ListAgents` returns nobody and
  `SendMessage` reaches nobody — sessions are separate containers. The whole
  instruction has to be in `create_session`'s prompt. There is no "I will tell
  them later".
- **The reverse direction works, and it is git.** So every session is told, in
  the hard half of its instructions: *what is unfinished, what you are stuck
  on, and where the leader was wrong go in the COMMIT BODY, not in chat.* On
  2026-08-25 that is how all three of the previous round's real corrections
  reached the leader.
- **The session tools come and go.** `create_session` / `archive_session`
  resolved under `mcp__bf7c680d-…__` and, for one call each, under
  `mcp__Claude_Code_Remote__`; the second name stopped resolving mid-session
  with the first still working. **Archive while the tool answers.** If it stops
  answering, only the owner can close a session.

## 5. The gate, and what CI does not run

`npm test` is **thirty-three** checks and is the specification. `CLAUDE.md` → "The
twenty-one rules the gate enforces" -- **and those two numbers are not the same
kind of thing.** Twenty-one is how many RULES are written down; thirty is how
many CHECKS run. They have never been equal and making them equal would be
wrong. `tools/gate.mjs` runs the eight that need no
browser first, in about two seconds, then the twenty-five browser ones four at a
time. Run one after another they were ten minutes in this container.

**It is run once before pushing**, not once per commit — the owner's rule, and
`docs/TESTING.md` has all three. While working, run the one check that holds
what you are changing, by name, plus the six fast ones.

**GitHub Actions runs three of them** — `assets`, `es5`, `i18n`
(`.github/workflows/i18n.yml`). A green tick on a push does not mean the gate
passed. `dead`, `migrate`, `import`, `sides`, `act`, `conv`, `card`, `word`,
`post`, `backup`, `fill`, `round`, `face`, `base` and `press` — fifteen of the
eighteen — run only where somebody runs them, which means locally, which
means you.

`fill` and `round` were missing from that list and from `CLAUDE.md`, and it was
not only a list. Both loaded playwright as `import { chromium } from
'playwright'`, where the other eight browser checks call a `loadChromium()`
that falls back to the global install. On a machine with playwright installed
globally rather than into `node_modules`, both died at module load — and
because `npm test` is an `&&` chain, **`round` and `press` never ran at all**.
Fixed 2026-08-22 by making the two match the eight. A check nobody can run is
a check that is not in the gate.

`npm run rls` is not in `npm test` at all: it stands up a real PostgreSQL.
Run it whenever `supabase/schema.sql` changes, which is the only time it can
start failing.

## 6. Builds

`.github/workflows/ios-deploy.yml`, on `workflow_dispatch` or a `build-*` tag.
It runs on `macos-latest` and takes about three minutes in practice, not the
twenty this file used to claim — the app is a WebView and the archive is small.

**Do not start one without being asked.** This is a standing instruction from
the owner of the repository, not a suggestion, and it has been said more than
once. 2026-08-25 was an exception the owner named out loud.

Build numbers are the workflow's **run numbers** (`github.run_number`), and
that matters more than it looks: the `build-*` tag is a trigger and a record,
never the source of the number. A `workflow_dispatch` run gets a build number
exactly the same way.

**The latest is #91** — 2026-08-25, green, `workflow_dispatch` on `master` at
`9330140`, all fourteen steps, uploaded to App Store Connect. #90 was also a
`workflow_dispatch`; the tag has not been the trigger in practice for some
time.

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

## 7. What is next, as of 2026-08-25

Ordered by what blocks shipping. Anything not on this
list has either been done or was never agreed to — check `git log` before
assuming a thing is waiting for you.

### The device round of 2026-08-25, and four things dug out of the code

Build #91 went to TestFlight and the owner spent an hour on a real phone. What
came back is about twenty-five items and they are being worked by the six
sessions named in §4b. Most of them are plain and need no note here. **Four
were run to ground before any session was told to look, and those four are
written down because otherwise the next person repeats the digging:**

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
- **The 通報 row in account settings is not the reporting affordance.** It is
  the door to `www/mod.js` — the *other* side, where a report is read and a
  post is taken down — and it is behind `profile.staff`, set by hand in the
  dashboard and by nothing in this app. Its own header says why it exists:
  *"we act on reports within 24 hours" is something Apple asks about*. The
  owner has asked for it to come off the settings list. **That leaves `mod.js`
  with no door**, so a DELETE REVIEW is owed before anything is removed, and
  the thing being weighed is App Review 1.2 against a row the owner finds
  meaningless. Reports themselves keep landing in the table either way.
- **A PDF that was traced on a screen still cannot be read.** The scanned kind
  works and has since `claude/sheet` landed. `sheet.js` sorts an arriving file
  into four kinds and `'drawn'` — ink drawn rather than photographed — is on
  the *cannot* side, by design and in writing: *"That is a renderer, and the
  phone has one (PDFKit, native) while this file does not."* So
  「上からなぞった文字のみ利用できる」 is a native-Swift job nobody holds, not
  a rename. Said here because the file's surface makes it look done.
- **The rounded underline on the profile's language row had a cause, and it
  was a duplicate selector.** `.wldrow` is declared twice in `index.html`: the
  old cover version with `border:1px solid` + `border-radius:10px`, and the
  current one with `border:0; border-bottom:1px solid`. The second overrides
  `border` and **never mentions `border-radius`**, so a 10px radius stays and
  bends a bottom-only line up at both ends. Rule 18's baseline was listing both
  halves of the dead rule, which is how it survived. **A duplicate declaration
  is invisible to every check in the gate** — the same blind spot `act-map.js`
  had before duplicate names were checked for.

### Landed on 2026-08-25

- **Four branches integrated**, and the gate is green on `master`: the grammar
  engine's first three files, the plan rename and StoreKit, the dead-CSS sweep,
  and the sheet's spike. `press` reads **10486 buttons, 217/217 names, 4 styled
  and unworn against a baseline of 4**.
- **The gate was 26 checks that day** (it is 30 now — `tools/gate.mjs`): eight with no browser (`grammar-engine-check`
  joined them) and eighteen with one (`plan-check`, `sheet-check`,
  `shape-check`, `gramlang-check` and `draft-check` joined them). It read 24
  here, then 25, then 26, all on 2026-08-25 -- `4f8b681` wired
  `gramlang-check` in and `claude/draft` wired `draft-check` in, each on its
  own branch, and each time this file was a day behind. Every one was caught
  the same way: by counting `FAST` and `SLOW` in `tools/gate.mjs` rather than
  believing a sentence. **`CLAUDE.md`'s "nineteen rules" is NOT this number
  and must not be made to match it** -- nineteen is how many rules are
  written down, and there are nineteen. This bullet said "not the nineteen
  CLAUDE.md still says" and that sentence was itself the mistake.
- **`shape-check` was written, merged, and left out of the gate.** It was on
  `master` with an `npm run shape` script from the day `claude/inkshape` was
  integrated, and its name was in no list in `tools/gate.mjs`, so `npm test`
  never ran it. Nothing was red; the check was simply silent, which is the
  failure this repository is most often bitten by. Wired in on 2026-08-25
  (`integrate2`, `db0aacb`); green standalone, 17 assertions, about 30
  seconds. It takes no port — it opens `www/index.html` over `file://` where
  the other fifteen browser checks each serve `www/` on one of their own — so
  it cannot collide in the pool. (That sentence said "the other fifteen
  browser checks"; it is seventeen now. The number is `SLOW.length` in
  `tools/gate.mjs`.) **The lesson is the general one and is not
  about this check**: a check enters the gate in the same commit that adds it,
  or it does not enter at all.
- **A branch was dropped rather than merged.**
  `claude/detailed-tasks-execution-ak61z2` had four commits on a base **456
  behind**, and `master` had already done all four by another road — the
  keyboard count, the QWERTY start, and both halves of the timeline's sign-in.
  Merging it would have re-opened settled decisions. Worth keeping as the
  worked example of what a stale base costs: every one of the four conflicts in
  that day's integration came from a branch that had fallen behind, and none
  from two sessions genuinely wanting the same line.
- **The one that nearly shipped silently.** `press` failed on ten classes
  "nothing wears" — all of them the flick keyboard's, and all of them very much
  worn by `www/keyboard.js`. The plan rename had moved `can('kb')` to `pro`
  while a fixture seed from another branch still said `plus`, so the walk could
  not buy a keyboard, could not open the flick editor, and reported the classes
  it never reached as dead. The fix is to reach the state, never to delete the
  rule or widen the baseline.

### Open, and the owner's

- ~~**How many keyboards a plan buys.**~~ Settled 2026-08-25, and there had
  never been a conflict — `docs/BACKLOG.md` had read one table's *languages*
  column as a second answer about *keyboards*. Free 1 language and the fixed
  QWERTY; Plus 1 language and 4 keyboards pooled; Pro 3 languages and no
  ceiling. **Not implemented**: `CAN.kb` is still `'pro'`, so Plus has zero
  today, `KB_MAX` is still a per-language 3, `edit` and `badge` are still
  outside `CAN`, and the language ceiling does not exist at all. The last of
  those takes something away that anybody has today, so it hides and never
  deletes.
- ~~**The price of Pro.**~~ Decided — the four products and their prices are in
  `docs/apple.md` § 4 and written into `ios/App/App/LinguaStore.swift`. What is
  left is not a decision, it is **entering them in App Store Connect**, which is
  §7's item 17 and is nobody's but the owner's.
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

1. ~~**Posts are not on the server.**~~ Done — `netPush`, `netFeed`,
   `netNotices` and `postCatchUp`. `quote` and `publication` are still unused.
2. ~~**Explore and Notices are empty screens.**~~ Done — both read the server.
3. ~~**The password reset mail does not arrive.**~~ Done — the template is
   `{{ .Token }}` (`supabase/mail.md`) and the app has a six-digit reset
   screen, because a link has nowhere to land in a Capacitor app.
4. ~~**The free ceilings are never explained in words.**~~ Done — and there
   is only one ceiling. `capStop()` asks, in the words `toast.cap` already
   had, at the moment a word will not fit, and stays on the screen the person
   was typing on; the five sites that used to throw them at the price list do
   not any more. The other two ceilings are gone rather than explained: word
   suggestions went out with Studio, and layer three's three a day went with
   the AI 「1日3回は亡くなりましたaiいれないから」.
5. **Signing in from Settings** was fixed but has not been opened on a phone.
   `obBackTo`/`obReturn` in `www/onboard.js`.

### Corrected on 2026-08-22, with what was measured

Each of these was a claim this file made that the code no longer supported.
Two of them were about capabilities that had been deleted.

- **The gate was fourteen checks and could not finish.** §5 above.
- **Two claims in § 7 that the code no longer supported** — items 6 and 7,
  struck through in place rather than deleted, with what was measured on each.
- **The counts.** All three were right when written at `cd712dd` and none had
  been touched in the seventy-four commits since.

### Found and left alone, deliberately

6. ~~**A letter of a hidden kind is counted and unreachable.**~~ Not
   reproducible — this said the Letters header showed `5 / 30` while the rooms
   inside came to 29. `LT_KINDS` is unconditional and `ltKindOf()` answers
   `num`, `mark` or `alpha` for every letter, so the rooms sum to
   `LETTERS.length` on any plan. Measured 2026-08-22: a fresh free language is
   `0 / 38`, rooms 26 + 2 + 10; one that paid and stopped is `0 / 40`, rooms
   27 + 2 + 11. `5 / 30` is not a total this plan can produce — a–z, `!?` and
   the digits is 38.
7. ~~**`ai` lifts at Plus, `sug` only at Studio, and they are the same
   ceiling.**~~ Moot — neither capability exists. `CAN` is ten names and
   neither is among them; `AI_FREE_DAILY`, `sugLeft` and `aiSpend` have no
   declaration anywhere in `www/`. It also contradicted item 4 above, which
   says the suggestion ceiling went out with Studio. The same claim was still
   live in `docs/FEATURE_RULES.md` § "What to report" and in two comments in
   `www/core.js`; all three are gone.
8. ~~**`press` never reaches `kbReset`.**~~ Done — measured 2026-08-22,
   **213 of 213** distinct names pressed, `kbReset` among them.
9. **`tools/verify-script.mjs` runs again** — three breakages, not one:
   `gstep`→`geStep`, `scriptDrawn` gone since `9226dd6`, and every click was
   landing on `#splash` because it waited 250 ms where every other check waits
   for the selector. It is not a font experiment: it is the only end-to-end
   proof of the PUA font path. It now reports 13 ok / 19 FAIL, and each of the
   nineteen has to be triaged as app-wrong or test-old before it can go in the
   gate. `docs/BACKLOG.md`.

### Offered and not yet answered

10. ~~**`node --check` over `www/*.js` inside `es5-check`.**~~ Done — 46 files
    in 1.5 s, ahead of the rules, and nothing below runs if one of them does
    not parse. Proved by putting the 2026-08-11 bug back: the comment on
    `www/sync.js` closed one line early, and the check named the file and the
    line and exited 1.
11. **Find the strings nothing says.** 270 of 692 keys in `en.js` never appear
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

16. ~~Supabase — the Apple and Google providers (`supabase/setup.md` § 4).~~
    **Done** (the owner, 2026-08-27: 「7終わってるわ」). Still the owner's, and
    still outside this repository: the reset mail template and the Redirect
    URLs (see 3).
16a. ~~The Apple developer site — Sign in with Apple on the App ID, and the
    profile regenerated after it.~~ **Done** (the owner, 2026-08-27).
16b. ~~Google Cloud — the iOS client.~~ **Done**, and **the id is in this
    repository now** (2026-08-27). It had been sitting in
    `docs/HANDOVER-2026-08-26.md` for a day: the owner handed it over, it was
    written down, and nobody put it in the code. Looking for a value before
    asking for it again is the lesson.
16c. Supabase — one SQL line making yourself staff, or the reports are on
    nobody's screen (`supabase/setup.md` § 5). Sign in on the phone first: it
    updates a row that has to exist.
16d. Supabase — **Spend Cap ON**, `supabase/setup.md` § 6. Pro is not a price
    that stops at $25: 250 GB of egress is included and $0.09/GB is added
    after it, with no ceiling until this is switched on. What runs out first
    is the timeline's photographs, and the way it goes wrong is a month that
    is already spent by the time anybody looks.
17. ~~**App Store Connect — the four subscription products**, and the four
    sales keys into Supabase's Secrets.~~ **Done** (the owner, 2026-08-27:
    「7終わってるわ」). `docs/apple.md` § 4 has every field; the four are kept
    here because a price that changes has to be changed in one known place:

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

### Landed on 2026-08-22, and what it still needs

21. **The Lingua keyboard types the letters somebody drew.** It did not
    before, and nothing said so: a letter key put the letter's NAME in — the
    same character the phone's own QWERTY puts there — and `LinguaType` (the
    face `.tfont` wears) carries only the private use area, so it fell through
    to the ordinary font and came out roman. **The second font was built,
    installed, and never once used through the keyboard it exists for.** It is
    a private use code point now, `sharePua()` in `share.js`, on both plans —
    `shareFace()` for a keyboard somebody built and `kbFix()`'s override for
    the free QWERTY, which were one feature working on one plan and not the
    other, split by nothing. Held by `conv-check`'s **eighth** claim, per
    letter and not as a count. Nothing stored changes; the private use area
    exists in the input field and inside the extension and nowhere else.
    **Decided, not a defect:** used in Messages this keyboard sends tofu —
    `967333c`, 「Lingua キーボードは Lingua の中で使うもの」.
    **`DEVICE CONFIRMED` — no.** Whether the extension actually inserts
    U+E000 upward, and whether what it inserts is drawn in `LinguaType`,
    cannot be checked anywhere in this repo. That is item 20's phone.

22. **Five renames, and one of them was the entry being wrong.**
    `postsRead`→`postRead`, `wSetFil`/`wSetSort`→`words*`, `gh*`→`geHint*`
    (with `GH*`→`GE_HINT*`), `note*`→`nt*` and `noteRead`→`ntRead`.
    `savePosts` and `saveMe` were listed in the backlog beside them and are
    **deliberately not renamed**: `save*` is a family of exactly ten, every one
    naming what it saves, and CLAUDE.md's own prefix list already carries
    `open*`, which is twenty functions and a verb rather than a chapter. A verb
    family was never the thing the rule is against; one chapter under two names
    is. Decision log, 2026-08-22. Behaviour unchanged, and the argument for
    that is that no number moved: `buttons pressed 8683 (214/214)`,
    `screens walked 366`, `mirror 275`, `routes 36/36` — all four the same
    either side. `dead` went 1208 → 1209 functions, which is `sharePua` from
    item 21 and not a rename.

### Found while writing the StoreKit code, 2026-08-22

20a. **The plan was never written down on a phone.** `planKeep()` asked
    `Capacitor.Plugins` for `LinguaPlan`, and `Capacitor.Plugins` is filled by
    `@capacitor/core`, which this app does not load — `www/share.js` says so at
    length and it cost four builds to learn. Every write was the early return.
    And `setOnDisk()` takes the plan OUT of the settings file when the native
    side is there, on the grounds that the Keychain is holding it. Nothing was
    holding it: **on a real phone Plus came back as free at the next launch.**
    Fixed to `Capacitor.nativePromise`, the way `sharePush()` does it. Invisible
    in a browser, where `PLAN_NATIVE` is false and the plan stays in the file,
    which is why every check passed. **Device unconfirmed.**

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
   here. It prints counts — `screens walked: 366`, `screens the mirror
   rendered: 275`, `buttons pressed: 8683` — and a change meant to alter
   nothing has to leave them where they are. All three measured 2026-08-22.
4. If what you are about to do is in §3, you are starting it, not continuing it.
