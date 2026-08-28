# claude/phead — 投稿の頭の一行目

## 触るもの
- `www/post.js` （`postRow()` の頭だけ）
- `www/index.html` （`.phead` 周りの CSS だけ。キーボードの CSS には触らない）
- `www/i18n/*.js` （`post.unsent` の削除）
- `tools/post-check.mjs` （主張の追加と、消えた印の主張の削除）

## 触らないもの
`www/keyboard.js` `tools/kb-check.mjs` `www/grammar.js` `www/phases.js`
`tools/fixture.mjs`

## やること（三コミット）
1. バッチを名前のすぐ横へ（名前 → バッチ → 時刻）
2. 「まだ載っていない」の ↑ を消す（`ICON_UNSENT` / `post.unsent` ごと）
3. 入るなら頭は一行、入らなければ折り返す（CSS で。JS で幅を測らない）
