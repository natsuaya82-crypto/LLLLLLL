# r162 — 「,」「.」を描く枠に足す、一番下の段は「! ? , . スペース 改行」、削除キーは ⌫

決定: docs/FEATURE_RULES.md § Owner decision log 2026-10-02「「,」と「.」を描く枠に足す。一番下の段は「! ? , . スペース 改行」、削除キーは ⌫ の形」。

1. `,` と `.` を、言語が生まれる時の枠に足す（どのプランも）。`LT_START`（`www/letters.js`）が一か所、`ltSlotsFill()` がそれを敷く。無料の言語は起動の補充（`ltStart()`）で入る。有料の既にある言語には足さない（今と同じ）。何も消さない・名前を変えない。
   - 枠の id は `lt.cm`（,）と `lt.pd`（.）── `!` `?` が `lt.ex` `lt.qm` なのと同じ理由（id に記号を入れない）。
   - サーバーの `slice_slot()`（`supabase/schema.sql`）は `ltSlotKey()` と同じ字の並びを持っているので、同じ commit で同じに直す（片方だけだと二つの答え）。**本番に流すのはオーナー。**
2. 1 枚目の QWERTY の一番下の段は `! ? , . [スペース 4] [改行 2]`（横 10）。`KB_ENDS`・`kbFixed()`（`www/keyboard.js`）。字の無い記号は今の `! ?` と同じに `kbRom()` の普通の字。
3. 削除キーは ⌫（四角に ×、左向き）。`ICON_DEL` を `www/glyph.js` の `ICON_*` に足し、アプリが削除キーを描く所（`kbFace()`）で使う。`ICON_BACK` は戻るのまま。キーボード拡張（`KeyBoardView.swift`）は SF Symbol `delete.left`。

## 変えてよいもの
- `www/letters.js`（`LT_START`・`LT_SLOT_MARK` とそのコメント）、`www/keyboard.js`（`KB_ENDS`・`kbFixed()`・`kbFace()`）、`www/glyph.js`（`ICON_DEL`）、`www/share.js`（`shareRomLay()` がずれる場合のみ）
- `supabase/schema.sql`（`slice_slot()` の字の並び）
- `ios/App/LinguaKeyboard/KeyBoardView.swift`（削除キーの絵）
- `tools/kb-check.mjs`・`tools/migrate-check.mjs`・`tools/plan-check.mjs`・`tools/conv-check.mjs`・`tools/rls-check.mjs`・`tools/fixture.mjs`・`tools/base-check.mjs`、ほか数え方が変わるチェック
- `docs/CHANGELOG.md`（コードより先）、`docs/scope/r162-punct.md`、この変更で嘘になる文書の文（CLAUDE.md を除く）
- `shots/r162-*.png`

## 変えないもの
- `www/act.js`・`www/post.js`・欄のクラス（r161）、CLAUDE.md（下にリーダー向けの差し替え文）、ほかの画面、サーバーの他の関数

## CLAUDE.md（リーダーが直す）

§ What the free plan is の四か所。数は四十（a〜z 26・! ? , . 4・数字 10）。

1. 2084〜2086 行
   - 今: 「`ltSlotsFill` puts thirty-eight letters into a language the moment it is made — a to z, `!`, `?`, and a digit for every value the base has」
   - 差し替え: 「`ltSlotsFill` puts forty letters into a language the moment it is made — a to z, `!`, `?`, `,`, `.`, and a digit for every value the base has (`,` and `.` since 2026-10-02 「コンマとピリオドくらいはありやな」)」
2. 2089 行
   - 今: 「**The thirty-eight are not what the free plan is GIVEN, …」
   - 差し替え: 「**The forty are not what the free plan is GIVEN, …」（後ろはそのまま）
3. 2100 行
   - 今: 「Because the letters are exactly a-z, `!` and `?`, and their names cannot change」
   - 差し替え: 「Because the letters are exactly a-z, `!`, `?`, `,` and `.`, and their names cannot change」
4. 2128〜2129 行
   - 今: 「And `!` and `?` stand together at the near end of the bar along the bottom — `! ? space return` 「！？スペース　改行」, because …」
   - 差し替え: 「And `!` `?` `,` `.` stand together at the near end of the bar along the bottom — `! ? , . space return` 「！？スペース　改行」, `,` and `.` beside them since 2026-10-02, because …」（`KB_ENDS` が並び、`kbFixed()` が形）

ほかに「削除キーは ⌫（`ICON_DEL`）、戻るは `ICON_BACK`」を足すなら rule の「AN OPERATION THAT HAS A MARK」の段落の「delete is the bin」の後ろ ── ただしゴミ箱（消す操作）とキーボードの削除キーは別物なので、足さなくても嘘にはならない。リーダーの判断。

## 結果
- 枠: `6e05d88a`、一番下の段: `c3483944`、削除キー: `59ba7d3f`。
- 回したチェック: FAST 全部、kb・migrate・plan・conv・base・again・taken・theirs・sheet・pua・open・act・i18n・line、`npm run rls` ── 全部緑。press とゲート全体は回していない（サブリーダー）。
- 本番の Supabase には `schema.sql`（`slice_slot()`）を流す必要がある（オーナー）。
- Swift（`delete.left`）は端末のビルドでしか見られない。
