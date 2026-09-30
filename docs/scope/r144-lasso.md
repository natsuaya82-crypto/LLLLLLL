# r144 投げ縄で選んだ線だけが動く (claude/r144-lasso)

Owner decision 2026-09-30 「投げ縄で選んだ線だけが動く」 (docs/FEATURE_RULES.md).

May change: `www/glyph.js` (the lasso part only: geLasso .. geLsBin and the lit
dots in geDraw), `tools/lasso-check.mjs`, `tools/fixture.mjs`, `shots/r144-*.png`,
`docs/CHANGELOG.md`, this file.

May not change: the pen, a single dot's drag (GE.pi), ROUND, fill, anything
outside the glyph editor.
