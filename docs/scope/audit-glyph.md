# scope: claude/audit-glyph (2026-09-27)

OWNER 2026-09-27 「洗いざらい出して全部適応させて。コードも。全部見るんだぞ？」

Area: letters and drawing — `www/letters.js` `www/sound.js` `www/glyph.js`
`www/otf5.js` `www/wsys.js` `www/numbers.js`.

May change: those six files; `www/act-map.js` / `www/route-map.js` / `www/i18n/*.js`
only for a line those six need; `tools/*-check.mjs` that hold a fix made here;
`docs/CHANGELOG.md`; `docs/reports/rule-audit-2026-09-27-glyph.md`; `shots/audit-glyph-*`.

May not change: `www/index.html` (r125), `www/store.js`, `supabase/functions/verify-plan`
(r121), `www/onboard.js` sign-in and `GOOGLE` in `www/net.js` (r122), `android/**`
(r123, r124), `www/push.js`, `supabase/functions/push-send`, the device table in
`schema.sql` (r124). Violations there are listed in the report, not edited.
No owner matters decided.
