# r128 お題の通知が 401 で落ちる

ブランチ `claude/r128-prompt-push`（integ-0905 から）。

触ってよいもの:
- `supabase/functions/push-send/index.ts`, `supabase/functions/push-send/push.mjs`
- `supabase/functions/daily-prompt/index.ts`
- `supabase/schema.sql`（daily-prompt の答えを残す表を一つ）
- `tools/push-check.mjs`, `tools/rls-check.mjs`
- `.github/workflows/supabase-schema.yml`（check がその表を読む一行）
- `docs/CHANGELOG.md`, この file

触らないもの: `www/`、`ios/`、他の関数、本番（deploy・apply・once・check の dispatch はリーダー）。
