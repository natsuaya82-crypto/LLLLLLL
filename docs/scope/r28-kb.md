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

## 途中で見つけた ── 同じ枝で直した（リーダーへ）

**作った QWERTY 板が、次の起動で消えます。**上の変更で QWERTY 板が無料版の
QWERTY とバイト単位で同じになり、`migrateKbFree()` はその同一性で「昔の板0の
写し」を見分けているので、作ったばかりの板を写しと読んで `kbs.shift()` します。
測った ── 保存 1 枚が起動後 0 枚。`29076d64` では 1→1 なので、**これは新しい**。

**根はもっと古い。**`{kbs:[], at:0}` を作る場所が三つあり、どれも `v` を
載せない。だから今作った KB が「移行前の KB」として読まれる ──
`migrateKbFree()` にも `kbIded()` にも。後者のせいで **`KB.at` が 0→1 に動く**
（＝作ったが適用していない板が勝手に端末に載る）。これは `29076d64` でも
五つの型すべてで起きていた（測った）。

直しは条件追加ではなく **KB が版を持って生まれる**（`KB_V` 一箇所、`kbMint()`、
三箇所がそれを訊く）。`migrateKbFree()` は無傷で、古い保存の読み方は変わらない。
一つの根なので一つの直しで両方消える ── 片方だけ直すと patch になる。

**press は二度回した。**一度目は上の不具合を見つける前の木なので無効。
数は最後の一回のものを報告する。

**根本原因を突き止めていないものが一つある（リーダーへ）。** `kb-check` に
「作った板は次の起動でも在る」の claim を足したとき、**ついでに**行儀よくしよう
として最後に `KB = null; kbShow = 0; saveKb();` と書いた。その一行を入れると
`kb-check` が二枚目の browser の `kbPrep` の中で**止まる**（三回再現）。
測った 2x2 ──

| www の直し | check | 結果 |
|---|---|---|
| KB_V あり | 取り込み済みの check | 緑・完走 |
| KB_V あり | 自分の check、その一行**なし** | 緑・完走 |
| KB_V あり | 自分の check、その一行**あり** | 止まる（3/3） |
| KB_V なし | 自分の check、その一行あり | 緑・完走 |

つまり止まるには**直しとその一行の両方**が要る。**アプリ側の不具合ではない**
ことは別に測った ── `KB=null; saveKb();` を単体で呼んでも返ってくるし、頁は
生きている。その一行は自分が「ついで」で足しただけで何も要求していないので
**消した**（消せば全部緑）。**なぜ組み合わせで止まるのかは分かっていない。**
分かっていないことを分かったとは書かない。


## press の数 ── `29076d64` と比べて測った

両方この端末で回した。**名前は動いていない（276/277）。**

| | `29076d64` | この枝 |
|---|---|---|
| screens built | 1082 | 1091 |
| buttons pressed | 15987 | **16500**（+513） |
| lists measured | 3307 | 3369 |
| styled and unworn | 3（baseline 3） | 3（baseline 3） |
| distinct names | 276/277 | 276/277 |

**+513 は `tools/fixture.mjs` に足した顔three枚**（作った直後の QWERTY 板、
同じく ABC順 板、文字の入っていないキーを開いた面）。**盤にのった文字は
ボタンを増やさない** ── キーの数は前と同じで、載っているものが変わっただけ。
名前が一つも動いていないのは、新しい act を一つも足していないから。

`never pressed` は `saveName` 一つで、これは前からそう。

## 触る file

`www/keyboard.js` `tools/kb-check.mjs` `tools/fixture.mjs` `docs/`。
`www/share.js` は**触らない**（共有する配列は既に一つ）。他は触らない。
ゲートは回さない ── `npm run kb` と、最後に `npm run press` 一回。
