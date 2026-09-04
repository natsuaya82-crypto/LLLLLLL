# Lingua

A conlang-building app. Plain HTML/CSS/JS under `www/`, wrapped by Capacitor for iOS
(`ios/`, appId `com.tokinets.lingua`, webDir `www`).

**There is no build step and no bundler.** `www/index.html` loads every `.js` with a
`<script src>` tag. What is in the repo is what runs on the phone.

> **New here? Read `docs/STATE.md` first.** This file says how the code has to
> be written; that one says what has been built and what has not. It opens with
> two `git rev-list` lines to run before deciding anything is missing —
> `master` once sat 144 commits behind, and a session that cloned it reported
> the system keyboard as unbuilt, correctly, about an app a week old. It also
> says the two that are easiest to get backwards: **the server holds both
> halves** — the timeline and the language, `post` `react` `follow` `profile`
> `draft` `language` `slice` and the notices RPC, with `localStorage` as the
> copy that survives a bad network — and CI runs three of these checks
> (`assets`, `es5`, `i18n`), so a green tick on a push is not the gate. Ask the
> repository rather than this line, which is what that file exists to say:
> `grep -o "rest/v1/[a-z_]*" www/net.js | sort | uniq -c`, and `npm test`'s
> last line for how many checks there are.

## The rules that come before the code

Everything under this heading is absolute. The detail lives in `docs/`; what is
here is the part that may not be argued with, and the file that holds the rest.

**Data.** Nothing a person made is removed because the current shape does not
need it, because it is an old format, to save space, or because something was
restructured. A migration **copies** and never removes what it read. A restore
fills in what is **missing** and stops — the way a backup destroys somebody's
work is by winning. "Empty" and "broken" are different states and must not
share a branch. Automatic deletion, pruning and cleanup are forbidden unless a
written spec asks for them; anything that deletes gets a DELETE REVIEW first.
→ `docs/DATA_SAFETY.md`

**The past.** Do not re-generate past data from the present state. If something
means what it means because of how things were when it was made, that goes ON
it at the moment it is made — the value, not an id pointing at the current
object. `post.ink` is the worked example and `card-check` is what holds it.
→ `docs/DATA_MODEL.md`

**Money.** A plan decides what a person may DO and decides nothing about what
exists. No backup, restore or byte of anybody's language may depend on payment,
and "the no data" — a failed check means fewer buttons, never fewer words.
**`plan-check` holds it**: five hundred words made on the paid plan are five
hundred words after it ends, the list is a hundred, and not one byte of any
slice moved. → `docs/PAID_FEATURES.md`

**Online.** **The server is where things live, and that is both halves of
the app.** Everything the timeline is made of — posts, photographs, the voice,
**drafts**, the handle, the display name, the profile picture, reactions,
follows, blocks and reports 「SNSは全部サーバー」 — **and the language itself**,
every slice of it, the keyboard among them, because a keyboard is part of a
language. **⚠ 2026-09-04 に差し替えが決まりました ── オンライン前提。iPhone には言語を置きません。**下の一文はまだコードがそうなっている、という記録です（`docs/FEATURE_RULES.md` の決定ログ）。
The phone keeps the copy that works with no signal; **it is never
where a thing lives.**

**NOTHING IS THE PHONE'S. EVERYTHING IS THE ACCOUNT'S.**
「端末ごとにやることなんてねえよ」「アカウントごとってずっと言ってるよな？」
「アカウントごとに言語情報も違うんだって」 OWNER 2026-09-03.

Every single thing a person has belongs to the account they signed in as: the
language and every slice of it, the posts, the drafts, the profile, the plan,
the saved searches, how far down the notices they have read, and **the
settings**. The phone holds a copy so the app works with no signal, and that
copy is filed under the account it belongs to. **A phone is a window, not an
owner.**

**This replaced a list.** Until 2026-09-03 this said 「three things are the
phone's — a backup file, an exported sheet, and the settings」, and that
sentence cost the owner their language. It is how a phone came to hold things
that named nobody: a language made before the stamp existed, a plan with no
account on it, a settings key shared by everyone who ever signed in. Then
deleting one account emptied the phone and took another account's work with
it, and the only copy was the one the phone had destroyed.

**So there is no such category and no such list.** A backup file and an
exported sheet are that account's language in a form a person can hold. The
settings are that account's settings. When something new is stored, the
question is not 「is this the phone's」 — there is no answer to that — it is
**「which account is this」**, and a thing that cannot answer it is a thing
that must not be written down.

The one exception is the session itself, and it is not an exception in the way
it looks: `lingua.sess` is not a thing somebody has, it is **which account
this phone is**. Nothing else on the phone gets to be nobody's.

Anything that needs the server is built assuming the server is
there. A screen that half-works without one is not a step on the way to being
online — it is a bug, and it is found by somebody using the app rather than by
a check, because nothing throws. The timeline is the worked example: the three
sns tabs and the composer never asked who you were, while every write in
`schema.sql` had gone through `is_member()` from the first day, so signed out
you could write a post that went nowhere. Reading the timeline and posting to
it both need an account now, **and so does making a language** 「言語はアカウント
ないと作れないです」「ログインした人しか書けないけど」. The server is where a
language lives, the phone keeps the copy that works with no signal, and what was
made offline goes up when there is a signal again 「制作はオフラインでも可能次
つながった時に更新される」 — offline is a phone that is CARRYING an account, not
one that has none.

**The onboarding is the one place making happens before there is an account,
and that is the order the owner asked for** 「オンボーディング→最後にログイン」.
Somebody draws a letter, is walked through the app, and names what they are
making; the door is the LAST step, and `obFinish()` calls `netLangSync()` the
moment they are through it, so what they made goes up as they arrive. **A
screen that makes something before that door still has to put it on the
server at it** — anything added to the walk is added to what that call
carries, and there is no second road out: 「あとで」 is gone and nothing gets
past the door without signing in.

It was read the other way for two days. 「言語はアカウントないと作れないです」
says what a language NEEDS, not what order the screens come in, and a session
turned it into "so the door is first" — an app whose first screen was a
sign-in form, on the owner's phone, which is not what they asked for
「そんなの俺頼んでねえぞ」. `open-check` holds it now by starting from an empty
`localStorage` and reading what is on the screen: `appIs()` answered `'ob'`
correctly through the whole of it, so every check that asked `appIs()` was
green.

**There is one kind of account and there are no anonymous ones** 「匿名アカウント
はねえよ」「二種類になる意味も分からないけど」. An account is somebody who
signed in. The onboarding ends at that door and there is no way past it. Nothing
asks a second question about what kind of account this is — `has_account()`
beside `is_member()` existed to let an anonymous one through, and there is
nothing to let through. **The first language is the one place this is not true
yet**: it is minted at the top of `www/core.js`, which `index.html` loads before
`net.js` exists, so it cannot ask anything about a session — and it is minted
for somebody who has not reached the door yet, which is the paragraph above
rather than a hole. What closes it is that the door is on the way out:
nothing made in the walk stays account-less past `obFinish()`. `claude/admin`
has the rest. 「最初からオンライン前提で作れ」 → `docs/FEATURE_RULES.md`

**Shape.** Four things are banned outright: a row of round chips you scroll
sideways (if there are more than a few, it is a **list**); the thing being
chosen and the thing being changed on one screen (choosing is a screen,
changing is the screen you arrive at); a sheet that slides up **in place of a
screen you would otherwise have gone to**; and explaining. The keyboard
chapter had all four at once. 「丸パッチ無限横並び、同じページに情報量詰め込み、
ページ遷移型にせず下からひょいって出すやつ、無駄に説明をするやつ、この辺禁止」

**A FIFTH: THE SYSTEM'S OWN DIALOG IS BANNED — WITH ONE THING IT IS FOR.**
「標準は使わねえって言ってるだろこれも禁止や」「禁止事項入れろ」 OWNER
2026-09-01. `confirm()`, `alert()` and `prompt()` — none of them, anywhere.
The reason is one line: 「iPhoneのやつ使ってるsnsないしな」.

**The one thing it is for is the two or three lines that ask whether to change
or remove the thing under your finger, and it is iOS's own.**
「アイコンをタップした時にiPhone標準の写真を選ぶか、削除するか出てくるやつで
いいだろ」 OWNER 2026-09-01, and 「タップしたらios標準出して」 again on
2026-09-03 when this was put to them a second time. The profile picture is
that, and it is the only one. `UIAlertController` is how it is drawn, so it
lives in `ios/` and cannot be reached from `www/`.

**A sheet that stands in for a SCREEN is still banned** — a screen's worth of
work lifted from the bottom because nobody wanted to make a page. And **a
sheet drawn in HTML to look like the system's is the banned kind wearing the
allowed kind's name**, which is closed.

Everything else asks in a thing of this app's own, drawn inside the screen:
`popAsk()` for a question, `toast()` for a statement, `openForm()` for
something to type into. **Ask before making a fourth** — three were made and
three were thrown away in one afternoon (a page you travel to, the app's own
bottom sheet, and `confirm()`).

`tools/es5-check.mjs` holds the `www/` half: `confirm(`, `alert(` and
`prompt(` anywhere under `www/` fail it. It was prose alone for two days, and
in those two days the language's name was renamed with `prompt()` and two
ceilings spoke with `alert()`.

**And the owner has since given ten criteria that every screen is held to**
(OWNER DECISION 2026-09-01) — system standard first, the patterns every SNS
shares, one tap, little on a screen and wide margins, quiet animation, two or
three colours, one or two faces, 44pt, undo rather than a confirm, and a real
phone. They are written out in full, verbatim, in `docs/FEATURE_RULES.md`
§ Owner decision log, and that entry also names **the two places this repo does
not meet them yet** — neither of which is a session's to go and fix on its own.
→ `docs/FEATURE_RULES.md`

**And a fifth: NO ROUNDED BOX.** 「角丸やめろ」 Nothing new gets a corner
radius, a border, or a filled panel — not a button, not a banner, not a
notice. What is left is the words, in the colour everything pressable is:
`.btn.ghost` where a button is wanted and a plain row where one is not. The
class comment on `.btn.ghost` has said so since it was written —
「文字書いて四角で囲ったみたいなボタン全部やめてくれ。ダサすぎる」 — and it was
broken three times in one afternoon: a gold pill on the frozen screen, a
bordered strip across Home, and a gold pill on the password screen. `.btn`
still exists and is on about thirty older screens; it is not to be reached
for again.

**Rows in one list are one height.** Set `font-size` and `line-height` on the
row class rather than letting the tag decide -- a `<button>` takes the
browser's 13.3px/normal and an `<a>` takes the body's, and the same row came
out 49px as one and 57px as the other. No `margin-top` on a row to make a
group either: that is one row taller than its neighbours. **`press` holds the
first half** -- siblings of one class rendering at two type sizes -- and it
prints how many lists it measured on every run. The `margin-top` half is prose still.
→ `docs/FEATURE_RULES.md`

**Explaining.** No explanatory text in the app. A screen shows what it is and
what can be done on it; it does not explain itself, does not say what a paid
plan would give, does not tell somebody what to tap, and does not describe what
a setting means. An empty state, a count, a state, an error — none of those is
an explanation. Where one is genuinely needed it goes behind the `?` in the
bar, which is what the `?` is for. 「アプリ内に説明書くの禁止」

**NOTHING HOLDS THIS ONE, AND THAT IS SAID HERE SO SILENCE IS NOT READ AS A
CHECK.** It was measured on 2026-09-01 and every mechanical form of it is a
lying proxy. `.note` is worn 39 times and most of them are what this rule
ALLOWS — an empty state, a count, a state, an error — so a check on the class
would fail the app for obeying the rule. A `.d` or `.eg` key is not an
explanation either: a third of them are `aria-label`s, which nobody sees and
every screen needs. What is left is the sentence itself, and no check can read
a sentence. So this is **a rule a person holds by reading the screen**, the
owner's eye is what has caught every breach of it so far, and a session may not
write 「the check is green」 about it.

**Narrowed on 2026-08-22, and only this far.** 「必要な説明は書いてね。みて
わからないのが一番ダメ。最低限ね」 Where the app has TAKEN SOMETHING AWAY and
the screen would otherwise be a state with no cause and no way out, the
sentence it needs is written — minimum, and nothing beyond it. The frozen
screen is the case that settled it and the only one that has it. Everything
in the paragraph above still holds everywhere else.
→ `docs/FEATURE_RULES.md`

**Tests.** A fix is not done until the check that holds it has been **watched
failing** with the bug still in place. Saving, past data, plans, deletion,
migration and sync all require a regression test. "Code confirmed" and "device
confirmed" are two separate statements and the first never stands in for the
second. → `docs/TESTING.md`

**Simple, and a bug is REWRITTEN, not patched.** 「直すじゃなくてシンプル実装→
修正じゃなくてコードそのものの書き換え」「じゃないと、いつまで経ってもバカな
バグが出てくるだろ」 OWNER 2026-09-03. One thing is done by ONE mechanism, and
no question is answered in two places. When it turns out to be wrong, **that
code is deleted and written again** — the two words are different acts and
only one is allowed:

  *patch* — leave what is there and add to it: one more condition, a second
  check, an exception. **Forbidden.**
  *rewrite* — take that code out and write the right shape. It is usually
  shorter.

If it was asking the wrong thing, rewrite what it asks — never add a second
thing that asks again. **A new mechanism covering the old one's gap is the one
thing that must not happen**: from then on the feature runs on two and nobody
can say which is deciding. And **the old one is deleted** — not kept beside
the new one, not 「as history」, not 「just in case」: what is left standing is
read, and what is read is obeyed. This is not about large designs; it is about
the moment you reach to add one line. **Nothing stops this. A person holds it
by reading the change.** → `docs/FEATURE_RULES.md`

**Refactoring.** Not a goal. Only for duplication that causes bugs, a spec
change that would touch several places, something untestable, or a feature
actually blocked. If pulling something out adds a dependency between files that
did not need each other, leave it. A behaviour change, a refactor and a rename
never share a commit. → `docs/FEATURE_RULES.md`

**Deciding.** Prices, the free/paid boundary, deletion, retention, conflict
resolution, changes to behaviour somebody relies on, wording, and any threshold
that is a judgement — none of these are decided here. Research it, lay out the
options and what the code does today, and stop. Do not read a spec off the
code: the code is what happened, not what was wanted.
→ `docs/FEATURE_RULES.md`

**Answer before you move, and move only on what was asked.** 「手を動かす前に
答えを言えよ」「勝手な判断すんなよ」「許可してないことやるなって言ってるだろ」
OWNER. Say in one line what you are about to do, and wait. Nothing that was not
asked for — not a button, not a screen, not a tidy-up, not an integration.
A thing you thought would help, that nobody asked for, is a thing somebody has
to find and undo.

**A cause is FOUND, not guessed.** 「憶測で判断するな」「原因を確かめずに治す
って治すって言葉の意味と真逆ですけど？」 OWNER 2026-09-03. Reading the code and
naming a likely line is a guess, however confident the sentence sounds. Press it,
measure it, or say plainly that you have not. **A fix for a cause nobody
confirmed is a swing in the dark**, and three days went that way: the search
fault was named twice from reading and was wrong twice; the Settings button had
three causes listed and was never once pressed.

**What was fixed is SHOWN.** 「スクショで見るのは俺の方なんだから直したところは
俺に見せろ」 OWNER 2026-09-03. The owner is the one holding the phone. Take the
screenshot and put it in front of them; do not look at it yourself and call that
confirmed. And **never write 「直りました」 about something that has not been
pressed** — say what was checked and what was not, separately.

**AND ANYTHING WHOSE LOOK CHANGED IS SHOWN, EVERY TIME.**
「見た目を変えたものは必ずスクショで提示する」 OWNER 2026-09-04. Not「if it
seems worth it」and not「the diff says what moved」. A screen that renders is
not a screen that looks right, and the owner is the only one who can say which
it is. `node tools/shot.mjs --lang ja <screen>` takes it; a state the tool
cannot reach is a state to make reachable in `tools/fixture.mjs`, not a reason
to skip the picture. **Where a thing has two states — pressed and not, on and
off — both are shown**, because the fault is nearly always in the one nobody
photographed. **Nothing holds this. A person holds it by asking for the
picture**, which is what the leader does at every audit.

**Saying what you are doing, while you are doing it.** Work is reported as it
happens, not at the end. Before a step that takes more than a moment -- a
check, a measurement, a build, a file being rewritten -- say in one line what
it is and why; after it, say what came back. Silence for ten minutes is not
work being done quietly, it is a session that cannot be steered: by the time
the report arrives the wrong thing has already been built. One line each, in
the order they happen. 「せめてやってる作業を細かくここにログで残せや」
「死ぬほど長い作業をやめてやってる作業を毎回報告する」

This is the opposite of a long reply. Short lines, often. Not a long one at
the end.

**Reporting.** "Implemented it" is not a report. Files and why, what behaviour
changes, what data is affected, what is newly stored, migration, deletion, the
plan, what was tested, what was not, whether a device is needed, known limits.
→ `docs/FEATURE_RULES.md`

**Recording.** Anything that changes what is stored, moved or removed goes in
`docs/CHANGELOG.md` — before the code, not after.

**And when a decision replaces a rule, FIX THE RULE — in the same commit.**
Recording it is not enough. A rule works because it is read, so one that still
says the old thing is still being obeyed, and the decision has not landed
however carefully it was logged. 「古い規則残りすぎ」「新しいのにしたらルーるも
直せよ」「そのせいで毎回古いルールに引っ張られてんじゃん」 **Fixing means
deleting**: do not leave the old sentence standing with 「this is history」 in
front of it, because it will be read anyway. 「歴史とかいいから消せよ」
`docs/CHANGELOG.md` is the one exception and is never rewritten — it records
what was true on a day. Everywhere else, including this file, only sentences
about now. → `docs/FEATURE_RULES.md`

**And a rule that nothing STOPS says so, in its own line.** 「書いていて
止めないの本当に何？」 OWNER 2026-09-01. Writing is for a person; it stops
nobody. So the convention here is: **a rule held by a check NAMES the check,
and a rule that names none is held by a person reading the screen.** Neither
kind is optional — what is forbidden is the third kind, a rule written as if
something were stopping it when nothing is, because that is the one a session
reads as 「the gate would have caught me」. When a rule cannot be held
mechanically, say that in the rule instead of leaving it bare. Explaining is
the worked example above.

**"Rule" is the wrong word for what has to be fixed, and the wrong word let a
whole file rot.** What goes stale is anything WRITTEN DOWN — a rule, a
handbook, a comment over a function, and above all `docs/STATE.md`, which says
what is BUILT. That last kind is the most dangerous and was the one nothing
covered: a stale rule reads as odd and gets questioned, while a stale statement
of fact is simply believed. 「古いのは全部新しくする約束は？」 So: **a change
lands with every sentence it falsifies, wherever it lives.**

`docs/STATE.md` is the case that proved it. Three places tell a session to READ
it — the head of this file, the table below, and `docs/SESSIONS.md` twice —
and **not one place told anybody to WRITE it**, so it belonged to nobody and
went months out of date while every session opened with it. It said "No
StoreKit" with `LinguaStore.swift` shipped and `storeBuy` called from
`setPlan`; it said the Apple capability was still to do after the owner had
done it. A leader read those sentences and told the owner their own finished
work was outstanding. **It is the LEADER's file**: the leader is where every
branch's report arrives and where the owner's decisions land, so the leader is
the one who knows what became true today.

And the same reason the corners needed `box-check`: prose does not hold a rule.
This one is not held by anything yet — `docs/BACKLOG.md` carries what a check
could mechanically catch (a line claiming something is absent while the code
has it) and what it could not.

**An owner decision is a specification, not an instruction for today.** When
the owner settles behaviour, a threshold, a limit, the free/paid line,
retention, deletion, migration, how past data behaves, timing, what is
selected, or what a screen does: record it in the decision log, implement
exactly that, and do not reinterpret it into a more reasonable rule or
generalise it to anything nearby. A later session reads it before changing
that area, and does not re-open it because a different shape seems more
natural. If a decision conflicts with a rule already written down — **stop**,
report both sides with the code and data affected, and do not resolve it
yourself.

**But stop only when the owner has not spoken.** When the new side is something
the owner has **just said**, it wins: that is the specification, not a conflict
to escalate. Mark the old decision superseded, fix the rules it wrote, and carry
on — in the same commit. Do not ask 「this overturns the decision of the 22nd,
is that alright?」 about something they replaced this morning; they know what
they said before, and asking makes them say it twice. 「それもふるいわ いつまで
ふるいのずっとやってんだよ うぜえな」「毎回新しくしろよ」 Stopping is for two
WRITTEN decisions that disagree with **neither restated** — that case, and no
other. → `docs/FEATURE_RULES.md`

**Code is not the specification.** Code says what is happening; `docs/` says
what should happen; an owner decision settles it. When code and docs disagree,
the code does not win by being real — report the contradiction and ask. The
order is: owner decision → spec → tests → code.

**Scope.** More than one session runs at a time. Each opens by reading
CLAUDE.md, `docs/STATE.md`, the docs for the area, `git status` and what else
is in flight, then states what it may and may not change. Five things are
forbidden by name, because each has a reasonable-sounding form: *while I'm in
here*, *this could be cleaner*, *it's related so I changed it*, *we'll need
this later*, *the existing code looked wrong*. Each is a separate task —
`docs/BACKLOG.md`.

**And how the work moves, so that separate containers can be put back
together.** One session, one branch (`claude/<area>`), and never anybody
else's. `git fetch --all --prune` before deciding anything; the remote is the
only thing sessions share. `git log --oneline --all -- <file>` before changing
a file — a commit there on a branch that is not yours is another session in
that file, and that is the moment to stop and report, not when a merge fails.
Push the scope declaration as the FIRST commit, before any code: a branch
nobody can see is a branch nobody can avoid. Push after every commit. **Never
merge, rebase or cherry-pick ANOTHER BRANCH** — **the SUB-LEADER integrates, and
the LEADER does when there is no sub-leader** (OWNER 2026-08-28「取り込むのは
サブリね？」then「じゃあ君が取り込んで」), and asks the leader where the answer
is a decision rather than a merge. **Bringing
`master` into your own branch is not that and is required before reporting**
(2026-08-25): it touches nobody else's work, it is catching up rather than
integrating, and it is what makes the leader's merge a fast-forward. Every one
of the four conflicts in that day's integration came from a branch that had
fallen behind; none came from two sessions wanting the same line.
**The one page to hand a session is `docs/SESSIONS.md`.** It carries the rule
that actually prevents a collision rather than finding one: **the leader
names the files a session owns, and a session edits nothing else.** The leader
is another session above this one -- it names the territory, integrates the
branches and runs the whole gate; a session does none of those three. `www/index.html`
is the known hazard -- every screen's CSS is in it -- so one session at a time
owns it until that file is split by chapter.
The top of `docs/SESSIONS.md` is a block to copy whole into a session's first
instruction, with three blanks to fill in.
→ `docs/SESSIONS.md`, and `docs/FEATURE_RULES.md` § several sessions at once

**One commit is one kind of thing.** A feature, a bug fix, a refactor, a
rename, a UI change and a migration do not share a commit. A refactor that
changes behaviour is not a refactor.

**Done** is not "the code is written". Spec confirmed, blast radius known,
docs updated, implemented, the check that holds it green, **the bug put back
and that check watched going red**, static checks, device if it is on the
list, the whole gate green (whoever integrated ran it, not the session), owner
confirmed, CHANGELOG updated. Every report separates `CODE
CONFIRMED` / `DEVICE CONFIRMED` / `OWNER CONFIRMED`, and none of the three
implies another. → `docs/FEATURE_RULES.md`

**Five states, and they are not the same.** `BACKLOG` might happen ·
`OWNER DECISION` has been decided · `SPEC` this is how it behaves ·
`IMPLEMENTED` it is in the code · `VERIFIED` checks green and a phone. A
backlog entry is not permission, and neither is the absence of one.

| file | what it holds |
|---|---|
| `docs/ARCHITECTURE.md` | the shape of the app, and where each thing is the truth |
| `docs/DATA_MODEL.md` | every stored thing, its owner, and whether it may change under somebody |
| `docs/DATA_SAFETY.md` | how a language is not lost; the backup rules; DELETE REVIEW |
| `docs/FEATURE_RULES.md` | the eleven questions before code; past data; refactoring; what is the owner's |
| `docs/PAID_FEATURES.md` | `CAN`, the three plans, and what money may never touch |
| `docs/TESTING.md` | what to run when; how to fix a bug; what needs a device |
| `docs/CHANGELOG.md` | what a person would notice, and every change to stored data |
| `docs/FEATURES.md` | every feature, its plan, its data, and whether the owner has decided it — read before building anything |
| `docs/BACKLOG.md` | found and deliberately not done, and why |
| `docs/STATE.md` | where the project stands — read first, and **the leader writes it**: every session reads it, so a sentence left stale there is believed by all of them |

## The gate

```
npm test        # tools/gate.mjs -- the FAST ones with no browser in a row
                # (assets, es5, grammar-engine, dead, import, sides, face, box,
                # store, ~2s), then the SLOW ones four at a time. NOT run by a
                # session -- rule 2. How many there are is FAST.length +
                # SLOW.length in tools/gate.mjs, and the run PRINTS it on its
                # last line: read it off there, not off any sentence here.
```

Individual: every check in `FAST` and `SLOW` has an `npm run` alias in
`package.json`, and that file is the list — `node -e "console.log(Object.keys(require('./package.json').scripts).join(' '))"`.
Do not restate them here. `assets-check` holds both directions: a script naming
a tool that is not there, and a gate entry with no script to run it by.
`tools/gate.mjs` is what `npm test` runs. The ones that need no browser go first, one
after another, in about two seconds — a missing script tag or an arrow function fails
there and nothing heavy is started at all — and the ones that each start a headless
Chromium then go **four at a time**. Sequentially they were ten minutes. Each check's
output is printed whole and in list order, so a counter that moved is still visible.

**Three rules about running it, and they are the owner's.** *Once before pushing, not
once per commit* — make the whole batch, gate it once, push; a session that gates five
commits separately has spent half an hour proving the same thing five times.
「全部やって完成！じゃあ全部のチェックを回す」 *While working, run the fast nine —
they are two seconds and they catch what blanks a device.* *Watching a check fail is
one run, not a suite* — put the bug back, run the one check that holds it, watch it
go red, take the bug out.

**EVERYTHING IS FIXED FIRST, THEN THE GATE, AND THE BUILD LAST.**
「いや全部直してからビルドは見るんだって」「バグるならいらん」 OWNER
2026-09-03. **One item left undone is a reason not to build.** A build number
that goes up, a notification that arrives, and a phone picked up to find the
same fault still there is the owner saying the same sentence twice — which is
what this rule exists to stop.

**And what is NOT done is said BEFORE the build, not after it.** 「お前が伝えた
中にまだ終わってねえことがあったなんか言われてねえだろ」 OWNER 2026-09-03. A
「出して」 answers what the owner was told; it is not permission to leave the
rest behind. Say what is outstanding, then let them decide.

**The sub-leader integrates and runs the gate — the leader does both when there
is no sub-leader — and the leader triggers the build, once everything is done
and the gate is green.**

**And then push, without running it green.** 「ゲートが緑になる確認は…まとめて。
個人個人でやる必要ある？」 OWNER 2026-08-27. **Red is work and green is
verification**: only the person holding the bug can see it go red, and the green is
the same green however many people watch it. `npm run press` is five minutes — paid
by the session, the sub-leader and the leader it is fifteen, and **the third green is
not truer than the second**. It was measured: two chapters ran five to six hours, and
the repeated green runs were most of it.

**Who runs it depends on how many of you there are, and that is the whole of the
exception.** The sentence above says *you* run it once before pushing, and
`docs/SESSIONS.md` says a session never runs it at all — the leader does, once, after
integrating. Both are true and they are about different days:

- **Parallel sessions are running** → `docs/SESSIONS.md` wins. **A session runs
  nothing.** It pushes, and the SUB-LEADER runs the gate on what was pushed —
  「ゲートは全部プッシュしてサブリが確認するんでしょ？個人ではやらない」 OWNER
  2026-08-28. Sixteen minutes of gate multiplied by three sessions is the same green
  proved three times, and the third one is not more true. **Do not tell a session to
  run a check** — not the whole gate, and not one by name.
- **One session, nobody else in the tree** → this section wins. You are the leader,
  so "once before pushing" and "the leader runs it once at the end" are the same
  sentence.

What is forbidden either way is unchanged: proving the same green twice.

`tools/pre-commit` runs the ones that need no browser plus i18n when a screen file
changed. It is not the whole gate: run `npm test` yourself, once, before the commit.

It is `tools/gate.mjs` rather than an `&&` chain, and speed was the smaller
reason. A chain **stops** at the first failure and prints nothing to say what
never ran — which is how `fill` and `round` dying at module load took `round`
and `press` with them, silently, with everything above the stop looking green.
Every browser check owns a distinct port; that is load-bearing now.

Do not silence a failure. Every one of these fires on a real bug that no browser
and no CI runner would show — the checks exist because each of them already shipped once.

```
npm run rls     # supabase/schema.sql, and somebody who is not you (~15s)
```

Not in `npm test`, because it stands up a real PostgreSQL and the gate has to
run on a laptop in an airport. Run it whenever `supabase/schema.sql` changes —
that is the only time it can start failing.

The phone talks to Supabase directly; there is no server of ours in front of
it, so the app is a suggestion and the row level security in `schema.sql` is
the whole of the security. A policy that is too wide breaks nothing: nothing
throws, every screenshot is right, and `npm test` is green, because there is
only ever one person in a test. So `rls-check` is a second person — it applies
`schema.sql` unchanged to an empty database and then tries, as B and as
somebody with no account, to do every one of the things the file says cannot be
done -- `CASES` in `tools/rls-check.mjs` is that list, and the run prints how
many it tried. Count them off there.
Adding a policy means adding the line somebody would use against it.

## The twenty-two rules the gate enforces

Twenty-two is how many rules are written below. **The gate is a different number
and the two must not be made to match** — count the rules here, and read the
gate's own last line for the other (it prints `FAST.length + SLOW.length`). One
rule can take three checks and one check can hold two rules. Do not write the
gate's number here.

### 1. `www/**/*.js` must be ES5

Everything under `www/` runs in WKWebView on whatever iPhone the user already owns.
An arrow function there is not a lint complaint — it is a blank screen on a real phone.

Banned (`tools/es5-check.mjs`):

`=>` · `const`/`let` · template literals · `class` · `new Set/Map/WeakSet/WeakMap/Promise/Proxy` ·
`Symbol()` · spread `...` · `Math.hypot/trunc/sign/cbrt/log2/log10` ·
`Object.assign/entries/values/fromEntries` · `Array.from/of` ·
`.includes/padStart/padEnd/find/findIndex/startsWith/endsWith/repeat/flat/flatMap/trimStart/trimEnd` ·
`async`/`await` · `?.` · `??`

Use `var`, `function`, string concatenation, `indexOf() !== -1`, manual loops.
This applies to `www/` only — `tools/*.mjs` is Node and may use anything.

### 2. Every user-facing string goes through `t()`

Ten interface languages live in `www/i18n/{en,es,pt,fr,de,it,ru,zh,ko,ja}.js`.
`en` is the source of truth for the key set; the other nine must answer exactly the same keys.

- Never hard-code a visible string in a screen file — including `placeholder`, `title`,
  `aria-label`, and anything passed to `toast`/`alert`/`confirm`/`prompt`.
- `{0} {1}` placeholders and `<br>`/`<b>`/`&#10;` markup must survive translation intact.
- "Lingua" is never translated.

`i18n-check` renders every screen in a pseudo-language of accented look-alikes; text that
comes out in plain letters never passed through `t()` and fails the build. It also walks
every screen in all 10 languages with fallback-to-English armed — one fallback fails.

It reads the source for three things the mirror cannot see, because they never reach the
DOM: `SPEAKS` (a literal handed to `toast`/`alert`/`confirm`/`prompt`), `PAINTS` (a literal
handed to `fillText`/`strokeText` — the card is a canvas, and a canvas is not text; only
`Lingua` may be painted), and `NAMES` (`t('tab.x')` outside `shell.js` — what a screen is
called is `PAGES`' to say through `pageName()`, and naming one anywhere else is the same
screen named twice).

### 3. No JavaScript inside the markup

A button carries a **name**, never code. Never write `onclick="..."` or any other
`on*=` attribute — `act-check` fails on one anywhere, so the class cannot come back.
That is asked of what a screen RETURNS and of `index.html`'s own shell, which
is returned by nothing and therefore reached by no walk. The shell's two — the
sheet's backdrop, `#sbg` and `#sheet` — are named in `SHELL_OK` in `act-check`.
**Named, and the names have to keep matching**: an exemption left standing over
markup that has changed fails the same as a new handler. They are the only two,
they are the static shell rather than a screen, and nothing new joins them.

```js
'<button' + DO('tkAdd', [w.hw]) + '>'      // -> data-do="tkAdd" data-a="[...]"
```

`www/act.js` holds the tables and the one delegated listener: `DO` (pressed),
`AFTER` (a second name on the same press), `IN` (typed into), `CH` (changed),
`KD` (Enter). Arguments travel as JSON, so a number stays a number and nothing
is escaped by hand.

Every name a screen can say is registered in `www/act-map.js` **with the function
itself, not its name** — `act('openWord', openWord)` — so a deleted function stops
the app loudly on load instead of failing on someone's phone weeks later.

Adding a button means adding its `act(...)` line in the same commit. `act-check`
proves both directions: no name without a function, and no entry no screen names
(a dead entry is a button that used to exist).

**And that no name is written down twice**, which is neither direction and was
what neither of them could see. `act('x', x)` twice throws nothing, leaves
nothing unreached, and the second call simply writes the same function over the
first — so four names sat registered twice with every check in the gate green,
because everything the gate said about `act-map.js` was about names it does NOT
have. It matters because that file is the one place a screen's vocabulary is
written down: two entries means two people each believed they were adding it,
and the next one to change the first will be overwritten by an entry they never
saw. Read off the source, not the page — at run time the duplicate is already
gone — and with the comments stripped first, or the file's own worked example
in its opening comment is reported as a duplicate of the line it documents.

`press-check` is the other half and not the same statement: it dispatches a real
click on every button of every screen and fails if one throws or empties `#app`.
It also measures two things while it is there, both for the same reason --
the viewport is phone-sized and every screen is already standing in front of
it. **44pt** on both sides of anything a thumb has to hit. A key of a
keyboard is the one exception and is measured on its height alone — ten letters
in a row is what QWERTY *is*, and ten of anything across a phone is 35pt on
every phone ever made, Apple's own keyboard included. Widening that floor to 44
would not make a keyboard safer to type on; it would forbid a keyboard.
**And which class is actually WORN by something.** A screen can be deleted and
its CSS stay: `a.set` is styled under a comment naming two documents that are
no longer anchors, and `.weave` is the sentence-weaving chapter, whose word
appears in no `.js` file at all. `dead-check` asks this of every function and
nothing had ever asked it of a selector — and a grep cannot, because a class is
worn from a string built by concatenation, from `classList.add`, and from
`index.html`'s own markup. So the PAGE is asked, from here, after every build
AND after every press: a render-only walk never reaches `.on`. The ones styled
and worn by nothing are frozen in `tools/css-baseline.txt` as a ratchet — read
the file for how many are left, not this line.
**It says "nothing here wore it", not "it is dead"** — a class worn only in a
state the walk never reaches is on that list too, and clearing a line by adding
the seed is the better fix. A person reads it; the list is not a licence to
delete. Its first version reported `.bar` as unworn, which was the check's own
blind spot (`show()` builds no shell), not a dead rule — a pass through the
real `render()` was added rather than a baseline frozen over the gap.

**And that rows in one list are one height** -- siblings under one parent,
wearing one class, coming out at two heights AND two computed type sizes.
That last clause is the check: the first version asked "different tag"
instead, and watching it fail showed the tag was never the cause. A different
tag is a thing that is often true when the cause is present, which is what a
proxy is, and a check built on one gives the right answer for the wrong reason
until the day it does not. What it asks now is the sentence the rule itself
writes down. `press` prints how many lists it measured; read it off the run.

A name can resolve to a function that throws the moment it runs — `act-check`
calls that button fine. Both fixtures and the half-done screen list live in
`tools/fixture.mjs` so the two walk the same app; add a screen there, not to one
of them.

### 4. A route carries its view

`PAGES` in `www/shell.js` says what a route is called and which tab it is
under. `www/route-map.js` says what it *shows* — `page('build', vBuild)`, the
function itself, never its name, exactly as `act-map.js` does. `render()` looks
it up; it used to be a chain of conditions, a second copy of `PAGES` that
nothing could check against the first. `act-check` prints `routes reached: n/n`
on every run; count them off `PAGES` or off that line and not off this one.

Adding a screen means a `PAGES` entry and a `page(...)` line. `act-check`
proves both directions: a route with no view silently became the home screen
under another screen's name, and a view on no route was simply unreachable.
`vOb` is the one exempt view — the onboarding is what the app *is* until
`SET.done`, not a place you navigate to.

### 5. Nothing that nothing reaches, and nothing that is nothing

Every function declared in `www/` must be named somewhere other than its own
declaration. `dead-check` fails otherwise, and the fix is to delete it — git
remembers, and a reader cannot tell a dead function from a live one.

The other way too: every name **called** must be something — a function
declared in `www/`, a variable or parameter bound there, a `window.x =` from
`index.html`, or one of the browser's, which are listed in `dead-check` by
name. A call to a function nobody wrote shipped once, in a branch the walks
never took.

This is `act-check`'s "no entry no screen names", one step further out. An
orphaned function is not in the action table, so `act-check` cannot see it;
26 of them were sitting in `www/` when this check was written. Deleting one
often turns up another on the next run — its only caller was the one deleted.

**Written and never read is not the same statement**, and the gap between them
held three deleted chapters' worth of residue. An assignment is a mention, so a
var written in six places and read in none passed "named somewhere other than
its own declaration" without trouble. **A write-only global is usually not dead
code; it is a wire with one end unattached, and the missing end is the half
somebody would have noticed.** `wdMode` was the worked example: the sheet's
letters/sounds rail was taken out in `ae4576d` — "four screens say less" — and
what was left behind was the variable, its setter, and **six faces in
`tools/fixture.mjs` that set it**, so six screens were being walked in a state
the app could no longer be in.

**And assigned but never declared**, which is the same sentence with no row to
put it in. `mkPos='n'` and `cands=[]` sat in `viewReset()` with no `var`
anywhere and nothing reading them — what was left of the make screen after the
screen went — and `tq`, `tkPos` and `tcomp` were the talk chapter, which has no
file and no route. Assigning to an undeclared name makes a global silently, so
nothing throws, and with no declaration there was nothing for either check
above to be about. It catches a typo the same way: `wSrot='a'` would make a
second global and leave the sort where it was.

**And what money buys, which is the same sentence a third time.** `CAN` in
`core.js` names every capability a plan opens, and `can('kb')` is the
only way to ask. **This line does not list them**: every version of it that did
went stale, in both directions — a name that was not a capability, and
capabilities left off while checks and a rung of the plans page ran on them.
Read `CAN`. `npm run dead` prints the number it actually counted on every run
("what money buys: N capabilities in CAN"), which is the thing to read.
`has()` names a *plan* and is `core.js`'s alone. `dead-check` refuses a
capability nothing asks for (a price with nothing behind it), a `can('x')` in
no plan (false on every plan — a locked door nobody can open, and nothing says
so), a `can()` given anything but a literal, and a `has()` anywhere else.

It replaced twenty-three `has('plus')` calls across nine files. They all
looked identical and were asking nine different questions: four meant "may
this dictionary pass a hundred words", five meant "may a letter be added,
renamed or deleted", two meant "may a keyboard be built", and the rest were
six more questions again. Which one each site meant lived in a comment or in
nothing, so opening file import on the free plan, or moving the keyboard to
another tier, meant reading twenty-three branches and remembering one at a time
what each had ever been about. The paid tier ships as a diff on top of the
free one, so that reading was going to happen.

Putting the twenty-three side by side found a bug on the first day: two of them
were the same ceiling asked two ways, so one plan was shown "3 left" forever and
never spent one. Nothing threw and nothing was refused, which is why it sat
there. Two files apart nobody saw it; one table apart it was the first thing
anybody noticed.

### 6. A language somebody already has still opens

Storage is per language. **The record is the `slice` rows on the server**;
`lingua.<id>.<slice>` is the copy that runs with no signal, and `netLangSync()`
puts the two together at launch. `SLICES` in `core.js` is the list of them —
**count them off that and not off a line here**, which has said eleven and has
said twelve. `lingua.langs` says which languages are here and whose;
`lingua.set` is the person's settings and belongs to no language.
`langKey('words')` is the only thing that knows how a language is filed.

`SLICES` in `core.js` is that list, and being *in* it is what makes a slice
**backed up**: `bkPack()` walks it, so a slice outside it is in no backup.
Two were outside it. The **keyboard** is the language's — built in
the app, filed under `langKey('kb')` beside the words — and was in no backup;
and **what the language is for** sat in `SET`, the person's settings, directly
under a comment saying it travels with the language. Neither could throw:
a backup was written, it restored, every check was green, and the keyboard
somebody built simply was not in the file. `backup-check` now names both
rather than counting slices — a count says eleven and goes on saying eleven
when the eleventh is the wrong one.

**Deleting an account counts the namespace rather than walking a list.**
`wipeAll` used to walk `SLICES`, and every key added after that line was
written stayed behind — the drafts, the posts, the person's name and face,
the index of languages, the flat keys from before there could be more than
one. One bug, seven times: **a list of keys, written by hand, that nobody
remembered to add to.** So `lsWipeAcct(uid)` counts `localStorage` instead —
no list, and a key added tomorrow is taken the day it is added. The prefix
includes the dot, because `lingua` and `linguaX` in the same storage are
somebody else's.

**And it takes THAT ACCOUNT's and no other's.** It walks the index for the
languages carrying that stamp and takes the copies parked under that uid.
The call that took the whole namespace whoever was holding the phone is
deleted: it is what emptied the owner's languages on 2026-09-03 when a second
account was deleted, and a function that can still be called is a function
somebody calls.

**One language is deleted by the middle of the three rows** — sign out,
delete this language, delete the account. `wipeLangsGo()` in `www/settings.js`
walks `SLICES` for one id through `langKeyOf()`, drops that language's backup
and its row on the server, and touches nothing else. 「この言語を削除で言語の
制作のものは全部なくなる」 OWNER 2026-09-03.

The globals do not change. `WORDS` is the open language's dictionary, because
the app shows one language at a time and a hundred-odd places say `WORDS`
meaning "the one in front of me".

Migration from the eight flat keys **copies**; it never removes what it read.
It runs once, on a phone, against the only copy of something somebody spent
months on. `migrate-check` seeds the old keys and asks what came through —
every other check opens an empty browser, which is the one kind of phone that
does not exist.

It asserts what a thing *is*, never how many there are. The app rebuilds
letters it cannot find from the drawn glyphs, so a dropped slice comes back as
plausible auto-generated letters with the right count and the wrong ids.

Two of its assertions are `keeps` and `lacks` rather than equality, because
the alphabet arriving is no longer the whole alphabet: `ltStart` fills a free
language out to its twenty-eight slots, so three letters arrive and thirty-one
are there a moment later. `keeps` says all of these, still in this order, in a
list that may be longer; `lacks` says none of these, which is the only thing
the empty list was ever saying. Equality would have forbidden the twenty-eight
in the name of checking the three.

### 7. A list somebody already has comes in whole

`www/import.js` has a line across it. Above it is the reader: what shape a paste or a file
is in, and what each column means. It is DOM-free and globals-free on purpose, so
`tools/import-check.mjs` can `eval` that half in Node and put eleven real samples through
it — a spreadsheet with any columns in any order, Excel pasted straight in, semicolon CSV,
backslash-coded SIL lexicons, JSON, plain lines, a bare list of meanings. Below the line is
the app.

Adding a shape means adding a sample. A reader that guesses wrong loses somebody's word
list silently, and no screen would ever look wrong.

### 8. The making side and the reading side are separate

The app is two things. On one side somebody makes a language: one dictionary, one
alphabet, one writing system, all open at once and all global. On the other is a timeline,
where a post was written by somebody else, in a language this phone has never seen.

**Every global on the making side is a lie on the reading side** — and a lie that tells the
truth for as long as you are the only person there. That is what makes it dangerous: it
tests green, screenshots right and demos perfectly, and the day the second person arrives
every post in the timeline is signed with your name, wears your font and carries your
letter. Five were live at once: the face, the name, the handle, the font, and the language
name on a card.

So `www/post.js` has a line across it, and below that line **a post renders from the post**.
What a reader needs is put ON the post when it is written, above the line, where the making
side still exists — the name, the handle, the language's name, and the SHAPE of a letter
rather than a reference to one, because the reader does not have that alphabet.

The line itself is one of those shapes now. It used to be text wearing MY font, and only
on my own post, which was correct and was also the app quietly deciding that somebody
else's letters were not worth looking at — and looking at them is most of the reason a
timeline exists. So a post carries its **ink**: the line already cut into letters, with
each letter's strokes on it. The cut has to travel too, because the reader has no alphabet
to cut with — `ka` is one letter on the writer's phone and two on everybody else's.
Anything the writer never drew is text and stays text, which is why a half-drawn alphabet
gives a half-drawn line. `postRow` takes one argument again.

A shape on a line still has to stand where the font would stand it, and that took a
second try. Each letter was a canvas of a square cell, which is right for a tile and
for a key and is a **different rule** from the one the font obeys: there the gap
between two letters is `cell - inkA/2 - inkB/2`, so no two pairs are alike and a
narrow letter floats in the middle of nothing. 「文字間おかしくね」 `inkAdv()` is the
one place — the font's own `reach()` asked of one letter at a time, ink plus one step
with half a step at each end, so the gap is one step whichever two meet. `inkLine()`
gives each canvas that advance as its own width and lets CSS hang it off the height;
`inkCanvases` is still the square one, for the things that are squares. Rendered both
ways at 20px, six letters of four widths come to 61px either way.

`tools/sides-check.mjs` holds the line: nothing below it may name `WORDS`, `LETTERS`,
`STG`, `SET`, `langName`, `findWord`, `myFontOn`, `ltById`, `ME`, `meName` or their
siblings. It also refuses a **two-argument function passed bare to `map`** — `postRow` grew
a second argument and `list.map(postRow)` handed each row its index, so post 0 was right
and every post after it wore my font anyway.

What it cannot catch is the composer, which is above the line and has to be: it renders one
thing belonging to somebody else — whom you are replying to. That said `meName()`, so every
reply announced you were replying to yourself.

### 9. Script load order in `index.html`

- `core.js` defines `defLang()` → precedes the ten language files
- `otf5.js` defines `LinguaFont` → precedes `glyph.js`
- `glyph.js` ends with `installScriptFont()` and `render()` → **goes last**

Also: every `.js` under `www/` must be referenced by `index.html`, and every file
`index.html` references must be **tracked by git** (not merely present on disk).
Adding a script file means adding its tag and `git add`-ing it in the same commit.

`assets-check` holds the same statement on the other side of the wall: every `.swift`
under `ios/App/` must be in `App.xcodeproj`'s Sources build phase, because Xcode
compiles what the project file lists and nothing else — a file on disk, tracked by
git, imported by name, and simply absent from that phase is invisible to the
compiler, and the error it produces names the missing *type*, not the missing file.
**And that a placeholder has somebody who fills it.** `__APPLE_TEAM_ID__` sits
in `project.pbxproj` on purpose — the deploy workflow substitutes it, so the
team id is never in the repo. `__GOOGLE_REVERSED_CLIENT_ID__` sat in
`Info.plist` looking exactly the same and nothing substituted it: Google's
client had not been made, and it was standing in for a value that did not
exist rather than one the workflow would supply. Nothing tells those two apart
by looking, and nothing throws — the app compiled, archived, exported,
uploaded, and Apple refused the delivery **by email** an hour later
(`ITMS-90158`, build 86). It is the only failure here that does not arrive as
a red tick. So every `__NAME__` under `ios/App/` must be a name the workflow
actually substitutes, and the list is read off the workflow rather than
restated — adding an injection there is the whole of adding one.

`Compose.swift` and `CandidateBar.swift` shipped that way once: written, committed,
pushed, left out of `project.pbxproj`, and the build failed on `cannot find 'Compose'
in scope` with nothing pointing at why. `index.html` had been held to this rule from
the beginning; the project file had nobody holding it. Only the Sources *phase*
counts — a file can have a `PBXBuildFile` line and still be in no target's phase,
which looks identical to being wired up to a plain grep of the file, and the first
version of this check made exactly that mistake.

### 10. The conversion table holds the claims made about it

`www/share.js` builds two things for a writing system where the unit you TYPE and
the unit you WRITE differ — a syllabary, an abugida, a logography: `ink`, every
shape the extension can draw, written out once, and `conv`, a table from a roman
spelling to the numbers in `ink`. The comments on `shareTable()`, `shareConv()` and
section 14 of `docs/keyboard-extension.md` made seven claims about that pair in
prose, with nothing behind any of them — a number in `map` always resolves inside
`ink`, `max` is the longest key `map` actually has, nothing sits in `ink` that `map`
does not point at, a key is already lower case, `ink` has no two entries the same
shape twice, the roman face exists exactly when `wsys()` needs one and wears
nothing but its own five kinds of key, and `conv.how` says what `wsys()` said. This
is CLAUDE.md's own rule turned on the app's newest chapter: "a comment saying 'this
is the one place' is worth nothing on its own... Either a check holds the claim, or
do not make it." Nothing held these seven, so `tools/conv-check.mjs` does: it boots
the real app, seeds the fixture `act-check` and `press` share, sets the paid plan,
and for every writing system `WSYS` lists — asked of the page, not written out in
the check, so a sixth kind is walked the day it is added — calls the real
`shareKbd()` and checks them against what came back. **It holds more than those
seven now and its own last line is the list** — the seven the prose made, the
eighth below, and a ninth that came out of splitting one of them: the roman layer
appears where the person CHOSE a writing system and never where `wsGuess()` merely
guessed one. Read that line rather than a number here.

It already found one. `shareTable()`'s own comment claimed a shape was reserved
only once a key could reach it; the code asked for the ink slot *first*, so a blank
letter and every digit left a drawing in the table that nothing pointed at — the
one thing the table exists to avoid. The comment had been claiming the opposite of
what the code did. `shareMapLts()`/`shareMapWords()` now ask every letter's key
before asking `t.of()` for its slot, and the comment says so.

**And an eighth, which is about the other end of the same file: what a key
PUTS IN.** A letter key carries a private use code point — U+E000 upward, one
per drawn letter — because that is the only thing on a phone that tells the
Lingua keyboard's `a` from the system QWERTY's. `.tfont` is set in
`LinguaType`, which carries nothing BUT that range, so a key that put the
letter's **name** in fell through to the ordinary font and came out roman: the
second face was built, installed, and never once used through the keyboard it
was built for. Both roads have to arrive at the same answer — `shareFace()` on
a keyboard somebody built, and `kbFix()`'s override on the free QWERTY — because
a rule that holds on one plan and not the other is the feature existing on one
plan. A letter with no shape is in no font and keeps its name, which is the
fallback working rather than a hole in it.

Nothing about a wrong assignment throws. The font renders, the key looks right,
and the document holds somebody else's letter — so it is asked **per letter**
and never as a count: the counts agreeing while the pairing is shifted is the
only way this breaks.

**And the assignment is read off what the font writer was actually handed.**
The first version of this check worked the mapping out again inside itself, and
it was green with the bug in: shifting `installTypeFont()` moved the keys and
the check's own copy together. **A check that recomputes the thing under test
is a copy of it, and a copy always agrees.** `LinguaFont.build` is wrapped
instead — the same reason `card-check` wraps `cardInk()` rather than asking
`cardSrc()`, and the same shape as the fault rule 12 was written after.

**And the order is worked out in ONE place.** `ltPuaOrder()` in `glyph.js`,
beside `ltPua()`, and four ask it: `puaRoman()` and `installTypeFont()` in
`glyph.js`, `postCutTyped()` in `post.js`, `shareFace()` in `share.js`. Its
name is in `sides-check`'s forbidden list beside `LETTERS` itself — it reads
the making side, and **a function that reads the making side is a way to reach
the making side; giving it a new name is not a way to stop being one.**

### 11. A language is never lost

`www/backup.js` (chapter 24) writes the open language out as one file, into
Documents, where iOS puts it in the device backup and the Files app can show
it. The server is the record, `localStorage` is the working copy that runs with
no signal, and **this file is the backup** — 「基本は全部サーバー管理 言語周りだけ
バックアップにfile使う」. Every slice goes up and comes back (`netLangSync()` in
`www/net.js`, from `www/boot.js`).

The file is what is left when the other two are not there: the app is deleted,
the phone is replaced, WKWebView's storage is reclaimed, a migration goes
wrong, or there is no signal and never was. 「データ消えるのだけはありえない」

It was measured before it was built — thirty-eight drawn letters are 12.1 KB,
a hundred words 13.2 KB, five thousand words 685 KB — so a free language is
25 KB and the whole thing is written on every change. There is no partial
state to reason about.

Two rules, and `backup-check` holds both:

**A write never destroys the last good file.** `keep()` rotates the previous
one to `.1` and that to `.2` before writing, so a write that produces rubbish
costs a generation instead of somebody's months.

**A restore never overwrites a slice that is there.** It fills in one that is
missing and stops — `langMigrate`'s argument, for the same reason. This is
the one that matters: the way a backup destroys somebody's work is by
*winning*, and a restore that overwrites is worse than no restore at all.

The check wipes every slice the way iOS reclaiming storage would, reads the
file back, and asks for the same words, the same letters and the language in
the index again; then it restores an *older* file over a live language and
demands that nothing moves. It also walks `SLICES`, so a slice added to
`core.js` and forgotten in `bkPack()` fails here rather than being quietly
left out of every backup until somebody needs it.

It cannot press the native side — `keep()` and `kept()` are Swift and there is
no Swift on a Linux runner — so what it holds is everything on this side of
that call. All three of its failures were made to happen before it was
believed.

### 12. A card of a post is a picture of that post

`www/post.js` has a line across it and rule 8 above holds it. The card is the
**other** place a post is drawn, and it had none of it: `cardPaint()` called
`cardUnits(src.line)`, which asks `findWord()` for the spelling, `ltById()`
for the letter and `wsStrokes()` for a shape the writing system composes.
Every one of those is the open language, so a card of somebody else's post was
that post re-spelled out of MY dictionary and drawn in MY letters. It tested
green, screenshotted right and demoed perfectly, because every post anybody
has made so far is their own.

`card.js` has the same line now, and `sides-check` walks both files in one
loop with one list, because it is one statement.

That is the cheap half and it is not enough: a function below the line can be
perfectly correct and simply never be the one that runs. So `card-check` drives
the real app — writes a post, freezes its ink, then **redraws every letter and
deletes the word the post was written with**, and asks what `cardPaint()`
actually put on the canvas. It watches the real one: `cardInk()` is wrapped and
`cardPaint()` is called for real, because the first version of this asked
`cardSrc()` and then chose between `cardInkUnits()` and `cardUnits()` itself —
a copy of the decision under test, which stayed green with the bug put back.

Redrawing the letters between writing and reading is the whole test. Freezing
ink and reading it back proves nothing on its own; the old code gives the right
picture too, for a post whose language has not moved.

With the bug put back it reports three things, and the second is the one to
read: *somebody else's post draws 0 shapes and carries 8.* Not the wrong
shapes — none, because not one word of a language this phone has never seen is
in this dictionary.

**Whether a post's ink can be drawn from is `postInkOK()` in `post.js`, and
that is the only place that decides it.** "Is there ink" is not the question
and was the one being asked, in two places, differently: a post carrying `{}`,
or `{g:[],s:[]}`, or an `s` pointing at an index `g` does not have, HAS ink
and cannot be drawn from it. Sixteen shapes ink can arrive in are walked, and
every one that is not drawable comes back as the post's **text** rather than
as a guess — repairing it would be inventing somebody else's alphabet.

**A post written before a post carried its ink is redrawn from the open
dictionary, and that is deliberate.** `migratePostInk()` cuts ink onto posts
one language at a time, as each is opened, because a post can only be cut with
the alphabet it was written in. Until it is cut, a post has no ink and falls to
`cardUnits()` — which for the person's own old posts is right, and for a post
from a language this phone does not have would be wrong. It cannot happen yet:
every post without ink predates the timeline holding anybody else's. The day
posts arrive from a server they must arrive with their ink already on them.

### 13. What a post carries is put on it when it is written

`post.js` has a line across it and rules 8 and 12 hold what happens BELOW it.
Nothing held the moment the line is crossed. `pwSend()` is where the making
side becomes past-tense data, and a post that leaves the composer missing
something looks perfectly correct for as long as the only person reading it is
the person who wrote it — which is every post so far.

`post-check` drives the real `pwSend()`. A photograph that is black everywhere,
a letter placed in the middle of it, and then the pixels of what came out are
counted: the letters somebody put on a picture are drawn INTO the file, because
a reader has no alphabet to compose them with. "The string is different" would
also be true of a bake that drew nothing, which is why it is a count and not a
comparison. It also holds that the positions do **not** travel (a coordinate
without the shape beside it is unusable to anybody else), that `dir` does, and
that the composer is empty behind it — otherwise the next post starts with the
last one's letters on it.

All four were made to fail before any of them was believed.

### 14. What happens after the second press

`press-check` rebuilds the screen before every press, which is what lets it
press all seven thousand of them without one leaving the app somewhere the
next one cannot run. It is also why it can never press two buttons in a row,
and a whole class of bug lives exactly there: open a word, edit it, save.

Both halves of that were broken and both were green. Renaming a word from its
own page saved it correctly under the new name and put you down on "That is no
longer here", because `NAV` still held `form:word:<old>`. Deleting one did the
same, one screen further back. Neither threw, neither blanked a screen, and
every check passed.

`tools/word-check.mjs` drives the real app over sequences rather than presses:
it opens a word, opens its editor, changes the spelling, saves, and asks what
screen you are standing on. `navRename()` and `navDrop()` in `shell.js` are
what it holds -- the trail is told when a word is renamed and when one is
deleted, because the trail names words and words move.

Both of its failures were watched happening before either fix was believed.

### 15. A filled area survives being put away

Every other shape in this app is a nib swept along a line. A filled stroke is
the one that is not: `glyphContours` cuts the inside of what was drawn round
into triangles and adds them to the sweep.
「塗りボタンオン。緑色の線が出現。三点以上の囲われた部分が塗られる」

Nothing about that can throw, which is the problem. A fill that is silently
dropped gives a letter that is merely **thinner** — on a canvas that renders,
in a font that installs, with every other check green. There is no error state
to catch; there is only a different shape.

So `tools/fill-check.mjs` counts it in pixels, through the real drawing code,
and asks for it again after the letter has been saved and read back. A fill
that survives drawing and not storage is the same bug arriving later.

### 16. ROUND is done to a stroke that exists, and never invents one

「線は先に引いてその後にそれをラウンドにするかどうか選べる仕様にしない？」 It
used to be armed before drawing — press the button, then draw, and what came
out was bent. A new stroke starts straight now and the button acts on the last
one.

Two things it may never do, and neither throws:

- **A straight stroke stays straight.** 「縦線はラウンド押してもラウンドになる
  わけがない」 The ring guess keeps three points of a stroke and closes them,
  and closing an arc is a full circle — so a line drawn straight down came
  back a ring. 「縦線引いただけで円になるんだって」
- **Pressing twice gives back exactly what was drawn.** The old button only
  turned its mode off and left the stroke bent.

`tools/round-check.mjs` holds both. Like rule 15, what makes them dangerous is
that the letter still renders and the font still installs — it is simply not
the letter somebody drew.

### 17. A face is named in one place

Every colour in this app has lived in the two theme blocks at the top of
`www/index.html` for as long as there have been two themes, and the comment
over them says so: *"Every colour lives in these two blocks and nowhere else;
the views only ever touch the variables."* Type was never held to the same
sentence, and the count is the argument — `'Cinzel',Georgia,serif` was written
out **37** times in that stylesheet, `'Cormorant Garamond',Georgia,serif` **33**
times, and both again in `card.js`, because a canvas cannot inherit a font.
Seventy-nine places restating five facts.

That is not tidiness. The faces here have been rebuilt more than once, and the
way a rebuild goes wrong is that 78 of the 79 get found: every screen somebody
thinks to open is right, and the one that was missed is the card — the only
thing in this app meant to be seen by people who do not have it. Three of the
four faults this rule was written after were that shape exactly:

- `onboard.js` measured whether a script's characters exist against
  `'24px -apple-system, system-ui, sans-serif'` — a **shorter** list than the
  body actually uses, with no `'Noto Sans JP'` on it. A script was measured in
  one font and shown in another.
- `card.js` held its own copies of both display faces, so changing one in the
  stylesheet would have moved every screen except the picture that leaves the
  phone.
- `otf5.js` — a standalone font writer that knows nothing about this app —
  defaulted its family to `'LinguaScript'`, making it a fourth place naming
  this app's face.

So the faces are variables on `:root`, and `tools/face-check.mjs` holds four
things:

1. **Only `:root` may name a family.** Every other `font-family` in the
   stylesheet resolves to `var(--face-*)`, `inherit`, or a generic keyword.
2. **Both directions on the variables**, as `act-map`'s names are held: no
   `var(--face-x)` that `:root` does not declare, and no face declared that no
   rule wears. A face nothing wears is one that was replaced and left behind.
3. **No family is named in `www/*.js` at all** — except the ones JavaScript
   BUILDS, because a font built on the phone has to be named by whatever built
   it. There are two and `face-check` prints them: `LinguaScript`, the font the
   person drew (`SFONT_FAMILY` in `glyph.js`, which must be exactly the family
   in `--face-script`), and `LinguaType`, the private-use face rule 10 is
   about, which must be the family in `--face-type`. When a built family and its
   variable disagree nothing throws: the font builds, the `@font-face`
   installs, and every `.sfont` element quietly falls back to roman.
4. **A canvas font asks the page.** A canvas has no inheritance, so a literal
   there is the one kind of face the stylesheet cannot reach. `cssVar(n, fb)`
   takes a fallback for exactly this — a face degrades to `serif` where a
   colour degrades to `#888`.

`.sfont` is the other half of this: it says `!important` because a great many
container rules in the same file set `font-family:inherit` on the input inside
them, and every one of those is *two* selectors where `.sfont` is one. Beating
them one at a time is a great many places that have to be found and kept found.
They all say `var(--face-ui)` now and there is one place to change.

### 18. NO ROUNDED BOX, and it does not grow back

「角丸やめろ」「文字書いて四角で囲ったみたいなボタン全部やめてくれ。ダサすぎる」

The rule is at the head of this file, the class comment on `.btn.ghost` has
carried it since the day it was written, and it was still broken three times in
one afternoon after being pointed out twice — a gold pill on the frozen screen,
a bordered strip across Home, a gold pill on the password screen. **Prose does
not hold a rule.** This file says so about everything else: *either a check
holds the claim, or do not make it.* Nothing held this one, and it is the rule
that has been broken most.

It is **not** "no corner in this stylesheet". `tools/box-baseline.txt` is every
corner and border that was already there, and `box-check` prints the count on
every run; `.btn` is on about thirty older screens. Deleting all of it
is a redesign, not a check. The rule as written is about what is **added**.

So `tools/box-baseline.txt` is what the stylesheet looked like the day the rule
was written, listed by selector, and `box-check` fails on a pair that is not on
it. Same shape as `buttons pressed: 8683` — a number nobody may move by
accident. **Taking a line OUT is progress and needs nobody**; putting one in is
a diff on that file, in a commit of its own, and it is the owner's. It fails the
other way too: a baseline line matching nothing any more must be deleted, or the
list rots into permission for a corner somebody removed years ago.

**One side is a LINE, and a line is what was asked for.** `border-bottom` and
its three siblings are not counted, deliberately: `index.html` carries the
sentence over its field rules — 「かくまるみたいなのでくくるのやめて欲しい。
基本下線だけ」. A single side is the shape the owner asked **for**, and a check
that failed the alternative it exists to push people towards would be read as
"the rule is unworkable" and then ignored. What makes a box is four sides
(`border`) or a corner (`border-radius`). Those two.

**And JavaScript may not do it at all** — zero, not a baseline. A style set from
`www/*.js` is in no stylesheet, so nothing above could ever see it; zero is the
only number that closes that hole.

**The plans page's two term buttons are a box, and they are the only thing that
is.** 「11は、角丸でいいから囲わないとボタンを押してるかわからん」OWNER
2026-08-26. The month and the year are the only thing on that page anybody
presses, and with nothing round them they read as two prices printed side by
side — somebody pressing one cannot tell they pressed. That is the reason and
the whole of it: it is not permission for a corner anywhere else, and the
baseline is what holds it to the one pair (`.btn.plterm | border` and
`.btn.plterm | border-radius`, and nothing else). `.ghost` is off those two
buttons for the same reason — it is the class that means "not a box".

**What it does not hold, said out loud so silence is not read as approval:**
"a filled panel" is the third thing the rule names. A background colour is not a
panel — the bar, the sheet and the body all have one and always did — and no
mechanical reading tells a panel from a surface. Inventing a rule the owner did
not write is worse than holding two of the three.

Five failures were watched before any of it was believed, and the fourth found a
defect in the check itself: it reported `shell.js:8`, which is not where the
corner was, because `decomment` collapsed each comment to one space and slid
every line after it. **A check that names the wrong line is worse than one that
names none — it is believed.** The newlines are kept now.

### 19. What is selected, what acts on it, and the step back

The keyboard editor is a sheet, and a sheet is worked from its edges: the row's
number selects the row, the column's letter selects the column, and the buttons
over the sheet act on what is selected. 「行とか列選択したらそこが光ってそこを
作業してるってわかるようになってる削除は削除ボタン寄せは寄せボタンでしょ」

The head used to DELETE on the press — 「1触ったら1が全部消える」 — and that was
replaced by the owner as too dangerous: 「今即削除なの危なすぎだろ」. Both are in
docs/CHANGELOG.md; the second is the one in force.

The bin does not ask first. What stands behind it is the step back rather than a
dialog — a confirmation on every row would make building a keyboard a
conversation — so the delete and the undo are one statement and have to be held
as one. **A delete with a broken undo behind it is worse than a delete that
asks**, because the app has told somebody it is safe to try things.

**A column takes only the keys it is entirely made of.** 「半キーにしよう。その
代わり縦列の選択の時では選ばれない。例えばaが半きーのばあい。aを選択したら他の
124列目だけ選ばれて」 OWNER 2026-08-26. The test used to be whether a key
overlapped the column at all, and the free QWERTY's third row is inset by half
a key at each end — so every key on it straddles two columns and lit for both:
pressing any letter across the top lit TWO of the nine, on the keyboard both
plans type on. Both halves of the decision are kept and they pull the same way:
the inset stays, because that is what a QWERTY looks like, and on that row a
column is therefore made of nothing and lights nothing. **A row with the band
down it and no key lit is the right answer** — it is the row saying it does not
line up with the columns, which is what somebody needs to know before cutting
one. `kbColHas()` is the one place. What the BIN then takes is a different
question and is not this one: `kbDelCol()` asks how much of a key is inside the
column, and narrows it by that much, so the inset row still gives up its half.

**Left and right ignore the half key; only CENTRE rounds to a whole one.**
「キーボードも左右寄せにするなら、ハンキーとか関係なく寄せて。」 OWNER
2026-08-27. Right used to send the odd half to the other end so the row's first
key landed on a whole column — which is what centring is FOR, and is not what
an end is for. Pushing a row right means putting it against the right, and half
a key left over stays left over. It agrees with the sentence above: a row that
ends up half a key out lines up with no column and lights for none.

**A CENTRED row splits what is left over between its two ends, and half a frame
at each end is the right answer.** 「中心に寄せたら半キーが二つできるけど寄せたら
1つになるの」 OWNER 2026-08-28. A column is half a key, so half of what is left
over is very often an odd number of columns — three keys on a sheet of ten leave
fourteen, and seven of those is three keys and a half. Centred, that is three
frames and a half at each end. Pushed to one end — left or right — it is one run
of seven, ending in a half. **Either way every one of those frames is a key you
can press**: the sheet is a grid of frames, an empty frame is a dotted key, and
**pressing one SELECTS it**, the way pressing anything else on this sheet does.
A key goes into it from the buttons over the sheet, the width of the frame it
was. There is no such state as a blank.
「エクセルと同じだって」「キーガーないところがあるのがおかしい」
**「全部のます触ったら選択で」OWNER 2026-08-28** — and that last one settles a
thing the sheet had two answers to: an empty frame put a key in on the press
while a frame left by an alignment selected itself, and the two are drawn
identically. One habit, no exceptions: **press to select, and the buttons over
the sheet act on what is selected.**

Rounding the odd half away is gone. It existed because a row off by half a key
lines up with no column, so pressing a column's letter lights nothing on it —
and that is now simply what such a row does. `CLAUDE.md` says so two paragraphs
up and it was already the answer for the QWERTY's inset third row: **a row with
the band down it and no key lit is the row saying it does not line up with the
columns**, which is what somebody needs to know before cutting one. The drawing
of a short row and the button that aligns one ask the same function.

Where a row is short from — left, centre, right — is written in **gap keys**,
which this keyboard has had since it had a QWERTY. Nothing new is stored, and
that is not tidiness: a row is an ARRAY, so `JSON.stringify` drops any property
put on it that is not an index, and an `al` would vanish into localStorage and
out of the undo stack in silence. Gaps also already travel to the phone — the
extension divides a row by the keys' `w` and a gap is a key — so a row aligned
here is aligned there, which a drawing alone would not have been.

Nothing here can throw. A column taken out of the wrong rows, a key of three
removed where it should have been narrowed to two, an undo that puts back the
state *after* the change rather than the one before — every one of those is a
keyboard that still renders, still installs, and is not the one somebody built.

`tools/kb-check.mjs` holds these — count the `say(`
lines there rather than writing a number here: the row
that goes is the one pressed
and every other row is untouched and in order; a column comes out of every row,
one key's worth from each; **a key wider than the column is NARROWED and not
removed** (a cell spanning b–d, with c taken out, spans b–c); the half key that
insets the QWERTY's third row survives all of it; the step back is exact and
three of them walk back through three deletes in order; the step forward undoes
the step back; nothing outside the layout moves — not a letter, not a word, not
another keyboard, not another face; and the two buttons are down when there is
nowhere to go.

**A key can also be joined to the one UNDER it**, and the shape that is stored
is the whole of why it is safe. **Joining is a BUTTON**, beside the one that
opens a key and the ones that align a row — 「なんで？ 結合ボタン作れよ。編集も
含め全部ボタンで作業だから」 OWNER 2026-08-27. Tapping a key SELECTS it and
does nothing else, which is the sentence at the head of this rule with no
exception left in it: the sheet is worked from its edges and **the buttons over
it act on what is selected**. Tapping the key beside a selected one used to
join the two, and that is what left nowhere for a second key to be selected
「あと複数キー選べないから」. One button reaches both directions — the key
beside, or, where there is none, the key under. The key that covers carries
`h`, and a GAP carrying `up` stands in the
same columns of the row below — which is what keeps that row the width it was, so
nothing beside it slides under the merge and every total still adds up. It is a
gap rather than a kind of its own because `KeyBoardView.swift` switches on `k`
and falls to `default:` for anything it has never heard of, which draws an
ordinary grey key and inserts nothing when pressed; a gap is drawn clear and does
nothing. **A board carrying a merge, opened by a build from before merges
existed, is that keyboard with a hole where the lower half is — the merge is
missing and nothing else is.** A keyboard belongs to a language and a language
moves between phones, so that is the case that decides the shape.

Two keys are joined only when they line up — same column, same width — and a
ragged pair is REFUSED rather than repaired. `kbVFix()` is the one place that
answers for a merge whose halves have been separated by a row going, a column
being cut or a key going in beside one; it runs from `saveKb()` and BEFORE
`kbNoted()` inside it, so the step back holds the repaired layout rather than a
state the app never showed.

**And the three alignments are DOWN on a row with half a merge in it.** Where a
merged pair goes when its row is pushed left or right is the owner's and has not
been asked; moving one half and not the other is not an answer to it. That is
`docs/FEATURE_RULES.md` § Deciding, on the newest thing on this screen.

It holds the two ceilings with them, because they are the same screen and the
same kind of mistake. **Ten across is the phone's number** — the narrowest
iPhone is 320, so ten keys are 32 each and eleven would be 29 — and every
pattern the app builds already comes to ten or fewer. **How many DOWN is the
phone's number too, and it is not a number written in the app.** 「キーボードの
高さ制限を決めたやん。キーの高さじゃなくてキーボードそのもの。だから行の列は
そのキーボードの制限の範囲内で追加できるって話だけど？」 The extension caps the
whole keyboard at **half the screen** — 「0.5が限界」 OWNER 2026-08-27 — and
SQUEEZES the rows past it, so a ninth row was never a ninth row — it was every row getting shorter. **And a row
is a KEY tall**: 「キーのサイズはiPhoneのサイズによって変わるんじゃないの？八行
入っても小さかったら打ちにくいだけだぞ？」 The extension's row was a flat 54pt,
so a key was the same height on every phone and the only thing a bigger phone
bought was more rows — backwards from what a bigger phone is for. Width always
scaled, because ten keys divide whatever the phone is across; the height
follows it now, at **0.1385 of the phone's short side**, which is that same 54
at the 390 it was measured on. A key keeps its shape: **44pt on the narrowest
iPhone, 61 on a Pro Max**. The rows that fit are then divided out of the cap
rather than chosen, and **divided out of the SMALLEST phone the app runs on —
320 × 568** — which is what the width rule has always done: not the phone in
your hand, and not the roomiest one, the narrowest. **Five**, which is the free
QWERTY's own row count and what a real phone keyboard is. The division gives
5.235 and floors, so what a sixth row would need is a cap this rule does not
have — and tightening the cap to half took that SLACK away rather than a row,
which is why no keyboard anybody had built stopped fitting when it tightened.
Referenced to a big
phone instead it came to **63.8% of an iPhone SE 1** — the cap broken on the
two phones with the least room, which is the opposite of what a ceiling is for.
「キーボードの高さは画面の半分までってルールあるのになんで七も足したら7割埋まる
けど」 It was `KB_ROWS = 8` before that — a number this file used to justify
with "nothing on the phone sets a height", which was untrue when it was
written, and which no phone ever had room for. **And the sheet in the app is a
row of `--kbw × KB_ROWW`, not a flat 44px**: the editor is the preview, and a
flat number drew it 388px tall on every phone — 40.6% of a Pro Max and 68.3%
of an SE. A keyboard belongs to a language and a language moves between
phones, which is why the ceiling is one number rather than each phone's own. `kbRowsMax()` is the one place, and **`kb-check` reads the three
numbers OUT of `KeyboardViewController.swift`**, because two copies of a number
in two languages is the thing that drifts. Both ceilings hold on ADDING only:
**a layout already over the ceiling is left exactly as it is**, because cutting
it down would be the app deleting somebody's keys. The check puts an
over-the-ceiling layout in and demands that nothing moves.

**A MERGED PAIR is carried as one thing.** 「長押しの時は動くよ？ iPhoneの
ホーム画面と同じ ウェジットも2*2とかあるけどその分みんな動くでしょ？それと
同じ」 OWNER 2026-08-27. A key merged with the one under it is two cells — the
tall key and the gap holding its room — and the carry moved only the half under
the finger. `kbVFix()` then did what it is for and took the merge apart:
nothing threw, the board drew, and the pair somebody made was gone. **That is
not `kbVFix()`'s to fix** — it is the one place that says what a valid pair is,
and an exception there would be a hole opened from a side that does not know
the rule. The carry takes both halves, so by the time `kbVFix()` looks there is
nothing to undo. Either half may be grabbed; the **top** one is the pair, the
way `kbVJoin()` keeps the upper key. It needs the row under the one it lands
in, so nothing lands in the last row, and **both** rows are asked for room —
the same gate as above, asked twice, not a second rule. A drop the sheet cannot
hold leaves the pair exactly where it was: "no row is over ten" is also true of
a carry that ate a half, which is why those are separate claims.

**And CARRYING a key is adding one**, so the ten holds there too.
「満杯だと追加できないから」 OWNER 2026-08-27. A key can be held and dragged
into another row, and that road asked nothing about width — a board of ten-key
rows became one of eleven, which is the 29pt this rule exists to forbid.
`kbCellAdd()`, the same act done by pressing an empty cell rather than by
carrying, had asked `kbRoomIn()` from the beginning: the gate was already
there and one road went round it. Both ask `kbRoomFor()` now. **Only across
rows** — inside one row the width does not change, and asking there counts the
key twice and freezes the ordering of every full row. What a refused carry
must do is leave the key where it was: "no row is over ten" is also true of a
carry that ate the key, and those are two claims in `kb-check` because putting
the bug in showed the first one staying green while the key vanished.

And that a short row sits in the MIDDLE of the sheet rather than at its left
edge — 「揃えて欲しい」, five keys over three. Counting columns in halves is
what makes that always divide.

And that a page arrives with the way THERE and the way BACK already on it.
A face used to arrive as one empty key: the keys that reach a face have always
had to be placed by hand, so the ordinary way to use this was to add a face,
put letters on it, and find there was no way to it and no way off it —
`docs/keyboard.md` described the trap in four steps, which is a manual page
standing in for the thing working. `kbDefault()` has done it correctly for its
own digits face from the beginning. Nothing is overwritten: the key goes IN at
the front of the last row, or into a row of its own, and a face with room for
neither is not offered a + at all.

Twenty-five bugs were put back and watched going red before any of it was
believed. One of the last is worth keeping because it is about the CHECK: a
head TOGGLES, so a claim that asks for a row already selected puts it down,
and the kbAlign() after it silently does nothing while the claim reads the
state from before. It cost two false greens. What is wanted there is "row n is
selected", so the check says that instead of pressing.
The two the check found on its first run were real and are worth keeping: the
history was recorded only from the editor's **render**, so a change made by any
other road had nothing behind it — it is recorded from `saveKb()` as well now,
which is what every change to a keyboard ends in; and a board is identified by
**where it is in the list**, so deleting board 1 and making another gave the new
one the old one's history, and the step back would have put a deleted
keyboard's layout onto a keyboard that never had it. Making one and deleting
one both forget.

### 20. The language's page arrives closed, and each of its two switches has one place

Two decisions of 2026-08-26, and neither can throw.

**「この言語については初手は全部閉じて」** It arrived open, and the argument for
open was that nothing somebody has never touched should be folded away from
them — true of one section and wrong of five, because five open sections is a
page you scroll past to find out what is on it. What the marker is FOR is
choosing, and a page that has already chosen for you gives it nothing to do.

`ABOPEN` in `home.js` therefore records what is OPEN, so the empty map IS the
arriving state. The way this comes back is somebody flipping the sense to
"what is shut" — which reads identically, renders perfectly, and is the
opposite page.

**「ここの言語ページを公開すると単語と文字 dl できるようにするはいらない。wiki で
できるから。」** The settings room and the article's writing face both offered
公開, writing the same `world().hide`; the room also offered a whole-page DL
where the article asks it of each section. The room's two rows went and the
article's stayed. A switch in two places writes the same field from both, so
nothing throws and every screenshot is right — it is found by somebody turning
it off in one place and finding it on in the other.

**And nothing came out of anybody's file.** `world().dl` is still stored and
still read: it is what a section nobody has answered for falls back to. The
row that WROTE it went; orphaning the value would turn somebody's answer off
without asking, which is `docs/DATA_SAFETY.md`. So `world-check` asks the
fallback both ways and asks that a section with its own answer still beats it.

Its first version stayed green with the second bug put back, because it called
`vSet('lang')` — and `vSet()` takes no argument, it reads `here().a`. It was
asking about whatever screen the check happened to be standing on. **A screen
is a route AND its argument**, which this file says twice already, and the
check now stands on the route.

### 21. One route is drawn by one function

**§ One place, not fifteen finally has something holding it.** That section
ends with the sentence this rule is: *"A comment saying 'this is the one place'
is worth nothing on its own... Either a check holds the claim, or do not make
it."* Nothing held it, and on 2026-09-01 it was broken with every one of the
twenty-nine checks green.

`wldPage()` in `www/home.js` is the language's page — ABOUT THIS LANGUAGE, with
Overview / Phonology / Letters / Lexicon / Grammar / Keyboard down it — and its
own comment is the rule written out: *"There is no separate editor screen any
more. There were two screens with two layouts for one thing... One function
draws both now, so a section cannot appear in one and not the other."* Then
somebody else's published language needed drawing, and what was written was
`wldSeenHTML()`: a **second page on the same route**, under a different name,
showing a different set of sections, reached by giving `about` an argument.

Nothing throws. It is not a copy of `wldPage` — **a three-line sliding window
over every line of `www/` finds thirty-five repeated windows with it in and
thirty-five with it out, which is the measurement that says text similarity is
the wrong instrument.** The second page is not a copy, it is a rival. The owner
found it by standing a phone next to the article and reading the two.

`page-check` watches the real call. Every global function is wrapped, each
route's view is called for each of its faces, and the **drawer** is the
innermost wrapped function whose return value IS the string the view returned —
`(inline)` where the view built the page itself. A route with two drawers is
two pages. Nothing here reads `vAbout`'s source or restates its branch: a check
that recomputes the thing under test is a copy of it, and a copy always agrees.

**The faces are asked of the page, and that is the half that matters.** The
reason twenty-nine checks were green is not that they were weak — it is that
**no walk had ever handed `about` an argument.** `argsOf` in `i18n-check` and
`walkArg` in `act-check` are lists somebody has to remember to add a route to,
and this is the one bug in `docs/DATA_SAFETY.md`'s family: *a list of keys,
written by hand, that nobody remembered to add to.* So `page-check` harvests
every `data-do="go"` carrying a two-element argument out of what it has already
rendered — the doors the app itself offers — and then gives every route two
arguments nothing knows as well, **because a second page reached only from a
door that has not been built yet is still a second page.** `wldSeenHTML`
shipped before the row on a profile became pressable; a check that waited for
the door would have waited a commit. It was the probe that caught it, both at
`3230182` and at the branch tip.

`viewGone()` is left out by name: *"the thing you came back for is gone"* is a
route **declining to draw**, not a face of it, and every route taking an id
answers with it for an id that is not there. The name is held — if `viewGone`
stops drawing anything anywhere, this fails, because an exemption matching
nothing is what `box-check` says a stale baseline line becomes: permission.

**What it does not hold, said out loud so silence is not read as approval.** A
second page written INLINE, inside the view function, reports `(inline)` on
both faces and passes; what is held is a second page **with a name**, which is
the shape this was written after. Two routes sharing one drawer is not asked
about and is not a fault — `wldPage` draws `about` and `world` on purpose, the
reading face and the writing one. And byte equality between a route's faces was
measured and rejected: six of thirty-seven routes use their argument to filter
or to name somebody, so an unknown argument legitimately changes `profile`,
`letters`, `kb`, `words`, `gram` and `notes`, and a baseline of six there would
rot into permission.

Three reds were watched before any of it was believed: the second page at
`3230182`, the same at the branch tip with the fixture's own doors seeded, and
the exemption's rot claim with `viewGone` renamed out from under it.

### 22. Nothing is kept on this phone alone, and nothing on it is nobody's

> **⚠ この章は差し替えが決まっています。まだコードは変わっていません。**
> 「オンライン前提に切り替える。保存を押した瞬間にサーバーへ行く」
> OWNER 2026-09-04（`docs/FEATURE_RULES.md` の決定ログ）。
> **サーバーが唯一の本物になり、iPhone には言語を一つも置きません**
> ── 残るのは `lingua.sess`（この iPhone は誰か）だけ。オフラインは
> 無くなり、電波が無いときアプリは何も出しません。**新しいものを、下に
> 書いてある古い形の上に作らないでください。**設計は `claude/one` が
> 書いています。それが通るまで、この章は「何が今そうなっているか」の
> 記録として読んでください。



**The app is online, and that is a decision about data rather than about
screens** ── 「オンラインにしないとデータの改竄し放題だから」. The server is
where things live; `localStorage` is the copy that runs with no signal.

**And every key of that copy belongs to an ACCOUNT.**
「端末ごとにやることなんてねえよ」 OWNER 2026-09-03. This section used to end
with a list of three things that were 「the phone's own」 -- a backup file, an
exported sheet, and the settings -- and that list is gone, along with the
category. A thing that answers 「the phone's」 is a thing that survives one
account and is handed to the next one, and on 2026-09-03 that is exactly what
happened: deleting one account emptied the whole namespace and took another
account's language with it.

`lingua.sess` is the only key that is not somebody's belongings, and it is not
an exception: it is **which account this phone is**.

**That was writing only, and writing does not stop anything.** The timeline
was local for a week with every check green, and the languages were local for
as long again after that; both were found by a person holding a phone.
「書いていて止めないの本当に何？」 OWNER 2026-09-01.

`store-check` names every key the app writes into `localStorage` — by FILE and
by the expression, because `k` is a loop variable in two files about two
different things — and each one is either **on a road to the server**, with the
function in `www/net.js` that takes it there (and that function has to exist),
or **the phone's own with a sentence saying why**.

**That second half is what has to shrink to nothing**, and every entry left in
it is a thing waiting to be handed to the wrong person. **`SET_ACCT` in
`core.js` is the list of the fields inside `lingua.set` that are a PERSON's** —
`plan` `planWas` `planPend` `saved` `savedUp` `notAt` — and `setFor(uid)` parks
them under `lingua.set.<uid>` on the way out and brings that account's own back
on the way in. What is left as the phone's is the theme and how this handset is
set up. `docs/BACKLOG.md` carries whatever is still there; read
`store-check`'s own last two lines for the count rather than a sentence here.

**A new key fails until somebody writes down which of the two it is.** That is
all it holds: whether the road is WALKED is `acct-check` and `again-check`, and
whether it comes back is theirs too. This one refuses a place to keep somebody's
work that nobody said how to get off the phone. It fails the other way as well —
a road named for a key nothing writes any more is a line that outlived what it
described, which is what `box-check` says a stale baseline becomes.

## What the free plan is

One sentence: **your own shapes for a-z and 0-9.** `ltStart` puts thirty-eight
letters there the moment a free language exists — a to z, `!`, `?`, and a digit
for every value the base has — and nothing on the free plan adds one, deletes
one or renames one. Drawing on them is the whole of it.

That is not a restriction bolted onto the app; it is what makes the rest of the
free plan possible. Because the letters are exactly a-z, `!` and `?`, and their
names cannot change, the keyboard can be a **QWERTY with the drawn letters
substituted in** — `kbFixed()`, built from `LETTERS` every time it is shown,
stored nowhere, with no editor and nothing to set.
「キーボードもqwerty配列がそのまま自作文字に置き換わるだけ。なんの設定もできない」
Rename one letter and the key it answers to is gone, which is why the name
field is not on the free letter page rather than merely being discouraged.

It carries two more things. A row of digits above the QWERTY, and they are the
person's own — `numbers.js` says a digit IS a letter, one carrying a value
instead of a reading, so `ltStart` gives a free language one for every value
its base has and they are slots to draw on exactly like a to z. They were the
plain roman ten, on the grounds that free adds no letters so there was nothing
of the person's to put there. That was a true sentence about a plan with
twenty-eight slots, and the answer was to give it ten more rather than to leave
the row borrowed. 「数字が設定できないわ。そこ文字から設定できるように頼む」 They are
found by value, because a digit has no name to match on: its value is the whole
of what it is, and it is also the order it counts in. `ltKinds()` therefore
shows the digits room on free — what free still cannot do is ADD one, which is
`can('letters')` and is asked at the foot of the room.

And `!` and `?` are at the ends of the space bar rather than the tail of the
third row, with the delete two keys wide, which evens the rows to ten, nine,
and seven letters. 「これスペースデカすぎやね。！スペース？みたいにできない？」
「デリートキーは横二つ分欲しいかも」 The digits sit above the letters rather than
behind a switch because free is one face and stays one face:
「2ページ目なしでqwertyの上に1〜0の数字と！？入れてこれで無料版1ページに抑えよう」
A second face on free would have held only this row and nothing else, which is
a page for the sake of having a second page. `KB_QWERTY` is `keyboard.js`'s, and
`shareRomLay()` in `share.js` builds the paid plan's roman-for-conversion face
from the same array, so the free plan's row and the syllabary/abugida/logo
conversion row are one layout agreeing with itself rather than two that could
drift apart.

Four places say it, and they say four different things:

| where | what it says |
|---|---|
| `ltStart` in `letters.js` | free languages get the twenty-eight slots topped up by name, and a digit per value of the base topped up by value |
| `kbOf` in `keyboard.js` | free reads `kbFixed()` and never `KB` |
| `wsys()` in `wsys.js` | free is an alphabet; there is nothing to guess |
| the screens | `vLtset` `vLetter` `vLetters` `vWsys` `vKb` each drop what free cannot use |

`ltStart` **tops up**: a language that already has letters keeps every one of
them and is given only the names it is missing, so it can run on any launch and
a paid language coming back down to free is filled in rather than rearranged.
It does not touch the inventory — `ltSetRoman` adds a sound to `SND` when
somebody names a letter by hand, because they said the word, and nobody said
anything here. A language given three sounds would otherwise come back holding
twenty-two after an update, which is the app saying what the language sounds
like.

Because the walks run on the free plan, every paid face needs a `halfDone`
entry in `tools/fixture.mjs` that flips `SET.plan` and puts it back — otherwise
`act-check` reports its buttons as an entry no screen names, which is true and
is not what you meant. The abugida bench needs `SET.wsys` too: it is reached
only from a door that only exists while the writing is an abugida.

## Two chapters that are closed

Neither is a gap waiting to be filled. Both were a second place for something
that already had one, and both are in git if the argument turns out to be
wrong.

**Sound.** There was a chapter for the language's inventory beside the chapter
for its letters, and a letter's sound was a fact reachable from either.
「文字に音もあるのに音ページもあるしごちゃごちゃ」 The sound belongs to the letter,
so the chart is a sheet opened from the letter it is about (`openSnd`), and
pressing a symbol puts it on that letter — which is the only way it ever
joined the language. `SND` is still the ninth slice under `langKey('snd')`,
because the spelling engine reads it; it is no longer a place you go.

**Make.** A screen that generated eight candidate words. Its only door was one
button on the dictionary, and the button was reported as not working
「まとめて押してんのに作成できないけど？」. Deleting the button would have left a
screen nothing could reach and every check still green, which is rule 5 one
step further out, so the screen went with it.

## One place, not fifteen

The three bugs found in one afternoon were the same bug: something was added
and the one place that governs it was not. `.sfont` is added by `myFontOn()`
in three files and was unconditional in a fourth. The IPA column got a patch
on top of a patch. `seed()` put back two of the fifteen things a screen
remembers.

So: **a rule lives in one place, and the places that follow it do not restate
it.**

A later audit found twelve more. Six by reading the seam between the two sides:
the root bar (`rootTop()` — the contents page and the timeline each hand-rolled
it and had already drifted in what goes in the corner), the gloss row
(`postGloss()` with `postGlossLine()`), what the meaning defaults to (`pwMn()`), what to call an
author (`postWho()`), "nothing here yet" (`snsNone()`), and "the thing you came
back for is gone" (`viewGone()`, five screens in four files).

Six more by running a three-line sliding window over every line of `www/`,
which is worth doing again and takes a minute to write: a letter's face
(`ltInk()`), strokes into ink (`inkStrokes()`), the spelling page
(`spPageHTML()`, since deleted — a reading is chosen off sounds now and no
letter appears on that page at all), the spelling row (`spRowHTML()`, deleted
with it), an example sentence (`exRowHTML()`), and where the thumb is
(`geXY()`).

**The worst two sat under comments claiming to be the one place.** `ltFace`
(since deleted — the alphabet is cells now, and `ltInk` is the face)
opened with "a letter's face, wherever one is shown" and there were five others.
`inkStrokes` says it is "the one place that turns strokes into a shape on a
canvas" and the glyph *editor* did not go through it — the letter under your
finger was drawn by different code from the letter on the key, the tile and the
card. A third, `vASpell`, carried the comment "Same page as the editor's, on the
other list" directly above a copy of that page.

A comment saying "this is the one place" is worth nothing on its own: whoever
reads it will fix that one and go home. Either a check holds the claim, or do
not make it.

The thirteenth was **what the font is made of**, and it is the one to read if
you only read one. `scriptGlyphDefs()` built its glyphs from three lists that
had each been added on a different day: the units the writing system needs
(`wsUnits`, which only ever answers in sounds), the marks (a letter reading
`?` is not a sound, so it could not be among them), and the names, which came
last and as a patch — `scriptNameCodes` walked `LETTERS` to find what the
letter behind each unit was called, and took only a name one character long.
Three lists is three answers to "what letters do I have". They did not agree:
a letter reading `?` got **two** glyphs both claiming `?`, and a letter with no
reading at all was in none of the three, so somebody drawing their own A B C D
with nothing to say about sound got a font with nothing in it.

A glyph belongs to a letter now, and the name and the reading are both just
code points on it — `ltCodes()`. What is left for the writing system to say is
the one thing that is genuinely not a letter: a syllable an abugida composes
out of a base and a vowel mark, which nobody drew as one shape.

Not everything that repeats is duplication. `cffNum` and `csNum` in `otf5.js`
encode the same integers to different byte forms because that is what CFF
specifies. Merging them would be inventing a rule, not finding one.

`viewReset()` in `www/shell.js` is where a screen forgets. Which words the
list is filtered to, what was typed, which face a sheet shows, what the make
screen has produced but not committed — none of it belongs to the language,
it is where you are standing in it. Adding a screen that remembers something
means adding it there, and `langOpen()` calls it because arriving in somebody
else's language with your filter still on hides most of a dictionary you have
never seen.

The language itself is the other way round and deliberately so: `WORDS`,
`LETTERS`, `SCRIPT`, `STG` are single globals meaning "the one in front of
me", named in three hundred-odd places between them, filed under `langKey()`.
One thing seen from many
places is not the same as one rule written out many times.

Holding the one place is not enough if it can lose. `.sfont` said, correctly and
in one selector, what a script-font element gets — and a dozen container rules
in `index.html` each set `font-family:inherit` on the input inside them (`.pwfield
input`, `.search input`, and so on), and every one of those is *two* selectors
where `.sfont` is one, so every one of them won on specificity. The post
composer's line could never show a drawn letter: the class was on the element,
the font was built, the glyph for `l` was in it — and `l` came out as `l`.
「これ押してもlになる。lingua内でも」 Beating a dozen container rules one at a
time is a dozen places agreeing that have to be found and kept found; `.sfont`
saying `!important` is one place saying so once. `.sfont` means "this is set in
the letters somebody drew," the whole point of the app, and nothing may quietly
outrank it. (Not a bug and worth knowing: `SET.myfont` is off until somebody
turns it on — with it off there is no `.sfont` at all, and roman is correct.)

## Names

A function's prefix says which part of the app it belongs to, and it must be
telling the truth. The prefix is how two thousand-odd globals in one namespace stay
findable — `st*` grammar stages, `ob*` onboarding, `ge*` the glyph editor,
`lt*` letters, `wd*` the word sheet, `fmr*` the rules a form is made by, `add*` the new-word sheet,
`wld*` the world, `w*` word data, `words*` the word list, `nt*` the notebook,
`share*` what leaves for the system keyboard,
`f*` search, `v*` a view, `open*` a form, `net*` the server.

`set*` is reserved for settings: it writes `SET.x`, or it builds part of the
settings screen. It is not the English word "set". `setAbVow` wrote `abVow`
and never touched `SET` at all — it is `abSetVow`. Thirteen were like that.

Single bare verbs are not names here. `wipe` and `choose` said nothing about
what they acted on, in a namespace where everything is global; they are
`wipeAll` and `setPlan`. Watch the case, too: `g*` is grammar (`gOpenOf`), so
the glyph editor's `gbtn`/`gsnap` are `geBtn`/`geSnap`.

Renaming an acted function means renaming it in `www/act-map.js` **twice** —
the string and the function — and `act-check` fails on either half alone.

## Layout

| file | what it is |
|---|---|
| `www/core.js` | language registry, `t()`, storage |
| `www/act.js` | the action tables and the one delegated listener (`DO`/`AFTER`/`IN`/`CH`/`KD`) |
| `www/act-map.js` | every name a screen may say, bound to the real function |
| `www/route-map.js` | every route, bound to the view it shows |
| `www/boot.js` | where the app starts |
| `www/shell.js` | the shell every screen sits in (ch 4) |
| `www/onboard.js` | onboarding — what the app is until `SET.done` (ch 5) |
| `www/home.js` | the cover, the contents, the writing system (ch 6) |
| `www/words.js` | the dictionary (ch 7) |
| `www/sound.js` | the alphabet's three lists, one letter, and the chart a letter's sound is picked on (ch 8) |
| `www/settings.js` | settings and plans (ch 11-12) |
| `www/wordsheet.js` | the sheet for writing one word, and CSV (ch 13) |
| `www/keyboard.js` | the keyboard's layout, which the language owns and the person builds — no longer a place to type. The keyboard is chapter VI of the contents now, not a button under the alphabet (ch 22) |
| `www/share.js` | what the system keyboard is given: the keys with the shapes already cut onto them (ch 23) |
| `www/card.js` | the card — one line as a picture that can leave the phone (ch 15) |
| `www/sns.js` | the timeline, the search and the notices (ch 16) |
| `www/import.js` | bringing somebody's existing list in (ch 17) |
| `www/numbers.js` | numbers — a digit is a letter with a value (ch 18) |
| `www/post.js` | a post, and the line the two sides do not cross (ch 19) |
| `www/me.js` | who you are: the face, the name, the handle, the line about yourself (ch 20) |
| `www/backup.js` | the copy that survives the app — a language as one file in Documents (ch 24) |
| `www/rec.js` | the voice on a post — thirty seconds. It goes up with the post 「SNSは全部サーバー」: `netUpVoice()` (`www/net.js`) puts it in the `post-media` bucket and writes the path to `body.vu`, and `voRemote()` is how one name tells a path on the server from a file this phone recorded (ch 25) |
| `www/sheet.js` | the sheet somebody writes a word on paper on, and the number printed on it that says which one (ch 26) |
| `www/store.js` | the App Store: what `LinguaStore.swift` is asked and what comes back (ch 26) |
| `www/sync.js` | putting a language and the copy on this phone back together (ch 26) |
| `www/mod.js` | the other side of a report — what somebody with the flag sees |
| `www/cal.js` | the calendar: a month is a word (ch 27) |
| `www/net.js` | the one window onto the server, and the only place a secret could be (ch 21) |
| `www/ipa.js`, `reading.js` | spelling → IPA, IPA → per-language respelling |
| `www/phases.js`, `letters.js`, `wsys.js` | phonology, alphabet, writing system |
| `www/otf5.js`, `glyph.js` | on-device OTF font writer and glyph rendering |
| `www/assist.js`, `grammar.js` | what the app proposes: sounds, letters, words. Local arithmetic, on every plan |
| `www/voice.js`, `notes.js` | speech, notes |
| `docs/STATE.md` | where the project stands: which branch is the app, what is built, what only looks built, what only a person with a dashboard login can do, and what CI does not run. The one file to hand somebody who has never seen this repo |
| `supabase/schema.sql` | what the server holds and who may touch it — held by `npm run rls` |
| `supabase/setup.md` | every click in the Supabase dashboard, in the order they have to happen, and what to look at afterwards to know it worked |
| `supabase/mail.md` | how the confirmation mail gets sent. Dashboard fields and DNS records, so there is nowhere else it can live |
| `docs/BACKLOG.md` | what was found and deliberately not done, and why: the renames that must not ride along with a feature, the merges waiting on a device, and the question the card bug was actually about |
| `docs/FEATURES.md` | the registry: every feature, its status, its plan, its data, and whether the owner has decided it. Read before building anything |
| `docs/ARCHITECTURE.md`, `DATA_MODEL.md`, `DATA_SAFETY.md`, `FEATURE_RULES.md`, `PAID_FEATURES.md`, `TESTING.md`, `CHANGELOG.md` | the rules above, in full. What is at the head of this file is the part that may not be argued with; these are the working detail |
| `docs/keyboard.md` | how a person builds a keyboard in the app — every field of the editor, and the two ways to lock yourself out of a layer |
| `docs/keyboard-extension.md` | the whole spec for the **Lingua keyboard**: what a person clicks in Apple's site, what the App Group carries, and what the extension may not do. It is an iOS keyboard extension by mechanism and a **Lingua-only** keyboard by purpose -- where somebody writes in their own letters is a field inside this app, not Messages, and **that is why the timeline is inside this app too**. Built now -- `ios/App/LinguaKeyboard/` holds six Swift files, and a person has typed their own letters on it on a real phone. Getting there took four failed builds with one symptom between them, and the fourth cause is the one to remember: the native bridge injects `toNative`, `nativePromise`, `nativeCallback`, `isPluginAvailable` and `withPlugin`, and nothing else. `registerPlugin` and `Plugins` are `@capacitor/core`'s, and **this app has no bundler and never loads it** -- so `Capacitor.Plugins.LinguaShare` is undefined on a phone and silently does nothing. `Capacitor.nativePromise('LinguaShare','write',…)` is the call. Three builds were spent guessing before the app was made to say on screen whether the hand-over had gone out (`kbOutSay()`); the fourth cause fell out of one screenshot. Build the status line first |
| `docs/apple.md` | what a person does in App Store Connect — TestFlight, the two subscriptions, and the fact that no StoreKit code exists yet. Same argument as `mail.md`: none of it can live in the repo except as words |
| `tools/*.mjs` | the checks; `verify-script.mjs`, `lattice-truth.mjs` etc. are font/script experiments |

A new view is found automatically by the checks (they ask the page for globals named
`v` + a capital), so a screen written today is walked today. Nobody adds it to a list.

**A screen is a route AND its argument.** `vSet` with no argument takes none of its
six branches; `vGram` with none shows the list, not a stage. Both walks render each
argument-taking screen once per argument — `walkArg` in `act-check`, `argsOf` in
`i18n-check` — and both ask the page for the list, so a room or stage added later is
walked the day it is added. Do not narrow either one back to the argument-less face:
a screen the mirror never renders is a screen where a hard-coded string sits forever.

Both checks print their coverage (`screens walked:` from `act-check`, `screens
the mirror rendered:` from `i18n-check`) because nothing else in a green run
would show it shrinking. `press` prints `buttons pressed: n  (m/m distinct
names)` for the same reason — and it is what a
change that is meant to alter nothing has to leave untouched. **The numbers are
read off those three runs and are deliberately not copied here**: every time
they were, they rotted, and a stale coverage number is read as a floor that has
been held when it is a floor that has moved. The count has
moved four times, and each move is a change somebody made on purpose: it
jumped from 2952 to 5172 the day the free plan got its twenty-eight letters,
because every screen holding a keyboard went from a handful of keys to a
QWERTY; it fell to 3636 the day the in-app keyboard left for the system
extension — `kbField`, `kbTap`, `kbFlick` and the rest of what let a screen be
typed on inside Lingua are gone, and every screen that used to carry a QWERTY
for typing now carries only what `keyboard.js`'s editor needs. It rose to 5718
the day a post opened onto its thread, and that one is two changes at once: the
row itself became a thing you press, so every post on every screen is a press
where it used to be scenery, and the fixture's timeline went from two posts to
four, because a timeline with no reply in it cannot draw a reply. It rose
again to 5899 the day the timeline became two, which is a tab row on every
render of the feed plus the two faces of it the fixture holds, to 6064
when a photograph became a thing you press and the fixture grew a post
carrying four of them, and to 6283 the day a language could hold three
keyboards — five patterns to choose between, a row of the keyboards, and
three faces of that in the fixture, and to 6288 — a button where the path
into Settings used to be a list, less the keys of a layout paying no longer
replaces. It fell to 5936 over two changes that both took buttons away on
purpose: four screens stopped saying what a heading already said, and the
phonology page stopped making its letters pressable — the letters a sound is
said by are shown there, and joining a sound to a letter is the letter's, in
one place. It rose to 5954 the day a list says which side of the language it
goes into — a word list or an alphabet, chosen rather than guessed at per
row — which is two buttons on the mapping screen and the several faces of it
the fixture holds, and to 5956 the day a forgotten password could actually be
replaced: the code and the new one are a face of the door, and a face of the
door is a screen. It fell to 5938 the day the first keyboard stopped being
editable — board 0 is the free QWERTY itself now rather than a copy of it, so
the paid screen opens on a keyboard with nothing to press: the editor's forty
keys, its layer rail and its height went, and the fixture grew a face for that
board and a keyboard under the two-layer one. It rose to 5955 the day the
timeline asked who you were: the feed, the search and the notices answer with
the app's own door signed out, which is a screen the walk had never rendered,
and the account room's signed-out face swapped places with its signed-in one
because the fixture arrives with a session now. It rose to 7884 the day a
word's reading was chosen rather than typed: the reading page carries the
language's own sounds and the whole of the IPA, which is a hundred and sixty
tiles, and the fixture holds two faces of it. Two things came off in the same
stretch and neither shows in that number as a fall, because the same change
put them back several times over: the row of letter tiles under the box a
word is typed into, and the page for one position of a word.

Then seventy-four commits went past between `cd712dd` and `dbd73d4` with
nobody writing the number down, and it came out the other side at 8627. It was
measured back afterwards rather than guessed at, one checkpoint at a time, and
the shape is the thing worth keeping: **it did not rise by 743, it moved ten
times.**

| | | |
|---|---|---|
| 7884 | — | `cd712dd`, where the number was written |
| 7076 | −808 | 「すべて削除」をアカウント削除にする |
| 7583 | +507 | a keyboard can change its arrangement |
| 7928 | +345 | a one-screen form laid out to the keyboard |
| 8007 | +79 | the composer scrolls under one bar |
| 8396 | +389 | the rules that make a form belong to the dictionary |
| 8473 | +77 | ペンをもう一段細く |
| 7181 | −1292 | 起動時に匿名アカウントを作る |
| 7177 | −4 | オンボーディングの先頭からサインインを外す |
| 8644 | +1467 | `claude/save` を取り込む |
| 8627 | −17 | `master` を最新へ |

**The −1292 and the +1467 are one thing, not two.** That stretch contains the
merge of two branches that had diverged, so two rows next to each other in
`git rev-list` order are not two consecutive states of one app — the app went
one way on one branch and the other way on the other, and the merge put them
together. Nothing lost 1292 buttons.

It fell to 8453 when `wdMode` and the six faces in `tools/fixture.mjs` that set
it came out — those six were being walked in a state the app could no longer be
in — and coverage did not move: 213 of 213 names, still.

**It was 8683 for three sessions' work integrated in one day, 9445 after that,
and 12410 on 2026-08-28.** That last jump is a day of seven chapters landing at
once -- the grammar list became one list of 24, the keyboard sheet gained the
frames, the post's head folded to one line, the onboarding's SNS stage became
the real timeline with a seal over it -- and it is written here rather than
attributed move by move, because nobody wrote the number down between them.
**That is the failure this paragraph exists to prevent**, and it happened
again.
Two of the moves inside it are worth keeping. `setWldDl` was reported by
`press` as never pressed, and the reason was not that it sits behind a plan:
the fixture did not seed `WLD`, so the first press of `setWldHide` hid the row
under it for the rest of the run and the walk narrowed as it went. And
`postThumbs` and the `pdown` chip came back — their definitions survived a
merge and their call sites did not, so the timeline drew the full photograph
and said nothing about a post being taken down, with `dead-check` green
because nothing called them. **A definition arriving is not the same as it
being called**, and `post-check` is what said so.

The last move is +30 and 214 → 218 names: the keyboard editor became a sheet,
so every render of it carries a letter over each column and a number beside
each row — and both are buttons, because pressing one is how that column or
that row goes. The two on the end are the step back and the step forward. The
⊖ on a held key came off in the same change and does not show as a fall: it
was drawn on one face of the fixture and the fifteen are drawn on every one.
The +3 after it is one switch — the letter on each key — reaching the two
faces of this chapter that did not have it. The +492 after THAT is the head of
a row and of a column becoming a selection rather than a delete: two faces of
the fixture where something is selected, each carrying the whole sheet plus
four buttons that are only up while it is, and `screens walked` moved 366 → 368
with them, and +237 again for the + that puts a row in where you are standing
rather than at the foot — one more button on every render of the editor, and
one more face of the fixture, the one where it is asking which side.

`screens the mirror rendered` fell from 377 to 275 in the same stretch, and
that one IS attributed: `i18n-check` renders every screen once per plan, and
`['free','plus','studio']` became `['free','plus']` when Studio was deleted.
A third of the renders went with the tier. Coverage did not fall — the walk
went the other way, from 51 faces to 56.

A number moving is only ever a question — what changed — and the answer has to
be a change somebody made on purpose.

## Working on this repo

- The book is numbered: chapter 0 opens `core.js` and the highest in the tree is
  27 (`cal.js`), each file saying its own number in its opening comment. One
  chapter per file — a file that grew to hold five was split along those banners,
  not along anything new. The numbering has gaps where a chapter was closed; it is
  a shelf, not a count. **Three files say 26** (`sheet.js`, `store.js`,
  `sync.js`), which is the shelf saying two of them are in the wrong place;
  which one keeps the number is the owner's and `docs/BACKLOG.md` carries it.
  Read the file's own first line for its number rather than a range here.
- `www/glyph.js` is the largest file in `www/` after `index.html` (the font
  writer and the drawing surface). Grep for
  the function and read that range rather than the whole file.
- After a change, run the ONE check that holds it (`npm run base`, `npm run card`) --
  seconds. Not `npm test`: six minutes, and it is the leader's run.
- Screenshots: `node tools/shot.mjs feed profile` / `--all` / `--dark` / `--lang ja`.
  Not a gate — it is how a change to a screen gets looked at instead of read as a
  diff of string concatenation. A refactor that is meant to change nothing can be
  held to it: shoot every screen before and after and compare. Expect noise —
  the same code twice does not give the same bytes, so compare against that
  floor rather than against zero.
- iOS build and device testing must happen on a Mac with Xcode
  (`npx cap sync ios`); it cannot be done from a Linux session. **Do not trigger
  a build without being asked.**
