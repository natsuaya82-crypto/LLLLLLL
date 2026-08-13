# Changelog

Changes a person using the app would notice, and every change to how data is
stored, moved or removed — whether or not anybody notices those.

Not a commit log; `git log` is the commit log. What goes here is what somebody
opening the app after an update would find different, plus the record required
by `docs/FEATURE_RULES.md` (the eleven questions) and `docs/DATA_SAFETY.md`
(DELETE REVIEW).

Newest first. Entries before 2026-08-12 are not written up — this file starts
where it starts.

---

## Unreleased — on `claude/save`, code confirmed, **not yet confirmed on a device**

### The keyboard and what a language is for are now in the backup

**Data. Read this one.**

`SLICES` in `core.js` is what makes a slice real: `bkPack()` walks it, so a
slice outside it is in no backup, and `wipeAll` walks it, so a slice outside it
survives a wipe into the next language. Two were outside it:

- **the keyboard** (`kb`) — built in the app, filed beside the words, and in no
  backup at all
- **what the language is for** (`wld`) — held in `SET`, the person's settings,
  so it was one answer per phone shown on every language's cover, and in no
  backup either

Neither could throw. A backup was written, it restored, every check was green,
and the keyboard somebody spent an evening building was not in the file.

- *newly stored*: `lingua.<id>.kb` was already written; it is now packed.
  `lingua.<id>.wld` is new.
- *migration*: `migrateWorld()` copies the old `SET.world` into the language
  that is open, **once**, marked by `SET.wldMoved`. The old copy is left
  exactly where it is.
- *deleted*: nothing.
- *older data*: a language with no `wld` slice gets one on the first launch
  after this, from `SET.world` if there was one.
- *the plan*: unaffected.
- `backup-check` now names `kb` and `wld` rather than counting slices, and its
  fixture language carries both. Both failures were made to happen first.

### A post can be read in your own language

**Behaviour, and new data on a post.**

A post now shows three things: the writer's own letters, what it means in a
natural language, and — on a button — the same thing said again in the
reader's own conlang, with the words the reader has no word for left in the
natural language and shown in red.

- *newly stored*: `post.tr`, translations of the meaning, written at the
  moment of posting. **Absent today**: the translator is the reader's own
  device AI and is not wired up, so `postTr()` answers nothing and every
  reader sees the language the author typed — which is what happened before.
- *migration*: none. A post without `tr` behaves exactly as it did.
- *deleted*: nothing.
- *the plan*: `tr` is a new capability, Plus. Free gets three a day, on its
  own counter (`SET.trDate` / `SET.trN`) rather than sharing the AI one —
  sharing would mean a spelling suggestion spends a reading.
- *not frozen, on purpose*: the third layer is built from the reader's
  dictionary every time it is asked for.
- *stopped storing*: `post.gl`, the word-by-word gloss. It was read in one
  place, the line under the meaning, and that line is gone — three layers, not
  four. **Posts that already carry it keep it**; nothing removes it. The
  composer still shows a gloss, which is where the default meaning comes from.

### A card of a post is drawn from the post

**Behaviour, and it only shows once a second person exists.**

Making a card of a post re-spelled it out of the open dictionary and drew it in
the open alphabet. For your own posts that is invisible; for anybody else's it
would have been their line in your letters. Cards of posts are now drawn from
the shapes frozen on the post when it was written.

- *newly stored*: nothing. `ink` has been on posts since it was added.
- *older data*: a post written before posts carried ink still falls back to the
  open dictionary — correct today, because every such post is this person's
  own. **When posts start arriving from a server they must arrive with their
  ink already on them.**
- *deleted*: nothing. A post whose ink is malformed is shown as its text; it is
  never repaired or discarded.
- `postInkOK()` is the one place that decides whether ink is drawable.
- New check: `card-check`, twelfth in `npm test`.

### A word is written on one screen, and read before it is edited

**Behaviour, visible immediately.**

- Opening a word now shows it. Editing is a button at the foot.
- The sheet that makes a new word and the sheet that edits one are the same
  screen. The new-word sheet gains several meanings, the family, synonyms,
  opposites, examples and a note — all of which were previously only reachable
  after the word existed.
- Add no longer lands on an empty form; it lands on the word.

### A word carries four more things

**Data.** All four are optional and all four are absent unless filled in.

`reg` (register: spoken / written / slang / polite), `tags` (fields, searched),
`ety` (origin), `up` (changed-on). Empty ones are deleted rather than stored.

- *migration*: none needed. A word without them behaves as before.
- *deleted*: nothing.

### Cloud storage is off the Plus screen until it exists

**Behaviour, and a promise withdrawn.**

The plans screen sold "cloud storage (new phone, several devices)" and the
settings screen told anybody on Plus "Cloud sync — On". There is no code
anywhere that sends a language to a server: the app touches `/auth/v1/*` and
`/rest/v1/profile` and nothing else.

- Cloud storage **is still a Plus feature**, deferred until there are enough
  people to justify paying for the hosting. `docs/FEATURES.md` holds it as
  planned. It comes back on the screen when the thing behind it exists.
- A switch reporting a state the app does not have is worse than no switch:
  somebody trusts it and stops making backups.
- *deleted*: nothing. Backup to Documents is unchanged and is on every plan.
- Labels removed with it: `plan.plus.4`, `set.cloud`, `set.lock.cloud.*`,
  `set.on`, in all ten languages.

### A post can carry a photograph

**Behaviour and data, on every plan.**

- *newly stored*: `post.pic`, a data URL. Squeezed to 900px on the long edge at
  q0.72 — a 2400×1600 photograph comes out about 22 KB as text.
- *not cropped*: only the long edge is brought down, and the timeline shows the
  whole picture letterboxed rather than cutting a piece off with nowhere to go
  and see it.
- **the ceiling**: `POST_BYTES` is 2 MB, about 95 photographs. `lingua.posts`
  shares one storage allowance with every slice of the language, so a timeline
  with no ceiling could make somebody's **language** unsaveable. At the
  ceiling the photograph is refused; the post is not, and nothing is pruned to
  make room.
- **`savePosts()` no longer swallows a failed write.** It was survivable while
  a post was a line of text; a post can be big enough to fail now, and a
  timeline that silently stops saving loses whatever is written after it fills.
- *migration*: none. A post without a photograph is unchanged.
- *deleted*: nothing.
- *the plan*: free, on every plan.

### A key on the system keyboard says which key it is

**Behaviour, on the phone only. Swift — nothing here can see it.**

A key wearing a shape somebody drew says nothing about *which* key it is.
QWERTY is muscle memory, not something anybody can read off a keyboard, so a
person who has not memorised the layout is looking at thirty shapes with no
way to find `a`.

- The roman letter the key types is now drawn small in the **bottom-right
  corner**. `Key.t` has been handed to the extension since the beginning; it
  was simply never drawn.
- Only on letter keys whose face is a **drawn shape**. A key already showing a
  letter or a borrowed character would be saying the same thing twice.
- The four flick faces sit at the middles of the edges, so the corner is free
  even on a key that has all four.
- *newly stored*: nothing. *migration*: none. *deleted*: nothing.
- **Not verifiable here.** There is no Swift on a Linux runner; `npm test` and
  `assets-check` say nothing about how it looks. It needs a build and a phone.

### The profile is where your posts are, and three things on a post

**Behaviour. One new field.**

- **The profile lists your posts.** There was nowhere in the app that did.
  The cover and the language stay at the top and the posts run under them, so
  the page scrolls where it used to be fixed. The pinned one is first.
- **The fourth icon on a post is share.** It was the card, unlabelled, and only
  on your own posts — a restriction from before `cardPaint()` drew a post from
  the post's own ink, left standing after that was fixed. It is on every post
  now, and pressing it opens the card, which is the one way anything in this
  app leaves the phone.
- **The ⋯ is a menu**: pin, and delete. It *was* delete — a delete reached by
  pressing something unlabelled is a delete waiting to be pressed by accident.
- *newly stored*: `post.pin`, on one post at a time. A page with three things
  at the top of it has nothing at the top of it.
- **The card's foot is `@handle` and the language's name.** It was the
  language's name and the word LINGUA, so a card of a language somebody had
  called Lingua read LINGUA on both sides. Both come off the post, so a card of
  somebody else's post carries their handle and their language.
- *migration*: none. *deleted*: nothing. *the plan*: free, on every plan.

### The AI is Studio's, and it is the last chapter

**Behaviour, on every plan.**

The AI conversation is not shown on Free or Plus. Plus is the tools for
building a language yourself and every one of them runs on the phone for
nothing; Studio is the plan where something helps you, and it is the only one
whose cost grows with use — a chat turn has to be given the dictionary to read,
and 5000 words is about 45,000 tokens every time.

- **It moved to the end of the contents first.** It was chapter V, between the
  notebook and the keyboard, and hiding it there would have moved the keyboard
  from VI to V under somebody who already knew where things were — which the
  keyboard row's own comment forbids. Last, it costs nothing to be absent:
  Free and Plus read I–V, Studio reads I–VI, and every shared chapter has the
  same number on both. Two numbers change once, today: the conversation V→VI,
  the keyboard VI→V.
- *the plan*: `CAN.sug` is gone. `ai` is one capability at studio, where there
  were two meaning the same ceiling.
- **Plus now spends the daily allowance for word suggestions**, three a day,
  the same as Free. It was unmetered on Plus in the code and advertised as
  Studio's on the screen; the screen was right.
- *deleted*: nothing. A Studio conversation left on the phone when a
  subscription ends stays in the `talk` slice and in the backup.

### When a plan ends, the app goes back to free's shape and keeps everything

**Behaviour, across every capability. Nothing stored changes.**

Nobody had decided this, so it had been decided a feature at a time: `wsys`
and `kb` reverted, `words` and `gram` kept working, and `dir` shipped this
morning on the second side. One rule now. 「a にしたら最初の1ヶ月で作りきったら
そのあと課金されねえだろ」

```
  the dictionary        lists the first 100 words, in the order made
  the writing system    an alphabet          (already did)
  the keyboard          the fixed QWERTY     (already did)
  the direction         left to right        (new)
  a stage of your own   stays; cannot be added to or deleted  (delete is new)
  everything else       as it always was on free
```

- *deleted*: **nothing.** `WORDS` is untouched, `save()` writes every word,
  `bkPack()` packs every word, and `findWord()` finds every word — a post, a
  gloss, a spelling and an example all read the whole dictionary. One list on
  one screen is shorter, and `wordsSeen()` in `words.js` is the only thing
  that shortens it. The search, the sound and letter lookups and the synonym
  picker read it too, because a search that returned the other four thousand
  nine hundred would put back exactly what the list stops showing.
- **The app says the difference out loud, twice.** Once, on the day the plan
  changes, in a sheet: nothing has been deleted, it is in the backup, it comes
  back. 「課金切れたら、ポップ出して、バックアップには保存されてるよーって一回
  出せばok」 And every time, at the foot of the dictionary: how many are not
  listed. A list that is quietly short is indistinguishable from data that is
  gone, and it will be reported as data that is gone.
- *newly stored*: `SET.planWas`, the plan the app last saw. It is the person's,
  not a language's, and it is what lets `capLapse()` notice a change however
  it happens — set by hand today, StoreKit tomorrow, found lapsed at launch.
- *migration*: none. The first launch after this records the plan and says
  nothing; there is nothing to announce to somebody who has never been on
  another plan.
- *older data*: unaffected in every direction. A free language of forty words
  behaves exactly as it always has.
- `backup-check` holds the half that matters — past the ceiling, on the free
  plan, `findWord()` still finds an unlisted word and `bkPack()` still carries
  all of them. **Both were watched failing with the bug put back.**
- New keys in all ten languages: `cap.hid`, `cap.lapse.h`, `cap.lapse.d`,
  `cap.lapse.ok`.

### Letters can be placed on a photograph

**Behaviour, on every plan. Nothing new is stored on a post.**

Pick a letter you drew, put it anywhere on the picture, drag it with a finger,
size it with the slider. 「なんなら画像に自作文字を貼って投稿できるようにすれば
勝手に広がるよ」

- **The picture is the screen.** Full bleed, black behind it, the controls
  floating on it and the alphabet along the foot — the way a phone does a
  photograph, not the way a form does one.
  「インスタみたいにしろよ なんでそんなパソコンと同じような配置なんや」
- *newly stored*: **nothing.** The letters are drawn INTO the picture when the
  post is sent, so `post.pic` is the only thing that changes. A reader has
  neither the alphabet nor a way to compose it, and a picture with the letters
  already in it is past-tense the way `ink` is, by a shorter route.
- *while writing*: `PW.marks` — a letter's id and where it sits as a fraction
  of the picture. It is where you are standing, not something stored, and
  `pwBlank()` clears it.
- **white or black**, one button. A letter nobody can see is not placed on
  anything, and a photograph can be either.
- *the plan*: free, on every plan. 「画像と自作文字貼るのは無料」
- *migration*: none. *deleted*: nothing.
- **New check, thirteenth in `npm test`: `post-check`.** It drives the real
  `pwSend()` against a photograph that is black everywhere and counts the light
  pixels in what came out — "the string is different" would also be true of a
  bake that drew nothing. It also holds that the positions do NOT travel on the
  post, that the direction does, and that the composer is empty afterwards. All
  four were watched failing with the bug put back.

### The onboarding's ghost buttons stopped being everybody's

**A bug, everywhere in the app.**

`index.html` carries a second `<style>` block for the onboarding, and it set
`.btn.ghost` without scoping it. Being later, it won on order: every ghost
button in Lingua had a white border at 22% opacity, which is invisible on a
page whose background is paper. It looked right on the onboarding because the
onboarding is the one screen that is dark. Same shape as the `.sfont` bug —
one rule in one place, quietly outranked by another written for one screen.

### A language has a direction, and a post carries it

**Behaviour and data.** Reading is free; choosing is Plus.

Four of them: left→right, right→left, and down the page with the columns
running right→left or left→right. 「縦書き、右→左 左→右の投稿」

- *newly stored*: `SCRIPT.dir`, in the **`script` slice** — the language's, so
  it is in the backup already and travels when the language is opened. Absent
  means left→right. It is deliberately **not** in `SET`: `SET.wsys` is there
  and is the older mistake, and what the language is for had to be moved out
  of `SET` for exactly this reason.
- *newly stored on a post*: `post.dir`, frozen when it is written, for the
  same reason `ink` is frozen. A post is set the way its writer's language
  runs, on anybody's phone. `postDir()` is the one place that reads it and it
  reads the **post** — `sides-check` now refuses `SCRIPT` and `scriptDir`
  below the line in `post.js` and `card.js`.
- *the plan*: `dir` is a new capability, Plus. **Nothing asks it before
  drawing.** A free account reads every direction — otherwise the timeline
  would be lying about somebody else's language — and what Plus buys is
  choosing one. 「無料でも言語の向きは見ることはできる。でも設定してsnsとかに
  登校するのは有料会員のみ」
- *when a plan ends*: the language keeps its direction and keeps posting in
  it. What is lost is the ability to change it. `docs/PAID_FEATURES.md`: a
  failed check means fewer buttons, never fewer words. **This one was
  interpreted rather than decided** — it is in the decision log as such.
- *migration*: none. A post written before this runs left→right, which is how
  it was written and how it has been shown. Nothing is back-filled.
- *deleted*: nothing.
- **Two places set a column across the page instead**: the composer's field (a
  textarea cannot be typed in a column in this webview) and the card (a
  landscape composition with no room for a column). `dirFlat()` is the one
  place that says so and `docs/BACKLOG.md` says why.
- New keys in all ten languages: `dir.title`, `dir.ltr`, `dir.rtl`,
  `dir.ttb-rl`, `dir.ttb-lr`, `dir.locked`.

### The profile is one block

**Behaviour. Nothing stored changes.**

Under the face there were three strips, each of them small grey type with a
bold number in it: the language's name on a line of its own, then following
and followers, then the letters, the words and what the language is for.
None of the three was a heading for the other two, so the eye had four places
to start and no reason to pick one. 「プロフィール視認性悪すぎだしごちゃごちゃ
してる」

Everything above the three lists is `meCard()` now.

- **Beside the face: the name, the handle and the language** — the same three
  things a post says about whoever wrote it, in the same order.
  「アイコンの横に名前と@と言語つければいいんじゃない」
- **The line about yourself runs the full width**, at the left margin, under
  all of it. It was inside the row, so it read in a column two thirds of the
  phone wide, indented from both sides — and on somebody else's page that
  line is most of what there is to read. 「相手のページに飛んだらbioすらまと
  もに読めないやんけ」 Four lines of it are shown.
- **Following and followers moved into the block about the person.** They are
  who somebody is, not a statistic about the language beside them.
- **The language wears the gold tag it wears on a post**, and pressing it
  opens what the language is for — which is what the tag is asking about, and
  the only door in the app to that screen. **Renaming a language is now only
  in the settings**, where the rest of naming it already was; the pencil on
  the profile is gone with the line it was on.
- **The letters and the words came off.** They are chapters I and II of the
  contents, one tab away, and the number there is the fuller one — `5 / 38`
  rather than `5`. Saying them again here was the noise.
- *deleted*: `wldSaid()` and `wldLine()`, which built the "what this language
  is for" label. The profile was the only thing that called either, so they
  went with the line — `dead-check` would have failed otherwise. No stored
  data is touched: `WLD` and the `wld` slice are unchanged and the screen
  itself is unchanged.
- *newly stored*: nothing. *migration*: none. *the plan*: unaffected.
- `.mecard` was written out twice in `index.html`, and the second one set no
  `display`, so it inherited `flex` from the first. One block now.
- The three lists start at 254px of 844 — 30% of the phone — measured in a
  390×844 viewport rather than read off a full-page picture.

### Smaller

- The dictionary list: the whole row opens the word; a round ⊕ replaces the
  bar across the foot; the per-row play button is gone.
- The synonym / opposite picker can make a word on the spot.
- The tab bar is transparent enough to see the page through.
- The glyph editor no longer bends a line drawn straight along the dots.
- The language count is stated as `LANG_MAX = 1` on every plan, and the note
  that implied a paid plan added more is gone.

---

## How to add an entry

Anything that changes what is stored, what is moved, or what is removed gets an
entry **before** the code is written, with the eleven questions from
`docs/FEATURE_RULES.md` answered. Anything that deletes also gets a DELETE
REVIEW (`docs/DATA_SAFETY.md`).

Mark every entry as one of:

```
  code confirmed              npm test green, nothing on a phone yet
  device confirmed            somebody ran it on a real iPhone
```

and never let the first stand in for the second.
