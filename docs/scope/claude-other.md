# claude/other — 実機で踏んだ六つ（オンライン側）

## Goal
オーナーが実機（iPhone SE2 / iPhone 17）で踏んだ六つのうち、オンライン側 ──
二人目が居る世界でしか出ないもの ── を直す。

## Owns (may change)
- `www/sns.js`
- `www/home.js`
- `www/me.js` ── 2026-08-28 に渡された（顔の枝が終わったので）
- `www/net.js` ── 2026-08-28 に**借りている**（Google の枝は onboard.js 待ち）
- `www/i18n/*.js` ── 新しい鍵が要るときだけ
- `tools/sides-check.mjs`
- `tools/post-check.mjs`

### `www/net.js` の中で触らない一か所
**`netIdToken()` の周り。**Google の枝のもので、触ると Apple のサインインが
通らなくなる。それ以外は自由。

## Does NOT own
それ以外すべて。名指しで、要ると分かっているもの:

- `www/post.js` ／ `www/index.html` ── 返信画面の枝が持っている
- `www/shell.js` ── `tabBar()`。下タブの未読の数はここなので書けない
- `tools/fixture.mjs` ── キーボードの枝が持っている
- `supabase/schema.sql` ── **渡されなかった。**サーバーの形を変えると
  `npm run rls` と移行が要り、リリースまでの日数に対して高すぎる
  （リーダー 2026-08-28）。外部キーを戻すのは後で別の枝で

要ると分かったら**そこで止めて、その旨をコミットして push し、報告する。**
空くのを待たずに済む道が在るなら先にそちらを通る。

## Decision it implements
オーナーが実機で踏んだ六つ。仕様は決めない ── 値段・自由と有料の境・削除・
保存の期間・言葉づかい・しきい値は、迷ったら止めて訊く。

## 順番（リーダー 2026-08-28）
**③ → ① → ②**、そのあと ④ の残り半分。③は誰も検索できていない可能性が
あっていちばん重い。

⑤と⑥の残りは**こちらのものではない** ── どちらもしきい値で、リーダーが
オーナーに出す。

## 何を直すか（六つ、六コミット）
1. 人のプロフィールが「？」
2. 「この言語について」で人のをタップしても自分のが出る
3. 新しいアカウントが検索に出てこない
4. フォロー0 ── まず**正しい0かどうか**を確かめる
5. おすすめ0 ── 同上
6. 通知 ── 未読の数を下タブに、行に顔、顔を押すとその人のページ

`vProfile()` は `www/home.js`、`vNotif()` は `www/sns.js`。

## Check to run
`npm run es5` `npm run sides` `npm run dead`（速い）。
遅いものは**赤を見るためだけに**一度。直したあと緑を見に行かずに push。
全ゲートはリーダーが最後に一度。

**検査は全部「一人しかいない世界」で走る。ここで直すのは二人目が居る世界の
話なので、緑は証拠にならない。**何を根拠に直したかを報告に書く。

## 規則 8（外せない）
人の投稿・人のプロフィールを描く所で `WORDS` `LETTERS` `STG` `SET` `ME`
`meName` `langName` `findWord` `ltById` `myFontOn` を名指ししない。
**作る側のグローバルは、読む側では嘘になる。**`sides-check` が持っている。

---

# 分かったこと ── 2026-08-28

六つのうち二つを直し、四つは持っていないファイルに根がある。読んだ根拠を
付けて置いておく。**検査は一人しかいない世界で走るので、緑は証拠ではない。**
以下は全部コードとスキーマを読んだ結果。

## 直した（この枝に入っている）

### 4. フォロー0 ── 正しい0ではなかった
`netFeed('fo')` はサーバーの `follow` 表からフォロー中の人の投稿を返す。
その答えを `snsMine()` がもう一度 `meFollows()` ＝ `ME.fo` でふるっていた。
`ME.fo` は `meFollow()`（この端末でフォローを押したとき）だけが書き、
**サーバーから埋める処理はどこにも無い**。二台目に入ると空なので、正しく
届いた投稿が全部そこで落ちて 0 になる。オーナーは SE2 と 17 の二台。

サーバーが選んだ答え（`FO_HAVE`）をそのまま出すようにした。`ME.fo` は
答えが来る前に落ちる写しとして残す。

**残り半分は別セッション:** `ME.fo` をサーバーから埋める ── 読みが
`www/net.js`、書きが `www/me.js`。それが入るまで、二台目のフォロー
ボタンは既にフォローしている人に「フォロー」と出たままになる。

### 6. 通知の行に顔 ── 半分だけ
行の顔と、顔を押してその人のページへ、は入った（`postAvHTML()` を呼ぶ）。
**未読の数を下タブに出すのは入っていない** ── `tabBar()` は
`www/shell.js` で、この枝の持ち物ではない。
未読の印もサーバーに無い（`notices()` は既読の欄を返さない）ので、
「どこから未読か」を決める必要がある ＝ しきい値。オーナーのもの。

## 止まった（根が他所のファイルに在る）

### 1. 人のプロフィールが「？」
`whoOf(h)`（`www/me.js`）は **`POSTS` の中にその人の投稿がある時だけ**
その人を知っている。無ければ `{who:'', av:null, …}` を返し、`postFace()`
が `postWho(p)||'?'` に落ちて「？」になる。名前も空、投稿一覧も空。

そして**他人の投稿を取ってくる関数は存在しない**（`author=eq.` で投稿を
引くのは自分のぶん一か所だけ）。検索から人を開いても、その人の投稿は
一つも来ない。

要るもの: `www/net.js` に「ハンドルからその人のプロフィール／投稿を引く」
一本と、`www/me.js` の `whoOf()` がそれを読むこと。**回り道は無い** ──
`whoCard()` も `whoOf()` も `me.js`。

### 2. 「この言語について」で自分のが出る
`whoCard()`（`www/me.js`）の言語名の行は `go("about")` を**誰の、を付けずに**
呼んでいる。飛んだ先の `vAbout()` → `wldPage()`（`www/home.js`、こちらの
持ち物）は `world()` `LETTERS` `langName` ── **作る側のグローバル**しか
読まない。だから必ず自分のが出る。規則8そのものの形。

三つ要る: (a) `me.js` が「誰の」を渡す (b) `net.js` にその人の言語を引く
一本 (c) `home.js` が他人の言語を描く。**(c) だけがこちらのもので、(a)(b)
が無いと書けない**（描くものが無い）。半分だけ書くと、何も無いページに
飛ぶ入口が出来る。

### 3. 新しいアカウントが検索に出てこない ── 根が見えた
`netFindWho()`（`www/net.js`）はこれを訊いている:

    /rest/v1/profile?select=id,handle,display,av,language(name)

`language(name)` は PostgREST の embed で、**二つの表の間に外部キーが要る**。

- 2026-08-19（`52d23e1`）にこの embed が書かれた時、
  `language.owner` は `references profile(id)` だった ── 通っていた
- 2026-08-22（`2f214ba`）に `language.owner` が
  **`references auth.users(id)` に張り替えられた**（無名アカウントが
  言語を持てるように）

`profile` と `language` の間の外部キーはこれで無くなった。両方 `auth.users`
を指しているだけで、PostgREST はそこを繋がない。embed が解決できないと
PostgREST は **PGRST200 / HTTP 400** を返す ── つまり
**新しいアカウントだけでなく、人の検索が誰も返していない**はず。
オーナーには「今作ったアカウントが出てこない」と見える。

**誰も気づかなかった理由:** `tools/fixture.mjs` は `netFindWho()` の答えを
手で置いている（「there is no server in a walk」）。この問い自体を通す検査は
一本も無い。**この主張を持っている検査が無い。**

直すのは `www/net.js`（embed をやめて言語は別に引く）か
`supabase/schema.sql`。どちらもこの枝の持ち物ではない。

### 5. おすすめ0 ── 設計どおりの0。しきい値なので決めない
`feed_hot()`（`supabase/schema.sql`）:

    where v.created_at >  feed_slot() - interval '48 hours'
      and v.created_at <= feed_slot()

`feed_slot()` は `date_trunc('hour', now()) - (extract(hour from now()) % 4)`
── **今の4時間の区切りの頭**。つまり**区切りより後に書かれた投稿は
おすすめに入らない**。schema.sql 自身がそう書いている ──「a post written a
minute ago is not in this list and cannot be until the tick comes round.
That is the shape that was asked for.」

だから、投稿が全部ここ数時間のものしかない状態（新しい環境、二台目、
オーナーが投稿した直後）では **おすすめは必ず 0**。この0は今の設計では
正しい。

**そして食い違いが一つ:** オーナーの言葉は
`schema.sql:1005` に「12時間ごとにバズった順」と記録されているが、
`feed_slot()` は **4時間**で刻んでいる。どちらが正かは決めない。

窓（4時間 / 48時間）を動かすかどうかは**しきい値なのでオーナーのもの**。
`supabase/schema.sql` もこの枝の持ち物ではない。

## ついでに見つけたもの（六つの外。直していない）

`snsList()` は 'rec' のとき `postAll()` を返す。`postAll()` → `postKept()`
は **`at` の降順に並べ直す**。`feed_hot()` はスコア順で答えていて、
`netFeed()` 自身が「順序はサーバーの答え」と書いているのに、
**おすすめタブはその順序を捨てて時間順に並べ直している**。

直さなかった理由: 直すと「おすすめはサーバーが返したものだけ」になり、
上の 5 の窓が今のままだと**画面が今より空になる**。窓の判断（オーナーの
もの）と一緒でないと、直したほうが悪く見える。

---

# 二巡目 ── me.js と net.js を受け取ったあと（2026-08-28）

## 直した

### 3. 検索 ── embed をやめ、言語は別に引く（`3429a51`）
`language(name)` は外部キーを歩く embed で、2026-08-22 に
`language.owner` が `profile(id)` → `auth.users(id)` へ張り替えられた時に
道が消えていた。**解けない embed は要求ごと 400 になる**ので、人の検索は
誰に対しても何も返していなかった。二回訊く形にした（netFeed がフォロー
一覧を別に訊くのと同じ）。

**検査を一本足した（`tools/sides-check.mjs` 規則三本目）。**答えではなく
**組み立てた URL** を見る ── net.js の select から embed を入れ子ごと拾い、
schema.sql の外部キーを Postgres が読む順で組んで照合する。サーバー不要。
バグを戻して赤（4本中1本、exit 1）、戻して緑を見た。
**この検査は直後に働いた** ── ④で足した `followed(handle)` を自動で見ている。

### 1. プロフィールが「？」（`0e3dfc8`）
`netWho()` で profile 行を handle から引き、`WHO_HAVE` に控える。
サーバーが本体、投稿の写しは答えが来るまでの繋ぎ。
「その名前は居ない」は答えなので訊くのを止める。訊けなかった時だけ再試行。
bio とフォロー数は入れていない ── **`profile` にその列が無い**。0 を描くと
教わっていないことを言い出す。

ついでに: `postFace()` は `p.id` が無いと **'me' に落ちる**ので、文字を描いた
人の顔が私の鍵の下に仕舞われていた。鍵を handle にした。

### 4. フォロー一覧をサーバーから埋める（`35af082`）── ④完了
`netFollowing()` ＋ `meFollowPull()`。一セッション一度、足し合わせず置換。
答えが空中の間に押されたら書かない。

### 2. 嘘の入口を閉じた（`10b2e08`）── **半分だけ。下を読むこと**

## まだできないもの ── サーバー側が要る

### 2. 人の「この言語について」は、まだ描けない
記事は `wld` スライスで、**`slice_read` は `l.owner = auth.uid()`** ──
**他人の言語は公開されていても一行も読めない。**取ってくるものが無い。

やったのは**扉を閉じただけ**。名前は残し、押せなくした（非公開のときに
`wldRow()` が取るのと同じ形）。押すと私の言語が出る状態よりは良い、という
だけのもので、**オーナーが見たいものはまだ出ていない。**

開けるには `slice_read` が公開された言語を読ませる必要がある
＝ `supabase/schema.sql`。**渡されていない。**開け直すのは `whoCard()` の
一行で、載せるものができた日に。

### 5・6 の残り ── しきい値。リーダーからオーナーへ
- ⑤ 区切りより後の投稿がおすすめに入らない（`feed_slot()` は4時間刻み）
- ⑥ どこから未読か。`tabBar()` は `www/shell.js`

**⑤の食い違いはリーダーが片付けた** ── `docs/FEATURE_RULES.md` に
「入れ替えは4時間ごと」（2026-08-28）と在り、`schema.sql:1005` の12時間の
ほうが古い記録。**コードが正しく、コメントが古い。**schema.sql は触っていない。

## 触っていないもの（依頼どおり）
`netIdToken()` の周り（Apple のサインイン）。`supabase/schema.sql`。
`www/shell.js`。`www/post.js` / `www/index.html`。`tools/fixture.mjs`。
`www/boot.js`（`bootSession()` に足したかったが持ち物ではないので、
`meFollowPull()` は三つの画面から呼んでいる）。

---

# 三巡目 ── `schema.sql` を渡されたが、②では触っていない（2026-08-28）

**`slice_read` は緩めませんでした。**前提が崩れているので止まります。

## 「公開された節だけ他人に読める」は、いま在る決定の反対

`slice_read` が持ち主だけなのは**書き落としではなく、決めてあること**。
四か所に同じ文で書いてあります:

- `supabase/schema.sql:597` ──「not even for a language that is PUBLISHED,
  because **publishing is a copy somebody is given and not a door into the
  phone**」
- `tools/rls-check.mjs:270` ── 同じ文。そして**それを突く行が既に在る**:
  `'B cannot read a published language's slices'` → **denied**
- `tools/rls-check.mjs:800` ── 形の主張:
  `slice` の SELECT 政策で `owner = auth.uid()` を含まないものは **0本**
- `docs/FEATURES.md:588` ──「The server may not hand a slice to anybody but
  its owner. **This is the real block and it is deliberate** … **that is a
  question, not a gap to close.**」

**指示どおりに書くには、この二本を消すことになります** ── 「他人は読めない」と
言っている検査を、自分の機能を通すために消す。この repo が防ぐために建って
いる形そのものです。「either a check holds the claim, or do not make it」の
裏返しで、**通すために検査を消す**のはその一番悪い形。

そして `docs/FEATURES.md` は**この指示を先回りして**「gap ではなく question」
と書いています。**公開が何を意味するかはオーナーの決めごと**で、こちらでも、
おそらくリーダーでもありません。

## 仮に緩めても、今日は何も開きません

**`published_at` を書くコードがどこにも在りません。**`www/` 全体で読むのは
`language_read` だけ、書く場所は 0。**言語は一つも公開されていない**ので、
`published_at is not null` を条件にした政策は**誰にも何も開けません**。
緑になって、端末では何も変わらない ──「緑になる間違いが一番高くつく」。

## 「公開された節」は、政策から読めない所に在ります

`hide`（記事まるごと非公開）も、節ごとの `dl` も、**`wld` スライスの body の
中の JSON**。`slice.body` は `jsonb` ではなく **`text`** です。政策から読むには

- `text` を jsonb にキャストする（不正な行が一つでも在ると**読みが例外**に
  なる。拒否ではなく、全員のクエリが落ちる）
- そして `slice` の政策の中から `slice` を読むので **RLS の無限再帰**。
  避けるには `security definer` の補助関数が要る

**守る対象そのものの中に、鍵が入っている。**セキュリティ境界にこの複雑さを、
リリース前に、しかも上の決定に反して入れる理由が見当たりません。

## だから ② の状態は変わっていません

閉じた扉（`10b2e08`）はそのまま。**②は未完で、オーナーの判断待ちです。**

## 訊きたいこと（オーナーへ、リーダー経由）

1. **公開された言語は、他人に「読める」ものですか、それとも「渡される写し」
   ですか。**いまの決定は後者です。前者にするなら `slice_read` と、それを
   突く二本の検査を、決定として書き換えることになります
2. そもそも**言語を公開する道が無い**（`published_at` を書く場所が 0）。
   公開はいつ、何をすることですか

## ついでに ── ③ の副作用として報告

`netLangNames()` は `language_read`（公開 or 自分）で訊きます。**何も公開
されていない**ので、**検索結果のハンドルの横の言語名（「lingua マーク」）は
他人については空**になります。人は返るようになりました（これが③の本体）が、
タグは公開が始まるまで付きません。**embed だった頃も同じ政策を通っていたので、
これは後退ではありません。**

## 触っていないもの
`supabase/schema.sql` ── 渡されましたが、上の理由で一行も変えていません。
`npm run rls` は**変更前の状態で**回して緑を確認しました
（182 attempts / 43 shape、そのうち二本が上の主張）。

---

# 公開なら公開 ── サーバーの守り（2026-08-28）

オーナー:「この言語については公開したら公開、非公開にしたら非公開だけど
それ以外にあんのか？」── 二つの状態しかない。

## 当てる順番（オーナーが当てます）

**一手だけ。**Supabase のダッシュボード → SQL Editor に
`supabase/schema.sql` を**丸ごと貼って実行**。政策は全部
`drop policy if exists` → `create policy` なので、何度当てても同じ結果に
なります。**先に当てるものも、あとに当てるものもありません。**

## 何が変わるか

`slice_read` に二本目の道が付きます:

- **持ち主** ── 今までどおり、全部
- **公開された言語の、記事が読む五つ**（`wld` `script` `snd` `letters`
  `kb`）── 誰でも読める（アカウント無しでも。投稿やプロフィールと同じ）

**辞書と文法は開きません**（`words` `phases` `gram2` `lines` `notes`
`talk` `lang`）。「言語ページ公開と単語や文字のdl可能は別だし」── 人の
ページを読めることと、その裏の何ヶ月かを渡されることは別の問い。

**書き込みは一つも変えていません。**公開はページが読めることであって、
入口ではない。

## 突いた行（`npm run rls`、197 attempts / 45 shape、全部緑）

譲れない側:
- `nor the article of a language kept private` ── 非公開の記事は読めない
- `nor its letters, nor its keyboard` ── 非公開の文字も鍵盤も読めない
- `nor read a private article with no account` ── アカウント無しでも同じ

開く側:
- `B reads a published language's article` / `and its letters`
- `and so does somebody with no account at all`

開かない側:
- `but not its dictionary` / `nor its grammar`
- `nor the dictionary with no account at all`
- `nor rewrite the article it can read` / `nor delete it`

**赤を見ました:** 節の一覧に `words` と `phases` を足したら
`but not its dictionary`・`nor its grammar`・`nor the dictionary with no
account at all` の三本が赤（wanted denied, got ok）。戻して緑。

**ついでに分かったこと:** `published_at is not null` を外しても
`nor the article of a language kept private` は緑のままでした ──
`language_read`（公開 or 自分）が**この政策の中の副問い合わせにも効く**ため。
守りは二重になっています。外したことは形の主張
（`and published is what opens the other one`）が捕まえます。

## まだ足りない半分

**`published_at` を書くコードがまだ 0 本**なので、これを当てても**今日は何も
公開されません。**記事の公開スイッチ（`setWldHide`）をこの列に繋ぐのが次の
コミットです。
