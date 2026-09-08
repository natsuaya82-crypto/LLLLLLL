# claude/r7-acct — 受け持ち

リーダーの指示（2026-09-08）で四件。それぞれ別コミット。

- A. 非公開にした言語がログアウト→ログインで公開に戻る（実機143）
- B. ログアウト→ログインでプランが pro になっていないかの確認
- C. プロフィールのリンクと場所が出ない（描く所が無い・サーバーへも行っていない）
- D. 「Follows you」の札を @ の横から名前の横へ、二か所を一つに

## 触るファイル

- `www/me.js`
- `www/sns.js`（`whoCard` のみ）
- `www/net.js`
- `www/core.js`（`setFor` の近辺）
- `www/home.js`（`wld` まわり）
- `supabase/schema.sql`
- `tools/acct-check.mjs`, `tools/again-check.mjs`, `tools/tl-check.mjs`, `tools/plan-check.mjs`, `tools/fixture.mjs`
- `shots/`
- `docs/CHANGELOG.md`, `docs/BACKLOG.md`

## 触らないもの

- `www/index.html`（別セッションの物。CSS が要るなら既存クラスで）
- 上に無いファイル全部
