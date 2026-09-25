# r92-gramlang — gramlang-check が単独でも半分赤になる原因

枝 `claude/r92-gramlang`、`integ-0905` 8631840f から。

## 何をするか

`node tools/gramlang-check.mjs` を単独で回すと 4 回中 2 回赤（否定の規則を
二つの文から読む所がまとめて null）。原因を測り、赤を確実に出す条件と、null
を返したのが誰かを特定する。アプリの穴ならその一つの道を書き直し、検査の側
なら検査を直す（アプリの穴でないことを測って示す）。直した後 10 回続けて緑。

## 触ってよいファイル

- `tools/gramlang-check.mjs`
- `docs/scope/r92-gramlang.md`
- 原因がアプリにあった場合だけ、`www/grammar.js`・`www/grammar-engine/*`・
  `www/phases.js` のうち要る物（触る前にここへ書き足す）
- `docs/CHANGELOG.md`（振る舞いが変わった場合だけ）

## 触らないもの

`www/index.html`、上に無い全て。全ゲートは回さない。

## 他の枝

`git log --all ^HEAD` で `www/grammar.js`・`www/grammar-engine/` に出るのは
77596f06（2026-09-23、`claude/r52-forms` ほか古い枝）と、それを取り込んだ
`claude/owner-todo` の merge だけ。今動いている枝ではない。
`tools/gramlang-check.mjs` に他の枝のコミットは無い。

## 報告

### 原因（測った証拠）

**検査の側。アプリの穴ではない。**

1. 赤を再現: 元の検査を 8 回 → 2 回赤（3・6 回目）。赤の行はリーダーの物と同じ。
2. 押す直前を測った: 写しに polar の最初の Save の直前で `KEEP_BUSY` を記録させ、
   6 回 → 赤 4 回はすべて `KEEP_BUSY=true`、緑 2 回はすべて `false`。一対一。
   `keepSave()`（`www/shell.js`）冒頭の `if(KEEP_BUSY) return;` で Save が捨てられ、
   規則が一つも書かれない → 否定の判定がまとめて null。
3. 誰が KEEP_BUSY を立てていたか: 一つ前の段 `mk` の `keepPress()` の時点で、
   6 回とも**すでに** `NET_SYNCING=true`。mk の送信は `NET_NEXT` に並び、KEEP_BUSY
   が立ったまま。polar は mk の約 60ms 後で、先の送信がそれまでに返れば緑。
4. 先の送信は何か: `netSend1` を包んで stack を取った →
   `netSaveNow ← backup.js:63`（`bkTouch()` の `setTimeout 0`）。前の段の書き込み
   が、**本物の窓で本物の `SB_URL`（本番の Supabase）へ** `POST /rest/v1/language`
   を出していた。この環境では約 200〜250ms 後に status 0 で落ちる。
5. 赤を確実に出す条件: 外への要求を 1 秒遅らせる（`page.route`）と元の検査は
   3/3 赤、同じ 8 行。
6. アプリの穴でないこと: polar の前に `KEEP_BUSY` と `NET_SYNCING` が下りるのを
   待たせた写しは 6/6 緑（待ちは 35〜94ms）。並んだ送信は先の送信が終わった後に
   順番どおり走り、`KEEP_BUSY` は下りる。これは `www/net.js` § NET_NEXT（送信は
   一つずつ、後の物は順番を待つ）と `keepSave` の「送信中の二度押しは受けない」の
   とおりの振る舞い。

途中で一度間違えた: 最初は起動の送信だと思い `networkidle` を待たせたが、1 秒遅延
で赤のまま。stack を取って段の送信だと分かり、それは消した。

### 何をどのファイルで

`tools/gramlang-check.mjs` だけ（5d047197）。

- `boot()` の中で `netSend1`（全ての道が通る一つの窓、`www/net.js`）を一度だけ
  即答の偽物にする。起動がそれより前に出した分は `page.route` で localhost 以外を
  即 abort し、`NET_SYNCING` と `KEEP_BUSY` が下りてから段へ進む。boot の後の全ての
  段を一か所で覆う。
- 同じ穴の個別の栓を消した: mk の `netSend` の偽物、order 盤の段と polar の
  `netSaveNow` の偽物（`realNet` 三つ）。窓の偽物を外すと order 盤と mk も赤になる
  ことを見た ── これらの栓が塞いでいた物と同じ原因。
- 副作用: この検査は本番の Supabase へ何も送らなくなった（前は送っていた）。

### 振る舞い

アプリは変わらない。`www/` は一行も触っていない。CHANGELOG は書いていない
（保存物も振る舞いも動かない）。

### 回した検査

- `node tools/gramlang-check.mjs` 単独: 直した後 **10 回続けて緑**。
- 赤を見た: 直した形から窓の偽物だけ外し、1 秒遅延を付けて 3/3 赤（否定の 8 行
  null ＋ order 盤・mk の 6 行）。直した形 ＋ 1 秒遅延は 3/3 緑。
- pre-commit の速い検査（コミット時）。全ゲートは回していない（規則 6）。

### CODE / DEVICE / OWNER

- CODE CONFIRMED: 上のとおり、検査の単独 10/10 緑と、赤の再現。
- DEVICE CONFIRMED: 要らない（検査だけの変更、端末の振る舞いは変わらない）。
- OWNER CONFIRMED: 無し。

### 測っていないこと

`keepPress`/`keepSave` を使う検査は他に 7 本ある（again・fill・forms・kb・keep・
store・word）。同じ形（セッションを持つ種で本物の窓のまま Save を押す）が他にあるか
は数えただけで測っていない。`store-check` と `word-check` は窓も netSaveNow も偽物に
していない。持ち分の外なので、見るかどうかはリーダーへ。

### リーダーの指示が間違っていた所

無し。「他の検査と並べていなくても赤」はそのとおりで、原因は並列ではなく外の
ネットワークの返る速さだった。
