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
1b. **if it REPLACES a rule that is already written down, fix that rule — in
   the same commit.** Adding to the log is not enough. A rule is obeyed
   because it is read, so one that still says the old thing is still being
   followed, and the decision has not landed however carefully it was
   recorded. 「新しいのにしたらルーるも直せよ／そのせいで毎回古いルールに
   引っ張られてんじゃん」 (OWNER DECISION 2026-08-26)

   **Fixing means deleting.** Do not leave the old sentence with 「this is
   history」 in front of it — it will be read. 「歴史とかいいから消せよ」
   `docs/CHANGELOG.md` is the exception and is never rewritten: it records
   what was true on a day. Everywhere else, only sentences about NOW.
2. implement exactly that, and nothing adjacent
3. do not reinterpret it into a more reasonable rule
4. do not quietly generalise it to a nearby behaviour
5. if existing code contradicts it, **report the contradiction** — do not go
   and change unrelated code to match
6. a later session reads the decision before changing anything in that area

**If a decision conflicts with a rule already written down: STOP — and read the
next paragraph before you do, because it is the half that was missing and it is
the half that gets used most.** Report the existing rule, the new decision, the
code affected, the data affected, and what a migration would have to do. Do not
resolve it yourself. Neither side of a conflict is automatically right, and
picking one quietly is how a spec gets lost.

**STOP only when the owner has not spoken.** If the new side of the conflict is
something the owner has **just said**, that is the latest and it wins — it is
not a conflict to escalate, it is an instruction to carry out. Do not ask again.
Do not ask 「this overturns the decision of the 22nd, is that alright?」 about a
decision the owner replaced this morning: they know what they said before, and
asking is making them say it twice.

```
  the owner has just said it            → it wins. Mark the old one
                                          superseded, fix the rules, carry on
  two WRITTEN decisions disagree and
  the owner has not restated either     → stop and report. This, and only this
```

Being asked to confirm something already answered is what 「それもふるいわ
いつまでふるいのずっとやってんだよ うぜえな」「毎回新しくしろよ」 is about
(OWNER DECISION 2026-08-26). It was asked three times in one day off the
paragraph above, because that paragraph only had the first half of the rule in
it. **The newest thing the owner said is the specification.** Older written
decisions are the record of what it replaced, not a second opinion to weigh
against it.

Marking and fixing happen in the **same commit** as the new decision. The old
entry in the log below keeps its words and gains a superseded line — that log
is a record of what was decided when. **The rules are the opposite: they are
fixed, and fixing means deleting.** A rule left standing is read, and a rule
that is read is obeyed.

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

### 「保存されない」は仕様。オンラインのアプリとはそういうもの
- Date: 2026-09-04
- Area: 保存・オフライン。**制作側ぜんぶ**

- Decision:

  ```
  Twitterとかは電波がないと開かないでしょ？ そもそも通信してないならエラーで
  開けないし、保存するタイミングでエラーが起きるなら、保存されないし。そう言う
  もんじゃないの？オンラインアプリってどうなの？

  スタンダードに合わせて作りたいから間違ってることあったら言って。
  ```

- Reason: **オーナーが自分で読んだうえでの決定です。**リーダーが「これは失われ
  ます」と並べた三つ ── **アプリが落ちて消えること、電波が無くて言語が開かない
  こと、送れていない分が次の起動まででなくなること** ── は、この一言で全部
  **仕様になりました。**

  **だから、この三つはもう但し書きではありません。**「オーナーに確認が要る」
  「気をつけること」「これが代償です」として書いてある文は、決まったので
  消します。オンラインのアプリはそういうものだ、というのがオーナーの答えです。
- Affected features: 保存、起動、オンボーディングの歩き
- Affected data: **サーバーに届いていない分は失われます。それが仕様です。**
- Affected docs: この項目、`CLAUDE.md` 冒頭の Online・規則11・規則22、
  `docs/DATA_SAFETY.md`、`docs/STATE.md`
- Implementation status: **仕様として書き留めました。**コードは変わりません ──
  いまの姿がそのまま仕様になった、という決定です。

### 保存が失敗したら、人が作ったものは目の前に残る
- Date: 2026-09-04
- Area: 保存の失敗（`www/core.js` の `save()`、`www/net.js`）

- Decision:

  ```
  なら失敗して残るにするべき。
  ```

- Reason: 上の決定の**続きで、そこに引かれた線です。**「保存されない」は仕様
  ですが、**「失敗して黙って消える」は仕様ではありません。**

  保存がサーバーで失敗したとき、人が作ったものは**目の前に残ります。**もう一度
  押せば送れる状態です。**これは「iPhone に溜めて後で送る」ではありません** ──
  溜めるのはオフライン対応で、それは今やりません。残るのは、その人がいま見て
  いる画面の中です。
- Affected features: 保存のある画面ぜんぶ
- Affected data: **無くなりません。**失敗したときに消えないことが、この決定です。
- Affected docs: この項目、`docs/HANDOVER.md` 七章
- Implementation status: **着手していません。コードは別のセッションです。**
  いま `www/core.js` の `save()` の catch は空です（`docs/HANDOVER.md` 七章）。

### 電波が無いときは、前に読み込んだ分を出す。見るだけ
- Date: 2026-09-04
- Area: 電波が無いときの写し。`CLAUDE.md` 規則22

- Decision:

  ```
  前に読み込んだ分は出て欲しい。制作も眺めたい人はいるだろうし、
  ```

- Reason: **同じ日の「写しも別に今はいらなくない？」を、オーナー自身が一部
  差し替えました。**電波が無いとき、画面を真っ白にはしません。前に読み込んだ
  ものを出します。

  **見るだけです。作れません。保存できません。**「眺めたい人はいるだろう」が
  オーナーの言葉です。**編集と読み替えて広げないでください。**

  **この写しは絶対にサーバーへ戻りません。片道です。**理由は
  `docs/HANDOVER.md` 七章にあります ── `www/sync.js` の `syMerge()` は
  **壊れた写しでサーバーの正しいほうを上書きするバグ**です。読めない側を
  「無い」と同じに扱っています。**戻る道があるかぎり、同じ形の事故が起きます。**
  戻る道が無ければ、写しが壊れていても失われるのは写しだけです。
- Affected features: 制作側の全画面（電波が無いとき）
- Affected data: **増えます。**iPhone に読み取り専用の写しが載ります。
  **そこからサーバーへ戻る道はありません。**
- Affected docs: この項目、`CLAUDE.md` 冒頭の Online と規則22、
  `docs/DATA_SAFETY.md`、`docs/ARCHITECTURE.md`、`docs/EXPIRY.md`
- Implementation status: **着手していません。コードは別のセッションです。**

### `ONE.md` を消す
- Date: 2026-09-04
- Area: 書いたもの（ONE.md ── 消しました）

- Decision:

  ```
  消していいよ
  ```

- Reason: **承認されなかった案です。**オンライン一本化はもう入っていて、そこに
  書いてあった設計は通っていません。**残しておくと、次に読む人が仕様として
  読みます。**
- Affected features: 無し
- Affected data: 無し
- Affected docs: 消した `ONE.md` 本体と、そこを指していた `docs/STATE.md`・
  `docs/FEATURE_RULES.md`・`docs/RECOVERY.md` の行。`tools/docs-baseline.txt`
- Implementation status: **入りました。**同じ日に消しました。

### オンラインを進める。パッチはオーナーが後で流す
- Date: 2026-09-04
- Area: オンライン一本化ぜんぶ。バッジ

- Decision:

  ```
  オンライン進めて。パッチは俺が後で流す
  ```

- Reason: **止めずに進める、という指示です。**サーバー側の一枚はオーナーが自分で
  流します。**アプリ側はそれを待ちません。**
- Affected features: オンライン一本化。バッジ
- Affected data: 無し
- Affected docs: この項目、`docs/STATE.md`
- Implementation status: オンライン一本化は入りました。**バッジはオーナーの
  SQL 待ちで、アプリ側から出来ることはありません。**

### 増えた文字は消してよい ── リリース前のあいだだけ
- Date: 2026-09-04
- Area: 文字（`www/letters.js`）。増殖した分の後始末

- Decision:

  ```
  だからリリース前の今は消していいから、描いてないからリリースしてから
  確認してくれ、データがないから
  ```

- Reason: **リリース前で、増えた文字には誰も何も描いていない。**だから
  消しても失われるものが無い。
- Affected features: 文字の増殖（`docs/HANDOVER.md` 六章の 0）の後始末。
  **`docs/DATA_SAFETY.md` の DELETE REVIEW は、この件については要らない。**
- Affected data: 増殖した文字。**中身は空 ── 誰も描いていない。**
- Affected docs: `docs/HANDOVER.md` 六章の 0 に書いた「勝手に消してはいけない」
  は取り消し。同じコミットで消した。
- Implementation status: 増殖そのものが未着手。
- **有効期限つきの決定です。**理由が「いまはデータが無いから」なので、
  **リリース後はこの決定は効きません。**そのときは人が描いた文字が混ざる
  ので、同じ消し方をしてはいけません。

### キーボードの編集画面、一番下の ＋ を外す
- Date: 2026-09-04
- Area: キーボードの編集（`www/keyboard.js`）

- Decision:

  ```
  キーボードのこの下の+もいらない。誤タッチが多いから
  ```

- Reason: **誤タッチ。**鍵盤のすぐ下、指が普通に触れる所に、行を足す
  ボタンが横いっぱいに置かれています（`docs/reports/2026-09-04-owner-shots/5-keyboard-plus.jpg`）。
- Affected features: キーボードの編集。行を足す道が一つ減ります ──
  **行を足す道が他にあるかどうかを確かめてから消してください。**
  一つしかないなら、それは「行を足せなくする」ことになります。
  その場合はオーナーに訊くこと。読み替えて別の場所に生やさないこと。
- Affected data: 無し。
- Affected docs: `CLAUDE.md` 規則19（キーボードの編集画面）に、この ＋ を
  説明した文があれば同じコミットで直す。`press` のボタン数が減ります ──
  減ったこと自体は正しい。
- Implementation status: **着手していません。**`docs/HANDOVER.md` 六章の 10。

### 保存を押したときだけ、保存されているものが変わる
- Date: 2026-09-04
- Area: **保存されるものぜんぶ。**画面と、裏で走るものの両方
- Decision:

  ```
  推測も含めて入れるでしょ。そのあと変更したら変更が上書きされるだけで。
  消したのも変更じゃん？ってと思うけどどうなん

  人が消したかどうかを判断するために保存ボタンを全部につけたかったのよ。
  戻したら変更がなかったことになるやん？
  保存した状態から保存されてないのに消える、これはバグってわかるように
  ってイメージ持ってた
  ```

- Reason: **保存されているものが変わる理由は一つだけ ── 人が保存を押したから。**
  それ以外で変わっていたら、それはバグです。**押していないのに変わったかどうかで
  バグが見分けられる**、というのがこの決まりの目的で、保存ボタンを全部の画面に
  付けたかったのもそのためです。

  **裏で走るものが、保存されている値を書き換えてはいけません。**起動時の移行も、
  同期も、推測も。**最初の値として入れるのは別**です ── 単語ができた瞬間に
  推測の発音が入るのは、作ったことの一部で、あとからの書き換えではありません。

  **この決まりは、いまのバグを「発音の話」ではなくします。**「保存を押していない
  のに保存されているものが変わった」という**一つの形**になり、他の画面でも同じ
  物差しで探せます。
- Affected features: **画面ぜんぶ。**さしあたり:
  - 単語シートで意味だけ直して保存を押すと、**画面に出ていない発音が消える**
    （`www/wordsheet.js` の `wdWrite()` の `delete w.ph;`）── **バグ。直す。**
  - 発音を空にしても、次の起動で推測が書き戻される ── **バグ。**誰も押していない
  - **保存ボタンが全部の画面に付いているかは未確認。**ビルドのあとに洗い出す
- Affected data: 無し。**書き換えが減る方向**にしか動きません
- Affected docs: この項目、`docs/DATA_SAFETY.md`、`docs/CHANGELOG.md`
- Implementation status: **一行だけ配布済み**（`delete w.ph;` を消す、`claude/pop2`）。
  **残りはビルドのあとに洗い出す。**

  **CLAUDE.md の Data が元から同じことを言っています** ── 人が作ったものは、
  いまの形が要らないからといって消さない。この決定はそれに**見分け方**を足した
  ものです。

  **そして、押す場所が無ければこの決まりは成り立ちません。**

  ```
  制作はユーザーが保存したかどうかが争点になるよね？だから今これも
  一本化されてないよね？例えば保存とか追加なくて変更できたり、
  そうするとバグの時との差分がわからなくなる。
  ユーザーが意図して保存を押したその状態が記録されていることが重要なのでは？
  ```

  OWNER 2026-09-04。**打つそばから書き込む画面には、人が「これでいい」と決めた
  瞬間がありません。**記録されているのは、ただ最後に打った文字です。そうなると
  「これは人がやったのか、アプリが勝手にやったのか」を分ける手がかりが無くなり、
  **バグとの差分が分からなくなります。**

  **どの画面に保存があって、どの画面に無いのかは、まだ数えていません。**
  読んで当てるのは推測なので、**数えてから**オーナーが決めます。
  **ビルドのあとの洗い出しで数えます** ──「これも6以降の次の調査でやって欲しい」
  OWNER 2026-09-04。コードは一行も変えず、「この画面は保存を押して書く」
  「この画面は打つそばから書く」を全部並べた表を作り、それを見てオーナーが
  決めます。**どこをどう変えるかはこの項目に書きません。オーナーのものです。**

### 同期でぶつかったら、後から「直した」ほうが残るべき。いまは後から「繋がった」ほうが残る
- Date: 2026-09-04
- Area: 二台以上で同じアカウントを使っているときの同期（`www/sync.js`）
- Decision:

  ```
  普通後から変えたほうになる？アプリ気になるそこ
  ```

- Reason: **オーナーの読みが正しく、いまのアプリはそうなっていません。**

  同じ欄を二台で別々に直したとき、いま残るのは**後から繋がった**ほうの値です。
  **いつ直したかは見ていません。**

  ```
  10:00  A で名前を「あ」に直す
  09:00  B で名前を「い」に直す   ← こちらが古い
  11:00  B が先に繋がる → サーバーは「い」
  11:05  A が繋がる     → サーバーは「あ」
  ```

  順番が逆なら、**古いほうの「い」が残ります。**偶然でしか正しくなりません。

  **原因は、直した時刻がどこにも書かれていないことです。**比べるものが無いので
  繋いだ順で決まります。当たるのは「一つしか入らない欄」だけで、単語や文字の
  一覧は両方足されるため消えません。

  **これは `docs/EXPIRY.md` 10番が「仕様どおり」と書いていたものです。**
  `www/sync.js` の冒頭と `docs/DATA_SAFETY.md` に「値のぶつかりは iPhone の側を
  返す」と明記されていますが、**オーナーはその仕様を今日いま見直しました。**
- Affected features: 同期（`www/sync.js`）
- Affected data: **増えます。**直した時刻を持つ必要があります。**どの粒度で
  持つか（欄ごとか、スライスごとか）は決まっていません。**
- Affected docs: この項目、`docs/EXPIRY.md` 10番、`docs/DATA_SAFETY.md`、
  `www/sync.js` の冒頭
- Implementation status: **決定。未実装。**「後から変えたほうになる」── そのとおりで、
  これにして」OWNER 2026-09-04。**やるのは決まりました。**保存の形が変わるので、
  ゲートも実機確認もなしに今日のビルドには乗せません。**ビルドのあとすぐ配ります。**
  **どの粒度で時刻を持つか（欄ごとか、スライスごとか）だけが残っています。**

### バックアップの三世代は、そのまま。入っているのは制作の分だけ
- Date: 2026-09-04
- Area: `ios/App/App/LinguaShare.swift`（`keep()`）、`www/backup.js`（`bkPack()`）
- Decision:

  ```
  3つでいいよ
  ```

- Reason: 言語が変わるたびにファイルが一つ書かれ、常に三つ持ち、四つ目を書く
  ときに一番古いものが消えます。**三回さかのぼれるのが限界です。**書き出しが
  壊れても一つ前が無事なら戻せる、というのがこの仕組みで、その代償です。
  **そのままでよい、というのがオーナーの答えです。**

  **入っているのは制作の分だけです** ── 開いている言語まるごと（単語、文字、
  書記体系、音、キーボード、文法、メモ、世界設定）、**一言語ぶんで一ファイル。**
  **SNS の分は入っていません**（投稿、下書き、プロフィール、フォロー）。
  それはサーバーが持ちます。
- Affected features: 無し
- Affected data: 無し
- Affected docs: この項目、`docs/EXPIRY.md` 2番
- Implementation status: 何もしません

### 版は部分ごと。戻すのは丸ごと。戻す画面は見せない。縮む書き込みの守りは外す
- Date: 2026-09-04
- Area: 「消えないための仕組みを一本にする」の中身
- Decision:

  ```
  部分ごとでいいよ

  設計を通すってなに？
  見せないでしょ
  丸ごとで
  外す
  ビルド前に潰す
  ```

- Reason: **「設計を通す」はリーダーの言葉が悪く、「コードを書き始めていいか」
  という意味でした。**オーナーは既に一つずつ全部答えているので、**設計は
  通っています。書き始めます。**

  **版は部分ごと。**単語・文字・音といった、いまの保存の単位のまま積みます。
  一回ぶんは 12 KB 〜 685 KB。**言語まるごと（毎回 685 KB）より軽く、
  一語ごと（0.14 KB）はアプリのほぼ全部を書き直すことになるので取りません。**

  **戻すのは丸ごと。**「単語だけ三日前に戻す」はできるようにしません。
  単語が文字を指していたりするので、部分だけ戻すと辻褄が合わなくなります。
  **細かく戻したい場面が実際に出てから足します。**

  **戻す画面は人に見せません。**運営だけがやります。**リリース前に画面を
  増やさずに済みます。あとから足せます。**

  **「小さくなったら書かない」守りは外します。**いまは、書き込んだ結果が
  いまより小さくなるとサーバーに書きません。**版が積まれるようになれば
  前の版が残るので取り返せます。**外すのは**版が積まれるようになってから**
  ── 先に外すと、いまは取り返せません。

  **小さい二つはビルド前に潰します。**検索の履歴が同じ言葉を再検索したとき
  黙って一つ減ることがある件と、同じ言語が一覧に二つ並ぶことがある件。
- Affected features: 保存・同期・復元・運営側の復旧
- Affected data: 版が積まれる。部分ごと、一回 12 KB 〜 685 KB
- Affected docs: この項目、`docs/STATE.md` § 4a、`docs/DATA_SAFETY.md`
- Implementation status: **書き始めてよい。**`claude/one` の設計に沿って

### 【差し替え済み】お題のタグは、お題そのものが持っている十言語から出す

> **2026-09-04 夜の「タグは本文の文字。翻訳しない」で差し替わりました。**
> 下は当日より前の記録です。従わないでください。

- Date: 2026-09-04
- Area: お題（`prompt`）、`www/sns.js`
- Decision:

  ```
  お題はなってる
  タグとお題一本化してってこと。
  ```

- Reason: **お題の文は既に読む人の設定言語で出ています。**サーバーが十言語ぶんを
  持っているからです。**タグも、その同じ十言語から出します。**

  **`www/i18n/` に新しく十言語ぶんのタグの言葉を書かないでください。**
  そうすると、**同じお題の言葉が二箇所に十言語ぶんある**ことになります。
  **その時点で二本です。**「一つの場所、二箇所目を作らない」。

  **リーダーが最初にタグを別の言葉として配ったのが誤りでした。**
- Affected features: ⑯ SNS
- Affected data: 無し
- Affected docs: この項目
- Implementation status: **`claude/find3` に配り直します**

### 頼まれていないものを、アプリが書き込まない。**発音は別 ── あれは頼まれている**
- Date: 2026-09-04
- Area: 文法の語順の既定値、およびオーナーが頼んでいない既定値ぜんぶ
- Decision:

  ```
  3は意味がわからないですけど
  普通にアプリが入れる仕様なんて誰も頼んでないけど

  発音は頼んだけど他は頼んでないよね？
  だから確認しろって言うルールなんだけど、それ守ってないからこうなるんじゃないの？
  ```

- Reason: **文法の語順を一度も触っていない言語に、移行が既定の値を書き込んで
  います。誰も頼んでいません。**書かないでください。触っていない欄は空のまま。

  **発音の推測は違います。オーナーが頼んでいます** ──「推測も含めて入れる
  でしょ」（この log の上の項目、2026-09-04）。**あれはそのまま生きています。
  取り消していません。**

  **リーダーの誤りを記録しておきます。**私は最初この項目を「アプリは人が
  打っていない値を書き込まない」という**一般の規則**として書き、**発音の決定に
  差し替えの印を付けようとしました。**オーナーが頼んだものを、頼まれていない
  ものと同じ箱に入れたわけです。**CLAUDE.md が名指しで禁じている形です** ──
  「決定を、より筋の通った規則に読み替えたり、近くのものに広げたりしない」。

  **確かめずに広げたのが原因です。**オーナーの言葉:「だから確認しろって言う
  ルールなんだけど、それ守ってないからこうなるんじゃないの？」
- Affected features: 文法の語順の既定値。**発音は変えません**
- Affected data: 文法の語順を触っていない人の欄が、空のままになります
- Affected docs: この項目、`docs/EXPIRY.md` 4番
- Implementation status: **未実装。**オンライン前提への書き換えと同じ回で

### バックアップのファイルも無くす。★の51件目は一番古いのを押し出す
- Date: 2026-09-04
- Area: `www/backup.js`（第24章）、`ios/App/App/LinguaShare.swift` の `keep()`/`kept()`、
  `tools/backup-check.mjs`、設定→データの一覧。そして★を付けた検索
- Decision:

  ```
  古いのの押し出していいよ
  2バックアップファイルいらねえっていったよね？オンラインって言ったよね？
  ```

- Reason: **リーダーが古いものを引きずっていました。**「オンライン前提。写しも
  持たない」と決めたのに、**バックアップのファイルだけ「最後の一枚」として
  残す設計を書いていました。**オーナーに指摘されました。

  **ファイルの仕事は、もうありません。**あれは「サーバーにも iPhone にも
  何も無くなったとき」の備えでした。**サーバーが唯一の本物になり、その
  サーバーがバックアップされるなら、その場合は運営側が戻します。**
  **二つ持てば、また二本になります** ── それがこの一連の話で消そうとして
  いるものそのものです。

  **★の51件目は、一番古いのを押し出します。**上限50はそのまま
  （OWNER 2026-09-04「50でいいよ。それ以上は増えないで」）。断らずに押し出す。
- Affected features: ㉔ バックアップ ── **章ごと無くなります**
- Affected data: **減ります。**`Documents/Languages/` に書かれていたファイルと、
  その三世代。**サーバーのバックアップがそれを引き受けます。**
- Affected docs: この項目、`docs/DATA_SAFETY.md`、
  `CLAUDE.md` 規則11、`docs/STATE.md`、`supabase/setup.md`
- Implementation status: **設計に入れ直します（`claude/one`）。**

  **これで「消えないための仕組み」は一本になります** ── サーバーが本物、
  版を積む、サーバー自体がバックアップされる。**それだけです。**

  **`supabase/setup.md` のサーバーのバックアップが、いよいよ唯一の土台です。**
  そこが無ければ何も残りません。

### オンライン前提に切り替える。保存を押した瞬間にサーバーへ行く
- Date: 2026-09-04
- Area: 保存・同期・オフライン。**制作側ぜんぶ**
- Decision:

  ```
  やっぱりここの穴埋めるためにも一旦オールサーバーのオンラインアプリに
  すべきでは？余裕が出たらオフライン対応にするのは？

  変更しよう。
  いやまだリリースしてないから、リリースする前にバグは潰したい。
  溜まってるのはないから別に消えてもいいからオンライン前提のアプリに切り替えよう。
  保存するたびにサーバーに飛ぶ感じ？
  ```

- Reason: **同じ日の「オフラインで作れるのは制作だけ」を、オーナー自身が
  差し替えました。**（下の項目は SUPERSEDED です。）

  **穴が塞がるのではなく、無くなります。**2026-09-04 に見つかった穴は全部
  「二箇所で別々に変わったとき、どっちが勝つか」の境目にありました。
  **書き込みが一箇所からしか来なければ、その問いが存在しません。**合わせる
  仕組み、直した時刻、番号の被り、狂った時計 ── 全部消えます。

  **「保存された」の意味が一つになります。**いままでは iPhone に書いて
  あとで送っていたので、「保存できた」と「サーバーに載った」がずれていました。
  **そのずれが穴でした。**押した瞬間にサーバーへ行けば、二つが同じ瞬間です。

  **一文字ごとには飛びません。保存を押したときだけです。**同じ日の
  「保存を押したときだけ、保存されているものが変わる」がここで噛み合います
  ── **保存ボタンが「サーバーに行く瞬間」そのものになります。**

  **繋がっていなければ保存できません。そう画面に出します。**黙って iPhone に
  溜めません。溜めた瞬間に、いま消そうとしている問題が戻ります。

  **そして写しも持ちません。**

  ```
  オフラインをなくそう。
  写しも別に今はいらなくない？今後の設計で。
  ```

  OWNER 2026-09-04。**書き込む写しは持ちません。**仕組みに入れておくと、必ず
  「これが本物かもしれない」と思い始めます ── **それが今日の穴でした。**

  **電波が無いときの画面は、同じ日の「電波が無いときは、前に読み込んだ分を出す。
  見るだけ」が今の仕様です**（この決定ログの上のほう）。真っ白にはしません。
  **前に読み込んだものを、見るだけ出します。**その写しは**読むだけで、
  サーバーへ戻る道はありません。**

  **iPhone に残るのは `lingua.sess` だけです** ── どのアカウントでログイン
  しているか。**これは写しではなく「この iPhone は誰か」という札**で、無いと
  起動のたびにログインし直しになります。CLAUDE.md 規則22 が元からそう
  書いています。
- Affected features: 保存・同期・復元・運営側の復旧。制作側の全画面
- Affected data: **減ります。**合わせるために持っていた控え（最後に一致した
  写しなど）が要らなくなります。**まだリリースしていないので、いま iPhone に
  溜まっている未送信の変更はありません** ──「溜まってるのはないから別に消えて
  もいい」OWNER。**移行で拾う仕事はありません。**
- Affected docs: この項目、`docs/DATA_SAFETY.md`、
  `docs/ARCHITECTURE.md`、`CLAUDE.md` 規則22
- Implementation status: **設計中（`claude/one`）。**リリース前に潰す
  ──「まだリリースしてないから、リリースする前にバグは潰したい」

  **サーバーに版を積むこと自体は変わりません**（同じ日の決定）。
  **番号はサーバーが配ります。iPhone の時刻はもう要りません** ── 書き込みが
  一箇所からしか来ないので、順番はサーバーが受け取った順そのものです。
  **狂った時計の問題も消えます。**

### オフラインで作れるのは制作だけ。版はサーバーの番号、勝ち負けは iPhone の時刻 ── 同じ日に差し替え
- **SUPERSEDED。**上の「オンライン前提に切り替える。保存を押した瞬間にサーバーへ行く」（OWNER 2026-09-04）が今の仕様です。**この項目のとおりに作らないでください。**オフラインは、余裕が出てから足します。
- Date: 2026-09-04
- Area: 保存・同期・版の積み方
- Decision:

  ```
  （オフラインを切れば楽か、と自ら問うたうえで）
  うん。制作のみで。

  時刻もしくは番号で管理すればいいのか？番号だと被る可能性ある？
  ```

- Reason: **オフラインは残します。ただし制作だけ。**SNS は元からオンライン
  だけです。オーナーが 2026-09-03 に決めた「制作はオフラインでも可能、次
  つながった時に更新される」は、そのまま生きています。

  **切らない理由:** 面倒の正体は「オフラインだから」ではなく、**同じものが
  二箇所で別々に変わるから**です。一台で電波の無い所で作って繋がったときに
  上げるのはぶつかりません ── 順に積むだけです。ぶつかるのは二台目からで、
  それは下の時刻で決まります。**辞書を書く作業は、電車でも布団の中でも
  できたほうがいい類のものです。**

  **番号だけでは被ります。**二台がどちらもオフラインで作ると、両方が同じ
  番号を作ります。**番号は一箇所が配らないと被ります。**

  **時刻だけでも足りません。**iPhone の時計は人がいじれます。去年にして
  ある端末の新しい変更が「古い」ことになります。

  **だから両方使い、役割を分けます。**

  | | 誰が付ける | 何のため |
  |---|---|---|
  | **番号** | **サーバー** | 積む順番。「◯番に戻す」と言えるように |
  | **時刻** | **iPhone**（直したその場で） | どっちが勝つか。後から直したほうが残る |

  **オーナーが決めた二つが一つずつ対応します** ──「サーバーに版を積む」には
  番号が、「後から変えたほうが残る」には時刻が要ります。**片方では足りません。**
- Affected features: 保存・同期・復元・運営側の復旧
- Affected data: **増えます。**版ごとに、サーバーの番号と、iPhone が押した時刻
- Affected docs: この項目、`docs/DATA_SAFETY.md`
- Implementation status: **設計中（`claude/one`）。**

  **決まっていないことが一つ残っています ── 時計が狂っている iPhone。**
  サーバーは「受け取った時刻」も持てるので、iPhone の言う時刻がありえない値
  なら気づけます。**気づいたあと断るのか、受け取った時刻で代用するのかは
  決めごとです。**`claude/one` に選択肢を並べさせます。**勝手に決めさせない
  こと。**

### 消えないための仕組みを一本にする。サーバーに版を積む
- Date: 2026-09-04
- Area: 保存・同期・バックアップ・復元・運営側の復旧。**全部**
- Decision:

  ```
  バックアップやデータが消えないのを全部一本化するべき
  今のなんかチグハグのやってもバグが増えるだけやろ

  （版を積むのはファイルかサーバーか、と訊かれて）
  ならそれでいこう。
  サーバーのバックアップも必要で。
  ```

- Reason: **いま「消えないため」の仕組みが九つあります。**サーバーの上書き、
  iPhone の写し、ファイル三世代、同期で合わせる所、縮む書き込みを断る所、
  復元が無いものだけ埋める所、壊れているかを見分ける所、運営側の復旧（案だけ）、
  サーバー自体のバックアップ（**入っているか不明**）。**どれも別の日に別の考えで
  足されていて、「どっちが勝つか」の答えが通る道ごとに違います。**

  2026-09-04 に見つかった二つの穴は、その境目でした ── **壊れた一本が無事な
  サーバーを上書きする**（読めない＝無い、として扱っている。CLAUDE.md が
  「『空』と『壊れている』は別の状態」と名指しで禁じている形）と、
  **保存の失敗が黙って済まされる**。**一つずつ塞ぐと境目が増えます。**

  **一本にする形:** 上書きをやめて、**サーバーに番号のついた版を積む。**
  消さない、書き換えない、足すだけ。そうすると「どっちが勝つか」は番号で
  決まり、「戻す」は「◯番に戻す」だけになり、壊れたものが上書きする事故が
  構造的に起きなくなります。**オーナーが既に決めた二つ ──「人が作ったものに
  期限は無い」「後から変えたほうが残る」── を両方満たす形がこれです。**

  **積むのはサーバーです。ファイルではありません。**ファイルはその iPhone と
  一緒に無くなり、運営側から見えず、全部の版を置くには小さすぎます。
  **ファイルは三世代のまま、役割も変えません** ── サーバーにも iPhone の中にも
  何も無いときの最後の一枚。役割が違うので二本ではありません。

  **そしてサーバー自体のバックアップが要ります。**サーバーが全部を持つなら、
  土台がそれです。`supabase/setup.md` には**一言も書かれていません**（0 件）。
- Affected features: 保存・同期・バックアップ・復元・運営側の復旧
- Affected data: **増えます。**版が積まれる分。五千語の言語で保存一回 685 KB。
  **その数字は「人が作ったものに期限は無い」の項目で承知のうえと決めています**
- Affected docs: この項目、`docs/DATA_SAFETY.md`、`docs/RECOVERY.md`、
  `docs/EXPIRY.md`、`docs/ARCHITECTURE.md`、`supabase/setup.md`
- Implementation status: **設計から。`claude/one` がコードを一行も変えずに
  設計だけ書きます。**オーナーが読んで通してから、初めて書き始めます。

  **それまで、穴を一つずつ塞ぐのは止めます** ── 壊れたものの上書きも、
  黙って失敗する保存も。**いま塞ぐと一本化のときにもう一度書き換えることに
  なるからです。**「直すじゃなくて書き換え」を、この章ぜんぶに当てます。

### ★は50件まで。それ以上は増やさない。一筆の160点は外す
- Date: 2026-09-04
- Area: ★を付けた検索（`www/sns.js`・`www/net.js`）と、文字を描く画面（`www/glyph.js`）
- Decision:

  ```
  50でいいよ。それ以上は増えないで
  160で止めないで
  ```

- Reason: `docs/EXPIRY.md` の 5番と 7番への答えです。

  **★は50件が上限で、そこは変えません。**いま起きているのは、50件より多く
  ★を付けている人が起動すると**この iPhone の一覧が新しい50件で置き換わり、
  51件目より古いものへ行く道が無くなる**ことです。サーバーの行は消えません。
  **上限が50でよい以上、51件目を付けたときに何が起きるかだけが残ります**
  ── いまは黙って押し出されます。

  **一筆の160点は外します。**文字を描いていて一本の線が160点を超えると、
  そこから先の点が捨てられていました。**この数は誰も決めていません**
  ── コードに書いてあるだけで、コメントは「実際のどの線よりも高い数」と
  言っていました。長い一筆を引く人だけが当たります。
- Affected features: 検索（★）、文字を描く画面
- Affected data: **一筆の点。**外すと、いままで途中で捨てられていた点が
  残るようになります。既に描かれたものは変わりません
- Affected docs: この項目、`docs/EXPIRY.md`、`docs/CHANGELOG.md`
- Implementation status: **未実装。**ビルドのあとに配ります

### バックアップの三世代と、元に戻せる段数は、いまのまま
- Date: 2026-09-04
- Area: `ios/App/App/LinguaShare.swift`（`keep()`）、`www/glyph.js`、`www/keyboard.js`
- Decision:

  ```
  元に戻すのもそれでいいよ
  ```

- Reason: 元に戻せる段数（描く画面60手・キーボード40手）は**画面を開いて
  いる間だけの一時的なもの**で、保存されているものは何も消えません。
  そのままでよい、というのがオーナーの答えです。

  バックアップの三世代についてはオーナーが「よくわからん」と言ったので、
  **説明をやり直して、改めて訊きます。**決まっていません。
- Affected features: 無し
- Affected data: 無し
- Affected docs: この項目、`docs/EXPIRY.md`
- Implementation status: 何もしません

### できないことは、有料と同じ画面に同じ形で出す。押したら有料へ
- Date: 2026-09-04
- Area: `can()` を呼んでいる所ぜんぶ。**キーボードだけの話ではありません**
- Decision:

  ```
  全部一緒
  有料から無料も同じ画面でタップしたら有料に行くように

  ？は一つでいいの説明
  ```

- Reason: `docs/HIDEFREE.md` に挙がった六件への答えです。**キーボードで決めた
  形を、そのまま全部に広げます** ── 一覧は有料と同じ形で並び、できないことも
  同じ見た目で在り、**押したときに有料へ行く。**

  いま起きているのはその逆です。**設定→データの「CSVの取り込み」が点線の箱**
  で並び、**リストの取り込みのボタンが「ファイルを選ぶアップグレード」と繋がって
  化け**、**自作文字のアップロードも同じ形**です。押せない物・壊れた文字を
  見せるのではなく、**ふつうに在って、押したら有料へ行く。**

  **`？` は説明を置いてよい唯一の場所です。**「？は一つでいいの説明」
  ── キーボードの `？` の中にある無料向けの二行は、そのままで正解です。
  画面に説明を書かない規則の例外がここで、CLAUDE.md が元からそう書いています。
- Affected features: `docs/HIDEFREE.md` の一〜三（四は既に直っていた、五は
  そのままでよい、六は規則に当たらない）
- Affected data: 無し。見た目と、押した先だけ
- Affected docs: この項目、`docs/HIDEFREE.md`、`docs/CHANGELOG.md`
- Implementation status: **未実装。**ビルドのあとに配ります

### 「端末」という言葉は禁じられていない
- Date: 2026-09-04
- Area: 画面に出る言葉ぜんぶ（`www/i18n/`）と、docs の書き方
- Decision:

  ```
  端末を禁止したことないけど
  ```

- Reason: **私（リーダー）が間違えて、禁じられていると報告しました。**
  CLAUDE.md が言っているのは **「端末ごと」という単位を作るな**という
  中身の話で（「端末ごとにやることなんてねえよ」OWNER 2026-09-03）、
  **言葉そのものは禁じていません。**`docs/FEATURE_RULES.md` 自身が何度も
  使っています。

  **「端末に適用」「この端末の中」はそのままで構いません。**
  `docs/HIDEFREE.md` の七番は取り下げです。
- Affected features: 無し
- Affected data: 無し
- Affected docs: `docs/HIDEFREE.md` の七番を取り下げに書き換えました。
  **私は「`docs/RECOVERY.md` にその語を禁じる行がある」と報告しましたが、
  そんな行はありません** ── あるコミットの題名を、文書の中身と読み違えた
  ものです。`docs/STATE.md` と `docs/HANDOVER.md` にあるのは
  **「端末ごとという単位を使わない」**で、これは正しいので残します。
- Implementation status: 何もしません

### 数は、出たあとに変わらない。サーバーに訊く前はロードを出す
- Date: 2026-09-04
- Area: **画面ぜんぶ。**とくにフォロー数・フォロワー数と、検索の画面
- Decision:

  ```
  気になったのは検索の時に検索してない時にずっとロードされてるのと、
  フォローとか0って出て1秒後に1とか数字が変わる。
  1秒後に変わるやつは本当に嫌だから、サーバーに聞く前にロード挟んで
  絶対に遅れて表示させることないように。
  ```

- Reason: **二つの逆向きの間違いが同時に起きています。**

  一つは、**まだ知らない数を 0 として出してしまう**こと。フォローが 0 と
  出て、一秒後に 1 に変わる。人はその 0 を読んでいるので、**app が嘘をついて
  から訂正した**ことになります。オーナーの言葉が一番はっきりしています ──
  「1秒後に変わるやつは本当に嫌だ」。

  もう一つは逆で、**何も待っていないのにロードを出しっぱなし**にしている
  こと。検索の画面で、何も検索していないのにずっと回っています。

  **どちらも「知らない」と「無い」を同じ顔で出したことから来ています。**
  正しくは三つの状態が別々の顔を持ちます ── **まだ訊いていない**（ロード）、
  **訊いて 0 だった**（0）、**訊く必要が無い**（何も出さない）。

  **これは一画面の直しではなく、全部に効く決まりです。**サーバーに訊いて
  出す数は、訊く前にロードを出す。**先に仮の数を出して、あとで差し替えては
  いけません。**
- Affected features: ⑯ SNS、プロフィール、検索。**サーバーの数を出す所ぜんぶ**
- Affected data: 無し。出し方だけ
- Affected docs: この項目、`docs/CHANGELOG.md`
- Implementation status: **未実装。**上限が戻ったらセッションに配る

### タグは本文の文字。翻訳しない。青くて、押せて、前の日も出る
- Date: 2026-09-04（夜）
- Area: お題（`prompt`）、投稿の作成、検索（`www/sns.js` `www/post.js`）
- Decision:

  ```
  投稿する時にタグを入れられるようにしろよ
  本文に#つけられるようにしろよ
  翻訳はいらんから
  しかも何で検索が今日しか出ないの？ありえないだろ
  端末って何の話なの？サーバーだろ全部

  タグは本文中に。
  タグは青く光るからタップしたらタグの検索になる。
  フィルターにも今日のお題は追加してもいいかもね。
  検索は前の日も出るように
  ```

- Reason: **この日の昼に決めた形（下の【差し替え済み】の二つ）を、
  オーナーが同じ日の夜に差し替えました。**昼の形はタグが
  `t('day.tag')` の十言語ぶんで、アプリが投稿の横に一行として描くものでした。
  人は打てず、十の言い方に割れ、検索は `netFindPrompt()` が
  **その日のお題しか名指しできない**ので前の日が出ませんでした。

  **タグは本文の文字です。**人が `#` を打てる。綴りは一つ（`DAY_TAG`、
  `www/sns.js`）で、翻訳しません ── 十の言い方は十のタグで、文字合わせの
  検索では一生出会いません。

  **集めるのは今も列です。**`post.pr` は消えていません（OWNER DECISION
  2026-08-23 #6）。消えたのはその上に乗っていた二つ目の仕組みで、
  「投稿の本文にタグの文字が入る」は昼の決定にも既に書いてありました。

  **意味はお題の下では読み取り専用のままです**（OWNER DECISION 2026-08-23
  #5）。タグが入るのは**行（本文）**で、そこは打てる欄なので外せます。
  タグを外しても、その日に答えたことは列に残ります。

  **「フィルターにも今日のお題は追加してもいいかもね」は決まっていません。**
  「かもね」なので手を付けていません。
- Affected features: ⑯ SNS（`docs/FEATURES.md`）
- Affected data: 投稿の本文（`body.ln`）にタグの文字が入る。**保存する形は
  変わりません** ── 増える欄も消える欄もありません
- Affected docs: この項目、下の二つ（差し替え済み）、`docs/CHANGELOG.md`
- Implementation status: **実装済み**（`claude/tl2`、`tools/find-check.mjs`）

### 【差し替え済み】お題は #今日のお題。十言語ぶんで、どの言語で書かれていても同じ一つ

> **上の「タグは本文の文字。翻訳しない」で差し替わりました。**
> 下は当日より前の記録です。従わないでください。

- Date: 2026-09-04
- Area: お題（`prompt`）、投稿の作成、検索（`www/sns.js`）
- Decision:

  ```
  お題は#今日のお題で。10言語文。
  これも上タップして投稿すると勝手に入って言語関係なく翻訳される。

  検索も#@投稿が一気に検索できるようにして
  ```

- Reason: お題にハッシュタグが無く、その日のお題で投稿を集める道が無かった。
  **上のお題をタップして投稿すると、`#今日のお題` が勝手に入ります。**人が
  打つものではありません。

  **文もタグも、読む人の設定言語です。**

  ```
  今日のお題は翻訳もタグもその人の設定言語になるようにしてって頼んでるんだけど
  ```

  OWNER 2026-09-04。**お題の文そのものは既にそうなっています** ── サーバーが
  十言語ぶんを持っていて、読む人の設定言語のものを出します（OWNER 2026-09-01
  「今日のお題だけ、毎回その人の表示言語になるようにできないの？」で入った分。
  `www/sns.js` の `daySay()` と `dayMap()`。**リーダーが読んで確かめました。
  実機では押していません**）。

  **入っていないのはタグだけです。**この項目に**タグしか書かなかったのは
  リーダーの落ち度**で、次に読む人が「文のほうはどうなのか」を迷います。
  **文とタグは一続きの一つの決定です。**

  **十言語ぶんというのは、十個の別々のタグではありません。**一つのタグが、
  読む人の言語で表示されるということです ── 日本語の人には `#今日のお題`、
  英語の人にはその言語での言い方。**日本語で書かれた投稿と英語で書かれた
  投稿は、同じ一つのタグで一緒に出てきます。**「言語関係なく翻訳される」は
  そこです。これが分かれていたら、その日のお題が言語の数だけ割れます。

  **そして検索は、#（タグ）と @（人）と投稿を一度に返します。**箱は一つ、
  結果も一度。今は投稿しか見ておらず、しかも Enter を押したときだけでした。
- Affected features: ⑯ SNS（`docs/FEATURES.md`）
- Affected data: 投稿の本文にタグの文字が入る。**タグそのものを別に保存する
  かどうかは実装の話で、この決定はそこを指定していません。**投稿には既に
  「どのお題に対する投稿か」を持つ欄があります（OWNER DECISION 2026-08-23 #6）
- Affected docs: この項目、`docs/CHANGELOG.md`
- Implementation status: **未実装。**`claude/find2` に配布

### 上限のポップは Pro を言う。Plus は飛ばす
- Date: 2026-09-04
- Area: 上限に当たったときのポップの文（十言語ぶん）
- Decision:

  ```
  proなら無制限で使用できます

  でいいんじゃない？plusよりもproは売りたいよね
  ```

- Reason: 無料でキーボードの＋を押したときのポップが「Pro なら無制限です」と
  言い、間にある Plus を飛ばしていた。**それでよい、というのがオーナーの答え
  です。**Plus より Pro を売りたいので、ポップは Pro を言う。
  **これは「一番近い段を案内する」より優先します。**
- Affected features: 上限のポップを出す全部の口
- Affected data: 無し。文だけ
- Affected docs: この項目
- Implementation status: `claude/kbfree2` に配布。**「Pro なら無制限です。」を
  「Pro なら無制限で使用できます。」に。十言語ぶん。**

### ＋は右下。上限を越えて押したときにポップが出る。無料に空の枠は並べない
- Date: 2026-09-04
- Area: キーボードの章（`www/keyboard.js`、⑨）。**そして枠の考え方は全画面へ**
- Decision:

  ```
  ＋は右下につけて
  プラスは5個目以降
  無料は1個目以降
  ポップが出るように

  編集ボタンも無料はいらんやろ

  課金からフリーの隠すルールも全部に適応ささてね
  ```

- Reason: **2026-09-03 の「有料と同じ数の枠が並ぶ」は、これに差し替わりました。**
  そちらは無料の画面に **キーボード2・3・4 という空の行を三つ**並べていて、
  オーナーが実機で見つけました ──「無料なのにキーボード1〜4表示されてるのは
  なぜ？」。**持っていない物を三つ、在るように見せていた**わけで、しかも
  有料は作った数だけしか並ばない（`kbSlots()` が `kbBoards().length`）ので、
  **一つしか持てない人が一番たくさんの行を見せられている**という逆さまの
  状態でした。「無料も有料も同じ画面」を直したはずが、無料だけ別の画面に
  なっていた。

  **同じなのは画面の形です** ── 一覧であること、**持っている数だけ行が並ぶ**
  こと、行がキーボードの絵と名前であること、下に「キーに文字を表示」がある
  こと、そして**右下に＋があること**。違うのは**＋を押したあとだけ**で、
  上限に届いていなければ追加、届いていればポップ。

- Affected features: ⑨ キーボード（`docs/FEATURES.md`）
- Affected data: **無し。**見た目と、＋を押したときにどこへ行くかだけ
- Affected docs: この項目、`docs/CHANGELOG.md`、`docs/keyboard.md`
- Implementation status: **未実装。**`claude/kbfree2` に配布。直す所は五つ:
  `kbSlots()`（`www/keyboard.js:979`）と、そこと `vKb()` の上のコメント二つ
  （:969 と :2378）、`tools/kb-check.mjs` の二箇所（:1708 と :3442、
  `freeSlots` を含む）。**古い文は消すこと ── 残すと読まれます。**

  数は既に `www/core.js:791` に一つずつ在ります ── `FREE_KB=1`、`PLUS_KB=4`、
  Pro は `kbCap()` で無制限。**新しい数を書かないこと。**

  **無料に編集は要りません。**無料の board 0 は QWERTY そのもので、
  編集する物がありません。開く矢印も編集ボタンも出さない。

  **そして最後の一行は、この画面だけの話ではありません** ──「課金からフリーの
  隠すルールも全部に適応ささてね」。**あるプランでできないことは、空の枠や
  灰色の行として見せるのではなく、出さない。**押した瞬間にポップで伝える。
  他の画面にも同じ形が残っていないか、`can()` を呼んでいる所を全部あたること。

### 上限のポップは、そこに出す。後ろの画面は閉じない、動かさない
- Date: 2026-09-04
- Area: 上限に当たったときのポップ（`capPop` まわり）。呼ぶ側ぜんぶ
- Decision:

  ```
  全部1枚目みたいにポップ出して背景変えずに
  ```

- Reason: いま二通りある。**単語の作成のシートを開いたまま、その上にポップが
  出る**road と、**シートを先に閉じてから、下にあった画面の上にポップが出る**
  road。後者は、上限に当たっただけで書きかけの画面が消える。オーナーが選んだのは
  前者 ── ポップは今いる所に出て、後ろは何も変わらない。
- Affected features: 上限のポップを出す全部の口。**一箇所にする**（`docs/DUPLICATES.md` 7番）
- Affected data: 無し。見た目と、押した後どこに立っているかだけ
- Affected docs: `docs/DUPLICATES.md`、`docs/STATE.md`
- Implementation status: `claude/dup2` に配布ずみ

  **これは「後ろを閉じない」という一つの決まりで、ポップだけの話ではない。**
  ポップから「アップグレード」でプランへ行き、戻ってきたときに立っているのも、
  ポップを出したその画面である（`docs/DUPLICATES.md` 8番はこれで決まる）。

### 人が作ったものに期限は無い。バグで消えた分はずっと戻せる
- Date: 2026-09-04
- Area: 保存されるもの全部。とくに復旧の履歴（`supabase/schema.sql`）
- Decision:

  ```
  そもそもバグで消えるなら一生残るはずだよね？自分で消してるわけじゃないし
  基本一生残るよな
  2016年のTwitterアカウントいまろぐいんしてもみれる
  ```

- Reason: 自分で消したのでなければ、消える理由が無い。何年も前のものが
  そのまま開けるのが当たり前で、この app もそうである。
- Affected features: 復旧（`docs/RECOVERY.md` 案A）。スライスの前の版を残す表に、
  **期限も掃除の仕組みも作らない。**
- Affected data: `slice` の前の版。増える一方になる。一語足すたびにその時点の
  単語ぜんぶが一行残るので、五千語の言語で一回 685 KB。数字は承知のうえ。
- Affected docs: `docs/RECOVERY.md`、`docs/DATA_SAFETY.md`、`docs/STATE.md`
- Implementation status: `claude/rec2` が実装中

  **CLAUDE.md の「Data」が元から同じことを言っている** ── automatic deletion,
  pruning and cleanup are forbidden unless a written spec asks for them。
  この決定はそれを、期間を訊かれたその場で言い直したもの。

### 無料でも有料と同じ数の枠が並ぶ。二つ目以降は押すとプランへ ── 2026-09-04 に差し替え
- **SUPERSEDED。**上の「＋は右下。上限を越えて押したときにポップが出る。無料に空の枠は並べない」（OWNER 2026-09-04）が今の仕様です。**この項目のとおりに作らないでください。**
- Date: 2026-09-03
- Area: キーボードの章（`www/keyboard.js`、⑨）
- Decision:

  ```
  キーボードの画面無料だと何で1個なの？
  一覧が並ばないの？無料も有料も同じ画面っちうルールは？
  ```

  そしてリーダーの二択に対して:

  ```
  有料と同じ数の枠が並び、二つ目以降は押すとプランへ
  ```

  **無料でも、有料と同じ数の枠が一覧に並びます。**一つ目は今までどおり
  ── 無料の board 0 は QWERTY そのもので、編集はできません。**二つ目以降の
  枠を押すと、プランの画面へ行きます。**説明文は書きません ── 枠が在って、
  押すとプランへ行く、それだけです。

- Reason: **2026-09-01 の「無料でもplusでもproでも同じ画面なのよ」に反していた
  状態です。**`HELP.kb` のコメント自身がその決定を引用しているのに、
  `vKb()` は無料で一覧の手前から返っていて、無料の画面には行が一つも
  ありませんでした。オーナーが実機で見つけました。

  枠が並ぶことと、押すとプランへ行くことは一つの文です。2026-08-25 の
  「そのプランでできることできないことで UI 自体に変更がない方が良くない？」
  「課金させる動線を減らしたくない」がその形で、`langStop()` と `kbAdd()` の
  上限が既に同じ形です。
- Affected features: ⑨ キーボード（`docs/FEATURES.md`）
- Affected data: **無し。**`KB` の中身は増えません ── 枠は画面が見せるもので、
  言語が持つものではありません。無料の `kbBoards()` は `[kbFree()]` を答え、
  `kbFree()` は storage に無く `kbFixed()` から毎回組まれます。
  `kb-check` が「無料の board が増えていないこと」を持っています
- Affected docs: この項目、`docs/CHANGELOG.md`、`docs/keyboard.md`
- Implementation status: **IMPLEMENTED（この項目と同じコミット）。**
  `kbBoards()` の無料の枝、`kbSlots()`、`kbFrameHTML()`、`vKb()`。
  `tools/kb-check.mjs` に **8 本**足しました（`say(` の行は 289 → 299 で、
  残り 2 本は手順のボタンの項です）。全部赤を見ています。既に在った無料の章の
  6 本は、board 0 の頁に立たせ直しました ── 一覧に立つと `#kb` が無いので、
  そのままなら「無料のキーボードが消えた」と読める赤になります。
  **DEVICE CONFIRMED ではありません。**

  **枠の数について、オーナーに確かめる一行があります。**「有料と同じ数」の
  有料の上限は `kbCap()` で、無料 1・Plus 4・**Pro は `Infinity`**
  （「1,1+3.無制限って言わなかったっけ？」）。Pro の数は並べられないので、
  **有料の有限の上限 `PLUS_KB`（4）**を読んでいます ── Plus の一覧が持てる
  行数がちょうど 4 なので、「有料と同じ数」はそこです。違うなら
  `kbSlots()` の一行です。**`kbCap()` の数は触っていません。**

### 設定へ飛ぶボタンを、手順 1 にも置く
- Date: 2026-09-03
- Area: `HELP.kb` ── キーボードを iOS で入れる四つの手順（`www/keyboard.js`）
- Decision:

  ```
  後これも、この画面まで飛ぶリンクあったはずなのに無くなった？
  ```

  リーダーが「手順 3 の中に在ります」と答えたのに対して:

  ```
  １にもほしくない？
  ```

  **手順 1 にも、手順 3 と同じ「設定を開く」のボタンを置きます。**同じ
  `kbSettings()` を呼び、文言も同じ `kb.sys.go` です。
- Reason: 手順 1 が、設定へ行けと初めて言っている場所です。ボタンは三つ先に
  しか無く、オーナーは「無くなった？」と読みました。
- Affected features: ⑨ キーボード
- Affected data: 無し
- Affected docs: この項目、`docs/CHANGELOG.md`、`docs/keyboard.md`
- Implementation status: **IMPLEMENTED（この項目と同じコミット）。**
  `kbSettings()` は一箇所のままで、二つ目は作っていません。新しい鍵も
  作っていません。`kb-check` が「手順 1 と手順 3 の両方に在る」ことと
  「両方が同じ一つの関数を呼ぶ」ことを別々に持っています。

  **開くのは Settings → Lingua です**（`openSettingsURLString` が Apple の
  唯一の公開の戸 ── `ios/App/App/LinguaShare.swift` がそう書いています）。
  手順 1 の行そのもの（Settings → General → Keyboard → Keyboards）には
  公開の URL がありません。**DEVICE CONFIRMED ではありません。**
### 買う画面には、そのプランが売っているものを全部書く
- Date: 2026-09-03
- Area: プランのカードの行（`PLANS` の `lines`、`www/core.js` と `www/i18n`）
- Decision:

  ```
  何で入ってないの？
  ```

  Pro の行に **「言語を三つ」と「ダウンロード三つ」**、Plus の行に
  **「ダウンロード一つ」**。`langCap()` と `dlCap()` が売っている数が、
  買う画面のどこにも書かれていなかった。

  **説明文にしない。名前で書く。**「アプリ内に説明書くの禁止」はそのまま。
- Reason: 上限は値段の一部で、書いていなければ売っていないのと同じ。
  Pro は言語 3 個と DL 3 個、Plus は DL 1 個を持つのに、五行のどれもそれを
  言っていなかった。監査 C（`docs/scope/aud-pay.md` の 49）が見つけた。
- Affected features: `PLANS`（`www/core.js`）に三行。`plan.plus.6`
  `plan.pro.6` `plan.pro.7` を十言語ぶん（`www/i18n/*.js`）。
  Plus の自作言語は Free と同じ 1 なので、Plus 側に言語の行は無い。
- Affected data: 無し。画面の文字だけ
- Affected docs: `docs/PAID_FEATURES.md`、`docs/CHANGELOG.md`
- Implementation status: **入っている**（2026-09-03、`claude/aud-pay`）。
  `npm run i18n` が持つ ── 十言語のどれかで鍵が欠けると、`keys:` と
  `the walk: fell back to English` の二行で落ちる（`ko` から
  `plan.pro.7` を抜いて赤を見た）。
  `planMark()`（`www/settings.js`）に三つの絵は無く、既定の ✓ が付く。
  あの表は `claude/plannow` のもので、絵を選ぶのはそちら。

### DM は作らない。メッセージは別のアプリになる
- Date: 2026-09-03
- Area: SNS の側
- Decision:

  ```
  6は今はいいかな。
  linguaを媒体としたメッセージ専門アプリを作りたいと思ってるから、
  ディスコードみたいな。それでDMはなしにしたいかなあ掲示板とかは今後あるかも。
  ```

  **この app に DM は作らない。**Lingua で書くメッセージは、別に立てる
  Discord のようなアプリの仕事にする。**掲示板は今後あるかもしれない**が、
  今は決まっていない。
- Reason: オーナーの言葉のまま上に。リーダーが「普通の SNS にあってこの app に
  無いもの」として六つ挙げ、そのうちの一つに対する答え。
- Affected features: 無し。**作らないという決定なので、実装するものが無い**
- Affected data: 無し
- Affected docs: この項、docs/FEATURES.md、docs/BACKLOG.md
- Implementation status: **実装するものが無い。**この項が全部

### 写真の代替テキストは作らない
- Date: 2026-09-03
- Area: 投稿の写真
- Decision:

  ```
  代替テキストはいらんかなー。見えない人はあんまり人工言語作らんやろ
  ```

  **写真に説明文を付ける欄は作らない。**`alt=""` のままにする。
- Reason: オーナーの言葉のまま上に。リーダーが「普通の SNS にあってこの app に
  無いもの」として挙げ、オーナーが要らないと決めた。
- Affected features: 無し
- Affected data: 無し
- Affected docs: この項、docs/FEATURES.md、docs/BACKLOG.md
- Implementation status: **実装するものが無い。**

  **一つだけ、決めた人が知っておくこと。**Apple の審査でアクセシビリティを
  見られる場合がある ── 落ちる保証も落ちない保証も無い。落ちたらそのときに
  作る、が今の姿。

### 平キーの道を消す。アプリは今の形だけを知っている
- Date: 2026-09-03
- Area: 保存の形式、起動時の移行
- Decision:

  ```
  もうデータ無くしていいまっさらな状態で完成させるから
  もうまっさら昔のいらない。今の状態の話平キーなんかいらない
  今の情報のコードに書き換えて
  ```

  **言語が一つしか持てなかった頃の鍵（`lingua.words` など八つ）を、アプリは
  もう読まない。**そこから写す道ごと消す。条件を足すのではなく、そのコードを
  消して今の形だけにする。

  消すもの:
  - `langMigrate()`（`www/core.js`）── 平キーを読んで写す
  - `LS_FLAT`（`www/core.js`）── 八つの鍵の表
  - `langMigStamp()` と `mig` の印 ── 写した言語にアカウントを押すためだけのもの
  - `lsWipeAcct()` の平キー削除 ── 消すものが無くなる
  - `tools/migrate-check.mjs` の平キーについての主張
- Reason: オーナーの言葉のまま上に。**リリース前で、平キーを持つ端末は
  オーナーの検証用の端末だけ。**そのデータは要らないと本人が決めた。
  残せば、読まれない道を検査が守り続けることになる。
- Affected features: 起動（`www/core.js` の頭）、`netRead()`（`www/net.js`）
- Affected data: **消える道であって、消すデータではない。**

  **これは「移行は写して、読んだものを消さない」（docs/DATA_SAFETY.md）の
  例外ではない。**移行そのものを無くすので、写す元も写す先も無い。平キーを
  持つ端末では、その八つの鍵が **`localStorage` に残ったまま、誰にも読まれ
  なくなる** ── アプリが消すのではない。
- Affected docs: この項、docs/DATA_MODEL.md、docs/DATA_SAFETY.md、
  docs/CHANGELOG.md、CLAUDE.md 規則6
- Implementation status: **未実装。**`claude/flat` に渡した（2026-09-03）

### 古い規則は残さない。全部いまの規則。食い違いはオーナーに訊く
- Date: 2026-09-03
- Area: 書かれたもの全部 ── CLAUDE.md と docs/ のすべて
- Decision:

  ```
  それで前よりバグ増えてるんだから前のルールは消せ全部今のルール。
  食い違いがあるなら俺に確認をしろ。
  ```

  1. **置き換えられた規則は消す。**「これは歴史です」と前置きして残さない。
     印を付けて本文を残すのも残したことになる。**消す。**
  2. **残っているのは、いま効いている規則だけ。**読んだ人がそのまま従って
     正しくなる状態にする。
  3. **食い違いを見つけたら、セッションもリーダーも決めない。オーナーに訊く。**
     どちらが正しそうか、という判断も含めて訊く。
- Reason: オーナーの言葉のまま上に。**理由は測られている** ── 2026-09-03、
  リーダーが置き換えられた 2026-08-28 の「ビルドが先、ゲートが後」を
  CLAUDE.md から読み上げ、その日の決定（「全部直してからビルドは見る」）と
  逆のことをオーナーに言った。**古い規則は変だと思われて疑われるが、残って
  いれば読まれる。**同じ日に、古い事実の記述（`netLike()` が `@` を落として
  いない）を読んで原因を二度誤り、間違った指示を担当に出した。
- Affected features: 無し。書かれたものだけ
- Affected data: 無し
- Affected docs: `CLAUDE.md`、`docs/` のすべて。**`docs/CHANGELOG.md` だけは
  例外で、書き換えない** ── その日に本当だったことの記録なので
- Implementation status: **2026-09-03 の監査 A〜D に渡した。**
  `claude/aud-claude` `claude/aud-data` `claude/aud-pay` `claude/aud-state`

  **この項自身が、この規則の対象です。**置き換えられた日には消してください。

### 保存していないまま画面を出ようとしたら、この app のポップで訊く
- Date: 2026-09-03
- Area: 保存ボタンのある画面すべて
- Decision:

  ```
  プロフィールも何か変えたら保存ボタン欲しい右上
  自分のポップで
  入力内容を保存しますか？はいいいえ
  ではいなら保存　いいえならそのまま戻るにしない？保存ボタン必要なとこ全部
  ```

  1. **打ち込みのある画面には、右上に保存のボタンが立つ。**変えていない間は
     薄い灰色、何か打ったら金 ── **この 1 は 2026-09-03「決定ボタンのルール」
     で置き換わりました**（下の項）。出る／出ないではなく、色で言います
  2. **保存せずに画面を出ようとしたら、この app 自身のポップが訊く** ──
     「入力内容を保存しますか？」はい／いいえ
  3. **はい → 保存して戻る。いいえ → 保存せずに戻る**
  4. **保存ボタンが要る画面すべてで同じ**
- Reason: オーナーの言葉のまま上に。「打った瞬間に保存」は、間違えて触った
  ものがそのまま残る形でもある。区切りを置いて、出るときに一度だけ訊く。
- Affected features: 保存ボタンのある画面すべて。**どの画面かはコードを読んで
  数え、オーナーに一覧を出して確かめる** ── ここで書き出すと、書き漏らした
  画面が「対象外」として読まれる
- Affected data: **無し。**打った内容が保存されるかどうかが変わるだけで、
  保存されるものの形は変わらない
- Affected docs: この項、docs/CHANGELOG.md

  **一つの仕組みで、画面ごとに書くものではない。**画面を出る道は `back()`
  （`www/shell.js`）一箇所で、左端のスワイプもそこを通る。**そこに置く。**
  画面ごとに「出るときに訊く」を書くと、書き忘れた画面が黙って捨てる。

  **`popAsk()` で訊く。**`confirm()` は禁止（2026-09-01、`es5-check` が持つ）。
  四つ目の訊き方を作らない。

  **「いいえ」は捨てるのであって、壊すのではない。**捨てられるのは打ちかけの
  ものだけで、保存済みのものは一バイトも動かない ── `docs/DATA_SAFETY.md`。
- Implementation status: **実装済み（`claude/keep`、2026-09-03）。CODE
  CONFIRMED、DEVICE 未確認。**

  **一つの仕組みです。**`KEEP`（`www/shell.js`）が打ちかけを画面ごとに憶え、
  訊くのは `back()` 一箇所（左端のスワイプは `swEnd()` がそこで終わるので
  同じ道）、ボタンを**作る**のは `navDo()` 一箇所、バーに**置く**のは
  `navTop()` 一箇所。画面が足すのは「開いたとき
  何が入っていたか」と「どう書くか」の二つだけで、**「出るときに訊く」を
  書いた画面は一つもありません。**

  **対象は打ち込みのある八画面** ── プロフィール、文字（名前とメモ）、
  世界の記事、記事の一節、キーボードの名前、文法の段（規則とメモ）、メモ、
  単語のシート。数え方と、外した画面とその理由は `docs/scope/claude-keep.md`。

  **「変えたか」は、画面を開いた瞬間の値と今の値を欄ごとに文字列で比べます。**
  打って消して元に戻したら変えていないので、ボタンも出ず、訊きもしません。
  欄が正規化するもの（@）は正規化した後で比べます。単語のシートだけは欄の
  集まりではないので、シートを一つの値にした署名を比べます ── `wEdit` は
  そのままで、書き写していません。

  **`popAsk()` に「いいえ」の行き先ができました。**これが「いいえ＝何かする」
  最初の問いです。ポップの✕と背景は今まで通り「答えていない」で、その場に
  留まります。**四つ目の訊き方は作っていません。**

  **振る舞いがオーナーの言葉の外で二つ変わりました**（`docs/CHANGELOG.md`）
  ── メモと単語のシートの保存が画面を閉じなくなったこと、文字の画面の保存が
  無料プランでも出るようになったこと。

  **@ が断られたら戻りません。**保存が効いたときだけ戻ります。14日の制限
  そのものは `supabase/schema.sql` の話で、この枝には入っていません。

  `tools/keep-check.mjs` に八画面×七つと仕組みの六つ。**八つのバグを戻して
  八回とも赤を見ました。**そのうち 2・3・8・14 は 2026-09-03 の「決定ボタンの
  ルール」で中身が変わり、ボタンの**色**を訊く形に書き換えてあります（下の項）。

### 決定ボタンのルール ── なにもない時は薄い灰色、何か打ったら金
- Date: 2026-09-03
- Area: 右上の決定ボタン（保存・投稿・追加・完了）がある画面すべて
- Decision:

  ```
  なにもない時は薄い灰色、何か打ったら金にする
  これが決定ボタンのルール。
  ```

  そして、そう言われた元:

  ```
  保存ボタンが光らないから押せるのかわからない
  くすんだ色から変更したら金になって押せるんじゃないの？
  何か入力したら金になってるボタンとなってないボタンがあるのよ
  同じボタンは共有して使用すればいいのに直書きで書いてるだろ
  だからこう言うことが起きてる
  ```

  1. **決定ボタンの状態は二つだけ。**変更が無い間は薄い灰色、何か打ったら金
  2. **変わるのは文字の色だけ。**角丸・枠・塗りは足さない（規則 18）
  3. **一箇所で作る。**画面が `<button class="navdo">` を書かない
- Reason: オーナーの言葉のまま上に。**原因はオーナーが言った通りでした** ──
  同じボタンが三通りに直書きされていて、そのうち一つ（文字を描く画面の保存）は
  `www/index.html` に規則が一行も無く、何を描いても灰色のままでした。**一つの
  ボタンを三回書けば三つのボタンで、規則が抜けるのはいつも誰も憶えていない
  三つ目です。**
- Affected features: 決定ボタンのある画面すべて。数えた結果は下の
  Implementation status
- Affected data: **無し。**押したときに何が書かれるかは一切変えていません
- Affected docs: この項、上の「保存していないまま画面を出ようとしたら」の 1、
  docs/CHANGELOG.md、`tools/keep-check.mjs`（前の決まりを文章で持っていた）
- Implementation status: **実装済み（`claude/navdo`、2026-09-03）。CODE
  CONFIRMED、DEVICE 未確認。**

  **数え直しました。**三通りの直書きは 23 箇所です ── `navdo` が 20
  （うち 4 は赤い削除）、`navq navdone` が 2（キーボードと文字の一覧）、
  `navq navsave` が 1（文字を描く画面の保存）。`.navsave` は
  `www/index.html` に定義がありませんでした。

  **一箇所は `navDo()`（`www/shell.js`）です。**23 箇所すべてがそこを呼び、
  `www/*.js` に `class="navdo"` の直書きは一つも残っていません。削除は
  `navDel()` ── 決定ボタンではなく、赤は 2026-09-01 の別の決定です。

  **「何か打ったか」は画面が答えます。**書き込む中身を知っているのは画面
  だけなので、一箇所が持つのは「状態は二つ」と「色はどこから来るか」だけです。
  ── 打ちかけの欄は `KEEP`、文字を描く画面は開いた時の線と今の線
  （`geDirty()`）、投稿は `pwSend()` が断る条件そのもの（`pwOn()`）、
  単語の追加は `addOne()` が断る条件そのもの（`wdAddOn()`）。

  **打っている間は画面を描き直さないので、色は塗り直します**
  （`navDoPaint()`）── 描き直すと打っている欄からキーボードが落ちます。

  **`tools/keep-check.mjs` が打ち込みのある八画面で持っています。**「ボタンが
  在るか」を訊いていた三箇所は、前の決まり（変えていなければ出ない）を文章で
  書き留めたものでした。いまは**在ることと色の両方**を訊きます ── 開いた時に
  在って灰色、一打で金、打ったものを元に戻したらまた灰色。片方だけでは足りま
  せん。色だけなら**ボタンが消えた app が通り**、在ることだけなら**一度も光ら
  ない app が通ります**。後者がこの決定の元になった苦情そのものです。

  **三方向とも赤を見ました** ── 金にする側を壊して 9 件、灰色に戻す側を壊して
  16 件、そして**置き換えられた前の振る舞い（変えるまで出ない）を戻して 16
  件**。三つ目は、この検査がもう古い決まりを通さないことの確認です。

  **一つだけ、まだ常に金のものがあります。**言語の名前を変えるシートの保存
  です。その欄には `IN()` が付いておらず、打っている間に走るものが何もあり
  ません。付けるには `www/act-map.js` に名前が要り、そのファイルは
  `claude/navdo` の持ち物ではありません。**リーダーへ引き継ぎます。**

### @ は14日に一度しか変えられない
- Date: 2026-09-03
- Area: プロフィールの @（handle）
- Decision:

  ```
  ユーザーネームは14日に1度しか変更できないようにしたい
  ```

  **一度変えたら、次に変えられるのは14日後。**
- Reason: オーナーの言葉のまま上に。仕組みの側で分かっていること ── @ は
  人が人を呼ぶ名前で、他の人の投稿の中に凍って残る（`post.toh`、規則13）。
  取り替えが速いと、返信先の名前が誰を指しているか分からなくなる。
- Affected features: プロフィール編集（`meSetHandle()`、`www/me.js`）と、
  **`supabase/schema.sql` の `profile_rename()`**
- Affected data: **増える。**「最後に @ を変えた時刻」。`profile` に一列
- Affected docs: この項、docs/DATA_MODEL.md、docs/CHANGELOG.md

  **どこで止めるか。サーバーです。**「the app is a suggestion and the row
  level security in `schema.sql` is the whole of the security」 ── 画面だけで
  止めると、`/rest/v1/profile` を直に叩けば何度でも変えられる。
  `profile_rename()` が既に handle の UPDATE を見ている（lingua への／からの
  改名を断る）ので、**そこに入れる。二つ目のトリガーを作らない。**
  画面の側は、止まっていることと次にいつ変えられるかを出す ── 2026-08-22 の
  narrowing（アプリが取り去った状態には、原因と出口を最低限だけ書く）。

  **最初に @ を決めるのは「変更」ではない。**アカウントを作った直後、まだ
  一度も変えていない人が14日待たされるのは、この決定の言っていることでは
  ない。
- Implementation status: **未実装。**`claude/me3` に渡した（2026-09-03）

### キーの画面 ── 選んだら確定ボタン、もう一度触れば解除、戻れば選択は消える
- Date: 2026-09-03
- Area: キーボードのキーに何を入れるかを選ぶ画面
- Decision:

  ```
  ここに右上に選択したら適用ボタンが確定ボタン欲しい。
  終わって戻ったら選択が解除されてる状態にして欲しい
  後選択してる紫はもう一度同じ場所触れたら解除して欲しい
  ```

  三つとも同じ画面の同じ一つの振る舞い:

  1. **選ぶと右上に確定のボタンが出る。**何も選んでいなければ出ない
  2. **選んでいるものをもう一度触ると解除される。**紫が消える
  3. **その画面から戻ると、選択は残っていない。**次に開いたとき何も選ばれて
     いない状態で始まる
- Reason: オーナーの言葉のまま上に。三つは一つの形の三つの面 ── **選択は
  「今この画面でしていること」であって、言語が持つものではない。**だから
  取り消せて（2）、確定という区切りがあり（1）、画面を出れば消える（3）。
- Affected features: キーの画面（`kbKeyHTML()` / `kbLtGrid()`、`www/keyboard.js`）
- Affected data: **無し。**選択は画面の状態で、`viewReset()`（`www/shell.js`）
  が忘れる場所。**言語にも `KB` にも何も足さない**
- Affected docs: この項、docs/CHANGELOG.md、docs/keyboard.md
- Implementation status: **実装済み（`claude/keysel`、2026-09-03）。**
  `kbLtGrid()` の押しは選択を憶えるだけになり、書き込む道は `kbLtPut()` 一本。
  紫は `kbPickPaint()`（新しい色も class も足していない）。選択は
  `www/keyboard.js` の `kbLtPick` 一つで、画面を開くたびに空になり
  `viewReset()` も落とす ── **保存するものは増えていない。**
  `tools/kb-check.mjs` に 15 の主張。**CODE CONFIRMED、DEVICE 未確認。**

### 買うボタンを消したところには、今のプランと期限を出す
- Date: 2026-09-03
- Area: プランの画面
- Decision:

  ```
  消すなら同じ場所に現在このプランです〇〇/〇〇までみたいな感じにしないと
  わからんやろ
  ```

  今のプランと同じか、それより下の段が選ばれているとき、買うボタンは出ない
  （2026-09-03 の「そもそもプロなら課金自体ボタン押させないでいいでしょ」）。
  **その空いた場所に、今そのプランであることと、いつまでかを出す。**
  ボタンが消えるだけで何も出ないと、押すものが無い理由が画面から読めない。
- Reason: オーナーの言葉のまま上に。**説明文の禁止には当たらない** ── これは
  「アプリが何かを取り去った状態に、原因と出口が無い」場合に最低限の一文を
  書く、という 2026-08-22 の narrowing そのもの。凍結の画面と同じ形。
- Affected features: プランの画面（`vPlans`、`www/settings.js`）
- Affected data: **増える。**契約の期限。今は端末のどこにも無い ──
  `LinguaStore.swift` の `current` は `["plan": ...]` しか返していない。
  StoreKit の契約が持っているので、ネイティブ側から出すところから
- Affected docs: この項、docs/CHANGELOG.md、docs/DATA_MODEL.md
- Implementation status: **実装済み（CODE CONFIRMED）。**`claude/plannow`
  （2026-09-03）。`LinguaStore.current` が `Transaction.expirationDate` から
  `until` を返し、`www/store.js` の `STORE_UNTIL` が**答えた段と一緒に**
  セッションの間だけ持ち、`plNow()` が `.plgo` の中に一行を出す。
  **保存するものは増えていない。**`plan-check` に九本。
  **Swift はこの環境でコンパイルできないので DEVICE CONFIRMED ではない。**
  **`claude/rc` が同じ `LinguaStore.swift` を RevenueCat へ書き換えている** ──
  あちらは公開キー待ちで止まっているので、master が先に進み、rc が取り込む

### 検索の履歴は直近5件。人の丸い列は作らない。一件ずつ消せる
- Date: 2026-09-03
- Area: 検索の画面
- Decision:

  ```
  検索した履歴もユーザーはいらんから5個くらい検索履歴出るようにしたい
  1件づつ消せるでいいよ
  検索は🔍押したらって言ってるやん
  ```

  **履歴に入るのは 🔍 を押したときだけ。**打っている途中は入らない。
  `snsSetQ()` は一文字ごとに走るので、そこで記録すると「a」「ay」「aya」が
  三件残る ── 検索したのは押した一回で、三回ではない。**これは既にこの画面の
  決まりでもある**（2026-08-26 「ツイートの検索は検索ボタン押したら出てくる。
  それまでは人」）: 🔍 が「検索した」の意味を持つ場所で、打っている間は人を
  見ているだけ。二つの決まりが同じ方を向いている。

  **打った言葉を憶えて、検索の画面に直近 5 件を縦に並べる。**押すとその言葉で
  検索する。**丸いユーザーの列は作らない** ── オーナーが送ってきた TikTok の
  画面にはアイコンの横並びがあり、それは要らないと名指しされた。**一件ずつ
  消せる。**全部まとめて消すボタンは作らない。
- Reason: オーナーの言葉のまま上に。丸チップの横並びは CLAUDE.md § Shape が
  名指しで禁じている四つの一つでもあり、二つの理由が同じ方を向いている。
- Affected features: 検索の画面（`vExplore`）。**今ある「保存した検索」（星）の
  行は別物で、触らない** ── あれは絞り込みの行に出る、人が星を付けたもの。
  履歴は打った言葉で、星は選んだ言葉。二つの仕組みで、混ぜない
- Affected data: **増える。**打った言葉の履歴。**サーバーに置く** ──
  「NOTHING IS THE PHONE'S. EVERYTHING IS THE ACCOUNT'S.」なので、端末では
  なくアカウントのもの。`localStorage` はいつもどおり圏外で動く写し
- Affected docs: この項、docs/DATA_MODEL.md、docs/CHANGELOG.md、
  docs/FEATURES.md
- Implementation status: **未実装。**`claude/find` に渡した（2026-09-03）。
  あの枝が `www/sns.js` と `www/net.js` を持っているため

### シンプルに作る。バグが出たら、直すのではなくそのコードを書き換える
- Date: 2026-09-03
- Area: 作り方そのもの。全部の機能に対して。
- Decision:

  ```
  ルールとして決定してくれ。
  古いものは消す新しいものにする。
  シンプルに実装、コードを直してごちゃごちゃにするんじゃなくてそのシンプルの
  穴、足りない部分を修正。

  じゃないと、いつまで経ってもバカなバグが出てくるだろ
  ```

  三つあって、三つとも守る。

  **一つ、シンプルに作る。**一つのことは一つの仕組みで。同じ問いに答える場所を
  二つ作らない。

  **二つ、バグが出たら「修正」ではなく「書き換え」。**
  「直すじゃなくてシンプル実装→修正じゃなくてコードそのものの書き換え」OWNER
  2026-09-03。**言葉が二つあって、やることが違います。**

  - **修正** ── いまのコードを残したまま、足りないところに足す。条件を一つ
    増やす、二つ目の確認を入れる、例外を書く。**これは禁止です。**
  - **書き換え** ── そのコードを消して、正しい形で書き直す。行数が減ることが
    多い。

  訊く場所が間違っていたなら、**訊く場所そのものを書き換える** ── 訊き直す
  二つ目を足すのではなく。**新しい仕組みを足して古い仕組みの抜けを塞ぐのが、
  いちばんやってはいけないこと。**そこから先、その機能は二つの仕組みで動き、
  どちらが効いているか誰にも分からなくなる。

  **三つ、古いものは消す。**新しくしたら、古いほうは残さない。「歴史として」も
  「念のため」も無し。残っていれば読まれ、読まれれば従われる。

- 「これくらいの話もしてるんだけど」 OWNER 2026-09-03 ── 大きな設計の話では
  ありません。一行の条件を足そうとしたその瞬間の話です。

- Reason: 「いつまで経ってもバカなバグが出てくる」。実際そうなっている ──
  同じ日に、押させない仕組みが端末の写しを見ていたので、押した瞬間にもう一度
  Apple に訊く二つ目を足しかけた。訊く場所が間違っていただけで、答えは
  「画面が Apple に訊く」の一つだった。
- Affected features: 全部。
- Affected data: 無し。
- Affected docs: `CLAUDE.md` の頭 ── 同じコミットで書いた。
- Implementation status: **規則。止めるものはありません** ── 機械で読める形が
  無いので、人が読んで守る。

### 印の無い言語を拾うのは、オンボーディングの扉だけ
- Date: 2026-09-02
- Area: 言語とアカウントの結びつき（`langOwned()` www/core.js、
  `netLangRow()` www/net.js の四つ目の状態）
- Decision:

  ```
  1アドレス1アカウント
  これは絶対課金もアカウントごと言語もそう
  ```

  言語はアカウントのものです。だから **`uid` の無い言語を「訊いた人のもの」と
  読んでよいのは、オンボーディングの扉だけ。**オンボーディングは口座ができる
  前に物を作る唯一の場所で、`obFinish()` が扉を出た瞬間にそれを上げます。
  それ以外の場所で印の無い言語を拾うのは、前の人のものを次の人に渡すこと。

- Reason: `netLangRow()` のコメントが自分で「THE FOURTH IS THE ONE THE OWNER
  HAS TO DECIDE」と書いて残していた四つ目の状態が、これです。A がこの端末で
  作って一度も上げていない言語が、B がサインインした瞬間に B のものになって
  いました ── 辞書も文字もキーボードも、B の一覧に B の言語として。何も
  throw しません。
- Affected features: 言語一覧（`vLangs`）、言語の上限（`langCount`）、
  キーボードのプール（`kbCount`）、DL の数（`dlCount`）、
  サーバーへの送信（`netLangRow`）
- Affected data: **保存するものは減りません。**印の無い言語は索引にも
  `lingua.<id>.*` にもバックアップにもそのまま残ります。変わるのは、それを
  作っていない人に差し出さなくなることだけ。そして 2026-09-02 から作られる
  言語には全部 `uid` が付くので、これが届く範囲は「今すでに端末にあって、
  一度も上がっていない言語」に限られ、増えません。
- Affected docs: `docs/DATA_MODEL.md`、`docs/DATA_SAFETY.md`、
  `www/core.js` の `langOwned()` のコメント（同じコミットで書き換え済み）
- Implementation status: **core.js 側は実装済み**（`langOwned()`、
  `acct-check` 35 番）。`www/net.js` の `netLangRow()` 四つ目の状態は
  リーダーのもので、**まだ拾います。**

  未決が一つ、リーダーとオーナーへ: net.js の四つ目も閉じると、**今すでに
  端末にあって一度も上がっていない言語は、作った本人にも二度と戻りません。**
  いまはそれが唯一の帰り道です（`langMineIds()` は `langMine()` で歩くので
  印の無い言語も `netLangSync()` に乗り、`netLangRow()` が印を押す）。
  閉じるなら、その前に「本人が一度だけ引き取る」道が要るかどうかが決めごと。

### 端末のものは無い。全部アカウントのもの
- Date: 2026-09-03
- Area: `localStorage` に置く全部。`CLAUDE.md` § Online と § 規則22
- Decision:

  ```
  端末ごとにやることなんてねえよ
  アカウントごとってずっと言ってるよな？
  アカウントごとに言語情報も違うんだって
  ルールも書き換えてねえからそうなるんだろ
  ```

  **「端末のもの」という区分は無くなりました。**言語、投稿、下書き、
  プロフィール、段、保存した検索、通知をどこまで読んだか、**設定**、
  そのバックアップファイルと書き出したシート ── 全部、サインインした
  アカウントのものです。端末は写しを持つだけで、その写しは持ち主の名前の下に
  置かれます。

  `lingua.sess` だけが誰の持ち物でもありませんが、例外ではありません ──
  それは「この端末がどのアカウントか」そのものです。

- Reason: 2026-09-03 に、別のアカウントを消したらオーナーの言語が消えました。
  サーバーは正しく、消えたのは端末とバックアップです。`wipeHere()` が
  `lingua.` を全部消し、`bkDropAll()` がバックアップを全部落とすからで、
  どちらも「端末は一人のもの」と書いてあった 2026-08-27 の姿のままでした。
  **規則に「端末のものは三つ」と書いてあったことが、その姿を正しく見せて
  いました。**規則を消さないと同じ形が出続けます。
- Affected features: 保存するもの全部。特にアカウント削除
- Affected data: `SET` の中の `plan` `planWas` `planPend`
  `saved` `savedUp` `notAt` は、アカウントごとに `lingua.set.<uid>` へ
  預けます（`setFor()`）。`planUid` は「いま誰の分が載っているか」なので
  預けません。
- Affected docs: `CLAUDE.md` § Online、§ 規則22 ── 同じコミットで書き換えた
- Implementation status: **入りました。**三つです ──
  (1) `setFor()` が段・保存した検索・通知の位置をアカウントごとに預ける、
  (2) アカウント削除は `lsWipeAcct()` と `bkDropFor()` で**そのアカウントの
  ぶんだけ**（`lsWipeNS()` と `bkDropAll()` は消えました）、
  (3) `langOwned()` は印を読む一行で、端末を憶える枝はありません。
  `acct-check` 19・35・46 が持ちます。

### 課金はメールアドレスのアカウントに紐づく。端末が同じでも引き継がない
- Date: 2026-09-02
- Area: プラン（`SET.plan`、Keychain、`netPlanSync()`）とアカウントの関係
- Decision:

  ```
  メアドごとにアカウントも言語も課金状況も紐づくんだから、残ってるのがおかしい
  Xは違うアカウントだと課金も引き継がれない
  ```

  同じ iPhone で別のアカウントにサインインした人は、**その端末で買った購読を
  引き継がない**。段はアカウントのもので、Apple ID のものではない。

- Reason: 言語とアカウントが結びついているのと同じ話。A（Pro）がサインアウト
  して B がサインインすると、端末の `SET.plan` が pro のまま残り、次の起動で
  `netPlanSync()` が B のアカウントに Pro を書き込む。一つの Apple ID から
  いくつでもアカウントに Pro を配れる。「アカウント変えたら無限に言語作れる
  やん」（2026-09-01）で段をアカウントへ移した、その口が別の場所で開いている。
- Affected features: 課金全体。CLAUDE.md の「プランはアカウントのもの」を
  **置き換えるのではなく、その一文どおりに実装する**もの。規則の書き換えは要らない。
- Affected data: Keychain に、段と一緒に「買ったアカウントの uid」が入る。
  uid が合わないセッションは、サーバーの答えが来るまで free から始める。
- Affected docs: `docs/PAID_FEATURES.md`、`docs/scope/claude-login-billing.md`
- Implementation status: **未実装。** `claude/login-billing-code-review-ovfsxa`
  のもの。実装は 1（トークンの更新）と 2（解約が起動で戻る）のあと。
  それまでは、いま有る動きのまま ── 引き継いでしまう。

### ダウンロードは Plus から。上限は make と別で、Plus 1・Pro 3
- Date: 2026-09-02
- Area: 人の言語をダウンロードする（⑫）、`CAN.dl` と `dlCap()`（`www/core.js`）
- Decision:

  ```
  plusからです
  dlはしかもplusは1つproは3つ DL言語とmake言語でそれぞれ別の最大値
  言語足そうとしたり、dlしようとすると無料からアプデのポップ、
  plusで1個から2個に増やそうとするとアプデのポップ
  ```

  ダウンロードできるのは **Plus から**。持てる数は **Plus 1、Pro 3**。
  自分で作る言語の上限（Free 1・Plus 1・Pro 3）とは **別の数** で、
  互いに影響しない。上限に当たったら課金のポップが出る。

- Reason: オーナーが実機で、無料のままダウンロードした言語を使えることに
  気づいた。
- Affected features: ⑫。`CAN.dl` は 2026-08-19 の
  「キーボードと文字の DL は無料、辞書は Plus」を **置き換える**
  （docs/FEATURES.md § 4）
- Affected data: 何も消えない。**上限を超えた分は一覧から隠れる**
  ── 「減った時は隠すだけね」「だって単語でも文法でも同じようにやったじゃん」。
  単語が無料で先頭百語だけ並べるのと同じ形（`wordsSeen()` → `langsSeen()`）で、
  **開いている言語は必ず一覧に残る**（「開いてるものを残すでいいよ」）。
  `LANGS` も `lingua.` の鍵も一つも動かず、払い直せば全部元どおり並ぶ。
  これは `www/core.js` に書いてあった「never hides one, never shortens a
  list」を置き換える
- Affected docs: この項目、docs/FEATURES.md § 4
- Implementation status: IMPLEMENTED。`dl-check` が持つ
  （無料は不可・Plus は 1・Pro は 3・二つの数が互いを見ない）。赤を見た。
  隠す側も `dl-check` が持つ（Pro で三つ、無料で一つ、開いているものが残る、
  鍵が一つも消えない、払い直すと戻る）。赤を見た

### 言語の記事は「人にどう見えるか」──自分のページで分岐しない
- Date: 2026-09-02
- Area: この言語について（`wldPage()` の読む面、`www/home.js`）
- Decision:

  ```
  自分のページだろうが人のページだろうが人にどう見えるか
  ```

  記事の読む面は **読み手が見る画面** であり、それが誰の言語かで描き分けない。
  見出し、開くかどうか、文字の升、キーボードの絵、＞ の数 ── どれも同じ。
  「自分だから余分に出す」も「自分だから別の部品を使う」も無い。

  そして **一行に ＞ は一つ**。左の、開くための一つだけ。

- Reason: 「＞＞が二つあるのが嫌だって話前にしたよね？」「自分のページでも人の
  ページでも見た目は一緒にしてよ　なんで変える必要あんの？」「自分のページ
  だろうが人のページだろうが人にどう見えるかだろ」 OWNER 2026-09-02。
  記事は公開するものなので、自分で見る意味は「読み手にどう映るか」を見ること。
  分岐があると、自分の画面で確かめたことが読み手の画面について何も言わない。
- Affected features: ⑫ 言語の記事
- Affected data: 無し。描き方だけ
- Affected docs: この項目。2026-08-25 の「DL許可が出てるものはDLマークつけないと」
  は **読む面については置き換えられた** ── 行の ↓ 印は無くなり、人の記事では
  足元の取る行が、自分の記事では編集面の四つのスイッチがその答え
- Implementation status: IMPLEMENTED（`2442a66`）。
  **残っている差は二つあり、どちらも「見た目」ではなく「できること」です**:
  ① 右上の「編集」── 記事を書き換える入口で、記事そのものではない。
  ② 足元の ↓ の行 ── 章を **取る** ボタンで、自分の言語には取るものが無い
  （`WLDS_HAVE` に何も無いので押しても何も起きない）。ここを同じにするなら
  「自分の記事でも ↓ の行を出す」ことになり、押したとき何をするのかは
  決まっていません。**オーナーの判断待ち**

### 長押しのしきい値は 10px
- Date: 2026-09-01
- Area: プロフィールの長押しで言語を切り替える（⑬）
- Decision:

  ```
  10px
  ```

  親指が **10px を超えて動いたら**、長押しをやめる。それ以下は動いていない
  ものとして扱う。`HOLD_SLOP` が `www/shell.js` のその一箇所。

- Reason: 閾値が無かったので、`touchmove` が一画素で `holdClear` を呼んでいた。
  実機の親指は必ず一画素は動くので、**長押しは実機で一度も成立していなかった**
  （`claude/scan` が本物の TouchEvent で測定: 静止→動く、一画素→死ぬ、
  六画素→死ぬ、四十画素→死ぬ）。16px も並べたうえで 10 が選ばれた ── 寛くすると
  スクロールのつもりが切り替わる回数が増える。
- Affected features: ⑬。`www/sns.js` の同じ形も同じ値
- Affected data: 無し
- Affected docs: 無し
- Implementation status: **実装済み（master）。**`HOLD_SLOP=10` が
  `www/shell.js:824`、測るのが `:855`。

### iOS 標準のダイアログもシートも使わない ── 五つ目の禁止
- Date: 2026-09-01
- Area: 何かを訊く・伝えるときの形
- Decision:

  ```
  標準は使わねえって言ってんだろこれも禁止や
  禁止事項入れろ
  ```

  ```
  正直自前のpopがいいんだけどな。
  iPhoneのやつ使ってるsnsないしな
  ```

  **`confirm()` `alert()` `prompt()` と `UIAlertController` を使わない。**
  そして**下から出るシートも使わない**（既に禁止、CLAUDE.md § Shape の三つ目）。

  この二つが同時に禁止なので、**残るのは画面の中に重なる自前のものだけ**です。

- Reason: SNS でシステム標準のダイアログを使っているものが無い。
- Affected features: いま `confirm()` を使っている全部 ──
  単語の上限（`capStop()`）、アカウント削除（`wipeAll()`）、
  文字の削除（`ltDelete()`）、有料の門（`upStop()`）ほか。
  **数はコードから数えること。**
- Affected data: 無し
- Affected docs: `CLAUDE.md` § Shape。2026-09-01 の
  「システム標準（iOS/Android）を最優先。独自実装は『標準では実現できない
  場合のみ』」を**取り消す**
- **アクションシートの narrowing は取り消していません。**この項は一度それも
  取り消したものとして書かれていましたが、**2026-09-03 にオーナーが同じことを
  もう一度言いました**:「タップしたらios標準出して」。指の下にある一つのものを
  変えるか消すかを訊く、iOS 自身の二〜三行 ── プロフィール画像がそれで、
  それだけです。`www/mod.js` ではなく `ios/` の `UIAlertController`。
- Implementation status: **入りました（2026-09-03）。**`www/` から
  `confirm()` `alert()` `prompt()` は消えていて、`tools/es5-check.mjs` が
  止めます。言語の名前は `openForm()`、上限の言い切りは `toast()`、
  問いは `popAsk()`。プロフィール画像だけが iOS 標準のまま。

**リーダーへ: 勝手に進めない。**この決定は、形が決まる前に三度作って三度
外した後に出ている（遷移する画面 → 下から出るシート → 標準のダイアログ）。
2026-09-03 にリーダーがプロフィール画像の形を訊いて、答えは「iOS 標準のまま」
でした。**四つ目を作る話ではありませんでした。**
**訊いてから作る。**

### オーナーが機能追加をしようとしていたら、リーダーが確認する
- Date: 2026-09-01
- Area: リリースまでのあいだ、頼まれたものの扱い
- Decision:

  ```
  俺が機能追加しようとしてたら確認して欲しい。
  今は穴埋めバグ潰しに徹底しよう
  ```

  **これはリーダーへの指示で、オーナー自身の依頼にも効く。**リリースまでの
  あいだ、頼まれたものが機能追加なら、**作り始める前にそう言う。**黙って
  始めない。断るのではなく、これは追加ですと言って、オーナーが決める。

  線は一つの問いで引く ── **それは今、在ることになっているか。**

  ```
  穴        在ることになっているのに、無い
            押しても何も起きない / スイッチだけ在る / 書いたが読み戻せない
  バグ      在るものが、違う動きをする
  機能追加  今は無いことになっているものを、新しく在るようにする
  ```

  在ることになっているのに無ければ穴で、これは埋める。無いことになって
  いれば追加で、これは確認する。

- Reason: 本当は先週リリースの予定だった。遅れた原因は穴であって、機能が
  足りないことではない。**リリース前の機能追加は、埋めるべき穴を一つ増やす。**
- Affected features: 全部
- Affected data: 無し
- Affected docs: `docs/SESSIONS.md` § Who is who ── リーダーの仕事に一行
- Implementation status: 即時。この決定が書かれた時点から

**ここで止まる、ではない。**`CLAUDE.md` § Deciding は「決めごとは止まって訊く」
だが、これは逆向き ── **オーナーが決めることを、オーナーに気づかせる**ための
一行。言ったうえで進めと言われたら、それが仕様。

### 今週リリース ── 穴を埋める、実機のバグを潰す、機能は足さない
- Date: 2026-09-01
- Area: リリースまでの順番
- Decision:

  ```
  リリースは今週にしたい
  そのために足りないとこをまずは埋める

  その後実機のバグを潰す。
  機能追加はしない

  この流れで
  ```

  三段で、順番が決まっている:

  1. **穴を埋める。**「入れました」で閉じたが片側しか無いもの。今わかっている
     のは、言語がサーバーに全部上がって新しい端末で戻ること、課金がアカウントに
     紐づくこと、価格の横の定期購読の開示、⑫ のダウンロードそのもの、⑬ の長押し。
  2. **実機のバグを潰す。**オーナーが端末で踏んだものだけ。
  3. **機能追加はしない。**「あったほうがいい」は全部この線の向こう。

- Reason: 本当は先週リリースの予定だった。遅れた原因は一つの形に集約される ──
  **見える側だけ作って「入れました」で閉じ、検査が全部緑だった。**
  DL はスイッチだけ、言語の同期は上げる側だけ、課金は買う側だけ、
  長押しの検査は成立したあとの身振りを測っていた。どれも一人・一台では
  正しく動くので赤にならない。
- Affected features: 下の三つの枝が持っている分
- Affected data: 1 に入るものは全部データを触る。**消す行を書かないこと**が
  条件（同日、`claude/scan` への指示）
- Affected docs: `docs/STATE.md` §0-a
- Implementation status: 進行中

**この決定が禁じるものを、名前で書いておく。**リリース前に「ついでに」で入る
ものは全部この三段の外にある ── 整理、改名、きれいにすること、あったほうがいい
画面、次に要りそうなもの。`CLAUDE.md` § Scope の五つ（*while I'm in here*,
*this could be cleaner*, *it's related so I changed it*, *we'll need this later*,
*the existing code looked wrong*）が、いまは特に効く。

### DL した言語 ── 編集・バックアップ・単位・上限
- Date: 2026-09-01
- Area: 人の言語をダウンロードする（⑫）
- Decision:

  ```
  これも何回も言ってるんだけど、できないんだよ。
  dl言語はへんしゅうはできないってなんかいもいわせんなよ
  ```
  ```
  入らん
  ```
  ```
  いや一つづつdlでいいよ。
  ```
  ```
  別に数える
  ```

  四つ、この順で:

  1. **DL した言語は編集できない。** 2026-08-25 に同じ決定が出ていて
     （下のエントリ、原文「もちろんダメです。トキポナに文字足したらトキポナ
     じゃないです」）、`docs/FEATURES.md` § DL・`docs/DATA_MODEL.md`
     § A language that is only read の三箇所に既に書いてある。**それでも
     オーナーに四度目を言わせた。** 訊く前に grep する。
  2. **DL した言語は、その人のバックアップファイルに入らない。**
     `SLICES` に含めない。`bkPack()` は歩かない。
  3. **章は一つずつ取る。数えるのは言語。** 単語・文字・文法・キーボードは
     それぞれ別の ↓ で取るので、言語は**部分的に届く** ── 単語が入っていて
     文字が入っていない状態が正規の状態としてある。**上限が数えるのは、その
     章の数ではなく言語の数です** ──「DLしたらDL言語がアカウントに出てくる
     だろ？それはなにをダウンロードしてもその言語からDLしてんだから1個だろ」
     OWNER 2026-09-03。トキポナの四章を全部取っても **1**。`dlCount()` が
     index の行を数えているのがその形。
  4. **言語数の上限は、自分で作った言語と別に数える。**
     `langCount()` が `mine` だけ数えているのは正しい。数は 2026-09-02 の
     決定 ── Plus 1・Pro 3（`dlCap()`）。

- Reason: 1 は「トキポナに文字足したらトキポナじゃない」。2 と 4 は
  他人のものが自分の持ち物として数えられない・配られないため。3 は原文のまま。
- Affected features: ⑫ ダウンロード（`docs/FEATURES.md` § DL）
- Affected data: `LANGS[id].mine` が初めて `false` になる。`SLICES` は
  変わらないが、**DL した言語の id を `bkPack()` が飛ばす**必要がある
- Affected docs: `docs/DATA_MODEL.md` § A language that is only read の
  未決 2・3・4 を答えに差し替え済み
- Implementation status: **未実装。**`docs/FEATURES.md` は 0 lines と書いている
### 1. 画面の基準が十になった
- Date: 2026-09-01
- Area: 画面ぜんぶ
- Decision:

  ```
  この辺が世界基準だからそれ以外はやめて欲しい
  ```

  そして十項目。**原文のまま**:

  ```
  1. システム標準（iOS/Android）を最優先。ネイティブの UIKit / SwiftUI をそのまま使う。
     独自実装は「標準では実現できない場合のみ」
  2. 主要SNSの共通パターンに従う（下タブ3〜5個／上部は最小限／縦スクロール1カラム／
     投稿ボタンは右下か下中央／プロフィールはアイコン→タップ→アクションシート）
  3. 操作は1タップで完結。画面遷移を増やさない。モーダルは最大1階層。
     削除・変更はアクションシート
  4. 情報量は少なく、余白は広め。1画面1目的。説明文は極力書かない
  5. アニメーションは控えめ。フェード／スライドのみ
  6. カラーは2〜3色まで
  7. フォントは1〜2種類
  8. タップ領域は44pt以上
  9. 重要操作は取り消し可能。削除→Undo。いきなり消さない
  10. 実機で必ず確認
  ```

- Reason: **原文の一行がそのまま理由です** ──「この辺が世界基準だから」。
  基準1がほかの九つの土台で、「標準では実現できない場合のみ」独自にすると
  言っている以上、**「独自のほうが良い」は理由になりません。**
- Affected features: 画面ぜんぶ。
- Affected data: 無し。
- Affected docs: `CLAUDE.md` § Shape（直した）、この項、
  `docs/CHANGELOG.md`（`claude/fo2` が原文を入れた `3538668`。書き換えない）。
- Implementation status: **規則は直した。画面は誰も触っていない。**

#### コードと合っていない所。直していない ── **二つあります**

**どちらも「見つけたから直す」で触ってよいものではありません。**

**① 基準8「タップ領域は44pt以上」と、キーボードのキーの例外。**
`CLAUDE.md` 規則3 は 44pt を両辺に要求したうえで、**キーボードのキーだけは
高さで測る**と書いています ── 一番細い iPhone は 320 なので、横に十個並べば
一つ 32pt にしかならず、44 に広げると**キーボードというものが作れなくなる**、
という理由が付いています。基準8はそこに触れていません。
**規則3の例外を消すとキーボードが消えます。**オーナーに訊く一行です。

**② 基準7「フォントは1〜2種類」と、いま宣言されている顔の数。**
`www/index.html` の `:root` に六つ在ります:

```
  --face-ui       -apple-system … 'Noto Sans JP'      画面の地
  --face-caps     'Cinzel'                            見出し
  --face-ital     'Cormorant Garamond'                斜体の飾り
  --face-mono     ui-monospace
  --face-script   'LinguaScript'   ← その人が描いた文字。このアプリそのもの
  --face-type     'LinguaType'     ← 同上（キーボードが渡す私用領域）
```

後ろの二つは**その人の文字**なので、UI の書体の数には数えられません。
数えられるのは前の四つで、**基準7は二つまで**と言っています。
`--face-caps` と `--face-ital` をどうするかは**全画面の見た目が変わる**ので、
`CLAUDE.md`「Deciding」のとおり**オーナーのもの**です。
`tools/face-check.mjs` が両方向を押さえているので、**減らすなら検査と同じ
コミットで**。

**合っているもの**（数えました、推測ではありません）:
基準2の下タブは `TABS`（`www/shell.js:652`）が五つ ── 3〜5 の中。
基準9の「削除→Undo。いきなり消さない」は `CLAUDE.md` 規則19 が既にその形
（ゴミ箱は訊かず、後ろに戻る一歩が立っている）。
基準4の「説明文は極力書かない」は § Explaining が既に同じ。
基準10 は `DEVICE CONFIRMED` が既に同じ。

### 2. 下から出るシートの禁止が狭まった ── iOS 自身のアクションシートだけ許す
- Date: 2026-09-01
- Area: `CLAUDE.md` § Shape、三つ目の禁止
- Decision:

  ```
  アイコンをタップした時にiPhone標準の写真を選ぶか、削除するか出てくるやつでいいだろ
  ```

  そのうえでリーダーが「**画面の代わりに使うシートは今も禁止、削除・変更の
  アクションシートだけ許す、でいいか**」と訊き、オーナーが「**1はイエス**」と
  答えました。ここは原文ではなく、リーダーの二択とその答えです。

  **禁止のまま残るのは、画面の代わりに使うシート** ── 一画面ぶんの操作を、
  ページを作りたくないからという理由で下から持ち上げたもの。**許すのは、
  指の下にある一つのものを消すか変えるかを訊く、iOS 自身が出す二〜三行の
  もの**、しかも **iOS 自身のものだけ**です（基準1）。**HTML で似せて描いた
  シートは、禁止されている側が許された側の名前を着ているだけ**なので、
  そこは閉じています。`UIAlertController` が要るので `www/` だけでは持てません。

  なお `claude/fo2` の `cbc3965` は、同じ会話の中の
  「長押しで消えるってわかんないだろ普通に。」も原文として引いています。
  **こちらへ渡ってきた relay にはその行が無い**ので、原文の扱いは
  `docs/CHANGELOG.md` と `cbc3965` を見てください ── ここでは、
  二つの relay の両方に在る上の一行だけを原文として置いています。
- Reason: 基準1。標準で出せるものを独自に描くのは、基準1が「標準では実現
  できない場合のみ」と言っている側にあたります。
- Affected features: プロフィール画像を触ったときの道（`openMePic`、
  `www/me.js:787`）。いまは**画面**（`openForm`）で、変える／外すが縦に
  並んでいます。基準2の「プロフィールはアイコン→タップ→アクションシート」に
  するには `ios/App/` に `UIAlertController` が要ります。
- Affected data: 無し。
- Affected docs: `CLAUDE.md` § Shape（直した）、この項。
- Implementation status: **規則は直した。コードは誰も触っていない**
  ── `www/` も `ios/` もこの枝の持ち物ではありません。

### 3. 課金とアカウントとキーボードはアカウントに結びつく
- Date: 2026-09-01
- Area: プラン・アカウント・キーボードの持ち主
- Decision:

  ```
  課金とアカウントとキーボードはアカウントに結びつく。

  じゃないとアカウント変えたら無限に言語作れるやん
  ```

- Reason: **原文の二行目がそのまま理由です。**上限が端末に付いていると、
  **アカウントを変えるだけで何回でも作れます** ── `docs/PAID_FEATURES.md` の
  「languages on the account 1 / 1 / 3」は、アカウントに付いていて初めて
  上限になります。プランも同じで、端末の中の値なら端末を変えれば無関係です。
- Affected features: `www/core.js`（`planKeep()` / `setOnDisk()`）、
  `www/settings.js`（`setPlan()`）、`supabase/schema.sql`（`profile` の列）、
  `www/net.js`（プランを送る道）。キーボードは言語の一部なので `slice` の `kb`
  ── **こちらは既にそうなっています。**
- Affected data: `profile` に列が増えます。消えるものはありません。
- Affected docs: `CLAUDE.md` § Online、`docs/PAID_FEATURES.md`、
  `docs/DATA_MODEL.md`、`docs/STATE.md` § 3 項目4、`docs/keyboard.md`
  ── **全部直しました。**
- Implementation status: **キーボードは在る。プランは無い。**
  `profile` にプランの列が無く、`www/net.js` はプランを一度も送らず、値は
  `SET.plan`（実機では Keychain）です。差は `docs/STATE.md` § 3 項目4 に。

#### コードと合っていない所。直していない ── 報告した

**プランが端末に在る。**`www/core.js` の `planKeep()`／`setOnDisk()`、
`www/settings.js` の `setPlan()`、`tools/plan-check.mjs` の
「ブラウザでは設定ファイルに在り、実機では Keychain に在る」という主張、
`docs/PAID_FEATURES.md` がその検査について書いている行 ── **どれもコード側で、
この枝の持ち物ではありません。**プランを `profile` に載せるのは購入がサーバーに
届く話（`docs/STATE.md` § 3 の項目7）と同じ一つの仕事なので、別の枝で。

### 4. 通知の未読は「最後に通知の画面を開いた時刻より新しいもの」
- Date: 2026-09-01
- Area: 下のタブのベルに出る数
- Decision: **これは原文ではありません。**リーダーが二択で訊き、オーナーが
  「1はイエス」と答えたものです。地の文で書きます。

  **最後に通知の画面を開いた時刻より新しいものを未読とする。**X や Instagram と
  同じ形です。**サーバーに既読の表は要りません** ── `notices()` の八列に既読の
  印は無く、それは列が無いからではなく、決定がそうだからです。
- Reason: 既読を表にすると、書き込みが一つ増え、端末が増えるたびに食い違います。
  時刻一つなら、どの端末で開いても同じ答えになります。
- Affected features: 下のタブのベル、通知の画面。
- Affected data: `lingua.set` の `notAt` ── 通知の画面を最後に開いた時刻
  （ミリ秒）。移行なし、削除なし。
- Affected docs: `docs/CHANGELOG.md`（`claude/fo2` が入れた）、この項、
  `docs/DATA_MODEL.md`（`claude/fo2` の持ち物として同じコミットに在ります）。
- Implementation status: **`claude/fo2` が持っています。**この枝は
  `www/` を持っていないので、ここは記録だけです。

### 5. 端末に住むものはほとんど無い。古い記載は消す ── 決まったこと3は **superseded 2026-09-03**
- Date: 2026-09-01
- Area: サーバーと端末の分かれ目 ── 何が端末のものなのか
- Decision:

  ```
  そもそも端末に保存するもんはないぞほとんど。
  ```
  ```
  コードもそれようにして欲しい。
  古いコードとか古い記載は全部消して欲しい。
  ```
  ```
  古い記載は消していい。

  音声とかをサーバーに載せる重いのは後でって話
  ```

  決まったこと:

  1. **サーバーが本体。**SNS も言語も。投稿・写真・声・下書き・ハンドル・
     表示名・プロフィール画像・反応・フォロー・ブロック・通報、そして
     **言語そのもの**（`slice` 行のぜんぶ）。
  2. **端末が持つのは、電波が無いときに動く写しだけ。**端末は物が住む場所では
     ない。`lingua.*` の鍵はどれも写しであって家ではない。
  3. **古い記載は消す。**「これは歴史です」と前置きして残さない ── 読まれる。
  4. **重いものをサーバーへ移すコードの作業は後回し。**原文の三つ目の
     ブロックの二行目。**記載を消すことと、コードを移すことは別**で、
     消すほうが今日です。

- Reason: **書いてあるものが読まれて、間違った説明がオーナーに届きました。**
  `docs/STATE.md` § 3 は「言語はまだ `localStorage` だけ、サーバーに載せるのは
  これから」と書いたままで、`CLAUDE.md` の一覧は「タイムラインは端末に在る」と
  書いたままでした。**どちらも逆です。**リーダーがそれを読み、そのとおりに
  説明しました。**直すのは説明した人ではなく、その文です** ──
  「そのせいで勝手に君が勘違いしてるわけでしょ？」。
- Affected features: 無し（この項は仕様の言い直しであって、新しい振る舞いでは
  ない）。
- Affected data: 何も消えません。
- Affected docs: `CLAUDE.md`、`docs/STATE.md`、`docs/ARCHITECTURE.md`、
  `docs/DATA_MODEL.md`、`docs/DATA_SAFETY.md`、`docs/FEATURES.md`、
  `docs/PAID_FEATURES.md`、`docs/keyboard.md`、`docs/apple.md`、
  `docs/BACKLOG.md`、この項 ── **全部直しました**（`docs/reports/docs-2026-09-01.md`）。
  **`docs/CHANGELOG.md` は書き換えていません。**
- Implementation status: **記載は直した。**

#### 「音声とかの重いの」がどれを指すのかは、まだ分かっていません

**声も下書きも、コードの上ではもう移っています。**数えました:

```
www/net.js:1474  netPush() → :1503 netUpVoice() → post-media、道は body.vu
www/post.js:862  netPush() ── postCatchUp() から。sid の無い過去の投稿も上げる
www/post.js:1290 netPush() ── 投稿した瞬間
www/net.js:1544  netDraftUp() ── www/post.js:380 と :463 から
```

`docs/BACKLOG.md:2331`（下書きは済、録音は元から在った）、
`docs/FEATURES.md:258`（Already online に写真と声）、`www/net.js:1527`
（下書きの写しは住む場所ではない）も同じことを言っています。

**だから「いまはまだ端末にある」とは書いていません。**それを書くと、
この項の Reason に書いた失敗を一つ増やすことになります。
いま端末に残っている重いものは、上げたあとの `Documents/Voices/*.m4a`、
`lingua.posts` の写真の data URL、下書きの `body` の base64
（**これは後回しではなく設計です** ── `post-media` は公開バケットなので、
公開していない下書きの写真をそこに置けない。`www/net.js:1529`）。
**このどれのことか、訊いています。**

### 6. プロフィール画像の削除は入れる ── 同じ日に二度動いた
- Date: 2026-09-01
- Area: プロフィール画像を触ったときに出るもの
- Decision: **同じ日に二度動いています。新しいほうが生きています。**

  はじめ:

  ```
  削除はいいって一旦
  ```

  そのあと:

  ```
  別に急いでないからしっかり作って全部入れてからビルドして。
  ```

  **後のほうが生きています** ── 削除は入れる。「一旦いい」は、急ぐなら
  外してもいい、という話でした。急がないと言われた以上、外す理由は残りません。
- Reason: 原文の二行目。**急ぎがこれを外す唯一の理由だった**ので、
  急がないなら入れる、が同じ一行から出ます。
- Affected features: `openMePic`（`www/me.js:787`）── 変える／外すの二つが
  既に在ります。**形は基準2の「アイコン→タップ→アクションシート」で、
  いまは画面（`openForm`）です**（項目2）。
- Affected data: 無し。`ME.pic` を空にするだけです。
- Affected docs: この項。
- Implementation status: **中身は在る。形が基準どおりでない。**
  `www/` も `ios/` もこの枝の持ち物ではないので、触っていません。

### 7. 自己紹介は出す。言語の詳細も
- Date: 2026-09-01
- Area: プロフィールに何を出すか
- Decision:

  ```
  自己紹介を見せないって選択肢を俺はいつ与えた？
  言語の詳細は？
  ```

  **出す。**隠す選択肢は与えられていません。
- Reason: 原文がそのまま理由です。**誰も決めていないものを、隠す側に倒して
  はいけません** ── `CLAUDE.md`「Deciding」の、何が誰のものかという話です。
- Affected features: プロフィール（`www/me.js`）。
- Affected data: 無し。
- Affected docs: この項。
- Implementation status: **既にそうなっています。**自己紹介は自分の
  プロフィール（`www/me.js:360`）にも他人のプロフィール（`:623`）にも
  出ています。**この項は「消すな」という決定として効きます。**

### 全部の升、触ったら選択。キーを入れるのは帯のボタン
- Date: 2026-08-28
- Area: キーボードの編集画面のシート
- Decision:

  ```
  全部のます触ったら選択で
  ```

  リーダーが上げた問いへの答え ── 点線の升に二種類あって、**見た目が同じなのに
  挙動が違った**。本当の空き升は「押すと追加」、寄せで出来た隙間（gap キー）は
  「押すと選択」。

  **答え: 全部の升、触ったら選択。**キーを入れるのはシートの上の帯のボタン。
  入るのは**その升の幅**（半分の升なら半キー）。
- Reason: シートは端から作業する。行の番号で行を、列の文字で列を、キーを押して
  キーを選び、**上の帯のボタンが選ばれたものに働く。**升だけ例外にすると、
  同じ見た目のものが二つの答えを持つ。
- Affected features: キーボードの編集画面
- Affected data: 無し（描き方と、押したときに何が起きるか）
- Affected docs: この項、`CLAUDE.md` § 19
- Implementation status: 実装中（`claude/cell2`）

#### これが置き換えたもの

**「タップが追加ボタン」は無い。**同じ日の「点線キーが入ってんの。追加するなら
タップまで追加ボタン」をリーダーが「押したら入る」と読み、そう実装させた。
**同じ日に置き換えられた。**押したら選ばれる。

### シートは升。空いた升は点線のキーで、押せる。中央寄せは両端に半分ずつ
- Date: 2026-08-28
- Area: キーボードの編集画面のシート
- Decision:

  ```
  エクセルと同じだって。

  点線キーが入ってんの。追加するならタップまで追加ボタン。

  キーガーないところがあるのがおかしい。左寄せにしたら全部寄せるし空白が出るのがおかしい
  ```
  ```
  半キーも左に寄せたら右に1枠開くでしょ？そういう話
  ```
  ```
  中心に寄せたら半キーが二つできるけど寄せたら1つになるの
  ```

  **シートは升の並びで、升は全部が升です。**

  1. **キーの入っていない升は点線のキーとして描く。**「空白」という状態は無い
  2. **タップが追加ボタン。**押すと**その升の幅のキー**が入る（半分の升なら半キー）
  3. **左・右に寄せる** → 余りは片端に一かたまり
  4. **中央に寄せる** → 余りは**両端に割れる**。奇数コマ余れば**半分の升が両端に一つずつ、計二つ**
- Reason: 升に何も無い場所があると、そこが何なのか画面から分からない。
  エクセルの升と同じで、空いていることと存在しないことは違う。
- Affected features: キーボードの編集画面
- Affected data: 無し（描き方と、押したときに入るキーの幅）
- Affected docs: この項、`CLAUDE.md` § 19
- Implementation status: 未着手

#### これが置き換えたもの

**「中央寄せは余りの半端を丸めて片端に寄せる」は無い。**両端に半分ずつ。
`CLAUDE.md` § 19 のその段は同じコミットで書き直した。

丸めがあった理由は「半キーずれた行はどの列にも乗らず、列を選んでも光らない」
だった。**それは今そのまま起きてよい** ── 同じ § 19 が「帯だけ出て一つも光らない
行は、その行が列と揃っていないと言っている正しい答え」と既に書いていて、
無料の QWERTY の三段目がまさにそれ。

**「余りが一列のときは押せない空白にする」も無い。**それはリーダーが
2026-08-28 に入れたもので、同じ日にオーナーに否定された。

### 上がっていない言語を守る条件は入れない。字義どおり全部消える
- Date: 2026-08-28
- Area: 設定 →「端末のデータを消す」
- Decision:

  ```
  4です。
  最初からずっと言ってるけど
  ```

  リーダーが四つ並べて訊いた答え。**4 は「字義どおり、何もしない」。**

  `sid` の無い言語（一度もサーバーに上がっていない言語）があっても、
  **名指して訊かない・先に同期を回さない・バックアップを残さない。**
  押した人が消したものは消えます。戻せない人が出ます。
- Reason:

  ```
  最初からずっと言ってるけど
  ```

  オーナーは同じ日に「全部」を三度言っている ──「アカウント削除はもう全部
  消えるの。全部。」「言語データが全部消える」「全部消えるって」。
  **リーダーが三度訊き直した。**決定は最初から動いていない。
- Affected features: 設定 →「端末のデータを消す」
- Affected data: 変更なし（実装は最初から条件無しで入っている）
- Affected docs: この項、`docs/BACKLOG.md`、`docs/DATA_SAFETY.md`
- Implementation status: 実装済み（`claude/acct2` → master `2e13788`）

#### 規則との関係 ── ぶつかっていなかった

リーダーは `docs/DATA_SAFETY.md` の「データ消えるのだけはありえない」と
この決定がぶつかると読んで、`CLAUDE.md` の「決定と規則がぶつかったら止めて
報告する」に従って止めた。**読み違いだった。**

あの一文は**アプリが勝手に失う**ことについてのもので、`docs/DATA_SAFETY.md`
自身が「Automatic deletion, pruning and cleanup are forbidden unless a written
spec asks for them」と書いている ── **人が押した削除は automatic ではない。**
何が消えるかを言う確認があり、人がそれを読んで押す。ぶつかる余地は無かった。

**止めるのは、二つの書かれた決定が食い違っていて、どちらもオーナーが言い直して
いないときだけ。**今回はオーナーが言い直していた。

### 端末のデータを消すと、Documents のバックアップも消える
- Date: 2026-08-28
- Area: 設定 → アカウント →「端末のデータを消す」
- Decision:

  ```
  全部消えるって
  ```

  リーダーが「Documents のバックアップファイルは消していません」と報告したのに
  対して、同じ日の

  ```
  古い情報残すな。端末のデータはSNSは消えないで言語データが全部消えるの
  ```

  を言い直したもの。**Documents のバックアップファイルは「端末の言語データ」に
  入る。**残すと「言語データが全部消える」が嘘になり、次の起動で書き戻って、
  ボタンが何もしなかったことになる。
- Reason: 消える範囲を人が読めるようにするため。アカウントは消えないので、
  **サーバーには全部残っていて戻せる。**
- Affected features: 設定 → アカウント →「端末のデータを消す」
- Affected data: `lingua.<id>.*`（`SLICES` 全部・全言語）、`lingua.langs`、
  **Documents の言語のバックアップファイル**。`lingua.set` は消さない。
  サーバーには触らない
- Affected docs: この項、`docs/DATA_SAFETY.md` の DELETE REVIEW、
  `docs/CHANGELOG.md`
- Implementation status: 実装中（`claude/acct2`）

#### これが置き換えたもの

**「バックアップは残す」は無い。**リーダーが 2026-08-28 に「含めない方が安全だと
思う」と書いて、その場でオーナーに否定された。

#### 一度もサーバーに上がっていない言語は、戻せない

起きます。二通りで ── 圏外だけで使った場合と、**二つ目以降の言語**（電波と
無関係。`netLangSync()` を呼ぶ場所はアプリに二つしかなく、どちらも開いている
言語しか見ない）。**守る条件は入れません。**同じ日の「4です。最初からずっと
言ってるけど」で決まっています。

### サブリーダーが居ないときは、リーダーが取り込む
- Date: 2026-08-28
- Area: 誰が取り込むか
- Decision:

  ```
  じゃあ君が取り込んで
  ```

  同じ日の「取り込むのはサブリね？」の**あと**に、**サブリーダーのセッションに
  連絡が届かないと報告したうえで**言われたもの。だから二つは矛盾ではなく、
  順番です:

  **サブリーダーが居るならサブリーダーが取り込む。居ないならリーダーが取り込む。**
  取り込んだ人がそのままゲート28本を回します ── 取り込んだ形でしか全部は
  緑にならないので、取り込む人と回す人は同じです。

  **リーダーがコードを書かないことは変わりません**（同じ日の「君が作業するん
  じゃなよね？」）。取り込みは書くことではない。
- Reason: 取り込む人が居ないと master が動かず、ビルドに何も乗らない。
- Affected features: 無し
- Affected data: 無し
- Affected docs: この項、`CLAUDE.md`、`docs/SESSIONS.md`、
  `docs/HANDOVER-2026-08-28.md`、`.claude/hooks/session-start.sh`
- Implementation status: 実施中

#### これが置き換えたもの

**「取り込むのはサブリーダーだけ」は無い。**居ないときはリーダーがやる。
同じ日の数時間前の項をこれで狭めた。

### 取り込むのはサブリーダー。リーダーは配ってビルドを引くだけ
- Date: 2026-08-28
- Area: 誰が何をするか
- Decision:

  ```
  取り込むのはサブリね？
  ```
  ```
  君が作業するんじゃなよね？
  ```

  **枝を master に取り込むのはサブリーダー①。**そのままゲート28本もそこで回す
  ── 取り込んだ形でしか全部は緑にならないので、取り込む人と回す人は同じです。

  **リーダーは配ってビルドを引くだけ。**取り込まない、ゲートを回さない、
  **コードを書かない。**
- Reason: 二つ目の原文は、リーダーが自分でコードを書き始めたことについて。
  セッションへの連絡手段が落ちたときに、報告して指示を仰がずに自分で書いた。
- Affected features: 無し
- Affected data: 無し
- Affected docs: この項、`CLAUDE.md` 四箇所、`docs/SESSIONS.md`、
  `docs/HANDOVER-2026-08-28.md` § 7
- Implementation status: 実施中

#### これが置き換えたもの

**「取り込むのはリーダー」は無い。**`docs/SESSIONS.md` の「他の枝を取り込む
禁止。リーダーの仕事」、`CLAUDE.md` の "the leader integrates" 二箇所、
"the LEADER's run" ── 全部このコミットで直した。

**「リーダーがコードを書く」は無い。**連絡手段が落ちていても書かない。
止めて報告する。

### アカウント削除は全部。端末のデータは言語だけ消えて SNS は消えない
- Date: 2026-08-28
- Area: 設定 → アカウントの部屋の、消す行
- Decision:

  ```
  アカウント削除は全部だって言ってんだろ、古い情報残しすぎだろイライラすんな
  なんで？バカなの？アカウント削除はもう全部消えるの。全部。

  古い情報残すな。端末のデータはSNSは消えないで言語データが全部消えるの。
  ```

  **三本ある。**

  1. **ログアウト** ── 何も消えない。
  2. **端末のデータを消す** ── **この端末の言語データが全部消える。SNS は消えない。**
     サーバーのアカウント・投稿・写真・録音・プロフィールはそのまま。
     戻す一本で、今のアプリには無い。
  3. **アカウント削除** ── **全部消える。全部。** サーバーも端末もバックアップも。
     今の `wipeAll()` がこれで、変える所は無い。
- Reason: 2 と 3 は消える範囲が違う。片方しか無いと、言語を作り直したいだけの
  人がアカウントごと消すしかない。
- Affected features: 設定 → アカウント
- Affected data: 2 が消すのは `lingua.<id>.*`（`SLICES` 全部）と `lingua.langs`。
  **`lingua.set` は人の設定なので消さない。**サーバーには一切触らない。
- Affected docs: この項、`docs/DATA_SAFETY.md`（DELETE REVIEW）、`docs/CHANGELOG.md`
- Implementation status: 未着手（2 を戻す。3 はそのまま）

#### これが置き換えたもの

**「消す行は二本」は無い。**三本。2026-08-22 に二本へまとめたのは、**まとめ方が
間違っていた** ── 消える範囲の違う二つを一つにしていた。

**「アカウント削除はサーバーだけで、端末の言語は残る」は無い。**それは
2026-08-22 より前の `set.drop` の振る舞いで、**もう存在しない。**
アカウント削除は全部消える。

### 規約ページの三つ ── 準拠法はそのまま、通報は24時間、13歳以上
- Date: 2026-08-28
- Area: `tokinets.com/lingua/terms.html` と `/privacy.html`
- Decision:

  ```
  それでいいよ。
  24時間でいいよ。
  13さん以上だね。snsって基本そうやん
  ```

  三行はリーダーが並べた三つに、上から順に答えたもの。

  1. **準拠法・裁判管轄はいまの文のまま。**「日本法・東京地裁を第一審の専属的
     合意管轄、ただし居住国の消費者保護法が与える権利は奪わない」。
  2. **通報への対応は24時間。**
  3. **13歳以上のみ。**（原文の「13さん」は打ち間違いで、13歳。）
- Reason:

  ```
  snsって基本そうやん
  ```

  3 について。1 と 2 に理由は付いていない。
- Affected features: 利用規約とプライバシーポリシー（`natsuaya82-crypto/tokine2`
  の `lingua/`）
- Affected data: 無し
- Affected docs: この項、`docs/BACKLOG.md`
- Implementation status: 実装中（`claude/legal`。1 は既に入っている、2 と 3 を入れる）

#### これが置き換えたもの

**「準拠法と裁判管轄はまだ決まっていない」は無い。**`docs/BACKLOG.md` に
「これは私が置いた既定値で、オーナーが確かめる所です」と書いてあったのは、
2026-08-28 のこの決定で確かめられた。その文は同じコミットで消した。

### ゲートは、全部プッシュしてからサブリーダーが回す。個人は回さない
- Date: 2026-08-28
- Area: 検査の回し方
- Decision:

  ```
  だからゲートは全部プッシュしてサブリが確認するんでしょ？個人ではやらない
  ```

  セッションは**何も回さない。**押すだけ。押されたものを、サブリーダーが回す。
  **リーダーはセッションに「この検査だけ回せ」と言ってはいけない** ── 全部でも、
  名指しの一本でも。
- Reason: 同じ緑を何度も証明しない。赤を見るのは作業、緑を見るのは検証。
- Affected features: 無し
- Affected data: 無し
- Affected docs: `CLAUDE.md` § The gate、`docs/SESSIONS.md` § Scope
- Implementation status: 実施中

#### これが置き換えたもの

**「セッションは、自分が変えたものを持っている検査を名指しで一本だけ回す」は無い。**
2026-08-28 にリーダーが四つのセッション全部にそう書いて渡し、その場で取り消した。

### 語釈は二段。赤い字は無い。お題のページと同じ形
- Date: 2026-08-28
- Area: 作文画面とタイムラインの、語ごとの行
- Decision:

  ```
  やっぱり、タイムラインも投稿も2段で。赤文字消して。
  ```
  ```
  これもお題のページと合わせるんだけど
  ```

  どの二段かを二択で訊いた答えは **A**:

  ```
  A: 打った行（自作文字）＋ 翻訳した形。アルファベット表記の行は無し
  B: 打った行 ＋ アルファベット表記。翻訳は無し
  ```
  ```
  a
  ```

  ```
    1段目   打った行（自作文字。アルファベットで打っていればアルファベット）
    2段目   翻訳した形
  ```

  お題のページと同じ形 ── `daySay()` が読める言葉の一行と英語の一行を出している、
  あの二段と揃える。
- Reason:

  ```
  アルファベットで打ってるのに同じ綴が並ぶと意味わからんやろ
  ```

  同じ綴りが二度並ぶ段には意味が無い。
- Affected features: 作文画面の語釈、タイムラインの投稿
- Affected data: 無し（描き方だけ）
- Affected docs: この項
- Implementation status: 実装中（`claude/wrap`）

#### これが置き換えたもの

**「三段にする」は無い。**アルファベット表記の段は作られない。リーダーが
2026-08-28 に一度そう配ったが、同じ日に取り消された。

**辞書に意味の無い語を赤で出すのは無い。**「自分の文字で打った語だけ赤」に
絞る形も無い ── 赤そのものが消える。

### 残り字数は、打つほど減っていく輪
- Date: 2026-08-28
- Area: 作文画面の帯
- Decision:

  ```
  カウントは打つほど減っていく輪、帯の中、常に出す
  ```
- Reason: 数字が残り40字を切るまで出ないのは、出ていないのと同じ。
- Affected features: 作文画面
- Affected data: 無し
- Affected docs: この項
- Implementation status: 実装中（`claude/wrap`、`51ff071`）

#### これが置き換えたもの

**「残り40字を切ってから数字を出す」は無い。**門は無く、輪は常に出ている。

### おすすめと検索の「話題」は X と同じ。青パッチが上に上がりやすい
- Date: 2026-08-28
- Area: おすすめの並び、検索の並べ替え
- Decision:

  ```
  検索の話題はTwitterと同じアルゴリズムで。パッチ付きの方が上に上がりやすい
  ```
  ```
  Twitterと同じだから青パッチ。上に上がりやすい。
  ```
  ```
  Xと同じアルゴリズムって言ってるよね？
  ```

  重みは **いいね1・リポスト3・返信5**、**同じ数なら新しい方が上**、直近48時間。
  **青パッチ＝課金した人の印**で、金の印（エンタープライズ）とは別物。

  **倍率をオーナーに訊かない。**X が公開しているものを使う。
- Reason: 話題＝おすすめと同じもの。X と同じ。
- Affected features: おすすめのタイムライン、検索の並べ替え
- Affected data: `profile` に契約の列が要る（今は無い）
- Affected docs: この項、`docs/FEATURES.md`
- Implementation status: **入っている。**`feed_hot()`（`supabase/schema.sql`）が
  おすすめと検索の「話題」の両方を答える ── オーナーが同じものだと言ったので、
  関数は一つで二つではない。重みはいいね 1・リポスト 3・返信 5、窓は 48 時間、
  同じ点なら新しい方が上。青パッチの倍率は **4** で、`feed_paid_weight()` が
  一行で持つ ── X が 2023 年に公開した、フォローしていない人に見せるときの数。
  「倍率をオーナーに訊かない」はそのとおりにした。

  **掛ける先はまだ無い。**`profile` に契約の列が無く、`feed_weight()` は
  `to_jsonb(p) ->> 'paid'` で訊いている ── 列が無ければ NULL、できた日から
  黙って効き始める。その列は Apple の署名付き通知をサーバーで受けて立てるもので、
  端末からは書けないよう塞ぐ（`staff` と同じ形）。**それが唯一の残り。**

#### 今できないところ

**サーバーは誰が課金しているか知らない。**`profile` に契約の列が無く、
`postBadge()` は自分の投稿にしか印を出していない。**列ができるまで青パッチの
倍率は掛ける先が無い。**Apple の署名付き通知をサーバーで受けて立てる列で、
本人にも書けないよう塞ぐ（`staff`/`admin` と同じ形）。端末が自分で書く形は
誰でも自分に印をつけられるので、やってはいけない。

**リーダーが提案しただけでオーナーが答えていないもの**（入れない）:
一人一件まで／押した人の頭数で数える／自分の反応は数えない。

### 入れ替えは4時間ごと。時間はお題のページに合わせる
- Date: 2026-08-28
- Area: おすすめの並びの入れ替え
- Decision:

  ```
  3はアメリカ時間ね。4時間ごと。0 4 8 12 16 20 24 これは入れ替わらない。
  ```
  ```
  時間もお題のページに合わせるってこと
  ```

  アメリカ時間の 0 4 8 12 16 20。この刻みは動かない。
  **どの時間帯かは、お題のページ（`netDay()` / `dayPull()`）と同じにする。**
- Reason: お題と同じ日付の決まりで動く。時間の決まりの二つ目の写しを作らない。
- Affected features: おすすめのタイムライン、検索の「話題」
- Affected data: 無し
- Affected docs: この項
- Implementation status: **入りました（2026-09-03）。**`feed_slot()`
  (`supabase/schema.sql`) が `America/Los_Angeles` で刻みます ── お題の
  `on_day` を決めている `supabase/functions/daily-prompt/index.ts` と同じ
  時間帯です。`rls-check` の三本が持ちます（刻みが四時間、その時間帯である
  こと、ほかの時間帯を名乗らないこと）。

  **2026-08-28 から 2026-09-03 まで UTC でした。**「zone を名乗らないのが
  お題のページの答え」という読みで書かれていて、それは端末が計算しないと
  いう話で、境目がどこで決まるかとは別の話でした。0 4 8 12 16 20 が
  アメリカ時間になるのは、時差がちょうど四の倍数のときだけです。

#### これが置き換えたもの

**「12時間ごと、0:00 と 12:00」は無い。**4時間ごと。

### フォローの通知も、いいねと同じくまとめる
- Date: 2026-08-28
- Area: 通知
- Decision:

  ```
  同じでいい
  ```

  「同じ投稿のいいねはXみたいにまとめる」のと同じく、フォローもまとめる
  （〇〇さん他3人にフォローされました）。**サーバー側の `notices()` でまとめる。**
- Reason: 端末で畳むと50件が20行に減って、見える範囲が狭くなる。
- Affected features: 通知
- Affected data: `notices()` の返す形
- Affected docs: この項
- Implementation status: **入っている。**`notices()`（`supabase/schema.sql`）の
  `ev` にフォローが `post` を持たない行として入り、`(kind, post)` でまとめる
  `g` がそれを一行にする ── いいねと同じ仕組みで、二つ目の仕組みは作っていない。

### ビルドはオーナーが言うまで押さない。ゲートは実機確認の最中に
- Date: 2026-08-28
- Area: 出し方
- Decision:

  ```
  ビルドは全部終わってからって言ってんだろ俺がいつ許可したの
  ```
  ```
  全部終わったらビルド
  ゲートは俺が実機確認してるときにやってほしい
  だから先にビルド
  ```

  **「全部終わったら」は、オーナーが「全部終わった」と言うまで満たされない。**
  リーダーがそれを「取り込みが終わったら」と読み替えて #99 を無断で出した。
  **前にもらった許可を次の回に使い回さない。毎回その場で取る。**
- Reason: 出たものは消せない。
- Affected features: 無し（出し方）
- Affected data: 無し
- Affected docs: この項、`docs/HANDOVER-2026-08-28.md`
- Implementation status: 実施中

### 確認してから訊く
- Date: 2026-08-28
- Area: リーダーの動き方
- Decision:

  ```
  まずは確認しろよ。
  その後にこの理解であってるかを聞け

  毎回そうしろ
  ```
  ```
  確認してることが全部間違ってるんだから俺の言ったやつが正しいんだよ
  ```
  ```
  読むのは現状の把握。
  ```

  **コードを読むのは今どうなっているかを掴むためで、仕様ではない。**
  仕様はオーナーの言葉。読んだ結果とオーナーの言葉が食い違ったら、
  **オーナーの言葉が正しい。**

  訊くのは、オーナーの言葉に入っていないことだけ。訊く前に必ず見る。
  **オーナーの言葉を言い換えて配らない。原文で配る。**
- Reason:

  ```
  お前みたいなカスが直して古いの消さないし、mdにも記載しないせいだろ
  そういう中途半端なことすんなよ責任持てや
  ```

  コードが当てにならないのは、直した人が古いものを消さず、md にも書かなかったから。
- Affected features: 無し
- Affected data: 無し
- Affected docs: この項
- Implementation status: 実施中

### オンボーディングは描くところから始まり、サインインで終わる
- Date: 2026-08-27 / 2026-08-28
- Area: オンボーディングの段の順番
- Decision:

  ```
  オンボーディング→最後にログイン
  ```
  ```
  そんなの俺頼んでねえぞ
  ```

  一つ目は 2026-08-27。二つ目は 2026-08-28、**扉が一歩目になっていたことに
  ついて**。

  1. **順番は 描く → アプリの中を歩く → 名前 → 扉。** サインインは最後の段。
  2. **扉に逃げ道は無い。** 2026-08-26 の「あとで」削除はそのまま生きている。
     この決定はそれを戻すものではない。

- Reason: 2026-08-26 に扉が一歩目へ動かされた（`b64c491`）。その根拠として
  書かれていたのはオーナーの 2026-08-26「言語はアカウントないと作れないです」
  だが、**それを「だから画面の一枚目が扉」と読み替えたのはそのセッションで
  あって、オーナーの言葉ではない。** オーナーが言ったのは言語が何を必要と
  するかであり、画面の順番ではない。上の 2026-08-28 がそれを名指しで否定して
  いる。**「言語はアカウントないと作れない」は取り消されていない** ── 歩き
  終わりの扉がその言語のアカウントになる、という形で両立する。
- Affected features: `www/onboard.js`（`OB_DRAW=0, OB_NAME=1, OB_IN=2,
  OB_TOUR=3`、`obName`/`obNameLater`/`obWhoGo`/`obFinish`）。`appIs()`
  （`www/shell.js`）に一行 ── **歩き回りの間は 'app'**。2026-08-27 が決めた
  三つの答えは一つも変えていない。扉が一歩目だった間、歩き回りは必ず
  サインイン済みで走っていたので `appIs()` は偶然正しかった。扉を最後に
  戻すと歩き回りはアカウントより先に走るので、この行が無いと**文字を描いた
  直後に扉が出る** ── オーナーが報告した画面が一歩あとに出ていた。
- Affected data: **何も消えず、新しく保存されるものも無い。** ただし
  **扉が最後になったことで、アカウントより先に文字と言語ができる** ──
  `obFinish()` が `netLangSync()` を呼ぶ。これが無いと、その人が描いたものは
  次の起動まで端末にしかない。
- Affected docs: `CLAUDE.md`（§Online）、`docs/STATE.md`、`docs/CHANGELOG.md`。
- Implementation status: **implemented。** `tools/open-check.mjs` が保持する ──
  空の `localStorage` から起動して画面を読む。`appIs()` は今回ずっと正しく
  `'ob'` を返していたので、`appIs()` を訊く検査では捕まらなかった。
  **ゲートには未接続**（`package.json` / `tools/gate.mjs` はリーダーのもの）。

### 特定商取引法の表記は出さない ── 場所の半分は **superseded 2026-09-01 / 09-02**
- Date: 2026-08-26
- Area: 規約・プライバシーポリシー・特定商取引法に基づく表記
- Decision: **特商法の表記は出さない**（「出さない。」）。これは今も効いている。

  **場所についての半分は置き換えられた。**この日オーナーが言ったのは
  「ログアウト中は見れなくていいでしょ？ログインしたら設定から見れるし」で、
  その言葉は記録として残す。そこから書かれた規則 ──〈読める道は設定 →
  アカウントの一番下、一箇所だけ〉── は、二つの決定が置き換えた:

  - 「設定のアカウントの利用規約とプライバシーポリシー消しといて。課金の方に
    あるからいらん」**OWNER 2026-09-01** ── アカウント室から消え、プラン画面へ
  - 「続けるとの説明は ok」**OWNER 2026-09-02** ── 登録画面の面にも出す。
    つまり**サインアウト中でも読める**

  **今そうであること:** 読める道は**プラン画面**（`planTerms()`）と
  **登録画面の面**（`www/onboard.js`）の二つ。**アカウント室には無い。**
  三本目の文書は無い。
- Reason: オーナーの言葉のまま上に。仕組みの側で分かっていること ── App Store
  の課金は販売者が Apple（日本では iTunes K.K.）で、購入契約の相手も返金の窓口も
  Apple なので、App Store Connect は特商法のページを訊いてこない。必須で訊くのは
  プライバシーポリシー URL だけ。
- Affected features: `docRows()`（www/settings.js）。**二本のままで、三本目は
  作らない** ── これは変わっていない。呼ぶ場所が二度動いただけで、文書は二つの
  ままである。`planTerms()`（www/settings.js）と www/onboard.js の登録の面が
  呼ぶ。`docRows()` 自体は一つで、URL も `DOC_TERMS` / `DOC_PRIVACY` の一組。
- Affected data: **無し。** 保存するものは増えも減りもしない。
- Affected docs: docs/BACKLOG.md（§3 と §4 をこの決定に合わせる）、docs/apple.md
- Implementation status: **特商法の半分は入っている**（三本目の文書はどこにも
  無い）。**場所の半分は上のとおり置き換えられ、コードは新しい方に従っている。**
  この項が〈一箇所だけ〉と言い続けていたのを 2026-09-03 の監査が見つけた ──
  コードは正しく、古かったのはこの文だった。

  残っているのは repo の外で、**そちらは 2026-08-26 以降たしかめていない** ──
  `natsuaya82-crypto/tokine2`
  （Vercel で tokinets.com）を読んだ結果:
  **`lingua/` の中は `index.html` 一つだけで、`terms.html` も `privacy.html` も
  無い。** アプリの二本のリンクは 2026-08-26 の時点で 404。直下には二本あるが
  **どちらも別アプリのもの**（`terms.html` は「利用規約 | JPEL Manager」、
  `privacy.html` は
  「本アプリには『JPEL Manager』が含まれます」と書き、メールを求めない・端末内
  にのみ保存・AdMob 広告あり、と Lingua と真逆を宣言している）。**流用は不可** ──
  審査に落ちるより先に、事実と違う申告になる。
  **要るのは Lingua 用に書き下ろした二本。** App Store Connect のプライバシー
  ポリシー URL は必須なので、これができるまで審査に出せない。サイトの仕事。

### 運営ページのパスワードは、Apple/Google サインインでは出ない。そのままにする
- Date: 2026-09-02
- Area: `www/mod.js` `adminLocked()`
- Decision: **そのままにする。塞がない。**「どうせ俺しか使わんからいいよこのまま
  で」 OWNER 2026-09-02。
- What it is: `adminLocked()` は `netHow()==='email'` のときだけ true。つまり
  メールでサインインした人にはパスワードの画面が出るが、Apple / Google では
  出ず、7 回タップでそのまま開く。照合するパスワードが存在しないため。
  そのパスワード自体もアカウントのパスワードで、専用のものではない
  （`adminGo()` が `netSignIn(netMail(), …)` を投げ直しているだけ）。
- **穴ではない。**本当の壁は二つとも別にある ── @ が `lingua` でなければ
  7 回叩いても無反応（サーバーが答える。2026-09-03 まではこれが
  `profile.admin` という欄だった）、そして通報もスタッフ一覧も
  `is_staff()`/`is_admin()`（`supabase/schema.sql`）を通る。端末が嘘を
  ついても何も渡されない。このパスワードは「サインイン済みの端末を人に渡した
  ときの画面ロック程度」のもので、コードのコメントにもそう書いてある。
- Affected data: なし。Affected code: なし（変更しない、という決定）。
- **後から読んだ人へ:** これは見落としではありません。報告して、そのままにすると
  決まりました。生体認証などで塞ぐ話をするなら、まずオーナーに訊いてください。

### 売上とアナリティクスは RevenueCat で見る
- Date: 2026-09-02
- Area: 数字を見る画面／App Store Connect の API／管理画面の売上の欄
- Decision: **売上とアナリティクスは RevenueCat で見る。アプリの中では見ない。**
  「revenue cut入れたから、App Storeコネクトキーいらんわ」「RevenueCatで見るって
  話してるんだけど」 OWNER 2026-09-02。
- **2026-08-26 の決定「売上とアナリティクスを、アプリの中で見る」を置き換える。**
  下のその項は superseded。オーナーの言葉は「アプリの中で見るなんて一言も
  言ってないけど」。つまり下の Reason 行にある 〈アプリの中で見たい〉 は、
  **オーナーが言っていないのに鍵括弧が付いていた**。CLAUDE.md の
  「オーナーが言っていないものを「」で囲まないこと」が破られていて、それを
  読んだ私が今日そのまま信じ、オーナーに二度言わせた。
- **数字は一つも残さない。**「lingua内ではみないって言ってるだろ」 OWNER
  2026-09-02。①契約者数と売上 ②ダウンロード数 ③解約と継続 だけでなく、
  ④登録ユーザー数も管理画面から消えた ── その一言は Lingua の中で見るかどうか
  であって、Apple から来た数字かどうかではない。
- Affected features: `docs/FEATURES.md` § 8。管理画面に残るのは**通報とスタッフ**
  だけ。それは分析ではなく、運営そのものの作業。
- Affected data: 減らない。Apple の数字を置く表は元々作られていない。
  `admin_counts()` はサーバーに残り、通報の件数だけが読まれる。
- **Implemented 2026-09-02.** 消したもの ── `www/mod.js` の五ページと六行
  （`adminOpen` `adminGotTop` `adminMonthTop` `adminPlanTop` `adminView`
  `adminGoTo` `adminAt` `adminAsc` `adminNow` `adminPurse` `adminPlans`
  `adminPct` `adminMD` `adminMon` `adminOne` `adminWhenRow` `adminDays`
  `adminMonths`、`ADMIN_ASC`）、`www/net.js` の `netStore()`、
  `supabase/functions/appstore/`、`act-map` の `adminGoTo`、十言語 × 11 の文言。
- Affected docs: `supabase/setup.md` § 10、`docs/FEATURES.md` § 8、
  `docs/BACKLOG.md`、`docs/apple.md`

### 売上とアナリティクスを、アプリの中で見る ── **superseded 2026-09-02**
- Date: 2026-08-26
- Area: 数字を見る画面（新しい章）／App Store Connect の API／Supabase
- Decision: **アプリの中に、staff だけ見える一枚を作る。** 出すのは四つ ──
  ①契約者数と売上 ②ダウンロード数 ③解約と継続率 ④アプリの中の数
  （アカウント数・投稿数・言語数）。**数字は画面を開いたときに毎回取る。**
- Reason:「売り上げもアナリティクスも見れるようにしたい」。
  **〈アプリの中で見たい〉〈画面を開いたときに毎回〉は鍵括弧を外した** ──
  オーナーは 2026-09-02 に「アプリの中で見るなんて一言も言ってないけど」と
  言っている。書いた者の地の文に括弧が付いていたもの。鍵の置き場所は
  Supabase の Secrets で、
  GitHub ではない ──「（GitHub ではない）」。理由はオーナーの言葉ではなく
  コードが言っている: アプリは Supabase と直接しゃべっていて間にうちのサーバーが
  無いので、**アプリが持つものは全部公開されている**（www/net.js の SB_KEY の
  コメント）。だから Apple の鍵は Edge Function の中にしか置けない。
- Affected features: 新しい章。前例は二つあり、どちらも動いている ──
  `mod`（staff だけ見える画面、schema.sql の is_staff() が守る）と
  `daily-prompt`（Edge Function ＋ Secrets ＋ cron）
- Affected data: **増える。** Apple から取った数字を置く表が要る（未設計）。
  ④ だけは表が要らない ── profile / post / language を数えるだけ
- Affected docs: supabase/setup.md（鍵の作り方と置き方）、docs/apple.md、
  docs/FEATURES.md、schema.sql と npm run rls
- Implementation status: **決定のみ。コードは一行も無い。**
  四つのうち **④ だけが今日作れる**（鍵も Edge Function も要らない）。
  ①②③ は App Store Connect の API キー待ち、かつ **「開くたび」がどこまで
  可能かは Apple の API の形しだい** ── 売上レポートと解析レポートは取り方が
  違い、後者は「頼んで作らせてから取りに行く」形のことがある。
  **確かめてから作る。推測で作らない。**

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
- Date: 2026-08-26 (同日、五つめ)
- Area: 匿名アカウントは無くなる。アカウントは一種類
- Decision:

  ```
  匿名アカウントはねえよ
  言語はアカウントないと作れないです
  ログインした人しか書けないけど
  二種類になる意味も分からないけど
  ```

  1. **匿名アカウントは無い。**「アカウント」はサインインした人のこと、一種類。
  2. **言語はアカウントが無いと作れない。**
  3. **書けるのはログインした人だけ。**
  4. **アカウントの種類を二つに分けない。**`has_account()`（アカウントがある）と
     `is_member()`（名前がある）の二本立ては**やめる。** 一本になる。

- Reason: 「二種類になる意味も分からないけど」。二本立ては匿名アカウントを
  置くために作られたもので、**匿名が無くなれば分ける先が無い。**
  区別が要るのは「まだ名前を決めていない人」を通すためであり、その人がもう
  居ない。
- Affected features: `www/onboard.js`（扉が唯一の終わり方 ── 済み）、
  `www/boot.js` の `netAnon()`、`www/net.js` の `netSignedIn()`/`netMember()`/
  `netAnonTok()`、`supabase/schema.sql` の `has_account()` と、それを使う
  `language` / `slice` の書き込みポリシー。
- Affected data: **無い。** 誰の作ったものも消えない。
- Affected docs: `CLAUDE.md`、`docs/FEATURES.md`、`docs/ARCHITECTURE.md`。
- Implementation status: **docs だけ。** コードは `claude/admin` が持つ。
  この枝で済んでいるのは、オンボーディングの「あとで」を消したことだけ
  （アカウント無しで歩きを終えられないようにした）。

#### これが置き換えたもの

2026-08-22「When somebody is asked who they are」── 匿名アカウントを起動時に
作り、身元を訊くのは投稿と課金の二箇所だけ、`is_member()` を二つに割る。
**下のその項目に superseded の行を付けた。言葉は消していない。**
消したのは、それを言っていた**規則**のほうである。

### Decision
- Date: 2026-08-26 (同日、四つめ)
- Area: 決定が規則を置き換えたら、**その規則を直す**。決定ログに足すだけでは足りない
- Decision:

  ```
  古い規則残りすぎ
  新しいのにしたらルーるも直せよ
  そのせいで毎回古いルールに引っ張られてんじゃん
  ```

  ```
  歴史とかいいから消せよ
  ```

  **決定が既存の規則を置き換えたなら、その規則を同じコミットで直す。**
  決定ログに一件足して終わりにしない。

  そして直し方は**消すこと**である。「これは歴史です」と前置きして残さない ──
  残っていれば読まれる。それが「毎回古いルールに引っ張られてる」の中身。

  `docs/CHANGELOG.md` は別。あれは「その日そうだった」の記録なので
  書き換えない。**直すのは、今を語っている文だけ。**

- Reason: オーナーの三行がそのまま理由である。**規則は読まれるから効く。**
  古い規則が残っていると、次の人はそれを読んで従い、決定ログのほうは
  見に行かない。決定が「通った」のは、それを言っている文が全部直った
  ときであって、ログに一行入ったときではない。
- Affected features: 無い。これは書き方の規則である。
- Affected data: 無い。
- Affected docs: `CLAUDE.md`（§ Recording の隣）、このファイル。
- Implementation status: **書いた。** 同じ日に六箇所掃除した ──
  ゲートの本数（TESTING.md、17→26）、`CAN` の一覧（無い能力 `tr` が載り
  `edit` `badge` が抜けていた）、Studio、`localStorage` が唯一の置き場、
  語順の `SET.order`、そして「アカウント無しでも言語は作れる」。

### Decision
- Date: 2026-08-26 (同日、三つめ)
- Area: 設定にある「消す」は三つ ── データを削除 / 言語を削除 / ログアウト
- Decision:

  ```
  データを削除
  言語を削除
  ログアウトでしょ？
  ```

  **設定で人が消せるものは三つ。それ以上でも以下でもない。**

  | | 何が消えるか | 今 |
  |---|---|---|
  | **データを削除** | 全部。アカウント、サーバーの投稿・写真・録音、この端末の言語と設定、Documents のバックアップ、トークン | **在る。`wipeAll()`（`www/settings.js`）。既に全部やっている** |
  | **言語を削除** | その言語ひとつ。ほかの言語も、アカウントも残る | **無い。一行も無い** |
  | **ログアウト** | 何も消えない。トークンだけ | **在る。`setSignOut()` → `netOut()`** |

  一つめは前日の「アカウント消したら全部消えるに決まってる」がそのまま入る所で、
  **それは既に実装されている**（下）。三つめは既に在る。
  **無いのは真ん中だけである。**

- Reason: 「ログアウトでしょ？」── 三つが別のことだ、と言っている。
  全部消すのと、一つ消すのと、何も消さないのは、押す人にとって別の判断である。
  今は真ん中が無いので、**言語一つを捨てたい人が押せるのは「全部消す」しかない。**
- Affected features: `www/settings.js`（`wipeAll` の隣）、`vLangs()`
  （`www/home.js` ── 言語の一覧は行ごとに一つの言語なので、消す道はそこにもある）、
  `LANGS` と `langKeyOf()`（`www/core.js`）、`netDropMe()` の言語版
  （`language` 行と `slice` 行、`www/net.js`）。
- Affected data: 言語ひとつぶんの十二スライスと、`LANGS` の項目と、
  サーバの `language` / `slice` の行。**本人が言った場合に限る**ので
  `docs/DATA_SAFETY.md` の禁止には当たらない。
- Affected docs: `docs/FEATURES.md`、`docs/DATA_MODEL.md`。
- Implementation status: **「言語を削除」だけ未実装。** ほかの二つは在る。

#### 「言語を削除」を作る人が先に答えること

**決めない。オーナーに訊くこと。** ここに並べるのは、訊かずに書き始めると
どれかを黙って決めてしまう、という一覧である。

1. **最後の一つを消せるか。** 消せるなら、そのあとは `langFirst()` が
   空の言語を作る（それが「言語ゼロ」という状態がこのアプリに無いということ）。
   消せないなら、一覧の最後の行だけ押せない。
2. **サーバの行も消すか。** 「基本は全部サーバー管理」なら消す。
   消さないと、次に `netLangSync()` が走った瞬間 **`syMerge` が両方足して
   帰ってくる** ── 消したはずの言語が戻る。**ここは間違えると
   「消えない削除」になる。**
3. **バックアップの file はどうするか。** `bkDropAll()` は全部消す道しか無い。
   一つだけ消す道は無い。
4. **DL した言語を消すのは同じボタンか。** 読み取り専用の言語も一覧に並ぶ
   （2026-08-25）。消せて当然に見えるが、あれは自分の作ったものではない。
5. **確認は一度。** `wipeAll()` が iOS のダイアログで一度訊いている。同じ形。

### Decision
- Date: 2026-08-26 (同日、あと。上の「サーバーの範囲」への三つの答え)
- Area: アカウント削除は全部消える / 同期は常に / 費用はエンタープライズ
- Decision:

  オーナーの言葉のまま。

  ```
  アカウント消したら全部消えるに決まってる
  常に同期
  supabaseのエンタープライズで対応する予定
  ```

  1. **アカウントを消したら全部消える。端末の中も含む。**
     前日の「アカウント消したら残るわけがないあほだろ」をサーバの話と読んだのは
     **狭すぎた。**「全部」である。
  2. **同期は常に。** 前の項目で「全部だって」の一語からは書き起こさない、と
     open にしていたものが、これで閉じた。**常に同期する。**

     **そして同じ日に中身が分かれた ──「タイムラインは開くたび / 言語は
     そういうわけじゃない」。** 「常に」は一つの時計ではなく二つである:

     ```
     タイムライン   開くたび          既にそう（vFeed → snsPull）
     言語           そういうわけじゃない  ＝ per-open ではない
     ```

     **言語の側は「〜ではない」しか言われていない。** 何であるかは
     言われていないので、ここには書かない。`docs/FEATURES.md` の行は
     **open** で持つ。書き起こすと、オーナーが否定しただけのものを
     肯定形にして決めてしまうことになる。
  3. **費用は Supabase のエンタープライズで対応する予定。**
     「人数に比例する」という問題は残るが、**それを飲む前提で範囲が決まっている。**
     費用を理由に範囲を狭める提案はもう要らない。

- Reason: 1 について ──「決まってる」。消したいと言った人に何かが残っているのは
  削除ではない、という一行がそのまま理由である。**これは `docs/DATA_SAFETY.md` の
  絶対規則と衝突しない**（下）。
- Affected features: `netDropMe()`（`www/net.js`）、`wipeAll()`（`www/settings.js`）、
  `netLangSync()` の撃ち方（`www/boot.js`）。
- Affected data: **人が作ったもの全部**。ただし本人が消せと言った場合に限る。
- Affected docs: `docs/FEATURES.md` § 8、`docs/DATA_MODEL.md`、
  `docs/PAID_FEATURES.md`、`docs/DATA_SAFETY.md`（私の持ち物ではない ── 報告に書いた）。
- Implementation status:
  **1 は入った。**`wipeAll()`（`www/settings.js`）が一つのボタンで全部やる ──
  一度だけ訊いて、`netDropMe()` でサーバー、続けて `wipeHere()` で `lingua.` の
  鍵ぜんぶ（`lsWipeNS()`、手の一覧は無い）とバックアップのファイル。
  **2 はタイムライン側だけ。**言語は起動時一回（`www/boot.js`）で、これは
  per-open ではないという決定と食い違わない。間隔を作るのは open。
  **3 はオーナーの側で、リポジトリには無い。**

#### `DATA_SAFETY.md` と衝突しないこと。ここが大事

`CLAUDE.md` の絶対規則は「Nothing a person made is removed because the current
shape does not need it, because it is an old format, to save space, or because
something was restructured」であり、**理由を四つ挙げて禁じている。**
「本人が消せと言った」はその四つのどれでもない。禁じられているのは
**アプリが勝手に決めること**であって、人が自分のものを捨てることではない。

**ただし、これは今まで別々だった二つのボタンが一つになるという意味である。**
端末の言語を消すのは別のボタンだ、という 2026-08-21 の決めは、今日の決定が
上書きした。**ボタンは一つで、自分が何を持っていくかを自分で言う** ──
「すべて消去します。アカウントと、サーバー上の投稿・写真・録音。この端末の
言語・文字・設定。バックアップファイルも。」`docs/FEATURES.md` § 8 も直した。

**そして順番が要る。** 消す順を間違えると「消えたと言われたのに残っている」か
「消したいと言っていないものまで消えた」のどちらかになる。順番を決めるのは
実装する人の仕事だが、**確認は一度だけにすること** ── 二度訊くのは、一度目に
何を訊いたのか分からなくなるという意味である。`wipeAll()` は既に iOS 自身の
ダイアログで一度訊いている。

### Decision
- Date: 2026-08-26
- Area: サーバーの範囲 ── 基本は全部サーバー。言語周りだけ file をバックアップに使う
- Decision:

  オーナーの言葉をそのまま置く。要約していない。

  ```
  サーバーの範囲決めようよそろそろ
  じゃないといつまでもこれになる

  基本は全部サーバー管理 言語周りだけバックアップにfile使う
  制作はオフラインでも可能次つながった時に更新される
  ```
  ```
  Xがローカル保存してんの？nolaとかの目もアプリもそういう話してんの
  ```
  ```
  言語はアカウントないと作れないです
  古い記載消してくれうざい
  SNS部分はオフラインでは動かないよそりゃそう
  アカウント消したら残るわけがないあほだろ
  ```

  同期の頻度とプランについては、オーナーの言葉として渡ってきたのは
  **「全部だって」の四文字だけ**である。「常に同期する／プランに関係なく全員
  サーバに載る」はそれをリーダーが開いたものであり、**オーナーの言葉ではない。**
  プラン無関係の方は 2026-08-22 の「クラウドは全員で」と同じことを言っているので
  独立に裏が取れているが、**「常に同期」は頻度＝しきい値の話であり、この一語から
  確定させていない。** `docs/FEATURES.md` の行は open として持つ。

  決まったこと:

  1. **基本は全部サーバー管理。** 「Xがローカル保存してんの？」── 普通の
     アプリはそうしていない、が理由である。
  2. **言語周りだけ、バックアップに file を使う。** `www/backup.js`（章24）の
     `Documents/Languages/<name>.json` が消えるのではなく、**サーバが本体で
     file がバックアップ**という並びになる。
  3. **制作はオフラインでも可能。次につながった時に更新される。**
     これは既にそう動いている ── `www/sync.js`（章26）が両側を足し、
     `netLangSync()` が起動時に撃つ。
  4. **SNS 部分はオフラインでは動かない。**「そりゃそう」。既にそう。
  5. **アカウントを消したら残らない。** サーバ側は既にそう ──
     `account_delete()` の cascade が profile・言語・投稿・follow・block を
     連れていく（`docs/FEATURES.md` § 8）。
  6. **言語はアカウントが無いと作れない。** これは**まだそうなっていない。**
     下の「コードと合っていない所」を見ること。
  7. **古い記載を消す。** 「アカウント無しでも言語は作れる」と書いてある所を
     消して、今そうであることを書く。

- Reason: 「Xがローカル保存してんの？nolaとかの目もアプリもそういう話してんの」
  ── **落とさないこと。** 次の人が「オフライン優先のほうが安全では」「ローカルを
  真にしたほうが速いのでは」と思いついたときに止まるのはこの一行である。
  普通のアプリはサーバを本体にしていて、この app だけ違う理由は無い、が理由。

  そして「じゃないといつまでもこれになる」── 範囲が決まっていないことそのものが
  費用だと言っている。決めない自由は無い。

- Affected features: `www/sync.js`、`www/net.js`（`netLangRow`/`netSlices`/
  `netSlicePut`/`netLangSync`）、`www/boot.js`、`www/backup.js`、
  オンボーディングの扉（`www/onboard.js`）、最初の言語が作られる所
  （`www/core.js` の最上位）。
- Affected data: 何も消えない。サーバに載る範囲が広がるだけであり、
  端末の写しはそのまま残る。**費用には効く** ── プランに関係なく全員のスライスが
  載るなら、ストレージと egress が人数に比例する（`docs/PAID_FEATURES.md`）。
- Affected docs: `CLAUDE.md`、`docs/FEATURES.md`、`docs/ARCHITECTURE.md`、
  `docs/DATA_MODEL.md`、`docs/PAID_FEATURES.md`、`docs/STATE.md`、
  `docs/CHANGELOG.md`（あれは足すだけ。書き換えない）。
- Implementation status: **ほぼ implemented、ただし 6 は未実装。**
  1〜5 はコードに在る。**6「言語はアカウントないと作れない」だけが無い。**

#### コードと合っていない所。直していない ── 報告した

このファイルの「if existing code contradicts it, **report the contradiction** —
do not go and change unrelated code to match」に従う。今日は docs だけ触った。

**最初の言語は、アカウントを訊けない所で作られている。**
`www/core.js` の最上位に

```
try{ if(!langId || !LANGS[langId]){ if(!langMigrate()) langFirst(); } }catch(e){ langFirst(); }
```

があり、これは `www/index.html` の 2749 行目 ── `net.js`（2766）より前、
`boot.js`（2802）よりずっと前 ── で走る。その時点で `netSignedIn` はまだ
**定義されてすらいない。** つまり最初の言語は、アカウントの有無を訊く手段が
無い場所で、無条件に作られている。「アカウントないと作れない」を効かせるには
最初の言語を作る場所を動かす必要があり、それは core.js の一行では済まない。

**そして「アカウントの無い人はいない」も、厳密には今日まだ真ではない。**
`www/boot.js:96` の `netAnon(bootSession, function(){})` は失敗しうる。
失敗のコールバックは空で、その上のコメントが理由を書いている ──
「It means the phone is offline on its first launch, and the whole making side
works offline; the next launch asks again」。**初回起動＋圏外**は、
アカウントが無く、それでも制作ができる状態であり、コードはそれを意図して
支えている。この決定は、その状態をどうするかを決めていない。

だから今日消した文は「もう嘘だから」ではなく、**「もう規則ではないから」**
消した。事実としてはまだ半分残っており、上の一段落がその残りである。

### Decision
- Date: 2026-08-25
- Area: DL — 公式アセットの言語を取ってきて使う。取ってきたものは自分の言語には**入らない**
- Decision:

  オーナーの言葉をそのまま置く。要約していない — この四つが決定の本体であり、
  下の見出しはそれを拾い直しただけのものである。

  ```
  DLはplusからだけどplusは自分の言語+DL言語1個
  proは自分の言語3個+DL言語3個は？
  ホーム長押しで言語切り替えできる
  制作以外は変わらない感じは？
  shangoにしてるならそれ。変えたなら変えた。
  キーボードも言語変えたら変わる。でもアカウントは一つだからね？
  ```
  ```
  タイムラインは色んな言語を読める
  DLは例えばトキポナ使いたい人がすぐに使えるようにするための公式アセットを
  準備するってイメージだけど
  ```
  ```
  dlは公開非公開があるから、ホームの言語の概要ページに作った。
  そこでdlしてください。
  単語文字文法キーボードそれぞれ「解放できるかどうか選べる。
  それぞれdlしてください。
  もちろんダメです。トキポナに文字足したらトキポナじゃないです。
  だから公式で参加してくれってメール送ってんのよトキポナに。
  公式が提供してるアセットなんだからみんな使えるよ。でもlingua内ね？
  ぅ言うルール付なんだから。
  ```
  ```
  プロフィールのとこ長押しで言語切り替えだって
  ```

  拾い直すと、決まったのはこれだけである。

  1. **DL した言語は自分の言語に入らない。切り替える先である。**
     「自分の言語＋DL 言語」と二つに分けて数えているのがそのままの答えであり、
     「キーボードも言語変えたら変わる」も同じことを言っている — 入るのなら
     変わるものがない。
  2. **DL した言語は編集できない。**「もちろんダメです。トキポナに文字足したら
     トキポナじゃないです」。これは見た目の問題ではなく、**公式アセットが何であるか**
     の問題である。だから下の Reason を落とさないこと。
  3. **アカウントは一つ。**「でもアカウントは一つだからね？」
     言語を切り替えても人は切り替わらない。
  4. **単語・文字・文法・キーボードの四つは、それぞれ別に解放を選べ、
     それぞれ別に DL する。**一つのスイッチではない。
  5. **DL の場所はホームの言語の概要ページ。**「そこでdlしてください」。
     新しい画面を作る話ではない — 公開非公開が既にそこにあるからそこだ、と
     オーナーは理由を一緒に言っている。
  6. **切り替えはプロフィールのとこを長押し。**オーナーは一度「ホーム長押し」と
     言い、あとで「プロフィールのとこ長押し」と言い直している。**後の方である。**
  7. **公式アセットは誰でも使える。ただし lingua の中だけ。**
     「公式が提供してるアセットなんだからみんな使えるよ。でもlingua内ね？
      ぅ言うルール付なんだから。」
  8. **タイムラインは色んな言語を読める。** DL は読むためのものではない —
     読むのはもう無料でできる。DL は「使いたい人がすぐに使えるように」の方である。

  **決まっていないのはここである。数字を固めないこと。**
  「DLはplusから」は言い切りである。そのあとの数は
  「自分の言語3個+DL言語3個**は？**」と**問いで終わっている**。
  「制作以外は変わらない感じ**は？**」も同じである。
  問いを決定に書き換えない — このファイルの「決定をもっともらしい規則に
  読み直さない」はこの向きにも効く。`docs/FEATURES.md` の行は
  この二つを **open** として持つ。

- Reason: オーナーが理由を二つ言っている。どちらも落とさないこと —
  次の人が「もっと綺麗な形がある」と思いついたときに止めるのは理由の方である。

  **「トキポナに文字足したらトキポナじゃないです」** — だから読み取り専用なのであって、
  実装が楽だからではない。公式アセットは「その言語であること」が価値であり、
  編集できるトキポナはトキポナではない。「編集させてもいいのでは」と思いついた人は、
  この一行で止まること。

  **「だから公式で参加してくれってメール送ってんのよトキポナに。」** — 公式アセットは
  こちらが勝手に作るものではなく、向こうの公式に入ってもらうものである。
  これはリポジトリの外で起きる仕事であり、コードで先回りしてよいものではない。

- Affected features: ホームの言語の概要ページ（`www/home.js`、`wldSecDl()` の四つの
  解放トグルは `claude/wiki` が今作っている）、言語一覧 `vLangs()`（同じファイル、
  「読んでいる」の節が DL 言語の入る枠）、プロフィールの長押し（`www/me.js`）、
  `CAN.dl`と DL 言語の天井（`www/core.js`）。**今日入ったのは一つもない。**
- Affected data: `LANGS[id]` に「読み取り専用」を言うものが要る。今は無い —
  `LANGS` に書き込む三箇所（`core.js:115`、`core.js:140`、`backup.js:264`）は
  全部 `mine:true` であり、**編集できない言語は今このアプリに一つも存在しない**。
  人が作ったものは一つも消えない — DL は足すだけであり、自分の言語には触れない。
  `docs/DATA_MODEL.md` § 読み取り専用の言語。
- Affected docs: `docs/FEATURES.md`、`docs/DATA_MODEL.md`、`docs/PAID_FEATURES.md`、
  `docs/ARCHITECTURE.md`、`docs/STATE.md` § 3。
- Implementation status: **入っている。**`can('dl')` は plus（`CAN.dl`、
  `www/core.js`）、数は `dlCap()` が 0 / 1 / 3 で答え、`dlCount()` が
  `mine` の false を数える ── 作る天井（`langCap()`）とは別の天井で、互いに
  見えない。取ってきた言語は `langSeenAdd()` が `mine:false` で index に入れ、
  `vLangs()` が「読んでいる」の節に並べる。解放は章ごと（`wldSecDl()`、
  `www/home.js`）で、一つのスイッチではない。

  **数は 2026-09-02 の決定が決めた** ──「plusからです」。この項が
  〈`は？` で終わっているので決めない〉と書いた二つは、そちらで閉じている。

#### この決定がぶつかるもの二つ。ここで解決しない。

このファイルの「決定が既に書かれた規則と衝突したら STOP。両方を報告し、
自分で決めない」に従う。

**一つめ — 切り替えはプロフィールに置かない、と同じ日に決まっている。**
下の 2026-08-25「Making a second language — where the door is」はこう書いている —
「It is NOT moved onto the profile or behind the face; that was offered and turned
down.」「せっていからでいいよ」。今日の「プロフィールのとこ長押しで言語切り替え」は
これを真正面から踏む。二つは同じ日付であり、どちらが後かは日付では分からない。
両立する読み方はある（一覧は設定に残り、長押しはその上の近道）が、
**その読みはここで決めない。オーナーに訊くこと。**

> **2026-08-27 に訊いて、返ってきた。その読みで合っていた。**
> 「インスタと同じようにしたから出てくる。で切り替えタップしたらその言語にいく。
>  あかうんとは切り替えられないから、制作の中身だけ変わる」 **OWNER 2026-08-27**
>
> 一覧は設定に残り、プロフィールのタブの長押しが**同じ `langs` の頁**への
> 近道になった（`holdStart()`、`www/shell.js`）。二つ目の一覧は作っていない。
> **アカウントは変わらない** ── `langOpen()` は `lingua.me` も `lingua.sess` も
> 触らず、`vLangs()` は言語の名前だけを並べて顔を出さない。
> 下からせり上がる板ではなく**頁**である。`CLAUDE.md` の
> 「ページ遷移型にせず下からひょいって出すやつ」は**そのまま効いており、
> 例外は要らなかった** ── 頁は 2026-08-25 に既に作られていて、
> 足りなかったのは設定を通らずにそこへ行く道だけだった。

**二つめ — 公開と DL は 2026-08-19 に一度決まっている。**
`docs/FEATURES.md` § 4「Publishing and downloading」がそれで、今日のものと
三つ違う。① キーボードと文字の DL は**無料**だった（今日は「DLはplusから」）。
② DL したキーボードは**自分の棚に三つまで**並ぶと書いてあるが、今日の形では
DL は「言語一つ」として数えられ、キーボードはその中にある。
③ 08-19 は**人が人のものを**取る話、今日は**公式アセット**の話である。
同じ仕組みを使うが同じものではないかもしれない。
一つだけ合っている — 08-19 も「A downloaded dictionary is a language you can READ
and is never merged into your own」と言っている。**入らない、は二度決まっている。**
残りの三つは**オーナーに訊くこと。**

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
- Implementation status: **入っている。**`calMonthSlots()` と `calWeekSlots()`
  （`www/cal.js`）が `cal.m.1`…`cal.m.12` と `cal.d.1`…`cal.d.7` を引き、
  十言語ぶんの 19 個が入っている。英語は January…December と
  Sunday…Saturday で、**曜日は日曜から**

**`cal.js` に食い違うコメントが残っていたが、実装と一緒に直った。**
「A month called "3" ... is the only honest label」と書かれていたのは、
**週や月の長さを言語が決められた頃**の理由で、同じファイルの頭がその設計を
既に取り消していた(「THE STRUCTURE IS THE WORLD'S」)。今は
`calMonthSlots()` の上が、その古い理由と、なぜ取り消されたかを書いている。

**十二ヶ月＋七曜 = 19 個の文言 × 十言語 = 190。** `Intl` で機械的に出す道も
あるが、i18n-check の鏡は「t() を通っていない平文」で落ちる ── そして
`t(pre+i)` のように接頭辞を引数で渡す形も、検査が読めない鍵になって落ちる。
だから十九本が二組、手で書き出してある。

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
- Date: 2026-08-25
- Area: 無料で使えないものは、隠すのではなく見せる
- Decision:

  「無料はタップすると課金ページに飛ばされる」
  「だいたい無料で使えないやつは表示させていいよ。課金させる動線を減らしたく
   ない」

  **段が閉じている機能は、無料の画面にもそのまま出す。押すと料金の画面へ
  行く。** ボタンを消さない。

- Reason: オーナーの理由がそのまま書いてある ── 課金への動線を減らしたくない。
  見えないものは買えない。

  **これは `docs/PAID_FEATURES.md` に書かれていた「ボタンは減る、言葉は
  減らない」の、ボタンの側を裏返す。** 言葉の側は一文字も動かない ── 段の
  検査に落ちても、その人が作ったものは一つも消えないし一つも隠れない。変わる
  のは扉の見せ方だけで、絶対規則の後半はそのまま絶対のままである。

  **`capStop()` は含まない。**「5はいあってる」 OWNER 2026-09-03。あの関数に
  は「go('plans') をやめた」理由が書き残してある ── 単語を打っている途中の人
  から画面を取り上げて料金表に置くことになったから。あれは *計っている天井* に
  途中で当たる話で、ここで決まったのは *最初から閉じている扉* を押す話。押した
  人は「これが欲しい」と言っているのであって、途中で取り上げられてはいない。
  **天井はポップで訊いてから飛ぶ。扉は押したら飛ぶ。**
- Affected features: 段で閉じているものを描いているすべての画面。今回入るのは
  `postEdit()`（投稿の編集、`www/post.js`）と、言語をもう一つ作る扉
  （`www/home.js`）の二つ。
- Affected data: 無い。
- Affected docs: `docs/PAID_FEATURES.md`、`docs/FEATURE_RULES.md`。
- Implementation status: **implemented**, 2026-08-25, `claude/plans`。
  `plan-check` が持つ。

### Decision
- Date: 2026-08-25
- Area: The sheet takes a PDF and nothing else, for now
- Decision:

  「一旦写真禁止で、普通に pdf で提出以外受け取らないで行こう。
   今後のアプデで追加しよ」

  **The read side accepts a PDF only.** A photograph — jpg, png, a picture
  taken with the phone — is turned away, and the sentence says so. Photographs
  come back in a later update; nothing about them is deleted, only shut.

  `www/sheet.js` reads both today: `shPdfJpeg()` takes the page out of a PDF
  and the reader will equally take a plain image. What changes is which files
  are offered and accepted, not the reader underneath it.

- Reason: the owner's, and it is a shipping decision rather than a technical
  one. What was never measured is exactly the photograph case — a brush and a
  hard pencil, on paper, under a real camera — and 「紙が本当に精度高く
  できんのか」 was the question this whole road started from. A scan or a
  print-to-PDF has no camera in it: no lighting gradient, no perspective, no
  focus. So the half that is proven ships and the half that is not waits.
- Affected features: `www/sheet.js` — the read page, what the file chooser
  offers, and one sentence for a file that is not a PDF. `shPdfWhy()` already
  answers `photo` / `packed` / `drawn` / `not-pdf`, so the sentence has
  somewhere to come from.
- Affected data: none.

### Decision
- Date: 2026-08-25
- Area: Shipaton 2026 — the app ships to the App Store by 30 September
- Decision:

  「shipaton だそう。9／30 までには出したい」

  Lingua enters RevenueCat's Shipaton 2026 and the **first public version is
  on the App Store before 2026-09-30 23:45 Pacific**.

  The two rules that decide eligibility, read off the rules page rather than
  remembered: the app's first public version must go live between 1 August and
  30 September 2026 (an app already live anywhere before that window does not
  qualify), and it must use the RevenueCat SDK for at least one in-app
  purchase. **Lingua has never been publicly live** — TestFlight only, and
  build 86 was refused by Apple — so it clears the harder of the two.

- Reason: the money side is designed, priced and coded already, which is what
  most entrants have to build. What is actually on the critical path is not
  code: it is `docs/STATE.md` § 7 items 16, 16a–16d and 17, every one of them
  a console the owner alone can open, and **16a blocks all building**. After
  those comes an App Store review, which takes days and can fail — build 86
  already did (`ITMS-90158`).
- Affected features: `ios/App/App/LinguaStore.swift` gains RevenueCat in place
  of talking to StoreKit directly. The four product ids do not move.
  `tools/plan-check.mjs` holds twenty-odd claims about the current shape and
  will need re-pointing, not rewriting: **money decides what may be DONE and
  nothing about what exists** stays true through the swap or the swap is wrong.
- Affected data: none. A subscription is not a slice.

### Decision
- Date: 2026-08-25
- Area: A plan changes what happens when you press, not what you can see
- Decision:

  「普通に例えばキーボードを plus で5個以上追加しようとしたら pro の案内が
   出るみたいにさ、そのプランでできることできないことで UI 自体に変更が
   ない方が良くない？」

  **The screen is the same on every plan.** A ceiling and a closed door both
  show up at the moment somebody PRESSES, as a way to the plans screen — never
  as a button that is not there.

  This goes one step further than the decision recorded a few hours earlier
  the same day (「無料で使えないやつは表示させていいよ。課金させる動線を
  減らしたくない」), which was about closed doors. This is about ceilings too,
  and it says the same thing about both.

  **`capStop()` already IS this shape, and is the worked example.** The word
  ceiling asks with iOS's own `confirm()` — the sentence and the upgrade word,
  both already in ten languages — and goes to the plans screen on yes, and
  leaves you exactly where you were on no. It used to `go('plans')` outright
  and that was taken out for the right reason: it took the screen away from
  somebody halfway through typing a word. So the answer to the question
  `claude/plans` asked in ffd6022 is **no change is needed there**.

  **The first thing that is NOT this shape is `kb.full`.** Today
  `www/keyboard.js` says `toast(t('kb.full', KB_MAX))` and stops — a sentence
  with no way to the thing it is about. It becomes `capStop()`'s shape.

- Reason: the owner's, in one line — 「課金させる動線を減らしたくない」. You
  cannot buy what you cannot see, and a button that quietly is not there tells
  nobody anything.

  **What this does NOT touch, and the distinction is the whole of it.**
  `CLAUDE.md`'s money paragraph says a failed check means **fewer buttons,
  never fewer words**. The BUTTON half is what this decision turns over: there
  are no fewer buttons now either. The WORD half does not move by one
  character — a plan that lapses hides nothing anybody made, deletes nothing,
  and takes nothing out of a backup. `wordsSeen()` and the `letters` slice are
  untouched. That sentence in `CLAUDE.md` needs rewording to match, and
  rewording the head of that file is not a session's to do alone.
- Affected features: every screen that draws something a plan closes.
  Named today: `kb.full` (`www/keyboard.js`), `postEdit()` (`www/post.js`),
  the door to a second language (`www/home.js`), and the write road
  (`www/sheet.js`) once `CAN.write` exists.
- Affected data: none.

### Decision
- Date: 2026-08-25
- Area: Making a second language — where the door is, and what it does
- Decision:

  「アカウントが変わるイメージ。実際の sns はアカウント切り替えボタンある
   やん？あれが言語切り替えになるって感じ」「せっていからでいいよ」

  **A language is an account, and the language list is the account switcher.**
  It stays where it is — Settings → Languages (`www/settings.js`, `go('langs')`,
  `vLangs()` in `www/home.js`). It is NOT moved onto the profile or behind the
  face; that was offered and turned down.

  What is added is one button at the **foot of that list**, where "add an
  account" sits in the app this is modelled on. Pressing it makes a language
  and opens it. Nothing is asked first: `langFirst()` already makes a nameless
  one and the onboarding already asks the name, so a second language arrives
  the same way the first did.

- Reason: the screen, the switching and the making all exist already.
  `langFirst()` mints the id, puts it in `LANGS` and opens it; `langOpen()`
  saves the one you are leaving, reads the new one in and calls `viewReset()`
  so you do not arrive in somebody else's language with your filter still on.
  What was missing was a door, and only a door.
- Affected features: `vLangs()` (`www/home.js`), a new act, ten strings, and
  **the language ceiling** — which lands in the SAME commit, because a door
  with no ceiling is unlimited languages on the free plan. Free 1 / Plus 1 /
  Pro 3, from the decision of 2026-08-23. It HIDES and never deletes
  (`wordsSeen()`'s shape): somebody who already has three keeps three, sees
  three, backs up three, and is refused only the fourth.

### Decision
- Date: 2026-08-26
- Area: The five patterns — each comes out the shape of a keyboard
- Decision:

  「qwartyとフリックだとサイズ違うでしょ？そういうのはどうなんの？」
  「フリックだけじゃなくて全部。」

  **Every pattern comes out at a real keyboard's proportions.** Measured on a
  390 × 844 phone, iOS is QWERTY 10 across (0.72:1), kana 5 (1.44:1),
  ten-key 4 (1.81:1) — all four rows, all about a third of the screen. Ours
  were flick 3 across (2.41:1, a 130 × 54pt letterbox) and tap and chart
  seven rows deep, half the screen.

  Three sentences do it:

  - **The keys that are not letters take a COLUMN, not a row.** On a short
    board a row of their own is a whole row, and a keyboard with no return is
    one nobody can send a message on. flick's fourth column and chart's last
    column carry delete, space and return down them.
  - **Letters go as few to a row as will hold them in four rows** (`kbPer()`),
    so the keys come out as big as they can. Four rows is the ceiling on how
    tall a keyboard is.
  - **And the count has to divide the ten evenly** — 1, 2, 4, 5 or 10
    (`KB_PERS`) — because a key is big by spanning whole columns, and a key
    that lands between two of them is one the letters across the top cannot
    name. Four is a kana keyboard, five a chart, ten a QWERTY.

  Every row a pattern builds comes to exactly ten. Measured on 390 × 844:

  | | before | after |
  |---|---|---|
  | qwerty | 10 keys of 39pt, 5 rows, 38% | unchanged |
  | flick | 3 keys of **130pt**, 3 rows, 25% | **4 keys of 97pt**, 3 rows, 25% |
  | tap | 5 keys of 78pt, **7 rows**, **51%** | 10 keys of 39pt, **4 rows**, **32%** |
  | tap face 2 | 5 of 78pt, 5 rows, 38% | **4 of 97pt**, 4 rows, 32% |
  | chart | 5 of 78pt, **7 rows**, **51%** | 6 of 59pt, **6 rows**, **45%** |
  | abc | 10 of 39pt, 4 rows, 32% | unchanged |

  **chart's grid is untouched**: its row count is the number of consonants,
  which is the language's and not ours. Only the column moved, and its keys
  take as many whole columns as fit with the remainder at the ends — the free
  QWERTY's nine-letter row, which is inset by half a key at each end, is the
  same trick.

- Reason: the editor is the preview and a pattern is where a keyboard starts,
  so a pattern that starts at a shape no phone has is the app handing somebody
  a bad keyboard and calling it a starting point.
- Affected features: `kbPer()`, `kbRows()`, `kbFlickLay()`, `kbChartLay()`
  (`www/keyboard.js`). **Nothing stored changes and no existing keyboard
  moves** — only what a NEW board is made from.
- Implementation status: **implemented**, 2026-08-26, `claude/kb2`.

### Decision
- Date: 2026-08-26
- Area: How many rows a keyboard may have — it is the keyboard's HEIGHT
- Decision:

  「キーボードの高さ制限を決めたやん。キーの高さじゃなくてキーボードそのもの。
   だから行の列はそのキーボードの制限の範囲内で追加できるって話だけど？」

  **The ceiling is the keyboard's height, which is already decided, and the
  number of rows falls out of it.** It is not a number anybody chooses and
  there is no longer one written in the app.

  `KeyboardViewController` caps the whole keyboard at `mostOfScreen = 0.55`
  of the screen, a row at `rowHeight = 54`, and the edges plus the candidate
  bar at `8 + 44` — and past the cap it SQUEEZES the rows rather than growing
  (「高さやめて、フリックなら日本語のサイズ、qwartyなら無料版のサイズくらいまで
  にしないとキツくない？」). So a row past the cap was never a row; it was
  every row on the keyboard getting shorter.

  **And a row is a KEY tall.** 「キーのサイズはiPhoneのサイズによって変わる
  んじゃないの？八行入っても小さかったら打ちにくいだけだぞ？」

  `rowHeight` was a flat `54`, so a key was the same height on every phone and
  the only thing a bigger phone bought was MORE ROWS. Width always scaled —
  ten keys divide whatever the phone is across — and the height now follows
  it at **0.1385 of the phone's short side**, which is that same 54 at the
  390pt phone it was measured on. A key keeps its shape everywhere.

  `kbRowsMax()` divides the rest out: `(screen × 0.55 − 52) / (width × 0.1385)`.

  | phone | row height | rows that fit |
  |---|---|---|
  | 320 × 568 (SE 1) | 44.3pt | **5** |
  | 375 × 667 (SE 2/3) | 51.9pt | **6** |
  | 375 × 812 … 402 × 874 (13 mini … 16) | 51.9 – 55.7pt | **7** |
  | 428 × 926 … 440 × 956 (Pro Max) | 59.3 – 60.9pt | **7** |

  **Eight fits on nothing now**, which is what the report was about.

  **The ceiling is ONE number — seven — and not each row of that table.** A
  keyboard belongs to a language and a language moves between phones, so
  "as many as the phone in your hand fits" builds eight on a Pro Max and hands
  an SE eight rows squeezed to 39pt. It is the width rule one axis over:
  rule 19 has always set the width by the narrowest iPhone, not the phone in
  your hand.

  It was `KB_ROWS = 8`, invented in `www/keyboard.js` under a comment saying
  「nothing on the phone sets a height」 — which was not true when it was
  written. Eight is what only the largest phone has room for.

- Reason: two places were deciding how tall a keyboard may be and only one of
  them was enforcing it. Holding it in one place is the whole of this; the
  three numbers are the extension's, so **`tools/kb-check.mjs` reads them out
  of `KeyboardViewController.swift`** and fails if the two sides disagree — a
  comment naming the Swift file does not hold that, and a check that wrote
  `0.1385` down again would be a third copy. Putting `rowHeight` back to a
  flat `54` fails it as "no line matching", which is the shape that matters:
  the check breaks when the extension stops answering the question, not only
  when it answers differently.
  The candidate bar is assumed present because it nearly always is
  (`shareConv()` answers for an alphabet too) and because assuming it is the
  stricter of the two answers.
- Affected features: `rowHeight` / `rowPerWidth`
  (`ios/App/LinguaKeyboard/KeyboardViewController.swift`) and `kbRowsMax()`,
  `kbRowH()`, `kbRoomRow()`, `kbLayRoom()`, `kbLayPut()`
  (`www/keyboard.js`) — **nothing stored changes and no layout moves.**
  **The Swift half is NOT device confirmed**: it cannot be built or run from
  Linux. rule 19's "held on ADDING only" is unchanged and is what makes
  this safe: a keyboard built on a Pro Max and opened on an SE is left
  exactly as it is, and simply cannot be added to there.
- Implementation status: **implemented**, 2026-08-26, `claude/kb2`.

### Decision
- Date: 2026-08-26
- Area: The keyboard sheet's width — ten fixed columns, and a key spans them
- Decision:

  「フリックなのに qwerty サイズ」
  「qwartyはqwartyのサイズあるやろ　フリックとqwartyのキーのサイズは
   同じなんか？え？」

  They were. Measured on a 390px screen, a flick key and a QWERTY key were
  both **28.2 × 44** — the same pixel, on two keyboards that are nothing like
  each other on the phone.

  **The board is the full width and the grid is TEN COLUMNS, always. A column
  is a tenth and never moves. A KEY is big by spanning columns.**

  「行と列はエクセルのように数字振ったんだから、小さくなったら意味ないやん」
  「エクセルは足しても小さくならんやろ」

  This was got wrong once in between, and the wrong version is worth writing
  down because it is the obvious one: the grid was made as wide as the board's
  widest row, so a key WAS its share of that row. It gave the right key sizes
  and the wrong sheet — a column was a different width on every board, and
  taking one out made the nine that were left STRETCH, with the letters across
  the top going from ten to nine. Numbering columns `a b c` is what says they
  are fixed; a column that changes width is not an address.

  Ten fixed columns says both things at once. A flick key is `w 2.5` — five of
  the ten — so it comes out **97pt where a QWERTY's is 39**, and `a` is `a` on
  both boards. And the ceiling does the rest: a row that already comes to ten
  refuses another key, so nothing is ever made smaller to fit something in.
  `kbRoomIn()` has always said that; what was missing was a fixed width for it
  to be true against.

  **Every row a pattern builds comes to exactly ten**, with the space bar
  taking the slack on a bar row and gaps at both ends of a short one. That is
  what makes the sheet and the phone the same picture: the extension divides a
  row by its OWN total, and a row of ten drawn on ten columns is the same row.

  **This replaces the decision of 2026-08-25** — 「エクセルみたいにキーボード
  にやって横幅が固定されるはずだよ」 — only in where the fixed column comes
  from. That decision fixed the column at a tenth and let the BOARD be as wide
  as its columns made it, so a four-column board was a quarter of the phone
  across. The column is still a tenth; the board is now always the whole
  phone, and a short board is short rows on a full grid rather than a small
  sheet.

- Reason: the editor is the preview — there is no second picture of the
  keyboard beside it — so a key drawn at a width the phone will never use is
  the screen lying about the only thing it shows. It also settles a second
  report in the same line: a page somebody had just made was two keys wide,
  so the sheet was a fifth of the phone across and the dashed `＋` that adds
  a row to it was 60px against 320 on page one, which reads as 「8列も追加
  できるのに行は2ページ目から追加できない」. Rows could always be added; the
  thing to press was a sliver.
- Affected features: `kbSheetW()`, `kbKeyW()` and the `cols` `kbHTML()` draws
  on (`www/keyboard.js`), how every board narrower than ten columns is DRAWN —
  **nothing stored changes, no layout moves, only the drawing**. `kbCellW()` stays on the ten-key scale
  and is now only the 1/2/3 width palette, which is a palette of proportions
  and not a picture of a key: at true size on a three-key board those three
  tiles come to twice the screen, which is the fault
  `tools/side-baseline.txt` carried three lines of and which the 2026-08-25
  decision fixed. It stays fixed.
  Height is NOT part of this and is unchanged: a row is one height whatever
  the board is, so the sheet is the phone's shape across and not down.

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

  So this lands with `words` `kb` `letters` `wsys` `snd` `edit` on the middle
  rung and `gram` `dir` `data` `file` `badge` on the top one. **How many `CAN`
  holds is read off `CAN`** — `npm run dead` prints it — because a number
  written here is a prediction, and both of the predictions this line used to
  carry were wrong within the fortnight.
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
- Affected features: `KB_MAX` (a per-language ceiling then, a pool now, and
  gone entirely on Pro), a new language ceiling that does not exist at
  all today, `postEdit()`, `planBadge()`.
- Affected data: none. Somebody over a ceiling keeps everything — every
  keyboard, every language — and simply cannot add another. `backup-check`
  holds this for keyboards already.
- Affected docs: `docs/PAID_FEATURES.md`, `docs/FEATURES.md`.
- Implementation status: **the keyboards are built** (2026-08-23,
  `claude/save`): `kbCap()` in `www/core.js`, `kbCount()` / `kbRoomKb()` in
  `www/keyboard.js`, `CAN.kb` at `plus`, `KB_MAX` gone. Held by `plan-check`.
  **The language ceiling, `can('edit')` and `can('badge')` are all built now** --
  `langCap()` beside `kbCap()` in `www/core.js` (1 / 1 / 3, with `langStop()`
  as the refusal), `CAN.edit` at `plus` with `postEdit()` asking `can('edit')`,
  and `CAN.badge` at `pro` with `postBadge()` asking `can('badge')` instead of
  reading `plan()`. `dl` was added on 2026-09-02. **広告は今やりません**
  ──「6いまはいい」 OWNER 2026-09-03 ── ので `noads` は `CAN` に入れません。

  **数えるのはアカウントです。**「は？端末の話なんかしてねえだろ」「だから端末で
  やるわけねえだろ」 OWNER 2026-09-03。この app に「端末ごと」という単位は
  ありません（`CLAUDE.md` § Online）。`langCount()` は `langAcct()` を通し、
  `langOwned()` が `SESS.uid` と言語の `uid` を突き合わせます。
  アカウントを共有して数を増やすのは規約の話で、コードが追うものではない
  ── 「普通に共有は規約違反でしょ」。

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
- Implementation status: **built, 2026-08-23, `claude/save`.** It was deferred
  because `www/keyboard.js` was another branch's; that branch has not touched
  the file since 2026-08-15 and no live branch is in it, which was checked
  before starting rather than after a merge failed. `kbCap()` sits beside
  `wordCap()` in `www/core.js` (1 / 4 / Infinity), `kbCount()` in
  `www/keyboard.js` sums the built keyboards across `LANGS` -- the open
  language from memory, every other one through `kbBoardsOf()` so an older
  single-keyboard file counts as the one it is -- `kbRoomKb()` adds the QWERTY
  as the 1 in 1 + 3, and `CAN.kb` moved to `plus` in the same commit. `KB_MAX`
  is gone. Seven claims in `plan-check`; three bugs put back and watched.

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

  **`noads` は `CAN` に入れません。**「6いまはいい」 OWNER 2026-09-03 ──
  広告は今やらないので、消すものがありません。`dead-check` は誰も訊かない
  能力を拒みます（何も課金していない値段表の一行）。**広告をやると決まった日に、
  その実装と同じコミットで入ります。**それまでこの行は一つも足しません。

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
- **SUPERSEDED 2026-08-26** by 「匿名アカウントはねえよ」「言語はアカウントないと
  作れないです」「ログインした人しか書けないけど」「二種類になる意味も分からない
  けど」 — the entry at the head of this log. **There is no anonymous account
  and no second question.** The words below are the record of what was decided
  on the 22nd and are left exactly as they were; nothing in them is a rule any
  more. Do not build off this entry.
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
- **SUPERSEDED、二つの半分がそれぞれ別の日に。**この項は「SNS だけ止める」と
  「三タブを閉じる」の二つを言っていて、**どちらも取り消されています**。
  - **タブは閉じません。**「3タブを閉じる必要もないし。ホームに出ればいいやん」
    ── 凍結は `vFeed` の中身がその一枚に変わることで、タブは開いたままです。
  - **制作側も止まります。** OWNER DECISION 2026-08-26 ── 凍結アカウントが
    自分の言語を編集してよいかを直接訊いた答えは、してはいけない、でした。
    言語は人に渡るもの（DL できて、誰でも開けるページに載る）になったので、
    「他人には関係ない」がもう言えません。
- Area: What being frozen stops
- Decision: 止まるのは **SNS と、言語がサーバーへ上がる分**。投稿・返信・反応・
  フォロー・通報と、`slice` の書き込み。**三つのタブは開いたままで**、凍結は
  ホームに出ます。端末の中にあるものは読めて、開けて、バックアップも取れます
  ── `account_delete()` だけは `is_member()` を訊きません。出口に鍵は掛けない。
- Reason: 凍結は解けるので、何も壊さない。そして帳を下ろす場所は一つでいい ──
  `is_member()` が `supabase/schema.sql` の全書き込みポリシーの中にあり、
  画面が何を言おうが言うまいが、閉まる扉はそれで閉まります。タブを閉じるのは
  同じことを二か所でやることでした。
- Affected features: `is_member()`（`supabase/schema.sql`）、`NET_BANNED` と
  `vFeed`（`www/sns.js`）、コンポーザー。
- Affected data: none. `profile.banned_at` / `banned_why` だけ。
- Affected docs: `FEATURES.md`, `supabase/setup.md`.
- Implementation status: **入っています。**`www/sns.js` の `vFeed` が
  `NET_BANNED` のときホームを一枚に替え、`www/net.js` が `banned_at` を読み、
  書き込みは全部 `is_member()` が止めます。タブは開いたままです。
- **一つ決まっていません。**端末の中だけの編集を止めるかどうか。2026-08-26 の
  決定は要約（`supabase/schema.sql`）としてしか残っておらず原文がありません。
  いまは端末では編集でき、上がる分だけが止まります。**これが決定どおりなのか、
  RLS が localStorage に届かなかった結果なのかは、書かれたものからは読めません。**
  訊くべき一文は「凍結中、端末の中だけの編集も止めますか？」です。

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
- **SUPERSEDED（2 と 4 番）→ 「ダウンロードは Plus から。上限は make と別で、
  Plus 1・Pro 3」（2026-09-02、この log の上のほう）。**無料は一つも落とせません
  ── 「plusからです」。数は言語ごとで Plus 1・Pro 3 で、自分で作る数とは
  別に数えます。1・3・5・6 番はそのまま生きています。
- Area: Publishing and downloading — a keyboard, an alphabet, a dictionary
- Decision:
  1. **The author decides.** Public or private, per thing, for all three: the
     keyboard, the letters, the words. Nothing is downloadable unless its
     author said so.
  2. 取ることそのものが **Plus から**。`can('dl')` が扉で、`dlCap()` が数です。
  3. **Making and publishing stays Plus**, as it is now. Free still cannot
     build a keyboard or add a letter, and that does not change.
  4. 落としたものは自分の数を食いません ── `langCount()` は `mine` を数え、
     `dlCount()` はその反対側を数えます。二つの上限は互いを見ません。
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
- Implementation status: **取る側は入りました。**`can('dl')`（`www/core.js` の
  `CAN`）と `dlCap()`（Plus 1・Pro 3、無料は 0）、`dlCount()`、`dlStop()`。
  押すと本当に着地することを `tools/dl-check.mjs` が持ちます ── 記事の見た目
  ではなく storage を訊きます（`LANGS[id].mine` が false、`bkPack()` は運ばない、
  `netLangSync()` は走らない）。「ダウンロードボタン押しても言語追加されない
  けど？」OWNER 2026-09-01 が、その検査が書かれた理由です。
  6 番（落としたキーボードに当てられる文字は落とした人のもの）はまだです。

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
- **Held by: nobody but a person.** Measured 2026-09-01. `.note` is worn 39
  times and most of those are the empty states, counts, states and errors this
  decision explicitly allows, so a check on the class would fail the app for
  obeying it; and a `.d`/`.eg` key is not an explanation either, a third of
  them being `aria-label`s. What is left is the sentence, and no check reads a
  sentence. Written here so that silence is not read as a check — CLAUDE.md
  § Explaining says the same in the rule itself.
- Implementation status: implemented. **`cap.lapse.d` is left in and is the
  one thing to settle**: it is the line that says a dictionary dropping back
  to a hundred words has had NOTHING deleted. Taking it out would leave the
  app silently truncating a list with no word about the data, which
  `docs/DATA_SAFETY.md` is written against. Reported rather than resolved.

### Decision
- Date: 2026-08-18
- Area: Anything that is the server's — and the timeline first
- **Superseded in part on 2026-08-26** (the entry at the head of this log).
  Point 1 stands and is still absolute. **Point 3 does not**: 「言語はアカウント
  ないと作れないです」「古い記載消してくれうざい」. The words below are left
  exactly as they were written — this log is the record of what was decided
  when, and a record that gets edited to agree with today is not one. Read
  point 3 as history.
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
- **SUPERSEDED、二つの側から。**段の名前と値段は「What the tiers are called」
  （2026-08-23、Free / Plus / Pro）が読み替えました ── **Studio はありません**。
  StoreKit を入れない話は「課金もタップしたら勝手になるけど？」OWNER 2026-08-31
  が取り消しました。下は書き換えた後の姿です。
- Area: Money — the four subscription products, their ids and their prices
- Decision:
  1. 売る段は **Plus** と **Pro** の二つ、それぞれ**月と年**。
  2. 商品 ID。**商品が App Store Connect にできたら、二度と変えられません**:

     | | monthly | yearly |
     |---|---|---|
     | Plus | `com.tokinets.lingua.plus.monthly` | `com.tokinets.lingua.plus.yearly` |
     | Pro | `com.tokinets.lingua.pro.monthly` | `com.tokinets.lingua.pro.yearly` |

     `plus.*` は改名の前は上の段の ID でした。いまは**中の段**を指します
     ── 誰も何も買っていない日に動いたので、動かして構いませんでした。

  3. 値段（USD）。ほかの国は Apple の自動換算です:

     | | monthly | yearly |
     |---|---|---|
     | Plus | 4.99 | 49.99 |
     | Pro | 9.99 | 99.99 |

  4. 四つとも `Lingua` という**一つのサブスクリプショングループ**に入れます。
     **Pro がレベル 1（上）、Plus がレベル 2（下）** ── 同じグループなら上げ
     下げでき、二つ同時には持てません。
- Reason: 段のはしごが一行で読めること。`docs/apple.md` に、Apple のサイトで
  どこを押すかまで書いてあります。
- Affected features: the plans screen, everything `CAN` gates
- Affected data: none. `SET.plan` は端末の写しで、**答えは Apple のもの** ──
  `storeTook()` は要求ではなく返事から段を取ります。
- Affected docs: `docs/apple.md`, `docs/PAID_FEATURES.md`, `docs/FEATURES.md`
- Implementation status: **StoreKit は入っています。**
  `ios/App/App/LinguaStore.swift` が StoreKit 2 でこの四つを扱い、
  `www/store.js` がその一つの窓、`www/settings.js` の `PLAN_BUY` は **true**
  です。実機では `storeBuy()` を通らなければ段は動きません。**false に戻さない
  こと** ── ビルド #106 が false のまま実機に出て、段のカードを押しただけで
  Pro が付きました。ブラウザには App Store が無いので `storeOn()` が false に
  なり、そこでは今までどおり手で切り替わります（検査とスクリーンショットは
  それで歩きます）。商品を作るのはオーナーの手です。

### Decision
- Date: 2026-08-13
- **SUPERSEDED（3 番だけ）→ 「The composer」（2026-08-13、この log の下のほう）。**
  写真を足す＋は無くなり、**カメラ・ライブラリ・マイクの三つのボタン**が
  キーボードの上の帯に並びます ── 「投稿の時にphotoボタンやめて。📷 ライブラリ
  マイクボタンにして」。1・2・4 番はそのままです。
- Area: Posts — how many photographs, and how they are shown
- Decision:
  1. A post can carry **up to four** photographs.
  2. They **slide sideways**; the picture area scrolls and nothing else does.
  3. 写真を足すボタンは**キーボードの上の帯**にあり、四枚で消えます。
     「写真と音声とかのボタンはTwitterと同じようにキーボード上に固定して」
  4. Each picture has its own letters placed on it, and each is baked
     separately when the post is sent.
- Reason: 「画像は4枚まで載せられる。画像だけ横スライドできる感じ」
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
- **SUPERSEDED（＋の位置だけ）→ 「The composer」（2026-08-13、この log の
  下のほう）。**足すボタンは写真の横ではなく、キーボードの上の帯にカメラ・
  ライブラリ・マイクの三つとして並びます。赤いマイナスと、押すと編集が開く
  ことは、そのままです。
- Area: Posts — the photograph on the composer
- Decision: no buttons under it. A **red minus at the picture's top corner**
  removes it, and **pressing the picture opens the editor** — cropping,
  letters, whatever the editor grows.
- Reason: 「右上に赤い⚪︎に-で消す」「編集ボタンはいらん。
  画像タップして画像編集切り抜きとか文字入れとかできるように」
- Affected features: composer
- Affected data: none
- Affected docs: CHANGELOG.md
- Implementation status: implemented; code confirmed, not device confirmed.
  The editor does both — letters and cropping — and the letters already placed
  move with the picture when it is cut

### Decision
- Date: 2026-08-13
- **SUPERSEDED（3 番だけ）。**「課金で追加した機能は無料になったら全部隠れる」
  OWNER 2026-09-01 ── 自作のステージは一覧に**残りません、隠れます**。語の
  百より先、無料のアルファベットより先の文字と、同じ扱いです。**消えるのでは
  なく隠れる**ので、`STG.extra` は storage にもバックアップにもサーバーにも
  そのまま在り、払えば全部そのまま戻ります。ほかの四つはそのままです。
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
  3. 自作のステージは**一覧から隠れます**。本にもともとある章は「無料の文法が
     何であるか」そのものなので残ります。`stAll()` が `can('gram')` の中でしか
     `STG.extra` を並べず、`stHidden()` がその数を足元に出します。
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
- **SUPERSEDED（2・3・4 番）。1 番だけが生きています。**
  - 2 番の赤い字 → 「語釈は二段。赤い字は無い。お題のページと同じ形」
    （2026-08-28、この log の上のほう）。「やっぱり、タイムラインも投稿も
    2段で。赤文字消して。」
  - 3・4 番 → **第三層そのものが無くなりました。**「なら自分の言語でどう言うか
    翻訳いらなくない？元々ai前提やったし」。経緯は
    `docs/CHANGELOG.md` § 「自分の言語で読む」は無くなった — OWNER DECISION。
- Area: A post shown three ways — the four details
- Decision:
  1. The natural-language layer is translated **when the post is written**,
     using **the reader's own device AI, borrowed** — not a service of ours.
     No key of ours, no server of ours, no cost per post. The translation is
     attached at the moment of posting and travels with the post.
- Reason: 「翻訳はユーザーのaiを拝借します。投稿するタイミングでai翻訳がつくので」
  「まずオフラインで起動できないやろSNSは」
- Affected features: composer, timeline, post
- Affected data: **new, frozen on the post** — `post.tr`, a translation per
  language code
- Affected docs: FEATURES.md, DATA_MODEL.md
- Implementation status: **縫い目だけがあります。**`postTr()`（`www/post.js`）は
  `done(null)` を返し、`tr` は付かず、読む人は書いた人が打った自然言語を見ます
  ── 動くべき姿であって、穴ではありません。`AI_SEAM` と同じ形です。

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
- **SUPERSEDED、全部。**三層という枠組みそのものが無くなりました。
  「なら自分の言語でどう言うか翻訳いらなくない？元々ai前提やったし」。
  経緯は `docs/CHANGELOG.md` § 「自分の言語で読む」は無くなった — OWNER
  DECISION。**投稿は二層です。**
- Area: A post shown three ways
- Decision: 投稿は**二層**で見えます ── (1) 書いた人が描いた文字、(2) それが
  読む人の言語で何と言っているか。**第三層（それを読む人の人工言語に置き直す）は
  作られ、外されました。**
- Reason: 語を入れ替えるのは翻訳ではありません。`Mama seja luna` が文になって
  いるかは、その言語がコピュラを持つか、所有をどう示すか、主題に何を付けるかで
  決まり、その答えを持っている場所がアプリのどこにもありません ──
  「単語を並べるだけじゃ文法はできないのよわかる？」。文法ページの自由文のメモを
  読めるのは AI だけで、AI は入れません ── 「AI入れないって言ってるでしょ？」
- Affected features: timeline, post
- Affected data: 二層とも投稿に凍らせてあります（`ink`, `mn`）。
  **前の版で `SET.trDate` と `SET.trN` を書いた端末では、その二つがまだ
  `SET` に残っています** ── いまのコードはどちらも書かず、読まず、そして
  **消しにも行きません**。人の設定にある二つの数で、このアプリは要らなく
  なったものを削除しません（`www/post.js` § Layer three ... is gone）。
- Affected docs: FEATURES.md, DATA_MODEL.md
- Implementation status: 二層とも入っています。第三層は外れています。
- Note: this does not overturn the decision at the head of `www/post.js` — no
  machine reads an invented language on the author's behalf.

### Decision
- Date: 2026-08-12
- **SUPERSEDED、三か所。**この項の「Plus」は改名前の名前で、いまの **Pro** です
  （「What the tiers are called」2026-08-23）。中身も二つ動きました ──
  **クラウドは全員のもの**になり（「What a thing belongs to」2026-08-22
  「クラウドは全員で」）、**翻訳は売り物ではなくなりました**（第三層が外れた
  ので、`docs/CHANGELOG.md` § 「自分の言語で読む」は無くなった）。
  はしごが二段から三段に割れたので、**この一覧の半分はいま中の段（Plus）です。**
  段ごとの答えは一箇所、`www/core.js` の `CAN` にあります。
- Area: Plus — what it contains
- Decision: はしごなので、上の段は下の段を全部含みます。**足す分だけ**を書くと:
  - **Plus**（中の段）── 文字の追加・改名・削除、音を選ぶ、アルファベット以外の
    書記体系、語 1000、キーボード四つ、投稿の編集、人の言語を取ること。
  - **Pro**（上の段）── Plus の全部に足して、語に上限なし、キーボードに上限
    なし、自分の文法のステージ、言語の向き、CSV の出し入れ、ファイルで持ち込む、
    名前の横の印。
- Reason: the owner's list, given in full.
- Affected features: every paid row in FEATURES.md
- Affected data: none by itself
- Affected docs: FEATURES.md, PAID_FEATURES.md
- Implementation status: **段の扉は全部入っています。**`CAN` の全部と、数で答える
  三つ（`wordCap()` `kbCap()` `dlCap()`）。フリックとキーの自由配置もキーボードの
  編集画面にあります。いくつ扉があるかはここに書きません ── 書けば次に増えた日に
  古くなるので、`npm run dead` が毎回数えて出します。
  **クラウドはどの段にも属しません** ── `netLangSync()` は段を訊きません。
  **翻訳は `CAN` に一度も入らず**、`TR_FREE_DAILY` も宣言されませんでした。

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
- **SUPERSEDED → 「What a thing belongs to」（2026-08-22、この log の上のほう）。**
  **クラウドは全員のもので、売り物ではありません** ── 「クラウドは全員で」、
  そして「基本は全部サーバー管理」（2026-08-26）。保留でもありません。
- Area: Cloud storage
- Decision: **サーバーがものの在り処で、それはどの段でも同じです。**言語が在る
  ことは誰かが「する」ことではないので、段が決めることではありません
  （`docs/PAID_FEATURES.md` の頭）。端末が持つのは、信号が無くても動くための写し。
- Reason: 段は**何をしてよいか**を決めるもので、**何が在るか**は決めません。
  値段の側も合っています ── 言語は 5.4 KB に詰まり、大きいもので 1 MB ほど。
  その大きさの段を食うのはタイムラインの写真で、それは容量ではなく帯域です。
- Affected features: `netLangSync()`（`www/net.js`）、`SLICES`、`slice` の
  ポリシー（`supabase/schema.sql`）
- Affected data: 全スライス。競合の解き方はオーナーが決めることで、道具が
  決めることではありません
- Affected docs: FEATURES.md, PAID_FEATURES.md
- Implementation status: **入っています。**`netLangSync()` は段を訊きません。
  **段の画面にも設定画面にもクラウドの行はありません** ── 設定にあった
  「Cloud sync ── On」は、Plus の人にだけ、何もしていない状態でそう言って
  いました。行そのものが消えています（`www/settings.js`）。`CAN.data` は
  残っていますが、それが指すのは CSV だけです。**これをまた扉に戻さないこと。**

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
- Implementation status: **入っています。**開いていた二つは、どちらも後の決定が
  答えました ── **どの段でも無料**（「Posts — letters on an image」2026-08-13
  「画像と自作文字貼るのは無料 投稿に貼るに決まってるでしょ」）、**data URL で
  投稿に載せ、文字は焼き込む**（同）。枚数は四枚まで（「Posts — how many
  photographs」2026-08-13）。焼き込みは `post-check` が画素で数えて持ちます。

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

### Number of languages — **superseded 2026-09-02**
- Date: 2026-08-12
- Area: Number of languages
- **Superseded by 2026-09-02 「ダウンロードは Plus から。上限は make と別で、
  Plus 1・Pro 3」** (in this log). Making a language is now **Free 1, Plus 1,
  Pro 3** — `FREE_LANGS` / `PRO_LANGS` and `langCap()` in `www/core.js`,
  with `langStop()` sending somebody to the plans screen at the ceiling.
  Downloading somebody else's is a separate number again.
- Decision: One language per person, on every plan. Not a price.
- Reason: there is no way to make a second anywhere in the app, so a plan
  promising more would promise a button that does not exist.
- **Why it fell**: that reason stopped being true. `langAddRow()`
  (`www/home.js`) is the door to a second language and `langNew()`
  (`www/core.js`) is what it presses, so the number is something a plan can
  sell. `LANG_MAX`, which this entry named, no longer exists.
- Affected features: languages
- Affected docs: PAID_FEATURES.md, FEATURES.md

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
- Decision: One face, and no second page. Digits above the QWERTY. The
  bottom bar is `! ? スペース 改行` — the two marks together at the near
  end — and the delete key is **three** keys wide, hard against the right
  edge. Every row comes to ten.
- Reason: 「2ページ目なしでqwertyの上に1〜0の数字と！？入れてこれで無料版1ページに
  抑えよう」「これスペースデカすぎやね。！スペース？みたいにできない？」
  「デリートキーは横二つ分欲しいかも」
- **The bar and the delete key were settled again after this entry was
  written, and this entry did not say so for a week.** Both are the owner's
  and both are in `docs/CHANGELOG.md`:
  「2があった分謎に隙間できたから無くして」 took the key-wide hole out of
  the third row, which made the delete three wide rather than two; and
  「改行入れるか無料も。！？スペース　改行」 moved the two marks together to
  make room for a return key — a keyboard that cannot start a new line is
  one nobody can send a message on. The Decision above is written as they
  left it. 「2ページ目なし」 is untouched.
- Affected features: keyboard
- Affected data: none (`kbFixed()` is built from `LETTERS`, stored nowhere)
- Affected docs: PAID_FEATURES.md, CLAUDE.md § what the free plan is
- Implementation status: implemented. `kbFixed()` in `www/keyboard.js`

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
  have never run on a phone.
- **「never into `localStorage`」 was broken by the drafts and was put right
  on 2026-09-03.** A draft carried `PW.vo` whole, base64 and all, so up to
  thirty seconds of audio went into `lingua.drafts` and up to the server in
  the draft's body — and `draftsSave()` swallows its exception, so hitting
  the quota made drafts stop saving in silence, which is the 「保存したつもり」
  this decision was written to prevent. The fix is not a condition added on
  top: the file is written **the moment the recording ends** (`voTook()` in
  `www/rec.js`), so `PW.vo` is `{f, ms}` from then on and no base64 is held
  anywhere. There is one road for a voice instead of two — `voPlayPW()` is
  gone and the composer plays through `voPlay()` like everything else. A
  draft written before this still holding `b64` is put on the disk by
  `draftOpen()` and replaced in place. `post-check` walks the recording
  through to the post; four reds were watched first.
- **A draft thrown away takes its recording with it.**
  「声は投稿上で再生できるよね？下書き消した時にはいらなくない？」 OWNER
  2026-09-03. `draftDropGo()` drops that one file and nothing else — it names
  the file it was given rather than walking the directory asking what is
  stale (`docs/DATA_SAFETY.md` § DELETE REVIEW)

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

### A word's derived words — **superseded 2026-08-20 (the entry below)**
- Date: 2026-08-20
- Area: A word's derived words
- **Superseded the same day by 「A word's related words」, which is the NEXT
  entry down.** The nine below became **two groups of twelve** — 活用 and
  派生 — and a language may write its own in either. `FM_INF` and `FM_DER` in
  `www/wordsheet.js` are those two lists.
  **The ordering of this log is what makes this worth marking**: entries run
  newest first, and these two share a date the wrong way round, so whoever
  reads down the file meets the nine before the twenty-four and takes the
  nine for the newer answer.
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
  line and one example rather than opening a page.

  **「ポップとして」の一語は superseded 2026-09-01。**この日の決定が、この
  app の三つを名前で分けた ── 問いは `popAsk()`、言い切りは `toast()`、
  打ち込みは `openForm()`、そして四つ目は作らない。？が出すのは一行の
  言い切りなので `toast()` です（`fmSay()`、`www/wordsheet.js`）。
  2026-08-20 の対比は「ページを開くのではなく」であって、そちらは今も
  そのとおり。
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
