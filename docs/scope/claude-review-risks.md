# claude/login-billing ── 審査で落ちそうなところ

2026-09-02。`origin/master` = `d47a578` を取り込んだ上で読んだ。
**CODE CONFIRMED のみ。コードは変えていない。**

**前置き。**実機を見ていない。App Store Connect と Supabase のダッシュボードは
ここから見えない。外部 URL は proxy に止められて到達できないので、規約と
プライバシーのページが生きているかは**確認できていない**。A-2 は「未確認」で
あって「大丈夫」ではない。

---

## A. ほぼ確実に止まる

**A-1【2.1】審査用のデモアカウントが要る。チェックリストに無い。**
扉を通らないと何もできない（オンボーディングの最後が扉、抜け道なし）。
App Store Connect の「サインインが必要」にデモの ID とパスワードを入れないと、
審査員が入れずに即リジェクト。`docs/apple.md` § 5 に**この項目が無い**。
そのデモアカウントを作るにはメールの六桁が届く必要があり、`supabase/mail.md`
の SMTP と DNS は `docs/STATE.md` §0-a の 6 で「未確認」のまま。→ オーナー。

**A-2【5.1.1 / 3.1.2】規約とプライバシーの URL が生きているか。**
`www/settings.js:52-53` ── `https://tokinets.com/lingua/terms.html` と
`.../privacy.html`。`docs/STATE.md` §3 の 6 は「Terms and privacy ...
Not started」と書いている。404 なら、プライバシーポリシー必須（5.1.1）と
課金画面の必須リンク（3.1.2）の両方で落ちる。→ オーナー。ブラウザで二つ開く
だけ。最優先。

**A-3【2.1 / 4.0】iPad で審査される。**
`ios/App/App.xcodeproj/project.pbxproj` の `TARGETED_DEVICE_FAMILY` が六つの
config 全部で `"1,2"`（iPhone + iPad）。iPhone だけの config は無い。審査員は
iPad でも動かし、App Store Connect は iPad のスクショも要求する。この repo で
測っている幅は 320〜390 だけ。直しは `"1"` の一行だが、iPad を出すかは製品の
決めごと。

**A-4【3.1.1】課金がまだ出せる状態にない。**`docs/apple.md` § 6 が自分で
そう書いている。レシート検証は `docs/scope/claude-acct2.md`。

## B. 高い

**B-1【4.4.1 / 5.1.1】キーボードが Full Access を要求し、無いと一つも動かない。**
`ios/App/LinguaKeyboard/Info.plist` の `RequestsOpenAccess = true`、
`KeyboardViewController.swift:66` の `guard hasFullAccess else { show(...) }`
── Full Access が無いとキーが一つも描かれず、設定への案内文だけが出る。

**しかし要らないはず。**`Shared.board()`（`Shared.swift:132-139`）は App Group
のコンテナから `keyboard.json` を読むだけで、App Group のコンテナ読み出しに
Full Access は要らない。`Shared.swift:129` のコメント「Nil for every reason
equally: no full access, ...」から見て、要ると思い込んだまま両方が入った可能性が
高い。審査で最も突かれる形 ── 一番強い権限を求め、それが無いと機能しない。
実利も大きい：ほとんどの人は Full Access を入れないので看板機能が壊れて見える。
**確かめるのは実機一回。Mac が要るので私にはできない。ここが一番値打ちがある。**

**B-2【5.1.1(v)】アカウント削除の行に「アカウント」の語が無い。**
`www/settings.js:308-312` の二行 ── `set.wipe.langs`「端末のデータを消す」は
端末だけ、`set.wipe`「データを消去」が**アカウント削除**。en は
'Erase everything' と 'Erase the data on this phone'。実装は正しい
（`net.js:2419` `netDropMe` → `account_delete`）。審査員は「Delete Account」を
探す。→ 文言はオーナーの決めごと。i18n ×10。

**B-3【5.1.1(v)】削除時にサブスクリプションの案内が無い。**Apple は購読のある
アプリに「アカウントを消しても購読は止まらない」と伝え、管理先を案内すること
を求めている。`confirm.wipe`（`en.js:745` / `ja.js:749`）にその一文が無い。
アプリが取り上げるものの告知なので、CLAUDE.md § Explaining の narrowing 側。

**B-4【1.2】登録画面に規約への同意が無い。規約は課金画面にしか無い。**
`obFormHTML`（`www/onboard.js:1069`〜）はメール／パスワード／ボタン／Apple／
Google だけ。`docRows()` は `planTerms()`（`settings.js:785`）からしか呼ばれず、
2026-09-01 の決定で設定から外れた（「設定のアカウントの利用規約とプライバシー
ポリシー消しといて。課金の方にあるからいらん」）。課金画面を開かない人は規約に
一度も触れない。UGC アプリで規約同意が無いのは 1.2 の定番。
**9/01 の決定に触るのでオーナーへ。**Apple が求めているからであって、決定が
間違っていたからではない。

**B-5【2.1】カードの共有が実機で動いていない可能性。しかも成功と言う。**
`www/card.js` の `cardDeliver`（997-1009）── `navigator.share` があれば共有
シート、無ければ `<a download>`、最後に `toast(t('card.saved'))`「保存しました」。
WKWebView に `navigator.share` は無く、blob の download も落ちる。そうだとすると
**何も保存されていないのに保存したと言う**。バックアップは既にネイティブで
書いている（`backup.js` / Swift の `keep()`）ので道はある。→ 要実機。

## C. 中

**C-1【2.3.1】隠し機能。**設定の見出し7回で運営ページ（`www/mod.js:193-200`
`adminTap()`）。サーバーが admin を否定すれば何も起きないが、2.3.1 が名指し
しているのは隠しジェスチャそのもの。審査員には「サーバーが止める」ことが
見えない。

**C-2【4.0】横向きを宣言している。**`ios/App/App/Info.plist` の
`UISupportedInterfaceOrientations` に landscape 二つ。設計は全部縦。

**C-3【3.1.2】課金画面の規約リンクが `target="_blank"`。**
`www/settings.js:41-45`。Capacitor 8 の WKWebView で実際に開くかは実機でしか
分からない。3.1.2 が求めているのは**動くリンク**。

**C-4【2.1】スキーマ未適用で ↓ が空振りする。**`docs/STATE.md` §0-a の 1。
`slice_dl()` は `supabase/schema.sql:706` に在り、ダッシュボードに流されて
いないだけ。

**C-5** サブスクリプショングループが二つ。リジェクトではないが二重課金。

## D. 見て、問題が無かったもの

- **4.8** Sign in with Apple が有る。扉の両面と設定の両方
- **1.2** 通報 `openReport` と ブロック `meBlock` が `act-map.js:187,189` に
  在り、投稿とプロフィールの両方から押せる
- **1.2** 凍結された人の連絡先（`www/sns.js:643` `APPEAL`）
- **4.4.1** キーボードに地球キーが在る（`KeyboardViewController.swift:81,176`、
  `needsInputModeSwitchKey` で出し分け、`advanceToNextInputMode`）
- **5.1.1** マイク・カメラ・写真の用途文が三つとも在り、具体的
- **5.1.1(i)** 起動直後にサインインを求めない。最初は文字を描く画面
- **5.1.1(v)** 削除の実装そのものは正しく徹底している（写真も消してから
  `account_delete`）
- `ITSAppUsesNonExemptEncryption` が入っている
- プレースホルダ文言（coming soon / 準備中）は i18n に無い
- Facebook と X の SDK は `capacitor.config.json` で切ってある

## E. `docs/apple.md` が古い

§ 5 の最後が「今はメールだけなので、ここは審査で止まる可能性があります」と
書いている。Apple も Google も入っている。同じ § に A-1（デモアカウント）の行が
無い。両方まとめて、直す作業と同じコミットで。

## F. 実機でしか分からないもの ── 一回でまとめて見られる

1. キーボードを Full Access 無しで使えるか（B-1）★ 一番値打ちがある
2. カードの共有を押して、本当に共有シートが出るか（B-5）
3. 課金画面の規約とプライバシーのリンクが開くか（C-3）
4. 横向きに回して崩れるか（C-2）
5. iPad で開いて崩れるか（A-3）

## G. オーナーに戻す判断

1. iPad を出すのか出さないのか（A-3）
2. 規約とプライバシーを登録画面にも戻すか（B-4）── 9/01 の決定に触る
3. アカウント削除の行の文言（B-2）と、購読の案内の一文（B-3）
4. 隠し運営ページを残すか（C-1）

## H. 領域

```
www/index.html          要らない
www/settings.js         B-2 B-3 の文言, C-3
www/onboard.js          B-4
www/card.js             B-5（ネイティブ側が要るなら ios/App/App/ に一枚）
www/i18n/*.js ×10       B-2 B-3 B-4
LinguaKeyboard/Info.plist + KeyboardViewController.swift   B-1
ios/App/App/Info.plist  C-2
project.pbxproj         A-3
docs/apple.md           E
A-1 A-2 C-4 C-5         repo の外。オーナーのブラウザ作業
```

B-1 と A-3 は課金の作業と一つもファイルが重ならない。並行できる。
