# Where this project actually stands

`CLAUDE.md` says how the code has to be written. This says what has been built,
what has not, and what is not the repository's to hold. Read it before doing
anything in a session that did not build the thing it is about to change.

The rest of `docs/` is the working detail behind the rules at the head of
`CLAUDE.md`:

| | |
|---|---|
| `ARCHITECTURE.md` | the shape of the app, and where each thing is the truth |
| `DATA_MODEL.md` | every stored thing, its owner, and whether it may change under somebody |
| `DATA_SAFETY.md` | how a language is not lost; the backup rules; DELETE REVIEW |
| `FEATURES.md` | every feature, its plan, its data, and whether the owner has decided it |
| `FEATURE_RULES.md` | the order, the owner decision log, scope for parallel sessions, what "done" is |
| `PAID_FEATURES.md` | `CAN`, the three plans, and what money may never touch |
| `TESTING.md` | what to run when; how to fix a bug; what needs a device |
| `CHANGELOG.md` | what a person would notice, and every change to stored data |
| `BACKLOG.md` | found and deliberately not done, and why |

Everything below was checked against the repository on **2026-08-11**, §3 and
§5 again on **2026-08-19**, and the whole file again on **2026-08-21**, not
remembered. Where a claim can go stale, it
says how to re-check it — and §3 is the proof that it does: it went on saying
the timeline was not on the server for a week after it was.

---

## 1. `master` is the app again. Keep it that way.

`master` is at `dbd73d4` (2026-08-22) and every other branch on the remote is
behind it. A fresh clone is the current app, and nothing needs checking out.

Do not name a branch here again. This paragraph has said "master and
`<branch>` are the same commit" three times and been wrong twice, because a
branch name is a fact with a shelf life of about a day.
`claude/cowork-migration-review-wfx1ra`, which it named until 2026-08-22, is
**233 commits behind**.

That is worth a paragraph because it was not true, and the way it failed is the
way it will fail again. `master` sat at 2026-08-04 while 144 commits of work
went onto the branch, so it had **no** `www/share.js`, **no**
`ios/App/LinguaKeyboard/`, **no** `tools/conv-check.mjs` and **no**
`docs/keyboard-extension.md`. A second session cloned the repository, landed on
the default branch, and reported that the system keyboard was not built and the
gate was nine checks. It was right about what it was looking at, and there was
nothing in the repository that could have told it otherwise.

So, before deciding anything is missing:

```
git fetch --all --prune                      # ALL of it, not just master
git branch -r                                # what actually exists
for b in $(git branch -r | grep -v HEAD); do \
  echo "$b +$(git rev-list --count origin/master..$b)"; done
```

**`--all`, and `git branch -r`, are the point.** The two lines that used to be
here compared HEAD against `origin/master` and nothing else, so they cannot see
the case that has now happened twice: `master` itself being the stale thing. On
2026-08-22 a session ran them, got two zeros, believed it, and spent a day
refactoring a copy of the app that was **208 commits behind** — `claude/save`
and `claude/yoo-kwdg28` were on the remote the whole time and a fresh clone had
fetched neither. Two zeros against `master` proves you match `master`. It
proves nothing about whether `master` is the app.

If a branch is ahead of `master`, find out why before writing a line, and say
so to whoever is running it — a number here is the difference between "not
built" and "not fetched".

The branch has only ever been ahead of `master` in a straight line, never
beside it, so bringing `master` up is a fast-forward and cannot conflict.
Pushing to `master` is the owner's call and is asked for each time.

---

## 2. What is built and works

- **The free plan, whole.** Thirty-eight letters — `a`–`z`, `!`, `?` and a
  digit for every value of the base — your own shapes on them, the dictionary,
  the grammar stages, the notebook. (Twenty-eight is what it was before the
  free plan got its own digits; measured on a fresh free language it is 38.) `CLAUDE.md`
  → "What the free plan is" is the specification and is current.
- **The system keyboard**, `ios/App/LinguaKeyboard/` — six Swift files. It is
  built, it is on TestFlight, and a person has typed their own letters on it on
  a real phone. App Group `group.com.tokinets.lingua`; appId
  `com.tokinets.lingua`.
- **The hand-over from app to keyboard**, `www/share.js` (chapter 23) — the
  keys with the shapes already cut onto them. The call is
  `Capacitor.nativePromise('LinguaShare','write',…)` and **not**
  `Capacitor.Plugins.*`; `docs/keyboard-extension.md` says why, and it cost four
  builds to learn.
- **Accounts.** Sign up, sign in, verify, sign out, password reset, and a
  profile with a handle. `www/net.js`.

## 3. What is NOT built, however much it looks like it is

**The timeline IS on the server now, and this section used to say the
opposite.** It said so correctly on 2026-08-11 and went on saying it after the
work was done, which is the exact failure §1 is about — a file that is trusted
and is out of date is worse than no file. Re-check rather than believe:

```
grep -n "rest/v1" www/net.js          # what the app actually asks the server for
```

Today that is `post`, `react`, `follow`, `profile` and the `notices` RPC.
`netPush()` sends a post, `netFeed()` reads the two timelines, `netNotices()`
reads the notices, and `postCatchUp()` sends whatever this phone has that the
server has not. `localStorage` is still where a post is kept — the phone is the
copy that survives a bad network — but it is no longer the only place one
exists.

**An account is required to read the timeline or post to it**, decided
2026-08-18 and held by `post-check`. `vFeed`/`vExplore`/`vNotif` answer with the
app's own door when there is no session. The MAKING side needs no account and
that has not changed.

Still unused in `supabase/schema.sql`: `quote`, `publication`, `language` and
`prompt`. Each has row level security written and held by `npm run rls`, and
nothing in the app touches any of them. `language` is the one to watch: its
policies changed on 2026-08-22 so that an account with no name can own one,
and the app still does not write a row.

**The online half was redesigned on 2026-08-22.** Everything belongs to the
account, cloud storage is for everybody, and an anonymous account is made at
first launch. The three entries at the head of `docs/FEATURE_RULES.md` § Owner
decision log say it; read them first, because most of the list below was
written for an app whose languages lived on the phone.

Order, and where it stands:

1. **Anonymous sign-in — done.** The first launch signs in with no address and
   no password (`netAnon` in `net.js`, called from `boot.js`), so there is a
   uid before the first frame. "Signed in" split in two on the phone as well:
   `netSignedIn()` is a session, `netMember()` is a session with a name, and
   `obNeed()` asks the second at the six things other people would see — a
   post, a like, a boost, a report, a follow, a block. The door left the
   onboarding: the app opens on the square you draw a letter on, and the door
   is a screen `obDoor()` goes to. Held by `migrate-check` case 7.
2. **`is_member()` split in two — done.** `has_account()` in `schema.sql` is
   "there is an account", anonymous and frozen included, and guards the three
   `language` write policies; `is_member()` is unchanged and guards everything
   other people see. `language.owner` points at `auth.users` rather than
   `profile`, because an account exists before a person does. Held by
   `npm run rls` — 106 attempts, 19 shapes.
3. **The language actually living on the server — not started, and it is the
   rest of item 1.** There is nowhere to put a slice yet: `language` holds a
   name, a licence and a date, and the eleven slices are still `localStorage`
   only. This is the next thing.
4. The plan on `profile`, its value still set by hand. Not started.
5. The rest of moderation — the tombstone in a thread, the ⋯ menu on a
   profile, the notices, the frozen state on Home. Not started.
6. Terms and privacy, under `/home/user/tokine2`, linked from Settings and not
   from the onboarding. Not started.
7. StoreKit, and what a purchase opens. Not started; the plans screen has not
   been touched and must not be until then.

**Everything still to do that needs the server is one list**, in
`docs/FEATURES.md` → "What is left to do online": the plan (the one with money
on it), cloud storage, publishing a language, quoting, the day's sentence, and
push. Read that before starting anything online. Blocking, reporting, reading
the reports, taking a post down, ejecting somebody and deleting an account are
all done — both halves of what App Store guideline 1.2 asks for.

**Somebody has to be made staff before any of it is reachable.** One SQL line
in the Supabase dashboard, `supabase/setup.md` § 5. Nothing in the app grants
it and nothing is meant to.

**Apple and Google sign-in are wired and cannot work yet.** The buttons went
from "not in this build" to a real plugin —
`@capgo/capacitor-social-login`, both providers, Facebook and X switched off in
`capacitor.config.json` so their SDKs are never linked. What is missing is
nobody's to write:

- Apple needs the capability on the App ID and the provisioning profile
  regenerated, or **the next build fails** — `docs/apple.md` § 2
- Google needs a client id made in the Google Cloud console;
  `node tools/google-id.mjs <id>` writes it to the two places that have to
  agree, and until then `GOOGLE_IOS_ID` is empty and the button says so
- Supabase has to be told to accept both — `supabase/setup.md` § 4

**No StoreKit.** The plans screen exists and the plan can be set by pressing a
card, but nothing charges anybody. `docs/apple.md`. The plan itself lives in the
Keychain rather than in the settings file — `ios/App/App/LinguaPlan.swift` says
why, and what it does not stop.

**No landing page in this repository.** `vercel.json` copies `www/` into
`public/` and serves the app itself as a static site. There is no marketing
page, no separate site, and no `/lp` anywhere. Anything of that kind is a new
thing, not an edit to an existing one.

## 4. What is not the repository's to hold, and never will be

Three things only a person with a browser and a login can do. Each has a file
that says exactly what to click, because that is the only form they can take
here.

| what | where it is written | who does it |
|---|---|---|
| Everything in the Supabase dashboard, in order, and how to tell whether it worked | `supabase/setup.md` | the account owner |
| The confirmation and reset mail — SMTP fields, DNS records, templates | `supabase/mail.md` | the account owner, in the Supabase and Resend dashboards |
| TestFlight, the two subscriptions, certificates and profiles | `docs/apple.md` | the account owner, in App Store Connect and the Apple developer site |
| The GitHub Secrets the iOS build reads | `.github/workflows/ios-deploy.yml` names them | the account owner, in the GitHub UI |

**No agent can write a GitHub Secret**, so a build failing on a missing one is
never something to fix in the repository.

**The `service_role` key must never appear here, and does not.** The key in
`www/net.js` is the *publishable* key, which is public by design and is meant to
sit in a phone. Passwords are never held, stored or logged by the app: the field
goes to Supabase over TLS and only the token pair is kept, in `localStorage`
under `lingua.sess`.

## 4b. More than one session at a time

**The page to hand a session is `docs/SESSIONS.md`.** The rule that prevents a
collision rather than finding one is in it: the leader — another session above
this one — names the files a session owns, and a session edits nothing else. `www/index.html` holds every screen's
CSS and is where sessions collide first — one session at a time owns it.

Sessions run in separate containers and share exactly one thing: the remote.
Everything below is about making work visible there early enough to be avoided.
The body is in `docs/FEATURE_RULES.md` § several sessions at once.

```
  one session, one branch          claude/<area>, never anybody else's
  fetch before deciding            git fetch --all --prune
  read before changing a file      git log --oneline --all -- <file>
  push the scope FIRST             before the first line of code
  push after every commit          a branch nobody can see cannot be avoided
  never integrate                  no merge, no rebase, no cherry-pick of
                                   another branch -- the leader does that
```

A commit on a file from a branch that is not yours means another session is in
that file. Stop and report there, not when a merge fails.

## 5. The gate, and what CI does not run

`npm test` is seventeen checks and is the specification. `CLAUDE.md` → "The
seventeen rules the gate enforces". `tools/gate.mjs` runs the six that need no
browser first, in about two seconds, then the eleven browser ones four at a
time. Run one after another they were ten minutes in this container.

**It is run once before pushing**, not once per commit — the owner's rule, and
`docs/TESTING.md` has all three. While working, run the one check that holds
what you are changing, by name, plus the six fast ones.

**GitHub Actions runs three of them** — `assets`, `es5`, `i18n`
(`.github/workflows/i18n.yml`). A green tick on a push does not mean the gate
passed. `dead`, `migrate`, `import`, `sides`, `act`, `conv`, `card`, `word`,
`post`, `backup`, `fill`, `round`, `face`, `base` and `press` — fifteen of the
eighteen — run only where somebody runs them, which means locally, which
means you.

`fill` and `round` were missing from that list and from `CLAUDE.md`, and it was
not only a list. Both loaded playwright as `import { chromium } from
'playwright'`, where the other eight browser checks call a `loadChromium()`
that falls back to the global install. On a machine with playwright installed
globally rather than into `node_modules`, both died at module load — and
because `npm test` is an `&&` chain, **`round` and `press` never ran at all**.
Fixed 2026-08-22 by making the two match the eight. A check nobody can run is
a check that is not in the gate.

`npm run rls` is not in `npm test` at all: it stands up a real PostgreSQL.
Run it whenever `supabase/schema.sql` changes, which is the only time it can
start failing.

## 6. Builds

`.github/workflows/ios-deploy.yml`, on `workflow_dispatch` or a `build-*` tag.
It runs on `macos-latest` and takes about twenty minutes.

**Do not start one without being asked.** This is a standing instruction from
the owner of the repository, not a suggestion, and it has been said more than
once.

Build numbers are the workflow's run numbers. #43 was the first that a person
typed on; #47 was green. **The latest is #82** — 2026-08-21, green, on
`claude/save` at `eef389a` (checked against the Actions API on 2026-08-22, not
remembered). Of the last thirty runs, every one was on `claude/save` and none
on `master`, and #61 is the only failure among them.

**Nothing has been built at the head of `master`.** `eef389a` is an ancestor
of it, but `master` is **40 commits ahead** of the last thing that compiled —
the forms chapter, the moderation screens and the anonymous account are all in
that gap. A green #82 is not a statement about what is on `master` now. iOS work beyond triggering that workflow — opening the project,
running on a simulator, `npx cap sync ios` — needs a Mac with Xcode and cannot
be done from a Linux session.

---

## 7. What is next, as of 2026-08-22

Ordered by what blocks shipping. Nothing here is started. Anything not on this
list has either been done or was never agreed to — check `git log` before
assuming a thing is waiting for you.

### Blocks shipping the free version

1. ~~**Posts are not on the server.**~~ Done — `netPush`, `netFeed`,
   `netNotices` and `postCatchUp`. `quote` and `publication` are still unused.
2. ~~**Explore and Notices are empty screens.**~~ Done — both read the server.
3. ~~**The password reset mail does not arrive.**~~ Done — the template is
   `{{ .Token }}` (`supabase/mail.md`) and the app has a six-digit reset
   screen, because a link has nowhere to land in a Capacitor app.
4. ~~**The free ceilings are never explained in words.**~~ Done — and there
   is only one ceiling. `capStop()` asks, in the words `toast.cap` already
   had, at the moment a word will not fit, and stays on the screen the person
   was typing on; the five sites that used to throw them at the price list do
   not any more. The other two ceilings are gone rather than explained: word
   suggestions went out with Studio, and layer three's three a day went with
   the AI 「1日3回は亡くなりましたaiいれないから」.
5. **Signing in from Settings** was fixed but has not been opened on a phone.
   `obBackTo`/`obReturn` in `www/onboard.js`.

### Corrected on 2026-08-22, with what was measured

Each of these was a claim this file made that the code no longer supported.
Two of them were about capabilities that had been deleted.

- **The gate was fourteen checks and could not finish.** §5 above.
- **Two claims in § 7 that the code no longer supported** — items 6 and 7,
  struck through in place rather than deleted, with what was measured on each.
- **The counts.** All three were right when written at `cd712dd` and none had
  been touched in the seventy-four commits since.

### Found and left alone, deliberately

6. ~~**A letter of a hidden kind is counted and unreachable.**~~ Not
   reproducible — this said the Letters header showed `5 / 30` while the rooms
   inside came to 29. `LT_KINDS` is unconditional and `ltKindOf()` answers
   `num`, `mark` or `alpha` for every letter, so the rooms sum to
   `LETTERS.length` on any plan. Measured 2026-08-22: a fresh free language is
   `0 / 38`, rooms 26 + 2 + 10; one that paid and stopped is `0 / 40`, rooms
   27 + 2 + 11. `5 / 30` is not a total this plan can produce — a–z, `!?` and
   the digits is 38.
7. ~~**`ai` lifts at Plus, `sug` only at Studio, and they are the same
   ceiling.**~~ Moot — neither capability exists. `CAN` is ten names and
   neither is among them; `AI_FREE_DAILY`, `sugLeft` and `aiSpend` have no
   declaration anywhere in `www/`. It also contradicted item 4 above, which
   says the suggestion ceiling went out with Studio. The same claim was still
   live in `docs/FEATURE_RULES.md` § "What to report" and in two comments in
   `www/core.js`; all three are gone.
8. ~~**`press` never reaches `kbReset`.**~~ Done — measured 2026-08-22,
   **213 of 213** distinct names pressed, `kbReset` among them.
9. **`tools/verify-script.mjs` runs again** — three breakages, not one:
   `gstep`→`geStep`, `scriptDrawn` gone since `9226dd6`, and every click was
   landing on `#splash` because it waited 250 ms where every other check waits
   for the selector. It is not a font experiment: it is the only end-to-end
   proof of the PUA font path. It now reports 13 ok / 19 FAIL, and each of the
   nineteen has to be triaged as app-wrong or test-old before it can go in the
   gate. `docs/BACKLOG.md`.

### Offered and not yet answered

10. ~~**`node --check` over `www/*.js` inside `es5-check`.**~~ Done — 46 files
    in 1.5 s, ahead of the rules, and nothing below runs if one of them does
    not parse. Proved by putting the 2026-08-11 bug back: the comment on
    `www/sync.js` closed one line early, and the check named the file and the
    line and exited 1.
11. **Find the strings nothing says.** 270 of 692 keys in `en.js` never appear
    as a literal in `www/`, but most are built — `t('stg.'+p.id+'.t')` — so a
    grep cannot tell. `i18n-check` already renders 271 screens in 10 languages;
    recording what `t()` was asked for would say it properly. It has to be a
    report, not a failure: a toast on an error is real and unwalked.
12. **Two questions about screens, open since before the keyboard work.**
    Whether the post composer's line needs a visible border, and whether the
    word sheet's letter grid stays.

### Agreed long ago, never started

13. The onboarding as motion only.
14. Vertical writing — **written.** `DIRS` in `www/wsys.js`, bought with
    `can('dir')`. This line was stale.
15. A selectable line gap.

### The owner's, in a browser

16. Supabase — the reset mail template and the Redirect URLs (see 3), and the
    Apple and Google providers (`supabase/setup.md` § 4).
16a. The Apple developer site — Sign in with Apple on the App ID, and the
    profile regenerated after it. **Nothing builds until this is done**, so it
    is not one to leave. `docs/apple.md` § 2.
16b. Google Cloud — the iOS client, then `node tools/google-id.mjs <id>`.
16c. Supabase — one SQL line making yourself staff, or the reports are on
    nobody's screen (`supabase/setup.md` § 5). Sign in on the phone first: it
    updates a row that has to exist.
16d. Supabase — **Spend Cap ON**, `supabase/setup.md` § 6. Pro is not a price
    that stops at $25: 250 GB of egress is included and $0.09/GB is added
    after it, with no ceiling until this is switched on. What runs out first
    is the timeline's photographs, and the way it goes wrong is a month that
    is already spent by the time anybody looks.
17. App Store Connect — the subscription, and TestFlight. `docs/apple.md`.
    The StoreKit code exists now (`ios/App/App/LinguaStore.swift`) and **is not
    wired to www/**: nothing in JavaScript asks it anything, by instruction
    「storekitってコードは書いていいよ繋げる作業は後でやる」. It is registered
    in `MainViewController` so its `Transaction.updates` listener runs. The
    wiring is one file, `www/store.js`, and the plans screen calling it — and
    it is deliberately not written yet, because a function nothing calls is a
    function `dead-check` deletes.
18. GitHub Secrets, if a build ever needs a new one. No agent can write one.

### Landed on 2026-08-22, and what it still needs

21. **The Lingua keyboard types the letters somebody drew.** It did not
    before, and nothing said so: a letter key put the letter's NAME in — the
    same character the phone's own QWERTY puts there — and `LinguaType` (the
    face `.tfont` wears) carries only the private use area, so it fell through
    to the ordinary font and came out roman. **The second font was built,
    installed, and never once used through the keyboard it exists for.** It is
    a private use code point now, `sharePua()` in `share.js`, on both plans —
    `shareFace()` for a keyboard somebody built and `kbFix()`'s override for
    the free QWERTY, which were one feature working on one plan and not the
    other, split by nothing. Held by `conv-check`'s **eighth** claim, per
    letter and not as a count. Nothing stored changes; the private use area
    exists in the input field and inside the extension and nowhere else.
    **Decided, not a defect:** used in Messages this keyboard sends tofu —
    `967333c`, 「Lingua キーボードは Lingua の中で使うもの」.
    **`DEVICE CONFIRMED` — no.** Whether the extension actually inserts
    U+E000 upward, and whether what it inserts is drawn in `LinguaType`,
    cannot be checked anywhere in this repo. That is item 20's phone.

22. **Five renames, and one of them was the entry being wrong.**
    `postsRead`→`postRead`, `wSetFil`/`wSetSort`→`words*`, `gh*`→`geHint*`
    (with `GH*`→`GE_HINT*`), `note*`→`nt*` and `noteRead`→`ntRead`.
    `savePosts` and `saveMe` were listed in the backlog beside them and are
    **deliberately not renamed**: `save*` is a family of exactly ten, every one
    naming what it saves, and CLAUDE.md's own prefix list already carries
    `open*`, which is twenty functions and a verb rather than a chapter. A verb
    family was never the thing the rule is against; one chapter under two names
    is. Decision log, 2026-08-22. Behaviour unchanged, and the argument for
    that is that no number moved: `buttons pressed 8683 (214/214)`,
    `screens walked 366`, `mirror 275`, `routes 36/36` — all four the same
    either side. `dead` went 1208 → 1209 functions, which is `sharePua` from
    item 21 and not a rename.

### Found while writing the StoreKit code, 2026-08-22

20a. **The plan was never written down on a phone.** `planKeep()` asked
    `Capacitor.Plugins` for `LinguaPlan`, and `Capacitor.Plugins` is filled by
    `@capacitor/core`, which this app does not load — `www/share.js` says so at
    length and it cost four builds to learn. Every write was the early return.
    And `setOnDisk()` takes the plan OUT of the settings file when the native
    side is there, on the grounds that the Keychain is holding it. Nothing was
    holding it: **on a real phone Plus came back as free at the next launch.**
    Fixed to `Capacitor.nativePromise`, the way `sharePush()` does it. Invisible
    in a browser, where `PLAN_NATIVE` is false and the plan stays in the file,
    which is why every check passed. **Device unconfirmed.**

### Waiting on a phone

19. Build **#82** is green and on TestFlight. What it has not had is a person:
    tapping three dots with round off should give a corner, and saving a letter
    should land on the letters list.
20b. `ios/App/App/LinguaStore.swift` — that it compiles at all, and then:
    buying in the sandbox, `restore` after deleting and reinstalling, and a
    renewal arriving while the app is closed. None of it can be seen here;
    there is no Swift toolchain in this container.

20. The free plan's keyboard chapter — the iOS steps, the hand-over state line,
    and the QWERTY with nothing to press — has only been seen in a browser,
    where the state line is always the red one because there is no bridge.

## If you are taking this over

1. Do what §1 says, in full — `git fetch --all` and `git branch -r`, not the
   two `rev-list` lines alone. This line used to read "check out the branch in
   §1, do not work on `master`" while §1 said `master` **was** the app and
   nothing needed checking out. The two were read together exactly once, by a
   session that then worked on the wrong copy for a day.
2. Read `CLAUDE.md` end to end. It is the specification, not an overview, and
   every rule in it is a bug that already shipped once.
3. Run `npm test` before touching anything, so you know what green looks like
   here. It prints counts — `screens walked: 366`, `screens the mirror
   rendered: 275`, `buttons pressed: 8683` — and a change meant to alter
   nothing has to leave them where they are. All three measured 2026-08-22.
4. If what you are about to do is in §3, you are starting it, not continuing it.
