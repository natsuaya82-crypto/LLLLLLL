# r108 — 戻ったら、その画面のまま

ブランチ `claude/r108-scroll`（`integ-0905` から）。

## 仕様（オーナー 2026-09-26）

「投稿とか通知とかフォロー欄とかなんでもそうなんだけど、投稿の詳細とか見て
戻ったら一番上になるのやめて欲しい。その画面のまま止まって欲しい。全部。」

## 触る物

- `www/shell.js` — `navLand()`（足跡が離れる時の位置を持ち、戻る時に戻す）と
  `backAnswer()`（自分で `scrollTo(0,0)` している道を `navLand()` に通す）
- 検査: 新しい `tools/scroll-check.mjs`、`package.json` の script、`tools/gate.mjs`
- `docs/FEATURE_RULES.md` § Owner decision log に一項、`docs/CHANGELOG.md` に一行
- この scope ファイル（報告も書く）

## 触らない物

- `store/*.json`（r107 の物）
- 他の `www/*.js`。`scrollTo` を呼ぶ他の所は下の表のとおり、進む／同じ画面の
  中の話なので変えない
- `www/index.html`

## `scrollTo` を呼んでいる所、全部（integ-0905 020bb570）

| 所 | 何の時 | 扱い |
|---|---|---|
| `www/shell.js` `navLand()` | 進む・戻る・タブ・go() で足跡の中へ、の全部 | **書き直す**: 足跡の `y` へ。新しい足跡は `y` 無し＝一番上 |
| `www/shell.js` `backAnswer()` | 投稿画面を「下書きに？」の答えで出る | **navLand() を通す**（自分の scrollTo を消す） |
| `www/glyph.js` `render()` | 描き直し。同じ route なら位置を保ち、違えば 0 | 変えない（画面の中の描き直しは動かさない） |
| `www/home.js` `openForm()` | 同じ form を新しい中身で開き直す | 変えない（新しい中身＝進む） |
| `www/onboard.js` `obGo` `obBorrow` `obPickScript` `obDoor` `obMailGo` | オンボーディングの一歩・扉の面 | 変えない（進む） |
| `www/onboard.js` 734 行 | 借りる一覧から描く画面へ一歩戻る | 変えない（オンボーディングは足跡を持たない一本道。報告に書く） |
| `www/onboard.js` `obDone` の終わり | 歩き終えてプロフィールへ | 変えない（進む） |

## 報告

### 原因をどう確かめたか
アプリを Chromium で開き（`tools/fixture.mjs` の seed、投稿を 60 に増やす）、
タイムラインを 1200 まで下げて `go('thread', …)` → `back()`、で `scrollY` を読んだ。
戻った時は **0**。辞書（437→0）、プロフィール（600→0）も同じ。読みでは二か所が
0 にしていた ── `navLand()` の `window.scrollTo(0,0)` と、その前の `render()`
（`www/glyph.js`、route が変われば y=0）。`navLand()` だけ消しても `render()` が 0 に
するので、位置を決めるのは render の後の `navLand()` 一か所にした。

### ファイルと理由
- `www/shell.js` `navLand()` ── 着く直前に今の足跡へ `here().y=pullTop()`、
  render の後に `window.scrollTo(0, to.y||0)`。`to` が足跡の中に居た項目（戻る・
  スワイプ・go() で後ろの画面へ・保存して戻る・「保存しますか」の答え）なら
  離れた時の位置、新しく作った項目（進む・タブ）は `y` が無いので一番上。
  `NAV=` を直接書き換える三か所（`backAnswer` の旧形、`navDrop`、keyboard.js の
  trail の切り詰め）はどれも項目そのものを残すので、`y` も一緒に残る。
- `www/shell.js` `backAnswer()` ── 自分で `NAV=`・`render()`・`scrollTo(0,0)` を
  していたのをやめ、`backTo()` と `navLand()` を通す。二つ目の仕組みを残さない。
- `tools/scroll-check.mjs`（新）、`tools/gate.mjs` の SLOW、`package.json` の `scroll`。
- `docs/FEATURE_RULES.md` 決定ログ、`docs/CHANGELOG.md`。

### 挙動
- 戻ると、戻った画面は離れた時の位置。二段進んで二段戻ってもそれぞれの位置。
- 一覧は下まで読んだ分がそのまま残る。戻る時 `pageWait()` は答え済みの問いを
  訊き直さない（`pullWait` が `PULL_GOT` を見る）ので、一枚目だけに戻ることは
  無かった ── 測った: 行数 561→561、サーバーへの問い 0 回。直す物は無かった。
- 進む・タブは一番上（今までどおり）。画面の中の `render()` は動かさない（今までどおり、測った）。
- 保存する物・消える物: 無し。`y` はメモリの足跡だけ。

### 確かめたこと（CODE CONFIRMED）
- `node tools/scroll-check.mjs` 12/12 緑: タイムライン・通知・フォロー中・プロフィール・
  辞書で「下げる→投稿を開く→戻る＝同じ位置」、一覧の行が残り問いが 0、進む＝0、
  タブ＝0、二段戻り、画面内の render、投稿画面の「下書きに？」を「いいえ」で戻る。
- 赤を見た: 修正前の `shell.js` で 7 件赤（1〜5、9、11）。`backAnswer` だけ旧形に
  戻すと 11 だけ赤。
- fast: assets・docs・es5・dead 緑、pre-commit（fast 全部＋i18n）緑。ゲートは回していない。

### 確かめていないこと・限界
- DEVICE CONFIRMED 無し。実機の WKWebView・左端スワイプで戻る時（`back()` を通るので
  同じ道だが、指で試していない）。
- スワイプ中に後ろに見せる前の画面の絵（`navKeep`/`NAVBK`）がどの位置で見えるかは
  触っていない・測っていない。
- 戻った画面が離れた時より短くなっていれば、ブラウザが届く所までで止まる。
- `www/onboard.js` 734 行（借りる一覧から描く画面へ一歩戻る）は一番上のまま。
  オンボーディングは足跡を持たない一本道なので今回の仕組みの外。変えるならリーダーの判断。
- `openForm()` が同じ form を新しい中身で開き直す時も一番上のまま（新しい中身＝進む）。

### 写真（`shots/`、ja、前＝integ-0905 の shell.js、後＝このブランチ）
`node tools/scroll-check.mjs --shot <名前>` で撮り直せる。各一覧で `-1-left`（離れる直前）と `-2-back`（戻った直後）。
- `r108-before-feed-2-back.png` ── 戻ると一番上（一行目の入力欄と「1分」の投稿）
- `r108-after-feed-2-back.png` ── 離れた所（「6分」の投稿）のまま。`r108-after-feed-1-left.png` と同じ絵
- 通知 `notif`・フォロー中 `follows`・プロフィール `profile`・辞書 `words` も同じ組で前後あり
