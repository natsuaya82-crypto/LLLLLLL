# audit-server ── サーバーの規則の洗い出し（OWNER 2026-09-27「洗いざらい出して全部適応させて」）

ブランチ `claude/audit-server`（`integ-0905` から）。

## 持ち物（これ以外は触らない）
- `supabase/schema.sql`（device の表は r124 ── 触らない）、`supabase/once/`、`supabase/*.md`
- `supabase/functions/daily-prompt/`
- `.github/workflows/*`（android-build.yml は r123/r124 ── 触らない）
- `ios/App/**` の Swift（他のセッションの領分に当たるものは挙げるだけ）
- それを押さえる `tools/*-check.mjs`（rls-check、assets-check ほか）
- `docs/reports/rule-audit-2026-09-27-server.md`、`docs/CHANGELOG.md`、`docs/BACKLOG.md`、この文書

## 触らない（挙げるだけ）
- `www/index.html`（r125）、`www/store.js`・`supabase/functions/verify-plan`（r121）、
  `www/onboard.js` のサインインと `www/net.js` の GOOGLE（r122）、`android/**`（r123・r124）、
  `www/push.js`・`supabase/functions/push-send`・schema.sql の device の表（r124）

## しないこと
- 本番には何も当てない（リーダーがオーナーの承認で当てる）
- オーナーの判断は決めない ── 選択肢を並べて止める
- ゲートは回さない（変えた物を押さえる検査と rls だけ）
