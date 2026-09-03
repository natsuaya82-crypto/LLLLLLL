# 同じ要素なのに直書きされているもの

調べた日 2026-09-03。枝 `claude/dup`。**コードは一行も変えていません。**

オーナーの言葉:

```
同じボタンは共有して使用すればいいのに直書きで書いてるだろだからこう言うことが起きてる
その他の同じ要素なのに直書きなのたくさんあるやろ
こう言うのもルールで禁止してるから無くすように
```

CLAUDE.md § One place, not fifteen と、規則 21 がこれです。

## この一覧の読み方

**危ない順**に並べています。上の八件は**今すでに食い違っています**。
下の十二件は今のところ一致していますが、二箇所以上に手で書いてあるので、
次に誰かが片方だけ直したときに上の八件と同じことが起きます。

**確かめたこと**: `www/` の全ファイルをソースで読み、行を数えました。
三行の窓を全行に滑らせて重なりを探しました（CLAUDE.md § One place, not fifteen
の方法）。CSS の全セレクタを取り出して、同じセレクタが同じ性質を違う値で
二度書いている所を機械で探しました。

**確かめていないこと**: 実機で押していません。スクリーンショットも撮って
いません。検査（`npm test`）も回していません。以下の「画面がどうなるか」は
**すべてソースを読んで言っていること**で、目で見たものではありません。

---

# 一部 ── 今すでに食い違っているもの（八件）

## 1. 右上の決定ボタンが三通り。一つは色が付かない

**オーナーが実機で見つけたものです。** ここに載せるのは、これが基準になる形
だからです。**この件は別のセッション（`claude/navdo`）が持っています。**

同じ「右上の決定ボタン」が三通りに直書きされています。数えました:

| 着ているもの | 箇所 | 色 | 太さ | 大きさ | 押したとき |
|---|---|---|---|---|---|
| `navdo` | **15** | `var(--gold)` 金 | 700 | .92rem | 薄さ .75 |
| `navq navdone` | **2** | `var(--gold)` 金 | 600 | .9rem | 薄さ .55 |
| `navq navsave` | **1** | **`var(--txm)` 灰**  | 600 | 1.05rem | 薄さ .55 |

- `.navdo` の定義 `www/index.html:934`
- `.navq` の定義 `www/index.html:516`
- `.navdone` の定義 `www/index.html:2248`
- **`.navsave` の定義は `www/index.html` のどこにもありません。**
  `grep -rn navsave www/` が返すのは `www/glyph.js:1022`（コメント）と
  `www/glyph.js:1028`（着ている所）の二行だけです。

だから文字を描く画面の保存ボタンだけが灰色のまま金になりません。
残り二つも、金であることは合っていますが、太さ・大きさ・押したときの薄さが
三通りに割れています。

なお `navdo navdel`（削除の赤）が 4 箇所、`navq navfil`（絞り込み）が 1 箇所、
素の `navq` が 3 箇所あります。合わせて右上の角には**六通り**の書き方が
立っています。

**直すとどうなるか**: 文字を描く画面の保存が灰色から金になります。
キーボードと文字の「完了」の大きさと太さが他の 15 箇所と揃います。
**大きさ: 中**（着せ替えは 18 箇所、CSS は一箇所に寄せる）

---

## 2. 言語のスライスを読む並びが五箇所、書く並びが三箇所。全部ちがう

**一番危ないのはこれです。** CLAUDE.md 規則 6 が名指しで警告している形
──「a list of keys, written by hand, that nobody remembered to add to」──
そのもので、**すでに二回起きています。**

`www/core.js:111` の `SLICES` は言語が持つものを 12 個並べています:

```
words lines lang script letters notes phases talk snd kb wld gram2
```

その 12 個を globals に読み込む並びが、五箇所に手で書いてあります:

| どこ | 何のとき | 呼んでいるもの | 数 |
|---|---|---|---|
| `www/core.js:451` | 言語を切り替える | langRead ltRead ntRead stRead sndRead **ltStart** kbRead **migrateKbFree** wldRead **migratePostInk** | 10 |
| `www/settings.js:501-502` | この言語を削除 | langRead ltRead ntRead stRead sndRead **ltStart** kbRead **migrateKbFree** wldRead | 9 |
| `www/backup.js:399` | バックアップから戻す | langRead ltRead ntRead stRead sndRead kbRead wldRead | 7 |
| `www/net.js:1357` | サーバーと合わせる | langRead ltRead ntRead stRead sndRead kbRead wldRead | 7 |
| `www/settings.js:586` | **アカウントを削除** | langRead ltRead ntRead stRead sndRead | **5** |

書き出す並びは三箇所です:

| どこ | 呼んでいるもの | 数 |
|---|---|---|
| `www/core.js:449` | save saveLetters saveNotes saveStg saveSnd **saveKb saveWld** | 7 |
| `www/settings.js:506` | save saveLetters saveNotes saveStg saveSnd | **5** |
| `www/settings.js:638` | save saveLetters saveNotes saveStg saveSnd | **5** |

**キーボード（`kb`）と世界（`wld`）は後から足されたスライスです。**
足した人は `core.js` の並びには入れました。`settings.js` の三箇所には
入っていません。HANDOVER と CLAUDE.md 規則 6 が「キーボードはバックアップに
入っていなかった」と書いているのと**同じ穴が、まだ二つ空いています。**

### ソースを読んで言えること

`www/settings.js:586`（アカウント削除）は 5 つしか読み直しません。
`kbRead()` と `wldRead()` を呼ばないので、**`KB` と `WLD` は消したアカウントの
キーボードと世界を持ったまま**メモリに残ります。

その 6 行下（`www/settings.js:592-593`）に、まさにこの理由で
`ME` `POSTS` `DRAFTS` を空にする行があり、コメントはこう言っています:

> the copies in memory, which would otherwise be written straight back out by
> the next save

**`KB` と `WLD` もメモリの写しです。この二つだけ、その行から漏れています。**
`saveKb()` は `www/keyboard.js:137` にあり、キーボードを触れば呼ばれます。

**実機では押していません。** 上はソースを読んで言っていることです。

### ついでに見つけたこと

`SLICES` の `talk` は、`www/` のどこからも読み書きされていません
（`grep -rn "'talk'" www/` は `core.js:111` の一行だけ）。閉じた章の残りです。
消しても何も減りませんが、**この一覧が手で書かれたものだという印**です。

**直すとどうなるか**: 画面の見た目は変わりません。アカウントを消したあとに
前のアカウントのキーボードが残らなくなります。
**大きさ: 中**（読む一つ、書く一つ、`SLICES` から回す形にする）

---

## 3. 検索の箱が六箇所。×で消せるのは三つだけ

同じ「虫めがね＋入力欄」が、六つの画面に別々に直書きされています。
中の欄は `lnField()`（`www/shell.js:861`）を通っていて、そこは正しく一箇所です。
**外側の箱と虫めがねと×ボタンが六回書いてあります。**

| どこ | 画面 | ×で消せるか | 欄の説明文 |
|---|---|---|---|
| `www/sns.js:1575` | タイムラインの検索 | **ある** | ある |
| `www/words.js:243` | 辞書 | **ある** | ある |
| `www/home.js:475` | 横断検索 | **ある** | ある |
| `www/notes.js:221` | ノート | **無い** | ある |
| `www/sound.js:399` | 発音記号 | **無い** | **無い**（`''`） |
| `www/sound.js:800` | 文字 | **無い** | **無い**（`''`） |

三つの画面では打った字を×一回で消せて、三つの画面では手で消すしかありません。
発音記号と文字の二画面は、欄に何を打てばいいかの説明文も入っていません。

**同じ形の箱なのに、画面ごとに書いた人が違うので揃っていません。**

**直すとどうなるか**: ノート・発音記号・文字の三画面に×ボタンが出ます。
発音記号と文字の欄に説明文が出ます。
**大きさ: 小**（`lnField()` の隣に箱を作る関数を一つ置いて、六箇所を差し替える）

---

## 4. `.scin` が同じ表に二回。四つの値が食い違っている

`www/index.html` の **3369 行目と 3373 行目**、四行しか離れていない所に、
同じ `.scin` が二回書いてあります。

| 性質 | 3369 行目 | 3373 行目 | 勝つのは |
|---|---|---|---|
| `border-radius` | `8px` | `7px` | 下 |
| `padding` | `7px 9px` | `5px 7px` | 下 |
| `font-size` | `1rem` | `1.05rem` | 下 |
| `text-align` | （無し） | `center` | 下 |
| `min-height` | **`44px`** | （無し） | **上だけ** |

`.scin:focus` も二回（3371 行目と 3375 行目）、同じ内容で書いてあります。

着ているのは `www/home.js:261` の一箇所だけ ── 文字を自分で打ち込む欄です。
そこは `class="scin own"` なので `.scin.own{text-align:left}`（3372 行目）が
勝ち、下の `text-align:center` は効きません。

**つまり 3369 行目はほとんど死んでいます。** そこを直しても画面は変わりません。

**危ないのはここです。** `min-height:44px` は**上の塊にしか無い**ので、
上を「死んでいるから」と消すと、親指が触る 44pt の枠が消えます。
CLAUDE.md 規則 3 の `press-check` が 44pt を測っています。

**直すとどうなるか**: 一つにまとめれば見た目は今と同じままです。
**大きさ: 小**

---

## 5. 目印のチェックが 1770 行 離れて二回。片方は効いていない

`.lrow .lchk` ── 設定画面の「表示する言語」の一覧に付く**選択中のチェック印**
です（`www/settings.js:202`）。

| どこ | 書いてあること |
|---|---|
| `www/index.html:1747` | `flex:0 0 14px; text-align:right; color:var(--gold)` |
| `www/index.html:3517` | `flex:0 0 16px; display:flex; align-items:center; justify-content:flex-end` |

下が `display:flex` を立てるので、**上の `text-align:right` は効きません。**
幅も 14px ではなく 16px です。上から生き残っているのは `color` だけです。

1747 行目を見て「チェックを右に寄せている行だ」と読んだ人が、そこを直しても
何も動きません。1770 行 離れた所にもう一つあると気づく手がかりはありません。

**直すとどうなるか**: 一つにまとめれば見た目は今と同じままです。
**大きさ: 小**

---

## 6. 写真の書き出しの品質が二通り。0.72 と 0.82

写真を JPEG にする所が五箇所あります。四箇所は名前の付いた定数を使い、
一箇所だけ数字が直書きで、**しかも値が違います。**

| どこ | 何の写真 | 品質 |
|---|---|---|
| `www/post.js:706` | 投稿の小さい写し | `POST_PICQ` = **0.72** |
| `www/post.js:801` | 投稿の写真 | `POST_PICQ` = **0.72** |
| `www/post.js:1892` | 投稿（カード） | `POST_PICQ` = **0.72** |
| `www/post.js:2361` | 投稿 | `POST_PICQ` = **0.72** |
| `www/me.js:346` | **顔写真** | **`0.82`** 直書き |

`POST_PICQ` は `www/post.js:678` に `var POST_PIC=900, POST_PICQ=0.72;` と
書いてあります。

顔写真だけ品質を上げているのが**わざとなのか間違いなのかは、コードのどこにも
書いてありません。** 顔は丸く小さく切るので上げる理由はありえますが、
その断りが一行も無く、数字が裸で置いてあるだけです。

**直すとどうなるか**: 同じ値にすれば顔写真のファイルが少し小さくなります。
わざとなら、名前を付けて理由を一行書けば、次に読む人が迷いません。
**どちらにするかはオーナーの決めることです。ここでは決めません。**
**大きさ: 小**

---

## 7. 語数の上限の訊き方が二通り。シートを閉じる方と閉じない方

同じ「これ以上は無料の上限です」の確認が、二通りに書いてあります。
**同じファイルの中で両方使われています。**

| 書き方 | どこ | シートを閉じるか |
|---|---|---|
| `if(capStop(n)) return;` | `www/phases.js:379`, `www/wordsheet.js:77`, `www/wordsheet.js:472`, `www/wordsheet.js:820` | **閉じない** |
| `if(!capOK(n)){ closeSheet(); capStop(n); return; }` | `www/wordsheet.js:94`, `www/wordsheet.js:764` | **閉じる** |

`capStop()`（`www/core.js:1322`）は `popAsk()` でポップを出します。
だから四箇所では**開いているシートの上に**ポップが出て、二箇所では
**シートが閉じてから**ポップが出ます。

`www/wordsheet.js` の中だけで 77・94・472・764・820 の五箇所があり、
そのうち二つが違う書き方です。同じ画面で同じことをして、見え方が変わります。

**実機では押していません。** ポップとシートの重なりがどう見えるかは
確かめていません。**道が二本あることは確かです。**

**直すとどうなるか**: 上限に当たったときのポップの出方が六箇所で揃います。
**どちらに揃えるかはオーナーの決めることです。**
**大きさ: 小**

---

## 8. プラン画面への行き方が二通り。片方はシートを閉じない

`goPlans()` は `www/wordsheet.js:1456` に一行だけあります:

```js
function goPlans(){ closeSheet(); go('plans'); }
```

ところがプラン画面へ行くボタンは、**五箇所が `goPlans` を使い、
五箇所が `go('plans')` を直に呼んでいます。**

| `DO('goPlans')`（シートを閉じる） | `DO('go', ["plans"])`（閉じない） |
|---|---|
| `www/settings.js:669` | `www/home.js:19` |
| `www/words.js:196` | `www/settings.js:155` |
| `www/keyboard.js:3434` | `www/settings.js:340` |
| `www/phases.js:555` | `www/import.js:489` |
| `www/sound.js:641` | `www/sheet.js:1300` |

`www/sheet.js:1300` は**シートを組み立てているファイルの中**にあります。
そこから `go('plans')` を押すと、シートが開いたままプラン画面へ行くはずです。

**実機では押していません。** 十箇所が二通りに割れていることは確かです。

**直すとどうなるか**: シートの中からプランへ行ったときにシートが残らなく
なります。
**大きさ: 小**

---

# 二部 ── まだ一致しているが、二箇所以上に直書き（十二件）

今のところ値は揃っています。**一箇所だけ直されたら一部の八件と同じことが
起きます。**

## 9. 上限の警告ボタンが四箇所。うち一つだけ形が違う

`capwarn` を着た「あと N 語です／N 語が隠れています」のボタンが四箇所です。

| どこ | 関数 | 押したとき | 余白 |
|---|---|---|---|
| `www/words.js:196` | `wordsHidHTML` | `DO('goPlans')` | `margin:14px 0 0` |
| `www/phases.js:555` | `stHidHTML` | `DO('goPlans')` | `margin:14px 0 0` |
| `www/sound.js:641` | `ltHidHTML` | `DO('goPlans')` | `margin:14px 0 0` |
| `www/home.js:19` | `capBanner` | **`DO('go', ["plans"])`** | **無し** |

前の三つは名前以外**一字も違いません**。四つ目だけ行き方も余白も違います
（行き方の話は 8 番）。 **大きさ: 小**

## 10. 「まだ何も無い」の空表示が十箇所。別の形がもう一つ

`<div class="empty"><div class="eb">…</div></div>` が十箇所に直書きです:

`www/sns.js:22`, `www/sns.js:25`, `www/sns.js:695`, `www/shell.js:816`,
`www/me.js:785`, `www/words.js:163`, `www/notes.js:235`, `www/notes.js:236`,
`www/home.js:579`, `www/home.js:602`

うち **`t('words.nomatch')`（見つかりません）は三回**書かれています
（`www/notes.js:235`, `www/home.js:579`, `www/home.js:602`）。

`snsNone()`（`www/sns.js:21`）と `goneBox()`（`www/shell.js:815`）が
「一箇所」のつもりで置かれていますが、残り八箇所はそこを通っていません。

**逃がし方も揃っていません。** `www/sns.js` と `www/me.js` は `esc(t(...))` で
包み、`www/shell.js` `www/notes.js` `www/home.js` は `t(...)` を裸で入れています。

さらに **`www/mod.js` は別の形の空表示を持っています** ── `.mnone`
（`www/index.html:776`）。`.empty`（`www/index.html:1557`）とは見た目が
違います:

| | `.empty .eb` | `.mnone` |
|---|---|---|
| 上下の余白 | 54px | 24px |
| 書体 | `var(--face-caps)` | 継承 |
| 大きさ | 1.3rem | 継承 |

通報の画面の「何も無い」だけ、他のどの画面とも違う見た目です。
**大きさ: 中**

## 11. 単語の行が一つの関数の中で二回

`www/words.js:479-482` と `www/words.js:498-501`。
見出し語・読み・品詞・意味の四行が、選んでいるときと普通のときで
**一字も違わず二回**書いてあります。行の見た目を変えるなら二箇所です。
**大きさ: 小**

## 12. 通報の画面のエラーと空が二回

`www/mod.js:121-124` と `www/mod.js:335-339`。四行が一字も違わず二回。
`www/mod.js:332` のコメントは「二つの一覧が食い違うのをこの章は拒む」と
書いていますが、**共有しているのは `modRow` だけで、その上の四行は写しです。**
**大きさ: 小**

## 13. 言語の記事の Edit ボタンが二回

`www/home.js:1711` と `www/home.js:2001`。どちらも `wldPage()` の中です。
条件 `(!ed && mine && !langLocked())` まで含めて一字も違いません。
誰が編集できるかの決まりを変えるなら二箇所です。

規則 21 は `wldPage()` が一つの関数であることを守らせていますが、
**その中の上の帯は二回書いてあります。**
**大きさ: 小**

## 14. handle から id を引き当てるのが二回。コメントは「一箇所」と言っている

`www/net.js:1724`（`netBlock`）と `www/net.js:2821`（`netFollow`）。
同じ問い合わせと同じ後始末が、1100 行 離れて二回。

`www/net.js:2819` のコメント:

> The id is looked up here, once, **in the one place that has to**.

**そう書いてある関数の外に、もう一つあります。** CLAUDE.md が
「A comment saying 'this is the one place' is worth nothing on its own」と
名指ししている形です。
**大きさ: 小**

## 15. 写真を縮める計算が二回

`www/post.js:698-708`（`postThumb`）と `www/post.js:794-802`（`pwPicKeep`）。
長辺の比を取る、canvas を作る、描く、JPEG にする ── 同じ手順が二回。
違うのは上限の定数だけです（`POST_THUMB`=300 と `POST_PIC`=900）。
**大きさ: 小**

## 16. 形から新しい語を作る所が二回

`www/wordsheet.js:768-772` と `www/wordsheet.js:824-828`。
新しい語の中身（`hw` `pos` `at` `from` `fm` `sp` `mns` `mn`）が二回。
語に項目を足すなら二箇所です。
**大きさ: 小**

## 17. サーバーの一覧を読む所が二組

- `netFollowing`（`www/net.js:1674`）と `netFollowers`（`www/net.js:1705`）:
  `d[i].followed` と `d[i].follower` の一語だけ違う、13 行の同じ関数。
- `netSearchSaved`（`www/net.js:2240`）と `netRecent`（`www/net.js:2282`）:
  行き先と日付の列名だけ違う、同じ関数。

**大きさ: 小**

## 18. ファイルを取り込むボタンが二箇所。コメントが自分で認めている

`www/import.js:487`（`impFileHTML`）と `www/sheet.js:1298`（`shInFileHTML`）。

`www/sheet.js:1290-1292` のコメント:

> Same shape and same words as impFileHTML() in www/import.js, which is the
> other file control in this app; **it is not shared with it because the two
> say different things on the button.**

**文字が違うことは、形まで二回書く理由になりません。** 文字は引数で渡せます。
**大きさ: 小**

## 19. 文字を行に折る所が二つ

`cardSplit`（`www/card.js:444`）と `cardWrap`（`www/card.js:606`）。
折る繰り返しは同じで、行数の上限があるか無いかだけが違います。
コメントに違いの断りがあるので、これは**分かれていてよい方に近い**かも
しれません。読む人の判断がいります。
**大きさ: 小**

## 20. 同じ説明のコメントが十一回

「THE SAME FIELD AS EVERYWHERE ELSE」で始まる四〜五行の同じ説明が、
十一箇所に貼ってあります:

`www/mod.js:320`, `www/sns.js:1579`, `www/words.js:235`, `www/phases.js:390`,
`www/notes.js:60`, `www/notes.js:222`, `www/sound.js:400`, `www/sound.js:801`,
`www/sound.js:1056`, `www/home.js:1823`, `www/wordsheet.js:1101`

**中身のコードは正しく `lnField()` 一箇所を通っています。** 直すべきは
コードではなく、同じ文章が十一回あることです。
一箇所（`www/shell.js:861` の `lnField()` の頭）に置けば足ります。
**大きさ: 小**

## 21. `.capgo` が二箇所に分かれている

`www/index.html:3378` が `color` と `flex-shrink`、
`www/index.html:3516` が `display` と `align-items` と `gap`。
性質は重なっていないので今は壊れていませんが、
一つの部品の見た目が 138 行 離れて二枚に分かれています。
**大きさ: 小**

---

# 三部 ── 重複に見えるが、そうではないもの

**手を付けないでください。**

- **`cffNum` と `csNum`（`www/otf5.js:637` と `www/otf5.js:650`）**
  CLAUDE.md が名指しで「これは重複ではない」と書いています。CFF の仕様が
  同じ整数を違うバイトにしろと言っているからです。
  「Merging them would be inventing a rule, not finding one.」
- **`www/i18n/` の十ファイル**
  三行の窓が一番多く拾いますが、十の言語が同じ鍵を持つのは規則 2 が
  求めていることです。
- **`navTop()` と `rootTop()`（`www/shell.js:774` と `www/shell.js:915`）**
  帯は二種類あり、両方が一つのファイルに置いてあります。
  「Both bars live here now, so which one a screen wears is one decision made
  in one place.」── 直っている側の例です。
- **`WORDS` `LETTERS` `SCRIPT` `STG` が三百箇所**
  「One thing seen from many places is not the same as one rule written out
  many times.」

---

# 数えたもの

| | 数 |
|---|---|
| 読んだファイル | `www/` の `.js` と `.html` 全部 |
| 三行の窓で見つかった重なり | 105 |
| そのうち `i18n/` の十ファイル由来（重複ではない） | 66 |
| 残り（`www/` の本体） | 39 |
| 同じセレクタが二回以上書かれている | 42 |
| そのうち同じ性質を違う値で書いている | 5 セレクタ |
| 今すでに食い違っている件 | **8** |
| まだ一致しているが直書きの件 | **12** |

# 何を直すかは決めていません

順番も、直すかどうかも、この一覧を作った側は決めません。
値段・無料と有料の境・削除・保存の期間・言葉づかい・しきい値にも
触れていません。
