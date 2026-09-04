# claude/gate2 — 押させない仕組みを二つ

**触るもの:** `tools/pre-push`（新規）· `tools/pre-commit` · `tools/gate.mjs` ·
`tools/docs-check.mjs`（新規）· `tools/docs-baseline.txt`（新規）· `package.json` ·
`docs/TESTING.md` · このファイル。

**触らないもの:** `www/` を一行も。ほかの検査、`docs/` の中身（この宣言以外）、
`ios/`、`supabase/`。

**作るもの 一 ── 赤い master を push させない。** ゲートが緑で終わった commit の
名前を作業場に書き残し、`refs/heads/master` へ押す直前にそれと突き合わせる。
記録は git に入れない。master 以外は止めない。`--no-verify` は塞がない。

**作るもの 二 ── 二つ目の箱を作らせない。** `docs/` の文書が `CLAUDE.md` /
`README.md` / `docs/STATE.md` のどこからも辿れなければ落とす。`assets-check` が
`index.html` に対してやっていることを、読む地図に対してやる。

**ゲートは回さない。** 自分が作ったものだけを、赤にしてから確かめる。
