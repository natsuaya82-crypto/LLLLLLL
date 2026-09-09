# r10-hist ── 運営が復旧できる：部分ごとに直前 3 版

- 日付: 2026-09-09
- ブランチ: `claude/r10-hist`（`origin/integ-0905` の `e91be4e4` から）
- 元になった決定: OWNER 2026-09-09
  「運営が治せる仕様は欲しい。ユーザーが問い合わせてきた時に、アカウントの
  復旧ができるようにしたい、管理画面で」→ 残し方は**回数：部分（slice）ごと
  に直前 3 版**、「3 で実装して」。**日数ではない。**

## 何を作るか

1. **サーバー**：`slice` の update / delete の**前**に、今の `body` を
   `slice_hist` へ写す trigger。同じ `(language, kind)` で 3 版を超えたら
   一番古い行を消す（**唯一の自動削除** ── DELETE REVIEW を先に書く）。
2. **RLS**：`slice_hist` は `is_staff()` だけが select。誰も
   insert / update / delete できない（trigger は security definer）。
3. **RPC**：`admin_hist(handle)` で一覧、`admin_restore(language, kind, at)`
   で戻す。どちらも `security definer` で中で `is_staff()` を訊く
   （`post_hide()` schema.sql:2047 と同じ形）。
4. **アプリ**：設定の見出し 7 回タップの管理画面（`vAdmin`、`www/mod.js`）に
   「復旧」の行。handle を打つ → その人の言語 → 部分ごとに直前の版が最大 3 行
   （日時付き）→ 一行押して `popAsk()` → 戻す。戻した瞬間、それまでの「今」も
   版の一つになる（戻すのを戻せる）。
5. **端末に届く道**：戻した版が本人の次の起動で降りる。`netLangsWalk` の
   一本の中で決める。**二つ目の同期は作らない。**

## 二つの、書かれているものとの食い違い

**どちらもオーナーが今日しゃべった側が勝ちます**（CLAUDE.md「But stop only
when the owner has not spoken」）。ここに書き残すのは、後から読む人が
`docs/STATE.md` の古い勧めを読んで迷わないためです。

- `docs/STATE.md` § 4a 四「**戻す画面を、人に見せるか**」の勧めは「見せない
  ── 戻すのは運営だけ」。**今日の決定はその通り**（管理画面だけ、本人の設定
  には何も増えません）。食い違いません。
- `docs/STATE.md` § 4a 五「**戻すときは、言語まるごとか、一部だけか**」の
  勧めは「**まとめてだけ**」。**今日の決定は「部分ごと」**なので、この勧めは
  超えられました。§ 4a 五が心配していた「三日前に無かった文字を指している
  単語」は起こり得ます ── **運営が気をつけることになります**（その節が自分で
  そう書いています）。§ 4a 五は超えられた旨を書き直します。
- `docs/RECOVERY.md` 案A は表の名前を `slice_past(language, kind, no, body, at)`
  と書いています。**指示は `slice_hist(language, kind, body, at)`**。
  指示の名前で作り、`docs/RECOVERY.md` は触りません（案A は「承認されて
  いない案」の文書なので、実装が入った旨は `docs/CHANGELOG.md` と
  `docs/DATA_MODEL.md` に書きます）。

## 触ってよいファイル（リーダーが名指ししたもの）

```
supabase/schema.sql
supabase/setup.md
tools/rls-check.mjs
www/net.js          ← 末尾に足すだけ。既存の関数は一行も触らない
www/mod.js
www/act-map.js
www/i18n/*.js       ← 10 言語
tools/hist-check.mjs（新）
tools/gate.mjs, package.json, tools/fixture.mjs
docs/CHANGELOG.md, docs/DATA_MODEL.md, docs/STATE.md（§ 4a 五の一行）
docs/scope/r10-hist.md
```

**触らないもの:** `www/index.html`、`www/core.js`、`www/home.js`。
画面は**在る class だけ**で作ります（規則18 ── 角丸・枠・塗り無し、
`.btn.ghost`）。標準ダイアログ禁止、説明文禁止。

## 同時に走っている枝

`claude/r10-dl` が `www/net.js` の `netLangBack` / `netTakenDown` /
`netTakeGone` のあたりを触っています。**だから `www/net.js` は末尾に
`netHist()` と `netRestore()` を足すだけ**にして、既存の関数には触りません
（`netStaff` の隣の形に倣う）。merge が通ることが条件です。

## 走らせる check

- `npm run rls` ── `tools/rls-check.mjs` の CASES に足す：B は A の
  `slice_hist` を読めない／B は `admin_restore` を呼べない／staff は読めて
  戻せる／3 版を超えない。**先に赤を見る。**
- `tools/hist-check.mjs`（新）── 保存 4 回で版は 3 つ、一番古いのが無い／
  staff で戻すと slice が戻り、戻す前の「今」が版に在る／本人の端末で開き
  直すと戻った中身が出る／staff でない人は断られる。**先に赤を見る。**

`npm test` は回しません（セッションは回さない）。
