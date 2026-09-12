# claude/r33-owner ── 2026-09-12 朝のオーナー決定、三件

- Goal: 2026-09-12 朝の決定のうち三件を入れる。
  1. **新しい言語は文字 0 ではなく 38 字の枠で始まる**（段を問わず）。
  2. **電波なしで開いた時、取った言語も前に読み込んでいれば一覧に出る。**
  3. **動詞の章の三行目の言葉**（ja だけ）。
  そして決定ログ（2026-09-12 の六項）を `docs/FEATURE_RULES.md` に。
- Owns (may change):
  - `www/core.js`（`langNew()`、`LTAKE` と写し）
  - `www/letters.js`（`ltStart()` の書き直し ── 枠を置く一箇所を分ける）
  - `www/i18n/ja.js`（`g2.g.mood` の一行）
  - `tools/plan-check.mjs`（claim 1）
  - `tools/again-check.mjs`（claim 2）
  - `tools/store-check.mjs`（新しい鍵の road）
  - `tools/acct-check.mjs`（65 の「訊いていない」が写しと食い違うなら、そこだけ）
  - `docs/CHANGELOG.md`、`docs/DATA_MODEL.md`、`docs/PAID_FEATURES.md`、
    `docs/FEATURE_RULES.md`、`CLAUDE.md`、`docs/scope/r33-owner.md`、`shots/r33-*.png`
- Does NOT own: それ以外すべて。名指しで `www/index.html`、`supabase/schema.sql`、`ios/`
- Decision it implements: `docs/FEATURE_RULES.md` § 2026-09-12 朝（このブランチが書く）
- Check to run: 触った check と `npm run press` 一回だけ。**全ゲートは回さない**
- claim の名前:
  - `plan-check`「有料で言語を追加 → 文字が 38 ある → 綴りが打てる → 消した文字は次の起動で戻らない」
  - `again-check`「電波なしでも、取った言語が一覧に出る」「別のアカウントで入ると前の人の取った言語は出ない」

## 報告

（作業のあと、末尾に）
