# r40-siwa ── Sign in with Apple が渡した名前を、名前欄に入れて出す

ブランチ `claude/r40-siwa`（`integ-0905` = `11480dd5` から）。
**取り込むのはサブリーダー／リーダー。全ゲート（`npm test`）は回しません。**

## なぜ

Apple の審査（ビルド 161、2026-09-18、Guideline 4）:

> Sign in with Apple のあとに、名前かメールを入力させている。
> Authentication Services が既に渡している。

## オーナーの決定（2026-09-18、形 A）

**Apple／Google がくれた名前を「名前と @」の顔の名前欄に入れた状態で出す**
（人は直せる）。**@ は今までどおり打つ** ── Apple は持っていないので。
**名前が来なかった時は今どおり空欄**（Apple は初回の認可でしか名前を返さない）。
**メールは何にも使わない**（Apple の relay があるので）。

**一つの仕組み**：`obSocial()` が plugin の `profile` を `obIn()` へ渡し、
`obIn()` の「行が無い」枝がそれを `OBM.nm` に入れる。二つ目の道は作らない。

## 触る file（宣言）

| file | 何を |
|---|---|
| `www/onboard.js` | `obSocial()` が profile を渡す、`obIn(prof)` の「行が無い」枝、名前を組む一箇所 |
| `www/i18n/*.js` | 要れば（新しい文字列は今のところ無い見込み） |
| `tools/acct-check.mjs` | claim 一本（赤を見てから直す） |
| `tools/fixture.mjs` | 「名前と @」の顔をもう一つ（名前が入っている側） |
| `docs/CHANGELOG.md` | コードより先に |
| `docs/scope/r40-siwa.md` | これ |
| `shots/` | 「名前と @」の二枚（入っている／空） |

**触らない**：`www/index.html`、`www/net.js`、`supabase/schema.sql`、
`docs/STATE.md`（リーダーのもの）、他のどの file も。

## 貯まる物

**増えません。**名前は今までどおり `netMakeProfile(h, nm)` で上がります。
`localStorage` の鍵は一つも増えません。

## 報告

下に追記します（赤を見た出力、回した check、撮った写真）。
