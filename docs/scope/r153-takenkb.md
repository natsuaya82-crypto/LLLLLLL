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
このセッションは CLAUDE.md を編集できない。この変更で次が古くなる／足りなくなる。

1. § Online の「Somebody else's language is on the server and in memory…」の段落の末尾に一文足す（案）:
   > It looks the same on every plan: nothing of it is folded and no upgrade
   > line is drawn 「dl言語は有料無料関係ない」 — what a plan does to a
   > language's shape is `langShaped()` (`www/core.js`), which a taken
   > language never is — and no control that would change it is drawn;
   > `langLocked()` is the one question and **`taken-check` holds it** by
   > walking your own language to find every editor and then every face of
   > a taken copy. The one thing its taker makes is a keyboard of their own
   > for it 「ないやつは自作可能」 OWNER 2026-09-30, which is theirs — the
   > `take_kb` row, not the language's `kb` slice.
2. 規則 5 の「`has()` names a *plan* and is `core.js`'s alone」の近くに、`planNo()` も core.js の外では呼ばない（言語の形は `langShaped()`）と一文。`taken-check` 7 が持つ。
3. 「## What the free plan is」の表の `ltStart` の行は変わらない（`ltStart` が `langShaped(ok)` を訊くようになっただけで、人の言語には元から走らない）。

## 測った・残した物
- `taken-check` が自分の言語を歩くと、派生の新しい単語の画面で元の単語を押すと落ちる（`wdSigEdit`）── r153 の物ではないので `docs/BACKLOG.md` に。
- 文字の一覧のタイルの鉛筆（形の無い字の絵）は人の言語でも出る。押すと読むだけの頁なので書き込みは無いが、見た目は「描く」の印。直すかはオーナーに。
