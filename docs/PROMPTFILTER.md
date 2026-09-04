# claude/find4 ── 触ってよいと理解したもの

`claude/find3` の続きです。**私が書き換えてよいと理解したもの:**

```
www/sns.js  www/post.js  www/net.js  www/shell.js  www/sync.js  www/boot.js
www/i18n/*.js
tools/find-check.mjs  tools/post-check.mjs  tools/fixture.mjs
docs/PROMPTFILTER.md   ← この紙
```

**触らないもの。**`www/settings.js` `www/import.js` `www/sheet.js`
`www/index.html`、`www/glyph.js` `www/phases.js` `www/core.js` `www/letters.js`。
`docs/FEATURE_RULES.md` `docs/STATE.md` `CLAUDE.md` はリーダーのもの。

**`www/act-map.js` はどちらの一覧にもありません。触っていません。**
`git log --all -- www/act-map.js` に `claude/eye` の未取り込みの commit が
一本あります ── **いま別のセッションがそのファイルに居ます。**

**取り込みはしません。**`master` を自分に入れるのだけ。
**ゲートは回しません** ── `npm run dead` `npm run find` `npm run post` と、
二秒で終わる速いものだけ。

---

# やったこと

## 一 ── `www/shell.js:73` の `snsMode`（**済み・push 済み**）

検索が「箱一つ、答え一つ」になったとき `snsMode` は消えました。画面が忘れる
所（`viewReset()`）の一行だけが取り残されて、宣言のない名前へ代入して
いました。行と、その行が指していたコメントの後半を消しました。
`npm run dead` 緑。

## 二 ── 小さい二つ（**済み・push 済み**）

**検索の履歴が黙って一つ減る。**同じ言葉をもう一度検索すると一番上へ動く
ときの動かし方が「消す」→「入れる」の二回で、間で電波が切れると消えた
ままでした。`Prefer: resolution=merge-duplicates` の**一本**にしました ──
行が存在しない瞬間が無くなります。`at` を本文に載せるのは、合流のとき
更新される列がそれだけだからです。`recent_edit`（`supabase/schema.sql`）は
前からその一本のために在り、`www/` の誰も使っていませんでした。

**同じ言語が一覧に二つ並ぶ。**`bootSession()` が `netLangsDown()` と
`netLangSync()` を続けて呼び、どちらも待っていませんでした。上げる道を
降ろす道の答えの中に入れました。**その言語が初めて上がる一回だけ**起こり、
起こったあとは消えません。既に二つ並んでいる iPhone はそのままです。

検査は `tools/twice-check.mjs`（新しい一本）。**`npm run` の名前と
`tools/gate.mjs` の行がまだありません** ── `package.json` と `tools/gate.mjs`
は持ち場の外です。いまは `node tools/twice-check.mjs` で走ります。
**どちらかをリーダーに足していただきたい。**

## 三 ── お題のタグ

**この紙の前の版は、タグを `www/i18n/` の新しい鍵 `day.tag` として配って
いました。消しました。**オーナーが 2026-09-04 に決め直しています ──
「お題はなってる／**タグとお題一本化してってこと。**」
（`docs/FEATURE_RULES.md` 決定ログ「お題のタグは、お題そのものが持っている
十言語から出す」）。

**タグの言葉は、お題の文そのものです。**サーバーの `prompt.says` が十言語
ぶんを持っていて、読む人の言語のものが出ます。タグはその同じ文に `#` を
付けたものです ── 日本語で読む人には `#今日はめちゃくちゃ暑い。`、英語で
読む人には `#It is unbearably hot today.`。**一つのタグ、十の言い方、
一つの答え。**

**`www/i18n/` には一文字も足していません。**足したら、同じお題の言葉が
二箇所に十言語ぶん在ることになります。

入ったもの:

| 何 | どこ |
|---|---|
| タグの言葉を作る一箇所 | `dayWords()` / `dayTag()`（`www/sns.js`） |
| 打たれたタグがどのお題か | `dayTagId()`（`www/sns.js`） |
| お題で投稿を集める問い | `netFindPrompt()`（`www/net.js`）── **列**で集めます |
| 絞り込みの四つ目の答え | `vFilter()` の行と `snsSetFil()`（`www/sns.js`） |
| 検索の一つの答えにタグの投稿 | `snsFind()` と `snsJoin()`（`www/sns.js`） |

**押す名前は `snsSetFil` のままです。**「いま何を見ているか」は一つの問い
で、その四つ目の答えなので、二つ目の仕組みを作っていません。だから
`www/act-map.js` に一行も要りませんでした。

### まだ入っていないもの ── 投稿の行のタグ

**投稿の一行一行に `#…` を描くのは入れていません。**押せる形にするには
`www/act-map.js` に `act('snsTagGo', snsTagGo);` の一行が要り、無いまま
`data-do` を書くと `act-check` が落ちます。**そのファイルは持ち場の外で、
いま `claude/eye` が居ます。**

押せない `#` を出すのは、前の版で報告した「押しても何も起きない 🔍」を
一つ増やすことなので、**入れていません。**一行が入った日に入れます。

**いまタグへ行ける道は二つ**です ── 絞り込みの行と、検索欄に `#` を打つ。

### 私の読み方（**間違っていたら言ってください**）

「一本化」を**タグの言葉＝お題の文**と読みました。決定の
`Affected data: 無し` がその読みを支えています ── 新しい列も新しい鍵も
無しに済むのは、この読みだけです。

**タグの文が長いと帯の角に入りきりません。**いまの見本（`#It is unbearably
hot today.`）は入っています。**見える言葉はオーナーのものなので、
長さの上限を切るかどうかは訊いてください。**

---

# 残り一行 ── 押しても何も起きない 🔍

前の版から変わっていません。**`www/act-map.js` に `act('snsGo', snsGo);`。**
いまは `actKey('snsGo', snsGo)` だけで、改行キーの表にしか載っていません。
私の側（`snsFieldHTML()` に `go:'snsGo'` を渡す一行）は、それが入るまで
入れられません。

# 絵を撮る道の欠陥（前の版から変わっていません）

`node tools/shot.mjs --lang ja --half` を付けても、**半端な状態の面は英語で
写ります。**`shot.mjs` が `hd@` の面ごとに `window.__seed()` を呼び直し、
`tools/fixture.mjs` の `seed()` が `SET.ui='en'` を書くからです。
`SET.ui` を `__seed()` のあとに入れ直せば直ります（一行）。
**`tools/shot.mjs` は私の持ち場ではないので直していません。**
オーナーに日本語の画面を見せる道なので、誰かの持ち物にしてください。

# 検索欄の下書きの文字

「さがす　@で人」。**2026-09-04 の決定で古くなりました** ── ふつうに打つと
人も投稿も出るので、`@` は「人だけ」の印ではありません。そして `#` が
増えました。十言語ぶんの言葉なので、**何と書くかはオーナーのものです。**
訊いてください。
