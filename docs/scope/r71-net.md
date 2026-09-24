# r71-net — 読む時は画面が決める（決定 2026-09-23、r73 §1・§2-1・§2-5・§2-6）

指示書: `claude/leader-briefs:docs/scope/brief-r71-net.md`。土台 `integ-0905`、ブランチ `claude/r71-net`。

## 覆う一文

**読む時は画面が決める。** 起動が読むのは二つの画面（`PAGE_OPEN` = タイムラインと通知、`www/sns.js`）と、
最初に出る画面と、セッションそのもの（token・プラン・アカウントの行）だけ。それ以外の画面は、進む時に
一つの扉（`navLand()`、`www/shell.js`）が、その画面の行（`PAGE_READS`、`www/sns.js`）に書いた分を読み終えて
から出る。描画（`v*`）と `viewReset()` は何も読まない。一覧は `NET_PAGE` で切り、底で続きを読む。人の言語の
章は ↓ で落とし、⭕ が満ちる（進みが取れなければ回る）、済んだら ⭕☑️。サインインしているかは窓
（`netSend1`）だけが決め、私が誰かは `netUid()`・`netTok()` だけが答える。同じ表を同じ列で読む関数は一つ。

**持つ検査**: `tools/load-check.mjs`（`npm run load`、ゲートの SLOW）。面を数える:
1. 起動 ⊆ 起動の二画面＋最初の画面＋セッション
2. 表と扉がある
3. 全部の GET に上限、`NET_PAGE` 以下
4. 全部の view と `viewReset()` は通信 0
5. タイムライン・人のページ・スレッドの底で続き
6. 人の言語は開くとページに描く分だけ、↓ でその章だけ、⭕ → ⭕☑️
7. 窓の外の `!netSignedIn()` = 0、`SESS` は net.js だけ、uid と token は二つの関数だけ
8. 表＋列ごとに関数一つ

各項は直す前の木（integ-0905）で赤を見た（1〜5・7 は土台で、6 は `L-fresh` で、8 は重複を戻して、5 の
人のページ・スレッドは `MORE_ON` から外して）。

## 測ったこと（偽のサーバー、各表 400 行、サインイン済み）

- 起動: **13 本**（直す前 21〜24 本）── `auth/v1/token`, `functions/v1/verify-plan`, `profile`（自分の行、一回）,
  タイムライン（`rpc/feed_hot`・`promo`・`prompt`・`block`・`post_seen`）、`rpc/notices`、最初の画面＝自分の
  プロフィール（`profile_seen`・`post_seen`・`language`・`language_take`）。
- 画面ごとの読み: `load-check` が毎回表にして出す（41 の route のうち 8 は何も読まない）。
- 人の言語を開くだけ: `language_seen` と slice（`wld`,`snd`,`script`,`letters` ── ページに描く分）。↓ で
  その章の kinds だけ。

## 変えたファイル

- `www/sns.js`: 読みの表（`pullOn`/`pullRun`/`pullWait`、問いは `k|a`）、`PAGE_READS`・`pageNeeds`・`pageWait`・
  `pageBoot`・`PAGE_OPEN`、問い（feed・day・fil・notif・thread・who・posts・fols・people・drafts・saved・recent・
  mylangs・lang・seen・mod）、続き（`snsMore`・`MORE_ON`・`MORE_AT`/`MORE_END`・`snsMoreOf`）。
- `www/shell.js`: `navLand()`（扉）・`NAV_TO`・`navNow()`。`go`/`backGo`/`goTab` がそれを通る。`viewReset()` は
  読まない。`PAGES` の 23 画面に `lang:1`。
- `www/net.js`: `netPop` が「線が落ちた」を返す、`netSend1` の `prog`（↓ のメーター）、`netUid()`・`netTok()`、
  `netMyProfile()` が自分の行の読み一つ、`netLangsWalk`/`netLangFill`、`NET_POST_SEL`・`NET_LANG_SEL`・
  `netIdOf`・`netLangAsk`・`netFollowRows`（`among`）、`netReplies` の `after`、全部の GET に上限。
  窓の外の `!netSignedIn()` 51 か所を消した。消した関数: `netWhoseId`・`netProfSync`・`netPrefsPull`・
  `netStaff`・`netBlockedGot`。
- `www/me.js`: `REL`・`relAsk`・`whoAsk`・`folPull`・`folsAsk`・`folPeople`・`folMore`。自分の数は
  `profile_seen.fo/fr`。消した: `meFollowing`・`meFollowers`・`meNFollowing`・`meFollowsPull`・`followsOpen`・
  `whoWait`・`profileReady`・`meAgain`・`folAgain`・`folWait`。
- `www/home.js`: 人の言語のページは `WLD_PAGE_KINDS` だけ、`wldGet`（↓）が章の kinds を `prog` つきで、
  `wldMeterPaint`・`iconMeter`。`vAbout` は読まない。消した: `wldSlicesPull`。
- `www/boot.js`: 起動は `netResume` → `bootSession`（storeSync だけ）→ `netTook`（`pageBoot`）。
- `www/core.js`・`www/post.js`・`www/settings.js`: `SESS` の直読みを `netUid()`/`netTok()` に（settings.js は
  `wipeHere` の uid 一行 ── 「読む時だけ」の外。下の「リーダーの指示が間違っていた所」）。
- `www/act-map.js`: 消えた関数の行。
- 検査（前提を今の決定に合わせた）: `acct`・`again`・`quiet`・`open`・`post`・`find`・`tl`・`slow`・`migrate`・
  `press`・`store`・`writes`・`act`・`i18n`・`pull-table`・`del`・`world`、`tools/fixture.mjs`。新しく
  `tools/load-check.mjs`・`tools/load-baseline.txt`。`package.json`・`tools/gate.mjs`。
- 文書: `CLAUDE.md`（§ Online に一文、規則 6・11・22）、`docs/ARCHITECTURE.md`、`docs/DATA_SAFETY.md`、
  `docs/FEATURE_RULES.md`（2026-09-23 の Implementation status）、`docs/CHANGELOG.md`。
- 写真: `shots/r71-before-dl-going-ja.png`・`r71-before-dl-taken-ja.png`・`r71-after-dl-meter-ja.png`・
  `r71-after-dl-turning-ja.png`・`r71-after-dl-taken-ja.png`。続きの読み込みは画面の形を変えていない。

## 回した検査（全ゲートは回していない）

一つずつ、この枝の上で一回ずつ: FAST 全部（`tools/gate.mjs` の `FAST`）、`load`・`acct`・`act`・`again`・`quiet`・
`open`・`post`・`tl`・`migrate`・`find`・`draft`・`slow`・`plan`・`push`・`verify`・`del`・`token`・`paid`・`i18n`・
`card`・`writes`・`store`・`kb`・`world`・`conv`・`forms`・`fill`・`round`・`guide`・`base`・`term`・`shape`・`page`・
`dl`・`ink`・`marks`・`hist`・`take`・`line`・`press`。

前提が崩れて直した検査（扉が読みを待つ／中身は netLangFill／↓ は先に読む）: `world`・`gramlang`・`hist`・
`take`・`line`、それぞれ元のバグを戻して赤を見た。

**integ-0905 でも同じ文で赤（この枝のではない、測った）**: `word-check`（`migratePh is not defined`）、
`gramlang-check`（五つ ── 語順のカード・規則が一つ書かれる・品詞・形・Select）、`sheet-check`（数字の
印が 0 ピクセル）、`keep-check`（`OWN_ROAD` の `kbUndo`・`kbRedo` の行が要らない）。
`press` の三つ（`.edit`・`.ppr`・`.tfont` を誰も着ていない）。`press` のプロフィールの長押しは
この枝の赤で、フィクスチャに `posts|私` の答えを足して直した（buttons pressed: 19365、283/285）。

## 保存するもの

変わらない。読む時と読む量だけ。消す物は無い（`draftsPull` の掃除には触っていない ── 下の「オーナーへ」）。

## オーナーへ（決めていない ── 実装していない、または仮）

1. **上限の数**: `NET_PAGE = 50`（`www/net.js`、一か所）。**仮**。
2. **フォロー中・フォロワーの並びが @ の順**: `follow_seen` に時刻の列が無いので、続きを読める並びが
   これしか無い。新しい順にするなら列が要る（schema.sql、r65-server）。
3. **下書きの上限**: `draftsPull()` は答えに無い下書きを端末から消す。50 件で切ると残りを消す事になる
   ので上限を付けていない（`tools/load-baseline.txt`）。どうするかはオーナー（削除）。
4. **サインアウトで「歩き」として答える三つ**（`netSaveUp`・`netSaveUpGo`・`netLangSync` の
   `!netSignedIn()`）: 「その歩きは、作ったものがこの端末にしかない唯一の窓」（CLAUDE.md § Online）の
   書かれた規則。r73 §2-5 はこれが § Online と食い違うと言う。二つの書かれた決定が食い違うので止めた
   （baseline に理由つき）。
5. **起動が読む物のうち「通知とタイムライン」の外に見える物**: プラン（`verify-plan`）、自分の
   `profile` 行（設定・歩き終えたか・凍結・スタッフ）、最初の画面（自分のプロフィール）の分。
   最初の画面がタイムラインでなくプロフィールなのは今の作り（`netTook` の着地）。どれを起動に残すかは
   オーナー（r73 §5-1）。
6. **通知の続き**: 無い（「通知は不要」と読んだ。違えば言ってほしい）。

## SQL（r65-server へ ── schema.sql は持っていない）

タイムラインのブロックの除外は、今は端末で `block` を全部読んで抜いている（上限を付けると抜けた分が
戻ってくるので、`block` の読みは baseline で上限なし）。サーバーで抜けば端末は読まなくてよい:

```sql
-- feed_hot() と feed_fo() の where に（post_seen を読む三つ ── 検索と人の投稿も同じ）
     and not exists (select 1 from block b
                      where b.actor = auth.uid() and b.blocked = v.author)
```

入ったら `netBlocked()` の読みと `tools/load-baseline.txt` の `rest/v1/block` の行を消す。

## 持ち物外で見つけたこと（直していない）

- `www/share.js`（`shareKbd` の `SESS.uid`）と `www/store.js`（`LinguaStore.buy` に渡す `SESS.uid`）が
  `SESS` を直に読む ── `netUid()` に。baseline に載せた。
- `www/mod.js:18`「`netStaff()` in www/net.js asks once」と `www/onboard.js:960`「pullBoot()…PULL_OPEN」──
  消えた名前を今のこととして言うコメント。
- `docs/DUPLICATES.md:225` の `netWhoseId()` を ~~打ち消し~~ にした（docs-check が赤になるため。
  持ち物外の文書を一行触った）。
- `docs/STATE.md` 1047・1083 行「`netLangSync()` is fired by `boot.js` at launch」── 土台の時点で既に偽
  （起動では走らない、扉と `langNew()`）。リーダーのファイル。CLAUDE.md 規則 6 の同じ文は直した。
- 画面側の `netSignedIn()`（post・sns・store の「サインインしていない時の画面」）はそのまま ── 窓の問いでは
  なく、何を描くかの問い。
- r73 §2-5 の「handle で私かを比べる 13 か所・`p.mine` 4 通り」、§2-6 の「post-media の削除 3 関数・
  `netDropMe` の上限なし」はやっていない（消す／データの形 ── オーナーと持ち主の話）。
- スレッドの続きは、今画面にある投稿への返信を新しい方へ読む。二段目より深い返信（続きで来た投稿への
  返信で、それより古い物）は、次に引っ張って更新した時に来る。
