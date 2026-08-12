# Architecture

What this app is made of, and where each thing is the truth.

`CLAUDE.md` says how code here has to be written; `docs/STATE.md` says what has
been built. This file says what the shape is. When the three disagree, the
checks in `tools/` win — a document is a claim, and a claim nothing holds is
worth nothing here.

## One page, no build step

`www/index.html` loads every `.js` with a `<script src>` tag, in an order that
matters (`CLAUDE.md` rule 9). There is no bundler, no transpiler and no build:
what is in the repo is what runs on the phone, in WKWebView, on whatever iPhone
the user already owns. That is why `www/**` is ES5 and why `tools/es5-check.mjs`
exists.

Capacitor wraps it for iOS. `ios/App/` is the native side: the share bridge and
the system keyboard extension.

## The two sides

The single most important structural fact about this app.

```
  the making side                 the reading side
  ---------------                 ----------------
  one dictionary   WORDS          a timeline of posts
  one alphabet     LETTERS        written by other people
  one writing sys  SCRIPT/STG     in languages this phone
  one keyboard     KB             has never seen
  all global, all "the one
  in front of me"
```

Every global on the making side is a lie on the reading side, and it is a lie
that tells the truth for as long as you are the only person here. `www/post.js`
and `www/card.js` each have a line across them; below it, a post renders from
the post. `tools/sides-check.mjs` holds both. See `CLAUDE.md` rules 8 and 12,
and `docs/DATA_MODEL.md` for which fields travel on a post.

## Where the truth lives

| thing | the truth is | read by |
|---|---|---|
| a language's words, letters, script, keyboard, world | `localStorage`, under `lingua.<id>.<slice>` | globals loaded at boot and on `langOpen()` |
| which languages exist, which is open | `lingua.langs`, `lingua.cur` | `LANGS`, `langId` |
| the person's settings | `lingua.set` | `SET` |
| the person's session | `lingua.sess` | `SESS` (`www/net.js`) |
| the person's profile | `lingua.me` | `ME` (`www/me.js`) |
| the timeline | `lingua.posts` | `POSTS` (`www/post.js`) |
| a copy that survives the app | `Documents/Languages/<name>.json` on the device | `bkPack()` / `bkTake()` (`www/backup.js`) |
| what the server holds and who may touch it | `supabase/schema.sql` | nothing on the phone decides this |

**Nothing a person makes is on a server today.** The timeline is
`localStorage`. The `post` / `follow` / `quote` tables in `schema.sql` are
written and unused. See `docs/STATE.md`.

## Where a screen comes from

```
  boot.js          starts the app
    shell.js       PAGES: what a route is called, which tab it is under
    route-map.js   page('build', vBuild) — the route bound to its view
    act-map.js     act('openWord', openWord) — a name bound to its function
    act.js         DO / AFTER / IN / CH / KD, and one delegated listener
```

A button carries a **name**, never code. `tools/act-check.mjs` proves both
directions: nothing is asked for that is not bound, and nothing is bound that
no screen asks for. `tools/press.mjs` then presses every button of every screen
for real.

## Where data flows

```
  a person types
      ↓
  a global (WORDS, LETTERS, KB, WLD, …)
      ↓  save() / saveLetters() / saveKb() / saveWld() / …
  localStorage,  lingua.<id>.<slice>
      ↓  bkTouch() marks it, bkPack() walks SLICES
  one JSON file in Documents  ←→  iOS device backup, Files app
      ↓  bkRestore() on launch, fills in ONLY what is missing
  back into localStorage
```

and, once, in the other direction:

```
  a post is written
      ↓  postInk(ln) cuts the line into shapes AT WRITE TIME
  the shapes are frozen ON the post
      ↓
  a reader — the timeline, or a card — draws from the post
  and never from the dictionary that happens to be open
```

That second flow is the subject of `docs/DATA_MODEL.md` § past data.

## The native side

The bridge injects `toNative`, `nativePromise`, `nativeCallback`,
`isPluginAvailable` and `withPlugin`, and nothing else. `registerPlugin` and
`Plugins` belong to `@capacitor/core`, **and this app has no bundler and never
loads it** — so `Capacitor.Plugins.X` is undefined on a phone and silently does
nothing. The call is `Capacitor.nativePromise('LinguaShare', 'write', …)`.
Four builds were lost to this once; see `docs/keyboard-extension.md`.

`ios/App/LinguaKeyboard/` is the system keyboard extension. Every `.swift`
under `ios/App/` must be in `App.xcodeproj`'s Sources build phase —
`tools/assets-check.mjs` holds that, because Xcode compiles what the project
file lists and nothing else.
