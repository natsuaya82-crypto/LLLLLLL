# r38-about ── 「この言語について」が一生「通信中」だった

ブランチ `claude/r38-about`（`integ-0905` = `8a48c6d6` から）。
**取り込むのはサブリーダー／リーダー。全ゲート（`npm test`）は回していません。**

## 何を見ていたか

オーナー、実機 159（= `master` 8a48c6d6、2026-09-15 21:33 JST）：

> 設定→言語 の自分の言語 → この言語について（route `about`、`vAbout()` →
> `wldPage()`、`www/home.js`）が**一生「通信中」で進まない**。

158 では出ていなかった。同じ 159 で 設定→言語 は 1 本になり、「言語を追加」も
**新規登録も通った**。

## 原因は読まずに押して測った

偽サーバーを立てて実機の道をそのまま歩かせた（`netTook()` から。`acct-check` の
`arrive()` の近道は使っていません）。四つの形を測りました。

**① サーバーに自分の `language` の行が「ある」account** ── 通る。

```
PROBE after door  {"langId":"srv-lang-1","LMINE_known":true,"LANG_WAIT":false,
                   "LPUB":{"srv-lang-1":1},"wldPubKnown_of_open":true}
PROBE about body  {"waiting":false,"h1":"テスト語"}
```

**② 行の答えが遅い（2.5 秒）account** ── 通る。答えが着いた所で記事に変わる。

```
PROBE about, opened while the answer is out  {"waiting":true,  "LPUB":0,"known":false}
PROBE +3.2s (answer landed at 2.5s)          {"waiting":false, "LPUB":1,"known":true}
```

**③ 行が一本も無い account（＝新規登録）で、行の POST が遅い** ── **止まる。**

```
PROBE about, opened while the answer is out  {"waiting":true, "LPUB":0,"known":false}
PROBE +3.2s (answer landed at 2.5s)          {"waiting":true, "LPUB":0,"known":false}
PROBE +6.2s                                  {"waiting":true, "LPUB":1,"known":true}
PROBE +11.2s                                 {"waiting":true, "LPUB":1,"known":true}
PROBE after a render() of its own            {"waiting":false,"LPUB":1,"known":true,"h1":"Untitled"}
PROBE after leaving and coming back          {"waiting":false,"LPUB":1,"known":true,"h1":"Untitled"}
```

**読みどころは +6.2s と +11.2s の行です。**`known: true` ── 答えは**もう手元に
ある**。それでも画面は待ちの丸のまま。他の画面を経由して `render()` が一度走ると、
そこで初めて記事が出る。**人は待つ画面の前で待っているので、それは起きない。**

**④ 古い版の slice 鍵をディスクに持っている端末** ── 通る（その言語は
`langHeld()` が真なので行が上がり、答えが書かれる）。

## 原因 ── 一行

**この画面が待っている答えを書く道は三つあり、書いたあとに画面へ知らせるのは
二つだけだった。** 知らせないのは `netLangRow()` ── **行を作る道**で、
**新しい account はそこしか通らない**。

道を全部書くと：

1. `about`（自分の言語）は `wldOpen().here()` = `wldPubKnown(langId)` を待つ
   （`www/home.js` § LPUB、「まだ聞いていない」は「公開」ではない、の三つ目の状態）。
2. `LPUB` に書く道は三つ。`netLangsWalk()`（一覧が降りる ── 呼び手の `pullRun`
   が render する）、`netLangPublic()`（公開スイッチ ── 自分で render していた）、
   `netLangRow()`（行を作る ── **誰にも知らせない**）。
3. 新規登録した account はサーバーに `language` の行が無い。`langForAcct()` が
   一本 mint する（`langMint()`）。
4. mint された言語について何かを答えるものは、**行を上げる POST の返事しか無い**
   ── `netLangsDown()` の答えは既に「無い」で返っている。
5. 返事は着き、`wldPubGot(key, true)` が答えを書き、画面は知らされない。

**r36 も r37 も原因ではありません。**どちらも触っていない所です。159 で初めて
出たのは、r36 が「サーバーの答えが来るまで数えない・決めない」を入れて、
**新規登録した account が「行が一本も無い」状態を正しく通るようになったから**です
── それまでは端末の索引から数が出ていたので、この道の先に人が立つことが
ありませんでした。穴は前からそこにありました。

## 直した形 ── patch ではなく rewrite

**「答えが着いたら画面に知らせる」を道ごとに憶えるのをやめ、答えが着く一箇所が
言う。** `wldPubGot()`（`www/home.js` § LPUB）が、記録した答えがこのアプリの
持っていなかったものである時に `render()` します。条件を足したのではなく、
三箇所に書かれていた一つの文を一箇所にしました ── `CLAUDE.md`
§ One place, not fifteen。**四つ目の道が明日できても、忘れられません。**

`netLangPublic()` の `render()` はそれを二度言うことになるので**外しました**
（残すと「どちらが知らせているか」が分からなくなる ── § Simple）。

**「答えが変わった時だけ」**なのは `netLangsWalk()` のためです：あれは行ごとに
一つ書くので、既に持っている答えを書き直すたびに描き直すのは無駄です。
`wldPage()` は開いている言語の `langName`（グローバル）を見るので、walk の途中で
描いても名前が一瞬「未設定」になるようなことはありません（読んで確かめました）。

**r36・r37 の設計は崩していません。**`LMINE`・`langHeld()`・`langMineIds()`・
`netLangsGone()`・`pullForget()` は一行も触っていません。

## 変えた file

| file | 何 |
|---|---|
| `www/home.js` | `wldPubGot()` ── 答えが新しい時に `render()`。なぜここなのかの節 |
| `www/net.js` | `netLangPublic()` の `render()` を外した（二度言っていた） |
| `tools/acct-check.mjs` | claim **77** ── 行の答えを手で握って離し、離した時に画面が描かれるかを問う |
| `docs/CHANGELOG.md` | 2026-09-15 の節。保存される物は変わらないので DELETE REVIEW は無し |
| `docs/CHECK-0907.md` | 「ビルド 160」── 実機で見る場所 |
| `docs/scope/r38-about.md` | これ |

**`www/index.html`・`docs/STATE.md`・`www/core.js`・`www/sns.js`・
`tools/fixture.mjs`・`tools/page-check.mjs` は触っていません**（原因がそこでは
なかったため）。

## 保存される物の変化 ── 無し。DELETE REVIEW は要りません

`LPUB` は記憶だけで、ディスクにもサーバーにも無い（規則 22）。鍵は一つも増えず、
一つも消えません。人の作った物には触れていません。

**振る舞いは変わります**：自分の言語の「この言語について」は、サーバーの答えが
着いたその時に描かれる。前は、答えが着いた後も画面を出入りするまで丸のままでした。

## 赤を見たか ── 見ました

claim 77 を**バグを入れたまま**走らせた出力：

```
✗ 77: **答えが着いたのに「この言語について」が待ちの丸のまま** ──
      wldPubKnown() は真、画面は snswait。答えを書いた道が画面に知らせて
      いません（www/home.js § wldPubGot）

acct-check: 1 件。
```

症状（「丸が回っている」）ではなく**原因を名指しします** ── 答えは記録されたか／
画面は知らされたか、を別々に問うので、次に同じ形で壊れたとき読む人が道を
辿らずに済みます。時間ではなく**順番**で測っています（行の答えの callback を
握っておいて、測りたい所で離す）。

## 回した check（単体のみ。全ゲートは回していません）

| check | 結果 |
|---|---|
| `acct` | **緑** ── 77 込み。赤を見てから直した |
| `again` | **緑** |
| `dl` | **緑** |
| `plan` | **緑** ── ただし下記 |
| `migrate` | **緑** ── r37 の 7f 込み |
| `page` | **緑** ── `routes walked: 39 (3 drawn by a named function, 27 drawn inline)` |
| `press` | **緑** ── `buttons pressed: 16798 (278/279 distinct names)` |
| `es5` | **緑** |
| `dead` | **緑** ── 2270 functions / 541 top-level vars / 12 capabilities |

**`press` の数は r36・r37 の報告と一バイト違いません**（16798、`278/279`、
`never pressed (1) saveName`）。押せる物を一つも動かしていない、というのが
この一致の意味です。

**`plan` について正直に書きます。**六回走らせて**一回赤**、五回緑（exit 0）。
**赤くなった二行を取り損ねました** ── tail しか見ておらず、二回目以降は緑
だったので出力が残っていません。`docs/STATE.md` 2026-09-12 の節に
`plan-check` の「the launch after it asks again」が固定待ちで機械が混むと
赤くなる、と書かれており（r33 が直し中）、それと同じ揺れである可能性が高いと
**思っていますが、確かめていません**。`CLAUDE.md` は「flake は原因ではない」と
書いているので、**緑だったと書くのではなく、一回赤かったと書きます。**

## CODE CONFIRMED / DEVICE CONFIRMED

- **CODE CONFIRMED** ── 上の九本。77 は赤を見てから直しました。
- **DEVICE CONFIRMED ── ありません。**実機では一度も押していません。
- **OWNER CONFIRMED ── ありません。**

**見た目 ── 三枚。**「この言語について」は状態が二つあるので、両方撮りました
（`CLAUDE.md`「両方を見せる」）。前後の二枚は probe の harness から、実機と
同じ道（新規登録 → 扉 → すぐこの画面）で撮っています。

| 写真 | 何 |
|---|---|
| `shots/about-own-answer-in-before-ja.png` | **バグを入れたまま。**答えが着いて 5 秒後、丸のまま ── オーナーが見ていた画面 |
| `shots/about-own-answer-in-after-ja.png` | **直した形。**答えが着いたその時に記事（新しい言語なので「Untitled」と「概要」一節） |
| `shots/about-ja.png` | 言語のある端末の同じ画面 ── **変わっていません** |

`tools/shot.mjs` からは「待っている側」に立てません（fixture は答えの着いた
端末から種をまくので）。`tools/fixture.mjs` に面を足せば撮れますが、それは
`press` の数が動く変更で、**r37 の報告がリーダーへ挙げている同じ項**なので
手を出していません（下）。

## リーダーへ ── 三つ、判断か持ち場の外

1. **行が上がらなかったときは、まだ丸のままです。**電波が無い・サーバーが
   断った場合、その言語について答えるものが何も無いので `about` は待ち続けます。
   そこに何を出すか（「接続できません」を出すのか、記事を出して公開の状態だけ
   伏せるのか、［再接続］を置くのか）は**振る舞いの決めごと**で、
   `CLAUDE.md` § Deciding に従って手を出していません。規則 11 の
   「失敗して黙って消えるのは仕様ではない」と、規則「説明を書かない」の間の
   判断です。
2. **`www/sns.js:829` の一語は、まだそのままです。**r37 がリーダーへ挙げた
   `pullOn('mylangs', askLangs, langMineKnown)` ── `PULL_GOT['mylangs']` と
   `LMINE` が同じ問いの二つ目の記録である件。**今回の原因ではありませんでした**
   （測って確かめてあります：③ の probe で `PULL_GOT.mylangs` も
   `langMineKnown()` も真、食い違っていない）ので、触っていません。判断が要る
   一点は r37 の報告のままです。
3. **`netLangRow()` の二つの出口は、行について何も記録せずに `ok()` します**
   ── `langRowUp(key)` が既に真の枝（409 で戻ってきた時に通る）。読んで見つけた
   だけで、**押していません**。今回の道では当たりません（行がサーバーに在るなら
   `netLangsDown()` の答えに入るので `LPUB` は埋まる）。`netLangsWalk()` が
   `language` の行を六つの列に開く唯一の場所であるのに対し、`netLangRow()` の
   POST 成功は同じことを手書きで三つだけやっている ── **行をアプリに読み込む
   場所が二箇所ある**、という形です。直すなら POST に行を返させて
   `netLangsWalk()` に渡す形ですが、それは保存の道に触るので一件として立てる
   ものだと思います。**推測なので、そう書いておきます。**
