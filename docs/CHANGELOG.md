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
