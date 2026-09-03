# 監査 ── 審査で落ちる所と、検査が見ていない所

- 日付: 2026-09-03
- 枝: `claude/code-refactoring-review-nqwv18`
- 基準にした木: `master` の `54c9dde0`（「ルールを今のものに書き換える」）
- 範囲: `www/` 44,214 行、`ios/` の Swift 21 本、`tools/` の 39 本の検査、
  依存の podspec。**全部を読んだのではなく、機械で掃いてから当たった所だけ読みました。**

## 測って、綺麗だったもの

書いておかないと、次のセッションが同じ所をもう一度掘ります。

| 何を | どう測ったか | 結果 |
|---|---|---|
| 他人の文字列が markup になるか | 全 37 ルートを、全文字列を `<img onerror>` に置き換えて歩いた | 0 件、例外も 0 |
| 320pt（SE2）での表示 | 全 37 ルート、横溢れと 44pt 未満の当たり判定 | 0 件 |
| 横向き（568×320） | 同上 | 0 件 |
| 壊れた形の投稿 | 投稿の 14 個の欄 × 6 通りの壊し方 = 84 通り | 例外 0、白画面 0 |
| ES5 の落とし穴 | 比較子なしの `sort`、基数なしの `parseInt`、ループ変数の閉じ込め | 0 件 |
| 読み込み順 | 402 箇所の読み込み時呼び出しを推移的に追った | 0 件 |
| 重複した関数名 | 最上位 1,882 個 | 0 件 |
| ゲートに入っていない検査 | `tools/*-check.mjs` と `FAST`/`SLOW` の差 | `rls-check` のみ（意図的） |

## 直すもの

1. **`PrivacyInfo.xcprivacy` が無い。**`AppleProvider.swift`（バイナリに入る）が
   `UserDefaults` を使い、その pod にも `ios/` にも一覧表が一枚も無い。
   緑のあとメールで断られる型 ── build 86 の `ITMS-90158` と同じ出方。
2. **キーボードの `RequestsOpenAccess`。**拡張は読むだけで、書き込みも通信もしない。
   Apple の既定の砂場は「書き込みを禁じ、読み取りは許す」。ガイドライン 4.4.1 は
   「フルアクセスを要求せずに動くこと」を要求している。だから `false`。
3. **読み込み順を止めるものが無い。**`tools/order-check.mjs` を足す。
4. **`netDay()` が今日を訊いていない。**

## 触るファイル

`ios/App/App/PrivacyInfo.xcprivacy`（新）、`ios/App/App.xcodeproj/project.pbxproj`、
`ios/App/LinguaKeyboard/Info.plist`、`tools/assets-check.mjs`、
`tools/order-check.mjs`（新）、`tools/gate.mjs`、`package.json`、`www/net.js`、
`docs/CHANGELOG.md`、`docs/STATE.md`、この文書。

**`www/index.html` は触りません。**

## 当たっている枝

止まった枝を含めて、上のファイルは全部どこかの枝が触っています
（`www/net.js` に 76、`package.json` に 62、`docs/CHANGELOG.md` に 443）。
生きているセッションではなく、`master` に取り込まれていない古い枝です。
差分は最小にしてあります ── `netDay()` は 3 行、`gate.mjs` は配列に 1 語。

## 報告して、直さなかったもの

- **`save()` の五つの書き込みが一つの `try`。**書き換えであって条件の追加ではないので、
  独立した仕事。オーナーの返事待ち。
- **`lsWipeAcct('')`。**サインアウト中は設定に入れないので押せない ──
  最初の報告は**間違い**でした。残るのは `netTook()` の三番目の落とし先で
  `uid` が空のままサインインしている場合だけ。`docs/STATE.md` が既に挙げている。
- **CSS の二重宣言 10 箇所。**うち 3 つは `@media` の正当な上書き。
  `box-check` は出現回数を捨てるので見えない。新しいリーダーの持ち物。
- **`index.html` の 96% が CSS で 373 コミットが触る。**同上。
- **通信に `timeout` が無い。**`netSend` の上のコメントの主張が成り立たない。
