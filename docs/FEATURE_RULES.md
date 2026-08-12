# Adding something

The order is: write the spec, get the answer to anything that is the owner's,
then write the code. Not the other way round.

## The eleven questions

Before any code, answer these in `docs/CHANGELOG.md` under the change (or in a
file of its own if it is large). A "none" is an answer; a blank is not.

```
 1  what it is for
 2  what a person can do that they could not before
 3  free or paid, and which capability name
 4  what existing behaviour changes
 5  what existing DATA is affected
 6  what is newly stored, and where            (slice? SET? on the thing?)
 7  what is deleted                            (if anything: DELETE REVIEW)
 8  how it behaves with data made before it existed
 9  what it does offline
10  what it does when it fails
11  what it does when the plan changes, in both directions
```

Question 8 is the one that gets skipped and is the one the card bug was.

## Past data

If the thing being added displays, exports or scores something a person made
earlier, decide **before writing the line** which of the three it is
(`docs/DATA_MODEL.md` § the three kinds):

```
  read from the current state   correct for a word, a letter, an alphabet
  frozen at write time          put it ON the thing, at the moment it is made
  held from an earlier state    neither — be suspicious
```

Two rules follow, and both are absolute:

**Do not re-generate the past from the present.** If a post, a record, a
history or an export means something because of the state at the time it was
made, that state goes ON it when it is made. Not an id pointing at the current
object — the value.

**An id is not the data.** `post.letterId` → look up `LETTERS` → get the shape
is banned for anything past-tense, because `LETTERS` is now and the post is
then. `post.ink` is the shape itself, which is why it survives the letter being
redrawn, deleted or never having existed on this phone at all.

Today the app has exactly one past-tense kind — posts — and exactly two files
render one, `www/post.js` and `www/card.js`. The day it grows a ranking, a
season record, a history or an achievement, this section is the first thing to
read.

## One place

A rule lives in one place, and the places that follow it do not restate it.
Three bugs found in one afternoon were the same bug: something was added and
the one place that governs it was not.

**A comment saying "this is the one place" is worth nothing on its own.**
Whoever reads it will fix that one and go home. Either a check holds the claim,
or do not make the claim. `ltFace` opened with "a letter's face, wherever one
is shown" and there were five others; `inkStrokes` said it was "the one place
that turns strokes into a shape" and the glyph editor did not go through it.

Not everything that repeats is duplication. `cffNum` and `csNum` in `otf5.js`
encode the same integers to different byte forms because that is what CFF
specifies. Merging them would be inventing a rule, not finding one.

## Refactoring

Not a goal. Do it only when one of these is true:

- the duplication is causing bugs, or has already caused one
- a spec change would mean editing several places, and they will drift
- the thing cannot be tested as it stands
- responsibilities are genuinely tangled
- it blocks a feature that is actually being built

**If pulling something out means a new dependency between two files that did
not need each other, leave it.** Taste is not a reason.

**A behaviour change and a refactor do not share a commit.** Neither does a
rename: renaming an acted function touches `act-map.js` twice — the string and
the function — which are the same files a feature change touches, and the diff
stops being readable. Renames go in a commit of their own with `npm test` on
both sides. `docs/BACKLOG.md` holds the ones known and deliberately not done.

## What is the owner's to decide

Research it, lay out the options and what the code does today, and **stop**.
Do not pick:

```
  prices, and which plan buys what
  the free / paid boundary
  anything that deletes data, or how long data is kept
  how a sync resolves a conflict
  a change to behaviour a person already relies on
  wording a person will read
  any threshold or number that is a judgement rather than a measurement
```

The form is "if A then this, if B then this, and here is what the code does
now" — not a question with no groundwork under it, and not a decision made
quietly because it seemed obvious.

The one already on record: `ai` lifts at Plus and `sug` only at Studio, and
they are the same ceiling — so a Plus account is shown "3 left" forever and
never spends one. Both are left as they are, because **which plan buys the AI
is a price, and a price is not a tool's to decide.**

## What to report when it is done

"Implemented it" is not a report. Every one of these, every time:

```
  files changed, and why each
  what existing behaviour changes
  what existing data is affected
  what is newly stored
  migration:  yes / no, and what it does
  deletion:   yes / no
  the plan:   what it affects
  tested:     what, and how
  NOT tested: what, and why
  device:     needed? done?
  known limits
```

Say "code confirmed" and "device confirmed" as two separate things, and never
let the first stand in for the second.

## Several sessions at once

Before touching anything:

```
  which branch, which commit
  what else is in flight, and where it is
  the docs for the area
  is npm test green right now?
```

Do not guess at what another session meant and write over it. **Do not decide a
spec from reading the code** — the code is what happened, not what was wanted.
If it is unclear, stop and collect the questions rather than picking an answer;
a wrong guess that tests green is the expensive kind.
