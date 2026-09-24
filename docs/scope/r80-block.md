# r80-block ── ブロックはサーバーが外す（2026-09-24）

作業セッション r80-block（`claude/r80-block`、`origin/integ-0905` から）。
指示: `claude/leader-briefs:docs/scope/brief-r80-block.md`。決定: `docs/FEATURE_RULES.md` § 2026-08-19 Blocking
「Blocked means you see nothing of them. Not a quieter timeline — gone: the feed (left out by the server),
threads, profiles, search on both sides, and the notices.」

## 覆う一文

**ブロックした相手の書いた物・した事を読みが返すかは `block_hides(who)`（`supabase/schema.sql`、`block` 表の
すぐ下）一つが答え、アプリが読む view と表関数は、人を返す列ごとにそれを通る。**

- `post_seen` ── 書いた人（`p.author`）。タイムライン・スレッド・人のページの投稿・投稿の検索・広告枠の投稿は
  全部これを読むので、ここ一か所で全部。`feed_hot()`・`feed_fo()` の書いた人もこれを通る。
- `feed_fo()` ── 回した人（`r.actor`、`by`）。行の二人目なのでここで訊く。
- `notices()` ── 通知の主（`ev.actor`）。いいね・リポスト・返信・フォローの四つを、束ねる前の一か所で。

片方向: 訊くのは「読んでいる人が `who` をブロックしたか」だけ。`block_read` が本人の行しか読ませないので、
この関数は構造上それ以外を答えられない。

## 検査が数えるもの（`tools/rls-check.mjs`）

新しい二人 BK（塞ぐ）・BD（塞がれる、@blockd）。BD は書く・BK に返す・いいね・人の投稿を回す・BK を
フォロー・言語を公開、BK は BD をフォローしてからブロック。BD の投稿を一つ、tick の前に置く（`feed_hot` に
載るように）。

`_block_seen()` が catalogue から **public の view 全部と、引数なしで呼べる表関数全部**を拾い、BK として
二回読む ── ブロックあり（shut）と、その場で外して（open）。行のどこかに BD の uuid か @ があれば数える。

- open が 0 → その読みは人を返さない（面の外、数えて出す）
- open > 0・shut > 0 → 赤。ただし `BLOCK_HELD` に名前と理由がある物は緑（保留）
- `BLOCK_HELD` の物が shut 0 になった日 → 赤（「外したなら名前を消せ」── 古い例外は許可になる）
- 読めない（エラー）→ 赤

今: `block: 7 reads walked as the blocker -- 4 leave them out, 3 held by name, 0 name nobody`、
`rls: 498 attempts … none of them got through`。

**赤を見た**（どれも一回ずつ）:
- 直す前の schema.sql: `post_seen` 3・`feed_hot` 1・`feed_fo` 4・`notices` 3 行が BK に出る
- `notices` の一行だけ抜く → notices 3 / `feed_fo` の `by` だけ抜く → feed_fo 1 /
  `post_seen` だけ抜く → post_seen 3・feed_hot 1・feed_fo 3
- 明日の view（`create view … as select author from post`）を足す → その view が赤
- `profile_seen` に条件を足す → 「held by name and shows nothing of them -- take it off BLOCK_HELD」

既存の項で、「B blocks A」のあと B を普通の読み手として A の投稿 P を読む 7 項（いいねの数・取り下げの行・
返信の数）が赤になった ── ブロックが効いていなかったから緑だった。block の節の最後に
「B lifts B's own block」（`block_drop` の許す側、今まで試していなかった）を足して節を閉じた。

## 保留（`BLOCK_HELD`）── 直していない、その理由

| 読み | 今 | 外すと何が壊れるか［読んだ］ |
|---|---|---|
| `profile_seen` | BK に BD のプロフィール・@・言語名が出る。人の検索（`netFindWho`）もこれ | **ブロックを解く道が無くなる。** 解くボタンは相手のプロフィールの「…」（`www/me.js:1425`）と投稿の「…」（`www/post.js:4253`）だけで、ブロック一覧の画面は無い。投稿は既に消えているので、残る道はプロフィールだけ。さらに端末の「ブロック中」の印（`netBlockedRead()` → `netBlockedHandles()`）は、ブロックした id の @ を `profile_seen` から引いているので、外すと印が全部消える |
| `language_seen` | BD の公開言語の行が出る | 相手のページに描く言語（`profile_seen` がこれを読む）。取った言語が一覧から消える（人が持っている物が見えなくなる）── 言語が「相手の物」に入るかは決定に書いていない |
| `follow_seen` | BK→BD・BD→BK の行が出る | ブロックする時にフォローを外す（`meBlock()` → `meFollows(h)` → `meFollow(h)`）。フォローしているかをこの一覧から訊いているなら、外すとフォローが残る［読んだ、測っていない］ |

**オーナーへ**: プロフィールを外すなら、ブロックを解く場所が要る（設定にブロック一覧を置く、など）。
画面を一つ足すのはオーナーの決めごと（CLAUDE.md「Ask before making a fourth」と同じ種類）なので、決めていない。
決まったら: `profile_seen`・`language_seen`・`follow_seen` の `where` に `not block_hides(…)` を足し、
`BLOCK_HELD` から名前を消す（検査がそうしろと言う）。解く道は `block` を読む view（`block_seen`: 自分の行と
相手の @）を一つ足すのが一番短い ── `netBlockedRead()` が二本目の GET で `profile_seen` を引くのもそれで消える。

## 検索の両側 ── 直していない

決定は「search on both sides」。**今は片側だけ**（BK が検索しても BD の投稿は出ない、BD の人は出る）。
検索は `post_seen`（投稿）と `profile_seen`（人）をそのまま読む（`netFindPosts`・`netFindWho`、`www/net.js`）
── フィード・スレッド・プロフィールと同じ view。view で両側にすると、それら全部が両側になる。
「ブロックされた側からフィード・スレッド・プロフィール・通知でも消すか」は決まっていない（r73 §5-6）ので、
それは決めない。

検索だけ両側にするには、検索が自分の読み（表関数 `find_posts(q)`・`find_people(q)` のような物）を持ち、
そこで `block_hides(who)` と逆向き（`who` が読む人をブロックしたか ── `block` を読むので `security definer`
が要る）の両方を訊く。呼ぶのは `www/net.js`（r79-acct の持ち物）なので、サーバーの関数だけを先に置くことは
しなかった（誰も呼ばない関数を置くのは「we'll need this later」）。逆向きの答えは「ブロックされた」を相手に
漏らす（検索で出ないのにフィードで見える、で分かる）── それも両側に決めた時の代金で、オーナーのもの。

## 端末の側（`www/`、r79-acct が持っている ── 触っていない）

サーバーが外すので、端末で外している所は消す。**継ぎ当てではなく消す**:

- `www/net.js` `netFeed()` の三つの `netBlocked(function(bl){ … })`（3243・3284・3318 付近）と
  `netPromos()` の一つ（4187 付近）── 返った行から `bl` を抜いている。サーバーの答えをそのまま使う。
- `www/post.js:122` `postBlocked()` と、それを呼ぶ `postShown()`（143）・`www/sns.js:2000`・`:2772` ──
  投稿はもう来ない。
- `www/sns.js:3154` 通知から `meBlocks(n.hd)` を抜く filter ── 通知はもう来ない。
- `www/net.js` `netBlocked()` と `NET_BL`（uuid の写し）── 使う所が無くなる。`tools/load-baseline.txt` の
  `rest/v1/block` の行も（r71 の scope が書いたとおり）。

**残すもの**: `netBlockedRead()` の @ の写し（`NET_BL_HD`・`netBlockedHandles()`・`meBlocks()`）── 「…」の
ボタンが「ブロック」か「解除」かを決めるのに要る。`www/sns.js:2767`（人の検索から抜く）── `profile_seen` が
保留の間は要る。どちらも `profile_seen` を外す日に一緒に書き直す。

## 持ち物外で見つけたこと（直していない）

- **Apple の通知は塞いだ相手からでも鳴る。** `supabase/functions/push-send/`（index.ts・push.mjs）は
  `block` を一度も読まない。BD が BK に返信・いいね・フォローすると、アプリの通知一覧には出ないのに、
  BK の iPhone は鳴る。決定の「the notices」に入る。直す所は push-send（行を読んで鳴らす前に、宛先が
  行の主をブロックしているかを訊く ── service role なので `block` を直に読める）。
- **数には入っている**: `post_seen` の `likes`・`boosts`・`replies` は塞いだ相手のいいね・返信も数える
  （数は所有者の権限で数えるので `block_hides` を通らない）。`feed_hot()` の並びの点も同じ。人は出ないが、
  数は相手の分を含む。並びを読む人ごとに変えると「みんなに同じおすすめ」が崩れるので、数は変えていない。
  数から抜くかはオーナー。
- 表そのもの（`post`・`react`・`follow`・`profile`・`language`・`publication`）は `using (true)` 系のまま。
  アプリはそれらから人の中身を読まない（自分の行と、@→id の引き当てだけ）。`profile`・`follow` に条件を
  入れると、ブロックの解除（`netIdOf()` が `profile` を読む）とブロック時のフォロー解除（`follow` の
  DELETE は WHERE で列を読むので select の policy も通る ── PostgreSQL の文書で［読んだ］、測っていない）が壊れるので、面は「アプリが読む view と表関数」と定めた。
- `docs/DATA_MODEL.md` に block の文は無かった（411 行は別の物の置き場の話）。貯まる物が変わらないので
  足していない。
