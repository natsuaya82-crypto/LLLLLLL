# claude/r21-hunt ── アプリを人として歩いてバグを洗い出す

### Scope

- **Goal**: アプリを人が普通に使う通りに headless で動かし、**出るバグを
  洗いざらい見つける。直さない。** オーナーの言葉：「そもそもバグが出てるのに
  気づかないやん。通常通りに使って出るようなバグを洗いざらい出して欲しい」
  「例えば二つのデータが出るみたいな想定外のバグ」。
- **Owns (may change)**:
  - `tools/hunt.mjs`（新規。歩く script。**gate には入れない**）
  - `shots/hunt/`（一歩ごとの写真）
  - `docs/reports/hunt-2026-09-11.md`（報告）
  - `docs/scope/r21-hunt.md`（これ）
- **Does NOT own**: それ以外すべて。とくに **`www/` は一行も触らない**。
  `package.json`、`tools/gate.mjs`、他の `tools/*-check.mjs` も触らない。
- **Decision it implements**: 決定の実装ではない。**観測**。直すのは別の枝。
- **Check to run**: なし。ゲートも個別の検査も回さない。ビルドも出さない。

### やり方

`tools/browser.mjs` の `loadChromium()`、`tools/fixture.mjs` の `seed`、
`tools/measure-cost.mjs` の「憶える偽サーバー」を元に、**状態を持つ偽サーバー
一つに、二つの browser context（＝二台の端末）と二つのアカウント**を繋げる。
一歩ごとに `shots/hunt/NN-<what>.png` を撮り、**自分で読んで目で見る。**

### 対象外（明記）

- 実機でしか出ないもの ── **iOS キーボード拡張**（`ios/App/LinguaKeyboard/`）、
  **Apple の購入画面**（StoreKit）。headless では押せない。
- 本物の Supabase。偽サーバーの上を歩くので、サーバー側の RLS の穴は
  この枝では見つからない（`npm run rls` の領分）。

### 出すもの

`docs/reports/hunt-2026-09-11.md`。一件ずつ：番号・道（何を押したか）・
画面に出たもの（写真の file 名）・期待していたもの・重さ（壊れる／おかしい／
気になる）。**原因の推測は書かない**（書くときは「未確認」と明記）。
正常だった道も一行で「正常」と書く（歩いた証拠）。
