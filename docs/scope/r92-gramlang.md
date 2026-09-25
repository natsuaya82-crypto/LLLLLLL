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
