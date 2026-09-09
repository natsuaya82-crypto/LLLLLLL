# `claude/r10-wire` ── 同じものを何度も運ばない

- 日付: 2026-09-09
- ブランチ: `claude/r10-wire`（`origin/integ-0905` の `b91a70a4` から）
- 元にした測定: `docs/reports/cost-2026-09-09.md`（`claude/r10-measure`）
- オーナー決定 2026-09-09「これもやって」

## 直す三つ（この順）

1. **返ってくる写しを止める**（−25%）── `netSlicePut()` の POST に
   `Prefer: return=minimal`。いまは `netSend1()` が `/rest/v1/` へのすべての
   POST/PATCH/DELETE に `return=representation` を付けており、保存のたびに
   上げた 872 KB がそのまま降りてくる。**slice の書きだけ**を外す。
3. **送る前の読みを無くす**（−26%）── `netSaveUpGo()` は送る前に
   `netSlices()` で**中身ごと**読んで突き合わせている（877 KB）。
   中身ではなく**印だけ**（`kind,no,at`）を読み、印が最後に合意したときから
   動いていない slice は中身を訊かない。
2. **起動の二度読み**（−8%）── `claude/r10-dl` が同じ二本を一本にしている。
   1・3 を push したあと `origin/integ-0905` を取り込んで、二度読みが
   残っているかを測ってから決める。残っていなければ触らない。

## 押さえる check

- `tools/measure-cost.mjs` ── 保存一回のバイト（2.6 MB → 0.9 MB 以下）と
  起動一回（1.9 MB）。赤を見てから緑にする。
- `tools/slow-check.mjs` ── バイトの上限を `allowed` と同じ形で一つ足す。
- `tools/again-check.mjs`・`tools/acct-check.mjs` ── 緑のまま。
  「二台で編集」「圏外のあと」が何を守っていたかを読んでから書き直す。

## 触ってよいファイル

```
www/net.js            netSlicePut / netSaveUp(Go) / netSend の周りだけ
tools/slow-check.mjs
tools/measure-cost.mjs
tools/again-check.mjs  tools/acct-check.mjs   守る claim の書き直しだけ
docs/CHANGELOG.md  docs/BACKLOG.md  docs/scope/r10-wire.md
```

**触らないもの**（他の枝の持ち物。見つけても直さず報告する）

```
www/index.html   www/core.js   supabase/schema.sql
www/net.js の netLangBack / netTakenDown / netTakeGone / netHist*
```

## npm test は回さない

上の四本だけを自分で回す。全体のゲートはリーダー。
