# r96-hand — 手書きのキーボード（1.0.3）

枝: `claude/r96-hand`（`integ-0905` から）。決定: `docs/FEATURE_RULES.md`
「### 2026-09-25 キーボードはプランで分けない」の「手書きのキーボード」── キーボードの面に指で書くと、
その言語の自作文字の中から一番近い字が入る。プランで分けない（`can()` を足さない）。

## 形（一行ずつ）

- 手書きは **面（`lay` の一枚）** に乗せる。印は面の `hand:1`。行き来は今ある面のキー（`k:'lay'`）で、横に仕組みを足さない。
  編集画面の面の＋の横に「手書き」を置き、`kbAddLay('hand')` が手書きの面を足す（行き・帰りのキー付き）。
- 比べる元は share.js が既に渡している字の形（`shareFace()` の `st`、800 の箱の凸多角形）。手書きの面がある板にだけ、
  その言語の描いた字の顔の一覧 `hand` を keyboard.json に足す（新しく App Group に置く物 ── CHANGELOG に先に書く）。
- 近さの測り方は一つのファイル `ios/App/LinguaKeyboard/hand.js` の一つの関数。拡張は JavaScriptCore でそれを動かし、
  検査 `tools/hand-check.mjs` は Node で同じファイルを動かす（二つ目の写しを Swift に書かない）。

## 変えてよい物

- `ios/App/LinguaKeyboard/` の Swift と新しい `hand.js`、`ios/App/App.xcodeproj/project.pbxproj`（Sources と Resources）
- `www/share.js` `www/keyboard.js`
- `www/i18n/*.js` `www/act-map.js`（末尾に足すだけ、r94 と行を分ける）
- `tools/hand-check.mjs`（新）、`package.json` の script、`tools/gate.mjs` の FAST
- `docs/keyboard-extension.md` `docs/keyboard.md` `docs/CHANGELOG.md` `docs/FEATURES.md` この文書

## 変えない物

`www/post.js` `www/me.js` `www/net.js` `www/shell.js` `www/sns.js` `www/index.html`（r94 の物）。
CSS が要れば止めて報告。見た目・置き場所・待つ時間など決めきれない物はオーナーの物 ── 素直な形で作って報告に書く。

## 触る前に見た他の枝

`origin/claude/r94-social` が `www/act-map.js` `www/i18n/*.js` `docs/CHANGELOG.md` にコミットを持つ。
こちらは末尾に足すだけ。その他の持ち物に他の枝のコミットは無い（`git log origin/integ-0905..origin/claude/r94-social -- <file>`）。
