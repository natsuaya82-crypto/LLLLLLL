# r157 — 人の言語には、作った人が描いていない字を出さない

決定: docs/FEATURE_RULES.md § Owner decision log 2026-09-30
「作れる言語と DL 言語の数は 1・3・無限。人の言語は使うだけ」の最後の追記
（「DLした言語はDLした分だけ入るんだからなんで鉛筆が出るの？」「書いてない文字が入る必要があるの？」）。

## 「描いた」とは
`ltHasShape()`（`www/letters.js`）── 描いた形（`inkGeo`）か、借りた字（`l.ch`）のどちらかがある字。
「誰かがこの字に何かを作ったか」の既にある一つの問いで、サーバーの `slice_made` も同じ文を持つ。
借りた字も作った人が選んだ形なので出す。どちらも無い枠（`ltSlotsFill()` が置いたまま）が出ない字。

## 一つの問い
`ltShown(l)`（`www/sound.js`、`ltSeen()` の隣）──「開いた言語のこの字は画面に出るか」。
- 人の言語（`langTheirs(langId)`）: `ltHasShape(l)`
- 自分の言語: 今まで通り（プランが畳むなら `ltIsBase`、畳まないなら全部）

`ltSeen()` は `LETTERS.filter(ltShown)` に書き直す。字を並べる所は全部 `ltSeen()`／`ltOfKind()` を通っているので
（字の部屋 `vLtset`、目次の数 `vLetters`、読みの無い字 `ltLoose`、検索 `fHits`・`fRestHTML`・`fTodo`、
キーボードの型 `kbSecond`・`kbDefault`・`kbFlickLay`・`kbAbcLay`、キーに字を選ぶ一覧、並べ替え `ltMove`）、それで覆われる。
通っていない字の面は二つで、同じ問いを聞くように書き直す:
- `kbFixed()`／`kbNamed()`（`www/keyboard.js`）── 無料の QWERTY の字のキー。出ない字のキーは見つからない字と同じ（ローマ字のキー）。
- 字の部屋の「字の無い音」のセル（`sndCell`、鉛筆、押すと字を作る）── 字を作る道なので `langLocked()` で描かない。

`ltHidden()` は「プランが畳んだ数」だけを数える（人の言語で描いていない枠を「隠れている」とアップグレードの行に出さない）。

## 変えてよいもの
- `www/sound.js`（`ltShown`・`ltSeen`・`ltHidden`・`vLtset` の音のセル）
- `www/keyboard.js`（`kbNamed`・`kbFixed` の数字）
- `tools/taken-check.mjs`（1b を書き直し、描いていない字の数えを足す）
- `docs/CHANGELOG.md`（コードより先）、`docs/FEATURE_RULES.md`（決定ログの実装状況）
- `shots/r157-*.png`、必要なら `tools/fixture.mjs`・`tools/shot.mjs` の face

## 変えないもの
- 作った人の言語のデータ（どの slice からも何も消さない。取った側で出さないだけ）
- 自分の言語の見え方（描いていない枠は鉛筆のまま出る）
- `CLAUDE.md`、`.claude/`、`tools/pre-commit`、`tools/commit-msg`、`docs/STATE.md`

## CLAUDE.md（リーダーが直す）
このセッションは CLAUDE.md を編集できない。この変更で § Online の「It looks the same on every plan: nothing of it is folded…」の文が
「字は全部出る」と読めるので、その文の直後に一文足す（案）:

> And what of its alphabet is shown is what its maker DREW: every language
> is born with the slots (`ltSlotsFill()`), and a slot nobody drew on is not
> shown to the person who took it 「書いてない文字が入る必要があるの？」
> OWNER 2026-09-30 — not listed, not offered, not on a key. Drawn is
> `ltHasShape()`; the question is `ltShown()` (`www/sound.js`), and
> `ltSeen()` is the alphabet it lets through. Nothing leaves the maker's
> slices; `taken-check` holds it.

## 測った・残した物
- 取った言語・自分の言語の両方の「字の部屋」の fixture の face（`__past`）で、`ch`・`sh` の枠が空に見える（線はあるのに何も描かれない）。r157 の前から同じで、この変更とは関係ない。原因は確かめていない。
- 設定の言語の部屋の字数（`settings.js`、`LETTERS.length`）は数で一覧ではないので変えていない。人の言語で開けるかも確かめていない。直すかはリーダーに。
- `taken-check` が自分の言語を歩くと `form|add:kano` で落ちる（`sp` of null）── r153 から BACKLOG にある物。
