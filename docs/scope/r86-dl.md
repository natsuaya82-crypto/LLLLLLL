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

---

## 報告（2026-09-25）

### 原因（測った）

**検査の揺れで、アプリの穴ではない。** 計測版の dl-check で `slWr`・`slRm`・`slGot`・`LSL`（Proxy）・
`localStorage.setItem/removeItem` と検査の `netSlices` 差し替えを包み、`sid` の `wld` に触った者の
stack と時刻、end() の呼ばれ方を取った。4 本並べて赤 2・緑 2、全部の回で同じ形:

- `wld` を書いたのは毎回 `www/net.js` の `netLangFill()` の中の `fill`（`slWr` → 2143 行、
  `netAgreed` → `slGot`）。snap の 15〜60ms 後。
- その `netLangFill(sid)` を始めたのは検査の表面総当たりで `feed openPost` を押した所
  （`navLand → pageWait → PAGE_READS`、langId=sid）。総当たりは同期の forEach なので、差し替えの
  `setTimeout(ok(THEIRS))` の答えは総当たりが終わるまで届かず、同期の probe が始まった後に届く。
- 赤 ⇔ `netLangSync()` を呼んだ時に `NET_SYNCING=false`（自分の言語の同期が本物の網へ出て、
  end() は 400ms のタイマーからしか来ない → `fill` が窓の中に入る）。
  緑 ⇔ `NET_SYNCING=true`（総当たりの同期がまだ飛んでいて、`netLangSync()` は何もせずすぐ返り、
  `fill` より先に end() が走る）。**緑の回は netLangSync を一度も試していなかった。**
- `langMineIds()` は毎回自分の言語一つだけで、`sid` は一度も入らなかった。`netSlicePut` への put も 0。

`fill` が書くのは、この端末に何も無い slice へのサーバーの答え（画面に着いた時の読み込み）で、
人の編集ではない。「取ってきた言語は編集できない」には当たらない。

### 何をどのファイルで

`tools/dl-check.mjs` だけ（コミット 24a6ad63）。
- 差し替え（`netSlices`・`netLangSeen`）の答えを `later()` で数え、同期の probe の前に `settle()` で
  流しきる。固定の待ち時間ではない。
- `NET_SYNCING` が降りるまで待つ（測ると 30〜360ms）。5 秒で降りなければ `syncBusy` として赤
  ── 「走らなかった」を緑にしない。赤の一行に「a sync was still running, so this one never asked」。
- end() は一度だけ（答えとタイマーが両方来ても最初の一つで決まる。前は二度目が `out.syncMoved` と
  `langId` を後から書き換えていた）。

### 振る舞い・保存する物

アプリの振る舞いの変化は無し。保存する物も変化無し。www/ は触っていない。CHANGELOG 不要。

### 回した検査

- 直す前: 計測版で 4 本並べて赤 2/4（上の証拠）。そのままの dl-check を 4 回続けて回すと 4/4 緑
  （揺れは負荷がある時に出る）。
- 赤を見た: (1) `langMineIds()` から「他人の言語は飛ばす」を外す bug を入れて 3/3 赤、毎回
  「it put `words,notes,kb` and moved `kb`」── 揺れではなく本物の put で落ちる。戻した。
  (2) 待ちの直後に `NET_SYNCING=true` を置いた写しで、新しい枝が赤になるのを 1 回見た。
- 直した後: dl-check 5 回続けて 5/5 緑（最後のコミットの形で。取り込み後も 1 回緑）。
  4 本並べて 2 巡 8/8 緑。
- 全ゲートは回していない（規則 6）。

### CODE / DEVICE / OWNER

- CODE CONFIRMED: 上の通り。
- DEVICE CONFIRMED: 不要（検査だけの変更）。
- OWNER CONFIRMED: 無し。

### 気付いたこと（決めていない）

- `netLangFill()` は取った言語について、取った章（ここでは letters だけ）に限らず、サーバーが読ませる
  slice を全部（wld・script・snd・kb）この端末の写しに埋める。これは読み込みで編集ではないが、
  「取った言語が持つのはどの章か」は仕様の問いで、ここでは決めていない。
- dl-check は同期の probe で自分の言語の同期を本物の網（proxy で断られる）へ出している。今は
  タイマーで閉じるので結果に影響しないが、「網だけを差し替える」という検査の頭の文とはずれている。

### リーダーの指示が間違っていた所

無し。「put は無い」「311〜340 行の probe」は測った通り。
