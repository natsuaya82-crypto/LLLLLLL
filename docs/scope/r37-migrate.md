# r37-migrate ── 扉をくぐると、サーバーへの問いが全部やり直される

ブランチ `claude/r37-migrate`（`integ-0905` = `5b12a3d7` から）。
**取り込むのはサブリーダー／リーダー。全ゲートは回していません。**

## 何が赤かったか

`integ-0905` = `5b12a3d7`（r36-index を取り込んだ直後）で **migrate-check だけ
赤**。`890d3a75`（r36 の直前）では緑。単体でも同じ：

```
the language somebody already has did not survive (6):

  every letter of a free alphabet reads a sound the chart has:
      got "a: no letter / b: no letter / … / z: no letter", wanted ""
  g is the velar and not the palatal: got "", wanted "ɡ"
  c is k / q is k / x is k / y is j: got "", wanted …
```

サインインした直後の端末に**文字が一つも無い**。言語が開いていない。

## 測った物 ── probe の出力

`tools/migrate-check.mjs` を copy して case 7e（扉でサインイン）の直後に probe を
入れ、`0 / 200 / 600 / 1500ms` で状態を出した。**読んで当てたのではありません。**

**一回目 ── アプリが何を持っているか：**

```
PROBE +0ms   { langId: "9f9d…", letters: 0, LMINE: null, known: false,
               wait: true, plan: true, count: null, main: null,
               langs: ["9f9d…"], syncing: false, had: true }
PROBE +1500ms{ 同じ。letters: 0、LMINE: null、wait: true のまま }
```

読みどころは二つ。**`had`（＝`pullHad('mylangs')`）が真**なのに
**`LMINE` が null**。同じ一つの問い「`language?owner=eq.<me>` は答えたか」が
**二箇所に記録されていて、食い違っている**。`LANG_WAIT` は 1500ms 後も真 ──
永遠に待つ。

**二回目 ── pull の表を扉の前後で：**

```
PROBE at-7d      PULL_GOT {"mine":1,"mylangs":1,"myposts":1}
PROBE before-door PULL_GOT {"mine":1,"mylangs":1,"myposts":1,"notif":1,"day":1,
                            "feed":1,"saved":1,"recent":1,"drafts":1}
```

**7d は「保存されたトークンをサーバーが拒む起動」**。その起動で三つの問いが
`u-them` として投げられ、答えが着いて `PULL_GOT` に 1 が入り、**そのあとで**
セッションが落とされた。その三つが**扉を越えて生き残っている**。

## 原因 ── 一行

**`pullForget()` が `netOut()` にしか無く、セッションが「来る」側に無かった。**
だから扉の向こうで `pullHad('mylangs')` が前のセッションのぶんの「答え済み」を
答え、`netLangsDown()`（`langMineGot()` を書く唯一の道）が一度も走らない。

道を全部書くと：

1. `netTook()` は account の物を忘れ直す ── `meFor()`・`postFor()`・`planFor()`・
   `langTookFor()`・`langMineForget()`。**pull の表だけが残っていた。**
2. `netTook()` は `pullWait('mylangs', … langForAcct() …)` に掛ける。
3. `pullWait()` は `pullHad(r)` が真ならその場で発火する。真だった。
4. `pullNeed()` も同じ `PULL_GOT` に断られるので、`askLangs()` →
   `netLangsDown()` は走らない。
5. `langMineGot()` が書かれないので `langMineKnown()` は偽のまま。
6. `langForAcct()` は `if(!langMineKnown()){ LANG_WAIT=true; return true; }` で
   帰り続ける ── 言語を開きも作りもしない。
7. `ltStart()` に渡る言語が無いので `LETTERS` は空。**何も投げない。**

**r36 が原因ではありませんでした。**r36 は `pullHad('mylangs')` を
`langMineKnown()` に置き換えた（正しい ── § LMINE が一箇所）。それによって、
**それまで `PULL_GOT` の古い印に隠れていた「扉が pull の表を忘れない」という
前からの穴が、初めて表に出た**。r36 以前は `langForAcct()` が同じ古い印を読んで
いたので、偶然すり抜けていた。

**実機の話でもあります。**サインアウトを経れば `netOut()` が
`pullForget()` を呼ぶので覆われている。覆われていないのは
**トークンの有効期限が切れた端末の起動**：`netRead()` が refresh の答えより先に
`SESS` を戻し、`pullBoot()` がその account として訊き、答えが着いてから
セッションが落ちる。その人が扉でサインインすると、くるくるが回ったまま言語が
開かない。タイムライン・下書き・保存した検索・通知も、前のセッションのぶんの
答えを持ったまま進む。

## 直した形

`www/net.js` `netTook()` の `netCame`（＝直前にセッションが無かった＝扉）で
`pullForget()` を呼ぶ。`netLangSync()` より前、足元の `pullBoot()` より前。

```js
  if(netCame){
    if(typeof pullForget==='function') pullForget();
    langMineForget();
    LANG_WAIT=true;
    …
```

**patch ではありません。**条件を一つ足したのではなく、`netOut()` にしか無かった
文のもう半分を置いた ── `pullForget()` の頭のコメントが自分でそう書いています：
「every answer is forgotten when the session is」。セッションが終わるのと始まるのは
同じ一文の両側で、`netTook()` は他の四つ（`meFor` `postFor` `planFor`
`langTookFor`）について既にそうしています。

**r36 の設計は崩していません。**一覧は答えそのもの、数えない・決めない・上らない。
`LMINE` も `langHeld()` も `langMineIds()` も `netLangsGone()` も触っていません。

### 「電波が無いときは前に読み込んだ分を出す」について ── 手を入れていません

指示にあった「答えが来ていない端末でも `langHeld()` の言語は眺めるために開く」は
**やっていません**。測った原因がそこではなかったからです ── この端末は
`localStorage.clear()` の直後で、`langHeld()` は全部偽。原因は「答えが永遠に
来ない」ことで、答えが来るようにしたら 38 文字が揃いました。

規則 22 は「前に読み込んだ分は出て欲しい」と同時に「**Not built yet.** The slices
are in memory only, so with no signal there is nothing to show today」とも書いて
あります。`langForAcct()` に `langHeld()` の枝を足すのは、その未着手の章を
一枝だけ先に開けることで、**振る舞いの決めごと**です ──
`CLAUDE.md` § Deciding に従って手を出していません。**リーダーへ**（下）。

## 変えた file

| file | 何 |
|---|---|
| `www/net.js` | `netTook()` の `netCame` で `pullForget()`。一行と、なぜここなのかの節 |
| `tools/migrate-check.mjs` | case **7f** ── claim 三つ。probe は**外しました**（育てた形がこの三つ） |
| `docs/CHANGELOG.md` | 2026-09-15 の節。保存される物は変わらないので DELETE REVIEW は無し |
| `docs/scope/r37-migrate.md` | これ |

**`www/core.js` は触っていません**（原因がそこではなかった）。
**`www/index.html`・`docs/STATE.md`・`tools/acct-check.mjs` も触っていません。**

## 保存する物の変化 ── 無し。DELETE REVIEW は要りません

`PULL_GOT` は記憶だけで、ディスクにもサーバーにも無い。落ちるのは「もう訊いた」
という印だけ。答えそのものはそれぞれの持ち場（`LSL`・`lingua.posts`・
`lingua.take.<uid>`・`lingua.langs` …）にあり、一バイトも動きません。
人の作った物には触れていません。

**振る舞いは変わります**：扉をくぐった直後、アプリはサーバーへの問いをやり直す。

## 赤を見たか

- **元の 6 claim** ── 赤は既に見ていた（上の出力、指示どおり入れ直していません）。
- **新しい 3 claim（7f）** ── `pullForget()` の行を抜いて**赤を見てから**直しました：

```
the language somebody already has did not survive (9):

  signing in asks which languages this account has: got false, wanted true
  and the answer is in, so nothing is left waiting: got true, wanted false
  and the server is what said so: got false, wanted true
  every letter of a free alphabet reads a sound the chart has: got "a: no letter / …
  （以下、元の 6 つ）
```

元の 6 つは**症状**しか言いません（文字が無い）。7f の 3 つは**原因**を名指しします
── 扉が `language?owner=` を訊いたか／`LANG_WAIT` が落ちたか／
`langMineKnown()` が真か。次に同じ形で壊れたとき、読む人が道を辿らずに済みます。

## 回した check（単体のみ。全ゲートは回していません）

（下の「回した結果」に貼ります）

## 見た目 ── スクショは撮れませんでした

**どの画面も look は変わっていません。**markup も CSS も文字列も動いていない。
変わるのは「拒まれたトークンで起動した端末が、扉のあとどの状態に立つか」で、
その二つ（`LANG_WAIT` のくるくる／ふつうのアプリ）は**どちらも今のアプリが既に
描く画面**です。

**それでも状態の写真は撮ろうとして、撮れませんでした。**正直に書きます：

- `tools/shot.mjs` は `tools/fixture.mjs` の「サインイン済み・言語あり」から種を
  まくので、「**サーバーがトークンを拒んだ起動のあとサインインした端末**」には
  立てない。
- `migrate-check` の harness から撮ってみたが、そこは空の `localStorage` から
  始まるのでオンボーディングの splash のままで、**壊れた側と直した側が同じバイト
  になった**（md5 一致）。撮った二枚は消しました。
- `CLAUDE.md` は「届かない状態は `tools/fixture.mjs` で届くようにする」と書いて
  いますが、`fixture.mjs` は**この scope の外**で、面を一つ足すと `press` と
  全部の walk の数が動きます。**リーダーへ**（下）。

## CODE CONFIRMED / DEVICE CONFIRMED

- **CODE CONFIRMED** ── 下の check。7f の 3 claim は赤を見てから直しました。
- **DEVICE CONFIRMED ── ありません。**実機では一度も押していません。
- **OWNER CONFIRMED ── ありません。**

**実機で見る所**（`docs/CHECK-0907.md` は触っていないので、ここに書きます）：
しばらく開いていない iPhone ── トークンの有効期限が切れた端末 ── でアプリを開き、
サインインの扉が出たらサインインする。**言語が開くこと**（くるくるで止まらない）。

## リーダーへ ── 二つ、私の持ち場の外

1. **`www/sns.js:829` の一語** ── `pullOn('mylangs', askLangs)` に三つ目の引数が
   無い。`PULL_HAS` は「その答えがどこに在るか」の列で、`day` は `dayGot`、
   `blocks` は `netBlockedGot` を持っています。`mylangs` の答えは
   `langMineKnown()`（`www/core.js` § LMINE）なので、
   `pullOn('mylangs', askLangs, langMineKnown)` にすれば
   **`PULL_GOT['mylangs']` と `LMINE` という同じ問いの二つ目の記録が消えます**
   （`CLAUDE.md` § Simple）。今回の直しはその二つを**同じ場所で忘れる**ことで
   食い違わなくしただけで、二つあること自体は残っています。
   一点だけ判断が要ります：`askLangs()` は二つ訊く（`netLangsDown` と
   `netTakes`）ので、`netLangsDown` だけ通って `netTakes` が落ちた時、
   `hav()` が真になって render の側の訊き直しが断られます（人が押す
   ［再接続］は `pullGo` なので断られません）。**振る舞いの判断なので手を出して
   いません。**
2. **`tools/fixture.mjs` に面が要ります** ── 「トークンを拒まれた起動のあと扉を
   くぐった端末」。今はどの道具もその状態を写真に撮れません（上）。足すと
   `press` の数が動くので、動かす人が数を書き留める必要があります。
