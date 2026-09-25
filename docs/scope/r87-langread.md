# r87-langread — 「この人はこの言語を読めるか」を一つの函数に

枝 `claude/r87-langread`（`integ-0905` から）。

## 何をするか

`supabase/schema.sql` の三か所 ── `language_read`（language 表の policy）・`language_seen`（view）・
`slice_read`（slice の policy）── がそれぞれ別に「誰がこの言語を読めるか」を書いていて、`language_seen`
だけが `block_hides()` を訊く。決定（2026-09-25）「ブロックした相手の公開言語は見えない（両向き）」を三つの道
全部に効かせるため、問いを一つの函数 `lang_readable(uuid)` に書き、三か所ともそれを訊く形に書き直す。
古い三つの条件は消す。

振る舞い: 自分の言語・取った言語（`language_take`）は今のまま読める。公開言語はブロックの両向きで読めない。
slice の「どの種類を読めるか」（記事の五種類／`slice_dl` の三種類／持ち主は全部）は変えない。

`tools/rls-check.mjs`: 三つの道それぞれで「ブロックの両向きで読めない」を CASES に足し、古い schema で赤を
一度見る。言語を読む道（language・slice の SELECT policy と、その二表を読む view）をカタログから数え、全部が
`lang_readable` を通るかを見る。

## 持つファイル

- `supabase/schema.sql`（`language_read`・`language_seen`・`slice_read` と新しい函数の所だけ）
- `tools/rls-check.mjs`
- `docs/FEATURE_RULES.md`（§ Blocking の該当文だけ）
- `docs/CHANGELOG.md`
- `docs/scope/r87-langread.md`

## 持たない物

`www/` 全部。`take_make`（新しく取る道）を含め、上の三か所以外の schema.sql。
