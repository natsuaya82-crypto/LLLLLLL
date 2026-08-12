# Data safety

「データ消えるのだけはありえない」

Everything a person makes lives in `localStorage` and in one file in
`Documents`. There is no server copy. Losing it is not a degraded experience;
it is the end of months of somebody's work, and there is nowhere to get it back
from.

## The four ways it can go

Three of these four are ordinary events, not disasters:

1. the app is deleted
2. the phone is replaced without a backup
3. WKWebView reclaims its storage
4. a migration goes wrong

`www/backup.js` (chapter 24) answers 1–3 by writing the open language into
`Documents/Languages/`, where iOS puts it in the device backup and the Files
app can show it. It answers 4 by never overwriting.

It was measured before it was built: thirty-eight drawn letters are 12.1 KB, a
hundred words 13.2 KB, five thousand words 685 KB. A free language is ~25 KB,
so the whole thing is written on every change and there is no partial state to
reason about.

## The five rules

### 1. A write never destroys the last good file

`keep()` writes `.tmp`, validates it, rotates the previous file to `.1` and
that to `.2`, and only then promotes. A write that produces rubbish costs a
generation instead of somebody's months.

### 2. A restore never overwrites a slice that is there

It fills in one that is **missing** and stops. This is the one that matters:
**the way a backup destroys somebody's work is by winning.** A restore that
overwrites is worse than no restore at all.

`langMigrate()` has the same rule for the same reason — it **copies** from the
eight old flat keys and never removes what it read. It runs once, on a phone,
against the only copy of something somebody spent months on. Copying costs a
few hundred kilobytes and cannot lose anything; moving could.

### 3. "Empty" and "broken" are not the same state

An empty language is a legitimate state — somebody just made one. Wreckage is
not, and is what a restore is for. `bkSound(slice, text)` is the difference: it
parses and checks the shape against `BK_SHAPE`. "Is there one" was the question
once and it was the wrong one — a slice holding `[[[not json` is *present*, so
the file was skipped, the wreckage was kept, and the next save wrote the
wreckage over the last good copy.

**A slice the app has never written is not unsound. It is absent, and absent is
what a restore is for.**

### 4. Nothing is deleted because a new shape arrived

Not "the current spec does not need it", not "it is an old format", not "to
save space", not "we restructured". If a deletion is genuinely necessary, write
down all five before writing any code — see the DELETE REVIEW below.

### 5. Data existence never depends on payment

See `docs/PAID_FEATURES.md`. Keeping somebody's language is not a paid feature,
because charging for it means answering, on the day it is lost, whether they
had paid.

## The save counter

`bkNo()` counts how many times a language has been written out. It goes up and
never down. **It is not a clock**, deliberately: a clock is what a sync reaches
for to decide which copy is newer, and a phone whose date is wrong then wins
every argument forever and nobody finds out why their work keeps going
backwards. A counter cannot be wrong about which of two writes came second,
because the second one made it.

Nothing reads it yet. It is here before the cloud is, because the day the cloud
arrives is the day it has to already be on every file written before then.

## DELETE REVIEW

Anything that removes data — a user action, a migration, a cleanup — gets this
written down **before** the code, in `docs/CHANGELOG.md` under the change:

```
DELETE REVIEW
  who deletes         user action / automatic
  when
  what exactly
  why
  recoverable?        from where, by whom, how long after
  does the backup survive it?
  anything to do with the plan?    (must be: no)
  migration / rollback
```

**Automatic deletion, pruning and cleanup are forbidden unless a written spec
asks for them.** Not "obviously stale", not "orphaned", not "over quota".

Today the app deletes in exactly these places, all of them a user pressing a
button and being asked to confirm: `delWord`, `ltDelete`, `delNote`, `postDel`,
`wipeAll`. `keep()` rotating a generation out is the sixth and is the price of
rule 1.

## Changing anything that saves

Every one of these is an affected case, and each has been a real failure
somewhere:

```
  a normal save
  two saves in a row
  a relaunch
  a restore
  a corrupt file
  an empty language
  a large language
  a failed write            (quota, storage reclaimed, no native bridge)
  the backup generations
  a migration from an older shape
```

`tools/backup-check.mjs` holds what can be held on this side of the native
call. It cannot press the Swift — there is no Swift on a Linux runner — so
`keep()` and `kept()` are confirmed on a device. See `docs/TESTING.md` §
device.

**Every one of `backup-check`'s failures was made to happen before it was
believed.** Do the same for anything added to it.

## Row level security

The phone talks to Supabase directly; there is no server of ours in front of
it. The app is a suggestion and `supabase/schema.sql` is the whole of the
security. A policy that is too wide breaks nothing visible: nothing throws,
every screenshot is right, and `npm test` is green, because there is only ever
one person in a test.

`npm run rls` is a second person. It applies `schema.sql` unchanged to an empty
PostgreSQL and tries, as B and as somebody with no account, to do all 34 things
the file says cannot be done. **Adding a policy means adding the line somebody
would use against it.** Run it whenever `schema.sql` changes — that is the only
time it can start failing.
