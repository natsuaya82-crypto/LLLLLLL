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

# 報告（2026-09-25）

## 何を、どのファイルで

- **手書きの面**（`www/keyboard.js`）: 面のタブの＋の横に「手書き」。`kbAddLay('hand')` が `hand:1` の面を足す
  （戻るキー・空白・削除の一行、元の面の最後の行の頭に行きのキー。一板に一枚、`kbHandAt()`）。
  シートでは面の行の上に書く場所（`kbPadHTML()`）。書く場所の行数は `kbHandRows()` 一か所。
- **渡す物**（`www/share.js`）: 手書きの面がある板だけ、`keyboard.json` に `hand`（描いた字の `shareFace()` 一覧、
  `ltPuaOrder()` の順）と面の `hand`（行数）。無い板のファイルは変わらない。
- **近さ**（`ios/App/LinguaKeyboard/hand.js`、新）: `handDist()` が唯一の測り方 ── 32×32 に長い辺で合わせて真ん中、
  傾きを 0.3 まで戻し、互いの一番近い点までの距離の二乗の平均を両向き。`handNear()` が一番近い番号。
- **拡張**（`HandPad.swift` 新、`KeyboardViewController.swift`、`Shared.swift`、`project.pbxproj`）: 面に `hand` があれば、
  上に書く場所・下に面の行。指を離して 0.6 秒で `hand.js`（JavaScriptCore）に聞き、キーと同じ `typed()` で入れる。
  hand.js は拡張の Resources、HandPad.swift は Sources。
- **検査** `tools/hand-check.mjs`（FAST、`npm run hand`）: 同じ hand.js を Node で。26 字（otf5 の `glyphContours` と glyph.js の
  `GPEN`）を、ずらす・縮める・揺らす・回す・傾ける・潰す・書き順と向きを変える・一画ずつずらす・全部同時、で各 156 回。
  位置・大きさ・書き順は全部正解が条件、崩し一種ずつは 95%、全部同時は 90%（この線は検査の物で、私が置いた）。
  今の数: 崩しは 154〜156/156、全部同時 146/156。Resources に hand.js があることも見る。
- i18n 十言語の末尾に `kb.lay.hand`。docs: keyboard.md・keyboard-extension.md・FEATURES.md・CHANGELOG（コードより先）。

## 試したこと（CODE CONFIRMED）

- 赤を見た: ①測り方を片道に → 3 本赤 ②位置・大きさの合わせを外す → 9 本赤（6/156）③hand.js を Resources から外す → 赤
  ④傾き戻しを外す → イタリック 147/156 で赤。全部戻して緑。
- FAST 19 本とも緑（取り込みの後も）。pre-commit の i18n 十言語緑。
- 本物のアプリで「手書き」を押した: 面が 2 に増え、`shareKbd()` が面 2 に `hand:4`、`hand` に描いた字 5 つ（全部に形と PUA）。
  写真: `shots/r96-kb-{before,hand,after}{,-dark}.png`（コミット済み）。

## 試していないこと

- **Swift は一行もビルドしていない**（Linux）。実機で要る確認: ビルドが通る／手書きの面に行って書くと字が入る／
  JavaScriptCore が拡張の中で hand.js を読める（Bundle と JSContext）／高さが他の面と揃う／ダークモードの線の色／
  フルアクセス無しでも動く。
- SLOW の検査（press・act・kb・conv など）は回していない（リーダーの物）。press は「手書き」も押すはず。
- fixture に手書きの面の顔は無い（`tools/fixture.mjs` は持ち物外）── 写真は scratchpad の使い捨てスクリプトで撮った。

## オーナーに訊くこと

1. 一番近い字を**一つ入れる**形にした。候補を何個か出して選ぶ形にするか。
2. 指を離して**0.6 秒**で読む。この待ちでよいか。
3. 行き来のキーは面の番号（「2」）を着ている。手書きの印にするか。「手書き」ボタンは印が決まっていないので字のまま。
4. 書く場所は背景無し・枠無し。書いた線は 4pt。見た目はこれでよいか。
5. 手書きの面は一板に一枚、戻るキー・空白・削除だけ（改行は無し）。これでよいか。

## リーダーへ

- 取り込んだ `integ-0905` の決定「字を選ぶ画面は一つ」の Implementation status が「**r96 が手書きの前にやる**」。
  私への指示に無く、`openPick()` の側（文字・オンボーディング）は持ち物外なので**手を付けていない**。territory を切って指示を。
- `docs-check` は `ios/` の `.swift` の `func` しか定義として読まないので、docs で `handNear()` と書くと落ちる（括弧無しで書いた）。
- 決定ログの手書きの行の Implementation status は持ち物外なので直していない。
