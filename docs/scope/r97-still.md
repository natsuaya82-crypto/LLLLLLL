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
- 前からの赤だった `post-check` の「意味が箱の下」四つ（260/308 の返信）: 意味の切り替えを意味の欄と同じ行の右端に
  置いて直した（板の中は一行と意味の二つの欄だけ、104 の床はそのまま）。元に戻して四つ赤、直して緑を見た。
  写真 `shots/r97-reply-*`（オン・オフ、キーボード無し・336・536）。

## 確かめたこと・確かめていないこと

- CODE CONFIRMED: FAST 全部、`post-check`、`acct-check`、`tl-check`。赤→緑は上の通り。
- DEVICE CONFIRMED: 無し。Swift（`keepStill()`、`LinguaStore.review`）はここでビルドしていない。

## 実機で見ること

1. 投稿画面でキーボードが出た後、画面を上下に速く揺らす ── 上のバー・道具の行・中身が動かないか。
2. 日本語⇄ローマ字のキーボードの切り替えで、道具の行がキーに付いたまま動くか（隙間が出ないか）。
3. キーボードが上がる・下がる時の動き ── 下端が縮む間にちらつき・空白が出ないか（`UIView.animate` をキーボードと同じ曲線で）。
4. 道具の行の下: キーボードが下りている時はホームバーの分だけ空き、上がっている時は空かないか（`env(safe-area-inset-bottom)` が縮んだ画面で 0 になるか）。
5. メモの画面（本文がキーボードの真上まで）、写真に字を置く画面（色の列とつまみ）。
6. 検索などの画面で、文字を打つ間だけ下のタブ・丸い＋・下の帯が消え、キーボードを下ろすと戻るか。
7. 小さい iPhone（SE）の返信で、一行と意味が見えるか。意味のオン・オフ。
8. 評価のお願いが、サインインして開いた五回目に出るか（TestFlight・開発ビルドでは iOS が出さないことがある）。

## オーナーに訊くこと

1. 端末に残っている `SET.vvkb`（キーボードの高さの測り、もう誰も読まない）を消すか。DELETE REVIEW は `docs/CHANGELOG.md` 2026-09-25。
2. 評価の「開いた」は今アプリの起動だけを数える。バックグラウンドから戻った時も数えるか。
3. 文字を打つ間は下のタブ・＋・下の帯を隠す（前はキーボードの裏に隠れていたのと同じ見え方）── この形でよいか。
4. 意味の切り替えを意味の欄の右端に置いた ── この場所でよいか。

## リーダーへ

`www/home.js:169` の `--vvmin` の文は、この枝の前から古い（`--vvmin` は無い）。home.js は r96 の持ち物なので触っていない。
