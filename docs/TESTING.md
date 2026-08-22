# Testing

## The gate

```
npm test        # sixteen checks
```

`tools/gate.mjs` runs them. The five that need no browser go first, one after
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

`tools/pre-commit` runs the five that need no browser plus i18n when a screen
file changed. **It is not the gate.** CI runs three of the sixteen, so a green
tick on a push is not the gate either. Run `npm test` yourself, once, before
the commit.

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
| anything | `npm test` |
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
