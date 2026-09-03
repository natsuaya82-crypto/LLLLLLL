# Data model

What each thing is, who owns it, and whether it is allowed to change under
somebody.

The one question this file exists to answer, before any other: **is this datum
frozen at the moment it was made, or read from the current state?** Getting
that wrong is not a rendering bug. It is the app quietly telling somebody that
what they wrote was something else.

## The three kinds

| kind | rule | example |
|---|---|---|
| **current** | read from the open language every time it is wanted. It is *supposed* to move when the language moves. | a word's spelling, a letter's shape, the alphabet, the writing system |
| **frozen** | written ON the thing at the moment it was made, and never re-derived | a post's shapes (`ink`), its author, its handle, its language's name |
| **held from an earlier state** | neither. The one to be suspicious of. | none today — see `docs/BACKLOG.md` |

If you are about to render something a person made earlier, decide which of
the three it is before you write the line. `docs/FEATURE_RULES.md` § past data
is the procedure.

## The language

Twelve slices, filed under `lingua.<id>.<slice>`. `SLICES` in `www/core.js` is
the list, and **being in that list is what makes a slice real**: `bkPack()`
walks it, so a slice outside it is in no backup; `wipeAll` walks it, so a slice
outside it survives a wipe into the next language. Two were outside it once —
the keyboard and the world — and neither could throw.

**And now a third reader walks it: the server.** OWNER DECISION 2026-08-26 —
「基本は全部サーバー管理 言語周りだけバックアップにfile使う」. Each slice is one
row in `slice` (`supabase/schema.sql`), keyed `(language, kind)`, and `body` is
**the exact string `localStorage` holds** — the same string `bkPack()` writes to
the file, so a slice has one shape and not three that could drift.
`netLangSync()` (`www/net.js`, fired from `www/boot.js`) reads, merges through
`www/sync.js` and writes back. So being in `SLICES` now decides three things at
once — backup, wipe, and what goes up — and a slice added outside the list is
missing from all three.

**And all of it goes when the account does.** OWNER DECISION 2026-08-26 —
「アカウント消したら全部消えるに決まってる」. Not the server rows only: the
`slice` rows, the `language` row, the bytes in Storage, **and every
`lingua.<id>.<slice>` key on the phone**, plus `lingua.langs` and `lingua.cur`
that index them. This is the one place in this file where data is removed on
purpose, and it is allowed for the one reason `docs/DATA_SAFETY.md` does not
forbid: **the person asked.** It is not built — `netDropMe()` reaches the server
only, and `wipeAll()` is a separate button (`docs/FEATURES.md` § 8).

Which of the copies is believed when they differ: **neither.** `sync.js` adds
both sides and lets neither win by being newer 「そりゃあ両方足すだろ」. The
cost of merging is a duplicate; the cost of choosing is somebody's word. This
is `docs/DATA_SAFETY.md`'s rule at the one place it would have been easiest to
break.

| slice | global | what it is | shape |
|---|---|---|---|
| `words` | `WORDS` | the dictionary | array |
| `lines` | `LINES` | saved lines | array |
| `lang` | `langName` | the language's name | text |
| `script` | `SCRIPT` | roman → strokes, letters no word uses yet, and **which way the language is written** (`dir`) | object |
| `letters` | `LETTERS` | the alphabet | array |
| `notes` | `NOTES` | the notebook | array |
| `phases` | `STG` | grammar stages, `fm` — the rules a form is made by (`docs/FEATURES.md`) — and the calendar's two numbers, `months` and `week` (`www/cal.js`) | object |
| `talk` | `TALK` | the conversation. **Its screen is lifted** — see the note on `PLANS` in `www/core.js` — so nothing in the app reads or writes this today. The slice stays in `SLICES`, `bkPack()` still copies it out of storage, and a restore still puts it back: a screen going away is not a reason for somebody's conversation to be deleted | array |
| `snd` | `SND` | the sound inventory | array |
| `kb` | `KB` | the keyboards this language's owner **built**, and which one is applied. The free QWERTY is not among them: it is board 0, rebuilt from `kbFixed()` every time it is asked for, so it cannot go stale and cannot be edited. `v:2` says `migrateKbFree()` has taken the old copy of it out of the array | object |
| `gram2` | — | the grammar engine's v2 model (`www/grammar-engine/`). **`gModel()` in `www/grammar.js` reads it**; nothing writes it yet, so every language today falls to `fromLegacy()` and answers exactly as before. What it holds when it is written is **everything except the dictionary and the rules that name words** — `words` is rebuilt from `WORDS` on every read and `grammarRules` from the stages, because both point AT the dictionary and a stored copy would part company with it the first time somebody renamed a word. `adapter.save` still has no caller. It is in `SLICES` from the day the key existed rather than the day the first caller does, which is the whole lesson of the keyboard and the world: a slice joins the list BEFORE anything writes to it, or the first thing written is the thing that is not in the backup. It sits **beside** `phases` and does not replace it — a migration copies and never removes | object |
| `wld` | `WLD` | what the language is for — and two flags. `hide`: whether it has a page anybody else may open; **absent means public**. `dl`: whether the letters and the words may be taken away and used; **absent means no**, and the two defaults point opposite ways on purpose — a page is a thing to be looked at, and handing over months of somebody's drawing is not a thing to decide for them | object |

`BK_SHAPE` in `www/backup.js` carries those shapes; `bkSound()` uses it to tell
a slice from wreckage. **`langKeyOf(id, slice)` is the only thing that knows how
a language is filed**, and `langKey(slice)` is it asked about the open one —
which is what 290-odd call sites mean. The two are one sentence and two
audiences: a screen means "the one in front of me" and must never be handed an
id it could get wrong; something that addresses a language BY ID cannot say
`langKey()`, and the answer to that is not to let it build the string itself.

**Not a slice, and deliberately:** `lingua.set` (`SET`) is the person's
settings and belongs to no language. It carries `planWas` — the plan the app
last saw — so that a plan ending can be noticed however it happens and said
once (`docs/PAID_FEATURES.md` § when a plan ends). It also carries `obback`,
which is where to go when the door is done: the sign-in screen lives inside
the onboarding, so Settings has to write `done:false` to show it, and the note
saying that flag is temporary has to be written to the same place at the same
moment. It was a variable, and a reload between the two left a phone claiming
the onboarding was unfinished with nothing left saying otherwise. Cleared by
`obReturn()`; it is a pending move, not a preference, and it is the one thing
in `SET` that is meant to be short-lived. `lingua.me` (`ME`) is the person — the copy of their `profile` row.
`lingua.sess` (`SESS`) is the session — the token pair only; **a password is
never held, stored or logged.** `lingua.posts` (`POSTS`) is **the copy of** the
timeline and `lingua.drafts` (`DRAFTS`) **the copy of** what was written and not
sent — both live on the server, and both are read here so that the app works
with no signal. A draft is the composer,
kept: the line, the meaning, whom it answers, the pictures with their letters
still placed on them, the recording, and whether it was going to be private.
Every one of them carries an `id`, minted on this phone by `netUUID()`, which
is the name its row on the server has; a draft written with no signal already
has the name it will go up under. Nothing prunes it and nothing ages it out.

**Both of those are the copy that survives a bad network, and NEITHER is where
they live.** 「SNSは全部サーバー」 OWNER, said again on 2026-08-27 — a draft is
the timeline's, and so is a voice, so both belong on the server the same way a
post does.

Both are there now. A voice already was: `netUpVoice()` (`www/net.js`) puts a
posted recording in Storage at `<uid>/<pid>/vo.m4a` and writes the path onto
`row.body.vu`, and `voRemote()` (`www/rec.js`) tells one on this phone from one
on the server by whether the name holds a slash. The drafts went up on
**2026-08-28**: `draft` in `supabase/schema.sql`, one row per draft, `body`
holding what the composer held. `lingua.drafts` stays and is the copy that
works with no signal — written FIRST and always, whatever the network is doing,
because what somebody wrote must not depend on a signal — and it is no longer
where a draft lives.

A draft is read back by `draftsPull()` (`www/post.js`), which **fills in what
this phone is missing and never writes over what is here** — § 2 of
`docs/DATA_SAFETY.md`, and the reason is the one that file gives: the way a
copy destroys somebody's work is by winning.

`lingua.notices` (`NOTES_HAVE`) is the third of these and the newest —
**2026-09-01**. It is the notices the RPC last answered with, and it exists for
one reason: the notices screen had no copy at all, so it was blank for about a
second every time it was opened while the feed beside it drew instantly off
`lingua.posts`. 「通知とか表示されるのに1秒くらいの空白の時間があるのうざい
からそれ無くして欲しい」 OWNER 2026-08-28.

**It is a copy and never a record.** `notices()` in `supabase/schema.sql` is
computed from `react`, `post` and `follow` every time it is asked; nothing is
stored server-side that this could be the only surviving version of, so an
answer simply REPLACES what is here rather than filling in what is missing.
That is the opposite of the draft rule above and it is not an exception to it:
a draft is something a person MADE, and a notice is something that happened to
them. There is nothing here to destroy by winning.

**It is filed under the account**, `lingua.notices.<uid>`, the way `lingua.me`
is parked by `meParkKey()`. Two accounts on one handset must not read each
other's notices, and a notice names who did what to whom.

**Nothing prunes it and nothing ages it out**, which is the same sentence
`lingua.posts` and `lingua.drafts` carry: it is replaced whole by the next
answer and by nothing else. It is removed by `lsWipeAcct()` with everything else
under `lingua.` when an account goes — no list to add it to, which is why that
function counts `localStorage` instead of walking a list.

`lingua.set` carries **`notAt`** beside it, and it is not the same kind of
thing: it is **when the notices screen was last opened**, as a number of
milliseconds, and it is what makes a notice unread. 「最後に通知の画面を開いた
時刻より新しいものを未読とする」 OWNER 2026-09-01 — the count on the bell is
how many of `NOTES_HAVE` are newer than it. It is in `SET` and not beside the
copy because it is a fact about the PERSON and not about the notices: it
survives the copy being replaced, and it is the one number the bell reads.
**The server holds no read marker** — `notices()` returns eight columns and
none of them says read — so this is the whole of what "unread" means here, by
the owner's decision rather than for want of a column.

What is IN a draft's `body` is what the composer had in its hands, pictures and
recording as base64 — **not** files in the media bucket. That is not a
shortcut. `post-media` is public (`media_read` is `using (bucket_id =
'post-media')`), so a draft's photographs put there would be readable by
anybody holding the publishable key while the draft itself was not; and
`netMyFiles()` collects what an account deletion removes out of `post.body`
only, so a draft owning files in the bucket would be files nothing points at.
The bytes go up when the post does, and not before.

A draft carries no `ink`: ink is cut onto a post as it is sent (rule 13), and a
draft has not been sent.

**Deleting the account takes both sides.** `lsWipeAcct()` removes every key
beginning `lingua.`, counted rather than listed, so `lingua.drafts` goes with
it; `draft.author` is `references profile(id) on delete cascade`, so
`account_delete()` takes the rows. 「アカウント削除で残るものねえ」

## The index of languages, and what is actually in it

`lingua.langs` (`LANGS`) is `id -> { … }`, and `lingua.cur` (`langId`) says
which one every global on the making side means.

| key | written by | what it is |
|---|---|---|
| `name` | `langMigrate()`, `langMint()`, `bkRestore()`, and `save()` on the open one | a copy of the language's name, so a row can be drawn without opening the language to find out what it is called. For the OPEN language `langName` is the live answer and this is the copy made at the last save |
| `mine` | the same three places | **`true`, always, on every entry that has ever existed.** See below |
| `sid` | `netLangRow()` (`www/net.js`) | the server's id for this language, the same way a post carries one. **A language with no `sid` has never been up.** Added after the entry is made, and `langStore()`d on the spot |

`core.js` said `{ name, mine }` **and nothing more** above `LANGS` for as long as
`sid` has existed. It is three keys. Corrected 2026-08-25.

## A language that is only read — **this state does not exist**

Written down because it has been **decided** and is **not built**, and the gap
between those two is where a next session invents something.

`LANGS[id].mine` is the only thing that would say a language is not yours, and
**nothing has ever written it false.** Three places write to `LANGS` —
`www/core.js:115` (the migration), `www/core.js:140` (`langMint()`), and
`www/backup.js:264` (a restore putting back a language the index lost) — and
all three write `mine:true`. So:

```
  a language that cannot be edited     does not exist
  a language somebody else made        does not exist
  LANGS entries where mine is false    have never existed
```

Two things in the app are already written as though they did, and both are
reading a state that never arrives:

- **`vLangs()` in `www/home.js`** splits `LANGS` into 「自分の」 and 「読んでいる」.
  The second list is **always** the empty note. It is not broken — it is the
  slot DL was going to fill, drawn early.
- **the comment above `langCount()`** said `LANGS` "also holds every language
  being read from somebody else", to explain why the ceiling counts `mine`
  only. The ceiling counting `mine` is right and stays; the sentence about why
  was describing a thing that is not there. Corrected 2026-08-25.

**What a read-only language answers. Three of these four were open until
2026-09-01; the owner closed them and the answers are here rather than in a
log somebody has to find.**

1. **Where the slices live.** A downloaded language is `lingua.<id>.<slice>`
   like any other, or it is not a language at all — `langKeyOf(id, slice)` is
   the only thing that knows how a language is filed and a second answer is
   the bug `CLAUDE.md` names twice (the keyboard, the world).
2. **It does not go into the backup file.** OWNER 2026-09-01, asked whether a
   downloaded language is in the person's own backup: 「入らん」. `SLICES` is
   unchanged — it is the list of what a language is MADE of, and that is the
   same list for every language — but **`bkPack()` skips a language that is
   not `mine`.** It is not theirs to hand out, and it is not lost by being
   skipped: it came from somewhere and can be taken again. `wipeAll` is the
   other way and does not change: `lsWipeAcct()` counts `localStorage` and
   removes everything under `lingua.`, so a downloaded language goes with the
   account like everything else.
3. **A partial language is a normal state, not an error.** OWNER 2026-09-01:
   「いや一つづつdlでいいよ。」 — the download section opens onto 単語 / 文字 /
   キーボード with a ↓ on each, and they are taken **one at a time**. So a
   language with `words` and no `letters` is what the app looks like halfway
   through, and it has to draw. "No slice" and "an empty slice" are already
   separate states (`bkSound()`, `BK_SHAPE`); **a downloaded language uses the
   first** — the slice is absent until its ↓ is pressed. No third state is
   invented: "never offered" is the publisher's ↓ not being there to press.
4. **The ceiling counts it separately.** OWNER 2026-09-01: 「別に数える」.
   `langCount()` counting `mine` only is right and stays right; a downloaded
   language is never added to that number. **The two numbers themselves are
   still open** — how many of each a plan buys has not been decided, and
   nothing here may invent one.

**5. It is outside sync, and that is not a flag — it is the whole point.**
Everything else about a language goes to the server and comes back merged
(2026-08-26, above), and `syMerge` **adds both sides**. Run a downloaded
トキポナ through that once and something has been added to it, at which point
「トキポナに文字足したらトキポナじゃないです」 (OWNER DECISION 2026-08-25). So
「基本は全部サーバー管理」 has exactly one exception and this is it. It must
hold by construction — a read-only language that `netLangSync()` simply never
reaches — and **not** by a `mine` test remembered at each of the four call
sites, because the one that forgets is the one that ruins somebody's copy of a
language they did not write and cannot repair. It also does not need syncing:
nothing on the phone can change it, so the two copies cannot differ.

**What is already settled, and settled twice.** A downloaded language is
**never merged into the person's own** — `docs/FEATURES.md` § 4 (2026-08-19)
and the decision log (2026-08-25). Nothing of theirs is touched, moved,
renamed or counted differently because a download happened. `DATA_SAFETY.md`'s
rule holds without an exception being needed: a download **adds**.

## A word

```js
{ hw, sp[], mns[], mn, pos, at,
  from?, fm?, syn[]?, ant[]?, ex[]?, nt?, reg?, tags[]?, ety?, up? }
```

`hw` is the headword and `sp` is the spelling as letters — **the spelling is
the word**. There is no stored `ph`: what a word sounds like is asked of its
letters every time it is wanted, because a stored copy of a sound is what went
stale the day the letter's sound changed.

An empty field is deleted rather than stored: a key that is always there and
always blank ends up in every export and every backup. `wdPutExtras()` in
`www/wordsheet.js` is the one place that writes `nt` / `ety` / `reg` / `fm` /
`tags` / `up`, called by both Save and Add.

`from` is the word this one is derived from and `fm` is **what it is of it** —
a code out of `FM_INF` (an inflection: the same word in another shape) or
`FM_DER` (a derivation: a different word built out of it) in
`www/wordsheet.js`, never a label, so the interface language changes under a
word without changing the word. Or `i~` / `d~` and the words somebody typed
themselves, which are kept as typed and never translated: what a language calls
a thing is its own. Those live on the word and nowhere else — the labels a
language has are the ones its words are wearing, so there is no second list to
keep in step, nothing to migrate and nothing to delete. It is on the LINK and
not a paradigm the language declares: a language does not say which forms it
has, and a form built out of nothing like its parent is still just a word with
a label on it. `fm` without `from` is not a state — `wdPutExtras()` deletes it
when the parent goes.

A word is **current data**. A card of a word follows the letters being redrawn,
and that is correct.

## A letter

```js
{ id, st[]?, ch?, nm?, snd[]?, val? }
```

`st` is the strokes somebody drew; `ch` is a character borrowed instead of
drawing one; a letter with neither has no face yet.

A stroke is `{ pts[], closed?, k?, fill? }`. `pts` are lattice points, a third
element `'c'` on one marking a bend; `closed` joins the last back to the first;
`k:'o'` is a true arc through the points rather than a corner rounded off.
`fill` blackens the inside of what the stroke goes round — three points is the
least that has an inside, and on fewer it sits there and does nothing. It is
the one shape in the app that is not a swept nib, so `glyphContours()` cuts
that inside into triangles; the stroke itself is still drawn. Held by
`tools/fill-check.mjs`.

A stroke that predates any of these flags is a stroke with none of them set,
which is a plain open line — the same thing it has always been. `val` makes it a digit — a
digit is a letter with a value instead of a reading, found by value, because a
digit has no name to match on.

`ltStart()` **tops up**: a language that already has letters keeps every one of
them and is given only the names it is missing. It never rearranges and never
touches the sound inventory.

## A post

The one piece of **frozen** data in the app.

```js
{ id, at, lang, lname, ln, who, hd, mine, av, mn, ui, dir,
  ink?, tr?, pics?, pic?, pin?, vo?, ed?, to?, toh? }
```

Everything a reader needs is on it, because the reader does not have the
writer's language:

| field | why it is on the post |
|---|---|
| `who`, `hd`, `av` | the author. `ME` is *me*, and a timeline has no such thing |
| `lname` | the language's name. Stamping the open language across somebody else's card is the same bug three times over |
| `ink` | **the shapes**, already cut. `ka` is one letter on the writer's phone and two on everybody else's, so the cut has to travel too |
| `ln` | the line, in the writer's own language. **May be empty**: a post can be a photograph on its own or a voice on its own 「文字無しでもポストできるようにできない？」. `pwHas()` decides what counts as something to post; empty is still refused |
| `pv` | **kept to yourself**. Absent means public, which is the default and what every post written before this is. A private post is never handed to `netPush()` — not "sent and hidden", which is a flag somebody else's server has to be trusted with |
| `pin` | this author put it at the top of their own page. One at a time |
| `pics` | **up to four photographs**, each squeezed to 900px on the long edge at q0.72 — about 22 KB as text apiece. See below: this is the one field big enough to matter |
| `pic` | one photograph, on posts written before `pics` existed. Never rewritten. `postPics()` is the one place that reads either |
| `tr` | what it means in other natural languages, translated at the moment of posting by the writer's own device AI. Absent until that is wired up, and absent is not empty |
| `vo` | **the voice**, as `{f, ms}` — a name and how long it is, never the bytes: thirty seconds of AAC is about 240 KB, which is ten free-sized languages, and `lingua.posts` shares its quota with everything a person has made. **The bytes are on the server** — `netUpVoice()` puts them in the `post-media` bucket at `<uid>/<pid>/vo.m4a` and writes that path onto `body.vu`. `www/rec.js` writes a local file first so a recording made with no signal is not lost; `voRemote()` tells the two apart by whether the name holds a slash |
| `ed` | when it was edited, if it ever was. An author may put the **line and the meaning** right; the photographs and the voice stay as they were. The `ink` is re-cut at that moment, which is the one place in this app where a post's shapes are not the shapes it was born with — a changed line with the old shapes is the old line |
| `to`, `toh` | **what it answers, and who wrote that.** Both, and for two different readers: `to` is the id, which is how a reply and its parent are put back together on a phone that has them both, and `toh` is the handle, which is what is SHOWN — so it is on the reply, because the post it answers may not be here at all. `postToWho()` in `www/post.js` is the one place either is read for display: it takes `toh`, falls back to asking the parent when the parent is here, and shows nothing when it is not. A reply written before `toh` existed has only `to` and is not back-filled |
| `dir` | **which way the line runs** — `ltr`, `rtl`, `ttb-rl`, `ttb-lr`. The language's, frozen at the moment of writing. A timeline that asked the open language would set every post the way MY language runs, which is `ink` all over again. Absent means `ltr`, which is how every post before this was written |

### `ink`

```js
{ g: [ [stroke, …], … ],     // every shape, written out once
  s: [ 0, 1, 0, ' ', 1, … ] } // the line: a number indexes g, a string is itself
```

Anything the writer never drew is text and stays text, which is why a
half-drawn alphabet gives a half-drawn line.

**`postInkOK(ink)` in `www/post.js` decides whether ink can be drawn from, and
it is the only place that decides it.** "Is there ink" is the wrong question: a
post carrying `{}`, or `{g:[],s:[]}`, or an `s` pointing at an index `g` does
not have, HAS ink and cannot be drawn from it. Anything not drawable is shown
as the post's **text**. Nothing repairs it — guessing at what the shapes were
meant to be would be inventing somebody else's alphabet.

Two readers, both below their file's line, both asking `postInkOK()`:

```
  postLnHTML()   www/post.js   the timeline
  cardOfPost()   www/card.js   the card
```

`tools/sides-check.mjs` refuses either file's lower half naming the making
side. `tools/card-check.mjs` drives the real app: writes a post, **redraws
every letter and deletes the word it was written with**, and asks what
`cardPaint()` actually put on the canvas.

### Posts without ink

`migratePostInk()` cuts ink onto posts one language at a time, as each is
opened, because a post can only be cut with the alphabet it was written in. A
post not yet cut has no ink and falls back to the open dictionary.

**That is correct today and will not be tomorrow.** It is correct because every
post without ink predates the timeline holding anybody else's, so all of them
are this person's own. The day posts arrive from a server, **they must arrive
with their ink already on them** — a post from elsewhere with no ink must be
drawn as text, never re-cut locally.

### A photograph, and why there is a ceiling

The bytes go to the server with the post — `netUpPics()` into the `post-media`
bucket, the paths onto `body.pu` and the small copies onto `body.pt`. **The
copy this phone keeps is a data URL in `lingua.posts`**, which shares one
`localStorage` allowance with **every slice of the language**, and that is
where the ceiling comes from: the size of a photograph is a data-safety
question before it is a picture-quality one.

```
  a whole free language                     about 25 KB
  one photograph at 900px q0.72             about 22 KB as text
  POST_BYTES, the ceiling on the timeline    2 MB, about 95 photographs
```

When the timeline is at the ceiling the **photograph** is refused — never the
post, never anything already written, and nothing is pruned to make room.
`savePosts()` says so out loud rather than swallowing the failure, which is
what it did before a post could be big enough to fail.

### What a post stopped carrying

`gl` — the gloss, word by word — was on every post and was read in exactly one
place, the line under the meaning. That line is gone (three layers, not four),
so the field was written and never read, which is the thing that makes this
codebase hard to read. New posts do not carry it.

**Posts that already have it keep it.** Nothing goes and removes it: it is
somebody's, and removing what a person made because the current shape has no
use for it is what `docs/DATA_SAFETY.md` forbids outright. It is simply
ignored.

### The reader's own words

A post said again in the reader's conlang is the one thing here that is
**current** rather than frozen, and deliberately: it is built from the
reader's dictionary, now, so a sentence that half renders today renders whole
next month because the dictionary grew. Freezing it would be the bug — the
mirror image of `ink`, and correct for the same reason. `trUnits()` in
`post.js` is above the line and touches `mn`/`tr` and never `ln` or `ink`;
`sides-check` holds that with a named exception rather than by silence.

## What money is allowed to touch

Nothing in this file. The plan decides what a person may *do*; it decides
nothing about what exists, what is saved, or what comes back.

**And the plan is the ACCOUNT's, not a slice and not one of the settings**
「課金とアカウントとキーボードはアカウントに結びつく」 OWNER 2026-09-01. It follows the
person to whatever phone they sign in on. `SET.plan` is where the value sits
today and that is the code, not the model — `docs/STATE.md` § 3 item 4 has the
gap. See `docs/PAID_FEATURES.md`.

**And when the plan runs to is NOT stored, deliberately.** 2026-09-03: the
plans screen draws no buy button for a rung already paid for, so the place it
left says which plan is on and until when — 「消すなら同じ場所に現在この
プランです〇〇/〇〇までみたいな感じにしないとわからんやろ」 OWNER 2026-09-03.
The date comes from `Transaction.expirationDate` through `LinguaStore.current`
and stops at `STORE_UNTIL` in `www/store.js`, which is a variable and not a
key: it is gone when the app is closed and asked for again the next time the
screen is opened.

Two reasons, and either one is enough. **It could not answer 「which account
is this」**, which is the question at the head of `CLAUDE.md` that a thing has
to answer before it is written down — an expiry belongs to the Apple ID that
paid, and `localStorage` is the account's. `SET.plan` already cannot answer it
and that is a known fault (`docs/STATE.md`); a second one beside it is a second
thing to unpick. **And a date that outlives the plan it was answered for is
the one thing this line must never do**: it is held WITH that plan, so a plan
that moves takes the date with it rather than leaving a date beside a plan it
was never about. 「not known」 and 「there is no end」 are different states and
do not share a branch, which is the same sentence this file makes about 「空」
and 「読めていない」 everywhere else.
