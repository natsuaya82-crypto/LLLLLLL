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

**The buttons half was turned over by the owner on 2026-08-25, and the words
half was not.** 「だいたい無料で使えないやつは表示させていいよ。課金させる
動線を減らしたくない」「無料はタップすると課金ページに飛ばされる」 A door a
plan has closed is **drawn anyway**, on every plan, and pressing it goes to the
plans screen. Hiding it was costing the one thing a locked door is for: nobody
buys what they cannot see.

So *fewer buttons* is no longer how a closed door looks — but the sentence it
was protecting is untouched and is the one that matters. **Nothing a person
made is hidden, moved or removed by a plan**, and a screen that shows fewer
WORDS on the free plan is still the bug it always was. The two halves were
never the same statement; only one of them was ever absolute.

`capStop()` — the words ceiling met in the middle of typing — is read as NOT
covered by this, and the reason is written on the function: it stopped doing
`go('plans')` because somebody halfway through a word had the screen taken off
them. That is a *metered* ceiling arrived at by accident; this decision is
about a door pressed on purpose. The decision log says to ask the owner if that
reading is wrong.

This is already how it is built and it is worth saying why: the backup list
sits **above** the lock in the settings, not behind it, because charging for
not losing somebody's work means answering, on the day it is lost, whether they
had paid.

## How it is asked

**Three plans, and they are a ladder: Free, Plus, Pro.** `PLAN_ORDER` in
`www/core.js` is those three, cheapest first, and `has(level)` is met by the
plan that names the level and by **every plan above it**. Written as an equals
sign it would give Pro what Plus buys and nothing else — a Pro account quietly
losing the letters it paid for, one tier down.

They were Free, Basic and Plus until 2026-08-23. 「ベーシック、プラスって名前
どう思う？なんかどっちが上かわかりにくくない？」 — Basic reads as the name of a
FREE tier in most apps, so Free and Basic were the confusable pair. `Free <
Plus < Pro` needs nobody told which is which.

| | Free | Plus | Pro |
|---|---|---|---|
| `letters` add / name / delete | — | yes | yes |
| `wsys` a writing system that is not an alphabet | — | yes | yes |
| `snd` choose the sound, not the letter's own | — | yes | yes |
| words | 100 | 1000 | no ceiling |
| `kb` a keyboard of your own | 1, the fixed QWERTY | **1 + 3 = 4** | no ceiling |
| languages on this phone | **1** | **1** | **3** |
| `dl` a language taken from the official assets | — | **yes** | yes |
| how many DL'd languages | — | *1?* | *3?* | 
| `edit` editing a post you have sent | — | **yes** | yes |
| `gram` `dir` `data` `file` `write` `badge` | — | — | yes |

**The words ceiling is a number, not a door.** `wordCap()` is the one place
that says it — `Infinity` on Pro, a thousand on Plus, `FREE_LIMIT` below
that — and `can('words')` is asked inside it and nowhere else, meaning "no
ceiling at all". Everything that shows or enforces the ceiling asks
`wordCap()`: the dictionary, the banner on the cover, the count in settings,
`capOK()` and `capStop()`.

**The middle rung is decided and is not on sale.** Plus's price is in no
language file and no subscription for it exists in App Store Connect, so the
plans screen sells Free and Pro. What is here is the rung: the day a receipt
says `plus`, every door above is already the right way round.

**`kb` is Plus's, and its number landed in the same commit** — 2026-08-23.
「1,1+3.無制限って言わなかったっけ？」 Free 1, Plus 1 + 3 = 4, Pro no ceiling,
and **counted as a pool across languages** rather than per language: three
languages were nine keyboards while `KB_MAX` was three per language, on a plan
that sells three.

**`dl` is Plus's, and its number is NOT decided.** 「DLはplusから」 — that half
is flat and is what the row above says. The number is the owner's next line and
**it ends in a question**:

```
DLはplusからだけどplusは自分の言語+DL言語1個
proは自分の言語3個+DL言語3個は？
```

So the table shows *1?* and *3?* and they are written that way on purpose. A
number in this file is read as settled by everybody downstream — `wordCap()`,
`kbCap()` and `langCap()` are each one place saying one number — and turning
「は？」 into a constant is how a question the owner asked comes back as a rule
nobody remembers agreeing to. **Ask before writing either into `core.js`.**

What the two numbers already tell us, though, is the shape, and the shape is
not in question: **a DL'd language is counted SEPARATELY from your own.**
「自分の言語+DL言語1個」 is two numbers, not one. `langCount()` counts `mine`
and must go on counting only `mine`; whatever counts downloads is a second
function beside it, not a change to it. That also means the free plan is
untouched: Free has one language and no `dl`, exactly as today.

**`CAN.dl` is not in `CAN` yet, and that is not an oversight.** `dead-check`
refuses a capability nothing asks for, the only screen that would ask
(`www/home.js`'s overview page) is not written, and § Not built yet below
already says what happens to code written ahead of its caller. It goes in with
its first `can('dl')`, the way `kb` went in with `kbCap()`.

**Nothing here may take a language away.** The rule at the head of this file
covers a downloaded language the same as any other: a plan that lapses means
fewer buttons — no new download, and the door drawn anyway — and never fewer
languages. Somebody who downloaded three keeps three, sees three, and backs up
three, exactly the way `langCap()`'s ceiling already hides and never deletes.

**The cloud is on every plan, and that is where the money actually goes.**
OWNER DECISION 2026-08-22 「クラウドは全員で」, re-confirmed 2026-08-26 「基本は
全部サーバー管理」. It is not a capability and must not become one: there is no
`can()` anywhere in `www/net.js`, `www/sync.js` or `www/boot.js`, and
`netLangSync()` asks nothing about a plan before it runs. That is correct and
is the rule at the head of this file — a plan decides what may be DONE, and a
language existing is not something anybody does.

`CAN.data`'s comment in `www/core.js` said 「CSV out, **and the cloud**」 and the
cloud half was never true in code: `can('data')` is asked in `www/settings.js`
twice, both about CSV. Corrected 2026-08-26.

**So the bill scales with people, not with payers.** Every account's twelve
slices are `slice` rows — 5.4 KB for a small language, about a megabyte for a
large one (`bkPack()`'s own numbers) — plus the egress of reading them back on
every launch. `docs/FEATURES.md` § 2 carried 「deferred until Supabase $25 is
worth paying」 as the reason nothing was built; the decision overrode the
deferral and **the cost did not change**. Nobody has priced it against the four
subscription products (2026-08-14), and **nobody here should**: what a plan
costs and where the free/paid line sits are the owner's.

**Answered 2026-08-26: 「supabaseのエンタープライズで対応する予定」.** The bill
scaling with people rather than payers is not a reason to narrow the scope, and
proposals to narrow it on cost grounds are **finished** — the owner has priced
the decision and taken it. The multiplier is settled too: 「常に同期」, not the
once-on-launch `www/boot.js` does today, so the number goes UP from whatever it
is now.

What is still true and still this file's job to say: **none of it may reach
anybody's data.** An enterprise plan that lapses, a bill that goes unpaid, a
project that gets suspended — each of those is the entitlement check failing,
and the rule at the head of this file already says what happens then: fewer
buttons, never fewer words, and every byte where it was. The phone holds a
working copy of every slice and `bkPack()` writes the file; a server that
stops answering is a person who can still open their language.

`CAN.kb` is the DOOR — may this person lay a keyboard out at all — and
`kbCap()` in `core.js` is the number, beside `wordCap()` and for the same
reason: a constant was one fact while there was one paid tier and is three
facts now. `kbCount()` in `keyboard.js` is what it is compared against, and it
reads every language rather than the open one. **The door and its number are
one statement and did not land apart**: opening `can('kb')` while `KB_MAX`
still handed out three would have given Plus a number the owner never said.
`plan-check` holds all seven claims, and three of them were watched failing
with the bug put back.

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
| `dir` | plus | choosing which way the language is written. **Reading one is free** |
| `edit` | plus | editing a post you have already sent |
| `write` | pro | the sheet — letters written on paper and brought back in (ch 26) |
| `badge` | pro | the mark beside your name |

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

There used to be a third plan and it sold the hosted model — the conversation,
and word suggestions with no daily limit. There is no hosted model: `AI_SEAM`
in `www/glyph.js` marks where one would join and nothing joins it. A tier whose
headline is a thing the app cannot do is the app lying to somebody who is about
to pay, so Studio is out until the seam has something behind it, and what it
opened went with it.

**Plus is the tools for building a language yourself** — unlimited words and
letters, the writing systems, the keyboard, CSV, a post read in your own words
— and every one of them runs on this phone for nothing.

```
  free    draw your own letters. 100 words
  plus    build it yourself. No ceiling
```

Plus is not given fewer than Free of anything — "I paid and it got smaller"
reads as a bug
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

## What holds all of this

`tools/plan-check.mjs` — `npm run plan`. Twenty-five claims, and the sentence
they are all about is the one at the head of this file: **a plan decides what
may be DONE and nothing about what exists.**

`dead-check` already holds the SHAPE of the table — every capability in `CAN`
asked for by name, every `can()` naming one that exists, `has()` core.js's
alone. What it cannot ask is what happens to somebody's WORDS when the answer
changes, and that is this: five hundred words made on the paid plan, the plan
ended, and then the list is a hundred while the language is still five hundred
and **not one byte of any slice has moved**. Also that no plan at all reads as
free; that any plan which is not the word `plus` buys nothing (`garbage`,
`PLUS`, `studio`); that a backup written on the free plan holds every slice the
paid one does; that the ceiling refuses without taking the screen off anybody;
that the plan is in the settings file in a browser and NOT in it on a phone,
where the Keychain has it; and that a plan ending is said once, not once per
render, and touches nothing.

Six of those were watched failing, with three real bugs put back: a list that
trims the thing it is listing, a slice quietly left out of a free plan's
backup, and the ceiling putting somebody on a price list mid-word.

## Not built yet

**`CAN.dl` — decided, and deliberately not added.** OWNER DECISION 2026-08-25
(`docs/FEATURE_RULES.md`) puts downloading a language on Plus. The entry is not
in `CAN`, because `dead-check` is right: `CAN.dl` with no `can('dl')` anywhere
fails, and the screen that would ask is in another branch's hands. Adding it
alone would mean weakening the check to keep it green, and the check is the
only thing that makes this table true. It lands with its caller.

**The StoreKit code exists and nothing in `www/` calls it.**
`ios/App/App/LinguaStore.swift` has `products`, `buy`, `restore`, `current` and
`manage`, refuses an `.unverified` transaction, finishes what it consumes and
watches `Transaction.updates` for a renewal that arrives while the app is shut.
It writes the answer through `LinguaPlanPlugin.set()`.

What is missing is the wiring: **`www/store.js`, and the plans screen calling
it**. The plan is still set by hand there — pressing a card is `setPlan(id)`
and nothing asks the App Store anything. It is deliberately not written yet
(「storekitってコードは書いていいよ繋げる作業は後でやる」), and writing it
early would have been worse than not: a function nothing calls is a function
`dead-check` deletes.

The two subscriptions are configured in App Store Connect and are described in
`docs/apple.md`.

Where it is kept is settled, though: the Keychain, not the settings file. See
`ios/App/App/LinguaPlan.swift` for what that closes and what it leaves open, and
case 6 of `tools/migrate-check.mjs` for the two things it has to keep meaning.

When receipts do arrive, the rule above is the first thing to hold: a receipt
that fails to validate, a network that is down, a sandbox that answers wrong —
each of those makes the app the free plan for the moment, and none of them
touches a single slice.
