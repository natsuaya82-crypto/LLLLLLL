# r160-newline — 改行キーで改行されない

ブランチ `claude/r160-newline`（`origin/integ-0905` から）。

## 報告
改行キーを押しても改行されない。どの画面・どのキーボードかは未確定（オーナー確認中）。

## やること
- 実アプリ（headless）で、全画面の全テキスト欄に「改行」を入れて測る。
  - 拡張と同じ `insertText("\n")`（`beforeinput`/`input` の insertText "\n"）
  - iOS システムキーボードと同じ Enter の keydown
  - 欄の値に `\n` が残るか、KD(Enter) が横取りするか、`puaTyped()`/IN の受け手が落とすか、
    保存・投稿結果に残るか、描かれた行に出るか。
- 複数行であるべき欄で落ちていたら、落としている一箇所を書き直す。
- headless で落ちなければ「原因は分かっていない」とし、最初の変更は答えを残すもの。

## 触ってよいもの
- 改行を落としている一箇所（測定で特定してから）と、それを持つチェック（`pua-check` か `line-check`）
- `tools/` に測定用スクリプト、`docs/scope/r160-newline.md`、`docs/CHANGELOG.md`、`shots/r160-*.png`

## 触らないもの
- 1 行欄（検索・名前・つづり）が Enter を無視するのは仕様。列挙のみ。
- `CLAUDE.md`（下の「CLAUDE.md（リーダーが直す）」に提案を書く）

## 測定結果
（測定後に書く）

## CLAUDE.md（リーダーが直す）
（あれば書く）
