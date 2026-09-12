# claude/r34-lapse ── 「プランが終了しました」を、サーバーの答えで、起動のポップに

- Goal: オーナー決定 2026-09-12（原文）「オンラインで出してね流石に」「4 起動の
  時に表示して ☑️今後表示しない 閉じる みたいなポップにしたくない？」「有料が
  消えて無料に残った後は非表示じゃないの？」を入れる。
  1. **サーバーが「前の段」と「見たか」を持つ** ── `plan` 表に `was` と
     `lapse_seen_at`、本人が「見た」を書く道は RPC 一つ（`plan_lapse_seen()`）。
  2. **`verify-plan` が下がった時だけ `was` を書く**、答えに `was` と
     `lapse_seen` を足す。
  3. **アプリは起動のポップで言う** ── 見出し／☑ 今後表示しない／閉じる。
     ☑ で閉じた時だけ RPC が出る。**端末には何も憶えさせない。**
  4. **docs** ── 天井は「畳む」が今の形（オーナー 2026-09-12）。`DATA_MODEL` の
     「Neither ceiling removes, hides or counts down anything」を書き直し、
     `BACKLOG` のその項を消す。決定ログに (g)(h)。

- Owns (may change):
  - `supabase/schema.sql`（`plan` 表の二列と `plan_lapse_seen()`）
  - `supabase/functions/verify-plan/index.ts`（`was` を書く／答えに足す）
  - `supabase/setup.md`（§ 8c 段が終わった知らせ）
  - `www/net.js`（`netPlanVerify()` の答えの受け、`netLapseSeen()`）
  - `www/shell.js`（`popAsk()` の隣 ── `#pop` に何を描くかの一箇所を出す）
  - `www/settings.js`（`openCapLapse()` を書き直して起動のポップに）
  - `www/act-map.js`（ポップの二つの名前）
  - `www/i18n/{en,es,pt,fr,de,it,ru,zh,ko,ja}.js`（`cap.lapse.never` を足し、
    `cap.lapse.d` を消す）
  - `tools/plan-check.mjs`（claim）、`tools/rls-check.mjs`（CASES 二件）
  - `docs/CHANGELOG.md`、`docs/DATA_MODEL.md`、`docs/PAID_FEATURES.md`、
    `docs/FEATURE_RULES.md`、`docs/BACKLOG.md`、`docs/scope/r34-lapse.md`、
    `shots/r34-*.png`
- Does NOT own: それ以外すべて。名指しで **`www/index.html`**（CSS が要るなら
  ここに「要る一行」を書いてリーダーへ渡す）と **`ios/`**。
- Decision it implements: OWNER 2026-09-12（上の三つの原文）。
  `docs/FEATURE_RULES.md` § 2026-09-12 朝の六つ (e) の「まだ」を埋める。

## 他の枝と重なっている file（リーダーへ）

`git log --oneline --all --not origin/integ-0905 --since=2026-09-10 -- <file>` で
見たところ、取り込まれていない枝が **`www/net.js`**（`dup`、`sid`、番号の枝）、
**`www/shell.js`**（`dup`、`r21-hunt`）、**`www/settings.js`**（`dup 8`）、
**`www/core.js`** に居ます。この枝が触るのはその中の別の場所です ──
`netPlanVerify()` の答えを受ける三行、`popAsk()` の下の一関数、
`openCapLapse()` の一塊。`www/core.js` は**コメント一つだけ**（`langCap()`）。
取り込みの順はリーダーのものです。

## CSS ── 要らない

ポップは `#pop` そのもの（`popAsk()` と同じ場所・同じ描き方）、☑ は既にある
`swtHTML()`（`.swt`/`.swk`）。**`www/index.html` に足す一行はありません。**

## Check to run

触った check と `npm run press` 一回。`supabase/schema.sql` を触るので
`npm run rls` も一回（この環境に PostgreSQL 16 が在るので回る）。
**全ゲートは回さない**（規則 2）。ビルドは出さない。

## claim の名前

- `rls-check`「B が呼んでも A の `lapse_seen_at` は null のまま」
  「アカウントの無い人は `plan_lapse_seen()` を呼べない」
- `plan-check`「`was` が有料・`lapse_seen` 偽 → 起動でポップが出る」
  「☑ を付けて閉じる → `plan_lapse_seen` が一回出る → 次の起動では出ない」
  「☑ 無しで閉じる → 何も出ず、次の起動でまた出る」
  「段が上がった・同じ → 出ない」

## 報告

（末尾に CODE CONFIRMED／DEVICE／OWNER を分けて書く）
