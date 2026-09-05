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

Capacitor wraps it for iOS. `ios/App/` is the native side: the bridge
(`App/LinguaShare.swift` — the voice files and the sheet an export writes; the
backup file it also wrote is gone, `CLAUDE.md` rule 11), the plan in the Keychain (`App/LinguaStore.swift`,
`App/LinguaPlan.swift`), the system keyboard extension (`LinguaKeyboard/`) and
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
in `LANGS` with `mine:false` and under `lingua.<id>.<slice>`, and it is
**switched to** rather than merged in (OWNER DECISION 2026-08-25,
`docs/FEATURE_RULES.md`). It is the first language this app holds that its user
did not write, and every global above is still 「the one in front of me」 — so
the line `sides-check` holds does not move, it just has a case where the
language in front of you is one you may not edit. What stops the edit is not a
locked door but `langLocked()` (`www/core.js`), asked at every saver.
`docs/DATA_MODEL.md` § a language that is only read is the whole of it.

## Where the truth lives

| thing | the truth is | read by |
|---|---|---|
| a language's words, letters, script, keyboard, world | **the `slice` rows on the server, and nowhere else.** `LSL` in `www/core.js` holds them under `lingua.<id>.<slice>` while the app is RUNNING — memory, not this phone's disk 「今ファイルもいらん。オンラインのみで行こう」 OWNER 2026-09-04 | globals loaded on `langOpen()`; `netSaveUp()` sends a save, `netLangsDown()` brings a language back |
| the timeline — a post, its photographs, its voice, reactions, follows, blocks, reports | **the server**, with `lingua.posts` as the copy that survives a bad network 「SNSは全部サーバー」 | `POSTS` (`www/post.js`) |
| what was written and not sent | **the `draft` rows on the server**, with `lingua.drafts` as the copy | `DRAFTS` (`www/post.js`) |
| the person — the handle, the display name, the profile picture | **the `profile` row on the server**, with `lingua.me` as the copy | `ME` (`www/me.js`) |
| which languages exist, which is open | `lingua.langs`, `lingua.cur` — the phone's index of the copies it is holding. `LANGS[id].sid` is the language's row on the server, and an entry with no `sid` has never been up | `LANGS`, `langId` |
| the person's settings | `lingua.set`. Everything in it is that account's and is parked under `lingua.set.<uid>` by `setFor()` when somebody else signs in, EXCEPT what `SET_PHONE` names — this handset's own setup | `SET` |
| the person's session | `lingua.sess` — the token pair only | `SESS` (`www/net.js`) |
| what the server holds and who may touch it | `supabase/schema.sql` | nothing on the phone decides this |

**No row of that table is the device's.** 「端末ごとにやることなんてねえよ」
「アカウントごとってずっと言ってるよな？」 OWNER 2026-09-03. Every `lingua.*`
key is a working copy of something an account owns, filed under the account it
belongs to — the settings among them (`SET_PHONE` and `setParkKey()` in
`www/core.js`, where a field is an account's unless it is named as this
handset's setup), and an exported sheet is that account's language in a form a
person can hold. When something new is stored the question
is not 「is this the phone's」, because there is no answer to that: it is
**「which account is this」**, and a thing that cannot answer it must not be
written down. `CLAUDE.md` § Online.

The one exception is `lingua.sess`, and it is not an exception in the way it
looks: it is not a thing somebody has, it is **which account this phone is**.

**And the plan is the account's** 「課金とアカウントとキーボードはアカウントに
結びつく」 OWNER 2026-09-01 — `SET.plan` is where the value sits on this handset
while it travels, and `setFor()` is what stops it being handed to whoever signs
in next — `plan` is not in `SET_PHONE`, and nothing a person has is. The real copy on a phone is in the Keychain
(`ios/App/App/LinguaPlan.swift`). The keyboard beside it in that sentence is
the language's.

This is the kind of file that goes on being believed after it stops being
true, so re-check rather than trust:

```
grep -o "rest/v1/[a-z_]*" www/net.js | sort | uniq -c | sort -rn
```

Read what it prints rather than the list somebody wrote down after running it
once. What it answered today: `profile`, `post`, `follow`, `block`, `report`,
`draft`, `saved_search`, `recent_search`, `post_seen`, `profile_seen`,
`language_seen`, `react`, `prompt`, `plan`, the RPCs — **and `language` and
`slice`**. A language and every one of its slices go up and come back:
`netLangRow()` makes the `language` row and keeps its id on `LANGS[id].sid`,
`netSlices()` reads them, `netSlicePut()` upserts one, `netLangSync()` puts the
two copies together through `www/sync.js`, and **`boot.js` calls it on
launch**. `quote` and `publication` really are still unused.

So, the order:

```
  the server        is the record          language + slice rows
  LSL (memory)      is what the app holds  filled by netLangsDown() at launch,
                                           written as you type, sent by
                                           netSaveUp() -- and gone when the
                                           app closes 「オンラインのみで行こう」
```

What changes when the two differ is which one is **believed** — and the answer
is neither, on purpose. **Two phones can still both be editing one language**,
which is why `www/sync.js` did not go with the disk copy. `www/sync.js` adds both sides and lets neither
win by being newer, because the cost of merging is a duplicate and the cost of
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
  localStorage,  lingua.<id>.<slice>        ← the working copy, never the home
      ↓  netSlice1() — netSaveUp() on every save, netLangSync() at launch,
      ↓  both through syMerge() (www/sync.js)
  the `slice` rows on the server            ← the record
      ↓  and back down the same way, both sides added and neither made to win

```

**There is nothing off to one side any more.** A JSON file in Documents used
to stand there — written by `bkPush()`, read by `bkRestore()` at launch — and
it was what was left when neither of the other two was. It is deleted
(`CLAUDE.md` rule 11, 2026-09-04): a save reaches the server at once now, so
the hours it was covering are gone, and `netLangsDown()` at the foot of
`www/boot.js` is what a phone whose storage was reclaimed comes back from.

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
