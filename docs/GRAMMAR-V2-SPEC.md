# Grammar v2 — オーナーの指示書

**これはオーナーが書いた仕様です。** `CLAUDE.md`「An owner decision is a
specification, not an instruction for today」— このとおりに実装し、もっと自然な
形に読み替えたり、近いものに一般化したりしない。この文書を変えてよいのは
オーナーだけ。

**2026-08-27 に repo に入りました。書かれたのはもっと前です。** 宛先は
`feature/grammar-engine` で、その枝で §15 の Phase 1〜8 の内部モデルが作られ、
master に入りました。**指示書そのものは repo のどこにも無く、その後のセッションに
一度も渡っていません。** ⑥（`claude/gram`）は「旧ページに手を入れるな、置き換えは
最後」という要約だけを受け取り、旧ページの上に小さく足していました。オーナー:

> 「新しいブランチで新しいように始めたのになんで昔使ってたやつと同じような見た目に
> なってんの？」
> 「俺はこうやって指定してたはずなんだが」

**だから、これはここにあります。** 要約を渡すのではなく、この文書を読ませること。

---

## 0. この作業の目的

Lingua の「文法」機能を根本から再設計する。

現在の Lingua は、単語・文法・例文・SNS投稿 が十分に繋がっていない。

現在の `grammar.js` では主に `SET.order` / `SET.gpos` / `ORDERS` / 形容詞の位置 /
否定語の位置 / 場所表現の位置 などを設定している。

しかしこの構造では、

- 「この単語に、この文法がどう作用するのか」
- 「この文法によって、この単語がどう変化するのか」
- 「この文章が、なぜこの意味になるのか」

を機械的に理解できない。

今回の目的は、文法ページを単なる「文法設定画面」から

> **「Lingua で作った言語そのものを定義する場所」**

へ変更すること。最終的には

```
文字 → 単語 → 品詞 → 形態素 → 語形成 → 語形変化 → 文法 → 文章
→ 意味構造 → Parser → Generator → 翻訳
```

まで一つのデータ構造で繋げる。

## 1. 最重要方針

既存の文法ページを少し改修するだけではない。**「Grammar v2」を新しく設計する。**

`SET.order` / `SET.gpos` / `WORDS` / `grammar.js` などは**参考にする**。ただし
**新しい設計を既存データ構造に合わせて歪めない。** 必要なら既存データ構造を変更する。

既存データは 旧データ → Migration → Grammar v2 という形で移行する。
**既存ユーザーのデータを壊さないこと。**

## 2. 現在の Grammar Page

`ORDERS = [SOV, SVO, VSO, VOS, OVS, OSV]` があり `SET.order` を保存している。
`SET.gpos` で `adj` / `negp` / `adp` の位置を管理している。

つまり現在は「SOVか？」「形容詞は前か後か？」「否定語はどこか？」という設定中心。
**これを Grammar v2 では根本的に変更する。**

## 3. 新しい Grammar Page の考え方

新しい Grammar Page は「文法を読むページ」ではなく **「文法を作るページ」** にする。

ユーザーに最初から SOV / SVO / VSO などを選ばせるのではない。まず
**「実際に自分の言語で文章を作ってみる」** ところから始める。

Lingua が単語を持っている場合、`hejo` `mi` `luma` `poko` `gmd` などの実際の単語を
表示する。ユーザーに「この言語では、誰が・何を・どうする、をどんな順番で並べますか？」
と聞く。ユーザーがドラッグして SUBJECT / OBJECT / VERB と並べる。その結果 SOV を
**自動的に導出する**。

**重要: ユーザーが SOV という専門用語を知らなくても、言語を作れる UI にする。**
SOV という表示は**結果として**表示する。

## 4. Grammar Page の大構成

### 1. Sentence Structure
「文章を作ってみましょう」。実際の単語を使って SUBJECT / OBJECT / VERB を並べる。
`[私] [りんご] [食べる]` → ユーザーが並び替える → Lingua が `Word order: SOV` と
認識する。**SOV を直接入力させる必要はない。**

### 2. Nouns
Number / Case / Determiners / Plural / Possession など。ユーザーが「りんご」
「りんごたち」を実際の言語で作る（`poko` / `poko-mi`）。ユーザーが差分を定義する。
内部: `feature:NUMBER  value:PLURAL  operation:SUFFIX  form:-mi`

### 3. Verbs
Present / Past / Future / Aspect / Mood / Person / Number / Voice など。
`luma`(食べる) / `luma-ka`(食べた) をユーザーが実際に作る。Lingua が差分を Rule として
登録できる。内部:
```
{ type:"inflection", target:"VERB", feature:"TENSE", value:"PAST",
  operation:"SUFFIX", form:"ka" }
```

### 4. Negation
「私は食べる」を作ってもらう。次に「私は食べない」を作ってもらう。
`mi luma` / `mi na luma` なら NEGATION / operation:PREFIX / form:na として保存。

**ただし「必ず PREFIX になる」と決めつけない。** `mi luma-na` なら SUFFIX として
登録する。また「別単語を使う」言語も存在する。その場合は
NEGATION / operation:WORD / form:na のように扱えるようにする。

### 5. Questions
「あなたは食べる」→「あなたは食べる？」のような変化。方法は言語によって違う —
suffix / prefix / separate word / word order / particle / intonation / combination など。
**Lingua 側が勝手に決めない。** ユーザーが実際の文章を作り、ルールを定義する。

### 6. Adjectives
単に before / after だけにしない。「赤い家」を `red house` / `house red` どちらで
表現するか。さらに**形容詞そのものが変化する言語**にも対応できるようにする。
NOUN → DERIVATION → ADJECTIVE という語形成も扱う。

### 7. Adpositions / Location
現在の `adp` の位置設定だけではなく「場所をどう表現するか」を定義できるようにする。
`house in` / `in house` / `house-LOC` など。単純な位置設定ではなく
CASE / ADPOSITION / MORPHEME / WORD などのルールとして扱えるようにする。

### 8. Word Formation
**非常に重要。** 文法ページ内に「Word Formation」または「Derivation」セクションを作る。
`beauty` → `beauty-li` → beautiful。内部:
```
{ type:"derivation", sourcePOS:"NOUN", targetPOS:"ADJECTIVE",
  operation:"SUFFIX", form:"li" }
```
VERB → NOUN / ADJECTIVE → ADVERB / NOUN → VERB なども扱えるようにする。

## 5. Grammar は「説明文」ではなく Rule として保存

ユーザーには自然な説明を見せてよい（「過去形は動詞の後ろに -ka を付けます。」）。
しかし内部データは
```
{ id:"...", type:"inflection",
  target:{partOfSpeech:"VERB"},
  feature:{category:"TENSE", value:"PAST"},
  operation:{type:"suffix", form:"ka"} }
```
のようにする。Rule は将来 Generator が直接利用できる構造にする。

## 6. Word と Grammar を完全に関連付ける

**重要。** `luma` は `{word:"luma", meaning:"食べる"}` ではない。少なくとも
`id` `lemma` `surface` `meaning` `partOfSpeech` `morphemes` `features`
`derivation` `inflections` と関連できる構造にする。

`luma-ka` を解析すると surface:`luma-ka` / lemma:`luma` / features:`{tense:"PAST"}`
に戻せるようにする。つまり **Generate と Parse の両方向**を考えてデータモデルを作る。

## 7. Morpheme

`luma-ka` → `luma`(ROOT) + `ka`(INFLECTION)。`na` は NEGATION など。
将来的には prefix / suffix / infix / circumfix / reduplication / ablaut / suppletion
なども考慮する。**最初から全部実装する必要はない。重要なのは operation を拡張できる
設計にすること。**

## 8. Example Sentence

例文は説明用のテキストではない。**「言語データ」として保存する。**
`mi poko luma-ka` なら tokens:[mi, poko, luma-ka]、structure: SUBJECT:mi /
OBJECT:poko / PREDICATE:luma、features: TENSE:PAST という構造を持てるようにする。

## 9. Sentence Builder

Grammar Page 内に将来的に Sentence Builder を設置する。Meaning「私はりんごを食べる」を
表示 → ユーザーが自分の言語で `[私][りんご][食べる]` を並べる → Lingua が構造を保存。
次に「私はりんごを食べた」を作る → `luma` → `luma-ka` の差分を確認 → ユーザーが
「これは過去形」と指定する → GrammarRule 作成。

これによって**文法を実際の言語データから構築できる。**

## 10. Grammar Builder で勝手に推測しない

**これは重要。** Lingua が「luma → luma-ka だからこれは過去形ですね」と勝手に確定する
設計にはしない。Lingua は差分を検出して「luma → luma-ka という変化があります」と
提示する。ユーザーが「これは PAST です」と定義する。

**AI が文法を決めるのではなく、ユーザーが言語を定義する。** AI を補助に使う場合も
最終的な Rule はユーザーが承認する。

## 11. Semantic IR

「私は昨日りんごを食べなかった」→
```
{ predicate:{concept:"EAT"},
  arguments:[{role:"AGENT",concept:"I"},{role:"PATIENT",concept:"APPLE"}],
  time:{type:"PAST", value:"YESTERDAY"},
  polarity:"NEGATIVE" }
```

**重要: Semantic IR には SOV/SVO などの言語固有情報を入れない。** 言語固有情報は
Grammar 側。そのため 日本語 → IR → Lingua A Grammar → Lingua A、また
Lingua A → IR → Lingua B Grammar → Lingua B ができるようにする。

## 12. Parser

`mi poko luma-ka` を tokens → morpheme analysis → word lookup → grammar analysis
→ sentence structure → Semantic IR へ変換する。`luma-ka` → `luma`(lemma) + `ka`
(suffix) → TENSE=PAST まで解析する。

## 13. Generator

逆方向。IR(AGENT=I / PATIENT=APPLE / PREDICATE=EAT / TENSE=PAST) → Lingua Grammar
→ word order → inflection → `luma-ka` → `mi poko luma-ka`。

## 14. 文法ページの最終 UI イメージ

```
Grammar
[Language overview]
--------------------------------------
Sentence Structure
「文章を作ってみよう」
[ 私 ] [ りんご ] [ 食べる ]      ↕ drag
Your language:  SUBJECT → OBJECT → VERB
Detected: SOV                     [Edit]
--------------------------------------
Nouns
Number   [ Singular ] [ Plural ]
Example: poko / poko-mi
Rule:    NOUN + -mi = PLURAL
--------------------------------------
Verbs
Tense    Present / Past / Future
Example: luma / luma-ka
Rule:    VERB + -ka = PAST
--------------------------------------
Negation
Positive: mi luma
Negative: mi na luma
Rule:     NEGATION = PREFIX "na"
--------------------------------------
Questions
Statement: mi luma
Question:  mi luma?
[Define question rule]
--------------------------------------
Word Formation
NOUN → ADJECTIVE
[beauty] → [beautiful]
Rule: NOUN + -li → ADJECTIVE
--------------------------------------
Cases / Roles
Nominative / Accusative / Dative / Locative / etc.
--------------------------------------
Examples
[Create example sentence]
Every example sentence should be stored structurally.
--------------------------------------
Grammar Rules
List all defined rules.
  TENSE / PAST        VERB / SUFFIX / ka
  NEGATION            PREFIX / na
  NOUN → ADJECTIVE    SUFFIX / li
--------------------------------------
Language Engine Status
Words:124  Morphemes:31  Derivations:8  Inflection rules:12
Grammar rules:24  Structured examples:16
Parser coverage:...  Generator coverage:...
```

このように「文法を説明するページ」から**「言語を構築・定義するページ」**へ変更する。

## 15. UI 実装の順番

**UI を一気に作らない。まず内部モデル。**

```
Phase 1  Grammar model
Phase 2  Word ↔ Grammar
Phase 3  Morpheme
Phase 4  Derivation
Phase 5  Inflection
Phase 6  Sentence
Phase 7  Semantic IR
Phase 8  Parser / Generator
```

ここまでの内部構造が安定してから Grammar Page UI を作る。
UI は最終的にこのエンジンを操作するためのもの。

## 16. Migration

`SET.order = "SOV"` → `{type:"wordOrder", sequence:["SUBJECT","OBJECT","VERB"]}`

`SET.gpos.adj = "after"` → **旧仕様として保持するのではなく、新しい Grammar Rule へ
変換する。**

ただし、現在の gpos だけでは表現できない情報については**勝手に推測しない。**
Migration で確定できない部分は「未定義」として扱う。

## 17. Backward Compatibility

既存ユーザーの言語を壊さない。Old Language Data → Migration → Grammar v2。
**Migration は冪等にする。** 何度実行しても同じ結果になるようにする。

## 18. 保存形式

現在は `lingua.<languageId>.*` で言語ごとのデータを管理している。Grammar v2 も
言語単位で保存する。

ただし**将来 Supabase 等へ移行する可能性も考えて、UI から直接 localStorage の構造に
依存しない。** `GrammarRepository` / `LanguageRepository` / `SentenceRepository` など
データアクセス層を分離できる構造にする。

## 19. テスト

最低限: Word (`luma` POS=VERB) / Inflection (`luma` + PAST/suffix/ka → `luma-ka`) /
Reverse parsing (`luma-ka` → lemma=luma, TENSE=PAST) / Negation (`na`+`luma` →
NEGATION=true) / Word Order (SOV → SUBJECT→OBJECT→VERB) / Sentence
(`mi poko luma-ka` → SUBJECT=mi OBJECT=poko PREDICATE=luma TENSE=PAST) /
Derivation (NOUN + li → ADJECTIVE) / Migration (旧 SET.order=SOV → 新 wordOrder=SOV)

## 20. 既存チェック

`npm run es5` と `npm test` を壊さない。可能な限り `npm run word` / `migrate` /
`post` / `kb` なども確認する。**新しい Grammar Engine 用テストも追加する。**

## 21. コード構成

推奨:
```
www/grammar-engine/
    model.js  repository.js  morphology.js  derivation.js  inflection.js
    grammar-rules.js  sentence.js  semantic-ir.js  parser.js  generator.js
    migration.js
```
ただし現在のプロジェクト構造を確認した上で、より適切な構成があるなら変更してよい。
**重要なのはファイル名ではなく責務分離。**

## 22. 今回やってはいけないこと

- いきなり既存 `grammar.js` を全部書き換える
- master を変更する
- UI だけ先に作る
- SOV/SVO を固定的に扱う
- 英語の文法を前提にする
- AI に文法を推測させて確定する
- 単語を単なる文字列として扱う
- 語形変化を文字列 replace だけで実装する
- Semantic IR に言語固有情報を混ぜる
- 既存ユーザーのデータを削除する
- 既存データを無理に新モデルへ合わせる

## 23. 最初のゴール

Word: `mi`(PRONOUN,"I") / `poko`(NOUN,"apple") / `luma`(VERB,"eat")
Grammar: Word order SUBJECT→OBJECT→VERB / Past: VERB + suffix "ka" /
Negation: prefix "na"

これを使って `mi poko luma-ka` を生成できる。そして `mi poko luma-ka` を解析すると
`{subject:mi, object:poko, predicate:luma, tense:PAST}` を取得できる。さらに
`mi poko na luma-ka` なら `negation:true` が加わる。

**ここまでが最初の重要マイルストーン。**

## 24. 最終目標

Lingua は最終的に「人工言語を作るアプリ」ではなく、
**「人工言語を定義し、その定義から文章を理解・生成・翻訳できる言語プラットフォーム」**
にする。

ユーザーが作り込むほど Words + Morphemes + Derivations + Inflections +
Grammar Rules + Examples + Sentence Structures が蓄積され、その結果
Parser / Generator / Grammar Checker / Translation の精度が上がる。

つまり**「言語を作る」ことと「その言語を使う」ことを同じデータ構造で実現する。**

今回の Grammar Page 再設計は、この Language Engine を操作するための中心 UI として
実装する。**まず内部設計を完成させ、その後に Grammar Page UI を新しく作ること。**

---

# 完成の定義 ── オーナー決定 2026-09-07

「文法のページが中途半端すぎる」「2 を中途半端にしないで欲しい」
「この文法ページを埋めたら翻訳にもなるし文法書になる」

**この章を全部埋めたとき、二つが同時に成り立つ。**

- **(a) 翻訳** ── 意味（Semantic IR）から、その言語の文が作れる
- **(b) 文法書** ── 章をそのまま並べれば、その言語の文法書になる

**一つの文の語順だけでは足りない。**下が完成の定義であり、これ以外を
「文法が埋まった」と呼ばない。空の章は薄い字で目次に出る。

## 章立て ── オーナー決定 2026-09-11

「否定形単体じゃなくて、文法書なんだから動詞とかのページに作るべき。項目増やす
よりも一つ一つ厚みを増やして。多少は分けていいけど、文法の教科書みたいなのを見て
章分けを決めてくれ」

**43 行の平らな一覧をやめ、9 章＋付録にする。**今までの項目は章の中の**節**。
順は記述文法書の目次のとおり ── 文、名詞、代名詞、数詞、動詞、修飾、
前置詞・後置詞、複文、語形成、そして付録。表は `G2BOOK`（`www/phases.js`）で、
**ここの表とあちらの表は同じもの。数える時はあちらを読む。**

| # | 章 | 節 | 状態 |
|---|---|---|---|
| 1 | 文 | 語順（`order`）── 副詞・場所・時・疑問詞・コピュラ・比較の相手の位置もこの板 | ある |
| | | 名詞句の並び（`np`）── 指示詞・数・形容詞・所有者・関係節が名詞の前か後か | **出来た**（`STG.np`・`NOUNPHRASE`/`ORDER`） |
| | | です／ある（`cop`）── 語と、名詞の文・存在の否定と疑問 | **出来た**（`CHAP_SLOTS.cop`・位置は語順の板の `CMP`） |
| 2 | 名詞 | 名詞の種類（`ncls`）── 性・クラス。無し／2 つ／3 つ…、名前は自由、語ごとにどれか、一致 | **出来た**（`STG.ncls`・`CLASS` の rule）。**消す道は無い** |
| | | 複数（`pl`） | ある |
| | | 格の印（`n`）と 助詞（`part`）── 主語・目的語・渡す相手・所有・場所・道具・共同 | **出来た**（`part` の枠が七つ・`GCASE`） |
| | | 冠詞・指示詞（`det`）── a／the／this／that に当たる語 | **出来た**（`CHAP_SLOTS.det`・位置は §2 の板） |
| | | 所有（`have`） | ある |
| 3 | 代名詞 | `pron` の六つ | ある |
| 4 | 数詞 | `count` | ある |
| 5 | 動詞 | 人称と数（`p1s` `p2s` `p3s` `p1p` `p2p` `p3p`） | **出来た**（`FM_INF` の末尾六つ・`PERSON`） |
| | | 時制と相（`prs` `pst` `fut` `plp` `prg` `prf`） | ある |
| | | 法（`imp` `cnd` `pot` `obl` `des`）── 命令の節の中に、その否定と疑問 | **出来た**（`MOOD` が五つ） |
| | | 態（`pas` `cau`） | ある |
| | | 否定（`neg:v`）・疑問（`q:v`）── 疑問詞の位置は語順の板 | **出来た**（`STG.gr` の Rule ── 接辞／語／語順／組み合わせ、否定する相手ごとに一本。`gPolPut()`） |
| 6 | 形容詞と副詞 | 形容詞の側（`adj`） | ある |
| | | 比較（`cmp`）・最上（`sup`） | **出来た**（`DEGREE`・`than` の語と側・語順の `STD`） |
| 7 | 前置詞・後置詞 | 場所と時の語（`adp`） | ある |
| 8 | 複文 | 従属節の位置と印、関係節の印、並列（`cx`） | **出来た**（`gpos.cx/cxm/relm`・`ir.relations`） |
| | | 接続詞（`conj`）── 印の語もここ | ある |
| 9 | 語形成 | 派生（§4.8） | **無い。**空の章として目次に薄い字で出る |
| 付 | 付録 | あいさつ（`greet`）・敬語（`polite`）・時（`when`）・月（`month`）・曜日（`wday`）・この言語について（`st`）・人が足した段 | 今のまま |

**章の頁は見出しで節をまとめる。**区切りは `G2BOOK` の表が持つ（表一つ。
二箇所に書かない）。動詞は 人称と数／時制と相／法／態／否定と疑問 の五つ、
名詞は 格（名詞・助詞）、形容詞と副詞は 比較（比較級・最上級）。**節が一つの
群には見出しを付けない** ── 「複数」の見出しの下に「複数形」の行が一つ並ぶのは、
行の名を二度書いているだけだから。

**空の章は薄い字で目次に出る。**書かれた節が一つも無い章も同じで、目次はどの章が
どこまで書かれたかを開かずに言う。

**`st`（この言語について）はまだどこにも無い。**`G2BOOK` の付録に名前だけ入って
いて、節が無いので行は出ない。作るかどうかは決まっていない。

**否定と疑問は章ではなく節。**四つの対象（動詞の文・名詞の文・命令・存在）は
それぞれ属する節から開く ── 動詞の文は動詞の章の「否定形」「疑問形」、命令は命令
の節の中、名詞の文と存在は「です／ある」の節の中。**四つから選ぶだけの頁は
2026-09-11 に消した。**章そのものが持っていたもの（「〜ない」の語、疑問詞六語、
古い規則、例文）は最初の対象（`:v`）の頁にある ── 他の三つが落ちてくる先だから。

## 翻訳が成り立つことの測り方

`tools/grammar-engine-check.mjs` が、上の章を全部埋めた言語で **Semantic IR
から一文ずつ書ける**ことを章ごとに主張する ── 主語・動詞・目的語・渡す相手・
時制・相・法・態・否定・疑問・形容詞つき名詞句・指示詞・複数・所有・場所句・
関係節つき名詞句・従属節つき文。

**そして章が空のときは、その部分が「抜ける」ことも主張する。**壊れるのでは
なく、その章が何も言っていない分だけ文が短くなる ── 他の章の答えは動かない。
これが「中途半端でも壊れない」の中身であり、規則ではなく検査が持っている。

## 二箇所に同じことを置かない

この一覧を実装するときに、同じ事実が二つの章に書けてしまう場所がある。
**どれも片方だけが持つ。**節の名で言う ── 上の表に番号は無い。

- **関係節の位置**は名詞句の並び（`np`）の板（REL の札）。複文（`cx`）が
  持つのは**印**だけ
- **複文の印の語**は接続詞（`conj`）の語の欄。`cx` に語の欄は作らない
- **前置詞／後置詞の側**は場所と時の語（`adp`）のまま。`np` の板に ADP の札は
  置かない ── 置けば一つの答えが二箇所になる
- **コピュラの位置**は語順（`order`）の板（`CMP` の札）。です／ある（`cop`）が
  持つのは語だけ
- **比べられる句が文のどこに立つか**は `order` の板（`STD` の札）。比較（`cmp`）
  が持つのは「より」の語とその側だけで、形容詞そのものの側は `np` と
  形容詞（`adj`）のまま
- **否定・疑問の四つの対象**は対象ごとに一頁。動詞の文は動詞の章の節、命令は
  命令の節の中、名詞の文と存在は です／ある の節の中 ── 同じ頁への道は一本ずつで、
  四つから選ぶ頁は作らない

---

# この仕様に対して、今どこまで出来ているか

**2026-08-27 に `claude/gram` が実測。** 書いたものではなく走らせた結果。
**同じ日の夕方に、①〜④ が動かした行を測り直した。**

## §23 は通る

```
生成  Semantic IR → "mi poko luma-ka"                        OK
解析  subject=mi  object=poko  predicate=luma  tense=PAST     OK
否定  上に加えて negation=true                                OK
派生  beauty + li → beauty-li / ADJECTIVE                     OK
```

再現: `www/grammar-engine/` の5ファイルを Node の `vm` で読み、`fromSemantic()` と
`morphology.parseSentence()` と `morphology.derive()` を呼ぶだけ。
`tools/grammar-engine-check.mjs` が同じことを毎回見ている。

## 章ごと

| 章 | 状態 |
|---|---|
| §15 Phase 1-8 内部モデル | **ほぼ出来ている**（`model` `morphology` `lexicon` `translate` `adapter` の5本） |
| §23 最初のゴール | **通る**（上） |
| §5 Rule として保存 | 形はある。否定と疑問は**人が書ける**（章の相手ごとのページで、文を二つ作る）。ほかは**書ける場所がほぼ無い** |
| §7 Morpheme | 枠はある。`rule.form` があれば読まれないので**空のまま**。助詞は三つの枠（主語・目的語・渡す相手）で作れて `gInfl()` がエンジンに渡す |
| §11 Semantic IR | ある。言語固有情報は入っていない |
| §12 Parser / §13 Generator | ある（`parseSentence` / `fromSemantic`） |
| §14 **Grammar Page の UI** | **9 章＋付録の目次。**章の頁が節の一覧で、節の頁が今までの一項目（2026-09-11）。規則を作る道と、規則が作る語を出す道が各節にある。§14 が描く「この言語について」の七行は、まだどこにも無い |
| §9 Sentence Builder | **無い** |
| §1 語順をドラッグで導出 | **出来た。**語を動かして並べる。六択は誰にも訊かれない |
| §3 動詞の活用を人が定義 | **繋がった。**`gFmRules()` が `STG.fm` をエンジンの `inflection`/`derivation` にする。`zmi luma` → `zmi lumaka` |
| §8 例文を構造として保存 | `STG.ex` は文字列。構造では持っていない |
| §16 Migration | `SET.order` → `STG.order` はある。`gpos.negp` → 否定の Rule も（`migrateNeg()`、写すだけ）。ほかの `gpos` は **Grammar Rule への変換をしていない** |
| §18 Repository 層 | **無い**。`adapter.load/save` が直接 localStorage |
| §21 責務分離 | 5本のまま（`derivation`/`inflection`/`parser`/`generator`/`sentence` は `morphology`と`translate`の中） |

## 一番もったいないところ

**§3 の「`luma` → `luma-ka` を人が作って規則にする」画面は、すでにアプリの中にあります。**
`www/wordsheet.js` の規則の紙（`fmrFormHTML`）で、足す綴り・前か後か・末尾を何文字
落とすか・母音の後だけか、まで指定できます。保存先は `STG.fm`。品詞と何の形は、
それを作った章のページが決めます（2026-08-27 以降。それまでは同じ紙の上で選ぶ
形でした）。

**それがエンジンに一度も渡っていません。** `gModel()` は `inflections` を空のまま渡します。

```
人が書ける場所        →  ✗  →  エンジン（§23 は通る）
（語形ページ, STG.fm）
```

両端は出来ていて、真ん中が繋がっていない。そして §14 のページが無いので、
オーナーから見ると何も変わっていない。

**ただし `STG.fm` の `drop`（「y を i に変えて ed」）を表せる operation がエンジンに
ありません**（`add()` は prefix/suffix/replace だけ）。§7 の「operation を拡張できる
設計にすること」がここに効きます。

## `claude/gram` が今持っているもの（この仕様に対しては小さい）

- `gModel()` が `langKey('gram2')` の模型を読む（§18 の入口。まだ誰も書かない）
- 助詞を三つの枠（主語・目的語・渡す相手）で作れる → `gInfl()` がエンジンに渡す（§7 の一部）
- `STG.fm`（人が書いた語形の規則）がエンジンに届く（§3。真ん中が繋がった）
- 語順は語を動かして並べる（§1）
- **§14 の章が八つ、一章一ページ。** 章の ＋ が規則を作り、章のまとめが
  その章の語を作る。品詞も何の形も訊かれない ── 立っているページが既に
  言っているから
- 規則の一覧と、品詞／何の形を選ぶ二画面は閉じた（同じことを二箇所で言って
  いたので）

`ORDERS`（六択）は誰にも訊かれなくなりました。**消してはいません** ──
`orderDef()` がまだ読みます。

**まだ無いもの**は上の表のとおり: §9 Sentence Builder、§8 例文を構造として
保存、§16 の Grammar Rule への変換、§18 Repository 層、§11 の言語固有情報。
