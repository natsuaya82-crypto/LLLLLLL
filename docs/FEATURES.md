# Feature registry

Every feature this app has or is going to have, what plan it is on, whether it
touches data, and whether the owner has decided its shape.

**This is not a list of what is in the code.** `docs/STATE.md` is that. This is
a list of what the app *is* — so that a session about to build something can
find out whether it has already been decided, and stop rather than invent.

Read this before implementing anything. If a feature is not here, it has not
been decided, and deciding it is not yours to do (`docs/FEATURE_RULES.md` §
what is the owner's).

## Status

```
  planned       decided, not started
  in progress   being built now
  shipped       in the app and working
  deprecated    was in the app, deliberately removed — see the row's note
```

Marked separately, because they are not the same question:

```
  Owner decision   decided   the owner has said what this is
                   open      nobody has decided; do not guess
                   partial   some of it decided, the rest open
```

## The making side

| Feature | Status | Free | Paid | Data | Owner decision |
|---|---|---|---|---|---|
| Custom alphabet — draw a-z, `!`, `?`, digits | shipped | 38 slots, drawing only | `letters`: add / rename / delete | slice `letters` | decided |
| Dictionary | shipped | to 100 words; a lapsed plan **lists** the first 100 and keeps every one | `words`: past 100 | slice `words` | decided |
| A word's meanings, part of speech, family | shipped | yes | — | slice `words` | decided |
| A word's synonyms, opposites, examples, note | shipped | yes | — | slice `words` | decided |
| A word's register, fields, origin, changed-on | shipped | yes | — | slice `words` | decided |
| What a derived word is of its parent (活用 / 派生, and your own labels) | shipped | yes | — | slice `words` (`fm`) | decided |
| One screen for making and editing a word | shipped | yes | — | none | decided |
| A word is read before it is edited | shipped | yes | — | none | decided |
| Sound inventory, per letter | shipped | letter's own reading only | `snd`: choose a different one | slice `snd` | decided |
| A word read as something other than its letters (連音化 and the like) | shipped | no | `snd`: the reading page — the language's sounds and the whole IPA, grouped by how each is made, searched by those words, said out loud on every press | slice `words` (`sp[i].u`) | decided — it is sounds and only sounds; a letter never appears on it 「音から文字と文字から音で二重になるから困る」 |
| Writing system | shipped | alphabet only | `wsys`: syllabary, abjad, abugida, logography | `SET.wsys`, slice `script` | decided |
| Grammar stages | shipped | the fifteen there are | `gram`: your own | slice `phases` | decided |
| Notebook | shipped | yes | — | slice `notes` | decided |
| Numbers — a digit is a letter with a value | shipped | yes | — | slice `letters` | decided |
| What the language is for (the world) | shipped | yes | — | slice `wld` | decided |
| **AI に相談 — ChatGPT を本文入りで開く** | in progress | yes — アプリは生成せず鍵も持たない。開く先はその人のアカウント | — | none stored by this; reads `SET.askTo` (www/settings.js writes it) | **partial** — 既定 ChatGPT・相手は設定で選ぶ・ボタンは常に「AIに相談」は decided (2026-08-27)。**本文の文面と候補の数は open** — `docs/reports/ask-2026-08-27.md` §4 |
| Keyboard layout built in the app | shipped | fixed QWERTY, nothing to set | `kb`: your own | slice `kb` | decided |
| Keyboard: flick, four directions per key | shipped | — | `kb` | slice `kb` | decided |
| Keyboard: any letter on any key, any position, rows and layers | shipped | — | `kb` | slice `kb` | decided |
| Font built on the device (OTF) | shipped | yes | — | none (derived) | decided |
| Import a word list | shipped | paste | `file`: a file | slice `words` | decided |
| **write — letters brought in on a sheet** | **in progress** — the road is in (`www/sheet.js`, ch 26, `npm run sheet`); **the plan gate and the drawing are not** | — | **Pro**: the whole road, and the gate is NOT in the code yet | slice `letters`: `lt.sh` and `lt.via` **new** | partial |
| Export CSV | shipped | — | `data` | none | decided |
| Backup to Documents | shipped | **yes, on every plan** | — | the file | decided |
| Restore from Documents | shipped | **yes, on every plan** | — | fills in what is missing | decided |
| One language per person | shipped | 1 | 1 | `LANG_MAX` | decided |
| Word suggestions | **lifted** | — | — | none | the chips and their daily three went out with Studio; `makeWord()` in `www/reading.js` stays and is used everywhere else |
| The conversation — the last chapter | **lifted** | — | — | slice `talk` kept | out until the hosted model is in. See the note on `PLANS` in `www/core.js` |
| Forms made by a rule | shipped | yes | yes | `STG.fm` | decided — a rule offers, it does not declare. Nothing is made until asked, and what comes out is an ordinary word |
| A word shares as a page from a dictionary | shipped | yes | yes | none | decided — 1080×1350, senses numbered, the family, an example, the origin |

## The reading side

| Feature | Status | Free | Paid | Data | Owner decision |
|---|---|---|---|---|---|
| Writing a post | shipped | yes | — | `lingua.posts`, ink frozen on write | decided |
| One language, on every plan | shipped | yes | — | `lingua.langs` | decided — there is no way to make a second anywhere in the app, so it is not a price. `LANG_MAX` used to say so in `core.js` and fed a line of text on the language list; the line went with the ban on explaining things on a screen, and the constant went with it. Languages somebody else wrote are not counted: reading one is not making one |
| Timeline, on this phone | shipped, **not device confirmed** | yes | — | `lingua.posts` | decided — **an account is required to read it and to post**. 「なんでログインしてないアカウントで投稿できんの？」 The making side needed none; **2026-08-26 ended that** — 「言語はアカウントないと作れないです」. It works offline and goes up on the next connection; it does not work without an account |
| Timeline split — For you / Following | shipped, **not device confirmed** | yes | — | none new; `ME.fo` is the follow list already | decided — 「フォロー中とおススメみたいに分けたい」. For you is everything, Following is `ME.fo` plus your own, matched on the post's frozen `hd` |
| A post carries its own shapes (`ink`) | shipped | yes | — | on the post | decided |
| Replying, and the thread of a conversation | shipped, **not device confirmed** | yes | — | `post.to` (the id, already there), `post.toh` **new** — the handle it answers, frozen on write | decided — replies stay in the timeline carrying 「@xx への返信」; a post opens onto its thread; the indent stops at three |
| A card — one line as a picture | shipped | yes | — | none | decided |
| A card of a post is drawn from the post | shipped | yes | — | none | decided |
| Accounts — sign up, in, out, verify, reset | shipped | yes | — | `lingua.sess` (tokens only) | decided |
| Profile — face, name, handle, bio, **and your posts** | shipped | yes | — | `lingua.me` | decided |
| Pin a post to your profile | shipped | yes | — | `post.pin`, one at a time | decided |
| Share a post — the card | shipped | yes | — | none | decided |
| Cloud storage of a language | **shipped**, **not device confirmed** | **yes** | same | every slice, as `slice` rows | decided — **everybody, on every plan** 「クラウドは全員で」 (2026-08-22), re-confirmed 2026-08-26 「基本は全部サーバー管理」. This row said `no` / `yes, deferred` / 「deferred until Supabase $25 is worth paying」 and contradicted § 2 below, which had said **everybody** since 08-22. The money did not go away — see `docs/PAID_FEATURES.md` — it stopped being a reason to defer |
| A photograph on a post | shipped | **yes** | yes | `post.pic`, frozen on the post, 900px q0.72, `POST_BYTES` ceiling | decided |
| How big a photograph is shown, and opening one | shipped, **not device confirmed** | yes | yes | none — display only; `--picpct` in index.html, route `photo` | decided — one box for every photograph (a third of the screen's width, square), filled with `cover` so the picture is never stretched and the edges are off it, tap opens the whole thing 「xと同じって言ってるやんずっと」 |
| How hard a photograph is squeezed to store | shipped | 900px long edge, q0.72 | same | `POST_PIC`, `POST_PICQ`; ratio untouched | **open** — 「画質が下がるのはありえない」 against one photograph being 87 KB of the same localStorage the language lives in |
| Drawn letters placed on that image | shipped | **yes** | yes | none new — baked into `post.pic` when it is sent | decided |
| Your voice on a post — 30 seconds | shipped, **not device confirmed** | **yes** | yes | `post.vo = {f, ms}`; the bytes are a file in `Documents/Voices/`, never in `localStorage` | decided — 「30秒くらい」「ファイルに出す」「録音まで作る」 |
| Editing your own post | shipped | yes | — | overwrites `ln`, `ink`, `mn`, `tr` on that post; `post.ed` is new | decided — the line and the meaning only 「文と意味だけ」, and it says `Edited` |
| Which way a language is written | shipped | **reading, always** | `dir`: choosing one | `SCRIPT.dir` in the `script` slice; frozen on the post as `post.dir` | decided |
| A calendar of your own | shipped | **month and weekday names** | `gram`: choosing how many of each | `STG.months`, `STG.week`; the names are words with `slot` on them | decided — names and numerals only, no arithmetic of anybody's own (`www/cal.js`) |
| A post shown three ways | shipped | **all three layers** | — | layers 1 and 2 frozen on the post; layer 3 computed now | decided — the daily three went out with the AI (2026-08-22) |
| Post translated into natural languages at write time | **in progress** | yes | yes | `post.tr`, frozen on the post | decided — the seam is in (`postTr`, TR_SEAM); the translator is the reader's own device AI and is not wired up |
| Posts on the server | shipped, **not device confirmed** | yes | — | `post` rows | done — `netPush`/`netFeed`/`postCatchUp`. An account is required to read the timeline or post to it (decision 2026-08-18) |
| Explore | shipped, **not device confirmed** | yes | — | — | done — people while you type, posts when you press Search; both ask the server (`netFindWho`/`netFindPosts`) |
| Notices | shipped, **not device confirmed** | yes | — | — | done — `netNotices`, an RPC in `schema.sql` |
| Following | shipped, **not device confirmed** | yes | — | `follow` rows, `ME.fo` | done — `netFollow`, and Follow is on a person's row in the search |
| Quoting | **planned** | ? | ? | `quote` rows | **open** — the table exists in `schema.sql` and nothing reads it |
| **DL — a language taken from the official assets** | **planned** — 0 lines; **OWNER DECISION**, 未実装 | no | `dl`: **Plus**「DLはplusから」 | a `LANGS` entry that is **not** `mine`, and its slices; **nothing of yours is touched** | decided — it is **not merged into your own language, it is a language you switch TO**; it **cannot be edited**「トキポナに文字足したらトキポナじゃないです」; the four parts (単語・文字・文法・キーボード) are unlocked and taken **separately**; it is taken from the language's overview page on Home 「そこでdlしてください」. `docs/FEATURE_RULES.md` 2026-08-25 |
| How many DL'd languages a plan holds | **planned** — numbers decided, 0 lines | — | — | none yet | decided 2026-08-27 — 「DL言語は plus 1個 pro 2個。これは自作言語とはまた別」. Free 0 (it follows from 「DLはplusから」). Pro is **2, not the 3 the 08-25 question floated**. Counted SEPARATELY from your own languages, so `langCount()` is untouched. Still 0 lines: `CAN.dl` and its number go in with the first `can('dl')`, because `dead-check` refuses a capability nothing asks for — `docs/PAID_FEATURES.md` |
| Switching language by holding the profile | **planned** | — | — | none | **open** — 「プロフィールのとこ長押しで言語切り替えだって」 **conflicts** with the same day's decision that the list stays in Settings and is 「NOT moved onto the profile」. Both are 2026-08-25. Not resolved here |

### Notes on the open rows

**A post shown three ways.** This is what "translation" means here:

```
  1  the writer's own letters      post.ln + post.ink      already on the post
  2  what it means, in a natural   post.mn                 already on the post
     language, typed and
     confirmed by the writer
  3  the same thing rendered in    computed from MY         NOT BUILT
     THIS reader's own conlang     dictionary, now
```

It does not collide with the decision at the head of `www/post.js` — it runs
the other way. What is forbidden there is a machine *reading* an invented
language and telling everybody what it says, because the only person who could
catch it wrong never sees the result. Layer 3 starts from a natural sentence
the writer already confirmed and re-expresses it in **the reader's own**
language, with the reader's own dictionary. The guessing is about your own
words, and you are the one who can see it is wrong.

The three split cleanly along `docs/DATA_MODEL.md` § the three kinds, and the
third goes the opposite way from the other two **on purpose**:

```
  1  frozen    the writer's shapes. Must not move
  2  frozen    the writer's meaning. Must not move
  3  current   the reader's language. SHOULD move — a sentence that
               half-rendered yesterday renders fully today, because the
               dictionary grew. Freezing this one would be the bug
```

Missing: a lookup from a meaning to one of my words. The grammar stages exist.

Word order is `STG.order` — it belongs to the LANGUAGE, not the phone.
`SET.order` was the old flat key and `migrateGramLang()` in `www/phases.js`
copied it across; `grammar.js` says so on `orderOf()`. Six of them
(`ORDERS`), chosen on a screen. **The owner has said that is going away** —
「俺も選ばせたくないし、文章書いてたらsvoが基本でも助詞があるかもしれない」
(2026-08-26, relayed) — because a sentence with a particle in it is not
described by one of six letters-triples. Nothing has been built: `ORDERS` is
still six and `setOrder()` still writes one.

**What takes its place is a gradient, not another answer.** OWNER 2026-08-26:

```
埋めれば埋めるほど翻訳精度を上げるってだけで
なにも書いてないなら上がらないよ？
```

So there is no state to guard against here, and the question this settles was
asked the wrong way round. The engine falls back to `['SUBJECT','OBJECT','VERB']`
when a model says nothing (`translate.js:141`, `295`), and that was read as the
app CLAIMING a language is SOV when nobody said so — the thing `stTouched()`
exists to prevent on the old screen. It is not a claim. **It is the floor a
language sits on before anything has been written, and a language that writes
nothing simply does not translate well yet.** Filling things in is what moves
it; nothing has to be true for a language that has filled in nothing.

That is why a language with no particles needs no special case: particles
OVERRIDE position for the words that carry them (`morphology.js:110-115`), and
a language with none is arranged by position alone, which is what English and
Chinese do. Adding particles does not replace word order — it takes words out
of the positional queue one at a time.

**Built 2026-08-26.** A particle is a WORD, made in the 助詞 stage the way the
word for "not" is made in the 否定 one, and `gInfl()` in `www/grammar.js` is
what hands it to the engine. Three slots — the doer, the one done to, the one
given to — because those are the roles WORD ORDER would otherwise decide, and
a mark is what takes a word out of that queue. Where a thing is and where it
goes are the 場所 stage's adpositions and are not repeated here.

Nothing new is stored: the particle is a word in `WORDS`, whether the stage is
on the list is `STG.set.part`, and the `inflections` the engine reads are
rebuilt on every read. `form` is the particle's spelling, so a stored copy
would be the spelling as of the day it was saved — the same reason `words` and
`grammarRules` are views. **`gram2` is still written by nobody**: `gModel()`
reads it (§1 of that day's work), and there is nothing in the app yet that a
person can write which does NOT point at the dictionary.

The stage was already in `STAGES_IF` — off the list until a language uses one,
because English has none and opening the chapter with it would be the app
asserting something about somebody's language. What it did not have was a way
IN, which rule 19 of `CLAUDE.md` is written about ("a page arrives with the way
THERE and the way BACK already on it"). The door is at the FOOT of the stage
list, beside the one that adds a stage of your own, and it is gone once the
stage is on the list. **Where the door goes is a screen decision and is the
owner's** — that it has to exist is not.

Decided since:

```
  layer 2   translated WHEN WRITTEN, not when read, and carried on the post.
            Japanese in, English out for an English reader. Always on screen
  layer 3   Plus. Free gets three. Appears on a button, not by default
  a word    the reader has no word for stays in the natural language and is
            shown IN RED, so the gap is obvious — and it is also the door to
            making that word
```

Still open, and two of them block the work:

- **there is no hosted model.** `AI_SEAM` is a marked seam; everything the app
  calls AI today is a local generator that runs offline and costs nothing
- **the key cannot live on the phone.** Post-time translation needs a
  server-side function holding it, which is server work in the same category
  as cloud sync, and it costs money per post
- which languages a post carries (ten is ten calls and ten copies on the post)
- what happens when translation fails, or the phone is offline when posting —
  **the post must still go out**
- whether a post published without translations can gain them afterwards
Layer 3 itself is dictionary lookup: it costs nothing and runs offline.

**It has no limit and no capability.** It used to be "three a day on free",
and both halves are gone: `AI_FREE_DAILY` went out with Studio, `tr` is not
one of the nine names in `CAN`, and `TR_FREE_DAILY` has no declaration
anywhere in `www/`. The three were the AI's price wearing layer three's
clothes, and there is no AI 「1日3回は亡くなりましたaiいれないから」. The
only ceiling free has left is `FREE_LIMIT`, and that is words.

**Images.** An image and the letters placed on it are past-tense data the
moment the post exists, so both freeze onto the post exactly as `ink` does.
They also make a post large: `docs/DATA_SAFETY.md` measured a whole free
language at ~25 KB, and one photo is bigger than that. Where the bytes live is
part of the decision.

**Direction.** Which way a line runs travels ON the post for the same reason
its shapes do — otherwise a vertical language read on a horizontal phone comes
out horizontal, which is the card bug in another costume. Four directions:
`ltr`, `rtl`, `ttb-rl`, `ttb-lr`. Reading one is free on every plan; choosing
one is `dir`, at Plus.

The card is the one place that does not do all four. It is a landscape
composition — a band of letters across the middle of 1920×1080 — so a column
of them has nowhere to go. A card of a vertical post sets the line **across**,
in the direction the columns run, which is what a horizontal banner of a
vertically-written language is. It is a compromise and it is written down in
`docs/BACKLOG.md` rather than left to be discovered.

## The native side

| Feature | Status | Free | Paid | Data | Owner decision |
|---|---|---|---|---|---|
| System keyboard extension (iOS) | shipped | yes | — | App Group | decided |
| Hand-over app → keyboard | shipped | yes | — | App Group | decided |
| Purchases (StoreKit) | **planned** | — | — | Keychain | **open** — no code exists; the plan is set by hand |
| Android | **planned** | — | — | — | **open** — one repo with `android/` beside `ios/`, nothing started |

## What is left to do online

Everything on this list needs the server. Nothing on it is started unless it
says so. It is one list because 「必要なものは全部オンラインまとめてやる」 and
because the way a server feature gets lost is by being half-written down.

**Already online, so that this list is read against something:** accounts and
the profile, posts (write, read, reply, delete), likes and boosts, following,
notices, photographs and voice in Storage, search — people and posts — and
deleting an account.

**One kind of account, and no anonymous ones** (OWNER DECISION 2026-08-26 —
「匿名アカウントはねえよ」「二種類になる意味も分からないけど」). An account is
somebody who signed in; nothing asks a second question about what kind it is.
`has_account()` beside `is_member()` in `supabase/schema.sql` existed to let an
anonymous one through and comes out with it. `claude/admin` has that half.

### 1. The plan, on the server — the one with money on it

The plan is in the Keychain now — `ios/App/App/LinguaPlan.swift`, read before
the web view loads and injected as `window.__plan` — because `localStorage` is
a file inside the app and that file is in the backup a phone makes onto a PC,
where free tools and no jailbreak turn `free` into `plus`. That door is shut.
The one behind it is not: on a jailbroken phone the app's own JavaScript can be
edited and the question never gets asked. **So anybody determined enough can
still set themselves to Plus**, and the server would not know: `schema.sql` has
no plan column and no plan check; `is_member()` asks whether somebody is signed
in and nothing else.

Today that costs nothing but the sale — everything a plan opens runs on the
phone (`assist.js`, `grammar.js`, `reading.js` make no network call), and there
is no cloud storage. **The day money is taken that stops being true**, so:

1. the StoreKit receipt is verified **server-side**, not by the app
2. the plan lives on the account, in `profile` or beside it
3. anything that costs us money is refused **by the server**
4. `CAN` stays what it is: which buttons to show. It is not a security check
   and must never be relied on as one

Decided so far: the four products and their prices (2026-08-14), and that
StoreKit is not to be written yet.

### 2. Cloud storage of a language — **everybody**, not Plus

**OWNER DECISION 2026-08-22** — 「クラウドは全員で」. It is not what Plus sells
any more, and it is not deferred: everything belongs to the account, the
server is true and the phone keeps a copy that works with no signal.
`CAN.data` has to be redefined when this lands.

**Re-confirmed 2026-08-26** — 「基本は全部サーバー管理 言語周りだけバックアップに
file使う」. The file in `Documents/` is not going away; it stops being the truth
and becomes the backup.

**This section said 「what is missing is the row and somewhere to put a slice」
and both of those were built.** It also listed two things as open that have
since been answered. Corrected 2026-08-26 by reading `www/net.js` rather than
by remembering:

- **a row per slice**, not a column and not a file in Storage. `slice` in
  `supabase/schema.sql` is `(language, kind)` primary key, `body` the exact
  string `localStorage` holds — so a slice has one shape and not two that
  could disagree, and it is the same string `bkPack()` writes to the file.
- **two phones**: `www/sync.js` (ch. 26) reads, merges and writes back, and
  **neither side wins by being newer.** Both are added. The price of that is a
  duplicate, never a deletion 「そりゃあ両方足すだろ」 — which is
  `docs/DATA_SAFETY.md`'s rule, applied to the one place it would have been
  easiest to break.
- `netLangRow()` makes the `language` row and puts its id on `LANGS[id].sid`;
  `netSlicePut()` upserts (`Prefer: resolution=merge-duplicates`);
  `netSlices()` reads them; `netLangSync()` runs the three, and
  `www/boot.js` fires it on launch.

`SLICES` is **twelve**, not eleven — `gram2` joined it and this line was not
updated. `docs/DATA_MODEL.md` has the list.

What is genuinely still open here:

- **how often.** Once, on launch, today. 「全部だって」 is all that reached this
  branch on the question and it is not enough to build a loop from.
- **what it costs.** Every account's slices, on every plan, is storage and
  egress proportional to people rather than to payers. That was the original
  reason for 「deferred until Supabase $25 is worth paying」, and the decision
  overrode the deferral without the cost changing. `docs/PAID_FEATURES.md`.
- **a downloaded language must be left out of all of this.** See § 10.

### 3. Publishing a language — `language`, `publication`

Both tables exist with row level security written and held by `npm run rls`,
and **nothing in the app reads or writes either**. The profile has a language
page with a public/private switch and it is local. This is what makes the
switch mean anything, and what puts a language name on somebody found by
searching.

### 4. Publishing and downloading — a keyboard, an alphabet, a dictionary

Decided 2026-08-19 and **not started**. The author decides what is public, per
thing. Downloading a keyboard or an alphabet is **free**; downloading a
dictionary is **Plus**. Making and publishing stays Plus. A downloaded
keyboard goes on its own shelf, up to three, beside the three somebody built.
A downloaded dictionary is a language you can READ and is never merged into
your own — `FREE_LIMIT` counts your own words and nothing else.

Half of it exists: `shareKbd()` already produces a keyboard with the shapes
cut onto its keys, needing no alphabet and no dictionary on the other side.
That is what a download has to be, and it is the same argument rule 8 makes
about a post.

A downloaded keyboard is edited as it stands — the download is the copy. What
cannot be mixed is the alphabet: the letters that go on its keys are the
downloader's own.

**This section is 2026-08-19 and § 10 below is 2026-08-25. They are not the same
thing and they do not agree.** This one is somebody taking somebody else's
language; § 10 is the official assets. Three things differ — read § 10 before
building either. What they agree on is the important half: a downloaded
dictionary **is never merged into your own**, decided twice, six days apart.

### 5. Quoting — `quote`

A word of somebody else's post taken into your own language. The table exists
and nothing reads it.

### 6. The day's sentence — `prompt`

One a day, and `post.prompt` already points at it. The table exists and
nothing reads it.

### 8. Sales and analytics, inside the app — **implemented** (2026-08-26)

**OWNER DECISION 2026-08-26.**「売り上げもアナリティクスも見れるようにしたい」
「アプリの中で見たい」「画面を開いたときに毎回」。

Four things, all four now on the admin screen — which is where they went
because the row at the foot of settings this was going to hang off stopped
existing on the same day (「設定の通報ボタン消せ」OWNER 2026-08-26), and the
owner's own words for that screen were 「通報の確認とかアナリティクスとか売り上げ
とか含めて全部見れる新ページ」.

```
  ① 契約者数と売上          App Store Connect   -- supabase/functions/appstore/
  ② ダウンロード数           App Store Connect   -- the same one request
  ③ 解約と継続             App Store Connect   -- the same three reports
  ④ アプリの中の数           Supabase            -- admin_counts()
```

| | |
|---|---|
| Plan | not a plan — **`admin` only**, and `admin` is set by hand in the dashboard |
| Data | **none.** No table was added and `schema.sql` did not move |
| Decided | the four things, the screen, and that it refreshes on every open |
| Not decided | what a number is called, what period it covers, how the takings of several currencies should read, whether a continuation RATE is wanted and against what |

**It is `is_admin()` and not `is_staff()`.** § 8 said staff when it was
written, and then the screen these numbers sit on turned out to be the admin
one — 「＠linguaのアカウントだけ管理者ページには入れる」. The function asks the
same `is_admin()` `admin_counts()` asks, with the caller's own token.

**No table.** The plan said "a table for what Apple returns (undesigned)".
There is nothing to design: `GET /v1/salesReports` is synchronous and hands the
report back in the body, so there is nothing to keep a copy of between opens.

**"Every open" was checked at Apple before anything was built**, which is what
the previous version of this section demanded by name. It holds — for the
takings, the downloads and the subscriptions, one synchronous request each.
What it does NOT mean is fresh: Apple's data is **next-day, in Pacific time**,
so there is no such thing as today's takings and every number on the screen
carries the day it is for. The App Store **Analytics** reports really are the
"ask for a report to be made, then come back for it" shape — POST a request,
then walk reports → instances → segments, with a download URL that lives five
minutes — and nothing here uses them, because everything ①②③ need is in the
sales reports. `docs/reports/sales-2026-08-26.md` § 1 has every source.

**Two numbers are deliberately not produced, and both are the owner's.**
The takings are **one row per currency and are never added up** — Apple pays
per storefront in that storefront's currency and an exchange rate is not in
this repo (`www/store.js`: "Building '$' + a number is how an app ends up
showing dollars to somebody being charged yen"). And there is **no continuation
rate**: neither report has such a column, and producing one means choosing a
denominator and a period.

**A fourth key is required**, which § 10 of `supabase/setup.md` did not know
when it was written: `filter[vendorNumber]` is mandatory on every sales report
and no endpoint will tell you yours. It is now `ASC_VENDOR_NUMBER` there.

### 7. Taking a post down — **done** (2026-08-21)

Blocking and reporting were done on 2026-08-19: `block` and `report` in
`schema.sql`, the ⋯ on every post, and the timeline asking the server to leave
blocked authors out. Nothing read the reports. They went into a table with no
select policy on it, so the only way to see one was the Supabase dashboard.

Now: `profile.staff`, one boolean set by hand in the dashboard and revoked
from every role the app signs in as — there is no screen that grants it. For
that one account a row appears at the foot of the settings list, and behind it
`www/mod.js`: the reports newest first, each carrying the post it is about,
with a button that takes it down.

**Down, not deleted.** `post.hidden_at` and `post.hidden_why`, set by
`post_hide()` and cleared by `post_show()` — two `security definer` functions
rather than an update policy, so whoever answers a report cannot rewrite what
somebody said. A deletion could not be undone when the report turns out to be
wrong, and the reports pointing at the post need it to still be there.

**`post_read` is the part that matters.** `hidden_at is null or author =
auth.uid() or is_staff()`. The author still gets their own post, with a line on
it saying it was taken down — a post that goes silently missing is the app
lying by omission. `npm run rls` attacks all of it: B cannot make B staff, B
cannot take a post down, A cannot put A's own post back up.

**Two column privileges, and they are the reason any of the above holds.** Row
level security says which ROWS may change and has nothing at all to say about
which COLUMNS, so "you may edit yourself" was also "you may make yourself
staff", and "you may edit your own post" was also "you may put it back up".
Both are one UPDATE with one extra field in it. The table-level grant is
revoked at the foot of `schema.sql` and what may be written is named.

**And ejecting somebody**, which is the other half guideline 1.2 asks for by
name — taking the post down leaves whoever wrote it free to write it again.
`profile.banned_at`, set by `account_ban()` and cleared by `account_unban()`,
from a second button on the same report.

What a ban IS, is one line in `is_member()`. Every writing policy in the file
already stands behind that function, so there is one place to put it and no
list of doors to keep in step. Three things it deliberately does not do: it
does not delete anything, it does not sign anybody out, and it does not touch
`account_delete()` — being thrown out of a place is not a reason to lock the
door marked exit. `npm run rls` holds all three, and holds that a banned
account can still read.

**The person is told.** `NET_BANNED` comes off the same request that asks
whether this account is staff, and the composer says so at the top and again
if the button is pressed. Without it every write is refused by a policy, which
arrives as a number. The reason is not shown: the five words the report offered
are ours to sort by, not an explanation anybody was given.

### 8. Deleting an account, on the server — **done** (2026-08-21)

`netDropMe()` in `www/net.js`, from a button in Settings under signing out.
It asks the server which posts are mine, deletes their pictures and voice from
Storage **first** — bytes in a bucket have no foreign key and no cascade
reaches them — and then calls `account_delete()`, which was already in
`schema.sql` and reaches `auth.users`. Everything else goes behind it by
cascade: the profile, the languages, the posts, the follows, the blocks.

**Reports do not go.** `report.actor` was `not null ... on delete cascade`
until there was a deletion to fire it, which meant deleting your own account
withdrew every report you had ever made — somebody else's record, cleared by
your leaving. It is `on delete set null` now, and `npm run rls` holds it.

**~~The language on the phone is not touched.~~ That sentence is stale, and so
was the note that replaced it here on 2026-08-26.** 「アカウント消したら全部
消えるに決まってる」 asks for one act that takes everything — and **it already
exists.** `wipeAll()` (`www/settings.js`, the button 「データを消去」) does all
of it and has for some time:

```
  wipeAll()   confirm once, with iOS's own dialog
      ↓       netDropMe()  — the server: Storage bytes first, then account_delete()
  wipeHere()  every lingua.<id>.<slice> key removed (not overwritten)
              SET back to defaults, keeping theme, ui and plan
              netOut()     — the tokens
              bkDropAll()  — the backup files in Documents, last, after the
                             saves above, because a save writes a fresh one out
```

**The order is already the safe one, and it is the opposite of what this file
briefly recommended.** The server is told FIRST and the phone is emptied
**whatever it answers** — the reason is written on the function: 「somebody who
asked to be deleted must be deleted, and a phone that kept its languages
because the network was bad would be the button lying in the direction that
cannot be corrected later」. Doing the phone last on the theory that it is the
copy that survives a bad network gets it exactly backwards: it leaves an
account nobody can reach and nothing to reach it from.

So what 2026-08-26 changed here is **not the behaviour — it is which sentence
in this file is true.** § 8 said the phone copy stays and that erasing it is a
different button. The button is not different; it is the same one, and it says
so in its own confirm text 「すべて消去します。アカウントと、サーバー上の投稿・
写真・録音。この端末の言語・文字・設定。バックアップファイルも。」

Still true and worth keeping: **this is not a `DATA_SAFETY.md` exception.**
That rule forbids the APP deciding to remove somebody's work — it names four
reasons, and 「the person asked」 is not one of them.

**What is missing is the middle button: 「言語を削除」.** One language, not all
of them (OWNER DECISION 2026-08-26). There is no such path anywhere —
`act-map.js` binds `langOpen` and `langNew` and nothing else. See the decision
log for the five things to settle before writing it; the sharp one is that
deleting a language on the phone alone brings it **back** on the next
`netLangSync()`, because `syMerge` adds both sides.

### 9. Push notifications

Nothing exists. The notices tab is pulled when it is looked at.

### 10. DL — the official assets, and a language you can only read

**OWNER DECISION 2026-08-25, and nothing is built.** Zero lines. The decision is
in `docs/FEATURE_RULES.md` with the owner's words unabridged; this is only the
part that says what has to exist.

What it is, in the owner's framing: 「例えばトキポナ使いたい人がすぐに使えるように
するための公式アセットを準備するってイメージ」. Not a marketplace of other people's
languages — that is § 4, and it is a different decision from a different week.

Decided:

- it is **Plus**「DLはplusから」 — `CAN.dl`, which is **not in `CAN` yet**
- the thing you get **does not join your language. You switch to it.**
- it **cannot be edited**, and the reason is not tidiness:
  「トキポナに文字足したらトキポナじゃないです」
- **単語 / 文字 / 文法 / キーボード** are four separate unlocks and four separate
  downloads. Not one switch
- taken from **the language's overview page on Home**, where public/private
  already is 「dlは公開非公開があるから、ホームの言語の概要ページに作った」
- **anybody may use an official asset — inside Lingua only**
  「公式が提供してるアセットなんだからみんな使えるよ。でもlingua内ね？」
- **one account**, however many languages 「でもアカウントは一つだからね？」

Open, and not to be guessed:

- **how many** a plan holds. The owner's line ends in 「は？」
- whether you can **write a post** in a language you downloaded
- whether **一部だけ** DL した言語（例えば単語だけ）はその一部だけの言語として
  一覧に並ぶのか
- whether the official assets ship **inside the app** or come **from the server**.
  This decides whether any of this can start today
- 長押し vs. the Settings list — see the conflict in the decision log

What is missing to build it, checked against the code rather than remembered:

1. **`CAN.dl`.** Not there. It cannot be added alone: `dead-check` refuses a
   capability nothing asks for, and the only place that would ask is a screen
   this branch does not own. `docs/PAID_FEATURES.md` § Not built yet already
   says the general form of this — 「a function nothing calls is a function
   `dead-check` deletes」.
2. **A language that is read-only.** There is no such state.
   `docs/DATA_MODEL.md` § A language that is only read.
3. **The server may not hand a slice to anybody but its owner.** This is the
   real block and it is deliberate: `slice_read` in `supabase/schema.sql` is
   `l.owner = auth.uid()` **even for a published language**, and the comment
   above it says why — 「publishing is a copy somebody is given and not a door
   into the phone」. Official assets are not somebody's phone, so they may not
   need this loosened at all; **that is a question, not a gap to close.**
4. **A long press.** There is a worked one — `kbDown`/`kbLift` in
   `www/keyboard.js`, 380 ms, 「iPhoneのホーム画面と同じ挙動」. Copy it; do not
   invent a second answer to what a hold is.

What is **already there** and should not be rebuilt:

- **a language and its slices already travel to the server and back.**
  `netLangRow()` / `netSlices()` / `netSlicePut()` / `netLangSync()` in
  `www/net.js`, called from `boot.js:68`. Whatever `docs/STATE.md` § 3 item 3
  still says, this half is written.
- **`bkPack()`** already turns a whole language into one file
  (`www/backup.js`). An official asset is that shape.
- **the language list already has the empty half DL fills.** `vLangs()` in
  `www/home.js` draws 「自分の」 and 「読んでいる」, and the second one is
  **always** the empty note, because nothing anywhere writes `mine:false`.

**The making side is on this list now, and it was not.** This said 「A language
is made on this phone with or without an account, and that does not change」.
It changed, on 2026-08-26: 「基本は全部サーバー管理 言語周りだけバックアップに
file使う」「言語はアカウントないと作れないです」「古い記載消してくれうざい」.

What that means here, item by item, and most of it is **already built**:

- **the language lives on the server.** `netLangRow()` makes the `language`
  row and keeps its id on `LANGS[id].sid`; `netSlicePut()` upserts one slice
  (`Prefer: resolution=merge-duplicates`); `netSlices()` reads them back;
  `netLangSync()` puts the two copies together through `www/sync.js`, whose
  rule is that **neither side wins by being newer** — both are added, and the
  price of that is a duplicate rather than a deletion 「そりゃあ両方足すだろ」.
  `www/boot.js` fires it on launch.
- **the file is the BACKUP, not the truth.** 「言語周りだけバックアップにfile
  使う」 — `bkPack()` and `Documents/Languages/<name>.json` (`www/backup.js`)
  stay exactly as they are; what changed is which of the two is the copy.
- **making works offline.** 「制作はオフラインでも可能次つながった時に更新される」
  Already true, and it is what `sync.js` is for.
- **the sns half does not work offline.** 「そりゃそう」 Already true —
  `vFeed`/`vExplore`/`vNotif` show the app's own door with no session.
- **deleting the account takes it with them.** 「アカウント消したら残るわけが
  ないあほだろ」 Already true on the server: `account_delete()` cascades
  through the profile, the languages, the posts, the follows and the blocks
  (§ 8 above). The copy on the phone is deliberately not touched — § 8 says so
  and it has not been re-decided.
- **a language cannot be made without an account.** **NOT built**, and it is
  not a small change: the first language is minted at the top of
  `www/core.js`, which `www/index.html` loads at line 2749 — before `net.js`
  (2766) and long before `boot.js` (2802), so `netSignedIn` does not exist yet
  when it runs. Making this true means moving where the first language is
  made. Reported in `docs/FEATURE_RULES.md`, not patched.
- **how often it syncs — 「常に同期」 (2026-08-26), and it is TWO clocks, not
  one.** Refined the same day: 「タイムラインは開くたび / 言語はそういう
  わけじゃない」.

  **The timeline: every open — and already more than that.** `vFeed()` calls
  `snsPull()` every time it RUNS, and `render()` rebuilds the screen on any
  state change, so a like or a toast is another 50-post pull. Whether that
  wants narrowing to once per visit is a real question and it is about the
  bill, not about correctness (`docs/PAID_FEATURES.md`).

  **The language: NOT per-open — and that is all that has been said.** The
  owner named what it is not. What it IS is **open**, and writing a positive
  rule here would be turning a negation into a decision nobody made. Today
  `www/boot.js` syncs once on launch, which is not per-open either, so nothing
  in the code contradicts the decision as stated — it is simply not yet the
  whole of it. **Ask before building an interval.**

  What is not in question either way: a write on the phone must not be lost
  waiting for a clock. `bkTouch()` already marks a language as changed, for
  the backup, and the same mark is what a send would follow.

**Checked 2026-08-26 at the owner's request 「オンボーディング終わったら
せいさくみれるけどふさがれてるけど？確認して」. Found, and this section had it
wrong twice before it had it right.**

**There is one kind of account and no anonymous ones** 「匿名アカウントはねえよ」
「二種類になる意味も分からないけど」. An account is somebody who signed in.
**`makeNeed()` asking `netMember()` is right and must not be loosened** —
`netSignedIn()` would let a language be made off a token with nobody on it,
which is the reverse of 「言語はアカウントないと作れないです」. The anonymous
token itself is going: `claude/admin` has `netAnon()`, `netAnonTok()` and
`has_account()`.

**The cause is one button: `www/onboard.js:722.**

```
(obLastStep()? '<button class="obskip"' + DO('obFinish') + '>'+esc(t('ob.in.later'))+'</button>' : '')
```

The onboarding's steps are `OB_DRAW → OB_TOUR → OB_NAME → OB_IN`, and **`OB_IN`
IS the door** — the walk already ends at signing in. Both the roads that go
through it call `obFinish()` after the account exists (line 499, somebody who
was already signed in; line 777, somebody who just made one). This third one
skips it: 「あとで」 / 「Later」, in all ten languages, straight to
`obFinish()`. Press it and the walk is over with no account, and every making
action afterwards correctly asks for one — which is what being blocked is.

**And the comment directly above that button is the rotten sentence itself**
(lines 714–721): 「What they have made by then is on the phone and stays there:
a language is made on this phone, with or without an account.」 The button is
not a bug against that rule — **it is that rule, implemented.** 2026-08-26
overturned the rule, so the button goes with it. That is the fix, and it is a
deletion rather than a change.

**Done — the owner said 直して, 2026-08-26.** The button is gone, and with it
`obLastStep()` (its only caller), `act('obFinish', …)` (no screen names it now)
and `ob.in.later` in ten `www/i18n` files. `obFinish()` itself stays: lines 499
and 777 still call it, after an account exists. `makeNeed()` was **not** touched
— `netMember()` is the rule, not a gate to loosen. Green: `es5` `dead` `act`
`i18n`, and `press` at **10666 buttons / 222 names**, one fewer of each, which is
the button.

**Left open on purpose, because it is a decision and not a fix:** somebody with
no signal at that door cannot finish the onboarding at all — signing in needs
the server, and there is nothing else to end on now. A first launch on a phone
with no signal is a real state, not a hypothetical. What they have already drawn
in `OB_DRAW` is on the phone and nothing may take it from them. **Asked.**

**The exception, and it is the one place 「全部」 does not reach: a language
that was downloaded is not synced.** `syMerge` adds both sides, so the first
time anything is added to a downloaded トキポナ it stops being トキポナ —
「もちろんダメです。トキポナに文字足したらトキポナじゃないです」 (OWNER
DECISION 2026-08-25). A read-only language is outside sync by construction, not
by a flag somebody remembers to set. `docs/DATA_MODEL.md` § a language that is
only read.

## Closed on purpose

Not gaps. Both are in git if the argument turns out to be wrong.

| Feature | Status | Why |
|---|---|---|
| A page for the sound inventory | deprecated | the sound belongs to the letter; it is a sheet opened from the letter now |
| "Make" — generate eight candidate words | deprecated | its only door was a button that did not work; deleting the button would have left an unreachable screen |
| In-app keyboard for typing | deprecated | a keyboard belongs on the phone, not in one app. The editor that *builds* one stayed |

## When something changes here

A row changes only after the owner has decided. Adding a row is not a way of
deciding something — an **open** row stays open until there is a Decision entry
in `docs/FEATURE_RULES.md` to point at.

The order is in `docs/FEATURE_RULES.md` § the order:

```
  idea → owner decision → FEATURES.md → the docs that apply
       → implementation → tests → device → owner confirmation → merge
```

---

## write — letters brought in on a sheet

**WHAT IS IN THE CODE, as of 2026-08-25.** `www/sheet.js` is chapter 26 and
`tools/sheet-check.mjs` holds it (`npm run sheet`, thirteen claims, and seven
bugs were put back and watched going red before any of them was believed). The
file has a line across it, the same as `www/import.js`: above it is names in →
PDF bytes out and a page of samples in → names and shapes out, knowing nothing
about the app; below it are the three pages and the moment a drawing becomes a
letter.

Three pages, each `openForm()` and therefore a page you went to rather than a
sheet that slid up: **the room** (under the letters chapter), **make**, where
the names are typed and the PDF is built, and **read**, where a photograph or
a scan is handed back and what came off it is listed a row per box. There is
no picture of what was read on that page, deliberately — drawing an imported
shape is `www/glyph.js`'s, one place.

What it stores is two fields on a letter, and `docs/CHANGELOG.md` has the whole
of it:

    lt.sh    the picture as it came -- rings in the 800 square, y down, the
             outer ring and a hole wound opposite ways
    lt.via   'write'. ABSENT MEANS make, so no letter that exists today is
             touched and there is no migration

A letter has `sh` **or** `st` and never both. Taking a sheet in **adds**: a box
called `7` becomes a new letter called `7` and does not land on the digit
already in the alphabet — 「a,a,a は三枠」 — and the check holds that `a`, `7`
and `2` are all still there afterwards.

**Three things were NOT in. One of them is now; the other two are not, and
neither is a decision this session made:**

- **The plan gate.** The road is Pro (OWNER DECISION 2026-08-23) and the gate
  is one line — `write: 'pro'` in `CAN` — in `www/core.js`, which was not this
  session's to change and which `claude/save` was editing the same day. The
  door is therefore ungated in the code today. Deciding to gate it on some
  other capability instead would have been this session deciding the free/paid
  line, which is the owner's.
- **The drawing.** Nothing renders `sh` yet, so an imported letter shows
  **blank** — the data is there, the face is not. That is `www/glyph.js`, and
  it is the other half of the seam above.
- ~~The way out to the phone.~~ **Built 2026-08-27** (`claude/sheet3`).
  `LinguaShare.sheet` writes the PDF into `Documents/Sheets/`, never
  overwriting; `LinguaShare.renderPdf` draws a page back into a picture with
  **PDFKit**, because `CGContext.drawPDFPage` does not draw annotations and iOS
  Markup saves every stroke as one. Neither has been on a phone.

**Still not measured, and it is the same list the spike had:** a brush, and a
pencil. The sheet that came back was written with a pen that gives a solid
black edge. `tools/sheet-check.mjs` stands somebody's hand in with the app's
own glyph contours, which is honest about what it is not.

**OWNER DECISION 2026-08-23.** **Pro** only -- the top tier, which is the one
`claude/save` is renaming from Plus as this is written. The app hands out a PDF,
somebody draws on it, and hands it back; what they drew becomes letters.

**There are two ways a letter gets made, and they have names.**
「今の点線をなぞるのは make、書いて入れるのは write っていう違いがある」

    make    traced on the dotted lines, in the app. Every letter today.
    write   drawn somewhere else and brought in on a sheet.

**They can be shown apart, wherever letters are listed -- the keyboard editor
included.** 「一応、make と write を分けて表示させることができるようにしようぜ、
キーボード作る時でも」

That is a field on a letter, and it is the one thing here that changes what is
stored. It goes on at the moment the letter arrives and is never worked out
again afterwards (`docs/DATA_MODEL.md`): **absent means make**, so not one
letter that exists today is touched and there is no migration.

It also happens to be the mechanism the paragraph on a lapsed plan needs: a
Pro road's letters are already a group of their own, so hiding them is hiding a
group rather than picking through an alphabet.

Decided:

- **The app makes the sheet.** One box per letter, and the box IS the app's own
  800-unit square, so reading it back is mapping a box onto 0..800 and nothing
  more. Three filled marks at three corners of each box and none at the fourth:
  three points give the transform and the missing one gives the orientation.
- **Twenty boxes to a sheet, which makes the box 38mm on A4.** Names are typed
  in comma-separated. The number is not a taste: 38mm is the size that serves
  BOTH roads. Drawn on a screen the box size does not matter at all -- you zoom,
  and what arrives is a line, not a picture -- so the number is set by paper,
  where it was measured. A whole free alphabet is 38 letters and therefore two
  sheets, which is not 「何枚も」.
- **Both roads, and WHAT IS IN THE FILE decides how it comes in -- not which
  road it came by.** 「紙が本当にできるならこっちは両方対応にしたい」
  「電子も形で入れないの？」 That second question corrected the first answer
  written here, which had split it by road and was wrong.

  | what the file holds | comes in as | editable | the brush's thick and thin |
  |---|---|---|---|
  | filled closed shapes (a stroke expanded to outlines, out of Illustrator or Affinity) | a shape | no | **kept** |
  | open paths (an iPad's Ink annotation, a PDF still drawn in lines) | a centre line | yes | **not in the file to begin with** |
  | pixels (a scan, a photograph) | a shape | no | **kept** |

  The middle row is the one that is easy to get backwards. Thick and thin is
  not lost by importing an Ink annotation: **a standard Ink annotation does not
  carry it.** `/InkList` is points and `/BS /W` is one width; pressure is not in
  the format. So a screen is not the lossy road -- a CENTRE LINE is, whichever
  road it arrived by, and a calligrapher who works digitally and expands their
  strokes hands over a shape as faithful as paper.

  Nobody is asked to choose. The file is read and it says which it is, the same
  way `www/import.js` reads a paste and says whether it is a spreadsheet or a
  Toolbox lexicon. `write` is `write` whichever road it came by, and whether a
  letter holds a shape or a centre line is visible in the letter itself, so it
  needs no field of its own.

  Paper was measured, geometry only, against a letter the app made as the truth:
  printed, photographed badly, marks found, un-warped, thresholded, traced.

  | | box | tilt | furthest off |
  |---|---|---|---|
  | scanner | 38mm | 1.2° | 4 |
  | held in a hand | 38mm | 6° | 4 |
  | carelessly | 38mm | 12° | 6 |
  | very skewed | 38mm | 20° | 8 |
  | carelessly | 23mm | 12° | 8 |
  | carelessly | 54mm | 12° | 4 |

  Units of an 800 em, against a pen 24 wide -- a third of the pen at the worst,
  with a lighting gradient over it, and the three marks found every time. What
  that measurement does NOT cover, said plainly so nobody reads it as more than
  it is: **real ink**. It blurred clean vector ink; a brush bleeds into paper
  and goes dry, and its edge is not a step. The owner is testing that with a
  real sheet before release.
- **PRINTING IS NOT REQUIRED, and the screen is the road that has to work.**
  「印刷はむりにしない？そのままdlした端末上で書くとか？じゃないと無理じゃね」
  OWNER 2026-08-27. This does not overturn 「両方対応にしたい」 above — it says
  which of the two a person must be able to do with nothing but the phone in
  their hand. Print → write → scan needs a printer; write on the file in Files
  needs nothing. The four steps in the app's `?` said 「印刷して書く」 and
  「スキャンして取り込む」 and now say 「書く」 and 「取り込む」, in ten
  languages, and `wr.in` offers a PDF rather than a scanned one.

  **Where a person writes is Files, and that was settled twice.** For half a
  day the app opened Apple's Markup itself, so the road never left Lingua.
  「あとはシートの書き出しだけど、ここで書く無くして。毎回ファイルに保存して
  欲しい。」 OWNER 2026-08-27 (evening, on a real phone) took it back the same
  day: the sheet is written out as a FILE, every time, and what a person does
  with that file is theirs. The app has one way out to the phone and no editor
  of its own.

  **What makes that road work is `renderPdf`**, and specifically that it draws
  with PDFKit: Markup keeps a stroke as a PDF ANNOTATION, and
  `CGContext.drawPDFPage` does not draw annotations — a sheet written on with
  a finger came back as the blank sheet it was printed as, with every step
  before and after it perfectly correct.

- **A screen's ink comes in as a SHAPE today, not as the centre line decided
  above**, and this is a gap rather than a change of mind. `renderPdf` draws
  the page to a picture, so an Ink annotation arrives as pixels: `lt.sh`, not
  editable, thick-and-thin kept from however the annotation was drawn. Reading
  `/InkList` off the annotations instead would need no phone at all — and it
  needs an INFLATE, because a PDF saved by Markup carries its objects in
  compressed object streams, and `www/sheet.js` is ES5 with no dependencies
  and no way to unpack one. `docs/BACKLOG.md` has it.

- **What is on the sheet is chosen in the app.** Type what you want boxes for
  and the PDF is for those. It needs to know nothing about writing systems:
  a logography's signs are letters too in this app (`wsys.js`: *a letter reads a
  whole word → logography*), so a box for 愛 and a box for `a` are the same
  kind of thing.
- **Where it lives:** a page under the letters page.
- **OWNER DECISION 2026-08-25: nothing is redrawn. The picture comes in as the
  picture.** 「画像データをそのまま取り込みたいのよ」
  「取り込んだやつを上から描き直してるからそうなるんでしょ？」

  This SUPERSEDES the line that stood here, which said the ink goes into the
  road a finger already takes -- `GE.raw` then `geShape()`, so the app's own
  thinning, lattice and ROUND work on it. That line contradicted the table
  above it (pixels come in as a **shape**) and the owner has settled which of
  the two holds: the shape. Anything that runs somebody's letter through the
  app's own pen is redrawing it.

  Three places were redrawing and all three are gone:

  | | was | is |
  |---|---|---|
  | how finely a box is sampled | a constant 200, or 400 | **the photograph's own** -- how many pixels the box actually came out |
  | where the edge runs | pixel corners of a yes/no mask | **where the grey crosses half way** between this paper and this ink, between two samples |
  | thinning the outline | 6 of 800 | **1 of 800** |

  Measured on the real sheet, box `7`: at a thinning of 6 the furthest a point
  moved was **5.81 of 800** -- four tenths of the width of the stroke it was
  moving. At 1 it is **0.00**, because the only points dropped are ones sitting
  exactly on the line between their neighbours. And following the grey rather
  than the pixel corners took the same letter from 440 points of staircase to
  **122 points of the letter** -- more faithful AND smaller, because a
  staircase is the sampling and not the hand.

  Against the widths actually drawn, measured the same way on both sides:
  **-1.1% to -3.2%** across the ten boxes.
- **What the font writer needs, read off `otf5.js` rather than guessed at.**
  `glyphContours` returns contours that are **convex and all wound the same**,
  and its comment says why: `spanAt` below it takes the ink at a height as the
  min and max over contours, which is only true when a contour meets a
  horizontal line in exactly one interval. That is what lets this font writer
  build a profile without rasterising anything. So an imported outline -- one
  big concave ring, often with a hole in it -- cannot be handed over as it is.

  **The road already exists.** A filled stroke is the one thing here that is
  not a swept nib: `st.fill` runs `earCut(fillRing(line))` and adds the
  triangles. A triangle is convex, `wound()` makes them all agree, and a hole
  survives because no triangle is laid over it -- which is the sentence
  CLAUDE.md already carries. What is missing is one thing: **ear clipping over
  a ring that HAS holes.** `fillRing` takes a single ring.

  (An earlier note here said `wound()` fills every hole. That was wrong in a
  way worth keeping: `wound()` is harmless once only ink-covered triangles are
  emitted. The winding on the rings is how the holes are KNOWN, not what
  breaks them.)

  The edge follower emits an outer ring and a hole wound opposite ways, which
  is the half this side owes. Nothing about it throws: the canvas fills
  even-odd and drew the holes correctly for as long as five of the sixteen
  cases were reversed, and it was found by adding the signed areas of one
  letter's rings and getting the outer PLUS the hole.
- **NOT DECIDED, and it is the owner's: how heavy an imported letter is.**
  The geometry arrives as drawn. A shape asked for at a known size in the 800
  square, printed, photographed at 10 degrees with a trapezoid, a blur, a
  lighting gradient and noise over it, comes back within **2 units of 800** on
  every edge, and a bar asked for at a width of 24 comes back at 24. So position
  and size need no decision -- they are already what was drawn.
  The WEIGHT is a decision, because it is the person's pen and not the app's.
  Measured on the first real sheet: the strokes are about **18 of 800**, against
  `GPEN.width` of 24. On a 37mm box that is a pen of 0.83mm where the app's own
  is 1.11mm, so an imported letter sits about a **quarter** lighter than one
  drawn in the app, and the two are side by side in one alphabet.

  (An earlier number here said 14.9, 0.69mm and four tenths. It was measured
  with a staircase perimeter, which is about a fifth longer than the boundary
  it is standing in for, so every width came out a fifth small. Both sides are
  measured the same way now.)

  The owner has ruled out changing it: nothing is redrawn, so the pen is the
  person's. What remains open is only whether the SHEET says anything about
  what to write with, since the box is a fixed 37mm and a pen of about 1mm
  matches the app exactly -- which is words on a sheet, and therefore
  「アプリ内に説明書くの禁止」's neighbour.
- **A lapsed plan HIDES, it never deletes.** 「単語と同じで隠すつもりよ？また課金
  したら復活！」 Exactly `wordsSeen()`: the letters stay in the slice, in the
  backup, and in everything the app reads for itself; they stop being shown and
  stop being on the keyboard, and they are all back the day the plan is. This
  is `docs/PAID_FEATURES.md`'s rule, not an exception to it -- fewer buttons,
  never fewer words.

**What a box is called is just text, and it binds to nothing until the drawing
comes back.** 「アプリ内で打ち込みたい 20 字を決めます。カンマまでで区切ります。
7,2,25, みたいに。で、文字を取り入れるときにそれが勝手に 7 がこの文字ねってなる」

Twenty names, comma separated, typed in the app. Nothing is created and nothing
is looked up when the sheet is made -- a name is a label on a box. When the
drawing comes back, box `7`'s drawing becomes the letter `7`. That is a third
answer to a question written here as a choice between two, and it is better
than either: letters still only ever come into being in one place, and a sheet
printed and never drawn on leaves nothing behind.

**Duplicates are allowed** -- `a,a,a` is three boxes -- because this is Pro, and
Pro is where a letter may be added at all.

**THE SHEET NAMES ITSELF.** 「用紙に番号つけてもそのへんから拾った人はどう
なんの？」 A number is a pointer into the app's memory, and paper cannot follow
a pointer: a sheet picked up by somebody else, or imported after a new phone,
points at nothing. So the twenty names are ON the sheet, and a returned sheet
needs no memory anywhere to be read.

That is also what the tool that already does this for a living does, which is
where the rest of these came from. Calligraphr prints a QR code and four corner
markers, and asks for both to be in the photograph; it prints the character
faintly inside each box as a guide, light enough that the reader does not pick
it up; it hands out a PDF to print and a PNG for people who draw on a tablet;
and it asks for 300-600dpi greyscale, never binary, because a monochrome
scanner dithers. 「それ鬼パクリで実装しよう」

Copied outright:

- **Four corner marks, not three.** Three give an affine transform, which is a
  parallelogram; four give a real perspective one, and a photograph taken by a
  hand is always a trapezoid. It was measured at three and 20 degrees of tilt
  still landed inside a third of the pen -- four is simply better for nothing.
- **The name printed faintly inside its own box.** A person can see what each
  box is for, and the threshold does not pick it up. It half-answers 習字's
  problem too: something to trace without laying translucent paper over it.
- **A PNG as well as the PDF**, for drawing on a tablet.
- **300-600dpi, greyscale, never binary**, and a clean-up pass for photographs
  taken in bad light.

Deliberately NOT copied: their sheet, its look, or its file. Same kind of thing,
our own drawing.

Different on one point, and for a reason:

- **Our own grid of cells rather than a QR code.** What is expensive about a QR
  is that it finds itself in the picture -- and here the four corner marks have
  already given the transform, so that half is not needed. A fixed block of
  black and white cells at a known place on the page is about forty lines to
  write and forty to read, against three hundred plus a decoder. A checksum
  rides with it, and a sheet that does not check out is **refused rather than
  half-read**.

Open, and not to be guessed at:

- The price, and nothing else on this list.
- Whether the letters that come in are the same 28 slots (when what was drawn
  IS a-z) or a series of their own.
- The price, and which plan.

Not yet known, and it decides how much of this is buildable:

- **What an iPad-marked-up PDF actually contains.** If Markup writes Ink
  annotations, `/InkList` is a list of points and the import is exact with no
  image processing at all -- a round trip has been driven end to end on a PDF
  written to that shape, sheet out, ink in, letters drawn through the real
  `glyphContours`. If iOS instead flattens the drawing to an image, the whole
  reading half becomes threshold-and-trace and is a different feature. A real
  file from a real iPad is the only thing that answers it.
- Printing and scanning is the other road and is not this one: a photograph of
  a sheet is a photograph, and finding the boxes in it is most of the work. The
  corner marks are there for that day.

