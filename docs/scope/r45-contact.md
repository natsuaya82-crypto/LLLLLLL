# r45-contact ── 設定に「お問い合わせ」、admin で読む

## Scope

- **Goal**: オーナーの決定（2026-09-22）「設定にお問合せを足して欲しい。フォーム
  みたいなの作ってみんなからの意見要望バグとかあればそれを見たい。フォームは
  アプリ内のadminのページで見れるようにしたい。」
- **Owns (may change)**: `supabase/schema.sql`、`tools/rls-check.mjs`、`www/net.js`、
  `www/settings.js`、`www/mod.js`、`www/shell.js`、`www/route-map.js`、
  `www/act-map.js`、`www/i18n/*.js`、`www/index.html`（この画面の CSS だけ ──
  **この session が一人で持つ**、リーダーが与えた）、`tools/fixture.mjs`、
  `tools/acct-check.mjs`、`docs/CHANGELOG.md`、`docs/DATA_MODEL.md`、
  `docs/FEATURES.md`、`docs/CHECK-0907.md`、`docs/scope/r45-contact.md`、`shots/r45-*`
- **Does NOT own**: それ以外すべて。`docs/STATE.md` はリーダーの物、触らない。
- **Decision it implements**: OWNER 2026-09-22（上）
- **Check to run**: `npm run act`・`press`・`i18n`・`es5`・`dead`・`box`・`acct`・`rls`。
  **ゲート（`npm test`）は回さない** ── リーダーの物（`docs/SESSIONS.md` §7）。

## 形

リーダーが読んで決めた所。オーナーの言葉と食い違えばオーナーが勝つ。

- **サーバーに表 `feedback`**（`report` の隣）。`author` は `on delete set null`
  ── `report` と同じ理由で、送った人が退会しても運営への言葉は残る。
  `kind` は `('opinion','request','bug')` の閉じた集合、`body` は 1〜2000 字。
  **RLS**：insert は `is_member() and author = auth.uid()`、select は `is_staff()`。
  **update / delete の policy は作らない** ── 消す道は頼まれていない。
- `www/net.js`：`netFeedbackSend(kind, body, ok, bad)`、`netFeedbacks(ok, bad)`。
- **画面**：設定の一覧に行「お問い合わせ」→ route `contact` へ**遷移**
  （下から出すシートは禁止）。種類を選ぶ**行が三つ**（丸いチップの横並びは禁止）、
  書く欄、送るボタン。**説明文は書かない**。
- **admin**：`vAdmin()` の通報の下に節。新しい順、種類・@handle・日付・本文。
  消すボタンは無し。`admin` は staff の壁の内側。
- 角丸・枠線・塗りは足さない（下線だけ）。ES5。`onclick` 無し。

## 十一の問い（`docs/FEATURE_RULES.md`）

1. **何のため** ── 使っている人から運営へ、意見・要望・バグを送る道。今は無い。
2. **できるようになること** ── 送る側：設定から三種類のどれかを選んで書いて送る。
   運営側：admin で新しい順に読む。
3. **無料か有料か** ── **無料**。`can()` は一つも足さない。段は一切見ない
   （`docs/PAID_FEATURES.md`：金は「できること」を決め、存在する物を決めない）。
4. **今の振る舞いで変わる所** ── 設定の一覧に行が一つ増える。admin の画面に節が
   一つ増える。それ以外は無し。
5. **今ある data への影響** ── **無し**。既存の表も列も一行も触らない。
6. **新しく貯まる物** ── サーバーの表 `feedback` だけ。**端末には一つも貯めない**
   ── `localStorage` の鍵は増えない（`store-check` が数える物は動かない）。
   slice でも `SET` でも無い。
7. **消す物** ── **無し**。DELETE REVIEW は要らない。update / delete の policy を
   作らないので、送られた物を消す道はアプリにもサーバーの API にも無い。
8. **前からある data** ── 無い（新しい表）。前の版のアプリを持っている人には
   この画面が無いだけで、開いても何も壊れない。
9. **電波が無いとき** ── 送れない。`netWhy` の文を `toast` で出して画面はそのまま
   ── 打った物は消えない（`CLAUDE.md` 規則 11「失敗して残る」）。
10. **失敗したとき** ── 9 と同じ。空で押した時は `toast(t('contact.need'))`。
11. **段が変わったとき** ── 何も変わらない。段を一度も見ない。

## 二周目 ── オーナーが七つ答えた（2026-09-22、そのまま）

最初の報告の「オーナーへ」六つに、オーナーが直接答えました。**全部仕様です。**

```
1いいよ。                        ← 本人は自分の送った物を読み返せない、そのまま
2いいよ。                        ← 返事の道は作らない、そのまま
3運営は消せるように。
4 2000文字以降は勝手に文字消えるようにしていいよ。
5画面を見せろ                     ← 言葉の入った画面を出した
6最初につけていいよ                ← 「意見」が先に選ばれている、そのまま
7そもそもadminの画面キモすぎる。
  お問い合わせ→開いたらお問い合わせだけの画面
  通報と→開いたら通報だけの画面。
  最初のスタッフとかの画面はあくまで選択の画面だから
```

そのあと、見本の画像（お名前・フリガナ・貴社名・メール・電話番号の問い合わせ
フォーム）と一緒に：

```
フォームみたいな見た目で作ってくれない？それきもい。
電話番号とか入らないから。
選択して本文だけやれればいい。
運営にはユーザー名は届く
できたら見た目ね
```

### やったこと

- **3 ── 運営が消せる。**`feedback_drop(f bigint)`（`supabase/schema.sql`、
  `report_drop()` と同じ形で `is_staff()` は函数の中）、`netFeedbackDrop()`、
  一件ごとの「消す」ボタンと `popAsk` の一問。**送った本人は消せません**
  （そもそも読めません）。`tools/del-check.mjs` に `fbkDrop` を登録
  （`takes` と `asks`）── 登録しないと commit が通りません。
  DELETE REVIEW は `docs/CHANGELOG.md` 2026-09-22。
- **4 ── 2000 で打ち止め。**`contactSet()` が切ります。`maxlength` では
  ないのは、同じ数が画面と `schema.sql` の二箇所になるからです。
  **欄の中も切ります** ── 打っている物と送る物が違うのは画面が嘘をついている
  ことなので。
- **7 ── admin は選択の画面。**`vAdmin()` から `modListHTML(rows)` を削除
  しました。**管理の画面に通報の一覧がそのまま並んでいて、その上に「通報」の
  行があり、押すと同じ物がもう一度出る画面へ行く**という状態でした ── 行き先を
  一つ自分の下にこぼした目次です。残るのは行だけ：通報・復旧・お問い合わせ・
  スタッフ。お問い合わせは `admin:fb` の顔（復旧と同じで route は増やさない）、
  bar の字も `pageName()` で「お問い合わせ」に。
- **見た目 ── フォームの形。**見本でフォームに見えているのは**ラベル**の方で、
  枠と角丸は五回やめろと言われている所（「基本下線だけ」）。なので項目名を
  足しました：`<div class="field"><label>` ── `home.js`・`grammar.js`・
  `phases.js` が既に使っている形で、**CSS は一行も足していません**。
  「種類」の下に三行、「本文」の下に欄、送信。薄い字の placeholder はやめました
  （ラベルと同じ語が二回出て、片方は打った瞬間に消えるので）。`contact.ph` を
  消して `contact.kind`・`contact.body` に。
- **欄は増やしていません。**名前・フリガナ・会社・メール・電話は一つも作って
  いません ──「電話番号とか入らないから。選択して本文だけやれればいい」。
  @ は送信の時に `author` として付くので、運営には届きます（admin の行に出ます）。

### 二周目の赤 ── 四回、うち一回は検査の欠陥

```
2000 の切りを外す    ✗ 2500 字入った ／ ✗ 欄の中が切られていない
fbkForget を素通し   ✗ 消した後に残っているのが一件ではない ── 2 件
違う id を送る       ✗ 違う行の id が行っている ── {"f":11}、押したのは 22
popAsk を外す        ✗ 押しても何も訊かずに消えた
```

**四つ目は最初、緑のままでした。**`#pop button` で探していて、`popOff()` は
`.on` を外すだけで markup を残すので、**前の claim が閉じたポップのボタン**を
拾っていました。`#pop.on [data-do="popYes"]` に直してから赤になりました。
一周目の「空の番人」と同じ形の失敗です ── 理由の違う緑は、その claim が何も
測っていないということ。

### 二周目の検査

```
rls     389 attempts by somebody who is not the owner, none of them got through
act     routes reached: 40/40 ・ names: pressed 283/283  typed 45/45 ・ screens walked: 642
i18n    all ten checks pass in all 10 languages
del     34 delete-shaped buttons — 25 take something out of storage,
        16 of those ask first and 9 say in writing why they do not
es5 / dead / box / store / assets / acct（80 まで）緑
```

```
press   buttons pressed: 17179  (282/283 distinct names) ・ every button pressed:
        nothing threw, nothing went blank.（未押下 1 = saveName、www/home.js の
        物で前からです）
```
一周目の 17173 から +6（お問い合わせの行、消すボタン二つ、お問い合わせの顔へ
行く行、その顔の二面ぶん）。**一度目の press は捨てました** ── 回している最中に
`www/shell.js` を書いたからで、browser の検査は `www/` を生で読みます
（`docs/STATE.md` 2026-09-06「ゲートが走っている間は作業ツリーに取り込まない」）。
同じ数が出ましたが、動いている木を測った緑は緑ではないので、落ち着いてから
回し直した方を書いています。

### 二周目の写真

`shots/r45-contact-empty-ja.png`・`-kind-`・`-written-`（フォームの形になった
もの）、`shots/r45-admin-ja.png`（選択の画面）、`shots/r45-admin-fb-ja.png`
（二件、片方は退会で @ なし）、`shots/r45-admin-fb-none-ja.png`（まだ無い）。

### 二周目で残っている物

- ~~復旧の顔（`admin:rec`）は bar が「管理」のまま。~~ **直しました**
  （「それでいいよ！そのままやって」OWNER 2026-09-22）。`pageName()` 自身の
  規則 ──「A page opened on a particular thing is named after that thing」、
  三つ上のコメント ── に復旧の顔が一度も当てられていなかっただけでした。
  `rec` と `rec:<id>` はどちらも復旧の画面なので両方「復旧」、引数なしの
  `admin` は目次なので「管理」。写真：`shots/r45-admin-rec-ja.png`。
- `supabase/schema.sql` が二度変わりました（表と `feedback_drop()`）。
  **オーナーが Dashboard に流すまでこの画面は動きません。**

### リーダーの連絡が古かった件（記録）

2026-09-22 13:59 に「容器を作り直したので c47348ab より後の作業は消えている、
やり直せ」という連絡が来ましたが、**遠隔の枝は 45593a45 まで進んでいました**
── 二周目の三 commit は全部 push 済みで、作業ツリーも remote と一致、消えた物は
ありません。やり直さずに、remote を見て確かめてから続けています。
**連絡ではなく remote を見る**、が効いた場面です。

## リーダーへ ── 指示が間違っていた所（三つ）

1. **commit を「net」と「画面」に分けると `dead-check` で止まります。**
   `tools/pre-commit` が dead-check を回し、呼び手の居ない関数を拒みます
   （規則 5）。逆向きも同じで、画面だけ先に commit すると今度は
   「呼んだ名前が何でもない」で落ちます。**層ではなく道で割りました** ──
   「画面（送る側）」＝ `netFeedbackSend` ＋ 設定の行 ＋ `vContact` ＋
   PAGES ＋ route-map ＋ act-map ＋ i18n、「admin（読む側）」＝
   `netFeedbacks` ＋ `vAdmin` の節 ＋ i18n。どちらも単独で緑です。

2. **`go('set')` は使えません。** `vSet()` は `here().a` を読み、引数が無いと
   どの枝にも入らず `goneBox()`（「もう無い」）になります。設定の一覧は
   route `settings` です。`setPwGo()` と同じ `back()` にしました ── 来た所へ
   戻るので、設定からでも他所からでも正しく落ちます。

3. **写真は最後ではなく、画面を変えた commit に乗ります。**
   `tools/commit-msg` が `www/*.js` を含む commit に `shots/*.png` を要求
   します（OWNER 2026-09-04）。手順 6 を手順 3 の中でやりました。

## オーナーへ ── 決めていないので作らなかったもの

- **返信の道はありません。**送った人は自分の送った物を読み返せません
  （`report` と同じ形で、`select` は `is_staff()` だけ）。返事をするか、
  するならどこに出すかは決まっていません。
- **消す道もありません。**サーバーに `update` の policy も `delete` の
  policy も作っていないので、**運営も消せません**。`report` には
  `report_drop()` がありますが、あれは「見て問題なかった通報を列から外す」
  というオーナーの決定（2026-09-05）があって作った物です。お問い合わせに
  同じ決定はありません。列が増える一方でよいか、済みの印を付けるか、
  消せるようにするか。
- **2000 字の上限を超えた時に出るのはサーバーの言葉**で、専用の文はありません
  （上限そのものはリーダーの指定）。アプリ側で断るなら文面が要ります。
- **言葉はこの session が書きました。**`contact.ph`（本文）・`contact.sent`
  （送信しました）・`contact.need`（本文を入力してください。）と、
  **日本語以外の九言語すべて**。`set.contact`・`contact.opinion`／`request`／
  `bug` の ja はリーダーの指定どおりです。
- **種類は「意見」が先に選ばれた状態で開きます。**サーバーは三つのうち一つを
  取り、「まだ言っていない」という状態がありません。押した理由を画面に出さずに
  断るのは画面が黙っていることになるので、一つ目を選んだ状態にしました。
- **通知もメール送信もありません**（頼まれていないので）。

## 報告

### 何を、どのファイルで、なぜ

| file | 何 |
|---|---|
| `supabase/schema.sql` | 表 `feedback`（`report` の隣・同じ形）、索引、RLS 二つ（insert は本人、select は staff）。**update / delete の policy は無し** |
| `tools/rls-check.mjs` | `CASES` に 13 件 |
| `www/net.js` | `netFeedbackSend()`・`netFeedbacks()`。加えて **空かどうかを訊く番人を外した**（下の「赤」の二つ目） |
| `www/settings.js` | 設定の一覧の行、`CONT`、`contactKind` / `contactSet` / `contactGo`、`vContact()` |
| `www/shell.js` | `PAGES.contact` |
| `www/route-map.js` | `page('contact', vContact)` |
| `www/act-map.js` | `act('contactKind')`・`act('contactGo')`・**`actIn('contactSet')`**（打つ物は `act` ではなく `actIn`） |
| `www/mod.js` | `FBK` / `FBK_ERR`、`adminFbk()`、`fbkRow()`、`vAdmin()` の節 |
| `www/index.html` | `.fbk` 一つ（**下線一本だけ**。角丸も四辺も無し） |
| `www/i18n/*.js` × 10 | 10 キー（8 ＋ `admin.feedback` ＋ `admin.fb.none`） |
| `tools/fixture.mjs` | 顔を四つ（お問い合わせ 空／種類を選んだ／打った、admin に二件） |
| `tools/acct-check.mjs` | claim 79 |
| docs | CHANGELOG・DATA_MODEL・FEATURES・CHECK-0907「ビルド 163」・この file |

### 変わる振る舞い

設定の一覧に行が一つ増える。route `contact` が一つ増える。admin の画面に節が
一つ増える。**それ以外は何も変わりません** ── 既存の画面の見た目も、既存の
表も列も一行も動いていません。

### 新しく貯まる物

**サーバーの表 `feedback` だけ。**`author`（退会したら null、本文は残る）・
`kind`（三つの閉じた集合）・`body`（1〜2000 字）・`created_at`。
**端末には一行も貯まりません** ── `localStorage` の鍵は 14 のまま
（`store-check` の最後の行）。slice でも `SET` でもありません。
**消す物はありません**（DELETE REVIEW 不要）。

**無料です。**`can()` は一つも足していません。段を一度も見ません。

### 赤の出力 ── 三回、押して見ました

**一つ目 ── `npm run rls`、表が無い状態で CASES だけ足して：**
```
somebody else got through:
  B writes to the operator            wanted ok, got
  and again, in each of the three kinds  wanted ok, got
  staff reads them                    wanted ok, got
```
表を足して緑：`rls: 385 attempts by somebody who is not the owner, none of them got through`

**二つ目 ── `netFeedbackSend` の呼び出しを止めて `npm run acct`：**
```
✗ 79: **送るボタンを押しても feedback へ POST が出ない** ── 0 回
✗ 79: 送れたのに本文が残っている ── "キーボードの3行目がずれます"
✗ 79: 送れたのにお問い合わせの画面に立ったまま
```

**三つ目 ── `contactGo` の「空なら断る」を外して `npm run acct`：**
一度目は**緑のままでした**。`netFeedbackSend` が自分でも空を断っていたからで、
**一つの問いが二箇所にありました**（`CLAUDE.md` § Simple）。net 側を外して
（patch ではなく削除）、もう一度外すと赤：
```
✗ 79: **空で押したのに送っている** ── body:""
✗ 79: **空白だけで押したのに送っている**
✗ 79: **送るボタンを押しても feedback へ POST が出ない** ── 3 回
```
**この一件は検査が見つけたものです。**赤を見なければ、理由の違う緑のまま
積まれていました。

### 回した検査 ── 最後の行

```
act     routes reached: 40/40 ・ pages: 40  views placed 40/40
        names: pressed 282/282  typed 45/45  Enter 8/8 ・ screens walked: 637
press   buttons pressed: 17173  (281/282 distinct names) ・ 3524 lists measured
        every button pressed: nothing threw, nothing went blank.（未押下 1 = saveName、
        www/home.js の物で前からです）
i18n    all ten checks pass in all 10 languages ・ screens the mirror rendered: 455
es5     ES5: 54 files under www/ are clean
dead    every one of them reached ・ what money buys: 12 capabilities in CAN
box     no rounded box was added
store   what this phone keeps: 14 keys ・ inside lingua.set: 18 fields
acct    acct-check: 全部通った。（79 まで）
rls     rls: 385 attempts by somebody who is not the owner, none of them got through
        55 things the file cannot be without, all present
```
**ゲート（`npm test`）は回していません**（`docs/SESSIONS.md` §7）。

### 写真

`shots/r45-set-row-ja.png`（設定の行）、`shots/r45-contact-empty-ja.png`、
`shots/r45-contact-kind-ja.png`、`shots/r45-contact-written-ja.png`、
`shots/r45-admin-ja.png`。**二つの状態は両方撮りました**（選んでいない／選んだ、
空／打った）。

### CODE CONFIRMED / DEVICE CONFIRMED / OWNER CONFIRMED

- **CODE CONFIRMED** ── 上の検査と赤三回。
- **DEVICE UNCONFIRMED** ── 実機では一度も押していません。見る所は
  `docs/CHECK-0907.md`「ビルド 163」。
- **OWNER UNCONFIRMED** ── 写真も文面も見てもらっていません。
- **サーバー未反映** ── `supabase/schema.sql` が変わったので、**オーナーが
  Dashboard に流すまでこの画面は動きません**。

### やり残し

- 上の「オーナーへ」の六つ。
- `tools/fixture.mjs` の顔の名前は英語です ── `tools/shot.mjs` の slug が
  `[^a-z0-9]` を落とすので、日本語名だと三つの顔が一つの file に重なります。
  最初に日本語で書いて重なるのを見てから直しました。
