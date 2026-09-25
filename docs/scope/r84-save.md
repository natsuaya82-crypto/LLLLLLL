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
