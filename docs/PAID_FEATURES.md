# What money buys

## プランは絶対におかしくしてはいけない

「プランは絶対におかしくしちゃいけないんだって」 OWNER 2026-09-02。買ったものが
自分で無料に戻った日に言われた。**この節が他の全部より先に来る。**

**規則は一つ。答えが無かったことを、答えとして書かない。**

プランが下がるのは、**下げていいと言われた時だけ**。「読めなかった」「まだ来て
いない」「空だった」は、どれも下げる理由にならない。何も書かず、そこにあるものを
そのままにする。

失った日の原因は二つあり、二つとも同じ形だった。

| どこ | 何が起きたか |
|---|---|
| `LinguaPlan.read()` | 読み取り失敗が空文字。`core.js` が空を見て `free` を Keychain に書いた |
| `LinguaStore.entitledPlan()` | 権利が一つも返らないと `free`。`writeDown()` がそれを書いた |

どちらも「持っていない」と「分からない」が同じ枝だった。CLAUDE.md の一ページ目
に書いてある通りのことが、お金の上で起きた。

**下げていい道は三つしかない。**Apple が自分から言った時
（`Transaction.updates`）、本人が復元を押して `AppStore.sync()` が通った時、
Apple の管理シートから戻った時。それ以外は上げるだけ。**一日甘いのは、払った
ものを取り上げるより軽い。**

### 何が持っているか ── `plan-check`

**両側とも持っている。**一度「StoreKit 側は人が読むだけ」と書いたが、それは
CLAUDE.md が禁じている三番目の規則 ── 何も止めていないのに止まるかのように書い
たもの ── になる。書き直した。

**動かして測る側**（Keychain）。読み取り失敗で一バイトも書かれないこと、本当に
空なら移行の道は今までどおり動くこと、Keychain が持っていればそれが勝つこと。

**読んで形を持つ側**（App Store）。Swift は Linux でコンパイルできず、ゲートは
`.swift` を実行できない。**が、読むことはできる** ── `sides-check` が `post.js`
を、`assets-check` が `project.pbxproj` を読むのと同じ。`LinguaStore.swift` の
`writeDown()` の呼び出しを全部見つけ、**下げていい三つ以外が `mayLower: true` を
渡していたら落ちる。**三つの名前だけが書いてあり、他の道は**探して**いるので、
明日四つ目の道が足されればその日に落ちる。関門が「Keychain が答えた時だけ
比べる」形であることも読む。

どちらも赤を見てある ── `current` に下げる権利を渡すと名指しで落ち、`core.js`
の `PLAN_READ_OK` を外すと 0 of 3 で落ちる。



## 課金で追加したものは、無料になったら全部隠れる ── OWNER 2026-09-01

```
課金で追加した機能は無料になったら全部隠れるって話何回すればわかるの？
```

**一つの規則で、例外はない。**有料のあいだに足したものは、無料に戻ると
**一覧から消える。**払い直せば、そのまま戻る。

```
  保存されているもの   一バイトも動かない。消さない、間引かない、古くしない
  画面に出るもの       無料の枠に収まる分だけ
  払い直したら         全部そのまま戻る
```

無料の枠とは、無料プランがもともと持っている分のこと ── 単語100、文字は
a–z と `!` `?` と基数ぶんの数字、キーボードは固定 QWERTY、文法は最初から
ある段、音は最初からある分。**それを超えて足したものが「課金で追加した
もの」で、それが隠れる。**

**隠すのであって、消すのではない。**この文書の一番上がそれで、そちらが
上位にある: 五百の単語は有料でなくなった後も五百のまま、どのスライスも
一バイトも動いていない。

### 形は二つだけ

```
  先頭だけ見える  単語・文字・段・言語・DL言語   隠すだけ。消さない
  効き目が止まる  書記・向き                    見た目なので隠すも何もない
```

**どれが何で切るかは § When a plan ends の表**にあります。三つ目の形を作らない
でください ── 一つずつは正しく動くので、増えても赤くなりません。

And, more importantly, what it may never touch.

## The rule above all the others

**A plan decides what a person may DO. It decides nothing about what exists.**

**And a plan belongs to the ACCOUNT** 「課金とアカウントとキーボードはアカウント
に結びつく」 OWNER 2026-09-01. Not to a phone, and **not to the settings** — it
follows the person to whatever phone they sign in on, the way everything else
of theirs does. **That is built**: the `plan` table in `supabase/schema.sql`,
sent by `netPlanUp()` and read back by `netPlanSync()`, which takes the higher
of the two rungs. `SET.plan` is still the value the app asks, and it is the
copy that works with no signal — the same shape as every other slice.

What is **not** built is anybody checking the receipt. The row holds what the
phone said, so it is where the plan LIVES and is not proof of what was bought;
`docs/FEATURES.md` § 1 is the list.

Forbidden, without exception:

```
  ✗ a backup that only happens if you pay
  ✗ a restore that only happens if you pay
  ✗ data that disappears when a subscription lapses
  ✗ data deleted because of a plan
  ✗ data deleted because the plan could not be checked
```

**"The plan is unknown" and "this person has no data" are not the same thing
and must never share a branch.** A failed entitlement check means *fewer
buttons*, never *fewer words*. If the check fails, fail toward the free plan
and leave every byte where it is.

**The buttons half was turned over by the owner on 2026-08-25, and the words
half was not.** 「だいたい無料で使えないやつは表示させていいよ。課金させる
動線を減らしたくない」「無料はタップすると課金ページに飛ばされる」 A door a
plan has closed is **drawn anyway**, on every plan, and pressing it goes to the
plans screen. Hiding it was costing the one thing a locked door is for: nobody
buys what they cannot see.

So *fewer buttons* is no longer how a closed door looks — but the sentence it
was protecting is untouched and is the one that matters. **Nothing a person
made is hidden, moved or removed by a plan**, and a screen that shows fewer
WORDS on the free plan is still the bug it always was. The two halves were
never the same statement; only one of them was ever absolute.

`capStop()` — the words ceiling met in the middle of typing — is read as NOT
covered by this, and the reason is written on the function: it stopped doing
`go('plans')` because somebody halfway through a word had the screen taken off
them. That is a *metered* ceiling arrived at by accident; this decision is
about a door pressed on purpose. The decision log says to ask the owner if that
reading is wrong.

This is already how it is built and it is worth saying why: the backup list
sits **above** the lock in the settings, not behind it, because charging for
not losing somebody's work means answering, on the day it is lost, whether they
had paid.

## How it is asked

**Three plans, and they are a ladder: Free, Plus, Pro.** `PLAN_ORDER` in
`www/core.js` is those three, cheapest first, and `has(level)` is met by the
plan that names the level and by **every plan above it**. Written as an equals
sign it would give Pro what Plus buys and nothing else — a Pro account quietly
losing the letters it paid for, one tier down.

They were Free, Basic and Plus until 2026-08-23. 「ベーシック、プラスって名前
どう思う？なんかどっちが上かわかりにくくない？」 — Basic reads as the name of a
FREE tier in most apps, so Free and Basic were the confusable pair. `Free <
Plus < Pro` needs nobody told which is which.

| | Free | Plus | Pro |
|---|---|---|---|
| `letters` add / name / delete | — | yes | yes |
| `wsys` a writing system that is not an alphabet | — | yes | yes |
| `snd` choose the sound, not the letter's own | — | yes | yes |
| `kb` a keyboard of your own | 1, the fixed QWERTY | **1 + 3 = 4** | no ceiling |
| `dl` a chapter of somebody else's language | — | **yes** | yes |
| `edit` editing a post you have sent | — | **yes** | yes |
| words | 100 | 1000 | no ceiling — `words` |
| languages on the account | **1** | **1** | **3** |
| how many DL'd languages | **0** | **1** | **3** |
| `gram` `dir` `data` `file` `badge` | — | — | yes |

Six of those ten rows are a DOOR, which is a name in `CAN`, and four are a
NUMBER, which is a function beside `wordCap()`. The four numbers are the ones
this file has had wrong most often, so they are written once, machine-read,
in § The four numbers below.

**The words ceiling is a number, not a door.** `wordCap()` is the one place
that says it — `Infinity` on Pro, a thousand on Plus, `FREE_LIMIT` below
that — and `can('words')` is asked inside it and nowhere else, meaning "no
ceiling at all". Everything that shows or enforces the ceiling asks
`wordCap()`: the dictionary, the banner on the cover, the count in settings,
`capOK()` and `capStop()`.

**The middle rung is on sale.** Its two prices are in all ten `www/i18n`
files (`plan.price.plus`, `plan.price.plus.yr`), its two products are named in
`docs/apple.md` § 4 and in `LinguaStore.plans`, and `PLANS` in `www/core.js`
carries the card. The plans screen sells all three rungs.

What is typed in `www/i18n` is the FALLBACK and only the fallback: `storeCost()`
returns what the App Store answered and `planPrice()` falls back to `t()` only
when it answered nothing — a browser, a screenshot, or a product not yet made
in App Store Connect. When that happens the screen says so, in `storeSay()`,
between the prices and the button that buys.

**`kb` is Plus's, and its number landed in the same commit** — 2026-08-23.
「1,1+3.無制限って言わなかったっけ？」 Free 1, Plus 1 + 3 = 4, Pro no ceiling,
and **counted as a pool across languages** rather than per language: three
languages were nine keyboards while `KB_MAX` was three per language, on a plan
that sells three.

**`dl` is Plus's, and its numbers are the owner's of 2026-09-02.**

```
plusからです
dlはしかもplusは1つproは3つ DL言語とmake言語でそれぞれ別の最大値
                                                     OWNER 2026-09-02
```

**Free 0, Plus 1, Pro 3.** `dlCap()` in `www/core.js` is the number and
`can('dl')` is the door; `dlCount()` counts the languages whose `mine` is
false and `dlStop()` is the refusal. `dl-check` holds all four.

**Free does not download at all**, and that is the same sentence said twice:
「plusからです」, and 「無料はdlさせるなんか話した？　公式アセットのdlは
plusからっていう決定事項あんのになんで聞いてくんの？」

**A DL'd language is counted SEPARATELY from your own**, which is what
「それぞれ別の最大値」 says. Two ceilings and not one: `langCount()` counts
`mine` and has never seen a download, `dlCount()` counts `mine` false and has
never seen a language somebody made. Filling one leaves the other where it was.

`CAN.dl` and `dlCap()` landed together on 2026-09-02, which is the rule `kb`
set: a door opened with no number behind it hands Plus whatever the code
happened to allow, and that is neither number the owner said. The caller is
`www/home.js` — `upStop(can('dl'))` and `dlStop()` in front of the download.

**Nothing here may take a language away.** The rule at the head of this file
covers a downloaded language the same as any other: a plan that lapses means
fewer buttons — no new download, and the door drawn anyway — and never fewer
languages. Somebody who downloaded three keeps three, sees three, and backs up
three, exactly the way `langCap()`'s ceiling already hides and never deletes.

**The cloud is on every plan, and that is where the money actually goes.**
OWNER DECISION 2026-08-22 「クラウドは全員で」, re-confirmed 2026-08-26 「基本は
全部サーバー管理」. It is not a capability and must not become one: there is no
`can()` anywhere in `www/net.js`, `www/sync.js` or `www/boot.js`, and
`netLangSync()` asks nothing about a plan before it runs. That is correct and
is the rule at the head of this file — a plan decides what may be DONE, and a
language existing is not something anybody does.

`CAN.data`'s comment in `www/core.js` said 「CSV out, **and the cloud**」 and the
cloud half was never true in code: `can('data')` is asked in `www/settings.js`
twice, both about CSV. Corrected 2026-08-26.

**So the bill scales with people, not with payers.** Every account's twelve
slices are `slice` rows — 5.4 KB for a small language, about a megabyte for a
large one (`bkPack()`'s own numbers) — plus the egress of reading them back on
every launch. `docs/FEATURES.md` § 2 carried 「deferred until Supabase $25 is
worth paying」 as the reason nothing was built; the decision overrode the
deferral and **the cost did not change**. Nobody has priced it against the four
subscription products (2026-08-14), and **nobody here should**: what a plan
costs and where the free/paid line sits are the owner's.

### How many people a plan holds, and what actually decides it

Asked 2026-08-26: 「proプランでも何人くらい囲える？」

**The number is not about how many sign up. It is about how many OPEN the app,
and what each opening downloads.** `supabase/setup.md` § 6 already carries the
table and it is the one to keep:

| 毎日開く人 | 月の通信 | |
|---|---|---|
| 500 | ~15 GB | 余裕 |
| 2,000 | ~60 GB | 余裕 |
| **8,000** | **~240 GB** | **250 GB に当たる** |
| 20,000 | ~600 GB | 超過 +$32/月 |

Pro is 8 GB of database, 100 GB of files and **250 GB of egress a month**, and
$0.09/GB after. Egress runs out first, long before storage does — the database
is the one that would hold a hundred thousand languages (5.4 KB packed, a
megabyte for a large one) and 8 GB does not run out on words.

**That table's one assumption is thumbnails, and it holds — checked
2026-08-26.** `POST_THUMB=300` in `www/post.js` and `pt` on the post: the
timeline draws the 300px copy and the full picture is fetched only when
somebody taps it. Without that the table is **ten times worse** — 8,000 becomes
800 — so anything that puts a full-size picture in a feed row is not a
performance question, it is the plan.

**What 「常に同期」 does and does not mean, settled 2026-08-26:** 「タイムライン
は開くたび / 言語はそういうわけじゃない」. **The two halves are on different
clocks and only one of them is per-open.**

**This file said the opposite yesterday and it was wrong.** It read 「常に同期」
as covering the language too, and warned that re-reading every slice's body on
every sync would make the language four times the cost of the whole timeline.
The arithmetic was right; **the premise was not.** The language is not on the
per-open clock, so the table above stands at 8,000 and the language is not what
threatens it.

**The timeline half is the one to watch, and the code does MORE than 「開くたび」.**
`vFeed()` calls `snsPull()` **every time it runs** — its own comment in
`www/post.js` says so — and `render()` rebuilds the whole screen on any state
change. So a like, a follow, a toast, a tab switch back: each is another
`netFeed()`, which is `NET_PAGE=50` posts with their whole `body` on it,
**`ink` included** — the frozen stroke shapes, which is the biggest field a
post has. `snsPulling` only stops a second ask while one is still out; it does
not stop the next one.

The photographs are the cheap half of that, and deliberately: they are Storage
URLs on the post rather than bytes in the JSON, so the webview caches them and
a re-render redraws the same picture without asking for it again. **It is the
JSON that repeats.**

So the honest form of the number: **8,000 daily openers if a visit is a pull,
and fewer in proportion to how many times a visit re-renders.** Nobody has
measured that multiplier on a device. It is the single cheapest thing to
measure and the single most likely reason the table is optimistic.

**None of this is a decision to make here.** Not the interval, not the tier,
not the price. What this section is for is that the person who implements
「開くたび」 knows the app currently does it per RENDER, and that the expensive
part of a pull is the fifty bodies, not the pictures.

**And for the language half, when it is written:** `no` is a version counter
that goes up on every write (`netSlicePut`, and `supabase/schema.sql` says so),
and `netSlices()` currently asks `select=kind,body,no` — every body, every
time. Asking `select=kind,no` first and fetching bodies only for the slices
whose number moved makes a sync that found nothing cost almost nothing. That
matters less now that the language is off the per-open clock, but it is the
difference between a cheap sync and an expensive one whenever it does run.

**Answered 2026-08-26: 「supabaseのエンタープライズで対応する予定」.** The bill
scaling with people rather than payers is not a reason to narrow the scope, and
proposals to narrow it on cost grounds are **finished** — the owner has priced
the decision and taken it. The multiplier is settled too: 「常に同期」, not the
once-on-launch `www/boot.js` does today, so the number goes UP from whatever it
is now.

What is still true and still this file's job to say: **none of it may reach
anybody's data.** An enterprise plan that lapses, a bill that goes unpaid, a
project that gets suspended — each of those is the entitlement check failing,
and the rule at the head of this file already says what happens then: fewer
buttons, never fewer words, and every byte where it was. The phone holds a
working copy of every slice and `bkPack()` writes the file; a server that
stops answering is a person who can still open their language.

`CAN.kb` is the DOOR — may this person lay a keyboard out at all — and
`kbCap()` in `core.js` is the number, beside `wordCap()` and for the same
reason: a constant was one fact while there was one paid tier and is three
facts now. `kbCount()` in `keyboard.js` is what it is compared against, and it
reads every language rather than the open one. **The door and its number are
one statement and did not land apart**: opening `can('kb')` while `KB_MAX`
still handed out three would have given Plus a number the owner never said.
`plan-check` holds all seven claims, and three of them were watched failing
with the bug put back.

`CAN` in `www/core.js` names every capability, and `can('x')` is the only way
to ask. `has()` names a *plan* and is `core.js`'s alone. `tools/dead-check.mjs`
refuses a capability nothing asks for (a price with nothing behind it), a
`can('x')` in no plan (a locked door nobody can open, with nothing saying so),
a `can()` given anything but a literal, and a `has()` anywhere else.

| capability | level | what it opens |
|---|---|---|
| `letters` | plus | adding, naming and deleting a letter |
| `wsys` | plus | a writing system that is not an alphabet |
| `kb` | plus | a keyboard of your own instead of the fixed QWERTY |
| `dl` | plus | taking a chapter of somebody else's language. How many is `dlCap()` |
| `snd` | plus | choosing a sound, rather than taking the letter's own |
| `edit` | plus | editing a post you have already sent |
| `words` | pro | no ceiling on the dictionary at all. The ceiling itself is `wordCap()` |
| `data` | pro | CSV out |
| `file` | pro | a list brought in as a file rather than a paste, **and the sheet** (ch 26) |
| `badge` | pro | the mark beside your name |
| `gram` | pro | a grammar stage of your own, past the fifteen |
| `dir` | pro | choosing which way the language is written. **Reading one is free** |

**Read the number off `CAN` rather than off this line.** `npm run dead` prints
what it counted on every run — "what money buys: N capabilities in CAN" — and
`tools/paid-check.mjs` fails if this table and `CAN` stop agreeing on a name or
a level. Nothing else holds this table, so a row edited on its own is a price
the app does not charge.

`words` is the one that reads backwards, and it is right: `can('words')` means
**no ceiling at all**, so it is Pro. Plus's thousand is a NUMBER and lives in
`wordCap()`, which asks `can('words')` once and `has('plus')` after it.

`file` is the sheet's gate as well as the paste's — `shInFileHTML()` and
`shTakeIn()` in `www/sheet.js` both ask it. That puts chapter 26 on Pro, which
is OWNER DECISION 2026-08-23, and it is why there is no separate `write`.

`dir` is the one that gates half a thing, and the half it does not gate is the
important one. A language can run left→right, right→left, or down the page
with its columns going either way; a post carries the direction it was
written in, and **every plan is shown it**. A free account that could not read
a right-to-left post would be reading a lie about somebody else's language,
which is the card bug in another costume. What Pro buys is choosing one.
Nothing anywhere asks `can('dir')` before drawing — it is asked in
`setScriptDir()` and on the screen that offers the choice, and nowhere else.

## The four numbers

Four of the rows in the ladder table are a ceiling rather than a door, and each
is a function beside `wordCap()` in `www/core.js`. The constants are written
out once, here, and `tools/paid-check.mjs` reads them out of `core.js` and
fails when this block and that file disagree.

```
FREE_LIMIT   100     the free dictionary
PLUS_LIMIT   1000    Plus's dictionary. Pro has none -- that is can('words')
FREE_KB      1       the fixed QWERTY, counted as one
PLUS_KB      4       1 + 3. Pro has none
FREE_LANGS   1       languages of your own. Plus is the same number
PRO_LANGS    3
PLUS_DL      1       languages downloaded, which is a second ceiling
PRO_DL       3
```

`kbCount()` in `www/keyboard.js`, `langCount()` and `dlCount()` in `core.js`
are what those are compared against, and all three count **across languages**:
the ceiling is on the ACCOUNT, not on each language and not on a phone —
「は？端末の話なんかしてねえだろ」 OWNER 2026-09-03. `langOwned()` is where
the account is asked.

**And the ceilings are on the plans screen**, because a number that is sold and
never said is a number nobody is buying: `plan.pro.6` `plan.pro.7`
`plan.plus.6` carry the three of them, as names rather than sentences. Free's
hundred words and Plus's thousand were already there.

## When a plan ends

**The app goes back to the shape the free plan has. Nothing a person made is
deleted.** Those are two halves of one sentence and neither may be dropped.

| | on free again | what shortens it |
|---|---|---|
| the dictionary | **lists the first 100 words**, in the order they were made | `wordsSeen()`, `www/words.js` |
| the alphabet | **lists the free thirty-eight** — a–z, `!`, `?`, a digit per value of the base | `ltSeen()`, `www/sound.js` |
| a stage of your own | **is not on the list**; the fifteen are | `stHidden()`, `www/phases.js` |
| languages of your own | **lists the first one**, and the open one is always on it | `langsSeen()`, `www/home.js` |
| languages downloaded | **lists none** | `langsSeen()` with `dlCap()` |
| the writing system | an alphabet | `wsys()`, `www/wsys.js` |
| the keyboard | the fixed QWERTY, in the app and on the phone | `kbOf()`, `www/keyboard.js` |
| the direction | left→right | `setScriptDir()`, `www/wsys.js` |
| CSV, file import, the sheet, the badge | gone, as they always were on free | `can()` on the press |

**The first five rows are one shape and it is `wordsSeen()`'s.** 「減った時は
隠すだけね」「だって単語でも文法でも同じようにやったじゃん」 OWNER 2026-09-02.
The list is cut; nothing else is. There was a day when the alphabet, the
stages and the sounds showed everything and merely refused to grow, while the
words and the keyboards dropped out of the list — four screens with two
answers to one question, each correct on its own. They are the one answer now.

Every word, every letter, every keyboard layout, every stage, every language
and every conversation is still in storage, still packed by `bkPack()`, still
in the file in Documents, and still there in full the moment the plan comes
back. The app reads the **whole** dictionary for itself — a post, a gloss, a
spelling, an example — and only the list on the dictionary screen is short.

Because "shorter list" and "my work is gone" look identical from the outside,
the app says the difference out loud, twice:

- **once, on the day it happens**, in a sheet — `capLapse()` in `core.js`
  notices the plan has changed since the last launch and `openCapLapse()` says
  it. 「バックアップには保存されてるよーって一回出せばok」
- **every time**, at the foot of the dictionary: how many words are not listed.

`backup-check` holds the half that matters: on the free plan, past the ceiling,
`findWord()` still finds a word that is not listed and `bkPack()` still carries
every one of them.

Why this and not "keep everything working, lock only the buttons": a language
is built once. A plan that kept working after the money stopped would be paid
for a month and then never again. 「a にしたら最初の1ヶ月で作りきったらそのあと
課金されねえだろ」

There used to be a fourth plan, Studio, and it sold the hosted model — the
conversation, and word suggestions with no daily limit. There is no hosted
model: `AI_SEAM` in `www/glyph.js` marks where one would join and nothing joins
it. A tier whose headline is a thing the app cannot do is the app lying to
somebody who is about to pay, so Studio is out until the seam has something
behind it, and what it opened went with it.

```
  free    draw your own letters. 100 words. One language
  plus    build it yourself. 1000 words. Four keyboards. One download
  pro     no ceiling on the words or the keyboards. Three languages,
          three downloads, the grammar, the direction, the file roads
```

Neither paid rung is given fewer than the one below it of anything — "I paid
and it got smaller" reads as a bug whatever the reason. That is `has()` being a
ladder rather than three equals signs, and `plan-check` holds it: Pro meets
Plus's rung, Plus does not meet Pro's, and free meets neither.

## What the free plan is

One sentence: **your own shapes for a–z and 0–9.** `ltStart` puts thirty-eight
letters there — a to z, `!`, `?`, and a digit for every value the base has —
and nothing on the free plan adds, deletes or renames one. Drawing on them is
the whole of it.

That is not a restriction bolted on; it is what makes the rest possible.
Because the letters are exactly a–z and their names cannot change, the keyboard
can be a QWERTY with the drawn letters substituted in, built from `LETTERS`
every time it is shown, stored nowhere, with nothing to set.

Four places say it and they say four different things: `ltStart` in
`letters.js`, `kbOf` in `keyboard.js`, `wsys()` in `wsys.js`, and the screens.

## The four that must never share a branch

```
  the plan could not be determined
  the plan is free
  this person has no data
  this person's data is damaged
```

Four different situations with four different right answers. Written as one
condition — `if (!paid) { … }` — they become one wrong answer, and the wrong
answer is the one that costs somebody their language. The first means *try
again later, free plan for now, touch nothing*. The third is a new install.
The fourth is what a restore is for.

## What has to be on the screen a price is on

**App Store Review Guideline 3.1.2.** An auto-renewing subscription may not be
offered without, next to what it costs:

```
  the length of a term, and what that term costs
  a sentence saying it renews by itself until somebody cancels
  working links to the terms of use and the privacy policy
```

None of that has a failure anything here can see on its own. The screen
renders, every check is green, it works on a phone — and the build is refused,
by a person, days later, with the whole release behind it. Until 2026-09-01
nothing in `www/i18n` said a word about renewal in any of the ten languages;
what was there was `set.terms` and `set.privacy`, which are two link captions
in the account room.

Where each of the three lives, and none of them is new:

| | where it comes from |
|---|---|
| the term and its price | the two `.btn.plterm` buttons — `plan.per.mo` / `plan.per.yr` beside `storeCost()`, which is what the App Store charges in that person's currency |
| the renewal sentence | `plan.renew`, ten languages, drawn by `planTerms()` in `www/settings.js` directly under the price rail |
| the two links | `docRows()` — `DOC_TERMS` and `DOC_PRIVACY`, the same two published pages the account room links to |

**The price is not repeated in the sentence and `plan.renew` carries no `{0}`.**
What somebody is charged is Apple's fact and arrives as `displayPrice`; a price
built into a translated string is a number ten files would have to go on
agreeing about. `www/store.js` is at length about why there is only ever one.

**There is no third document.** 「出さない。」 OWNER 2026-08-26, about the
特定商取引法 notice: the App Store's seller is Apple, so the purchase contract
and the refunds are Apple's, and App Store Connect asks only for the privacy
policy URL. Nothing here may invent a URL either — the two constants are the
published pages, and one copy of a contract is the whole point of them.

**This is the one exception to 「アプリ内に説明書くの禁止」 and it is not a
crack in it.** It is written because Apple refuses the build without it, so it
is the minimum the guideline asks for and not one word more: it does not say
what a plan is good for, what somebody would get, or why a year beats a month.
The five lines on each plan page already say what is bought.

`tools/term-check.mjs` — `npm run term` — is what holds all of it, and it holds
the exception too: the strings allowed to appear in the disclosure are that one
sentence and the two link captions, so a line added there fails rather than
ships. It reads the real DOM of the real screen — where the block sits relative
to the prices and the buttons, what the anchors would actually **open** (the
resolved href, not the attribute: a relative path resolves to `file://` on a
phone and is a broken link to a reviewer), and the **computed** border and
corner, so a rule added against these classes in `www/index.html` fails here
even though `box-check` reads the stylesheet and this branch does not hold it.

Six failures were watched before any of it was believed.

## Adding a paid feature

Answer all ten before the code:

```
 1  what a free user can do here
 2  what a paid user gets in addition
 3  can any existing data disappear because of the plan?   (it may not)
 4  what happens when the plan check FAILS
 5  what happens offline
 6  what happens when a purchase cannot be restored
 7  what does it do when the App Store answers late, or not at all?
 8  what existing users see the day it ships
 9  is a migration needed?
10  after a subscription ends, what is kept?               (all of it)
```

Then write this down:

```
Feature:
Free:            what the free plan still does here
Paid:            what the plan opens, and which can() name
Capability:      the new entry in CAN, and its level
Data:            what is stored, and where
Downgrade:       what happens when the plan ends
                 — and the answer to "is any data removed?" is NO
Check fails:     what happens when the plan cannot be determined
                 — and the answer is: free plan, all data intact
Offline:         what happens with no network
```

Then: add it to `CAN`, ask it with `can()`, and add a `halfDone` entry in
`tools/fixture.mjs` that flips `SET.plan` and puts it back — otherwise
`act-check` reports the new screen's buttons as an entry no screen names, which
is true and is not what you meant.

## What holds all of this

`tools/plan-check.mjs` — `npm run plan`. **Count the `say(` lines there rather
than trusting a number here**, which has been stale once already; it is over a
hundred and fifty. The sentence they are all about is the one at the head of
this file: **a plan decides what may be DONE and nothing about what exists.**

`tools/paid-check.mjs` is the second one, and it needs no browser. It holds
this FILE against `www/core.js`: the capability table above names exactly the
capabilities `CAN` has, at exactly the levels `CAN` gives them, and § The four
numbers carries exactly the constants `core.js` declares. **Everything in this
file is a claim about the code**, and those two tables are the claims a session
acts on, so they are the two that are held. The rest is held by a person
reading it.

`dead-check` already holds the SHAPE of the table — every capability in `CAN`
asked for by name, every `can()` naming one that exists, `has()` core.js's
alone. What it cannot ask is what happens to somebody's WORDS when the answer
changes, and that is this: five hundred words made on the paid plan, the plan
ended, and then the list is a hundred while the language is still five hundred
and **not one byte of any slice has moved**. Also that no plan at all reads as
free; that any plan which is not the word `plus` buys nothing (`garbage`,
`PLUS`, `studio`); that a backup written on the free plan holds every slice the
paid one does; that the ceiling refuses without taking the screen off anybody;
that the plan is in the settings file in a browser and NOT in it on a phone,
where the Keychain has it; and that a plan ending is said once, not once per
render, and touches nothing.

Six of those were watched failing, with three real bugs put back: a list that
trims the thing it is listing, a slice quietly left out of a free plan's
backup, and the ceiling putting somebody on a price list mid-word.

## What the App Store is wired to

**Both halves are in.** `ios/App/App/LinguaStore.swift` has `products`, `buy`,
`restore`, `current` and `manage`, refuses an `.unverified` transaction,
finishes what it consumes and watches `Transaction.updates` for a renewal that
arrives while the app is shut; it writes the answer through
`LinguaPlanPlugin.set()`. **`www/store.js` is the one window onto it** — the
way `net.js` is the one window onto the server — and `setPlan()` in
`www/settings.js` is `storeBuy()`'s only caller. `PLAN_BUY` is `true`.

**In a browser there is no App Store**, so `storeOn()` is false and the plans
screen goes on setting the plan by hand there. That is how every check walks
it, how every screenshot is taken, and how a tier is tried on.

The four subscriptions are configured in App Store Connect and are described in
`docs/apple.md` § 4.

Where the plan is kept is the Keychain, not the settings file. See
`ios/App/App/LinguaPlan.swift` for what that closes and what it leaves open, and
case 6 of `tools/migrate-check.mjs` for the two things it has to keep meaning.

## Not built yet

**The receipt is not verified anywhere.** The plan reaches the account — the
`plan` table — but what it carries is what the phone said, and a jailbroken
phone can say anything. Nothing asks Apple. `CAN` is which buttons to show;
**it is not a security check and must never be relied on as one.**
`docs/FEATURES.md` § 1 has what is left.

**The plans screen does not say what plan is running, or until when.** The buy
button is correctly not drawn for the rung in force or one below it
(`plHave()`, 2026-09-03), and what should stand where it was has not been
written. `claude/plannow` has it.

When receipts do arrive, the rule above is the first thing to hold: a receipt
that fails to validate, a network that is down, a sandbox that answers wrong —
each of those makes the app the free plan for the moment, and none of them
touches a single slice.
