# claude/r35-main ── 主言語＝一番古く作った言語。無料はそれだけ出て、それが開く

- Goal: 2026-09-12 のオーナー決定を入れる。
  「無料はそもそも1つの言語しか出ないやろ。一番最初に作ってた作り込んでた言語
  だけ表示であとは隠すだろ」「そもそも最初に作った言語を主言語にして、フリーに
  した時に最初に表示されるようにしないとダメでは？」
  1. **主言語＝このアカウントが一番古く作った言語**（サーバーの
     `language.created_at` が一番古い、`LW_MINE` の物）。これはサーバーが
     `profile_seen.lang_id` で既に答えている規則と同じ
     （`language_seen` を `created_at asc limit 1`、`supabase/schema.sql:1341`）
     ── **二つ目の規則を作らない**。
  2. **一覧の畳みは created_at の古い順に cap 本**（無料 1、pro 3）。
     「並び順の先頭 cap 本＋開いている物を差し替える」を消す。
  3. **無料に落ちた瞬間、開いている言語が畳まれる側なら主言語が開く。**
     段が上がる時は何もしない。
- Owns (may change):
  - `www/core.js` ── 新しい `LMADE`（`langMadeKey`/`langMadeGot`/`langMadeOf`）、
    新しい `langsByAge()` と `langMainId()`、`planTook()`（`:1974`）の末尾に呼ぶ
    一行。**`planTook()` の中身そのものと段の道は触らない**（r34 の隣）
  - `www/home.js` ── `langsSeen()`（`:2554`）と `vLangs()`（`:2574`）
  - `www/net.js` ── `netLangsDown()`（`:2126`）と `netTakenDown()` の `select=`
    に `created_at` を足す、`netLangsWalk()`（`:1951`）が `langMadeGot()` を呼ぶ
    一行。**`netPlanVerify()` には入らない**（r34）
  - `tools/dl-check.mjs`（既にある `langsSeen` の claim ── 開いている物の
    差し替えが消えるので、その一本を新しい規則の claim に書き替える）
  - `tools/plan-check.mjs`（新しい claim 五本）
  - `tools/store-check.mjs`（新しい `.got` の road ── 要るなら）
  - `docs/FEATURE_RULES.md`（決定ログ 2026-09-12 に (i)）、`docs/DATA_MODEL.md`、
    `docs/PAID_FEATURES.md`、`docs/CHANGELOG.md`、`CLAUDE.md` 規則 22、
    `docs/scope/r35-main.md`、`shots/r35-*.png`
- Does NOT own: それ以外すべて。名指しで、**並行している `claude/r34-lapse` の
  持ち物**である `supabase/schema.sql`、`supabase/functions/verify-plan/*`、
  `supabase/setup.md`、`www/settings.js` の `openCapLapse` 周り、`www/net.js` の
  `netPlanVerify()`、`www/shell.js` の `#pop`。ほかに `www/index.html`、`ios/`。
  `docs/CHANGELOG.md` は r34 も書くので、節を分けて足すだけにする
- Decision it implements: `docs/FEATURE_RULES.md` § 2026-09-12（このブランチが
  (i) を足す）
- Check to run: 触った check と `npm run press` 一回だけ。**全ゲートは回さない**
- 新しく写す物: `lingua.<id>.made.got` ── `language.created_at` の写し。
  `langNameOf`／`langWsysOf`／`langOwnOf` と同じ形（メモリ＋ディスクの写し、
  `slGot()` 一本、上る道なし、`wipeLangsGo()` と `lsWipeAcct()` が取る）

## 報告

枝 `claude/r35-main`（`origin/integ-0905` = `24561793` から）。報告の前に
`git fetch --all --prune` して、追いつく必要が無いことを確かめた ── `24561793`
は HEAD の祖先。commit は六本、一件ずつ、毎回 push 済み。

### 1. 写す物が一つ増える ── `lingua.<id>.made.got` ── `bbb675a5`

- **触ったもの**：`www/core.js` § LMADE（`langMadeKey`/`langMadeGot`/
  `langMadeOf`）、`www/net.js`（二つの ask の `select=` に `created_at`、
  `netLangsWalk()` が `langMadeGot()` を呼ぶ一行）。
- **保存**：`language.created_at` の写しがディスクに一枚。`langNameOf`／
  `langWsysOf`／`langOwnOf` と同じ形 ── メモリに答え、ディスクに写し、
  **上る道なし**（`slGot()` 一本で書くので `slMine()` が見つけられない）。
  `lingua.<id>.` の下なので `wipeLangsGo()` と `lsWipeAcct()` が取る。
  `store-check` は `core.js:slGotKey(k)` の road が既に覆っている（緑を見た）。
- **SQL は一行も要らない**：`language.created_at` は既に在り、
  `language_seen` も既に出している。`supabase/schema.sql` は触っていない。

### 2. 一覧は作った順に畳む ── `bbb675a5`

- **触ったもの**：`www/core.js` § langsByAge、`www/home.js`（`langsList()` を
  切り出し、`langsSeen()` から差し替えの行を外した）、`tools/fixture.mjs`
  （三本持っている面を二つ）。
- **振る舞い**：畳む時に残るのは **created_at の古い順に天井の数だけ**。
  今までは `Object.keys(LANGS)` の並び ── この端末がその言語の行をいつ受け
  取ったかの順 ── だったので、二台目で入り直すと無料で出る一本が変わっていた。
- **消した行**：`out[out.length-1]=langId`。これは 2026-09-02「開いてるものを
  残すでいいよ」の行で、**無料で出る一本を「たまたま開いていた言語」にして
  いた**。守っていたこと（立っている言語は一覧に在る）は 3 が守る。
- **答えが無い言語は最後**。まだサーバーへ行っていない言語は一番新しいので。

### 3. 無料に落ちた瞬間、主言語が開く ── `bb9a00ca`

- **触ったもの**：`www/core.js` § langMainId・§ langMainFall、`planTook()` の
  末尾に一行（`render()` の前）。
- 順を決める所（`langsByAge`）と主言語を答える所（`langMainId`＝その先頭）が
  同じ一箇所なので、一覧と食い違えない。`langMainFall()` は `langsList()`
  ── `vLangs()` が描くもの ── に訊く。**判定を二つ書いていない。**
- 段が**上がる**時は何も起きない（天井が上がって一覧から落ちることはない）。
  段が**届いていない**間も何も起きない（`langCap()` が `null`）。
  **誰の物か答えが来ていない言語に立っている時も動かない**（`LW_WAIT` は
  「一覧に無い」ではない）。

### 4. claim ── `4aaa72a6`

`plan-check` 第 8 節に五本、`dl-check` の一本を書き替え。三本の言語に
`langMadeGot()` で日付を入れ、**二番目に作ったものに一番古い日付**を与えた ──
索引の並びで畳む版なら一本目を出して緑になるため。

**赤を二度見た。**

| 戻したバグ | 赤くなったもの |
|---|---|
| 並べ替えを外す（`langsSeen` が索引順、`langMainId` が `langsByAge` を通らない） | 五本のうち四本 |
| `planTook()` から `langMainFall()` の一行を外す | 「落ちた瞬間」の一本**だけ**、他は緑のまま |

### 5. docs ── `3f912445`、rename ── `a3239686`

`docs/FEATURE_RULES.md` 決定ログに新しい一件（原文）。2026-09-12 の既存の節は
**「朝の六つ」**と自分で名乗っているので、そこに七つ目を足すとその見出しが嘘に
なる。別の項目にして、2026-09-02 の「開いてるものを残すでいいよ」が置き換わった
ことをその場に書いた。`docs/DATA_MODEL.md`（列の五つ目）、
`docs/PAID_FEATURES.md`（「無料に戻ると何が短くなるか」の言語の行）、
`CLAUDE.md` 規則 22（索引の段落）、`docs/CHANGELOG.md`（コードより先に書いた）。

`a3239686` は改名だけ、振る舞いは一行も変えていない：`langsOld` → `langsByAge`。
`langsOldId()`（`www/core.js`）が「古い版のアプリが書いた id」で、一文字違いで
別の「古い」が二つ立っていた。

### 回した検査

| | |
|---|---|
| `npm run plan` | 緑。新しい五本を含む |
| `npm run dl` | 緑。書き替えた一本を含む |
| `npm run press` | 緑。`buttons pressed: 16777 (276/277 distinct names)` |
| `es5` `dead` `act` `store` `i18n`（pre-commit） | 毎コミット緑 |

**全ゲートは回していません**（規則どおり）。

**`press` の数が 16753 → 16777（+24）**。足したのは `tools/fixture.mjs` の面
二つだけで、他に画面へボタンを足した行はありません。名前の被覆は 276/277 で
**動いていません**。

**`never pressed: saveName` は前からです。**推測ではなく測りました ──
`origin/integ-0905` を worktree に出して `press` を回し、同じ一件が同じように
出ることを見てあります（16753、276/277、`saveName`）。

**この機械では `press` が二回に一回ほどタブごと落ちます**（`Target crashed`）。
**これもこの枝のものではありません** ── `origin/integ-0905` でも同じ落ち方を
しました。落ちなかった回が上の数字です。

### やり残し ── 隠れた言語を開ける道が一本、まだ残っています

指示の「`langOpen` を呼ぶ所を読む」の答えです。`www/` の呼び出しは五箇所：

| 所 | 隠れた言語を開けるか |
|---|---|
| `www/act-map.js:85`（一覧の行） | **開けない。**畳まれた言語には行が無いので押せない |
| `www/core.js:1295`（`langNew()`） | **開けない。**`langStop()` が天井で止めるので、作れた言語は必ず天井の内側 |
| `www/core.js:1661`（`langMainFall()`） | **開けない。**開くのは主言語 |
| `www/core.js:1822`（`langForAcct()` が新しく作る） | **開けない。**アカウントが一本も持っていない時だけ |
| **`www/core.js:1805`（`langForAcct()` が既にある物を開く）** | **開ける。** |

最後の一本の中身：

```js
  for(id in LANGS)
    if(Object.prototype.hasOwnProperty.call(LANGS, id) && langOwnOf(id)===me){
      langOpen(id); return true;
    }
```

**索引の並びで最初の一本**を開きます ── 作った順ではありません。無料で三本
持っている人（段が落ちたあと）がサインインすると、**隠れている言語に立たされる
ことがあります**。呼ぶのは二箇所：扉（`netTook()` の道）と、
`www/settings.js` の「この言語を削除」のあと。`planTook()` より後に走れば
`langMainFall()` は既に終わっているので、拾われません。

**直していません。**指示が「残っていれば scope に書く」なので、そのとおりに
しました。直すなら一行で、`langMainId()` を使って同じ規則を一箇所から読む形に
なります（`langOwnOf(id)===me` の集合と `LW_MINE` の集合は同じです）。
**リーダーの判断待ちです。**

### 触っていないもの

`supabase/schema.sql`、`supabase/functions/verify-plan/*`、`supabase/setup.md`、
`www/settings.js`、`www/shell.js`、`www/index.html`、`ios/` ── いずれも
`claude/r34-lapse` の持ち物か、この枝の範囲外。`www/net.js` は `netPlanVerify()`
に入っていません（触ったのは `netLangsDown()`・`netTakenDown()` の `select=` と
`netLangsWalk()` の一行だけ）。`docs/CHANGELOG.md` は r34 も書くので、節を
一つ足しただけです。

### CODE CONFIRMED / DEVICE / OWNER

- **CODE CONFIRMED** ── 上の三件すべて。`plan-check` の五本と `dl-check` の
  一本が緑、うち二つのバグを戻して赤を見た。`press` 緑。
- **DEVICE 未確認** ── 実機では一度も動かしていません。段が実際に落ちる瞬間
  （`verify-plan` が `free` を返す）は、この機械では作れません。
- **OWNER 未確認** ── 写真二枚：`shots/r35-langs-free-ja.png`（1 本＋「非表示
  2」）、`shots/r35-langs-pro-ja.png`（古い順に 3 本）。

### リーダーの指示が間違っていた所

一件。指示は「`docs/FEATURE_RULES.md` 決定ログ 2026-09-12 に (i) …を原文で」
でしたが、その日の節は**「朝の六つ」**と自分で名乗っていて、決定は (a)〜(f) の
六つで閉じています。七つ目を足すと見出しが falsify されるので、**別の項目**に
しました。中身は指示のとおりです。

もう一件、指示の外で気づいたこと：`langsSeen()` から差し替えの行を外すと、
**読む側（`dlCap`）の一覧も**「開いている取った言語が畳まれる側にあると落ちる」
ようになります。指示は「読む側の畳みは触らない」でしたが、`langsSeen()` は
一つの関数で両方に使われているので、外す＝両方に効きます。`langMainFall()` が
**両方の一覧**（`langsList()` の `mine` と `reading`）を見るようにしてあるので
穴は埋まっていますが、**開かれるのは主言語です**（取った言語ではありません）。
それが違うなら、そこは決めごとです。

## 追記 ── リーダーの二つの答えを入れて、integ-0905 を取り込みました（2026-09-12）

- **(1) `langForAcct()` は `langMainId()` を読む一行になりました**（`d0e432c3`）。
  索引を舐める五行の**書き直し**で、後付けではありません。`acct-check` 73
  「サインイン直後に開くのは、そのアカウントが一番古く作った言語」── 索引の先頭
  （Lx）と一番古いもの（Ly）をわざと食い違わせてあります。**赤を見ました**：
  舐める五行を戻すと 73 だけが `Lx ≠ Ly` で赤、33 は緑のまま。
  **報告の「やり残し」の節は、これで閉じました。**
- **(2) 読む側で畳まれた時も主言語が開く**を決定ログに書きました（`8a2badb4`）。
  サインイン直後の一文も同じ項に足しています。**開かれるのはその人が作った一番
  古い言語**で、畳まれた「読んでいる言語」ではありません ── 人からもらった言語は
  誰の主言語でもないからです。
- **`git merge origin/integ-0905`**（`b7303d90`）。**衝突は `docs/CHANGELOG.md`
  一件だけ**で、両方が同じ日に「Unreleased」の先頭へ別々の節を足したものです。
  **両方残しました。**`www/core.js` は自動で合いました ── r34 は `planTook()` の
  隣と `langCap()` のコメント、r35 は `LMADE`・`langsByAge`・`langMainId`・
  `langMainFall` と `langForAcct` の一行で、触った行が重なっていません。
  取り込んだあと `supabase/`・`www/settings.js`・`www/shell.js` は
  `origin/integ-0905` と一バイト違いません（`git diff` で確かめました）。

### 取り込んだ形で回した検査

| | |
|---|---|
| `npm run plan` | 緑（exit 0、`FAILED  ` の印ゼロ） |
| `npm run acct` | 緑（`✗` ゼロ）。73 を含む |
| `npm run dl` | 緑（exit 0） |
| `npm run press` | 緑。`buttons pressed: 16777 (278/279 distinct names)` |

**全ゲートは回していません。**

**名前の被覆が 276/277 → 278/279 になりました。**足したのは r34 で、押された数
（16777）は動いていません ── 取り込みで名前が二つ増え、二つとも押されています。
`never pressed: saveName` は前からで、`origin/integ-0905` を worktree に出して
測ってあります。

**訂正が一つ。**取り込み直後に「`plan-check` が一本赤」と読みましたが、**赤では
ありません**。`grep -c FAILED` が拾ったのは、緑の claim 自身の文の中にある
"the read that FAILED could turn a paid plan into a free one" という言葉でした。
印は行頭の `FAILED  ` で、それはゼロ、exit も 0 です。

**CODE CONFIRMED**（上の四本）。**DEVICE 未確認**。**OWNER 未確認**。
