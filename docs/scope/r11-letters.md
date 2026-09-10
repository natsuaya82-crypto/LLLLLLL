# `claude/r11-letters` ── 無料の a〜z が消えて、文字が保存できない

- 日付: 2026-09-10
- ブランチ: `claude/r11-letters`（`origin/integ-0905` の `2afca930` から）
- オーナー 2026-09-10（ビルド 148 か 149、実機）:
  「アルファベット無料の a-z とか消えてない？なんで？あと、保存できないけど文字」

**実機で起きているデータの事故。** 無料プランの自分の言語で、文字の一覧から
a〜z が消えている。文字を保存しようとしても保存できない。ビルド 147
（master `e82c9595`）までは出ていなかった。

## この枝がやること

1. **原因を測って見つける。** 読んで名指しするのは推測（CLAUDE.md
   「A cause is FOUND, not guessed」）。147（`e82c9595`）と 148（`6d7ad665`）を
   隣に並べて同じ台本を回し、差の出る行を貼る。
2. 見つかった道を**一本のまま書き直す**（patch ではなく rewrite）。
   保存でサーバーの letters を空で上書きする道があるなら、そこが最優先。
   「空」と「知らない」を同じ枝に入れない。
3. 再現を claim にして赤を見てから緑にする。

## 触ってよいファイル

```
www/net.js          原因の道だけ
www/core.js         同上
www/letters.js      ltStart の呼び所だけ
www/boot.js         起動の道だけ
tools/again-check.mjs  tools/acct-check.mjs  tools/fixture.mjs
docs/CHANGELOG.md   docs/scope/r11-letters.md
```

**触らないもの** ── `supabase/schema.sql`（要ると分かったら止まって報告する）、
上に無いすべての `www/` と `tools/`。

---

## 測ったこと（2026-09-10、原因はまだ確定していません）

**症状二つは一つの状態の裏表です。** 印（`language.owner`）も `sid` も無い言語
では、`langMine()` が偽になり:

- `langLocked()` が `saveLetters()` を含む全部の書き手を止める → **保存できない**
- `ltStart()` が一行目（`if(!langMine(langId)) return;`）で戻る → 無料の 38 枠が
  入らない → **a〜z が無い**

これは `docs/BACKLOG.md` 2026-09-09 の項に既に書かれていた並びで、この枝が
見つけたのは「その状態が実際に作られる所」です。149 の扉の道（何も無い電話 →
歩き → サインイン、サーバーは空）を回すと、索引に二行できます:

```
["Lmtuymt5g sid=-  mine=true own=\"\"",       ← 歩きで作った言語（印も sid も無い）
 "*Lmtuymu73 sid=srv1 mine=true own=\"me\""]  ← langForAcct(true) が作って開いた方
```

`netTook()` の中で `langForAcct(false)` が「この口座のものが無い」と答え
（`langOwned()` は印の無い言語に偽を返す）、`pullWait('mylangs')` が起きた時に
`langForAcct(true)` が別の空の言語を作って開きます。歩きで作った方は置き去りに
なり、印も付かず、一覧にも出ません。**147 でも同じ二行が出ます。**

### 147 と 149 で差が出なかった道（同じ台本、同じ偽サーバー）

| 電話の状態 | 147 | 149 |
|---|---|---|
| 使い込んだ端末（索引・写し・セッション） | L=39 保存○ | 同じ |
| 写し（`.got`）だけ無い | L=38 保存○ | 同じ |
| 入れ直し（`lingua.sess` だけ） | 起動後 L=38 保存○ | 同じ |
| 空の端末 | L=38 保存○ | 同じ |
| 上の四つ＋`language_take` の ask が落ちる | L=38 保存○ | 同じ |
| 扉の道（新しい無料アカウント） | L=38 保存○ 言語=2 | 同じ |

文字の画面そのものも同じ絵でした（`shots/letters-ja.png` と
`shots/letters-ja-147.png`）。`www/letters.js` は 147→149 で一行も動いて
いません。

### 潰した仮説

- **仮説 2（`netLangBack1` が `ltStart()` を呼んでいた）は誤り。** 147 の
  `www/net.js` に `ltStart` の呼び出しは一つもありません。
- **仮説 3 の道は、この木では歩けません。** `NET_AT` も `langWasKey` も
  メモリで、`netAgreed()` が両方を一緒に書きます。片方だけ残る道は
  `netAgreed(id, kind, '', at)` を通った後だけで、そこへ入るには先に
  サーバーが空の行を持っている必要があり、この app はそれを書きません。

### 見つけた本当の欠陥（症状の原因とは別。書き直す価値があります）

`netGotFor()` の `know` の枝が **「知らない」を「空」と同じ枝に入れています**:

```js
was=slMine(langWasKey(id, kk));
got[kk]={body:(was===null? '' : was), no:st[kk].no, at:st[kk].at};
```

`was===null` は「この端末は合意を覚えていない」で、「サーバーが空を持って
いる」ではありません。`syMerge()` はそれを「サーバーは空」として読みます。
148 で入った行です（147 は毎回サーバーから本文を読んでいました）。
