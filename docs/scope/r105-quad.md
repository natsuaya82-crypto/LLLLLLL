# r105-quad ── 組み合わせの一マスは描いたままの位置で重ねる、終声だけ下の段へ（1.0.3）

ブランチ `claude/r105-quad`（`integ-0905` `30dc13d4` から）。今ほかのワーカーは動いていない。

オーナーの言葉（2026-09-26、仕様）:「せっかく4つに区切ってるから、それうまく利用しない？そうすれば置き場所指定しなくても入れるやん？」

## やること

- 書き方が組み合わせ（`block`）の時、一マスは部品（初声・母音・終声の描いた字）を**描いたままの位置と大きさで重ねる**。縮めない、区画に押し込まない。
  字を描く画面の田の字のガイドの、どの四分の一に描いたかがそのまま置き場所になる。
- 例外は終声だけ。決めた規則（`wsParts()` が「どの段・どの列へ」を言い、`wsInto()` が動かす、この二つの一か所）:
  - 一つ目の終声は下の段の左: その字の形が**上半分だけに**描かれていれば、半マス下へずらす。下半分にかかっていれば縦には動かさない。
  - 二つ目の終声は下の段の右: 一つ目と同じく上半分だけなら半マス下へ、さらに形が**左半分だけに**描かれていれば半マス右へ。右半分にかかっていれば横には動かさない。
  - 初声・母音は一画も動かさない（ずらさない字は前と同じオブジェクトを返す）。
  - 組まない音節は今と同じ: 終声の後に母音、終声が三つ以上、五つ以上の字。
- 置き方の選択を消す: `vLetter` の「置き方」の行（`ltCutRows()`・`ltCutPick()`・`blkPv`・`blkPvs`・`blkCons`）、`WS_BLK_CUTS`・`wsBlkOf`・`wsBlkSet`・
  `wsBlkVowOf`・`wsBlockBoxes`・`WS_BLK`、一文字のページの KEEP の `cut`、`wsStrokes()` の `type`。act-map・fixture の面・i18n の `blk.*` の鍵・
  `HELP.letter`／glyph の組み合わせの文を今の形に。二つ目の道は残さない。
- 保存されている `SCRIPT.blk` は消さない（読まなくなるだけ、`langRead()` は知らない欄を残す）。CHANGELOG に先に書く。
- アブギダの組み立ては一つも変えない ── r102 の比べ方（アブギダの台を前と後で撮って差 0 画素）で確かめる。
- `block-check` を書き直し、壊して赤を見る。写真は `shots/r105/`。

## 触ってよいファイル
`www/wsys.js`・`www/sound.js`・`www/letters.js`（KEEP の `cut` を外すだけ）・`www/glyph.js`（HELP の文だけ、在れば）・`www/act-map.js`・
`www/i18n/*.js`（`blk.*`・`hp.*` の組み合わせの鍵だけ）・`tools/fixture.mjs`・`tools/block-check.mjs`・`docs/CHANGELOG.md`・
`docs/FEATURE_RULES.md`（決定ログ一項、r104 の項を【差し替え済み】）・`docs/FEATURES.md`・`docs/DATA_MODEL.md`（`blk`）・このファイル・`shots/r105/`。

## 触らないもの
`www/index.html`、`ios/`、`supabase/`、書き出しの画面（`vLtOut`、r104 のまま）、他の人のブランチ。ゲートは回さない。

---

# 報告（2026-09-26）

コミット: `edcf3eff` scope → `c838c14b` CHANGELOG（先に） → `c35ed4df` 本体（コード・検査・写真） → `4d9d66f3` docs（決定ログ・偽になった文）。
`origin/integ-0905` は取り込み済み（`30dc13d4` から動いておらず「Already up to date」）。

## ファイルと理由

| ファイル | 何を・なぜ |
|---|---|
| `www/wsys.js` | `wsParts()` を書き直し: 部品は `{s, at}`、初声・母音は `at` null（動かさない）、終声は `[0,1]`（左下）・`[1,1]`（右下）。`wsInto(g, at)` が終声を動かす一か所: 形が上半分だけなら半マス下、`[1,1]` で左半分だけなら半マス右も。動かさない部品は同じオブジェクトを返す。`wsStrokes()` から `type`（見本用）を外した。`WS_BLK_CUTS`・`wsBlkOf`・`wsBlkSet`・`wsBlkVowOf`・`WS_BLK`・`wsBlockBoxes` は消した。組まない: 終声の後の母音、終声三つ以上、五字以上。 |
| `www/sound.js` | `ltCutRows()`・`ltCutPick()`・`blkPv`・`blkPvs`・`blkCons` と `vLetter` の行を消した。`HELP.letter` から組み合わせの段を外した（描く画面の「?」へ移した）。 |
| `www/glyph.js` | `HELP.glyph` に組み合わせの時だけの段（四つのどこかに描く・終わりの子音・四つまで）── 田の字のある画面で言う。 |
| `www/letters.js` | 一文字のページの KEEP から `cut` を外した（r104 より前の形に戻した）。 |
| `www/act-map.js` | `ltCutPick` を外した。 |
| `www/i18n/*.js`（10 言語） | `blk.h`・`blk.lr`・`blk.tb`・`blk.q`・`hp.bk.p2` を消し、`hp.bk.p`・`.1`・`.1.d`・`.2`・`.2.d`・`.3`・`.3.d` を今の形に、`hp.lt.ab.d` から置き方の文を外した。 |
| `tools/fixture.mjs` | 「組み合わせの母音の文字のページ」の面を消した（その面にしか無いボタンが無くなった）。 |
| `tools/block-check.mjs` | 1〜5 を書き直し（下）。6（SVG）は今のまま。 |
| docs | `CHANGELOG.md`（先に）、`FEATURE_RULES.md`（新しい一項、r104 の項を【差し替え済み】一行、「他の道具…」の二行）、`DATA_MODEL.md`（`blk` は読まれない）、`FEATURES.md`（一行）。 |

## 挙動

- 組み合わせの一マスは、描いた字をそのまま重ねる。左上に描いた k と右上に描いた a の ka は左右に並ぶ（`after-block-words`）。
  縮めないので、前（区画に縮めていた頃）より字が大きい。
- 終声: n を左上に描いていれば kan で左下へ、kant の t は右下へ。下半分に描いた終声は動かない。二つ目が真ん中をまたいで描かれていれば下へだけ動く。
- 母音の文字のページに置き方の行は無い（`after-letter-a`、前 `before-letter-a`）。
- 描く画面の「?」に組み合わせの使い方（組み合わせの時だけ、`after-help-glyph`）。
- **区画いっぱいに描いた字どうしは重なる** ── 前の置き方で描いた字は描き直しが要ることがある。字そのものは一画も変わらない。

## 保存

新しく保存する物は無い。消す物も無い。`SCRIPT.blk` は読まなくなるだけで、`langRead()` が知らない欄を残すので次の保存でも落ちない（block-check で確かめた）。

## 確かめたこと（CODE CONFIRMED のみ）

- `npm run block` 緑（全行）。**赤を三つ見た**: (a) 終声を動かさない → 4 行赤、(b) 下半分に描いた終声も動かす → 1 行赤、
  (c) 前の `wsys.js`（区画に縮める）に戻す → 14 行赤。どれも戻して緑。
- アブギダ: 前と後で、組む単位ぜんぶの `wsStrokes()` の JSON が一字違わず同じ、アブギダの台と単語の一覧の写真が **差 0 画素**（1316640・2330640 画素）。
- pre-commit（fast 全部＋i18n、10 言語、73 画面）緑、docs-check 緑。
- ゲートは回していない。act-check・press・page-check は走らせていない ── fixture の面が一つ減ったので、リーダーのゲートで見てほしい。

## 確かめていないこと

実機（DEVICE CONFIRMED 無し）。OWNER CONFIRMED 無し。フォント・キーボードに組んだマスが乗るのは block-check の 4 行目（フォントに渡る形）まで。

## 写真（`shots/r105/`、日本語、ライト、有料。k・a・n・t は上半分、o は下半分に描いた状態）

写真は `tools/shot.mjs` ではなく同じ `seed()` を使う使い捨ての台本で撮った ── 字を四分の一に描いた状態と書き方 `block` は shot.mjs の route だけでは作れない。
- `before-/after-block-words`（組んだ語の一覧: 前は縮んだ小さなマス、後は描いた大きさ）
- `before-/after-glyph-k`・`-glyph-a`（描く画面: 左上に子音、右上に母音）
- `before-/after-letter-a`（母音の文字のページ: 前は置き方の三行、後は無い）
- `before-/after-help-glyph`（描く画面の「?」: 後は組み合わせの段）
- `before-/after-abugida-bench`・`-abugida-words`（差 0 画素）

## 知っていること・訊くこと

1. 「半マス」は描く四角の格子（`GGRID.inset` の内側）の半分。終声を動かす判定は「形がまるごと上半分（左半分）にあるか」── 決めた規則で、オーナーの数ではない。
2. 母音を下半分に描いた字（o）と終声が重なる音節（kon）は、終声が左下へ下りて母音と重なる。そのまま重ねている（描き方の問題として扱い、コードでは避けていない）。
3. `ios/App/LinguaKeyboard/Compose.swift` のコメント（書き方の数）は範囲外で触っていない（r102 と同じ）。
