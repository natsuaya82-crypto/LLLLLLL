# r82-sns — SNS の九項（2026-09-24 オーナーの答えから）

`claude/r82-sns`、`integ-0905` 04667bc2 から。決定: `docs/FEATURE_RULES.md`
「2026-09-24 オーナーの答え（確認事項 40 項への返事）」。

## やる物

- A. 写真に字を置く画面: 字の後ろの黒い帯を消す（post.js）
- B. 通知の一覧の投稿の一行を、タイムラインと同じ描いた字で（sns.js、投稿の ink だけで描く）
- C. ブロック: ブロックされた側からも見えない（schema.sql `block_hides()` を両向き、rls-check）
- D. 設定に「非表示リスト」「ブロックリスト」の画面、そこから解除
- E. フォロー中・フォロワーを「フォローした新しい順」（follow の時刻）
- F. アプリを開いて最初の画面をタイムラインに
- G. 送れなかった投稿は「送信できませんでした」と出して下書きへ（送り直しボタンは作らない）
- H. 非公開の投稿をアカウントに保存（サーバー）
- I. スマホに残る声・用紙のファイル ── 上げたら残さない（無理なら止めて報告）

## 持ち物（これ以外は触らない）

www/post.js www/sns.js www/me.js www/settings.js www/shell.js www/route-map.js
www/act-map.js www/i18n/*.js www/rec.js www/sheet.js www/net.js（上の項に要る所だけ）
www/index.html（上の項の CSS だけ） supabase/schema.sql tools/rls-check.mjs
tools/fixture.mjs 上の項を持つ検査ファイル ios/App/App/LinguaShare.swift（I だけ）
docs/CHANGELOG.md docs/scope/r82-sns.md

## 触らない物

上に無い全部。boot.js などが要るなら止めて報告する。全ゲートは回さない（リーダー）。
