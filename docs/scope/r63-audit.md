# r63 — 二重確認（2026-09-23）

作業セッション r63-audit（`claude/r63-audit`、`origin/integ-0905` ecf88d0f から）。
オーナーの「この一覧以外にも無いか、二重に確認する」に答えるもの。**コードは一行も
変えていない。直すのは別のセッション。**

- 問いは r46 と同じ三つ:
  **A** 端末の写しがサーバーに勝つ／人が押していないのにサーバーへ書く／丸ごと送る。
  **B** 一つの事を二つ以上の仕組みでやっている、穴を一つずつ塞いだ継ぎ当て（§ Simple・§ COVERED）。
  **C** 書いてある事（コメント・docs）が今のコードと違う。
- 各項に **［測った］** か **［読んだ］** を付けた。測ったものは、実物のアプリをヘッドレス
  Chromium で起こして（`tools/fixture.mjs` と同じ種）関数を包んで数えたもの、`schema.sql` を
  そのまま使い捨ての PostgreSQL 16 に当てたもの、実物の関数を `node` に切り出して評価したもの。
  使った一時スクリプトは repo に入れていない。**端末では何も確かめていない。**
- 印: **〔r60〕** = r60-up の面（§A と B3、net/boot/backup/sync/me/post/sns/push/core）、
  **〔r61〕** = r61-face の面（B1/B2/B4、glyph・CSS・onboard・settings・home ほか）、
  **〔r62〕** = r62-docs の面（§C と付録）、**〔新〕** = 今どのセッションの面にも入っていない。
- ecf88d0f と 46280fcb の差は `www/home.js` と i18n だけなので、r46 の行番号はそのまま使える。

---

## 0. 一番重いもの（先に読む）

### 0-1. 起動しただけで、端末の読むだけの写しが言語としてサーバーへ上がる 〔r60〕［測った］

- 通り道: `langLoad` が `slRd()`（`www/core.js:821`）で読む → `slRd` は LSL に無ければ
  `.got`（前回読み込んだ写し）へ落ちる → `WORDS` が写しで埋まる → その後の **`save()`
  （`core.js:1434`）はどの呼び手でも `WORDS`・`LINES`・`SCRIPT` を丸ごと LSL に書き、`bkTouch()`**
  → LSL に入った時点で `slMine()` が「この端末の物」と答え、`was` が無いので全部「動いた」
  → `netSaveUpGo` が送る。
- 測ったこと: 写し `[keep, gone]`、サーバー `[keep]`（gone は別の端末で消した）、移行は何も要らない
  状態で起動。人は何も押していない。出た要求:
  `POST /rest/v1/slice {"kind":"words","body":"[…keep…,…gone…]","no":2}`、
  さらに `lines`・`script`・`letters` の行（サーバーに無かったもの）も POST。
  **消した単語が戻る。**
- 引き金は移行ではなかった。`askSaved()`（`www/sns.js:2719/2730/2732`）が SET だけの変更を
  `save()` で書いている。同じく `migrateMn`（`core.js:2710`）・`migratePos`（`shell.js:2368`）も
  この起動で `save()` を呼んでいた。
- 面: **`save()` が「設定を書く」と「言語を保存する」の二つを一つの名前でやっている**（B）。
  設定の保存（`setTheme` `settings.js:570`、`setMyFont` `glyph.js:652`、`obIn` `onboard.js:1006`、
  `askSaved` ほか）がすべて言語の保存として走る。ルール 22「その写しは読むだけで、サーバーへ
  戻らない」「langHeld は slMine なので写しは旅しない」が、`save()` が写しを LSL に書き写す
  一行で破れている。
- 但し書き: スタブのサーバーは即答する。本物の回線で `netLangsDown` が先に LSL を埋めるか
  どうかで勝ち負けが変わる。**競走で決まること自体**が違反。

### 0-2. 同じ形が言語の外でも三つ 〔新〕［測った］

写しを LSL に書き写して「この端末の物」にする道は `save()` だけではない:

- `migrateKbFree()`（`www/keyboard.js:340`、`boot.js:36`・`core.js:1335` `langOpen`・
  `settings.js:729` から）: `.got` の写しに `v` の無い `{kbs:[QWERTYの写し, 自作], at:1}` を置くと、
  起動で `kbs.shift()` して `saveKb` → 写しが LSL に入り（`pictureNowHeld:true`）、
  `netLangsDown` は「持っている物は書かない」ので**サーバーの方が負ける**。`v<2` の行が
  サーバーに実在するかは見ていない。
- `langSaveAll()`（`langOpen` `core.js:1330`、`wipeLangsHere`、`wipeHere` から）: `kbRead()` の
  `kbIded()` が id の無い板に id を振るので、写しとの差が必ず出て、キーボードの slice が
  「動いた」として送られる（`LSL has kb = true`、写しと違う）。
- 起動の `netAvSync()` が、顔の無い端末から `PATCH /rest/v1/profile {"av":null}` を送った
  （0-1 と同じ実行で出た）。サーバーの顔を消す。→ A1 の続き（下）。

### 0-3. 払っている人に、プランを訊けていない間は 100 語しか見せない 〔新〕［測った］

- `wordCap()`（`www/core.js:1595`）は「まだ訊いていない」を free として 100 を返し、
  `wordsSeen()`（`www/words.js:149-152`）がそこで辞書の一覧を切る。実物の `CAN`/`has`/`can`/
  `wordCap`/`langCap` を切り出して評価: `unknown: wordCap 100 langCap null`、`pro: Infinity`。
- `CLAUDE.md` § Money「失敗した確認はボタンが減るだけで、言葉は減らない」、
  `docs/PAID_FEATURES.md`「三つ目の状態は free ではない」に反する。電波の無い起動・verify-plan が
  答える前、Pro の人は 500 語のうち 100 語と「N 語隠れています」を見る。
- B でもある: すぐ隣の `langCap()`（`core.js:1674`）は `planKnown()` を訊いて `null` を返す。
  **同じ問い（まだ訊いていない天井）に二つの答え。**
- 同じ「unknown を free と読む」が他にも二つ［読んだ］:
  `can('noads')` → Pro の人のタイムラインで AdMob が起動し追跡許可の問いが出る（`sns.js:424/434`、
  `LinguaAds.swift:83`）。`plHave()`（`settings.js:1139-1142`）→ verify-plan が失敗して App Store は
  届く時、Pro の人に「Plus を買う」が生きている（9/3 の二重購入と同じ形の別の道）。
  **面は「`can()`/`has()` が unknown を false と答える」一つ**で、覆う一文はそこに書くもの。

### 0-4. 端末を二台持つ人の言語は、サーバーでも後勝ち 〔新：schema〕［測った］

- `slice.no` を比べるものが schema に無い（`supabase/schema.sql:371-378`、policy にも trigger にも）。
  `netSlicePut`（`www/net.js:2081-2092`）は「読んだ no + 1」で upsert する。
- 実物の schema.sql に当てて: 端末 2 が `no=2` で `["w1","w2"]`、その後 no=1 を読んでいた端末 1 が
  `no=2` で `["w1","w3"]` → 通る。`no=1` の書き込みも通って本文を置き換える。
- `sync.js` 側の足し合わせも base を見ない（下の B-sync）ので、読んで・混ぜて・書くの間の窓で
  古い方が勝つ。`slice_hist_keep` が直前 3 つを取っておくのが唯一の救い（1.2 秒ごとの保存なら数秒分）。
- schema.sql 350-368 のコメントは「`no` は端末が古い物を持っていると言うもの」と書いており、
  `docs/DATA_SAFETY.md:65` と net.js は「`no` は何も守らない」と書いている（C、二つの文が食い違う）。

---

## 1. r46 の読み直し

| 項 | 判定 | 要点 |
|---|---|---|
| A1 アイコン | **合っている、足りない** | 下 |
| A2 設定 | **合っている** | 呼び手が一つ漏れ: `setKbRom`（`keyboard.js:3867`）も `netPrefsPut` を呼ぶ。全 9 か所 |
| A3 syMerge | **一部違う** | 下 |
| A4 起動時の保存 | **一部違う、結論は重くなる** | 下 |
| A5 後で送る | **合っている、足りない** | 下 |
| A6 下書き | **一部違う** | 下 |
| B1 自作文字で出す | **合っている、三通りではなく六通り以上** | 下 |
| B2 SET.myfont | **合っている、三つではなく五つ** | `netPrefsPull`（`net.js:1356` `SET[k]`）と `setFor`（`core.js:2205`）も書く |
| B3 名前が二つ | **一部違う** | 下 |
| B4 複数ファイルが書く | **一覧と行番号は正確、探し方に穴** | 下 |
| C | **合っている** | FEATURES.md 58・59・72・103 とも今も違う |
| 付録 76 | **76 は再現、うち 4 は偽陽性** | 下 |

### A1（アイコン）〔r60〕［測った・読んだ］
- r46 のとおり: `mePicKeep`（`me.js:520/532`）・`meDropPic`（`me.js:602`）は `ME.pic` を置いて
  `saveMe()` するだけ。上がる道は起動の `netAvSync`（`boot.js:145` → `net.js:1432`）だけで、
  比べる相手は端末の `ME.avSent`。サインインの時には走らない。
- 漏れ 1［読んだ］: `netMyProfile`（`net.js:1136`、呼び手は `obIn` `onboard.js:947` だけ）は
  サーバーの `{pic:X}` を **`ME.av`** に入れる。その後 `meDropPic` で `ME.pic` を消しても
  `postAvatar()`（`post.js:2263`）は `ME.av = {pic:X}` を返すので、**消しても消えない**。
- 漏れ 2［測った］: 顔の無い端末で `avSent` が空だと、起動で `PATCH /rest/v1/profile {"av":null}`
  を送る。サーバーの顔を消す（0-2）。
- 漏れ 3［読んだ］: `meFor`（`me.js`）は持ち主の書かれていない `ME` の写し（`pic` 込み）を
  サインインした人に渡す。次の起動で `netAvSync` がそれを送る。

### A3（syMerge）〔r60〕［読んだ］
- 通り道は r46 のとおり（`netSlice1` `net.js:2765` → `syMerge`、起動・`netTook`・保存のたび）。
- **「ルール 22 の bug（読めない写しを空と読んで上書き）が今も立っている」は違う。**
  `syMerge`/`sySide`（`sync.js:211-275`）は `wreck` で壊れた写しと空を分けている — 壊れた端末の写しは
  サーバーの物を取り、壊れたサーバーの行には何も書かない。**古いのは `CLAUDE.md` ルール 22 の
  その一文の方**〔r62〕。
- 本当の問題は 0-1（写しが `mine` として syMerge に入る）と、下の B-sync（base を見ない）。

### A4（起動時の保存）〔r60〕［読んだ・測った］
- 「12 個の `migrate*()` が全部、起動した瞬間に保存を呼ぶ」は**違う**。`migrateMn`・`migratePh`・
  `migratePos`・`migrateLetters`・`migrateMarks`・`migrateSndName`・`migrateSp`・`migratePosts`・
  `migratePostInk` は何か変えた時だけ保存する。
- 一度だけ無条件で保存するのが三つ: `migrateWorld`（`home.js:873`、`wldMoved` を立てる前に
  `save()`）、`migrateKbFree`（`keyboard.js:340`、`KB.v < KB_V` で `saveKb`、0-2）、`migrateSnd`
  （`sound.js:262`）。
- 漏れ: **`migrateSnd` は `delete SET.snd` する** — § Data「移行は読んだものを消さない」に反する〔新：sound.js は r61 の持ち物〕。
- 結論（起動で端末の状態が上がる）は合っていて、実際は r46 の書き方より重い（0-1）。
- `backup.js:44-46` のコメントが間違いなのは r46 のとおり（`index.html` の順は net.js 4106 →
  backup.js 4138 → boot.js 4143）〔r60〕。

### A5（後で送る）〔r60〕［読んだ］
- r46 のとおり。`postCatchUp`（`post.js:1337`、`sns.js:636`）は失敗の受け手が空で、一度に 4 つまで。
- 漏れ: 失敗した削除も黙って送り直す（`netDropAgain`）。根は `pwSend` の順番 — `POSTS.push` →
  `savePosts`（`post.js:~2181`）→ 送信。下書きの道（サーバーに届いてから端末に置く）と逆。
  さらに、投稿が届く前にサーバーの下書きを消している（`netDraftDrop`）。
- 別件［読んだ］: 非公開の投稿（`pv`）は送らない（`post.js:2204`、`postUnsent()` `post.js:1281` も
  `pv` を外す）ので端末の `lingua.posts` にしか無い。「SNS は全部サーバー」と `docs/DATA_MODEL.md:754`
  「netPush() に渡さない」が食い違う。**書かれた決定どうしの食い違いなのでオーナーの物**。
  `store-check` は `LS_POSTS` を「道がある」と数えていて、送られない投稿を見ることができない。

### A6（下書き）〔r60〕［読んだ］
- `post.js:703` の `netDraftUp` は `up` の無い下書き（サーバー以前の物）だけ — 実質は一度きりの移行の道。
  r46 の「同じファイルで逆のこと」はその意味では言い過ぎ。
- 漏れ（こちらが本題）: 端末とサーバーの両方にある下書きは、`draftsPull`（`post.js:670-671`
  `if(d){ keep.push(d); continue; }`）で**いつも端末の方が勝つ**。別の端末での編集はここに出ず、
  ここで開いて「取っておく」と `netDraftUp`（`net.js:5006`）が古い本文を新しい行の上に PATCH する。

### B1（自作文字で出す仕組み）〔r61〕［読んだ］
- 三通りではない。今あるもの:
  `sfontHTML`（`.sfont` の span、LinguaScript。`glyph.js:640`、grammar ×15・wordsheet ×6・numbers ×2）／
  `.tfont` を要素全体に（LinguaType。`grammar.js:1829`、`letters.js:1401`、`wordsheet.js:1198`）／
  `.pline`・`#pw-ln`（`index.html:862`）／`html[data-script=on] .hw/.psw/.whw`（`index.html:3345`、
  `glyph.js:3007` で立てる）／写真の上の文字の textarea に `.sfont`（`post.js:2511`）／
  `inScript()`・`wOut`（`home.js:136`）と canvas の ink。
- `sfontHTML` のコメントが「ONE PLACE」と書いているのは違う（C）。

### B3（名前が二つ）〔r60〕［読んだ］
- `lang` スライスを書く所はもう無い（`core.js:241`、読むのは `core.js:371` だけ）。「二つの仕組みが
  書いている」ではなく「古いデータが衝突したままオーナーの決定を待っている」。
- ただし `lang` はまだ `SLICES` にあり、syMerge はこれをいつも端末の方で持つので、古いディスクの
  キーが上がり得る。

### B4（複数ファイルが書く項目）〔r61〕［測った］
- コメントを除いて自分で集め直すと、r46 の一覧（`ME.av`・`ME.handle`・`ME.name`・`SET.myfont`・
  `SET.showScript`・`SET.ui`・`SET.walked`）と行番号はぴったり同じ。
- 探し方の穴: 変数のキーで書く所を拾えない — `net.js:1306` `ME[k]`（`netProfSync`、name・handle・
  bio・link・loc）、`net.js:1356` `SET[k]`（`netPrefsPull`、10 項目）、`core.js:1265`・`2205`
  （`setFor`）。これを入れると name・handle は 3 ファイル、myfont・ui・showScript は 4 ファイル以上。

### 付録 1（76 個）〔r62〕［測った］
- r46 のスクリプトを回し直して 76、同じ集合（差分なし）。`www/` の中での言及はすべてコメント。
- 偽陽性 4（`www/` の外で定義されている）: `pushMay`（`supabase/functions/push-send/push.mjs:274`）、
  `measureRows`（`tools/press.mjs:351`）、`hasBytes`（`tools/post-check.mjs:2635`）、
  `jsIn`（`tools/dead-check.mjs:159`）。
- `postGloss`/`postGlossLine`（`CLAUDE.md:1990`）と `spPageHTML` は、今も「一つの場所」として
  名前が出ている — 本当に古い。

---

## 2. r46 が見ていない所

### 2-1. `www/keyboard.js`・キーボード拡張 〔新〕

- **K1 板の編集は「保存」を押さなくてもサーバーへ行き、「いいえ」で取り消せない**［測った］（A、B）。
  すべての変更は `saveKb()`（`keyboard.js:373`）で終わり → `bkTouch()` → 1.2 秒後に `netSaveUpGo`。
  測定: `kbDelKeys` の後 `saveKb:1 bkTouch:1`、1.5 秒後 `upGo:1`、その間 `keepDirty('kb|1')` は
  `true`（保存ボタンは金色のまま、中身はもう送られている）。出る時の「いいえ」は `keepDrop()`
  （`shell.js:779`）だけで、`KB`・LSL・サーバーは戻らない［読んだ］。上がる道が二つ（押した時と、
  押さなくても）。`kbKeepSave` のコメント（`keyboard.js:988-994`）「押すのは送るため」と食い違う（C）。
- **K2 `migrateKbFree` と `langSaveAll` が写しを「持っている物」にする**（0-2）［測った］。
- **K3 `saveKb()` の中の二つの修理が逆の範囲を持つ**［測った］（B）。`kbWayOff()`（`4061-4083`）は
  「見ていない板は並べ替えない、それがこの規則の目的」と書いて `kbEdit()` だけを触り、`kbVFix()`
  （`2076`）は `KB.kbs` を全部歩く。測定: 板 1 に一人ぼっちの `h`、板 2 を編集 → 板 1 が変わった。
  どちらも言語を切り替えた時の `langSaveAll()` からも走る（押していない書き込み、`sync.js:52` も
  「ディスクへ行く途中で板が書き換わる」と認めている）。
- **K4 キーボードの天井を索引と写しから数える**［読んだ］（ルール 22「索引から何も数えない」）。
  `kbCount()`（`keyboard.js:88-106`）は `LANGS` を歩き、他の言語は `slRd()`（`.got` に落ちる）で読む。
  `kbRoomKb()`・`kbCapStop()` に効く。「まだ訊いていない」の三つ目の状態が無い。
- **K5 App Group は誰のアカウントでもなく、何も片付けない**［読んだ、端末が要る］
  （§ NOTHING IS THE PHONE'S）。`sharePush()`（`share.js:615`、`glyph.js:2995` の `render()` から）は
  開いている言語を書き、サインアウト・アカウント削除で消す道が無い（プラグインに clear が無い、
  `wipeHere`・`lsWipeAcct` も呼ばない）。空のフォントは「前の物を残す」（`LinguaShare.swift:65-96`）。
  アカウントを消しても拡張とウィジェットに前の人の文字が残る。
- C［測った・読んだ］:
  - `saveKb` の上のコメント（`keyboard.js:350-372`）が `bkSound`・`bkOK`・`bkPush`・`bkPack` と
    「バックアップファイル」で自分を説明している（四つとも定義 0、ファイルはルール 11 で消えた）。
    150 行目も同じ。
  - `kbGap` のコメント（`keyboard.js:402`）「share.js が外へ出る時に落とす」は逆。`shareKey()`
    （`share.js:166`）は `{k:'gap'}` を送り、QWERTY で 2 つ数えた。コードが正しい。
  - ファイルの頭（`keyboard.js:31-37`）「一つの言語はキーボードを三つまで」→ 実際は `FREE_KB=1`・
    `PLUS_KB=4`（`core.js:1641`）・Pro 無制限、数えるのは人ごと。
  - `docs/keyboard.md` 〔r62 の持ち物に無い〕: ~120 行「列の字を押すと全部の行から消える」「行番号で
    その行が消える」（今は選ぶだけ、ルール 19）、15 行「`lingua.<id>.kb` は電波が無い時に動く写し」
    （もう書かれない）、59 行「バックアップにも残り」。
- 見て問題が無かったもの: 描くだけでは `saveKb:0 bkTouch:0 upGo:0`［測った］。他の `saveKb()` の
  呼び手 22 はすべて押した時。拡張は App Group を読むだけ（`RequestsOpenAccess=false`）。行の天井は
  `kbRowsMax` 一か所で、`kb-check` が Swift から数を読んでいる。Swift のキーの種類は `shareKey()` と合う。

### 2-2. `www/card.js` 〔新〕

- **CD1 他人の投稿で ink の無いものは、カードが自分の辞書と自分の字で描く**［測った］（ルール 8・12）。
  `card.js:877` `items=src.ink? cardInkUnits(src.ink) : cardUnits(src.line)`。`inkOfCut()`（`post.js:~2362`）
  は描いた形が一つも無い行で null を返すので、ink 無しの投稿は普通にある。`netRow()`（`net.js:3171`）
  もそのまま持ってくる。測定: `mine:false, ink:null, ln:'kano tir'` → カードは
  `otherNoInk_shapes:1, text:"Ϙir"`、タイムラインは `"kano tir"`。
  ルール 12 の「まだ起きない…サーバーから来る投稿は ink を載せて来る」は今は偽（C）。
  **`card-check` が緑のままなのは、ink 無しの試験がどれも `ln:'qq ww'`（どの辞書にも無い）だから**
  （`tools/card-check.mjs:285-335`）— 代理の試験。
- **CD2 単語・例文のカードは、用紙で書いた字を落とす**［測った］（§ One place）。`cardUnit()`
  （`card.js:217`）は `l.st` しか読まない。形が `sh` のこともあると知っているのは `inkGeo()`
  （`glyph.js:203`）一か所で、`postCut()` はそれを訊く。測定: `kano` の唯一の字を用紙の字にすると
  単語カード `1 → 0`、同じ字で `postInk('kano')` は 1 のまま。
- **CD3 カードに「空白と改行とは何か」の二つ目の答え**［測った］（ルール 8「`postRuns()` が一か所、
  一行とカードの両方が読む」）。`cardUnits()`（`card.js:201`）は `/\s+/` で割る。測定: `ln:'qq\nww'`
  → カード `breaks:0, spaces:1`、タイムラインは改行を保つ。
- **CD4 カードの意味と投稿の意味が違う**［読んだ］（B）。`cardOfPost` は `String(po.mn)`
  （`card.js:1128`）、タイムラインは `postSay(p)`（`post.js:2407`、今日のお題を読む人の言葉で出す）。
- **CD5 消えた投稿のカードは、自分の一番新しい単語のカードになる**［読んだ］。`card.js:133-150` で
  `postById` が外れると `findWord(v) || WORDS[WORDS.length-1]` へ落ち、自分の @ が付く。
- C［読んだ］: `card.js:1074-1077`「言語の名前でファイル名」→ `cardFileName()` は `hd`（@）。

### 2-3. `www/rec.js`（声）〔新／netBody は r60〕

- **R1 声の長さが読む人に届かない、他の端末ではいつも 0:00**［測った］（ルール 13）。長さは
  `vo:{f,ms}` にしか無く、`netBody()`（`net.js:3157`）は `vo` を落とし、`postVoMs()`（`post.js:3630`）は
  `p.vo.ms` しか読まない。実物の `netBody` に `{vo:{f,ms:12000},vu:'u/p/vo.m4a'}` → `{"ln":"kano","vu":…}`。
- **R2 送る時に声が黙って落ちる**［読んだ］（ルール 11「保存して何も言わないのは駄目」）。
  `netUpVoice()`（`net.js:4965-4973`）は `voRead()` が空だと `ok(0,0)` で、声の無い投稿が出て何も言わない。
- **R3 下書きの声はこの端末のファイルを指す**［読んだ］（§ NOTHING IS THE PHONE'S）。サーバーの
  下書きが `vo:{f}`（`post.js:551`）を持ち、`f` は Documents の `v<時刻>.m4a`。別の端末で開くと無い。
- R4（軽い）［読んだ］: `voExt()` は「webm を入れた .m4a は誰も開けない」と言い、`netUpVoice` は全部を
  `vo.m4a`/`audio/mp4` で上げ、`voPlay` は `voMime()` に関わらず `data:audio/mp4` で鳴らす。iOS では無害。
- C［読んだ］: `rec.js` の頭（19-22）「言語のバックアップの隣のフォルダ」「localStorage に入るのは投稿」。

### 2-4. `www/sheet.js`・`www/cal.js`・`www/grammar-engine/` 〔新〕

- **G1 translate.js「投稿には何も凍らせない」と書き、凍らせている**［読んだ／grep］（C）。
  `translate.js:20-25`。`post.js:2135`・`3203` が `toNatural()` の結果を `p.mn` に入れ、
  `docs/FEATURES.md:96` も「`post.mn` は投稿に凍る」。`post.js:2132-2134`「保存しない」も偽〔r60〕。
- **G2 保存された文法モデルが、眠っている二つ目の語順の出どころ**［読んだ］（B）。`adapter.load()`
  ＋`gModel()`（`grammar.js:560-568`）: `gram2` があれば `wordOrder` が `orderDef()` ではなく保存物から、
  `inflections` は生成物に**足される**（規則が二重）。今は `gram2` を書く物が無いので眠っている。
  `adapter.save` は呼び手 0（プロパティなので dead-check に見えない）。
- C［測った／grep］:
  - `sheet.js:1136-1147`・`1189-1192` が `backup.js` の `keep()` の世代回しと `bkName()` を説明（どちらも無い）。
  - `sheet.js:1250-1251`「PAID_FEATURES に `write` があり CAN に無い」→ `PAID_FEATURES.md:444,460-463` は
    今「用紙の門は `file`、`write` は別に無い」。
  - `cal.js:26-27`「単語の無い月は端末の名前」→ `numMonthHTML()`（`numbers.js:363-366`）と
    `CalendarWidget.swift:15` は**数字**を描く。
  - `numbers.js:376-378`「`calDayOf()` は 1970-01-04 から数える」→ `cal.js:84` は `getDay()+1`。
  - `CLAUDE.md` のレイアウト表 `sheet.js`「どれかを言う数字が印刷される」→ 印刷される数は頁の `n/N`
    だけ（`sheet.js:174`）〔r62〕。
- 問題が無かったもの: card/sheet/cal は押さずにサーバーにも storage にも書かない。`lexicon`・
  `morphology`・`model` は A に当たる物なし。品詞の対応は `shell.js` の `POS` 13 個を覆う。

### 2-5. `www/store.js`・課金・iOS アプリ 〔新／netPrefs 等は r60〕

- 0-3（unknown を free と読む）。
- **S1 プランがアカウントの無い所にまだ書かれていて、コメントは使っていると言う**［読んだ／grep］（B、C）。
  `MainViewController.swift:28,46` が毎起動 `LinguaPlanPlugin` を登録して `inject()` し、Keychain の
  プランと uid を `window.__plan/__planuid/__planok` に書く。`www/` で読む物は 0（コメントだけ、
  `core.js:1268`・`2097`）。偽のコメント: `LinguaPlan.swift` の頭「core.js はもうそこにあるのを見つける」
  「LinguaStore.swift が `set` で書く」、`MainViewController.swift:43-46`「最初の一枚で free が決まる」、
  `LinguaStore.swift:45-49`（消えた `planKeep` を名指し）。`docs/STATE.md:1157-1159`「プランは
  Keychain にある」〔リーダーの物〕。
- **S2 起動とサインインで、この Apple ID の領収を全部、押さずに送り、古い領収は最初に来た人の物になる**
  ［読んだ］（A）。`storeSync()` が `boot.js:91`・`net.js:742`（毎回のセッション到着）・`storeCurAsk()`
  から走り、`currentEntitlements` 全部と、消えない `held` を送る。verify-plan の `bindOf()`
  （`verify.mjs:259-265`）は `appAccountToken` の無い領収（2026-09-06 より前の購入）を**最初に確かめた
  アカウント**に結ぶ。**誰が買った物をどのアカウントに付けるかはオーナーの決定**。
  同じ形で `index.ts:93-96` の `got.ok ? json : []` が「読めなかった」と「まだ結ばれていない」を一つの
  枝にしていて、`merge-duplicates` が `purchase.uid` を書き換える（§ Data「空と壊れたは同じ枝にしない」）。
- **S3 verify-plan 以外にプランを書く所がある**［読んだ］（B）。`setPlan()`（`settings.js:1430`）は
  `storeOn()` が偽なら `planTook(id)` を直接呼び、`storeManage()`（`store.js:215`）も `setPlan('free')`。
  `vercel.json` が `www/` を公開しているので、web 版では誰でもカードを押せばメモリ上で Pro になる。
  `core.js:2049`「verify-plan だけが届く」は偽。
- **S4 通知**［読んだ］: `netDeviceDrop()` はサインアウトのボタン（`settings.js:1456`）からだけ。
  更新が拒まれた時の `netOut()`（`net.js:1003`）は (A, token) を残すので、同じ端末で B が入ると A の
  通知が B の端末に来続ける（§ NOTHING IS THE PHONE'S）。
- **S5 `device` の upsert は二回目から DB が拒む**［測った：実物の schema.sql に当てて］。
  `netDevicePut`（`net.js:1409`、`merge-duplicates`）に対し `device` に update policy が無い
  （`schema.sql:1807-1813`）。二回目で `new row violates row-level security policy (USING expression)
  for table "device"`。失敗の受け手 `function(){}` が飲むので何も壊れて見えないが、`net.js:1396-1400`
  「同じ組を出し直しても小さな書き込み一つ」は偽で、毎起動一つ拒まれる。
- C［grep］: `netPlanSync` は無いのに 4 か所（`PAID_FEATURES.md:59`、`core.js:2033`、`net.js:651`、
  `settings.js:1414`、最後は消えた `storeTook()` も）。`core.js:2290`「`plan` 表は前のプランを持たない」
  → `was` 列がある（`schema.sql:750`）。`words.js:131` が消えた `capLapse()` を指す。`STORE_CUR` は
  「この訪問で一度」と書いて起動に一度。`MainViewController.swift:29-31`「www はまだ LinguaStore に何も
  訊かない」→ store.js が訊く。`docs/apple.md:287` `plans` → 定数は `ids`、`:491`「署名の通らない取引は
  拒む」→ LinguaStore はわざと送る。CLAUDE.md のレイアウト表「apple.md は StoreKit のコードがまだ無いと
  言う」は偽〔r62〕。`net.js:838`「storeSync は pushAsk と同じ形」→ 違う。
- 問題が無かったもの: `push.js` はトークンも「もう訊いた」も持たず、スイッチは `SET_PREFS` 経由。
  `storeBuy` はサインイン無しを断り uid を `appAccountToken` で送る。LinguaStore.swift はプランを決めない。
  WidgetPoke.swift。

### 2-6. `www/mod.js` 〔新〕

- M1［読んだ］: `adminLoad`（`mod.js:340-341`）は `netStaffList` の失敗を `ADMINS=[]` と扱い、
  コメントが「わざと」と言う（§ Data「空と壊れたは同じ枝にしない」）。`adRecFind`/`adRecGo` はどんな
  失敗も `net.offline`。
- M2［測った］: 「どのスタッフ行が持ち主か」が二つ。サーバーは `handle = 'lingua'`（`is_admin()`、
  `staff_drop` `schema.sql:2829-2835`）、アプリは `profile.admin`（`net.js:3839` が select、
  `mod.js:474` `adminStaffRow` が `r.admin`）。schema は `profile.admin` を「もう誰も読まず書かない」
  （`:1122-1127`）と言い、新しい DB で @lingua は `admin=f`。→ @lingua の行に外すボタンが出て、押すと
  成功して何も変わらない。
- C: `fbkRow` のコメント「ボタン無し…`report_drop()` の双子は無い」→ 削除ボタンがあり
  `feedback_drop()` もある（`schema.sql:2460`）。
- それ以外の書き込みはすべて押した時、ダイアログは `popAsk`、端末だけの状態なし。

### 2-7. `supabase/schema.sql`・`supabase/functions/` 〔新〕

`npm run rls` を一回: `anon: 25 relations, 69 functions, 2 buckets -- all refused (1 allowed by name:
email_taken)`、`431 attempts … none of them got through`、`76 things … all present`。

- 0-4（`slice.no` を誰も比べない）。
- **SQ1 prefs は丸ごと置き換わる**［測った］〔r60 の A2 の server 側〕。`{"theme":"dark","push_like":false}`
  に古い全体の PATCH → `{"theme":"light","push_like":true}`。別の端末で切った通知が戻る。
- **SQ2 push-send は何度でも叩ける**［読んだ］（A）。`push-send/index.ts`・`push.mjs` の `pushMay()` は
  呼び手が行の actor か（`by === aim.from`）だけを見て、送った記録も重複除けも無い。B は自分の follow・
  返信・リアクションの行で何度でも A の端末を鳴らせる。rls-check も push-check も試していない。
- **SQ3 `staff_drop` と `staff_add` が合っていない**［測った］（B）。`staff_add` は両側 `lower()` で、
  当たらなければ例外。`staff_drop` は `where handle = h`。`staff_drop('AYA')` → OK で aya はスタッフの
  まま、`staff_drop('nobody-here')` も OK。`staff_add` のコメント自身が書いている不具合の形。
- **SQ4 関数ごとの grant/revoke 35 行が、足元の覆いを言い直している**［読んだ＋数えた］
  （§ COVERED「古い穴の栓は消す」）。`:348, :1718-19, :2266, :2336, :2359-60, :2394-95` ほか。
  `:3230-3232` がすでに全関数を public・anon から外して `authenticated` に与えている。
- **SQ5 storage が二度言われている**［読んだ＋最終状態を測った］（B、C）。`:1954` が `post-media` を
  `public = true` で作り `:1931` が `media_read using (bucket_id='post-media')`、`:3257` が全部を
  `public=false` にし `:3259` が `media_read` をもう一度定義。最終状態は両方 `public=f`、`media_read` =
  `is_member() AND …`。一つ目の定義と「読むのは公開…署名 URL は往復が一つ」のコメントは、直しの横に
  残った対抗馬。`docs/DATA_MODEL.md:295`「post-media は公開」も偽〔r62〕。
- SQ6［読んだ］: `admin_counts` は `is_admin()`、`admin_hist`/`admin_restore` は `is_staff()`
  （`:2565, :2598`）で、三つとも同じ `admin` 画面（`mod.js:434-452`）から呼ばれる。決定を見つけられ
  なかった — **決めない、印だけ**。
- SQ7［読んだ］: verify-plan は `plan` を読んでから守り無しで upsert するので、同時二回で `was` を
  取り違え得る。
- C［読んだ・一部測った］:
  - `:350-368`「スライスは十一」→ `SLICES` は十二（`gram2`）。`bkPack()` がファイルに書く（無い）。
  - `:226, 237-244`「端末にある物の個人的なバックアップ」「言語は最初の起動で匿名アカウントが作る」
    → ルール 22 と「匿名アカウントは無い」に反する。
  - anon・「誰でも」が読めると書くコメントが、足元の覆いの後も残る: `:1150-1153`（公開言語は
    アカウントの無い人も読める → 測って偽、anon は 25 関係すべて拒否）、`:337-343`（`language_took` の
    理由が anon の読み）、`:2104`「world-readable の表」、`:1564`「今は全部 world-readable」。
  - `is_member` のコメント（`:1082`・`:1091`）「十の policy がこれに立つ」→ 数えて 44。
  - `feed_weight` のコメント「数は決まっていない、オーナーに訊いていない」→ すぐ下の
    `feed_paid_weight()` は「決まった：4」。
  - `docs/FEATURES.md:103` の `slice_read` は r46 のとおり〔r62〕。
- 押さずに走るサーバーの書き込み（signup の @lingua フォロー、`slice_hist_keep`、push-send の 410 で
  `device` 削除、daily-prompt、`admin_restore`/`plan_staff_hold`）はどれもコメントにオーナーの決定か
  DELETE REVIEW がある。B が A の行を変えられる所は見つからなかった。

### 2-8. `www/index.html` の CSS 〔r61〕

`node tools/box-check.mjs`: `104 (baseline 104)`、`set from www/*.js: 0`、緑。

- **CS1 投稿欄の入力に継ぎ当てが三枚**［読んだ］（§ Simple・§ COVERED）。`index.html:1078`
  `.pwfield input, .pwfield textarea{font-size:1.2rem;line-height:1.5;padding:0;…}` が中の入力を全部
  上書き → `:1096` `.pwfield .lnin{padding:11px 2px}` が `.lnin` の padding を戻す → `:1109-1110`
  `.dir-ttb-*` が一枚目で消えた縦の padding を戻す（コメントがそう言う）→ `:1135` `.pwmn{…
  !important}` がコメント無しの `!important` で勝つ。覆うなら容れ物の一つの規則の書き直し。
- **CS2 プランの値段が宣言され、二度上書きされる**［読んだ］（B）。`.plterm .pp` が `:1979`・`:1992`・
  `:2032`、`.plterm .pper` が `:1981`・`:2033`。`:1983-1990` のコメント自身が「ただ上書きされて、
  どこも緑」と書いている。
- **CS3 二つ目のスタイルシート `<style id="ob-rework">`（`:3407-4016`）が、後に来ることで一つ目を
  上書きする**［読んだ］（B、角丸）。自分のコメント（`:3419-3425`）がすでに一度バグを起こしたと記録。
  `.ob .btn.ghost{border:1px solid …}`（`:3426`）は `.btn.ghost` の「字を四角で囲う」禁止そのもの —
  baseline（`box-baseline.txt:57`）に載っているので box-check は通す。**baseline にあるから良い、ではなく、
  baseline は「取り除けば進歩」の一覧**なので、印として出す。
- 同じ性質を二度書いている selector が 9［測った：一時スクリプト］: `.play:active` 二つ（`:1871`・`:1872`）、
  `.play` の display（`:496`・`:1869`）、`min-height:44px` の言い直し（`:3814`、既に `:1869`・`:3597`）、
  `.tabbar` の background（`:1271`・`:1281`）ほか。`@media`/dark をまとめて読んだので、動きを減らす
  上書きなど正しい物が混ざり得る。
- `tools/css-baseline.txt` の 3 つ（`kbghost`・`lift`・`moving`）: `lift`・`moving` はドラッグ中に
  `classList` で付く（`keyboard.js:3241`、`letters.js:310`）。**`kbghost` は `www/*.js` のどこにも無い**
  ［grep］— `:2475` の規則は何も飾っていない。
- C［測った：一時スクリプト］: `:815-823` が「下の `.pkid .post::after`」を指す（`.pkid` の規則も
  クラスも無い、次のコメント `:829-848` は今は `.prail` と言う）。クラスが無くなったと言うためだけの
  コメント: `.wsay`（`:1805`）、`.abtn/.abtnums`（`:2304`）、`.gdemo/.gsi/…`（`:3803`）。「went with / is
  gone / was here」の言い回しの行が 15（`CLAUDE.md`「歴史とかいいから消せよ」）。

### 2-9. `localStorage` のキー（`store-check` の一覧から）〔r60〕

`node tools/store-check.mjs`: `9 this handset's setup, 14 an account's`、`14 keys — 3 with a road to
the server, 11 the phone's own`、`lingua.set: 23 fields — 12 with a road, 11 the phone's own`。

- **L1 別のアカウントを消した端末でサインインすると、その人の設定が戻らない**［測った：実物の
  `setFor`/`setAcctKeys` を切り出して］（§ NOTHING IS THE PHONE'S）。`setFor`（`core.js:2187-2217`）は
  預けてある `lingua.set.<uid>` を `if(was)` の中でしか読まない。アカウント削除（`settings.js:888`）は
  `setFor('')` の後に `delete SET.acct` するので `SET.acct` が `''`。`setFor('')` → `{"acct":""}`（テーマも
  消えた）、`setFor('B')` → `{"acct":"B"}`、B の預け `{"theme":"light","ui":"ja","saved":["kotoba"],
  "notAt":99,"push_like":false}` はディスクに残って読まれない。`notAt` は上がる道が無いので、上から
  預け直された時に失われる［読んだ］。コメント「誰も書かれていない：ここにあるのはこの人の物」が
  その振る舞いを言っている。
- **L2 `netPrefsPull()` はサインインで走らない**［読んだ］。呼び手は `boot.js:153`（起動）だけ。
  `core.js:2110`・`net.js:1331`「サインインで戻す」は偽。→ 二台目でサインインして、次の起動の前に
  何か一つ設定を押すと、`netPrefsPut` の全体 PATCH がこの端末の値で上書きする（A2・SQ1 と同じ面）。
  さらに `netPrefsPut` は**この端末に定義がある項目だけ**を詰めるので、無い項目（例 `push_like`）は
  サーバーから消える。
- **L3 `lingua.posts`・`lingua.drafts` に持ち主の印が無い**［読んだ］。`POSTS_UID` はメモリだけ
  （`post.js:83`）なので、読み込みのたび `postFor()` は `had=''` で、ディスクの物を入ってきた人の物に
  する（`post.js:96`）。`lingua.me` は `ME.uid`、`lingua.set` は `acct` を持つのに、この二つは持たない。
  `netOut` が同期で空にするから今は無事なだけ。
- **L4 `lingua.langs`・`lingua.cur` は端末の全アカウントで一つのキー**［読んだ］。`home.js:2677` が
  「索引は端末の物でサインアウトを越える」と言い切る — § NOTHING IS THE PHONE'S の「そういう分類は
  無い」に反する〔r61：home.js〕。`store-check` はそれを通している（`LS_LANGS` の行）。
- **L5 `SET_PHONE` の説明が今と違う**［grep］（C）。`core.js:2159` は `['acct','walked','obback','vvkb',
  'wldMoved','order','read','voice','script']`。テーマと ui は `SET_PREFS`（`core.js:2130`）、`planUid` は
  無い。なのに `CLAUDE.md` ルール 22「SET_PHONE はテーマ、画面の言語、…planUid」〔r62〕、
  `tools/store-check.mjs:120` の理由文「テーマ、画面の言語」、`settings.js:880-883`「テーマと画面の言語は
  この端末の設定なので残る」（L1 の測定で `setFor('')` はテーマを消した）。
  さらに `settings.js:889-890` は `setFor('')` の直後に `acct/saved/savedUp/notAt` を**名前で**消す —
  数える一覧の横の手書きの一覧で、`recent` が漏れている（§ COVERED）〔r61：settings.js〕。

---

## 3. 面ごとのまとめ（直す人へ — 穴ではなく面）

穴を並べると上のとおり多いが、面は少ない。**同じ面の穴を一つずつ塞がないこと。**

1. **「写しを LSL に書き写すと、この端末の物になって上がる」** — 0-1・0-2・K2・A3。覆う一文の候補:
   「`.got` から来た物は LSL に入らない」ではなく、`save()` が設定と言語の二つをやめること（設定の保存は
   言語を書かない）、と、移行・`langSaveAll` が**サーバーの答えの上で**しか書かないこと。検査は
   「押していない起動で `/rest/v1/slice` への書き込みが 0」を**要求を数えて**持つ。〔r60〕
2. **「丸ごと送る・後勝ち」** — A2・SQ1・L2・0-4・下書き（A6）・アイコン（A1）。サーバー側に比べる物が無い
   （`slice.no`、prefs、draft）。どこまでを server で守るかは**オーナーの決定**（衝突の解き方）。〔r60／新：schema〕
3. **「まだ訊いていないを free と読む」** — 0-3（`wordCap`、`noads`、`plHave`）。`can()`/`has()` 一か所の問い。〔新〕
4. **「アカウントの無い置き場」** — K5（App Group）、S1（Keychain のプラン）、S4（device 行）、L3・L4、R3。〔新／r60〕
5. **「一つの事に二つの答え」** — CD1〜CD4（カード対 投稿の一行）、K3（修理の範囲）、M2・SQ3（持ち主の行）、
   SQ4・SQ5（schema の言い直し）、CS1〜CS3（CSS）、S3（プランの書き手）、G2。
6. **「書いてある事が違う」** — 各節の C。docs 側は〔r62〕、コード内コメントはそのファイルの持ち主。

## 4. 決めないもの（オーナーへ回す）

- 非公開の投稿（`pv`）は端末だけか、サーバーか（A5 の別件）。
- `appAccountToken` の無い古い領収をどのアカウントに付けるか（S2）。
- 二台で同時に編集した時の解き方（面 2）— `CLAUDE.md` § Deciding「衝突の解き方は決めない」。
- `admin_counts` と `admin_hist` の門の違いが意図か（SQ6）。
- `pv`・`migrateSnd` の `delete SET.snd` のような「読んだ物を消す」移行を戻すかどうか。

## 5. 見ていないもの

- `keyboard.js` 1000-2000・2400-3500（運ぶ・`kbCellPut`・揃え・結合の拒否）— ルール 19 の仕組みは
  `kb-check` を信じた。`share.js` の変換表（ルール 10、`conv-check` は回していない）。`Compose.swift`・
  `CandidateBar.swift`・`GlyphView.swift` の中。
- `translate.js` ~140-780、`sheet.js` の読み取りと PDF の中、カードの配置の計算。
- `LinguaAds.swift` の大半、`LinguaShare` の声・写真・pdf・用紙、`LinguaPdf.swift`、ウィジェットの Swift の中。
- `notices()` の本体、`post_seen`・`profile_seen`・`follow_seen` の中身（ブロックの扱い）、`publication`・
  `quote`・`promo` の policy 以外、`verify.mjs` の署名の鎖、`supabase/setup.md` の頭より後。push-send が
  JWT 検証つきで配置されているか（repo に `config.toml` が無い）。
- CSS の `@media`・dark の重複（まとめて読んだので正しい上書きが混ざる）、行ごとの font-size（`press` は
  回していない）。
- `lingua.take.<uid>`・`recent`・`saved` の一度きりの受け渡し以後。`me.js` の handle・name の書き込み。
- 0-2 の `v<2` のキーボード行がサーバーに実在するか、0-1 が本物の回線で勝つか。
- **端末では何も。本物の Supabase・PostgREST では何も**（ON CONFLICT で `merge-duplicates` の代わりにした）。
