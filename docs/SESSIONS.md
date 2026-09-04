# Working beside other sessions

## ブランチも、終わったら消す ── OWNER DECISION 2026-09-04

「ブランチも古いもんは消せって言ってるよな？」

**言われていたのに、この日まで一行も書かれていませんでした。**だから 140 本
溜まり、うち 91 本が取り込まれないまま残りました。書かれていない規則は、
守られていないのと同じです。

- **master に取り込んだブランチは、取り込んだ人が消す。**中身は master に
  あるので、消しても何も失われません。取り込みはリーダーの仕事なので、
  削除もリーダーの仕事です。
- **取り込まれていない古いブランチは、消す前に一本ずつ中身を見る。**そこに
  しか無い commit があります。まとめて消してはいけません。
  `docs/DATA_SAFETY.md` の DELETE REVIEW と同じ扱いです。

**このセッションの権限では消せませんでした** ── `git push origin --delete` が
403 で拒まれます。commit の push は通るので、拒まれているのは削除だけです。
GitHub の画面か、権限を持つ側から消してください。**次のリーダーは、まず
自分が消せるかどうかを一本で試してください。**

---

## セッションは作って、終わったら消す ── OWNER DECISION 2026-08-25

「セッション作って終わったら消す、作って消すにしよう。そうすればトークンも
無駄にならない」

一つの仕事に一つのセッション。**指示は生まれた瞬間に持っている**（`create_session`
の prompt が指示そのもの）。終わったら畳む。次の仕事は次のセッション。

これは好みではなく、この環境で実際に動く唯一の形として決まった。2026-08-25 に
測った:

- `ListAgents` は誰も返さず、`SendMessage` は名前でも ID でも通らない。
  `send_message` という道具は製品には在る（`create_session` の説明が自分で
  そう書いている）が、このセッションの道具箱には配られていない。受け取る側は
  開いている（`cross_session_inbound: available` が全員に立っている）ので、
  塞がっているのは「相手を見つける」半分だけ。

**訂正 2026-08-25 ── 道はあった。この節は一日だけ嘘をついていた。**

上の三行から「だからリーダーからセッションへ言葉を届ける口は無い」「言えるのは
生まれる瞬間だけ」を結論していたが、**別の道具が通る**:

```
  create_trigger(persistent_session_id: "session_...", prompt: "...")
  fire_trigger(trigger_id: "trig_...")
```

`create_trigger` の説明が自分でそう書いている ── 「(2) persistent_session_id
set — fires into a SPECIFIC OTHER SESSION you name」。`cron_expression` も
`run_once_at` も省くと自分では発火しない Routine になり、`fire_trigger` が
その場で撃つ。走っているセッションに、ユーザーの発言として届く。

実際に通した。`claude/post` が報告【3】に「オーナーに一つだけ訊いてもらえれば
片が付く」と書いて止まっていたので、オーナーの答えとスクリーンショットの読みを
送った。発火した秒に相手の `updated_at` が動き、`SESSION_STATUS_RUNNING` の
まま作業を続けた。

**なぜ間違えたか、が残す価値のある方。** `SendMessage` と `ListAgents` という
「メッセージを送る道具」を二つ試して両方通らなかったので、**道具の名前で
探すのをやめてしまった。** 通ったのは「予定を組む道具」で、名前のどこにも
message と書いていない。**道具箱を機能で読み直していれば一日早く見つかっていた。**

だから「言えるのは生まれる瞬間だけ」は**もう正しくない**。それでも
「指示は生まれた瞬間に全部持たせる」はやめないこと ── 後から言えることと、
後から言えばいいことは別で、2026-08-25 の四つの詰まり（act-map.js、docs/、
検査の名指し、index.html の一行）は全部、最初の指示で territory を間違えた
ことが原因だった。**送れる道があることは、territory を雑に切ってよい理由に
ならない。**

- リーダーに在るのは **立てる・止める・畳む・名前を変える・送る** の五つ。
- 畳んだセッションにも送れる。`unarchive_session` で起こしてから撃つ。

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

## 追いつくのは自分で、束ねるのはサブリーダー ── OWNER DECISION 2026-08-25 / 08-28

規則 6 は「merge / rebase / cherry-pick を一切しない」だった。**他の枝**につい
てはそのまま。**master を自分の枝に入れることは、そこから外す。**

  他の枝を取り込む     禁止。**サブリーダーの仕事。居なければリーダー**
                       （OWNER 2026-08-28）
  master を取り込む    **報告の前に必ずやる。** 自分に追いつかせるだけ

なぜ変えたか。2026-08-25 に四つの枝を束ねて、衝突は四箇所出た。**四箇所とも
「枝が古い」から出ている**（52 後ろ、86 後ろ、456 後ろ）。二人が本当に同じ行を
欲しがった衝突は**ゼロ**だった。一つは 456 後ろで、四つのコミットが全部 master
の済んだ話をやり直していたので取り込まずに落とした。

そして詰まっていたのは束ねる側だった。枝が届くたびに解いて、ゲートを回して、
押す。働き手は終わっても、その列に並んで止まる。追いつきを働き手に返すと、
束ねる側の取り込みは `--ff-only` になり、解く仕事が消える。

**束ねるのはサブリーダーです**（OWNER 2026-08-28「取り込むのはサブリね？」）。
**サブリーダーが居ないときはリーダーが取り込みます**（同じ日、連絡が届かないと
報告したうえで「じゃあ君が取り込んで」）。
取り込んで、そのままゲート28本を回す ── 取り込んだ形でしか全部は緑にならない
ので、取り込む人と回す人は同じです。リーダーは配ってビルドを引く。

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

7. **赤を見るのは作業、緑を見るのは検証。作業は本人にしかできず、検証はまとめ
   られる。** 2026-08-27 にオーナーが数えた ──「キーボードと文法がリアルに
   5〜6時間動いてるんだけど、長すぎない？ ゲートが緑になる確認は…まとめて。
   個人個人でやる必要ある？」

   **速い八つ（約2秒）は好きなだけ回す。** ES5・script タグ・死んだコード・
   角丸で、落ちると端末が真っ白になる種類。`tools/pre-commit` が毎コミット
   回している。

   **遅い二十は、赤を見るためだけに回す。** バグを戻して、担当の検査が落ちる
   のを一度見る。**そのあと直したら、緑を見に行かずに push する。**
   `npm run press` は五分、`kb` も重い ── その五分を、本人と、サブリーダーと、
   リーダーで三回払うと十五分になり、**三回目の緑が二回目より本当になることは
   ない。**

   **緑は取り込んだ人が、取り込んだあとに一度。** 全ゲート28本。取り込むのも
   回すのも同じ人です（OWNER 2026-08-28）。サブリーダーが居なければリーダー。

   **そしてビルドが先、ゲートが後。**「先に確認したいから、全部取り込んだら君が
   ビルド出して、ゲートはビルド出してから確認でいいよ」OWNER 2026-08-28。
   **ビルドを引くのはオーナーが言ったときだけ。**「全部終わったら」はオーナーが
   「全部終わった」と言うまで満たされない ── 2026-08-28、リーダーがそれを
   「取り込みが終わったら」と読み替えて #99 を無断で出した。**前にもらった許可を
   次の回に使い回さない。毎回その場で取る。**言われたらすぐ引き、ゲートはその裏で
   回す。ここで見つかる
   種類のバグは端末を持っている人が見つけるもので、**ビルドの中身を一度も
   変えたことのない緑を十六分待つ**のは、その十六分だけ誰もアプリを見ていない
   ということ。赤が出たら直してもう一度出す ── 待つより安い。

   リーダーへ: **セッションに「一度回して緑を見て」と言わないこと。** 2026-08-27
   にリーダーが何度もそう指示して、そのぶんそのまま遅れた。追いついた直後の
   確認も、取り込みのときにまとめて出る。

   取り込んだゲートが赤なら、そのとき枝ごとに担当の検査を一本ずつ回して切り
   分ける ── **一回のデバッグ**であって、毎回全員が緑を払うのとは釣り合わない。

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

## Who is who ── OWNER DECISION 2026-08-27

```
  the owner        decides what the app does -- behaviour, thresholds, prices,
                   what is deleted, wording. Confirms it on a phone.
                   → docs/FEATURE_RULES.md § owner decisions are specifications

  the leader       one session. Takes the owner's words, works out what they
                   mean, names what each session owns, and dispatches.
                   **Until release, says so when what the owner asks for is a
                   feature rather than a hole or a bug** (OWNER 2026-09-01
                   「俺が機能追加しようとしてたら確認して欲しい」) -- before
                   starting it, not after. The owner decides; the leader is
                   the one who has to notice. Triggers
                   the build when the owner says so. Integrates and runs the
                   gate **only when there is no sub-leader** -- both are
                   sub-leader ①'s otherwise (OWNER 2026-08-28). Writes no
                   feature code either, ever: the leader dispatches, the
                   sessions write.

  sub-leader ①     takes what the sessions push, integrates it, and makes the
  (green)          gate GREEN. The gate is run here, once, and nowhere else.

  sub-leader ②     reads what the other sessions actually did -- the diffs, not
  (check)          their reports -- and says where it is wrong. Writes no
                   feature code.

  you              one area, one branch, the files you were named. Nothing else.
```

**オーナーはリーダーにしか話しかけません。** So:

- A session's question goes **to the leader**, never to the owner and never to
  another session. The leader collects them and asks the owner in one batch.
- The owner sometimes answers **inside** a session instead. That session then
  **reports the answer up to the leader** — otherwise the leader is dispatching
  from a spec it has never seen.
- **The leader does not decide.** 「確認して伝えて承認が出てから直せや」OWNER
  2026-08-27 — investigate, report, wait for the owner's approval, and only then
  dispatch. A leader that guesses is one wrong reading landing on every branch.

**トークンを使いすぎない。** Weekly limit, and it went past 70% in three days.
So: no session runs the gate to see it green (§6), no session is left open with
nothing to do, and a report is what changed and what it breaks — not a retelling
of the work.

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
- Check to run:          none. Push; the sub-leader runs the gate
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

**Watching a check go RED is work; watching it go GREEN is verification.
Only the author can do the first. The second can be done once, for everybody.**

- **The fast eight (~2s): run them freely.** ES5, a missing script tag, dead
  code, a corner -- the kinds that blank a device. `tools/pre-commit` runs
  them on every commit anyway.
- **The slow twenty: run ONE, and only to watch the bug go red.** Put the bug
  back, see the check that holds it fail, take the bug out -- then **push
  without running it green.** `npm run press` is five minutes; paid by the
  session, the sub-leader and the leader it is fifteen, and the third green is
  not truer than the second.
- **The green belongs to the leader and the sub-leader, once, after
  integrating.** All 28.

**Leaders: do not ask a session to "run it once and see green".** That was
done repeatedly on 2026-08-27 and the delay was exactly the sum of it.

If the integrated gate goes red, run the one check per branch then to find
which -- one debugging session, against everyone paying for green every time.
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

## 死んでいるブランチ ── 二本、そして「5万行消える」の正体

**2026-08-25 に測り直した。** 表は 2026-08-22 のもので、腐ってはいなかったが
**足りなかった** ── 二本は同じ理由で死んでいるのではないのに、一つの列に
並んでいた。並べ方のほうが危なかったので、節ごと書き直す。

`master` は `66634f6`。数字はここから。

| ブランチ | tip | 未収録 | merge したらどうなるか |
|---|---|---|---|
| `claude/cowork-migration-review-wfx1ra` | `e3ffe8f` | **0** | **何も起きない。** 結果の tree が `master` の tree と一バイト違わない |
| `claude/detailed-tasks-execution-ak61z2` | `95e73aa` | **4** | **衝突する。** そして四つの中身は既に master にある |

測ったもの、そのまま:

```
  W=origin/claude/cowork-migration-review-wfx1ra
  git rev-list --count origin/master..$W        → 0
  git merge-base --is-ancestor $W origin/master → YES（枝の tip が master の祖先）
  git merge-base origin/master $W               → e3ffe8f（枝の tip そのもの）
  git cherry origin/master $W                   → 一行も出ない
  git merge-tree --write-tree origin/master $W  → cf54ee5e…
  git rev-parse origin/master^{tree}            → cf54ee5e…  ← 同じ

  A=origin/claude/detailed-tasks-execution-ak61z2
  git rev-list --count origin/master..$A        → 4
  git cherry origin/master $A                   → + が四本（未収録）
  git merge-tree --write-tree origin/master $A  → 衝突
```

### 「当てると約5万行消える」は、別の問いの答え

引き継ぎでも伝令でも、この二本には同じ警告が付いてきた ──「当てると
約 46,000 行が消える」。数字の出どころはこれで、実在する:

```
  git diff --shortstat origin/master $W   → 164 files, 5828 挿入, 50376 削除
  git diff --shortstat origin/master $A   → 164 files, 5886 挿入, 51205 削除
```

**だがこれは「merge したらどうなるか」ではない。** `git diff A B` は
「A の tree を B の tree にしたら何行動くか」で、向きがある。ここでの B は
五百コミット以上前の祖先なので、**master がその後に足した五万行が「削除」
として出る。** 枝が何かを消しているのではなく、枝がまだ知らないだけ。

merge は tree の置き換えではない。**祖先を merge した結果は master 自身**で、
それは上の `merge-tree` が一バイト単位で示している。

この取り違えは 2026-08-25 に二回起きた ── 引き継ぎ書と、リーダーの伝令。
**どちらも数字は本物で、答えている問いだけが違った。** そういう間違いは
「腐った数字」より見つけにくい。数字が合っているので、検算しても合う。

  **merge が何をするかを知りたいなら `git diff` ではなく `git merge-tree`。**
  **枝が master に入りきったかを知りたいなら `git rev-list --count A..B` か
  `git merge-base --is-ancestor`。** `git diff` はどちらの問いにも答えない。

### で、二本はどうするのか

**どちらも merge しない。** 理由は別々:

- `wfx1ra` は**入りきっている**。merge しても何も起きないので、危なくはない
  ── ただ意味が無い。ref を消してよい。消しても一行も失われない
  （tip の SHA `e3ffe8f` から戻せる）。2026-08-22 の「先行0。全部入っている」は
  正しく、今日も正しい。
- `ak61z2` は**入りきっていない**。固有の四つがあり、merge すると衝突する。
  だが四つの中身は master に別の道で在り、さらに先へ行っている ──
  `KB_MAX` は `kbCap()` になり（`core.js:443` のコメントが「it was KB_MAX」と
  言っている）、無料 QWERTY から始まる有料盤は `kbQwertyLay()` になり、
  タイムラインのサインインの扉は `sns.js` にある。
  **入れると、決着した決定が開き直る。** 消してよいが、消す前に四つを
  もう一度 grep すること ── 「別の道で在る」は日付の付く主張。

消す権限はこのセッションには無い（`git push --delete` が 403。push は通るので
拒まれているのは ref の削除だけ）。オーナーの承認は取ってある。

消したら、この節ごと消す。表が残っていて実物も残っているのが一番紛らわしい。
**ただし「5万行消える」の段落は、別の場所に残すこと。** あれは枝の話ではなく
道具の話で、枝が消えても効き続ける。

## リーダーがコードを読まずに指示を書くと、こうなる ── 2026-08-25 に十一回

一日で六つのセッションを回して、指示の誤りが十一件出た。**四件は同じ原因**で、
それが一番高くついた。書き残す価値があるのはその四件の形。

```
  ① は master に既に入っていた      c757ac4 の本文を現状だと思って指示を書いた
  home.js の読む側は入っている      world の報告を読み違えた。関数は存在しなかった
  「決めること」は節の名前だから残せ  違った。オーナーに二度言わせた
  netDay が今日を訊かないのはバグ    違った。理由つきの決定として書かれていた
```

**四件とも「コミット本文か報告を、コードの現状だと信じた」。**

CLAUDE.md はこれを既に書いている ──「コードは what happened であって
what was wanted ではない」。今日わかったのは、その裏側も同じだけ危ないこと:

> **コミット本文は「その日そうだった」であって「今そうである」ではない。**
> セッションの報告も同じ。どちらも書かれた瞬間の写真で、その後の取り込みで
> 変わる。指示に書く前に、その行を今の木で開いて見ること。

`c757ac4` は「`gModel()` を引数なしで呼ぶ道だけが、まだ誰も通っていない」と
書いていた。**書かれた時点では本当だった。** そのあと `44dabdd` が
`feature/grammar-engine` を取り込んで道が通った。私はその本文だけを読んで
「①を作れ」というセッションを立て、そのセッションは `www/phases.js:314` を
開いて「もう在る」と報告してきた。**一本まるごと無駄になった。**
`grep -n "gExLine" www/phases.js` 一回で防げた。

### だから、指示を書く前に必ず

```
  git log --oneline --all -- <触らせるファイル>   誰が今そこに居るか
  その主張の行を、今の木で開く                    本文ではなく行
  検査の名指しは、その領域の検査を全部数えてから  落とすと誰も回さない
  「master に無い」で投げない                     枝にもう在ることがある
```

**四つ目は 2026-09-01 に足した。その日リーダーが破ったから。**

「新しい端末で言語が戻らない」を測って、`www/` に該当する行が一本も無いことを
確かめて、`claude/scan` に投げた。**測ったのは `master` だけだった。**
`origin/claude/acct2` の `www/net.js:813` に `netLangsDown()` が在り、オーナーが
2026-08-31 に「前のアカウント消えたんだが？」と報告した件の修正として、**同じ
ものが既に書かれていた。**しかもこちらのほうが正確で、リーダーが「消せない
コードで書け」と条件にしたことが全部先に入っていた。

`docs/STATE.md` §1 はこの失敗を名指しで書いている ── master が古く、work が
枝の上に載っていて、それを見なかったセッションが「作られていない」と報告する。
**その §1 を読んだうえで、同じことをした。**「無い」を言う前に:

```
  for b in $(git branch -r | grep -v HEAD); do \
    echo "$b +$(git rev-list --count origin/master..$b)"; done
  git grep -n "<探しているもの>" $(git branch -r | grep -v HEAD)
```

二行目が要点。**`git grep` は枝を並べて渡せる。**「master に無い」は
「作られていない」ではない。

三つ目も同じ日に出た。`grammar-engine-check` を名指しから落としたので、
四つのセッションが誰もそれを回さず、統合のゲートで初めて赤くなった。
**セッションは指示どおりに回す。名指しが検査の実行範囲そのもの。**
`ls tools/*-check.mjs` を読んでから配ること。

### そして territory は、ファイルではなく「変更の届く先」で切る

`www/act-map.js` と `docs/` を誰にも持たせなかったので、三本が同じ場所で
止まった。ボタンを足す仕事は必ず `act-map.js` に届き、保存が変わる仕事は
必ず `docs/CHANGELOG.md` に届く。**その二つは、それを必要とする仕事を配る
時点で誰かの持ち物にしておく。** 持ち主のいないファイルは、全員が止まる場所。

### 数の見立てを、測らずに指示へ書かない

「目次から数を外すと press の buttons pressed が動く」と書いて配った。
外したのは `<span>` で押せる物ではなく、数は 10652 のまま動かなかった。
**動くと書くなら、先に測ること。** 動かないことも測って書く価値がある。

## claude/more — 2026-08-28
Scope: キーボードの配置（型）を変える道が画面に出ていない件。
触るファイル: `www/keyboard.js` `www/shell.js` `tools/kb-check.mjs` `tools/fixture.mjs`。
それ以外は触らない。
