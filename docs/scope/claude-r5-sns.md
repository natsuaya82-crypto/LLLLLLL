# claude/r5-sns の範囲宣言

リーダーの指示（OWNER 実機 141 の二件）。master から作った枝。

## 触ってよい

- `www/sns.js` — 通知の行（§ notGo / notRow）と、そこから開く一覧の画面。
- `www/route-map.js`, `www/shell.js` の `PAGES` — 一覧が route なので一行ずつ。
- `www/act-map.js` — 新しい名前が要るとき。
- `www/index.html` — 末尾の `/* ---- r5-sns ---- */` 区画だけ。
- `www/grammar.js` — 二件目（語順の画面の描き直し）の測定と、原因の一か所。
- `tools/` — 主張を足す check（post-check か find-check）。

## 触らない

- `www/me.js` の `vFollows` 本体、`www/post.js`、`www/net.js`、`supabase/`。
- 他の枝が触っている所。`www/index.html` は末尾の区画のみ。

## やること

1. 二人以上がまとまったフォロー通知の行 → その人たちの一覧へ。一人の行はその人へ。
2. 語順の画面（`g2Board`）の描き直しを測ってから直す。
