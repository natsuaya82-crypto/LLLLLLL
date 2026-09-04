# claude/kbfree2 ── ＋は右下。上限を越えて押したときにポップが出る。無料に空の枠は並べない

```
＋は右下につけて
プラスは5個目以降
無料は1個目以降
ポップが出るように

編集ボタンも無料はいらんやろ

課金からフリーの隠すルールも全部に適応ささてね
```
OWNER 2026-09-04

**2026-09-03 の「有料と同じ数の枠が並び、二つ目以降は押すとプランへ」は
SUPERSEDED です**（`docs/FEATURE_RULES.md`）。**そのとおりには作りません。**
この枝の前の版がそれを実装していて、それが今 master に入っている状態です。
今回はその上に条件を足すのではなく、**枠そのものを消します。**

## いま起きていること

無料のキーボードの画面に「キーボード1・2・3・4」の四行が並び、2〜4 は中身が
ありません。`kbSlots()`（`www/keyboard.js:979`）が無料で `PLUS_KB`（4）を答え、
`kbFrameHTML()` が空の行を三つ描いています。**持っていない物を三つ、在るように
見せている**わけです。有料は `kbBoards().length` しか並ばないので、
**一つしか持てない人が一番たくさんの行を見せられている。**

## 作るもの

- **一覧は持っている数だけ。**`kbSlots()` と `kbFrameHTML()` を消し、
  `kbListHTML()` は `kbBoards()` をそのまま描く。無料は一行
- **＋は右下に、無料にも有料にも、同じ形で。**`.fab` は今も右下。
  `kbRoomKb()` の条件を外し、**常に出す**（選択中と他人の言語を除く）
- **＋を押したときに上限に届いていればポップ。**届いていなければ今までどおり
  柄を選ぶ画面。**一箇所にする** ── `kbCapStop()` を作り、`kbNew()`（戸口）と
  `kbAdd()`（書く方）の両方がそれを呼ぶ。今 `kbAdd()` に在る二つの門と
  `kbNew()` の一つは、そこへ移すだけで、**二箇所目を足しません**
  - 無料 ── `upStop(can('kb'))`、`t('up.need')`。他の＋と同じポップ
  - Plus で 4 枚 ── `t('kb.full', kbCap())`。**新しい鍵も新しい数も作りません**
  - Pro ── `kbCap()` が Infinity なので出ません
- **無料に編集は出さない。**無料の board 0 の行は、開く矢印（`ICON_GO`）も
  押せる `<button>` も持たない。中身は絵と名前だけ

**数は `www/core.js:791` のものを読むだけです**（`FREE_KB=1`、`PLUS_KB=4`、
`kbCap()`）。`core.js` は `claude/keep3` のものなので**読むだけ**で、
数を変える必要が出たらリーダーに報告します。

## 消す古い文 ── 同じコミットで

「歴史として残す」はしません（CLAUDE.md）。

- `www/keyboard.js:969` `kbSlots()` の上のコメント（枠の説明）
- `www/keyboard.js:979` `kbSlots()` そのもの
- `www/keyboard.js:2376` `kbFrameHTML()` の上のコメントと関数
- `www/keyboard.js` `vKb()` の上のコメントのうち、
  「What the free plan has instead of the + is the FRAMES」と
  「The round + is not lost either… which is never on this plan」の二段落
- `tools/kb-check.mjs:1708` の章の見出しと `freeSlots`（:1720）
- `tools/kb-check.mjs:3442` の章と、枠についての主張ぜんぶ

## 検査 ── 先に書き換えて、赤を見てから直します

`tools/kb-check.mjs` はいま古い決定を assert しているので、**書き換えるのが
仕事の一部**です。新しく持たせるもの:

- 無料の一覧は**一行**（`kbBoards().length`）で、空の枠が無いこと
- その一行に開く矢印が無く、押せないこと
- ＋が**無料にも有料にも**在り、右下であること
- 無料で＋を押すとポップが出て、はいでプランへ行き、**盤は増えていない**こと
- Plus で 4 枚のとき＋を押すとポップ（5個目）、3 枚のときは柄の画面が開くこと
- Pro では＋がポップを出さないこと

**全部、直す前に赤を見ます。**

## スクリーンショット

`node tools/shot.mjs --lang ja kb`、有料は `--half`。四枚:
無料の一覧／無料で＋を押してポップ／有料の一覧／有料で上限に届いて＋。
`shots/` は gitignore なので `git add -f`。

## 私のファイル

```
www/keyboard.js
tools/kb-check.mjs
tools/fixture.mjs
docs/keyboard.md
docs/CHANGELOG.md
docs/scope/claude-kbfree2.md
```

**`www/index.html` は `claude/pop` のものです。触りません。**CSS が要ると
分かったら一行で報告して先へ進みます（`.fab` は既に在るので要らない見込み）。
`www/net.js` `www/post.js` `www/rec.js` `www/card.js` は `claude/post3`、
`www/core.js` `www/letters.js` `www/backup.js` `www/sync.js` は `claude/keep3`。
`docs/FEATURE_RULES.md` `docs/STATE.md` `CLAUDE.md` はリーダーのものです。

## 最後の一行 ──「課金からフリーの隠すルールも全部に適応ささてね」

**あるプランでできないことは、空の枠や灰色の行として見せるのではなく、出さない。**
押した瞬間にポップで伝える。**自分の territory の中で** `can()` を呼んでいる所を
全部あたります。**territory の外に見つけたら、直さずに一行で報告します。**

## 言えないこと

**全ゲートは回しません**（`docs/SESSIONS.md`）。`npm run kb` だけ。
実機は `DEVICE CONFIRMED` で、別の文です。
