# Testing

## The gate

```
npm test        # eighteen checks: five in a row, then thirteen four at a time
```

**A session does not run it.** See rule 2.

### 1. It runs in parallel

`tools/gate.mjs` is `npm test`. Five checks need no browser — `assets`, `es5`,
`dead`, `import`, `sides` — and they run first, one after another, in about
two seconds. They are also the ones that catch a typo, so a failure there
means the thirteen browsers were never started. The rest run **four at a
time**: four because each is a browser and a Node process, and past four they
queue on memory rather than on cores.

Output stays whole. A check prints its lines when it finishes, in the order
the list has them, so a green run reads exactly as it did when they ran one
after another.

This is safe only because **every check that stands up a server has its own
port.** `migrate` and `press` were both on 8123; press moved to 8130. Two on
one port is one of them failing with `EADDRINUSE`, which says nothing about
the code. A new check that listens takes a port nothing else has.

### 2. A session does not run the whole gate

`npm test` is six minutes even in parallel, and a session that runs it once
per change spends most of its time watching a progress log instead of talking
to whoever asked for the work. **The owner runs it, once, over everything
that was built.** 「ゲートチェックは全部作って最後に確認するから各個人の
セッションではやらないようにして欲しい 長くて話にならん」

What a session runs is **the one check that holds what it is changing**, by
name — `npm run card`, `npm run word`, `npm run gram`. The table under *What
to run when* says which. That is seconds, not minutes.

This is a change to what "green before a commit" means, and it is deliberate:
a commit on a working branch is a place to put work down, and the gate is what
stands between that branch and being finished. Say in the commit and in the
report which check was run and that the gate was not.

### 3. Watching it go red is one check too

`docs/FEATURE_RULES.md` says a fix is not done until the check that holds it
has been watched failing with the bug still in place. That is **that check**,
run on its own. The other seventeen have nothing to do with the bug you just
put back, and running them proves nothing about it.

`tools/pre-commit` runs the five that need no browser (assets, es5, dead,
import, sides — about two seconds) plus i18n when a screen file changed. **It
is not the gate.** CI runs three of the twelve, so a green tick on a push is
not the gate either. Run `npm test` yourself.

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
| `backup` | a language survives a wipe, and a restore never wins |
| `press` | every button of every screen, pressed for real; 44pt floor |
| `word` | what a word does after two presses in a row — rename, delete, save |
| `post` | what a post carries is put on it when it is written |
| `fill` | a stroke drawn with the fill on inks the inside of what it went round |
| `round` | ROUND is done to a stroke already drawn, is reversible, and never bends a straight one |
| `base` | raising the base makes the digits at once; lowering it never takes away one somebody drew |
| `gram` | a post read in this language comes out in this language's order |

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
| `supabase/schema.sql` | `npm run rls`, and somebody who is not you |
| how anything is saved | `npm run backup` + `npm run migrate`, and see `docs/DATA_SAFETY.md` § changing anything that saves |
| a slice, or `SLICES` | `npm run backup` — and add the slice by NAME to the check, not to a count |
| how a post is rendered | `npm run sides` + `npm run card` |
| what a word does after two presses in a row — rename, delete, save | `npm run word` |
| how a post is read in this language — word order, where an adjective stands | `npm run gram` |
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
screens walked: 338
screens the mirror rendered: 377
buttons pressed: 7884
```

**A number moving is only ever a question: what changed?** And the answer has
to be a change somebody made on purpose. It has moved three times and each was
deliberate: 2952 → 5172 the day the free plan got its twenty-eight letters;
5172 → 3636 the day the in-app keyboard left for the system extension; and the
recent moves as the word sheet became one screen.

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
