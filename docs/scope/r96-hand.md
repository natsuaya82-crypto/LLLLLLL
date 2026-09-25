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

---

# 報告（2026-09-25、最終）

## 1. 手書きのキーボード（オーナーの答え 2026-09-25 で作り直した）

- 手書きは**キーボードの型**（`KB_PATS` の `hand`、`kbHandLay()`）。一面だけ: 書く場所＋空白・削除・改行。面の＋は出さない。
- 書いて 0.6 秒で、その言語の描いた字の近い順 8 つ（`HAND_PICKS`）を**候補のバー**に並べ、押した字を `typed()` で入れる。
- 近さは `ios/App/LinguaKeyboard/hand.js` の `handDist()` 一つ、並べるのは `handRank()`。拡張は JavaScriptCore（`HandPad.swift` の `Hand`）。
- 書く場所に点線の四角と十字（拡張・編集画面・型と一覧の絵）。
- `keyboard.json`: 手書きの板の面に `hand`（書く場所の行数、`kbHandRows()`）、板に `hand`（描いた字の顔）。ローマ字の面は付けない。
- 検査 `tools/hand-check.mjs`（FAST）: 26 字 × 9 通りの書き方 × 6 回。候補の中に書いた字 1404/1404、一番目は崩し一種 154〜156/156・全部同時 146/156。
  赤を見た: 片道の測り方／位置合わせ無し／Resources から外す／傾き戻し無し／並びを逆に。

## 2. 字を選ぶ画面は一つ（リーダーの指示）

- 種類は `WORLD_SCRIPTS` 一か所（24 種、字は `wsChars()`）。文字の「既存文字から選ぶ」・キーの画面・オンボーディングが同じ物を読む。
- `pkKindsHTML()`（一覧、キーの時は先頭に自作文字）→ `pkKind()`（種類のページ、route `pickk`）→ `pkTake()`（押すと選ぶ、もう一度で外す）。
- 消した: 字の入力欄、キーの画面の「なし」、編集画面の「文字を入力」欄（`kbChOnHTML`・`kbChHTML`・`KB_CH_MAX`）、`pkSwitch`・`ltTakeChar`・`pkSetCh`。
- 持ち物外だが直した: `tools/kb-check.mjs`・`keep-check.mjs`・`fixture.mjs`（消した関数を名指ししていた）、`i18n-check.mjs`（種類の字を表から覚える）。
  赤を見た: キーの一覧から自作文字の行を外す → kb-check 10 本赤。

## 3. フォントの書き出しは文字の画面の右上（リーダーの指示）

- 共有のマークを `vLetters()` の右上へ、キーボードの一覧から外した。Plus のまま。
- 別々のコミット: 移動（振る舞い）→ 関数を sound.js へ移すだけ → 改名 `ltFontOut`・`ltFontName`。

## 回した検査

FAST 全部、hand・kb・keep・act・conv・i18n を一回ずつ（書き換えた検査がある所だけ）。**ゲート全部は回していない。**

## 試していないこと

- **Swift は一行もビルドしていない。** 実機: ビルド／手書きで候補が出て押すと入る／JavaScriptCore が hand.js を読める／高さ／ダークの線／フルアクセス無し。
- 字を選ぶ画面・フォントの書き出しは画面の写真まで（`shots/r96-*.png`）。

## リーダーへ

- `www/index.html` の `.pkchars` は「その場で開く」形の高さ上限とスクロールを持ったまま。今は `pkCharsHTML()` が要素に上限を外す指定を書いている。
  index.html が空いたら規則の方を直して、その指定を消すこと。`.pkown`・`#own-ch` の CSS はもう誰も着ていない。
- `docs-check` は `ios/` の `.js` の関数を定義として読まない（docs で `handRank()` と書くと落ちる）。
- 決定ログの Implementation status（手書き・字を選ぶ画面・フォントの書き出し）は直していない。
