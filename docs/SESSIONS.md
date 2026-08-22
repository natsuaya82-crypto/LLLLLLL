# Working beside other sessions

## そのまま貼るもの

リーダーは、この枠の中を丸ごとコピーして、`<>` の三か所を埋めて各セッションの
最初の指示に貼る。それだけで足りるように書いてある。

```text
── 並行セッションの規則 ──────────────────────────────
あなたの領域: <領域の名前>
あなたのブランチ: claude/<領域>
あなたが持つファイル:
  <ファイルを名前で全部。ここに無いものは持っていない>

1. 持っているファイルだけを編集する。「ちょっとだけ」も無し。
   持っていないファイルが必要になったら、そこで止めて報告する。
   回り道をしない。写しを作らない。自分で決めない。

2. www/index.html は今 <誰> が持っている。持っていないなら
   CSS を一行も足さない。

3. 最初にやること:
     git fetch --all --prune
     CLAUDE.md と docs/STATE.md と担当領域の docs/ を読む
     git log --oneline --all -40
     ↑ここまで読んでから、下の宣言を空コミットで push する。
       コードを一行も書く前に。

     ### Scope
     - Goal:
     - Owns (may change):
     - Does NOT own:      それ以外すべて
     - Decision it implements:
     - Check to run:

4. ファイルを触る前に毎回:
     git log --oneline --all -- <そのファイル>
   自分でも master でもないブランチのコミットが出たら、そこで止めて報告する。
   マージが失敗してからでは遅い。

5. コミットごとに push する。見えないブランチは避けようがない。
   一コミット一事。機能・修正・整理・改名・移行は混ぜない。

6. merge / rebase / cherry-pick は一切しない。他のブランチには触らない。
   「衝突するか見るだけ」も駄目。束ねるのはリーダー。

7. npm test は回さない（六分かかる）。回すのは、変えた場所を押さえる検査
   一つだけ、名指しで（npm run card / post / base など）。
   バグを戻して赤を見るのも、その一つだけ。全ゲートはリーダーが最後に一度。

8. 終わったら報告する:
     何を、どのファイルで変えたか
     振る舞いは何が変わるか
     保存するものは変わるか
     どの検査を回したか / 全ゲートは回していないこと
     やり残したことと、その理由
     CODE CONFIRMED / DEVICE CONFIRMED / OWNER CONFIRMED を分けて

9. 仕様を決めない。コードから仕様を読み取らない。
   迷ったら止めて訊く。緑になる間違いが一番高くつく。
──────────────────────────────────────────────
```

---

Hand this to every session, whole. It is all a session needs in order not to
collide with the others, and it is short on purpose.

「だからこうなるから最初から決めろって言ってんのに」

## Who is who

```
  the owner    decides what the app does -- behaviour, thresholds, prices,
               what is deleted, wording. Confirms it on a phone.
               → docs/FEATURE_RULES.md § owner decisions are specifications

  the leader   another session, above this one. Names what each session owns,
               integrates the branches, and runs the whole gate at the end.
               A session never does any of those three.

  you          one area, one branch, the files you were named. Nothing else.
```

Where this page says **the leader**, it means that session and not the owner.
An owner decision is still the specification; the leader says who implements
which part of it, and in which files.

---

## 1. Territory — one file, one session

**Before any work starts, the leader names the files this session owns.**
A session edits the files it owns and no others. Not "mostly". Not "just this
one line".

If the work turns out to need a file this session does not own:

```
  STOP. Report:  what you need, in which file, and why.
  Do not edit it. Do not work around it. Do not copy it.
```

That is the whole rule, and it is the only one that PREVENTS a collision.
Everything below only makes one visible sooner.

**The known hazard is `www/index.html`.** Every screen's CSS is in it, so any
change to any screen touches it, and it is where sessions collide first and
worst. Until the CSS is split by chapter, **one session at a time owns it** —
and a session that does not own it may not add a rule, however small.

---

## 2. One session, one branch

`claude/<area>`. Never anybody else's, for anything, ever.

---

## 3. The order of a session

```
  1  git fetch --all --prune
  2  read CLAUDE.md, docs/STATE.md, the docs/ for the area
  3  git log --oneline --all -40           what everybody else has pushed
  4  PUSH THE DECLARATION                  before the first line of code
  5  work
  6  push after every commit
  7  report
```

**Step 4 is not paperwork.** A session that writes for an hour before pushing
is invisible for that hour, and every other session spends it deciding against
information that is already wrong.

The declaration:

```
### Scope
- Goal:
- Owns (may change):     files, by name
- Does NOT own:          everything else
- Decision it implements: which entry in the owner decision log
- Check to run:          the one check that holds it
```

---

## 4. The collision test, before touching a file

```
  git log --oneline --all -- <file>
```

A commit there from a branch that is neither yours nor the base means another
session is in that file. **That is where you stop** — not when a merge fails,
which is hours later, after both of you have written over each other.

---

## 5. Never integrate

No `merge`, no `rebase`, no `cherry-pick` of another branch. Not even to
"check whether it conflicts".

Where two intents disagree, the leader is the one who decides which wins --
and asks the owner where the answer is a decision rather than a merge. A
session that merges on its own has produced a diff neither session wrote and
nobody can review.

Report the overlap. Stop. That is the finished job.

---

## 6. The gate is the leader's

A session runs **the one check that holds what it changed**, by name --
`npm run card`, `npm run post`. Not `npm test`: six minutes, and the leader
runs it once over everything after integrating.
→ `docs/TESTING.md` § the gate

---

## 7. What a session says when it is done

```
  what changed, and in which files
  what behaviour is different
  what is stored differently, if anything
  which check was run, and that the gate was NOT run
  what was left undone, and why
  CODE CONFIRMED / DEVICE CONFIRMED / OWNER CONFIRMED -- separately
```

---

## 8. 統合は push されるまで統合ではない

**リーダーの側の規則で、リーダーが破った。** ローカルで merge しただけの
状態で「取り込んだ」と伝えた。受け取ったセッションは `origin/master` を
見て、確かに入っていないので止めた。止めたほうが正しい。

だから:

- **リーダーは `origin/master` から報告する。** 手元のツリーからではない。
  伝える前に `git fetch -q origin master` して、その SHA を書く。
  さらに「入っているはずのもの」を一つ二つ、リモートから grep して見せる
  （`git show origin/master:www/share.js | grep -c sharePua`）。
  「merge した」は報告ではない。**押されているかどうかだけが事実。**
- **セッションは前提を確かめてから始める。** 指示が「Xが入っている前提」
  なら、`origin/master` にXがあることを自分で見てから手を動かす。
  無ければ、そこで止まって報告する。

一つ上の規則を、リーダーにも適用しただけ ──
「見えないブランチは避けようがない」。見えない統合も同じ。

---

## 9. 前提が崩れていたら、そこで止まる

一度の作業で二度あり、二度とも止めたほうが正しかった。片方は上の
push 忘れで、もう片方は指示が指していた検査に**穴があった**。

止まるときに書くこと、この順で:

```
  何を確かめたか（コマンドと、返ってきたもの）
  指示のどの前提が崩れているか
  そのまま進むと何が起きるか
  選択肢を並べ、どれを勧めるかと、その理由
```

**「たぶん大丈夫だから進めた」が一番高くつく。** 緑のまま間違ったものが
入り、それが正しいことの証拠として次の判断に使われる。

---

## 10. 領域は明け渡しと受け渡しで動く。直接は渡らない

一つのファイルを次のセッションが要るとき:

1. 持っているセッションが、**報告の中で明け渡す** ——
   「glyph.js と post.js を離しました」。触り終えただけでは足りない。
   離したと書いてあるかどうかが境界。
2. **リーダーが渡す。** セッション同士で受け渡さない。渡すときは、
   その間に入った他の変更も名指しで伝える(「相手が gh* を geHint* に
   改名済み。古い名前で grep すると空振りする」)。
3. 作業の途中で一つ足りないと分かったら、**そのファイルだけ追加で渡す。**
   最初に全部渡さない。渡していないものは持っていない。

---

## 11. リーダーの指示は間違っていることがある

この一連で二回間違えた。どちらもセッション側が気づいて直した。

- 「宣言を戻せば5ファイルぶんの苦情が出るはず」→ 出ない。`dead-check` は
  同じ名前を一件にまとめる。数えているのは名前でサイトではない。
- 「四箇所を一箇所に寄せたあと、並び順をずらせば検査が落ちるはず」→
  落ちない。一覧が一つになったので「二つの一覧が食い違う」状態が
  存在しなくなった。検査が緑なのが正しい。

**指示どおりにやって予想と違ったら、それは指示について何か分かったと
いうこと。** 黙って合わせない。合わせられる形にして通すのが一番悪い ——
検査が何も言わなくなり、誰も気づかない。
→ `docs/TESTING.md` §「起こしやすいバグではなく、人が実際にやるバグを戻す」

そして**古い docs も同じ**。backlog が「`ab` を鍵にすれば直る、改名は
`ab` を触らないから」と書いていたが、改名はまさに `ab` を書いていた。
名指しされているフィールドや関数は、動く前に一度見る。

---

## 12. 検査を先に入れる

**押さえるものを、押さえられる形にする前に作らない。** 四箇所の重複を
一箇所に寄せる作業は、寄せ先が正しいと言える検査を入れてから寄せた。
逆だと「緑のまま間違った一箇所に寄せる」ができてしまい、しかも寄せた
あとでは元の壊れ方が再現できなくなるので、**押さえていたことを一度も
確認できないまま押さえるものが変わる。**

---

## 死んでいるブランチ ── 消してよいと確認済み、まだ消えていない

中身が `master` に入りきったもの。**消す権限がこのセッションには無い**
（`git push --delete` が 403。push は通るので、拒否されているのは ref の
削除だけ）。オーナーの承認は取ってあるので、権限のある人が消してよい。
戻すなら SHA から。

| ブランチ | tip | 確認日 | なぜ消してよいか |
|---|---|---|---|
| `claude/cowork-migration-review-wfx1ra` | `e3ffe8f` | 2026-08-22 | 先行0。全部入っている |
| `claude/detailed-tasks-execution-ak61z2` | `95e73aa` | 2026-08-22 | 先行4だが、その4つの中身(`KB_MAX=3`、タイムラインのサインインの扉、無料QWERTYから始まる有料盤)は別のコミットで master にある。リモートから grep して確認済み |

消したら、この節ごと消す。表が残っていて実物も残っているのが一番紛らわしい。
