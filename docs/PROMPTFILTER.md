# claude/find3 ── 触ってよいと理解したもの

`claude/find2` の続きです。**私が書き換えてよいのは四本だけ**と理解しました:

```
www/sns.js
tools/find-check.mjs
tools/fixture.mjs
docs/PROMPTFILTER.md   ← この紙
```

**触らないもの。**`www/index.html` `www/shell.js` `www/act-map.js` `www/i18n/`
は claude/pop2、`www/net.js` `www/post.js` `www/rec.js` `www/card.js` は
claude/post3、`www/core.js` `www/letters.js` `www/backup.js` `www/sync.js`
`www/phases.js` は claude/keep3、`www/keyboard.js` は claude/kbfree3。
`docs/FEATURE_RULES.md` `docs/STATE.md` `CLAUDE.md` はリーダーのもの。

**取り込みはしません。**`master` を自分に入れるのだけ（入れました）。
**ゲートは回しません** ── `npm run find` と、二秒で終わる速いものだけ。

やること三つと、いまどこか:

1. `find-check` の赤三本を緑に ── **済み。**master に入りました。
2. お題のタグ `#今日のお題` ── 十言語で一つのタグ ── **私の側は
   `www/i18n/` と `www/post.js` 待ち。**下の表がその割り振りです。
3. 検索を一度で ── `@` と投稿は**済み**、`#` は 2 と一緒。

**待ち合わせ二つ。**`act('snsGo', snsGo)` が `www/act-map.js` に入れば 🔍 を
押せるようにします。`day.tag` が `www/i18n/` に入ればタグを出します。
どちらも claude/pop2 のファイルです。

---

# `#今日のお題` ── 決まったので、誰がどのファイルを持っているか

**2026-09-04、オーナーが決めました**（`docs/FEATURE_RULES.md` 決定ログ
「お題は #今日のお題。十言語ぶんで、どの言語で書かれていても同じ一つ」）。
**この紙の前の版は「三つのやり方」を並べたものでした。決まったので消しました。**

**十言語ぶんは、十個の別々のタグではありません。**一つのタグが読む人の言語で
表示され、日本語で書かれた投稿と英語で書かれた投稿が同じ一つのタグで一緒に
出てきます。

## 押して確かめたこと ── 仕組みは既に在ります

お題の行から書き始めた投稿には、**その日のお題の id が既に乗っています**。
測りました（`tools/find-check.mjs` の仕掛けで本物の `pwSend()` を通して）:

```
body.pr           = 'pr-1'     投稿の本体の中
prompt 列         = 'pr-1'     外の列にも
netRow(…).pr      = 'pr-1'     サーバーから戻ってきても残る
```

**つまり、タグを描くのに `www/net.js` は要りません。**どの投稿がどのお題に
答えたかは、他人の投稿でも、この iPhone に届いた時点で分かっています。
2026-08-23 の「繋がりはハッシュタグではなく列」がそのまま効いていて、
オーナーが今回足したのは**その列を目に見える一語にすること**です。

**だからタグは本文の文字ではありません。**本文に入れると書いた人が消せて、
言語ごとに割れます。決定が防いでいるのはそれです。

## 要るもの ── 四つ、持ち主は四人

| # | 何 | ファイル | 持ち主 |
|---|---|---|---|
| 1 | タグの言葉、十言語 | `www/i18n/*.js` | claude/pop2 |
| 2 | 投稿にタグを描く | `www/post.js` | claude/post3 |
| 3 | お題で投稿を集める問い合わせ | `www/net.js` | claude/post3 |
| 4 | 絞り込みと検索にタグを出す | `www/sns.js` | **私（claude/find3）** |

**4 は 1 と 3 が入るまで押せるものになりません。**押せない `#` を出すのは、
私がこの紙の前の版で報告した「押しても何も起きない 🔍」と同じものを一つ
増やすことなので、**入れていません。**

### 1 ── タグの言葉（`www/i18n/*.js`）

**新しい鍵を一つ。`day.tag`。**`#` は付けません（付けるのは描く側）。
日本語はオーナーの言葉そのままです。**残り九つは私の訳で、
オーナーの確認待ちです** ── 見える言葉はオーナーのものなので
（CLAUDE.md § Deciding）、そのまま入れずに一度見せてください。

```
en  'day.tag' : 'TodaysPrompt',
es  'day.tag' : 'TemaDeHoy',
pt  'day.tag' : 'TemaDeHoje',
fr  'day.tag' : 'SujetDuJour',
de  'day.tag' : 'ThemaDesTages',
it  'day.tag' : 'TemaDiOggi',
ru  'day.tag' : 'ТемаДня',
zh  'day.tag' : '今日题目',
ko  'day.tag' : '오늘의주제',
ja  "day.tag" : "今日のお題",
```

**`t()` は鍵が無いと鍵の名前をそのまま返します。**だから入るまでは画面に
`#day.tag` と出ます。**それが入る前にビルドしないでください。**

### 2 ── 投稿にタグを描く（`www/post.js`）

`postRow()` の中、投稿が `pr` を持っているときだけ。**`post.pr` から描く**
ので規則 8 も 12 も守れます ── 他人の言語を一文字も要りません。

```
'<button class="ptag"' + DO('snsTagGo', [p.pr]) + '>#' + esc(t('day.tag')) + '</button>'
```

**角丸も枠も足さないでください**（規則 18）。`.ptag` は文字だけで、色は
押せるものの色。新しい CSS が要るなら `www/index.html` は claude/pop2 です。

`snsTagGo` は `www/act-map.js` に `act('snsTagGo', snsTagGo)` の一行が要ります
（これも claude/pop2）。無いまま `data-do` を書くと `act-check` が落ちます。

### 3 ── お題で投稿を集める（`www/net.js`）

一本だけ。`prompt` は列で、索引が後ろに在ります（`supabase/schema.sql`）。

```js
function netFindPrompt(id, ok, bad, more){
  netGet('/rest/v1/post_seen?select=id,author,created_at,reply_to,body,hidden_at,author_out'+
         '&prompt=eq.'+encodeURIComponent(String(id||''))+
         '&order=created_at.desc'+
         (more? '&created_at=lt.'+encodeURIComponent(String(more)) : '')+
         '&limit='+NET_PAGE,
    function(d){
      var out=[], i;
      for(i=0;i<(d||[]).length;i++) out.push(netRow(d[i]));
      ok(out);
    }, bad);
}
```

**`netFindPosts()` を流用しないでください。**あちらは `body->>ln/mn/lname` の
文字合わせで、それでお題を集めると言語の数だけ割れます ── この決定が
防いでいるものそのものです。

### 4 ── 私の側（`www/sns.js`）

1 と 3 が入ったら、その日のうちに入れます。中身は決めてあります:

- `dayTag()` ── タグの言葉を作る**一箇所**。`'#'+t('day.tag')`。
- `snsFil` が言葉のかわりにお題の id も持てるようにする。いまは
  `{q, r}` で、`{pr, r}` を足す。**二つ目の仕組みは作りません** ──
  絞り込みは前から一つで、答えの形も `snsFilFind()` のままです。
- `vFilter()` に一行。「おすすめ」「フォロー中」の下、⭐️ の上に
  `#今日のお題`。押すとタイムラインがその日のお題の投稿だけになる。
- 検索の答えにタグの行。`#` で始まる言葉、またはタグの言葉そのもので
  当たる。人・投稿と同じ一つの答えの中に並びます。
- `tools/find-check.mjs` に検査。**先に書いて赤を見てから**。

---

# もう一件 ── 押しても何も起きない 🔍 ── 残り一行

お題とは別の話です。**オーナーの「検索してもツイート出てこないよ」の原因は
これでした。**検索の画面（下のタブの真ん中）の帯の中、検索欄の左端の虫めがねが
押せる形になっていませんでした。オーナーは 2026-09-03 に
「検索は🔍押したらって言ってるやん」と言っています。

**三箇所要ると書きました。二つは入っています**（2026-09-04 に確かめました）:

- `www/shell.js` の `searchBox()` が `opt.go` を取り、渡されたときだけ
  `<button class="lens">` になる ── **入っています。**
- `www/index.html` の `.search button.lens`（44×44、押すと金）── **入っています。**

**残りは一行です。`www/act-map.js` に `act('snsGo', snsGo);`。**
いまは `actKey('snsGo', snsGo)` だけで、改行キーの表にしか載っていません。
押すボタンから呼ぶには `act(...)` の行が要り、無いまま `data-do="snsGo"` を
書くと `act-check` が落ちます。**そのため私の側（`snsFieldHTML()` に
`go:'snsGo'` を渡す一行）はまだ入れていません。**入ったと聞いたその日に
入れて、`tools/find-check.mjs` で押さえます。

**🔍 の仕事は 2026-09-04 の決定で変わりました。**打つだけで人も投稿も出るので、
🔍 と改行キーに残っているのは**履歴に一件入れること**だけです。
「検索は🔍押したらって言ってるやん」はそこに効いています。

---

## もう一つ、小さいが同じ場所の話

検索欄の下書きの文字が「さがす　@で人」です。**これも 2026-09-04 の決定で
古くなりました** ── ふつうに打つと人も投稿も出るので、`@` は「人だけ」の
印ではなくなりました。十言語ぶんの言葉なので `www/i18n/` の十本、
私の持ち場の外です。**言葉づかいはオーナーのものなので、何と書くかを
訊いてください。**

## そして、絵を撮る道の欠陥を一つ

`node tools/shot.mjs --lang ja hd@N` を付けても、**半端な状態の面は英語で
写ります。**`shot.mjs` が `hd@` の面ごとに `window.__seed()` を呼び直し、
`tools/fixture.mjs` の `seed()` が `SET.ui='en'` を書くからです。
`SET.ui` を `__seed()` のあとに入れ直せば直ります（一行）。
**`tools/shot.mjs` は私の持ち場ではないので直していません。**
オーナーに日本語の画面を見せる道なので、誰かの持ち物にしてください。
