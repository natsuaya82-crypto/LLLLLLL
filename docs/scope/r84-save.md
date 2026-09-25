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

**止めた。**戻す画面は `www/mod.js`（運営の画面、`adRecParts()`・`adRecPick()`）で、この枝の持ち物に無い。
版の数え方を変えると画面の形が変わるので、サーバーだけ変えて画面を残すと、画面が嘘を描く。
**持ち物に `www/mod.js`（と `tools/hist-check.mjs`・`tools/rls-check.mjs`）を足してもらえれば、下の形で書く。**

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

**オーナーに訊くこと:** 無い（形は決定どおり）。**リーダーに:** `www/mod.js` を持たせるか、別の session に出すか。
