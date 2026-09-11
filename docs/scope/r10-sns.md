# claude/r10-sns ── 2026-09-09

オーナー決定 2026-09-09、`docs/FEATURE_RULES.md` 決定ログ「画面で訊いて答えの
出た十一」の 6・7・8。三つとも SNS 側で、三つとも別々の場所。

- Goal:
  1. お題の札を押して開く検索の箱も表示言語で出す（見せ方だけ。保存と検索は
     綴り一つのまま ── 2026-09-08 の決定は変えない）。
  2. `@名前` で始めた投稿は、プロフィールの「返信」欄にだけ出す。
  3. 投稿画面の「Replying to @〇〇」の行に ✕ を置いて、宛先を外せるようにする。
- Owns (may change):
  `www/sns.js` `www/home.js`（`pfList` だけ）`www/post.js` `www/act-map.js`
  `www/i18n/*.js` `tools/find-check.mjs` `tools/tl-check.mjs`
  `tools/post-check.mjs` `tools/fixture.mjs` `docs/CHANGELOG.md`
  `docs/BACKLOG.md` `docs/scope/r10-sns.md`
- Does NOT own: それ以外すべて。とくに **`www/index.html`**（別の枝が持って
  いる ── 在る class だけで作る）`www/net.js` `www/core.js`。
- Decision it implements: 2026-09-09 の 6・7・8。
- Check to run: `find-check`（6）`tl-check`（7）`post-check`（8）── 赤を見て
  から緑。全ゲートは回さない（規則 2、`docs/SESSIONS.md` §6）。
