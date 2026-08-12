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
| Keyboard: flick, four directions per key | shipped | — | `kb` | slice `kb` | decided |
| Keyboard: any letter on any key, any position, rows and layers | shipped | — | `kb` | slice `kb` | decided |
| Font built on the device (OTF) | shipped | yes | — | none (derived) | decided |
| Import a word list | shipped | paste | `file`: a file | slice `words` | decided |
| Export CSV | shipped | — | `data` | none | decided |
| Backup to Documents | shipped | **yes, on every plan** | — | the file | decided |
| Restore from Documents | shipped | **yes, on every plan** | — | fills in what is missing | decided |
| One language per person | shipped | 1 | 1 | `LANG_MAX` | decided |
| AI word suggestions | shipped | 3/day | see note | none | decided — **the code does not match it yet** |
| AI chat | shipped | — | a few a day at Plus; unmetered is not a Plus feature | slice `talk` | decided — **how many a day is still open** |
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
| Cloud storage of a language | **planned** | no | yes, deferred | every slice | decided — deferred until Supabase $25 is worth paying |
| An image on a post | **planned** | ? | ? | new, frozen on the post | decided that it happens; free/paid and storage **open** |
| Drawn letters placed on that image | **planned** | ? | ? | new, frozen on the post | decided that it happens; free/paid **open** |
| Vertical / right-to-left posts | **planned** | ? | Plus | new: direction frozen on the post | decided that it happens; per-language or per-post **open** |
| A post shown three ways | **planned** | layers 1 and 2; layer 3 three times | layer 3 unlimited | layers 1 and 2 frozen on the post; layer 3 computed now | decided; **blocked on a server-side translator** |
| Post translated into other natural languages at write time | **planned** | yes | yes | new, frozen on the post, one per language | decided; **blocked — needs a hosted service and a key that cannot live on the phone** |
| Posts on the server | **planned** | ? | ? | new: server rows | **open** — the tables exist in `schema.sql` and nothing reads them |
| Explore | **planned** | ? | ? | ? | **open** — the tab is a placeholder |
| Notices | **planned** | ? | ? | ? | **open** — the tab is a placeholder |
| Following, quoting | **planned** | ? | ? | new: server rows | **open** |

### Notes on the open rows

**A post shown three ways.** This is what "translation" means here:

```
  1  the writer's own letters      post.ln + post.ink      already on the post
  2  what it means, in a natural   post.mn                 already on the post
     language, typed and
     confirmed by the writer
  3  the same thing rendered in    computed from MY         NOT BUILT
     THIS reader's own conlang     dictionary, now
```

It does not collide with the decision at the head of `www/post.js` — it runs
the other way. What is forbidden there is a machine *reading* an invented
language and telling everybody what it says, because the only person who could
catch it wrong never sees the result. Layer 3 starts from a natural sentence
the writer already confirmed and re-expresses it in **the reader's own**
language, with the reader's own dictionary. The guessing is about your own
words, and you are the one who can see it is wrong.

The three split cleanly along `docs/DATA_MODEL.md` § the three kinds, and the
third goes the opposite way from the other two **on purpose**:

```
  1  frozen    the writer's shapes. Must not move
  2  frozen    the writer's meaning. Must not move
  3  current   the reader's language. SHOULD move — a sentence that
               half-rendered yesterday renders fully today, because the
               dictionary grew. Freezing this one would be the bug
```

Missing: a lookup from a meaning to one of my words. Word order (`SET.order`,
six of them) and the grammar stages already exist.

Decided since:

```
  layer 2   translated WHEN WRITTEN, not when read, and carried on the post.
            Japanese in, English out for an English reader. Always on screen
  layer 3   Plus. Free gets three. Appears on a button, not by default
  a word    the reader has no word for stays in the natural language and is
            shown IN RED, so the gap is obvious — and it is also the door to
            making that word
```

Still open, and two of them block the work:

- **there is no hosted model.** `AI_SEAM` is a marked seam; everything the app
  calls AI today is a local generator that runs offline and costs nothing
- **the key cannot live on the phone.** Post-time translation needs a
  server-side function holding it, which is server work in the same category
  as cloud sync, and it costs money per post
- which languages a post carries (ten is ten calls and ten copies on the post)
- what happens when translation fails, or the phone is offline when posting —
  **the post must still go out**
- whether a post published without translations can gain them afterwards
- whether free's three are per day, and whether they share the existing
  `AI_FREE_DAILY` counter — sharing it means asking for a spelling suggestion
  spends a translation

Layer 3 itself is dictionary lookup: it costs nothing, runs offline, and its
limit of three is a product decision rather than a cost one. That is a fine
thing for it to be; it is only worth writing down so nobody later "fixes" it
by removing a limit that looks arbitrary.

**Images.** An image and the letters placed on it are past-tense data the
moment the post exists, so both freeze onto the post exactly as `ink` does.
They also make a post large: `docs/DATA_SAFETY.md` measured a whole free
language at ~25 KB, and one photo is bigger than that. Where the bytes live is
part of the decision.

**Direction.** Which way a line runs must travel ON the post for the same
reason its shapes do — otherwise a vertical language read on a horizontal
phone comes out horizontal, which is the card bug in another costume.

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
