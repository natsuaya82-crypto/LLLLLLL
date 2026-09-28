# r125 — 入力欄のカーソルを字の高さに

ブランチ `claude/r125-line`（`integ-0905` 7ad9b612 から）。

## 仕様（オーナー 2026-09-27）

「直してください」── 投稿・編集の入力欄のカーソルが字の約 2 倍の高さ。

測った原因（r119-edit、`shots/r119-lh-*`）: `www/index.html` の
`.pline,.pwfield #pw-ln` が `line-height: calc(1.7em * var(--ink-over))`
＝ 15px で約 35.4px。iOS はカーソルを行の箱いっぱいに描く。

## 形

その一つの規則を書き直す（入力欄と投稿が共有、二つ目は作らない）。行の箱は
字の高さ近く、行の間は字の箱の外で作る。投稿の見た目はほぼ変えない。
縦書きでも字間どおり。

## 触る物

- `www/index.html` — `.pline,.pwfield #pw-ln` と、それで割っている規則だけ
- `tools/line-check.mjs`
- `docs/`（FEATURE_RULES 決定ログ、CHANGELOG、この頁）、`shots/r125-*`

## 触らない物

上以外すべて。
