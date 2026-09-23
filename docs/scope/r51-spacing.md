# r51-spacing ── 字間を言語ごとに（OWNER DECISION 2026-09-23）

- ブランチ: `claude/r51-spacing`（`origin/integ-0905` の `c864b5b3` から）
- 決定: 字と字の間を言語ごとに設定できる。既定は今と同じ 1 歩。0 で隣と
  繋がる。置き場所は 設定 → 言語。位置別字形（語頭・語中・語末）はやらない。

## 一つの文

**値は言語のもの。投稿は、書かれた時の値を持つ。**

## 触るファイル

- `www/glyph.js` ── `geSide()` を言語の値から、`inkAdv()` は side を引数で受ける、`inkLine()`
- `www/wsys.js` ── 値の置き場（`SCRIPT.sp`）と、その選択肢の定数、書き手
- `www/core.js` ── `langRead()` が `sp` を読む（今は g/extra/dir しか拾わない）
- `www/post.js` ── 書く瞬間に `ink.sp`、線の下は投稿から読む
- `www/card.js` ── 測る・置くの三つが side を受け取る
- `www/share.js`, `www/numbers.js` ── 作る側、`geSide()` を渡すだけ
- `www/settings.js` ── 言語の部屋に一行
- `www/act-map.js`、`www/i18n/*.js` ── 一行分の名前と言葉
- `tools/sides-check.mjs`（`geSide` を禁止一覧へ）、`tools/card-check.mjs`、
  `tools/acct-check.mjs` または `tools/again-check.mjs`（どちらかが script を歩いていれば）
- `tools/fixture.mjs` ── 撮影に要る状態だけ
- docs: `CHANGELOG.md` `DATA_MODEL.md` `FEATURE_RULES.md` `CHECK-0907.md` `CLAUDE.md`（規則 8 の inkAdv の段落）
- `shots/r51-*.png`

## 触らないもの

- `tools/post-check.mjs` ── `claude/r50-composer` が書き換え中。過去の投稿の検査は `card-check` に置く。
- `www/index.html` ── 触らずに済んだ。スライダーの行の並びは `spRowHTML()` の inline style。
- `supabase/schema.sql` ── `post.body` は jsonb で制約なし。`netBody()` がそのまま運ぶ（実測して報告）。
- `ios/` ── `CandidateBar.swift` は渡された送り幅を読むだけ（確認して報告）。

---

## 報告（2026-09-23）

commit: `f3a768f2`（スコープ）→ `ba07bb46`（字間、値は言語・投稿は書いた時の値）→ `4fc1e951`（スライダー 0〜2）→ `origin/integ-0905` を取り込み。

### 1. 見た赤（バグを戻して、その検査一本で）

**sides-check** ── `www/post.js` の `postSide` を `return geSide();` に書き換え:

```
  www/post.js line 3581 renders a post out of geSide, which is the open language and not the post:
  function postSide(p){ return geSide(); }

  www/post.js: postLnHTML() builds a post and calls postSide(), which reaches the open language.
  Either it belongs above the line, or its name belongs in ALLOW with the reason written out.

  www/post.js: postRow() builds a post and calls postLnHTML(), which reaches the open language.
  Either it belongs above the line, or its name belongs in ALLOW with the reason written out.
```

**card-check**（同じバグ） ── 1 歩で書いた投稿が、言語を 0 にすると動く／他の言語の sp:0 の投稿が繋がらない:

```
card: 5 things about a card of a post do not hold:

  a card of a post written before a language had a gap moved when the open language was set to 0:
     [[658,161],[621,412],[621,614],[621,815],"sp",[536,1278],[325,1452],[579,1557]]
     [[586,145],[549,399],[549,599],[549,798],"sp",[464,1289],[253,1458],[507,1550]]

  a card of a post written at one step moved when the open language was set to 0 -- the card is spacing it with the OPEN language

  a post's line on the timeline changed width when the open language was set to 0: [44,44,44] -> [40,40,40]

  somebody else's post written at 0 is not drawn joined on the card: 8 of 8 letters are wider than their ink

  somebody else's post written at 0 is spaced on the timeline by this phone's language: [30,24,30,24,30,24,24,30]
```

**card-check** ── `postInkTyped` の `if(ink) ink.sp=inkSteps(SCRIPT.sp);` を抜く（書く瞬間に値を載せない）:

```
card: 2 things about a card of a post do not hold:

  a post written with the language at one step carries sp=undefined, not 1: the gap is not put on the post when it is written

  at 0 two letters drawn edge to edge do not join: 5 empty columns on the line, 0 in the font
```

**card-check** ── `inkSide` を `return geStep();`（値を無視）に:

```
card: 3 things about a card of a post do not hold:

  somebody else's post written at 0 is not drawn joined on the card: 8 of 8 letters are wider than their ink

  somebody else's post written at 0 is spaced on the timeline by this phone's language: [30,24,30,24,30,24,24,30]

  at 0 two letters drawn edge to edge do not join: 5 empty columns on the line, 12 in the font
```

**again-check** ── `www/core.js` `langRead()` の `if(gg && typeof gg.sp==='number') SCRIPT.sp=gg.sp;` を抜く:

```
  and the gap between its letters went up in the script slice: sp=0
  FAILED  and Vaska opens with its letters still set to touch: sp=undefined
again: 1 problem.
```

### 2. 0 で本当に繋がるか ── 測った

格子の左端から右端まで横線を引いた字（`[[40,400],[760,400]]`）を二つ並べ、スクリーンショットの隙間の列（インクの無い画素列）を数えた。deviceScaleFactor 2。

| 字間 | (a) 投稿の線のキャンバス（40px 高） | (b) `.sfont` 要素（LinguaScript、80px） |
|---|---|---|
| 0 | **0** | **0** |
| 1 | 7 | 12 |
| 2 | 14 | 23 |

両方測った。0 で重なりも無い（線は 72px + 72px = 144px ちょうど）。`reach` の式は変えていない。
`card-check` は同じことを線とフォント（LinguaType、canvas の `fillText`）で毎回数える: `at 1: line 5, font 12;  at 0: line 0, font 0.`

### 3. 貯まる物

- `SCRIPT.sp`（`script` スライス、歩数）── 無い＝1（`SP_RANGE.def`）。スライダーを離した時だけ書く。
- 投稿の `ink.sp` ── 書いた瞬間の言語の値。無い＝1。`p` ではなく `ink` に置いたのは、墨と同じ瞬間に決まり、編集で墨を切り直す時（`pwSaveEdit` → `postInkTyped`）に一緒に動くから。`postInkOK()` は余分な欄を見ない。
- **サーバーへの往復**: 本物のサーバーは通していない。測ったのは形だけ ── `netBody(p)` の `ink.sp` と、それを JSON にして `netRow()` に通して戻った `ink.sp` が 0/1/2 とも一致（使い捨てのスクリプト、検査には入れていない）。`post.body` は jsonb で制約なし、`schema.sql` は変えていないので `rls` は回していない。言語の値の往復は `again-check` が持つ（上の赤）。

### 4. 刻み

`SP_RANGE={min:0, max:2, def:1, step:0.1}`（`www/wsys.js`）が数の在る唯一の場所。`inkSteps()` の「無い時」も `SP_RANGE.def` を読む。0.1 はリーダーの指定どおり。

### 5. スライダーの溝

素の `<input type="range">` の見た目。足したのは `accent-color:var(--gold)`（色だけ）と、並びのための `flex`・`height:44px`・`margin:0`。溝の形・角・枠の CSS は足していない。`box-check` の結果は下の 6。変えていない。

### 6. 回した検査（`origin/integ-0905` 取り込み後、最後の行）

```
box    no rounded box was added: every corner and every border in the stylesheet
       was already there the day the rule was written, and none is set from JavaScript.
sides  sides: the making side and the reading side are separate
es5    （ファイルの大きさの一覧で終わる。exit 0）
dead   what money buys: 12 capabilities in CAN, every one asked for by name,
       and nothing asked for that is not one of them.
act    and appIs() answers all three of its states -- including the new phone that has
       never been signed in, which is the onboarding and not the door.
page   one route is drawn by one function.
card   at 1: line 5, font 12;  at 0: line 0, font 0.
again  and Vaska opens with its letters still set to touch: sp=0
```

取り込み前（`4fc1e951`）に回したもの: `i18n` 緑（all ten checks pass in all 10 languages、463 画面）、
`press` 緑（buttons pressed: 17860 (283/284 distinct names)、押されなかった `saveName` 一つは今回触っていない名前）、
`conv` 緑、`face`・`assets` 緑。行の高さは実測: 設定 → 言語 の行は全部 50px（最後の行は下線なしで 49、元から）、スライダー 44px、指で動かしてもスライダーの位置は 144px のまま。
`npm test` は回していない（リーダーの役）。

CODE CONFIRMED: yes / DEVICE CONFIRMED: no / OWNER CONFIRMED: no
