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

## The order

An idea does not become code by being reasonable. It becomes code by being
decided, written down, and then built.

```
  idea
    ↓
  OWNER DECISION            the owner says what it is
    ↓
  docs/FEATURES.md          the row, and its status
    ↓
  docs/PAID_FEATURES.md     if money is involved
  docs/DATA_MODEL.md        if it stores anything new
  docs/DATA_SAFETY.md       if it saves, deletes or migrates
  docs/CHANGELOG.md         if existing data or behaviour moves
    ↓
  implementation
    ↓
  tests, including a regression watched failing
    ↓
  device verification       if docs/TESTING.md § device says so
    ↓
  owner confirmation
    ↓
  merge
```

**Writing the code first and the spec afterwards is not allowed.** Reading the
code first is fine and often necessary — but "this is what the code does" and
"this is what it should do" are different sentences and must never be written
as one.

### Five states, and they are not the same

```
  BACKLOG          might happen                      docs/BACKLOG.md
  OWNER DECISION   has been decided                  the log below
  SPEC             this is how it behaves            FEATURES.md + the docs
  IMPLEMENTED      it is in the code                 git
  VERIFIED         checks green, and a phone         CHANGELOG.md, marked
```

**Something in BACKLOG is not decided.** Do not read a backlog entry as
permission. Do not read the absence of an entry as permission either.

## Owner decisions are specifications

When the owner decides anything about behaviour, a threshold, a limit, the
free/paid boundary, retention, deletion, migration, how past data behaves,
timing, what gets selected, or what a screen does — **that is a specification,
not an instruction for the task in hand.**

Afterwards:

1. record it in the log below, and in whichever `docs/` file it governs
2. implement exactly that, and nothing adjacent
3. do not reinterpret it into a more reasonable rule
4. do not quietly generalise it to a nearby behaviour
5. if existing code contradicts it, **report the contradiction** — do not go
   and change unrelated code to match
6. a later session reads the decision before changing anything in that area

**If a decision conflicts with a rule already written down: STOP.** Report the
existing rule, the new decision, the code affected, the data affected, and what
a migration would have to do. Do not resolve it yourself. Neither side of a
conflict is automatically right, and picking one quietly is how a spec gets
lost.

And the other direction, which is the same rule: **a decision once made is not
re-opened by a later session because a different shape seems more natural.** If
it seems wrong, say so and stop; do not implement the better idea.

## Owner decision log

Newest first. One entry per decision. The **decision itself** matters more than
the reasoning — a reason can be re-derived, a decision cannot.

```
### Decision
- Date:
- Area:
- Decision:
- Reason:
- Affected features:
- Affected data:
- Affected docs:
- Implementation status:
```

Entries below are transcribed from decisions the repository already records
verbatim, in `CLAUDE.md` and in the code comments that quote them. Nothing here
was inferred: where the wording is the owner's it is quoted, and where a
decision has never been made the row in `docs/FEATURES.md` says **open**
instead of appearing here.

### Decision
- Date: 2026-08-13
- Area: **What happens when a plan ends** — every capability at once
- Decision: **the app goes back to the shape the free plan has, and nothing a
  person made is deleted.**
  1. The dictionary **lists the first 100 words** it was given, in the order
     they were made. The rest are not on screen. Every one of them is still in
     `WORDS`, in `save()`, in the backup and in the file in Documents, and the
     app reads the whole dictionary for itself — a post, a gloss, a spelling,
     an example. Only the list is short.
  2. The writing goes back to an alphabet, the keyboard to the fixed QWERTY,
     the direction to left→right. All three were already true of `wsys` and
     `kb`; `dir` joins them.
  3. A stage of somebody's own stays on the list and can no longer be added to
     or deleted.
  4. **The day it happens the app says so, once**, in a sheet: nothing has
     been deleted, it is all in the backup, and it all comes back on
     resubscribing. `capLapse()` in `core.js` decides when; `openCapLapse()`
     in `settings.js` is what it says.
  5. The foot of the dictionary says how many are not listed, every time.
- Reason: 「a にしたら最初の1ヶ月で作りきったらそのあと課金されねえだろ」
  「非表示や」「課金切れたら、ポップ出して、バックアップには保存されてるよーって
  一回出せばok」
- Affected features: the dictionary, search, the relation picker, the writing
  system, the keyboard, direction, grammar stages, the plans screen
- Affected data: **none.** Nothing is written, moved or removed. `SET.planWas`
  is added — the plan the app last saw, so a change can be noticed however it
  happens (set by hand today, StoreKit tomorrow, found lapsed at launch)
- Affected docs: PAID_FEATURES.md, DATA_SAFETY.md, DATA_MODEL.md, CHANGELOG.md
- Implementation status: implemented; code confirmed, not device confirmed
- **The rule it is measured against**: `docs/DATA_SAFETY.md` forbids removing
  what somebody made. It does not forbid a shorter list. The line between the
  two is the whole of this decision, so `backup-check` now holds it: on the
  free plan, past the ceiling, `findWord()` still finds a word that is not
  listed and `bkPack()` still carries every one of them. Both were watched
  failing with the bug put back.

### Decision
- Date: 2026-08-13
- Area: Which way a language is written
- Decision:
  1. A language has a **direction**, and it is the language's — not the
     person's and not the post's to choose. Four of them: left→right,
     right→left, and vertical with the columns running right→left or
     left→right.
  2. **Reading is free.** A post written in any of the four is shown that way
     to everybody, on every plan.
  3. **Setting it is Plus.** Choosing a direction, and posting in one, is a
     paid capability.
- Reason: 「縦書き、右→左 左→右の投稿」「言語の設定でしょ右左とかは」
  「無料でも言語の向きは見ることはできる。でも設定してsnsとかに登校するのは
  有料会員のみ」 The vertical column order: 「右から左と左から右の両方」
- Affected features: the writing system screen, the composer, the timeline,
  the card
- Affected data: `SCRIPT.dir` in the **`script` slice** — the language's, so
  it is in the backup and travels with the language. **Frozen onto the post**
  as `post.dir`, for the same reason `ink` is: a reader has neither the
  writer's alphabet nor their language's settings
- Affected docs: FEATURES.md, DATA_MODEL.md, PAID_FEATURES.md, CHANGELOG.md
- Implementation status: implemented; code confirmed, not device confirmed
- What happens when the plan ends is the decision below: the language runs
  left→right while it is on free, and `SCRIPT.dir` is kept untouched.

### Decision
- Date: 2026-08-13
- Area: Posts — letters on an image, the three details
- Decision:
  1. Letters are placed **freely**: pick a letter, put it anywhere on the
     picture, drag it with a finger, size it with a slider. No rotation.
  2. They are **baked into the picture** when the post is sent. The post
     carries one image and nothing else.
  3. Free, on every plan.
- Reason: 「なんなら画像に自作文字を貼って投稿できるようにすれば勝手に広がるよ」
  「画像と自作文字貼るのは無料 投稿に貼るに決まってるでしょ」 Placement:
  「自由配置」 Storage: 「画像に焼き込む」
- Affected features: composer, timeline, card
- Affected data: `post.pic` only. Baking means the picture IS the past tense —
  there is nothing on the post that has to be re-rendered with an alphabet the
  reader does not have, which is the same guarantee `ink` gives by a different
  route
- Affected docs: FEATURES.md, DATA_MODEL.md, CHANGELOG.md
- Implementation status: not started

### Decision
- Date: 2026-08-12
- Area: A post shown three ways — the four details
- Decision:
  1. The natural-language layer is translated **when the post is written**,
     using **the reader's own device AI, borrowed** — not a service of ours.
     No key of ours, no server of ours, no cost per post. The translation is
     attached at the moment of posting and travels with the post.
  2. A word the reader's dictionary has no word for stays in the natural
     language and is shown **in red**, so the gap is obvious.
  3. Layer 3 is Plus. Free gets three a day.
  4. The natural language is always on screen. Layer 3 appears on a button.
- Reason: 「翻訳はユーザーのaiを拝借します。投稿するタイミングでai翻訳がつくので」
  「まずオフラインで起動できないやろSNSは」「1日3回やろ」
  「自然言語のまま残して赤文字とかにする。この単語ないのがわかりやすいように」
  「非人工言語は常に表示。自分の言語への変換はボタンで出現」
- Affected features: composer, timeline, post, dictionary
- Affected data: **new, frozen on the post** — `post.tr`, a translation per
  language code
- Affected docs: FEATURES.md, DATA_MODEL.md, PAID_FEATURES.md
- Implementation status: the seam and layer 3 are being built now. The
  translator behind the seam is not, and is not blocking: posting works with
  the seam returning nothing, exactly as `AI_SEAM` already works for the
  generators.

#### And the standing instruction that goes with it

**Build for the online and AI parts now; wire them up later.** An unbuilt
service is not a reason to stop — it is a reason to put a seam where it will
attach, and to make everything on this side work with the seam answering
nothing. `AI_SEAM` in `www/glyph.js` is the pattern and it predates this.

Reporting "there is no hosted model" as a blocker was wrong. It is a fact
about today, not about the design, and the design is the part being asked
for.

### Decision
- Date: 2026-08-12
- Area: A post shown three ways
- Decision: A post can be shown as (1) the writer's own drawn letters, (2) what
  it means in a natural language, and (3) that same thing rendered into the
  READER's own conlang. "Unlimited translation" on the Plus list means this.
- Reason: 「相手の自作文字の投稿／英語など非人工言語／自分の人工言語へ変換した翻訳
  ／この3つが出せたらおもろいやん」
- Affected features: timeline, post, dictionary
- Affected data: layers 1 and 2 are already frozen on the post (`ink`, `mn`).
  **Layer 3 must NOT be frozen** — it is the reader's own language read now,
  and it is supposed to improve as their dictionary grows
- Affected docs: FEATURES.md, DATA_MODEL.md
- Implementation status: 1 and 2 are built. 3 is not. Four things are still
  open: what layer 2 shows when the writer's language is not the reader's; what
  happens to a word the reader has no word for; whether layer 3 is free or
  Plus; and how the three are presented.
- Note: this does not overturn the decision at the head of `www/post.js` (no
  machine reads an invented language on the author's behalf). Layer 3 runs the
  other way, from a sentence the author confirmed into the reader's own words.

### Decision
- Date: 2026-08-12
- Area: Plus — what it contains
- Decision: Plus is: unlimited words; unlimited letters of your own; the
  writing systems that are not an alphabet; choosing a sound; grammar stages
  of your own; CSV in and out; keyboard customisation, including flick and
  putting any letter on any key in any position; everything Free has; cloud
  storage (deferred, see the entry below); vertical and right-to-left posts;
  and unlimited translation (definition still open — see FEATURES.md).
- Reason: the owner's list, given in full.
- Affected features: every `plus` row in FEATURES.md
- Affected data: none by itself
- Affected docs: FEATURES.md, PAID_FEATURES.md
- Implementation status: `words` `letters` `wsys` `snd` `gram` `data` `file`
  `kb` are implemented, and flick and free placement are already in the
  keyboard editor. Vertical / RTL and translation are not built.

### Decision
- Date: 2026-08-12
- Area: Plus — the AI
- Decision: The AI is not part of what Plus sells. Plus gets a few AI chats a
  day; unmetered AI is not a Plus capability.
- Reason: 「aiはaiチャットが1日数回できるくらいで、基本機能にはついてない」
- Affected features: AI suggestions, AI conversation
- Affected data: `SET.aiDate` / `SET.aiN` (the daily counter)
- Affected docs: PAID_FEATURES.md, FEATURES.md
- Implementation status: **NOT implemented, and the code contradicts it.**
  `CAN.ai` is `'plus'` today, which makes the model unmetered at Plus. Exactly
  how many chats a day Plus gets is a threshold and has not been decided;
  `AI_FREE_DAILY` is 3 for everybody who is not unmetered.

### Decision
- Date: 2026-08-12
- Area: Cloud storage
- Decision: Cloud storage is a Plus feature, deferred. It will be built once
  there are enough users to justify the $25/month Supabase tier.
- Reason: the owner's, on cost.
- Affected features: cloud sync
- Affected data: none yet. When built: every slice, and a conflict-resolution
  rule which is the owner's to decide, not a tool's
- Affected docs: FEATURES.md (planned), PAID_FEATURES.md
- Implementation status: not started. **The plans screen and the settings
  screen currently present it as available**, which is a promise the app
  cannot keep — awaiting a decision on how to word it until then.

### Decision
- Date: 2026-08-12
- Area: Posts — images
- Decision: A post can carry an image. Letters somebody drew can be placed on
  that image and posted.
- Reason: the owner's. 「なんなら画像に自作文字を貼って投稿できるようにすれば
  勝手に広がるよ」
- Affected features: composer, timeline, card
- Affected data: **new** — an image on a post, and where the letters sit on
  it. Both must be FROZEN onto the post (`docs/DATA_MODEL.md` § the three
  kinds): a reader does not have the writer's alphabet, so the shapes have to
  travel exactly as `ink` does
- Affected docs: FEATURES.md, DATA_MODEL.md, DATA_SAFETY.md (posts grow by the
  size of an image), CHANGELOG.md
- Implementation status: not started. Free or Plus is not yet decided; storage
  (data URL on the post vs. a file) is not yet decided.

### Decision
- Date: 2026-08-12
- Area: The word sheet
- Decision: Making a word and editing one are the same screen. Opening a word
  shows it; editing is behind a button.
- Reason: 「単語追加の時点で編集できるようにしろよ。編集でも見えるように当たり前だろバカか」
  「作成編集それぞれ同じ画面で」「開いた時は閲覧、編集ボタンで編集」
- Affected features: dictionary, word sheet
- Affected data: none
- Affected docs: FEATURES.md, CHANGELOG.md
- Implementation status: implemented; code confirmed, not device confirmed

### Decision
- Date: 2026-08-12
- Area: A word's fields
- Decision: A word carries register, fields, origin and a changed-on date, in
  addition to what it had.
- Reason: asked for as the four things a dictionary needs and this one lacked.
- Affected features: dictionary
- Affected data: `words` slice — four optional keys, absent unless filled in
- Affected docs: DATA_MODEL.md, FEATURES.md, CHANGELOG.md
- Implementation status: implemented; code confirmed, not device confirmed

### Decision
- Date: 2026-08-12
- Area: Cards of posts
- Decision: A card of a post is drawn from `post.ink`, never re-derived from
  the open dictionary. This holds even though every post today is the person's
  own.
- Reason: the owner's audit: 「現在開いている言語の文字体系で他人の投稿を描画して
  しまう可能性がある」 — do not stop at "my own posts still look right".
- Affected features: card, timeline
- Affected data: none stored; `postInkOK()` decides drawability
- Affected docs: DATA_MODEL.md, CHANGELOG.md, CLAUDE.md rule 12
- Implementation status: implemented; code confirmed, not device confirmed

### Decision
- Date: 2026-08-12
- Area: Number of languages
- Decision: One language per person, on every plan. Not a price.
- Reason: there is no way to make a second anywhere in the app, so a plan
  promising more would promise a button that does not exist.
- Affected features: languages
- Affected data: `LANG_MAX`
- Affected docs: PAID_FEATURES.md, FEATURES.md
- Implementation status: implemented

### Decision
- Date: 2026-08-11
- Area: Data safety
- Decision: Losing somebody's language is not acceptable under any
  circumstance. A backup lives in Documents; a restore fills in what is
  missing and never overwrites.
- Reason: 「データ消えるのだけはありえない」
- Affected features: backup, restore
- Affected data: all eleven slices
- Affected docs: DATA_SAFETY.md, CLAUDE.md rule 11
- Implementation status: implemented; **device verification outstanding**
  (9 items, `docs/TESTING.md` § device)

### Decision
- Date: 2026-08-11
- Area: The free plan
- Decision: The free plan is your own shapes for a–z, `!`, `?` and the digits —
  thirty-eight slots, drawing only. Nothing on free adds, renames or deletes a
  letter. The keyboard is a fixed QWERTY with the drawn letters substituted in,
  with nothing to set.
- Reason: 「無料の場合はもう最初からa〜z!?が置いてあってそこから書くだけで追加する
  自体がない」「キーボードもqwerty配列がそのまま自作文字に置き換わるだけ。なんの設定
  もできない」
- Affected features: alphabet, keyboard, letters
- Affected data: `letters` slice (`ltStart` tops up, never rearranges)
- Affected docs: PAID_FEATURES.md, CLAUDE.md § what the free plan is
- Implementation status: implemented

### Decision
- Date: 2026-08-11
- Area: The free keyboard's face
- Decision: One face. Digits above the QWERTY, `!` and `?` at the ends of the
  space bar, delete two keys wide. No second page.
- Reason: 「2ページ目なしでqwertyの上に1〜0の数字と！？入れてこれで無料版1ページに
  抑えよう」「これスペースデカすぎやね。！スペース？みたいにできない？」
  「デリートキーは横二つ分欲しいかも」
- Affected features: keyboard
- Affected data: none (`kbFixed()` is built from `LETTERS`, stored nowhere)
- Affected docs: PAID_FEATURES.md
- Implementation status: implemented

### Decision
- Date: 2026-08-11
- Area: Letters and sounds
- Decision: A letter comes first and its sound follows from it. Choosing a
  sound is a paid capability; on free the letter's own reading is used.
- Reason: 「文字ベースに音が付随だからね？音から選択するのは課金機能」
  「音は選択できない。だってアルファベットには既存の音があるんだから」
- Affected features: letters, word sheet, sound
- Affected data: `snd` slice
- Affected docs: PAID_FEATURES.md (`snd`), DATA_MODEL.md
- Implementation status: implemented

### Decision
- Date: 2026-08-11
- Area: The in-app keyboard
- Decision: Typing inside Lingua on a Lingua keyboard is removed. The system
  keyboard extension is the keyboard. The editor that *builds* a layout stays.
- Reason: 「アプリ内キーボードいらないでしょ。アップル拡張だけ。」
- Affected features: keyboard
- Affected data: `kb` slice kept
- Affected docs: FEATURES.md § closed on purpose
- Implementation status: implemented

### Decision
- Date: earlier
- Area: The glyph editor
- Decision: A line drawn straight along the dots is not corrected. Diagonals
  are corrected to diagonals; Round is for curves.
- Reason: 「斜めは斜めに補正して欲しいけど、まっすぐ引いた線が勝手に斜めになる補正が
  やめて欲しい」「点線上にそのまま引いた一筆書きが勝手に補正されるのをやめて欲しい」
- Affected features: glyph editor
- Affected data: `letters` slice (stroke points)
- Affected docs: —
- Implementation status: implemented

### Decision
- Date: earlier
- Area: Navigation
- Decision: Pages, not sheets sliding up from the bottom. One back button.
- Reason: 「基本ページ遷移型にしてくれ」「普通に1個前のページに必ず戻る戻るボタン
  以外いらない」
- Affected features: shell
- Affected data: none
- Affected docs: —
- Implementation status: implemented

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

More than one session may run at a time. Each one opens by reading, in this
order:

```
  1  CLAUDE.md
  2  docs/STATE.md
  3  the docs/ that cover the area
  4  git status
  5  which branch, which commit
  6  what else is in flight, and where
```

and then **declares its scope before touching anything**:

```
### Scope
- Goal:
- May change:            files, by name
- May NOT change:        files another session holds, or that are simply out of scope
- Depends on decision:   which entry in the owner decision log
- Tests to run:
```

### What is forbidden, by name

Every one of these has a reasonable-sounding form, which is why they are listed
rather than left to judgement:

```
  ✗ "while I'm in here, I'll tidy this up"
  ✗ "this could be cleaner, so I fixed it"
  ✗ "it's related, so I changed the behaviour too"
  ✗ "we'll probably need this later, so I added it"
  ✗ "the existing code looked wrong, so I corrected it"
```

Each of those is a separate task. Write it into `docs/BACKLOG.md` and carry on
with the one you were given.

### When two sessions collide

If work turns out to overlap another session's: **STOP.** Report

```
  my scope
  their scope
  files in common
  functions in common
  where a conflict is likely
```

and do not merge the two yourself. Two sessions each half-applying the other's
intent produces a diff nobody wrote and nobody can review.

Do not guess at what another session meant and write over it. **Do not decide a
spec from reading the code** — the code is what happened, not what was wanted.
If it is unclear, stop and collect the questions rather than picking an answer;
a wrong guess that tests green is the expensive kind.

## What one commit is

These do not share a commit:

```
  a feature
  a bug fix
  a refactor
  a rename
  a UI change
  a data migration
```

Bad:

```
  add the feature + tidy the nearby code + rename two functions + delete
  the old path
```

Good:

```
  A  the feature
  B  the bug fix it turned out to need
  C  the refactor, on its own
  D  the renames, on their own
```

**If a refactor changes behaviour, it is not a refactor.** Say so before doing
it, and it becomes a decision, not a cleanup.

## Done

"I wrote the code" is not done. Done is:

```
[ ] the spec is confirmed, and the decision it depends on is in the log
[ ] the blast radius is known
[ ] the docs that apply are updated
[ ] implemented
[ ] npm test green
[ ] the regression test for this specific bug is green
[ ] the bug was PUT BACK and the test was watched going red
[ ] node --check, and any static check that applies
[ ] device verification, if docs/TESTING.md § device says so
[ ] the owner has confirmed
[ ] docs/CHANGELOG.md updated
[ ] mergeable
```

and every report separates these three, always, without exception:

```
  CODE CONFIRMED      the checks are green here
  DEVICE CONFIRMED    somebody ran it on a real iPhone
  OWNER CONFIRMED     the owner looked and said yes
```

None of the three implies another.
