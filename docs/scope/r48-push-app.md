# r48-push-app ── アプリ側の通知（Apple のネイティブ通知）と、設定の個別オンオフ

## Scope

- **Goal**: オーナーの決定（2026-09-22、そのまま）
  「通知作ろう。アップルのネイティブ通知で、フォローされた時、返信きた時みたいな
  感じでSNS部分であるやつ。それに加えて設定で個別通知のオンオフできるように。」
- **Owns (may change)**: `ios/App/App/LinguaPush.swift`（新）、
  `ios/App/App/AppDelegate.swift`、`ios/App/App/App.entitlements`、
  `ios/App/App.xcodeproj/project.pbxproj`（Sources phase の一行だけ）、
  `www/push.js`（新・第 28 章）、`www/index.html`（script tag と要れば CSS ──
  **この session が一人で持つ**、リーダーが与えた）、`www/settings.js`、
  `www/net.js`、`www/core.js`（`SET_PREFS` の四つだけ）、`www/act-map.js`、
  `www/i18n/*.js`、`tools/fixture.mjs`、`tools/acct-check.mjs`、
  `docs/CHANGELOG.md`、`docs/FEATURES.md`、`docs/CHECK-0907.md`、
  `docs/scope/r48-push-app.md`、`shots/r48-*`
- **Does NOT own**: `supabase/` は一行も触らない（r47 がサーバー側 ── 下の契約が
  約束）。`docs/STATE.md` はリーダーの物。それ以外すべて。
- **Decision it implements**: OWNER 2026-09-22（上）
- **Check to run**: `assets`・`es5`・`dead`・`act`・`i18n`・`press`・`store`・
  `acct`・`box`。**ゲート（`npm test`）は回さない** ── リーダーの物
  （`docs/SESSIONS.md`）。

## 契約（r47 と共有 ── サーバー側はあちら）

- 種類は四つ：`follow`・`reply`・`like`・`boost`。
- 表 `device(uid, token, created_at)`、主キー `(uid, token)`、RLS は本人だけ。
  アプリは `POST /rest/v1/device` で `{uid:SESS.uid, token:token}`、サインアウトで
  `DELETE /rest/v1/device?uid=eq.<me>&token=eq.<token>`。
- スイッチは `profile.prefs` の中の `push_follow`・`push_reply`・`push_like`・
  `push_boost`。**サーバーは無い物をオンと読む**（既定オン）。
- 通知を押して開いた時、payload に `post` があればその投稿のスレッド、無ければ
  通知タブ。

## 形

- **橋は `Capacitor.nativePromise('LinguaPush', …)` だけ。**`Capacitor.Plugins`
  はこの app に無い（bundler が無く `@capacitor/core` を読まないので undefined ──
  `docs/keyboard-extension.md` § 呼び方、四回のビルドを費やした所）。
- **`LinguaPush.swift`**：`ask()` は許可を訊き、通れば `registerForRemoteNotifications()`
  して **token を promise で返す**（hex 文字列）。拒否／失敗は reject で理由。
  `status()` は今の許可（`authorized`／`denied`／`notDetermined`）。
  通知を押して開いた時は `window.pushOpened(<json>)` を `bridge.eval` で呼ぶ
  （`notifyListeners` は `nativePromise` しか無い橋では受け取れない）。
- **`www/push.js`（第 28 章）**：`pushAsk()` は **`netTook()` の一箇所から**呼ぶ。
  そこが「セッションが着いた」を知る唯一の場所で、`meFor()`・`planFor()`・
  `langTookFor()` が同じ理由でそこに居る。**二つ目の道は作らない**
  （`obIn()` からは呼ばない）。
- **設定の部屋「通知」**：`vSettings()` の一覧に行 → `vSet('push')` の枝。
  四つの行、右に `swtHTML()` のスイッチ。許可が `denied` の時は四つの上に
  **状態を一行**（押すと iOS の設定へ ── `LinguaShare.settings` の道）。
  route は足さない（部屋は `set` の引数）。
- 角丸・枠線・塗りは足さない。ES5。`onclick` 無し。説明文は書かない。

## 指示と一つだけ違える所、とその理由 ──「聞いた」印を作らない

指示は「聞いた」印を `SET_PHONE`（この端末の設定）に置け、と書き、同じ括弧の中で
「この account でまだ聞いていなければ」とも書いています。**この二つは両立しません**、
そして読んでいくと**どちらも要らない**ことが分かりました。

`SET_PHONE` に置くと `setFor()` はそれを置き換えません（端末の物は account を
またいで残る）。すると**同じ iPhone で二人目の account がサインインしても
`pushAsk()` は戻ってしまい、その人の `device` の行が一行も立ちません** ── その
account には通知が一つも来ません。`CLAUDE.md` が名指しで禁じている形です：
「端末の物」が一つの account を越えて次の人に渡る。

account の物にすれば穴は閉じます。**それでも作りません。**許可を持っているのは
iOS で、印はその写しだからです ── 人が iPhone の設定で切った日に写しはずれ、
そこから先「許可があるか」に二つの答えが立ちます。`CLAUDE.md` §「一つの事は
一つの仕掛けで、同じ問いに二箇所で答えない」。

なので **`pushAsk()` はセッションが着くたびに `LinguaPush.ask` を呼びます。**
iOS のダイアログはインストールにつき一度しか出ず、二度目からは記録から即答される
ので人には何も出ません。token は `netSend(..., up)` の
`resolution=merge-duplicates` で上げるので同じ行は二行になりません。これは
`storeSync()` が起動のたびに App Store へ訊くのと同じ形です ──「自分で全部
決めるので、二度呼んでも安全」。

これで **`SET` の field は一つも増えず、`SET_PHONE` にも `SET_PREFS` にも
`store-check` の `FIELDS` にも印の行は要りません。**増えるのは
`SET_PREFS` の四つ（スイッチ）だけです。

## 十一の問い（`docs/FEATURE_RULES.md`）

1. **何のため** ── フォロー・返信・いいね・ブーストが来たことを、アプリを開いて
   いなくても知る道。今は無い。
2. **できるようになること** ── 通知が届く。押すとその投稿のスレッドが開く。
   設定で四つを別々に切れる。
3. **無料か有料か** ── **無料**。`can()` は一つも足さない。段は一度も見ない。
4. **変わる振る舞い** ── 扉を通ったあとに iOS の許可のダイアログが一度出る。
   設定の一覧に行が一つ増える。サインアウトで token の行が一つ消える。
5. **今ある data への影響** ── 無し。列も行も一つも書き換えない。
6. **新しく貯まる物** ── サーバー：`device` の行（`uid`・`token`）と
   `profile.prefs` の中の `push_follow`／`push_reply`／`push_like`／`push_boost`。
   端末：`lingua.set` の中の `pushAsked` **一つだけ**（`localStorage` の**鍵は
   増えない** ── `store-check` が数える鍵は動かない）。
7. **消す物** ── サインアウトで **この端末の token の行だけ**（`uid` と `token`
   の両方で絞る）。他の端末の行にも、他の誰の行にも触らない。人が作った物は
   一つも消えない。DELETE REVIEW は `docs/CHANGELOG.md` に書く。
8. **前からある data** ── 無い。前の版を持っている人は `prefs` に四つが無く、
   サーバーがそれを**オン**と読む（契約）。書き換えは一行もしない。
9. **電波が無いとき** ── token は上がらない。許可は訊けるが `netDevicePut()` は
   落ちる。何も壊れず、次にセッションが着いたときに上がる。
10. **失敗したとき** ── 許可が拒まれたら何も送らない。設定の部屋がその状態を
    一行で言う（状態であって説明ではない）。
11. **段が変わったとき** ── 何も変わらない。

## 報告

（作業が終わったらここに追記する）
