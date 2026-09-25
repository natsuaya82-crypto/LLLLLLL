# Where this project actually stands

`CLAUDE.md` says how the code has to be written. This says what has been built,
what has not, and what is not the repository's to hold. Read it before doing
anything in a session that did not build the thing it is about to change.

The rest of `docs/` is the working detail behind the rules at the head of
`CLAUDE.md`:

| | |
|---|---|
| `ARCHITECTURE.md` | the shape of the app, and where each thing is the truth |
| `DATA_MODEL.md` | every stored thing, its owner, and whether it may change under somebody |
| `DATA_SAFETY.md` | how a language is not lost; what a save owes the server; DELETE REVIEW |
| `FEATURES.md` | every feature, its plan, its data, and whether the owner has decided it |
| `FEATURE_RULES.md` | the order, the owner decision log, scope for parallel sessions, what "done" is |
| `PAID_FEATURES.md` | `CAN`, the three plans, and what money may never touch |
| `TESTING.md` | what to run when; how to fix a bug; what needs a device |
| `CHANGELOG.md` | what a person would notice, and every change to stored data |
| `BACKLOG.md` | found and deliberately not done, and why |
| `RECOVERY.md` | バグで人のものが消えたときに運営側で戻す案。三つ並べてある。**まだ決まっていません** |
| `DUPLICATES.md` | 同じものが二箇所以上に直書きされている所の一覧。食い違っているものが八件、まだ一致しているものが十二件 |

**The 2026-09-09 section was written that day. § 0 was written on 2026-09-05 and § 0-a re-read that night. Every other section was read
on 2026-09-03 and has not been re-read since.** Where a claim can go stale it
carries the command that re-checks it. **Run the command; do not believe the
sentence.**

**This file is the leader's, and the leader writes it.** A stale RULE is doubted.
A stale statement of FACT is simply believed — which is why nothing here may sit
un-re-read.

---

## 2026-09-24 ── r68・r78・r79・r80・r81（integ `ee2d0e9c`、ゲート全部緑（本数は npm test の最後の行）、rls 498/0 ── **ビルドの手前で止めている**）

- `claude/r79-acct` ── 端末に書く物は書く時にアカウントの鍵（`lingua.<名>.<uid>`、`acctPut()`）。持ち主の無い
  古い写しは誰の物にもしない（読まない、消さない）。キーボードの面は保存を押すまで下書き（K1）。
- `claude/r80-block`・`claude/r85-block` ── ブロックした相手の物はサーバーが `block_hides()` 一つで外す
  （両向き、公開言語も、書く側でもいいね・リポスト・返信・フォローを断る）。ミュートは `mute` 表と
  `mute_hides()`（その人が書いた物・回した物・その人からの通知）、設定の「非表示リスト」、ミュート中は印に赤い斜線（r88）。
  保存ボタンのある画面はタブで出る時も「保存しますか？」、Pro の上限では＋を出さない（r88）。**Supabase で schema.sql を流すまで電話では効かない。**
- `claude/r78-sides` ── 読む側は投稿に載っている物だけで描き、何も書かない。Lingua キーボードの字は欄の外へ
  出ない（`puaTyped()`・`actVal()`、`pua-check`）。キーの画面の「確定」を消した（OWNER 2026-09-24「いらないなら
  保存だけでいいよ」）── 押した字がそのキーに入る。
- `claude/r68-state` ── サーバーがまだ答えていない間を無料・空・0 と読まない（`state-check`）。読めない slice は
  空で開き、保存は「保存できませんでした」。r80 の端末側（端末でのブロックの篩いを消した）。
- `claude/r81-checks` ── r79 の後に赤くなった検査の前提を今の形に。
- **Android 版**（OWNER 2026-09-24）── 「まずはそのアプデ終わらせて取り掛かろう」。この更新を出してから。
  オーナーの端末: iPhone SE2・iPhone 17・Redmi 12・Xiaomi Pad 5。Play の登録が個人か事業かは訊いている。
- CODE CONFIRMED のみ。DEVICE CONFIRMED・OWNER CONFIRMED は無い。

## 2026-09-23 夕 ── 活用形・広告・目安の線 田・字間の画面・通知「今日のお題」・↓ の状態（integ `cf2d9408`、166 で出す ── **オーナーの Apple 側 1・2 待ち**）

- `claude/r52-forms` ── **活用形は語ではなく形**（OWNER 2026-09-23）。語の上に
  「ラベル＋形」で持つ（原型 aa／未来形 aai）。ラベルと形が揃わないと登録できない。
  ラベルは自分でも作れる（`i~`）。100 語／1000 語に数えない。語ページの活用一覧に出る。
  キーボードの変換も引ける。**前に語として作られた活用形は一覧から隠すだけで消さない**
  （`wIsForm()`、決定 B）。`forms-check`（新規）、`plan-check`・conv・grammar を更新。
- `claude/r55-ads` ── **広告枠**（OWNER 2026-09-23「Twitterと同じ。ツイート擬態右上に
  pr」）。投稿 10 件ごとに一枠、10 件未満なら無し、pro は無し（`can('noads')`）。
  枠は売れる形 ── サーバーの広告行を `postRow` で描き右上に PR。売れていない枠は
  AdMob ネイティブ（`ios/App/App/LinguaAds.swift`、GMA 13.6.0、Podfile）。
  ID は `ios-deploy.yml` の「Inject AdMob IDs」が secrets `ADMOB_APP_ID`・
  `ADMOB_NATIVE_UNIT` から入れ、無ければ Google のテスト ID。ATT の許可は jpel と同じ。
  UMP（EU の同意）は BACKLOG。**実機はまだ ── 広告が実際に出るかは 166 で見る。**
- `claude/r56-guide-sp` ── **目安の線は 田**（口＋十、点の 0・10・20 段と列、
  コントラスト 5.04:1／暗 8.38:1、`guide-check`）。**字間は別ページ**（設定 → 言語 →
  字間 >、横と縦の見本）。otf5.js が vhea/vmtx/VORG を書くので縦書きも字間に従う
  （`line-check` 6）。
- `claude/r57-store` ── `tools/store-localize.mjs --dry` が Apple の断る字を種類で
  拒む（FAST に登録）。Store Localize は 1.0.2 で 10 言語成功（run 35871369202）。
- `claude/r58-prompt-push` ── **通知「今日のお題」**。通知の種類は一覧一つ、`prompt`
  を足した。Supabase の cron `daily-prompt` は `0 7,8 * * *`（ロサンゼルスの 0 時、
  夏冬どちらも）、関数は同じ日に二度送らない。通知の部屋のスイッチは 5 つ。rls の
  ケースを追加。
- `claude/r59-take` ── **人の言語の ↓**（OWNER 2026-09-23）。押すと回る印、サーバーが
  取れたと言えば ⭕☑️、断られたら ↓ に戻り「接続できません」。⭕☑️ はサーバーの答え
  （`langWhose()`）と読み込み済みの章から（`wldTakeOf()`、home.js）。**人の言語は
  wiki に出ない** ── 取った言語を開いていてもプロフィールの「この言語について」の行は
  出ず、記事は開かない（`langLocked()` 一問、`wldRow()`・`wldPage()`）。`take-check`
  （新規）。取った言語で about が回り続ける件はオーナーが「無視していい」。

**166 の前にオーナーがやること**（枝 `claude/owner-todo` の OWNER-TODO.md）：
① App ID `com.tokinets.lingua` に Push Notifications を足す ② 配布用プロファイルを
作り直して secret `PROVISIONING_PROFILE_BASE64` に入れる。`aps-environment` が入って
いるので、この二つの前に出すと Archive で落ちる。AdMob の本番 ID の secrets も同じ
ファイルにある（無くてもテスト ID で出る）。

## 2026-09-23 午後 ── 一行を描く仕組みを一つに・文字を描く面の目安の線（integ `8801f35b`、ゲート 47 緑、166 で出す）

- `claude/r53-line` ── **一行を描く仕組みを一つに**（OWNER 2026-09-23「片方ずつ直すのは
  継ぎ当て」）。入力欄は LinguaType の字、投稿は一字ずつの canvas で、字の大きさ・
  スペース・改行（投稿で消えていた）をそれぞれが決めていた。今は投稿の墨を私用領域の
  字にして LinguaType に足し（`inkChar`/`inkFaces`/`inkFaceCSS`、glyph.js）、入力欄・
  投稿・引用・字間の見本・カレンダーが同じ書体・同じ CSS 規則（`.pline, .pwfield
  #pw-ln`、`pre-wrap`）の文字。空白と改行は `postRuns()`（post.js）一か所、カードも
  それを読む。`inkLine` と `.tcln` は消えた。`line-check`（新規）。写真 `shots/r53-*`。
  **実機はまだ。** 並列の重さで `plan-check` が一度 5 秒待ちに遅れた ── 単独 4 回緑、
  r53 前後で所要 30s 同じ、と測った。
- `claude/r54-guides` ── **文字を描く面に目安の線三本**（OWNER 2026-09-23「aやね」、
  r/casualconlang「guide lines」から）。点の 0・10・20 段目（字体の上・中・下）に
  点より薄い横線。何も保存しない、設定も無い。`geDraw()`（glyph.js）。`guide-check`
  （新規、ゲートに登録済み）。写真 `shots/half-*-in-the-editor-*`。線は r56 で 田 になった（上）。

## 2026-09-23 ── 字間（integ に取り込み済み、166 で出す）

- `claude/r51-spacing` ── **字間を言語ごとに**（OWNER 2026-09-23、r/casualconlang
  のコメントから）。設定 → 言語 に「字間」のスライダー（0〜2 歩、既定 1、0.1 刻み、
  横にその字間で自分の字が並ぶ）。値は `SCRIPT.sp`（script スライス、無い＝1）、
  **投稿は書いた時の値を `ink.sp` に持つ**（無い＝1、過去の投稿は変わらない）、
  人の投稿は人の字間で描く。`geSide()` は作る側の物になり `sides-check` の禁止一覧へ。
  0 で繋がるのは実測（隙間の画素列 0、線でも字体でも）。`card-check`・`again-check`。
  写真 `shots/r51-*`。**実機はまだ。** 位置別字形（語頭・語中・語末）はやらない。

## 2026-09-22 夜 ── 通知（integ に取り込み済み、**166 で出す ── オーナーの Apple 側の手順待ち**）

`master` = a451c515（165、版 1.0.2）。integ-0905 に下の二本が入っている。**ビルドは
オーナーが App ID に Push Notifications を付けて配布 profile を作り直し
`PROVISIONING_PROFILE_BASE64` を差し替えてから** ── それまで Archive で落ちる
（`docs/apple.md` § 8、`ios/App/App/App.entitlements` の `aps-environment`）。
**schema.sql が変わった ── 先に一回流す**（表 `device`、トリガー三つ、大きい
カバー）。Supabase の Database → Webhooks を一度 Enable（`supabase/setup.md` § 12）。

入ったもの：
- `claude/r47-push-server` ── **ネイティブ通知のサーバー側**：表 `device(uid,
  token)`、`follow`／`post(reply_to)`／`react` の after insert トリガー →
  edge function `push-send`（行を読み直して APNs、410 の token は消す、DELETE
  REVIEW は CHANGELOG）、`push-check` 90 本（gate FAST）、Supabase Deploy に
  `push-send`。**`profile.prefs` が 9/8 から書けていなかった grant 漏れ**を直した。
  **大きいカバー**（OWNER「サインインがない状態でできることがないはず」）：`anon`
  にはこのサーバーの何一つも無い（表・view・関数・sequence・bucket、明日足す物も）、
  `post-media` は非公開、edge function は三つとも JWT 検証あり、`rls-check` が
  カタログを数えて全部を「誰でもない人」として試す（関数 69・表と view 24・
  bucket 2）。扉の `email_taken()` だけ例外（OWNER「これは例外で」）。
- `claude/r48-push-app` ── **アプリ側**：`LinguaPush.swift`（許可・token・押して
  開いたら `window.pushOpened`）、`www/push.js`（第 28 章、`pushAsk()` は
  `netTook()` から一箇所）、設定の部屋「通知」に四つのスイッチ（`profile.prefs`
  の `push_follow/reply/like/boost`、無いのはオン）、サインアウトで自分の token
  の行だけ落とす。`acct-check` 82〜85。**`www/net.js` はセッションが無ければ
  一本も送らない**（扉の `email_taken` と `/auth/v1/*` だけ通す）、**写真と声は
  `netMedia()` 一箇所がセッション付きで取って objectURL**（~~`netMediaURL()`~~ は
  消えた）。写真 `shots/r48-*`。**実機は全部まだ。**

**オーナーがやること（順に）**：`docs/apple.md` § 8 の 1〜6（App ID の Push、
profile 作り直し→Secret、APNs 鍵→`APNS_KEY_ID`/`APNS_P8`、Webhooks Enable、
schema を流す、Supabase Deploy `push-send`）。1〜2 が済んだら 166 を出す。

## 2026-09-22 ── ビルド 164（Apple が断った：版が 1.0.0 のまま ── 1.0.2 で 165 を出す）

Actions の run 35756973192（16:52 UTC、master 7873029d）は success で上がったが、
**Apple がメールで断った**（ITMS-90186 / ITMS-90062：`CFBundleShortVersionString`
1.0.0 は公開済みの版と同じ）。ビルド番号は Actions の run 番号 = **164**（この日
「163」と呼んでいた物。163 は 13:57 に途中で止めた run が消費している）。
直し：版は `package.json` 一箇所（**1.0.2**）から workflow が pbxproj に書き、
`assets-check` が一致を持ち、`tools/version-check.mjs` が archive 前に App Store
Connect へ「閉じた版より上か」を訊く（`docs/apple.md`）。出し直しは **165**、
中身は 164 と同じ（下）。

## 2026-09-22 ── ビルド 164（run 35756973192、Apple が版で断った ── 上。中身は 165 と同じ）

`master` = 取り込み後の sha（ゲート緑で ff）。実機で見る場所は
`docs/CHECK-0907.md`「ビルド 163」。**`supabase/schema.sql` が変わった ──
先に一回流す**（表 `feedback`）。**実機確認は全部まだ。**

入ったもの：
- `claude/r45-contact` ── **設定に「お問い合わせ」**（意見／要望／バグを選んで
  書いて送る、画面へ遷移）。送った物はサーバーの表 `feedback`（`author` は退会で
  null、本文は残る、`kind` は三つ、`body` 1〜2000 字）。**読めるのは staff だけ**
  （`feedback_read` = `is_staff()`）、update／delete の policy は無し（消す道は
  誰にも無い ── 決まっていないので）。admin の画面の報告の下に一覧。
  `rls-check` 19 件、`acct-check` 79・80（本物のボタンを押して測る）。端末に貯まる
  物は無し。**二周目（オーナーが r45 に直接）**：運営は一件ずつ消せる
  （`feedback_drop()`、押すと訊く、DELETE REVIEW は CHANGELOG）、本文は 2000 で
  打ち止め、画面はフォームの形で種類は wheel、admin は選択の画面（通報／
  お問い合わせ／復旧）、復旧の顔の bar は「復旧」。返信の道は無い。
- ストアの文を 10 言語で入れる（`store/<locale>.json`、`tools/store-localize.mjs`、
  Actions「Store Localize」、`docs/apple.md` § 4b）。**公開中の 1.0.1 には
  入らない ── 1.0.2（＝163）に付けて出す。**サポート URL は変えない。
- `claude/r49-contact2` ── お問い合わせの**送信は bar の右上**（打つと光る、
  画面は描き直さない）、**本文は残りの画面全部**、送ると「送信しました」
  （OWNER 2026-09-22）。`acct-check` 81。写真 `shots/r49-*`。
- `claude/r50-composer` ── 新しい投稿の三つ（OWNER 2026-09-22、写真三枚）：
  ① 打つ用の書体 `LinguaType` が空白を持たない（`LinguaFont.build` に `space`
  の選択肢、`installTypeFont()` が `space:false`；空白だけが一マス幅だった）、
  `conv-check`。② **欄をタップしても画面の何も動かない** ── `.view.fit` の高さを
  `100dvh - var(--vvtop)` に（箱は `--vvtop` から始まるのに高さがページ丸ごとで、
  持ち上げのぶん足がはみ出していた）、`post-check`「NOTHING ON THE COMPOSER
  MOVES」。③ **縦書きの欄はローマ字も立てる** ── 142 の r6-post（`mixed`）は
  削除、投稿の行と同じ `upright`。「入力しづらい」は測れる欠陥なし（変換・
  カーソル・再焦点、全部正常）。写真 `shots/r50-*`。**実機は全部まだ。**
- **規則が一つ増えた**（OWNER 2026-09-22）：穴を潰さず、面を数えて一文で覆う。
  `CLAUDE.md` § Simple の次、`docs/FEATURE_RULES.md` § One place、`docs/LEADER.md`。

**163 に入れなかったもの**：通知（`claude/r47-push-server`・`claude/r48-push-app`、
コード完了）── r48 の `aps-environment` は、オーナーが App ID に Push を付けて
配布 profile を作り直すまで **Archive で落ちる**ので、163 の後に取り込んで 164。
同じ二本に「サインインなしでサーバーに触れる道は無い」の大きいカバー
（`anon` に権限ゼロ、`rls-check` がカタログを数える、`www/net.js` はセッション
無しで送らない、扉の `email_taken()` だけ例外）。

**162 の実機（2026-09-22）**：フルアクセスをオフのままシステムキーボードに
描いた字が出た（DEVICE CONFIRMED）。描いた直後に開いたままのキーボードには
出ず、閉じて開き直すと出る ── 拡張は現れるたびに読み直す作りで、直す物は無い。

## 2026-09-18 ── ビルド 162

**App Store に出た ── 2026-09-22、1.0.0 (162)（Apple のメール 2026-09-22：approved version は 1.0.0）、https://apps.apple.com/us/app/lingua-conlang-builder/id6796378999**（カテゴリ 教育、13+、ストアの言語は英語のみ）。154 と 161 が落ちた
所（schema 未反映・SIWA の名前）は 162 で閉じた。

`master` = 982197a4（ゲート緑で ff、run 35370881250）。実機で見る場所は
`docs/CHECK-0907.md`「ビルド 162」。**`supabase/schema.sql` は変わっていない**。
**実機確認は全部まだ。161 の実機確認もまだ**（オーナーは 161 を Apple に出し、
Apple が 4 で落とした）。

**Apple の審査（161、2026-09-18、Guideline 4）**：「Sign in with Apple のあとに
名前かメールを入力させている」。原因は読んで見つけた：`obSocial()` が plugin の
`profile`（givenName／familyName）を捨て、行の無い新しい account が
`obWhoHTML()` に空欄で立っていた。**オーナー「まとめてレビューして欲しい」**
→ 出す前にこちらで審査基準を全部なめた（r41）。

入ったもの（五本、根は 11480dd5）：
- `claude/r40-siwa` ── Apple／Google がくれた名前を「名前と @」の名前欄に
  入れて出す（形 A、直せる）。`obGaveName()` が一箇所。@ は打つ。acct-check 78。
- `claude/r41-review` ── **審査基準の総ざらい**、`docs/scope/r41-review.md`。
  高 4（4.8 は r40／残り三つはオーナー側：審査用アカウント・schema が本物に
  入っているか・規約とポリシーの二枚が開くか）、中 7、低は確かめて問題なし。
  コードは一行も変えていない。
- `claude/r42-docs44` ── 規約・ポリシーのリンク 21px → 45px、プロフィールの
  自己紹介のリンク 16px → 44（padding＋負の margin、行間は動かない）。**`press`
  の 44pt の測りに `a[href]` が入った**（四本赤を見てから）。
- `claude/r43-namefree` ── **「山田太郎」**：姓→名（ja／zh／ko は空白なし、他は
  一つ ── 空白はリーダーの読み）。**「free」**：無料の段は `$0／月` をやめて
  その言語の「無料」の語、期間なし。plan-check に無料の段の claim 六本（それまで
  無料の枝は誰も歩いていなかった）。
- `claude/r44-ios` ── **「切っていい」**：`RequestsOpenAccess` false、案内の手順 4
  「フルアクセスを許可」を手順ごと削除（`kb.step4`・`kb-full.jpg`）。
  **「縦のみ」**：`UISupportedInterfaceOrientations` を Portrait だけに。
  **DEVICE UNCONFIRMED**（Linux に Swift は無い）。

**触っていない決めごと**：`netDay()` が「今日」を訊かず一番新しい行を出すのは
コードのコメントが**わざと**と書いている（r41 は中と読んだ）。オーナーが言う
まで動かさない。`kbSettings()` が設定に飛ばない件は原因未確認のまま
（実機でしか押せない）。

**オーナーの朝の三つ（これが無いと 162 も落ちる）**：審査用アカウントを
App Review 情報に／SQL 二行で `account_delete()` と `profile.link` が本物に
あること／iPhone の Safari で terms.html と privacy.html が開くこと。Apple への
返事の文はリーダーの for-owner.md（scratchpad）にある。

## 2026-09-15 ── ビルド 161

`master` = 取り込み後の sha（ゲート緑で ff）。実機で見る場所は
`docs/CHECK-0907.md`「ビルド 161」。**`supabase/schema.sql` は変わっていない**
── 先に流す物は無い。**実機確認は全部まだ**。

入ったもの：`claude/r39-tags`（十三 commit、根は d91617c0）。オーナーが 160 の
写真から言った物を全部、オーナーの言葉のまま `docs/scope/r39-tags.md` に置いて
仕様にした（「基本俺が頼んでる」OWNER 2026-09-15）。

- **タグは本文の外**（「#はべつで」）。投稿画面は本文と意味の下に `#` の欄、
  四つで止まる。出る所は意味の行のすぐ下、「@〇〇 への返信」と同じ字の大きさ、
  押すとそのタグの検索。**貯まる物は `post.body.tags`**（配列、最大 4、`#` 無し、
  小文字にしない）。schema は変えていない（`body` は jsonb）。**前からある投稿は
  一行も書き換えない** ── 本文の中の `#〜` は今までどおり青い（`tagHTML()` は
  残っている）。
- **文字数は無料 140、plus から無限**（`POST_MAX`、`postCap()` は `core.js` の
  `wordCap` の隣）。本文も意味も。`maxlength` は外し、超えて送ると
  `popAsk(t('up.need'))` → プラン。輪は二つ（本文・意味）。
- **頭の @ は素の文字**。青いのは「〇〇 への返信」の @ だけ。
- **長い投稿は五行で畳む**（`POST_FOLD=5`、「5で」OWNER 2026-09-16 三枚の
  写真から）。「もっと読む」はその場で開き、「たたむ」で戻る。無料の 140 字は
  どの端末でも二、三行なので畳まれない。
- fixture の 3／8 の顔と `shots/r39-fold-3|8` は決まった日に消した。

r39 は四種類を一つの commit（6795ace7）に入れた ── 分けられなかった一件は
`docs/scope/r39-tags.md` にそのまま。押して測った赤は post-check 七つ。

Apple：154 は落ちている（`profile.link`、登録エラー ── どちらも schema が
入っていなかった）。**161 を実機で見て（登録→ログイン、この言語について が
開く、投稿の 140・タグ）から出し直す。**返事はリーダーが書く。

## 2026-09-15 ── ビルド 160

`master` = d91617c0（run 34974226206、success）。実機で見る場所は
`docs/CHECK-0907.md`「ビルド 160」。`supabase/schema.sql` は変わっていない。
**実機確認はまだ**（オーナーからの報告なし）。

入ったもの：`claude/r38-about` ── **「この言語について」が新しいアカウントで
一生「通信中」だった**（159 の実機で見つかった）。原因は偽サーバーで押して測った
（`docs/scope/r38-about.md`）：この画面が待つ答え（`LPUB`）を書く道は三つ、
書いた後に画面へ知らせるのは二つだけで、行を作る `netLangRow()` ── **新しい
アカウントはそこしか通らない** ── が知らせなかった。答えを記録する一箇所
`wldPubGot()`（`home.js` § LPUB）が新しい答えの時に描くようにし、
`netLangPublic()` にあった描き直しは削除。acct-check 77 が押して測る。
**行が上がらなかった時はまだ丸のまま** ── そこに何を出すかは決まっていない
（`docs/scope/r38-about.md` § オーナーへ）。

## 2026-09-15 ── ビルド 159

`master` = 取り込み後の sha（ゲート緑で ff）。実機で見る場所は
`docs/CHECK-0907.md`「ビルド 159」。**`supabase/schema.sql` は変わっていない**
── 先に流す物は無い。**実機確認は全部まだ**。

入ったもの：`claude/r36-index` ── **自分の言語の一覧はサーバーの答えそのもの**
（「端末で使うものなんかないだろ」「設計ミスなんだから作り直し」OWNER
2026-09-15）。端末の索引 `lingua.langs` は電波なしで眺める写しで、数えず・
決めず・上らない。`netLangsGone(mine, ids)` 一つが、自分の言語も取った言語も
「答えに無い行を端末から落とす」（~~`netTakeGone()`~~ は削除）。`langCount()`／
`langMainId()` は未回答なら `null`、`langStop()` は数を見る前に「接続できません」。
ログアウト→ログインで名前の無い空の `language` 行がサーバーにできていた道
（`langMineIds()` が索引を舐めて `netLangRow()` が insert）は、押して測った赤
（acct-check 74）を見てから直した。`again-check` はその振る舞いを緑にしていた
（直った）。

同じ日、先に master へ：`890d3a75` ── **schema.sql が本物に一回で入る**。
9/13 の貼り付けは一行も入っていなかった（`create or replace view` が列の増えた
`language_seen` を拒み全部取り消し）。ビュー四つは `drop view … cascade` →
`create view` に。`rls-check` は `BASE`（db93b264、本物が持つ一番古い形）を先に
当ててから今の版を当てる。`supabase-deploy.yml`（949399cb）── verify-plan を
GitHub の Actions で置く（オーナーにターミナルは無い）。verify-plan は
2026-09-13 に初めて置かれた。サーバーの名前の無い言語 14 本はオーナーが
2026-09-15 に SQL で消した（人の作った物は無かった：全部 38 字の枠だけ）。

Apple の審査（ビルド 154、2026-09-15）：「column profile.link does not exist」と
登録のエラー ── 両方 schema が入っていなかったことが原因。159 で登録→ログインが
実機で通ってから出し直す。返事はリーダーが書く。

---

## 2026-09-12 ── ビルド 158

`master` = `d390a1bd`、ゲート 44/44 緑、`npm run rls` 372 件緑。ビルドは
2026-09-12 07:26 UTC に出した（`ios-deploy.yml`、master）。実機で見る場所は
`docs/CHECK-0907.md`「ビルド 158」── **`supabase/schema.sql` が変わったので、
先に Dashboard に貼り直し、`verify-plan` を deploy する**（`supabase/setup.md`
§ 8c）。**実機確認は全部まだ**。

入ったもの：`claude/r34-lapse` ── `plan` 表に `was`・`lapse_seen_at`、RPC
`plan_lapse_seen()`、verify-plan は段が下がった時だけ `was` を書き、**書いた後の
行の段を返す**（スタッフの pro が届く。156 から端末に free が届いていた原因）、
`plan_staff_hold()` は `was`・`lapse_seen_at` も落とす、起動のポップ「プランが
終了しました」（☑今後表示しない／閉じる、`#pop`、端末に印は無し）、DATA_MODEL § 5
は「非表示で畳む」に。`claude/r35-main` ── 主言語＝一番古く作った言語
（`language.created_at` の写し `lingua.<id>.made.got`、`langMainId()` 一箇所）、
`langsSeen()` は古い順に天井の数、無料に落ちた瞬間とサインイン直後
（`langForAcct()`）に開くのは主言語、決定ログ 2026-09-12 (g)(h)(i)。
verify-plan の `index.ts` は作業側で走らせていない（Deno 無し）。

## 2026-09-12 ── ビルド 157

`master` = `7ab6d9f7`、ゲート 44/44 緑。ビルドは 2026-09-12 04:23 UTC に出した
（`ios-deploy.yml`、master）。実機で見る場所は `docs/CHECK-0907.md`「ビルド 157」。
**実機確認は全部まだ**。

入ったもの：`claude/r33-owner`（2026-09-12 朝のオーナー決定）── 新しい言語は
38 字の枠で始まる（`ltSlotsFill()` を `langNew()` が段を問わず一度呼ぶ、
`ltStart()` の段の判定はそのまま）、取った言語の答えの写し `lingua.take.<uid>`
（アカウントの鍵、上る道なし、読むのはアカウントの入れ物 `ACCT` 一箇所 ── r79）、段が訊けていない間は
天井が `null` で一覧を畳まない（`langCap()`/`dlCap()`、`langStop()`/`dlStop()` は
数を見る前に段を訊いて「接続できません」）、ja の `g2.g.mood`「命令・条件・可能・
義務・願望」、決定ログ 2026-09-12 の六項。**未**：「プランが終了しました」を
サーバーの答えで出す（plan 表に列 ── SQL）、二本に割れたアカウントを一本に（SQL）。
`plan-check` の「the launch after it asks again」は固定 700ms の待ちで機械が
混むと赤くなる（r33 が「要求を待つ」形に直し中、次のゲートで入る）。

## 2026-09-12 ── ビルド 156

`master` = `2e279fbb`、ゲート 44/44 緑（一回目 0f3fef15 は gramlang・slow が赤 ──
check が消えた道に寄りかかっていた、check 側を直して二回目緑）。ビルドは
2026-09-12 01:17 UTC に出した（`ios-deploy.yml`、master、run 34664377404）。
実機で見る場所は `docs/CHECK-0907.md`「ビルド 156」。**実機確認は全部まだ**。

入ったもの：`claude/r31-server`（「端末は何も決めない」の後半）── 段は
verify-plan の答えをメモリに一つ（`PLAN`／`planGot()`／`planForget()`、
端末の四つの欄と Keychain は読まない・書かない・消さない、DELETE REVIEW は
CHANGELOG 2026-09-11）、「まだ訊けていない」は無料ではない三つ目の状態
（`planKnown()`、押せば「接続できません」、`ltStart()` は書かない、`wsys()` は
列で答える）、誰の言語かは `langWhose()` 一箇所、language の行を写しから作らない、
入り直しは profile の行、名前と @ は profile の行、ブロックは `block` 表・ミュートは `mute` 表
（`ME.bl` は読まない）、起動ごとの `langFirst()` を消した、名詞の章の三行目。
**入っていない**：写しがグローバルの階で上りの道に乗る件（r31 が測っただけ、
`docs/scope/r31-server.md` § リーダーへ）。オーナーの決めごと三つ（「プランが
終了しました」の列、電波なしで取った言語を出すか、持ち主の印の無い古い言語）は
同じ scope § オーナーへ。

## 2026-09-11 夜 ── ビルド 155

`master` = `94bdc5d4`、ゲート 44/44 緑。ビルドは 2026-09-11 21:20 UTC に
オーナーの「出して」で出した（`ios-deploy.yml`、master）。実機で見る場所は
`docs/CHECK-0907.md`「ビルド 155」。**実機確認は全部まだ**。

入ったもの：r16-fix（文法の移行が起動で書いていた）、r17-keep2（保存ボタン
3 画面と「追加」）、r20-book／r23-sec（文法書 9 章＋付録、節が頁）、r24-lang
（扉は送ってから訊く、誰の言語かは `language.owner` だけ、名前と @ の保存、
「言語を追加」がその場でサーバーへ、登録直後のログイン画面）、r26-small（消した
文字の頁、保存した検索）、r27-off（電波なしは「接続できません」、届かない追加は
進まない、アカウント削除で言語の鍵を全部取る）、r28-kb（型で字が載る、KB が
版を持って生まれる）、r30-sns（投稿の @ と #）、r32-gate（check 二本の欠陥）。
決定ログ「端末は何も決めない」(8cb05571)、一覧 `docs/reports/mixed-2026-09-11.md`
（103 件）、その残りは `claude/r31-server` で書き直し中。

## 2026-09-09 ── ビルド 154

`master` = `a223b3ba`、ゲート 43/43 緑（`slow-check` が増えて 43）、`npm run rls`
緑（324 attempts）。ビルド 143（run 34201348003）→ 144（34263543210）→ 145
（34309539693、master `b7f49f60`）→ 146（master `a223b3ba`、オーナーが通過を
確認）。実機で見る場所は `docs/CHECK-0907.md`（143 / 144 / 145・146 の節）。
**実機確認は全部まだ**（headless のみ）。

入ったもの、順に：
- **r6**（143）：投稿画面・プロフィール・キーボードの指摘。
- **r7**（144）：宛先は本文の外の「Replying to @x」行、下書きのポップは popAsk、
  写真 4 枚の帯、お題の札は一つの綴りで保存し表示言語で見せる、link / loc、
  Follows you の位置、フォロワー一覧の永遠くるくる、非公開は `published_at`
  だけ、管理の 7 回タップ、おすすめから返信を除く（`feed_hot`）、起動 8 段 →
  5 段、文法の「この言語について」削除、rls-check の plan の書き換え。
- **r8-server**（145）：「端末に残すものはない」の 9 つ ── 言語の名前は
  `language.name`、済みはサーバーの profile 行（端末は `SET.walked` 一つ）、誰の
  言語かは `language.owner` + `language_take`、投稿の数、フォロー、bio / link /
  loc、下書きは `draft` 表だけ、書記体系は `language.wsys`、設えは
  `profile.prefs`。**SQL の流し直しが要る**（`supabase/setup.md` 2026-09-09）。
- **r8-take**（146）：取った言語が起動で降りてくる（`netLangsWalk` 一本、
  `netTakenDown` は `language_take` の答えが来た時の二つ目の ask）。起動は直列
  4 段。

- **r9-dl**（147）：元が消えた DL 言語は端末からも消える（DELETE REVIEW）、
  非公開は新規 DL を止めるだけ（`language_took()`、SQL）。
- **r10 の七本**（148、master `6d7ad665`）：DL 言語をスライドで返す＋起動の
  二本道を一本に（`r10-dl`）；お題の札は検索の箱も表示言語・@始まりは返信欄・
  Replying to に ×・♡は押した瞬間に点く（`r10-sns`）；名詞クラスの削除・
  否定語の前後・規則の文に条件（`r10-gram`）；空の板は 2 枚のまま、まとめるのは
  id の無い古い板だけ（`r10-kb`）；**運営の復旧 ── 部分ごとに直前 3 版を
  `slice_hist` に残し管理画面から戻す**（`r10-hist`、SQL）；$25 で何人かを
  測った `docs/reports/cost-2026-09-09.md`（`r10-measure`）；保存の写しを
  返さない・送る前は印だけ読む・起動で同じ言語を二度降ろさない（`r10-wire`、
  5,000 語の人の月 335 MB → 139 MB）。ゲートは 44 本。
- **r10-fix**（149、master `00f6a6b9`）：スライドで出るのはメモも切り替えも同じ
  作りの赤い「−」、語順の札は「補語」「比較の相手」。
- **r11-letters**（150、master `e2d1b6ae`、2026-09-10）：148 より前の版が
  残した一覧の行を 148 以降が自分の言語と結び付けられず、切り替えに同じ言語が
  2 行・開いていた方が鍵つき → a–z の穴埋めが走らず保存が黙って止まる、を
  `nidFor` の書き直しで直した（`www/net.js`、`again-check` に 4 claim、
  `docs/CHANGELOG.md` に DELETE REVIEW）。原因は 8 通りの端末状態を 147 と
  149 で流して測った（`docs/scope/r11-letters.md`）。実機は
  `docs/CHECK-0907.md` の 150 節。
- **r12-oneid**（151、master `f11bbb88`、2026-09-10）：「スパゲッティやめろ、
  太い幹を分岐させろ」。言語の番号を一本に ── 端末が uuid を打ち、サーバーの
  行の id もそれ。`sid`・`nidFor`・`nidHolds`・`nidDrop` は削除。古い索引は起動時
  `langsOneId()` が新しい番号へ写す（索引の鍵 `L…` だけ消える ── DELETE REVIEW、
  ディスクの slice 鍵は残る）。検査 8 本が二番号前提だったので直した
  （`r12-fix`：gramlang と slow の種）。実機は `docs/CHECK-0907.md` の 151 節。
- **r13-dup**（152、master `982ae856`、2026-09-10）：「直書きは今直して」。
  `docs/DUPLICATES.md` の開いていた 8 件を一箇所に（`capWarnHTML` `emptyBox`
  `modListHTML` `netPairRow` `netWordRows` `postShrink` `fileInHTML`、`goPlans`
  は削除）。19 は読んで「分かれていてよい」。見た目が変わるのは 2 画面
  （目次の帯、通報の空表示）。実機は `docs/CHECK-0907.md` の 152 節。
- **r14-keep**（153、master `dfdbb77d`、2026-09-10）：「書き換えてもセーブ
  ボタン光らないとこ多いから一本化して」。24 画面を全部押して測り、5 画面
  11 操作が灰のままだった。`keepOn(key, now, save, landed)` ── 画面が「今の
  値」を一つの関数で答え、`keepDirty` 一箇所で開いた時と比べる。`keepPut` と
  glyph の `geKeepPut` は削除、`keepSet` は打った字の置き場（`b.v`）への道
  として残る。`keep-check` は保存ボタンを持つ全画面 × 全変更を画面から取って
  問う。実機は `docs/CHECK-0907.md` の 153 節。
- **r15-letters42**（154、master `23ad34f5`、2026-09-10）：「サーバーの文字は
  増やさないでくれ」。測った：`ltSlotKey()` が `l.ab` で、`ltStart()` が名前で
  「どの枠か」を別々に答え、`ab` の無い文字（音から・一覧から・用紙から）が
  写しの無い端末で 38 対 39 に分かれ、合流が 42 にしていた。`ltSlotKey()` を
  名前で答える一箇所にし、`ltStart()` の名前表・`ltFreeSlot()` の二行・
  `obSlot()` の書き下しを消した。`again-check` に三 claim。見た目：目次に
  k・t・? が枠として並ぶ、課金でその三文字は消せない。`r15-fix`：fixture に
  三十九番目の文字と重なりの面（`ltDraftName` と `.ltdup` が通る）。
  既に二行で載っている言語は BACKLOG。実機は `docs/CHECK-0907.md` の 154 節。
- 待ち：否定の範囲、段の副題 4 本、保存ボタンの
  無い 6 画面をどうするか。次：文法の各段を最初は空に（否定の範囲と同じ枝）。
- `press` の横幅の揺れが 2026-09-09 にも一回（数字の面 406/402、同じコードで
  回し直すと緑）── `docs/BACKLOG.md` の項に足してある。

**決まったこと**（`docs/FEATURE_RULES.md` の決定ログ）：DL は「印」── 複製は
持たず、元が消えれば取った側からも消える（サーバーは cascade で済み、端末の
索引の行を落とすのは DELETE REVIEW 待ち、BACKLOG）。

**待っている判断**：↓ で直接その言語に切り替えるか／元が非公開にした時の
取った側／DL 言語を「返す」道（plus は 1 つなので、返せないと一生埋まる）／
古い `lang` 鍵をいつ読まなくするか。iPhone の通知はリリース後（保留）。

## 2026-09-06 の夜 ── ビルド 140

`master` = `5484f390`、ゲート 41/41 緑、ビルド 140 = run 34055280829。三回目の実機
指摘 22 件（キーボード 8・単語と文法とメモ 7・SNS と設定 6・取り込み 1）が全部
入った。4 枝（`claude/r3-kb` `r3-words` `r3-sns` `r3-import`）を `integ-0905` に
取り込んで ff。

**実機で確認する場所は `docs/CHECK-0907.md`** ── 番号は指摘の番号、画面の言葉
だけ。入らなかったもの・判断待ちは末尾（語順ボードの例文の行は保存前は古い順、
フォロー数は「前の値を見せて差し替え」で頼まれた形と違う、増えたキーボードは
手で消す、左端スワイプの検査の揺れは検査側で直し中）。

ゲートについてもう一つ：**コンテナが再開するとバックグラウンドのゲートは死ぬ**
（この夜 2 回、ログが fast の 124 行で止まった）。Monitor でセッションを起こした
まま回すと通る。

## 2026-09-06 ── ビルド 139

`master` = fd9de7a8、ゲート 41/41、ビルド 139（run 34038446395）。この日に入ったのは
headless の手歩き（記録は枝 `claude/walk` と `claude/walk-words` `-sns` `-kb`
`-gram` `-set` の上の WALK ファイル、`master` には入れていない。バグ 26 件）から
直した 22 件と、
オーナーの決定（上限のポップは一文に統一、未送信の印、保存はサーバーが先、
文法一覧の重複を消す、名前を空にしたら「未設定」、プランが終了しましたの説明文、
案内はキーボード1 を押して開いて戻る）。

**実機で確認する場所は `docs/CHECK-0906.md`** ── 画面の言葉だけで、★ が直した所、
◇ が実機かサーバー越しでしか見られない所。オーナーが確認する。

ゲートについて一つ：**ゲートが走っている間は作業ツリーに取り込まない。**
browser の check は www/ を生で読むので、途中で取り込むと違うコードを検査する
（この日 3 本赤になった原因）。

## 2026-09-05 の夜の状況

**訊く一行**（sha は書かない。一日で古くなる）:

```
git fetch --all --prune && git log --oneline -1 origin/master
```

**master は 2026-09-05 の 45 件を全部持っています。** オーナーが 9/5 の昼から
夜に言った 45 件（`docs/CHANGELOG.md` 2026-09-05 の節が全部）を、リーダーが
場所を指名し、8 本のセッション（opus 5・sonnet 3、`claude/tr g1 k1 c1 n1 q2 m2
u2`）が直して push し、`integ-0905` に取り込み、ゲート 41 本を緑にして master を
二度進めました（`97666ade` → `3ca3049c`）。**ビルドは出していません** ──
「全部入ったら」「朝見てから」。

**全部 CODE CONFIRMED だけです。実機で押したものは一つもありません。** 各件の
スクショは `shots/` の 9/5 分（`git log --diff-filter=A --name-only
f01b483d..origin/master -- shots/`）。

### オーナーが自分で流すもの ── `supabase/schema.sql`、一回

「3sqlはshimaみたいなやつに入れてほしい。1回で全部流すから。」 今日足した分は
三つ、どれも `drop … if exists` → `create` で何度流しても同じ:

- `report_drop(r bigint)`（:1757）── staff が通報を消す。
- `plan_staff_hold()` と `plan` のトリガー（:1957〜）── staff の `plan` は常に `pro`。
- `profile_staff_plan()` と `profile` のトリガー（:1974〜）── staff にした瞬間に
  `plan` の行を `pro` で作る。

流したら `npm run rls` の CASE が増えている分（staff でない B は消せない、
staff の plan は free に戻らない）が実物でも真になります。

### 今日、形が変わったもの ── 索引。中身は CHANGELOG

- **投稿の意味欄は辞書と文法で組む。機械翻訳は無い。** `www/post.js` の `pwMn()`
  → `LinguaGrammarEngine.translate.toNatural(model, line, lang)`。~~`postTr()`~~・
  `TR_SEAM`・`post.tr` は削除。「単語はその単語の意味を 文法は並び替えた単語たち
  が文章として成り立つように。きかいほんやくはつかわない。」
- 文法ページ: 語順は常に出る、規則の画面は「足す文字」と「前後」だけ、時制・相の
  章、規則と例文は一枚。単語に `sub`（下位分類）。
- 通報画面: 誰の投稿を誰が通報したか、投稿を消す／凍結／通報を消す。
- メモは本文一枚、削除は一覧のスワイプ。キーボード編集は保存ボタンが KEEP の道。
- 保存の成功は `back()`。スワイプで戻るは引数の変わった画面でも。

### リーダーのやり方 ── `docs/LEADER.md`

一往復（オーナーの言葉 → リーダーがコードを読んで行まで指名 → セッションは直す
だけ → 15 分）、15 分監査、`create_session` には `source_url` を必ず、sonnet は
この指示の形だと「注入では」と止まるので opus で立てる、`fire_trigger` に `text`
を付けると別のセッションが立つので一通ごとに trigger を作る。全部 9/5 に起きた
ことで、そこに書いてあります。

### まだ直っていないもの ── 9/5 の 45 件の外

- 「文字増殖バグは治ったの？」── 押していないので分かりません。
- 「保存できませんでした」の `save.no`、`syMerge()` の片道、電波の無いときの
  写し ── 9/4 の五つの決定のうち着手していないものはそのまま（下の § 0-a）。

---

## 0-a. 2026-09-04 ── いまの状況

**sha はここに書きません。**一日で古くなります。訊く一行:

```
git fetch --all --prune && git log --oneline -1 origin/master
```

**実機で見ているのはオーナーだけです。**ここに書いてあるものは、断りが無ければ
CODE CONFIRMED だけ。**検査の緑は証拠になりません。**

**出ているビルドの番号もここには書きません。**ワークフローの run number が
唯一の出所で、それは GitHub Actions の履歴にしかなく、このリポジトリからは
読めません（§6）。

### 2026-09-04 の夜に決まったこと ── 五つ。全部が仕様

**オーナーの言葉そのものは `docs/FEATURE_RULES.md` の決定ログの一番上の五件に
あります。ここは索引です。要約で仕事をしないでください。**

1. **「保存されない」は仕様です。**アプリが落ちて消えること、電波が無くて言語が
   開かないこと、送れていない分が次の起動まででなくなること ── 全部です。
   オーナーが自分で読んだうえで決めました。**但し書きとして書かないこと。
   「オーナーに確認が要る」ものではありません。**
2. **ただし「失敗して黙って消える」は仕様ではありません。**保存がサーバーで
   失敗しても、人が作ったものは目の前に残ります。もう一度押せば送れる。
   `saveTry()`（`www/core.js`）が「保存できませんでした」と言い、`LSL`・`WORDS`・
   `LETTERS` はそのまま残ります。
3. **電波が無いときは、前に読み込んだ分を出します。見るだけです。**作れない、
   保存できない。**その写しはサーバーへ戻りません ── 片道です。**理由は
   `syMerge()`（`www/sync.js`）が壊れた写しでサーバーの正しいほうを上書きする
   バグがあったからです（今は `slState()` が壊れと空を分けます）。写しは
   `lingua.<id>.<slice>.got` で、`slGot()` が書き `slRd()` が最後に読み、上り道の
   `slMine()` は読みません（`www/core.js`、CLAUDE.md 規則 22）。
4. **`ONE.md` を消しました。**承認されなかった案です。次の人が仕様として読む
   危険がありました。
5. **オンラインは進める。パッチはオーナーが後で流します。**アプリ側は待ちません。

### 2026-09-04 に書かれたもの ── オンライン一本化。**master に入っています（9/5）**

**訊く一行:**

```
git merge-base --is-ancestor origin/claude/online origin/master && echo IN || echo NOT
```

- **保存を押した瞬間にサーバーへ行きます。**前は起動と扉の二回だけでした
  （~~`netSaveUp()`~~ ── 2026-09-25 から `netSaveNow()`、保存を押した時）。
- **バックアップのファイルが無くなりました。**書く側、読む側、設定の一覧、
  Swift ごと。**`tools/backup-check.mjs` も丸ごと消えました。**
- **言語の写しは iPhone のディスクにありません。**スライスはメモリ（`LSL`）。
  古い鍵はまだ読みます ── 更新した人の言語が空にならないように。
- **アカウントを消したら検索履歴も消えます**（引き継ぎ書六章の1）。手で書いた
  一覧をやめて、数える形にしました。

**四つとも master にあります**（9/5 に取り込み。`git show origin/master:www/core.js | grep SET_PHONE`）。

### ゲートの本数 ── master は41本

**数えました**（`tools/gate.mjs` の `FAST` と `SLOW`）。14 + 27 = 41。
**`backup-check` は無くなりました。**
**本数はここではなく、走らせた最後の行で読んでください。**

### 引き継ぎ書六章の11件 ── 十件は master、一件は枝の上

**確かめたのは「そのコミットが master の先祖か」だけです。押していません。**
実機で見ているのはオーナーだけです。

| 六章の | 何 | どこ |
|---|---|---|
| 0 | 文字の増殖 | **master**（`claude/dup` を `77bba34b` で取り込み） |
| 10 | キーボードの一番下の ＋ | **master**（同じ取り込み、CSS は `6a6056f8`） |
| 1 | アカウントを消したのに検索履歴が残る | **`claude/online` / `claude/rules`。master にはまだありません**（`1e3eed4b`） |
| 2・3・4〜9 | 更新できない、フォロワーの数、実機の写真の六つ | **master**（`claude/tl2`。報告は `docs/reports/tl2-2026-09-04.md`） |
| 6（バッジ） | 相手の画面に有料のバッジが出ない | **アプリ側は済み。サーバーの列がまだで、そこはオーナーが SQL を流すまで動きません** |

**バッジだけがオーナー待ちです。**流す SQL は書けていて、本物の PostgreSQL で
確かめてあります ── `docs/reports/badge-sql-2026-09-04.md`。`profile_seen` と
`post_seen` に「この人はプロか」を出す列一つです。**`supabase/schema.sql` には
まだ入っていません。**

### 2026-09-03 の決定 ── 一日で三つ、どれも仕様

**「1アドレス1アカウント」「これは絶対課金もアカウントごと言語もそう」**
「GoogleとかAppleのログインはあくまでもメアドより楽な手段を増やしてあげるための
手段」「Googleでも同じアカウントならメアドで入っても同じアカウントでログイン
させればいいやろ」 OWNER 2026-09-02。

Apple も Google もメールも、**同じアドレスなら同じアカウントへの三つの入口**です。
OAuth 同士は Supabase が自分で束ねます。束ねられなかったのはメールの道で、
`/auth/v1/signup` が「新しい人を作る」要求だったから ── オーナーが実機で
Google と同じアドレスを打って二つ目のアカウントを立ててしまい、それで見つかりました。
**いまは `/auth/v1/otp`** です（`netMailOtp()`）。あれば入り、無ければ作る。

**扉の道は アドレス → コード → パスワード** です。「普通に6桁のコード打ってから
パスワード要求だろ」OWNER 2026-09-02 ── 引かれているのは順番です。作成の面は
アドレスだけを訊きます。パスワードはコードが通ったあと、再設定と同じ画面で
決めます（見出しだけ道で分かれる ── `OBM.fresh`）。**コードを打つ画面は一枚**
（`obCodeHTML`）。登録の道も再設定の道もそこに来ます。

**コードは8桁、再送信は60秒**「8桁で60秒再送信、有効期限は知らん」OWNER
2026-09-03。**桁数を決めているのはアプリではなく Supabase の設定**です
（`supabase/setup.md` の 8 番）。www/ は桁を一度も数えません ── 数えると同じ
問いを二箇所で答えることになり、設定が動いた日にアプリだけが断ります。
アプリが持っているのは秒のほうだけ。**有効期限はまだ決まっていません。**

**課金は同じ iPhone でも引き継ぎません**（決定ログ `d47a578`）。**入りました**
（2026-09-11、`claude/r18-plan`）── 段はメモリだけで、アカウントが変わる一箇所（`acctFor()`、r79）が忘れる。**印の無い
端末も例外ではありません**「1アカウントに1課金ですけど。他のアカウントについて
くるわけねえだろ」OWNER 2026-09-11。段は設定の預け写しにも乗りません
（`SET_PLAN`）。`acct-check` 40・40b・40c。**実機は未確認**（Keychain の往復は
実機でしか見られません）。

**今は iPhone だけ。**そのあと iPad、Android。

### ログインの決定 ── OWNER 2026-09-03。全部が仕様

1. **1アドレス1アカウント。**「1アドレス1アカウントこれも徹底ね。ルール。」
   Apple の「メールを非公開」は別のアドレスなので**別アカウントで正しい**。
2. **アドレスの大文字小文字は区別しない。**「文字列が同じなら」同じアカウント。
3. メアド・Google・Apple は**同じアドレスなら同じアカウントへの三つの入口**。
4. **Google と Apple で作った人はパスワードが無いのでメアドでは入れない。**
5. **設定からパスワードを付けられる。**「設定からつけれるように。」付ければ
   メアドでも入れる。**新しい道は作らない** ── 既にある「パスワードを忘れた」
   と中身は同じ。
6. **ログアウトしたら前の人のものは何も見えない。**「プライバシー的にもやばい
   だろ」。
7. **ログイン中に別のアカウントには入れない。**先にログアウトが要る。
8. **アカウント削除はサーバーで消し切るまで完了しない。**「削除し切ってないと
   消えない」。途中で切れたら消えていない扱いで、次に開いたとき続きから消す。
9. **同じアカウントで二つから入っていて片方が消したら、もう片方も確実に消える。**
   もう片方はログアウトされ、画面ごと出される。
10. **ネットが無いときはログインできない。**そう出す。

**復旧はバグで消えたときだけ。**「復旧は自分で消した時じゃなくてバグで消えた時
の話な」「バグが多すぎて、セーフティーネットを作らないと炎上するだろ」。
自分で消したものは戻しません。案は `docs/RECOVERY.md`、**残す期間はまだ
オーナーが決めていません。**

### 決定ボタンの決定 ── OWNER 2026-09-03

**「なにもない時は薄い灰色、何か打ったら金にする」「これが決定ボタンのルール」。**
右上の決定ボタンは `navDo()`（`www/shell.js`）が作る一箇所だけ。状態は二つで、
金は `navon` が付いているとき。角も枠も塗りも無く、動くのは文字の色だけです。
`keep-check` が八つの画面で押さえています。

同じボタンが `navdo` `navq navdone` `navq navsave` の三通りに直書きされていて、
三つ目には色の定義が無く、**文字を描く画面の保存だけ一度も光りませんでした。**
「同じボタンは共有して使用すればいいのに直書きで書いてるだろだからこう言うこと
が起きてる」。**他の直書きは `docs/DUPLICATES.md`** ── 食い違っているものが
八件、まだ一致しているものが十二件。**いつ直すかはオーナーの判断待ちです。**

### 2026-09-02 に入ったもの

- **一時間たっても保存が届く。**`netResume()` は起動の一回だけで、アクセス
  トークンは一時間で切れる。開いたままのアプリはサーバーへの書き込みが全部
  黙って落ちていた ── slice も plan も draft も `bad` が空関数。`netSend()` が
  401 で更新して一度だけ投げ直します。段の道と `netSlicePut()` は自前の XHR を
  やめて `netSend()` に乗りました（その二つが線の外にいた）。
  `tools/token-check.mjs`（新）が `XMLHttpRequest` だけを偽物にして持ちます。
- **メール確認の画面に戻ると再送信。**`obCanBack()` が `appIs()==='door'` で
  扉ぜんぶに false を返していて、六桁の画面から降りる道が無かった。
  `obAtDoor()` / `obDoorBack()` が一箇所。`open-check` 2c。
- **1アドレス1アカウント**（上）。`open-check` 2b。
- **言語にアカウントの印。**言語を作る道は全部 `SESS.uid` を押します ──
  `langNew()`、`langForAcct()`、`langSeenAdd()`、`netLangsDown()`、
  ~~`bkRestore()`~~、そして ~~`langMigrate()`~~ は `mig` を通して。印の無い言語を
  自分のものと答えるのはオンボーディングの歩きの途中（`SET.done` が偽）だけで、
  扉を出た `obFinish()` がそこで印を付けます。どの iPhone かを憶える仕掛けはありません。
- **Keychain。**読めなかった Keychain に段を書きません。`Transaction.updates` は
  届いた取引が終わり（返金・過ぎた失効日）を言った時だけ下げます ── 更新も
  家族の購入も同じ口に届くので、権利一覧が追いつく前に払ったばかりの人の段が
  消えていました。`isUpgraded` は除きます（格上げは失効日が過去になる）。

### 2026-09-03 に入ったもの

**ビルドに乗ったかは Actions の履歴を見ること。**このリポジトリからは読めません。

- **`shell.js` が読み込みの途中で止まる欠陥。**`migratePos()` は `save()` を
  呼び、`save()` は `www/backup.js` の `bkTouch()` で始まり、`backup.js` は
  `shell.js` より**後**に読まれます。だから古い品詞ラベルを一つでも持っている
  iPhone では、`shell.js` がその行で投げて**その下の定義が全部消えました。**
  画面には何も出ません。呼ぶ場所を `www/boot.js` へ移しました ── boot.js は
  最後に読まれ、移行を走らせるためだけにあります。定義は `shell.js` のままです。
- **アカウント削除が平キー八つも消す。**`LS_FLAT` は言語に id が無かった頃の
  八つ（`lingua.words` `lines` `lang` `script` `letters` `notes` `phases`
  `talk`）で、~~`langMigrate()`~~ がそこから言語へ写し、`lsWipeAcct()` が
  アカウントと一緒に持っていきます。**一箇所に書いて二つが読む**ので、
  片方だけ足すことができません。
- **全角 ＠ で人が検索できる。**`netHandleOf()` が落とすのは `/^[@＠]+/` で、
  U+FF20 も落ちます。日本語キーボードが出すのは全角のほうで、
  `handle.ilike.*＠aya*` は `^[a-z0-9_]{2,24}$` に絶対当たりませんでした。
  **同じ苦情が二度来て初めて検査が付きました** ── `tools/find-check.mjs`。
- **検索の履歴 五件。**`SNS_RECENT=5`、サーバーの `recent_search` が記録で
  `SET.recent` が写し。**入る道は `snsGo()` の一本だけ**で、🔍 を押した時だけ
  入ります ── `snsSetQ()` は一文字ごとに走るので、そこから書くと
  「a」「ay」「aya」が三件になります。一件ずつ消せます（`snsDropRecent()`）。
  ★（`saved_search`）とは別のテーブルで、混ぜてはいけません。
- **一行の欄で Enter が効かない。**`www/act.js` の一箇所だけが言います。
  markup には `on*=` を書かないので（規則 3）、Enter は前からこのアプリのもの
  でした。
- **戻るスワイプは、後ろに画面があるときだけ。**`navBackTo()` が `NAV` の
  最後から二つ目を答え、`swPrev()` はそれと `NAVBK` が指す画面が一致したときだけ
  絵を返します。タブを押すと `NAV` は捨てられるので、タブの画面には後ろが
  ありません。
- **~~`lsWipeNS()`~~ と ~~`netMember()`~~ が消えました。**前者は `lingua.` で始まる
  キーを全部持っていく関数で、**別アカウントの言語まで消していました。**
  後者は §3 に書いてある通りです。
- **`admin` は `handle = 'lingua'` で決まります。**handle を書いてある所は
  `supabase/schema.sql` の `profile_admin()` 一つで、`is_admin()` もアプリの読み（`select=handle,admin:profile_admin`）もそれを訊きます。
  `profile.admin` の列は落としていませんが、誰が上かを決めるのは handle です。
- **おすすめの刻みは 4 時間・太平洋時間**（`supabase/schema.sql`、
  `now() at time zone 'America/Los_Angeles'` を4時間で切り下げる）。


- **パスワードの画面からアプリに入れる**（`db40b2e`）。六桁はセッションを取る
  ために使われるので、そこに立つ人は既にサインイン済み。`netSetPass()` が
  通らないと閉め出された形で止まっていました。
- **カードの共有**（`d09cc16`）。`navigator.share` も `<a download>` も
  WKWebView では落ちるのに、必ず「保存しました」と出ていました。ネイティブに
  PNG を書かせて `LinguaShare.shareFile` に渡します（手書き用紙の PDF と同じ道）。
  **うまくいったときは何も言いません** ── シートが開いたことが答えで、そのあと
  保存するか送るかキャンセルするかは分からないので。
- **値段と、買った直後の一言**（`e5a10cc`）。値段の問い合わせに 25 秒の上限が
  付き、値段の場所に状態が出ます ── 打ち込みの `$99.99` が出続けていたのは、
  返事が来ないと印が立ったままで二度と訊き直さなかったから。買った直後の一言は
  「押したもの」を言います（`r.bought`）。持っている一番上の段ではありません。

### 走っているセッション ── 2026-09-03

`claude/rc`（RevenueCat、公開キー待ち）が未取り込み。
保存のポップは決定だけあって未着手です（決定ログ `9bbd83d3`）。

**この二行を信じないでください。**枝が取り込まれているかは名前からもこの行
からも推測せず、訊くこと ── この段落は半日で二度変わりました:

```
git merge-base --is-ancestor origin/<枝> origin/master && echo IN || echo NOT
```

### まだ直っていないと分かっているもの

- **キーボードの設定に飛ばない。**オーナーが実機で見つけたもの。
  `kbSettings()`（`www/keyboard.js`）が `LinguaShare.settings` を呼び、
  ネイティブは `UIApplication.openSettingsURLString` を開きます。橋が無いときに
  無言で終わる枝があります。**どこで止まっているかは押さないと分かりません。**
  押せるのはオーナーだけです。原因を並べるのは直すことではありません。
- ~~アプリはレシート無しで自分の行に `pro` を書ける。~~ **閉じました
  （2026-09-06）。** `plan` と `purchase` は API からは読むだけで、書くのは
  `supabase/functions/verify-plan` が service role で。端末が送るのは Apple が
  署名した取引です。**オーナーの側で函数の deploy と `APPLE_ROOT_CA_G3` が要り
  ます**（`supabase/setup.md` § 8b）。それまでは誰にも段が付きません。

### オーナーの側に残っているもの ── 2026-09-03 現在

**下の六つは一つもこのリポジトリから見えません。**Supabase と App Store
Connect と DNS のダッシュボードの話なので、**済んだかどうかはオーナーに
訊くしかありません。**ここに「済み」と書けるのは、オーナーがそう言った日と
一緒だけです。

1. **`supabase/schema.sql` をダッシュボードに流す**（`supabase/setup.md` § 2）。
   流すまで、人の言語のページで単語と文法の ↓ を押しても何も落ちてきません。
2. **メールの送信設定と DNS**（`supabase/mail.md`）。**これが先です** ── 六桁が
   飛ばないと審査用のデモアカウントも作れません。
3. **審査用のデモアカウント。**扉を通らないと何もできないので、審査員が入れ
   なければ即リジェクト。`natsuaya82+demo@gmail.com` のように自分のアカウントと
   分けること（審査員にパスワードを渡すため）。言語一つ、文字を何個か、投稿を
   二つ三つ入れておくこと。
4. **Supabase の Authentication → Sessions の二つの値**を見て
   `supabase/setup.md` に書く。「久しぶりに開いたらサインアウトされるか」に
   このリポジトリは答えを持っていません。
5. ウィジェットのプロビジョニングプロファイル、Apple / Google サインインが ON か、
   スタッフと admin、請求の上限 ── `docs/apple.md` § 4、`supabase/setup.md` § 4 § 5 § 6。

## 0. ずっと効いている決めごと

**役割。**取り込むのは**サブリーダー①**（OWNER「取り込むのはサブリね？」）。
そのままゲートもそこで回します。**リーダーは配ってビルドを引くだけで、
取り込まず、ゲートを回さず、コードを書きません**（OWNER「君が作業するんじゃ
なよね？」）。`docs/SESSIONS.md` と `CLAUDE.md` が本体です。

コードを読んで分かっていて、まだ直っていないもの:

| 何 | 分かったこと | どこ |
|---|---|---|
| 今日のお題の日付 | `netDay()` が `order=on_day.desc&limit=1` と訊いていて、**今日を訊いていない。**古い行が一つあれば、それが永久に「今日」として出ます。`on_day` はどこにも描かれません | `www/net.js` `netDay()` |

**オーナーは iPhone SE2 と iPhone 17 で実機確認しています。**OWNER 2026-08-28
「iPhone se2と17で作業してる」。**一番狭い iPhone と一番広い iPhone の両方**なので、
画面の話はその二つで成り立つかを考えること ── `press` が測っているのは 402pt の
一台だけで、SE2 の 320pt はそこに入っていません。

**でんわ、という語を使わないこと。iPhone と書く。**二度言われた。二度目は
「使うなって言ってんだから使うな」。報告でも、コメントでも、画面の文字でも、docs でも。
**リポジトリ全体で 0 件にしてある。増やさないこと。**

**そして「端末ごと」という単位も使わないこと。**「端末という単位は使わない。全部
アカウントごと」OWNER 2026-09-03。持ち物は全部アカウントのもので、iPhone は窓です。
一台を指して言う必要があるときだけ iPhone と書く。

**そして、オーナーが言っていないものを「」で囲まないこと。**一度目のとき、その語を
7行だけ残した ── 理由は「オーナーの原文だから」だった。**そんな発言は無かった。**
私たちが書いた地の文に括弧を付けていただけで、オーナーに「言ってねえよ」と言われた。
**括弧の中はオーナーが実際に言った言葉だけ。**それ以外は地の文で書く。

---

## 1. `master` is the app again. Keep it that way.

A fresh clone of `master` is the current app. **No sha is written here** — a sha
has a shelf life of about a day.

How many checks the gate has is `FAST` and `SLOW` in `tools/gate.mjs`, and the
last line `npm test` prints — the only place the number lives.

**Never write "the gate is green" here unless you watched it go green.** A
sentence in this file claiming a green nobody saw is the failure this file
exists to prevent. The gate is run once, by whoever integrates, after
integrating.

**Never name a branch or a sha here.** Both have a shelf life of about a day.
Which branches are in is a command, not a sentence:

```
for b in $(git branch -r | grep -v HEAD); do \
  git merge-base --is-ancestor $b origin/master && echo "$b"; done
```

**A branch being an ancestor and a branch being finished are different facts.**

Before deciding anything is missing:

```
git fetch --all --prune                      # ALL of it, not just master
git branch -r                                # what actually exists
for b in $(git branch -r | grep -v HEAD); do \
  echo "$b +$(git rev-list --count origin/master..$b)"; done
```

**Before believing any of that: `git branch -r` can be lying, and on a fresh
clone it usually is.** The `git clone --depth 1` that `add_repo` tells a
session to run leaves a fetch refspec that names ONE branch:

```
git config --get-all remote.origin.fetch
  → +refs/heads/master:refs/remotes/origin/master      # master, and nothing else
```

With that in place `git fetch --all --prune` brings back master and nothing
else, and `git branch -r` prints `origin/master` alone — **and that looks
exactly like a remote with one branch on it.** The repair, which every session
should run before the three lines below:

```
git config --unset-all remote.origin.fetch
git config --add remote.origin.fetch '+refs/heads/*:refs/remotes/origin/*'
git fetch --all --prune
git ls-remote origin | wc -l        # the remote's own answer, not the clone's
```

**`--all`, and `git branch -r`, are the point.** Comparing HEAD against
`origin/master` alone cannot see `master` itself being the stale thing. **Two
zeros against `master` prove you match `master`. They prove nothing about
whether `master` is the app.**

If a branch is ahead of `master`, find out why before writing a line, and say
so to whoever is running it — a number here is the difference between "not
built" and "not fetched".

The branch has only ever been ahead of `master` in a straight line, never
beside it, so bringing `master` up is a fast-forward and cannot conflict.
Pushing to `master` is the owner's call and is asked for each time.

---

## 2. What is built and works

- **The free plan, whole.** Thirty-eight letters — `a`–`z`, `!`, `?` and a
  digit for every value of the base — your own shapes on them, the dictionary,
  the grammar stages, the notebook. (Twenty-eight is what it was before the
  free plan got its own digits; measured on a fresh free language it is 38.) `CLAUDE.md`
  → "What the free plan is" is the specification and is current.
- **The system keyboard**, `ios/App/LinguaKeyboard/` — six Swift files. It is
  built, it is on TestFlight, and a person has typed their own letters on it on
  a real phone. App Group `group.com.tokinets.lingua`; appId
  `com.tokinets.lingua`.
- **The hand-over from app to keyboard**, `www/share.js` (chapter 23) — the
  keys with the shapes already cut onto them. The call is
  `Capacitor.nativePromise('LinguaShare','write',…)` and **not**
  `Capacitor.Plugins.*`; `docs/keyboard-extension.md` says why, and it cost four
  builds to learn.
- **Accounts.** Sign up, sign in, verify, sign out, password reset, and a
  profile with a handle. `www/net.js`.
- **The onboarding, in the owner's order** 「オンボーディング→最後にログイン」.
  Draw one letter, be walked through the app, see the timeline, name the
  language, **then** the door — `OB_DRAW`, `OB_SNS`, `OB_NAME`, `OB_IN` in
  `www/onboard.js`, with `OB_TOUR` outside the counted range because the walk
  is not a screen of that file. There is no way past the door: 「あとで」 went
  on 2026-08-26 and stayed gone. What the walk made before the account existed
  goes to the server as the session arrives — `netTook()` (`www/net.js`) sends
  first and only then asks what the account has.

  **`open-check` is what holds the order.** It boots from an empty
  `localStorage` and reads `#app` rather than asking `appIs()`, because
  `appIs()` can answer correctly while the screen is wrong. **Four** states,
  four screens: new phone → the onboarding; part-way through the walk → the app
  dimmed with one thing lit; finished then signed out → the door; finished and
  signed in → the app.

  `appIs()` answers `'app'` for the walk before it asks about the session — the
  walk IS the app. Without that, a new phone draws its first letter, presses
  done, and is shown the door. `obTourOn()` is
  `!SET.done && ob.step===OB_TOUR`, false for every finished phone.

## 3. What is NOT built, however much it looks like it is

**The timeline is on the server.** Re-check rather than believe:

```
grep -n "rest/v1" www/net.js          # what the app actually asks the server for
```

Run it rather than trusting a list here; on 2026-09-25 it named `profile`, `post`,
`react`, `report`, `draft`, `saved_search`, `recent_search`, `post_seen`,
`profile_seen`, `follow_seen`, `block_seen`, `mute_seen`, `language_seen`,
`language_take`, `prompt`, `language`, `slice`, `plan`, `device`, `feedback`,
`promo` and the RPCs. `netPush()` sends a post — its photographs and its voice with it, through
`netUpPics()` and `netUpVoice()` into the `post-media` bucket — `netFeed()`
reads the two timelines, `netNotices()` reads the notices, `netDraftUp()` sends
a draft, `netSaveNow()` sends a slice when Save is pressed, and `netLangSync()`
puts a whole language up at the door (`netTook()`) and when one is made
(`langNew()`). ~~`postCatchUp()`~~ is gone. **`lingua.posts` is a
copy and not a home**: the phone keeps what works with no signal.

**An account is required to read the timeline or post to it**, decided
2026-08-18 and held by `post-check`. `vFeed`/`vExplore`/`vNotif` answer with the
app's own door when there is no session.

**There is one kind of account and there are no anonymous ones**
「匿名アカウントはねえよ」. **There is one question and it is `netSignedIn()`.**
~~`netMember()`~~ was the second one — a session that also carries a name — and with
no anonymous accounts it could never answer no, so it was a true question with
nothing left to ask. It and ~~`netAnonTok()`~~ are **deleted**, and every one of the
twenty-eight callers asks `netSignedIn()`. Do not put either back; the comment
above `netOut()` in `www/net.js` says why at length.

There is no ~~`netAnon()`~~ either — the comment where it stood says so — and
`supabase/schema.sql` **drops** ~~`has_account()`~~
(`drop function if exists has_account()`), so every policy that used to ask it
asks `is_member()` now.

**OWNER DECISION 2026-08-26**, and it settles what the paragraph above was
groping at:

```
  基本は全部サーバー管理  言語周りだけバックアップに file 使う
  制作はオフラインでも可能  次つながった時に更新される
  言語はアカウントないと作れないです
  SNS部分はオフラインでは動かないよ　そりゃそう
  アカウント消したら残るわけがない
```

**Two lines of that block were replaced on 2026-09-04 and the rest stands.**
「言語周りだけバックアップに file 使う」 — there is no file: `www/backup.js` is
one function now (`bkTouch`), and the writing, the three generations, the list
on the settings screen and the Swift behind it are deleted. 「制作はオフライン
でも可能　次つながった時に更新される」 — making and saving need a signal, and a
save reaches the server when Save is pressed 「保存を押したら」 OWNER 2026-09-24. With no signal what the app shows
is what was loaded before, to look at (`CLAUDE.md` rule 22). **What still
stands:** always in sync, on every plan; **making a language still needs an
account**; deleting the account takes the languages with it; the SNS side does
not work offline. The newer decisions are in `docs/FEATURE_RULES.md` under
「オンライン前提に切り替える」 and 「電波が無いときは、前に読み込んだ分を出す。
見るだけ」.

**`language` and `slice` are written and read.** **Count it rather than believe
it:**

```
grep -o "rest/v1/[a-z_]*" www/net.js | sort | uniq -c | sort -rn
```

On 2026-09-03 that answers: `profile` 13, `rpc` 12, `language` 8, `follow` 4,
`draft` 4, `saved_search` 3, `report` 3, `recent_search` 3, `react` 3,
`post_seen` 3, `post` 3, `block` 3, `slice` 2, `prompt` 2, `plan` 2,
`profile_seen` 1, `language_seen` 1 — and the twelve `rpc` are `account_ban`
`account_delete` `account_unban` `admin_counts` `email_taken` `feed_fo`
`feed_hot` `notices` `post_hide` `post_show` `staff_add` `staff_drop`.
`netLangSync()` is the door's (`netTook()`) and a new language's (`langNew()`), not the launch's, and `syMerge()`
(`www/sync.js` ch 26) is what puts two copies together by adding both.

**Still unused: `quote` and `publication`. Those two, and nothing else.**

**`prompt` is used now**, from 2026-08-23: the day's sentence stands at the top
of the timeline and the composer opens with it already in the meaning, where it
cannot be edited. `post.prompt` — a column that had been written and never
filled — is what says which day a post answers. The app side is in; **the
server side is not**, and until somebody does `supabase/setup.md` § 9 (a Gemini
key, the `daily-prompt` function, a cron line) there is no row for today and the
top of the timeline is the plain write-row it has always been. That is the
degrade, and it is deliberate: no half-working screen.

**The online half was redesigned on 2026-08-22 and settled on 2026-08-26.**
Everything belongs to the account, and **the server is where things live — the
timeline and the language both.** The entries at the head of
`docs/FEATURE_RULES.md` § Owner decision log say it.

Order, and where it stands:

1. **One kind of account — done.** There are no anonymous ones
   「匿名アカウントはねえよ」. `netSignedIn()` is the one question, and
   `obNeed()` asks it at the six things other people would see — a post, a
   like, a boost, a report, a follow, a block.
   The door is the LAST step of the onboarding and there is no way past it.
   Held by `open-check` and by `migrate-check` case 7.
2. **`is_member()` is the one question — done.** ~~`has_account()`~~ is dropped in
   `schema.sql`, and the `language` write policies that used to ask it ask
   `is_member()`. `language.owner` points at `auth.users` rather than
   `profile`. Held by `npm run rls`.
3. **The language living on the server — done.** `language` holds the name,
   the licence, the date and `published_at`; **`slice` holds every slice of
   it**, one row per slice of `SLICES`, carrying exactly the string
   `localStorage` holds. `netLangRow()` makes the row, `netSlicePut()` upserts
   a slice, `netSlices()` reads them back, and `netLangSync()` — the door's (`netTook()`) and a new
   language's (`langNew()`) — puts the two copies together through `syMerge()`,
   which adds both sides and lets neither win by being newer.
4. **The plan — on the account, done.** OWNER 2026-09-01: 「課金とアカウントと
   キーボードはアカウントに結びつく」. It is **its own table and not a column on
   `profile`** — `plan` in `supabase/schema.sql`, one row per uid.
   **The server writes it and nobody else can.** `plan` and `purchase` are
   read-only through the API; `supabase/functions/verify-plan` reads Apple's
   signature off the transactions the phone sends and writes the row with the
   service role. On the device the plan is memory only and the account's
   settings are written under its uid (`lingua.set.<uid>`, r79), so signing in
   as somebody else does not inherit a plan.

   **The receipt IS checked, since 2026-09-06.** 「アカウントごとなんだから、
   違うアカウントで復元できるのおかしいだろ。検証して」 OWNER 2026-09-06 — a
   purchase carries `appAccountToken`, the function refuses it for any other
   account, and `purchase` records the binding. **Not confirmed on a device**,
   and it needs the owner to deploy the function and set `APPLE_ROOT_CA_G3`
   (`supabase/setup.md` § 8b); until then nobody gets a plan at all.
5. The rest of moderation — **the tombstone in a thread (`postTomb()`), the
   notices (`vNotif`), the frozen state and the ⋯ on a profile (`whoMore()`,
   `www/me.js`) are in.
6. Terms and privacy: `DOC_TERMS` / `DOC_PRIVACY` in `www/settings.js`, drawn by
   `docRows()` on the plans page (`planTerms()`) and on the onboarding's sign-up face.
7. What a purchase OPENS. StoreKit is **written** ── `ios/App/App/LinguaStore.swift`,
   `www/store.js`, and `plBuy()` in `www/settings.js` is `storeBuy`'s one caller.
   The plan is the server's answer: `verify-plan` checks Apple's signature on
   the receipt (item 4).

**Everything still to do that needs the server is one list**, in
`docs/FEATURES.md` → "What is left to do online": the plan (the one with money
on it), cloud storage, publishing a language, quoting, the day's sentence, and
push. Read that before starting anything online. Blocking, reporting, reading
the reports, taking a post down, ejecting somebody and deleting an account are
all done — both halves of what App Store guideline 1.2 asks for.

**Somebody has to be made staff before any of it is reachable.** One SQL line
in the Supabase dashboard, `supabase/setup.md` § 5. Nothing in the app grants
it and nothing is meant to.

**Apple sign-in and Google sign-in are both wired, on both sides.**
The buttons went from "not in this build" to a real plugin —
`@capgo/capacitor-social-login`, both providers, Facebook and X switched off in
`capacitor.config.json` so their SDKs are never linked.

- **Apple: done.** `com.apple.developer.applesignin` is in
  `ios/App/App/App.entitlements`, and the owner reports the App ID capability
  and the regenerated profile done (2026-08-27).
- **Google: done, and DEVICE CONFIRMED 2026-09-01.** The owner pressed it on
  build #107: 何も出ません押したら普通にログインされるけど？ The sheet opens and
  comes back with a session. `GOOGLE_IOS_ID` in `www/net.js` and the reversed
  scheme in `Info.plist`'s `CFBundleURLTypes` are the same client id, the
  Supabase provider is on, and neither value is a secret: the id names the app
  and proves nothing.

  **The nonce question is closed, and the answer is: send none.** It was open
  because `www/onboard.js`'s comment argues it from APPLE's behaviour, and
  nobody had checked that Google's SDK behaves the same. It does —
  `@capgo/capacitor-social-login` 8.4.4 only puts a nonce in the request when
  it is handed one, so with `netIdToken(who, tok, '', …)` both sides stay
  quiet and Supabase's 「Passed nonce and nonce in id_token should either both
  exist or not」 never fires. `netIdWhy()` stays: it costs nothing and it is
  the only thing that could name the side if this ever comes back.

**What this file cannot see.** App Store Connect, the Apple developer site,
Google Cloud and the Supabase dashboard are outside the repository. Where a
line above says one of those is done, it is because the OWNER said so, on the
date given — it is not something anybody verified from here, and it must not be
written as though it were. Read `git grep` for the repo side; ask for the rest.

**StoreKit is written, and has never run on a device.** `LinguaStore.swift`
holds the four products, `www/store.js` is the only thing in `www/` that talks
to it, and `plBuy()` in `www/settings.js` is `storeBuy`'s one caller. The owner
reports the four subscription products made in App Store Connect (2026-08-27) —
which this repository cannot see. Asking for a product that does not exist is
not an error: StoreKit returns nothing for it, so a missing product looks
exactly like a button that does nothing. That is what to expect if a purchase
does not start. The plan itself is not on the phone at all: it is
`verify-plan`'s answer, held in memory (`PLAN`, `www/core.js`).

**No landing page in this repository.** `vercel.json` copies `www/` into
`public/` and serves the app itself as a static site. There is no marketing
page, no separate site, and no `/lp` anywhere. Anything of that kind is a new
thing, not an edit to an existing one.

## 4. What is not the repository's to hold, and never will be

Things only a person with a browser and a login can do. Each has a file that
says exactly what to click, because that is the only form they can take here.
**The last row is different in kind: it is not a click but a decision, and § 4a
below is where those wait.**

| what | where it is written | who does it |
|---|---|---|
| Everything in the Supabase dashboard, in order, and how to tell whether it worked | `supabase/setup.md` | the account owner |
| The confirmation and reset mail — SMTP fields, DNS records, templates | `supabase/mail.md` | the account owner, in the Supabase and Resend dashboards |
| TestFlight, the two subscriptions, certificates and profiles | `docs/apple.md` | the account owner, in App Store Connect and the Apple developer site |
| The GitHub Secrets the iOS build reads | `.github/workflows/ios-deploy.yml` names them | the account owner, in the GitHub UI |
| **The decisions themselves — what only the owner can settle** | **§ 4a below** | **the account owner** |

**No agent can write a GitHub Secret**, so a build failing on a missing one is
never something to fix in the repository.

**The `service_role` key must never appear here, and does not.** The key in
`www/net.js` is the *publishable* key, which is public by design and is meant to
sit in a phone. Passwords are never held, stored or logged by the app: the field
goes to Supabase over TLS and only the token pair is kept, in `localStorage`
under `lingua.sess`.

## 4a. オーナーが決めること ── いま待っているもの（2026-09-25 に全部書き直した）

**ここは「まだ答えの出ていない問い」だけを置く。**答えが出たら、この節から消して
`docs/FEATURE_RULES.md` の決定ログに「決まったこと」として書く。答えの出た問いをここに
残さない（2026-09-25 オーナー「質問混ざらないように記載自体も全部新しいのにかえろよ」）。
9月上旬からここにあった問いのうち、版の積み方（言語まるごと・3つ前まで）、戻し方（まるごと）、
保存の時（保存を押したら）は 2026-09-24 の決定ログで答えが出たので消した。

### 今日（9/24〜25）の作業から出て、まだ訊いていないもの
1. **キーボードのプラン（r46 の決定の残り）** ── 無料で使える「既存の文字」の範囲（ラテン文字と記号だけか、
   発音記号も入るか）。Pro のフォント書き出しの形式（OTF か）と取り出し方（iPhone の共有画面か）。
   今 Plus で4つ作っている人・課金している人への見せ方。
2. **アカウント削除でサーバーに残る物** ── 投稿の通報の記録・公開の記録・問い合わせは、名前だけ外れて行が残る。
   投稿に付けた写真と声のファイルもサーバーに残る。全部消すか。（スマホに残る物は 9/25 の決定で消すことになった）
3. **音を選ぶ所の、横にスクロールする丸いボタンの列** ── 一覧の形に直すか。

### 9月上旬から残っていて、今のコードで測り直してから訊くもの
4. **消えるのを防ぐ「小さくなったら書かない」守り** ── 版が3つ前まで残るようになったら外してよいか。
5. **一度も触っていない設定** ── 既定の値を「その人の答え」として書くか、空のままにするか。
6. **★を50件より多く付けている人** ── 51件目より古い★が画面から消え、続きへ行く道が無い。
7. **まれに起きる二つ** ── 検索の履歴が一つ消えることがある／同じ言語が一覧に二つ並ぶことがある。

## 4b. More than one session at a time

**The page to hand a session is `docs/SESSIONS.md`.** The rule that prevents a
collision rather than finding one is in it: the leader — another session above
this one — names the files a session owns, and a session edits nothing else. `www/index.html` holds every screen's
CSS and is where sessions collide first — one session at a time owns it.

Sessions run in separate containers and share exactly one thing: the remote.
Everything below is about making work visible there early enough to be avoided.
The body is in `docs/FEATURE_RULES.md` § several sessions at once.

```
  one session, one branch          claude/<area>, never anybody else's
  fetch before deciding            git fetch --all --prune
  read before changing a file      git log --oneline --all -- <file>
  push the scope FIRST             before the first line of code
  push after every commit          a branch nobody can see cannot be avoided
  never integrate                  no merge, no rebase, no cherry-pick of
                                   another branch -- the leader does that
```

A commit on a file from a branch that is not yours means another session is in
that file. Stop and report there, not when a merge fails.

**The split is by FILE, not by feature.** That is the only split that prevents
a collision. Not one file may appear in two sessions' lists — and when a feature
wants both markup and CSS, the feature is split to fit the file ownership rather
than the other way round. `www/index.html` goes to exactly one session; everyone
else writes the line they need in the commit body and the leader carries it
across.

**Who the sessions are is not written here.** A session list has the same shelf
life as a branch name.

**Three things about this environment, all measured:**

- **A leader can only speak at birth.** `ListAgents` returns nobody and
  `SendMessage` reaches nobody — sessions are separate containers. The whole
  instruction has to be in `create_session`'s prompt. There is no "I will tell
  them later".
- **The reverse direction works, and it is git.** So every session is told, in
  the hard half of its instructions: *what is unfinished, what you are stuck
  on, and where the leader was wrong go in the COMMIT BODY, not in chat.*
- **The session tools come and go.** `create_session` / `archive_session`
  resolved under `mcp__bf7c680d-…__` and, for one call each, under
  `mcp__Claude_Code_Remote__`; the second name stopped resolving mid-session
  with the first still working. **Archive while the tool answers.** If it stops
  answering, only the owner can close a session.

## 5. The gate, and what CI does not run

`npm test` is the specification. `CLAUDE.md` → "The rules the gate enforces"
-- **and those two numbers are not the same kind of thing.** One counts RULES
that are written down; this one counts CHECKS that run. They have never been
equal and making them equal would be wrong: one rule can take three checks and
one check can hold two rules.

**How many checks there are is printed on the run's last line. Read it there.**

`tools/gate.mjs` runs the ones that need no browser first, in about two seconds,
then the browser ones four at a time (`WIDE` is `min(4, cpus)`). Run one after
another they were about ten minutes in this container, which is a figure nobody
has re-measured since the count grew.

**It is run once before pushing**, not once per commit — the owner's rule, and
`docs/TESTING.md` has all three. While working, run the one check that holds
what you are changing, by name, plus the fast ones (`FAST`).

**GitHub Actions runs three of them** — `assets`, `es5`, `i18n`
(`.github/workflows/i18n.yml`). A green tick on a push does not mean the gate
passed. **The other thirty-two run only where somebody runs them**, which means
locally, which means you.

The names are deliberately not listed here. A list of thirty-two check names is
a list that goes stale the next time one is added, and this file has been wrong
about that list twice. The command:

```
node -e "const s=require('fs').readFileSync('tools/gate.mjs','utf8');
  for(const m of s.matchAll(/const (FAST|SLOW) = \[([^\]]*)\]/g))
    console.log(m[1], m[2].split(',').length)"
```

**Every browser check loads Chromium through `loadChromium()`**, which falls
back to a global playwright install. A check that writes
`import { chromium } from 'playwright'` instead dies at module load on any
machine without playwright in `node_modules` — and since `npm test` chains on
`&&`, everything after it silently never runs. **A check nobody can run is a
check that is not in the gate.**

`npm run rls` is not in `npm test` at all: it stands up a real PostgreSQL.
Run it whenever `supabase/schema.sql` changes, which is the only time it can
start failing.

## 6. Builds

`.github/workflows/ios-deploy.yml`, on `workflow_dispatch` or a `build-*` tag.
It runs on `macos-latest` and takes about three minutes — the app is a WebView
and the archive is small.

**Do not start one without being asked.** This is a standing instruction from
the owner of the repository, not a suggestion, and it has been said more than
once.

Build numbers are the workflow's **run numbers** (`github.run_number`), and
that matters more than it looks: the `build-*` tag is a trigger and a record,
never the source of the number. A `workflow_dispatch` run gets a build number
exactly the same way.

**Which build is the latest is not written here, and cannot be.** The number is
the workflow's run number, it lives in the Actions tab, and no session can read
it. Ask, or open the Actions tab.

`workflow_dispatch` is what gets used; the tag is a record, not the trigger.

**A green tick is not a delivery.** The workflow passes
`wait-for-processing: false`, so it goes green the moment the bytes are
accepted and never waits for Apple to process them. Build 86 went green and
was refused an hour later **by email** (`ITMS-90158`) — the only failure here
that does not arrive as a red tick. The upload step's own log is the thing to
read: `Finished uploading build chunks` / `Marked build upload as complete;
waiting for processing` means the bytes arrived and nothing more.

**A tag cannot be pushed from a Claude Code session.** Measured 2026-08-25:
`git push origin build-25` returns HTTP 403 while a branch push to the same
remote succeeds, because the session's git credentials are scoped to
`refs/heads/*`. This is not a network fault and retrying does not help. Use
`workflow_dispatch`; if the tag is wanted as a record, a person pushes it.

iOS work beyond triggering that workflow — opening the project, running on a
simulator, `npx cap sync ios` — needs a Mac with Xcode and cannot be done from
a Linux session.

---

## 7. What is next

Ordered by what blocks shipping. Anything not on this
list has either been done or was never agreed to — check `git log` before
assuming a thing is waiting for you.

### Dug out of the code, and still open

- **「今日のお題」is not a bug in the day feature.** The mechanism is entirely
  intact — `dayRow()` puts it at the top of the feed, `openPost('day')` carries
  it into the composer, `PW.pr` pins the answer to it so it cannot be edited
  away. What is missing is the row. `schema.sql` says the day's sentence *can
  only come from the service role*, and `prompt` has `on_day date not null
  unique` — **somebody puts one in from the dashboard, one per day**, and
  nobody has. That part is the owner's, like the rest of §7's Supabase work.
  **But two real bugs sit beside it**, and both are the client's:
  `netDay()` asks `order=on_day.desc&limit=1` and **never asks for today**, so
  one stale row would be served as "today" forever; and `on_day` is rendered
  nowhere, which is what 「日付ないし」 means.
- **The 通報 row came off account settings, and `mod.js` kept a door.**
  「設定の通報ボタン消せ」OWNER 2026-08-26. The row was the *other* side — where
  a report is read and a post is taken down — and it was also the one thing on
  that page telling whoever held the phone that there is a staff at all. It is
  gone; the way in is now the seven presses on the heading that open `vAdmin()`,
  which draws the same queue with the same `modRow()`. Reports keep landing in
  the table either way. **Nothing here is outstanding** — it is written down
  because "the row was deleted" and "moderation was deleted" are one grep apart.
- **A PDF that was traced on a screen is read through the phone's renderer.**
  `sheet.js` sorts an arriving file into four kinds, and `'drawn'` goes to
  `shPdfDraw()`, which asks `LinguaShare`'s `renderPdf` (PDFKit) for a picture
  and reads that. In a browser there is no renderer and it says so
  (`wr.pdf.drawn`). **Device unconfirmed.**

**A duplicate CSS declaration is invisible to every check in the gate.** A
second `.wldrow` overriding `border` while never mentioning `border-radius`
leaves the radius standing on a bottom-only line, and nothing red says so.
Declare a class once.

### 二つの規則、ゲートについて

**A check enters the gate in the same commit that adds it, or it does not enter
at all.** A check in `tools/` and in no list is silent, not green, and a silent
check is the failure this repository is bitten by most often.

**Count `FAST` and `SLOW`; never believe a sentence about the number.**
`CLAUDE.md`'s count of RULES is a different number from this count of CHECKS and
**must not be made to match it**: one rule can take three checks and one check
can hold two rules.

### Open, and the owner's

- **How many keyboards a plan buys — settled and implemented.**
  Free 1 language and the fixed QWERTY; Plus 1 language and no keyboard ceiling
  (r84, 2026-09-24); Pro 3 languages and no ceiling. In the code: `CAN.kb` is
  `'plus'` (the DOOR), `kbCap()` is the NUMBER — `FREE_KB=1`, `Infinity` on Plus
  and Pro — counted by `kbCount()` across languages. `KB_MAX` is gone;
  a number that is three facts is a function. The language ceiling is
  `langCap()` — `FREE_LANGS=1`, `PRO_LANGS=3`, and Plus is deliberately the same
  as free. `edit` and `badge` are both in `CAN` now.
- **The price of Pro is decided.** The four products and their prices are in
  `docs/apple.md` § 4 and written into `ios/App/App/LinguaStore.swift`. What is
  left is **entering them in App Store Connect**, which is nobody's but the
  owner's.
- **Whether the sheet says anything about what to write with.** The box is a
  fixed 37mm and a pen of about 1mm matches the app's own exactly; a person's
  own pen came in about a quarter lighter. Words on a sheet, so it is next to
  「アプリ内に説明書くの禁止」 as well as being a taste.
  **Two writing tools are still unmeasured: a brush and a pencil.** What came
  back and was measured was a pen. Whether a hard pencil clears the
  「紙より 0.85 倍暗い」 floor the reader uses has not been checked, so a
  pencil-drawn sheet may simply not be seen. Measuring it needs a printed
  sheet and a person, not a check.
- **RevenueCat Shipaton 2026 — entered.** 「shipaton だそう。9／30 までには出したい」
  OWNER 2026-08-25 (`docs/FEATURE_RULES.md`, the Shipaton entry). The first
  public version went live on 2026-09-22 (1.0.0 (162), § the head of this file).

### Blocks shipping the free version

- **Signing in from Settings** is written and has not been opened on a phone.
  `obReturn()` in `www/onboard.js`.

Everything else on this list is done. What holds each: posts, Explore and
Notices read the server (`netPush`, `netFeed`, `netNotices`, ~~`postCatchUp`~~);
the reset mail is a six-digit code because a link has nowhere to land in a
Capacitor app (`supabase/mail.md`, template `{{ .Token }}`); and the ceilings
are each asked at the moment they are met, on the screen the person is on —
`capStop()` (a word), `langStop()` (a language), `dlStop()` (a download) and
`upStop()`, all in `www/core.js`. `quote` and `publication` are still unused.

### Found and left alone, deliberately

- **`tools/verify-script.mjs` runs again** — three breakages, not one:
   `gstep`→`geStep`, `scriptDrawn` gone since `9226dd6`, and every click was
   landing on `#splash` because it waited 250 ms where every other check waits
   for the selector. It is not a font experiment: it is the only end-to-end
   proof of the PUA font path. It now reports 13 ok / 19 FAIL, and each of the
   nineteen has to be triaged as app-wrong or test-old before it can go in the
   gate. `docs/BACKLOG.md`.

### Offered and not yet answered

- **Find the strings nothing says.** 270 of 692 keys in `en.js` never appear
    as a literal in `www/`, but most are built — `t('stg.'+p.id+'.t')` — so a
    grep cannot tell. `i18n-check` already renders 271 screens in 10 languages;
    recording what `t()` was asked for would say it properly. It has to be a
    report, not a failure: a toast on an error is real and unwalked.
12. **Two questions about screens, open since before the keyboard work.**
    Whether the post composer's line needs a visible border, and whether the
    word sheet's letter grid stays.

### Agreed long ago, never started

13. The onboarding as motion only.
14. Vertical writing — **written.** `DIRS` in `www/wsys.js`, bought with
    `can('dir')`. This line was stale.
15. A selectable line gap.

### The owner's, in a browser

**Still open, and all of it is in a browser:**

- Supabase — **one SQL line making yourself staff**, or the reports are on
  nobody's screen (`supabase/setup.md` § 5). Sign in on the phone first: it
  updates a row that has to exist.
- Supabase — **Spend Cap ON**, `supabase/setup.md` § 6. Pro is not a price that
  stops at $25: 250 GB of egress is included and $0.09/GB is added after it,
  with no ceiling until this is switched on. What runs out first is the
  timeline's photographs, and the way it goes wrong is a month that is already
  spent by the time anybody looks.
- Supabase — the reset mail template and the Redirect URLs.

**Before asking the owner for a value, grep for it.** The Google iOS client id
sat written down in a handover file for a day while nobody put it in the code.

**The four products, kept here because a price that changes has to change in one
known place** (`docs/apple.md` § 4 has every field):

    | 参照名 | 製品 ID | 期間 | 価格 | レベル |
    |---|---|---|---|---|
    | Lingua Plus | `com.tokinets.lingua.plus.monthly` | 1 か月 | USD 4.99 | 2 |
    | Lingua Plus Yearly | `com.tokinets.lingua.plus.yearly` | 1 年 | USD 49.99 | 2 |
    | Lingua Pro | `com.tokinets.lingua.pro.monthly` | 1 か月 | USD 9.99 | 1 |
    | Lingua Pro Yearly | `com.tokinets.lingua.pro.yearly` | 1 年 | USD 99.99 | 1 |

    **One group, Pro above Plus**, so Plus → Pro is an upgrade Apple
    prorates rather than two subscriptions somebody pays for twice. A product
    id can never be changed once it exists, and these four are already written
    into `ios/App/App/LinguaStore.swift`; changing one means changing the code
    first. Asking for a product that does not exist is not an error — StoreKit
    returns nothing for it — so **they can be made one at a time** and each
    appears in the app the moment it exists.

    **What is decided per product is one country's price, not 175.** Apple
    generates every other storefront from it — its own rounding, its own tax,
    its own currency — and any of them can be overridden afterwards, one at a
    time. The only real choice is which country is the base: with Japan as the
    base the yen are a number somebody chose, with USD as the base they are a
    number Apple rounded to. `docs/apple.md` § 4.

    **Changing a price here needs no change in the app**, and that is new
    since 2026-08-23: the plans screen shows `displayPrice` as the App Store
    gives it, and works the yearly saving out from the two amounts rather than
    from the 17 on `PLANS`, because Apple rounds each storefront separately
    and 17% off in dollars is not 17% off in yen. The `$4.99` in `www/i18n` is
    the browser's fallback and nothing else. Only a **product id** still means
    changing code first.

    The code side of this is done as far as it can be here:
    `LinguaStore.swift` (`products` `buy` `restore` `current` `manage`, the
    `Transaction.updates` listener, and an id→plan map that answers with the
    HIGHEST entitlement) and `www/store.js`, which `plBuy()` goes through on
    a phone. The three things that were waiting on another session's files are
    in: Restore (**Apple requires it**), Plus's own card, and Cancel opening
    Apple's own sheet rather than setting a flag. What the screen still lacks
    is **the subscription text Apple requires beside a price** — that it
    renews until cancelled, with the term and the price, and links to Terms
    and to the privacy policy. **The two pages exist and are live**, checked
    2026-09-01 in `natsuaya82-crypto/tokine2` on `main`: `lingua/terms.html`
    (140 lines, dated 2026-08-28, and § 12 Governing law — Japanese law,
    Tokyo District Court — is written, so the clause that once blocked it is
    not open) and `lingua/privacy.html` (141 lines). The app already points
    at them: `DOC_TERMS` / `DOC_PRIVACY` in `www/settings.js:52-53`. Vercel
    serves the repo root with `cleanUrls: true`, so `/lingua/terms.html`
    redirects to `/lingua/terms` — a redirect a browser follows, not a 404.

    **The sentence in the app is there**: `plan.renew` in every
    `www/i18n/*.js`, drawn above `docRows()` on the plans page
    (`www/settings.js`).
17a. **Sandbox testing**, once the products exist: buy, then `restore` after
    deleting and reinstalling, then a renewal arriving while the app is shut,
    and — new since the middle tier — **a Plus receipt reading as Plus and not
    as Pro**. None of it can be seen anywhere in this repository.
17b. TestFlight, as before. `docs/apple.md`.
18. GitHub Secrets, if a build ever needs a new one. No agent can write one.

### The drawn letters on the keyboard, and what is still unproved

**A letter key inserts a private use code point**, `sharePua()` in
`share.js`, on both plans — `shareFace()` for a keyboard somebody built, and the free QWERTY
(`kbFixed()`) on the same road. Held by `conv-check`, per letter and
not as a count (it prints how many claims it makes in its own last line; do not
carry an ordinal in prose). Nothing stored changes: the private use area exists
in the input field and inside the extension and nowhere else.

**Decided, not a defect:** used in Messages this keyboard sends tofu —
「Lingua キーボードは Lingua の中で使うもの」.

**`DEVICE CONFIRMED` — no.** Whether the extension actually inserts U+E000
upward, and whether what it inserts is drawn in `LinguaType`, cannot be checked
anywhere in this repo.

### The two native traps, and both are the same trap

- **Reach the native side with `Capacitor.nativePromise` and nothing else.**
    `Capacitor.Plugins` and `Capacitor.registerPlugin` are filled by
    `@capacitor/core`, which this app does not load — there is no bundler, only
    plain script tags. ~~`planKeep()`~~ asked `Capacitor.Plugins` for `LinguaPlan`
    and every write was the early return.
- **A native call that fails silently is invisible to every check here.**
    In a browser there is no native side, so everything is green whatever the
    phone would have done. The Keychain copy of the plan that went this way is
    gone (2026-09-11 — the plan is the server's answer now); the rule stands
    for every native call still written.

### Waiting on a phone

21. **「接続できません」 that the app can now name, and one that only a phone
    can answer.** OWNER 2026-08-27, Apple sign-in on a real device:
    「Appleでログインしたあと前のアカウントが出てくるんだけどなんで？ あと
    このあと接続できませんって出るけど？」 `claude/acct` settled the first
    half in code and made the second half answerable, and did not answer it.

    **What was settled without a phone, and is worth not re-deriving:
    the Apple provider IS enabled in Supabase.** Reaching the 「ユーザー名と
    ID」 screen at all is the proof. `OBM.mode='who'` is set in exactly one
    place — `www/onboard.js`, the first line of `obIn()` — and `obIn` is
    passed to `netIdToken()` as the SUCCESS callback and nowhere else. A
    disabled provider answers `/auth/v1/token?grant_type=id_token` with 400,
    `obNo` runs, and the person stays on the door. So `supabase/setup.md` §4-1
    is done. **§4-2 and §4-3 — Google — are done too** (the owner,
    2026-08-27), and Google sign-in is **DEVICE CONFIRMED** on build #107
    (the owner, 2026-09-01). Nothing about Google is outstanding.

    **What could NOT be settled here.** `status` 0 had three roads into one
    sentence — the request went and nothing came back, the request was never
    made, and a 200 that was not a session. Which one the phone is on cannot
    be read off this repository. It carries a mark now, so one screenshot
    decides it:

    ```
    接続できません (profile 0)      a REST GET went and nothing came back
    接続できません (mkprofile −)    never sent; the app judged it had no session
    接続できません (token ≠)        200, and what came back was not a session
    ```

    **The reasoning that narrows it, for whoever gets the screenshot.** The
    handle in the photograph, `lingua2`, was ALREADY the previous account's.
    So if `netHandleFree()`'s GET had reached the server, the answer would
    have been 「その ID は使われています」 and not this. That the offline
    sentence appeared instead says the REST call did not complete — which
    also means `netMyProfile()`, the same shape a moment earlier, is the
    thing to look at first. **`/auth/v1/` worked and `/rest/v1/` apparently
    did not, in one sitting, on one network** — that is the shape of the
    thing, and no check in this repository can see it.

    Also found and NOT changed, because it is only reachable by guessing:
    `netTook()` reads
    `uid:(d.user && d.user.id) || (SESS && SESS.uid) || ''`. The middle term
    is there for the refresh, which may answer without a `user`. It also
    means that switching accounts WITHOUT signing out first — the door opened
    from Settings while a session is still held — would hand the new account
    the old one's uid if the grant ever answered without a `user`. Supabase
    always sends one, so this is a hazard rather than a bug; it is written
    down because `www/me.js` now decides whose phone it is off that uid, so
    the cost of it being wrong went up.


19. Build **#82** is green and on TestFlight. What it has not had is a person:
    tapping three dots with round off should give a corner, and saving a letter
    should land on the letters list.
20d. **The widgets' layout is written down three times** and two of them are
    doubles: `ios/App/LinguaWidget/` is the real one, `www/numbers.js`
    § numClockHTML() is the preview the digits room shows, and
    `tools/widget-shot.mjs` is the picture that stood in for a simulator. The
    first two are genuinely separate programs — one is SwiftUI on a home
    screen, one is HTML in the app — and neither can call the other. The
    third is a test double and exists because there is no Swift here. Nothing
    holds the three together; if the Swift's em changes and the preview's does
    not, the app shows a clock the phone will not draw. Worth collapsing the
    third into the second when somebody can build the first.

20c. `ios/App/LinguaWidget/` — a whole new app-extension target, added to
    `project.pbxproj` by hand. That it opens in Xcode and builds is the first
    thing to find out; then the clock on a home screen, and a language whose
    digits are drawn against one whose are not.
    **`docs/apple.md` § the widget: it needs its own provisioning profile**
    (`Lingua Widget Distribution`, bundle id `com.tokinets.lingua.widget`) the
    same way the keyboard does, and nothing signs until that exists.

20b. `ios/App/App/LinguaStore.swift` — that it compiles at all, and then:
    buying in the sandbox, `restore` after deleting and reinstalling, and a
    renewal arriving while the app is closed. None of it can be seen here;
    there is no Swift toolchain in this container.

20. The free plan's keyboard chapter — the iOS steps, the hand-over state line,
    and the QWERTY with nothing to press — has only been seen in a browser,
    where the state line is always the red one because there is no bridge.

## If you are taking this over

1. Do what §1 says, in full — `git fetch --all` and `git branch -r`, not the
   two `rev-list` lines alone. This line used to read "check out the branch in
   §1, do not work on `master`" while §1 said `master` **was** the app and
   nothing needed checking out. The two were read together exactly once, by a
   session that then worked on the wrong copy for a day.
2. Read `CLAUDE.md` end to end. It is the specification, not an overview, and
   every rule in it is a bug that already shipped once.
3. Run `npm test` before touching anything, so you know what green looks like
   here. It prints counts — screens walked, screens the mirror rendered,
   buttons pressed — and a change meant to alter nothing has to leave them
   where they are. **The three numbers are not written here on purpose:** they
   were last measured on 2026-08-22, dozens of branches have gone in since, and
   nobody has re-measured. Take the numbers from your own first run and compare
   your second run against those. A stale number in this file is worse than no
   number, because it turns a correct run into a false alarm.
4. If what you are about to do is in §3, you are starting it, not continuing it.
