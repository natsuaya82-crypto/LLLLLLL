# Data safety

「データ消えるのだけはありえない」

**Everything a person makes lives on the server** — the `slice` rows, every
slice of the language, and **nowhere else**: `LSL` in `www/core.js` holds a
slice while the app is running, in memory, and the app closing takes it.
**One place, and there is no second.** Losing somebody's language is not a
degraded experience; it is the end of months of their work.

## The four ways it can go

Three of these four are ordinary events, not disasters:

1. the app is deleted
2. the phone is replaced without a backup
3. WKWebView reclaims its storage
4. a migration goes wrong

**A SIGNAL ANSWERS 1–3, AND IT IS THE WHOLE ANSWER NOW.**
「オンラインは一本化ね？」「保存としたらオンラインおしまい」「今ファイルもいらん。
オンラインのみで行こうってことになってる今後オフライン対応する時にまた考える
ことにした」 OWNER 2026-09-04.

A save goes up the moment it is made — `bkTouch()` is the one line every
writer passes through and `netSaveUp()` (`www/net.js`) sends the slices that
moved — and `netLangsDown()` at the foot of `www/boot.js` brings back every
language this ACCOUNT has that this phone has not got. Sign in on any handset
and the language is there.

**There was a third place and it is deleted.** `www/backup.js` wrote the open
language into `Documents/Languages/`, three generations deep, where iOS put it
in the device backup and the Files app could show it. It existed because a
language went up twice a session — at launch and at the door — so there were
hours when an afternoon's work was on one handset and nowhere else. **That
window is what closed**, and the file went with it. The DELETE REVIEW is in
`docs/CHANGELOG.md`, 2026-09-04.

**What it costs is written here rather than left out.** With no signal there is
one copy and it is `localStorage` on that handset. 「電波が無いときはログイン
できない」 is the owner's answer to the screens; for the data the answer is that
a language made offline is unbacked until there is a signal, and nothing stands
behind it. **Offline is not a supported state any more** — it is a phone on its
way back to one.

## The rules


### 1. A save reaches the server, and a merge never destroys what is there

`netSlice1()` in `www/net.js` is the only thing that puts a slice up, and both
roads call it — `netSaveUp()` on every save, `netLangSync()` at launch. It
MERGES: `syMerge()` (`www/sync.js`) adds both sides and lets neither win by
being newer, so a word added here and a word added there are both added.
「そりゃあ両方足すだろ」

**A write that only wrote would destroy.** `slice`'s primary key is
`(language, kind)` and `no` guards nothing, so a phone that sent what it was
holding would take out whatever another one had added, silently. That is why
there is one road and not a short one beside it.

`again-check` holds it: a save arrives without a launch, only the slices that
moved are asked for and sent, and a word deleted here stays deleted.

### 2. A restore never overwrites a slice that is there

It fills in one that is **missing** and stops. This is the one that matters:
**the way a copy destroys somebody's work is by winning.** `netLangsDown()`
and `netLangBack1()` both work that way — a slice already on the phone is
stepped over, whatever the server is holding.

`langMigrate()` has the same rule for the same reason — it **copies** from the
eight old flat keys and never removes what it read. It runs once, on a phone,
against the only copy of something somebody spent months on. Copying costs a
few hundred kilobytes and cannot lose anything; moving could.

### 3. "Empty" and "broken" are not the same state

An empty language is a legitimate state — somebody just made one. Wreckage is
not. `netKeeps(mine, put)` is where this lives now: a merge that came back
holding LESS than what is here is refused and recorded in `NET_SHRANK`, and
the phone keeps what it had.

**A slice the app has never written is not unsound. It is absent**, and absent
is what `netLangsDown()` fills in.

### 4. Nothing is deleted because a new shape arrived

Not "the current spec does not need it", not "it is an old format", not "to
save space", not "we restructured". If a deletion is genuinely necessary, write
down all five before writing any code — see the DELETE REVIEW below.

### 5. Data existence never depends on payment

See `docs/PAID_FEATURES.md`. Keeping somebody's language is not a paid feature,
because charging for it means answering, on the day it is lost, whether they
had paid.

## A shorter list is not a deletion, and the difference has to be said out loud

When a plan ends the dictionary screen lists the first hundred words and no
more (`docs/PAID_FEATURES.md` § when a plan ends). That is allowed and the rule
above is untouched: `WORDS` is not written, `save()` writes every word,
`netSaveUp()` sends every word, and `findWord()` finds every word. One list on
one screen is shorter.

It is in this file because it is the one thing in the app that **looks** like a
deletion. Somebody opening it to find four thousand nine hundred words gone
from a list has no way to tell which of the two it is, and the difference is
the whole of their trust in the app. So:

- the foot of the list says how many are not on it, every time
- the day the plan changes, the app says it once, in a sheet: nothing has been
  deleted, it is on the server, it comes back
- `plan-check` holds both halves — past the ceiling, on the free plan,
  `findWord()` still finds an unlisted word and a save still sends every slice
  up. Both were watched failing with the bug put back

**Anything else that shortens what is shown gets the same three.** A list that
is quietly short and says nothing is indistinguishable from data that is gone,
and it will be reported as data that is gone.

## A voice is a file, and nothing tidies files away

A post can carry thirty seconds of somebody's own voice. The bytes go up with
the post; **the recorder writes a file in `Documents/Voices/` first**, so
nothing depends on there being a signal at the moment somebody speaks, and the
post carries the name — `post.vo = {f, ms}`. Three things follow about that
file, and none of them is optional:

- **The file is written before the post is stored.** A name on a post that
  points at nothing is a post claiming a voice it does not have. If the write
  is refused — no bridge, no room — the post is made **without** one and says
  so. What somebody typed is never lost because a microphone was.
- **A name is never written over.** `keepVoice` refuses a file that already
  exists rather than replacing it. Every recording is given a fresh name, so a
  collision is a bug, and the answer to a bug is not to overwrite a voice.
- **A voice file is removed by three things and by nothing else, and every one
  of them is somebody taking that recording away by hand.** `voDropFile()` in
  `www/rec.js` is the only road to `dropVoice`, and it has three callers:

  ```
    postDelGo    www/post.js   the post it was on is deleted   「投稿消した声も消していいよ」
    draftDropGo  www/post.js   the draft it was on is thrown away
    voDrop       www/rec.js    the recording is taken off in the composer
  ```

  In all three the file's name comes off the thing being deleted and from
  nowhere else. **Nothing walks that folder**, nothing removes a file because
  nothing points at it, and nothing tidies up on launch. The post is removed
  first and the file second — a file that cannot be removed must not leave the
  post standing.

  **Only the first has its DELETE REVIEW written.** `postDelGo`'s is in
  `docs/CHANGELOG.md` under 「投稿消した声も消していいよ」. The other two
  arrived on 2026-09-03 with the owner's decision quoted
  （「声は投稿上で再生できるよね？下書き消した時にはいらなくない？」）and no
  block — so the decision is made and the record required by the DELETE REVIEW
  below is missing. Written here rather than left to be noticed again.

**A posted voice is on the server**: `netUpVoice()` puts it in the `post-media`
bucket with the post it belongs to. The file this phone recorded stays in
Documents, which is what iOS puts in the device backup, so a recording made
with no signal survives until it can go up. **A voice is the post's rather than
the language's**, so nothing about a slice carries one.

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
  is it still on the server?
  anything to do with the plan?    (must be: no)
  migration / rollback
```

**Automatic deletion, pruning and cleanup are forbidden unless a written spec
asks for them.** Not "obviously stale", not "orphaned", not "over quota".

**Where the app deletes is not written here.** It was, and the list said five
while the app deleted in twenty-one places, because nothing asked the code
whether it was still true. A list of deletions that is wrong is worse than no
list: it is read as 「these are all of them」 by the next person deciding
whether a DELETE REVIEW is needed.

`tools/del-check.mjs` (`npm run del`) is where it lives now, and it is asked of
`www/act-map.js` every run. Every button whose name reads like a deletion has
to say three things there — what it takes out of storage, whether the person is
asked first, and, **when something is taken and nobody is asked, why that is
right**. A new one is red until somebody answers. So is a confirm that quietly
went away, and so is a line describing a button no screen carries any more.

One deletion is outside that table on purpose, because it is not a button:

- `lsWipeAcct()` taking the eight flat keys (`www/core.js`) happens under
  `wipeAll`, which is in the table, and is written out in
  `docs/DATA_MODEL.md` § what an account deletion actually takes

## Changing anything that saves

Every one of these is an affected case, and each has been a real failure
somewhere:

```
  a normal save
  two saves in a row
  a relaunch
  a language coming back down onto a phone that has none of it
  a merge that comes back SHORTER than what is here
  an empty language
  a large language
  a failed write            (quota, storage reclaimed)
  a save with no signal, and the signal returning
  a migration from an older shape
```

`tools/again-check.mjs` holds them, against a server made of two arrays behind
`netSend()` — so `netSaveUp()`, `netSlices()` and the merge all run for real.

**Every one of its failures was made to happen before it was believed.** Do the
same for anything added to it.

## Row level security

The phone talks to Supabase directly; there is no server of ours in front of
it. The app is a suggestion and `supabase/schema.sql` is the whole of the
security. A policy that is too wide breaks nothing visible: nothing throws,
every screenshot is right, and `npm test` is green, because there is only ever
one person in a test.

`npm run rls` is a second person. It applies `schema.sql` unchanged to an empty
PostgreSQL and tries, as B and as somebody with no account, every attempt in
its own `CASES` list — the file says cannot be done. **The number is not
written here**, because a number copied into prose is a number that rots: the
tool prints `CASES.length` and `SHAPE.length` when it passes, and that is where
to read it. **Adding a policy means adding the line somebody
would use against it.** Run it whenever `schema.sql` changes — that is the only
time it can start failing.
