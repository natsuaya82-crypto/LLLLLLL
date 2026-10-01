# r159-der ── 派生の規則で作る形も、元の語のページに出すだけ

ブランチ `claude/r159-der`（`integ-0905` から）。決定: `docs/FEATURE_RULES.md` § 2026-10-01
「派生の規則で作る語も、元の語のページに出すだけ（一覧に勝手に足さない）」。原因の測定: `docs/scope/r156-wordbugs.md`。

## 一つの文
**規則が作るのは形で、語ではない ── どの種類の規則でも。** 語の形は `wForms()` 一か所が答え、規則の形は
そこで聞かれた時に作られ、どこにも書かれない。派生（`FM_DER` の 12 種と自分の `d~` ラベル）を活用と分けて
「語として書く」道は全部消す。

## 規則の形を語として書いていた道（数えた）
1. 新しい単語の画面の保存 ── `addWrite()` → `addFmWrite()`（`addFmSync()` が作る `addFms`）。画面の
   「規則で作る形」の欄（`addFmHTML`・`addFmSet`・`addFmDrop`）はこの書き込みの下書き。
2. 語のページの「この語に無い形を作る」ボタン ── `fmrTodoHTML()` → `fmrAdd()` → `fmrTodo()`。
3. 文法の章の一括ボタン（`fmrAddAll`）── 既に消えている（gramlang-check 99-102 が持つ）。
4. 規則を足す・保存する（`fmrSave` 系）── 語を書かない（読んだ）。
5. 取り込み（`www/import.js`）── 表の行を語にするだけで、規則は使わない（読んだ）。
6. 文法の章の表（`www/grammar.js` の表）・翻訳エンジン（`gFmRules()`・`GFM_DER`）── 書かない（読んだ）。
1 と 2 が残っていた二つ。`fmrWord()` はその二つだけの物。

## 触る物
- `www/wordsheet.js` ── `wForms()` の規則の段から「活用だけ」の条件を外す。1・2 の関数を全部消す
  （`addFms` 一式・`addFmWrite`・`fmrTodo`・`fmrAdd`・`fmrTodoHTML`・`fmrWord`）。呼び手
  （`addWrite`・`addDone`・`openAdd`・`wdSetLn`・`wdFormHTML`・語のページ・`addOne` の通知）。`fmInf()` の注釈。
- `www/phases.js` ── `addFmClear()` の呼び一行。
- `www/act-map.js` ── `addFmDrop`・`addFmSet`・`fmrAdd`。
- `www/index.html` ── 使われなくなる `.fmmks`・`.fmmkf`・`.fmmk .lnin`・`.fmmk .mnx`。
- `www/i18n/*.js` ── 使われなくなる `fmr.todo`・`fmr.made`・`fmr.off`・`fmr.with`（各 .1）。
- `www/grammar.js` ── 消える `fmrTodo()` を名指す注釈だけ。
- `tools/forms-check.mjs`（形を持つ検査）・`tools/del-check.mjs`・`tools/word-check.mjs` の名前。
- `docs/CHANGELOG.md`・この文書・`shots/r159-*.png`。偽になる文の docs。

## 触らない物
- 既に辞書にある派生の語（`fm`・`from`・`mns` 空）── 消さない・書き換えない・移さない。`wIsForm()` は今のまま
  （古い活用の語だけが形として読まれ、古い派生の語は語のまま一覧と家族と系統図に出る）。
- 手で作る派生の語（「〜から作る」`addFrom` と語形 `fm` の選択）── 人が打った語で、規則の物ではない。
- 翻訳エンジン・文法の章・語源の系統図のコード。CLAUDE.md。ゲート全体は回さない。

## CLAUDE.md（リーダーが直す）
- 今のところ無し（CLAUDE.md は派生を語として書くとは言っていない）。

## 報告（2026-10-01）── CODE CONFIRMED のみ
- **一つの文にした所**: `wForms()` の規則の段から `fmInf()` の条件を外した。規則の形はラベルの種類に関わらず形。
- **消した道**: 1（`addFmSync`・`addFmWrite`・`addFmHTML`・`addFmBoxHTML`・`addFmPaint`・`addFmSet`・`addFmDrop`・
  `addFmClear`・`addFmDraft`・`addFms` 一式）と 2（`fmrTodo`・`fmrAdd`・`fmrTodoHTML`）、二つだけの `fmrWord`。
  文言 `fmr.todo`・`fmr.made`・`fmr.off`・`fmr.with`（10 言語）、CSS `.fmmks`・`.fmmkf`・`.fmmk .lnin`・`.fmmk .mnx`。
- **前から偽だった一文**: `www/grammar.js` の文法の表の注釈「規則が作った語は表から外す（`fmrTodo()` と同じ理由で）」──
  `g2FmTable()` は外していない（読んだ）。一文を消した。動きは変えていない。
- **語源の系統図**: `etyKids()` は `WORDS` の `from` だけを読む。これからの規則の派生形は語でないので出ない。既にある
  派生の語は出る。系統図は派生の語が語であることに頼っている画面だが、壊れはしない（出る物が減るだけ）── 止めずに報告。
- **オーナーに見てほしい所（決めていない）**:
  (a) 語のページの見出しは「活用」のまま、その下に「指小 tamok」が出る（`word.fm.inf`）。派生も入る見出しの言葉はオーナーの物。
  (b) 形の画面でラベルを選び直す一覧（`vFm` の `#`）は活用のラベルだけ。指小の行を押して形を打ち替えて保存はできるが、
  手で派生のラベルを新しく選ぶことはできない。
  (c) 既にある派生の語の親のページでは、同じラベルの規則の形（形の一覧）と、その語（派生の行）が両方出る。
  (d) 派生の形もカード・キーボードの変換・投稿の意味の行に、活用と同じに出る（`wForms()` を聞く所全部）。
- **持つ物**: `tools/forms-check.mjs` 5（6 行）。赤を見た: 直す前の `www/wordsheet.js` に戻して 4 行が赤
  （欄が 1 行・2 語足された tamok・規則の形が無い・形の一覧に無い）、戻して緑。既にある派生の語の 2 行は、`addWrite()` に
  `fm:'dim'` の語を落とす一行を入れて赤を見て、戻した。最初の版の「ページに出る」は古いコードでも緑（家族の行も `.wdrow`）
  だったので、形の一覧の行（`openWfm`）に絞った。
- **回した**: FAST 19 本・`forms`・`act`・`word`・`i18n`・`gramlang`・`gen`・`press`（23723 押し、294/299 の名前、
  着られないクラス 2＝基準 2）。ゲート全体は回していない。
- **写真**: `shots/r159-before-1..3`・`shots/r159-after-1..3`（新しい単語の画面・保存後の一覧・語のページ）。
- **データ**: 新しく貯まる物無し。既にある派生の語は触らない。移行無し。端末は要らない（見た目の確認はオーナー）。
