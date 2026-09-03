# 監査 3 ── 決定ログ 61〜90 件目

- 日付: 2026-09-03
- 担当: `docs/FEATURE_RULES.md` § Owner decision log の **61 件目から 90 件目**
  （`### ` で始まる見出しを、その節の中で上から数えて）
- 読んだ版: **`36e65562`**（`origin/master`）。この文書の行番号はすべてこの版のものです。
- **コードは一行も変えていません。** このファイル一つだけのブランチです。

範囲の入口と出口:

| | 件目 | 行 | 何の決定か |
|---|---|---|---|
| 入口 | 61 | `docs/FEATURE_RULES.md:2594` | 三段の料金と `CAN` の全表 |
| 出口 | 90 | `docs/FEATURE_RULES.md:3426` | 単語シートは作成と編集が同じ画面 |

数え方の注意 ── この節の**外**に `### Five states, and they are not the same`
（124 行）があります。ファイル全体の `### ` を数えると一つずれます。数えるのは
`## Owner decision log`（204 行）から次の `## `（3775 行）までの間だけです。

---

## 一覧

判定は四つです。

- **一致** ── コードが決定どおり
- **不一致（コード）** ── コードを書き換える必要がある
- **不一致（決定が古い）** ── コードは新しい決定どおりで、**決定ログの側に印が無い**
- **押さえるものが無い** ── 一致しているが、明日壊れても何も鳴らない

| # | 決定（短く） | 判定 | 場所 | 何が違うか |
|---|---|---|---|---|
| 61 | 三段の料金と `CAN` の全表 | 一致 | `www/core.js:1236,1294,745,769` | 段の改名（決定 59）を通した上で全項目一致。`plan-check` が持つ。実装状況の行だけ古い（下 A） |
| 62 | 広告は AdMob ネイティブ、自前で描く | 一致 | ── | 「何も作っていない」と自称し、実際に一行も無い |
| 63 | 無料キーボードは凍結、有料は自由 | 一致 | `www/keyboard.js:945,900` | `kbEdit()` が board 0 で `null`。キーは `key.v`＝letter の id 束縛で、名前で縛らない |
| 64 | 38 スロットの名前は全段で不変 | 一致 | `www/letters.js:785,509` | `ltIsBase(l)` で拒否。`base-check` が持つ |
| 65 | `save*` 家族は残す／`gh*`→`geHint*`／`note*`→`nt*` | 一致 | `www/glyph.js:1567`, `www/notes.js:17`, `www/post.js:41` | 三件とも着地済み。`save*` 十件も無傷 |
| 66 | 角丸禁止＋一つの一覧の行は同じ高さ | 一致 | `box-check` / `press` | 検査が両方持つ |
| 67 | 説明の禁止を凍結画面だけ緩める | 一致 | `www/sns.js:686-698` | 見出し・一行・異議申し立て。他画面には無い |
| 68 | 凍結アカウントは TL から外れ、本人のページに残る | 押さえるものが無い | `www/post.js:131,148`, `www/home.js:350` | 一致。ただし `tools/` のどれも `postOut` を名指ししない |
| 69 | 異議申し立ては宛先、フォームにしない | 一致 | `www/sns.js:643` | `mailto:Lingua@tokinets.com` |
| 70 | 全部アカウントのもの。クラウドは全員 | 一致 | `www/core.js:1184`, `www/net.js` | `netLangSync()` は段を訊かない。実装状況「未着手」だけ古い（下 A） |
| 71 | 匿名アカウント（**superseded** と明記あり） | 一致 | `www/net.js:432-446` | 新しい決定どおり `netAnon()` は削除済み |
| 72 | 凍結は SNS だけ止める。三タブを閉じる | **不一致（決定が古い）** | `www/sns.js:683`, `supabase/schema.sql:139` | 両半分とも逆転済み。印が無い（下 B） |
| 73 | 画面の四つの禁止形 | 押さえるものが無い | `www/home.js:265`, `www/index.html:3350` | 生きた違反が一つ（下 G） |
| 74 | 文字とキーボードの DL は無料、辞書は有料 | **不一致（決定が古い）** | `www/core.js:1317,958` | 決定 6（2026-09-02「plusからです」）が置き換え済み。印が無い（下 C） |
| 75 | ブロックは何も見えない | 押さえるものが無い | `www/net.js:1540`, `www/sns.js:935,1386,1730` | 五経路すべて一致。検査は無い |
| 76 | アプリ内に説明を書かない | 一致 | 全画面 | 消した七語は戻っていない。「誰も止めない」と決定自身が書いている |
| 77 | サーバー前提、TL はアカウント必須 | 一致 | `www/sns.js:645,1391,1723,906` | 三タブとも `snsLocked()`。3 番は印付きで superseded 済み |
| 78 | 課金商品四つ、ID と価格 | **不一致（決定が古い）** | `ios/App/App/LinguaStore.swift:66-69`, `www/settings.js:989` | 価格と ID は決定 59 が読み替え済み。実装状況の行だけ事実として古い（下 D） |
| 79 | 写真は四枚、横スライド | **3 番のみ不一致（決定が古い）** | `www/post.js:711`, `www/index.html:2421` | 「＋が写真の横、中央」は移動済み。印が無い（下 E） |
| 80 | 赤マイナス・＋・画像タップで編集 | **＋のみ不一致（決定が古い）** | `www/post.js:834-880`, `www/index.html:2615` | 赤丸マイナスとタップ編集は一致。＋だけ移動（下 E） |
| 81 | 課金が切れたときの全部 | **3 番のみ不一致（決定が古い）** | `www/phases.js:243,250` | 自作ステージは一覧に残らず**隠れる**（下 F） |
| 82 | 言語の向き四つ、読むのは無料 | 一致 | `www/wsys.js:268,279` | 描画は `can('dir')` を訊かない |
| 83 | 画像の上の文字、焼き込み、全段無料 | 一致 | `www/post.js:1699-1712` | `post-check` が焼き込みを持つ |
| 84 | 翻訳の四つの詳細 | **不一致（決定が古い＋コード）** | `www/post.js:1651,1677` | 赤文字も第三層も無い（下 H） |
| 85 | 投稿を三通りに見せる | **不一致（決定が古い＋コード）** | `www/post.js:1677,2947` | 第三層は削除済み。二層になっている（下 H） |
| 86 | Plus に何が入るか | **不一致（決定が古い）** | `www/post.js:1677` | 実装状況の「翻訳は第三層として入っていて無料・無制限」が偽（下 H） |
| 87 | AI は Plus の売り物ではない | 一致 | `www/assist.js:23`, `www/glyph.js:2593` | `CAN.ai` も `SET.aiDate` も無い。moot のまま |
| 88 | クラウドは Plus・保留 | **不一致（決定が古い）** | `www/settings.js:334`, `www/core.js:1294` 付近の注 | クラウドは全員のもので実装済み。決定 70 が置き換え（下 I） |
| 89 | 投稿に画像を載せる | **不一致（決定が古い）** | `www/post.js` 全体 | 実装状況「未着手・無料か有料か未決」が古い（下 A） |
| 90 | 単語シートは作成と編集が同じ画面 | 一致 | `www/wordsheet.js:1366,1374,1309` | 開く＝閲覧、`word.edit` ボタンで編集。`word-check` が持つ |

**不明が一件あります。** 72 の一部です。§ B の末尾に、何が分からなかったかを書きました。

---

## 書き換えの前提 ── 決定ログだけは本文を書き換えない

オーナーの 2026-09-03 の決定は「修正ではなく書き換え」で、これは**コード**の話です
（`docs/FEATURE_RULES.md:221`）。決定ログは別で、この文書自身が三か所でそう書いて
います:

- 決定 59「**The decision entries above are left as they were written**: they are a
  record of what was said on the day, and rewriting them would be rewriting what the
  owner said. This entry is the mapping.」
- 決定 77「The words below are left exactly as they were written — this log is the
  record of what was decided when, and a record that gets edited to agree with today
  is not one.」
- 決定 71 は実際にその形をしている ── 本文はそのまま、頭に **SUPERSEDED** の印。

なので下の提案は二種類に分かれます。

- **コードの書き換え** ── 消して書き直す（§ H-2、§ A-2）
- **決定ログの追記** ── 古い項の本文は触らず、**頭に印を足す**か、**置き換えた側の決定を新しい項として起こす**

置き換えた側の決定が**そもそもログに無い**ものが五件あります。§ J にまとめました。
これがいちばん重い ── 印を付けようにも、指す先が無い。

---

## A. 実装状況の行が事実として古いもの（61 / 70 / 89）

三件とも決定の本文は正しく、末尾の `Implementation status` だけが古いものです。
決定の中身は一致なので一覧では「一致」にしましたが、次のセッションはこの行を読んで
「まだ残っている作業」と判断します。

**61（`docs/FEATURE_RULES.md:2594`）** ── 「Basic は売っていない。価格はどの言語
ファイルにも無い」「`edit` と `badge` は `CAN` に無い」「言語の上限はまだ存在しない」。
三つとも今は違います:

- `www/i18n/en.js:781` に `"plan.price.plus" : "$4.99"`
- `www/core.js:1294` の `CAN` に `edit:'plus'` と `badge:'pro'`
- `www/core.js` に `langCap()` と `PRO_LANGS`

**70（同 2936）** ── 「Implementation status: **not started.**」。今は
`www/net.js` の `netLangSync()` が全スライスを上げ下げし、`www/core.js:1184` の
`SET_ACCT` が段・保存した検索・通知の既読をアカウントごとに分けています。

**89（同 3409）** ── 「not started. Free or Plus is not yet decided; storage
(data URL on the post vs. a file) is not yet decided.」。三つとも決着済みで、
決定 83（全段無料）と決定 79（四枚・データ URL）が答えです。

### A-1. ログの書き換え案

三件とも、`Implementation status` の行だけを**今の一文に差し替え**ます。ここは
オーナーの言葉ではなく、その日のセッションが書いた事実の記述なので、決定 59 の
「書かれたまま残す」は掛かりません。掛かるのは Decision と Reason です。

### A-2. コードの書き換え案（一件だけ）

`www/core.js:1226` の注が、同じファイルの `www/core.js:706` の注と矛盾しています。

```
1226:   The middle rung is DECIDED and is not on sale: the plans screen sells Free
1227:   and Pro, because Plus's price is in no language file yet and no
1228:   subscription for it exists in App Store Connect.
```

`PLANS`（`www/core.js:704,711,717`）は三段とも並べ、価格キーは `www/i18n/en.js:781`
にあり、商品は `docs/apple.md:268` に四つとも書いてあります。706 行の注のほうが
正しい（「Its price is here and its subscription is not in App Store Connect yet」）。

**書き換え** ── 1226〜1228 の三行を**消す**。条件や但し書きを足すのではなく、
古くなった段落ごと落とします。同じことを言う正しい注が 706 行にあるので、
書き足すものはありません。

---

## B. 72 ── 凍結が止めるもの。両半分とも逆になっている

**決定の一文**（`docs/FEATURE_RULES.md:2981`）:

> **The SNS side only.** No posting, replying, reacting, following or reporting,
> **and the three sns tabs close. Making a language goes on working.**
> Implementation status: partly — writes are stopped, **the tabs are not**.

**コードが実際にやっていること** ── 両方とも逆です。

タブ側（`www/sns.js:682-685`）:

```
682:       The three tabs stay open and the making side goes on working
683:       「3タブを閉じる必要もないし。ホームに出ればいいやん」. Every door being
684:       frozen shuts is shut by is_member() in supabase/schema.sql whether or
685:       not anything on screen says so; this is the saying so. */
```

`NET_BANNED` は三か所にしか出てきません（`www/net.js:1780,1820`、`www/sns.js:675,686,906`）。
`vFeed` の中身と、投稿ボタンを消すこと。**タブは閉じません。**

制作側（`supabase/schema.sql:136-145`）:

```
136: -- It used to stop the timeline and not the work. The line over it said
137: -- 「制作は好きにやらせればいいし、sns止められても作りたいやつは作るでしょ」 and
138: -- a frozen account went on writing its own language, because that was nobody
139: -- else's business. **OWNER DECISION 2026-08-26 replaced that**: asked directly
140: -- whether a frozen account may still edit its language, the answer was that it
141: -- may not.
```

つまり決定 72 の二つの半分は、片方が 2026-08-26 に、もう片方がどこかの時点で
逆転しています。**そしてどちらの新しいオーナー発言も決定ログにありません。**
確かめ方: `grep -n "タブ" docs/FEATURE_RULES.md` は 626・679・759・768・1994 行しか
返さず、どれもこの話ではありません。

危ないのは実装状況の行です。「the tabs are not」は**まだ残っている作業**として
読めます。次のセッションはタブを閉じにいきます ── オーナーが要らないと言った作業を。

### B-1. 書き換え案

1. 決定 72 の頭に、決定 71 と同じ形の印を置く:
   **SUPERSEDED（一部）** ── タブは閉じない（`www/sns.js:683` のオーナー発言）、
   制作側は止まる（2026-08-26）。本文は触らない。
2. **置き換えた側の決定を二件、新しい項として起こす**（§ J）。
3. 実装状況の行は事実の記述なので差し替えてよい。「writes are stopped, the tabs
   are not」を消して、今の姿を書く。

### B-2. 判定できなかったこと（**不明**）

2026-08-26 の「凍結アカウントは自分の言語を編集してはいけない」の**原文がどこにも
ありません**。`supabase/schema.sql:139` の要約だけです。そのため、次が読めません:

- いま端末上では、凍結中でも言語の編集が通ります。止まるのはサーバーへ上がる分だけ
  です（`supabase/schema.sql:146-151` が「nothing here reaches localStorage」と自分で書いて
  います）。
- これが**決定どおり**なのか、**RLS で届かなかった結果の妥協**なのかが、
  書かれたものからは判定できません。

前者なら一致、後者ならアプリ側に不足があります。**推測で埋めません。**
オーナーに訊くべき一文は「凍結中、端末の中だけの編集も止めますか？」です。

---

## C. 74 ── DL は無料ではなく Plus

**決定の一文**（`docs/FEATURE_RULES.md:3023`、2 番）:

> **Downloading a KEYBOARD or an ALPHABET is free.** Downloading a DICTIONARY is
> **Plus**. 「freeは文字とキーボードのみ」

**コードが実際にやっていること** ── 無料は一つも落とせません。

```
www/core.js:1317:  dl:      'plus',
www/core.js:958-961: function dlCap(){ if(has('pro')) return PRO_DL; return has('plus')? PLUS_DL : 0; }
```

`PLUS_DL=1, PRO_DL=3`（`www/core.js:957`）。無料は 0 です。

**置き換えた決定はログにあります** ── 決定 6、`docs/FEATURE_RULES.md:378`
「ダウンロードは Plus から。上限は make と別で、Plus 1・Pro 3」、
本文に「plusからです」（384 行）。`www/core.js:948` の注もそれを引用しています。

**コードは正しい。** 74 の側に印が無いだけです。4 番「DL したキーボードは自分の棚とは
別に三つ」も、今は言語ごとの `dlCap()` に置き換わっています。

### C-1. 書き換え案

決定 74 の頭に **SUPERSEDED（2・4 番）→ 決定 6（`docs/FEATURE_RULES.md:378`）**
の印を置く。本文は触らない。1・3・5・6 番は生きているので、印に「1・3・5・6 は
そのまま」と書き添える。

---

## D. 78 ── 実装状況の行が事実として古い

価格と ID の食い違い（決定は `plus.*` が $9.99、コードと `docs/apple.md:268` は
$4.99）は**問題ではありません**。決定 59（`docs/FEATURE_RULES.md:2453`）が明示的に
読み替え表を与え、「上の決定は書かれたまま残す、この項が対応表だ」と書いています。
`Basic → Plus`、`Plus → Pro`、ID は `com.tokinets.lingua.plus.*` と `...pro.*`。
`ios/App/App/LinguaStore.swift:66-69` はその表どおりです。

**残るのは実装状況の一行だけです**（`docs/FEATURE_RULES.md:3102` の末尾）:

> **the products are the owner's to create in App Store Connect. There is no
> StoreKit code in the app, and it is not to be written yet.** ... The plans
> screen stays a switch anybody can press.

今は違います:

- `ios/App/App/LinguaStore.swift` が存在し、StoreKit 2 で四商品を扱う
- `www/settings.js:989` が `var PLAN_BUY=true;`
- `www/settings.js:991` が `if(PLAN_BUY && id!=='free' && storeOn() && storeBuy(...)) return;`

置き換えたのは「課金もタップしたら勝手になるけど？」OWNER 2026-08-31 で、これは
`www/settings.js:970` のコメントにしかありません（§ J）。

なお「段の画面は誰でも押せるスイッチ」は**ブラウザでは今も真**です ──
`storeOn()` が false になるので手で切り替わり、検査もスクリーンショットもそれで
歩けます。実機だけが違います。

### D-1. 書き換え案

決定 78 の実装状況の行を、今の三つの事実に差し替える（StoreKit はある、
`PLAN_BUY` は true、ブラウザでは手動のまま）。Decision と Reason は触らない。
併せて § J の「2026-08-31」を新しい項として起こす。

---

## E. 79 の 3 番と 80 の ＋ ── 写真を足すボタンの位置

**決定の一文**（79、`docs/FEATURE_RULES.md:3178`、3 番）:

> On the composer the **＋ sits beside them, centred**, and goes when there are four.

**決定の一文**（80、同 3199）:

> a **＋ beside it** adds one

**コードが実際にやっていること** ── ＋は無く、カメラとライブラリの二つが
キーボードの上の帯にあります（`www/post.js:851-875`）:

```
www/post.js:857: 「📷 ライブラリ マイクボタンにして」
www/post.js:862: (ps.length<POST_PICS ? '<label class="pwab" ...>'+ICON_CAM+ ...
```

「四枚で消える」（`ps.length<POST_PICS`、`POST_PICS=4` は `www/post.js:711`）だけは
そのままです。位置だけが変わりました。

**置き換えた決定はログにあります** ── `docs/FEATURE_RULES.md:3565`
「投稿の時にphotoボタンやめて。📷 ライブラリ マイクボタンにして」。私の範囲より
下（新しい側）の項です。

80 の残り二つは一致です。赤丸のマイナスは右上角にあり（`www/index.html:2615-2619`、
`--bad` の丸に白い ICON_MINUS、44×44）、画像を押すと編集が開きます
（`www/post.js:841` の `DO('pwMarkOpen', [i])`）。

79 の 1・2・4 番も一致です（四枚・横スクロールは `www/index.html:2421-2423` と
`www/index.html:2598-2600`、焼き込みは `post-check`）。

### E-1. 書き換え案

決定 79 と 80 の頭に、**＋の位置だけ SUPERSEDED → `docs/FEATURE_RULES.md:3565`**
の印を置く。両方とも他の番号は生きているので、印にどの番号かを書く。本文は触らない。

---

## F. 81 の 3 番 ── 自作の文法ステージは一覧に残らない

**決定の一文**（`docs/FEATURE_RULES.md:3214`、3 番）:

> A stage of somebody's own **stays on the list** and can no longer be added to
> or deleted.

**コードが実際にやっていること** ── 一覧から消えます。

```
www/phases.js:243:  if(can('gram'))
www/phases.js:244-245:    for(i=0;i<STG.extra.length;i++) out.push({...});
www/phases.js:250: function stHidden(){ return can('gram')? 0 : (STG.extra? STG.extra.length : 0); }
```

無料に落ちると `STG.extra` は `stAll()` の返り値に入らず、`stHidden()` が
その数を足元に出します。コードの注（`www/phases.js:234-238`）が理由を書いています:

> 「課金で追加した機能は無料になったら全部隠れる」OWNER 2026-09-01 ── the same
> as the words past a hundred and the letters past the free alphabet: hidden,
> never removed.

**データは無事です。** `STG.extra` は保存にもバックアップにもサーバーにも残り、
払えば戻ります。`docs/DATA_SAFETY.md` の側の問題ではありません。

**この発言はどこにも記録されていません。** `grep -c "全部隠れる"` は
`docs/FEATURE_RULES.md` も `docs/CHANGELOG.md` も **0** です。コードのコメントだけ。

81 の他の四つは一致です。1 番は `www/words.js:116-121` の `wordsSeen()`/`wordsHidden()`
と `backup-check`（`tools/backup-check.mjs:282-289` が、ちょうど 100 で切れること、
`findWord()` は上限の先の語も見つけること、`bkPack()` は全部運ぶことを持つ）。
2 番は `www/wsys.js:268` の `if(!can('dir')) return 'ltr';` ほか。
4 番は `www/core.js:1481` の `if(now==='free') openCapLapse();`。5 番は `stHidden()` と同じ形。

### F-1. 書き換え案

1. 決定 81 の頭に **SUPERSEDED（3 番）→ 2026-09-01** の印。本文は触らない。
2. **2026-09-01 の決定を新しい項として起こす**（§ J）。これは 81 の 3 番だけの話では
   なく、語・文字・ステージに同じく掛かる一般の規則なので、独立した項にする値打ちが
   あります。

**ついでに気づいたこと（4 番）。** `capLapse()` は `now==='free'` のときしか
知らせません。段が三つになったので `pro → plus` も下がり方ですが、何も出ません。
決定 81 は段が二つの日に書かれているので、これは**決定が触れていない場所**であって
不一致ではありません。オーナーの判断が要る一件として置いておきます。

---

## G. 73 ── 四つの禁止形。生きた違反が一つ

**決定の一文**（`docs/FEATURE_RULES.md:2996`、1・2 番）:

> 1. **No endless row of round chips.** ... If there are more than a few, it is a LIST.
> 2. **One screen, one job.** Do not stack the thing being chosen and the thing
>    being changed on one page.

**コードが実際にやっていること** ── 文字に世界の字を借りる画面
（`openPick`、`www/home.js:256-270`）が、両方をいっぺんにやっています。

```
www/home.js:265:    '<div class="pktabs">'+WORLD_SCRIPTS.map(function(w){
www/home.js:266:      return '<button class="pktab'+(w.id===pkScript?' on':'')+'" ...
www/home.js:270:    '<div class="pkchars" id="pk-chars">'+pkCharsHTML()+'</div>');
```

```
www/index.html:3350: .pktabs{display:flex;gap:6px;overflow-x:auto;...}
www/index.html:3352: .pktab{...flex-shrink:0;min-height:44px;padding:6px 10px;border:1px solid var(--line);
www/index.html:3353:        border-radius:8px;background:transparent;...}
```

`WORLD_SCRIPTS` は **15 件**（`www/onboard.js:26` から）。横スクロールする角丸（8px）の
枠付きチップが 15 個並び、その下で実際の字を選ばせます。1 番と 2 番の両方です。

`.pktab | border` と `.pktab | border-radius` は `tools/box-baseline.txt:79-80` に
入っているので `box-check` は黙ります。これは正しい ── 台帳は規則ができた日の姿で、
古い画面を落とすためのものではありません。

**ただし決定 73 自身が、これを見越して書いています:**

> **The screens that still break it have not been swept** — this decision is not
> a licence to go and rewrite them all in one commit; each is its own task.

なので**規則違反ではなく、既知の未掃討**です。私の判断で触るものではありません。

### G-1. 書き換え案（オーナーの判断が要る）

もし掃くなら、`.pktabs` の一行を消して**書記体系を選ぶ画面**を一つ作り、選んだら
字を選ぶ画面へ行く、が決定 73 の 1 番と 2 番の両方に答える形です。チップに条件を
足すのではなく、`pkSwitch()` と `.pktabs` を消して二画面に割る ── 「修正ではなく
書き換え」。ただしこれは `docs/BACKLOG.md` に置くべき一件で、**この監査で
決められることではありません。**

### G-2. 残骸が一つ（3 番）

下から出るシートは**挙動としては死んでいます** ── `.sheet.on` を付けるコードが
どこにも無く、`closeSheet()`（`www/home.js:223`）は「フォームを閉じる＝ページを
離れる」に変わっています。残っているのは:

- `www/index.html:2887-2892` の `.sheet` の CSS
- `www/index.html:3544-3545` の `<div class="sbg" id="sbg">` と `<div class="sheet" id="sheet">`

そして `www/index.html:2871` の注が、自分で「`.sheet` below — banned by
「ページ遷移型にせず下からひょいって出すやつ」」と書いています。**禁止された形の
CSS が、禁止と書かれた注の下に残っている**状態です。

**書き換え案** ── 2887〜2892 と 3544〜3545 を消す。`www/index.html` は今
八十いくつのブランチが触っているファイルなので、**この監査からは触れません。**
`press` の CSS 台帳が拾う類のものとして報告だけします。

---

## H. 84・85・86 ── 第三層は削除済みで、ログは三層のまま

ここが範囲の中でいちばん重い不一致です。**三つの決定が、消えた機能を説明しています。**

**決定の一文**（85、`docs/FEATURE_RULES.md:3336`）:

> A post can be shown as (1) the writer's own drawn letters, (2) what it means in
> a natural language, and (3) **that same thing rendered into the READER's own
> conlang.** "Unlimited translation" on the Plus list means this.

**決定の一文**（84、同 3300、2〜4 番）:

> 2. A word the reader's dictionary has no word for stays in the natural language
>    and is shown **in red**.
> 3. **Layer 3 is Plus. Free gets three a day.**
> 4. The natural language is always on screen. **Layer 3 appears on a button.**

**決定の一文**（86、同 3357 の実装状況）:

> **Translation is built as layer three and is free and unmetered**

**コードが実際にやっていること** ── 第三層はありません。

```
www/post.js:1677: /* Layer three -- a post said again in this reader's own words -- is gone.
www/post.js:1685-1688:  The one thing that could have read those notes is an AI, and this feature
                        was built for one: `CAN.tr` said "unmetered" and the free plan got three a
                        day ... There is no AI. 「AI入れないって言ってるでしょ？」
```

消えたのは、第三層のボタンと読み下しパネル、押した語の吹き出し、`CAN.tr`、
辞書の `tr.*` 五語、`tools/gram-check.mjs`。赤文字は別に 2026-08-28 に消えています
（「やっぱり、タイムラインも投稿も2段で。赤文字消して。」）。

`postTr()`（`www/post.js:1651`）は残っていますが、これは**第二層**の縫い目です ──
投稿を書いた瞬間に端末の AI で自然言語へ訳し、`post.tr` として投稿に載せる。
今は `done(null)` を返すだけの空の縫い目です。

**記録の状態:**

| | 決定ログ | CHANGELOG |
|---|---|---|
| 赤文字を消した（2026-08-28） | **ある**（`docs/FEATURE_RULES.md:1233`） | ── |
| 第三層を消した | **無い** | **ある**（`docs/CHANGELOG.md:10710`「「自分の言語で読む」は無くなった — OWNER DECISION」） |

確かめ方: `grep -n "翻訳いらなくない" docs/FEATURE_RULES.md` は空、
`docs/CHANGELOG.md` は 10729 行を返します。

### H-1. ログの書き換え案

1. 決定 85 の頭に **SUPERSEDED（全体）** の印。三層という枠組みそのものが無くなった
   ので、部分ではありません。
2. 決定 84 の頭に **SUPERSEDED（2・3・4 番）** の印。2 番は
   `docs/FEATURE_RULES.md:1233` を指し、3・4 番は下の新しい項を指す。
   1 番（書いた瞬間に端末の AI で訳して投稿に載せる）は**生きています** ──
   `postTr()` がその縫い目です。印にそう書く。
3. 決定 86 の実装状況の行から「translation」の文を消し、今の一文にする。
4. **第三層を消した決定を新しい項として起こす**（§ J）。CHANGELOG に本文があるので、
   材料は揃っています。

### H-2. コードの書き換え案

`www/post.js:2947-2952` が、同じファイルの 1677 行と矛盾しています。

```
2947:      /* Three layers, and there is no fourth.
2948:
2949:           the writer's own letters      ln + ink
2950:           the language you read in      mn, or tr[yours] if the post has it
2951:           your own language             on a button
2952:
```

「your own language ── on a button」は**無いもの**です。1677 行が「is gone」と
書いている当のものを、900 行下で表として説明しています。CLAUDE.md § One place の
「a comment saying 'this is the one place' is worth nothing on its own」がまさに
これで、一つのファイルが同じ問いに二つ答えています。

**書き換え** ── 2947 行から 2952 行の表を**消して**、二層で書き直す:

```
      /* Two layers, and there is no third.

           the writer's own letters      ln + ink
           the language you read in      mn, or tr[yours] if the post has it

         第三層（読む人の言語へ）は削除済み ── www/post.js:1677 に理由。
```

条件も分岐も足しません。古い表を落として、正しい表を書く。同じ段落の残り
（`postGloss()` のくだり、2953 行以降）は今も正しいので触りません。

---

## I. 88 ── クラウドは Plus ではなく全員のもの

**決定の一文**（`docs/FEATURE_RULES.md:3395`）:

> Cloud storage is a **Plus** feature, **deferred**. ... **The plans screen and
> the settings screen currently present it as available**, which is a promise the
> app cannot keep.

**コードが実際にやっていること** ── クラウドは全段のもので、実装済みで、
段の画面にも設定画面にも行がありません。

```
www/settings.js:334: /* No cloud row. It said "Cloud sync -- On" to anybody on Plus and did
```

`www/core.js` の `CAN` の `data` に付いた注が、はっきり書いています:

> can('data') is asked twice, both in settings.js and both about the CSV.
> The cloud is on EVERY plan ── 「クラウドは全員で」2026-08-22、
> 「基本は全部サーバー管理」2026-08-26 ── and netLangSync() asks nothing about a
> plan before it runs ... **Do not turn this comment back into a gate.**

段の画面の五行（`plan.plus.1`〜`.5`、`plan.pro.1`〜`.5`、`www/i18n/en.js:771-780`）
にもクラウドはありません。

**置き換えた決定はログにあります** ── 決定 70（`docs/FEATURE_RULES.md:2936`）
「**Cloud storage is for everybody**, so it stops being what Plus sells.
「クラウドは全員で」」。**つまり私の範囲の中で、88 が 70 に置き換えられています。**

### I-1. 書き換え案

決定 88 の頭に **SUPERSEDED → 決定 70（`docs/FEATURE_RULES.md:2936`）** の印。
本文は触らない。

---

## J. 置き換えた側の決定が、そもそもログに無いもの（五件）

**これが範囲全体でいちばん重い発見です。** 上の印を付けようにも、指す先がありません。
どれもコードのコメントか CHANGELOG にしか残っておらず、**決定ログには一行もありません。**

| いつ | オーナーの言葉 | いま残っている場所 | どの決定を置き換えたか |
|---|---|---|---|
| 不明 | 「3タブを閉じる必要もないし。ホームに出ればいいやん」 | `www/sns.js:683` | 72（タブを閉じる） |
| 2026-08-26 | （凍結中は言語を編集できない。原文不明） | `supabase/schema.sql:139-141` の要約のみ | 72（制作は動き続ける） |
| 2026-08-31 | 「課金もタップしたら勝手になるけど？」 | `www/settings.js:970` | 78（StoreKit は書かない） |
| 2026-09-01 | 「課金で追加した機能は無料になったら全部隠れる」 | `www/phases.js:234-238` | 81 の 3 番（一覧に残る） |
| 不明 | 「なら自分の言語でどう言うか翻訳いらなくない？元々ai前提やったし」 | `docs/CHANGELOG.md:10729` | 84 の 3・4 番、85 全体、86 の実装状況 |

CLAUDE.md はこの形を名指しで禁じています ──「**a change lands with every sentence
it falsifies, wherever it lives.**」。五件とも、コードは変わり、コードのコメントは
新しくなり、**決定ログだけが古いまま**という同じ形をしています。そしてログは
「読まれる」ために置いてある文書です。

### J-1. 書き換え案

五件を**新しい決定項として起こす**。既存の項の本文は一行も触らない。
それぞれ、日付・Area・Decision（オーナーの言葉をそのまま）・Reason・
Affected features（上の表の「いま残っている場所」）・置き換えた項の番号と行、を書く。

日付が「不明」の二件は、**日付を推測して書かないでください。**
`git log -S` でコミット日は出ますが、それは実装した日であって決めた日ではありません。
オーナーに訊くのが正しい道です。

---

## この監査で確かめたこと・確かめていないこと

**確かめたこと** ── 30 件すべてについて、決定の本文を読み、指しているファイルと
関数を実際に開きました。grep で名前が一致しただけで済ませた項はありません。
行番号はすべて `36e65562` で取り直しています（`www/core.js` と `www/home.js` は
`8dd3a80f` から動いているため）。

**確かめていないこと:**

- 検査は一つも回していません。読むだけの仕事という指示どおりです。
- 75（ブロック）は五経路をコードで追いましたが、実機でも `tools/` でも確かめて
  いません。`tools/*.mjs` のどれも `postBlocked` を名指ししません。
- 68（凍結アカウントの見え方）も同じで、`postOut` を名指しする検査がありません。
- 72 の「凍結中の端末内編集」は **不明**のままです（§ B-2）。

**私が触ったファイル:** この `docs/scope/audit-3.md` 一つだけです。
`www/` も `tools/` も `supabase/` も `docs/FEATURE_RULES.md` も、一行も変えていません。
