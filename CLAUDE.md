# Lingua

A conlang-building app. Plain HTML/CSS/JS under `www/`, wrapped by Capacitor for iOS
(`ios/`, appId `com.tokinets.lingua`, webDir `www`).

**There is no build step and no bundler.** `www/index.html` loads every `.js` with a
`<script src>` tag. What is in the repo is what runs on the phone.

## The gate

```
npm test        # assets + es5 + dead + i18n + act + press — green before any commit (~75s)
```

Individual: `npm run assets` / `npm run es5` / `npm run dead` / `npm run i18n` / `npm run act` / `npm run press`.
`tools/pre-commit` runs them as a hook.

Do not silence a failure. Every one of these fires on a real bug that no browser
and no CI runner would show — the checks exist because each of them already shipped once.

## The five rules the gate enforces

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
comes out in plain letters never passed through `t()` and fails the build. It also walks all
30 screens in all 10 languages with fallback-to-English armed — one fallback fails.

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
A name can resolve to a function that throws the moment it runs — `act-check`
calls that button fine. Both fixtures and the half-done screen list live in
`tools/fixture.mjs` so the two walk the same app; add a screen there, not to one
of them.

### 4. Nothing that nothing reaches

Every function declared in `www/` must be named somewhere other than its own
declaration. `dead-check` fails otherwise, and the fix is to delete it — git
remembers, and a reader cannot tell a dead function from a live one.

This is `act-check`'s "no entry no screen names", one step further out. An
orphaned function is not in the action table, so `act-check` cannot see it;
26 of them were sitting in `www/` when this check was written. Deleting one
often turns up another on the next run — its only caller was the one deleted.

### 5. Script load order in `index.html`

- `core.js` defines `defLang()` → precedes the ten language files
- `otf5.js` defines `LinguaFont` → precedes `glyph.js`
- `glyph.js` ends with `installScriptFont()` and `render()` → **goes last**

Also: every `.js` under `www/` must be referenced by `index.html`, and every file
`index.html` references must be **tracked by git** (not merely present on disk).
Adding a script file means adding its tag and `git add`-ing it in the same commit.

## Layout

| file | what it is |
|---|---|
| `www/core.js` | language registry, `t()`, storage |
| `www/act.js` | the action tables and the one delegated listener (`DO`/`AFTER`/`IN`/`CH`/`KD`) |
| `www/act-map.js` | every name a screen may say, bound to the real function |
| `www/boot.js` | where the app starts |
| `www/screens.js` | all 30 views (`vHome`, `vWords`, `vSound`, … — global `v` + capital) |
| `www/settings.js` | settings screens |
| `www/ipa.js`, `reading.js` | spelling → IPA, IPA → per-language respelling |
| `www/phases.js`, `letters.js`, `wsys.js` | phonology, alphabet, writing system |
| `www/otf5.js`, `glyph.js` | on-device OTF font writer and glyph rendering |
| `www/talk.js`, `assist.js`, `sentences.js`, `grammar.js` | the AI (Studio) side |
| `www/voice.js`, `notes.js` | speech, notes |
| `tools/*.mjs` | the checks; `verify-script.mjs`, `lattice-truth.mjs` etc. are font/script experiments |

A new view is found automatically by the checks (they ask the page for globals named
`v` + a capital), so a screen written today is walked today. Nobody adds it to a list.

**A screen is a route AND its argument.** `vSet` with no argument takes none of its
six branches; `vGram` with none shows the list, not a stage. Both walks render each
argument-taking screen once per argument — `walkArg` in `act-check`, `argsOf` in
`i18n-check` — and both ask the page for the list, so a room or stage added later is
walked the day it is added. Do not narrow either one back to the argument-less face:
a screen the mirror never renders is a screen where a hard-coded string sits forever.

Both checks print their coverage (`screens walked: 162`, `screens the mirror
rendered: 270`) because nothing else in a green run would show it shrinking.

## Working on this repo

- `www/screens.js` is 80 KB and `www/settings.js` 42 KB. Grep for the view or function
  and read that range — do not read them whole.
- Run `npm test` after every change, not once at the end. It is fast and it is the spec.
- iOS build and device testing must happen on a Mac with Xcode
  (`npx cap sync ios`); it cannot be done from a Linux session.
