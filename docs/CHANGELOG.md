# Changelog

Changes a person using the app would notice, and every change to how data is
stored, moved or removed — whether or not anybody notices those.

Not a commit log; `git log` is the commit log. What goes here is what somebody
opening the app after an update would find different, plus the record required
by `docs/FEATURE_RULES.md` (the eleven questions) and `docs/DATA_SAFETY.md`
(DELETE REVIEW).

Newest first. Entries before 2026-08-12 are not written up — this file starts
where it starts.

---

## Unreleased — on `claude/save`, code confirmed, **not yet confirmed on a device**

### A frozen account, from the other side — and a way to say it is wrong

**Their posts come off the timeline and stay on their own page.** Nothing is
deleted and nothing is hidden on the server: a freeze can be lifted, and
everything comes back by itself the next time the server is asked.
「タイムラインから外す、プロフィールからは凍結してますの表示。ツイートは自己
責任で見れるようにするのは？」

**Stored, on the server:** `post_seen` gains `author_out` — whether the
account that wrote the post is frozen. It is on the ROW, the way everything
the reading side needs is, rather than the phone asking about every author a
timeline shows. `postKept()` is the new list (blocked and taken-down
removed) and `postAll()` is that list with frozen accounts taken off as
well; a profile uses the first and the timeline the second.

**Their page says so and shows nothing else about them** — no face, no name,
no follow button, since following an account that cannot post is a button
with nothing behind it. Their posts are under it.

**And a way to appeal.** `Lingua@tokinets.com`, opened from the frozen
screen. An address and not a form: a frozen account cannot write a row
anywhere — every write policy goes through `is_member()`, which is the whole
of what being frozen means — so a form would need a table with the door open,
and that door is the thing being closed. **The alias is the owner's to
create**, and the link is the app's one `<a href>`: what opens Mail is the
href, so it cannot be a `<button>`. **Not device confirmed** — whether iOS
hands a `mailto:` to Mail from inside this WKWebView has not been tried on a
phone.

**The rule about explaining is narrowed, and only this far.** 「必要な説明は
書いてね。みてわからないのが一番ダメ。最低限ね」 Where the app has taken
something away and the screen would otherwise be a state with no cause and no
way out, the sentence it needs is written. The frozen screen is the case that
settled it and the only one that has it: a heading, one line saying what is
off, and the appeal. Everything else in the ban still stands everywhere else.
`CLAUDE.md` § Explaining and three entries in `docs/FEATURE_RULES.md` say so.

Four strings in all ten languages: `post.rules`, `who.out`, `out.what`,
`out.appeal`. `npm run rls`: **122 attempts** — a frozen account's post says
so on the row and an unfrozen one does not.


### A post taken down says so where it was, and a frozen account is told on the page the app opens on

Three things, and all three are the owner narrowing what was proposed.

**A tombstone, on the one post and not on the conversation.** A post that was
taken down used to be missing from everybody else's answer, so a thread had a
hole in it and a reader could not tell "taken down" from "never existed".
Now the post somebody came to read says that it went — one line, no name, not
a thing you can press. Everything **else** in the conversation is somebody
else's line and is simply not shown: 「スレッドは本ツイートだけね？それ以外の
会話は本ツイートとは関係ないものとする」. It is out of the timeline entirely.
Your own stays where it was, wearing the chip that says what state it is in.

**Stored, on the server:** a view, `post_seen`, which the app now reads
instead of `post` (`netFeed`, `netFindPosts`). It hands back the row and
replaces the body with `{}` unless you wrote it or answer the reports, so the
words somebody was reported for are not on the wire at all. `post.body` is
untouched and `post_show()` still puts the post back whole. `post_read` is
unchanged and still refuses a hidden row through the table — a view is only a
wall if there is no door beside it, and opening the table instead was the
first shape of this and put the body in front of anybody with the publishable
key. `post_seen` is a definer view for that reason: a caller-rights view could
not see a hidden row and would have nothing to blank.

**Block and report, on a person's page.** They were on a post's `⋯` and
nowhere else, so blocking somebody meant finding something of theirs to block
them from. 「ブロックも通報はその人の画面でもよろしい」 `whoMore()` in `me.js`,
the same menu in the same shape, closed by the same one rule in
`postMenuTook()` — `WMENU` beside `PMENU`, a boolean because a page holds one
person. A report with no post on it is about the account, which `report` has
always allowed (`check (post is not null or who is not null)`).

**Frozen is said on Home, and nowhere else.** No notice, and no notice for a
post being taken down either: 「通知はいらんてホーム画面にバンでいいやん」
「下ろされた初打ちいらんし」. The three sns tabs stay open — 「3タブを閉じる
必要もないし。ホームに出ればいいやん」 — and every door being frozen shuts is
shut by `is_member()` on the server whether or not anything on screen says so.
This is the saying so.

Home is the **feed**, not the profile tab, and it took two goes. It went on
`vProfile` first, which is a different screen. Then it was a coloured strip
with a corner radius and a border across the top of the feed — a chip, and a
chip is a thing you scroll past. It takes the timeline's PLACE now, as the
app's own empty state (`.empty`, the serif heading every other nothing-here
screen uses), and the two ways to write — the row at the top and the round
button over the corner — are not drawn at all: a button that cannot do its
one thing is worse than no button. That shape is X's and the owner supplied
it as the reference.

One new string in all ten languages, `post.rules` (`post.gone` was taken and
means something else). `npm run rls`: **120 attempts, 21 shapes** — the row
comes back, it says nothing, the words cannot be read out of the view or out
of the table under it, the author still sees their own, and the view carries
no `hidden_why`. Watched failing with the blanking removed (3 red) and with
the table left open (2 red). `post-check` § 13 holds the phone half, watched
failing both ways: a tombstone back in the timeline, and every post in a
thread drawing one.


### A language is kept on the server, and two copies are put together rather than one winning

Everything somebody makes belongs to the account — 「全部アカウントごとでしょ」
「クラウドは全員で」 — so a language exists twice now: on the phone, where it is
made, and on the server, where it is kept. The making side is untouched and
stays untouched: nothing waits for a network, and a language is written on a
phone in a tunnel exactly as it was.

**Stored, on the server:** a new table, `slice` — `(language, kind)` as its
key, plus `body`, `no` and `at`. One row per slice of `SLICES`, holding
exactly the string `localStorage` holds, which is the same string `bkPack()`
writes into a backup file, so a slice has one shape and not two that could
disagree. The server never looks inside it. Its policies ask
`has_account()`, so a first launch can write one, and its **select** policy is
the owner's alone — the one table in `schema.sql` with no public face, not
even for a published language, because publishing is a copy somebody is given
and not a door into the phone.

**Stored, on the phone:** `LANGS[id].sid`, the server's name for the language,
the same way a post carries one. A language with no `sid` has never been up.

**A row per slice and not per language, and that is the point.** One number
for a whole language means adding a word on one phone and drawing a letter on
the other is a collision, and one of the two has to lose something nobody was
arguing about. Per slice they never touch.

**Inside one slice, both are added.** 「そりゃあ両方足すだろ」 `www/sync.js`
(chapter 26) is the new file and the whole of what decides: a word added here
and a word added there are both there afterwards, in this phone's order first.
A word is its headword and a letter is its id, so redrawing a letter leaves
one letter rather than two under the same name; a slice with no id of its own
— a note, a line — is its own content, so two different notes are two and the
same note twice is one. `SCRIPT` and `STG` are nested and are gone into rather
than replaced whole, or a letter drawn on one phone would take the other
phone's entire script with it. Where the two genuinely disagree about the same
thing the phone keeps its own.

What that costs is a duplicate rather than a deletion: edit the same note on
two phones and there are two notes afterwards, one to throw away. That is the
trade, made on purpose — a duplicate is on the screen and a deletion is not
there to be noticed. `docs/DATA_SAFETY.md`: the way a copy destroys somebody's
work is by winning.

`netLangSync()` in `net.js` is fired from `boot.js` after the session and
never waited for. Read, merge, write back whatever moved — in that order, so
a phone that has been offline for a week arrives holding the week rather than
replacing it. A failure is silence.

`backup-check` holds the merge — eleven shapes, each one an afternoon somebody
would lose — and `npm run rls` holds the table: **116 attempts, 20 shapes**,
ten of them new against `slice`. All watched failing: the merge with the
server's copy winning outright (6 red) and with the nesting taken out (3 red),
and the read policy opened to everybody (3 red).


### The timeline is sent a small copy of a photograph, not the photograph

A row shows a picture a few hundred pixels across and was being sent one nine
hundred across. Nothing looked wrong and nothing could: the browser scales it
down on arrival, so the only difference is the bytes — and bytes are the one
thing a screenshot cannot show. The timeline is also the only thing in this
app that anybody scrolls.

A picture now goes up as **two files**: the photograph at `POST_PIC` (900) and
a small copy at `POST_THUMB` (300), made by `postThumb()` in `post.js` at the
moment it is uploaded. Measured on the check's own picture: **2 KB against
7 KB**; on a real photograph it is nearer 8 KB against 80. Pressing a picture
still opens the photograph.

**Stored:** a post gains `pt`, the small copies' paths in Storage, beside
`pu`. Nothing is stored on the phone for it — the small copy exists only in
Storage, so `POST_BYTES` is untouched. `pt` is allowed to have a **hole** in
it: a small copy that failed to upload leaves its slot empty and
`postThumbs()` draws the photograph in that slot. It is indexed rather than
pushed for exactly that reason — a list that closed the hole would put picture
two's thumbnail under picture one, which is the wrong picture shown with
nothing throwing. Deleting a post deletes the small copies too
(`netDropFiles`), or they would sit in a public bucket with nothing pointing
at them.

Why it was worth doing before anything else online: egress is what runs out
first on a $25 Supabase — 250 GB included, $0.09/GB after — and at full size
that is about 800 people opening the app daily. At a tenth of the bytes it is
about eight thousand.

`post-check` § 12 holds it, in two places on purpose. `postThumbs()` is asked
directly — the size of the small copy, that a picture already smaller than
`POST_THUMB` gets no second file at all, that a hole falls back **in its own
place** at either end of the list, and that the viewer still gets the
photograph — and then the **row a timeline actually draws** is asked, with the
photograph's own URL forbidden in it. The second is not the first: the first
version of this check passed with the row still drawing full-size pictures,
because a function can be perfectly correct and simply never be the one that
runs. Both were watched failing.


### The server has two questions about an account, not one

`is_member()` was the only door in `supabase/schema.sql` and every write stood
behind it. It refuses an anonymous account — deliberately, since the day it
was written — so the account the app now makes at first launch could not store
one byte of anything.

It is two questions now, and they split along what the write is **for**:

- `has_account()` — there is an account. Anonymous counts, and frozen counts.
  It guards what is nobody else's business: a language, and everything filed
  under it.
- `is_member()` — the account has a name on it and has not been frozen.
  Unchanged, and it still guards everything other people would see.

Only the three `language` policies moved. Publishing a language did **not**:
`publication_make` still asks `is_member()`, because putting a language in
front of other people is the same kind of act as posting.

**Stored:** `language.owner` now references `auth.users(id)` instead of
`profile(id)`. An account exists before a person does — a profile row IS the
identity, since the handle is `unique not null` — so pointed at `profile` a
language could not be made until somebody had chosen a handle, which is the
one thing a first launch does not ask for. `post.author` stays on `profile`,
read the other way: a post is seen by other people and has to be signed. The
change is applied to a database that already has the table by a named
`alter table ... drop constraint if exists` / `add constraint` pair, so the
file still applies twice in a row. No row moves and nothing is deleted.

A frozen account can now write its own language, which it could not before.
That is the 2026-08-22 decision — 「制作は好きにやらせればいいし、sns止められ
ても作りたいやつは作るでしょ」 — and it follows from `has_account()` saying
nothing about `banned_at`.

`npm run rls`: **106 attempts, 19 shapes.** Nine new attempts as an account
with no name on it (it makes a language, reads it, renames it; it cannot post,
take a handle, follow, publish, own somebody else's language, and nobody else
sees what it made), two as a frozen account still writing its own language,
and three shape assertions — that `has_account()` mentions neither
`is_anonymous` nor `banned_at`, that no `language` write policy asks
`is_member()`, and that `language.owner` points at `auth.users`. Watched
failing twice: with `language_make` put back to `is_member()` (6 red) and with
the foreign key put back to `profile` (4 red).


### The app opens on a blank square, not on a sign-in screen

Step 0 of the onboarding was the door. It is not a step of anything now: the
account already exists by the time the first frame is drawn, so the first
thing anybody sees is the square they draw a letter on. Three steps instead of
four — draw, which letter it is, its name — and three dots instead of four.

The door is a screen the app goes **to**. `obDoor(r, a)` is the one way in and
it carries where to come back to; `obPending()` — the note it leaves, which
has always outlived a reload — is what `vOb()` shows it for, rather than a
step number. There are no dots over it, because it is not a walk anybody is
on. Three places open it: Settings → Account, and the six things that need a
name (`obNeed()`), and that is all.

"Continue without an account" is gone with it, and so is `SET.anon`, which
that button was the only writer of and nothing has ever read.

Nothing stored changes and nothing is lost: `SET.obback` and `SET.done` are
the same pair they were.

Three counters moved, and all three are this change. `screens built` 549 →
548: the step walk renders three screens where it rendered four, because the
door is no longer one of them. `buttons pressed` 7181 → 7177: the door's own
buttons were being pressed twice, once as step 0 and once as the `obStates()`
entry, and are pressed once now — they are still all pressed, from
`tools/fixture.mjs`, which is where the door's five faces have always come
from. `distinct names` 206 → 205, and the one that went is `obSkip`. No other
name was added or removed.


### The app makes an account for you, and being somebody is a second question

Opening Lingua signs you in. Nobody types anything and nobody is asked
anything: the first launch makes an **anonymous account** on the server and
everything is made under it. 「サインイン必須にしたいけど、オンボーディングで
離脱されるのは防ぎたい」

That splits one question into two, and they were the same question until now.
`netSignedIn()` says there is a session — anonymous or not — and `netMember()`
says the session has somebody's name on it. The second is the phone's copy of
`is_member()` in `supabase/schema.sql`, which has always refused an anonymous
token, and it is read off the token itself rather than off the answer that
carried it, so the phone and the server are reading the same claim.

What that changes on screen: the timeline, the search and the notices open
without signing in, because there is a session now. Everything **other people
would see** asks first, and asking is the door: writing a post, liking one,
boosting one, reporting one, following somebody, blocking somebody. Press one
without a name and the door opens with the way back to where you were pressed
into it. 「課金とツイートにはログイン必須。それ以外は流さない」

Buying is the other half of that sentence and is not here: there is no
StoreKit yet, so the plans screen is untouched.

**Stored:** `lingua.sess` gains one key, `anon`. A session already on a phone
does not have it, which reads as false — every account that exists today is a
real one, so nobody is signed out or demoted by the update. Nothing is
removed and nothing else moves.

`migrate-check` case 7 holds it: a launch with nothing stored comes up holding
an anonymous session it did not have, that session is signed in and is not a
member, an old stored session is still a member, and signing in over the
anonymous one leaves it a member. Watched failing with the boot call taken
out.
### The base moves to the stage that asks for it, and the display is a switch — OWNER DECISION

Two things off the writing screen.

**The base.** 10 / 12 / 16 / 20 sat under the kind of writing and the
direction, and it is neither of those. What it decides is how many words the
counting stage asks for and how many digits the alphabet holds — so it is at
the head of the counting stage now, above the words it decides the number of.
「文法の数え方のページに進数入れればいいのでは？」

**Roman or your own letters** was two buttons sharing a rule, which is the
shape this app uses for choosing one of several. There are not several: it is
one thing that is on or off, so it is a switch. Off is roman, which needs no
button of its own to say so. `script.show.roman` is gone from all ten
languages with the button that showed it.

**Data.** Nothing changes. `STG.base` is read and written exactly as before,
from a different screen; `SET.myfont` likewise.

**Deletion.** Nothing is deleted.

**Tested.** `npm test` green. Buttons pressed fell from 8486 to 8469, which is
this change and nothing else: every render of the writing screen loses the
four base rows and one of the two display buttons, and the counting stage
gains the four.

**Not verified on a device.**

### ROUND is done to a stroke, not armed before one — OWNER DECISION

The button used to turn a mode on: press it, then draw, and what came out was
bent. It is the other way round now — draw the stroke, look at it, then decide.
「線は先に引いてその後にそれをラウンドにするかどうか選べる仕様にしない？」

Three things follow, and all three are the owner's:

**With nothing drawn the button is down.** ROUND is done to a stroke, so until
there is one there is nothing for it to be done to.

**A straight stroke stays straight.** 「縦線はラウンド押してもラウンドになる
わけがない」 It could not before: the ring guess keeps three points of a stroke
and closes them, and a closed arc is a full circle, so a line drawn straight
down could come back a ring. 「縦線引いただけで円になるんだって」 It never
threw and never blanked a screen — the letter simply was not the one drawn.

**Pressing again gives back exactly what was drawn.** The stroke as drawn is
kept while the editor is open, and every press bends that one rather than
whatever the last press left behind. The old button only turned its mode off
and left the stroke bent.

How a stroke bends still depends on how it was made: a dragged one from the
finger's own path, a tapped one by marking its interior points, because
thinning what somebody placed dot by dot is dropping what they placed. A
stroke brought back by undo has neither behind it, so it is taken as it stands
and treated as tapped — which never drops a point.

**Data.** Nothing new is stored. What ROUND leaves behind is the same `k`,
`closed` and `'c'` marks it always left; the straight copy lives in the editor
and goes when the screen does. Nothing already stored changes.

**Deletion.** Nothing is deleted.

**Tested.** `tools/round-check.mjs`, new, in `npm test`: a line of seven points
drawn straight down is untouched and its ink is still 24 wide, not a ring; a
stroke with a corner does bend; pressing twice gives back exactly the drawn
stroke; the button is down with nothing drawn and up with something. Both
failures were watched — with the straightness guard removed, and with the old
mode-style button put back.

**Not verified on a device.**

### A stroke can blacken what it goes round — OWNER DECISION

The editor's rail has a fourth button. With the fill on, the stroke being
drawn shows green on the canvas and the inside of what it goes round is
black; three points is the least that has an inside, and below that the flag
sits on the stroke and does nothing. Nothing else happens.
「塗りボタンオン。緑色の線が出現。三点以上の囲われた部分が塗られる。それ以上は
なにも起きない」

Green belongs to the editor and nowhere else. On a key, a tile, a card, in a
post and in the exported font, a filled stroke is the letter's own colour like
every other stroke — it is a shape somebody drew, not a marked-up one.

**Data.** A stroke may now carry `fill: true`, beside the `closed` and `k`
flags it could already carry. `docs/DATA_MODEL.md` writes the whole stroke out
for the first time. Nothing already stored changes: a stroke without the flag
is a plain line, which is what it has always been, and no migration runs. It
travels with the letter, so it is in the backup and in a post's ink without
anything being added to either.

**The font.** Every shape in this app has been a nib swept along a line, and
this is the one that is not. `glyphContours()` cuts the inside into triangles
and adds them to the sweep, rather than handing down one concave outline —
everything below it is allowed to assume its contours are convex and all wound
the same way, and that assumption stays true. A stroke that crosses itself has
no ear left at some point; the cut stops there and keeps what it has, so a
scribble inks most of itself instead of throwing the letter away.

**Deletion.** Nothing is deleted.

**Tested.** `tools/fill-check.mjs`, new, in `npm test`. It counts the pixels
the real drawing code blackens: a triangle inks 1393px drawn and 6544px
filled; two points have no inside and ink 648px either way; a self-crossing
stroke still inks; and after `geSave()` the flag is still there and the letter
draws the same 6544px. Three of those were watched failing — with the fill
dropped from `glyphContours`, and with `geSave` rebuilding its strokes without
the flag.

**Not verified on a device.**

### The pen is 24, and 24 is the ceiling — OWNER DECISION

The pen had been walked up to 40 to see what a page of somebody's writing
weighs, with a second thinner pen given to the editor's canvas so the lattice
stayed visible under a finger. Both are out. 「24が限界やね」

The reason is not weight. The lattice step is 36, so two strokes on adjacent
dots are one step apart, and a pen wider than the step welds them: two strokes
go in and one comes out, which is the app producing a letter that is not the
one somebody drew. Measured through the real drawing code at the size a post
is read at — 44px on a 3× phone, `tools/pen-gap.mjs` — pen 24 leaves white
between them; 28, 32 and 40 leave none. The answer "then draw them two dots
apart" was considered and rejected by the owner in the same breath, because a
letter with two dots between its strokes is a different letter.
「2あけだとだって書いた文字と別のもんができちゃうくない？」

That also settles the second pen. A wide pen buries the dots under your
finger, and a thinner editor pen was tried for exactly that — but a canvas
drawn with a different pen from the font is the same bug backwards: what is
under your finger stops being what comes out. One pen, everywhere.

**Behaviour.** None. `GPEN.width` was already 24; what is new is that 24 is
written down as a limit rather than a number somebody picked, with the
measurement beside it. Nothing may raise it without a decision.

**Data.** Nothing stored changes. Letters hold strokes, never ink — the pen is
applied when a glyph is drawn, so a change to it would have redrawn every
letter ever made, and this one changes nothing.

### A dot is a mark

Saving a letter dropped every stroke with only one point in it, on the
grounds that a line with one end is a line half-drawn. That is true of a
line, and it also meant a language could not have a dot in it: a letter that
IS a dot, and a dot placed beside a line, both came back as nothing every
time they were saved. 「点一つで点で。だって線にするには2で繋ぐ必要あるでしょ」

The pen already lays a dot down — one point is one square of ink, the nib
itself — so nothing about drawing had to change. What is still dropped is a
stroke with no points at all, which is the empty one the canvas opens and
nobody drew on.

**Data.** A letter's `st` can now hold a stroke whose `pts` has one point.
Nothing already stored changes, nothing is removed, and a letter saved before
today is unaffected — what it lost, it lost then.

**Deletion.** Nothing is deleted. This is the opposite: one thing that was
being thrown away is kept.

### A word made brings its forms with it

Rules that make a form (`docs/` chapter 13, `STG.fm`) could only be spent one
press at a time: a word's own page carried a row saying "make the 2 forms this
word has not got", and the rules screen a button making every one of them
across the whole dictionary. Both are after the fact — the word is already in,
and you go back for its forms.

So the forms are on the sheet the word is coined on. Type a spelling and every
rule that fits the draft's part of speech shows its form under 規則で作る形,
already spelled. Each row can be typed over, and each row has a minus. Saving
the word writes the rows that are left, as ordinary words.
「保存したら出る。消してたら消す。」

- **A form typed over wins.** Changing the head spelling re-spells only the
  rows nobody has touched. 「あくまで規則は作るのを楽にするためのツール」
- **A row taken off stays off** for as long as the sheet is open, even if the
  spelling is retyped into something the rule fits again.
- **Only where a word is being coined.** Editing a word that already exists
  shows none of this and changes none of its forms. 「あくまで追加したとき」

**Data.** Each form goes in as an ordinary word — `hw`, `sp`, `pos`, `at`,
`from` (the word it was made from) and `fm` (which form it is), which is
exactly what the row on the word page already wrote. An inflection takes the
parent's meanings and a derivation takes none, unchanged. Nothing is stored
about the sheet itself: the rows live only while it is open.

**Deletion.** Nothing here deletes. The minus is on a form that does not exist
yet, so there is nothing to remove. What was already true stays true and is
worth writing down, because it is what a person would fear: deleting a word
that has forms leaves every form alive as a word of its own, with the pointer
at the parent dropped and nothing else touched (`delWord`). A form deleted on
its own page deletes that word and nothing else.

**Plan.** No change. The forms count against the free 100 like any other word,
and the sheet refuses to add more than there is room for.

### A reading is chosen off sounds, and no letter appears where one is chosen

The word sheet carried a row of tiles under the box a word is typed into: one
tile per letter, and pressing one opened a page that drew that letter big and
offered the sounds it could read here. Two things were wrong with it and they
are the same thing. A tile is a LETTER, and the alphabet already joins a sound
to a letter — having both directions of that table in the app at once is what
made it unreadable 「音から文字と文字から音で二重になるから困る」. And a reading
cannot be typed: θ is on nobody's keyboard, and a sound you cannot hear is not
a sound.

So the sheet has one row — 読みの変更, with the reading on it — and it opens a
page that is sounds and nothing else: the language's own first, then the whole
of the IPA grouped by how each sound is made, with a search that matches those
words (「摩擦」 finds θ) and a back arrow that drops the last one. Every press
says the sound out loud.

**Data.** Nothing new is stored and nothing is dropped. A word still carries
`sp` — which letter is in each position and what it says there — and what is
typed on the page is cut into sounds and handed to those positions in order:
sounds left over after the last position join it (one letter reading two
sounds is ordinary), positions left over after the last sound fall silent (a
silent letter is ordinary too). The letters of a word are still changed only
by typing the word.

`spPageHTML`, `spRowHTML`, `spOdd`, `wdSetU`, `wdDropAt` and `wdBack` are
gone. `tools/shot.mjs` takes `--paid`, because this page is the paid plan's
and every picture until now was of the free one.

`buttons pressed` rises 7102 → 7884: a hundred and sixty tiles on a page the
fixture holds two faces of. The tiles that came off — the letter row on the
sheet, and the page for one position of a word — are in that number too, as a
fall the rise swallowed.

### The plans are the first row of settings

Settings → プラン opened a room holding a single row, which said the plan's
name and went to the plans page. On a dark phone that is a black screen with
one line at the top of it. The room is gone; the row is the first thing in
settings and goes straight to the plans. 「プランを設定の中に入れると課金導線が
カスだから一番上置くとか」 `set.plan.cur` is dropped from all ten languages.

### 基本形, not 元の語

Wording only, in all ten interface languages. The key does not move.

### The spelling box is in the person's own letters

It held the letters' names — a to z — and drew them in roman, which is what
those names look like and not what the word looks like.

### Deleting a word puts you back where you were, not on its page

Delete a word and the screen behind you was the word's own page, which then
had nothing to show: "that is no longer here". True, and not a place to be
put down on. Both of the deleted word's screens come off the trail now, so you
land wherever you were before you opened it — the dictionary, or the word you
reached it from.

`navDrop()` in `shell.js`, beside `navRename()`. `delWord()` no longer calls
`closeSheet()`, which steps back exactly one and so stepped onto the page that
had just been emptied.

Nothing stored changes: the word was already being deleted correctly, along
with everything pointing at it.

`word-check` holds it, and was watched failing both ways with the old
`closeSheet()` put back.

### Renaming a word no longer strands you on "that is no longer here"

Open a word, press 編集, change one letter of the spelling, Save — and the
screen you were taken back to said the word was gone. It was not: it had been
saved perfectly, under its new name. A word page is a route carrying the
spelling, the spelling is the only name a word has, and editing a word is
mostly editing that, so the trail behind you was still asking for the name the
word had a moment ago.

`wRename()` already went round telling everything that points at a word its
new name — the words derived from it, what means the same, what means the
opposite, the lines it appears in. The trail is one more thing pointing at it,
and now it is told too (`navRename()` in `shell.js`).

Nothing stored changes.

### A fourteenth check: `npm run word`

`tools/word-check.mjs`. press-check builds a screen, presses one thing and
rebuilds — it never presses two in a row, so nothing in the gate could reach
"open a word, edit it, save it", which is three. This drives the real
functions in the real app against the shared fixture and holds what happens
to where you are standing when the word under you changes.

It was watched failing with the rename bug in place: `renamed to tirara, and
the screen behind is {"r":"form","a":"word:tira"}`.

### One row shape on a word page

The class is `wdrow`, not `wrow`: `.wrow` is already the person row in the
timeline, which carries a negative margin so it can run the full width of the
screen. A second rule of the same name took that margin — the word page's rows
started 24px left of every heading above them — and gave the timeline's person
rows the word page's padding and press colour in exchange. Same mistake as
`.ntf` before it: a class named for what it holds, in a namespace with no
scoping.

The family stopped being framed cards, and that left three other kinds of
boxed thing on the same page: the fields the word belongs to, what means the
same, and what means the opposite, all drawn as bordered chips wrapping across
the column. A word with everything filled in was four different box shapes
stacked.

What means the same and what means the opposite are rows now, the same rows
the family uses — `wdRowHTML`, one builder for all of it. The fields are a
line under the part of speech and the register, because nothing there is
pressable and nothing there is a list being assembled.

The chips stay on the editing sheet, where a box is a thing you take back off.

Nothing stored changes.

### A sense number has a gap after it on the word page too

A word with more than one meaning numbers them. On a dictionary row the number
had a gap after it; on the word page it had none — `1to see`, the number
against the word. The rule was `.mn .sn`, scoped to the row, and the word page
does not have a `.mn` round it: one rule, two places, and only one of them was
being told. It is `.sn` now, and the gap is in `em` so it holds at both sizes
rather than being three pixels against two different fonts.

Nothing stored changes.

### The family is rows under a heading, not a stack of cards

「その四角で加工系やめない？」

The related words on a word page were the notices row — a framed box with the
word on one line and its meaning under it. Four of them stacked made the middle
of a word page look like a pile of things to be worked on rather than a thing
to read. They are plain rows now, one line each: what the form is called, the
word, what it means, with the whole row pressable and opening that word.

They are grouped: the parent under 元の語, then 活用, then 派生, then anything
carrying no label at all — which gets no heading, because a word with a parent
and nothing said about it has not been told which of the two it is, and
sorting it into one would be the app deciding.

`word.from` becomes `word.root` (a heading now, not a sentence) and
`word.fromf` is gone with the row that said it. Nothing stored changes.

### A word says when it was made and when it last changed, to the minute

「作成日時間は残す、編集日、時間も」

Two changes to the foot of a word page. It was stamped to the day, and the
changed line was dropped whenever the word had been changed on the day it was
made — "made today, changed today" being one fact written twice. To the minute
it is two facts, and a dictionary is built over months where the order two
words were made in on the same afternoon is part of how it grew. Both lines
are drawn now, always.

Nothing stored changes: `at` and `up` were already milliseconds, and `up` is
already stamped by `wdPutExtras()` on every save. A word made before this and
never edited shows the two the same, which is what happened.

### The card is reached by the share mark

「その、謎の四角の右上のマーク何？」「それは共有マークにしてよわかりにくい」

A framed rectangle stood at the top right of a word and on every example row.
It was a picture of a card, and a card is not a thing anybody is looking for —
getting the thing off the phone is. A post already used the share mark for the
same button; the word page and the example rows did not. One mark now, on all
four.

Nothing stored changes.

### A word says three things at the top, not two

「自作文字 / 読み / ipaもしくは音 じゃないの？」

The head of a word page showed the word and then its IPA, and the word itself
was drawn in the letters somebody made — so the spelling, which is what a
person actually types and what the whole dictionary is filed under, was
nowhere on the page. Three lines now: the word in the drawn letters, the
spelling under it, then the IPA and the speaker.

The middle line is drawn only when the top line is not already it. With no
font of one's own and no script standing in, `wOut()` gives the spelling back
unchanged, and printing the same string twice says nothing.

Nothing stored changes.

### One mark for sound, and it is a speaker

「再生ボタンやめて全部スピーカーボタンに統一しよ」

The triangle is the mark for a recording — press it and something starts.
Eleven of the twelve places it was drawn are not a recording: they are the app
saying a word out loud from the sounds its letters carry. The voice on a post
is the twelfth and is sound too, so it wears the same mark rather than being
an exception nobody would read as one.

The word's own is a plain mark now instead of a bordered box the size of a key
— it was the only sound button in the app wearing a frame, and a box beside a
word reads as something to press for a reason you have not been told.
「謎の四角も要らないマークとしてわからん」

### The dictionary is one row per word

「派生語もそれだけで単独のページ欲しくない？蛇腹で出るなら↓みたいなのほしいし、
単独があるならそこに出す必要ない」

A derived word was indented inside a frame under its parent in alphabetical
order and listed flat in every other order — two shapes for one list, and the
nesting only ever told the truth in the order where the parent happens to be
next to it. Sorted by when they were made, or narrowed to the verbs, the
parent may not be on the screen at all.

It is a page of its own now, carrying its whole family, so the list is one row
per word and a word on it is just a word: the headword, the reading, the part
of speech, the meanings. Nothing about the family — not where it came from,
not how many came from it. 「派生とか書かなくていいって、普通にそのままの単語と
してみれて、詳細で派生がどうなってるか確認できるって話」

`.entry.kid`, `.erel`, `.efrom`, `.ekids` and `words.kids` are gone.

### 品詞, 語形 and 文体 are rows that go somewhere, and say so

「↓だと蛇腹みたいに広がる感じしない？別ページから選べるなら違うマークの方が良く
ない？」

All three were a `<select>`, which on a phone is a wheel sliding up from the
bottom — the shape this app does not use — and the `∨` on it says the box is
about to unfold where it stands. They go to a page, so they are the settings
row the rest of the app already uses: what it is, what it is set to now, and
`›`. Three headings and three boxes became three rows.

Two screens for the two lists (`pos`, `reg`), the same shape the form picker
already had. The value is still staged on the sheet until Save, exactly as it
was — only where it is chosen has moved.

529 screens, 7102 buttons, 198/198 names.

### The `+` is on the heading, and the field it opens is not there until it is

「追加とかそういう日本語はなるべく消したいのよ。+とか編集は仕方ないにしても」
「+は下じゃなくて 意味　　　　+ とかじゃない？普通」

The buttons that said 追加 next to a field are gone, and so are the fields
they sat beside. What names the list carries the mark that adds to it —
`意味　　+`, `例文　　+`, `活用　　+` — and the field for one more appears when
that is pressed, then stays for the rest of the sheet, so a word with five
meanings is five presses of Enter and nothing else. `secAdd()` in `shell.js`
is the one place that draws such a heading.

Five lists: a word's meanings, its examples, a grammar stage's examples, and
both groups of form labels. The word survives as the `aria-label`.

A button that COMMITS a form still says what it does — the new-word sheet's
Add, and 項目の追加 on a stage of your own, which was briefly a `+` and is a
word again. That is the line: a `+` adds one row to a list already on the
screen; anything else keeps its verb.

`.btn` is 44 across at its narrowest now. A button whose whole word became a
`+` is as wide as the `+`, which on the narrower of two columns came to 38.

Still words, and untouched: 文字の追加, メモの追加, 子音の追加, キーボードを追加.

### 活用 and 派生 are two different things, and a language may add its own — OWNER DECISION

「tirorがウォッチャーになるのって何系の派生？」 It is not a form of `tir` at all
— it is a different word built out of it. An inflection is the same word in
another shape; a derivation is a new word. The list was one pile of both.

Two groups now, twelve each:

**活用** 過去 · 現在 · 未来 · 進行 · 完了 · 否定 · 命令 · 疑問 · 条件 · 使役 ·
受身 · 複数
**派生** 動作主 · 道具 · 場所 · 行為 · 性質 · 指小 · 指大 · 集合 · 反対 ·
形容詞化 · 動詞化 · 副詞化

**And a language may write its own, in either group.**
「活用と派生も好きに保存できたらいいよね」 What somebody types is kept as they
typed it and is never translated — it is their language. It is stored **on the
word**, prefixed with its group (`i~` / `d~`), and the labels a language has
are read back off the words wearing them. No list to keep in step, nothing to
migrate, nothing to delete.

**The whole set from wherever you are standing.** 「保存した瞬間そっちの単語でも
活用とか見れる」 A derived word used to show its parent and nothing else — from
歩いた you could not reach 歩いている. The section is the parent's whole family
now, on every word in it, and every row is a press. The heading is 関連語.

**A circled `?` beside every label.** 「これ全部横に？つけてどういう役割なのか説明
できるようにして」「⭕️？にして少し小さめでポップとして出してほしい。で、文字の横に
置いて」 One line and one example as a pop — 誰かにやらせる形 · 見る → 見させる —
and gone again, rather than a page nobody chose to read. The mark sits beside
the word it is about, not off at the edge of the row, so the label does not
stretch. On the ones we supply only: a label somebody wrote is theirs and the
app has nothing to say about it.

Choosing is a screen (`fm`), not a wheel: two groups and a field to write your
own is not something a `<select>` can be. The label is written onto the word as
it is chosen, the way a synonym is, so nothing about it is a draft.

**Stored:** `fm` is now a code out of `FM_INF` / `FM_DER`, **or** `i~`/`d~` and
the person's own words. Still deleted when empty and when the parent goes.
**Migration: none** — the eight codes that shipped this morning are all still
codes.

Free. It is text somebody typed, not a capability.

507 screens, 6650 buttons, 196/196 names.

### A derived word says which form of its parent it is — OWNER DECISION

「過去形とか未来形とか現在進行形みたいなの形変えたのも一括で見れたほうが良くない？」

A word derived from another already sat under it. What was missing is WHICH
form it is, so 歩く→歩いた and 歩く→歩く人 stood in one undifferentiated pile
under 派生.

**The label is on the link, not on the language.** The owner settled two things
and they are the whole design: the labels are ours to supply
（「ラベルはこっちで用意すればいいのでは」）, and no language declares a paradigm
（「型決めても英語みたいに変わってる可能性もあるやん」）. So nothing obliges a
word to have every form or any of them, and a form that looks nothing like its
parent — go / went — is just a word with a label on it.

Nine of them: 過去形 · 未来形 · 進行形 · 完了形 · 複数形 · 否定形 · 命令形 ·
受身形, and no label at all, which is what most derived words are.

**Newly stored:** `fm` on a word — a code out of `FM` in `www/wordsheet.js`,
never a label, the same rule `reg` follows, so the interface language changes
under a word without changing the word. Written by `wdPutExtras()`, which both
Save and Add call, and deleted rather than stored empty. A word with no `from`
cannot carry one: `fm` is a fact about a parent.

**Migration: none.** The key is new and optional; every word that exists reads
as a derived word with no label, which is what it is.

**On screen.** The word page's 派生 reads in `FM` order with the labels at the
head of each row and the unlabelled ones after them, and a derived word's own
top row says 「tir の過去形」 instead of 「tir から派生」. The sheet asks for the
form under 品詞, and only on a word that HAS a parent.

`.wfm`, not `.ntf` — `.ntf` is the notices row and the label came out on its
own line under a rule.

The fixture grew three words derived from `tir` (two of them forms, one not,
because that is the distinction the list draws) and two faces: a form being
edited, and a word read with its forms under it. Counts moved with them.

### 編集 is where a bar puts a button

「単語ページはタップしたら、詳細情報がまとまってる綺麗なページ。右上の編集押したら
今の編集画面に飛べるスタイルにしたい」

The word page was already the read page — it has been since 「開いた時は閲覧、編集
ボタンで編集」 — but its 編集 was a bar fixed across the FOOT of the screen, which
is what a screen you WRITE on does with its Save. Reading a word and writing one
looked the same from the thumb up. 編集 is now `openForm()`'s fifth argument, so
it sits in the top bar beside the word's name, and the read page ends where the
word ends.

Nothing else on the page moved, and nothing about a word changed.

Both walks were harvesting `FORM.html` and not the bar, so `act-check` reported
`openEdit` as an entry no screen names and `press` never pressed it — the
composer's Post button had been in the same blind spot since the day it was put
there. Both take `FORM.right` now: 193/193 names pressed, 6430 buttons.

### A keyboard cannot swallow the phone — OWNER DECISION

「高さやめて、フリックなら日本語のサイズ、qwartyなら無料版のサイズくらいまでにしな
いとキツくない？」

The height slider was a multiplier on the extension's own row height and
**nothing capped what the two of them came to**. Ten rows at 1.5 is 810 points
of keyboard on a phone 852 points tall, and iOS gives an input view whatever
height it asks for — so the app being typed into was pushed off the screen by
its own keyboard. Nobody had built ten rows yet; the app let them.

The slider is gone. **A row is one height** — the one the free QWERTY and a
Japanese kana keyboard are both already drawn at — and the extension caps the
total at 55% of the screen, so a keyboard built ten rows deep is squeezed
rather than swallowing the phone. Apple's own is about four tenths and a kana
keyboard about half; the cap is a ceiling, not an aim.

**Stored data.** `h` stays on the stored board and in the payload's shape,
unread. Nothing anybody set is thrown away, and a `Board` that refused to
decode an old file would be a keyboard that does not appear at all.

### Holding a key puts the keyboard in the state a home screen goes into

「長押ししたら右上に➖出てきて消えるようにしよう。iPhoneのホーム画面のアプリ移動さ
せる時と同じ挙動」

Holding already lifted a key to carry it. It puts the whole keyboard into that
state now: every key wobbling with a ⊖ on its corner, **Done** in the bar where
the ⋯ was, and a press that does nothing but the ⊖ — a key that opened its own
sheet from under a wobble would be two answers to one press.

Deleting from the ⊖ leaves the wobble on: somebody taking one key off is
usually taking two. From the key's own sheet there is still a sheet to close.

`kbWob` is not drawn until the finger comes up — a `render()` in the middle of
a drag takes the element being dragged out from under it. The ⊖ sits *inside*
the key: `.kb` runs to both edges of the phone so a key is the size it will
really be, and a mark hanging off the last key of a row hangs off the screen.

**Stored data.** None.

### Building a keyboard is choosing a letter and placing a tile

「キーボード設定まじでやりにくい」「1×1,1×2,1×3とかでいいんちゃう」

Two things, and both were three screens deep.

**Choosing the letter.** Press a key → the key's sheet → press the middle
square → the alphabet. That is the thing somebody does nearly every time they
open this, and it was the longest path on the screen. **The alphabet is on the
key's own sheet now**, first, under the key it is about. A board that flicks
still shows its five slots first — there the slot has to be chosen before the
letter, and that is a different question.

**Placing a key.** Add a key (one, at the end, one wide) → open it → choose a
width from a row of numbers `1 2 3 4`. **Three widths sit under the keyboard
now**: press one, then press where it goes. The tile is the width — a row of
numbers says how wide in a unit nobody has been told. Pressing the empty row
at the foot puts it in a new row.

`kbTake()` became `kbPut()` and is told where the letter goes instead of
reading a note left by whoever opened the sheet. `kbAddRow()` and `kbAddKey()`
are one path now — `kbAddKey` is no longer a name any screen says, so it is
out of `act-map.js`.

**Not done, and deliberately: height.** 2×1 needs a grid where a keyboard is
rows, which is a change to how one is stored, how it is handed to the
extension, and how the extension lays it out — plus a migration for every
keyboard that exists. The one real case is a return key spanning two rows.
「2の高さはめんどいから」

**Stored data.** None new. `w` on a key has existed since keyboards did.

### A keyboard has a name

「キーボード名変更できるようにして。キーボード1、キーボード2、キーボード3って名前
が初期」

A field at the head of its own page, and **Keyboard 1 / 2 / 3** where nobody
has typed one. It was a bare number, and a number is not a name — it is a
position, and it changes when one in front of it is deleted.

Board 0 is the free QWERTY, is not in storage and has nothing to write a name
on, so it has no field. `kbEdit()` says so and `kbSetNm()` obeys it.

**Stored data.** `nm` on a keyboard — the field has existed in the shape since
keyboards did and was never written to.

### Four shapes are banned, and the keyboard chapter is the first to lose them
— OWNER DECISION

「丸パッチ無限横並び、同じページに情報量詰め込み、ページ遷移型にせず下からひょい
って出すやつ、無駄に説明をするやつ。この辺禁止で ux を意識して作ってほしい」

1. No row of round chips you scroll sideways — if there are more than a few,
   it is a **list**.
2. The thing being chosen and the thing being changed are **two screens**.
3. Go to a page; do not slide something up over where you were.
4. No explanatory text (already its own decision).

The keyboard chapter had all four at once, so it is the first to lose them.
**It is a list**: one row per keyboard, each drawn as itself, the tick on the
one that is on the phone, and pressing it opens **that keyboard's own page** —
`kb` is the list and `kb:<n>` is one of them. The ⋯ moved to the page it is
about. `kbBarHTML()` is gone.

And a keyboard is **called** something now: its own name, or the arrangement
it was made from — QWERTY, flick, tap. The number is the last resort, for a
board from before patterns were recorded.

Every preview is the same box: the rows divide its height rather than each
being a fixed number of pixels, so three rows and seven rows are the same
rectangle. 「幅が違うの気になる」

**The other screens have not been swept.** The rule is in force from now;
each screen that still breaks it is its own task, not a licence to rewrite
them all in one commit.

**Stored data.** None.

### A keyboard is chosen by its shape

「マルパッチ禁止だからキーボード1,2,3とかの示し方ui変えてね」

The row was round patches reading 1, 2, 3 — which say which one is second and
nothing about which one is the flick board. It draws **the keyboard itself,
shrunk**: the real keys wearing the real letters, through the same `kbFace()`
the keyboard below is drawn by. 「リアルなキーボードを縮小して見せれないの？」
So what is being chosen between is what will be typed on.

`kbMiniHTML()` stays as it is and is still blocks, because it answers a
different question: on the sheet that makes another, what is being chosen is
the *arrangement* and there are no letters on any of them yet.

The tick still says which one is on the phone, and it sits **on** the picture —
beside it the tile would have to grow to hold a mark that is about the tile.

**Stored data.** None.

### Blocked means nothing of them is seen — OWNER DECISION

「ブロックは何も見えなくなるでいいんじゃない」

The feed already asked the server to leave them out, which is the only way a
block is a block. This is the other half — a post of theirs already on this
phone: `postAll()` drops them, so the timeline, a profile and a thread all
lose them at once; a thread reached by an old route answers "gone" rather than
showing it; the notices drop them; and the search drops them on both sides, the
person and what they wrote.

Never your own posts: a handle can be your own on a phone whose account
changed, and a block that hid your own writing would be the worst possible
reading of it.

**Stored data.** None new. **Tested.** `npm test` green, buttons 6241.

### Publishing and downloading, decided — OWNER DECISION, not started

The author decides what is public, per thing: the keyboard, the letters, the
words. **Downloading a keyboard or an alphabet is free; downloading a
dictionary is Plus.** Making and publishing stays Plus. A downloaded keyboard
goes on its own shelf, up to three, beside the three somebody built. **A
downloaded dictionary is never merged into your own language** — it is one you
can read, and `FREE_LIMIT` counts your own words and nothing else.

Written up in `docs/FEATURE_RULES.md` and `docs/FEATURES.md`. Nothing is built.

### Blocked means you see nothing of them — OWNER DECISION

「ブロックは何も見えなくなるでいいんじゃない」

The feed was the only place it reached. Now: `postAll()` — which every list of
posts comes from — leaves them out, a thread reached by an old route answers
"gone" rather than showing the post, the notices drop them, and the search
drops them on both sides, the person and what they wrote. The server half is
unchanged and is the important one: `netFeed()` asks for the block list first,
so their posts never arrive at all.

Never your own. `postBlocked()` checks `mine`, because a handle can be your
own on a phone whose account changed, and a block that hid your own writing
would be the worst possible reading of it.

**Stored data.** None new. **Tested.** `npm test` green; buttons 6286 → 6241,
which is Iri's posts leaving the two faces where the fixture has blocked her.

### Publishing and downloading, decided — OWNER DECISION

「キーボードdl、文字dl、単語のdl」「ファン層にdlして使ってもらえるように」

**Not started.** Written down in the decision log and in `docs/FEATURES.md` →
"What is left to do online": the author decides what is public, per thing;
downloading a keyboard or an alphabet is **free** and a dictionary is
**Plus**; making and publishing stays Plus; a downloaded keyboard gets its own
shelf of three and does not eat a built one; **a downloaded dictionary is
never merged into your own language** — it is a language you can read, and
`FREE_LIMIT` goes on counting your own words only.

Still open: whether a downloaded keyboard is edited in place or copied first.

### Blocking and reporting

「ブロック通報はつくって」 — and an app carrying other people's writing is
refused by App Store review without them.

**Server.** Two new tables in `supabase/schema.sql`.

- `block` — one-directional, and `block_read` answers with **your** rows only.
  Every other read on this server is `using (true)`; this one is not, because
  being blocked is not something a person is told, and telling them is how a
  block becomes an argument.
- `report` — a post **or** a person, at least one of the two, and a reason from
  a closed set. There is **no select policy at all**: nobody using the app can
  read a report, not the person who wrote it and not the person it is about.
  No update and no delete either — a report the subject can withdraw is not a
  report.

**A block the phone knows about is not a block.** `netFeed()` asks for the
block list first and the server leaves those authors out, rather than
downloading their posts and hiding them.

**App.** The ⋯ is on **every** post now, not only your own — the one post you
might need to do something about was the one with nothing on it. On somebody
else's it holds Block and Report; on your own it is the same three it was.
Blocking somebody stops following them: a list that says both is a list where
whichever one the timeline reads decides which is true.

`sides-check` gained two names in `ALLOW`, each with its reason: a menu is not
part of the post — it answers "what may I do about this", and that is about
me.

**Stored data.** `ME.bl`, the handles you have blocked, beside `ME.fo`.

**Tested.** `npm run rls` — 66 attempts by somebody who is not the owner, up
from 50: B cannot see that B is blocked, cannot read the report B wrote,
cannot block or report in somebody else's name, cannot edit or delete a
report, and a reason outside the five is refused. `npm test` green; screens
496, buttons 6286.

### Blocking and reporting

「ブロック通報はつくって」 — OWNER DECISION.

An app carrying other people's writing owes anybody two things: stop seeing
them, and say something is wrong. Neither existed — no table, no policy, no
screen.

**Server.** Two new tables in `supabase/schema.sql`.

- `block` — one-directional, and **`block_read` answers with your own rows
  only.** Not `using (true)` like every other read here: who has blocked whom
  is the one thing on this server that is nobody's business but the person who
  did it, and a policy that let the blocked party read it would make being
  blocked something they find out.
- `report` — **no select policy at all.** Nobody using the app can read one,
  not the person who wrote it and not the person it is about; it is for
  whoever is looking at the dashboard, and a person who could read reports
  could work out who reported them. No update and no delete either: a report
  that can be withdrawn by the person it is about is not a report. `why` is a
  closed set of five, checked by the schema.

**The timeline asks the server.** `netFeed()` fetches the block list first and
hands the server `author=not.in.(…)`. A timeline that downloaded their posts
and then hid them would be a block the phone knows about and the server does
not, which is not a block.

**The ⋯ is on every post now**, and it is not the same menu: yours holds pin,
edit and delete; somebody else's holds Block and Report. It was on your own
posts only — so the one post you might need to do something about had nothing
on it.

**Blocking somebody stops following them.** A list that says both is a list
where whichever one the timeline reads decides which is true.

**Stored data.** `ME.bl`, the handles you have blocked, beside `ME.fo`. The
account's, not a language's.

**Tested.** `npm run rls` — 50 attempts became 66. B cannot see that A blocked
them, cannot block in A's name, cannot lift A's block; nobody can read a
report, not even its author; a reason outside the five is refused, and so is a
report about neither a post nor a person. `npm test` green — screens 486 → 496,
buttons 5992 → 6286.

`sides-check` gained two names in ALLOW with the reason written out: the menu
is not part of the post. Everything else below that line answers "what does
this post say"; the menu answers "what may I do about it", and that answer is
about me.

**Not tested.** Nothing on a device, and **the report goes nowhere anybody
looks yet** — reading them is a dashboard job.

### No explanatory text in the app — OWNER DECISION

「お前もうアプリ内に説明書くの禁止な」

Gone: `plans.intro`, `plans.note`, `set.theme.note`, `ws.kind.note`,
`ab.cell`, `langs.more`, `kb.locked`. And `LANG_MAX`, whose only reader was
one of them — the fact it carried is in `docs/FEATURES.md`.

Not touched: empty states, counts, states, errors, and the `?` sheets.

**One left in, and it needs settling.** `cap.lapse.d` is the line that says a
dictionary dropping back to a hundred words has had **nothing deleted**.
Taking it out leaves the app silently truncating a list with no word about the
data, which `docs/DATA_SAFETY.md` is written against.

**Stored data.** None.

### The plans screen says what the difference is

「設定のプランはもっとちゃんと出そうよ。全部同じように並んでてどうやってうるんや」

Three identical cards — same box, same weight, same button, one price each —
is the screen answering "here are three things" where somebody is asking
"which one, and why".

- **Monthly or yearly.** The four prices were decided on 2026-08-14 and only
  two of them were on the screen. A year is on it now, with what it comes to a
  month beside it, because that is the number somebody actually compares
  against. Two months free is arithmetic, not a claim: 99.99 ÷ 9.99 is a
  little over ten.
- **Free is not one of the cards.** It is what everybody already has, so it is
  a line at the foot. Beside two things that cost money it made "nothing" look
  like an option being sold.
- **Plus carries the weight**, because Plus is where the making side opens —
  and Studio is written as what it ADDS rather than as a second full list.
- **The lines are what `CAN` opens**, and they were not. They said "mass-
  produce words", "linking shown and read aloud", "CSV in and out" and did not
  mention letters, writing systems, keyboards, sounds, grammar stages or the
  direction — which is six of the ten things Plus actually buys. Cloud storage
  is still not on the list: it is a Plus feature in `docs/FEATURES.md` and it
  is not built, and a paid screen promising something the app cannot do is the
  app lying to somebody who is about to pay.
- `.ph2` is a button everywhere else, so a plan's name arrived wearing a
  border, a fill and a radius. A heading is not a thing to press.

**The wording is not settled by me.** The lines say what each plan opens and
nothing more; how it should SOUND is the owner's.

**Stored data.** None. Nothing can still be bought — there is no StoreKit code
and the note at the foot says so.

### Searching finds people, and posts when you ask for them

「人だけにして」「⭕️ @〇〇 lingua マーク　フォローする」
「ツイートの検索は検索ボタン押したら出てくる。それまでは人」 — OWNER DECISION.

Typing searched POSTS unless the query began with `@`, so looking for a person
meant knowing to type a character first — and what a search on a timeline is
for, before you know anybody, is finding people.

- **People while you type.** `snsMode` starts at `who` and goes back to `who`
  the moment anybody types.
- **Posts when you press Search.** The field carries `enterkeyhint="search"`,
  so the phone's own return key says Search, and pressing it is what asks.
- **A person's row is two controls.** Pressing the person opens their page;
  pressing Follow follows them and leaves you where you are. It was one button
  with a chevron, so the only thing you could do with somebody you had just
  found was go and look at them. Your own row has neither.

**Stored data.** None. `ME.fo` is the follow list and already existed;
`meFollow()` is unchanged and is still the one place that writes it.

**And it asks the server.** 「必要なものは全部オンラインまとめてやる」 The seam
is gone: `snsMatchWho()`, `snsMatchPosts()` and `snsWho()` are deleted, and
`netFindWho()` / `netFindPosts()` are what answer.

- **People**: `profile`, matched on the handle and the display name, with the
  language's name embedded — `language_read` answers with what has been
  published and with your own, so an unpublished language is nobody's business
  and simply does not arrive.
- **Posts**: `post`, matched on `body->>ln` (the line as it is spelled),
  `body->>mn` (what it means) and `body->>lname` (the language it is written
  in). Not on the shapes: a shape is not something anybody can type. **This is
  every post on the server, not the ones this phone happens to hold** — which
  is what "search past posts" has to mean.

`ilike` either side, because case is not something a person typing a name
thinks about. The three characters PostgREST reads as syntax inside `or=(…)`
are taken out of the query rather than escaped.

**Nothing found and could not ask are two different answers.** The result
carries `bad` when the request failed and the screen says what it says, rather
than showing the same empty page either way.

**Stored data.** None. **Server.** No schema change: `profile_read` and
`post_read` are already `using (true)`.

### The composer is one screen — with the keyboard up

「この中に1画面収めてうごかないようにしてほしい」「キーボード込みでに決まってるやん」

The line, the gloss, the meaning and the row that adds a photograph all have
to be on screen **while somebody is typing**, which is the only time the
composer is looked at. Three things were in the way:

- **`100dvh` does not shrink for the software keyboard.** It slides over the
  page. `vvFit()` reads `visualViewport` — the one thing that knows — into
  `--vvh`, and re-reads it whenever that changes. `--tabgap` goes with it: the
  bar at the foot is fixed to the *layout* viewport, so with the keyboard up
  it is behind the keyboard and there is nothing to leave room for.
- **The field grew with its text.** `.view.fit` is a form that is one screen:
  the field takes what is left after everything under it has had its height,
  and scrolls inside itself. `lnFit()` leaves a `fitin` field alone.
- **A field was wearing a post's rules.** `.dir-ttb-*` sets `width:100%` and
  `max-height:340px` — that is how a column of somebody else's post wraps and
  where it sits. On a field the cap meant the flex line could not grow past
  340, which is why the meaning and the pictures sat below the fold with empty
  space above them.

Both directions, vertical and horizontal.

### The third row has no hole in it

「2があった分謎に隙間できたから無くして」

The row was `[nothing(1), z…m(7), delete(2)]` — ten across, so the columns line
up with the rows above, at the price of a key-wide hole at the left. With the
layer key gone from the bottom row that hole was the only empty space on the
keyboard. The delete takes it instead: three wide, hard against the right
edge, still ten across, and the one key you hit without looking is now the
easiest one to hit.

**Stored data.** None, in either.
**Not tested.** `visualViewport` behaves differently in WKWebView than in the
walk. **The phone is what settles it** — open the composer, start typing, and
see whether the picture row is still there.

### A letter on a key stays on its key

「文字がずれてる」 — reported more than once.

`GlyphView` scaled a shape to the view's **height** and then centred it on a
square of the view's **width**. Those are two different numbers on every phone
ever made: a key is about 35 points across and 54 tall, so a letter was drawn
54 wide inside a 20-wide box — about seventeen points over each edge, into
its neighbours, and off the end of the row at both ends.

A key is scaled to `min(width, height)` now and centred on both axes. A LINE —
the candidate bar — is unchanged and must be: there the height IS the em, the
width is the letter's own advance, and `dx` says where the ink starts inside
it. One expression covers both, because for a line the two are the same
number.

`KeyBoardView` took its inset off the height too, which left the shape a strip
of the width to stand in. Off the smaller side now.

**Nothing holds this.** It is Swift, there is no Swift on a Linux runner, and
`assets-check` only knows whether the file is in the build. **The phone is the
only thing that can say it is fixed.**

**Stored data.** None.

### Nothing adds a page to the free QWERTY

「無料で作ったキーボードは動かせなくしろって言ってんだろ？」
「2ページ目設定してねえのに2が出てくんだよ」 — OWNER DECISION.

Board 0 was made uneditable and `shareKbd()` went on editing it: on a
syllabary, an abugida or a logography it appended a roman conversion face and
**pushed a key to it into the free QWERTY's bottom row**. So a keyboard with
no editor grew a second page out of a setting on another screen, and the key
wore `2` because a roman face has none of the person's letters to wear.

The conversion face is now added only to a keyboard somebody **built**.
Applying the free QWERTY means typing on the free QWERTY.

**Tested.** `conv-check` walks every writing system on **both** boards now —
ten combinations where there were five — and holds two new claims about the
free one: it goes out with exactly one face, and it carries no key to another
page. Watched failing with the guard removed (syll, abugida and logo all went
red on the free QWERTY, three ways each).

### The composer is written in the language's own letters, and its own direction

「自分の言語で出せ、向きも縦向きになってないけど」

The field was flat and roman above a post that came out in columns of drawn
shapes — so what you were writing and what you had written were two
different-looking things. `.sfont` is what puts the drawn letters in a field
and it was on every other one; `dirFlat()` was collapsing the language's
direction to a horizontal one before the field ever saw it.

A column is typed into now. `lnFit()` measures the **width** when the
writing-mode is vertical, because that is the way a column grows, and the
field is pushed to the side its columns come from with the rule on that side.
`dirFlat()` still stands for the card, which is a landscape composition and
has nowhere to put a column.

**Not tested.** This is a `textarea` in `writing-mode: vertical-rl`, and the
reason it was not one before is that the caret and the sizing were judged not
to work in WKWebView. It works in the walk and in Chromium. **The phone is
what settles it** — type a line, delete from the middle, and watch where the
caret goes.

**Stored data.** None, in either.

### A post that has not reached the server says so

「spl流したのにまだ投稿載らんの？」 — and nobody could answer it, which is the
bug. `netPush()` was handed an **empty failure function** in both places that
call it, so a post the server refused looked exactly like one it took: the
timeline drew it, nothing was said, and the only place the truth was written
was somebody's dashboard.

Two things now:

- **The row says it.** A post of yours that is public and has no `sid` — the
  server's name for it, which `postSid()` is the only thing that writes —
  wears a mark beside the time, next to the lock and the pin. `ICON_UNSENT`,
  drawn like everything else.
- **The send says why.** `pwSendWith()` passes the failure to `toast(netWhy())`
  instead of throwing it away. Here and not in `postCatchUp()`: this is the
  moment somebody pressed the button, and the retries happen behind a timeline
  being read and must stay quiet.

**Nothing is lost either way.** The post is in `POSTS` before any of this and
`postCatchUp()` goes on trying. Nothing is deleted, and no post is held back.

**Stored data.** None. `sid` already existed and already meant this.

**Tested.** `post-check` writes posts with no server to reach — which is the
honest case, not a contrived one — and asks whether the row says so. Watched
failing with the mark removed. `npm test` green.

**Not tested.** Nothing on a device, and the actual cause of the reported
symptom is still unknown: the app will now name it.

**The likeliest cause, for whoever reads this next.** `post.author` references
`profile(id)` (`supabase/schema.sql`), so an account with no `profile` row has
every post refused on a foreign key. `is_member()` only asks whether somebody
is signed in, so it does not catch it.

### The bottom bar is five marks and no words

「下タブにホームとかつけるのやめない？絵文字だけ」

The label went beside the icon first, then under it. It is gone: five
drawings, and the name is on each button as its `aria-label`, so nothing is
lost to somebody who cannot see the drawing. `pageName()` is still the one
place a tab is named.

The pill comes down with the words — 52 to 46, which is still clear of the
44pt floor `press` holds every target to — and `--tabh` with it, 72 to 66,
because every screen's foot is measured from that. The bar is 58px tall
where it was 64.

**Stored data.** None.

### The timeline asks who you are — OWNER DECISION

「なんでログインしてないアカウントで投稿できんの？そんなsnsどこにあんの？」
「だからなんで最初からオンライン前提で作れっつってんだろ」

**A post has a writer.** The three sns tabs and the composer were built when
there was no server: a post was an object in `localStorage`, it had nowhere to
go, and nothing ever asked whose it was. The server has asked from the first
day — every write in `supabase/schema.sql` goes through `is_member()` — and
only the app never did. Signed out you could write a post that went nowhere,
to a timeline nobody else was on. Nothing threw, so nothing said.

**What changes.** `vFeed()`, `vExplore()` and `vNotif()` answer with
`snsLocked()` when there is no session — the app's **own door**, `obDoorHTML()`,
so signing in on day one and signing in from the feed are one screen rather
than two that could drift. Without "continue without an account": `obSkip()`
means "go and draw a letter", and somebody standing in the timeline has a
language already. `openPost()` refuses and sends you to the feed, because a
form is a route and a route can be come back to.

`obFormHTML()`/`obDoorHTML()` take a `skip` argument for that. `obIn()` no
longer sends somebody who is already inside (`SET.done`) to onboarding step 1
when there is no recorded place to go back to — the timeline's door is the
screen itself, so signing in leaves you standing on the tab you were on, which
now has a timeline in it.

**The making side is untouched.** A language is made on this phone with or
without an account. `SET.anon` still means exactly what it meant; the line on
the door stays and its comment now says what it buys and what it does not.

**Stored data.** None. No post is touched, moved or removed. Posts written
while signed out stay where they are and go up when there is a session, the
same as before — `postCatchUp()` is unchanged.

**Tested.** `post-check` drives the real `vFeed()` and the real `openPost()`
with the session taken away: no post rows, the door is there, the composer does
not open. **All three watched failing with the guards removed** (6 posts drawn,
the wrong screen, the composer open). `npm test` green; screens 477 → 480,
buttons 5938 → 5955. `tools/fixture.mjs` signs in — the timeline does not exist
without a session, so the DOOR is the face that now needs saying out loud, and
the account room's two faces swapped which one is the entry.

**Not tested.** Nothing on a device.

### The keyboard's setup steps point at the thing to press

「なんで写真も渡したのに並べるだけなの？」

The `?` sheet had two steps with **both** photographs stacked under the
second — so the step reading "turn on Full Access" carried a picture of a
different page, the one you have to go through to reach it, and neither
picture said which of its rows was the one.

**One step is one tap, and one tap is one photograph.** Four steps now — tap
Add New Keyboard, choose Lingua, tap Keyboards on Lingua's page, turn on Allow
Full Access — each with its own picture, and the row to press **ringed on the
photograph**. The mark travels with the photograph: `KB_SHOTS` is a table of
file → where that row sits in that file, so a photograph taken again is one
entry to change rather than a mark baked into a JPEG.

Two new photographs, `www/img/kb-list.jpg` and `kb-add.jpg`. Step 1 is still
the only one that carries a path rather than a button, because Apple gives no
public door to that page; the button is on step 3, which is the page it
actually lands on.

New strings `kb.step3` and `kb.step4` in all ten languages; `kb.step1` and
`kb.step1.d` name the tap and the path to it rather than the whole journey,
and `kb.step2` is choosing Lingua.

**Stored data.** None.

### The first keyboard is the free QWERTY, and it cannot be edited

「1つ目の無料のqwartyは編集できないようにしてくれ。plusから無料に戻った時に
キーボードなくなるやろ」 — OWNER DECISION.

Board 0 used to be a **copy** of the free QWERTY, written into `KB.kbs` the
first time anything on the keyboard screen changed, and that copy was
editable. Editing it is how the keyboard somebody types on disappears: the
edited board 0 is what goes to the phone on Plus, and the day the plan lapses
`kbOf()` answers `kbFixed()` again — a different keyboard, under the thumb of
somebody who changed nothing.

So board 0 is now the free QWERTY itself: `kbBoards()` puts `kbFree()` in
front, storage holds only the boards the person **built**, and `kbEdit()`
returns null for board 0 — one place saying no, which every mutator asks
rather than thirty places each remembering to. Coming back down to free now
changes nothing at all.

**What changes on screen.** On Plus, board 0 shows the same face the free plan
gets: the keyboard with nothing to press, no layer rail, no height slider, no
key sheet, and no Delete behind the ⋯. What stays is the row of keyboards, `+`
and Apply — choosing it is the one thing anybody does to it. `KB_MAX` still
means three keyboards in total, so two can be built rather than three.

**Stored data.** `lingua.<id>.kb` no longer holds the free QWERTY at index 0,
and carries `v:2` to say the change has been made.

**Migration — `migrateKbFree()`, and it copies.** The old array's first entry
is looked at rather than assumed:

- still the free QWERTY (`kbSameLay` against `kbFixed()`) → it is regenerable
  and board 0 **is** it, so the redundant copy comes out. Nothing is lost.
- edited → it is a keyboard somebody made. It **stays**, as an ordinary board,
  and `KB.at` moves by one with it, or the keyboard on the phone would
  silently become its neighbour.

Runs from `boot.js` (both on launch and after a restore) and from
`langOpen()`. `v:2` is what stops it running a second time and taking the
person's own first board out as though it were the copy.

**Tested.** `npm test` green. `backup-check` now asks `kbStored()` rather than
`kbBoards()` — what came out of the FILE is what was built; `kbBoards()` is
what the screen shows, which puts the free QWERTY in front and answers nothing
at all on the free plan. `tools/fixture.mjs` gained a face for board 0 on a
paid plan, and its three editor faces now build a board first, because opening
a key of board 0 is now correctly nothing. Buttons 5956 → 5938.

**Not tested.** Nothing on a device.

### A word is what the bar offers, in the letters it was written in

「単語は必要でしょ。アルファベットじゃなくて自作文字が欲しい。順序は単語ファースト」
— OWNER DECISION.

`shareConv()` has always written the word table into the file the extension
reads — every word under its own spelling, pointing at its letters' shapes.
`Compose` only ever read it **on the roman face**, and an alphabet has no
roman face. So for every alphabet and every abjad the table was written,
handed over, and never once looked at.

On a face of the person's own letters the bar now shows the words that
spelling begins, in the drawn letters, **first** — and the run being typed
last, so it is always reachable. The roman candidate is gone.

**One consequence, and it is not cosmetic.** Space no longer commits the first
candidate on the letter face. The run is already in the document there, and
the first pick is now a word it might be completed to — committing it would
turn every `li ` into `lingua`, which is the keyboard rewriting text somebody
had already finished. On the roman face space commits exactly as before.

**Stored data.** None. The payload does not change; what changed is which
faces read a table that was already in it.

**Tested.** `npm test` green, `conv-check` unchanged and still green.
**Not tested.** Nothing on a device — this is Swift and needs a build.

### Which face holds its text back is the face's to say, not the language's

「キーボード押しても自作文字でないキーあるし、出ても2文字目打ったら変換全部消える」

`Conv.romanKeys` in the extension answered "are these keys roman?" from
`conv.how` — what the writing system is. **A writing system does not type; a
face does.** A syllabary's board carries the person's own letters on face 0
AND a roman face at the end, and only the second of the two spells at
something. So on a syllabary, an abugida or a logography every face held its
text back and looked its keys up as a roman spelling:

- press one of your own letters → **nothing goes in the document**, and the
  bar offers the one word that letter begins
- press a second → nothing goes in either, and the bar **empties**, because
  two letter names in a row are not a spelling of anything

Both halves of what was reported, one cause.

`shareKbd()` writes **`rom`**, the index of the roman face, because where it
lands depends on how many faces the person built and the app is the only thing
that knows. `Board.rom` carries it, the controller sets `compose.onRoman` on
every build — which is every layer change — and `Compose` asks that instead of
`how`. An alphabet and an abjad have no roman face and no `rom`, and nothing
about them changes.

`conv-check` claim 6 gained the pair: `rom` names the face that carries the
`rom` keys, and is absent when no face does. Watched failing — point `rom` at
face 0 and all three writing systems that need a roman face go red.

**Data.** One number added to the file handed across the App Group. Nothing
stored on the phone changes. **A build is needed** — this is Swift as well as
`www/`, so the fix is not in anybody's hands until the extension is rebuilt.


### Signing in does not walk you through the onboarding you already did

「普通にログインしてるのに言語の名前とidきめさせられた」「あるのに出てきた」

The sign-in screen lives inside the onboarding and nowhere else, so opening it
from Settings means saying the onboarding is unfinished — `SET.done=false`,
written to storage. What said that was temporary, and where to go back to, was
`OB_BACK`, a variable in memory.

So anything that reloads the page between opening the door and finishing with
it — the app killed, WKWebView reclaiming its storage, coming back an hour
later — left the phone carrying the lie and nothing carrying the note. Signing
in then found no way back and did what the onboarding does next: step 1, draw a
letter, name the language. To somebody with a whole language already on the
phone.

It is `SET.obback` now, written by `obBackTo()` in the same `save()` as the
`SET.done` it undoes, cleared by `obReturn()`. The lie and the note saying it
is a lie live or die together.

**And the door has a way out.** The chevron appears at the sign-in screen when
there is somewhere to be out to, and takes it. Without it, opening the door
from Settings and changing your mind left the app you already had as an
onboarding you could not leave.

**Data.** `SET.obback` is new and is the one thing in `SET` meant to be
short-lived — a pending move, not a preference. `docs/DATA_MODEL.md` says so.
Nothing else stored changes.


### A forgotten password can actually be replaced

Asking for a reset ENDED at a line saying 「送りました」. The mail arrived and
carried a **link**, because that is what Supabase's Reset Password template
says — and a link has nowhere to land: this is a Capacitor app with no web page
behind it, so tapping it opens nothing. The signup mail hit the same wall and
was answered with six digits; this one had not been.

The door has a face for it now: the code and the new password on one screen,
one press. Two calls behind it — `netRecoverCode()` verifies with
`type:'recovery'`, which buys a **session**, and `netSetPass()` changes the
password of whoever holds one. Nothing asks what the old password was, which is
the point: they forgot it. It ends signed in rather than back at the door
typing the password chosen a second ago.

One screen and not two: the code and the password arrive in the same minute out
of the same mail, and a code typed on one screen with a password on the next is
a second place for the code to expire in.

**The dashboard has to change with it.** Authentication → Emails → Reset
Password must say `{{ .Token }}` instead of `{{ .ConfirmationURL }}`, exactly
as the signup template already does. Until it does, the mail carries a link and
the screen has nothing to be given. `supabase/mail.md` carries the text.

`ob.mail.send` said "Send the link" in English. It sends a code.

**Data.** The password is not held, stored or logged here, the same as
everywhere else in `net.js`. What is kept is the token pair, in
`lingua.sess`.


### schema.sql is one thing to run, and stays one thing

`ERROR: 42501: must be owner of table objects`. Two statements in the file need
to OWN `storage.objects` / `storage.buckets` — the `enable row level security`
lines — and Supabase no longer grants that role to the one the SQL editor runs
as. Landing in the middle, the error took the whole half of the file after it
with it, so `notices()` and `account_delete()` were never made.

Those two are the only statements in the file that need ownership, and on a
hosted project they are not needed at all: Supabase switches row level security
on for storage before anybody runs anything. They are attempted inside
`do $storage$ … exception when insufficient_privilege` and a refusal is
swallowed with a notice. Everything else — the bucket and the three policies —
is an ordinary statement that runs on both.

A first attempt at this put the bucket and the policies inside the block too,
which made the answer two procedures: run the file, and if it says so, do the
storage part again by hand in the dashboard. That is the thing this file exists
not to be. 「なんで二個あんねん一本化しろ」 One file, one run, on a hosted
project and on the plain PostgreSQL `tools/rls-check.mjs` stands up — where the
role owns those tables, the two lines run, and all 50 attempts by a second
person are tried as before.

**Data.** Nothing stored changes; this is the shape of one file.
### A list says which side of the language it goes into

**OWNER DECISION.** 「文字に入れるか単語に入れるかきめさせたら？」 → 選んだ方だけ
に入れる. The import screen carries a two-way choice at the top — 単語 / 文字 —
and a file goes into the dictionary **or** into the alphabet, never both. The
column roles are the ones that side has: つづり・意味・品詞・音 for a word list,
文字・音・名前 for an alphabet.

It used to be decided per ROW: a row carrying a character was a letter and
every other row was a word. That is a guess about what somebody's file *is*,
made from what the columns look like, and it is the one guess in the reader
that cannot be seen being wrong — a dictionary of one- and two-letter words
reads as an alphabet, and nothing on the screen said the words had gone
somewhere else.

The guess still runs and still picks the side; it now picks a thing sitting
there being switchable. Switching translates the roles rather than re-guessing
— a spelling and a character are the same column asked a different question,
and so are a meaning and a name; a part of speech has no answer on the letter
side and is dropped. `imp.into` is a new key in all ten languages;
`impSetInto` is in `act-map.js`.

**Data.** Nothing already stored changes. What changes is where a NEW import
lands: a file that today would put some rows in the alphabet and the rest in
the dictionary now puts all of them where the person said. Undo is unchanged.

### A letter on a key slot is the letter, not a block of ink

「文字設定したらこうなるけど？」 Choosing a letter for a slot on the key editor
drew a solid white rectangle.

The slot's canvas was the one place in the app a `.tc` is shown without a CSS
size. A canvas with no size lays out at its own default width, `inkCanvases()`
sizes the bitmap to whatever it measures, and a glyph drawn to fill a 900px
square inside an 82px button with `overflow:hidden` is the middle of a stroke —
a block. Nine other places show a `.tc` and every one of them says how big it
is.

`.kbe canvas.tc` is 42px, `.kbec` (the middle, which is 1.5fr) is 62px, and a
borrowed character gets a size too. Watched with the bug put back: the same
letter on the same screen does not appear.

**Data.** CSS only.


### Nothing is written inside a box on the word sheet

「文体のふつうってなんだよ」 The register's empty code was labelled ふつう /
Neutral and offered as one of the five answers — the app naming the state of
nobody having said anything, and then putting that name where the answer goes.
It is an empty row now; `regLabel('')` returns nothing and `word.reg.none` is
gone from all ten languages.

The rest of the sheet went the same way, which is the same instruction as the
one before it and should have been done then: 分野 held an example of a field,
語源 an example of an etymology, メモ said メモ, and an example's meaning said
意味. Each has a heading directly above it saying what it is. All four move to
`aria-label`, so the box is empty and a screen reader still says what it is.
`word.tags.ph`, `word.ety.ph` and `word.note.ph` are gone from all ten.

The first field of an example still shows two of the person's own words. That
is their data showing the shape, not the app writing in their box.

**Data.** Markup and interface strings. `reg` is stored as a code and always
was; nothing about a word changes.


### A field is a line, not a box

「かくまるみたいなのでくくるのやめて欲しい。基本下線だけ」

Every place text is typed says it the same way now: no fill, no frame, no
corner radius, one rule underneath, gold while it has the cursor. Eight rules
carry it, because eight kinds of field grew up in different chapters — the
spelling line (`.lnin`), `.field` (input, select and textarea), the `@` handle,
the example row, the meaning row, the note body, the search bar, and the one
name typed in the onboarding.

Buttons keep their shape. A thing you press has to look pressable, so the rule
is about what a field is, not about every rounded corner in the app.

**Data.** CSS only.


### A word is typed at the head of its own sheet

**The field is the head of the sheet, beside the play button.** 「再生の横から
入力できるようにしろ」 It sat four rows down, under a heading, with the word
repeated above it as text nothing could touch — so writing a word meant reading
it at the top and typing it in the middle.

**The play button is the icon and nothing else.** 「再生って日本語で書くのやめろ」
It said the word for "play" beside a triangle, in a row where every other
control is a shape. The name is on the button as `aria-label` for anybody not
looking at it. Both faces of the sheet: the one a word is written on and the
one it is read on.

**Nothing is written inside the boxes.** 「四角のなかにつづりとか読みとか書くの
消して」 The spelling box said つづり under a heading saying the same thing, and
the meaning box said 意味を追加 under 意味.

**The 読み row is gone.** It said 読み and then the IPA, which is the value the
head of the sheet already shows directly under the field — the same thing twice,
four lines apart. `wdReadHTML()` is deleted and `wdSeqHTML()` (the paid plan's
row of letters) no longer ends with a copy of it.

The 音 heading goes with the field it was over. `word.sounds` and `word.mn.ph`
are removed from all ten languages; no screen asked for either any more.

**Data.** Nothing stored changes — this is one screen's markup.


### A roman letter reads what the IPA says it reads

**`IPA_WAS` in `www/ipa.js` is the roman letter → IPA symbol table, and five of
its answers were wrong.** 「cはcとは読まんやろ。だからipa基準って言ってんの」

`c` `q` `x` `y` fell through to the letter itself, which in the IPA is a
palatal plosive, a uvular plosive, a velar fricative and a close front rounded
vowel — four sounds nobody naming a letter means. They are `k` `k` `k` `j` now.

`g` is the one that could not work at all: the IPA's g is U+0261 and a plain
ASCII `g` is in no chart, so a letter named g carried a "sound" that is in no
inventory, that `ipaRoman()` spells as nothing and that `voice.js` cannot say.

`ch` was the same defect one step along. The chart has no affricate row, so
`tʃ` was a single symbol that is not on it — `chi` came out as `i`. Every
value in `IPA_WAS` is a **list** of chart symbols now, and `ch` is `t` then
`ʃ`; `phGuess()` concats rather than pushes. Checked both ways: with the
bug back, `chi` gives `tʃ` off the chart and `gogo` gives two off-chart
`g`s; with it fixed, no roman letter a–z lands anywhere but on a real symbol.

**Data.** Nothing stored changes. `phGuess()` is only asked for a word that
carries neither a spelling nor a saved `ph` — a word from before the chart, or
one imported without sounds — and it is asked live, so those words read
correctly from now on instead of carrying a symbol nothing could use. No word,
letter or sound is written, moved or removed.

### An imported letter says it went into the alphabet

`IMP.done` counted words and letters as one number, so a file carrying letters
said "{n} words in" and somebody who imported one character went looking for it
in the word list. 「1文字登録したのにどこに入ってるかわからない」

It is `nw` and `nl` now, and the screen says each: 「{0}語 入りました」 for the
dictionary and 「{0}文字 アルファベットに入りました」 for the alphabet. `imp.donelt`
is a new key in all ten languages. Undo is unchanged — it already put letters
and words back separately.


### A sound does not join a letter, and the ? sheet has photographs

**The phonology page shows the letters that say a sound and does not press
them.** It had them as buttons onto the letter, which is a second direction for
one fact — and one direction for that fact is the whole reason the old sound
chapter was closed. 「音に文字つけて文字にも音つけられたら訳わからなくなるだろ」

What the page does is put a sound into the language and take one out. Joining a
sound to a letter is the letter's, in one place. "Which letters say this" is the
question a phonology asks, so they are shown.

**The two photographs are in.** `www/img/kb-app.jpg` and `kb-full.jpg`, both
under the second step: the button lands on Lingua's own page in Settings and
Full Access is one tap further in, under Keyboards — which is a sentence, and is
two pictures.

`assets-check` learned that **a `.js` may name an asset.** Only index.html can
load a script, which is why that file alone is the list for scripts; a
photograph is named by the code that shows it. Still one rule — a file in `www/`
that nothing anywhere names is a file nobody can see — and what changed is where
the naming may be. Watched failing with a file nothing names.


### The first page of somebody's keyboard is their keyboard

`shareRomLay()` put the roman conversion face **first**, on the argument that
somebody who made a syllabary types on it almost always. What that produced on
the phone: an alphabet somebody had drawn, switched on in Messages, opening as a
plain roman QWERTY. 「1ページ目これになるのやめてくれない？1ページ目が自作の
キーボードなんだから」

It is the last face now, reached by a key on the person's own first face. The
argument was about keystrokes; the answer is about what the thing is.

`conv-check`'s sixth claim is rewritten to match and gained a half it did not
have: **something must reach it.** A face at the end that nothing points at
cannot be used. Watched failing — take the key away and all three writing
systems that need a roman face go red.

### A word is typed, a part of speech is chosen, and the sounds have a page

**The word sheet has one way in.** Under 音 were two grids — the alphabet and
the sounds — with a rail between them, so the screen where somebody writes a
word offered three ways to write it. 「キーボードだけでいいだろ。音と文字二つ
あるの意味がわからない」 The field is the way in, on both plans; the keyboard puts
the letters in it. What is left under the field is not input — free sees what it
reads, a paid plan sees the word as its letters and can open one to change its
sound in this word, which is the only thing there the keyboard cannot do. An
empty word shows no tiles.

**A part of speech is a choice, not a row.** Twelve tabs scrolling sideways
became one button that says which and opens the list, with a count beside each
kind. 「品詞スロットも横に並べるのじゃなくてタップしたら品詞を開いて選べるタイプに」

**イディオム is one of them**, last but for "other". It is a kind of entry rather
than a part of speech, and it is on that list because it is chosen and filtered
in the same places — a second list beside it would be a second thing every screen
has to know about.

**The plan is out of the account.** An account is who you are; a plan is what you
may do, and they are settled by different things. It is a room of its own on the
settings list. 「アカウント内にプラン入れるのやめてくんね？」

**The sounds a language is built from are a chapter again, and it is Plus's.**
「音韻を細かく決めたい人だっているだろ。plusで復活」 What was closed was a second
place to give a LETTER its sound; that is still done on the letter. This is the
inventory as a thing in itself — every sound, and which letters say it — which is
the question a phonology is and which no letter can answer alone. A sound nothing
reads is not an error; it is a phonology partway written. Taking one out is
refused while a letter still reads it, and names the letters.

On free the inventory is filled in as letters are named and nobody is asked, so
the chapter is not there. 「plus以外はもう音も文字も決まってる状態」 It is the last
chapter but for the AI, so paying does not renumber the book.

**No new data.** `SND` has been the ninth slice since the chapter closed, because
the spelling engine reads it. It stopped being a place you go, and this is that
place again.

`buttons pressed` falls 6307 → 5991: two grids gone from the word sheet, and
twelve filter tabs gone from the dictionary, on every render of each.


### A list that arrives comes in, and the words on the screen say what they mean

**A word with no reading is still a word.** `impPut()` guessed a word's sounds
from its spelling with `phGuess()`, which throws away everything that is not
a–z — so a list written in the person's own letters, in kana, or with a mark in
it came out with no sounds, and the row was **dropped**. Silently: no message,
no count, nothing to notice except that the dictionary was still empty
afterwards. 「単語入ってないけど。全く。」

The word goes in without a reading now, and the screen afterwards says how many
came in that way. Watched failing: with the old line back, a list of `kano` /
`あお` / `ké-ru` brings in one word instead of two.

**The keyboard's `?` is two steps.** 「キーボードの設定方法」 for a title, one
step with the path Apple gives no button for, one step with the button. The
heading that ran off the screen, `初回だけ`, `フルアクセスが無いと、あなたの文字を
読めません`, `文字を渡しました` and `もう1枚` are gone — with them `kb.out.*` and
`kbOutSay()`, which said whether the letters had been handed over and said it in
four ways nobody asked for.

**Settings**: 見た目 → 画面表示, 読みの表示 → 発音表記. **Search**: 「つづり・意味・
読みで検索」 and 「つづり・意味で探す」 are both 「検索」. A field with a magnifying
glass in it does not need to list what it searches.

**The memo button is a ＋** like every other "make one" in the app. It was a
notepad glyph, which says what the page is about rather than what the button
does. `ICON_NOTE` is deleted.

**Grammar**: 名詞 → **複数**, 動詞 → **時制**, つなぐ → **接続詞**, and their
descriptions with them. All ten languages.

**Particles are not every language's.** 「助詞がない言語もあるんだから、助詞が最初
からあるのおかしいだろ」 The stage is out of the default fifteen and into
`STAGES_IF`, which appears the moment there is an answer in it — a note, a rule,
an example, or merely having been opened. **A language that used it keeps it and
nothing anybody wrote goes anywhere.**


### Six things wrong with the keyboard, four of them mine

**A flick keyboard had no flicks.** `kbBlank()` emptied a key's letter and
emptied its four directions with it, so choosing Flick produced twelve keys
with nothing to flick to — a tap keyboard wearing another name.
「フリックにしたのにフリックできない」 The slots are part of the ARRANGEMENT,
which is the half a pattern is for. They stay, and they stay empty.

**And an empty flick slot now shows.** A faint dot at each of the four edges,
on a board that flicks and nowhere else. Twelve blank keys looked identical to
a tap keyboard, so choosing Flick appeared to have done nothing at all.

**The rows did not line up.** Every row divides the whole width among its own
keys, so a row adding up to nine has keys a ninth wider than one adding up to
ten. 「キーボードずれた。文字サイズとか小さくしていいからずらさないで」 Every row
of the fixed QWERTY comes to **ten** now: the nine-letter row is inset half a
key at each end and the seven-letter row a whole key, which is where a phone
puts them. `! ? space return` is 1 + 1 + 6 + 2.

That needed a key that is not a key. `kbGap()` — it holds width, draws
nothing, does nothing pressed, and travels to the extension, because taking it
out on the way would put the columns back out of line on the phone.

**A QWERTY key was offered four flick squares.** The key sheet drew the
five-slot cross for every letter key. It draws one square on a board that does
not flick, and five on one that does — or on a key that already holds a flick,
because that key has one whatever the rest of the board does.

**Adding or deleting a keyboard left you on the sheet.** Both were pressed on
a sheet and both called `render()`, which redrew the sheet. `kbGo()` lands on
the chapter.

**A layer could be added and never removed.** `kbDropLay()`, beside the row of
faces, never the last one. A key that WENT to the face being removed is pointed
back at the first — silently renumbering it to whatever is now in that slot is
how somebody presses 2 and gets 3.

**And the contents page had a "9" beside the keyboard.** It was the number of
keys. 「意味がわからないから」 `kbKeys()` is deleted.


### The last four: liking, deleting, following, and what happened to you

`www/net.js` has no empty seam left.

**`netMark`** writes one row in `react` or takes it away. Not a count — a count
is what the server adds up, and two phones sending counts is how a number goes
backwards. A post that never went up cannot be liked on a server that has never
heard of it, and that is not an error worth showing anybody.

**`netDrop`** deletes the pictures and the voice **first**, then the row. A row
deleted before its files leaves files nothing points at, and "which files does
nothing point at" is a question with no cheap answer. If the files will not go
the row still does: a post somebody asked to be gone must go. The paths are
named off the post rather than searched for.

**`netFollow`** takes a handle, because a handle is what one person knows
another by, and looks the id up in the one place that has to.

**`netNotices`** is one request and not four. A notice list is one list in time
order, and a phone asking separately about likes, boosts, replies and follows
would be sorting a page it does not have all of.

**Newly on the server: `profile.av`, and a `notices()` function.** The face is
what a notice draws when there is no post to take one off — a follow has none
at all. It is not what a post wears: a post's face is frozen onto it when it is
written and does not change when this does.

`notices()` merges the four in time order and **runs as whoever calls it** — no
`security definer`, so every row it can see is one the policies already allow.
Your own doing is not news: `actor <> auth.uid()` on each of the four.
`npm run rls` holds that it is not `security definer`; that is the ninth shape
check.

Written down and not done: `profile.av` is set when the account is made and
does not follow the face afterwards. `docs/BACKLOG.md` says why.


### The photographs and the voice go to Storage

A picture is not a field of a post. Half a megabyte each, and a timeline of
fifty posts carrying their own is forty megabytes downloaded to draw six —
which is not a timeline, it is a wait. So a post carries the **path** and the
bytes live in the `post-media` bucket. 「Xとかインスタとかと同じ動きにしてね」

`<author uuid>/<post uuid>/0.jpg`, which is the write rule in
`supabase/schema.sql` — you may write under your own uuid and nowhere else.

**The row's id is made on the phone.** `netUUID()` — v4, from
`crypto.getRandomValues` where there is one. The pictures have to be uploaded
under the post's name, and a name that arrives after the upload means
uploading twice or moving files. Bytes first, row after, one insert.

**Newly stored on a post: `pu`, the paths of its pictures, and `vu`, the path
of its voice.** Both only on a post that has gone up. `pics` and `vo` are
untouched and are still what this phone draws from.

**Order is the feature.** `postPics()` answers with what is on THIS PHONE
first, so a post somebody just wrote draws instantly with no network; only a
post that arrived from elsewhere falls to `pu` and fills in as it loads. That
is what X does and is the whole of why it feels like X.

`postVoAt()` is the one place that decides where a voice is — `vo.f` on this
phone, `vu` from anywhere else — and `voPlay()` tells them apart by the slash,
which it can do because `voName()` has always made the name in one place. A
voice from the server is played from its URL rather than downloaded whole
first.

A picture that will not upload is dropped from **that post's list** and does
not stop the post. It is still on the phone; nothing here removes anything. A
post that refused to exist because a photograph failed would be a post lost to
a tunnel.

`tools/dead-check.mjs` learns `atob` and `btoa`.


### A post goes up, and a timeline comes down

The first two of the six empty seam functions in `www/net.js` have bodies.
Text only: the photographs and the voice are bytes and go to Storage next.

`netPush` writes one row in `post` and answers with the server's id for it.
`netFeed` reads the newest fifty back, and for the followed timeline asks for
the follow list first — two requests and not a join, because there is no
foreign key from a post to a follow and the follow list is people rather than
posts. **Reading needs no account**: `post_read` is `using (true)`, so the
recommended timeline works with the publishable key alone.

**Newly stored on a post: `sid`, the server's uuid for it.** Not its id —
rewriting an id would move a post out from under every reply pointing at it,
and the phone is allowed to have posted something the server has never heard
of. A post with no `sid` is one that has not gone up, which is the whole of
the retry.

`postTake()` now recognises a post by **both** names. A post this phone wrote
comes back down the timeline wearing the server's id; without the second line
every post would appear twice the first time somebody pulled the feed after
writing one.

**`postCatchUp()` sends up what is already here.** 「あげよう」 Oldest first, so
a thread goes up in the order it was written and a reply finds its parent's
`sid` already there; four at a time, off the back of a timeline pull rather
than on a timer — the moment somebody is looking at a timeline is the moment
the network is known to be working. Nothing is removed and nothing is
rewritten. A post kept to yourself never goes, which is the same door
`pwSendWith()` uses.

`netSend` now sets `Prefer: return=representation` on every write to a table,
in one place, rather than at the one call site that needs the new row's id
today and the second one that is forgotten tomorrow.

**Nothing works until `supabase/schema.sql` has been run once**, which is the
owner's, in the SQL editor. Until then every push is a 404 and every pull is
empty — which is what the screens already draw.


### The server learns about replies, likes and the bytes

`supabase/schema.sql` had `post`, `quote` and `follow` and has never been run.
Four things were missing before it could be, and running it twice means hand-
patching the difference, so they go in first.

**`post.reply_to`** — a column and an index, not a field of `body`, because a
thread is read by asking for one. `on delete set null` and not cascade: deleting
a post must not delete the answers to it, and a reply already carries the handle
of whoever it answered (rule 13), so it goes on saying who it was for.

**`react`** — one row per person per post per kind (`like` / `boost`), which is
what the primary key says, so pressing twice cannot count twice. **No count is
stored**: the number under a post is `count(*)`. Two phones sending counts is how
a number goes backwards. No update policy — a reaction is on or off.

**Storage, and this is the one that changes what a post IS.** A post's pictures
are data URLs on the phone. They may not go into `post.body`: a four-photograph
post is most of a megabyte of base64, and a timeline of fifty is forty megabytes
downloaded to draw six. 「Xとかインスタとかと同じ動きにしてね」 is a sentence
about how it feels and a sentence about where the bytes are, and they are the
same sentence — X fills the pictures in as they arrive because a picture is a
URL.

So: a bucket `post-media`, public to read, and the write rule is the first
folder — `post-media/<author>/<post>/0.jpg`, and you may write under your own
uuid and nowhere else. Checked with a `like` rather than with
`storage.foldername()`, because that is Supabase's own function and this file
has to be runnable, and testable, against a plain PostgreSQL. No update policy:
an overwrite is how somebody else's post quietly changes under them.

The letters drawn on a photograph are inside the jpeg before it is uploaded, and
nothing about that changes.

**`npm run rls` grew from 34 attempts to 50, and from 5 shape checks to 8.** The
harness now stands up a `storage` schema — two columns and a name, which is all
schema.sql says about it — and a second bucket, so "you may not write into
another bucket" is refused by the policy rather than by a foreign key. Every new
policy was watched failing: taking the uuid out of `media_make` turns *A cannot
put one under B* red.

**Nothing is applied yet and no data has moved.** `www/` is untouched: the six
seam functions in `net.js` are still empty, and every post is still
`localStorage`. This is the shape being made ready, not the feature.


### A key is a square with five places on it

「だからキーボードをカスタマイズする画面がゴミだって言ってんだろ」

The sheet that opens on a key was a form: a row saying "Press", then four rows
saying Up, Right, Down, Left, each with the word "none" beside it. Five lines of
text about a square with five places on it — so the one thing a person has to
hold in their head, WHERE each letter is, was the one thing the screen would not
show them.

It is the key now, drawn the size of a hand: the middle is what it types, the
four edges are what it gives when a finger slides off. Which is where they are
on the key itself, one screen back. The words Up and Right are gone; the up slot
is up. An empty slot is dashed rather than filled, so four empty ones do not read
as four keys somebody made. A key that is not a letter — space, delete, new line,
layer — is one square rather than five, because it has nothing to flick to.

### A key can be a new line

「改行もいるだろ」 The kinds a key could be were letter, space, delete and layer.
A keyboard that cannot start a new line is a keyboard nobody can write a message
on, and the omission was invisible because none of the five patterns puts one
there either.

`ret` is the fifth kind. It wears the return arrow, and on the phone it commits
whatever is being spelled first — the same as space, because a buffer left
standing would be matched against the next line's text.

**And the free plan's QWERTY has one.** The bottom row was `!` space `?`, with
the two marks standing at the ends of the bar and no return anywhere on the
keyboard. It is `! ? space return` now — the marks moved together to the near end
to make room. 「改行入れるか無料も。！？スペース　改行」

That row is what the free plan IS, so it is worth saying exactly what moved: the
ten / nine / seven above it are untouched, the delete is still two wide, the
digits are still the person's own, and nothing was added to or taken from the
twenty-eight slots.

### The line saying which keyboard is on the phone is gone

「今これが端末に入ってますとかいらねえって言ってんだろ」 When the keyboard being
looked at was the applied one, the screen said so in a line of grey text — under
a row of tabs where that keyboard already wears a tick. Now it says nothing: the
Apply button is there when there is something to apply and absent when there is
not. `kb.on.now` is out of all ten languages.

### The keyboard chapter is a keyboard

「このページは最悪です。pcみたいな使い方本当に無理」「ここの説明とボタンも嫌だ」
「行を出す層を足すも使いづらすぎる」「しかもキーボード保存もないし、保存先から
選べるとこもないし」「文字だけで縦に4つ並んでるのも嫌」

Six things, and they were one screen.

**The first keyboard is the one you already have.** With nothing built, the
chapter answered with the five patterns and nothing else — no list, no tick, no
Apply — so somebody who had just paid was shown a blank chooser for a keyboard
they had been typing on for a week. It existed the whole time: `kbOf()` has
answered `kbFixed()` all along. `kbBoards()` now says so, and the screen opens
with a keyboard rather than a chooser for one.
「qwertyは無料版で組んだやつが1としてもう保存されてる状況だって」

Not written to storage. The board appears the moment a paid plan opens the
chapter and is written the first time something is changed — `kbEdit()`, which
is where owning it begins. A screen that writes on being looked at is a screen
that changes the language by being visited.

**A second keyboard is a shape, not a filled-in one.** A pattern gave every key
a letter, in alphabetical order — the app writing the keyboard and leaving
somebody to correct it, which is most of a keyboard's work done wrong.
`kbBlank()` empties the letter keys and their flicks; the layer keys, the space
and the delete keep being themselves. 「それ以外2つ目作るときは形だけ」

**An explanation is a `?`, not a paragraph.** `HELP` in `home.js` is where a
screen registers what it has to say — `HELP.kb = function(){…}` — and `helpQ()`
puts the mark in the bar. The keyboard chapter's heading, its two steps, the
Full Access sentence, the Open Settings button and the handover state all moved
into that sheet. Nothing was reworded; where it is shown changed.
「これから説明が必要なときは？マークつけて表示でちゃんと説明させるようにして」

**A switch, not the word ON.** `swtHTML()` — 51×31 with a 27 knob, iOS's own —
replaces `set.yes`/`set.no` on "A letter on each key". It is the first switch in
the app; the other settings rows are unchanged.
「トグルをつけろって言ってんだろオンオフのカタカナやめろよ」

**A row is added where a row goes.** The dashed `+` under the last row adds one;
the `+` above the keyboard adds a face. The two buttons at the foot of the
screen are gone.

**Deleting is behind the ⋯.** "Delete this keyboard" and "Start over" were two
red lines in a stack of four at the foot of the chapter. They are in a sheet off
the end of the row of keyboards now, the same place a post keeps its three. What
is left on the screen is the keyboard, one switch and one button.

No data changes. `lingua.<id>.kb` holds exactly what it held, is read exactly as
it was read, and nothing is written that was not written before.

### A key has a height, and so does a row

「マス目の大きさもカスタマイズできるように」 A key's width has been the person's
since the editor existed. Its height was 52 points and nothing could touch it, so
a keyboard of four rows of big flick keys and one of six thin rows were the same
keyboard with different letters on it.

One number, for the whole keyboard: a slider directly under it, which moves the
keyboard as the thumb moves rather than after. A multiplier rather than points —
a point is a different size on an SE and a Pro Max, and what is being chosen is
how big a key feels.

A number per ROW was built and taken back out the same day. 「行の高さは固定で
いいのでは？」 Rows are the same height as each other on every keyboard anybody
has ever used, and four more things to set per row buys a keyboard that will look
like every other keyboard afterwards. It never shipped, so nothing has an `rh` to
read.

**Newly stored:** `h` on a keyboard, optional. Absent means 1 — a keyboard built
before this, a backup written before this and a payload handed over before this
all say nothing about height and come out exactly as they were. **Newly handed
over:** the same `h`, and the extension clamps it to the range the slider has.

Swift: `Board.h`, and `place()` scales by it. **Not device confirmed** — Swift
does not compile here.

### The draft is beside Post, not at the foot of the screen

「だから save a draft を底に置くのやめろって」 It was a row at the bottom of the
composer — two outlined buttons across the width, under a screen that is mostly
empty, so the thing you press after writing was the furthest thing from where
you were writing.

It is in the top bar now, next to Post.

**One control, never two.** The bar is 390 points wide and already carries a
back arrow, the screen's name and a filled button, so there is no room for both
"Save a draft" and "3 drafts" — and there is no need: with something typed there
is a draft to save, and with nothing typed there is no draft to save and the
only thing worth offering is the ones already there. Which of the two it is
follows `pwHas()`, the same question Post asks, and is repainted as you type.
Editing a post that already exists offers neither: an edit is not a draft.

`buttons pressed` falls 6288 → 6257. Two buttons became one, on every face of
the composer the walk renders.

No data changes. Nothing about what a draft holds, or when one is written,
has moved.

### A letter on the candidate bar stands where the font would stand it

「キーボード内のプレビューのアルファベットいちいち全角のスペース開くのうざい」
The bar was laying every letter out in a square cell — right for a key, right
for a tile, and wrong for a line, so two narrow letters sat a whole cell apart
and a word looked spaced out.

The rule already exists in one place: `inkAdv()` in `glyph.js` — ink plus one
step, half a step at each end, so the gap is one step whichever two letters
meet. Rather than write that arithmetic a second time in Swift, `shareFace()`
asks `inkAdv()` and carries the answer.

**Newly handed over:** each face in the App Group file gains `aw` (what the
letter takes up standing beside the next one) and `dx` (where its ink sits
inside that), both in box units, both optional. A face with no shape carries
neither, and a payload written by an older build has neither — Swift falls back
to the square in that case, which is what every face got until now: worse
spacing, never a crash. Nothing in `localStorage` changes and no existing field
moves.

`aw` and not `w`: a key already has a `w` — how wide it is in its row — and
`shareKey()` writes that over whatever the face put there, because in this file
a key and the face it wears are one object. Two different widths cannot share a
name.

Swift side: `Face` gains `aw`/`dx` and `Key` carries them too (pressing a key
makes a face, and that face goes on the bar, which is a line — an alphabet's bar
is made of nothing else); `GlyphView` gains an optional `dx` and draws a line
when it has one and a square when it does not; `CandidateBar` steps by each
face's own advance instead of by the cell.

**Not device confirmed** — the four Swift files cannot be compiled here.

### The composer draws the line once

「キーボード内にプレビューあるからいらないやろ普通に」 Under the field was a
second copy of the line being typed, drawn again in the letters somebody drew.
It was written before the system keyboard was, and the keyboard has one now —
the candidate bar shows the run in your own shapes as you press, one row closer
to the thumb than the preview was. Two of them is the composer saying the same
thing twice and taking a screen's worth of room to do it.

`pwPrevHTML()`, the `#pw-prev` element, the patch `pwSetLn()` made to it, and
the `.pwprev` rule are gone. The field, the gloss row, the counter and the
meaning are untouched, and so is what `pwSend()` writes.

No data changes.

### The second kind of button is not a box

「文字書いて四角で囲ったみたいなボタン全部やめてくれ。ダサすぎる」 There are
twenty of them — add a row, add a meaning, choose a photograph, clear the
conversation, save a draft — and they were all one class, so they are all one
change.

`.btn.ghost` was a rectangle with a hairline around it and grey text inside.
It is the words now, in the colour everything pressable in this app is. The
padding stays: 44pt under a thumb is not a matter of taste, and `press`
measures it.

No data changes.

### Paying does not change the keyboard you were typing on

「plusにした瞬間にこれだわ。何も設定してないならqwartyの作ったやつ引き継いで、
設定したらそれになるようにしてよ！」 Correct, and it was a real one: on a paid
plan with nothing built, `kbOf()` answered with `kbDefault()` — the letters five
to a row, with a layer key — while the free plan answers with `kbFixed()`, the
QWERTY wearing the drawn letters.

They are different layouts. So the moment somebody paid, the keyboard handed to
the extension was swapped for one they had never asked for and had never opened
this chapter to build. Nothing was lost, but the keyboard under their thumb in
Messages was a different keyboard.

`kbOf()` and `kbBoard()` now answer with `kbFixed()` whenever nothing has been
built, on any plan, and `kbEdit()` starts from it too — so the first edit does
not begin by moving thirty keys. What a paid plan adds is the editor and the
other four patterns; what it may not do is take away the keyboard that was
already there.

Which is `docs/PAID_FEATURES.md` said one more way: a plan decides what a person
may DO. Fewer buttons, never fewer words — and never a different keyboard.

No data changes.

### A button opens Settings, instead of a path to retype

「そのiPhoneに入れられますって設定じゃ無くてボタン押したら追加する画面まで進め
られないの？」 Half of it, and the half that is possible is the half that
matters.

The chapter opened with two numbered lines of `Settings → General → Keyboard →
…` to read off the screen and retype. One of them is now a button.
`LinguaShare.settings()` opens `UIApplication.openSettingsURLString`, which is
Apple's one public door and lands on **Settings → Lingua** — the page with
Full Access on it, the switch without which the keyboard cannot read a single
letter somebody drew.

**Adding the keyboard cannot be linked to.** Settings → General → Keyboard →
Keyboards → Add New Keyboard has no public URL; the `App-prefs:` scheme that
reaches it is private API and an app that ships it is rejected. So that one
step stays a sentence — one, under the button, marked as the first time only.

No data changes. Swift, so nothing in `npm test` can press it; what the checks
hold is that the button resolves and that a browser, which has no bridge, says
nothing rather than throwing. **Device confirmation required.**

### A language holds three keyboards, and one of them is the one on the phone

「まずはqwartyかフリックかタップとかキーボードのパターンを選べて」
「キーボード3つくらいまで作れるようにして適応推したらlinguaのキーボードが
入れ替わるとかできるの？ページじゃない」

The editor had everything except a place to start. A key already opened onto
what it types, its four flick directions, its width, and where it sits in the
row — but the only layout to start from was "the letters, five to a row", so
anybody who wanted a QWERTY was moving thirty keys by hand.

**A keyboard is made from a pattern.** Five, and each is built out of the
language's own letters rather than out of roman ones:

| | |
|---|---|
| QWERTY | 10 / 9 / 7 and a row of digits — the free plan's layout, editable |
| Flick | twelve keys, four directions on each: sixty letters on one face |
| Tap | one letter per key, five to a row — what the only starting point used to be |
| Chart | consonants down, vowels across — a syllabary writes syllables, and this is the shape of that |
| ABC | in name order, ten to a row |

**And a language holds up to three of them.** They are not layers: a layer is a
face of one keyboard, switched by a key on it. These are separate keyboards,
and **one of them is applied** — that is the one `kbOf()` answers with, so it is
the one `share.js` hands to the extension and the one on the phone. Editing does
not move it. You can build the next keyboard without disturbing the one you are
typing on, and press Apply when it is ready.

**Stored data: `lingua.<id>.kb` holds `{kbs:[…], at}` where it held `{lay:[…]}`.**
A keyboard that was saved before this becomes the first of the three, by
**copying** its `lay` across — nothing is rewritten and nothing is dropped. A
file written before this restores the same way, because the reader takes either
shape.

**Nothing here is removed when a plan lapses.** The free plan reads `kbFixed()`,
which is built from `LETTERS` every time it is shown and stored nowhere, so the
three sit untouched through a lapse and are there again on the day it resumes.
Fewer buttons, never fewer words.



「リキッドグラスはちゃんと後ろの画面透けさせるようにしてよ」 The tab bar is the
one thing in this app made of glass, and it was a tinted panel: at .40 over a
30px blur what came through was a colour, not a shape. Somebody scrolling a
photograph under the bar could not tell there was a photograph under the bar.

The surface is thinner — .20 in the light theme, .16 in the dark — and the blur
is 16px rather than 30. The blur is the part that matters: past about 20px
everything behind resolves to an average, so a bar can be genuinely transparent
and still show nothing. `saturate` stays, because it is what keeps the colour
underneath alive at that alpha.

The `@supports` fallback is untouched: a webview that cannot blur still gets
`--glassop`, a solid surface, rather than a transparent bar with the page
legible through it.

No data changes.

### A photograph is one box, filled, and tapping it opens the whole thing

「投稿のサイズ感も気になる」「写真の画質が下がったり、比率変わるのはありえない」
「何があっても画面の33パーに収めたい」「画像サイズが違うのが嫌なの表示上の」
「xと同じって言ってるやんずっと」

All of it is how a photograph is DRAWN. Nothing here does anything to the
stored picture.

What was wrong: **`width:100%`** blew a 900-pixel photograph up to the 1000
pixels of a phone column, which is what "the quality dropped" looks like —
nothing was thrown away at that moment, it was drawn bigger than it is.
**`max-height:60vh`** let one post fill a phone. And the several-photograph
case had a box while a single one did not, so one picture and four were two
different rules and only the first was ever rendered by anything.

**One box, the same for every photograph on every post, filled.** A third of
the screen's width, square. The picture is never stretched and never squeezed —
`object-fit:cover` scales it and shows the middle — and what does not fit is
off the edges. **Tapping it opens the whole thing**, on a route of its own:
`photo`, argument `<post>:<index>`, because a post carries up to four and "the
photograph" is not a thing a post has.

Three shapes were possible and the owner picked this one by name. Written down
because the other two are what a session would reach for: a box every picture
fits *inside* leaves the box showing around anything not square, which is a
wide photograph presented as a square one; and no box at all — one height,
width from the picture's own shape — keeps every pixel and makes every
photograph a different size on the screen.

`--picpct` is the one number and it is a plain `33` rather than `33vw`, so
`press` can read the same number the CSS does. A size written twice is a size
that will disagree with itself.

**What still reduces quality, and it is not new: the stored picture is 900px on
the long edge at q0.72.** The ratio is untouched — the same factor goes on both
edges — but the pixels are thrown away when the photograph is chosen and cannot
come back. That number is a **data-safety** number rather than a picture one: a
photograph lives in the same `localStorage` the language does, one is about
87 KB as text, and a whole free language is 25 KB. It is written up in
`docs/FEATURES.md` for a decision rather than changed.

`press` holds two claims — every photograph in the same box, and the box filled
with `cover` — and they are two questions because `fill` would pass a box check
and be a squashed photograph, and `contain` would pass it and be a wide
photograph sitting in a square. It could hold neither before: the fixture's
photograph was a single transparent pixel, which looks exactly the same
stretched as it does left alone. It is a real 900×600 picture now, made in the
page at the size and quality a real post carries, and a face carrying four of
different shapes is walked. The bug was put back and 24 rows went red.

Two more were caught by that check rather than by looking: a flex row stretches
its items, so an `<img>` with `height:auto` was pulled tall and squashed
sideways to obey its `max-width`; and a strip set by height alone put the first
picture half off the screen.

No data changes.

### The timeline is two: For you, and Following

「ツイートはフォロー中とおススメみたいに分けたいよね」 One timeline was
everything there is, which is the right screen for arriving and the wrong one
for keeping up with the four people you actually read.

Two tabs at the top of the feed, the same strip the profile already uses. **For
you** is everything; **Following** is the people this account follows, and your
own posts are in it — a timeline of people you follow that leaves you out is one
you cannot see yourself having spoken in. Following is matched on `p.hd`, the
handle frozen on the post when it was written, not on anything read back out of
the present.

They are two **questions**, not one list filtered twice, so `netFeed` takes
which one it is being asked for: `netFeed(which, ok, bad)`. On a server these
are two queries with two answers, and a phone that asked for everything and
then hid most of it would be downloading a timeline in order to throw it away.
Until there is a server the answer to both is what is already here.

No data changes. Which tab you are on is where you are standing, so it is in
`viewReset()` with the profile's.

### Nothing stops the music, including a recording

「音楽はいつのタイミングでもとめないでほしい」「これだけでストレス」 The launch
fix below left one interruption standing, and it was not called out clearly
enough: a microphone needs a different audio category from a speaker, and
switching categories is exactly where somebody's music goes if the mixing
option is not carried across.

`LinguaShare.audio(mode)` is new and is the only place either category is
written down. `www/rec.js` says `record` before it opens the microphone and
`play` from `voStreamOff()` — which is every path out of a recording: the
recorder stopping, a recorder that would not start, one that could not be
built, and the microphone being refused. The record category carries
`.mixWithOthers` across, with `.defaultToSpeaker` because `.playAndRecord`
otherwise sends everything to the earpiece.

**What is not promised.** The recording itself is `MediaRecorder` in the web
layer, so WKWebView configures the session for capture as well, and it may
overrule what is set here. If music still cuts while recording on the device,
the fix is to record natively — `AVAudioRecorder` in `LinguaShare`, writing
straight into `Documents/Voices/` where the file ends up anyway, which would
also drop a 240 KB base64 trip across the bridge. That is a rewrite of chapter
25 and is not being done unasked.

No data changes. Swift, so nothing in `npm test` can see it. **Device
confirmation required.**

### Opening Lingua no longer stops what you were listening to

「アプリ開くと音楽止まるのはなぜ？」 Because `AppDelegate.swift` activated the
audio session at launch — `setCategory(.playback)` followed immediately by
`setActive(true)`, with no mixing option. `.playback` is a category that does
not share, and making it active is what takes the audio away from whatever else
is playing. So opening the app stopped somebody's music, before it had made a
sound, and whether or not it was ever going to make one.

Two changes, and they are separate:

- **Nothing is activated at launch.** The category stays — it is what makes the
  letters audible with the ring/silent switch flipped, which is the whole
  reason it was set — but iOS activates the session by itself the moment
  something actually plays. That is the only moment it is any of this app's
  business.
- **It mixes.** The comment that used to sit there argued the app need not
  share "because it never plays on its own — every sound here is the answer to
  a tap." That is the argument *for* mixing: a sound half a second long is not
  worth a podcast. A letter's sound now plays over what is already playing.

**Recording still interrupts, and there is no way around it.** A microphone
needs the session to itself; iOS hands it back when the recording stops.

No data changes. This is Swift, so no check on this side of the wall can hold
it — `npm test` cannot see a line of it. **Device confirmation required.**

### A post opens the conversation it is in

「リプライ含めツリーが見れないのちょっと厄介」 A reply carried the id of what it
answered and nothing was ever drawn from it: the timeline was a flat list where
an answer and the thing it answered sat next to each other saying nothing about
each other, and there was no screen anywhere that showed the two together.

**Tapping a post opens it.** A new route, `thread`, and it holds one
conversation: everything the post is an answer to above it, the post itself,
and everything below it indented by how deep it is. The indent stops at three —
past that a phone is drawing a column of margin.

**A reply says who it is replying to**, in the timeline as well as in the
thread. The owner's decision: replies stay in the timeline rather than being
folded away into their threads, and the reply carries the line instead.

**Stored data: a reply now carries `toh`.** The handle of whoever wrote the post
it answers, put on at the moment it is written, for the same reason a post
already carries its author's name and the shapes of its letters — the post it
answers may not be on this phone at all. Nothing is back-filled and nothing is
removed: a reply written before this has only `to`, and the handle is read off
the parent when the parent is here and the line is left off when it is not. No
handle is ever invented.

`re` is untouched — it is still the counter `pwSendWith` raises and `postDel`
lowers. What the thread page counts at the top is how many replies are actually
in front of you, which on this phone is the same number and after a server may
not be.

### The lock closes, and somebody else's profile is the whole card

**The lock closes.** It was opened on the emoji in 「🔓ポストにしたら？」, and an
open padlock is the mark for a thing that is *not* locked — the opposite of
what the post says. The 🔓 there was the word "lock".

**Somebody else's profile is the whole card, not the card minus two rows.**
「他人のプロフィールはどこが自分と同じなの？Editをフォローに変えるだけやん」 —
correct. The bio and the follow counts were left out on the argument that a
post does not carry them and this phone has nowhere to read them from. That
argument produced a different page, which is the thing that was asked not to
happen: the same rows in the same order, and the numbers read zero until
somebody arrives carrying them.

`whoOf()` returns `bio`, `fo` and `fr` on the person now, so FOLLOW_SEAM has
somewhere to land — and the counts are text rather than buttons, because the
two lists behind your own are yours.

No data changes.

### Five things looked at on a phone

- **The lock is open.** 「🔓ポストにしたら？」 The shackle is up, which is the
  mark that was asked for both times it was written.
- **Somebody else's profile is your own profile.**
  「基本自分が見えてるのと同じ感じ」 The same card in the same order with
  Follow where Edit is, and the same three lists. What is not known is absent
  rather than filled in with a zero — no bio and no counts until they arrive
  with the person.
- **The back button is an arrow.** 「戻るボタンにhomeとかつけなくていいんじゃない」
  It said where it goes next to the name of where you are, which is two place
  names side by side and the smaller of them is the one you are leaving. The
  word is still its `aria-label`.
- **A post older than a day says the date.** 「ツイートに時刻ある？」 Under a
  day it is how long ago; past that, `9d` is not a time, it is arithmetic
  somebody has to do. The date comes from the phone in the interface language,
  and drops the year inside this one.
- **Drafts are a page.** 「そこに入れないで。別ページに飛ぶ感じで」 A list at
  the foot of the screen you are writing on is read as part of it. The
  composer carries the way there and nothing else; the count is on the button.

No data changes.

### Somebody else's profile, following, private posts, drafts, and notices

Five things, and four of them are the shape the online half will arrive into.

**Somebody else's profile.** `vProfile` takes a handle now: no argument is
your own. Their card is what a post they wrote already carries — name, handle,
face, the language's name — because that is the whole reason a post carries
them. No bio and no counts: neither is on a post, and inventing them is how a
profile starts lying. They arrive with the person. Likes are your own business
so their page has two lists, not an empty third. Reached from the search.

**Follow and unfollow.** One button, `meFollow()`, and `netFollow()` is what
the server is told. Not waited on: the button has already changed.

**A post can be kept to yourself.** 「非公開の時はポストに🔓マークつけよ」 Hold
the Post button to turn it private and hold it again to turn it back. It sits
in the same timeline with a lock beside its time rather than in a list of its
own — a second list is a second thing to remember to look at.

  - **Data:** `post.pv`. Absent means public, which is the default and what
    every post written before this is
  - a private post is **never handed to `netPush()`** — not "sent and hidden",
    which is a flag somebody else's server has to be trusted with

**Drafts.** 「保存で保存で下書き」 A draft is the composer, kept: the line, the
meaning, whom it answers, the pictures with their letters still placed on
them, the recording, and whether it was going to be private. Saving is at the
foot of the composer and so is the list, because that is where you were when
you saved one. Opening one takes it out of the list — a draft open in two
places is a draft about to be duplicated.

  - **Data: new.** `lingua.drafts` (`DRAFTS`). Nothing prunes it, nothing ages
    it out, and saving one never overwrites another. Not baked: a draft is not
    a post, and baking is what sending does

**Notices.** 「いいね、返信、リポスト、フォロー、おすすめのツイートとか？」 Five
kinds, and four of them are somebody doing something to a post of yours. The
fifth — a post worth reading — is not somebody doing anything; it is a choice
made somewhere with more than one person's timeline in front of it. NOTIF_SEAM
in `net.js`, same shape as everything else: the screen draws what it has and
takes an answer when one comes.

  - a notice is `{kind, at, hd, who, av, id}` — the same four fields
    everything else in this app describes a person with

### The timeline's four requests exist, before there is anywhere to send them

`www/net.js` had the account half and nothing else. It has the timeline's half
now — written first, in the place it will live, called from where it will be
called from.

```
netFeed(ok, bad)               ok(posts | null)   what has arrived
netPush(post, ok, bad)         ok()               this post is now public
netMark(id, kind, on, ok, bad) ok()               liked / boosted, or not
netDrop(id, ok, bad)           ok()               gone from the server too
```

**A seam cannot be retrofitted.** A screen built around a function that
RETURNS cannot later be handed one that ANSWERS: every caller has to change,
and the ones that quietly do not are the bugs. So the timeline already draws
what it has and takes an answer when one arrives, which is what a timeline
does — today the answer is "nothing new", which is true and is not a failure.

**Nothing waits.** A post is on this phone the moment it is written, a like is
counted the moment it is pressed, a post is gone the moment somebody deletes
it. The server is told afterwards, and told nothing today. A person holding a
phone in a tunnel is still using this app.

`postTake()` is the one place that takes posts from elsewhere: never
overwrites, only adds ones this phone has never seen. A post already here is
past-tense data and the copy on this phone is the one somebody may have read.

`supabase/schema.sql` already holds `post`, `follow` and `quote` with their
row level security, held by `npm run rls`. What is missing is four bodies.

No data changes.

### The search tab has a search in it

「検索欄に検索バー作ろう。@でユーザー検索」

One field on the search tab. `@` is the switch: a query starting with it is
looking for a person, anything else for a post.

**SNS_SEAM.** A search is a question asked of somewhere else, and it is built
as one: `snsFind(q, done)` hands back an answer through a callback, the way
`postTr()` and the AI already do, because that is the shape a request has and
a shape cannot be retrofitted onto a function that returns. The answer carries
the query it answers, so a late one for something already typed past is thrown
away. Nothing at the call site knows where the answer came from — it types, an
answer arrives, the rows are drawn. Wiring the server replaces the body of one
function.

**A person is `{who, hd, av, lname}`** — the same four fields a post already
carries about its author, and the same four a server row will have. There is
no second shape for a person anywhere in this app and there must not be: a
post is signed with exactly these.

**PROFILE_SEAM.** Somebody else's row is a row until there is a screen for
somebody else's profile; the day `vProfile` takes a handle it becomes a button
in `snsWhoRow()` and nowhere else changes.

No data changes.

**Also, and it is older than this:** the clear button on a search bar has been
40 across since it was written, and nothing caught it — the button only exists
when there is something to clear, and every walk typed nothing, so it was
hidden on every screen it is on. The search on the timeline is walked with a
query in it and press-check named it on the first run. 44 now, everywhere.

### A field is in ordinary letters, and three things about writing a post

**A field you type a line into is no longer in your own alphabet.**
「普通に全部自作文字にされるの意味わからん。自分が打ちたい時にこれなんて読むんだに
なったら本末転倒やろ」 Somebody drawing their first eight letters cannot read
them yet — that is what drawing them is for — so a field in them is a field
you cannot proofread. `lnField()` is the one place a line is typed and it
drops `.sfont`: the grammar stage's example, a word's example, spelling, and
the post.

What is **displayed** is unchanged and still in the drawn letters: the
timeline, the word list, a saved example, the card. And the composer's preview
now runs at every direction rather than only the vertical ones, so nothing was
lost — it moved to the half of the screen that is for looking.

**A row to write in, at the top of the timeline.**
「ホームからもツイートできるように」 The round `+` is one floating thing over a
corner, and it is reported as invisible on build 57 — which could not be
reproduced here. So the row is a second entrance and the `+` stays.

**A reply shows the post it is answering.**
「リプライする時は前のツイートが何か見れるように」 It said "Replying to @x",
which is the one thing you already knew. Every field of the quoted post comes
off that post — the face, the name, the shapes, the direction, the meaning.
The composer is the one place above post.js's line that draws somebody else's
thing, and the reason there is a rule about it is that it once said `meName()`
and announced you were replying to yourself.

No data changes.

### A language has a page, and the profile points at it

「その言語について簡単にまとめてあるページ欲しいな」「Lingua > みたいになってて
そこでその人が作ってるの見れる」

The small `Lingua` tag beside the handle is gone. In its place, between the
bio and the follow counts, is a row with the language's name and a chevron —
because a tag beside a handle is where a timeline puts an affiliation, and
that is exactly the wrong size for the thing this whole app is about.

The page it opens is new and it only **reads**: what the language is for and
the sentence under it, three numbers (words, drawn letters, kind of writing),
where it is spoken, who speaks it, the note, and the letters somebody has
actually drawn. Only the drawn ones — the free plan puts thirty-eight slots
there the moment a language exists, and all of them would be a summary saying
every language has thirty-eight letters.

The World screen was the editor and had no counterpart: somewhere to fill a
language in, and nowhere to look at one. Its door used to be that tag; it is
now `Edit` on this page, which is where you are standing when you notice
something is wrong.

**Data:** `world().hide` in the `wld` slice — the language's, not the
person's, because whether this language has a page is about this language.
Absent means public, which is the default the owner chose and a default no
migration can get wrong. The switch is in Settings → your language.

Nothing off this phone can read the flag yet: there is one profile here and it
is this person's. What the switch does today is take the row off their own
profile and say so.

### A post does not have to have a line

「文字無しでもポストできるようにできない？」 A post was a line, or nothing. So a
photograph with somebody's own letters drawn onto it — which is most of what
this app is for — could not be posted on its own, and neither could thirty
seconds of a language being spoken.

A post is a line, or a photograph, or a voice, or any of them together. Empty
is still empty and still refused.

`pwHas()` is the one place that decides it, and editing asks the **post**
rather than the composer: an edit carries the line and the meaning and nothing
else, so a post edited down to no line is fine as long as the post still has
something on it.

**Data:** `post.ln` may now be `''`. Nothing changes shape and no post is
rewritten — every post written before this has a line. A post with no line
draws no line row and no meaning row rather than empty ones.

`post-check` grew claim 9, watched failing three ways: a line-or-nothing rule
(a photograph and a voice both refused), anything-at-all (an empty composer
made a post), and the empty row left in.

### The camera crashed, the library was three doors, and the ... was a page

Three things build 56 found on a real phone, and one counter that had been
wrong since replies existed.

**The camera crashed the app.** `NSCameraUsageDescription` was not in
`ios/App/App/Info.plist`. iOS does not refuse a camera without one, it kills
the app the instant it is asked for — the same trap the microphone has, walked
into one build after writing the line that avoids it for the microphone. Both
it and `NSPhotoLibraryUsageDescription` are in now.

**The library button opened the camera and the Files app.**
「ライブラリーボタンなのにファイルとかカメラ開く」 A web file field cannot be a
photo library on iOS: `<input type="file" accept="image/*">` gets Apple's own
action sheet — Photo Library, Take Photo, Choose File — so one word had three
doors behind it. It is `PHPickerViewController` now, through a new
`LinguaShare.pickPhoto`. The picker runs outside this app, so it needs no
permission and the app is handed only the photograph that was chosen. The long
edge it comes back at is `POST_PIC`, passed **from the web side**, because
`www/post.js` owns how big a photograph on a post is and a second number in
Swift would be a second place saying it.

The camera is still a plain field with `capture` on it. No plugin, and now no
crash.

**The ... is a menu beside the post, not a page.**
「画面遷移じゃなくて投稿の横にメニュー出てきて欲しい」 Pressing it left the
timeline, showed three rows on an empty screen, and came back. It hangs off
the ... inside the post now, so what you are choosing about stays in front of
you. Pressing anywhere else closes it and that press is not also delivered.
`PMENU` is which post has it open, at most one, and `viewReset()` forgets it —
arriving somewhere with a menu open on a post you have not looked at is the
filter bug in a smaller costume.

**Data: a deleted reply stops being counted.** 「リプライ消したのに数字1のまま」
`pwSendWith()` adds one to `re` on the post being answered and nothing ever
took it back, so a post whose only reply was deleted said `1` forever, pointing
at a post that is not there. `postDel()` takes it off, floored at zero — a
count that is already wrong is not put right by being made negative. No other
post is touched and nothing is recounted from the timeline.

`post-check` grew claim 8 for it, watched failing both ways: with the
subtraction removed (says 1 replies and its reply was deleted) and with the
floor removed (took a count below zero).

Also: the whole `.pmenu`/pinned/`what an author can do` block was in
`tools/fixture.mjs` twice, byte for byte, from a paste that landed twice — the
same thing that had happened to the photo-editor stylesheet. One copy removed,
which is why the walks report 373 screens rather than 382.

### A post can carry your voice, and the composer has three buttons

**Data. New.**

The one plus that added a photograph is now three buttons: the camera, the
photo library, and the microphone.
「投稿の時にphotoボタンやめて。📷 ライブラリ マイクボタンにして」 The camera is a
plain image field carrying `capture` — there is no plugin and no Swift behind
it, and the photograph that arrives is the same photograph either way.

The microphone records **up to thirty seconds**, and where it goes is the whole
of the design. Thirty seconds of AAC is about 240 KB — three photographs, or
ten free-sized languages — and `localStorage` is where the dictionary, the
alphabet, the notes and every post already live. So a voice is a **file**, in
`Documents/Voices/`, in the folder iOS puts in the device backup, and what goes
into `localStorage` is the post carrying the file's **name**.

  - new on a post: `vo = {f, ms}`, the name and how long
  - new on the phone: `Documents/Voices/`
  - new in Swift: `LinguaShare.keepVoice` and `LinguaShare.voice`
  - new in `ios/App/App/Info.plist`: `NSMicrophoneUsageDescription`. Without it
    iOS does not refuse the microphone, it kills the app the moment one is
    asked for
  - nothing existing changes shape; a post with no voice has no `vo`

The file is written **before** the post is stored, because a name pointing at
nothing is a post claiming a voice it does not have. If the write is refused
the post is made without one and says so — what somebody typed is never lost
because a microphone was. Nothing is ever written over: `keepVoice` refuses a
name that already exists.

**Deleting a post deletes its voice.** 「投稿消した声も消していいよ」 — the
owner's decision, and it is the written spec that this rule requires. It is a
user action with a confirm in front of it and nothing automatic: no pruning, no
tidying of files nobody points at, no cleanup on launch.

```
DELETE REVIEW
  who deletes       user action — postDel(), behind the existing confirm
  when              only when somebody deletes their own post
  what exactly      Documents/Voices/<post.vo.f>, the one file that post
                    named. Nothing else in that folder is looked at, let
                    alone removed — the name comes off the post being
                    deleted and nowhere else
  why               a recording nothing points at is 240 KB of somebody's
                    phone that they can neither hear nor find. The owner
                    asked for it 「投稿消した声も消していいよ」
  recoverable?      NO. The post is gone from localStorage and the file is
                    gone from Documents. If iCloud or a Finder backup of the
                    phone predates the delete, it is in there; the app cannot
                    put it back. Same answer the post itself has always had
  does the backup survive it?
                    the LANGUAGE backup is untouched — bkPack() never held a
                    voice, so no generation of any language file changes,
                    and no word, letter or setting is touched by this
  anything to do with the plan?    no. It is the same on every plan
  migration / rollback
                    none. Old posts have no `vo` and nothing happens for
                    them. A post whose file is already missing deletes
                    cleanly — dropVoice() treats "not there" as done
```

The post goes first and the file second, deliberately: if the file cannot be
removed the post is still deleted, because the person pressed delete on a post.
The reverse order would leave a post whose voice is silently gone.

`www/rec.js` is chapter 25 and holds all of it. It has the same line through it
that `post.js` has: recording is the making side, and playing one back is given
the post's `vo` and nothing else.

Not device confirmed. Nothing in this — the microphone, the two Swift calls,
the Info.plist line — has ever run on a phone.

### A post you wrote can be put right

The `...` on your own post now offers three things rather than two: pin, edit,
delete. 「デリートピン留めエディットにして」

Editing reaches the **line and the meaning**, and those two only 「文と意味だけ」.
The photographs and the voice stay exactly as they were: those are files, baked
and written when the post was made, and swapping one for another is not
correcting a sentence.

**Data.** On the post being edited, `ln`, `mn` and `ink` are overwritten,
`tr` is dropped and asked for again, and `ed` — the moment of the edit — is
new. The `ink` is re-cut with the alphabet as it stands **at that moment**,
which is the one place in this app where a post's shapes are not the shapes it
was born with; a changed line wearing the old shapes is the old line. An edited
post says `Edited` beside its time 「出す」.

No other post is touched. Nothing is deleted.

### The keyboard and what a language is for are now in the backup

**Data. Read this one.**

`SLICES` in `core.js` is what makes a slice real: `bkPack()` walks it, so a
slice outside it is in no backup, and `wipeAll` walks it, so a slice outside it
survives a wipe into the next language. Two were outside it:

- **the keyboard** (`kb`) — built in the app, filed beside the words, and in no
  backup at all
- **what the language is for** (`wld`) — held in `SET`, the person's settings,
  so it was one answer per phone shown on every language's cover, and in no
  backup either

Neither could throw. A backup was written, it restored, every check was green,
and the keyboard somebody spent an evening building was not in the file.

- *newly stored*: `lingua.<id>.kb` was already written; it is now packed.
  `lingua.<id>.wld` is new.
- *migration*: `migrateWorld()` copies the old `SET.world` into the language
  that is open, **once**, marked by `SET.wldMoved`. The old copy is left
  exactly where it is.
- *deleted*: nothing.
- *older data*: a language with no `wld` slice gets one on the first launch
  after this, from `SET.world` if there was one.
- *the plan*: unaffected.
- `backup-check` now names `kb` and `wld` rather than counting slices, and its
  fixture language carries both. Both failures were made to happen first.

### A post can be read in your own language

**Behaviour, and new data on a post.**

A post now shows three things: the writer's own letters, what it means in a
natural language, and — on a button — the same thing said again in the
reader's own conlang, with the words the reader has no word for left in the
natural language and shown in red.

- *newly stored*: `post.tr`, translations of the meaning, written at the
  moment of posting. **Absent today**: the translator is the reader's own
  device AI and is not wired up, so `postTr()` answers nothing and every
  reader sees the language the author typed — which is what happened before.
- *migration*: none. A post without `tr` behaves exactly as it did.
- *deleted*: nothing.
- *the plan*: `tr` is a new capability, Plus. Free gets three a day, on its
  own counter (`SET.trDate` / `SET.trN`) rather than sharing the AI one —
  sharing would mean a spelling suggestion spends a reading.
- *not frozen, on purpose*: the third layer is built from the reader's
  dictionary every time it is asked for.
- *stopped storing*: `post.gl`, the word-by-word gloss. It was read in one
  place, the line under the meaning, and that line is gone — three layers, not
  four. **Posts that already carry it keep it**; nothing removes it. The
  composer still shows a gloss, which is where the default meaning comes from.

### A card of a post is drawn from the post

**Behaviour, and it only shows once a second person exists.**

Making a card of a post re-spelled it out of the open dictionary and drew it in
the open alphabet. For your own posts that is invisible; for anybody else's it
would have been their line in your letters. Cards of posts are now drawn from
the shapes frozen on the post when it was written.

- *newly stored*: nothing. `ink` has been on posts since it was added.
- *older data*: a post written before posts carried ink still falls back to the
  open dictionary — correct today, because every such post is this person's
  own. **When posts start arriving from a server they must arrive with their
  ink already on them.**
- *deleted*: nothing. A post whose ink is malformed is shown as its text; it is
  never repaired or discarded.
- `postInkOK()` is the one place that decides whether ink is drawable.
- New check: `card-check`, twelfth in `npm test`.

### A word is written on one screen, and read before it is edited

**Behaviour, visible immediately.**

- Opening a word now shows it. Editing is a button at the foot.
- The sheet that makes a new word and the sheet that edits one are the same
  screen. The new-word sheet gains several meanings, the family, synonyms,
  opposites, examples and a note — all of which were previously only reachable
  after the word existed.
- Add no longer lands on an empty form; it lands on the word.

### A word carries four more things

**Data.** All four are optional and all four are absent unless filled in.

`reg` (register: spoken / written / slang / polite), `tags` (fields, searched),
`ety` (origin), `up` (changed-on). Empty ones are deleted rather than stored.

- *migration*: none needed. A word without them behaves as before.
- *deleted*: nothing.

### Cloud storage is off the Plus screen until it exists

**Behaviour, and a promise withdrawn.**

The plans screen sold "cloud storage (new phone, several devices)" and the
settings screen told anybody on Plus "Cloud sync — On". There is no code
anywhere that sends a language to a server: the app touches `/auth/v1/*` and
`/rest/v1/profile` and nothing else.

- Cloud storage **is still a Plus feature**, deferred until there are enough
  people to justify paying for the hosting. `docs/FEATURES.md` holds it as
  planned. It comes back on the screen when the thing behind it exists.
- A switch reporting a state the app does not have is worse than no switch:
  somebody trusts it and stops making backups.
- *deleted*: nothing. Backup to Documents is unchanged and is on every plan.
- Labels removed with it: `plan.plus.4`, `set.cloud`, `set.lock.cloud.*`,
  `set.on`, in all ten languages.

### A post can carry a photograph

**Behaviour and data, on every plan.**

- *newly stored*: `post.pic`, a data URL. Squeezed to 900px on the long edge at
  q0.72 — a 2400×1600 photograph comes out about 22 KB as text.
- *not cropped*: only the long edge is brought down, and the timeline shows the
  whole picture letterboxed rather than cutting a piece off with nowhere to go
  and see it.
- **the ceiling**: `POST_BYTES` is 2 MB, about 95 photographs. `lingua.posts`
  shares one storage allowance with every slice of the language, so a timeline
  with no ceiling could make somebody's **language** unsaveable. At the
  ceiling the photograph is refused; the post is not, and nothing is pruned to
  make room.
- **`savePosts()` no longer swallows a failed write.** It was survivable while
  a post was a line of text; a post can be big enough to fail now, and a
  timeline that silently stops saving loses whatever is written after it fills.
- *migration*: none. A post without a photograph is unchanged.
- *deleted*: nothing.
- *the plan*: free, on every plan.

### A key on the system keyboard says which key it is

**Behaviour, on the phone only. Swift — nothing here can see it.**

A key wearing a shape somebody drew says nothing about *which* key it is.
QWERTY is muscle memory, not something anybody can read off a keyboard, so a
person who has not memorised the layout is looking at thirty shapes with no
way to find `a`.

- The roman letter the key types is now drawn small in the **bottom-right
  corner**. `Key.t` has been handed to the extension since the beginning; it
  was simply never drawn.
- Only on letter keys whose face is a **drawn shape**. A key already showing a
  letter or a borrowed character would be saying the same thing twice.
- The four flick faces sit at the middles of the edges, so the corner is free
  even on a key that has all four.
- *newly stored*: nothing. *migration*: none. *deleted*: nothing.
- **Not verifiable here.** There is no Swift on a Linux runner; `npm test` and
  `assets-check` say nothing about how it looks. It needs a build and a phone.

### The profile is where your posts are, and three things on a post

**Behaviour. One new field.**

- **The profile lists your posts.** There was nowhere in the app that did.
  The cover and the language stay at the top and the posts run under them, so
  the page scrolls where it used to be fixed. The pinned one is first.
- **The fourth icon on a post is share.** It was the card, unlabelled, and only
  on your own posts — a restriction from before `cardPaint()` drew a post from
  the post's own ink, left standing after that was fixed. It is on every post
  now, and pressing it opens the card, which is the one way anything in this
  app leaves the phone.
- **The ⋯ is a menu**: pin, and delete. It *was* delete — a delete reached by
  pressing something unlabelled is a delete waiting to be pressed by accident.
- *newly stored*: `post.pin`, on one post at a time. A page with three things
  at the top of it has nothing at the top of it.
- **The card's foot is `@handle` and the language's name.** It was the
  language's name and the word LINGUA, so a card of a language somebody had
  called Lingua read LINGUA on both sides. Both come off the post, so a card of
  somebody else's post carries their handle and their language.
- *migration*: none. *deleted*: nothing. *the plan*: free, on every plan.

### The AI is Studio's, and it is the last chapter

**Behaviour, on every plan.**

The AI conversation is not shown on Free or Plus. Plus is the tools for
building a language yourself and every one of them runs on the phone for
nothing; Studio is the plan where something helps you, and it is the only one
whose cost grows with use — a chat turn has to be given the dictionary to read,
and 5000 words is about 45,000 tokens every time.

- **It moved to the end of the contents first.** It was chapter V, between the
  notebook and the keyboard, and hiding it there would have moved the keyboard
  from VI to V under somebody who already knew where things were — which the
  keyboard row's own comment forbids. Last, it costs nothing to be absent:
  Free and Plus read I–V, Studio reads I–VI, and every shared chapter has the
  same number on both. Two numbers change once, today: the conversation V→VI,
  the keyboard VI→V.
- *the plan*: `CAN.sug` is gone. `ai` is one capability at studio, where there
  were two meaning the same ceiling.
- **Plus now spends the daily allowance for word suggestions**, three a day,
  the same as Free. It was unmetered on Plus in the code and advertised as
  Studio's on the screen; the screen was right.
- *deleted*: nothing. A Studio conversation left on the phone when a
  subscription ends stays in the `talk` slice and in the backup.

### When a plan ends, the app goes back to free's shape and keeps everything

**Behaviour, across every capability. Nothing stored changes.**

Nobody had decided this, so it had been decided a feature at a time: `wsys`
and `kb` reverted, `words` and `gram` kept working, and `dir` shipped this
morning on the second side. One rule now. 「a にしたら最初の1ヶ月で作りきったら
そのあと課金されねえだろ」

```
  the dictionary        lists the first 100 words, in the order made
  the writing system    an alphabet          (already did)
  the keyboard          the fixed QWERTY     (already did)
  the direction         left to right        (new)
  a stage of your own   stays; cannot be added to or deleted  (delete is new)
  everything else       as it always was on free
```

- *deleted*: **nothing.** `WORDS` is untouched, `save()` writes every word,
  `bkPack()` packs every word, and `findWord()` finds every word — a post, a
  gloss, a spelling and an example all read the whole dictionary. One list on
  one screen is shorter, and `wordsSeen()` in `words.js` is the only thing
  that shortens it. The search, the sound and letter lookups and the synonym
  picker read it too, because a search that returned the other four thousand
  nine hundred would put back exactly what the list stops showing.
- **The app says the difference out loud, twice.** Once, on the day the plan
  changes, in a sheet: nothing has been deleted, it is in the backup, it comes
  back. 「課金切れたら、ポップ出して、バックアップには保存されてるよーって一回
  出せばok」 And every time, at the foot of the dictionary: how many are not
  listed. A list that is quietly short is indistinguishable from data that is
  gone, and it will be reported as data that is gone.
- *newly stored*: `SET.planWas`, the plan the app last saw. It is the person's,
  not a language's, and it is what lets `capLapse()` notice a change however
  it happens — set by hand today, StoreKit tomorrow, found lapsed at launch.
- *migration*: none. The first launch after this records the plan and says
  nothing; there is nothing to announce to somebody who has never been on
  another plan.
- *older data*: unaffected in every direction. A free language of forty words
  behaves exactly as it always has.
- `backup-check` holds the half that matters — past the ceiling, on the free
  plan, `findWord()` still finds an unlisted word and `bkPack()` still carries
  all of them. **Both were watched failing with the bug put back.**
- New keys in all ten languages: `cap.hid`, `cap.lapse.h`, `cap.lapse.d`,
  `cap.lapse.ok`.

### A photograph can be cropped

**Behaviour. Nothing new is stored.**

Pressing a picture on the composer opens an editor with two tools — **文字**
and **切り抜き**. 「画像タップして画像編集切り抜きとか文字入れとか」

- The rectangle is dragged by its middle and resized by its corners, and it is
  held as **fractions of the picture**, exactly as a letter's position is, so
  nothing about it needs to know the size of the photograph or of the screen.
- **The letters move with the picture.** A letter is a fraction of the
  photograph and the photograph is about to be a different one, so leaving the
  fractions alone would slide every letter somewhere it was never put. A
  letter that lands outside the new edges is held at the edge rather than
  dropped — dropping it would be deleting something somebody made because the
  picture got smaller.
- The corners are drawn, not pressed: one pointer listener on the picture
  decides what the finger has. A finger that leaves a small box mid-drag would
  be dropped by a listener on that box.
- **Round buttons over the picture**, the way a phone does a photograph — the
  way out, the two tools and Done across the top, and what can be done to the
  letter you are holding down the right edge. It was a pill with a word in it,
  which is what a settings screen puts *under* a picture.
- *newly stored*: nothing. The picture in the draft is replaced by the cut one
  and the room for it is asked for again before it is kept.
- `viewReset()` gained the three things this screen remembers — which picture,
  which letter, which tool.

### A post can carry four photographs, and they slide

**Behaviour and data.** 「画像は4枚まで載せられる。画像だけ横スライドできる感じ」

- *newly stored*: `post.pics`, an array of data URLs, up to `POST_PICS` (4).
- **`post.pic` is not removed and not rewritten.** Posts that carry one keep
  it exactly as it is; `postPics()` is the one place that answers what
  pictures a post has, and it answers `pics`, or `pic` as a list of one, or
  nothing. A photograph is the largest thing on a post, so a migration that
  copied one would double the biggest field in storage for no gain.
- *the ceiling*: `POST_BYTES` is unchanged and is now four times easier to
  reach, so the room is asked for **each** picture as it arrives and again
  after baking. A picture that will not fit is refused; the post is not, and
  nothing is pruned to make room.
- **Each picture has its own letters** and each is baked separately.
- *migration*: none. *deleted*: nothing. *the plan*: free, on every plan.

### The composer's photographs have no buttons under them

**Behaviour. Nothing stored changes.**

There were three — Change photo, Letters, Remove photo — and `.btn` is
`flex:1` with `word-break:break-word`, which is right for two buttons filling
a sheet and turned the third into "Rem / ove / phot / o" on a phone.
「下の文字終わってるだろw」

- **A red minus at a picture's corner** takes it away. **A plus beside the
  strip** adds one, centred against their height and outside the scroller, so
  four pictures cannot push it off the edge. 「+が真ん中に来ると最高」
- **Pressing a picture opens it.** 「編集ボタンはいらん。画像タップして画像編集」
- **Cropping is not built.** The editor does letters. Cropping is the other
  half of what it was asked for and `docs/BACKLOG.md` holds it — a screen that
  offered it and did nothing would be worse than one that does not offer it.

### The keyboard in the app obeys its own switch

**Behaviour. Nothing stored changes.**

"Show the letter on the key" is a switch in the keyboard chapter, and the
keyboard drawn directly under it ignored it: only the system keyboard drew the
corner mark, in Swift, which cannot be run anywhere but a phone. So the one
control whose whole job is to change how a key looks changed nothing anybody
could see, and the only way to judge it was to build the app.

- `kbMark()` draws it under the same three conditions as
  `KeyBoardView.swift`: a letter key, whose face is **a drawn shape or a
  borrowed character**, that has a name to say. A borrowed character counts —
  「借り物でも出すでしょ」 — because what the mark answers is *which key is
  this*, and a character taken from another script is no more readable as a
  position on QWERTY than a drawing is. The one key that must not have it is
  the one already wearing its own roman name, which would be saying the same
  thing twice.
- **The Swift changed too**, in the same commit and to the same condition. The
  two are one statement in two languages and nothing can hold them to each
  other here.
- *newly stored*: nothing. *migration*: none. *deleted*: nothing.
- **The system keyboard is still Swift and still unverified here.**

### Letters on a photograph are typed, not picked

**Behaviour. Nothing stored changes.**

The editor offered a tray of thirty-eight tiles and you tapped them one at a
time. There is a keyboard — the person's own, on the phone — and writing a
word one tile at a time with no space bar is not what it is for.
「だからなんでキーボードあるのに勝手に文字のタイル準備すんの？」

- A **line is typed into a field** and lands on the picture as one thing that
  can be dragged, sized and coloured. `postCut()` cuts it — the same cut a
  post's ink gets, so `ka` is one letter here exactly as it is there, and
  anything never drawn stays as its characters.
- The letters stand at the font's own advance (`inkAdv`), so a line on a
  photograph is spaced the way a line is spaced everywhere else in the app.
- **Eight colours** rather than white-or-black. 「あと文字の色変えたり」 They
  are tokens in `index.html` — `--mk0`…`--mk7` — and drawing asks `cssVar()`
  for the value, because a colour written into the markup is what `act-check`
  refuses and it is right to.
- *newly stored*: nothing. A mark is `{tx, x, y, s, c}` while the post is
  being written and is baked into the picture when it is sent.
- **The field stays above the phone's keyboard.** This app has no Capacitor
  keyboard plugin, so WKWebView does not resize when a keyboard comes up — it
  lays one over the page and leaves `position:fixed` where it was, which would
  have put the field behind it. `vpKbWire()` in `shell.js` writes the
  difference between the window and `visualViewport` into `--kb`, and the
  field and the colours add it. One listener, one number, nothing native.
- The photograph stays where it is behind them, which is what Instagram does
  with a picture you are typing on. 「インスタだともはや隠してる」

### Letters can be placed on a photograph

**Behaviour, on every plan. Nothing new is stored on a post.**

Pick a letter you drew, put it anywhere on the picture, drag it with a finger,
size it with the slider. 「なんなら画像に自作文字を貼って投稿できるようにすれば
勝手に広がるよ」

- **The picture is the screen.** Full bleed, black behind it, the controls
  floating on it and the alphabet along the foot — the way a phone does a
  photograph, not the way a form does one.
  「インスタみたいにしろよ なんでそんなパソコンと同じような配置なんや」
- *newly stored*: **nothing.** The letters are drawn INTO the picture when the
  post is sent, so `post.pic` is the only thing that changes. A reader has
  neither the alphabet nor a way to compose it, and a picture with the letters
  already in it is past-tense the way `ink` is, by a shorter route.
- *while writing*: `PW.marks` — a letter's id and where it sits as a fraction
  of the picture. It is where you are standing, not something stored, and
  `pwBlank()` clears it.
- **white or black**, one button. A letter nobody can see is not placed on
  anything, and a photograph can be either.
- *the plan*: free, on every plan. 「画像と自作文字貼るのは無料」
- *migration*: none. *deleted*: nothing.
- **New check, thirteenth in `npm test`: `post-check`.** It drives the real
  `pwSend()` against a photograph that is black everywhere and counts the light
  pixels in what came out — "the string is different" would also be true of a
  bake that drew nothing. It also holds that the positions do NOT travel on the
  post, that the direction does, and that the composer is empty afterwards. All
  four were watched failing with the bug put back.

### The onboarding's ghost buttons stopped being everybody's

**A bug, everywhere in the app.**

`index.html` carries a second `<style>` block for the onboarding, and it set
`.btn.ghost` without scoping it. Being later, it won on order: every ghost
button in Lingua had a white border at 22% opacity, which is invisible on a
page whose background is paper. It looked right on the onboarding because the
onboarding is the one screen that is dark. Same shape as the `.sfont` bug —
one rule in one place, quietly outranked by another written for one screen.

### A language has a direction, and a post carries it

**Behaviour and data.** Reading is free; choosing is Plus.

Four of them: left→right, right→left, and down the page with the columns
running right→left or left→right. 「縦書き、右→左 左→右の投稿」

- *newly stored*: `SCRIPT.dir`, in the **`script` slice** — the language's, so
  it is in the backup already and travels when the language is opened. Absent
  means left→right. It is deliberately **not** in `SET`: `SET.wsys` is there
  and is the older mistake, and what the language is for had to be moved out
  of `SET` for exactly this reason.
- *newly stored on a post*: `post.dir`, frozen when it is written, for the
  same reason `ink` is frozen. A post is set the way its writer's language
  runs, on anybody's phone. `postDir()` is the one place that reads it and it
  reads the **post** — `sides-check` now refuses `SCRIPT` and `scriptDir`
  below the line in `post.js` and `card.js`.
- *the plan*: `dir` is a new capability, Plus. **Nothing asks it before
  drawing.** A free account reads every direction — otherwise the timeline
  would be lying about somebody else's language — and what Plus buys is
  choosing one. 「無料でも言語の向きは見ることはできる。でも設定してsnsとかに
  登校するのは有料会員のみ」
- *when a plan ends*: the language keeps its direction and keeps posting in
  it. What is lost is the ability to change it. `docs/PAID_FEATURES.md`: a
  failed check means fewer buttons, never fewer words. **This one was
  interpreted rather than decided** — it is in the decision log as such.
- *migration*: none. A post written before this runs left→right, which is how
  it was written and how it has been shown. Nothing is back-filled.
- *deleted*: nothing.
- **Two places set a column across the page instead**: the composer's field (a
  textarea cannot be typed in a column in this webview) and the card (a
  landscape composition with no room for a column). `dirFlat()` is the one
  place that says so and `docs/BACKLOG.md` says why.
- New keys in all ten languages: `dir.title`, `dir.ltr`, `dir.rtl`,
  `dir.ttb-rl`, `dir.ttb-lr`, `dir.locked`.

### The profile is one block

**Behaviour. Nothing stored changes.**

Under the face there were three strips, each of them small grey type with a
bold number in it: the language's name on a line of its own, then following
and followers, then the letters, the words and what the language is for.
None of the three was a heading for the other two, so the eye had four places
to start and no reason to pick one. 「プロフィール視認性悪すぎだしごちゃごちゃ
してる」

Everything above the three lists is `meCard()` now.

- **Beside the face: the name, the handle and the language** — the same three
  things a post says about whoever wrote it, in the same order.
  「アイコンの横に名前と@と言語つければいいんじゃない」
- **The line about yourself runs the full width**, at the left margin, under
  all of it. It was inside the row, so it read in a column two thirds of the
  phone wide, indented from both sides — and on somebody else's page that
  line is most of what there is to read. 「相手のページに飛んだらbioすらまと
  もに読めないやんけ」 Four lines of it are shown.
- **Following and followers moved into the block about the person.** They are
  who somebody is, not a statistic about the language beside them.
- **The language wears the gold tag it wears on a post**, and pressing it
  opens what the language is for — which is what the tag is asking about, and
  the only door in the app to that screen. **Renaming a language is now only
  in the settings**, where the rest of naming it already was; the pencil on
  the profile is gone with the line it was on.
- **The letters and the words came off.** They are chapters I and II of the
  contents, one tab away, and the number there is the fuller one — `5 / 38`
  rather than `5`. Saying them again here was the noise.
- *deleted*: `wldSaid()` and `wldLine()`, which built the "what this language
  is for" label. The profile was the only thing that called either, so they
  went with the line — `dead-check` would have failed otherwise. No stored
  data is touched: `WLD` and the `wld` slice are unchanged and the screen
  itself is unchanged.
- *newly stored*: nothing. *migration*: none. *the plan*: unaffected.
- `.mecard` was written out twice in `index.html`, and the second one set no
  `display`, so it inherited `flex` from the first. One block now.
- The three lists start at 254px of 844 — 30% of the phone — measured in a
  390×844 viewport rather than read off a full-page picture.

### Smaller

- The dictionary list: the whole row opens the word; a round ⊕ replaces the
  bar across the foot; the per-row play button is gone.
- The synonym / opposite picker can make a word on the spot.
- The tab bar is transparent enough to see the page through.
- The glyph editor no longer bends a line drawn straight along the dots.
- The language count is stated as `LANG_MAX = 1` on every plan, and the note
  that implied a paid plan added more is gone.

---

## How to add an entry

Anything that changes what is stored, what is moved, or what is removed gets an
entry **before** the code is written, with the eleven questions from
`docs/FEATURE_RULES.md` answered. Anything that deletes also gets a DELETE
REVIEW (`docs/DATA_SAFETY.md`).

Mark every entry as one of:

```
  code confirmed              npm test green, nothing on a phone yet
  device confirmed            somebody ran it on a real iPhone
```

and never let the first stand in for the second.
