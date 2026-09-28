# rule-audit 2026-09-27 ── docs（文書と検査）

ブランチ `claude/audit-docs`（integ-0905 から、2026-09-28 に integ-0905 を取り込み済み）。範囲は `docs/scope/audit-docs.md`。
**書き足しながら push している途中の版。**

凡例: 【直した】コミット済み / 【オーナー】決めるのはオーナー（選択肢つき） / 【他へ】www・supabase・ios・android の物 / 【未】見つけたがまだ

読み手の生の所見（証拠の grep 付き、読み手が確かめきれなかった物は UNVERIFIED と書いてある）は
`docs/reports/rule-audit-2026-09-27-docs/` に置いた: `claude.md`（CLAUDE.md 58 件）、`core-docs.md`（規則の文書 100 件）、
`log1.md`（決定ログ 235–1699、31 件）、`log2.md`（1700–3199、33 件）、`tools1b.md`（検査 34 本の途中まで）。
**決定ログ 3200–4699 と、FEATURES/BACKLOG・残りの文書・検査 1a/2/3 は読み手が上限で止まり、まだ読めていない。**

## 数（今の時点）

| | 数 |
|---|---|
| 見つけた（読み手の所見の合計、重複あり） | 約 330 |
| 直した（コミット済み） | 文書 約 170 文、検査 7 本（store・face・plan・docs-check 二つ・sides・dead）と docs の基準線 |
| オーナーの物 | 14 |
| 他の担当へ | 21 |

## A. 検査 ── 直した（全部、バグを戻して赤を見た）

| 検査 | 何が緑のまま通っていたか | 赤を見たバグ | コミット |
|---|---|---|---|
| `store-check` | 書き込みを「ファイル＋式」で見分けていた → 同じ字面 `core.js:k` の新しいキーは既存の行として通る。`localStorage[k]=` は見えない | 新しい関数から `var k='lingua.photo.cache'` で setItem、`localStorage['lingua.zz2']=` | `95531cb8` |
| `face-check` | ① canvas の家族名の `+ fam` を名前で見逃し（`fam='Arial'` が通った） ② マークアップの `style=""` と JS の文字列・`.style.fontFamily` を読まない ③ `decomment` が行をずらし、452 行目を 276 と言った ④ 「none named twice」を確かめていなかった | 7 通り（コミット文に列挙） | `b32452f4` |
| `plan-check` | DATA_SAFETY.md「plan-check が findWord の半分も持つ」が嘘だった（findWord を呼んでいない）。`bytes()` が誰も書かない `lingua.langs` を比べていた | `findWord()` が `wordsSeen()` の中だけを探す | `b8fdcc7e` の前のコミット |
| `docs-baseline` | STATE.md の古い名前 16・ゲートの本数の文 3・無いファイル 2 | 消えた名前を線なしで戻す → 505 行目で赤 | `7d8bc616` |
| `docs-check` | 【差し替え済み】が見出しの頭にある時しか見なかった（3 つ末尾・日付なし） | 直す前の決定ログで 4 見出しが赤 | `1de45fa6` |
| `docs-check` | ``` の図の中を読まなかった（`syMerge()`・`www/sync.js`）。決定ログの途中に開きの無い雛形があり、囲みの数え方が全部ずれていた | 図に `syMerge() (www/sync.js)` を戻す → 二つ赤 | `6a8b3f73` |
| `sides-check` | 禁止の手書き一覧。`LANGS[LMINE].name`・`KB[0].name` が線より下で通った → よそのファイルの大文字のグローバルは許可（`READER_MAY`）以外全部断る | 所見の postWho() → 三つ赤 | `6e246e21` |
| `dead-check` | 「届く」＝名前が二回。自分を呼ぶ・互いを呼ぶ関数が通った → 根から辿る | zzRec・zzPingA/B → 三つ赤 | `965172d8` |

## B. 検査 ── 見つけて、まだ直していない

- `sides-check` 関数を辿る段（ビルダーが呼んだ先が作る側に届くか）は、まだ `MINE`（手書き）だけで辿る。よその大文字のグローバル全部で辿ると `DO()`・`esc()` まで届いてしまい、言語の状態と殻の状態を分ける物が無い。【未・限界】
- `dead-check.mjs:165-173` 検査（tools/）からの言及も「届いた」に数える。`folPut`（me.js:1607）・`gramArgs`（phases.js:415）は検査からしか呼ばれない。【未】／関数の扱いは【他へ core/words】
- `docs-check` 出力の「(baseline N)」は基準線の全行数で、届く文書の数ではない。【未】
- `load-check` 三つの読みが基準線で上限を免れている、`press` は 44pt の例外が五つの class（規則はキーだけ）。【未、claude.md 参照】
- `import-check` CLAUDE.md 7 条「eleven real samples」── 見本は 19、見本自身のコメントが「本物の書き出しではない」。【未】

## C. 文書 ── 直した

| 文書 | 何を | コミット |
|---|---|---|
| `docs/STATE.md` | 消えた名前に線、ゲートの本数の文を消す、`loadChromium()`・`&&` の鎖 | `7d8bc616` |
| `docs/ARCHITECTURE.md` | sync.js・syMerge・netSlice1 は無い、スライスは LSL、保存は Save、食い違いは slice_in、netLangSync は起動で呼ばない、sid は無い、rest/v1 の手書きの一覧 | `038e742c` |
| `docs/DATA_MODEL.md` | お知らせの写しは無い、planWas は無い、下書きはサーバーの行、声は録った時にバケット、lsWipeAcct は名前空間を数える、langWrites、dlCap は null、post.tr、インクの無い投稿は文字、aud-data Q1–Q3 の前提は無い 他 | `62642820` |
| `docs/TESTING.md` | 回すのはサブリーダー（居なければリーダー）、npm test は push の前、page と kb、backup・registerFont・三世代は無い、margin-top は press、測った数を書かない | `7007b14c` |
| `CLAUDE.md` | 17 条 1、22 条の store-check、8 条の sides-check、5 条の dead-check、事実の誤り 10 文、取り込みの文・監査 30 分 | `b32452f4` ほか、`4bb0eaa9`・`a12de5f8` |
| `docs/STATE.md`（二度目） | 嘘 22 文 ── SCRIPT.blk・noads・AdMob・Keychain・Transaction.updates・PUSH_KINDS・badge_of・40c・slice_in・SET.walked・SE2・「master が今のアプリ」 | `8255e343` |
| `docs/DATA_SAFETY.md` | 消えたバックアップの段落、終わった段はポップ、削除は二つ、again-check は食い違いを走らせない | `0a9dc286` |
| `docs/PAID_FEATURES.md` | 19 文 ── キーボードは段で分けない（五か所）、dlCount、隠す、blob:、netSlicePut、pro も買える、歴史の表 | `0f130989` |
| `docs/SESSIONS.md`・`FEATURE_RULES.md`・`LEADER.md` | 取り込み・ゲートはサブリーダー（居なければリーダー）16 文、SESSIONS の訂正の歴史、決定ログの【差し替え済み】4 つと壊れた雛形 | `a12de5f8`・`750799d3`・`f8b3c3fe`・`ac52ce28` |

## D. 文書 ── まだ直していない（場所は付録）

- `docs/STATE.md`（嘘 38・古い規則 9・歴史 4）── 主な物: :35 Android は integ-0905 に取り込み済み／:44–67 1.0.3 の一覧に lasso・r112・r116・r117・r119・星・お題が無い／:62 `SCRIPT.blk` は無い／:125 `can('noads')` は無い／:146 AdMob は r93 で消えた／:135・200 通知のスイッチは六つ／:809・1592 Keychain・Transaction.updates は無い（RevenueCat）／:947 「master が今のアプリ」は違う（integ-0905 が 34 先）／:1022 Swift は七つ、App Store に出ている／:1051 `SET.done` → `SET.walked`／:1128・1163 syMerge ではなく slice_in／:1192 「まだ」の一覧（段・通知・お題・引用・公開）は全部できている／:750 `acct-check 40c` は無い。**STATE.md の 44–912 行はビルドごとの記録で、CLAUDE.md「今のことだけ」に反する** ── 消すか一節にまとめるかはリーダーの物。【未／リーダー】
- ~~`docs/PAID_FEATURES.md` 18 件~~（直した、上の表） ── キーボードは段で分けない（1.0.3）のに「無料は固定 QWERTY」が :73・153・541・559・624 に残る／:24 `netPlanUp` に線／:36–44 LinguaPlan.swift の表（歴史）／:218 「隠さない」と 2026-09-01「隠れる」の食い違い／:306 `dlCount()` は `language_take` の数／:399 写真は `blob:`／:413 `netSlicePut` は無い／:763 「plus 以外は何も買えない」→ pro も買える。【未】
- `CLAUDE.md` 58 件（`claude.md`）── :527「fifteen-minute audit」は 30 分（LEADER.md、OWNER 2026-09-24）／:1209「the server half still says nothing」は違う（保存の失敗はポップ）／:1406「They all say var(--face-ui)」── `font-family:inherit` が 43 残る／:1029 投稿の一行は `LinguaLine`／:2304 Swift は七つ／:2311 `vSet` は九つ／:2434 i18n-check は `['free','pro']`／:640「every browser check owns a distinct port」── 27 本はポートを使わない／ボタン数の歴史の表（2325–2436）は「数をここに写さない」と自分で言いながら数を並べている。【未】
- 決定ログ（`log1.md`・`log2.md`・下の E）── 状態の文が古い物 約 55、差し替えの印が無い物 約 25、差し替え済みで本文が残る物 約 16。【未】

## E. オーナーの物（決めない。選択肢だけ）

1. **LEADER.md:78「セッションに CLAUDE.md・STATE.md を読ませない」** vs CLAUDE.md § Scope「各セッションは CLAUDE.md と STATE.md を読んで始める」。どちらも書かれた決まりで、どちらも言い直されていない。A: LEADER.md に揃える（CLAUDE.md § Scope を「リーダーが渡す数行」に） / B: CLAUDE.md に揃える（LEADER.md の一文を消す）
2. **一件の枠: LEADER.md:26「15 分以内」** vs 同じ文書が引くオーナーの言葉「5分以内」と CLAUDE.md「five minutes each」。A: 5 分 / B: 15 分（起動 3〜4 分込み）
3. **キーボードの行のゴミ箱は確認しない（CLAUDE.md 19 条）** vs 基準 9「削除の前に確認ポップ」（2026-09-24）。A: キーボードは戻すで済ませる例外 / B: キーボードも確認ポップ
4. **`langDrop`（取った言語を一覧から外す）が確認なし** ── 同じ基準 9 に入るか。A: 入る / B: 外すのは削除ではない
5. **押した後に星が回る（2026-09-27）** vs ↓の⭕メーター（2026-09-23）・♡がすぐ光る（2026-09-09）。A: その二つは星の例外 / B: 星に揃える
6. **凍結中の制作（2026-08-26「制作側も止まります」）** vs 同じ項目の「決まっていません」と sns.js:1193 のコメント「制作は続く」。コードは今、制作を止めていない。A: 止める / B: 止めない
7. **キーボードの高さ: 「四段が天井」（2026-08-26 五つの型）** vs `kbRowsMax()` の五段（同じ日の高さの決定）
8. **AI**: 2026-08 の「Plus は一日数回 AI と話せる」「AI の部分は今から作る」 vs 「AI入れないって言ってるでしょ？」（CHANGELOG）。A: AI の決定を差し替え済みにする / B: まだ生きている
9. **2026-09-04 の「バックアップの三世代はそのまま」（1888 行）と「バックアップのファイルを消す」（2049 行）** ── 同じ日で、ログの並びでは前者が新しい。実際には消えている
10. **基準 1「system standard first」**: 3167 行が取り下げたと言い、3338 行の基準の列挙と CLAUDE.md:212 に残る
11. **ミュートした人からの通知が鳴る** ── push-send がミュートを見ない（決定は「ミュートした人の物は届かない」のはず。BACKLOG に無い）
12. **決定ログに無い OWNER の日付 4 つ**（コメントが引いている）: 2026-08-31（別アカウントで前の人のものが出る・Google ボタン・課金がタップで入る）、2026-09-07（全部読み込んでから開く・@ の飛び先・キーボードが増える・文法の各段）、2026-09-10（保存ボタンを一本化・サーバーの文字を増やすな・否定を細かく）、2026-09-16（畳んだ投稿は五行）── 書くのはリーダー。場所は `log4` の読み手の所見（このファイルの E の元、会話の中）: onboard.js:826・net.js:1490・shell.js:194・me.js:232・post.js:3721 ほか
13. **STATE.md のビルドごとの記録（44–912 行）を消すか残すか**（CLAUDE.md「今のことだけ」）── リーダーのファイル
14. **docs/HANDOVER-2026-08-28-2.md・docs/SCOPE-yaa.md はどこからも辿れない**（docs-baseline）── 地図に載せるか消すか

## F. 他の担当へ（www・supabase・ios は触っていない）

| 担当 | 場所 | 何 |
|---|---|---|
| core | `www/core.js:2150` | コメントが消えた `tools/backup-check.mjs` を今もあるように言う |
| core | `www/core.js:2828` | `ltFontOut()` は keyboard.js と言うが sound.js |
| core | `www/onboard.js:1429-1437` | 消えた `netAnon()` が今もあるように言う |
| core/words | `www/me.js:1607 folPut`、`www/phases.js:415 gramArgs` | アプリから呼ばれず検査からだけ呼ばれる |
| core | `www/core.js:2109` `off:'17'` | 国ごとの値段の決定のあとも手打ちの 17 が落ち先に残る |
| sns | `www/sns.js:1193` | 凍結中も制作は続く、とコメント（E6） |
| sns | `www/post.js:4353-4358` | `p.ad` の枝、無い `netPromos()` を名指し |
| sns | `www/post.js:4753` | 投稿の削除の行が `ICON_CROSS`（決まりはゴミ箱） |
| glyph | `www/keyboard.js:398` | 「四段が天井」のコメント（E7） |
| words | `www/home.js:2587-2601` | 言語の名前の保存ボタンがいつも金（打ったかを見ない） |
| sns/core | `www/net.js` `netSearchSave()` | ☆の検索 50 件の上限と押し出しが無い（2026-09-04 の決定） |
| sns | @ の 14 日 | サーバーは断るが、画面が「いつ変えられるか」を出さない |
| server | push-send | ミュートを見ない（E11） |
| ios | `ios/App/App/LinguaShare.swift:288-296` | 録音を Documents に置くと書いたコメント |
| sns | `www/net.js:4465` `netDay()` | 作れなかった日に前の日の一文を出す（2026-09-27「作れなかった日は無くす」と合うか） |

- 引用した出力に `text` を付けた囲みのうち、中身そのものが古い物: `docs/DUPLICATES.md:413`（`netWhoseId()` は無い）、`docs/BACKLOG.md:2175`（confirm と `kbCap()` は無い ── その項目は済んでいるか）、`docs/PROMPTFILTER.md`（`claude/find4` のスコープ宣言で、`www/sync.js` を含む ── 文書ごと日の記録）。【未】
- 保存の失敗が画面に何を出すか（CLAUDE.md 11 条「the server half still says nothing」）── 読み手は「ポップが出る」と言うが、確かめていない。【未確認】

## G. 未了（2026-09-28 10:12 に締めた。次のセッションへ）

**読んでいない:**
- 決定ログ 3200–4699 行（約 50 項目）
- `docs/FEATURES.md`、`docs/BACKLOG.md`
- `docs/HIDEFREE.md`・`EXPIRY.md`・`RISK.md`・`RECOVERY.md`・`DUPLICATES.md`・`PROMPTFILTER.md`・`WALK-141.md`・`GRAMMAR-V2-SPEC.md`・`keyboard.md`・`keyboard-extension.md`・`apple.md`・`ANDROID.md`、README
- 検査: 1b の残り（token・pua・world・push・draft・quiet・round・slow・card・load・import・base・assets・conv・dl・act）、
  1a（box・writes・css-once・es5・verify・shape・block・marks・ink ほか）、2（line・word・i18n・open・find・sheet・migrate・tl・grammar-engine・keep・press・gramlang・again・rls）、3（fixture・post・kb・acct）
  ── それぞれ、バグを戻して赤を見る所まで

**読んだが当てていない:**
- 決定ログ 235–3199 と 4700– の所見（付録 `log1.md`・`log2.md`、E 節の元）── 状態の文の誤り 約 55、差し替えの印が無い 約 25、差し替え済みで本文が残る 約 16
- CLAUDE.md の残り（付録 `claude.md`）── 持ち手の無い規則 12、歴史の残り 6（ボタン数の表）、内部の食い違い 8
- STATE.md の残り（D 節）と、44–912 行のビルドごとの記録（リーダーの判断）
- `docs/DATA_MODEL.md`・`PAID_FEATURES.md`・`TESTING.md` のうち、付録 `core-docs.md` で UNVERIFIED のもの

**検査の限界（直していない）:**
- `sides-check` の関数を辿る段は `MINE`（手書き）で辿る
- `dead-check` は tools からの言及を根に数える（`folPut`・`gramArgs` を core/words が片付けたら外せる）
- `load-check` の三つの読みの基準線、`press` の 44pt の例外五つ、`import-check` の見本の数

**確かめていない:** 保存の失敗が画面に何を出すか（CLAUDE.md 11 条）、`netDay()` と 2026-09-27「作れなかった日は無くす」
