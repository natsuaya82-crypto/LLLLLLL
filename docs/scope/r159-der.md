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
