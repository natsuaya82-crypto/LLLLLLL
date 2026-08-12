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
