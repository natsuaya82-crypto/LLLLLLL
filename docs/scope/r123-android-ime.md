# r123-android-ime — Lingua キーボードの Android 版（IME）

OWNER 2026-09-27「Android版作りたいから移行できるもの全部移行しつつ、作り直しで
必要なところはルールに則って作って欲しい。」

## やること（最初のコミット d1826942 の Scope）

1. `ios/App/LinguaKeyboard/` の Android 版を InputMethodService で作る。
2. `LinguaShare.write`（Android）が iOS の App Group と同じ形の三つのファイルを
   IME が読める所に書く。
3. 行は `KeyBoardView.swift` と同じ数（横十・行の高さ 短辺×0.1385・上限 画面の
   半分・`halfCols` = `KB_COLS`・短い行は `kbStart()`）、描いた字は iOS と同じ
   私用領域の文字。
4. `Compose.swift` / `CandidateBar.swift` の変換・候補。
5. AndroidManifest に IME のサービスと `method.xml`。
6. `kb-check` が Kotlin の数も読む。
7. `docs/ANDROID.md` § キーボード と `docs/CHANGELOG.md`。

Owns: `android/app/**`（IME のファイル、manifest の IME の項、
`LinguaSharePlugin.kt` の write だけ）、`docs/ANDROID.md` § キーボード、
`docs/CHANGELOG.md`、`tools/kb-check.mjs`（Kotlin の数を読む所だけ）、この
ファイル。`www/`・`ios/`・`supabase/` は触っていない。

## 報告

### やった

- 1〜5: `android/app/src/main/java/com/tokinets/lingua/keyboard/` の七つ
  （`LinguaIme` と、Swift と同じ名前の六つ）、manifest、`res/xml/method.xml`、
  `build.gradle` が `hand.js` を assets に写す（e90e12bc）。
  `LinguaShare.write` が三つを書き、空は消す（34cfa1a8）。
- 6: `kb-check` が `LinguaIme.kt`・`KeyBoardView.kt` の数を読み、Swift と
  `www/keyboard.js` に突き合わせる（6f06b7ce）。赤は前の回に見た
  （`rowPerWidth` 0.14・`halfCols` 22 で 2 件）。`origin/integ-0905`（r121 課金・
  r122 サインイン）を取り込んだ後に `kb-check` を一回走らせて緑。
- 7: `docs/ANDROID.md` を今の文に ── write の行（「無いと答える」を消した）、
  「キーボードは次の回」を消した、§ キーボード を足した、端末で見るものに
  キーボードを足した。CHANGELOG の 2026-09-27 の項は取り込みの衝突を両方残して
  解いた。

**CODE CONFIRMED** のみ。Kotlin のコンパイルは前の回に android-all を相手に通した
もので、この回はしていない。ゲートは回していない（リーダーが回す）。

### やれなかった

- gradle のビルド（Android SDK がこの環境に無い）。最初の確かめは CI。
- 端末では何も見ていない。**DEVICE CONFIRMED は無い**。見るものは
  `docs/ANDROID.md` § 端末で見ていないこと。
- ウィジェット（範囲の外。`widget.json` は書いているが読む物が無い）。

### オーナーが要る操作

- Android の実機で: 設定 → キーボードで「Lingua」をオンにして選び、
  `docs/ANDROID.md` § 端末で見ていないこと のキーボードの行を見る。
- ビルドはリーダーが出す（頼まれるまで出さない）。
