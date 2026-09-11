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

## 三。リーダーへ ── 決めごと二つ（進められる所は進める）

1. **二台目の扉。** 端末 B で歩きを通ってから既にあるアカウントで
   サインインすると、`obIn()` が `SET.walked` の偽で `obFinish()` を呼ぶので、
   **B の歩きが作った言語がそのアカウントの二本目として上がる。**
   これは今日もそうで、この枝では変えていない。「二台目の歩きで作ったものを
   上げるか／捨てるか」はオーナーの決めごと。
2. **`netLangRow()` の四つ目の状態**（誰も言っていない・一度も上がっていない
   言語を拾う）は、その関数のコメント自身が「オーナーが決めること」と書いて
   いる。扉で印が付くようになれば歩きの言語はここを通らないので、この枝では
   触らない。
