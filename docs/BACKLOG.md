# Backlog

Things found and deliberately not done, with why. Nothing here is a bug that
loses somebody's work; everything here is safe to leave. It exists so that
"we know about that" is written down rather than remembered, and so that a
refactor, a feature and a rename never arrive in the same diff.

The order is the order to do them in.

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
