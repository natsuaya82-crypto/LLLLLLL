# Testing

## The gate

```
npm test        # tools/gate.mjs — seventeen checks
```

**Green before a commit.** Once, at the end, on what you are about to commit.
Not after every experiment, and not a second time to be sure.

`tools/pre-commit` runs the six that need no browser (assets, es5, dead,
import, sides, face — about two seconds) plus i18n on any change under `www/`
that is not one of the ten language files or the font writer. **It is not the
gate.** CI runs three of the seventeen, so a green tick on a push is not the
gate either. Run `npm test` yourself.

### How it runs, and why not as one chain

`tools/gate.mjs`. Six checks need no browser, so they go **first and in
order** — about two seconds between them — and a failure there stops the run
before a Chromium is started. There is nothing to learn from eleven browsers
about a file that does not parse.

The other eleven each drive a browser and spend most of their time waiting for
it, so they run **four at a time**. Four, not eleven: they render a real app,
and eleven at once on a laptop is slower than four *and* makes `press` measure
44pt tap targets on a page that was laid out while the CPU was elsewhere.

Every browser check binds its own port, and that is load-bearing now rather
than a coincidence. `press` and `migrate-check` both used 8123, which could
never matter while they ran one after another and kills one of them the moment
they run together. Adding a browser check means giving it a port nothing else
has; the list is in `press.mjs` beside its own.

It was an `&&` chain, and the speed was the smaller of the two problems. A
chain **stops** at the first failure, so a check that dies at module load takes
every check after it with it and prints nothing to say so — which is exactly
what `fill-check` and `round-check` did, and `round` and `press` never ran at
all, with everything above the stop looking green. `gate.mjs` runs all
seventeen whatever any of them does, so a red gate is red in a countable number
of places.

### The whole gate is for a commit. While you work, run one check.

Three rules, and they are about how long a day takes:

1. **The whole gate: once per commit.** Not per experiment, and not "once more
   to be sure". A second green run of unchanged code tells you nothing that the
   first one did not.
2. **While you are working, run the one check that covers what you touched, by
   name.** The table below says which. Changing `www/index.html`'s faces and
   running seventeen checks is sixteen checks answering a question nobody
   asked.
3. **Watching a check go red is also one check.** Put the bug back, run *that*
   check, watch it fail, take the bug out again. The other sixteen have nothing
   to do with it and running them is the same waste twice.

| check | holds |
|---|---|
| `assets` | every `.js` is in `index.html` and tracked by git; every `.swift` is in the Xcode Sources phase |
| `es5` | nothing under `www/` uses anything WKWebView on an old iPhone lacks |
| `dead` | nothing unreached; nothing called that is not something; `CAN` has nothing spare and nothing missing |
| `migrate` | an old install opens with everything in it |
| `i18n` | every visible string went through `t()`, in all ten languages, with fallback armed |
| `import` | eleven real shapes of somebody's word list come in whole |
| `sides` | below the line in `post.js` and `card.js`, nothing names the open language |
| `act` | every name a screen says is bound, and every binding is said |
| `conv` | the seven claims made about the conversion table |
| `card` | a card of a post is a picture of *that* post |
| `word` | what screen you are standing on after a word is renamed or deleted |
| `post` | what a post carries is put on it when it is written |
| `backup` | a language survives a wipe, and a restore never wins |
| `fill` | the inside of what was drawn round survives being saved and read back |
| `round` | ROUND bends a stroke that exists, never invents one, and undoes exactly |
| `press` | every button of every screen, pressed for real; 44pt floor |

```
npm run rls     # supabase/schema.sql, and a second person (~15s)
```

Not in `npm test`, because it stands up a real PostgreSQL and the gate has to
run on a laptop in an airport. Run it whenever `schema.sql` changes.

**Do not silence a failure.** Every one of these fires on a real bug that no
browser and no CI runner would show — they exist because each of them already
shipped once.

## What to run when

| changed | run |
|---|---|
| anything, **when you are about to commit** | `npm test` |
| a face, or anything in `index.html`'s CSS | `npm run face` |
| a global that a screen remembers | `npm run dead` |
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
screens walked: 357
screens the mirror rendered: 271
buttons pressed: 8453
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
- **`buttons pressed` went 7884 → 8627 → 8453**, and not in one step: it was
  measured back over the seventy-four commits between `cd712dd` and `dbd73d4`
  and moved ten times, down as often as up. `CLAUDE.md` has the table. The two
  largest swings are a merge of two diverged branches showing up as a fall and
  a rise in `rev-list` order, not as anything the app did. The last 174 are
  `wdMode`'s six fixture faces coming out.

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
