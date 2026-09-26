# r100-prof ── プロフィールにリポストも／端末の設定の四つを消す／録音とシートを端末に残さない

ブランチ `claude/r100-prof`（`integ-0905` から）。決定ログ `docs/FEATURE_RULES.md`
2026-09-26「プロフィールに自分のリポストも出す」「ルールの洗い出しへの答え」。

## 持ち物（これ以外は触らない）
- `supabase/schema.sql`、`tools/rls-check.mjs`
- `tools/tl-check.mjs`、`tools/acct-check.mjs`、`tools/store-check.mjs`（と、消えたことを数える検査）
- `www/net.js`（`netPostsBy()` と関係する読みだけ）
- `www/core.js`（`SET_PHONE` と消す設定の一覧だけ）
- `www/phases.js`・`www/letters.js`（移行の読みだけ）
- `www/rec.js`、`www/sheet.js`
- `www/sns.js`・`www/me.js`（プロフィールの一覧だけ）
- 関係する `ios/App/App/*.swift`
- `docs/CHANGELOG.md`、この文書

## しないこと
- `www/post.js` は r99 の持ち物 ── 触らない（要るなら止めて報告）
- ゲートは回さない（作った検査・FAST・rls のみ）
- ビルドはしない

## 持ち物の外で触った物（どれも他のブランチは触っていない ── 触る前に `git log` で確かめた）
- `www/home.js` の `pfList()` ── プロフィールの一覧はここにあった（sns.js・me.js ではなかった）
- `www/settings.js` の `wipeHere()` に二行（C: 削除の時の掃除。理由は下）
- `tools/load-check.mjs`・`tools/fixture.mjs`（顔二つ、四つを書く行）・`tools/gramlang-check.mjs`・
  `tools/migrate-check.mjs`・`tools/i18n-check.mjs`・`tools/verify-script.mjs`・`tools/post-check.mjs`・
  `tools/sheet-check.mjs` ── どれも変えた物を押さえている検査
- `docs/` の今を言う文（`SET.order` に取り消し線、DATA_SAFETY の声の節、BACKLOG の四つ、CLAUDE.md の二か所）

## 報告（2026-09-26）

### A. プロフィールに自分のリポスト
- サーバー: `posts_by(who, lim, before)`（`supabase/schema.sql`）。`feed_fo()` を一人分にした形で列も同じ ──
  書いた投稿（`post_seen` のまま。ミュートでは外さない = 自分のページは見える）＋リポスト（`feed_fo` の boost の枝と
  同じ: 下げられた投稿・ミュートした人の投稿・ブロック／ミュートの間のリポストは出さない）を `at_key` の順で一つに、
  `distinct on (id)`。非公開とブロックは `post_seen` の `where` のまま。
- 電話: `netPostsBy()` はこれを一回訊くだけ。どれがリポストでいつかは `PF_BOOST`（`www/sns.js`）、`pfList()` が
  投稿の列に混ぜる（並びはリポストした時刻）。次のページは `at_key` から（`moreGot()`）。
- 検査: rls-check 14 行（600 回の試み、緑。リポストを落として 2 件赤）。tl-check 14c（pfList の混ぜ・moreGot の時刻を
  それぞれ戻して赤）。自分のページは `a=''` で、訊いた時の鍵（ハンドル）とずれていたのを 14c が見つけて直した。
- スクショ: `shots/r100-prof-mine-ja.png`（自分）、`shots/r100-prof-theirs-ja.png`（他人）── リポストした Veth の投稿が
  上に出る。
- **止めた所**: 「〇〇がリポスト」の印は**今どの画面も描いていない**（タイムラインも）。`netRow()` が `p.by` を付けるが
  読むのは `postMuted()` だけ。描くのは `postRow()`（`www/post.js`、r99 の物）なので触っていない。印を描くなら
  post.js の持ち主に。`p.by` はサーバーの uuid で、名前に直す所も要る。

### B. 端末の設定の四つ
- `SET_GONE`（`www/core.js`）＝消す欄の一覧、`setGoneDrop()`＝一つの消し方。r98 の `setVvkbDrop()` をこれに書き直し、
  `vvkb` は一行。`setDefaults()`・`SET_PHONE` から四つを外した。`migrateGramLang()` の語順の読み、`migrateLetters()` の
  `SET.script` の読みを消した（`gpos` と `SCRIPT.g` の写しは指示の外なので残す）。
- 検査: migrate-check（五つを三つの写しとメモリで数えて 0。呼び出しを外して 13/5 の赤）、gramlang-check（端末の古い
  語順はどの言語にも行かず設定にも残らない。外して赤）、store-check（23 欄）。i18n-check の読み方三通りの歩き
  （`SET.read` を誰も読まない）は一回に ── 描いた画面の数は 476 のまま。

### C. 録音とシート ── 変える前に何がどこにあったか
- 録音: 録り終えた時に `Documents/Voices` へ。投稿が上がれば消える。**下書きの声は端末だけ**（他の端末では声が無い）。
  **アカウント削除では消していなかった**（次の起動の `voSweep` まで残る）。
- シート・カード: 一時フォルダの `Sheets/` に書いて共有シートへ。**渡した後も消していなかった**。
- 削除（`netDropMe`）は投稿の本文からしかバケットの道を集めていなかった。

### C. 変えた後
- 録音は録り終えた瞬間に `post-media/<uid>/<名前>/vo.*` へ（`voKeep()`、名前はそのまま行き先がサーバー ── post.js の
  古い下書きの道がこの名前を呼ぶので）。端末には何も書かない。Swift の `keepVoice` を消した。下書きはバケットの道を
  持つ。`netUpVoice()` はそれを `vu` にするだけ。`voDropFile()` はバケットの道ならバケットから消す。
- アカウント削除: `netDropMe()` が下書きも読み、声をバケットから消す。`wipeHere()` が `lsWipeAcct()` の直後に
  `voSweep()`・`shDropOld()` を呼ぶ。**最初はアカウントが変わる時（`acctMem`）に掛けたが、acct-check 95 で測ると
  2 つ残った** ── `netEndMe()` は `wipeHere()` より先にサインアウトするので、その時まだ下書きがディスクにある。
  それで settings.js の二行にした。
- シート: `shareFile` が共有シートを閉じた時（保存・送信・取り消し）にファイルを消す。`dropOldSheets` は一時フォルダの
  `Sheets/` も消す。
- 検査: acct-check 95（録音は端末に書かずバケットへ、削除の後に残る声 0、別のアカウントの物は残る、下書きの声を
  バケットから。掃除と下書きの読みを外して赤）。post-check 6-7 を新しい道に（前の keepVoice の道で赤）。
  sheet-check に shareFile の完了（外して赤）。

## 確かめたこと・していないこと
- CODE CONFIRMED: 上の検査（作った／直した物）と FAST、rls、act、draft、load。ゲートは回していない。
- DEVICE CONFIRMED: 無し。**実機で見ること**: 録音 → 下書き → 別の端末で開いて声が鳴る／録音は電波が無いと
  「録音を保存できませんでした」／シートを共有して閉じた後に一時フォルダに残らない（Swift はビルドしていない）。
- **本番の `supabase/schema.sql` を貼り直す必要がある**（`posts_by()` が新しい）。貼るまでプロフィールの一覧は
  404 で空になる。
- 知っている限界: 下書きを開いて声を ✕ し、下書きを置き直さずに閉じると、サーバーの下書きは消した声の道を持ったまま
  （開くと「この声は見つかりません」）。
