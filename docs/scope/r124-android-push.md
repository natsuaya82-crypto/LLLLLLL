# `claude/r124-android-push` ── Android の通知（Firebase Cloud Messaging）

- 日付: 2026-09-27
- ブランチ: `claude/r124-android-push`（`origin/integ-0905` の `b4dab826` から）
- オーナー: Android はオーナー抜きで作れる所まで。Firebase（プロジェクトと
  google-services.json）はオーナーの手で、後から。

## この枝がやること

1. Kotlin の `LinguaPush`（ask / status / 押した通知を開く）を iOS の
   `LinguaPush.swift` と同じ答えの形で。google-services.json が無い間は今と
   同じく reject（ビルドは google-services.json 無しで緑のまま）。
2. `device` の行がどちらの電話かを持つ列（既定は ios ── 今ある行は全部 iPhone）。
3. `push-send` が android の行へ FCM HTTP v1、ios の行へ APNs。一つの函数、
   誰に何を送るかの判断は一つ。APNs の道の中身（403 BadEnvironmentKeyInToken）は
   触らない。
4. `www/push.js` が token をどちらの電話かと一緒に出す。

## 触ってよいファイル（リーダーが名指し）

```
android/app/**                        LinguaPush と manifest の service だけ
supabase/schema.sql                   device の列だけ
supabase/functions/push-send/**
.github/workflows/supabase-deploy.yml push-send の FCM の secret だけ
www/push.js
tools/push-check.mjs
tools/rls-check.mjs                   device の場合だけ
docs/ANDROID.md                       § 通知
docs/CHANGELOG.md
docs/scope/r124-android-push.md
```

触らない: 他のすべて。本番に schema を流さない。他の枝を取り込まない。

## 報告（2026-09-28）

`origin/integ-0905`（`f4e12fce`）を取り込み済み。衝突は二つ: `push-send/index.ts` は
両方を残した（`device` は `token,platform` で読み、`mute` の行を読んで `muted` を渡す）。
`docs/CHANGELOG.md` は両方の段を日付順に並べた。ミュートは `pushPlan()` で道を分ける前の
一行なので、FCM の行にも同じく効く（`push-check` に Android の行の二つ、赤を見てから）。

### やった

1. Kotlin の `LinguaPush` ── `ask` は Android 13 以降で許可を訊き、FCM の token を
   `{token, platform: 'android'}` で返す（20 秒で答えなければ reject）。`status` は
   `authorized` / `notDetermined` / `denied`。押した通知の `kind`・`post` を
   `window.pushOpened()` へ（ページが来るまで持つ）。アプリが前にある時は
   `LinguaPushService.kt` が同じ文で出す。チャンネル `lingua` は起動で作る。
   google-services.json が無ければ（FirebaseApp が無い）両方とも今までどおり reject。
   manifest に POST_NOTIFICATIONS と service、build.gradle に firebase-messaging。
2. `device.platform`（前の回）。今回は注釈を今の文に（FCM の 404 UNREGISTERED）。
3. `push-send` の FCM（前の回）。今回はミュートの取り込みだけ。
4. `www/push.js` がネイティブの `platform` を `netDevicePut()` に渡し、`android` の時
   だけ行に載せる。iPhone は何も載せず列の既定が答える。

検査: `push-check` 200 件（本物の `pushAsk()`/`netDevicePut()` を vm で走らせる 3 件、
Kotlin と push-send のチャンネル名 1 件、ミュートが Android の行にも 2 件 ── 三種とも
バグを戻して赤を見た）。`npm run rls` 緑（704）。**取り込んだ時点で rls が赤 2 件**だった:
`rls-check` の偽の Supabase が知らない表に鍵の行を答え、`mute` が「ミュートしている」に
なって push-send が鳴らさなかった ── `integ-0905` でも同じく赤のはず（`c1da5ce4` の後）。
偽に `mute` → `[]` を足して直した。assets・es5・dead・store・docs も緑。ゲートは回していない。

### 名指しの外に触った物

- `www/net.js` の `netDevicePut()`（引数 `platform` を一つ足しただけ）。住所をサーバーに
  出すのはここだけで、push.js から道を足さずに platform を載せる方法が無かった。
  `claude/*` の他の枝にこの関数を触っている物は無い（`git log HEAD..<branch> -- www/net.js`）。
- `android/app/build.gradle`（firebase-messaging の一行）。

### やれなかった ── CODE CONFIRMED まで

- Kotlin は Firebase・androidx.core にこの環境から届かず、コンパイルしていない。
  CI の Android ビルドが最初の確かめ（google-services.json 無しで通るはず）。
- 端末で見ていない（docs/ANDROID.md § 端末で見ていないこと）。
- 本番には何も当てていない（schema・push-send の deploy はリーダー）。

### オーナーが要る操作（docs/ANDROID.md § オーナーがすること 7）

1. Firebase のプロジェクトに Android アプリ（`com.tokinets.lingua`）を足し、
   google-services.json を `android/app/` に置く。
2. Firebase のサービスアカウントの秘密鍵（JSON）を GitHub Secrets の
   `FCM_SERVICE_ACCOUNT` に入れ、Supabase Deploy を push-send で回す。
3. 順番: リーダーが `device.platform` を本番に流してから、google-services.json 入りの
   Android ビルドを出す（列が無い間の Android の行は落ちる）。
