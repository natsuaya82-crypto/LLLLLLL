# r10-gram ── 文法の三つ（オーナー決定 2026-09-09 の 10・11・12）

- 日付: 2026-09-09
- ブランチ: `claude/r10-gram`
- 基準にした木: `origin/integ-0905` の `a786d2f4`
- 出どころ: `docs/FEATURE_RULES.md` 決定ログ「画面で訊いて答えの出た十一」の
  10・11・12。それぞれ `docs/BACKLOG.md` の項目が一つずつ対応します。

## やること三つ

**10. 名詞クラスを消す道。**「なし」に置き換えるのではなく消す
（「なしじゃなくて消して」）。クラスの画面に削除。消えるのは三つ ──
`STG.ncls.names` のその枠、そのクラスに入っていた名詞の記録
（`STG.ncls.of` の行を落とす。「なし」という値は書かない）、そのクラスの
一致の規則（`STG.fm` の `fm` が `ncls~<番号>` のもの）。番号は詰めない ──
他のクラスの `ncls~<番号>` が動くから。undo は無い。`popAsk()` で一度訊く。
**DELETE REVIEW を `docs/CHANGELOG.md` に先に書きます。**

**11. 否定語の前／後。**`STG.gpos.negp` を書く画面が無い（否定の段が消えた
時に一緒に消えた）。語順の章（`g2Board`）に、在る `g2Side()` で一行足す。
形容詞（`g2Adj`）・場所（`g2Adp`）と同じ描き方で、二つ目の書き方は作らない。

**12. 規則の一文に条件を書く。**`when` と `drop` を持つ古い規則の文が、
いつでも効くように読める。文を作っている一か所は `g2FmSent()`
（`www/grammar.js`、`fmrFormHTML()` は規則の**編集**画面で文ではない）。
そこに「〜のとき」「〜を落として」を足す。i18n は 10 言語。

## 触ってよいファイル

```
www/grammar.js  www/wordsheet.js（規則の文だけ）  www/grammar-engine/*（要れば）
www/act-map.js  www/i18n/*.js
tools/gramlang-check.mjs  tools/gram-check.mjs  tools/fixture.mjs
docs/CHANGELOG.md  docs/BACKLOG.md  docs/scope/r10-gram.md
```

**触らないもの**（見つけても直さずに報告します）

```
www/index.html   www/net.js   www/core.js   www/home.js
```

`www/index.html` を触らないので、**在る class だけで作ります** ── 新しい行は
`.sec` と `.segs`／`.seg`、削除は `.btn.ghost`（規則 18、角丸なし）。

## 一つだけ、名指しの外に手が要ります

`tools/del-check.mjs`。`docs/DATA_SAFETY.md` § DELETE REVIEW が、削除の形の
名前が `www/act-map.js` に増えたらその表に三つ答えろと書いています ── 答えが
無ければ赤。10 の削除ボタンの一行を足します。**自分が足したボタンについての
一行だけで、他の行は触りません。**

## 押さえる check

- 10 → `tools/gramlang-check.mjs`（クラスの章はここが見ています）
- 11 → `tools/gramlang-check.mjs`
- 12 → `tools/gramlang-check.mjs`

三つとも**先に赤を見てから緑**。`npm test` は回しません（規則 2、取り込む側の
仕事）。
