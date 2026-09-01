# claude/acct2 ── プランをアカウントに結びつける

「課金とアカウントとキーボードはアカウントに結びつく。
  じゃないとアカウント変えたら無限に言語作れるやん」OWNER 2026-09-01

## サーバーへの当て方（**まだ当てていません**）

Supabase ダッシュボード → SQL Editor に `supabase/schema.sql` を**丸ごと**貼って実行。
（ファイル冒頭が言うとおり全体が何度でも流せます ── `npm run rls` が二度流して確かめています。）

`profile.bio`（自己紹介の列）も同じ貼り付けで入ります。**列を足すだけでは書けません** ──
`schema.sql` は `profile` の UPDATE と INSERT を revoke して列を名前で戻しているので、
`bio` を両方の grant に足してあります。足し忘れると**エラーは出ず、行が変わらないだけ**です。

## 分けて報告 ── **プランの検証は、まだ誰もしていません**

`plan` 表の行を書くのは**端末**で、端末は本人です。だから RLS で塞げたのはここまで:

- **B は A のプランを書けない**（`plan_make` / `plan_edit` は `id = auth.uid()`）
- **B は A が何を払っているか読めない**（`plan_read` も `id = auth.uid()`。
  これが `profile` の列にしなかった理由 ── `profile_read` は `using (true)` で、
  誰でも誰のプロフィールも読めます。**払っているものはハンドルではありません**）

**塞げていないこと:** 自分で自分の行に `'pro'` を書けます。鍵を持っているのが
端末だからで、SQL では閉じられません。

### 閉じるには、次のどれかが要ります（**オーナーの決めごと**）

1. **Supabase Edge Function + App Store Server API。**端末は Apple の
   `originalTransactionId` を渡すだけにして、関数が Apple に問い合わせて
   `plan` を書く。`plan` への書き込みは端末から取り上げる（`service_role` だけに）。
   → いちばん正しい。Apple の鍵（`.p8`）を Supabase の secret に置く必要あり。
2. **App Store Server Notifications V2** を Edge Function で受けて書く。
   更新・解約・返金が**アプリを開かなくても**届く。1 と組み合わせるのが本来の形。
3. **今のまま。**リリースまでに 1 か 2 が要ります ── いまは誰でも自分を Pro に
   できます。

**どれも「今日は無理」なのではなく「今日は決まっていない」ので、書いていません。**
CLAUDE.md §Deciding。

## いま在る形

- `plan` 表（`supabase/schema.sql`）── `id` は `auth.users`、`plan` は
  `free|plus|pro`、`at` は最後に動いた時刻
- `netPlanSync()`（`www/net.js`）── 起動時に読み合わせ、**高いほうを採る**
  （`LinguaStore.swift` の `best()` と同じ規則。段が二つ見えたときの答えは
  この repo では前から「上の段」）
- `capLapse()`（`www/core.js`）── プランが動いた**唯一の場所**なので、ここから上げる

## 壊してはいけないもの

`docs/PAID_FEATURES.md` ── **プランが決めるのは「できること」だけ。**
無料に戻っても言語も語もキーボードも一つも消えません。`plan-check` が持っています。
