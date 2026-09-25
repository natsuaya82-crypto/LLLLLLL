# r98-count ── 引用はリポストの数に入る／キーボードの高さの測りを消す

ブランチ `claude/r98-count`（`integ-0905` から）。決定ログ `docs/FEATURE_RULES.md` 2026-09-26「1.0.3 の残りの答え」。

## 持ち物（これ以外は触らない）
- `supabase/schema.sql` ── `post_seen.boosts` の数え方一か所
- `tools/rls-check.mjs`、`tools/tl-check.mjs`
- `www/net.js`・`www/post.js`（数を読む所だけ、要れば）
- `www/core.js`（設定の読みの一か所だけ）
- `tools/store-check.mjs` と関係する検査
- `docs/CHANGELOG.md`、この文書

## しないこと
- `react_seen`（リポストした人の一覧）に引用した人を混ぜない（未決定、今の形のまま）
- `feed_hot()` の並びの重み（boost=3）は変えない（数ではなく並べ方、指示の外）
- ゲートは回さない（作った検査・FAST・rls のみ）
