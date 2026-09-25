# r90-plan ── plan-check が全ゲートの下でだけ赤くなる原因を測る

枝 `claude/r90-plan`（`integ-0905` 24876e3a から）。

## 何が起きているか（リーダーが測った）
全ゲート（遅い検査 4 本並列）で plan-check の二行だけ赤:
- the launch after it ASKS again … (**never asked in 5s**)
- and the answer is taken … (**nothing**)
単独では 4 回とも緑。

## 触ってよいもの
- `tools/plan-check.mjs`
- 原因がアプリにあると測れた場合だけ、`www/store.js`・`www/core.js`・`www/boot.js`・`www/net.js` のうち要る物（触る前にここに書く）
- `docs/scope/r90-plan.md`、振る舞いが変われば `docs/CHANGELOG.md`

## 触らないもの
`www/index.html` ほか上に無い全部。全ゲートは回さない。仕様は決めない。

## 報告

### 原因（測った）
**アプリではなく検査。** `boot()`（`tools/plan-check.mjs`）の種は initScript の中で
`if (!localStorage.getItem('lingua.set'))` なら撒く、だった。initScript は reload の
たびに文書の頭で走る。**Chromium は reload した file:// の頁で、その読みを空と答える
ことがある** ── 鍵は残ったまま。すると種が撒き直されて `__off=1`（無信号）と一時間前の
トークンが戻り、トンネルの後の起動が二度目のトンネルになる。refresh が落ちるので
verify-plan は一度も出ない ＝「never asked in 5s」「nothing」。

証拠:
1. 赤が出た回の頁（reload 後）: 要求は refresh と古いトークンの GET 2 本だけ、
   localStorage に `__off=1`、`lingua.sess` は種の `OLD`／`r`。緑の回は `__off` 無し、
   refresh → `FRESH` → verify-plan（6 本目、約 250ms）。
2. 小さな試験（アプリなしの file:// 頁、initScript が「a が無ければ a と off を書く」、
   evaluate で off を消す、reload）: **300 回中 35 回撒き直し（負荷なし）、負荷下で 17 回**。
   initScript で先に sessionStorage に触ると 300 回中 1 回に落ちる ── 印を足した写しで
   赤が出なくなったのはこのため。書き込みを initScript でなく evaluate からした時は 0/300。
3. 直す前の plan-check を 4 本並列（ゲートと同じ幅）で 48 回: **赤 2 回、2 回ともゲートと
   同じ二行、2 回とも reload 後に `__off=1` が残っていた**。残らなかった 46 回は全部緑。

負荷で 5 秒を超えたのでも、アプリが訊き直さないのでもない。負荷は起こる率を少し
動かすだけで、負荷なしでも起きる。「待ち方」も原因ではない ── 待っている要求は、
種の撒き直しで無信号にされた起動では出ようがない。

### 何をどのファイルで
- `tools/plan-check.mjs` `boot()` ── 種はアプリでない file:// の頁（`tools/` の一覧、
  同じ origin、何も走らない）で `evaluate` して書き、その後 `index.html` へ行く。
  保存を読んで書くかを決める所をなくした。`window.__plan`／`__planok` は保存を読まない
  ので initScript のまま。reload する三箇所（p2・p4・p5）は全部この `boot()` を通るので、
  三つとも一度に覆われる。待ち方（要求そのものを待つ、5 秒で赤）は元のまま ── もう
  そうなっていた。

### 振る舞い
アプリは変わらない。`www/` は一行も触っていない。`docs/CHANGELOG.md` は書いていない。

### 回した検査
- 直す前: 4 本並列で 48 回 → 赤 2（上の 3）。
- 直した後: 単独 1 回緑、**4 本並列で 48 回続けて緑（赤 0）**。
- 全ゲートは回していない（規則 6）。

### 測っていない所
- r88 の「so the launch after it is quiet — lapse_seen」の一度の赤は p4 の reload で、
  同じ `boot()` の種を通る。直しはそこも覆うが、あの赤がこの原因だったかは測っていない。
- なぜ Chromium がその読みを空と答えるか（file:// の reload で initScript の時点の
  保存の結び付き）は中まで追っていない。測ったのは起きる率と、起きた時に何が起こるか。

### 同じ形が残っている所（持っていないので触っていない）
`tools/migrate-check.mjs` 205 行（偽の Keychain）と 242 行（偽のサーバー）の initScript
が、文書の頭で localStorage を読んで入れるかを決めている。この検査は reload が 19 回ある。
空と読まれれば偽のサーバーが入らず、起動は本物へ出る。赤は見ていない。覆うなら同じ形
（読んで決めない）で、migrate-check を持つセッションの仕事。

### CODE／DEVICE／OWNER
- CODE CONFIRMED: 上の測定。
- DEVICE CONFIRMED: 無し（検査の直しで、端末は関係ない）。
- OWNER CONFIRMED: 無し。

### リーダーの指示が間違っていた所
「負荷の下で 5 秒を超えるのか、要求が出ないのか」は後者だったが、原因は負荷でも
アプリの順番でもなく検査の種撒きだった。「CPU を食わせて赤を確実に出す」は効かなかった
（8 本の CPU ループで 4 回、Chromium 検査 3 本の隣で 16 回、全部緑）── 負荷が出して
いたのではないため。赤を出したのは回数（4 本並列で 48 回）と、単独の小さな試験。
