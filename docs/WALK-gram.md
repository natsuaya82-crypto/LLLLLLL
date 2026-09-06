# 手で歩いた記録 — 文法・音チーム 2026-09-06

`master`（`de4ad262`）を headless Chromium で人が触るように操作した記録。
コードは直していない。見たことだけを書く。**バグ 3 件、気になる 3 件。**

担当は www/grammar.js www/phases.js www/ipa.js www/numbers.js www/cal.js
www/assist.js www/voice.js。前の人が同じ日に `master` を一周した記録
（`claude/walk` ブランチ）に既にある件は書かない ── 語順の板、Plural の
「n words」が複数形の複数形を作る件、言語のページの ＋、上限の表。

## どう触ったか

`tools/shot.mjs` `tools/press.mjs` と同じやり方で playwright を書いた
（`tools/walkgram/`。ゲートではない）。端末は 402×874、deviceScaleFactor 3、
ポート 8153。`tools/fixture.mjs` の `seed()` を入れ、押すのは実際の click、
指のいるところは CDP の `Input.dispatchTouchEvent`。`page.on('pageerror')` と
`console.error` は全部拾った ── **投げたものは一つも無い。**スクショは
`shots/walk-gram/`（コミットしない）。

**二つ黙らせている。両方とも道具のせいであってアプリのせいではない。**

- `window.netPop=function(){}` — このコンテナに外へ出る網が無いので
  「接続できません」が `#sbg.on` で画面全体を覆い、下のボタンに触れなくなる。
  仕様どおりの動き（前の人の記録と同じ）。
- `window.netSaveNow=function(d){d(true)}` — 網が無いと `netSaveNow()` が
  false を返し、どの画面の［保存］もバッファを均さず画面も戻らない。規則 11
  のとおりで**アプリが正しい**。ただしその状態では保存が何をするのか一切
  見えないので、電波があることにして押した。

**これを入れる前に一度まちがえた。**「規則を書いて保存したのに、戻るを押すと
もう一度『打ったものを保存しますか』と訊かれる」と読んだが、`netSaveNow()` が
false を返していただけで、電波があればちゃんと均されて前の画面へ戻る。
**下に書いたものは全部、二つを黙らせた状態でもう一度確かめたものだけ。**

## バグ（再現手順が書けるもの）

| # | プラン | 画面 | 操作 | 起きたこと | 期待 | スクショ |
|---|---|---|---|---|---|---|
| 1 | 全部 | 文法の段 →「make it」(`form:slot:<段>/<枠>`) | 枠を押して単語シートを開き、綴りを打つ | **画面のどこにも［追加］も［保存］も無い。**戻るを押すと何も訊かれず、打った単語は消える。`wdAddOn()` は true（＝ボタンがあれば金色に光る状態）で、`spWord(wEdit.sp)` は `vess` を返している | 辞書の「新しい単語」(`form:add:`) と同じくバーに `addOne` が出る | `24-slot-sheet-no-add.png` |
| 2 | plus / pro | 単語 → 編集 →「Reading」(`spell`) | 音の札を一つ押す | **`#app` の中身が 1 バイトも変わらない**（前後とも 11165 文字、文字列として同一）。読みは書き換わっている。戻った単語シートもまだ古い読みを出す。［保存］して開き直して初めて新しい読みが出る | 押した札が読みに入ったことがその場で見える | `71-spell-pressed.png` / `76-reading-reopened.png` |
| 3 | 全部 | 文法の章（規則を持つ章）→「Add a rule」 | ＋を押して開いた規則シートで何も打たずに戻る | 空の規則 ❷ が章に残る。行には番号と「On the end」だけが出て、付ける文字が無い。`STG.fm` にも書かれていて、サーバーへも上がる | 何も打たずに出たら規則は残らない（または空の規則を作らせない） | `02-pl-empty-rule.png` |

### 再現手順

**1.** 文法（`gram`）→ 一覧の「Yes, no, hello」（`stOpen ["greet"]`）→
「yes ／ make it」（`openSlot ["greet","yes"]`）→ 綴りの欄（`#wd-ln`）に
`vess` と打つ。画面上の `data-do` は `back` `sayPh` `wdMnOpen` `wdDelMn`
`go(pos)` `openSub` `go(reg)` `go(relate)` ×2 `wdExOpen` とタブだけで、
`addOne` も `keepPress` も無い。戻ると `WORDS` は 11 のまま。
free / plus / pro で同じ。

`www/phases.js:445` の `openSlot()` は `openForm(route, label, html, mount)` の
四引数で呼んでいる。辞書側の `openAdd()`（`www/wordsheet.js:78`）は同じ
`openForm` を `..., function(){...}, wdSaveBtn())` と**五引数**で呼ぶ。この
五つ目がバーの［追加］。段から開いた方にはそれが渡っていない。

同じ道は月・曜日・数の段にもある（`openSlot ["month","January"]` など）ので、
暦の言葉と数詞も段からは作れない。

**2.** 辞書 → `kano` → ［編集］→「Reading /kano/」の行（`go ["spell"]`）→
音の札を一つ（`spAdd ["t"]`）押す。押す前と後で `document.getElementById('app')
.innerHTML` が同一。`wEdit.sp` は変わっている。戻ると単語シートはまだ
`/vess/`（`/kano/`）を出し、［保存］して開き直すと `/vesst/` になる。
辞書の行も `vess /vesst/` になる。free にはこの行が無い（`openEdit` は free
でも開くが、Reading の行が出ない）。

**同じ押下が、古い形の単語では見出し語そのものを書き換える。**`kano` は
`ph:['k','a','n','o']` を持ち `sp` を持たない単語で、開くと
`sp=[{l:'',u:'ka'},{l:'',u:'no'}]` になる ── どの位置にも文字が付いていない。
`spAdd` は `wdSetRd(spPh(sp).join('')+sym)` を呼び、`wdSetRd` は文字列を
位置に配り直すので `ka|no` が `k|anot` になる。位置に文字が無いと
`spWord()` は `u` を並べるので、見出し語が `kano` から **`kanot`** に変わる。
［保存］すると辞書の行が `kanot` になり、`findWord('kano')` は null になる。
アプリで作った単語（位置に `lt.v` などが入っているもの）ではこれは起きず、
最後の位置に `u:'st'` が付くだけ。

**3.** 文法 → 「Plural」(`gram:v2:pl`) →「Add a rule」（`fmrNew ["n","pl"]`）。
シートが開いた時点で `STG.fm` はもう 2 件になっている
（`www/wordsheet.js:964` の `fmrNew()` が `fmRules().push(r); saveStg();` を
してから `openFmr()` を呼ぶ）。何も打たずに戻ると章に ❷ の行が残る。
その規則は文字を付けないので「N words」を押しても語は増えない。
消すには［Select］→ 丸 → ゴミ箱 →「Delete this rule?」まで行く。

## 気になる（仕様かどうかはこちらでは決められない）

| # | プラン | 画面 | 見たこと |
|---|---|---|---|
| A | 全部 | 文法の一覧 | **2「noun」と 32「Particles」が同じ三つの枠を出す。**どちらも `doer ／ done to ／ given to` で、押すのはどちらも `openSlot ["part","subj"]` など同じ関数。章の方の名前は `posLabel('n')` なので「noun」としか出ず、助詞の話だとは書いていない（`g2Nouns()` は `stBy('part')` の枠を読んでいる）。`81-chap-v2-n.png` / `80-stage-part.png` |
| B | 全部 | 文法の段 4 つ | 23「Tense」24… ではなく **`gram:verb`（Tense）`gram:noun`（Plural）`gram:have`（Belonging）`gram:polite`（Politeness）は中身が無い** ── 副題と「The rule ／ Lines ／ NOTES」だけで、押せるものは 4 つ（戻る・保存・規則・例文）。`have` は副題も無いので「Belonging ／ 保存 ／ The rule」の三行だけになる。`80-stage-have.png` / `80-stage-verb.png` |
| C | 全部 | 自分で作った段 | **課金が切れた瞬間にその段のページに立っていると、ページが黙って文法の一覧に入れ替わる。**バーは「Grammar」＋［保存］のままで、一覧が本来出す章番号「III」が消える。何が起きたのかは画面に一行も無い。`SET.plan` を手で `'free'` にして確かめた（アプリの中に課金を落とす道は無い）ので、**押して出した状態ではない。**`60-own-stage-lapsed.png` |

## 正しく動いたことの記録

- **文法の全画面が描ける。**`gramArgs()` の 35 引数＋一覧を free / plus / pro
  の三回、108 画面。例外 0、`#app` が空になったもの 0、`pageerror` 0。
- **形容詞の章の入れ替え**（`gram:v2:adj`）。`kano mos` の札を一つ押して
  もう一つを押すと `mos kano` になり、`STG.gpos.adj` が `before` になる。
  もう一度やると戻る。別の画面へ行って戻っても残っている。
- **規則の削除。**［Select］→ 行の丸 → バーにゴミ箱が出る →「Delete this
  rule?／Delete／Close」（`popAsk`、標準ダイアログではない）。
- **段の規則の欄。**打って［保存］でトースト無しに前の画面へ戻り、`STG.rules`
  に入る。開き直すと打ったものが出る。打って保存せずに戻ると
  「Save what you have typed?／Yes／No」が画面の中に出る。
- **基数の上げ下げ**（`ltset:num`）。10→12 で数字の枠が二つ増え、
  一番上に線を引いてから 12→10 に下げると、**線を引いた 11 は残り**、
  空の 10 だけが消える。2 まで下げても引いた分は残る。`51-digits-lowered.png`
- **基数と段が合っている。**基数 12 で「Numerals」の段は「One to 12」になり
  枠が 12、一覧の行も `0 / 13` になる。月は 12・曜日は 7 で動かない。
- **自分の段。**◉＋ →「Evidentials」と三行 →［Add］でトースト
  「Evidentials added」、一覧に 36 番として出る。開くと三つの枠と
  ［Delete section］がある。free に落とすと一覧から消えて
  「1 hidden ／ Upgrade」になり、`STG.extra` は残っている。
- **音の表。**文字 → 音のシートで、その文字が既に読んでいる記号を押すと外れ、
  別の記号を押すと文字に付いて `SND` にも入る（`asOrder` で IPA 表の順に
  並べ直される）。グループの開閉、検索、`?` の説明ページ、どれも動く。
- **一つの音が二つの文字に付いているときの削除の拒否**は押せていない
  （fixture の 27 文字が a〜z を読んでいて、宙に浮いた音が無い）。
