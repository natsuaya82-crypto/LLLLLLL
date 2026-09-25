# r84-save ── 2026-09-24 オーナーの答えのうち、保存・版・取った言語・読む時・購入・上限の文

枝 `claude/r84-save`（`integ-0905` 2e2389ba から）。決定は `docs/FEATURE_RULES.md`
「2026-09-24 オーナーの答え（確認事項 40 項への返事）」。

## 実装する物

- A. 保存がサーバーに上がるのは「保存を押したら」── アプリ全体で。打ち終わりで勝手に上がる道
  （`bkTouch()` → `netSaveUp()` の遅延送り）を消し、押した所だけが送る。
- B. 言語を前に戻す ── 戻せるのは 3 つ前まで、戻す時は言語まるごと。今の版の仕組みを先に測る。
- C. ほかの人から取ってきた言語は編集できない（読むだけ）。書き手の全部を一つの門で。
- D. 開いた時に読むもの ── 通知・タイムライン・今日のお題・プラン・テーマと言語（`PAGE_OPEN`）。
  それ以外は開く前にロード（`navLand()`）。足りない所だけ。
- E. 子どもの購入を親が承認したら、開き直さずすぐ有料に（`Transaction.updates`）。
- F. 上限に達した時の文を、ほかの上限の文と同じ形に（キーボードの「Pro でも 3 つまで」を消す）。

変えないこと: 消す前の確認の窓。

## 持ち物（これ以外は触らない）

www/core.js www/net.js www/backup.js www/sync.js www/boot.js www/shell.js www/sns.js www/store.js
www/settings.js www/keyboard.js www/words.js www/wordsheet.js www/letters.js www/grammar.js
www/phases.js www/notes.js www/home.js www/sound.js www/glyph.js（A・C に要る所だけ） www/i18n/*.js
ios/App/App/LinguaStore.swift supabase/schema.sql（B に要れば） tools/*-check.mjs（上を持つ物）
tools/fixture.mjs CLAUDE.md docs/FEATURE_RULES.md docs/CHANGELOG.md このファイル。

## やり方

CLAUDE.md § Simple・§ COVERED。直した物は検査が赤になるのを一度見る。見た目が変わった物は前後の写真を
shots/ に。全ゲートは回さない（リーダー）。schema.sql を変えたら `npm run rls` を一回。一項一コミット。

## B. 言語を前に戻す ── 測ったことと、止めた所

**書いた（2026-09-25、リーダーが持ち物に `www/mod.js`・`tools/hist-check.mjs`・`tools/rls-check.mjs`・
`supabase/schema.sql` を足した）。**形は下の案のとおり。報告はこの節の終わり。

### 今の版の仕組み（測った）

- `supabase/schema.sql` § slice_hist: `slice` の行が **update / delete される直前**に、古い body を
  `slice_hist(language, kind, body, at)` に一行積む（`slice_hist_keep()`、before trigger）。`at` はその body が
  「今」でなくなった時刻。**部分（kind）ごとに新しい 3 つだけ**残し、4 つ目で一番古いのを消す（このファイル唯一の自動の削除）。
- 読めるのは `is_staff()` だけ。書く道は trigger だけ。アプリに人が自分の版を見る画面は無い。
- 戻すのは運営: `admin_hist(handle)` が (language, kind, at) の並びを返し、`admin_restore(language, kind, at)` が
  **その一つの kind だけ**を `slice` に書き戻す（書き戻しも update なので、直前の「今」が版になる ── 戻すのを戻せる）。
- 画面（`www/mod.js` `adRecParts()`）は `SLICES` の順に kind ごとの見出しと、その下に版の日時を並べる。押すと一つの kind。

### 決定との食い違い

「言語を前に戻す →『3つ前、まるごと』」（2026-09-24）。今は **kind ごと**に戻すので、単語だけ三つ前・文字は今、という
辻褄の合わない言語が作れる（2026-09-04「戻すのは丸ごと」の理由そのもの）。「3 つ」は kind ごとの数で、言語の数ではない。
決定ログの「期限は無い」（2026-09-04）と「部分ごとの版 → 戻す」（2026-09-09）は、この枝で書き直した。

### 書く形（案）

1. **一回の保存に番号を付ける。**`netSaveNow()` が一回の送りごとに id を作り、その回の `slice` の upsert に
   `press` として載せる（列を一つ足す: `slice.press uuid`、`slice_hist.press uuid`）。trigger は古い body に
   **それを置き換えた保存の番号**（`new.press`）を付けて積む。
2. **言語の版 = 保存の番号。**「保存 P の前の言語」は kind ごとに: P で変わった kind は P の行の body、P より後に
   変わった kind はその後の最初の行の body、どちらでもない kind は今の body。**kind ごとに 3 つ残せば、3 回前の保存
   まではどの kind でも必ず届く**（一回の保存で一つの kind が変わるのは一度だけ）── 残す数と消す trigger は今のまま。
3. `admin_hist` は言語ごとに**新しい 3 つの保存**（番号と時刻）を返し、`admin_restore_lang(language, press)` が
   全部の kind を一度に書き戻す。画面は言語 → 版（3 つ、日時）→ 戻す。
4. 番号の無い古い行（今までの版）は、時刻が一つずつ違うので一つずつ別の保存として並ぶ ── 消さない。

**オーナーに訊くこと:** 無い（形は決定どおり）。

### B の報告

**CODE CONFIRMED のみ。**実機・オーナーは無い。

- `supabase/schema.sql`: slice_hist の節に `slice.press`・`slice_hist.press`、trigger が置き換えた保存の番号を版に。
  戻す節（同じ機能なのでここも触った）に `slice_versions()`（invoker、新しい 3 つ）、`admin_hist()` は言語の版を返す、
  `admin_restore_lang()` が言語まるごと、`admin_restore()` は drop。
- `www/net.js`: `NET_PRESS`（一回の送りに一つ、`uuid4()`）を `netSlicePut()` が載せる。`netHist()`・`netRestore()` は版で。
- `www/mod.js`: `adRecParts()` は版の行だけ（部分の見出しを消した）、`adRecPick()`・`adRecGo()` は (言語, 版)。
- `www/i18n/*.js`: 部分の名前 `sl.*` 12 個 × 10 言語を消した（この画面だけが使っていた）。
- 検査: `npm run rls` 緑（513）、部分ごとに戻す形で赤。`hist-check` 緑、前の画面で赤。`again-check` の「一回の保存は
  一つの番号」、番号を外して赤。act・i18n・速い検査は緑。
- 写真: `shots/r84-B-rec-before.png`（部分ごと）、`shots/r84-B-rec-after.png`（版三つ）。
- **順番**: schema.sql をアプリのビルドより先に。列が無いと保存が全部断られる（`supabase/setup.md` に書いた）。
- rls-check は CASES の版の所だけ（前の `admin_restore` の行を `admin_restore_lang` に書き換え、足した）。

## 報告

**CODE CONFIRMED のみ。**DEVICE・OWNER は無い。全ゲートは回していない（リーダー）。直した物はどれも、前の形に戻して
検査が赤になるのを見た。

| 項 | 何をした | 検査（赤を見た） | 写真 |
|---|---|---|---|
| A 保存を押したら | 1.2 秒の溜め（`netSaveUp`・`NET_UPMS`）を消し、送りは `netSaveNow()` 一本。書き手は全部 `langWrites()`、保存のある画面が道筋にある間は下書き（`keepDrafting()`）── 保存が書いて送り、いいえは開いた時の形（`langHold()`/`langHeldBack()`）。保存の無い画面は押しが保存（`bkTouch()`）。送っている最中の押しは待って送る（`NET_NEXT`） | keep-check 23（78 件）・22・C、again-check（最中の押し）。3 回 | 見た目は変わらない |
| B 3 つ前・まるごと | 入った（2026-09-25 に持ち物が足された）── 上 § B の報告 | rls・hist・again。3 回 | shots/r84-B-rec-before/after.png |
| C 取った言語は読むだけ | 全部の画面（41）の全部のボタン（165）を押して測った。字の無い音から字を作る一つ（`ltForUnit`）を閉じた。dl-check の「書き手が断る」は `localStorage` しか見ておらず盲目だった ── メモリも見る | dl-check 2 つ。2 回 | 見た目は変わらない |
| D 開いた時に読む物 | 測ると五つとも既に読んでいた。load-check 1 が五つを訊く（前は「オーナーの物」として許していただけ）。CLAUDE.md・`PAGE_OPEN` の文 | load-check 1。1 回 | ── |
| E 親の承認はすぐ | `Transaction.updates` が届いた物を取っておいた後にページへ `linguastore` を投げ、`store.js` が起動と同じ `storeSync()` | plan-check 2 つ（入れる前に赤）。**Swift は未ビルド** | ── |
| F 上限の文 | Plus のキーボードを無制限（`PLUS_KB` を消した）、Plus のカードの行、Pro の同じ行を消した。上限のポップは `up.need` 一つ（2026-09-04「Pro を言う」は差し替え済み） | kb-check（前の 4 で赤）・plan-check・paid-check | shots/r84-F-plans-before/after.png（Plus のカードは横に隠れて写っていない） |

### オーナーに訊くこと

1. **保存のある画面からタブで出た時** ── 「戻る」なら「保存しますか？」と訊くが、タブで出ると訊かない。その時の下書きは
   画面の大域に残り、次に別の画面で押した保存がその章を書く時に一緒に上がる。タブでも訊くか。
2. **Pro で言語 3 つ・ダウンロード 3 つに達した時** ── 今は「この機能を使うにはアップグレードが必要です」（`up.need`）と
   出る。Pro の上には段が無いので、その文は嘘になる。「他に合わせて」の「他」がこの文なら今のまま、違う文にするなら
   その文を。

### リーダーに

- 持ち物の外を直した所（その変更が嘘にした文だけ）: `docs/PAID_FEATURES.md`（F）、`docs/ARCHITECTURE.md`・`DATA_MODEL.md`・
  `DATA_SAFETY.md`・`FEATURES.md`・`STATE.md`（A・B・C の `netSaveUp` と「すぐ上がる」の文）。
- `docs/STATE.md:1419` の `PLUS_KB=4` はリーダーの章なので触っていない（F で消えた名前）。
- 全ゲートは回していない。回した検査: keep・again・kb・dl・plan・paid・load・gramlang・forms・slow・fill・quiet・import・
  word・acct・state・draft・world・take・open・migrate・i18n と速い検査全部 ── 緑。press は回していない。
