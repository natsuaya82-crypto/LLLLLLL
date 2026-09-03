# 監査D ── `docs/STATE.md` / `docs/TESTING.md` / `docs/keyboard.md` / `docs/keyboard-extension.md`

枝 `claude/aud-state`。基準は `origin/master` `562767d9`（2026-09-03）。

**この文書の書き方。**一つずつ、書いてあることをコードに当てました。
確かめていないものは「確かめていない」と書いてあります ── 特に
実機・App Store Connect・Supabase のダッシュボード・GitHub Actions の
実行履歴は、このコンテナから読めません。**ゲートは回していません**
（リーダーの指示）。なので「検査が緑」という判定は一つもありません。

**触ってよいと言われた範囲**: `docs/STATE.md` `docs/TESTING.md`
`docs/keyboard.md` `docs/keyboard-extension.md` と、九つの枝が持っていない
`tools/*.mjs` `package.json`。`CLAUDE.md` は `claude/aud-claude` のものなので
**報告だけ**しています（21〜24番）。

---

## まず ── 数え直した数

`tools/gate.mjs` の `FAST` は **9本**、`SLOW` は **26本**、合わせて **35本**。
（`FAST`: assets es5 grammar-engine dead import sides face box store。
`SLOW`: migrate i18n act conv card word post backup fill round base kb plan
term sheet shape draft gramlang world acct page dl again open find press。）

`tools/*-check.mjs` はディスク上に37本あり、ゲートに入っていないのは二本 ──
`rls-check`（意図的、`npm run rls`）と **`token-check`（意図せず、npm の名前も無い）**。

---

## `docs/STATE.md`

### 一番危ないもの ── 「まだ直っていない」と書いてあって、直っているもの

1. `docs/STATE.md:118` 「**解約が次の起動で取り消される。**…`claude/lapse` が持っています」
   実際: 直っています。`origin/claude/lapse` は `origin/master` の祖先
   （`git merge-base --is-ancestor` が真）。`www/net.js:767-792` の `netPlanUp()` は
   `SET.planPend` を送信の**前**に書き、`netSend()` に乗って 401 を自分で更新し、
   両方のハンドラが答えを聞いています。`www/boot.js:76-79` が順番を直しています。
   判定: **記述が古い**
   やったこと: 直した（この枝のコミット）

2. `docs/STATE.md:119-121` 「**アカウントを変えても端末の段が残る。**`SET.plan` を書く場所は
   五つ、戻す場所はゼロ。`LinguaPlan.swift` に `uid` の字が一つも無い。**担当なし。**」
   実際: 三つとも違います。戻す場所は `www/core.js:1189-1219` の `setFor()` ──
   `SET_ACCT=['plan','planWas','planPend','saved','savedUp','notAt']` を uid ごとに
   park し、書かれていないアカウントには `SET.plan='free'` を入れます。
   `ios/App/App/LinguaPlan.swift` には `uid` が **15 箇所**あります。
   判定: **記述が古い**
   やったこと: 直した

3. `docs/STATE.md:122-124` 「**オフラインで作った言語が、バックアップからの復元と
   旧形式からの移行では印を押されない**（`bkRestore()` と `langMigrate()`）。**担当なし。**」
   実際: 両方とも押します。`www/backup.js:297-298` が `LANGS[d.id].uid=SESS.uid`、
   `langMigrate()` は `mig` の印を通して `www/core.js:255` の `langMigStamp()` が押します。
   同じ節の 40 行上（`docs/STATE.md:97-102`）が既にそう書いていて、**一つの節が
   自分と矛盾していました。**
   判定: **記述が古い**
   やったこと: 直した

4. `docs/STATE.md:105-107` 「**走っているセッション** `claude/review1`、`claude/kbfull`、
   `claude/lapse`。**どれも未取り込み。**」
   実際: **三つとも取り込み済み**（`merge-base --is-ancestor` が三つとも真）。
   未取り込みなのは `claude/door`(+6) `claude/plannow`(+3) `claude/keysel`(+1)
   `claude/me3`(+3) `claude/rc`(+3) の五つ。
   判定: **記述が古い**
   やったこと: 直した（今日の五つに差し替え）

5. `docs/STATE.md:83` 「`origin/master` は `e5a10cc`」／`docs/STATE.md:187`
   「`master` is at `7f3aec4` (2026-09-02)」
   実際: `origin/master` は `562767d9`。**同じファイルが二つの違う sha を名乗っています。**
   判定: **記述が古い**
   やったこと: 直した ── sha を書くのをやめ、§1 が自分で言っている
   「名前も sha も賞味期限がある、数えるのは一行」に揃えました

6. `docs/STATE.md:86-87` 「出ているビルドは **#122**」／`docs/STATE.md:145`
   「ビルド126 に入っています」／`docs/STATE.md:666` 「**The latest is #91**」
   実際: 一つのファイルに三つの数。どれが本当かは **GitHub Actions の実行履歴で、
   このコンテナからは読めません。確かめていません。**
   判定: 記述が古い（少なくとも §6 の #91 は、同じファイルの §0-a と矛盾）
   やったこと: 直した ── §6 の #91 を消し、ビルド番号はワークフローの run number が
   唯一の出所であることだけ残しました。**#122 と #126 は据え置き**（確かめる手が無い）

### `§0` の表 ── 七つのうち五つが直っている

7. `docs/STATE.md:172` 「消す行 **三本あるべきで、二本しか無い**」
   実際: 三本あります。`www/settings.js:255-312` ── サインアウト、
   `wipeLangs`（端末の言語データ）、`wipeAll`（全部）。
   判定: **記述が古い** / やったこと: 直した

8. `docs/STATE.md:173` 「読みの表示 IPA／カタカナ／両方の三択。**部屋ごと消すと決まった**」
   実際: 消えています。`www/settings.js` に `id==='read'` は一つもありません。
   判定: **記述が古い**（決定が実装済み） / やったこと: 直した

9. `docs/STATE.md:174` 「自作文字の用紙 **`LinguaPdf.page()` がページを等倍のまま描いている**」
   実際: 直っています。`ios/App/App/LinguaPdf.swift:92-93` が
   `g.scaleBy(x: k, y: -k)` を掛けてから `page.draw(with:.cropBox, to: g)` を呼びます。
   **ただし 18.3〜73.2px に本当に乗るかは実機の PDF でしか分かりません。確かめていません。**
   判定: **記述が古い** / やったこと: 直した（実機未確認と書き添えて）

10. `docs/STATE.md:175-177` 「キーボード ① 長押しで入る揺れの状態が全キーから `kbTapKey` を
    外す ② 余りが一列＝キー半分のとき空きマスとして描かれるが `kbCellAdd` はキー一つ分を要求する」
    実際: 両方直っています。①は `www/keyboard.js:2877-2897` に直した経緯ごと書いてあり、
    `kbTapKey` は `kbWob` でも外れません（`www/keyboard.js:2167-2171`）。
    ②は `www/keyboard.js:1362` の `kbCellHTML` が `span` を**列**で持ち、
    `kbCellPut()` がその枠の幅ぶんだけ入れます（半キーの枠には半キー）。
    判定: **記述が古い** / やったこと: 直した

11. `docs/STATE.md:178-180` 「文法ページ **誰も動かしていない。**
    `feature/grammar-engine` が master より **364進み・281遅れ**」
    実際: `origin/feature/grammar-engine` は `origin/master` の**祖先**です。取り込み済み。
    判定: **記述が古い** / やったこと: 直した

12. `docs/STATE.md:181` 「絞り込みの⭐️ `snsPickSaved()` が `goTab('explore')` で**検索タブへ飛ぶ**」
    実際: 直っています。`www/sns.js:1326-1331` は `snsFil={q:k,r:null}` を立てて
    `back()` するだけで、`goTab` を呼びません。
    判定: **記述が古い** / やったこと: 直した

### `§3` ── サーバーに何を頼んでいるか

13. `docs/STATE.md:390-394` 「On 2026-09-01 that answers: `profile` 11, `rpc` 10, `follow` 5,
    `draft` 4, `saved_search` 3, `report` 3, `post` 3, `language` 3, `block` 3, `slice` 2,
    `react` 2, `post_seen` 2, `prompt` 1 — and the ten `rpc` are …」
    実際: そのファイルが書いている通りに数えると
    （`grep -o "rest/v1/[a-z_]*" www/net.js | sort | uniq -c | sort -rn`）
    `profile` 13, `rpc` 12, `language` 8, `follow` 4, `draft` 4, `saved_search` 3,
    `report` 3, **`recent_search` 3**, `react` 3, `post_seen` 3, `post` 3, `block` 3,
    `slice` 2, `prompt` 2, **`plan` 2**, **`profile_seen` 1**, **`language_seen` 1`**。
    rpc は12本で、**`email_taken` と `feed_fo` が増えています**。
    判定: **記述が古い** / やったこと: 直した

14. `docs/STATE.md:369-372` 「`netSignedIn()` asks whether there is a session at all and
    `netMember()` asks whether it carries somebody's name」／同 `§3` の順番1
    `docs/STATE.md:414-416` 「`netSignedIn()` is a session, `netMember()` is a session with
    a name, and `obNeed()` asks the second」
    実際: **`netMember()` は削除されています。**`www/net.js:436-446` が消した理由ごと
    書いています ── 匿名アカウントが無いので二つ目の問いは答えようがない。
    `www/` の中に呼び出しは一つもありません（残るのはコメント3箇所だけ）。
    `lsWipeNS()` も同じく削除済み（`tools/backup-check.mjs:551` のコメントだけ）。
    判定: **記述が古い** / やったこと: 直した

15. `docs/STATE.md:371` 「There is no `netAnon()` — the comment where it stood
    (`net.js:268`) says so」
    実際: そのコメントは `www/net.js:424` です。行が動いています。
    判定: **記述が古い** / やったこと: 直した（行番号を落として関数名で指すようにした）

16. `docs/STATE.md:428-433` 「**The plan.** … **Not there yet**: `profile` has no plan
    column, `www/net.js` never sends one, and the value is `SET.plan` on the device,
    set by hand.」／`docs/STATE.md:441-444`（§3 の 7）「a purchase has to reach the
    server and set the plan on `profile` (item 4)」
    実際: 段はサーバーに載っています。`supabase/schema.sql:466` に **`plan` テーブル**があり、
    `www/net.js:773` の `netPlanUp()` が `POST /rest/v1/plan` を投げ、
    `www/net.js:835` の `netPlanSync()` が読み返して高い方を採ります。
    `profile` の列ではなく自分のテーブルになった、というのが決定との差です。
    **レシートの検証は無い**まま（`www/net.js:740-746` が自分でそう書いています）。
    判定: **記述が古い** / やったこと: 直した（載っている場所と、まだ無い半分を書き分けた）

### `§5` と `§1` ── ゲートの本数

17. `docs/STATE.md:188-189` 「The gate is **34 checks** — count `FAST` and `SLOW` in
    `tools/gate.mjs`」／`docs/STATE.md:637` 「`npm test` is **thirty-four** checks」
    実際: **35本**（`FAST` 9 + `SLOW` 26）。`tools/find-check.mjs` が入って増えました。
    判定: **記述が古い** / やったこと: 直した

18. `docs/STATE.md:637-644` 「Twenty-one is how many RULES are written down; **thirty** is
    how many CHECKS run」／「runs the **eight** that need no browser first … then the
    **twenty-five** browser ones」
    実際: 一文の中で 34 と 30 が食い違っています。本当は rules 22（`CLAUDE.md:523`）、
    checks 35、browser 無しが 9、browser が 26。
    判定: **記述が古い** / やったこと: 直した

19. `docs/STATE.md:649-654` 「`dead`, `migrate`, `import`, `sides`, `act`, `conv`, `card`,
    `word`, `post`, `backup`, `fill`, `round`, `face`, `base` and `press` —
    **fifteen of the eighteen** — run only where somebody runs them」
    実際: CI（`.github/workflows/i18n.yml`）が回すのは assets / es5 / i18n の三本で、
    それは合っています。残りは **32本**で、名前の一覧も足りていません。
    判定: **記述が古い** / やったこと: 直した（数え方を書き、名前の一覧はやめた ──
    一覧は必ず古くなるので）

### `§7` ── 「まだ実装されていない」と書いてあって、実装されているもの

20. `docs/STATE.md:768-773` 「**Not implemented**: `CAN.kb` is still `'pro'`, so Plus has
    zero today, `KB_MAX` is still a per-language 3, `edit` and `badge` are still
    outside `CAN`, and the language ceiling does not exist at all.」
    実際: **四つとも実装されています。**
    `www/core.js:1317` `kb:'plus'`、`www/core.js:1331` `edit:'plus'`、
    `www/core.js:1337` `badge:'pro'`。`KB_MAX` は消えて
    `www/core.js:773-777` の `kbCap()`（free 1 / plus 4 / pro Infinity、言語をまたぐ
    プール）に、言語の上限は `www/core.js:789-792` の `langCap()`（free 1 / plus 1 / pro 3）に
    なっています。
    判定: **記述が古い** / やったこと: 直した

21. `docs/STATE.md:512-513`（§7 の 通報の行）「The owner has asked for it to come off the
    settings list. **That leaves `mod.js` with no door**, so a DELETE REVIEW is owed」
    実際: 行は消えていて（`www/settings.js:163` に「設定の通報ボタン消せ」の経緯）、
    `www/mod.js` には扉があります ── `vAdmin()` の見出しを七回押す道と
    `www/mod.js:314` の `adminRow('admin.reports', …, 'goMod')`。
    判定: **記述が古い** / やったこと: 直した

### 直っていないと書いてあって、本当に直っていないもの（据え置き）

22. `docs/STATE.md:490-493` 「`netDay()` asks `order=on_day.desc&limit=1` and
    **never asks for today**」
    実際: そのままです。`www/net.js:2582-2586`。
    判定: **合っている** / やったこと: 直さない（記述が正しい）

23. `docs/STATE.md:125-127` 「**端末はレシート無しで自分の行に `pro` を書ける。**…決めごと」
    実際: そのままです。`www/net.js:740-746` が自分でそう書いています。
    判定: **合っている** / やったこと: 直さない

24. `docs/STATE.md:128-160`（オーナーの側に残っているもの 1〜6）
    実際: **Supabase のダッシュボード・App Store Connect・DNS・審査用アカウントは、
    このリポジトリから見えません。確かめていません。**一つも触っていません。
    判定: 確かめていない / やったこと: 直さない（そのまま残した）

25. `docs/STATE.md:1120-1130` 「§7 の 3. Run `npm test` … `screens walked: 366`,
    `screens the mirror rendered: 275`, `buttons pressed: 8683`. All three measured
    2026-08-22.」
    実際: **確かめていません。**ゲートを回さない指示なので、この三つの数は動いたかどうか
    分かりません。2026-08-22 から今日まで枝が何十本も入っているので、動いている可能性は
    高いですが、推測は書きません。
    判定: 確かめていない / やったこと: 直さない（「2026-08-22 に測った数で、
    それ以降は誰も測っていない」と日付を残したまま）

---

## `docs/TESTING.md`

26. `docs/TESTING.md:6` 「`npm test`   # **thirty-three** checks」／`:58`
    「CI runs three of the **thirty-three**」
    実際: 35本。
    判定: **記述が古い** / やったこと: 直した

27. `docs/TESTING.md:12-15` 「The **eight** that need no browser go first …
    The **eighteen** that each start a headless Chromium」
    実際: 9本と26本。
    判定: **記述が古い** / やったこと: 直した

28. `docs/TESTING.md:28` 「the fast **five** and the by-name check」／`:33`
    「plus the **five** fast ones」／`:37-38` 「The other **fifteen** have nothing to
    say about it」
    実際: 速いのは9本、他は34本。**「fast five」は `tools/pre-commit` の
    中の五本**（dead / import / sides / face / box）の名前で、ゲートの `FAST` とは
    別のものです ── 二つが同じ言葉を使っていたのが混乱の元です。
    判定: **記述が古い** / やったこと: 直した（ゲートの九本と pre-commit の五本を
    別の言葉で呼ぶようにした）

29. `docs/TESTING.md:57` 「`tools/pre-commit` runs the ones that need no browser plus i18n」
    実際: `tools/pre-commit` が回すのは assets / es5 / dead / import / sides / face / box の
    **七本**＋ i18n。`FAST` の九本のうち **`grammar-engine-check` と `store-check` は
    回していません。**
    判定: **記述が古い** / やったこと: 直した

30. `docs/TESTING.md:61-84` 検査の表
    実際: 二つの問題があります。
    (a) **四行が重複しています** ── `word`(74/80) `post`(75/81) `fill`(77/82)
    `round`(78/83) が、それぞれ違う説明で二度書かれています。
    (b) **17本が表にありません** ── grammar-engine, box, store, kb, plan, term,
    sheet, shape, draft, gramlang, world, acct, page, dl, again, open, find。
    判定: **記述が古い**（重複は事故） / やったこと: 直した（重複を潰し、17本を足した）

31. `docs/TESTING.md:72` 「`conv` | the **seven** claims made about the conversion table」
    実際: `tools/conv-check.mjs:463` が `all nine claims hold` と出力します。九つ。
    判定: **記述が古い** / やったこと: 直した

32. `docs/TESTING.md:54` 「**Sixteen minutes** multiplied by three sessions」
    実際: 同じファイルの `:17` と `tools/gate.mjs:9` は「about ten minutes」。
    **どちらも実測していません**（ゲートを回していない）。数が二つあるのが問題です。
    判定: **記述が古い**（少なくとも自分と矛盾） / やったこと: 直した（十分に揃えた。
    どちらの数もこのコンテナでは測っていないと書き添えた）

33. `docs/TESTING.md:258-262` 「screens walked: 366 / screens the mirror rendered: 275 /
    buttons pressed: 8683。All three measured 2026-08-22.」
    実際: **確かめていません**（25番と同じ）。
    判定: 確かめていない / やったこと: 直さない

34. `docs/TESTING.md:299-322` 「Device required」の一覧
    実際: 一覧そのものは今も正しい ── Documents への書き込み、バックアップの世代、
    WKWebView、キーボード拡張、購入、TestFlight、ファイルの共有、再起動後の復元、
    通知、ネットワーク、クラウド同期。**このコンテナに Swift はありません**
    （`ios/App/**/*.swift` はコンパイルできない）ので、`backup-check` が
    ネイティブ呼び出しの手前までしか持たないという記述も合っています。
    ただし**足りないものが二つ**あります: **フォントのシステム登録**
    （`registerFont`、`ios/App/App/LinguaShare.swift`）と、**ウィジェット**
    （`ios/App/LinguaWidget/` の10ファイル）。どちらも実機でしか見られません。
    判定: 合っている（が不足） / やったこと: 直した（二つ足した）

35. `docs/TESTING.md:218` 「**NO ROUNDED BOX** | `box` (rule 18)」
    実際: 合っています。`CLAUDE.md:1163` が `### 18. NO ROUNDED BOX`。
    判定: **合っている** / やったこと: 直さない

---

## `docs/keyboard.md` ── 動かなくなった手順

36. `docs/keyboard.md:24` 「開くと、**そのキーボードが表計算のシートとして出ます**」
    実際: **開くと出るのはキーボードの一覧です。**`www/keyboard.js:2385-2390` ──
    `here().a` が空なら `kbListHTML()`（一覧）を描き、キーボードを押して初めて
    その盤のページに入ります（`www/keyboard.js:2396`）。
    `www/keyboard.js:595-610` が、章を一覧にした経緯を書いています。
    判定: **記述が古い**（手順の入口が違う） / やったこと: 直した

37. `docs/keyboard.md:53` 「下に「端末に適用」（**今入っているものを見ているときは、
    そう書いてある行**）」
    実際: 今入っているものを見ているときは、**何も出ません。**
    `www/keyboard.js:2530-2535`「今これが端末に入ってますとかいらねえって言ってんだろ」で
    その行は消えています。
    判定: **記述が古い** / やったこと: 直した

38. `docs/keyboard.md:54` 「**一番下に「最初から組み直す」（赤）**」
    実際: 画面の下にはありません。**バー右の ⋯ の中**です ──
    `www/keyboard.js:3355-3369` の `kbMore()` が「パターンを変える」「このキーボードを消す」
    「最初から組み直す」を持ちます。`www/keyboard.js:3347-3354`
    「文字だけで縦に4つ並んでるのも嫌」がその理由です。
    判定: **記述が古い** / やったこと: 直した

39. `docs/keyboard.md:55` 「**バーの右の `？`** → iPhone への入れ方、フルアクセス、
    文字が渡ったかどうか」
    実際: 三つとも違います。
    (a) 盤のページのバー右は **⋯**（`www/keyboard.js:2424-2430` の `kbMoreQ()`）。
    (b) 一覧のバー右は **「選択」**（`www/keyboard.js:2374-2382`）── 複数選んで消すため。
    「？の位置をキーボード 選択 にしたい」OWNER 2026-09-01。
    (c) `？` が残っているのは**無料プランの画面だけ**（`www/keyboard.js:2346`）。
    (d) `？` が開くもの（`www/keyboard.js:3310-3336` の `HELP.kb`）は **iOS への入れ方の
    四手順とフルアクセス**で、**「文字が渡ったかどうか」の行はありません** ──
    `kbState` / `shareState` に当たる関数は `www/` に一つもありません。
    判定: **記述が古い** / やったこと: 直した

40. `docs/keyboard.md:154-156` 「**空いているマスを押すと、そこにキーが1つ入ります。**」
    実際: **押すと選ばれるだけです。**`www/keyboard.js:1394-1416` の `kbCellAdd(ri,at,span)` が
    `KBH={k:'f',…}` を立て、キーを入れるのは**盤の上のボタン**
    （引数なしの `kbCellAdd()` → `kbCellPut()`、`www/keyboard.js:3130-3133`）。
    「全部のます触ったら選択で」OWNER 2026-08-28 で、押して入る例外が無くなりました。
    判定: **記述が古い**（この手順のとおりに押しても何も入らない） / やったこと: 直した

41. `docs/keyboard.md:166-172` 盤の上のボタンの表（選んでいる数が 1 / 2 / 3つ以上）
    実際: 三行は合っています（`www/keyboard.js:3134-3143`）が、**四つ目の状態が
    抜けています** ── 空きマスを選んでいるとき（`cell`）は
    ↺ ↻ ／ **＋（キーを入れる）** ／ 🗑（消灯）。
    判定: **記述が古い**（不足） / やったこと: 直した

42. `docs/keyboard.md:383-385` 「**編集する面を選ぶのは画面の一番上の「1 2 3」です。**」
    実際: **一番下です。**`www/keyboard.js:2431-2441`
    「The pages of THIS keyboard, at the FOOT of the sheet」「＋が上にあるけどプラスは下に」。
    同じ文書の `:52` と `:320` は正しく「盤の下」と書いていて、**この一行だけが逆**でした。
    判定: **記述が古い** / やったこと: 直した

43. `docs/keyboard.md` 全体 ── 書かれていないもの
    実際: 一覧の画面にある三つが文書に一つも出てきません ──
    (a) 「選択」して**複数のキーボードをまとめて消す**（`kbSelOn`/`kbSelDel`）、
    (b) キーボードを足す丸い `＋`（`www/keyboard.js:2352-2355` の `.fab`）、
    (c) 「**キーに文字を表示**」の切り替え（`www/keyboard.js:3341-3346` の `kbSysHTML()`、
    無料プランにもある）。
    判定: **記述が古い**（不足） / やったこと: 直した

44. `docs/keyboard.md:4` 「Plus の機能です（無料は QWERTY 固定で、この画面に入口が
    出ません）」
    実際: 前半は合っています（`www/core.js:1317` `kb:'plus'`）。
    後半は違います ── **無料でもこの画面は開きます。**`www/keyboard.js:2345-2358` が
    無料用の面を描き、丸い `＋` を押すとプランの画面が出ます
    （「アップグレードボタンそこじゃなくて、キーボードを足そうとするとポップ
    出るようにしてよ」OWNER 2026-08-28）。
    判定: **記述が古い** / やったこと: 直した

45. `docs/keyboard.md:288-298` 大きさの上限（半分、5行、320×568、44/54/61pt）
    実際: 合っています。`www/keyboard.js:1177` `KB_MOST=0.5, KB_ROWW=0.1385, KB_BARS=8+44`、
    `:1232-1236` `KB_REF_W=320, KB_REF_H=568` と `kbRowsMax()`。
    判定: **合っている** / やったこと: 直さない

46. `docs/keyboard.md:141` 「しきい値は **18px**」
    実際: 合っています。`docs/keyboard-extension.md:381-383` も同じ 18 を言っていて、
    `www/keyboard.js` の `kbUp()` と揃えると書いてあります。
    **ただし実機のタッチでしか出ないので、効いているかは確かめていません。**
    判定: **合っている**（実機未確認） / やったこと: 直さない

---

## `docs/keyboard-extension.md`

47. **`Capacitor.nativePromise` の話が、この文書に一行もありません。**
    `docs/STATE.md:333-337` は「The call is `Capacitor.nativePromise(…)` and **not**
    `Capacitor.Plugins.*`; **`docs/keyboard-extension.md` says why**, and it cost four
    builds to learn」と書いていますが、`docs/keyboard-extension.md` を
    `nativePromise` `registerPlugin` `Capacitor.Plugins` `toNative` で引くと **0件**です。
    書いてあるのは `www/share.js:536-556` のコメントだけ ──
    bundler が無いので `@capacitor/core` が読み込まれず、`window.Capacitor` には
    ネイティブブリッジが注ぐ `toNative` / `nativePromise` / `nativeCallback` /
    `isPluginAvailable` しか無い、`isPluginAvailable` は `cap.Plugins` を読むので
    どのプラグインにも false を返す、という話です。
    判定: **規則が守られていない**（STATE.md が名指しした文書に、その内容が無い）
    やったこと: 直した（`docs/keyboard-extension.md` § 9 に節を足し、
    `docs/STATE.md` の指し先はそのままで正しくなるようにした）

48. `docs/keyboard-extension.md:162-167` 「`Compose.swift` と `CandidateBar.swift` …
    **まだ一度もコンパイルされていません。** … #41 以降ビルドが一度も回っていないので」
    ／`:296-303` ／`:357-358` ／`:392` ／`:690-692` ── **同じ主張が五箇所**
    実際: 二つのファイルは `ios/App/App.xcodeproj/project.pbxproj` の
    `PBXSourcesBuildPhase` に入っています（`Compose.swift in Sources`、
    `CandidateBar.swift in Sources`）。`docs/STATE.md:87` は今のビルドを #122 と
    言っていて、#41 から 80本以上離れています。
    **ビルドが実際に回ったかは GitHub Actions の履歴で、このコンテナから読めません。
    確かめていません。**確かめられるのは「Sources に入っている」ところまでです。
    判定: **記述が古い**（少なくとも「#41 以降ビルドが一度も回っていない」は
    §0-a と矛盾） / やったこと: 直した（「Sources に入っている／実行履歴は
    ここから読めない」と書き分けた。#41 の当時の話は残した）

49. `docs/keyboard-extension.md:743` 「## 14. 変換（ピンイン式）— 設計
    **まだ作っていません。**これは決めたことの記録です。」
    実際: **両側とも書かれています。**Swift 側は `ios/App/LinguaKeyboard/Compose.swift` と
    `CandidateBar.swift`。JSON 側は `www/share.js:218`（`ink`）と
    `www/share.js:296`（`{how:wsys(), max:max, map:map}`）。
    同じ文書の §3 と §6 が「書いてある」と言っていて、**§14 だけが「まだ」**でした。
    判定: **記述が古い** / やったこと: 直した

50. `docs/keyboard-extension.md:114-121`（§2 Secrets の表）と `:507-521`（§8 CI）
    ── どちらもプロファイル **2枚**
    実際: **3枚**です。`.github/workflows/ios-deploy.yml:75` に
    `WIDGET_PROVISIONING_PROFILE_BASE64` があり、`:149-150` の ExportOptions に
    `com.tokinets.lingua.widget` → `Lingua Widget Distribution` が入っています。
    判定: **記述が古い** / やったこと: 直した

51. `docs/keyboard-extension.md:624-630`（§12）「ビルドは**3回**回っています」の表（#39/#40/#41）
    実際: `docs/STATE.md:87` が #122 と言っています。**実行履歴は確かめていません。**
    判定: **記述が古い** / やったこと: 直した（表は #41 までの記録として残し、
    「その後の本数はワークフローの履歴で、ここからは読めない」と書いた）

52. `docs/keyboard-extension.md:170-172` 「アプリ内キーボード（`www/keyboard.js` の
    `kbField`/`kbUp`/`kbFlick` ほか）は**もう無い**」
    実際: 半分だけ合っています。`kbField` はありません。**`kbUp()` は
    `www/keyboard.js:2860` にあり**、`kbFlicks()`（`:1073`）と `kbFlickLay()`（`:332`）も
    あります。**消えたのは「打つ」側で、`www/keyboard.js` は今も 3832 行の
    エディタです。**名前で「もう無い」と書くと、次の人がその名前を消しに来ます。
    判定: **記述が古い** / やったこと: 直した（「打つ側が消えた、組む側は残っている」と
    書き換え、生きている名前を挙げるのをやめた）

53. `docs/keyboard-extension.md:466-490`（§7 Info.plist）
    実際: 合っています。`ios/App/LinguaKeyboard/Info.plist` の
    `NSExtensionPointIdentifier` `com.apple.keyboard-service`、`PrimaryLanguage` `mul`、
    `RequestsOpenAccess` `true`、`CFBundleDisplayName` `Lingua` が全部一致。
    判定: **合っている** / やったこと: 直さない

54. `docs/keyboard-extension.md:276-281` 「**`next`（🌐）はアプリが足します。**…
    `shareRows()` が最後の行の**左端**に足します」
    実際: 合っています。`www/share.js:187`
    `rows[rows.length-1].unshift({k:'next', w:1})`。
    判定: **合っている** / やったこと: 直さない

55. `docs/keyboard-extension.md:153-156` 「4つと書いていたのは古い数です。
    **Swift ファイルは6つ**あります」
    実際: 合っています。`ios/App/LinguaKeyboard/` の `.swift` は
    CandidateBar / Compose / GlyphView / KeyBoardView / KeyboardViewController / Shared の6つ
    （ほかに `Info.plist` と `.entitlements`）。`docs/STATE.md:325` の「six Swift files」も
    合っています。
    判定: **合っている** / やったこと: 直さない

---

## `tools/` と `package.json`

56. `tools/gate.mjs:5-6` の見出しコメント 「**Thirty-one** checks, and **twenty-three**
    of them start a headless browser」
    実際: 同じファイルの下の `FAST`/`SLOW` が 9 と 26。**自分の五行下と食い違っています。**
    判定: **記述が古い** / やったこと: 直した

57. `tools/gate.mjs:59` のコメント 「**eleven** are running at once now」
    実際: `WIDE = Math.max(1, Math.min(4, cpus))` なので**最大4本**です。
    判定: **記述が古い** / やったこと: 直した

58. **`tools/token-check.mjs` はゲートに入っておらず、`npm run` の名前もありません。**
    `docs/STATE.md:92-94` が「`tools/token-check.mjs`（新）が `XMLHttpRequest` だけを
    偽物にして持ちます」と、持ち主として名指ししています。
    `docs/STATE.md:718-728`（§7）はこう書いています ──
    「**a check enters the gate in the same commit that adds it, or it does not enter
    at all**」「a check nobody can run is a check that is not in the gate」。
    `package.json` の `scripts` に `token` はなく、`tools/gate.mjs` の
    `FAST`/`SLOW` にも `token-check` はありません。
    判定: **規則が守られていない**（STATE.md 自身の規則に、STATE.md が名指しした
    検査が違反している）
    やったこと: **`package.json` に `"token": "node tools/token-check.mjs"` を足した**
    だけ。**ゲートには入れていません** ── 入れると本数が 36 になり、
    `CLAUDE.md`（`claude/aud-claude` のもの）と食い違います。
    **リーダーへ: この一本をゲートに入れるかどうかは、CLAUDE.md の本数と
    同じコミットで決めてください。**

59. `.github/workflows/i18n.yml:1` 「Three of the **twenty-six** checks」／`:13`
    「nothing reaches master without all **26** of tools/gate.mjs having been run」
    実際: 35本。
    判定: **記述が古い**
    やったこと: **直せない** ── `.github/workflows/` は私に渡された範囲の外です。
    **リーダーへ: 持ち主を決めてください。**

---

## `CLAUDE.md` ── 直さずに報告（`claude/aud-claude` のもの）

60. `CLAUDE.md:17` 「these **thirty-four** checks」 → 35本
61. `CLAUDE.md:24` 「CI runs three of these **twenty-eight** checks」 → 35本
62. `CLAUDE.md:434` 「the other **twenty-five** four at a time」 → 26本
63. `CLAUDE.md:447` 「the **twenty-two** that each start a headless」 → 26本
64. `CLAUDE.md:473` 「by the session, the sub-leader and the leader it is **fifteen**」
    → ゲートの所要時間の話。このコンテナでは測っていないので**確かめていません**
65. `CLAUDE.md:525` 「**The gate is thirty-four checks**」 → 35本
66. `CLAUDE.md:1526` / `:1551` 「twenty-nine checks green」 → 当時の記録なら正しい可能性。
    **確かめていません**（日付が書かれていないので、今の本数を指しているかが読めない）
67. `CLAUDE.md:1834` 「`screens walked: 366`」 → 25番・33番と同じ。**確かめていません**

`CLAUDE.md:523` の「**The twenty-two rules the gate enforces**」と
`### 22.` まで番号が並んでいるところは合っています（ただし `### 22.` が
`### 21.` の**上**にあり、順番が入れ替わっています ── `CLAUDE.md:1479` と `:1520`）。

---

## 追記 ── 監査の途中で master が動きました

**この報告を書いているあいだに `claude/plannow` `claude/keysel` `claude/me3`
が入りました。**朝は五つ未取り込みで、報告を書き終える頃には二つ
（`claude/door` `claude/rc`）でした。取り込んでから数え直した結果:

- ゲートは **35 本のまま**（`FAST` 9 + `SLOW` 26）
- `rest/v1` の内訳は変わらず（13番の表のまま）
- `CAN.kb` は `'plus'` のまま、`netMember()` は消えたまま

**一つだけ、直したばかりの記述がもう一度古くなりました:**

68. `docs/keyboard.md:118-123`（§2「押す」）「押すと**その言語のアルファベット
    一覧**が開くので、入れたい文字を選びます」
    実際: `claude/keysel`（`2a5097f3`、私が読んだ数時間後に master に入った）で
    **選んで確定**になりました。触った瞬間には書き込まれません ──
    紫になって右上に確定が出る、同じものをもう一度触ると解除、確定を押さずに
    戻れば何も書かれていない、画面を開くたびに選択は空
    （`www/keyboard.js` の `kbLtPick` / `kbLtPutBtn()` / `kbLtPut()`）。
    「ここに右上に選択したら適用ボタンが確定ボタン欲しい」OWNER 2026-09-03。
    判定: **記述が古い** / やったこと: 直した

**これが CLAUDE.md の言っている通りのことです。**古い規則は変だと思われて
疑われる。古い事実の記述はただ信じられる。**手順書は、書いた日から古くなり
はじめます。**だから `docs/keyboard.md` の直した箇所には、どのコードの
どの関数がその手順の持ち主かを書いてあります ── 次に読む人が、文を信じずに
関数を見に行けるように。

---

## 確かめていないもの ── まとめ

**このコンテナから読めないので、一行も判定していません。**

```
  実機でしか分からないもの
    キーボード拡張が実際に U+E000 以降を挿すか、LinguaType で描かれるか
    フルアクセス無しで App Group が読めるか（RequestsOpenAccess を落とせるか）
    自作文字の用紙が実機の PDF で 18.3〜73.2px に乗るか（9番）
    フリックの 18px しきい値（46番）
    購入・復元・更新（StoreKit）、フォントのシステム登録、ウィジェット
    Documents への書き込みとバックアップの世代

  ダッシュボードでしか分からないもの
    Supabase ── schema.sql が流れているか、メールの SMTP と DNS、
                staff の SQL 一行、Spend Cap、Sessions の二つの値
    App Store Connect ── 四つのサブスクリプション、審査用のデモアカウント
    Apple developer ── ウィジェットのプロビジョニングプロファイル
    Google Cloud ── iOS クライアント
    GitHub ── Secrets、そして **Actions の実行履歴（ビルド番号）**

  ゲートを回していないので分からないもの
    screens walked / mirror rendered / buttons pressed の三つの数（25番・33番）
    ゲート全体の所要時間（32番）
    35本が今この master で緑かどうか
```
