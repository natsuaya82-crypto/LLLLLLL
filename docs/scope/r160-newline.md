# r160-newline — 改行キーで改行されない

ブランチ `claude/r160-newline`（`origin/integ-0905` から）。

## 報告
改行キーを押しても改行されない。どの画面・どのキーボードかは未確定（オーナー確認中）。

## やること
- 実アプリ（headless）で、全画面の全テキスト欄に「改行」を入れて測る。
  - 拡張と同じ `insertText("\n")`（`beforeinput`/`input` の insertText "\n"）
  - iOS システムキーボードと同じ Enter の keydown
  - 欄の値に `\n` が残るか、KD(Enter) が横取りするか、`puaTyped()`/IN の受け手が落とすか、
    保存・投稿結果に残るか、描かれた行に出るか。
- 複数行であるべき欄で落ちていたら、落としている一箇所を書き直す。
- headless で落ちなければ「原因は分かっていない」とし、最初の変更は答えを残すもの。

## 触ってよいもの
- 改行を落としている一箇所（測定で特定してから）と、それを持つチェック（`pua-check` か `line-check`）
- `tools/` に測定用スクリプト、`docs/scope/r160-newline.md`、`docs/CHANGELOG.md`、`shots/r160-*.png`

## 触らないもの
- 1 行欄（検索・名前・つづり）が Enter を無視するのは仕様。列挙のみ。
- `CLAUDE.md`（下の「CLAUDE.md（リーダーが直す）」に提案を書く）

## 測定結果

測定日 2026-10-01、`tools/nl-measure.mjs`（gate 外の測定スクリプト）。全ルート＋fixture の全フェイス
（452）を描き、textarea / input（58 種類）ごとに、値 `ab` の末尾へ
(1) 拡張と同じ `document.execCommand('insertText', false, '\n')`、(2) Playwright の実 Enter キー押下、
のあと `c` を足して、欄の値と IN 受け手（`actTyped()` = `puaTyped()` 経由）の第 1 引数を記録。

**読み方**
- (1) insertText "\n" は **全ての textarea で値に残り、IN 受け手にも `"ab\nc"` で届く**。
  `puaTyped()` は改行を落とさない（input 要素は仕様上改行を持てないので `abc`）。`beforeinput` を聞く
  コードは `www/` に無い。
- (2) 実 Enter は `www/act.js` の keydown（`one = .lnin かつ .lnlines でない`）で
  **`.lnin` の全欄が preventDefault**。これは 2026-09-03 のオーナー決定
  「必要ないところで開業できるのやめて欲しい」どおり。`.lnin` でない textarea と投稿欄（`lnlines`）は残る。
- 投稿欄 `pw-ln` → 投稿 → 描画の改行は `line-check` 2 が持っていて、この時点で緑（実行して確認）。

| 欄 | 要素 | class | 受け手 | (1) 拡張の insertText "\n" | (2) 実 Enter | 測ったフェイス |
|---|---|---|---|---|---|---|
| `sns-q` | textarea | lnin | snsSetQ | 残る | 落ちる（preventDefault） → KD `snsGo` | route:explore |
| `f-q` | textarea | lnin | fSetQ | 残る | 落ちる（preventDefault） | route:find |
| `lt-q` | textarea | lnin | ltSetQ | 残る | 落ちる（preventDefault） | route:ltset |
| `w-q` | textarea | lnin | wordsSetQ | 残る | 落ちる（preventDefault） | route:words |
| `cont-b` | textarea | lnin fitin | contactSet | 残る | 落ちる（preventDefault） | route:contact |
| `admin-pw` | input | - | adminSet | 落ちる | 落ちる（preventDefault） | route:admin |
| `(idなし)` | input | lnin kbnm | kbSetNm | 落ちる | 落ちる（preventDefault） | face:a keyboard of the taker's own, somebody else's language |
| `lt-nt` | textarea | lnin ntin | ltSetNote | 残る | 落ちる（preventDefault） | face:one letter, your own language |
| `ob-em` | input | - | obMailSet | 落ちる | 落ちる（preventDefault） | face:the timeline, signed out |
| `ob-pw` | input | - | obMailSet | 落ちる | 落ちる（preventDefault） | face:the timeline, signed out |
| `pw-ln` | textarea | lnin lnlines dir-ltr | pwSetLn | 残る | 残る | face:the composer past the ceiling |
| `pw-mn` | textarea | lnin pwmn | pwSetMn | 残る | 落ちる（preventDefault） | face:the composer past the ceiling |
| `(idなし)` | input | pwtag | pwSetTag | 落ちる | 落ちる（preventDefault） | face:the composer past the ceiling |
| `wd-ln` | textarea | lnin whin | wdSetLn | 残る | 落ちる（preventDefault） | face:the word being edited |
| `wd-tags` | textarea | lnin | wdSetTags | 残る | 落ちる（preventDefault） | face:the word being edited |
| `wd-ety` | textarea | - | wdSetEty | 残る | 残る | face:the word being edited |
| `wd-exl` | textarea | lnin | wdAddEx | 残る | 落ちる（preventDefault） → KD `wdAddEx` | face:the word being edited |
| `wd-exg` | textarea | lnin | wdAddEx | 残る | 落ちる（preventDefault） → KD `wdAddEx` | face:the word being edited |
| `wd-nt` | textarea | - | wdSetNt | 残る | 残る | face:the word being edited |
| `wd-sub` | textarea | lnin | subNew | 残る | 落ちる（preventDefault） → KD `subNew` | face:a subclass being written |
| `wd-mn` | textarea | lnin | wdAddMn | 残る | 落ちる（preventDefault） → KD `wdAddMn` | face:one more meaning |
| `(idなし)` | textarea | ntbody | stNote | 残る | 残る | face:one more example of a stage |
| `fm-d` | textarea | lnin | fmNew | 残る | 落ちる（preventDefault） → KD `fmNew` | face:a label of your own |
| `wfm-f` | textarea | lnin whin | wfmSetF | 残る | 落ちる（preventDefault） | face:a form being written |
| `fm-i` | textarea | lnin | fmNew | 残る | 落ちる（preventDefault） → KD `fmNew` | face:the label of a form |
| `ipa-q` | textarea | lnin | ipaSetQ | 残る | 落ちる（preventDefault） | face:the reading of a word |
| `ly-nm` | textarea | lnin | - | 残る | 落ちる（preventDefault） | face:the page a layer is renamed on |
| `fmmk-fr2` | textarea | lnin whin | addFmSet | 残る | 落ちる（preventDefault） | face:the new word sheet, with a spelling typed |
| `admin-h` | textarea | lnin | adminStaffSet | 残る | 落ちる（preventDefault） | face:the admin screen |
| `adrec-h` | textarea | lnin | adRecSet | 残る | 落ちる（preventDefault） | face:the admin screen, the recovery face |
| `pw-ln` | textarea | lnin lnlines dir-rtl | pwSetLn | 残る | 残る | face:a line written from the right, in a font of your own |
| `pw-ln` | textarea | lnin lnlines dir-ttb-lr | pwSetLn | 残る | 残る | face:a line written downward, the first column at the left |
| `pw-ln` | textarea | lnin lnlines dir-ttb-rl | pwSetLn | 残る | 残る | face:a column written while replying to somebody |
| `st-t` | textarea | lnin | - | 残る | 落ちる（preventDefault） | face:a grammar stage of your own |
| `st-w` | textarea | ntbody | - | 残る | 残る | face:a grammar stage of your own |
| `ncls-n` | textarea | lnin | - | 残る | 落ちる（preventDefault） | face:naming a noun class |
| `fmr-add` | textarea | lnin whin | fmrSetAdd | 残る | 落ちる（preventDefault） | face:a rule written before the editor was two fields |
| `lt-rom` | textarea | lnin | ltDraftName | 残る | 落ちる（preventDefault） | face:a letter beyond the thirty-eight, on the paid plan |
| `lt-rom` | textarea | lnin dup | ltDraftName | 残る | 落ちる（preventDefault） | face:two letters with one name |
| `me-nm` | textarea | lnin | meSetName | 残る | 落ちる（preventDefault） | face:a face already chosen |
| `me-hd` | textarea | lnin | meSetHandle | 残る | 落ちる（preventDefault） | face:a face already chosen |
| `me-bio` | textarea | - | meSetBio | 残る | 残る | face:a face already chosen |
| `me-lk` | textarea | lnin | meSetLink | 残る | 落ちる（preventDefault） | face:a face already chosen |
| `me-lc` | textarea | lnin | meSetLoc | 残る | 落ちる（preventDefault） | face:a face already chosen |
| `rel-hw` | textarea | lnin | - | 残る | 落ちる（preventDefault） | face:synonyms to choose from |
| `rel-mn` | textarea | lnin | - | 残る | 落ちる（preventDefault） | face:synonyms to choose from |
| `mk-tx` | textarea | mktx tfont mkink c0 | pwMarkText | 残る | 残る | face:letters on a photograph |
| `f-csv` | textarea | - | - | 残る | 残る | face:a list being pasted |
| `sx-lb` | textarea | lnin exsm | - | 残る | 落ちる（preventDefault） | face:an example being written |
| `sx-ln` | textarea | lnin | stAddEx | 残る | 落ちる（preventDefault） → KD `stAddEx` | face:an example being written |
| `sx-gl` | textarea | lnin | stAddEx | 残る | 落ちる（preventDefault） → KD `stAddEx` | face:an example being written |
| `wr-names` | textarea | - | shTyped | 残る | 残る | face:a sheet being made |
| `wld-where` | textarea | lnin | wldSet | 残る | 落ちる（preventDefault） | face:writing with every section open |
| `wld-who` | textarea | lnin | wldSet | 残る | 落ちる（preventDefault） | face:writing with every section open |
| `wld-ov-Omupihc1f` | textarea | lnin | wldOvSet | 残る | 落ちる（preventDefault） | face:writing with every section open |
| `(idなし)` | textarea | ntbody grow | wldOvSet | 残る | 残る | face:writing with every section open |
| `wld-ov-O1` | textarea | lnin | wldOvSet | 残る | 落ちる（preventDefault） | face:writing with every section open |
| `wld-ov-O2` | textarea | lnin | wldOvSet | 残る | 落ちる（preventDefault） | face:writing with every section open |

## 原因

**原因は分かっていない。** headless で、複数行のはずの欄（投稿 `pw-ln`、自己紹介 `me-bio`、語源 `wd-ety`、
メモ `wd-nt`・`ntbody`、写真の文字 `mk-tx`、貼り付け `f-csv`、`wr-names`）で改行を落とすものは無い。
落ちるのは `.lnin` 欄の Enter だけで、それは決定どおり。残る候補は二つで、どちらも測れていない:

1. **報告が 1 行欄でのことだった。** その場合は不具合ではなく決定どおり。ただし下の「オーナーに聞くこと」の
   欄は、1 行欄なのか複数行のはずなのかがコードからは決められない。
2. **端末側。** 拡張の `ret` は `textDocumentProxy.insertText("\n")`
   （`ios/App/LinguaKeyboard/KeyboardViewController.swift:296`）。WKWebView がこれを
   keydown Enter として JS に渡すのか、`insertText` の input として渡すのかは headless では再現できない。
   keydown として来るなら `.lnin` 欄では止まり、来ないなら 1 行欄にも改行が入る（下の「逆向き」）。

**どの画面・どのキーボードかが分かるまで、何も直していない。** 答えを残す仕組み（欄が受け取ったイベントを
オーナーに見える形で残す）は、既存の置き場が `www/` に無く、新しい表示を一つ作ることになるため、
作る前にリーダー／オーナーに聞く（CLAUDE.md「Answer before you move」「Ask before making a fourth」）。

## オーナーに聞くこと（1 行か複数行か、コードからは決められない欄）

`.lnin` なので Enter が止まるが、中身が文章になりうる欄:

- `cont-b` — 問い合わせの本文（`fitin`、高さはレイアウトが与える）
- `lt-nt` — 一文字のメモ（`ntin`）。単語のメモ `wd-nt` は改行できる
- `pw-mn` — 投稿の意味（`pwmn`）。投稿の行 `pw-ln` は改行できる
- `wld-ov-*` — 言語ページの概要の各欄。同じ `wldOvSet` の一つ（`ntbody grow`）は改行でき、他（`lnin`）はできない
- `sx-ln` / `sx-gl` / `wd-exl` / `wd-exg` — 例文（Enter は KD で「追加」）

1 行のまま（決定どおり・変えない）: 検索 `sns-q` `f-q` `lt-q` `w-q` `ipa-q`、名前・ID・リンク・場所
`me-nm` `me-hd` `me-lk` `me-lc`、つづり・語形 `wd-ln` `wfm-f` `fmmk-fr2` `fmr-add` `lt-rom`、タグ `wd-tags`、
ラベル `fm-d` `fm-i` `ly-nm` `ncls-n` `st-t` `sx-lb` `wd-sub` `wd-mn`、関連語 `rel-hw` `rel-mn`、
世界 `wld-where` `wld-who`、管理 `admin-h` `adrec-h`、input 全部。

## 逆向き（報告のみ・変えていない）

`.lnin` の 1 行欄は Enter の keydown しか止めていないので、**拡張の `insertText("\n")` が keydown を伴わずに
届く場合、名前・ID・検索などに改行が入る**（headless (1) 列が全部「残る」）。act.js のコメントは
「PASTE IS NOT THIS … what the owner said was Enter」として貼り付けを外している。拡張の改行がどちらで届くかは
端末で見るまで分からない。


## CLAUDE.md（リーダーが直す）
なし。
