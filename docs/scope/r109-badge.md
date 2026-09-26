# r109 — 課金者の印が、相手の画面にも出る

ブランチ `claude/r109-badge`（`integ-0905` 020bb570 から）。

## 仕様（オーナー 2026-09-26）

「課金者にちゃんと投稿とかプロフィールにダイヤ見えるようになってる？」「入れるよ？」

どの段で出すかは `CAN.badge`（`www/core.js`）の今の答え ── `pro`。

## 形

- サーバーが「この人は今、印を付けているか」を一つの真偽で答える:
  `badge_of(who)`（`supabase/schema.sql`）。段を決めるのは `plan` の行
  （verify-plan と `plan_staff_hold()` の一箇所）で、それを読む。`purchase` には
  「その行が、それを払った物より長生きしていないか」だけを訊く。段・期限・
  product は外に出さない。
- 投稿と人を返す道が、その真偽を `badge` という列で返す。
- 電話: `postBadge()` は投稿・人の行が運んできた `badge` だけから描く。自分の分も
  同じ道。`can('badge')` と `p.mine` の枝は消す。`net.js` で列を読む所は一か所。

## 触る物

- `supabase/schema.sql` — `badge_of()`、`post_seen`・`profile_seen`・
  `feed_hot()`・`feed_fo()`・`posts_by()` の列、`feed_weight()`（下）
- `www/net.js` — 列を読む一か所、`NET_POST_SEL`・`NET_WHO_SEL`
- `www/post.js` — `postBadge()`
- `www/me.js` — `whoOf()` の `pro:can('badge')` と `pro:!!p.pro`
- `tools/rls-check.mjs`、`tools/post-check.mjs`、`tools/tl-check.mjs`、
  `tools/fixture.mjs`、`tools/sides-check.mjs`（postBadge の例外の文）
- `docs/FEATURE_RULES.md`（決定ログに一項、古い「サーバーは誰が課金しているか
  知らない」を消す）、`docs/CHANGELOG.md`、`docs/PAID_FEATURES.md`（古い文があれば）
- この scope ファイル（報告も書く）

## 触らない物

- `www/shell.js`（r108）、`store/`（r107）
- `docs/STATE.md`（リーダーの物。古くなる文は報告に書く）
- `plan`・`purchase` の表と読みの policy、verify-plan

## 道の表（integ-0905 020bb570 で数えた、投稿か人を返す物全部）

| 道 | 何を返す | 扱い |
|---|---|---|
| `post_seen` | 投稿 | `badge` 列を足す |
| `post_seen.quoted` | 引用元の投稿（jsonb） | 足す（引用の中の名前にも印） |
| `feed_hot()` | おすすめ | 足す（post_seen の列をそのまま渡す） |
| `feed_fo()` | フォロー中 | 足す |
| `posts_by()` | その人のページ | 足す |
| `profile_seen` | 人 | `badge` 列を足す |
| `notices()` | 通知（誰が・何を） | 足さない ── 電話は通知に印を描いていない（描く所が無い物は運ばない） |
| `follow_seen`・`react_seen`・`block_seen`・`mute_seen` | 人の名前の一覧 | 足さない ── 同じ理由 |

## `feed_weight()`

決定ログ 2026-08-28「おすすめの並び」: 「**青パッチ＝課金した人の印**」、倍率は
「青パッチの倍率」。倍率は印に掛かると書いてあり、`to_jsonb(p) ->> 'paid'` は
「列ができた日から黙って効き始める」ための仮の問いだった。だから同じ
`badge_of()` に揃える。**plus に倍率を掛けるかは決まっていない**ので決めない ──
印が `pro` なので倍率も `pro`。
