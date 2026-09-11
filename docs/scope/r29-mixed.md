# claude/r29-mixed ── 端末の物で決めている所を洗い出す（直さない）

- Goal: オーナー 2026-09-11「変に混ぜてるやつあるやろ、洗いざらい出してくれ。
  勝手に修正しないで」。`www/*.js` の中で、**端末側の物**（localStorage の鍵、
  `SET` の欄、索引 `LANGS` の欄、メモリの印、`.got` の印、移行の印）を読んで
  何かを**決めて**いる所を全部拾い、一覧にする。
- Owns (may change): `docs/scope/r29-mixed.md` `docs/reports/mixed-2026-09-11.md`
  の二つだけ。
- Does NOT own: **`www/` は一行も触らない。** `tools/` も `supabase/` も
  `ios/` も触らない。既存の `docs/` の他のファイルも書き換えない。
- Decision it implements: なし。**直し方は書かない** ── 決めるのはオーナー。
- Check to run: **回さない**（規則 6、そして一行も変えていない）。ゲートも
  ビルドも出さない。

読んだもの: `CLAUDE.md`（Online / NOTHING IS THE PHONE'S / 規則 6・11・22 /
What the free plan is）、`docs/ARCHITECTURE.md`、`docs/DATA_MODEL.md`、
`docs/STATE.md`、`origin/claude/r24-lang` の `docs/scope/r24-lang.md`
（`langMine`/`langOwned` で「自分の言語があるか」を決めて空の言語が生えた例）。
