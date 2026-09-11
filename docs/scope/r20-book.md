# claude/r20-book ── 文法の頁を 9 章＋付録の目次にする

枝 `claude/r20-book`（`integ-0905` から）。オーナー決定 2026-09-11（リーダー経由）。

## 何をするか

文法の頁の 43 行の平らな一覧をやめ、**9 章＋付録**の目次にする。今の項目は
章の頁の中に**節**として入る。節の頁は今のまま（二重に描かない）。

## 章の表（`G2BOOK`、`www/phases.js`）

| # | 章 | id | 節（今の id） |
|---|---|---|---|
| 1 | 文 | `snt` | `order` `np` `cop` |
| 2 | 名詞 | `noun` | `ncls` `pl` `n` `part` `det` `have` |
| 3 | 代名詞 | `pro` | `pron` |
| 4 | 数詞 | `num` | `count` |
| 5 | 動詞 | `verb` | `p1s` `p2s` `p3s` `p1p` `p2p` `p3p` / `prs` `pst` `fut` `plp` `prg` `prf` / `imp` `cnd` `pot` `obl` `des` / `pas` `cau` / `neg:v` `q:v` |
| 6 | 形容詞と副詞 | `mod` | `adj` `cmp` `sup` |
| 7 | 前置詞・後置詞 | `pp` | `adp` |
| 8 | 複文 | `sub` | `cx` `conj` |
| 9 | 語形成 | `wf` | （空。目次に薄い字で出る。作らない） |
| 付 | 付録 | `app` | `greet` `polite` `when` `month` `wday` ＋ **表に名前の無い節**（人が足した段はここ） |

場所と時の位置は語順の板の中。冠詞・指示詞の位置は名詞句の板の中。どちらも
節を増やさない（仕様「二箇所に同じことを置かない」）。

## 否定と疑問

- **4 行を選ぶ頁（`g2Pol` / `g2PolRow` の一覧、`g2PolBody`）は消す。**
- `neg:v` `q:v` は**動詞の章の節**（行の名は 否定／疑問）。
- `neg:imp` `q:imp` は**命令の節の頁の中**の行。
- `neg:n` `neg:ex` `q:n` `q:ex` は**です／ある（`cop`）の節の頁の中**の行。
- 素の `v2:neg` / `v2:q` は頁でなくなる。章そのものが持っていたもの
  （「〜ない」の語、疑問詞六語、古い fmr 規則、例文）は**最初の対象 `:v` の頁**
  に付く ── `:v` は他の三つが落ちてくる先だから。
- **`G2POL` / `gPolPut`（肯定と否定の文を並べて規則を出す作り方）は変えない。**
- **データは何も消さない。**`STG.gr` も `STG.fm` も `WORDS` の `slot` も
  そのまま。消すのは頁を描く関数だけ。

## 触る file

`www/phases.js` `www/grammar.js` `www/shell.js`（`pageName()` の `gram` の題だけ）
`www/act-map.js` `www/i18n/*.js` `www/index.html`（この章の CSS だけ）
`tools/fixture.mjs` `tools/gramlang-check.mjs` `tools/shot.mjs`（指定だけ）
`docs/` `shots/`

## 触らない file

上以外の全部。`www/grammar-engine/` `www/wordsheet.js` `supabase/` `ios/`
他の check、他の screen。

## 回す check

`npm run act` `npm run gramlang` `npm run i18n`、最後に一回 `npm run press`。
**ゲート（`npm test`）は回さない。**

## リーダーへ ── 決めていないこと

1. **`st`（この言語について）の章が今のコードに無い。** `G2TOC` に id だけ
   残っていて、`g2Chaps()` にも `STAGES` にも `st` は無い（`g2Page()` の
   `c.id==='st'` だけが生き残り）。オーナーの付録の一覧には入っている。
   **表には入れるが、節が無いので行は出ない。**作るかどうかは決めていない。
2. **疑問詞六語（`ask` の what/who/where/when/why/how）を `q:v` の頁に置いた。**
   品詞は `pro` なので代名詞の章の方が正しいかもしれない。今は章そのものが
   持っていた物をまとめて `:v` に置くという一つの規則で通している。
3. **自分の段を足す ＋（`openOwnPhase`）と、隠れている段の数の行を
   付録の頁に移した。** 足した段が付録に入るので、目次に ＋ を置くと押しても
   画面が何も変わらないため。目次に残す形が良ければ言ってください。
4. **目次の行の右に「書けた節の数 / 節の数」を出した。** 節の行は今までどおり
   「— / 0/8」。目次の数は決めごとではなく数え（空の章は「—」）。
5. **節が無い章（語形成）は押せない行にした。** 押せた時はバーだけの真っ白な
   頁が開いた ── 「目次に薄く出る／作らない」を、扉のある行では満たせない。
   矢印も出さない。押せる形が良ければ言ってください。
6. **否定形・疑問形の二行の上に、否定される文の種類の見出しを出した**
   （名詞の文・存在・命令）。命令形の頁で、見出し無しだと二行が「規則」の下に
   並んで規則に見えたため。写真 `shots/gram-v2-imp-ja.png`。

## 測った数（`npm run press`）

| | integ-0905 | この枝 |
|---|---|---|
| screens built | 1059 | 1079 |
| buttons pressed | 16300 | 15987 |
| rows in one list | 3235 | 3279 |
| styled and unworn | 3（baseline 3） | 3（baseline 3） |

押下が 313 減ったのは、**目次が 43 行から 10 行になった**のが主で（目次は
walk の中で何度も組まれる）、四つから選ぶ頁が二つ消えた分が足される。章の頁が
九つ増えて 43 行を一度ずつ運ぶので、その分は戻っている。`classes worn` が
619 → 618 に一つ減っているが、`styled and unworn` は baseline の 3 のままで、
減ったのは index.html が字を当てていない class。
