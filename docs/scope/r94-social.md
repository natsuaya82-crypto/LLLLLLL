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

## 振る舞い

- **A** ハート・リポストの印を長押し（0.5 秒、サーバーにある投稿で数が 0 でない時）→「いいねした人」「リポストした人」の画面。フォロー一覧と同じ行・同じフォローボタン、新しい順、50 で切って下で続き。ブロックの間の人・ミュートした人は出ない。長押しはハートを押さない。
- **B** 誰もリポストしていない投稿の印を押すと「リポスト／引用」（問いの行は無く、二つの答えだけ。外側を押すと何もしない）。引用 → 投稿画面、下に元の投稿が小さく。送ると行に `quote_of`。タイムラインでは本文の下に元の投稿が小さく（左に一本の線、押すと元のスレッド）、元が消えた・非表示・凍結・非公開・ブロックの時は「この投稿は表示できません」。元の人の通知タブに「〇〇 が引用」（リポストの印）。
- **C** リポストの取り消しとフォローの解除（プロフィールのボタン・人の一覧のボタン）は「リポストを解除しますか？」「@〇〇 のフォローを解除しますか？」［解除］［閉じる］。付ける方は訊かない。ブロックがフォローを外す時は訊かない。
- **D** スレッドで開いた投稿: 名前の横は「2時間」のまま、本文の下の右に「2026年9月25日 14:51」（言語ごとの並び、`when.full`）。
- **E** 投稿画面の「意味」を切ると意味の欄が消え、その投稿は意味を持たない。意味の行の字は前より小さい（12px 相当）。

## 保存する物

- サーバー: `post.quote_of uuid`（外部キー無し、索引あり、insert の列だけ）。ビュー `react_seen`、`post_seen` に `quote_of`・`quoted`、`feed_hot`・`feed_fo` に同じ二列、`notices()` に `quote`。**本番の SQL Editor に schema.sql を貼る必要がある**（オーナー／リーダー）。
- 投稿の `body`: 意味を切った投稿は `nm:1`・`mn:''`。下書きの `body`: `qt`・`nm`。端末の写し: `qt`・`qp`（`qp` は上がらない）。消す物・移す物は無い。前からある投稿・下書きはそのまま読める。

## 回した検査

- 速い物（`FAST` の 18 本）: コミットのたび、全部緑。`i18n-check` は pre-commit が毎回回した（10 言語全部）。
- `tl-check`: 11（D2）・12（C）・13（A、本物の `holdStart`・`navLand`、線の上）・14（B）・15（E）を足し、それぞれ**バグを戻して赤を見た**。最後の取り込みの後も緑。
- `npm run rls`: 緑、581 回。`react_seen` の `mute_hides`、`post_make` の引用の断り、`quoted` の `block_hides` を抜いて赤を見た（catalogue のブロックの歩きも赤になった）。
- `act-check`（42/42 ルート、289/289 名前）・`load-check`・`draft-check`・`post-check`: 一回ずつ緑。`act-check` は `hold` を読むのを外して赤を見た。
- **`press` は回し切っていない**（15 分の上限の途中でリーダーの指示で止めた）。長押しの本物の指の検査は `press` だけなので、取り込み後の全ゲートで見てほしい。

## CODE / DEVICE / OWNER

- **CODE CONFIRMED**: A・B（通知タブまで）・C・D2・E1・E3。
- **DEVICE CONFIRMED**: 無し。実機は未。特に長押し（iOS の本物の指）、`popAsk` の二択、`toLocaleString` の日本語の年月日。
- **OWNER CONFIRMED**: 無し。写真（下）を見てもらう。

## 写真（`shots/r94/`、コミット済み）

- 押した人の一覧: `3-after-likers.png`、誰もいない時 `3-after-boosters-none.png`、前（フォロー一覧の同じ行）`0-before-follows.png`
- 引用: 選ぶポップ `4-after-choose.png`、投稿画面 `4-after-composer-quote.png`、タイムライン（引用と「表示できません」）`4-after-timeline-quote.png`、前 `0-before-feed.png` `0-before-composer-reply.png`
- 解除の確認: `2-after-unboost-ask.png` `2-after-unfollow-ask.png`、前 `0-before-profile-iri.png`
- 詳しい時刻: 今の形 `5-after-thread-time-under-body.png`、前 `1-before-thread-full-time.png`（`1-after-thread-full-time.png` は置き換えられた最初の形）
- 意味: 投稿画面 前 `6-before-composer.png`、オン `6-after-composer-meaning-on.png`、オフ `6-after-composer-meaning-off.png`、タイムライン（意味なし・あり、小さくなった意味、自作文字と普通の文字が混ざった行）`6-after-feed-meaning-on-off.png`

## 止めた物・訊くこと

1. **E2（本文の普通の文字だけ Twitter の大きさに、自作文字は今のまま）は持ち物外で止めた。** 行は一つの face（`LinguaType` → `-apple-system`）で、普通の文字だけ小さくする形は `LinguaType` の `@font-face` に `size-adjust`（例: 行を 15px にして自作文字の face を 138%）を付けること ── その face を作るのは `www/glyph.js` の `inkFaceCSS()`・`installTypeFont()`。`-apple-system` は `@font-face` の `local()` で名指せず、`font-size-adjust` は自作文字の face も x-height で変えてしまう。`www/glyph.js` を持たせてもらえれば `.pline` と二箇所で済む（`line-check` を通す）。**今は意味だけ 12px になり、本文 20.8px との比が 0.58 に見える** ── E2 と一緒に出すかはリーダーの判断。
2. **引用の iPhone のプッシュ通知は足していない。** 種類を足すと設定の通知の部屋の行（`www/push.js` の `PUSH_KINDS`・`pushSw()`）と `SET_PREFS`（`www/core.js`）が要り、`push-check` がその三つが揃うことを数える。持ち物外。足す時は `push.mjs` の `PUSH` に `{kind:'quote', table:'post', key:{id, quote_of}, parent:'quote_of'}` と、`reply` の鍵にも `reply_to` を足して見分けること（今は `post` の行は全部 `reply` と読まれる）、`schema.sql` の `push_on_reply` と同じトリガーを `quote_of is not null` で。
3. 決めていない所（作った形）: 引用の数はどこにも出していない（リポストの数に引用は入らない）。ミュートした人の投稿を引用した物の中身は出る。引用の中の写真・声は出さない（名前・時刻・一行・意味だけ）。意味の切り替えはその投稿だけ（覚えない、開くたびにオン）。引用の通知の印はリポストの印（引用の絵は `www/glyph.js` に無い）。「解除しますか？」は「リポストを解除しますか？」「@〇〇 のフォローを解除しますか？」、はいの語は「解除」。
4. **`tl-check` 10b の直し**: 途中、13 が本物の時間を待つ形だった時、10b が空にした `NET_PPL_WAIT.mute` の下で飛んだままの読みが落ちて投げた。13 の方を「時計を取って即座に動かす」形に直し、10b は元のまま。

## リーダーの指示が間違っていた所

- 「引用は schema.sql に列」── その通り。ただ `quote` という表が既にある（語の引用、`quote(post, language, word)`）ので、列は `quote_of` にした。
- 「元の人に通知（notices と push の種類を一つ足す ── push-send の種類の表も）」── push の方は `www/push.js`・`www/core.js` が要り、持ち物に無かった（上の 2）。
- E2 の「CSS で」── 上の 1。
