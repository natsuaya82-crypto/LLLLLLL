# リーダーへ ── `www/index.html` に一行。上の題目が動く件（測定つき）

> 「画面の上の題目がガタガタ動くのを止めろ。」 **OWNER 2026-08-27**

`www/index.html` は触っていません。写しに当てて測りました。

---

## まず、リーダーの読みは外れています

指示は「前に渡した『帯が跳ねる』と**同じ原因のはず** ── `vvFit()` が
`--vvtop` を書き直し…」でした。**違います。逆です。**

```
grep -n vvtop www/index.html
  973:  （コメント）
  983:  .view.fit{ ... top:var(--vvtop,0px); ... }
```

**`--vvtop` を読んでいる規則は一つだけで、それは作文画面です。**
上の題目は `.navtop` で、**`--vvtop` を読んでいません:**

```
.navtop{position:sticky;top:0; ...}          454行
```

`vvFit()` が `--vvtop` を何度書こうと、題目には一文字も届いていません。
**動く理由は「書きすぎ」ではなく「当たっていない」です。**

## 測ったもの（390×844、`words` の画面）

```
.navtop の position / top      sticky / 0px

いま        --vvtop 0px → 題目の上端 0
            --vvtop 40px → 題目の上端 0     ← 動かない＝補正していない

一行入れると --vvtop 0px → 題目の上端 0
            --vvtop 40px → 題目の上端 40    ← 補正する
```

## 入れてほしいもの（454行、`top:0` を差し替えるだけ）

```css
/* いま */
.navtop{position:sticky;top:0;z-index:30;background:var(--bg);display:flex;align-items:baseline;
/* して欲しい */
.navtop{position:sticky;top:var(--vvtop,0px);z-index:30;background:var(--bg);display:flex;align-items:baseline;
```

**新しいセレクタも新しい変数も足しません。** `--vvtop` は `.view.fit` が
既に読んでいるもので、`vvFit()` が既に書いています。**キーボードが無い間は
`--vvtop` は 0 なので、今あるものは 1px も動きません**（上の表の一行目）。

`.view.fit` が `top:var(--vvtop)` である理由（973行のコメント）が、そのまま
`.navtop` の理由です ── iOS は打っている欄を出すためにページのほうを持ち上げ、
`sticky` はページの上端に貼りつくので、持ち上がった分だけ画面の外へ出ます。

## 当たる画面 ── 数えました

```
route が 38、うち .navtop を持つのが 37（持たないのは onboarding の 1 枚）
そのうち、その画面自身が入力欄を持つのが     6
  explore  find  ltset  spell  words  admin
同じ .navtop の下で開く form で入力欄を持つのが 19
  help pick snd sndadd own note add fmr edit word kbpat kbkey kbslot
  csv card post marks me wrout
```

**キーボードが上がる場所は 25。** そのすべてが補正されていない題目の下です。
「全部そうだけど」というオーナーの言い方と合います。

## 実機でないと分からないこと

**揺れそのものは再現できません。** headless Chromium にソフトキーボードは
無いので、iOS が `offsetTop` を何度動かすかは測れません。**証明できたのは
二つだけです:**

1. **`--vvtop` は題目に当たっていない**（`grep` と computed style）
2. **この一行で当たるようになる**（0→40 が 0→40 になる）

**「これで揺れが止まる」は測っていません。** 原因の読みとしては、
`.view.fit` が同じ理由で同じ補正を既に持っていること、そして
`docs/CHANGELOG.md` に「上のポストと戻るボタンは画面上部に固定で動かない」で
作文画面だけ直した記録があることが根拠です ── **作文画面だけ直して、
他の 37 枚に同じことをしなかった、というのが今の姿です。**

## 判断をお願いしたいこと

**`.tabbar` `.fab` `.toast` `.sheet` `.barfix` も `position:fixed` で、
どれも `--vvtop` を読んでいません。** 下にあるものはキーボードで隠れるので
見えず、今回の苦情には出ていません。**同じ扱いにするかどうかは、実機で
見てから決めることだと思います。** ここでは題目の一行だけ出しています。
