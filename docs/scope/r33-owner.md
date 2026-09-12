# claude/r33-owner ── 2026-09-12 朝のオーナー決定、三件

- Goal: 2026-09-12 朝の決定のうち三件を入れる。
  1. **新しい言語は文字 0 ではなく 38 字の枠で始まる**（段を問わず）。
  2. **電波なしで開いた時、取った言語も前に読み込んでいれば一覧に出る。**
  3. **動詞の章の三行目の言葉**（ja だけ）。
  そして決定ログ（2026-09-12 の六項）を `docs/FEATURE_RULES.md` に。
- Owns (may change):
  - `www/core.js`（`langNew()`、`LTAKE` と写し、天井の三つ目の状態）
  - `www/home.js`（`langsSeen()` ── 天井が数の時だけ畳む。2026-09-12 03:13 に
    リーダーが「二枚目の壁も外す」と言って追加で渡した）
  - `www/letters.js`（`ltStart()` の書き直し ── 枠を置く一箇所を分ける）
  - `www/i18n/ja.js`（`g2.g.mood` の一行）
  - `tools/plan-check.mjs`（claim 1）
  - `tools/again-check.mjs`（claim 2）
  - `tools/store-check.mjs`（新しい鍵の road）
  - `tools/acct-check.mjs`（65 の「訊いていない」が写しと食い違うなら、そこだけ）
  - `docs/CHANGELOG.md`、`docs/DATA_MODEL.md`、`docs/PAID_FEATURES.md`、
    `docs/FEATURE_RULES.md`、`CLAUDE.md`、`docs/scope/r33-owner.md`、`shots/r33-*.png`
- Does NOT own: それ以外すべて。名指しで `www/index.html`、`supabase/schema.sql`、`ios/`
- Decision it implements: `docs/FEATURE_RULES.md` § 2026-09-12 朝（このブランチが書く）
- Check to run: 触った check と `npm run press` 一回だけ。**全ゲートは回さない**
- claim の名前:
  - `plan-check`「有料で言語を追加 → 文字が 38 ある → 綴りが打てる → 消した文字は次の起動で戻らない」
  - `again-check`「電波なしでも、取った言語が一覧に出る」「別のアカウントで入ると前の人の取った言語は出ない」

## 報告

枝 `claude/r33-owner`（`origin/integ-0905` = `ed5146bb` から。報告の前に fetch
して、追いつく必要が無いことを確かめた ── `ed5146bb` は HEAD の祖先）。
commit は五本、一件ずつ、毎回 push 済み。

### 1. 新しい言語は文字 0 ではなく三十八の枠で始まる ── `f1c8c6f8`

- **触ったもの**：`www/letters.js`（`ltStart()` を書き直して `ltSlotsFill()` を
  出した）、`www/core.js`（`langNew()` がそれを一度呼ぶ）、`tools/plan-check.mjs`
  （claim 四つ）、`CLAUDE.md` § What the free plan is、`docs/PAID_FEATURES.md`
  二箇所、`docs/CHANGELOG.md`。
- **振る舞い**：どの段で作った言語も a〜z・! ?・底の数だけの数字の三十八字で
  始まる。有料で作った言語が文字 0 で、最初の単語の綴りが打てなかったのが直る。
- **条件を足していません**：`ltStart()` の `if(can('letters')) return;` は一行も
  緩めていない（緩めると「有料で消した文字が起動で戻る」が赤くなる ── その形も
  赤を見た）。枠を置く半分を関数に出して、訊く所を二つにした。
- **保存**：増減なし。移行なし。既にある言語には何も起きない。`letters` slice が
  `langNew()` の `netLangSync()` で上がることを**測った**（偽サーバーの `sent` に
  `slice:<id>:letters`）。
- **写真**：`shots/r33-lt38-{before,after}.png`（有料で「言語を追加」→ 文字の頁、
  0/0/0 → 26/2/10）。`tools/shot.mjs` に「有料で今作った言語」の面が無いので、
  `fixture` を種に同じ道を走らせて撮った。

### 2. 取った言語の答えの写し ── `2e6de91a`

- **触ったもの**：`www/core.js`（`langTakeKey` / `langTookGot` / `langTookFor`）、
  `www/net.js`（`netRead`・`netTook`・`netOut` の三箇所で呼ぶ）、
  `tools/again-check.mjs`（claim 五つ、うち一つは書き換え）、
  `tools/store-check.mjs`（road）、`CLAUDE.md` 規則 22、`docs/DATA_MODEL.md`、
  `docs/CHANGELOG.md`、`docs/BACKLOG.md`。
- **新しく保存する鍵が一つ**：`lingua.take.<uid>` ── `language_take` の答えの
  写し、そのアカウントの物、上る道なし、`lsWipeAcct()` が鍵の末尾の uid で数えて
  取る。`langOwnOf` の `.got` と同じ形。
- **振る舞い**：電波の無い起動で、取った言語が `LW_WAIT`（＝描かない）ではなく
  `LW_READ` として残る。別のアカウントで入ると前の人の分は読まない（8/31 の
  再発防止）。読むだけなのは今までどおりで、更新・保存の道は一行も触っていない。
- **書き換えた claim 一つ**：`again-check`「答えが来ていない起動では何も落ちない」
  の `langTook()` が `null` → **2**。言っていること（0 ではない）は同じで、答えて
  いるものが「訊けていない」から「前に聞いた答え」に変わった。写しがまだ無い
  アカウントは今も `null`（`acct-check` 65 がそのまま見ている）。

**壁は二枚あり、この commit では一枚目だけを外しました ── 二枚目はこの下の
§ 追記（`2e6de91a` の後、リーダーの判断で同じ枝が外した）。以下はこの commit
までの話です。**
一覧に出るまでには壁が**二枚**あり、この時点で外したのは一枚目だけです。二枚目は
`dlCap()`（`www/core.js`）が `has('plus')` で答えること ── 段を訊けていない
起動では 0 になり、`langsSeen()` が読む側の一覧を畳んで足に「1 hidden」を出す。
**段はメモリだけ（規則 22）なので、電波の無い起動で段が分かることはありません。**
測った値：`langWhose('theirs-9')` は `read`、`langTook()` は 1、**`dlCap()` は 0、
足は「1 hidden」**（`again-check` が毎回印字します）。`langCap()` も同じ形で、
作った側の一覧は 1 本に畳まれます。

ここで直さなかったのは、**「段を訊けていない間、一覧を何本出すか」が段の
決めごと**だからです（`CLAUDE.md` § Deciding）。そして書いてあるものが二つ
食い違っています ── `docs/DATA_MODEL.md` § 5 は「Neither ceiling removes, hides
or counts down anything」と書いていますが `langsSeen()` は畳みます
（`CLAUDE.md` § Code is not the specification → 報告して止める）。
提案は `docs/BACKLOG.md` に書きました：`planKnown()` が偽のあいだは**切らない**
（数を決めるのではなく、まだ何も言われていないので畳まない）。天井は緩みません
── 次のダウンロードは `dlStop()` が `null` を見て「接続できません」で止めます。

### 3. 動詞の章の三行目 ── `6980c6e6`

`www/i18n/ja.js` の `g2.g.mood` を「命令・条件・可能・義務・願望」に。ja だけ。
写真は `shots/r33-mood-{before,after}.png` ── 前は二行に折り返していた行が一行に
収まる。

### 4. 決定ログ ── `d99339d6`

`docs/FEATURE_RULES.md` に 2026-09-12 の項、原文のまま六つ。実装の状態も項ごとに
書いた。(a) と (d) は**既にそうなっていた**ことを読んで確かめた ──
(a) `langOpen()` が `goTab('profile')` で終わる（`www/core.js`）、
(d) `snsSearchesHTML('sns.saved', …, null)` で `drop` が `null` なので保存した
検索の行に × は描かれない（× は「最近の検索」のほう）。(e)(f) は未着手、どちらも
SQL が先。

### 回した検査 ── **ゲートは回していません**

| | |
|---|---|
| `plan-check` | 緑。赤を**二つの形**で見た（`langNew()` の呼び出しを外す／`ltStart()` の `can('letters')` を外す） |
| `again-check` | 緑（114 本）。赤を見た ── 写しを書く一行を外すと 5 本赤 |
| `store-check` | 緑。road を書く前は赤（それも見た） |
| `press` | 緑。`buttons pressed: 16753 (276/277)`、`never pressed (1): saveName` |
| 速いもの | 各 commit で `tools/pre-commit` が回している（es5・assets・dead・box・store・i18n ほか） |

**`press` の数は動いていません** ── 土台（`ed5146bb`）を別の worktree に出して
同じ検査を回し、**16753 (276/277)、never pressed も `saveName` 一つ**で同じで
あることを確かめました。`saveName` が押されないのは前からで、`r23` `r28` `r30`
の報告が同じことを書いています。

### 確認の段

```
CODE CONFIRMED   1・2・3・4 すべて。上の表のとおり
DEVICE 未確認    全部。実機では一つも押していません
OWNER 未確認     全部。写真は shots/r33-*.png の四枚
```

### リーダーへ ── 指示と違っていた所

1. **2 の指示が名指しした原因は本物でしたが、**それだけでは画面が変わりません
   でした。壁の二枚目（`dlCap()` が段の未回答で 0）が残っていたからです。
   **リーダーが 03:13 に「決めごとは既に出ている」と判断し、同じ枝で外しました**
   ── 下の § 追記。
2. **claim の文言を一度変えました。**「取った言語が一覧に出る」は壁の二枚目が
   残っているあいだ緑にできなかったので、`again-check` は当時そうである事
   ──「この端末に残って read と答える」── を主張していました。**追記のあと、
   一覧に出ることを主張する claim を足してあります**（両方あります）。
3. **`again-check` の既存 claim を一つ書き換えました**（`langTook()` が `null`
   → 2）。写しを置いた結果そうなるのが正しいと判断しましたが、これは既にあった
   主張なので、読んでおかしければ言ってください。
4. `tools/again-check.mjs` の「別のアカウント」の節は**ファイルの最後**に
   置いてあります。別アカウントで立ち上げ直す節なので、落ちた要求を積んだページ
   を次の節へ渡すと、その節の「ポップは一つ」が赤くなります（一度赤くしました）。

---

## 追記 ── 二枚目の壁も外した（リーダー 2026-09-12 03:13）

リーダーの判断：**決めごとは既に出ている**（OWNER 2026-09-12「前に読み込んだの
出していいよ」＋ 2026-09-11「未回答は free ではない」）。BACKLOG の提案どおりに
実装しました。commit 一つ。

**形（一覧の側に条件は足していません）。** 天井の一箇所が三つ目の状態を答えます
── `langCap()`／`dlCap()`（`www/core.js`）は `planKnown()` が偽なら `null`、
`langsSeen()`（`www/home.js`）は**天井が数の時だけ**畳む。足の「n hidden」は
畳んだ数から出るので自動的に消えます。

**天井は緩んでいません。** `langStop()` と `dlStop()` は**数を見る前に**段を
訊くようになりました（`capStop()`／`upStop()` が前からそうしている形）── 訊けて
いなければ「接続できません」で、**値段の頁へは送りません**。送っていたのが
それまでで、訊いてもいない相手に、既に買っているかもしれない物を売りに行って
いました。これは天井を緩める変更ではなく、締める側の穴でした。

**claim**（`again-check` の電波なしの節、赤→緑を見た）：

| | |
|---|---|
| 電波なしで取った言語が一覧に出る | 天井 `null`、足の hidden 無し。**赤**：天井を元に戻すと「天井は 0、足は 1 hidden」 |
| 天井は緩んでいない | ダウンロードも「言語を追加」も止まり、言うのは値段ではなく「接続できません」 |

**写真**：`shots/r33-offlist-{before,after}.png` ── 機内モード相当（偽サーバーを
落として開き直し）の言語の一覧。前は「自分の言語」が 1 本＋「非表示 1」、
「読んでいる言語」は「まだありません」＋「非表示 1」。後は自分の 2 本と、取った
「トキポナ」が並び、非表示の行は無し。（二本目の名前が「未設定」なのは、写真の
段取りが `langNew()` で作っただけで改名の画面を通していないからです。）

**回した検査**：`again-check`（緑、赤も見た）、`plan-check`、`dl-check`、
`acct-check`、`press`（16753、276/277 ── 動いていない）。**ゲートは回していま
せん。**

**`plan-check` について、見たままを書きます。** 「the launch after it asks
again」が**二回赤くなりました**。土台（`ed5146bb`）を別の worktree に出して
4 回回すと 4 回とも緑、こちらの枝でも**その後 3 回とも緑**、debug の print を
足した回も緑。天井を戻した 1 回も緑。**再現しません。**あの主張は起動のあとの
`waitForTimeout(700)` 一本に乗っていて、機械が混むと `verify-plan` の答えが
700ms に入らない、という形に見えます（赤の時の値は `plan()` が空＝
「まだ訊けていない」）。**検査の待ちには触っていません** ── 緩めると、この
主張が押さえている物まで一緒に緩むので。リーダーの判断を仰ぎます。

**まだ食い違っているもの（触っていません）。** 「天井は何も隠さない」
（`docs/DATA_MODEL.md` § 5・`langCap()` のコメント）と、`langsSeen()` が
**答えが来ている**時に畳むこと。別の決めごとなので `docs/BACKLOG.md` に一行
残しました。

```
CODE CONFIRMED   上の表のとおり。赤→緑を見た
DEVICE 未確認    実機では押していません
OWNER 未確認     写真は shots/r33-offlist-{before,after}.png
```
