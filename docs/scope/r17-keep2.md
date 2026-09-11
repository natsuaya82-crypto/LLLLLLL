# r17-keep2 ── 保存ボタンが無い六つに、保存ボタンを付ける

オーナー 2026-09-11：「保存ボタンないところは直して」
OWNER 2026-09-03：「保存ボタン必要なとこ全部」「打ったら覚える、ボタンが書く」

`integ-0905` の `71ddf85c` から切った `claude/r17-keep2` で作業します。

## 何を直すのか

`docs/scope/r14-keep.md` の**表 E** ── 保存ボタンが**無く**、押した瞬間に
言語へ書き込む六つ。r14 は「光らない」と「ボタンが無い」を別の問いとして
分け、E は触らずに並べました。オーナーがその E を直せと言ったので、この枝が
それをやります。

六つとも、押した瞬間には**言語に書かず**画面の持ち物を変え、`keepOn()` の
`now()` がそれを答え、右上の保存で書く ── 打った字と同じ一本の道
（`www/shell.js` § KEEP）。**押した瞬間に書く道は削除します。**二本にしない
（CLAUDE.md §「シンプル、バグは書き換え」）。

| 画面 | 押すと変わるもの | file |
|---|---|---|
| 音の一覧 `form snd:` | `ltTakeSnd` | `www/sound.js` |
| 人の文字をもらう `form pick:` | `takeOwn` `ltTakeChar` | **`www/home.js`** ← 下 |
| 綴りの頁 `spell` | `spAdd` | `www/wordsheet.js` |
| 新しい語の紙 `form add:` | `wdDerive` ほか | `www/wordsheet.js` |
| 段の枠 `form slot:` | 語を入れる | `www/phases.js` ← 最後 |
| 例文 `form stex:` | `stAddEx` `stDelEx` | `www/phases.js` ← 最後 |

## 止まって訊くこと（二件）

**一。`pick` は `www/me.js` ではなく `www/home.js` にあります。**
`openPick` `takeOwn` `ltTakeChar` `pkSwitch` `chTaken` はすべて
`www/home.js` 300-370。`www/me.js` に `takeOwn` はありません（grep 済み）。
渡された「触っていい file」に `www/home.js` は入っていないので、**この画面は
リーダーの合図が出るまで触りません。**

**二。`slot` は `www/phases.js`（`openSlot`）です。**「phases.js は最後」の
指示に入るので、`stex` と同じく合図待ちにします。

なので先に終えるのは **`snd` `spell` `add` の三つ**です。

## 触る file

- `www/sound.js`（snd）
- `www/wordsheet.js`（spell、add）
- `www/letters.js`（必要なら ── `ltSetChar` `spRdOK` の側）
- `www/shell.js`（必要なら KEEP の側だけ）
- `www/act-map.js`
- `tools/keep-check.mjs`、`tools/fixture.mjs`
- `docs/scope/r17-keep2.md`（この file）、`docs/CHANGELOG.md`
- `shots/`（スクショ）

合図が出たら追加で：`www/home.js`（pick）、`www/phases.js`（slot、stex）。

## 触らない file

`www/index.html`、`www/net.js`、`www/core.js`、`www/home.js`（合図まで）、
`www/phases.js`（合図まで）。必要になったら止まって理由を書きます。

## やらないこと

- 他の枝を merge / rebase / cherry-pick しない
- ゲート全体（`npm test`）は回さない。`npm run keep`、`npm run press`、
  `npm run act`、速い九つだけ
- r14 の C（選ぶ・開く・折り畳む）は灰のまま
- 表 E を**読んだまま**では直さない ── 六つとも先に測り、押した瞬間に
  何が書かれるかを確かめてから書き換えます（CLAUDE.md §「原因は憶測
  しない」）

## 検査

`tools/keep-check.mjs` は保存ボタンを持つ全画面を**画面から**取るので、
六つが保存ボタンを持てば自動で問われます。`npm run keep` 緑、そのあと
バグを戻して赤を見る（`ltTakeSnd` を元の即書きに戻す → 赤）。

見た目が変わる（右上に保存が出る）ので、各画面「開いた時／変えた直後」の
スクショを `node tools/shot.mjs --lang ja` で撮って `shots/` に commit し、
報告に付けます（CLAUDE.md 「見た目を変えたものは必ずスクショで提示する」）。

一つの画面は一つの commit。
