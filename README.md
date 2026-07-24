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

There are three layers, and **only the middle one depends on the reader's language**.

1. **IPA — language-independent.** The symbols are the same everywhere, so anyone sees the same thing.
   That is why it is the core. Duplicate detection (`taken()` / `makeWord()`) compares **IPA**, not the
   approximation, so changing the interface language can never produce two words that sound alike.
2. **The reading approximation — swapped per language (`APPROX` / `LANGS`).** English speakers get a
   **respelling** like `AY-leen` (capitals mark the stressed syllable); Japanese speakers get katakana.
   The default follows the device (`autoLang()`) and can be set by hand. Korean hangul, pinyin, anything
   else: one row in `APPROX` and one in `LANGS`. Every place a reading appears goes through the single
   `rd()` / `rdSyl()` pair, so the moment a language is added it works in the dictionary, the detail
   sheet, the syllable table, linking, sentences and CSV alike.
3. **Interface copy — translated, English first.** Every visible string lives in the `STR` table and is
   fetched with `t()` (or `tn()`, which picks a singular variant for counted strings). `STR.en` is the
   base and the fallback; `STR.ja` is the same key set in Japanese. `UI_LANGS` lists what exists,
   `autoLang()` guesses from the device, and `SET.ui` remembers the choice. Adding a language is one more
   block of keys — nothing else in the app has to change.

   **No Japanese — no language at all — survives in saved data.** Part of speech is stored as the key
   `n` / `v` / `adj` / `x` and turned into a heading by `posLabel()` only at display time (dictionaries
   saved in the old format are migrated to keys on launch). CSV headers are English in every locale, so
   a file written on one device imports cleanly on another.

**Settings has one control, not two.** "Display language" drives the interface *and* the reading
together, because a person who reads the screen in English wants the reading in English too. The IPA
never follows it.

**A known limit:** the phonological engine assumes the Latin alphabet (`VOW='aeiouy'`, `CONS`, and the
digraphs `th` / `sh` / `ch`). Cyrillic or Brahmic spellings can't be fed in directly. Conlangs are
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

### Inside (`www/index.html`)
- `analyze()` … reads the whole dictionary and **actually tallies** syllables, the sound inventory,
  word-final rules per part of speech, and which consonants can begin a word
- `syl()` / `onsetOK()` … splits syllables. A medial consonant cluster hands the next syllable only as
  much as can legally start one, and leaves the rest as the previous coda (`silva` → `sil.va`,
  `ondra` → `on.dra`)
- `kana()` / `resp()` … derives the reading mechanically from the spelling, so nobody has to invent one.
  `kana()` is the Japanese approximation, `resp()` the English respelling
- `APPROX` / `LANGS` / `rd()` / `rdSyl()` / `autoLang()` … the one place the reading approximation is
  swapped per language. One row here adds a language
- `STR` / `t()` / `tn()` / `UI_LANGS` / `SET.ui` … the one place interface copy lives. `STR.en` is the
  base and the fallback; `tn()` handles counted strings
- `POS` / `posLabel()` / `posKey()` … part of speech is saved as `n`/`v`/`adj`/`x` and only the heading
  changes per language. Values saved in the old Japanese form are migrated on launch
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

1. **The web side is a single static HTML file** (`www/index.html`), not Vite/TS. So there is no
   `npm run build` and no "version consistency check (appMeta.ts)" step — just `npm ci` → `npx cap sync ios`.
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

> To change what's on screen, edit `www/index.html` and push a tag the same way.

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
├─ www/index.html                    # the app itself (prototype)
├─ capacitor.config.json             # appId=com.tokinets.lingua / appName=Lingua / webDir=www
├─ package.json / package-lock.json
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

Separately from the App Store build, **the same `www/index.html` can be published on Vercel** so the
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
