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

---

# 報告 ── 2026-09-18

**CODE CONFIRMED のみ。実機では一度も押していません。**

## 1. 赤を見た（バグのまま、check だけ入れて回した）

`tools/press.mjs` の `measure()` の選び方に `#app a[href]` を足しただけの状態で
`npm run press`：

```
nothing under 44pt: 4 FOUND

FAILED (4):
  too small to hit: vPlans (free): A 80x21 -- under 44
  too small to hit: vPlans (free): A 85x21 -- under 44
  too small to hit: the profile, a link and a place (paid): A 91x16 -- under 44
  too small to hit: somebody else's profile, a link and a place (paid): A 79x16 -- under 44
```

`seenSmall` は大きさで畳むので、同じ二つが何枚の画面に出ていても一行です。

## 2. 直した ── `.docs a`

```css
.docs a{color:var(--txm);text-decoration:none;display:inline-block;padding:12px 0}
```

21 + 12 + 12 = **45px**。角丸・枠線・塗りは一つも足していません。
字の大きさ（`.78rem`）も色（`var(--txm)`）も `:active` の金も、並びも、
`.docs` 側の `padding-top:34px` も、一行も触っていません。

## 3. 回した check

| check | 結果 |
|---|---|
| `press` | **赤 2 本**（下の § リーダーへ。規約とポリシーの 2 本は消えた） |
| `box` | 緑 ── `corners and borders in index.html: 104 (baseline 104)`、`set from www/*.js: 0`。**baseline に一行も足していません** |
| `es5` | 緑 |
| `assets` | 緑 |

ゲート（`npm test`）は回していません（規則 2）。

## 4. 写真 ── 二枚

**この二つが居るのはアカウント室ではなく、プラン画面です。**
`docs/scope/r41-review.md` § 4.0-c は「設定の足元」と書いていますが、
`www/settings.js:329` の通り 2026-09-01 にオーナーが移しています
（「設定のアカウントの利用規約とプライバシーポリシー消しといて。課金の方に
あるからいらん」）。`docRows()` を描くのは `planTerms()`（`settings.js:1108`）と
オンボーディングの扉（`onboard.js:1486`）の二つで、アカウント室は描きません。
**なので `node tools/shot.mjs --lang ja plans` を撮りました。**

- `shots/r42-docs-before-ja.png` ── 21px。頁の高さ 2068
- `shots/r42-docs-after-ja.png` ── 45px。頁の高さ 2116（**+48px**）

見た目は「小さく、並んで、静か」のままです。**オーナーに見せてください。**

## 5. リーダーへ ── `press` はまだ赤 2 本です

```
FAILED (2):
  too small to hit: the profile, a link and a place (paid): A 91x16 -- under 44
  too small to hit: somebody else's profile, a link and a place (paid): A 79x16 -- under 44
```

**これは規約とポリシーとは別の `<a>` です** ── プロフィールの link
（`www/me.js:1327`、`<div class="pbio">` の中、`style="color:var(--gold)"` を
直書きした `<a href>`）。**この session は `www/me.js` を持っていません**し、
「`www/index.html` は `.docs a` の規則だけ」と言われています。

直すなら一行で、`www/index.html` に：

```css
.pbio a{display:inline-block;padding:14px 0}
```

**勝手に足していません。**理由は二つ：

1. **文の中の link です。**bio の段落の中に埋まっているので、上下に 14px 足すと
   bio の行間と段落の高さが動きます。**見た目が変わる判断**で、オーナーの
   ものです（`node tools/shot.mjs --lang ja profile` を前後で撮れば見えます）。
2. **`www/me.js` が別の session の物かもしれません。**

**この 2 本を「例外」として check に書くことはしていません。**
「親指が当たる物は全部」に、私が自分で線を引くことになるからです
（`box-check` の baseline が「許可」に腐る、と `CLAUDE.md` 規則 18 が言うのと
同じ形）。**赤のまま置いてあります ── check が仕事をしている状態です。**

---

# 報告 2 ── `.pbio a` も 44 に（リーダーの指示、2026-09-18）

> リーダー：「残った 2 本も君が直す ── 44pt は『親指が当たる物は全部』で、
> 例外は無い（OWNER 2026-09-01）。`www/me.js` は触らなくてよい、CSS だけ」

**CODE CONFIRMED のみ。実機では一度も押していません。**

## 1. 赤（上の § 1 と同じ出力の、残っていた 2 本）

```
FAILED (2):
  too small to hit: the profile, a link and a place (paid): A 91x16 -- under 44
  too small to hit: somebody else's profile, a link and a place (paid): A 79x16 -- under 44
```

## 2. 直した ── `.pbio a`（`www/index.html`、`www/me.js` は触っていません）

```css
.pbio a{display:inline-block;padding:14px 0;margin:-14px 0}
```

16 + 14 + 14 = **44**。負の margin が行 box に padding の分を返します ──
inline-block は **margin box** で行の高さが決まるので、当たりだけが広がり、
bio の行間も頁の高さも動きません。角丸・枠線・色は足していません。

## 3. 回した check ── 緑

```
npm run press
  screens built: 1110
  classes worn: 626, styled and unworn: 3 (baseline 3)
  nothing under 44pt: held          ← 4 本とも消えた
  rows in one list are one height: 3508 lists measured
  buttons pressed: 17113  (279/280 distinct names)
  every button pressed: nothing threw, nothing went blank.
  exit 0

npm run box
  corners and borders in index.html: 104  (baseline 104)
  set from www/*.js: 0
  exit 0
```

`box` の baseline は **104 のまま**、一行も足していません。

## 4. 写真 ── 二枚、高さは同じ

**素の `profile` ではなく `hd@64`（`the profile, a link and a place`）を
撮りました。**種の `ME` には `link` も `loc` も入っていないので、素の
`profile` には link が一本も出ません ── 前後を撮っても link が写らない写真に
なります。赤が出ていたのもこの顔です（`tools/fixture.mjs:1211`）。

```
node tools/shot.mjs --lang ja hd@64 hd@65
```

| | 頁の高さ |
|---|---|
| `shots/r42-pbio-before-ja.png` | 780 × **1688** |
| `shots/r42-pbio-after-ja.png` | 780 × **1688** |
| `half-somebody-else-s-profile-…`（前／後） | 780 × **1744** ／ 780 × **1744** |

**前後で同じです。行間は動いていません。**「谷の上 ・ tokinets.com」の
並びも、金の色も、字の大きさも、前後で同じに見えます。
**オーナーに見せてください。**

## 5. まだ言っていないこと

- **実機では一度も押していません。**44 になったのは headless の 390×844 で
  測った数字です。
- ゲート（`npm test`）は回していません（規則 2）。`press`・`box`・`es5`・
  `assets` の四本だけです。
- `press` の「戻るスワイプ」の行が一度 `pointercancel` で「何も主張しない」に
  なりました（機械が混んだ時に出る、`docs/BACKLOG.md` にある揺れ）。
  回し直したら通常どおりに戻り、`nothing under 44pt: held` は両方の回で同じです。
