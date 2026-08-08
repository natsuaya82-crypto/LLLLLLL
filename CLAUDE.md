# Lingua

A conlang-building app. Plain HTML/CSS/JS under `www/`, wrapped by Capacitor for iOS
(`ios/`, appId `com.tokinets.lingua`, webDir `www`).

**There is no build step and no bundler.** `www/index.html` loads every `.js` with a
`<script src>` tag. What is in the repo is what runs on the phone.

## The gate

```
npm test        # assets + es5 + dead + migrate + i18n + import + sides + act + press
                # green before a commit (~90s)
```

Individual: `npm run assets` / `npm run es5` / `npm run dead` / `npm run migrate` /
`npm run i18n` / `npm run import` / `npm run sides` / `npm run act` / `npm run press`.
`tools/pre-commit` runs the ones that need no browser (assets, es5, dead, import, sides —
about two seconds) plus i18n when a screen file changed. It is not the whole gate: run
`npm test` yourself.

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

## The nine rules the gate enforces

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
nothing could check against the first. There are 26 routes.

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

### 6. A language somebody already has still opens

Storage is per language. Ten slices — words, lines, name, script, letters,
notes, phases, talk, sounds, keyboard — live under `lingua.<id>.<slice>`; `lingua.langs` says
which languages are here and whose; `lingua.set` is the person's settings and
belongs to no language. `langKey('words')` is the only thing that knows how a
language is filed.

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

## What the free plan is

One sentence: **your own shapes for a-z.** `ltStart` puts twenty-eight letters
there the moment a free language exists — a to z, `!` and `?` — and nothing on
the free plan adds one, deletes one or renames one. Drawing on them is the
whole of it.

That is not a restriction bolted onto the app; it is what makes the rest of the
free plan possible. Because the twenty-eight are exactly a-z and their names
cannot change, the keyboard can be a **QWERTY with the drawn letters
substituted in** — `kbFixed()`, built from `LETTERS` every time it is shown,
stored nowhere, with no editor and nothing to set.
「キーボードもqwerty配列がそのまま自作文字に置き換わるだけ。なんの設定もできない」
Rename one letter and the key it answers to is gone, which is why the name
field is not on the free letter page rather than merely being discouraged.

Four places say it, and they say four different things:

| where | what it says |
|---|---|
| `ltStart` in `letters.js` | free languages get the twenty-eight slots, topped up by name |
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
(`spPageHTML()`), the spelling row (`spRowHTML()`), an example sentence
(`exRowHTML()`), and where the thumb is (`geXY()`).

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

## Names

A function's prefix says which part of the app it belongs to, and it must be
telling the truth. The prefix is how 500-odd globals in one namespace stay
findable — `st*` grammar stages, `ob*` onboarding, `ge*` the glyph editor,
`tk*` talk, `lt*` letters, `wd*` the word sheet, `add*` the new-word sheet,
`wld*` the world, `w*` word data, `words*` the word list, `nt*` the notebook,
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
| `www/keyboard.js` | the keyboard, which the language owns and the person builds (ch 22) |
| `www/card.js` | the card — one line as a picture that can leave the phone (ch 15) |
| `www/sns.js` | the timeline, the search and the notices (ch 16) |
| `www/import.js` | bringing somebody's existing list in (ch 17) |
| `www/numbers.js` | numbers — a digit is a letter with a value (ch 18) |
| `www/post.js` | a post, and the line the two sides do not cross (ch 19) |
| `www/me.js` | who you are: the face, the name, the handle, the line about yourself (ch 20) |
| `www/net.js` | the one window onto the server, and the only place a secret could be (ch 21) |
| `www/ipa.js`, `reading.js` | spelling → IPA, IPA → per-language respelling |
| `www/phases.js`, `letters.js`, `wsys.js` | phonology, alphabet, writing system |
| `www/otf5.js`, `glyph.js` | on-device OTF font writer and glyph rendering |
| `www/talk.js`, `assist.js`, `grammar.js` | the AI (Studio) side |
| `www/voice.js`, `notes.js` | speech, notes |
| `supabase/schema.sql` | what the server holds and who may touch it — held by `npm run rls` |
| `supabase/mail.md` | how the confirmation mail gets sent. Dashboard fields and DNS records, so there is nowhere else it can live |
| `tools/*.mjs` | the checks; `verify-script.mjs`, `lattice-truth.mjs` etc. are font/script experiments |

A new view is found automatically by the checks (they ask the page for globals named
`v` + a capital), so a screen written today is walked today. Nobody adds it to a list.

**A screen is a route AND its argument.** `vSet` with no argument takes none of its
six branches; `vGram` with none shows the list, not a stage. Both walks render each
argument-taking screen once per argument — `walkArg` in `act-check`, `argsOf` in
`i18n-check` — and both ask the page for the list, so a room or stage added later is
walked the day it is added. Do not narrow either one back to the argument-less face:
a screen the mirror never renders is a screen where a hard-coded string sits forever.

Both checks print their coverage (`screens walked: 224`, `screens the mirror
rendered: 324`) because nothing else in a green run would show it shrinking.
`press` prints `buttons pressed: 5172` for the same reason — and it is what a
change that is meant to alter nothing has to leave untouched. The pressed
count jumped from 2952 the day the free plan got its twenty-eight letters:
every screen holding a keyboard went from a handful of keys to a QWERTY. A
number moving is only ever a question — what changed — and the answer has to
be a change somebody made on purpose.

## Working on this repo

- The book is numbered: chapter 0 opens `core.js`, chapter 22 closes `keyboard.js`, and
  a `/* ==== n. title ==== */` banner opens each. One chapter per file — a file that
  grew to hold five was split along those banners, not along anything new. The
  numbering has gaps where a chapter was closed; it is a shelf, not a count.
- `www/glyph.js` is 73 KB (the font writer and the drawing surface). Grep for
  the function and read that range rather than the whole file.
- Run `npm test` after every change, not once at the end. It is fast and it is the spec.
- Screenshots: `node tools/shot.mjs feed profile` / `--all` / `--dark` / `--lang ja`.
  Not a gate — it is how a change to a screen gets looked at instead of read as a
  diff of string concatenation. A refactor that is meant to change nothing can be
  held to it: shoot every screen before and after and compare. Expect noise —
  the same code twice does not give the same bytes, so compare against that
  floor rather than against zero.
- iOS build and device testing must happen on a Mac with Xcode
  (`npx cap sync ios`); it cannot be done from a Linux session. **Do not trigger
  a build without being asked.**
