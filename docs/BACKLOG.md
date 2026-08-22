# Backlog

Things found and deliberately not done, with why. Nothing here is a bug that
loses somebody's work; everything here is safe to leave. It exists so that
"we know about that" is written down rather than remembered, and so that a
refactor, a feature and a rename never arrive in the same diff.

The order is the order to do them in.

## A private account — asked for, and deliberately not now

There is no such thing today: every profile and every post is readable by
anybody. What exists is the public/private switch on a LANGUAGE page
(`wldHidden()` in the language room), which is a different thing.

Three pieces are missing and the middle one is the reason this is here:

1. a column on `profile`;
2. **following becomes a request.** It is one-sided and instant today, so an
   account that could be locked would need a pending state, a screen to
   accept or refuse on, and every place that counts or lists followers would
   have to say which kind it is holding;
3. `post_read` gated on "public, or mine, or an accepted follower of mine",
   where it is `true` today.

Owner asked, then said not yet 「いやめんどいから今はいいや」. Not started,
and nothing has been laid in for it — no column, no flag, no dead branch.
When it is picked up, two things are already decided by the shape of the
data: existing follows all count as accepted, so nobody loses a follower on
the day it ships; and whether locking an account keeps the followers it
already has is open.

## `form:add:<parent>` arrived at cold shows "this is gone"

`openAdd()` decides whether the draft is new by asking whether the route is
already the one it is about to open, so arriving AT that route with no draft --
`FORM_OPEN.add` rebuilding it after a reload -- takes the not-fresh branch,
leaves `addW` and `wEdit` null, and `wdFormHTML()` throws into `vForm`'s catch.
The screen says the form is gone.

Nobody can reach it on a phone: the route is not persisted across a launch, and
every way in from inside the app arrives with the draft already made. It is
reachable from `tools/shot.mjs`, which is how it was found -- the add sheet
cannot be photographed by name.

Left alone because the fix is a behaviour change to how a draft is decided to
be new, and that is its own commit rather than a passenger on the word forms.

## The face on `profile` does not follow the face on the phone

`netMakeProfile()` writes `profile.av` once, when the account is made. Drawing
a new letter, or setting a photograph, changes what `postAvatar()` answers and
does not change the row — so a notice can draw a face somebody has not worn for
a month.

Not a silent gap: a notice with no face draws no face and nothing throws, and a
post's own face is frozen onto the post anyway (rule 8), so nothing about the
timeline is wrong. What is wrong is only the little face beside "somebody liked
this".

The fix is one call in the place ME is saved, and the reason it is not here is
that it is a second write on a path that has none — every letter drawn would
otherwise be a request. It wants a "changed since last time" test, which is a
decision about how often, which is not this task's.


## Not now, because wordsheet.js has just moved

The new-word sheet and the word editor became one screen, and a word gained a
register, fields, an etymology and a changed-on date, all in the same day.
None of it has been on a phone yet. Touching the same file again before that
happens means the next thing found on the device has two changes to be
bisected against instead of one.

- **`wordsheet.js` input handling.** `wdSetLn` / `wdSetPos` / `wdSetReg` /
  `wdSetTags` / `wdSetEty` / `wdSetNt` are six one-line setters that all write
  `wEdit.<k>` and differ in the key. One `wdSet(k, v)` would do — `IN` already
  carries an argument before the value, which is how `wldSet('where', v)`
  works. Worth doing; worth doing after the device.

- **`goneBox()` is not used everywhere it could be.** `viewGone()` is the one
  place for "the thing you came back for is gone" and some screens still write
  their own empty state. Changes what is on screen, so it needs a screenshot
  and an approval, not a quiet commit.

- ~~**`talk.js` / `grammar.js` shared logic.**~~ Moot: `talk.js` went out with
  Studio. If the conversation comes back with the hosted model, so does this
  question, and the answer it had still holds — only if the shared thing is
  genuinely one rule, and not everything that repeats is duplication.
  `cffNum` and `csNum` in `otf5.js` are the standing example.

## A column no longer has anywhere it cannot go

*Both halves of this are done. Kept as the record of why it was not, because
the reasoning is the reason the fix took the shape it did.*

A language can be written in columns — `ttb-rl` and `ttb-lr` — and two places
used to set it **across** instead, in the direction the columns run, through a flattening
step that no longer exists.

**The composer's field** is a `<textarea>`, and a textarea in a vertical
writing mode was not something this webview would do: `lnFit()` sized it by
`scrollHeight`, which is the wrong axis there. It is typed into as a column
now, and `lnFit()` measures the width when the writing-mode is vertical.

**The card** was 1920×1080 with a band of letters across the middle of it, and
a column had nowhere to go in that. The answer written here was "a second
composition — portrait, with the run down the middle", and that is what it
got: `CARD_SHAPES` offers 16:9, 1:1 and 9:16, a language that runs down the
page opens on the tall one, and `cardPlace()` lays the line into whichever
shape is chosen rather than one fixed band. So the card sets a vertical script
vertically, and nothing is flattened on the way.

## ~~Not now, because a rename is not a fix~~ — done, and one of the four was
## wrong

*Done on 2026-08-22, one commit each, and kept as the record of what the entry
got wrong about itself.*

- ~~`postsRead`~~ → `postRead`.
- ~~`wSetFil` / `wSetSort`~~ → `wordsSetFil` / `wordsSetSort`.
- ~~`gh*`~~ → `geHint*`, and `GH*` → `GE_HINT*`. It turned out to be the silent
  demo canvas inside the glyph editor — ten functions that draw no text at all,
  which is why it is right in ten languages. `ge*`'s child, so it says so.
- ~~`notes.js` prefix mixing~~ → `note*` was `nt*` spelled long, so it went to
  `nt*`. `openNote` and `vNotes` stayed; `open*` and `v*` are in CLAUDE.md.

**`savePosts` and `saveMe` were listed here and should not have been.** The
entry put them beside `postsRead` as if all three were a `posts*`/`post*`
collision. They are not: they are `save*`, and `save*` is a family of exactly
ten — `saveKb` `saveLetters` `saveMe` `saveNote` `saveNotes` `savePosts`
`saveSnd` `saveStg` `saveWld` `saveWord` — every one of which names what it
saves. Renaming two of the ten would have left eight, which is the tangle
rather than the untangling.

The reason it is worth writing down: **the rule already allowed this and the
entry did not notice.** CLAUDE.md's own prefix list carries `open*`, which is
twenty functions and is a verb, not a chapter. So a verb family was never an
exception — what the rule is against is one chapter under two names, which is
what the other four were. Settled in the decision log, 2026-08-22.

## The question the card bug was actually about

Not a task. A thing to check for, whenever anything is added that shows
something from the past.

The card bug was not "a function is wrong". It was **the wrong owner for a
piece of data**: a post's shapes belong to the post and were being re-derived
from the dictionary that happens to be open. So for anything that displays
what somebody did earlier, ask which of the three it is:

| | |
|---|---|
| frozen at write time | put it ON the thing. A post's ink, its author, its language's name |
| read from the current state | correct for a word, an example, an alphabet — the making side |
| held from an earlier state | neither of the above, and the one to be suspicious of |

Places to look the day they exist: a ranking, a season record, a history, an
export of something older than the app's current shape. Today the app has
none of these — posts are the only past-tense data it holds, and post.js and
card.js are the only two files that render one, which is why the sweep after
the card bug found nothing else.

## A renamed letter loses its key on the free plan

Found while settling the keyboard. Not fixed, because the fix is a decision
about letters and the work in front of it is about keyboards.

`kbFixed()` — the keyboard the free plan gets — finds its keys **by name**:
`kbNamed('a')` walks `LETTERS` for one called `a`. That is the whole reason
free is a QWERTY at all, and it is why the free plan may not rename a letter.

A paid plan may. So:

1. paid, rename `a` to something else
2. the plan lapses
3. `ltStart()` runs, sees no letter called `a`, and **adds a new empty one**
4. the QWERTY's `a` key is that new empty letter

Nothing is lost — the renamed letter is still in `LETTERS` with whatever was
drawn on it — but it is not on the keyboard any more, and the key that took
its place is blank. Somebody whose plan ended would find a hole where a letter
they drew used to be, and nothing anywhere would say why.

**The first version of this entry named a fix that does not exist, and the
correction is the useful half.** It said: keep `ab` as the key rather than the
name, because a letter already carries `ab` -- the roman it stands for -- and a
rename does not touch it. Every clause of that is wrong now. `ltName()` answers
`nm`, then a digit's value, then `ab`; `l.nm` is written in one place in the
whole app and it is `import.js` reading a column out of somebody's spreadsheet.
So the rename on the letter page is `ltSetRoman()`, and `ltSetRoman()` writes
**`ab`**. Keying off `ab` is keying off the field the rename overwrites: the
same bug, spelled differently.

There is no field that survives the rename. `ltNew()` makes `id`, `st`, `ch`,
`nm`, `snd`, `chose` and sometimes `val`, and `ltStart()` puts the roman it
assigned into `ab` -- the only place that roman is ever recorded. So "key off
something the rename cannot reach" is not a smaller fix hiding behind the other
two; it is a new field on every letter, which is the data model, which is a
decision and not a tidy-up.

Three ways out, and choosing between them is the owner's:

- **remember the slot.** Give a letter the roman `ltStart()` created it for, in
  a field of its own that nothing but `ltStart()` writes, and let `kbFixed()`
  find keys by that instead of by the name. A letter made by hand has no slot
  and is on no key, which is already true. Costs a field on the eleven-slice
  `letters` store and therefore a migration -- an old letter has no slot, so
  either it is filled in by matching `ab` once (which is right for everybody
  who never renamed anything, and wrong in exactly the case this entry is
  about) or it is left empty and those keys stay blank until redrawn.
- **refuse the rename** at the point it would orphan a key -- a paid screen
  restricted by a plan the person is not on.
- **say it out loud** on the day the plan ends, in `capLapse()`, which already
  exists for exactly this kind of sentence.

None of the three is small. The first is the only one that keeps the letter on
the key, and it is the one that touches stored data.

## `tools/verify-script.mjs` runs now, and says nineteen things

It was recorded as "broken, a font experiment, not in the gate". Two of those
three were wrong.

What was wrong with it was three things, and the first two are fixed:

1. `gstep()` — renamed `geStep()` and this file was missed.
2. `scriptDrawn()` — went out in `9226dd6`, when the font stopped being built
   from anything but the letters. `scriptGlyphDefs().defs.length` is the same
   number now.
3. **every mouse click was landing on `#splash`.** It waited 250 ms after
   `goto` and the splash holds for the later of 900 ms and boot, so the point
   editor was never touched at all. Every other check in `tools/` waits for
   `#splash` to detach; this one predates the selector.

With those three fixed it executes end to end for the first time in a long
while and reports **13 ok, 19 FAIL**. That number is not nineteen bugs. The
editor has changed a great deal since this was written — the rail it asks for
is "two marks" and there are four, the circle and arc section fails wholesale,
and the snap failures are one lattice step out in y and not in x, which reads
more like the test's own 800-unit mapping than like `geSnap`.

So each of the nineteen needs the same question asked of it: **is the app
wrong, or is the test old?** Until that triage is done this cannot go in the
gate, because a check nobody believes is a check nobody reads.

It is worth doing. It is the only thing that proves the whole PUA font path
end to end — draw, save, build the font, install it, and confirm the browser
is really using it rather than falling through to a serif. Nothing else in the
gate can see that.

## A font for the letters somebody drew — held

The strokes a person draws are a skeleton, and how it is inked is a separate
choice: 角 / 細 / 太 / 丸 / 筆 / 平筆, chosen per language, stored on the
`script` slice, changing nothing anybody drew and therefore reversible on any
day. `GPEN` in `glyph.js` is that choice today and it is one constant —
`{width:60, angleDeg:0, contrast:1.0, curve:72}` — used by the font builder,
by `inkStrokes`, and by `share.js` when the shapes are cut for the system
keyboard, so all three would have to read the language's pen instead.

`otf5.js` already takes the nib's width, angle and aspect, which is five of
the six. 筆 is the sixth and is not a nib: the width varies along the stroke
and the end is one of 留 / 羽 / 払. `tools/font-mock.mjs` renders that —
including how each stroke's ending is read off the drawing rather than asked
about — and is in the repo. It is not a check and is not in the gate.

**Held by the owner on 2026-08-20: 「いったんフォントなしで」.** Nothing in
`www/` was changed for it. Do not start this without asking.
