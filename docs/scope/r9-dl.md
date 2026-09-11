# r9-dl ── 元が消えた DL 言語は端末からも消える／非公開は新規 DL を止めるだけ

- 日付: 2026-09-09
- 枝: `claude/r9-dl`（`integ-0905` の `daffb323` から）
- 決定: `docs/FEATURE_RULES.md` § DL 言語の四つ（OWNER 2026-09-09）
  1.「空で残さないで。消えたら消えるのよ。」
  2.「非公開にしたら新規 dl だけできないだけ」

## やること

**1（端末）** 起動の `netTakenDown()`（`www/net.js`）は `language_take` の答えで
取った言語を埋めるが、**答えに無くなった言語の索引の行を落とさない**。元が言語
またはアカウントを消すと `language_take` は cascade で消える（`schema.sql:315`）
ので、`mine:false` の行が空のまま切り替えに残る。同じ道で落とす ── slice、
`langWasKey`、`delete LANGS[id]`、`langStore()`。`netLangDrop()` は**呼ばない**
（他人のサーバーの行は触らない）。

- **答えが来ていないとき（`netTakes` が落ちた＝`LTAKE===null`）は何も落とさない。**
  圏外の起動で取った言語を消してはいけない。
- **自分の言語（`mine:true`）には一バイトも触らない。**
- DELETE REVIEW を `docs/CHANGELOG.md` に**先に**書く。

**2（サーバー、SQL の流し直しが要る）** `slice_read` は「持ち主、または公開中」
なので、元が非公開にすると取った人が次の起動で空になる。取った人を足す。
`language_read` と `language_seen` も取った人に行を返す（起動は
`language?id=in.(…)` で引くので、行が来ないと名前も来ない）。`take_make` に
「公開中」を足す ── 非公開のものは新しく取れない。

## 押さえる check（赤を見てから緑）

- 1 → `tools/again-check.mjs`（r8-take の「取った言語が再起動で戻る」の隣）
- 2 → `npm run rls`（`tools/rls-check.mjs` の CASES に五本）

## 触るファイル

`www/net.js`、`www/core.js`（LTAKE／索引まわりのみ）、`supabase/schema.sql`、
`supabase/setup.md`、`tools/rls-check.mjs`、`tools/again-check.mjs`、
`tools/fixture.mjs`（要れば）、`docs/CHANGELOG.md`、`docs/scope/r9-dl.md`。

**`www/index.html` と `www/home.js` は触らない。**

## 触らないこと

- 切り替え画面のスライド削除（決定 4、メモのみ・BACKLOG）。
- ↓ で切り替える（決定 3、しない・確定）。
- `npm test` は回さない（リーダーが回す）。
