# r163-stex — 文法の章の例文も、改行ボタンは改行、足すのは ＋

ブランチ `claude/r163-stex`（`origin/integ-0905` から）。
決定：`docs/FEATURE_RULES.md` § 2026-10-02「文法の章の例文も、改行ボタンは改行、足すのは ＋」。
前：`docs/scope/r161-lines.md`（ここで止まっていた）。

## やること
- `sx-ln`・`sx-gl` に `lnlines`（r161 と同じ一つの文）。Enter で足す道（KD `stAddEx`）は消す。
- 見出しの ＋（`stExOpen`）が、打った例文を足してから次の空の欄を開く ── 語の例文の ＋（`wdOpenMore()`）と同じ形。
- バーの保存で、欄に打ったまま ＋ を押していない例文が黙って消えないようにする（今を測って報告）。
- 例文の表示が改行を保つかを測る（段の例文の一覧、カード）。
- `pua-check` G で持つ（`WAITS` を外す）。`keep-check` の「Enter で足す」も ＋ に書き直す。
- `docs/CHANGELOG.md`（コードの前）、偽になる docs の文、`shots/r163-*.png`。

## 触ってよいもの
`www/phases.js`（例文の欄・＋・保存）、`www/act-map.js`（`stAddEx` を外す・受け手を足す）、
`tools/pua-check.mjs`、`tools/keep-check.mjs`、`tools/fixture.mjs`（例文の面が要れば）、
`docs/CHANGELOG.md`、`docs/FEATURE_RULES.md`（この決定の実装状況）、`docs/scope/r163-stex.md`、
偽になる docs の文、`shots/r163-*.png`。

## 触らないもの
語の例文（`www/wordsheet.js`）── 振る舞いが変わるなら報告だけ。`CLAUDE.md`。保存されたデータ。

## 測ったこと（2026-10-02）
- **直す前**: 文法の例文の欄に行と訳を打ち、Enter を押さずにバーの保存 ── 保存は光らず（`keepDirty` false）、
  押しても `STG.ex` は 1 のまま、欄の中身は黙って消えた。戻る時も聞かれない。
- **直した後**: 欄に打つと `stExType` が保存のバッファに入れるので保存が光る。＋ と保存は同じ `stExTake()` で
  欄の例文を一覧に入れる。戻る時は「保存しますか」と聞く（keep-check の一巡が持つ）。
- **表示**: 段の例文の一覧（`exRowHTML()`、`.exl`・`.exg`）は r161 の pre-wrap 一行で二行のまま。章の頁も同じ
  `stExHTML()`。段の例文にカードは無い（✕ だけ）。`pua-check` H に二行足した。

## 見つけたが触っていない
- **単語の例文（`wd-exl`・`wd-exg`）も、欄に打っただけでは保存が光らず、戻ると聞かれずに消える**
  （測った：`keepDirty` false、`back()` で問いが出ない）。保存を押せば `wdTakeFields()` が入れる。
  直すなら語のシートの `now()`（`wdNow()`）に欄を入れる話で、語の側の振る舞いが変わるので触っていない。

## CLAUDE.md（リーダーが直す）
r161 の提案文に足すなら:「文法の章の例文（`sx-ln`・`sx-gl`）も同じ。例文を足すのは見出しの ＋ とバーの保存で、
どちらも `stExTake()`（`www/phases.js`）。Enter で足す道は無い（OWNER 2026-10-02）。`pua-check` G・`keep-check` が持つ。」
