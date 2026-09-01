# 他人の公開言語の詳細 ── サーバーは在る。画面が書けない

「言語の詳細は？」OWNER 2026-09-01

**サーバー側は入って、`npm run rls` で押さえてあります**（`claude/acct2`）。
**残りは `www/net.js` の問い一つと画面で、そこで止めました。**理由は下の §3 です。

---

## 1. いま在るもの（当てれば動きます）

`supabase/schema.sql`:

```sql
language_seen        id, owner, name, license, published_at, created_at,
                     nwords, nletters
                     公開されたもの、または自分のものだけ
slice_count(text)    スライスの本文を数える。書かれていない／読めないものは 0
```

**単語は動きません。** `nwords` はサーバーで数えた**数**で、`slice_read` は
`words` を今までどおり誰にも開きません ──
「言語ページ公開と単語や文字のdl可能は別だし」。

**これは公開が見せるものを広げた唯一の場所です**（言語ごとに整数二つ）。
要らなければ `language_seen` の `slice_count` 二行を消せば列ごと消えます。
ほかに依存はありません。

`npm run rls` 257 件。足した十:

- 公開されていない言語は他人に見えない／本人には見える
- 公開されれば誰でも読める（アカウント無しでも）
- 単語数・文字数・公開日が出る
- **辞書と文法は今までどおり誰にも開かない**
- 書かれていないスライス・読めないスライスは 0（例外にしない）

---

## 2. 残っている二つ（そのまま当ててください）

### 2-A. `www/net.js` ── 問い

```js
/* SOMEBODY ELSE'S LANGUAGE, ASKED ABOUT.
   「言語の詳細は？」OWNER 2026-09-01。slice_read は公開言語の五つ（wld,
   script, snd, letters, kb）を前から開いていて、netSlices() は
   LANGS[langId].sid ── この端末の言語 ── からしか呼ばれていなかった。
   辞書は入らない。nwords はサーバーで数えた数で、単語は動かない。 */
function netLangSeen(lid, ok, bad){
  var id=String(lid||'');
  if(!id){ bad(null, 0, 'lang −'); return; }
  netGet('/rest/v1/language_seen?select=id,name,license,published_at,nwords,nletters'+
         '&limit=1&id=eq.'+encodeURIComponent(id),
    function(d){
      var r;
      /* 行が無いのは「空の言語」ではなく、公開されていないか、無いか。 */
      if(!d || !d.length){ ok(null); return; }
      r=d[0]||{};
      ok({ id:String(r.id||''), name:String(r.name||''),
           license:String(r.license||''),
           pub:r.published_at? String(r.published_at) : '',
           nwords:Number(r.nwords)||0, nletters:Number(r.nletters)||0 });
    }, bad);
}
```

記事そのもの（五つのスライス）が要るなら `netSlices(lid, ok, bad)` が
**そのまま使えます** ── 引数は `sid` で、`netWho()` が返す `who.lid` がそれです。
新しい関数は要りません。

### 2-B. 画面 ── 人のページから言語へ

`netWho()` は**もう三つ返しています**（`ccf439d`、master 待ち）:

```
  who.lname   言語の名前
  who.lid     言語の住所 ── 行き先。これが無いと開けない
  who.lpub    扉が開いているか（published_at が入っているか）
```

`who.lpub` が偽なら扉を出さないこと ── `slice_read` も `language_seen` も
断ります。

---

## 3. なぜ私が画面を書かなかったか

**`docs/SESSIONS.md` 規則4。**画面に要る四つのファイルは、いま `claude/fo2` が
触っています（master に入っていないコミットが在る）:

| ファイル | fo2 のコミット | 中身 |
|---|---|---|
| `www/home.js` | `6c4c95e` | **`wldPage(ed)` → `wldPage(ed, L)` の書き直しと `wldOpen()` の追加**（1265-1480行） |
| `www/shell.js` | `6c4c95e` ほか | `PAGES` ── 新しい route に要る |
| `www/act-map.js` | 同 | 押せる名前 ── 新しいボタンに要る |
| `www/i18n/*.js` | 同 | 新しい文言に要る |

**一番上が決定的です。**「言語の記事を、開いている言語のグローバルを読まずに
描けるようにする」は、**他人の言語を描くための下ごしらえそのもの**です。
私がもう一つ書けば、同じものが二つになって片方が捨てられます。

`dead-check` があるので**関数だけ先に入れることもできません**（規則5 ── 呼ぶ人が
居ない関数は落ちます）。だから 2-A は**ここに書いてあり、`www/net.js` には
入っていません。**画面と同じコミットで入れてください。

**私が触ったのは `vLangs()`（1552行〜）だけで、fo2 の hunk とは離れています。**

---

## 4. 誰がやるか ── リーダーの決めごと

`claude/fo2` が `wldPage(ed, L)` を仕上げるなら、**そのまま 2-A と 2-B も
あちらが持つのが自然です。**サーバーはもう在り、`who.lid` / `who.lpub` も
もう返っています。
