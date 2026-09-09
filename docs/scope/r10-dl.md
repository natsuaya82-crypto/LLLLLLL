# claude/r10-dl ── DL 言語をスライドで返す・起動の二本道・印の無い古い言語

枝は `claude/r10-dl`、`origin/integ-0905`（`e12a4739`）から。
オーナー決定 2026-09-09（`docs/FEATURE_RULES.md` 決定ログ「画面で訊いて答えの
出た十一」の 1・15・4）。

## Goal

三つ。どれも「取った言語」と「起動」まわりで、同じ二つのファイルに落ちる。

- **1** ダウンロードした言語を、言語切り替え画面の行をスライドして返す。
  サーバーが先（`language_take` の自分の行を DELETE）→ 通ったら端末の行と
  slice を落とす。**落とす道は `netTakeGone()` 一本**（二つ目の削除関数を
  書かない）。**DELETE REVIEW を先に `docs/CHANGELOG.md` へ。**
- **15** 起動の二本の道（`netLangBack` と `netLangsDown`）が競争して同じ言語が
  索引に二行入るのを無くす。**条件で止めるのではなく、二本目を消す**
  ── `netLangBack` / `netLangBack1` が持っている「行を作って埋める」を消し、
  `netLangsWalk` 一本だけが行を作る。
- **4** 印も `sid` も無い `mine:true` の古い言語を、サインインした人のものに
  する（BACKLOG の (b)）。**リーダーの仮置きで、オーナー未確認。**

## Owns（変えてよい）

```
  www/net.js            netTakeDrop() を足す、netLangBack を一本にする
  www/core.js           印の無い古い言語に印を押す（langForAcct の隣）
  www/home.js           vLangs / langRow のところだけ（スライドの行）
  www/index.html        スワイプの CSS だけ。box-check の baseline に足さない
  www/act-map.js        名前を足す
  www/i18n/*.js x10     「削除」の鍵（在るものを使う。無ければ十言語全部）
  tools/dl-check.mjs, again-check.mjs, acct-check.mjs
  tools/fixture.mjs
  docs/CHANGELOG.md, docs/BACKLOG.md, docs/scope/r10-dl.md
```

## Does NOT own ── それ以外すべて

**`supabase/schema.sql` は触らない。** `take_drop` ポリシーは在り、
`npm run rls` の case も在る（B は A の行を消せない）。要ると思ったら止まって
報告する。

他の枝を merge / rebase / cherry-pick しない。`origin/master` を自分の枝へ
入れるのは報告の前にやる。

## Decision it implements

- 1 ── OWNER 2026-09-09「言語変更画面をスライドで消せる、メモしといて」→
  「はい」。`docs/BACKLOG.md`「ダウンロードした言語を返す道」に作る日の形が
  書いてある。
- 15 ── OWNER 2026-09-09「ならばないようにして」。
  `docs/BACKLOG.md`「起動の二本の道が競争して」。
- 4 ── `docs/BACKLOG.md`「圏外で作って一度も上げていない古い言語は」の (b)。
  **これはオーナーが決めていない。**リーダーが (b) を仮に置いた。
  09-03 に禁じた「端末の一人目」に戻る形なので、オーナーの確認が要る。

## Check to run

`npm test` は回さない。押さえる分だけ、**先に赤を見てから**緑。

```
  npm run dl      1（スライドで返す）
  npm run again   15（起動の二本を同時に走らせても一行）
  npm run acct    4（印の無い古い言語がサインインでその人のものになる）
  npm run slow    15 が起動の段を増やしていないこと（5 以下）
  npm run act     act-map.js に足した名前
  npm run box     index.html の CSS（baseline を増やさない）
```

見た目が変わるもの（`vLangs` の行）は `node tools/shot.mjs --lang ja langs` で
**両方の状態**（普通の行・スライドして「削除」が出た行）を撮って commit に
入れる。
