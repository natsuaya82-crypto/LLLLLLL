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

## 触る file を一つ増やしました ── `www/glyph.js`、render() の一行

宣言になかった file です。理由は測ったもので、推測ではありません。

**起動の途中で出したポップは、親指が届く前に消えていました。** `render()` は
先頭で `popOff()` を呼びます（「Any navigation takes the popup with it」）。
段の答えは起動の最中に届き、その後も答えが届くたびに `render()` が走るので、
`capLapseSaw()` が描いたポップはその次の render で落ちていました。

**測り方**：`#pop` に markup が在って `on` class が無い状態で残っていた。その
class を書くのは `www/shell.js` の三箇所だけ（`popPaint`／`popOff`／`popOn`、
grep で確認）で、押されていない `popOff()` の呼び手は `render()` しかない。
`plan-check` の claim が二回赤になって出たものです。

**直し方**：`render()` の一行を `popOff()` から **`popTurn()`**（`www/shell.js`、
`popAsk()` の隣）に替えました。画面についての**問い**は今までどおり消え、走りに
ついての**状態**（このポップ一つ）は描き直されます。答えると ── 閉じるでも、
暗がりを触っても ── `popOff()` に着いて状態は消えます。
`www/glyph.js` は取り込まれていない枝が一本触っています（`2935e2e3`、
`claude/r14-keep`、保存ボタンの書き換え）。行は離れていますが、取り込みの順は
リーダーのものです。

## 報告

枝 `claude/r34-lapse`（`origin/integ-0905` = `24561793` から）。commit 六本、
一件ずつ、毎回 push 済み。報告の前に `git fetch --all --prune` して、
`origin/integ-0905` も `origin/master` も HEAD の祖先であることを確かめました
（追いつく必要なし）。

### 1. `docs/scope/r34-lapse.md` ── `c1b601ca`（code の前）

### 2. CHANGELOG に「新しく保存する物」 ── `3f025830`（code の前）

### 3. サーバーの列と関数 ── `d074abfb`

- **触ったもの**：`supabase/schema.sql`、`tools/rls-check.mjs`。
- **増える物**：`plan` 表に `was text check (was in ('free','plus','pro'))` と
  `lapse_seen_at timestamptz`、どちらも `add column if not exists`。
  関数 `plan_lapse_seen()`（security definer、引数なし、
  `update plan set lapse_seen_at = now() where id = auth.uid()`、
  `authenticated` にだけ execute、`is_member()` でなければ raise）。
- **消える物・移行**：なし。既にある行は二列とも null で始まります。
- **`plan` 表への直接の書き込みは増えていません** ── policy は足していません
  （`rls-check` の「a plan is read-only through the API」は policy の数を
  数えていて、今も 0）。
- **claim 六件**（`rls-check`）：B が呼べる／**そのとき A の印は付かない**／
  アカウントの無い人は呼べない／A は自分の行に付けられる／付いている／
  **段と `was` は動いていない**。
- **赤を見た**：`where id = auth.uid()` を外すと「A の印は付かない」が赤、
  `is_member()` を外すと「アカウントの無い人は呼べない」が赤。二回とも別々に
  走らせて確かめ、戻して緑（`npm run rls`、372 attempts / 52 shape、緑）。

### 4. verify-plan が「前の段」を書く ── `ab94c323`

- **触ったもの**：`supabase/functions/verify-plan/index.ts`、`supabase/setup.md`。
- **振る舞い**：段を書く直前に今の行の段を読み、**下がる時だけ** `was` に前の段と
  `lapse_seen_at` に null、**上がる時**は両方 null。**同じ時はこの二列を body に
  載せません** ── PostgREST の merge-duplicates は載っている列だけ更新するので
  行はそのまま残ります。載せて null にすると、起動が書いた知らせを、同じ起動で
  値段の頁がもう一度呼んだ時に消します（まだ見ていない知らせが消える）。
  「☑ を付けずに閉じたら次の起動でまた出る」が要求しているのはこれです。
- 答えに `was` と `lapse_seen` を足しました。書いた行を
  `return=representation` で読み返して載せています（「同じ」の場合に組み立て
  直すと嘘になる一箇所）。段の梯子は `verify.mjs` の `ORDER` 一つ。
- **deploy はオーナー**：`supabase/setup.md` § 8c に、流す物二つ（schema.sql
  貼り直し、`npx supabase functions deploy verify-plan`）と、SQL Editor で
  確かめる二つの問い合わせ、実機で見る三つを書きました。
- **この環境では動かせません**（Deno も project も無い）。`npm run vplan`
  （`verify-check`、27 claims）は緑ですが、それは `verify.mjs` についての
  check で、`index.ts` を通す check はこの repo にありません。**index.ts は
  CODE 未確認です** ── 読んで書いただけで、走らせていません。

### 5. アプリ：起動のポップ ── `e802e5fb`

- **触ったもの**：`www/net.js`（答えの受けと `netLapseSeen()`）、
  `www/settings.js`（`openCapLapse()` を書き直し）、`www/shell.js`
  （`popPaint()`／`popStay()`／`popTurn()`）、`www/glyph.js`（render の一行、
  上の節）、`www/act-map.js`、`www/i18n/*.js` 十本、`tools/fixture.mjs`
  （面二つ）、`tools/plan-check.mjs`。
- **振る舞い**：`was` が plus か pro で `lapse_seen` が偽なら、**その走りで一度**、
  `#pop` に見出し「プランが終了しました」／☑「今後表示しない」／「閉じる」。
  ☑ を付けて閉じた時だけ `plan_lapse_seen` を呼びます。付けずに閉じても、
  暗がりを触っても、何も書かずに消えます。
- **端末には何も書きません**（`SET` に印なし、`lingua.set` に lapse の字なし ──
  claim あり）。
- **消したもの**：`openCapLapse()`、`FORM_OPEN.lapse`、`cap.lapse.d`（十言語）。
  `cap.lapse.h` と `cap.lapse.ok` は流用、`cap.lapse.never` を十言語に新設。
- **四つ目の仕組みは作っていません**：`#pop` は `popAsk()` と同じ `popPaint()`
  一箇所。☑ は既にある `swtHTML()`（`.swt`）。**`www/index.html` に足した行は
  ありません。**角丸・枠も足していません（`box-check` 104/104、JS から 0）。
- **claim 十一件**（`plan-check`）：起動でポップが出る／端末に何も書かない／
  ☑ で閉じると `plan_lapse_seen` が一回／印はサーバーに付く／次の起動は静か／
  ☑ 無しで閉じると何も出ず消える／その次の起動でまた出る／既に見た行は黙る／
  段が上がったら黙る／`was` が free でも黙る／段が下がっただけでは何も言わない・
  `was` の無い答えも黙る・言うのは一度だけ。
- **赤を見た**：`capLapseShut()` から ☑ の判定を外す、`lapse_seen` を読まない、
  `was` を読まない、の三つを入れて七件が赤（それぞれの bug に対応）。戻して緑。
  そして上の render の穴は、直す前に二回赤で出ました。
- **写真**：`shots/r34-lapse-1-pop.png`（☑ なし）、`shots/r34-lapse-2-ticked.png`
  （☑ あり）。`tools/shot.mjs` の `hd@` は `#app` に HTML を入れる道なので `#pop`
  は写りません（既にある「the popup, asking」の面も白紙になります ── これは
  この枝が作った穴ではありません）。fixture を種に実物を走らせて撮りました。

### 6. docs ── `71e94fb4`

`docs/DATA_MODEL.md` §「a language that is only read」の天井の文、`www/core.js`
の `langCap()` と `dlCap()` のコメント二つ、`docs/PAID_FEATURES.md` の二文を
「畳む」に書き直し。`docs/BACKLOG.md` の食い違いの項は消しました（オーナーが
決めたので）。`docs/FEATURE_RULES.md` 決定ログ 2026-09-12 に (g)(h) を原文で。
**code は動かしていません** ── `langsSeen()` は前から畳んでいます。

## 回した check

触ったものだけ。**全ゲートは回していません**（規則 2）。

| check | 結果 |
|---|---|
| `npm run rls` | 緑（372 attempts、52 shape）。赤も二回見た |
| `node tools/plan-check.mjs` | 緑。新しい claim 十一件、赤も見た |
| `npm run act` | 緑（10 checks） |
| `npm run i18n` | 緑（10 言語、mirror 450 面） |
| `npm run press` | 緑。`buttons pressed: 16753 (278/279)`、変更の前後で同じ数 |
| `npm run es5` `dead` `box` | 緑（`dead` は 2258 functions / 539 vars、`box` は 104/104・JS から 0） |
| `npm run vplan` | 緑（27 claims）── ただし `verify.mjs` の check で、`index.ts` は通らない |

`press` の「never pressed: saveName」はこの枝の前からです（変更前の走りにも
同じ一件）。

## 状態

- **CODE CONFIRMED**：3・5・6（上の check）。
- **CODE 未確認**：4（`verify-plan/index.ts`）── この環境で走らせる道が無く、
  読んで書いただけです。**オーナーが deploy した後、実機で一度見てください。**
- **DEVICE 未確認**：全部。実機は一度も触っていません。
- **OWNER 未確認**：全部。特に二つ、見てほしいものがあります。
  1. **☑ の形**。オーナーの絵は ☑ ですが、この app の on/off は前から
     `.swt` のトグル一つ（「トグルをつけろって言ってんだろ」）なので、それを
     使いました。写真の通りです。四角い ☑ にするなら言ってください。
  2. **「閉じる」が唯一の出口ではありません** ── 暗がりを触っても、☑ 無しで
     閉じたのと同じに消えます（app の他のポップと同じ）。

## 流す物（オーナー）

`supabase/setup.md` § 8c。**両方やるまでポップは誰にも出ません**（答えに `was`
が無ければ出さないので、途中で止まっていても嘘は言いません）。

1. Dashboard → SQL Editor に `supabase/schema.sql` を丸ごと貼って実行
2. `npx supabase functions deploy verify-plan`
