# r131-pic — 人の投稿の写真が、枠だけで中が空

ブランチ `claude/r131-pic`（`integ-0905` から）。オーナー報告: 実機ビルド 174〜175、
2026-09-29 13:48 JST、@feuaisle の投稿をスレッドで開くと写真の枠だけが出て中が空。

## 触ってよい物
`www/net.js` の写真を読む所（`netMedia()` 周り）、`www/post.js` `www/sns.js` の写真を描く所、
その検査（`tools/post-check.mjs`）、`tools/fixture.mjs`、`shots/`、`docs/CHANGELOG.md`、この文書。
**原因が測れるまでコードは変えない**（CLAUDE.md「NO FIX ON A HUNCH」）。

## 測った事（CODE CONFIRMED、Chromium、偽のサーバー）

偽のサーバー（Playwright `page.route`）で、人の投稿（author が別人、body に
`pu`/`pt` のパスだけ、手元に bytes 無し）を `post_seen` / `feed_hot` / `posts_by` に答え、
`/storage/v1/object/authenticated/post-media/…` に本物の JPEG を返す。本物の `go()` で着いて、
`img.ppic` の `src` と `naturalWidth`、`NET_MED` を数えた。

| 場所 | 取りに行ったか | 答え | 枠に絵 |
|---|---|---|---|
| タイムライン（`feed_hot` の後） | 行った、`Bearer <SESS.at>` 付き | 200 JPEG | 入る（blob:、naturalWidth 8） |
| スレッド（`post_seen?id=eq.…` の後） | 行った | 200 JPEG | 入る |
| プロフィール（`posts_by` の後） | 行った | 200 JPEG | 入る |

**アプリの道（呼ぶ → 取る → blob → 枠に塗る）は三か所とも通っている。**「呼ばれない」
「答えを捨てる」「描かない」のどれでもない。

同じ場面で storage の答えだけを変えると:

| storage の答え | `NET_MED[path]` | 枠 |
|---|---|---|
| 400 / 401 / 403 / 404 / 切断 | `0` | `src` 無し、`data-med` だけ ── **報告と同じ「角丸の枠だけ」** |
| 200 だが中身が画像でない | `blob:…` | src は付くが naturalWidth 0 ── 見た目は同じく枠だけ |
| 200 `application/octet-stream` の JPEG | `blob:…` | 入る |

そして `0` は「このアプリを開き直すか `netOut()` / `viewReset()` まで二度と訊かない」
（`NET_MED` の注釈どおり）。一度しくじれば、その起動の間ずっと枠だけ。

## 原因は分かっていない

実機の答えがどちらの類か（**通信が失敗した** か、**バイトは来たが絵にならない** か）は、
どこにも残っていない ── 失敗は `NET_MED[path]=0` とだけ書かれ、状態番号も本文も捨てている。
リーダーが確かめた「行と規則は通る」は SQL での確認で、実機から出た HTTP の答えではない。

読んだだけで挙がる候補（**どれも測っていない**）:
- Supabase Storage が期限切れ・不正な JWT に 401 でなく 400 を返すなら、`netSend1()` の
  401 での更新は走らず `0` になる。
- WKWebView（`capacitor://localhost`）で blob: の読み込みがしくじる。
- 20 秒の締め切り（`NET_WAIT`）。

## 実機での測り方（区別がつく物）

Mac に電話をつなぎ Safari → 開発 → iPhone → Lingua（Web インスペクタ）。枠だけの画面で:

1. コンソールで `JSON.stringify(NET_MED)`。
   - その写真のパスが `0` → **通信の失敗**。ネットワークタブで
     `/storage/v1/object/authenticated/post-media/…` の状態番号と本文を読む
     （400 で `jwt expired` 等なら一つ目の候補）。
   - `"blob:capacitor://…"` → **バイトは来た**。`document.querySelector('img.ppic').naturalWidth`
     が 0 なら絵にならない側。`fetch(NET_MED[…]).then(r=>r.blob()).then(b=>console.log(b.type,b.size))`
     で中身の型と大きさを見る。
   - パスが無い → そもそも訊いていない（手元の再現とは違う道。そこを追う）。
2. Mac が無い場合は、失敗の答え（状態番号・本文の頭）を `NET_MED` に `0` の代わりに残し、
   それを人が読める所に出す変更が要る。**それは新しい見える物なので、作るかどうかは
   オーナーの判断**（CLAUDE.md「Answer before you move」）。ここでは作っていない。

## していない事
- アプリのコードの変更、検査の追加、スクショの追加（見た目は変えていない）。
- `docs/CHANGELOG.md`: 貯まる物も人が気づく事も変えていないので書いていない。
- 本番には当てていない。ゲートは回していない。
