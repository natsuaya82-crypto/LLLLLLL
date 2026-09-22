# r47-push-server ── ネイティブ通知、サーバー側

## Scope

- **Goal**: オーナーの決定（2026-09-22）「通知作ろう。アップルのネイティブ通知で、
  フォローされた時、返信きた時みたいな感じでSNS部分であるやつ。それに加えて設定で
  個別通知のオンオフできるように。」
  この session は**サーバー側だけ**。アプリ側（`www/`・`ios/`）は r48 が持つ。
- **Owns (may change)**: `supabase/schema.sql`、`supabase/functions/push-send/`、
  `supabase/setup.md`、`tools/rls-check.mjs`、`tools/push-check.mjs`（新）、
  `tools/gate.mjs`、`package.json`、`.github/workflows/supabase-deploy.yml`、
  `docs/apple.md`（通知の節）、`docs/DATA_MODEL.md`、`docs/CHANGELOG.md`、
  `docs/scope/r47-push-server.md`
- **Does NOT own**: `www/` と `ios/` は一行も触らない（r48）。`docs/STATE.md` は
  リーダーの物。他の `tools/*-check.mjs` は触らない。
- **Decision it implements**: OWNER 2026-09-22（上）
- **Check to run**: `npm run push`（新）・`npm run rls`・`npm run assets`。
  **ゲート（`npm test`）は回さない** ── リーダーの物（`docs/SESSIONS.md`）。

## 契約（r48 と共有 ── リーダーが与えた）

- **種類は四つ、通知タブと同じ**：`follow`・`reply`・`like`・`boost`
  （`schema.sql` の `notices()` が返す kind と同じ語）。
- **表 `device`**：`uid`・`token`（APNs の device token, hex）・`created_at`、
  主キー `(uid, token)`。RLS は本人だけ（select / insert / delete）。
- **オン／オフは `profile.prefs`**（jsonb）の中：`push_follow`・`push_reply`・
  `push_like`・`push_boost`。**無いのはオン**。サーバーは読むだけ。
- **送る側**：`follow`・`post`（`reply_to` 非 null）・`react` に after insert の
  トリガー、`supabase_functions.http_request()` で edge function `push-send` へ。
- **`push-send`**：request の中身を信じない。service role で行を読み直す。
  自分には送らない。スイッチ off は送らない。device が無ければ何もしない。
  APNs は `api.push.apple.com`、JWT（ES256）、topic `com.tokinets.lingua`。
  **410 が返った token は `device` から消す**（DELETE REVIEW）。
- **`tools/push-check.mjs`**：判断を `push.mjs` に切り出して Node から検査する
  （`verify-plan/verify.mjs` と `tools/verify-check.mjs` と同じ形）。

## 十一の問い（`docs/FEATURE_RULES.md`）

1. **何のため** ── SNS で自分に起きたこと（フォロー・返信・いいね・リポスト）を、
   アプリを開いていない人の iPhone に届ける。今は通知タブを開いた人にしか届かない。
2. **できるようになること** ── 送る側：何も。受ける側：アプリを閉じていても
   四種類が届く。設定で種類ごとに切れる（画面は r48）。
3. **無料か有料か** ── **無料**。`can()` は一つも足さない。段を一度も見ない
   （`docs/PAID_FEATURES.md`：金は「できること」を決め、存在する物を決めない）。
4. **今の振る舞いで変わる所** ── サーバーに表が一つと after insert のトリガーが
   三つ増える。既存の読み書きの道は一つも変わらない。`notices()` は一文字も
   触らない ── 通知タブと push は同じ四種類を別の道で出す。
5. **今ある data への影響** ── **無し**。既存の表の行は一行も書き換えない。
   `profile.prefs` は列の中身を読むだけで、書かない。
6. **新しく貯まる物** ── サーバーの表 `device`（uid と APNs の token）だけ。
   **端末には一つも貯めない** ── `localStorage` の鍵は増えない（r48 が端末側で
   何を持つかは r48 の scope）。slice でも `SET` でも無い。
7. **消す物** ── **`device` の行が一つ**。Apple が 410 Unregistered と答えた
   token を消す。**DELETE REVIEW は `docs/CHANGELOG.md` に**（理由：Apple が
   「その token はもう無い」と答えた token は誰の物でもなく、残せば同じ 410 を
   永久に叩き続ける）。人が作った物は一つも消えない。
8. **前からある data** ── 前からある人には `device` の行が無い。行が無ければ
   何も送らない（`push-check` の claim）。アプリを新しくして許可を出した時に
   行ができる。前からある投稿・フォロー・リアクションには**何も起きない**
   ── トリガーは after insert だけで、既にある行は一度も通らない。
9. **電波が無いとき** ── サーバーの話なので端末の電波は関係ない。**受ける側の
   端末が圏外なら APNs が預かる**（Apple の仕組み、こちらは何もしない）。
10. **失敗したとき** ── 秘密（`APNS_KEY_ID`・`APNS_P8`・`APPLE_TEAM_ID`）が
    一つでも無ければ 500 で止まり、**何も送らない**。行が読めなければ何もしない。
    APNs が 410 以外の失敗を返した時は**その token を消さずに**終わる
    （「読めなかった」と「無い」は枝を分けない ── `CLAUDE.md` 一枚目）。
    トリガーの http_request は非同期で、失敗しても**元の insert は通る**
    ── 通知が出ないことがフォローや投稿を落としてはいけない。
11. **段が変わったとき** ── 何も変わらない。段を一度も見ない。

## オーナーへ ── 決めていないので作っていない物

- 通知の履歴、未読数のバッジ、メール、Android ── リーダーの指示どおり作らない。
- **`push-send` はサインインしていない人でも叩ける口になります。**Database
  Webhook から呼ぶには JWT が要らない形（`--no-verify-jwt`）で置くしかなく、
  秘密は schema に置かない決まりなので、トリガーは何も持って行けません。
  函数は request の中身を一切信じず、行を DB から読み直して本物の相手にだけ
  送るので、**知らない人が作れるのは「本当に起きたことの通知をもう一度鳴らす」
  だけ**です（嘘の文面も、別人への通知も作れません）。それが困るなら口を塞ぐ
  方法は二つあり、どちらもオーナーの決めごとです ── 公開鍵（publishable key）を
  トリガーの header に書いて JWT 検証を有効にする／`push-send` を叩ける回数を
  数える表を作る。**今日はどちらもやっていません。**

## 報告

（作業が終わったらここに書く）
