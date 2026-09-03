# 監査 4 ── 決定ログ 91〜113 件目と、コードの突き合わせ

読むだけの作業です。**`www/` `tools/` `supabase/` は一行も変えていません。**
このファイル一つだけのコミットです。

- 基準: `origin/master` = `36e65562`「規則の言葉を直す ── 修正ではなく書き換え」
- 行番号はすべてこのコミット時点のものです
- 検査は一つも回していません（`npm test` はリーダーのもの）

## 担当範囲の訂正

指示は「117 件のうち 91〜117 件目」でしたが、`docs/FEATURE_RULES.md`
§ Owner decision log の `### ` 見出しは **113 件**でした（204 行目から 3775
行目のあいだ）。したがって担当は **91 件目から 113 件目までの 23 件**です。

ログは新しい順なので、この範囲は**最も古い部分**にあたります。実際、
不一致の四件のうち三件は「新しい決定に置き換えられたのに、古い項目に
superseded の行が付いていない」という形でした。

数え直しの一行:

```
awk 'NR>=204 && NR<=3775 && /^### /{n++} END{print n}' docs/FEATURE_RULES.md
```

## 表

| # | 行 | 決定（短く） | 判定 | 場所 | 何が違うか |
|---|---|---|---|---|---|
| 91 | 3438 | 単語に 使用域・分野・語源・更新日 | 一致 | `www/wordsheet.js:1432` | — |
| 92 | 3449 | カードは `post.ink` から描く | 一致 | `www/card.js:857` | `card-check` が押さえている |
| 93 | 3462 | 言語は一人一つ、全プラン、値段ではない | **不一致** | `www/core.js:784` | 今は `FREE_LANGS=1, PRO_LANGS=3`。値段になっている |
| 94 | 3473 | 言語は失われない、復元は上書きしない | 一致 | `www/backup.js:246` | 決定文の「eleven slices」だけ古い（`SLICES` は 12） |
| 95 | 3486 | 無料は a–z `!` `?` と数字の 38 枠 | 一致 | `www/letters.js:491,531` | — |
| 96 | 3501 | 無料キーボードの面 | **不一致** | `www/keyboard.js:834,849` | 削除キーが 3 幅（決定は 2）、`!?` が左端に寄り改行キーが増えた |
| 97 | 3514 | 音を選ぶのは課金 | 一致 | `www/core.js:1318` | — |
| 98 | 3526 | アプリ内で打つキーボードは廃止 | 一致 | `www/keyboard.js:1504` | 残っているのは編集画面のみ |
| 99 | 3537 | 点線上にまっすぐ引いた線は補正しない | 一致（結果） | `www/glyph.js:1261` | 仕組みは入れ替わり、記録はコード註だけ。押さえるものが無い |
| 100 | 3549 | ページ遷移、戻るは一つ | 一致 | `www/shell.js:297` | `#sheet` の markup が残骸として残る |
| 101 | 3560 | 作文の＋を カメラ／ライブラリ／マイク の三つに | 一致 | `www/post.js:864`、`www/rec.js:203` | — |
| 102 | 3571 | 声は 30 秒、Documents のファイル、`localStorage` には入れない | **不一致** | `www/post.js:434` | 下書きが base64 の音声ごと `lingua.drafts` に入る |
| 103 | 3588 | 点々々は 削除・ピン・編集、編集は文と意味だけ | 一致 | `www/post.js:3084,2412` | — |
| 104 | 3605 | メニューは投稿の横 | 一致 | `www/post.js:3084` | — |
| 105 | 3620 | リプライを消したら 1 が戻る | 一致 | `www/post.js:3216`、`supabase/schema.sql:933` | 端末側もサーバー側も合っている |
| 106 | 3631 | 写真だけ・声だけでも投稿 | 一致 | `www/post.js:1362` | — |
| 107 | 3643 | プロフィールの言語行と言語のページ、既定は公開 | 一部が置き換え済み | `www/me.js:429`、`www/home.js:822,1179` | 「何を載せるか」の一覧が現行と違う |
| 108 | 3668 | 打ち込む欄は普通の文字 | 一致 | `www/shell.js:661` | — |
| 109 | 3685 | タイムライン上部の書く行、リプライは相手を見せる | 一致 | `www/sns.js:874`、`www/post.js:1161` | — |
| 110 | 3699 | 派生ラベルは九つ | **不一致** | `www/wordsheet.js:544` | 下の 111 に置き換えられている。印が無い |
| 111 | 3718 | 活用・派生を十二ずつ、自作可、丸い `?` のポップ | 一致（一点 **不明**） | `www/wordsheet.js:544,626` | ポップが `toast()` |
| 112 | 3740 | 各国の値段は App Store のものを出す | 一致 | `www/store.js:403`、`www/settings.js:794` | — |
| 113 | 3758 | プランの絵はこの端末のキーボード | 一致 | `www/settings.js:907` | — |

内訳: 一致 17、不一致 4、一部置き換え 1、不明を含むもの 1。
**「もう無い」（機能ごと消えている）は一件もありませんでした。**

---

# 不一致の詳細

書き換え案はどれも「条件を足す」形にしていません。**そのコードを消して、
書き直す形**にしてあります。ただし **93・96・110 はコードが正しく、書き
換えるのは決定ログのほう**です。実際にコードを書き換えるべきなのは 102 の
一件だけです。

## 93 ── 言語は一人一つで、値段ではない

**決定の一文**（`docs/FEATURE_RULES.md:3462`）:

> One language per person, on every plan. Not a price.
> Reason: there is no way to make a second anywhere in the app, so a plan
> promising more would promise a button that does not exist.

**コードが実際にやっていること**

`www/core.js:784`:

```js
var FREE_LANGS=1, PRO_LANGS=3;
```

`www/core.js:785` の `langCap()` が `has('pro')? PRO_LANGS : FREE_LANGS` を
返し、`langStop()`（`www/core.js:1040`）が上限に当たると `popAsk()` で
プラン画面へ送ります。そして「どこにも二つ目を作る道が無い」という決定の
理由そのものが、いまは成り立ちません ── `www/home.js:2044` の
`langAddRow()` が二つ目を作るボタンで、`2102` 行で言語一覧に出ています。
`www/act-map.js:127` が `act('langNew', langNew)` を結んでいます。

言語の数は、いまはプランで変わります。

**どう書き換えるべきか**

**コードは正しいので触りません。**置き換えたのはログの上のほうにある
2026-08-23「How many languages, how many keyboards, and two more
capabilities」と 2026-08-25「Making a second language ── where the door is,
and what it does」で、どちらも新しい決定です。

書き換えるのは `docs/FEATURE_RULES.md:3462` の項目のほうです。この
ファイルは 195 行目で「置き換えられた項目は言葉を残したまま superseded の
行を得る」と自分で決めているので、その形にします。無料が 1 のままである
ことは変わっていないので、そこは残ります。

なお `LANG_MAX` という定数は既に消えていて（`docs/FEATURE_RULES.md:3074`
がその経緯を書いています）、決定の Affected data 欄だけが名前を指し続けて
います。ここも同時に直る話です。

## 96 ── 無料キーボードの面

**決定の一文**（`docs/FEATURE_RULES.md:3501`）:

> One face. Digits above the QWERTY, `!` and `?` at the ends of the
> space bar, delete two keys wide. No second page.

**コードが実際にやっていること**

削除キーは 3 幅です。`www/keyboard.js:834`:

```js
      var d=kbKey('del'); d.w=3;
```

下段は `! ? space return` で、二つの記号は**左端に並んでいます**。
`www/keyboard.js:849-859`:

```js
  var sp=kbKey('sp'), ret=kbKey('ret'), bot=[];
  var end0=kbNamed(KB_ENDS.charAt(0)), end1=kbNamed(KB_ENDS.charAt(1));
  /* 1 + 1 + 6 + 2 = ten, the same as every row above. */
  sp.w=6; ret.w=2;
```

決定は「スペースバーの両端」と言っていますが、いまは両方とも手前側です。
「2ページ目なし」だけは今も守られています（`kbFixed()` は `lay` を一枚しか
返しません）。

**これはオーナーの新しい言葉によるものです。**どちらも `docs/CHANGELOG.md`
に記録があります:

- `docs/CHANGELOG.md:11765`「2があった分謎に隙間できたから無くして」── 削除キーが 3 幅になった理由
- `docs/CHANGELOG.md:12670`「改行入れるか無料も。！？スペース　改行」── 記号が寄って改行キーが入った理由

つまり **CHANGELOG には入ったが、決定ログには入らなかった**という形です。

**どう書き換えるべきか**

**コードは正しいので触りません。**`docs/FEATURE_RULES.md:3501` の Decision
の一文を、いまのオーナーの言葉どおりに書き直します ── 一面、数字は QWERTY
の上、`! ? スペース 改行` の下段、削除キーは 3 幅、二ページ目なし。
Reason 欄には上の二つの引用を足します。

CLAUDE.md も同じことを言っている箇所があります。§ what the free plan is に
「`!` and `?` are at the ends of the space bar rather than the tail of the
third row, with the delete two keys wide」という一文があり、これも同じ
理由で古くなっています。**決定を直すなら、この文も同じコミットで直る必要が
あります**（CLAUDE.md の「a change lands with every sentence it falsifies」）。

## 102 ── 声は `localStorage` に入れない

**この範囲で、コードのほうを書き換えるべき唯一の一件です。**

**決定の一文**（`docs/FEATURE_RULES.md:3571`）:

> Up to **thirty seconds** of the person's own voice on a post.
> It is written as a **file in Documents**, never into `localStorage`, and
> the post carries the file's name.

30 秒と、投稿がファイル名を持つことは合っています（`www/rec.js:44` の
`var VO_MS=30000;`、`www/rec.js:213` の `voKeep()`）。破れているのは
**「never into `localStorage`」**です。

**コードが実際にやっていること**

録った音は base64 のまま `PW.vo` に載ります。`www/rec.js:162`:

```js
    PW.vo={b64:(i>=0? s.slice(i+1) : ''), mime:mime||'audio/mp4', ms:ms};
```

下書きを保存すると、それが**そのまま**下書きに入ります。
`www/post.js:429-441`:

```js
function draftKeep(){
  if(!PW.ln && !pwPics().length && !(PW.vo && PW.vo.b64)){ toast(t('post.none')); return; }
  ...
  var d={id:PW.did || netUUID(), at:Date.now(), ln:PW.ln, mn:PW.mn, to:PW.to,
         pr:PW.pr||0, pics:pwPics(), vo:PW.vo||null, pv:!!PW.pv};
  DRAFTS.push(d);
  ...
  draftsSave();
```

`draftsSave()` は `www/post.js:378`:

```js
function draftsSave(){
  try{ localStorage.setItem(LS_DRAFTS, JSON.stringify(DRAFTS)); }catch(e){}
}
```

`LS_DRAFTS` は `www/post.js:372` で `'lingua.drafts'`。つまり 30 秒ぶんの
base64 音声が `localStorage` に入ります。

サーバーにも同じものが行きます。`www/net.js:2567` の `netDraftBody()` が
`id` 以外の全キーを写すので、`vo.b64` が下書き本文の JSON に乗ります。

**なぜ実害があるか。**`draftsSave()` は `catch(e){}` で例外を握り潰します。
WKWebView の `localStorage` に当たった時点で、**下書きは黙って保存されなく
なります**。画面には何も出ません。書いた人は保存したつもりで閉じます。
決定 102 が「never into `localStorage`」と書いた理由がまさにこれのはずです。

写真も同じ経路（`pics:pwPics()`）ですが、写真の扱いは 2026-08-13 の
「Posts ── how many photographs」と「the photograph on the composer」の
担当で、私の範囲外です。**声と写真は同じ穴なので、直すなら一緒に見るべき
だと思います。**

**どう書き換えるべきか**

条件を足す形（「大きすぎたら省く」など）にはしません。**投稿と同じ一本道に
します。**

いま投稿は既に正しい形になっています。`www/post.js:1404` の `pwSend()` が
`voKeep(PW.vo, ...)` を呼び、`voKeep()`（`www/rec.js:213`）が
`LinguaShare.keepVoice` でファイルを書き、`{f:name, ms:vo.ms}` ── **名前と
長さだけ** ── を返します。投稿にはそれが載ります。

下書きも同じにします。`draftKeep()` の `vo:PW.vo||null` を消して、
`voKeep()` を通してから `{f, ms}` を書く形に書き直します。そうすると
`localStorage` にもサーバーにも base64 は一切行かず、`voRemote()`
（`www/rec.js:238`）が既に持っている「ファイル名かサーバーのパスか」の
判別が、下書きにもそのまま効きます。**声の道が投稿と下書きで一本になり、
今の二本が一本に減ります。**

**ただし、ここには決まっていないことが一つあります。**下書きを送らずに
消したとき、書いたファイルをどうするか。投稿には答えがあって
（`www/post.js:3219` の `postDelGo()` が `voDropFile(vo.f)` を呼ぶ）、
下書きには無い。**これはオーナーの判断です**（`docs/FEATURE_RULES.md`
§ Deciding ── 保持と削除は決めるものではない）。私は決めていません。

## 110 ── 派生ラベルは九つ

**決定の一文**（`docs/FEATURE_RULES.md:3699`）:

> The nine: 過去形 · 未来形 · 進行形 · 完了形 · 複数形 · 否定形 · 命令形 ·
> 受身形, and no label.

**コードが実際にやっていること**

`www/wordsheet.js:544-545`:

```js
var FM_INF=['pst','prs','fut','prg','prf','neg','imp','que','cnd','cau','pas','pl'];
var FM_DER=['agt','ins','loc','act','qua','dim','aug','col','opp','adj','vrb','adv'];
```

活用 12・派生 12 に、`fmMine(g)` が返す自作ラベルが加わります。

**これは、すぐ下にある決定 111（`docs/FEATURE_RULES.md:3718`）が置き換えた
ものです。**コードは 111 に従っています。

**どう書き換えるべきか**

**コードは正しいので触りません。**`docs/FEATURE_RULES.md:3699` に
superseded の行を付けます。

ここで一つ書いておきたいことがあります。**110 と 111 は日付が同じ
2026-08-20 で、しかも新しい順の並びに逆らっています** ── 111 のほうが
新しいのに、110 の下にあります。上から読んだ人は 110 を新しいほうだと
取ります。superseded の行が要るのは、その並びのせいでもあります。

---

# 判定が「不明」のもの

## 111 の「ポップ」── トーストでよいのか

決定 111（`docs/FEATURE_RULES.md:3718`）はこう書いています:

> Every label we supply carries a small circled `?` beside the word itself,
> and it says one line and one example as a pop rather than opening a page.
>
> 「⭕️？にして少し小さめでポップとして出してほしい。で、文字の横に置いて」

**合っている部分**は確かめました。丸い `?` は `www/wordsheet.js:630` の
`fmQ()` にあり（`<span class="qo">?</span>`）、`fmRowHTML()` が単語のすぐ横に
置いています。供給ラベルにだけ付く点も `if(!f || fmOwn(f)) return '';` で
合っています。一行と一例の文言も `www/i18n/en.js:842` から `.d` / `.e` の
対で入っています。

**分からなかったのはここです。**`www/wordsheet.js:626`:

```js
function fmSay(f){
  if(!f || fmOwn(f)) return;
  toast(t('word.fm.'+f+'.d')+' · '+t('word.fm.'+f+'.e'));
}
```

出しているのは `toast()` です。このアプリには `popAsk()`（`www/shell.js:1387`）
という別物があり、画面の真ん中に出る「ポップ」と呼べるものが実在します。
オーナーの言う「ポップ」がトーストを指すのか、`popAsk()` の形を指すのかは、
**私には判断できません。**

コードの註（`www/wordsheet.js:615-624`）は「一行と一例、それで消える。
誰もページを読むことを選んでいないから」と書いていて、トーストを選んだのは
意図的に読めます。ただ、それは書いた人の判断であって、決定の言葉とは
別です。**推測で「一致」とは書きません。オーナーに一度見てもらう一件だと
思います。**

# 「もう無い」もの

**ありません。**23 件のうち、機能ごと消えているものは一件もありませんでした。

近いのは 98（アプリ内で打つキーボードの廃止）ですが、これは決定どおりに
消えているので一致です。`kbTapKey`（`www/keyboard.js:1504`）、`kbTapLay`、
`kbFlickLay` という名前が残っていて紛らわしいものの、中身を読むと全部
**キーボードを組む編集画面**のもので、打つためのものではありません。
`kbTapKey` は冒頭で `if(!kbEdit()) return;` と言っています。

# 押さえるものが無いもの

23 件のうち、明日壊れても何かが鳴るのは 7 件だけでした。96 だけは判定が
不一致ですが、**なぜ気づかれずに古くなったか**が同じ話なので並べてあります ──
`kb-check` はこの画面を見ていますが、削除キーの幅も下段の並びも見ていません。

| 決定 | 押さえている検査 |
|---|---|
| 92 カードは post.ink から | `card-check` |
| 94 バックアップと復元 | `backup-check` |
| 95 無料の 38 枠 | `kb-check` `migrate-check`（`LT_START` を読む） |
| 96 無料キーボードの面 | `kb-check`（行数とキー数だけ。幅と下段の並びは持っていません） |
| 105 リプライの数 | `post-check` |
| 106 写真だけ・声だけ | `post-check` `draft-check`（`pwHas`） |
| 112 各国の値段 | `plan-check`（`storeOff`） |

**何も鳴らないもの: 91・99・100・101・103・107・108・109・110・111・113。**

調べ方は、検査側からその決定の要になる名前を引きました:

```
cd tools && grep -rln "kbFixed\|VO_MS\|postMenuHTML\|fmLabel\|wldRow\|lnField\|kbShotHTML\|geLattice\|wdPutExtras" *.mjs
```

`VO_MS` `fmLabel` `wldRow` `lnField` `kbShotHTML` `geLattice` `wdPutExtras`
は、`tools/` のどのファイルにも一度も出てきません。

**とくに 99 を挙げておきます。**`www/glyph.js:1250` の註は、自分でこう
言っています:

> The old rule was that a snapped path is a staircase, so the traced shape
> was kept where the finger put it.

つまり決定 99 が書いた仕組みは**入れ替わっています**。結果として決定の
言う通りにはなっている（まっすぐはまっすぐのまま、斜めは斜めのまま）ので
判定は一致にしましたが、**入れ替えたことはどの決定にも記録が無く、コードの
註にしか書かれていません。**そして押さえる検査もありません。`round-check`
は ROUND ボタンを持っていて、この規則は持っていません。CLAUDE.md の言う
「a rule that nothing STOPS says so, in its own line」がまだ書かれていない
場所です。

# 範囲外の付記 ── 三箇所の古い註

私が最初に読んだのは `8dd3a80f` で、そのとき「`www/shell.js` の註が
`confirm()` を使うと書いていて、2026-09-01 の禁止と正面から食い違う」と
書きました。**その後の `b7e2d82d` で実体は直っていました。**私の読んだ
コミットに入っていなかっただけです。`prompt()` と `alert()` は消え、
`es5-check` が `confirm(` `alert(` `prompt(` で落ちるようになっています。

**ただし註のほうは三箇所残っています。**いずれもコメントだけで、コードは
既に `popAsk()` / `toast()` です:

- `www/core.js:1384`「confirm() and not a box of our own ... It is the same dialog wipeAll() asks with, it is drawn by iOS」── しかし直下の `capStop()`（`www/core.js:1391`）は `popAsk()` を呼びます
- `www/core.js:1409` 同じ文
- `www/shell.js:1429`「So it is confirm(), which is what capStop() has always used for the word ceiling」

読んだ人は註を信じます。**私の担当範囲の決定ではないので、直していませんし、
誰が直すかも決めていません。**リーダーの判断に置きます。

# やっていないこと

- コードは一行も変えていません。`www/` `tools/` `supabase/` に触れていません
- 検査は一つも回していません
- `docs/CHANGELOG.md` は書いていません（このファイルは報告であって、
  保存されるものを変えていないため）
- 他のブランチは merge も rebase も cherry-pick もしていません。枝は
  `origin/master` (`36e65562`) から切りました

---

**結果（2026-09-03）** ── 決定ログの 93・96・110 に superseded の印と今の姿を書き、102 の Implementation status を「入りました」に書き直しました（`docs/FEATURE_RULES.md` のみ）。93 を置き換えたのは 2026-09-02「ダウンロードは Plus から」で、make の上限は Free 1・Plus 1・Pro 3 です。

102 はリーダーがコードを書き換えました ── 録音の終わりにファイルを書き、`PW.vo` は `{f, ms}` だけ、`voPlayPW()` は削除、古い下書きは `draftOpen()` が置き換え、`draftDropGo()` がファイルを落とします。私が「オーナーの判断」として残した点はオーナーが答えました:「声は投稿上で再生できるよね？下書き消した時にはいらなくない？」

111 の「ポップがトーストである件」は**直していません**（画面の形はオーナーのもの）。分からなかったことをそのまま `docs/BACKLOG.md` に一項として立てました。同じ場所に、`CLAUDE.md` § what the free plan is の下段についての一文が古いままである件も立てています ── このセッションは二つの docs しか触れないためです。上の本文の行番号は `36e65562` 時点のもので、その後の master 取り込みでずれています。
