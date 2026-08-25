# Working beside other sessions

## セッションは作って、終わったら消す ── OWNER DECISION 2026-08-25

「セッション作って終わったら消す、作って消すにしよう。そうすればトークンも
無駄にならない」

一つの仕事に一つのセッション。**指示は生まれた瞬間に持っている**（`create_session`
の prompt が指示そのもの）。終わったら畳む。次の仕事は次のセッション。

これは好みではなく、この環境で実際に動く唯一の形として決まった。2026-08-25 に
測った:

- リーダーから既にあるセッションへ**言葉を届ける口は無い**。`ListAgents` は誰も
  返さず、`SendMessage` は名前でも ID でも通らない。`send_message` という道具は
  製品には在る（`create_session` の説明が自分でそう書いている）が、この
  セッションの道具箱には配られていない。受け取る側は開いている
  （`cross_session_inbound: available` が全員に立っている）ので、塞がっている
  のは「相手を見つける」半分だけ。
- リーダーに在るのは **立てる・止める・畳む・名前を変える** の四つ。
- だから「後から言う」は成立しない。**言えるのは生まれる瞬間だけ。**

長く生きたセッションは、それだけで高くつく。2026-08-25 に畳んだ二つは、
片方が 2.4 億トークンの cache read、もう片方が 4200 万だった。仕事はとうに
master に入っていて、生きている理由は「まだ開いているから」以外に無かった。

**報告は remote で受ける。** チャットではなく、commit と push と、最初に押す
Scope の空コミット。`docs/SESSIONS.md` は元々そう書いている ── 「セッションが
共有するものは remote ただ一つ」。2026-08-25 の取り込みは、誰とも一言も
喋らずに remote だけで済んだ。

畳むのは戻せる（`unarchive_session`）が、戻す前に確かめること: **そのセッション
のチャットにしか無い事実が無いか。** 同じ日に畳んだ一つは「オーナー待ちが 4 件
残っている」と言い残していて、畳む前に `docs/STATE.md` §7 に全部あることを
確かめた。無ければ、畳む前に書き写す。

## 追いつくのは自分で、束ねるのはリーダー ── OWNER DECISION 2026-08-25

規則 6 は「merge / rebase / cherry-pick を一切しない」だった。**他の枝**につい
てはそのまま。**master を自分の枝に入れることは、そこから外す。**

  他の枝を取り込む     禁止。リーダーの仕事
  master を取り込む    **報告の前に必ずやる。** 自分に追いつかせるだけ

なぜ変えたか。2026-08-25 に四つの枝を束ねて、衝突は四箇所出た。**四箇所とも
「枝が古い」から出ている**（52 後ろ、86 後ろ、456 後ろ）。二人が本当に同じ行を
欲しがった衝突は**ゼロ**だった。一つは 456 後ろで、四つのコミットが全部 master
の済んだ話をやり直していたので取り込まずに落とした。

そして詰まっていたのはリーダーだった。枝が届くたびに解いて、六分のゲートを
回して、押す。働き手は終わっても、その列に並んで止まる。追いつきを働き手に
返すと、リーダーの取り込みは `--ff-only` になり、解く仕事が消える。

一緒に決めたこと二つ:

- **束ねるのは枝ごとではなく、溜めて一回。** ゲートも一回。同じ緑を四度
  証明しない。
- **働き手の最後の仕事は、次の Scope を書いて push すること。** 終わった瞬間に
  リーダー待ちで止まらないように。

## 指示は硬い所と柔らかい所を分けて書く ── OWNER DECISION 2026-08-25

「指示はガチガチでなくて、バグを発見した時に柔軟に報告できるようにして欲しい」
「プラスして君が間違えてる可能性もあるから」

指示の中身は二種類あって、混ぜると片方が壊れる。

**硬い所 ── 破ると戻せないもの。ここは動かさない。**

```
  持っていないファイルを触らない
  merge / rebase / cherry-pick をしない
  コミットごとに push する
  全ゲートを回さない（リーダーが最後に一度）
  値段・自由と有料の境・削除・保存の期間・言葉づかい・しきい値を決めない
  iOS のビルドを回さない
  人が作ったものを消さない
```

**柔らかい所 ── リーダーの見立て。間違っていることがある。**

```
  どう作るか、どの順で、どの関数を触るか
  「なぜそうなっているか」の説明
  リーダーが名指しした継ぎ目（lt.sh のような）
  「そのまま移せ」「触るな」の類
```

柔らかい所は**提案として書き、提案として読む**。違うと思ったら、止まらずに
言う ── 報告の最後の行がそれのためにある。硬い所を破りそうなときだけ止まる。

なぜ分けるか。2026-08-25、リーダーは「wound() が全部の輪を一つの向きに揃える
ので穴が埋まる」と書いて配った。あとで otf5.js を読んだら逆だった ── 穴を
壊すのは wound() ではなく、輪が凸でないこと（spanAt が「一つの高さで一区間」
を前提にしている）。そのまま実装されていたら、間違った直しが検査つきで積まれ、
検査が間違いを固定していた。**リーダーの「なぜ」はコードを読んだ推測であって
仕様ではない。**

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
   回り道をしない。写しを作らない。

   **ただし「自分で決めない」は、決めごとの話であって、気づきの話ではない。**
   値段・自由と有料の境・削除・保存の期間・言葉づかい・しきい値は決めない。
   バグ・矛盾・「この指示は間違っている」は、見つけたらその場で言う。
   止まらなくていい ── 手が動く分は動かして、報告に書く。

2. www/index.html は今 <誰> が持っている。持っていないなら
   CSS を一行も足さない。

3. 最初にやること（**自動でやられる**。`.claude/hooks/session-start.sh` が
   セッション開始時に走って、fetch と、他のブランチの状況と、いま
   `www/index.html` を誰が触っているかを画面に出す。出ていなければ
   フックが動いていないので、そう言うこと）:
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

6. **他の枝**には触らない。merge も rebase も cherry-pick も、
   「衝突するか見るだけ」も駄目。束ねるのはリーダー。

   **master を自分の枝に入れるのは、これに当たらない。** それは他人に触って
   いない ── 追いつくことであって、束ねることではない。**報告する前に必ず
   やる**（`git fetch --all --prune && git merge origin/master`）。衝突が出たら
   自分で解く。自分の枝の中の話なので。手に負えない衝突が出たら、そこで止めて
   報告する ── それは二人が本当に同じ行を欲しがった、数少ない場合。

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
     **リーダーの指示が間違っていた所**（あれば。無ければ「無し」と書く）

   最後の一行は飾りではない。**リーダーは間違える。** 実際に間違えている:
   同じ日に「wound() が穴を埋める」と書いて配り、あとで otf5.js を読んで
   逆だった（穴を壊すのは wound() ではなく、輪が凸でないこと）。配られた
   指示をそのまま実装していたら、間違ったものが検査つきで積まれていた。
   指示の中の「なぜ」は、リーダーがコードを読んで書いた推測であって、
   仕様ではない。読んで違うと思ったら、そう言うこと。

9. 仕様を決めない。コードから仕様を読み取らない。
   迷ったら止めて訊く。緑になる間違いが一番高くつく。
──────────────────────────────────────────────
```

---

Hand this to every session, whole. It is all a session needs in order not to
collide with the others, and it is short on purpose.

「だからこうなるから最初から決めろって言ってんのに」

## セッション開始で自動的に起きること

`.claude/hooks/session-start.sh`。まっさらなクローンで始まるセッションが
「最初にやること」を、人の記憶に頼らずやる。三つ:

1. **`git config core.hooksPath tools`** ── `tools/pre-commit` を入れる。
   これはローカルの git 設定なのでクローンに付いてこない。打たないセッ
   ションは速い検査を一度も走らせない。長いあいだ誰も打っていなかった。
2. **`npm install`** ── 落ちてもセッションは止まらない。検査はグローバルの
   playwright に落ちる。
3. **誰が木の中に居るか** ── `origin/master` の SHA、master より進んでいる
   ブランチ、そして **`www/index.html` を触っているブランチ**。規則4を
   人が思い出す前に画面に出す。

書いた直後にこれが11コミット拾った。解散を伝えた二つのセッションが、その
あとも進めていた。数秒。

**画面にこれが出ていなければ、フックが動いていない。** そう報告すること。
黙って自分で `git fetch` して続けるのは、次のセッションが同じ穴に落ちる
という意味なので。

---

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
