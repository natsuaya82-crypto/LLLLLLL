# claude/lapse ── 解約が、次の起動で取り消される

「プランは絶対におかしくしちゃいけないんだって」OWNER 2026-09-02

払っている人の側で、誰も触っていないのに起きます。信用の問題です。

## 症状

解約が、次の起動で恒久的に取り消されます。

```
解約 → Transaction.updates → Keychain 'free'
次の起動 → capLapse() が free を送る
        → netPlanSync() が古い pro を読む → 端末も Keychain も pro に戻る
```

## 原因 ── 順番

`www/boot.js:106` の `netResume()` は**非同期**で、まだ返っていません。
`www/boot.js:127` の `capLapse()` は**同期**で、ここで走ります。

`capLapse()` は段が動くと `netPlanUp(now)` を投げます。投げっぱなしです ──
`netPlanUp()` は成功も失敗も空関数で、**誰も答えを聞いていません。**

そのあと `netResume()` が返って `bootSession()` が走り、`netPlanSync()` が
サーバーの**古い** pro と端末の free を較べて高いほうを採り、`planKeep()` で
Keychain まで pro に書き戻します。`SET.planWas` も一緒に動くので `capLapse()`
は二度と鳴りません。

段を下げる道は `capLapse()` の投げっぱなし一本だけです。`netPlanSync()` は
定義上、上げることしかしません。

## 直し

**「高いほうを採る」は触りません。**触らなくてよくするのがこの直しです。

1. `netPlanUp()` にコールバックを持たせる
2. 送れなかったら `SET.planPend` に残す
3. `bootSession()` はその残りを**先に**送り、**その返事の中で** `netPlanSync()`
   を呼ぶ

`a6ebf1d` で `netSend()` が 401 を自分で更新して投げ直すようになっているので、
`netPlanUp()` は `netSend()` に乗っており、期限切れのトークンで投げた分は
自分で直ります。`planPend` が拾うのは**圏外で開いた起動**と、答えが返る前に
アプリが閉じられた起動です。

## 触るもの

```
www/net.js         netPlanUp() のコールバック、SET.planPend、netPlanBoot()
www/core.js        capLapse() ── 送りの向こう側
www/boot.js        bootSession() の順番
tools/store-check.mjs   規則22 ── 新しい鍵
tools/plan-check.mjs    起動の順番を測る段
docs/CHANGELOG.md  保存するものが増える
```

`ios/` は一行も要りません。`www/index.html` も要りません。

## 触らないもの

- `planBest()` と「高いほうを採る」── `netPlanSync()` の規則そのもの
- `LinguaStore.swift` の `mayLower` ── 下げていい三つの道
- `PLAN_READ_OK` ── 読めなかったことを答えとして書かない
- 誰の言語の一バイトも。`docs/PAID_FEATURES.md` の頭の規則

## 規則22 ── 書くだけでは止まらなかったので、止まるようにしました

`store-check` は `localStorage.setItem` の**鍵**だけを見ていました。
`SET.planPend` は `lingua.set` の**中の欄**なので、表に足しても
**赤くなりません**でした。

`lingua.set` は表の一行で、一度「設定です」と答えて終わっています。だから
**設定が中に持っているもの**は全部見えていませんでした ── `SET.plan`、
つまり人が払っているものも含めて。`FIELDS` を足して、`ROADS` と同じ二方向で
訊くようにしました。19 欄、3 が道つき、16 が端末のもの。

**入れた翌日に一本捕まえています。**master を取り込んだら `SET.uidWas`
（`claude/review1` が足したもの）で赤くなりました。名前を書いて緑です。

## リーダーへ ── 私のものではないので直していないもの

1. **`tools/token-check.mjs` がゲートに入っていません。**`a6ebf1d` が足した
   もので、`tools/gate.mjs` にも `package.json` にも名前がありません。
   走らせる道は、パスを手で打つことだけです。どちらのファイルも渡されて
   いないので触っていません。
2. **`plan-check` が `origin/master` で落ちていました。**502 行の
   `while (kbRoomKb())` が終わらず、2分46秒でレンダラが殺され、`Target
   crashed` が 33 行目を指すだけで八十の主張が全部黙ります。落ちるのを
   やめて名指しで赤くなるようにしました（61 で止める）。原因の
   `kbCount()` / `langOwned()` 側は `claude/review1` が直しています。
3. **`SET.wsys` は言語のものが設定に入っています。**`www/home.js` が自分の
   言葉で穴だと書いています。`store-check` に穴として名前を書きました。
