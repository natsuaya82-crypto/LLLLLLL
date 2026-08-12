# Feature registry

Every feature this app has or is going to have, what plan it is on, whether it
touches data, and whether the owner has decided its shape.

**This is not a list of what is in the code.** `docs/STATE.md` is that. This is
a list of what the app *is* — so that a session about to build something can
find out whether it has already been decided, and stop rather than invent.

Read this before implementing anything. If a feature is not here, it has not
been decided, and deciding it is not yours to do (`docs/FEATURE_RULES.md` §
what is the owner's).

## Status

```
  planned       decided, not started
  in progress   being built now
  shipped       in the app and working
  deprecated    was in the app, deliberately removed — see the row's note
```

Marked separately, because they are not the same question:

```
  Owner decision   decided   the owner has said what this is
                   open      nobody has decided; do not guess
                   partial   some of it decided, the rest open
```

## The making side

| Feature | Status | Free | Paid | Data | Owner decision |
|---|---|---|---|---|---|
| Custom alphabet — draw a-z, `!`, `?`, digits | shipped | 38 slots, drawing only | `letters`: add / rename / delete | slice `letters` | decided |
| Dictionary | shipped | to 100 words | `words`: past 100 | slice `words` | decided |
| A word's meanings, part of speech, family | shipped | yes | — | slice `words` | decided |
| A word's synonyms, opposites, examples, note | shipped | yes | — | slice `words` | decided |
| A word's register, fields, origin, changed-on | shipped | yes | — | slice `words` | decided |
| One screen for making and editing a word | shipped | yes | — | none | decided |
| A word is read before it is edited | shipped | yes | — | none | decided |
| Sound inventory, per letter | shipped | letter's own reading only | `snd`: choose a different one | slice `snd` | decided |
| Writing system | shipped | alphabet only | `wsys`: syllabary, abjad, abugida, logography | `SET.wsys`, slice `script` | decided |
| Grammar stages | shipped | the fifteen there are | `gram`: your own | slice `phases` | decided |
| Notebook | shipped | yes | — | slice `notes` | decided |
| Numbers — a digit is a letter with a value | shipped | yes | — | slice `letters` | decided |
| What the language is for (the world) | shipped | yes | — | slice `wld` | decided |
| Keyboard layout built in the app | shipped | fixed QWERTY, nothing to set | `kb`: your own | slice `kb` | decided |
| Font built on the device (OTF) | shipped | yes | — | none (derived) | decided |
| Import a word list | shipped | paste | `file`: a file | slice `words` | decided |
| Export CSV | shipped | — | `data` | none | decided |
| Backup to Documents | shipped | **yes, on every plan** | — | the file | decided |
| Restore from Documents | shipped | **yes, on every plan** | — | fills in what is missing | decided |
| One language per person | shipped | 1 | 1 | `LANG_MAX` | decided |
| AI word suggestions | shipped | 3/day | `ai` unmetered at Plus, `sug` at Studio | none | **partial** — the two levels are the same ceiling and disagree; a price, so the owner's |
| AI conversation (Studio side) | shipped | — | `ai` | slice `talk` | decided |

## The reading side

| Feature | Status | Free | Paid | Data | Owner decision |
|---|---|---|---|---|---|
| Writing a post | shipped | yes | — | `lingua.posts`, ink frozen on write | decided |
| Timeline, on this phone | shipped | yes | — | `lingua.posts` | decided |
| A post carries its own shapes (`ink`) | shipped | yes | — | on the post | decided |
| A card — one line as a picture | shipped | yes | — | none | decided |
| A card of a post is drawn from the post | shipped | yes | — | none | decided |
| Accounts — sign up, in, out, verify, reset | shipped | yes | — | `lingua.sess` (tokens only) | decided |
| Profile — face, name, handle, bio | shipped | yes | — | `lingua.me` | decided |
| Posts on the server | **planned** | ? | ? | new: server rows | **open** — the tables exist in `schema.sql` and nothing reads them |
| Explore | **planned** | ? | ? | ? | **open** — the tab is a placeholder |
| Notices | **planned** | ? | ? | ? | **open** — the tab is a placeholder |
| Following, quoting | **planned** | ? | ? | new: server rows | **open** |

## The native side

| Feature | Status | Free | Paid | Data | Owner decision |
|---|---|---|---|---|---|
| System keyboard extension (iOS) | shipped | yes | — | App Group | decided |
| Hand-over app → keyboard | shipped | yes | — | App Group | decided |
| Purchases (StoreKit) | **planned** | — | — | none | **open** — no code exists; `SET.plan` is set by hand |
| Android | **planned** | — | — | — | **open** — one repo with `android/` beside `ios/`, nothing started |

## Closed on purpose

Not gaps. Both are in git if the argument turns out to be wrong.

| Feature | Status | Why |
|---|---|---|
| A page for the sound inventory | deprecated | the sound belongs to the letter; it is a sheet opened from the letter now |
| "Make" — generate eight candidate words | deprecated | its only door was a button that did not work; deleting the button would have left an unreachable screen |
| In-app keyboard for typing | deprecated | a keyboard belongs on the phone, not in one app. The editor that *builds* one stayed |

## When something changes here

A row changes only after the owner has decided. Adding a row is not a way of
deciding something — an **open** row stays open until there is a Decision entry
in `docs/FEATURE_RULES.md` to point at.

The order is in `docs/FEATURE_RULES.md` § the order:

```
  idea → owner decision → FEATURES.md → the docs that apply
       → implementation → tests → device → owner confirmation → merge
```
