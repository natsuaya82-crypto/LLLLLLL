# Backlog

Things found and deliberately not done, with why. Nothing here is a bug that
loses somebody's work; everything here is safe to leave. It exists so that
"we know about that" is written down rather than remembered, and so that a
refactor, a feature and a rename never arrive in the same diff.

The order is the order to do them in.

## 文字を描く画面の道具の帯 ── 六つになって、説明の字が入りきりません

**2026-08-27 に測りました。直していません（`www/index.html` は別の
セッションのものです）。**

ズームで帯のボタンが四つから**六つ**になりました。`.gtools button` は
`flex:1 1 0` なので、390px の画面で一つ **85px → 57px**。`.gcap` は
`white-space:nowrap; text-overflow:ellipsis` なので、**入らない字は
切れます。**

390px、10言語、切れる説明の数（前 → 後）:

| | 前（四つ） | 後（六つ） |
|---|---|---|
| en · de · it · zh | 0 | 0〜3 |
| es | 1（Deshacer 89>86） | 4 |
| pt | 1（Preencher 99>86） | 4 |
| fr | 1（Tout effacer 123>86） | 4 |
| ru | 1（Очистить 90>86） | 3 |
| ja · ko | 0 | 1 |

**元から切れていた**のが四言語に一つずつ。**六つにして増えました。**
320px ではもっと増えます（一つ 45px）。

**印そのものは読めます** ── 帯は元々「細い印＋その下に小さく言葉」で、
言葉は補助です（`CLAUDE.md`「アプリ内に説明を書かない」）。押せる大きさも
落ちていません（実測 57×49、44 以上）。**壊れてはいませんが、字が
切れているのは見て分かります。**

**直すなら一行、`www/index.html` の話です。** 二案:

    案A 二行に折り返す（意味が全部読める。帯が少し高くなる）
        .gtools .gcap{white-space:normal;overflow-wrap:anywhere;
                      line-height:1.15;text-align:center}
        ── 今の nowrap/ellipsis を置き換える。2525-2526行目

    案B 六つのときは言葉を出さない（帯は低いまま。印だけになる）

**私は案Aを推します**が、帯の高さが変わるので**画面の寸法の話**であり、
`www/index.html` を持っているセッションとオーナーの決めることです。

## 作文画面の箱は、iPhone 14 で 44px ぶん狭いまま ── 直していません

**2026-08-27 に測って見つけました。直していません。**

`www/shell.js` の `--vvmin` は「この起動でいちばん狭かった見える高さ」＝
キーボードが上がっているときの高さで、作文画面の箱（`.view.fit`）の高さは
これです。**下げる方にしか動きません**（`if(h<vvMin) vvMin=h;`）。最初の値は
画面の 55% という当て推量なので、**キーボードが画面の 45% より小さい機種では、
当て推量が一度も本物に置き換わりません。**

| 機種 | キーボード | 実際に見える高さ | `--vvmin` |
|---|---|---|---|
| 390×844 | 336 | 508 | **464（当て推量のまま）** |
| 375×667 | 300 | 367 | 367（たまたま一致） |
| 320×568 | 260 | 308 | 308（本物） |

つまり iPhone 14 の作文画面は、**508 あるところを 464 で組んでいます。**
使っていない 44 はキーボードの上の帯の下にあり、帯には背景があるので
**穴は空きません。** 見た目は壊れていません。

**やらない理由:** 箱を高くすると、測って決めた寸法が全部動きます ── 書く欄の
162 の下限、返信のときの二つの欄、写真の帯。あれは実機を見ながら決まった
ものなので、**一度実機で見てから決めることです。** 直し方自体は一行
（当て推量は最初の本物で置き換える）ですが、それは振る舞いの変更です。

`www/shell.js` の `vvFit()` の上のコメントは、ここに書いてあるとおりに
直してあります ── 前は「最初に開いた時に当て推量が本物に置き換わる」と
書いてあり、それが今日測って崩れた文です。


## `press` の「一つの list は一つの高さ」の数は、同じコードで十ほど揺れます

**`buttons pressed` は揺れません。`lists measured` は揺れます。** `claude/kb6`
が一日のあいだに八回測った全部:

```
2379  2380  2381  2381  2381  2382  2390  2384
```

**この幅は「変更ぶん」ではありません。** 決定的なのは二つあります:

- ③（絞り込み）を stash した木と入れた木で、**どちらも 2381**。それなのに
  その前に取った基準値は 2379 でした
- 検索の行（`.search`）が実際にいくつ足すかを、`press` と同じ数え方で
  フィクスチャの全ての面について測ると **−1**。それを入れた回が 2390 と
  2384 です。**+8 も +2 も、その行のものではありません**

**この項目は最初「±2」と書いていました。読みが四つしか無かったからです。**
八つ目までで 2379〜2390、幅は十一。**過小に書いてあるほうが危ないので直しました** ──
「±2 を超えたから自分の差分のせいだ」と読まれるのが、いちばん困る間違いです。

原因は測り方にあります。`measureRows()` は
`if (!e.getBoundingClientRect().height) continue;`（高さが無いものは行ではない）
で数えるので、**その瞬間にまだ高さの付いていない要素が一つあると、その親の
グループが丸ごと数から落ちます。** 画像や font の乗り具合で前後します。

**書いておく理由:** `CLAUDE.md` はこの種の数を「誰かが意図して動かしたので
なければ動いてはいけない」ものとして扱っています。`buttons pressed` はそのとおり
ですが、**`lists measured` の揺れは説明のつく揺れであって、変更ではありません。**
知らないと、次のセッションが自分の差分の中に原因を探して見つけられません。

**帰属を取る方法は、この数を睨むことではありません** ── フィクスチャの面を
自分で描いて、`press` と同じ規則（一つの親の下で、同じ class を着た、高さの
ある兄弟が二つ以上）でグループを数え、変更の前後で差を取ることです。
一回ぶん、一分で出ます。上の **−1** はそうやって出しました。

**やらない理由:** 直すなら測る前に layout を待つ（`requestAnimationFrame` か
画像の `decode()`）ことになり、`tools/press.mjs` は kb6 の持ち物ではありません。
数が守っているもの（二つの高さの行）は揺れていません ── 揺れるのは**母数**だけです。


## 結合したキーを長押しで運ぶと、結合が黙ってほどけます

`claude/kb5` の縦結合が入った木で測りました。上半分（`h=2` の方）を別の行へ
運ぶと、**`h` も、下半分の `up` も消えます。** 下半分は一緒に動きません。

外しているのは `kbVFix()` で、これはバグではなく設計です ── 対が縦に揃って
いなければほどく、と決まっています。**運搬が「対が動いた」と言う手段を持って
いない**のが実際のところです。

**決まりました。「一緒に動く」です。**

> 「長押しの時は動くよ？ iPhoneのホーム画面と同じ ウェジットも2*2とかあるけど
> その分みんな動くでしょ？それと同じ」 **OWNER 2026-08-27**

塊のまま動き、周りがその分だけ場所を空ける。落ちる先は**二行ぶん**要り、
どちらかの行に空きが無ければ落ちない（2026-08-27 に入れた「満杯だと追加でき
ない」と同じ門を、二行ぶん訊くだけ）。一番下の行には落ちない。

**`kbVFix()` は一行も変えないこと。** あれは壊れた対をほどくのが仕事で、対を
壊しているのは運搬が下半分を置き去りにしていること。運搬が上下を一緒に動かせば
`kbVFix()` が見たときには対は揃っていて、ほどく理由がない。例外を足すのは、
一箇所で持っている規則に、それを知らない側から穴を開ける形になる。

**やらない理由 ── `master` に縦結合がまだ入っていないから。**
`kbVJoin` / `kbVFix` / `kbTall` / `kbShadow` は `claude/kb5` にしか無く、
`origin/master` の `www/keyboard.js` には一つもありません。**書く相手が居ない**
ので、`claude/kb6` では入れられませんでした ── それらを呼ぶコードを書けば
`dead-check` が「名前が何でもない」で赤になり（規則5）、検査も書けません
（対を作る `kbVJoin()` が無いので）。

**kb5 が master に入った日に、その枝の持ち主が入れられます。**

## `askLink()` の `extra` に、値を入れる呼び手が一つもありません

**消していません。消すなら別のコミットです。**

`www/assist.js` の `askLink(ask, extra)` / `askHead(extra)` は、呼ぶ側が自分の
材料を行の配列で渡せる口を持っています。**文法ページから呼ぶために開けたもの
です。**

その予定は 2026-08-27 に消えました ── 「あと、AIは単語だけでいいや」。
今この口に値を入れる呼び手は**一つもありません**: `askBtn` は受け取って渡す
だけで、`www/words.js` は `null` を渡します。

**これは `CLAUDE.md` が名指しで禁じている *we'll need this later* です。**
`dead-check` は関数と変数を見るので、引数一つでは赤くなりません ── だから
ここに書いてあります。

**やらない理由:** 消すのは refactor で、「a behaviour change, a refactor and a
rename never share a commit」。単語側の作り直しと同じコミットには入れられま
せんでした。リーダーの指示も「口そのものを壊す必要はない」です。

**消すときは三行**: `askHead` の引数と `if(extra)` の行、`askLink` の引数、
`askBtn` の引数。`tools/ask-check.mjs` は `null` しか渡していないので触りません。

## ~~AI に相談 ── アカウントを持っていない人は、外で止まります~~ ── 閉じました

**2026-08-27 のオーナーの決定で閉じました。** 押す前に、**どのアプリへ出て
いくのかが名前で**一行書いてあります ── 「ChatGPT に移動します」
（`www/words.js`、`t('ask.leave', t('ask.to.'+askWho()))`）。
「じゃあ遷移前にchatgptに移動しますみたいにすれば？」

**この項は一度、同じ日に開き直されました。** その一行が消されたと思って
いたからで、実際には消えていません（消したのは `claude/pw3` で、リーダーの
読み違いによる指示でした。同じ日に戻しています）。**閉じたままが正しい姿
です。**

残りは変わりません: ChatGPT のアカウントを持っていない人は、開いた先で
ログイン画面に当たります。`UIApplication.shared.open()` は相手が何を表示
したかを返さないので、**こちらには一件も届きません。** それは直せませんが、
**押す前に、どこへ出ていくかが名前で分かる**ようになったので、原因の
分からない状態ではなくなりました。

この一行は `CLAUDE.md`「アプリ内に説明を書くの禁止」の例外です。オーナーが
今日決めたもので、規則より新しいので勝ちます。最小限、一行だけ。
## メールの本文が repo の外にある ── 直せるかもしれないが、確かめていない

パスワード再設定のメールが長らくリンクで届き続けました。原因は
`supabase/setup.md` § 3 の押す一覧が `Confirm signup` で終わっていて、
`Reset Password` が散文にしか無かったことで、**そこは直しました**（両方が
番号付きの手順になり、`mail.md` も「二つある」と見出しで言うようになりました）。

**ただし根の形は残っています: メールの本文はダッシュボードの中にしかありません。**
repo には `supabase/config.toml` がなく、テンプレートを置く場所がありません。
だから「押されたか」を repo からは一切確かめられず、**ゲートに入れられる検査も
ありません** ── `mail.md` がそう書いているとおり、片方はここから読めないサーバの
上にあります。

### 候補: Send Email Hook でメールをこちら側に持ってくる

Supabase には認証メールの送信そのものを自分の関数に渡す仕組みがあるはずで、
それを使えば**本文が `supabase/functions/` に入り、テンプレートは無関係になります。**
前例はこの repo に二つあります ── `daily-prompt` と `appstore` は、どちらも
「鍵が電話に置けないから関数にした」という同じ理由で立っています。

**書いていません。確かめられないからです。**

- このセッションからは Supabase にも Supabase のドキュメントにも手が届きません
  （プロキシが方針で `CONNECT` を 403 にします）
- `docs/FEATURES.md` § 8 が `appstore` について書いた一文がそのまま当てはまります
  ── **「Check before building. Do not guess.」**。`appstore` はそれに従って
  先に Apple の API の形を確かめてから書かれました

### 作る前に確かめること

1. その仕組みが今の Supabase に本当にあるか。名前・有効化の場所
2. 関数が受け取る形に**6桁そのもの**が入っているか（`token_hash` だけでは
   アプリの `/auth/v1/verify` に渡せません）
3. 有効にすると**登録・再設定・招待・メール変更の全部**がこちらに来るのか。
   来るなら、書き忘れた種類のメールは**送られなくなります** ── ダッシュボードの
   テンプレートが直っていないより悪い
4. Resend の鍵を関数の環境に置く形（`daily-prompt` § 9-2 と同じやり方）

**3 が一番危ないので、そこを確かめずに有効化しないこと。**


## `press` の横幅が一度だけ落ちて、再現しません

**2026-08-27。直していません ── 何が起きたのか分かっていないからです。**

```
off the side: the digits, counted in three (out of room):
              the page 406 wide in 402 -- the screen pans sideways
```

`vLtset('num')`（数字の設定、base 3、無料、満杯）。**同じコミットでそのあと
二度緑**になりました。

測って分かっていること、三つだけ:

- その画面を**単体で描くと 402 に収まります**。はみ出している要素はゼロ
- `origin/master` の `www/` で `press` を回すと緑
- 落ちた枝が `www/` で触っていたのは `grammar.js` と `act-map.js` の一行で、
  どちらもこの画面を描きません

**「flake だ」と書くつもりはありません** ── `CLAUDE.md` が「flake は原因では
ない」と言っているとおりで、原因は分かっていません。書いてあるのは、次に出た人が
ゼロから測り直さずに済むようにするためです。

疑うなら幅ではなく**時間**だと思います。`press` は組み立てた直後に測るので、
まだ入れ替わっていない字面（フォールバックのフォント）で測れば数 px 広くなります。
確かめていないので、これは当てずっぽうです。

**もう一度出たら、それは本物です。** そのときは、落ちた画面の各要素の
`getBoundingClientRect()` をその場で出すところから始めてください ── 単体で
描いて測る道は、もう試して 402 でした。

## 疑問の作り方は七つあって、この app は二つしか書けません

**2026-08-27。§14 の疑問の章を作って分かりました。** 直していません ——
足りないものはどれも、決めるのがオーナーだからです。

`docs/GRAMMAR-V2-SPEC.md` §5:

```
方法は言語によって違う。
suffix / prefix / separate word / word order / particle / intonation / combination
Lingua 側が勝手に決めない。
```

| 書き方 | 書ける？ | 足りないもの |
|---|---|---|
| 語尾に付ける | ✅ | 語形の規則（`fm:'que'`） |
| 語頭に付ける | ✅ | 同上（`at:'start'`） |
| **別の単語** | ❌ | 置く枠。**否定には「否定の段」の `neg.not` があります。疑問には対応するものがありません** —— 疑問の段の枠は what/who/where…（疑問詞）で、「〜か」を置く場所ではない |
| **語順が変わる** | ❌ | エンジンに「疑問文ではこの順」を言う場所がない。`wordOrder` は言語に一つ |
| **助詞** | ❌ | 助詞の段の三枠は主語・目的語・渡す相手で、文全体に付く助詞ではない |
| **抑揚だけ** | ❌ | 書くものが無い（音の話）。**書けないことを書ける必要があるかもしれません** —— 「この言語は抑揚で訊く」は事実で、綴りは変わらない |
| 組み合わせ | ❌ | 上のどれかが二つ要る |

**黙って一通りだけ見せるのは、画面が指示書を狭めることになります。** なので章は
書けるものだけを出し、足りないことはここに書きました。

決めるのがオーナーなのは、たとえば:

- 「〜か」を置く枠を**疑問の段に足す**のか、**助詞の段に足す**のか。どちらにも
  理屈があります（疑問の一部／文に付く助詞）。**両方に置くと二箇所が同じことを
  言います**
- 語順が変わる言語をどう書かせるか。`wordOrder` が言語に一つである前提を
  変える話で、エンジンの形に関わります
- 抑揚だけの言語に、綴りの変わらない「規則」を書かせるのか

## 場所を名詞の側に印として付ける言語が、まだ書けません

**2026-08-27。§14 の場所の章を作って分かりました。**

`docs/GRAMMAR-V2-SPEC.md` §7 は三通り挙げています:

```
house in    ✅  場所の語を後ろに
in house    ✅  場所の語を前に
house-LOC   ❌  名詞の側に印として付ける
```

最後の一つが書けません。**エンジンは聞き取れます** —— `morphology.js` の
`CASE_ROLE` が `LOCATIVE:'PLACE'` と `ABLATIVE:'SOURCE'` を知っています。
書く場所がないだけです:

- 助詞の段の枠は**主語・目的語・渡す相手**の三つ（`GCASE` in `www/grammar.js`）で、
  場所も出どころもありません
- 語形の規則（`FM_INF`）にも格がありません（下の項）

**枠を足すのはオーナーの判断です**（下の `FM_INF` の項と同じ理由で、
助詞の段と語形の規則の**両方に置くと二箇所が同じことを言います**）。

そして助詞の段に場所を足す場合、もう一つ決めることがあります:
**場所の段には既に「に」「から」の語があります。** 同じ言語が「に」という語と
「場所の印」の両方を持てるべきか、どちらかなのか。文法としてはどちらもありえます。

## 名詞の章に「格」が二通りで入りうること

助詞（主語・目的語・渡す相手）は助詞の段で作れます。語形の規則にも格を足すと
（`FM_INF` の項、下）**同じことが二箇所から書けるようになります。** 名詞の章は
今どちらも同じ行の形で出すので、画面上は区別がつきません。

`FM_INF` に格を足すかどうかを決めるときは、この重なりも一緒に見てください。

## `adapter.save()` は書かれていて、まだ誰も呼びません

**これは死んだコードではありません。消さないでください。**

`www/grammar-engine/adapter.js` の `save()` は、言語の模型を
`langKey('gram2')` に書きます。呼び手はゼロです。読む側は入っています ──
`gModel()`（`www/grammar.js`）が保存された模型があれば `load()` して使い、
無ければ `fromLegacy()` に落ちます。だから今日はどの言語も今までどおり答えます。

**呼ぶのは、辞書を指さない何かを人が書けるようになった日です。**

理由は `grammar.js:90` が前から書いていることの一般形です:

> a second place saying what the words are, and the two would part company the
> first time somebody added a word

模型の八枠のうち、**辞書を指しているものは保存できません**:

| 枠 | 中身 | 保存できるか |
|---|---|---|
| `words` | 辞書そのもの | ❌ |
| `grammarRules` | `'hw:<見出し語>'` を持つ | ❌ その語の名前が変わった日に指し先が消える |
| `inflections`（助詞から） | `form` は助詞の**綴り** | ❌ その語を書き直した日に古いまま残る |
| `morphemes` `derivations` `wordOrder` | 品詞と綴りしか持たない | ✅ |

**今アプリの中に、右列を人が書ける場所はありません。** 助詞も活用も、辞書の語か
`STG` から作られる眺めです。だから保存する側は作っていません ── 入れ物を先に作って
中身をあとから探すのは `CLAUDE.md` の五つの禁じ手の一つ（*we'll need this later*）
です。リーダーが 2026-08-27 に自分の指示を取り下げてこの形になりました。

`gram2` は `SLICES`（`core.js`）に前から入っているので、書き始める日に足すものは
ありません ── バックアップも言語同伴も既にあります。

## `FM_INF` に格を足すと、既にある言語の語族の並びが変わります

**2026-08-26 に見つけて、止めました。オーナーの判断が要ります。**

助詞（主語・目的語・渡す相手）は文法の段で作れるようになりました。**単語側**の
語形の規則（`www/wordsheet.js` の `FM_INF`、`STG.fm`）には格がありません:

```
FM_INF = pst prs fut prg prf neg imp que cnd cau pas pl
                                    ↑ 格が一つも無い
```

`fm` は「何の形か」（過去・複数・受身）で、「文の中で何の役か」ではありません。
`ga` を**語形の規則として**書きたい人は、今は書けません。

**足すと何が動くか。データは一バイトも消えません。動くのは並び順です。**

`fmRank()`（`wordsheet.js:560`）が語族の並びを `FM_INF.indexOf(f)` で決めています。
配列に足すと添字が動くので、**既に語族を持っている言語で、単語ページの語族の並びが
変わります。** 末尾に足せば既存の12個の添字は動きませんが、格が過去形や複数形の
**後ろ**に並びます。頭や途中に入れれば、既存の語が並び替わって見えます。

- どこに入れるか（頭／末尾／格だけ別の group）
- そもそも語形の規則に格を入れるのか、助詞（文法の段）だけにするのか

**両方に置くと二箇所が同じことを言います** ── この repo が一番よく噛まれる形なので、
どちらか一方だと思いますが、決めるのはオーナーです。
## 画面で書いた線が、編集できる中心線ではなく形で入る

**見つけたのは sheet3、2026-08-27。ゲートは緑。これは決めたことの積み残しです。**

`docs/FEATURES.md` § write の表はこう決めています ── **開いたパス**（iPad や
iPhone の Ink 注釈、線のまま描かれた PDF）は**中心線**として入り、**編集できる**。
塗られた閉じた形と画素は**形**として入り、編集できない。

**今は画面の道も形で入ります。** `renderPdf` がページを絵にするからで、Ink 注釈は
画素になって届きます（`lt.sh`。太い細いは注釈が持っていた分だけ残る）。

**注釈の `/InkList` を直接読めば電話は一切要りません。** そこが惜しいところです。
できない理由は一つで、**inflate が要る**こと ── Markup が保存した PDF は
オブジェクトを圧縮オブジェクトストリームに入れて持ち、`www/sheet.js` は ES5 で
依存も無く、それを解く手段がありません。`DecompressionStream` は iOS 16.4 から
なので、「その人がすでに持っている iPhone」という前提と合いません。

**やらなかった理由:** ES5 で inflate を書くのは 200 行の別の章で、一コミット
一事に収まりません。今の道（PDFKit で絵にする）は動きます。

## 列を消すと、文字キーが幅0.5 で残ることがある

**2026-08-27 に測って見つけました。直していません ── オーナーの判断が要ります。**

`kbDelCol()` は、その列に**半分しか掛かっていない**キーも、掛かっている分だけ
細くします。無料 QWERTY の3行目（`gap:0.5 / 文字9個 / gap:0.5`）で列0を消すと:

```
前   gap:0.5  lt:1  lt:1 ... lt:1  gap:0.5
後   lt:0.5   lt:1  lt:1 ... lt:1  gap:0.5
```

**先頭の文字キーが幅0.5 になります。** 390pt の端末で **14pt** ── 押せません。
中央寄せしても直りません（行の合計が他と揃っていて、余りが無いため）。

**同じ日の決定と並べると、ちぐはぐに見えます。** 2026-08-26 の決定で、
半分しか掛かっていないキーは**選ばれなくなりました**。それなのに削除では
削られます。ただしそれは矛盾ではなく、**二つの別の問い**です ──
選択は「このキーはこの列で出来ているか」、削除は「このキーは何列ぶん削られるか」。
オーナーの原文も削除が効き続ける前提です（「削除して中央揃えした場合…」）。

**決めるのはオーナーです。** 半分掛かったキーは:

- **今のまま** 半分を差し出して 0.5 になる（押せない幅が生まれる）
- **丸ごと残る** ── その行だけ列1つ分短くならず、他の行と揃わなくなる
- **丸ごと消える** ── 人の置いたキーが消えるので `docs/DATA_SAFETY.md` に触れる

`press` は捕まえません ── キーボードのキーは**高さだけ**で 44pt を測るからで、
それは rule 19 が「10キー横並びは 35pt になる、それが QWERTY だ」と決めたため
です。幅の下限はどこにもありません。

## ~~パターンから作ったキーボードには、段の上限が効いていない~~ ── 直しました

**2026-08-27、`claude/kb3`。** 面に分けました。`docs/CHANGELOG.md` に全部あります。

三つ挙がっていた道のうち二つは、書いてみたら規則が既に禁じていました ──
**切る**は人の作った文字を落とすので `docs/DATA_SAFETY.md`、**断る**は画面に
説明文を書くので禁止。**残ったのは面に分ける一つで、決定ではなく引き算の
結果でした。** オーナーには訊いていません。

`kb-check` は 26/60/105/150/300 字と子音 3/8/14/24 で測り、どの面も上限以下・
文字は全部残る・どの面にも行き来のキーがある、を見ます。赤は三通り見ました。

## 規約とプライバシーポリシー ── リンクは在るが、ページが無く、道も無い

三つ別の話で、リリース前に三つとも要ります。**リリースを止めるのは二つ目です。**

### 1. 押したら Safari に出る（これは大丈夫）

`www/settings.js:39` の `docRows()` が二本、`<a target="_blank" rel="noopener">` で
`DOC_TERMS` / `DOC_PRIVACY` を指しています。

Capacitor 8 の実物の Swift を読んで確かめました
（`node_modules/@capacitor/ios/Capacitor/Capacitor/WebViewDelegationHandler.swift`）:

- `decidePolicyFor`（107-113行）が「自分のアプリの URL ではない・最上位の遷移」を見て
  `UIApplication.shared.open(url)` → **Safari に渡し**、webview 側は `.cancel`
- `createWebViewWith`（328行）も同じことをする

**確認メールのリンクが着地できなかった件（`docs/keyboard-extension.md` の教訓）とは
別の話です** ── あちらはアプリに戻ってくる必要があり、こちらは出ていくだけ。

### 2. Lingua 用のページが無く、**別アプリ用のものが二本ある** ← 審査で止まる

```
https://tokinets.com/lingua/terms.html      -> 404
https://tokinets.com/lingua/privacy.html    -> 404
```

**OWNER 2026-08-26: 「まだ無い / 404」。** サイトの repo
（`natsuaya82-crypto/tokine2`、Vercel で tokinets.com、`559dee1`）を読んで、
なぜ 404 なのかと、**何が在るのか**が分かりました:

- **`lingua/` の中は `index.html` 一つだけ。** Lingua の紹介ページで、リンクは
  `/` と X だけ。規約へもプライバシーへも行かない
- `vercel.json` は `cleanUrls` と `trailingSlash` だけ。**`/lingua/…` を直下へ
  振り替える書き換えは無い**
- 直下に `terms.html` と `privacy.html` が在るが、**どちらも Lingua のものでは
  ない**

**ここが危ない所です。** 直下の二本は流用できそうに見えて、できません:

- `terms.html` の題は **「利用規約 | JPEL Manager」** ── 別製品
- `privacy.html` は「§1 はじめに 本ポリシーは、刻音…が開発・提供するアプリケーション
  における情報の取り扱いについて説明します。**本アプリには「JPEL Manager」が
  含まれます。**」

そして中身が Lingua と真逆を宣言しています:

| privacy.html が言っていること | Lingua の実際 |
|---|---|
| 「**メールアドレス**など…求めることはありません」 | メールでアカウントを作る |
| 「§2 端末内にのみ保存 … サーバーへ送信されることはありません」 | 言語も投稿も Supabase に載る |
| 「§4 本アプリは Google **AdMob** による広告を表示します」「IDFA」 | 広告は一つも無い。IDFA も触らない |

**`Lingua` という語は二本のどちらにも一度も出ません。** Lingua を名指ししている
html は `index.html` `works.html` `lingua/index.html` の三つだけ。

**流用したら、審査に落ちるより先に事実と違う申告になります。**
`docs/apple.md` §5 の「App のプライバシー」欄は、メールアドレスとユーザー
コンテンツを収集すると書く前提です。JPEL のポリシーはその逆を宣言しています。

**書きました。`natsuaya82-crypto/tokine2` の枝 `claude/lingua-legal`**（`5f3b5d6`）に
`lingua/terms.html` と `lingua/privacy.html` を英語で置いてあります。**まだ `main` に
入れていないので、tokinets.com には出ていません** ── 押した瞬間に Vercel が本番へ
出すので、公開はオーナーの判断です。

`cleanUrls: true` なので `/lingua/terms.html` は `/lingua/terms` に 308 で飛びます。
**アプリ側の URL は一文字も変えなくてよい。**

中身はこの repo から採った事実だけで書いてあります（推測なし）:

| 書いたこと | 出どころ |
|---|---|
| 写真と音声は**誰でも読める**バケットに入る | `schema.sql` の `post-media` が `public=true`、`media_read` が `using (bucket_id='post-media')` |
| サーバに載るもの | `schema.sql` の profile / language / slice / post / react / follow / block / report |
| パスワードは受け取らない | 認証は Supabase、返ってくるのはトークン |
| 広告・IDFA・解析は無い | `www/` と `ios/App/App/` に AdMob も IDFA も解析 SDK も一件も無い |
| 販売者は Apple、カード情報は来ない | `LinguaStore.swift` は `Transaction` しか見ない |
| プランは「できること」だけを決め、あるものには触らない | `docs/PAID_FEATURES.md` と `plan-check` |
| アカウント削除はファイルを先に消す。**通信が失敗したら残ることがある** | `netDropMe()` と、その上のコメント |

**オーナーが決めたこと（2026-08-26）**: 名乗りは `Tokine (刻音)` だけ ── **法人ではない**
ので、`company` `corporation` を意味する語は二本とも 0 件。連絡先は
`lingua@tokinets.com`。

**まだ決まっていないもの**: 準拠法と裁判管轄。今は「日本法・東京地裁を第一審の
専属的合意管轄、ただし居住国の消費者保護法が与える権利は奪わない」と書いてあります。
**これは私が置いた既定値で、オーナーが確かめる所です。**

**日本語版はありません。** オーナーの指示は「それぞれ英語版で作って欲しい」でした。

`docs/apple.md` §5 が書いているとおり、**App Store Connect のプライバシーポリシー
URL は必須**で、無ければ審査に落ちます。アカウント（メール）と投稿を Supabase に
置いているので、これは避けられません。

⚠ **このセッションからは URL を叩けません。** エージェントのプロキシが方針で
CONNECT を 403 にします（`example.com` でも同じ 403 なので、サイト側の話では
ありません）。DNS だけは通り、`tokinets.com` → `216.198.79.1`。
**確かめる人はブラウザで開いてください。**

### 3. ログアウト中はそこに行けない ← 2026-08-26 に入れた退行

`docRows()` を呼ぶのは**一箇所だけ**（`settings.js:292`、アカウントの部屋の一番下）。
そのすぐ上のコメントはこう書いています:

> Under both faces of the room, because somebody who has never signed in has to
> be able to read them too.

**アカウントの部屋のサインアウト側の顔が、読める道でした。**
同じ日に入った「ログアウト中は扉だけ」（`appIs()` in `www/shell.js`）が塞ぎました。
`act-check` の主張がそのまま証拠です ── `signed out: 38 routes asked, every one of
them the door`。`set` も扉になります。

**扉には二本とも一行もありません**（`www/onboard.js` に `DOC_` は一つも無い）。
`?` のヘルプも持っていません。つまり **アカウントを作る人は、同意する相手の文面を
読めません。**

**決まりました。退行ではなく仕様です。** OWNER 2026-08-26:
「ログアウト中は見れなくていいでしょ？ログインしたら設定から見れるし」

**直すものはありません。** 扉に二本を足すことも、`appIs()` に例外を作ることも
しません。読める道は設定 → アカウントの一番下、一箇所だけ。
決定ログは docs/FEATURE_RULES.md。

`www/settings.js` に立っていた「Under both faces of the room, because somebody
who has never signed in has to be able to read them too」の二箇所は、この決定で
嘘になったので消しました ── CLAUDE.md「決定が規則を置き換えたら、同じコミットで
規則を直せ。直すとは消すこと」。

### 4. 特定商取引法に基づく表記 ── **出さない**（OWNER 2026-08-26）

`www/` `docs/` `supabase/` `ios/` を全部見て、`特定商取引` `特商` `tokushoho` は
一件も出ません。アプリが持っている外部文書は `DOC_TERMS` と `DOC_PRIVACY` の
**二本だけ**です。`docs/apple.md` にも EULA・販売者・返金の節はありません。

構造として（法律の判断ではありません）: **App Store の課金は販売者が Apple**
（日本では iTunes K.K.）で、購入契約の相手も返金の窓口も Apple です。App Store
Connect が特商法のページを訊いてこないのはそのため。必須で訊くのはプライバシー
ポリシー URL だけで、EULA は任意（出さなければ Apple の標準 EULA）。

**OWNER 2026-08-26:「出さない。」** 決まりました。三本目の `DOC_` は作らず、
`docRows()` は二本のままです。決定ログは docs/FEATURE_RULES.md。


## ⑯⑰ 扉の下半分がキーボードの下に隠れる ── `www/index.html` の `.ob`

実機 #92 の⑯「ログイン画面が固定のはずがスクロールする」と
⑰「パスワードをお忘れですか？が押せない」。**ブラウザでは再現しません。**
四つの画面寸法で測って、扉はどれにも収まっています:

| 画面 | 扉の高さ / 画面 | 一番下の要素 | 「お忘れですか？」 |
|---|---|---|---|
| 320×568 | 568 / 568 | 557（内） | 310..354 |
| 375×667 | 667 / 667 | 654（内） | 400..444 |
| 390×844 | 844 / 844 | 827（内） | 448..492 |
| 402×874 | 874 / 874 | 857（内） | 452..496 |

`.ob` は `height:<画面>px; overflow:hidden`、`body` は `height:<画面>px`。
**はみ出しは 0 で、スクロールできる余地も 0 です。**

**キーボードを足すと説明がつきます。** iOS でキーボードが上がっても*レイアウトの*
viewport は縮まないので、`.ob{height:100%}` は画面ぶんのままで、下の方は
キーボードの下に入ります。そして `overflow:hidden` なので**スクロールで届きません**:

| 画面 | キーボード後の可視下端 | 隠れるもの |
|---|---|---|
| 320×568 | ~308 | **「お忘れですか？」310..354**、Apple、Google、登録 |
| 375×667 | ~363 | **「サインイン」352..396 が半分**、**「お忘れですか？」400..444**、以下全部 |
| 390×844 | ~509 | Apple 544..596、Google、登録 |

小さい方の二機種では**「サインイン」ボタン自身が半分隠れます。** ⑯の
「固定のはずがスクロールする」も同じ所から出ているはずです —— iOS は
`overflow:hidden` でも、焦点の当たった欄を見せるためにページごと動かします。

**やっていないこと、と理由。** 直すのは `www/index.html` の `.ob` で、
**あの一本は別のセッションが持っています**（全画面の CSS が一本に入っている
既知の地雷で、同時に二人入れてはいけない）。ここに数字だけ置きます。

**確かめられていないこと**: キーボードの高さは机上の値（216/260/291pt に
アクセサリ 44pt）です。**実機で測っていません。** 直す人は実機で測ってください。

## ㉑ `∧ ∨ ✓` の帯は CSS からも JS からも消せない ── Swift の話

投稿画面の入力欄の上に出る `∧ ∨ ✓` の帯は **iOS 自身の入力アクセサリ**で、
web view の外にあります。**リーダーが試して、届きませんでした。**

唯一の道は `ios/App/` の Swift で web view の `inputAccessoryView` を潰すことです。
**書きました** ── `hideFormAccessoryBar()` in `ios/App/App/MainViewController.swift`
（`claude/bar`、2026-08-27）。`docs/reports/bar-2026-08-27.md` に調べが全部あります。
**`COMPILE CONFIRMED` も `DEVICE CONFIRMED` も未**なので、この項目は
実機で見るまで閉じません。

### ⚠ の答え ── 「キーボードを下ろす手段まで消えないか」は、消えません

**2026-08-27 に調べました。この一行がこの項目の宿題でした。**

- **投稿画面では、`✓` はもともと効いていません。** `pwKeepKb()` / `pwKbGuard()`
  (`www/post.js:916`) がフォーカスを外されると戻します。そのコメント自身が
  こう書いています ── *「It goes down by the field losing focus, and there is no
  key on an iPhone that does anything else -- so putting it back is the whole of
  『it cannot be lowered』」*。**引き継ぎ ②㉑ の「キーボードが下ろせる」への
  答えが、これでした。**だから帯を消しても、この画面で失うものはありません。
- **それ以外の画面**（単語、検索、設定の名前、サインインの扉）では、
  フィールドの外を触れば下がります ── どの web view でもそうなる普通の道です。

### 「カメラの行がキーボードに貼り付かない」は、これと同じ一件でした

`--vvkb` (`www/shell.js:663`) は visualViewport の下に残った高さで、そこには
**キーボードとこの帯の両方**が入っています。`.view.fit .pwbar{bottom:var(--vvkb)}`
はそれに貼り付いているので、**帯が消えれば行はキーの上に降ります。**
`www/index.html:1069` のコメントが既に名指ししていました ──
「その隙間と、その下の iOS 自身の accessory bar が、行が浮いていた元」。
**`www/` 側に直すところはありません。**


## `press` の `lists measured` は走るたびに動く ── ラチェットに使えない

`press-check` が出す数のうち **`rows in one list are one height: N lists
measured` だけが決定的ではありません。** 同じコミット・同じ木で三回回して:

```
2292   2286   2289
```

同じ回の他の数は一つも動きません ── `screens built 685`、`classes worn 588,
styled and unworn 4 (baseline 4)`、`photographs 82`、
`buttons pressed 10790 (234/234)`。差はちょうど3の倍数なので、**ある画面が
回によって3つ並びを出したり出さなかったりしている**のだと思われますが、
どの画面かはまだ見ていません。

**なぜ書き留めるか。** CLAUDE.md は `buttons pressed` について
「a number nobody may move by accident」と書き、`docs/HANDOVER-2026-08-26.md`
§4 は `rows in one list 2277 lists measured` を同じ表に並べています。
**並べてよい数ではありません。** 次の人が 2277 と 2289 を見比べて
「12 動いた、何が動かした」を探すと、答えの無い問いを追うことになります。

**検査そのものは緑です。** 見ているのは「一つの親の下で、一つのクラスを着た
兄弟が二つの高さ・二つの字の大きさで出ていないか」で、それはどの回も held。
壊れているのは**数えている母数**だけです。

**やっていないこと**、と、その理由: 原因は `press-check` の中か、そこが呼ぶ
非同期（画像・ネットのスタブ）のどちらかで、**束ねる仕事の外**です。
直すなら「数が動く原因を潰す」か「その行から数を外す」かで、後者は検査を
弱める側なので、これは決める人のものです。

**先にやること**: `docs/HANDOVER-2026-08-26.md` §4 の表から
`rows in one list` の数を外すか、「この数は動く」と添えること。
そうしないと、次の統合が偽の手がかりを一つ持って始まります。


## ~~新しいキーの札が狭い盤からはみ出す~~ — 決着。前提の方が違った

`tools/side-baseline.txt` の三行（a flick keyboard being built 689/402、
a keyboard of two layers 1023/402、three keyboards looking at one not applied
422/402）は一つの故障で、`claude/yoo-kwdg28` が電話の幅で測って見つけた。

札は「作るキーと同じ大きさ」なので 1+2+3 = 6 マス分。盤が 3 列だと、その
6 マスは盤の二倍になる ── 今日の `kbCellW` が `--kbw / cols` で、列が減るほど
一マスが太るから。

リーダーは三つの直し方を並べた（折り返す／狭いときは縮める／縦に積む）。
**三つとも間違った前提に対する対処だった。** オーナー 2026-08-25:
「エクセルみたいにキーボードにやって横幅が固定されるはずだよ」

マスの幅が固定なら、札は常に 6/10 で必ず収まる。直しは札の側ではなく盤の側。
docs/FEATURE_RULES.md の決定ログに入れた。実装は「段の数」（www/keyboard.js）。

## `dead-check` は IIFE で包まれたファイルを、一ファイルまるごと見ていない

`feature/grammar-engine` のセッションが最後の報告で「IIFE-wrapped dead-check
hole」と言い残したもの。**本当だった。**ただし原因は報告より一段細かい。

**フォルダを飛ばしているのではない。**`tools/dead-check.mjs:159` の `jsIn()`
は深さに関係なく歩くし、その上のコメントが「A list of directories rots the
same way, so it walks instead of naming」と、まさにその直し方をした経緯まで
書いている。`www/grammar-engine/` は歩かれている。

**落ちているのは宣言を拾う正規表現。**`/^function\s+([A-Za-z_$][\w$]*)\s*\(/`
── **行頭アンカー**。そして `www/grammar-engine/` の五ファイルは全部
`(function(root){ 'use strict'; … })` で包まれているので、中身が丸ごと一段
字下げされている:

```
www/grammar-engine/morphology.js  行頭 0  字下げ 10
www/grammar-engine/lexicon.js     行頭 0  字下げ  9
www/grammar-engine/translate.js   行頭 0  字下げ 13
www/grammar-engine/adapter.js     行頭 0  字下げ 10
www/grammar-engine/model.js       行頭 0  字下げ 12
```

**54 個の関数宣言のうち、行頭にあるものはゼロ。**だから `decls` にひとつも
入らず、「誰かに名指しされているか」を一度も訊かれない。

**そしてこれは意図的な設計が化けたもので、単純なバグではない。**同じファイルの
294-299 行が、呼ぶ側と死ぬ側で規則を変えている理由を書いている:

> A function declared anywhere, not only at the start of a line. The dead
> check above **deliberately** looks only at column zero — a nested helper is
> reached by the function around it and is not the thing it is hunting — but
> for resolving a call, an inner function is a perfectly good answer.

平らなファイルでは「字下げ ＝ 入れ子の補助関数 ＝ 外側から届く」が正しい。
**ファイルごと包まれると、その前提が「一ファイル丸ごと免除」に化ける。**
呼ぶ側は字下げも見るので、呼び出しは全部解決して**緑のまま**になる ──
赤にならずに穴だけが空く。

**読んだのではなく、実測した**（2026-08-26、`f10b655` の上で）:

```
IIFE の中（字下げ）に置く:
  www/grammar-engine/model.js に function zzzNobodyEverCallsThis(){ return 1; }
  node tools/dead-check.mjs → EXIT=0  緑

同じ関数を平らなファイルの行頭に置く:
  www/notes.js の末尾に同じ一行
  node tools/dead-check.mjs → 赤
    1 function nothing reaches:
      www/notes.js:136  zzzNobodyEverCallsThis
```

**直し方は決めていない。**思いつく形は二つあり、どちらも副作用がある:

- **包まれたファイルだけ、一段目の字下げも宣言として拾う** ── どのファイルが
  「包まれている」かを判定する規則が要る。行数で決めるのは proxy であって、
  CLAUDE.md 規則3が proxy を捨てた理由がそのまま当てはまる
- **`www/grammar-engine/` を IIFE で包むのをやめる** ── 他の `www/*.js` と
  同じ平らな形にする。ただし `root.X =` で export している設計そのものを
  変えることになり、これは**リファクタで、振る舞いの変更と同じ commit に
  乗せてはいけない**

**どちらも今日やらない**（リーダー 2026-08-26「直すのは別の仕事。今日やらない」）。
今わかっているのは「`www/grammar-engine/` の 54 個は誰にも訊かれていない」
という事実だけで、その中に実際に死んでいるものがあるかは**まだ数えていない。**
数えるのは直す前の別の一歩。

（この節の置き場所は当て推量です ── ファイルの頭が「順番はやる順番」と
言っているので、リーダーが動かしてください。）

## The plans screen says `$0` in every language

The three things this section used to name are in: **Restore** is a button,
**Plus** has its own card, and **Cancel** opens Apple's own sheet rather than
setting a flag. The prices are the App Store's since 2026-08-23. One thing is
left, and it is wording, which is not a session's to choose.

**Free is not a product, so the App Store cannot be asked**, and
`plan.price.free` is a typed string with a dollar sign in it — `$0` in all ten
languages, standing beside a real price in yen on a Japanese phone. That is
the same fault that made the other prices come from Apple, in the one place
Apple has no answer. What it should say instead — `0`, the word for free, or
nothing at all — is the owner's.

**The subscription disclosure is not on this list.** An app selling an
auto-renewing subscription must say on the purchase screen that it renews
until cancelled, and link to Terms and a privacy policy. Asked on 2026-08-23;
the owner says it is covered elsewhere — 「利用規約は別に入れてるから大丈夫」 —
so it is recorded here as answered rather than as work. If a review ever comes
back naming it, this is the paragraph it is about.

## ~~Two decisions of the same day disagree about how many keyboards~~ — settled

*2026-08-23, owner:*「1,1+3.無制限って言わなかったっけ？」

**Free 1 — the fixed QWERTY. Plus 1 + 3 = 4. Pro no ceiling.** Counted as a
pool **across languages**, not per language. `docs/FEATURE_RULES.md` said both
things on the same day; it says this one in both places now.

**Built, 2026-08-23.** `kbCap()` beside `wordCap()` in `www/core.js`
(1 / 4 / Infinity), `kbCount()` in `www/keyboard.js` summing across `LANGS`,
`kbRoomKb()` adding the QWERTY as the 1 in 1 + 3, and `CAN.kb` moved to `plus`
**in the same commit** — a door opened without its number would have given
Plus the three `KB_MAX` handed out. `KB_MAX` is gone.

It was deferred here because `www/keyboard.js` was `claude/detailed-tasks-
execution`'s. That branch has not touched the file since 2026-08-15 and no
live branch is in it — checked with `git log --oneline --all -- www/keyboard.js`
before starting, which is what `docs/SESSIONS.md` asks for and is the reason
this could be picked up rather than waiting on a session that had moved on.

## The plans screen is half wired, and the half that is missing is named

`www/store.js` is in and `setPlan()` goes through it: on a phone, pressing a
paid card buys, and the plan comes from the App Store's answer. Three things
are deliberately not there yet, each because a file it needs belongs to
another session today (`docs/SESSIONS.md`).

- **Restore.** `restore` exists on the native side and there is nowhere to
  press it. **Apple requires the button** — an app selling a subscription
  without one is rejected. It needs a name in `www/act-map.js`.
- **The middle card.** `PLANS` sells Free and Pro. Plus's name, price and
  lines are strings, and `www/i18n/*.js` is not this session's today. Nothing
  can be bought that is not on the screen.
- **Going back to free is not a purchase and is drawn as one.** Pressing Free
  on a phone sets `SET.plan='free'` by hand, which is a person saying "act as
  though I am on free"; the next launch reads the Keychain and it is Pro
  again. What that button should do is open Apple's own sheet — `manage` on
  the native side, which exists — because cancelling is Apple's and not ours
  to draw. It needs a name in `act-map.js` too.

None of the three is hard. All three are one file away.

## ~~Two decisions of the same day disagree about how many keyboards~~ — there
## was never a conflict. One table, read down the wrong column.

*2026-08-25, owner:*「プラスはキーボード1+3 プロは無制限よ？」
「言語数はプラスは1 プロは3」

Which is, word for word, the decision of 2026-08-23 that was already in the log.
There is **one** table there with **two** columns, and this entry had read the
*languages* column (1 and 3) as a second, disagreeing statement about
*keyboards*, and set it against the keyboard column (4 and no ceiling). Nothing
disagreed with anything.

In the names the plans have since the rename (Basic→Plus, Plus→Pro):

  |        | languages | keyboards, pooled across languages |
  |--------|-----------|------------------------------------|
  | Free   | 1         | 1 — the fixed QWERTY, not built     |
  | Plus   | 1         | 1 + 3 = 4                           |
  | Pro    | 3         | no ceiling                          |

The thing that had blocked it — whether a keyboard count is a pool across
languages or a ceiling within one — turns out not to matter to either paid
plan: Plus has one language, so a pool of four and four-per-language are the
same four, and Pro has no ceiling. It matters only to a person who was on Pro
and came back down, and there the answer is the one that is already law: fewer
buttons, never fewer words.

**What this unblocks, and what it costs.** `CAN.kb` moves from `'pro'` to
`'plus'`; `KB_MAX` stops being a per-language 3 and becomes a per-plan pool (4,
then no ceiling); `edit` and `badge` join `CAN`; and a language ceiling appears
**where none exists at all today** — anybody may make any number of languages
right now. That last one is the app TAKING SOMETHING AWAY, so it is a
`wordsSeen()`, never a deletion: a person who already has three languages on a
plan that now allows one keeps all three, sees all three, backs up all three,
and is refused only the making of a fourth. And per CLAUDE.md's narrowing of
2026-08-22, that refusal is one of the few places a sentence is written, because
otherwise it is a state with no cause and no way out.

*(the entry as it stood)*

`docs/FEATURE_RULES.md` carries both, and they cannot both be implemented.

- **The earlier one** (§ How many languages, how many keyboards): a keyboard
  count is a **pool across languages**, Basic gets **1 + 3 = 4**, and **Plus
  has no ceiling**. Its reasoning is written out at length — a keyboard is
  layers, so more boards buys only a different arrangement, there are five
  arrangements, and a ceiling that binds almost nobody is generous on purpose.
- **The later one** (§ A third plan, and what pays for the free one): the
  `CAN` table reads `kb`: Free —, Basic **1**, Plus **3**.

Four against one, and no ceiling against three. `CLAUDE.md` says an owner
decision is a specification and that a session may not resolve a conflict
between two of them, so **`can('kb')` has been left where it was — `plus`**.
Moving it down to `basic` without the number would have given Basic the three
that `KB_MAX` hands out today, which is neither answer.

What is waiting on it: `KB_MAX` in `www/keyboard.js` (a per-language constant
today, a per-plan number either way, and a pool across languages if the
earlier decision stands), and the language ceiling, which does not exist at
all yet.

## ~~The onboarding adds a 29th letter on the free plan~~ — decided, and in

*2026-08-23, owner:*「aが自作文字に変わる瞬間みたいなの見せたい」

The shape moves into the slot that already answers to the name. `ltFreeSlot()`
in `letters.js`, DELETE REVIEW in `docs/CHANGELOG.md`, eleven claims in
`base-check` and seven of them watched going red.

**One question it leaves open**, and it is not a bug today: what happens on
the free plan when somebody names NOTHING. Choosing is not required to leave
that step — 「選ばなくても出られる」 — so the shape stays a letter of its own,
with no name and no key, and the letters chapter lists it among the loose ones
where it can be named later. That is the same as before this change. Requiring
an answer on free would be a change to what the step IS, and therefore the
owner's.

## 曲線を「打った点を通る」ものにする ── 作って、見て、やめた

*2026-08-23, owner:*「正直通って欲しい」→ 絵を見て →「前が一番いいな！」

**今は前のままです。曲線の点は制御点で、線はその近くを通ります。**
再び開ける前にここを読んでください。一度やって、戻しています。

打った点からどれだけ外れているかは測ってあります。800 の em で、格子の一目は
150：

| かたち | いちばん外れた点 |
|---|---|
| J（a3 b3 c3 d3 e2 d1） | 50 |
| 山（三点） | 144 ── 上を打っても、線の頂点は四角の三分の一下 |
| S | 86 |
| 掃き | 51 |

通るようにする方法は三つ試して、三つとも実際に字を描いて見ました。

- **centripetal Catmull-Rom** ── 全部の点を通る。J に肘が出る（その点での接線が、
  まだ真下に降りている最中なのに次の点を向く）。O は菱形になる
- **接線を抑えたもの（Fritsch-Carlson）** ── 肘は消える。O はやはり菱形、山の
  頂点が尖る
- **同じ B スプラインを、通るように解いたもの** ── 制御点を
  `c[j-1] + 4c[j] + c[j+1] = 6 P[j]` で解き直すだけ。滑らかさは前とまったく同じ
  （C2）で、点の上を通る。**三つの中ではこれが一番よかった**

三つとも「打った点までの距離 0.0」でした。**数字は三つとも合格と言い、絵は
二つを落としました。** ここが持ち帰るところです。

やめた理由は一つだけ、オーナーが絵を見て前を選んだからです。技術的な障害では
ありません。もう一度やるなら三つめ（解き直す B スプライン）から始めてください、
一時間の仕事です。

**書き直すときに要るもの**：`www/otf5.js` の `bspline()` を解き直す版に替える。
`tools/round-check.mjs` に「山と J を描いて ROUND を押し、本物の
`toPolyline()` から打った点までの距離を測る」を足す（古い版に戻すと 120 と 48 で
赤くなるのを見てあります）。そして **すでに描かれた字の形が変わります** ──
保存されている点は変わらず、描かれ方だけが変わる。

**検査は作れませんでした。** 「肘が出ていない」を数字で言おうとして、曲率の跳ねは
直線から曲がりに入るところで正しい曲線でも 100% になるので、三つが分かれません。
閾値をでっち上げるのはこの repo が禁じている proxy そのものなので、やめました。
検査が持てるのは「点を通る」までで、形は絵で見るしかありません。

## The tour cuts its hole with four panes

`obTourHTML()` dims the screen with **four `.sbg` panes** laid around the lit
element. `.sbg` is the sheet's own backdrop doing a job it was not written
for, and four rectangles have to agree with each other about where the hole
is.

It is that way because `www/index.html` belonged to another session on the day
the tour was written (`docs/SESSIONS.md` — one session at a time owns that
file), and a screen that half-works is worse than one that borrows.

What it wants, on the day that file is free: **one** dim element with a real
cut-out — `clip-path`, or a box-shadow ring — instead of four panes whose
arithmetic has to agree.

None of it changes what the tour does. It is four panes against one element.

## ~~CSS outlives the screen it dressed, and nothing says so~~ — the check is in

*2026-08-22, owner:*「CSSの死骸は削除ではなく、検査を作る。className /
classList / 動的生成を考慮せず『grepで使われてないから削除』は危険。
やるなら先に『生きているCSS selectorか』を判定できる検査を作る」

`press` asks it now. A class is compared against every class actually WORN on
any element of any screen, collected after every build and after every press —
because a render-only walk never reaches `.on`, and a rule that only a pressed
state wears would be reported as dead.

**202 classes were styled and worn by nothing** on the day it was written, and
they are frozen in `tools/css-baseline.txt` as a ratchet: a new one fails,
taking a line out needs nobody. `a.set` and `.weave` are both on it.

**The check says "nothing here wore it", not "it is dead", and the difference
is the whole design.** A class worn only in a state the walk never reaches — an
error, a plan the fixture is not on, a screen behind a half-done state nobody
seeded — is on that list too. Clearing a line by adding the seed that reaches
it is the better fix, and the list cannot tell you which kind you are looking
at. **A person reads it. Deleting on the strength of the list alone is the
thing the owner said not to do, one level up.**

It nearly froze its own blind spot: the first version reported `.bar` as worn
by nothing, which is not a dead rule — `press` puts a view straight into `#app`
so the shell never exists. A pass through the real `render()` was added, kept
separate from the walk because `measure()` and `measureRows()` are calibrated
on what `show()` builds.

**Still open: deleting any of the 202.** That is a change to the stylesheet,
one selector at a time, each one read by somebody first.

## ウィジェットの絵が実物より大きい ── `claude/save` の担当

*2026-08-23, owner:* 実機の写真と `tools/widget-shot.mjs` の出す絵を並べて
「全然違うし、本当のウィジェットの見た目小さいよ」。

出ている絵は「ホーム画面では」という見出しの下に文字盤を大きく描いていて、
実機ではもっと小さい。**大きさが違う絵は、確認の役に立たないだけでなく、
確認したつもりにさせる** ── このリポジトリが何度も踏んでいる形。実機で
出る大きさで描くこと。iOS のウィジェットは small / medium / large の三つで、
写真は small。

**カレンダーがまだ無い。** 時計と日付はあるが、カレンダーは無い。

置く手順は「ホーム長押し → 編集 → ウィジェットを追加 → Lingua」。

`ios/App/LinguaWidget/` と `tools/widget-shot.mjs` は `claude/save` が
持っているファイルなので、こちらでは触っていない。

## iPhone のパスワード保存 — 調べて、やらないと決めた

*2026-08-23, owner:*「パスワードの保存は一旦なしで」

聞かれたのは「ログインのパスワードを iPhone に覚えさせられないか」。答えは
できるが、ただではない。

**画面の側は既に正しい。** `obMailField()` が `autocomplete="username"` /
`"current-password"` / `"new-password"` を出していて、`type` も email と
password。ここに足りないものは無い。

効かない理由はドメインが無いことで、iOS のパスワード管理はドメイン単位で
照合する。Capacitor は `capacitor://localhost` から配信している
(`capacitor.config.json` の `server.iosScheme`)ので、照合できる相手が居ない。

やるなら三つ:

1. 配信元を `localhost` から本物のドメインへ (`server.hostname` + `iosScheme`)
2. `associated-domains` (`webcredentials:そのドメイン`)、Apple の Identifier
   の capability、プロファイルの作り直し
3. そのドメインに `/.well-known/apple-app-site-association`

**そして罠が二つあり、一つ目がこれを重くしている。**

`localStorage` はオリジンごと。配信元を変えると新しい空の localStorage に
なる ── 言語も文字もキーボードも無い状態でアプリが起動する。消えては
いないが、使う人には見分けがつかない。`backup.js` が Documents に書いた
ファイルはオリジンに縛られないので渡る道はあるが、それは「バックアップが
勝つ」形の復元で、`docs/DATA_SAFETY.md` に真正面から関わる。設計が要る。

二つ目。全部やっても出るのは候補までで、「このパスワードを保存しますか」の
ダイアログは WKWebView では出ない(Safari だけ)。出すには
`SecAddSharedWebCredential` を叩くネイティブ側が要る。

**そして、この扉には既に Sign in with Apple がある。** パスワードそのものが
無いので保存する必要がなく、ドメインもエンタイトルメントも要らない。
「iPhone に覚えさせたい」への答えとしては、もう出荷されている。

やるときに先に決めることが一つ: **オリジンを変えた日に、既にアプリを
持っている人のデータをどう渡すか。** それが決まるまで、この項目のコードは
一行も書かない。

## A private account — asked for, and deliberately not now

There is no such thing today: every profile and every post is readable by
anybody. What exists is the public/private switch on a LANGUAGE page
(`wldHidden()` in the language room), which is a different thing.

Three pieces are missing and the middle one is the reason this is here:

1. a column on `profile`;
2. **following becomes a request.** It is one-sided and instant today, so an
   account that could be locked would need a pending state, a screen to
   accept or refuse on, and every place that counts or lists followers would
   have to say which kind it is holding;
3. `post_read` gated on "public, or mine, or an accepted follower of mine",
   where it is `true` today.

Owner asked, then said not yet 「いやめんどいから今はいいや」. Not started,
and nothing has been laid in for it — no column, no flag, no dead branch.
When it is picked up, two things are already decided by the shape of the
data: existing follows all count as accepted, so nobody loses a follower on
the day it ships; and whether locking an account keeps the followers it
already has is open.

## ~~`form:add:<parent>` arrived at cold shows "this is gone"~~ — fixed

*Fixed 2026-08-22. Kept as the record of what the entry got right and what it
got wrong about its own cost.*

`openAdd()` decided whether the draft was new by asking whether the route was
already the one it was about to open, so arriving AT that route with no draft
took the not-fresh branch, left `addW` and `wEdit` null, and `wdFormHTML()`
threw into `vForm`'s catch. The screen said the form was gone, about a form
nobody had opened.

**The entry said the fix was "a behaviour change to how a draft is decided to
be new, and that is its own commit". Half right.** It is its own commit, and it
is one clause: `|| !addW || !wEdit`. It is not a behaviour change in the sense
the entry meant — what the route test is FOR is not throwing away what somebody
typed, and there is nothing to throw away when there is no draft. The absence
of a draft is what makes a sheet new; where the trail is pointing never was.

`word-check` holds both halves now, because widening `fresh` could have
widened it onto the case the test exists for. Two reds were watched: without
the clause, arriving cold says "that is no longer here"; with `fresh` forced
true, reopening the sheet throws away what was typed and every meaning.

## ~~The face on `profile` does not follow the face on the phone~~ — fixed

*Fixed 2026-08-22, owner confirmed:*「アイコンは全部更新したら更新したの
表示でしょ」

`netMakeProfile()` wrote `profile.av` once and nothing wrote it again, so the
little face beside "somebody liked this" could be one somebody had not worn
for a month. `netAvSync()` in `net.js` sends it now, from `bootSession()`.

**The entry said the reason not to do it was "a second write on a path that
has none — every letter drawn would otherwise be a request", and that this
wanted a decision about how often. Both were wrong, and the second followed
from the first.** `postAvatar()` answers the photograph if there is one and
otherwise the FIRST drawn letter, so it does not move when a letter is drawn
— it moves when the first one is redrawn, or a photograph is set. Twice in a
language's life. There was no frequency to decide: **send it when it differs**
was always the whole answer, and `ME.avSent` makes the comparison local, so a
launch where nothing moved asks the server nothing.

The server was already ready and nobody had noticed: `schema.sql`'s
`profile_edit` allows the update and `grant update (handle, display, av)`
names the column.

`post-check` holds three — it is sent when it has never been sent, it is NOT
sent when nothing moved, and it goes as `PATCH`. All three reds were watched.

## Not now, because wordsheet.js has just moved

The new-word sheet and the word editor became one screen, and a word gained a
register, fields, an etymology and a changed-on date, all in the same day.
None of it has been on a phone yet. Touching the same file again before that
happens means the next thing found on the device has two changes to be
bisected against instead of one.

- **`wordsheet.js` input handling.** `wdSetLn` / `wdSetPos` / `wdSetReg` /
  `wdSetTags` / `wdSetEty` / `wdSetNt` are six one-line setters that all write
  `wEdit.<k>` and differ in the key. One `wdSet(k, v)` would do — `IN` already
  carries an argument before the value, which is how `wldSet('where', v)`
  works. Worth doing; worth doing after the device.

- **`goneBox()` is not used everywhere it could be.** `viewGone()` is the one
  place for "the thing you came back for is gone" and some screens still write
  their own empty state. Changes what is on screen, so it needs a screenshot
  and an approval, not a quiet commit.

- ~~**`talk.js` / `grammar.js` shared logic.**~~ Moot: `talk.js` went out with
  Studio. If the conversation comes back with the hosted model, so does this
  question, and the answer it had still holds — only if the shared thing is
  genuinely one rule, and not everything that repeats is duplication.
  `cffNum` and `csNum` in `otf5.js` are the standing example.

## A column no longer has anywhere it cannot go

*Both halves of this are done. Kept as the record of why it was not, because
the reasoning is the reason the fix took the shape it did.*

A language can be written in columns — `ttb-rl` and `ttb-lr` — and two places
used to set it **across** instead, in the direction the columns run, through a flattening
step that no longer exists.

**The composer's field** is a `<textarea>`, and a textarea in a vertical
writing mode was not something this webview would do: `lnFit()` sized it by
`scrollHeight`, which is the wrong axis there. It is typed into as a column
now, and `lnFit()` measures the width when the writing-mode is vertical.

**The card** was 1920×1080 with a band of letters across the middle of it, and
a column had nowhere to go in that. The answer written here was "a second
composition — portrait, with the run down the middle", and that is what it
got: `CARD_SHAPES` offers 16:9, 1:1 and 9:16, a language that runs down the
page opens on the tall one, and `cardPlace()` lays the line into whichever
shape is chosen rather than one fixed band. So the card sets a vertical script
vertically, and nothing is flattened on the way.

## ~~Not now, because a rename is not a fix~~ — done, and one of the four was
## wrong

*Done on 2026-08-22, one commit each, and kept as the record of what the entry
got wrong about itself.*

- ~~`postsRead`~~ → `postRead`.
- ~~`wSetFil` / `wSetSort`~~ → `wordsSetFil` / `wordsSetSort`.
- ~~`gh*`~~ → `geHint*`, and `GH*` → `GE_HINT*`. It turned out to be the silent
  demo canvas inside the glyph editor — ten functions that draw no text at all,
  which is why it is right in ten languages. `ge*`'s child, so it says so.
- ~~`notes.js` prefix mixing~~ → `note*` was `nt*` spelled long, so it went to
  `nt*`. `openNote` and `vNotes` stayed; `open*` and `v*` are in CLAUDE.md.

**`savePosts` and `saveMe` were listed here and should not have been.** The
entry put them beside `postsRead` as if all three were a `posts*`/`post*`
collision. They are not: they are `save*`, and `save*` is a family of exactly
ten — `saveKb` `saveLetters` `saveMe` `saveNote` `saveNotes` `savePosts`
`saveSnd` `saveStg` `saveWld` `saveWord` — every one of which names what it
saves. Renaming two of the ten would have left eight, which is the tangle
rather than the untangling.

The reason it is worth writing down: **the rule already allowed this and the
entry did not notice.** CLAUDE.md's own prefix list carries `open*`, which is
twenty functions and is a verb, not a chapter. So a verb family was never an
exception — what the rule is against is one chapter under two names, which is
what the other four were. Settled in the decision log, 2026-08-22.

## The question the card bug was actually about

Not a task. A thing to check for, whenever anything is added that shows
something from the past.

The card bug was not "a function is wrong". It was **the wrong owner for a
piece of data**: a post's shapes belong to the post and were being re-derived
from the dictionary that happens to be open. So for anything that displays
what somebody did earlier, ask which of the three it is:

| | |
|---|---|
| frozen at write time | put it ON the thing. A post's ink, its author, its language's name |
| read from the current state | correct for a word, an example, an alphabet — the making side |
| held from an earlier state | neither of the above, and the one to be suspicious of |

Places to look the day they exist: a ranking, a season record, a history, an
export of something older than the app's current shape. Today the app has
none of these — posts are the only past-tense data it holds, and post.js and
card.js are the only two files that render one, which is why the sweep after
the card bug found nothing else.

## ~~A renamed letter loses its key on the free plan~~ — closed by a decision

*Closed 2026-08-22 by the owner:*
「無料で作ってる範囲の名前変更は無しでしょ。有料は追加できるというだけで。
無料分のキーボードはもういじらない」

**The twenty-eight slots and the digits may not be renamed, on any plan.**
Paid buys ADDING letters — `can('letters')` — and that is a different
sentence. A name that cannot move cannot be lost, so the whole path this entry
described stops existing. Decision log, `docs/FEATURE_RULES.md`.

What this entry cost, kept because it is the lesson: it listed three ways out
and priced the first as the smallest, on a claim about `ab` that had stopped
being true — and a later reading of it re-priced the *decision* as "restricting
a paid screen by a plan the person is not on", which made it read as expensive.
It is not a restriction. **A slot's name was never something anybody was
offered.**

The letter page had held it since 「無料で作ったやつを改名できなければ良く
ない？」 — `ltIsBase()` and `sound.js`'s `can('letters') && !ltIsBase(l)`. What
was missing was the rule: `ltSetRoman()` did not refuse, so a screen was the
only thing holding it. It refuses now and `base-check` holds both halves —
a slot keeps its name, and a letter somebody ADDED is still theirs to name.

## Is `numSetVal()` reachable at all?

Found while placing that refusal, not looked for, and **not** answered here.

`numSetVal()` is called from one place — `ltSetRoman()`, when what was typed is
all digits. Two things sit in front of it:

- it refuses a value another digit already has, and `ltStart()` fills every
  value below the base, so inside a base **every value is taken by
  construction**; and
- the field that reaches `ltSetRoman()` is `ltAbField()`, which `sound.js`
  shows only when `can('letters') && !ltIsBase(l)` — and `ltIsBase()` is true
  for every digit.

So a digit appears to have no road to its own value. That may be exactly
right — 「数字が設定できないわ。そこ文字から設定できるように頼む」 was asked
about DRAWING on a digit, which works, and a digit's value is arguably what
the slot IS rather than something to edit. It may also be a door that closed
when the letter page learned about `ltIsBase`.

Not resolved because the answer is a spec question, not a code question, and
because a check was written for it and had to be deleted: no assertion about
moving a value can be satisfied in a normal state, which is itself the
evidence. **A check that cannot be made true is not a weak check, it is a
statement about the app** — and the statement here is "this cannot happen",
which somebody should confirm is intended before anything is built on it.

## `tools/verify-script.mjs` runs now, and says nineteen things

It was recorded as "broken, a font experiment, not in the gate". Two of those
three were wrong.

What was wrong with it was three things, and the first two are fixed:

1. `gstep()` — renamed `geStep()` and this file was missed.
2. `scriptDrawn()` — went out in `9226dd6`, when the font stopped being built
   from anything but the letters. `scriptGlyphDefs().defs.length` is the same
   number now.
3. **every mouse click was landing on `#splash`.** It waited 250 ms after
   `goto` and the splash holds for the later of 900 ms and boot, so the point
   editor was never touched at all. Every other check in `tools/` waits for
   `#splash` to detach; this one predates the selector.

With those three fixed it executes end to end for the first time in a long
while and reports **13 ok, 19 FAIL**. That number is not nineteen bugs. The
editor has changed a great deal since this was written — the rail it asks for
is "two marks" and there are four, the circle and arc section fails wholesale,
and the snap failures are one lattice step out in y and not in x, which reads
more like the test's own 800-unit mapping than like `geSnap`.

So each of the nineteen needs the same question asked of it: **is the app
wrong, or is the test old?** Until that triage is done this cannot go in the
gate, because a check nobody believes is a check nobody reads.

It is worth doing. It is the only thing that proves the whole PUA font path
end to end — draw, save, build the font, install it, and confirm the browser
is really using it rather than falling through to a serif. Nothing else in the
gate can see that.

## A font for the letters somebody drew — held

The strokes a person draws are a skeleton, and how it is inked is a separate
choice: 角 / 細 / 太 / 丸 / 筆 / 平筆, chosen per language, stored on the
`script` slice, changing nothing anybody drew and therefore reversible on any
day. `GPEN` in `glyph.js` is that choice today and it is one constant —
`{width:60, angleDeg:0, contrast:1.0, curve:72}` — used by the font builder,
by `inkStrokes`, and by `share.js` when the shapes are cut for the system
keyboard, so all three would have to read the language's pen instead.

`otf5.js` already takes the nib's width, angle and aspect, which is five of
the six. 筆 is the sixth and is not a nib: the width varies along the stroke
and the end is one of 留 / 羽 / 払. `tools/font-mock.mjs` renders that —
including how each stroke's ending is read off the drawing rather than asked
about — and is in the repo. It is not a check and is not in the gate.

**Held by the owner on 2026-08-20: 「いったんフォントなしで」.** Nothing in
`www/` was changed for it. Do not start this without asking.

## `press` の「一覧の行」だけが走るたびに違う数を出す

見つけたのは 2026-08-25 のリーダーのゲート。**検査は緑で、バグはアプリに
無い。** 動くのは印字される数のほうで、それが動くこと自体が問題。

同じ commit（`85ad1f9` + ゲートに shape-check を足しただけ）で三回:

```
  2211   引き継ぎに書かれていた数
  2213   npm test の中（browser 検査 16 本、同時 4 本）
  2212   npm run press 単体
```

同じ紙に載っている他の数は一つも動いていない ── `screens built: 660`、
`classes worn: 565`、`styled and unworn: 4`、`はみ出し 3`、
`photographs 82`、`buttons pressed: 10642 (222/222)`。動くのは
`rowsSeen` だけ。

原因は `tools/press.mjs:268`:

```js
        if (!r.height) continue;                    /* hidden is not a row */
```

高さ 0 の兄弟は数えない。すると同じ class の組が 2 から 1 に落ちることが
あり、その下の `if (g.length < 2) continue;` で**組ごと**飛ぶので
`rowsSeen` が一つ減る。高さが 0 かどうかは測った瞬間の話 ── 画像や canvas
がまだ寸法を持っていない、font がまだ来ていない ── なので、機械の混み具合で
変わる。ゲートの中（4 本同時）で 2213、単体で 2212 なのはそれで説明がつく。

**なぜ直さないと決めたか、ではなく、なぜ急がないか。** 外し方が安全な側に
外れている。飛ばした組は「測らなかった組」であって「一つの高さだと言った組」
ではないので、**本物の二段組を見逃すことはあっても、無いものを赤くはしない。**
`press` の主張そのもの（「一覧の行は一つの高さ」）は今も本物。

**写真の数（`photographs ... measured`）も同じように揺れる。** 2026-08-25、
`feature/grammar-engine` のセッションが別の容器で二本ずつ測った:

```
  同じ木で二度   lists 2204 / 2204    photographs 80 / 81
  その枝で二度   lists 2206 / 2205    photographs 81 / 80
  リーダーの木   lists 2211 / 2213 / 2212    photographs 82 / 82
```

`buttons pressed` は四回とも同じ。**容器が変わると幅ごと変わる**ことに注意
── 2204 と 2211 は同じ木の数で、機械が違う。だから他人の報告の数と自分の数を
引き算してはいけない。比べてよいのは同じ容器の中の前後だけ。

写真の方は `press.mjs` の別の場所だが、外れ方の理屈は同じで、こちらの
「測った瞬間にまだ寸法を持っていない」は画像なので、むしろ本命。

**これが実際に人の時間を使った。** 同じ日、「段の数」のセッションが
`photographs 82 → 80` を自分の変更のせいだと思って追っていた。追う価値が
あったのは正しい ── CLAUDE.md がそう読めと書いてあるので、正しく読んで、
存在しない原因を探した。**揺れる数を、動いてはいけない数の列に並べて印字
しているのが原因。**

**それでも直す価値がある理由。** CLAUDE.md はこの手の数を
「誰かが意図して動かしたのでなければ動いてはいけない数」として扱っている
（`buttons pressed: 8683` の段落がまるごとそれ）。±2 が勝手に動く数は、
本当に 2 動いたときに何も言えない。ラチェットとして使えない数が一つ、
使える数の列に混ざって載っている状態。

**直すまでの読み方**（これは今日から有効）: `press` の数のうち
**信用してよいのは `buttons pressed` と `screens built` と
`classes worn` と baseline を持つ二つ**（styled and unworn / はみ出し）。
`lists measured` と `photographs measured` の二つは、同じ容器で三回測って
同じでなければ動いたと言わないこと。

**直すなら**、`rowsSeen` を上げる前に「高さを持つまで待つ」のではなく、
飛ばした組を**別に数えて印字する**のが筋だと思う（見逃しの量が見える）。
ただしこれは見立てで、仕様ではない。`tools/press.mjs` は今どのセッションの
領域でもない。

## 語順と三つの位置が、言語ではなく電話に付いている

**2026-08-25、オーナーが否定の段のスクリーンショットを見て
「動詞の前と決まったわけじゃないのに」と言ったところから出た。読んで
見つけたのではなく、動かして測った。**

```
A (Lmt8i0omm): order=OSV  negp=before  words=10
B (Lmt8i0pq2): order=OSV  negp=before  words=0    ← 単語は 0。語順は A のまま
B changed to:  order=VOS  negp=after
back in A:     order=VOS  negp=after  words=10    ← A の語順が B の作業で変わった
```

`SET` は `LS_S = 'lingua.set'` ひとつに保存される ── `langKey()` を通らない。
`core.js:22` のコメントが自分でそう言っている:「the person's settings --
not a language's」。そこに入っているもの:

```
  SET.order      語順（SOV / SVO / VSO / VOS / OSV / OVS）
  SET.gpos.adj   形容詞が名詞の前か後か
  SET.gpos.negp  否定辞が動詞の前か後か
  SET.gpos.adp   接置詞が名詞の前か後か
```

`langOpen()` は words / letters / notes / phases / snd / kb / wld を読み直す
が、**`SET` は読み直さない**。だから四つは言語をまたいで一つしかない。

**なぜ今これが重要か。** 今日「段の数」が item 3 で「二つ目の言語を作る扉」を
実装している。**扉が入った瞬間に、これは全員に届く。** 今日この穴が届いて
いないのは、二つ目の言語を作る道が無いからでしかない。

**これは CLAUDE.md が既に名前を挙げている失敗と同じ形。**「**what the
language is for** sat in `SET`, the person's settings, directly under a
comment saying it travels with the language」── あれは直った。これは同じ
場所に残っている四つ。

**直すのは移行であって、移行は写して、読んだものを消さない。** 既に二つ以上の
言語を持っている人（移行や復元で出来る）は、今どちらの言語で決めたのかも
分からない一つの値を共有している。どちらに配るのが正しいかは**データの話
ではなく決めごと**なので、ここでは決めない。

## 「決めること」の下の二択が、誰も選んでいないのに選ばれて見える

同じスクリーンショットから。`phases.js:433` の

```js
  return '<div class="segs">'+['before','after'].map(function(o){
      return '<button class="seg'+(o===gPos(id)?' on':'')+'"' + ...
```

`gPos()` は触られていなければ `GPOS_DEF`（＝`after`）を返すので、**何も
していない段でも「動詞の後」が光っている。** 人は選んでいない。

**コードの側は既に正しく区別できている。** `phases.js:187`:

> A decision counts once it has been touched. Every one of them has a default
> and a default nobody chose is not a decision.

`stTouched()` はそのとおりで、進捗の数え方は正しい。**画面だけが、既定を
選択として描いている。** だから直すのに新しい概念は要らない ── `stTouched(id)`
が偽のあいだはどちらも光らせない、で足りる。

**そしてもう一段深い方（こちらは決めごと）。** 選択肢が
`['before','after']` の二つしかない。否定を「動詞の前後に置く小さな語」で
表す言語だけが表現できる。接辞で示す言語、動詞そのものが変わる言語、
語順で示す言語には答えが無い。同じことが `adj` と `adp` にも言える。
**これは「二択が足りない」という実装の話ではなく、「このアプリの文法の段は
どこまでの言語を作れることにするのか」という決めごと。**

## 段の副題 18 本のうち、いくつかは題を言い直しているだけ

同じスクリーンショットから。オーナー:「否定の表し方　決めること ↑これは
説明だろ」。

`stg.neg.d` = 「否定の表し方」が、題「否定」の真下に出る。題が「否定」で
副題が「否定の表し方」は、二度言っているだけで何も足していない。
`stg.*.d` は 18 本あり、全部が同じではない:

```
  題を言い直しているだけ   stg.neg.d 否定の表し方 / stg.have.d 所有の表し方
                           stg.when.d 時の表し方 / stg.desc.d 修飾語の位置
  何かを足している         stg.count.d 1から{0}まで / stg.month.d 1年を分ける{0}つ
                           stg.wday.d 1週の{0}日 / stg.verb.d 過去・現在・未来
  どちらとも読める         stg.order.d 主語・目的語・動詞の並び ほか
```

**どれを消すかは言葉づかいなので決めない。** 先例はある ──「four screens
stopped saying what a heading already said」で 18 個のボタンが減った日。
`stg.decide`（「決めること」）も同じ列に並ぶが、これは題の言い直しではなく
節の名前（「規則」「必要な単語」「例文」「メモ」と同じ列）なので、別の判断。

## 「黙って課金画面へ飛ばす」が二箇所にあり、オーナーの言葉が両側にある

リーダーが 2026-08-25 の統合レビューで見つけた。**片方だけ直すと、アプリが
同じことを二通りにやることになる。**

```
  www/post.js:1705    if(!can('edit')){ go('plans'); return; }
  www/sound.js        if(!can('snd')){  go('plans'); return; }   ← 61f5005 で新規
```

オーナーの言葉が両側にある:

```
  直せ   「編集はplusプランからです。みたいなポップなしに課金画面飛ばされる」
  それでいい 「だいたい無料で使えないやつは表示させていいよ。課金させる動線を
            減らしたくない」「無料はタップすると課金ページに飛ばされる」
```

`claude/letters` は二つ目を根拠に `sound.js` の側を入れた。その判断はその
根拠に照らして正しい ── そして `post.js` の側は、一つ目を根拠に直せと言われて
いる。**同じ形について、同じ日に、逆のことが言われている。**

さらに CLAUDE.md 自身が両側を持っている:

```
  アプリ内に説明書くの禁止 ── 有料プランで何ができるかを言わない
  2026-08-22 の narrowing ── アプリが何かを取り上げていて、その画面が理由も
  出口も無い状態になる場合に限り、必要な最小の一文を書く
```

CLAUDE.md は「決定が書かれた規則と衝突したときは、止まって両方を報告し、
自分で解決しない」と言っている。**だから二つ一緒に決める。**
`claude/post` には既に「黙って飛ばすのをやめる一点だけをやり、文言を発明
するな」と渡してある。`sound.js` の側も同じ答えに揃えること。

## `migrateGramLang()` は LANGS 全部に配る。今日は正しく、明日は正しくない

`www/phases.js:101` が `for(id in LANGS)` で回している。`www/core.js:479` は
LANGS についてこう書いている:

```
`mine` and not the length of LANGS, which also holds
every language being read from somebody else
```

**そのコメントは、まだ実装されていない意図を書いている。** 2026-08-25 に
確かめた: LANGS に書く場所は三つしかなく（core.js:115、core.js:140、
backup.js:264）、三つとも `mine:true` を立てる。他人の言語が LANGS に入る道は
今は存在しない。だから移行は今日は正しい。**推測ではなく数えた。**

危ないのは、タイムラインから他人の言語を読む機能が入った日。移行は
`SET.gramLang` の印で一人一度なので、既に移行した人は再び踏まない ──
**その後で初めてアプリを入れた人だけ**が、他人の言語に自分の語順を刻まれる。
規則8（作る側と読む側）がデータの形で出る。

直すのは一語（`&& LANGS[id].mine`）だが、**それを覆う検査が無い状態で移行の
範囲を変えるのは、試されていない分岐を足すこと。** `tools/gramlang-check.mjs`
は LA/LB/LC 全部 `mine:true` で蒔いている。直すなら検査と同じコミットで。
今は変えていない。

## `.rv` は空の span として生き残っている

`claude/world` が制作の目次から行の数（40/41）を外したとき、消したのは
`.rv` の**中身**で、`www/sheet.js:shRoomHTML()` は今も
`<span class="rv"></span>` を空で出している。何も描かないので害は無く、
クラスは着られたままなので css-baseline も動かない。掃除するなら別の日。

## 2026-08-25 の実機ラウンドで、わざと今回やらないと決めたもの

build #91 をオーナーが実機で触って出した約二十五件のうち、六つのセッションに
渡さなかったもの。**「抜けている」ではなく「まだやらない」と決めたもの。**
どれも扉が無いから届いていないのではなく、決まっていないか、別の道具が要る。

### 画面の上からなぞった PDF を読む ── 電話側 Swift が要る

オーナー:「pdfで出るならその形式で上からなぞった文字のみ利用できるから
その仕組みにして」。

`www/sheet.js` は届いたファイルを四つに仕分けていて、`'drawn'`（写真ではなく
線として描かれた PDF）は**読めない側**にある。ファイル自身がそう書いている:

```
What it cannot do is a PDF whose ink was DRAWN rather than photographed
-- somebody who wrote on the sheet on a screen. That is a renderer, and
the phone has one (PDFKit, native) while this file does not.
```

紙に書いてスキャンした PDF（`'photo'`）は既に動く。だから**表面は出来ている
ように見える**。要るのは `ios/App/` の Swift で、`LinguaShare` の口と同じ
場所。誰も持っていない仕事。

**注意: これを「用紙の名前を変える」仕事と一緒にしないこと。** 名前と画面が
分からないという苦情と、読める形式が一つ増えるという話は別物で、前者だけで
「わけわからない」は消える。

### 「この言語について」の Wiki の SQL ── オーナーが順番を決めた

オーナー:「Q5入れますよ。見た目を完璧にしてからsqlね」。

セクションごとの公開／非公開と「DL可能なら他の人が使える」は、テーブルと RLS
の設計で、`npm run rls`（34 項目）に行を足す仕事。**見た目が固まるまで
`supabase/` を開かない。** 公開の既定が公開か非公開かも決まっていない。

### 翻訳がどの画面で起きるか ── エンジンは完成、呼び手が無い

`www/grammar-engine/` は master にあり、`gModel()` と `.translate.run()` と
`.line()` は呼べば動く。**`gModel()` を引数なしで呼ぶ道だけが誰も通っていない。**
commit `c757ac4` が四案を並べていて、①（段の中の「Lines」。`lb` `ln` `gl` の
三つの箱が既にそこにあり、今は `ln` も `gl` も手打ち）が推し。画面も新しい
文字列も増えない。

オーナーが 2026-08-25 に「単語と文法が埋まれば埋まるだけ翻訳ができるように。
そのために一体化する作り直しをしている」と言っており、**方向は決まっている。
残っているのは置き場所だけ。** これが決まるまで文法ページは「直したものに
なっていない」ままになる ── オーナーが実機でそう言ったのは、作り直しが
この一点で止まっているから。

### 単語の規則（`fmr*`）を文法へ移す

オーナー:「単語の規則で作る形ってなに？それ文法にしない？だって複数とかの
セクションあるんだから、セクションごとに複数の形とかを設定させるようにして
良い」。

置き場所の作り直しなので、上の「翻訳がどこで起きるか」と同じ決定の一部。
別々に決めると、同じ画面を二度作り変えることになる。**一緒に決める。**

### `www/mod.js` の DELETE REVIEW ── App Review 1.2 と釣り合わせる

オーナー:「アカウントの設定に通報は意味がわからないのでいらないです」。

設定の行は `mod.js` への唯一の扉で、`mod.js` は通報を**受ける**側 ── staff
だけが開け、通報された投稿を電話から取り下げられる唯一の道。ファイルの頭に
理由が書いてある:「"we act on reports within 24 hours" is something Apple
asks about」。

**行を外すのはオーナーが決めた。何を消すかは DELETE REVIEW を通してから。**
天秤に載っているのは App Review 1.2 と、オーナーにとって意味の無い一行。
通報そのものはどちらにせよテーブルに溜まり続けるので、記録は失われない。
**扉を別の場所へ移すだけで済むなら、それが一番安い。**

### 有料の扉で何と言うか ── 書かれた規則と正面から当たっている

オーナー:「編集はplusプランからです。みたいなポップなしに課金画面飛ばされる」。

場所は `www/post.js:1705` の `if(!can('edit')){ go('plans'); return; }` 一行。

**これは CLAUDE.md と衝突している。** 一方にはこう書いてある:

```
アプリ内に説明書くの禁止 ── 画面は自分を説明せず、有料プランで
何ができるかを言わず、どこを押せとも言わない
```

もう一方、2026-08-22 の narrowing にはこう書いてある:

```
アプリが何かを取り上げていて、その画面が理由も出口も無い状態になる場合に
限り、必要な一文を書く ── 最小限で、それ以上は書かない
```

黙って課金画面へ飛ばされるのは後者の形に見えるが、「Plus からです」と書くのは
前者が名指しで禁じている形でもある。**CLAUDE.md 自身が、決定と書かれた規則が
衝突したときは「止まって両方を報告し、自分で解決しない」と言っている。**

だからセッションには「黙って飛ばすのをやめる」一点だけをやらせ、**文言を
発明させない**。取り得る形を並べてオーナーに決めてもらう。

## `plan-check` が赤い ── 直せるが、直すと文言をアプリが決めることになる

2026-08-25、`claude/leader-integration` で全ゲートを回して見つけた。
**25 検査中これ一本だけが赤で、残り 24 は緑。** 直し方は分かっていて、
それでも直していない。上の「黙って課金画面へ飛ばす」の節の続きで、
あちらが「二箇所ある」話、これは「押さえている検査が旧いまま」の話。

測ったもの:

```
  plan: 1 failed
  FAILED  pressing it on free opens no composer and lands on the plans screen
```

食い違っている二つ:

```
  www/post.js:1818   if(!can('edit')){ if(confirm(t('up.cta'))) go('plans'); return; }
                     ← claude/post の 967e734 が入れた
  tools/plan-check.mjs:237  out.editFreeWent = here().r === 'plans';
                     ← bc3f622 が書いた。967e734 より前。更新されていない
```

`bc3f622` は `claude/post` の祖先なので、**この赤は統合で生まれたのではなく、
`claude/post` の tip で既に赤かった。** 枝の中で振る舞いを変えて、それを
押さえている検査を同じコミットで直していない ── CLAUDE.md の
「a check enters the gate in the same commit that adds it」と
「バグを戻して検査が赤くなるのを見るまで直しは終わっていない」の両方に当たる。
どの枝も `plan-check` を新しい形に合わせていない（`git log -S editFreeWent`
の答えは `bc3f622` 一件だけ）。

**なぜ直さないか。** 検査を新しい形に書き換えるのは十分もかからない。だが
それは「無料で鉛筆を押したら訊いてから飛ぶ」を決まったこととして検査に
刻むことで、それはまだ決まっていない。SESSIONS.md §11 の
「合わせられる形にして通すのが一番悪い」がこれ。

そしてもう一つ、今のコードは**天井を名指ししていない**:

```
  core.js:522      confirm(t('langs.full', langCap()) + '\n\n' + t('up.cta'))
  core.js:703      confirm(t('toast.cap',  wordCap()) + '\n\n' + t('up.cta'))
  keyboard.js:349  confirm(t('kb.full',    kbCap())   + '\n\n' + t('up.cta'))
  post.js:1819     confirm(                             t('up.cta'))   ← 文が無い
```

`up.cta` は "Upgrade" の一語。他の三つは前に「この段の上限は◯◯」に当たる文を
置いている。**編集の天井を名指しする鍵は en.js に無い**（`grep -in edit
www/i18n/en.js` に該当なし）。だからこのダイアログは「Upgrade」と OK／
キャンセルだけで出る。967e734 のコメント自身がそう書いていて、
「文言はオーナー待ち」と言っている。

**オーナーに出した三択**（2026-08-25 に訊いたが、このセッションに人が
おらず届いていない。次に人が居るセッションが訊き直すこと）:

```
  ① 文をもらって confirm を残す ── 他の三つと同じ形に揃う。苦情そのものが
     消える。i18n の鍵を一つ足し、plan-check をその形に更新する。推し。
  ② Upgrade 一語のまま通す ── すぐ緑。天井を名指ししないダイアログが
     一つだけ残る。
  ③ master の挙動に戻す ── plan-check 無変更で即緑。ただし
     「ポップなしに課金画面飛ばされる」は直っていない状態に戻る。
```

どれも一行から数行で、**止まっているのは手ではなく決定。**

## 取り込みを取り消しても、単語から生まれた音は言語に残る ── 片側だけの弁

`claude/letters` が見つけて、そちらの持ち物ではないので置いていったもの。
**import.js はこの枝の持ち物でもないので、ここに書くだけで直していない。**

取り込みは二つのものを言語に足す。`impPut()` が**単語と文字**を足し、その
途中で `impGrow()`（`www/import.js:652`）が単語の**読み**を切って、まだ
`SND` に無い音を `SND` へ押し込み `saveSnd()` する。音は三つ目の、誰も
数えていない副作用として入ってくる。

`impUndo()`（`www/import.js:685`）が戻すのは**二つだけ**:

```
  d.hws   足した単語を WORDS から抜く
  d.was   上書きした単語を元に戻す
  d.lts   足した文字を ltDel() で消す
  d.wasL  上書きした文字を元に戻す
  save(); saveLetters(); installScriptFont();
```

`SND` はこの一覧に無く、`saveSnd()` はここから一度も呼ばれない。
**`IMP.done` は足した音を控えてすらいない**ので、戻す材料が無い。
取り込みを取り消した言語には、取り込む前には無かった音が残り、音の章に
並び、キーボードとフォントがそれを数える。

**弁が片側なのは、もう一方が塞がれたから。** `claude/letters` の 1079ee2
「文字を消したら、その文字が読んでいた音も言語から出る」で `ltDel()` が
`ltUnits()` を見て音を落とすようになり、**文字と一緒に来た音は
`impUndo()` の `d.lts` ループ経由で自然に出るようになった。**
単語と一緒に来た音には、そのループが無い。同じ取り消しで、片方の音は出て
片方は残る。

**まだどちらの枝にも入っていない。** 1079ee2 は `claude/letters`（未取り込み、
`master` から 8 コミット先）にあり、`master` の `ltDel()`
（`www/letters.js:792`）は今も `LETTERS` を絞って `saveLetters()` するだけ。
つまり `master` の今の姿では**両側とも残る**。letters が入った日に、
これは「片側だけの弁」になる。

安全ではある ── 誰の作ったものも消えない。余分な音が増えるだけで、音は
手で消せる。だから backlog に置く。直すときに要るのは `impGrow()` が
足した音を `IMP.done` に控えることで、それは取り込みの記録の形が変わると
いうことなので、`docs/CHANGELOG.md` が先。

## 移行が値だけを配ったので、「触っていないのに既定でない」言語が出来る

`claude/grammar2` が 835f45c の本文で立てて、決めずに置いていったもの。
**その枝はまだ `master` に入っていない**（`master..origin/claude/grammar2`
= 7）。入った日にこれが起きる。

cd61ec4 の移行が `SET.order` / `SET.gpos`（電話に一つ）を
`STG.order` / `STG.gpos`（言語ごと）へ写したとき、**値だけを配って
`STG.set`（「この段は人が触った」という印）は触らなかった。**

そして 835f45c で、画面は `stTouched()` が偽の段の二択を光らせなくなった
（オーナー:「動詞の前と決まったわけじゃないのに」）。二つが噛み合うと:

> 言語 A で OSV を選んだ人の言語 B は、**OSV で並ぶのにボタンは光らない。**

値は効いている。印だけが無い。一覧の「3 / 5」も、その段を数えない。

```
  案1（今これ）  触られていないので光らせない。値は今まで通り効く。
                 「選んでいないのに光る」を移行で作らない。
  案2            移行のとき、既定と違う値を受け取った言語には印も付ける。
                 今日の画面と完全に同じに見える代わりに、
                 選んでいない言語が「選んだ」と言うことになる。
```

grammar2 は案1 で進めた。**逆にするなら移行のコミットだけ直せば足りる**
（移行はまだ誰の電話でも走っていない ── DEVICE CONFIRMED ではない）ので、
決めるならその枝が `master` に入る前が一番安い。

## 段の副題、英語の二本だけは言い直しではない

同じく `claude/grammar2`、c441c69 の本文から。決めずに置いていったもの。

オーナーの「これは説明だろ」は**日本語を見て**言われた。名指しの四本を
十言語ぶん落としたが、英語の二本は日本語ほど言い直しではない:

```
  stg.desc.d  "Where a describing word stands"   題は "Describing"
  stg.when.d  "When a thing happens"             題は "Time"
```

日本語（「修飾語の位置」「時の表し方」）は題の言い直しだが、英語の方は
「どこに立つか」「いつ起きるか」を足している。

**英語だけ残す道は無い。** `www/i18n/en.js` が鍵の集合の出所で、他の九つは
同じ鍵に答える、というのが i18n の規則だから ── 英語にだけ在る鍵は、
鍵の集合が言語ごとに違うということになり、`i18n-check` がそれを見る。
**「四本とも落とす」か「四本とも戻す」の二択。** 今は落ちている。

## 意味から一行が組み上がるようになったので、「例文を入力してください」が半分しか本当でない

`44dabdd`（置き場所①）が入ったあと、`www/phases.js` の `stAddEx()` は
こうなっている:

```js
  var gl=String((c&&c.value)||'').trim();
  var ln=gExLine(String(b.value||''), gl);
  if(!ln){ toast(t('word.ex.need')); return; }
```

`word.ex.need` は「例文を入力してください」/ "Write the line first"。
**これが書かれた時、行を書く以外に行が生まれる道は無かった。** 今はある ──
意味だけ書けば、辞書と語順が行を組む。だからこの一文が出る場面が二つに
割れた:

```
  両方とも空          「例文を入力してください」── 本当。
  意味は書いたが、その意味のどの語も辞書に無い
                      「例文を入力してください」── 半分しか本当でない。
```

二つ目は `gExLine()` が `''` を返す道で、`www/grammar-engine/` を Node で
そのまま動かして確かめた（`translate.run()` の `pieces` に `kind==='word'`
が一つも無い ⇒ `''`）:

```
  "I eat rice"  -> "mi poko luma"    語順 SOV が効いている
  "I eat bread" -> "mi bread luma"   持っていない語はそのまま残る
  "zzz qqq"     -> ""                ← ここ。トーストはこれに出る
```

人は意味を書いている。**書いていないのは行ではなく、その意味を言うための
単語。** そして `docs/FEATURES.md` は、足りない語について何をするかを既に
決めている ──「stays in the natural language and is shown IN RED, so the gap
is obvious — and it is also the door to making that word」。一語も無いときは
赤くする行そのものが無いので、その戸口はここにしか置けない。

**文言なので決めない。** 案は三つで、どれも新しい鍵が一つ:

```
  案1  何も足さない。今のまま。一文が二つの場面を兼ねる。
  案2  「この言語にまだ無い語です」に近い一文を、意味だけ書かれた時に出す。
  案3  同じ一文を、単語を作る画面への戸口にする（FEATURES.md の
       「door to making that word」を、行が組めなかった時にも通す）。
```

**①そのものには新しい文字列は要らなかった。** 意味の箱は
`word.ex.gl.ph`（「意味」/ "what it means"）を前から着ていて、
組み上がった行は `ln` の箱にそのまま入る。`c757ac4` が挙げた
`gram.pair.line` と `stg.ex` は、どちらも使わずに済んでいる。
残っている文言の問いは、上のこれ一つだけ。

## `press` が赤い ── 着る者のいないクラス三つ。`claude/wiki` のもの

2026-08-25、`claude/wiki`（`03fcfa3`）を `claude/leader-integration` に
取り込んだあと、全ゲートで `press` 一本が赤くなった。**25 検査中これ一本。**
直していない ── 統合の継ぎ目ではなく、枝の中で閉じていない所だから。

```
  classes worn: 576, styled and unworn: 7 (baseline 4)
  FAILED (3)
    nothing wears .abtline
    nothing wears .abts
    nothing wears .obws
```

**継ぎ目でないことは実測した。** `claude/wiki` の tip 単独で `press` を回すと:

```
  wiki 単独 03fcfa3   FAILED (5)  .abtline .abts .obws + .sth + lnin 34x251
  取り込み後          FAILED (3)  .abtline .abts .obws
```

差の二件は `leader-integration` が先に直したもの（`.sth` の削除と
`.pwfield .lnin.dir-ttb-*` の padding）で、取り込んだあとも直ったまま。
**三件は取り込む前から枝の上で赤かった。** `leader-integration` は
`www/home.js` に一行も触っていない（`git diff --name-only master..HEAD --
www/home.js` が空）。

三つは直し方が別々で、`press` 自身が二択で言っているとおり:

| クラス | 今どうなっているか | どちら側か |
|---|---|---|
| `.obws` | `master` では `www/home.js` が着ていた。wiki の `home.js` 書き直しで着る者が消え、規則だけ残った | **画面が消えた側** ── 規則を消す |
| `.abts` | 規則は `master` にもある。wiki が着る者を外し、今は `home.js:948` の**コメントの中にしか名前が無い** | 同上。ただしコメントが「`.abts` は `<h2>`」と、もう本当でないことを言っている |
| `.abtline` | wiki が新しく足した規則。`home.js:1123` の `<div class="abtl abtline">` が**着ている** | **種を足す側** ── 段が一つでも `stIsDone` な状態に歩きが届いていない |

`.abts` のコメントは CLAUDE.md の「a comment saying 'this is the one place'
is worth nothing on its own」に当たる。**着る者が消えたのに、着ていると
言っている行が残っている。**

**wiki の最新 tip（`6063190`、`03fcfa3` の次）でも三つとも同じままで、
直っていない。** 数え直した。

`tools/fixture.mjs` も `www/home.js` も `www/index.html` の該当行も
`claude/wiki` の持ち物なので、**そのセッションが閉じる。** リーダーが渡すなら
その時に。統合の側でやると、種の足し方も規則の消し方も、書いた人が
知っていることを知らずに決めることになる。

## 公式の印 ── 色と形は決まった。出す相手だけが決まっていない

**2026-08-25 に決まった（OWNER）:**

```
  青の塗り  ユーザー（払っている人）   ← 入れた。--verif、.bdg に一度だけ
  金の塗り  公式                      ← 決まったが入れていない
```

形は両方とも同じダイヤ（`MARK_PLUS`）。**色だけで分ける。**

**金の塗りを入れていないのは、出す相手を決めるものが無いから。** 入れると
誰にも出ない印が一つ増える。`dead-check` が「価格の裏に何も無い能力」を
落とすのと同じ形。オーナーは作者に参加の打診を出している（2026-08-25）ので、
**これは「やるかどうか」ではなく「返事が来たら」の話。**

`postBadge()` の前提を一つ跨ぐことだけ、先に書いておく: 印は「今この人が
払っているか」なので**他人の投稿には何も出ない**。公式の印は逆で、他人の
投稿にこそ出したい。その関数がそこを分ける場所になる。

以下は、そう決まる前に書いた下調べ。読み替えて使うこと。



**OWNER 2026-08-25**「バッチなんだけど、もし、公式のトキポナとかが参戦して
くれるなら、公式のパッチも作りたいんよね。だから色変えたいどう？」

**今日は何も入れていない。** 意見を訊かれたので、コードを読んで答えたものを
そのまま置く。決まっていないことのほうが多い。

### 今どうなっているか（読んだ結果）

```
  www/post.js:719  badgeMark()  印は一箇所。<span class="bdgw plus">
  www/index.html   .bdgw.plus    color:var(--gold)
                   .bdgw.studio  color:var(--gold)   ← Studio は消えたのに残骸
  www/core.js:642  CAN.badge = 'pro'
```

そして `post.js:692` に、**同じ話が一度決まって一度戻された跡**がある:
「plusとstudioでそれぞれTwitterの青バッチみたいなやつつけたい」。段が
二つから三つになったときに印は一つへ戻り、`.bdgw.studio` だけが残った
（`tools/css-baseline.txt` に載っているので `press` は黙っている）。

### 色を変えるのに賛成する理由は、好みではなく二つ

**一つ、金は「押せるもの／その言語のもの」の色。** `--gold` は `.brand .st`
から `.plangtag` まで全部これ。公式の印も金だと、**「払っている人」と「公式」
が同じ色**になり、並んだときに区別がつかない。

**二つ、印は post に焼かれない。** `postBadge()` の上のコメントが理由を
書いている ── 印は「今この人が払っているか」で、過去形にできない。だから
**他人の投稿には何も出ない**（サーバに訊けるまでの正直な答え）。公式の印は
逆で、**他人の投稿にこそ出したいもの。** つまりこの関数の前提を跨ぐ。

### 決まっていないこと、三つ。どれもコードでは決められない

- **色そのもの。** `--gold` の隣に変数を足す話で、色は `index.html` の
  二つのテーマブロックが唯一の置き場所。オーナーのもの
- **形も変えるか。** 色だけで分けると、色覚と暗いテーマで差が消える。
  形が違えば確実。二つ足すのか、一つを二色にするのか
- **「公式」を誰がどう決めるか。** これはサーバの話 ── `supabase/schema.sql`
  に列と RLS が要り、`npm run rls` の 34 項目に行が増える。
  **アプリ側では絶対に決められない。決めたら誰でも自称できる。**

### なぜ今日やらないか

**この段落は間違っていた。** 「トキポナが参戦するかは決まっていない」と
書いたが、オーナーは既に作者へ参加の打診を出していた。それを根拠に「今日は
やらない」と書いたので、根拠ごと間違い。**決めるのはオーナーで、私ではない。**
残っているのは出す相手を決める仕組みだけ。

順番としては、`docs/STATE.md` §7 の Wiki の SQL と同じところに並ぶ:
「見た目を完璧にしてからsqlね」の逆で、これは**先にサーバが要る**。

## 下書きについて、決まっていない二つ ── `claude/draft` が残した

`claude/draft` を取り込んだとき（2026-08-25）に一緒に運んだもの。
**どちらも「保存するもの」の決めごとなので、決めない。書き留めるだけ。**

### 下書きはバックアップに入れるか

`SLICES` に入れるかどうか。入れれば `bkPack()` が拾い、`wipeAll` が消す。
入れなければ**バックアップに無い**ので、アプリを消した人の書きかけは戻らない。

天秤の両側:

```
  入れる    書きかけも一緒に戻る。ただし「下書き」は未完成のもので、
            それを他の言語スライスと同じ重さで扱うことになる
  入れない  規則11「言語は失われない」が言っているのは言語であって、
            書きかけの投稿ではない、という読み方もできる
```

**2026-08-28**: 下書きはサーバーに在るようになったので、この天秤に三つ目の側が
できた ── 「バックアップに無くてもサーバーには在る」。アプリを消して入れ直した
人は、サインインすれば下書きが戻る。**それでもオーナーの決めごとなので、
決めない。書き留めるだけ。**

**規則6が「SLICES に入っていることが、そのスライスを本物にする」と言っている。**
キーボードと「言語が何のためか」の二つが SLICES の外に居て、片方はどの
バックアップにも入っていなかった。同じ形の判断。

### アカウント削除で下書きも消すか ── **決まった 2026-08-28**

書かれた当時は「下書きはこの電話の中のもの」という前提だった。その前提が
2026-08-27 の「SNSは全部サーバー」で無くなり、`claude/draft` が下書きを
`draft` の表へ移した。

**両側とも消える。** 端末側は `lsWipeNS()` が `lingua.` で始まる鍵を数えて
消すので、`lingua.drafts` も一緒に行く（`wipeAll()` は列挙しない ── 手で
書いた鍵の一覧は、誰かが足し忘れる一覧）。サーバー側は `draft.author` が
`profile(id) on delete cascade` なので `account_delete()` が消す。
オーナーの言葉:
「アカウント削除で残るものねえって言ってんだろ何回言わせんだよ全部消える」

DELETE REVIEW は `docs/CHANGELOG.md` の同じ日の項目に在る。

## 電話からファイルが出ていく道が二本ある ── 2026-08-27, claude/pw2

`www/card.js` の `cardDeliver()`（997行）と `www/wordsheet.js` の `exportCSV()`
が、同じ一つの規則を二回書いている: **share sheet を先に、`<a download>` は
ブラウザ用の落とし所。** カードは第15章で先にそれを決めていて、辞書の書き出しは
それを受け取っていなかった ── だから `<a download>` 一本のままで、WKWebView が
それを黙って無視するので、何も書かれていないのに「書き出しました」と出ていた
（`exportCSV()` は直した。二本になっているのは直していない）。

CLAUDE.md 「One place, not fifteen」そのものの形なので一箇所にしたいが、
`cardDeliver()` は card.js にあり、pw2 の territory の外。前置きも `card*` の
ままでは辞書から呼べない（前置きは本当のことを言っていなければならない）。
**一つの家に移すのは、機能と同じコミットに乗せてはいけない種類の作業**なので
ここに置く。

やること: 「ファイルを電話から出す」を一つの関数にして、card.js と
wordsheet.js の両方がそれを呼ぶ。文言は呼ぶ側が渡す（カードは
`t('card.saved')`、辞書は `t('toast.exported')`）。

**確かめられていないこと:** WKWebView が `<a download>` で何もしないことは
Linux では実機確認できない。証明できたのは「電話でもブラウザ用の道を通り、
どの条件でも成功と言う」ところまで。

## 形容詞の章が、十二の形すべてを「作る」と申し出る ── 2026-08-27, claude/gram

`g2Add()` が章のページに並べる作成の行は、その章が受け持つ形だけを並べる。
測ると四つの章はきれいに十二を分け合っている ── しかし五つ目が、その十二を
まるごともう一度名乗る。

```
n    pl                                        (1)
v    pst prs fut prg prf imp cnd cau pas       (9)
neg  neg                                       (1)
q    que                                       (1)
adj  pst prs fut prg prf neg imp que cnd cau pas pl   (12)
```

画面では「形容詞 ▸ 過去 ▸ 作成」「形容詞 ▸ 命令 ▸ 作成」「形容詞 ▸ 受身 ▸
作成」が並ぶ。`shots/gram-v2-adj.png` がそれ。

**なぜそうなるか。** `g2FmsOf(id)` は「この品詞にこの形の規則を書いたら、どの
章に描かれるか」を `g2Chap()` に訊く。`g2Chap()` の一行目は
`target==='ADJECTIVE'` ならば `adj`、で、これは正しい ── 数で一致する形容詞の
規則は feature が NUMBER なので、素直に読むと名詞の章へ行き、名詞の章は名詞を
描くので、規則はどこにも現れなくなる。その穴を塞ぐために書かれた行が、
**すべての feature を飲み込んだ**。

だから `g2FmsOf()` の問いも答えも、それ自体は筋が通っている。おかしいのは
`FM_INF` が品詞と無関係な十二の平らな並びであることで、これはこのセッションより
ずっと古い。同じ日に閉じた `vFmrFm` も、形容詞を選んだあと同じ二十四を
出していた。

**なぜ今日直さないか。** 「形容詞はどの形を取りうるか」は言語についての判断で
あって、表の整理ではない。CLAUDE.md 「Deciding … any threshold that is a
judgement — none of these are decided here」。思いつく案は三つあり、どれも
何かを発明する:

1. `g2Chap()` の形容詞の行を、形容詞が実際に一致する feature（NUMBER、CASE、
   あるいは比較級）だけに狭める ── 何が「実際に」かを決めるのが判断。
2. 形容詞の章は名詞の章と同じ形を並べる（一致とは名詞の feature が形容詞に
   現れることだから）── これも判断。
3. 作成の行は四つの章の分け合いに従わせ、形容詞の章は既にあるものだけ見せる
   ── すると形容詞の一致規則を**書く道がなくなる**。

`1af4f06` で入り、まだ master には出ていない。リーダーの取り込み前に出す。

## 作られた語が、また作られる ── 2026-08-27, claude/gram

規則で作った語が、その規則の対象としてまた出てくる。複数形の複数形。

```
kano → kanok → kanokk → ...
```

`fmrTodo(w)` は `w` が規則で作られた語かどうかを見ない。`w.from` が入っている
のに、見ていない。押すたびに一段深くなる。

`1af4f06` より前からある ── `git stash` して master 側のコードで測って確かめた。
`fmrAddAll` を章へ移した今日の変更とは無関係で、まとめボタンが画面のどこにあった
かとも関係ない。

**なぜ今日直さないか。** 「while I'm in here」は名指しで禁じられている。そして
直し方が一つに決まらない: `w.from` があれば除く、というのが素直だが、それだと
複合的な形（過去の否定、複数の所有）を規則二本で作る言語で、二本目が効かなく
なる。どこまで重ねてよいかは言語についての判断。

`tools/gramlang-check.mjs` の 99-105 は、この振る舞いをどちらにも主張していない
── 章のボタンを押したあと名詞の章が何を出すかは訊いていない。直したときに、
そこを訊く行を足せばいい。

## `rows measured` は押した順に依る ── 2026-08-27, claude/gram

`press` の四つの数のうち `rows in one list are one height: N lists measured`
だけが、**押した副作用に依存します**。`buttons pressed` のようにコミット単位で
比べられる数ではありません。

`measureRows()` はその画面を組んだ直後、**その画面を押す前**に走ります。しかし
一つ前までの画面の押下はもう済んでいて、`save()` が書いたもの、開いた form、
付いた `.on` はそのまま次へ持ち越されます。

測って確かめました。押下ループを 0 回に潰して 737 画面を組み直すと:

```
③ の前   2372
③ の後   2372     一画面も違わない
```

押下ループを戻すと同じ二つの木が 2383 と 2375 になります。差の 8 は
**画面の中身ではなく、押した二回（章のまとめボタン、二プラン）の副作用**から
出ています。

`buttons pressed` `distinct names` `screens built` は決定的で、二回走らせて
同じ値でした。`rows measured` も**同じ木なら決定的**（2375 が二回）── 順序に
依るだけで、乱れてはいません。

**何をすべきかは決めていません。** 各画面を押す前に seed し直せば決定的に
なりますが、それは今の歩き方（一つ前の画面の状態のまま次へ行く）を変えることで、
その状態こそが第14条「二回目の押下のあとに何が起きるか」の生きている部分です。
## キーに置く文字を選ぶ画面に、絞り込みも並べ替えも無い

「レター多くなったら選ぶのキツくね？」 **OWNER 2026-08-27**

`kbLtGrid()`（`www/keyboard.js`）は `ltOrder(ltOfKind('alpha'))` を**そのまま
全部**並べます。検索も絞り込みも並べ替えもありません。無料の38文字なら問題
ありませんが、有料で文字を足していくと、300文字なら300枚のタイルを目で探すこと
になります。

**同じ一覧が隣の画面にはあり、そちらには両方あります。** `www/sound.js` の
アルファベットの画面は `ltSort`（own / abc / new）と `ltFil`（all / drawn /
blank / nosnd）を持っています。**同じものを二か所で見せていて、片方にだけ道具が
ある**という形です。

一番小さい直し方は、あの二つをこの画面でも使うことです ── 新しく考えるのでは
なく、すでにある一つの仕組みを呼ぶ。ただし「検索の箱も要るのか」「既定は
どれか」は見た目の判断なので、**オーナーに聞くまで手をつけていません。**

表語文字（日本語のような）は**この画面の問題ではありません** ── 下の項を参照。

## キーボード一覧の縮小図は、縦に結合したキーを一行ぶんで描く

kb5 がリーダーに残した二つのうちの片方。`kbShotHTML()`（`www/keyboard.js`）が
描く 96px の縮小図は `.kbsr`/`.kbsk` という別の class の別の絵で、`--rh` を
読みません。だから二行ぶんのキーがある板を一覧で見ると、そのキーだけ一行に
見えます ── **一覧が、そこにある板と違う板を見せている**ということです。

直すならもう一組 CSS が要り、`www/index.html` に入ります。96px の絵で、
どのキーがどうなっているかを読む場所ではないので**今は入れていません**。
一覧から「これだ」と選べなくなったら、そのときに入れる。

## 縦に結合したキーの下半分に、選ばれた行の紫の帯が掛かる

kb5 の残したもう片方。**そのままにする**、というのがリーダーの答え。

`.kbrow` は `position:relative` で z-index が auto なので重ね順は DOM 順に
なり、後にある下の行の帯が勝ちます。**下半分はその行のものでもある**ので、
掛かっているのは嘘ではありません ── 行を選んで消せば、その半分は無くなります。
帯はそれを言っています。

消したくなったら `kbRhCSS()` に `;z-index:1` を足すだけで、`index.html` は
要りません。**先に、実機で見て気になるかどうか。**

## `docs/STATE.md` が古くなっても、何も赤くならない

2026-08-27。オーナー「古いのは全部新しくする約束は？ 全員に伝わってんの？」

**伝わっていて、効いていませんでした。** 原因は規則の言葉が狭かったこと ──
`CLAUDE.md` は「決定が**規則**を置き換えたら規則を直せ」と書いていて、
`STATE.md` は規則ではなく**現状**なので字面に当たりませんでした。そして三箇所が
「読め」と言い、**どこも「書け」と言っていなかった**ので、あの file は誰のものでも
ありませんでした。規則の言葉は広げ、持ち主はリーダーだと書きました。

**それでも prose です。** `CLAUDE.md` 自身が言っているとおり ──「検査が主張を
持つか、主張をしないか、どちらかだ」。角丸禁止は文章では守られず `box-check` が
できて初めて止まりました。ここも同じで、**今は何も赤くなりません。**

### 機械で照合できるもの

`STATE.md` が「無い」「まだ」「Not started」「していない」と書いている行のうち、
**名前を挙げているもの**は照合できます。今日見つかった二つがちょうどその形でした:

```
「No StoreKit」          ← ios/App/App/LinguaStore.swift が在り、
                           www/settings.js が storeBuy を呼んでいる
「7. StoreKit ... Not started」  ← 同上
```

やり方: `STATE.md` から否定の文を拾い、そこに現れる識別子
（`LinguaStore.swift`、`storeBuy`、`GOOGLE_IOS_ID` のような）を repo で引く。
**在れば赤。** 逆方向 ──「在る」と書いてあるものが無い ── も同じ形で引けます。

### 照合できないもの、そしてそれが半分以上

**App Store Connect・Apple の開発者サイト・Google Cloud・Supabase のダッシュ
ボードは repo の外です。** そこが済んでいるかは**オーナーしか知りません**。今日の
間違いはまさにそこで、リーダーが repo の外のことを repo の中の古い文から推測して
報告しました。だから `STATE.md` に「この file から見えないもの」の段落を足して、
**「済」はオーナーが言った日付つきの伝聞である**と書き分けてあります。
**検査はそこには触れられません。** 触れられないことを、書いておくのが唯一できる
ことです。

### なぜ今日やらないか

検査を一本増やす話で、いま四本のセッションが動いています。**ビルドのあとに。**

## 形容詞の章が、十二の形すべてを「作る」と申し出る ── 2026-08-27, claude/gram


## 辞書の ⋯ が、何も入っていない紙を開く ── 2026-08-27, claude/gram × claude/ai

**二つの削除が合わさった結果で、どちらのセッションの設計でもありません。**

```
claude/ai   AIに相談の行を ⋯ から出してバーの印にした（91bc7c1、オーナー決定
            「AIを使いたいって思うとこどこ？隠してどうすんの？」）
claude/gram 規則で作る形の行を ⋯ から出して文法の章に移した（d60d466）
```

`wordsMore()` に残っているものはありません。⋯ はバーに立ったままで、押すと
空の紙が開きます。

**どちらの側も相手の行を消していません。** master を取り込むまで、どちらの
ブランチでも紙には一行残っていました。

**答えはたぶん、その関数の上のコメントが既に書いています** ──
「a row that opens nothing is a button that used to work」。⋯ 自体を外す、が
素直です。そこには「ダウンロードした単語リストがいずれ入る」とも書いてあり、
まだ入っていません。

**このセッションでは外しませんでした。** ⋯ は `vWords()` のバーにあり、
`claude/ai` が今朝書き直した場所です。`docs/SESSIONS.md`「リーダーが持ち場を
決め、セッションはそれ以外を触らない」。**リーダーの判断です。**

1. `g2Chap()` の形容詞の行を、形容詞が実際に一致する feature（NUMBER、CASE、
   あるいは比較級）だけに狭める ── 何が「実際に」かを決めるのが判断。
2. 形容詞の章は名詞の章と同じ形を並べる（一致とは名詞の feature が形容詞に
   現れることだから）── これも判断。
3. 作成の行は四つの章の分け合いに従わせ、形容詞の章は既にあるものだけ見せる
   ── すると形容詞の一致規則を**書く道がなくなる**。

`1af4f06` で入り、まだ master には出ていない。リーダーの取り込み前に出す。

## 作られた語が、また作られる ── 2026-08-27, claude/gram

規則で作った語が、その規則の対象としてまた出てくる。複数形の複数形。

```
kano → kanok → kanokk → ...
```

`fmrTodo(w)` は `w` が規則で作られた語かどうかを見ない。`w.from` が入っている
のに、見ていない。押すたびに一段深くなる。

`1af4f06` より前からある ── `git stash` して master 側のコードで測って確かめた。
`fmrAddAll` を章へ移した今日の変更とは無関係で、まとめボタンが画面のどこにあった
かとも関係ない。

**なぜ今日直さないか。** 「while I'm in here」は名指しで禁じられている。そして
直し方が一つに決まらない: `w.from` があれば除く、というのが素直だが、それだと
複合的な形（過去の否定、複数の所有）を規則二本で作る言語で、二本目が効かなく
なる。どこまで重ねてよいかは言語についての判断。

`tools/gramlang-check.mjs` の 99-105 は、この振る舞いをどちらにも主張していない
── 章のボタンを押したあと名詞の章が何を出すかは訊いていない。直したときに、
そこを訊く行を足せばいい。

## `rows measured` は押した順に依る ── 2026-08-27, claude/gram

`press` の四つの数のうち `rows in one list are one height: N lists measured`
だけが、**押した副作用に依存します**。`buttons pressed` のようにコミット単位で
比べられる数ではありません。

`measureRows()` はその画面を組んだ直後、**その画面を押す前**に走ります。しかし
一つ前までの画面の押下はもう済んでいて、`save()` が書いたもの、開いた form、
付いた `.on` はそのまま次へ持ち越されます。

測って確かめました。押下ループを 0 回に潰して 737 画面を組み直すと:

```
③ の前   2372
③ の後   2372     一画面も違わない
```

押下ループを戻すと同じ二つの木が 2383 と 2375 になります。差の 8 は
**画面の中身ではなく、押した二回（章のまとめボタン、二プラン）の副作用**から
出ています。

`buttons pressed` `distinct names` `screens built` は決定的で、二回走らせて
同じ値でした。`rows measured` も**同じ木なら決定的**（2375 が二回）── 順序に
依るだけで、乱れてはいません。

**何をすべきかは決めていません。** 各画面を押す前に seed し直せば決定的に
なりますが、それは今の歩き方（一つ前の画面の状態のまま次へ行く）を変えることで、
その状態こそが第14条「二回目の押下のあとに何が起きるか」の生きている部分です。
何も throw しません。紙は見出しの分だけ開くので `press` の「画面が空になった」
にも当たりません。人が押して初めて分かるやつです。

## 下書きは端末にあった ── 2026-08-27、**済 2026-08-28 `claude/draft`**

「SNSは全部サーバー」 **OWNER**、この日にまた言われた。**また、というのが
この項目の要点**で、仕様が曖昧なのではなく**コードが古いまま読まれていた**。

**この項目は録音について間違っていた。** 元は「下書きと録音が、まだ端末に
ある」と書いてあり、下の表で `Documents/Voices/*.m4a` を「サーバーへ行かない」
側に並べていた。**投稿された録音は、この項目が書かれた時点で既にサーバーに
在る** ── `netUpVoice()`（`www/net.js`）が Storage の `<uid>/<pid>/vo.m4a` に
上げ、`row.body.vu` に道を書き、`voRemote()`（`www/rec.js`）が端末のと
サーバーのを一文字で見分ける。コードを読まずに下書きと同じ側に並べたもので、
**録音のところは直すところではなかった。**

端末にしか無かったのは下書きだけ:

```
lingua.drafts          端末の平の鍵。サーバーへ行かなかった
```

そして**下書きが持っている録音も、端末の「ファイル」ではなかった** ──
composer は `PW.vo = {b64, mime, ms}` を手に持っているだけで、ファイルに
なるのは投稿のとき `voKeep()` が書く瞬間が最初。下書きは base64 のまま
`lingua.drafts` の中に入っていた。写真も同じ。だから下書き一つが数MBになり得た。

### どう直したか

`draft` の表を別に作った。`post` の列にはしなかった ── `post_read` は
「隠されていない行はサインインした誰でも読める」なので、下書きをそこに入れると
読む道の全部に「下書きは除く」を足さない限り公開され、**足し忘れは何も
throw しない**。`post(id)` を参照する表も三つあり（`quote` `react` `report`）、
その形だと下書きに「いいね」が押せる行が実在する。

四つの policy 全部 ── select も ── が `is_member() and author = auth.uid()`。
`tools/rls-check.mjs` に他人が突く行を足した。

アカウント削除は `profile` からの cascade で効く。`account_delete()` は無変更。
**媒体をバケットに置かなかったことがここに効いている**: `post-media` は public
で、かつ `netMyFiles()` は消す道を `post.body` からしか集めないので、下書きが
バケットに持ち物を持つと「他人に読める」と「誰も指さないファイルが残る」の
両方になっていた。下書きの写真と録音は `draft.body` の中に base64 のまま在り、
バイトが上がるのは投稿されるときだけ。

### 残っているもの

- **`bootSession()`（`www/boot.js`）から下書きを取りに行っていない。**
  あのファイルは `claude/draft` の持ち物ではないので、今は「下書きの画面を
  開いたとき」に取りに行く（`draftsPullOnce`、uid ごとに一度）。起動時に
  欲しいなら `www/boot.js` を持っている人が一行足す。
- **打鍵中の自動保存は無い。** リーダーは「打つ手が止まって数秒後」と言ったが、
  **composer で書いている間は下書きがまだ存在しない** ── 今のアプリで下書きが
  できるのは「戻る」を押して確認に「はい」と答えた瞬間だけ（`tools/draft-check.mjs`）。
  なので debounce する対象が無い。書いている途中でアプリが死ぬと、今まで通り
  何も残らない。これは移行の前からそうで、**直すなら composer の側の話**で、
  下書きをサーバーへ移す話ではない。決めるのはオーナー。
- **私的な投稿（`pv`）の下書きもサーバーに行く。** 下書きは本人しか読めないので
  policy 上は問題ないが、「自分専用」を選んだ人が下書きもサーバーに行くと
  思っているかは**決まっていない**。決めるのはオーナー。
- `tokinets.com/lingua/privacy.html` は、これで書ける。

