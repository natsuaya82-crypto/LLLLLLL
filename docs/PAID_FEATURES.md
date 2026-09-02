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

### 揃っていなかったもの（2026-09-01 に測った）

一箇所ずつ別の日に書かれて、四通りに割れていた:

```
  ① 全部見えて増やせない      文字・文法・音     ← 直す
  ② 先頭だけ見えて増やせない   単語              ← これが正しい形
  ③ 効き目が止まる            書記・向き        ← 見た目なので隠すも何もない
  ④ 一覧から消える            キーボード        ← これも正しい形
```

**①を②④に揃える。**どれも赤くならなかったのは、一つずつは正しく動くから。
一つの画面で並べて見た人が居なかっただけ。

And, more importantly, what it may never touch.

## The rule above all the others

**A plan decides what a person may DO. It decides nothing about what exists.**

**And a plan belongs to the ACCOUNT** 「課金とアカウントとキーボードはアカウント
に結びつく」 OWNER 2026-09-01. Not to a phone, and **not to the settings** — it
follows the person to whatever phone they sign in on, the way everything else
of theirs does. `SET.plan` is where the value sits in the code today; that is
the gap between the decision and the code, and `docs/STATE.md` § 3 item 4 is
where it is written down. Nothing in this file describes a plan that lives on a
device.

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
| words | 100 | 1000 | no ceiling |
| `kb` a keyboard of your own | 1, the fixed QWERTY | **1 + 3 = 4** | no ceiling |
| languages on the account | **1** | **1** | **3** |
| `dl` a language taken from the official assets | — | **yes** | yes |
| how many DL'd languages | — | 1 | 2 | 
| `edit` editing a post you have sent | — | **yes** | yes |
| `gram` `dir` `data` `file` `write` `badge` | — | — | yes |

**The words ceiling is a number, not a door.** `wordCap()` is the one place
that says it — `Infinity` on Pro, a thousand on Plus, `FREE_LIMIT` below
that — and `can('words')` is asked inside it and nowhere else, meaning "no
ceiling at all". Everything that shows or enforces the ceiling asks
`wordCap()`: the dictionary, the banner on the cover, the count in settings,
`capOK()` and `capStop()`.

**The middle rung is decided and is not on sale.** Plus's price is in no
language file and no subscription for it exists in App Store Connect, so the
plans screen sells Free and Pro. What is here is the rung: the day a receipt
says `plus`, every door above is already the right way round.

**`kb` is Plus's, and its number landed in the same commit** — 2026-08-23.
「1,1+3.無制限って言わなかったっけ？」 Free 1, Plus 1 + 3 = 4, Pro no ceiling,
and **counted as a pool across languages** rather than per language: three
languages were nine keyboards while `KB_MAX` was three per language, on a plan
that sells three.

**`dl` is Plus's, and its numbers landed 2026-08-27.** 「DLはplusから」 was
always flat and is what the row above says. The count was the owner's next
line and it ended in a question 「proは自分の言語3個+DL言語3個**は？**」 — that
question has now been answered, and **not with the number it guessed**:

```
DL言語は plus 1個 pro 2個。これは自作言語とはまた別   OWNER 2026-08-27
```

**Free does not download at all**, and that was never open — it falls out of
「DLはplusから」, which is this row. Asked again on 2026-08-27 the owner said
so in the plainest terms: 「無料はdlさせるなんか話した？　公式アセットのdlは
plusからっていう決定事項あんのになんで聞いてくんの？」 **It was decided; the
asking was the mistake.** Free 0, Plus 1, Pro 2.

Note Pro is **2 and not the 3 the question floated** — the 「は？」 was a real
question and it came back with a different number. This is exactly why a
「は？」 is not written into `core.js` as a constant while it is still a
question.

What the two numbers already tell us, though, is the shape, and the shape is
not in question: **a DL'd language is counted SEPARATELY from your own.**
「自分の言語+DL言語1個」 is two numbers, not one. `langCount()` counts `mine`
and must go on counting only `mine`; whatever counts downloads is a second
function beside it, not a change to it. That also means the free plan is
untouched: Free has one language and no `dl`, exactly as today.

**`CAN.dl` is not in `CAN` yet, and that is not an oversight.** `dead-check`
refuses a capability nothing asks for, the only screen that would ask
(`www/home.js`'s overview page) is not written, and § Not built yet below
already says what happens to code written ahead of its caller. It goes in with
its first `can('dl')`, the way `kb` went in with `kbCap()`.

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
| `words` | plus | a dictionary past `FREE_LIMIT` (100) |
| `data` | plus | CSV out, and the cloud |
| `file` | plus | a list brought in as a file rather than a paste |
| `letters` | plus | adding, naming and deleting a letter |
| `wsys` | plus | a writing system that is not an alphabet |
| `kb` | plus | a keyboard of your own instead of the fixed QWERTY |
| `snd` | plus | choosing a sound, rather than taking the letter's own |
| `gram` | plus | a grammar stage of your own, past the fifteen |
| `dir` | plus | choosing which way the language is written. **Reading one is free** |
| `edit` | plus | editing a post you have already sent |
| `write` | pro | the sheet — letters written on paper and brought back in (ch 26) |
| `badge` | pro | the mark beside your name |

`dir` is the one that gates half a thing, and the half it does not gate is the
important one. A language can run left→right, right→left, or down the page
with its columns going either way; a post carries the direction it was
written in, and **every plan is shown it**. A free account that could not read
a right-to-left post would be reading a lie about somebody else's language,
which is the card bug in another costume. What Plus buys is choosing one.
Nothing anywhere asks `can('dir')` before drawing — it is asked in
`setScriptDir()` and on the screen that offers the choice, and nowhere else.

## When a plan ends

**The app goes back to the shape the free plan has. Nothing a person made is
deleted.** Those are two halves of one sentence and neither may be dropped.

| | on free again |
|---|---|
| the dictionary | **lists the first 100 words**, in the order they were made |
| the writing system | an alphabet |
| the keyboard | the fixed QWERTY, in the app and on the phone |
| the direction | left→right |
| a stage of your own | stays on the list; cannot be added to or deleted |
| CSV, file import, unmetered layer 3 | gone, as they always were on free |

Every word, every letter, every keyboard layout, every stage and every
conversation is still in storage, still packed by `bkPack()`, still in the file
in Documents, and still there in full the moment the plan comes back. The app
reads the **whole** dictionary for itself — a post, a gloss, a spelling, an
example — and only the list on the dictionary screen is short.
`wordsSeen()` in `www/words.js` is the one place that shortens it.

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

Two plans: `free` and `plus`. Studio comes back with the hosted model. `LANG_MAX` is 1 on every plan and is not
a price — there is no way to make a second language anywhere in the app, so a
plan promising more would be promising a button that does not exist.

There used to be a third plan and it sold the hosted model — the conversation,
and word suggestions with no daily limit. There is no hosted model: `AI_SEAM`
in `www/glyph.js` marks where one would join and nothing joins it. A tier whose
headline is a thing the app cannot do is the app lying to somebody who is about
to pay, so Studio is out until the seam has something behind it, and what it
opened went with it.

**Plus is the tools for building a language yourself** — unlimited words and
letters, the writing systems, the keyboard, CSV, a post read in your own words
— and every one of them runs on this phone for nothing.

```
  free    draw your own letters. 100 words
  plus    build it yourself. No ceiling
```

Plus is not given fewer than Free of anything — "I paid and it got smaller"
reads as a bug
whatever the reason.

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
 7  is this StoreKit, or the hand-set SET.plan we have today?
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

`tools/plan-check.mjs` — `npm run plan`. Twenty-five claims, and the sentence
they are all about is the one at the head of this file: **a plan decides what
may be DONE and nothing about what exists.**

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

## Not built yet

**`CAN.dl` — decided, and deliberately not added.** OWNER DECISION 2026-08-25
(`docs/FEATURE_RULES.md`) puts downloading a language on Plus. The entry is not
in `CAN`, because `dead-check` is right: `CAN.dl` with no `can('dl')` anywhere
fails, and the screen that would ask is in another branch's hands. Adding it
alone would mean weakening the check to keep it green, and the check is the
only thing that makes this table true. It lands with its caller.

**The StoreKit code exists and nothing in `www/` calls it.**
`ios/App/App/LinguaStore.swift` has `products`, `buy`, `restore`, `current` and
`manage`, refuses an `.unverified` transaction, finishes what it consumes and
watches `Transaction.updates` for a renewal that arrives while the app is shut.
It writes the answer through `LinguaPlanPlugin.set()`.

What is missing is the wiring: **`www/store.js`, and the plans screen calling
it**. The plan is still set by hand there — pressing a card is `setPlan(id)`
and nothing asks the App Store anything. It is deliberately not written yet
(「storekitってコードは書いていいよ繋げる作業は後でやる」), and writing it
early would have been worse than not: a function nothing calls is a function
`dead-check` deletes.

The two subscriptions are configured in App Store Connect and are described in
`docs/apple.md`.

Where it is kept is settled, though: the Keychain, not the settings file. See
`ios/App/App/LinguaPlan.swift` for what that closes and what it leaves open, and
case 6 of `tools/migrate-check.mjs` for the two things it has to keep meaning.

When receipts do arrive, the rule above is the first thing to hold: a receipt
that fails to validate, a network that is down, a sandbox that answers wrong —
each of those makes the app the free plan for the moment, and none of them
touches a single slice.
