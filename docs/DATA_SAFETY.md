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

A save goes up when Save is pressed 「保存を押したら」 OWNER 2026-09-24 — on a
screen with a Save its draft goes up with the Save (`keepSave()`), and on a
screen with none the press is the save (`bkTouch()`, the one line every writer
passes through); `netSaveNow()` (`www/net.js`) sends the slices that moved — `netLangsDown()` says which languages this ACCOUNT has, and
`netLangFill()` brings one down when a screen drawn from it is arrived at
(「読むのは開いた画面の分だけ」 OWNER 2026-09-23). Sign in on any handset
and the language is there.

**There was a third place and it is deleted.** `www/backup.js` wrote the open
language into `Documents/Languages/`, three generations deep, where iOS put it
in the device backup and the Files app could show it. It existed because a
language went up twice a session — at launch and at the door — so there were
hours when an afternoon's work was on one handset and nowhere else. **That
window is what closed**, and the file went with it. The DELETE REVIEW is in
`docs/CHANGELOG.md`, 2026-09-04.

**NOT SAVING IS THE SPEC.** 「保存するタイミングでエラーが起きるなら、保存
されないし。そう言うもんじゃないの？オンラインアプリってどうなの？」 OWNER
2026-09-05. With no signal there is nothing to send, so the save does not
happen and 「電波が無いときはログインできない」 is what the screens say.
**Offline is not a supported state any more** — it is a phone on its way back
to one.

**What a failure may not do is take the work with it.** 「なら失敗して残るに
するべき。」 Same decision, and it is the half that is a rule: what somebody
made stays on the screen, the app says so, and pressing save again is a save
that can land. `saveTry()` in `www/core.js` is the one place a write to this
phone answers for whether it landed. `docs/FEATURE_RULES.md` 2026-09-05 has
the whole of it.

## The rules


### 1. A save reaches the server, and a merge never destroys what is there

`netSlice1()` in `www/net.js` is the only thing that puts a slice up, and both
roads call it — `netSaveNow()` on a save a person makes, `netLangSync()` at the
door (what the walk made). **A launch sends nothing** (2026-09-23,
`tools/quiet-check.mjs`): until a language's slices have come down in this run
of the app, what is on the screen is the picture, `langLocked()` refuses every
save onto it, and a slice goes up only when a PERSON wrote it
(`LTOUCH` in `www/core.js`) — a slice the app itself changed inside a server
answer (the free alphabet topped up, a migration) goes with the next thing
somebody saves in that slice and never on its own. It
MERGES: `syMerge()` (`www/sync.js`) adds both sides, so a word added here and
a word added there are both added 「そりゃあ両方足すだろ」 — and where the two
disagree about ONE thing (a value, the same row changed on both, a row removed
on one and changed on the other) **the side a person changed later keeps it**
「普通後から変えたほうになる？」 OWNER 2026-09-04. When is `LTOUCH`'s time on
this phone and `slice.ed` on the server.

**A write that only wrote would destroy.** `slice`'s primary key is
`(language, kind)`, so a phone that sent what it was holding would take out
whatever another one had added, silently. That is why there is one road and
not a short one beside it — and why the server refuses a write put together
against a version that has since moved (`stale`, `keep_newer()` in
`supabase/schema.sql`): the phone reads again and merges again.

`again-check` holds it: a save arrives without a launch, only the slices that
moved are asked for and sent, a word deleted here stays deleted, a `stale`
write is merged again with both phones' words kept, and the later change of
one value stands. `rls-check` holds the server half.

### 2. A restore never overwrites a slice that is there

It fills in one that is **missing** and stops. This is the one that matters:
**the way a copy destroys somebody's work is by winning.** `netLangFill()`
works that way — a slice already on the phone is stepped over, whatever the
server is holding.

Reading what an older version left on the disk has the same rule for the same
reason — `slMine()` (`www/core.js`) reads the old `lingua.<id>.<slice>` key,
`slWr()` never writes there, and nothing but a person deleting a language or
an account removes it (`slRm()`). That key can be the only copy of
something somebody spent months on. Copying costs a
few hundred kilobytes and cannot lose anything; moving could.

### 3. "Empty" and "broken" are not the same state

An empty language is a legitimate state — somebody just made one. Wreckage is
not. `netKeeps(mine, put)` is where this lives now: a merge that came back
holding LESS than what is here is refused and recorded in `NET_SHRANK`, and
the phone keeps what it had.

**A slice the app has never written is not unsound. It is absent**, and absent
is what `netLangFill()` fills in.

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
`netSaveNow()` sends every word, and `findWord()` finds every word. One list on
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

## A voice is a file on the server, and nothing of it is kept on the phone

A post can carry thirty seconds of somebody's own voice. **It goes into the
`post-media` bucket the moment the recording ends** (`voKeep()`, `www/rec.js`)
and the post or draft being written carries the path — `vo = {f, ms}`.
「録音は投稿・下書きと一緒にサーバーにある」「端末に持たせるものはない」 OWNER
2026-09-26. Nothing is written on the phone, so a draft opened on another phone
has its voice, and a post that is sent makes the same path its `vu`
(`netUpVoice()`), with nothing sent twice. Recording needs a signal; one that
cannot go up is 「録音を保存できませんでした」 and nothing is kept.

- **A voice is removed by somebody taking that recording away**, and
  `voDropFile()` in `www/rec.js` is the one road — from the bucket for a path,
  from `Documents/Voices` for a file an earlier version wrote:

  ```
    postDelGo    www/post.js   the post it was on is deleted   「投稿消した声も消していいよ」
    draftDropGo  www/post.js   the draft it was on is thrown away
    voDrop       www/rec.js    the recording is taken off in the composer
  ```

  A post that has gone up names its voice only as `vu`, so none of these takes
  a sent post's recording out from under it except deleting that post.
- **What an earlier version left in `Documents/Voices`** is read while a draft
  or an unsent post names it, and swept when nothing on the phone does
  (`voSweep()`: at the launch, and when an account is deleted — after that
  account's copies are gone). DELETE REVIEWs in `docs/CHANGELOG.md`
  2026-09-25 and 2026-09-26.
- **Deleting an account takes its voices from the bucket** — the posts' and the
  drafts' (`netDropMe()`).

**A voice is the post's rather than the language's**, so nothing about a slice
carries one.

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

- `lsWipeAcct()` (`www/core.js`) taking that account's keys off the phone
  happens under `wipeAll`, which is in the table, and is written out in
  `docs/DATA_MODEL.md` § what an account deletion actually takes
- `sharePush()` emptying the App Group (`www/share.js`, `LinguaShare.swift`
  `write`) when no account is signed in. The three files there are copies
  rebuilt from the open language on every change, so a file handed empty is
  a file that is not there; the DELETE REVIEW is `docs/CHANGELOG.md`
  2026-09-23. `assets-check` counts every file the keyboard and the widget
  read and asks that `write` answers for each one.

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
`netSend()` — so `netSaveNow()`, `netSlices()` and the merge all run for real.

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
