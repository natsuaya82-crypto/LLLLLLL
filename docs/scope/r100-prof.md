# r100-prof ── プロフィールにリポストも／端末の設定の四つを消す／録音とシートを端末に残さない

ブランチ `claude/r100-prof`（`integ-0905` から）。決定ログ `docs/FEATURE_RULES.md`
2026-09-26「プロフィールに自分のリポストも出す」「ルールの洗い出しへの答え」。

## 持ち物（これ以外は触らない）
- `supabase/schema.sql`、`tools/rls-check.mjs`
- `tools/tl-check.mjs`、`tools/acct-check.mjs`、`tools/store-check.mjs`（と、消えたことを数える検査）
- `www/net.js`（`netPostsBy()` と関係する読みだけ）
- `www/core.js`（`SET_PHONE` と消す設定の一覧だけ）
- `www/phases.js`・`www/letters.js`（移行の読みだけ）
- `www/rec.js`、`www/sheet.js`
- `www/sns.js`・`www/me.js`（プロフィールの一覧だけ）
- 関係する `ios/App/App/*.swift`
- `docs/CHANGELOG.md`、この文書

## しないこと
- `www/post.js` は r99 の持ち物 ── 触らない（要るなら止めて報告）
- ゲートは回さない（作った検査・FAST・rls のみ）
- ビルドはしない
