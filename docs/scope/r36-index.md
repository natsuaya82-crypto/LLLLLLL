# r36-index ── 自分の言語の一覧はサーバーの答えそのもの

ブランチ `claude/r36-index`（`integ-0905` = `master` 890d3a75 から）。
**取り込むのはサブリーダー／リーダー。全ゲートは回していません。**

## 何を直したか

オーナーが実機（158、2026-09-15）で見た二つ。**二つとも同じ一つの設計ミス**で、
端末の索引 `lingua.langs` が「この account の言語は何か」の答えに使われていた。

1. サーバー上の名前の無い空の `language` 行を二本消したあと、設定→言語 に
   その行が「未設定」として残り、「言語を追加」は「アップグレードが必要です」
   で断られた。
2. 09:09:57 UTC、ログアウト→ログインの直後に、名前の無い `language` 行
   （slice 0）がまた一本できた。

「端末で使うものなんかないだろ」「そもそも端末を使用するところがないんだから
直すじゃないでしょ設計ミスなんだから作り直しでしょ」OWNER 2026-09-15。
patch ではなく rewrite。

## 原因は読まずに押して測った

`tools/acct-check.mjs` 74 に probe を入れて実測。索引にだけ在る言語
（サーバーで行が消され、スライスは記憶と一緒に消えている ── `LROW` は記憶
だけなので起動し直した端末では立っていない）を置いてサインアウト→サインイン
し、`netSend` を包んで `POST /rest/v1/language` を数えた。

```
✗ 74: **サインインが空の言語をサーバーに作った** ── POST /rest/v1/language が 1 本。
      索引にしか無い言語の行を作り直しています
```

道は `langMineIds()`（索引を舐める）→ `netLangSync()` → `netLangRow()`
（行を知らないので insert）。

降りの側も同じ赤を見た（75）：

```
✗ 75: **サーバーの答えに無い言語が索引に残っている** ── gone-75。
      消した行が「未設定」として一覧に並び続けます
✗ 75: 落ちた言語の鍵が端末に残っている ── lingua.gone-75.name.got lingua.gone-75.owner.got
✗ 75: 落ちたはずの言語が一覧に出ている ── gone-75
✗ 75: langCount() が 3 ── 2（stay と held）ではない
```

数えるほうも（76）：`langCount()` が 2 を答え、`langStop()` が `up.need` の
ポップ（＝「アップグレードが必要です」）を出した。

**測っている途中で検査の欠陥を一つ直しました。**最初の probe は 0 本と出て
緑でした ── この検査にはサーバーが無いので前の案件が始めた送信が終わらず、
`NET_SYNCING` が立ったままで `netLangSync()` が入口で帰っていたためです。
アプリの話ではありません。落としてから測ると 1 本。

## 変えた file と、何が変わるか

| file | 何 |
|---|---|
| `www/net.js` | `netTakeGone()` を **削除**し、`netLangsGone(mine, ids)` に。自分の言語と取った言語を**一つの関数**が扱い、`netLangsDown()` と `netTakenDown()` が同じ一つを呼ぶ。`netLangsDown()` は答えから id を取って、歩いたあと掃く。`langMineIds()` は `langHeld()` が真のものだけ渡す。`netTook()` は `netCame` で、`netOut()` は出る時に `langMineForget()` |
| `www/core.js` | `LMINE`（訊けたか、三つ目の状態）、`langHeld()`（この端末が中身を持っているか ── `slMine()` であって `slRd()` ではない）、`langDropHere()`（`lingua.<id>.` で始まる鍵を名前を挙げずに数えて消す）。`langCount()`／`langMainId()` は未回答なら `null`、`langStop()` は数を見る前に「接続できません」、`langForAcct()` は `pullHad('mylangs')` をやめて `langMineKnown()` を訊く |
| `www/home.js` | `langsList()` は答えが来ていなければ畳まない（`langsSeen(…, null)`）。写しは描く、数は作らない |
| `tools/acct-check.mjs` | claim 74・75・76。`arrive()` は `PULL_GOT` ではなく `langMineGot()`（一箇所が移ったため）。36 の前提の一行を、測りたい側（サインイン後）へ移した |
| `tools/store-check.mjs` | `lingua.langs` の行を「眺めるための写し、道は `netLangsDown` が置き換える、数えない」に |
| `tools/fixture.mjs` | `seed()` が `langMineGot()`（fixture はサーバーから聞いている端末）。面を一つ追加 ── 「三本、誰も答えていない」 |
| docs | `docs/CHANGELOG.md`（DELETE REVIEW）、`CLAUDE.md` 規則 22・11、`docs/DATA_MODEL.md`、`docs/FEATURE_RULES.md` 決定ログ、`docs/CHECK-0907.md`「ビルド 159」 |

**`www/index.html` と `docs/STATE.md` は触っていません。**

## 保存するものの変化 ── DELETE REVIEW

落ちるのは**この iPhone にある写しだけ**。`lingua.<id>.` で始まる鍵（記憶
`LSL` とディスク、`.was` と `.got` も）と索引の行。**`language` と `slice` の
行は一バイトも動きません** ── `netLangDrop()` は呼びません。

落とさないもの、五つ：答えが来ていない時（掃除は答えの中からしか呼ばれない）、
**中身を持っている自分の言語**（まだ上がっていないだけかもしれない ──
`langHeld()`）、行があると聞いている言語（`langRowUp()`）、もう一方の種類、
そしてサーバー。

取った言語は `langHeld()` で守りません ── 読むだけで上る道が無いので、中身は
答えの写しであって仕事ではない（`dl-check` がそう言いました）。

## 途中で分かったこと二つ

- **`again-check` が、なくすべき振る舞いを緑にしていました。**空の
  `localStorage` からサインインすると、`www/core.js` が読み込みで打つ名前の
  無い言語がサーバーに上がって三本目の行になり、その claim はそれを
  「both are the person's own」と数えていました。**それがバグ 2 そのもの**です。
  直した形では上がらず、索引にも残りません（持ち主の答えも中身も行も無い枠は
  落とす ── 中身があるものは `langHeld()` が守るので、失うものがありません）。
  claim は今そのまま緑です。
- **`plan-check` が `SESS` を直接書き換える**（`tools/plan-check.mjs:446`）ので、
  `LMINE` を uid で持つ形にすると 16 件赤くなりました。`PLAN` と同じ形
  （平の印＋アカウントが変わる所で忘れる）にして緑。house の形に合わせた
  ほうが正しいと判断しています。

## 回した check（単体のみ。全ゲートは回していません）

`acct` 緑（74・75・76 は**バグを入れたまま赤を見てから**直した。赤の出力は上）・
`again` 緑・`dl` 緑・`plan` 緑・`store` 緑・`press` 緑（16798 押、
`278/279 distinct names`、`never pressed (1) saveName` は報告であって失敗では
ありません）・`es5` 緑・`dead` 緑。

`master` は取り込み済み（`origin/master` = 890d3a75 = このブランチの根で、
差分 0）。

## リーダーへ ── 持っていない file の古くなった一行が二つ

`netTakeGone()` は無くなりましたが、**私の持ち場ではない二つの check の
コメントがまだその名前を書いています**。振る舞いには関わりません（どちらも
コメントの中の一語）。直すのは一語ずつです：

- `tools/again-check.mjs:2199` 「netTakenDown() から netTakeGone() の一行を外すと」
- `tools/dl-check.mjs:459`   「netTakeGone() all run for real against …」

どちらも `netLangsGone()` へ。触っていないのは `docs/SESSIONS.md` の
「持っているファイルだけを編集する」に従ったためで、見落としではありません。

`docs/DATA_SAFETY.md` の `netLangsDown()` の三箇所は**読んで、直す必要が
ありませんでした** ── どれも「埋める」半分についての文で、そちらは変えて
いません。掃くほうは別の行いで、DELETE REVIEW を持っています。

## CODE CONFIRMED / DEVICE CONFIRMED

- **CODE CONFIRMED** ── 上の八本。赤を見てから直したのは 74・75・76。
- **DEVICE CONFIRMED ── ありません。**実機では一度も押していません。
  押す場所は `docs/CHECK-0907.md`「ビルド 159」。
- **OWNER CONFIRMED ── ありません。**

**見た目**：設定→言語 の二つの面をスクショで付けました ──
`shots/half-three-languages-nobody-has-answered-ja.png`（答えが来ていない：
三本とも出て「非表示」は出さない）、
`shots/half-three-languages-of-yours-on-free-ja.png`（答えが来ている無料：
一本＋「非表示 2」、今までどおり）、`shots/half-three-languages-of-yours-on-pro-ja.png`。
