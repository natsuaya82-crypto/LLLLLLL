# 手で歩いた記録 — SNS 側（2026-09-06）

`master`（`de4ad262`）を headless Chromium で人が触るように操作した記録。
コードは直していない。見たことだけを書く。担当は SNS
（`www/sns.js` `www/post.js` `www/me.js` `www/rec.js` `www/mod.js` `www/notes.js`）。

前の人の一周（`origin/claude/walk` の walk 記録、まだ master には入っていない）に
載っているものは書いていない。

## どう触ったか

`tools/shot.mjs` と `tools/press.mjs` と同じ道で playwright を書いた（`tools/_walk-lib.mjs`、
`tools/_*.mjs` は git の外）。端末は 402×874、deviceScaleFactor 3、ポート 8151。
押すのは本物の click で、`data-do` から `www/act.js` の一つの委譲リスナーを通る。
`page.on('pageerror')` と console.error は全部拾った。スクショは `shots/walk-sns/`。

seed の直後に `window.netPop=function(){}` を入れた。このコンテナに外向きの網が
無く、「接続できません」のポップが `#sbg.on` で画面全部を覆うから。**仕様どおりの
動きなので下には書かない**（前の人の記録と同じ扱い）。

**道具のせいで一度まちがえた。** 押す前に要素を `scrollIntoView` していなかったので、
画面の下にあるボタン（二つ目の投稿のいいね・ブースト）を押しても何も起きず、
「他人の投稿にはリアクションできない」と読んだ。**アプリのせいではない。**
下に書いたのは、要素を画面に入れてからもう一度確かめたものだけ。

## バグ（再現手順が書ける）

| # | プラン | 画面 | 操作 | 起きたこと | 期待 | スクショ |
|---|---|---|---|---|---|---|
| 1 | 全部 | スレッド (`thread`) | iri をブロックしてから自分の投稿 p1 のスレッドを開く | ブロックした人の返信がそのまま並ぶ。名前も文もアイコンも、ブロックしていない時と 1 バイト違わない | タイムライン・プロフィール・検索・通知と同じく、ブロックした人の行は出ない | `38-thread-blocked-reply.png` / `37-thread-blocked-parent.png` |

### 再現手順

**1.** タイムライン → iri の投稿の「…」→［Block］。フィードから iri の投稿は
消える（正しい）。→ 自分の投稿を押してスレッドを開く → **iri の返信がそこにある。**
逆からも同じで、自分の返信 p4 のスレッドを開くと、間にいる iri の投稿が親として
出る。押した行の `data-do` を数えると、ブロックあり `p1 p3 p4`、ブロックなし
`p1 p3 p4` で同じ。

`vThread()`（`www/sns.js:1528`）の頭には「Blocked is gone, not merely absent from
the list」と書いてあり、`postBlocked(p)` を見ているのは**そのスレッドの主の投稿
だけ**。上（`postUps`）と下（`postDown`）の行は `postGone()`（＝取り下げ）しか
見ていない。`postBlocked()` と `postGone()` は別のもの（`www/post.js:118` と `:152`）。
ブロックした人の投稿を直接開く（`thread:p2`）と「That is no longer here.」になる
ので、**入口が一つだけ塞がっていない。**
