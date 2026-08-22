# Testing

## The gate

```
npm test        # seventeen checks
```

`tools/gate.mjs` runs them. The six that need no browser go first, one after
another, and take about two seconds between them — a missing script tag or an
arrow function fails there and nothing heavy is started at all. The eleven
that each start a headless Chromium then go **four at a time**, because they
are separate processes holding separate ports with nothing to say to each
other. Run one after another they were about ten minutes.

Each check's own output is printed whole, in the order the list below has
them rather than the order they finished in, so a green run reads the same as
it always did and a counter that moved is still visible.

### Three rules about running it, and they are the owner's

**Once before pushing, not once per commit.** A session that makes five
commits and gates each one has spent half an hour proving the same thing five
times. Make the whole batch, gate it once, push. 「全部やって完成！じゃあ全部
のチェックを回す」 If it goes red the fast five and the by-name check have
already caught most of what could have caused it, and `git log -p` is there
for the rest.

**While working, run the check that holds what you are changing** — one, by
name, plus the five fast ones. `npm run backup`, `npm run post`. That is the
loop; `npm test` is the gate at the end of it.

**Watching a check fail is one run, not a suite.** Put the bug back, run
**that check alone**, watch it go red, take the bug out. The other fifteen
have nothing to say about it.

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
twice. Sixteen minutes multiplied by three sessions is that, three times over,
and the third run is not more true than the first.

`tools/pre-commit` runs the six that need no browser plus i18n when a screen
file changed. **It is not the gate.** CI runs three of the seventeen, so a green
tick on a push is not the gate either.

| check | holds |
|---|---|
| `assets` | every `.js` is in `index.html` and tracked by git; every `.swift` is in the Xcode Sources phase |
| `es5` | nothing under `www/` uses anything WKWebView on an old iPhone lacks |
| `dead` | nothing unreached; nothing called that is not something; `CAN` has nothing spare and nothing missing |
| `migrate` | an old install opens with everything in it |
| `i18n` | every visible string went through `t()`, in all ten languages, with fallback armed |
| `import` | eleven real shapes of somebody's word list come in whole |
| `sides` | below the line in `post.js` and `card.js`, nothing names the open language |
| `face` | a font family is named on `:root` and nowhere else, and the drawn font under one name |
| `act` | every name a screen says is bound, and every binding is said |
| `conv` | the seven claims made about the conversion table |
| `card` | a card of a post is a picture of *that* post |
| `word` | what screen you are standing on after a word is renamed or deleted |
| `post` | what a post carries is put on it when it is written |
| `backup` | a language survives a wipe, and a restore never wins |
| `fill` | the inside of what was drawn round survives being saved and read back |
| `round` | ROUND bends a stroke that exists, never invents one, and undoes exactly |
| `press` | every button of every screen, pressed for real; 44pt floor |
| `word` | what a word does after two presses in a row — rename, delete, save |
| `post` | what a post carries is put on it when it is written |
| `fill` | a stroke drawn with the fill on inks the inside of what it went round |
| `round` | ROUND is done to a stroke already drawn, is reversible, and never bends a straight one |
| `base` | raising the base makes the digits at once; lowering it never takes away one somebody drew |

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
| `supabase/schema.sql` | `npm run rls`, and somebody who is not you |
| how anything is saved | `npm run backup` + `npm run migrate`, and see `docs/DATA_SAFETY.md` § changing anything that saves |
| a slice, or `SLICES` | `npm run backup` — and add the slice by NAME to the check, not to a count |
| how a post is rendered | `npm run sides` + `npm run card` |
| what a word does after two presses in a row — rename, delete, save | `npm run word` |
| a screen | `node tools/shot.mjs <screen>` and look at it |
| `www/i18n/*` | `npm run i18n` |
| anything a plan gates | add a `halfDone` face in `tools/fixture.mjs` that flips `SET.plan` and puts it back |

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

It happened again, in `conv-check`'s eighth claim, and it is the same shape
each time: the check worked the private use assignment out again inside
itself, so shifting `installTypeFont()` by one moved the keys and the check's
own copy together and it stayed green with the bug in. **A check that
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

Mandatory regression tests, no exceptions:

```
  saving, restoring, migrating
  anything past-tense (posts, and whatever comes after them)
  anything a plan gates
  anything that deletes
  anything that syncs
```

## Numbers that move

Three checks print a count so that nothing shrinks silently:

```
screens walked: 366
screens the mirror rendered: 275
buttons pressed: 8683
```

All three measured 2026-08-22. `CLAUDE.md` carries the full history of the
button count, move by move.

**A number moving is only ever a question: what changed?** And the answer has
to be a change somebody made on purpose. Two recent ones, so that neither
looks like a fault:

- **`screens the mirror rendered` FELL, 377 → 271.** `i18n-check` renders every
  screen once per plan, and `['free','plus','studio']` became `['free','plus']`
  when Studio was deleted. A third of the renders went with the tier; coverage
  did not fall, the walk went 51 faces → 56.
- **`buttons pressed` went 7884 → 8627 → 8453 → 8683**, and not in one step: it was
  measured back over the seventy-four commits between `cd712dd` and `dbd73d4`
  and moved ten times, down as often as up. `CLAUDE.md` has the table. The two
  largest swings are a merge of two diverged branches showing up as a fall and
  a rise in `rev-list` order, not as anything the app did. The last 174 are
  `wdMode`'s six fixture faces coming out; the last rise is three sessions
  integrated in one day, plus two buttons the walk had been hiding from itself.

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
  purchases
  TestFlight-only behaviour
  sharing a file out
  restoring after the app is relaunched
  notifications
  the network
  cloud sync
```

`backup-check` holds everything on this side of the native call; `keep()` and
`kept()` are Swift and there is no Swift on a Linux runner.

iOS builds happen on a Mac with Xcode, or through the `ios-deploy.yml` workflow.
**Do not trigger a build without being asked.**
