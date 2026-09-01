# Scope — claude/fo2

実機（ビルド #106）でオーナーが踏んだ八つ。

- **Goal:** ① フォロー中の一覧を X と同じ形に ② その一覧から人のページへ飛べる
  ⑥ 通知の未読が下のタブで光る ⑦ 引っ張って更新のグルグルが実機で出ない
  ⑧ @lingua を強制フォロー ⑩ 投稿を書く画面の上部の空白を詰める
  ⑪ プロフィール画像はタップで直接ピッカー ⑫ 表示までの1秒の空白
- **Owns (may change):**
  `www/sns.js` `www/me.js` `www/home.js` `www/post.js` `www/index.html`
  `www/shell.js` `www/i18n/*.js`
  ＋ `tools/box-baseline.txt`（① のためだけ。理由はコミットに書く）
  ＋ `docs/CHANGELOG.md` `docs/scope/claude-fo2.md`
- **Does NOT own:** それ以外すべて。`supabase/schema.sql` は持っていないので、
  ⑥ と ⑧ がサーバー側を要るなら止めて報告する。
  `www/onboard.js` はオーナーのもの。触らない
- **Decision it implements:** OWNER 2026-08-28 の実機の八つ（原文はリーダーの
  指示にある）。見た目は頼まれたものだけ ──「ui変更は俺が頼んだの以外は勝手な
  判断でやるなよ？もうほぼ見た目は完成してるのよ」
- **Check to run:** `npm run es5` `npm run sides` `npm run box` `npm run act`
  `npm run i18n`。遅い二十は回さない（規則7）。

## ① だけ角丸を足してよい理由

規則18「NO ROUNDED BOX」はここでは曲げる。オーナーが見本の写真を名指しで
見せて「フォロー中の見た目これにしろよ」と言った ── 枠のある角丸のボタンが
その形の一部です。`tools/box-baseline.txt` に足し、そのコミットのメッセージに
この段落を書く。他のどこにも広げない。

---

## 次の Scope（この枝の最後の仕事として置いていきます）

この枝で**止めた**もの。どれも持っていないファイルが要ります。

### A. 通知の未読を下のタブに出す（⑥）── サーバーが答えていない

`supabase/schema.sql` の `notices()` が返すのは
`kind, at, hd, who, av, post, n, more` の八つだけで、**既読の印が一つもありま
せん。**`read_at` も `last_seen` も、そういう表も、ファイル全体に在りません。
`www/shell.js` の `tabBar()` にも印を出す場所は在りません。

「どこから未読か」は決めごとです（端末に「最後に見た時刻」を持たせて、それ
より新しいものを未読と数える形にもできますが、それは仕様であって、コードから
読み取るものではない）。**オーナーの決定と `supabase/schema.sql` が要ります。**

### B. 通知の一秒の空白（⑫ の残り）── 端末に写しが無い

測ってあります: フィードは `lingua.posts` の写しから最初のフレームで4件出る、
通知は写しが無いので空。写しを持たせるのは新しく保存するもの。

  www/sns.js          notPull() の答えを写しに落とす。名前は `lingua.notices`
                      （`lingua.notes` は既に別のもの＝古い平キー）
  docs/DATA_MODEL.md  その一行。**渡されていない**
  docs/CHANGELOG.md   保存が増えるのでコードより先に

### C. 行けなくなった画面を消す（⑪ の残り）

`openMePic()` と `mepic:` は、どの画面からも行けなくなりました。三つ同時で
ないと消せません（片方だけだと act-check が落ちる）:

  www/me.js               openMePic / FORM_OPEN.mepic / meDropPic
  www/act-map.js:181      act('meDropPic', meDropPic);   **渡されていない**
  tools/fixture.mjs:1390  openMePic() を直に呼ぶ halfDone の行  **渡されていない**

**いま検査は緑のまま**です（fixture が直に呼ぶので）。規則5の一段外側の形。

### D. プロフィール画像を外す道（⑪ から出た決めごと）

外す行は二か所とも断られました。三か所目はオーナーの決定です。

### E. 人の自己紹介（① から出たもの）

`profile` に `bio` の列がありません。`supabase/schema.sql`。

### F. 人のページの Following / Followers が 0（リーダー 2026-09-01）

**一度も取られていない数です。**フォロワーの件（#106）と同じ形で、あれは
**自分の分**でした。

`www/net.js` の `follow` への問いは三本あって、**三本とも `SESS.uid`**:

  netFollowed()   `follower=eq.<自分>`
  netFollowing()  `follower=eq.<自分>`
  netFollowers()  `followed=eq.<自分>`

**他人の数を取る道は一本もありません。**`whoOf()` が `fo:0, fr:0` を返すのは
そのためで、間違った数ではなく、誰も数えたことのない数です。

`follow_read` は `using (true)` なので取れはします。要るのは相手の uuid で、
`netWho()` は意図して返していません（コメント: 「an `id` added to it would be
an account's uuid travelling to places that read a handle」）。

  www/net.js  **渡されていない。**ここでしか足せません

### G. 自己紹介の一行 ── サーバーに列がありません（確かめました）

リーダーから「fixture の見本に無いだけかもしれない」。**違います。**

`supabase/schema.sql` の `profile` は
`id, handle, display, created_at, av, staff, admin, banned_at, banned_why`
の九列で、**bio という語はファイル全体に 0 件**です。書く側も
`netAvSync()` が `av` を PATCH するだけで、`ME.bio` は端末から出ません。

なので**フォロー中の一覧でも人のページでも、他人の自己紹介は構造的に空**です。
人のページで @ハンドルの下に出ている「Vethi」は `whoCard()` が描く
`p.lname`（言語の名前）で、自己紹介ではありません ── **言語の名前の場所は
一つも触っていません。**

  supabase/schema.sql  列。**渡されていない**
  www/net.js           netWho() の select と、書くほう。**渡されていない**
