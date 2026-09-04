# claude/kbfree3 ── ポップの文と、隠すルールの洗い出し

`claude/kbfree2` の続きです。**枠と＋と編集ボタンは前のセッションが済ませ、
`master` に入っています。**やり直しません。

## 触ってよいと理解したもの

```
www/keyboard.js  tools/kb-check.mjs  tools/fixture.mjs
docs/keyboard.md  docs/CHANGELOG.md  docs/scope/claude-kbfree3.md
```

## 触らないもの

`www/index.html` `www/shell.js` `www/act-map.js` `www/i18n/`（claude/pop2）、
`www/net.js` `www/post.js` `www/rec.js` `www/card.js`（claude/post3）、
`www/core.js` `www/letters.js` `www/backup.js` `www/sync.js` `www/phases.js`
（claude/keep3）、`www/sns.js`（claude/find3）、
`docs/FEATURE_RULES.md` `docs/STATE.md` `CLAUDE.md`（リーダー）。

`master` を自分に取り込むのは可。**他の枝は merge / rebase / cherry-pick
しません。**ゲートは回しません ── `npm run kb` だけ。

## 仕事一 ── ポップの文

**押して確かめました。**空の `localStorage` から起動し、`SET.plan='free'`、
`SET.ui='ja'` で `go('kb')`、右下の `.fab` を実際にクリックした結果:

```
キーボード1 | キーに文字を表示 | 1 | Pro なら無制限です。 | アップグレード | 閉じる
```

出ている文は **`up.need`** です。道は
`kbCapStop()`（`www/keyboard.js:107`）→ `upStop(can('kb'))` →
`upStop()`（`www/core.js:1458`）→ `popAsk(t('up.need'), …)`。

**`www/keyboard.js` に直す所はありません。**文は
`www/i18n/{en,es,pt,fr,de,it,ru,zh,ko,ja}.js` の `up.need` 一つで、
そこは **claude/pop2 の持ち場**です。**触っていません。**

`up.need` は `upStop()` 一箇所からしか出ないので、**十言語のその一行を
書き換えれば `upStop()` を通る上限のポップは全部変わります。**

## 仕事二 ── 隠すルールの洗い出し

`www/keyboard.js` の `can()` を全部あたりました（六箇所）。

| 行 | 何 | 判定 |
|---|---|---|
| 977 `kbBoards()` | 無料は `[kbFree()]` 一枚だけ答える | **良い。**持っていない物は並ばない |
| 1003 `kbOf()` / 1011 `kbBoard()` | どのキーボードが phone に乗るか | 画面の話ではない |
| 2367 `kbRowHTML()` | 無料の行は矢印も編集も無い `<div>` | **良い。**前のセッションが済ませた |
| 2489 `vKb()` の bar | 無料は 選択 ではなく `?` | **良い。**選ぶ物が無いので |
| 3470 `kbSysHTML()` の ? シートの足 | **下に書きます** | **報告のみ** |

**空の枠・灰色の行・ぶら下がったボタンは、一覧には残っていません。**

### 一つだけ、決定が二つ食い違っている所 ── 直していません

`www/keyboard.js:3470`、**? の中**（画面の上ではありません）。無料だと足に
三つ出ます ── `kb.free.no`（無料は編集できません）、`kb.free.up`
（作りたければアップグレードを）、そして **プランへ行くボタン**。

- 2026-08-28 OWNER が**その三行を名指しで頼んでいます**。
- 2026-09-01 OWNER がその三行は**足に置く**と決めています。
- 2026-09-04 OWNER 「課金からフリーの隠すルールも全部に適応ささてね」。

**CLAUDE.md はこの形を「止まれ」と書いています** ── 書かれた決定が二つ
食い違っていて、**どちらもオーナーが言い直していない**とき。9/4 の言葉は
一覧の枠と編集ボタンについてで、? の中の三行を指してはいません。
**リーダーへ回します。**

なお ? の中は `CLAUDE.md` § Explaining が説明を許している唯一の場所です。

## 持ち場の外に見つけたもの ── 直していません

1. **`www/settings.js:354`（データの部屋）。**無料だと CSV の行の代わりに
   `class="lock"` の行が出ます ── ⊕ の印、見出し、**説明の一行**、そして
   右端に `PLUS` の札。押すとプランへ。**これが「灰色の行」そのものです。**
   同じ部屋は `setSummary()`（`www/settings.js:179`）で、設定の一覧の扉にも
   **`Free`** と値を出しています。
2. **`www/import.js:488` と `www/sheet.js:1299`。**ファイルを読むボタンが、
   無料でも同じ場所に出ます ── ただし中身が
   `<span class="capgo">アップグレード →</span>` に化けていて、押すと
   **プランの画面へ移動します**（ポップではありません）。
   2026-09-04「全部1枚目みたいにポップ出して背景変えずに」に当たります。
3. **`www/wsys.js:109`。**`if(!can('wsys') && k!=='alpha'){ goPlans(); return; }`
   ── ここも**ポップではなく画面ごとプランへ**移ります。
4. **`www/phases.js:250` `stHidden()`。**文法の一覧の足に「隠れている段が
   いくつか」を数で出します。**数は説明ではない**ので規則には当たっていない
   と読みました。同じ形が辞書と文字にもあります。**判断はリーダーへ。**

`class="lock"` と `PLUS` の札は、`www/` 全体で **`settings.js` の一箇所だけ**
です（grep 済み）。

## 走らせたもの

`npm run kb` のみ。**ゲートは回していません。**
