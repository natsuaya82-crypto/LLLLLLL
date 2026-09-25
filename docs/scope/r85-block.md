# r85-block — ミュート・ブロックの残り・サインインの着地・前の版のファイル

`claude/r85-block`、`integ-0905` 0267a9ce から。決定: `docs/FEATURE_RULES.md`
「### 2026-09-25 ミュート・ブロックの残り・サインインの着地・前の版のファイル」。
前の報告: `docs/scope/r82-sns.md`（「オーナーへ」3〜6、「持ち物の外で、今回の変更で偽になった文」）。

## やる物

- A. ミュート: 人をミュート（ブロックと同じ ... のメニュー）。ミュートした人の投稿はタイムライン・スレッド・
  検索に出ない。設定に「非表示リスト」（ミュートした人の一覧、そこから解除）、ブロックリストと並ぶ行。
  サーバーの表 `mute`（is_member、自分の行だけ）、一覧は `mute_seen`（`block_seen` と同じ形、上限なし）。
- B. サインインし直した時の着地はプロフィール。**先に測った: もうそうなっている**（`open-check` 3e
  「signing back in with nothing pending: from "set" onto "profile"」、起動は「For you」）。コードは変えない。
- C. ブロックした相手の公開言語を `language_seen` で外す（両向き、`block_hides()`）。
  **取った言語は外さない**（`language_took()` の行はそのまま）── どうするかは決めずに報告に書く。
- D. ブロックの間は いいね・リポスト（`react`）・返信（`post.reply_to`）・フォロー（`follow`）を
  schema.sql の書く側で断る。アプリに「引用」の投稿は無い（`quote` 表は投稿に使った語）── 報告に書く。
  push-send の四種類（follow reply like boost）は全部この四つの書き込みの after insert なので、書けなければ
  鳴らない。push-send に二つ目の問いは足さない（一つの事を二か所で答えない）── 報告に書く。
- E. 前の版の `Documents/Sheets` を消す（今の版はそこに書かない）。`Documents/Voices` は **今の版も
  送る前の声をそこに置いている**（下書き・送れなかった投稿の `vo.f`）ので、中を全部消すと送っていない声が
  消える。どこまで消すかを訊いてから。DELETE REVIEW を先に CHANGELOG へ。
- F. 偽になった文: `docs/FEATURES.md`・`docs/RECOVERY.md`（Documents）、`www/card.js` のコメント、
  `docs/FEATURE_RULES.md` § Blocking の「片方向」。`docs/STATE.md` は直すべき行を報告に書く。

## 持ち物（これ以外は触らない）

supabase/schema.sql（block・mute・language_seen・post_seen の mute の列・feed_hot/feed_fo の mute の行・
react/post/follow の書く側の断り。slice_hist は触らない。`language_read`・`slice_read` も触らない ── 下）
supabase/functions/push-send/*（コメントだけの予定）
www/sns.js www/post.js www/me.js www/settings.js www/net.js www/home.js www/shell.js www/boot.js
www/card.js（コメントだけ） www/rec.js www/sheet.js（E だけ） www/act-map.js www/route-map.js www/i18n/*.js
ios/App/App/LinguaShare.swift（E）、ios/App/App/AppDelegate.swift（E で起動時に呼ぶなら。要るかは scope を
更新して書く）
tools/*-check.mjs のうち上を持つ物、tools/rls-check.mjs（CASES に足す行と BLOCK_HELD）、tools/fixture.mjs、
tools/load-baseline.txt
docs/FEATURES.md docs/RECOVERY.md docs/FEATURE_RULES.md（§ Blocking と 2026-09-25 の実装状態の行）
docs/CHANGELOG.md docs/scope/r85-block.md

## 触らない物

上に無い全部。`www/index.html`（CSS を一行も足さない）、`www/onboard.js`、`docs/STATE.md`（リーダーの物）。
`language_read`（`language` 表の読み）と `slice_read` も「誰が言語を見られるか」を書いているが、持ち物の
節ではないので触らず、面の残りとして報告に書く。全ゲートは回さない（リーダー）。

---

## 報告（2026-09-25）

すべて **CODE CONFIRMED のみ。DEVICE CONFIRMED・OWNER CONFIRMED は無い。** 全ゲートは回していない（リーダー）。
回したのは、速い検査（`FAST` の十八）をコミットごとに、`npm run rls`（schema.sql を変えた三回と取り込みの後）、
項ごとの遅い検査（`tl`・`post`・`sheet`・`open`）を赤を見るためと緑の確認に一度ずつ。`integ-0905` 8debac6d を
取り込み済み（CHANGELOG の頭だけ衝突、両方残した）。**Supabase で schema.sql を流すまで電話では A・C・D は効かない。**

| 項 | コミット | 何をしたか | 赤を見た | 写真 |
|---|---|---|---|---|
| C | 2ae397aa | `language_seen` の公開の枝が `block_hides(owner)` を訊く（両向き）。自分の言語と取った言語（`language_took`）はそのまま。`BLOCK_HELD` を空に | 古い schema.sql で rls: 名前の二件と、歩き（見る側・塞がれた側）の二件 | 見た目同じ |
| D | 46c27845 | `post_blocks(p)` を `block_hides()` の横に。`react_make`・`post_make`（返信）・`post_edit`（返信に書き換え）・`follow_make` が断る。push-send はコメントだけ | 古い schema.sql で rls 五件 | 見た目同じ |
| A サーバー | ac5de1c6 | `mute` 表・`mute_hides()`・`mute_seen`・`post_seen.muted`（列の最後）、`feed_hot` と `feed_fo`（両方の枝）が外す | `mute_read` を `using (true)` にして rls 二件 | — |
| （A の前） | f0eacd0c, 5bee8d43 | リファクタ: ブロックの一覧の読みを表をキーにした一つに（`NET_PPL`・`netPplRead(表)`）。二つ目は道を書き切る直し（`grep rest/v1` に view が出るように） | — | 見た目同じ |
| A 端末 | 2e564123 | ... のメニュー（投稿・人のページ）に「ミュート」、設定に「非表示リスト」（ブロックリストの前）。今日のお題・スレッド・検索が `muted=is.false` を訊き、人のページは訊かない。手元の写しは `postMuted()` がタイムラインとスレッドの返信から外す。押しは一つ（`mePplPress`） | `tl-check` 10b: `postAll` の外しと `netReplies` の問いを抜いて二件 | `shots/r85-A-before-*`・`r85-A-after-*`（設定・非表示リスト・投稿のメニュー・人のページのメニュー、ミュート中のページと、ミュートした人が消えたタイムライン） |
| B | — | **コードは変えていない。**測った: サインインし直すと `set` から `profile` へ（`open-check` 3e）、起動は「おすすめ」（同じ走り） | — | — |
| E | fb783f08（DELETE REVIEW）, 2f95397a | `shDropOld()` → `dropOldSheets`（Documents/Sheets をフォルダごと）。`voSweep()` → `sweepVoices`（どのアカウントの下書き・声が上がっていない投稿・持ち主の無い古い鍵・メモリ・投稿欄も名指さない物だけ。読めない写しが一つあれば何も送らない。呼んだ時刻より新しい物は残す。一覧の無い呼び出しは断る）。`www/boot.js` が起動で一度ずつ | `post-check` 16c（下書きを残す一覧から外して）、`sheet-check`（一覧の無い時を空と読ませて） | 見た目同じ |
| F | 7269eee9 | 下の「偽になった文」 | — | 見た目同じ |

### 振る舞い

- ミュート: 相手には何も起きない（一方向、フォロー・いいね・返信はそのまま、知らされない）。こちらのおすすめ・
  フォロー中（書いた物も、誰かが回した物も）・今日のお題・スレッドの返信・投稿の検索から、その人の投稿が消える。
  その人のページと、id で開いた投稿には出る。ミュートはフォローを外さない。
- ブロック: 相手の公開言語が、人のページ（`profile_seen` は前から）・言語の記事（`language_seen`）から両向きで消える。
  塞がれた側も塞いだ側も、いいね・リポスト・返信・フォローができない（サーバーが断る、画面は「接続できません」の
  ポップ）→ その通知も鳴らない。
- 押しの直し（ブロックにも効く）: 一覧をまだ訊いていない画面で押すと、先に一覧を訊いてから向きを決める。前は
  「訊いていない」を「していない」と読み、二つ目の行を送って断られ、ポップが出ていた。
- 起動: 画面が出た後に、前の版の用紙と声のファイルを消す（下）。

### 保存する物

- 新しい: サーバーの `mute` 表（`actor`・`muted`・`created_at`、どちらかのアカウントを消すと行も消える）、view
  `mute_seen`、`post_seen` の列 `muted`、函数 `mute_hides()`・`post_blocks()`。端末に新しく書く物は無い。
- 消す: スマホの `Documents/Sheets` 全部と、`Documents/Voices` のうち誰も名指さないファイル（DELETE REVIEW は
  `docs/CHANGELOG.md` 2026-09-25）。サーバーの物は一バイトも消さない。
- 移行: 無い。

### オーナー・リーダーへ（決めていない物）

1. **ブロックと取った言語**（C）: 相手から取った言語は、ブロックの後も一覧に残り読める（`language_took` の枝を
   そのままにした。rls-check「BK still reads the language BK took」）。外すか、残すか。
2. **`language_read`・`slice_read`**（C の面の残り）: `language` 表と slice を直に読むと、ブロックの間でも公開言語が
   読める（アプリはそこから他人の言語を探さない ── 自分の物と取った物だけ）。「誰が言語を見られるか」は三か所
   （`language_read`・`language_seen`・`slice_read`）に書かれていて、一つの函数にまとめて `block_hides` を足すのが
   覆い方。持ち物の節ではないので触っていない。
3. **掃除を一度きりにするか**（E）: 起動のたびに呼ぶ。二回目からは、アカウント削除で下書きが消えた後の声のような
   「誰も名指さない」ファイルだけが対象（決定の「上げた声は残さない」と同じ向き）。一度きりにするなら
   `SET_PHONE`（`www/core.js`、持ち物の外）に印が要る。
4. **ミュートの印**: `ICON_SPK`（音の出るスピーカー）を仮に使っている。斜線のスピーカー（`ICON_MUTE`）は
   `www/glyph.js` の `ICON_*` の並びで、持ち物の外。
5. **言葉**: 日本語の「ミュート」「非表示リスト」はオーナーの言葉。「ミュート解除」は「ブロック解除」に合わせた。
   九言語の訳（例: en Mute / Unmute / Muted accounts）はこちらで置いた ── 決めていない。
6. **ミュートした人が回した他人の投稿**: フォロー中に出る（外したのは、ミュートした人が書いた投稿 ── 誰が回した
   物でも）。通知（その人のいいね・返信の通知）も出る。決定が挙げたのはタイムラインだけなので広げていない。
7. **二台目の端末**: ミュートした直後、別の端末の手元の写しには、その人の投稿がタイムラインに残る（一覧を訊く
   までは `postMuted()` が知らない）。サーバーの答えからは外れている。ブロックの `postBlocked()` と同じ形。
8. **引用**: アプリに引用の投稿は無い（`quote` 表は投稿に使った語）。リポストは `react` でいいねと同じ断り。

### リーダーの指示が違っていた所

- **D の push-send**: 「ブロックの間では送らない」は push-send を変えずに成り立つ ── 人に向かう四種類はどれも
  その行が入った時のトリガーで、ブロックの間はその行が書けない。push-send にもう一度訊かせると一つの問いに
  二か所が答えるので、コメントだけにした（`supabase/functions/push-send/index.ts`）。
- **E の声**: 「Documents/Voices の中を消す」は、今の版も送る前の声をそこに置いているので、そのままでは送って
  いない声を消す（2026-09-25 のリーダーの答えで直った）。
- **B**: もうプロフィールに着いていた（`obIn()` の `goTab('profile')`、`open-check` 3e）。

### 持ち物の外で、今回の変更で偽になった文（リーダーへ）

- `docs/STATE.md:39`（r80-block ── 「block_hides() 一つで外す」は今も真だが、両向き・書く側でも断る・公開言語・
  ミュートを足す所）、`:378`（「ブロックは `block` 表一本」── 今は `block` と `mute` の二表、一覧は `block_seen`・
  `mute_seen`）、`:999-1001`（net.js が訊く表の一覧に `mute_seen`・`block_seen`・`follow_seen` が無い）、
  `:1058-1060`（2026-09-03 の数、`block` 3 ── 今は `block` 1（書き）と `block_seen`・`mute`・`mute_seen`）。
- 直した（この枝の持ち物）: `docs/FEATURES.md`（用紙は一時フォルダ、前の版の Documents/Sheets は起動で消す、
  二か所）、`docs/RECOVERY.md`（Documents のフォルダは Voices 一つ）、`www/card.js` のコメント、
  `docs/FEATURE_RULES.md` § Blocking（両向き・BLOCK_HELD 空・書く側・`ME.bl` は読まない）と 2026-09-25 の実装状態。

### press の数・網羅の数

動く（... のメニューに一行ずつ、設定の一覧に一行、`set:mute` の顔、fixture の Yun と「ミュート中の人のページ」）。
回していないので数は書かない。
