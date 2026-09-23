# r73 — 全部洗いざらい（2026-09-23）

作業セッション r73-audit（`claude/r73-audit`、`origin/integ-0905` 6177ddde から）。
**コードも docs も、このファイル以外は一行も変えていない。直すのは別のセッション。**

オーナーの言葉（brief より、原文）:
「マジでルールに細かく記載してあるんだから、全部洗いざらい出して直書き禁止、コードは太く長く直して
くれ。並列回路を無限にしたみたいなキモい治し方やめてくれ。後関数だけ直すとか。」
「バグが多いのを一部分だけ治さを繰り返すからぐちゃぐちゃなるの対症療法なの。」「マジで全部直せ」

## 読み方

- **穴ではなく面で並べた。** 一つの面に穴がいくつあっても、直す人は面の「覆う一文」を一つ書き、
  穴ごとの継ぎ当てを消し、検査は**面を数える**（穴を並べない）。§ COVERED のとおり。
- 印: **［測った］** = 実物のアプリをヘッドレス Chromium で起こし、偽の Supabase に向けて要求を
  全部書き出したもの／関数を包んで数えたもの／`node` に切り出して評価したもの。
  **［読んだ］** = コードを読んだだけ。**［数えた］** = コメントを外したソースを機械で数えた。
- **〔r63 x〕** = `docs/scope/r63-audit.md` に既にある、**〔r46 x〕** = `claude/r46-reddit:docs/scope/r46-audit.md`
  に既にある。どちらも**今のコードで直っているかを確かめて**「まだ／直った／一部」を書いた。
  r63 が読んだ ecf88d0f から今までに net.js・boot.js・post.js・me.js・sns.js・keyboard.js・backup.js・
  sync.js は一行も変わっていない、つまり r63 の〔r60〕の項は全部「まだ」。
- **「オーナーへ」** = 値段・境界・消す・保存期間・衝突の解き方・しきい値・言葉・見た目の判断。
  決定ログに答えがある物はその見出しを指した。
- 行番号は全部 integ-0905 6177ddde のもの。
- 使った一時スクリプトは repo に入れていない（scratchpad）。**端末・本物の Supabase では何も
  確かめていない。** 偽のサーバーは即答するので、競走の勝ち負けは本物の回線では変わりうる。
- 手分け: 計測（§1）は本人。§2 以降の多くは、規則群ごとに出した読み取り専用の調査
  （repo は変えない）の結果を、本人が突き合わせてまとめたもの。調査が「確かめていない」とした
  所のうち、計測で答えが出た物は書き換えた（例: 自分の profile 行の GET は起動で 4 本）。

---

## 0. 一番重い面（先にここだけ読む）

| # | 面 | 覆う一文の候補 | 節 |
|---|---|---|---|
| 1 | **読む時が「開いた時に全部」** | 起動が読むのは通知とタイムラインだけ。他は画面の戸口が、その画面に描く分だけ、上限つきで読む。描画関数は読まない | §1・§2-1 |
| 2 | **押していないのに書く／写しが上がる** | サーバーへ行く書き込みは人が押した一つの操作からだけ出る。起動・移行・描画・設定の保存は言語を書かない | §2-2 |
| 3 | **「まだ訊いていない」を無料・空・0 と読む** | 答えの無い状態は三つ目の値で、`can()`/天井/一覧/数はそれを一か所で扱う。空と壊れと未回答は別の枝 | §2-3・§2-4 |
| 4 | **サインインと「私は誰か」の問いが 60 か所** | 私が誰か・サインインしているかは窓（`netSend1`）と一関数だけが答える | §2-5 |
| 5 | **同じ表を別の関数で何度も読む** | テーブルごとに読む関数は一つ、列と件数は表から | §2-6 |
| 6 | **アカウントに属さない置き場／持ち主の無い物の引き継ぎ** | 端末に書く物は書く時に uid を持つ。持ち主の無い物は誰の物にもならない | §2-7 |
| 7 | **読む側が作る側に触る** | 読む側が描く物・使う書体・書く物は投稿に載っている物だけ。読む側は何も書かない | §2-9 |
| 8 | **一行を描く仕組みが 9 通り** | 言語の行は `postRuns()` で分け、形は一つの物差しで置く | §2-11 |
| 9 | **キーボードのシートの座標が二つ／画面の状態が画面を越える** | シートの座標は `KB_COLS` の 10 列一つ。画面を離れたら選択と巻き戻しは忘れる | §2-16 |
| 10 | **決定が規則を置き換えても規則・状態の文が直っていない** | 置き換えた決定は同じ commit で古い文を消す。docs-check は識別子と検査名を数える | §2-17 |

---

## 1. 読む時 ── 起動と各画面の要求、全部（決定 2026-09-23 を物差しに）［測った］

**物差し**（`docs/FEATURE_RULES.md` の一番上、2026-09-23「読むのは開いた画面の分だけ」）:
起動で読むのは通知とタイムラインだけ。それ以外はその画面に進んだ時に、その画面に描く分だけ。
一覧は上限を付けて続きはスクロール。人の言語の章は ↓ を押した時に落とし、落としている間は ⭕。

測り方: `claude/leader-briefs:docs/scope/reqlog.mjs` を広げた。サインイン済みの `localStorage`
で起動し、偽のサーバーは件数を多めに返す（フォロー 800・下書き 120 件×400 字・広告枠 300・
通知 60・タイムライン 30・人の言語の words 3000 語）。`XMLHttpRequest.prototype.open` を包んで
**要求ごとに呼び出し履歴**を取った。

### 1-1. 起動（サインイン済み）── 23 本

「呼ばれる所」の `pullBoot` は `netTook()`（net.js:840）→ `pullBoot()`（sns.js:1082）→ `PULL_OPEN`
（sns.js:1070）の束。`bootSession` は boot.js:49 の中の直書きの呼び出し。

| # | 要求 | 呼ばれる所（測った履歴） | 上限 | 決定に | 移す先 |
|---|---|---|---|---|---|
| 1 | POST auth token（refresh） | `bootAsk` boot.js:173 → `netResume` | — | 合う（必要） | そのまま |
| 2 | POST `rpc/feed_fo` `{lim:50}` | pullBoot → `askFeed` sns.js:613 | 50 | 合う | そのまま。ただし続きが無い（下 1-4） |
| 3 | POST `rpc/feed_hot` `{lim:50,off:0}` | 同上 | 50 | **半分**。二つの面（フォロー中・おすすめ）を両方読む | 開いている面だけ。もう一つは面を開いた時 |
| 4 | GET `promo?select=post&order=id.desc` | askFeed → `snsPromoAsk` sns.js:426 → `netPromos` net.js:4221 | **無し** | 合わない（上限なし） | タイムラインと一緒に、上限つき（広告は 10 件おき、`PROMO_EVERY` 分だけ） |
| 5 | GET `post_seen?id=in.(…300 個…)` | netPromos net.js:4226（`netBlocked` の答えの後） | 無し。**URL に返った id を全部並べる**（測定 1562 字、実物の uuid なら 11KB） | 合わない | 同上 |
| 6 | POST `rpc/notices` `{lim:50}` | pullBoot → `askNot` sns.js:1315 | 50 | 合う | そのまま。続きが無い |
| 7 | GET `prompt?…&limit=1` | pullBoot → `askDay` sns.js:1667 | 1 | **タイムラインの一部なら合う**（お題の行はタイムラインの頭 sns.js:1563） | タイムラインの問いに入れる（別の束の名前にしない） |
| 8 | GET `block?select=blocked&actor=eq.me` | pullBoot → `askBlocks` sns.js:1347 | **無し** | 合わない（ただしタイムラインを落とす材料） | サーバーが落とすべき物（§2-15 ブロック）。端末で落とすなら上限つき |
| 9 | GET `follow_seen?…follower=eq.me`（フォロー中） | pullBoot → `askMine` sns.js:1344 → `meFollowsPull` me.js:1109 | **無し・ページ送り無し**（800 件全部） | 合わない | 数はプロフィールの行（`profile_seen.fo/fr`）で足りる。一覧はフォロー一覧の画面で、上限とスクロール |
| 10 | GET `follow_seen?…followed=eq.me`（フォロワー） | 同上 me.js:1121 | 同上 | 合わない | 同上 |
| 11 | GET `saved_search …limit=50` | pullBoot → `askSaved` sns.js:2711 | 50 | 合わない | 検索画面に入った時 |
| 12 | GET `recent_search …limit=50` | pullBoot → `askRecent` sns.js:2818 | 50 | 合わない | 同上 |
| 13 | GET `draft?select=id,body,updated_at` | pullBoot → `askDrafts` sns.js:1332 → `draftsPull` post.js:664 → `netDrafts` net.js:5027 | **無し・本文ごと**（120 件、`lingua.drafts.<uid>` に 492KB） | 合わない | 下書き一覧に入った時。一覧は題の分だけ、本文は開いた一件 |
| 14 | GET `language?owner=eq.me` | **`profileReady` me.js:903** → `pullWait('mylangs')` → `askLangs` sns.js:1390 → `netLangsDown` net.js:2362 | 無し（自分の言語の数は天井で 1〜3） | 合わない（プロフィールが開く画面なので読んでいる） | プロフィール／言語の一覧に進んだ時 |
| 15 | GET `language_take?uid=eq.me` | 同上 → `netTakes` net.js:1896 | 無し | 合わない | 同上 |
| 16 | GET `slice?select=kind,no,at&language=eq.L1` | `pullWait('mylangs', netLangSync)` boot.js:136 → `netLangsWalk` net.js:2328 → `netSlices` | 無し（body 無し） | 合わない | 言語を開いた時（作る側に入った時） |
| 17 | GET `profile?select=id&handle=eq.me` | pullBoot → `askMyPosts` sns.js:1408 → `pfPosts` → `netWhoseId` net.js:3414 | 1 | 合わない。**自分の id を handle から引き直している**（SESS.uid がある） | 要らない |
| 18 | GET `post_seen?author=eq.me …limit=50` | 同上 → `netPostsBy` net.js:4292 | 50 | 合わない | プロフィールに進んだ時 |
| 19 | GET `profile?select=staff,handle,banned_at,banned_why` | `netTook` net.js:824 → `netStaff` net.js:3743 | 1 | 半分（凍結は起動で知る必要があるかもしれない → オーナーへ） | 自分の行を読む一本にまとめる（#20・21 と同じ行） |
| 20 | GET `profile?select=display,handle,bio,link,loc` | `bootSession` boot.js:149 → `netProfSync` net.js:1289 | 1 | 合わない | プロフィールに進んだ時 |
| 21 | GET `profile?select=prefs` | `bootSession` boot.js:153 → `netPrefsPull` net.js:1345 | 1 | 設定（テーマ・言語）は画面を描く前に要る → 合う側 | #19 と一本に |
| 22 | POST `functions/v1/verify-plan` `{jws:[]}` | `bootSession` boot.js:91 → `storeSync` store.js:88 → `netPlanVerify` net.js:1519 | — | 半分（プランは広告・一覧の天井に効く、§2-3） | — オーナーへ（プランを起動で訊くか） |
| 23 | **PATCH `profile?id=eq.me` `{"av":null}`** | `bootSession` boot.js:145 → `netAvSync` net.js:1436 | — | **書き込み。押していない** | 消す（§2-2）〔r46 A1・r63 0-2〕まだ |

- **自分の `profile` 行を別々の select で 4 本読み、1 本書く**（#17・19・20・21・23）。
- `bootSession` の直書きの 5 行（boot.js:91・136・145・149・153）と、`PULL_OPEN` の束（sns.js:1070）と、
  `netTook` の中の `netStaff`（net.js:824）と、`profileReady` の `pullWait`（me.js:902-904）──
  **起動で読む道が四か所に分かれている**。直す session はこれを一か所（「起動が読むのは通知と
  タイムライン」の表）に書き直す。
- **`PULL_OPEN` は古い決定の実装で、その決定は決定ログに無い。** sns.js:1030-1069 のコメントは
  2026-09-05「アプリ開くタイミングで通信入るなら全部一気に入るやろ」「画面に入った瞬間に
  サーバーへ訊きに行くのは無し。それが 1 秒遅れの正体です」と、2026-09-07「プロフィールは、
  出す物を全部読み込んでから開く」を引いている。**09-23 の決定がこれを置き換えた。**
  決定ログに 09-05・09-07 の見出しが無いので superseded の印を付ける場所も無い ── 直す session は
  コメント（sns.js:1030-1081、boot.js:108-137、me.js:832、me.js:1072、post.js:724、onboard.js:959、
  net.js:679）の「全部一気に」の文を同じ commit で消すこと（§ FIX THE RULE）。
  「1 秒遅れ」の問題は消えていない: 09-23 の形でも、画面は**戸口が読んでから開く**
  （`profileOpen` me.js:841 が既にその形 ── 押してから読み、読めてから画面を出す）。
  これが両方の決定を満たす一つの形。

### 1-2. 画面を開いた時［測った］

| 場面 | 出た要求 | 決定に |
|---|---|---|
| タブ（ホーム・おすすめ・通知・プロフィール・作る）、単語、戻る、設定、言語の一覧、下書き、フォロー一覧 | **0 本** | 起動で全部読んだので 0。裏返すと、**引っ張らない限り二度と読まない**（通知もタイムラインも古いまま） |
| 人のプロフィール（`profileOpen('h3')`） | `profile_seen` 1、`profile?select=id&handle=` 1、`post_seen author= limit 50` 1 | **合う**（戸口が読んでから開く、me.js:878-879）。ただし handle→id の引き直しは別の関数が三つ（§2-6） |
| 人の言語のページ（`go('about', id)`） | `language_seen` 1、**`slice?select=kind,body,no,at&language=eq.<id>`（kind を絞らない＝8 種の本文全部、words 3000 語込み）** | **合わない**。呼んでいるのは**描画関数 `vAbout()` home.js:1849-1850**（render の中で通信） |
| ↓ を押す（Plus、words の章） | `POST language_take` 1、`GET language_take` 1。**本文は一本も来ない** | **合わない**。`wldGet()` home.js:1684 は、ページを開いた時に落ちてきた写し `WLDS_HAVE` を書き写すだけ。コメント（home.js:1680-1683）が「二本目の要求は二つ目の答えになる」とわざとそうしている。⭕ も無い（待ちの印は回る＋ sns.js:57-58） |
| スクロール（タイムラインの底） | **0 本** | **合わない**。`snsMore()` sns.js:1513-1520 は旗を立てて下ろすだけで**何も訊かない**。`netFeed(which, ok, bad, more)` net.js:3223 は続きを読む `more` を持っているのに、誰もそれを渡さない（片端の外れた配線、規則 5 の形）。通知 `netNotices` net.js:5283・返信 `netReplies` net.js:4266・フォロー一覧にもページ送りが無い |

### 1-3. サインイン・サインアウト・電波・閉じる［測った］

- **サインアウト**（`netOut()`）: 0 本。
- **サインイン**（サインアウト後、`netSignIn`）: 20 本 ＋ **押していない `POST /rest/v1/slice`（letters）**。
  - 呼び出し履歴: `netSaveUpGo` net.js:2915 → `netLangRow` → `netGotFor` → `netSlice1` → `netSlicePut`。
    この端末が持っていた（`ltStart` が埋めた）38 の空の枠が、サーバーの言語 L1 に letters として
    書かれた（偽のサーバーは L1 の letters を持っていなかった）。netTook の「送ってから訊く」の
    通り道で、オンボーディングの外でも走る。〔r63 0-1 と同じ面〕
  - **`rpc/notices` が二度**。二本目の呼び出し履歴: `langForAcct` core.js:1997 → `langOpen` core.js:1352 →
    **`viewReset()` shell.js:84** → `pullNeed('notif')`。`viewReset` は「画面が忘れる所」（CLAUDE.md
    § One place）で、そこが通知を読みに行っている（二つ目の仕事）。言語を開くたびに通知を読み直す。
  - **タイムライン（feed_fo・feed_hot）は読み直されない**（同じアカウントで入り直して 0 本）。
    `snsHas()` sns.js:400 が見る `SNS_GOT` sns.js:41 は、`pullForget()` sns.js:863 に消されない ──
    「答えた」の記録が `PULL_GOT`/`PULL_HAS` と `SNS_GOT` の**二つ**あり、忘れる方は片方だけ。
    別のアカウントで入ると、その人のタイムラインは一度も訊かれない（読んだ。測ったのは同じ人）。
- **電波なしで起動**（前に読んだ写しの無い端末）: プロフィールが **「0 フォロー中・0 フォロワー」
  「まだ何も投稿していません」**、言語の行は **「Untitled・Private」**。ポップは［接続できません］。
  届かなかったサーバーについて「空」「非公開」と言っている（§ Data「空と壊れは別の枝」）。
  `pullSay()` sns.js:846 の三状態はタイムライン・通知・検索の二つでしか使われていない（§2-4）。
- **閉じる**（visibilitychange・pagehide）: 0 本。放置 20 秒: 0 本（見張りの読み直しも無い）。
- 電波なしで検索の履歴・★を保存すると**端末には書かれ、ポップも出ない**［測った］（sns.js:2851-2863,
  2755-2765）。2026-09-05「通信が落ちたら何も進まない」と食い違う。

### 1-4. 覆う一文と検査

- **覆う一文**: 「起動が読むのは通知とタイムライン（とお題の行）だけ。他の画面は戸口が、その画面に
  描く分だけ、上限つきで読み、読めてから開く。描画関数（`v*`）と `viewReset` は通信しない。
  一覧は `limit` と続き（keyset）を持ち、底に来たら続きを読む。↓ は押した時に章の kind だけ落とす。」
- **検査が数えるもの**:
  1. 偽のサーバーで起動し、出た GET/RPC の**テーブル名の集合**が {auth, feed_*, notices, prompt, promo} の
     部分集合であること（表は一か所に書き、検査はそれを読む）。
  2. 何も押さない起動・サインイン・画面遷移で出た **POST/PATCH/PUT/DELETE の数 = 0**。
  3. `v*` と `viewReset` を包み、その中で `XMLHttpRequest.open` が呼ばれた数 = 0。
  4. net.js の全 GET のうち、`limit=` も `id=eq.` も無い物の数（今 10: netStaffList, netBlockedRead×2,
     netPromos×2, netLangsDown, netTakenDown, netTakes, netSlices, netFollowRows, netDrafts, netDropMe）。
  5. タイムライン・通知・返信・フォロー一覧で、底に来た時に続きの要求が出ること。

---

## 2. 面ごと

### 2-1. 読む道の形（§1 の続き）

- 起動で読む道が四か所（boot.js `bootSession`、`netTook`、`PULL_OPEN`、`profileReady`）［測った］。
- `vAbout()` home.js:1848-1850 が描画の中で `wldSeenPull`・`wldSlicesPull` を呼ぶ［測った］。
  `wldSlicesPull()` home.js:1898 は `netSlices(id, …)` に kinds を渡さない（8 種の本文を全部）。
- `viewReset()` shell.js:84 が `pullNeed('notif')`［測った］。
- `wldSlicesPull` の上のコメント（home.js:1891-1896）「`slice_read` は五つだけ開き、辞書と文法は誰にも
  断る」、`vAbout` の上（home.js:1840-1843）「`slice_read` keeps words shut to everybody」は**今の
  schema と違う**: schema.sql:1291-1296 は持ち主のスイッチ `slice_dl()` があれば `words`・`phases`・
  `gram2` を開く〔r46 C の FEATURES.md:103 と同じ中身〕。
- `netFeed` のコメント（net.js:3230-3233）「読むのにアカウントは要らない、publishable key だけで読める」
  は 2026-09-22「anon は何も持たない」と違う。

### 2-2. 押していないのに書く／読むだけの写しが上がる

**面の大きさ**［数えた］: `slWr(` 15 か所、丸ごと書く書き手 7 つ（`save` `saveLetters` `saveNotes` `saveStg`
`saveSnd` `saveKb` `saveWld`）＋ phases.js:224。`save()` の呼び手 47、そのうち **SET だけを変えて
`save()` を呼ぶ所が少なくとも 20**。`bkTouch()` 9 か所。net.js でサーバーへ書く呼び出し約 57。
起動（写しあり）で押していないのに出た書き込み 6 本（verify-plan・profile PATCH・slice POST 3 本）［測った］。

**違反**
- `save()` core.js:1448-1457 がどこから呼ばれても `WORDS/LINES/SCRIPT` を丸ごと LSL に書く →
  `.got` の写しが「この端末の物」になって上がる。別の端末で消した語が戻る［測った］〔r63 0-1〕まだ。
- 設定を書く仕組みが二つ: `save()` と `setKeep()` core.js:2101。SET だけの変更で `save()` を呼ぶ所:
  settings.js:570・580、glyph.js:652、home.js:422、keyboard.js:3867、onboard.js:1005・1160・1215・1977、
  sns.js:2719・2730・2732・2763・2822・2861・2872・3148、shell.js:1861。**押していないのに走るもの**:
  `vvKeep()` shell.js:1855-1862（画面の測定のたび）、`notSeen()` sns.js:3145-3149（通知を描くたび）［読んだ］。
- `bkTouch()` boot.js:19 が起動のたびに上り道を起こす（コメント自身がそう言う）〔r46 A4〕まだ。
- 起動の `migrate*()` 13 個（boot.js:22-36）が、サーバーの答えの前に保存を呼ぶ〔r46 A4〕まだ。
  うち `migratePh()` core.js:2747-2753 は**空にした発音に推測 `phGuess` を書いてサーバーへ送る**
  ［測った: `ph=["k","a","n","o"]` が書き戻り `save()` 1 回］。2026-09-04「保存を押したときだけ変わる」
  （FEATURE_RULES 1272 行の項）に反する。
- `migrateGramLang()` phases.js:157-231: 索引 `LANGS` の**全部の言語**を `slRd` で読み、この端末の
  `SET.order`（`SET_PHONE`）を `slWr` で書く。`langLocked` も持ち主も訊かない → 前の人の言語・人の
  言語にこの端末の語順が入る。`langUnderSet()` phases.js:149-156 は `localStorage` を直に読む第二の
  読み道〔新〕［読んだ］。
- `langOpen()` → `langSaveAll()` core.js:1344、`migrateKbFree()` keyboard.js:340-347〔r63 0-2・K2〕まだ。
- `langWhose()` core.js:1165-1168 は持ち主を `langOwnOf()` → `slRd`（`.got` に落ちる、core.js:464）から
  取り、上り道の `langMine` は**写しで「自分の物」と決めて送る**［測った: `.got` の owner だけで送信まで］。
  2026-09-11「端末は何も決めない」（FEATURE_RULES 704 行）の Implementation status は「百か所の書き直し
  はまだ」。
- `netAvSync` net.js:1432-1440: 顔の無い端末から `PATCH profile {"av":null}`［測った］〔r46 A1・r63 0-2〕まだ。
- `netPrefsPut` net.js:1369-1378: 設定を丸ごと PATCH（呼び手 7）〔r46 A2・r63 SQ1〕まだ。
  `netPrefsPull` はサインインで走らない（boot.js:153 だけ）。core.js:2124 のコメント「sign-in で戻す」は偽〔r63 L2〕まだ。
- `postCatchUp` post.js:1337-1360: 端末の投稿を黙って送り直す〔r46 A5〕まだ。下書きは端末が勝つ
  post.js:675〔r63 A6〕まだ。
- **投稿の行を描くだけで `ME.av` が書かれる**: `postFace` → `whoOf` me.js:931 → `postAvatar()`
  post.js:2264-2267 が開いている言語の LETTERS から顔を作り `meAvSet` → `saveMe()`［測った:
  `ME.av=null` で `postRow(自分の投稿)` → `ME.av={st}`］〔新〕。次の起動で #23 の PATCH に乗る。
- **`migratePosts()` post.js:2367-2376 が `who` の無いサーバーの投稿を「自分の投稿」に書き換える**
  （起動のたび、boot.js:30）［測った: 他人の投稿 → `mine:true, who:'Aya', hd:'aya'`］〔新〕。
- サインイン時の `POST slice`（§1-3）［測った］。
- `slice.no` を比べる物がサーバーに無い（後勝ち）schema.sql:371-378〔r63 0-4〕まだ。

**覆う一文**: 「LSL とサーバーに入るのは、サーバーの答えと、人が押した変更だけ。設定の保存
（`setKeep`）は言語を書かない。移行は足すだけで推測を書かない。写しで何も決めない。」

**検査が数えるもの**: 写しだけがある端末で起動・サインイン・全画面を描き、押さずに N 秒、
`/rest/v1/*` への書き込み 0。`slWr` と `save()` の呼び手を全部数え、それぞれが「サーバーの答え」か
「act-map の名前から届く道」かを表で答えさせる（表に無い呼び手は赤）。

### 2-3. 「プランをまだ訊いていない」を無料と読む

**面の大きさ**［数えた］: `can('x')` 46、`has(` 7（全部 core.js）。未回答で false（core.js:2328-2342）。
三つ目の状態を扱うのは 9 か所だけ（`langCap` `dlCap` `wsys` `ltStart` `upStop` `capStop` `langStop`
`dlStop` `pwCapStop`）── **9 か所がそれぞれ `planKnown()` を訊き直すのが継ぎ当ての形そのもの**。

**違反**（〔r63 0-3〕は単語だけを指していた。まだ直っていない。以下は面全体）
- 一覧が無料の形に畳まれる［測った: Pro・単語 161・文字 45・段 2 で `planForget()`］:
  `wordsSeen` 100（words.js:149 ← core.js:1610-1611）、`ltSeen` 38（sound.js:755）、`stHidden` 2
  （phases.js:431,438）、`kbCap` 1、`postCap` 140。同じ時に `langCap`・`dlCap` は null で畳まない
  ── **同じ問いに二つの答え**。
- `capWarnHTML` shell.js:1255 が `DO('go',["plans"])` → 訊けていない Pro の人に値段の頁
  （呼ぶ所 home.js:19, words.js:232, sound.js:752, phases.js:894）［読んだ］。
- `render()` → `sharePush()` glyph.js:2998 が、`can('kb')` false で**無料の QWERTY を App Group に書く**
  （Pro の板 2555 バイト → 3569 バイトの固定 QWERTY が `LinguaShare.write` に渡った）［測った］。
  電波の無い起動のあいだ、電話のキーボードが無料の物になる。
- `ltSetRoman` → `ltFreeSlot` letters.js:1020,1088: Pro で足した字の名前を枠の名前にすると、訊けて
  いない時は行が splice されて `LETTERS` 41→40［測った］。
- `scriptDir()` wsys.js:311 は訊けていない時 'ltr'。`pwSend` が `dir:scriptDir()` post.js:2131 を
  投稿に焼く → 右から左の投稿が 'ltr' で残る（§ The past）［読んだ］。
- `postEdit` post.js:3191-3193 は `upStop` を通らず自前で `popAsk(t('post.editplan'))`
  （"No connection." でなく "Editing a post is on the Plus plan"）［測った］。
- `can('noads')` false → Pro に広告と ATT の問い（sns.js:424,434,475,501,511、LinguaAds.swift:81-84）。
  ATT はインストールで一度しか訊けない〔r63 0-3〕まだ。
- `plHave()` settings.js:1136-1142 → 持っている段の「買う」が出る〔r63 0-3〕まだ。

**覆う一文**: 「`PLAN` が null の間、プランを訊く所はどれも切らない・書かない・端末の外へ渡さない・
値段を言わない。`can()`/`has()`/天井は null を返せる形にし、答えの無い時の振る舞いは一か所で決める。」

**検査が数えるもの**: `planForget()` の後、`CAN` の全キーと page のグローバルから集めた全 `*Cap()` が
free の値を返す数 = 0。PLAN=null で全画面を描き全ボタンを押して、一覧の長さが Pro と同じ、
`LinguaShare.write`・`save*` の呼び出し 0、`go('plans')` 0、`admStart` 0。

### 2-4. 「空」「壊れ」「未回答」が同じ枝

- slice の読み手 10 か所が `try{JSON.parse(slRd(…)||'[]')}catch(e){}` で**壊れた slice を空の既定値に**
  する: core.js:1255,1256,1259、home.js:856、keyboard.js:102,144、letters.js:36、notes.js:19、phases.js:77、
  sound.js:252。区別できる `sySide()` sync.js:210-214 は使われていない［読んだ］。その後に保存が走ると
  既定値が LSL に書かれる（上がるかは測っていない）。
- 空の catch で握りつぶす所 26、catch で null/[] にする所 10［数えた］（全行は §付録 A）。
- `netKeeps` net.js:2592-2608 は読めない中身を長さで比べる。
- 人の言語のページ: `wldSliceOf()` home.js:1915 は「無い」だけを既定値にし、**形の違う中身**（letters が
  `{}`）はそのまま通る → `wldPage` home.js:2069 `L.letters(...).filter is not a function` でページが落ちる
  ［測った、偽のサーバーの `{}` で］。人の言語は他人が書いた物なので、読む側は形を確かめる必要がある。
- 電波なしのプロフィール「0・0・まだ何も投稿していません」「Untitled・Private」［測った］（§1-3）。
  `meCount` me.js:286-288 が「知らない」を `Number(n)||0` で 0 にする形。
- `postInkOK()` post.js:3460-3474 は `!ink.g[x]` しか見ず、形でない g（`{}` `[]` `'abc'` `5`）を通す →
  行が "" になり本文 `ln` も出ない［測った］〔新〕。
- 投稿の `ink.sp` は書く時 `spClamp` wsys.js:340（0〜2）、読む時 `inkSteps` glyph.js:130 は上限なし
  （`sp:50` で幅 1800）［測った］── `SP_RANGE` の値を使う所が二つ。

**覆う一文**: 「読んだ物は『答え・空・読めない・まだ』の四つのどれかで、どれを描くかは一か所
（`pullSay` と `sySide` を一つにした物）が決める。読めなかった slice には書かない。他人の物は形を
確かめてから描く。」

**検査が数えるもの**: `JSON.parse(slRd(` の数 = 0。12 の slice それぞれに壊れた中身を入れて起動し、
LSL にもサーバーにも何も書かれないこと。電波なしで全画面を描き、0・「まだ何もない」・「非公開」の
文が出る数 = 0。

### 2-5. サインインしているか・私は誰か・私の物か

- `netSend1` net.js:320 は「REFUSED HERE AND NOWHERE ELSE」と書くのに、net.js の関数の頭に
  `if(!netSignedIn()…` が **60 か所**（全行は §付録 A）。答え方は 30 種以上: 窓が 401 と呼ぶ状態を
  `bad(null,0)`（窓が「回線」と呼ぶ 0）で返す関数が 30 以上。**サインアウトでも「成功」を返す書き込み**:
  `ok()` netSearchSave/Drop・netRecentAdd/Drop（net.js:4393,4399,4451,4458）、netPairRow 3501、netMark 5048、
  `done(true)` netSaveUpGo 2905（「the language is on the phone and has nowhere else to be」は § Online と逆）［読んだ］。
  画面側にもある: post.js:427,663,1339、sns.js:1531,3039,3407、store.js:109,176。
- 聞き方が 4 通り: `netSignedIn()` 96 回（`SESS.rt`）、`SESS && SESS.uid` 16、`SESS && SESS.at` 4、`!SESS` 21。
  「私の uid」を作る式が 9 回（core.js:559,1158,1191,1413,1972、settings.js:795,851、net.js:2494,3019）。
  `!netSignedIn() || !SESS || !SESS.uid` の二重確認 14 か所［数えた］。
- 「私か」を handle で比べる所 13（home.js:482、me.js:745,784,861,930,1162,1216,1253,1736,1760,1785,1822、
  sns.js:3375）と uid で比べる所 3（net.js:3186,3593,4157）。`p.mine` を立てる所 4 つで立て方が違う
  （net.js:3186 uid、me.js:1822・sns.js:3375 handle、post.js:2372 無条件 true ← §2-2 の `migratePosts`）。
- 「言語は私の物か」は `langWhose()` core.js:1155 に集まったが、`langMineIds` net.js:3018-3030 と
  `netLangsGone` net.js:2519 が自分で計算し直す。`langWhose` は未回答を WAIT、`langMineIds` は「含める」。
- 書き手の頭の `if(langLocked()) return` が 14 か所（core.js:1449、glyph.js:1630、home.js:881,947,1041、
  keyboard.js:374、letters.js:39、notes.js:23、phases.js:234,666,786、settings.js:666、sound.js:79,256）。
- `SESS.anon` net.js:624 は書かれるだけで誰も読まない（二種類のアカウントの名残）。onboard.js:1400 は
  消えた `netAnon()` を指す。onboard.js:1163-1166 `obNeed` のコメントは匿名セッション前提。

**覆う一文**: 「サインインしていないことは窓（`netSend1`）だけが決め、答えは一つ（401）。私が誰かは
一関数（uid）が答え、他は `SESS` を触らない。私か・私の物かは uid で一か所が答える。」

**検査が数えるもの**: net.js の窓の外の `!netSignedIn()` の数（→ 0）、その一関数の外の `SESS.` の読み
出しの数、`===meHandle()` と `.mine=` の代入の数。

### 2-6. サーバーの読み方 ── 同じ表を別の窓で読む

- 自分の `profile` 行を 4 関数が別の select で読む（`netMyProfile` 1121、`netProfSync` 1289、`netPrefsPull`
  1345、`netStaff` 3743）＋ `netWhoseId` 3414 で自分の id を引き直す ── 起動で GET 4 本［測った］。
- handle→id が 3 関数（`netWhoseId` 3414、`netPairRow` 3502、`netReport` 3649）。
- `post_seen` の列リストの文字列が 7 回（3234, 4196, 4202, 4226, 4266, 4292, 4329）、`language` の列が 2 回
  （2362, 2429）。
- `language` 行への PATCH が 3 関数で失敗の扱いが違う（`netLangPublic` 1836・`netLangWsys` 1976 は netPop、
  `netLangNamePut` 1863 は呼び手任せでトークンも `SESS&&SESS.at`）。
- post-media の削除が 3 関数（`netDropFiles` 5122、`netDropAgain` 5170、`netDropMine` 5241）。後で再試行する
  仕組みが 2 つ（`NET_AGAIN` 564、`NET_DROPLEFT` 5159）。
- `netDropMe` 5210 は media のパスを取るためだけに**自分の全投稿の本文を limit なしで**読む。
- 投稿の表（テーブル・関数・limit・ページ送り・呼び手）は §付録 B。

**覆う一文**: 「テーブルごとに読む関数は一つ、列と件数とページ送りは表から。」
**検査が数えるもの**: 同じ `rest/v1/<table>` の GET を持つ関数の数（テーブルごとに 1）、limit も
id=eq も無い GET の数（→ 0）。

### 2-7. アカウントに属さない置き場・持ち主の無い物

- `lingua.langs`・`lingua.cur` は全アカウントで一つの鍵（core.js:896-897）〔r63 L4〕まだ。
  keyboard.js:92 のコメント「LANGS is the PHONE's」は § NOTHING IS THE PHONE'S に反する文。
- `lingua.posts`・`lingua.drafts` に持ち主の印が無く `POSTS_UID` はメモリだけ（post.js:58,476,83）〔r63 L3〕まだ。
- **持ち主の無い写しを「入ってきた人の物にする」道が 4 つ** ── 継ぎ当ての形: `meFor` me.js:186、
  `postFor` post.js:97、`setFor` core.js:2204-2230（`was` が空なら SET を引き継ぐ）、`langMineIds`
  net.js:3026-3027（持ち主の無い言語も自分の物として送る）。［測った: 古い版の `lingua.<id>.words`
  （印なし）がある端末で me1 がサインインすると `POST /rest/v1/language {"owner":"me1","published_at":…}`
  とその単語が送られた。**前の人の言語が最初に入った人の物になり、しかも公開で作られる**］〔新〕→ オーナーへ（誰の物にするか）。
- `setFor` が預けてある `lingua.set.<uid>` を読まない〔r63 L1〕まだ。
- `LinguaShare.swift:118-131`（Sheets）・`:285-300`（Voices）はアカウントで分けず、`lsWipeAcct` は
  localStorage しか消さない〔新〕［読んだ、端末が要る］。下書きの `vo:{f}` は端末のファイル名 post.js:551〔r63 R3〕まだ。
- 移行済みの印: `wldMoved` は `SET_PHONE`、`sndMoved` はアカウントの物（同じ形の移行で答えが二つ）。
  store-check.mjs:266 は `sndMoved` を「phone」と書く。`migrateWorld` home.js:873-880 は `langLocked` を
  訊かずに印を立てる〔新〕。
- `notAt`（通知の既読位置）は端末だけ（sns.js:3130-3149）。2026-09-01「通知の未読は時刻」の Reason
  「どの端末でも同じ答え」にならない → オーナーへ（sns の決定と規則 22 の食い違い）。
- `netOut` は `netDeviceDrop` を呼ばない、`device` に update の policy が無い〔r63 S4・S5〕まだ。
- `netOut` net.js:867-964 は「〜も忘れる」を手で 10 個近く並べる（`meFor`・`postFor`・`netBlockedDrop`・
  `netMediaForget`・`pullForget`・`folForget`・`meRowForget`・`planForget`・`langTookFor`…）──
  **数える一覧ではなく手書きの一覧**。§1-3 の `SNS_GOT` はこの一覧から漏れた一つ［測った］。
  `lsWipeAcct` のコメントは「数える、並べない」と言うのに core.js:131 が `'lingua.me'` `'lingua.posts'`
  `'lingua.drafts'` を文字列で並べる。
- **直った**: K5（App Group）share.js:625-633・LinguaShare.swift:53-79、S1（Keychain のプラン）。

**覆う一文**: 「端末に書く物は書く時に uid を持つ。持ち主の無い物を読んだらそれは誰の物にも
ならない。アカウントが変わる時に忘れる物は、アカウントで引ける一つの入れ物にあり、`netOut` は
それを一行で捨てる。」
**検査が数えるもの**: `setItem` とネイティブの `keepVoice`/`sheet`/`write` を全部数え、鍵やパスに uid が
あるか `lingua.sess` か。サインアウト→別のアカウントでサインイン → 前の人の物（タイムライン・数・
一覧・言語）が画面に出る数 = 0、新しい人の問いが出た数 = 起動と同じ。

### 2-8. 移行が消す・推測を書く・DELETE REVIEW の無い消去

移行の関数 17、コード中の `delete 欄` 70 か所、`removeItem` 8 か所［数えた］。
- `walkedMigrate` core.js:1320-1325 `delete SET.done`（CHANGELOG 2026-09-09 に記録、DELETE REVIEW なし）。
- `migrateKbFree` keyboard.js:343 `kbs.shift()`（DELETE REVIEW なし）。
- `migrateSp` letters.js:1465 `delete sp[j].u`、:1470 `wRename` で見出し語を書き換え。
- `migratePh` core.js:2747-2753 推測を書く（§2-2）。
- 用紙で書いた数字（`sh` だけ）が、基数を下げると自動で消えた（`numDropBlank`、`dropped:1`）［測った］
  ── 字に形があるかを `l.st` で答える所が 11 か所あり、`inkGeo` を使っていない（§2-12）。
- **直った**: `migrateSnd` sound.js:272-277。

**覆う一文**: 「移行は足すだけ。欄も行も消さず、推測は書かない。自動で消すのは DELETE REVIEW のある物だけ。」
**検査が数えるもの**: 移行の関数を名前（`migrate*`）で page から集め、本文の `delete`・`splice`・`shift`・
`removeItem`・推測関数への代入の数 = 0。

### 2-9. 読む側が作る側に触る（規則 8・12、The past）

sides-check（名前の検査）は緑。名前ではなく**働き**で漏れている:
- `postFace` → `whoOf` → `postAvatar` → `saveMe`（§2-2）［測った］。sides-check.mjs:302 の免除コメント
  「it does not read ME」は偽。
- **他人の投稿の本文に U+E000.. が入っていると自分の字で描かれる**: `.pline` の書体 LinguaType
  （index.html:848）の同じ family に、自分のキーボード面 TFONT（glyph.js:529-555）が入っている［測った:
  タイムラインの他人の行で幅 41.1 と 37.5 の差］〔新〕。本文に PUA が入る道はサーバーでは検査されない。
- `migratePosts` が他人の投稿を自分の物に（§2-2）［測った］。
- カード: 〔r63 CD1〜CD5〕は**全部直った**（CD1・CD5 は測った）。残り: 描いていない字が一字ずつ字間を
  空けた大文字（card.js:275 `+side*2`、:434 `toUpperCase`）［測った］→ オーナーへ（意図か）。
  `card.js:228 if(l && l.ch) return {tx:l.ch}` → 借りた字 `α`（画面はローマ字 `a`）［測った］。

**覆う一文**: 「読む側が描く物・使う書体・書き込む物は、投稿に載っている物だけ。読む側は何も書かない。」
**検査が数えるもの**: `postRow`・カード描画の間の `save*`・`ME`・`SET` への書き込みの数 = 0。`.pline`
から届く `@font-face` の `unicode-range` に投稿の外の字が入っていないこと。起動の migrate が `!mine`
の投稿に触った数 = 0。

### 2-10. 書いた時に載せる・PUA が欄の外へ出る（規則 13）

- **編集で ink が消える**: `postEdit` は `PW.ln=p.ln`（ローマ字）で開き post.js:3196、`pwSaveEdit` が
  `postInkTyped(PWRAW)` post.js:3204 で切り直して null［測った: `ink {g:3,…}` → null］〔新〕。開いている
  言語と別の言語の投稿も、今の言語の字間で上書き［読んだ］。
- 名前の無い描いた字は `ln` から消える（`puaRoman` の `ltName()||''` glyph.js:525）［測った: 3 字→「kth」］。
  そういう字だけの行は `pwHas` で空と見られ送れない（post.js:2048、:309）。
- 下書きは PUA を生のままサーバーへ上げる（post.js:549）。後で字を描き足す・消すと別の字に化ける
  ［測った: 「kth」→「th」］。下書き一覧 `.dfl`（post.js:804,811）は生の PUA を UI 書体で出す［測った］。
- PUA を文字に戻す所 4（grammar.js:1796、letters.js:1373、post.js:2048、wordsheet.js:2000）、IN の受け口 35［数えた］。
- `ln` は引数、`ink` はグローバル `PWRAW`（post.js:2038、2131）── 出どころが二つ［読んだ］。
- 声の長さが読む人に届かない（`netBody` net.js:3157 が `vo` を落とす）〔r63 R1〕まだ。

**覆う一文**: 「PUA は入力欄の外へ出ない。IN の配達一か所でローマ字に戻す。編集は書いた時の ink を保ち、
切り直すのは行が打ち直された時だけで、その時も投稿の言語で切る。」
**検査が数えるもの**: 下書き・投稿・タグ・検索・意味としてサーバーへ出る文字列に U+E000–F8FF が
入る数 = 0。`postEdit`→送信で ink が変わらないこと。

### 2-11. 一行を描く仕組みが 9 通り（規則 8、OWNER 2026-09-23）

1. LinguaType の文字（`.pline`・`#pw-ln`・字間の見本・暦の `.tfont` span）── 決定の「一つ」
2. LinguaScript `.sfont`（`sfontHTML` 呼び出し約 40、例文・文法の行も）
3. 入力欄全体に `.tfont`（grammar.js:1824、letters.js:1401、wordsheet.js:1198。`myFontOn()` で出し分け。
   投稿欄 post.js:1575 だけ出し分けない）
4. カードの canvas（`inkAdv`、規則が認める）
5. 写真の上の字の canvas（`pwMarkLines`/`pwMarkRun`）
6. 写真の上の字の textarea `.sfont`（post.js:2511）
7. 下書き一覧 `.dfl`（生の PUA）
8. 通知・モデレーションの `p.ln` の生テキスト（sns.js:3330、mod.js:156）
9. キーボード拡張の候補欄（Swift）

違反［測った］:
- 写真の上の字が**切り方を逆に**: `pwMarkCut` が `postCut`（名前で切る、post.js:2723-2724）→ システム
  キーボードのローマ字が描いた字になる。Lingua キーボードの PUA は形 0。
- 写真の上の字は空白 440 固定・改行が消える（post.js:2730-2736、2758-2767）。`postRuns()`・`inkSpace()` を通らない。
- 暦の数字だけ `SET.myfont=false` を無視（numbers.js:268）。同じ暦の月名はオフに従う。借りた字 `Ж` も
  出る（numbers.js:269）── 2026-09-23「描いていない字はローマ字」（FEATURE_RULES 273 行、IMPLEMENTED と
  書く）と食い違い。
- 「一行を描く仕組みを一つに」の**決定が決定ログに無い**（CHANGELOG:437、STATE.md:72、CLAUDE.md:956 だけ）。
  例文・文法の行（2 番）が範囲に入るか → オーナーへ。
- `sfontHTML` のコメント「myFontOn をもう誰も訊かない」は偽（grammar.js:1824、letters.js:1401、
  wordsheet.js:1198、home.js:136 が訊く）。
- 〔r63 B1〕の `html[data-script=on]` は 0 件で直った。他は残る。

**覆う一文**: 「言語の行は、画面でも写真でもカードでも `postRuns()` で分け、形は `inkChar` か `inkAdv`
の一つの物差しで置く。打った通りか名前でかの切り方も一か所が決める。」
**検査が数えるもの**: 言語の行を出す要素の種類数（→ 決めた数）。写真の上の字の改行と空白。暦を
myfont オフで描いた時の形の数 = 0。`.dfl` の PUA = 0。

### 2-12. 字に形があるか・その形が何か

- `l.st` で答える所 11（numbers.js:65 `numBlank`、letters.js:1110 `ltSetStrokes`、letters.js:1022（改名で
  `st` だけ写し元を消す）、glyph.js:670、me.js:103 `meAvOf`、share.js:527,562、home.js:720、letters.js:80
  `ltStrokes`（呼び手 home.js:734、sound.js:230、wsys.js:256-263）、keyboard.js:1318）。用紙で書いた字の
  `sh` が見えない → 自動で消える（§2-8）、描き直しがどこにも出ない（`inkGeo` が `sh` を返し続ける）［測った］。
**覆う一文**: 「形があるか・何かは `inkGeo()` だけ、描けるかは `postInkOK()` だけが答え、形の一つ一つまで確かめる。」
**検査**: glyph.js:203-207 の外で字の `.st`/`.sh` を直に読む数 = 0。

### 2-13. お金の言い方・プランの書き手・カード

- **verify-plan が purchase を読めなかった時に free と書き、「プランが終了しました」も出させる**
  （index.ts:121 `held = mine.ok ? … : []` → `decidePlan([])` = 'free' → :159-161 で `was`・`lapse_seen_at=null`）
  ［読んだ］〔新〕。失敗が一度あれば払っている人のプランが下がる。同じ形が :96〔r63 S2〕、:156〔新・小〕。
  PAID_FEATURES「答えが無かったことを答えとして書かない」に反する。同時二回で `was` を取り違え得る〔r63 SQ7〕まだ
  （`storeSync` が boot.js:91 と net.js:742 と `storeCurAsk` から）。
- 知らない語を free に直す所が二つ（core.js:2067 `planGot`、:2309 `planTook`）。net.js:1523 のコメントと逆。
- 断り方: `popAsk(t('up.need'), go('plans'))` の手書き 7（core.js:1923,2024,2497,2547、keyboard.js:139、
  post.js:1988,3192）、直接飛ぶ 2（shell.js:1255、keyboard.js:3958）、「未回答なら接続できません」の枝 5
  （core.js:1916,2014,2495,2546、post.js:1987）。
- 天井の関数が 5 つ（`wordCap` core.js:1609、`postCap` 1634、`kbCap` 1656、`langCap` 1688、`dlCap` 1886）、
  それぞれ has() の段を自前で作る。数え方も二つ（`capBanner` home.js:17・settings.js:226 は `WORDS.length`、
  `capOK` core.js:2468・`wordsSeen` は `wCountable`）。
- 商品 ID が 3 か所（LinguaStore.swift:77-80、verify.mjs:39-43、store.js:222-223）、段の順が 3 か所
  （core.js:2284 `PLAN_ORDER`、verify.mjs:46、`plHave` settings.js:1139-1142 ── has() の梯子の書き直しで
  dead-check の「has は core だけ」をすり抜ける）。
- 天井の数が i18n 十言語の文に直書き（plan.free.2=100、plan.plus.4=1000、plan.plus.5「自作キーボード4つまで」
  ── 自分で組めるのは 3、plan.plus.6=1、plan.pro.6/7=3）、post.editplan は段の名前を文に書く。
  paid-check は i18n を読まない。
- Pro→Plus でキーボードが切られない（板 7 → `kbBoards` 7、単語は同時に 1000 に切られた）［測った］→ オーナーへ（何枚見せるか）。
- `feed_weight` schema.sql:2196-2200 が**無い列 `profile.paid`** を訊く → 倍率 4 は誰にも掛からない［読んだ］→ オーナーへ（`plan` 表から取ってよいか）。
- 決定と違う: 2026-09-04「上限のポップは Pro を言う」未実装・印なし（FEATURE_RULES 2004 行）。2026-09-03
  「買う画面には売っている物を全部書く」に対して noads（Pro）・編集（Plus）・投稿の文字数無限（Plus）の行が無い。

**覆う一文**: 「段を書くのは全部の問いが答えた時だけ。断るのは `upStop` 一つで、数の天井もそこへ畳む。
プラン×天井は一つの表に書き、天井・カードの行・i18n の数はそこから引く。」
**検査が数えるもの**: verify-plan の fetch 3 か所で `!ok` の時の plan への書き込み 0。www の中の
`go('plans')` 1 か所。`CAN` のキーと天井一つずつに PLANS の行があること。i18n の数字がその表と一致。

### 2-14. 画面の形（Shape・五つ目・箱・行の高さ・説明・色）

- **横スクロールの丸チップ列**: `.pktabs` home.js:349（openPick、15 個、354px に 1537px、しかも枠＋角丸）
  ［測った］── 禁止二つに同時に当たる。`.segs.scrollx` sound.js:211（母音の数だけ、上限なし。同じ画面で
  選んだ母音を変える ── 「選ぶと変えるが同じ画面」の候補 → オーナーへ）。
- **死んだシート**: `#sheet` index.html:3863 に書く JS が 0、CSS 3 本（:3054,:3058,:3059）、box-baseline
  `.sheet | border-radius`、act-check `SHELL_OK` がその onclick を免除し続ける（tools/act-check.mjs:678-681）。
  `closeSheet()` home.js:300 を偽のイベント `{target:{id:'sbg'}}` で 4 か所が呼ぶ（grammar.js:1970、
  phases.js:634、home.js:2435、wordsheet.js:2013）。
- **confirm でなく undo（十基準の 9）**: 消す前に popAsk で訊く所 17（mod.js:109,405、letters.js:1142、
  settings.js:671,747、grammar.js:1079,1981、words.js:435、keyboard.js:907,2668,4142、phases.js:647、notes.js:278、
  wordsheet.js:1118,2106、post.js:757,4340）、undo は 3 つだけ。決定ログは基準 9 を「合っている」に入れている。
  単語の一括削除は確認と undo の両方（words.js:435、473）。→ オーナーへ（取り消せない物をどうするか）。
- `.pmenu`（投稿・プロフィールの …）はアプリが描いた箱のドロップダウン。基準 1・3 との関係 → オーナーへ。
  ブロック・通報のボタンを二か所で書く（post.js:4224、me.js:1472）。
- **箱**: 描いた画面で角丸か四辺の枠を持つ要素 105 種類［測った］。baseline にあるから通っている字を囲った
  形: `.capwarn`（index.html:3514、4 画面、色 `rgba(201,168,106,.3)` の直書きで light でも dark の金）、
  `.meedit`・`.whfo`（金のピル）、`.povo`、`.pkclear`、`.abctl button`、`.obsrow`、`.mrep`、`.kbpat` →
  オーナーへ（baseline は許可ではない）。box-check は selector を数え、着ている所を数えない。JS の検査は
  `www/` 直下だけ（grammar-engine を見ない）、長い形（`border-top-left-radius` 等）を数えない。
- **行に margin-top で組**: 10 組［測った］。`.set` の削除行 7 か所が `style="margin-top:…;border-bottom:none"`
  （settings.js:207、import.js:724,779、keyboard.js:4237、phases.js:1101、sound.js:1267、wordsheet.js:1657）、
  `.wsub2` wordsheet.js:1907・words.js:475、`.field` settings.js:551、`.note` keyboard.js:3956、`.lnin.pwmn`
  index.html:1096。JS の文字列 `style=` 112、margin を含む物 43〜52［数えた］。
- **説明に当たりうる文**（検査では持てない、オーナーの目）: `stg.*.d`（phases.js:1083 → `stWhat()` :505、
  8 つ）、`num.wid.how`（numbers.js:470、何を押すかを教える）、オンボーディングの 3 文（onboard.js:2022,1696）
  ── **onboard.js:2012-2015 のコメントは「オンボーディングは説明禁止の対象外」と言うが、CLAUDE.md
  § Explaining にその例外は無い**、`kb.free.no/up`（keyboard.js:3956-3957、有料なら何ができるか）、プラン画面の 9 行。
- **色**: theme の色味 5（金・赤・青・緑・紫）、基準 6「2〜3 色」。決定ログの「合っていない所二つ」に入って
  いない**三つ目** → オーナーへ。theme の外の色: `.capwarn`、`.thbar` `#A5822F`（:3129）、`.sbg`・`.netspin`
  の幕を二回、core.js:2608 が `--bg` の値を重ねて書く。
- アニメーション（揺れ・回転・点滅・拡大）→ オーナーへ（基準 5）。
- act-check の on*= の正規表現は 9 種類だけ（`onload` `onerror` 等は通る）。face-check は `font-family:` しか読まない。
- 〔r63 CS1・CS2・CS3・kbghost・.play〕は**全部直った**。
- CLAUDE.md 規則 18「`.btn` is on about thirty older screens」は古い（`.btn` にもう枠は無い index.html:3012）。

**覆う一文**（面ごと）: 「横に動く列は一ページずつ送る物（写真・プラン）だけ」「`#pop` に描くのは `popPaint`
だけ、`#sheet` という物は無い」「リストの中の組は区切りの行で作り、JS は margin を書かない」「箱は着ている
所で数える」。
**検査が数えるもの**: 各面で `overflow-x:auto/scroll` かつはみ出す容れ物で `scroll-snap-type` の無い物。
shell の id で JS が触らない物。兄弟で `marginTop` が二つある組。角丸・四辺の枠を持つ要素の種類数と着ている
面の数（上げない）。`\son[a-z]+=`。

### 2-15. サーバー側（schema・functions）

- `npm run rls` を回した［測った］: `anon: 25 relations, 69 functions, 2 buckets -- all refused (1 allowed by name: email_taken)`、431 回試して 0 通過、76 項目すべてあり。
- **ブロック**: `post_seen`・`feed_hot`・`notices` に block の条件が無い（schema.sql:1518〜、2226-2263、2000〜）。
  端末は自分がブロックした相手を落とすだけ（post.js:128-139、net.js:3597）。block 表は actor しか読めない
  （schema.sql:1781-1783）ので、**ブロックされた側から見えなくする仕組みが無い**。決定 08-19「フィードは
  サーバーが外す」「検索は両側」と違う → オーナーへ（ブロックされた側から見えなくするか）。
- `daily-prompt/index.ts` は Authorization を自分で見ない（:88）。rls-check の面は functions/ を含まない。
  配置の verify_jwt が anon の JWT も通すならサインイン無しで叩ける（一日一回まで冪等）［読んだ、配置は未確認］〔新〕。
- 関数ごとの grant/revoke 35 行が足元の覆い（schema.sql:3217-3232）を言い直す〔r63 SQ4〕まだ。
  `post-media` を公開で作って :3257-3261 が覆い直す〔r63 SQ5〕まだ。
- アカウント削除で持ち主の無い行が残る: `publication.actor` :485、`report.actor` :924/939、`feedback.author`
  :973 が `set null`。net.js:5212-5215 は投稿一覧が取れなくてもアカウントを消すので post-media のファイルが
  残る。`account_delete` :2351-2358 は storage に触らない → オーナーへ。
- 版と消し方の決定どうしが食い違う（どれも「今」）→ オーナーへ: 期限なし・掃除なし（FEATURE_RULES 2096・1712）
  と「3 版だけ残して他は消す」（794、`slice_hist_keep`）／丸ごと戻す（1397）と部分ごとに戻す（794、
  `admin_restore(language, kind, at)`）／後から直した方が残る（1334、未実装）と「NEITHER SIDE WINS」
  （sync.js:11、DATA_SAFETY.md:59-61、EXPIRY.md:480-493）／番号はサーバーが配る（1595）と端末が no+1（net.js:2081）。

### 2-16. キーボード・route・名前・「一か所」

回した検査（調査の中で一度ずつ）: act・dead・page・word・kb・world・round・import は緑。**fill は 7 本並べた 1 回目だけ赤、
単独では 2 回とも緑** ── `fill-check.mjs:190` の `await wait(60)` が偽の回線の往復より短いことがある。「flake」ではなく
待ち方の問題（面は `glyphContours` 一本で穴は無い）。

**キーボードのシート（規則 19）**
- **寄せの幅と描く幅が別**（§4 にも）: `kbAlign1` keyboard.js:2422 は `kbCols(rows)`（一番広い行 :1593）で余りを測り、
  シートは `KB_COLS` 10 列固定 :2499 で描く［測った: 4 キーと 2 キーの板で 2 キーの行を右寄せ → `_:2 e:1 f:1`（8 列）、
  シートは中央に描き右端に着かない］〔新〕。決定 2026-08-26「ten fixed columns」（FEATURE_RULES:4870）が「間違った版」と
  書いた形そのもの、2026-08-27「右は右に着ける」にも反する。kb-check の寄せの試験は全部埋まった QWERTY の上だけ。
- **列の見出しで光るキーとゴミ箱が取るキーが別物**: 光る方は `kbLead` で短い行をずらしたシートの座標（:2514-2519）、
  `kbDelCol` は行頭を 0 に数える（:3574-3588）［測った: 10 キーの行と `X Y` の行で列 e → X が光り、`kbCut()` は 1 行目の
  k4 を取る］〔新〕。
- 間を埋めていない短い行は、シートでは中央、拡張では行の合計で割って横いっぱい（KeyBoardView.swift:168-172）。
  `kbFillRow` のコメント :446-450 がそれを避けると書くのに `saveKb` 後の `X:1 Y:1` は埋まらない［形は測った］〔新〕→ オーナーへ（手で作った短い行の扱い）。
- **巻き戻しの履歴が言語をまたぐ**: `kbNoted` は板を位置で名指す（`id=String(kbShow)` :3613）、`KBU` は `viewReset()` に
  無い［測った: 言語 A の板 1 を編集 → `viewReset()` → 言語 B の板 1 で `kbUndo()` → B に A の配置］〔新〕。規則 19 が
  直したと書く形の別の道。
- **選択 `KBH` が画面を離れても残る**［測った: 行 3 を選ぶ → フィード → 戻る → 行 3 が光ったまま、ゴミ箱が押せる］。
  コメント keyboard.js:3636「viewReset() clears it on the way to another screen」は偽（viewReset は言語が変わる時だけ）〔新〕。
- 「横 10」の比べが `kbRoomFor` の外に 3 つ（`kbRoomCol` :2300、`kbFacePut` :726、`kbLayRoom` :4048）、行数の天井も :729・:4049
  が `kbRowsMax()` を直に見る。`kbFacePut` と `kbLayRoom` は「層キーの場所があるか」を二度答える〔新〕［読んだ］。
- 「無料の板は触らない」が `kbEdit()`（:1269-1272「一か所が断る」）の外に 5 つ（`kbIsFree(kbShow)` :1732, 1849, 3809, 3817, 4175）。
  `kbSetPat` :3814-3822 は `kbEdit` を通らずに `KB.kbs` を書く〔新〕［読んだ］。
- `kbCellAdd` は引数があれば選ぶだけ、無ければ `kbCellPut`（:1730-1731）── 一つの名前で二つのこと。CLAUDE.md 規則 19
  「`kbCellAdd()` … asks `kbRoomFor()`」は偽（訊くのは `kbCellPut` :1794）。
- 〔r63 K1〜K5〕K1〜K4 まだ（K5 の App Group は直った。`render()` から `sharePush()` glyph.js:2997 は残る、§2-3）。
- 天井の数は JS 6 か所（keyboard.js:1499-1500, 1555）と Swift 4 か所（KeyboardViewController.swift:38,43,51,189）、kb-check が
  突き合わせている（kb-check.mjs:3419-3430）── ここは覆われている。
- 古いコメント: keyboard.js:31-37「三つまで」、:150・:350-353（`bkSound` `bkOK` `bkPush`）、:402-403〔r63〕、:1560-1563
  （足元の点線・幅を落とす）、:1755-1757（幅選び 1〜4）、:3245・:4596（⊖）、:4569-4573（関数の無いコメント）〔新〕。

**覆う一文**: 「シートの座標は一つ、`KB_COLS` の 10 列。行は保存の時に 10 に埋め、寄せ・列・光り・挿入・ゴミ箱は全部
その座標で数える。選択と巻き戻しは今いる板・今の画面の物で、画面を離れたら忘れ、板は `kbId` で名指す。」
**検査が数えるもの**: どの板でも `kbUsed(row)===KB_COLS`。全ての行と列で「光るキーの集合＝ゴミ箱が取る集合」。
画面を一つ離れた後に `KBH`・`KBU` が空。`KB_COLS`・`kbRowsMax` を比べる所の数（1 か所ずつ）。寄せの試験を
10 未満の面でも。

**§ One place, not fifteen ── 名指しの 13 のうち 7 に別の道**
- `viewGone`: keyboard.js:4199（`kbKeyHTML`）・:4430（`kbLtHTML`）が `'<div class="note">'+t('form.gone')` を自前で描く。
  page-check が `viewGone` を名前で除くので見えない〔新〕。
- `ltInk`: numbers.js:216-226 `numFace` が三つの判断の写し。`ltHasShape`（letters.js:82）と `ltDrawn`（letters.js:570）は
  同じ問いの二つの名前で、両方「一か所」と書く。numbers.js:221-223「ltHasShape() は inkGeo を訊かない」は偽〔新〕。
- `pwMn`: post.js:2135（pwSend）と :3203（pwSaveEdit）が `toNatural(gModel(), ln, uiLang())` を自前で書く。:2132-2134
  「Not stored」は偽〔r63 G1〕まだ。
- `toNatural`: 例文は `exGloss` で語を置くだけで並べ替えない（wordsheet.js:414-417、`exRowHTML` :467、card.js:151）
  ［測った: `kano sar tir` が例文 "mountain river to see"、投稿 "mountain to see river"］。空白で割るのも `/\s+/`
  （wordsheet.js:410,415）で `postRuns` でない〔新〕。
- `postWho`: 通知は `r.who||r.hd`（net.js:5289、@ に落ちる）、投稿は `p.who||p.lname`（言語名に落ちる）〔新〕。
- `.sfont`/`sfontHTML`: §2-11。CLAUDE.md § One place の `.sfont`/`!important` の段落は要素に掛ける方式を書くが、
  今はランごとの span〔r46 B1〕一部。
- `viewReset`: `g2Lift`（grammar.js:727「立っている場所」）が越えて残る［測った: 次の言語の最初の `g2Move('np',1)` が
  `STG.gpos.np` を書いた］、`KBU` も（上）。入っていない候補: `ntAt` notes.js:44、`stExNew` phases.js:753、`fmrOpen`
  wordsheet.js:1229、`sndFor` sound.js:462、`pkFor` home.js:312、`snsFilAsk` sns.js:261、`SH` sheet.js:839、`openHw`
  wordsheet.js:193。sheet.js:838「viewReset() が SH を落とす」は偽。**そして `viewReset` は通知を読みに行く**（§1-3）。
- **長押しが 4 つの仕組み**: shell.js:1592（500ms・10px）、keyboard.js:3197/3258（380ms・半径 12px）、letters.js:305/331
  （380ms・12px）、home.js:1428/1441（380ms・8px の四角）。決定「長押しのしきい値は 10px」（FEATURE_RULES:2868）と食い違う
  → オーナーへ（決定が「持って運ぶ」にも及ぶか）。端のスワイプ 30px も三つ（shell.js:1927、notes.js:200、home.js:546）。
- 問題なし: `rootTop`、`snsNone`/`emptyBox`、`inkStrokes`、`geXY`、`ltCodes`、`exRowHTML`。

**覆う一文**: 「一つの問い（消えた・字の顔・意味の既定・訳・人の呼び名・自作文字で出すか・長押し・立っている場所）
には関数が一つ、画面はそれを呼ぶ。同じ形の値やしきい値を書かない。」
**検査が数えるもの**: 描いた頁の `t('form.gone')` を含む要素が全部 `goneBox()` から来ること（包んで数える）。訳の関数が
呼ばれる所ごとに一つ。`setTimeout(…,N)` と `clientX` の移動量の比べの数。act で書かれるトップレベルの var が全部
`viewReset`・`viewLeft`・名指しの除外表のどれかにあること。

**規則 5**: acorn で到達可能性を取ると 2925 のうち届かないのは 3。`kbAddKey` keyboard.js:4560 と `kbRoomIn` :1579 は
アプリの中から誰も呼ばず、呼ぶのは `tools/kb-check.mjs:494` だけ［測った］── dead-check は tools/ の言及も言及に数える
（dead-check.mjs:169-174）ので、**検査だけが呼ぶ関数が生きていることになる**〔新〕。書くだけで読まない物の検査は
トップレベルの var だけ（`SCRIPT.extra` core.js:1260 は写されて保存されるだけ ── 言語のデータなので消さない）。
**覆う一文**: 「生きているとは、アプリの根から呼び出しを辿って届くこと。」

**規則 14（二度目の押し）**: 自分の投稿をそのスレッドの上で消すと「That is no longer here.」に置かれる ── `postDelDone`
post.js:4359-4379 は `navDrop` を呼ばず form の時だけ `back()`［測った: trail `feed > thread:p1` のまま、画面は goneBox］〔新〕。
`photo:<id>` も同じ道のはず［読んだ］。`navDrop` の落ちる先が `[{r:'words'}]` 固定（shell.js:843）。`navRename` は `form`
しか見ない（shell.js:819-822、BACKLOG にある）。
**覆う一文**: 「名指している物が消えた route は、種類に関わらず trail から消える。」
**検査が数えるもの**: act の delete 系の押しを全部その物の画面の上から押し、押した後に `here()` が `viewGone` を描かないこと。

**規則 4・21**: `render()` に view の無い route を `vProfile()` で黙って描く落ち先（glyph.js:3007）。route-map.js の頭
「www/screens.js has PAGES」（無い、PAGES は shell.js:977）。CLAUDE.md 規則 4「`vOb` は `SET.done` まで」（今は
`SET.walked`）。page-check: 41 route のうち名前のある関数が描くのは 3、inline 29。一つの view に `class="view"` が複数
（vGram 3・vKb 3・vAdmin 3・vAbugida 2・vPlans 2・vFm 2・vDrafts 2）── どれも顔の違いに見え、違反とは言わない。

**規則 7・15・16・20**: 違反なし（fill の待ち方は上）。

**§ Names**（関数 2367）
- `set*` で SET を書かず設定画面も作らない物 9: `setWldHide` home.js:1196、`setWldSecDl` home.js:1264、`setLtFil`
  sound.js:841、`setWsys` wsys.js:132、`setScriptDir` wsys.js:322、`setScriptSp` wsys.js:394、`setOrder` grammar.js:125、
  `setNpOrder` grammar.js:144、`setGPos` grammar.js:191。
- 一つの接頭辞に二つの意味: `ab*`（home.js の「この言語について」と sound.js・wsys.js の abugida）、`kb*`（shell.js:2058-2066
  のシステムのソフトキーボードと keyboard.js）、`ge*`（`geSide` glyph.js:132 は言語の字間で post・share・card が使う）。
  `ws*` が sound.js:45-103（vWsys が sound.js にある、章とファイルが食い違う）。
- 裸の動詞: `save` core.js:1448、`pick`・`taken` reading.js:53,62、`analyze` core.js:2798、`parts` :2658、`syl` :2633
  （`go` `back` `render` `t` `can` などを例外にするか → オーナーへ）。
**覆う一文**: 「接頭辞はその関数が書く物（描く画面）の章。`set*` は SET か設定画面。一つの接頭辞に意味は一つ。」
**検査が数えるもの**: `set*` の本体（辿った先を含む）に `SET.x=` が無く settings.js の外にある物の数。接頭辞→ファイルの
表の外にある関数の数。

### 2-17. 書いてある事が今と違う（FIX THE RULE、docs-check の穴）

**面の大きさ**: 決定ログで status が古い項 26（FEATURE_RULES の 418, 641(b), 794, 823, 859, 888, 1250, 1526, 1559,
1762, 2025, 2274, 2412, 2482, 2575, 2659, 2740, 2771, 2868, 2973, 3013, 3060, 3133, 3169, 3224, 3293 行の項）。
差し替え済みの本文が残る 6（1107, 1136, 1498, 1663, 1952, 2120）── 2026-09-03「古い規則は残さない」（2309 行）
そのものに反する。印の無い superseded（前半 5: 1374, 1790, 2004, 2096, 2801 ／後半十数: 08-28「上がっていない
言語を守る条件」「Documents のバックアップ」「全部の升」2 番、08-26「サーバーの範囲」2・3、08-26「同期は常に」2、
08-23「広告の作り方」、08-13「プランが終わったら」4、08-11「データ安全」、08-13「言語の行」のデータ、08-13
「打つ欄は普通の字」、08-23「noads は CAN に入れない」、08-25「扉は押したら飛ぶ」）。
**ログに無い決定**: 2026-09-05「全部一気に」（§1-1）、09-05「半キーを追加できるのやめて」（CHANGELOG:5745）、
09-06「設定へのボタンは手順 3 だけ」（keyboard.js:3939 と kb-check が持つ。ログは 09-03「両方」を IMPLEMENTED
と言う）、09-23「一行を描く仕組みを一つに」、09-23「活用形は語ではなく形」（STATE.md:37-41）、08-26 の 0.55・
天井 7 を置き換えた 0.5・5。

**CLAUDE.md の古い文**:
- 規則 22「Not built yet. The slices are in memory only, so with no signal there is nothing to show today」
  ── `.got` の写しがある（core.js:820-835、`slRd` が落ちる）。
- 規則 12 末尾「That is a fault in card.js, and it is not held by anything yet」── CD1 は直り card-check が持つ。
- 規則 6「Migration from the eight flat keys copies」（`langMigrate`・`LS_FLAT` は無い）、「twenty-eight slots /
  thirty-one」（今は 38、基数 12 なら 40）。規則 6 の送るタイミング（打ち終わりで送る）は決定 1595「保存を
  押した時だけ・一文字ごとには飛ばない」と食い違う → オーナーへ（どちらが今か）。
- 規則 9「glyph.js ends with … render() → goes last」── 最後は boot.js。
- 規則 10「`ltPuaOrder()` … four ask it」── 5 つ（wsys.js:371,381 が加わる）。
- 規則 18「`.btn` is on about thirty older screens」（上）。
- 規則 19「the width of the frame it was」（09-05 の半キーの決定の後）。
- 規則 20「公開は `world().hide` を書く」── `language.published_at`。
- § What the free plan is:「! and ? at the ends of the space bar … the delete two keys wide … ten, nine, and seven」
  ── `kbFixed` は削除 3 幅、下段は `! ? space return`（1+1+6+2）。表「the screens … each drop what free cannot use」
  は 2026-09-01「全部の段で同じ画面」と逆。
- § Names の `setPlan`（無い）。§ The gate「the fast nine」── FAST は 18（gate.mjs:42-52）。
- § Explaining にオンボーディングの例外が無いのにコードがそう主張（§2-14）。

**STATE.md の古い文**（:502, 594-601, 872, 955-960, 1100-1107, 1150-1159, 1496-1500, 1592-1598, 1639, 1656-1657,
1663-1664, 1762-1764, 1796-1801）と **FEATURES.md の古い文**（:45, 50, 71, 72, 86, 88, 89, 94, 100, 107, 119, 258,
273, 297-301, 343, 345-347, 365-373, 401-402, 458-467, 522-557, 565, 645-657, 670, 681-684, 704-710, 729）── 中身は
§付録 C。**PAID_FEATURES.md**: :193「If the check fails, fail toward the free plan」・:634・:719 が同じファイルの
§ 三つ目の状態と矛盾（2026-09-11「未回答は free ではない」が勝つ）、:216・:752 バックアップ、:757 `was` 列、:766、
:797、:803、:262 `LinguaStore.plans`（実際は `ids`）。**DATA_MODEL.md** :25・:46（localStorage）、:35-41 `bkn`、:77。
**コード内コメント**: core.js:214,241,288 `langNameOld()`（無い）、net.js:922-924 `LANGS[id].uid`（消えた）、
schema.sql:226-227「private backup」・:243-246「anonymous account」・:351-369「Eleven slices」「no が守る」「bkPack()」
〔r63 C〕まだ、store-check.mjs:120、backup.js 頭〔r46 A4〕、sns.js:257-260（`snsFil=null` は shell.js:75 にある）、
core.js:1291-1293・2111-2113「LinguaPlan.swift はまだ書いている」、core.js:2047・net.js:651 `netPlanSync`〔r63 C〕、
core.js:2296-2305・2575-2594・words.js:131 `capLapse`〔r63 C〕、core.js:1628、LinguaShare.swift の声の節
「localStorage is where the languages live」、sides-check.mjs:302、post.js:2127「Not stored」〔r63 G1〕、
kb-check.mjs:2091-2094、EXPIRY.md:10。

**docs-check の穴**: 今は backtick の `name(` しか数えない。**裸の識別子**（`PLAN_BUY` `ME.fo` `SET.wsys` `setPlan`
`obBackTo` `PLAN_NATIVE` `openMePic` `lsWipeNS`）と**検査名**（`backup-check`、`acct-check 40c`）は通る。
`tools/docs-baseline.txt` が FEATURE_RULES の無い関数 32 個（`bkPack` `netTakeGone` `planKeep` `langOwned` `geDirty`
`kbSlots` ほか）を凍らせて免除している。

**覆う一文**: 「後の決定が置き換えた項には、置き換えた日付と見出しを付け、古い本文は消す。付けるまで決定は
通っていない。コードのコメントにある OWNER の日付は、決定ログに見出しがある。」
**検査が数えるもの**: backtick の中の識別子全部と検査名が定義されている／存在すること（決定ログは superseded
の印のある項だけ免除）。「SUPERSEDED／差し替え済み」の見出しの下に本文が残る数 = 0。`www/`・`tools/` のコメントの
「OWNER 2026-MM-DD」のうち、決定ログにその日の見出しが無い数。ゲートの本数など数の文（数は gate の最後の行から読む）。

---

## 3. 直書き（同じ値・同じ判断が二か所以上）── 面ごとの全件は §付録 A

| 面 | 数 | 覆う一文 |
|---|---|---|
| localStorage の鍵 | 定数 5 つあるのに `'lingua.'`＋何かの組み立て 10 か所（core.js:100,126,556,677,724,985,1004、post.js:84、shell.js:537,557）と core.js:131 の文字列の並び | 鍵の形は一関数 |
| slice の読み書きの形 | 書き手 7 つが同じ 3 行を手書き、`saveTry()` で包むのは `save()` だけ（core.js:1451）。読み手 10 が同じ try/parse。keyboard.js:102・144 は同じ slice を二度読む | slice の読み書きは一関数（`LANG_IO` core.js:229 は名前を並べるだけ） |
| 長さ・時間 | ハンドル長 me.js:381（`ME_MAX`）と onboard.js:1546（`<2 \|\| >24` 直書き）。キーボード名 24 が 3 回（keyboard.js:997,1000,1004）。ファイル名 slice(0,40) 2 回（card.js:1095、sheet.js:1192）。storage の一括 100 が 2 回（net.js:5168,5240）。長押し 380ms 3 回（home.js:1428、keyboard.js:3197、letters.js:305）・480（post.js:453）・`HOLD_MS=500`（shell.js:1592） | 人に見える上限と時間は名前つき定数で一度だけ |
| 種類名 | 'opinion' が net.js:3691,3908 と settings.js:426-431,477（`CONT_KINDS` は settings.js:427）。'like'/'boost' が net.js:5048、post.js:1252,1258,4150,4157、sns.js:3297、push.js:70 `PUSH_KINDS` と別 | 種類は表 |
| route と pull の名前 | route を文字列で比べる所 69、うち `'form'` 19 か所 10 ファイル。pull の鍵を各ファイルで文字列に: `'mylangs'` boot.js:136・me.js:903・net.js:783・sns.js:1021、`'mine'` me.js:902,1743,1766・sns.js:1013、`'notif'` shell.js:84(×2),1532・sns.js:991,3411 | — |
| インラインの style | 文字列 `style=` 112（22 ファイル）、`.style.x=` 68、`border-bottom:none` 6 回 | JS は見た目を書かない |
| 「測り直すまで最大 10 フレーム待つ」 | GEFIT glyph.js:1727 と SH_PVFIT sheet.js:976（コメントに「same bounded retry」── 写し） | — |
| 読み込み順の保険 | `typeof X==='function'/'undefined'` 99 回・67 の名前（全部 index.html が読む名前） | 保険は置かない（規則 9 が順番を持つ） |

## 4. 継ぎ当ての跡

- **if が 15 以上の関数 8**: `wldPage` home.js:2038（369 行・if 29・早期 return 10）、`impPut` import.js:905（25）、
  `shScan` sheet.js:622（25）、`pageName` shell.js:1036（19・早期 13）、`geUp` glyph.js:2120（16）、`kbDragTo`
  keyboard.js:3251（16）、`netLangsWalk` net.js:2158（201 行・16）、`impRows` import.js:433（15）。早期 return が 4 以上の
  関数 70（上位: `kbSelSpread` 11、`netWhy` 10、`g2Said` 9、`kbRunMove` 8、`kbFace` 8、`syMerge` 8、`netSaveUpGo` 7）［数えた］。
- **「他のセッションの持ち物なので後で」と書いて別の道で埋めた所**: onboard.js:1841-1846（描画の後処理が
  二つの道、`postLines` だけ `setTimeout(…,0)`）、home.js:2412-2420「Until then it says true」。
- **タイマーで順番を合わせる**: `setTimeout(…,0)` 4 か所（net.js:262、onboard.js:1846、post.js:1696、voice.js:267）。
- **試して、だめなら別の道**: `netDraftUp`（PATCH 0 行なら POST、5005→5009）、`netLangRow`（GET→POST、409 なら既に
  ある、1659/1709）、`netTakePut`（409 なら netTakes、1922）。
- **「答えた」の記録が二つ**: `PULL_GOT`/`PULL_HAS` と `SNS_GOT`（§1-3）、`WLDS_HAVE`/`WLDS_ASKED`（home.js:1897）、
  `DAY_GOT`、`NOTES_HAVE` ── pull の表（sns.js:763）が「一つの道」と書くのに、その外に自前の旗が残っている。
- **「何か打ってあるか」を二つの関数**: `pwOn`（`puaRoman` を通す、post.js:309）と `pwSideHTML`（生、:274）。
- **Undo と確認の両方**（words.js:435・473）、**ブロック・通報を二か所**（post.js:4224、me.js:1472）。
- **寄せの幅と描く幅が別**: 描画は `KB_COLS` 固定（keyboard.js:2479-2498）、寄せ `kbAlign1` keyboard.js:2414-2445
  は `kbCols(rows)`（一番広い行、keyboard.js:1593-1600）［測った: 行 [1,1] と [1,1,1] で行 0 を右寄せ → 6 列目で止まる］。
- **守りの前に抜け道**: `ltSetRoman` letters.js:953 で数字の名前は `ltIsBase` の拒否（:957）より先に `ltToDigit`
  （:1048-1061）へ ── 無料で枠 'a' に '3' → 枠が `#3` に、無料の QWERTY の a が描いた字を失う［測った］。
  画面は名前欄を隠す（letters.js:915）ので今の UI からは届かない。決定 08-22「枠の名前は変えられない」の
  「関数で守った」が半分偽。

---

## 5. オーナーへ（決めない）

決定ログに答えがある物は見出しを添えた。

1. 起動で読む物の境（§1-1 #7 お題、#19 凍結、#21 設定、#22 プラン）── 2026-09-23 の決定の「通知とタイムライン
   だけ」に、お題の行・凍結の判定・テーマ／言語・プランが入るか。
2. 二台で同じ物を触った時の解き方（slice.no、prefs、下書き、顔）── § Deciding。版と消し方の四組の食い違い（§2-15 末）。
3. 持ち主の印が無い古い言語や写しを誰の物にするか（§2-7、今は最初に入った人の物・公開で作られる［測った］）。
4. `notAt` をサーバーに置くか（sns の決定と規則 22）。非公開の投稿 `pv` は端末だけ（post.js:1281）〔r63 A5 別件〕。
5. アカウント削除で残る物（`set null` の行、post-media、Documents の Voices/Sheets）。
6. ブロックされた側から見えなくするか（§2-15）。`feed_weight` を `plan` 表から取ってよいか。
7. プラン: Pro→Plus のキーボードの枚数と適用中、Plus カードの「4 つ」か「1+3」か、上限のポップの文（2026-09-04 の
   決定が未実装で印なし、Pro でも 3 の天井に嘘になる）、スタッフを外した後の次の verify で free と「終了」が出ること、
   Ask to Buy の反映、古い購入の持ち主（2026-09-23「古い購入の持ち主は考えなくていい」がある）。
8. カードの描いていない字の大文字・字間（§2-9）。キーボードのキー面の `ch` が「描いていない字はローマ字」に入るか。
   例文・文法の行が「一行を描く仕組みを一つに」の範囲か。
9. 画面の形: `.segs.scrollx`、`.pmenu`、baseline にある字を囲った形 9 種、確認 17 か所を undo にするか、説明に当たりうる
   文（stg.*.d 8、num.wid.how、オンボーディング 3、kb.free、プラン画面）、色 5 つ（基準 6）、アニメーション。
10. 決定 08-19「公開と DL」6 番と 2026-09-01「DL 言語は編集できない」の衝突。
11. CLAUDE.md 規則 6「打ち終わりで送る」と決定 1595「保存を押した時だけ」のどちらが今か。
12. 決定 1227「増えた文字は消してよい」が自分で書いた期限（リリース前）が 09-22 の公開で切れている。
13. キーボード: 手で作った短い行を保存の時に 10 まで埋めるか／拡張をシートの描き方に合わせるか（§2-16）。
    長押しの 10px（決定 2026-09-01）が「持って運ぶ」にも及ぶか。
14. 欄を自作文字にするか: 2026-08-13「A field is in ordinary letters」（FEATURE_RULES:6250）と 2026-09-23「一行を描く
    仕組みを一つに」・letters.js:1398 の引用が食い違い、どちらにも superseded の印が無い。
15. 裸の動詞の例外をどこまで認めるか。

---

## 6. r63・r46 の今（このファイルで確かめた分）

| 項 | 今 |
|---|---|
| r63 0-1（写しが上がる） | まだ［測った］ |
| r63 0-2（migrateKbFree・langSaveAll・netAvSync） | まだ（netAvSync は測った） |
| r63 0-3（未回答を free） | まだ、面は単語より広い（§2-3） |
| r63 0-4（slice.no 後勝ち） | まだ［読んだ］ |
| r63 CD1〜CD5（カード） | 直った（CD1・CD5 測った）。キーボードの調査は card.js:890 を読んで「CD1 は残る」と書いたが、測った方（他人の ink 無し投稿 → 形 0・本文テキスト）を取った |
| r63 CS1〜CS3・kbghost・.play（CSS） | 直った |
| r63 B1 `html[data-script=on]` | 直った。他の B1 は残る（§2-11） |
| r63 K5（App Group）・S1（Keychain） | 直った |
| r63 S2・S4・S5・SQ1・SQ4・SQ5・SQ7・L1・L2・L3・L4・R1・R3・A6・K2・K4 | まだ |
| r63 S3（`setPlan`） | 直った（消えた） |
| r46 A1〜A5 | まだ |
| r46 C（FEATURES.md の古い文） | まだ、増えている（§2-17） |
| r46 付録（docs にあってコードに無い名前） | docs-baseline に凍らせてある物が 32（§2-17） |

---

## 7. リーダーの指示と違った所

- brief「起動の瞬間に 22 本」→ 同じスクリプトで 22 本を再現したうえで、広告枠を 1 件以上返すと **23 本**（`promo` の答えを
  受けて `post_seen?id=in.(…)` がもう一本、§1-1 #5）。リーダーの偽サーバーは `promo` に `[]` を返したので出なかった。
- brief の並行セッションの規則 7「全ゲート28本」→ `tools/gate.mjs:42-52` は FAST 18＋SLOW 33 の 51。CLAUDE.md「the fast
  nine」、STATE.md:872「39 checks」も違う（§2-17）。数は gate の最後の行から読むべきで、brief に数を書かない方がいい。
- それ以外（`wldSlicesPull` が kinds を絞らない、↓ は写すだけ、フォロー一覧・下書き・広告枠が上限なし、タイムラインの
  二つの面、PATCH）は測って正しかった。

## 8. 見ていない物

- 端末では何も。本物の Supabase・本物の回線では何も（偽のサーバーは即答する。競走の勝ち負けは変わりうる）。
- ゲートは回していない。回したのは `npm run rls`・`box-check`・`face-check`・`sides-check`・`assets-check`・`docs-check`
  （どれも調査の中で一度ずつ、緑）。
- 44pt（press）、10 言語での見た目、dark の計算後の色、スクリーンショット（見た目は何も変えていないので見せる物は無い）。
- Swift の中（キーボード拡張の描画・Compose・GlyphView・LinguaAds の大半・LinguaStore の置き場）、verify-plan を Deno で
  動かすこと、daily-prompt の配置設定。
- 壊れた slice を空と読んだ後に空が上へ送られるか（§2-4）、`migrateGramLang` の害（読んだだけ）、letters.js:1022 の
  改名で `sh` が消える件（読んだだけ）、別のアカウントでサインインした時の `SNS_GOT`（同じアカウントでだけ測った）。
- grammar-engine/ の中身、translate.js、sheet.js の読み取りの中、STATE.md のビルド記録の節の各行。
- 説明文は英語で読んだ。選ぶと変えるが同じ画面は機械で vAbugida しか挙げていない。

---

## 付録 A. 全箇所（面ごと、行番号だけ）

- `!netSignedIn()` の関数頭（net.js）: 195,995,1098,1120,1157,1288,1317,1344,1370,1407,1426,1433,1518,1555,1643,1788,1832,
  1895,1921,1959,2361,2419,2838,2905,3318,3411,3501,3579,3644,3689,3739,3785,3790,3838,3856,3900,3922,3927,3950,3955,3964,
  3969,3986,4376,4393,4399,4451,4458,4544,4759,4896,4999,5026,5035,5048,5099,5209,5278,5329,5352
- 空の catch: act:79, core:889,1255,1256,1278, home:856,1916, import:150, keyboard:102,144,3087, letters:36, me:148,
  net:90,136,398,2596, notes:19, phases:77, post:44,102,104, shell:565,566,567, sound:252
- catch で null/[]: core:576,2211, glyph:726, me:189, onboard:551, phases:171,682,725, post:472
- JS の margin を含む `style=`: card:86,98, grammar:1951, home:260, import:644,722,724,777,779, keyboard:3952,3956,3958,4237,
  4423, me:1319,1571, mod:651, onboard:2109, phases:610,1101, settings:207,272,551, sheet:955,1255, shell:1255, sound:208,786,
  1015,1255,1258,1267, words:475, wordsheet:402,528,582,800,962,1614,1657,1856,1907, wsys:361
- `limit=1` の GET（net.js）: 1121,1145,1289,1345,2028,2900,3414,3502,3649,3743,4107,4198,4203,4891

## 付録 B. サーバーを読む関数（net.js、呼び手は grep と §1 の測った履歴）

| テーブル | 関数 行（limit・ページ送り）← 呼び手 |
|---|---|
| profile | netMyProfile 1121（1）← onboard:946 / netHandleFree 1145 / netProfSync 1289 ← boot:149 / netPrefsPull 1345 ← boot:153 / netStaff 3743 ← netTook:824 / netWhoseId 3414・netPairRow 3502・netReport 3649（handle→id） / netStaffList 3839（**無し**）← mod:342 |
| profile_seen | netWho 4107・netWhoMany 4091 ← me:747,788 / netFindWho 4139（keyset）← sns:2513 / netBlockedRead 3612（id=in） |
| post_seen | netFeed 3234/3267（50、`more` あり・**呼ぶ人なし**）/ netPostCounts 4196・netPostById 4202 / netPromos 4226（**無し**）/ netReplies 4266（50、送りなし）/ netPostsBy 4292（keyset）/ netFindPosts 4329（keyset） |
| rpc | feed_hot 3299（lim・off）、feed_fo 3335（lim・before）、notices 5283（lim、送りなし）、admin_counts 3987、admin_hist 5330 |
| language | netLangRow 1659/1709 / netLangDrop 1789 / netLangPublic 1836・netLangNamePut 1863・netLangWsys 1976 / netLangsDown 2362（**無し**）/ netTakenDown 2429（**無し**）/ netSaveUpGo 2900（1、回線の確認） |
| language_take | netTakes 1896（**無し**）、netTakePut 1922、netTakeDrop 1960 |
| language_seen | netLangSeen 2027（1）← home:1827（描画の中） |
| slice | netSlices 2064（**無し**、既定で body 込み）← home:1902（人の言語を丸ごと、描画の中）、net:2269,2279,2720,2729,2735 / netSlicePut 2092 |
| follow_seen | netFollowRows 3450（**無し・送りなし**） |
| block | netBlockedRead 3597（**無し**） |
| promo | netPromos 4221（**無し**） |
| draft | netDrafts 5027（**無し**、body 込み） |
| post | netPush 4946 / netDrop 5102 / netDropMe 5210（`select=body&author=me`、**無し**） |
| その他 | saved/recent 4377（50、送りなし）、report 3857・feedback 3901（lim、送りなし）、prompt 4880・4891、device 1409・1427、verify-plan 1519、plan_lapse_seen 1556 |

## 付録 C. STATE.md と FEATURES.md の古い文（中身）

- STATE.md :502「いまの状況（一番新しい）」の上に 09-06〜09-23 の節 / :594-601「save() の catch は空・着手していません」
  「電波が無いと出せる物が無い」（`saveTry` core.js:881、`.got`）/ :872「39 checks（12+27）」、:1496「six fast ones」、:1500
  「thirty-two」（gate.mjs:42-52 は FAST 18＋SLOW 33）/ :955-960 `OB_DRAW=0…`、`obFinish()`→`netLangSync()`（onboard.js:145 に
  `OB_SNS`、送るのは `netTook`）/ :1100-1101 プロフィールの ⋯（`whoMore` me.js:1252 がある）/ :1102-1103 規約（settings.js:1302、
  onboard.js:1497）/ :1104-1107・:1150-1152 `setPlan`・レシート未（`plBuy`、verify-plan）/ :1157-1159・:1796-1801 Keychain・
  `PLAN_NATIVE`（無い）/ :1592-1598 なぞった PDF は読めない（`shPdfDraw` sheet.js:1399-1411）/ :1639 Shipaton 未決（08-25 に決定）/
  :1656-1657 `obBackTo`（無い）/ :1663-1664「天井は capStop 一つ」（`langStop` `dlStop` `upStop` post.js:2059 もある）/ :1762-1764
  自動更新の文が無い（en.js:1295 `plan.renew`）。
- FEATURES.md :45 `SET.wsys`（`language.wsys`）/ :50 `npm run ask` / :71 postCatchUp〔r46 A5〕/ :72・:100 `ME.fo` / :86・:89
  `post.pic`（`pics` 配列）/ :88 言語は localStorage / :94・:119 三層・NOT BUILT（第三層は無い）/ :107・:565 四つのスイッチ（5、
  `device`・push-send はある）/ :258 dir は Plus（`CAN.dir` は pro）/ :273 サーバー側は未 / :297-301 Keychain・`window.__plan` /
  :343 `CAN.data` / :345-347 Documents / :365-373・:670・:704-706 起動で一回（保存のたび）/ :401-402 DL キーボードの棚 3 /
  :458-460 サーバーがブロックした作者を外す（外していない）/ :463-467 staff の行（見出しを 7 回タップ）/ :522・:542-544 「データを
  消去」とバックアップ（ja.js:819「アカウントを削除」）/ :527-531・:681-684・:554・:709-710 `bkDropAll`・slice の鍵 / :534-540 答え
  に関わらず空に（成功した時だけ、settings.js:794-797）/ :645-650 DL 言語を読むのは次の仕事（:104 は shipped）/ :651-657
  `slice_read` は持ち主だけ（`slice_dl`）/ :729 段の順（`OB_SNS`）。
