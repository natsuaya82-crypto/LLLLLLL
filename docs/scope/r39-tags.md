# r39-tags ── タグは本文の外へ。翻訳の下に、最大 4 つ

ブランチ `claude/r39-tags`（`integ-0905` = `d91617c0` から。報告を書いた時点で
`origin/master` = `d91617c0` なので、取り込みは早送りです）。
**取り込むのはサブリーダー／リーダー。全ゲート（`npm test`）は回していません。**

## オーナーの決定（2026-09-15 夜、そのまま）

> 「#はべつで」
> 「リプライトゥー@〇〇のサイズ感で翻訳の下で最大4つまで別枠で入れられるとかは？」
> 「返信はok」「文字サイズはこのままでいい」「見た目見せて できたら投稿のとこ」

2026-09-04 の「タグは本文中に。」を**差し替え**ました。あの日の決定のうち
**今も生きているのは二つ**で、新しい項目がそれを引き継いでいます ──
**綴りは一つ**（十に割れると文字合わせの検索が一生出会わない）と、
**青くて、押すとそのタグの検索になり、前の日の投稿も出る**。差し替わったのは
**どこに入るか**だけです。決定ログの古い項目は畳んで書き換えました
（`docs/CHANGELOG.md` は残してあります）。

## 変えた file

| file | 何を |
|---|---|
| `www/sns.js` | § A TAG IS NOT IN THE BODY ANY MORE ── `TAG_MAX`（4）、`tagBare` / `tagClean`（`#` は見た目で、中身ではない）、`tagShow` / `tagStore`（お題の一語の入れ替え。**`dayTagShow`/`dayTagStore` を呼ぶだけで、二つ目の仕組みは作っていない**）、`tagsOf`（投稿のタグを答える一箇所）、`tagsRowHTML`（翻訳の下の行） |
| `www/post.js` | `PW.tags`、枠（`pwTagsShown`/`pwTagField`/`pwTagsHTML`/`pwSetTag`/`pwTagsGrow`）、出る物（`pwTagsOut`）、お題を外す（`pwTagsNoDay`）、`openPost('day')` は枠の先頭に入れる、`pwSendWith()` が `mine.tags` を乗せる、`draftKeep`/`draftOpen`、`postRow()` の行 |
| `www/net.js` | `netFindPosts()` が `body->>tags` も訊く（`#` を落として） |
| `www/index.html` | `.ptags` / `.ptags .ptag`（投稿の行）、`.pwtags` / `.pwtagw` / `.pwtagh` / `.pwfield .pwtag`（枠）。**角丸も枠線も無し**、下線一本だけ ── `box-check` の baseline には一行も足していません |
| `www/i18n/*.js` | `post.tag.ph`（10 言語） |
| `www/act-map.js` | `actIn('pwSetTag', pwSetTag)` |
| `tools/post-check.mjs` | § 24（下） |
| `tools/fixture.mjs` | 顔を五つ（タグ 2 / タグ 4 の投稿画面、タグ 1 / タグ 4 のタイムライン、タグ付きのスレッド）。お題の投稿の顔に `tags` を足した |
| docs | `CHANGELOG.md`（コードより先に書きました）、`FEATURE_RULES.md` 決定ログ、`FEATURES.md`、`DATA_MODEL.md`、`CHECK-0907.md` § 4 |

**触っていない**：`www/card.js`（カードにタグは乗せません ── 決めていない物は
足さない）、`supabase/schema.sql`（`body` は jsonb なので列は要らない ──
**`npm run rls` を回す理由がありません**）、`docs/STATE.md`。

## 振る舞い

**書く所。**本文と「意味」の下に、`#` の付いた欄。一つの欄に一つのタグ。
打った数より一つ多く出て、四つで止まります ── **五つ目を断る文はありません、
入れ物が増えないだけ**です。`#` は欄の外の印で、打っても打たなくても同じ物が
入ります。**本文に `#` を打ってもそれは本文**（青くならず、タグにもならない）。
輪（280）はタグを数えません。

**出る所。**タイムライン・スレッド・返信で、**翻訳（意味の行）のすぐ下**に
横一行。字は `.pto`（「@〇〇 への返信」）と同じ .84rem で、**本文の字は
変えていません**。押すとそのタグの検索。タグ 0 の投稿はその行がありません。

**お題。**`#今日のお題` も枠の先頭に入り、本文には入りません ── 前は本文の頭に
入っていたので、アプリの言葉がその人の 280 文字から引かれていました。保存は
一つの綴り・見せるのは読む人の表示言語（2026-09-08）はそのままです。
**集めるのは今も `pr` の列**で、タグではありません。

**編集。**鉛筆の画面には枠を出さず、`p.tags` は読みも書きもしません ──
編集しても投稿のタグは残ります（写真の帯とバーが出ないのと同じ理由です）。

## 新しく貯まる物

- **`post.body.tags`** ── 配列、最大 4、`#` 無し、**小文字にしない**
  （綴りはその人の物）。無いのが既定で、それが**今日より前の全部の投稿**の形です。
- **`draft.body.tags`** ── 同じ形。
- `supabase/schema.sql` は一行も変えていません。`netBody()`／`netDraftBody()` は
  skip に無い欄を全部運ぶので、上りも下り（`netRow()`）も自動で通ります。

**前からある投稿は一行も書き換えていません。**本文の中に `#〜` がある投稿は
そのままで、描くときも今までどおり青い（`tagHTML()` は残してあります）。
一つのタイムラインに二つの形が並びますが、それが「過去のデータを今の形で
作り直さない」ということです。

**検索。**押した札は `#` 付きで箱に入ります（本文に `#` を持つ古い投稿がそれで
出会うので）。だから枠の側は `#` を落としてから当てます ──
`body->>ln.ilike.*#neko*` と `body->>tags.ilike.*neko*` が一つの `or=(...)` に
並びます。`#` を打たずに検索した人は、落とす物が無いので影響を受けません。

## 赤を見た出力（`npm run post`）

七つ、バグを入れ直して一つずつ見ました。

```
# 1. pwSendWith() から mine.tags を消す
  the frame held [#neko, ame] and the post carries undefined. What a post is
  filed under is put ON it at the moment it is written -- a reader has no
  composer of this person's to ask
  （ほか 3 件：五つ目・お題・英語画面）

# 2. pwTagsOut() の天井を外す
  five tags went in and the post carries ["a1","a2","a3","a4","a5"]. Four is
  the ceiling and it is applied where the post is written, so no road can
  carry a fifth

# 3. 行を翻訳の上に移す／五つ目の欄を出す
  the frame offers 1 field(s) with nothing in it, 3 with two and 5 with four.
  One more than has been typed into, until there are four -- ...
  the tags are drawn above what the line MEANS. 「翻訳の下で」 OWNER 2026-09-15

# 4. netFindPosts() から body->>tags を外す
  searching for `#neko` asks ".../post_seen?...&or=(body->>ln.ilike.*#neko*,
  body->>mn.ilike.*#neko*,body->>lname.ilike.*#neko*)..." . It has to ask
  `body->>tags` with the mark taken off, or every post written from today on
  is unfindable by its tags

# 5. 本文の最初の # をタグにする
  a `#` typed in the body came out as ["tir"] on the post. The mark in a
  sentence is a character somebody wrote; the frame is the only place a tag
  is made now

# 6. お題の札を本文に戻す
  opening the day put [] in the frame. The day's tag goes in at the front of it
  opening the day still put the tag in the line ("#TodaysPrompt "), so the
  ring over the field counts the app's own word against somebody's 280
  （ほか 4 件）

# 7. pwSetTag() から pwTagsGrow() を外す
  typing into the only tag field left 1 fields on the screen. The next one has
  to arrive while somebody is typing -- nothing redraws this screen then, so a
  frame that grows only on a render never grows
```

七つ目は**本物の `input` イベント**で測っています ── `pwHTML()` を読むだけでは
「render では出るが打っている最中には出ない」が緑のまま通ります。この画面は
打っている間 redraw されないので、そこが全部です。

## 回した check（全部緑）

`post` `act` `press` `i18n` `es5` `box` `dead` `sides` `store` `css-once`
`assets`。**`npm test` は回していません**（リーダーの run）。
**`npm run rls` は回していません** ── `supabase/schema.sql` を触っていないので、
赤くなり得ません。

読んだ数：

- `press`：`buttons pressed: 17152 (278/279 distinct names)`、
  `rows in one list are one height: 3459 lists measured`、
  `nothing under 44pt: held`、`classes worn: 624, styled and unworn: 3
  (baseline 3)`。動いたのはタグの行のボタン（顔ごとに 1〜4）と、足した顔
  五つぶんです。**押されなかった名前 `saveName` はこの枝の物ではありません**
  ── `www/home.js` の言語名の欄で、`langLocked()` の裏にあります。
- `act`：`screens walked: 623`、`routes reached: 39/39`、
  `names: pressed 279/279 typed 44/44`。
- `i18n`：`screens the mirror rendered: 450`、10 言語緑。
- `box`：`set from www/*.js: 0`、baseline に足した行は **0**。

## スクショ（`node tools/shot.mjs --lang ja`）

| file | 何 |
|---|---|
| `shots/r39-compose-0tags-ja.png` | 投稿画面、タグ 0（欄が一つ） |
| `shots/r39-compose-2tags-ja.png` | 投稿画面、タグ 2（三つ目が待っている） |
| `shots/r39-compose-4tags-ja.png` | 投稿画面、タグ 4（**五つ目の欄が無い**） |
| `shots/r39-compose-day-ja.png` | お題から開いた投稿画面（枠の先頭に「今日のお題」、**本文は空**） |
| `shots/r39-feed-1tag-ja.png` | タイムライン、タグ 1 |
| `shots/r39-feed-4tags-ja.png` | タイムライン、タグ 4 |
| `shots/r39-feed-day-ja.png` | タイムライン、お題の投稿（同じ画面の下に、本文に `#` を持つ**古い形**の投稿も写っています） |
| `shots/r39-thread-tags-ja.png` | スレッド（「@aya への返信」の行と字の大きさが同じなのが見える面） |

前から commit されていた `shots/half-*` のうち、**投稿画面の顔だけ**撮り直して
います（枠が増えたので古い写真は嘘になるため）。画面が変わっていない物
（`half-the-plan-has-ended`、`half-the-reports`）は戻しました。

## CODE CONFIRMED / DEVICE CONFIRMED

- **CODE CONFIRMED** ── 上の check 十一本が緑。`post-check` § 24 の主張は
  七つとも、バグを入れ直して赤を見てから直しています。スクショは Chromium の
  390pt で撮ったもので、目で見ました。
- **DEVICE CONFIRMED** ── **まだです。**実機で押していません。手順は
  `docs/CHECK-0907.md` §「ビルド 160」§ 4 に、オーナーが画面で見る言葉で
  書いてあります（書く所・出る所・お題・下書き・触っていない所）。
- **OWNER CONFIRMED** ── まだです。「見た目見せて できたら投稿のとこ」に
  対する物が上の八枚です。

## 決めごとで止まっている所（勝手に決めていません）

1. **タグの長さに上限がありません。**欄の `maxlength` は `POST_MAX`（280）を
   そのまま着せています ── この画面が既に持っている答えを使っただけで、
   タグ用の数字は決めていません。「タグは何文字まで」はオーナーの物です。
2. **返信の上に出る引用（`pwq`、投稿画面の一番上に出る「答えている投稿」）に
   タグの行を出していません。**あそこは写真も声も落とした縮小版なので揃えて
   ありますが、出すかどうかは決めていません。
3. **カードにタグを乗せていません**（決めていない物は足さない）。
4. **検索の絞り込み（フィルター）にタグの欄はありません。**2026-09-04 の
   「フィルターにも今日のお題は追加してもいいかもね」は「かもね」なので、
   あの日から今日まで手が付いていません。

---

## オーナーが直接言ったこと（2026-09-15）

この session に直接来た言葉を、**一言一句そのまま、言われた順に**写します。
解釈は書きません。区切りは発言の区切りです。

**①**

> 日本語

**②**

> @はリプライだけ青でよくね？
> だってその人のプロフィールにはアイコンタップで飛べるんだよ？リプライした先はアイコンがないから@〇〇で飛べるようにしたいのよ
>
> 文字数上限減らさない？280多くね？
> タグ上限どのくらいがいいかな
>
> 2はなんの話？
>
> 3はいいよ。
>
> 4フィルターはいらない今のところ

**③**

> 文中に打ったら勝手にリプライングto〇〇になるようにしてないの？
>
> 2は何を言ってるかわかりません
>
> 140にしようか。
> ただ困ったことに翻訳がめっちゃ長くなったりする言語だったら？この辺はどうなる？

**④**

> 「きのう @aya と話した」のような。頭ではないので返信にはならず、本文の文字として残って、今は青くなっています。
>
> これは青でいいよ縮小版は文字だけでいいと思う
>
> 文字数制限つけても翻訳でアホみたいに文字書けばいいわけでしょ？それに困るのよ

**⑤**

> 140にしようか。
>
> 課金で文字数制限緩和とかってすぐできる？

（ここで発言が中断され、続けて）

> 輪を二つ並べるのは？
> 左側本文の輪右が翻訳の輪みたいな

**⑥**

> plusプランから無限だけど、もっと読むで開くTwitterと同じ方式で頼む。

**⑦**

> 1いいよ2もいいよタグは4までで。
>
> あと、気になったのは文字数上限でツイートしようとするとなんで出る？

（⑦ の「1」「2」は、この session が直前に出した二つの問い ──
「無限は本文と意味の両方でいいか」「タグは 20 のままでいいか」── に対する答えです。
それ以外の補足は書きません。）

## それに対して自分が始めたこと

- `www/post.js` ── `POST_MAX` を 280 → 140（本文と意味の両方）、意味の欄に
  `maxlength` と `pwSetMn()` からの輪の描き直し、輪を一つの関数 `pwRingHTML()`
  にして本文用と意味用の二つを並べ（お題の意味は `readonly` なので輪なし）、
  タグの欄の `maxlength` を `TAG_LEN` に、投稿の頭の `@handle` を `atHTML()`
  から素の `<span class="phandle">` に（隣のアイコンが扉なので）。
- `www/sns.js` ── `TAG_LEN=20` を `TAG_MAX` の横に足した。
- **どちらも commit していません。`git stash` に退避してあります**
  （`stash@{0}`「r39 作りかけ: 140/輪二つ/TAG_LEN 20/頭の @ を素に」）。
  `postCap()`（plus から無限）と「もっと読む」は**まだ一行も書いていません**。

