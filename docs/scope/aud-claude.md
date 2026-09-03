# 監査A ── `CLAUDE.md` の全文を、コードに当てる

- 日付: 2026-09-03
- ブランチ: `claude/aud-claude`
- 基準にした木: `master` の `562767d`（`Merge remote-tracking branch 'origin/claude/find'`）
- 範囲: **`CLAUDE.md` の全 1972 行。**朝の監査 (`docs/scope/audit-1..4.md`) は
  `docs/FEATURE_RULES.md` の決定ログだけを読んでいます。こちらは本体です。

## 探しているもの

CLAUDE.md 自身が二種類あると書いています（:313「"Rule" is the wrong word…」）。

1. **規則があってコードが従っていない** ── 直す
2. **事実として書いてあることが、もう本当ではない** ── 文を直す

数と名前は数え直します。CLAUDE.md 自身が三箇所で「この行を信じるな、数えろ」と
書いているので（:527「count the rules here, and count `FAST` and `SLOW`」、
:695「Count them off `CAN` and not off this line」、:724「count them off that
and not off a line here, which has said eleven and has said twelve」、
:1301「count the `say(` lines there rather than trusting this number, which has
been stale twice」）、そのとおりにします。

## 触ってよいファイル

六つのセッションが同時に走っています。`git fetch --all --prune` の後、
各枝の merge-base からの差分を採りました（`--depth=200` まで掘っています）。

| 枝 | リーダーが名指しした持ち物 | merge-base から実際に触っている物 |
|---|---|---|
| `claude/door` | `www/onboard.js`、`ios/App/App/` の Swift（`LinguaStore.swift` 以外） | `www/onboard.js` `tools/open-check.mjs` `docs/CHANGELOG.md` |
| `claude/plannow` | `www/settings.js` `www/store.js` `ios/App/App/LinguaStore.swift` | 左記＋`tools/plan-check.mjs` `www/i18n/*.js` 十本 `docs/DATA_MODEL.md` `docs/FEATURE_RULES.md` |
| `claude/keysel` | `www/keyboard.js`、`www/shell.js` の `viewReset()` の中 | まだ scope だけ |
| `claude/me3` | `www/me.js` `supabase/schema.sql` | 左記＋`tools/rls-check.mjs` |
| `claude/swipe` | `www/index.html` `www/act.js` `www/shell.js` | 取り込み済み。merge-base からの差分は空 |
| `claude/find` | `www/net.js` `www/sns.js` | 取り込み済み。merge-base からの差分は空 |

**私が触らないもの**（上の枝の持ち物。見つけても直さずに報告します）

```
www/onboard.js  www/settings.js  www/store.js  www/keyboard.js  www/shell.js
www/me.js       www/index.html   www/act.js    www/net.js       www/sns.js
www/i18n/*.js   supabase/schema.sql            ios/App/App/*.swift
tools/open-check.mjs  tools/plan-check.mjs  tools/rls-check.mjs
```

**私が直すもの**

```
CLAUDE.md（本体。古い文は消す ──「歴史とかいいから消せよ」）
www/core.js  www/home.js  www/words.js  www/post.js  www/letters.js  www/glyph.js
www/card.js  www/backup.js  www/import.js  www/share.js  www/wsys.js  www/numbers.js
www/act-map.js  www/route-map.js  www/boot.js  www/sound.js  www/rec.js  ほか
tools/*.mjs（上の三本を除く）
```

`docs/CHANGELOG.md` は書き換えません（その日に本当だったことの記録）。追記だけ。

## ゲート

**回しません。**速い九本（`npm run es5` など）だけ、直したものを持つ検査として
回します。全ゲートはリーダーが最後に一度 ── CLAUDE.md :482「A session runs
nothing」。

## 進め方

このファイルを最初のコミットで push し、以後、押すたびに push します。
下の「見つけたもの」は、確かめた順に番号で足していきます。
**確かめていないものは「確かめていない」と書きます。**

---

# 見つけたもの

行番号は **`master` の `562767d` の `CLAUDE.md`** のものです（私の直しが入る前）。
各件、**どう確かめたか**を書いています。確かめていないものは「確かめていない」と
書きました。

---

## まず、いちばん大きいもの

### 1. CLAUDE.md:570 「`act-check` fails on one anywhere」── 規則が守られていない

> A button carries a **name**, never code. Never write `onclick="..."` or any other
> `on*=` attribute — **`act-check` fails on one anywhere**, so the class cannot come back.

**実際:** `act-check` が `on*=` を見ているのは `tools/act-check.mjs:146` で、
なめている文字列は **画面が返した HTML** です（:99-147 の `out.inline`）。
`www/index.html` のシェル自身はどの画面も返さないので、歩きの外にいます。

そこに二つ、生きたまま座っていました。

```
www/index.html:3543   <div class="sbg" id="sbg" onclick="closeSheet(event)">
www/index.html:3544   <div class="sheet" id="sheet" onclick="event.stopPropagation()"></div>
```

**確かめ方:** コメント（`/* */`・`<!-- -->`・`//`）を落としてから `www/` 全体を
`on(click|change|input|keydown|...)=` で走査。生きているのはこの二つだけ。
`act-check` は緑のまま。

**これは CLAUDE.md 自身が名指しで禁じている三つ目の形です**（:303-311）。

> what is forbidden is the third kind, a rule written as if something were
> stopping it when nothing is, because that is the one a session reads as
> 「the gate would have caught me」.

**やったこと: 直した（`36bb094`）。**`tools/act-check.mjs` が `index.html` の
シェル自身も読むようにしました。既にある二つは `SHELL_OK` に**名前で**置いて
います ── 数えるのではなく名指しで、しかも **その名前が当たらなくなったら
落ちます**（何にも当たらない除外は次の一つへの許可になる、と `box-check` が
言っているので）。赤を三度見ました:

| 入れたバグ | 出たもの |
|---|---|
| `#toast` に `onclick=` を足す | `FAILED — JavaScript inside index.html's own markup (1)` |
| `#sheet` の `onclick=` を外す | `the exemption ... matches nothing in index.html any more` |
| 素の木 | 緑 |

**二つの `on*=` そのものは直していません。**`www/index.html` は `claude/swipe`
のものです。`data-do` に変えるかはその枝の仕事で、私は除外に名前で置いただけ
です。**リーダーの判断待ちとして残ります。**

### 2. press が master で赤い ── 44pt が一つ割れている

**確かめ方:** `node tools/press.mjs` を回しました（約6分）。

```
FAILED (1):
  too small to hit: the searches already made (paid): whgo 312x39 -- under 44
```

`.whgo` は `www/index.html:1937` で `padding:12px 2px`、`min-height` 無し。
**人を探す行では隣に `.whfo`（`min-height:44px`）が居るので伸ばされます。**
`www/sns.js:1445` の「最近の検索」の行では隣が `.pmore`（小さい末尾の control）
なので、伸ばすものが無く 39pt で出ます。

一つのクラスが、それを正しくしていた保証の無い二つ目の場所で使い回されている、
という形です。

**やったこと: 直していない（枝が持っている）。**`www/index.html` は
`claude/swipe`、`www/sns.js` は `claude/find`。どちらも取り込み済みですが枝は
生きています。直し方は `.whgo` に `min-height:44px` を一箇所、だと思いますが、
**私は当てていません。**

---

## ゲートの本数 ── 全部ずれていました

**確かめ方:** `tools/gate.mjs` の `FAST` と `SLOW` を機械で数えました。

```
FAST 9   assets es5 grammar-engine dead import sides face box store
SLOW 26  migrate i18n act conv card word post backup fill round base kb plan
         term sheet shape draft gramlang world acct page dl again open find press
TOTAL 35
```

リーダーの「今日 35 本になりました」と一致します。

| # | 場所 | 書いてあること | 実際 |
|---|---|---|---|
| 3 | CLAUDE.md:17 | 「CI runs three of these **thirty-four** checks」 | 35 |
| 4 | CLAUDE.md:24 | 「CI runs three of these **twenty-eight** checks」 | 35 |
| 5 | CLAUDE.md:434 | 「the other **twenty-five** four at a time」 | 26 |
| 6 | CLAUDE.md:447 | 「the **twenty-two** that each start a headless Chromium」 | 26 |
| 7 | CLAUDE.md:525 | 「The gate is **thirty-four** checks」 | 35 |
| 8 | tools/gate.mjs:6 | 「**Thirty-one** checks, and **twenty-three** of them start a headless browser」 | 35 / 26 |

**3 と 4 は同じ段落が二つ在ったからです。**CLAUDE.md:9-27 の引用が、途中から
文の真ん中で切れて（`> says the two that are easiest to get backwards:`）二度目が
始まっています。書き換えが片方を消し損ねた跡で、**同じことを違う数で二回**
言っていました。

**原因は一つで、それが直すべきものでした。**`npm test` は**緑のとき本数を一度も
印字しません**（`tools/gate.mjs` の `FAST.length + SLOW.length` は赤のときだけ
出る）。CLAUDE.md:435 は「The count is FAST.length + SLOW.length in tools/gate.mjs
and nowhere else; every number in this file is a copy of it」と書いていますが、
**読み取る先が緑の run に無い**ので、写しだけが残って腐ります。

**やったこと: 直した（`2dc3395`）。**

- `tools/gate.mjs` が毎回最後に `gate: 35 checks -- 9 with no browser, 26 walking the app.` を印字するようにしました（緑でも赤でも）。`dead-check` が
  `what money buys: N capabilities in CAN` を毎回出しているのと同じ理由です。
- gate.mjs 冒頭の二つの数は消しました。
- CLAUDE.md の 3〜7 は、数を書き写すのをやめて**数える先**を書く形にしました。
- 引用の重複は、古い側（「the timeline **is** on the server now」だけを言う方）を
  **消しました。**新しい側（「the server holds **both halves**」）が § Online の
  今の規則と一致しています。

**確かめ方（新しい側が正しいこと）:** `grep -o "rest/v1/[a-z_]*" www/net.js | sort | uniq -c`
→ `post` `react` `follow` `profile` `draft` `language` `slice` 全部在ります。

**確かめ方（CI が三本であること）:** `.github/workflows/i18n.yml` が
`assets-check` `es5-check` `i18n-check` の三本。**「三本」は合っています。**

---

## 数えろと書いてある数を、数えました

### 9. CLAUDE.md:693 `CAN` の一覧 ── **その行自身が警告している通り、また古い**

> `CAN` in `core.js` names every capability a plan opens — `words` `data` `file`
> `letters` `wsys` `kb` `snd` `edit` `badge` `gram` `dir` — ...
> **Count them off `CAN` and not off this line**: it listed `tr`, which is not a
> capability and never was, and it was missing `edit` and `badge`, which are.

**実際:** `www/core.js:1299` の `CAN` は **12 個**。書いてあるのは 11 個で、
**`dl` が抜けています。**

```
words data file letters wsys kb dl snd edit badge gram dir
```

`npm run dead` も毎回そう出しています: `what money buys: 12 capabilities in CAN`。

`dl` は飾りではありません。`core.js:1322` に `dl:'plus'`、`dl-check` が一本
ゲートに在り、プラン表の段一つがそれで動いています（`dlCap()`、`PLUS_DL=1`
`PRO_DL=3`）。

**この行は三回続けて古くなっています**（`tr` を載せていた → `edit`/`badge` が
抜けていた → いま `dl` が抜けている）。**やったこと: 直した。一覧そのものを
消しました。**書き写しをやめて「`CAN` を読め、`npm run dead` が数を出す」に。

### 10. CLAUDE.md:646 「There are 30 routes.」

**実際: 37。**確かめ方は二つ、一致しました。

- `www/shell.js` の `PAGES` のキーを機械で数えて 37
- `node tools/act-check.mjs` が `routes reached: 37/37` と印字

`www/route-map.js` の `page(...)` も 37 で、両方向合っています。

**同じファイルの :1576 は既に「six of thirty-seven routes」と書いています。**
CLAUDE.md が自分と矛盾していました。

**やったこと: 直した。**数を書かず `act-check` の `routes reached:` を読め、に。

### 11. `SLICES` ── 数は書いていないが、:976 が「a tenth slice」と言っている

**実際: 12。**`www/core.js:130`

```
words lines lang script letters notes phases talk snd kb wld gram2
```

:724 は「count them off that and not off a line here, which has said eleven and
has said twelve」と正しく書いています（数を言っていない）。**:976 だけが
「a tenth slice added to `core.js`」と十本目扱いしていました。**

`backup-check` が `SLICES` を歩いているのは確かめました（`tools/backup-check.mjs:95,101,131`）。

**ついでに一つ合っていました。**:1662「`SND` is still the **ninth** slice」──
`SLICES` の `snd` は 0 起点で 8 番目、つまり九本目。**合っています。**

**やったこと: 直した。**「a tenth slice」→「a slice」。

### 12. `kb-check` の主張の数 ── CLAUDE.md:1300「two hundred and fifty-one」

**実際: `grep -c "say(" tools/kb-check.mjs` = 277。**

ただしこの行は自分で逃げ道を書いています ──「count the `say(` lines there
rather than trusting this number, which has been stale twice」。**三度目でした。**

**やったこと: 直した。**当初は「読み方が併記されているので害が小さい」として
リーダーに預けるつもりでしたが、作業中に master へ入った 2026-09-03 の決定
「古い規則は残さない。全部いまの規則」が「置き換えられたものは**消す**」と
言っているので、**数そのものを消しました。**残したのは数え方だけです。

### 13. `buttons pressed` と `screens walked`

**確かめ方:** `node tools/press.mjs`（約6分）と `node tools/act-check.mjs` と
`node tools/i18n-check.mjs` を実際に回しました。

| CLAUDE.md | 書いてある | 実際 |
|---|---|---|
| :1836 | `buttons pressed: 12410  (240/240 distinct names)` | **`12799  (262/263 distinct names)`** |
| :1834 | `screens walked: 366` | **489** |
| :1834 | `screens the mirror rendered: 275` | **363** |
| :203, :633 | 「1484 lists are measured」 | **2721** |
| :617 | 「**202** were styled and worn by nothing」 | **3**（`tools/css-baseline.txt` は 3 行: `kbghost` `lift` `moving`） |
| :1175 | 「There are **240** corners and borders in `index.html`」 | **109**（`box-check` が `corners and borders in index.html: 109 (baseline 109)` と印字。`tools/box-baseline.txt` も 109 行） |

`press` は `never pressed (1): saveName` とも出しています（262/263 の 1）。

**やったこと: 直した。**この六つは全部、**数を書き写すのをやめました。**
どの run のどの行を読むか、を書いています。CLAUDE.md 自身が :1951 で
「A number moving is only ever a question」と書いているのに、その数が
run から読めない形で写されていたのが問題でした。

**:1836 の下にある長い経緯（2952 → 5172 → … → 12410）は残しました。**
あれは「いつ何で動いたか」の記録で、CHANGELOG に近い性質です。動かして
いません。

### 14. CLAUDE.md:520 「all 34 things the file says cannot be done」

**実際:** `tools/rls-check.mjs` の `CASES` は **272 件**、うち拒否を期待している
ものが **147 件**（残り 125 は `'ok'` を期待）。`SHAPE` が別に 46 件。

**確かめ方:** 括弧の対応を取って top-level の要素だけ数えました。
`^\s{2}\['` の行数（318）が `CASES`(272) + `SHAPE`(46) と一致するので、
数え方は合っていると思います。

**やったこと: 直した（文だけ）。**`tools/rls-check.mjs` は `claude/me3` の
ものなので**触っていません。**CLAUDE.md の側を「`CASES` がその一覧で、run が
何件試したか印字する」に書き換えました。

**`npm run rls` は回していません**（PostgreSQL を立てるので）。件数はソースを
数えただけです。

---

## 事実として書いてあることが、もう本当ではない

### 15. CLAUDE.md:934 「**Decided and not in yet**」── もう入っています

> **Decided and not in yet, so read this as the decision and not as the code:**
> the mapping is worked out in four places — `installTypeFont()`, `puaRoman()`,
> `postCutTyped()` and `shareFace()` ... It becomes `ltPuaOrder()` in `glyph.js`
> ... **When it lands**, its name goes in `sides-check`'s forbidden list ...
> Landing it without that line open the hole in the same commit that closes the
> duplication.

**実際: 全部入っています。**

```
www/glyph.js:460    function ltPuaOrder(){          定義
www/glyph.js:475      puaRoman()        が呼ぶ
www/glyph.js:489      installTypeFont() が呼ぶ
www/post.js:1588      postCutTyped()    が呼ぶ
www/share.js:83       shareFace()       が呼ぶ
tools/sides-check.mjs:104  'ltPuaOrder'  禁止一覧にも在る
```

**「一緒に入らなければ穴が開く」と書いてある行も、ちゃんと入っています。**

**これが二種類のうち危険なほうです。**CLAUDE.md:313 が書いている通り ──
「a stale rule reads as odd and gets questioned, while a stale statement of fact
is simply believed」。この段を読んだセッションは、**既に在るものを二つ目として
作りに行きます。**それは §「One place, not fifteen」が禁じている当のことです。

**やったこと: 直した。**「まだ入っていない」を消して、四箇所とも呼んでいる
ことと `sides-check` に在ることを書きました。

### 16. CLAUDE.md:1509 「It is not shrunk yet」── 三つとも、もう分かれています

> It is not shrunk yet: the plan, the saved searches and the notice marker are
> all sitting in one settings key shared by whoever signs in.

**実際:** `www/core.js:1189`

```js
var SET_ACCT=['plan','planWas','planPend','saved','savedUp','notAt'];
function setParkKey(uid){ return LS_S + '.' + String(uid||''); }
function setFor(uid){ ... }
```

`setFor(uid)` が、出るときに `lingua.set.<uid>` へ park し、入るときにその
アカウントのぶんを戻します。**plan も saved(saved/savedUp) も notAt も、
名指しで在ります。**上のコメントもそう書いています ──「THE FIELDS OF `SET`
THAT ARE AN ACCOUNT'S AND NOT THIS HANDSET'S」。

**確かめ方:** `SET_ACCT` と `setFor` を読み、`store-check` の印字と突き合わせ
ました（`and inside lingua.set: 20 fields — 4 with a road, 16 the phone's own`）。

**やったこと: 直した。**古い文を消して、`SET_ACCT` と `setFor(uid)` が今の形だと
書きました。数は `store-check` の run から読め、に。

### 17. CLAUDE.md:849 / assets-check 「glyph.js goes last」── 最後は boot.js です

> `glyph.js` ends with `installScriptFont()` and `render()` → **goes last**

**実際:** `www/index.html` の script の並びの末尾は

```
... otf5.js glyph.js card.js sns.js post.js mod.js rec.js me.js
    store.js backup.js sync.js sheet.js route-map.js act-map.js boot.js
```

**`glyph.js` は末尾から 12 番目です。**

そして `tools/assets-check.mjs` は **boot.js が最後であること**をずっと押さえて
います（:211-217）。**なのに同じファイルの自分のコメント（:28-31）と最終行
（:370 の `load order: ... -> glyph.js (last)`）が違うことを言っていました。**
検査が、自分の印字で自分に嘘をついている状態です。

**確かめ方（赤を見た）:** `www/` `tools/` を scratch に丸ごとコピーして、
そこの `index.html` で `boot.js` と `glyph.js` の script タグを入れ替え、
`assets-check` を回しました。

```
boot.js is not the last script. It is what starts the app, so anything
      loaded after it has not registered itself yet when the first screen is drawn.
```

**本物の `www/index.html` は触っていません**（`claude/swipe` のもの）。

**やったこと: 直した（`2dc3395`）。**CLAUDE.md:849 と assets-check のコメント・
最終行を、boot.js が最後だと書き直しました。押さえるものは既に在ったので、
足したのは文だけです。

### 18. CLAUDE.md:1147 「with **one** exception」── 二つあります

> 3. **No family is named in `www/*.js` at all** — with one exception, which is
>    the font the person drew ... `SFONT_FAMILY` in `glyph.js` ...

**実際: 二つ。**`npm run face` が毎回そう出しています。

```
faces: 6 declared on :root, 92 rules wearing them, none named twice
       built here and asked for by name: LinguaScript (glyph.js), LinguaType (glyph.js)
```

`LinguaType` は `www/glyph.js:498` と `:502`。**規則10 が自分で説明している
あの face です**（「`.tfont` is set in `LinguaType`, which carries nothing BUT
that range」）。つまり CLAUDE.md の規則17 が規則10 と矛盾していました。

`tools/face-check.mjs:106-108` は既に直っています ──「This used to say 'no
family in www/*.js at all, except SFONT_FAMILY' ... claude/save is adding a
second, LinguaType」。**検査は知っていて、規則だけが知りませんでした。**

**やったこと: 直した。**二つだと書き、それぞれどの変数に一致しなければ
ならないかを書きました（`--face-script` と `--face-type`）。

### 19. `package.json` の `npm run ask` ── 指す先が在りません

**実際:** `"ask": "node tools/ask-check.mjs"` が在り、`tools/ask-check.mjs` は
**在りません。**`git log` を見ると `b800697`「ai ボタンを章ごと外す（オーナー
2026-09-01）」で消えています。**npm script だけが残っていました。**

そして **CLAUDE.md:444 がそれを「回してよい検査」として一覧に載せていました。**

何も throw しません。`npm run ask` は `MODULE_NOT_FOUND` で落ちて、
**壊れた機械に見えます。**

**やったこと: 直した（`2dc3395`）。**script を消し、**押さえるものを
`assets-check` に足しました。**赤を両方向見ています。

| 入れたバグ | 出たもの |
|---|---|
| `"ask"` を戻す | ``package.json: `npm run ask` runs tools/ask-check.mjs, which is not there.`` |
| `"kb"` を消す | `tools/kb-check.mjs is in the gate and no npm script runs it on its own.` |
| 素の木 | 緑 |

二方向にしたのは、CLAUDE.md が「After a change, run the ONE check that holds
it」と書いているからです ── ゲートに在って単体で回す名前が無い検査は、その
指示が実行できません。

### 20. CLAUDE.md:439-444 の個別一覧 ── 35 本中 25 本しか載っていませんでした

載っていなかったもの: `grammar` `term` `sheet` `shape` `draft` `gramlang`
`acct` `dl` `again` `open` `find` の 11 本。
載っていて存在しなかったもの: `ask`（上の 19）。

**やったこと: 直した。**一覧を消して「`package.json` がその一覧」に。
**手で書いた一覧で、誰も足すのを覚えていないもの** ──
`docs/DATA_SAFETY.md` の家族としてこのファイルが何度も名指ししている形です。

### 21. CLAUDE.md:1956 「chapter 25 closes `rec.js`」

**実際:** 各ファイルが冒頭で自分の章番号を名乗っています。**いちばん大きいのは
27（`www/cal.js`）です。**

そして **26 を三つのファイルが名乗っています。**

```
www/sheet.js:1   /* Lingua — the sheet somebody writes on (chapter 26)
www/store.js:1   /* Lingua — chapter 26. The App Store.
www/sync.js:1    /* Lingua — putting a language and its copy back together (chapter 26)
```

同じ行が「**One chapter per file**」と書いています。

**やったこと: 文は直した。番号は直していない。**「chapter 0 から 27 まで、
各ファイルが自分の番号を名乗る」に書き換え、**三つが 26 を名乗っていることを
書きました。**どれが 26 を保つかは決めていません。
（`www/store.js` は `claude/plannow` のものでもあります）

**これはオーナーへの質問です。**作業中に master へ入った 2026-09-03 の決定が
「食い違いを見つけたら、セッションもリーダーも決めない。オーナーに訊く」と
言っているので、リーダー預かりではなく**オーナーへの一行**として置きます。

> 「章 26 を `sheet.js`・`store.js`・`sync.js` の三つが名乗っています。
> どれが 26 で、あとの二つは何番ですか」

### 22. CLAUDE.md:1960 「`www/glyph.js` is 104 KB」

**実際: 148,811 バイト = 145 KB。**

**やったこと: 直した。**数をやめて「`index.html` を除けば `www/` で最大」に。
バイト数はコミットごとに動くので、書き写すと必ず腐ります。

### 23. Layout の表 ── 生きているファイルが五つ抜けていました

**確かめ方:** `## Layout` 節に名前が出るファイルと `www/*.js`（39 本）を突き合わせ、
さらに `index.html` が読んでいるかを確認しました（五つとも読まれています）。

```
www/sheet.js   79 KB   ← index.html を除くと三番目に大きい
www/store.js   23 KB
www/mod.js     18 KB
www/cal.js      5 KB
www/sync.js     5 KB
```

「その表は各ファイルが何かを言う場所」なのに、79 KB の章が載っていませんでした。

**やったこと: 直した。**五行足しました。中身は各ファイルの冒頭コメントから
取っています。

### 24. CLAUDE.md:1685 `postGlossHTML()`

**実際:** そんな関数は在りません。`www/post.js:165` の `postGloss()` と
`:178` の `postGlossLine()` です（`pwMn()` が両方を使っています）。

**やったこと: 直した。**

### 25. `www/core.js` の `capStop()` と `upStop()` ── 注記が禁止された形を「これでよい」と説明していた

`core.js:1389`（`capStop()` の上）

> **confirm() and not a box of our own**: ... It is the same dialog wipeAll()
> asks with, **it is drawn by iOS**, and it is therefore not a shape this app chose.

`core.js:1414`（`upStop()` の上）

> Same shape as capStop() above and for the same reasons -- **confirm() rather
> than a box of our own** ...

**実際: どちらも `popAsk()` です。**`confirm()` は 2026-09-01 に禁止された側で、
`es5-check` が `www/` 全体で落とします（:136-138）。

さらに `upStop()` の注記は同じ段の下で **「THE APP'S OWN SHEET AND NOT iOS's
DIALOG」** とも言っていて、**一つの関数の上に二つの答えが並んでいました。**
そこは `openForm()` を説明していますが、コードは `popAsk()` を呼んでいます。

**やったこと: 直した（`2dc3395`）。**両方の段を書き換えました（条件を足すのでは
なく、間違っている文を消して）。

**同じ家族で、直していないもの**（枝が持っているので）。
**`master` が `c8dbded` まで進み `keysel` `plannow` `me3` が取り込まれた後に、
もう一度当て直しました。**

**`www/shell.js` は二つの段が逆のことを言っています。**

```
www/shell.js:1388  ✅ 正しい。popAsk() の上。「confirm() is iOS's own,
                      banned on 2026-09-01」と、捨てた三つの形を並べている
www/shell.js:1437  ❌ 古い。toast() の上に置かれたまま。
                      「So it is confirm(), which is what capStop() has always
                       used for the word ceiling ... iOS draws it, so it is not
                       a shape this app chose」
```

**一つのファイルの中で、禁止された形が片方で「禁止」、片方で「これでよい」と
説明されています。**しかも 1437 の段は `popAsk()` の話なのに `toast()` の上に
座っています。**私が `www/core.js` で直したのと同じ文です**（25 番）── core.js
の二箇所は直りましたが、shell.js のこの一つが残っています。

```
www/settings.js:663  ❌ 古い。「It is the app's own sheet rather than the
                        browser's alert()」。中身は openForm() で、
                        shell.js:1388 自身が openForm() を「a page you travel
                        to」＝シートではないと定義している    ← claude/plannow
```

朝の監査（`docs/scope/audit-1.md`）も同じ二つを挙げています。**`plannow` と
`keysel` が取り込まれた後も、二つとも在ります。**

---

## 合っていたもの（確かめた上で）

数と名前を疑えと言われたので、**合っていたことも書きます。**

| CLAUDE.md | 主張 | 確かめ方 | 結果 |
|---|---|---|---|
| :548 | 「Ten interface languages」 | `ls www/i18n/` | 10 本。合っている |
| :17 | 「CI runs three」 | `.github/workflows/i18n.yml` | assets/es5/i18n の三本。合っている |
| :1587 | `ltStart` が 38 文字 | `LT_START` は 28 字 + `numTopUp()` が base の数だけ | 28+10=38。合っている |
| :1631 | 「the twenty-eight slots」 | `LT_START='abcdefghijklmnopqrstuvwxyz!?'` | 28。合っている |
| :1662 | 「`SND` is still the ninth slice」 | `SLICES` の `snd` は 9 番目 | 合っている |
| :589 | 「no name is written down twice」（act-map） | `act-map.js` を機械で数えて 263 entries / 263 distinct | 重複なし。合っている |
| :1149 | `SFONT_FAMILY` == `--face-script` | `glyph.js:396` = `'LinguaScript'`、`index.html:98` = `'LinguaScript'` | 一致。合っている |
| :130 | 「`has_account()` ... there is nothing to let through」 | `supabase/schema.sql:1997` `drop function if exists has_account()` | 消えている。合っている（残る 4 件はコメント） |
| :745 | `lsWipeAcct(uid)` が名前空間を数える | `www/` に `lsWipeNS` は無い（`backup-check` のコメントに名前が残るだけ） | 合っている。**朝の監査の 3 番は解消済み** |
| :1206 | plans の二つのボタンだけが箱 | `tools/box-baseline.txt:14-15` に `.btn.plterm | border` と `| border-radius` | 合っている |
| :1770 | `setAbVow` → `abSetVow` | grep | 済み。`gbtn/gsnap`→`geBtn/geSnap`、`wipe/choose`→`wipeAll/setPlan` も済み |
| :976 | `backup-check` が `SLICES` を歩く | `tools/backup-check.mjs:95,101,131` | 合っている |
| :651 | `vOb` は route-map に無い | `route-map.js:32` に「vOb is not here」 | 合っている |
| :1195 | JS から角丸ゼロ | `box-check`: `set from www/*.js: 0` | 合っている |


### 31. CLAUDE.md:489「`tools/pre-commit` runs the ones that need no browser」── 九本中七本でした

> `tools/pre-commit` runs the ones that need no browser plus i18n when a screen
> file changed.

**実際:** フックが回していたのは **七本**。`grammar-engine-check` と
`store-check` が**ゲートに在ってフックに無い**状態でした。

そしてフック自身が、一つのブロックの中で三つの数を言っていました ──
コメントが「The **three** that need no browser」、その下の `echo` が
「the fast **five**」、実際に走るのが**五本**、`FAST` は**九本**。

**確かめ方:** `grep -oE "tools/[a-z0-9-]+\.mjs" tools/pre-commit` と
`gate.mjs` の `FAST` を突き合わせました。

**やったこと: 直した。**規則のほうが仕様なので、**コードを規則に合わせました。**
手で書いた一覧を消して、**`gate.mjs` の `FAST` を読んで回す**形に書き換え
ました。`FAST` に一本足せば、その日からフックにも入ります。

これは条件を足したのではなく、**一覧そのものを消した**書き換えです ──
「a list of keys, written by hand, that nobody remembered to add to」は
このリポジトリが何度も踏んでいる形で、`docs/DATA_SAFETY.md` の家族です。

**赤を見ました。**新しく入った二本が、本当にフックの中で走って止めることを
一本ずつ確かめています（それぞれを一時的に `process.exit(1)` にして、
フックが赤で止まるのを見て、戻しました）。

```
--- hook with store-check forced red:
PROBE: store-check ran from the hook          hook exit: 1
--- hook with grammar-engine-check forced red:
PROBE: grammar-engine-check ran from the hook  hook exit: 1
```

素の木では緑で、`echo` が九本を名乗ります。

```
the fast ones, no browser: assets-check es5-check grammar-engine-check
dead-check import-check sides-check face-check box-check store-check
```

### 32. ゲートの所要時間が三つ書いてあります ── 確かめていません

| CLAUDE.md | 書いてある |
|---|---|
| :442 | 「Sequentially they were **ten minutes**」（逐次の話なので、これは別のことを言っている） |
| :458 | 「making them wait **sixteen minutes** for a green」 |
| :2002 | 「Not `npm test`: **six minutes**」 |

**:458 と :2002 は同じもの（`npm test` 一回）について言っていて、食い違って
います。**

**やったこと: 直していない。確かめてもいません。**測るにはゲートを全部
回す必要があり、**回すなと言われています。**リーダーが最後に一度回すとき、
時計を見れば分かります。**どちらかは消してください。**

---

## 直していないもの、と理由

### 26. `set*` の接頭辞が本当ではない関数（CLAUDE.md:1768）

> `set*` is reserved for settings: it writes `SET.x`, or it builds part of the
> settings screen. It is not the English word "set". ... **Thirteen were like that.**

**実際、まだ在ります。**`SET` に触らず、設定画面も組み立てていないもの:

```
www/home.js     setWldHide     world().hide を書く
www/home.js     setWldSecDl    world() の section を書く
www/grammar.js  setOrder / setGPos
www/sound.js    setLtFil
www/wsys.js     setScriptDir
```

`setWldHide` は `setAbVow` と**同じ形**です（`abVow` を書いて `SET` に触らない）。

**やったこと: 直していない。**理由は二つ。

1. **これは rename で、CLAUDE.md § Refactoring が「A behaviour change, a
   refactor and a rename never share a commit」と書いています。**`docs/BACKLOG.md`
   も「the renames that must not ride along with a feature」を持っています。
2. `home.js` は私のものですが `grammar.js` `sound.js` `wsys.js` も巻き込むので、
   一つの rename コミットとしてリーダーが順番を決めるべきだと思います。

**そして押さえるものは在りません。**この接頭辞の表は、`act-map` の半分
（`act-check`）以外、何も持っていません。CLAUDE.md § 「a rule that nothing
STOPS says so, in its own line」の対象だと思いますが、**規則の書き換えは
オーナーの言葉が絡むので手を入れていません。**

### 27. `tools/conv-check.mjs` が一つのファイルの中で三つの数を言っていた

`:38`「Nothing held these **seven**」`:53`「Exit code is 0 only when all
**seven** hold」`:255`「none of the **seven** claims below」に対し、
`:401`「the **eight** claims above」、そして `:463`（run が実際に印字する行）
「all **nine** claims hold」。

**確かめ方: 実際に回しました**（`node tools/conv-check.mjs`、緑）。
:463 の行は主張を一つずつ数え上げています。数えると九つで、**印字している
九が正しい**です。九つ目は、七つのうち一つを割ったもの ── 「roman の面は、
人が writing system を**選んだ**ときに出て、`wsGuess()` が**推測した**だけの
ときには出ない」。歩かれたことの無かった道です。

**やったこと: 直した。**`conv-check.mjs` の中の三つの数を消して、
「数え上げているのは run の最後の行だ」に。CLAUDE.md 規則10 も八つ目で
止まっていたので、九つ目を書き足しました。

（当初これは「確かめていない」に置いていました。上の 12 番と同じ理由で
確かめに行っています。）

### 28. `www/glyph.js` の `'LinguaType'` が二度、素の文字列で書かれている

`:498` と `:502`。`LinguaScript` は `SFONT_FAMILY` という一箇所を通っているのに、
`LinguaType` だけ二箇所に literal で在ります。§「One place, not fifteen」の形です。

**やったこと: 直していない。**`face-check` が両方を `--face-type` に対して
押さえているので**穴ではありません**（片方だけ変えれば落ちるはず）。
ただし**その「落ちるはず」は赤を見て確かめていません。**変数一つにまとめるのは
refactor なので、26 と同じ理由でリーダーに預けます。

### 29. 「500-odd globals」「290 places」── 桁が違っていました

**確かめ方:** `www/*.js` 39 本から `^function name` と `^var name` を機械で
拾って重複を落としました。

| CLAUDE.md | 書いてある | 実際 |
|---|---|---|
| :1786 | 「**500-odd** globals in one namespace」 | 関数 1825 ＋ トップレベルの var 382 = **2207** |
| :772 | 「**290-odd** places say `WORDS`」 | `WORDS` は **107** |
| :1766 | 「`WORDS`, `LETTERS`, `SCRIPT`, `STG` ... read from **290 places**」 | 四つ合わせて **323**（107 / 127 / 19 / 70） |

:772 と :1766 は**同じ 290 を二つの違うものに使っていました** ── 片方は
`WORDS` 一つ、もう片方は四つ合わせて。四つ合わせた 323 のほうが「290-odd」に
近いので、一つ目が四つぶんの数を借りてきたのだと思います。

**やったこと: 直した。**「a hundred-odd」「three hundred-odd」「two thousand-odd」
に。**ここだけは概数のまま残しました** ── コミットごとに動く数で、押さえる
検査もありません。精密な数を書くと必ず腐ります。

### 30. 規則5 が名指しした残骸は、全部消えていました

**確かめ方:** grep。

| 名前 | 状態 |
|---|---|
| `mkPos` | 消えている（`www/shell.js:17` のコメントに名前が残るだけ） |
| `tq` `tkPos` `tcomp` | 消えている |
| `wSrot` | 元から居ない（典型例として書かれていたもの） |
| `wdMode` | 消えている（`tools/fixture.mjs:974` のコメントに教訓として残るだけ） |
| `kbField` | 消えている |
| `spPageHTML` `spRowHTML` `ltFace` | 消えている（「since deleted」の通り） |
| `wldSeenHTML` | 消えている（規則21 の当のもの） |

**合っています。**規則5 と規則21 が「消した」と言っているものは、本当に
消えていました。

`kbTap` と `kbFlick` は :1843 が「gone」と書いていますが、`kbTapLay()`
`kbTapKey()` `kbFlickLay()` `kbFlicks()` が `www/keyboard.js` に在ります。
**ただしこれは別物です** ── 消えたのは「アプリの中で打つ」ほうで、在るのは
キーボード**編集**画面の配置パターンです。**嘘ではないので直していません。**

---

## 枝が持っていて、直せなかったもの（まとめ）

| # | 見つけたもの | ファイル | 枝 |
|---|---|---|---|
| 1 | `on*=` 二つ（除外に名前で置いた。変換は未） | `www/index.html:3543-3544` | `claude/swipe` |
| 2 | `.whgo` が 39pt で press が赤 | `www/index.html:1937` / `www/sns.js:1445` | `swipe` / `find` |
| 25 | 「the app's own sheet rather than alert()」中身は `openForm()` | `www/settings.js:663` | `claude/plannow` |
| 25 | `confirm()` を「これでよい」と説明している段（同じファイルの :1388 は正しい） | `www/shell.js:1437` | `swipe` / `keysel` |
| 14 | `CASES` は 272 件（文は直した、検査は触らず） | `tools/rls-check.mjs` | `claude/me3` |
| 21 | 章 26 が三つ（`store.js` を含む） | `www/store.js:1` | `claude/plannow` |

---

---

## 作業中に master が二度動きました（`562767d` → `bc1a394` → `c8dbded`）

取り込んでいます（報告の前に、と規則にあるので）。入ったのは
`docs/FEATURE_RULES.md` の決定二件だけです。**両方ともこの監査に効きます。**

### この監査の根拠が、決定として明文化されました

> ### 古い規則は残さない。全部いまの規則。食い違いはオーナーに訊く
> 1. **置き換えられた規則は消す。**「これは歴史です」と前置きして残さない。
>    印を付けて本文を残すのも残したことになる。**消す。**
> 3. **食い違いを見つけたら、セッションもリーダーも決めない。オーナーに訊く。**
>
> Implementation status: **2026-09-03 の監査 A〜D に渡した。**
> `claude/aud-claude` `claude/aud-data` `claude/aud-pay` `claude/aud-state`

**3 に合わせて、預け先を変えました。**上の 12・21・27 は最初「リーダーに
預ける」と書いていましたが、12 と 27 は自分で確かめて直し、**21（章 26 が
三つ）はオーナーへの質問**にしました。

### `claude/flat` が `www/core.js` を持ちます ── 私も触っています

> ### 平キーの道を消す。アプリは今の形だけを知っている
> 消すもの: `langMigrate()`（`www/core.js`）、`LS_FLAT`（`www/core.js`）、
> `langMigStamp()` と `mig` の印、`lsWipeAcct()` の平キー削除、
> `tools/migrate-check.mjs` の平キーについての主張
> Affected docs: ... **CLAUDE.md 規則6**
> Implementation status: **未実装。**`claude/flat` に渡した（2026-09-03）

**リーダーの依頼文の「六つの枝」の一覧に `claude/flat` は入っていません。**
私が `www/core.js` を触ったのは `capStop()` と `upStop()` の**注記だけ**で、
`langMigrate()` にも `LS_FLAT` にも `lsWipeAcct()` にも触っていないので、
**衝突しないはずです。**`git fetch --prune` の時点で `claude/flat` はまだ
枝として在りません（`claude/aud-data` と `claude/aud-pay` は在ります）。
**リーダーに知らせておきます。**

### CLAUDE.md 規則6 の平キーの段は、私は消していません

決定の Affected docs が `CLAUDE.md 規則6` を名指ししていますが、
**Implementation status が「未実装」です。**いま規則6 のこの段

> Migration from the eight flat keys **copies**; it never removes what it read.
> It runs once, on a phone, against the only copy of something somebody spent
> months on. `migrate-check` seeds the old keys and asks what came through ...

を消すと、**まだ在るコード（`langMigrate()`）を説明する文が無くなります。**
それは同じ病気の逆向きです。CLAUDE.md が「a change lands with every sentence
it falsifies」と書いている通り、**文はコードと同じコミットで落ちるべき**なので、
`claude/flat` の仕事に付けて残しました。**私の判断です。違うならリーダーが
戻してください。**

### 二度目（`c8dbded`）── `keysel` `plannow` `me3` が取り込まれました

取り込んでいます。CLAUDE.md に衝突はありませんでした。速い九本、緑のまま。

**枝が持っていて直せなかったものを、全部当て直しました。**取り込まれた後も
**四つとも在ります。**

| # | もの | 取り込み後 |
|---|---|---|
| 1 | `www/index.html:3544-3545` の `on*=` 二つ | **在る**（私の `SHELL_OK` はまだ当たっているので `act-check` は緑） |
| 2 | `.whgo` に `min-height` 無し（`www/index.html:1937`） | **在る。press はまだ赤のはず** |
| 25 | `www/settings.js:663` の「app's own sheet」 | **在る**（`plannow` 取り込み後も） |
| 25 | `www/shell.js:1437` の「So it is confirm()」 | **在る**（`keysel` 取り込み後も） |

**一つ、朝の監査から進んでいたものがあります。**`www/shell.js:1388` の
`popAsk()` の上の段は**直っています** ── 捨てた三つの形を並べて
「confirm() is iOS's own, banned on 2026-09-01」と書いています。
**同じファイルの :1437 が直っていないだけです。**

**`claude/keysel` は `www/keyboard.js` を 146 行動かしています。**規則19 の
キーボードの記述はその前に読んだものなので、**取り込み後のキーボードには
当て直していません。**規則19 を持つのは `kb-check` で、私は回していません
（SLOW、リーダーの最後の一度に入ります）。**確かめていない、と書いておきます。**

## やったこと・回したもの

**回した検査**

- 速い九本 ── `assets` `es5` `grammar` `dead` `import` `sides` `face` `box` `store`。
  **直す前も後も緑。**
- `act-check`（約4分）── 数を確かめるため、と自分の直しを持つ検査だから。緑。
- `press`（約6分）── `buttons pressed` を確かめろと言われたので。
  **赤一件。上の 2 番。私の変更より前から在ります**（触ったのは CLAUDE.md、
  gate.mjs、assets-check.mjs、act-check.mjs、package.json、core.js のコメントだけ）。
- `i18n-check`（約3分）── `screens the mirror rendered` を確かめるため。緑。
- `conv-check`（約1分）── 27 番の数を確かめるため。緑（`all nine claims hold`）。

**ゲート全部は回していません。**`npm run rls` も回していません（PostgreSQL）。

**赤を見たもの**（バグを入れて、見て、抜いた）

1. `boot.js` を最後から外す → `assets-check` 赤
2. `npm run ask` を戻す → `assets-check` 赤（新しい主張）
3. `npm run kb` を消す → `assets-check` 赤（新しい主張、逆向き）
4. `#toast` に `onclick=` → `act-check` 赤（新しい主張）
5. `#sheet` の `onclick=` を外す → `act-check` 赤（除外の腐り）

1・4・5 は `www/index.html` を触るので、**scratch に木を丸ごとコピーして
そこでやりました。本物の `index.html` は一度も書き換えていません。**

**触ったファイル**

```
CLAUDE.md                 直した（古い文は消した。「歴史です」と残していない）
tools/gate.mjs            本数を毎回印字
tools/assets-check.mjs    load order の文＋新しい主張二つ
tools/act-check.mjs       index.html のシェルも読む＋主張の数を数える
tools/conv-check.mjs      七・八・九と三つ言っていた数を消した
tools/pre-commit          手書きの一覧をやめて gate.mjs の FAST を読む
package.json              死んだ "ask" を削除
www/core.js               capStop()/upStop() の注記
docs/scope/aud-claude.md  これ
```

`docs/CHANGELOG.md` は書き換えていません。
