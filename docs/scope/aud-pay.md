# 監査 C ── 課金と機能（PAID_FEATURES / FEATURES / apple）

- 日付: 2026-09-03
- 枝: `claude/aud-pay`
- 基準にした木: `master` の `bc1a394`（報告の前に取り込み済み。他の枝は一つも
  取り込んでいません）
- 担当: `docs/PAID_FEATURES.md`（611 行）、`docs/FEATURES.md`（1088 行）、
  `docs/apple.md`（408 行）の一文ずつを、いまのコードに当てる

**「全部確かめました」とは書きません。**確かめていないものは § 確かめていない
もの に名前で並べてあります。

## いちばん危ないものが二つ

**① `docs/FEATURES.md` の「Purchases (StoreKit) ── planned、no code exists、
the plan is set by hand」。**（見つけたもの 20）これは登録簿の行で、登録簿は
「作る前に読め」と言われているものです。`ios/App/App/LinguaStore.swift` は
在り、`www/store.js` は在り、`setPlan()` が `storeBuy()` を呼び、`PLAN_BUY`
は `true` です。**読んだ人がそのまま従うと、既に在るものをもう一度書きます。**
CLAUDE.md が言うとおり、古い事実の記述は変だと思われずにただ信じられます。

**② `docs/PAID_FEATURES.md` の能力表が、十二のうち六つを間違った段に載せて
いました。**（1）`gram` `dir` `data` `file` `words` を `plus` と書いていて、
`CAN` は五つとも `pro` です。加えて存在しない `write` を載せ、`dl` を落として
いました。**この表は「この機能は何段か」を調べに来る人が読む唯一の表です。**

②のために `tools/paid-check.mjs` を足しました（§ 足した検査）。①は行を書き
換えました。

## 見つけたもの

### docs/PAID_FEATURES.md

```
1. docs/PAID_FEATURES.md:353 「| `words` | plus | … | `data` | plus | …
   | `file` | plus | … | `gram` | plus | … | `dir` | plus |」
   実際: `CAN`（www/core.js:1299）は words:'pro' data:'pro' file:'pro'
         gram:'pro' dir:'pro'。十二のうち五つが違う段に書かれていた
   判定: 記述が古い
   やったこと: 直した（表を `CAN` と同じ十二行に書き換え）

2. docs/PAID_FEATURES.md:365 「| `write` | pro | the sheet — letters written
   on paper and brought back in (ch 26) |」
   実際: `CAN` に `write` は無い。`npm run dead` は「12 capabilities in CAN,
         every one asked for by name」と言い、`can('write')` はどこにも無い。
         シートの門は `can('file')`（www/sheet.js:1299 と 1533）
   判定: 記述が古い（存在しない能力を売っていた）
   やったこと: 直した（行を消し、`file` の行に「and the sheet」を書いた）

3. docs/PAID_FEATURES.md:353 の表に `dl` が無い
   実際: `CAN.dl='plus'`（www/core.js:1318）、`can('dl')` は
         www/home.js:1291
   判定: 記述が古い
   やったこと: 直した

4. docs/PAID_FEATURES.md:356 「| `data` | plus | CSV out, and the cloud |」
   実際: 同じ文書の 265 行目が「the cloud half was never true in code …
         Corrected 2026-08-26」と書いている。www/core.js:1301 のコメントも
         そう書いている。表だけが直っていなかった
   判定: 記述が古い（同じ文書の中で矛盾）
   やったこと: 直した

5. docs/PAID_FEATURES.md:200 「Free 0, Plus 1, Pro 2」／202「Note Pro is 2
   and not the 3 the question floated」／165「how many DL'd languages
   | — | 1 | 2 |」
   実際: `var PLUS_DL=1, PRO_DL=3`（www/core.js:972）。
         `docs/FEATURE_RULES.md:543` に 2026-09-02 のオーナーの言葉
         「dlはしかもplusは1つproは3つ」があり、2026-08-27 の
         「plus 1個 pro 2個」を置き換えている
   判定: 記述が古い（新しい決定が置き換えている。オーナーが決めた数はコードの
         ほう）
   やったこと: 直した（2026-09-02 の言葉に差し替え、古い文は消した）

6. docs/PAID_FEATURES.md:222 「**`CAN.dl` is not in `CAN` yet, and that is not
   an oversight.**」
   実際: 2026-09-02 に入っている
   判定: 記述が古い
   やったこと: 直した

7. docs/PAID_FEATURES.md:176 「**The middle rung is decided and is not on
   sale.** Plus's price is in no language file and no subscription for it
   exists in App Store Connect, so the plans screen sells Free and Pro.」
   実際: `plan.price.plus` と `plan.price.plus.yr` は十言語ぜんぶに在る
         （www/i18n/*.js）。`PLANS`（www/core.js:716）に Plus のカードが在り、
         `docs/apple.md` § 4 が Plus の商品二つを書き、`LinguaStore.plans`
         （LinguaStore.swift:66-67）に載っている
   判定: 記述が古い
   やったこと: 直した（www/core.js:1231 の同じ文も直した ── 下の 39）

8. docs/PAID_FEATURES.md:167 「| `gram` `dir` `data` `file` `write` `badge`
   | — | — | yes |」
   実際: 段は合っている（五つとも pro）。`write` だけが存在しない
   判定: 一部が古い
   やったこと: 直した（`write` を落とし、`dl` と `edit` の行を足した）

9. docs/PAID_FEATURES.md:410 「Two plans: `free` and `plus`. … `LANG_MAX` is 1
   on every plan and is not a price — there is no way to make a second language
   anywhere in the app」
   実際: 段は三つ（`PLAN_ORDER`、www/core.js:1241）。`LANG_MAX` はコードに
         一つも無い ── `langCap()`（www/core.js:794）が Free 1 / Plus 1 /
         Pro 3 で答える。**二つ目を作る道は在る** ── `langNew`
         （www/core.js:585）が `act-map.js:128` に登録され、
         `www/home.js:2045` がボタンを描く
   判定: 規則が守られていない（三段のうち一つを売る根拠を、無いと書いていた）
   やったこと: 直した

10. docs/PAID_FEATURES.md:388 「| a stage of your own | stays on the list;
    cannot be added to or deleted |」
    実際: `stHidden()`（www/phases.js:250）が無料では `STG.extra` を全部
          一覧から外す。`npm run plan` の主張「a grammar stage added on the
          paid plan is on the list, and hidden on free」もそう言っている
    判定: 記述が古い（同じ文書 80 行目が「①全部見えて増やせない 文字・文法・音
          ← 直す」と書いており、その直しは済んでいる）
    やったこと: 直した（表に文字・言語・DL 言語の行を足し、どの関数が切るかを
          並べた）

11. docs/PAID_FEATURES.md:75-87 「### 揃っていなかったもの ← 直す」
    実際: 四通りの割れは揃っている。`ltSeen()`（www/sound.js:645）、
          `stHidden()`、`wordsSeen()`、`langsSeen()`（www/home.js:2063）が
          同じ形
    判定: 記述が古い（済んだ作業が「これから直す」と書かれていた）
    やったこと: 直した

12. docs/PAID_FEATURES.md:604 「`tools/plan-check.mjs` — `npm run plan`.
    Twenty-five claims」
    実際: `say(` は 155 行。走らせると 155 行出る。plan-check 自身の
          コメント（:558）は「eighty claims」と書いており、これも古い
    判定: 記述が古い
    やったこと: 直した（数を書かず「そこの `say(` を数えろ」に。plan-check の
          中のコメントは直していない ── 直す価値はあるが、数の二重管理を
          増やさないほうを採った）

13. docs/PAID_FEATURES.md:633-644 「**The StoreKit code exists and nothing in
    `www/` calls it.** … What is missing is the wiring: **`www/store.js`, and
    the plans screen calling it**. The plan is still set by hand there —
    pressing a card is `setPlan(id)` and nothing asks the App Store anything.」
    実際: `www/store.js` は 23 KB 在り、`storeBuy` `storeRestore` `storeManage`
          `storeCost` `storeOff` `storeWas` `storeAsk` などを持つ。
          `setPlan()`（www/settings.js:1013）が `storeBuy()` の唯一の呼び出し
          元で、`PLAN_BUY=true`（www/settings.js:1012）。`storeRestore` と
          `storeManage` は `act-map.js:62,63` に登録済み
    判定: 記述が古い
    やったこと: 直した（§ Not built yet を二つに割り、繋がっているものと
          本当に無いものを分けた）

14. docs/PAID_FEATURES.md:97 「`SET.plan` is where the value sits in the code
    today; that is the gap between the decision and the code」
    実際: 段はアカウントに乗っている ── `supabase/schema.sql:466` の `plan`
          テーブル、`netPlanUp()`（www/net.js:773）が書き、`netPlanSync()` が
          読み戻して `planBest()` で高いほうを採る。`SET.plan` は信号の無い
          ときに効く写しであって、隔たりではない
    判定: 記述が古い
    やったこと: 直した

15. docs/PAID_FEATURES.md:575 「 7  is this StoreKit, or the hand-set SET.plan
    we have today?」（有料機能を足すときの十の問い）
    実際: 手で決める道はブラウザだけになっている
    判定: 記述が古い
    やったこと: 直した（「App Store の返事が遅れたら／来なかったら何をするか」
          に書き換え）
```

### docs/FEATURES.md

```
16. docs/FEATURES.md:250 「| Purchases (StoreKit) | **planned** | — | — |
    Keychain | **open** — no code exists; the plan is set by hand |」
    実際: 13 と同じ。Swift も www/ も在り、実機で走っていないだけ
    判定: 記述が古い ── **この監査で見つけたうちで一番危ないもの**。
          登録簿は「読んでから作れ」と言われている一覧で、ここが
          「no code exists」と言っている
    やったこと: 直した

17. docs/FEATURES.md:56 「**write** … the plan gate and the drawing are not
    [in] … **Pro**: the whole road, and the gate is NOT in the code yet」
    実際: 門は入っている ── `shInFileHTML()`（www/sheet.js:1299）が
          `can('file')` を訊いて閉じた扉を描き、`shTakeIn()`
          （www/sheet.js:1533）が押した先でもう一度断る。`file` は `pro` な
          ので、2026-08-23 の「Pro」という決定どおりの段に居る
    判定: 記述が古い
    やったこと: 直した

18. docs/FEATURES.md:60 「| One language per person | shipped | 1 | 1 |
    `LANG_MAX` | decided |」
    実際: `LANG_MAX` は無い。`langCap()` が 1 / 1 / 3
    判定: 記述が古い（Pro が売っている三言語を、登録簿が知らない）
    やったこと: 直した

19. docs/FEATURES.md:71 「| One language, on every plan | … there is no way to
    make a second anywhere in the app, so it is not a price |」
    実際: 9 と同じ。`langNew` はボタンとして描かれている
    判定: 記述が古い
    やったこと: 直した

20. docs/FEATURES.md:99 「… so `CAN.dl` still has nothing to ask it and is
    still not in the table」
    実際: 6 と同じ
    判定: 記述が古い
    やったこと: 直した

21. docs/FEATURES.md:102 「| How many DL'd languages a plan holds | **planned**
    — **the two numbers are OPEN** … Nothing in the code holds a count.
    **Do not write one** |」
    実際: `dlCap()` `dlCount()` `dlStop()`（www/core.js:972-991）が全部在り、
          `dl-check` が持っている。数は 2026-09-02 に決まっている
    判定: 記述が古い ── **これも危ないほうの形**。「書くな」と書いてある
          ものが既に書かれている
    やったこと: 直した

22. docs/FEATURES.md:279 「`schema.sql` has no plan column and no plan check」
    ／:292「Decided so far: … that StoreKit is not to be written yet」
    実際: `plan` テーブルが在る（14）。StoreKit も書かれている（13）
    判定: 記述が古い
    やったこと: 直した（§ 1 を「四つのうち二つは済み、残るのはレシート検証」に
          書き換えた）

23. docs/FEATURES.md:299 「### 3. Publishing a language — `language`,
    `publication` … **nothing in the app reads or writes either**」
    実際: `language` は読み書きされている ── `www/net.js` に
          `/rest/v1/language` が 8 箇所。`publication` は本当に触られていない
    判定: 半分が古い
    やったこと: 直した（`language` と `publication` を分けて書いた）

24. docs/FEATURES.md:388 「### 6. The day's sentence — `prompt` … The table
    exists and nothing reads it.」
    実際: `www/net.js:2578` と `:2583` が読む。
          `supabase/functions/daily-prompt/` が書く
    判定: 記述が古い
    やったこと: 直した（残っているのは編集の話だと書いた）

25. docs/FEATURES.md:553 「**What is missing is the middle button:
    「言語を削除」.** … There is no such path anywhere — `act-map.js` binds
    `langOpen` and `langNew` and nothing else.」
    実際: `wipeLangs()`（www/settings.js:458）が `popAsk()` で言語名を出して
          訊き、`wipeLangsGo()`（:469）が `SLICES` をその id ぶんだけ消し、
          サーバーの行とバックアップも落とす。`act-map.js:300` に登録済み。
          CLAUDE.md の規則 6 も「入っている」と書いている
    判定: 記述が古い
    やったこと: 直した

26. docs/FEATURES.md:528 「  wipeAll()   confirm once, with iOS's own dialog」
    実際: `confirm()` は 2026-09-01 に全面禁止で、`es5-check` が落とす。
          いまは `popAsk()`
    判定: 記述が古い（いま読んで従うと、ゲートで落ちるコードを書く）
    やったこと: 直した

27. docs/FEATURES.md:403-457 § 8 の「下の記述は 2026-08-26 のもので、もう
    作られていません」以下、五十行あまり
    実際: `supabase/functions/appstore/` は無く（`supabase/functions/` は
          `daily-prompt` だけ）、`netStore()` は www/net.js に無く、
          `www/mod.js` は 356 行しかない
    判定: 記述が古い
    やったこと: 直した（「歴史とかいいから消せよ」に従って**消した**。
          RevenueCat の枝が `claude/rc` で止まっていることを一行足した）

28. docs/FEATURES.md:566 「### 10. DL … **OWNER DECISION 2026-08-25, and
    nothing is built.** Zero lines.」および同節の「`CAN.dl`, which is **not in
    `CAN` yet**」「**how many** a plan holds. The owner's line ends in 「は？」」
    「the second one is **always** the empty note, because nothing anywhere
    writes `mine:false`」
    実際: DL は 2026-09-01 に入り、数は 2026-09-02 に決まっている。
          `langSeenAdd()` が `mine:false` を書く（www/core.js:986 の
          `dlCount()` がそれを数えている）
    判定: 記述が古い（節ぜんたいが、同じファイルの 99 行目の表と逆のことを
          言っていた）
    やったこと: 直した（決まって入っているものと、本当に開いているものを
          分け直した）

29. docs/FEATURES.md:220 「`tr` is not one of the nine names in `CAN`」
    実際: `tr` が無いのは合っている。九ではなく十二
    判定: 一部が古い
    やったこと: 直した（数を書かず「`CAN` を数えろ」に）

30. docs/FEATURES.md:50 「| **AI に相談 — ChatGPT を本文入りで開く** |
    **in progress** | … reads `SET.askTo`, and nothing writes it |」
    実際: **一行も無い。**`www/` に `askTo` も `ask*` の関数も `ask.*` の
          文字列も無い。さらに `package.json` の `"ask": "node
          tools/ask-check.mjs"` が指すファイルが存在しない（40 本のうち唯一）
    判定: 記述が古い（in progress ではなく planned。読む値も無い）
    やったこと: 直した（`package.json` は担当外なので**直していない** ── 41）

31. docs/FEATURES.md:810 「**Pro** only -- the top tier, which is the one
    `claude/save` is renaming from Plus as this is written」
    実際: 改名は 2026-08-23 に終わっている
    判定: 記述が古い
    やったこと: 直した

32. docs/FEATURES.md:1074 と :1077 「- The price, and nothing else on this
    list.」「- The price, and which plan.」（write 章の「開いているもの」）
    実際: 同じことが二行あり、どちらも決まっている（Pro、`can('file')`）
    判定: 記述が古い
    やったこと: 直した（二行とも消した）
```

### docs/apple.md

```
33. docs/apple.md:365 「## 6. 先に言っておくこと — 課金はまだ「押しても
    買えません」」「**Swift 側はあります。繋がっていません。**」
    実際: 繋がっている（13）。同じ節の中の 1 と 4 の項目は「在ります」と
          書いてあり、見出しと本文が矛盾していた
    判定: 記述が古い
    やったこと: 直した（見出しごと書き換え、残る作業をレシート検証の一つに
          した）

34. docs/apple.md:393 「2. プラン画面のボタンを「購入」に変える。Plus（真ん中）
    のカードと値段の文字列も要ります（`www/i18n/*.js`。Pro のは入っていて、
    Plus のはまだ無い）」
    実際: `plan.price.plus` `plan.price.plus.yr` は de en es fr it ja ko pt
          ru zh の十本すべてに在る。買うボタンは `plan.buy`（「Subscribe」）で
          既に描かれている
    判定: 記述が古い
    やったこと: 直した

35. docs/apple.md:399 「決まるのは `SET.plan` ── 端末の中の値 … 行き先は
    `profile` の列です」
    実際: 行き先は在る。`plan` テーブル（14）。`profile` の列ではなく別表
    判定: 記述が古い
    やったこと: 直した

36. docs/apple.md:381 「**サインイン方法**: … **今はメールだけなので、ここは
    審査で止まる可能性があります。**」
    実際: `obSignInApple()`（www/onboard.js:781）が扉に並び
          （www/onboard.js:1222）、`App.entitlements:18` が
          `com.apple.developer.applesignin` を宣言している
    判定: 記述が古い
    やったこと: 直した（プロファイル側は § 2 が条件だと書いた）

37. docs/apple.md:15 「ビルド番号を GitHub の run 番号で上書き（今回のビルドは
    **38**）」／:31「## 1. 今回のビルド（#38）を TestFlight で配る」
    実際: 同じ文書の § 2 が #83、§ 2b が #83、www/settings.js のコメントが
          #106 を語る。run 番号なので固定の数を書くと必ず古くなる
    判定: 記述が古い
    やったこと: 直した（数を書かず「Actions の run 番号がそのままビルド番号」に）

38. docs/apple.md:258-272 ウィジェットのプロビジョニングプロファイルの節が、
    § 2b と § 4 の中に二回ある
    実際: 同じことを二箇所が言っている。§ 4 の側は「サブスクリプションの商品を
          作る」の中に紛れていた
    判定: 規則が守られていない（CLAUDE.md § One place, not fifteen）
    やったこと: 直した（§ 4 の写しを消し、拡張の中身の説明は § 2b に移した）
```

### コード ── 直したもの（`www/core.js` と `tools/`）

```
39. www/core.js:1269 「What money buys … **Eleven names**, each the level it
    needs. It said ten.」
    実際: 十二。`dl` が 2026-09-02 に入って数が動き、コメントが動かなかった。
          コメント自身が「do not trust this one either」と書いていたので、
          十三個目の数を足す代わりに**数を書くのをやめた**
    判定: 記述が古い
    やったこと: 直した（数を消し、`npm run dead` と `paid-check` を指した）

40. www/core.js:1231 「The middle rung is DECIDED and is not on sale: the plans
    screen sells Free and Pro」
    実際: 7 と同じ
    判定: 記述が古い
    やったこと: 直した

41. www/core.js:1296 「free counts to a hundred, **basic** to a thousand, and
    only **plus** has no number at all」
    実際: 段の名前は 2026-08-23 に Free / Plus / Pro になっている。この文の
          basic は Plus、plus は Pro のこと
    判定: 記述が古い（`CAN.words` が `'pro'` である理由を説明する文が、
          古い名前で書かれていた）
    やったこと: 直した

42. tools/gate.mjs:6 「Thirty-one checks, and twenty-three of them start a
    headless browser」
    実際: `FAST` 9 + `SLOW` 26 = 35（わたしが一本足して 36）
    判定: 記述が古い
    やったこと: 直した（数を書かず「二つの配列を数えろ」に。CLAUDE.md にも
          同じ数が写されている ── 43）
```

### 直せないもの・直さないもの

```
43. CLAUDE.md:規則 5 「`CAN` in `core.js` names every capability a plan opens
    — `words` `data` `file` `letters` `wsys` `kb` `snd` `edit` `badge` `gram`
    `dir`」
    実際: 十一個しか無く、`dl` が抜けている。すぐ下に「**Count them off
          `CAN` and not off this line**」と書いてあり、その注意書きどおりまた
          古くなっている
    判定: 記述が古い
    やったこと: 直さない（`claude/aud-claude` が持っている）

44. CLAUDE.md § Layout の表 「`docs/apple.md` | … and **the fact that no
    StoreKit code exists yet**」
    実際: 13 と同じ
    判定: 記述が古い
    やったこと: 直さない（`claude/aud-claude` が持っている）

45. CLAUDE.md の検査の数 ── 「thirty-four checks」「twenty-eight checks」
    「Thirty-one checks」「the other twenty-five four at a time」「the
    twenty-two that each start a headless Chromium」が同じファイルの中で
    食い違う。実際は FAST 9 + SLOW 26 = 35（わたしが足して 36）。
    `npm run` の個別一覧にも `dead` `plan` は在るが `dl` `acct` `find` `open`
    が無い
    判定: 記述が古い
    やったこと: 直さない（`claude/aud-claude` が持っている）。**わたしが
          `tools/gate.mjs` の `FAST` に一本足したので、この数はもう一つ
          動きます**

46. package.json:「"ask": "node tools/ask-check.mjs"」
    実際: `tools/ask-check.mjs` が無い。四十本のスクリプトのうちこれだけ。
          `npm run ask` はその場で落ちる。`tools/gate.mjs` は `ask` を
          呼ばないのでゲートは緑のまま
    判定: 規則が守られていない
    やったこと: 直さない（`package.json` は渡された触ってよいファイルに
          入っていない。**リーダーの判断待ち** ── 行を消すか、検査を書くか）

47. www/settings.js / www/store.js / ios/App/App/LinguaStore.swift
    「買うボタンを消したところに今のプランと期限を出す」（2026-09-03）
    実際: 消すほうは入っている ── `plHave()`（www/settings.js:795）が
          「いまの段か、その下」を答え、`vPlans()` の `.plgo`
          （www/settings.js:970）が `plHave()` のとき買うボタンを描かない。
          **出すほうは無い。**期限を持つ値がどこにも無く（`www/store.js` にも
          `LinguaStore.swift` にも `expirationDate` を読む道が無い）、
          `plan.*` の i18n にも期限の鍵が無い
    判定: 規則が守られていない（今日の決定の後半が未実装）
    やったこと: 直せない（`claude/plannow` が三つとも持っている）

48. docs/FEATURE_RULES.md:2735 「**Not a loophole, decided:** the language
    count is what is on THIS PHONE — `lingua.langs` carries no owner …
    signing in as somebody else neither adds a language nor resets the count」
    実際: 2026-09-02 の「1アドレス1アカウント」で `langOwned()`
          （www/core.js:900）が `SESS.uid` を見るようになり、`langCount()` は
          **このアカウントの**言語だけを数える。別のアカウントで入ると数は
          変わる
    判定: 記述が古い
    やったこと: 直さない（`docs/FEATURE_RULES.md` は監査 A〜D の別担当。
          ここに置いて渡します）

49. www/i18n の `plan.plus.*` / `plan.pro.*`（各五行の売り文句）
    実際: `dl`（人の言語を取ってくる）にも、言語の数（Pro 3）にも、DL 言語の
          数にも、一行も触れていない。Plus は「文字・音・書記・単語 1000・
          キーボード四つ」、Pro は「Plus の全部と、単語無制限・キーボード
          無制限・文法と向き・ファイル」
    判定: **オーナーが決めること**（五行に何を書くかは売り文句であり、
          CLAUDE.md § Deciding の「wording」）
    やったこと: 直さない。**Pro が売っている三言語と三 DL が、買う画面のどこ
          にも書かれていない**ことだけ報告します

50. docs/PAID_FEATURES.md:344 「`plan-check` holds all seven claims, and three
    of them were watched failing」（`kb` について）
    実際: `npm run plan` の出力に鍵盤の主張は在るが、七という数がどの七つを
          指すのか照合していない
    判定: 確かめていない
    やったこと: 直さない
```

## 足した検査 ── `tools/paid-check.mjs`

**`docs/PAID_FEATURES.md` を `www/core.js` に当てます。**ブラウザは要らないので
`tools/gate.mjs` の `FAST` に入れました（`node tools/paid-check.mjs`）。

二つだけを持ちます。**どちらが正しいかは決めません** ── 食い違ったら両方の名前と
両方の言い分を出して落ちます（2026-09-03 の「食い違いがあるなら俺に確認をしろ」）。

1. 能力表が `CAN` と同じ名前を、同じ段で並べていること
2. § The four numbers が `core.js` の八つの定数と同じ数を書いていること
   （`FREE_LIMIT` `PLUS_LIMIT` `FREE_KB` `PLUS_KB` `FREE_LANGS` `PRO_LANGS`
   `PLUS_DL` `PRO_DL`）

**赤を四回見てあります。**今日この監査が見つけた四つの形を、そのまま戻して:

```
gram を plus に戻す      → 「`gram`  CAN says pro, the price list says plus」
`write` の行を戻す        → 「1 capability is in the price list and not in CAN」
PRO_DL を 2 に戻す        → 「PRO_DL disagrees: core.js says 3, the doc says 2」
CAN に noads を足す       → 「1 capability is in CAN and not in the price list」
```

`dead-check` は `CAN` の**形**をコード側から持っていて（誰も訊かない能力、
存在しない能力を訊く `can()`）、**値段表が同じことを言っているか**は誰も
持っていませんでした。これがその一本です。

## 走らせたもの

速いほうの十本だけです（**ゲートは回していません**）。

```
assets ok   es5 ok   grammar ok   dead ok   import ok
sides ok    face ok  box ok       store ok  paid ok
```

`npm run plan` も一度だけ通しました ── 155 の主張が全部緑で、`CAN names 12
capabilities` と `pro opens all 12` を読むためです（12 と 155 の出どころ）。

## 確かめていないもの

数が多いので、確かめていないものは名前で並べます。

- **`docs/apple.md` の App Store Connect 側**（§ 0 の CI、§ 2 と § 2b の
  プロファイル、§ 3 の契約と口座、§ 4 の国ごとの値段、§ 5 の審査の入力欄、
  § 7）。**画面の中の話で、リポジトリから確かめる方法がありません。**
  照合できたのは、コードに現れる四つ ── 製品 ID 四つ（`LinguaStore.plans`）、
  値段が Apple の返事から来る形（`storeCost()` / `storeOff()` / `storeWas()`）、
  グループ内のレベル（www/settings.js のコメントが引く 2026-09-03 の
  「グループ1個でレベルも分かれてた」）、Sign in with Apple の宣言
  （`App.entitlements`）だけです。
- **`LinguaStore.swift` と `LinguaPlan.swift` の実際の挙動。**Linux では
  コンパイルも実行もできません。読んだのは `plans` の四行と `order` と
  `planOf()` だけで、`writeDown()` の呼び出し元がどれも `mayLower` を
  正しく渡しているかは **`plan-check` の出力を信じました**（自分で数えて
  いません）。
- **`docs/FEATURES.md` の「reading side」の行のうち、課金に関わらないもの**
  ── 投稿、返信、カード、通知、フォロー、写真、声、Explore。**一行ずつ
  当てていません。**検索履歴（`recent_search`）と `quote` だけは表と
  コードを見ました。
- **`docs/FEATURES.md` の grammar / translate の長い節**（150〜240 行）。
  `AI_SEAM` `TR_SEAM` `postTr` `ORDERS` が在ることは見ましたが、
  形態論と助詞の記述は当てていません。
- **`docs/FEATURES.md` の write 章の測定値**（紙の傾き、線の太さ 18/800、
  点の数 440→122）。再測していません。
- **`npm run dl` `npm run acct` `npm run term` `npm run backup`。**
  遅いほうなので回していません。DL の数と `langsSeen()` については
  `dl-check` の中を読んだだけです。
- **`docs/PAID_FEATURES.md` の Supabase の通信量の表**（500 人 15 GB など）。
  `POST_THUMB=300`（www/post.js:692）と `NET_PAGE=50`（www/net.js:1442）と
  `netSlices()` の `select=kind,body,no`（www/net.js:1164）が書いてある
  とおりであることは確かめました。**割り算はしていません。**
- **実機。**一つも触っていません。

## 触ったファイル

```
docs/PAID_FEATURES.md   直した
docs/FEATURES.md        直した
docs/apple.md           直した
www/core.js             コメント三箇所（CAN の数、段が売りに出ているか、
                        古い段の名前）。**動きは一行も変えていません**
tools/gate.mjs          FAST に paid-check を足し、古い数を消した
tools/paid-check.mjs    新規
docs/scope/aud-pay.md   これ
```

`www/settings.js` `www/store.js` `ios/App/App/LinguaStore.swift`
`CLAUDE.md` `docs/FEATURE_RULES.md` `package.json` には触っていません。
