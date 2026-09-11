# r27-off ── 「空」と「訊けなかった」を分ける／届かない保存は進まない／消した言語の写し

- 日付: 2026-09-11
- 枝: `claude/r27-off`（`integ-0905` の `29076d64` から）
- もと: `origin/claude/r21-hunt` の `docs/reports/hunt-2026-09-11.md` #11・#15・#16
- 決定（OWNER 2026-09-11）:「全部サーバーでやってる。電波なしならクルクル回るやろ」
- 規則: CLAUDE.md「Empty and broken are different states and must not share a
  branch」、規則 11「保存しないのが仕様、保存して黙るのはだめ」、規則 22

## 測った ── 憶測ではなく、押した結果

`tools/hunt.mjs` の道13・道14 を**この木で流し直した**（取り込んではいません。
`.git/info/exclude` に置いて走らせただけ）。道14 には状態を印字する行を足して
測りました。

### #11 電波なしのタイムライン

道14 のそのままの歩き：

```
offline, the timeline: ["ホーム","おすすめ","ア","自分の言語で一行","まだ何もない"]
MEASURE feed: SNS_GOT={"fo":1,"rec":1}  PULL_GOT={…"feed":1…}  PULL_OUT={…全部 0…}
```

**出しているのは `vFeed()`（`www/sns.js`）の三項の `SNS_GOT[snsTab]` の枝**で、
`SNS_GOT` は表の `hav` 列（`snsHas`）としてただ一箇所に置かれています。値が 1 な
のは**電波がある間に起動が訊いて、サーバーが 0 件と答えたから**で、その一文は
「最後の答え」については正しい。壊れているのはその先です：

```
MEASURE after a pull offline: pop="接続できません 再接続 閉じる"
                              text=[…"まだ何もない"…]
MEASURE cold offline feed:    pop=""   text=["ホーム","おすすめ","ア"]   ← 回る印のまま
MEASURE cold offline boot:    pop="接続できません…"  text=[…回る印のまま…]
```

- **人が引いて落ちても、本文は「まだ何もない」のまま。** サーバーに届いていない
  のに、サーバーについての一文を言い続けます。
- **一度も答えが来ていない電波なしは、永遠に回る印。** 何も飛んでいないのに
  「今きいているところ」の顔をします。

**つまり「訊けなかった」という状態がどこにも無い。** `PULL_GOT[r]` は 1 か 0 の
二つで、落ちた時は 0 のまま＝「まだ訊いていない」と区別がつきません。

### #15 電波なしで足した単語

```
offline, after adding a word: WORDS=2  where={"r":"form","a":"word:sar"}
                              pop="接続できません 再接続 閉じる"
back on: WORDS=1
```

断りは出ている。**画面が先に進むところだけが違う。** `addOne()`
（`www/wordsheet.js:84`）は `save()`（＝ `bkTouch()` の 1.2 秒の束）を呼んで、
答えを待たずに `back()` → `toast()` → `openWord(hw)` まで走ります。

押した人が立っている保存には**すでに道があります** ── `netSaveNow(done)`
（`www/net.js:2384`、「通信エラーなら進むわけねえだろ全部」OWNER 2026-09-05）と、
端末を押す前に戻す `keepSnap()`／`keepBack()`（`www/shell.js:523`）。九つの画面の
保存ボタンはその道の上にいて、**語の紙の「追加」だけが乗っていません**。

### #16 アカウントを消しても残る写し

道13 のそのまま：

```
server: users=0 profiles=0 langs=0 slices=0
what is left in localStorage:
  ["lingua.2da87da5-….owner.got","lingua.3d9c29fa-….name.got",
   "lingua.3d9c29fa-….owner.got","lingua.cur","lingua.langs","lingua.set"]
```

`lsWipeAcct()`（`www/core.js:66`）はその言語の鍵を **`SLICES` を歩いて**消します。
`name`・`wsys`・`owner` は `SLICES` ではなく **`language` 行の列**で、2026-09-08/09
に入ったもの ── このループより後に生まれ、ループに足されませんでした。
CLAUDE.md がまさにこの形を名前で呼んでいます：**「a list of keys, written by hand,
that nobody remembered to add to」**。`lsWipeAcct()` 自身が uid の側で一度この
書き換えを受けている（名前を挙げるのをやめて数える）のに、言語の側は挙げたまま
でした。

**この鍵は誰の物か。** `lingua.<言語 id>.<何か>.got` は `slGot()`（`www/core.js`）
が書く「サーバーが最後にそう言った」の写しで、**その言語の物**です。言語は
アカウントの物（CLAUDE.md「NOTHING IS THE PHONE'S. EVERYTHING IS THE ACCOUNT'S」）
なので、**その言語を持っているアカウントの物**。上への道は持ちません
（`slMine()` が外している）。`tools/store-check.mjs:95` はすでにそう書いて
いますが、その行の「lsWipeAcct(), which counts the namespace, takes it with the
account」は**今日は嘘**で、上の測定がそれです。直すとその文が本当になります。

## やること

**#11（`www/sns.js`）** 表の `PULL_GOT[r]` を 0/1 の旗から **0・1・−1 の一つの
記録**に書き換える（後付けの二本目の旗は作らない）。描く側が訊くのは
`pullSay(r)` 一つ：0 まだ何も言えない・1 サーバーが答えた・−1 訊けなかった。
`pullHad(r)` は同じ記録の別の読み方（「サーバーが答えたか」）として残す ──
`www/post.js` と `www/shell.js` がそれを訊いていて、どちらも他の枝の file。
一覧がある時は一覧が勝つ（「前に読み込んだ分は出て欲しい」規則 22）。**空の一文
だけ**が三つに分かれる：答えが来て空なら「まだ何もない」、落ちたなら
`emptyBox(t('net.offline'))`＝**既にある「接続できません」**、どちらでもなければ
回る印。乗せる画面はタイムライン・通知・保存した検索・最近の検索。

**#15（`www/wordsheet.js`）** `addOne()` を `netSaveNow()` の道に乗せる。押す前に
`keepSnap()`、届いたら初めて `back()`／`toast()`／`openWord()`、届かなければ
`keepBack()` で端末を押す前に戻し、**紙はそのまま**（`addW`・`wEdit`・`addFms`・
`addFrom`・`addSlot`＝「打ったものは欄に残る」）。新しい部品も新しい文言も無し。

**#16（`www/core.js` の `lsWipeAcct` だけ）** その言語の鍵を **`SLICES` で挙げる
のをやめて数える** ── `lingua.<id>.` で始まる鍵は、記憶（`LSL`）もディスクも
全部その言語の物。この関数がすでに uid の側でやっている一掃と同じで、二本目の
仕組みではありません。`docs/CHANGELOG.md` に DELETE REVIEW を**先に**書く
（「アカウント削除で残るものねえ」OWNER 2026-08-27 の枠の中）。
`tools/store-check.mjs:95` の一文と `docs/DATA_MODEL.md` を同じ commit で直す。

## 触らない

- `www/net.js` は `PULL_GOT`／訊けたかの一箇所だけ。`netLangRow`・
  `netLangsDown`・`netLangSync`・プロフィールの道は `claude/r24-lang` が使用中。
- `www/core.js` は `lsWipeAcct` と `saveTry` の周りだけ。`langForAcct`・
  `langMint`・索引は `r24-lang`。
- `www/letters.js` `www/grammar.js` `www/phases.js` `www/me.js` `www/onboard.js`
  は他の枝。
- `www/shell.js` `www/post.js` は読むだけ（`keepSnap`／`keepBack`／`pullHad` を
  呼ぶだけで、一行も書き換えません）。

## 同じ穴で、ここでは直さないもの（`docs/BACKLOG.md` 行き）

`SLICES` を歩いて言語の鍵を消している所は**三箇所**あり、三つとも `name`・
`wsys`・`owner` を置いていきます：

| 所 | 何の削除か | この枝で直すか |
|---|---|---|
| `www/core.js` `lsWipeAcct()` | アカウント削除 | **直す** |
| `www/settings.js` `wipeLangsHere()` | 「この言語を削除」 | 他の枝の file |
| `www/net.js` 取った言語の掃除 | 元が消えた DL 言語 | `r24-lang` の道 |

## 押さえる check（赤を見てから緑）

- `tools/acct-check.mjs` ── アカウントを消したあと `lingua.` に言語の鍵が
  一つも残っていない（#16）。
- `tools/again-check.mjs` ── 電波なしの「追加」は画面を進めず、`WORDS` は
  押す前のまま（#15）。
- sns の check 一本 ── 答えが来て空・落ちた・まだ、の三つが別の文になる（#11）。

最後に `npm run press` を一回。ゲートは回しません（規則 2）。
