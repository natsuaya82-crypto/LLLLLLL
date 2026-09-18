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

---

# 報告 ── 2026-09-18

commit 六本、種類ごと。`docs/CHANGELOG.md` が先。

| | |
|---|---|
| scope 宣言 | `d010d1e5` |
| CHANGELOG（二件） | `285d5461` |
| 決定 1 フルアクセス | `e8620f05` |
| 決定 2 縦のみ | `67a2b621` |
| docs | `133b1a1a` |

## 決定 1 ── キーボードはフルアクセスを要求しない

`ios/App/LinguaKeyboard/Info.plist` `RequestsOpenAccess` → `false`。

**この枝でもう一度 grep しました**（`ios/App/LinguaKeyboard/` 六本の Swift）：

```
UserDefaults       0
URLSession         0
UIPasteboard       0
openURL            0
NSExtensionContext 0
App Group への書き込み（.write( / createFile / FileManager.default.create|remove|copy|move）  0
import             Foundation / UIKit / CoreGraphics ── 三つだけ
```

2026-09-02 の CHANGELOG と同じ答えです。

`www/` 側：`www/keyboard.js` の `kbStepHTML(4, t('kb.step4'), kbShot('kb-full.jpg'))`
を**手順ごと**削除、`KB_SHOTS` の `'kb-full.jpg'` の項とその上のコメントを削除、
`www/img/kb-full.jpg` を削除、十言語から `kb.step4` の**行だけ**を削除
（十 file × 一行、計 10 行。他の行は一つも触っていません）。**番号は詰めて
いません** ── 1・2・3 がそのままで、4 が無くなるだけです。`HELP.kb` の上の
「The four steps」というコメントも「three」に直し、四番目がいつ何故消えたかを
そこに書きました（古い文は残していません）。

**写真**（`node tools/shot.mjs --lang ja hd@195`）：

| | |
|---|---|
| `shots/r44-kb-help-ja-before.png` | 変更前 ── 四段、手順 4 に「Allow Full Access」の写真 |
| `shots/r44-kb-help-ja.png` | あと ── 三段、無料（足にアップグレードの二行） |
| `shots/r44-kb-help-ja-paid.png` | あと ── 三段、有料（足に何も無い） |

手順 2 の写真に灰色の帯が重なっていますが、**変更前の一枚にも同じように
出ています** ── これではありません。`shot.mjs` がシートの上にアプリ自身の
帯を描いている形で、私の scope の外です。直していません。

## 決定 2 ── 縦のみ

`ios/App/App/Info.plist` の `UISupportedInterfaceOrientations` と
`UISupportedInterfaceOrientations~ipad` の両方を
`UIInterfaceOrientationPortrait` 一つだけに。`~ipad` の
`PortraitUpsideDown` も落ちました。`www/` は一行も触っていません。

## 回した check

`assets` `es5` `dead` `act` `i18n` ── **五本とも緑**。ゲート（`npm test`）は
回していません（`docs/SESSIONS.md`）。

## 赤は見られませんでした ── 押して確かめた結果です

指示は「`kb-full.jpg` だけ先に消して `assets` が赤になるのを見る」でした。
**やりました。`assets` は緑のままでした。**

理由を測りました ── **`tools/assets-check.mjs` に `img` という語は 0 件**です。
読んでいるのは `index.html` の `<script src>` と `<link href>`、`project.pbxproj`
の Sources phase、`PrivacyInfo.xcprivacy` 三本、`__NAME__` の置換、ネイティブの
橋 17 本、読み込み順 ── それだけで、**`www/img/` を一度も見ていません**。
他の check も見ていません（`tools/*.mjs` を grep 済み。`.jpg` が出るのは
fixture と post-check と rls-check の**投稿の写真**だけ）。

**「参照の無い画像／無い画像への参照」を止めているものは、この repo に
ありません。**片方だけ消しても何も落ちません。今回は両方一緒に消したので
残骸はありませんが（`grep -rn "kb.step4\|kb-full" www/` → 0 件）、**次に
画像を足したり消したりする人を止めるものは無い**ということです。

これは私の scope の外なので check は書いていません。リーダーの判断で
`docs/BACKLOG.md` へ。

**そしてその穴に、この枝自身が一度落ちました。**`e8620f05` に
`www/img/kb-full.jpg` の削除が**入っていませんでした** ── 写真を撮るために
`git stash` で往復した時に index から外れ、そのあとの `git add` で
`www/img/` を名指ししていなかったためです。ディスクから消えているのに
git は持ったまま、という状態で、`assets` `es5` `dead` `act` `i18n` の
**五本とも緑のまま通りました**。止めたのは commit hook でも check でもなく、
`git status` です。`f8f4e83f` で削除を入れ直しました。

## DEVICE UNCONFIRMED

**両方とも実機未確認です。**Linux に Swift はありません。見る所は
`docs/CHECK-0907.md` の**ビルド 162**に二件書きました ──
「フルアクセスをオフのまま Lingua キーボードで文字が出る」、
「横にしても回らない」。

決定 1 の ①（Linux では確かめられない）は**消えていません**。消したのは
② の `www/` のほうだけです。フルアクセス無しで App Group が読めることは
Apple の現行ページと 2026-09-02 の結論に基づく推論のままで、**外れていた
場合は看板機能が全員で死にます**。162 でそこを最初に見てください。

## 触っていない file

`www/index.html`・`www/settings.js`・`www/onboard.js`・
`ios/App/App.xcodeproj/project.pbxproj`。`www/i18n/*.js` は `kb.step4` の行
だけで、`plan.price.free` には触れていません。
