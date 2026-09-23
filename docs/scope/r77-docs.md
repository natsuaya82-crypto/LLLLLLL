# r77-docs ── 書いてある事を今に（r73 §2-17・付録 C・§0 #10）

枝 `claude/r77-docs`（`integ-0905` から、最後に `origin/integ-0905` 9f30091e を取り込み済み）。
コードは一行も変えていない。変えたのは `CLAUDE.md` `README.md` `docs/*.md`（CHANGELOG・scope・reports
は既存を書き換えていない）`tools/docs-check.mjs` `tools/docs-baseline.txt` だけ。

## 覆う一文と、それを数える検査

「後の決定が置き換えた文は消し、置き換えた日付と見出しを一行で付ける。文書が名指す物は
コードに在る。ゲートの本数は文に書かない。」

`docs-check` が数える面（生きている文書の全部、明日足された物も明日数える）:

| 面 | 何を訊くか |
|---|---|
| call | backtick の `name()` がコードに定義されている（前から） |
| name | backtick の名前は全部、コメントを外したコードの語にある。大文字のグローバルの欄（`SET.x` `CAN.x`）は「頭.尾」か宣言の鍵で引く。接頭辞（`DOC_`）はその頭の名前で |
| file / check / npm | コードのファイル名・`x-check`・`npm run x` が git と package.json にある |
| count | ゲートの本数を言う文は、数に関わらず落ちる |
| owner | コードのコメントが引く OWNER の日付に、決定ログの項がある |
| gone | 【差し替え済み】の項は一行だけ（09-03「印を付けて本文を残すのも残したことになる。消す」） |
| struck | `~~`name`~~` をコードが宣言していれば落ちる。`~~…~~` の範囲の中は打ち消し扱い |

赤を見た: CLAUDE.md に `setPlan`・`PLAN_NATIVE`・`LinguaPlan.swift`・`backup-check`・`npm run backup`・
「the fast nine」・「全ゲート28本」を戻すと 7 つとも落ちた。差し替え済みの項に本文を一行・無い接頭辞・
今ある名前の直接の打ち消しも、それぞれ落ちた。外すと緑。

凍結（`tools/docs-baseline.txt`）: 数え始めた日に 166＋元の 56。**今 32**:
孤立 2、`docs/STATE.md` の付録 C 外 21（リーダーの物）、提案書の未実装の名前 5、ログに無い
OWNER の日付 4（08-31・09-07・09-10・09-16）。元の 32（FEATURE_RULES の無い関数）と README の 21 は 0。

## 何を直したか（ファイルごと）

- `CLAUDE.md`: 規則 22「Not built yet」→ `.got` の写し。規則 12 の CD1 → card-check が持つ。規則 6 の
  平キー（09-03 に道が消えた）と「twenty-eight/thirty-one」。規則 9 の最後の script（boot.js）。規則 10 の
  「four ask it」。規則 18・冒頭の「.btn は約三十」。規則 19 の半キー（09-05）。規則 20 の `world().hide`
  → `published_at`。free plan の QWERTY の形（`kbFixed()`）、表の「each drop」→ 09-04「全部一緒」、枠の
  名前はどのプランでも不変（ただし数字の名前は `ltToDigit()` が先に通す ── r73 §4、コードは私の物では
  ない）。§ Names・§ The gate の数、消えた名前の打ち消し、push.js（28 章）を Layout に。docs-check の説明。
- `README.md`: 今のアプリの正面の頁に書き直し（Studio・AI・端末だけ・古い Secret の表・21 の無い名前を消す）。
- `docs/FEATURE_RULES.md`（決定ログ）: 丸ごと差し替え 15 項を見出し＋一行に。部分差し替えの部分を一行に
  （保存ボタン 1 番、特商法の場所、開いている言語を残す、写し、08-18 の 3 番、翻訳の縫い目、範囲 2・3、
  同期 2、広告の一語、noads 二か所、プラン終了の 4 番、データ安全、二つ目の言語の場所、向き、0.55／七行）。
  実装状況の古い 22 項をコードで照合（確かめられなかった 5 項は「2026-09-23 に照合していない」と書いた）。
  ログに無かった決定を三つ項に: 09-03「消す行の真ん中は『この言語を削除』」、09-05「半キーは新しく作れ
  ない」、09-06「設定へのボタンは手順 3 にだけ」（09-03「手順 1 にも」を差し替え済みに）。§ Owner decisions
  の「古い項は言葉を残して superseded 行を足す」（08-26）→ 09-03 の形。消えた名前 138 を打ち消し。
- `docs/STATE.md`: 付録 C の文だけ（一番新しい、saveTry、`.got`、本数、オンボーディングの段、⋯、規約、
  setPlan/Keychain/PLAN_NATIVE、なぞった PDF、Shipaton、obBackTo、天井、plan.renew）。
- `docs/FEATURES.md` `docs/PAID_FEATURES.md` `docs/DATA_MODEL.md` `docs/TESTING.md` `docs/SESSIONS.md`
  `docs/ARCHITECTURE.md` `docs/BACKLOG.md` ほか: 付録 C と §2-17 の文。TESTING の手書きの検査の表を消して
  gate.mjs と各検査の頭を指す。SESSIONS（brief の雛形）から「速い八つ・遅い二十・全ゲート28本」と
  09-03 に置き換わった「ビルドが先、ゲートが後」を外す。PAID の「失敗したら free へ」三か所 →
  09-11「未回答は free ではない」。

## 振る舞い・保存

アプリの振る舞いは何も変わらない。保存する物・消す物は変わらない（CHANGELOG に書く物は無い）。
見た目の変わった画面は無い（スクリーンショットは無し）。docs-check が前より多くを落とす。

## 回した検査

`docs-check`（赤と緑）、取り込んだ後に FAST の全部（18 本、緑）。**全ゲートは回していない。**

## やり残したこと

- **オーナーへ（直していない）**: r73 §5-10（DL 言語の編集）、§5-11（規則 6「打ち終わりで送る」と決定
  「保存を押した時だけ」）、§5-14（欄を自作文字にするか）。§ Explaining にオンボーディングの例外が
  無いのにコードがそう言う件（§5-9）。
- **読めなくて直していない**: 決定ログ「5. 端末に住むものはほとんど無い ── 決まったこと3は superseded
  2026-09-03」── 今の 3 番（古い記載は消す）は 09-03 と食い違わず、どれを指すか読めない。
  08-25「扉は押したら飛ぶ」── r73 は印の無い差し替えと言ったが、置き換えた決定が見つからない
  （09-04「押したら有料へ」と同じことを言っている）。「2026-09-12 朝の六つ」の状況（(b) は半分）は照合していない。
  FEATURES の「サーバーがブロックした作者を外す」── `netFeed` は外させている（net.js の `pull`）、r73 の
  「外していない」は確かめられなかった。
- **r60-up の持ち物（同じ段落を書き換え中）で触らなかった**: `docs/DATA_MODEL.md` 45-48（`localStorage`
  holds・the file・boot.js から撃つ）、FEATURES 71 行（`postCatchUp`）、CLAUDE.md 規則 6
  「`netLangSync()` is still the launch」── r60 のコード変更で偽になる文。
- **ログに無い OWNER の日付 4**（08-31・09-07・09-10・09-16、コードのコメントが引く）── 決定を聞いた
  リーダーが書く物で、凍結に置いた。
- **STATE.md の付録 C 外**（凍結 21 行）── リーダーの物。
- **コードのコメントの古い文**（持ち主へ、r73 §2-17 の一覧のまま＋一つ）: `www/core.js` の
  `langNameOld()`・LinguaPlan・`netPlanSync`・`capLapse` の注、`www/net.js` の `LANGS[id].uid`・
  `netPlanSync`、`supabase/schema.sql` の「private backup」「anonymous account」「Eleven slices」「bkPack()」、
  `www/backup.js` の頭、`www/sns.js` の `snsFil`、`www/words.js` の `capLapse`、`LinguaShare.swift` の声の節、
  `www/post.js` の「Not stored」、`tools/store-check.mjs`・`tools/sides-check.mjs`・`tools/kb-check.mjs`
  （r73 の行）、**加えて `tools/kb-check.mjs` の手順の注（「THE WAY INTO SETTINGS IS ON THE FIRST STEP
  AND ON THE THIRD」── 主張は手順 3 だけを見ていて正しい、注だけが 09-03 のまま）**。

## CODE CONFIRMED / DEVICE CONFIRMED / OWNER CONFIRMED

- CODE CONFIRMED: 直した文は、書いた関数・定数・ファイルをこの枝のコードで grep／読んで確かめた。
  docs-check の各面は赤と緑を見た。
- DEVICE CONFIRMED: 無し（文書と検査だけ）。
- OWNER CONFIRMED: 無し。

## リーダーの指示が間違っていた所

- brief の雛形（`docs/SESSIONS.md` から写したもの）の「全ゲート28本」「速い八つ・遅い二十」は今は違う
  （FAST 18＋SLOW 34）。そして「そしてビルドが先、ゲートが後」は 2026-09-03「全部直してからビルドは
  見る」で置き換わっていた ── 雛形そのものが古い規則を配っていた。雛形は直した。
- brief は「docs-baseline に凍っている 32」と書いたが、この枝の開始時は 56 行（FEATURE_RULES の 32、
  README 21、TESTING 1、孤立 2）。
- r76-lines も `docs/FEATURE_RULES.md` を持っていた（二つの枝が同じファイル）。衝突は出なかった。
