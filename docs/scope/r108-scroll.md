# r108 — 戻ったら、その画面のまま

ブランチ `claude/r108-scroll`（`integ-0905` から）。

## 仕様（オーナー 2026-09-26）

「投稿とか通知とかフォロー欄とかなんでもそうなんだけど、投稿の詳細とか見て
戻ったら一番上になるのやめて欲しい。その画面のまま止まって欲しい。全部。」

## 触る物

- `www/shell.js` — `navLand()`（足跡が離れる時の位置を持ち、戻る時に戻す）と
  `backAnswer()`（自分で `scrollTo(0,0)` している道を `navLand()` に通す）
- 検査: 新しい `tools/scroll-check.mjs`、`package.json` の script、`tools/gate.mjs`
- `docs/FEATURE_RULES.md` § Owner decision log に一項、`docs/CHANGELOG.md` に一行
- この scope ファイル（報告も書く）

## 触らない物

- `store/*.json`（r107 の物）
- 他の `www/*.js`。`scrollTo` を呼ぶ他の所は下の表のとおり、進む／同じ画面の
  中の話なので変えない
- `www/index.html`

## `scrollTo` を呼んでいる所、全部（integ-0905 020bb570）

| 所 | 何の時 | 扱い |
|---|---|---|
| `www/shell.js` `navLand()` | 進む・戻る・タブ・go() で足跡の中へ、の全部 | **書き直す**: 足跡の `y` へ。新しい足跡は `y` 無し＝一番上 |
| `www/shell.js` `backAnswer()` | 投稿画面を「下書きに？」の答えで出る | **navLand() を通す**（自分の scrollTo を消す） |
| `www/glyph.js` `render()` | 描き直し。同じ route なら位置を保ち、違えば 0 | 変えない（画面の中の描き直しは動かさない） |
| `www/home.js` `openForm()` | 同じ form を新しい中身で開き直す | 変えない（新しい中身＝進む） |
| `www/onboard.js` `obGo` `obBorrow` `obPickScript` `obDoor` `obMailGo` | オンボーディングの一歩・扉の面 | 変えない（進む） |
| `www/onboard.js` 734 行 | 借りる一覧から描く画面へ一歩戻る | 変えない（オンボーディングは足跡を持たない一本道。報告に書く） |
| `www/onboard.js` `obDone` の終わり | 歩き終えてプロフィールへ | 変えない（進む） |
