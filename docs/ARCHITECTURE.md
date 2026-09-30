# Architecture

What this app is made of, and where each thing is the truth.

`CLAUDE.md` says how code here has to be written; `docs/STATE.md` says what has
been built. This file says what the shape is. When the three disagree, that is a
contradiction to report: the order is owner decision → spec → tests → code
(`CLAUDE.md` § Code is not the specification).

## One page, no build step

`www/index.html` loads every `.js` with a `<script src>` tag, in an order that
matters (`CLAUDE.md` rule 9). There is no bundler, no transpiler and no build:
what is in the repo is what runs on the phone, in WKWebView, on whatever iPhone
the user already owns. That is why `www/**` is ES5 and why `tools/es5-check.mjs`
exists.

Capacitor wraps it for iOS. `ios/App/` is the native side: the bridge
(`App/LinguaShare.swift` — the App Group the keyboard and the widget read, the
sheet an export writes, the photo picker, the system's ask, and the voice files
an earlier version recorded), the App Store's receipts (`App/LinguaStore.swift` — the plan itself is the
server's answer, `supabase/functions/verify-plan/`), the system keyboard extension (`LinguaKeyboard/`) and
the home-screen widget (`LinguaWidget/`).

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

**DL — the third thing, and it is built.** A downloaded official asset is a
language on the reading side that is filed like one on the making side: it sits
in `LANGS` carrying somebody else's `language.owner`, its slices in memory
(`LSL`, rule 22) like any other language's, and it is
**switched to** rather than merged in (OWNER DECISION 2026-08-25,
`docs/FEATURE_RULES.md`). It is the first language this app holds that its user
did not write, and every global above is still 「the one in front of me」 — so
the line `sides-check` holds does not move, it just has a case where the
language in front of you is one you may not edit. What stops the edit is not a
locked door but `langLocked()` (`www/core.js`), asked at every saver.
**And it is used, never had** (OWNER 2026-09-30, every plan): nothing of it
leaves the app — no font, SVG or sheet file, no copy, not sent to the iPhone
keyboard, only a card of a post — and nothing of it is written to this phone's
disk, so it has no copy for a launch with no signal. `langOut()` (`www/core.js`)
is the one question every way out asks, and `theirs-check` counts them.
`docs/DATA_MODEL.md` § a language that is only read is the whole of it.

## Where the truth lives

| thing | the truth is | read by |
|---|---|---|
| a language's words, letters, script, keyboard, world | **the `slice` rows on the server, and nowhere else.** `LSL` in `www/core.js` holds them under `lingua.<id>.<slice>` while the app is RUNNING — memory, not this phone's disk 「今ファイルもいらん。オンラインのみで行こう」 OWNER 2026-09-04 | globals loaded on `langOpen()`; `netSaveNow()` sends a save, `netLangsDown()` brings a language back |
| the timeline — a post, its photographs, its voice, reactions, follows, blocks, reports | **the server**, with `lingua.posts.<uid>` as the copy that survives a bad network 「SNSは全部サーバー」 | `POSTS` (`www/post.js`) |
| what was written and not sent | **the `draft` rows on the server**, with `lingua.drafts.<uid>` as the copy | `DRAFTS` (`www/post.js`) |
| the person — the handle, the display name, the profile picture | **the `profile` row on the server**, with `lingua.me.<uid>` as the copy | `ME` (`www/me.js`) |
| which languages exist, which is open | `lingua.langs.<uid>`, `lingua.cur.<uid>` — that account's index of the copies this phone is holding. A language's id IS its `language` row's id; whether that row has been made is `langRowUp()` (`LROW`, memory, `www/core.js`) | `LANGS`, `langId` |
| the person's settings | `lingua.set.<uid>`, written there the moment it is written (`acctPut()`) and read back when that account arrives (`acctFor()`). `lingua.set` holds only what `SET_PHONE` names — this handset's own setup | `SET` |
| the person's session | `lingua.sess` — the token pair only | `SESS` (`www/net.js`) |
| what the server holds and who may touch it | `supabase/schema.sql` | nothing on the phone decides this |

**No row of that table is the device's.** 「端末ごとにやることなんてねえよ」
「アカウントごとってずっと言ってるよな？」 OWNER 2026-09-03. Every `lingua.*`
key is a working copy of something an account owns, filed under the account it
belongs to — the settings among them (`SET_PHONE` and `acctPut()` in
`www/core.js`, where a field is an account's unless it is named as this
handset's setup), and an exported sheet is that account's language in a form a
person can hold. When something new is stored the question
is not 「is this the phone's」, because there is no answer to that: it is
**「which account is this」**, and a thing that cannot answer it must not be
written down. `CLAUDE.md` § Online.

The one exception is `lingua.sess`, and it is not an exception in the way it
looks: it is not a thing somebody has, it is **which account this phone is**.

**And the plan is the account's** 「課金とアカウントとキーボードはアカウントに
結びつく」 OWNER 2026-09-01 — and **this phone holds no word for it at all**
(2026-09-11). `PLAN` in `www/core.js` is what `verify-plan` answered about the
account that is signed in; it is asked at the launch and at the door and it is
forgotten when the session goes. 「まだ訊けていない」 is a state of its own and
is never `free` — falling to free is what made a paid phone open as a free one.
The keyboard beside it in that sentence is the language's.

This is the kind of file that goes on being believed after it stops being
true, so re-check rather than trust:

```
grep -o "rest/v1/[a-z_]*" www/net.js | sort | uniq -c | sort -rn
```

Read what it prints rather than the list somebody wrote down after running it
once. **`language` and `slice` are among them**. A language and every one of
its slices go up and come back: `netLangRow()` makes the `language` row (its id
is the language's id; `langRowGot()` records that it exists),
`netSlices()` reads them, `netSliceUp()` sends one through `slice_put()`
(the one save, `netPut()`), and the SERVER puts two copies together
(`slice_in()` in `supabase/schema.sql`, 2026-09-27) -- the phone does not
merge; `netLangSync()` sends what the walk made, called by the door
(`netTook()`) and by `langNew()` — never by the launch. The `quote` and
`publication` tables have no road from the phone (quoting rides on
`post.quote_of`).

**And every one of them goes out as somebody.** 「サーバーは、サインインして
いない人には何も返さない」 OWNER 2026-09-22. `netSend1()` (`www/net.js`) is the
one window, so it is the one place that asks: with no token the request is not
sent at all, and `bad` runs with **401**, which is `netWhy()`'s
「サインインし直してください」. 401 rather than 0 because 0 is 「the wire」 and
this never touched one — two states, two answers.

**THE DOOR IS THE EXCEPTION AND IT IS ONE LIST**, `netDoor()`, beside that
function: `/auth/v1/*` (signing in, signing up, the six-digit code, the
forgotten password, the hour running out) and `/rest/v1/rpc/email_taken`
(whether an address already has an account — without it the door cannot tell
「sign in」 from 「sign up」). Nothing else. Read `netDoor()` rather than this
sentence; a road added to it is a road anybody can walk.

**A PHOTOGRAPH AND A VOICE GO THE SAME WAY, and they are the one road that
could not simply be signed.** A tag's `src` carries no headers, so
`<img src="…/object/public/post-media/<path>">` was fetched by anybody. The
bytes are fetched instead — `netMedia()` in `www/net.js`, one place,
`/object/authenticated/…` with the session on it — and what a tag is given is
a `blob:` of what came back. Not a signed URL: that would be a second way this
app authorises a request. `netUp()` is the write half of the same sentence and
sits beside it, and **both go through `netSend1()`** 「一本化してくれ」 OWNER
2026-09-27: `how.mime` sends bytes, `how.blob` takes bytes back, and `how.quiet`
keeps a picture filling in from counting as a press. They each had their own
XMLHttpRequest until then, with no renewal when the hour ran out, so an app
left open drew no pictures and sent no photographs. `token-check` holds both,
and counts every way out of `www/` — one, in `netSend1()`.

This closed something that had been open since the beginning: `netGet()` handed
`''` whenever there was no session, the header falls back to the publishable
key, and the reading policies were `using (true)` — so signed out, every read
in this app went to the server as `anon` and was **answered**. Nothing threw,
every screenshot was right, and it was true for as long as the only person
looking was the one holding the phone.

So, the order:

```
  the server        is the record          language + slice rows
  LSL (memory)      is what the app holds  filled by netLangFill() when a
                                           screen drawn from it is arrived at,
                                           held as a draft until Save, sent
                                           by netSaveNow() -- and gone when the
                                           app closes 「オンラインのみで行こう」
```

What changes when the two differ is which one is **believed** — and the answer
is neither, on purpose. **Two phones can still both be editing one language**,
which is why the merge did not go with the disk copy -- it went to the server
(`slice_in()`, 「一本化してくれ」 OWNER 2026-09-27), which adds both sides and
lets neither win by being newer, because the cost of merging is a duplicate and the cost of
choosing is somebody's word 「そりゃあ両方足すだろ」.

**Making a language needs an account, and there is one kind** 「言語はアカウント
ないと作れないです」「匿名アカウントはねえよ」. The one place that is not true
yet is the first language: it is minted at the top of `www/core.js`, which
`index.html` loads before `net.js` exists, so it cannot ask anything about a
session. `claude/admin` has the rest.

## Where a screen comes from

```
  boot.js          starts the app
    shell.js       PAGES: what a route is called, which tab it is under
    route-map.js   page('build', vBuild) — the route bound to its view
    act-map.js     act('openWord', openWord) — a name bound to its function
    act.js         DO / IN / CH / KD, and one delegated listener
```

A button carries a **name**, never code. `tools/act-check.mjs` proves both
directions: nothing is asked for that is not bound, and nothing is bound that
no screen asks for. `tools/press.mjs` then presses every button of every screen
for real.

## Where data flows

```
  a person presses
      ↓
  a global (WORDS, LETTERS, KB, WLD, …)
      ↓  save() / saveLetters() / saveKb() / saveWld() / …
  LSL (memory),  lingua.<id>.<slice>        ← what the running app holds
      ↓  on Save (keepSave()), or the press itself on a screen with no Save
      ↓  (bkTouch()): netSaveNow() → netSliceUp() → netPut() → slice_put()
  slice_in() on the server puts two copies together
  the `slice` rows on the server            ← the record
      ↓  back down by netLangFill() when a screen drawn from it is arrived at

```

**There is nothing off to one side** (`CLAUDE.md` rule 11): a save reaches
the server when Save is pressed (or, on a screen with no Save, on the press
itself), and `netLangFill()` (`www/net.js`) — asked by the door
onto any screen drawn from the language (`PAGES`' `lang:1`) — is what a phone
whose storage was reclaimed comes back from.

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
