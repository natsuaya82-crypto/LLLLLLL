# r79-acct — 持ち主（2026-09-24）

作業セッション r79-acct（`claude/r79-acct`、`origin/integ-0905` 6493c391 から）。
指示: `claude/leader-briefs:docs/scope/brief-r79-acct.md`。

### Scope
- Goal: 端末に書く物は書く時に uid を持つ。持ち主の無い物を読んだらそれは誰の物にもならない。
  アカウントが変わる時に忘れる物は、アカウントで引ける一つの入れ物にあり、`netOut` はそれを一行で捨てる
  （r73 §2-7）。先にゲートの赤（word-check・gramlang-check・keep-check）。r65 §2 の net.js 側、K1。
- Owns (may change): www/core.js www/net.js www/post.js www/sns.js www/me.js www/settings.js
  www/phases.js（migrateGramLang の呼び出しだけ） www/mod.js（adminStaffRow だけ）
  www/shell.js（keepOn・keepSnap・keepAsked・keepBack） www/keyboard.js（K1 に要る所だけ）
  www/share.js・www/store.js（SESS を直に読む一行だけ） www/onboard.js（960 行のコメントだけ）
  www/act-map.js www/i18n/*.js tools/fixture.mjs tools/acct-check.mjs tools/store-check.mjs
  tools/quiet-check.mjs tools/post-check.mjs tools/draft-check.mjs tools/word-check.mjs
  tools/gramlang-check.mjs tools/keep-check.mjs tools/load-baseline.txt（share/store の行を消すだけ）
  検査一本（要れば、package.json・gate.mjs） CLAUDE.md（規則 22・§ Online の偽になる文）
  docs/DATA_MODEL.md docs/STATE.md（偽になる文） docs/CHANGELOG.md docs/FEATURE_RULES.md（決定ログ）
  docs/scope/r79-acct.md
- Does NOT own: それ以外すべて（www/index.html は CSS 一行も足さない）
- Decision it implements: CLAUDE.md § Online「NOTHING IS THE PHONE'S」（2026-09-03）、「a thing that cannot
  answer 『which account』 is a thing that must not be written down」、平たい鍵「読まない、消さない」
  （2026-09-03）、2026-09-23「そもそもアプリ公開されたの昨日だから必要ない」、2026-09-01 通知の既読は時刻、
  2026-09-04 オンラインのみ・規則 22、規則 11、「SNSは全部サーバー」
- Check to run: 担当の検査の赤だけ（acct・store・quiet・post・draft・word・gramlang・keep）。全ゲートは回さない。
