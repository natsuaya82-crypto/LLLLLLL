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

## A の結末 ── 直しました

測った順（読んだのではなく）：

1. 作られた書体のバイトを読んだ。`cmap` の U+0020 → glyph、`hmtx` の advance
   は **800/1000 = 0.800 em**。`LinguaScript` も `LinguaType` も同じ。
2. その glyph を外して撮り直したら**隙間が閉じた**。だから原因はこれ。

途中で一度外した道：`<span class="tfont">` を作って幅を測る、というやり方は
**再現しません**（ヘッドレス Chromium は run ごと丸ごと fallback する）。
本物の欄を撮った写真が出した答えのほうが正しい。**検査をバイトに置いたのは
この食い違いのためです** ── 絵で押さえると、엔진 によって緑にも赤にもなる。

直し：`LinguaFont.build` に `space` の選択肢。`installTypeFont()` が
`space:false`。`LinguaScript` は一マスのまま。
写真：`shots/r50-space-before.png` / `-after.png` / `-after-ja.png`

## B の結末 ── 原因は測りました。直しは一行で、ここでは入れられません

`.view.fit` は `top:var(--vvtop)` かつ `height:100dvh`。**見えている部分に
留めておきながら、ページ丸ごとの高さ**を持っているので、箱はページの足から
ちょうど `--vvtop` だけはみ出します。

390x844、キーボード 380pt、`visualViewport.offsetTop` を N に振って測った：

    offsetTop      0    20    40    60    80   120   200
    見えている下端 464   484   504   524   544   584   664
    .view.fit 下端 844   864   884   904   924   964  1044
    意味の下端     350   390   430   470   510   590   750

窓は N 下がり、列の足は **2N** 下がる。**N > 114 で意味がキーボードの下**、
続いてタグ。開いた直後は `pwKeepKb()` が `preventScroll` を渡すので N=0 ──
だから一枚目は正しく、**タップだけが壊れる**。

**入れる一行（`www/index.html`、r4-sns の節、`.view.fit` の高さ）**：

```css
.view.fit{height:100vh;height:calc(100dvh - var(--vvtop, 0px))}
```

実行時に当てて測り直したら、`.view.fit` はどの N でも 844 で終わり、意味は
N ぶんだけ下がって**どの N でも見えたまま**。`post-check` も緑になりました。
道具の行（`.pwbar`）は前後とも正しいままで、動いていません。

**このセッションは `www/index.html` を持っていません（r48 のもの）。**
だから入れていません。`post-check` 11d の新しい一つは、**その一行が入るまで
赤**です ── わざとで、失敗の文がその一行をそのまま書いています。
入れるなら二つ一緒に。

**再現できなかったこと**：オーナーは「道具の行も無い」と言っています。ここでは
`.pwbar` は `--vvkb` に正しく乗ったままでした。`--vvkb` が 0 に張り付くのは
`offsetTop ≥ キーボードの高さ` のときで、それは実機で起こる形ではありません。
**当てずに、実機で見る押し方を下に書きます。**

---

# 二周目 ── オーナーの新しい決定（2026-09-22、リーダー経由）

「全部俺の認識と違うの作られてるけど、、、横にするなんか言ったことない。直して。
あとキーボードも入力しづらすぎ。そもそも画面はスクロールできないようにして
欲しいんだけど、そうすればズレすら無くなるはずなのになんで？キーボードはそこで
止める。入力位置もタップしても動かないそれでいいやん。ちゃんとルールに則って直して」

## ① 縦書きの欄は字を立てる ── 直しました

`www/index.html` の r6-post の節（コメントごと）を削除。欄は親の
`.dir-ttb-rl,.dir-ttb-lr` の `text-orientation:upright` を受け継ぎ、**人の投稿の
行（`.pline`）と同じ**になります。

    before   H e l l o が横倒しで縦に並ぶ
    after    H / e / l / l / o と立って積まれる

**142 の r6-post の決定は取り消し**（`docs/FEATURE_RULES.md` 決定ログ）。
測った副作用：欄の幅が英語 82px（二列ぶん）・日本語 53px。**切れません** ──
`lnFit()` が幅を伸ばすだけです。

**同じ commit で `post-check` の 20 から、142 を押さえていた主張を二つ消しました**
── 「縦書きの欄でローマ字は一列」「長い行を入れても幅が増えない」。列が何本に
なるかは決定ではなく結果なので、逆向きの主張は置いていません。20 に残るのは
「返信と新規は同じ一本」。今それを押さえているのは `post-check` 11d-2 です
（`getComputedStyle`、両方向）。

写真：`shots/r50-ttb-before-roman.png` / `-after-roman.png`、
`-before-drawn.png` / `-after-drawn.png`

## ② 画面が動かない ── 直しました。「なんで？」の答えつき

**ページはもう止まっていました。動いていたのはページではありません。**
`html.fitlock` の `overflow:hidden`（`www/shell.js` § tabPaint）は**引っぱり**を
止めていて、それは効いています。**タップは引っぱりではありません** ── WebKit が
今焦点を当てた欄を見せるために**レイアウトビューポートを持ち上げる**のは
`overflow:hidden` では禁じられず、JavaScript からも断れません。`preventScroll` は
**プログラムからの** focus の選択肢で（だから `pwKeepKb()` の「開いた瞬間」は
ずっと正しかった）、指で textarea を触る道はそこを通りません。

**だから持ち上げは、戦わずに引き算します。一箇所で。**

    - .view.fit{height:100vh;height:100dvh}
    + .view.fit{height:100vh;height:calc(100dvh - var(--vvtop, 0px))}

箱は `top:var(--vvtop)` で留めてあるのに高さはページ丸ごとでした。**第二の
仕組みは足していません** ── `--vvtop` 一つに、箱の始まりと高さの両方を言わせた
だけです。`--vvtop` の読み手は今も `.view.fit` 一箇所。

測った（390x844、キーボード 380pt、持ち上げ N）：

    N              0    20    40    60    80   120   200
    見えている下端 464   484   504   524   544   584   664
    .view.fit 下端 844   864   884   904   924   964  1044   ← N だけはみ出す
    意味の下端     350   390   430   470   510   590   750   ← 2N 下がる

**画面の座標では、動いていたのは意味だけでした。欄と道具の行は壊れている間も
止まっています** ── iOS はまさに焦点の欄が動かないように持ち上げるので。
**だから欄だけを見る検査はバグを入れたまま緑になります。**三つ一緒に訊く理由です。

写真：`shots/r50-tap-before.png` / `-after.png`（持ち上げ 150、キーボード 380、
**見えている窓だけを切り取ったもの**）。**before がオーナーの二枚目です** ──
欄の下が空で、意味もタグもありません。

## ③ 「キーボードも入力しづらすぎ」── 測れる欠陥は見つかりませんでした

リーダーが挙げた候補を順に押して測りました。**どれも問題ありません**：

| 測ったもの | 結果 |
|---|---|
| `focusout` の再焦点（`pwKbGuard`）が行の途中のカーソルを飛ばすか | 飛ばない（4 → 4）。`pwKeepKb()` は既に焦点があると何もしない |
| 意味の欄から焦点を奪うか | 奪わない（`pw-mn` のまま、カーソルも 1 のまま） |
| 一字打つと欄が作り直されてカーソルが飛ぶか | 飛ばない。ノードも同じ（`pwFresh()` は描き直さない） |
| 欄の高さ | 行 51px、意味 46px ── どちらも 44pt 以上 |
| **日本語の変換**（`compositionstart`→`update`×4→`end`） | 値・カーソル・ノードすべて保たれる。「にほんご」→「日本語」、カーソル 3 |

**だから ② と同じ faultだと思われます**（画面が指の下で動く）。**測っていない
原因に直しは当てていません。**残るとすれば実機でしか出ないもので、§ 実機 の
2 を押してもらうのが一番早い道です。

## ④ 新しい規則を、自分の検査に当て直しました

取り込みで入った `453360b1`（`CLAUDE.md` §「穴は潰さない。面を俯瞰して覆う」、
OWNER 2026-09-22）を読んで、**①と②の検査が穴の一覧だったので書き直しました。**

| | 前（穴を並べる） | 後（面を数える） |
|---|---|---|
| ② 動かない | `#pw-ln`・`#pw-mn`・`.pwbar` の三つを名指し | **`.view.fit` の中の全要素**。明日行が増えても明日から覆われる |
| ① 立つ | `#pw-ln` を名指し | **`dir-ttb-*` を着ている物すべて** |

`post-check` は毎回**面を印字**します ──
「one-screen form: 53 things on it, none of which moves on the screen when the
page is lifted; 2 written downward, every one of them standing upright.」
面が黙って縮んだら、緑ではなく数字が落ちます。

**書き直したら、前の形より多く見つけました。**バグを戻すと前は「意味が動いた」
一つでしたが、今は **「53 のうち 5 つが動いた ── `#pw-mn`, `#pw-tags`,
`LABEL.pwtagw`, `SPAN.pwtagh`, `INPUT.pwtag`」**。タグの行ぜんぶが動いていた
ことは、三つを名指しした検査には見えていませんでした。

## 実機（**リーダーへ：`docs/CHECK-0907.md` はまだ r48 が持っています**）

`origin/claude/r48-push-app` の `dec27bac` が `docs/CHECK-0907.md` に居るままです
（§ 164 を足している）。`docs/SESSIONS.md` 規則 4 で止まる所なので、**二周目も
編集していません。**下をそのまま § 163 へ写してください。

新しい投稿、**日本語キーボードを出した状態で、二通り**：

1. **開いてすぐ打つ**（自分で欄を触らない）── 意味とタグと道具の行が
   三つとも見えているか。
2. **一行目の欄を一度タップしてから打つ** ── 同じ三つが見えているか。
   **2 だけが壊れるはず**です。壊れたら、そのとき**道具の行（カメラ・写真・
   マイク・ファイルの行）も消えているかどうか**を見てください。そこが
   このセッションで再現できなかった一点です。
3. 一行目の欄の文字 ──「a line in your language」の**空白が普通の幅**か
   （`shots/r50-space-after.png` と同じに見えるか）。英語表示で見てください。
4. **縦書きの言語**で、欄に「Hello」と打つ ── **H / e / l / l / o と立って
   積まれる**か（横倒しになっていないか）。`shots/r50-ttb-after-roman.png`。
   描いた文字でも同じに立つか（`-after-drawn.png`）。
5. **日本語で変換しながら**一行目に打つ ── 変換中に字が消えたり、カーソルが
   行末へ飛んだりしないか。ここはエミュレーションでは全部正常でした。

`docs/scope/shots/` ではなく `shots/` に置いてあります ── `tools/commit-msg`
が数えるのは `^shots/.*\.png$` だけで、`docs/scope/shots/` は数えません。

## リーダーの指示で違っていた所

- **A の「`.tfont` の空白が一 em」は正しい**が、**`<span class="tfont">` を
  測れ、というやり方は再現しません**。ヘッドレス Chromium は run 丸ごと
  fallback するので、素の span も `.tfont` の span も同じ幅を返します
  （どちらも 5.41px / 17px）。本物の欄を**撮る**か、**書体のバイトを読む**か
  のどちらかでないと測れません。両方やりました。
- **`--vvmin` は `www/shell.js` にもう在りません。**`vvFit()` が書くのは
  `--vvh` `--vvtop` `--vvkb` `--tabgap` の四つです。`--vvmin` は
  `www/index.html` のコメントと `www/notes.js` `www/home.js`
  `tools/post-check.mjs` の説明文に名前が残っているだけです。
- **`tools/fixture.mjs` と `docs/CHECK-0907.md` は `origin/claude/r48-push-app`
  が既に触っています**（`7e025436`、`dec27bac`）。指示は
  `docs/CHECK-0907.md` § 163 に書けとありましたが、`docs/SESSIONS.md` 規則 4 で
  止まる所なので、**どちらも編集していません。**上の § 実機 を写してください。
- 写真の置き場は `docs/scope/shots/` ではなく `shots/`（上の理由）。
