# claude/r8-take — 受け持ち

リーダーの指示（2026-09-09）。OWNER 2026-09-09「DLしたやつがなくなるって意味が
わからん」。

## バグ

記事の ↓ で他人の言語を取ると `wldGet()`（`www/home.js`）が slice をメモリ
（`LSL`、規則 22）に書き、索引に `mine:false` の行を足し、サーバーの
`language_take` に行を立てる。アプリを閉じて開くと `LSL` は空で、起動の
`netLangsDown()`（`www/net.js`）は `language?owner=eq.<自分>` しか引かない。
取った言語は索引の行だけ残って中身が来ない ── 切り替えで開くと空の言語。
`netTakes()` は id の一覧を `LTAKE` に入れるだけで、誰もその言語の slice を
引かない。

## 直し方 ── 一つの道、二つ目の仕組みを足さない

`netLangsDown()` が **walk する行の集合を「自分の + 取った」にする**。owner 行
の walk と slice 埋めは既にあるので、二つ目の関数は作らない。

- 自分の行の ask は今までどおり `owner=eq.<自分>` ですぐに出す。取った言語の
  行は、起動の頭で既に出ている `language_take` の答えが**来た時に**
  `id=in.(…)` で引き、同じ walk に流す ── 待つのではなく、来た時に。直列に
  すると起動が一段長くなる（`slow-check`、launch は 5 段まで）。
  `language_read` は `published_at is not null or owner = auth.uid()` なので
  公開された他人の言語はそのまま読める。
- 索引の行は `langSeenAdd()`（`mine:false`）。自分の行は今まで通り `langMint()`。
- `wldPubGot` / `langNameGot` / `langWsysGot` / `langOwnGot(nid, その行の owner)`。
- slice は `netSlices(sid)` で **無い slice だけ埋めて止まる**
  （`slMine()!==null` なら触らない）── `docs/DATA_SAFETY.md` 規則 2。
- 何をどの章まで返すかはサーバーの `slice_read` が決める（`words`/`gram2` は
  持ち主以外に返さない）ので、来たものを全部埋める。
- 列を slice から埋め直す `netLangNamePut()` は **自分の行だけ**。他人の言語へ
  の PATCH は `language_edit` が拒む。

**自分の言語には一バイトも触らない。**

## 押さえる検査

`tools/again-check.mjs` に主張を足す。モックサーバーに他人の言語（公開、slice
あり）と自分の `language_take` 行を置き、アプリを開き直す → 切り替えの一覧に
その言語があり、開くと letters/kb などがサーバーのバイトそのまま入っている；
自分の言語の slice は一バイトも動いていない；`language_take` に無い他人の言語
は来ない。**先に赤を見る。**

## 触るファイル

- `www/net.js`
- `www/core.js`（`LTAKE` まわりのみ。要らなければ触らない）
- `tools/again-check.mjs`, `tools/fixture.mjs`
- `docs/CHANGELOG.md`, `docs/FEATURES.md`（Reading a downloaded language の行）,
  `docs/scope/r8-take.md`

## 触らないもの

- `www/index.html`, `www/home.js`, `supabase/schema.sql`（schema が要ると
  思ったら止まって報告）
- `www/sns.js`（`askLangs` は別セッションの territory。ここは呼ばれる側だけ直す）
- 記事の ↓ を押した時にその言語へ切り替えるかどうかは別の判断待ち。触らない。

## 保存されるもの

増えない。削除なし。`language_take` にある言語の slice が、今まで来ていなかった
のが来るようになるだけ。

## 検査

`npm test` はリーダーが回す。押さえる一本（`npm run again`）だけ、赤を見てから
緑にする。`npm run slow` も回す ── 起動の段（launch は 5 まで）はこの変更が
一番踏みやすいところで、実際に一度踏んだ（6/5、2026-09-09）。
