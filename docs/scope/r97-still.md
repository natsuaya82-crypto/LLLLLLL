# r97-still — 投稿の画面は揺れない、App Store の評価のお願い（1.0.3）

枝: `claude/r97-still`（`integ-0905` から）。決定: `docs/FEATURE_RULES.md`
「### 2026-09-25 投稿の画面は揺れない」と「### 2026-09-25 カテゴリはグラフィック&デザイン、App Store の評価のお願いを出す…」。

## 変えてよい物

- `www/shell.js` `www/index.html` `www/post.js` `www/notes.js` `www/boot.js`
- `www/core.js` ── 評価のお願いの数え方の一か所だけ
- `ios/App/App/` の Swift（`MainViewController` など）と `project.pbxproj` の Sources
- `tools/post-check.mjs` と、上を持つ検査
- `www/act-map.js` `www/i18n/*.js` ── 要る時だけ、最小に（r96 の物）
- `docs/CHANGELOG.md`、その二つの決定の Implementation status、この文書

## 変えない物

`www/keyboard.js` `www/share.js` `www/home.js` `www/onboard.js` `www/sound.js` `www/glyph.js`（r96）。
評価のお願いを出す回数（五回目）は決定の通り、変えない。`SET.vvkb` は読まなくなるが消さない（DELETE REVIEW、消すかはオーナー）。

## 触る前に見た他の枝

`origin/claude/r96-hand` が `project.pbxproj`（+8）、`www/core.js`（`CAN` のコメント一行）、`www/act-map.js`、`www/i18n/*.js` を持つ。
pbxproj は Sources の行が隣り合う所で衝突し得る。core.js はこちらが触る所と離れている。

---

# 報告（2026-09-25）

- A: `keepStill()`（`MainViewController.swift`）でキーボードの分だけ WKWebView を縮める。`.view.fit` は三段（バー／板／道具の行）。
  追いかける JS は消した。`post-check` 11d2 と「追いかける JS が無い」は赤を見た（4 通り）。写真 `shots/r97-*`。
- B: `rateOpen()`（`www/core.js`）、`LinguaStore.review`、`acct-check` 94（赤を 2 通り見た）。
- 前からの赤: `post-check` の「意味が箱の下」四つは `integ-0905` のままでも赤（260/308 の返信、意味の切り替えの行 44px）。
- 実機で見ること・オーナーに訊くことは、リーダーへの報告に書いた。
