# r81-checks ── r79-acct の後、持ち物外で赤になった検査と文書を今の形に

枝 `claude/r81-checks`（`integ-0905` 7c890d26 から）。指示の元は `docs/scope/r79-acct.md`
「持ち物外で赤になった／直す必要がある物」。

## 持ち物（これ以外は触らない）

tools/writes-check.mjs tools/token-check.mjs tools/load-check.mjs tools/hist-check.mjs tools/kb-check.mjs
tools/again-check.mjs tools/migrate-check.mjs tools/open-check.mjs tools/plan-check.mjs tools/measure-cost.mjs
docs/ARCHITECTURE.md docs/BACKLOG.md docs/RECOVERY.md、それとこのファイル。

## 触らない

`www/` の全部（phases.js の `migrateGramLang`、`langLocked` の 13 か所、ネイティブのパスの uid を含む）。
`tools/fixture.mjs`（r78 の物 ── 要ると分かったら止めて報告）。

## やり方

検査が確かめていた事は残し、前提（SESS を手で置く・印の無い `lingua.set`・平たい `lingua.langs` 鍵・
毎回書かれるシート）だけを今の形に。直した赤は、直す前の形で赤だったのを一本ずつ見る。全ゲートは回さない。
