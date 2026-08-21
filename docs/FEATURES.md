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
| Dictionary | shipped | to 100 words; a lapsed plan **lists** the first 100 and keeps every one | `words`: past 100 | slice `words` | decided |
| A word's meanings, part of speech, family | shipped | yes | — | slice `words` | decided |
| A word's synonyms, opposites, examples, note | shipped | yes | — | slice `words` | decided |
| A word's register, fields, origin, changed-on | shipped | yes | — | slice `words` | decided |
| What a derived word is of its parent (活用 / 派生, and your own labels) | shipped | yes | — | slice `words` (`fm`) | decided |
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
| Word suggestions | **lifted** | — | — | none | the chips and their daily three went out with Studio; `makeWord()` in `www/reading.js` stays and is used everywhere else |
| The conversation — the last chapter | **lifted** | — | — | slice `talk` kept | out until the hosted model is in. See the note on `PLANS` in `www/core.js` |
| Forms made by a rule | shipped | yes | yes | `STG.fm` | decided — a rule offers, it does not declare. Nothing is made until asked, and what comes out is an ordinary word |
| A word shares as a page from a dictionary | shipped | yes | yes | none | decided — 1080×1350, senses numbered, the family, an example, the origin |

## The reading side

| Feature | Status | Free | Paid | Data | Owner decision |
|---|---|---|---|---|---|
| Writing a post | shipped | yes | — | `lingua.posts`, ink frozen on write | decided |
| One language, on every plan | shipped | yes | — | `lingua.langs` | decided — there is no way to make a second anywhere in the app, so it is not a price. `LANG_MAX` used to say so in `core.js` and fed a line of text on the language list; the line went with the ban on explaining things on a screen, and the constant went with it. Languages somebody else wrote are not counted: reading one is not making one |
| Timeline, on this phone | shipped, **not device confirmed** | yes | — | `lingua.posts` | decided — **an account is required to read it and to post**. 「なんでログインしてないアカウントで投稿できんの？」 The making side needs none |
| Timeline split — For you / Following | shipped, **not device confirmed** | yes | — | none new; `ME.fo` is the follow list already | decided — 「フォロー中とおススメみたいに分けたい」. For you is everything, Following is `ME.fo` plus your own, matched on the post's frozen `hd` |
| A post carries its own shapes (`ink`) | shipped | yes | — | on the post | decided |
| Replying, and the thread of a conversation | shipped, **not device confirmed** | yes | — | `post.to` (the id, already there), `post.toh` **new** — the handle it answers, frozen on write | decided — replies stay in the timeline carrying 「@xx への返信」; a post opens onto its thread; the indent stops at three |
| A card — one line as a picture | shipped | yes | — | none | decided |
| A card of a post is drawn from the post | shipped | yes | — | none | decided |
| Accounts — sign up, in, out, verify, reset | shipped | yes | — | `lingua.sess` (tokens only) | decided |
| Profile — face, name, handle, bio, **and your posts** | shipped | yes | — | `lingua.me` | decided |
| Pin a post to your profile | shipped | yes | — | `post.pin`, one at a time | decided |
| Share a post — the card | shipped | yes | — | none | decided |
| Cloud storage of a language | **planned** | no | yes, deferred | every slice | decided — deferred until Supabase $25 is worth paying |
| A photograph on a post | shipped | **yes** | yes | `post.pic`, frozen on the post, 900px q0.72, `POST_BYTES` ceiling | decided |
| How big a photograph is shown, and opening one | shipped, **not device confirmed** | yes | yes | none — display only; `--picpct` in index.html, route `photo` | decided — one box for every photograph (a third of the screen's width, square), filled with `cover` so the picture is never stretched and the edges are off it, tap opens the whole thing 「xと同じって言ってるやんずっと」 |
| How hard a photograph is squeezed to store | shipped | 900px long edge, q0.72 | same | `POST_PIC`, `POST_PICQ`; ratio untouched | **open** — 「画質が下がるのはありえない」 against one photograph being 87 KB of the same localStorage the language lives in |
| Drawn letters placed on that image | shipped | **yes** | yes | none new — baked into `post.pic` when it is sent | decided |
| Your voice on a post — 30 seconds | shipped, **not device confirmed** | **yes** | yes | `post.vo = {f, ms}`; the bytes are a file in `Documents/Voices/`, never in `localStorage` | decided — 「30秒くらい」「ファイルに出す」「録音まで作る」 |
| Editing your own post | shipped | yes | — | overwrites `ln`, `ink`, `mn`, `tr` on that post; `post.ed` is new | decided — the line and the meaning only 「文と意味だけ」, and it says `Edited` |
| Which way a language is written | shipped | **reading, always** | `dir`: choosing one | `SCRIPT.dir` in the `script` slice; frozen on the post as `post.dir` | decided |
| A post shown three ways | shipped | layers 1 and 2; layer 3 three a day | `tr`: layer 3 unlimited | layers 1 and 2 frozen on the post; layer 3 computed now | decided |
| Post translated into natural languages at write time | **in progress** | yes | yes | `post.tr`, frozen on the post | decided — the seam is in (`postTr`, TR_SEAM); the translator is the reader's own device AI and is not wired up |
| Posts on the server | shipped, **not device confirmed** | yes | — | `post` rows | done — `netPush`/`netFeed`/`postCatchUp`. An account is required to read the timeline or post to it (decision 2026-08-18) |
| Explore | shipped, **not device confirmed** | yes | — | — | done — people while you type, posts when you press Search; both ask the server (`netFindWho`/`netFindPosts`) |
| Notices | shipped, **not device confirmed** | yes | — | — | done — `netNotices`, an RPC in `schema.sql` |
| Following | shipped, **not device confirmed** | yes | — | `follow` rows, `ME.fo` | done — `netFollow`, and Follow is on a person's row in the search |
| Quoting | **planned** | ? | ? | `quote` rows | **open** — the table exists in `schema.sql` and nothing reads it |

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
- whether free's three are per day. There is no counter to share any more:
  `AI_FREE_DAILY` went out with Studio, and `TR_FREE_DAILY` in `www/post.js`
  is layer three's own

Layer 3 itself is dictionary lookup: it costs nothing, runs offline, and its
limit of three is a product decision rather than a cost one. That is a fine
thing for it to be; it is only worth writing down so nobody later "fixes" it
by removing a limit that looks arbitrary.

**Images.** An image and the letters placed on it are past-tense data the
moment the post exists, so both freeze onto the post exactly as `ink` does.
They also make a post large: `docs/DATA_SAFETY.md` measured a whole free
language at ~25 KB, and one photo is bigger than that. Where the bytes live is
part of the decision.

**Direction.** Which way a line runs travels ON the post for the same reason
its shapes do — otherwise a vertical language read on a horizontal phone comes
out horizontal, which is the card bug in another costume. Four directions:
`ltr`, `rtl`, `ttb-rl`, `ttb-lr`. Reading one is free on every plan; choosing
one is `dir`, at Plus.

The card is the one place that does not do all four. It is a landscape
composition — a band of letters across the middle of 1920×1080 — so a column
of them has nowhere to go. A card of a vertical post sets the line **across**,
in the direction the columns run, which is what a horizontal banner of a
vertically-written language is. It is a compromise and it is written down in
`docs/BACKLOG.md` rather than left to be discovered.

## The native side

| Feature | Status | Free | Paid | Data | Owner decision |
|---|---|---|---|---|---|
| System keyboard extension (iOS) | shipped | yes | — | App Group | decided |
| Hand-over app → keyboard | shipped | yes | — | App Group | decided |
| Purchases (StoreKit) | **planned** | — | — | Keychain | **open** — no code exists; the plan is set by hand |
| Android | **planned** | — | — | — | **open** — one repo with `android/` beside `ios/`, nothing started |

## What is left to do online

Everything on this list needs the server. Nothing on it is started unless it
says so. It is one list because 「必要なものは全部オンラインまとめてやる」 and
because the way a server feature gets lost is by being half-written down.

**Already online, so that this list is read against something:** accounts and
the profile, posts (write, read, reply, delete), likes and boosts, following,
notices, photographs and voice in Storage, search — people and posts — and
deleting an account.

### 1. The plan, on the server — the one with money on it

The plan is in the Keychain now — `ios/App/App/LinguaPlan.swift`, read before
the web view loads and injected as `window.__plan` — because `localStorage` is
a file inside the app and that file is in the backup a phone makes onto a PC,
where free tools and no jailbreak turn `free` into `plus`. That door is shut.
The one behind it is not: on a jailbroken phone the app's own JavaScript can be
edited and the question never gets asked. **So anybody determined enough can
still set themselves to Plus**, and the server would not know: `schema.sql` has
no plan column and no plan check; `is_member()` asks whether somebody is signed
in and nothing else.

Today that costs nothing but the sale — everything a plan opens runs on the
phone (`assist.js`, `grammar.js`, `reading.js` make no network call), and there
is no cloud storage. **The day money is taken that stops being true**, so:

1. the StoreKit receipt is verified **server-side**, not by the app
2. the plan lives on the account, in `profile` or beside it
3. anything that costs us money is refused **by the server**
4. `CAN` stays what it is: which buttons to show. It is not a security check
   and must never be relied on as one

Decided so far: the four products and their prices (2026-08-14), and that
StoreKit is not to be written yet.

### 2. Cloud storage of a language — Plus

Every slice, for a person who is paying. Decided and deferred: the Supabase
tier it needs is not worth paying for yet. `bkPack()` already produces exactly
the thing that would be uploaded.

### 3. Publishing a language — `language`, `publication`

Both tables exist with row level security written and held by `npm run rls`,
and **nothing in the app reads or writes either**. The profile has a language
page with a public/private switch and it is local. This is what makes the
switch mean anything, and what puts a language name on somebody found by
searching.

### 4. Publishing and downloading — a keyboard, an alphabet, a dictionary

Decided 2026-08-19 and **not started**. The author decides what is public, per
thing. Downloading a keyboard or an alphabet is **free**; downloading a
dictionary is **Plus**. Making and publishing stays Plus. A downloaded
keyboard goes on its own shelf, up to three, beside the three somebody built.
A downloaded dictionary is a language you can READ and is never merged into
your own — `FREE_LIMIT` counts your own words and nothing else.

Half of it exists: `shareKbd()` already produces a keyboard with the shapes
cut onto its keys, needing no alphabet and no dictionary on the other side.
That is what a download has to be, and it is the same argument rule 8 makes
about a post.

A downloaded keyboard is edited as it stands — the download is the copy. What
cannot be mixed is the alphabet: the letters that go on its keys are the
downloader's own.

### 5. Quoting — `quote`

A word of somebody else's post taken into your own language. The table exists
and nothing reads it.

### 6. The day's sentence — `prompt`

One a day, and `post.prompt` already points at it. The table exists and
nothing reads it.

### 7. Taking a post down

Blocking and reporting are **done** (2026-08-19): `block` and `report` in
`schema.sql`, the ⋯ on every post, and the timeline asking the server to leave
blocked authors out.

What is left is the other half — **somebody has to read the reports and be
able to take a post down.** There is no dashboard view and no way to remove
somebody else's post; `post_drop` is the author's alone. Until that exists a
report is written and nobody looks at it, which App Store review will ask
about.

### 8. Deleting an account, on the server — **done** (2026-08-21)

`netDropMe()` in `www/net.js`, from a button in Settings under signing out.
It asks the server which posts are mine, deletes their pictures and voice from
Storage **first** — bytes in a bucket have no foreign key and no cascade
reaches them — and then calls `account_delete()`, which was already in
`schema.sql` and reaches `auth.users`. Everything else goes behind it by
cascade: the profile, the languages, the posts, the follows, the blocks.

**Reports do not go.** `report.actor` was `not null ... on delete cascade`
until there was a deletion to fire it, which meant deleting your own account
withdrew every report you had ever made — somebody else's record, cleared by
your leaving. It is `on delete set null` now, and `npm run rls` holds it.

**The language on the phone is not touched.** Erasing the phone is the other
button and now says which it is; it used to be called "delete account" because
nothing in the app could reach the server, and that reason is gone.

### 9. Push notifications

Nothing exists. The notices tab is pulled when it is looked at.

**Not on this list and deliberately: the making side.** A language is made on
this phone with or without an account, and that does not change.

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
