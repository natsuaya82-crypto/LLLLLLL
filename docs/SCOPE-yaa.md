# Scope: claude/yaa-g3pdv6 — claude/admin と claude/dl を束ねる

サブリーダーの統合枝。新しい機能は書きません。

## やること
1. `origin/claude/admin` (+14) と `origin/claude/dl` (+38) を、この枝の上で合流させる
2. `npm test`（26本）と `npm run rls` を回す
3. 緑なら master へ

## 触ってよいもの
合流で衝突した所だけ。どちらかの枝が書いた内容を、そのまま両方取るのが既定。
片方を落とす判断が要るときは、報告してオーナーに訊く。

## 触らないもの
- `origin/claude/cowork-migration-review-wfx1ra` と
  `origin/claude/detailed-tasks-execution-ak61z2` — 死んだ枝。merge しない
- `www/index.html` — 上の二本のもの。この枝は一行も触らない
- 検査（`tools/*.mjs`）を緑にするための書き換え

## 数（master 9d851c3 = ビルド #92、docs/HANDOVER-2026-08-26.md §4）
buttons pressed 10760 (230/230) / screens walked 425 (37/37 routes) /
mirror 302 / i18n en 903×10 / dead 1431 fn 351 vars /
corners 111 (baseline 111, js 0) / classes worn 588 unworn 4 (baseline 4) /
rows 2277 lists
