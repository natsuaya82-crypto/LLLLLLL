# r28-kb ── 型を選んで作った板に、文字が載る

- 日付: 2026-09-11
- 枝: `claude/r28-kb`（`integ-0905` の `29076d64` から）
- 決定: OWNER 2026-09-11「それで進めて」（リーダーの案 7）。
  `docs/reports/hunt-2026-09-11.md` #13 ── 「型を選んで作ったキーボードは、
  キーが全部空」。**型を選んだ時点で、無料の QWERTY と同じく文字を載せる。**

## 測った（読んだのではなく、本物のアプリで動かした）

`tools/fixture.mjs` の言語（LETTERS 40、alpha 28、SND 11）で、有料、
`kbPatLay(p)` と `kbBlank(kbPatLay(p))` と `kbAdd(p)` の結果を数えた。

| 型 | `kbPatLay()` が埋めた `lt` キー | フリック枠 | `kbBlank()` の後 |
|---|---|---|---|
| qwerty | **38 / 38** | ── | 0 / 38 |
| tap | **40 / 40** | ── | 0 / 40 |
| abc | **28 / 28** | ── | 0 / 28 |
| flick | **6 / 9** | **22 / 36** | 0 / 9、枠も 0 |
| chart | 0 / 30 | ── | 0 / 30 |

**足りないものは何も無い。五つの型のうち四つは、もう文字を載せている。**
`kbBlank()` が直後にそれを剥いでいる ── `kbAdd()`(`www/keyboard.js:795`) も
`kbSetPatGo()`(`:3807`) も `kbBlank(kbPatLay(pat))` を書いている。

- `kbFixed()` のキーは `{k:'lt', v:'l5', t:''}` ── `v` は文字の id、
  `t` は `kbFix()` が入れる私用領域の符号位置。`t` は上書きで、`www/share.js` の
  `shareKey()` は `shareFace(key.v)` で答えるので、`t` の無い板でも
  文字は phone に渡る（規則10の八番目）。**`t` を四つの型に足しはしない** ──
  一つの答えを二箇所に書くことになる。
- `chart` の 0 は `kbBlank()` のせいではない。音の表は
  `ltMain(wsKey([子音, 母音]))` で埋める型で、fixture の言語はアルファベット
  なので、その綴りを書く文字が一つも無い。`kbChartLay()` の註がそう書いて
  いる ──「A cell nothing writes yet is an empty key」。**型そのものが正しい。**

## やること ── 足すのではなく、消す

規則「直すじゃなくて書き換え」。**`kbBlank()` を削除する。**呼ぶ側二つは
`kbPatLay(pat)` をそのまま持つ。載せる一箇所は `kbPatLay()` で、QWERTY の
並びは `KB_QWERTY` 一つのまま（`kbQwertyLay()` は `kbFixed()` を訊く、
`shareRomLay()` も同じ配列）── **二つ目の配列は作らない。`www/share.js` は
触らない。**

**`kbSetPatGo()` も同じ道にする。**`kbRepat()` の註が自分でそう書いている
──「the only difference between choosing one here and choosing one for a new
keyboard is which name the press carries」。片方だけ直すと、＋ から選んだ
QWERTY には文字が載り、⋯ から選んだ QWERTY には載らない、という二つの答えに
なる。既にある板を**勝手に**埋めるのではない ── 人が型を選び直して popAsk に
答えたときだけで、そこは元から並びを丸ごと作り直す（DELETE REVIEW 済み）。
**リーダーへ：ここだけ scope の「既にある板は触らない」の外に見えるので、
違えば戻す。**

**保存済みの板には一バイトも触らない。**空のまま人が置いた板はそのまま。

## 嘘になる文（同じ commit で直す）

- `www/keyboard.js` `kbBlank()` の註まるごと（「それ以外2つ目作るときは形だけ」）
- 同 `:169` の `lay:kbBlank(...)`、`kbHasFlick()` の註
  （「a flick board that nobody has put a letter on yet」）
- `tools/kb-check.mjs` の二箇所「A pattern blanks every key it makes」
- `docs/keyboard.md` §「2枚目からは、形だけです」
- `docs/CHANGELOG.md` に**先に**書く

## check

`tools/kb-check.mjs` に型ごと一つずつ claim（QWERTY の `q` のキーが `lt.q` を
持つ、ABC順の一つ目が `ltOrder()` の一つ目、フリックの枠が埋まっている、
tap、chart は空のままで正しい）。赤を見てから緑。写真は ja で、作った直後の
QWERTY 板と ABC順 板の editor。

## 触る file

`www/keyboard.js` `tools/kb-check.mjs` `tools/fixture.mjs` `docs/`。
`www/share.js` は**触らない**（共有する配列は既に一つ）。他は触らない。
ゲートは回さない ── `npm run kb` と、最後に `npm run press` 一回。
