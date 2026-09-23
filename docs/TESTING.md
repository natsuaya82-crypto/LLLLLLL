# Testing

## The gate

```
npm test        # every check in tools/gate.mjs; its last line says how many
```

`tools/gate.mjs` runs them: `FAST` and `SLOW` in that file are the two lists,
and **the run's last line is the count** — no sentence here says it. The ones
that need no browser go first,
one after another, and take about two seconds between them — a missing script
tag or an arrow function fails there and nothing heavy is started at all. The
ones that each start a headless Chromium then go **four at a time**
(`WIDE` is `min(4, cpus)`), because they are separate processes holding separate
ports with nothing to say to each other. Run one after another they were about
ten minutes, on a machine nobody has re-measured on since the count grew.

Each check's own output is printed whole, in the order the list below has
them rather than the order they finished in, so a green run reads the same as
it always did and a counter that moved is still visible.

### Three rules about running it, and they are the owner's

**Once before pushing, not once per commit.** A session that makes five
commits and gates each one has spent half an hour proving the same thing five
times. Make the whole batch, gate it once, push. 「全部やって完成！じゃあ全部
のチェックを回す」 If it goes red the browserless checks and the by-name
check have already caught most of what could have caused it, and `git log -p` is
there for the rest.

**While working, run the check that holds what you are changing** — one, by
name, plus the ones that need no browser. `npm run again`, `npm run post`.
That is the loop; `npm test` is the gate at the end of it.

**The fast ones are one group**: `tools/pre-commit` reads `FAST` out of
`tools/gate.mjs` rather than naming them, so the hook and the gate run the same
list and a check added to `FAST` is in the hook the same day.

**Watching a check fail is one run, not a suite.** Put the bug back, run
**that check alone**, watch it go red, take the bug out. The others have
nothing to say about it.

### What stops a second box: `npm run docs`

**A document nobody is sent to is worse than no document**, because the thing
it says is now said in two places and only one of them is read. On 2026-09-04 an
`OWNER-TODO.md` was created for the things only the owner can do — which
`docs/STATE.md` § 4 had held since August, as a table naming each one and who
does it. Two boxes for one thing, and the older one is the one every session
opens.

`tools/docs-check.mjs` is `assets-check` pointed at the reading map instead of
the app. There, `index.html` is the only thing that can load a script, so a
`.js` nothing loads never runs. Here a session is handed `CLAUDE.md`,
`README.md` and `docs/STATE.md` and reads outward, so a document none of the
three reaches — directly, or through a document they do reach — is a document
nobody opens.

It looks both ways, because both have already happened:

- a document under `docs/` that nothing reaches
- a `docs/….md` a reachable document NAMES that is not there, which sends a
  session looking for a page nobody wrote

`docs/reports/` and `docs/scope/` are not in it. Those are what a session said
on a day, like `docs/CHANGELOG.md` — written once, pointed at by nothing
afterwards on purpose. Holding them to a map they were never on would make
this fire on every tidy-up, and a check that fires on nothing anybody must act
on is a check that gets skipped.

`tools/docs-baseline.txt` holds what was already lost the day it was written.
**A NEW one fails. Taking a line out is progress and needs nobody**, and a
line that is no longer true fails too — a baseline that outlives what it
allowed is a hole the next one falls through. That failure **says which of
the two happened**: the document went on the map, or the document was
deleted. They read identically and want opposite things done next, and the
first time it fired the cause was read off as the wrong one of the two.

### Who runs it, when more than one of you is in the tree

The three rules above say *you* run the gate once before pushing.
`docs/SESSIONS.md` says a session never runs it at all — the leader does, once,
after integrating. Both are the owner's, both are true, and they are about
different days.

| | who runs the whole gate |
|---|---|
| parallel sessions are running | **the leader**, once, after integrating. A session runs the one check that holds what it changed, by name, and nothing else |
| one session, nobody else in the tree | **you**, once, before pushing. You are the leader |

`docs/SESSIONS.md` wins while there are parallel sessions; this page wins when
there are not. The thing forbidden either way is the same: proving one green
twice. Ten minutes multiplied by three sessions is that, three times over, and
the third run is not more true than the first.

`tools/pre-commit` runs **the whole browserless group** when a commit touches
`www/` — it reads the names out of `FAST` in `tools/gate.mjs` rather than
keeping its own copy, so a check added to the gate is in the hook the same day
— plus `i18n` when a screen file changed, and `docs` whenever a commit touches
any `.md`. That last one has its own line because the commit that makes a
second box touches no code at all. **It is not the gate.** CI runs three of
them, so a green tick on a push is not the gate either.

### What stops a red master: `tools/pre-push`

**The gate is only a gate if somebody reads it.** On 2026-09-04 a gate and a
push went up as one line joined by `&&`, nothing read what came back, and
master went red. Every rule that would have stopped it was prose — written in
three places, held by nobody, which is the third kind of rule `CLAUDE.md`
forbids.

So `tools/gate.mjs` now writes the commit it was green on into
`.git/gate-green`, and `tools/pre-push` reads it back at the one moment it
matters: **a push to `master` of a commit no green run has ever seen is
refused.**

- **It does not run the gate.** Sixteen minutes inside a push hook is a hook
  people turn off. It only asks whether the gate HAS been run, on THIS commit.
- **It stops `master` and nothing else.** A session pushes to its own branch
  as often as it likes; none of those pushes broke anything.
- **`git push --no-verify` still goes through.** The accident is what is being
  stopped, not the person who means it.
- **A dirty tree records nothing.** What a gate walks with uncommitted changes
  in the tree is not any commit, so writing a sha for it would be a green
  nobody watched. Commit first, then gate, then push.
- **The record never enters a commit.** It says what was proved on this
  machine; carrying it to another machine as a tracked file would be a claim
  nobody made. A fresh clone has no record, which is correct — it has watched
  nothing.

The order this asks for, and the reason:

```
npm test          # and READ it
git push
```

not `npm test && git push`, where the second half runs off an exit code and
the first half goes unread.

Which checks there are is `FAST` and `SLOW` in `tools/gate.mjs`, and what each
one holds is the opening comment of `tools/<name>.mjs` — read it there. This
file keeps no table of them: the one it kept went a whole release without the
checks added after it, and still listed one that had been deleted.

```
npm run rls     # supabase/schema.sql, and a second person (~15s)
```

Not in `npm test`, because it stands up a real PostgreSQL and the gate has to
run on a laptop in an airport. Run it whenever `schema.sql` changes.

**Do not silence a failure.** Every one of these fires on a real bug that no
browser and no CI runner would show — they exist because each of them already
shipped once.

## What to run when

One check, by name, for what you changed. Not `npm test` — see rule 2.

| changed | run |
|---|---|
| anything, **when you are about to commit** | `npm test` |
| a face, or anything in `index.html`'s CSS | `npm run face` |
| a global that a screen remembers | `npm run dead` |
| the base a language counts in | `npm run base` |
| a row or a column of the keyboard editor, or the step back behind them | `npm run kb` |
| `supabase/schema.sql` | `npm run rls`, and somebody who is not you |
| how anything is saved | `npm run again` + `npm run migrate` + `npm run store`, and see `docs/DATA_SAFETY.md` § changing anything that saves |
| a slice, or `SLICES` | `npm run again` + `npm run acct` — and add the slice by NAME to the check, not to a count |
| how a post is rendered | `npm run sides` + `npm run card` |
| what a word does after two presses in a row — rename, delete, save | `npm run word` |
| a screen | `node tools/shot.mjs <screen>` and look at it |
| `www/i18n/*` | `npm run i18n` |
| anything a plan gates | `npm run plan`, **and** add a `halfDone` face in `tools/fixture.mjs` that flips the plan with `planGot()` and puts it back |
| `CAN`, `can()`, `has()`, a ceiling, or where the plan is kept | `npm run plan` |
| a corner, a border, or a panel | `npm run box` — rule 18, against a frozen baseline |
| what the app asks the server for | `npm run acct` + `npm run find` |
| what a brand new phone opens on, or any step of the onboarding | `npm run open` |
| the keyboard's pages, or a key that goes to another face | `npm run page` |
| the four products or the plan they map to | `npm run store` |

## Fixing a bug

Three steps, in this order, and the middle one is not optional:

```
1  reproduce it, measured        — the exact input, the exact wrong output
2  write the check, and WATCH IT FAIL with the bug still in place
3  fix it, and watch the check pass
```

Then put the bug back one more time and confirm the check goes red again. A
check written after the fix, never seen failing, is a check that may be
asserting nothing.

This is not theoretical. `card-check`'s first version was worthless: it asked
`cardSrc()` and then chose between `cardInkUnits()` and `cardUnits()` *itself*
— a copy of the decision under test — so putting the bug back left it green.
It has to observe the real code path, not restate it.

It happens the same way each time. `conv-check` worked the private use
assignment out again inside itself, so shifting `installTypeFont()` by one moved
the keys and the check's own copy together and it stayed green with the bug in. **A check that
recomputes the thing under test is a copy of it, and a copy always agrees.**
`LinguaFont.build` is wrapped now and the assignment is read off what the font
writer was actually handed. If you find yourself writing the answer out in the
check, you are writing the second half of the bug.

### Putting the bug back: choose the bug somebody would actually make

The red you watch has to be the failure you are afraid of, not the easiest one
to cause, and the two are often different.

A rename across six files was held to "put the declaration back and count the
complaints" — five call sites, so five complaints, so nothing was missed.
`dead-check` reports **one name once**, with the first file it saw:

```
1 name is called and never defined:
  www/backup.js  ntRead()
```

The count is of names, not of sites, so it can never answer "how many did I
miss". And deleting the declaration is not the mistake anybody makes — the
mistake is **leaving one call site behind**, which is a different red and the
one worth watching:

```
core.js:183 back to noteRead()
  → 1 name is called and never defined:  www/core.js  noteRead()
```

What proves a rename left nothing behind is `grep -rn '\bOldName\b' www/ tools/`
coming back empty. The check proves the app still holds together; the grep
proves the rename finished. They are two statements and neither stands in for
the other.

**And the wrong red is how the right one was found, so the order is part of
the procedure.** Putting the declaration back came first; it produced one
complaint where five were predicted, and it was chasing *that* mismatch that
turned up the break worth watching. Nobody reasons their way to "break the
call site instead" from a blank page. So the step is not "pick the right bug"
— it is:

```
predict what the red will say, before you run it
put the bug back
if what came out does not match the prediction, you have learned
  something about the CHECK. Do not move on. Break it the other way
  until you have a red you predicted.
```

A red that matches your prediction means you understand what the check is
watching. A red that does not means you do not, and the gap is where the next
hole is — twice in one day, that gap was the hole: `dead-check` counting names
rather than sites, and `conv-check`'s eighth claim saying nothing at all about
a single key falling back to roman.

Mandatory regression tests, no exceptions:

```
  saving, restoring, migrating
  anything past-tense (posts, and whatever comes after them)
  anything a plan gates
  anything that deletes
  anything that syncs
```

## Which prose rules a check holds, and which are prose on purpose

CLAUDE.md's opening section is the part that may not be argued with. Most of it
is process and cannot be mechanised. Some of it is about the app and can. This
table says which is which, so that **a rule with no check is a deliberate state
and not an oversight waiting to be fixed** — the last audit found people about
to build the two that must not be built.

Audited 2026-08-22, by measuring rather than by remembering.

| rule | held by | measured |
|---|---|---|
| **NO ROUNDED BOX** | `box` (rule 18) | 240 corners and borders, baseline frozen; 0 set from JS |
| **Rows in one list are one height** | `press` (first half) | 1484 lists, none at two type sizes |
| **The past is put on the thing when it is made** | `card`, `post` | ink cut at write time, redrawn under a changed alphabet |
| **Data: a migration copies, a restore fills** | `migrate`, `backup` | old keys seeded; an older file restored over a live language |
| **Money: a plan opens capabilities, not existence** | `dead` (`CAN`/`can`) | no capability nothing asks for, no `can()` in no plan |
| **A key nothing asks for** | `i18n` (tenth) | 127 dead keys × 10 languages found and removed |
| **No explanatory text in the app** | — **prose, and kept** | 194 strings; one over 100 chars, and it is the frozen screen, which CLAUDE.md names as the only exception |
| **No `margin-top` on a row to make a group** | — prose | not measured yet; the other half of the row rule |
| **Online: a screen that half-works without a server** | — prose | no way to ask it mechanically found |
| **Automatic deletion, pruning and cleanup** | — prose + DELETE REVIEW | a process gate, not a check |

### The three that must NOT become checks

Said out loud because each is a reasonable thing to want to build, and building
any of them means **drawing a line the owner did not draw**.

- **"A row of round chips you scroll sideways."** Mechanically this is
  `overflow-x:auto` with rounded children, and there are eight horizontal
  scrollers in `index.html`. Which of them is the banned shape and which is a
  legitimate rail is a judgement about a screen.
- **"The thing being chosen and the thing being changed on one screen"**, and
  **"a sheet that slides up instead of a page you went to."** `.sheet` is still
  in the app by design — the sound chart is a sheet opened from the letter it
  is about, and CLAUDE.md says so approvingly in the same file that bans
  sheets. The rule is about a *kind* of sheet, and no parser can tell them
  apart.
- **"A filled panel"**, the third thing NO ROUNDED BOX names. A background
  colour is not a panel: the bar, the sheet and the body all have one and
  always did. `box-check` holds two of the three and says which one it does not.

The principle underneath all three is one sentence, and it is worth more than
the table: **inventing a rule the owner did not write is worse than holding two
thirds of the one they did.** A check that fires on a screen the owner is happy
with does not get fixed; it gets ignored, and then so does the rule it was
protecting.

## Numbers that move

Three checks print a count so that nothing shrinks silently:

```
screens walked: …
screens the mirror rendered: …
buttons pressed: …
```

**The numbers are deliberately not written here.** Take them from your own first
run and compare your second run against those. A stale number on this page turns
a correct run into a false alarm, which is worse than having no number at all.
`CLAUDE.md` carries the history of the button count, move by move.

**A number moving is only ever a question: what changed?** And the answer has
to be a change somebody made on purpose. Two shapes the answer has taken, so
that neither looks like a fault:

- **The mirror count can FALL without coverage falling.** `i18n-check` renders
  every screen once per plan, so deleting a tier deletes a third of the renders
  while the walk gets wider. That is what happened when Studio went.
- **The button count moves down as often as up, and a merge moves it twice.**
  Two diverged branches coming together show up as a fall and then a rise in
  `rev-list` order rather than as anything the app did. Fixture faces coming out
  of `tools/fixture.mjs` move it too. `CLAUDE.md` has the table, move by move.

## Screenshots

```
node tools/shot.mjs feed profile
node tools/shot.mjs --all --dark --lang ja
node tools/shot.mjs form:add           # a sheet, by its form key
```

Not a gate. It is how a change to a screen gets looked at instead of read as a
diff of string concatenation. A refactor meant to change nothing can be held to
it: shoot every screen before and after. Expect noise — the same code twice
does not give the same bytes — so compare against that floor, not against zero.

**UI changes are shown before they are pushed.** 「見た目を見せてね作り変えたなら
どんな風になったか俺わからないし」

## Device

Some things cannot be tested here at all, and saying "tests pass" about them is
a lie. **Report "code confirmed" and "device confirmed" as two separate lines,
always.**

Device required:

```
  writing a file to Documents, and reading it back
  the backup generations (.1 / .2), and a corrupt newest file
  anything in WKWebView that a headless Chromium does not reproduce
  the system keyboard extension
  registering the drawn font with iOS (LinguaShare.registerFont)
  the home-screen widgets
  purchases
  TestFlight-only behaviour
  sharing a file out
  restoring after the app is relaunched
  notifications
  the network
  cloud sync
```

**There is no Swift on a Linux runner**, so every `.swift` in `ios/App/` is on
this list by construction — the app's five, the keyboard extension's six, the
widget's eight. `assets-check` asks whether each one is in the Xcode Sources
phase and says nothing whatever about whether it compiles.

iOS builds happen on a Mac with Xcode, or through the `ios-deploy.yml` workflow.
**Do not trigger a build without being asked.**
