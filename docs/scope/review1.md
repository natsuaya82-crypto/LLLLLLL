# claude/review1 ── リリース直前の五つ（審査対応）

枝は `claude/review1`、`origin/master`（`e5a10cc`）から。
OWNER 2026-09-02 が決めた五つ。どれも小さく、判断は要らない。

## 触るもの ── これだけ

```
  www/i18n/*.js ×10                        (b)(c)(d) の文言と (a) の鍵
  www/onboard.js                           (b) 登録画面の一行
  www/net.js                               (a) netWhy() の一行だけ
  ios/App/App.xcodeproj/project.pbxproj    (e) TARGETED_DEVICE_FAMILY ×6
  docs/CHANGELOG.md                        記録
  tools/open-check.mjs                     (b) の主張を 2b に足す
```

## 触らないもの

`www/index.html` は要らない。`www/settings.js` と `www/store.js` は読むだけ ──
`docRows()` を呼ぶ側になる。`www/core.js` `www/boot.js` は `claude/lapse` の
もの。他の枝を merge / rebase / cherry-pick しない。

## 五つ

- **(a)** `netWhy()` が 401 と 403 を両方 `net.badlogin`「アドレスかパスワードが
  違います」に訳す。何も打っていない人に打ち間違いだと言う形。鍵を足して分ける。
  OWNER 2026-09-02「それ入れよう」。403 は権限で、セッションの話ではないので
  そこも見る。
- **(b)** 登録の面に規約とプライバシーの一行【審査 1.2】。画面の一番下に小さく、
  続けると同意したことになる、の意味。二語がリンク。チェックボックスは無し。
  OWNER 2026-09-02「続けるとの説明は ok」。2026-09-01 の決定（設定に置く）は
  取り消さない ── 登録画面に足すだけ。`docRows()`（`www/settings.js`）を使う。
- **(c)** `set.wipe` の行に「アカウント」の語【審査 5.1.1(v)】。**名前だけ。**
  消えるものは変えない。OWNER 2026-09-02「データはアカウントごと消えますよ」。
- **(d)** `confirm.wipe` に一文【審査 5.1.1(v)】。オーナーの文面そのまま ──
  サブスクリプションを解除してからアカウントを削除してください。十言語に。
- **(e)** `TARGETED_DEVICE_FAMILY` を `"1,2"` → `"1"`、六つの config 全部。
  OWNER 2026-09-02「今は iPhone。その後 iPad、Android をつくる」。

一コミット一種類 ── 五つのコミット。ゲートは回さない（速い九本と `act` `i18n`
だけ）。判断が要ることが出たら決めずにリーダーへ戻す。

## リーダーへ ── 一つだけ先に言っておく

`docs/STATE.md` § 0 の 2026-08-28 の行に「オンボーディングはオーナーが直して
いるから誰も触らないこと」がある。(b) は `www/onboard.js` で、リーダーが今日
名指しで渡したもの。**新しい方（今日の territory）で進める** ── 止まる場合では
ないと読んだが、間違っていたら戻してほしい。
