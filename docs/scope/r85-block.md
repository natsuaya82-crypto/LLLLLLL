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
