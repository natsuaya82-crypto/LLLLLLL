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
