# 手で歩いた記録 — 単語チーム（2026-09-06）

`master` (de4ad262) を headless Chromium で人が触るように操作した記録。コードは
直していない。見たことだけを書く。担当は辞書まわり — `www/words.js`
`www/wordsheet.js` `www/import.js` `www/reading.js`。

前の人が全体を一周した記録（`origin/claude/walk` の `73ed4a35`）にあるものは
書いていない。

## どう触ったか

`tools/shot.mjs` / `tools/press.mjs` と同じやり方で playwright を書き、ポート
8150 で `www/` を出して `tools/fixture.mjs` の `seed()` を入れた。端末は
402×874、deviceScaleFactor 3。押すのは本物の `mouse.click`（要素を画面の
まん中まで送ってから、その要素の上の点を押す）。`window.netPop` は空にした
（このコンテナには外へ出る網が無く、「接続がありません」が画面全体を覆う。
仕様どおりでバグではない）。`pageerror` と `console.error` は拾った
（出たのは `ERR_CONNECTION_RESET` / 404 / `ERR_TUNNEL_CONNECTION_FAILED` の
三つだけで、どれも網が無いことによるもの）。
スクショは `shots/walk-words/`（コミットしない）。

**最初にこれで一度まちがえた。** 押したい行が画面の外にあると
`mouse.click` は別の場所を押す。「下位分類を押しても何も起きない」と読んだのは
道具のせいで、送ってから押したら正しく動いた。以下の記録は全部、送ってから
押している。

## 二回測った

最初に歩いたのは `master` の de4ad262。書き終えたあと `master` が f04c8444
（`claude/pos` の取り込み ── 品詞・語域・下位分類の行を行全体で押せるように
する）まで進んだので、それを取り込んでから下の 13 件を全部押し直した。
**13 件とも同じことが起きる。** 下位分類の件（#1）はちょうどその取り込みが
触った画面だが、選んだものが入らないのは変わっていない。

## バグ（再現手順が書ける）

| # | プラン | 画面 | 操作 | 起きたこと | 期待 | スクショ |
|---|---|---|---|---|---|---|
| 1 | free/plus/pro 共通 | 単語の編集シート（`form:edit:<語>`） | 下位分類の行を押す → 一覧から一つ選ぶ | シートに戻るが下位分類は「None」のまま。`wEdit.sub` は変わらない。保存ボタンも灰のまま。トーストも何も出ない。「None」を押して外すのも、「New subclass」で新しく作るのも同じで、一つも入らない | 選んだ下位分類が入る。新規単語のシート（`form:add:`）では同じ操作が正しく入る | `11-subclass-not-taken.png` |
| 2 | free/plus/pro 共通 | 単語の編集シート | つづりの欄だけを書き換えて［戻る］ | 何も聞かれずに戻り、書き換えは消える。保存ボタンも灰のまま金にならない | 他の欄（意味・タグ・語源・メモ）はどれも金になり、戻る時に「保存しますか」を聞く。つづりだけ聞かれない | `08-save-grey-after-spelling.png` / `09-save-gold-after-note.png` |
| 3 | free/plus/pro 共通 | 新規単語のシート（`form:add:`） | 意味の欄と例文の欄に打ち込んで、Enter を押さずに［追加］ | 打った意味と例文は捨てられ、単語は「no meaning」で入る。同じ画面のメモ・語源・タグは打っただけで入る | 同じシートの欄が同じように扱われるか、捨てるなら捨てると言う | `06-add-meaning-lost.png` |
| 4 | free/plus/pro 共通 | 単語の編集シート／下位分類のシート／派生語のシート | 戻る矢印の `aria-label` を読む（画面に字は出ない。読み上げが読むのはこれ） | 「Build」。実際の戻り先は編集シートなら単語のページ、下位分類のシートなら編集シート、派生語のシートなら編集シート | 戻り先の名前。辞書は「Profile」、単語のページは「Lexicon」、新規単語のシートは「Lexicon」、語域のページは「kano」と、他は全部戻り先を言っている | 画面に出る字ではないのでスクショなし |
| 5 | plus/pro（読みの画面は `can('snd')`） | 単語の読みの画面（`spell`） | 音のタイルを一つ押す | 画面が何も変わらない。上の `/vora/` も動かない。押した音は `wEdit.seq` にだけ入っている | 押した音が読みに足されて見える | `23-reading-before.png` / `24-reading-after-pressing-a.png` |
| 6 | plus/pro | 同上。**CSV で取り込んだ単語**、または綴りに文字が付いていない単語 | 読みの画面で音を一つ押す → 戻る → ［保存］ | 単語の名前が変わる（`vora` → `voraa`）。戻ったシートは最後まで `vora` と表示していて、綴りの欄も `vora`、保存ボタンも灰。押した瞬間に別の語になる | 読みを触っても綴りは動かない（`vSpell` の上のコメントがそう書いている）。アプリの中で作った単語（`sp` に文字が付いている）では正しく読みだけが変わる | `25-sheet-still-says-vora.png` / `26-saved-as-voraa.png` |
| 7 | free | 検索の画面（`find`）の「Import from CSV」 | 押す → CSV を貼る → ［Next］→［Import］ | free のまま最後まで通り、単語が三つ入る。設定 → データの同じ行は「You need to upgrade to use this feature」で止まる（`can('data')` は free で false） | 二つの入口が同じ答えを出す | `15-import-on-free.png` / `16-settings-import-gated.png` |
| 8 | plus/pro | 文法の章（例 `gram:v2:pl`）の「4 words」 | 続けて何度も押す | 押すたびに 4 語増え、ボタンの字は「4 words」のまま変わらない。規則が作った語にもう一度同じ規則がかかり、四回押すと `kano` → `kanok` → `kanokk` → `kanokkk` → `kanokkkk` になる（`from` が一つ前の形を指す） | 一度押したら数が減るか、規則が作った形にその規則がまたかからない | `14-nwords-repeats.png` |
| 9 | 全部 | 取り込みの終わりの画面 | 一語だけ取り込む | 英語で「1 words in」。文字を一つだけ入れたときは「1 letters into the alphabet」 | 一語のときの言い方。この二つは `t()` で、他の数の出る所（`4 words`、`1 already here`）は `tn()` を通っている | `15-import-on-free.png` |
| 10 | free | 検索の画面 →［Import from CSV］→「Letters」に切り替えて取り込む | `za, z` `qu, q` `xi, x` を貼って［Letters］→［Import］ | free で `LETTERS` が 39 → 42 に増える。文字の一覧の「hidden」は 4 → 7 になり、増えた三つはそのまま上限の裏に入って見えない。`can('letters')` は free で false | free は a-z と `!` `?` と数字だけで、足すことも消すことも改名もできない（CLAUDE.md「無料版は何か」） | `35-free-alphabet-grew.png` |
| 11 | plus | 取り込みで上限（1000）に当たったとき | 1100 行を貼って［Import］ | 「989 taken, 0 coined — **Free** is full」と出る。プランは plus | 自分が使っているプランの名前 | `31-plus-cap-says-free.png` |
| 12 | 全部 | 辞書の選択モード | 一つだけ選んで［Delete］ | ポップが「Delete 1 words?」 | 一語のときの言い方 | `28-bulk-delete-ask.png` |
| 13 | free/plus/pro 共通 | 単語の編集シート | 何か変えて［戻る］→ ポップの［Yes］ | 保存はされる（「kano updated」）が、画面は編集シートのまま動かない。［No］を押したときは戻る | Yes でも戻る。`keepAsked()` の上のコメントは「Yes writes and then goes; No lets the typing go and goes anyway」と書いてある | `40-yes-stays-put.png` |

### 再現手順

**#1 下位分類が入らない**
1. 辞書 → `kano` を押す → ［Edit］。
2. 「Subclass」の行を押す。一覧が出る（noun なので Common / Proper / …）。
3. 「Proper」を押す。編集シートに戻る。
4. 「Subclass」は「None」のまま。`wEdit.sub` は `''`。
5. 動詞でも同じ。`tir`（すでに 他動詞）で「自動詞」を押しても 他動詞 のまま、
   「None」を押しても 他動詞 のまま。
6. 「New subclass」で名前を打って Enter しても、編集シートに戻るだけで入らない。
7. 新規単語のシートで同じことをすると正しく入る（`form:add:` で品詞を verb に
   して 他動詞 を押すと「Subclass 他動詞」になる）。
8. 呼ばれた順を測った（`wdSetSub` と `openEdit` を包んで記録した）。押すと
   `wdSetSub("Proper")` → `openEdit(kano)` の順に走る。品詞と語域はページ
   （`pos` / `reg`）で、下位分類だけがシート（`form:wsub`）である。

**#2 つづりだけの書き換えが黙って消える**
1. 辞書 → `kano` → ［Edit］。
2. つづりの欄を `kanoo` にする。右上の保存は灰のまま（`keepDirty()` は false）。
3. ［戻る］。何も聞かれずに単語のページに落ちる。`WORDS` の中は `kano` のまま。
4. 同じ画面でメモの欄に何か打つと保存は金になり、［戻る］で「保存しますか」の
   ポップが出る。
5. なお灰のままの保存ボタンを押すと、つづりの書き換えはちゃんと保存される
   （押せない見た目で押せる）。

**#3 Enter を押していない意味と例文が捨てられる**
1. 辞書 → ［New word］。
2. つづりに `zima`、意味の欄に `a hill`、例文の欄に `zima tir` と
   `the hill is seen`、メモの欄に `a note` を打つ。どれも Enter は押さない。
3. ［Add］。トーストは「Added, with one form」。
4. 入った単語は `{"hw":"zima","mns":[],"mn":"", "nt":"a note"}`。単語のページは
   「WHAT IT MEANS / Add a meaning」（＝意味なし）で、例文の節は無い。
   メモだけ入っている。

**#4 戻る矢印の読み上げの名前**
1. 辞書 → `kano` → ［Edit］。
2. 戻る矢印の `aria-label` は「Build」。押すと `form:word:kano` に落ちる。
3. 下位分類のシート（`form:wsub`）と派生語のシート（`form:add:<語>`）も「Build」。
4. 他は戻り先を言っている — 辞書「Profile」、単語のページ「Lexicon」、
   新規単語のシート「Lexicon」、語域のページ「kano」。

**#13 Yes を押しても戻らない**
1. 辞書 → `kano` → ［Edit］。メモの欄に `a note` と打つ。保存が金になる。
2. ［戻る］。「Save what you have typed?」／［Yes］／［No］。
3. ［Yes］。トーストは「kano updated」でメモは保存される。画面は
   `form:edit:kano` のまま。
4. 同じところで［No］を押すと、打った字は捨てられて `form:word:kano` に戻る。
5. ポップの外を押すとポップだけ閉じて編集シートに残る。


**#5 / #6 読みの画面**
1. `plus` で 検索 →［Import from CSV］→ `vora, to run, verb` を貼って
   ［Next］→［Import］→［Done］。
2. 辞書 → `vora` → ［Edit］。シートの「Reading」は `/vora/`。
3. 「Reading」の行を押す。読みの画面が開き、上に `vora` と `/vora/`。
4. 「a」のタイルを押す。**画面は一つも変わらない**（`/vora/` のまま）。
   `wEdit.seq` は `voraa` になっている。
5. ［戻る］。シートの綴りの欄は `vora`、「Reading」の行も `/vora/`、
   保存ボタンは灰。
6. ［保存］。トーストは「voraa updated」。辞書の中の語が `voraa` になる。
7. アプリの中で作った単語（`zima`）で同じことをすると、綴りは動かず最後の
   位置の読みだけが `aa` になる（正しい）。違いは `sp` の各位置に文字
   （`l`）が付いているかどうかで、CSV から来た語と fixture の `kano` は
   付いていない。

**#7 free で取り込みが通る**
1. `SET.plan='free'`。
2. 検索の画面（`find`）の下の「Import from CSV」を押す。
3. `zima, a hill, noun` などを貼って［Next］→［Import］。
4. 「3 words in」。辞書に三語入っている。
5. 設定 → データ の「Import from CSV」は同じ free で
   「You need to upgrade to use this feature」のポップになる。

**#8 「4 words」**
1. `plus` で `gram:v2:pl`（Plural の章）。規則は `-k`、名詞につく。
2. 「4 words」を押す。「4 words made」。`kanok` `sark` `tirork` `tirokk`。
   ボタンの字は「4 words」のまま。
3. もう一度押す。「4 words made」。`kanokk` `sarkk` `tirorkk` `tirokkk`。
4. 四回で `kano` の系列は `kanokkkk` まで伸びる。


**#10 free で文字が増える**
1. `SET.plan='free'`。文字の一覧を開く。「Alphabet 24」「4 hidden」。`LETTERS` は 39。
2. 検索 →［Import from CSV］。
3. `za, z` / `qu, q` / `xi, x` を貼って［Next］。
4. 上の「IMPORT INTO」を「Letters」に切り替える。列の見出しが
   Character / Sounds / Name に変わる。
5. ［Import］。「3 letters into the alphabet」。
6. `LETTERS` は 42。文字の一覧は「Alphabet 24」のままで「7 hidden」になる。
7. plus で同じことをすると `qu` `xi` `za` が一覧に並んで見える。

**#11 plus なのに Free**
1. `SET.plan='plus'`。1100 行の CSV を貼って［Next］→［Import］。
2. 「989 words in」の下に「989 taken, 0 coined — Free is full」。

## 気になる（仕様かどうかはこちらでは決められない）

| # | プラン | 画面 | 見たこと |
|---|---|---|---|
| A | 全部 | 単語の編集シート | 保存ボタンが灰（＝変えていない）のときも押せて、押すと保存される。何も変えずに押すと「kano updated」と出て `up` の時刻だけ動く |
| B | 全部 | 取り込みの列を割り当てる画面 | 列の役目（Spelling / Meaning / …）が `<select>` で、iPhone では下から出る標準のホイールになる。この画面以外では品詞も語域も形も「別のページで選ぶ」形になっている |
| C | 全部 | 単語を消したあと | 基となる語を消すと、その語から作られた語は残り、`fm`（`pst` など）を持ったまま `from` だけ外れる。単語のページからは「Past」の字が消えて「verb」だけになる。データは消えていない |
| D | 全部 | 単語の編集シート・新規単語のシート | 意味と例文は Enter を押さないと入らない（バグ #3）。編集シートでも同じで、意味の欄に打って［保存］を押すと「sar updated」と出るのに意味は増えていない |
| E | 全部 | 新規単語のシート | ［Add］を素早く二回押すと、単語は一つしか入らない（正しい）が、二回目が同じ位置に現れた［Edit］に当たって編集シートまで進む。［Delete word］を二回押した場合はポップの外側に当たって閉じるだけで、消えはしない |

## 二度続けて押した記録

各画面を毎回 seed から作り直し、`#app` の中の `data-do` を持つものを
**間に画面を作り直さずに二回続けて**押した。free / plus / pro の三回、
辞書一覧・単語のページ・編集シート・新規単語のシート・取り込みの五画面、
166 個。

- 例外を投げたもの: **0**
- `#app` が空になったもの: **0**

（`press-check` は押すたびに画面を作り直すので、この並びは通らない
道である。CLAUDE.md 十四章。）

## 正しく動いたことの記録

- 辞書の並び替え（Alphabetical / By part of speech）、絞り込み（13 品詞＋
  「no meaning」）、下位分類での絞り込み（品詞を選んだあとにだけ出る）、
  品詞をもう一度押して下位分類を外す — 全部正しく動いた。
- 検索。つづりでも意味でも引ける。大文字（`TIR`）でも引ける。前後の空白は
  無視される。当たらないときは「Nothing found」。× で消えて全部戻る。
- 単語の追加。つづりだけ、つづり＋意味、重複（「That word already exists」で
  増えない）、空（「A spelling needs two letters or more」）。規則が作る形も
  一緒に入る。
- 意味の＋ → 打つ → Enter で入り、× で消える。順番も正しい。
- 品詞と語域は選べば入り、保存ボタンが金になる。
- 単語の改名（つづりを変えて［保存］）→ トースト「kanoo updated」、
  戻った先も `form:word:kanoo` で、消えた名前の画面には落ちない。
  続けて二度改名しても正しい。すでにある語の名前にしようとすると
  「That word already exists」で止まり、空にすると
  「A spelling needs two letters or more」で止まる。どちらも辞書は動かない。
- 単語の削除。ポップは「Delete sar?」、［Delete］で消えて辞書に落ちる。
  ［Close］なら何も起きない。基となる語を消しても派生語は残る。
- 改名すると派生語の `from` が全部ついてくる（`tir`→`tirr` で四語とも）。
- 派生語（Derive a word）。「A word from kano」のシートが開き、
  ［Add］で `from` の付いた語が入る。
- 同義語・反対語。選ぶと両方の語に書かれ、もう一度押すと両方から消える。
  相手の単語のページからも見える。
- 選択モードの一括削除。ポップの数は合っていて、［戻る］で選択は消える。
- 取り込み。CSV・TSV・JSON・ただの単語の並び、どれも列を読めている。
  すでにある語は既定で「Skip」、「Overwrite」に切り替えると上書きされ、
  ［Undo］で元の意味まで戻る。
- 上限。free は 100 でちょうど止まり（150 行貼ると 89 語入って
  「Free is full」）、plus は 1000 でちょうど止まり、pro は 1100 行そのまま入る。
- 規則の編集（`form:fmr:<id>`）。足す文字を打つと `STG.fm` に入り、
  「On the front / On the end」も入る。戻ると章の行に反映される。
- 単語のページの「Make the form this word has not got」。
  `kano` で押すと `kanok` が一つできて「1 word made」。
