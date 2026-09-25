# Adding something

The order is: write the spec, get the answer to anything that is the owner's,
then write the code. Not the other way round.

## The eleven questions

Before any code, answer these in `docs/CHANGELOG.md` under the change (or in a
file of its own if it is large). A "none" is an answer; a blank is not.

```
 1  what it is for
 2  what a person can do that they could not before
 3  free or paid, and which capability name
 4  what existing behaviour changes
 5  what existing DATA is affected
 6  what is newly stored, and where            (slice? SET? on the thing?)
 7  what is deleted                            (if anything: DELETE REVIEW)
 8  how it behaves with data made before it existed
 9  what it does offline
10  what it does when it fails
11  what it does when the plan changes, in both directions
```

Question 8 is the one that gets skipped and is the one the card bug was.

## Past data

If the thing being added displays, exports or scores something a person made
earlier, decide **before writing the line** which of the three it is
(`docs/DATA_MODEL.md` § the three kinds):

```
  read from the current state   correct for a word, a letter, an alphabet
  frozen at write time          put it ON the thing, at the moment it is made
  held from an earlier state    neither — be suspicious
```

Two rules follow, and both are absolute:

**Do not re-generate the past from the present.** If a post, a record, a
history or an export means something because of the state at the time it was
made, that state goes ON it when it is made. Not an id pointing at the current
object — the value.

**An id is not the data.** ~~`post.letterId`~~ → look up `LETTERS` → get the shape
is banned for anything past-tense, because `LETTERS` is now and the post is
then. `post.ink` is the shape itself, which is why it survives the letter being
redrawn, deleted or never having existed on this phone at all.

Today the app has exactly one past-tense kind — posts — and exactly two files
render one, `www/post.js` and `www/card.js`. The day it grows a ranking, a
season record, a history or an achievement, this section is the first thing to
read.

## One place

A rule lives in one place, and the places that follow it do not restate it.
Three bugs found in one afternoon were the same bug: something was added and
the one place that governs it was not.

**A comment saying "this is the one place" is worth nothing on its own.**
Whoever reads it will fix that one and go home. Either a check holds the claim,
or do not make the claim. ~~`ltFace`~~ opened with "a letter's face, wherever one
is shown" and there were five others; `inkStrokes` said it was "the one place
that turns strokes into a shape" and the glyph editor did not go through it.

Not everything that repeats is duplication. `cffNum` and `csNum` in `otf5.js`
encode the same integers to different byte forms because that is what CFF
specifies. Merging them would be inventing a rule, not finding one.

### A hole is not plugged. The whole is looked at, and covered

「基本的に穴を潰すんじゃなくて同じように全体を俯瞰して穴を覆って欲しい」
「今までも全部そうして」「じゃないとコードががんじがらめになるし、ルールに
追加して必ず守るように」 OWNER 2026-09-22.

A fault is a hole in a SURFACE, and the work is to name the surface, not the
hole. Before anything is written:

1. **Count the surface.** What is the whole set of things this fault is one
   of? Every table, every screen, every field, every key — read it off the
   repository or the catalogue, never off memory.
2. **Write the one statement that covers all of it**, in the one place that
   governs the surface, and delete the plugs that were standing in the holes.
3. **The check counts, it does not list.** It enumerates the surface the same
   way (the catalogue, the page, the file) and asks the statement of every
   member, so a member added tomorrow is asked tomorrow.
4. **An exception is the owner's**, named in the decision log, and the check
   counts it as the one allowed name.

What was plugged before this was written is covered the same way the day that
area is next touched; `docs/BACKLOG.md` carries the sweep. **Nothing holds
this mechanically. A person holds it by reading the change, and the leader by
counting the surface before dispatching (`docs/LEADER.md`).**

## Refactoring

Not a goal. Do it only when one of these is true:

- the duplication is causing bugs, or has already caused one
- a spec change would mean editing several places, and they will drift
- the thing cannot be tested as it stands
- responsibilities are genuinely tangled
- it blocks a feature that is actually being built

**If pulling something out means a new dependency between two files that did
not need each other, leave it.** Taste is not a reason.

**A behaviour change and a refactor do not share a commit.** Neither does a
rename: renaming an acted function touches `act-map.js` twice — the string and
the function — which are the same files a feature change touches, and the diff
stops being readable. Renames go in a commit of their own with `npm test` on
both sides. `docs/BACKLOG.md` holds the ones known and deliberately not done.

## The order

An idea does not become code by being reasonable. It becomes code by being
decided, written down, and then built.

```
  idea
    ↓
  OWNER DECISION            the owner says what it is
    ↓
  docs/FEATURES.md          the row, and its status
    ↓
  docs/PAID_FEATURES.md     if money is involved
  docs/DATA_MODEL.md        if it stores anything new
  docs/DATA_SAFETY.md       if it saves, deletes or migrates
  docs/CHANGELOG.md         if existing data or behaviour moves
    ↓
  implementation
    ↓
  tests, including a regression watched failing
    ↓
  device verification       if docs/TESTING.md § device says so
    ↓
  owner confirmation
    ↓
  merge
```

**Writing the code first and the spec afterwards is not allowed.** Reading the
code first is fine and often necessary — but "this is what the code does" and
"this is what it should do" are different sentences and must never be written
as one.

### Five states, and they are not the same

```
  BACKLOG          might happen                      docs/BACKLOG.md
  OWNER DECISION   has been decided                  the log below
  SPEC             this is how it behaves            FEATURES.md + the docs
  IMPLEMENTED      it is in the code                 git
  VERIFIED         checks green, and a phone         CHANGELOG.md, marked
```

**Something in BACKLOG is not decided.** Do not read a backlog entry as
permission. Do not read the absence of an entry as permission either.

## Owner decisions are specifications

When the owner decides anything about behaviour, a threshold, a limit, the
free/paid boundary, retention, deletion, migration, how past data behaves,
timing, what gets selected, or what a screen does — **that is a specification,
not an instruction for the task in hand.**

Afterwards:

1. record it in the log below, and in whichever `docs/` file it governs
1b. **if it REPLACES a rule that is already written down, fix that rule — in
   the same commit.** Adding to the log is not enough. A rule is obeyed
   because it is read, so one that still says the old thing is still being
   followed, and the decision has not landed however carefully it was
   recorded. 「新しいのにしたらルーるも直せよ／そのせいで毎回古いルールに
   引っ張られてんじゃん」 (OWNER DECISION 2026-08-26)

   **Fixing means deleting.** Do not leave the old sentence with 「this is
   history」 in front of it — it will be read. 「歴史とかいいから消せよ」
   `docs/CHANGELOG.md` is the exception and is never rewritten: it records
   what was true on a day. Everywhere else, only sentences about NOW.
2. implement exactly that, and nothing adjacent
3. do not reinterpret it into a more reasonable rule
4. do not quietly generalise it to a nearby behaviour
5. if existing code contradicts it, **report the contradiction** — do not go
   and change unrelated code to match
6. a later session reads the decision before changing anything in that area

**If a decision conflicts with a rule already written down: STOP — and read the
next paragraph before you do, because it is the half that was missing and it is
the half that gets used most.** Report the existing rule, the new decision, the
code affected, the data affected, and what a migration would have to do. Do not
resolve it yourself. Neither side of a conflict is automatically right, and
picking one quietly is how a spec gets lost.

**STOP only when the owner has not spoken.** If the new side of the conflict is
something the owner has **just said**, that is the latest and it wins — it is
not a conflict to escalate, it is an instruction to carry out. Do not ask again.
Do not ask 「this overturns the decision of the 22nd, is that alright?」 about a
decision the owner replaced this morning: they know what they said before, and
asking is making them say it twice.

```
  the owner has just said it            → it wins. Mark the old one
                                          superseded, fix the rules, carry on
  two WRITTEN decisions disagree and
  the owner has not restated either     → stop and report. This, and only this
```

Being asked to confirm something already answered is what 「それもふるいわ
いつまでふるいのずっとやってんだよ うぜえな」「毎回新しくしろよ」 is about
(OWNER DECISION 2026-08-26). It was asked three times in one day off the
paragraph above, because that paragraph only had the first half of the rule in
it. **The newest thing the owner said is the specification.** Older written
decisions are the record of what it replaced, not a second opinion to weigh
against it.

Marking and fixing happen in the **same commit** as the new decision. An
entry of the log below that a later one replaces WHOLE keeps its heading,
opened with 【差し替え済み YYYY-MM-DD】, and ONE line naming what replaced it
(`- 差し替えた決定: 「<heading>」（date）`) — and nothing else:
「印を付けて本文を残すのも残したことになる。消す。」 OWNER 2026-09-03 (the
entry 「古い規則は残さない」 below). One replaced IN PART loses the part, and
says in one line which part went and what replaced it. What was decided on the
day is in git and in `docs/CHANGELOG.md`, which is never rewritten. **The rules
are fixed the same way: fixing means deleting.** A rule left standing is read,
and a rule that is read is obeyed. `docs-check` holds the whole-entry half: a
【差し替え済み】 heading with more than its one line under it fails.

And the other direction, which is the same rule: **a decision once made is not
re-opened by a later session because a different shape seems more natural.** If
it seems wrong, say so and stop; do not implement the better idea.

## Owner decision log

Newest first. One entry per decision. The **decision itself** matters more than
the reasoning — a reason can be re-derived, a decision cannot.

```
### Decision
- Date:
- Area:
- Decision:
- Reason:
- Affected features:
- Affected data:
- Affected docs:
- Implementation status:
```

### 2026-09-25 タブで出る時の保存・Pro の上限・ブロックと取った言語・ミュートの広さ
- Date: 2026-09-25
- Area: 保存ボタンのある画面、Pro の上限、ブロック、ミュート
- Decision:
  - **保存ボタンのある画面を下のタブで出る時**: 戻るで出る時と同じく「保存しますか？」と訊く。
  - **Pro で上限（言語3つ・ダウンロード3つ）に達した時**: 追加そのものをできなくする ── ＋のある所から＋を消す。
    「アップグレードが必要です」のポップは出さない（Pro の上にプランは無い）。
  - **ブロックする前にその人から取った言語**: 残す（一覧に残り、読める）。
  - **ミュートした人**: その人が書いた投稿に加えて、その人がリポストした投稿と、その人からの通知（いいね・返信など）も出さない。
- Reason: オーナーの言葉「1 イエス」「追加自体できなくすればいい。＋があるところからプラスをなくすだけ」「言語は残していいんちゃう」「消そう」。
- Affected data: 無し（見せ方だけ。ミュートの表は r85 のまま）。
- Affected docs: この項、`docs/STATE.md` 4a。
- Implementation status: 未。r88 で出す。

### 2026-09-25 ミュート・ブロックの残り・サインインの着地・前の版のファイル
- Date: 2026-09-25
- Area: 設定の非表示リスト、ブロック、サインイン後の画面、スマホに残ったファイル
- Decision:
  - **ミュート**: 人をミュートできる。ミュートした人の投稿はタイムラインに出ない（ブロックとは別）。
    設定の「非表示リスト」がミュートした人の一覧で、そこから解除する。
  - **サインインし直した時の画面**: プロフィール（開いた時の最初の画面はタイムライン）。
  - **ブロックした相手の公開言語**: 言語の一覧・検索・人のページから見えない。
  - **ブロックされた側**: こちらが見えないので、いいね・返信・フォローもできず、通知も来ない（サーバーで止める）。
  - **前の版でスマホに残った用紙と声のファイル**: 消す（DELETE REVIEW を CHANGELOG に）。
- Reason: オーナーの言葉。
- Affected data: ミュートの表（新しい）、`block_hides()` の範囲、スマホの用紙と声のファイル（消す）。
- Affected docs: この項、`docs/STATE.md`、Documents の文（`docs/FEATURES.md`・`docs/RECOVERY.md`、直す session が）。
- Implementation status: **実装（`claude/r85-block`、2026-09-25）。CODE CONFIRMED のみ。**
  ミュート ── `mute` 表・`mute_seen`・`post_seen.muted`、おすすめ・フォロー中・今日のお題・スレッド・投稿の検索から
  外れ、その人のページには出る。設定の「非表示リスト」。サインインし直した時の着地 ── もうプロフィールだった
  （`open-check` 3e で測った、コードは変えていない）。ブロックした相手の公開言語 ── `language_seen` で外す（両向き）、
  取った言語は外さない（決めていない）。ブロックの間の いいね・リポスト・返信・フォロー ── 書く側で断る、通知もそれで
  鳴らない。前の版の用紙と声 ── 起動で消す（`Documents/Sheets` 全部、`Documents/Voices` は誰も名指さない物）。
  残り・訊くことは `docs/scope/r85-block.md`。

### 2026-09-24 画面・タイムライン・キーボード・保存・お金
- Date: 2026-09-24
- Area: 下の各項
- Decision:
  - **写真に字を置く画面**: 字の後ろに黒い帯は付けない。
  - **字を描いていない人の投稿のカード**: 大文字・広い字間のまま。
  - **ホーム画面のウィジェット**: 設定の自作文字のスイッチに従う（切ればローマ字）。
  - **単語のつづりの欄**: 描いた字で出す。
  - **通知の一覧の投稿の一行**: 描いた字で出す。
  - **紙に描いた字を描き直す時**: 紙の形を下に薄く敷く。
  - **字を囲ったボタン 9 か所・説明っぽい文・字だけのボタン（サインイン・次へ・保存・完了）**: 今のまま。
  - **行の組の間隔**: 14px・10px にそろえた今の形。
  - **消す前の「○○を消しますか？」**: 確認の窓を出す（17 か所とも今のまま）。十の基準の 9「削除→Undo」はこれで置き換え。
  - **スマホのキーボードの短い行**: 作る画面と同じく真ん中。
  - **2段をつないだキーの「真下」**: 画面に見えるとおりに数える。見た目で真下でない既存のつなぎは外れる。
  - **キーを運ぶ長押し**: ほかの長押しと同じ 10px。
  - **ブロック**: ブロックされた側からも、こちらのタイムライン・プロフィール・通知が見えない。解除は設定のブロックリスト。
  - **フォロー中・フォロワー**: フォローした新しい順。一覧は一度に 50 件。
  - **アプリを開いた最初の画面**: タイムライン。
  - **送れなかった投稿**: 「送信できませんでした」と出して下書きに入る。送り直しボタンは無い。下書きの数に上限は無い。
  - **非公開の投稿・通知をどこまで読んだか**: アカウントに保存する。
  - **2台で同じ物を直した時**: 後から保存した方が残る。
  - **言語を前に戻す**: 3つ前まで。戻す時は言語まるごと。
  - **スマホに残る物**: 無い。上げた声・手渡した用紙は残さない。
  - **持ち主の分からない古いデータ**: 誰の物にもしない（読まない、消さない）。
  - **壊れて読めない部分**: 空で開き、保存は「保存できませんでした」。
  - **昔の版で自動で増えた文字**: 消さずに残す（公開したので「リリース前なら消してよい」は使えない）。
  - **ほかの人から取ってきた言語**: 編集できない。
  - **保存がサーバーに上がる時**: 保存を押した時。
  - **開いた時に読む物**: 通知・タイムライン・今日のお題・プラン・テーマと言語。それ以外の画面は開く前にロードを挟む。
  - **広告**: 今は作らない。
  - **上限に達した時の文**: ほかの上限の文と同じ形。
  - **スタッフを外した直後の「無料・終了」**: そのまま。
  - **子どもの購入を親が承認した時**: すぐ有料にする。
  - **Android**: 今の更新が終わってから作る。開業届は今は出さない（出すまでは Google Play は個人で登録）。
- Reason: オーナーの言葉。
- Affected data: ブロック（schema.sql）、フォローの時刻、言語の版、スマホの声・用紙、2段キーのつなぎ（DELETE REVIEW は CHANGELOG）。
- Affected docs: CLAUDE.md（起動で読む物・十の基準の 9 を直した）。この決定と食い違う古い項は、実装する session が消して書き直す。
- Implementation status: 画面・タイムライン・キーボードの分は入った（r82・r83）。r84（`claude/r84-save`、CODE CONFIRMED のみ）:
  **保存を押した時** ── 入った（`langWrites()`・`keepDrafting()`・`netSaveNow()`、`keep-check` 23）。
  **取ってきた言語** ── 入った（`dl-check` が全部の画面を押す）。**開いた時に読む物** ── 測ると五つとも既に読んでいた、
  `load-check` 1 が数える。**親が承認した購入** ── 入った（`Transaction.updates` → `linguastore`、`plan-check`、Swift は未ビルド）。
  **上限の文** ── `up.need` 一つのまま、Plus のキーボードは無制限（`plan-check`・`kb-check`）。
  **言語を前に戻す** ── 入った（保存の番号 `slice.press`、`admin_restore_lang()`、運営の画面は版三つ。`npm run rls`・
  `hist-check`・`again-check`）。**schema.sql をアプリより先に流すこと。**

### 2026-09-24 キーボードのプランとフォントの書き出し（r46 の申し送り）
- Date: 2026-09-24
- Area: プラン（`CAN.kb`、`kbCap()`）、フォントの書き出し
- Decision: 無料 ── 最初からある QWERTY（自分で描いた a〜z）に加えて、既存の文字で自由に配置したキーボードを何個でも作れる。
  Plus ── キーボード無制限、自分で描いた文字を自由に配置できる。Pro ── キーボード無制限、フォントのファイル書き出しを追加。
- Reason: キーボードを売りにする。Reddit で、自分の文字をフォントにして Procreate やパソコンで使いたい声があった。
- Affected docs: `docs/scope/r46-reddit.md`（`claude/r46-reddit`）。
- Implementation status: **Plus のキーボード無制限は実装（`claude/r84-save`、2026-09-25）** ── `kbCap()` は無料 1・Plus と Pro は `Infinity`、~~`PLUS_KB`~~ は消した。Plus のカードの行 `plan.plus.5` は「キーボードは無制限」、Pro のカードの同じ行（~~`plan.pro.3`~~）は Plus に含まれるので消した。`plan-check`・`kb-check`。CODE CONFIRMED のみ。**残り（未・まだ訊いていないこと）:** 無料の「既存の文字で自由に配置したキーボード」と「既存の文字」の範囲、Pro のフォントの書き出し（形式と取り出し方）。

### キーの画面 ── 押した字がそのキーに入る。確定は無い
- Date: 2026-09-24
- Area: キーボードのキーに何を入れるかを選ぶ画面（キーの画面と、フリックの一つの向きの字の画面）
- Decision:

  ```
  なんのための確定？いらないなら保存だけでいいよ。
  ```

  字を押すとその字がそのキーに入る。もう一度押せば外れる。右上の「確定」は無い。
  書くのは板の「保存」だけ（2026-09-24 r79 K1「キーボードの面は保存ボタンを押すまで下書き」）。
- Reason: オーナーの言葉のまま上に。
- Affected features: キーの画面（`kbLtTap()`、`www/keyboard.js`）
- Affected data: **無し。**押すたびに変わるのは板の下書き（`saveKb()`）で、slice に書くのは保存
- Affected docs: この項、docs/CHANGELOG.md
- Implementation status: **実装済み（`claude/r78-sides`、2026-09-24）。**選んでいる字（~~`kbLtPick`~~）と
  確定の道（~~`kbLtPut()`~~）は消した ── 押した字が入る道が一つ。紫はキーに今入っている字。
  `tools/kb-check.mjs` が持つ。**CODE CONFIRMED、DEVICE 未確認。**

### 2026-09-24 【決定の読み ── オーナーの新しい言葉ではない】持ち主の無い写しは読まない、消さない
- Date: 2026-09-24（r79-acct、リーダーの指示で書いた。**オーナーはこの日これを言っていない**）
- Area: 端末の写しの持ち主（`www/core.js` § ACCT、`acctKeep`・`acctFor`・`acctMoved`）
- Decision: 次の三つの書かれた決定を合わせて読んだもの。
  1. CLAUDE.md § Online「a thing that cannot answer 『which account』 is a thing that must not be written down」
     と「NOTHING IS THE PHONE'S. EVERYTHING IS THE ACCOUNT'S」（2026-09-03）。
  2. 平たい鍵の前例「もうまっさら昔のいらない」（2026-09-03）── 古い形は**読まない、消さない**。
  3. 「そもそもアプリ公開されたの昨日だから必要ない」（2026-09-23）── 印の無い写しは公開前の試しの端末にしか無い。
  読み: 端末に書く物は書く時に uid を持つ（`lingua.<名前>.<uid>`）。`lingua.set` の古い `acct` の印が名指す
  写しはその人の物として一度写す。**どの印も名指さない写しは誰の物にもならない** ── サインインした人に
  渡さず、送らず、消さない。例外は歩き（オンボーディング）が作った物だけで、扉で入ってきた人の物になる
  （CLAUDE.md § Online）。
- Reason: 写しを「最初に入った人の物」にする道が四つあり（~~`meFor`~~・~~`postFor`~~・~~`setFor`~~・`langMineIds` の枝）、
  古い版の言語が最初に入った人の物として公開で作られた（r73 § 2-7 で測った）。r73 はこれを「オーナーへ」と
  していたが、上の三つで答えが出ているとリーダーが読んだ。
- Affected features: サインイン・サインアウト・アカウント削除・起動（写しの読み込み）
- Affected data: `CHANGELOG.md` 2026-09-24 r79-acct。人の作った物は消さない。
- Affected docs: CLAUDE.md 規則 22・§ Online の文、DATA_MODEL.md、STATE.md
- Implementation status: 実装（`claude/r79-acct`、CODE CONFIRMED のみ・実機未確認）。`acct-check` 86・87・88。
  **オーナーが違うと言えば、この項は消して書き直す。**

### 2026-09-24 リーダーの監査は30分ごと ── 会話が長くなったら新しいリーダーに替える
- Date: 2026-09-24
- Area: リーダーの動かし方（`docs/LEADER.md` § 監査）
- Decision: 「30分にするのと新リーダー立てるから引き継ぎ書書いて」
  監査は20分ごとから30分ごとに。リーダーは短い引き継ぎ書で替わる。
- Reason: 上限の減りが速い（「上限ひっかかるのめちゃくちゃ早くなってね」）。起きるたびに
  リーダーの会話（約52万トークン）を全部読み直していた。
- Affected features: 無し（アプリの外）
- Affected data: 無し
- Affected docs: `docs/LEADER.md` § 監査（同じコミットで書き換えた）
- Implementation status: 入った。

### 2026-09-23 読むのは開いた画面の分だけ ── 起動は通知とタイムライン、他はその画面に進んだ時、ダウンロードは押した時
- Date: 2026-09-23
- Area: サーバーから読む全部（`www/net.js` の GET と RPC、起動 `www/boot.js`、人の言語のページ ~~`wldSlicesPull()`~~ `www/home.js`）
- Decision:
  「開いた時は通知とタイムラインだけでしょ、そのページに進むときに読み込むべきなぜ一括なの？そこも直せ」
  「ダウンロードってそれが普通じゃないの？」（押した時に落とす）
  「ダウンロードは普通⭕️のメーターだろ」
  - 起動で読むもの ── **2026-09-24 で置き換え**: 開いた時に要る物（通知・タイムライン・今日のお題・プラン・テーマと言語）は読む。
  - それ以外（プロフィール、フォロー・フォロワー、下書き、検索、自分の投稿、言語の一覧の中身、人の言語のページ…）は、その画面に進んだ時に、その画面に描く分だけ読む。一覧は上限を付けて、続きはスクロールで。
  - 人の言語の章は ↓ を押した時にサーバーから落とす。落としている間は ⭕ のメーター（進みが取れない時は ⭕ が回る）、済んだら ⭕☑️。
- Reason: 全部を一度に読むとアプリが重い。普通のアプリはそう動く。
- Affected features: 起動、全部のタブと画面、人の言語のダウンロード
- Affected data: 無し（読む時が変わるだけ。保存する物は変えない）
- Affected docs: CLAUDE.md（直す session が一文を足す）
- Implementation status: 実装（`claude/r71-net`、CODE CONFIRMED のみ・実機未確認）。起動は `PAGE_OPEN`（通知とタイムライン）と最初の画面の分とセッション（token・プラン・アカウントの行）で 13 本（同じ偽のサーバーで、前は 21〜24 本）。画面は `navLand()`（`www/shell.js`）一つの扉が `PAGE_READS`（`www/sns.js`）の分を読み終えてから出る。一覧は `NET_PAGE`（50、仮）で切り、タイムライン・検索・フォロー・人の投稿・スレッドは底で続き。人の言語は開くとページに描く分（wld・snd・script・letters）だけ、章は ↓ で ⭕ のメーター→⭕☑️。`load-check` が持つ。
### 2026-09-23 一行を描く仕組みを一つにする ── 入力欄も投稿も同じ仕組みで描く
- Date: 2026-09-23
- Area: 言語の一行を描く所（`inkChar()` `inkFaces()` `inkAdv()` `www/glyph.js`、`postRuns()` `www/post.js`、`.pline, .pwfield #pw-ln` `www/index.html`）
- Decision:「一行を描く仕組みが二つある件。…入力欄では単語の間が全角分あくのに、投稿すると普通の間隔になる。
  入力欄で改行しても、タイムラインでは消える。…一行を描く仕組みを一つにして、入力欄も投稿もそれで描くように
  書き直す。書いている時の見た目が、そのまま投稿の見た目になること。字間の設定も同じ話なので一緒に見てほしい。」
  - 一行は `LinguaType` の字で、ブラウザが並べる。形は `inkChar()`（一つの形と字間 → 一字）、カードは canvas
    なので `inkAdv()`。どちらも同じ `reach()` の物差し。
  - 空白と改行が何かを言うのは `postRuns()` 一か所。
- Reason: 書いている時の見た目と投稿の見た目が違った（字の大きさ 0.79em と 1.0em、改行が消える）。
- Affected features: 投稿欄、タイムラインの行、引用、字間の見本、暦
- Affected data: 無し
- Affected docs: `CLAUDE.md` 規則 8（原文はそこにあった。決定ログに無かったのを r76-lines が足した）
- Implementation status: 投稿欄とタイムラインは IMPLEMENTED（`line-check`）。**範囲がまだ決まっていない物**
  ── 例文・文法の行（`.sfont`、`sfontHTML()`）と、語をつづる欄（`.tfont` を `myFontOn()` で出し分ける三つ）が
  この「一つ」に入るか ── は `docs/scope/r73-audit.md` §5-8・§5-14 でオーナーへ。写真の上の字・下書き一覧・
  通知の行は r60 の持ち物で、直し方は `docs/scope/r76-lines.md`。

### 2026-09-23 自作文字で表示は、既定でオン
- Date: 2026-09-23
- Area: 語を自作文字で出すかどうか（`myFontWant()` `myFontOn()` `www/glyph.js`、書き字のページのスイッチ `www/sound.js`、`obDone()` `www/onboard.js`）
- Decision:「オンをデフォルトにしてくれ。」
  問いは「オンボーディングで字を描かずに進んだ人は、後で描いても自作文字で表示されない。既定をどうするか」。
  - **まだ誰も決めていない（`SET.myfont` が無い）はオン。** スイッチで切った人（`false`）だけオフで、それは変えない。
  - 「オンか」を答えるのは `myFontWant()` 一か所。`myFontOn()` とスイッチがそれを訊く。
  - オンボーディングで字を描いた時に `true` を書いていた所（`obDone()`）は、既定がオンなので消した。書くのはスイッチ（`setMyFont()`）だけ。
- Reason: 描いた字は見えるのが当たり前。描かずに進んだ人に、後で描いた字が出ないのはおかしい。
- Affected features: 辞書、語のページ、文法の章など、語を出す所全部
- Affected data: 貯まる物は変わらない。前に入った `false` はそのまま（人が切ったもの）
- Affected docs: `CLAUDE.md`（§ One place の `SET.myfont` の一文）
- Implementation status: r70-marks。`writes-check`（書き手一つ・読むのは `myFontWant()` だけ）と `line-check` 9 が持つ。

### 2026-09-23 操作のボタンは字で書かない ── 印にする
- Date: 2026-09-23
- Area: data-do を持つボタン全部（全画面・全顔、棒の隅のボタン、選んで消す隅の削除）
- Decision:「あのさ、送信とか共有とかもそうだけど、文字でドカンって共有とか書くの禁止
  してるよね？だから+〇とか送信なら紙飛行機マークにしてるはずなんだけど。これ禁止だから
  全部なくせや」
  - 印のある操作は印で描く：送る＝紙飛行機（`ICON_SEND`）、共有＝`ICON_SHARE`、足す＝＋
    （`ICON_ADD2`）、消す＝ごみ箱（`ICON_BIN`）、編集＝ペン（`ICON_PEN`）、戻す＝`ICON_UNDO`、
    探す＝`ICON_LENS`、戻る＝`ICON_BACK`。字はボタンの `aria-label`（`t()` を通す）。
  - 印は `www/glyph.js` の `ICON_*` の並びから。無い物（紙飛行機）だけ同じ形で一つ足した。
  - 続き（同じ日）：「右上にしてね。送信も　紙飛行機右上、共有も共有マークを右上。その位置に
    書くものはない。」「ルールの徹底なんだからそこだけ直すのやめろよ」
    **画面の送る・共有は、印で、バーの右上**（`navDo()` の `icon`、右上を描く一か所）。
    カードの共有は右上へ移した。お問い合わせの紙飛行機はもとから右上。
    投稿の行・語のページ・例文の行の共有の印は「カード」を開くもので（名前は「カード」）、
    共有そのものはカード画面の右上。
  - 目的語つきの行（「アカウントを削除」「この単語を削除」）は何が消えるかを言う行で、替えない。
  - 印の決まっていない操作（サインイン・次へ・保存・完了・確認…）は字のまま。何の印を
    当てるかはオーナーのもの。一覧は `docs/scope/r70-marks.md`。
  - 問い（`popAsk()`）の二つの答え「削除／閉じる」は字のまま ── iOS の問いも字で答える。
    **オーナーが違うと言えば替える**（r70 の報告に書いた）。
- Reason: 文字でドカンと書かない。送信・共有・追加は印で分かる。この規則はコードのコメント
  （glyph.js の下書きの印）にしか無く、読まれずに「共有」が字で入った。
- Affected features: カード、問い合わせ、辞書・メモ・規則・キーボード・下書きを選んで消す、
  言語の記事・メモ・語の編集、新しい語、自分の項目、ノートの種類、運営画面、検索の戻る
- Affected data: なし。貯まる物・移行・削除なし
- Implementation status: r70-marks。`tools/marks-check.mjs` が持つ。r60 の持ち物
  （post.js の投稿ボタン、me.js のプロフィール編集）は数えて一覧に書き、r60 の後に直す。

### 2026-09-23 管理画面の「数」は @lingua だけ、「履歴」と「戻す」はスタッフ全員 ── 今のままでいい
- Date: 2026-09-23
- Area: 管理画面（`www/mod.js`）、`supabase/schema.sql` の `admin_counts`（`is_admin()`）・`admin_hist` と `admin_restore_lang`（`is_staff()`、2026-09-25 から言語まるごと）
- Decision: 「それでいいよ」
  集計の「数」は @lingua 本人だけ、言語の過去の版を見て戻す「履歴」「戻す」はスタッフなら誰でも。門が違うのは意図どおり。
- Reason: オーナーがそう決めた（`docs/scope/r63-audit.md` §2-7 SQ6 の問いへの答え）。
- Affected features: 管理画面
- Affected data: 無し
- Affected docs: 無し
- Implementation status: IMPLEMENTED ── 今の schema がこの形。

### 2026-09-23 自作文字がオンでも、描いていない字はローマ字で出す
- Date: 2026-09-23
- Area: 語を出す所（`wOut()` `www/home.js`、`sfontHTML()` `www/glyph.js`）
- Decision: 「ローマ字」
  自作文字で表示がオンのとき、まだ描いていない字は、借りた文字ではなくローマ字で出す。
- Reason: オーナーがそう決めた（リーダーの問い「描いていない字は借りた字か、ローマ字か」への答え）。
- Affected features: 辞書、単語のページ、文法の章、暦、投稿の一行以外で語を出す所
- Affected data: 無し
- Affected docs: 無し
- Implementation status: IMPLEMENTED。語は `sfontRuns()`（r61 が測った、`docs/scope/r61-face.md`「決めていないこと」）、暦・時計の数字は `ltLineChar()`（r76-lines ── それまで借りた字を出していた、r73 §2-11）。`ink-check` B が持つ。

### 2026-09-23 古い購入をどのアカウントに付けるかは、考えなくていい
- Date: 2026-09-23
- Area: 購入の確かめ（`supabase/functions/verify-plan/`）
- Decision: 「そもそもアプリ公開されたの昨日だから必要ない。」
  `appAccountToken` の無い購入（2026-09-06 より前）は、実際の利用者にはいない。
  `docs/scope/r63-audit.md` §2-5 S2 は、直すことも決めることも無い。
- Reason: 公開は 2026-09-22。それより前に買った人はいない。
- Affected features: 無し
- Affected data: 無し
- Affected docs: `docs/scope/r63-audit.md` §2-5 S2（記録なので書き換えない）
- Implementation status: 何もしない、が決定。

### 2026-09-23 活用は語にしない ── 語の上にラベルと形のセットで持ち、数えない
- Date: 2026-09-23
- Area: 語の活用（`www/wordsheet.js` § forms、`capOK()`、キーボードの変換、投稿の意味の行）
- Decision: 三つ、そのまま。
  「活用形（時制・法・態など）は、辞書の語として保存しない。元の語のページで、形として出す。
  派生（watch → watcher のように別の語になるもの）は今まで通り語として保存する。」
  （r46 の報告に書かれたもの）
  「活用は数えないにしよう。無料でなるべく使って欲しい。」
  「語ページの活用一覧に出てくる。活用は活用であって単語じゃない。その代わり活用には
  ラベルが必要。原型 aa／未来形 aai。ラベルと単語がセットじゃないと登録できない。
  ラベル自体は自分でも作れる。キーボードの変換もできるように。」
  - 活用は 100 語（Plus の 1000 語）に数えない。前から辞書にある活用語も、手で置いた不規則形も。
  - ラベルは今の語形ラベルの仕組み（組み込み ＋ 自分のラベル `i~…`）を使う。二つ目は作らない。
  - 規則の形は語のページでその場で出る。手で置いた形が同じラベルの規則の形に勝つ（不規則形の道）。
- Reason: 無料でなるべく使ってほしい。活用は語ではない。
- Affected features: 語のページ、新しい語のシート、文法の章の一括ボタン、100 語、キーボードの変換、投稿の意味の行、カード
- Affected data: 語に `fms` が増える（`docs/CHANGELOG.md` 2026-09-23）。前からの活用語は書き換えも削除もしない
- Affected docs: `docs/CHANGELOG.md` `docs/DATA_MODEL.md`
- Implementation status: r52-forms。「語の活用」は `wForms()` 一か所。前からの活用語は**辞書の一覧から外す**（B）── オーナーの言葉「活用は活用であって単語じゃない」からリーダーが B と読んだ（2026-09-23）。データは一つも消さない・移さない。語ページの活用一覧に出て、100語にも数えない。一覧から外す条件は `wIsForm()` 一か所（数え方・`wForms()`・変換と同じ答え）
- Not decided: 接辞の重ね掛け（未来＋仮定＋受動）── r46 の話の残り、この枝ではしない

### 2026-09-23 広告は Twitter と同じ形 ── 投稿に擬態して右上に PR、枠は売れる形、今は AdMob、pro は無し
- Date: 2026-09-23
- Area: ホームのタイムライン（`www/sns.js` `vFeed()`）、投稿の頭（`www/post.js` `postRow()`）、`supabase/schema.sql` の `promo`、`CAN.noads`
- Decision: 言葉どおり ──
  「広告の形は、Twitterと同じ。ツイート擬態右上にprとつく。広告枠が売れる形にする。今は売る人いないからadmobを流す。proのみ表示なし。」
  同じ日の前の言葉 ──「Twitterみたいに間に動画広告みたいな」「広告枠は今後売る可能性もあるTwitterと同じ形だよ？admobで動画流せんの？ツイート擬態で」
  - 広告はタイムラインの中の一行で、投稿と同じ見た目、右上に **PR**。
  - 枠は**売れる**形 ── 売った広告はサーバーが持つ行（`promo` = どの投稿を・いつまで）。
  - 売る相手がいない間は **AdMob** で埋める（動画可）。
  - **pro は表示なし**。plus と free は表示あり。
  - 頻度（同じ日、後から）：「10で。少ない時は出さない！」── **10 件おきに 1 件。投稿が 10 件より少ない時は出さない。**
    `PROMO_EVERY`（`www/sns.js`）の一つの定数で、10 件目・20 件目…の後に入るので、10 件未満には枠が無い。
- Reason: オーナーの言葉のとおり。
- Affected features: ホームのタイムライン。探索・検索・プロフィールには枠を入れていない（Twitter と同じ ── 決まっていないので既定として報告済み）
- Affected data: 新しいテーブル `promo`（運営だけが書く）。人の作った物は何も動かない
- Affected docs: `docs/CHANGELOG.md`、`docs/PAID_FEATURES.md`、`docs/apple.md`、`docs/scope/r55-ads.md`
- Implementation status: r55-ads。売れた枠（`promo`）、PR、`can('noads')`、10 件おき、そして AdMob（`ios/App/App/LinguaAds.swift`）。
  作り方は `docs/scope/r55-ads.md`。jpel と同じく Teen まで・ATT は未回答の時だけ・表示の直前で pro を見る。
  **ATT の許可の画面は iOS 自身が出す物で、`www/` の `confirm()` `alert()` `prompt()` の禁止とは別物**。UMP は入れていない（`docs/BACKLOG.md`）。

### 2026-09-23 今日のお題が変わった時にも通知 ── アメリカ太平洋時間の 0 時、切り替えは五つ目のスイッチ
- Date: 2026-09-23
- Area: 通知（`supabase/functions/push-send`、`supabase/schema.sql` の push 節、`www/push.js` の設定の部屋）、お題の cron（`supabase/setup.md` § 9-5）
- Decision: 「通知なんだけど、今日のお題が変わった時にも出るようにできる？」「時間が決まってるでしょ。アメリカ時間の0時。それに合わせるのは？」「いいよ」「ちゃんとルールに則った綺麗な治し方してよ？」
  - その日のお題の行が入った瞬間に、**全員へ**一通。時刻はお題の日付が変わる **アメリカ太平洋時間の 0 時**（2026-08-23 の「日付はアメリカ時間の0時から」と同じ時計）。
  - 通知の設定に**五つ目のスイッチ**（`profile.prefs.push_prompt`）。四つと同じく、**無いのはオン**。
  - 文は「今日のお題：<その人の表示言語のお題>」、タップでタイムライン。
- Reason: お題は毎日変わり、それを知らせるのが次の一行を書かせる。
- Affected features: 通知、お題
- Affected data: `profile.prefs` に `push_prompt`（押した人だけ）。表・列・移行は無し。トリガー `push_on_prompt` が一つ増える。
- Affected docs: `supabase/setup.md` § 9-5・§ 12、`docs/apple.md` § 8、`docs/CHANGELOG.md`
- Implementation status: r58-prompt-push。**種類は push-send の `PUSH` 一箇所**になり（それまでは push.mjs の `pushWhat`/`pushTo` と index.ts がそれぞれ表の名前で枝を分けていた）、お題はその一行。全員宛てを鳴らせるのは service role の鍵だけ（`pushMay()`）。**それまでの `5 7 * * *` は冬に 23 時間遅れていた**（07:05 UTC は PST の前日 23:05）── `0 7,8 * * *` に。

### 2026-09-23 文字を描く面にガイド線 ── 田（口と十）、見るだけ
- Date: 2026-09-23（同日二度。二度目が今のもの）
- Area: 文字の編集画面のキャンバス（`www/glyph.js` `geDraw()`）
- Decision: r/casualconlang のコメント「精密に描く機能か、ガイド線を置く設定が欲しい」から。
  精密さは既にある（21×21 の点、どの点にも吸い付く）ので、足すのはガイド線だけ。
  A：固定の線、見るだけ、何も保存しない／B：言語ごとに人が置く線（保存する）。
  オーナー「aやね」→ **A**。
  形は、スクショを見たオーナーの二つ目の答え「線がわかりにくい」「十時に引いて口と十で
  引けばいいんじゃない？」で決まった：
  - **口**：点の四角の外周 ── 0 行目と 20 行目、0 列目と 20 列目。
  - **十**：真ん中の行（10 行目）と真ん中の列（10 列目）。合わせて **田**。横と縦の両方。
  - **はっきり見えること**。点とは違う物（点が置ける場所ではない）と読めること。両テーマ。
    線は `--gold`、点は `--dot`。パネルに対するコントラストを測って 3:1（点と同じ基準）を越える。
  - **何も保存しない**。切替も設定も説明文も無い。フォント・キー・タイル・カードは変わらない。
- Reason: 字の形を揃える目安が欲しい、という声。置ける線（B）は保存する物が増える。
  最初の三本（横だけ、`--line`）はパネルに対して 1.1:1 で、見えなかった。
- Affected features: 文字の編集画面だけ
- Affected data: なし
- Affected docs: `docs/CHANGELOG.md`
- Implementation status: r56-guide-sp。行と列は `geGuideRows()` 一箇所、`tools/guide-check.mjs` が描いた線を行・列に戻して測る

### 2026-09-23 人の言語の ↓ は ⭕ で待ち、⭕☑️ で済み。人の言語は wiki に出さない
- Date: 2026-09-23
- Area: 人の「この言語について」のダウンロード欄（`www/home.js` `wldGetRow()` `wldGet()`）、
  wiki（`wldPage()`、プロフィールの `wldRow()`）
- Decision:「人の言語dlした時にdlできたかわかりにくいから↓を押したら⭕️でダウンロード状況表示。
  ダウンロードしてる言語は⭕️☑️にして。」「後人の言語は自分の言語じゃないからwikiページに
  表示させないように。」
  - **↓ を押すと、その章の行が回る**（サーバーの答えが来るまで）。
  - **答えが来たら ⭕☑️**。最初から取ってある章も ⭕☑️。どちらも **サーバーの答え**
    （`language_take`）と、その章が読み込まれていることから出す。端末の印では出さない。
  - **断られたら ↓ に戻り、「接続できません」**。
  - **取った言語は wiki に出ない**：取った言語を開いていると、プロフィールの wiki の行が無く、
    about / world は自分の記事を描かない（`langTheirs()` 一つで問う ── 持ち主が答えていて自分でない時だけ。答えがまだ無い時は隠さず、Edit は `langLocked()` が答えを待つ）。
    その言語の語・字・キーボードは今まで通り読める。
  - 「dlした言語で開いた時だから、そもそも存在しないから無視してもいいよ」── 取った言語の
    about が回り続けた件は追わない（入口が無くなる）。
- Reason: 押して何も変わらないと取れたか分からない。人の言語は自分の wiki ではない。
- Affected features: 人の言語のダウンロード、プロフィールの言語の行、この言語について
- Affected data: なし。貯まる物・移行・削除なし
- Implementation status: r59-take。`tools/take-check.mjs` が持つ
- 未決: 回っている間の印は、アプリに既にある回る印（`snsWaitWord()`）。文字どおりの ⭕ ではない。

### 2026-09-23 字間は言語ごと。既定は 1 歩、0 で繋がる
- Date: 2026-09-23
- Area: 字の並び（`www/glyph.js` `geSide()`）、設定 → 言語、投稿とカード
- Decision: r/casualconlang のコメント（単語が一本の軸に見えるモンゴル文字風の文字）から。
  - 字と字の間を、**言語ごとに**設定できるようにする。
  - **既定は今と同じ 1 歩**。
  - **0 にすると、端まで描いた線が隣とくっついて一本に繋がる。**
  - **置き場所は言語の設定画面**（設定 → 言語）。
  - **アラビア語式の位置別字形（語頭・語中・語末・独立）は今回やらない。**
- Reason: 軸で繋がる文字は、字の間に隙間があると作れない。
- Affected features: 描いた字のフォント二つ、投稿の線、カード、写真の上の字、キーボードの候補欄
- Affected data: `script` スライスの `sp`、投稿の `ink.sp`。どちらも無い＝1 歩。書き足し・移行・削除なし
- Affected docs: `CLAUDE.md` 規則 8、`docs/DATA_MODEL.md`、`docs/CHANGELOG.md`、`docs/CHECK-0907.md` § 166
- 選び方（同日、二つ目の答え）:「あの文字間は規定を1としてスライドで文字間が見えるように l----l----l ↑こう言うレバーみたいなのあるやん その横にどのくらい空いてるかが見える。最大0と2くらいでいいと思う。開けすぎると投稿が大変」「それぞれの字間を見せてね」
  - **スライダー、0〜2、既定 1**。
  - 刻みは言われていない。0.1 にした（`SP_RANGE.step`）。
- 見せ方（同日、三つ目の答え）:「字間> スライダーと下に横と縦それぞれスライドしてどう動くかで別ページにした方が見やすい。」
  - 設定 → 言語 の「字間」は **> で自分のページへ行く行**（行の右に今の値）。
  - そのページは **スライダーと、その下に横書きと縦書きの二つの見本**。どちらもスライダーを動かすと動く。
  - 見本は投稿の一行と同じ物（`.pline` と `dirClass()`、字は `inkChar()`）で描く。別の描き方をしない。
  - 保存する物は増えない（`SCRIPT.sp` 一つのまま）。
- Implementation status: r51-spacing、ページは r56-guide-sp（ルート `sp`、`vSp()`）。数は `www/wsys.js` の `SP_RANGE` 一箇所。
  縦は書体の縦の送り（`www/otf5.js` の vhea・vmtx・VORG、横と同じ `reach()`）で字間に従う。
  `tools/line-check.mjs` 6 が縦書きの投稿と入力欄を字間 0・1・2 で測る

### 2026-09-22 サインインなしでサーバーに触れる道は無い ── 穴ではなく面を覆う。扉の `email_taken()` だけ例外
- Date: 2026-09-22
- Area: サーバー（`supabase/schema.sql`、bucket、edge function）、`www/net.js`、そして直し方そのもの
- Decision: 「サインインなしで勧めるものないけど」「そもそもサインインがない状態でできることがないはずなのにそれがあることを疑って言ってんの。小さい穴だけ潰しても意味ねえだろ、大きいカバーで覆えやバカ」「基本的に穴を潰すんじゃなくて同じように全体を俯瞰して穴を覆って欲しい。今までも全部そうして。じゃないとコードががんじがらめになるし、ルールに追加して必ず守るように」「判断だけどこれは例外で」
  1. **サーバーの物は一つもサインインなしでは触れない** ── 表・view・関数・bucket・edge function の全部。`anon` には権限が無い、と一文で言い（今ある物も明日足す物も）、`rls-check` はカタログを数えて全部を「誰でもない人」として試す。名指しの一覧では持たない。
  2. **扉の `email_taken()` だけが例外** ── アカウントができる前に訊く物なので。check はそれを「許した一つの名前」として数える。
  3. **直し方**: 穴を潰さず、面を数えて一文で覆う。`CLAUDE.md` と § One place に書いた。
- Reason: 通知の関数がサインインなしで叩けると分かり、それを一つ閉じる案を出したら、オーナーは「一つ」ではなく「そういう物がある事」を疑っていた。数えたら既定で全部が開いていて、RLS だけが壁だった。
- Affected features: 通知（r47）、写真の bucket（非公開になる、アプリはセッション付きで取る）、サインインしていない画面からの読み（アプリは送らない）
- Affected data: 無し。誰の行も動かない。**誰が読めるか**が変わる
- Affected docs: `CLAUDE.md` § Simple の次の段、この file § One place、`docs/ARCHITECTURE.md`／`DATA_SAFETY.md` の RLS の文（r47 が書き換える）、`docs/BACKLOG.md`（過去の「穴」の掃除）
- Implementation status: **IMPLEMENTED**（CODE CONFIRMED）── `supabase/schema.sql` の末尾の一塊が `anon` から
  表・関数・ストレージを全部外し、`npm run rls` が `anon` で全部を試す。

### 2026-09-22 投稿画面は、欄をタップしても何も動かない
- Date: 2026-09-22
- Area: 一画面フォーム（`.view.fit`、`www/index.html` の r4-sns の節）と
  `--vvtop`（`www/shell.js` `vvFit()`）
- Decision:（原文のまま）「そもそも画面はスクロールできないようにして欲しい
  んだけど、そうすればズレすら無くなるはずなのになんで？」「キーボードは
  そこで止める。入力位置もタップしても動かないそれでいいやん。」
- **「なんで？」への答え（測った）**：ページはもう止まっていました。
  `html.fitlock` の `overflow:hidden` が**引っぱり**を止めていて、それは
  効いています。動いていたのはページではなく、**WebKit が焦点の欄を見せる
  ために持ち上げるレイアウトビューポート**で、`overflow:hidden` はそれを
  禁じず、JavaScript からも断れません（`preventScroll` は**プログラムからの**
  focus の選択肢で、指でのタップは通りません）。
- Decision as implemented: 持ち上げは**引き算**する。箱は `top:var(--vvtop)`
  で留まっているのだから、高さは**ページ引く `--vvtop`**。
  `.view.fit{height:calc(100dvh - var(--vvtop, 0px))}`。
- **第二の仕組みは足していません。**`--vvtop` 一つに、箱の始まりと高さの
  両方を言わせただけです（`CLAUDE.md` § シンプル ── 書き換えであって
  継ぎ足しではない）。`--vvtop` の読み手は今も `.view.fit` 一箇所だけです。
- 測った（390x844、キーボード 380pt）：持ち上げ N に対し、見えている窓は N
  下がり、**意味は 2N 下がって**いました。画面の座標では意味だけが N 動き、
  **欄と道具の行は壊れている間も止まっていました** ── iOS はまさに焦点の欄が
  動かないように持ち上げるので。
- Affected features: 新しい投稿・返信・ノート（`.view.fit.fitfull` も同じ箱）
- Affected data: **無し**
- Affected docs: `docs/CHANGELOG.md` 2026-09-22
- Implementation status: IMPLEMENTED（`post-check` §「NOTHING ON THE COMPOSER
  MOVES」が画面の座標で欄・道具の行・意味を訊く。赤を見てから直した）。
  **実機未確認**

### 2026-09-22 縦書きの欄は字を立てる ── 142 の `mixed` を取り消す
- Date: 2026-09-22
- Area: 新しい投稿の一行目の欄、縦書きの言語（`.lnin.dir-ttb-rl` /
  `.lnin.dir-ttb-lr`、`www/index.html` の r6-post の節）
- Decision:（原文のまま）「横にするなんか言ったことない。直して。」
- Reason: 実機の写真（ビルド 162、縦書きの言語）で、欄に打った「Hello」が
  **横倒し**で出ていた。`text-orientation:mixed` はローマ字の連なりだけを
  90 度倒す指定で、それが欄にだけ掛かっていた。
- **2026-09-XX（ビルド 142）の r6-post の決定を取り消します。**あの節は
  「縦書きの欄でローマ字が一字ずつ縦に積まれていた」という実機報告への
  対応として `mixed` を入れたものですが、オーナーは今、倒すことを頼んだ
  覚えは無いと言っています。**新しい方が勝ちます**（`CLAUDE.md` §
  オーナーが今言ったことは仕様）。節はコメントごと**削除**しました ──
  「歴史として」残さない（同 § 規則を直すとは消すこと）。
- これで欄は親の `.dir-ttb-rl,.dir-ttb-lr` の `text-orientation:upright` を
  受け継ぎ、**人の投稿の行（`.pline`）と同じ**になります。打った物と
  投稿された物が同じ向きで立つ、というのがこの決定の中身です。
- 測った副作用（390x844、1.2rem）：`upright` だと欄の幅が英語の placeholder
  で 82px（二列ぶん）、日本語で 53px。**切れません** ── `lnFit()` が幅を
  測って伸ばすので、欄が広くなるだけです。
- Affected features: 新しい投稿・返信（同じ `pwHTML()`）
- Affected data: **無し。**貯まる物は一バイトも変わりません
- Affected docs: `docs/CHANGELOG.md` 2026-09-22
- Implementation status: IMPLEMENTED（`post-check` 11d-2 が両方向を
  `getComputedStyle` で押さえる。赤を見てから消した）。**実機未確認**

### 2026-09-18 無料の段は `$0` をやめて「無料」の語 ── 期間は付けない
- Date: 2026-09-18
- Area: プラン画面の無料の段（`planPrice()` の中の `term()`、`plan.price.free`）
- Decision:（原文のまま）「free」
- Reason: `docs/scope/r41-review.md` § 3.1.2-c。Plus と Pro の値段は App Store
  から来る（日本なら円）のに、その隣の Free だけが十言語すべてドルの額で出て
  いた（`$0／月` の横に `$4.99／月`）。`docs/BACKLOG.md` が三択
  （`0`／無料という語／何も出さない）をオーナーの決めごととして残していた。
- 語はその言語の「無料」: en `Free`、ja `無料`、es・it `Gratis`、pt `Grátis`、
  fr `Gratuit`、de `Kostenlos`、ru `Бесплатно`、zh `免费`、ko `무료`。
- **そして「／月」を付けない ── 値段の無い物に期間は無い。**`term()` の中の
  一箇所で、二つ目の関数は作らない。金を取る段は今までどおり期間を言う
  （Apple の 3.1.2 が求めている所）。
- 自動更新の開示は動かない: あの一文・規約・プライバシーポリシー・「購入を復元」
  はページの下に一度出る物で、段ごとの物ではない。**Free はサブスクリプション
  ではない**ので、そこから期間を外すことは開示に触らない。
- Affected features: プラン画面（`vPlans`）の無料の段の表示だけ
- Affected data: **何も。**`plan.price.free` は画面に出る語。`localStorage` の
  鍵も、サーバーの列も、`CAN` も一文字も動かない。移行も削除も無い。
- Affected docs: `docs/CHANGELOG.md`、`docs/BACKLOG.md`（この件の節を消した）、
  `docs/scope/r43-namefree.md`
- Implementation status: IMPLEMENTED。`tools/plan-check.mjs` が無料の段を
  二言語で描いて保つ（語・ドル記号が無いこと・期間が無いこと・金を取る段には
  期間が在ること）。**それまで無料の段を描く check は一本も無かった** ──
  上の claim は全部 `PLANS[1]` を `free` false で描いていた。


### 2026-09-18 Apple／Google がくれた名前は姓→名 ──「山田太郎」
- Date: 2026-09-18
- Area: オンボーディングの「名前と @」の顔、`obGaveName()`
- Decision:（原文のまま）「山田太郎」
- Reason: Apple は `givenName` と `familyName` を別々に渡すので、くっつける
  順番はアプリが決めることになる。`docs/scope/r40-siwa.md` がそれを「オーナーへ
  訊いていないこと」として残していた（当時は given + ' ' + family ＝「太郎 山田」）。
- 間の空白はリーダーの読み: `uiLang()` が `ja`／`zh`／`ko` なら空白**なし**
  （オーナーの例が「山田太郎」で空白が無いため）、それ以外は空白**一つ**
  （「Smith John」を「SmithJohn」にしないため）。中国語と韓国語の名前も姓が先で
  間を空けないので同じ扱い。**順番は言語で変わらず、変わるのは空白だけ。**
  人が直せる欄なので、違っていればその場で直せる。
- Google が `name`（丸ごと一つの文字列）を渡してきた時はそのまま使う ──
  並べ替える材料が無く、並べ替えるのは名前を書き換えること。
- Affected features: ソーシャルの扉から入った新しい account の名前欄の初期値
- Affected data: **何も。**入力欄の初期値の組み方だけで、`localStorage` の鍵も
  サーバーの列も送る中身も同じ（`profile.display`）。移行も削除も無い。
- Affected docs: `docs/CHANGELOG.md`、`docs/scope/r43-namefree.md`
- Implementation status: IMPLEMENTED（`obGaveName()` 一箇所）。
  `tools/acct-check.mjs` claim 78 が二つの面（ja・en）と Google の `name` を
  押して保つ。**CODE CONFIRMED のみ** ── Apple のシートは実機でしか出ない。


### 2026-09-18 キーボードはフルアクセスを要求しない
- Date: 2026-09-18
- Area: iOS キーボード拡張、案内（`?`）
- Decision: 「切っていい」── `RequestsOpenAccess` を `false` にする。案内の
  手順 4「「フルアクセスを許可」をオンにする」は**手順ごと**消す。番号は
  詰めない（1・2・3 がそのまま）。
- Reason: 拡張はフルアクセスの要る API を一つも使っていない。grep 済み ──
  `UserDefaults` 0、`URLSession` 0、`UIPasteboard` 0、`openURL` 0、App Group
  への書き込み 0。審査 4.4.1 が逐語で *"Remain functional without full network
  access and without requiring full access"*。取らずに済むなら理由も聞かれない。
- Affected features: キーボード拡張、案内の四手順 → 三手順
- Affected data: 無し。`keyboard.json` の形も書き方も読み方も同じ。
  `localStorage` の鍵もサーバーの列も増減無し
- Affected docs: `docs/CHANGELOG.md` 2026-09-18、`docs/keyboard-extension.md`
  （plist の節・審査 4.4.1 の節・冒頭・プライバシーの節・実機の記録）、
  `docs/keyboard.md`:129、`docs/CHECK-0907.md` ビルド 162
- Implementation status: IMPLEMENTED（`claude/r44-ios`）。**DEVICE
  UNCONFIRMED** ── Linux に Swift は無い。実機でフルアクセスを**オフのまま**
  Lingua キーボードを開いて自作の字が出ることを見るまでは推論

### 2026-09-18 向きは縦のみ
- Date: 2026-09-18
- Area: iOS 本体の `Info.plist`
- Decision: 「縦のみ」── `UISupportedInterfaceOrientations` と
  `UISupportedInterfaceOrientations~ipad` の両方を
  `UIInterfaceOrientationPortrait` 一つだけにする。`~ipad` の
  `PortraitUpsideDown` も落とす。
- Reason: `docs/scope/r41-review.md` § 4.0-b が押して測った ── 844×390 で
  `#app{max-width:480px}` の柱は崩れないが、高さが 390 しかないのでプラン画面は
  下タブの帯が段の中身に重なる（`shots/r41-land-plans.png`）。横向きを許す必要が
  無いなら閉じるのが安い。
- Affected features: 画面の向き全部
- Affected data: 無し。`www/` は一行も触っていない
- Affected docs: `docs/CHANGELOG.md` 2026-09-18、`docs/CHECK-0907.md` ビルド 162
- Implementation status: IMPLEMENTED（`claude/r44-ios`）。**DEVICE UNCONFIRMED**

### 2026-09-15 自分の言語の一覧はサーバーの答えそのもの ── 端末の索引は数えない
- Date: 2026-09-15
- Area: 言語の一覧、天井、起動とサインインの降り／上り
- Decision:（原文のまま）「端末で使うものなんかないだろ」「そもそも端末を使用
  するところがないんだから直すじゃないでしょ設計ミスなんだから作り直しでしょ」
- Reason: オーナーが実機（158）でサーバー上の名前の無い空の `language` 行を
  二本消したあと、設定→言語 にその行が「未設定」として残り、「言語を追加」が
  「アップグレードが必要です」で断られた。そして 09:09:57 UTC、ログアウト→
  ログインの一秒後に名前の無い空の行がまた一本できた。どちらも端末の索引
  `lingua.langs` を「この account の言語は何か」の答えとして使っていたため
  （降り＝答えに無い行を落とさない、上り＝索引の行から `language` を POST する）。
- Affected features: 言語の一覧（`vLangs`）、言語を追加、主言語、起動と
  サインインの同期
- Affected data: **端末の写しだけ**。`lingua.langs` の行と `lingua.<id>.` で
  始まる鍵が、サーバーの答えに無い言語について落ちる。`language` と `slice` の
  行は一バイトも動かない。DELETE REVIEW は `docs/CHANGELOG.md` 2026-09-15。
- Affected docs: `CLAUDE.md` 規則 22・規則 11、`docs/DATA_MODEL.md`、
  `docs/CHANGELOG.md`
- Implementation status: **CODE CONFIRMED**（`claude/r36-index`）。
  `netLangsGone()` が自分の言語と取った言語の両方を扱う一つの関数
  （~~`netTakeGone()`~~ は削除）、`LMINE` が「訊けたか」の三つ目の状態、
  `langMineIds()` は `langHeld()` が真のものだけを上げる。
  `acct-check` 74・75・76。**実機は未確認。**

### 2026-09-12 主言語 ── 一番古く作った言語。無料はそれだけ出て、それが開く
- Date: 2026-09-12
- Area: 言語の一覧、段が落ちた時に開いている言語
- Decision:（原文のまま）「無料はそもそも1つの言語しか出ないやろ。一番最初に
  作ってた作り込んでた言語だけ表示であとは隠すだろ」「そもそも最初に作った言語を
  主言語にして、フリーにした時に最初に表示されるようにしないとダメでは？」
  - **主言語＝そのアカウントが一番古く作った言語。**
  - **一覧を畳む時に残るのは、作った順に古いほうから天井の数だけ**（無料 1、
    pro 3）。
  - **段が無料に落ちた時、開いている言語が畳まれる側なら主言語が開く。**
  - **読んでいる言語（人からもらった言語）で同じことが起きた時も、開くのは
    主言語です**（リーダー経由、2026-09-12）。`langsSeen()` は一つの関数で
    自分の言語と読んでいる言語の両方を畳むので、「開いている物を末尾に差し
    替える」行を外すと読む側にも効きます。そこで開かれるのは**その人が作った
    一番古い言語**であって、畳まれた「読んでいる言語」ではありません ──
    主言語は「そのアカウントが作ったもの」の中の一番古いもので、人からもらった
    言語は誰の主言語でもないからです。
  - **サインインした直後に開くのも主言語です。**`langForAcct()` は索引の並びの
    先頭を開いていました ── 端末がその行をいつ受け取ったかの順で、作った順では
    ない。無料で一覧に出るのは一本なので、一覧に行が無い言語に人を立たせて
    いました。
- Reason: 一覧は `Object.keys(LANGS)` の並び ── この端末がその言語の行をいつ
  受け取ったかの順 ── で畳んでいたので、二台目で入り直すと無料で出る一本が別の
  言語になっていた。そして「開いている物を一覧の末尾に差し替える」行
  （2026-09-02「開いてるものを残すでいいよ」）が、無料で出る一本を「一番古い
  言語」ではなく「たまたま開いていた言語」にしていた。
- Affected features: 言語の一覧、段が落ちた時の切り替え
- Affected data: **増減なし。**写す物が一つ増える ── `lingua.<id>.made.got`、
  `language.created_at` の写し、その言語の物、上る道なし
  （`docs/CHANGELOG.md` 2026-09-12、`docs/DATA_MODEL.md`）。畳まれた言語は
  `LANGS` にも `lingua.` の下にも一バイトそのまま残る
- Affected docs: `CLAUDE.md`（規則 22）、`docs/DATA_MODEL.md`、
  `docs/PAID_FEATURES.md`、`docs/CHANGELOG.md`
- Implementation status: `claude/r35-main`。**IMPLEMENTED**（CODE CONFIRMED）。
  端末に二つ目の規則は作っていない ── サーバーの `profile_seen.lang_id` が
  `language_seen` を `created_at asc limit 1` で引いている、その同じ列を同じ
  向きで読む（`supabase/schema.sql`）。`langsByAge()` が並べる一箇所、
  `langMainId()` がその先頭、`langMainFall()` が `planTook()` から呼ばれる一箇所、
  `langForAcct()` がその同じ `langMainId()` を読む一行（`www/core.js`）。
  `plan-check` に五本、`acct-check` に 73、`dl-check` の「開いているものを残す」の
  claim は書き替え。**2026-09-02 の「開いてるものを残すでいいよ」は、これに
  置き換わりました** ── 立っている言語が一覧から消えないことは
  `langMainFall()` が守ります

### 2026-09-12 朝の六つ ── 言語の切り替えはプロフィールへ、電波なしは前の分を出す、新しい言語は 38 字
- Date: 2026-09-12
- Area: 言語の一覧と切り替え、電波なしの画面、文字、保存した検索、段、アカウント
- Decision:（原文のまま）
  - (a) 「プロフィールは1つなんだから言語を選択したらそのプロフィールに飛ぶだけで
    言語が変わるんやで」── **「言語を追加」も一覧の行も、押すとプロフィールへ
    行き、そこで言語が変わっている。**これが仕様で、2026-08-25 の
    「アカウントが変わるイメージ。実際の sns はアカウント切り替えボタンあるやん？
    あれが言語切り替えになるって感じ」がそのまま生きている。2026-09-05 の
    「確定は一個前へ戻る」は**言語の選択には掛からない**。
  - (b) 「前に読み込んだの出していいよ。何か更新するならクルクルが必要」──
    **電波が無い起動では、前に読み込んだ物を出す。取った言語も。**更新と保存は
    クルクル →「接続できません」。2026-09-04「前に読み込んだ分は出て欲しい。
    制作も眺めたい人はいるだろうし、」の再確認。
  - (c) 「文字0はアルファベットでいいやん」── **新しい言語は、段を問わず
    a〜z・! ?・底の数だけの数字の三十八字で始まる。**
  - (d) 「（★の ×は）つけない！」── **保存した検索に × は付けない。**外すのは
    ★ 一つの道。
  - (e) 「プランが終了しました」は**サーバーの答えで出す** ── `plan` 表に列を
    足す SQL のあと。
  - (f) **二本に割れたアカウントは SQL で一本に。まだ。**
  - (g) 「オンラインで出してね流石に」「4 起動の時に表示して ☑️今後表示しない
    閉じる みたいなポップにしたくない？」── **「プランが終了しました」は起動の
    ポップ。**アプリ自身のポップ（`#pop`、`popAsk()` と同じ場所）に、見出し／
    ☑「今後表示しない」／「閉じる」の三つだけ。長い説明文と「アップグレード」の
    ボタンは**載せない**。**見たかどうかはサーバーの列**（`plan.lapse_seen_at`、
    書く道は RPC 一つ）で、**端末には一言も書かない** ── ☑ を付けずに閉じたら
    次の起動でまた出る。前の段も列（`plan.was`、下がった時だけ入る）。
  - (h) 「有料が消えて無料に残った後は非表示じゃないの？」── **無料に戻った後の
    言語の一覧は、天井までを出して残りを「非表示 n」で畳む。**消さない・数えて
    減らさない・読めなくならない、は今までどおり。これは 2026-09-12 まで
    `docs/DATA_MODEL.md` と `www/core.js` が「畳まない」と書いていた所で
    （`docs/BACKLOG.md` に食い違いとして挙がっていた）、**オーナーが畳む側に
    決めた**ので、規則の文をそちらに直した。
- Reason: (a) 一覧と切り替えが二つの画面に見えていた。(b)(c) は実機で出た穴 ──
  電波の無い所で取った言語が丸ごと消え、有料で作った言語が文字 0 で綴りを打て
  なかった（2026-09-11 の hunt #6）。(d) は ★ が二つの道になるため。
- Affected features: 言語の一覧・切り替え、電波なしの画面、文字、検索、段
- Affected data: (c) **増減なし**（有料の言語が三十八字を持つようになるだけ、
  移行なし）。(b) **鍵が一つ増える** ── `lingua.take.<uid>`、`language_take` の
  答えの写し、そのアカウントの物、上る道なし（`docs/CHANGELOG.md` 2026-09-12、
  `docs/DATA_MODEL.md`）。(a)(d)(e)(f) なし
- Affected docs: `CLAUDE.md`（規則 22・§ What the free plan is）、
  `docs/DATA_MODEL.md`、`docs/PAID_FEATURES.md`、`docs/CHANGELOG.md`、
  `docs/BACKLOG.md`
- Implementation status: `claude/r33-owner`。**(c) は IMPLEMENTED**（CODE
  CONFIRMED、`plan-check`）。**(b) は半分** ── 取った言語は端末に残って
  `langWhose()` が read と答えるようになった（`again-check`）が、**一覧にはまだ
  出ない**：段を訊けていない起動では `dlCap()` が 0 になり読む側の一覧が畳まれる
  ため。段の決めごとなので決めずに置いてある（`docs/BACKLOG.md` § 段を訊けて
  いない間、一覧を切るか）。**(d) は既にそうなっている**
  （`snsSearchesHTML('sns.saved', …, null)`、`www/sns.js` ── `drop` が `null`
  なので保存した検索の行に × は描かれない。× が付いているのは「最近の検索」の
  ほうで、そちらは ★ ではない。2026-09-12 に読んで確かめた、変更なし）。
  **(a) は既にそうなっている**（`langOpen()` が `goTab('profile')` で終わる、
  `www/core.js`）。**(f) は未着手**で、SQL が先。
  **(e)(g)(h) は `claude/r34-lapse`** ── `plan` 表に `was` と `lapse_seen_at`、
  書く道は `plan_lapse_seen()` 一つ、`verify-plan` が下がった時だけ `was` を
  書き、起動のポップは `capLapseSaw()`（`www/settings.js`）。(h) は文の直しだけ
  （畳む code は前からある）。CODE CONFIRMED（`plan-check` `rls-check`）。
  **DEVICE 未確認、OWNER 未確認。流す物が二つあります**（`supabase/setup.md`
  § 8c ── `schema.sql` 貼り直しと `functions deploy verify-plan`）

### 端末は何も決めない ── オンライン、一端末に一アカウント、言語はアカウントの物
- Date: 2026-09-11
- Area: `www/` 全部（言語の索引、段、登録の印、写しの印、移行の印）
- Decision: 「印も何も全部保存とかサーバーでやってるんじゃないの？ 全部サーバーで
  やってんじゃねえの？」「オンラインで 1 端末に 1 アカウント、そのアカウントに
  結びつけられる言語数が決まってるんだから端末でやることねえ」「全部出して俺の
  いうとおりの仕様にしろ」。**仕様はこれだけ**：オンラインのみ。一端末に一
  アカウント（`lingua.sess`）。言語はアカウントの物で、何本持てるかは段が決める。
  誰の物か・あるか無いか・名前・公開か・段 ── 答えは全部サーバー。端末にあるのは
  「前に読み込んだ写し（読むだけ）」だけで、**端末の物で分岐して作る・消す・
  送る・見せる／見せないを決める行は、全部消す**。電波が無ければ「接続できません」
  （回る）であって「まだ何もない」ではない。
- Reason: 端末側の印（`langMine`／~~`langOwned`~~、段の写し、登録の印、`.got` の印、
  移行の印）で分岐する行が百か所を超え、絡まった所からバグが出ている ── 登録の
  最後に空の言語が一本生え、打った名前がそちらに付く、が今日の実例。
- Affected features: 登録の最後、言語の一覧、二台目のサインイン、ログインし直し、
  段、電波なしの画面
- Affected data: 決めるまで**なし**。一覧（`docs/reports/mixed-2026-09-11.md`、
  `claude/r29-mixed`）が出てから、消す物を名指しで DELETE REVIEW
- Affected docs: CLAUDE.md（規則 22）、`docs/DATA_MODEL.md`、`docs/ARCHITECTURE.md`
  ── 一覧が出てから、消す行と一緒に
- Implementation status: **OWNER DECISION**。止めは同じ日の夜に解かれています ──
  「全部直してゲートまで終わらせてビルド出してくれ」（OWNER 2026-09-11、リーダー
  経由）。**「勝手に修正しないで」はこの一文に置き換わりました。**
  `claude/r27-off` はそれを受けて、この決定が名指ししている電波なしの一文を含む
  三件を直してあります（`docs/CHANGELOG.md` 2026-09-11 の三項）── 電波が無い
  ときは「接続できません」であって「まだ何もない」ではない（`pullSay()`、
  `www/sns.js`）、届かなかった保存は画面を進めない（`www/wordsheet.js`）、
  アカウント削除で `.got` の写しも取る（`www/core.js`、DELETE REVIEW 済み）。
  **端末の印で分岐する百か所の書き直しはまだです** ── そちらは「Affected data:
  決めるまでなし」のままで、一覧（`docs/reports/mixed-2026-09-11.md`、
  `claude/r29-mixed`）→ オーナーが消す物を見る → 書き直し、の順
### 文法の頁の単位は「形」ではなく「節」。行の名は学校文法の用語
- Date: 2026-09-11
- Area: 文法の章の頁（`www/grammar.js` § G2FM_CHAPS、`www/phases.js` § G2BOOK）
- Decision: 「開いたらそんな分け方してるの意味わからない。**人称でまとめて設定
  できればいいやん**」「**日本語はちゃんとしてくれ**。主語で変わる形なんか
  聞いたことない。私たちなんか単語で設定したら終わり、俺は文法の話をしてる」
  → リーダーが形を節にまとめる案を出し、オーナーが「それで進めて」。
  **頁の単位を「形」から「節」に変える。**動詞の章は 人称変化／時制／命令・条件・
  可能・〜しなければならない・〜したい／受け身・使役／否定形・疑問形 の六行。
  「人称変化」は一頁で、六つの形が見出しとして並ぶ。表は頁に一つ（列＝形）、
  例文も頁に一つ、`?` は節の分。**形が一つの節も特別扱いしない。**
  行の名は学校文法の用語 ── 一人称単数…三人称複数、`obl` は
  「〜しなければならない」、`des` は「〜したい」。
- Reason: 動詞を開くと二十一の扉が並び、「主語で動詞がどう変わるか」を書く人は
  六つ歩いて同じ種類の規則を六回書くことになっていた。行の名も「私の形」
  「君たちの形」で、文法の話をしている人に向けた語ではなかった。
- Affected features: 文法（章の頁・節の頁・`?`・語の表・例文）
- Affected data: **なし。**`STG.fm` の規則も、その `fm` も `id` も、`STG.gr`
  `STG.ex` ~~`WORDS.slot`~~ もそのまま。移行なし。消えたのは形ごとの章
  （`v2:p1s` 等の route arg）と、`G2BOOK` の群の見出し
- Affected docs: `docs/GRAMMAR-V2-SPEC.md` § 完成の定義（動詞と修飾の行）、
  `docs/CHANGELOG.md`
- Implementation status: `claude/r23-sec`。CODE CONFIRMED（`act` `gramlang`
  `i18n` `keep` `press` 緑）。DEVICE 未確認、OWNER 未確認

### 文法は 9 章＋付録の文法書。否定と疑問は動詞の章の節
- Date: 2026-09-11
- Area: 文法の頁（`www/phases.js` § G2BOOK、`www/grammar.js`）
- Decision: 「否定形単体じゃなくて、文法書なんだから動詞とかのページに作るべき。
  項目増やすよりも一つ一つ厚みを増やして。多少は分けていいけど、文法の教科書
  みたいなのを見て章分けを決めてくれ」→ リーダーが記述文法書の目次に沿って
  分け、オーナーが「それでやって。中身もできたら見せて」。**43 行の平らな一覧を
  やめ、9 章＋付録にする。今の項目は章の頁の中の節。**否定と疑問は章ではなく
  動詞の章の節で、**四つから選ぶだけの頁は消す** ── 四つの対象はそれぞれ属する
  節から開く。**肯定の文と否定の文を並べて規則を出す作り方は変えない。**
- Reason: 人称の六つも時制の六つも法の五つも、あいさつと同じ高さの行だった。
  どこまでが動詞の話なのかは並び順でしか分からず、「否定形」だけが四つの対象を
  選ぶ頁を一枚余分に持っていた。
- Affected features: 文法（目次・章の頁・否定・疑問）
- Affected data: **なし。**`STG.gr` `STG.fm` `STG.extra` `STG.set` ~~`WORDS.slot`~~
  はそのまま。移行なし。消えたのは描く関数だけ
- Affected docs: `docs/GRAMMAR-V2-SPEC.md` § 完成の定義（表を書き換え）、
  `docs/CHANGELOG.md`
- Implementation status: `claude/r20-book`。CODE CONFIRMED（`act` `i18n`
  `gramlang` `press` 緑）。DEVICE 未確認、OWNER 未確認

### 同じものを何度も運ばない ── 保存の写しを返さない・送る前の読みを無くす・起動の二度読みを一度に
- Date: 2026-09-09
- Area: 保存の道（`netSlicePut` / ~~`netSaveUp`~~、今は `netSaveNow`）、起動の道
- Decision: `docs/reports/cost-2026-09-09.md` の三つを直す「これもやって」。
  5,000 語の人の保存一回 2.6 MB → 0.9 MB 以下、起動一回 1.9 MB → 1.0 MB 以下。
  $25 で 763 人 → 1,846 人。**二台目が同じ言語を編集した時に片方が消える形には
  しない**（規則 6・22 はそのまま）。
- Reason: 「$25 でどこまで対応できんの？」→ 測った → 同じものを三度運んでいた。
- Affected features: 保存、起動
- Affected data: 保存されるものは増えも減りもしない。流れる量が減る。
- Implementation status: `claude/r10-wire` で作業中。

### ♡は押した瞬間に点き、届かなければ消える／古い言語の件は作らない／運営が戻せる画面が欲しい
- Date: 2026-09-09（午後、続き）
- Area: 投稿の♡、古い言語、運営画面
- Decision:
  - **♡は押した瞬間に点いて数が 1 動く。サーバーに届かなかったら♡が消えて
    数が戻る。何も言わない。**「Twitter もその仕様なはず。ハート押して 1 つく
    やん？サーバー飛んでないならハートが消えるでいいんじゃない？」──
    2026-09-09 の「投稿の数と自分が押したかはサーバーのもの ── 押した瞬間は
    動かず、戻ってきた数になる」の**「押した瞬間は動かず」を上書き**する。
    数の答えがサーバーのものであることは変わらない：画面が先に動くだけで、
    端末に「押した」の写しは作らない。
  - **一度もサーバーに上がっていない古い言語をサインインした人のものにする
    ── 作らない**「いらん」。今のまま（開けるが書けない）。
  - **運営がアカウントを復旧できる仕様は欲しい**「ユーザーが問い合わせてきた
    時に、アカウントの復旧ができるようにしたいけど、管理画面とかで」。
    **残し方は回数：部分（slice）ごとに直前 3 版**「回数じゃね」「3 で
    実装して」（2026-09-09）。日数ではない ── 人が増えても一人あたりの上限が
    変わらないから。管理画面（7 回タップ、@lingua）に、handle で探す → その
    人の言語 → **言語の版（3 つ前まで、日時）→ 言語まるごと戻す**（「言語を前に
    戻す →『3つ前、まるごと』」2026-09-24。部分ごとに戻す形はこれで書き直した）。
    戻すと、それまでの「今」も版の一つになる。`docs/RECOVERY.md` 案A の形。**SQL の流し直しあり。**
    合わせて「$25 で何人持つか」を測った数字で出す（`claude/r10-measure`）。
- Affected features: ♡、古い言語、管理画面
- Affected data: ♡は保存されるものが増えない（画面の一時状態だけ）。復旧は
  サーバーに前の版が積まれる（作る時に DATA_MODEL を書く）。
- Implementation status: ♡は **IMPLEMENTED**（`postLike()` と `PMARK`、`www/post.js`、`acct-check` 62）。
  古い言語は BACKLOG に「作らない」。復旧は BACKLOG（リリース後、日数待ち）。

### 2026-09-09 の午後、画面で訊いて答えの出た十一
- Date: 2026-09-09
- Area: DL、書記体系、言語の名前、投稿・検索・プロフィール、キーボード、文法
- Decision（オーナーの言葉そのまま）:
  1. **DL 言語は言語切り替え画面の行をスライドして消せる**「はい」。
  2. 前から選んでいた書記体系が 145 で未設定に見える件 ──「これから変わら
     ないようにすればいい」。自動で前の選択を入れる道は作らない。今の形で確定。
  3. 9/8 より前に改名した言語の名前が端末で違う件 ──「古いのはいい」。このまま。
  4. 圏外で作って一度も上がっていない古い言語 ── 訊き方が悪く、答えは出て
     いない（下の但し書き）。
  5. まだ届いていない自分の投稿の♡ ── 訊き方が悪く、答えは出ていない。
  6. **お題の札を押した検索の箱も表示言語で出す**「そのままでいいわけない」。
  7. **@名前 で始めた投稿はプロフィールの「返信」欄にだけ出す**「返信にだけ出して」。
  8. **投稿画面の「Replying to @〇〇」に × を付けて外せるようにする**「いいよ」。
  9. **空のキーボードを 2 枚作ったら 2 枚のまま**「ダメに決まってんだろ」。
     一枚にまとめる道は消す（増殖は元で止める）。
  10. **名詞クラスは消せるようにする。消したら「なし」に置き換えるのではなく
      消す**「なしじゃなくて消して」── クラスも、そのクラスの一致の規則も。
      その名詞はクラスを持たなくなる。
  11. **否定語の前／後は語順の画面に足す**「はい」。
  12. **文法書の規則の文に条件を書く**「はい」。
  15. **起動で同じ言語が切り替えに 2 行並ぶのは起きないようにする**「ならばないようにして」。
- Reason: 上の言葉。
- Affected features: DL、検索、プロフィール、投稿画面、キーボード、文法
- Affected data: 1 はサーバーの `language_take` 行の DELETE と端末の行（DELETE
  REVIEW）。9 は「一枚にまとめる」削除を**やめる**（消えるものが減る）。10 は
  クラスと規則の削除（DELETE REVIEW）。他は保存されるものは増えない。
- Affected docs: `docs/BACKLOG.md` の該当項目（消す）、`docs/CHECK-0907.md`
- Implementation status: **2026-09-23 に番号ごとの照合はしていない。**配った枝の名前で書いた作業中の
  記録は古いので消した。どれが入ったかは、各番号の Area のコードを読むこと。

**4 の但し書き**：「圏外でログイン」の話ではない。9/4 より前の古いアプリで作って
一度もサーバーに上がっていない言語を持つ端末で、（電波のある所で）サインイン
した時、その言語は開けるが一文字も書けない、という件。リーダーの仮置き：
**サインインした人の言語にする**（違えば言ってもらう）。

### DL 言語の四つ ── 空で残さない・非公開は新規 DL を止めるだけ・↓ は切り替えない・返す道はスライド
- Date: 2026-09-09（同日の「印」の決定の続き）
- Area: ダウンロードした言語（`www/net.js` § netTakenDown、`www/home.js`
  § 言語切り替え・wldGet、`supabase/schema.sql` の slice_read / take_make）
- Decision:
  1. **元が消えた DL 言語は端末からも消える。**「空で残さないで。消えたら
     消えるのよ。」切り替えの行も slice も、`language_take` の答えに無くなった
     時に落ちる。「答えが来ていない」（null）では何も落とさない。
  2. **非公開は新規 DL を止めるだけ。**「非公開にしたら新規 dl だけできない
     だけ」── 既に取った人は読み続ける（サーバーの `slice_read` が取った人に
     開く）。新しく取る道は閉じる（記事が描かれない＋`take_make` が断る）。
  3. **↓ はその言語に切り替えない。**「6 切り替えなくていい。」記事に留まる
     （今の形で確定、`dl-check` の「開いたまま」の claim がそれ）。
  4. **DL 言語を返す道は、言語切り替え画面の行をスライドして消す**（メモ、
     まだ作らない）。「言語変更画面をスライドで消せる、メモしといて」。作る
     日は DELETE REVIEW。
- Reason: オーナーの言葉そのまま（上）。
- Affected features: DL、言語切り替え、公開 / 非公開、記事
- Affected data: 1 は**端末の索引の行と slice を消す**（DELETE REVIEW を
  `docs/CHANGELOG.md` に先に書く）。2 は **schema.sql**（`slice_read` に
  「取った人」を足す、`take_make` に「公開中」を足す）── **SQL の流し直しが
  要る**。3・4 はデータ無し。
- Affected docs: `docs/FEATURES.md`「Reading a downloaded language」、
  `docs/BACKLOG.md`、`docs/CHECK-0907.md`、`supabase/setup.md`
- Implementation status: 1・2・3 は IMPLEMENTED ── 1 は `netLangsGone()`（`www/net.js`、
  `acct-check` 74・75・76）、2 は `language_took()`（`supabase/schema.sql`、`npm run rls`）、
  3 は今の形。4 は BACKLOG。実機未確認。

### DL した言語は「印」── 元が消えれば取った側からも消える
- Date: 2026-09-09
- Area: ダウンロードした言語（`language_take`、`www/net.js` § netTakenDown /
  netLangsWalk、`www/home.js` § wldGet、`supabase/schema.sql`）
- Decision: 「dl元が言語を削除したり、アカウントを消してその言語自体が消えた
  場合は、dlユーザーからも削除される」。DL は**写しではなく印**：サーバーに
  複製は持たず、取った人は元の slice をそのまま読む。元の言語が無くなれば
  `language_take` の行も無くなり（cascade）、取った人の切り替えからも消える。
  DL した言語は「削除するまで一生保持」── 取った人がアカウントを消すまで。
  元が**編集**したとき取った側が次の起動で新しい方になるのは、この形の
  帰結（別に決めていない）。元が**非公開**にしたときは未決。
- Reason: 「DLしたら複製されて、いろんな人が使えるんだよね？…それは削除する
  までは一生保持されるよね？ちなみに、dl元が言語を削除した場合は消えますよね？」
  → 消える、で確定。
- Affected features: DL、言語切り替え、アカウント削除、言語削除
- Affected data: **サーバーは今のまま**（`language_take` は `language` の
  削除で cascade、`schema.sql`）。**端末の索引の行も落ちる**：起動の
  ~~`netTakeGone()`~~（`www/net.js`）が、`language_take` の答えに無くなった
  `mine:false` の行と slice を落とす。DELETE REVIEW は `docs/CHANGELOG.md`
  2026-09-09。答えが来ていない起動（`LTAKE===null`）では何も落とさない。
- Affected docs: `docs/FEATURES.md`「Reading a downloaded language」、
  `docs/BACKLOG.md`、`docs/CHECK-0907.md`
- Implementation status: IMPLEMENTED ── サーバー側は cascade、端末の索引の行は `netLangsGone()`
  （`www/net.js`、実機未確認）。元が**非公開**にしたときは「DL 言語の四つ」の 2。

### お題の札は、保存は一つの綴り・見せるのは読む人の表示言語
- Date: 2026-09-08
- Area: お題のタグ（`www/sns.js` § DAY_TAG、`tagHTML`、`www/card.js` §
  cardSrc、`www/post.js` の投稿画面と下書き）
- Decision: `#今日のお題` は**保存されるときは常にこの一つの綴り**で、
  **画面に出るときは読む人の表示言語**になる。誰の投稿でも、読む人の言語で
  そこが変わる。「#今日のお題 は #todays prompt みたいに、言語が変わったら
  誰の投稿でもそこが変わるように」。押した先の検索は綴りで行う。
- Reason: 「なんで英語なのに#今日のお題やねん」── 表示言語が英語なのに
  日本語の札が本文に入っていた。お題は全員共通でアプリの言葉なので、
  誰の言葉でもない。「今日のお題だけ、毎回その人の表示言語になるように
  できないの？…全員共通なんだから」（2026-09-01 と同じ言葉）。
- Affected features: お題、タグ、投稿画面、下書き、カード
- Affected data: **無し。**保存されるものは一つの綴りのまま。過去の投稿は
  書き換えない。
- Affected docs: `docs/CHANGELOG.md` 2026-09-08、`www/sns.js` § THE TAG の
  コメント、`tools/find-check.mjs` 13
- Implementation status: IMPLEMENTED（実機未確認）

**これは 2026-09-04 の「翻訳はいらんから」を上書きします。**あの日の決定は
札を十言語に割るのをやめて一つの綴りにする、というものでした。その理由
（十に割れると文字検索が出会わない）は今も正しく、**だから保存は一つの綴りの
ままです**。上書きされたのは「見せ方も一つ」という部分だけで、保存と見せ方が
別のことだ、というのが今日の決定です。
### 「この言語は非公開か」の答えはサーバーの `published_at` 一つ
- Date: 2026-09-08
- Area: 言語のページの公開（`www/home.js` の `wldHidden`／`wldPubGot`、
  `www/net.js` の `netLangPublic`／`netLangsDown`／~~`netLangBack`~~、
  `supabase/schema.sql` の `language.published_at`）
- Decision:

  ```
  端末に hide の存在があるわけないやろ。全部オンラインだって言ってるけど
  ```

  - 答えは **`language.published_at` 一つ**。端末は意見を持たない
  - `wld` スライスの `hide` は**読まない・書かない**。既に入っている値は
    消しも書き換えもしない（過去のデータは触らない）
  - スイッチは `netLangPublic()` を呼ぶだけ。**答えが返ってから**画面が
    変わる（先に変えて後から送る、はしない）
  - 「まだ聞いていない」は第三の状態で、**画面には出さない**。行が降りて
    くるまで「この言語について」もプロフィールの言語の行も開かない
    （r6-prof の「揃ってから開く」に乗る）
- Reason: 実機 143 の「非公開にしていたのに、ログアウト→ログインで公開に
  戻る」。答えが二か所にあり、画面が読むのは端末側の `hide` だった。
  スライスはメモリにしか無い（規則 22）ので、起動しなおした端末は「まだ
  聞いていない」を「公開」と答えていた ──「無い」と「公開」が同じ枝。
- Affected features: 言語のページの公開／非公開、人の言語のページ
- Affected data: `wld` スライスの `hide` は**読まれなくなった。消していない**。
  新しく保存されるものは無い
- Affected docs: `docs/CHANGELOG.md`（2026-09-08）、`docs/BACKLOG.md`（「二か所
  にある」の項を削除）、`CLAUDE.md`（リーダーが書く）
- Implementation status: IMPLEMENTED、`tools/again-check.mjs` 三本＋
  `tools/world-check.mjs`／`tools/acct-check.mjs` 60。実機未確認

  **既定は「公開」のまま**、これは 2026-08-25 の決めごと（`hide` が無ければ
  公開）です。端末が起動ごとに「公開」を送っていたのがそれを保っていたので、
  送るのをやめた今は `netLangRow()` が行を作るときに `published_at` を入れて
  います。`supabase/schema.sql` の列の既定にしなかったのは、`npm run rls` の
  六本が「日付を入れずに入れた行は非公開」の上に立っているからです。

### 段はサーバーが決め、購入は買ったアカウントに束縛される
- Date: 2026-09-06
- Area: 課金（`plan` 表、`purchase` 表、`LinguaStore.swift`、`www/store.js`、
  `www/net.js`）
- Decision:

  ```
  アカウントごとなんだから、違うアカウントで復元できるのおかしいだろ。検証して
  ```

  そして 2026-09-03 の「だから端末でやるわけねえだろ」。

  - 段（plus/pro）は **Lingua のアカウント**のもので、買った時にサインインして
    いたアカウントに束縛される
  - **別のアカウントでサインインして「購入を復元」しても付かない**
  - 段を決めるのは**サーバー**。端末が言った値を書き留める形は終わり
  - 変わらないこと：段は「できること」だけを決め、誰の言語の 1 バイトにも触らない
- Reason: `schema.sql` 自身が書いていた ──「anybody who can send this database
  a request can set their OWN plan to 'pro'」。行を書くのは電話で、電話はその人。
- Affected features: 買う・復元する・失効する。`CAN` が閉める全部
- Affected data: `purchase` 表が増える（取引が誰のものか）。`plan` 表を書くのが
  service role だけになる。~~`SET.planPend`~~ が消える。**人が作ったものは動かない**
- Affected docs: `docs/PAID_FEATURES.md`（先頭に節）、`docs/FEATURES.md` § 1、
  `docs/apple.md`、`docs/STATE.md`、`supabase/setup.md` § 8b、
  `docs/CHANGELOG.md` ── 同じコミットで書き換えた
- Implementation status: **入りました。**`supabase/functions/verify-plan` が
  x5c の鎖を Apple の根まで辿り、`appAccountToken` で束縛し、段を書きます。
  `tools/verify-check.mjs`（自作の鎖で署名した取引を通す）、`npm run rls`、
  `plan-check` が持ちます。**実機未確認** ── 買う／同じアカウントで復元して
  付く／別のアカウントで復元して付かない、の三つ。**オーナーの側**に函数の
  deploy と `APPLE_ROOT_CA_G3` が残っています（`supabase/setup.md` § 8b）。

  この決定は、2026-09-02 の「段は絶対に下げない」の**理由**を置き換えます。
  下げなかったのは端末が段を決めていたからで、端末の `free` は「持っていない」
  と「読めなかった」の両方でした。サーバーの `free` は前者だけを意味します。
  届かなかった答えが何も書かないことは変わりません。

### 通信が落ちたら何も進まない。ポップは一つ
- Date: 2026-09-05
- Area: サーバーへ行く四箇所ぜんぶ（起動・引っ張って更新・保存/削除・サーバーに
  しか無いものを取りに行く画面）。`www/net.js` の `netPop()`
- Decision:

  ```
  通信エラーなら進むわけねえだろ全部

  そもそも通信は最初に一回とかプルトゥーリフレッシュした時でしょ？
  保存とか違う画面いく時にエラーが起きたらその画面表示ってわかる？

  そもそも通信エラーならそこにはいけないはずでしょ。
  途中でエラーになった場合は全部ポップで良くない？
  いちいち直書きするからまた面倒なんだろエラーになったらエラー用のポップ出して再更新とかおさせればいいやんそれだけで1個作れば全部に使えるやん
  ```

  OWNER 2026-09-05。

- Reason: **通信が落ちたら、何も進みません。**端末に何も書かない。画面を進め
  ない。ポップを出して、もう一度押させる。**種類ごとの例外はありません** ──
  保存も、削除も、画面へ入るのも、起動も、引っ張って更新も、全部これです。

  **そして入れ物は一つです。**「いちいち直書きするからまた面倒なんだろ」
  「1個作れば全部に使えるやん」。画面ごとに文を置く形は、この決定に
  置き換えられました。

- Affected features: 起動、引っ張って更新、保存、言語の削除、アカウントの削除
- Affected data: **増えません。**逆に減ります ── アカウント削除の印
  （`lingua.sess` の `end`）は、サーバーが答えてから書きます
- Affected docs: `CLAUDE.md`、`docs/CHANGELOG.md`、この log
- Implementation status: IMPLEMENTED（`netPop()` と四箇所の配線、削除の印）。
  **DEVICE CONFIRMED ではありません。**

### 【差し替え済み 2026-09-05】空と、届かなかったのを画面ごとに分ける形（2026-09-05 朝）
- 差し替えた決定: 「通信が落ちたら何も進まない。ポップは一つ」（2026-09-05）

### 半キーは新しく作れない ── 半分の枠は選べて、＋は下りる
- Date: 2026-09-05
- Area: キーボードの編集画面のシート（`www/keyboard.js`）
- Decision:

  ```
  半キーを追加できるのやめてほしい
  ```

  キーは一キーの幅で入り、半分の枠には入らない。半分の枠も押せば選ばれ（「全部の
  升、触ったら選択」2026-08-28）、選ばれている間は ＋ が下りる。**既にある半キーは
  動かない。** QWERTY の三段目を寄せる半キーは gap であってキーではなく、触らない。
- Reason: 半キーは誰も幅を選んでいないキー ── キーのページの幅は 1・2・3・4 で、
  半分を出したことが無い。
- Affected features: キーボードの編集画面
- Affected data: 無し。既にある半キーはそのまま
- Affected docs: この項、`CLAUDE.md` 規則 19、「全部の升、触ったら選択」の項、
  `docs/CHANGELOG.md`（2026-09-05）
- Implementation status: **IMPLEMENTED** ── `kbCellFits()`（`www/keyboard.js`）。

### 保存されないのは仕様。失敗して黙って消えるのは仕様ではない
- Date: 2026-09-05
- Area: 保存ぜんぶ（`www/core.js` の `save()`）。オンラインのアプリが何を
  約束するか
- Decision:

  ```
  Twitterとかは電波がないと開かないでしょ？
  そもそも通信してないならエラーで開けないし、保存するタイミングでエラーが起きるなら、保存されないし。そう言うもんじゃないの？オンラインアプリってどうなの？

  なら失敗して残るにするべき。

  スタンダードに合わせて作りたいから間違ってることあったら言って。
  ```

  OWNER 2026-09-05。

- Reason: **二つのことが決まっていて、混ぜてはいけません。**

  **一つ。「保存されない」は仕様です。**アプリが落ちて消えること、電波が
  無くて言語が開かないこと、送れていない分が次の起動まででなくなること ──
  **全部、仕様です。塞ぎません。**オーナーが自分で読んだうえで、オンラインの
  アプリとはそういうものだと言いました。**だからこれを「代償」「穴」「痛み」
  として書いてある文は、決まった以上ただの古い文です。**

  **二つ。「失敗して黙って消える」は仕様ではありません。**保存が失敗した
  とき、**人が作ったものは目の前に残ります。**もう一度押せば送れる状態で
  なければいけません。X で投稿が失敗したときと同じです ──「送れません
  でした」と出て、書いた文は箱に残る。**失敗して消えるのではなく、失敗して
  残る。**

- Affected features: 保存・同期。制作側の全画面
- Affected data: **変わりません。**失敗しても捨てないという決定なので、
  減るものはありません。
- Affected docs: `CLAUDE.md` 規則11・規則22 の「代償」の段落、
  `docs/DATA_SAFETY.md` の同じ段落 ── **同じ commit で消しました。**
  古い文を「これは歴史です」と断って残していません。
- Implementation status: **二つ目は入れました。**`saveTry()`（`www/core.js`）が
  この iPhone のディスクへの書き込みが届いたかを答える一箇所で、届かなければ
  `save.no`（「保存できませんでした」）と言います。空の catch が四つあった
  ものを一箇所にしています。**言語も単語も文字も、失敗した瞬間そのまま画面に
  残ります**（`LSL`・`WORDS`・`LETTERS` は触られません）。

  **サーバー側の失敗はまだ黙っています。**`netSlicePut()` の失敗の道は
  `www/net.js` で、このセッションの持ち場ではありません。**そこは残って
  います。**

  **止めるものはありません。**ディスクをいっぱいにする検査は門にありません。
  人が押して確かめる規則です。

### 【差し替え済み 2026-09-05】「保存されない」は仕様。オンラインのアプリとはそういうもの（2026-09-04）
- 差し替えた決定: 「保存されないのは仕様。失敗して黙って消えるのは仕様ではない」（2026-09-05）

### 【差し替え済み 2026-09-05】保存が失敗したら、人が作ったものは目の前に残る（2026-09-04）
- 差し替えた決定: 「保存されないのは仕様。失敗して黙って消えるのは仕様ではない」（2026-09-05）

### 電波が無いときは、前に読み込んだ分を出す。見るだけ
- Date: 2026-09-04
- Area: 電波が無いときの写し。`CLAUDE.md` 規則22

- Decision:

  ```
  前に読み込んだ分は出て欲しい。制作も眺めたい人はいるだろうし、
  ```

- Reason: **同じ日の「写しも別に今はいらなくない？」を、オーナー自身が一部
  差し替えました。**電波が無いとき、画面を真っ白にはしません。前に読み込んだ
  ものを出します。

  **見るだけです。作れません。保存できません。**「眺めたい人はいるだろう」が
  オーナーの言葉です。**編集と読み替えて広げないでください。**

  **この写しは絶対にサーバーへ戻りません。片道です。**理由は
  `docs/HANDOVER.md` 七章にあります ── `www/sync.js` の `syMerge()` は
  **壊れた写しでサーバーの正しいほうを上書きするバグ**です。読めない側を
  「無い」と同じに扱っています。**戻る道があるかぎり、同じ形の事故が起きます。**
  戻る道が無ければ、写しが壊れていても失われるのは写しだけです。
- Affected features: 制作側の全画面（電波が無いとき）
- Affected data: **増えます。**iPhone に読み取り専用の写しが載ります。
  **そこからサーバーへ戻る道はありません。**
- Affected docs: この項目、`CLAUDE.md` 冒頭の Online と規則22、
  `docs/DATA_SAFETY.md`、`docs/ARCHITECTURE.md`、`docs/EXPIRY.md`
- Implementation status: **入りました 2026-09-05。**`www/net.js` が画面だけの
  写しを一本持ちます。戻る道はありません。

### `ONE.md` を消す
- Date: 2026-09-04
- Area: 書いたもの（ONE.md ── 消しました）

- Decision:

  ```
  消していいよ
  ```

- Reason: **承認されなかった案です。**オンライン一本化はもう入っていて、そこに
  書いてあった設計は通っていません。**残しておくと、次に読む人が仕様として
  読みます。**
- Affected features: 無し
- Affected data: 無し
- Affected docs: 消した `ONE.md` 本体と、そこを指していた `docs/STATE.md`・
  `docs/FEATURE_RULES.md`・`docs/RECOVERY.md` の行。`tools/docs-baseline.txt`
- Implementation status: **入りました。**同じ日に消しました。

### オンラインを進める。パッチはオーナーが後で流す
- Date: 2026-09-04
- Area: オンライン一本化ぜんぶ。バッジ

- Decision:

  ```
  オンライン進めて。パッチは俺が後で流す
  ```

- Reason: **止めずに進める、という指示です。**サーバー側の一枚はオーナーが自分で
  流します。**アプリ側はそれを待ちません。**
- Affected features: オンライン一本化。バッジ
- Affected data: 無し
- Affected docs: この項目、`docs/STATE.md`
- Implementation status: オンライン一本化は入りました。**バッジはオーナーの
  SQL 待ちで、アプリ側から出来ることはありません。**

### 増えた文字は消してよい ── リリース前のあいだだけ
- Date: 2026-09-04
- Area: 文字（`www/letters.js`）。増殖した分の後始末

- Decision:

  ```
  だからリリース前の今は消していいから、描いてないからリリースしてから
  確認してくれ、データがないから
  ```

- Reason: **リリース前で、増えた文字には誰も何も描いていない。**だから
  消しても失われるものが無い。
- Affected features: 文字の増殖（`docs/HANDOVER.md` 六章の 0）の後始末。
  **`docs/DATA_SAFETY.md` の DELETE REVIEW は、この件については要らない。**
- Affected data: 増殖した文字。**中身は空 ── 誰も描いていない。**
- Affected docs: `docs/HANDOVER.md` 六章の 0 に書いた「勝手に消してはいけない」
  は取り消し。同じコミットで消した。
- Implementation status: 増殖そのものが未着手。
- **有効期限つきの決定です。**理由が「いまはデータが無いから」なので、
  **リリース後はこの決定は効きません。**そのときは人が描いた文字が混ざる
  ので、同じ消し方をしてはいけません。

### キーボードの編集画面、一番下の ＋ を外す
- Date: 2026-09-04
- Area: キーボードの編集（`www/keyboard.js`）

- Decision:

  ```
  キーボードのこの下の+もいらない。誤タッチが多いから
  ```

- Reason: **誤タッチ。**鍵盤のすぐ下、指が普通に触れる所に、行を足す
  ボタンが横いっぱいに置かれています（`docs/reports/2026-09-04-owner-shots/5-keyboard-plus.jpg`）。
- Affected features: キーボードの編集。行を足す道が一つ減ります ──
  **行を足す道が他にあるかどうかを確かめてから消してください。**
  一つしかないなら、それは「行を足せなくする」ことになります。
  その場合はオーナーに訊くこと。読み替えて別の場所に生やさないこと。
- Affected data: 無し。
- Affected docs: `CLAUDE.md` 規則19（キーボードの編集画面）に、この ＋ を
  説明した文があれば同じコミットで直す。`press` のボタン数が減ります ──
  減ったこと自体は正しい。
- Implementation status: **2026-09-23 に照合していない。**「着手していません」は `docs/HANDOVER.md` の
  日付の記録で、今のコードは確かめていない。

### 保存を押したときだけ、保存されているものが変わる
- Date: 2026-09-04
- Area: **保存されるものぜんぶ。**画面と、裏で走るものの両方
- Decision:

  ```
  推測も含めて入れるでしょ。そのあと変更したら変更が上書きされるだけで。
  消したのも変更じゃん？ってと思うけどどうなん

  人が消したかどうかを判断するために保存ボタンを全部につけたかったのよ。
  戻したら変更がなかったことになるやん？
  保存した状態から保存されてないのに消える、これはバグってわかるように
  ってイメージ持ってた
  ```

- Reason: **保存されているものが変わる理由は一つだけ ── 人が保存を押したから。**
  それ以外で変わっていたら、それはバグです。**押していないのに変わったかどうかで
  バグが見分けられる**、というのがこの決まりの目的で、保存ボタンを全部の画面に
  付けたかったのもそのためです。

  **裏で走るものが、保存されている値を書き換えてはいけません。**起動時の移行も、
  同期も、推測も。**最初の値として入れるのは別**です ── 単語ができた瞬間に
  推測の発音が入るのは、作ったことの一部で、あとからの書き換えではありません。

  **この決まりは、いまのバグを「発音の話」ではなくします。**「保存を押していない
  のに保存されているものが変わった」という**一つの形**になり、他の画面でも同じ
  物差しで探せます。
- Affected features: **画面ぜんぶ。**さしあたり:
  - 単語シートで意味だけ直して保存を押すと、**画面に出ていない発音が消える**
    （`www/wordsheet.js` の `wdWrite()` の `delete w.ph;`）── **バグ。直す。**
  - 発音を空にしても、次の起動で推測が書き戻される ── **バグ。**誰も押していない
  - **保存ボタンが全部の画面に付いているかは未確認。**ビルドのあとに洗い出す
- Affected data: 無し。**書き換えが減る方向**にしか動きません
- Affected docs: この項目、`docs/DATA_SAFETY.md`、`docs/CHANGELOG.md`
- Implementation status: **一行だけ配布済み**（`delete w.ph;` を消す、`claude/pop2`）。
  **残りはビルドのあとに洗い出す。**

  **CLAUDE.md の Data が元から同じことを言っています** ── 人が作ったものは、
  いまの形が要らないからといって消さない。この決定はそれに**見分け方**を足した
  ものです。

  **そして、押す場所が無ければこの決まりは成り立ちません。**

  ```
  制作はユーザーが保存したかどうかが争点になるよね？だから今これも
  一本化されてないよね？例えば保存とか追加なくて変更できたり、
  そうするとバグの時との差分がわからなくなる。
  ユーザーが意図して保存を押したその状態が記録されていることが重要なのでは？
  ```

  OWNER 2026-09-04。**打つそばから書き込む画面には、人が「これでいい」と決めた
  瞬間がありません。**記録されているのは、ただ最後に打った文字です。そうなると
  「これは人がやったのか、アプリが勝手にやったのか」を分ける手がかりが無くなり、
  **バグとの差分が分からなくなります。**

  **どの画面に保存があって、どの画面に無いのかは、まだ数えていません。**
  読んで当てるのは推測なので、**数えてから**オーナーが決めます。
  **ビルドのあとの洗い出しで数えます** ──「これも6以降の次の調査でやって欲しい」
  OWNER 2026-09-04。コードは一行も変えず、「この画面は保存を押して書く」
  「この画面は打つそばから書く」を全部並べた表を作り、それを見てオーナーが
  決めます。**どこをどう変えるかはこの項目に書きません。オーナーのものです。**

### 同期でぶつかったら、後から「直した」ほうが残るべき。いまは後から「繋がった」ほうが残る
- Date: 2026-09-04
- Area: 二台以上で同じアカウントを使っているときの同期（`www/sync.js`）
- Decision:

  ```
  普通後から変えたほうになる？アプリ気になるそこ
  ```

- Reason: **オーナーの読みが正しく、いまのアプリはそうなっていません。**

  同じ欄を二台で別々に直したとき、いま残るのは**後から繋がった**ほうの値です。
  **いつ直したかは見ていません。**

  ```
  10:00  A で名前を「あ」に直す
  09:00  B で名前を「い」に直す   ← こちらが古い
  11:00  B が先に繋がる → サーバーは「い」
  11:05  A が繋がる     → サーバーは「あ」
  ```

  順番が逆なら、**古いほうの「い」が残ります。**偶然でしか正しくなりません。

  **原因は、直した時刻がどこにも書かれていないことです。**比べるものが無いので
  繋いだ順で決まります。当たるのは「一つしか入らない欄」だけで、単語や文字の
  一覧は両方足されるため消えません。

  **これは `docs/EXPIRY.md` 10番が「仕様どおり」と書いていたものです。**
  `www/sync.js` の冒頭と `docs/DATA_SAFETY.md` に「値のぶつかりは iPhone の側を
  返す」と明記されていますが、**オーナーはその仕様を今日いま見直しました。**
- Affected features: 同期（`www/sync.js`）
- Affected data: **増えます。**直した時刻を持つ必要があります。**どの粒度で
  持つか（欄ごとか、スライスごとか）は決まっていません。**
- Affected docs: この項目、`docs/EXPIRY.md` 10番、`docs/DATA_SAFETY.md`、
  `www/sync.js` の冒頭
- Implementation status: **実装（2026-09-23、`claude/r60-up`）。実機未確認。**
  書き込みは人が直した時刻を持って行き、サーバーは新しい時にだけ受け取る
  （`supabase/schema.sql` § `keep_newer`、`www/sync.js` § `syMerge`）。
  **粒度はオーナーが決めていない。**r60 は「一度に送る単位ごと」に置いた ──
  言語は欄（スライス）ごと、設定は項目ごと、プロフィールは欄ごと、下書きは
  一つごと。オーナーの確認待ち。

### バックアップの三世代は、そのまま。入っているのは制作の分だけ
- Date: 2026-09-04
- Area: `ios/App/App/LinguaShare.swift`（~~`keep()`~~）、`www/backup.js`（~~`bkPack()`~~）
- Decision:

  ```
  3つでいいよ
  ```

- Reason: 言語が変わるたびにファイルが一つ書かれ、常に三つ持ち、四つ目を書く
  ときに一番古いものが消えます。**三回さかのぼれるのが限界です。**書き出しが
  壊れても一つ前が無事なら戻せる、というのがこの仕組みで、その代償です。
  **そのままでよい、というのがオーナーの答えです。**

  **入っているのは制作の分だけです** ── 開いている言語まるごと（単語、文字、
  書記体系、音、キーボード、文法、メモ、世界設定）、**一言語ぶんで一ファイル。**
  **SNS の分は入っていません**（投稿、下書き、プロフィール、フォロー）。
  それはサーバーが持ちます。
- Affected features: 無し
- Affected data: 無し
- Affected docs: この項目、`docs/EXPIRY.md` 2番
- Implementation status: 何もしません

### 版は部分ごと。戻すのは丸ごと。戻す画面は見せない。縮む書き込みの守りは外す
- Date: 2026-09-04
- Area: 「消えないための仕組みを一本にする」の中身
- Decision:

  ```
  部分ごとでいいよ

  設計を通すってなに？
  見せないでしょ
  丸ごとで
  外す
  ビルド前に潰す
  ```

- Reason: **「設計を通す」はリーダーの言葉が悪く、「コードを書き始めていいか」
  という意味でした。**オーナーは既に一つずつ全部答えているので、**設計は
  通っています。書き始めます。**

  **版は部分ごと。**単語・文字・音といった、いまの保存の単位のまま積みます。
  一回ぶんは 12 KB 〜 685 KB。**言語まるごと（毎回 685 KB）より軽く、
  一語ごと（0.14 KB）はアプリのほぼ全部を書き直すことになるので取りません。**

  **戻すのは丸ごと。**「単語だけ三日前に戻す」はできるようにしません。
  単語が文字を指していたりするので、部分だけ戻すと辻褄が合わなくなります。
  **細かく戻したい場面が実際に出てから足します。**

  **戻す画面は人に見せません。**運営だけがやります。**リリース前に画面を
  増やさずに済みます。あとから足せます。**

  **「小さくなったら書かない」守りは外します。**いまは、書き込んだ結果が
  いまより小さくなるとサーバーに書きません。**版が積まれるようになれば
  前の版が残るので取り返せます。**外すのは**版が積まれるようになってから**
  ── 先に外すと、いまは取り返せません。

  **小さい二つはビルド前に潰します。**検索の履歴が同じ言葉を再検索したとき
  黙って一つ減ることがある件と、同じ言語が一覧に二つ並ぶことがある件。
- Affected features: 保存・同期・復元・運営側の復旧
- Affected data: 版が積まれる。部分ごと、一回 12 KB 〜 685 KB
- Affected docs: この項目、`docs/STATE.md` § 4a、`docs/DATA_SAFETY.md`
- Implementation status: **書き始めてよい。**`claude/one` の設計に沿って

### 文字数は無料 140・plus から無限。超えて押したら課金のポップ。長い投稿は「もっと読む」
- Date: 2026-09-15（夜、タグの決定の続き）
- Area: 投稿の文字数（`www/post.js` § POST_MAX・pwCapStop、`www/core.js` §
  postCap）、投稿の頭の `@`、タイムラインの畳み（§ POST_FOLD）
- Decision（オーナーの言葉そのまま。全文は `docs/scope/r39-tags.md`）:

  ```
  文字数上限減らさない？280多くね？
  タグ上限どのくらいがいいかな
  140にしようか。
  文字数制限つけても翻訳でアホみたいに文字書けばいいわけでしょ？それに困るのよ
  輪を二つ並べるのは？
  左側本文の輪右が翻訳の輪みたいな
  plusプランから無限だけど、もっと読むで開くTwitterと同じ方式で頼む。
  そうしたら、文字数上限突破してツイートしようとしたらポップだそう。
  いつもの課金誘導ポップ出して文字数を適正な数にしないとツイートできないでポップ出るようにしない？
  @はリプライだけ青でよくね？
  だってその人のプロフィールにはアイコンタップで飛べるんだよ？
  リプライした先はアイコンがないから@〇〇で飛べるようにしたいのよ
  無料の人は編集できませんこれもプラスから
  昔の投稿は加味しなくていい。俺しかいじってない
  ```

  - **無料は 140。本文と意味の両方**が同じ一つの数（`POST_MAX`）。
    **plus 以上は無限**（`postCap()`、`wordCap()` と同じ形。**capability は
    足しません** ── 誰でも投稿はでき、段が変えるのは数だけなので）。
  - **欄に `maxlength` は付けません。**超えて打てて、**押した時に断ります** ──
    `popAsk(t('up.need'), function(){ go('plans'); })`。二本目の言語・100 個目の
    単語・五枚目のキーボード・編集の鉛筆と**同じ一つの文、同じ形**。
  - **輪は二つ**（左が本文、右が意味）。超えるとマイナスの数字が出て赤。
    **無限の段では輪も無し**（数える天井が無いので描く物が無い）。お題の意味は
    `readonly` なので輪は付きません。
  - **タグは 20 字 × 4**（`TAG_LEN`。十言語のお題の札で一番長いのが 14 字）。
  - **長い投稿はタイムラインで畳み、「もっと読む」でその場で開く。**開いて
    いる間は「たたむ」で元に戻せます ── 一つの状態を一つの関数が反転する
    だけです（`postUnfold()`。**スレッドへ飛ぶ形ではありません** ── 行った先は
    取り消せないので、「もっと読むで開いたら折り畳まないとダメでは？」
    OWNER 2026-09-15 で変わりました）。
  - **畳むのは 5 行**。「5で」 OWNER 2026-09-16 ── 3／5／8 の写真を見て
    選びました。`POST_FOLD` 一箇所。
  - **投稿の頭の `@handle` は素の文字**。すぐ左のアイコンがその人への扉
    （`postAvHTML()`）なので、@ は二本目の扉でした。**「@〇〇 への返信」の @ と、
    人が文の中に打った `@aya` は青のまま** ── どちらも隣にアイコンがありません。
  - **編集は天井に当たりません**（`CAN.edit='plus'`＝編集できる人は無限の人）。
  - **前からある長い投稿は一文字も切りません。**天井は「これから書く物」だけ。
- Reason: 上の言葉。280 は Twitter の形を借りただけの数で、**意味の欄には
  上限が一つもありませんでした**（`maxlength` も無く `pwSetMn()` にも無い）──
  本文だけ絞っても下の行に全部書けるので、天井として成立していませんでした。
  そして `maxlength` が付いている限り**超えた状態になれない**ので、押した時の
  ポップは一生出ない枝になります。だから属性を外して断りを押した時に移しました。
- Affected features: ⑯ SNS、投稿、プラン（`docs/FEATURES.md`）
- Affected data: **保存されるものは増えも減りもしません。**天井は画面の話で、
  投稿の形は変わりません。過去の投稿は書き換えません。
- Affected docs: この項目、`docs/CHANGELOG.md` 2026-09-15、`docs/FEATURES.md`、
  `docs/PAID_FEATURES.md`、`docs/CHECK-0907.md`「ビルド 161」
- Implementation status: IMPLEMENTED（`claude/r39-tags`、**実機未確認**）。
  押さえるのは `post-check` 26・27・28。畳む行数は 5 で決まりました
  （写真 `shots/r39-fold-5-ja.png`、開いた状態は `shots/r39-fold-open-ja.png`）。

### 【差し替え済み 2026-09-15】お題のタグは、お題そのものが持っている十言語から出す（2026-09-04）
- 差し替えた決定: 「タグは別の枠。本文の外、翻訳の下、最大 4 つ」（2026-09-15）

### 頼まれていないものを、アプリが書き込まない。**発音は別 ── あれは頼まれている**
- Date: 2026-09-04
- Area: 文法の語順の既定値、およびオーナーが頼んでいない既定値ぜんぶ
- Decision:

  ```
  3は意味がわからないですけど
  普通にアプリが入れる仕様なんて誰も頼んでないけど

  発音は頼んだけど他は頼んでないよね？
  だから確認しろって言うルールなんだけど、それ守ってないからこうなるんじゃないの？
  ```

- Reason: **文法の語順を一度も触っていない言語に、移行が既定の値を書き込んで
  います。誰も頼んでいません。**書かないでください。触っていない欄は空のまま。

  **発音の推測は違います。オーナーが頼んでいます** ──「推測も含めて入れる
  でしょ」（この log の上の項目、2026-09-04）。**あれはそのまま生きています。
  取り消していません。**

  **リーダーの誤りを記録しておきます。**私は最初この項目を「アプリは人が
  打っていない値を書き込まない」という**一般の規則**として書き、**発音の決定に
  差し替えの印を付けようとしました。**オーナーが頼んだものを、頼まれていない
  ものと同じ箱に入れたわけです。**CLAUDE.md が名指しで禁じている形です** ──
  「決定を、より筋の通った規則に読み替えたり、近くのものに広げたりしない」。

  **確かめずに広げたのが原因です。**オーナーの言葉:「だから確認しろって言う
  ルールなんだけど、それ守ってないからこうなるんじゃないの？」
- Affected features: 文法の語順の既定値。**発音は変えません**
- Affected data: 文法の語順を触っていない人の欄が、空のままになります
- Affected docs: この項目、`docs/EXPIRY.md` 4番
- Implementation status: **一部。**押していないのに書く道が残っている ── 起動・移行・描画から書く所は
  `docs/scope/r73-audit.md` § 2-2 が測った一覧。

### バックアップのファイルも無くす。★の51件目は一番古いのを押し出す
- Date: 2026-09-04
- Area: `www/backup.js`（第24章）、`ios/App/App/LinguaShare.swift` の ~~`keep()`~~/`kept()`、
  ~~`tools/backup-check.mjs`~~、設定→データの一覧。そして★を付けた検索
- Decision:

  ```
  古いのの押し出していいよ
  2バックアップファイルいらねえっていったよね？オンラインって言ったよね？
  ```

- Reason: **リーダーが古いものを引きずっていました。**「オンライン前提。写しも
  持たない」と決めたのに、**バックアップのファイルだけ「最後の一枚」として
  残す設計を書いていました。**オーナーに指摘されました。

  **ファイルの仕事は、もうありません。**あれは「サーバーにも iPhone にも
  何も無くなったとき」の備えでした。**サーバーが唯一の本物になり、その
  サーバーがバックアップされるなら、その場合は運営側が戻します。**
  **二つ持てば、また二本になります** ── それがこの一連の話で消そうとして
  いるものそのものです。

  **★の51件目は、一番古いのを押し出します。**上限50はそのまま
  （OWNER 2026-09-04「50でいいよ。それ以上は増えないで」）。断らずに押し出す。
- Affected features: ㉔ バックアップ ── **章ごと無くなります**
- Affected data: **減ります。**`Documents/Languages/` に書かれていたファイルと、
  その三世代。**サーバーのバックアップがそれを引き受けます。**
- Affected docs: この項目、`docs/DATA_SAFETY.md`、
  `CLAUDE.md` 規則11、`docs/STATE.md`、`supabase/setup.md`
- Implementation status: ファイルは **IMPLEMENTED**（消えた、2026-09-04、CLAUDE.md 規則 11）。★の
  51 件目は「★は50件まで」（下）が今の決定。

  **これで「消えないための仕組み」は一本になります** ── サーバーが本物、
  版を積む、サーバー自体がバックアップされる。**それだけです。**

  **`supabase/setup.md` のサーバーのバックアップが、いよいよ唯一の土台です。**
  そこが無ければ何も残りません。

### オンライン前提に切り替える。保存を押した瞬間にサーバーへ行く
- Date: 2026-09-04
- Area: 保存・同期・オフライン。**制作側ぜんぶ**
- Decision:

  ```
  やっぱりここの穴埋めるためにも一旦オールサーバーのオンラインアプリに
  すべきでは？余裕が出たらオフライン対応にするのは？

  変更しよう。
  いやまだリリースしてないから、リリースする前にバグは潰したい。
  溜まってるのはないから別に消えてもいいからオンライン前提のアプリに切り替えよう。
  保存するたびにサーバーに飛ぶ感じ？
  ```

- Reason: **同じ日の「オフラインで作れるのは制作だけ」を、オーナー自身が
  差し替えました。**（下の項目は SUPERSEDED です。）

  **穴が塞がるのではなく、無くなります。**2026-09-04 に見つかった穴は全部
  「二箇所で別々に変わったとき、どっちが勝つか」の境目にありました。
  **書き込みが一箇所からしか来なければ、その問いが存在しません。**合わせる
  仕組み、直した時刻、番号の被り、狂った時計 ── 全部消えます。

  **「保存された」の意味が一つになります。**いままでは iPhone に書いて
  あとで送っていたので、「保存できた」と「サーバーに載った」がずれていました。
  **そのずれが穴でした。**押した瞬間にサーバーへ行けば、二つが同じ瞬間です。

  **一文字ごとには飛びません。保存を押したときだけです。**同じ日の
  「保存を押したときだけ、保存されているものが変わる」がここで噛み合います
  ── **保存ボタンが「サーバーに行く瞬間」そのものになります。**

  **繋がっていなければ保存できません。そう画面に出します。**黙って iPhone に
  溜めません。溜めた瞬間に、いま消そうとしている問題が戻ります。

  **書き込む写しは持ちません。**「写しも別に今はいらなくない？」の見るだけの
  写しの側は【差し替え済み 2026-09-04】── 差し替えた決定:「電波が無いときは、
  前に読み込んだ分を出す。見るだけ」（2026-09-04）。その写しに、サーバーへ戻る
  道はありません。iPhone の鍵のうち誰の物でもないのは `lingua.sess`（「この
  iPhone は誰か」）だけで、残りはどれもアカウントの物の写しです（CLAUDE.md 規則 22）。
- Affected features: 保存・同期・復元・運営側の復旧。制作側の全画面
- Affected data: **減ります。**合わせるために持っていた控え（最後に一致した
  写しなど）が要らなくなります。**まだリリースしていないので、いま iPhone に
  溜まっている未送信の変更はありません** ──「溜まってるのはないから別に消えて
  もいい」OWNER。**移行で拾う仕事はありません。**
- Affected docs: この項目、`docs/DATA_SAFETY.md`、
  `docs/ARCHITECTURE.md`、`CLAUDE.md` 規則22
- Implementation status: **設計中（`claude/one`）。**リリース前に潰す
  ──「まだリリースしてないから、リリースする前にバグは潰したい」

  **サーバーに版を積むこと自体は変わりません**（同じ日の決定）。
  **番号はサーバーが配ります。iPhone の時刻はもう要りません** ── 書き込みが
  一箇所からしか来ないので、順番はサーバーが受け取った順そのものです。
  **狂った時計の問題も消えます。**

### 【差し替え済み 2026-09-04】オフラインで作れるのは制作だけ。版はサーバーの番号、勝ち負けは iPhone の時刻（2026-09-04）
- 差し替えた決定: 「オンライン前提に切り替える。保存を押した瞬間にサーバーへ行く」（2026-09-04）

### 消えないための仕組みを一本にする。サーバーに版を積む
- Date: 2026-09-04
- Area: 保存・同期・バックアップ・復元・運営側の復旧。**全部**
- Decision:

  ```
  バックアップやデータが消えないのを全部一本化するべき
  今のなんかチグハグのやってもバグが増えるだけやろ

  （版を積むのはファイルかサーバーか、と訊かれて）
  ならそれでいこう。
  サーバーのバックアップも必要で。
  ```

- Reason: **いま「消えないため」の仕組みが九つあります。**サーバーの上書き、
  iPhone の写し、ファイル三世代、同期で合わせる所、縮む書き込みを断る所、
  復元が無いものだけ埋める所、壊れているかを見分ける所、運営側の復旧（案だけ）、
  サーバー自体のバックアップ（**入っているか不明**）。**どれも別の日に別の考えで
  足されていて、「どっちが勝つか」の答えが通る道ごとに違います。**

  2026-09-04 に見つかった二つの穴は、その境目でした ── **壊れた一本が無事な
  サーバーを上書きする**（読めない＝無い、として扱っている。CLAUDE.md が
  「『空』と『壊れている』は別の状態」と名指しで禁じている形）と、
  **保存の失敗が黙って済まされる**。**一つずつ塞ぐと境目が増えます。**

  **一本にする形:** 上書きをやめて、**サーバーに番号のついた版を積む。**
  消さない、書き換えない、足すだけ。そうすると「どっちが勝つか」は番号で
  決まり、「戻す」は「◯番に戻す」だけになり、壊れたものが上書きする事故が
  構造的に起きなくなります。**オーナーが既に決めた二つ ──「人が作ったものに
  期限は無い」（2026-09-24 に「3 つ前まで」で差し替え）「後から変えたほうが残る」
  ── を両方満たす形がこれです。**

  **積むのはサーバーです。ファイルではありません。**ファイルはその iPhone と
  一緒に無くなり、運営側から見えず、全部の版を置くには小さすぎます。
  **ファイルは三世代のまま、役割も変えません** ── サーバーにも iPhone の中にも
  何も無いときの最後の一枚。役割が違うので二本ではありません。

  **そしてサーバー自体のバックアップが要ります。**サーバーが全部を持つなら、
  土台がそれです。`supabase/setup.md` には**一言も書かれていません**（0 件）。
- Affected features: 保存・同期・バックアップ・復元・運営側の復旧
- Affected data: **増えます。**版が積まれる分。五千語の言語で保存一回 685 KB。
  **残すのは 3 つ前まで**（「3つ前、まるごと」2026-09-24）
- Affected docs: この項目、`docs/DATA_SAFETY.md`、`docs/RECOVERY.md`、
  `docs/EXPIRY.md`、`docs/ARCHITECTURE.md`、`supabase/setup.md`
- Implementation status: **設計から。`claude/one` がコードを一行も変えずに
  設計だけ書きます。**オーナーが読んで通してから、初めて書き始めます。

  **それまで、穴を一つずつ塞ぐのは止めます** ── 壊れたものの上書きも、
  黙って失敗する保存も。**いま塞ぐと一本化のときにもう一度書き換えることに
  なるからです。**「直すじゃなくて書き換え」を、この章ぜんぶに当てます。

### ★は50件まで。それ以上は増やさない。一筆の160点は外す
- Date: 2026-09-04
- Area: ★を付けた検索（`www/sns.js`・`www/net.js`）と、文字を描く画面（`www/glyph.js`）
- Decision:

  ```
  50でいいよ。それ以上は増えないで
  160で止めないで
  ```

- Reason: `docs/EXPIRY.md` の 5番と 7番への答えです。

  **★は50件が上限で、そこは変えません。**いま起きているのは、50件より多く
  ★を付けている人が起動すると**この iPhone の一覧が新しい50件で置き換わり、
  51件目より古いものへ行く道が無くなる**ことです。サーバーの行は消えません。
  **上限が50でよい以上、51件目を付けたときに何が起きるかだけが残ります**
  ── いまは黙って押し出されます。

  **一筆の160点は外します。**文字を描いていて一本の線が160点を超えると、
  そこから先の点が捨てられていました。**この数は誰も決めていません**
  ── コードに書いてあるだけで、コメントは「実際のどの線よりも高い数」と
  言っていました。長い一筆を引く人だけが当たります。
- Affected features: 検索（★）、文字を描く画面
- Affected data: **一筆の点。**外すと、いままで途中で捨てられていた点が
  残るようになります。既に描かれたものは変わりません
- Affected docs: この項目、`docs/EXPIRY.md`、`docs/CHANGELOG.md`
- Implementation status: 160 点は **IMPLEMENTED**（`www/glyph.js` に天井が無い）。★の 50 の天井は
  `www/sns.js`・`www/net.js`・`supabase/schema.sql` に見当たらない（2026-09-23、grep）── 未実装。

### バックアップの三世代と、元に戻せる段数は、いまのまま
- Date: 2026-09-04
- Area: `ios/App/App/LinguaShare.swift`（~~`keep()`~~）、`www/glyph.js`、`www/keyboard.js`
- Decision:

  ```
  元に戻すのもそれでいいよ
  ```

- Reason: 元に戻せる段数（描く画面60手・キーボード40手）は**画面を開いて
  いる間だけの一時的なもの**で、保存されているものは何も消えません。
  そのままでよい、というのがオーナーの答えです。

  バックアップの三世代についてはオーナーが「よくわからん」と言ったので、
  **説明をやり直して、改めて訊きます。**決まっていません。
- Affected features: 無し
- Affected data: 無し
- Affected docs: この項目、`docs/EXPIRY.md`
- Implementation status: 何もしません

### できないことは、有料と同じ画面に同じ形で出す。押したら有料へ
- Date: 2026-09-04
- Area: `can()` を呼んでいる所ぜんぶ。**キーボードだけの話ではありません**
- Decision:

  ```
  全部一緒
  有料から無料も同じ画面でタップしたら有料に行くように

  ？は一つでいいの説明
  ```

- Reason: `docs/HIDEFREE.md` に挙がった六件への答えです。**キーボードで決めた
  形を、そのまま全部に広げます** ── 一覧は有料と同じ形で並び、できないことも
  同じ見た目で在り、**押したときに有料へ行く。**

  いま起きているのはその逆です。**設定→データの「CSVの取り込み」が点線の箱**
  で並び、**リストの取り込みのボタンが「ファイルを選ぶアップグレード」と繋がって
  化け**、**自作文字のアップロードも同じ形**です。押せない物・壊れた文字を
  見せるのではなく、**ふつうに在って、押したら有料へ行く。**

  **`？` は説明を置いてよい唯一の場所です。**「？は一つでいいの説明」
  ── キーボードの `？` の中にある無料向けの二行は、そのままで正解です。
  画面に説明を書かない規則の例外がここで、CLAUDE.md が元からそう書いています。
- Affected features: `docs/HIDEFREE.md` の一〜三（四は既に直っていた、五は
  そのままでよい、六は規則に当たらない）
- Affected data: 無し。見た目と、押した先だけ
- Affected docs: この項目、`docs/HIDEFREE.md`、`docs/CHANGELOG.md`
- Implementation status: **未実装。**ビルドのあとに配ります

### 「端末」という言葉は禁じられていない
- Date: 2026-09-04
- Area: 画面に出る言葉ぜんぶ（`www/i18n/`）と、docs の書き方
- Decision:

  ```
  端末を禁止したことないけど
  ```

- Reason: **私（リーダー）が間違えて、禁じられていると報告しました。**
  CLAUDE.md が言っているのは **「端末ごと」という単位を作るな**という
  中身の話で（「端末ごとにやることなんてねえよ」OWNER 2026-09-03）、
  **言葉そのものは禁じていません。**`docs/FEATURE_RULES.md` 自身が何度も
  使っています。

  **「端末に適用」「この端末の中」はそのままで構いません。**
  `docs/HIDEFREE.md` の七番は取り下げです。
- Affected features: 無し
- Affected data: 無し
- Affected docs: `docs/HIDEFREE.md` の七番を取り下げに書き換えました。
  **私は「`docs/RECOVERY.md` にその語を禁じる行がある」と報告しましたが、
  そんな行はありません** ── あるコミットの題名を、文書の中身と読み違えた
  ものです。`docs/STATE.md` と `docs/HANDOVER.md` にあるのは
  **「端末ごとという単位を使わない」**で、これは正しいので残します。
- Implementation status: 何もしません

### 数は、出たあとに変わらない。サーバーに訊く前はロードを出す
- Date: 2026-09-04
- Area: **画面ぜんぶ。**とくにフォロー数・フォロワー数と、検索の画面
- Decision:

  ```
  気になったのは検索の時に検索してない時にずっとロードされてるのと、
  フォローとか0って出て1秒後に1とか数字が変わる。
  1秒後に変わるやつは本当に嫌だから、サーバーに聞く前にロード挟んで
  絶対に遅れて表示させることないように。
  ```

- Reason: **二つの逆向きの間違いが同時に起きています。**

  一つは、**まだ知らない数を 0 として出してしまう**こと。フォローが 0 と
  出て、一秒後に 1 に変わる。人はその 0 を読んでいるので、**app が嘘をついて
  から訂正した**ことになります。オーナーの言葉が一番はっきりしています ──
  「1秒後に変わるやつは本当に嫌だ」。

  もう一つは逆で、**何も待っていないのにロードを出しっぱなし**にしている
  こと。検索の画面で、何も検索していないのにずっと回っています。

  **どちらも「知らない」と「無い」を同じ顔で出したことから来ています。**
  正しくは三つの状態が別々の顔を持ちます ── **まだ訊いていない**（ロード）、
  **訊いて 0 だった**（0）、**訊く必要が無い**（何も出さない）。

  **これは一画面の直しではなく、全部に効く決まりです。**サーバーに訊いて
  出す数は、訊く前にロードを出す。**先に仮の数を出して、あとで差し替えては
  いけません。**
- Affected features: ⑯ SNS、プロフィール、検索。**サーバーの数を出す所ぜんぶ**
- Affected data: 無し。出し方だけ
- Affected docs: この項目、`docs/CHANGELOG.md`
- Implementation status: **未実装。**上限が戻ったらセッションに配る

### タグは別の枠。本文の外、翻訳の下、最大 4 つ
- Date: 2026-09-15（夜）
- Area: タグ（`www/sns.js` § A TAG IS NOT IN THE BODY ANY MORE）、投稿の作成と
  投稿の行（`www/post.js`）、検索（`www/net.js` § netFindPosts）
- Decision:

  ```
  #はべつで
  リプライトゥー@〇〇のサイズ感で翻訳の下で最大4つまで別枠で入れられるとかは？
  返信はok
  文字サイズはこのままでいい
  見た目見せて できたら投稿のとこ
  ```

  - 投稿を書く画面に、**本文とは別のタグの欄**。**最大 4 つ**。一つの欄に
    一つのタグで、打った数より一つ多く出て四つで止まる ── **五つ目を断る文は
    無く、入れ物が増えないだけ**（`CLAUDE.md` § Explaining）。
  - **`#` は打っても打たなくても同じ**。貯めるのは `#` 無しの一つの綴りで、
    `#` は欄の外に印として出る。小文字にしない ── 綴りはその人の物。
  - **本文に `#` を打ってもそれは本文**。青くならず、タグにもならない。
  - 投稿・スレッド・返信では、**翻訳（意味の行）の下**に横一行。字の大きさは
    **「@〇〇 への返信」の行と同じ**（`index.html` の `.pto` と同じ .84rem）。
    **本文の字は変えない**。押すとそのタグの検索。タグ 0 ならその行は無い。
  - 投稿の頭の 表示名 @handle は**そのまま**。
- Reason: **2026-09-04 の「タグは本文中に。」を差し替えます。**あの日の決定の
  うち**今も生きているのは二つ**で、この項目がそれを引き継ぎます ──
  **綴りは一つ**（`DAY_TAG`。十に割れると文字合わせの検索が一生出会わない）と、
  **青くて、押すとそのタグの検索になり、前の日の投稿も出る**。差し替わったのは
  **どこに入るか**だけです。

  本文の文字だったので、タグは人が書いた文の中に混ざり、輪がアプリの言葉まで
  数えていました。お題の札はアプリが入れた物なのに、その人の持ち分から
  引かれていた、ということです（上限そのものは同じ日に下の項目で変わりました）。

  **保存は一つの綴り・見せるのは読む人の表示言語**（2026-09-08）はそのまま
  です。枠の中の一語についても同じ `dayTagShow()`／`dayTagStore()` が答えます
  ── 二つ目の仕組みは作りません。
- Affected features: ⑯ SNS、お題、検索、下書き（`docs/FEATURES.md`）
- Affected data: **`post.body.tags` が新しく貯まります**（配列・最大 4・`#`
  無し）。下書き（`draft.body.tags`）も同じ形。`supabase/schema.sql` は
  変えません ── `body` は jsonb。**前からある投稿は書き換えません** ── 本文の
  中に `#〜` がある投稿はそのままで、描くときも今までどおり青い
  （`tagHTML()` は残す）。カードにタグは乗せません（決めていない物は足さない）。
- Affected docs: この項目（2026-09-04 の項目はここに畳みました）、
  `docs/CHANGELOG.md` 2026-09-15、`docs/FEATURES.md`、`docs/DATA_MODEL.md`、
  `docs/CHECK-0907.md`
- Implementation status: IMPLEMENTED（`claude/r39-tags`、**実機未確認**）。
  押さえるのは `post-check` 24 ── 枠の中身が投稿に乗る／五つ目は乗らず五つ目の
  欄も無い／本文の `#` はタグに化けない／お題の札は枠の先頭で本文には入らない／
  行は翻訳の下で写真より上／タグ 0 の投稿は行が無い／検索は枠を `#` 無しで・
  本文を `#` 付きで訊く。赤は六つ見てから直しました。

### 【差し替え済み 2026-09-15】お題は #今日のお題。十言語ぶんで、どの言語で書かれていても同じ一つ（2026-09-04）
- 差し替えた決定: 「タグは別の枠。本文の外、翻訳の下、最大 4 つ」（2026-09-15）

### 【差し替え済み 2026-09-24】上限のポップは Pro を言う。Plus は飛ばす（2026-09-04）
- 差し替えた決定: 「上限に達した時の文 →『他に合わせて』」（2026-09-24 オーナーの答え）── 上限のポップは `up.need` 一つ

### ＋は右下。上限を越えて押したときにポップが出る。無料に空の枠は並べない
- Date: 2026-09-04
- Area: キーボードの章（`www/keyboard.js`、⑨）。**そして枠の考え方は全画面へ**
- Decision:

  ```
  ＋は右下につけて
  プラスは5個目以降
  無料は1個目以降
  ポップが出るように

  編集ボタンも無料はいらんやろ

  課金からフリーの隠すルールも全部に適応ささてね
  ```

- Reason: **2026-09-03 の「有料と同じ数の枠が並ぶ」は、これに差し替わりました。**
  そちらは無料の画面に **キーボード2・3・4 という空の行を三つ**並べていて、
  オーナーが実機で見つけました ──「無料なのにキーボード1〜4表示されてるのは
  なぜ？」。**持っていない物を三つ、在るように見せていた**わけで、しかも
  有料は作った数だけしか並ばない（~~`kbSlots()`~~ が `kbBoards().length`）ので、
  **一つしか持てない人が一番たくさんの行を見せられている**という逆さまの
  状態でした。「無料も有料も同じ画面」を直したはずが、無料だけ別の画面に
  なっていた。

  **同じなのは画面の形です** ── 一覧であること、**持っている数だけ行が並ぶ**
  こと、行がキーボードの絵と名前であること、下に「キーに文字を表示」がある
  こと、そして**右下に＋があること**。違うのは**＋を押したあとだけ**で、
  上限に届いていなければ追加、届いていればポップ。

- Affected features: ⑨ キーボード（`docs/FEATURES.md`）
- Affected data: **無し。**見た目と、＋を押したときにどこへ行くかだけ
- Affected docs: この項目、`docs/CHANGELOG.md`、`docs/keyboard.md`
- Implementation status: **2026-09-23 に照合していない。**名指していた ~~`kbSlots()`~~ と ~~`freeSlots`~~ は
  コードに無く、`kbSlotsShown()`（`www/keyboard.js`）がある。

  数は既に `www/core.js:791` に一つずつ在ります ── `FREE_KB=1`、~~`PLUS_KB=4`~~（2026-09-24 に消えた）、
  Pro は `kbCap()` で無制限。**新しい数を書かないこと。**

  **無料に編集は要りません。**無料の board 0 は QWERTY そのもので、
  編集する物がありません。開く矢印も編集ボタンも出さない。

  **そして最後の一行は、この画面だけの話ではありません** ──「課金からフリーの
  隠すルールも全部に適応ささてね」。**あるプランでできないことは、空の枠や
  灰色の行として見せるのではなく、出さない。**押した瞬間にポップで伝える。
  他の画面にも同じ形が残っていないか、`can()` を呼んでいる所を全部あたること。

### 上限のポップは、そこに出す。後ろの画面は閉じない、動かさない
- Date: 2026-09-04
- Area: 上限に当たったときのポップ（~~`capPop`~~ まわり）。呼ぶ側ぜんぶ
- Decision:

  ```
  全部1枚目みたいにポップ出して背景変えずに
  ```

- Reason: いま二通りある。**単語の作成のシートを開いたまま、その上にポップが
  出る**road と、**シートを先に閉じてから、下にあった画面の上にポップが出る**
  road。後者は、上限に当たっただけで書きかけの画面が消える。オーナーが選んだのは
  前者 ── ポップは今いる所に出て、後ろは何も変わらない。
- Affected features: 上限のポップを出す全部の口。**一箇所にする**（`docs/DUPLICATES.md` 7番）
- Affected data: 無し。見た目と、押した後どこに立っているかだけ
- Affected docs: `docs/DUPLICATES.md`、`docs/STATE.md`
- Implementation status: `claude/dup2` に配布ずみ

  **これは「後ろを閉じない」という一つの決まりで、ポップだけの話ではない。**
  ポップから「アップグレード」でプランへ行き、戻ってきたときに立っているのも、
  ポップを出したその画面である（`docs/DUPLICATES.md` 8番はこれで決まる）。

### 【差し替え済み 2026-09-24】人が作ったものに期限は無い。バグで消えた分はずっと戻せる（2026-09-04）
- 差し替えた決定: 「言語を前に戻す →『3つ前、まるごと』」（2026-09-24）── 戻せるのは 3 つ前まで

### 【差し替え済み 2026-09-04】無料でも有料と同じ数の枠が並ぶ。二つ目以降は押すとプランへ（2026-09-03）
- 差し替えた決定: 「＋は右下。上限を越えて押したときにポップが出る。無料に空の枠は並べない」（2026-09-04）

### 設定へ飛ぶボタンは手順 3 にだけ
- Date: 2026-09-06
- Area: `HELP.kb` ── キーボードを iOS で入れる手順（`www/keyboard.js`）
- Decision: 「手順 3 にだけ。」OWNER 2026-09-06（`www/keyboard.js` の手順の上の注に原文）。
  設定へ飛ぶボタンは手順 3 の中の一つだけ。手順 1 の道順は設定の一番上から書く。
- Reason: 同じボタンが二つの手順に在ると、どちらで押しても同じ所へ着き、手順の意味が消える。
- Affected features: `HELP.kb`
- Affected data: 無し
- Affected docs: この項、`docs/CHANGELOG.md`
- Implementation status: **IMPLEMENTED** ── `kbStepHTML(3, …)` だけが `kbSettings` を持つ。`kb-check` が持つ。

### 【差し替え済み 2026-09-06】設定へ飛ぶボタンを、手順 1 にも置く（2026-09-03）
- 差し替えた決定: 「設定へ飛ぶボタンは手順 3 にだけ」（2026-09-06、すぐ上）

### 買う画面には、そのプランが売っているものを全部書く
- Date: 2026-09-03
- Area: プランのカードの行（`PLANS` の `lines`、`www/core.js` と `www/i18n`）
- Decision:

  ```
  何で入ってないの？
  ```

  Pro の行に **「言語を三つ」と「ダウンロード三つ」**、Plus の行に
  **「ダウンロード一つ」**。`langCap()` と `dlCap()` が売っている数が、
  買う画面のどこにも書かれていなかった。

  **説明文にしない。名前で書く。**「アプリ内に説明書くの禁止」はそのまま。
- Reason: 上限は値段の一部で、書いていなければ売っていないのと同じ。
  Pro は言語 3 個と DL 3 個、Plus は DL 1 個を持つのに、五行のどれもそれを
  言っていなかった。監査 C（`docs/scope/aud-pay.md` の 49）が見つけた。
- Affected features: `PLANS`（`www/core.js`）に三行。`plan.plus.6`
  `plan.pro.6` `plan.pro.7` を十言語ぶん（`www/i18n/*.js`）。
  Plus の自作言語は Free と同じ 1 なので、Plus 側に言語の行は無い。
- Affected data: 無し。画面の文字だけ
- Affected docs: `docs/PAID_FEATURES.md`、`docs/CHANGELOG.md`
- Implementation status: **入っている**（2026-09-03、`claude/aud-pay`）。
  `npm run i18n` が持つ ── 十言語のどれかで鍵が欠けると、`keys:` と
  `the walk: fell back to English` の二行で落ちる（`ko` から
  `plan.pro.7` を抜いて赤を見た）。
  `planMark()`（`www/settings.js`）に三つの絵は無く、既定の ✓ が付く。
  あの表は `claude/plannow` のもので、絵を選ぶのはそちら。

### DM は作らない。メッセージは別のアプリになる
- Date: 2026-09-03
- Area: SNS の側
- Decision:

  ```
  6は今はいいかな。
  linguaを媒体としたメッセージ専門アプリを作りたいと思ってるから、
  ディスコードみたいな。それでDMはなしにしたいかなあ掲示板とかは今後あるかも。
  ```

  **この app に DM は作らない。**Lingua で書くメッセージは、別に立てる
  Discord のようなアプリの仕事にする。**掲示板は今後あるかもしれない**が、
  今は決まっていない。
- Reason: オーナーの言葉のまま上に。リーダーが「普通の SNS にあってこの app に
  無いもの」として六つ挙げ、そのうちの一つに対する答え。
- Affected features: 無し。**作らないという決定なので、実装するものが無い**
- Affected data: 無し
- Affected docs: この項、docs/FEATURES.md、docs/BACKLOG.md
- Implementation status: **実装するものが無い。**この項が全部

### 写真の代替テキストは作らない
- Date: 2026-09-03
- Area: 投稿の写真
- Decision:

  ```
  代替テキストはいらんかなー。見えない人はあんまり人工言語作らんやろ
  ```

  **写真に説明文を付ける欄は作らない。**`alt=""` のままにする。
- Reason: オーナーの言葉のまま上に。リーダーが「普通の SNS にあってこの app に
  無いもの」として挙げ、オーナーが要らないと決めた。
- Affected features: 無し
- Affected data: 無し
- Affected docs: この項、docs/FEATURES.md、docs/BACKLOG.md
- Implementation status: **実装するものが無い。**

  **一つだけ、決めた人が知っておくこと。**Apple の審査でアクセシビリティを
  見られる場合がある ── 落ちる保証も落ちない保証も無い。落ちたらそのときに
  作る、が今の姿。

### 平キーの道を消す。アプリは今の形だけを知っている
- Date: 2026-09-03
- Area: 保存の形式、起動時の移行
- Decision:

  ```
  もうデータ無くしていいまっさらな状態で完成させるから
  もうまっさら昔のいらない。今の状態の話平キーなんかいらない
  今の情報のコードに書き換えて
  ```

  **言語が一つしか持てなかった頃の鍵（`lingua.words` など八つ）を、アプリは
  もう読まない。**そこから写す道ごと消す。条件を足すのではなく、そのコードを
  消して今の形だけにする。

  消すもの:
  - ~~`langMigrate()`~~（`www/core.js`）── 平キーを読んで写す
  - ~~`LS_FLAT`~~（`www/core.js`）── 八つの鍵の表
  - ~~`langMigStamp()`~~ と `mig` の印 ── 写した言語にアカウントを押すためだけのもの
  - `lsWipeAcct()` の平キー削除 ── 消すものが無くなる
  - `tools/migrate-check.mjs` の平キーについての主張
- Reason: オーナーの言葉のまま上に。**リリース前で、平キーを持つ端末は
  オーナーの検証用の端末だけ。**そのデータは要らないと本人が決めた。
  残せば、読まれない道を検査が守り続けることになる。
- Affected features: 起動（`www/core.js` の頭）、~~`netRead()`~~（`www/net.js`、r79 で `sessRead()` と入れ物 `ACCT` に）
- Affected data: **消える道であって、消すデータではない。**

  **これは「移行は写して、読んだものを消さない」（docs/DATA_SAFETY.md）の
  例外ではない。**移行そのものを無くすので、写す元も写す先も無い。平キーを
  持つ端末では、その八つの鍵が **`localStorage` に残ったまま、誰にも読まれ
  なくなる** ── アプリが消すのではない。
- Affected docs: この項、docs/DATA_MODEL.md、docs/DATA_SAFETY.md、
  docs/CHANGELOG.md、CLAUDE.md 規則6
- Implementation status: **IMPLEMENTED** ── 平キーは読まず、写さず、消さない。`migrate-check` 8 が持つ。

### 消す行の真ん中は「この言語を削除」── 開いている言語一つの制作物が全部なくなる
- Date: 2026-09-03
- Area: 設定 → アカウントの、消す三行の真ん中
- Decision:

  ```
  この言語を削除で言語の制作のものは全部なくなるってずっと言ってんだろ
  ```

  消す行は三本 ── ログアウト、**この言語を削除**、アカウントを削除。真ん中は
  開いている言語一つの制作物を全部消す: サーバーのその言語の行（slice は
  カスケード）と、この端末のその言語の slice と索引の一行。他の言語・投稿・
  下書き・プロフィール・設定・アカウントは消えない。
- Reason: 端末だけ消すと次の `netLangsDown()` で戻ってくる。「消えたのに戻って
  くる」は消えていないのと同じ。
- Affected features: 設定 → アカウント（`wipeLangs()` / `wipeLangsGo()`、`www/settings.js`）
- Affected data: その言語の `language` 行と `slice` 行、端末のその言語の slice と
  `lingua.langs` の一行。DELETE REVIEW は `docs/CHANGELOG.md` 2026-09-03。
- Affected docs: `CLAUDE.md` 規則 6、この項、`docs/FEATURES.md` § 8
- Implementation status: **IMPLEMENTED** ── `wipeLangsGo()` が `netLangDrop()` の後に
  `wipeLangsHere()`。自分のでない言語では下りる（`langLocked()`）。

### 古い規則は残さない。全部いまの規則。食い違いはオーナーに訊く
- Date: 2026-09-03
- Area: 書かれたもの全部 ── CLAUDE.md と docs/ のすべて
- Decision:

  ```
  それで前よりバグ増えてるんだから前のルールは消せ全部今のルール。
  食い違いがあるなら俺に確認をしろ。
  ```

  1. **置き換えられた規則は消す。**「これは歴史です」と前置きして残さない。
     印を付けて本文を残すのも残したことになる。**消す。**
  2. **残っているのは、いま効いている規則だけ。**読んだ人がそのまま従って
     正しくなる状態にする。
  3. **食い違いを見つけたら、セッションもリーダーも決めない。オーナーに訊く。**
     どちらが正しそうか、という判断も含めて訊く。
- Reason: オーナーの言葉のまま上に。**理由は測られている** ── 2026-09-03、
  リーダーが置き換えられた 2026-08-28 の「ビルドが先、ゲートが後」を
  CLAUDE.md から読み上げ、その日の決定（「全部直してからビルドは見る」）と
  逆のことをオーナーに言った。**古い規則は変だと思われて疑われるが、残って
  いれば読まれる。**同じ日に、古い事実の記述（`netLike()` が `@` を落として
  いない）を読んで原因を二度誤り、間違った指示を担当に出した。
- Affected features: 無し。書かれたものだけ
- Affected data: 無し
- Affected docs: `CLAUDE.md`、`docs/` のすべて。**`docs/CHANGELOG.md` だけは
  例外で、書き換えない** ── その日に本当だったことの記録なので
- Implementation status: **2026-09-03 の監査 A〜D に渡した。**
  `claude/aud-claude` `claude/aud-data` `claude/aud-pay` `claude/aud-state`

  **この項自身が、この規則の対象です。**置き換えられた日には消してください。

### 保存していないまま画面を出ようとしたら、この app のポップで訊く
- Date: 2026-09-03
- Area: 保存ボタンのある画面すべて
- Decision:

  ```
  プロフィールも何か変えたら保存ボタン欲しい右上
  自分のポップで
  入力内容を保存しますか？はいいいえ
  ではいなら保存　いいえならそのまま戻るにしない？保存ボタン必要なとこ全部
  ```

  1. 【差し替え済み 2026-09-03】差し替えた決定: 「決定ボタンのルール ── なにもない時は
     薄い灰色、何か打ったら金」（2026-09-03）
  2. **保存せずに画面を出ようとしたら、この app 自身のポップが訊く** ──
     「入力内容を保存しますか？」はい／いいえ
  3. **はい → 保存して戻る。いいえ → 保存せずに戻る**
  4. **保存ボタンが要る画面すべてで同じ**
- Reason: オーナーの言葉のまま上に。「打った瞬間に保存」は、間違えて触った
  ものがそのまま残る形でもある。区切りを置いて、出るときに一度だけ訊く。
- Affected features: 保存ボタンのある画面すべて。**どの画面かはコードを読んで
  数え、オーナーに一覧を出して確かめる** ── ここで書き出すと、書き漏らした
  画面が「対象外」として読まれる
- Affected data: **無し。**打った内容が保存されるかどうかが変わるだけで、
  保存されるものの形は変わらない
- Affected docs: この項、docs/CHANGELOG.md

  **一つの仕組みで、画面ごとに書くものではない。**画面を出る道は `back()`
  （`www/shell.js`）一箇所で、左端のスワイプもそこを通る。**そこに置く。**
  画面ごとに「出るときに訊く」を書くと、書き忘れた画面が黙って捨てる。

  **`popAsk()` で訊く。**`confirm()` は禁止（2026-09-01、`es5-check` が持つ）。
  四つ目の訊き方を作らない。

  **「いいえ」は捨てるのであって、壊すのではない。**捨てられるのは打ちかけの
  ものだけで、保存済みのものは一バイトも動かない ── `docs/DATA_SAFETY.md`。
- Implementation status: **実装済み（`claude/keep`、2026-09-03）。CODE
  CONFIRMED、DEVICE 未確認。**

  **一つの仕組みです。**`KEEP`（`www/shell.js`）が打ちかけを画面ごとに憶え、
  訊くのは `back()` 一箇所（左端のスワイプは `swEnd()` がそこで終わるので
  同じ道）、ボタンを**作る**のは `navDo()` 一箇所、バーに**置く**のは
  `navTop()` 一箇所。画面が足すのは「開いたとき
  何が入っていたか」と「どう書くか」の二つだけで、**「出るときに訊く」を
  書いた画面は一つもありません。**

  **対象は打ち込みのある八画面** ── プロフィール、文字（名前とメモ）、
  世界の記事、記事の一節、キーボードの名前、文法の段（規則とメモ）、メモ、
  単語のシート。数え方と、外した画面とその理由は `docs/scope/claude-keep.md`。

  **「変えたか」は、画面を開いた瞬間の値と今の値を欄ごとに文字列で比べます。**
  打って消して元に戻したら変えていないので、ボタンも出ず、訊きもしません。
  欄が正規化するもの（@）は正規化した後で比べます。単語のシートだけは欄の
  集まりではないので、シートを一つの値にした署名を比べます ── `wEdit` は
  そのままで、書き写していません。

  **`popAsk()` に「いいえ」の行き先ができました。**これが「いいえ＝何かする」
  最初の問いです。ポップの✕と背景は今まで通り「答えていない」で、その場に
  留まります。**四つ目の訊き方は作っていません。**

  **振る舞いがオーナーの言葉の外で二つ変わりました**（`docs/CHANGELOG.md`）
  ── メモと単語のシートの保存が画面を閉じなくなったこと、文字の画面の保存が
  無料プランでも出るようになったこと。

  **@ が断られたら戻りません。**保存が効いたときだけ戻ります。14日の制限
  そのものは `supabase/schema.sql` の話で、この枝には入っていません。

  `tools/keep-check.mjs` に八画面×七つと仕組みの六つ。**八つのバグを戻して
  八回とも赤を見ました。**そのうち 2・3・8・14 は 2026-09-03 の「決定ボタンの
  ルール」で中身が変わり、ボタンの**色**を訊く形に書き換えてあります（下の項）。

### 決定ボタンのルール ── なにもない時は薄い灰色、何か打ったら金
- Date: 2026-09-03
- Area: 右上の決定ボタン（保存・投稿・追加・完了）がある画面すべて
- Decision:

  ```
  なにもない時は薄い灰色、何か打ったら金にする
  これが決定ボタンのルール。
  ```

  そして、そう言われた元:

  ```
  保存ボタンが光らないから押せるのかわからない
  くすんだ色から変更したら金になって押せるんじゃないの？
  何か入力したら金になってるボタンとなってないボタンがあるのよ
  同じボタンは共有して使用すればいいのに直書きで書いてるだろ
  だからこう言うことが起きてる
  ```

  1. **決定ボタンの状態は二つだけ。**変更が無い間は薄い灰色、何か打ったら金
  2. **変わるのは文字の色だけ。**角丸・枠・塗りは足さない（規則 18）
  3. **一箇所で作る。**画面が `<button class="navdo">` を書かない
- Reason: オーナーの言葉のまま上に。**原因はオーナーが言った通りでした** ──
  同じボタンが三通りに直書きされていて、そのうち一つ（文字を描く画面の保存）は
  `www/index.html` に規則が一行も無く、何を描いても灰色のままでした。**一つの
  ボタンを三回書けば三つのボタンで、規則が抜けるのはいつも誰も憶えていない
  三つ目です。**
- Affected features: 決定ボタンのある画面すべて。数えた結果は下の
  Implementation status
- Affected data: **無し。**押したときに何が書かれるかは一切変えていません
- Affected docs: この項、上の「保存していないまま画面を出ようとしたら」の 1、
  docs/CHANGELOG.md、`tools/keep-check.mjs`（前の決まりを文章で持っていた）
- Implementation status: **実装済み（`claude/navdo`、2026-09-03）。CODE
  CONFIRMED、DEVICE 未確認。**

  **数え直しました。**三通りの直書きは 23 箇所です ── `navdo` が 20
  （うち 4 は赤い削除）、`navq navdone` が 2（キーボードと文字の一覧）、
  `navq navsave` が 1（文字を描く画面の保存）。~~`.navsave`~~ は
  `www/index.html` に定義がありませんでした。

  **一箇所は `navDo()`（`www/shell.js`）です。**23 箇所すべてがそこを呼び、
  `www/*.js` に `class="navdo"` の直書きは一つも残っていません。削除は
  `navDel()` ── 決定ボタンではなく、赤は 2026-09-01 の別の決定です。

  **「何か打ったか」は画面が答えます。**書き込む中身を知っているのは画面
  だけなので、一箇所が持つのは「状態は二つ」と「色はどこから来るか」だけです。
  ── 打ちかけの欄は `KEEP`、文字を描く画面は開いた時の線と今の線
  （~~`geDirty()`~~）、投稿は `pwSend()` が断る条件そのもの（`pwOn()`）、
  単語の追加は `addOne()` が断る条件そのもの（`wdAddOn()`）。

  **打っている間は画面を描き直さないので、色は塗り直します**
  （`navDoPaint()`）── 描き直すと打っている欄からキーボードが落ちます。

  **`tools/keep-check.mjs` が打ち込みのある八画面で持っています。**「ボタンが
  在るか」を訊いていた三箇所は、前の決まり（変えていなければ出ない）を文章で
  書き留めたものでした。いまは**在ることと色の両方**を訊きます ── 開いた時に
  在って灰色、一打で金、打ったものを元に戻したらまた灰色。片方だけでは足りま
  せん。色だけなら**ボタンが消えた app が通り**、在ることだけなら**一度も光ら
  ない app が通ります**。後者がこの決定の元になった苦情そのものです。

  **三方向とも赤を見ました** ── 金にする側を壊して 9 件、灰色に戻す側を壊して
  16 件、そして**置き換えられた前の振る舞い（変えるまで出ない）を戻して 16
  件**。三つ目は、この検査がもう古い決まりを通さないことの確認です。

  **一つだけ、まだ常に金のものがあります。**言語の名前を変えるシートの保存
  です。その欄には `IN()` が付いておらず、打っている間に走るものが何もあり
  ません。付けるには `www/act-map.js` に名前が要り、そのファイルは
  `claude/navdo` の持ち物ではありません。**リーダーへ引き継ぎます。**

### @ は14日に一度しか変えられない
- Date: 2026-09-03
- Area: プロフィールの @（handle）
- Decision:

  ```
  ユーザーネームは14日に1度しか変更できないようにしたい
  ```

  **一度変えたら、次に変えられるのは14日後。**
- Reason: オーナーの言葉のまま上に。仕組みの側で分かっていること ── @ は
  人が人を呼ぶ名前で、他の人の投稿の中に凍って残る（`post.toh`、規則13）。
  取り替えが速いと、返信先の名前が誰を指しているか分からなくなる。
- Affected features: プロフィール編集（`meSetHandle()`、`www/me.js`）と、
  **`supabase/schema.sql` の `profile_rename()`**
- Affected data: **増える。**「最後に @ を変えた時刻」。`profile` に一列
- Affected docs: この項、docs/DATA_MODEL.md、docs/CHANGELOG.md

  **どこで止めるか。サーバーです。**「the app is a suggestion and the row
  level security in `schema.sql` is the whole of the security」 ── 画面だけで
  止めると、`/rest/v1/profile` を直に叩けば何度でも変えられる。
  `profile_rename()` が既に handle の UPDATE を見ている（lingua への／からの
  改名を断る）ので、**そこに入れる。二つ目のトリガーを作らない。**
  画面の側は、止まっていることと次にいつ変えられるかを出す ── 2026-08-22 の
  narrowing（アプリが取り去った状態には、原因と出口を最低限だけ書く）。

  **最初に @ を決めるのは「変更」ではない。**アカウントを作った直後、まだ
  一度も変えていない人が14日待たされるのは、この決定の言っていることでは
  ない。
- Implementation status: **IMPLEMENTED** ── `profile_rename()`（`supabase/schema.sql`）が `handle_at` から
  14 日の内を断る。実機未確認。

### キーの画面 ── もう一度触れば解除（2026-09-03、一部差し替え）
- Date: 2026-09-03
- Area: キーボードのキーに何を入れるかを選ぶ画面
- Decision:

  ```
  後選択してる紫はもう一度同じ場所触れたら解除して欲しい
  ```

  **選んでいるものをもう一度触ると解除される。**紫が消える
- 差し替えた部分: 「選ぶと右上に確定のボタンが出る」と「戻れば選択は消える」── 「キーの画面 ── 押した字がそのキーに入る。確定は無い」（2026-09-24）
- Affected features: キーの画面（`kbKeyHTML()` / `kbLtGrid()`、`www/keyboard.js`）
- Affected data: **無し。**

### 買うボタンを消したところには、今のプランと期限を出す
- Date: 2026-09-03
- Area: プランの画面
- Decision:

  ```
  消すなら同じ場所に現在このプランです〇〇/〇〇までみたいな感じにしないと
  わからんやろ
  ```

  今のプランと同じか、それより下の段が選ばれているとき、買うボタンは出ない
  （2026-09-03 の「そもそもプロなら課金自体ボタン押させないでいいでしょ」）。
  **その空いた場所に、今そのプランであることと、いつまでかを出す。**
  ボタンが消えるだけで何も出ないと、押すものが無い理由が画面から読めない。
- Reason: オーナーの言葉のまま上に。**説明文の禁止には当たらない** ── これは
  「アプリが何かを取り去った状態に、原因と出口が無い」場合に最低限の一文を
  書く、という 2026-08-22 の narrowing そのもの。凍結の画面と同じ形。
- Affected features: プランの画面（`vPlans`、`www/settings.js`）
- Affected data: **増える。**契約の期限。今は端末のどこにも無い ──
  `LinguaStore.swift` の `current` は `["plan": ...]` しか返していない。
  StoreKit の契約が持っているので、ネイティブ側から出すところから
- Affected docs: この項、docs/CHANGELOG.md、docs/DATA_MODEL.md
- Implementation status: **実装済み（CODE CONFIRMED）。**`claude/plannow`
  （2026-09-03）。`LinguaStore.current` が ~~`Transaction.expirationDate`~~ から
  `until` を返し、`www/store.js` の `STORE_UNTIL` が**答えた段と一緒に**
  セッションの間だけ持ち、`plNow()` が `.plgo` の中に一行を出す。
  **保存するものは増えていない。**`plan-check` に九本。
  **Swift はこの環境でコンパイルできないので DEVICE CONFIRMED ではない。**
  **`claude/rc` が同じ `LinguaStore.swift` を RevenueCat へ書き換えている** ──
  あちらは公開キー待ちで止まっているので、master が先に進み、rc が取り込む

### 検索の履歴は直近5件。人の丸い列は作らない。一件ずつ消せる
- Date: 2026-09-03
- Area: 検索の画面
- Decision:

  ```
  検索した履歴もユーザーはいらんから5個くらい検索履歴出るようにしたい
  1件づつ消せるでいいよ
  検索は🔍押したらって言ってるやん
  ```

  **履歴に入るのは 🔍 を押したときだけ。**打っている途中は入らない。
  `snsSetQ()` は一文字ごとに走るので、そこで記録すると「a」「ay」「aya」が
  三件残る ── 検索したのは押した一回で、三回ではない。**これは既にこの画面の
  決まりでもある**（2026-08-26 「ツイートの検索は検索ボタン押したら出てくる。
  それまでは人」）: 🔍 が「検索した」の意味を持つ場所で、打っている間は人を
  見ているだけ。二つの決まりが同じ方を向いている。

  **打った言葉を憶えて、検索の画面に直近 5 件を縦に並べる。**押すとその言葉で
  検索する。**丸いユーザーの列は作らない** ── オーナーが送ってきた TikTok の
  画面にはアイコンの横並びがあり、それは要らないと名指しされた。**一件ずつ
  消せる。**全部まとめて消すボタンは作らない。
- Reason: オーナーの言葉のまま上に。丸チップの横並びは CLAUDE.md § Shape が
  名指しで禁じている四つの一つでもあり、二つの理由が同じ方を向いている。
- Affected features: 検索の画面（`vExplore`）。**今ある「保存した検索」（星）の
  行は別物で、触らない** ── あれは絞り込みの行に出る、人が星を付けたもの。
  履歴は打った言葉で、星は選んだ言葉。二つの仕組みで、混ぜない
- Affected data: **増える。**打った言葉の履歴。**サーバーに置く** ──
  「NOTHING IS THE PHONE'S. EVERYTHING IS THE ACCOUNT'S.」なので、端末では
  なくアカウントのもの。`localStorage` はいつもどおり圏外で動く写し
- Affected docs: この項、docs/DATA_MODEL.md、docs/CHANGELOG.md、
  docs/FEATURES.md
- Implementation status: **IMPLEMENTED** ── `SNS_RECENT=5`（`www/sns.js`）、サーバーが本物で `SET.recent` は写し。

### シンプルに作る。バグが出たら、直すのではなくそのコードを書き換える
- Date: 2026-09-03
- Area: 作り方そのもの。全部の機能に対して。
- Decision:

  ```
  ルールとして決定してくれ。
  古いものは消す新しいものにする。
  シンプルに実装、コードを直してごちゃごちゃにするんじゃなくてそのシンプルの
  穴、足りない部分を修正。

  じゃないと、いつまで経ってもバカなバグが出てくるだろ
  ```

  三つあって、三つとも守る。

  **一つ、シンプルに作る。**一つのことは一つの仕組みで。同じ問いに答える場所を
  二つ作らない。

  **二つ、バグが出たら「修正」ではなく「書き換え」。**
  「直すじゃなくてシンプル実装→修正じゃなくてコードそのものの書き換え」OWNER
  2026-09-03。**言葉が二つあって、やることが違います。**

  - **修正** ── いまのコードを残したまま、足りないところに足す。条件を一つ
    増やす、二つ目の確認を入れる、例外を書く。**これは禁止です。**
  - **書き換え** ── そのコードを消して、正しい形で書き直す。行数が減ることが
    多い。

  訊く場所が間違っていたなら、**訊く場所そのものを書き換える** ── 訊き直す
  二つ目を足すのではなく。**新しい仕組みを足して古い仕組みの抜けを塞ぐのが、
  いちばんやってはいけないこと。**そこから先、その機能は二つの仕組みで動き、
  どちらが効いているか誰にも分からなくなる。

  **三つ、古いものは消す。**新しくしたら、古いほうは残さない。「歴史として」も
  「念のため」も無し。残っていれば読まれ、読まれれば従われる。

- 「これくらいの話もしてるんだけど」 OWNER 2026-09-03 ── 大きな設計の話では
  ありません。一行の条件を足そうとしたその瞬間の話です。

- Reason: 「いつまで経ってもバカなバグが出てくる」。実際そうなっている ──
  同じ日に、押させない仕組みが端末の写しを見ていたので、押した瞬間にもう一度
  Apple に訊く二つ目を足しかけた。訊く場所が間違っていただけで、答えは
  「画面が Apple に訊く」の一つだった。
- Affected features: 全部。
- Affected data: 無し。
- Affected docs: `CLAUDE.md` の頭 ── 同じコミットで書いた。
- Implementation status: **規則。止めるものはありません** ── 機械で読める形が
  無いので、人が読んで守る。

### 印の無い言語を拾うのは、オンボーディングの扉だけ
- Date: 2026-09-02
- Area: 言語とアカウントの結びつき（~~`langOwned()`~~ www/core.js、
  `netLangRow()` www/net.js の四つ目の状態）
- Decision:

  ```
  1アドレス1アカウント
  これは絶対課金もアカウントごと言語もそう
  ```

  言語はアカウントのものです。だから **`uid` の無い言語を「訊いた人のもの」と
  読んでよいのは、オンボーディングの扉だけ。**オンボーディングは口座ができる
  前に物を作る唯一の場所で、`obFinish()` が扉を出た瞬間にそれを上げます。
  それ以外の場所で印の無い言語を拾うのは、前の人のものを次の人に渡すこと。

- Reason: `netLangRow()` のコメントが自分で「THE FOURTH IS THE ONE THE OWNER
  HAS TO DECIDE」と書いて残していた四つ目の状態が、これです。A がこの端末で
  作って一度も上げていない言語が、B がサインインした瞬間に B のものになって
  いました ── 辞書も文字もキーボードも、B の一覧に B の言語として。何も
  throw しません。
- Affected features: 言語一覧（`vLangs`）、言語の上限（`langCount`）、
  キーボードのプール（`kbCount`）、DL の数（`dlCount`）、
  サーバーへの送信（`netLangRow`）
- Affected data: **保存するものは減りません。**印の無い言語は索引にも
  `lingua.<id>.*` にもバックアップにもそのまま残ります。変わるのは、それを
  作っていない人に差し出さなくなることだけ。そして 2026-09-02 から作られる
  言語には全部 `uid` が付くので、これが届く範囲は「今すでに端末にあって、
  一度も上がっていない言語」に限られ、増えません。
- Affected docs: `docs/DATA_MODEL.md`、`docs/DATA_SAFETY.md`、
  `www/core.js` の ~~`langOwned()`~~ のコメント（同じコミットで書き換え済み）
- Implementation status: **2026-09-23 に照合していない。**名指していた ~~`langOwned()`~~ はコードに無い。
  誰の言語かは今 `language.owner` を `langOwnOf()`（`www/core.js`）が読む（CLAUDE.md 規則 22）。

  未決が一つ、リーダーとオーナーへ: net.js の四つ目も閉じると、**今すでに
  端末にあって一度も上がっていない言語は、作った本人にも二度と戻りません。**
  いまはそれが唯一の帰り道です（`langMineIds()` は `langMine()` で歩くので
  印の無い言語も `netLangSync()` に乗り、`netLangRow()` が印を押す）。
  閉じるなら、その前に「本人が一度だけ引き取る」道が要るかどうかが決めごと。

### 端末のものは無い。全部アカウントのもの
- Date: 2026-09-03
- Area: `localStorage` に置く全部。`CLAUDE.md` § Online と § 規則22
- Decision:

  ```
  端末ごとにやることなんてねえよ
  アカウントごとってずっと言ってるよな？
  アカウントごとに言語情報も違うんだって
  ルールも書き換えてねえからそうなるんだろ
  ```

  **「端末のもの」という区分は無くなりました。**言語、投稿、下書き、
  プロフィール、段、保存した検索、通知をどこまで読んだか、**設定**、
  そのバックアップファイルと書き出したシート ── 全部、サインインした
  アカウントのものです。端末は写しを持つだけで、その写しは持ち主の名前の下に
  置かれます。

  `lingua.sess` だけが誰の持ち物でもありませんが、例外ではありません ──
  それは「この端末がどのアカウントか」そのものです。

- Reason: 2026-09-03 に、別のアカウントを消したらオーナーの言語が消えました。
  サーバーは正しく、消えたのは端末とバックアップです。`wipeHere()` が
  `lingua.` を全部消し、~~`bkDropAll()`~~ がバックアップを全部落とすからで、
  どちらも「端末は一人のもの」と書いてあった 2026-08-27 の姿のままでした。
  **規則に「端末のものは三つ」と書いてあったことが、その姿を正しく見せて
  いました。**規則を消さないと同じ形が出続けます。
- Affected features: 保存するもの全部。特にアカウント削除
- Affected data: `SET` の中の `plan` `planWas`
  `saved` `savedUp` `notAt` は、アカウントごとに `lingua.set.<uid>` へ
  預けます（~~`setFor()`~~ ── r79 から書く時に `lingua.set.<uid>` へ、`www/core.js` § ACCT）。~~`planUid`~~ は「いま誰の分が載っているか」なので
  預けません。
- Affected docs: `CLAUDE.md` § Online、§ 規則22 ── 同じコミットで書き換えた
- Implementation status: **入りました。**三つです ──
  (1) ~~`setFor()`~~（r79 から入れ物 `ACCT`）が段・保存した検索・通知の位置をアカウントごとに預ける、
  (2) アカウント削除は `lsWipeAcct()` と ~~`bkDropFor()`~~ で**そのアカウントの
  ぶんだけ**（~~`lsWipeNS()`~~ と ~~`bkDropAll()`~~ は消えました）、
  (3) ~~`langOwned()`~~ は印を読む一行で、端末を憶える枝はありません。
  `acct-check` 19・35・46 が持ちます。

### 課金はメールアドレスのアカウントに紐づく。端末が同じでも引き継がない
- Date: 2026-09-02
- Area: プラン（~~`SET.plan`~~、Keychain、段を読み合わせる道）とアカウントの関係
- Decision:

  ```
  メアドごとにアカウントも言語も課金状況も紐づくんだから、残ってるのがおかしい
  Xは違うアカウントだと課金も引き継がれない
  ```

  同じ iPhone で別のアカウントにサインインした人は、**その端末で買った購読を
  引き継がない**。段はアカウントのもので、Apple ID のものではない。

- Reason: 言語とアカウントが結びついているのと同じ話。A（Pro）がサインアウト
  して B がサインインすると、端末の ~~`SET.plan`~~ が pro のまま残り、次の起動で
  端末が B のアカウントに Pro を書き込んでいた（その道は 2026-09-06 に無くなり
  ました）。一つの Apple ID から
  いくつでもアカウントに Pro を配れる。「アカウント変えたら無限に言語作れる
  やん」（2026-09-01）で段をアカウントへ移した、その口が別の場所で開いている。
- Affected features: 課金全体。CLAUDE.md の「プランはアカウントのもの」を
  **置き換えるのではなく、その一文どおりに実装する**もの。規則の書き換えは要らない。
- Affected data: Keychain に、段と一緒に「買ったアカウントの uid」が入る。
  uid が合わないセッションは、サーバーの答えが来るまで free から始める。
- Affected docs: `docs/PAID_FEATURES.md`、`docs/scope/claude-login-billing.md`
- Implementation status: **IMPLEMENTED、形は 2026-09-11 に変わった** ── 段は端末に無く、`verify-plan` の答えが
  メモリに一つ（`PLAN`、`www/core.js`）。Keychain も ~~`planFor()`~~ も無い（「端末は何も決めない」）。

### 1アカウントに1課金。印の無い端末も例外にしない
- Date: 2026-09-11
- Area: 段の持ち主（~~`planFor()`~~、~~`SET.planUid`~~、~~`SET_PLAN`~~、`www/core.js`）
- Decision:

  ```
  1アカウントに1課金ですけど。他のアカウントについてくるわけねえだろ
  ```

  段はサインインしているアカウントのもの。**例外は無い。**段の持ち主が
  書かれていない端末（この章より前の端末）も同じで、「誰が買ったか誰も
  言えない段」は、そこにいる人の買ったものではない。

- Reason: 2026-09-02 の決定の実装に、一つだけ枝が残っていた ── 「持ち主が空なら
  名前を書き留めるだけで段は動かさない」。空を「この端末を持っている人の段」と
  読む枝で、測ると印の無い端末に残った `pro` が次に入ったアカウントに付き、
  `planWas` も一緒なので ~~`capLapse()`~~ は何も言わなかった。表は
  `docs/scope/r18-plan.md`。
- Affected features: 課金全体。2026-09-02 の決定の **Implementation status を
  置き換える**（その決定を置き換えるのではなく、例外なしで実装する）。
- Affected data: 端末から消えるものは二つで、どちらも人が作ったものではない ──
  印の無い端末の段が別の人の画面に出ていた分、および `lingua.set.<uid>` の
  預け写しが `plan` と `planWas` を運ぶ道。既に書かれている語は消さない。
  DELETE REVIEW は `docs/CHANGELOG.md` 2026-09-11。
- Affected docs: この項目、`docs/STATE.md`、`docs/PAID_FEATURES.md`、
  `docs/CHANGELOG.md`、`docs/scope/r18-plan.md`
- Implementation status: IMPLEMENTED。`acct-check` 40（印の無い端末も例外で
  ない）・40b（段は預け写しに乗らない）・40c（戻ってきたらサーバーが答える）。
  三つとも赤を見た。実機は未確認。

### ダウンロードは Plus から。上限は make と別で、Plus 1・Pro 3
- Date: 2026-09-02
- Area: 人の言語をダウンロードする（⑫）、`CAN.dl` と `dlCap()`（`www/core.js`）
- Decision:

  ```
  plusからです
  dlはしかもplusは1つproは3つ DL言語とmake言語でそれぞれ別の最大値
  言語足そうとしたり、dlしようとすると無料からアプデのポップ、
  plusで1個から2個に増やそうとするとアプデのポップ
  ```

  ダウンロードできるのは **Plus から**。持てる数は **Plus 1、Pro 3**。
  自分で作る言語の上限（Free 1・Plus 1・Pro 3）とは **別の数** で、
  互いに影響しない。上限に当たったら課金のポップが出る。

- Reason: オーナーが実機で、無料のままダウンロードした言語を使えることに
  気づいた。
- Affected features: ⑫。`CAN.dl` は 2026-08-19 の
  「キーボードと文字の DL は無料、辞書は Plus」を **置き換える**
  （docs/FEATURES.md § 4）
- Affected data: 何も消えない。**上限を超えた分は一覧から隠れる**
  ── 「減った時は隠すだけね」「だって単語でも文法でも同じようにやったじゃん」。
  単語が無料で先頭百語だけ並べるのと同じ形（`wordsSeen()` → `langsSeen()`）。
  どれが残るかは【差し替え済み 2026-09-12】── 差し替えた決定:「主言語 ── 一番古く
  作った言語。無料はそれだけ出て、それが開く」（2026-09-12）。
  `LANGS` も `lingua.` の鍵も一つも動かず、払い直せば全部元どおり並ぶ。
  これは `www/core.js` に書いてあった「never hides one, never shortens a
  list」を置き換える
- Affected docs: この項目、docs/FEATURES.md § 4
- Implementation status: IMPLEMENTED。`dl-check` が持つ
  （無料は不可・Plus は 1・Pro は 3・二つの数が互いを見ない）。赤を見た。
  隠す側も `dl-check` が持つ（Pro で三つ、無料で一つ、鍵が一つも消えない、
  払い直すと戻る）。

### 言語の記事は「人にどう見えるか」──自分のページで分岐しない
- Date: 2026-09-02
- Area: この言語について（`wldPage()` の読む面、`www/home.js`）
- Decision:

  ```
  自分のページだろうが人のページだろうが人にどう見えるか
  ```

  記事の読む面は **読み手が見る画面** であり、それが誰の言語かで描き分けない。
  見出し、開くかどうか、文字の升、キーボードの絵、＞ の数 ── どれも同じ。
  「自分だから余分に出す」も「自分だから別の部品を使う」も無い。

  そして **一行に ＞ は一つ**。左の、開くための一つだけ。

- Reason: 「＞＞が二つあるのが嫌だって話前にしたよね？」「自分のページでも人の
  ページでも見た目は一緒にしてよ　なんで変える必要あんの？」「自分のページ
  だろうが人のページだろうが人にどう見えるかだろ」 OWNER 2026-09-02。
  記事は公開するものなので、自分で見る意味は「読み手にどう映るか」を見ること。
  分岐があると、自分の画面で確かめたことが読み手の画面について何も言わない。
- Affected features: ⑫ 言語の記事
- Affected data: 無し。描き方だけ
- Affected docs: この項目。2026-08-25 の「DL許可が出てるものはDLマークつけないと」
  は **読む面については置き換えられた** ── 行の ↓ 印は無くなり、人の記事では
  足元の取る行が、自分の記事では編集面の四つのスイッチがその答え
- Implementation status: IMPLEMENTED（`2442a66`）。
  **残っている差は二つあり、どちらも「見た目」ではなく「できること」です**:
  ① 右上の「編集」── 記事を書き換える入口で、記事そのものではない。
  ② 足元の ↓ の行 ── 章を **取る** ボタンで、自分の言語には取るものが無い
  （`WLDS_HAVE` に何も無いので押しても何も起きない）。ここを同じにするなら
  「自分の記事でも ↓ の行を出す」ことになり、押したとき何をするのかは
  決まっていません。**オーナーの判断待ち**

### 長押しのしきい値は 10px
- Date: 2026-09-01
- Area: プロフィールの長押しで言語を切り替える（⑬）
- Decision:

  ```
  10px
  ```

  親指が **10px を超えて動いたら**、長押しをやめる。それ以下は動いていない
  ものとして扱う。`HOLD_SLOP` が `www/shell.js` のその一箇所。

- Reason: 閾値が無かったので、`touchmove` が一画素で `holdClear` を呼んでいた。
  実機の親指は必ず一画素は動くので、**長押しは実機で一度も成立していなかった**
  （`claude/scan` が本物の TouchEvent で測定: 静止→動く、一画素→死ぬ、
  六画素→死ぬ、四十画素→死ぬ）。16px も並べたうえで 10 が選ばれた ── 寛くすると
  スクロールのつもりが切り替わる回数が増える。
- Affected features: ⑬。`www/sns.js` の同じ形も同じ値
- Affected data: 無し
- Affected docs: 無し
- Implementation status: **IMPLEMENTED** ── `HOLD_SLOP=10`（`www/shell.js`）。

### iOS 標準のダイアログもシートも使わない ── 五つ目の禁止
- Date: 2026-09-01
- Area: 何かを訊く・伝えるときの形
- Decision:

  ```
  標準は使わねえって言ってんだろこれも禁止や
  禁止事項入れろ
  ```

  ```
  正直自前のpopがいいんだけどな。
  iPhoneのやつ使ってるsnsないしな
  ```

  **`confirm()` `alert()` `prompt()` と `UIAlertController` を使わない。**
  そして**下から出るシートも使わない**（既に禁止、CLAUDE.md § Shape の三つ目）。

  この二つが同時に禁止なので、**残るのは画面の中に重なる自前のものだけ**です。

- Reason: SNS でシステム標準のダイアログを使っているものが無い。
- Affected features: いま `confirm()` を使っている全部 ──
  単語の上限（`capStop()`）、アカウント削除（`wipeAll()`）、
  文字の削除（`ltDelete()`）、有料の門（`upStop()`）ほか。
  **数はコードから数えること。**
- Affected data: 無し
- Affected docs: `CLAUDE.md` § Shape。2026-09-01 の
  「システム標準（iOS/Android）を最優先。独自実装は『標準では実現できない
  場合のみ』」を**取り消す**
- **アクションシートの narrowing は取り消していません。**この項は一度それも
  取り消したものとして書かれていましたが、**2026-09-03 にオーナーが同じことを
  もう一度言いました**:「タップしたらios標準出して」。指の下にある一つのものを
  変えるか消すかを訊く、iOS 自身の二〜三行 ── プロフィール画像がそれで、
  それだけです。`www/mod.js` ではなく `ios/` の `UIAlertController`。
- Implementation status: **入りました（2026-09-03）。**`www/` から
  `confirm()` `alert()` `prompt()` は消えていて、`tools/es5-check.mjs` が
  止めます。言語の名前は `openForm()`、上限の言い切りは `toast()`、
  問いは `popAsk()`。プロフィール画像だけが iOS 標準のまま。

**リーダーへ: 勝手に進めない。**この決定は、形が決まる前に三度作って三度
外した後に出ている（遷移する画面 → 下から出るシート → 標準のダイアログ）。
2026-09-03 にリーダーがプロフィール画像の形を訊いて、答えは「iOS 標準のまま」
でした。**四つ目を作る話ではありませんでした。**
**訊いてから作る。**

### オーナーが機能追加をしようとしていたら、リーダーが確認する
- Date: 2026-09-01
- Area: リリースまでのあいだ、頼まれたものの扱い
- Decision:

  ```
  俺が機能追加しようとしてたら確認して欲しい。
  今は穴埋めバグ潰しに徹底しよう
  ```

  **これはリーダーへの指示で、オーナー自身の依頼にも効く。**リリースまでの
  あいだ、頼まれたものが機能追加なら、**作り始める前にそう言う。**黙って
  始めない。断るのではなく、これは追加ですと言って、オーナーが決める。

  線は一つの問いで引く ── **それは今、在ることになっているか。**

  ```
  穴        在ることになっているのに、無い
            押しても何も起きない / スイッチだけ在る / 書いたが読み戻せない
  バグ      在るものが、違う動きをする
  機能追加  今は無いことになっているものを、新しく在るようにする
  ```

  在ることになっているのに無ければ穴で、これは埋める。無いことになって
  いれば追加で、これは確認する。

- Reason: 本当は先週リリースの予定だった。遅れた原因は穴であって、機能が
  足りないことではない。**リリース前の機能追加は、埋めるべき穴を一つ増やす。**
- Affected features: 全部
- Affected data: 無し
- Affected docs: `docs/SESSIONS.md` § Who is who ── リーダーの仕事に一行
- Implementation status: 即時。この決定が書かれた時点から

**ここで止まる、ではない。**`CLAUDE.md` § Deciding は「決めごとは止まって訊く」
だが、これは逆向き ── **オーナーが決めることを、オーナーに気づかせる**ための
一行。言ったうえで進めと言われたら、それが仕様。

### 今週リリース ── 穴を埋める、実機のバグを潰す、機能は足さない
- Date: 2026-09-01
- Area: リリースまでの順番
- Decision:

  ```
  リリースは今週にしたい
  そのために足りないとこをまずは埋める

  その後実機のバグを潰す。
  機能追加はしない

  この流れで
  ```

  三段で、順番が決まっている:

  1. **穴を埋める。**「入れました」で閉じたが片側しか無いもの。今わかっている
     のは、言語がサーバーに全部上がって新しい端末で戻ること、課金がアカウントに
     紐づくこと、価格の横の定期購読の開示、⑫ のダウンロードそのもの、⑬ の長押し。
  2. **実機のバグを潰す。**オーナーが端末で踏んだものだけ。
  3. **機能追加はしない。**「あったほうがいい」は全部この線の向こう。

- Reason: 本当は先週リリースの予定だった。遅れた原因は一つの形に集約される ──
  **見える側だけ作って「入れました」で閉じ、検査が全部緑だった。**
  DL はスイッチだけ、言語の同期は上げる側だけ、課金は買う側だけ、
  長押しの検査は成立したあとの身振りを測っていた。どれも一人・一台では
  正しく動くので赤にならない。
- Affected features: 下の三つの枝が持っている分
- Affected data: 1 に入るものは全部データを触る。**消す行を書かないこと**が
  条件（同日、`claude/scan` への指示）
- Affected docs: `docs/STATE.md` §0-a
- Implementation status: **済み** ── 1.0.0 (162) が 2026-09-22 に App Store に出た（`docs/STATE.md`）。

**この決定が禁じるものを、名前で書いておく。**リリース前に「ついでに」で入る
ものは全部この三段の外にある ── 整理、改名、きれいにすること、あったほうがいい
画面、次に要りそうなもの。`CLAUDE.md` § Scope の五つ（*while I'm in here*,
*this could be cleaner*, *it's related so I changed it*, *we'll need this later*,
*the existing code looked wrong*）が、いまは特に効く。

### DL した言語 ── 編集・バックアップ・単位・上限
- Date: 2026-09-01
- Area: 人の言語をダウンロードする（⑫）
- Decision:

  ```
  これも何回も言ってるんだけど、できないんだよ。
  dl言語はへんしゅうはできないってなんかいもいわせんなよ
  ```
  ```
  入らん
  ```
  ```
  いや一つづつdlでいいよ。
  ```
  ```
  別に数える
  ```

  四つ、この順で:

  1. **DL した言語は編集できない。** 2026-08-25 に同じ決定が出ていて
     （下のエントリ、原文「もちろんダメです。トキポナに文字足したらトキポナ
     じゃないです」）、`docs/FEATURES.md` § DL・`docs/DATA_MODEL.md`
     § A language that is only read の三箇所に既に書いてある。**それでも
     オーナーに四度目を言わせた。** 訊く前に grep する。
  2. **DL した言語は、その人のバックアップファイルに入らない。**
     `SLICES` に含めない。~~`bkPack()`~~ は歩かない。
  3. **章は一つずつ取る。数えるのは言語。** 単語・文字・文法・キーボードは
     それぞれ別の ↓ で取るので、言語は**部分的に届く** ── 単語が入っていて
     文字が入っていない状態が正規の状態としてある。**上限が数えるのは、その
     章の数ではなく言語の数です** ──「DLしたらDL言語がアカウントに出てくる
     だろ？それはなにをダウンロードしてもその言語からDLしてんだから1個だろ」
     OWNER 2026-09-03。トキポナの四章を全部取っても **1**。`dlCount()` が
     index の行を数えているのがその形。
  4. **言語数の上限は、自分で作った言語と別に数える。**
     `langCount()` が `mine` だけ数えているのは正しい。数は 2026-09-02 の
     決定 ── Plus 1・Pro 3（`dlCap()`）。

- Reason: 1 は「トキポナに文字足したらトキポナじゃない」。2 と 4 は
  他人のものが自分の持ち物として数えられない・配られないため。3 は原文のまま。
- Affected features: ⑫ ダウンロード（`docs/FEATURES.md` § DL）
- Affected data: `LANGS[id].mine` が初めて `false` になる。`SLICES` は
  変わらないが、**DL した言語の id を ~~`bkPack()`~~ が飛ばす**必要がある
- Affected docs: `docs/DATA_MODEL.md` § A language that is only read の
  未決 2・3・4 を答えに差し替え済み
- Implementation status: **IMPLEMENTED** ── 1 は `langLocked()` を書き手が訊く、2 はファイルが消えて無くなった
  問い、3 は `dlCount()` が言語を数える、4 は `dlCap()` が作った言語と別に数える（`www/core.js`、`dl-check`）。
### 1. 画面の基準が十になった
- Date: 2026-09-01
- Area: 画面ぜんぶ
- Decision:

  ```
  この辺が世界基準だからそれ以外はやめて欲しい
  ```

  そして十項目。**原文のまま**:

  ```
  1. システム標準（iOS/Android）を最優先。ネイティブの UIKit / SwiftUI をそのまま使う。
     独自実装は「標準では実現できない場合のみ」
  2. 主要SNSの共通パターンに従う（下タブ3〜5個／上部は最小限／縦スクロール1カラム／
     投稿ボタンは右下か下中央／プロフィールはアイコン→タップ→アクションシート）
  3. 操作は1タップで完結。画面遷移を増やさない。モーダルは最大1階層。
     削除・変更はアクションシート
  4. 情報量は少なく、余白は広め。1画面1目的。説明文は極力書かない
  5. アニメーションは控えめ。フェード／スライドのみ
  6. カラーは2〜3色まで
  7. フォントは1〜2種類
  8. タップ領域は44pt以上
  9. 重要操作は取り消し可能。削除→Undo。いきなり消さない
  10. 実機で必ず確認
  ```

  **9 は 2026-09-24 で置き換わった**: 消す前は確認の窓（「よくないです。確認ポップにしてください。」）── 上の 2026-09-24 の項。

- Reason: **原文の一行がそのまま理由です** ──「この辺が世界基準だから」。
  基準1がほかの九つの土台で、「標準では実現できない場合のみ」独自にすると
  言っている以上、**「独自のほうが良い」は理由になりません。**
- Affected features: 画面ぜんぶ。
- Affected data: 無し。
- Affected docs: `CLAUDE.md` § Shape（直した）、この項、
  `docs/CHANGELOG.md`（`claude/fo2` が原文を入れた `3538668`。書き換えない）。
- Implementation status: 規則は直した。下の「コードと合っていない所」は **2026-09-23 に照合していない**。

#### コードと合っていない所。直していない ── **二つあります**

**どちらも「見つけたから直す」で触ってよいものではありません。**

**① 基準8「タップ領域は44pt以上」と、キーボードのキーの例外。**
`CLAUDE.md` 規則3 は 44pt を両辺に要求したうえで、**キーボードのキーだけは
高さで測る**と書いています ── 一番細い iPhone は 320 なので、横に十個並べば
一つ 32pt にしかならず、44 に広げると**キーボードというものが作れなくなる**、
という理由が付いています。基準8はそこに触れていません。
**規則3の例外を消すとキーボードが消えます。**オーナーに訊く一行です。

**② 基準7「フォントは1〜2種類」と、いま宣言されている顔の数。**
`www/index.html` の `:root` に六つ在ります:

```
  --face-ui       -apple-system … 'Noto Sans JP'      画面の地
  --face-caps     'Cinzel'                            見出し
  --face-ital     'Cormorant Garamond'                斜体の飾り
  --face-mono     ui-monospace
  --face-script   'LinguaScript'   ← その人が描いた文字。このアプリそのもの
  --face-type     'LinguaType'     ← 同上（キーボードが渡す私用領域）
```

後ろの二つは**その人の文字**なので、UI の書体の数には数えられません。
数えられるのは前の四つで、**基準7は二つまで**と言っています。
`--face-caps` と `--face-ital` をどうするかは**全画面の見た目が変わる**ので、
`CLAUDE.md`「Deciding」のとおり**オーナーのもの**です。
`tools/face-check.mjs` が両方向を押さえているので、**減らすなら検査と同じ
コミットで**。

**合っているもの**（数えました、推測ではありません）:
基準2の下タブは `TABS`（`www/shell.js:652`）が五つ ── 3〜5 の中。
基準9の「削除→Undo。いきなり消さない」は `CLAUDE.md` 規則19 が既にその形
（ゴミ箱は訊かず、後ろに戻る一歩が立っている）。
基準4の「説明文は極力書かない」は § Explaining が既に同じ。
基準10 は `DEVICE CONFIRMED` が既に同じ。

### 2. 下から出るシートの禁止が狭まった ── iOS 自身のアクションシートだけ許す
- Date: 2026-09-01
- Area: `CLAUDE.md` § Shape、三つ目の禁止
- Decision:

  ```
  アイコンをタップした時にiPhone標準の写真を選ぶか、削除するか出てくるやつでいいだろ
  ```

  そのうえでリーダーが「**画面の代わりに使うシートは今も禁止、削除・変更の
  アクションシートだけ許す、でいいか**」と訊き、オーナーが「**1はイエス**」と
  答えました。ここは原文ではなく、リーダーの二択とその答えです。

  **禁止のまま残るのは、画面の代わりに使うシート** ── 一画面ぶんの操作を、
  ページを作りたくないからという理由で下から持ち上げたもの。**許すのは、
  指の下にある一つのものを消すか変えるかを訊く、iOS 自身が出す二〜三行の
  もの**、しかも **iOS 自身のものだけ**です（基準1）。**HTML で似せて描いた
  シートは、禁止されている側が許された側の名前を着ているだけ**なので、
  そこは閉じています。`UIAlertController` が要るので `www/` だけでは持てません。

  なお `claude/fo2` の `cbc3965` は、同じ会話の中の
  「長押しで消えるってわかんないだろ普通に。」も原文として引いています。
  **こちらへ渡ってきた relay にはその行が無い**ので、原文の扱いは
  `docs/CHANGELOG.md` と `cbc3965` を見てください ── ここでは、
  二つの relay の両方に在る上の一行だけを原文として置いています。
- Reason: 基準1。標準で出せるものを独自に描くのは、基準1が「標準では実現
  できない場合のみ」と言っている側にあたります。
- Affected features: プロフィール画像を触ったときの道（~~`openMePic`~~、
  `www/me.js:787`）。いまは**画面**（`openForm`）で、変える／外すが縦に
  並んでいます。基準2の「プロフィールはアイコン→タップ→アクションシート」に
  するには `ios/App/` に `UIAlertController` が要ります。
- Affected data: 無し。
- Affected docs: `CLAUDE.md` § Shape（直した）、この項。
- Implementation status: **IMPLEMENTED** ── プロフィール画像は iOS 自身のシート（`mePicAsk()` が
  `LinguaShare` の `ask` を呼ぶ、`www/me.js`）。

### 3. 課金とアカウントとキーボードはアカウントに結びつく
- Date: 2026-09-01
- Area: プラン・アカウント・キーボードの持ち主
- Decision:

  ```
  課金とアカウントとキーボードはアカウントに結びつく。

  じゃないとアカウント変えたら無限に言語作れるやん
  ```

- Reason: **原文の二行目がそのまま理由です。**上限が端末に付いていると、
  **アカウントを変えるだけで何回でも作れます** ── `docs/PAID_FEATURES.md` の
  「languages on the account 1 / 1 / 3」は、アカウントに付いていて初めて
  上限になります。プランも同じで、端末の中の値なら端末を変えれば無関係です。
- Affected features: `www/core.js`（~~`planKeep()`~~ / `setOnDisk()`）、
  `www/settings.js`（~~`setPlan()`~~）、`supabase/schema.sql`（`profile` の列）、
  `www/net.js`（プランを送る道）。キーボードは言語の一部なので `slice` の `kb`
  ── **こちらは既にそうなっています。**
- Affected data: `profile` に列が増えます。消えるものはありません。
- Affected docs: `CLAUDE.md` § Online、`docs/PAID_FEATURES.md`、
  `docs/DATA_MODEL.md`、`docs/STATE.md` § 3 項目4、`docs/keyboard.md`
  ── **全部直しました。**
- Implementation status: **IMPLEMENTED** ── 段は `plan` 表（`supabase/schema.sql`）、`verify-plan` が書き、
  端末はメモリの `PLAN` だけ。キーボードは言語の `kb` slice。

### 4. 通知の未読は「最後に通知の画面を開いた時刻より新しいもの」
- Date: 2026-09-01
- Area: 下のタブのベルに出る数
- Decision: **これは原文ではありません。**リーダーが二択で訊き、オーナーが
  「1はイエス」と答えたものです。地の文で書きます。

  **最後に通知の画面を開いた時刻より新しいものを未読とする。**X や Instagram と
  同じ形です。**サーバーに既読の表は要りません** ── `notices()` の八列に既読の
  印は無く、それは列が無いからではなく、決定がそうだからです。
- Reason: 既読を表にすると、書き込みが一つ増え、端末が増えるたびに食い違います。
  時刻一つなら、どの端末で開いても同じ答えになります。
- Affected features: 下のタブのベル、通知の画面。
- Affected data: `lingua.set` の `notAt` ── 通知の画面を最後に開いた時刻
  （ミリ秒）。移行なし、削除なし。
- Affected docs: `docs/CHANGELOG.md`（`claude/fo2` が入れた）、この項、
  `docs/DATA_MODEL.md`（`claude/fo2` の持ち物として同じコミットに在ります）。
- Implementation status: **`claude/fo2` が持っています。**この枝は
  `www/` を持っていないので、ここは記録だけです。

### 5. 端末に住むものはほとんど無い。古い記載は消す ── 決まったこと3は **superseded 2026-09-03**
- Date: 2026-09-01
- Area: サーバーと端末の分かれ目 ── 何が端末のものなのか
- Decision:

  ```
  そもそも端末に保存するもんはないぞほとんど。
  ```
  ```
  コードもそれようにして欲しい。
  古いコードとか古い記載は全部消して欲しい。
  ```
  ```
  古い記載は消していい。

  音声とかをサーバーに載せる重いのは後でって話
  ```

  決まったこと:

  1. **サーバーが本体。**SNS も言語も。投稿・写真・声・下書き・ハンドル・
     表示名・プロフィール画像・反応・フォロー・ブロック・通報、そして
     **言語そのもの**（`slice` 行のぜんぶ）。
  2. **端末が持つのは、電波が無いときに動く写しだけ。**端末は物が住む場所では
     ない。`lingua.*` の鍵はどれも写しであって家ではない。
  3. **古い記載は消す。**「これは歴史です」と前置きして残さない ── 読まれる。
  4. **重いものをサーバーへ移すコードの作業は後回し。**原文の三つ目の
     ブロックの二行目。**記載を消すことと、コードを移すことは別**で、
     消すほうが今日です。

- Reason: **書いてあるものが読まれて、間違った説明がオーナーに届きました。**
  `docs/STATE.md` § 3 は「言語はまだ `localStorage` だけ、サーバーに載せるのは
  これから」と書いたままで、`CLAUDE.md` の一覧は「タイムラインは端末に在る」と
  書いたままでした。**どちらも逆です。**リーダーがそれを読み、そのとおりに
  説明しました。**直すのは説明した人ではなく、その文です** ──
  「そのせいで勝手に君が勘違いしてるわけでしょ？」。
- Affected features: 無し（この項は仕様の言い直しであって、新しい振る舞いでは
  ない）。
- Affected data: 何も消えません。
- Affected docs: `CLAUDE.md`、`docs/STATE.md`、`docs/ARCHITECTURE.md`、
  `docs/DATA_MODEL.md`、`docs/DATA_SAFETY.md`、`docs/FEATURES.md`、
  `docs/PAID_FEATURES.md`、`docs/keyboard.md`、`docs/apple.md`、
  `docs/BACKLOG.md`、この項 ── **全部直しました**（`docs/reports/docs-2026-09-01.md`）。
  **`docs/CHANGELOG.md` は書き換えていません。**
- Implementation status: **記載は直した。**

#### 「音声とかの重いの」がどれを指すのかは、まだ分かっていません

**声も下書きも、コードの上ではもう移っています。**数えました:

```
www/net.js:1474  netPush() → :1503 netUpVoice() → post-media、道は body.vu
www/post.js:1290 netPush() ── 投稿した瞬間
www/net.js:1544  netDraftUp() ── www/post.js:380 と :463 から
```

`docs/BACKLOG.md:2331`（下書きは済、録音は元から在った）、
`docs/FEATURES.md:258`（Already online に写真と声）、`www/net.js:1527`
（下書きの写しは住む場所ではない）も同じことを言っています。

**だから「いまはまだ端末にある」とは書いていません。**それを書くと、
この項の Reason に書いた失敗を一つ増やすことになります。
いま端末に残っている重いものは、上げたあとの `Documents/Voices/*.m4a`、
`lingua.posts` の写真の data URL、下書きの `body` の base64
（**これは後回しではなく設計です** ── `post-media` は公開バケットなので、
公開していない下書きの写真をそこに置けない。`www/net.js:1529`）。
**このどれのことか、訊いています。**

### 6. プロフィール画像の削除は入れる ── 同じ日に二度動いた
- Date: 2026-09-01
- Area: プロフィール画像を触ったときに出るもの
- Decision: **同じ日に二度動いています。新しいほうが生きています。**

  はじめ:

  ```
  削除はいいって一旦
  ```

  そのあと:

  ```
  別に急いでないからしっかり作って全部入れてからビルドして。
  ```

  **後のほうが生きています** ── 削除は入れる。「一旦いい」は、急ぐなら
  外してもいい、という話でした。急がないと言われた以上、外す理由は残りません。
- Reason: 原文の二行目。**急ぎがこれを外す唯一の理由だった**ので、
  急がないなら入れる、が同じ一行から出ます。
- Affected features: ~~`openMePic`~~（`www/me.js:787`）── 変える／外すの二つが
  既に在ります。**形は基準2の「アイコン→タップ→アクションシート」で、
  いまは画面（`openForm`）です**（項目2）。
- Affected data: 無し。`ME.pic` を空にするだけです。
- Affected docs: この項。
- Implementation status: **IMPLEMENTED** ── `mePicAsk()`（`www/me.js`）が iOS のシートで「選ぶ／削除」。実機は
  写真つきで確かめた日がこの項に無いので未確認。

### 7. 自己紹介は出す。言語の詳細も
- Date: 2026-09-01
- Area: プロフィールに何を出すか
- Decision:

  ```
  自己紹介を見せないって選択肢を俺はいつ与えた？
  言語の詳細は？
  ```

  **出す。**隠す選択肢は与えられていません。
- Reason: 原文がそのまま理由です。**誰も決めていないものを、隠す側に倒して
  はいけません** ── `CLAUDE.md`「Deciding」の、何が誰のものかという話です。
- Affected features: プロフィール（`www/me.js`）。
- Affected data: 無し。
- Affected docs: この項。
- Implementation status: **既にそうなっています。**自己紹介は自分の
  プロフィール（`www/me.js:360`）にも他人のプロフィール（`:623`）にも
  出ています。**この項は「消すな」という決定として効きます。**

### 全部の升、触ったら選択。キーを入れるのは帯のボタン
- Date: 2026-08-28
- Area: キーボードの編集画面のシート
- Decision:

  ```
  全部のます触ったら選択で
  ```

  リーダーが上げた問いへの答え ── 点線の升に二種類あって、**見た目が同じなのに
  挙動が違った**。本当の空き升は「押すと追加」、寄せで出来た隙間（gap キー）は
  「押すと選択」。

  **答え: 全部の升、触ったら選択。**キーを入れるのはシートの上の帯のボタン。
  入るのは**一キーの幅**で、半分の升には入らない ──「半キーを追加できるのやめて
  ほしい」OWNER 2026-09-05（`kbCellFits()`、`www/keyboard.js`）。
- Reason: シートは端から作業する。行の番号で行を、列の文字で列を、キーを押して
  キーを選び、**上の帯のボタンが選ばれたものに働く。**升だけ例外にすると、
  同じ見た目のものが二つの答えを持つ。
- Affected features: キーボードの編集画面
- Affected data: 無し（描き方と、押したときに何が起きるか）
- Affected docs: この項、`CLAUDE.md` § 19
- Implementation status: **IMPLEMENTED** ── `kb-check` が持つ。

### シートは升。空いた升は点線のキーで、押せる。中央寄せは両端に半分ずつ
- Date: 2026-08-28
- Area: キーボードの編集画面のシート
- Decision:

  ```
  エクセルと同じだって。

  点線キーが入ってんの。追加するならタップまで追加ボタン。

  キーガーないところがあるのがおかしい。左寄せにしたら全部寄せるし空白が出るのがおかしい
  ```
  ```
  半キーも左に寄せたら右に1枠開くでしょ？そういう話
  ```
  ```
  中心に寄せたら半キーが二つできるけど寄せたら1つになるの
  ```

  **シートは升の並びで、升は全部が升です。**

  1. **キーの入っていない升は点線のキーとして描く。**「空白」という状態は無い
  2. **タップが追加ボタン。**押すと**その升の幅のキー**が入る（半分の升なら半キー）
  3. **左・右に寄せる** → 余りは片端に一かたまり
  4. **中央に寄せる** → 余りは**両端に割れる**。奇数コマ余れば**半分の升が両端に一つずつ、計二つ**
- Reason: 升に何も無い場所があると、そこが何なのか画面から分からない。
  エクセルの升と同じで、空いていることと存在しないことは違う。
- Affected features: キーボードの編集画面
- Affected data: 無し（描き方と、押したときに入るキーの幅）
- Affected docs: この項、`CLAUDE.md` § 19
- Implementation status: 未着手

#### これが置き換えたもの

**「中央寄せは余りの半端を丸めて片端に寄せる」は無い。**両端に半分ずつ。
`CLAUDE.md` § 19 のその段は同じコミットで書き直した。

丸めがあった理由は「半キーずれた行はどの列にも乗らず、列を選んでも光らない」
だった。**それは今そのまま起きてよい** ── 同じ § 19 が「帯だけ出て一つも光らない
行は、その行が列と揃っていないと言っている正しい答え」と既に書いていて、
無料の QWERTY の三段目がまさにそれ。

**「余りが一列のときは押せない空白にする」も無い。**それはリーダーが
2026-08-28 に入れたもので、同じ日にオーナーに否定された。

### 【差し替え済み 2026-09-03】上がっていない言語を守る条件は入れない。字義どおり全部消える（2026-08-28）
- 差し替えた決定: 「消す行の真ん中は「この言語を削除」── 開いている言語一つの制作物が全部なくなる」（2026-09-03）

### 【差し替え済み 2026-09-03】端末のデータを消すと、Documents のバックアップも消える（2026-08-28）
- 差し替えた決定: 「消す行の真ん中は「この言語を削除」── 開いている言語一つの制作物が全部なくなる」（2026-09-03）

### サブリーダーが居ないときは、リーダーが取り込む
- Date: 2026-08-28
- Area: 誰が取り込むか
- Decision:

  ```
  じゃあ君が取り込んで
  ```

  同じ日の「取り込むのはサブリね？」の**あと**に、**サブリーダーのセッションに
  連絡が届かないと報告したうえで**言われたもの。だから二つは矛盾ではなく、
  順番です:

  **サブリーダーが居るならサブリーダーが取り込む。居ないならリーダーが取り込む。**
  取り込んだ人がそのままゲートを全部回します ── 取り込んだ形でしか全部は
  緑にならないので、取り込む人と回す人は同じです。

  **リーダーがコードを書かないことは変わりません**（同じ日の「君が作業するん
  じゃなよね？」）。取り込みは書くことではない。
- Reason: 取り込む人が居ないと master が動かず、ビルドに何も乗らない。
- Affected features: 無し
- Affected data: 無し
- Affected docs: この項、`CLAUDE.md`、`docs/SESSIONS.md`、
  `docs/HANDOVER-2026-08-28.md`、`.claude/hooks/session-start.sh`
- Implementation status: 実施中

#### これが置き換えたもの

**「取り込むのはサブリーダーだけ」は無い。**居ないときはリーダーがやる。
同じ日の数時間前の項をこれで狭めた。

### 取り込むのはサブリーダー。リーダーは配ってビルドを引くだけ
- Date: 2026-08-28
- Area: 誰が何をするか
- Decision:

  ```
  取り込むのはサブリね？
  ```
  ```
  君が作業するんじゃなよね？
  ```

  **枝を master に取り込むのはサブリーダー①。**そのままゲートを全部もそこで回す
  ── 取り込んだ形でしか全部は緑にならないので、取り込む人と回す人は同じです。

  **リーダーは配ってビルドを引くだけ。**取り込まない、ゲートを回さない、
  **コードを書かない。**
- Reason: 二つ目の原文は、リーダーが自分でコードを書き始めたことについて。
  セッションへの連絡手段が落ちたときに、報告して指示を仰がずに自分で書いた。
- Affected features: 無し
- Affected data: 無し
- Affected docs: この項、`CLAUDE.md` 四箇所、`docs/SESSIONS.md`、
  `docs/HANDOVER-2026-08-28.md` § 7
- Implementation status: 実施中

#### これが置き換えたもの

**「取り込むのはリーダー」は無い。**`docs/SESSIONS.md` の「他の枝を取り込む
禁止。リーダーの仕事」、`CLAUDE.md` の "the leader integrates" 二箇所、
"the LEADER's run" ── 全部このコミットで直した。

**「リーダーがコードを書く」は無い。**連絡手段が落ちていても書かない。
止めて報告する。

### アカウント削除は全部。端末のデータは言語だけ消えて SNS は消えない
- Date: 2026-08-28
- Area: 設定 → アカウントの部屋の、消す行
- Decision:

  ```
  アカウント削除は全部だって言ってんだろ、古い情報残しすぎだろイライラすんな
  なんで？バカなの？アカウント削除はもう全部消えるの。全部。

  古い情報残すな。端末のデータはSNSは消えないで言語データが全部消えるの。
  ```

  **三本ある。**

  1. **ログアウト** ── 何も消えない。
  2. 【差し替え済み 2026-09-03】差し替えた決定: 「消す行の真ん中は「この言語を削除」── 開いている言語一つの制作物が全部なくなる」（2026-09-03）
  3. **アカウント削除** ── **全部消える。全部。** サーバーも端末も。`wipeAll()`。
- Reason: 2 と 3 は消える範囲が違う。片方しか無いと、言語を作り直したいだけの
  人がアカウントごと消すしかない。
- Affected features: 設定 → アカウント
- Affected docs: この項、`docs/DATA_SAFETY.md`（DELETE REVIEW）、`docs/CHANGELOG.md`
- Implementation status: 1・3 は IMPLEMENTED（`wipeAll()`）。2 は 2026-09-03 の決定の形で入った。

#### これが置き換えたもの

**「消す行は二本」は無い。**三本。2026-08-22 に二本へまとめたのは、**まとめ方が
間違っていた** ── 消える範囲の違う二つを一つにしていた。

**「アカウント削除はサーバーだけで、端末の言語は残る」は無い。**それは
2026-08-22 より前の `set.drop` の振る舞いで、**もう存在しない。**
アカウント削除は全部消える。

### 規約ページの三つ ── 準拠法はそのまま、通報は24時間、13歳以上
- Date: 2026-08-28
- Area: `tokinets.com/lingua/terms.html` と `/privacy.html`
- Decision:

  ```
  それでいいよ。
  24時間でいいよ。
  13さん以上だね。snsって基本そうやん
  ```

  三行はリーダーが並べた三つに、上から順に答えたもの。

  1. **準拠法・裁判管轄はいまの文のまま。**「日本法・東京地裁を第一審の専属的
     合意管轄、ただし居住国の消費者保護法が与える権利は奪わない」。
  2. **通報への対応は24時間。**
  3. **13歳以上のみ。**（原文の「13さん」は打ち間違いで、13歳。）
- Reason:

  ```
  snsって基本そうやん
  ```

  3 について。1 と 2 に理由は付いていない。
- Affected features: 利用規約とプライバシーポリシー（`natsuaya82-crypto/tokine2`
  の `lingua/`）
- Affected data: 無し
- Affected docs: この項、`docs/BACKLOG.md`
- Implementation status: 実装中（`claude/legal`。1 は既に入っている、2 と 3 を入れる）

#### これが置き換えたもの

**「準拠法と裁判管轄はまだ決まっていない」は無い。**`docs/BACKLOG.md` に
「これは私が置いた既定値で、オーナーが確かめる所です」と書いてあったのは、
2026-08-28 のこの決定で確かめられた。その文は同じコミットで消した。

### ゲートは、全部プッシュしてからサブリーダーが回す。個人は回さない
- Date: 2026-08-28
- Area: 検査の回し方
- Decision:

  ```
  だからゲートは全部プッシュしてサブリが確認するんでしょ？個人ではやらない
  ```

  セッションは**何も回さない。**押すだけ。押されたものを、サブリーダーが回す。
  **リーダーはセッションに「この検査だけ回せ」と言ってはいけない** ── 全部でも、
  名指しの一本でも。
- Reason: 同じ緑を何度も証明しない。赤を見るのは作業、緑を見るのは検証。
- Affected features: 無し
- Affected data: 無し
- Affected docs: `CLAUDE.md` § The gate、`docs/SESSIONS.md` § Scope
- Implementation status: 実施中

#### これが置き換えたもの

**「セッションは、自分が変えたものを持っている検査を名指しで一本だけ回す」は無い。**
2026-08-28 にリーダーが四つのセッション全部にそう書いて渡し、その場で取り消した。

### 語釈は二段。赤い字は無い。お題のページと同じ形
- Date: 2026-08-28
- Area: 作文画面とタイムラインの、語ごとの行
- Decision:

  ```
  やっぱり、タイムラインも投稿も2段で。赤文字消して。
  ```
  ```
  これもお題のページと合わせるんだけど
  ```

  どの二段かを二択で訊いた答えは **A**:

  ```
  A: 打った行（自作文字）＋ 翻訳した形。アルファベット表記の行は無し
  B: 打った行 ＋ アルファベット表記。翻訳は無し
  ```
  ```
  a
  ```

  ```
    1段目   打った行（自作文字。アルファベットで打っていればアルファベット）
    2段目   翻訳した形
  ```

  お題のページと同じ形 ── `daySay()` が読める言葉の一行と英語の一行を出している、
  あの二段と揃える。
- Reason:

  ```
  アルファベットで打ってるのに同じ綴が並ぶと意味わからんやろ
  ```

  同じ綴りが二度並ぶ段には意味が無い。
- Affected features: 作文画面の語釈、タイムラインの投稿
- Affected data: 無し（描き方だけ）
- Affected docs: この項
- Implementation status: 実装中（`claude/wrap`）

#### これが置き換えたもの

**「三段にする」は無い。**アルファベット表記の段は作られない。リーダーが
2026-08-28 に一度そう配ったが、同じ日に取り消された。

**辞書に意味の無い語を赤で出すのは無い。**「自分の文字で打った語だけ赤」に
絞る形も無い ── 赤そのものが消える。

### 残り字数は、打つほど減っていく輪
- Date: 2026-08-28
- Area: 作文画面の帯
- Decision:

  ```
  カウントは打つほど減っていく輪、帯の中、常に出す
  ```
- Reason: 数字が残り40字を切るまで出ないのは、出ていないのと同じ。
- Affected features: 作文画面
- Affected data: 無し
- Affected docs: この項
- Implementation status: 実装中（`claude/wrap`、`51ff071`）

#### これが置き換えたもの

**「残り40字を切ってから数字を出す」は無い。**門は無く、輪は常に出ている。

### おすすめと検索の「話題」は X と同じ。青パッチが上に上がりやすい
- Date: 2026-08-28
- Area: おすすめの並び、検索の並べ替え
- Decision:

  ```
  検索の話題はTwitterと同じアルゴリズムで。パッチ付きの方が上に上がりやすい
  ```
  ```
  Twitterと同じだから青パッチ。上に上がりやすい。
  ```
  ```
  Xと同じアルゴリズムって言ってるよね？
  ```

  重みは **いいね1・リポスト3・返信5**、**同じ数なら新しい方が上**、直近48時間。
  **青パッチ＝課金した人の印**で、金の印（エンタープライズ）とは別物。

  **倍率をオーナーに訊かない。**X が公開しているものを使う。
- Reason: 話題＝おすすめと同じもの。X と同じ。
- Affected features: おすすめのタイムライン、検索の並べ替え
- Affected data: `profile` に契約の列が要る（今は無い）
- Affected docs: この項、`docs/FEATURES.md`
- Implementation status: **入っている。**`feed_hot()`（`supabase/schema.sql`）が
  おすすめと検索の「話題」の両方を答える ── オーナーが同じものだと言ったので、
  関数は一つで二つではない。重みはいいね 1・リポスト 3・返信 5、窓は 48 時間、
  同じ点なら新しい方が上。青パッチの倍率は **4** で、`feed_paid_weight()` が
  一行で持つ ── X が 2023 年に公開した、フォローしていない人に見せるときの数。
  「倍率をオーナーに訊かない」はそのとおりにした。

  **掛ける先はまだ無い。**`profile` に契約の列が無く、`feed_weight()` は
  `to_jsonb(p) ->> 'paid'` で訊いている ── 列が無ければ NULL、できた日から
  黙って効き始める。その列は Apple の署名付き通知をサーバーで受けて立てるもので、
  端末からは書けないよう塞ぐ（`staff` と同じ形）。**それが唯一の残り。**

#### 今できないところ

**サーバーは誰が課金しているか知らない。**`profile` に契約の列が無く、
`postBadge()` は自分の投稿にしか印を出していない。**列ができるまで青パッチの
倍率は掛ける先が無い。**Apple の署名付き通知をサーバーで受けて立てる列で、
本人にも書けないよう塞ぐ（`staff`/`admin` と同じ形）。端末が自分で書く形は
誰でも自分に印をつけられるので、やってはいけない。

**リーダーが提案しただけでオーナーが答えていないもの**（入れない）:
一人一件まで／押した人の頭数で数える／自分の反応は数えない。

### 入れ替えは4時間ごと。時間はお題のページに合わせる
- Date: 2026-08-28
- Area: おすすめの並びの入れ替え
- Decision:

  ```
  3はアメリカ時間ね。4時間ごと。0 4 8 12 16 20 24 これは入れ替わらない。
  ```
  ```
  時間もお題のページに合わせるってこと
  ```

  アメリカ時間の 0 4 8 12 16 20。この刻みは動かない。
  **どの時間帯かは、お題のページ（`netDay()` / ~~`dayPull()`~~）と同じにする。**
- Reason: お題と同じ日付の決まりで動く。時間の決まりの二つ目の写しを作らない。
- Affected features: おすすめのタイムライン、検索の「話題」
- Affected data: 無し
- Affected docs: この項
- Implementation status: **入りました（2026-09-03）。**`feed_slot()`
  (`supabase/schema.sql`) が `America/Los_Angeles` で刻みます ── お題の
  `on_day` を決めている `supabase/functions/daily-prompt/index.ts` と同じ
  時間帯です。`rls-check` の三本が持ちます（刻みが四時間、その時間帯である
  こと、ほかの時間帯を名乗らないこと）。

  **2026-08-28 から 2026-09-03 まで UTC でした。**「zone を名乗らないのが
  お題のページの答え」という読みで書かれていて、それは端末が計算しないと
  いう話で、境目がどこで決まるかとは別の話でした。0 4 8 12 16 20 が
  アメリカ時間になるのは、時差がちょうど四の倍数のときだけです。

#### これが置き換えたもの

**「12時間ごと、0:00 と 12:00」は無い。**4時間ごと。

### フォローの通知も、いいねと同じくまとめる
- Date: 2026-08-28
- Area: 通知
- Decision:

  ```
  同じでいい
  ```

  「同じ投稿のいいねはXみたいにまとめる」のと同じく、フォローもまとめる
  （〇〇さん他3人にフォローされました）。**サーバー側の `notices()` でまとめる。**
- Reason: 端末で畳むと50件が20行に減って、見える範囲が狭くなる。
- Affected features: 通知
- Affected data: `notices()` の返す形
- Affected docs: この項
- Implementation status: **入っている。**`notices()`（`supabase/schema.sql`）の
  `ev` にフォローが `post` を持たない行として入り、`(kind, post)` でまとめる
  `g` がそれを一行にする ── いいねと同じ仕組みで、二つ目の仕組みは作っていない。

### ビルドはオーナーが言うまで押さない。ゲートは実機確認の最中に
- Date: 2026-08-28
- Area: 出し方
- Decision:

  ```
  ビルドは全部終わってからって言ってんだろ俺がいつ許可したの
  ```
  ```
  全部終わったらビルド
  ゲートは俺が実機確認してるときにやってほしい
  だから先にビルド
  ```

  **「全部終わったら」は、オーナーが「全部終わった」と言うまで満たされない。**
  リーダーがそれを「取り込みが終わったら」と読み替えて #99 を無断で出した。
  **前にもらった許可を次の回に使い回さない。毎回その場で取る。**
- Reason: 出たものは消せない。
- Affected features: 無し（出し方）
- Affected data: 無し
- Affected docs: この項、`docs/HANDOVER-2026-08-28.md`
- Implementation status: 実施中

### 確認してから訊く
- Date: 2026-08-28
- Area: リーダーの動き方
- Decision:

  ```
  まずは確認しろよ。
  その後にこの理解であってるかを聞け

  毎回そうしろ
  ```
  ```
  確認してることが全部間違ってるんだから俺の言ったやつが正しいんだよ
  ```
  ```
  読むのは現状の把握。
  ```

  **コードを読むのは今どうなっているかを掴むためで、仕様ではない。**
  仕様はオーナーの言葉。読んだ結果とオーナーの言葉が食い違ったら、
  **オーナーの言葉が正しい。**

  訊くのは、オーナーの言葉に入っていないことだけ。訊く前に必ず見る。
  **オーナーの言葉を言い換えて配らない。原文で配る。**
- Reason:

  ```
  お前みたいなカスが直して古いの消さないし、mdにも記載しないせいだろ
  そういう中途半端なことすんなよ責任持てや
  ```

  コードが当てにならないのは、直した人が古いものを消さず、md にも書かなかったから。
- Affected features: 無し
- Affected data: 無し
- Affected docs: この項
- Implementation status: 実施中

### オンボーディングは描くところから始まり、サインインで終わる
- Date: 2026-08-27 / 2026-08-28
- Area: オンボーディングの段の順番
- Decision:

  ```
  オンボーディング→最後にログイン
  ```
  ```
  そんなの俺頼んでねえぞ
  ```

  一つ目は 2026-08-27。二つ目は 2026-08-28、**扉が一歩目になっていたことに
  ついて**。

  1. **順番は 描く → アプリの中を歩く → 名前 → 扉。** サインインは最後の段。
  2. **扉に逃げ道は無い。** 2026-08-26 の「あとで」削除はそのまま生きている。
     この決定はそれを戻すものではない。

- Reason: 2026-08-26 に扉が一歩目へ動かされた（`b64c491`）。その根拠として
  書かれていたのはオーナーの 2026-08-26「言語はアカウントないと作れないです」
  だが、**それを「だから画面の一枚目が扉」と読み替えたのはそのセッションで
  あって、オーナーの言葉ではない。** オーナーが言ったのは言語が何を必要と
  するかであり、画面の順番ではない。上の 2026-08-28 がそれを名指しで否定して
  いる。**「言語はアカウントないと作れない」は取り消されていない** ── 歩き
  終わりの扉がその言語のアカウントになる、という形で両立する。
- Affected features: `www/onboard.js`（`OB_DRAW=0, OB_NAME=1, OB_IN=2,
  OB_TOUR=3`、`obName`/`obNameLater`/`obWhoGo`/`obFinish`）。`appIs()`
  （`www/shell.js`）に一行 ── **歩き回りの間は 'app'**。2026-08-27 が決めた
  三つの答えは一つも変えていない。扉が一歩目だった間、歩き回りは必ず
  サインイン済みで走っていたので `appIs()` は偶然正しかった。扉を最後に
  戻すと歩き回りはアカウントより先に走るので、この行が無いと**文字を描いた
  直後に扉が出る** ── オーナーが報告した画面が一歩あとに出ていた。
- Affected data: **何も消えず、新しく保存されるものも無い。** ただし
  **扉が最後になったことで、アカウントより先に文字と言語ができる** ──
  `obFinish()` が `netLangSync()` を呼ぶ。これが無いと、その人が描いたものは
  次の起動まで端末にしかない。
- Affected docs: `CLAUDE.md`（§Online）、`docs/STATE.md`、`docs/CHANGELOG.md`。
- Implementation status: **implemented。** `tools/open-check.mjs` が保持する ──
  空の `localStorage` から起動して画面を読む。`appIs()` は今回ずっと正しく
  `'ob'` を返していたので、`appIs()` を訊く検査では捕まらなかった。
  **ゲートには未接続**（`package.json` / `tools/gate.mjs` はリーダーのもの）。

### 特定商取引法の表記は出さない
- Date: 2026-08-26（読める場所は 2026-09-01・09-02 の二つが置き換えた）
- Area: 規約・プライバシーポリシー・特定商取引法に基づく表記
- Decision: **特商法の表記は出さない**（「出さない。」）。規約とプライバシーポリシーが
  読める道は**プラン画面**と**登録画面の面**の二つ ──「設定のアカウントの利用規約と
  プライバシーポリシー消しといて。課金の方にあるからいらん」OWNER 2026-09-01、
  「続けるとの説明は ok」OWNER 2026-09-02（サインアウト中でも読める）。
- Reason: オーナーの言葉のまま上に。仕組みの側で分かっていること ── App Store
  の課金は販売者が Apple（日本では iTunes K.K.）で、購入契約の相手も返金の窓口も
  Apple なので、App Store Connect は特商法のページを訊いてこない。必須で訊くのは
  プライバシーポリシー URL だけ。
- Affected features: `docRows()`（www/settings.js）。**二本のままで、三本目は
  作らない** ── これは変わっていない。呼ぶ場所が二度動いただけで、文書は二つの
  ままである。`planTerms()`（www/settings.js）と www/onboard.js の登録の面が
  呼ぶ。`docRows()` 自体は一つで、URL も `DOC_TERMS` / `DOC_PRIVACY` の一組。
- Affected data: **無し。** 保存するものは増えも減りもしない。
- Affected docs: docs/BACKLOG.md（§3 と §4 をこの決定に合わせる）、docs/apple.md
- Implementation status: **IMPLEMENTED** ── `docRows()` を `planTerms()` と
  `www/onboard.js` の登録の面が呼ぶ。三本目の文書は無い。二本は tokinets.com の
  `lingua/` にある（`docs/STATE.md`）。

### 運営ページのパスワードは、Apple/Google サインインでは出ない。そのままにする
- Date: 2026-09-02
- Area: `www/mod.js` `adminLocked()`
- Decision: **そのままにする。塞がない。**「どうせ俺しか使わんからいいよこのまま
  で」 OWNER 2026-09-02。
- What it is: `adminLocked()` は `netHow()==='email'` のときだけ true。つまり
  メールでサインインした人にはパスワードの画面が出るが、Apple / Google では
  出ず、7 回タップでそのまま開く。照合するパスワードが存在しないため。
  そのパスワード自体もアカウントのパスワードで、専用のものではない
  （`adminGo()` が `netSignIn(netMail(), …)` を投げ直しているだけ）。
- **穴ではない。**本当の壁は二つとも別にある ── @ が `lingua` でなければ
  7 回叩いても無反応（サーバーが答える。2026-09-03 まではこれが
  `profile.admin` という欄だった）、そして通報もスタッフ一覧も
  `is_staff()`/`is_admin()`（`supabase/schema.sql`）を通る。端末が嘘を
  ついても何も渡されない。このパスワードは「サインイン済みの端末を人に渡した
  ときの画面ロック程度」のもので、コードのコメントにもそう書いてある。
- Affected data: なし。Affected code: なし（変更しない、という決定）。
- **後から読んだ人へ:** これは見落としではありません。報告して、そのままにすると
  決まりました。生体認証などで塞ぐ話をするなら、まずオーナーに訊いてください。

### 売上とアナリティクスは RevenueCat で見る
- Date: 2026-09-02
- Area: 数字を見る画面／App Store Connect の API／管理画面の売上の欄
- Decision: **売上とアナリティクスは RevenueCat で見る。アプリの中では見ない。**
  「revenue cut入れたから、App Storeコネクトキーいらんわ」「RevenueCatで見るって
  話してるんだけど」 OWNER 2026-09-02。
- **2026-08-26 の決定「売上とアナリティクスを、アプリの中で見る」を置き換える。**
  下のその項は superseded。オーナーの言葉は「アプリの中で見るなんて一言も
  言ってないけど」。つまり下の Reason 行にある 〈アプリの中で見たい〉 は、
  **オーナーが言っていないのに鍵括弧が付いていた**。CLAUDE.md の
  「オーナーが言っていないものを「」で囲まないこと」が破られていて、それを
  読んだ私が今日そのまま信じ、オーナーに二度言わせた。
- **数字は一つも残さない。**「lingua内ではみないって言ってるだろ」 OWNER
  2026-09-02。①契約者数と売上 ②ダウンロード数 ③解約と継続 だけでなく、
  ④登録ユーザー数も管理画面から消えた ── その一言は Lingua の中で見るかどうか
  であって、Apple から来た数字かどうかではない。
- Affected features: `docs/FEATURES.md` § 8。管理画面に残るのは**通報とスタッフ**
  だけ。それは分析ではなく、運営そのものの作業。
- Affected data: 減らない。Apple の数字を置く表は元々作られていない。
  `admin_counts()` はサーバーに残り、通報の件数だけが読まれる。
- **Implemented 2026-09-02.** 消したもの ── `www/mod.js` の五ページと六行
  （~~`adminOpen`~~ ~~`adminGotTop`~~ ~~`adminMonthTop`~~ ~~`adminPlanTop`~~ ~~`adminView`~~
  ~~`adminGoTo`~~ ~~`adminAt`~~ ~~`adminAsc`~~ ~~`adminNow`~~ ~~`adminPurse`~~ ~~`adminPlans`~~
  ~~`adminPct`~~ ~~`adminMD`~~ ~~`adminMon`~~ ~~`adminOne`~~ ~~`adminWhenRow`~~ ~~`adminDays`~~
  ~~`adminMonths`~~、~~`ADMIN_ASC`~~）、`www/net.js` の ~~`netStore()`~~、
  `supabase/functions/appstore/`、`act-map` の ~~`adminGoTo`~~、十言語 × 11 の文言。
- Affected docs: `supabase/setup.md` § 10、`docs/FEATURES.md` § 8、
  `docs/BACKLOG.md`、`docs/apple.md`

### 【差し替え済み 2026-09-02】売上とアナリティクスを、アプリの中で見る（2026-08-26）
- 差し替えた決定: 「売上とアナリティクスは RevenueCat で見る」（2026-09-02）

### Decision
- Date:
- Area:
- Decision:
- Reason:
- Affected features:
- Affected data:
- Affected docs:
- Implementation status:
```

Entries below are transcribed from decisions the repository already records
verbatim, in `CLAUDE.md` and in the code comments that quote them. Nothing here
was inferred: where the wording is the owner's it is quoted, and where a
decision has never been made the row in `docs/FEATURES.md` says **open**
instead of appearing here.

### Decision
- Date: 2026-08-26 (同日、五つめ)
- Area: 匿名アカウントは無くなる。アカウントは一種類
- Decision:

  ```
  匿名アカウントはねえよ
  言語はアカウントないと作れないです
  ログインした人しか書けないけど
  二種類になる意味も分からないけど
  ```

  1. **匿名アカウントは無い。**「アカウント」はサインインした人のこと、一種類。
  2. **言語はアカウントが無いと作れない。**
  3. **書けるのはログインした人だけ。**
  4. **アカウントの種類を二つに分けない。**~~`has_account()`~~（アカウントがある）と
     `is_member()`（名前がある）の二本立ては**やめる。** 一本になる。

- Reason: 「二種類になる意味も分からないけど」。二本立ては匿名アカウントを
  置くために作られたもので、**匿名が無くなれば分ける先が無い。**
  区別が要るのは「まだ名前を決めていない人」を通すためであり、その人がもう
  居ない。
- Affected features: `www/onboard.js`（扉が唯一の終わり方 ── 済み）、
  `www/boot.js` の ~~`netAnon()`~~、`www/net.js` の `netSignedIn()`/~~`netMember()`~~/
  ~~`netAnonTok()`~~、`supabase/schema.sql` の ~~`has_account()`~~ と、それを使う
  `language` / `slice` の書き込みポリシー。
- Affected data: **無い。** 誰の作ったものも消えない。
- Affected docs: `CLAUDE.md`、`docs/FEATURES.md`、`docs/ARCHITECTURE.md`。
- Implementation status: **docs だけ。** コードは `claude/admin` が持つ。
  この枝で済んでいるのは、オンボーディングの「あとで」を消したことだけ
  （アカウント無しで歩きを終えられないようにした）。

#### これが置き換えたもの

2026-08-22「When somebody is asked who they are」── 匿名アカウントを起動時に
作り、身元を訊くのは投稿と課金の二箇所だけ、`is_member()` を二つに割る。
**下のその項目は【差し替え済み】の見出しと一行だけになっている**（2026-09-03
「古い規則は残さない」）。

### Decision
- Date: 2026-08-26 (同日、四つめ)
- Area: 決定が規則を置き換えたら、**その規則を直す**。決定ログに足すだけでは足りない
- Decision:

  ```
  古い規則残りすぎ
  新しいのにしたらルーるも直せよ
  そのせいで毎回古いルールに引っ張られてんじゃん
  ```

  ```
  歴史とかいいから消せよ
  ```

  **決定が既存の規則を置き換えたなら、その規則を同じコミットで直す。**
  決定ログに一件足して終わりにしない。

  そして直し方は**消すこと**である。「これは歴史です」と前置きして残さない ──
  残っていれば読まれる。それが「毎回古いルールに引っ張られてる」の中身。

  `docs/CHANGELOG.md` は別。あれは「その日そうだった」の記録なので
  書き換えない。**直すのは、今を語っている文だけ。**

- Reason: オーナーの三行がそのまま理由である。**規則は読まれるから効く。**
  古い規則が残っていると、次の人はそれを読んで従い、決定ログのほうは
  見に行かない。決定が「通った」のは、それを言っている文が全部直った
  ときであって、ログに一行入ったときではない。
- Affected features: 無い。これは書き方の規則である。
- Affected data: 無い。
- Affected docs: `CLAUDE.md`（§ Recording の隣）、このファイル。
- Implementation status: **書いた。** 同じ日に六箇所掃除した ──
  ゲートの本数（TESTING.md、17→26）、`CAN` の一覧（無い能力 `tr` が載り
  `edit` `badge` が抜けていた）、Studio、`localStorage` が唯一の置き場、
  語順の `SET.order`、そして「アカウント無しでも言語は作れる」。

### Decision
- Date: 2026-08-26 (同日、三つめ)
- Area: 設定にある「消す」は三つ ── データを削除 / 言語を削除 / ログアウト
- Decision:

  ```
  データを削除
  言語を削除
  ログアウトでしょ？
  ```

  **設定で人が消せるものは三つ。それ以上でも以下でもない。**

  | | 何が消えるか | 今 |
  |---|---|---|
  | **データを削除** | 全部。アカウント、サーバーの投稿・写真・録音、この端末の言語と設定、Documents のバックアップ、トークン | **在る。`wipeAll()`（`www/settings.js`）。既に全部やっている** |
  | **言語を削除** | その言語ひとつ。ほかの言語も、アカウントも残る | **無い。一行も無い** |
  | **ログアウト** | 何も消えない。トークンだけ | **在る。`setSignOut()` → `netOut()`** |

  一つめは前日の「アカウント消したら全部消えるに決まってる」がそのまま入る所で、
  **それは既に実装されている**（下）。三つめは既に在る。
  **無いのは真ん中だけである。**

- Reason: 「ログアウトでしょ？」── 三つが別のことだ、と言っている。
  全部消すのと、一つ消すのと、何も消さないのは、押す人にとって別の判断である。
  今は真ん中が無いので、**言語一つを捨てたい人が押せるのは「全部消す」しかない。**
- Affected features: `www/settings.js`（`wipeAll` の隣）、`vLangs()`
  （`www/home.js` ── 言語の一覧は行ごとに一つの言語なので、消す道はそこにもある）、
  `LANGS` と `langKeyOf()`（`www/core.js`）、`netDropMe()` の言語版
  （`language` 行と `slice` 行、`www/net.js`）。
- Affected data: 言語ひとつぶんの十二スライスと、`LANGS` の項目と、
  サーバの `language` / `slice` の行。**本人が言った場合に限る**ので
  `docs/DATA_SAFETY.md` の禁止には当たらない。
- Affected docs: `docs/FEATURES.md`、`docs/DATA_MODEL.md`。
- Implementation status: **「言語を削除」だけ未実装。** ほかの二つは在る。

#### 「言語を削除」を作る人が先に答えること

**決めない。オーナーに訊くこと。** ここに並べるのは、訊かずに書き始めると
どれかを黙って決めてしまう、という一覧である。

1. **最後の一つを消せるか。** 消せるなら、そのあとは `langFirst()` が
   空の言語を作る（それが「言語ゼロ」という状態がこのアプリに無いということ）。
   消せないなら、一覧の最後の行だけ押せない。
2. **サーバの行も消すか。** 「基本は全部サーバー管理」なら消す。
   消さないと、次に `netLangSync()` が走った瞬間 **`syMerge` が両方足して
   帰ってくる** ── 消したはずの言語が戻る。**ここは間違えると
   「消えない削除」になる。**
3. **バックアップの file はどうするか。** ~~`bkDropAll()`~~ は全部消す道しか無い。
   一つだけ消す道は無い。
4. **DL した言語を消すのは同じボタンか。** 読み取り専用の言語も一覧に並ぶ
   （2026-08-25）。消せて当然に見えるが、あれは自分の作ったものではない。
5. **確認は一度。** `wipeAll()` が iOS のダイアログで一度訊いている。同じ形。

### Decision
- Date: 2026-08-26 (同日、あと。上の「サーバーの範囲」への三つの答え)
- Area: アカウント削除は全部消える / 同期は常に / 費用はエンタープライズ
- Decision:

  オーナーの言葉のまま。

  ```
  アカウント消したら全部消えるに決まってる
  常に同期
  supabaseのエンタープライズで対応する予定
  ```

  1. **アカウントを消したら全部消える。端末の中も含む。**
     前日の「アカウント消したら残るわけがないあほだろ」をサーバの話と読んだのは
     **狭すぎた。**「全部」である。
  2. **同期は常に。** 言語の側の頻度は【差し替え済み 2026-09-04】── 差し替えた決定:
     「オンライン前提に切り替える。保存を押した瞬間にサーバーへ行く」（2026-09-04）。タイムラインは開くたび。

     **そして同じ日に中身が分かれた ──「タイムラインは開くたび / 言語は
     そういうわけじゃない」。** 「常に」は一つの時計ではなく二つである:

     ```
     タイムライン   開くたび          既にそう（vFeed → snsPull）
     言語           そういうわけじゃない  ＝ per-open ではない
     ```

     **言語の側は「〜ではない」しか言われていない。** 何であるかは
     言われていないので、ここには書かない。`docs/FEATURES.md` の行は
     **open** で持つ。書き起こすと、オーナーが否定しただけのものを
     肯定形にして決めてしまうことになる。
  3. **費用は Supabase のエンタープライズで対応する予定。**
     「人数に比例する」という問題は残るが、**それを飲む前提で範囲が決まっている。**
     費用を理由に範囲を狭める提案はもう要らない。

- Reason: 1 について ──「決まってる」。消したいと言った人に何かが残っているのは
  削除ではない、という一行がそのまま理由である。**これは `docs/DATA_SAFETY.md` の
  絶対規則と衝突しない**（下）。
- Affected features: `netDropMe()`（`www/net.js`）、`wipeAll()`（`www/settings.js`）、
  `netLangSync()` の撃ち方（`www/boot.js` にあった。2026-09-23 から起動では撃たない ──
  扉と人の保存だけ、`docs/scope/r60-up.md`）。
- Affected data: **人が作ったもの全部**。ただし本人が消せと言った場合に限る。
- Affected docs: `docs/FEATURES.md` § 8、`docs/DATA_MODEL.md`、
  `docs/PAID_FEATURES.md`、`docs/DATA_SAFETY.md`（私の持ち物ではない ── 報告に書いた）。
- Implementation status:
  **1 は入った。**`wipeAll()`（`www/settings.js`）が一度だけ訊いて、`netDropMe()`
  でサーバー、消し終えてから `wipeHere()` がその account の鍵（`lsWipeAcct()`）。
  **2 は 2026-09-04 の形**（保存の瞬間に上がる）。**3 はオーナーの側で、リポジトリには無い。**

#### `DATA_SAFETY.md` と衝突しないこと。ここが大事

`CLAUDE.md` の絶対規則は「Nothing a person made is removed because the current
shape does not need it, because it is an old format, to save space, or because
something was restructured」であり、**理由を四つ挙げて禁じている。**
「本人が消せと言った」はその四つのどれでもない。禁じられているのは
**アプリが勝手に決めること**であって、人が自分のものを捨てることではない。

**アカウントを消す行は一つで、自分が何を持っていくかを自分で言う**
（`confirm.wipe`、`www/i18n/`）。言語一つを消すのは別の行 ──「消す行の真ん中は
「この言語を削除」」（2026-09-03）。

**そして順番が要る。** 消す順を間違えると「消えたと言われたのに残っている」か
「消したいと言っていないものまで消えた」のどちらかになる。順番を決めるのは
実装する人の仕事だが、**確認は一度だけにすること** ── 二度訊くのは、一度目に
何を訊いたのか分からなくなるという意味である。`wipeAll()` は `popAsk()` で一度訊く。

### Decision
- Date: 2026-08-26
- Area: サーバーの範囲 ── 基本は全部サーバー。言語周りだけ file をバックアップに使う
- Decision:

  オーナーの言葉をそのまま置く。要約していない。

  ```
  サーバーの範囲決めようよそろそろ
  じゃないといつまでもこれになる

  基本は全部サーバー管理 言語周りだけバックアップにfile使う
  制作はオフラインでも可能次つながった時に更新される
  ```
  ```
  Xがローカル保存してんの？nolaとかの目もアプリもそういう話してんの
  ```
  ```
  言語はアカウントないと作れないです
  古い記載消してくれうざい
  SNS部分はオフラインでは動かないよそりゃそう
  アカウント消したら残るわけがないあほだろ
  ```

  同期の頻度とプランについては、オーナーの言葉として渡ってきたのは
  **「全部だって」の四文字だけ**である。「常に同期する／プランに関係なく全員
  サーバに載る」はそれをリーダーが開いたものであり、**オーナーの言葉ではない。**
  プラン無関係の方は 2026-08-22 の「クラウドは全員で」と同じことを言っているので
  独立に裏が取れているが、**「常に同期」は頻度＝しきい値の話であり、この一語から
  確定させていない。** `docs/FEATURES.md` の行は open として持つ。

  決まったこと:

  1. **基本は全部サーバー管理。** 「Xがローカル保存してんの？」── 普通の
     アプリはそうしていない、が理由である。
  2. 【差し替え済み 2026-09-04】差し替えた決定: 「バックアップのファイルも無くす。★の51件目は一番古いのを押し出す」（2026-09-04）
  3. 【差し替え済み 2026-09-04】差し替えた決定: 「オンライン前提に切り替える。保存を押した瞬間にサーバーへ行く」（2026-09-04）
  4. **SNS 部分はオフラインでは動かない。**「そりゃそう」。既にそう。
  5. **アカウントを消したら残らない。** サーバ側は既にそう ──
     `account_delete()` の cascade が profile・言語・投稿・follow・block を
     連れていく（`docs/FEATURES.md` § 8）。
  6. **言語はアカウントが無いと作れない。** オンボーディングの歩きだけが扉の前で
     作り、扉が最後の段で、歩きで作った物は扉で上がる（CLAUDE.md § Online）。
  7. **古い記載を消す。** 「アカウント無しでも言語は作れる」と書いてある所を
     消して、今そうであることを書く。

- Reason: 「Xがローカル保存してんの？nolaとかの目もアプリもそういう話してんの」
  ── **落とさないこと。** 次の人が「オフライン優先のほうが安全では」「ローカルを
  真にしたほうが速いのでは」と思いついたときに止まるのはこの一行である。
  普通のアプリはサーバを本体にしていて、この app だけ違う理由は無い、が理由。

  そして「じゃないといつまでもこれになる」── 範囲が決まっていないことそのものが
  費用だと言っている。決めない自由は無い。

- Affected features: `www/sync.js`、`www/net.js`（`netLangRow`/`netSlices`/
  `netSlicePut`/`netLangSync`）、`www/boot.js`、`www/backup.js`、
  オンボーディングの扉（`www/onboard.js`）、最初の言語が作られる所
  （`www/core.js` の最上位）。
- Affected data: 何も消えない。サーバに載る範囲が広がるだけであり、
  端末の写しはそのまま残る。**費用には効く** ── プランに関係なく全員のスライスが
  載るなら、ストレージと egress が人数に比例する（`docs/PAID_FEATURES.md`）。
- Affected docs: `CLAUDE.md`、`docs/FEATURES.md`、`docs/ARCHITECTURE.md`、
  `docs/DATA_MODEL.md`、`docs/PAID_FEATURES.md`、`docs/STATE.md`、
  `docs/CHANGELOG.md`（あれは足すだけ。書き換えない）。
- Implementation status: **IMPLEMENTED**（1・4・5・6・7）。2・3 は 2026-09-04 に差し替え。


### Decision
- Date: 2026-08-25
- Area: DL — 公式アセットの言語を取ってきて使う。取ってきたものは自分の言語には**入らない**
- Decision:

  オーナーの言葉をそのまま置く。要約していない — この四つが決定の本体であり、
  下の見出しはそれを拾い直しただけのものである。

  ```
  DLはplusからだけどplusは自分の言語+DL言語1個
  proは自分の言語3個+DL言語3個は？
  ホーム長押しで言語切り替えできる
  制作以外は変わらない感じは？
  shangoにしてるならそれ。変えたなら変えた。
  キーボードも言語変えたら変わる。でもアカウントは一つだからね？
  ```
  ```
  タイムラインは色んな言語を読める
  DLは例えばトキポナ使いたい人がすぐに使えるようにするための公式アセットを
  準備するってイメージだけど
  ```
  ```
  dlは公開非公開があるから、ホームの言語の概要ページに作った。
  そこでdlしてください。
  単語文字文法キーボードそれぞれ「解放できるかどうか選べる。
  それぞれdlしてください。
  もちろんダメです。トキポナに文字足したらトキポナじゃないです。
  だから公式で参加してくれってメール送ってんのよトキポナに。
  公式が提供してるアセットなんだからみんな使えるよ。でもlingua内ね？
  ぅ言うルール付なんだから。
  ```
  ```
  プロフィールのとこ長押しで言語切り替えだって
  ```

  拾い直すと、決まったのはこれだけである。

  1. **DL した言語は自分の言語に入らない。切り替える先である。**
     「自分の言語＋DL 言語」と二つに分けて数えているのがそのままの答えであり、
     「キーボードも言語変えたら変わる」も同じことを言っている — 入るのなら
     変わるものがない。
  2. **DL した言語は編集できない。**「もちろんダメです。トキポナに文字足したら
     トキポナじゃないです」。これは見た目の問題ではなく、**公式アセットが何であるか**
     の問題である。だから下の Reason を落とさないこと。
  3. **アカウントは一つ。**「でもアカウントは一つだからね？」
     言語を切り替えても人は切り替わらない。
  4. **単語・文字・文法・キーボードの四つは、それぞれ別に解放を選べ、
     それぞれ別に DL する。**一つのスイッチではない。
  5. **DL の場所はホームの言語の概要ページ。**「そこでdlしてください」。
     新しい画面を作る話ではない — 公開非公開が既にそこにあるからそこだ、と
     オーナーは理由を一緒に言っている。
  6. **切り替えはプロフィールのとこを長押し。**オーナーは一度「ホーム長押し」と
     言い、あとで「プロフィールのとこ長押し」と言い直している。**後の方である。**
  7. **公式アセットは誰でも使える。ただし lingua の中だけ。**
     「公式が提供してるアセットなんだからみんな使えるよ。でもlingua内ね？
      ぅ言うルール付なんだから。」
  8. **タイムラインは色んな言語を読める。** DL は読むためのものではない —
     読むのはもう無料でできる。DL は「使いたい人がすぐに使えるように」の方である。

  **決まっていないのはここである。数字を固めないこと。**
  「DLはplusから」は言い切りである。そのあとの数は
  「自分の言語3個+DL言語3個**は？**」と**問いで終わっている**。
  「制作以外は変わらない感じ**は？**」も同じである。
  問いを決定に書き換えない — このファイルの「決定をもっともらしい規則に
  読み直さない」はこの向きにも効く。`docs/FEATURES.md` の行は
  この二つを **open** として持つ。

- Reason: オーナーが理由を二つ言っている。どちらも落とさないこと —
  次の人が「もっと綺麗な形がある」と思いついたときに止めるのは理由の方である。

  **「トキポナに文字足したらトキポナじゃないです」** — だから読み取り専用なのであって、
  実装が楽だからではない。公式アセットは「その言語であること」が価値であり、
  編集できるトキポナはトキポナではない。「編集させてもいいのでは」と思いついた人は、
  この一行で止まること。

  **「だから公式で参加してくれってメール送ってんのよトキポナに。」** — 公式アセットは
  こちらが勝手に作るものではなく、向こうの公式に入ってもらうものである。
  これはリポジトリの外で起きる仕事であり、コードで先回りしてよいものではない。

- Affected features: ホームの言語の概要ページ（`www/home.js`、`wldSecDl()` の四つの
  解放トグルは `claude/wiki` が今作っている）、言語一覧 `vLangs()`（同じファイル、
  「読んでいる」の節が DL 言語の入る枠）、プロフィールの長押し（`www/me.js`）、
  `CAN.dl`と DL 言語の天井（`www/core.js`）。**今日入ったのは一つもない。**
- Affected data: `LANGS[id]` に「読み取り専用」を言うものが要る。今は無い —
  `LANGS` に書き込む三箇所（`core.js:115`、`core.js:140`、`backup.js:264`）は
  全部 `mine:true` であり、**編集できない言語は今このアプリに一つも存在しない**。
  人が作ったものは一つも消えない — DL は足すだけであり、自分の言語には触れない。
  `docs/DATA_MODEL.md` § 読み取り専用の言語。
- Affected docs: `docs/FEATURES.md`、`docs/DATA_MODEL.md`、`docs/PAID_FEATURES.md`、
  `docs/ARCHITECTURE.md`、`docs/STATE.md` § 3。
- Implementation status: **入っている。**`can('dl')` は plus（`CAN.dl`、
  `www/core.js`）、数は `dlCap()` が 0 / 1 / 3 で答え、`dlCount()` が
  `mine` の false を数える ── 作る天井（`langCap()`）とは別の天井で、互いに
  見えない。取ってきた言語は `langSeenAdd()` が `mine:false` で index に入れ、
  `vLangs()` が「読んでいる」の節に並べる。解放は章ごと（`wldSecDl()`、
  `www/home.js`）で、一つのスイッチではない。

  **数は 2026-09-02 の決定が決めた** ──「plusからです」。この項が
  〈`は？` で終わっているので決めない〉と書いた二つは、そちらで閉じている。

#### この決定がぶつかるもの二つ。ここで解決しない。

このファイルの「決定が既に書かれた規則と衝突したら STOP。両方を報告し、
自分で決めない」に従う。

**一つめ — 切り替えはプロフィールに置かない、と同じ日に決まっている。**
下の 2026-08-25「Making a second language — where the door is」はこう書いている —
「It is NOT moved onto the profile or behind the face; that was offered and turned
down.」「せっていからでいいよ」。今日の「プロフィールのとこ長押しで言語切り替え」は
これを真正面から踏む。二つは同じ日付であり、どちらが後かは日付では分からない。
両立する読み方はある（一覧は設定に残り、長押しはその上の近道）が、
**その読みはここで決めない。オーナーに訊くこと。**

> **2026-08-27 に訊いて、返ってきた。その読みで合っていた。**
> 「インスタと同じようにしたから出てくる。で切り替えタップしたらその言語にいく。
>  あかうんとは切り替えられないから、制作の中身だけ変わる」 **OWNER 2026-08-27**
>
> 一覧は設定に残り、プロフィールのタブの長押しが**同じ `langs` の頁**への
> 近道になった（`holdStart()`、`www/shell.js`）。二つ目の一覧は作っていない。
> **アカウントは変わらない** ── `langOpen()` は `lingua.me` も `lingua.sess` も
> 触らず、`vLangs()` は言語の名前だけを並べて顔を出さない。
> 下からせり上がる板ではなく**頁**である。`CLAUDE.md` の
> 「ページ遷移型にせず下からひょいって出すやつ」は**そのまま効いており、
> 例外は要らなかった** ── 頁は 2026-08-25 に既に作られていて、
> 足りなかったのは設定を通らずにそこへ行く道だけだった。

**二つめ — 公開と DL は 2026-08-19 に一度決まっている。**
`docs/FEATURES.md` § 4「Publishing and downloading」がそれで、今日のものと
三つ違う。① キーボードと文字の DL は**無料**だった（今日は「DLはplusから」）。
② DL したキーボードは**自分の棚に三つまで**並ぶと書いてあるが、今日の形では
DL は「言語一つ」として数えられ、キーボードはその中にある。
③ 08-19 は**人が人のものを**取る話、今日は**公式アセット**の話である。
同じ仕組みを使うが同じものではないかもしれない。
一つだけ合っている — 08-19 も「A downloaded dictionary is a language you can READ
and is never merged into your own」と言っている。**入らない、は二度決まっている。**
残りの三つは**オーナーに訊くこと。**

### Decision
- Date: 2026-08-23
- Area: 月と曜日のスロットは、番号ではなく世界の名前で呼ぶ
- Decision: 月の枠は「1月」「January」、曜日の枠は「日曜」「Sunday」。
  曜日は**日曜から**並べる。「1ってなに？1月 januaryとかでしょ」
  「曜日もサンデーからちゃんと示してよ」
- Reason: `www/cal.js` は既に「構造は世界のもの」と決めている ──
  年は十二ヶ月、週は七日、日曜始まり。「言語内で週の概念作ろうが、
  ウィジェットに表示するなら世界の概念でやるだろ」。構造が世界のものなら、
  三番目の月は March であって「3」ではない。
- Affected features: 文法の「月」と「曜日」の段（`phases.js` の `calMonthSlots`
  / `calWeekSlots`）
- Affected data: 何も増えない。スロットの**ラベル**だけで、作られる単語も
  その並びも変わらない
- Affected docs: `www/cal.js` の ~~`calSlots()`~~ のコメント、`docs/CHANGELOG.md`
- Implementation status: **入っている。**`calMonthSlots()` と `calWeekSlots()`
  （`www/cal.js`）が `cal.m.1`…`cal.m.12` と `cal.d.1`…`cal.d.7` を引き、
  十言語ぶんの 19 個が入っている。英語は January…December と
  Sunday…Saturday で、**曜日は日曜から**

**`cal.js` に食い違うコメントが残っていたが、実装と一緒に直った。**
「A month called "3" ... is the only honest label」と書かれていたのは、
**週や月の長さを言語が決められた頃**の理由で、同じファイルの頭がその設計を
既に取り消していた(「THE STRUCTURE IS THE WORLD'S」)。今は
`calMonthSlots()` の上が、その古い理由と、なぜ取り消されたかを書いている。

**十二ヶ月＋七曜 = 19 個の文言 × 十言語 = 190。** `Intl` で機械的に出す道も
あるが、i18n-check の鏡は「t() を通っていない平文」で落ちる ── そして
`t(pre+i)` のように接頭辞を引数で渡す形も、検査が読めない鍵になって落ちる。
だから十九本が二組、手で書き出してある。

### Decision
- Date: 2026-08-23
- Area: その日の一文 ── どこから来て、何語で出て、消せるか
- Decision:

  1. **一日一文、サーバーが持つ。** `prompt` テーブル（schema.sql に設計だけ
     あって使われていなかったもの）を使う。
  2. **書くのは Gemini。** 一日一回、一回の呼び出し。「全員同じのを1日1回
     おくだけならgeminiの無料で行けない？プロンプトガチガチにして」
  3. **日付はアメリカ時間の 0 時から。**「日付はアメリカ時間の0時から」
     太平洋時間で実装（Apple が App Store で使う時間帯）。夏時間も追う。
  4. **十言語で出す。** 見る人の UI 言語で。`text`(英語)は消さず、`says`
     という列を**足す**。「B. 十言語」
  5. **お題から開いた投稿は、意味を消せない。**「消せないようにしようそこ
     からのやつは。じゃないと意味ないもん」
  6. **繋がりはハッシュタグではなく列。** `post.prompt`。文字列は編集で
     切れるが、列は切れない。

- Reason: 全員が同じ文の意味を知っているから、読めない二百の文字の並びが
  読める二百の文になる。これが崩れる形（意味を消せる、言語ごとに別のタグ、
  端末ごとに違う文）はどれも機能そのものを無くす。
- Affected features: タイムラインの一番上の行、投稿の画面
- Affected data: `prompt.says`(新)、`post.prompt`(既存・未使用だった)、
  投稿と下書きの `pr`。端末に増えるものは無い
- Affected docs: `supabase/setup.md` § 9、`docs/CHANGELOG.md`、
  `supabase/schema.sql` § asked
- Implementation status: IMPLEMENTED（コード）。**サーバー側は未** ──
  ダッシュボードで鍵と関数と cron を入れるまで、お題は出ない（出ないときは
  これまで通りの書く行に戻るだけ）

**この決定は、`schema.sql` に書かれていた設計と一箇所ちがう。** `text` の行に
「English, and translated on the device」とあり、それは「全員が英語の一文を見て
訳すのが遊びそのもの」という設計だった。オーナーは 2026-08-23 に別の判断をした
── 日本語話者が英語のお題を読むのは翻訳を二回することで、二回目だけが遊びだから。
`text` は残してあるので、書かれていたものは失われていない。

### Decision
- Date: 2026-08-25
- Area: 無料で使えないものは、隠すのではなく見せる
- Decision:

  「無料はタップすると課金ページに飛ばされる」
  「だいたい無料で使えないやつは表示させていいよ。課金させる動線を減らしたく
   ない」

  **段が閉じている機能は、無料の画面にもそのまま出す。押すと料金の画面へ
  行く。** ボタンを消さない。

- Reason: オーナーの理由がそのまま書いてある ── 課金への動線を減らしたくない。
  見えないものは買えない。

  **これは `docs/PAID_FEATURES.md` に書かれていた「ボタンは減る、言葉は
  減らない」の、ボタンの側を裏返す。** 言葉の側は一文字も動かない ── 段の
  検査に落ちても、その人が作ったものは一つも消えないし一つも隠れない。変わる
  のは扉の見せ方だけで、絶対規則の後半はそのまま絶対のままである。

  **`capStop()` は含まない。**「5はいあってる」 OWNER 2026-09-03。あの関数に
  は「go('plans') をやめた」理由が書き残してある ── 単語を打っている途中の人
  から画面を取り上げて料金表に置くことになったから。あれは *計っている天井* に
  途中で当たる話で、ここで決まったのは *最初から閉じている扉* を押す話。押した
  人は「これが欲しい」と言っているのであって、途中で取り上げられてはいない。
  **天井はポップで訊いてから飛ぶ。扉は押したら飛ぶ。**
- Affected features: 段で閉じているものを描いているすべての画面。今回入るのは
  `postEdit()`（投稿の編集、`www/post.js`）と、言語をもう一つ作る扉
  （`www/home.js`）の二つ。
- Affected data: 無い。
- Affected docs: `docs/PAID_FEATURES.md`、`docs/FEATURE_RULES.md`。
- Implementation status: **implemented**, 2026-08-25, `claude/plans`。
  `plan-check` が持つ。

### Decision
- Date: 2026-08-25
- Area: The sheet takes a PDF and nothing else, for now
- Decision:

  「一旦写真禁止で、普通に pdf で提出以外受け取らないで行こう。
   今後のアプデで追加しよ」

  **The read side accepts a PDF only.** A photograph — jpg, png, a picture
  taken with the phone — is turned away, and the sentence says so. Photographs
  come back in a later update; nothing about them is deleted, only shut.

  `www/sheet.js` reads both today: `shPdfJpeg()` takes the page out of a PDF
  and the reader will equally take a plain image. What changes is which files
  are offered and accepted, not the reader underneath it.

- Reason: the owner's, and it is a shipping decision rather than a technical
  one. What was never measured is exactly the photograph case — a brush and a
  hard pencil, on paper, under a real camera — and 「紙が本当に精度高く
  できんのか」 was the question this whole road started from. A scan or a
  print-to-PDF has no camera in it: no lighting gradient, no perspective, no
  focus. So the half that is proven ships and the half that is not waits.
- Affected features: `www/sheet.js` — the read page, what the file chooser
  offers, and one sentence for a file that is not a PDF. `shPdfWhy()` already
  answers `photo` / `packed` / `drawn` / `not-pdf`, so the sentence has
  somewhere to come from.
- Affected data: none.

### Decision
- Date: 2026-08-25
- Area: Shipaton 2026 — the app ships to the App Store by 30 September
- Decision:

  「shipaton だそう。9／30 までには出したい」

  Lingua enters RevenueCat's Shipaton 2026 and the **first public version is
  on the App Store before 2026-09-30 23:45 Pacific**.

  The two rules that decide eligibility, read off the rules page rather than
  remembered: the app's first public version must go live between 1 August and
  30 September 2026 (an app already live anywhere before that window does not
  qualify), and it must use the RevenueCat SDK for at least one in-app
  purchase. **Lingua has never been publicly live** — TestFlight only, and
  build 86 was refused by Apple — so it clears the harder of the two.

- Reason: the money side is designed, priced and coded already, which is what
  most entrants have to build. What is actually on the critical path is not
  code: it is `docs/STATE.md` § 7 items 16, 16a–16d and 17, every one of them
  a console the owner alone can open, and **16a blocks all building**. After
  those comes an App Store review, which takes days and can fail — build 86
  already did (`ITMS-90158`).
- Affected features: `ios/App/App/LinguaStore.swift` gains RevenueCat in place
  of talking to StoreKit directly. The four product ids do not move.
  `tools/plan-check.mjs` holds twenty-odd claims about the current shape and
  will need re-pointing, not rewriting: **money decides what may be DONE and
  nothing about what exists** stays true through the swap or the swap is wrong.
- Affected data: none. A subscription is not a slice.

### Decision
- Date: 2026-08-25
- Area: A plan changes what happens when you press, not what you can see
- Decision:

  「普通に例えばキーボードを plus で5個以上追加しようとしたら pro の案内が
   出るみたいにさ、そのプランでできることできないことで UI 自体に変更が
   ない方が良くない？」

  **The screen is the same on every plan.** A ceiling and a closed door both
  show up at the moment somebody PRESSES, as a way to the plans screen — never
  as a button that is not there.

  This goes one step further than the decision recorded a few hours earlier
  the same day (「無料で使えないやつは表示させていいよ。課金させる動線を
  減らしたくない」), which was about closed doors. This is about ceilings too,
  and it says the same thing about both.

  **`capStop()` already IS this shape, and is the worked example.** The word
  ceiling asks with iOS's own `confirm()` — the sentence and the upgrade word,
  both already in ten languages — and goes to the plans screen on yes, and
  leaves you exactly where you were on no. It used to `go('plans')` outright
  and that was taken out for the right reason: it took the screen away from
  somebody halfway through typing a word. So the answer to the question
  `claude/plans` asked in ffd6022 is **no change is needed there**.

  **The first thing that is NOT this shape is `kb.full`.** Today
  `www/keyboard.js` says `toast(t('kb.full', KB_MAX))` and stops — a sentence
  with no way to the thing it is about. It becomes `capStop()`'s shape.

- Reason: the owner's, in one line — 「課金させる動線を減らしたくない」. You
  cannot buy what you cannot see, and a button that quietly is not there tells
  nobody anything.

  **What this does NOT touch, and the distinction is the whole of it.**
  `CLAUDE.md`'s money paragraph says a failed check means **fewer buttons,
  never fewer words**. The BUTTON half is what this decision turns over: there
  are no fewer buttons now either. The WORD half does not move by one
  character — a plan that lapses hides nothing anybody made, deletes nothing,
  and takes nothing out of a backup. `wordsSeen()` and the `letters` slice are
  untouched. That sentence in `CLAUDE.md` needs rewording to match, and
  rewording the head of that file is not a session's to do alone.
- Affected features: every screen that draws something a plan closes.
  Named today: `kb.full` (`www/keyboard.js`), `postEdit()` (`www/post.js`),
  the door to a second language (`www/home.js`), and the write road
  (`www/sheet.js`) once ~~`CAN.write`~~ exists.
- Affected data: none.

### Decision
- Date: 2026-08-25
- Area: Making a second language — where the door is, and what it does
- Decision:

  「アカウントが変わるイメージ。実際の sns はアカウント切り替えボタンある
   やん？あれが言語切り替えになるって感じ」「せっていからでいいよ」

  **A language is an account, and the language list is the account switcher.**
  Where the switcher is: 【差し替え済み 2026-09-12】── 差し替えた決定:
  「2026-09-12 朝の六つ ── 言語の切り替えはプロフィールへ、…」（2026-09-12）。

  What is added is one button at the **foot of that list**, where "add an
  account" sits in the app this is modelled on. Pressing it makes a language
  and opens it. Nothing is asked first: `langFirst()` already makes a nameless
  one and the onboarding already asks the name, so a second language arrives
  the same way the first did.

- Reason: the screen, the switching and the making all exist already.
  `langFirst()` mints the id, puts it in `LANGS` and opens it; `langOpen()`
  saves the one you are leaving, reads the new one in and calls `viewReset()`
  so you do not arrive in somebody else's language with your filter still on.
  What was missing was a door, and only a door.
- Affected features: `vLangs()` (`www/home.js`), a new act, ten strings, and
  **the language ceiling** — which lands in the SAME commit, because a door
  with no ceiling is unlimited languages on the free plan. Free 1 / Plus 1 /
  Pro 3, from the decision of 2026-08-23. It HIDES and never deletes
  (`wordsSeen()`'s shape); which one stays on free is 「2026-09-12 主言語」.

### Decision
- Date: 2026-08-26
- Area: The five patterns — each comes out the shape of a keyboard
- Decision:

  「qwartyとフリックだとサイズ違うでしょ？そういうのはどうなんの？」
  「フリックだけじゃなくて全部。」

  **Every pattern comes out at a real keyboard's proportions.** Measured on a
  390 × 844 phone, iOS is QWERTY 10 across (0.72:1), kana 5 (1.44:1),
  ten-key 4 (1.81:1) — all four rows, all about a third of the screen. Ours
  were flick 3 across (2.41:1, a 130 × 54pt letterbox) and tap and chart
  seven rows deep, half the screen.

  Three sentences do it:

  - **The keys that are not letters take a COLUMN, not a row.** On a short
    board a row of their own is a whole row, and a keyboard with no return is
    one nobody can send a message on. flick's fourth column and chart's last
    column carry delete, space and return down them.
  - **Letters go as few to a row as will hold them in four rows** (`kbPer()`),
    so the keys come out as big as they can. Four rows is the ceiling on how
    tall a keyboard is.
  - **And the count has to divide the ten evenly** — 1, 2, 4, 5 or 10
    (`KB_PERS`) — because a key is big by spanning whole columns, and a key
    that lands between two of them is one the letters across the top cannot
    name. Four is a kana keyboard, five a chart, ten a QWERTY.

  Every row a pattern builds comes to exactly ten. Measured on 390 × 844:

  | | before | after |
  |---|---|---|
  | qwerty | 10 keys of 39pt, 5 rows, 38% | unchanged |
  | flick | 3 keys of **130pt**, 3 rows, 25% | **4 keys of 97pt**, 3 rows, 25% |
  | tap | 5 keys of 78pt, **7 rows**, **51%** | 10 keys of 39pt, **4 rows**, **32%** |
  | tap face 2 | 5 of 78pt, 5 rows, 38% | **4 of 97pt**, 4 rows, 32% |
  | chart | 5 of 78pt, **7 rows**, **51%** | 6 of 59pt, **6 rows**, **45%** |
  | abc | 10 of 39pt, 4 rows, 32% | unchanged |

  **chart's grid is untouched**: its row count is the number of consonants,
  which is the language's and not ours. Only the column moved, and its keys
  take as many whole columns as fit with the remainder at the ends — the free
  QWERTY's nine-letter row, which is inset by half a key at each end, is the
  same trick.

- Reason: the editor is the preview and a pattern is where a keyboard starts,
  so a pattern that starts at a shape no phone has is the app handing somebody
  a bad keyboard and calling it a starting point.
- Affected features: `kbPer()`, ~~`kbRows()`~~, `kbFlickLay()`, `kbChartLay()`
  (`www/keyboard.js`). **Nothing stored changes and no existing keyboard
  moves** — only what a NEW board is made from.
- Implementation status: **implemented**, 2026-08-26, `claude/kb2`.

### Decision
- Date: 2026-08-26
- Area: How many rows a keyboard may have — it is the keyboard's HEIGHT
- Decision:

  「キーボードの高さ制限を決めたやん。キーの高さじゃなくてキーボードそのもの。
   だから行の列はそのキーボードの制限の範囲内で追加できるって話だけど？」

  **The ceiling is the keyboard's height, which is already decided, and the
  number of rows falls out of it.** It is not a number anybody chooses and
  there is no longer one written in the app.

  `KeyboardViewController` caps the whole keyboard at `mostOfScreen` of the
  screen — **half**, 「0.5が限界」 OWNER 2026-08-27, which replaced the 0.55 this
  entry was written with — a row at `rowPerWidth` of the phone's short side,
  and the edges plus the candidate bar at `8 + 44`; past the cap it SQUEEZES
  the rows rather than growing (「高さやめて、フリックなら日本語のサイズ、qwartyなら
  無料版のサイズくらいまでにしないとキツくない？」). So a row past the cap was
  never a row; it was every row on the keyboard getting shorter.

  **And a row is a KEY tall.** 「キーのサイズはiPhoneのサイズによって変わる
  んじゃないの？八行入っても小さかったら打ちにくいだけだぞ？」 The height
  follows the width at **0.1385 of the phone's short side** — 54 at 390pt — so a
  key keeps its shape everywhere.

  **The ceiling is ONE number, divided out of the SMALLEST phone** (320 × 568):
  `kbRowsMax()`, which gives **five** — the free QWERTY's own row count. A
  keyboard belongs to a language and a language moves between phones, so it is
  the width rule one axis over: rule 19 sets the width by the narrowest iPhone,
  not the phone in your hand.

  It was `KB_ROWS = 8`, invented in `www/keyboard.js` under a comment saying
  「nothing on the phone sets a height」 — which was not true when it was
  written. Eight is what only the largest phone has room for.

- Reason: two places were deciding how tall a keyboard may be and only one of
  them was enforcing it. Holding it in one place is the whole of this; the
  three numbers are the extension's, so **`tools/kb-check.mjs` reads them out
  of `KeyboardViewController.swift`** and fails if the two sides disagree — a
  comment naming the Swift file does not hold that, and a check that wrote
  `0.1385` down again would be a third copy. Putting `rowHeight` back to a
  flat `54` fails it as "no line matching", which is the shape that matters:
  the check breaks when the extension stops answering the question, not only
  when it answers differently.
  The candidate bar is assumed present because it nearly always is
  (`shareConv()` answers for an alphabet too) and because assuming it is the
  stricter of the two answers.
- Affected features: `rowHeight` / `rowPerWidth`
  (`ios/App/LinguaKeyboard/KeyboardViewController.swift`) and `kbRowsMax()`,
  `kbRowH()`, `kbRoomRow()`, `kbLayRoom()`, `kbFacePut()`
  (`www/keyboard.js`) — **nothing stored changes and no layout moves.**
  **The Swift half is NOT device confirmed**: it cannot be built or run from
  Linux. rule 19's "held on ADDING only" is unchanged and is what makes
  this safe: a keyboard built on a Pro Max and opened on an SE is left
  exactly as it is, and simply cannot be added to there.
- Implementation status: **implemented**, 2026-08-26, `claude/kb2`.

### Decision
- Date: 2026-08-26
- Area: The keyboard sheet's width — ten fixed columns, and a key spans them
- Decision:

  「フリックなのに qwerty サイズ」
  「qwartyはqwartyのサイズあるやろ　フリックとqwartyのキーのサイズは
   同じなんか？え？」

  They were. Measured on a 390px screen, a flick key and a QWERTY key were
  both **28.2 × 44** — the same pixel, on two keyboards that are nothing like
  each other on the phone.

  **The board is the full width and the grid is TEN COLUMNS, always. A column
  is a tenth and never moves. A KEY is big by spanning columns.**

  「行と列はエクセルのように数字振ったんだから、小さくなったら意味ないやん」
  「エクセルは足しても小さくならんやろ」

  This was got wrong once in between, and the wrong version is worth writing
  down because it is the obvious one: the grid was made as wide as the board's
  widest row, so a key WAS its share of that row. It gave the right key sizes
  and the wrong sheet — a column was a different width on every board, and
  taking one out made the nine that were left STRETCH, with the letters across
  the top going from ten to nine. Numbering columns `a b c` is what says they
  are fixed; a column that changes width is not an address.

  Ten fixed columns says both things at once. A flick key is `w 2.5` — five of
  the ten — so it comes out **97pt where a QWERTY's is 39**, and `a` is `a` on
  both boards. And the ceiling does the rest: a row that already comes to ten
  refuses another key, so nothing is ever made smaller to fit something in.
  `kbRoomFor()` has always said that; what was missing was a fixed width for it
  to be true against.

  **Every row a pattern builds comes to exactly ten**, with the space bar
  taking the slack on a bar row and gaps at both ends of a short one. That is
  what makes the sheet and the phone the same picture: the extension divides a
  row by its OWN total, and a row of ten drawn on ten columns is the same row.

  **This replaces the decision of 2026-08-25** — 「エクセルみたいにキーボード
  にやって横幅が固定されるはずだよ」 — only in where the fixed column comes
  from. That decision fixed the column at a tenth and let the BOARD be as wide
  as its columns made it, so a four-column board was a quarter of the phone
  across. The column is still a tenth; the board is now always the whole
  phone, and a short board is short rows on a full grid rather than a small
  sheet.

- Reason: the editor is the preview — there is no second picture of the
  keyboard beside it — so a key drawn at a width the phone will never use is
  the screen lying about the only thing it shows. It also settles a second
  report in the same line: a page somebody had just made was two keys wide,
  so the sheet was a fifth of the phone across and the dashed `＋` that adds
  a row to it was 60px against 320 on page one, which reads as 「8列も追加
  できるのに行は2ページ目から追加できない」. Rows could always be added; the
  thing to press was a sliver.
- Affected features: `kbSheetW()`, ~~`kbKeyW()`~~ and the `cols` `kbHTML()` draws
  on (`www/keyboard.js`), how every board narrower than ten columns is DRAWN —
  **nothing stored changes, no layout moves, only the drawing**. ~~`kbCellW()`~~ stays on the ten-key scale
  and is now only the 1/2/3 width palette, which is a palette of proportions
  and not a picture of a key: at true size on a three-key board those three
  tiles come to twice the screen, which is the fault
  `tools/side-baseline.txt` carried three lines of and which the 2026-08-25
  decision fixed. It stays fixed.
  Height is NOT part of this and is unchanged: a row is one height whatever
  the board is, so the sheet is the phone's shape across and not down.

### Decision
- Date: 2026-08-23
- Area: How many languages, how many keyboards, and two more capabilities
- Decision:

  | | languages | keyboards, in total |
  |---|---|---|
  | Free | 1 | 1 — the fixed QWERTY, which is not built and cannot be |
  | **Basic** | **1** | **1 + 3 = 4** |
  | **Plus** | **3** | **no ceiling** |

  Keyboards are counted **across languages, not within one**. Today ~~`KB_MAX`~~
  is three boards *per language*; from now the number is a pool. A language
  may hold all four of Basic's, or one each across Plus's three, or any other
  split.

  And two capabilities that exist in the app and were never in `CAN`:

  - **`edit` — editing a post you have already sent. Basic and up.**
    「ツイートの編集も課金から」「課金からはベーシックからってことね
    プラスならプラスっていうから」 `postEdit()` today asks nothing about a
    plan: anybody may edit their own post.
  - **`badge` — the mark beside your name. Plus only.** 「バッチはplusから」
    `planBadge()` already shows it only on Plus, but it reads `plan()`
    directly instead of going through `can()`, which is the one thing `CAN`
    exists to stop.

  So this lands with `words` `kb` `letters` `wsys` `snd` `edit` on the middle
  rung and `gram` `dir` `data` `file` `badge` on the top one. **How many `CAN`
  holds is read off `CAN`** — `npm run dead` prints it — because a number
  written here is a prediction, and both of the predictions this line used to
  carry were wrong within the fortnight.
- Reason: the numbers were arrived at by asking what a keyboard actually IS
  in this app rather than by picking a number. **A keyboard is layers** — ABC
  and あいう are two faces of ONE board, and 「qwertyでも数字で切り替えたり
  するやん？」 is why. So more boards is not how somebody gets more keys; it
  is only how they get a different ARRANGEMENT, and there are five of those
  (`qwerty` `flick` `tap` `chart` `abc`). Most people will build one. Four is
  past what nearly anybody reaches, which is the point: **the ceiling that
  sells is the one that binds** — a hundred words binds on the first evening,
  a–z with nothing addable binds the moment somebody wants a letter. A
  keyboard count binds almost never, so Basic's four is generous on purpose
  and Plus's absence of one costs nothing to give.

  A language is the same argument one step out: this app is for making ONE
  language deeply — the dictionary, the letters, the writing system, the
  keyboard, the calendar all stack onto one. Three is there for the person who
  wants a second and a third, not as the thing being sold.
- Affected features: ~~`KB_MAX`~~ (a per-language ceiling then, a pool now, and
  gone entirely on Pro), a new language ceiling that does not exist at
  all today, `postEdit()`, `planBadge()`.
- Affected data: none. Somebody over a ceiling keeps everything — every
  keyboard, every language — and simply cannot add another. ~~`backup-check`~~
  holds this for keyboards already.
- Affected docs: `docs/PAID_FEATURES.md`, `docs/FEATURES.md`.
- Implementation status: **the keyboards are built** (2026-08-23,
  `claude/save`): `kbCap()` in `www/core.js`, `kbCount()` / `kbRoomKb()` in
  `www/keyboard.js`, `CAN.kb` at `plus`, ~~`KB_MAX`~~ gone. Held by `plan-check`.
  **The language ceiling, `can('edit')` and `can('badge')` are all built now** --
  `langCap()` beside `kbCap()` in `www/core.js` (1 / 1 / 3, with `langStop()`
  as the refusal), `CAN.edit` at `plus` with `postEdit()` asking `can('edit')`,
  and `CAN.badge` at `pro` with `postBadge()` asking `can('badge')` instead of
  reading `plan()`. `dl` was added on 2026-09-02. `noads` は 「広告は Twitter と同じ形 ── 投稿に擬態して右上に PR、枠は売れる形、今は AdMob、pro は無し」（2026-09-23） で
  `CAN` に入り、pro に付く。

  **数えるのはアカウントです。**「は？端末の話なんかしてねえだろ」「だから端末で
  やるわけねえだろ」 OWNER 2026-09-03。この app に「端末ごと」という単位は
  ありません（`CLAUDE.md` § Online）。`langCount()` はサーバーの答え
  （`language?owner=eq.<me>`、`LMINE`）を数え、誰の言語かは `langOwnOf()` が
  `language.owner` で答えます（CLAUDE.md 規則 22）。
  アカウントを共有して数を増やすのは規約の話で、コードが追うものではない
  ── 「普通に共有は規約違反でしょ」。

### Decision
- Date: 2026-08-23
- Area: What the tiers are called
- Decision: **Free / Plus / Pro.** They were Free / Basic / Plus.
  「ベーシック、プラスって名前どう思う？なんかどっちが上かわかりにくくない？」
  「フリープラスプロがいいかなー」

  | was | is | price |
  |---|---|---|
  | Free | Free | — |
  | **Basic** | **Plus** | $4.99 / $49.99 |
  | **Plus** | **Pro** | $9.99 / $99.99 |

  Nothing about what each buys changed. Only the words did, and the stored
  value with them: ~~`SET.plan`~~ and the Keychain hold `free` / `plus` / `pro`,
  and the product ids are `com.tokinets.lingua.plus.*` and `...pro.*`.
- Reason: ~~`Basic`~~ is what most apps call their FREE tier, so the confusable
  pair was Free and Basic rather than Basic and Plus — and the order was
  inferrable rather than obvious. `Free < Plus < Pro` needs nobody told which
  is which, and all three words survive untranslated in the ten languages,
  which plan names have to (they do not go through `t()`).
- Affected features: `PLAN_ORDER`, `CAN`, `wordCap()`, `PLANS`, `planBadge()`,
  the plans screen, `LinguaStore.swift`'s product map, every ~~`SET.plan`~~ in
  `tools/`, and the nine `plan.plus.*` keys in ten language files, which are
  `plan.pro.*` now.
- Affected data: **one value, moved once.** A phone already holding
  `plan: 'plus'` wrote it while Plus was the TOP tier; read in the new world
  it would be the middle one. ~~`planMigrate()`~~ in `www/core.js` moves it up
  and writes `SET.planV = 2` so it can never run twice — after this `plus` is
  a real middle tier and must be left alone. ~~`SET.planWas`~~ carries a plan name
  too and moves with it, or the next ~~`capLapse()`~~ would announce a step
  nobody took. On a phone the Keychain is written again, or the next launch
  would hand back the old word.

  **Nobody had bought anything** — no product existed in App Store Connect on
  the day — so the only value this can find is one somebody set by hand, and
  moving it up gives them back what they had rather than more.
- Affected docs: `docs/PAID_FEATURES.md`, `docs/apple.md`, `docs/STATE.md`,
  `docs/BACKLOG.md`. **The decision entries above are left as they were
  written**: they are a record of what was said on the day, and rewriting them
  would be rewriting what the owner said. This entry is the mapping.
- Implementation status: **done**, 2026-08-23, `claude/save`. Held by
  `plan-check` (45 claims, the rungs read off `CAN`) and `migrate-check`.

### Decision
- Date: 2026-08-23
- Area: How many keyboards, said again because the file said it twice
- Decision: **Free 1 — the fixed QWERTY. Basic 1 + 3 = 4. Plus no ceiling.**
  Counted as a **pool across languages**, not per language.
  「1,1+3.無制限って言わなかったっけ？」
- Reason: this file carried two answers written the same day — the § above
  said 4 in a pool and Plus with no ceiling, and the `CAN` table below it said
  Basic 1 and Plus 3. A session that was about to move `can('kb')` down to
  Basic stopped on it instead, because a door opened without its number would
  have given Basic the three ~~`KB_MAX`~~ hands out today, which is neither
  answer. The owner named the first one. The table below now says the same
  thing, so there is one answer in this file again.
- Affected features: ~~`KB_MAX`~~ in `www/keyboard.js` — a per-language constant
  today, a per-plan number counted across languages from now — and
  `CAN.kb`, which moves from `plus` to `basic`.
- Affected data: none. Somebody over the ceiling keeps every keyboard and
  simply cannot add another. ~~`backup-check`~~ holds that already.
- Affected docs: `docs/PAID_FEATURES.md`, `docs/BACKLOG.md`.
- Implementation status: **built, 2026-08-23, `claude/save`.** It was deferred
  because `www/keyboard.js` was another branch's; that branch has not touched
  the file since 2026-08-15 and no live branch is in it, which was checked
  before starting rather than after a merge failed. `kbCap()` sits beside
  `wordCap()` in `www/core.js` (1 / 4 / Infinity), `kbCount()` in
  `www/keyboard.js` sums the built keyboards across `LANGS` -- the open
  language from memory, every other one through `kbBoardsOf()` so an older
  single-keyboard file counts as the one it is -- `kbRoomKb()` adds the QWERTY
  as the 1 in 1 + 3, and `CAN.kb` moved to `plus` in the same commit. ~~`KB_MAX`~~
  is gone. Seven claims in `plan-check`; three bugs put back and watched.

### Decision
- Date: 2026-08-23
- Area: A third plan, and what pays for the free one
- Decision: **Three plans, and the prices are settled.**

  | | month | year |
  |---|---|---|
  | Free | — | — |
  | **Basic** | **$4.99** | **$49.99** |
  | Plus | $9.99 | $99.99 |

  **Basic buys: adding letters, ONE keyboard of your own, a thousand words,
  a writing system that is not an alphabet, and choosing what a letter
  sounds like.** 「文字+キーボード自由（1個）単語1000までとか」
  「音と音節文字とか選べるだけかな その他は＋から」

  So the whole of `CAN`, settled:

  | | Free | Basic | Plus |
  |---|---|---|---|
  | `letters` add / name / delete | — | **yes** | yes |
  | `kb` a keyboard of your own | 1 (the fixed QWERTY) | **1 + 3 = 4** | **no ceiling** |
  | `words` | 100 | **1000** | no ceiling |
  | `wsys` syllabary, abjad, abugida, logography | — | **yes** | yes |
  | `snd` choose the sound, not the letter's own | — | **yes** | yes |
  | `gram` a grammar stage of your own | — | — | yes |
  | `dir` which way it is written | — | — | yes |
  | `data` CSV out, and the cloud | — | — | yes |
  | `file` a list brought in as a file | — | — | yes |
  | `noads` | — | — | **yes** |

  **`noads`**: 「6いまはいい」（2026-09-03）の方は【差し替え済み 2026-09-23】──
  差し替えた決定: 「広告は Twitter と同じ形 ── 投稿に擬態して右上に PR、枠は売れる形、今は AdMob、pro は無し」（2026-09-23）。`CAN.noads` は pro。

  **`words` and `kb` are the two that stop being yes/no.** Everything else in
  that table is a door; those two are a number, and the number is the plan's.
  `can()` cannot answer them alone any more.

  **Ads are on Free AND Basic. Plus is what has none.**
  「ベーシックも広告表示させるよ？＋から広告非表示で考えてた」

  **No banner. The ad sits IN the timeline, wearing a post.**
  「バナーはつけない。ツイート擬態」

- Reason: the ladder reads in one line — Free is your own shapes for a–z,
  Basic is your own letters and your own keyboard, Plus is everything and no
  ads. "Remove the ads" is a reason to buy that everybody understands without
  being told what a syllabary is.
- Affected features: `CAN` (a third level, and a new `noads`), `FREE_LIMIT`
  and ~~`KB_MAX`~~ (constants today, per-plan from now), ~~`capLapse()`~~ (one road
  today — "back to free" — two from now), the plans screen, StoreKit.
- Affected data: none. Nothing about a plan may change what is stored:
  somebody at 1500 words dropping to Basic keeps all 1500 and simply cannot
  add — 「判定が失敗しても減るのはボタンであって言葉ではない」. Same for a
  third keyboard.
- Affected docs: `docs/PAID_FEATURES.md`, `docs/FEATURES.md`, `docs/apple.md`.
- Implementation status: **the rung is in; the card and the numbers are not.**
  2026-08-23, `claude/save`.

  In: `PLAN_ORDER` and a laddered `has()` in `www/core.js` — a level is met by
  the plan that names it and by every plan above it — and `CAN` sits on the
  three rungs the table says, except `kb` (see below). `wordCap()` is the word
  ceiling as a number rather than a constant: 100 / 1000 / none. Held by
  `tools/plan-check.mjs`, with the ladder broken into an equals sign and the
  ceiling flattened to one number, both watched failing.

  Not in, and each for a reason that is not "no time":
  - **Basic is not on sale.** Its price is in no language file and no
    subscription for it exists in App Store Connect. `PLANS` still sells Free
    and Plus, which is what can actually be bought.
  - **`kb` has not moved down to Basic.** How many is a number, and the two
    decisions of this day disagree about it — 4 in a pool against 1, and no
    ceiling against 3. `docs/BACKLOG.md` has both sides. Opening the door
    without the number would give Basic the three ~~`KB_MAX`~~ hands out today,
    which is neither answer.
  - **`edit` and `badge` are not in `CAN`.** `postEdit()` and `planBadge()`
    are both in `www/post.js`, which belongs to another session today, and
    `dead-check` refuses a capability nothing asks for.
  - The language ceiling does not exist at all yet.

  Plus's prices are in `www/i18n/*.js` already; Basic's are nowhere. The
  leader's proposed order is **Basic first, ads second** — Basic needs no
  native code at all, and until the ladder exists there is nowhere for
  somebody who wants the ads gone to go.

### Decision
- Date: 2026-08-23
- Area: How the ad is built, and the one thing that turned out not to be true
- Decision: The ad is **AdMob Native Advanced**, read by Swift, with the
  MATERIALS handed to the web side, and **Lingua draws the row itself** in the
  shape a post has. Not a banner, not an SDK-drawn card.
- Reason: measured against `natsuaya82-crypto/jjjj`, which already ships ads,
  rather than guessed.

  What carries over: the AdMob account and its ad unit ids, the ATT call, the
  initialisation, and one shape worth copying outright — ~~`adsDisabled`~~ is
  checked **immediately before display**, not only at the call sites, because
  a save loading asynchronously can otherwise let an ad appear for somebody
  who has already paid.

  What does NOT carry over: **jjjj is Vite + React and Lingua has no
  bundler.** jjjj says `await import('@capacitor-community/admob')`; Lingua
  cannot. That is smaller than it looks — `Capacitor.nativePromise('X',
  'method', …)` reaches a registered native plugin without the JS wrapper,
  which `LinguaShare` and `LinguaPlan` both learned the hard way.

  **But `@capacitor-community/admob` 8.1.0 has no native ads at all.** Its
  dist carries banner, interstitial, reward, reward-interstitial and app-open
  and nothing else — checked by fetching the package, not from memory. So the
  Native Advanced reader is ours to write: `GADAdLoader` in Swift, materials
  out through `nativePromise`.

  The word that says what it is: 【差し替え済み 2026-09-23】── 差し替えた決定:
  「広告は Twitter と同じ形 ── 投稿に擬態して右上に PR、枠は売れる形、今は AdMob、pro は無し」（2026-09-23）（右上に PR）。
- Affected features: a new `LinguaAds` on the native side; the feed inserting
  a row every N posts; `press` (an ad row must carry no button of ours).
- Affected data: none.
- Affected docs: `docs/apple.md` (a second AdMob app, ATT, the privacy
  manifest).
- Implementation status: **IMPLEMENTED** ── `ios/App/App/LinguaAds.swift` が素材を読み、
  行はタイムラインが描く（2026-09-23 の項の状況を見ること）。

### Decision
- Date: 2026-08-22
- Area: Two keyboards. The free one is frozen, the paid one is free
- Decision: 「だから無料は凍結、有料は自由にだろ。キーボード設定で入れ替えも
  できるんだから。有料は有料キーボードでしかいじれない。無料の文字も
  入れれる。これだけじゃないの？」

  There are two keyboards and they are different things.

  **The free QWERTY is frozen.** The slots are on it, in the order QWERTY puts
  them, and there is no editor. Nothing on the paid side reaches it. A slot's
  name never changes — wanting a different `a` means **redrawing it**, because
  the drawing is what a letter is.

  **The paid keyboard is free.** Keys are arranged and swapped in its editor,
  and it takes **any letter — one somebody added, or one of the free slots.**
  Nothing about a letter's name restricts it.
- Reason: they are not one feature with a plan gate across it. The free QWERTY
  exists because the free alphabet is exactly a–z, `!`, `?` and the digits, so
  a keyboard can be had with no editor and nothing to set. The paid keyboard
  is a thing somebody builds. Rules that hold one do not belong on the other.
- **Two wrong turns are written down so they are not taken again.**
  1. *"Decide what a slot IS by its name."* That made a letter somebody ADDED
     and typed as `a` into a slot, permanently unrenameable — measured:
     `ltSetRoman(added,'a')` took it and `ltSetRoman(added,'q')` afterwards did
     nothing. 「+したら変えられないのはおかしい」
  2. *"Reserve the slot names, so nothing else may be called `a`."* Proposed
     and refused: 「足した文字もキーボードに設定はできるやん」. The code agrees
     — a paid key binds a letter's **id** (`key.v = lid`), never its name, so
     an added letter goes on a paid keyboard whatever it is called. Reserving
     would have restricted the paid side for the free side's convenience,
     which is the opposite of 有料は自由.
- The case that kept being reported as a defect, and is not one: a paid
  language where somebody drew a letter, called it `a`, and then dropped to
  free. `ltStart()` sees the name taken, makes no slot, and that letter is the
  free `a` key. **That is the letter they drew and named, on the key they
  named it for.** The defect the backlog entry was actually about is the
  opposite — a slot RENAMED away, leaving a key nothing could find and an
  empty letter filling the hole — and a slot cannot be renamed now.
- Affected features: the letter page's name field; the free QWERTY; the paid
  keyboard editor.
- Affected data: none. No field is added and nothing stored changes.
- Affected docs: `docs/BACKLOG.md`.
- Implementation status: **in, and nothing further is owed.** `ltSetRoman()`
  refuses to rename a slot; nothing restricts a letter somebody added.
  `base-check` holds both: a slot keeps its name on the paid plan, and a
  letter somebody added is still theirs to name.

### Decision
- Date: 2026-08-22
- Area: The free slots' names, and what paid buys
- Decision: 「無料で作ってる範囲の名前変更は無しでしょ。有料は追加できると
  いうだけで。無料分のキーボードはもういじらない」

  **The twenty-eight slots and the digits may not be renamed, on any plan.**
  a–z, `!`, `?` and one digit per value of the base are what a free language
  starts with, and their names are what they are. Paid does not buy the right
  to change one; **paid buys ADDING letters**, which is `can('letters')` and
  is a different sentence.

  And: **the free keyboard is finished.** No further work on it.
- Reason: the free QWERTY finds its keys BY NAME — `kbNamed('a')` walks
  `LETTERS` for one called `a` — so a renamed slot is a key that cannot be
  found, and `ltStart()` then fills the hole with a new empty letter. The
  letter somebody drew is still in the alphabet and is no longer on the
  keyboard, with nothing anywhere saying why. Making the name unchangeable
  dissolves that: a name that cannot move cannot be lost.

  This is **not** "the paid screen is restricted by a plan the person is not
  on", which is how `docs/BACKLOG.md` framed the same option and why it read
  as expensive. A slot's name is not something anybody was ever offered.
- Affected features: the letter page's name field, the free QWERTY, import.
- Affected data: none. Nothing stored changes; a name that was already
  changed on a letter stays as it is — this decides what may happen from now,
  and CLAUDE.md's data rule says the past is not rewritten to match a new
  rule.
- Affected docs: `docs/BACKLOG.md` — the "A renamed letter loses its key on
  the free plan" entry closes on this.
- Implementation status: the letter page already hides the field —
  `ltIsBase()` in `letters.js` and `can('letters') && !ltIsBase(l)` in
  `sound.js`, with the owner's earlier words on it quoted there
  (「無料で作ったやつを改名できなければ良くない？」). What was NOT in was the
  rule itself: `ltSetRoman()` did not refuse, so the screen was the only thing
  holding it. Now guarded at the function, and `base-check` holds it.

### Decision
- Date: 2026-08-22
- Area: Names — a verb is allowed to be a family, and a chapter may not be
  spelled two ways
- Decision: Three rulings, made together because they are one question asked
  three times.

  **(1) A consistent verb family is a legitimate prefix and is not to be
  broken up.** `save*` is exactly ten functions — `saveKb` `saveLetters`
  `saveMe` `saveNote` `saveNotes` `savePosts` `saveSnd` `saveStg` `saveWld`
  ~~`saveWord`~~ — and every one of them names what it saves. It stays as it is.
  `del*` (~~`delNote`~~, `delWord`) stays for the same reason. Nobody is to
  "fix" two members of a family into a chapter prefix and leave the other
  eight; that is the tangle, not the untangling. **`docs/BACKLOG.md` was
  wrong to list `savePosts` and `saveMe` beside ~~`postsRead`~~** — those two are
  not a `posts*`/`post*` collision, they are `save*`, and only ~~`postsRead`~~ is
  the thing the entry was actually about. ~~`postsRead`~~ → ~~`postRead`~~ (r79: the posts are read by the account's container, `www/core.js` § ACCT).

  **(2) `gh*` in `glyph.js` is `ge*`'s and is renamed `geHint*`.** The ten
  functions are the silent demo canvas inside the glyph editor — an arrow
  replaying three points closing into a shape, and a before/after of the ○ /
  fill / new-stroke buttons. It draws no text at all, which is why it is
  right in ten languages. It is not grammar (`g*`) and it is not the editor
  itself, so: ~~`ghDemo`~~ ~~`ghDraw`~~ ~~`ghEase`~~ ~~`ghField`~~ ~~`ghInk`~~ ~~`ghMount`~~ ~~`ghPos`~~
  ~~`ghSeg`~~ ~~`ghShow`~~ ~~`ghTick`~~ → `geHint*`. Its uppercase globals take ~~`GE_`~~,
  which ~~`GE_MAXPTS`~~ already established in the same file: ~~`GHINT`~~ ~~`GHP`~~
  ~~`GHTAP`~~ ~~`GHCYC`~~ ~~`GHDCYC`~~ ~~`GHDEMO`~~ → `GE_HINT` `GE_HINT_P` `GE_HINT_TAP`
  `GE_HINT_CYC` `GE_HINT_DCYC` `GE_HINT_DEMO`.

  **(3) `note*` in `notes.js` is the chapter spelled long, and goes to
  `nt*`.** ~~`noteRead`~~ ~~`noteCut`~~ ~~`noteHead`~~ ~~`noteBody`~~ ~~`noteAt`~~ → `nt*`, and
  ~~`notesFound`~~ → `ntFound`. `openNote` and `vNotes` are untouched — `open*`
  and `v*` are named in CLAUDE.md — and `saveNote` `saveNotes` ~~`delNote`~~ are
  untouched by (1).
- Reason: the Names rule exists so that 500-odd globals in one namespace stay
  findable, and a ten-member verb family is findable. CLAUDE.md's own prefix
  list already admits one: `open*` is twenty functions and is a verb, not a
  chapter. So a verb family is not an exception being invented here — it is
  the rule as already written, said out loud. What the rule is actually
  against is **one chapter under two names**, which is what `posts*`/`post*`
  and `note*`/`nt*` are, and what `gh*` is a third form of: a prefix that
  names no chapter at all.
- Affected features: none. All three are renames; behaviour does not change,
  and a rename that changes behaviour is not a rename.
- Affected data: none. Nothing stored is named by any of these.
- Affected docs: `docs/BACKLOG.md` — the "a rename is not a fix" entry is
  corrected on the `savePosts`/`saveMe` half and struck as each part lands.
- Implementation status: ~~`wSetFil`~~/~~`wSetSort`~~ → `wordsSetFil`/`wordsSetSort`
  landed (yoo). The three above are assigned and not yet in.

### Decision
- Date: 2026-08-22
- Area: Shape — a fifth banned thing, and row height
- Decision: **No rounded box.** 「角丸やめろ」 Nothing new carries a corner
  radius, a border, or a filled panel — button, banner or notice. `.btn.ghost`
  where a button is wanted; a plain row where one is not. And **every row in
  one list is the same height**: the row class sets `font-size` and
  `line-height` itself, and no row gets a `margin-top` to make a group.
- Reason: it was broken three times in one afternoon after being pointed out
  twice — a gold pill on the frozen screen, a bordered strip across Home, a
  gold pill on the password screen. The class comment on `.btn.ghost` has
  said it since it was written: 「文字書いて四角で囲ったみたいなボタン全部やめて
  くれ。ダサすぎる」. The height half is the same afternoon: `.set` left the
  type to the tag, so a `<button>` row was 49px and an `<a>` row 57px in the
  same list.
- Affected features: every screen from here on. `.btn` is still on about
  thirty older ones and is not being swept; it is simply not reached for
  again.
- Affected data: none.
- Affected docs: `CLAUDE.md` § Shape.
- Implementation status: **done** for everything added on 2026-08-22.

### Decision
- Date: 2026-08-22
- Area: Explaining — the rule, narrowed rather than lifted
- Decision: **Necessary explanation is written, and kept to the minimum.**
  「必要な説明は書いてね。みてわからないのが一番ダメ。最低限ね」 The ban
  stands everywhere it stood: a screen still does not describe what a setting
  means, does not sell a paid plan, and does not tell somebody what to tap.
  What is now allowed is the sentence a screen needs in order not to be a
  mystery — where the app has DONE something to somebody and the screen would
  otherwise be a state with no cause and no way out.
- Reason: the frozen screen is the case that settled it. The buttons are
  gone, the timeline is gone, and a heading saying "Account suspended" leaves
  somebody unable to tell a suspension from a broken app — and with nowhere
  to say it is wrong. Not knowing is the worse failure.
- Affected features: the frozen screen (`vFeed`), and any screen after it
  that takes something away.
- Affected data: none.
- Affected docs: `CLAUDE.md` § Explaining, `FEATURE_RULES.md`.
- Implementation status: **done for the frozen screen** — a heading, one line
  saying what is off, and the way to appeal. Nowhere else has been touched,
  and nowhere else may be without this test: has the app taken something
  away, and would the screen otherwise be a mystery.

### Decision
- Date: 2026-08-22
- Area: A frozen account, seen by everybody else
- Decision: **Their posts come off the timeline and stay on their own page**,
  and their page says the account is frozen instead of showing them. Nothing
  is deleted or hidden on the server. 「タイムラインから外す、プロフィールから
  は凍結してますの表示。ツイートは自己責任で見れるようにするのは？」
- Reason: a freeze can be lifted, so nothing may be destroyed — everything
  comes back by itself the next time the server is asked. Taking the posts
  off the timeline is what stops a frozen account going on being read by
  people who did not go looking; leaving them on the page is what stops a
  freeze being a deletion.
- Affected features: `postAll()` / `postKept()`, `whoCard()`, `post_seen`.
- Affected data: `post_seen` gains `author_out`. No row moves.
- Affected docs: `FEATURES.md`, `DATA_MODEL.md`.
- Implementation status: **done.**

### Decision
- Date: 2026-08-22
- Area: Appealing a freeze
- Decision: **An address, not a form.** `Lingua@tokinets.com`, opened from the
  frozen screen.
- Reason: a frozen account cannot write a row anywhere — every write policy in
  `schema.sql` goes through `is_member()`, which is the whole of what being
  frozen means — so a form would need a table with the door open, and that
  door is the thing being closed. Mail is a channel that already exists.
- Affected features: `vFeed` while frozen.
- Affected data: none.
- Affected docs: `supabase/setup.md`.
- Implementation status: **done in the app.** The alias itself is the owner's
  to create.

### Decision
- Date: 2026-08-22
- Area: What a thing belongs to
- Decision: **Everything belongs to the account** — language, dictionary,
  letters, keyboard, plan. The server is true, the phone keeps a copy so it
  works with no signal. **Cloud storage is for everybody**, so it stops being
  what Plus sells.
- Reason: 「全部アカウントごとでしょ」「クラウドは全員で」. It fits $25: a
  language packs to 5.4 KB, a large one to about a megabyte. What eats a plan
  that size is photographs on a timeline, and that is bandwidth.
- Affected features: `SLICES`, `LANGS`, the plan, `is_member()`, `CAN.data`.
- Affected data: all of it. Nothing is deleted; what is on a phone is adopted
  by the first account that signs in there.
- Affected docs: `FEATURES.md`, `STATE.md`, `DATA_MODEL.md`, `PAID_FEATURES.md`.
- Implementation status: **not started.**

### 【差し替え済み 2026-08-26】When somebody is asked who they are（2026-08-22）
- 差し替えた決定: 「匿名アカウントは無くなる。アカウントは一種類」（2026-08-26）

### Decision
- Date: 2026-08-22
- **SUPERSEDED、二つの半分がそれぞれ別の日に。**この項は「SNS だけ止める」と
  「三タブを閉じる」の二つを言っていて、**どちらも取り消されています**。
  - **タブは閉じません。**「3タブを閉じる必要もないし。ホームに出ればいいやん」
    ── 凍結は `vFeed` の中身がその一枚に変わることで、タブは開いたままです。
  - **制作側も止まります。** OWNER DECISION 2026-08-26 ── 凍結アカウントが
    自分の言語を編集してよいかを直接訊いた答えは、してはいけない、でした。
    言語は人に渡るもの（DL できて、誰でも開けるページに載る）になったので、
    「他人には関係ない」がもう言えません。
- Area: What being frozen stops
- Decision: 止まるのは **SNS と、言語がサーバーへ上がる分**。投稿・返信・反応・
  フォロー・通報と、`slice` の書き込み。**三つのタブは開いたままで**、凍結は
  ホームに出ます。端末の中にあるものは読めて、開けて、バックアップも取れます
  ── `account_delete()` だけは `is_member()` を訊きません。出口に鍵は掛けない。
- Reason: 凍結は解けるので、何も壊さない。そして帳を下ろす場所は一つでいい ──
  `is_member()` が `supabase/schema.sql` の全書き込みポリシーの中にあり、
  画面が何を言おうが言うまいが、閉まる扉はそれで閉まります。タブを閉じるのは
  同じことを二か所でやることでした。
- Affected features: `is_member()`（`supabase/schema.sql`）、`NET_BANNED` と
  `vFeed`（`www/sns.js`）、コンポーザー。
- Affected data: none. `profile.banned_at` / `banned_why` だけ。
- Affected docs: `FEATURES.md`, `supabase/setup.md`.
- Implementation status: **入っています。**`www/sns.js` の `vFeed` が
  `NET_BANNED` のときホームを一枚に替え、`www/net.js` が `banned_at` を読み、
  書き込みは全部 `is_member()` が止めます。タブは開いたままです。
- **一つ決まっていません。**端末の中だけの編集を止めるかどうか。2026-08-26 の
  決定は要約（`supabase/schema.sql`）としてしか残っておらず原文がありません。
  いまは端末では編集でき、上がる分だけが止まります。**これが決定どおりなのか、
  RLS が localStorage に届かなかった結果なのかは、書かれたものからは読めません。**
  訊くべき一文は「凍結中、端末の中だけの編集も止めますか？」です。

### Decision
- Date: 2026-08-19
- Area: How a screen is built — four shapes that are banned
- Decision: 「君あるあるの丸パッチ無限横並び、同じページに情報量詰め込み、ページ
  遷移型にせず下からひょいって出すやつ、無駄に説明をするやつ。この辺禁止で ux を
  意識して作ってほしい」
  1. **No endless row of round chips.** A row of pills you scroll sideways is
     a list pretending to be a control. If there are more than a few, it is a
     LIST.
  2. **One screen, one job.** Do not stack the thing being chosen and the
     thing being changed on one page. Choosing is a screen; changing is the
     screen you arrive at.
  3. **Go to a page; do not slide something up from the bottom.** A thing you
     can act on is a place you went to, with a way back. A sheet that appears
     over the screen you were on is not one.
  4. **No explanatory text** — already its own decision, above.
- Reason: the keyboard chapter had all four at once: a row of numbered chips
  above the editor they chose between, on the same screen, with a line of
  prose under it. 「上にあるとすんごい見にくい」
- Affected features: every screen. Done so far: the keyboard chapter is a list
  and one keyboard is a page.
- Affected data: none.
- Affected docs: `CLAUDE.md`
- Implementation status: the rule is in force from now. **The screens that
  still break it have not been swept** — this decision is not a licence to go
  and rewrite them all in one commit; each is its own task.

### Decision
- Date: 2026-08-19
- **SUPERSEDED（2 と 4 番）→ 「ダウンロードは Plus から。上限は make と別で、
  Plus 1・Pro 3」（2026-09-02、この log の上のほう）。**無料は一つも落とせません
  ── 「plusからです」。数は言語ごとで Plus 1・Pro 3 で、自分で作る数とは
  別に数えます。1・3・5・6 番はそのまま生きています。
- Area: Publishing and downloading — a keyboard, an alphabet, a dictionary
- Decision:
  1. **The author decides.** Public or private, per thing, for all three: the
     keyboard, the letters, the words. Nothing is downloadable unless its
     author said so.
  2. 取ることそのものが **Plus から**。`can('dl')` が扉で、`dlCap()` が数です。
  3. **Making and publishing stays Plus**, as it is now. Free still cannot
     build a keyboard or add a letter, and that does not change.
  4. 落としたものは自分の数を食いません ── `langCount()` は `mine` を数え、
     `dlCount()` はその反対側を数えます。二つの上限は互いを見ません。
  5. **A downloaded dictionary is a separate possession and is never merged
     into your own language.** It is a language you can READ. `FREE_LIMIT`
     counts your own words, so five thousand of somebody else's do not touch
     it — and if they were merged, the limit would have no answer and the two
     could never be told apart again.
- Reason: 「ヨタ語ってのがあって、そのファンの人がキーボードdlできたら、そのまま
  使える！みたいな」 The fan side is what spreads it, so the fan side is free.
- Affected features: keyboards, letters, words, the profile, the language page
- Affected data: new server tables; on the phone, a downloaded keyboard and a
  downloaded language are new slices and are **not** the person's own
- Affected docs: `docs/FEATURES.md`, `docs/PAID_FEATURES.md`, `CLAUDE.md`
  6. **取ってきた言語は、キーボードも含めて編集できない（読むだけ）。**
     「取ってきた言語を編集できるか →『できない』」OWNER 2026-09-24。書き手は
     全部 `langWrites()`（`www/core.js`）一つを訊き、`langLocked()` がその言語で
     はいと答える。`dl-check` が、取った言語の全部の画面の全部のボタンを押して、
     何も作られず、どの章も動かないことを持つ。
- Implementation status: **取る側は入りました。**`can('dl')`（`www/core.js` の
  `CAN`）と `dlCap()`（Plus 1・Pro 3、無料は 0）、`dlCount()`、`dlStop()`。
  押すと本当に着地することを `tools/dl-check.mjs` が持ちます ── 記事の見た目
  ではなく storage を訊きます（`LANGS[id].mine` が false、~~`bkPack()`~~ は運ばない、
  `netLangSync()` は走らない）。「ダウンロードボタン押しても言語追加されない
  けど？」OWNER 2026-09-01 が、その検査が書かれた理由です。
  6 番は 2026-09-24 の答えで書き直した（上）。

### Decision
- Date: 2026-08-19
- Area: Blocking
- Decision: **Blocked means you see nothing of them.** Not a quieter timeline
  — gone: the feed (left out by the server), threads, profiles, search on both
  sides, and the notices. 「ブロックは何も見えなくなるでいいんじゃない」
- Reason: a block that only thins a feed is a block somebody keeps meeting.
- Affected features: the timeline, search, notices, threads
- Affected data: `block` on the server (`ME.bl` on the phone is not read, not
  written and not deleted)
- Affected docs: `docs/FEATURES.md`
- Implementation status: **on the server, BOTH WAYS, and not device
  confirmed.** 「ブロックされた側からも見えない」 OWNER 2026-09-24 and the
  2026-09-25 entry above. `block_hides()` in `supabase/schema.sql` is the one
  answer and asks whether there is a block between the reader and a person,
  whoever made it. Every read passes what it hands out through it: `post_seen`
  (the feed, threads, somebody's posts, the search for posts), `feed_hot()`,
  `feed_fo()` (whoever passed a post on, too), `notices()`, `profile_seen` (a
  page and the search for people), `follow_seen`, and `language_seen` (their
  published language — a language somebody TOOK before the block still reads,
  because what a block does to that is not decided; `docs/scope/r85-block.md`).
  `rls-check` walks every view and row-returning function as the one who
  blocked and as the one blocked, and `BLOCK_HELD` is empty. **Nothing is done
  across it either** (2026-09-25): `react_make`, `post_make`/`post_edit` (an
  answer) and `follow_make` refuse a row aimed at somebody a block stands
  between (`post_blocks()`, `block_hides()`), so no notice rings either —
  push-send rings only on those rows arriving. A block is lifted from the
  settings' ブロックリスト (`block_seen`). What the phone keeps is
  `postBlocked()`, for a post of theirs it already held before the block. Not
  the same thing as a mute, which is one way and keeps nobody out (2026-09-25).
  `language_read` and `slice_read` — the `language` table and the slices read
  straight — still answer 「published」 without asking about a block;
  `docs/scope/r85-block.md`.

### Decision
- Date: 2026-08-19
- Area: What may be written on a screen
- Decision: **No explanatory text in the app.** A screen shows what it is and
  what can be done on it. It does not explain itself, does not say what a
  paid plan would give, does not tell somebody what to tap, and does not
  describe what a setting means. Where an explanation is genuinely needed it
  goes behind the `?` in the bar, which is what the `?` was added for.
- Reason: 「お前もうアプリ内に説明書くの禁止な」, and before that 「その説明ちっく
  な日本語やめて欲しい。小さい文字で書くやつ」「説明ちっくすぎて嫌だ」
- Not covered by this: an EMPTY state ("nothing here yet"), a count, a state
  ("only for an abugida"), an error, and the `?` sheets. None of those is the
  screen explaining itself.
- Affected features: every screen. Removed with the decision: ~~`plans.intro`~~,
  `plans.note`, `set.theme.note`, `ws.kind.note`, `ab.cell`, `langs.more`,
  `kb.locked` — and ~~`LANG_MAX`~~, whose only reader was one of them.
- Affected data: none.
- Affected docs: `CLAUDE.md`, `docs/FEATURES.md`
- **Held by: nobody but a person.** Measured 2026-09-01. `.note` is worn 39
  times and most of those are the empty states, counts, states and errors this
  decision explicitly allows, so a check on the class would fail the app for
  obeying it; and a `.d`/`.eg` key is not an explanation either, a third of
  them being `aria-label`s. What is left is the sentence, and no check reads a
  sentence. Written here so that silence is not read as a check — CLAUDE.md
  § Explaining says the same in the rule itself.
- Implementation status: implemented. **`cap.lapse.d` is left in and is the
  one thing to settle**: it is the line that says a dictionary dropping back
  to a hundred words has had NOTHING deleted. Taking it out would leave the
  app silently truncating a list with no word about the data, which
  `docs/DATA_SAFETY.md` is written against. Reported rather than resolved.

### Decision
- Date: 2026-08-18
- Area: Anything that is the server's — and the timeline first
- **Point 3 was replaced on 2026-08-26** by 「匿名アカウントは無くなる。
  アカウントは一種類」 — 「言語はアカウントないと作れないです」. Points 1 and 2 stand.
- Decision:
  1. **Anything that needs the server is built assuming the server is
     there.** A screen that half-works without one is not a step on the way
     to being online; it is a bug that will be found by somebody using it,
     not by a check.
  2. The timeline is the server's. **Reading it and posting to it both
     require an account.** The feed, the search and the notices show the
     app's own door when there is no session, and the composer does not open
     at all.
  3. 【差し替え済み 2026-08-26】差し替えた決定: 「匿名アカウントは無くなる。
     アカウントは一種類」（2026-08-26）。
- Reason: 「なんでログインしてないアカウントで投稿できんの？そんなsnsどこにあん
  の？」「だからなんで最初からオンライン前提で作れっつってんだろ、そういう中途
  半端なバグを出すんだって何回言えばわかるの？」 — said more than once before
  this, and never written down, which is why it kept being lost.
- Affected features: the timeline, the search, the notices, the composer, the
  onboarding door (it takes a `skip` argument now, so the same door can be
  shown without "continue without an account")
- Affected data: **none.** No post is touched, moved or removed.
- Affected docs: `docs/FEATURES.md`, `docs/ARCHITECTURE.md`, `CLAUDE.md`
- Implementation status: implemented, held by `post-check` (all three
  assertions watched failing), **not device confirmed**

### Decision
- Date: 2026-08-14
- **SUPERSEDED、二つの側から。**段の名前と値段は「What the tiers are called」
  （2026-08-23、Free / Plus / Pro）が読み替えました ── **Studio はありません**。
  StoreKit を入れない話は「課金もタップしたら勝手になるけど？」OWNER 2026-08-31
  が取り消しました。下は書き換えた後の姿です。
- Area: Money — the four subscription products, their ids and their prices
- Decision:
  1. 売る段は **Plus** と **Pro** の二つ、それぞれ**月と年**。
  2. 商品 ID。**商品が App Store Connect にできたら、二度と変えられません**:

     | | monthly | yearly |
     |---|---|---|
     | Plus | `com.tokinets.lingua.plus.monthly` | `com.tokinets.lingua.plus.yearly` |
     | Pro | `com.tokinets.lingua.pro.monthly` | `com.tokinets.lingua.pro.yearly` |

     `plus.*` は改名の前は上の段の ID でした。いまは**中の段**を指します
     ── 誰も何も買っていない日に動いたので、動かして構いませんでした。

  3. 値段（USD）。ほかの国は Apple の自動換算です:

     | | monthly | yearly |
     |---|---|---|
     | Plus | 4.99 | 49.99 |
     | Pro | 9.99 | 99.99 |

  4. 四つとも `Lingua` という**一つのサブスクリプショングループ**に入れます。
     **Pro がレベル 1（上）、Plus がレベル 2（下）** ── 同じグループなら上げ
     下げでき、二つ同時には持てません。
- Reason: 段のはしごが一行で読めること。`docs/apple.md` に、Apple のサイトで
  どこを押すかまで書いてあります。
- Affected features: the plans screen, everything `CAN` gates
- Affected data: none. ~~`SET.plan`~~ は端末の写しで、**答えは Apple のもの** ──
  2026-09-06 以降、その答えを読むのはサーバー（`verify-plan`）です。
- Affected docs: `docs/apple.md`, `docs/PAID_FEATURES.md`, `docs/FEATURES.md`
- Implementation status: **StoreKit は入っています。**
  `ios/App/App/LinguaStore.swift` が StoreKit 2 でこの四つを扱い、
  `www/store.js` がその一つの窓、`www/settings.js` の ~~`PLAN_BUY`~~ は **true**
  です。実機では `storeBuy()` を通らなければ段は動きません。**false に戻さない
  こと** ── ビルド #106 が false のまま実機に出て、段のカードを押しただけで
  Pro が付きました。ブラウザには App Store が無いので `storeOn()` が false に
  なり、そこでは今までどおり手で切り替わります（検査とスクリーンショットは
  それで歩きます）。商品を作るのはオーナーの手です。

### Decision
- Date: 2026-08-13
- **SUPERSEDED（3 番だけ）→ 「The composer」（2026-08-13、この log の下のほう）。**
  写真を足す＋は無くなり、**カメラ・ライブラリ・マイクの三つのボタン**が
  キーボードの上の帯に並びます ── 「投稿の時にphotoボタンやめて。📷 ライブラリ
  マイクボタンにして」。1・2・4 番はそのままです。
- Area: Posts — how many photographs, and how they are shown
- Decision:
  1. A post can carry **up to four** photographs.
  2. They **slide sideways**; the picture area scrolls and nothing else does.
  3. 写真を足すボタンは**キーボードの上の帯**にあり、四枚で消えます。
     「写真と音声とかのボタンはTwitterと同じようにキーボード上に固定して」
  4. Each picture has its own letters placed on it, and each is baked
     separately when the post is sent.
- Reason: 「画像は4枚まで載せられる。画像だけ横スライドできる感じ」
- Affected features: composer, timeline
- Affected data: **new** — `post.pics`, an array of data URLs. `post.pic` is
  **not removed and not rewritten**: posts that carry one keep it, and every
  reader goes through one function that answers `pics` or falls back to `pic`.
  `POST_BYTES` is unchanged and is now four times easier to reach, so a
  picture that will not fit is refused and the post is not
- Affected docs: FEATURES.md, DATA_MODEL.md, DATA_SAFETY.md, CHANGELOG.md
- Implementation status: implemented; code confirmed, not device confirmed

### Decision
- Date: 2026-08-13
- **SUPERSEDED（＋の位置だけ）→ 「The composer」（2026-08-13、この log の
  下のほう）。**足すボタンは写真の横ではなく、キーボードの上の帯にカメラ・
  ライブラリ・マイクの三つとして並びます。赤いマイナスと、押すと編集が開く
  ことは、そのままです。
- Area: Posts — the photograph on the composer
- Decision: no buttons under it. A **red minus at the picture's top corner**
  removes it, and **pressing the picture opens the editor** — cropping,
  letters, whatever the editor grows.
- Reason: 「右上に赤い⚪︎に-で消す」「編集ボタンはいらん。
  画像タップして画像編集切り抜きとか文字入れとかできるように」
- Affected features: composer
- Affected data: none
- Affected docs: CHANGELOG.md
- Implementation status: implemented; code confirmed, not device confirmed.
  The editor does both — letters and cropping — and the letters already placed
  move with the picture when it is cut

### Decision
- Date: 2026-08-13
- **SUPERSEDED（3 番だけ）。**「課金で追加した機能は無料になったら全部隠れる」
  OWNER 2026-09-01 ── 自作のステージは一覧に**残りません、隠れます**。語の
  百より先、無料のアルファベットより先の文字と、同じ扱いです。**消えるのでは
  なく隠れる**ので、`STG.extra` は storage にもバックアップにもサーバーにも
  そのまま在り、払えば全部そのまま戻ります。ほかの四つはそのままです。
- Area: **What happens when a plan ends** — every capability at once
- Decision: **the app goes back to the shape the free plan has, and nothing a
  person made is deleted.**
  1. The dictionary **lists the first 100 words** it was given, in the order
     they were made. The rest are not on screen. Every one of them is still in
     `WORDS` and on the server, and the app reads the whole dictionary for
     itself — a post, a gloss, a spelling, an example. Only the list is short.
  2. The writing goes back to an alphabet, the keyboard to the fixed QWERTY,
     the direction to left→right. All three were already true of `wsys` and
     `kb`; `dir` joins them.
  3. 自作のステージは**一覧から隠れます**。本にもともとある章は「無料の文法が
     何であるか」そのものなので残ります。`stAll()` が `can('gram')` の中でしか
     `STG.extra` を並べず、`stHidden()` がその数を足元に出します。
  4. 【差し替え済み 2026-09-12】差し替えた決定: 「2026-09-12 朝の六つ」の (g)（2026-09-12） ── 起動のポップで一度、
     サーバーの答え（`plan.was`、`capLapseSaw()`）。
  5. The foot of the dictionary says how many are not listed, every time.
- Reason: 「a にしたら最初の1ヶ月で作りきったらそのあと課金されねえだろ」
  「非表示や」「課金切れたら、ポップ出して、バックアップには保存されてるよーって
  一回出せばok」
- Affected features: the dictionary, search, the relation picker, the writing
  system, the keyboard, direction, grammar stages, the plans screen
- Affected data: **none.** Nothing is written, moved or removed.
- Affected docs: PAID_FEATURES.md, DATA_SAFETY.md, DATA_MODEL.md, CHANGELOG.md
- Implementation status: implemented; code confirmed, not device confirmed
- **The rule it is measured against**: `docs/DATA_SAFETY.md` forbids removing
  what somebody made. It does not forbid a shorter list. The line between the
  two is the whole of this decision, and `plan-check` holds it: on the free
  plan, past the ceiling, the list is a hundred and not one byte of any slice
  has moved.

### Decision
- Date: 2026-08-13
- Area: Which way a language is written
- Decision:
  1. A language has a **direction**, and it is the language's — not the
     person's and not the post's to choose. Four of them: left→right,
     right→left, and vertical with the columns running right→left or
     left→right.
  2. **Reading is free.** A post written in any of the four is shown that way
     to everybody, on every plan.
  3. **Setting it is paid** — `CAN.dir`, at Pro (the rung this entry called
     Plus before 「What the tiers are called」, 2026-08-23).
- Reason: 「縦書き、右→左 左→右の投稿」「言語の設定でしょ右左とかは」
  「無料でも言語の向きは見ることはできる。でも設定してsnsとかに登校するのは
  有料会員のみ」 The vertical column order: 「右から左と左から右の両方」
- Affected features: the writing system screen, the composer, the timeline,
  the card
- Affected data: `SCRIPT.dir` in the **`script` slice** — the language's, so
  it travels with the language to the server. **Frozen onto the post**
  as `post.dir`, for the same reason `ink` is: a reader has neither the
  writer's alphabet nor their language's settings
- Affected docs: FEATURES.md, DATA_MODEL.md, PAID_FEATURES.md, CHANGELOG.md
- Implementation status: implemented; code confirmed, not device confirmed
- What happens when the plan ends is the decision below: the language runs
  left→right while it is on free, and `SCRIPT.dir` is kept untouched.

### Decision
- Date: 2026-08-13
- Area: Posts — letters on an image, the three details
- Decision:
  1. Letters are placed **freely**: pick a letter, put it anywhere on the
     picture, drag it with a finger, size it with a slider. No rotation.
  2. They are **baked into the picture** when the post is sent. The post
     carries one image and nothing else.
  3. Free, on every plan.
- Reason: 「なんなら画像に自作文字を貼って投稿できるようにすれば勝手に広がるよ」
  「画像と自作文字貼るのは無料 投稿に貼るに決まってるでしょ」 Placement:
  「自由配置」 Storage: 「画像に焼き込む」
- Affected features: composer, timeline, card
- Affected data: `post.pic` only. Baking means the picture IS the past tense —
  there is nothing on the post that has to be re-rendered with an alphabet the
  reader does not have, which is the same guarantee `ink` gives by a different
  route
- Affected docs: FEATURES.md, DATA_MODEL.md, CHANGELOG.md
- Implementation status: implemented; code confirmed, not device confirmed.
  Dragging is a pointer gesture and a pointer gesture is the one thing a
  headless browser cannot vouch for — `post-check` holds what the bake puts in
  the file, and a finger on a photograph needs a phone

### Decision
- Date: 2026-08-12
- **SUPERSEDED（2・3・4 番）。1 番だけが生きています。**
  - 2 番の赤い字 → 「語釈は二段。赤い字は無い。お題のページと同じ形」
    （2026-08-28、この log の上のほう）。「やっぱり、タイムラインも投稿も
    2段で。赤文字消して。」
  - 3・4 番 → **第三層そのものが無くなりました。**「なら自分の言語でどう言うか
    翻訳いらなくない？元々ai前提やったし」。経緯は
    `docs/CHANGELOG.md` § 「自分の言語で読む」は無くなった — OWNER DECISION。
- Area: A post shown three ways — the four details
- Decision:
  1. The natural-language layer is translated **when the post is written**,
     using **the reader's own device AI, borrowed** — not a service of ours.
     No key of ours, no server of ours, no cost per post. The translation is
     attached at the moment of posting and travels with the post.
- Reason: 「翻訳はユーザーのaiを拝借します。投稿するタイミングでai翻訳がつくので」
  「まずオフラインで起動できないやろSNSは」
- Affected features: composer, timeline, post
- Affected data: **new, frozen on the post** — `post.tr`, a translation per
  language code
- Affected docs: FEATURES.md, DATA_MODEL.md
- Implementation status: **未実装。**縫い目の関数も無く（`post.js` に翻訳を付ける
  関数は無い）、`tr` は付かず、読む人は書いた人が打った自然言語を見ます。

#### And the standing instruction that goes with it

**Build for the online and AI parts now; wire them up later.** An unbuilt
service is not a reason to stop — it is a reason to put a seam where it will
attach, and to make everything on this side work with the seam answering
nothing. The comment AI_SEAM in `www/glyph.js` marks one such place.

Reporting "there is no hosted model" as a blocker was wrong. It is a fact
about today, not about the design, and the design is the part being asked
for.

### 【差し替え済み】A post shown three ways（2026-08-12）
- 差し替えた決定: 投稿は二層 ── `docs/CHANGELOG.md` §「自分の言語で読む」は無くなった

### Decision
- Date: 2026-08-12
- **SUPERSEDED、三か所。**この項の「Plus」は改名前の名前で、いまの **Pro** です
  （「What the tiers are called」2026-08-23）。中身も二つ動きました ──
  **クラウドは全員のもの**になり（「What a thing belongs to」2026-08-22
  「クラウドは全員で」）、**翻訳は売り物ではなくなりました**（第三層が外れた
  ので、`docs/CHANGELOG.md` § 「自分の言語で読む」は無くなった）。
  はしごが二段から三段に割れたので、**この一覧の半分はいま中の段（Plus）です。**
  段ごとの答えは一箇所、`www/core.js` の `CAN` にあります。
- Area: Plus — what it contains
- Decision: はしごなので、上の段は下の段を全部含みます。**足す分だけ**を書くと:
  - **Plus**（中の段）── 文字の追加・改名・削除、音を選ぶ、アルファベット以外の
    書記体系、語 1000、キーボード四つ、投稿の編集、人の言語を取ること。
  - **Pro**（上の段）── Plus の全部に足して、語に上限なし、キーボードに上限
    なし、自分の文法のステージ、言語の向き、CSV の出し入れ、ファイルで持ち込む、
    名前の横の印。
- Reason: the owner's list, given in full.
- Affected features: every paid row in FEATURES.md
- Affected data: none by itself
- Affected docs: FEATURES.md, PAID_FEATURES.md
- Implementation status: **段の扉は全部入っています。**`CAN` の全部と、数で答える
  三つ（`wordCap()` `kbCap()` `dlCap()`）。フリックとキーの自由配置もキーボードの
  編集画面にあります。いくつ扉があるかはここに書きません ── 書けば次に増えた日に
  古くなるので、`npm run dead` が毎回数えて出します。
  **クラウドはどの段にも属しません** ── `netLangSync()` は段を訊きません。
  **翻訳は `CAN` に一度も入らず**、~~`TR_FREE_DAILY`~~ も宣言されませんでした。

### Decision
- Date: 2026-08-12
- Area: Plus — the AI
- Decision: The AI is not part of what Plus sells. Plus gets a few AI chats a
  day; unmetered AI is not a Plus capability.
- Reason: 「aiはaiチャットが1日数回できるくらいで、基本機能にはついてない」
- Affected features: AI suggestions, AI conversation
- Affected data: ~~`SET.aiDate`~~ / `SET.aiN` (the daily counter)
- Affected docs: PAID_FEATURES.md, FEATURES.md
- Implementation status (2026-08-21): **moot.** There is no AI. ~~`AI_SEAM`~~ in
  `www/glyph.js` marks where a hosted model would join and nothing joins it, so
  Studio — the tier that sold it — is out, and with it went ~~`CAN.ai`~~,
  ~~`AI_FREE_DAILY`~~, ~~`SET.aiDate`~~/`SET.aiN`, the suggestion chips and the
  conversation chapter. The question this decision answers comes back the day
  the seam has something behind it.

### Decision
- Date: 2026-08-12
- **SUPERSEDED → 「What a thing belongs to」（2026-08-22、この log の上のほう）。**
  **クラウドは全員のもので、売り物ではありません** ── 「クラウドは全員で」、
  そして「基本は全部サーバー管理」（2026-08-26）。保留でもありません。
- Area: Cloud storage
- Decision: **サーバーがものの在り処で、それはどの段でも同じです。**言語が在る
  ことは誰かが「する」ことではないので、段が決めることではありません
  （`docs/PAID_FEATURES.md` の頭）。端末が持つのは、信号が無くても動くための写し。
- Reason: 段は**何をしてよいか**を決めるもので、**何が在るか**は決めません。
  値段の側も合っています ── 言語は 5.4 KB に詰まり、大きいもので 1 MB ほど。
  その大きさの段を食うのはタイムラインの写真で、それは容量ではなく帯域です。
- Affected features: `netLangSync()`（`www/net.js`）、`SLICES`、`slice` の
  ポリシー（`supabase/schema.sql`）
- Affected data: 全スライス。競合の解き方はオーナーが決めることで、道具が
  決めることではありません
- Affected docs: FEATURES.md, PAID_FEATURES.md
- Implementation status: **入っています。**`netLangSync()` は段を訊きません。
  **段の画面にも設定画面にもクラウドの行はありません** ── 設定にあった
  「Cloud sync ── On」は、Plus の人にだけ、何もしていない状態でそう言って
  いました。行そのものが消えています（`www/settings.js`）。`CAN.data` は
  残っていますが、それが指すのは CSV だけです。**これをまた扉に戻さないこと。**

### Decision
- Date: 2026-08-12
- Area: Posts — images
- Decision: A post can carry an image. Letters somebody drew can be placed on
  that image and posted.
- Reason: the owner's. 「なんなら画像に自作文字を貼って投稿できるようにすれば
  勝手に広がるよ」
- Affected features: composer, timeline, card
- Affected data: **new** — an image on a post, and where the letters sit on
  it. Both must be FROZEN onto the post (`docs/DATA_MODEL.md` § the three
  kinds): a reader does not have the writer's alphabet, so the shapes have to
  travel exactly as `ink` does
- Affected docs: FEATURES.md, DATA_MODEL.md, DATA_SAFETY.md (posts grow by the
  size of an image), CHANGELOG.md
- Implementation status: **入っています。**開いていた二つは、どちらも後の決定が
  答えました ── **どの段でも無料**（「Posts — letters on an image」2026-08-13
  「画像と自作文字貼るのは無料 投稿に貼るに決まってるでしょ」）、**data URL で
  投稿に載せ、文字は焼き込む**（同）。枚数は四枚まで（「Posts — how many
  photographs」2026-08-13）。焼き込みは `post-check` が画素で数えて持ちます。

### Decision
- Date: 2026-08-12
- Area: The word sheet
- Decision: Making a word and editing one are the same screen. Opening a word
  shows it; editing is behind a button.
- Reason: 「単語追加の時点で編集できるようにしろよ。編集でも見えるように当たり前だろバカか」
  「作成編集それぞれ同じ画面で」「開いた時は閲覧、編集ボタンで編集」
- Affected features: dictionary, word sheet
- Affected data: none
- Affected docs: FEATURES.md, CHANGELOG.md
- Implementation status: implemented; code confirmed, not device confirmed

### Decision
- Date: 2026-08-12
- Area: A word's fields
- Decision: A word carries register, fields, origin and a changed-on date, in
  addition to what it had.
- Reason: asked for as the four things a dictionary needs and this one lacked.
- Affected features: dictionary
- Affected data: `words` slice — four optional keys, absent unless filled in
- Affected docs: DATA_MODEL.md, FEATURES.md, CHANGELOG.md
- Implementation status: implemented; code confirmed, not device confirmed

### Decision
- Date: 2026-08-12
- Area: Cards of posts
- Decision: A card of a post is drawn from `post.ink`, never re-derived from
  the open dictionary. This holds even though every post today is the person's
  own.
- Reason: the owner's audit: 「現在開いている言語の文字体系で他人の投稿を描画して
  しまう可能性がある」 — do not stop at "my own posts still look right".
- Affected features: card, timeline
- Affected data: none stored; `postInkOK()` decides drawability
- Affected docs: DATA_MODEL.md, CHANGELOG.md, CLAUDE.md rule 12
- Implementation status: implemented; code confirmed, not device confirmed

### 【差し替え済み 2026-09-02】Number of languages（2026-08-12）
- 差し替えた決定: 「ダウンロードは Plus から。上限は make と別で、Plus 1・Pro 3」（2026-09-02）

### Decision
- Date: 2026-08-11
- Area: Data safety
- Decision: Losing somebody's language is not acceptable under any
  circumstance. A restore fills in what is missing and never overwrites.
  Where the copy lives: 【差し替え済み 2026-09-04】── 差し替えた決定:
  「バックアップのファイルも無くす。★の51件目は一番古いのを押し出す」（2026-09-04）
  ── the server is the only copy that counts.
- Reason: 「データ消えるのだけはありえない」
- Affected features: restore
- Affected data: every slice in `SLICES`
- Affected docs: DATA_SAFETY.md, CLAUDE.md rule 11
- Implementation status: implemented — `netLangsDown()` fills in what is missing
  (`again-check`, `acct-check` 13); **device verification outstanding**

### Decision
- Date: 2026-08-11
- Area: The free plan
- Decision: The free plan is your own shapes for a–z, `!`, `?` and the digits —
  thirty-eight slots, drawing only. Nothing on free adds, renames or deletes a
  letter. The keyboard is a fixed QWERTY with the drawn letters substituted in,
  with nothing to set.
- Reason: 「無料の場合はもう最初からa〜z!?が置いてあってそこから書くだけで追加する
  自体がない」「キーボードもqwerty配列がそのまま自作文字に置き換わるだけ。なんの設定
  もできない」
- Affected features: alphabet, keyboard, letters
- Affected data: `letters` slice (`ltStart` tops up, never rearranges)
- Affected docs: PAID_FEATURES.md, CLAUDE.md § what the free plan is
- Implementation status: implemented

### Decision
- Date: 2026-08-11
- Area: The free keyboard's face
- Decision: One face, and no second page. Digits above the QWERTY. The
  bottom bar is `! ? スペース 改行` — the two marks together at the near
  end — and the delete key is **three** keys wide, hard against the right
  edge. Every row comes to ten.
- Reason: 「2ページ目なしでqwertyの上に1〜0の数字と！？入れてこれで無料版1ページに
  抑えよう」「これスペースデカすぎやね。！スペース？みたいにできない？」
  「デリートキーは横二つ分欲しいかも」
  The bar and the delete are the owner's later words: 「2があった分謎に隙間
  できたから無くして」（delete three wide）and 「改行入れるか無料も。！？スペース
  改行」（the return key）.
- Affected features: keyboard
- Affected data: none (`kbFixed()` is built from `LETTERS`, stored nowhere)
- Affected docs: PAID_FEATURES.md, CLAUDE.md § what the free plan is
- Implementation status: implemented. `kbFixed()` in `www/keyboard.js`

### Decision
- Date: 2026-08-11
- Area: Letters and sounds
- Decision: A letter comes first and its sound follows from it. Choosing a
  sound is a paid capability; on free the letter's own reading is used.
- Reason: 「文字ベースに音が付随だからね？音から選択するのは課金機能」
  「音は選択できない。だってアルファベットには既存の音があるんだから」
- Affected features: letters, word sheet, sound
- Affected data: `snd` slice
- Affected docs: PAID_FEATURES.md (`snd`), DATA_MODEL.md
- Implementation status: implemented

### Decision
- Date: 2026-08-11
- Area: The in-app keyboard
- Decision: Typing inside Lingua on a Lingua keyboard is removed. The system
  keyboard extension is the keyboard. The editor that *builds* a layout stays.
- Reason: 「アプリ内キーボードいらないでしょ。アップル拡張だけ。」
- Affected features: keyboard
- Affected data: `kb` slice kept
- Affected docs: FEATURES.md § closed on purpose
- Implementation status: implemented

### Decision
- Date: earlier
- Area: The glyph editor
- Decision: A line drawn straight along the dots is not corrected. Diagonals
  are corrected to diagonals; Round is for curves.
- Reason: 「斜めは斜めに補正して欲しいけど、まっすぐ引いた線が勝手に斜めになる補正が
  やめて欲しい」「点線上にそのまま引いた一筆書きが勝手に補正されるのをやめて欲しい」
- Affected features: glyph editor
- Affected data: `letters` slice (stroke points)
- Affected docs: —
- Implementation status: implemented

### Decision
- Date: earlier
- Area: Navigation
- Decision: Pages, not sheets sliding up from the bottom. One back button.
- Reason: 「基本ページ遷移型にしてくれ」「普通に1個前のページに必ず戻る戻るボタン
  以外いらない」
- Affected features: shell
- Affected data: none
- Affected docs: —
- Implementation status: implemented

### Decision
- Date: 2026-08-13
- Area: The composer
- Decision: The one plus that added a photograph becomes **three buttons**:
  the camera, the library, and the microphone.
- Reason: 「投稿の時にphotoボタンやめて。📷 ライブラリ マイクボタンにして」
- Affected features: post composer
- Affected data: none by itself
- Affected docs: DATA_MODEL (with the voice, below)
- Implementation status: implemented

### Decision
- Date: 2026-08-13
- Area: The voice on a post
- Decision: Up to **thirty seconds** of the person's own voice on a post.
  It is written as a **file in Documents**, never into `localStorage`, and
  the post carries the file's name. Built **to the end** — the recorder, the
  file, and playing one back — rather than a button with nothing behind it.
- Reason: 「あとポストに声入れれるようにしたい30秒くらい。発音とかやれるやん？」
  「ファイルに出す」 and, asked how far to build it now, 「録音まで作る」.
- Affected features: post composer, timeline
- Affected data: **new** — `post.vo = {f, ms}`, and `Documents/Voices/` on the
  phone. Nothing existing changes shape
- Affected docs: DATA_MODEL, DATA_SAFETY, CHANGELOG, CLAUDE.md
- Implementation status: implemented in the app; **not device confirmed** —
  the microphone, `NSMicrophoneUsageDescription` and the two new Swift calls
  have never run on a phone.
- **「never into `localStorage`」 was broken by the drafts and was put right
  on 2026-09-03.** A draft carried `PW.vo` whole, base64 and all, so up to
  thirty seconds of audio went into `lingua.drafts` and up to the server in
  the draft's body — and `draftsSave()` swallows its exception, so hitting
  the quota made drafts stop saving in silence, which is the 「保存したつもり」
  this decision was written to prevent. The fix is not a condition added on
  top: the file is written **the moment the recording ends** (`voTook()` in
  `www/rec.js`), so `PW.vo` is `{f, ms}` from then on and no base64 is held
  anywhere. There is one road for a voice instead of two — ~~`voPlayPW()`~~ is
  gone and the composer plays through `voPlay()` like everything else. A
  draft written before this still holding `b64` is put on the disk by
  `draftOpen()` and replaced in place. `post-check` walks the recording
  through to the post; four reds were watched first.
- **A draft thrown away takes its recording with it.**
  「声は投稿上で再生できるよね？下書き消した時にはいらなくない？」 OWNER
  2026-09-03. `draftDropGo()` drops that one file and nothing else — it names
  the file it was given rather than walking the directory asking what is
  stale (`docs/DATA_SAFETY.md` § DELETE REVIEW)

### Decision
- Date: 2026-08-13
- Area: A post's ... menu
- Decision: Three things — delete, pin, **edit**. Editing puts right the
  **line and the meaning**, and those two only: the photographs and the voice
  stay as they were. An edited post **says so**, beside the time.
- Reason: 「あとツイートの点点々、デリートピン留めエディットにして」, and asked
  what edit reaches, 「文と意味だけ」; asked whether to show it, 「出す」.
- Affected features: timeline
- Affected data: `post.ln`, `post.ink`, `post.mn`, `post.tr` are overwritten
  on the post being edited; `post.ed` is new. The `ink` is re-cut with the
  alphabet as it stands at that moment, which is the one place a post's
  shapes are not the shapes it was born with — a changed line wearing the old
  shapes is the old line
- Affected docs: DATA_MODEL, CHANGELOG
- Implementation status: implemented

### Decision
- Date: 2026-08-13
- Area: A post's ... menu
- Decision: The menu opens **beside the post**, not as a page you go to.
- Reason: 「・・・ひらいたら画面遷移じゃなくて投稿の横にメニュー出てきて欲しい」
- **This narrows an earlier decision in this log** ("Pages, not sheets sliding
  up from the bottom. One back button.") and does not overturn it: navigation
  is still pages, and this is three words about the post already in front of
  you rather than somewhere to go. Nothing else in the app changes.
- Affected features: timeline
- Affected data: none. `PMENU` is where you are standing, and `viewReset()`
  forgets it
- Affected docs: —
- Implementation status: implemented

### Decision
- Date: 2026-08-13
- Area: A deleted reply
- Decision: Deleting a reply takes its one back off the post it answered.
- Reason: 「リプライ消したのに数字1のまま」
- Affected features: timeline
- Affected data: `post.re` on the post that was replied to. Floored at zero —
  a count that is already wrong is not put right by being made negative
- Affected docs: CHANGELOG
- Implementation status: implemented

### Decision
- Date: 2026-08-13
- Area: What a post has to have
- Decision: A post does not need a line. A **photograph on its own** is a
  post, and so is a **voice on its own**. Nothing at all is still nothing.
- Reason: 「文字無しでもポストできるようにできない？」
- Affected features: post composer, timeline
- Affected data: `post.ln` may be `''`. Nothing changes shape; every post
  written before this has a line
- Affected docs: DATA_MODEL, CHANGELOG
- Implementation status: implemented

### Decision
- Date: 2026-08-13
- Area: The profile, and a language's own page
- Decision: The small `Lingua` tag beside the handle becomes a **row** between
  the bio and the follow counts — the language's name and a chevron — and it
  opens a page **about that language**. On it: what the language is for, where
  it is spoken, who speaks it, the note, the letters that have actually been
  drawn, and three numbers (words, letters, kind of writing). Not the words —
  a dictionary is a chapter, not a summary. A setting makes it public or
  private, and **public is the default**.
- Reason: 「フォローと自己紹介の間にその言語について簡単にまとめてあるページ欲しい
  な。linguaパッチの代わり。Lingua > みたいになっててそこでその人が作ってるの
  見れる」「これは設定から公開非公開もかのう」, and asked what goes on it,
  「世界＋文字＋数」; asked for the default, 「公開」.
- Affected features: profile, the World editor (which keeps its door, now on
  the new page rather than on the tag)
- Affected data: `world().hide` in the `wld` slice — the LANGUAGE's, not the
  person's, because whether this language has a page is about this language.
  Absent means public, so the default is the absence of a field and no
  migration can get it wrong
- Affected docs: DATA_MODEL, CHANGELOG
- Implementation status: implemented. Nothing off this phone can read the flag
  yet — there is one profile here and it is this person's — so what the switch
  does today is take the row off their own profile and say so

### Decision
- Date: 2026-08-13
- Area: Fields you type a line into
- Decision: A field is in **ordinary letters**, never the person's own
  alphabet. What is displayed stays in the drawn letters.
- Reason: 「普通に全部自作文字にされるの意味わからん。自分が打ちたい時にこれなんて
  読むんだになったら本末転倒やろ」 — somebody drawing their first eight letters
  cannot read them yet; that is what drawing them is for.
- Affected features: the grammar stage's example, a word's example, spelling,
  the post composer
- Affected data: none
- Affected docs: CHANGELOG
- Implementation status: implemented in `lnField()`, which is the one place a
  line is typed. The composer's preview now runs at every direction rather
  than only the vertical ones, so nothing was lost — it moved to the half of
  the screen that is for looking

### Decision
- Date: 2026-08-13
- Area: The timeline and replies
- Decision: A row to write in at the top of the timeline, and a reply shows
  the post it is answering.
- Reason: 「ホームからもツイートできるように」「リプライする時は前のツイートが何か
  見れるように」
- Affected features: timeline, composer
- Affected data: none
- Affected docs: CHANGELOG
- Implementation status: implemented. The round `+` stays — it is reported as
  invisible on build 57 and could not be reproduced here, so the row is a
  second entrance rather than a replacement

### 【差し替え済み 2026-08-20】A word's derived words（2026-08-20）
- 差し替えた決定: 「A word's related words」（2026-08-20、すぐ下）

### Decision
- Date: 2026-08-20
- Area: A word's related words
- Decision: The labels are two groups — **活用** (an inflection: the same word
  in another shape) and **派生** (a derivation: a different word built out of
  it), twelve each — and **a language may write its own in either group**. A
  label somebody writes is kept as typed and never translated. The whole family
  is shown from every word in it, not only from the parent. Every label we
  supply carries a small circled `?` beside the word itself, and it says one
  line and one example rather than opening a page.

  **「ポップとして」の一語は superseded 2026-09-01。**この日の決定が、この
  app の三つを名前で分けた ── 問いは `popAsk()`、言い切りは `toast()`、
  打ち込みは `openForm()`、そして四つ目は作らない。？が出すのは一行の
  言い切りなので `toast()` です（`fmSay()`、`www/wordsheet.js`）。
  2026-08-20 の対比は「ページを開くのではなく」であって、そちらは今も
  そのとおり。
- Reason: 「tirorがウォッチャーになるのって何系の派生？」「活用と派生も好きに保存
  できたらいいよね」「保存した瞬間そっちの単語でも活用とか見れる」「これ全部横に？
  つけてどういう役割なのかたとえば英語とか言語で説明できるようにして」「⭕️？にして
  少し小さめでポップとして出してほしい。で、文字の横に置いて」
- Affected features: the dictionary, the word sheet, the word read
- Affected data: `fm` on a word — a code, or `i~`/`d~` and the person's own
  words, stored on the word and in no list of its own
- Affected docs: CHANGELOG, DATA_MODEL, FEATURES
- Implementation status: implemented. `FM_INF` / `FM_DER` / `fmLabel()` /
  `fmMine()` and the `fm` screen in `www/wordsheet.js`
- Free: yes. It is text somebody typed, not a capability

### Decision
- Date: 2026-08-23
- Area: What a subscription costs in each country
- Decision: **The base is the USD prices already decided** — Plus 4.99 / 49.99,
  Pro 9.99 / 99.99 — and **each country is then rounded to a clean number by
  hand** in App Store Connect. Not all 175: the storefronts that sell, and the
  rest left as Apple generated them.
- Reason: 「基準はさっき値段決めたやろ 各国がキリ良くしたい。」
- Affected features: the plans screen; nothing else
- Affected data: none. A price is not stored anywhere in this app
- Affected docs: apple.md § 4, CHANGELOG, STATE
- Implementation status: nothing to implement, and that is the point. The
  screen shows `displayPrice` as the App Store gives it and works the yearly
  saving out from the two amounts, so **a price changed in the dashboard needs
  no change in the app** — and rounding each country separately, which makes
  the saving differ by country, is exactly the case that would have been wrong
  under the old typed `17`.

### Decision
- Date: 2026-08-23
- Area: The picture on the plans screen
- Decision: **This phone's own keyboard**, wearing the letters this person
  drew — the applied board, so on free it is the QWERTY with the drawn letters
  substituted in. A picture and not a button.
- Reason: 「なんかテキストだけだと味気ないな」「絵なんでもいいよ 君のキーボード
  とか載せる？」
- Affected features: the plans screen
- Affected data: none
- Affected docs: CHANGELOG
- Implementation status: implemented. `kbShotHTML(kbOf().lay)` in `vPlans()`,
  which is the same picture the keyboard list is drawn with — no second
  function that draws a keyboard — and `.plkb` in `www/index.html`, which is
  room and nothing else
- Free: yes. It is a picture of what the free plan already gives

## What is the owner's to decide

Research it, lay out the options and what the code does today, and **stop**.
Do not pick:

```
  prices, and which plan buys what
  the free / paid boundary
  anything that deletes data, or how long data is kept
  how a sync resolves a conflict
  a change to behaviour a person already relies on
  wording a person will read
  any threshold or number that is a judgement rather than a measurement
```

The form is "if A then this, if B then this, and here is what the code does
now" — not a question with no groundwork under it, and not a decision made
quietly because it seemed obvious.

**Which plan buys a thing is a price, and a price is not a tool's to
decide.**

## What to report when it is done

"Implemented it" is not a report. Every one of these, every time:

```
  files changed, and why each
  what existing behaviour changes
  what existing data is affected
  what is newly stored
  migration:  yes / no, and what it does
  deletion:   yes / no
  the plan:   what it affects
  tested:     what, and how
  NOT tested: what, and why
  device:     needed? done?
  known limits
```

Say "code confirmed" and "device confirmed" as two separate things, and never
let the first stand in for the second.

## Several sessions at once

More than one session may run at a time. Each one opens by reading, in this
order:

```
  1  CLAUDE.md
  2  docs/STATE.md
  3  the docs/ that cover the area
  4  git status
  5  which branch, which commit
  6  what else is in flight, and where
```

and then **declares its scope before touching anything** -- the files it owns
are the leader's to name, not the session's to choose:

```
### Scope
- Goal:
- May change:            files, by name
- May NOT change:        files another session holds, or that are simply out of scope
- Depends on decision:   which entry in the owner decision log
- Tests to run:
```

### How the work moves

The declaration above says what a session may touch. This says how what it
wrote reaches everybody else. Sessions run in separate containers and share
exactly one thing — the remote — so every rule here is about making the work
visible there early enough to be avoided.

```
  1  one session, one branch          claude/<area>, and never anybody else's
  2  fetch before deciding anything   git fetch --all --prune
  3  read what is already there       git log --oneline --all -40
                                      git log --oneline --all -- <file you mean to change>
  4  push the scope FIRST             an empty commit carrying the declaration,
                                      pushed, before the first line of code
  5  push after every commit          a branch nobody can see is a branch
                                      nobody can avoid
  6  never integrate ANOTHER BRANCH   no merge, no rebase, no cherry-pick of
                                      another branch. The leader integrates.
                                      master into your OWN branch is not that,
                                      and is required before you report
  7  the gate is the leader's         see docs/TESTING.md § the gate, rule 2
```

**Step 3 is the collision test and it is mechanical.** If
`git log --all -- <file>` shows a commit on a branch that is not yours and not
the base, another session is in that file. That is the moment to stop and
report — not when the merge fails, which is hours later and after both of you
have written on top of each other.

**Step 4 is what makes step 3 work.** A session that codes for an hour before
pushing is invisible for an hour, and every other session is deciding against
stale information for that hour. The scope declaration is cheap to push and
it is the thing others read.

**Step 6 is absolute about ANOTHER branch.** A session that merges another
branch into its own has produced a diff neither session wrote. The leader --
another session above this one -- integrates, and asks the owner where the
answer is a decision rather than a merge. Report the conflict and stop; do not
resolve it.

**`master` into your own branch is the opposite and is required**
(OWNER DECISION 2026-08-25). `git fetch --all --prune && git merge
origin/master` before you report, every time. It touches nobody else's work --
it is catching up, not integrating -- and it moves the one job that was
actually jamming the pipe. On 2026-08-25 four branches were integrated and four
conflicts came out; **all four came from a branch that had fallen behind** (52,
86 and 456 commits), and **none** from two sessions wanting the same line. One
of them was 456 behind and its four commits were all re-doing work `master` had
already done by another road, so it was dropped rather than merged.

Resolve what comes out of catching up yourself -- it is inside your own branch.
Stop and report only when you genuinely cannot, which is the rare case where
two people did want the same line.

Two more from the same day, for the same reason: **integrate in batches, not
per branch** (one gate run, not four -- proving the same green four times is
the thing the owner's gate rules already forbid), and **a session's last act is
to push the Scope of its next piece**, so finishing does not mean queueing
behind the leader.

**Who is who.** The owner decides what the app does and confirms it on a
phone. The leader names what each session owns, integrates, and runs the whole
gate. A session does none of those three. → `docs/SESSIONS.md`

### What is forbidden, by name

Every one of these has a reasonable-sounding form, which is why they are listed
rather than left to judgement:

```
  ✗ "while I'm in here, I'll tidy this up"
  ✗ "this could be cleaner, so I fixed it"
  ✗ "it's related, so I changed the behaviour too"
  ✗ "we'll probably need this later, so I added it"
  ✗ "the existing code looked wrong, so I corrected it"
```

Each of those is a separate task. Write it into `docs/BACKLOG.md` and carry on
with the one you were given.

### When two sessions collide

If work turns out to overlap another session's: **STOP.** Report

```
  my scope
  their scope
  files in common
  functions in common
  where a conflict is likely
```

and do not merge the two yourself. Two sessions each half-applying the other's
intent produces a diff nobody wrote and nobody can review.

Do not guess at what another session meant and write over it. **Do not decide a
spec from reading the code** — the code is what happened, not what was wanted.
If it is unclear, stop and collect the questions rather than picking an answer;
a wrong guess that tests green is the expensive kind.

## What one commit is

These do not share a commit:

```
  a feature
  a bug fix
  a refactor
  a rename
  a UI change
  a data migration
```

Bad:

```
  add the feature + tidy the nearby code + rename two functions + delete
  the old path
```

Good:

```
  A  the feature
  B  the bug fix it turned out to need
  C  the refactor, on its own
  D  the renames, on their own
```

**If a refactor changes behaviour, it is not a refactor.** Say so before doing
it, and it becomes a decision, not a cleanup.

## Done

"I wrote the code" is not done. Done is:

```
[ ] the spec is confirmed, and the decision it depends on is in the log
[ ] the blast radius is known
[ ] the docs that apply are updated
[ ] implemented
[ ] npm test green
[ ] the regression test for this specific bug is green
[ ] the bug was PUT BACK and the test was watched going red
[ ] node --check, and any static check that applies
[ ] device verification, if docs/TESTING.md § device says so
[ ] the owner has confirmed
[ ] docs/CHANGELOG.md updated
[ ] mergeable
```

and every report separates these three, always, without exception:

```
  CODE CONFIRMED      the checks are green here
  DEVICE CONFIRMED    somebody ran it on a real iPhone
  OWNER CONFIRMED     the owner looked and said yes
```

None of the three implies another.
