# r55 ── 広告（タイムラインの PR 枠）

- 日付: 2026-09-23
- 枝: `claude/r55-ads`（`integ-0905` の `1a7b8db1` から）
- 仕様: OWNER 2026-09-23「広告の形は、Twitterと同じ。ツイート擬態右上にprとつく。
  広告枠が売れる形にする。今は売る人いないからadmobを流す。proのみ表示なし。」

## 触ってよいもの（leader が名指し）

`www/sns.js`、`www/post.js`（投稿の頭の PR だけ）、`www/core.js`（`CAN` の一行だけ）、
`www/net.js`（広告を取る）、`www/index.html`（PR の CSS だけ）、`www/i18n/*.js`（PR の鍵）、
`www/act-map.js`（ボタンを足すなら）、`supabase/schema.sql`、`tools/rls-check.mjs`、
`tools/fixture.mjs`、`docs/FEATURE_RULES.md`、`docs/CHANGELOG.md`、
`docs/PAID_FEATURES.md`、`docs/apple.md`、この文書。

## 触らないもの

`ios/` の下は一切（leader が言うまで）。AdMob / ネイティブのコードは書かない
（調べて報告して止まる）。r52 の領分 ── `www/core.js` の capOK・語数、
`www/wordsheet.js`、`www/share.js`、`www/card.js`。

## 同じファイルにいる他の枝

`git log --all` で見えたもの: `www/sns.js` `www/net.js` に r48・r51・r53、
`www/post.js` に r53・r54、`supabase/schema.sql` に r47・r51・r53、
`tools/fixture.mjs` に r54。統合は leader。

## 調べ（AdMob をどう出すか）

（後で埋める）
