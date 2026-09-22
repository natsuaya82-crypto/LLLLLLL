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

## 報告（2026-09-22、CODE CONFIRMED。**実機は一つも押していません**）

### file と、なぜ

| file | 何をしたか・なぜ |
|---|---|
| `docs/CHANGELOG.md` | **コードより先に**書いた。新しく貯まる物（`device`）、消える物（410 の token、DELETE REVIEW）、`prefs` が grant に無かった件 |
| `supabase/schema.sql` | ① `profile` の UPDATE の grant に `prefs`（**別のバグ、下**）② 表 `device` と policy 四行 ③ 末尾に三つのトリガー（`do` ブロックで包む） |
| `supabase/functions/push-send/push.mjs` | **判断だけ**。素の ESM なので Deno と Node が同じ一枚を読む（`verify.mjs` と同じ形・同じ理由） |
| `supabase/functions/push-send/index.ts` | **I/O だけ**。行を読み直し、APNs へ送り、410 の token を落とす |
| `tools/push-check.mjs` | 90 本。`push.mjs` をそのまま import する（検査が判断を書き直したら写しで、写しは必ず一致する） |
| `tools/rls-check.mjs` | `prefs` 五本＋`device` 十本＋SHAPE 五本。`supabase_functions` の stub を**二回の適用の間**に挟んだ |
| `tools/gate.mjs`・`package.json` | FAST に `push-check`、alias は `push` |
| `.github/workflows/supabase-deploy.yml` | 選択肢に `push-send`、APNs の三つを Secrets へ、`--no-verify-jwt`、最後の確かめは 400 |
| `supabase/setup.md` § 12 | Database → Webhooks の一クリックと、通知が来ない時にどこを見るか |
| `docs/apple.md` § 8 | オーナーがやること七つ、順に |
| `docs/DATA_MODEL.md` | `device` の節と、`prefs.push_*`（無いのはオン） |

### 変わる振る舞い

- サーバーに表が一つ（`device`）と after insert のトリガーが三つ増える。
- **既存の読み書きの道は一つも変わらない。**`notices()` は一文字も触っていない。
- `profile.prefs` が**書けるようになる**（今まで書けていなかった ── 下）。
- アプリ側（r48）が入ったビルドでなければ `device` に行が無く、**何も送られない**。

### 新しく貯まる物

`device` の行だけ（`uid`・`token`・`created_at`）。**端末には一つも増えない**
── `localStorage` の鍵は一つも足していない（`www/` を一行も触っていない）。

### 消える物

**Apple が `410 Unregistered` と答えた `device` の行、一つ。**その token に
送ろうとした呼び出しの中でだけ。**410 以外では一つも消さない**（0・400・403・
429・500・503 を `push-check` が一本ずつ押さえている）。人が作った物は一つも
消えない。DELETE REVIEW は `docs/CHANGELOG.md` 2026-09-22。

### 指示と違えた所 ── 二つ、どちらも一行

1. **`supabase/setup.md` は § 13 ではなく § 12。**あのファイルの一番下が § 11
   だった。§ 13 と書いた三箇所（`schema.sql` 二つ、CHANGELOG 一つ）も直した。
2. **文面は「@handle があなたをフォローしました」ではなく、`www/i18n` の
   `notif.follow` の値そのまま**（ja なら「@iri がフォロー」）。四種類 × 十言語
   が既にあの四つの鍵にあり、通知タブが出している文そのものなので、訳し直すと
   **同じ出来事に二つの文言**ができる。`alert.title` は `Lingua`、`alert.body` が
   その文。**文言を変えるならオーナーの決めごと**なので、変えていません。

### 見つかったバグ（頼まれていないが、この機能が立たない）

**`profile.prefs` は 2026-09-08 から一度もサーバーに書けていませんでした。**
`grant update (handle, display, av, bio, link, loc) on profile` に `prefs` が
無く、`netPrefsPut()` の `PATCH` は毎回断られていました。失敗の受け手が
`function(){}` なので何も投げず、テーマも表示言語も端末の写しの中だけで動いて
いた。オン／オフをこの列に置く以上、書けない列では意味が無いので直しました
（commit 一本、rls-check 五本、赤を見てから）。**`www/` は一行も触っていません。**

### 赤の出力（全部、直す前に見たもの）

**`npm run push` ── バグ七通り**

```
1 無いスイッチを「切ってある」と読む   ✗ 無い follow/reply/like/boost はオン（6本）
2 自分にも送る                         ✗ 自分の投稿への自分のいいねは送らない（3本）
3 200 以外なら token を落とす          ✗ 0/400/403/429/500/503 では落ちない（6本）
4 宛先が無くても送るつもりになる       ✗ 行が一つも無ければ送らない（4本）
5 request の record をそのまま鍵にする ✗ 取り出したものに request の文字は無い（2本）
6 ko が訳されずに en のまま残る        ✗ 同じ四行を持つ言語は二つと無い
7 返信の相手とやった人が入れ替わる     ✗ 返信の相手は返された投稿を書いた人
```

**1 は最初、赤が一つも出ませんでした。**送らないと決めた `plan` には `payload`
が無く、そこを直に触った検査が例外で死んで、**その先の claim が一つも走らない
まま終わって**いた（`tools/gate.mjs` が `&&` の連鎖について書いているのと同じ
こと）。`pay()`・`line()`・`many()` を通すようにして、90 本が最後まで走ります。

**`npm run rls` ── 三回**

```
prefs   FAIL A writes A's own prefs / and reads its own back /
             and a switch off is kept as false
device  FAIL A registers A's own iPhone / B registers B's own iPhone /
             B unregisters B's own phone
trigger stub を外す → FAIL a follow says so / a reply says so /
             a like and a boost say so（他の 400 本は緑＝ガードが効いている）
        ガードも外す → ERROR: schema "supabase_functions" does not exist
             でファイル全体が入らない（2026-09-15 と同じ壊れ方）
```

**`npm run assets`** ── `push` の alias を外すと
`tools/push-check.mjs is in the gate and no npm script runs it on its own`。

### rls の数

`npm run rls` ── **404 attempts / 60 shape、緑**（`integ-0905` 取り込み後。
取り込み前は 400 / 60、この session の前は 385 / 55）。

### 回した check

`npm run push`（90 本）・`npm run rls`（404 / 60）・`npm run assets`・
`npm run docs`。**ゲート（`npm test`）は回していません** ── リーダーの物。

### やっていないこと

- **`www/` と `ios/` は一行も触っていません**（r48）。
- 通知の履歴・未読数のバッジ・メール・Android ── 決まっていないので作っていない。
- **実機は一つも押していません。**Linux に iPhone はありません。
- **`docs/STATE.md` は触っていません**（リーダーの物）。
- `docs/DUPLICATES.md` に一件足すべきものがあります（`push.mjs` の `SAY` と
  `www/i18n` の `notif.*`）。あのファイルはリーダーが数えている物なので、
  足していません。

### リーダーへ ── 取り込むときに一つ

`docs/CHANGELOG.md` を **r48 も書いています**（`6ba573ea`）。同じ日の同じ
機能で、こちらはサーバー側、あちらは端末側。衝突したら**両方残して**ください
── 消える物と貯まる物が別です。それ以外に r48 と重なる file はありません
（`origin/integ-0905..origin/claude/r48-push-app` を見て確かめました）。

### オーナーがやること、順に

```
1  developer.apple.com → Identifiers → com.tokinets.lingua → Push Notifications
2  Profiles → Lingua Distribution を作り直す
   → GitHub の PROVISIONING_PROFILE_BASE64 を入れ直す（**飛ばすと次のビルドが落ちます**）
3  Keys → APNs の鍵を作る（.p8 は一度しか落とせません。Key ID を控える）
4  GitHub の Secrets に APNS_KEY_ID と APNS_P8
5  Supabase → Database → Webhooks → Enable webhooks（ボタン一つ）
6  Supabase → SQL Editor に schema.sql を全部貼って Run
   → Database → Triggers に push_on_follow / push_on_reply / push_on_react の三つ
7  GitHub → Actions → Supabase Deploy → push-send
8  （r48 が入ったビルドで）実機で通知を許可する
```

**5 を飛ばすと 6 は通りますが、トリガーは作られません**（NOTICE が出ます）。
その時は 5 をやってから 6 をもう一度。詳しくは `docs/apple.md` § 8 と
`supabase/setup.md` § 12。
