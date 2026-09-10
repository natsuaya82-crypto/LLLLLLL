# r14-keep ── 保存ボタンが光らない所を一本化する

オーナー 2026-09-10：「書き換えてもセーブボタン光らないとこ多いからこれも一本化してね」

`integ-0905` の `982ae856` から切った `claude/r14-keep` で作業します。

## 触る file

- `www/shell.js`（`KEEP` と § THE BUTTON IN THE CORNER THAT DECIDES）
- `keepOn()` を呼ぶ 13 箇所の file ── `www/glyph.js` `www/grammar.js`
  `www/home.js` `www/keyboard.js` `www/letters.js` `www/me.js`
  `www/notes.js` `www/phases.js` `www/sound.js` `www/wordsheet.js`
- `www/act-map.js`
- `tools/keep-check.mjs`、`tools/fixture.mjs`
- `docs/scope/r14-keep.md`（この file）、`docs/CHANGELOG.md`

## 触らない file

`www/index.html`、`www/net.js`、`www/core.js`。必要になったら止まって理由を書きます。

## やらないこと

- 他の枝を merge / rebase / cherry-pick しない
- ゲート全体（`npm test`）は回さない。`npm run keep`、`npm run press`、
  速い九つだけ
- 見た目を変えない（ボタンが金になる**瞬間**は変わる）

## 表 ── 測ったもの（1）

**どう測ったか。** 本物の `render()` で `PAGES` の全 route × 引数と全 `open*` の
form に立ち、右上に `[data-do="keepPress"]` が在る画面を拾う（一覧を手で書かず、
画面から取る）。**24 の立ち位置に保存ボタンが在った。** そこで #app と開いている
sheet の全ボタンを一つずつ押し、押す前に画面を作り直す（`tools/press.mjs` と同じ）。
押した直後に四つを記録する ── 画面が動いたか、端末の持ち物（`LSL` ＋ disk、
`slMine()` で読む）が変わったか、#app が描き直されたか、右上が金（`.navdo.navon`）か。
選んでから押す変更のために二段目も回した（一段目の押しごとに、そこで押せる
ボタンを全部）。

### A ── 保存ボタンが在るのに、変更しても光らない

| 画面 | 変更 | 端末に書いたか | 右上 |
|---|---|---|---|
| 文字を描く `glyph` | ラウンド `geCircle` | 書かない | **灰**  |
| 〃 | 塗り `geFill` | 書かない | **灰** |
| 〃 | 全部消す `geClear` | 書かない | **灰** |
| 〃 | 一つ戻る `geUndo` / 進む `geRedo` | 書かない | **灰** |
| この言語について `world` | 概要の行を足す `wldOvAdd` | **書く** | **灰** |
| 〃 | 概要の行を消す `wldOvDel` | **書く** | **灰** |
| 〃 | 節を足す `wldArtAdd` | **書く** | **灰** |
| 〃 | 節を渡してよいか `setWldSecDl` | **書く** | **灰** |
| 語順 `gram:v2:order` | 二語の入れ替え `g2Move` → `setGPos` | **書く** | **灰** |
| キーボード `kb` | どれを端末に出すか `kbApply` | **書く** | **灰** |
| 単語の紙 `form edit:` | 意味の欄を足す `wdMnOpen` → `wdAddMn` | **書く** | **灰** |

`glyph` の四つは**描いた字そのものが変わって**灰のままです。`geTools()` の中の
`geKeepPut()` が唯一の入口で、そこは指で描いた時にしか通りません。その上の
コメントは「`geHist()` と `geClear()` は `render()` を呼ぶのでそちらで答える」と
書いていますが、`render()` は `keepDirty()` を読むだけで、`keepDirty()` が読む
`b.v` を動かすのは `geKeepPut()` だけ ── **コメントが嘘をついていて、何も
止めていませんでした。**

### B ── 光っていて、正しい（一本化の見本）

`wsys` の書記体系 `wsPick` と向き `dirPick`（`keepSet` を通る）、語順の
`g2Put` `g2Take`（`g2Set` → `keepPut`）、キーボードの `kbCut` `kbAlign`
`kbInsAsk` `kbUndo` `kbRedo` `kbAddLay`（全部 `saveKb()` → `kbKeepLay()` を
通る）、打った字（全画面）、`wdDelMn`。

### C ── 光ってはいけないもの（選択・折り畳み・開く）

`abToggle`（節の開閉）、`kbHeadRow` `kbHeadCol` `kbTapKey` `kbCellAdd`
`kbGoLay`（どこを触っているか）、`wdExOpen`、`g2Move` の持ち上げ側、
`pkSwitch`、`ipaToggle`、`stExOpen`。**測って確かめました ── 全部灰のままです。**

### D ── 言語のものではなく、自分の道を持っているもの

`setWldHide` は `netLangPublic()` がその場で送る（OWNER 2026-09-05
「保存するタイミングでエラーが起きるなら、保存されないし」）。`setMyFont` と
`setKbRom` は `SET` ＝ その人の設えで `netPrefsPut()` が送ります。**三つとも
灰のままでよく、A には入れません。**

### E ── 保存ボタンが**無い**画面で、押すとその場で書かれるもの

これは「光らない」ではなく「ボタンが無い」で、**別の問いです。**
`docs/FEATURE_RULES.md` § Deciding に従って、ここは直さずに並べます。

| 画面 | 変更 |
|---|---|
| 音の一覧 `form snd:` | 文字に音を付ける `ltTakeSnd` |
| 人の文字をもらう `form pick:` | `takeOwn` |
| 段の枠 `form slot:` | 語を入れる |
| 例文 `form stex:` | `stAddEx` `stDelEx` |
| 綴りの頁 `spell` | `spAdd` |
| 新しい語の紙 `form add:` | `wdDerive` ほか |
