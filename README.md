# Lingua

An app for making a language: its letters, drawn by hand; its dictionary; its
grammar; a keyboard to type it on; and a timeline where it is written to other
people who are making theirs. iOS, through Capacitor (`ios/`, appId
`com.tokinets.lingua`, webDir `www`).

**Read `CLAUDE.md` before changing anything, and `docs/STATE.md` before deciding
anything is missing.** The first says how the code has to be written; the
second says what has been built. This page only says what the repository is
and where the rest of it lives.

## What the app is

- **Letters.** A language starts with its slots — a to z, `!`, `?`, and a digit
  for every value its base has (`ltSlotsFill()` in `www/letters.js`) — and the
  person draws a shape for each. The drawn letters become a font on the phone
  (`www/otf5.js`, `www/glyph.js`), and the app is set in it until somebody
  turns that off.
- **The dictionary, the sounds, the grammar.** Words with their readings (IPA
  first, then a respelling for the reader's own language), a grammar book of
  chapters, examples, notes and a calendar — each a chapter file under `www/`.
- **The keyboard.** An iOS keyboard extension (`ios/App/LinguaKeyboard/`) that
  types the language in its own letters. The free plan's is a QWERTY with the
  drawn letters on it; a paid plan builds its own.
- **The timeline.** Posts, replies, reactions, follows, a daily prompt and
  notices. A post carries its own ink — the shapes of its letters — so it
  reads right on a phone that has never seen that language.
- **An account.** Everything is the account's and lives on the server
  (Supabase: `supabase/schema.sql`); the phone keeps a read-only copy to look at
  with no signal. The onboarding is the one walk before the sign-in, and the
  sign-in is its last step.
- **Plans.** Free, Plus and Pro. What each opens is `CAN` in `www/core.js`, and
  what money may never touch is `docs/PAID_FEATURES.md`. A plan decides what a
  person may do, never what exists.
- **Ten interface languages**, `www/i18n/{en,es,pt,fr,de,it,ru,zh,ko,ja}.js`,
  every visible string through `t()`.

## What the code is

Plain HTML, CSS and ES5 JavaScript under `www/`. **There is no build step and no
bundler**: `www/index.html` loads every script with a `<script src>` tag, and
what is in the repository is what runs on the phone. `CLAUDE.md` § Layout says
what each file is.

```
npm test        # the gate: every check in tools/gate.mjs; its last line says how many
npm run rls     # supabase/schema.sql against a real PostgreSQL, as somebody who is not you
node tools/shot.mjs --lang ja <screen>   # a screenshot of a screen
```

`package.json` lists every check by name. `docs/TESTING.md` says which to run
when.

## Shipping

Pushing a `build-*` tag runs `.github/workflows/ios-deploy.yml` on a macOS
runner: it syncs `www/` into the Xcode project, signs, and uploads to App Store
Connect. The version is `"version"` in `package.json`, in one place; the build
number is the workflow's. Every secret it needs is named in the workflow, and
what has to be done on Apple's side — certificates, profiles, the
subscriptions, notifications, TestFlight — is `docs/apple.md`. The Supabase
side is `supabase/setup.md`.

**A build is triggered only when the owner says so** (`CLAUDE.md` § The gate).

`vercel.json` publishes the same `www/` as static files, for looking at a screen
in a browser.
