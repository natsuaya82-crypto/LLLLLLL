# Backlog

Things found and deliberately not done, with why. Nothing here is a bug that
loses somebody's work; everything here is safe to leave. It exists so that
"we know about that" is written down rather than remembered, and so that a
refactor, a feature and a rename never arrive in the same diff.

The order is the order to do them in.

## The plans screen says `$0` in every language

The three things this section used to name are in: **Restore** is a button,
**Plus** has its own card, and **Cancel** opens Apple's own sheet rather than
setting a flag. The prices are the App Store's since 2026-08-23. One thing is
left, and it is wording, which is not a session's to choose.

**Free is not a product, so the App Store cannot be asked**, and
`plan.price.free` is a typed string with a dollar sign in it — `$0` in all ten
languages, standing beside a real price in yen on a Japanese phone. That is
the same fault that made the other prices come from Apple, in the one place
Apple has no answer. What it should say instead — `0`, the word for free, or
nothing at all — is the owner's.

**The subscription disclosure is not on this list.** An app selling an
auto-renewing subscription must say on the purchase screen that it renews
until cancelled, and link to Terms and a privacy policy. Asked on 2026-08-23;
the owner says it is covered elsewhere — 「利用規約は別に入れてるから大丈夫」 —
so it is recorded here as answered rather than as work. If a review ever comes
back naming it, this is the paragraph it is about.

## ~~Two decisions of the same day disagree about how many keyboards~~ — settled

*2026-08-23, owner:*「1,1+3.無制限って言わなかったっけ？」

**Free 1 — the fixed QWERTY. Plus 1 + 3 = 4. Pro no ceiling.** Counted as a
pool **across languages**, not per language. `docs/FEATURE_RULES.md` said both
things on the same day; it says this one in both places now.

**Built, 2026-08-23.** `kbCap()` beside `wordCap()` in `www/core.js`
(1 / 4 / Infinity), `kbCount()` in `www/keyboard.js` summing across `LANGS`,
`kbRoomKb()` adding the QWERTY as the 1 in 1 + 3, and `CAN.kb` moved to `plus`
**in the same commit** — a door opened without its number would have given
Plus the three `KB_MAX` handed out. `KB_MAX` is gone.

It was deferred here because `www/keyboard.js` was `claude/detailed-tasks-
execution`'s. That branch has not touched the file since 2026-08-15 and no
live branch is in it — checked with `git log --oneline --all -- www/keyboard.js`
before starting, which is what `docs/SESSIONS.md` asks for and is the reason
this could be picked up rather than waiting on a session that had moved on.

## The plans screen is half wired, and the half that is missing is named

`www/store.js` is in and `setPlan()` goes through it: on a phone, pressing a
paid card buys, and the plan comes from the App Store's answer. Three things
are deliberately not there yet, each because a file it needs belongs to
another session today (`docs/SESSIONS.md`).

- **Restore.** `restore` exists on the native side and there is nowhere to
  press it. **Apple requires the button** — an app selling a subscription
  without one is rejected. It needs a name in `www/act-map.js`.
- **The middle card.** `PLANS` sells Free and Pro. Plus's name, price and
  lines are strings, and `www/i18n/*.js` is not this session's today. Nothing
  can be bought that is not on the screen.
- **Going back to free is not a purchase and is drawn as one.** Pressing Free
  on a phone sets `SET.plan='free'` by hand, which is a person saying "act as
  though I am on free"; the next launch reads the Keychain and it is Pro
  again. What that button should do is open Apple's own sheet — `manage` on
  the native side, which exists — because cancelling is Apple's and not ours
  to draw. It needs a name in `act-map.js` too.

None of the three is hard. All three are one file away.

## Two decisions of the same day disagree about how many keyboards — OWNER

`docs/FEATURE_RULES.md` carries both, and they cannot both be implemented.

- **The earlier one** (§ How many languages, how many keyboards): a keyboard
  count is a **pool across languages**, Basic gets **1 + 3 = 4**, and **Plus
  has no ceiling**. Its reasoning is written out at length — a keyboard is
  layers, so more boards buys only a different arrangement, there are five
  arrangements, and a ceiling that binds almost nobody is generous on purpose.
- **The later one** (§ A third plan, and what pays for the free one): the
  `CAN` table reads `kb`: Free —, Basic **1**, Plus **3**.

Four against one, and no ceiling against three. `CLAUDE.md` says an owner
decision is a specification and that a session may not resolve a conflict
between two of them, so **`can('kb')` has been left where it was — `plus`**.
Moving it down to `basic` without the number would have given Basic the three
that `KB_MAX` hands out today, which is neither answer.

What is waiting on it: `KB_MAX` in `www/keyboard.js` (a per-language constant
today, a per-plan number either way, and a pool across languages if the
earlier decision stands), and the language ceiling, which does not exist at
all yet.

## ~~The onboarding adds a 29th letter on the free plan~~ — decided, and in

*2026-08-23, owner:*「aが自作文字に変わる瞬間みたいなの見せたい」

The shape moves into the slot that already answers to the name. `ltFreeSlot()`
in `letters.js`, DELETE REVIEW in `docs/CHANGELOG.md`, eleven claims in
`base-check` and seven of them watched going red.

**One question it leaves open**, and it is not a bug today: what happens on
the free plan when somebody names NOTHING. Choosing is not required to leave
that step — 「選ばなくても出られる」 — so the shape stays a letter of its own,
with no name and no key, and the letters chapter lists it among the loose ones
where it can be named later. That is the same as before this change. Requiring
an answer on free would be a change to what the step IS, and therefore the
owner's.

## The tour cuts its hole with four panes

`obTourHTML()` dims the screen with **four `.sbg` panes** laid around the lit
element. `.sbg` is the sheet's own backdrop doing a job it was not written
for, and four rectangles have to agree with each other about where the hole
is.

It is that way because `www/index.html` belonged to another session on the day
the tour was written (`docs/SESSIONS.md` — one session at a time owns that
file), and a screen that half-works is worse than one that borrows.

What it wants, on the day that file is free: **one** dim element with a real
cut-out — `clip-path`, or a box-shadow ring — instead of four panes whose
arithmetic has to agree.

None of it changes what the tour does. It is four panes against one element.

## ~~CSS outlives the screen it dressed, and nothing says so~~ — the check is in

*2026-08-22, owner:*「CSSの死骸は削除ではなく、検査を作る。className /
classList / 動的生成を考慮せず『grepで使われてないから削除』は危険。
やるなら先に『生きているCSS selectorか』を判定できる検査を作る」

`press` asks it now. A class is compared against every class actually WORN on
any element of any screen, collected after every build and after every press —
because a render-only walk never reaches `.on`, and a rule that only a pressed
state wears would be reported as dead.

**202 classes were styled and worn by nothing** on the day it was written, and
they are frozen in `tools/css-baseline.txt` as a ratchet: a new one fails,
taking a line out needs nobody. `a.set` and `.weave` are both on it.

**The check says "nothing here wore it", not "it is dead", and the difference
is the whole design.** A class worn only in a state the walk never reaches — an
error, a plan the fixture is not on, a screen behind a half-done state nobody
seeded — is on that list too. Clearing a line by adding the seed that reaches
it is the better fix, and the list cannot tell you which kind you are looking
at. **A person reads it. Deleting on the strength of the list alone is the
thing the owner said not to do, one level up.**

It nearly froze its own blind spot: the first version reported `.bar` as worn
by nothing, which is not a dead rule — `press` puts a view straight into `#app`
so the shell never exists. A pass through the real `render()` was added, kept
separate from the walk because `measure()` and `measureRows()` are calibrated
on what `show()` builds.

**Still open: deleting any of the 202.** That is a change to the stylesheet,
one selector at a time, each one read by somebody first.

## ウィジェットの絵が実物より大きい ── `claude/save` の担当

*2026-08-23, owner:* 実機の写真と `tools/widget-shot.mjs` の出す絵を並べて
「全然違うし、本当のウィジェットの見た目小さいよ」。

出ている絵は「ホーム画面では」という見出しの下に文字盤を大きく描いていて、
実機ではもっと小さい。**大きさが違う絵は、確認の役に立たないだけでなく、
確認したつもりにさせる** ── このリポジトリが何度も踏んでいる形。実機で
出る大きさで描くこと。iOS のウィジェットは small / medium / large の三つで、
写真は small。

**カレンダーがまだ無い。** 時計と日付はあるが、カレンダーは無い。

置く手順は「ホーム長押し → 編集 → ウィジェットを追加 → Lingua」。

`ios/App/LinguaWidget/` と `tools/widget-shot.mjs` は `claude/save` が
持っているファイルなので、こちらでは触っていない。

## iPhone のパスワード保存 — 調べて、やらないと決めた

*2026-08-23, owner:*「パスワードの保存は一旦なしで」

聞かれたのは「ログインのパスワードを iPhone に覚えさせられないか」。答えは
できるが、ただではない。

**画面の側は既に正しい。** `obMailField()` が `autocomplete="username"` /
`"current-password"` / `"new-password"` を出していて、`type` も email と
password。ここに足りないものは無い。

効かない理由はドメインが無いことで、iOS のパスワード管理はドメイン単位で
照合する。Capacitor は `capacitor://localhost` から配信している
(`capacitor.config.json` の `server.iosScheme`)ので、照合できる相手が居ない。

やるなら三つ:

1. 配信元を `localhost` から本物のドメインへ (`server.hostname` + `iosScheme`)
2. `associated-domains` (`webcredentials:そのドメイン`)、Apple の Identifier
   の capability、プロファイルの作り直し
3. そのドメインに `/.well-known/apple-app-site-association`

**そして罠が二つあり、一つ目がこれを重くしている。**

`localStorage` はオリジンごと。配信元を変えると新しい空の localStorage に
なる ── 言語も文字もキーボードも無い状態でアプリが起動する。消えては
いないが、使う人には見分けがつかない。`backup.js` が Documents に書いた
ファイルはオリジンに縛られないので渡る道はあるが、それは「バックアップが
勝つ」形の復元で、`docs/DATA_SAFETY.md` に真正面から関わる。設計が要る。

二つ目。全部やっても出るのは候補までで、「このパスワードを保存しますか」の
ダイアログは WKWebView では出ない(Safari だけ)。出すには
`SecAddSharedWebCredential` を叩くネイティブ側が要る。

**そして、この扉には既に Sign in with Apple がある。** パスワードそのものが
無いので保存する必要がなく、ドメインもエンタイトルメントも要らない。
「iPhone に覚えさせたい」への答えとしては、もう出荷されている。

やるときに先に決めることが一つ: **オリジンを変えた日に、既にアプリを
持っている人のデータをどう渡すか。** それが決まるまで、この項目のコードは
一行も書かない。

## A private account — asked for, and deliberately not now

There is no such thing today: every profile and every post is readable by
anybody. What exists is the public/private switch on a LANGUAGE page
(`wldHidden()` in the language room), which is a different thing.

Three pieces are missing and the middle one is the reason this is here:

1. a column on `profile`;
2. **following becomes a request.** It is one-sided and instant today, so an
   account that could be locked would need a pending state, a screen to
   accept or refuse on, and every place that counts or lists followers would
   have to say which kind it is holding;
3. `post_read` gated on "public, or mine, or an accepted follower of mine",
   where it is `true` today.

Owner asked, then said not yet 「いやめんどいから今はいいや」. Not started,
and nothing has been laid in for it — no column, no flag, no dead branch.
When it is picked up, two things are already decided by the shape of the
data: existing follows all count as accepted, so nobody loses a follower on
the day it ships; and whether locking an account keeps the followers it
already has is open.

## ~~`form:add:<parent>` arrived at cold shows "this is gone"~~ — fixed

*Fixed 2026-08-22. Kept as the record of what the entry got right and what it
got wrong about its own cost.*

`openAdd()` decided whether the draft was new by asking whether the route was
already the one it was about to open, so arriving AT that route with no draft
took the not-fresh branch, left `addW` and `wEdit` null, and `wdFormHTML()`
threw into `vForm`'s catch. The screen said the form was gone, about a form
nobody had opened.

**The entry said the fix was "a behaviour change to how a draft is decided to
be new, and that is its own commit". Half right.** It is its own commit, and it
is one clause: `|| !addW || !wEdit`. It is not a behaviour change in the sense
the entry meant — what the route test is FOR is not throwing away what somebody
typed, and there is nothing to throw away when there is no draft. The absence
of a draft is what makes a sheet new; where the trail is pointing never was.

`word-check` holds both halves now, because widening `fresh` could have
widened it onto the case the test exists for. Two reds were watched: without
the clause, arriving cold says "that is no longer here"; with `fresh` forced
true, reopening the sheet throws away what was typed and every meaning.

## ~~The face on `profile` does not follow the face on the phone~~ — fixed

*Fixed 2026-08-22, owner confirmed:*「アイコンは全部更新したら更新したの
表示でしょ」

`netMakeProfile()` wrote `profile.av` once and nothing wrote it again, so the
little face beside "somebody liked this" could be one somebody had not worn
for a month. `netAvSync()` in `net.js` sends it now, from `bootSession()`.

**The entry said the reason not to do it was "a second write on a path that
has none — every letter drawn would otherwise be a request", and that this
wanted a decision about how often. Both were wrong, and the second followed
from the first.** `postAvatar()` answers the photograph if there is one and
otherwise the FIRST drawn letter, so it does not move when a letter is drawn
— it moves when the first one is redrawn, or a photograph is set. Twice in a
language's life. There was no frequency to decide: **send it when it differs**
was always the whole answer, and `ME.avSent` makes the comparison local, so a
launch where nothing moved asks the server nothing.

The server was already ready and nobody had noticed: `schema.sql`'s
`profile_edit` allows the update and `grant update (handle, display, av)`
names the column.

`post-check` holds three — it is sent when it has never been sent, it is NOT
sent when nothing moved, and it goes as `PATCH`. All three reds were watched.

## Not now, because wordsheet.js has just moved

The new-word sheet and the word editor became one screen, and a word gained a
register, fields, an etymology and a changed-on date, all in the same day.
None of it has been on a phone yet. Touching the same file again before that
happens means the next thing found on the device has two changes to be
bisected against instead of one.

- **`wordsheet.js` input handling.** `wdSetLn` / `wdSetPos` / `wdSetReg` /
  `wdSetTags` / `wdSetEty` / `wdSetNt` are six one-line setters that all write
  `wEdit.<k>` and differ in the key. One `wdSet(k, v)` would do — `IN` already
  carries an argument before the value, which is how `wldSet('where', v)`
  works. Worth doing; worth doing after the device.

- **`goneBox()` is not used everywhere it could be.** `viewGone()` is the one
  place for "the thing you came back for is gone" and some screens still write
  their own empty state. Changes what is on screen, so it needs a screenshot
  and an approval, not a quiet commit.

- ~~**`talk.js` / `grammar.js` shared logic.**~~ Moot: `talk.js` went out with
  Studio. If the conversation comes back with the hosted model, so does this
  question, and the answer it had still holds — only if the shared thing is
  genuinely one rule, and not everything that repeats is duplication.
  `cffNum` and `csNum` in `otf5.js` are the standing example.

## A column no longer has anywhere it cannot go

*Both halves of this are done. Kept as the record of why it was not, because
the reasoning is the reason the fix took the shape it did.*

A language can be written in columns — `ttb-rl` and `ttb-lr` — and two places
used to set it **across** instead, in the direction the columns run, through a flattening
step that no longer exists.

**The composer's field** is a `<textarea>`, and a textarea in a vertical
writing mode was not something this webview would do: `lnFit()` sized it by
`scrollHeight`, which is the wrong axis there. It is typed into as a column
now, and `lnFit()` measures the width when the writing-mode is vertical.

**The card** was 1920×1080 with a band of letters across the middle of it, and
a column had nowhere to go in that. The answer written here was "a second
composition — portrait, with the run down the middle", and that is what it
got: `CARD_SHAPES` offers 16:9, 1:1 and 9:16, a language that runs down the
page opens on the tall one, and `cardPlace()` lays the line into whichever
shape is chosen rather than one fixed band. So the card sets a vertical script
vertically, and nothing is flattened on the way.

## ~~Not now, because a rename is not a fix~~ — done, and one of the four was
## wrong

*Done on 2026-08-22, one commit each, and kept as the record of what the entry
got wrong about itself.*

- ~~`postsRead`~~ → `postRead`.
- ~~`wSetFil` / `wSetSort`~~ → `wordsSetFil` / `wordsSetSort`.
- ~~`gh*`~~ → `geHint*`, and `GH*` → `GE_HINT*`. It turned out to be the silent
  demo canvas inside the glyph editor — ten functions that draw no text at all,
  which is why it is right in ten languages. `ge*`'s child, so it says so.
- ~~`notes.js` prefix mixing~~ → `note*` was `nt*` spelled long, so it went to
  `nt*`. `openNote` and `vNotes` stayed; `open*` and `v*` are in CLAUDE.md.

**`savePosts` and `saveMe` were listed here and should not have been.** The
entry put them beside `postsRead` as if all three were a `posts*`/`post*`
collision. They are not: they are `save*`, and `save*` is a family of exactly
ten — `saveKb` `saveLetters` `saveMe` `saveNote` `saveNotes` `savePosts`
`saveSnd` `saveStg` `saveWld` `saveWord` — every one of which names what it
saves. Renaming two of the ten would have left eight, which is the tangle
rather than the untangling.

The reason it is worth writing down: **the rule already allowed this and the
entry did not notice.** CLAUDE.md's own prefix list carries `open*`, which is
twenty functions and is a verb, not a chapter. So a verb family was never an
exception — what the rule is against is one chapter under two names, which is
what the other four were. Settled in the decision log, 2026-08-22.

## The question the card bug was actually about

Not a task. A thing to check for, whenever anything is added that shows
something from the past.

The card bug was not "a function is wrong". It was **the wrong owner for a
piece of data**: a post's shapes belong to the post and were being re-derived
from the dictionary that happens to be open. So for anything that displays
what somebody did earlier, ask which of the three it is:

| | |
|---|---|
| frozen at write time | put it ON the thing. A post's ink, its author, its language's name |
| read from the current state | correct for a word, an example, an alphabet — the making side |
| held from an earlier state | neither of the above, and the one to be suspicious of |

Places to look the day they exist: a ranking, a season record, a history, an
export of something older than the app's current shape. Today the app has
none of these — posts are the only past-tense data it holds, and post.js and
card.js are the only two files that render one, which is why the sweep after
the card bug found nothing else.

## ~~A renamed letter loses its key on the free plan~~ — closed by a decision

*Closed 2026-08-22 by the owner:*
「無料で作ってる範囲の名前変更は無しでしょ。有料は追加できるというだけで。
無料分のキーボードはもういじらない」

**The twenty-eight slots and the digits may not be renamed, on any plan.**
Paid buys ADDING letters — `can('letters')` — and that is a different
sentence. A name that cannot move cannot be lost, so the whole path this entry
described stops existing. Decision log, `docs/FEATURE_RULES.md`.

What this entry cost, kept because it is the lesson: it listed three ways out
and priced the first as the smallest, on a claim about `ab` that had stopped
being true — and a later reading of it re-priced the *decision* as "restricting
a paid screen by a plan the person is not on", which made it read as expensive.
It is not a restriction. **A slot's name was never something anybody was
offered.**

The letter page had held it since 「無料で作ったやつを改名できなければ良く
ない？」 — `ltIsBase()` and `sound.js`'s `can('letters') && !ltIsBase(l)`. What
was missing was the rule: `ltSetRoman()` did not refuse, so a screen was the
only thing holding it. It refuses now and `base-check` holds both halves —
a slot keeps its name, and a letter somebody ADDED is still theirs to name.

## Is `numSetVal()` reachable at all?

Found while placing that refusal, not looked for, and **not** answered here.

`numSetVal()` is called from one place — `ltSetRoman()`, when what was typed is
all digits. Two things sit in front of it:

- it refuses a value another digit already has, and `ltStart()` fills every
  value below the base, so inside a base **every value is taken by
  construction**; and
- the field that reaches `ltSetRoman()` is `ltAbField()`, which `sound.js`
  shows only when `can('letters') && !ltIsBase(l)` — and `ltIsBase()` is true
  for every digit.

So a digit appears to have no road to its own value. That may be exactly
right — 「数字が設定できないわ。そこ文字から設定できるように頼む」 was asked
about DRAWING on a digit, which works, and a digit's value is arguably what
the slot IS rather than something to edit. It may also be a door that closed
when the letter page learned about `ltIsBase`.

Not resolved because the answer is a spec question, not a code question, and
because a check was written for it and had to be deleted: no assertion about
moving a value can be satisfied in a normal state, which is itself the
evidence. **A check that cannot be made true is not a weak check, it is a
statement about the app** — and the statement here is "this cannot happen",
which somebody should confirm is intended before anything is built on it.

## `tools/verify-script.mjs` runs now, and says nineteen things

It was recorded as "broken, a font experiment, not in the gate". Two of those
three were wrong.

What was wrong with it was three things, and the first two are fixed:

1. `gstep()` — renamed `geStep()` and this file was missed.
2. `scriptDrawn()` — went out in `9226dd6`, when the font stopped being built
   from anything but the letters. `scriptGlyphDefs().defs.length` is the same
   number now.
3. **every mouse click was landing on `#splash`.** It waited 250 ms after
   `goto` and the splash holds for the later of 900 ms and boot, so the point
   editor was never touched at all. Every other check in `tools/` waits for
   `#splash` to detach; this one predates the selector.

With those three fixed it executes end to end for the first time in a long
while and reports **13 ok, 19 FAIL**. That number is not nineteen bugs. The
editor has changed a great deal since this was written — the rail it asks for
is "two marks" and there are four, the circle and arc section fails wholesale,
and the snap failures are one lattice step out in y and not in x, which reads
more like the test's own 800-unit mapping than like `geSnap`.

So each of the nineteen needs the same question asked of it: **is the app
wrong, or is the test old?** Until that triage is done this cannot go in the
gate, because a check nobody believes is a check nobody reads.

It is worth doing. It is the only thing that proves the whole PUA font path
end to end — draw, save, build the font, install it, and confirm the browser
is really using it rather than falling through to a serif. Nothing else in the
gate can see that.

## A font for the letters somebody drew — held

The strokes a person draws are a skeleton, and how it is inked is a separate
choice: 角 / 細 / 太 / 丸 / 筆 / 平筆, chosen per language, stored on the
`script` slice, changing nothing anybody drew and therefore reversible on any
day. `GPEN` in `glyph.js` is that choice today and it is one constant —
`{width:60, angleDeg:0, contrast:1.0, curve:72}` — used by the font builder,
by `inkStrokes`, and by `share.js` when the shapes are cut for the system
keyboard, so all three would have to read the language's pen instead.

`otf5.js` already takes the nib's width, angle and aspect, which is five of
the six. 筆 is the sixth and is not a nib: the width varies along the stroke
and the end is one of 留 / 羽 / 払. `tools/font-mock.mjs` renders that —
including how each stroke's ending is read off the drawing rather than asked
about — and is in the repo. It is not a check and is not in the gate.

**Held by the owner on 2026-08-20: 「いったんフォントなしで」.** Nothing in
`www/` was changed for it. Do not start this without asking.
