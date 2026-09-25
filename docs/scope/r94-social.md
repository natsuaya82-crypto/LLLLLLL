# r94 ── いいね・リポストした人の一覧、引用リポスト、解除の確認、投稿の詳しい時刻（1.0.3）

- 日付: 2026-09-25
- 枝: `claude/r94-social`（`integ-0905` 59678c5d から）
- 決定: `docs/FEATURE_RULES.md`「### 2026-09-25 いいね・リポストした人の一覧、引用リポスト、解除の確認、投稿の詳しい時刻（1.0.3）」
- 1.0.3 に入れる。1.0.2 は審査中なので急がない。

## 面（数えた物）

- **長押し**: `data-hold` を読むのは `www/shell.js` の `holdStart()` 一つで、行き先が中に書いてある
  （プロフィールのタブ → 言語の一覧）。二つ目の長押しは、`data-hold` が `data-do` と同じく**名前**を持ち
  `holdStart()` がそれを動かす形に書き直す（一つの仕組み）。`act-check` の名前の収穫に `hold` を足す
  （act-map を持っているので、その検査も持ち物と読む）。`tools/press.mjs` は全ての `data-hold` を長押しする
  ── 触らない。
- **人の一覧**: フォロー一覧は `www/me.js` の `fol*`（ページで切る・続き・人と関係を読む）と
  `www/net.js` の `netFollowRows()`（keyset）、`vFollows()`、`www/sns.js` の `pullOn('fols')`・
  `pageReads('follows')`・`snsMore()`。いいね・リポストした人の一覧は**この同じ仕組み**に載せる
  ── 一覧の鍵をルートの引数（`ers:h` `ing:h` に `like:<投稿>` `boost:<投稿>` を足す）にして、
  読む先だけ違う。二つ目の一覧の仕組みは作らない。サーバーは `react_seen`（`follow_seen` の形、
  `block_hides`・`mute_hides` で外す）。
- **引用**: `post` に列 `quote_of`（`supabase/schema.sql`）。書く側 ── `post_make` に
  `post_blocks(quote_of)`、`grant insert (...)` に列。読む側 ── `post_seen` に `quote_of` と、今の
  元の投稿（見えない時は null）。`feed_hot()`・`feed_fo()` は `post_seen` と同じ列を返すので同じ二つを足す。
  `notices()` に `quote` の枝。端末 ── `netPush()`（列）、`netRow()`（元の投稿）、`postRow()`（下に小さく）、
  作る画面（`pwHTML()`）、リポストの印を押した時の `popAsk()`、通知の行（`www/sns.js`）。
- **解除の確認**: リポストを取り消す所は `postBoost()`（`www/post.js`）一つ、フォローを外す所は
  `meFollow()`（`www/me.js`）一つ。確認はそこで、削除の確認（`postDel()`）と同じ `popAsk()`。
- **詳しい時刻**: 時刻は `postWhen()` 一つ、スレッドで開いた投稿は `postFocus()` が言う。

## 変えてよい物

リーダーの一覧のとおり: `www/post.js` `www/sns.js` `www/me.js` `www/net.js` `www/shell.js`
`www/route-map.js` `www/act-map.js` `www/i18n/*.js`、`supabase/schema.sql`（post の引用の列・policy、
notices、react/follow の読みの view）、`supabase/functions/push-send/*`、上を持つ `tools/*-check.mjs`、
`tools/rls-check.mjs`（CASES）、`tools/fixture.mjs`、`tools/load-baseline.txt`、
`docs/FEATURE_RULES.md`（その決定の Implementation status の行だけ）、`docs/CHANGELOG.md`、この紙、
`www/index.html`（新しい画面・引用の枠の CSS だけ、角丸・枠線なし）。

## 足された持ち物（リーダー 2026-09-25 17:22）

- E2: `www/glyph.js`（`inkFaceCSS()`・`installTypeFont()` の `LinguaType` の face）と `www/index.html` の `.pline`。
- 引用の iPhone の通知: `www/push.js`（`PUSH_KINDS`・`pushSw()`）、`www/core.js`（`SET_PREFS` のその一行だけ）、
  `supabase/functions/push-send/*`、`supabase/schema.sql` の push のトリガー、`tools/push-check.mjs`。
- `git log --all`: `www/glyph.js`・`www/push.js` に他の枝は無し。`www/core.js` と `www/act-map.js` は
  `claude/r96-hand` が触っている（`fc809057` 改名）── core.js は `SET_PREFS` の一行だけ、取り込みはリーダーの物。

## 変えない物

- `www/push.js`・`www/core.js` ── 持っていない。**引用の iPhone の通知は、種類を一つ足すと設定の
  通知の部屋に一行（`PUSH_KINDS`・`pushSw()`、`www/push.js`）と `SET_PREFS`（`www/core.js`）が要る**
  （push-check がこの三つが揃うことを数える）。持っていないので止めて報告する。アプリの中の通知
  （通知タブ）は `notices()` と `www/sns.js` で出る。
- `tools/press.mjs`、`docs/STATE.md`、`CLAUDE.md`。
- 引用の数を出すか・どこに出すか（決まっていない）。リポストの数に引用は入らない（別の表）。

---

# 報告（2026-09-25）

## 何を、どのファイルで

| コミット | 何 |
|---|---|
| `8887fa5c` | scope 宣言（この紙） |
| `0cf523a3` | D（最初の形）: スレッドで開いた投稿の頭の時刻を詳しい日時に。**後で決定が変わった ── 下の D2** |
| `d4421137` | C: `postBoost()` は取り消す時だけ `popAsk('post.unboost.q')`、送るのは `postBoostGo()`。フォローの押しは `meFollowPress()`（外す時だけ `me.unfollow.q`）、行いは `meFollow()` のまま ── ブロックが外すフォロー・オンボーディングの @lingua・［再接続］は訊かない。`act-map` の `meFollow` → `meFollowPress`。i18n 三つ×10 |
| `ea3061cc` | リファクタ: `data-hold` は行いの表の名前を持ち、`holdStart()` が `actRun(ACT, el, 'data-hold')`（`data-a` も同じ要素の物）。プロフィールのタブは `holdLangs`（前と同じ行き先）。`act-check` が `hold` を押す名前として数える |
| `f1f4b698` | サーバー A: `react_seen`（`follow_seen` の形: post・kind・created_at・actor_handle、`block_hides` 両向き・`mute_hides`・`post_blocks` で外す）。`rls-check` 五行 |
| `658caf9d` | リファクタ: 人の一覧の一ページ（keyset）を `netPplPage()` に、`netFollowRows()` がそれを呼ぶ |
| `8fdceacb` | A: 一覧の鍵をルートの引数に（`folList()`: `ing[:h]` `ers[:h]` に `like:<sid>` `boost:<sid>`）、`folPull(L, …)`・`folsAsk`・`folsGot`・`folMore` がそれを読む。`vReacts()` と `vFollows()` は `folPage()` 一つで描く。ルート `reacts`（`PAGES`・`route-map`・`pageReads` は `fols`・`MORE_ON`・`snsMore`・`pageName`）。`netReacters()`。ハート・リポストに `data-hold`（`postHoldLikes`・`postHoldBoosts`、sid があり数が 0 でない時だけ）。`folGot` は呼ぶ所が無くなって消した。i18n 四つ×10。fixture 三面 |
| `8d8cf2c0` `54787183` | CHANGELOG（コードの前に）: `post.quote_of`、写しの `qt`・`qp`、下書きの `qt` |
| `8ed7d0ae` | サーバー B: `post.quote_of uuid`（外部キー無し）＋索引、`post_make` が `post_blocks(quote_of)`、`grant insert` に列（update には無し）、`post_seen.quote_of`・`quoted`（今の元の投稿、消えた・非表示・凍結・非公開・ブロックは null）、`feed_hot`・`feed_fo` に同じ二列（`feed_fo` も名前で drop）、`notices()` に `quote` の枝。`rls-check` 十三行 |
| `52a02005` | B: リポストの印 → `popAsk('', リポスト, 引用)`（sid の無い投稿は今まで通り）。`postQuote()` → 投稿画面、`PW.qt`。`netPush` が `quote_of`、`netBody` は `qt`・`qp` を運ばない、`netRow` が `quoted` → `qp`、`NET_POST_SEL` に二列、`postFresh` が `qp`。`postQuoteHTML()` 一つでタイムラインの行（押すと元の投稿）と投稿画面。下書きに `qt`。`openPost('new')` は `qt` も落とす。通知の `quote`（リポストの印、`notif.quote`）。`popAsk` は問いが空なら行を描かない。CSS `.pqt`（左の一本の線、枠・角丸なし）。i18n 四つ×10。fixture 三面 |
| `12206b6c` | integ-0905 を取り込む |
| `c64ca889` | D2（決定の直し 0c664ea6）: 頭の時刻は全部の行で `postWhen()`（2h のまま）、スレッドで開いた投稿だけ本文の下・ボタンの上・右寄せに `.pwhenf`（`postWhenFull()`、`when.full`）。決定の Implementation status |
| `8f428cda` | CHANGELOG: 意味を切った投稿（`nm`）、時刻の置き場 |
| `ac0c9774` | E1・E3: 投稿画面の下の帯に「意味」の切り替え（`pwMnSw`、`pwMnOff()` 一つが欄・輪・上限・送る時を答える、今日のお題と編集では出さない）。切った投稿は `mn` 空・`nm:1`、`postSay()` は何も答えない（タイムライン・スレッド・引用・カード）。下書きは `nm` を持つ。`.pmn`・`.lnin.pwmn` を `.75rem`（15px の 0.8 倍） |
| `78151f77` | integ-0905 を取り込む（CHANGELOG の頭で両方の項を残す） |
| `67cc32bb` | 持ち物を足す（リーダー 17:22）: E2 の glyph.js、引用のプッシュの push.js・SET_PREFS・push-send・トリガー |
| `4b3cd43d` | E2: `inkFaceCSS()` が同じ字を `LinguaType`（今のまま）と `LinguaLine`（`size-adjust` を `--ink-over`）の二つの規則で出す。`.pline`・投稿画面の行は `--face-line` で 15px、行の高さは描いた字の分。引用・返信先・通知の行は各自の大きさを `--ink-over` で割る。`line-check` 12 |
| `29e71cd4` | 直し: E1 の切り替えが投稿画面の帯を画面の外へ押していた（測った: 帯は 320 で何も足さずに 320/320、語と切り替えで 411/390）── 帯から出して意味の欄の頭の行に一語（`post.mn.sw`）、オン金・オフ灰。`tl-check` 15 に帯の幅 |
| `c9f69000` | CHANGELOG: 引用の通知と `push_quote` |
| `1b4557ba` | 引用の iPhone の通知: `PUSH` の reply の鍵に `reply_to`・新しい `quote`（鍵 `quote_of`）、`SAY` 十言語、トリガーは `push_on_post` 一つ（`push_on_reply` を書き直し、非公開は鳴らない）、`PUSH_KINDS`・`pushSw()`・`SET_PREFS` の `push_quote`・`push.quote` 十言語。`store-check` に欄、`acct-check` 82 はいいねの行を名前で探す |

## 振る舞い

- **A** ハート・リポストの印を長押し（0.5 秒、サーバーにある投稿で数が 0 でない時）→「いいねした人」「リポストした人」の画面。フォロー一覧と同じ行・同じフォローボタン、新しい順、50 で切って下で続き。ブロックの間の人・ミュートした人は出ない。長押しはハートを押さない。
- **B** 誰もリポストしていない投稿の印を押すと「リポスト／引用」（問いの行は無く、二つの答えだけ。外側を押すと何もしない）。引用 → 投稿画面、下に元の投稿が小さく。送ると行に `quote_of`。タイムラインでは本文の下に元の投稿が小さく（左に一本の線、押すと元のスレッド）、元が消えた・非表示・凍結・非公開・ブロックの時は「この投稿は表示できません」。元の人の通知タブに「〇〇 が引用」（リポストの印）。
- **C** リポストの取り消しとフォローの解除（プロフィールのボタン・人の一覧のボタン）は「リポストを解除しますか？」「@〇〇 のフォローを解除しますか？」［解除］［閉じる］。付ける方は訊かない。ブロックがフォローを外す時は訊かない。
- **D** スレッドで開いた投稿: 名前の横は「2時間」のまま、本文の下の右に「2026年9月25日 14:51」（言語ごとの並び、`when.full`）。
- **E** 投稿画面の意味の欄の頭の「意味」を押すと灰になり、意味の欄が消え、その投稿は意味を持たない。投稿の行の普通の文字は 15px（前は 20.8px）、描いた字は前と同じ大きさ、意味の行は 12px。
- **B の通知** 引用されると iPhone に「@〇〇 が引用」、押すとその引用。設定の通知の部屋に「引用」のスイッチ。

## 保存する物

- サーバー: `post.quote_of uuid`（外部キー無し、索引あり、insert の列だけ）。ビュー `react_seen`、`post_seen` に `quote_of`・`quoted`、`feed_hot`・`feed_fo` に同じ二列、`notices()` に `quote`。**本番の SQL Editor に schema.sql を貼る必要がある**（オーナー／リーダー）。
- `profile.prefs.push_quote`（無いのはオン）。
- 投稿の `body`: 意味を切った投稿は `nm:1`・`mn:''`。下書きの `body`: `qt`・`nm`。端末の写し: `qt`・`qp`（`qp` は上がらない）。消す物・移す物は無い。前からある投稿・下書きはそのまま読める。

## 回した検査

- 速い物（`FAST` の 18 本）: コミットのたび、全部緑。`i18n-check` は pre-commit が毎回回した（10 言語全部）。
- `tl-check`: 11（D2）・12（C）・13（A、本物の `holdStart`・`navLand`、線の上）・14（B）・15（E）を足し、それぞれ**バグを戻して赤を見た**。最後の取り込みの後も緑。
- `line-check` 12（E2）: `size-adjust` を抜いて赤（描いた字 11.9px 対 16.5px）。`push-check`（141）: reply の鍵を id だけに戻して赤（五つ）。`acct-check`: 全部緑、`pushSw()` の quote の行を消して赤。`tl-check` 15 の帯の幅: 切り替えを帯に戻して赤（422/390）。
- `npm run rls`: 緑、581 回。引用の通知のトリガーを返信だけに戻して赤（「引用が鳴る」）。`react_seen` の `mute_hides`、`post_make` の引用の断り、`quoted` の `block_hides` を抜いて赤を見た（catalogue のブロックの歩きも赤になった）。
- `act-check`（42/42 ルート、289/289 名前）・`load-check`・`draft-check`・`post-check`: 一回ずつ緑。`act-check` は `hold` を読むのを外して赤を見た。
- **`press` は回し切っていない**（15 分の上限の途中でリーダーの指示で止めた）。長押しの本物の指の検査は `press` だけなので、取り込み後の全ゲートで見てほしい。

## CODE / DEVICE / OWNER

- **CODE CONFIRMED**: A・B（通知タブと iPhone の通知の組み立てまで）・C・D2・E1・E2・E3。
- **DEVICE CONFIRMED**: 無し。実機は未。特に長押し（iOS の本物の指）、`popAsk` の二択、`toLocaleString` の日本語の年月日、**`size-adjust`**（iOS 17 から。16 以前は描いた字も 15px になる）、引用の通知が本当に届くか（本番に schema.sql と push-send が要る）。
- **OWNER CONFIRMED**: 無し。写真（下）を見てもらう。

## 写真（`shots/r94/`、コミット済み）

- 押した人の一覧: `3-after-likers.png`、誰もいない時 `3-after-boosters-none.png`、前（フォロー一覧の同じ行）`0-before-follows.png`
- 引用: 選ぶポップ `4-after-choose.png`、投稿画面 `4-after-composer-quote.png`、タイムライン（引用と「表示できません」）`4-after-timeline-quote.png`、前 `0-before-feed.png` `0-before-composer-reply.png`
- 解除の確認: `2-after-unboost-ask.png` `2-after-unfollow-ask.png`、前 `0-before-profile-iri.png`
- 詳しい時刻: 今の形 `5-after-thread-time-under-body.png`、前 `1-before-thread-full-time.png`（`1-after-thread-full-time.png` は置き換えられた最初の形）
- 意味: 投稿画面 前 `6-before-composer.png`、オン `6-after-composer-meaning-on.png`、オフ `6-after-composer-meaning-off.png`、タイムライン（意味なし・あり）`6-after-feed-meaning-on-off.png`
- 本文の大きさ（E2、自作文字と普通の文字が混ざった行）: 前 `7-before-feed.png` `7-before-thread.png` `7-before-composer.png`、後 `7-after-feed.png` `7-after-thread.png` `7-after-composer.png`
- 通知の設定: 前 `8-before-set-push.png`、後 `8-after-set-push.png`、引用をオフ `8-after-set-push-quote-off.png`

## 止めた物・訊くこと

1. E2 と引用の iPhone の通知は、持ち物を足してもらって実装した（上）。E2 は `size-adjust` を `LinguaType` そのものに付けると `.tfont` の欄（辞書など）の描いた字まで大きくなるので、同じ字を `LinguaLine` という二つ目の規則でも出し、投稿の行だけがそれを着る。行の高さは描いた字に合わせた（`1.7em × --ink-over`）── 普通の文字だけの行は Twitter より行間が広い。詰めるかはオーナーに。
2. **本番**: `schema.sql`（`quote_of`・`react_seen`・`post_seen`・`notices`・`push_on_post`）と `push-send` の配り直しが要る。オーナーの物、触っていない。
3. 決めていない所（作った形）: 引用の数はどこにも出していない（リポストの数に引用は入らない）。ミュートした人の投稿を引用した物の中身は出る。引用の中の写真・声は出さない（名前・時刻・一行・意味だけ）。意味の切り替えはその投稿だけ（覚えない、開くたびにオン）。引用の通知の印はリポストの印（引用の絵は `www/glyph.js` に無い）。「解除しますか？」は「リポストを解除しますか？」「@〇〇 のフォローを解除しますか？」、はいの語は「解除」。
4. **`tl-check` 10b の直し**: 途中、13 が本物の時間を待つ形だった時、10b が空にした `NET_PPL_WAIT.mute` の下で飛んだままの読みが落ちて投げた。13 の方を「時計を取って即座に動かす」形に直し、10b は元のまま。

## リーダーの指示が間違っていた所

- 「引用は schema.sql に列」── その通り。ただ `quote` という表が既にある（語の引用、`quote(post, language, word)`）ので、列は `quote_of` にした。
- 「元の人に通知（push の種類）」と E2 は最初の持ち物に無いファイルが要った ── 足してもらって実装済み。
- `claude/r96-hand` が `www/core.js` と `www/act-map.js` を触っている（`fc809057`）。core.js は `SET_PREFS` の一行だけ、act-map は r94 の名前が五つ（`meFollowPress` `holdLangs` `postHoldLikes` `postHoldBoosts` `pwMnSw`）── 取り込みの時に。
