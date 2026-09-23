# r57-store

ブランチ `claude/r57-store`（`integ-0905` 1a7b8db1 から）。

Store Localize が ja の説明文で Apple に 409 で断られた（`─` INVALID_CHARACTERS）。
乾いた走り（`--dry`）は長さしか見ていなかった。面は **store/ の全ロケール × 送る全フィールド**、
述べることは一つ：**Apple が断る文は、鍵を使う前に dry run が断る**（長さと文字）。

触る：`tools/store-localize.mjs`、`store/**`、`tools/gate.mjs`（FAST に入れる場合）、
`docs/apple.md`（Store Localize の段）、`docs/CHANGELOG.md`、この文書。
触らない：`www/` の全部、workflow（起動もしない）、他のすべて。
