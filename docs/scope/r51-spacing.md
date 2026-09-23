# r51-spacing ── 字間を言語ごとに（OWNER DECISION 2026-09-23）

- ブランチ: `claude/r51-spacing`（`origin/integ-0905` の `c864b5b3` から）
- 決定: 字と字の間を言語ごとに設定できる。既定は今と同じ 1 歩。0 で隣と
  繋がる。置き場所は 設定 → 言語。位置別字形（語頭・語中・語末）はやらない。

## 一つの文

**値は言語のもの。投稿は、書かれた時の値を持つ。**

## 触るファイル

- `www/glyph.js` ── `geSide()` を言語の値から、`inkAdv()` は side を引数で受ける、`inkLine()`
- `www/wsys.js` ── 値の置き場（`SCRIPT.sp`）と、その選択肢の定数、書き手
- `www/core.js` ── `langRead()` が `sp` を読む（今は g/extra/dir しか拾わない）
- `www/post.js` ── 書く瞬間に `ink.sp`、線の下は投稿から読む
- `www/card.js` ── 測る・置くの三つが side を受け取る
- `www/share.js`, `www/numbers.js` ── 作る側、`geSide()` を渡すだけ
- `www/settings.js` ── 言語の部屋に一行
- `www/act-map.js`、`www/i18n/*.js` ── 一行分の名前と言葉
- `tools/sides-check.mjs`（`geSide` を禁止一覧へ）、`tools/card-check.mjs`、
  `tools/acct-check.mjs` または `tools/again-check.mjs`（どちらかが script を歩いていれば）
- `tools/fixture.mjs` ── 撮影に要る状態だけ
- docs: `CHANGELOG.md` `DATA_MODEL.md` `FEATURE_RULES.md` `CHECK-0907.md` `CLAUDE.md`（規則 8 の inkAdv の段落）
- `shots/r51-*.png`

## 触らないもの

- `tools/post-check.mjs` ── `claude/r50-composer` が書き換え中。過去の投稿の検査は `card-check` に置く。
- `www/index.html` ── `.set select` が既にある。触らずに済む見込み。
- `supabase/schema.sql` ── `post.body` は jsonb で制約なし。`netBody()` がそのまま運ぶ（実測して報告）。
- `ios/` ── `CandidateBar.swift` は渡された送り幅を読むだけ（確認して報告）。
