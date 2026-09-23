# r61-face — 自作文字で文を出す仕組みと、SET を決める所（r46-audit § B1・B2・B4）

土台は `integ-0905`。r46 はコードを読んだだけだったので、一件ずつ測ってから直した。
測り方はどれも、本物のアプリを headless Chromium で起こし、`tools/fixture.mjs` の `seed()` を
入れて、その上で関数を呼んで画面と値を読む（網は `netGet`/`netPrefsPut` だけ差し替え）。

## B1 自作文字で文を出す仕組み ── r46 の読みは正しく、測ると悪かった

`sh` と打った字（合字）と `a` だけを描いた言語で、自作文字オン。

| 測ったもの | 値 |
|---|---|
| LinguaScript の `s` 単独の幅（40px） | 27（点線の箱＝一マス）。serif の `s` は 16、描いていない `x` は 20（落ちる） |
| `sfontHTML('has')` | `h<span class="sfont">a</span>s` ── h・s はローマ字のまま |
| 辞書の一覧 `.hw` | 要素全体が LinguaScript。`has` が「箱—箱」（shots/r61-b1-words-before.png） |
| 単語のページの頭 `.whw` | 中は `sfontHTML()` だが、外の `html[data-script="on"] .whw` が span の外の h・s も LinguaScript にして「箱—箱」（shots/r61-b1-word-before.png） |

三つのうち二つ（要素ごとの `data-script` 規則と `sfontHTML()`）は同じこと ──「保存された
語を自作の字で出す」── を別の答えでやっていた。**一つに書き直した**：`data-script` の属性と
CSS を消し、語は `sfontHTML()` だけが出す。字間 0 は `.sfont` 自身が言う。

三つ目の `.tfont`（LinguaType）は**別のこと**なので触っていない：入力欄で、Lingua キーボードが
打った私用領域の字だけを描き、システムキーボードのローマ字はローマ字のまま
（「システムキーボードで打ったものが勝手に自作文字になるのはおかしい」）。投稿の一行（`.pline`）も
同じ LinguaType で、ルール 8 がそれ。`numbers.js` の数字（`<span class="tfont">`+`inkChar()`）は
投稿の一行と同じ道。

同じ問いに二つ目の答えを出していた `wdRdShown()`（「頭がローマ字以外を出しているか」を
`myFontOn()` に訊いていた）も `sfontRuns()` に訊く形に書き直した。描ける字が一つも無い語で、
頭と同じつづりが二度並んでいた（shots/r61-b1-rd-*）。

検査：`line-check` 7。全ルート（`PAGES` をページから訊く）と全単語のページで、LinguaScript が
掛かった文字ノードを数え、どの文字も `sfontRuns()` が描けると言う字であること。と、単語の
ページの頭の下の行が頭と同じ文字を繰り返さないこと。どちらも直す前のコードで赤を見た。

## B2 `SET.myfont` を決める所が三つ ── 読みどおり

スイッチでオフ → 字を一つ保存 → `SET.myfont` は `true`、`netPrefsPut()` がその `true` を送って
いた（`geKeep()`、`a5f23c30` 2026-08-04、オーナーの「単語に自作文字出てこない」をセッションが
「描いたらオン」と読んだもの）。書かれた仕様（`CLAUDE.md`「SET.myfont is off until somebody
turns it on」、2026-08-11 に書かれた）に合わせて消した。`geKeep()` の `netPrefsPut()` はそのためだけに
あったので一緒に消した。直した後：オフのまま、送られるのはスイッチの一回だけ。

残した書き手は `setMyFont()`（スイッチ）と `obDone()`（オンボーディングの最初の一字。まだ誰も
スイッチに触れていない瞬間）。

## B4 同じ項目を複数の場所が書く

`www/` の中の `SET`・`ME` への書き込みを全部数えた（`delete` と丸ごとの代入を含む）：
`writes-check` の最後の行が数を出す。二つ以上の関数が書く項目を一つずつ読んだ。

- **`SET.ui`**：`obLang()` と `setUi()` が一字一句同じ関数。`obLang()` を消した。
- **空の `ME`**：`wipeHere()` が手で書いた形が `meBlank()` とずれていた（`uid` が無い）。`meBlank()` を呼ぶ。
- **`SET.showScript`**：`pkKeepSave()` と `obTakeCh()`、どちらも借りた字を選んだ瞬間。スイッチが
  無く、`false` にする所も無いので、上書きされる人の決定が存在しない。表に理由を書いて残した。
- **`SET.walked`**：四つとも「歩きが終わった」の `true`（移行・最後の一歩・扉・言語の削除）。
- **`ME.name`/`ME.handle`**：`meKeepPut()`（本人の編集）、`obWhoGo()`（作ったアカウントに送って
  届いた値）、`obIn()`（サインインの時のサーバーの答え）。下の「止めたこと」の一つ目。

検査：`writes-check`（新、FAST）。二つ以上の関数が書く項目は、その関数と「別の瞬間である
理由」が表に要る。表と現実がずれたら両方向で落ちる。`geKeep` の書き込みを戻して赤を見た。

## 止めたこと（持っていないファイルが要る）

1. **サインインの後、自己紹介・リンク・場所が次の起動まで来ない。** `netGet` を差し替えて
   自己紹介の入ったプロフィールを返させ `obIn()` を呼ぶと、`ME.name`・`ME.handle` は入り、
   `bio`・`link`・`loc` は空。「サーバーのプロフィールを ME に置く」が `netMyProfile()`（`av`
   だけ）・`obIn()`（名前と @ だけ）・`netProfSync()`（五つ、起動時）の三か所に割れている。
   覆う形は `netMyProfile()` が `PROF_MINE` 全部と `av` を置く一か所になり、`obIn()` の
   `ME.name=…; ME.handle=…` を消すこと。前半が **www/net.js（r60）**。後半だけ先にやると
   名前が消えるので、onboard.js はそのまま。
2. **`wipeHere()` の手の一覧（`delete SET.acct/saved/savedUp/notAt`）は継ぎ当て。** 測った：
   `SET.acct` がこの人なら `lsWipeAcct()` が全部消していて、手の一覧は何もしない。`SET.acct` が
   無い設定（印が付く前）では手の一覧が四つ消し、**検索履歴 `recent` は残る**（外すと四つとも
   残る）。覆う形は `lsWipeAcct()` が印の無い設定をどう扱うかで、**www/core.js（r60）**。
   それが入ったら settings.js の二行を消す。`writes-check` の表にその旨を書いてある。
3. **phases.js:1067** の `stSlotRow()` が `<span class="psw">'+esc(w.hw)+'</span>'`。
   `data-script` の規則を消したので、ここの語は今ローマ字で出る（前は要素ごと自作書体で、
   合字の部品は箱）。`esc(w.hw)` を `sfontHTML(w.hw)` にする一行。phases.js は誰の割り当てにも
   無いので触っていない。
4. **`askSaved()`（www/sns.js）** は端末の保存検索を一度だけサーバーへ渡す道を持っている
   （`SET.savedUp`）── § A と同じ形。r60 へ。

## 決めていないこと（オーナーの）

- **オンボーディングで字を描かずに進んだ人**が、後で字を描いても語は自作文字にならない。
  スイッチを入れれば出る。8/4 の「単語に自作文字出てこない」はこの道で、その時入った強制
  オンを外したので、この道は 8/4 より前に戻る。既定をどうするか（例えば「まだ誰も決めて
  いない」を三つ目の状態にするか）はオーナーの決めること。
- **`wOut()`**（home.js）は自作文字がオンなら借りた文字を使わない。字ごとに描くようになった
  今、描いていない字は借りた文字でなくローマ字で出る。どちらが先かはオーナーの決めること。

## 測りかけ

- `spTypeField()`（letters.js:1396）のコメントは「つづりの欄は本人の字で」と言うが、欄は
  `.tfont`（私用領域だけ）で、値は字の名前（ローマ字）なのでローマ字に見えるはず。新しい語の
  欄に私用領域の字を二つ入れて `render()` すると欄が空になった（`wEdit.sp` には二字ある）。
  私の測り方（フォームを開いたまま `render()`）の産物かもしれず、結論を出していない。

## 検査の外の古い文

`tools/css-snap.mjs`（コメント）、`tools/verify-script.mjs`（実験、`data-script` を読む）、
`tools/font-spike/README.md` は `data-script` を今のこととして書いている。どれも持っていない。
