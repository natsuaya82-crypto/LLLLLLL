# Where this project actually stands

`CLAUDE.md` says how the code has to be written. This says what has been built,
what has not, and what is not the repository's to hold. Read it before doing
anything in a session that did not build the thing it is about to change.

Everything below was checked against the repository on **2026-08-11**, not
remembered. Where a claim can go stale, it says how to re-check it.

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

**The timeline is on the phone and nowhere else.** This is the one to know
before doing anything with the SNS.

- `www/post.js` keeps every post in `localStorage` under `lingua.posts`.
- The app talks to exactly two things on the server: `/auth/v1/*` and
  `/rest/v1/profile`. That is the whole list — check it with
  `grep -n "rest/v1\|auth/v1" www/*.js`.
- `supabase/schema.sql` **does** have `post`, `quote`, `follow`, `publication`,
  `language` and `prompt` tables, each with row level security written and held
  by `npm run rls`. **Nothing in the app reads or writes any of them.** The
  schema is ready and unused.
- `vExplore` and `vNotif` in `www/sns.js` are `snsEmpty(...)` — a placeholder
  screen with a line of text. The Explore and Notices tabs have no contents.

So a post written on one phone cannot be seen on another, and there is no
server-side feed to moderate, count, or operate. Putting posts on the server is
work that has not been started, not work that has been done and turned off.

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

## If you are taking this over

1. Check out the branch in §1. Do not work on `master`.
2. Read `CLAUDE.md` end to end. It is the specification, not an overview, and
   every rule in it is a bug that already shipped once.
3. Run `npm test` before touching anything, so you know what green looks like
   here. It prints counts — `screens walked: 224`, `screens the mirror
   rendered: 324`, `buttons pressed: 3636` — and a change meant to alter
   nothing has to leave them where they are.
4. If what you are about to do is in §3, you are starting it, not continuing it.
