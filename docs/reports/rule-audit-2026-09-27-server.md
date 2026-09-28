# 規則の洗い出し ── サーバー（audit-server、2026-09-27）

ブランチ `claude/audit-server`（`integ-0905` から）。持ち物は `docs/scope/audit-server.md`。
読んだ物: `supabase/schema.sql` 全行、`supabase/functions/daily-prompt`、`supabase/once/*`、
`.github/workflows/supabase-schema.yml`・`supabase-deploy.yml`、`supabase/setup.md`・`mail.md` 全行、
`ios/App/**` の Swift 20 ファイル全行と pbxproj・Info.plist・entitlements、決定ログ全行。
**本番には何も当てていない。** 当てるのはリーダー（オーナーの承認で）。

状態: **済** = このブランチで直した（commit）／**未** = このブランチで直す、まだ／
**オーナー** = 決めごと、選択肢を並べた／**他** = 他のセッションの持ち物、挙げるだけ。
「測った」= rls-check などで動かして見た。「読んだ」= 読んだだけ。

---

## A. お題の cron（BACKLOG 先頭の項）

| # | 所 | 規則 | 中身 | 状態 |
|---|---|---|---|---|
| A1 | 本番の `cron.job` だけ | 書いてないものは守られない／面を覆う | cron が schema.sql にも check にも無く、待ち 1000ms で日が抜けた | **済** `ca1e042c`: schema.sql 末尾の `do $cron$`。`0 7,8 * * *`、待ち 60000ms、見出しは Vault の `daily_prompt_headers` から鳴るたびに読む。本番の job の見出しはその場で Vault へ写す（Vault に無い時だけ、写せなければ job に触らない）。rls-check 5 行、赤を 4 通り見た |
| A2 | `supabase-schema.yml` `once` | 「一回だけ」の名が嘘／過去を今で作り直さない | 一番新しい一つを何度でも流す。今の一番新しい `2026-09-27-today.sql` は `now()` の日付に固定の文を `on conflict do update` で書く ── 明日押せば明日の生成されたお題を上書きし、全員に通知 | **済** `9293290e`: `file` に名前を書いた一つを、`schema_step` に `once/<名>` が無い時だけ流す（記録と SQL を一つの問い合わせで。psql で二度目の拒否と、落ちた SQL が記録を残さないことを見た。管理 API は未確認） |
| A3 | `supabase/once/2026-09-27-today.sql` | 同上 | 日付が `now()` | **済** `9293290e` |
| A4 | `supabase/once/2026-09-27-prompt.sql` | 一つの事は一つの仕組み | cron の待ちを書く二つ目の道（A1 の後は schema.sql が言う） | **済** `9293290e`（消した） |
| A5 | `daily-prompt/index.ts` | 「作れなかった日は無くす」OWNER 2026-09-27 | 聞き直すのは 503・429 だけ。モデルの答えが決まりを破った（422）・JSON でない（502）日は行が無い。冬は 08:00 UTC の一回しか当日に当たらない | **オーナー**（下 O1） |
| A6 | `supabase-schema.yml` 頭の注釈・入力の説明 | 書いたことと動くことが違う | `once` が書かれていない | **済** `9293290e` |
| A7 | `supabase-schema.yml` `check` | 秘密を repo・記録に出さない | `cronjob` 行が command の頭 120 字を印字 ── 見出しの文字（秘密）が Actions の記録に出うる | **済** `9293290e` |
| A8 | `supabase-schema.yml` `check` | 一人の人を名指しした調べ | `tytaymcgill` の顔・投稿、wsys=block の人の言語を毎回印字。「通知の道と新しさ」という説明に無い | **他**（リーダーの調べ物。消すかはリーダー） |

## B. schema.sql の壁と覆い

| # | 所 | 規則 | 中身 | 状態 |
|---|---|---|---|---|
| B1 | `post_read`・`profile_read`・`follow_read`・`react_read` | 「ブロック → 見えなくして」両向き、サーバーで（OWNER 2026-09-24・25） | ビューと関数は `block_hides()` を訊くが、元の表の読みは訊かない。`GET /rest/v1/post?author=eq.<ブロックした人>` で読める見込み。rls-check のブロック歩きはビューと関数だけを数える | **済** `072c2a8f`: 歩きを表まで広げて 7 件赤を測り、四つの表の読みに `block_hides()`。自分のフォロー・いいねは自分に見える（外せる）── BLOCK_HELD に名指し、O7 |
| B2 | `take_make` | 同上 | ブロックの間でも公開言語を取れ、取ると `language_took()` で読める | **違反ではなかった**（測った）: take の policy の中の `language` の読みが `lang_readable()` を通り、既に断られる。`abfd5342` で両向きを名指して、壁を外して赤を見た |
| B3 | `profile` の読み（列） | `prefs` は「nobody else's business」（schema.sql の注釈） | `profile_read` は `using (true)` で列の制限も無く、他人の `prefs`・`ed`・`handle_at` が読める | **測った**（B が A の `prefs`・`ed`・`handle_at` を読める）。**他**: 列を閉じると `netMyProfile()`（www/net.js、他の枝が触っている）が自分の設定を読めなくなる。形の案: `profile_mine` ビュー（`where id = auth.uid()`）を足し、`netMyProfile()` をそこへ向け、その後で `profile` の select を列で絞る。リーダーへ |
| B4 | `media_read`（storage） | 自分だけの投稿（`post_private`）・ブロックは読みの全部に効く | バケットの物は誰でも読め、一覧もできる ── 自分だけの投稿の写真、送っていない下書きの声も | **済** `d6010d15`（直す前に 4 件赤） |
| B5 | `media_drop`、`media_read` | 凍結は「読む」と「出口」を残す（schema.sql・2026-08-26） | どちらも `is_member()` を訊く ── 凍結されたアカウントは写真を読めず、アカウント削除で写真と声を消せない（全部消える、OWNER） | **済** `d6010d15` |
| B6 | プランの上限（言語数・DL 数・編集は Plus・140 字） | お金は「する事」を決める | サーバーは何も止めない。API を直接叩けば上限を越える | **オーナー**（下 O2） |

## C. schema.sql の注釈（今と違う文）

| # | 行（前後） | 中身 | 状態 |
|---|---|---|---|
| C1 | 33-42 | 「A language is made on the device and stays there… The phone is the original」── 規則22と逆 | **済** `22bd8f73` |
| C2 | 169-174 | 凍結は「editing and backing up on the phone」を残す ── 編集は止まり、バックアップは無い | **済** `22bd8f73` |
| C3 | 478-480、1046、1016 ほか | `netSlicePut()`・`netKeeps`・`www/sync.js`（`syMerge` `syKeyOf` `syArr` `syObj` `syPut`）── 無い | **済** `22bd8f73` |
| C4 | 1274-1277 | 設定は「belong to the device and to no account」── 今は逆 | **済** `22bd8f73` |
| C5 | 1303 | `bkNo()` ── 無い | **済** `22bd8f73` |
| C6 | 1315 | `capLapse()` ── 定義が無い（名前だけ残る） | **済** `22bd8f73` |
| C7 | 1722-1742、1765-1798 | 「the app has never been released」ほか、has_account と匿名の昔話の段落 | **済** `22bd8f73` |
| C8 | 2106-2126、2127-2151、2191-2218 | 別のビューの注釈が離れた所に取り残されている。2210-2212 は読みの規則を `published_at is not null or owner = auth.uid()` と言う ── 今は `lang_readable()` | **済** `22bd8f73` |
| C9 | 2155 | 「the string localStorage holds」── 電話のメモリ | **済** `22bd8f73` |
| C10 | 2195、2226 | `netLangNames()`・`netWhoseId` ── 無い | **済** `22bd8f73` |
| C11 | 2364 | rls-check の「MD cannot read that MD is muted」── 実際の名は「A cannot read that A is muted」 | **済** `22bd8f73` |
| C12 | 2580 | 見出し「plan: yours to read, yours to write」── 書けない | **済** `22bd8f73` |
| C13 | 3159 | cron は「set in Pacific (supabase/setup.md)」── UTC の 7・8 時、schema.sql の block | **済** `22bd8f73` |
| C14 | 3431-3434 | 「the languages cascade from the profile」── `auth.users` から | **済** `22bd8f73` |
| C15 | 3585-3587 | `language_read` は「published, or yours」── `lang_readable()` | **済** `22bd8f73` |
| C16 | 4009-4023、4051-4064 | prefs の grant が抜けていた昔話、has_account の見出しの下に post の grant が置かれている | **済** `22bd8f73` |
| C17 | 4040、4077-4080 | 「The five named」── 七つ | **済** `22bd8f73` |
| C18 | 473 | 「THE ONLY AUTOMATIC DELETION IN THIS FILE」── `device_one()` も消す | **済** `22bd8f73` |

## D. supabase/setup.md・mail.md（全 34 件、要点）

setup.md は Actions（Supabase Schema の apply/check/logs/once、Supabase Deploy）を一度も名指さず、SQL Editor
への貼り付けとターミナルを前提にしている。anon に grant が要る（170）、唯一の自動削除（178）、`netSlicePut()`（187）、
表の数 8・ビュー 4（120-126）、匿名は ON でも OFF でも（53）、42501 は匿名 OFF（525）、`postCatchUp`（511）、
「アプリはネットワークを待たない」（516）、「言語を作るのにサーバーは要らない」（477）、§8「まだ無いもの」の三つ中二つ、
§8b-2 の手作業（Actions がやる）、§9-3 のターミナル、§9-5 に待ちが無い（日が抜けた原因）、§10 を「履歴として」残す、
管理画面の中身（435 と 811 が食い違う）、§5-4 の「設定の一番下の通報」（消えた）、「できることは2つ」（4 つ）、
§5-1「改名で lingua」（改名は断られる）、§12 の `push_on_reply`（今は `push_on_post`、引用も）、
再送信の 60 秒は「まだ無い」（ある）、昔話の段落、§11 の「一行も書かれていない」、§3 の DNS 三つ（四つ）。
mail.md は 6 桁（8 桁）、OTP Length の手順が無い、昔話の段落、日付の食い違い（09-02 と 09-03）。
**状態: 済** `d31c96c1`（§5-4 の「@lingua でないスタッフに通報への入口が無い」は、コードで確かめて文に書き、オーナー O4）。

## E. ios/App の Swift（20 ファイル、他のセッションの物を含む）

| # | 所 | 中身 | 状態 |
|---|---|---|---|
| E1 | `LinguaKeyboard/Compose.swift` 94-95・153-174、`CandidateBar.swift`、`KeyboardViewController.swift:300` | 自分の字の面で打つと、候補の引きに私用領域の字を渡すが、`conv.map` の鍵はローマ字 ── 注釈の言う「単語ファースト」の候補が出ない見込み（読んだだけ） | **済** `3154a96a`（読んで確かめた）: Face が `nm` を読み、Compose は名で表を引く。conv-check 13 が JS 側を持つ（`nm` を外して 84 件赤）。Swift は未ビルド |
| E2 | `App/LinguaShare.swift` 71-91 | 引数が無い・base64 が読めないのを「空」と同じ枝で扱い、キーボードのファイルを消す（空と壊れは別） | **済** `2e42e4d6` |
| E3 | `App/LinguaShare.swift` 151-167 `sheet()` | 注釈は名前を確かめると言うが、`name` を確かめていない（`..`・`/`） | **済** `2e42e4d6` |
| E4 | `App/LinguaShare.swift` 442-455、288-302 | フルアクセスの注釈（要求しない、2026-09-18）、声を Documents に置く注釈（今はバケット） | **済** `eb45742a` |
| E5 | `App/Info.plist` 69-77 | 言語を Documents に書くという注釈と、Files に見せる二つの鍵 | 注釈は **済** `eb45742a`、鍵を外すかは **オーナー**（O5） |
| E6 | `App/LinguaStore.swift` 106-108、`MainViewController.swift` 28-31 | `apiKey` は空、`Transaction.updates` の注釈 ── 今は違う | **他**（r121 が LinguaStore を持つ）／MainViewController は **済** `eb45742a` |
| E7 | `App/LinguaPush.swift` 168・176 | `.badge` を求めるが決まっていない、`syncWithin` の名 | **他**（r124） |
| E8 | `LinguaKeyboard/Shared.swift` 399、`LinguaWidget/Numerals.swift` 219 | `v` を比べると言って比べていない、空と壊れが一つの nil | 注釈は **済** `eb45742a`、壊れた時の文は **オーナー**（O8） |
| E9 | ウィジェット 4 ファイル | `contentMarginsDisabled()` の後に「margin is back」と矛盾する注釈が三か所、検査の数を書く | **済** `eb45742a`（理由は WidgetGround.swift の一か所に） |
| E10 | `LinguaWidget/CalendarWidget.swift` 341 | 字の設定が無いと月の見出しが毎月「1」 | **済** `2e42e4d6`（読んで確かめた） |
| E11 | `LinguaKeyboard/KeyBoardView.swift` 170-182 | 短い最後の行に地球のキーが数に入り、シートの `kbStart()` より半列ずれる（読んだだけ） | **未確認**: 電話で並びを見ないと言えない。www/share.js と Swift の両方に触る形なので、確かめてからリーダーへ |
| E12 | 小さい古い注釈（GlyphView 236、Shared 290、KeyBoardView 49） | | **済** `eb45742a` |
| E13 | Info.plist の許可の文・ウィジェットの名前が英語だけ | 規則2は www/ だけ | **オーナー**（O6） |
| E14 | AppDelegate 267-287 | 空のひな形 | 直していない（Capacitor のひな形、害なし。消すのは整理で、規則の違反ではない） |

きれいだった物: Swift 20 本すべて正しい target の Sources にある、`__NAME__` は `__APPLE_TEAM_ID__` だけで
ios-deploy.yml が埋める、秘密は無い、キーボードの数（0.1385・0.5・20 半列）が JS と合う、UIAlertController は
プロフィールの絵だけ、評価は `requestReview`。

## F. 他のセッションの物（挙げるだけ）

- `www/core.js:2672` の `LinguaPlan.swift`（無い）── 持ち主なし、リーダーへ
- `www/mod.js:297`「Nothing resets the count」── `adminTap` が 0 に戻す
- `www/store.js:168・341` の `syncWithin` ── r121
- E6 の LinguaStore、E7 の LinguaPush ── r121・r124

## O. オーナーの判断が要る物（選択肢）

- **O1 お題の抜けた日**: (a) 今のまま（503・429 だけ聞き直す）／(b) 決まりを破った答えも同じ回の中で聞き直す（モデル代が増える、60 秒の中）／(c) 鳴らす回を増やす（例 `0,20,40 7,8 * * *`、行があれば何もしない。変わる時刻が遅れる日がある）
- **O2 プランの上限をサーバーでも止めるか**: (a) 今のまま（アプリだけ、schema.sql の頭の注釈どおり）／(b) 言語数・DL 数をサーバーの policy で数える（上限の数が schema.sql にも書かれる）
- **O3 cron を本番に当てる**: リーダーが apply する時、Vault が使えること。見出しに `Authorization` が無ければ（ダッシュボードの job が持っていなければ）今も通っているはずなので写すだけでよい
- **O4 スタッフ（@lingua でない）に通報の画面への入口が無い**（setup.md §5-4 は「設定の一番下」と言うが消えている）
- **O5 Files に Documents を見せる二つの鍵を外すか**（今そこにあるのは前のビルドの残りだけ）
- **O6 iOS が出す文（許可の文、ウィジェットの名）を十の言語にするか**

- **O7 ブロックの前からあるフォロー**: (a) 今のまま（残り、本人は外せる。相手からは見えない）／(b) ブロックした時に両向きのフォローを外す（X と同じ。消す決定なので DELETE REVIEW が要る）
- **O8 キーボード・ウィジェットのファイルが壊れていた時の文**: 今は「無い」と同じ文（キーボードは「先に字を描いて」）。別の一文を足すか

## G. ほかに直した物

- `.github/workflows/i18n.yml` が検査の数（26）を書いていた、`store-localize.yml`・`store-submit.yml` は入力をシェルに直に埋め、既定の版が 1.0.2 だった ── **済** `d250b1be`
- `daily-prompt/index.ts` の「一回の呼び出しまで」── **済** `f2da7cc3`
- `docs/BACKLOG.md` のお題の cron の項 ── 覆ったので消した `ca189086`
- rls-check の cron の切り出しが注釈の名と取り違えた ── **済** `25fe7157`

## H. 読み切れていない物

- `supabase/functions/push-send`・`verify-plan` の全行（他のセッションの持ち物で、挙げるだけの予定だった）。
  決定ログ側からの突き合わせでは食い違いは見つかっていない。ミュートした人からの iPhone の通知はまだ鳴る
  （決定ログに「持ち物の外」とある既知のこと）。

## 数

- 見つけた: 84（A 8・B 6・C 18・D 34・E 14・G 4）
- 直した: 73（A 6・B 3・C 18・D 32・E 10・G 4）── 全部 CODE CONFIRMED のみ。電話でも本番でも確かめていない
- 違反ではなかった: 1（B2、測った）
- オーナーの判断: 8（O1〜O8）
- 他のセッション・リーダーへ: 8（A8・B3・E6 の LinguaStore・E7・F の四つ）
- 未確認のまま・直していない: 2（E11 は電話が要る、E14 はひな形）

**本番には何も当てていない。** 当てる順: `apply`（schema.sql ── cron の見出しの Vault への写しは `apply` の中で起きる）
→ `check` で `cronjob daily-prompt ... headers=vault` を見る。Swift はビルドで組めるか確かめる。

## I. オーナーの決定 2026-09-28（凍結・ブロック）

- **凍結中は読めない**: `is_member()` を定義者権限にし、`public` の全部の表に restrictive の `frozen_out`（`is_member()`）を
  カタログから数えて一つずつ。自分の `profile` の行だけ本人に見える（凍結の画面のため）。定義者のビュー 7 本は自分の
  `where` で `is_member()`。`media_read`・`media_drop` は `is_member()` に戻した。`is_staff()`・`is_admin()` も訊く。
  匿名のセッションも読めなくなった（アカウントは一種類）。
- **ブロックはどの道からも見えない**: 自分のフォロー・いいねの例外を外した（BLOCK_HELD は空）。写真と声も歩きに入れた。
- **検査**: rls-check に `_frozen_seen`（凍結した B として全部の関係・関数・ファイルを読み、凍結していない時に見える 20 の
  読みが凍結で 0）。赤は `is_member()` から凍結を外す・表の覆いを外す、の二通りで見た。ブロックはフォローの 1 件で赤を見た。
- **決まっていないこと**: ブロックの前にしたフォローは残り、誰にも見えず、外す道も無い（O7 のまま）。
