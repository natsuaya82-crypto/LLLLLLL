# rule audit 2026-09-27 — sns (claude/audit-sns)

**Scope.** Owner order 2026-09-27 「洗いざらい出して全部適応させて」. Branch
`claude/audit-sns` from `integ-0905`.

May change: `www/sns.js` `www/post.js` `www/me.js` `www/card.js` `www/rec.js`
`www/mod.js` `www/cal.js`, the i18n keys they need, `www/act-map.js` lines for
their names, the checks that hold what is changed here, `docs/CHANGELOG.md`,
this file, `shots/audit-sns-*`.

May not change (listed only): `www/index.html` (r125), `www/store.js`,
`supabase/functions/verify-plan` (r121), `www/onboard.js` sign-in and `GOOGLE`
in `www/net.js` (r122), `android/**` (r123, r124), `www/push.js`,
`supabase/functions/push-send`, the device table in `schema.sql` (r124).
Owner matters are listed with options, not decided.

(findings follow)
