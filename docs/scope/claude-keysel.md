# claude/keysel ── キーの画面：選んだら確定、もう一度触れば解除、戻れば消える

### Scope

- **Goal:** キーに入れる文字を選ぶ画面を、**触った瞬間に書き込む**形から
  **選んで、右上の確定で書き込む**形に**書き換える**。三つは一つの振る舞い ──
  選ぶと確定のボタンが出る／同じものをもう一度触ると解除される／その画面を
  出れば選択は残っていない。

- **Owns (may change):**
  - `www/keyboard.js`
  - `www/shell.js` ── **`viewReset()` の中に行を足すことだけ。**他の行は読むだけ
  - `www/act-map.js` ── 名前の登録。**足す／外す行だけ**（規則 3 が同じコミットを
    要求するので、機械的に必要）
  - `www/i18n/{en,es,pt,fr,de,it,ru,zh,ko,ja}.js` ── 鍵を一つ足すだけ（規則 2）
  - `tools/kb-check.mjs` ── この章の主張を足す
  - `docs/CHANGELOG.md` / `docs/keyboard.md` / `docs/FEATURE_RULES.md` の
    Implementation status / `docs/scope/claude-keysel.md`

- **Does NOT own:** それ以外すべて。名指しで二つ ──
  - **`www/index.html` は `claude/swipe` のもの。CSS を一行も足さない。**
    新しい CSS がどうしても要るなら、足さずに報告する
  - **`www/shell.js` の `viewReset()` の外**（`claude/swipe` も持っている）

- **Decision it implements:**
  `docs/FEATURE_RULES.md` § Owner decision log
  「キーの画面 ── 選んだら確定ボタン、もう一度触れば解除、戻れば選択は消える」
  （2026-09-03、master `a5a3021`）

- **Check to run:** `npm run kb`（`tools/kb-check.mjs`）。**全ゲートは回さない。**
  速い九本は作業中に回す。

### 保存するものは増えない

選択は「今この画面でしていること」であって、言語が持つものではない。
`KB` にも言語にも何も足さない。`viewReset()` が忘れる画面の状態として持つ。
`JSON.stringify` は配列に付けたプロパティを落とすので、行にも鍵にも付けない
（CLAUDE.md § 19）。

### 一つの仕組みであること

**「触ったら効く」は残さない。**今そこで書き込んでいるコード
（`kbPut()` を名指しする `DO('kbPut', …)`）を、**選択を憶えるだけの形に
書き換える**。確定を足したうえで触った瞬間も効く形は、同じことを二つの
仕組みが決める形 ── CLAUDE.md「修正ではなく書き換え」。

**「戻るときに黙って適用する」形にもしない。**確定を押していないものは、
押していない。

**元に戻せること。**`kbNoted()` / `saveKb()` の一歩戻るに、**確定の一回が
一歩**として乗る。触るたびに履歴が積まれる形にはしない。

### 気づいたことは、その場で言う

止まらずに報告に書く。値段・境・削除・言葉づかい・しきい値は決めない。
