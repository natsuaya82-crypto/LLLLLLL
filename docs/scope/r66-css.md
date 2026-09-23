# r66-css — CSS の継ぎ当てと二重の宣言（r63 §2-8）

作業セッション r66-css（`claude/r66-css`、`origin/integ-0905` c2aff7b1 から）。
持っていたのは `www/index.html` の CSS と CSS を指すコメント、`tools/box-baseline.txt`、
`tools/css-baseline.txt`、この file。**`tools/css-once-baseline.txt` も一度触った**（下の
「持っていない file」）。

## 測り方

「見た目は変えない」を目で比べるのではなく、**全画面・全要素の計算済みスタイルを前後で
比べた**。`tools/shot.mjs` と同じ種・同じ歩き方（`--all`、`--half`、`--all --dark`、どれも
`--lang ja`）で、写真の代わりに `document.body` の下の全要素（と `::before`・`::after`・
`::placeholder`）の `getComputedStyle` を全性質書き出す一時スクリプト（repo には入れていない）。
前は `integ-0905` を別の worktree に固定して取った（作業中の木から取ると、途中の編集が混ざる
── 一度それをやって撮り直した）。

同じ性質を二度書いている所は、同じく一時スクリプトで CSSOM を読んで数えた
（`@media`・`@supports` の中は別の文脈として）。

## 結果（測った）

**変わった画面は無い。** `integ-0905` と最後の HEAD の前後で:

- 計算済みスタイル: 926 面（明 `--all` 213・`--half` 250 前後・暗 `--all` 213、同じ面の
  二回目も含む）。同じコードを二回取った差（床）は: 引いて更新の輪の `transform`、
  `.obhand`・`#sbg`・`.vodot` の fade の `opacity`、掴んだキーの揺れ、`.numwbig` の幅、
  `#ob-em` の placeholder、`#app[data-fresh]` の入場、そして fixture の状態で DOM が
  変わる面（「プランが終わって箱にチェック」ほか 10）。**床の外に出た差は一つだけ**:
  投稿欄の二つの `.lnin` の `border-bottom-color`。幅 0・線の種類 none の線の色で、
  描かれない（下の CS1）。
- 写真: `shot.mjs --all --lang ja` と `--half --lang ja`、463 枚。415 枚がバイトまで同じ、
  48 枚が違う ── 全部 y 191–214（引いて更新の輪）、字の編集の見本の矢印の位置、
  「接続できません」の fade、トーストの fade、数字の `.numwbig`、揺れるキー。床の中。
- 前後の写真を三組 `shots/` に入れた（変わっていないことを見せるため）:
  `r66-half-a-post-being-written-with-two-tags-*`（CS1）、`r66-plans-*`（CS2）、
  `r66-ob-signing-in-the-last-step-*`（CS3）。どれもバイトまで同じ。

## 何をしたか（コミットごと）

1. **CSS を一枚に、一つの selector は一つの規則**（CS1・CS2・CS3・二重 9）
   - CS3: `<style id="ob-rework">` を消して一枚に。順番は同じなので何も動かない。
   - 同じ文脈で同じ selector が同じ性質を二度言っていたのは **8**（`.play` の display・
     align-items・min-height、`.plterm .pp`／`.pper` の display・font-size、`.obskip` の
     min-height）→ **0**。同じ selector を二つの塊に割っていたもの（`.kb.kbsheet`、`.tab`、
     `.view.fit`（高さが二枚目の r4-sns にあった）、`.view.fit .body`、`.view.fit .pwtop`、
     `.view.fit .pwfield .lnin`、`.play:active`、`.set .sv`、`.dayrw`）も一つずつに。
     `.play,.pkclear,.obskip{min-height:44px}` は `.pkclear` に入れて消す。
     残る「同じ selector が二つの規則に出る」は全部「まとめの規則 + 自分の規則」の形
     （`.back.nb,.play` と `.play`、`.dir-ttb-rl,.dir-ttb-lr` と各々 など）と、`:root` の
     変数の置き場（別々の変数）と、明暗の `--mkplate` で、一か所の形そのもの。
   - CS2: `.plterm .pp` 三回・`.pper` 二回 → 最後に勝っていた値で一つずつ。
     `tools/css-once-baseline.txt` の 4 行はこれで何も指さなくなり、その file の頭が言う
     通り同じコミットで消した。
   - CS1: `.pwfield input, .pwfield textarea` が中の欄を全部上書き → `.pwfield .lnin` と
     `.pwfield .lnin.dir-ttb-*` が padding を戻す → `.pwmn` が `!important`。上書きの元を
     消して: 二つの `.lnin` は `.lnin` を全部着て下線だけ外す（`.pwfield .lnin{border-bottom:0}`）、
     意味は `.lnin.pwmn`（`!important` 無し）、タグは `.pwtag` が自分の形を全部持つ。
     戻す規則二つは要らなくなって消えた。
     **一つだけ計算値が違う**: 前は `border:0`（0,1,1）が `.lnin:focus`（0,2,0）に負けて、
     フォーカス中の一行目の下線の色だけ金になっていた（幅 0 で描かれない）。今は
     `border-bottom:0` が後に来るので currentcolor。`border-bottom-style:none` にすると
     今度は意味の欄（前は currentcolor）が `--line` になる。前の計算値は「どの規則が偶然
     勝ったか」なので、どちらでも完全には写せない ── 描かれない線の色を写すために
     順番を当てにする規則を書くのはこの仕事の逆なので、「線は無い」と書く方にした。
2. **幅のタイルを運ぶ仕組みの残りを消す** ── `.kbghost` と `.kbk.drop`、その三つの
   コメント。19646443 で JS が消え、`www/` に付ける物が無い。`css-baseline.txt` の
   `kbghost` も消す。
3. **コメント（C）** ── `.pkid .post::after` を指していた行（線は `.prail`）、
   消えた物を言うためだけの塊（キーボード下の ＋、二つ目の `.wsrt` と `.wsay`、`.lock`、
   `.gdemo`…`.gsw`、掴んだキーの ⊖、「The same, on the notebook」）、規則の上の
   「went with / is gone / used to sit here」の文 11 か所。`.plgo` は「箱なし・三つ目では
   ない」と言っていたが `.btn.plbuy` に枠がある（OWNER 2026-09-03）ので今の事だけに。
   `.sfont` の例の `.pwfield input` は無くなったので差し替え。
   **理由を言う「used to」は残した** ── 「A だったので B が起きた、だから今は C」は
   今の形の理由で、消えた物の記録ではない。
4. **`.ob .btn.ghost` を消す**（CS3 の枠）── オンボーディングの全部の段と顔（明・暗）を
   歩いて、`.ob` の中で `.btn.ghost` を着ている物は **0**。規則ごと消し、
   `box-baseline.txt` の `.ob .btn.ghost | border` も消す（104 → 103）。見た目は動かない。

## 保存するもの

変わらない。CSS とコメントと baseline だけ。`docs/CHANGELOG.md` に書くことは無い
（人が気づく変化も、保存・移動・削除も無い）。

## 回した検査

- `box-check`（103 / baseline 103）、`css-once-check`、pre-commit の速い物（毎コミット）、
  `i18n`（pre-commit が回した）。
- **赤を見た**: `css-once-check` に `.plterm .pp{display:block}` を戻して一度落ちるのを
  見た、戻して緑。
- 全ゲートは回していない（規則 7）。`press` の css 部（`css-baseline.txt`）も回していない
  ── `kbghost` を消したのが緑になるかは取り込み後のゲート。

## やり残したこと・気づき

- **`css-once-check` は「違う値」の二重しか数えない。** `.play{display:inline-flex}` を
  二度書いても緑（試した）。今回の 8 件のうち 4 件（`.play` 三つ、`.obskip`）はこの形で、
  検査の外にいた。面を数えるなら「同じ文脈・同じ selector・同じ性質が二度」で数えるべき。
  `tools/css-once-check.mjs` は私の file ではない。
- **順番で勝つ別 selector は数えていない。** CS1 はこの形（`.pwfield textarea` 対 `.lnin`、
  特定度が同じか近く、後の方が勝つ）。全部を数えるには、画面ごとに勝った宣言と負けた
  宣言を CDP で取って「特定度が同じで順番が決めた」組を数える必要がある。今回は
  測っていない。検査を書くなら tools/ の新しい file で、私の持ち物ではない。
- `.tabbar` の二つ目（`@supports` の中）は audit が「二度書き」に数えていたが、
  ぼかしが効かない端末への退避で、正しい上書き。触っていない。
- 見出しのない（後に規則が来ない）コメントはまだある（例: キーボード一覧の前の
  「The chapter is a list」）。面として数えていないので、全部とは言わない。
- `CLAUDE.md` ルール 18 は「プランの二つの term ボタンが唯一の箱」と言うが、
  `.btn.plbuy`（OWNER 2026-09-03）、`.gordc`（OWNER 2026-09-06）も箱で baseline にある。
  CLAUDE.md は私の file ではない。

## 持っていない file

- `tools/css-once-baseline.txt` の 4 行を消した。brief の持ち物一覧に無いが、
  (a) CS2 を直すと pre-commit が「この行は何も指していない、同じコミットで消せ」で
  止める、(b) その file の頭が「Taking a line OUT is progress and needs nobody」と言う、
  (c) 他のどの枝もこの file を触っていない。box/css の baseline と同じ種類の物。

## CODE / DEVICE / OWNER

- CODE CONFIRMED: 上の計算済みスタイルと写真の比較、box・css-once。
- DEVICE CONFIRMED: 無し（端末では何もしていない）。
- OWNER CONFIRMED: 無し。

## リーダーの指示が間違っていた所

- `tools/css-once-baseline.txt` が持ち物に無かった（上）。CS2 はこの file に触らずには
  コミットできない。
- 「同じ性質を二度書いている selector 9」のうち `.tabbar` の background は `@supports`
  の中の正しい退避。同じ文脈で数えると 8（違う値 4 + 同じ値 4）。
- `.ob .btn.ghost` は「枠を取り除く」と読めたが、着ている物が無いので枠だけ外すと
  中身の無い規則が残る。規則ごと消した。
