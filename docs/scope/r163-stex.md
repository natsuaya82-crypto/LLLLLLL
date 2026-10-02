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

## CLAUDE.md（リーダーが直す）
（終わりに書く）
