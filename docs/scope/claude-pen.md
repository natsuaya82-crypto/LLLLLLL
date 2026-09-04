# claude/pen ── 二つだけ。一筆の 160 点と、頼まれていない語順の既定値

`master`（`4ecd823d`）から出ています。**他の枝は merge も rebase も
cherry-pick もしません。**`master` を自分に取り込むのだけはします。

## 私が触ってよいと理解したもの

```
www/glyph.js
www/phases.js
www/core.js
www/letters.js
tools/fill-check.mjs
tools/round-check.mjs
tools/migrate-check.mjs
docs/EXPIRY.md
docs/CHANGELOG.md
```

そして `shots/` に入る画像（gitignore なので `git add -f`）と、この一枚。

## 触らないもの

- `www/settings.js` `www/import.js` `www/sheet.js` `www/index.html`
  `www/i18n/` ── **claude/lock**
- `www/sns.js` ── **claude/find3**
- `docs/FEATURE_RULES.md` `docs/STATE.md` `CLAUDE.md` ── **リーダーのもの**
- `www/grammar.js` `tools/gramlang-check.mjs` ── 領地の外です。**仕事 二 が
  ここに当たるかどうかは下に書きます。**

## 仕事 一 ── 一筆の 160 点を外す

`docs/EXPIRY.md` 7番。`www/glyph.js:95` の `GE_MAXPTS=160`、使う所は
`geMove()` 一箇所。一本の線が 160 点を超えると、そこから先の点は捨てられ、
最後の一点が引きずられるだけになります。**この数は誰も決めていません** ──
コメント自身が「実際のどの線よりも高い数」と言っています
（OWNER 2026-09-04「160で止めないで」）。

外したあと、点が増えて重くならないか・フォントを組むときに困らないかを
確かめます。**困るなら直さずに一行で報告します。**

## 仕事 二 ── 頼まれていない語順の既定値を書き込まない

`docs/EXPIRY.md` 4番の隣。`www/phases.js` の `migrateGramLang()` が、
語順を一度も触っていない人の `SET.order` を各言語へ写しています。
**`setDefaults()` が `order:'SOV'` を入れるので、誰も触っていない iPhone でも
必ず `'SOV'` が写ります。**これがアプリの書き込む既定値です
（OWNER 2026-09-04「普通にアプリが入れる仕様なんて誰も頼んでないけど」）。

**発音の推測には触りません。**あれはオーナーが頼んでいます
（同日「推測も含めて入れるでしょ」）。取り消されていません。

**先に `tools/migrate-check.mjs` に項目を足し、いまの姿で赤を見てから直します。**
数は assert しません ──「これが、この順で、この一覧に入っている（もっと長くても
よい）」の形で書きます。

## いま分かっている判断どころ（リーダーへ）

`migrateGramLang()` を弱める読みが二つあります。

1. **アプリが入れた既定値だけ写さない。**`SET.order` が `'SOV'`（`setDefaults()`
   の値）のときは写さず、その人が選んだ他の五つは今までどおり写す。
   **画面は一つも動きません** ── `orderDef()` が空のとき `'SOV'` を返すからです。
2. **その言語が語順を触っていなければ写さない**（`set.order` の印で判断）。
   こちらは **OWNER 2026-08-25「言語ごとですよ？」** ──「いま在る一つの値を、
   その人が既に持っている全部の言語へ」── を覆します。`OSV` を選んでいた人の
   二つ目の言語が `SOV` に見えるようになる、つまり**人の画面が動きます。**

**1 で進めます。**2 は書かれた決定を覆すので、私のものではありません。
