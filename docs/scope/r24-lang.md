# claude/r24-lang ── 言語が勝手に増える／名前と handle が上がらない

- Goal: 道1・道10・道11（言語が二本できる）と道7（名前と handle が
  サーバーに行かない）を、**測ってから**直す。
- Owns (may change): `www/core.js` `www/net.js` `www/boot.js` `www/onboard.js`
  `www/me.js` `www/settings.js`（言語の一覧の頁だけ）
  `tools/acct-check.mjs` `tools/again-check.mjs` `tools/fixture.mjs` `docs/`
- Does NOT own: それ以外すべて。`www/grammar.js` `www/phases.js` は別の枝。
- Decision it implements: OWNER 2026-09-11「それで進めて」。
- Check to run: `npm run acct` `npm run again` `npm run open`、最後に
  `npm run press` 一回。ゲートは回さない（規則6）。

---

## 一。測った ── 誰が二本目を作っているか

道具は `origin/claude/r21-hunt` の `tools/hunt.mjs`（憶える偽サーバー＋歩き）。
この枝には取り込んでいない。読んで、`langMint` `netLangRow` `langSeenAdd`
`langForAcct` を包んで stack を取った。

### 道1 ── 新規登録

```
  ## 門の前（歩く前）
   起動直後: LANGS=[1dd1eddd]  langId=1dd1eddd
     索引 1dd1eddd name="" own= mine=true

  ## 門をくぐった直後
   いま: langId=56215eec
     索引 1dd1eddd name=""        own=cd1df5ef mine=true  ← 歩きが作った方。描いた字はこっち
     索引 56215eec name="シャンゴ" own=cd1df5ef mine=true  ← 扉で生えた方。中身は空
     · langForAcct(false)=true
         at netTook (net.js:603)
     · langMint()=56215eec
         at langForAcct (core.js:1676) < at Array.<anonymous> (net.js:605)
           < at sns.js:697 < at one (sns.js:1127) < at net.js:1537
     · langForAcct(true)=true
         at Array.<anonymous> (net.js:605) …
     · netLangRow(56215eec)
         at netLangSync1 (net.js:2523) < at netLangSync < at obFinish (onboard.js:1918)
     · netLangRow(1dd1eddd)
         at netLangSync1 (net.js:2523) < at step (net.js:2570)
   サーバーの language: ["56215eec \"シャンゴ\" owner=cd1df5ef",
                        "1dd1eddd \"\" owner=cd1df5ef"]
```

**リーダーの見立ては外れ。** 起動の `langFirst()`（`core.js:961`）は悪くない
── それが歩きの言語で、描いた字が入っているのはそっち。二本目を作っている
のは **`langForAcct(true)`**（`core.js:1676`）で、`netTook()` が
`pullWait('mylangs')` に登録した方（`net.js:605`）から呼ばれている。

なぜ生えるか。`langForAcct()` の最初の問いは `langAcct(langId)` ＝
`langMine && langOwned` で、**歩きの言語には印がまだ無い**。印を書くのは
`obFinish()`（`onboard.js:1916`）で、そこは扉を出たあと ── `netTook()` の
`pullWait` の方が先に走る。**順番の競争で、勝つのは印を書かない方。**

そして被害は「一本多い」では済まない:

- `obFinish()` は `langName=ob.name` を置いてから `netLangSync()` を呼ぶ。
  `netLangRow()` の `nm` は `key===langId` の時だけ `langName` なので、
  **打った名前は扉で生えた空の言語に付く。**
- 歩きで描いた字は印の無い方に残り、`netLangRow()` の「誰も言っていない・
  一度も上がっていない → 拾う」で名前なしのまま上がる。

つまり **一人の walk の成果が二本に割れる。**

### 道10 ── 二台目

一台だけで測り直すと、B のサインインは**一本も作っていない**：

```
  ## B サインイン後
     索引 1a833d12 name=""        own=      mine=true  ← B の起動が作った、誰のものでもない
     索引 b9240bfd name="シャンゴ" own=eb786e36
     索引 73036880 name=""        own=eb786e36
     · langForAcct(false)=true   at netTook
     · langForAcct(true)=true    at net.js:605   ← mint 無し。b9240bfd を開いただけ
   サーバーの language: 2 本（どちらも A の扉で出来たもの）
```

hunt の「一アカウントで三本」は **道1 の二本＋ B 自身の起動の一本**。
原因は道1 と同じ一つ。

### 道11 ── ログアウト → 同じアカウントで入り直す

入り直しの `langForAcct` は `false` を返して何もしない（正しい）。
出るのは道1 の二本のうち**どちらが開くか**だけで、これも同じ一つの原因。

### まとめ

**原因は一つ。**「言語を作る道」が二本あることではなく、**歩きの言語が
アカウントのものになるのが一歩遅い**こと。

---

## 二。測った ── 名前と handle が上がらない（道7）

歩いて、プロフィールの編集で三つ打って保存を押し、偽サーバーが受け取った
ものをそのまま読んだ:

```
   画面: アヤ改 / @ayaka / ここに一行
   送った物:
     PATCH /rest/v1/profile  {"bio":"ここに一行"}
   保存後のサーバー profile: handle:"aya"  display:"アヤ"  bio:"ここに一行"
```

`meProfPut()`（`www/me.js:387`）は `PROF_MINE`（`net.js:1020` ＝
`['bio','link','loc']`）**だけ**を歩いて `send` を組む。`name` と `handle` は
その一覧に無いので、`meKeepPut()` が端末に書いて終わり。断りが出ないのは
`send` が空でないから（bio が入っている）で、**送っていないことを誰も言わない**。

サーバー側は空いている ── `profile_edit`（`supabase/schema.sql:984`）は
`id = auth.uid()` で列を絞っていないので、`handle` も `display` も書ける。
`profile_rename()` の十四日はそのまま効く（断りは例外で戻り、`netPop` が出す）。

---

## 三。直した形（OWNER 2026-09-11「全部サーバーでやってんじゃねえの？」）

最初に押した「印を扉で先に付ける」は**取り消してあります**（リーダー、同日）。
端末の印で「自分の言語があるか」を決めること自体が仕様違反でした
（`docs/FEATURE_RULES.md` § 端末は何も決めない）。入っている形は三つ:

1. **送ってから訊く。** `netTook()`（`www/net.js`）は `netLangSync()` を先に
   走らせ、その完了の中で `pullWait('mylangs')` → `langForAcct()`。並んで
   走っていた二つの問いが一本になったので、順番の競争そのものが無くなり
   ました。`obFinish()` の `netLangSync()` は消しました（同じ road の遅い方）。
2. **`langForAcct()` はサーバーの答えだけを読む。** `langAcct()` の二行を
   `langOwnOf(id)===SESS.uid` に置き換え。`mayMint` は削除。作るのは
   `pullHad('mylangs')` が真、つまりサーバーが「無い」と答えたときだけで、
   電波が無ければ `LANG_WAIT` のまま待ちます。
3. **保存が送る物の一覧は一つ。** `PROF_MINE` を欄と列の対にし、上り
   （`meProfPut`）も下り（`netProfSync`）も行を作る所（`netMakeProfile`）も
   同じ一覧を読みます。

## 四。まだ端末の印を読んでいる所と、それが答えている問い

`langMine()`／`langOwned()`／`langAcct()`／`langLocked()` は消していません。
消したのは「**このアカウントの言語はどれか**」をそれに訊く行だけです。残りは
こう答えています ── リーダーの指示の「読む所が残るなら scope に理由」です。

| 読む所 | 答えている問い | この枝の持ち物か |
|---|---|---|
| `langLocked()` ← `save()`（`core.js`）と 12 file の書き手（`glyph` `grammar` `home` `keyboard` `letters` `notes` `phases` `sound` `words` `wordsheet` `settings`） | 「**開いている言語に書いてよいか**」。誰の言語かではなく、DL した言語は編集不可という別の規則 | **持っていない**（`www/` の 10 file は別の枝の物） |
| `langMine(id)` ← `home.js` の一覧の行、`letters.js`、`net.js` の `langMineIds()` | 「**作っている言語か、読んでいるだけの言語か**」。`language_take` で取った物を書き手から外す | 一部だけ（`net.js`）。一覧は `home.js` |
| `langOwned(id)` ← `keyboard.js` のプール、`core.js` の `langCount()` | 「**この段の数に入るか**」。上限の数え方 | `core.js` のみ |
| `langAcct(id)` ← `core.js` の `langCount()`、`home.js` の `vLangs()` | 「**一覧に出すか／数えるか**」 | `core.js` のみ |

**この四つを消すには `www/home.js` `www/keyboard.js` ほか 10 file が要ります。**
この枝の持ち物ではないので触っていません。**リーダーへ**: 「端末は何も決めない」
を最後まで通すなら、その 10 file を持つ枝が要ります。

## 五。リーダーへ ── まだ決まっていないこと

1. **`langFirst()`（`core.js`）は、誰も頼んでいないのに起動ごとに言語を一本
   作ります。** 歩きを飛ばした端末（`obSkipAll`）でサインインすると、その空で
   名前の無い言語がそのアカウントの二本目として上がります ── 測りました
   （道10、直した後）。「人が描いた物は捨てない」（決めごと 1）は**何も描いて
   いない言語には掛からない**ので、ここは別の判断が要ります。hunt #9
   「できたばかりのアカウントに非表示 2」と #4 も同じ行の可能性が高く、
   次に測ります。
2. **既に二本に割れたアカウントを一本に戻す道**（`docs/BACKLOG.md`）。
3. **`netLangRow()` の四つ目の状態**（誰のものとも言われていない・一度も
   上がっていない言語を拾う）── その関数のコメント自身が「オーナーが決める
   こと」と書いています。扉の road がサーバー先になったので歩きの言語は
   ここを通りますが、拾った結果を書くのは `language.owner` の答えです。
