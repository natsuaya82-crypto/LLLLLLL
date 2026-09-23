# r58 — 今日のお題が変わった時の通知

Branch `claude/r58-prompt-push`, cut from `integ-0905` (1a7b8db1).

OWNER 2026-09-23「通知なんだけど、今日のお題が変わった時にも出るようにできる？」
「時間が決まってるでしょ。アメリカ時間の0時。それに合わせるのは？」「いいよ」
「ちゃんとルールに則った綺麗な治し方してよ？」

## May change
- supabase/schema.sql — the push section and a trigger on `prompt` only. Not the foot cover block, not r55's ad table.
- supabase/functions/push-send/**
- supabase/functions/daily-prompt/** — only if the schedule fix needs it
- supabase/setup.md § 9 (cron) and § 12
- tools/rls-check.mjs, tools/push-check.mjs (the check that imports push.mjs)
- www/push.js, www/settings.js (the notification room only), www/i18n/*.js (the new switch's key), www/act-map.js if a name is added, tools/fixture.mjs
- docs/apple.md § 8, docs/FEATURE_RULES.md (decision log), docs/CHANGELOG.md, this file

## May not change
- www/index.html (r55), the settings→language row (r56), the anon cover block at the foot of schema.sql.
- www/core.js `SET_PREFS` and tools/store-check.mjs name the four push_* fields by hand. They are the same surface. If covering it needs them, it is reported, not done here.
