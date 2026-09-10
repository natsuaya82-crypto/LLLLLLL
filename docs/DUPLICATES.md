# 同じ要素なのに直書きされているもの

最初に数えた日 2026-09-03（枝 `claude/dup`）。**この版は 2026-09-04 の
`master` `d7e5a436` と枝 `claude/pop` に対して読み直したもので、閉じた分は
一行に畳んであります。**

オーナーの言葉:

```
同じボタンは共有して使用すればいいのに直書きで書いてるだろだからこう言うことが起きてる
その他の同じ要素なのに直書きなのたくさんあるやろ
こう言うのもルールで禁止してるから無くすように
```

CLAUDE.md § One place, not fifteen と、規則 21 がこれです。

## この一覧の読み方

番号は動かしません ── 指示や報告が「7番」で指しているので、閉じても
番号は空けずに残します。各行の頭に今の状態が書いてあります:

```
  閉じた    一箇所になっている。どこが一箇所かと、訊き直す一行を書いてある
  半分      一箇所は作った。持ち主の違うファイルにまだ直書きが残っている
  開いている 手が付いていない
  待ち      直し方がオーナーの決めごと。ここでは決めない
```

**確かめ方**: 状態はすべて、この版を書いた日に `master` と枝の上で
grep して読み直したものです。行番号は書きません（次のコミットでずれるので）
── 代わりに**訊き直す一行**を書いてあります。

---

# 一部 ── 危ない順に並べた二十一件

## 1. 右上の決定ボタンが三通り。一つは色が付かない ── **閉じた**

`navdo` / `navq navdone` / `navq navsave` の三通りが一つになりました。
`.navsave` はどの stylesheet にも無く、文字を描く画面の保存だけ灰色でした。

```
grep -rn "navsave\|navdone" www/*.js     いま出るのは、そうだったと書いた注記だけ
```

## 2. 言語のスライスを読む並びが五箇所、書く並びが三箇所 ── **閉じた**

`SLICES`（`www/core.js`）が `rd` と `wr` を持つようになり、読む側も書く側も
そこを回ります。アカウントを消したあとに前のキーボードと土地が残る穴も
一緒に塞がっています。

```
grep -n "rd:function\|wr:function" www/core.js | wc -l    スライスの数と合う
```

## 3. 検索の箱が六箇所。×で消せるのは三つだけ ── **閉じた**

箱が一箇所になり、×は全部の箱に付きました。

## 4. `.scin` が同じ表に二回 ── **閉じた**（`min-height:44px` は残っている）

## 5. 目印のチェックが 1770 行 離れて二回 ── **閉じた**

## 6. 写真の書き出しの品質が二通り。0.72 と 0.82 ── **閉じた**

顔写真も `POST_PICQ` になりました。`www/me.js` に、なぜ揃えたかが一行あります。

## 7. 語数の上限の訊き方が二通り。シートを閉じる方と閉じない方 ── **閉じた**

OWNER 2026-09-04「全部1枚目みたいにポップ出して背景変えずに」。
**閉じる road を消しました**（`docs/FEATURE_RULES.md` の決定）。
`www/wordsheet.js` の五箇所は一字も違わず `if(capStop(n)) return;` です。

```
grep -n "capStop\|capOK" www/wordsheet.js      capOK は出ない
```

**持っている検査はありません。**`plan-check` は `capStop()` を直に呼ぶので、
呼び側が先にシートを閉じても緑のまま通ります。`tools/plan-check.mjs` に
「上限のポップを出した後も同じ画面に立っている」を足すのが本筋です。

## 8. プラン画面への行き方が二通り。片方はシートを閉じない ── **閉じた**

**一箇所は `go('plans')` です。**二つ目の名前だった `goPlans()`
（`www/wordsheet.js`）と `act-map.js` の行を消し、`DO('goPlans')` を書いて
いた五箇所 ── `www/settings.js` `www/words.js` `www/keyboard.js`
`www/phases.js` `www/sound.js` ── を `DO('go', ["plans"])` にしました。
`www/wsys.js` にあったのは注記だけです。前の版がこの一覧に挙げていた四つの
うち二つ（`settings.js` `words.js`）は数え落としで、五箇所ありました。

**巻き添えが一つ ── `tools/kb-check.mjs`。**
`out.freeNoUpsell = vKb().indexOf('goPlans') < 0` と、`helpGoNames` の
`.filter(n !== 'goPlans')` が名前で書かれていました。名前を消すと前者は
**バグを戻しても緑**になり、後者は何にも当たらない除外 ── `box-check` が
「腐った baseline は許可になる」と言うあれです。主張の方を残して書き直しました:
無料のキーボード画面のどの control も `go` を `plans` で言わない、と
**描いたものに訊きます**。バグ（`vKb()` に `go plans` のボタンを足す）を
戻して赤を見てから直しています。除外は消しました。

```
grep -rn "goPlans" www/ tools/          何も出ない
npm run kb                              「no Upgrade stands under it」
```

## 9. 上限の警告ボタンが四箇所。うち一つだけ形が違う ── **閉じた**

**一箇所は `capWarnHTML(text)`（`www/shell.js`）です。**`www/words.js`
`www/phases.js` `www/sound.js` `www/home.js` の四箇所を消しました。文は
画面のもの（「あと N 語です」と「N が表示されていません」は違う事実）、
ボタンは違います。

**四つ目の余白なしは消えました。**`capBanner()`（目次）に
`margin:14px 0 0` が付き、他の三つと同じ位置に立ちます。**目次だけ見た目が
変わり、残り三つは一バイトも変わりません**（スクショで前後を比べました）。

```
grep -rn "capwarn" www/*.js      www/shell.js の一行だけ
```

**押せるボタンは動きません。**`npm run press` は `buttons pressed: 15687`
で据え置きです。

**この四つはどの walk も通りません。**上限に届いた状態が
`tools/fixture.mjs` に無いので、`press` も `act-check` も `shot.mjs` も
この四つのボタンを一度も描いていません。写真は面を四つ足して撮り、
**足した面は commit していません** ── 面を足すと `buttons pressed` が動き、
この枝が「動かないこと」で示している他の番号が読めなくなるからです。
**恒久的に足すかはリーダーの決めごとで、`docs/BACKLOG.md` にありません。**

## 10. 「まだ何も無い」の空表示が九箇所 ── **閉じた**

**一箇所は `emptyBox(text, sub, more, bad)`（`www/shell.js`）です。**残って
いた五箇所 ── `www/sns.js`（`snsNone` `snsNoneFo` と凍結の表示）`www/me.js`
`www/notes.js` ── を寄せ、`www/mod.js` の `.mnone` 六箇所も同じ箱にしました。
`.mnone` の CSS 二行は `www/index.html` から消えています。

**引数は三つ増え、三つとも呼ぶ人がいます**（誰も通らない枝は作っていません）:

```
  sub    二行目（.empty .es） ── メモの一覧と、凍結されたタイムライン
  more   その下に入る markup ── 凍結の異議申し立てリンク一箇所
  bad    同じ箱を「読めなかった」の側で言う ── 通報と運営の三箇所。
         赤は www/index.html に既にある .bad が付ける（CSS は足していない）
```

**通報と運営の画面だけ見た目が変わります。**`.mnone` は余白 24px・書体も
大きさも継承でしたが、`.empty` は 54px・見出しの書体・1.3rem。他のどの画面
とも違って見えていたのが、同じになりました。前後のスクショ:

```
  shots/dup10-reports-none-before-ja.png    通報が無い
  shots/dup10-reports-none-after-ja.png
  shots/dup10-reports-error-before-ja.png   通報が読めなかった（赤）
  shots/dup10-reports-error-after-ja.png
  shots/dup10-recovery-none-before-ja.png   復旧、見つからない
  shots/dup10-recovery-none-after-ja.png
  shots/dup10-recovery-error-before-ja.png  復旧、読めなかった（赤）
  shots/dup10-recovery-error-after-ja.png
```

**残り五箇所は一バイトも変わりません。**`www/sns.js` `www/me.js`
`www/notes.js` は同じ markup を組み立てます（`npm run press` は
`buttons pressed: 15687` で据え置き）。

`www/sns.js` の `.empty.snswait` は寄せていません ── 中身が文ではなく
回っている印で、「まだ何も無い」ではなく「まだ答えが来ていない」という
別の状態だからです（`snsWaitHTML()` の注記がその理由を書いています）。

**`.mnone` の六箇所と、赤い三つは、どの walk も通りません。**
`tools/fixture.mjs` に `MODERR` も `ADREC_ERR` も `admin.rec.none` も無い
ので、写真は面を五つ足して撮り、**足した面は commit していません**（9番 と
同じ理由）。

```
grep -rn "mnone" www/                  注記一行だけ
grep -rn 'class="empty' www/*.js       shell.js の箱と snswait だけ
```

## 11. 単語の行が一つの関数の中で二回 ── **閉じた**（`wEntryLines()`）

## 12. 通報の画面のエラーと空が二回 ── **閉じた**

**一箇所は `modListHTML(rows)`（`www/mod.js`）です。**`vMod()` と `vAdmin()`
が書いていた四行を消しました。共有していたのが `modRow` だけで、その**周り**
の一覧が二回書かれていた、というのが元の姿です。

三つの状態は三つのまま残っています ── 読めなかった・答えは来たが空・行。
「空」と「読めていない」は枝を分けたままです。

**返り値は一字も変わりません**（`npm run press` は `buttons pressed: 15687`
で据え置き）。`page-check` も緑 ── `modListHTML` が返すのは本体だけで、
`<div class="view">` は `vMod()` `vAdmin()` が巻くので、13番 で一度やり直した
「一箇所にしたらページ全体を返していた」形にはなっていません。

```
grep -n "modListHTML" www/mod.js      定義一つと呼び出し二つ
npm run page
```

## 13. 言語の記事の Edit ボタンが二回 ── **閉じた**

`wldFrame(body, ed, mine)`（`www/home.js`）。`wldPage()` の二つの出口が
囲みと右上の Edit と本体を一字も違わず書いていました。

**一度やり直しています。**最初の形は `<div class="view">` から `</div>` まで
**ページ全体**を返していて、それで `page-check` が赤くなりました ── あの検査が
見るのは「その route が返した文字列そのものを返した、いちばん内側の関数」なので、
`wldFrame` が `about` の描き手になり、**一つの route を二つの関数が描いている**
と出ます（規則 21）。いまは帯と本体だけを返し、`<div class="view">` は
`wldPage()` が巻きます。**一箇所にするとき、返すものがページ全体になっていないか
見ること。**返り値は一字も変わりません。

```
npm run page
```

## 14. handle から id を引き当てるのが二回 ── **開いている**

`www/net.js` の `netBlock` と `netFollow`。同じ問い合わせと同じ後始末が
1100 行 離れて二回。**その片方の上に「in the one place that has to」と
書いてあります。****`www/net.js` は別のセッションのものです。**

```
grep -n "in the one place that has to" www/net.js
```

## 15. 写真を縮める計算が二回 ── **閉じた**

**一箇所は `postShrink(url, cap, ok)`（`www/post.js`）で、上限は引数です。**
`postThumb`（`POST_THUMB`）と `pwPicKeep`（`POST_PIC`）の中の計算を消しました。
k も丸めも canvas も `POST_PICQ` も同じで、違っていたのは定数だけでした。

**答えは三つで、二つではありません** ── 二つに畳むと失敗の扱いが変わります:

```
  out   JPEG
  ''    canvas が拒んだ ── 呼び側は言う（batch でも止まる）
  null  写真が読めなかった ── batch は次へ進む
```

`whole`（上限の内側だった）は呼び側が読みます。小さい写真に小さい写しは
作らず、上げる方は同じ大きさでも焼き直します（JPEG でないかもしれないし、
`POST_BYTES` に収めるのが `POST_PICQ` だから）。

**`post-check` が押さえるのは半分でした。**小さい写しの側（`POST_THUMB`）は
二つの主張が持っていましたが、**composer が KEEP する方の上限は誰も訊いて
いませんでした** ── `pwPicKeep` に `POST_THUMB` を渡すバグを入れて回して、
全部緑のまま通ります。主張を一つ足しました（1800×1200 を composer に入れたら
900×600 で残る）。**赤を見てから直しています。**

```
npm run post
```

## 16. 形から新しい語を作る所が二回 ── **閉じた。二回ではなく三回でした**

`fmrWord(w, m)`（`www/wordsheet.js`）。`fmrAdd()` `fmrAddAll()`
`addFmWrite()` の三つが呼びます。三つ目の注記は「made the way fmrAdd()
makes one」と自分で言っていて、それを持っているものは何もありませんでした。

## 17. サーバーの一覧を読む所が二組 ── **開いている**

`netFollowing`/`netFollowers` と `netSearchSaved`/`netRecent`。
**`www/net.js` は別のセッションのものです。**

## 18. ファイルを取り込むボタンが二箇所 ── **閉じた**

**一箇所は `fileInHTML(cls, inner, id, accept)`（`www/shell.js`）です。**
`impFileHTML()`（`www/import.js`）と `shInFileHTML()`（`www/sheet.js`）は
**両方消しました** ── 呼び側（`impGetHTML()` と `shInHTML()`）が直に呼びます。
片方だけ残すと 8番 で消したのと同じ「二つ目の名前」になります。

`www/sheet.js` の注記が書いていた「文字が違うから共有していない」は消えて
います。**違っていたのは四つで、四つとも引数です**:

```
  cls      set impfile / btn ghost shfile ── 一覧の行か、絵の下のボタンか
  inner    <span class="sl">…</span> か、裸の文字か（着る class が決める）
  id       f-file / wr-file
  accept   辞書が受けるもの / PDF
```

**形は一つです。**無料は訊くボタン（`upFile` → `upStop()`、その場に立つ）、
有料は同じ文字の上に native の file input を透明で重ねた `<label>`。
`can('file')` はこの中で一度訊かれ、`shTakeIn()` がファイルの着く所でもう
一度訊きます（画面に描いたものは門ではないので）。

**返り値は一字も変わりません**（`npm run press` は `buttons pressed: 15687`
で据え置き）。

**名前を書いていた文書も同じ commit で直しました** ── `docs/FEATURES.md`
（二箇所）`docs/PAID_FEATURES.md` `docs/BACKLOG.md` `docs/HIDEFREE.md`
（二箇所、うち一つは「一つの関数にはしていません」という、この直しが嘘に
した文）。`docs/CHANGELOG.md` と `docs/reports/` `docs/scope/` は、その日
何が本当だったかの記録なので書き換えていません。

## 19. 文字を行に折る所が二つ ── **待ち。読んだ結果は「分かれていてよい」**

`cardSplit` と `cardWrap`（`www/card.js`）。**直していません。決めるのも
ここではありません**（`claude/r13-dup`、2026-09-10 に読んだだけ）。

**読んだ結果を一行で: 分かれていてよい。**違うのは「行数の上限があるか無いか」
だけではありませんでした。**三つ違い、三つとも失敗の意味です**:

```
  一語が一行より広い   cardSplit は null（入らないと言う）
                       cardWrap  はその一語だけで一行にする
  行数が上限を超えた   cardSplit は null            cardWrap には上限が無い
  何も無い             cardSplit は null            cardWrap は []
```

`null` は捨てられていません ── `cardLines()` が「この大きさでは入らない、
2pt 下げてやり直す」として読みます。つまり **`cardSplit` は行を作りながら
「入るか」を答える試しで、`cardWrap` は折るだけ**です。一つにすると、五行の
繰り返しに旗が三本立ち、読む人は二つの意味を同時に持つことになります。

**考えを変えるとしたら**、`cardLines()` が入るかどうかを別に測るように
なった日です。そのとき `null` が要らなくなり、残る違いは上限一つになります。

## 20. 同じ説明のコメントが十一回 ── **閉じた**（`lnField()` の頭に一度だけ）

## 21. `.capgo` が二箇所に分かれている ── **閉じた**

---

# 二部 ── 重複に見えるが、そうではないもの

**手を付けないでください。**

- **`cffNum` と `csNum`（`www/otf5.js`）** CLAUDE.md が名指しで「これは
  重複ではない」と書いています。CFF の仕様が同じ整数を違うバイトにしろと
  言っているからです。「Merging them would be inventing a rule, not finding
  one.」
- **`www/i18n/` の十ファイル** 三行の窓が一番多く拾いますが、十の言語が
  同じ鍵を持つのは規則 2 が求めていることです。
- **`navTop()` と `rootTop()`（`www/shell.js`）** 帯は二種類あり、両方が
  一つのファイルに置いてあります。直っている側の例です。
- **`WORDS` `LETTERS` `SCRIPT` `STG` が三百箇所** 「One thing seen from many
  places is not the same as one rule written out many times.」

---

# いま残っているもの

| | 数 |
|---|---|
| 閉じた | 18（1 2 3 4 5 6 7 8 9 10 11 12 13 15 16 18 20 21） |
| 半分 | 0 |
| 開いている | 2（14 17 ── どちらも `www/net.js`） |
| 待ち | 1（19 読む人の判断） |


**8 9 10 12 15 18 を閉じました（2026-09-10、`claude/r13-dup`）。**
残っているのは二件で、**どちらも `www/net.js`** です:

```
  14  開いている www/net.js  ── handle から id を引き当てるのが二回
  17  開いている www/net.js  ── サーバーの一覧を読む所が二組
  19  待ち      www/card.js  ── 読んだ: 分かれていてよい。決めるのは別
```

**一つのセッションが `www/net.js` を持てば 14 と 17 が同時に閉じます。**
そこだけが二件まとまっている所です。2026-09-10 の時点で `claude/r12-oneid`
がそのファイルを書き直しているので、この枝は触っていません。

**半分だけ寄せません。**四箇所のうち二箇所だけを一箇所にすると、その日から
**二つの仕組みが並んで走ります** ── CLAUDE.md「新しい仕組みが古いものの穴を
覆うのは、いちばん起きてはいけないこと」。2026-09-10 に閉じた六件は、どれも
数え落としを含めて全部の呼び側を消してあります（8番 は四箇所ではなく五箇所
でした）。

# 何を直すかは決めていません

順番も、直すかどうかも、この一覧は決めません。値段・無料と有料の境・削除・
保存の期間・言葉づかい・しきい値にも触れていません。
