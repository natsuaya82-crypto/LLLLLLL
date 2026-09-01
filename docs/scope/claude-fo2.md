# Scope — claude/fo2

実機（ビルド #106）でオーナーが踏んだ八つ。

- **Goal:** ① フォロー中の一覧を X と同じ形に ② その一覧から人のページへ飛べる
  ⑥ 通知の未読が下のタブで光る ⑦ 引っ張って更新のグルグルが実機で出ない
  ⑧ @lingua を強制フォロー ⑩ 投稿を書く画面の上部の空白を詰める
  ⑪ プロフィール画像はタップで直接ピッカー ⑫ 表示までの1秒の空白
- **Owns (may change):**
  `www/sns.js` `www/me.js` `www/home.js` `www/post.js` `www/index.html`
  `www/shell.js` `www/i18n/*.js`
  ＋ `tools/box-baseline.txt`（① のためだけ。理由はコミットに書く）
  ＋ `docs/CHANGELOG.md` `docs/scope/claude-fo2.md`
- **Does NOT own:** それ以外すべて。`supabase/schema.sql` は持っていないので、
  ⑥ と ⑧ がサーバー側を要るなら止めて報告する。
  `www/onboard.js` はオーナーのもの。触らない
- **Decision it implements:** OWNER 2026-08-28 の実機の八つ（原文はリーダーの
  指示にある）。見た目は頼まれたものだけ ──「ui変更は俺が頼んだの以外は勝手な
  判断でやるなよ？もうほぼ見た目は完成してるのよ」
- **Check to run:** `npm run es5` `npm run sides` `npm run box` `npm run act`
  `npm run i18n`。遅い二十は回さない（規則7）。

## ① だけ角丸を足してよい理由

規則18「NO ROUNDED BOX」はここでは曲げる。オーナーが見本の写真を名指しで
見せて「フォロー中の見た目これにしろよ」と言った ── 枠のある角丸のボタンが
その形の一部です。`tools/box-baseline.txt` に足し、そのコミットのメッセージに
この段落を書く。他のどこにも広げない。
