# r65-server — サーバーは一つの事を一か所で言う（2026-09-24）

作業セッション r65-server（`claude/r65-server`、`origin/integ-0905` から）。指示は
`claude/leader-briefs:docs/scope/brief-r65-server.md`。

**覆う一文**：一つの事はサーバーで一か所が言う。足元の覆い（anon は何も持たない・関数は
authenticated）を言い直す栓は消す。同じ物を二度定義しない。関数は呼び手が誰で何回目かを自分で確かめる。

## 1. 直した物（`supabase/schema.sql`・`supabase/functions/`）

| 項 | 何が一か所になったか | 検査（`npm run rls`） |
|---|---|---|
| SQ4 | 関数ごとの grant/revoke 32 行と、列の revoke 4 行の `anon` を消した。足元の一行が全部言う | 「足元を言い直す grant/revoke = 0」をファイルから数える |
| SQ5 | `post-media` は最初から閉じた形で作る。`media_read` は一か所 | 「二度の定義 = 0」（policy・関数・view・表・trigger・bucket を数える） |
| SQ3・M2 | 上に立つ人の名 `lingua` は `profile_admin(p profile)` に一回。`is_admin()`・三つの trigger・`staff_drop()`・最初のフォロー・一回きりの update はそれに訊く。`staff_drop()` は `staff_add()` と同じ形（lower 両側、当たらなければ例外、@lingua は断る） | 名前は一回、`staff_drop('IRI')`・知らない @・@lingua |
| S5・S4（サーバー側） | `device_one()`：同じ組の出し直しは何もしない、同じ token の他のアカウントの行は受け取った時に外れる | 出し直しが通る、B が A の iPhone で入ると A の行が外れ、A の他の iPhone は残る |
| 番号 | `slice_no()`：`slice.no` はサーバーが配る。`admin_restore()` も自分で数えない | 端末が 999 と言っても 5 回で 5 |
| B3 | 言語の名前を `lang` スライスから `language.name` へ、**一回だけ**写す（`schema_step` に済んだと書く）。スライスは消さない | 古いサーバーの形に種を入れ、写る・既にある名前は上書きしない・スライスは残る・二度目の貼り付けで空にした名前が戻らない |
| SQ2 | `rung_at`（`PUSH` の四つの表）と `push_once()`：一つの行で鳴るのは一回。push-send は `pushMay()` の後、Apple の前にそれに訊く | サーバーが二回目は false、B も A も印を書けない、`PUSH` の表は全部 `rung_at` を持つ、push-send を B が二回叩いて Apple は一回 |
| SQ7 | `plan_put(who, rung, ladder)`：verify-plan は読んでから書くのをやめ、一つの文で行を握ったまま `was` を決める。梯子は `verify.mjs` の `ORDER` を渡す | 下がる・同じ・上がる、B と nobody は断られる |
| functions/ | `supabase/functions/` の各ディレクトリを数えて、nobody・publishable key・B で実際に呼ぶ（Node が型を落として読む、Deno と Supabase は偽物） | 三つとも断る。push-send から `push_once` を抜くと Apple に二回、daily-prompt の合言葉を抜くと nobody でもモデルが呼ばれる ── 赤を見た |
| RLS | 「どの表も row level security が入っている」をカタログから数える（新しい一文） | promo の一行を外して赤を見た |
| C | 偽のコメント（anon・誰でも読める、十の policy、匿名アカウント、バックアップ、宙に浮いた二段落、do ブロックは一つ、SQ6 の門が二つなのは決定どおり） | ── |

`npm run rls` の最後（このブランチの先）: 485 回試して 0 通過、84 の形、4 つの「一回」、3 つの関数。
anon: 26 relations, 77 functions, 2 buckets すべて拒否（`email_taken` の一つだけ名指しで開く）。

**流す順番**：schema.sql が先、verify-plan と push-send の置き直しが後（`supabase/setup.md` 2026-09-24）。
逆だと verify-plan が 500。

## 2. 端末の側（`www/net.js` ── r71-net の物。書いて止めた）

1. **`netSlicePut()` は `no` を送らなくてよい。**サーバーが配り、送った値は読まない（`slice_no()`）。
   `no:(no||0)+1` を消し、`netSlicePut` の引数 `no` と、`netGet('/rest/v1/slice?select=…no…')` で
   `no` を読むのが他に使われていなければそれも。
2. **`netLangsWalk` の `netLangNamePut` の段落（net.js 2392 付近）はもう消してよい。**名前はサーバーが
   一回だけ写す。起動の書き込みが一本減る（r60 B3）。ただし**schema.sql が本番に流されてから**。
3. **上に立つ人をサーバーに訊く。**`netStaffList()` の select を `id,handle,admin:profile_admin` に、
   `netStaff()` の select に `admin:profile_admin` を足して `NET_ADMIN` をそれから取る。そうすれば
   `ADMIN_HANDLE` は消せる（`OB_LINGUA` は onboard.js の「フォローする相手の名前」で、別の問い）。
   そのあと `www/mod.js` の `adminStaffRow()` は `r.admin` を読むだけになる ── mod.js は私の物だが、
   net.js の select が先に変わらないと @lingua が押せる行に戻るので、変えていない。
4. **S4 の端末側**：更新が拒まれた時の `netOut()` は (A, token) を残す。サーバーは次に誰かがその
   iPhone で token を登録した時に外すが、**誰も入らなければ A の通知はサインアウトした iPhone に
   来続ける。**`netOut()` が `netDeviceDrop()` と同じ一行を通るか、サインアウトの道を一つにする。
5. `netDevicePut()` の「同じ組を出し直しても小さな書き込み一つ」は、今は本当（前は二回目から拒まれていた）。
6. `staff_drop()` の新しい断り（`the one above staff stays staff`）に `netWhy()` の文は無い。画面から
   @lingua の行は押せないので届かない。

## 3. 止まっている物（私の持ち物ではない）

- **`tools/docs-check.mjs` が 3ee94802 から赤。**schema.sql の宙に浮いたコメント
  「`create table if not`⏎`-- exists`」を、docs-check の表の拾い方（コメントを外さずに
  `create table (if not exists)? <name>` を読む）が「`if` という表」と読んでいた。その偽の定義が
  `docs/BACKLOG.md`（107・632・2138・2909）・`docs/DUPLICATES.md:72`・`docs/RISK.md:259` の
  `` `if(can(…))` `` のような六行を通していた。コメントは消えた文の説明で偽なので戻していない。
  直すのは docs-check（SQL のコメントを外してから拾う、または `if` を PLATFORM に）。

## 4. オーナーへ（直していない、決めごと）

r73 §5 にあるもののうち、この面の物:

1. **ブロックされた側から見えなくするか**（`post_seen`・`feed_hot`・`notices` に block の条件が無い。
   block 表は actor しか読めない）。決定 08-19「フィードはサーバーが外す」「検索は両側」との関係。
2. **アカウント削除で残る行とファイル**：`publication.actor`・`report.actor`・`feedback.author` の
   `set null` 三つ、`post-media` のファイル（`account_delete()` は storage に触らない）。
3. **版と消し方の決定どうしの食い違い**：期限なし・掃除なし と「3 版だけ残す」（`slice_hist_keep`）／
   丸ごと戻すと部分ごとに戻す（`admin_restore(language, kind, at)`）／「後から直した方が残る」
   （`keep_newer()`、端末の時刻）と「番号はサーバーが配る。iPhone の時刻はもう要らない」
   （2026-09-04）と「NEITHER SIDE WINS」（sync.js・DATA_SAFETY.md・EXPIRY.md）。
   `slice.no` は決定どおりサーバーが配るようにしたが、`ed`（端末の時刻）で勝ち負けを決める
   `keep_newer()` は r60 が入れたまま残っている ── どちらが今かはオーナーの物。
4. **既にある `device` の重なり**（A と B が同じ token を両方持っている行）は消していない。次に登録
   された時に外れる。一回きりで掃除するかは頼まれていない。
5. **通知を「行ごとに一回」にした時の、外して付け直し**：フォローを外してまたフォローするのは新しい
   行なので、前と同じく鳴る（いいねの付け外しも同じ）。これを一回にするかは決めていない。

直さない、決定のある物: S2（古い購入の持ち主、2026-09-23「考えなくていい」）、SQ6（2026-09-23
「それでいいよ」、コメントだけ今に）。

## 5. 読みと違った所（r73・r63 を測って）

- r73 §2-15「`daily-prompt` は Authorization を自分で見ない」── 見ていないのは本当だが、頭で
  `CRON_SECRET`（`x-cron-secret`）を確かめて 401 を返している。叩いて測った：nobody・publishable key・
  B のどれでも 401、何も読まず何も呼ばない。**直す物が無かった**（コードは変えていない）。
- r63 M1（`adminLoad` の失敗を空と読む）と `fbkRow` のコメント ── 今のコードで既に直っていた。
- r63 SQ4「35 行」── 数えて、関数の 32 行と列の revoke 4 行の `anon`。
- `docs/DATA_MODEL.md` の device「二行あるのが本当の形」はオーナーの決定ではなくセッションの設計の文で、
  指示の覆う一文（「その端末の宛先は、今サインインしている一人の物」）と CLAUDE.md の
  「`lingua.sess` はこの端末がどのアカウントか」の側に書き直した。
