# r62-docs ── 書いてある事が今と違う（2026-09-23）

土台は `integ-0905`。持ち場は r46-audit § C と付録 1、そしてそれを覆う検査一本。

## 覆う一文と、それを持つ検査

**記録でない文書が呼び出しの形で書いた関数の名前は、コードにある。**
`tools/docs-check.mjs` の三つ目の向き（FAST・`npm run docs`・pre-commit に既に居る）。
数えるのは面 ── 生きた文書 27 本の呼び出し全部（1800）。消えた関数を語る文は
~~`name()`~~ と打ち消し、打ち消したのにコードに在れば赤。

赤は四通り見た: 打ち消しを外す／在る関数を打ち消す／`netLangsDown` を改名（25 件）／
baseline に在る関数の行。直す前の docs で 224 件赤。

## r46 の読みと違った所

- 付録 1 の 76 のうち `hasBytes`・`jsIn`・`measureRows` は tools/ の検査の中に在る。
  消えているのは 73。
- r46 のスクリプトは大文字を含む名前だけを見ていた。面を数え直すと、付録の外に
  `has_account()`・`keep()`・`best()`・`approx()`・`slice_back()` など、
  README の 21 名を含めて 100 名を超えた。

## 持ち物外で、baseline に積んだもの（66 行）

README.md（21 名 ── 別のアプリの説明のように古い）、docs/STATE.md、docs/TESTING.md、
docs/FEATURE_RULES.md の決定ログの中（本文には無い）。`tools/docs-baseline.txt`。

## コードのコメントで、持ち物外のもの

- `www/backup.js` 頭のコメント（r46 A4 の「script タグ三つ前」）── www は持っていない。
- `www/core.js:331` のコメントが消えた `netLangBack1()` を名指している。
  この検査は docs だけを見る。
