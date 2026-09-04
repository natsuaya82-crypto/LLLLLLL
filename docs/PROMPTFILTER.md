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

## 三 ── お題のタグ `#今日のお題`

**この紙は二度書き直しました。いまの姿だけを書きます。**

**タグは決まった一つの名前で、読む人の設定言語で出ます。**

> 「#今日のお題だし そこに出せなんて頼んでないけど、ツイートの中だけど タグは」
> 「タグとお題一本化してってこと」
> 「今日のお題は翻訳もタグもその人の設定言語になるようにしてって頼んでるんだけど」
> OWNER 2026-09-04

入ったもの:

| 何 | どこ |
|---|---|
| タグの言葉、十言語 | `day.tag`（`www/i18n/*.js`） |
| タグを作る一箇所 | `dayTag()`（`www/sns.js`）── `'#'+t('day.tag')` |
| 打たれたタグがどのお題か | `dayTagId()`（`www/sns.js`） |
| お題で投稿を集める問い | `netFindPrompt()`（`www/net.js`）── **列**で集めます |
| 検索の一つの答えにタグの投稿 | `snsFind()` と `snsJoin()`（`www/sns.js`） |

**`#` は言葉の側にありません。**十箇所に書けば、十箇所目が全角になります。
`dayTag()` が一箇所で付けます。

**日本語以外の九つは私の訳です。オーナーに見せてください。**

```
en todaysprompt   es temadehoy    pt temadehoje   fr sujetdujour  de themadestages
it temadioggi     ru темадня      zh 今日题目      ko 오늘의주제    ja 今日のお題
```

**外したもの。**絞り込みの画面のタグの行と、`snsFil` がお題を持つ道。前の回で
足して、この回で消しました ──「そこに出せなんて頼んでないけど」。押す道が
無くなったので、持つ道も残していません（一つ足して一つ残す形にはしません）。

**お題の文はこれまでどおりです。**`daySay()` と `postSay()` が、サーバーの
十言語から読む人のものを出します。文とタグは別のもので、どちらも読む人の言語。

### まだ入っていないもの ── **投稿の中のタグ**

「ツイートの中だけど タグは」の半分がこれです。**入れていません。**

投稿の一行を描くのは `postRow()`、意味の行を出すのは `postSay()` ── どちらも
**`www/post.js`** です。この回の指示は「触るのは `www/sns.js` と
`www/i18n/*.js` だけ」なので、開いていません。

**`www/post.js` は最初に配られた持ち場には入っています。**そして
`git log --all -- www/post.js` に master の外の commit はありません ──
**いま誰も居ません。**一言いただければ、その日のうちに入れます。

**いま `dayTag()` を呼ぶのは検索だけです。**だから**タグはまだ画面のどこにも
出ていません。**スクリーンショットにも出ていません（`shots/feed-tag-ja.png`、
`feed-tag-en.png`）── 撮ったものに写っていないことを、写っていないと書いて
います。

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
