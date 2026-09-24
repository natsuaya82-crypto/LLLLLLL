# r76-lines — 言語の行と字の形を一つの物差しに（2026-09-23）

`claude/r76-lines`、`origin/integ-0905` 0dc7d3c2 から。r73 §2-11・§2-12・§0 #8。

## 覆う一文

- **字の形**: 「形があるか・何かは `inkGeo()` だけ、どちらの種類かは `inkRings()`、書くのは
  `inkSet()` だけ（`www/glyph.js`）。字は `st` か `sh` のどちらか一つ。」
  `tools/ink-check.mjs` A が www/ の `.st`・`.sh` を**全部**数える（今 115）。ink の三つの中、
  字でない物（`CARRIERS` ── 切った一字、編集中の線、書体の def、用紙から読んだ字）、
  持っていないファイルに残る物（`OWED`、合わなくなったら落ちる）のどれかでなければ落ちる。
  明日 `l.st` と書けば明日落ちる。
- **一行の上の一字**: 「字が言語の一行の上で何になるかは `ltLineChar()` が答える ── 自作文字が
  オンで形があれば `inkChar()`、でなければローマ字（何をローマ字とするかは呼び手）。」
  `ink-check` B（オフで暦・時計・時刻の形 0、借りた字だけの数字はローマ字、描いた数字は形 1）。

## 直した物（commit 順）

| 何 | どこ | 前 | 測った |
|---|---|---|---|
| 決定「一行を描く仕組みを一つに」を決定ログへ | FEATURE_RULES | CLAUDE.md 規則 8 にしか無かった | — |
| 用紙の数字が基数を下げると消えた | numbers.js `numBlank` → `ltHasShape()` | `l.st` だけ訊いた | A1 赤→緑 |
| 用紙の字を無料の枠へ名前で入れると形が消えた | letters.js `ltSetRoman` → `inkSet` | `st` だけ写して元を消した | A2 |
| 用紙の字に描き直しても出ない | letters.js `ltSetStrokes`/`ltSetChar`/枠を消す/`ltNew` → `inkSet` | `sh` が残って勝った | A3 |
| ウィジェットの月・曜日が用紙の字をローマ字に | share.js `shareWordAll`・`shareSep` | `l.st` | A4 |
| さがすの字のキーに用紙の字の顔が無い | home.js `fLtkHTML`・`fTodo` | `l.st` | A5、写真 `r76-sheet-find-*` |
| アブギダの記号が用紙だと「記号が無い」 | sound.js `abMark()`（輪は格子に寄せない） | `l.st` | 静的 |
| 線だけを返す二つ目の答え | letters.js `ltStrokes()` を消した、wsys.js `wsStrokes` | — | 静的 |
| 暦・時計の数字がオフでも形・借りた字 | numbers.js `numSignHTML` → glyph.js `ltLineChar()` | 自分で決めていた | B1・B2、写真 `r76-cal-*` |
| 欄が自作文字を着るかの判断が三か所 | glyph.js `myFontField()`（振る舞いは同じ） | 同じ式を三度 | — |
| `sfontHTML` の偽のコメント | glyph.js | 「もう誰も myFontOn を訊かない」 | — |

`tools/import-check.mjs` は持ち物の外だが一行足した: letters.js を単独で eval するので、ink の塊を
glyph.js から切り出して渡す（core.js の保管庫と同じやり方）。`ltNew` が `inkSet` を呼ぶため。

## 持っていないファイル ── 同じ一文でこう直す（r60 の後の session へ）

**字の形（`ink-check` の `OWED`、直したら行を消す）**
- `www/keyboard.js:1318` キーの顔 `l.st && l.st.length` → `inkGeo(l)`。用紙の字のキーが顔無しになる。
- `www/me.js:103` `meAvOf` `{st:l.st}` → `var g=inkGeo(l); if(g) return {st:g}`（`inkDef` が輪も読む）。
  用紙の字を顔にできない。
- `www/sheet.js:1545` `d.sh = g.sh` → `inkSet(d, g.sh)`。

**一行（r73 §2-11、決まっている物）**
- 写真の上の字（`www/post.js`）: `pwMarkCut` が `postCut`（名前で切る）で、打った通りに切らない。
  空白 440 固定、改行が消える（`pwMarkLines`/`pwMarkRun`）。**`postRuns()` で分け、形は `inkAdv()`、
  空白は `inkSpace()`、切り方は投稿と同じ一か所**。r73 が測った。
- 下書き一覧 `.dfl`（`www/post.js:804,811`）: 生の PUA を UI の書体で出す。`puaRoman()` を通すか、
  下書きが持つ ink で `inkChar` にする。どちらかはその session が決める前に r73 §2-10 を読むこと
  （下書きは PUA を生のままサーバーへ上げている、と r73）。
- 通知 `www/sns.js:3330` とモデレーション `www/mod.js:156` の `p.ln`: 生のローマ字。行として
  描くには投稿の `ink` が要り、通報の行は `ln` しか持たない（`net.js`）。**モデレーションで ink を
  描くかは決まっていない** ── 下の「オーナーへ」。mod.js は触っていない。
- 投稿欄 `www/post.js:1575` は `.tfont` を無条件で着る。他の三つの欄は `myFontField()` を訊く。
  どちらに揃えるかは §5-14（下）。

## 自分のファイルで直さなかった物と理由

- **`ltHasShape()` と `ltDrawn()` が同じ関数**（letters.js:81・569）。どちらを消しても持っていない
  ファイルを直すことになる（`ltDrawn`: sync.js・base/again/kb-check、`ltHasShape`: home.js の
  持ち範囲の外 806・2070、sides/card-check）。一つにする session に渡す。
- **検査「言語の行を出す要素の種類数」** は作っていない。数える先の数（いくつが正しいか）が
  §5-8・§5-14 の答え次第で、今の数を凍らせると「決まった数」に見える。
- **写真の上の字の改行と空白、`.dfl` の PUA = 0** の検査も作っていない ── post.js が直るまで
  赤しか出ない。直す session が `ink-check` に足す。
- `wsys.js` の字間の見本 `spPv` は `ltLineChar` を訊かない: 字間を決めるための形の見本で、語の
  表示ではない（オフでも形を見せる）。違うと言われたら一行で替わる。
- `tools/line-path.mjs`（実験、ゲートの外）が `ltStrokes` を `typeof` で訊いている。消した関数
  なので null になる。持ち物の外。

## オーナーへ（決めない）

1. **ウィジェットの見本と本物**: 数字の部屋の「ホーム画面では」は、切っていればローマ字になった。
   ホーム画面のウィジェット（Swift、`shareFace()`）はスイッチを知らず、描いた形を出す。
   見本も本物もスイッチに従うか、どちらも従わないか。
2. 例文・文法の行（`.sfont`）が「一行を描く仕組みを一つに」に入るか（r73 §5-8）。
3. 語をつづる欄を自作文字にするか（r73 §5-14）。答えは `myFontField()` の一行と、投稿欄。
4. モデレーション・通知の行を ink で描くか、ローマ字で読むか。
5. 用紙の字に描き直すと用紙の形は消える（CHANGELOG の DELETE REVIEW）── 線の字と同じ扱いに
   したが、編集画面は用紙の字を空の紙で開く（輪は線として編めない）。前の形を下敷きに見せるか。
