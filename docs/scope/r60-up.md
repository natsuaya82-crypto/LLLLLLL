# r60-up — 端末の写しはサーバーへ上がらない（r46-audit § A・§ B3・§ C の backup.js）

指示: `docs/scope/brief-r60-up.md`（`claude/leader-briefs`）。土台は `integ-0905`。

**覆う一文**: サーバーが聞くのは、人が今つくった・押したもの、そのものだけ。起動・サインイン・
他の答えの後ろで、端末の写しが勝手に上がる道は無い。上がるのは変わった所だけ。
例外は扉（`netTook()`）── 歩きで作ったもの、と扉が作った言語の行。

**それを守る検査**: `tools/quiet-check.mjs`（`npm run quiet`、SLOW に登録）。
`XMLHttpRequest` そのものを偽にするので、`netSend1`・`netUp`・`netMedia` の三つの窓全部と、
明日足される窓が数えられる。何が「書き込み」かは `supabase/schema.sql` の
`stable`/`immutable` が答える（読むだけの rpc は 13、書く rpc は 19 ── 実行のたびに出す）。

---

## 面 ── サーバーへ書く関数（www/net.js、52 本）

「人の押下」= 画面のボタン・入力から来る。「それ以外」= 起動・扉・答えの後ろ。

| 関数 | 書く所 | 何から走るか | 今回 |
|---|---|---|---|
| `netSlicePut` | slice | 人の保存（`netSaveUpGo`、`bkTouch`/`netSaveNow`）／扉（`netLangSync`）／~~起動（`netLangSync`）~~ | 起動の道を消した。上り道は人が書いて動いた slice だけ |
| `netLangRow` | language POST | 人の保存・「言語を追加」／扉 | 扉が作った言語の行を扉で作る一行を足した |
| `netLangNamePut` | language.name | **起動の答えの後ろ**（`netLangsWalk`、列が空なら slice の名前を写す） | B3 ── 止めた、下 |
| `netProfPut` | profile | 人の保存（名前・@・自己紹介）、**写真を選ぶ・外す（今回から）** | A1 |
| ~~`netAvSync`~~ | profile.av | ~~起動~~ | **消した**（A1） |
| `netPrefsPut` | profile.prefs | 人の押下（設定・文字の保存・オンボーディング・通知） | A2 ── 止めた、下 |
| `netPush` | post | 人の押下（`pwSendPost`）／~~`postCatchUp`（タイムラインの答えの後ろ）~~ | A5 |
| `netDraftUp` | draft | 人の押下（取っておく）／~~`draftsPull`（答えの後ろ）~~ | A6 |
| `netSearchSave` | saved_search | 人の押下（☆）／**`askSaved` の引き渡し（答えの後ろ、一度だけ）** | 止めた、下 |
| `netDropAgain` | storage DELETE | **タイムラインの答えの後ろ**（人が消した投稿のファイルの消し直し） | 止めた、下 |
| `netDevicePut` | device | **セッションが着くたび**（`push.js`、Apple の宛先） | 止めた、下 |
| `netPlanVerify` | functions/verify-plan | 起動と扉（OWNER 2026-09-11「段は起動とサインインで訊く」） | 決まっている。検査は `jws` しか運ばないことを確かめる |
| `netEndMe` | rpc/account_delete | 人の押下／**起動**（押したのに終わらなかった削除、OWNER 2026-09-03） | 決まっている |
| `netResume`・`netSignIn`・`netMailOtp`・`netVerify`・`netRecover*`・`netSetPass`・`netIdToken`・`netMailTaken` | /auth/v1・email_taken | 扉 | 扉（`netDoor`） |
| 残りの 30 本（react・follow・block・report・feedback・post の削除・言語の公開・字の書き方・取る/外す・履歴・運営の rpc・…） | | 人の押下だけ | 変えていない |

---

## 測ったこと（直す前、`quiet-check` と scratchpad の probe）

- 端末の写しがサーバーと食い違う状態で起こし、何も押さずに待つ → **書き込み 7 本**:
  `POST post`（未送信の投稿）、`PATCH profile {av}`、`PATCH/POST draft`、
  `POST slice` words ×2（L-1 の写し、L-2 の旧版ディスク）・letters。
- 起動後の画面の辞書は `ka,mi,zo` ── サーバーで消された `zo` が写しから戻った。
  サーバーの `words` にも `zo` が戻っていた。
- 呼び出し元を記録して分けた: slice は起動の `netLangSync1`、`profile.av` は
  `netAvSync<bootSession`。`zo` が戻った道は二つ ── 保存した検索の答え（`snsSavedPush`）が
  設定のために言語の `save()` を呼び、まだ写しの `WORDS` を端末の持ち物にした。持ち主の答えは
  slice より一往復早く来るので、書いてよいかの門は既に開いていた。もう一つは段の答え
  （`planTook`）の `ltStart` が写しの `LETTERS` に枠を足した。

## 直したこと

### A3・A4 言語
- `www/boot.js`: 起動の `bkTouch()` と `pullWait('mylangs', netLangSync)` を消した。
- `www/core.js` `langLocked()`: 書いてよいかは、この起動でサーバーが言った持ち主（`LOWN`）
  だけで答える。写しの持ち主（`langOwnOf` の `slRd` 落ち）では答えない。
- `www/net.js` `netLangsWalk()`: 持ち主の答え（`langOwnGot`）は slice が届き、開いている言語を
  読み込んだ後に書く。これで「サーバーが持ち主を言った」＝「画面はサーバーの中身」が一つの事実。
- `www/core.js` `slWr()`・`slAsApp()`（`LTOUCH`）: 答えの最中に書かれた slice は人のものでは
  ない。`netSend1` の答えを渡す一か所が `slAsApp` を通す。上り道（`netSaveUpGo`）は
  人が書いて動いた slice だけを送る。印は両側が一致した時（`netAgreed`）に外れる。
- `www/net.js` `netSaveUpGo()`: 答えの来ていない言語で保存を押すと「接続できません」
  （前は線を訊いて「保存しました」と言えた ── 何も保存していないのに）。
- `www/net.js` `netTook()`: 扉が作った言語（サーバーに一本も無いアカウント）の行を扉で作る。
  起動で作った言語は何も送らず、最初の保存で行ができる（2026-09-15 の名前の無い行を作らない）。
- `www/sns.js`: 設定だけの保存 8 か所を `setKeep()` に（言語の `save()` を呼ばない）。
- `www/backup.js`（§ C）: 頭の注記「boot.js が呼ぶ時は netSaveUp() より script タグ三つ前」は
  間違いだった（r46 の読みどおり）。`typeof` の守りごと一文に書き直した。

赤を見た: `langLocked` を写しで答える元の一行に戻すと `slice words` が上がり `zo` が戻る。
`LTOUCH` の問いを外すと起動で `slice letters`（枠足し）が上がる。

### A1 アイコン
- `www/me.js` `meFacePut()`: 写真を選ぶ・外すの二つの押下は `av` を PATCH し、届いてから
  顔が変わる（`meProfPut` と同じ形）。`meAvGot()` が ME に顔を伝える一か所。
- `www/net.js`: `netAvSync` を消した。`netProfSync` は起動で `av` も読む（送らない）。
  `netMyProfile` も `meAvGot`。`ME.avSent` を消した（CHANGELOG に DELETE REVIEW）。
- 検査: `post-check` の「顔」の節を今の道の形に書き直した。`store-check` の `lingua.me` の道を
  `netProfPut` に。

### A5・A6 投稿と下書き
- `www/post.js`: `postCatchUp()` を消した。未送信の投稿は端末に残り「未送信」と出る。送るのは
  押した時（送信と［再接続］）。OWNER 2026-09-05「なら失敗して残るにするべき」。
  **送り直すボタンは無い**（投稿を送った時のポップの［再接続］を閉じた後は、その投稿を送る道が
  画面に無い）。消えはしないが送れない ── ボタンを作るかは画面の話でオーナーのもの。
- `www/sns.js`: タイムラインの答えの後ろで走るのは `netDropAgain()` だけ（下、止めたもの）。
- `www/post.js` `draftsPull()`: 一度も上がっていない下書きは一覧に残し、送らない。開いて
  「取っておく」を押せば上がる。
- 検査: post-check 15・16（二つ目の道は「もう一度押す」）、find-check、draft-check 3 を今の形に。

---

## 止めたもの（決めるのはオーナー／持ち主でないファイル）

### A2 設定を一項目だけ送る ── **schema.sql が要る**
`profile.prefs` は jsonb 一列で、PostgREST の PATCH は列ごと置き換える。一項目だけ送るには
サーバー側で足し合わせる rpc（例: `update profile set prefs = prefs || $1 where id = auth.uid()`）
が要る。`supabase/schema.sql` は私の持ち物ではない。呼び出し元（glyph・home・onboard・
settings・keyboard）も r61 と他の人のファイル。**今のコード**: 押した人の端末の設定を全部
送る。端末 A で変えた項目が、端末 B で別の項目を押した時に B の古い値で上書きされる。
検査は「not held」と毎回出す。

### 保存した検索の引き渡し（`askSaved` → `snsSavedPush`）── 書かれた決定が二つ食い違う
`saved_search` の表より前から端末にあった ☆ を、最初の答えの後に一度だけ送る道。
その上に書かれた言葉は「制作はオフラインでも可能次つながった時に更新される」で、2026-09-04 の
「オンラインのみ」・ルール 22 と食い違う。止めると、その ☆ は端末だけに残る（送らない）か、
サーバーの答えで消える（人が作ったものを消す）かのどちらかで、どちらも決め事。

### `netDropAgain`（人が消した投稿のファイルの消し直し）── 削除
人が押した削除のうち、バケツが断ったファイルを次のタイムラインの答えの後に消し直す。人の押下
の続きだが、押した「その時」ではない。止めると、消したはずの写真が公開のバケツに残る。

### `netDevicePut`（Apple の宛先）
セッションが着くたびに送る。端末の写しではなく Apple が出した宛先で、変わった時に届かないと
通知が届かない。覆う一文の例外に入れるかはオーナー。

### B3 言語の名前がサーバーに二つ ── **schema.sql が要る**
測った: 列（`language.name`）が空で `lang` slice に名前がある言語で起動すると、
`PATCH /rest/v1/language` が一本出る（`netLangsWalk` → `netLangNamePut`、サーバーの slice の
名前をサーバーの列へ）。写しが勝つ話ではないが、起動の書き込みで、覆う一文に反する。
置き場はサーバーの一回きりの移し:

```sql
update language l set name = s.body
  from slice s
 where s.language = l.id and s.kind = 'lang'
   and coalesce(l.name, '') = '' and coalesce(s.body, '') <> '';
```

これが入れば端末の道（`netLangsWalk` の `netLangNamePut` の一段落）は消せる。先に消すと、
その SQL までの間、他の人から見たその言語の名前が空になる。`lang` slice そのものは消さない
（人が書いたもの、移しは写して消さない）。`supabase/schema.sql` は私の持ち物ではない。
**今のコード**: そのまま。quiet-check の「持たないもの」に書いた。

### 旧版がディスクに残した `lingua.<id>.<slice>`
`slMine()` はこれを「この端末が持つもの」として読み、`netLangsWalk` はそれを持っている言語の
その slice をサーバーの答えで埋めない。**起動で送る道は消えた**が、その言語を開くと画面は
旧版の中身で、人が保存するとそれがサーバーの中身と足し合わされて上がる ── 別の端末で消した語が
戻る道は、起動から「その言語での最初の保存」に移っただけで残る。いつ読むのをやめるか／サーバー
の答えを勝たせるかは、衝突の解き方でオーナーのもの（`docs/BACKLOG.md` に既にある）。

### A3 の `syMerge`（二台が同じ言語を編集した時にどちらを残すか）
r46 は CLAUDE.md ルール 22 の「syMerge は今も木に立っている（読めない写しを空として読む）」を
引いていたが、**コードは 2026-09-05 に直っている**（`sySide` の `wreck`）。CLAUDE.md のその文が
古い。CLAUDE.md は私の持ち物ではない。二台の編集をどちらが勝つかの形そのもの（足し合わせ、
消したものは `was` と比べる）は変えていない。

### その他の見つけたこと
- `acct-check` 60 は取り込む前の土台（integ-0905 ecf88d0f）でも赤だった（私の変更と無関係、
  測った）。c2aff7b1 を取り込んだ木では緑。
- 押下の中で起きる派生の変更は、その押下に乗って上がる: 人が言語を切り替えると `langOpen` →
  `langSaveAll` が id の無い古い板に id を振り（`kbIded`）、`kb` の slice が一度上がる（r63-audit
  0-2）。答えの中ではないので「人の書き込み」と数えている。一度きりで、写しが勝つ話ではない。
- r63-audit L2（`netPrefsPull()` がサインインで走らない）は A2 と同じ面で、この指示には無い。
- `www/settings.js` 868 行の `avSent:''` ── r61 のファイル。害は無い（`meFrom` が読み捨てる）
  が、もう無い欄の名前。
- 画面の編集ボタンの多く（words・notes・keyboard・phases・sound・home）は `langLocked()` で
  出し分けているので、サーバーの答えが来る前（写しが出ている間）は編集ボタンが出ない ── 同じ一つの
  門で閉じる。答えが来ると出る。

### 持っていないファイルで、今回の変更で嘘になった文
- `CLAUDE.md` ルール 6「`netLangSync()` is still the launch, and it is the same road」── 起動では
  走らない。ルール 11「netLangsDown() at the foot of www/boot.js」は正しい。ルール 22 の
  「`syMerge()` … is that bug standing in the tree today」── 2026-09-05 に直っている。
- `docs/STATE.md` 987・1660 行（`postCatchUp`、`netLangSync()` sends）── リーダーのファイル。
- `docs/BACKLOG.md` 1683・1692 行（`netAvSync`・`ME.avSent`）、`docs/FEATURES.md` 97 行
  （`postCatchUp`）、`docs/RECOVERY.md` 69 行（`netAvSync`）、`docs/RISK.md` 257〜410 行
  （`postCatchUp`）── r62 の § C の面。

---

## 二回目（リーダーの追加 2026-09-23 16:19 ── r63-audit の〔r60〕、r61-face の 1・2・4）

覆う一文は同じで、検査も同じ一本（`tools/quiet-check.mjs`）に足した。今の主張は七つ:
1. 何も押さない起動は書かない 2. サーバーは起動の前後で同じ、画面の写真と辞書はサーバーの物
3. 一語足すと words だけ 4. 別の言語を開いても何も送らない 5. サインインして何も押さなければ
書かない、プロフィールと預けた設定はその人の物になる 6. 設定を一つ変えると一つだけ
7. ディスクの写しは書いた人の名前で預けられる。どれもバグを戻して赤を見た。

### 直したこと
- **0-1・0-2・B3**: `slWr` の「人が書いた」印は値が変わった時だけ。`langOpen` の書き出し・移行と
  起動の移行は `slAsApp`（アプリ自身の書き込み）。扉の `netLangSync1` も人が書いた slice だけ ──
  旧版ディスクの `lang` は上がらない。`save()` は言語が書けない時も設定を残す。
- **A1 漏れ 1〜3・r61 の 1**: `meProfGot()`（me.js）がサーバーのプロフィール（`PROF_MINE` と `av`）を
  ME に置く一か所。`netMyProfile`（扉）と `netProfSync`（起動）が通し、`obIn` の一行を消した。
- **A5 漏れ**: 投稿はサーバーが先（届いてから端末・下書きを消す・欄を空に。届かなければ欄に残る）。
  削除はファイルが断られたら起きない（`netDropAgain` 一式を消した）。
- **A6**: `draftsPull` は両方にある下書きをサーバーの答えにする。
- **L1・r61 の 2**: `setFor` は入ってくる人の預けを、前の印が無くても読む。`lsWipeAcct` は印の無い
  設定も消されるアカウントの物として数える。settings.js の手の一覧二行を消した（`recent` が漏れて
  いた）。
- **SQ1・L2（A2）**: `prefs_put(p jsonb)`（schema.sql、重ねる）と、`netPrefsPut` は合意の形から
  変わった項目だけ。`netPrefsPull` は扉でも走る。rls-check に二行。
- **R1・R2**: 声の長さが載る。読めない声は「この声は見つかりません」で送らない。
- **L3**: `POSTS_UID` はディスクの印（`ACCT_DISK`）から始まる。

### 止めたこと
- **K1（キーボードの編集が保存を押さずに上がり、「いいえ」で戻らない）**: キーボードだけの形ではなく、
  保存ボタンを持つ 9 画面の共通の仕組み（shell.js の `KEEP`）の形。覆う一文は「保存ボタンのある
  画面で書いたものは、保存を押すまで下書き。『いいえ』で開いた時の形に戻る」で、置き場は shell.js の
  `keepOn`（開いた時に `keepSnap()`）と `keepAsked` の「いいえ」（`keepBack` で戻す）、それと
  `netSaveUp` がその画面に居る間は走らないこと。shell.js は持ち物ではない。keyboard.js だけで
  塞ぐのは穴埋めなので、手を付けていない。K2 は言語の門と `slAsApp` で閉じた。
- **S4（`netOut` が device の行を残す）・S5（device の upsert が二回目から拒まれる）**: 覆う形は
  「その端末の宛先は、今サインインしている一人の物」── 置き場は schema の device の部分
  （宛先を受け取ったら他の人の行を消す口、update の policy）。今回持ってよいのは prefs の部分だけ。
  あわせて `netDevicePut` はセッションが着くたびに送る（覆う一文の例外に入れるかはオーナー）。
- **askSaved（r61 の 4）**: 前回と同じ理由で止めた ── 保存した検索の表より前から端末にあった ☆ を
  一度だけ渡す道。止めると ☆ は端末だけに残るか消えるかで、書かれた決定が二つ食い違う
  （「次つながった時に更新される」とルール 22）。
- **非公開の投稿（`pv`）**: 端末だけのまま（指示の「決めないもの」）。
- **二台で同時に編集した時の解き方**（`slice.no`・prefs・下書き）: 変えていない。下書きは
  「取っておく」がサーバー先なので、端末の写しに未送信の本文は無い ── `draftsPull` をサーバーの答えに
  したのはルール 22（写しは勝たない）で、同時編集の解き方（サーバーで後勝ち）は触っていない。
