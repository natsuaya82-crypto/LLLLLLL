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
