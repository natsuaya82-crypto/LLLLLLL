# r16-gram ── 文法の各段は空で始まる。否定と疑問を仕様どおりに

- 日付: 2026-09-11
- ブランチ: `claude/r16-gram`
- 切った木: `origin/integ-0905` の `71ddf85c`
  （`docs: LEADER ── ビルドはオーナーが「出して」と言ったときだけ`）
- 読んだもの: `CLAUDE.md`（Shape・Explaining・「a bug is REWRITTEN, not patched」）、
  `docs/GRAMMAR-V2-SPEC.md` 全文（§4.4 否定、§4.5 疑問、§10、§14、§16、完成の定義の表）、
  `docs/BACKLOG.md`「『決めること』の下の二択が、誰も選んでいないのに選ばれて見える」、
  `www/phases.js`、`www/grammar.js`、`www/grammar-engine/translate.js`

## オーナーの決定（2026-09-10/11）

- 「文法の各段は最初は何も置かれてない状態」
- 「否定は結構細かく作れるようにして」
- 「これは文法書を作るんだって。それに必要な要素を埋めろ」

決定は済んでいる。訊かずに作る。

## やること

1. **各段は最初は空。** どの段も、人が押すまで何も選ばれていない。既定の
   `after`・`SOV` を「選んだ」と描く道を消す。`stTouched()` が偽なら光らせない、
   板に札を置かない。エンジンの既定値は残る ── 画面が既定を選択として描かない。
2. **否定を §4.4 どおりに。** 肯定の文と否定の文を人が作り、差分から規則を出す。
   PREFIX／SUFFIX／WORD、WORD なら位置は四つ（動詞の前・後・文頭・文末）。
   **組み合わせ**（ne…pas）も一つの規則。**否定する相手で分ける** ── 動詞の文／
   名詞の文／命令／存在。無ければ動詞の文のものを使うと**エンジンが**判断する。
   保存は §5 の Rule（`type` `operation` `form` `target`）。今の「動詞の前／後」の
   二択は消え、`gpos.negp` は読んで規則に**写す**（§16。消さない）。
3. **疑問を同じ形で**（§4.5）。suffix／prefix／別の語／語順／助詞／組み合わせ。
   §10「勝手に推測しない」。
4. **題を言い直しているだけの副題を四本消す**（`stg.neg.d` `stg.have.d`
   `stg.when.d` `stg.desc.d`、10 言語）。
5. エンジンが規則を読んで文を作る側を直す。`grammar-engine-check` にケースを足す。
6. 見た目が変わるものは全部スクショ（`node tools/shot.mjs --lang ja`）。
7. `docs/CHANGELOG.md`、`docs/GRAMMAR-V2-SPEC.md` の表の「否定・疑問」の行。

## 触るファイル

```
www/phases.js  www/grammar.js  www/grammar-engine/*.js  www/i18n/*.js
www/act-map.js  www/route-map.js  www/index.html（この枝が一人で持つ。CSS は最小）
tools/gramlang-check.mjs  tools/grammar-engine-check.mjs  tools/fixture.mjs
docs/scope/r16-gram.md  docs/CHANGELOG.md  docs/GRAMMAR-V2-SPEC.md  docs/BACKLOG.md
shots/
```

## 触らないもの

- **`www/phases.js` の例文**（`stAddEx`/`stDelEx`、`form stex:`）── 別の枝
  （r17-keep2）があとで触る。
- 上に挙げていない `www/` のファイル。見つけても直さずに報告する。

## 走らせるもの

ゲート全体は回さない。速い九つと、`npm run gramlang` `npm run grammar-engine`
`npm run press` `npm run i18n` `npm run page` の五つ。バグを戻して赤を見る。

## 他の枝

`git fetch --all --prune` の後、`www/phases.js` `www/grammar.js`
`www/grammar-engine/` に触っている枝のうち一番新しいものは `origin/claude/g3`
（2026-09-06）で、切った木より古い。今日この三つに触っている枝は無い。
