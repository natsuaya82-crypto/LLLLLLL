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
> says the two that are easiest to get backwards: the timeline is
> `localStorage` and no part of it is on the server yet, and CI runs three of
> these twelve checks, so a green tick on a push is not the gate.

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
and "the plan is unknown" must never take the same branch as "this person has
no data" — a failed check means fewer buttons, never fewer words.
→ `docs/PAID_FEATURES.md`

**Online.** Anything that needs the server is built assuming the server is
there. A screen that half-works without one is not a step on the way to being
online — it is a bug, and it is found by somebody using the app rather than by
a check, because nothing throws. The timeline is the worked example: the three
sns tabs and the composer never asked who you were, while every write in
`schema.sql` had gone through `is_member()` from the first day, so signed out
you could write a post that went nowhere. Reading the timeline and posting to
it both need an account now. The MAKING side is the other half of the same
sentence and needs none: a language is made on this phone, with or without one.
「最初からオンライン前提で作れ」 → `docs/FEATURE_RULES.md`

**Shape.** Four things are banned outright: a row of round chips you scroll
sideways (if there are more than a few, it is a **list**); the thing being
chosen and the thing being changed on one screen (choosing is a screen,
changing is the screen you arrive at); a sheet that slides up over where you
were instead of a page you went to; and explaining. The keyboard chapter had
all four at once. 「丸パッチ無限横並び、同じページに情報量詰め込み、ページ遷移型に
せず下からひょいって出すやつ、無駄に説明をするやつ、この辺禁止」
→ `docs/FEATURE_RULES.md`

**Explaining.** No explanatory text in the app. A screen shows what it is and
what can be done on it; it does not explain itself, does not say what a paid
plan would give, does not tell somebody what to tap, and does not describe what
a setting means. An empty state, a count, a state, an error — none of those is
an explanation. Where one is genuinely needed it goes behind the `?` in the
bar, which is what the `?` is for. 「アプリ内に説明書くの禁止」
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

**An owner decision is a specification, not an instruction for today.** When
the owner settles behaviour, a threshold, a limit, the free/paid line,
retention, deletion, migration, how past data behaves, timing, what is
selected, or what a screen does: record it in the decision log, implement
exactly that, and do not reinterpret it into a more reasonable rule or
generalise it to anything nearby. A later session reads it before changing
that area, and does not re-open it because a different shape seems more
natural. If a decision conflicts with a rule already written down — **stop**,
report both sides with the code and data affected, and do not resolve it
yourself. → `docs/FEATURE_RULES.md`

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
merge, rebase or cherry-pick another branch** — the leader integrates, and
asks the owner where the answer is a decision rather than a merge.
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
npm test        # tools/gate.mjs -- five with no browser in a row (assets, es5,
                # dead, import, sides, ~2s), then the other twelve four at a
                # time. Six minutes. NOT run by a session -- see rule 2.
```

Three rules about running it:

1. **It runs in parallel.** Safe only because every check that stands up a
   server has its own port. A new check that listens takes one nothing else
   has.
2. **A session does not run the whole gate.** The leader runs it, once, after
   integrating. What a session runs is the ONE check that holds
   what it is changing, by name -- `npm run card`, `npm run base`. Say in the
   report which check was run and that the gate was not.
   「ゲートチェックは全部作って最後に確認するから各個人のセッションでは
   やらないようにして欲しい 長くて話にならん」
3. **Watching it go red is one check too.** Put the bug back and run THAT
   check. The other sixteen have nothing to do with it.

→ `docs/TESTING.md` § the gate

Individual: `npm run assets` / `es5` / `dead` / `migrate` / `i18n` / `import` /
`sides` / `act` / `conv` / `card` / `word` / `post` / `backup` / `fill` / `round` /
`base` / `press`.
`tools/pre-commit` runs the ones that need no browser (assets, es5, dead, import, sides —
about two seconds) plus i18n when a screen file changed. It is not the whole gate, and
neither is what a session runs: the whole gate is the leader's, after
integrating.

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

## The fourteen rules the gate enforces

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

`press-check` is the other half and not the same statement: it dispatches a real
click on every button of every screen and fails if one throws or empties `#app`.
It also measures: 44pt on both sides of anything a thumb has to hit. A key of a
keyboard is the one exception and is measured on its height alone — ten letters
in a row is what QWERTY *is*, and ten of anything across a phone is 35pt on
every phone ever made, Apple's own keyboard included. Widening that floor to 44
would not make a keyboard safer to type on; it would forbid a keyboard.
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

**And what money buys, which is the same sentence a third time.** `CAN` in
`core.js` names every capability a plan opens — `words` `ai` `data` `file`
`letters` `kinds` `wsys` `kb` `sug` — and `can('kb')` is the only way to ask.
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
Studio, meant reading twenty-three branches and remembering one at a time
what each had ever been about. The paid tier ships as a diff on top of the
free one, so that reading was going to happen.

Putting the nine side by side found something on the first day: `ai` lifts at
Plus and `sug` only at Studio, and they are the same ceiling. A Plus account
is shown "3 left" on the word sheet forever and never spends one, because
`sugLeft()` subtracts a counter `aiSpend()` returned early without touching.
Nothing throws and nothing is refused, which is why it sat there. Both are
left as they were — which plan buys the AI is a price, and a price is not a
tool's to decide — but now it is one table apart instead of two files apart.

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

### 11. A language is never lost

`www/backup.js` (chapter 24) writes the open language out as one file, into
Documents, where iOS puts it in the device backup and the Files app can show
it. Everything a person makes lived in `localStorage` and nowhere else, which
is one copy in a place with four ways to lose it: the app is deleted, the
phone is replaced without a backup, WKWebView's storage is reclaimed, or a
migration goes wrong. Three of those four are ordinary events.
「データ消えるのだけはありえない」

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
`tk*` talk, `lt*` letters, `wd*` the word sheet, `add*` the new-word sheet,
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
| `www/talk.js`, `assist.js`, `grammar.js` | the AI (Studio) side |
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

Both checks print their coverage (`screens walked: 338`, `screens the mirror
rendered: 377`) because nothing else in a green run would show it shrinking.
`press` prints `buttons pressed: 7884` for the same reason — and it is what a
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
word is typed into, and the page for one position of a word. A number
moving is only ever a question — what changed — and the answer has to be a
change somebody made on purpose.

## Working on this repo

- The book is numbered: chapter 0 opens `core.js`, chapter 25 closes `rec.js`, and
  a `/* ==== n. title ==== */` banner opens each. One chapter per file — a file that
  grew to hold five was split along those banners, not along anything new. The
  numbering has gaps where a chapter was closed; it is a shelf, not a count.
- `www/glyph.js` is 79 KB (the font writer and the drawing surface). Grep for
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
