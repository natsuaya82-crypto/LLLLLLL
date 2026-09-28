# audit-docs ── 文書と検査の洗い出し（2026-09-27）

ブランチ `claude/audit-docs`（integ-0905 `7ad9b612` から）。命令: OWNER 2026-09-27
「洗いざらい出して全部適応させて。コードも。全部見るんだぞ？」

## 触ってよい
- `docs/` のうち日の記録でない物（CHANGELOG・HANDOVER*・CHECK-*・`docs/reports/`・`docs/scope/` 以外）。`docs/STATE.md` はリーダーの物だが、嘘の文は直して報告に書く
- `CLAUDE.md`
- `tools/*.mjs`、`tools/*-baseline.txt`
- `docs/CHANGELOG.md`（記録の追記だけ）、`docs/reports/rule-audit-2026-09-27-docs.md`、この文書

## 触らない
`www/`・`supabase/`・`ios/`・`android/`。そこで見つけた物は報告に file:line で書き、
audit-sns / glyph / words / core / server の各セッションへ回す。
オーナーの物（値段・境界・削除・保持・文言・閾値）は決めない ── 選択肢を並べる。

## 回す物
`docs-check` と、直した検査だけ。直した検査はバグを戻して赤を見る。
