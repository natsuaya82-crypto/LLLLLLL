# Backlog

Things found and deliberately not done, with why. Nothing here is a bug that
loses somebody's work; everything here is safe to leave. It exists so that
"we know about that" is written down rather than remembered, and so that a
refactor, a feature and a rename never arrive in the same diff.

The order is the order to do them in.

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

- **`talk.js` / `grammar.js` shared logic.** Only if the shared thing is
  genuinely one rule. If pulling it out means `grammar.js` starts depending on
  `talk.js` to say something it can say itself, leave it. Not everything that
  repeats is duplication — `cffNum` and `csNum` in `otf5.js` are the standing
  example.

## A column has two places it cannot go, and both are deliberate

A language can be written in columns — `ttb-rl` and `ttb-lr` — and the
timeline sets one that way. Two places set it **across** instead, in the
direction the columns run. `dirFlat()` in `www/wsys.js` is the one place that
says so, and both read it from there.

**The composer's field** is a `<textarea>`. A textarea in a vertical writing
mode is not something this webview does: `lnFit()` sizes it by `scrollHeight`,
which is the wrong axis there, and the caret goes wherever the browser
feels like. Somebody who cannot type cannot post, which is worse than a field
that runs the other way from the post it makes. Fixing it means a composer
that is not a textarea.

**The card** is 1920×1080 with a band of letters across the middle of it. A
column has nowhere to go in that. Making a card of a vertical post honest
means a second composition — portrait, with the run down the middle and the
spelling and the meaning somewhere else — which is a design decision and not a
mechanical one. Worth doing; not worth guessing at.

Neither is a lie: a vertically written language set across the page runs the
way its columns run, which is what a horizontal banner of Japanese is.

## Not now, because a rename is not a fix

These are real breaches of the naming rule in CLAUDE.md and none of them is a
functional bug. Renaming an acted function means editing `act-map.js` twice —
the string and the function — so a rename lands in exactly the files a feature
change also lands in, and the diff stops being readable. Do them on their own,
in one commit, with `npm test` either side.

- `postsRead` / `savePosts` / `saveMe` — the prefix says which chapter owns a
  function, and `posts*` and `post*` are the same chapter under two names.
- `wSetFil` / `wSetSort` — `w*` is word data and `words*` is the word list;
  these two are the list's.
- `gh*` — `g*` is grammar and `ge*` is the glyph editor. `gh*` is neither.
- `notes.js` prefix mixing — `nt*` is the notebook; some of the file is not.

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

Three ways out, and choosing between them is the owner's:

- keep `ab` as the key rather than the name (a letter already carries `ab`,
  the roman it stands for; a rename does not touch it)
- refuse the rename at the point it would orphan a key, which is a paid screen
  being restricted by a plan the person is not on
- say it out loud on the day the plan ends, in `capLapse()`, which already
  exists for exactly this kind of sentence

The first is the smallest and probably right, but `ab` is not shown anywhere
and somebody who renames a letter has no idea it is there.
