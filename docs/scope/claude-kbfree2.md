# claude/kbfree2 ── 無料でも有料と同じ数の枠が並ぶ／設定へ飛ぶボタンを手順 1 にも

```
キーボードの画面無料だと何で1個なの？
一覧が並ばないの？無料も有料も同じ画面っちうルールは？
```
```
後これも、この画面まで飛ぶリンクあったはずなのに無くなった？
```
```
１にもほしくない？
```
OWNER 2026-09-03

一つ目は、2026-09-01 の「無料でもplusでもproでも同じ画面なのよ」に**反していた
状態**です。`www/keyboard.js` の `HELP.kb` のコメント自身がその決定を引用して
いるのに、キーボードの画面は無料だと一覧が無く、盤が一つだけでした。

## いま起きていること

`vKb()`（`www/keyboard.js:2311`）は無料で早く返ります:

```js
if(!can('kb'))
  return '<div class="view">'+navTop('', helpQ('kb'))+'<div class="body">'+
    kbHTML(null, true)+ kbSysHTML()+ '</div>'+
    (langLocked()? '' : '<button class="fab"'+DO('kbNew')+ …)+ '</div>';
```

一覧（`kbListHTML()`）はその下、有料の側にしか在りません。そして
`kbBoards()`（`:895`）は無料で**空**を答えます:

```js
function kbBoards(){
  if(!can('kb')) return [];
  return [kbFree()].concat(kbStored());
}
```

だから無料には行が一つも無く、`?` の隣に盤が一枚だけ立っていました。

## 作るもの ── 1. 無料でも枠が並ぶ

**一覧は一つになります。**無料の早い返しを消して、`vKb()` は両方の段で
`kbListHTML()` を描きます。枠は**今ある行と同じ形**（`.kblist .kbrow`）で、
`www/index.html` には**一行も足しません** ── 新しいクラスが要らないので。

- **一つ目は今までどおり。**`kbBoards()` は無料で `[kbFree()]` を答えます。
  **`kbStored()` は足しません** ── Plus から無料に落ちた人の作った盤を無料の
  一覧に出すと、`kbOf()` の `!can('kb')` が守っている「段が切れたら無料の
  QWERTY に戻る」が画面の側から破れます。作ったものは storage に残り、
  何も消えません
- 押すと board 0 の頁（編集の無い QWERTY）です。`kbClamp(a, 1)` が常に 0 を
  答えるので、**無料で編集の枝に入る道はありません**
- **二つ目以降の枠は `kbNew` を名乗ります。**`kbNew()` は既に
  `upStop(can('kb'))` で「上限に当たったらプランへ」をやっています
  （`popAsk(t('up.need'))` → `go('plans')`）。**二つ目の仕組みは作りません**
- **説明文は書きません。**枠が在って、押すとプランへ行く ── それだけ
- **`+` は無料で消えます。**`kbListHTML()` の `+` は `kbRoomKb()` が真のときだけ
  で、無料では偽です。枠が戸口なので、戸口は一つです
- **`kbCap()` の数は触りません**

### 枠の数 ── 一箇所（`kbSlots()`）で、`PLUS_KB` を読みます

**ここはリーダーの指示が間違っています。**指示は「上限は `kbCap()`（無料 1・
Plus 1・Pro 3）」「枠の数は Pro の数」と書いていますが、**1・1・3 は
`langCap()` の数**です。`kbCap()` は `FREE_KB=1`・`PLUS_KB=4`・Pro は
`Infinity`（`www/core.js:773`、「1,1+3.無制限って言わなかったっけ？」）。
**Pro の数は Infinity なので、枠として並べられません。**

なので**有料の有限の上限＝`PLUS_KB`（4）**を読みます。オーナーの
「有料と同じ数」を、オーナーが既に決めた数から取っているだけで、新しい数は
作っていません。**Plus の一覧が持てる行数はちょうど 4**（`kbRoomKb()` は
`1+kbCount() < kbCap()` なので、無料 QWERTY 1 枚＋作った 3 枚で止まる）。

```js
function kbSlots(){ return can('kb')? kbBoards().length : PLUS_KB; }
```

**有料の画面は行数が変わりません。**枠が並ぶのは無料だけです ── 有料の戸口は
`+` で、そこに枠を足すと同じ戸が二つになります。

**オーナーに確かめる一行:** 枠は 4 で合っているか。違うなら
`kbSlots()` の一行です。

## 作るもの ── 2. 設定へ飛ぶボタンを手順 1 にも

`HELP.kb`（`www/keyboard.js:3310`）の**手順 3 の中**に `kbSettings` のボタンが
あります。**手順 1 にも同じボタンを置きます。**

- **同じ関数を呼びます。**`kbSettings()` は一箇所のままです
- **文言は既に在る `kb.sys.go`。**新しい鍵は作りません
- `act-check` は「誰も名乗らないエントリ」を落としますが、同じ名前を二箇所から
  名乗るのは問題になりません（`act-map.js` の**重複エントリ**が禁じられている
  のとは別の話です）

## 検査 ── `tools/kb-check.mjs`

**既に在る無料の章が、私の変更で嘘になります。**あの章は `NAV=[{r:'kb'}]` に
立って `#kb .kbrow` を数えていて、そこは今日から**一覧**なので `#kb` が無く
なります。だから既存の主張は `{r:'kb', a:'0'}`（board 0 の頁）に立たせ直し、
一覧についての主張を新しく足します:

- 無料でも枠が `PLUS_KB` だけ並ぶこと
- 一つ目は QWERTY で、押しても編集に入らないこと
- 二つ目の枠を押すと、プランの画面に着くこと
- 無料の board が増えていないこと（`KB` は `null` のまま）
- 設定へ飛ぶボタンが**手順 1 と手順 3 の両方**に在ること

**全部、バグを入れて赤を見てから**信じます。

## 私のファイル

```
www/keyboard.js
www/index.html      （触らない見込み。新しいクラスを作らないので）
tools/kb-check.mjs
docs/CHANGELOG.md   docs/FEATURE_RULES.md   docs/keyboard.md
docs/scope/claude-kbfree2.md
```

`www/shell.js` は `claude/keep` のものです。**読むだけ。**

## 知っていること

**`claude/keep` が同じ `www/keyboard.js` を触っています**（`9a3ebfbf`、
2026-09-03、+31/−8）。触っている場所は `kbSetNm` / `kbNameHTML` と、`vKb()` の
**編集の枝の直前**に足した `kbKeepOn();` の一行です。私が書き換えるのは
`kbBoards()` / `kbListHTML()` / `vKb()` の**無料の枝と一覧の枝**と
`kbMoreQ()` / `HELP.kb` なので、**同じ行は欲しがっていません**が、`vKb()` は
同じ関数です。**取り込みはリーダー（またはサブリーダー）のものです。私は
`claude/keep` を取り込みません。**

`claude/detailed-tasks-execution-ak61z2` も `www/keyboard.js` と
`www/index.html` を持っていますが、2026-08-15 の枝で、基点は 08-11 です
（`claude/kbfree` は master に入っています）。

`tools/fixture.mjs:1999` のコメントが「walk は無料プランで走るので
`kbBoards()` は空」と言っています。**この一文は今日から嘘になります。**
`tools/fixture.mjs` は私のファイルではないので直しません ── 報告に書きます。

## 言えないこと

**ゲートは回しません**（`docs/SESSIONS.md` 規則 7）。速い九本と
`npm run kb` の赤だけです。実機は `DEVICE CONFIRMED` で、別の文です。
