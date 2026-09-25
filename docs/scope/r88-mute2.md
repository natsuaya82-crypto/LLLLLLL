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

---

## 報告（2026-09-25）

すべて **CODE CONFIRMED のみ。DEVICE CONFIRMED・OWNER CONFIRMED は無い。** 全ゲートは回していない（リーダー）。
`integ-0905` 536881ae を取り込み済み（衝突なし、r86 の dl-check と docs/scope/r86-dl.md だけ）。
**Supabase で schema.sql を流すまで、電話では C のサーバー側は効かない。**

| 項 | コミット | 何をどのファイルで | 赤を見た | 写真 |
|---|---|---|---|---|
| A | a0c4afbe | `www/shell.js`: 「保存しますか？」を訊く所を `navLand()` 一つに移した。道筋から外れる画面（今いる所から、`to` に残らない物を上から）に変えた物があれば訊く。`back()` は `navLand(backTo())`、`backGo()` は消した。`keepSave(key, done, to)` は着いた後 `to`（無ければ一つ前）へ。`goIn()` と長押しは一回の `navLand()` に。保存が着いた後の `landed()` を印の取り直しの前に（描く画面が `GE` を手放すと、出る時にまた訊いていた ── keep-check が見つけた）。`www/keyboard.js` はコメントだけ | `keep-check` 14 を書き換え（前は「タブは訊かない」）、描く画面のタブの主張も。古い shell.js で 11 件赤 | `shots/r88-A-before-tab-left.png`・`r88-A-tab-asks.png` |
| B | 051a5c6c | `www/core.js`: `planTopFull(n, cap)`（Pro で、もう一つ入らない）、`langFull()`・`dlFull()`。`langStop()`・`dlStop()` の Pro の `up.need` の枝を消し、これを訊いて何も言わずに断る。`www/home.js`: `langAddRow()` と `wldGetRow()` の ↓ が同じ函数を訊いて描かない | `plan-check`: 古い core/home で新しい四件が赤。Plus の主張は両方で緑 | `shots/r88-B-langs-before/after.png`・`r88-B-dl-before/after.png` |
| C サーバー | 29edbadf | `supabase/schema.sql`: `feed_fo()` のリポストの枝が回した人に `mute_hides()`、`notices()` の人を訊く一か所に `mute_hides()`。`tools/rls-check.mjs` CASES 9 行 | 古い schema.sql で 3 件赤。`npm run rls` 緑（562） | 見た目同じ |
| C 端末 | e4057691 | `www/me.js` `meMutes()` が @ でも id でも答える。`www/post.js` `postMuted()` が書いた人と回した人（`by`）を訊く（自分の投稿でも） | `tl-check` 10b: 古い post/me で "111"（want 001） | `shots/r88-C-fo-before/after.png` |
| D | 3fd52d98 | `www/glyph.js` `ICON_MUTE`（`ICON_SPK` ＋ `--bad` の斜線）。`www/post.js`・`www/me.js` の「…」のミュートの行 | `tl-check` 10b: 古い post.js で赤 | `shots/r88-D-menu-not-muted.png`・`r88-D-menu-muted.png`・`r88-D-menu-muted-dark.png` |
| 状態 | 2b767a8f | `docs/FEATURE_RULES.md` その決定の Implementation status | — | — |

### 振る舞い

- A: 保存ボタンのある画面で何か変えてから、下のタブ（プロフィールの長押しも）で出ようとすると「入力内容を保存
  しますか？」。はい → 保存して押したタブへ（送れなければ画面に残る、戻ると同じ）。いいえ → 下書きを捨てて押した
  タブへ。暗い所を押すと画面に残る。**戻る以外で前の画面へ `go()` で戻る時も同じ問いが出る**（一つの門だから）。
  奥の画面（例: 字の音の表）からタブで出ると、その下の変えた画面について訊く。並べ替え中のキーボードの揺れは、
  どの道で出ても止まる（前は戻るの時だけ ── タブで出て戻ると揺れたままだった）。
- B: Pro で自分の言語 3 つ → 言語の一覧に「言語を追加」の行が無い。Pro で 3 つ取っている → まだ取っていない言語の
  記事のダウンロードの章に ↓ が無い（名前だけ）。取った言語の残りの章の ↓ はある。Free・Plus は前のまま。
- C: フォロー中に、ミュートした人がリポストした投稿が出ない（誰が書いた物でも、自分のでも）。通知の一覧に、
  ミュートした人のいいね・リポスト・返信・フォローが出ない。解くと戻る。おすすめは変わらない。
- D: 「…」のミュートの行の絵が、ミュート中は赤い斜線のスピーカー。

### 保存する物

無し。新しく書く物・動かす物・消す物は無い（サーバーは読みの条件だけ）。移行も無い。

### 回した検査

- 速い検査（es5・dead・docs・assets・sides・face・box・css-once・marks）をコミットごと、pre-commit の i18n も。
- 遅い検査は赤を見るためと、その緑の確認に: `keep-check`（A）、`plan-check`（B）、`tl-check`（C・D）、
  `npm run rls`（C、schema.sql を変えた後に一回と赤で一回）。
- **全ゲートは回していない。** A は一つの門を変えたので、道筋を動かす検査に響きうる ── `word-check`・`open-check`・
  `draft-check`・`acct-check`・`act`・`press`（タブを押す面で、変えた画面の上なら問いが出て動かなくなった）。回していない。
- `plan-check` の「so the launch after it is quiet — lapse_seen」が一度だけ赤、二回目は緑。B の前の枝では緑だった。
  別のページを読み直して 2 秒待つ主張で、B は起動で何も走らせない ── 時間の揺れと見ているが、原因は確かめていない。

### やり残し・訊くこと

1. **iPhone のプッシュ通知（C）**: ミュートした人のいいね・返信・フォローで、まだ鳴る。鳴らすかを決めるのは
   `supabase/functions/push-send/push.mjs` と schema.sql の push の節（`push_ping()`）で、持ち物の外。
   決定の「その人からの通知も出さない」をプッシュにも当てるなら、そこを持つ session が要る。
2. **おすすめ（C）**: `feed_hot()` はリポストの行を持たないので触っていない。ただ、ミュートした人のいいね・リポストは
   おすすめの並び（点数）には今も数えられる。数えないかは決めていない。
3. **投稿欄（A）**: 投稿を書いている途中は「戻る」だけが「下書きに入れますか？」を訊く（`backDraftKept()`）。タブで出る時は
   訊かない（今のまま）。決定は「保存ボタンのある画面」なので広げていない。揃えるかはオーナー。
4. **D の赤の置き方**: `index.html` には一行も足していない。赤は斜線の path が `style="stroke:var(--bad)"` で名指す
   （新しい色は無い、`act-check` の「色を直に書かない」は通る）。ただしスタイルシートの外に置いたスタイルではある。
   CSS に移すなら `.pmi svg .mute` のような一行が `index.html` に要る。
5. **リポストの行（C で見えた事、直していない）**: フォロー中のリポストの行に「誰が回したか」が出ていない
   （`shots/r88-C-fo-before.png` ── Kiyo の投稿に Yun の名前が無い）。`p.by` は id で、名前に引いて描く所が無い。
6. `tools/dl-check.mjs` は r86 が触っていたので、B の ↓ は `plan-check` で持った（dl-check は触っていない）。

### 持ち物の外で、今回の変更で偽になった文（リーダーへ）

- `docs/FEATURES.md:587-590`「somebody already on the top rung gets a sentence rather than a dialog」── 今は ↓ が出ない。
- `docs/STATE.md` 4a（この決定の行）── 実装済みに。`docs/STATE.md:40` のミュートの行に「リポストと通知も」。
- 直した（持ち物）: `www/shell.js` § KEEP の「A bottom tab is not one of them」、`www/home.js` の `langAddRow()` の上の
  「drawn on every plan」、`www/keyboard.js` の `backGo()`、`tools/keep-check.mjs` 14 の見出し。

### リーダーの指示が違っていた所

- **C の `feed_hot`**: リポストの行が無いので「外す」物が無い（上の 2）。
- **C の「サーバー側で外す形」**: サーバーだけだと、ミュートを押した時に手元に持っていたフォロー中の写しにリポストが
  残る。r85 の `postMuted()` と同じ一つの函数を広げた（端末のコミットを別にした）。
- **B の「plan-check / dl-check」**: dl-check は r86 の変更が取り込み前だったので使わなかった（取り込みは今日済んだ）。
