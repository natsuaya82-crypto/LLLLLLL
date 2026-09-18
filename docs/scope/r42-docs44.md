# r42-docs44 ── 「利用規約」「プライバシーポリシー」が 21px しかない

ブランチ `claude/r42-docs44`（`integ-0905` = `4734f868` から）。
**取り込むのはサブリーダー／リーダー。全ゲート（`npm test`）は回しません。**

## なぜ

`docs/scope/r41-review.md` § 4.0-c。押して測った（390×844、設定のアカウント室を
一番下まで送って）：

```
利用規約              50 × 21 px   押せる
プライバシーポリシー  127 × 21 px   押せる
購入を復元           342 × 50 px   押せる
サブスクリプションを解除する 342 × 47 px  押せる
```

下の二つは 44 を超え、上の二つは 21。オーナーの基準は 44pt
（OWNER 2026-09-01、`docs/FEATURE_RULES.md` 決定ログ）。Apple 3.1.2 で審査員が
必ず押しにいく二つがこれ。

**なぜ緑だったか**：`press` の 44pt の測りは
`#app button, #app input, #app select, #app textarea` を見ていて、
`<a>` を一つも見ていない。この二つは `<a href>`（`www/settings.js` `docRows()`）
なので、測りの外に居た。

## やること ── 順番

1. **check を先に**。`tools/press.mjs` の `measure()` の選び方に `#app a[href]`
   を足す。**二つ目の測り方は作らない** ── 同じ `TAP = 44` の同じループ。
   **バグのままで赤を見る。**
2. `www/index.html` の `.docs a` に縦の当たりを足す
   （`display:inline-block;padding:12px 0` → 45px）。
   **角丸・枠線・背景は足さない**（`box-check` の baseline に一行も足さない）。
   字の大きさ・色は変えない。
3. `press` 緑、`box`・`es5`・`assets` 緑。
4. `node tools/shot.mjs --lang ja account` を前後で撮る。

## 触る file（宣言）

| file | 何を |
|---|---|
| `tools/press.mjs` | `measure()` の選び方に `a[href]` を足す一箇所 |
| `www/index.html` | `.docs a` の規則だけ（**この session が一人で持つ** ── リーダーが与えた） |
| `docs/CHANGELOG.md` | 一行 |
| `docs/scope/r42-docs44.md` | これ |
| `shots/` | 前後の二枚 |

**触らない**：`www/settings.js`（`docRows()` は正しい ── `<a>` で合っている）、
`www/me.js`、`www/sns.js`、`tools/box-baseline.txt`、`docs/STATE.md`
（リーダーのもの）、他のどの file も。

## 貯まる物

**増えません。**CSS の規則一つ。

## 報告

下に追記する。
