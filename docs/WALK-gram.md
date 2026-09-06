# 手で歩いた記録 — 文法・音チーム 2026-09-06

`master`（`de4ad262`）を headless Chromium で人が触るように操作した記録。
コードは直していない。見たことだけを書く。

担当は www/grammar.js www/phases.js www/ipa.js www/numbers.js www/cal.js
www/assist.js www/voice.js。前の人が同じ日に `master` を一周した記録
（`claude/walk` ブランチ）に既にある件は書かない ── 語順の板、Plural の
「n words」が複数形の複数形を作る件、言語のページの ＋、上限の表。

## どう触ったか

`tools/shot.mjs` `tools/press.mjs` と同じやり方で playwright を書いた
（`tools/walkgram/`。ゲートではない）。端末は 402×874、deviceScaleFactor 3、
ポート 8153。`tools/fixture.mjs` の `seed()` を入れ、押すのは実際の click、
指のいるところは CDP の `Input.dispatchTouchEvent`。`page.on('pageerror')` と
`console.error` は全部拾った。スクショは `shots/walk-gram/`。

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
| 1 | 全部 | 文法の段 →「make it」(`form:slot:<段>/<枠>`) | 枠を押して単語シートを開き、綴りを打つ | **画面のどこにも［追加］も［保存］も無い。**戻るを押すと何も訊かれず、打った単語は消える。`wdAddOn()` は true（＝ボタンがあれば金色に光る状態）で、`spWord(wEdit.sp)` は `vess` を返している | 辞書の「新しい単語」(`form:add:`) と同じく `addOne` のボタンが出る | `24-slot-sheet-no-add.png` |
| 2 | 全部 | 文法の章（規則を持つ章）→「Add a rule」 | ＋を押して開いた規則シートで何も打たずに戻る | 空の規則 ❷ が章に残る。行には番号と「On the end」だけが出て、付ける文字が無い。`STG.fm` にも書かれていて、サーバーへも上がる | 何も打たずに出たら規則は残らない（または空の規則を作らせない） | `02-pl-empty-rule.png` |

### 再現手順

**1.** 文法（`gram`）→ 一覧の「Yes, no, hello」（`stOpen ["greet"]`）→
「yes ／ make it」（`openSlot ["greet","yes"]`）→ 綴りの欄に `vess` と打つ。
画面上の `data-do` は `back` `sayPh` `wdMnOpen` `wdDelMn` `go(pos)` `openSub`
`go(reg)` `go(relate)` ×2 `wdExOpen` とタブだけで、`addOne` も `keepPress` も
無い。戻ると `WORDS` は 11 のまま。free / plus / pro で同じ。

`www/phases.js:445` の `openSlot()` は
`openForm(route, label, html, mount)` の四引数で呼んでいる。辞書側の
`openAdd()`（`www/wordsheet.js:78`）は同じ `openForm` を
`..., function(){...}, wdSaveBtn())` と**五引数**で呼ぶ。この五つ目が
バーの［追加］。段から開いた方にはそれが渡っていない。

**2.** 文法 → 「Plural」(`gram:v2:pl`) →「Add a rule」（`fmrNew ["n","pl"]`）。
シートが開いた時点で `STG.fm` はもう 2 件になっている
（`www/wordsheet.js:964` の `fmrNew()` が `fmRules().push(r); saveStg();` を
してから `openFmr()` を呼ぶ）。何も打たずに戻ると章に ❷ の行が残る。
その規則は文字を付けないので「N words」を押しても語は増えない。
消すには［Select］→ 丸 → ゴミ箱 →「Delete this rule?」まで行く。

## 気になる（仕様かどうかはこちらでは決められない）

（作業中）

## 正しく動いたことの記録

（作業中）
