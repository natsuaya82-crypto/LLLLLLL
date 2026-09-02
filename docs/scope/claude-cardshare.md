# claude/cardshare — カードが、保存していないのに保存したと言う

`cardDeliver()`（`www/card.js`）は `navigator.share` → `<a download>` →
**必ず**「保存」の順に落ちる。WKWebView に `navigator.share` は無く、`blob:` の
`download` も落ちる。**そのとき何も起きずに成功したと言う。**審査 2.1。

手書き用紙の PDF は既に本物の道を通っている ── `www/sheet.js` の `shMake()` が
ネイティブに書かせ、返ってきた**本当のファイル名**を `LinguaShare.shareFile` に
渡し、`UIActivityViewController` を出す。カードも同じ形にする。

## 触るもの
- `www/card.js` ── `cardSave()` と `cardDeliver()` だけ。**線より上**
  （線は 1012 行目・規則12）。線の下は投稿から描く道で、開いている言語に
  触らない。`npm run sides` と `npm run card` が持っている
- `ios/App/App/LinguaShare.swift` ── `sheet()` が拡張子を `.pdf` に決め打ちして
  いるので、拡張子を受け取れるようにする一箇所。**PDF の側の振る舞いを変えない**
- `www/i18n/*.js` ×10 ── **足す鍵だけ。既存の行は動かさない**
  （`claude/review1` と `claude/price` も同じ十ファイルを触っている）
- `docs/CHANGELOG.md`

## 触らないもの
- `www/sheet.js` ── **読むだけ。**正しい呼び方の実例がここにある。直す必要が
  出たら先にリーダーへ返す
- `www/index.html` ── 要らない
- `www/store.js` `www/net.js` `www/core.js` ── **他のセッションが持っている**
- `tools/*` ── territory の外。**そしてこれが下の「開いている問い」の一つ**

## 大事な一行
呼び方は `Capacitor.nativePromise('LinguaShare','shareFile',…)`。
`Capacitor.Plugins.LinguaShare` は **undefined** で黙って何もしない ── この
アプリはバンドラを持たず `@capacitor/core` を読み込まない。
`docs/keyboard-extension.md` にその話があり、三回のビルドがそれで潰れている。
実例は `www/sheet.js` の `shMake()`。

## 回す検査
`es5` `i18n` `dead` `sides` `act` `card`。ゲート全部は回さない。

## 測れないもの
**これは実機でしか確かめられない。**`navigator.share` の不在も `<a download>`
の沈黙も WKWebView の性質で、ブラウザの検査からは見えない。ここに緑と書いても
証拠にならない。

## リーダーへ返す、開いている問い
1. **成功したとき何と言うか。**`shareFile` は共有画面が**出た**時点で
   `{shown:true}` を返す ── Swift 側のコメントが明示している。保存したかどうかは
   答えない（人はまだ取り消せる）。だから `{shown:true}` で「保存」と言うのは、
   小さくはなっても同じ種類の嘘になる。`www/sheet.js` は成功時に**何も言わない**
   ── 共有画面が出たこと自体が返事だから。その先例に倣ってあるが、決めたのは
   リーダーのもの
2. **この道を持つ検査が無い。**`tools/card-check.mjs` は `cardSave()` にも
   `cardDeliver()` にも触っていない。「バグを戻して赤を見る」がここでは
   できない。`tools/sheet-check.mjs` は `window.Capacitor.nativePromise` を
   差し替えて同じ道を測っており、写せる型がある。**`tools/` は territory の
   外なので書いていない**
3. `docs/scope/claude-review-risk.md` は**存在しない**。読めと渡されたが
   リポジトリに無い
