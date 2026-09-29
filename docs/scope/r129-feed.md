# r129-feed — おすすめ（For You）の入れ替え・新しい投稿・古い投稿

ブランチ `claude/r129-feed`（`integ-0905` から）。オーナーの決定 2026-09-28（リーダー経由）。

## やること

1. 入れ替えを 2 時間ごと（太平洋時間 0・2・4…22 時）に。`feed_slot()`。
2. 区切りの後に書かれた投稿を全部、人気 2 件ごとに新しい 1 件（新しい順）で挟む。
   「2」はリーダーの仮の数で、一か所（`feed_fresh_every()`）。
3. 48 時間の窓を出し切ったら、それより古い投稿が新しい順で続く。
4. 続きを読む時に同じ投稿が二度出たり飛んだりしない：一覧は「いつの時点の一覧か」
   （`asof`）で決まり、最初の頁でサーバーが返し、続きはそれを送り返す。

## 触る所

- `supabase/schema.sql` — `feed_slot()`・`feed_hot()` とその注釈、新しい `feed_fresh_every()`
- `www/net.js` — `netFeed()` のおすすめの枝
- `www/sns.js` — `askFeed1()`（おすすめの続きの持ち方）
- `tools/rls-check.mjs` — feed_hot の順（人気・新しい・古い、重複なし、返信なし、刻み 2 時間）
- `tools/tl-check.mjs` — おすすめの続きが時点を送り返すこと
- `docs/CHANGELOG.md`・`docs/FEATURE_RULES.md`（決定ログ）・`docs/DATA_MODEL.md`・`docs/STATE.md` の該当文
- 画面の見た目が変わるなら `tools/fixture.mjs` と `shots/`

## 触らない所

- フォロー中（`feed_fo()`）、お題の一覧、検索の「話題」（`post_seen.buzz`）
- 重み（いいね 1・リポスト 3・返信 5・青パッチ 4）
- `supabase/schema.sql` の他の所（`claude/r128-prompt-push` が cron を触っている）
- 本番への適用（リーダー）
