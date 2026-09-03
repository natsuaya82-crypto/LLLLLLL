# 監査 2 ── オーナー決定 #31〜60 と、コードが実際にやっていること

- 日付: 2026-09-03
- 担当: `docs/FEATURE_RULES.md` § Owner decision log の **31 件目から 60 件目**
  （`### ` で始まる見出しを `## Owner decision log` から数える。ログは全 117 件）
- 読んだ時点の master: `36e65562`（この文書の行番号は全部そこのもの）
- **コードは一行も変えていない。**この文書だけの枝（`claude/audit2`）。

なぜこの監査があるか ── 「ルールで決めたのを記しただけでコード上は鳴ってないが
多すぎる」OWNER 2026-09-03。

判定は三つ。**一致**＝コードが決定どおり。**不一致**＝違う。**押さえるものが無い**
＝一致しているが明日壊れても何も言わない。自信が無いものは **不明** と書き、
推測で埋めていない。

---

## 一覧

| # | 行 | 決定（短く） | 判定 | 場所 | 何が違うか |
|---|---|---|---|---|---|
| 31 | 1294 | 話題は X と同じ。いいね1・RP3・返信5、48時間、青パッチが上がりやすい | 一致 | `supabase/schema.sql:1427,1464,1482,1487,1501` | 実装済み。「未着手」は古い記載。古いコメント一件（§ 付録） |
| 32 | 1330 | 入れ替えは4時間ごと。時間はお題のページに合わせる | **不一致** | `supabase/schema.sql:1408` | 刻みは4時間で正しい。時間帯が UTC で、お題側は太平洋時間 |
| 33 | 1354 | フォローの通知も、いいねと同じくまとめる | 一致 | `supabase/schema.sql:1275` | `notices()` の `ev` にフォローが入り、`g` がまとめる |
| 34 | 1371 | ビルドはオーナーが言うまで押さない | 押さえるものが無い | — | 手順の決定。コードに現れない |
| 35 | 1394 | 確認してから訊く | 押さえるものが無い | — | 手順の決定。コードに現れない |
| 36 | 1431 | 描く → 歩く → 名前 → 扉。扉に逃げ道は無い | 一致 | `www/onboard.js:145,1706`、`www/shell.js:409` | 順番も `netLangSync()` も `appIs()` も決定どおり |
| 37 | 1474 | 規約とプライバシーは設定の中だけ、一箇所。特商法は出さない | **不一致（記載側）** | `www/settings.js:313,868`、`www/onboard.js:1272` | 一箇所→二箇所に変わり、アカウント室からは消えた。この項に superseded の印が無い |
| 38 | 1502 | 運営ページのパスワードはそのままにする | 一致 | `www/mod.js:168`、`supabase/schema.sql:646` | 変えない、という決定。変わっていない |
| 39 | 1522 | 売上とアナリティクスは RevenueCat。アプリの中では見ない | 一致 | `www/mod.js:288`、`supabase/functions/` | 五ページも `netStore()` も `functions/appstore/` も無い |
| 40 | 1551 | 売上をアプリの中で見る ── **superseded** | 一致 | — | 正しく置き換わっている。コードに一行も無い |
| 41 | 1580 | （空のテンプレート） | 決定ではない | — | 見出しだけの雛形 |
| 42 | 1597 | 匿名アカウントは無い。`has_account()` と `is_member()` は一本に | **不一致（半分）** | `www/net.js:139,146,432` | 匿名は消えた。二本立ては残っている |
| 43 | 1636 | 決定が規則を置き換えたら規則を直す | 押さえるものが無い | — | 書き方の規則 |
| 44 | 1672 | 設定の「消す」は三つ。言語を削除だけ未実装 | 一致 | `www/core.js:105` | 今も一言語を消す道は無い。決定の自己申告どおり |
| 45 | 1726 | アカウント削除は全部消える／同期は常に | 一致 | `www/settings.js:495,516,522` | 2026-09-03 が「アカウントごと」に狭め、コードは新しい方に従う |
| 46 | 1797 | 基本は全部サーバー。言語はアカウント無いと作れない（6 は未実装） | 一致 | `www/core.js:368` | 今も `net.js` より前で無条件に作られる。決定の自己申告どおり |
| 47 | 1897 | DL は Plus から。入らない・編集不可・四つ別解放 | 一致 | `www/core.js:319,958`、`www/home.js:883,1310` | 実装済み。「0行入っていない」は古い記載。古いコメント一件（§ 付録） |
| 48 | 2026 | 月と曜日は世界の名前で。曜日は日曜から | 一致 | `www/cal.js:67`、`www/i18n/en.js:1070-1088` | January…December / Sunday…Saturday。「未着手」は古い記載 |
| 49 | 2055 | その日の一文。Gemini・米時間・十言語・意味は消せない | 一致 | `supabase/functions/daily-prompt/index.ts:34`、`www/post.js:1346` | 四つとも入っている |
| 50 | 2091 | 無料で使えないものは隠すのではなく見せる | 一致 | `www/post.js:2365`、`www/home.js:2044` | 全プランで描き、拒むのは押した時 |
| 51 | 2125 | シートは PDF だけ受け取る | 一致 | `www/sheet.js:1334,1347` | `shIsPdf()` が弾き `wr.notpdf` を出す |
| 52 | 2153 | Shipaton 2026。RevenueCat SDK で 9/30 までに出す | **不一致** | `ios/App/Podfile`、`ios/App/App/LinguaStore.swift:34` | RevenueCat がリポジトリのどこにも無い。StoreKit 直のまま |
| 53 | 2183 | プランは押した時に変わる。画面は同じ | 一致 | `www/keyboard.js:576` | `kb.full` は `capStop()` の形になっている |
| 54 | 2231 | 二つ目の言語の扉は一覧の足。上限 Free1／Plus1／Pro3 | 一致 | `www/home.js:2044`、`www/core.js:785` | `langAddRow()` と `langCap()`／`langStop()` が同居 |
| 55 | 2262 | 五つのパターンは全部キーボードの形で出る | 一致 | `www/keyboard.js:182,332,388` | `KB_PERS`、非文字は列、`kbFillRow()` が十に揃える |
| 56 | 2315 | 行数はキーボードの高さから落ちてくる | 一致 | `www/keyboard.js:1177,1234` | 0.55→0.5、七→五。2026-08-27 の新しい方に従っている |
| 57 | 2387 | シートの幅は十列固定。キーは列をまたいで大きくなる | 一致 | `www/keyboard.js:1176,3651` | `KB_COLS=20`（半キー）、`kbSheetW()` は `var(--kbw)` |
| 58 | 2453 | 言語とキーボードの数、`edit` と `badge` | 一致 | `www/core.js:769,785,1326,1332` | 三つとも入った。「未実装」は古い記載 |
| 59 | 2520 | プラン名は Free / Plus / Pro | 一致 | `www/core.js:488,1236`、`LinguaStore.swift:66` | `planMigrate()` と製品 ID |
| 60 | 2564 | キーボードの数、もう一度。1 / 1+3 / 無制限、プール | 一致 | `www/core.js:769`、`www/keyboard.js:58,82` | `kbCount()` が `LANGS` 全部を数える。`KB_MAX` は無い |

不一致 **4 件**（うち一つは記載側、一つは半分）。押さえるものが無い 3 件。
不明 **0 件** ── ただし #52 には、コードからは答えの出ない一点がある（下に書いた）。

---

## 不一致 1 ── #32 入れ替えの時間帯が UTC で、お題のページと合っていない

**決定の一文**（`docs/FEATURE_RULES.md:1330`）

> アメリカ時間の 0 4 8 12 16 20。この刻みは動かない。
> **どの時間帯かは、お題のページ（`netDay()` / `dayPull()`）と同じにする。**

**コードが実際にやっていること** ── `supabase/schema.sql:1408`

```sql
create or replace function feed_slot()
returns timestamptz language sql stable as $$
  select date_trunc('hour', now())
         - make_interval(hours => (extract(hour from now())::int % 4))
$$;
```

`now()` は `timestamptz` なので、`extract(hour from ...)` はサーバーのセッション
時間帯 ── Supabase の既定では UTC ── で読む。つまり刻むのは **UTC の 0 4 8 12 16
20 時**であって、アメリカ時間ではない。

**そしてお題のページは太平洋時間である。**`supabase/functions/daily-prompt/index.ts:34`
が `timeZone: 'America/Los_Angeles'` で `on_day` を決め、`supabase/setup.md:445` の
cron も「`5 7 * * *` は 07:05 UTC で、これは太平洋標準時の…」と書いている。だから
「お題のページと同じにする」を満たすなら太平洋時間になる。**四時間の刻みは合っている
が、時間帯は決定の二つの文の両方と食い違っている。**

`schema.sql:1397-1407` のコメントは、これを自分で認めている ──「二つのオーナーの
文がぶつかり、こちらは後の方に従った」「それは報告に入れてある」。**後の方に従った
つもりで、後の方とも合っていない**のがこの項の中身である。コメントの根拠は端末側の
`netDay()`（`www/net.js:2474`、最新の一行を取るだけで時間帯計算をしない）だが、
**日付の境目を決めているのは端末ではなくサーバーの Edge Function** で、そちらは
太平洋時間を名指ししている。

### どう書き換えるか

条件を足すのではなく、`feed_slot()` の本体を消して書き直す。日付の境目を答えている
のと同じ時間帯で刻む形にする（案。実行して確かめていない）:

```sql
create or replace function feed_slot()
returns timestamptz language sql stable as $$
  select (date_trunc('hour', now() at time zone 'America/Los_Angeles')
          - make_interval(hours =>
              (extract(hour from now() at time zone 'America/Los_Angeles')::int % 4)))
         at time zone 'America/Los_Angeles'
$$;
```

**時間帯の二つ目の写しにはならない。**一つ目はすでにサーバーにあり
（`daily-prompt/index.ts:34`）、これはそれと同じ文字列を使うだけである。CLAUDE.md の
「一つのことは一つの仕組みで」に照らすなら、その文字列そのものを一箇所に置くのが
より正しい形になるが、片方は Deno / 片方は SQL で、共有できる置き場が今は無い。
**そこは決めずに残す。**

同じコミットで、`schema.sql:1397-1407` の「後の方に従った」という段落は**消す** ──
残っていれば読まれ、次の人はそれを理由に UTC のままにする。CLAUDE.md「歴史とかいい
から消せよ」。

**注意:** `supabase/schema.sql` を触ると `npm run rls` が回せる状態になる（15秒、
`npm test` には入っていない）。ここを書き換える人が回すこと。

**確かめていないこと:** Supabase の本番のセッション時間帯が本当に UTC かは、
ダッシュボードを開ける人にしか見えない。UTC 以外だったとしても「太平洋時間ではない」
は変わらないので、判定は動かない。

---

## 不一致 2 ── #37 規約とプライバシーの場所が二度変わり、この項に印が無い

**決定の一文**（`docs/FEATURE_RULES.md:1474`）

> 読める道は**設定 → アカウントの一番下、一箇所だけ**。

**コードが実際にやっていること** ── `docRows()` を呼ぶ場所は二つで、
**アカウント室は入っていない。**

| 場所 | 行 |
|---|---|
| プラン画面 | `www/settings.js:868` `planTerms()` |
| 登録画面（サインアップの面） | `www/onboard.js:1272` |
| アカウント室 | **無い** |

`www/settings.js:313` に、消した本人がその理由を書いている:

> NO DOCUMENTS HERE. They were at the foot of this room 「アカウントの一番下やな」
> and they are on the plans screen now, where Apple asks for them
> （Guideline 3.1.2）── 「設定のアカウントの利用規約とプライバシーポリシー
> 消しといて。課金の方にあるからいらん」OWNER 2026-09-01

登録画面の方は `www/onboard.js:1247` が「続けるとの説明は ok」OWNER 2026-09-02 を
引いている。

**つまりコードは新しい決定に従っていて、正しい。**違っているのは
`docs/FEATURE_RULES.md` の方で、#37 に superseded の行も、置き換えたものを指す行も
無い。特商法を出さない半分はそのまま生きていて、コードもそのとおり（`settings.js:849`
にその一行がある）。

これは CLAUDE.md の「**決定が規則を置き換えたら、その規則を同じコミットで直す**」が
守られなかった一件で、今日オーナーが名指ししている問題そのものである ── 古い文が
残っていれば読まれ、次の人はアカウント室に二本を戻す。

### どう書き換えるか

**コードは触らない。**`docs/FEATURE_RULES.md:1474` の項を書き換える。
「一箇所だけ」の文を**消して**、今そうであることを書く:

- 読める道は**プラン画面と、登録画面の面**の二つ（2026-09-01 と 2026-09-02）
- **アカウント室には無い**（2026-09-01 に消した）
- 特商法を出さないことは変わっていない（2026-08-26）

「これは歴史です」と前置きして残さない。CLAUDE.md「歴史とかいいから消せよ」。
`docs/CHANGELOG.md` はその日そうだったの記録なので触らない。

**リーダーへ:** これは `docs/` の書き換えで、私の枝ではやっていない。誰の仕事に
するか決めてほしい。

---

## 不一致 3 ── #42 匿名は消えたが、「一本になる」の半分が残っている

**決定の一文**（`docs/FEATURE_RULES.md:1597`、四つ目）

> `has_account()`（アカウントがある）と `is_member()`（名前がある）の二本立ては
> **やめる。一本になる。**

**済んでいること** ── `has_account()` は `supabase/schema.sql` に一つも無い。
`netAnon()` も `www/net.js` から消えている。`language` / `slice` を含む書き込み
ポリシーは `is_member()` を通る。**サーバー側は一本になっている。**

**コードが実際にやっていること** ── 端末側は二本のまま。

```
www/net.js:139   function netAnonTok(at){ ...        トークンの is_anonymous を読む
www/net.js:146   function netMember(){ return !!(SESS && SESS.rt && !SESS.anon); }
```

`netSignedIn()` と `netMember()` が別の関数として残り、`SESS.anon` も生きている。
`netMember()` の呼び出しは `www/net.js` だけで 20 箇所以上ある。

`www/net.js:432-455` が理由を書いていて、**筋は通っているし隠してもいない**:

> netAnonTok() below and SESS.anon stay, and netSignedIn() and netMember() stay two
> functions. …They stay because collapsing them is a rename, and it is a rename
> across sns.js, post.js, settings.js and me.js, which this session does not own.
> A rename does not ride along with a feature (CLAUDE.md); it is its own task, and
> it is in the report as one.

**それでも判定は不一致である。**決定の文は「一本になる」であって「後でリネームする」
ではない。今そこにあるのは、`www/net.js:454` 自身の言葉を借りれば
「a true question with nothing left to answer it yes」── 誰も yes と答えられない
問いが、20 箇所で訊かれ続けている状態である。

### どう書き換えるか

条件を足すのではなく、**片方を消す。**

1. `netAnonTok()`（`www/net.js:139`）と `SESS.anon` を消す。トークンの
   `is_anonymous` を読む相手がもう居ない
2. `netMember()`（`www/net.js:146`）を消し、呼び出し 20 箇所以上を `netSignedIn()`
   に書き換える。二つの答えが同じになった以上、名前が二つある理由が無い
3. 残った一本の名前は**決めない** ── リーダーかオーナーの領分。`netSignedIn()` が
   自然だが、`is_member()` と対になる名前を残したい理由があるかもしれない

**これは一つのコミットで、機能に相乗りさせない**（CLAUDE.md「A behaviour change, a
refactor and a rename never share a commit」）。`www/net.js` が言うとおり
`sns.js` `post.js` `settings.js` `me.js` にまたがるので、**リーダーが territory を
出してから**でないと始められない。

**確かめていないこと:** このリネームが `docs/BACKLOG.md` に入っているかは見ていない。
`www/net.js:452` は「it is in the report as one」と書いているが、その報告がどこに
あるかは追っていない。

---

## 不一致 4 ── #52 RevenueCat がリポジトリのどこにも無い

**決定の一文**（`docs/FEATURE_RULES.md:2153`、Affected features）

> `ios/App/App/LinguaStore.swift` **gains RevenueCat in place of talking to
> StoreKit directly.** The four product ids do not move.

そして期日 ── **the first public version is on the App Store before 2026-09-30**、
応募条件は「it must use the RevenueCat SDK for at least one in-app purchase」。

**コードが実際にやっていること**

- `ios/App/Podfile` ── `pod 'Capacitor'` と `pod 'CapacitorCordova'` の二つだけ。
  RevenueCat の pod は無い
- `ios/App/App/LinguaStore.swift:34` ── `import StoreKit`。StoreKit 2 直で、
  ファイル頭のコメントは「no receipt validation of our own」と書いている
- `revenuecat` という語が出るのは `www/mod.js:288,291,299,300` と `docs/` と
  `supabase/setup.md` の**コメントと文書だけ**。Swift にも `package.json` にも無い

製品 ID 四本は動いていない（`LinguaStore.swift:66-69`）ので、決定の後半は守られて
いる。守られていないのは前半である。

### ここはオーナーに訊くところで、私の判断で書き換えるものではない

#39（`docs/FEATURE_RULES.md:1522`、2026-09-02）でオーナーはこう言っている:

> **revenue cut入れたから、**App Storeコネクトキーいらんわ

**「入れた」がどこまでを指すのかが、コードからは分からない。**二通り読める:

- **ダッシュボード側だけ** ── RevenueCat のアカウントを作り、Apple と繋いだ。
  売上を見る先が変わったので App Store Connect の API キーが要らなくなった。
  この読みなら SDK はこれから
- **SDK まで含む** ── その場合、リポジトリに無いのが説明できない

**#39 の実装が「売上の画面を消す」だけで完結していること**は、一つ目の読みを支える。
消えたのは `www/mod.js` の五ページと `netStore()` と `supabase/functions/appstore/`
で、`LinguaStore.swift` は一行も動いていない。

**それでも Shipaton の条件は SDK である。**「一つ以上の課金で RevenueCat SDK を使う
こと」は応募要件で、ダッシュボードで数字を見ているだけでは満たさない ── これは
決定 #52 自身が「read off the rules page rather than remembered」として書いている。

### どう書き換えるか（訊いてからの話）

SDK を入れると決まったなら、`LinguaStore.swift` は**条件を足すのではなく書き換え**に
なる。StoreKit を直に呼ぶ部分 ── 製品の取得、購入、`Transaction.updates` の監視、
finish ── を消して、RevenueCat の `Purchases` に置き換える。二つを並べて置かない:
どちらが課金を決めているか誰にも言えなくなる（CLAUDE.md「そのシンプルの穴」）。

**動かしてはいけないもの**が二つある。**製品 ID 四本**（決定が名指ししている）と、
`tools/plan-check.mjs` が持っている claim ── 決定の言葉で
「will need re-pointing, not rewriting: **money decides what may be DONE and nothing
about what exists** stays true through the swap or the swap is wrong」。

**そして iOS はここからビルドできない。**Linux のセッションなので、`Podfile` を
書き換えても確かめる手段が無い。これは Mac の仕事である。

---

## 押さえるものが無いもの

#34・#35・#43 は手順の決定で、コードに現れない。**それは欠陥ではなく、そういう種類
の決定である。**CLAUDE.md の「a rule that nothing STOPS says so, in its own line」に
従って、そう書いておく。

コードは決定どおりなのに、明日壊れても何も鳴らないもの:

- **#31 の重みと #33 のまとめ方** ── `npm run rls` はポリシーを試すが、
  `feed_hot()` の 1・3・5 も 48 時間も、`notices()` のまとめ方も、値を確かめる
  検査が無い。1・3・5 を 1・2・3 に書き換えても全部緑になる
- **#32 の時間帯** ── 上に書いた不一致が、今まさに誰にも見つからなかった理由
- **#37 の場所** ── `docRows()` がどの画面から呼ばれるかを見ている検査は無い。
  だから二度動いても何も鳴らなかった
- **#49 の意味の錠** ── `pwSetMn()` が `PW.pr` で拒むこと（`www/post.js:1346`）は
  `post-check` の対象外

**検査を足す提案はここでしない。**それは別の仕事で、私の枝ではない。

---

## 付録 ── ついでに見つかった、古い記載が二つ

どちらも**コードの欠陥ではない。**読まれると信じられてしまう文である。CLAUDE.md の
「a stale statement of fact is simply believed」がそのまま当てはまる。

### A. `www/core.js:788-797` ── DL が入る前の文が残っている

```
   `mine` and not the length of LANGS, and the reason is about what is COMING
   rather than what is here. This comment used to say LANGS "also holds every
   language being read from somebody else", and it does not: the three places
   that write to LANGS -- langMigrate() and langMint() above, bkRestore() in
   backup.js -- every one of them writes `mine:true`, and nothing anywhere
   writes it false. There is no language in this app that is not the person's
   own, and there never has been. vLangs() draws a 「読んでいる」 list that is
   always the empty note, for the same reason.
```

**三つとも今は嘘である。**

1. 「the three places that write to LANGS」 ── 同じファイルの `core.js:881` が
   六つ挙げている（`langNew()` `langForAcct()` `langSeenAdd()` `netLangsDown()`
   `bkRestore()` ほか）
2. 「nothing anywhere writes it false」 ── `www/core.js:319` の `langSeenAdd()` が
   `mine:false` を書く
3. 「vLangs() draws a 「読んでいる」 list that is always the empty note」 ──
   `www/home.js:2075` が `!LANGS[id].mine` を `reading` に積み、
   `www/home.js:1310` がその道（DL）から `langSeenAdd()` を呼ぶ

**書き換え:** 段落を消して、`mine` を数える理由だけを書く ── 人が作った言語と
DL した言語は別の天井（`langCap()` と `dlCap()`）で数える、という一文で足りる。
「昔はこうだった」を残さない。

### B. `supabase/schema.sql:1376-1383` ── 決定とも、四行下のコードとも逆

```
-- How much a post's author counts for. ONE for everybody today, ...
-- The number is NOT decided. It has not been asked of the owner, so it is not
-- invented here -- a made-up multiplier is a made-up ranking, and nobody would
-- be able to tell by looking at the app that it had been guessed.
-- The tick the list turns on. 「4時間ごと。...
```

`feed_weight()` の見出しだった段落が、`feed_slot()` のコメントの中に取り残されて
いる（1383 行目と 1384 行目の間に、段落の切れ目が無い）。言っていることは二重に
逆である:

- **決定 #31 の一文**（`docs/FEATURE_RULES.md:1294`）は「**倍率をオーナーに訊かない。**
  X が公開しているものを使う」。この段落は「オーナーに訊いていないので作らない」と
  書いている ── **訊かないと決まっているものを、訊いていないことを理由に保留して
  いる**
- **四行下**（`supabase/schema.sql:1427`）の `feed_paid_weight()` は `4` を返し、
  その上のコメントは X が 2023 年に公開した倍率だと正しく書いている

**書き換え:** この段落を消す。`feed_weight()` の本当の説明は `schema.sql:1440`
以降にあり、そちらは正しい（列がまだ無いこと、`to_jsonb(p) ->> 'paid'` にした理由、
列が来る日の形）。消すだけで、書き足すものは無い。

**#32 を書き換える人へ:** この段落は `feed_slot()` の真上にあるので、そこを直す
コミットで一緒に消すのが自然。ただし**振る舞いの変更とコメントの掃除は別のコミット**
（CLAUDE.md「One commit is one kind of thing」）。

---

## この監査でやっていないこと

- **検査は一つも回していない。**読むだけの仕事として受けた
- **コードを一行も変えていない。**`www/` `tools/` `supabase/` `ios/` は触っていない
- **#1〜30 と #61〜117 は見ていない。**担当外
- 判定を「不明」にしたものは無い。**推測で「一致」と書いたものも無い** ── 決定ごとに
  指しているファイルを開いて読んだ。#51（PDF）は grep だけなら不一致に見えた
  （`shTakeFile()` は PDF でないものを通す）が、`www/sheet.js:1334` に入口の門が
  あって一致だった。名前が合っていても中身が違うことがある、の逆の例として書いておく

---

## 追記 2026-09-03 ── 文書だけのものを直した

**直したもの**（`docs/FEATURE_RULES.md` の担当範囲だけ、コードは一行も触っていない）:
#37 は見出しに superseded を付け、〈一箇所だけ〉という規則の文を消して今の二箇所を
書いた（オーナーの引用は記録なので残した）。#31 #33 #47 #48 #58 は「未着手」
「0行入っていない」「not built」を、入っているものの中身に書き換えた。#48 には
もう一つ古い段落があり（`cal.js` に食い違うコメントが残っている、という記述 ──
実装と一緒に直っていた）、それも書き換えた。

**直さなかったもの:** #32 と #42 はリーダーが持つと言ったので触っていない。#52 は
`claude/rc` のもの。#34 #35 #43 は手順の決定で、直すところが無い。

**リーダーへ、一つだけ:** #42 の Implementation status は master でまだ
「**docs だけ。**コードは `claude/admin` が持つ」のままである。コードの方は入って
いる（`www/net.js:442` が `netMember()` と `netAnonTok()` を消したと書いている）
ので、その項の書き換えが master に届いていない。指示どおり触っていない。
