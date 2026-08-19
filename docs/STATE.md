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

Everything below was checked against the repository on **2026-08-11**, and §3
and §5 again on **2026-08-19**, not remembered. Where a claim can go stale, it
says how to re-check it — and §3 is the proof that it does: it went on saying
the timeline was not on the server for a week after it was.

---

## 1. `master` is the app again. Keep it that way.

`master` and `claude/cowork-migration-review-wfx1ra` are the same commit. A
fresh clone is the current app, and nothing needs checking out.

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
git fetch origin master
git rev-list --count origin/master..HEAD     # commits master has not got
git rev-list --count HEAD..origin/master     # commits you have not got
```

Two zeros means what you are reading is the app. Anything else means find out
why before writing a line, and say so to whoever is running the branch — a
number here is the difference between "not built" and "not fetched".

The branch has only ever been ahead of `master` in a straight line, never
beside it, so bringing `master` up is a fast-forward and cannot conflict.
Pushing to `master` is the owner's call and is asked for each time.

---

## 2. What is built and works

- **The free plan, whole.** Twenty-eight letters (`a`–`z`, `!`, `?`), your own
  shapes on them, the dictionary, the grammar stages, the notebook. `CLAUDE.md`
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
nothing in the app touches any of them.

**No StoreKit.** The plans screen exists and `SET.plan` can be set, but nothing
charges anybody. `docs/apple.md`.

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

## 5. The gate, and what CI does not run

`npm test` is ten checks and is the specification. `CLAUDE.md` → "The ten rules
the gate enforces".

**GitHub Actions runs three of them** — `assets`, `es5`, `i18n`
(`.github/workflows/i18n.yml`). A green tick on a push does not mean the gate
passed. `dead`, `migrate`, `import`, `sides`, `act`, `conv` and `press` run only
where somebody runs them, which means locally, which means you.

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
typed on; #47 was green; #48 is the run for the head of this branch as of
writing. iOS work beyond triggering that workflow — opening the project,
running on a simulator, `npx cap sync ios` — needs a Mac with Xcode and cannot
be done from a Linux session.

---

## 7. What is next, as of 2026-08-11

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
4. **The two free ceilings are never explained in words.** A hundred words and
   three AI calls a day. `capBanner()` warns at twenty words left and nothing
   says either number before you meet it.
5. **Signing in from Settings** was fixed but has not been opened on a phone.
   `obBackTo`/`obReturn` in `www/onboard.js`.

### Found and left alone, deliberately

6. **A letter of a hidden kind is counted and unreachable.** The Letters header
   says `5 / 30` while the rooms inside come to 29, because `ltKinds()` drops
   the digits room on the free plan and `LETTERS.length` counts it anyway. It
   can only happen to somebody who paid and stopped, which is the case the rest
   of the chapter already worries about.
7. **`ai` lifts at Plus, `sug` only at Studio, and they are the same ceiling.**
   A Plus account is shown "3 left" on the word sheet forever and never spends
   one. `CAN` in `core.js` states it in one place now. Which plan buys the AI is
   a price and is the owner's to set, so nothing was changed.
8. **`press` never reaches `kbReset`.** One button of 152, so nothing is
   claimed about it.
9. **`tools/verify-script.mjs` is broken** — `ReferenceError: gstep is not
   defined`. It is a font experiment and is not in the gate.

### Offered and not yet answered

10. **`node --check` over `www/*.js` inside `es5-check`.** A comment closed one
    line early on 2026-08-11; `es5` and `dead` both passed it because they read
    with regular expressions, and the browser checks caught it ninety seconds
    later. Two seconds would have.
11. **Find the strings nothing says.** 270 of 692 keys in `en.js` never appear
    as a literal in `www/`, but most are built — `t('stg.'+p.id+'.t')` — so a
    grep cannot tell. `i18n-check` already renders 324 screens in 10 languages;
    recording what `t()` was asked for would say it properly. It has to be a
    report, not a failure: a toast on an error is real and unwalked.
12. **Two questions about screens, open since before the keyboard work.**
    Whether the post composer's line needs a visible border, and whether the
    word sheet's letter grid stays.

### Agreed long ago, never started

13. The onboarding as motion only.
14. Vertical writing.
15. A selectable line gap.

### The owner's, in a browser

16. Supabase — the reset mail template and the Redirect URLs (see 3).
17. App Store Connect — the two subscriptions, and TestFlight. `docs/apple.md`.
    **There is no StoreKit code at all**, so the subscriptions cannot be bought
    yet however they are configured.
18. GitHub Secrets, if a build ever needs a new one. No agent can write one.

### Waiting on a phone

19. Build **#48** is green and on TestFlight. What it has not had is a person:
    tapping three dots with round off should give a corner, and saving a letter
    should land on the letters list.
20. The free plan's keyboard chapter — the iOS steps, the hand-over state line,
    and the QWERTY with nothing to press — has only been seen in a browser,
    where the state line is always the red one because there is no bridge.

## If you are taking this over

1. Check out the branch in §1. Do not work on `master`.
2. Read `CLAUDE.md` end to end. It is the specification, not an overview, and
   every rule in it is a bug that already shipped once.
3. Run `npm test` before touching anything, so you know what green looks like
   here. It prints counts — `screens walked: 224`, `screens the mirror
   rendered: 324`, `buttons pressed: 3636` — and a change meant to alter
   nothing has to leave them where they are.
4. If what you are about to do is in §3, you are starting it, not continuing it.
