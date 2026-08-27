# 統合の下ごしらえ — 衝突地図と試し merge

サブリーダーから。**master にも枝にも一切 push していません。** 使い捨ての
worktree で試して、消しました。リーダーが統合に入る前に知っておくと速い分だけ。

master `a173aa1` 時点。

## 1. 生きている枝は9本。死んだ二本は数えていない

| 枝 | 先 | master から後ろ |
|---|---|---|
| `claude/leader-handover-2026-08-25-3kz0b8` | +28 | 0 |
| `claude/kb6` | +18 | 0 |
| `claude/gram` | +12 | 0 |
| `claude/ask` | +9 | 0 |
| `claude/kb5` | +8 | 0 |
| `claude/del` | +5 | 0 |
| `claude/bar` | +4 | 0 |
| `claude/kb4` | +2 | **24** |
| `claude/plan` | +1 | **157** |
| `claude/yaa-g3pdv6`（報告のみ） | +1 | 0 |

`cowork-migration-review-wfx1ra`(+221) と `detailed-tasks-execution-ak61z2`(+216)
は master から **514 後ろ**。死んだ枝として除いています。

## 2. リーダーの枝は、もう二本を含んでいる

```
含む      claude/bar    claude/kb5
含まない  claude/kb6(+18) claude/gram(+10) claude/del(+5) claude/ask(+4)
          claude/kb4(+2) claude/plan(+1) claude/yaa-g3pdv6(+1)
```

**残りは7本。** `+` の数はリーダーの枝から見た数で、master から見た数とは違います。

## 3. 試し merge ── **コードは一つも衝突しません**

リーダーの枝の上に、一本ずつ載せてみた結果:

| 枝 | 衝突 |
|---|---|
| `claude/kb6` | `docs/CHANGELOG.md` のみ |
| `claude/gram` | `docs/CHANGELOG.md` のみ |
| `claude/ask` | `docs/CHANGELOG.md` のみ |
| `claude/del` | `docs/CHANGELOG.md` のみ |
| `claude/kb4` | **なし** |
| `claude/plan` | **なし** |
| `claude/yaa-g3pdv6` | **なし** |

**`www/keyboard.js` も `tools/kb-check.mjs` も `www/i18n/*.js` も自動で合流します。**
`kb5` と `kb6` が同じ三つのファイルに入っていますが、テキストとしてはぶつかりません。

### 積み上げると一つ増える

実際の統合は一本ずつではなく積み上げなので、その順でも通しました
（`kb6 → kb4 → kb5 → gram → ask → del → bar → plan → yaa`）:

```
kb6   CHANGELOG
kb4   なし
kb5   なし
gram  CHANGELOG
ask   CHANGELOG ＋ docs/BACKLOG.md   ← 単独では出なかった
del   CHANGELOG
bar   なし
plan  なし
yaa   なし
```

**全部で docs だけ、5回。** どれも「両側を残す」で片が付きます
（両方が Unreleased の頭に足すため）。

## 4. 積んだ木でゲートを回した ── 途中まで

**速い8本は緑**。`corners and borders in index.html: 110 (baseline 110)`、
`set from www/*.js: 0`。

**ブラウザ組は終わっていません** ── 私のコマンド側の10分制限で切れました。
**「27本緑だった」とは言えません。** ゲートはリーダーのものなので、そのまま
渡します。**テキストの衝突が無いことと、動くことは別**で、`kb5` と `kb6` が
同じ `keyboard.js` に入っている以上、意味の側で壊れていないかは
`npm run kb` が言うことです。

## 5. 前の報告の訂正 ── ⑤は「入っていない」ではなくなりました

`docs/reports/check2-2026-08-27.md` で
**「⑤ ✓▲▼ の帯 ── 入っていない」**と書きました。master に対しては今もそうですが、
**`claude/bar` が実装していて、リーダーの枝はもう含んでいます。**

```
origin/claude/bar:ios/App/App/MainViewController.swift:101
    NSSelectorFromString("inputAccessoryView")
```

**私が枝を横断して探したとき `claude/bar` はまだ立っていませんでした。**
統合後は「入った」になります。

## 6. リーダーへ、順番の提案（決めるのはあなた）

1. **`claude/plan`(157後ろ) と `claude/kb4`(24後ろ) を先に。** 古い枝ほど、
   後に回すほど遠くなります。どちらも衝突なしで入ります
2. **`kb5` と `kb6` の間にゲートを一度。** 三つのファイルを共有していて、
   テキストは通っても意味が通るとは限りません。`npm run kb` だけでも
3. **CHANGELOG は最後にまとめて整える。** 5回とも同じ形の衝突で、毎回
   両側を残すだけです。`### Blocking and reporting` が master に元から
   二つあるので、重複を数えるときはそれを除いて数えてください
