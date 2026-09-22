# r50-composer ── 新しい投稿の二件（空白が一マス幅／欄を触ると下が消える）

## Scope

- **Goal:** オーナーの 2026-09-22 の二枚（ビルド 162、日本語キーボード）
  「あとここ入力しようとするとすぐバグるんだけどなんで？
  あとa line みたいなとこ空白開きすぎだし。直せないの？」
  ── 二件、別々の commit、別々の主張。
- **Owns (may change):**
  `www/otf5.js` `www/glyph.js` `www/post.js` `www/shell.js`
  `tools/face-check.mjs` `tools/post-check.mjs`
  `docs/CHANGELOG.md` `docs/scope/r50-composer.md` `docs/scope/shots/r50-*.png`
- **Does NOT own:** それ以外すべて。
  - **`www/index.html` は r48 が持っている。** CSS を一行も足さない。
    CSS しか直せないと分かったら、足す規則を書いて止まる。
  - **`tools/fixture.mjs` と `docs/CHECK-0907.md` は `origin/claude/r48-push-app`
    が既に触っている**（`docs/SESSIONS.md` 規則 4 でここは止まる所）。
    どちらも編集しない。実機で押す所は下の § 実機 に書き、リーダーが
    `docs/CHECK-0907.md` へ写す。
- **Decision it implements:** OWNER 2026-09-22（上の二行）。
- **Check to run:** `npm run face`（A）、`npm run post`（B）。
  **全ゲートは回さない** ── 取り込んだ人が一度（`docs/SESSIONS.md` § 6）。

## 二件

### A. `.tfont` の空白が一マス（em）幅
`LinguaFont.build` は必ず `space` を `spaceAdv = CELL` で足す（`www/otf5.js`
§ In a square-cell script the space is one cell）。`installTypeFont()` が
同じ `build` を呼ぶので、`LinguaType` も一マスの空白を持つ。`.tfont` の欄では
ローマ字は落ちて普通の書体、**空白だけが `LinguaType` から来て一 em**。
先に測る（幅を印字する）。直すのは書体を作る側で、CSS ではない。

### B. 欄を触ると意味・タグ・`.pwbar` が見えなくなる
iOS が欄を tap したときにする layout viewport のスクロール。`--vvtop/--vvh/
--vvkb/--vvmin`（`www/shell.js` `vvFit`）が何になるかを、偽の `visualViewport`
で数字にして再現する。**再現できなければ、原因を当てずに、実機で出す探りを
提案する**（「憶測で判断するな」）。

## 実機（リーダーが `docs/CHECK-0907.md` § 163 へ写す）
（このファイルの末尾に、終わってから書く）
