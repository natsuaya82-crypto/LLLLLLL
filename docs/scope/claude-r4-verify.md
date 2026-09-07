# claude/r4-verify — 課金の段はサーバーが決め、アカウントに束縛される

OWNER 2026-09-06「アカウントごとなんだから、違うアカウントで復元できるのおかしい
だろ。検証して」。

## 決まっていること（仕様）

- 段（plus/pro）は **Lingua のアカウント**のもの。買った時にサインインしていた
  アカウントに束縛される。
- **別のアカウントでサインインして「購入を復元」しても、その購入は付かない。**
- 段を決めるのは**サーバー**。端末が言った値をサーバーが書き留める今の形は終わり。
- 変わらないこと：段は「できること」だけを決め、誰の言語の 1 バイトにも触らない
  （docs/PAID_FEATURES.md、plan-check）。

## この枝が触るもの

| ファイル | 何を |
|---|---|
| `ios/App/App/LinguaStore.swift` | `appAccountToken` を付けて買う。段ではなく署名付き取引（JWS）を返す。段を決める Swift の判定を消す |
| `supabase/functions/verify-plan/verify.js` | JWS の x5c 鎖を Apple Root CA-G3 で検証する一枚。根の証明書と時刻を注入できる |
| `supabase/functions/verify-plan/index.ts` | ユーザーの JWT ＋ JWS を受け、束縛を見て `plan` を service role で書く |
| `supabase/schema.sql` | `purchase` 表を足す。`plan_make`／`plan_edit` を落とす |
| `www/net.js` | `netPlanUp`／`netPlanSync` を削除、`netPlanVerify` を足す |
| `www/store.js`, `www/settings.js`, `www/core.js`, `www/boot.js` | 買う→JWS→verify→段 の一本道に直す |
| `www/i18n/*.js` | 文言 |
| `tools/verify-check.mjs`, `tools/rls-check.mjs`, `tools/gate.mjs`, `package.json` | 検査 |
| `docs/` | CHANGELOG, PAID_FEATURES, apple.md, FEATURES.md, supabase/setup.md |

## 触らないもの

`www/index.html`（他の枝が持っている）。画面の見た目。他のどの枝も。

## 一機構

古い道（端末が `plan` 行を書く `netPlanUp`、Swift の `best()`／`entitledPlan()`
が段を決める判定）は**削除**する。新しいものを古いものの横に置かない。
