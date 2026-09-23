# オーナーだけができること

**明日（2026-09-24）まとめて。1・2 が済んだらリーダーのセッションに「済んだ」→ 166。**

オーナーの To-Do セッションが書く。リーダーはここを読む。
上から順。状態は「まだ／済み（日付）／待ち：何を待つか」。
手順の元：docs/apple.md § 8・§ 9、supabase/setup.md § 2・§ 9-5・§ 12（integ-0905 46280fcb で読んだもの）。

| # | 何のため | どこで（画面とボタンの順） | 終わったら見えるもの | 状態 |
|---|---|---|---|---|
| 1 | 通知。これと 2 が無いとビルド 166 が Archive で落ちる | developer.apple.com → Certificates, Identifiers & Profiles → Identifiers → `com.tokinets.lingua` → Capabilities の Push Notifications にチェック → Save。キーボード拡張（`…LinguaKeyboard`）は触らない（apple.md § 8-1） | `com.tokinets.lingua` の Capabilities で Push Notifications にチェックが付いている | まだ |
| 2 | 1 をプロファイルに入れる。済んだらリーダーに「済んだ」→ 166 が出る | Profiles → Lingua Distribution → Edit → そのまま Save → Download → GitHub → Settings → Secrets and variables → Actions → `PROVISIONING_PROFILE_BASE64` を差し替え（Mac: `base64 -i Lingua.mobileprovision \| pbcopy`）。`KEYBOARD_…` はそのまま（§ 8-2） | Secret の更新日が今日。166 が Archive を通る | まだ |
| 3 | 通知を送る鍵 | Keys → ＋ → 名前（例 Lingua APNs）→ Apple Push Notifications service (APNs) にチェック → Continue → Register → .p8 を Download・Key ID（10 文字）を控える → GitHub Secrets に `APNS_KEY_ID`、`APNS_P8`（中身を改行ごと）。.p8 は一度しか落とせない（§ 8-3, 8-4） | Secrets の一覧に `APNS_KEY_ID` と `APNS_P8` | まだ |
| 4 | 通知のトリガーに要る pg_net（5 より先） | Supabase → Database → Webhooks → Enable webhooks（ボタン一つ。Webhook は作らない）（setup.md § 12） | setup.md § 12 の見かた | まだ |
| 5 | 通知の種類（お題の通知 `push_on_prompt` 含む）と広告の表をサーバーに | Supabase → SQL Editor → New query → schema.sql を全部貼る → Run（setup.md § 2）。**貼るのは integ-0905 の版**：`https://raw.githubusercontent.com/natsuaya82-crypto/LLLLLLL/integ-0905/supabase/schema.sql`（setup.md に書いてある master の URL の版には r55・r58 が入っていない） | `Success. No rows returned`。Storage で `post-media` が Public でない。setup.md § 12 の確かめ方 | まだ（4 の後） |
| 6 | 通知を送る函数を置く（全員宛てを送れる版） | GitHub → Actions → Supabase Deploy → Run workflow → `push-send`（3 と 5 の後）（§ 8-6, 8-8） | 緑。Secret が空なら名前を言って止まる | まだ（3・5 の後） |
| 7 | 毎日のお題（と通知）が夏も冬も太平洋時間 0 時に出る | Supabase Dashboard → Integrations → Cron（または Database → Cron Jobs）→ `daily-prompt` → Schedule を `0 7,8 * * *` に変えて保存（setup.md § 9-5）。今の `5 7 * * *` は冬時間で一日遅れる | `daily-prompt` の Schedule が `0 7,8 * * *` | まだ |
| 8 | 本物の広告（無い間はテスト用 ID で動く。ビルドは通る） | AdMob（pub-2442181569589497）→ アプリ → アプリを追加 → iOS → 「App Store に公開済み」で Lingua → アプリ ID（`~` の方）を控える → そのアプリ → 広告ユニット → ネイティブ アドバンス → 名前（例 timeline）→ 詳細設定で動画を許可 → 広告ユニット ID（`/` の方）を控える → アプリの設定 → 広告コンテンツのレーティング T → GitHub Secrets に `ADMOB_APP_ID`（`~` の方）と `ADMOB_NATIVE_UNIT`（`/` の方）→ app-ads.txt（AdMob が出す一行）をマーケティング URL（無ければサポート URL）のサイトの一番上に置く（apple.md § 9-1〜9-3） | Secrets に二つ。次のビルドから本物。app-ads.txt の確認は最大 24 時間 | まだ |
| 9 | App Store のプライバシー表示（広告・トラッキング） | App Store Connect → App のプライバシー：識別子→デバイス ID（第三者広告・分析）、使用状況データ→広告データ・製品の操作（第三者広告・分析）、位置情報→おおよその場所（第三者広告）、診断→クラッシュ・パフォーマンス（分析）。「トラッキングに使用」は はい（デバイス ID と広告データ）（apple.md § 9-4） | 公開前の表示がこの内容 | まだ |
| 10 | 166 を実機で見る | docs/CHECK-0907.md と今日の分：書いている時と投稿の見た目が同じ（改行も）、字を描く画面の田の目安の線、設定→言語→字間、通知（3〜6 の後）、投稿の共有→カード→共有シートに X や Reddit、App Store の説明が多言語、広告（テスト用）と初回の追跡の許可画面 | — | 待ち：166 が届くまで（1・2 の後） |
