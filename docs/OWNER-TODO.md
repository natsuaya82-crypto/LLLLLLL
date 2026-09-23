# オーナーだけができること（2026-09-23）

オーナーの To-Do セッションが書く。リーダーはここを読む。
上から順。状態は「まだ／済み（日付）／待ち：何を待つか」。

| # | 何のため | どこで（画面とボタンの順） | 終わったら見えるもの | 状態 |
|---|---|---|---|---|
| 1 | 通知。これと 2 が無いとビルド 166 が Archive で落ちる | developer.apple.com → Certificates, Identifiers & Profiles → Identifiers → `com.tokinets.lingua` → Capabilities の Push Notifications にチェック → Save。キーボード拡張（`…LinguaKeyboard`）は触らない（docs/apple.md § 8-1） | `com.tokinets.lingua` の Capabilities で Push Notifications にチェックが付いている | まだ |
| 2 | 1 をプロファイルに入れる。済んだらリーダーに「済んだ」→ 166 が出る | Profiles → Lingua Distribution → Edit → そのまま Save → Download → GitHub → Settings → Secrets and variables → Actions → `PROVISIONING_PROFILE_BASE64` を差し替え（Mac: `base64 -i Lingua.mobileprovision \| pbcopy`）。`KEYBOARD_…` はそのまま（§ 8-2） | Secret の更新日が今日。166 が Archive を通る | まだ |
| 3 | 通知を送る鍵 | Keys → ＋ → 名前（例 Lingua APNs）→ Apple Push Notifications service (APNs) にチェック → Continue → Register → .p8 を Download・Key ID（10 文字）を控える → GitHub Secrets に `APNS_KEY_ID`、`APNS_P8`（中身を改行ごと）。.p8 は一度しか落とせない（§ 8-3, 8-4） | Secrets の一覧に `APNS_KEY_ID` と `APNS_P8` | まだ |
| 4 | 通知のトリガーに要る pg_net | Supabase → Database → Webhooks → Enable webhooks（ボタン一つ。Webhook は作らない）（setup.md § 12） | setup.md § 12 の見かた | まだ |
| 5 | 通知・広告の表をサーバーに | supabase/schema.sql を流し直す（setup.md § 2） | setup.md § 2 の見かた | 待ち：r55（広告の表）と r58（通知の種類）が integ に入ったとリーダーが言うまで |
| 6 | 通知を送る函数を置く | GitHub → Actions → Supabase Deploy → Run workflow → `push-send`（3 と 5 の後）（§ 8-6） | 緑。Secret が空なら名前を言って止まる | まだ（3・5 の後） |
| 7 | 毎日のお題（と通知）が夏も冬も太平洋時間 0 時に出る | Supabase Dashboard → Integrations → Cron（または Database → Cron Jobs）→ `daily-prompt` → Schedule を `0 7,8 * * *` に変えて保存（setup.md § 9-5）。今の `5 7 * * *` は冬時間で一日遅れる | `daily-prompt` の Schedule が `0 7,8 * * *` | まだ（r58 が integ-0905 92e1744a に入った） |
| 8 | 広告 | AdMob：jpel と同じアカウント（pub-2442181569589497）に Lingua のアプリを登録 → ネイティブ広告の広告ユニットを作る。Secrets の名前と手順は r55 が docs/apple.md に書く | — | 待ち：r55 |
| 9 | App Store のプライバシー表示（広告・トラッキング） | App Store Connect | — | 待ち：r55 |
| 10 | 166 を実機で見る | docs/CHECK-0907.md と今日の分：書いている時と投稿の見た目が同じ（改行も）、字を描く画面の田の目安の線、設定→言語→字間、通知（3〜6 の後）、投稿の共有→カード→共有シートに X や Reddit、App Store の説明が多言語 | — | 待ち：166 が届くまで（1・2 の後） |
