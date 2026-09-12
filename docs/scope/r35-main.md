# claude/r35-main ── 主言語＝一番古く作った言語。無料はそれだけ出て、それが開く

- Goal: 2026-09-12 のオーナー決定を入れる。
  「無料はそもそも1つの言語しか出ないやろ。一番最初に作ってた作り込んでた言語
  だけ表示であとは隠すだろ」「そもそも最初に作った言語を主言語にして、フリーに
  した時に最初に表示されるようにしないとダメでは？」
  1. **主言語＝このアカウントが一番古く作った言語**（サーバーの
     `language.created_at` が一番古い、`LW_MINE` の物）。これはサーバーが
     `profile_seen.lang_id` で既に答えている規則と同じ
     （`language_seen` を `created_at asc limit 1`、`supabase/schema.sql:1341`）
     ── **二つ目の規則を作らない**。
  2. **一覧の畳みは created_at の古い順に cap 本**（無料 1、pro 3）。
     「並び順の先頭 cap 本＋開いている物を差し替える」を消す。
  3. **無料に落ちた瞬間、開いている言語が畳まれる側なら主言語が開く。**
     段が上がる時は何もしない。
- Owns (may change):
  - `www/core.js` ── 新しい `LMADE`（`langMadeKey`/`langMadeGot`/`langMadeOf`）、
    新しい `langsOld()` と `langMainId()`、`planTook()`（`:1974`）の末尾に呼ぶ
    一行。**`planTook()` の中身そのものと段の道は触らない**（r34 の隣）
  - `www/home.js` ── `langsSeen()`（`:2554`）と `vLangs()`（`:2574`）
  - `www/net.js` ── `netLangsDown()`（`:2126`）と `netTakenDown()` の `select=`
    に `created_at` を足す、`netLangsWalk()`（`:1951`）が `langMadeGot()` を呼ぶ
    一行。**`netPlanVerify()` には入らない**（r34）
  - `tools/dl-check.mjs`（既にある `langsSeen` の claim ── 開いている物の
    差し替えが消えるので、その一本を新しい規則の claim に書き替える）
  - `tools/plan-check.mjs`（新しい claim 五本）
  - `tools/store-check.mjs`（新しい `.got` の road ── 要るなら）
  - `docs/FEATURE_RULES.md`（決定ログ 2026-09-12 に (i)）、`docs/DATA_MODEL.md`、
    `docs/PAID_FEATURES.md`、`docs/CHANGELOG.md`、`CLAUDE.md` 規則 22、
    `docs/scope/r35-main.md`、`shots/r35-*.png`
- Does NOT own: それ以外すべて。名指しで、**並行している `claude/r34-lapse` の
  持ち物**である `supabase/schema.sql`、`supabase/functions/verify-plan/*`、
  `supabase/setup.md`、`www/settings.js` の `openCapLapse` 周り、`www/net.js` の
  `netPlanVerify()`、`www/shell.js` の `#pop`。ほかに `www/index.html`、`ios/`。
  `docs/CHANGELOG.md` は r34 も書くので、節を分けて足すだけにする
- Decision it implements: `docs/FEATURE_RULES.md` § 2026-09-12（このブランチが
  (i) を足す）
- Check to run: 触った check と `npm run press` 一回だけ。**全ゲートは回さない**
- 新しく写す物: `lingua.<id>.made.got` ── `language.created_at` の写し。
  `langNameOf`／`langWsysOf`／`langOwnOf` と同じ形（メモリ＋ディスクの写し、
  `slGot()` 一本、上る道なし、`wipeLangsGo()` と `lsWipeAcct()` が取る）
