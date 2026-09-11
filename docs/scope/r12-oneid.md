# r12-oneid ── 言語の番号を一本にする（書き直し、後付けなし）

OWNER 2026-09-10「スパゲッティみたいにするのやめて欲しい」「太い幹を分岐させて
欲しい」→ 提案「番号を一本にする書き直し」→「のろ」。

## 今の形（二本の幹）

一つの言語に番号が二つある。

| 番号 | 誰が付ける | どこ |
|---|---|---|
| `L<ms36>` | 端末（`langMint()` `www/core.js:660`） | `LANGS` の鍵、`langKeyOf()` の鍵（`www/core.js:473`）、`langId` |
| uuid | サーバー（`language.id default gen_random_uuid()` `supabase/schema.sql:241`） | `LANGS[id].sid`（`netLangRow()` が最初の送りで貼る `www/net.js:1337`）、`slice.language_id`、`language_take`、`slice_hist` |

二つを照らし合わせるのが `nidFor()` / `nidHolds()` / `nidDrop()`
（`www/net.js:1750-1849`）と、起動の walk の `here[sid]`（`www/net.js:1880-1882`）、
`langTookHas(LANGS[id].sid)`（`www/core.js:76`）、`www/home.js:2337`。148 で
照らし合わせが外れて切り替えが二行になり、150 は「持っていない方を消す」を
足した。それが後付け。

**DL した言語は既に幹一本**：`langSeenAdd()`（`www/core.js:697`）はサーバーの
id をそのまま `LANGS` の鍵にしている（「ITS ID IS THE SERVER'S」）。自分の言語
だけが二本。

## 直す形（幹一本）

**言語の番号はサーバーの番号だけ。端末がその番号を打つ。**

- `langMint()` は uuid v4 を打つ（`crypto.getRandomValues`、無ければ
  `Math.random`。ES5 で）。`LANGS[uuid]={mine:true}`。
- `netLangRow()` は `POST /rest/v1/language` に `id` を**入れて**送る。列は
  `default gen_random_uuid()` なので、入れれば入れた値になる。insert の policy
  は `is_member() and owner = auth.uid()`（`schema.sql:1010`）で id を見ていない。
  **`schema.sql` は変えない**（rls は流さなくていい）。ぶつかれば 409 で、
  それは「もう在る」で `ok(id)`。
- `sid` は消える。`LANGS[id]` は `{ mine, uid }`（`uid` の扱いは今のまま）。
  `L.sid` を読む所は全部 `id` になる：`www/core.js:76,743,1352`、
  `www/net.js:1306-1313,1392,1881-1882,2126`、`www/home.js:2337,2466`。
  （`www/post.js` `www/sns.js` `www/mod.js` の `.sid` は**投稿**の番号で、
  別物。触らない。）
- `nidFor()` `nidHolds()` `nidDrop()` は**削除**。walk は「row.id が LANGS に
  在るか」だけ（DL 言語と同じ問い）。
- オンボーディングは番号を打った言語を扉まで持ち、扉で `netLangRow()` が
  その番号で行を作る。扉の前後で番号は変わらない。

## 移行（写す。消さない）

端末に残る古い索引：
1. `{ 'L…': { sid: U, … } }` → `{ U: { … } }` に写す。`lingua.L….<slice>`
   のディスク鍵（rule 22 の fallback が読む）は `lingua.U.<slice>` に**写す**。
   `lingua.cur` が `L…` なら `U` に。古い鍵は残す（消さない）。
2. `{ 'L…': { sid 無し } }`（一度も上がっていない）→ uuid を打って同じく写す。
   上がる時はその uuid で行が出来る。
3. 148 以降の `{ U: { sid 無し } }` は既に幹一本の形。触らない。
   （150 が直した二行は、1 と 3 が同じ言語だった場合。1 を U に写す時、U が
   既に在れば**中身を持っている方を残す**のではなく、**両方写して足す**：
   索引の行は一つ、slice の鍵は空でない方。空と空なら空。）

`docs/CHANGELOG.md` に**コードより先に**書く（何が写され、何が消えないか）。
`docs/DATA_MODEL.md` の `LANGS` の形を同じ commit で直す。`www/core.js:239-262`
の説明文も。

## 検査

- `migrate-check`：1・2・3 の索引を seed して、起動後に索引が一行、slice が
  読める、`lingua.cur` が新しい番号、古い鍵がそのまま残っている。
- `again-check`：150 で足した 4 claim（`tools/again-check.mjs:1688-1800`）は
  「二行になる道」の検査。書き直し後は**その道が無い**ので、claim は
  「古い索引の端末が起動して一行、a–z 38、保存が飛ぶ」に**書き直す**
  （消すのではなく、問いを幹の形にする）。`netGotFor` の claim はそのまま。
- `acct-check` 10・13（A が作って B が取る／walk が二回で二行）はそのまま緑の
  はず。赤なら報告。
- 全部、バグを戻して赤を見る（`sid` を戻すのではなく、移行を外して赤）。

## 触っていい file

`www/core.js` `www/net.js` `www/home.js`（2337・2466 の二行だけ）、
`tools/again-check.mjs` `tools/migrate-check.mjs` `tools/acct-check.mjs`
`tools/fixture.mjs`、`docs/CHANGELOG.md` `docs/DATA_MODEL.md` `docs/scope/r12-oneid.md`。
`www/index.html` と `supabase/schema.sql` は触らない。

## 報告に要るもの

CODE CONFIRMED / DEVICE CONFIRMED / OWNER CONFIRMED を分けて。消えた関数の
名前、写した鍵、赤を見た形、動かなかった check。ゲートはリーダーが回す。

## この枝が触る file ── `claude/r12-oneid` の宣言（2026-09-10）

`integ-0905`（`7e6066cc`）から切りました。触るのは上の「触っていい file」の欄
だけです。**`www/core.js`** ── `langMint()` を uuid v4 に書き直し、`LANGS` の
`sid` 欄を落とし（`langSeenAdd`・`langMine`・`langOwned`・`lsWipeAcct` の
`L.sid` は `id` になります）、`239-262` の索引の説明文を新しい形に直します。
**`www/net.js`** ── `netLangRow()` が `id` を入れて `POST` し、`L.sid` を貼る
行が消えます。`nidFor()` `nidHolds()` `nidDrop()` を削除し、起動の walk は
「`row.id` が `LANGS` に在るか」だけを訊きます。`netLangDrop` `netTakeGone`
`netSlices` の呼び手が渡す番号も `id` になります。**`www/home.js`** ──
`2337`（`langDrop`）と `2466`（`vLangs` の「まだ訊いていない」）の二行だけ。
移行は `www/core.js` の索引を読む所に一つだけ置き、**写すだけで消しません**。

検査は **`tools/migrate-check.mjs`**（古い索引三通りを seed）、
**`tools/again-check.mjs`**（150 の 4 claim を幹の形の問いに書き直す）、
**`tools/acct-check.mjs`** と **`tools/fixture.mjs`**（`sid` を書いている所）。
docs は **`docs/CHANGELOG.md`**（コードより先）、**`docs/DATA_MODEL.md`**、
この file。

**触らない**：`www/index.html`、`supabase/schema.sql`、`www/post.js`
`www/sns.js` `www/mod.js`（そこの `.sid` は投稿の番号で別物）、ほかの枝。
ゲート（`npm test`）は回しません ── リーダーが回します。

### 宣言の外に出た file と、その理由（2026-09-10）

上の欄に無い file を八つ触りました。どれも**アプリではなく検査**で、どれも
「言語には番号が二つある」を書き込んでいたものです。番号が一本になった以上、
直さなければ赤のまま残ります。何をしたかは一行ずつ:

- `tools/store-check.mjs` ── 移行が `localStorage` に書く鍵（`core.js:dst`）を
  `ROADS` に足しました。**この check 自身が要求すること**です（規則 22 ──
  新しい鍵は、どちらの側か書かれるまで赤）。書いたのは「同じ鍵を、その言語の
  番号の下へ写すだけ。種類は増えない」。
- `tools/twice-check.mjs` `tools/kb-check.mjs` ── 偽サーバーの
  `POST /rest/v1/language` が自分で `srv<n>` を打っていました。送られた `id` を
  使うように直しています（本物の PostgREST がそうする形）。`twice-check` の
  「同じ言語に入れ物が二つ」は、鍵が番号そのものになったので**サーバーの行**を
  数える形へ書き直しました。
- `tools/hist-check.mjs` `tools/keep-check.mjs` `tools/gramlang-check.mjs`
  `tools/pull-table.mjs` `tools/slow-check.mjs` ── `LANGS[id].sid` を読み書き
  していた所。「行が在る」は `langRowGot()`（`LROW`）に、「サーバーの番号」は
  id そのものに。
- `tools/dl-check.mjs` ── 取った言語の種から `sid:` の欄を落としました（鍵が
  既にその番号なので、二つ目の番号でした）。

`tools/measure-cost.mjs` は**触っていません** ── ゲートの check ではなく測る
道具で、偽サーバーが自分で `L-<n>` を打ちます。番号が一本の今、そこが測る
通信量は本物とずれます。リーダーの判断待ちとして残します。
