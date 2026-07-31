# Lingua

## What this app is for (the north star)

> **An app for people who wanted to build a language and gave up because they didn't know enough.**

Everyone who successfully builds a conlang today already carries some amount of linguistics with them.
But that fact is only the residue of everyone *without* that knowledge quitting. The people who quit are
the real audience.

There are three walls an amateur cannot climb alone:

1. **You don't know how it sounds** → the moment you type a spelling, the **IPA** and a reading are
   derived for you, and it can be spoken aloud
2. **You can't think of enough words** → the app reads the rules out of the words you already have and
   mass-produces new ones that obey them
3. **Linking and other run-together sounds are hard** → it shows you automatically what happens when two
   words meet

### The line that matters most: all of the above is free

Those three things are **not AI. They are plain arithmetic running on the device**: splitting syllables,
tallying word-final rules, deriving spelling→IPA and spelling→reading, resyllabifying across a word
boundary, generating words that obey the inferred rules. No network, no account.
So **you can build an entire language by hand, for free, start to finish**.

AI is not the premise that makes the app work. It is **something laid on top**: talking through a shape
for a meaning, designing grammar together, generating a themed batch of vocabulary. Only that part is Studio.

| Plan | Price | What you get |
|---|---|---|
| Free | ¥0 | Everything you make by hand · automatic rule analysis · automatic readings · linking · rule-obeying generation · 100 words stored on device |
| Plus | $9/mo | Unlimited words · cloud backup · CSV import/export (+ Free) |
| Studio | $19/mo | Build with AI (word shapes, grammar design, example sentences) · vocabulary from a theme (+ Plus) |

### Appearance

**Dark and light, two of them.** Settings → Appearance switches System / Light / Dark; the default is
System. Colour lives only in the two `html[data-theme]` blocks in the CSS, so a new scheme can be added
without touching a single screen.

### How readings are shown (the IPA comes first)

The reading is **IPA at its core**; everything else is an approximation for speakers of one particular
language. Settings → Reading picks **IPA / respelling / both** (both is the default). Inside `/ /`,
a `.` is a syllable break and `ː` is length. A word's detail screen lays out the IPA and the reading
syllable by syllable, and II Sound attaches an IPA symbol to every consonant and vowel in the inventory.

### Multilingual (what depends on a language, and what doesn't)

Lingua ships in **ten interface languages**, and each one carries **its own way of writing the reading**
— not a translated interface wrapped around an English pronunciation.

| | language | the reading is written as | `Aelin` becomes |
|---|---|---|---|
| `en` | English | respelling | `AY-leen` |
| `es` | Español | transcripción figurada | `AE-lin` |
| `pt` | Português | transcrição figurada | `AE-lin` |
| `fr` | Français | transcription figurée | `AÉ-linne` |
| `de` | Deutsch | Lautschreibung | `AJEH-lien` |
| `it` | Italiano | trascrizione figurata | `AE-lin` |
| `ru` | Русский | практическая транскрипция | `А́элин` |
| `zh` | 中文（简体） | 汉字音译 | `艾林` |
| `ko` | 한국어 | 한글 표기 | `아엘린` |
| `ja` | 日本語 | カタカナ | `アエリン` |

Each of those is written the way that language actually writes a foreign name, and each is wrong in its
own honest way. French doubles a coda nasal and hangs a mute `e` off a final consonant so the reader does
not swallow it (`Wyn` → `OUINNE`). German wedges a `j` into a hiatus its orthography would otherwise
hijack and writes prevocalic /s/ as `ss`, because German `s` before a vowel is /z/ (`Silva` → `SSIEL-wa`).
Spanish reaches for `qu`, `c` and `z` where the letter alone would palatalise. Russian is a practical
transcription with a combining acute on the stress. Korean composes real hangul blocks
(`0xAC00 + (initial×21 + medial)×28 + final`). Chinese follows the shape of the 新华社
《世界人名翻译大辞典》 tables — a grid of consonant rows against vowel columns, one character per cell,
with every cluster and every coda but `-n` broken out into a syllable of its own, so the mapping can be
corrected cell by cell.

**Everything a language needs is in one file.** `www/i18n/` holds ten files and nothing else, one per
language, each of them a closure that registers itself with `defLang(code, def)`:

```js
defLang('es', (function(){
  var C1_es = { ... };                 /* the tables this language needs, private to it */
  function syl_es(p){ ... }            /* one {on,nu,co} syllable -> that syllable, written */
  function word_es(ps){ ... }          /* every syllable of one word -> the finished reading */
  return {
    label : "Español",
    rdName: "transcripción figurada",
    all   : "todas",
    pos   : {n:"sustantivo", v:"verbo", adj:"adjetivo", x:"otra"},
    read  : mkApprox(word_es, syl_es),
    str   : { 'ob.start': "Empezar", ... }   /* every string the interface shows */
  };
})());
```

That shape is the whole point of the arrangement. Before it, a single language was scattered across three
distant regions of the file — its string table near the top, its reading engine in the middle, its label
and part-of-speech names near the bottom — and adding a language meant editing three places and silently
shipping if you missed one. Now the closure also means a language's private tables (`C1_es`, `CON_RU`,
`JONG_KO` …) cannot collide with the other nine or be reached from the rest of the app: the only way in is
`defLang()`, the only way out is the object it hands back. `LANG` maps code to definition and `UI_LANGS`
records the order they registered in, so the settings list, `autoLang()` and `t()` all derive from the
same source and cannot disagree.

There are three layers, and **only the middle one depends on the reader's language**.

1. **IPA — language-independent.** The symbols are the same everywhere, so anyone sees the same thing.
   That is why it is the core. Duplicate detection (`taken()` / `makeWord()`) compares **IPA**, not the
   approximation, so changing the interface language can never produce two words that sound alike.
2. **The reading approximation — swapped per language (`LANG[code].read`).** Every one of the ten
   readings is a pair of plain functions over the same `{on, nu, co}` syllable the syllabifier produced:
   `syl_xx(p)` writes one syllable, `word_xx(ps)` joins them and marks the stress its own way (English
   capitalises, Russian accents, Chinese joins with nothing at all). `mkApprox()` wraps that pair once,
   and every place a reading appears in the app goes through the single `rd()` / `rdSyl()` pair — so a
   reading works in the dictionary, the detail sheet, the syllable table, linking, sentences and CSV the
   moment it is registered. `rdIn(code, word)` asks for a reading in a *named* language whatever the
   interface is set to; text-to-speech is the one caller, feeding katakana to a Japanese-only voice.
3. **Interface copy — translated, English first.** Every visible string lives in that language's own
   `str` table and is fetched with `t()` (or `tn()`, which picks the right form for a counted string: a
   `.1` singular in the languages that inflect for one, and a `.few` in Russian for 2–4). `LANG.en.str` is
   the base and the fallback; the other nine hold the identical key set. `UI_LANGS` lists what exists,
   `autoLang()` guesses from the device, and `SET.ui` remembers the choice. The five chapter titles (Words / Sound / Rules /
   Sentences / Make) stay in English everywhere — they are set in a display serif and are part of the book
   design — while the contents rows the reader navigates by are translated.

   **No language at all survives in saved data.** Part of speech is stored as the key `n` / `v` / `adj` /
   `x` and turned into a heading by `posLabel()` only at display time (dictionaries saved in the old
   format are migrated to keys on launch). CSV headers are English in every locale, so a file written on
   one device imports cleanly on another. `render()` also sets `document.documentElement.lang`, which
   picks the right font and line-breaking and lets the stylesheet drop the wide Latin tracking from
   headings in Japanese, Chinese and Korean, where it would only pull the word apart.

**Settings has one control, not two.** "Display language" drives the interface *and* the reading
together, because a person who reads the screen in Korean wants the reading in hangul too. It is a list
rather than a segmented control, and **each row carries the reading it would give the first word in your
own dictionary** — so the choice is made by looking at the result, not by trusting the name of a script.
The IPA never follows it.

### Adding an eleventh language

Copy `www/i18n/xx.js` from whichever existing language behaves most like the new one, and change these
five things inside it. Then add one `<script src="i18n/xx.js">` tag to `www/index.html`, in the position
you want it to hold in the language picker — that tag is the whole of the wiring, and no other file needs
to be touched:

1. the `defLang('xx', …)` code, and the divider comment above it
2. `label` (written in that language), `rdName`, `all`, and the four `pos` names
3. `syl_xx(p)` and `word_xx(ps)`, plus whatever private tables they need. Suffix them `_xx` out of habit,
   though the closure already makes collisions impossible. Stress falls on the first syllable
4. `read: mkApprox(word_xx, syl_xx)`
5. `str`, translated from `LANG.en.str`. Same keys, same `{0}` placeholders, same `<br>` and `&#10;`

Then decide where in the file the block sits: `UI_LANGS` is built in registration order, and that is the
order the settings list shows.

Finally, run the checker:

```bash
node tools/i18n-check.mjs
```

It walks **every screen in every language** — onboarding at every step, every route, under each of
the three plans, each of the three reading modes, with the dictionary both empty and full, plus the
sheets that are not routes — and fails on any of eight things: a key one language is missing or has extra,
a lost `{0}`, a lost `<br>` or `&#10;`, the name *Lingua* translated away, a reading engine that throws or
goes blank on the samples and the awkward edges (`a`, `y`, `str`, `xx`, the empty word), **any string at
all that fell back to English at render time**, any user-facing text hard-coded into a screen file, and
**any text that reaches the screen without passing through `t()` at all**.

The last two checks are the ones that matter, and they catch different things.

`t()` carries a `T_MISS` collector that is `null` in the app and costs nothing; the checker arms it,
renders everything, and insists it comes back empty. A missing translation is otherwise the one bug that
ships silently — the screen still renders, the button still works, and only a person reading that language
ever finds out.

But `T_MISS` can only see text that *asked*. Text written straight into a template never asks, so it never
registers as missing — it simply stays English in all ten languages forever. To catch that, the checker
builds an eleventh language on the fly: English respelled in accented look-alikes, `Not one word yet` →
`Ñøţ øñé ŵøŕđ ýéţ`, with tags, `{0}` slots and the name *Lingua* left alone. It renders every screen in it
and reads the output back. Anything still in plain letters was baked into a template. (Proper nouns and
notation — the tier names, `SOV`, the chapter numerals — are listed as allowed; the list is short and
visible at the top of that check.) This is how the five chapter headings were found: `Words`, `Sound`,
`Rules`, `Sentence` and `Make` were sitting in the templates in English while `toc.words` and its siblings
were translated ten times over and never used.

Two smaller things sit alongside it. The mirror reads `placeholder`, `title`, `alt` and `aria-label` as
well as the text between the tags — a person reads those too, and they are easy to leave in English
because they do not look like copy. And some text never reaches a screen at all: `toast()`, `alert()`,
`confirm()` and `prompt()` speak directly, so no rendering check can see them. The rule for those is read
off the source instead — what they are handed must come from `t()`, never from a quotation mark.

Neither check has a list of screens to keep up to date. Both ask the page which views exist — every global
named `v` plus a capital, and every `open` plus a capital — so a screen written next year is walked the day
it is written. The screens it found are printed on every run; if that line ever gets shorter, coverage
was lost.

### Not having to remember

```bash
npm test                 # ES5, then the same check
npm run es5              # just the ES5 gate over everything under www/
git commit               # runs both, when anything under www/ changed
```

`tools/pre-commit` is the hook; install it once per clone with `git config core.hooksPath tools`.
It only fires when the app itself changed, and
`git commit --no-verify` skips it when landing something deliberately half-done.
`.github/workflows/i18n.yml` runs the same check on every push, so the net holds even on a clone where
nobody installed the hook.

### What the net does not catch

Worth writing down, so silence is never mistaken for safety:

- **Anything outside `www/`.** The iOS side has no localisation at all yet — `CFBundleDisplayName`
  is a single string, there are no `.lproj` folders, and the App Store listing (description, keywords,
  screenshots) is written per-locale in App Store Connect by hand. That is the next piece of work, and
  it is the one this net will never grow into.
- **Whether a translation is any good.** It proves a string exists and is shaped right. It cannot read
  Korean. A machine-translated line that means the wrong thing passes every check here.
- **Right-to-left.** Nothing sets `dir="rtl"`. Arabic or Hebrew would need real layout work, and this
  check would happily pass a screen that renders backwards.
- **Plural systems past one / few.** `tn()` models English and Russian. Arabic has six forms, Polish
  three by a different rule; adding either means extending `tn()` first.
- **A new way of speaking.** The list of speaking functions is maintained by hand. If something new
  starts talking to a person, add it to `SPEAKS` in the checker.
- **`git commit --no-verify`,** and a red CI run that gets merged anyway.

**And a known limit of the engine:** the phonology assumes the Latin alphabet (`VOW='aeiouy'`, `CONS`, and
the digraphs `th` / `sh` / `ch`). Cyrillic or Brahmic spellings can't be fed in directly. Conlangs are
normally written in romanisation, so for now that is an accepted trade-off.

### Voice (built so it still speaks once it's an app)

The Web Speech API works inside WKWebView (i.e. the app once Capacitor has wrapped it). There are exactly
three traps, and all three are handled:

1. **`getVoices()` is empty right after launch** → wait for `voiceschanged` and read it again (`loadVoices()`)
2. **The device has no voice for that language** → `VOICE_PREF` (it→es→pt→fi→ro→id→sw→la→ja→en) picks the
   nearest vowel system automatically; Settings → Voice allows a manual pick (`SET.voice`). On a device
   that only has a Japanese voice, the katakana is spoken rather than the spelling
3. **The hardware silent switch / volume at zero** → stated plainly in Settings → Voice, and `u.onerror`
   raises a toast

As insurance there is a branch that prefers `Capacitor.Plugins.TextToSpeech` when it exists. If Web Speech
turns out silent on a real device, `npm i @capacitor-community/text-to-speech && npx cap sync ios` switches
playback to native in one command — no JS change needed.

### The screens

It opens with onboarding (name → write your own first three words → the rules start to show), and after
that it is **a cover and a table of contents**: I Words / II Sound / III Rules / IV Sentences / V Make,
with settings behind the gear at the top right. There is no starter dictionary. Every word in there is
one the person wrote.

- **I Words** … the dictionary. Tap a word for its detail (IPA, reading, syllable breaks and their sounds,
  meaning, part of speech), with **edit** and **delete**
- **II Sound** … the consonant inventory, the sounds still unused, the vowels (each with IPA), and what
  linking does when two words meet
- **III Rules** … the habits found so far, and what to do next
- **IV Sentences** … **a free workbench with no limit on length or order.** Tap a word in the list below
  to append it; tap a placed word to move it left or right, or remove it. The same word can be placed as
  many times as you like. IPA and reading — linking included — appear as you build, and it can be spoken.
  Word order (SOV / SVO / VSO) is held **not as a constraint but as a rule you chose for yourself**: only
  when the line actually takes a subject-object-verb shape does it **check your work** — "this is SOV" or
  "this differs from the order you chose" (`orderCheck()` / `fixOrder()`). Saved lines also appear on the
  contents page
- **V Make** … mass-produce words that obey the rules

### Why it is more than one file

It was one file for most of its life, and being one file was load-bearing: it is both the Vercel preview
and the Capacitor `webDir`, so there was never a build step to lose. That has not changed — these are
plain `<script src>` tags sharing one global scope, exactly as the single `<script>` did. There is still
no bundler, no transpiler and nothing generated.

What changed is that 465 KB in one file could not be *sent* anywhere — not to a review, not through an
API, not in one piece by anything with a size limit. The largest file now is 40 KB. The font writer also
used to live twice, edited at `tools/font-spike/otf5.js` and copied into `index.html` by a script, so an
edit made in the wrong copy was silently destroyed on the next commit; it lives once now, at
`www/otf5.js`, and the copier is gone.

The load order in `index.html` is the only thing that matters: `core.js` defines `defLang()` so it comes
before the ten languages, `otf5.js` defines the font writer so it comes before `glyph.js`, and `glyph.js`
goes last because the app starts on its final two lines.

Splitting it also widened the ES5 gate. It used to run over the font writer alone, as a side effect of
copying it; `tools/es5-check.mjs` now reads every file under `www/`, which is how the one `Object.assign`
that had been sitting in the storage loader since the beginning finally turned up.

### Inside `www/`
- `analyze()` … reads the whole dictionary and **actually tallies** syllables, the sound inventory,
  word-final rules per part of speech, and which consonants can begin a word
- `syl()` / `onsetOK()` … splits syllables. A medial consonant cluster hands the next syllable only as
  much as can legally start one, and leaves the rest as the previous coda (`silva` → `sil.va`,
  `ondra` → `on.dra`)
- `defLang()` / `LANG` / `UI_LANGS` … `www/core.js`, and the doorway every language comes through. The
  ten files under `www/i18n/` are the only place any language exists — each self-contained, holding its
  label, its part-of-speech names, its reading engine and its whole string table. Adding a language is
  adding a file and a `<script>` tag; there is no second place to forget
- `syl_xx()` / `word_xx()` … the reading inside each language file, derived mechanically from the spelling so
  nobody has to invent one. None of them knows anything about the app — each takes a syllable and
  returns text
- `sylParts()` / `mkApprox()` / `rd()` / `rdSyl()` / `rdIn()` / `autoLang()` … the one place the reading
  approximation is swapped per language, and the one way the app asks for a reading
- `t()` / `tn()` / `strOf()` / `T_MISS` / `SET.ui` … the one place interface copy is fetched.
  `LANG.en.str` is the base and the fallback for all ten; `tn()` handles counted strings, including the
  Russian 2–4 form; `T_MISS` is the collector `tools/i18n-check.mjs` arms to catch a missing translation
- `tools/i18n-check.mjs` … finds the screens by asking the page, walks every one of them in every language
  and fails on eight kinds of translation bug — including text that never passed through `t()` at all.
  `npm test`, and the pre-commit hook and the `i18n` workflow both run it for you
- `POS` / `posLabel()` / `posKey()` … part of speech is saved as `n`/`v`/`adj`/`x` and only the heading
  changes per language. Values saved in the old Japanese form are migrated on launch
- `parts()` … splits a syllable into onset, nucleus and coda, and hands a `y` back to the onset when a
  vowel follows it, so `Yamosh` is /ja.moʃ/ and not /i.a.moʃ/ — in the IPA and in all ten readings alike
- `srcKey()` … search hits on spelling, meaning, reading or IPA alike
- `ipa()` / `ipaSyl()` … derives IPA from the spelling. `.` is a syllable boundary; a doubled vowel becomes `ː`
- `readOut()` / `readLink()` / `readMode()` … the single gate that renders IPA / reading / both according
  to the Reading setting
- `loadVoices()` / `pickVoice()` / `speak()` … everything about voice: waiting for `voiceschanged`,
  language priority, manual selection, feeding katakana to a Japanese voice, and the native-TTS branch
- `linked()` … attaches a final consonant to the next word's onset and resyllabifies — linking made
  visible. Returns both IPA and reading
- `makeWord()` … generates a new word obeying the inferred rules (ending, syllable count, phoneme
  inventory), colliding with no existing spelling or reading
- `findings()` / `nextHint()` … turns the habits found into sentences, and says what to write next for a
  rule to surface
- `vSent()` / `comp[]` / `compAdd()` … the free sentence workbench (any length, repeats allowed,
  reorder, remove)
- `ORDERS` / `orderCheck()` / `fixOrder()` … word order is kept as a rule and used only to check a line
  against it. Lines are saved to `lingua.lines`
- `openWord()` / `saveWord()` / `delWord()` … a single word's detail, edit and delete
- `PLANS` / `has()` / `capOK()` … the plan boundary, in exactly one place
- Earlier versions are kept at `www/_v1-notebook.html.bak` (black × gold) and `www/_v2-paper.html.bak`
  (paper × red)

---

# iOS delivery (based on the JPEL Manager runbook)

This repository follows the wiring in the team's runbook (`appstoredeployguide.md`) as-is.
**Pushing a `build-*` tag makes GitHub Actions (macOS) build with Xcode, sign manually, and upload to
App Store Connect (TestFlight) automatically.** No Mac required.

## Two differences from the runbook

This app's premises differ slightly from JPEL Manager, so exactly two steps were adjusted.

1. **The web side is plain static files** (`www/`), not Vite/TS — no bundler, no transpiler, nothing
   generated. So there is no `npm run build` and no "version consistency check (appMeta.ts)" step —
   just `npm ci` → `npx cap sync ios`.
2. **The Team ID is a GitHub Secret** (the runbook writes it into pbxproj). This keeps the source
   untouched: registering the secret is enough. CI substitutes the `__APPLE_TEAM_ID__` placeholder in
   pbxproj immediately before building.

Everything else (manual .p12 signing / provisioning profile / `apple-actions` / ExportOptions.plist /
`build-*` tag trigger) is exactly as the runbook describes.

## Fixed values for this app (match the Apple side to these)

| Item | Value |
|---|---|
| Bundle ID | **`com.tokinets.lingua`** |
| Provisioning profile name | **`Lingua Distribution`** (please create it under this exact name) |
| App display name | `Lingua` |

The Bundle ID and profile name are **already fixed to these values** in pbxproj / ExportOptions, so no
code editing is needed. Creating them on the Apple side with the same name and ID is all it takes.

---

# What you need to do

## On the Apple side (one time) — runbook STEP 1–6

These are operations on your Apple account, so only you can do them. Work through the runbook's steps
using the fixed values above.

1. **Register the App ID** (STEP 1): Developer → Identifiers → App IDs → App, Bundle ID =
   `com.tokinets.lingua` (Explicit)
2. **Create the App Store Connect record** (STEP 2): My Apps → ＋ → New App, name `Lingua`, the bundle ID
   above, any SKU
3. **API key (.p8)** (STEP 3): Users and Access → Integrations → App Store Connect API → issue with App
   Manager permission → keep the `.p8`, the Issuer ID and the Key ID
4. **Distribution certificate (.p12)** (STEP 4): create an Apple Distribution certificate → export as
   `.p12` (set a password). Without a Mac, the runbook's openssl route is fine
5. **Distribution profile** (STEP 5): Profiles → ＋ → App Store Connect distribution → App ID =
   `com.tokinets.lingua`, certificate = STEP 4, **the name must be `Lingua Distribution`** → download the
   `.mobileprovision`
6. **Team ID** (STEP 6): the 10-character Team ID on the Membership page

## On the GitHub side

### Push the repository
```bash
git init
git add .
git commit -m "Lingua iOS: TestFlight CI"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```
(`node_modules/` is already in .gitignore; CI reinstalls it.)

### Register the Secrets (the runbook's six + Team ID = seven)
Settings → Secrets and variables → Actions → New repository secret:

| Secret | Contents | How to make it |
|---|---|---|
| `DISTRIBUTION_P12_BASE64` | base64 of the distribution .p12 | `base64 -w0 distribution.p12` (on a Mac, `base64 -i distribution.p12 \| pbcopy`) |
| `DISTRIBUTION_P12_PASSWORD` | the .p12 password you set in STEP 4 | as-is |
| `PROVISIONING_PROFILE_BASE64` | base64 of the .mobileprovision | `base64 -w0 Lingua_Distribution.mobileprovision` |
| `APP_STORE_CONNECT_ISSUER_ID` | Issuer ID from STEP 3 | as-is |
| `IOS_KEY_ID` | Key ID from STEP 3 (10 characters) | as-is |
| `IOS_API_KEY` | **the raw contents** of the `.p8` from STEP 3 (do not base64 it) | paste everything from `-----BEGIN...` to `-----END...` |
| `APPLE_TEAM_ID` | Team ID from STEP 6 (10 characters) | as-is |

> ⚠️ The runbook's classic trap, restated: **the certificate and the profile are base64; only
> `IOS_API_KEY` (.p8) stays raw.** Do not swap them.

---

# Shipping (day to day) — runbook STEP 10

Fix the code, then tag and push. CI updates the build number itself — pbxproj needs no manual editing.

```bash
git add -A && git commit -m "build-1"
git tag build-1
git push origin main
git push origin build-1      # ← pushing this build-* tag is what starts CI
```

A few to fifteen minutes later a new build appears in **TestFlight** on App Store Connect. Check it on
your own iPhone through the **TestFlight app**, then "Submit for Review" if it looks right.

After that it's just the next number: `git tag build-2 && git push origin build-2` …

> To change what's on screen, edit the file under `www/` that owns it and push a tag the same way.

---

# A note on review (specific to web-based apps)

Apple guideline **4.2 (minimum functionality)** can reject something that looks like a wrapped website.
Launching and working offline helps (this app runs entirely on the device, so it leans safe), and adding
one native feature — notifications, sharing, export — makes it safer still. Getting rejected, adding a
feature and resubmitting is the normal path. We can reinforce that side when it becomes necessary.

---

# Layout

```
lingua/
├─ www/                              # the app itself — plain scripts, no bundler
│   ├─ index.html                   # the markup, the whole stylesheet, and the load order
│   ├─ core.js                      # storage, plans, theme, phonology, defLang()
│   ├─ i18n/{en,es,pt,fr,de,it,ru,zh,ko,ja}.js   # one interface language each
│   ├─ reading.js                   # IPA, the approximation, the voice
│   ├─ screens.js                   # the shell, onboarding, the cover, words, sounds, rules
│   ├─ sentences.js                 # sentences, and coining words in bulk
│   ├─ settings.js                  # settings, plans, the word sheet, CSV
│   ├─ otf5.js                      # the ES5 OpenType/CFF writer
│   └─ glyph.js                     # drawing your own letters; starts the app on its last two lines
├─ capacitor.config.json             # appId=com.tokinets.lingua / appName=Lingua / webDir=www
├─ package.json / package-lock.json
├─ tools/
│   ├─ es5-check.mjs                # everything under www/ must run in an old WKWebView
│   ├─ i18n-check.mjs               # walks every screen in every language (npm test)
│   ├─ verify-script.mjs            # drives the letter editor the way a person would
│   └─ pre-commit                   # both checks, before each commit; git config core.hooksPath tools
├─ .github/workflows/i18n.yml        # the same check, on every push
├─ .github/workflows/ios-deploy.yml  # triggered by a build-* tag (based on runbook STEP 9)
└─ ios/                              # Xcode project generated by Capacitor (CocoaPods)
    └─ App/
        ├─ App.xcworkspace           # ← this is what CI builds
        ├─ Podfile
        └─ App.xcodeproj             # Release = manual signing (Apple Distribution / Lingua Distribution)
```

## Common changes
- **Display name**: `CFBundleDisplayName` in `ios/App/App/Info.plist`
- **Store version**: `MARKETING_VERSION` in `project.pbxproj` (e.g. 1.0.0 → 1.0.1). The build number
  (`CURRENT_PROJECT_VERSION`) is updated by CI
- **Changing the Bundle ID**: keep `appId` in `capacitor.config.json`, `PRODUCT_BUNDLE_IDENTIFIER` in
  pbxproj and the Bundle ID key in the workflow's ExportOptions in sync (and create the same ID on the
  Apple side)

## If signing gets stuck
See the runbook's "common traps" section. Above all, verify by pointing at each one that the **Bundle ID,
the profile name `Lingua Distribution` and the Team ID match exactly**. If you see
`does not support provisioning profiles`, check whether signing arguments are being passed to xcodebuild
(i.e. whether pbxproj already holds them).

---

# Web preview (Vercel) — for touching it on a phone during development

Separately from the App Store build, **the same `www/` can be published on Vercel** so the
latest version is always reachable on a phone (no review, no certificates, no Mac).

- `vercel.json` at the repository root makes Vercel serve `www/` with **zero extra configuration**
  (it is copied to `public/` and published statically).
- Import this GitHub repository into Vercel → add `lingua.tokinets.com` as a domain. That's all.
- After that, **every push to main deploys to production automatically**. iOS builds only happen on a
  `build-*` tag, so it splits cleanly: **an ordinary push updates the web, a tag ships the app**.
- Words and the language name are stored **on the device (localStorage)**, so a reload doesn't lose them.

## Go-live once you're home (five minutes with a PC)
1. Push this repository to GitHub (`git push`; your usual saved login is fine)
2. Vercel → Add New → Project → import this repository (default settings are fine; `vercel.json` handles it)
3. Vercel → Project → Settings → Domains → add `lingua.tokinets.com`
4. Confirm it's live — from then on every push updates it automatically
