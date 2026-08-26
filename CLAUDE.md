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
> says the two that are easiest to get backwards: the timeline **is** on the
> server now — `post`, `react`, `follow`, `profile` and the notices RPC, with
> `localStorage` as the copy that survives a bad network — and CI runs three of
> these twenty-six checks, so a green tick on a push is not the gate. This
> paragraph said the opposite of the first of those for a week after it stopped
> being true, which is the whole reason that file says how to re-check rather
> than what to believe: `grep -n "rest/v1" www/net.js`.

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

**Online.** Anything that needs the server is built assuming the server is
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

**There is one kind of account and there are no anonymous ones** 「匿名アカウント
はねえよ」「二種類になる意味も分からないけど」. An account is somebody who
signed in. The onboarding ends at that door and there is no way past it. Nothing
asks a second question about what kind of account this is — `has_account()`
beside `is_member()` existed to let an anonymous one through, and there is
nothing to let through. **The first language is the one place this is not true
yet**: it is minted at the top of `www/core.js`, which `index.html` loads before
`net.js` exists, so it cannot ask anything about a session. `claude/admin` has
the rest. 「最初からオンライン前提で作れ」 → `docs/FEATURE_RULES.md`

**Shape.** Four things are banned outright: a row of round chips you scroll
sideways (if there are more than a few, it is a **list**); the thing being
chosen and the thing being changed on one screen (choosing is a screen,
changing is the screen you arrive at); a sheet that slides up over where you
were instead of a page you went to; and explaining. The keyboard chapter had
all four at once. 「丸パッチ無限横並び、同じページに情報量詰め込み、ページ遷移型に
せず下からひょいって出すやつ、無駄に説明をするやつ、この辺禁止」

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
first half** -- siblings of one class rendering at two type sizes -- and 1484
lists are measured on every run. The `margin-top` half is prose still.
→ `docs/FEATURE_RULES.md`

**Explaining.** No explanatory text in the app. A screen shows what it is and
what can be done on it; it does not explain itself, does not say what a paid
plan would give, does not tell somebody what to tap, and does not describe what
a setting means. An empty state, a count, a state, an error — none of those is
an explanation. Where one is genuinely needed it goes behind the `?` in the
bar, which is what the `?` is for. 「アプリ内に説明書くの禁止」

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
merge, rebase or cherry-pick ANOTHER BRANCH** — the leader integrates, and
asks the owner where the answer is a decision rather than a merge. **Bringing
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
list, the whole gate green (the LEADER's run, not the session's), owner
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
| `docs/STATE.md` | where the project stands — read first |

## The gate

```
npm test        # tools/gate.mjs -- eight with no browser in a row (assets, es5,
                # grammar-engine, dead, import, sides, face, box, ~2s), then the
                # other eighteen four at a time. NOT run by a session -- rule 2.
                # The count is FAST.length + SLOW.length in tools/gate.mjs and
                # nowhere else; every number in this file is a copy of it.
```

Individual: `npm run assets` / `npm run es5` / `npm run dead` / `npm run migrate` /
`npm run i18n` / `npm run import` / `npm run sides` / `npm run face` / `npm run box` /
`npm run act` /
`npm run conv` / `npm run card` / `npm run word` / `npm run post` / `npm run backup` /
`npm run fill` / `npm run round` / `npm run base` / `npm run kb` / `npm run plan` /
`npm run press`.
`tools/gate.mjs` is what `npm test` runs. The eight that need no browser go first, one
after another, in about two seconds — a missing script tag or an arrow function fails
there and nothing heavy is started at all — and the eighteen that each start a headless
Chromium then go **four at a time**. Sequentially they were ten minutes. Each check's
output is printed whole and in list order, so a counter that moved is still visible.

**Three rules about running it, and they are the owner's.** *Once before pushing, not
once per commit* — make the whole batch, gate it once, push; a session that gates five
commits separately has spent half an hour proving the same thing five times.
「全部やって完成！じゃあ全部のチェックを回す」 *While working, run the one check that
holds what you are changing*, by name, plus the five fast ones — that is the loop.
*Watching a check fail is one run, not a suite* — put the bug back, run that check
alone, watch it go red, take the bug out.

**Who runs it depends on how many of you there are, and that is the whole of the
exception.** The sentence above says *you* run it once before pushing, and
`docs/SESSIONS.md` says a session never runs it at all — the leader does, once, after
integrating. Both are true and they are about different days:

- **Parallel sessions are running** → `docs/SESSIONS.md` wins. A session runs the one
  check that holds what it changed, by name, and nothing else. The whole gate is the
  leader's, once, at the end. Sixteen minutes of gate multiplied by three sessions is
  the same green proved three times, and the third one is not more true.
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
somebody with no account, to do all 34 things the file says cannot be done.
Adding a policy means adding the line somebody would use against it.

## The nineteen rules the gate enforces

Nineteen is how many rules are written below. **The gate is twenty-six checks,
and the two are not the same number and must not be made to match** — count the
rules here, and count `FAST` and `SLOW` in `tools/gate.mjs` for the other. One
rule can take three checks and one check can hold two rules.

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
AND after every press: a render-only walk never reaches `.on`. 202 were styled
and worn by nothing, frozen in `tools/css-baseline.txt` as a ratchet.
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
writes down. 1484 lists measured, none of them two heights.

A name can resolve to a function that throws the moment it runs — `act-check`
calls that button fine. Both fixtures and the half-done screen list live in
`tools/fixture.mjs` so the two walk the same app; add a screen there, not to one
of them.

### 4. A route carries its view

`PAGES` in `www/shell.js` says what a route is called and which tab it is
under. `www/route-map.js` says what it *shows* — `page('build', vBuild)`, the
function itself, never its name, exactly as `act-map.js` does. `render()` looks
it up; it used to be a chain of conditions, a second copy of `PAGES` that
nothing could check against the first. There are 30 routes.

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
`core.js` names every capability a plan opens — `words` `data` `file`
`letters` `wsys` `kb` `snd` `edit` `badge` `gram` `dir` — and `can('kb')` is the
only way to ask. **Count them off `CAN` and not off this line**: it listed `tr`,
which is not a capability and never was, and it was missing `edit` and `badge`,
which are. `npm run dead` prints the number it actually counted on every run
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

Storage is per language. Eleven slices — words, lines, name, script, letters,
notes, phases, talk, sounds, keyboard, world — live under `lingua.<id>.<slice>`;
`lingua.langs` says which languages are here and whose; `lingua.set` is the
person's settings and belongs to no language. `langKey('words')` is the only
thing that knows how a language is filed.

`SLICES` in `core.js` is that list, and being *in* it is what makes a slice
real: `bkPack()` walks it, so a slice outside it is in no backup, and
`wipeAll` walks it, so a slice outside it survives a wipe into the next
language. Two were outside it. The **keyboard** is the language's — built in
the app, filed under `langKey('kb')` beside the words — and was in no backup;
and **what the language is for** sat in `SET`, the person's settings, directly
under a comment saying it travels with the language. Neither could throw:
a backup was written, it restored, every check was green, and the keyboard
somebody built simply was not in the file. `backup-check` now names both
rather than counting slices — a count says eleven and goes on saying eleven
when the eleventh is the wrong one.

The globals do not change. `WORDS` is the open language's dictionary, because
the app shows one language at a time and 290-odd places say `WORDS` meaning
"the one in front of me".

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
`shareKbd()` and checks all seven against what came back.

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

**Decided and not in yet, so read this as the decision and not as the code:**
the mapping is worked out in four places — `installTypeFont()`, `puaRoman()`,
`postCutTyped()` and `shareFace()` — each writing `ltOrder(LETTERS.filter(has
strokes))` out again. It becomes `ltPuaOrder()` in `glyph.js`, beside `ltPua()`,
and those four ask it. When it lands, its name goes in `sides-check`'s forbidden
list beside `LETTERS` itself — it reads the making side, and **a function that
reads the making side is a way to reach the making side; giving it a new name is
not a way to stop being one.** Landing it without that line open the hole in the
same commit that closes the duplication.

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
demands that nothing moves. It also walks `SLICES`, so a tenth slice added to
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
3. **No family is named in `www/*.js` at all** — with one exception, which is
   the font the person drew: JavaScript builds it, so JavaScript has to name it.
   `SFONT_FAMILY` in `glyph.js` must be exactly the family in `--face-script`.
   When those two disagree nothing throws: the font builds, the `@font-face`
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

It is **not** "no corner in this stylesheet". There are 240 corners and borders
in `index.html` and `.btn` is on about thirty older screens; deleting all of it
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

**Where a row is short from is rounded to a whole key**, and that is the half
of it that is easy to get wrong. A column is half a key, so half of what is
left over is very often an odd number of columns — three keys on a sheet of
ten leave fourteen, and seven of those is three keys and a half. Put that in
front and every key on the row straddles two columns, and the letters across
the top, which are the reason this is a sheet at all, stop naming anything on
the row somebody has just worked on. 「行の中央寄せした後列がずれてるのはどう
なる？」 The odd half goes to the other end instead: off centre by half a key,
which nobody can see, and on a column, which is what the sheet is for. The
drawing of a short row and the button that aligns one ask the same function.

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

`tools/kb-check.mjs` holds seventy things: the row that goes is the one pressed
and every other row is untouched and in order; a column comes out of every row,
one key's worth from each; **a key wider than the column is NARROWED and not
removed** (a cell spanning b–d, with c taken out, spans b–c); the half key that
insets the QWERTY's third row survives all of it; the step back is exact and
three of them walk back through three deletes in order; the step forward undoes
the step back; nothing outside the layout moves — not a letter, not a word, not
another keyboard, not another face; and the two buttons are down when there is
nowhere to go.

It holds the two ceilings with them, because they are the same screen and the
same kind of mistake. **Ten across is the phone's number** — the narrowest
iPhone is 320, so ten keys are 32 each and eleven would be 29 — and every
pattern the app builds already comes to ten or fewer. **How many DOWN is the
phone's number too, and it is not a number written in the app.** 「キーボードの
高さ制限を決めたやん。キーの高さじゃなくてキーボードそのもの。だから行の列は
そのキーボードの制限の範囲内で追加できるって話だけど？」 The extension caps the
whole keyboard at **0.55 of the screen** and SQUEEZES the rows past it, so a
ninth row was never a ninth row — it was every row getting shorter. **And a row
is a KEY tall**: 「キーのサイズはiPhoneのサイズによって変わるんじゃないの？八行
入っても小さかったら打ちにくいだけだぞ？」 The extension's row was a flat 54pt,
so a key was the same height on every phone and the only thing a bigger phone
bought was more rows — backwards from what a bigger phone is for. Width always
scaled, because ten keys divide whatever the phone is across; the height
follows it now, at **0.1385 of the phone's short side**, which is that same 54
at the 390 it was measured on. A key keeps its shape: **44pt on the narrowest
iPhone, 61 on a Pro Max**. The rows that fit are then divided out of the cap
rather than chosen — **seven from the 13 mini up, six on an SE 2, five on an
SE 1, and eight on nothing**. It was `KB_ROWS = 8` — a number this file used to
justify with "nothing on the phone sets a height", which was untrue when it was
written, and which no phone ever had room for. The ceiling is **one number for
every phone**, not as many as the phone in your hand fits: a keyboard belongs
to a language and a language moves between phones, so building eight where they
fit and handing them to an SE is eight rows nobody can type on — the width rule
one axis over. `kbRowsMax()` is the one place, and **`kb-check` reads the three
numbers OUT of `KeyboardViewController.swift`**, because two copies of a number
in two languages is the thing that drifts. Both ceilings hold on ADDING only:
**a layout already over the ceiling is left exactly as it is**, because cutting
it down would be the app deleting somebody's keys. The check puts an
over-the-ceiling layout in and demands that nothing moves.

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
(`postGlossHTML()`), what the meaning defaults to (`pwMn()`), what to call an
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
me", read from 290 places, filed under `langKey()`. One thing seen from many
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
telling the truth. The prefix is how 500-odd globals in one namespace stay
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
| `www/rec.js` | the voice on a post — thirty seconds, as a file in Documents, never in `localStorage` (ch 25) |
| `www/net.js` | the one window onto the server, and the only place a secret could be (ch 21) |
| `www/ipa.js`, `reading.js` | spelling → IPA, IPA → per-language respelling |
| `www/phases.js`, `letters.js`, `wsys.js` | phonology, alphabet, writing system |
| `www/otf5.js`, `glyph.js` | on-device OTF font writer and glyph rendering |
| `www/assist.js`, `grammar.js` | what the app proposes: sounds, letters, words. Local arithmetic, on every plan |
| `www/voice.js`, `notes.js` | speech, notes |
| `docs/STATE.md` | where the project stands: which branch is the app, what is built, what only looks built (the timeline is on the phone; the `post`/`follow`/`quote` tables are written and unused), what only a person with a dashboard login can do, and what CI does not run. The one file to hand somebody who has never seen this repo |
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

Both checks print their coverage (`screens walked: 366`, `screens the mirror
rendered: 275`) because nothing else in a green run would show it shrinking.
`press` prints `buttons pressed: 9445  (222/222 distinct names)` for the same
reason — and it is what a
change that is meant to alter nothing has to leave untouched. The count has
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

**It was 8683 for three sessions' work integrated in one day, and is 9445 now.**
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

- The book is numbered: chapter 0 opens `core.js`, chapter 25 closes `rec.js`, and
  a `/* ==== n. title ==== */` banner opens each. One chapter per file — a file that
  grew to hold five was split along those banners, not along anything new. The
  numbering has gaps where a chapter was closed; it is a shelf, not a count.
- `www/glyph.js` is 104 KB (the font writer and the drawing surface). Grep for
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
