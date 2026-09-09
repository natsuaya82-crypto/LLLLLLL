# Scope — claude/r10-fix

オーナー 2026-09-09、実機のスクリーンショットを見ての二件。どちらも
**足して塞ぐのではなく、間違っている方を消して一つにする**
（OWNER 2026-09-03「直すじゃなくてシンプル実装→修正じゃなくてコードそのものの
書き換え」）。

- **Owns (may change):** `www/home.js`（`vLangs` の行とそのスライドだけ）、
  `www/notes.js`（class の改名だけ）、`www/index.html`（`.lgsw`/`.lgdel` を消す、
  メモ側の class の改名）、`www/i18n/*.js`（`gram.role.CMP` と `gram.role.STD`
  の二つの key だけ）、`tools/fixture.mjs`、`docs/CHANGELOG.md`（一行）、
  `docs/scope/r10-fix.md`。
- **Does NOT own:** それ以外すべて。
- **Check to run:** `press` と `dl-check`、`i18n-check`。**ゲートは回さない**
  ── 取り込んだ人が一度だけ回す（`docs/SESSIONS.md`）。
- **保存するものは増えない。** `localStorage` にもサーバーにも新しい鍵を
  書かない。行の見た目と札の言葉だけ。

## 持っていないのに動かす一本 ── `tools/dl-check.mjs`

**先に言っておきます。** 下の 1 は class の改名で、`tools/dl-check.mjs` は
`.lgsw` `.lgdel` と `className.indexOf('on')` で行を掴んでいます
（`rowOf()` `delIn()` `swipe()` `out.saw`）。名前を変えれば**その検査は
主張が正しいまま赤になる**ので、同じ commit で掴む名前だけ直します
（「a change lands with every sentence it falsifies, wherever it lives」）。
**主張は一つも足さず、一つも消しません。** 触ってよいファイルの一覧に
無いので、ここに書いて報告にも書きます。

---

## 1. 言語切り替えの「スライドして削除」を、メモの一覧と同じ一つの作りにする

オーナー:「メモと同じ形って伝えたよね」

今、同じことをする作りが二つあります。

| | メモの一覧 | 言語切り替え |
|---|---|---|
| 包み | `.ntswipe` | `.lgsw` |
| 札 | `.ntdel` ── `var(--bad)`、76px、.92rem | `.lgdel` ── `.btn.ghost`（金）、96px、1.02rem |
| 滑り | `.ntrow.swopen` が 76px | `.lgsw.on .lgrow` が 96px |

**二つ目を消します。** 消す方を選べるのは、オーナーが「メモと同じ」と言って
いるからで、残るのはメモの側です。ただし名前は `nt*` のまま両方に着せると
「メモの」と名乗る class を言語の行が着ることになるので、**共通の名前へ一度
だけ改名**します ── `.ntswipe`→`.swipe`、`.ntdel`→`.swdel`、`.swopen` は
そのまま。滑りの規則は `.swipe .swopen{transform:translateX(-76px)}` の一本に
なります（`.ntrow:active` に負けないよう二つの selector のまま）。

`.lgsw` `.lgsw .lgrow` `.lgsw.on .lgrow` `.lgsw .lgdel` の四つは消えます。
`box-check` の baseline には一行も足しません（角丸も枠も無い）。

**文言は触りません。** ja では `langs.drop` も `notes.del` も既に「削除」で、
中身は同じです。en は "Remove"（取ったものを返す）と "Delete" で違いますが、
**言葉はオーナーのもの**（CLAUDE.md § Deciding）なので、揃えるかどうかは
訊いてから。

**JS は一本になりません。** メモの `ntSwStart`/`ntSwMove`/`ntSwEnd`（`www/notes.js`）
は `here().r!=='notes'` で始まり `ntSwipeAt` と `render()` で開きます。
一本にするにはその門を書き換えることになり、このスコープの `www/notes.js` は
「class の改名だけ」です。`www/home.js` 側は着せる class を変えるだけに留め、
**JS が二本残っていることを報告に書きます。**

### 押さえる
`press`（行の高さと 44pt）、`dl-check` の既存の主張。スクショ 2 枚
（滑る前・滑った後）。

---

## 2. 語順の板の役割の札を、正しい日本語にする

オーナー:「マジでキモイ日本語使わないで欲しい」

`www/i18n/ja.js` の二つ。

- `gram.role.CMP` ── copula の補語。en "what it is"。今「なにである」→ **「補語」**
- `gram.role.STD` ── 比較の基準。en "what it beats"。今「なにより」→ **「比較の相手」**

他の 8 言語（es pt fr de it ru zh ko）も同じ二つの key を読み、直訳で
おかしくなっているものは自然な語にします。**en は動かしません**（key の
source of truth）。

### 押さえる
`i18n-check` が緑のまま。スクショ 1 枚（語順の画面）。
