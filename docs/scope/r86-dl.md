# r86-dl ── dl-check の揺れ

枝 `claude/r86-dl`（`integ-0905` から）。

## 範囲

- やること: `node tools/dl-check.mjs` が同じコミットで緑と赤を行き来する原因を測って見つける。
  赤は 311〜340 行の probe ── 取ってきた言語の slice `wld` が snap と end() の間に変わる。
  `slWr` を包んで stack を取り、誰がいつ書いたかを特定する。
- 触ってよいファイル: `tools/dl-check.mjs`、`docs/scope/r86-dl.md`。
  原因がアプリにあれば、その書き手のある `www/*.js`（core.js・home.js・net.js・sync.js・shell.js
  のうち要る物だけ ── 触る前にここへ名前を書き足す）、保存の振る舞いが変われば `docs/CHANGELOG.md`。
- 触らないもの: `www/index.html`、`supabase/schema.sql`、`tools/rls-check.mjs`（r87）、他の全て。
- 全ゲートは回さない。回すのは dl-check だけ（5 回続けて）。
