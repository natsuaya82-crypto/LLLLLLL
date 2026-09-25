# r88-mute2 — タブで出る時の保存・Pro の上限の＋・ミュートの広さと印

`claude/r88-mute2`、`integ-0905` a64fd723 から。決定: `docs/FEATURE_RULES.md`
「### 2026-09-25 タブで出る時の保存・Pro の上限・ブロックと取った言語・ミュートの広さと印」。
前の報告: `docs/scope/r84-save.md`（「オーナーに訊くこと」1・2）、`docs/scope/r85-block.md`（「オーナー・リーダーへ」4・6）。

## やる物

- A. 保存ボタンのある画面を下のタブで出る時も、戻ると同じ「保存しますか？」を訊く。戻ると同じ一つの門を
  通す形に書き直す（二つ目の問いを足さない）。keep-check で赤を一度見る。
- B. Pro で上限（言語 3・ダウンロード 3）に達したら、その＋を出さない（`up.need` のポップへ行く道を Pro の上限
  では無くす）。上限を答える所を一か所で訊く形で。free・plus の振る舞いは変えない。plan-check で赤を一度見る。
- C. ミュートした人がリポストした投稿（誰が書いた物でも）と、その人からの通知を出さない。サーバー側
  （schema.sql の `feed_hot`・`feed_fo`・`notices` と `mute_hides()`）で外す。rls-check / tl-check で赤を一度見る。
- D. 「…」の一覧の「ミュート」の行の印: していない人は今のスピーカー、している人は赤い斜線のスピーカー。
  `ICON_*` の並び（`www/glyph.js`）に一つ足す。赤は `index.html` の色の二つの塊にある変数を使う。
  両方の状態の写真を shots/ に。

## 持ち物（これ以外は触らない）

www/shell.js www/core.js www/settings.js www/home.js www/keyboard.js www/sns.js www/me.js www/post.js www/net.js
www/glyph.js（ICON の一行だけ） www/act-map.js www/i18n/*.js
supabase/schema.sql（feed_hot・feed_fo・notices・mute の所だけ） tools/rls-check.mjs（CASES に足す行だけ）
tools/*-check.mjs のうち上を持つ物、tools/fixture.mjs
docs/FEATURE_RULES.md（その決定の Implementation status の行だけ） docs/CHANGELOG.md docs/scope/r88-mute2.md

## 触らない物

上に無い全部。`www/index.html`（CSS を一行も足さない ── D に CSS が要るなら止めて報告）、`docs/STATE.md`（リーダー）。
`tools/dl-check.mjs` は `claude/r86-dl` が取り込み前の変更を持っているので、B の赤は plan-check で見て dl-check は
触らない。全ゲートは回さない（リーダー）。
