# claude/login-billing ── 審査で落ちそうなところ

2026-09-02。CODE CONFIRMED のみ ── **実機は一つも見ていません。**
App Store Connect と Supabase のダッシュボードはここから見えません。

読んだ範囲: `ios/App/App/Info.plist`、`ios/App/LinguaKeyboard/`、
`App.xcodeproj/project.pbxproj`、`www/settings.js`、`www/onboard.js`、
`www/card.js`、`www/mod.js`、`www/net.js`、`docs/apple.md`。

---

## 今日オーナーが決めたこと（この報告に効くぶんだけ）

- **いまは iPhone だけ。** iPad と Android はそのあと作る。2026-09-02
- 規約とプライバシーの URL は**生きている**（オーナー確認済み）。A-2 は閉じ
- アカウント削除は、データもアカウントごと消える。「アカウントだけ消す」は無し
- 削除のポップは「サブスクリプションを解除してからアカウントを削除してください」
- 隠しの運営ページ（見出し7回）は**残す**

`docs/FEATURE_RULES.md` の決定ログには**書いていません** ── あのファイルは
`claude/langacct` が触っています（`2e628f5`）。書くのはその枝か、リーダー。

---

## A. ほぼ確実に止まる

### A-1【2.1】審査用のデモアカウントが要る。チェックリストに無い

扉を通らないと何もできないので、審査員が入れなければ即リジェクト。
`docs/apple.md` § 5 に**この項目が無い**。六桁が届かないとデモアカウントも
作れないので、`supabase/mail.md` の SMTP と DNS が先。
→ オーナー。App Store Connect と Supabase。

### A-3【2.1 / 4.0】いま iPhone だけなのに、プロジェクトは iPad も名乗っている

`ios/App/App.xcodeproj/project.pbxproj` の `TARGETED_DEVICE_FAMILY` が
**六つの config 全部で `"1,2"`**（608 632 651 675 695 719 行）。iPhone だけの
config は一つも無い。

このまま出すと審査員は iPad でも動かし、App Store Connect は iPad の
スクリーンショットを要求する。中身は HTML なので iPad では横に伸びるだけ
（字は小さいまま行だけが長い）。**「いまは iPhone」という決定と、出す物が
食い違っている。**

直しは `"1,2"` → `"1"`。後から iPad を足すのは普通の順序で、逆（iPad を
名乗ってから外す）は既に使っている人から取り上げる形になるので、
**iPhone だけで出しておくのが安全な順番。**

### A-4【3.1.1】課金がまだ出せる状態にない

`docs/apple.md` § 6 が自分でそう書いている。レシート検証が無い件は
`docs/scope/claude-login-billing.md` と `claude-acct2.md`。

## B. 高い

### B-1【4.4.1 / 5.1.1】キーボードが Full Access を要求し、無いと一つも動かない

    ios/App/LinguaKeyboard/Info.plist       RequestsOpenAccess = true
    KeyboardViewController.swift:66         guard hasFullAccess else { show(...) }

Full Access が無いと**キーが一つも描かれず**、設定への案内文だけが出る。

**しかし要らないはず。** `Shared.board()`（`Shared.swift:132-139`）は App Group
のコンテナから `keyboard.json` を読むだけで、そこに Full Access は要らない。
`Shared.swift:129` のコメント「Nil for every reason equally: no full access, ...」
から見て、要ると思い込んだまま両方が入った可能性が高い。

審査で最も突かれる形 ── 一番強い権限を求め、それが無いと機能しない。実利も
大きい：ほとんどの人は Full Access を入れないので看板機能が壊れて見える。
確かめるのは実機一回。**Mac が要るので私にはできない。**

### B-2【5.1.1(v)】削除の行に「アカウント」の語が無い

`www/settings.js` の二行 ── `set.wipe.langs`「端末のデータを消す」（端末だけ）と
`set.wipe`「データを消去」（**これがアカウント削除**）。実装は正しい
（`net.js` `netDropMe` → 写真も消す → `account_delete`）。審査員は
「Delete Account」を探すので、その語が無いと導線が無いと判断されうる。
今日の決定（データはアカウントごと消える）どおりの一語にする。

### B-3【5.1.1(v)】削除の前に購読の案内が要る ── 文面は決まった

「サブスクリプションを解除してからアカウントを削除してください」OWNER 2026-09-02。
`confirm.wipe`（i18n ×10）。

### B-4【1.2】登録画面に規約への同意が無い ── **決まった。出す**

登録の面はアドレスの欄と Apple と Google だけ。規約とプライバシーは課金画面に
しか無い（2026-09-01 の決定で設定から外した）。UGC アプリで規約同意が無いのは
1.2 の定番。

**OWNER 2026-09-02:「続けるとの説明は ok」。** 画面の一番下に小さく一行、
「続けると利用規約とプライバシーポリシーに同意したことになります」と、その二語が
`DOC_TERMS` / `DOC_PRIVACY` へのリンク。チェックボックスは要らない。

9/01 の「設定から外す」は**取り消していない** ── 設定には戻さず、登録画面に出す。
これは説明ではなく法的な表示で、課金画面の自動更新の一文と同じ種類。
`www/settings.js` § planTerms がその唯一の例外だと書いているので、これが二つ目。
`docRows()` を使うこと ── 規約の写しは一つ。

### B-5【2.1】カードの共有が実機で動いていない可能性。しかも成功と言う

`www/card.js` `cardDeliver` ── `navigator.share` → 無ければ `<a download>` →
最後に必ず `toast(t('card.saved'))`「保存しました」。WKWebView に
`navigator.share` は無く、blob の download も落ちる。そうだとすると
**何も保存されていないのに保存したと言う。** バックアップは既にネイティブで
書いているので道はある。→ 要実機。一回押すだけ。

## C. 中

- **C-2【4.0】横向きを宣言している。** `ios/App/App/Info.plist` の
  `UISupportedInterfaceOrientations` に landscape 二つ。設計は全部縦。
- **C-3【3.1.2】課金画面の規約リンクが `target="_blank"`。** Capacitor 8 の
  WKWebView で実際に開くかは実機でしか分からない。3.1.2 が求めるのは**動く**リンク。
- **C-4【2.1】スキーマ未適用で ↓ が空振りする。** `slice_dl()` は
  `schema.sql:706` に在り、ダッシュボードに流されていないだけ（`docs/STATE.md` §0-a）。
- **C-5** サブスクリプショングループが二つ。リジェクトではないが二重課金。

## D. 見て、問題が無かったもの

- 4.8 Sign in with Apple が有る。扉の両面と設定の両方
- 1.2 通報（`openReport`）とブロック（`meBlock`）が `act-map.js` に在り押せる
- 1.2 凍結された人の連絡先が入っている（`www/sns.js` `APPEAL`）
- 4.4.1 キーボードに地球キーが在る（`needsInputModeSwitchKey` /
  `advanceToNextInputMode`）
- 5.1.1 マイク・カメラ・写真の用途文が三つとも在り、具体的
- 5.1.1(i) 起動直後にサインインを求めない。最初は文字を描く画面
- 5.1.1(v) 削除の実装そのものは正しく、徹底している
- `ITSAppUsesNonExemptEncryption` が入っている
- プレースホルダ文言（coming soon / 準備中）は i18n に無い
- 2.3.1 隠しの運営ページは**残すと決まった**（OWNER 2026-09-02）

## E. `docs/apple.md` が古い

§ 5 の最後が「今はメールだけなので Sign in with Apple で止まる可能性が
あります」と書いている。Apple も Google も入っている。同じ § に A-1 の
デモアカウントの行が無い。両方まとめて直すこと。

## F. 実機でしか分からないもの ── まとめて一回で見られる

1. キーボードを Full Access 無しで使えるか（B-1）★ 一番値打ちがある
2. カードの共有を押して本当に共有シートが出るか（B-5）
3. 課金画面の規約とプライバシーのリンクが開くか（C-3）
4. 横向きに回して崩れるか（C-2）

## G. iPad のときに戻ってくる宿題

いまは iPhone だけなので**やらない**。iPad を作るときに開くこと。

キーボードの高さの式は `KeyboardViewController.swift` の
`rowPerWidth = 0.1385`（短辺 × これ）で、390pt の iPhone で 54pt になるよう
決めたもの。iPad の短辺は 768 以上なので一行 106〜114pt になり、
`mostOfScreen = 0.5` の上限に当たって行が潰れる。**iPad のキーボードには
今どんな答えも無い。** `www/keyboard.js` の `kbRowsMax()` が同じ数字を
読んでいるので、直すときは両側。

## H. まだオーナーの返事待ち

- B-4 登録画面に規約のリンクと同意を出してよいか（9/01 の決定に触る）
- パスワードという入口を残すか、六桁だけにするか
- Apple の「メールを非公開」で別垢になるのを、そのままにしてよいか
- セッションが切れたときの文言（いまは「メールアドレスかパスワードが違う」）
