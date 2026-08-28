# claude/other — 実機で踏んだ六つ（オンライン側）

## Goal
オーナーが実機（iPhone SE2 / iPhone 17）で踏んだ六つのうち、オンライン側 ──
二人目が居る世界でしか出ないもの ── を直す。

## Owns (may change)
- `www/sns.js`
- `www/home.js`
- `www/i18n/*.js` ── 新しい鍵が要るときだけ
- `tools/sides-check.mjs`
- `tools/post-check.mjs`

## Does NOT own
それ以外すべて。名指しで、要ると分かっているもの:

- `www/me.js` ── 顔の件の枝が持っている
- `www/post.js` ／ `www/index.html` ── 返信画面の枝が持っている
- `tools/fixture.mjs` ── キーボードの枝が持っている
- `www/net.js` ── Google のサインインの枝が持っている

要ると分かったら**そこで止めて、その旨をコミットして push し、報告する。**
空くのを待たずに済む道が在るなら先にそちらを通る。

## Decision it implements
オーナーが実機で踏んだ六つ。仕様は決めない ── 値段・自由と有料の境・削除・
保存の期間・言葉づかい・しきい値は、迷ったら止めて訊く。

## 何を直すか（六つ、六コミット）
1. 人のプロフィールが「？」
2. 「この言語について」で人のをタップしても自分のが出る
3. 新しいアカウントが検索に出てこない
4. フォロー0 ── まず**正しい0かどうか**を確かめる
5. おすすめ0 ── 同上
6. 通知 ── 未読の数を下タブに、行に顔、顔を押すとその人のページ

`vProfile()` は `www/home.js`、`vNotif()` は `www/sns.js`。

## Check to run
`npm run es5` `npm run sides` `npm run dead`（速い）。
遅いものは**赤を見るためだけに**一度。直したあと緑を見に行かずに push。
全ゲートはリーダーが最後に一度。

**検査は全部「一人しかいない世界」で走る。ここで直すのは二人目が居る世界の
話なので、緑は証拠にならない。**何を根拠に直したかを報告に書く。

## 規則 8（外せない）
人の投稿・人のプロフィールを描く所で `WORDS` `LETTERS` `STG` `SET` `ME`
`meName` `langName` `findWord` `ltById` `myFontOn` を名指ししない。
**作る側のグローバルは、読む側では嘘になる。**`sides-check` が持っている。
