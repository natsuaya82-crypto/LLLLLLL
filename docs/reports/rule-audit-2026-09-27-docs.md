# rule-audit 2026-09-27 ── docs（文書と検査）

ブランチ `claude/audit-docs`（integ-0905 `7ad9b612` から）。範囲は `docs/scope/audit-docs.md`。
**書き足しながら push している。途中の版。** 各項目: 場所 · 規則 · 何が · 証拠 · したこと。

凡例: 【直した】このブランチで直した（コミット） / 【他へ】www・supabase・ios・android の物、担当セッションへ /
【オーナー】決めるのはオーナー、選択肢つき / 【未】見つけたが、まだ手を付けていない

## A. 検査が、バグを入れても緑のまま（CLAUDE.md「watched failing」「a copy always agrees」）

各バグは worktree の中で www/ に入れ、その検査だけを走らせ、戻した。

A1. `tools/face-check.mjs:240` · 17 条 4 · 4 番目の決まり（canvas の字は page に訊く）は、`+ fam` を含む行を名前で見逃している。
`www/card.js:452` に `fam='Arial';` を入れても EXIT 0。【未】

A2. `tools/face-check.mjs:170-205` · 17 条 3「www/*.js に家族名を一つも書かない」 · :root が宣言している家族しか探していない。
`www/notes.js` に `font-family:Helvetica` と `e.style.fontFamily='Helvetica'` を入れても EXIT 0。【未】

A3. `tools/face-check.mjs:62-64` · 17 条 1 · `<style>` の中しか読まず、`index.html` のマークアップの `style="font-family:…"` を読まない。【未】

A4. `tools/sides-check.mjs:84-115` · 8 条 · `MINE` は手で書いた一覧（CLAUDE.md が「a list of keys, written by hand」と戒める形）。
作る側の変数 `LANGS`・`LMINE`・`KB`・`WLD`・`LSL`・`WSYS`・`PLAN` が入っていない。
`postWho()`（線より下）に `LANGS[LMINE].name`・`KB[0].name` を入れても「none of them yours」、EXIT 0。【未】

A5. `tools/dead-check.mjs:330-340` · 5 条 · 「届いている」を「二回以上名前が出る」で数えている。
自分しか呼ばない関数、互いしか呼ばない二つ、`ZZ=ZZ+1` だけの変数が全部「reached」、EXIT 0。【未】

A6. `tools/dead-check.mjs:165-173` · 5 条 · `tools/*.mjs` の中の言及も「届いている」に数える。
アプリから誰も呼ばず、検査からだけ呼ばれる関数が生き残る: `www/me.js:1607 folPut`（fixture だけ）、
`www/phases.js:415 gramArgs`（press・i18n-check・shot だけ）。【未】（関数を消すかは www の担当 → 【他へ】core/words）

A7. `tools/dead-check.mjs:217` · 5 条 · 「値として使う」を後ろが `( ) , ;` かで近似している（代わりの印で見ている）。
`a ? f : g`・`||`・`[f]`・`{k:f}` は使われた数に入らない。`netFollowers` は検査が名前を出すから生きている。【未】

A8. `tools/store-check.mjs:146-156` · 22 条 · 書き込みを `file:<式の字面>` で見分けている。
同じ字面（`core.js:k`）の新しいキーは既存の行として通り、`localStorage[k]=` のような書き方は見えない。
`lingua.photo.cache`・`lingua.zz2`・`lingua.zz3` を書かせても EXIT 0。【未】

A9. `tools/store-check.mjs:146-156`（FIELDS） · 22 条 · `SET.x.push()`・`SET.x[k]=` は書き込みに数えない。【未】

## B. 検査のコメント・文書が、検査の実際と違う

B1. `tools/store-check.mjs:25-27` · 「there are four of those」 · 実際の出力は「9 keys — 0 with a road, 9 the phone's own」。数を消す。【未】

B2. `tools/face-check.mjs:268` · 出力の「none named twice」 · 二回宣言を調べている所が無い。【未】

B3. `CLAUDE.md:970` · 7 条「eleven real samples」 · `import-check` の見本は 19。しかも見本自身のコメント（:20-23）が「本物の書き出しではない」と言う。【未】

## C. 文書の嘘・古い規則（読み途中）

C1. `tools/docs-baseline.txt` · STATE.md の古い名前 16・ゲートの本数を数える文 3・無いファイル／検査 2。【未】

C2. `tools/docs-baseline.txt` · 決定ログに無い OWNER 日付 4 つ（2026-08-31・09-07・09-10・09-16）がコードのコメントに引かれている。
決定ログを書くのはリーダー。【オーナー／リーダー】
