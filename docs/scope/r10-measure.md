# scope: claude/r10-measure

2026-09-09 / origin/integ-0905 から

## 何をするか

オーナーの問い「Supabase $25 でユーザーは何人まで持つか」に、**この容れ物で
測れる数字**で答える。`docs/BACKLOG.md` の言うとおり本物のサーバーへの往復は
ここからは測れないので、測れないものは測れないと書く。

1. 起動一回の通信量 ── 要求ごとの要求バイトと応答バイト（小さい言語と 5000 語）
2. 写真一枚と声 30 秒の保存バイト
3. 言語一本の大きさ（slice 12 個の合計）を 100/1000/5000 語で
4. 一人あたり月の見積もりと、$25 で持つ人数

## 触るファイル

- `tools/measure-cost.mjs`（新）── 測る道具。gate には足さない
- `package.json` ── `scripts` に `measure` を一行（`assets-check` が両方向を見るため）
- `docs/reports/cost-2026-09-09.md` ── 報告
- `docs/scope/r10-measure.md` ── これ

## 触らないファイル

**`www/` の下は一行も触らない。** `tools/` の他の道具も、`docs/` の他も触らない。
`npm test` は回さない（リーダーの仕事）。

## 誰とぶつかるか

`claude/r10-hist` が `slice_hist`（直前 3 版）を作っている。その分の置き場は
見積もりに足すが、`supabase/schema.sql` は触らない。
