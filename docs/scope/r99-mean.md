# r99-mean ── 意味のオン・オフは丸いトグル、意訳は欄の中身の字

ブランチ `claude/r99-mean`（integ-0905 から）。決定: `docs/FEATURE_RULES.md` § 2026-09-26 意味のオン・オフは丸いトグル。

## 触ってよい
- `www/post.js` ── 投稿画面の意味の欄・切り替え・`pwMn()`・`pwSetMn()`・`pwSetLn()`・`openPost()`・`draftOpen()`・`postEdit`/`pwSaveEdit()` の意味の行・`pwSend` の `mn` の行。r98 が持つ `postSend`・`postTake`・`postCountsPull`・`postDel*` は触らない。
- `www/index.html` の投稿画面の節（`.pwmnrow`・`.pwmnsw`）だけ
- `www/i18n/*.js`、`www/act-map.js`
- `tools/post-check.mjs`、`tools/marks-check.mjs`、`tools/fixture.mjs`（tl-check は r98 が触っているので使わない）
- `docs/CHANGELOG.md`、この文書、`shots/r99-*.png`

## 触らない
それ以外すべて。schema.sql は r98。

## 報告（2026-09-26）

**CODE CONFIRMED のみ。実機未確認。OWNER 未確認。**

- A `73b61997` 意味の切り替えは `.pwmnsw` の中に `swtHTML()`（設定画面と同じ `.swt`）。字は `aria-label` だけ。`.pwmnsw.on` の字の色は消した。新しい部品なし、i18n の変更なし（`post.mn.sw` は aria-label で使う）。
- B `e15f587a` 意訳（`pwMn()`）は意味の欄の中身の字。「手を入れたか」は `PW.mh` 一つ（`pwSetMn()` が立てる、`pwMnKept()` が下書き・編集の意味から割り出す、`pwMnFollow()` を投稿・返信・引用・下書きが訊く）。お題は今のまま。送る時の `pwMn()` の後付け（`pwSendWith`・`pwSaveEdit` の二か所）は消した。
- C `post-check` m1–m5 を足し、四つのバグ（追いかけない／手を見ない／送る時に足す／字の切り替え）を戻して赤を見た。`marks-check` に「`aria-pressed` のボタンは `.swt` を着る」を足した ── 前の規則は送信・共有などの**動詞**の字しか見ないので「意味」は引っかからなかった。字の切り替えを戻して FAIL を確認、今は 159 の on/off が全部スイッチ。
- 回した物: FAST 全部、post-check、marks-check、tl-check（r98 の物、触らず走らせただけ）── 緑。press・act・i18n などは回していない（fixture に顔を二つ足したので press の数は動く）。
- 絵: `shots/r99-toggle-on.png`・`r99-toggle-off.png`（＋kb336）、`r99-mean-app.png`（意訳が入った欄、＋kb336）、`r99-mean-hand.png`（直した後に一行を打ち直しても残る、＋kb336）。

### 決定と食い違う所（リーダーへ）
1. **欄が空でトグルがオンの時**: 前は送る時に `pwMn()` が付いていた（「意味が空の投稿は無い」）。今は決定どおり「欄の中身そのもの」なので、人が意味を消して送ると意味は空で上がる（`nm` の印は無い）。決定ログの「Affected data: 今も同じ」は正確には違っていた。空で上げてよいかはオーナーの物。
2. 意訳が中身になったので、意味の欄の上限（リング・`postCap`）に意訳の字も数えられる。前は後付けで上限の外だった。
3. 下書きを開き直した時、意味が今の意訳と同じか空なら「アプリの字」に戻る ── 人がわざと空にして保存した下書きは、開くと意訳で埋まる。新しい印を保存しない代わりの形。
4. 決定ログの「Implementation status: 未」は持ち物外（`docs/FEATURE_RULES.md`）なので直していない。

## 追加（2026-09-26 リーダーから）: スレッドの投稿の本文と意味を長押しでコピー

決定: `docs/FEATURE_RULES.md` § 2026-09-26 投稿の本文を長押しで選んでコピーできる。

触ってよいに足す物:
- `www/post.js` の線より上（作る側）に `copy` のイベント一つ（`postRow()` は触らず、`.post.pfoc` を CSS で選べるようにする）
- `www/glyph.js` の貼り付けの読みの所（`puaTyped()` の横）だけ
- `www/index.html` の選べる所の一行（`.post.pfoc .pline`・`.pmn`）
- `tools/post-check.mjs`（検査）、`shots/r99-copy-*.png`

### 追加の報告（`db38a61e`）── CODE CONFIRMED のみ、実機未確認

- 選べるのはスレッドで開いた投稿（`.post.pfoc`）の本文と意味だけ。コピーの中身は `postCopy()` 一か所（`copy` のイベント）。
- 字は外へはいつもローマ字のつづり。自分の投稿で開いている言語の物は、字の **id** を `text/x-lingua-cut` で横に付け、
  `puaPaste()`（glyph.js）が欄への貼り付けで `puaField()` に戻す。私用領域の字（番号）はクリップボードに乗らない ── 規則 13 は破っていない。
  規則 8: `postCopy()` は線より上（作る側）に置き、`postRow()` 以下は何も変えていない（sides-check 緑）。
- 検査 post-check c1–c6、六つのバグで赤を確認（うち一つは検査の穴 ── 他人の投稿を別の言語にしていた ── を直してから赤）。
- 絵: `shots/r99-copy-mine.png`・`r99-copy-them.png`（選んだ状態。iOS の取っ手とメニューは Chromium では写らない）。

知っておくこと:
1. **他の人の投稿**は、どの自作文字がつづりのどこかを投稿が持っていない。だから自作文字の入った語を半分選ぶと、その語のつづり全部が入る。字の単位で切るには、投稿に字ごとのつづりを載せる（保存する物が増える）しかない ── オーナーの物。
2. iOS の WKWebView が独自の型（`text/x-lingua-cut`）を同じアプリ内の貼り付けに返すかは、実機で確かめるまで分からない（WebKit は同じ origin に返す作り）。返さなければ、自分の投稿も貼るとつづりの字になる。
3. 投稿画面の欄から Lingua キーボードの字を選んでコピーすると、私用領域の字がそのまま出る（前からの形、今回の持ち物の外）。
