# Adding something

The order is: write the spec, get the answer to anything that is the owner's,
then write the code. Not the other way round.

## The eleven questions

Before any code, answer these in `docs/CHANGELOG.md` under the change (or in a
file of its own if it is large). A "none" is an answer; a blank is not.

```
 1  what it is for
 2  what a person can do that they could not before
 3  free or paid, and which capability name
 4  what existing behaviour changes
 5  what existing DATA is affected
 6  what is newly stored, and where            (slice? SET? on the thing?)
 7  what is deleted                            (if anything: DELETE REVIEW)
 8  how it behaves with data made before it existed
 9  what it does offline
10  what it does when it fails
11  what it does when the plan changes, in both directions
```

Question 8 is the one that gets skipped and is the one the card bug was.

## Past data

If the thing being added displays, exports or scores something a person made
earlier, decide **before writing the line** which of the three it is
(`docs/DATA_MODEL.md` § the three kinds):

```
  read from the current state   correct for a word, a letter, an alphabet
  frozen at write time          put it ON the thing, at the moment it is made
  held from an earlier state    neither — be suspicious
```

Two rules follow, and both are absolute:

**Do not re-generate the past from the present.** If a post, a record, a
history or an export means something because of the state at the time it was
made, that state goes ON it when it is made. Not an id pointing at the current
object — the value.

**An id is not the data.** `post.letterId` → look up `LETTERS` → get the shape
is banned for anything past-tense, because `LETTERS` is now and the post is
then. `post.ink` is the shape itself, which is why it survives the letter being
redrawn, deleted or never having existed on this phone at all.

Today the app has exactly one past-tense kind — posts — and exactly two files
render one, `www/post.js` and `www/card.js`. The day it grows a ranking, a
season record, a history or an achievement, this section is the first thing to
read.

## One place

A rule lives in one place, and the places that follow it do not restate it.
Three bugs found in one afternoon were the same bug: something was added and
the one place that governs it was not.

**A comment saying "this is the one place" is worth nothing on its own.**
Whoever reads it will fix that one and go home. Either a check holds the claim,
or do not make the claim. `ltFace` opened with "a letter's face, wherever one
is shown" and there were five others; `inkStrokes` said it was "the one place
that turns strokes into a shape" and the glyph editor did not go through it.

Not everything that repeats is duplication. `cffNum` and `csNum` in `otf5.js`
encode the same integers to different byte forms because that is what CFF
specifies. Merging them would be inventing a rule, not finding one.

## Refactoring

Not a goal. Do it only when one of these is true:

- the duplication is causing bugs, or has already caused one
- a spec change would mean editing several places, and they will drift
- the thing cannot be tested as it stands
- responsibilities are genuinely tangled
- it blocks a feature that is actually being built

**If pulling something out means a new dependency between two files that did
not need each other, leave it.** Taste is not a reason.

**A behaviour change and a refactor do not share a commit.** Neither does a
rename: renaming an acted function touches `act-map.js` twice — the string and
the function — which are the same files a feature change touches, and the diff
stops being readable. Renames go in a commit of their own with `npm test` on
both sides. `docs/BACKLOG.md` holds the ones known and deliberately not done.

## The order

An idea does not become code by being reasonable. It becomes code by being
decided, written down, and then built.

```
  idea
    ↓
  OWNER DECISION            the owner says what it is
    ↓
  docs/FEATURES.md          the row, and its status
    ↓
  docs/PAID_FEATURES.md     if money is involved
  docs/DATA_MODEL.md        if it stores anything new
  docs/DATA_SAFETY.md       if it saves, deletes or migrates
  docs/CHANGELOG.md         if existing data or behaviour moves
    ↓
  implementation
    ↓
  tests, including a regression watched failing
    ↓
  device verification       if docs/TESTING.md § device says so
    ↓
  owner confirmation
    ↓
  merge
```

**Writing the code first and the spec afterwards is not allowed.** Reading the
code first is fine and often necessary — but "this is what the code does" and
"this is what it should do" are different sentences and must never be written
as one.

### Five states, and they are not the same

```
  BACKLOG          might happen                      docs/BACKLOG.md
  OWNER DECISION   has been decided                  the log below
  SPEC             this is how it behaves            FEATURES.md + the docs
  IMPLEMENTED      it is in the code                 git
  VERIFIED         checks green, and a phone         CHANGELOG.md, marked
```

**Something in BACKLOG is not decided.** Do not read a backlog entry as
permission. Do not read the absence of an entry as permission either.

## Owner decisions are specifications

When the owner decides anything about behaviour, a threshold, a limit, the
free/paid boundary, retention, deletion, migration, how past data behaves,
timing, what gets selected, or what a screen does — **that is a specification,
not an instruction for the task in hand.**

Afterwards:

1. record it in the log below, and in whichever `docs/` file it governs
2. implement exactly that, and nothing adjacent
3. do not reinterpret it into a more reasonable rule
4. do not quietly generalise it to a nearby behaviour
5. if existing code contradicts it, **report the contradiction** — do not go
   and change unrelated code to match
6. a later session reads the decision before changing anything in that area

**If a decision conflicts with a rule already written down: STOP.** Report the
existing rule, the new decision, the code affected, the data affected, and what
a migration would have to do. Do not resolve it yourself. Neither side of a
conflict is automatically right, and picking one quietly is how a spec gets
lost.

And the other direction, which is the same rule: **a decision once made is not
re-opened by a later session because a different shape seems more natural.** If
it seems wrong, say so and stop; do not implement the better idea.

## Owner decision log

Newest first. One entry per decision. The **decision itself** matters more than
the reasoning — a reason can be re-derived, a decision cannot.

```
### Decision
- Date:
- Area:
- Decision:
- Reason:
- Affected features:
- Affected data:
- Affected docs:
- Implementation status:
```

Entries below are transcribed from decisions the repository already records
verbatim, in `CLAUDE.md` and in the code comments that quote them. Nothing here
was inferred: where the wording is the owner's it is quoted, and where a
decision has never been made the row in `docs/FEATURES.md` says **open**
instead of appearing here.

### Decision
- Date: 2026-08-23
- Area: 月と曜日のスロットは、番号ではなく世界の名前で呼ぶ
- Decision: 月の枠は「1月」「January」、曜日の枠は「日曜」「Sunday」。
  曜日は**日曜から**並べる。「1ってなに？1月 januaryとかでしょ」
  「曜日もサンデーからちゃんと示してよ」
- Reason: `www/cal.js` は既に「構造は世界のもの」と決めている ──
  年は十二ヶ月、週は七日、日曜始まり。「言語内で週の概念作ろうが、
  ウィジェットに表示するなら世界の概念でやるだろ」。構造が世界のものなら、
  三番目の月は March であって「3」ではない。
- Affected features: 文法の「月」と「曜日」の段（`phases.js` の `calMonthSlots`
  / `calWeekSlots`）
- Affected data: 何も増えない。スロットの**ラベル**だけで、作られる単語も
  その並びも変わらない
- Affected docs: `www/cal.js` の `calSlots()` のコメント、`docs/CHANGELOG.md`
- Implementation status: **未着手**。`www/cal.js` は `claude/yoo-kwdg28` の
  持ち物

**この決定は、`cal.js` に書かれている理由と食い違う。** `calSlots()` の上に
こうある ── 「A month called "3" ... is the only honest label: the app does
not know what anybody's third month is for, and putting "March" there would
be this app deciding whose calendar it is」。それは**週や月の長さを言語が
決められた頃**の理由で、同じファイルの頭がその設計を取り消している
(「THE STRUCTURE IS THE WORLD'S」)。取り消され忘れたコメント。

**十二ヶ月＋七曜 = 19 個の文言 × 十言語 = 190。** `Intl` で機械的に出す道も
あるが、i18n-check の鏡は「t() を通っていない平文」で落ちるので、キーで
持つことになる。

### Decision
- Date: 2026-08-23
- Area: その日の一文 ── どこから来て、何語で出て、消せるか
- Decision:

  1. **一日一文、サーバーが持つ。** `prompt` テーブル（schema.sql に設計だけ
     あって使われていなかったもの）を使う。
  2. **書くのは Gemini。** 一日一回、一回の呼び出し。「全員同じのを1日1回
     おくだけならgeminiの無料で行けない？プロンプトガチガチにして」
  3. **日付はアメリカ時間の 0 時から。**「日付はアメリカ時間の0時から」
     太平洋時間で実装（Apple が App Store で使う時間帯）。夏時間も追う。
  4. **十言語で出す。** 見る人の UI 言語で。`text`(英語)は消さず、`says`
     という列を**足す**。「B. 十言語」
  5. **お題から開いた投稿は、意味を消せない。**「消せないようにしようそこ
     からのやつは。じゃないと意味ないもん」
  6. **繋がりはハッシュタグではなく列。** `post.prompt`。文字列は編集で
     切れるが、列は切れない。

- Reason: 全員が同じ文の意味を知っているから、読めない二百の文字の並びが
  読める二百の文になる。これが崩れる形（意味を消せる、言語ごとに別のタグ、
  端末ごとに違う文）はどれも機能そのものを無くす。
- Affected features: タイムラインの一番上の行、投稿の画面
- Affected data: `prompt.says`(新)、`post.prompt`(既存・未使用だった)、
  投稿と下書きの `pr`。端末に増えるものは無い
- Affected docs: `supabase/setup.md` § 9、`docs/CHANGELOG.md`、
  `supabase/schema.sql` § asked
- Implementation status: IMPLEMENTED（コード）。**サーバー側は未** ──
  ダッシュボードで鍵と関数と cron を入れるまで、お題は出ない（出ないときは
  これまで通りの書く行に戻るだけ）

**この決定は、`schema.sql` に書かれていた設計と一箇所ちがう。** `text` の行に
「English, and translated on the device」とあり、それは「全員が英語の一文を見て
訳すのが遊びそのもの」という設計だった。オーナーは 2026-08-23 に別の判断をした
── 日本語話者が英語のお題を読むのは翻訳を二回することで、二回目だけが遊びだから。
`text` は残してあるので、書かれていたものは失われていない。

### Decision
- Date: 2026-08-23
- Area: How many languages, how many keyboards, and two more capabilities
- Decision:

  | | languages | keyboards, in total |
  |---|---|---|
  | Free | 1 | 1 — the fixed QWERTY, which is not built and cannot be |
  | **Basic** | **1** | **1 + 3 = 4** |
  | **Plus** | **3** | **no ceiling** |

  Keyboards are counted **across languages, not within one**. Today `KB_MAX`
  is three boards *per language*; from now the number is a pool. A language
  may hold all four of Basic's, or one each across Plus's three, or any other
  split.

  And two capabilities that exist in the app and were never in `CAN`:

  - **`edit` — editing a post you have already sent. Basic and up.**
    「ツイートの編集も課金から」「課金からはベーシックからってことね
    プラスならプラスっていうから」 `postEdit()` today asks nothing about a
    plan: anybody may edit their own post.
  - **`badge` — the mark beside your name. Plus only.** 「バッチはplusから」
    `planBadge()` already shows it only on Plus, but it reads `plan()`
    directly instead of going through `can()`, which is the one thing `CAN`
    exists to stop.

  So `CAN` is **eleven** when this lands, and twelve when the ad arrives:
  `words` `kb` `letters` `wsys` `snd` `edit` (basic) · `gram` `dir` `data`
  `file` `badge` (plus) · `noads` (with the ad).
- Reason: the numbers were arrived at by asking what a keyboard actually IS
  in this app rather than by picking a number. **A keyboard is layers** — ABC
  and あいう are two faces of ONE board, and 「qwertyでも数字で切り替えたり
  するやん？」 is why. So more boards is not how somebody gets more keys; it
  is only how they get a different ARRANGEMENT, and there are five of those
  (`qwerty` `flick` `tap` `chart` `abc`). Most people will build one. Four is
  past what nearly anybody reaches, which is the point: **the ceiling that
  sells is the one that binds** — a hundred words binds on the first evening,
  a–z with nothing addable binds the moment somebody wants a letter. A
  keyboard count binds almost never, so Basic's four is generous on purpose
  and Plus's absence of one costs nothing to give.

  A language is the same argument one step out: this app is for making ONE
  language deeply — the dictionary, the letters, the writing system, the
  keyboard, the calendar all stack onto one. Three is there for the person who
  wants a second and a third, not as the thing being sold.
- Affected features: `KB_MAX` (a per-language ceiling today, a pool from now,
  and gone entirely on Plus), a new language ceiling that does not exist at
  all today, `postEdit()`, `planBadge()`.
- Affected data: none. Somebody over a ceiling keeps everything — every
  keyboard, every language — and simply cannot add another. `backup-check`
  holds this for keyboards already.
- Affected docs: `docs/PAID_FEATURES.md`, `docs/FEATURES.md`.
- Implementation status: nothing built.

  **Not a loophole, decided:** the language count is what is on THIS PHONE —
  `lingua.langs` carries no owner, `netOut()` clears only the session, and
  `netLangSync()` syncs the open language rather than fetching a list. So
  signing in as somebody else neither adds a language nor resets the count,
  and the only way to clear it is to delete everything, which is not a way
  round a ceiling. Sharing an account to get more is a terms matter, not a
  thing the code should chase. 「普通に共有は規約違反でしょ」

### Decision
- Date: 2026-08-23
- Area: What the tiers are called
- Decision: **Free / Plus / Pro.** They were Free / Basic / Plus.
  「ベーシック、プラスって名前どう思う？なんかどっちが上かわかりにくくない？」
  「フリープラスプロがいいかなー」

  | was | is | price |
  |---|---|---|
  | Free | Free | — |
  | **Basic** | **Plus** | $4.99 / $49.99 |
  | **Plus** | **Pro** | $9.99 / $99.99 |

  Nothing about what each buys changed. Only the words did, and the stored
  value with them: `SET.plan` and the Keychain hold `free` / `plus` / `pro`,
  and the product ids are `com.tokinets.lingua.plus.*` and `...pro.*`.
- Reason: `Basic` is what most apps call their FREE tier, so the confusable
  pair was Free and Basic rather than Basic and Plus — and the order was
  inferrable rather than obvious. `Free < Plus < Pro` needs nobody told which
  is which, and all three words survive untranslated in the ten languages,
  which plan names have to (they do not go through `t()`).
- Affected features: `PLAN_ORDER`, `CAN`, `wordCap()`, `PLANS`, `planBadge()`,
  the plans screen, `LinguaStore.swift`'s product map, every `SET.plan` in
  `tools/`, and the nine `plan.plus.*` keys in ten language files, which are
  `plan.pro.*` now.
- Affected data: **one value, moved once.** A phone already holding
  `plan: 'plus'` wrote it while Plus was the TOP tier; read in the new world
  it would be the middle one. `planMigrate()` in `www/core.js` moves it up
  and writes `SET.planV = 2` so it can never run twice — after this `plus` is
  a real middle tier and must be left alone. `SET.planWas` carries a plan name
  too and moves with it, or the next `capLapse()` would announce a step
  nobody took. On a phone the Keychain is written again, or the next launch
  would hand back the old word.

  **Nobody had bought anything** — no product existed in App Store Connect on
  the day — so the only value this can find is one somebody set by hand, and
  moving it up gives them back what they had rather than more.
- Affected docs: `docs/PAID_FEATURES.md`, `docs/apple.md`, `docs/STATE.md`,
  `docs/BACKLOG.md`. **The decision entries above are left as they were
  written**: they are a record of what was said on the day, and rewriting them
  would be rewriting what the owner said. This entry is the mapping.
- Implementation status: **done**, 2026-08-23, `claude/save`. Held by
  `plan-check` (45 claims, the rungs read off `CAN`) and `migrate-check`.

### Decision
- Date: 2026-08-23
- Area: How many keyboards, said again because the file said it twice
- Decision: **Free 1 — the fixed QWERTY. Basic 1 + 3 = 4. Plus no ceiling.**
  Counted as a **pool across languages**, not per language.
  「1,1+3.無制限って言わなかったっけ？」
- Reason: this file carried two answers written the same day — the § above
  said 4 in a pool and Plus with no ceiling, and the `CAN` table below it said
  Basic 1 and Plus 3. A session that was about to move `can('kb')` down to
  Basic stopped on it instead, because a door opened without its number would
  have given Basic the three `KB_MAX` hands out today, which is neither
  answer. The owner named the first one. The table below now says the same
  thing, so there is one answer in this file again.
- Affected features: `KB_MAX` in `www/keyboard.js` — a per-language constant
  today, a per-plan number counted across languages from now — and
  `CAN.kb`, which moves from `plus` to `basic`.
- Affected data: none. Somebody over the ceiling keeps every keyboard and
  simply cannot add another. `backup-check` holds that already.
- Affected docs: `docs/PAID_FEATURES.md`, `docs/BACKLOG.md`.
- Implementation status: **nothing built, and deliberately not by this
  session.** `www/keyboard.js` belongs to `claude/detailed-tasks-execution`
  today, and that branch is in the middle of a 126-line change about holding
  more than one keyboard — `kbAddKb()`, the tab that switches which board is
  on the phone, the button that deletes one. The number belongs in the same
  hands as that. What is waiting: `kbCap()` beside `wordCap()` in
  `www/core.js` (1 / 4 / Infinity), `kbBoards().length >= KB_MAX` asking it
  instead, the count becoming a sum across `LANGS` rather than a length, and
  `CAN.kb` moving to `basic` in the same commit — the door and its number are
  one statement and must not land apart.

### Decision
- Date: 2026-08-23
- Area: A third plan, and what pays for the free one
- Decision: **Three plans, and the prices are settled.**

  | | month | year |
  |---|---|---|
  | Free | — | — |
  | **Basic** | **$4.99** | **$49.99** |
  | Plus | $9.99 | $99.99 |

  **Basic buys: adding letters, ONE keyboard of your own, a thousand words,
  a writing system that is not an alphabet, and choosing what a letter
  sounds like.** 「文字+キーボード自由（1個）単語1000までとか」
  「音と音節文字とか選べるだけかな その他は＋から」

  So the whole of `CAN`, settled:

  | | Free | Basic | Plus |
  |---|---|---|---|
  | `letters` add / name / delete | — | **yes** | yes |
  | `kb` a keyboard of your own | 1 (the fixed QWERTY) | **1 + 3 = 4** | **no ceiling** |
  | `words` | 100 | **1000** | no ceiling |
  | `wsys` syllabary, abjad, abugida, logography | — | **yes** | yes |
  | `snd` choose the sound, not the letter's own | — | **yes** | yes |
  | `gram` a grammar stage of your own | — | — | yes |
  | `dir` which way it is written | — | — | yes |
  | `data` CSV out, and the cloud | — | — | yes |
  | `file` a list brought in as a file | — | — | yes |
  | `noads` | — | — | **yes** |

  **`noads` is in that table and is NOT in `CAN` yet, deliberately.**
  `dead-check` refuses a capability nothing asks for — a line in a price list
  nothing charges — and nothing can ask `can('noads')` until there is an ad to
  not show. So the plan tiers land with **nine**, and `noads` goes in in the
  same commit as the ad. The table says what will be true; it is not a list of
  what to type today. (Found by the session that was about to type it.)

  **`words` and `kb` are the two that stop being yes/no.** Everything else in
  that table is a door; those two are a number, and the number is the plan's.
  `can()` cannot answer them alone any more.

  **Ads are on Free AND Basic. Plus is what has none.**
  「ベーシックも広告表示させるよ？＋から広告非表示で考えてた」

  **No banner. The ad sits IN the timeline, wearing a post.**
  「バナーはつけない。ツイート擬態」

- Reason: the ladder reads in one line — Free is your own shapes for a–z,
  Basic is your own letters and your own keyboard, Plus is everything and no
  ads. "Remove the ads" is a reason to buy that everybody understands without
  being told what a syllabary is.
- Affected features: `CAN` (a third level, and a new `noads`), `FREE_LIMIT`
  and `KB_MAX` (constants today, per-plan from now), `capLapse()` (one road
  today — "back to free" — two from now), the plans screen, StoreKit.
- Affected data: none. Nothing about a plan may change what is stored:
  somebody at 1500 words dropping to Basic keeps all 1500 and simply cannot
  add — 「判定が失敗しても減るのはボタンであって言葉ではない」. Same for a
  third keyboard.
- Affected docs: `docs/PAID_FEATURES.md`, `docs/FEATURES.md`, `docs/apple.md`.
- Implementation status: **the rung is in; the card and the numbers are not.**
  2026-08-23, `claude/save`.

  In: `PLAN_ORDER` and a laddered `has()` in `www/core.js` — a level is met by
  the plan that names it and by every plan above it — and `CAN` sits on the
  three rungs the table says, except `kb` (see below). `wordCap()` is the word
  ceiling as a number rather than a constant: 100 / 1000 / none. Held by
  `tools/plan-check.mjs`, with the ladder broken into an equals sign and the
  ceiling flattened to one number, both watched failing.

  Not in, and each for a reason that is not "no time":
  - **Basic is not on sale.** Its price is in no language file and no
    subscription for it exists in App Store Connect. `PLANS` still sells Free
    and Plus, which is what can actually be bought.
  - **`kb` has not moved down to Basic.** How many is a number, and the two
    decisions of this day disagree about it — 4 in a pool against 1, and no
    ceiling against 3. `docs/BACKLOG.md` has both sides. Opening the door
    without the number would give Basic the three `KB_MAX` hands out today,
    which is neither answer.
  - **`edit` and `badge` are not in `CAN`.** `postEdit()` and `planBadge()`
    are both in `www/post.js`, which belongs to another session today, and
    `dead-check` refuses a capability nothing asks for.
  - The language ceiling does not exist at all yet.

  Plus's prices are in `www/i18n/*.js` already; Basic's are nowhere. The
  leader's proposed order is **Basic first, ads second** — Basic needs no
  native code at all, and until the ladder exists there is nowhere for
  somebody who wants the ads gone to go.

### Decision
- Date: 2026-08-23
- Area: How the ad is built, and the one thing that turned out not to be true
- Decision: The ad is **AdMob Native Advanced**, read by Swift, with the
  MATERIALS handed to the web side, and **Lingua draws the row itself** in the
  shape a post has. Not a banner, not an SDK-drawn card.
- Reason: measured against `natsuaya82-crypto/jjjj`, which already ships ads,
  rather than guessed.

  What carries over: the AdMob account and its ad unit ids, the ATT call, the
  initialisation, and one shape worth copying outright — `adsDisabled` is
  checked **immediately before display**, not only at the call sites, because
  a save loading asynchronously can otherwise let an ad appear for somebody
  who has already paid.

  What does NOT carry over: **jjjj is Vite + React and Lingua has no
  bundler.** jjjj says `await import('@capacitor-community/admob')`; Lingua
  cannot. That is smaller than it looks — `Capacitor.nativePromise('X',
  'method', …)` reaches a registered native plugin without the JS wrapper,
  which `LinguaShare` and `LinguaPlan` both learned the hard way.

  **But `@capacitor-community/admob` 8.1.0 has no native ads at all.** Its
  dist carries banner, interstitial, reward, reward-interstitial and app-open
  and nothing else — checked by fetching the package, not from memory. So the
  Native Advanced reader is ours to write: `GADAdLoader` in Swift, materials
  out through `nativePromise`.

  The mimicry has a ceiling that is not ours: AdMob requires the word
  "Ad"/"Sponsored" and forbids rearranging the materials. Same skeleton, same
  spacing, same face as a post, with one word saying what it is — about what
  X's Promoted looks like.
- Affected features: a new `LinguaAds` on the native side; the feed inserting
  a row every N posts; `press` (an ad row must carry no button of ours).
- Affected data: none.
- Affected docs: `docs/apple.md` (a second AdMob app, ATT, the privacy
  manifest).
- Implementation status: **nothing built.** The Swift side is the expensive
  half, and this app has had four native hand-overs of which three failed
  silently — so it gets a status line on screen first, the way `kbOutSay()`
  was added before anything else worked.

### Decision
- Date: 2026-08-22
- Area: Two keyboards. The free one is frozen, the paid one is free
- Decision: 「だから無料は凍結、有料は自由にだろ。キーボード設定で入れ替えも
  できるんだから。有料は有料キーボードでしかいじれない。無料の文字も
  入れれる。これだけじゃないの？」

  There are two keyboards and they are different things.

  **The free QWERTY is frozen.** The slots are on it, in the order QWERTY puts
  them, and there is no editor. Nothing on the paid side reaches it. A slot's
  name never changes — wanting a different `a` means **redrawing it**, because
  the drawing is what a letter is.

  **The paid keyboard is free.** Keys are arranged and swapped in its editor,
  and it takes **any letter — one somebody added, or one of the free slots.**
  Nothing about a letter's name restricts it.
- Reason: they are not one feature with a plan gate across it. The free QWERTY
  exists because the free alphabet is exactly a–z, `!`, `?` and the digits, so
  a keyboard can be had with no editor and nothing to set. The paid keyboard
  is a thing somebody builds. Rules that hold one do not belong on the other.
- **Two wrong turns are written down so they are not taken again.**
  1. *"Decide what a slot IS by its name."* That made a letter somebody ADDED
     and typed as `a` into a slot, permanently unrenameable — measured:
     `ltSetRoman(added,'a')` took it and `ltSetRoman(added,'q')` afterwards did
     nothing. 「+したら変えられないのはおかしい」
  2. *"Reserve the slot names, so nothing else may be called `a`."* Proposed
     and refused: 「足した文字もキーボードに設定はできるやん」. The code agrees
     — a paid key binds a letter's **id** (`key.v = lid`), never its name, so
     an added letter goes on a paid keyboard whatever it is called. Reserving
     would have restricted the paid side for the free side's convenience,
     which is the opposite of 有料は自由.
- The case that kept being reported as a defect, and is not one: a paid
  language where somebody drew a letter, called it `a`, and then dropped to
  free. `ltStart()` sees the name taken, makes no slot, and that letter is the
  free `a` key. **That is the letter they drew and named, on the key they
  named it for.** The defect the backlog entry was actually about is the
  opposite — a slot RENAMED away, leaving a key nothing could find and an
  empty letter filling the hole — and a slot cannot be renamed now.
- Affected features: the letter page's name field; the free QWERTY; the paid
  keyboard editor.
- Affected data: none. No field is added and nothing stored changes.
- Affected docs: `docs/BACKLOG.md`.
- Implementation status: **in, and nothing further is owed.** `ltSetRoman()`
  refuses to rename a slot; nothing restricts a letter somebody added.
  `base-check` holds both: a slot keeps its name on the paid plan, and a
  letter somebody added is still theirs to name.

### Decision
- Date: 2026-08-22
- Area: The free slots' names, and what paid buys
- Decision: 「無料で作ってる範囲の名前変更は無しでしょ。有料は追加できると
  いうだけで。無料分のキーボードはもういじらない」

  **The twenty-eight slots and the digits may not be renamed, on any plan.**
  a–z, `!`, `?` and one digit per value of the base are what a free language
  starts with, and their names are what they are. Paid does not buy the right
  to change one; **paid buys ADDING letters**, which is `can('letters')` and
  is a different sentence.

  And: **the free keyboard is finished.** No further work on it.
- Reason: the free QWERTY finds its keys BY NAME — `kbNamed('a')` walks
  `LETTERS` for one called `a` — so a renamed slot is a key that cannot be
  found, and `ltStart()` then fills the hole with a new empty letter. The
  letter somebody drew is still in the alphabet and is no longer on the
  keyboard, with nothing anywhere saying why. Making the name unchangeable
  dissolves that: a name that cannot move cannot be lost.

  This is **not** "the paid screen is restricted by a plan the person is not
  on", which is how `docs/BACKLOG.md` framed the same option and why it read
  as expensive. A slot's name is not something anybody was ever offered.
- Affected features: the letter page's name field, the free QWERTY, import.
- Affected data: none. Nothing stored changes; a name that was already
  changed on a letter stays as it is — this decides what may happen from now,
  and CLAUDE.md's data rule says the past is not rewritten to match a new
  rule.
- Affected docs: `docs/BACKLOG.md` — the "A renamed letter loses its key on
  the free plan" entry closes on this.
- Implementation status: the letter page already hides the field —
  `ltIsBase()` in `letters.js` and `can('letters') && !ltIsBase(l)` in
  `sound.js`, with the owner's earlier words on it quoted there
  (「無料で作ったやつを改名できなければ良くない？」). What was NOT in was the
  rule itself: `ltSetRoman()` did not refuse, so the screen was the only thing
  holding it. Now guarded at the function, and `base-check` holds it.

### Decision
- Date: 2026-08-22
- Area: Names — a verb is allowed to be a family, and a chapter may not be
  spelled two ways
- Decision: Three rulings, made together because they are one question asked
  three times.

  **(1) A consistent verb family is a legitimate prefix and is not to be
  broken up.** `save*` is exactly ten functions — `saveKb` `saveLetters`
  `saveMe` `saveNote` `saveNotes` `savePosts` `saveSnd` `saveStg` `saveWld`
  `saveWord` — and every one of them names what it saves. It stays as it is.
  `del*` (`delNote`, `delWord`) stays for the same reason. Nobody is to
  "fix" two members of a family into a chapter prefix and leave the other
  eight; that is the tangle, not the untangling. **`docs/BACKLOG.md` was
  wrong to list `savePosts` and `saveMe` beside `postsRead`** — those two are
  not a `posts*`/`post*` collision, they are `save*`, and only `postsRead` is
  the thing the entry was actually about. `postsRead` → `postRead`.

  **(2) `gh*` in `glyph.js` is `ge*`'s and is renamed `geHint*`.** The ten
  functions are the silent demo canvas inside the glyph editor — an arrow
  replaying three points closing into a shape, and a before/after of the ○ /
  fill / new-stroke buttons. It draws no text at all, which is why it is
  right in ten languages. It is not grammar (`g*`) and it is not the editor
  itself, so: `ghDemo` `ghDraw` `ghEase` `ghField` `ghInk` `ghMount` `ghPos`
  `ghSeg` `ghShow` `ghTick` → `geHint*`. Its uppercase globals take `GE_`,
  which `GE_MAXPTS` already established in the same file: `GHINT` `GHP`
  `GHTAP` `GHCYC` `GHDCYC` `GHDEMO` → `GE_HINT` `GE_HINT_P` `GE_HINT_TAP`
  `GE_HINT_CYC` `GE_HINT_DCYC` `GE_HINT_DEMO`.

  **(3) `note*` in `notes.js` is the chapter spelled long, and goes to
  `nt*`.** `noteRead` `noteCut` `noteHead` `noteBody` `noteAt` → `nt*`, and
  `notesFound` → `ntFound`. `openNote` and `vNotes` are untouched — `open*`
  and `v*` are named in CLAUDE.md — and `saveNote` `saveNotes` `delNote` are
  untouched by (1).
- Reason: the Names rule exists so that 500-odd globals in one namespace stay
  findable, and a ten-member verb family is findable. CLAUDE.md's own prefix
  list already admits one: `open*` is twenty functions and is a verb, not a
  chapter. So a verb family is not an exception being invented here — it is
  the rule as already written, said out loud. What the rule is actually
  against is **one chapter under two names**, which is what `posts*`/`post*`
  and `note*`/`nt*` are, and what `gh*` is a third form of: a prefix that
  names no chapter at all.
- Affected features: none. All three are renames; behaviour does not change,
  and a rename that changes behaviour is not a rename.
- Affected data: none. Nothing stored is named by any of these.
- Affected docs: `docs/BACKLOG.md` — the "a rename is not a fix" entry is
  corrected on the `savePosts`/`saveMe` half and struck as each part lands.
- Implementation status: `wSetFil`/`wSetSort` → `wordsSetFil`/`wordsSetSort`
  landed (yoo). The three above are assigned and not yet in.

### Decision
- Date: 2026-08-22
- Area: Shape — a fifth banned thing, and row height
- Decision: **No rounded box.** 「角丸やめろ」 Nothing new carries a corner
  radius, a border, or a filled panel — button, banner or notice. `.btn.ghost`
  where a button is wanted; a plain row where one is not. And **every row in
  one list is the same height**: the row class sets `font-size` and
  `line-height` itself, and no row gets a `margin-top` to make a group.
- Reason: it was broken three times in one afternoon after being pointed out
  twice — a gold pill on the frozen screen, a bordered strip across Home, a
  gold pill on the password screen. The class comment on `.btn.ghost` has
  said it since it was written: 「文字書いて四角で囲ったみたいなボタン全部やめて
  くれ。ダサすぎる」. The height half is the same afternoon: `.set` left the
  type to the tag, so a `<button>` row was 49px and an `<a>` row 57px in the
  same list.
- Affected features: every screen from here on. `.btn` is still on about
  thirty older ones and is not being swept; it is simply not reached for
  again.
- Affected data: none.
- Affected docs: `CLAUDE.md` § Shape.
- Implementation status: **done** for everything added on 2026-08-22.

### Decision
- Date: 2026-08-22
- Area: Explaining — the rule, narrowed rather than lifted
- Decision: **Necessary explanation is written, and kept to the minimum.**
  「必要な説明は書いてね。みてわからないのが一番ダメ。最低限ね」 The ban
  stands everywhere it stood: a screen still does not describe what a setting
  means, does not sell a paid plan, and does not tell somebody what to tap.
  What is now allowed is the sentence a screen needs in order not to be a
  mystery — where the app has DONE something to somebody and the screen would
  otherwise be a state with no cause and no way out.
- Reason: the frozen screen is the case that settled it. The buttons are
  gone, the timeline is gone, and a heading saying "Account suspended" leaves
  somebody unable to tell a suspension from a broken app — and with nowhere
  to say it is wrong. Not knowing is the worse failure.
- Affected features: the frozen screen (`vFeed`), and any screen after it
  that takes something away.
- Affected data: none.
- Affected docs: `CLAUDE.md` § Explaining, `FEATURE_RULES.md`.
- Implementation status: **done for the frozen screen** — a heading, one line
  saying what is off, and the way to appeal. Nowhere else has been touched,
  and nowhere else may be without this test: has the app taken something
  away, and would the screen otherwise be a mystery.

### Decision
- Date: 2026-08-22
- Area: A frozen account, seen by everybody else
- Decision: **Their posts come off the timeline and stay on their own page**,
  and their page says the account is frozen instead of showing them. Nothing
  is deleted or hidden on the server. 「タイムラインから外す、プロフィールから
  は凍結してますの表示。ツイートは自己責任で見れるようにするのは？」
- Reason: a freeze can be lifted, so nothing may be destroyed — everything
  comes back by itself the next time the server is asked. Taking the posts
  off the timeline is what stops a frozen account going on being read by
  people who did not go looking; leaving them on the page is what stops a
  freeze being a deletion.
- Affected features: `postAll()` / `postKept()`, `whoCard()`, `post_seen`.
- Affected data: `post_seen` gains `author_out`. No row moves.
- Affected docs: `FEATURES.md`, `DATA_MODEL.md`.
- Implementation status: **done.**

### Decision
- Date: 2026-08-22
- Area: Appealing a freeze
- Decision: **An address, not a form.** `Lingua@tokinets.com`, opened from the
  frozen screen.
- Reason: a frozen account cannot write a row anywhere — every write policy in
  `schema.sql` goes through `is_member()`, which is the whole of what being
  frozen means — so a form would need a table with the door open, and that
  door is the thing being closed. Mail is a channel that already exists.
- Affected features: `vFeed` while frozen.
- Affected data: none.
- Affected docs: `supabase/setup.md`.
- Implementation status: **done in the app.** The alias itself is the owner's
  to create.

### Decision
- Date: 2026-08-22
- Area: What a thing belongs to
- Decision: **Everything belongs to the account** — language, dictionary,
  letters, keyboard, plan. The server is true, the phone keeps a copy so it
  works with no signal. **Cloud storage is for everybody**, so it stops being
  what Plus sells.
- Reason: 「全部アカウントごとでしょ」「クラウドは全員で」. It fits $25: a
  language packs to 5.4 KB, a large one to about a megabyte. What eats a plan
  that size is photographs on a timeline, and that is bandwidth.
- Affected features: `SLICES`, `LANGS`, the plan, `is_member()`, `CAN.data`.
- Affected data: all of it. Nothing is deleted; what is on a phone is adopted
  by the first account that signs in there.
- Affected docs: `FEATURES.md`, `STATE.md`, `DATA_MODEL.md`, `PAID_FEATURES.md`.
- Implementation status: **not started.**

### Decision
- Date: 2026-08-22
- Area: When somebody is asked who they are
- Decision: An **anonymous account is made silently at first launch** and
  everything is made under it. Identity is asked in **two places only:
  posting, and buying.** The uid does not change when it is attached.
- Reason: 「サインイン必須にしたいけど、オンボーディングで離脱されるのは防ぎたい」
  「課金とツイートにはログイン必須。それ以外は流さない」. Buying needs it
  because an anonymous account is one phone's refresh token, and a receipt
  bound to a lost one is paid for and unreachable.
- Affected features: onboarding, composer, plans screen, `is_member()` — which
  becomes two questions: your own things, and things other people see.
- Affected data: none.
- Affected docs: `FEATURES.md`, `STATE.md`, `supabase/setup.md`.
- Implementation status: **the phone's half is done.** The first launch signs
  in anonymously (`netAnon` in `net.js`, called from `boot.js`); `netMember()`
  is the second question and `obNeed()` asks it at the six things other people
  see; the door left the onboarding and is opened by `obDoor()`. Buying is
  untouched — there is no StoreKit to put a door in front of. The SERVER half
  is not done: `is_member()` still refuses an anonymous account for
  everything, including its own things, so nothing an anonymous account makes
  can be stored yet.

### Decision
- Date: 2026-08-22
- Area: What being frozen stops
- Decision: **The SNS side only.** No posting, replying, reacting, following or
  reporting, and the three sns tabs close. Making a language goes on working.
- Reason: 「制作は好きにやらせればいいし、sns止められても作りたいやつは作るでしょ」.
  Locking the making side takes away offline work, is walked around with flight
  mode, and misses the point: what hurts is losing the account. Restricting
  what may be carried OUT was refused for the same reason — a backup that opens
  on one phone only is a language lost with the phone.
- Affected features: `is_member()`, the sns tabs, the composer.
- Affected data: none.
- Affected docs: `FEATURES.md`, `supabase/setup.md`.
- Implementation status: partly — writes are stopped, the tabs are not.

### Decision
- Date: 2026-08-19
- Area: How a screen is built — four shapes that are banned
- Decision: 「君あるあるの丸パッチ無限横並び、同じページに情報量詰め込み、ページ
  遷移型にせず下からひょいって出すやつ、無駄に説明をするやつ。この辺禁止で ux を
  意識して作ってほしい」
  1. **No endless row of round chips.** A row of pills you scroll sideways is
     a list pretending to be a control. If there are more than a few, it is a
     LIST.
  2. **One screen, one job.** Do not stack the thing being chosen and the
     thing being changed on one page. Choosing is a screen; changing is the
     screen you arrive at.
  3. **Go to a page; do not slide something up from the bottom.** A thing you
     can act on is a place you went to, with a way back. A sheet that appears
     over the screen you were on is not one.
  4. **No explanatory text** — already its own decision, above.
- Reason: the keyboard chapter had all four at once: a row of numbered chips
  above the editor they chose between, on the same screen, with a line of
  prose under it. 「上にあるとすんごい見にくい」
- Affected features: every screen. Done so far: the keyboard chapter is a list
  and one keyboard is a page.
- Affected data: none.
- Affected docs: `CLAUDE.md`
- Implementation status: the rule is in force from now. **The screens that
  still break it have not been swept** — this decision is not a licence to go
  and rewrite them all in one commit; each is its own task.

### Decision
- Date: 2026-08-19
- Area: Publishing and downloading — a keyboard, an alphabet, a dictionary
- Decision:
  1. **The author decides.** Public or private, per thing, for all three: the
     keyboard, the letters, the words. Nothing is downloadable unless its
     author said so.
  2. **Downloading a KEYBOARD or an ALPHABET is free.** Downloading a
     DICTIONARY is **Plus**. 「freeは文字とキーボードのみ」「最悪知ってる人は
     それで会話できるし、本気で知りたい人は課金するっしょ」
  3. **Making and publishing stays Plus**, as it is now. Free still cannot
     build a keyboard or add a letter, and that does not change.
  4. **A downloaded keyboard goes on its own shelf, up to three**, beside the
     three somebody built. It does not take one of their slots.
  5. **A downloaded dictionary is a separate possession and is never merged
     into your own language.** It is a language you can READ. `FREE_LIMIT`
     counts your own words, so five thousand of somebody else's do not touch
     it — and if they were merged, the limit would have no answer and the two
     could never be told apart again.
- Reason: 「ヨタ語ってのがあって、そのファンの人がキーボードdlできたら、そのまま
  使える！みたいな」 The fan side is what spreads it, so the fan side is free.
- Affected features: keyboards, letters, words, the profile, the language page
- Affected data: new server tables; on the phone, a downloaded keyboard and a
  downloaded language are new slices and are **not** the person's own
- Affected docs: `docs/FEATURES.md`, `docs/PAID_FEATURES.md`, `CLAUDE.md`
  6. **A downloaded keyboard is edited as it stands** — the download IS the
     copy, so there is nothing to copy again. But **the letters that can be
     put on its keys are the downloader's own**: it is somebody else's
     keyboard and this is somebody else's alphabet, and the two do not mix.
     「dl自体が複製なんだからそのままで良くね？でも人の言語だから当てられる文字は
     dlした人の言語だけ」
- Implementation status: **not started.** The payload half already exists:
  `shareKbd()` produces a keyboard with the shapes cut onto its keys, needing
  no alphabet and no dictionary on the other side, which is exactly what a
  download has to be.

### Decision
- Date: 2026-08-19
- Area: Blocking
- Decision: **Blocked means you see nothing of them.** Not a quieter timeline
  — gone: the feed (left out by the server), threads, profiles, search on both
  sides, and the notices. 「ブロックは何も見えなくなるでいいんじゃない」
- Reason: a block that only thins a feed is a block somebody keeps meeting.
- Affected features: the timeline, search, notices, threads
- Affected data: `ME.bl` on the phone, `block` on the server
- Affected docs: `docs/FEATURES.md`
- Implementation status: implemented, **not device confirmed**

### Decision
- Date: 2026-08-19
- Area: What may be written on a screen
- Decision: **No explanatory text in the app.** A screen shows what it is and
  what can be done on it. It does not explain itself, does not say what a
  paid plan would give, does not tell somebody what to tap, and does not
  describe what a setting means. Where an explanation is genuinely needed it
  goes behind the `?` in the bar, which is what the `?` was added for.
- Reason: 「お前もうアプリ内に説明書くの禁止な」, and before that 「その説明ちっく
  な日本語やめて欲しい。小さい文字で書くやつ」「説明ちっくすぎて嫌だ」
- Not covered by this: an EMPTY state ("nothing here yet"), a count, a state
  ("only for an abugida"), an error, and the `?` sheets. None of those is the
  screen explaining itself.
- Affected features: every screen. Removed with the decision: `plans.intro`,
  `plans.note`, `set.theme.note`, `ws.kind.note`, `ab.cell`, `langs.more`,
  `kb.locked` — and `LANG_MAX`, whose only reader was one of them.
- Affected data: none.
- Affected docs: `CLAUDE.md`, `docs/FEATURES.md`
- Implementation status: implemented. **`cap.lapse.d` is left in and is the
  one thing to settle**: it is the line that says a dictionary dropping back
  to a hundred words has had NOTHING deleted. Taking it out would leave the
  app silently truncating a list with no word about the data, which
  `docs/DATA_SAFETY.md` is written against. Reported rather than resolved.

### Decision
- Date: 2026-08-18
- Area: Anything that is the server's — and the timeline first
- Decision:
  1. **Anything that needs the server is built assuming the server is
     there.** A screen that half-works without one is not a step on the way
     to being online; it is a bug that will be found by somebody using it,
     not by a check.
  2. The timeline is the server's. **Reading it and posting to it both
     require an account.** The feed, the search and the notices show the
     app's own door when there is no session, and the composer does not open
     at all.
  3. **The making side is untouched.** A language is made on this phone with
     or without an account, and 「アカウントなしで続ける」 stays on the door
     and keeps meaning exactly that. What it does not buy is a timeline.
- Reason: 「なんでログインしてないアカウントで投稿できんの？そんなsnsどこにあん
  の？」「だからなんで最初からオンライン前提で作れっつってんだろ、そういう中途
  半端なバグを出すんだって何回言えばわかるの？」 — said more than once before
  this, and never written down, which is why it kept being lost.
- Affected features: the timeline, the search, the notices, the composer, the
  onboarding door (it takes a `skip` argument now, so the same door can be
  shown without "continue without an account")
- Affected data: **none.** `SET.anon` still means what it meant. No post is
  touched, moved or removed; posts already written while signed out stay
  where they are and go up when there is a session, exactly as before.
- Affected docs: `docs/FEATURES.md`, `docs/ARCHITECTURE.md`, `CLAUDE.md`
- Implementation status: implemented, held by `post-check` (all three
  assertions watched failing), **not device confirmed**

### Decision
- Date: 2026-08-14
- Area: Money — the four subscription products, their ids and their prices
- Decision:
  1. Two plans, **Plus** and **Studio**, each sold **monthly and yearly**.
  2. The product ids are, and these can never be changed once the products
     exist in App Store Connect:

     | | monthly | yearly |
     |---|---|---|
     | Plus | `com.tokinets.lingua.plus.monthly` | `com.tokinets.lingua.plus.yearly` |
     | Studio | `com.tokinets.lingua.studio.monthly` | `com.tokinets.lingua.studio.yearly` |

     Studio's two are **not created yet** — see the status line at the foot of
     this decision. The ids stay written down because they can never change
     once they exist, and the day Studio ships it has to use these.

  3. Prices, in US dollars. Every other country is Apple's automatic
     conversion unless somebody sets it by hand:

     | | monthly | yearly |
     |---|---|---|
     | Plus | 9.99 | 99.99 |
     | Studio | 19.99 | 199.99 |

  4. All four sit in **one subscription group** named `Lingua`, Plus at level
     1 and Studio at level 2 — so somebody can move between them and cannot
     hold both at once.
- Reason: 「年額　plus 99.99 / studio 199.99」. The monthly pair and the group
  were settled earlier and are written in `docs/apple.md`.
- Affected features: the plans screen, everything `CAN` gates
- Affected data: none yet. **`SET.plan` is a flag in `localStorage` and stays
  one until receipts are verified server-side** — see the note below.
- Affected docs: `docs/apple.md`, `docs/PAID_FEATURES.md`, `docs/FEATURES.md`
- Implementation status: **the products are the owner's to create in App Store
  Connect. There is no StoreKit code in the app, and it is not to be written
  yet** — 「今まだプラスとかは俺が自由に行き来して確認したいからstorekit入れない
  で欲しいかも」. The plans screen stays a switch anybody can press, so a paid
  face can be walked without buying anything. Nothing can be bought however
  the products are configured, and that is the current intent.

### Decision
- Date: 2026-08-13
- Area: Posts — how many photographs, and how they are shown
- Decision:
  1. A post can carry **up to four** photographs.
  2. They **slide sideways**; the picture area scrolls and nothing else does.
  3. On the composer the **＋ sits beside them, centred**, and goes when there
     are four.
  4. Each picture has its own letters placed on it, and each is baked
     separately when the post is sent.
- Reason: 「画像は4枚まで載せられる。画像だけ横スライドできる感じ」
  「+が真ん中に来ると最高」
- Affected features: composer, timeline
- Affected data: **new** — `post.pics`, an array of data URLs. `post.pic` is
  **not removed and not rewritten**: posts that carry one keep it, and every
  reader goes through one function that answers `pics` or falls back to `pic`.
  `POST_BYTES` is unchanged and is now four times easier to reach, so a
  picture that will not fit is refused and the post is not
- Affected docs: FEATURES.md, DATA_MODEL.md, DATA_SAFETY.md, CHANGELOG.md
- Implementation status: implemented; code confirmed, not device confirmed

### Decision
- Date: 2026-08-13
- Area: Posts — the photograph on the composer
- Decision: no buttons under it. A **red minus at the picture's top corner**
  removes it, a **＋ beside it** adds one, and **pressing the picture opens the
  editor** — cropping, letters, whatever the editor grows.
- Reason: 「右上に赤い⚪︎に-で消すで画像横に+ボタンでadd」「編集ボタンはいらん。
  画像タップして画像編集切り抜きとか文字入れとかできるように」
- Affected features: composer
- Affected data: none
- Affected docs: CHANGELOG.md
- Implementation status: implemented; code confirmed, not device confirmed.
  The editor does both — letters and cropping — and the letters already placed
  move with the picture when it is cut

### Decision
- Date: 2026-08-13
- Area: **What happens when a plan ends** — every capability at once
- Decision: **the app goes back to the shape the free plan has, and nothing a
  person made is deleted.**
  1. The dictionary **lists the first 100 words** it was given, in the order
     they were made. The rest are not on screen. Every one of them is still in
     `WORDS`, in `save()`, in the backup and in the file in Documents, and the
     app reads the whole dictionary for itself — a post, a gloss, a spelling,
     an example. Only the list is short.
  2. The writing goes back to an alphabet, the keyboard to the fixed QWERTY,
     the direction to left→right. All three were already true of `wsys` and
     `kb`; `dir` joins them.
  3. A stage of somebody's own stays on the list and can no longer be added to
     or deleted.
  4. **The day it happens the app says so, once**, in a sheet: nothing has
     been deleted, it is all in the backup, and it all comes back on
     resubscribing. `capLapse()` in `core.js` decides when; `openCapLapse()`
     in `settings.js` is what it says.
  5. The foot of the dictionary says how many are not listed, every time.
- Reason: 「a にしたら最初の1ヶ月で作りきったらそのあと課金されねえだろ」
  「非表示や」「課金切れたら、ポップ出して、バックアップには保存されてるよーって
  一回出せばok」
- Affected features: the dictionary, search, the relation picker, the writing
  system, the keyboard, direction, grammar stages, the plans screen
- Affected data: **none.** Nothing is written, moved or removed. `SET.planWas`
  is added — the plan the app last saw, so a change can be noticed however it
  happens (set by hand today, StoreKit tomorrow, found lapsed at launch)
- Affected docs: PAID_FEATURES.md, DATA_SAFETY.md, DATA_MODEL.md, CHANGELOG.md
- Implementation status: implemented; code confirmed, not device confirmed
- **The rule it is measured against**: `docs/DATA_SAFETY.md` forbids removing
  what somebody made. It does not forbid a shorter list. The line between the
  two is the whole of this decision, so `backup-check` now holds it: on the
  free plan, past the ceiling, `findWord()` still finds a word that is not
  listed and `bkPack()` still carries every one of them. Both were watched
  failing with the bug put back.

### Decision
- Date: 2026-08-13
- Area: Which way a language is written
- Decision:
  1. A language has a **direction**, and it is the language's — not the
     person's and not the post's to choose. Four of them: left→right,
     right→left, and vertical with the columns running right→left or
     left→right.
  2. **Reading is free.** A post written in any of the four is shown that way
     to everybody, on every plan.
  3. **Setting it is Plus.** Choosing a direction, and posting in one, is a
     paid capability.
- Reason: 「縦書き、右→左 左→右の投稿」「言語の設定でしょ右左とかは」
  「無料でも言語の向きは見ることはできる。でも設定してsnsとかに登校するのは
  有料会員のみ」 The vertical column order: 「右から左と左から右の両方」
- Affected features: the writing system screen, the composer, the timeline,
  the card
- Affected data: `SCRIPT.dir` in the **`script` slice** — the language's, so
  it is in the backup and travels with the language. **Frozen onto the post**
  as `post.dir`, for the same reason `ink` is: a reader has neither the
  writer's alphabet nor their language's settings
- Affected docs: FEATURES.md, DATA_MODEL.md, PAID_FEATURES.md, CHANGELOG.md
- Implementation status: implemented; code confirmed, not device confirmed
- What happens when the plan ends is the decision below: the language runs
  left→right while it is on free, and `SCRIPT.dir` is kept untouched.

### Decision
- Date: 2026-08-13
- Area: Posts — letters on an image, the three details
- Decision:
  1. Letters are placed **freely**: pick a letter, put it anywhere on the
     picture, drag it with a finger, size it with a slider. No rotation.
  2. They are **baked into the picture** when the post is sent. The post
     carries one image and nothing else.
  3. Free, on every plan.
- Reason: 「なんなら画像に自作文字を貼って投稿できるようにすれば勝手に広がるよ」
  「画像と自作文字貼るのは無料 投稿に貼るに決まってるでしょ」 Placement:
  「自由配置」 Storage: 「画像に焼き込む」
- Affected features: composer, timeline, card
- Affected data: `post.pic` only. Baking means the picture IS the past tense —
  there is nothing on the post that has to be re-rendered with an alphabet the
  reader does not have, which is the same guarantee `ink` gives by a different
  route
- Affected docs: FEATURES.md, DATA_MODEL.md, CHANGELOG.md
- Implementation status: implemented; code confirmed, not device confirmed.
  Dragging is a pointer gesture and a pointer gesture is the one thing a
  headless browser cannot vouch for — `post-check` holds what the bake puts in
  the file, and a finger on a photograph needs a phone

### Decision
- Date: 2026-08-12
- Area: A post shown three ways — the four details
- Decision:
  1. The natural-language layer is translated **when the post is written**,
     using **the reader's own device AI, borrowed** — not a service of ours.
     No key of ours, no server of ours, no cost per post. The translation is
     attached at the moment of posting and travels with the post.
  2. A word the reader's dictionary has no word for stays in the natural
     language and is shown **in red**, so the gap is obvious.
  3. Layer 3 is Plus. Free gets three a day.
  4. The natural language is always on screen. Layer 3 appears on a button.
- Reason: 「翻訳はユーザーのaiを拝借します。投稿するタイミングでai翻訳がつくので」
  「まずオフラインで起動できないやろSNSは」「1日3回やろ」
  「自然言語のまま残して赤文字とかにする。この単語ないのがわかりやすいように」
  「非人工言語は常に表示。自分の言語への変換はボタンで出現」
- Affected features: composer, timeline, post, dictionary
- Affected data: **new, frozen on the post** — `post.tr`, a translation per
  language code
- Affected docs: FEATURES.md, DATA_MODEL.md, PAID_FEATURES.md
- Implementation status: the seam and layer 3 are being built now. The
  translator behind the seam is not, and is not blocking: posting works with
  the seam returning nothing, exactly as `AI_SEAM` already works for the
  generators.

#### And the standing instruction that goes with it

**Build for the online and AI parts now; wire them up later.** An unbuilt
service is not a reason to stop — it is a reason to put a seam where it will
attach, and to make everything on this side work with the seam answering
nothing. `AI_SEAM` in `www/glyph.js` is the pattern and it predates this.

Reporting "there is no hosted model" as a blocker was wrong. It is a fact
about today, not about the design, and the design is the part being asked
for.

### Decision
- Date: 2026-08-12
- Area: A post shown three ways
- Decision: A post can be shown as (1) the writer's own drawn letters, (2) what
  it means in a natural language, and (3) that same thing rendered into the
  READER's own conlang. "Unlimited translation" on the Plus list means this.
- Reason: 「相手の自作文字の投稿／英語など非人工言語／自分の人工言語へ変換した翻訳
  ／この3つが出せたらおもろいやん」
- Affected features: timeline, post, dictionary
- Affected data: layers 1 and 2 are already frozen on the post (`ink`, `mn`).
  **Layer 3 must NOT be frozen** — it is the reader's own language read now,
  and it is supposed to improve as their dictionary grows
- Affected docs: FEATURES.md, DATA_MODEL.md
- Implementation status: 1 and 2 are built. 3 is not. Four things are still
  open: what layer 2 shows when the writer's language is not the reader's; what
  happens to a word the reader has no word for; whether layer 3 is free or
  Plus; and how the three are presented.
- Note: this does not overturn the decision at the head of `www/post.js` (no
  machine reads an invented language on the author's behalf). Layer 3 runs the
  other way, from a sentence the author confirmed into the reader's own words.

### Decision
- Date: 2026-08-12
- Area: Plus — what it contains
- Decision: Plus is: unlimited words; unlimited letters of your own; the
  writing systems that are not an alphabet; choosing a sound; grammar stages
  of your own; CSV in and out; keyboard customisation, including flick and
  putting any letter on any key in any position; everything Free has; cloud
  storage (deferred, see the entry below); vertical and right-to-left posts;
  and unlimited translation (definition still open — see FEATURES.md).
- Reason: the owner's list, given in full.
- Affected features: every `plus` row in FEATURES.md
- Affected data: none by itself
- Affected docs: FEATURES.md, PAID_FEATURES.md
- Implementation status (2026-08-21): `words` `letters` `wsys` `snd` `gram`
  `data` `file` `kb` are implemented, and flick and free placement are already
  in the keyboard editor. Vertical / RTL is built — `dir` in `CAN`, and a post
  carries the direction it was written in. Translation is built as layer three
  and is **free and unmetered**: `tr` was never added to `CAN`, and
  `TR_FREE_DAILY` was never declared. Decision 2026-08-12 § 3 above said
  "Layer 3 is Plus, free gets three a day"; that was the AI's price, and the
  AI is not going in 「1日3回は亡くなりましたaiいれないから」 (2026-08-22).

### Decision
- Date: 2026-08-12
- Area: Plus — the AI
- Decision: The AI is not part of what Plus sells. Plus gets a few AI chats a
  day; unmetered AI is not a Plus capability.
- Reason: 「aiはaiチャットが1日数回できるくらいで、基本機能にはついてない」
- Affected features: AI suggestions, AI conversation
- Affected data: `SET.aiDate` / `SET.aiN` (the daily counter)
- Affected docs: PAID_FEATURES.md, FEATURES.md
- Implementation status (2026-08-21): **moot.** There is no AI. `AI_SEAM` in
  `www/glyph.js` marks where a hosted model would join and nothing joins it, so
  Studio — the tier that sold it — is out, and with it went `CAN.ai`,
  `AI_FREE_DAILY`, `SET.aiDate`/`SET.aiN`, the suggestion chips and the
  conversation chapter. The question this decision answers comes back the day
  the seam has something behind it.

### Decision
- Date: 2026-08-12
- Area: Cloud storage
- Decision: Cloud storage is a Plus feature, deferred. It will be built once
  there are enough users to justify the $25/month Supabase tier.
- Reason: the owner's, on cost.
- Affected features: cloud sync
- Affected data: none yet. When built: every slice, and a conflict-resolution
  rule which is the owner's to decide, not a tool's
- Affected docs: FEATURES.md (planned), PAID_FEATURES.md
- Implementation status: not started. **The plans screen and the settings
  screen currently present it as available**, which is a promise the app
  cannot keep — awaiting a decision on how to word it until then.

### Decision
- Date: 2026-08-12
- Area: Posts — images
- Decision: A post can carry an image. Letters somebody drew can be placed on
  that image and posted.
- Reason: the owner's. 「なんなら画像に自作文字を貼って投稿できるようにすれば
  勝手に広がるよ」
- Affected features: composer, timeline, card
- Affected data: **new** — an image on a post, and where the letters sit on
  it. Both must be FROZEN onto the post (`docs/DATA_MODEL.md` § the three
  kinds): a reader does not have the writer's alphabet, so the shapes have to
  travel exactly as `ink` does
- Affected docs: FEATURES.md, DATA_MODEL.md, DATA_SAFETY.md (posts grow by the
  size of an image), CHANGELOG.md
- Implementation status: not started. Free or Plus is not yet decided; storage
  (data URL on the post vs. a file) is not yet decided.

### Decision
- Date: 2026-08-12
- Area: The word sheet
- Decision: Making a word and editing one are the same screen. Opening a word
  shows it; editing is behind a button.
- Reason: 「単語追加の時点で編集できるようにしろよ。編集でも見えるように当たり前だろバカか」
  「作成編集それぞれ同じ画面で」「開いた時は閲覧、編集ボタンで編集」
- Affected features: dictionary, word sheet
- Affected data: none
- Affected docs: FEATURES.md, CHANGELOG.md
- Implementation status: implemented; code confirmed, not device confirmed

### Decision
- Date: 2026-08-12
- Area: A word's fields
- Decision: A word carries register, fields, origin and a changed-on date, in
  addition to what it had.
- Reason: asked for as the four things a dictionary needs and this one lacked.
- Affected features: dictionary
- Affected data: `words` slice — four optional keys, absent unless filled in
- Affected docs: DATA_MODEL.md, FEATURES.md, CHANGELOG.md
- Implementation status: implemented; code confirmed, not device confirmed

### Decision
- Date: 2026-08-12
- Area: Cards of posts
- Decision: A card of a post is drawn from `post.ink`, never re-derived from
  the open dictionary. This holds even though every post today is the person's
  own.
- Reason: the owner's audit: 「現在開いている言語の文字体系で他人の投稿を描画して
  しまう可能性がある」 — do not stop at "my own posts still look right".
- Affected features: card, timeline
- Affected data: none stored; `postInkOK()` decides drawability
- Affected docs: DATA_MODEL.md, CHANGELOG.md, CLAUDE.md rule 12
- Implementation status: implemented; code confirmed, not device confirmed

### Decision
- Date: 2026-08-12
- Area: Number of languages
- Decision: One language per person, on every plan. Not a price.
- Reason: there is no way to make a second anywhere in the app, so a plan
  promising more would promise a button that does not exist.
- Affected features: languages
- Affected data: `LANG_MAX`
- Affected docs: PAID_FEATURES.md, FEATURES.md
- Implementation status: implemented

### Decision
- Date: 2026-08-11
- Area: Data safety
- Decision: Losing somebody's language is not acceptable under any
  circumstance. A backup lives in Documents; a restore fills in what is
  missing and never overwrites.
- Reason: 「データ消えるのだけはありえない」
- Affected features: backup, restore
- Affected data: all eleven slices
- Affected docs: DATA_SAFETY.md, CLAUDE.md rule 11
- Implementation status: implemented; **device verification outstanding**
  (9 items, `docs/TESTING.md` § device)

### Decision
- Date: 2026-08-11
- Area: The free plan
- Decision: The free plan is your own shapes for a–z, `!`, `?` and the digits —
  thirty-eight slots, drawing only. Nothing on free adds, renames or deletes a
  letter. The keyboard is a fixed QWERTY with the drawn letters substituted in,
  with nothing to set.
- Reason: 「無料の場合はもう最初からa〜z!?が置いてあってそこから書くだけで追加する
  自体がない」「キーボードもqwerty配列がそのまま自作文字に置き換わるだけ。なんの設定
  もできない」
- Affected features: alphabet, keyboard, letters
- Affected data: `letters` slice (`ltStart` tops up, never rearranges)
- Affected docs: PAID_FEATURES.md, CLAUDE.md § what the free plan is
- Implementation status: implemented

### Decision
- Date: 2026-08-11
- Area: The free keyboard's face
- Decision: One face. Digits above the QWERTY, `!` and `?` at the ends of the
  space bar, delete two keys wide. No second page.
- Reason: 「2ページ目なしでqwertyの上に1〜0の数字と！？入れてこれで無料版1ページに
  抑えよう」「これスペースデカすぎやね。！スペース？みたいにできない？」
  「デリートキーは横二つ分欲しいかも」
- Affected features: keyboard
- Affected data: none (`kbFixed()` is built from `LETTERS`, stored nowhere)
- Affected docs: PAID_FEATURES.md
- Implementation status: implemented

### Decision
- Date: 2026-08-11
- Area: Letters and sounds
- Decision: A letter comes first and its sound follows from it. Choosing a
  sound is a paid capability; on free the letter's own reading is used.
- Reason: 「文字ベースに音が付随だからね？音から選択するのは課金機能」
  「音は選択できない。だってアルファベットには既存の音があるんだから」
- Affected features: letters, word sheet, sound
- Affected data: `snd` slice
- Affected docs: PAID_FEATURES.md (`snd`), DATA_MODEL.md
- Implementation status: implemented

### Decision
- Date: 2026-08-11
- Area: The in-app keyboard
- Decision: Typing inside Lingua on a Lingua keyboard is removed. The system
  keyboard extension is the keyboard. The editor that *builds* a layout stays.
- Reason: 「アプリ内キーボードいらないでしょ。アップル拡張だけ。」
- Affected features: keyboard
- Affected data: `kb` slice kept
- Affected docs: FEATURES.md § closed on purpose
- Implementation status: implemented

### Decision
- Date: earlier
- Area: The glyph editor
- Decision: A line drawn straight along the dots is not corrected. Diagonals
  are corrected to diagonals; Round is for curves.
- Reason: 「斜めは斜めに補正して欲しいけど、まっすぐ引いた線が勝手に斜めになる補正が
  やめて欲しい」「点線上にそのまま引いた一筆書きが勝手に補正されるのをやめて欲しい」
- Affected features: glyph editor
- Affected data: `letters` slice (stroke points)
- Affected docs: —
- Implementation status: implemented

### Decision
- Date: earlier
- Area: Navigation
- Decision: Pages, not sheets sliding up from the bottom. One back button.
- Reason: 「基本ページ遷移型にしてくれ」「普通に1個前のページに必ず戻る戻るボタン
  以外いらない」
- Affected features: shell
- Affected data: none
- Affected docs: —
- Implementation status: implemented

### Decision
- Date: 2026-08-13
- Area: The composer
- Decision: The one plus that added a photograph becomes **three buttons**:
  the camera, the library, and the microphone.
- Reason: 「投稿の時にphotoボタンやめて。📷 ライブラリ マイクボタンにして」
- Affected features: post composer
- Affected data: none by itself
- Affected docs: DATA_MODEL (with the voice, below)
- Implementation status: implemented

### Decision
- Date: 2026-08-13
- Area: The voice on a post
- Decision: Up to **thirty seconds** of the person's own voice on a post.
  It is written as a **file in Documents**, never into `localStorage`, and
  the post carries the file's name. Built **to the end** — the recorder, the
  file, and playing one back — rather than a button with nothing behind it.
- Reason: 「あとポストに声入れれるようにしたい30秒くらい。発音とかやれるやん？」
  「ファイルに出す」 and, asked how far to build it now, 「録音まで作る」.
- Affected features: post composer, timeline
- Affected data: **new** — `post.vo = {f, ms}`, and `Documents/Voices/` on the
  phone. Nothing existing changes shape
- Affected docs: DATA_MODEL, DATA_SAFETY, CHANGELOG, CLAUDE.md
- Implementation status: implemented in the app; **not device confirmed** —
  the microphone, `NSMicrophoneUsageDescription` and the two new Swift calls
  have never run on a phone

### Decision
- Date: 2026-08-13
- Area: A post's ... menu
- Decision: Three things — delete, pin, **edit**. Editing puts right the
  **line and the meaning**, and those two only: the photographs and the voice
  stay as they were. An edited post **says so**, beside the time.
- Reason: 「あとツイートの点点々、デリートピン留めエディットにして」, and asked
  what edit reaches, 「文と意味だけ」; asked whether to show it, 「出す」.
- Affected features: timeline
- Affected data: `post.ln`, `post.ink`, `post.mn`, `post.tr` are overwritten
  on the post being edited; `post.ed` is new. The `ink` is re-cut with the
  alphabet as it stands at that moment, which is the one place a post's
  shapes are not the shapes it was born with — a changed line wearing the old
  shapes is the old line
- Affected docs: DATA_MODEL, CHANGELOG
- Implementation status: implemented

### Decision
- Date: 2026-08-13
- Area: A post's ... menu
- Decision: The menu opens **beside the post**, not as a page you go to.
- Reason: 「・・・ひらいたら画面遷移じゃなくて投稿の横にメニュー出てきて欲しい」
- **This narrows an earlier decision in this log** ("Pages, not sheets sliding
  up from the bottom. One back button.") and does not overturn it: navigation
  is still pages, and this is three words about the post already in front of
  you rather than somewhere to go. Nothing else in the app changes.
- Affected features: timeline
- Affected data: none. `PMENU` is where you are standing, and `viewReset()`
  forgets it
- Affected docs: —
- Implementation status: implemented

### Decision
- Date: 2026-08-13
- Area: A deleted reply
- Decision: Deleting a reply takes its one back off the post it answered.
- Reason: 「リプライ消したのに数字1のまま」
- Affected features: timeline
- Affected data: `post.re` on the post that was replied to. Floored at zero —
  a count that is already wrong is not put right by being made negative
- Affected docs: CHANGELOG
- Implementation status: implemented

### Decision
- Date: 2026-08-13
- Area: What a post has to have
- Decision: A post does not need a line. A **photograph on its own** is a
  post, and so is a **voice on its own**. Nothing at all is still nothing.
- Reason: 「文字無しでもポストできるようにできない？」
- Affected features: post composer, timeline
- Affected data: `post.ln` may be `''`. Nothing changes shape; every post
  written before this has a line
- Affected docs: DATA_MODEL, CHANGELOG
- Implementation status: implemented

### Decision
- Date: 2026-08-13
- Area: The profile, and a language's own page
- Decision: The small `Lingua` tag beside the handle becomes a **row** between
  the bio and the follow counts — the language's name and a chevron — and it
  opens a page **about that language**. On it: what the language is for, where
  it is spoken, who speaks it, the note, the letters that have actually been
  drawn, and three numbers (words, letters, kind of writing). Not the words —
  a dictionary is a chapter, not a summary. A setting makes it public or
  private, and **public is the default**.
- Reason: 「フォローと自己紹介の間にその言語について簡単にまとめてあるページ欲しい
  な。linguaパッチの代わり。Lingua > みたいになっててそこでその人が作ってるの
  見れる」「これは設定から公開非公開もかのう」, and asked what goes on it,
  「世界＋文字＋数」; asked for the default, 「公開」.
- Affected features: profile, the World editor (which keeps its door, now on
  the new page rather than on the tag)
- Affected data: `world().hide` in the `wld` slice — the LANGUAGE's, not the
  person's, because whether this language has a page is about this language.
  Absent means public, so the default is the absence of a field and no
  migration can get it wrong
- Affected docs: DATA_MODEL, CHANGELOG
- Implementation status: implemented. Nothing off this phone can read the flag
  yet — there is one profile here and it is this person's — so what the switch
  does today is take the row off their own profile and say so

### Decision
- Date: 2026-08-13
- Area: Fields you type a line into
- Decision: A field is in **ordinary letters**, never the person's own
  alphabet. What is displayed stays in the drawn letters.
- Reason: 「普通に全部自作文字にされるの意味わからん。自分が打ちたい時にこれなんて
  読むんだになったら本末転倒やろ」 — somebody drawing their first eight letters
  cannot read them yet; that is what drawing them is for.
- Affected features: the grammar stage's example, a word's example, spelling,
  the post composer
- Affected data: none
- Affected docs: CHANGELOG
- Implementation status: implemented in `lnField()`, which is the one place a
  line is typed. The composer's preview now runs at every direction rather
  than only the vertical ones, so nothing was lost — it moved to the half of
  the screen that is for looking

### Decision
- Date: 2026-08-13
- Area: The timeline and replies
- Decision: A row to write in at the top of the timeline, and a reply shows
  the post it is answering.
- Reason: 「ホームからもツイートできるように」「リプライする時は前のツイートが何か
  見れるように」
- Affected features: timeline, composer
- Affected data: none
- Affected docs: CHANGELOG
- Implementation status: implemented. The round `+` stays — it is reported as
  invisible on build 57 and could not be reproduced here, so the row is a
  second entrance rather than a replacement

### Decision
- Date: 2026-08-20
- Area: A word's derived words
- Decision: A derived word carries **which form of its parent it is**, chosen
  from a fixed list of labels the app supplies. The language does not declare
  a paradigm, nothing obliges a word to have every form or any of them, and a
  form built out of nothing like its parent is still just a word with a label.
  The nine: 過去形 · 未来形 · 進行形 · 完了形 · 複数形 · 否定形 · 命令形 ·
  受身形, and no label.
- Reason: 「過去形とか未来形とか現在進行形みたいなの形変えたのも一括で見れたほう
  が良くない？」「ラベルはこっちで用意すればいいのでは」「型決めても英語みたいに
  変わってる可能性もあるやん」
- Affected features: the dictionary, the word sheet, the word read
- Affected data: `fm` on a word — a code, never a label, deleted when empty and
  when the parent goes
- Affected docs: CHANGELOG, DATA_MODEL, FEATURES
- Implementation status: implemented. `FM` and `fmLabel()` in
  `www/wordsheet.js`; written by `wdPutExtras()`, which Save and Add both call

### Decision
- Date: 2026-08-20
- Area: A word's related words
- Decision: The labels are two groups — **活用** (an inflection: the same word
  in another shape) and **派生** (a derivation: a different word built out of
  it), twelve each — and **a language may write its own in either group**. A
  label somebody writes is kept as typed and never translated. The whole family
  is shown from every word in it, not only from the parent. Every label we
  supply carries a small circled `?` beside the word itself, and it says one
  line and one example as a pop rather than opening a page.
- Reason: 「tirorがウォッチャーになるのって何系の派生？」「活用と派生も好きに保存
  できたらいいよね」「保存した瞬間そっちの単語でも活用とか見れる」「これ全部横に？
  つけてどういう役割なのかたとえば英語とか言語で説明できるようにして」「⭕️？にして
  少し小さめでポップとして出してほしい。で、文字の横に置いて」
- Affected features: the dictionary, the word sheet, the word read
- Affected data: `fm` on a word — a code, or `i~`/`d~` and the person's own
  words, stored on the word and in no list of its own
- Affected docs: CHANGELOG, DATA_MODEL, FEATURES
- Implementation status: implemented. `FM_INF` / `FM_DER` / `fmLabel()` /
  `fmMine()` and the `fm` screen in `www/wordsheet.js`
- Free: yes. It is text somebody typed, not a capability

### Decision
- Date: 2026-08-23
- Area: What a subscription costs in each country
- Decision: **The base is the USD prices already decided** — Plus 4.99 / 49.99,
  Pro 9.99 / 99.99 — and **each country is then rounded to a clean number by
  hand** in App Store Connect. Not all 175: the storefronts that sell, and the
  rest left as Apple generated them.
- Reason: 「基準はさっき値段決めたやろ 各国がキリ良くしたい。」
- Affected features: the plans screen; nothing else
- Affected data: none. A price is not stored anywhere in this app
- Affected docs: apple.md § 4, CHANGELOG, STATE
- Implementation status: nothing to implement, and that is the point. The
  screen shows `displayPrice` as the App Store gives it and works the yearly
  saving out from the two amounts, so **a price changed in the dashboard needs
  no change in the app** — and rounding each country separately, which makes
  the saving differ by country, is exactly the case that would have been wrong
  under the old typed `17`.

### Decision
- Date: 2026-08-23
- Area: The picture on the plans screen
- Decision: **This phone's own keyboard**, wearing the letters this person
  drew — the applied board, so on free it is the QWERTY with the drawn letters
  substituted in. A picture and not a button.
- Reason: 「なんかテキストだけだと味気ないな」「絵なんでもいいよ 君のキーボード
  とか載せる？」
- Affected features: the plans screen
- Affected data: none
- Affected docs: CHANGELOG
- Implementation status: implemented. `kbShotHTML(kbOf().lay)` in `vPlans()`,
  which is the same picture the keyboard list is drawn with — no second
  function that draws a keyboard — and `.plkb` in `www/index.html`, which is
  room and nothing else
- Free: yes. It is a picture of what the free plan already gives

## What is the owner's to decide

Research it, lay out the options and what the code does today, and **stop**.
Do not pick:

```
  prices, and which plan buys what
  the free / paid boundary
  anything that deletes data, or how long data is kept
  how a sync resolves a conflict
  a change to behaviour a person already relies on
  wording a person will read
  any threshold or number that is a judgement rather than a measurement
```

The form is "if A then this, if B then this, and here is what the code does
now" — not a question with no groundwork under it, and not a decision made
quietly because it seemed obvious.

The one that was on record here — `ai` lifting at Plus and `sug` only at
Studio, the same ceiling asked twice — is **moot and was removed on
2026-08-22**. Studio is out, and `CAN.ai`, `CAN.sug`, `AI_FREE_DAILY`,
`sugLeft()` and `aiSpend()` went with it; the decision log entry dated
2026-08-12 above says so and this line went on contradicting it. The principle
it was an example of stands: **which plan buys a thing is a price, and a price
is not a tool's to decide.**

## What to report when it is done

"Implemented it" is not a report. Every one of these, every time:

```
  files changed, and why each
  what existing behaviour changes
  what existing data is affected
  what is newly stored
  migration:  yes / no, and what it does
  deletion:   yes / no
  the plan:   what it affects
  tested:     what, and how
  NOT tested: what, and why
  device:     needed? done?
  known limits
```

Say "code confirmed" and "device confirmed" as two separate things, and never
let the first stand in for the second.

## Several sessions at once

More than one session may run at a time. Each one opens by reading, in this
order:

```
  1  CLAUDE.md
  2  docs/STATE.md
  3  the docs/ that cover the area
  4  git status
  5  which branch, which commit
  6  what else is in flight, and where
```

and then **declares its scope before touching anything** -- the files it owns
are the leader's to name, not the session's to choose:

```
### Scope
- Goal:
- May change:            files, by name
- May NOT change:        files another session holds, or that are simply out of scope
- Depends on decision:   which entry in the owner decision log
- Tests to run:
```

### How the work moves

The declaration above says what a session may touch. This says how what it
wrote reaches everybody else. Sessions run in separate containers and share
exactly one thing — the remote — so every rule here is about making the work
visible there early enough to be avoided.

```
  1  one session, one branch          claude/<area>, and never anybody else's
  2  fetch before deciding anything   git fetch --all --prune
  3  read what is already there       git log --oneline --all -40
                                      git log --oneline --all -- <file you mean to change>
  4  push the scope FIRST             an empty commit carrying the declaration,
                                      pushed, before the first line of code
  5  push after every commit          a branch nobody can see is a branch
                                      nobody can avoid
  6  never integrate ANOTHER BRANCH   no merge, no rebase, no cherry-pick of
                                      another branch. The leader integrates.
                                      master into your OWN branch is not that,
                                      and is required before you report
  7  the gate is the leader's         see docs/TESTING.md § the gate, rule 2
```

**Step 3 is the collision test and it is mechanical.** If
`git log --all -- <file>` shows a commit on a branch that is not yours and not
the base, another session is in that file. That is the moment to stop and
report — not when the merge fails, which is hours later and after both of you
have written on top of each other.

**Step 4 is what makes step 3 work.** A session that codes for an hour before
pushing is invisible for an hour, and every other session is deciding against
stale information for that hour. The scope declaration is cheap to push and
it is the thing others read.

**Step 6 is absolute about ANOTHER branch.** A session that merges another
branch into its own has produced a diff neither session wrote. The leader --
another session above this one -- integrates, and asks the owner where the
answer is a decision rather than a merge. Report the conflict and stop; do not
resolve it.

**`master` into your own branch is the opposite and is required**
(OWNER DECISION 2026-08-25). `git fetch --all --prune && git merge
origin/master` before you report, every time. It touches nobody else's work --
it is catching up, not integrating -- and it moves the one job that was
actually jamming the pipe. On 2026-08-25 four branches were integrated and four
conflicts came out; **all four came from a branch that had fallen behind** (52,
86 and 456 commits), and **none** from two sessions wanting the same line. One
of them was 456 behind and its four commits were all re-doing work `master` had
already done by another road, so it was dropped rather than merged.

Resolve what comes out of catching up yourself -- it is inside your own branch.
Stop and report only when you genuinely cannot, which is the rare case where
two people did want the same line.

Two more from the same day, for the same reason: **integrate in batches, not
per branch** (one gate run, not four -- proving the same green four times is
the thing the owner's gate rules already forbid), and **a session's last act is
to push the Scope of its next piece**, so finishing does not mean queueing
behind the leader.

**Who is who.** The owner decides what the app does and confirms it on a
phone. The leader names what each session owns, integrates, and runs the whole
gate. A session does none of those three. → `docs/SESSIONS.md`

### What is forbidden, by name

Every one of these has a reasonable-sounding form, which is why they are listed
rather than left to judgement:

```
  ✗ "while I'm in here, I'll tidy this up"
  ✗ "this could be cleaner, so I fixed it"
  ✗ "it's related, so I changed the behaviour too"
  ✗ "we'll probably need this later, so I added it"
  ✗ "the existing code looked wrong, so I corrected it"
```

Each of those is a separate task. Write it into `docs/BACKLOG.md` and carry on
with the one you were given.

### When two sessions collide

If work turns out to overlap another session's: **STOP.** Report

```
  my scope
  their scope
  files in common
  functions in common
  where a conflict is likely
```

and do not merge the two yourself. Two sessions each half-applying the other's
intent produces a diff nobody wrote and nobody can review.

Do not guess at what another session meant and write over it. **Do not decide a
spec from reading the code** — the code is what happened, not what was wanted.
If it is unclear, stop and collect the questions rather than picking an answer;
a wrong guess that tests green is the expensive kind.

## What one commit is

These do not share a commit:

```
  a feature
  a bug fix
  a refactor
  a rename
  a UI change
  a data migration
```

Bad:

```
  add the feature + tidy the nearby code + rename two functions + delete
  the old path
```

Good:

```
  A  the feature
  B  the bug fix it turned out to need
  C  the refactor, on its own
  D  the renames, on their own
```

**If a refactor changes behaviour, it is not a refactor.** Say so before doing
it, and it becomes a decision, not a cleanup.

## Done

"I wrote the code" is not done. Done is:

```
[ ] the spec is confirmed, and the decision it depends on is in the log
[ ] the blast radius is known
[ ] the docs that apply are updated
[ ] implemented
[ ] npm test green
[ ] the regression test for this specific bug is green
[ ] the bug was PUT BACK and the test was watched going red
[ ] node --check, and any static check that applies
[ ] device verification, if docs/TESTING.md § device says so
[ ] the owner has confirmed
[ ] docs/CHANGELOG.md updated
[ ] mergeable
```

and every report separates these three, always, without exception:

```
  CODE CONFIRMED      the checks are green here
  DEVICE CONFIRMED    somebody ran it on a real iPhone
  OWNER CONFIRMED     the owner looked and said yes
```

None of the three implies another.
