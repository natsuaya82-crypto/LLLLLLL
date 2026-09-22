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
  トリガー、pg_net（`net.http_post`）で edge function `push-send` へ。トリガーは
  **行を入れた人の `Authorization` をそのまま持って行く**。
- **`push-send`**：JWT の検証ありで置く。request の中身を信じない。service role で
  行を読み直す。**署名した本人の操作でなければ送らない。**自分には送らない。
  スイッチ off は送らない。device が無ければ何もしない。
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

## オーナーの決定（2026-09-22、二つ目）

「サインインなしで勧めるものないけど」

**このアプリに、サインインなしで進むものは一つもありません。この口もそうしません。**
閉じました（commit `a922e1f0`）。

- トリガーは**行を入れた人の `Authorization` をそのまま持って行く**
  （`push_ping()` が `request.headers` から読む）。
- `push-send` は **JWT の検証ありで置く**（`--no-verify-jwt` は付けない）。
- 函数は `/auth/v1/user` に**誰から来たかを訊き直し**、その uid が行の actor と
  違えば何もしない（`push.mjs` の `pushPlan`、`push-check` が押さえる）。
- publishable キーもここで止まる ── あの鍵に user の `sub` は無い。

## オーナーの決定（2026-09-22、三つ目）── 大きいカバー

「ちがう。そもそもサインインがない状態でできることがないはずなのにそれがある
ことを疑って言ってんの。小さい穴だけ潰しても意味ねえだろ、大きいカバーで覆えや
バカ」

**このサーバーには、サインインしていない人に答える物が一つもありません。**
表も view も函数も sequence もバケットも。`supabase/schema.sql` の最後に一塊で、
**表も函数も名指ししません**（明日足す表は明日そこに入る）。

塞ぐ前に測った穴（`npm run rls`、赤）：**relation 24・函数 69・sequence 5・
storage の表 2・公開バケット 2・標準権限の登録 3。**

- 函数は `from anon` だけでは届かない ── PostgreSQL は EXECUTE を PUBLIC に
  渡し、PUBLIC は anon を含む。`from public` も剥がして `to authenticated` で
  戻す（PUBLIC は既に authenticated を含んでいたので広げていない）。
- バケットは全部 private（公開バケットは policy を一度も見ない URL）。
  `media_read` は `is_member()`。
- `using (true)` の policy は一行も書き換えない ── あれは「サインインした人の
  中で誰が」を言う層。
- **一つだけ開けてある**：`email_taken()`、OWNER DECISION 2026-09-22
  「判断だけどこれは例外で」。数えずに名指し。

**決めていないので作っていない物**（変わらず）：通知の履歴・未読数のバッジ・
メール・Android。

## 報告（2026-09-22、CODE CONFIRMED。**実機は一つも押していません**）

### file と、なぜ

| file | 何をしたか・なぜ |
|---|---|
| `docs/CHANGELOG.md` | **コードより先に**書いた。新しく貯まる物（`device`）、消える物（410 の token、DELETE REVIEW）、`prefs` が grant に無かった件 |
| `supabase/schema.sql` | ① `profile` の UPDATE の grant に `prefs`（**別のバグ、下**）② 表 `device` と policy 四行 ③ 末尾に `push_ping()` と三つのトリガー（`do` ブロックで包む） |
| `supabase/functions/push-send/push.mjs` | **判断だけ**。素の ESM なので Deno と Node が同じ一枚を読む（`verify.mjs` と同じ形・同じ理由） |
| `supabase/functions/push-send/index.ts` | **I/O だけ**。行を読み直し、APNs へ送り、410 の token を落とす |
| `tools/push-check.mjs` | 90 本。`push.mjs` をそのまま import する（検査が判断を書き直したら写しで、写しは必ず一致する） |
| `tools/rls-check.mjs` | `prefs` 五本＋`device` 十本＋SHAPE 五本。`supabase_functions` の stub を**二回の適用の間**に挟んだ |
| `tools/gate.mjs`・`package.json` | FAST に `push-check`、alias は `push` |
| `.github/workflows/supabase-deploy.yml` | 選択肢に `push-send`、APNs の三つを Secrets へ。**JWT の検証は三つとも有効**、最後の確かめは 401 |
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

### 二周目（扉を閉じた）── 測ったこと二つと、道を変えた理由

リーダーの指示は「`supabase_functions.http_request()` の呼び出しに
`Authorization` を転送する」でした。**止まる条件（`request.headers` が読めない）
は当たりませんでした**が、**その関数では運べません**。両方測りました
（2026-09-22、PostgreSQL 16）：

```
1. after insert のトリガーの中から読める
   headers={"authorization":"Bearer THE-CALLERS-TOKEN", …}
   claims={"sub":"b0000000-…","role":"authenticated"}

2. トリガーの引数は式にできない
   create trigger t2 after insert on t for each row
     execute function grab(current_setting('request.headers', true));
   ERROR:  syntax error at or near "("
```

2 が効きます ── トリガーの引数は作成時の**文字列定数**（`pg_trigger.tgargs`）
なので、`http_request(url,'POST',headers,…)` の header に呼び出し人の token を
入れる場所がありません。あの道が運べるのは「`schema.sql` に書いた header」だけ
で、それは**schema の中の秘密か、開いた扉**のどちらかにしかなりません。

Vault には行っていません（それはオーナーの手順になるので）。**同じ一クリックで
入る pg_net** ── `net.http_post`、`supabase_functions.http_request()` が内部で
渡している先 ── は header を**値**で受け取るので、自前の `push_ping()` が
`current_setting('request.headers')` から読んで渡します。**一機構、一段少ない。**

**server unconfirmed が一つ。**PostgREST が `request.headers` に
`authorization` を載せることは、本物のサーバーでしか確かめられません。載って
いなければ**通知が一通も出ません**（送る資格が無いので黙って終わる ── 安全な側に
倒れます）。見どころは `supabase/setup.md` § 12 の表に足しました。

### 三周目（大きいカバー）── 赤と、リーダーへ一つ

```
カバーを外して走らせた赤（本当の anon ロールで押した分）
  FAIL  somebody with no account reads no profile   ok
  FAIL  nor any post                                ok
  FAIL  nor who follows whom                        ok
  FAIL  nor a like                                  ok
  FAIL  nor a published language                    ok
  FAIL  nor a slice of one                          ok
  FAIL  nor through any of the four views           ok
  FAIL  nor the timeline's                          ok
目録からの列挙
  FAIL  nothing signed out may touch any table or view      24
  FAIL  nothing signed out may run any function ...          69
  FAIL  nothing signed out may touch any sequence             5
  FAIL  nothing signed out may touch the files                2
  FAIL  no bucket answers without a session                   2
  FAIL  and the files are only read by somebody signed in     1
  FAIL  and a table made tomorrow is refused too              3
anon: 24 relations, 69 functions, 2 buckets -- NOT all refused
```

緑：`anon: 24 relations, 69 functions, 2 buckets -- all refused
(1 allowed by name: email_taken)`、`rls: 420 attempts / 73 shape`。

**リーダーへ ── case 284 は `denied` にしていません。理由は一行です。**
この file の `anon` の欄は **匿名アカウント**（役割は `authenticated`、`sub` も
JWT もある）で、**`anon` ロールではありませんでした。**だから 284
（`nobody signed in reads profiles`）はカバーを入れても緑のままです ── それを
`denied` にするには `profile_read` ほか六つの `using (true)` を書き換えるしか
なく、同じ指示が「`using (true)` は そのまま」と言っています。**両方は立ちません。**

やったのは、**本当の「誰でもない人」を初めて押すこと**です（16 本、上の赤）。
匿名アカウントの側は今までどおり `is_member()` が書き込みを断り、読みは
`using (true)` のまま ── Supabase の匿名サインインは Dashboard で OFF のままで、
`supabase/setup.md` § 1 がそう書いています。**匿名アカウントの読みまで閉じるかは
決めごとなので、閉じていません。**

**もう一つ、触った所を申告します。**`CLAUDE.md` の「the row level security in
`schema.sql` is the whole of the security」は**今日から嘘**になったので、二層の
書き方に直しました（§ The gate）。`CLAUDE.md` は私の scope ではありませんが、
「a change lands with every sentence it falsifies, wherever it lives」に従って
同じ commit に入れています。**要らなければ戻してください。**

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

**扉を閉じたとき（二周目）**

```
push   署名が無ければ送らない / 理由は「session が無い」/ publishable キーも同じ /
       サインインした他人は鳴らせない / 理由は「その人のものではない」/
       follow を他人が叩いても送らない / 返信を鳴らされる側が叩いても送らない（7本）
rls a  header を決め打ちにする  → FAIL and it carries the writer's own Authorization
rls b  署名が無くても叩きに行く → FAIL one write went out and the unsigned one did not
rls c  pg_net を外す            → FAIL 三本＋道の三本、**404 attempts は全部緑**
                                  （＝ガードが効いてファイルは全部入っている）
```

**c は最初、赤ではなく検査自身の死でした** ── SHAPE が `net._sent` を参照して
いて、stub を外すと「問えない claim」になっていた。記録用の表を `GROUND` に
移しました。**問えない claim は、通った claim と見分けがつきません。**

### rls の数

`npm run rls` ── **420 attempts / 73 shape、緑**、そして
`anon: 24 relations, 69 functions, 2 buckets -- all refused
(1 allowed by name: email_taken)`。この session の前は 385 / 55。
`npm run push` ── **100 claims**。

### 回した check

`npm run push`（100 本）・`npm run rls`（420 / 73）・`npm run assets`・
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
