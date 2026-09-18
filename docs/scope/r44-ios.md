# r44-ios ── フルアクセスを要求しない・縦のみ

ブランチ `claude/r44-ios`、根は `4734f868`（`integ-0905`、r41-review を取り込んだ所）。

オーナーの決めごと二つ（OWNER 2026-09-18）を入れるだけの枝です。どちらも
`docs/scope/r41-review.md` が「**このセッションでは直さない ── オーナーの
決めごと**」と書いて置いていったもので、その決めごとが来ました。

## 決定 1（OWNER 2026-09-18）「切っていい」── キーボードはフルアクセスを要求しない

`ios/App/LinguaKeyboard/Info.plist` の `RequestsOpenAccess` を `false` に。

拡張はフルアクセスの要る API を一つも使っていません。2026-09-02 の CHANGELOG が
grep してそう書いていて、この枝でもう一度 grep しました（報告に貼ります）。

2026-09-02 に `true` のまま残した理由は二つありました。②「`www/` の
オンボーディングが『フルアクセスを許可』を手順に持っており（`kb.step4`）、
`www/` は別のセッションのものです」── その ② を消します。手順 4 を**手順ごと**
消し、`kb.step4` を十言語から消し、写真 `www/img/kb-full.jpg` とその項も消します。
①（Linux に Swift が無い）は消えません ── **DEVICE UNCONFIRMED** のままです。

## 決定 2（OWNER 2026-09-18）「縦のみ」

`ios/App/App/Info.plist` の `UISupportedInterfaceOrientations` と
`UISupportedInterfaceOrientations~ipad` の両方を
`UIInterfaceOrientationPortrait` だけに。

`r41-review.md` § 4.0-b が押して測っています ── 844×390 で中身は 480 の柱の
まま崩れませんが、プラン画面は下タブの帯が段の中身に重なります。

## 触るもの

| file | 何を |
|---|---|
| `ios/App/LinguaKeyboard/Info.plist` | `RequestsOpenAccess` を `false` |
| `ios/App/App/Info.plist` | 向きを縦だけに（`~ipad` も） |
| `www/keyboard.js` | 手順 4 と `KB_SHOTS` の `kb-full.jpg` の項だけ |
| `www/i18n/*.js`（十本） | `kb.step4` の**行だけ** |
| `www/img/kb-full.jpg` | 消す |
| `docs/CHANGELOG.md` | 二件（先に書く） |
| `docs/FEATURE_RULES.md` | 決定ログに二行 |
| `docs/CHECK-0907.md` | ビルド 162 の節に二行 |
| `docs/keyboard-extension.md`・`docs/keyboard.md` | 「フルアクセス」の古い文を書き換える |
| `docs/scope/r44-ios.md` | これ |

## 触らないもの

`www/index.html`・`www/settings.js`・`www/onboard.js`。
`ios/App/App.xcodeproj/project.pbxproj`（file を足していないので）。
`www/i18n/*.js` の `kb.step4` 以外の行 ── 別のセッションが同じ十 file の
`plan.price.free` を触っています。

## 回すもの

`npm run assets`、`npm run i18n`、`npm run es5`、`npm run dead`、`npm run act`。
**ゲート（`npm test`）は回しません**（`docs/SESSIONS.md`）。

赤を見る所：手順を消す前に `kb-full.jpg` だけ先に消して `assets` が赤になるのを
見ます ── 「参照の無い画像／無い画像への参照」が片方だけでは落ちる、を確かめる
ため。

## commit は種類ごとに分ける

CHANGELOG が先。決定 1 と決定 2 は別の commit。docs の書き換えも別。
