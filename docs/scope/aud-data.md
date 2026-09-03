# 監査B ── データの三冊とコードの照合

- 日付: 2026-09-03
- 枝: `claude/aud-data`
- 範囲: `docs/DATA_MODEL.md`（496行）`docs/DATA_SAFETY.md`（212行）
  `docs/ARCHITECTURE.md`（182行）── **一文ずつコードに当てました**
- 基準にした木: `master` の `bc1a3945`（「平キーの道を消す」まで取り込み済み）
- **置き換えられた規則は、印を付けずに消しました。**「これは前の姿です」と
  並べて残したところはありません。「なぜ変わったか」を残したのは、
  それが今日の判断に要る三箇所だけです ── アカウント削除がアカウントごと
  である理由、`bkSound()` が「有る」ではなく形を見る理由、
  削除の一覧を検査へ移した理由

## 先に、確かめていないもの

**「全部確かめました」とは書けません。**下は当てていない範囲です。

- `docs/DATA_SAFETY.md` の測定値（「三十八の文字が 12.1 KB、百語 13.2 KB、
  五千語 685 KB」）── **測り直していません。**Linux の走者では測れません
- `keep()` `kept()` `keepVoice()` `dropVoice()` `dropSome()` の**実機での挙動**
  ── Swift は読みましたが、`docs/TESTING.md` § device のとおり押せません
- `npm run rls` は**回していません**（PostgreSQL を立てるので速い側ではない）。
  `CASES` の件数はファイルを数えました
- `docs/DATA_MODEL.md` の `ink` の節、`postInkOK()` の三つの壊れ方は
  `postInkOK()` の中身を読んだだけで、`card-check` を回していません
- 全ゲートは回していません（リーダーの指示）。回したのは
  `store` `es5` の二本と、直したあとの `store` `backup` `dead` `sides` です

## オーナーに訊くこと

**六つあります。全部「保存されるものが消えるかどうか」です。**どれも数えれば
分かる話ではなく、決めないと分からない話なので、こちらでは決めていません。

Q1. アカウントを削除しても、そのアカウントの**通知の写し**が端末に残ります
      A: 全部消える ── 「アカウント削除で残るものねえって言ってんだろ何回
         言わせんだよ全部消えんだよ。」 OWNER 2026-08-27
      B: 書いていない削除はしない ── `docs/DATA_SAFETY.md` § 規則4 と
         DELETE REVIEW（「自動の削除・掃除は、仕様に書いてあるとき以外禁止」）
      コードは今 B の形: `lsWipeAcct()`（`www/core.js`）が前方一致で見るのは
      `lingua.me.` `lingua.posts.` `lingua.drafts.` の三つだけで、
      `lingua.notices.<uid>`（`www/sns.js` `notKey()`）は残ります
      訊きたいこと: **アカウント削除で `lingua.notices.<uid>` も消しますか。**
      （サーバー側は毎回計算し直すものなので、消しても失われる記録はありません）

Q2. 同じく、そのアカウントの**預けてある設定**が端末に残ります
      A: 全部消える ── 同上（2026-08-27）
      B: 書いていない削除はしない ── 同上
      コードは今 B の形: `setParkKey()`（`www/core.js`）が
      `lingua.set.<uid>` に段・その前の段・まだ送れていない段・保存した検索・
      それを一度上げたか・通知をどこまで読んだかの六つを預けます。
      `lsWipeAcct()` はこの鍵を見ていません
      訊きたいこと: **アカウント削除で `lingua.set.<uid>` も消しますか。**

Q3. 「この言語を削除」でも「アカウントを削除」でも、その言語の
    **バックアップの世代番号**（`lingua.<id>.bkn`）が端末に残ります
      A: 全部なくなる ── 「この言語を削除で言語の制作のものは全部なくなる
         ってずっと言ってんだろ」 OWNER 2026-09-03
      B: 書いていない削除はしない ── `docs/DATA_SAFETY.md`
      コードは今 B の形: どちらの削除も `SLICES` を歩き（`www/core.js:74`、
      `www/settings.js:480`）、`bkn` は `SLICES` に入っていません。
      残るのは数字一つで、人が作ったものではありません
      訊きたいこと: **二つの削除で `lingua.<id>.bkn` も消しますか。**

Q4. **検索の履歴**は、同じ端末にサインインした人みんなで共有されています
      A: アカウントごと ── 「端末ごとにやることなんてねえよ」
         「アカウントごとってずっと言ってるよな？」 OWNER 2026-09-03
      B: いまは共有のまま、穴として記録 ── `docs/BACKLOG.md`「共有された
         設定の鍵」、`docs/CHANGELOG.md` 2026-09-03
      コードは今 B の形: `SET_ACCT`（`www/core.js:1182`）は
      `plan` `planWas` `planPend` `saved` `savedUp` `notAt` の六つで、
      `recent` は入っていません。**設定のうち共有なのはこれだけです**
      訊きたいこと: **`recent` を `SET_ACCT` に足しますか。**
      （足すと、別のアカウントが入ったとき履歴は `lingua.set.<uid>` へ
      預けられて画面から消えます。消えるのではなく預かるので、
      その人が入り直せば戻ります）

Q5. `setDefaults()` が全ての新規インストールで書く欄のうち、
    **`read` と `voice` は `www/` の誰も読みません**
      A: 新しい形になったからといって消さない ──
         `docs/DATA_SAFETY.md` § 規則4
      B: 昔のものは道ごと消す ── 「もうまっさら昔のいらない。今の状態の話
         今の情報のコードに書き換えて」 OWNER 2026-09-03（平キーを消した決定）
      コードは今 A の形: `setDefaults()`（`www/core.js`）が
      `read:'both'` と `voice:''` を返し、読み手はどこにもありません
      （`order` と `script` は移行の読み手が居るので、この問いの外です）
      訊きたいこと: **`read` と `voice` を `setDefaults()` から外しますか。**
      （外しても端末にある値は消えません。新しく書かれなくなるだけです）

Q6. `talk`（会話）の slice は、**画面も global も無いまま**、
    バックアップにもサーバーにも運ばれ続けています
      A: 画面が無くなったのは、その人の会話を消す理由にならない ──
         `docs/DATA_MODEL.md`（この監査より前から）
      B: 昔のものは道ごと消す ── Q5 の B と同じ（2026-09-03）
      コードは今 A の形: `'talk'` は `www/` に一箇所しかありません ──
      `SLICES`（`www/core.js:130`）です。読む所も書く所もありません
      訊きたいこと: **`talk` は `SLICES` に残しますか。**
      （残す＝今のまま。外す＝端末に在る会話がバックアップにも同期にも
      乗らなくなります。**鍵そのものを消すかどうかは別の問いです**）

## 見つけたもの

### 消す方向の変更 ── 手を付けていません

**7・8・9・14・28 は「データを消す」側の食い違いです。見つけただけで、
どちらが正しそうかも決めていません。**上の Q1〜Q6 がその問いです ──
7→Q1、8→Q2、9→Q3、14→Q4、28 のうち `read`/`voice`→Q5。
`docs/DATA_SAFETY.md` § DELETE REVIEW と、2026-09-03「食い違いは
オーナーに訊く」がその理由です。

---

1. `docs/DATA_MODEL.md:25` 「Twelve slices, filed under `lingua.<id>.<slice>`」
   実際: `www/core.js:130` の `SLICES` は 12 個 ──
   `words lines lang script letters notes phases talk snd kb wld gram2`。
   同ファイル 57〜69 行の表も同じ 12 個で、名前も一致します
   判定: **合っている**（数えました。行の記述からではなく `core.js:130` から）
   やったこと: 直さない

2. `docs/DATA_MODEL.md:27` 「`wipeAll` walks it（SLICES を歩く）」
   実際: `wipeAll()`（`www/settings.js:517`）は `SLICES` を歩きません。
   `wipeAllGo()` → `wipeHere(uid)` → `lsWipeAcct(uid)`（`www/core.js:68`）で、
   歩くのは **そのアカウントの言語の id ごと**です。一つの言語を消す
   `wipeLangsGo()`（`www/settings.js:469`）も歩きます
   判定: **記述が古い**
   やったこと: 直した

3. `docs/DATA_MODEL.md:47` 「It is not built — `netDropMe()` reaches the server
   only, and `wipeAll()` is a separate button」
   実際: **入っています。**`wipeAllGo()`（`www/settings.js:538`）が
   `netDropMe()` を呼び、その両腕から `wipeHere(uid)` を呼び、
   `lsWipeAcct(uid)` と `bkDropFor(ids)` が端末側を取ります。
   同じファイルの 169 行が「Deleting the account takes both sides」と
   逆のことを言っていて、**一冊の中で食い違っていました**
   判定: **記述が古い**
   やったこと: 直した

4. `docs/DATA_MODEL.md:65` 「| `talk` | `TALK` | the conversation …
   see the note on `PLANS` in `www/core.js`」
   実際: **`TALK` という global は `www/` に一つもありません**
   （`grep -n '\bTALK\b' www/*.js` が空）。`www/core.js:708` の `PLANS` は
   段の梯子で、持ち上げられた画面の話ではありません。slice の `talk` 自体は
   `SLICES` にあり（`core.js:130`）、`bkPack()`（`backup.js:125`）が
   文字列のまま写すのは書いてあるとおりです
   判定: **記述が古い**（振る舞いは正しい。名指しが二つとも死んでいる）
   やったこと: 直した

5. `docs/DATA_MODEL.md:142` 「It is removed by `lsWipeAcct()` with everything
   else under `lingua.` when an account goes — no list to add it to」
   `docs/DATA_MODEL.md:169` 「`lsWipeAcct()` removes every key beginning
   `lingua.`, counted rather than listed」
   `docs/DATA_MODEL.md:230` 「`lsWipeAcct()` counts `localStorage` and removes
   everything under `lingua.`」
   実際: **三つとも 2026-09-03 で終わった姿です。**`lsWipeAcct(uid)`
   （`www/core.js:68-107`）が取るのは (a) そのアカウントの印が付いた言語の
   `SLICES`、(b) `lingua.me.<uid>` `lingua.posts.<uid>` `lingua.drafts.<uid>`、
   (c) いま載っている `lingua.me` `lingua.posts` `lingua.drafts`、
   (d) `LS_FLAT` の八つ。**`lingua.` を丸ごとではありません。**
   同じファイルの 482 行だけが正しく「`lingua.me.*` `lingua.posts.*`
   `lingua.drafts.*` を uid で」と書いています
   判定: **記述が古い**
   やったこと: 直した（482 行の言い方に三箇所を揃えた）

6. `docs/DATA_MODEL.md` 全体 ── **`LS_FLAT`（平キー八つ）の行がありません**
   実際: `www/core.js:104-105` が `LS_FLAT` の八つ
   （`lingua.words` `lingua.lines` `lingua.lang` `lingua.script`
   `lingua.letters` `lingua.notes` `lingua.phases` `lingua.talk`）を
   `doomed` に積みます。DATA_MODEL は `langMigrate()` が**写す**ことは
   `docs/DATA_SAFETY.md` § 2 経由で触れていますが、
   **アカウント削除で消えることはどこにも書いていません**
   判定: **記述が古い**（欠け）
   やったこと: 直した（節を足した）

7. `docs/DATA_MODEL.md:142` 「It is removed by `lsWipeAcct()`」（`lingua.notices.<uid>`）
   実際: **取られません。**`www/core.js:80-88` が前方一致で見るのは
   `lingua.me.` `lingua.posts.` `lingua.drafts.` の三つだけで、
   `lingua.notices.` は入っていません。鍵は
   `notKey()`（`www/sns.js:1618`）が `lingua.notices.<uid>` で書きます
   判定: **規則が守られていない**（アカウントを消しても、その人に誰が何を
   したかの写しが端末に残る）
   やったこと: **直さない。**消す方向なので報告のみ。DATA_MODEL の文は
   「取られる」と書いてあったので、**いま取られているものだけを書く形に
   書き換え**、この穴を穴として名指ししました

8. `www/core.js:80-88` ── `lingua.set.<uid>`（`setParkKey()`）も取られません
   実際: `setParkKey()`（`www/core.js:1190`）が `lingua.set.<uid>` に
   `SET_ACCT` の六つ（`plan` `planWas` `planPend` `saved` `savedUp` `notAt`）
   を預けます。`lsWipeAcct()` の前方一致に入っていないので、
   **消したアカウントの段と保存した検索と既読位置が端末に残ります**。
   `docs/CHANGELOG.md` の 2026-09-03「端末のものは無い」は、同じ項で
   この鍵を新設しながら削除の一覧に入れていません
   判定: **規則が守られていない**
   やったこと: **直さない。**消す方向なので報告のみ

9. `docs/DATA_MODEL.md:25` 「Twelve slices, filed under `lingua.<id>.<slice>`」
   実際: `lingua.<id>.` の下には **slice ではない鍵がもう一つ**あります ──
   `lingua.<id>.bkn`（`www/backup.js:118` `bkNoSet()`、`tools/store-check.mjs:85`
   が名指ししている）。`SLICES` に無いので、
   `lsWipeAcct()` の `SLICES` 歩き（`core.js:74`）も
   `wipeLangsGo()` の `SLICES` 歩き（`settings.js:480`）も**素通りします**。
   「この言語を削除で言語の制作のものは全部なくなる」（OWNER 2026-09-03）と
   食い違います
   判定: **規則が守られていない**（残るのは数字一つで、人の作ったものでは
   ありません。だが「全部なくなる」は全部です）
   やったこと: **直さない。**消す方向なので報告のみ。
   DATA_MODEL 側には `bkn` の存在を書き足しました

10. `docs/DATA_MODEL.md:186` 「`core.js` said `{ name, mine }` … It is three
    keys. Corrected 2026-08-25.」
    実際: **五つです。**`name` `mine` `sid` `uid` `mig`。
    `uid` は `netLangRow()`（`www/net.js:1242`）と `langSeenAdd()`
    （`www/core.js:326`）と `bkTake()`（`www/backup.js:298`）が書き、
    `mig` は `langMigrate()`（`www/core.js:247`）が置いて
    `langMigStamp()`（`www/core.js:257`）が外します。
    `core.js:131-155` のコメントは四つまで数えています
    判定: **記述が古い**
    やったこと: 直した

11. `docs/DATA_MODEL.md:189-250` § A language that is only read —
    **this state does not exist**
    実際: **DL は入っています。**この節は丸ごと、無い状態の説明です
    - `langSeenAdd()`（`www/core.js:321-330`）が `mine:false` を書きます。
      「nothing has ever written it false」（194 行）は成り立ちません
    - 「Three places write to `LANGS` — `www/core.js:115` … `www/core.js:140`
      … `www/backup.js:264`」（194-197 行）── 行番号が三つとも違い、
      書き手は七箇所です（`core.js:247` `core.js:287` `core.js:324`
      `core.js:1040` `backup.js:296` `net.js:1111` `net.js:1241`）
    - 「`vLangs()` … The second list is **always** the empty note」（209 行）
      ── `www/home.js:2071-2095` は `dlCap()` で切った本物の一覧を描きます
    - 「**The two numbers themselves are still open**」（244 行）──
      決まっています。`var PLUS_DL=1, PRO_DL=3;`（`www/core.js:962`）、
      `dlCap()` `dlCount()` `dlStop()`（963-988）
    - 取る道は `www/home.js:1279-1320`。章ごとに `localStorage.setItem`
      （1311 行）── 「一つづつ dl」のとおりです
    判定: **記述が古い**（節ごと）
    やったこと: 直した（節を書き換え。「無い」を「在る」に）

12. `docs/DATA_MODEL.md:227` 「**`bkPack()` skips a language that is not
    `mine`.**」
    実際: `bkPack()`（`www/backup.js:124-133`）に `mine` の判定はありません。
    断るのは `bkPush()`（`www/backup.js:157`）の
    `if(!langMine(langId)){ BK.dirty=false; … return; }` です。
    **振る舞いは書いてあるとおり**（DL 言語はファイルに入らない）で、
    名指しした関数が違います
    判定: **記述が古い**
    やったこと: 直した

13. `docs/DATA_MODEL.md:331` 「`{ id, at, lang, lname, ln, who, hd, mine, av,
    mn, ui, dir, ink?, tr?, pics?, pic?, pin?, vo?, ed?, to?, toh? }`」
    実際: `www/post.js:1432-1438` が作る post には
    **`pr` `li` `bo` `re` も載り**、`postSid()`（`www/post.js:1025`）が
    `sid` を、`pwSend()`（`www/post.js` `mine.pv=1`）が `pv` を足します。
    `pv` は **下の表に説明があるのに、上の形に入っていません**
    判定: **記述が古い**
    やったこと: 直した

14. `docs/DATA_MODEL.md:480` 「`SET.recent` rides in `lingua.set`, the one
    settings key shared by whoever signs in — the same place `SET.saved` and
    `SET.plan` sit.」
    実際: `SET.saved` と `SET.plan` は**もう共有ではありません**。
    `var SET_ACCT=['plan','planWas','planPend','saved','savedUp','notAt'];`
    （`www/core.js:1189`）を `setFor(uid)`（1193-1223）が
    `lingua.set.<uid>` へ預けます。**共有なのは `recent` だけ**です
    判定: **記述が古い**（穴そのものは残っている。狭くなった）
    やったこと: 直した（`recent` だけが残っていると書き直した）

15. `docs/DATA_SAFETY.md:143` 「`bkTake()` reads it, and nothing else does.」
    （`bkNo()` のこと）
    実際: `bkSay()`（`www/backup.js:230`）も読みます ──
    `if(BK.how==='kept') return t('bk.no', bkNo());`。読み手は二つです
    判定: **記述が古い**
    やったこと: 直した

16. `docs/DATA_SAFETY.md:118` 「**Deleting a post deletes its voice, and
    nothing else ever does.**」
    実際: `voDropFile()`（`www/rec.js:255`）の呼び手は**三つ**です ──
    `postDelGo`（`www/post.js:3233`）、`draftDropGo`（`www/post.js:497`）、
    `voDrop`（`www/rec.js:197`）。下書きの側は今日
    （2026-09-03、`docs/CHANGELOG.md`）オーナーが決めたものです ──
    「声は投稿上で再生できるよね？下書き消した時にはいらなくない？」
    判定: **記述が古い**
    やったこと: 直した

17. `docs/DATA_SAFETY.md:169` 「Today the app deletes in exactly these places
    … `delWord`, `ltDelete`, `delNote`, `postDel`, `wipeAll`」
    実際: **五つではありません。**`www/act-map.js` に紐づいていて
    `popAsk()` で訊くものだけで **13** です ── `delWord` `ltDelete` `delNote`
    `postDel` `wipeAll` `wipeLangs` `kbDrop` `kbDropLay` `kbSelDel` `ntSelDel`
    `wSelDel` `dfSelDel` `stDelOwn`。訊かずに消すものが別にあります
    （`wldOvDel` `sndDrop` `snsDropRecent` `stDelEx` `wdDelEx` `wdDelMn`
    `pwDropPic` `voDrop` `ltDropChar` `meDropPic`）
    判定: **記述が古い**
    やったこと: 直した。**そして押さえるものを足しました** ──
    `tools/del-check.mjs`。この一覧を書いた側に置き、
    `act-map.js` に消す名前が増えたら赤くなります

18. `docs/DATA_SAFETY.md:209` 「tries … to do all 34 things the file says
    cannot be done」
    実際: `tools/rls-check.mjs` の `CASES` は **272 件**、`SHAPE` が別に
    あります（`tools/rls-check.mjs:141` から `1490` 行の `CASES.map`）。
    ツール自身は `CASES.length` を刷ります（1589 行）
    判定: **記述が古い**
    やったこと: 直した（数を文に埋めず、ツールが刷ると書いた。
    同じ腐り方をもう一度しないため）

19. `docs/ARCHITECTURE.md:66-70` 「**Three rows of that table are the
    device's, and there are no others**: the settings, the session, and the
    backup file … 「そもそも端末に保存するもんはないぞほとんど」 OWNER
    2026-09-01」
    実際: **その区分は 2026-09-03 に消えた規則です。**`CLAUDE.md:74-90` ──
    「**This replaced a list.** Until 2026-09-03 this said 「three things are
    the phone's …」, and that sentence cost the owner their language」、
    `docs/FEATURE_RULES.md:469-494` ──
    「**規則に「端末のものは三つ」と書いてあったことが、その姿を正しく見せて
    いました。**規則を消さないと同じ形が出続けます」
    判定: **規則が守られていない**（消された規則が残っている。
    `master` の `9cc255d0` が今日名指しで禁じたもの）
    やったこと: 直した

20. `tools/store-check.mjs:7` 「Three things are the phone's own and that is
    the whole list: a language's backup file, an exported sheet, and the
    settings.」（同 34・81・155 行にも同じ区分）
    実際: 19 と同じ、消された規則です
    判定: **規則が守られていない**
    やったこと: 直した（ツールの振る舞いは変えていません。文だけ）

21. `docs/ARCHITECTURE.md:84-90` 「What that answers today: `profile`, `post`,
    `follow`, `block`, `report`, `draft`, `saved_search`, `post_seen`,
    `react`, `prompt`, the RPCs — **and `language` and `slice`**」
    実際: そのファイルが書いている grep をそのまま回すと、
    **`recent_search` `plan` `profile_seen` `language_seen` の四つが増えて
    います**。`quote` と `publication` が使われていないのは変わりません
    判定: **記述が古い**
    やったこと: 直した

22. `docs/ARCHITECTURE.md:44-51` 「**DL — the third thing, decided and not
    built.** … Nothing of it exists yet」
    実際: 11 と同じ。入っています
    判定: **記述が古い**
    やったこと: 直した

23. `www/core.js:794-812`（`langCount()` の上のコメント）
    「the three places that write to LANGS … every one of them writes
    `mine:true`, and nothing anywhere writes it false … `vLangs()` draws a
    「読んでいる」 list that is always the empty note」
    実際: 11 と同じ。`langSeenAdd()` が同じファイルの 324 行で
    `mine:false` を書きます
    判定: **記述が古い**
    やったこと: 直した（`www/core.js` はどの枝も持っていません）

24. `www/backup.js:99` 「The slices are SLICES in core.js, so a **tenth** one
    added there is written out the day it is added.」
    実際: 12 です（`www/core.js:130`）
    判定: **記述が古い**
    やったこと: 直した

25. `www/backup.js:113` 「Nothing reads it yet.」（`bkNo()` のこと）
    実際: `bkTake()`（`www/backup.js:270`）と `bkSay()`（230）が読みます
    判定: **記述が古い**
    やったこと: 直した

26. `docs/DATA_SAFETY.md:149-166` § DELETE REVIEW 「Anything that removes data
    … gets this written down **before** the code, in `docs/CHANGELOG.md`」
    実際: 今日 `lsWipeAcct()` に入った **`LS_FLAT` の八つの削除**
    （`www/core.js:88-105`）に、**DELETE REVIEW がありません。**
    `docs/CHANGELOG.md` の 2026-09-03「端末のものは無い。全部アカウントのもの」
    （280-317 行）が `lsWipeAcct()` の取るものを列挙していて、
    平キーは入っていません。同じ項が
    「**他のアカウントの鍵は一つも触りません。**」と書いていますが、
    平キーは誰の印も持っていない鍵です（`core.js:88-99` の
    コメントがそれを理由として書いています）
    判定: **規則が守られていない**
    やったこと: **直せない。**`docs/CHANGELOG.md` は書き換えない約束です。
    リーダーの判断で入ったもので、オーナーには報告済みと聞いています。
    **ただし `bc1a3945`（master、2026-09-03 11:40）でこの削除ごと
    無くなります** ── 「平キーの道を消す」。書く場所は要らなくなります

27. `docs/DATA_MODEL.md:73` 「`BK_SHAPE` in `www/backup.js` carries those
    shapes; `bkSound()` uses it to tell a slice from wreckage.」
    実際: `BK_SHAPE`（`www/backup.js:62-64`）は **11 個**、`SLICES` は 12 個。
    **`gram2` がありません。**`bkSound('gram2', v)` は `want` が
    `undefined` のまま最後の行に落ち、`'[object Array]'` でなければ真 ──
    つまり「object」と**偶然**同じ答えになります。宣言ではなく落ち方です。
    `SLICES` に足された slice が `BK_SHAPE` に無いことを見る検査は
    ありませんでした
    判定: **規則が守られていない**
    やったこと: 直した（`gram2:'object'` を足し、
    `tools/backup-check.mjs` に「`SLICES` の全部が `BK_SHAPE` にある」を
    足した。**先に `gram2` を抜いて赤を見ました**）

28. `tools/store-check.mjs:150-215` § FIELDS
    「a field added to `SET` is a new place to keep something … a field
    written and not named here is red」
    実際: **`setDefaults()` が配る欄は見えていません。**
    FIELDS は `SET.<name> =` の代入だけを数えます（`re` は
    `/SET\.([A-Za-z0-9_]+)\s*(?:=[^=]|\+\+|--)/`、`tools/store-check.mjs:222`）。
    `setDefaults()`（`www/core.js:167-170`）は
    `order` `read` `voice` `script` を返し、この四つは
    **どの保存でも `lingua.set` に書き出されるのに FIELDS に名前がありません**。
    store-check がまさに防ぐと言っている形（「一つの文が中身まで覆っている」）
    の、もう一段内側です
    判定: **規則が守られていない**
    やったこと: 直した（`setDefaults()` の literal を読ませ、
    四つに文を書いた。**先に四つを入れずに赤を見ました**）

29. `docs/DATA_SAFETY.md` § DELETE REVIEW ── 今日入った**声のファイルの
    削除が二つ**、DELETE REVIEW 無しで入っています
    実際: 2026-09-03「声は録った瞬間にファイルになる」（`docs/CHANGELOG.md`）で
    `draftDropGo()`（`www/post.js:497`）と `voDrop()`（`www/rec.js:197`）が
    `voDropFile()` を呼ぶようになりました。オーナーの言葉は引いてあります
    （「声は投稿上で再生できるよね？下書き消した時にはいらなくない？」）が、
    **七項目の DELETE REVIEW の塊がありません。**`postDelGo()` の分は
    `docs/CHANGELOG.md:13599` にちゃんとあります
    判定: **規則が守られていない**（決定は在る。記録が無い）
    やったこと: **直せない。**`docs/CHANGELOG.md` は書き換えない約束です。
    `docs/DATA_SAFETY.md` の側に「一つ目だけ書かれている」と明記しました。
    **オーナーに訊くことではありません** ── 決定はもう出ています。
    書く人が要るだけです

## 書いている間に master が二つ進みました

- `9cc255d0` **古い規則は残さない。食い違いはオーナーに訊く**
  （2026-09-03）── この監査の土台です。置き換えられた規則は消す。
  **食い違いはセッションもリーダーも決めず、オーナーに訊く。**
  だから 7・8・9・26 は「直さない」ではなく「訊いてください」です
- `bc1a3945` **平キーの道を消す**（2026-09-03、実装は `claude/flat`）──
  「今の状態の話平キーなんかいらない」。`langMigrate()` `LS_FLAT`
  `langMigStamp()` と `mig` の印、そして **`lsWipeAcct()` の平キー削除**が
  丸ごと消えます

  **26 番はこれで消えます。**DELETE REVIEW を書くべき削除そのものが
  無くなるので、書く場所は要らなくなります。
  **6 番と 10 番はこれで古くなります** ── `docs/DATA_MODEL.md` に足した
  平キーの段落と `mig` の行は、`claude/flat` が入る同じコミットで
  消してください。そう書いてあります

## 直せなかったもの、他の枝が持っているもの

- **26**（`docs/CHANGELOG.md` の DELETE REVIEW）── 書き換えない約束。
  `bc1a3945` で削除ごと無くなるので、書く場所も要らなくなります
- **7・8・9・14**、と **28 の `read`/`voice`** ── 消す方向。
  上の **Q1〜Q5** に出してあります
- **Q6**（`talk` を `SLICES` に残すか）── 私が見つけた食い違いですが、
  番号付きの一覧には入れていません。「規則どおりで正しい」ものが、
  今日の別の決定と食い違っているという形だからです
- `www/settings.js` `www/sns.js` `www/me.js` `www/keyboard.js` `www/shell.js`
  `www/index.html` `www/act.js` `www/net.js` `www/onboard.js` `www/store.js`
  `supabase/schema.sql` と ios の Swift は**読んだだけ**で、
  一行も触っていません

## 足した検査

| | 何を押さえるか | 赤を見たか |
|---|---|---|
| `tools/del-check.mjs`（新、`npm run del`、gate の速い側） | `act-map.js` の削除に読めるボタン全部に「何を取るか・訊くか・訊かないならなぜか」を答えさせる | **三通り** ── 未記載のボタン、`popAsk` を外した `delNote`、`why` を消した `sndDrop` |
| `tools/backup-check.mjs` に一行 | `SLICES` の全部が `BK_SHAPE` にある | **見た** ── `gram2` を抜いて赤 |
| `tools/store-check.mjs` に一段 | `setDefaults()` が配る欄も FIELDS に名前が要る | **二通り** ── 新しい欄を足して赤、`setDefaults` を隠して赤 |

回した速い九本＋二本は全部緑です（`assets` `es5` `grammar-engine` `dead`
`import` `sides` `face` `box` `store` `del` `backup`）。
**全ゲートは回していません。**
