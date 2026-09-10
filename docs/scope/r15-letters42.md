# `claude/r15-letters42` ── 写しの無い端末で保存すると、サーバーの文字が 39 → 42 に増える

- 日付: 2026-09-10
- ブランチ: `claude/r15-letters42`（`integ-0905` の `9c32eaad` から）
- オーナー 2026-09-10:
  「サーバーの文字は増やさないでくれ。原因特定しても穴埋めるみたいな治し方を
  するからそうなるでしょう。しっかり特定してコードごと直して」

`docs/scope/r11-letters.md` の訂正後の表の一行と、`docs/BACKLOG.md`
「写しの無い端末で保存すると、サーバーの文字が 39 → 42 に増える ── r11 の残り、
二つ」の 1 と 2。r11 は**どの行がそうしたかを測っていません**。この枝は測って
から書き直します。

## この枝がやること、順に

1. **測る。** 偽サーバーが letters 39（a–z・`!`・`?`・0–9 の 38 ＋ 描いた一文字）
   を持ち、端末には索引だけで写し（`lingua.<id>.letters` / `.got`）が無い状態
   から、起動 → 文字を一つ描いて保存、を r11 の台本で流す。**どの関数のどの行で
   38 が 39 と結ばれず 42 になるか**を貼る。「同じ文字か」を id で見ているか
   名前で見ているかも書く。**ここまでを先に報告する。**
2. **書き直す。** 「同じ文字か」の答えを一箇所にし、そこを通らない道を消す。
   `syMerge()` に条件を足す形は禁止（CLAUDE.md「Simple, and a bug is REWRITTEN,
   not patched」）。書く前に形を一行でリーダーに出す。
3. **検査。** `again-check` に「写しの無い端末で保存しても、サーバーの文字は 39
   のまま ── 増えない・減らない・描いた形は残る」を足し、バグを戻して赤を見る。
4. r11 の残りの二つ目（入れ直した端末で、端末に無い言語が上がる ── 147 で出て
   149 では出ない）を、番号一本化後の今の code で一度流す。出ないなら
   **出ない理由を一行で**ここに書く。出るなら止まって報告する。

## 触ってよい file

```
www/sync.js            www/letters.js
www/net.js             保存の道だけ
www/core.js            SLICES / slRd 周りだけ
tools/again-check.mjs  tools/fixture.mjs
docs/scope/r15-letters42.md   docs/CHANGELOG.md
```

**触らないもの** ── `www/index.html`、`supabase/schema.sql`、上に無いすべての
`www/` と `tools/`。他のブランチを merge / rebase / cherry-pick しない。
ゲート全体（`npm test`）は回さない ── リーダーが回す。回すのは直しを押さえる
一つ（`npm run again`、要れば `npm run acct`・`npm run migrate`）と、作業中の
速い九つ。

## 前提（読んだもの）

- `docs/scope/r11-letters.md` ── 訂正後の表。偽サーバーの取り出しに欠陥があり
  「差ゼロ」は取り消されている。
- `docs/scope/r12-oneid.md` ── **番号は一本になった。`sid` は無い。**
  `LANGS` の鍵がサーバーの番号そのもの。
- `docs/BACKLOG.md` 該当項、`docs/STATE.md`、`docs/SESSIONS.md`。
