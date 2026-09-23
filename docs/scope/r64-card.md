# r64-card — カードは投稿の絵（r63 § 2-2 CD1〜CD5 と C）

作業セッション r64-card（`claude/r64-card`、`origin/integ-0905` c2aff7b1 から）。
持つファイル: `www/card.js` `tools/card-check.mjs` `tools/fixture.mjs`（カードの面だけ）
`docs/CHANGELOG.md` `docs/scope/r64-card.md`。

## 測ったこと（直す前、integ-0905 のまま）

ヘッドレス Chromium に `tools/fixture.mjs` の種を入れ、`cardInk()` を包んで `cardPaint()` を
本物のまま呼んで数えた（使い捨てのスクリプト、repo には入れていない）。

| | 測ったもの | 直す前 | 直した後 |
|---|---|---|---|
| CD1 | 他人の投稿 `ink:null, ln:'kano tir'` | 形 1・文字 `Ϙir`（自分の辞書で綴り直し） | 形 0・文字 `kano tir`（タイムラインと同じ） |
| CD2 | `ke` の字を `sh` だけにした単語カード | 形 1 → 0 | 1 → 1 |
| CD3 | 他人の投稿 `ln:'qq\nww'` | 改行 0・空白 1 | 改行 1・空白 0 |
| CD4 | お題への答え（`pr` 付き） | カード `mn`、タイムライン お題 | 両方お題（`postSay()`） |
| CD5 | `CARD={k:'p', v:'nope'}` | 一番新しい単語 `tirok`、`@aya` | `cardSrc()` は null、「これはもうありません。」 |

r63 が［読んだ］だった CD4・CD5 もこれで［測った］。r63 の読みはどれも合っていた。

**測って見つかった六つ目**（r63 に無い）: 単語・例文のカードで、まだ描いていない字が
「UNDEFINED」と描かれる。`kano` は綴り `sp` を字の id だけで持ち（音が無い）、描いていない字に
`ch` も無いので、`cardUnit()` が無い音 `u` に落ちて `chOf(undefined) || undefined` を文字に
していた。写真: `shots/r64-5-a-word-as-a-card-before.png`。

## 直したこと

一文: **カードの投稿は、タイムラインがその投稿を描くのと同じものを描く。カードの単語と例文は
開いている言語で、空白と改行は `postRuns()`、字の形は `inkGeo()`、描いていない字は名前。
無い物のカードは無い。**

- `cardOfPost()`: ink は常に「描ける ink か、描けなければ文字だけの一行」（`postLnHTML()` と
  同じ答え）。投稿が `cardUnits()`（自分の辞書）に落ちる道は無くなった。意味は `postSay()`。
- `cardInkUnits(ink, spell)`: 投稿・単語・例文の全部がここを通る。`spell` は作る側
  （`cardUnits()`）だけが渡す。`cardUnits()` の `/\s+/` の割り方は消した。
- `cardUnit()`: 形は `inkGeo()`、形も `ch` も無い字は `ltName()`。
- `cardSrc()`: 投稿・単語・例文が無ければ null。「一番新しい単語に落ちる」を消した。
  `cardOpen()` は null なら `goneBox()`。開いている間に消えた時の二つの道（`cardPaint()` の
  描き直し、`cardSave()`）も null を訊く。
- C: `cardFileName()` のコメントを、コードのしていること（@ で名付ける）に合わせた。
- `tools/fixture.mjs`: 面を二つ足した（ink の無い他人の投稿のカード、消えた投稿のカード）。
  「a sentence as a card」の面は、返した直後に例文を消していたので、写真は例文ではなく一番
  新しい単語のカードだった（CD5 の道）。消すのをやめた（`press`・`shot` は面ごとに種を入れ直す）。
- `tools/card-check.mjs`: ink 無しの試験を `qq ww` から、この辞書が綴れる `ke tir` へ。
  足した主張: ink 無し投稿は自分のでも他人のでもタイムラインの文字と一字一句同じ・改行、
  例文の空白と改行、`sh` の字、描いていない字は名前、意味は `postSay()`、無い物は null で
  絵を出さない、開いている間に消えても投げない。**全部、直す前の `card.js` で赤を見た**
  （まとめて 27 件＋例文 1 件、描いていない字 1 件、開いている間に消える 1 件は、その一行だけ
  戻して赤）。

写真（`node tools/shot.mjs --lang ja`、前後）: `shots/r64-1`〜`r64-5`。

## 私の持ち物ではないので、直していないもの

- **`CLAUDE.md` ルール 12 の二文が偽になった**（r62-docs へ）:
  「A post written before a post carried its ink is redrawn from the open dictionary, and
  that is deliberate」と「It cannot happen yet」。今は ink の無い投稿は誰のでも文字。
- **「描ける ink か、文字だけの一行か」が二か所に書いてある**: `postLnHTML()`（`post.js`）の
  `{g:[], s:[String(p.ln||'')]}` と `cardOfPost()` の同じ式。`post.js` に一つの関数
  （たとえば「この投稿が描かれる ink」）を置いて両方がそれを呼ぶのが § Simple の形。
  `post.js` は r60 の物なので、式を写すことしかできなかった。
- `cardFileName()` は @ で名付ける。コメントの半分は「言語の名前で」と言っていた。どちらに
  するかは言葉づかいの決めごとなので、コードのしていることに合わせただけで決めていない。
- `press` の押した数と `act-check` の面の数は、足した二つの面のぶん動く。

## リーダーの指示が間違っていた所

- 指示は「自分の古い投稿を辞書から描く道を残すかは、自分の投稿だけに閉じる」。**残さなかった。**
  タイムラインの一行（`postLnHTML()`）は ink の無い投稿を自分のでも文字で描いているので、
  カードだけ辞書で綴ると、同じ投稿の絵が二通りになる（ルール 12「カードは投稿の絵」に反する）。
  `migratePostInk()` は言語を開いた時に自分の投稿に ink を切るので、切れる物は切られている。
- それ以外は無し。
