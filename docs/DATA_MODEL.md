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

Eleven slices, filed under `lingua.<id>.<slice>`. `SLICES` in `www/core.js` is
the list, and **being in that list is what makes a slice real**: `bkPack()`
walks it, so a slice outside it is in no backup; `wipeAll` walks it, so a slice
outside it survives a wipe into the next language. Two were outside it once —
the keyboard and the world — and neither could throw.

| slice | global | what it is | shape |
|---|---|---|---|
| `words` | `WORDS` | the dictionary | array |
| `lines` | `LINES` | saved lines | array |
| `lang` | `langName` | the language's name | text |
| `script` | `SCRIPT` | roman → strokes, letters no word uses yet, and **which way the language is written** (`dir`) | object |
| `letters` | `LETTERS` | the alphabet | array |
| `notes` | `NOTES` | the notebook | array |
| `phases` | `STG` | grammar stages | object |
| `talk` | `TALK` | the AI conversation | array |
| `snd` | `SND` | the sound inventory | array |
| `kb` | `KB` | the keyboards this language's owner **built**, and which one is applied. The free QWERTY is not among them: it is board 0, rebuilt from `kbFixed()` every time it is asked for, so it cannot go stale and cannot be edited. `v:2` says `migrateKbFree()` has taken the old copy of it out of the array | object |
| `wld` | `WLD` | what the language is for — and `hide`, which is whether it has a page anybody else may open. **Absent means public**, which is the default and the one no migration can get wrong | object |

`BK_SHAPE` in `www/backup.js` carries those shapes; `bkSound()` uses it to tell
a slice from wreckage. `langKey(slice)` is the only thing that knows how a
language is filed.

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
in `SET` that is meant to be short-lived. `lingua.me` (`ME`) is the person.
`lingua.sess` (`SESS`) is the session — the token pair only; **a password is
never held, stored or logged.** `lingua.posts` (`POSTS`) is the timeline, and
`lingua.drafts` (`DRAFTS`) is what was written and not sent — the composer,
kept: the line, the meaning, whom it answers, the pictures with their letters
still placed on them, the recording, and whether it was going to be private.
Nothing prunes it and nothing ages it out.

## A word

```js
{ hw, sp[], mns[], mn, pos, at,
  from?, syn[]?, ant[]?, ex[]?, nt?, reg?, tags[]?, ety?, up? }
```

`hw` is the headword and `sp` is the spelling as letters — **the spelling is
the word**. There is no stored `ph`: what a word sounds like is asked of its
letters every time it is wanted, because a stored copy of a sound is what went
stale the day the letter's sound changed.

An empty field is deleted rather than stored: a key that is always there and
always blank ends up in every export and every backup. `wdPutExtras()` in
`www/wordsheet.js` is the one place that writes `nt` / `ety` / `reg` / `tags` /
`up`, called by both Save and Add.

A word is **current data**. A card of a word follows the letters being redrawn,
and that is correct.

## A letter

```js
{ id, st[]?, ch?, nm?, snd[]?, val? }
```

`st` is the strokes somebody drew; `ch` is a character borrowed instead of
drawing one; a letter with neither has no face yet. `val` makes it a digit — a
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
| `vo` | **the voice**, as `{f, ms}` — the name of a file in `Documents/Voices/` and how long it is. The bytes are NOT here: thirty seconds of AAC is about 240 KB, which is ten free-sized languages, and `lingua.posts` shares its quota with everything a person has made. `www/rec.js` writes the file before the post is stored, so a name on a post is a file on the disk |
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

`pic` is stored as a data URL in `lingua.posts`, which shares one
`localStorage` allowance with **every slice of the language**. So the size of
a photograph is a data-safety question before it is a picture-quality one:

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

Nothing in this file. `SET.plan` decides what a person may *do*; it decides
nothing about what exists, what is saved, or what comes back. See
`docs/PAID_FEATURES.md`.
