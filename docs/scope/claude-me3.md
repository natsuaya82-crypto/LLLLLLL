# Scope: claude/me3 ── 画像の「ファイル」を消す、@ は14日に一度

- 日付: 2026-09-03
- 枝: `claude/me3`
- 基準にした木: `master` の `9bbd83d`（`e1ed10c` の一つ先。取り込み済み）

## Goal

オーナー報告二件。

1. **プロフィールの画像を触ると iOS の「ファイル」が出る。**写真だけ出したい。
2. **@ は14日に一度しか変えられない**（`docs/FEATURE_RULES.md`、master `e1ed10c`）。

## Owns (may change)

- `www/me.js` ── 1 の全部。2 の画面の側
- `supabase/schema.sql` ── **`profile` の列と `profile_rename()` の周りだけ。**
  `claude/find` が同じファイルを持っている（検索履歴の表）ので、それ以外の行は
  一行も触らない
- `tools/rls-check.mjs` ── 2 の検査。リーダーが名指しで足せと言った
- `docs/CHANGELOG.md`、`docs/DATA_MODEL.md`、このファイル

## Does NOT own

それ以外すべて。名前で書いておくべきもの:

- `www/net.js` ── **2 の画面の側が、ここに突き当たります**（下の「見つけたこと」）
- `www/i18n/*.js` ── 画面に文を出すなら鍵が要りますが、10ファイルとも私のものでは
  ありません
- `www/shell.js`、`www/index.html`、`www/keyboard.js`

## Decision it implements

- `docs/FEATURE_RULES.md`「@ は14日に一度しか変えられない」（2026-09-03）
- 画像のほうは決定ログではなくオーナー報告。「後プロフィールファイルから選択
  なくして欲しい」「画像ね」

## Check to run

- `npm run rls` ── 2 の本体。足すのは四つ:
  14日以内の二度目が断られる / 15日目に通る / 一度も変えていない人の一度目が
  通る / lingua への・からの改名が今も断られる
- `npm run press` ── 1 で `<label>` が `<button>` になるので、押される数が一つ増える
- 速い九本（`es5` `dead` `act` `round` ほか）は作業中に回す
- **ゲート28本は回しません。**リーダーが取り込んでから一度だけ

## 見つけたこと ── **2 の画面の側は、この枝の中では作れません**

コードを読んで分かったことで、指示より後の事実です。**手が動く分は動かして、
ここに書きます。**

**アプリは @ の変更をサーバーに一度も送っていません。**

```
www/net.js  netMakeProfile()   POST /rest/v1/profile   アカウントを作る時の一度だけ
                               呼ぶのは obWhoGo() 一箇所（www/onboard.js:1326）
www/net.js  netBioSync()       PATCH  bio だけ
www/net.js  netAvSync()        PATCH  av だけ
```

`/rest/v1/profile` への PATCH はこの二本しかありません。`meSetHandle()`
（`www/me.js:360`）が書くのは `localStorage` の `ME.handle` だけです。

だから今日の姿は:

- **サーバーで止めるのは正しく、必要です。**`/rest/v1/profile` を直に叩く道は
  開いているので、そこは私が塞ぎます。
- **画面の側は、止まる理由を知る手段がありません。**`handle_at` を端末に持って
  くるには `www/net.js` が要ります（`netMyProfile()` の select は
  `handle,display,bio` の三つだけ）。**サーバーへの読み書きは net.js 一箇所、
  というのがこのリポジトリの形**なので、`me.js` から生の `netGet` を呼ぶのは
  「回り道」「写し」に当たります。
- ついでに見えたもの、**これは別の不具合です**: `obIn()`（`www/onboard.js:841`）
  がサインインのたびにサーバーの handle で `ME.handle` を上書きします。
  つまりプロフィール画面で @ を変えても、**次にサインインした時に戻ります。**
  画面は変わったように見えて、アカウントには届いていません。

**私の判断:** サーバーは完成させ、画面の @ の錠は入れません。入れても
`handle_at` が常に空なので一度も掛かりません。**リーダーに戻します** ──
`www/net.js` の担当と、下の保存ボタンの担当と、一つの仕事です。

そして `9bbd83d` の決定「保存していないまま画面を出ようとしたら、この app の
ポップで訊く」が、まさにその配線を **「三つが戻ってから一つの担当でまとめて
入れる」** と書いています。@ をサーバーに送る区切りは、その保存ボタンです。
**先回りして半分だけ配線しません。**

## 触らないと決めたこと

- `meSetHandle()` に PATCH を足さない ── 保存の区切りは保存ボタンの決定のもの
- `mePicFile()` と `<input type="file">` を消さない ── ネイティブの無いブラウザ
  （検査）の道
- `profile_rename()` の lingua の守りを弱めない。二つ目のトリガーを作らない
