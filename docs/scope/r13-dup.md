# claude/r13-dup ── 直書きを一箇所に寄せる（DUPLICATES.md 8 9 10 12 15 18）

`integ-0905` から切りました。オーナー 2026-09-10「直書きは今直して」。
番号は `docs/DUPLICATES.md` のもので、動かしません。

## 触ってよいと理解したもの

```
www/act-map.js  www/home.js  www/import.js  www/index.html  www/keyboard.js
www/me.js       www/mod.js   www/notes.js   www/phases.js   www/post.js
www/settings.js www/sheet.js www/shell.js   www/sns.js      www/sound.js
www/words.js    www/wordsheet.js  www/wsys.js
tools/kb-check.mjs
docs/DUPLICATES.md  docs/CHANGELOG.md  docs/scope/r13-dup.md
```

`www/index.html` は 10番 の一件だけ ── `.mnone` の CSS 二行を消すため。
`tools/kb-check.mjs` は 8番 の巻き添えです（下に理由）。

## 触らないもの

**`www/net.js`** ── `claude/r12-oneid` が書き直し中。**14番 と 17番 は
そこが取り込まれてリーダーから「入ってよい」が届くまで手を付けません。**
届かないままなら、そこまでで報告して待ちます。

**`www/card.js`** ── 19番。直しません。読んで一行報告するだけです。

`www/core.js` `www/net.js` `www/card.js` `www/i18n/` `CLAUDE.md`
`docs/STATE.md` `docs/FEATURE_RULES.md`。

`master` / `integ-0905` を自分に取り込むのは可。**他の枝は merge / rebase /
cherry-pick しません。**ゲート（`npm test`）は回しません ── リーダーが回します。
回すのは、その直しを押さえる一つ（`npm run press` `npm run act` `npm run i18n`
`npm run kb` `npm run post` `npm run page`）と、速い九つだけ。

## 番号ごとの「一箇所」の名前

| 番号 | 一箇所になる名前 | どこに置くか | 消える直書き |
|---|---|---|---|
| 8 | `go('plans')`（新しい名前は作らない） | ── | `goPlans()`（`www/wordsheet.js`）と `act-map` の行、`DO('goPlans')` 五箇所 |
| 9 | `capWarnHTML(text)` | `www/shell.js` | `www/words.js` `www/phases.js` `www/sound.js` `www/home.js` の四箇所 |
| 10 | `emptyBox(text, sub, more, bad)` | `www/shell.js`（既にある。引数を足す） | `www/sns.js` 三つ、`www/me.js`、`www/notes.js`、`www/mod.js` の `.mnone` 全部 |
| 12 | `modListHTML(rows)` | `www/mod.js` | `vMod()` と `vAdmin()` の四行、二回 |
| 15 | `postShrink(url, cap, ok)` | `www/post.js` | `postThumb` と `pwPicKeep` の中の縮める計算 |
| 18 | `fileInHTML(cls, inner, id, accept)` | `www/shell.js` | `impFileHTML()`（`www/import.js`）と `shInFileHTML()`（`www/sheet.js`）── 両方とも消して、呼び側が直に呼ぶ |

**後付けはしません。**寄せたら元の直書きは消します。残しません。

## 指示に無かったが 8番 に要るもの二つ ── 報告に書きます

1. **`www/settings.js` と `www/words.js` にも `DO('goPlans')` があります。**
   指示の一覧（`keyboard.js` `phases.js` `sound.js` `wsys.js`）に無い二箇所
   です。一つでも残すと `act-check` が「函数の無い名前」で赤くなるので、
   五箇所すべて `DO('go', ["plans"])` にします。`www/wsys.js` は注記だけで、
   コードはありません。

2. **`tools/kb-check.mjs` が `'goPlans'` という文字列を三箇所で読んでいます。**
   `out.freeNoUpsell = vKb().indexOf('goPlans') < 0` は、名前を消した瞬間
   **バグを戻しても緑のまま**になります ── CLAUDE.md「a check that
   recomputes the thing under test is a copy of it」と同じ形の嘘です。
   主張（「無料のキーボード画面の足にアップグレードは立っていない」）が
   そのまま残るように書き換え、**赤くなるのを見てから**直します。

## 一つの番号は一つの commit

`docs/DUPLICATES.md` の頭を「閉じた」に直し、訊き直す一行を書くのは、
**その番号と同じ commit** です。

## 見た目が変わるもの ── スクショ前後を報告に付けます

- **9番**: `capBanner()`（目次）に余白が付き、他の三つと揃います。四画面。
- **10番**: 通報の画面（`mod` / `admin`）の空表示が `.mnone` から `.empty` へ。
  文字が大きく（1.3rem・見出しの書体）中央、余白 24px → 54px。
  赤い方（エラー）は `.empty bad` ── `.bad` は `www/index.html` に既にある
  ので、CSS は足しません。**消すだけです。**
