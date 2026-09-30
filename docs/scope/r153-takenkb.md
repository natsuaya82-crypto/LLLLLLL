# r153 — 人の言語：プランで畳まない、キーボードは取った人が作れる、編集の道を描かない

決定: docs/FEATURE_RULES.md § Owner decision log 2026-09-30
「作れる言語と DL 言語の数は 1・3・無限。人の言語は使うだけ」（追記すべて）と
「公式アカウントのプロフィールは「DL可能言語」の一行…」の (2)。

## 三つ
1. 人の言語はプランに関係なく同じに見える。字は a〜z の外も全部出す（畳まない・アップグレードの行を出さない）。
   プランで畳む（`ltSeen`・`wordsSeen`・`stAll`）は自分の言語にだけ効く。
2. 取った言語のキーボードは、取った人が作れる。作ったものは取った人のアカウントのもので、元の言語（`kb` の slice）は変わらない。
   元の言語にキーボードがあれば今まで通り使え、そのうえ自分のも作れる。
3. 人の言語で、編集の道（保存・既存文字から選ぶ・自作文字をアップロード・字を描く道具…）を一つも描かず、押しても何も書かない。
   問いは `langLocked()` 一つ。面は一覧ではなくチェックが数える。

## 変えてよいもの
- `www/core.js` — `langHold`／`langHeldBack`（取った人のキーボードを下書きに含める）、プランで畳むかの一つの問い
- `www/keyboard.js` — 取った言語のキーボード（取った人のもの）の置き場と、書く／読む道
- `www/net.js`・`www/sns.js` — `take_kb` を読む・書く一つの関数と、`lang` の読み込みへの一行
- `www/share.js` — 署名に取った人のキーボードを含める
- `www/sound.js`・`www/words.js`・`www/phases.js` — 畳むかどうか
- 編集の道を描いている画面のファイル（計測で出たもの）：`www/sound.js`・`www/glyph.js`・`www/sheet.js`・`www/phases.js`・`www/grammar.js`・`www/wsys.js`・`www/numbers.js`・`www/home.js`・`www/notes.js`・`www/words.js`・`www/wordsheet.js`・`www/settings.js`・`www/letters.js`
- `supabase/schema.sql` — 新しい表 `take_kb`（取った人だけが読み書き）。`tools/rls-check.mjs` にその件
- `tools/taken-check.mjs`（新しい）、`tools/gate.mjs`、`package.json`、既存のチェックで主張が変わるもの
- `docs/CHANGELOG.md`（コードより先）、`docs/DATA_MODEL.md`、`docs/FEATURE_RULES.md`（決定ログの実装状況の行）、`docs/keyboard.md`
- `shots/r153-*.png`

## 変えないもの
- 人の言語の外へ出す道（r150、`langOut()`）
- 自分の言語でのプランの差（畳む・足す・消す）
- `CLAUDE.md`、`.claude/`、`tools/pre-commit`、`tools/commit-msg`、`tools/push-alone.mjs`、`docs/STATE.md`

## CLAUDE.md（リーダーが直す）
（作業の終わりに書く）
