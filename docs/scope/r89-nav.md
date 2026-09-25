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
