# r39-tags ── タグは本文の外へ。翻訳の下に、最大 4 つ

ブランチ `claude/r39-tags`（`integ-0905` = `d91617c0` から）。
**取り込むのはサブリーダー／リーダー。全ゲート（`npm test`）は回していません。**
単体の check だけ回します。

## オーナーの決定（2026-09-15 夜）

> 「#はべつで」
> 「リプライトゥー@〇〇のサイズ感で翻訳の下で最大4つまで別枠で入れられるとかは？」
> 「返信はok」（投稿の頭の 表示名 @handle はそのまま）
> 「文字サイズはこのままでいい」（本文の字は変えない）
> 「見た目見せて できたら投稿のとこ」

これは 2026-09-04 の「タグは本文中に。」を**差し替える**決定です。決定ログの
古い文は消し、差し替えたと書きます（`docs/CHANGELOG.md` は残します）。

## この session が触る file（これ以外は触りません）

- `www/post.js` ── 投稿画面のタグの枠、`pwSend()`／`draftKeep()`、描く側の行
- `www/sns.js` ── § THE TAG（タグ一つの綴り・見せ方・上限）とタグの行
- `www/net.js` ── 検索の道（`netFindPosts()`）だけ
- `www/index.html` ── タグの行と枠の CSS（**この session が持ちます**）
- `www/i18n/*.js` ── 10 言語同時
- `www/act-map.js` ── 新しい名前
- `tools/post-check.mjs`、`tools/fixture.mjs`
- `docs/CHANGELOG.md`（先に書く）、`docs/FEATURE_RULES.md` 決定ログ、
  `docs/FEATURES.md`、`docs/DATA_MODEL.md`、`docs/CHECK-0907.md`、
  `docs/scope/r39-tags.md`
- `shots/r39-*.png`

**触らない**：`docs/STATE.md`、`www/card.js`（カードにタグは乗せません ──
決まっていない物は足さない）、`supabase/schema.sql`（`body` は jsonb なので
検索に列は要りません）。

## 作る形

1. 投稿画面：本文とは別のタグの枠、最大 4。`#` は打っても打たなくても同じ
   （貯めるのは `#` 無しの一つの綴り）。5 つ目は入れ物が増えない。
2. 投稿：**翻訳（意味の行）の下**に横一行。字は「@〇〇 への返信」の行と同じ
   （`.pto` の `.84rem`）。押すとそのタグの検索。タグ 0 ならその行は無い。
3. `#今日のお題` もこの枠に入る。本文には入らない。
4. `post.body.tags`（配列・最大 4・`#` 無し・小文字にしない）。
   **前からある投稿は書き換えません** ── 本文の `#〜` は今までどおり青い。
5. 下書きにもタグが乗る。カードは本文だけ。

## 報告

作業が終わったらこの file に：変えた file、振る舞い、新しく貯まる物、
赤を見た出力、回した check、スクショの一覧、CODE CONFIRMED / DEVICE CONFIRMED。
