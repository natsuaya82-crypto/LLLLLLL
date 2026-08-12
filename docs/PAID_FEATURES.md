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
| `ai` | plus | the model, unmetered |
| `data` | plus | CSV out, and the cloud |
| `file` | plus | a list brought in as a file rather than a paste |
| `letters` | plus | adding, naming and deleting a letter |
| `wsys` | plus | a writing system that is not an alphabet |
| `kb` | plus | a keyboard of your own instead of the fixed QWERTY |
| `snd` | plus | choosing a sound, rather than taking the letter's own |
| `gram` | plus | a grammar stage of your own, past the fifteen |
| `sug` | studio | the word sheet's suggestions, unmetered |

Three plans: `free`, `plus`, `studio`. `LANG_MAX` is 1 on every plan and is not
a price — there is no way to make a second language anywhere in the app, so a
plan promising more would be promising a button that does not exist.

`ai` lifts at Plus and `sug` only at Studio, and they are the same ceiling. A
Plus account is shown "3 left" on the word sheet forever and never spends one.
Left as it is on purpose: which plan buys the AI is a price, and a price is not
a tool's to decide.

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

## Adding a paid feature

Write this down before the code:

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
