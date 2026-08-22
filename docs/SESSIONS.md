# Working beside other sessions

Hand this to every session, whole. It is all a session needs in order not to
collide with the others, and it is short on purpose.

「だからこうなるから最初から決めろって言ってんのに」

## Who is who

```
  the owner    decides what the app does -- behaviour, thresholds, prices,
               what is deleted, wording. Confirms it on a phone.
               → docs/FEATURE_RULES.md § owner decisions are specifications

  the leader   another session, above this one. Names what each session owns,
               integrates the branches, and runs the whole gate at the end.
               A session never does any of those three.

  you          one area, one branch, the files you were named. Nothing else.
```

Where this page says **the leader**, it means that session and not the owner.
An owner decision is still the specification; the leader says who implements
which part of it, and in which files.

---

## 1. Territory — one file, one session

**Before any work starts, the leader names the files this session owns.**
A session edits the files it owns and no others. Not "mostly". Not "just this
one line".

If the work turns out to need a file this session does not own:

```
  STOP. Report:  what you need, in which file, and why.
  Do not edit it. Do not work around it. Do not copy it.
```

That is the whole rule, and it is the only one that PREVENTS a collision.
Everything below only makes one visible sooner.

**The known hazard is `www/index.html`.** Every screen's CSS is in it, so any
change to any screen touches it, and it is where sessions collide first and
worst. Until the CSS is split by chapter, **one session at a time owns it** —
and a session that does not own it may not add a rule, however small.

---

## 2. One session, one branch

`claude/<area>`. Never anybody else's, for anything, ever.

---

## 3. The order of a session

```
  1  git fetch --all --prune
  2  read CLAUDE.md, docs/STATE.md, the docs/ for the area
  3  git log --oneline --all -40           what everybody else has pushed
  4  PUSH THE DECLARATION                  before the first line of code
  5  work
  6  push after every commit
  7  report
```

**Step 4 is not paperwork.** A session that writes for an hour before pushing
is invisible for that hour, and every other session spends it deciding against
information that is already wrong.

The declaration:

```
### Scope
- Goal:
- Owns (may change):     files, by name
- Does NOT own:          everything else
- Decision it implements: which entry in the owner decision log
- Check to run:          the one check that holds it
```

---

## 4. The collision test, before touching a file

```
  git log --oneline --all -- <file>
```

A commit there from a branch that is neither yours nor the base means another
session is in that file. **That is where you stop** — not when a merge fails,
which is hours later, after both of you have written over each other.

---

## 5. Never integrate

No `merge`, no `rebase`, no `cherry-pick` of another branch. Not even to
"check whether it conflicts".

Where two intents disagree, the leader is the one who decides which wins --
and asks the owner where the answer is a decision rather than a merge. A
session that merges on its own has produced a diff neither session wrote and
nobody can review.

Report the overlap. Stop. That is the finished job.

---

## 6. The gate is the leader's

A session runs **the one check that holds what it changed**, by name --
`npm run card`, `npm run post`. Not `npm test`: six minutes, and the leader
runs it once over everything after integrating.
→ `docs/TESTING.md` § the gate

---

## 7. What a session says when it is done

```
  what changed, and in which files
  what behaviour is different
  what is stored differently, if anything
  which check was run, and that the gate was NOT run
  what was left undone, and why
  CODE CONFIRMED / DEVICE CONFIRMED / OWNER CONFIRMED -- separately
```
