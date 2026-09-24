# r46 — ルール違反の洗い出し（2026-09-23）

宣伝 session（`claude/r46-reddit`）が、オーナーの指示で書いた。

- **読んだのは `origin/integ-0905` 46280fcb**（166 で出す分。字間・一行の一本化・ガイド線が
  入っている）。master a451c515 も見たが、行番号は全部 integ-0905 のもの。
- コードは一行も変えていない。どれもコードを読んで見つけたもので、実機でも本番のデータでも
  測っていない。

## オーナーの指示（2026-09-23、寝る前）

- 報告はルール違反の箇所として出す。
- リーダーはルールに則って直す。直書きの禁止。直し方の徹底。
- バグが起きないように一つの穴を塞ぐ、スパゲティコード式の修正は今後一切禁止。
  直す時はそのコードを消して書き直す（`CLAUDE.md` § Simple）。
- この一覧以外にも無いか、二重に確認する。
- 終わったら、ルール準拠の修正。
- 全部のリファクタリングが終わったら、ビルドを出す手前で止める。
- 明日オーナーがやることリストは、オーナーが終わらせる。

きっかけ：Reddit のユーザーから、アイコンを変えたのに戻ったという話が出た。
調べると、アイコンを決める仕組みが 8/22 に書かれたまま、9/3（書き換えの規則）と
9/4（全部サーバーが持つ）の後も洗い直されていなかった。**規則が変わった時に、
それに反する既存のコードを洗い出す手順が無い**のが根本。以下はその洗い出し。

---

## A. 端末の写しがサーバーに勝つ（`CLAUDE.md` § Online、ルール 22）

「写しは読むだけで、サーバーへ戻らない」「戻れる写しは勝てる写し」に反するもの。

### A1. アイコン

- 変えた時にサーバーへ送っていない。`mePicKeep()`（`www/me.js` 520行、532行で `ME.pic`）も
  `meDropPic()`（602行）も端末に書いて `saveMe()` するだけ。
- 送るのは次の起動の `netAvSync()`（`www/boot.js` 145行 → `www/net.js` 1432行）。
  サーバーの今のアイコンを聞かずに、端末の顔と「前に送ったもの」（端末の中）だけ比べて
  PATCH する。
- `netMyProfile()`（`www/net.js` 1119行）はサーバーから `ME.av` を読むが（1136行）、
  `ME.pic` は読まない。`postAvatar()`（`www/post.js` 2258行）は `ME.pic` を先に見る。
- 起きること：
  - 変えても、変えた人が次に起動するまで他の人には古いアイコンが見える。
  - 別の端末・入れ直した端末は古い写真か、最初の文字から作った顔を持っていて、
    起動した瞬間にそれを送る。新しいアイコンが上書きされる。
  - 片方の端末で消した写真が、もう片方の起動で戻ってくる。
- 正しい形の見本は同じプロフィールの中にある：名前・@・自己紹介は `meProfPut()`
  （`www/me.js` 419行）が変わった所だけをサーバーへ送り、届いてから端末に置く。
  起動時は `netProfSync()`（`www/net.js` 1287行）が読むだけ。アイコンだけこの形から外れている。
- 注意：昔の投稿は書いた時の顔を持っている（`post.av`、過去のデータの規則どおり）。
  古い投稿に古い顔が出るのは仕様で、この件とは別。
- 歴史：`netAvSync()` は 2026-08-22 の `39e3a611`。

### A2. 設定（`profile.prefs`）

- `netPrefsPut()`（`www/net.js` 1369行）は、変わった一つではなく**端末にある設定を全部**
  まとめて PATCH する。
- 呼ぶ所は設定の画面だけでなく、文字を保存した時（`geKeep()`、`www/glyph.js` 1650行）、
  オンボーディング、`home.js` 422行、`push.js` にもある。
- 起きること：端末 A で変えた設定が、端末 B で別の何かをした時に B の古い設定で上書きされる。
  起動時の `netPrefsPull()`（1343行）と競走する。
- r47 で prefs が初めて本当にサーバーへ届くようになり（`597d3851`）、通知の設定
  （`prefs.push_*`）も同じ一つの列に入ったので、上書きされる物が増えている。

### A3. 言語のマージ（`syMerge()`）

- `CLAUDE.md` ルール 22 が自分で「その bug が今も木に立っている」と書いている
  （読めない写しを空として読み、サーバーの正しい行を上書きする）。integ-0905 でも残っている。
- 通り道：`netSlice1()`（`www/net.js` 2765行）が毎回 `syMerge()` を通して端末と
  サーバーを足し合わせ、違えば PUT する。
- 走る時：起動のたび（`www/boot.js` 136行 `pullWait('mylangs', netLangSync)`）、
  サインインの時（`netTook()`、597行、は**送ってから**読む）、保存のたび（`netSaveUp()`、2836行）。

### A4. 起動時の保存

- `www/boot.js` 19行 `bkTouch()` のコメントは「何も変わっていなくても、今ここにある言語を
  送る」と書いている。
- 続く 12 個の `migrate*()`（22〜36行）が全部、起動した瞬間、サーバーの答えが来る前に
  保存を呼ぶ（`save()`・`saveLetters()`・`savePosts()`・`saveKb()`・`saveWld()`・
  `saveSnd()`）。保存は `bkTouch()` → `netSaveUp()` を通るので、端末の状態がサーバーへ
  行く道になっている。
- `www/backup.js` の頭のコメント（44行の周り）「boot.js が呼ぶ時は netSaveUp() より
  script タグ三つ前」は間違い。`www/index.html` の順は net.js（4106行）→ backup.js
  （4138行）→ boot.js（4143行）で、起動時には有る。

### A5. 投稿の「後で送る」

- `postCatchUp()`（`www/post.js` 1337行、`www/sns.js` 636行から）は、端末に保存して
  まだサーバーに id の無い投稿を、次にタイムラインの答えが来た時に黙って送る。
- 2026-09-05 のオーナーの決定「保存するタイミングでエラーが起きるなら、保存されない」
  「なら失敗して残るにするべき」と食い違う。送る道が二つ（押した時と、後で黙って）ある。
- `docs/FEATURES.md` 72行も「オフラインで動き、次の接続で上がる」と書いていて、
  § Online（オンラインのみ）と食い違う。どちらが今の仕様かはオーナーの決定。

### A6. 下書き

- 「取っておく」の道は、サーバーに届いてから端末に置く形に書き直されている
  （`www/post.js` 559行のコメント「lingua.drafts は戻ってはいけない写し」）。
- ところが同じファイルの同期の道（703行）は、サーバーに無い端末の下書きを
  `netDraftUp()` で送る。同じファイルの中で逆のことをしている。

---

## B. 一つの事を二つ以上の仕組みでやっている（`CLAUDE.md` § Simple）

### B1. 自作文字で文を出す仕組み

- 投稿の一行は r53 で一本化されている（integ-0905：`#pw-ln` と `.pline` が同じ
  `--face-type` と `pre-wrap`、`www/index.html` 862行。`postRuns()`、`www/post.js` 3579行）。
- それ以外の画面には、要素全体にフォントを掛ける `.sfont` / `myFontOn()` と、描いた所だけ
  span にする `sfontHTML()`（`www/glyph.js` 640行、grammar・numbers・wordsheet が使う）が
  残っている。同じ「自作文字で文を出す」が今も三通りあるかは、確認が要る。

### B2. `SET.myfont` を決める所が三つ

- 設定のスイッチ（`setMyFont()`、`www/glyph.js` 646行）。
- 文字を一つ保存するたびに強制でオン（`geKeep()`、1649行）。本人がオフにしていても戻り、
  そのまま A2 の道でサーバーへ行く。
- オンボーディング（`www/onboard.js` 1934行）。

### B3. 言語の名前がサーバーに二つ

- `lang` スライスと `language.name` の列。`www/net.js` 2306行の周りのコメントが
  「名前はサーバーに二重にある」「食い違いは衝突でオーナーの決定」と書き、
  `docs/BACKLOG.md` に積んだまま。

### B4. 同じ項目を複数のファイルが書いている（決める所が一つか確認が要る）

- `SET.showScript`：`home.js` 422、`onboard.js` 1946
- `SET.ui`：`onboard.js` 714、`settings.js` 580
- `SET.walked`：`core.js` 1308、`onboard.js` 1006・1978、`settings.js` 909
- `ME.av`：`me.js` 115、`net.js` 1136（A1 と同じ話）
- `ME.handle` / `ME.name`：`me.js` 343・344、`onboard.js` 950・1553

---

## C. 書いてある事が今と違う（`CLAUDE.md`「規則を変えたら同じ commit で直す」）

- `docs/FEATURES.md` 58・59行：Documents への保存と復元が「shipped」。2026-09-04 に消えた。
- `docs/FEATURES.md` 72行：A5 のとおり。
- `docs/FEATURES.md` 103行：「辞書は誰にも取れない、`slice_read` が `words` を断る」。
  今の `supabase/schema.sql` の `slice_read` は、持ち主のスイッチがあれば `words`・
  `phases`・`gram2` を開く。同じ行の `bkPush` も、端末のキー `lingua.<id>.<slice>` も今は無い。
- `www/backup.js` 頭のコメント：A4 のとおり。
- docs（CHANGELOG と scope を除く）に、コードにもう無い関数の名前が 76 個ある。
  下の表。Swift と DOM の名前は外してある。消えた事の説明として名前を出しているだけの所も
  混ざっているので、一つずつ見る必要がある。

---

## 探し方（二重確認に使うこと）

見たもの：

1. `www/net.js` でサーバーに書く関数を全部（`netPost` と `netSend` の PATCH・POST・
   DELETE）。そのうち、人が押していないのに走るもの（起動時・サインイン時・他の答えの後）と、
   端末の写しを丸ごと送るもの。
2. `www/boot.js` と `netTook()` が呼ぶもの全部。
3. `SET.x =` と `ME.x =` を、コメントを除いて全ファイルから集め、二つ以上のファイルが
   書いている項目。
4. docs に書かれた `名前()` のうち、`www/` のどこにも定義されていないもの（付録の表を
   作ったスクリプトは `docs/scope/r46-audit.md` の末尾）。

見ていないもの（二重確認で必ず見ること）：

- `www/grammar-engine/`、`www/keyboard.js` の中身、`www/card.js`、`www/sheet.js`、
  `www/sync.js` の中身（`syMerge` 以外）、`www/push.js`。
- `ios/` の Swift（キーボード拡張・ウィジェット・課金）。
- `supabase/schema.sql` の policy と RPC。
- CSS（`www/index.html`）。
- `localStorage` に書くキーのうち、A と同じく後でサーバーへ送られるもの（`store-check`
  の一覧から、送る道のあるものを一つずつ）。

---

## 付録 1：docs にあってコードに無い関数名（76）

| 名前 | 書かれている所 |
|---|---|
| `aiSpend` | docs/FEATURE_RULES.md:6322 |
| `askHead` | docs/BACKLOG.md:774 |
| `askLink` | docs/BACKLOG.md:770 docs/BACKLOG.md:774 |
| `bkDropAll` | docs/FEATURE_RULES.md:2651 docs/FEATURE_RULES.md:2664 docs/FEATURE_RULES.md:4121 docs/RECOVERY.md:212 |
| `bkDropFor` | docs/DATA_MODEL.md:87 docs/FEATURE_RULES.md:2663 docs/RECOVERY.md:117 docs/RECOVERY.md:216 |
| `bkOK` | docs/RECOVERY.md:164 |
| `bkPack` | docs/BACKLOG.md:2602 docs/FEATURES.md:358 docs/FEATURES.md:672 docs/FEATURE_RULES.md:1304 docs/FEATURE_RULES.md:2968 docs/FEATURE_RULES.md:2984 docs/FEATURE_RULES.md:5490 docs/FEATURE_RULES.md:5700 docs/PAID_FEATURES.md:326 docs/PAID_FEATURES.md:415 docs/PAID_FEATURES.md:559 docs/PAID_FEATURES.md:573 docs/RECOVERY.md:175 |
| `bkPush` | docs/ARCHITECTURE.md:193 docs/FEATURES.md:623 docs/RECOVERY.md:164 docs/RECOVERY.md:187 |
| `bkRestore` | CLAUDE.md:1105 docs/ARCHITECTURE.md:193 docs/STATE.md:696 docs/STATE.md:1381 |
| `bkSound` | docs/EXPIRY.md:263 docs/RECOVERY.md:109 docs/RECOVERY.md:165 docs/RECOVERY.md:415 |
| `bkTake` | docs/EXPIRY.md:202 docs/EXPIRY.md:264 docs/RECOVERY.md:107 docs/RECOVERY.md:190 docs/STATE.md:1381 |
| `calSlots` | docs/FEATURE_RULES.md:4449 |
| `capLapse` | docs/FEATURE_RULES.md:2715 docs/FEATURE_RULES.md:4966 docs/FEATURE_RULES.md:5061 docs/FEATURE_RULES.md:5683 docs/PAID_FEATURES.md:78 docs/PAID_FEATURES.md:567 |
| `cardDeliver` | docs/BACKLOG.md:2640 docs/BACKLOG.md:2648 |
| `dayPull` | docs/FEATURE_RULES.md:3715 |
| `dayTag` | docs/PROMPTFILTER.md:70 docs/PROMPTFILTER.md:76 docs/PROMPTFILTER.md:104 |
| `dayTagId` | docs/PROMPTFILTER.md:71 |
| `entitledPlan` | docs/PAID_FEATURES.md:23 docs/PAID_FEATURES.md:112 |
| `exportCSV` | docs/BACKLOG.md:2640 docs/BACKLOG.md:2645 |
| `fmrAddAll` | docs/DUPLICATES.md:277 |
| `geDirty` | docs/FEATURE_RULES.md:2388 |
| `goPlans` | docs/DUPLICATES.md:84 |
| `hasBytes` | docs/BACKLOG.md:55 |
| `impFileHTML` | docs/DUPLICATES.md:315 |
| `impUndo` | docs/BACKLOG.md:2338 docs/BACKLOG.md:2356 |
| `jsIn` | docs/BACKLOG.md:1272 |
| `kbCellW` | docs/FEATURE_RULES.md:4855 |
| `kbFrameHTML` | docs/FEATURE_RULES.md:2086 |
| `kbKeyW` | docs/FEATURE_RULES.md:4853 |
| `kbOutSay` | CLAUDE.md:2131 docs/FEATURE_RULES.md:5135 |
| `kbRows` | docs/FEATURE_RULES.md:4721 |
| `kbSlots` | docs/FEATURE_RULES.md:1973 docs/FEATURE_RULES.md:1987 docs/FEATURE_RULES.md:2086 docs/FEATURE_RULES.md:2098 |
| `langAcct` | docs/FEATURE_RULES.md:4931 |
| `langMigStamp` | docs/DATA_MODEL.md:339 docs/DATA_MODEL.md:511 docs/FEATURE_RULES.md:2220 |
| `langMigrate` | docs/DATA_MODEL.md:328 docs/DATA_MODEL.md:330 docs/DATA_MODEL.md:338 docs/DATA_MODEL.md:511 docs/DATA_MODEL.md:511 docs/DATA_SAFETY.md:79 docs/FEATURE_RULES.md:2218 docs/STATE.md:696 docs/STATE.md:716 |
| `langOwned` | docs/BACKLOG.md:244 docs/FEATURE_RULES.md:2589 docs/FEATURE_RULES.md:2617 docs/FEATURE_RULES.md:2618 docs/FEATURE_RULES.md:2665 docs/FEATURE_RULES.md:4932 docs/PAID_FEATURES.md:515 docs/RECOVERY.md:185 |
| `lsWipeNS` | docs/BACKLOG.md:2629 docs/FEATURE_RULES.md:2664 docs/FEATURE_RULES.md:4173 docs/RECOVERY.md:211 docs/STATE.md:735 |
| `measureRows` | docs/BACKLOG.md:718 docs/BACKLOG.md:1562 docs/BACKLOG.md:2734 docs/BACKLOG.md:2909 |
| `migrateNeg` | docs/GRAMMAR-V2-SPEC.md:536 |
| `netAnon` | docs/FEATURES.md:721 docs/FEATURE_RULES.md:4021 docs/FEATURE_RULES.md:4288 docs/STATE.md:973 |
| `netAnonTok` | docs/FEATURES.md:721 docs/FEATURE_RULES.md:4022 docs/STATE.md:969 |
| `netFindPrompt` | docs/PROMPTFILTER.md:72 |
| `netLangBack1` | docs/DATA_SAFETY.md:76 docs/EXPIRY.md:203 docs/EXPIRY.md:265 |
| `netMediaURL` | docs/STATE.md:94 |
| `netMember` | docs/FEATURES.md:718 docs/FEATURES.md:747 docs/FEATURE_RULES.md:4021 docs/FEATURE_RULES.md:5387 docs/STATE.md:735 docs/STATE.md:967 |
| `netNoneHTML` | docs/FEATURE_RULES.md:976 docs/FEATURE_RULES.md:978 |
| `netPlanSync` | docs/PAID_FEATURES.md:59 |
| `netStore` | docs/FEATURES.md:452 docs/FEATURE_RULES.md:3947 |
| `netTakeGone` | CLAUDE.md:1759 docs/FEATURE_RULES.md:521 docs/FEATURE_RULES.md:812 docs/FEATURE_RULES.md:833 docs/FEATURE_RULES.md:839 docs/STATE.md:261 |
| `nidDrop` | docs/DATA_MODEL.md:495 |
| `nidFor` | docs/DATA_MODEL.md:495 |
| `nidHolds` | docs/DATA_MODEL.md:495 |
| `numSetVal` | docs/BACKLOG.md:1823 docs/BACKLOG.md:1827 |
| `obLastStep` | docs/FEATURES.md:744 |
| `openCapLapse` | docs/FEATURE_RULES.md:5683 docs/PAID_FEATURES.md:568 |
| `planKeep` | docs/FEATURE_RULES.md:3112 docs/FEATURE_RULES.md:3126 docs/STATE.md:1763 docs/keyboard-extension.md:582 |
| `planMigrate` | docs/BACKLOG.md:373 docs/FEATURE_RULES.md:4963 |
| `postGloss` | CLAUDE.md:1990 |
| `postGlossLine` | CLAUDE.md:1990 |
| `postTr` | docs/FEATURE_RULES.md:5773 docs/STATE.md:507 |
| `pushMay` | docs/FEATURE_RULES.md:298 |
| `readSeq` | docs/BACKLOG.md:3005 |
| `scriptDrawn` | docs/BACKLOG.md:1858 |
| `shInFileHTML` | docs/DUPLICATES.md:315 |
| `snsJoin` | docs/PROMPTFILTER.md:73 |
| `snsPull` | docs/FEATURES.md:696 docs/PAID_FEATURES.md:372 docs/RISK.md:264 |
| `spPageHTML` | CLAUDE.md:1997 |
| `spRowHTML` | CLAUDE.md:1998 |
| `stTocAt` | docs/WALK-141.md:74 |
| `sugLeft` | docs/FEATURE_RULES.md:6322 |
| `trUnits` | docs/DATA_MODEL.md:853 |
| `voPlayPW` | docs/FEATURE_RULES.md:6087 |
| `wdSet` | docs/BACKLOG.md:1712 |
| `wldSeenHTML` | CLAUDE.md:1637 |
| `wordsMore` | docs/BACKLOG.md:2855 |
| `writeDown` | docs/PAID_FEATURES.md:23 docs/PAID_FEATURES.md:41 |

## 付録 2：付録 1 を作ったスクリプト（リポジトリの根で `node` に渡す）

```js
const fs=require("fs"),path=require("path");
function walk(d){return fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)])}
const code=walk("www").filter(f=>f.endsWith(".js")).map(f=>fs.readFileSync(f,"utf8")).join("\n")+fs.readFileSync("www/index.html","utf8");
const defined=new Set();let m;const re=/function\s+([A-Za-z_$][\w$]*)\s*\(|(?:var|window\.)\s*([A-Za-z_$][\w$]*)\s*=\s*function/g;while((m=re.exec(code)))defined.add(m[1]||m[2]);
const notOurs=new Set(["advanceToNextInputMode","deleteBackward","layoutSubviews","getBoundingClientRect","indexOf","registerFont","rowHeight","fillPath","hideFormAccessoryBar","loadChromium"]);
const docs=["CLAUDE.md",...walk("docs").filter(f=>f.endsWith(".md")&&!/CHANGELOG|\/scope\/|\/reports\/|HANDOVER/.test(f))];
const out={};
for(const f of docs){const s=fs.readFileSync(f,"utf8");const r=/`([a-z][A-Za-z0-9_]{3,})\(\)?/g;let x;while((x=r.exec(s))){const n=x[1];if(defined.has(n)||notOurs.has(n)||!/[A-Z]/.test(n))continue;const line=s.slice(0,x.index).split("\n").length;(out[n]=out[n]||[]).push(f+":"+line);}}
for(const k of Object.keys(out).sort())console.log(k, out[k].join(" "));
```

## 追記（2026-09-24）：`docs/STATE.md` の古い一文

`docs/STATE.md`（integ-0905）1152行「StoreKit is written, and has never run on a device.」は
古い。オーナーによれば課金は既に動いている。STATE.md はリーダーの物なので、ここに書くだけ。
