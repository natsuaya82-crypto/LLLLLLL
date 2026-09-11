# r10-kb ── 空の板を二枚作ったら二枚のまま

- 日付: 2026-09-09
- 枝: `claude/r10-kb`（`origin/integ-0905` の先頭から）
- オーナー決定 2026-09-09（`docs/FEATURE_RULES.md` 決定ログ「画面で訊いて
  答えの出た十一」の 9）:「ダメに決まってんだろ」── 空のキーボードを二枚
  作ったら二枚のまま。

## いまの姿

`kbIded()`（`www/keyboard.js`）が **id を除いた中身が一バイト違わない板**を
一枚にまとめます（`87a2e2d8`、2026-09-07 の「増殖した写しを消す」DELETE
REVIEW）。`kbAdd()` が作る板は `{id, nm:'', pat, lay:kbBlank(...)}` なので、
同じ型で二枚作ってどちらも触っていなければ id 以外が同じ ── 次に読んだとき
一枚になります。`docs/BACKLOG.md`「空の板を二枚作ったときに一枚になる」。

## やること

- **中身で一枚にまとめる道を消す。** 人が二回押したものは二枚。まとめるのは
  **id が同じもの**だけ ── それは写しではなく同じ板です。
- **増殖の元を特定して、その元が消えていることを測る。**「そもそも増殖させる
  な」（OWNER 2026-09-07）が本当の指示なので、`git log -S"kbIded"` と
  `docs/CHANGELOG.md` 2026-09-07 の DELETE REVIEW を読み、写しがどの道で増えて
  いたかを再現して赤で見る。
- 板の数が減る道が無くなるので DELETE REVIEW は要りません。CHANGELOG には
  「一枚にまとめるのをやめた」と、増殖の元を何と特定したかを書きます。
- `docs/BACKLOG.md` のその項目は消します。

## 押さえるもの（`tools/kb-check.mjs`）

- 空の板を二枚作って保存して読み直す → 二枚（**いま赤になるはず**）
- 増殖の元を再現しても増えない

## 触ってよいファイル

`www/keyboard.js`、`tools/kb-check.mjs`、`tools/fixture.mjs`、
`docs/CHANGELOG.md`、`docs/BACKLOG.md`、`docs/scope/r10-kb.md`。
**`www/index.html` は触りません。**`www/sync.js` も触りません。

`npm test` は回しません（rule 2 ── 押さえる check だけ、赤を見てから緑）。
