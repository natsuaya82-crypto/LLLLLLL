# r89-nav — r88 の一つの門で赤くなった word-check・kb-check

`claude/r89-nav`、`integ-0905` 6aeaaa95 から。決定: `docs/FEATURE_RULES.md`
「2026-09-25 タブで出る時の保存…」（タブで出る時も戻ると同じ「保存しますか？」）。前: `docs/scope/r88-mute2.md` A。

## やる物

- word-check（`TypeError: Cannot set properties of null (setting 'value')`、tools/word-check.mjs の evaluate）と
  kb-check（「walked off by a tab and come back to, nothing is lit and there is nothing to step back to」）の原因を測る。
- 検査が古い振る舞い（タブは訊かない）を前提にしているなら、検査を決定どおりに書き直す（検査が守っていた主張は残す）。
- アプリの穴なら `navLand()` の一つの門の中で直す（二つ目の問いを足さない）。直す前に赤、直した後に緑。
- open-check・draft-check・acct-check・act-check・press-check を一度ずつ回す。

## 持ち物（これ以外は触らない）

www/shell.js www/keyboard.js www/words.js www/wordsheet.js tools/word-check.mjs tools/kb-check.mjs
tools/keep-check.mjs tools/fixture.mjs docs/scope/r89-nav.md docs/CHANGELOG.md（振る舞いが変われば）

## 触らない物

上に無い全部。`www/index.html`、`docs/STATE.md`（リーダー）。全ゲートは回さない。

---

## 報告（2026-09-25）

**CODE CONFIRMED のみ。DEVICE CONFIRMED・OWNER CONFIRMED は無い。** 全ゲートは回していない（リーダー）。
`integ-0905` は 6aeaaa95 のまま（取り込む物なし）。**アプリは一行も変えていない ── 二つとも検査の側だった。**

### 原因（測った）

- **kb-check**: 板を変えた（`kbCut()`）画面で `goTab('feed')` を呼んだ直後を測った ── `popOn()` true、
  `NAV` は動かず（`[{"r":"feed"},{"r":"kb"},{"r":"kb","a":"1"}]`
  のまま）、未保存は `kb|1`。門が「保存しますか？」を出して止まり、検査は答えずに `go('kb')` していたので
  画面を一度も出ておらず、`kbLeft()`（`viewLeft()` から）が呼ばれる機会が無かった。
  **アプリの穴ではないことも測った**: 同じ所で「いいえ」でも「はい」（送信が着いた場合）でも、着くのは feed、
  戻ると何も光らず一歩戻りも空（before `{"h":true,"u":2}` → after `{"h":false,"u":0}`）。
- **word-check**: 519 行目の直前を測った ── `openAdd('')` の時 `NAV=[words, edit:lom, add:, edit:kano]`、
  未保存は `edit:lom` と `edit:kano`。`form add:` は道筋に既にあるので `go()` は戻る扱いになり、`edit:kano` を
  外す → 門が問いを出して止まり、`#wd-mn` が無いまま値を入れようとして TypeError。kano が未保存なのは、
  検査が `wdWrite()` を直に呼び、印を取り直す保存の道（`keepSave()`）を通っていないため。lom は道筋に残るので
  訊かれない（問いは 1 回）。

### 何をどのファイルで

| コミット | ファイル | 何を |
|---|---|---|
| ffec4319 | `tools/kb-check.mjs` | 「タブで出て戻る」を、問いが出ること・答えること・feed に着くことまで見る形に。「いいえ」と「はい」（`netSaveNow` を着いた答えに差し替え、keep-check と同じ）の両方で、戻ると何も光らず一歩戻りも無いを持つ（主張が 1 → 2） |
| 6b4d677c | `tools/word-check.mjs` | `openAdd('')` の後、出た問いに「いいえ」で答えてから＋の場面へ。下の主張は変えていない |

赤を見た: kb-check は `www/shell.js` の `viewLeft()` の `kbLeft()` を一時的に外して「はい」の主張が赤
（「いいえ」は画面の `drop` が別に忘れさせるので緑 ── 二つの道を別々に持っている）。戻して緑。
word-check は直す前の赤（TypeError）を見て、直して緑。word-check の主張は語の箱についてで、門の穴を置く物は無い。

### 振る舞い・保存する物

どちらも変わらない。アプリのコードは触っていない。保存・移行・削除なし。CHANGELOG も無し。

### 回した検査（各一回）

word-check 緑・kb-check 緑・keep-check 緑・open-check 緑・draft-check 緑・acct-check 緑・act-check 緑・
press: 一回目は検査の外の timeout（900 秒、他の検査と並走）で止まった。単独で回し直し中 ── 結果はこの行を書き換える。

### リーダーへ

- 指示が間違っていた所: 無し（見立てのうち「アプリの穴（kbLeft が呼ばれない）」の方は、測って違った）。
- 気づいた事（直していない）: word-check は `wdWrite()` を直に呼んで「保存」としている。実アプリの保存は
  `keepSave()` で、送信が着いて印を取り直す。検査の「保存した」は下書きのままの保存で、`いいえ` で戻る事がある。
  主張（箱の中身が語に入る）には効かないので今回は触っていない。
