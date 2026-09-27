# Rule audit 2026-09-27 — words (dictionary, grammar, keyboard)

Branch `claude/audit-words` from `integ-0905`.

## Scope

May change: `www/words.js` `www/wordsheet.js` `www/import.js` `www/grammar.js`
`www/grammar-engine/*` `www/assist.js` `www/phases.js` `www/ipa.js`
`www/reading.js` `www/notes.js` `www/voice.js` `www/home.js` `www/keyboard.js`
`www/share.js` `www/sheet.js`, the `act-map.js`/`route-map.js` lines those
files name, the i18n keys they use, the checks that hold what is fixed, and this report.

May not change (listed only): `www/index.html` (r125), `www/store.js` and
`supabase/functions/verify-plan` (r121), `www/onboard.js` sign-in and `GOOGLE`
in `www/net.js` (r122), `android/**` (r123, r124), `www/push.js`,
`supabase/functions/push-send`, the device table in `schema.sql` (r124).

Status: in progress.
