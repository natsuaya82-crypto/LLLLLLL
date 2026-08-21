# What money buys

And, more importantly, what it may never touch.

## The rule above all the others

**A plan decides what a person may DO. It decides nothing about what exists.**

Forbidden, without exception:

```
  ✗ a backup that only happens if you pay
  ✗ a restore that only happens if you pay
  ✗ data that disappears when a subscription lapses
  ✗ data deleted because of a plan
  ✗ data deleted because the plan could not be checked
```

**"The plan is unknown" and "this person has no data" are not the same thing
and must never share a branch.** A failed entitlement check means *fewer
buttons*, never *fewer words*. If the check fails, fail toward the free plan
and leave every byte where it is.

This is already how it is built and it is worth saying why: the backup list
sits **above** the lock in the settings, not behind it, because charging for
not losing somebody's work means answering, on the day it is lost, whether they
had paid.

## How it is asked

`CAN` in `www/core.js` names every capability, and `can('x')` is the only way
to ask. `has()` names a *plan* and is `core.js`'s alone. `tools/dead-check.mjs`
refuses a capability nothing asks for (a price with nothing behind it), a
`can('x')` in no plan (a locked door nobody can open, with nothing saying so),
a `can()` given anything but a literal, and a `has()` anywhere else.

| capability | level | what it opens |
|---|---|---|
| `words` | plus | a dictionary past `FREE_LIMIT` (100) |
| `data` | plus | CSV out, and the cloud |
| `file` | plus | a list brought in as a file rather than a paste |
| `letters` | plus | adding, naming and deleting a letter |
| `wsys` | plus | a writing system that is not an alphabet |
| `kb` | plus | a keyboard of your own instead of the fixed QWERTY |
| `snd` | plus | choosing a sound, rather than taking the letter's own |
| `gram` | plus | a grammar stage of your own, past the fifteen |
| `tr` | plus | a post said again in your own words, unmetered. Free gets three a day |
| `dir` | plus | choosing which way the language is written. **Reading one is free** |

`dir` is the one that gates half a thing, and the half it does not gate is the
important one. A language can run left→right, right→left, or down the page
with its columns going either way; a post carries the direction it was
written in, and **every plan is shown it**. A free account that could not read
a right-to-left post would be reading a lie about somebody else's language,
which is the card bug in another costume. What Plus buys is choosing one.
Nothing anywhere asks `can('dir')` before drawing — it is asked in
`setScriptDir()` and on the screen that offers the choice, and nowhere else.

## When a plan ends

**The app goes back to the shape the free plan has. Nothing a person made is
deleted.** Those are two halves of one sentence and neither may be dropped.

| | on free again |
|---|---|
| the dictionary | **lists the first 100 words**, in the order they were made |
| the writing system | an alphabet |
| the keyboard | the fixed QWERTY, in the app and on the phone |
| the direction | left→right |
| a stage of your own | stays on the list; cannot be added to or deleted |
| the AI conversation | the chapter is not shown (it is not shown on Plus either) |
| CSV, file import, unmetered layer 3 | gone, as they always were on free |

Every word, every letter, every keyboard layout, every stage and every
conversation is still in storage, still packed by `bkPack()`, still in the file
in Documents, and still there in full the moment the plan comes back. The app
reads the **whole** dictionary for itself — a post, a gloss, a spelling, an
example — and only the list on the dictionary screen is short.
`wordsSeen()` in `www/words.js` is the one place that shortens it.

Because "shorter list" and "my work is gone" look identical from the outside,
the app says the difference out loud, twice:

- **once, on the day it happens**, in a sheet — `capLapse()` in `core.js`
  notices the plan has changed since the last launch and `openCapLapse()` says
  it. 「バックアップには保存されてるよーって一回出せばok」
- **every time**, at the foot of the dictionary: how many words are not listed.

`backup-check` holds the half that matters: on the free plan, past the ceiling,
`findWord()` still finds a word that is not listed and `bkPack()` still carries
every one of them.

Why this and not "keep everything working, lock only the buttons": a language
is built once. A plan that kept working after the money stopped would be paid
for a month and then never again. 「a にしたら最初の1ヶ月で作りきったらそのあと
課金されねえだろ」

Two plans: `free` and `plus`. Studio comes back with the hosted model. `LANG_MAX` is 1 on every plan and is not
a price — there is no way to make a second language anywhere in the app, so a
plan promising more would be promising a button that does not exist.

There used to be two names for the AI — `ai` at plus and `sug` at studio — and
they were the same ceiling said twice, so a Plus account was shown "3 left" on
the word sheet forever and never spent one. There is one now, and it is
Studio's.

**The AI is not what Plus sells.** Plus is the tools for building a language
yourself — unlimited words and letters, the writing systems, the keyboard, CSV,
a post read in your own words — and every one of them runs on this phone for
nothing. Studio is the plan where something helps you, and it is the only plan
whose cost scales with use: a chat turn has to be given the dictionary to read.

```
  free    draw your own letters. 100 words
  plus    build it yourself. No ceiling
  studio  and something helps you
```

Free and Plus both get `AI_FREE_DAILY` (3) word suggestions a day. Plus is not
given fewer than Free of anything — "I paid and it got smaller" reads as a bug
whatever the reason.

## What the free plan is

One sentence: **your own shapes for a–z and 0–9.** `ltStart` puts thirty-eight
letters there — a to z, `!`, `?`, and a digit for every value the base has —
and nothing on the free plan adds, deletes or renames one. Drawing on them is
the whole of it.

That is not a restriction bolted on; it is what makes the rest possible.
Because the letters are exactly a–z and their names cannot change, the keyboard
can be a QWERTY with the drawn letters substituted in, built from `LETTERS`
every time it is shown, stored nowhere, with nothing to set.

Four places say it and they say four different things: `ltStart` in
`letters.js`, `kbOf` in `keyboard.js`, `wsys()` in `wsys.js`, and the screens.

## The four that must never share a branch

```
  the plan could not be determined
  the plan is free
  this person has no data
  this person's data is damaged
```

Four different situations with four different right answers. Written as one
condition — `if (!paid) { … }` — they become one wrong answer, and the wrong
answer is the one that costs somebody their language. The first means *try
again later, free plan for now, touch nothing*. The third is a new install.
The fourth is what a restore is for.

## Adding a paid feature

Answer all ten before the code:

```
 1  what a free user can do here
 2  what a paid user gets in addition
 3  can any existing data disappear because of the plan?   (it may not)
 4  what happens when the plan check FAILS
 5  what happens offline
 6  what happens when a purchase cannot be restored
 7  is this StoreKit, or the hand-set SET.plan we have today?
 8  what existing users see the day it ships
 9  is a migration needed?
10  after a subscription ends, what is kept?               (all of it)
```

Then write this down:

```
Feature:
Free:            what the free plan still does here
Paid:            what the plan opens, and which can() name
Capability:      the new entry in CAN, and its level
Data:            what is stored, and where
Downgrade:       what happens when the plan ends
                 — and the answer to "is any data removed?" is NO
Check fails:     what happens when the plan cannot be determined
                 — and the answer is: free plan, all data intact
Offline:         what happens with no network
```

Then: add it to `CAN`, ask it with `can()`, and add a `halfDone` entry in
`tools/fixture.mjs` that flips `SET.plan` and puts it back — otherwise
`act-check` reports the new screen's buttons as an entry no screen names, which
is true and is not what you meant.

## Not built yet

**No StoreKit code exists.** `SET.plan` is set by hand in the settings and by
nothing else. The two subscriptions are configured in App Store Connect and are
described in `docs/apple.md`; nothing in the repo talks to them.

When receipts do arrive, the rule above is the first thing to hold: a receipt
that fails to validate, a network that is down, a sandbox that answers wrong —
each of those makes the app the free plan for the moment, and none of them
touches a single slice.
