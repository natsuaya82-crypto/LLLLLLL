# r16-fix ── 起動と保存が移行のために書いていた。移行を「読むときに写す」形にする

- 日付: 2026-09-11
- ブランチ: `claude/r16-fix`
- 切った木: `origin/integ-0905` の `10c42e19`
  （`Merge remote-tracking branch 'origin/claude/r16-gram' into integ-0905`）
- 読んだもの: `CLAUDE.md`（規則 6・11・22、「Simple, and a bug is REWRITTEN, not
  patched」「A cause is FOUND, not guessed」）、`docs/scope/r16-gram.md`、
  `git show 9351fc3e`、`docs/CHANGELOG.md` 2026-09-11 の否定の項、
  `www/net.js` § netGotFor / netSaveUp

## 赤い二本

リーダーが `10c42e19` で `npm test` を回して 44 本中 2 本が赤。どちらも
`9351fc3e`（否定・疑問の書き直し）のあとに出たもので、**原因は一つ**です。

## 測った（読んだのではなく、実際に流した）

`www/` は一行も変えずに、走っているアプリの中で `slWr` `saveStg` `bkTouch`
`netSend` を包み、呼ばれた場所の stack を記録して流しました。

### 一. again-check ── 起動の道に phases の中身を読む GET が増えた

`langLoad()` を呼んだだけで、これが出ます:

```
slWr lingua.<id>.phases
  at saveStg     www/phases.js:238
  at gPolPut     www/grammar.js:1389
  at migrateNeg  www/grammar.js:1426
  at stRead      www/phases.js:84
  at Object.rd   www/core.js:212
  at langLoad    www/core.js:229
```

そのあと、溜め（`NET_UPMS`）が切れて:

```
GET /rest/v1/slice?select=kind,body,no,at&language=eq.<id>&kind=in.(words,…,phases)
  at netSlices   www/net.js:1692
  at netGotFor   www/net.js:2254
  at netSaveUpGo www/net.js:2445
```

`migrateNeg()` が `STG.gr` に規則を書き、`saveStg()` が `bkTouch()` を通って
`netSaveUp()` を起こします。`netSaveUpGo()` は動いた欄として `phases` を数え、
この端末は `phases` の印（`NET_AT`）を持っていないので `netGotFor()` の
`dunno` に入り、**中身ごと** GET されます。r10-wire（2026-09-09、「印を先に、
中身は動いた欄だけ」）に反しているのは、移行が起動で書いているからです。

### 二. keep-check ── 届かなかった保存が端末を動かした

`the profile: a save that did not land moved something on the phone`。
動いた鍵は `lingua.<id>.phases` の一つだけで、stack は:

```
slWr lingua.<id>.phases
  at saveStg     www/phases.js:238
  at gPolPut     www/grammar.js:1389
  at migrateNeg  www/grammar.js:1426
  at stRead      www/phases.js:84
  at Object.rd   www/core.js:212
  at langLoad    www/core.js:229
  at keepBack    www/shell.js:560
  at keepSave    www/shell.js:602
```

保存が落ちたので `keepBack()` が端末を元へ読み直す ── その `langLoad()` の中で
`stRead()` が `migrateNeg()` を呼び、**元へ戻すはずの読み直しが書いた**。
プロフィールだけが赤いのは、八画面のうち最初の一つで移行がまだ走っておらず、
そこで一度だけ印（`STG.grm`）が立つからです。

**一つの原因**: 移行が「起動と読み直しで走って書く一回きりのパス」だったこと。

## 直し方（後付けではなく書き直し）

`migrateNeg()` と `STG.grm` を消し、移行を**読むときに写す**形にします。

- 規則を答える一箇所（`gPolAll()`）が、`STG.gr` に `NEGATION`/`VERB` が無ければ
  `gpos.negp` と 「ない」の語から組み立てて返す。**起動では何も読まず何も書かない。**
- 人が保存した時に、通常の保存の道（`gPolPut()` ── 規則を書く唯一の場所）が
  組み立てた規則を `STG.gr` に写してから書く。だから**消した規則は戻らない**：
  空の二文で保存すると、写しが入ってから消えて、以後 `gpos` は答えない。
- `STG.gpos` は読むだけで残る（§16、`docs/DATA_SAFETY.md`）。
- `STG.grm` は要らなくなるので消す。

## 触るファイル

```
www/phases.js  www/grammar.js  www/grammar-engine/*.js
tools/gramlang-check.mjs  tools/again-check.mjs
docs/scope/r16-fix.md  docs/CHANGELOG.md
```

## 触らないもの

`www/net.js` `www/core.js` `www/index.html`。上に挙げていない `www/` のファイル。

## 走らせるもの

ゲート全体は回さない。`npm run again` `npm run keep` `npm run gramlang` と
速い九つ。バグを戻して赤を見る。

## 他の枝

`git fetch --all --prune` の後、`www/phases.js` `www/grammar.js`
`www/grammar-engine/` に触っている枝で `10c42e19` より新しいものは無い。
