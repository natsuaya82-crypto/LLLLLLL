# claude/r26-small ── 測った結果と、直す二つ

枝は `integ-0905` から。触る file は `www/letters.js` `www/shell.js` `www/sns.js`
`www/act-map.js` `tools/word-check.mjs` `tools/find-check.mjs` `tools/fixture.mjs`
`docs/`。他は触らない。

オーナー「それで進めて」2026-09-11。押して測った結果を先に置きます ──
`origin/claude/r21-hunt` の道2・道8 の再現です。

## A. 消した文字の頁に立ったまま（道2）

**測り方。** `tools/fixture.mjs` の種で有料に立ち、`ab` が `ng` の文字を一つ
足し、その文字の頁に立って（`go('letter', id)` → `render()`）から
`ltDeleteGo(id)` を呼んだ。

**測った結果。**

| 訊いたこと | 消す前 | 消した後 |
|---|---|---|
| 立っている画面 | `letter:l73_40_2` | **`letter:l73_40_2`（動かない）** |
| trail | `letters > letter:l73_40_2` | **`letters > letter:l73_40_2`** |
| `KEEP` の鍵 | `letter\|l73_40_2` | **`letter\|l73_40_2`（残る）** |
| `keepDirty()` | `false` | **`true`** |
| ポップ | 無し | **`Save what you have typed?`** |
| `ltById(id)` | 有る | 無い |

**原因。** `ltDeleteGo()` は `if(here().r==='letter') back(); else render();` で
終わる。`back()` は `keepAsked()` を先に訊き、`keepAsked()` は今立っている画面の
buffer を訊く。その buffer の `now()`（`ltKeepOn`、`www/letters.js`）は
`ltById(id)` を読むので、文字が消えた後は `{ab:'', nt:''}` を答える。開いた時の
`was` は `{ab:'ng', nt:''}` だったので **差がある＝変えられた** と読まれ、
ポップが出て `back()` は戻り、画面は動かない。DOM は消す前に建てたままなので
消した文字の頁がそこに残る。

**これは CLAUDE.md 規則 14 そのもの** ── trail が名前で指している物が消えた。
語には `navDrop()`（`www/shell.js`）が在り、`delWordGo()` がそれを呼ぶ。文字には
誰も呼んでいない。`navDrop()` は `r==='form'` を決め打ちしているので、**route が
`letter` の頁はこの関数に名前を言えない**。そこが直す所。

**直し。** 新しい仕組みは作らない。`navDrop()` が「画面＝route とその引数」を
訊くようにし（`keepKeyOf` と `go` が既にそう言っている）、`ltDeleteGo()` は
`back()` をやめて `keepDrop()` + `navDrop()` + `render()` の一本にする。
`form` を名指す四つの呼び出し側（`www/words.js` `www/wordsheet.js`
`www/import.js` `www/grammar.js`）は既定のままで動く ── `grammar.js` は別の枝が
使用中で今日は揃えられないので、引数の並びを揃える件は `docs/BACKLOG.md`。

**赤で持つ所。** `tools/word-check.mjs`（trail の check、取り込みの claim も既に
そこに在る）に文字の claim を足す。

## B. ★で保存した検索がどこにも出ない（道8）

**測り方。** 種で `SET.saved=['kano','the sea']` `SET.recent=['kano']`、
`PULL_GOT` は答え済み。`snsQ=''` で `explore` を描いた。

**測った結果。**

| 画面 | 出たもの |
|---|---|
| 検索の空画面（`vExplore`） | `Latest / Recent / kano` ── **星の二つはどこにも無い** |
| 絞り込み（`vFilter`） | `Kept / kano / the sea` |

画面の名前は `snsClearQ` `go` `snsPickRecent` `snsDropRecent` だけで、
`snsHitsHTML()` の返した字に `snsPickSaved` は**入っていない**。

**原因。** `snsHitsHTML()` は空欄のとき `snsRecentHTML()` だけを返す
（`www/sns.js`）。星の一覧は `vFilter()` の中に別の描き方で直書きされていて、
そこへ行く道はタイムラインの角だけ。**★を押した画面からは、押した結果の置き場
へ行けない。**「どこにも出ない」は正確には「押した画面には出ない」で、
`snsRecentHTML()` 自身の comment が既に「「保存した検索」の同じ形」と書いて
いるのに、その「保存した検索」はこの画面に無い。

**直し。** 空画面の下は**一つの描き方**にする ── 見出しと言葉の行を作る関数を
一つ置き、星の一覧と履歴の一覧がそれを呼ぶ。押した時にすることは両方同じ
（その言葉が欄に入って検索し直される）ので、押す名前も一つ。違うのは見出しの
名前と、**一件ずつ消せる × が履歴にだけ付く**ことの二つだけ ── 星を外すのは
欄の★で、一覧に二つ目の外し方を作るのは `docs/FEATURE_RULES.md` § Deciding。

**赤で持つ所。** `tools/find-check.mjs`（人と言葉の検索の check、履歴の claim が
既にそこに在る）。

## 触らないと決めたもの

- `vFilter()` の星の一覧 ── あちらは「今どれを見ているか」の三つ目の答えで、
  押すとタイムラインが絞られる。空画面のとは press が違うので一つにしない。
- 星の行の × ── 削除の道を増やすのはオーナーの判断。`docs/BACKLOG.md` へ。
- `ltDeleteGo()` の無料枠の枝（枠を空にする方）── 文字は残るので、`back()` が
  保存を訊くのは正しい。
