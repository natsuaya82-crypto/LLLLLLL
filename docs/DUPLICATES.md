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

## 8. プラン画面への行き方が二通り。片方はシートを閉じない ── **半分**

同じ決定で決まります（「後ろを閉じない」）。`goPlans()` から `closeSheet()`
を消したので、**道は一本**になりました。プランから戻ると、押したその画面に
立ちます。

**残っているのは名前だけです。**`goPlans()` の中身は `go('plans')` 一行なので、
いまは同じ道に付いた二つ目の名前です。消すには `DO('goPlans')` を書いている
`www/keyboard.js` `www/phases.js` `www/sound.js` と、直に呼んでいる
`www/wsys.js` が要ります。

```
grep -rn "goPlans" www/*.js
```

## 9. 上限の警告ボタンが四箇所。うち一つだけ形が違う ── **開いている**

`capwarn` を着た「あと N 語です」のボタンが `www/words.js` `www/phases.js`
`www/sound.js` `www/home.js` の四箇所。前の三つは名前以外一字も違わず、
四つ目（`capBanner`）だけ余白が無い。行き方の違いは 8番で消えました。
`www/phases.js` と `www/sound.js` は別のセッションのものです。

## 10. 「まだ何も無い」の空表示が九箇所 ── **半分**

`emptyBox(text)`（`www/shell.js`）が箱です。寄せたのは四箇所:
`goneBox()` `fResultsHTML()` `fPickedHTML()` `wordsBodyHTML()`。

**残る五箇所は持ち主が違います** ── `www/sns.js`（三つ）`www/me.js`
`www/notes.js`。`www/notes.js` だけは二行目（`.empty .es`）を持つので、
その引数はそのファイルが回ってきた日に足すもの。いま足すと誰も通らない枝に
なります。

`www/mod.js` の `.mnone` は**別の見た目の空表示**で、まだ `.empty` と
違います（余白 24px 対 54px、書体も大きさも継承）。通報の画面だけ他のどの
画面とも違って見えます。

```
grep -rn 'class="empty"' www/*.js
```

## 11. 単語の行が一つの関数の中で二回 ── **閉じた**（`wEntryLines()`）

## 12. 通報の画面のエラーと空が二回 ── **開いている**

`www/mod.js` の二箇所。四行が一字も違わず二回。`www/mod.js` の注記は
「二つの一覧が食い違うのをこの章は拒む」と書いていますが、共有しているのは
`modRow` だけです。**`www/mod.js` は別のセッションのものです。**

## 13. 言語の記事の Edit ボタンが二回 ── **閉じた**

`wldFrame(body, ed, mine)`（`www/home.js`）。`wldPage()` の二つの出口が
囲みと右上の Edit と本体を一字も違わず書いていました。

## 14. handle から id を引き当てるのが二回 ── **開いている**

`www/net.js` の `netBlock` と `netFollow`。同じ問い合わせと同じ後始末が
1100 行 離れて二回。**その片方の上に「in the one place that has to」と
書いてあります。****`www/net.js` は別のセッションのものです。**

```
grep -n "in the one place that has to" www/net.js
```

## 15. 写真を縮める計算が二回 ── **開いている**

`www/post.js` の `postThumb` と `pwPicKeep`。違うのは上限の定数だけ。
**`www/post.js` は別のセッションのものです。**

## 16. 形から新しい語を作る所が二回 ── **閉じた。二回ではなく三回でした**

`fmrWord(w, m)`（`www/wordsheet.js`）。`fmrAdd()` `fmrAddAll()`
`addFmWrite()` の三つが呼びます。三つ目の注記は「made the way fmrAdd()
makes one」と自分で言っていて、それを持っているものは何もありませんでした。

## 17. サーバーの一覧を読む所が二組 ── **開いている**

`netFollowing`/`netFollowers` と `netSearchSaved`/`netRecent`。
**`www/net.js` は別のセッションのものです。**

## 18. ファイルを取り込むボタンが二箇所 ── **開いている**

`www/import.js` の `impFileHTML` と `www/sheet.js` の `shInFileHTML`。
`www/sheet.js` の注記が「文字が違うから共有していない」と自分で書いています。
文字は引数で渡せます。**どちらも別のセッションのものです。**

## 19. 文字を行に折る所が二つ ── **待ち（読む人の判断）**

`cardSplit` と `cardWrap`（`www/card.js`）。折る繰り返しは同じで、行数の
上限があるか無いかだけが違う。注記に断りがあるので**分かれていてよい方に
近い**かもしれません。**`www/card.js` は別のセッションのものです。**

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
| 閉じた | 12（1 2 3 4 5 6 7 11 13 16 20 21） |
| 半分 | 2（8 名前だけ／10 五箇所） |
| 開いている | 6（9 12 14 15 17 18） |
| 待ち | 1（19 読む人の判断） |

**残っている九件のうち八件は、`www/net.js` `www/post.js` `www/mod.js`
`www/sheet.js` `www/import.js` `www/card.js` `www/sns.js` `www/me.js`
`www/notes.js` `www/phases.js` `www/sound.js` にあります。**どれも
`claude/pop` の持ち物ではないので、この枝では触っていません。

# 何を直すかは決めていません

順番も、直すかどうかも、この一覧は決めません。値段・無料と有料の境・削除・
保存の期間・言葉づかい・しきい値にも触れていません。
