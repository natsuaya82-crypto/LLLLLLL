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

---

## 2026-09-01、リーダーが渡してくれた分で動いたもの

⑥（未読をベルに数字で）・⑫の残り（`lingua.notices` の写し）・⑪の後始末
（行けなくなった画面を三ファイル同時に削除）・CLAUDE.md の Shape の規則。
`docs/DATA_MODEL.md` `docs/CHANGELOG.md` `www/act-map.js` `tools/fixture.mjs`
`CLAUDE.md` を使いました。

## H.（保留）⑪ の削除 ── オーナーが「一旦」外しました 2026-09-01

「削除はいいって一旦」OWNER。一度書いて、このビルドには入れないことになったので
**戻しました**（9a0e0dd）。`ios/` は `origin/master` と一字一句同じです。
**書いたものは 375bc39 に残っているので、作り直す必要はありません。**
`docs/BACKLOG.md` に一項目として残してあります。

以下は、そのとき調べた記録です:

**2026-09-01、リーダーが「あなたが作ってください」と渡してくれたので作りました。**
`LinguaShare.ask()`（`UIAlertController`）を足し、`www/me.js` から呼んでいます。
新しいファイルは作っていないので `project.pbxproj` は触っておらず、
`assets-check` は緑のままです。**Swift はここでコンパイルできないので、実機
ビルドでの確認が要ります。**

以下は、そのとき調べた記録です（何が無かったか）:

**オーナー決定 2026-09-01:**「アイコンをタップした時にiPhone標準の写真を選ぶか、
削除するか出てくるやつでいいだろ」。基準の1番「システム標準を最優先。独自実装は
標準では実現できない場合のみ」。

**調べました。ネイティブ側にアクションシートは在りません。**

  `UIAlertController`   `ios/` 全体で **0 件**
  `LinguaShare` の      write registerFont keep kept dropKept dropAll
  16 のメソッド          keepVoice voice dropVoice pickPhoto audio settings
                        sheet shareFile renderPdf
  そのうち `sheet`      **紙のほうです** ── PDF を Documents に書く。
                        画面のシートではありません
  `pickPhoto`           在ります。PHPicker を出すので「写真を選ぶ」は既に
                        ネイティブで出せます。**「削除」の選択肢が無い**

なので要るのは一つだけです:

```
LinguaSharePlugin に  CAPPluginMethod(name: "ask", returnType: CAPPluginReturnPromise)
  UIAlertController(preferredStyle: .actionSheet) を出して、
  押された選択肢の index を resolve する
  （iPad のために popoverPresentationController の設定が要ります）
www/me.js から  Capacitor.nativePromise('LinguaShare','ask',{...})
  ── 呼ぶ形は www/share.js と www/store.js が既に持っています
```

  `ios/App/App/LinguaShare.swift`      **渡されていない**
  `ios/App/App/App.xcodeproj`          Sources に足す話（規則9の裏側）
  実機ビルド                            Mac と Xcode が要る。Linux では出せない

**HTML でシートを描いて似せるのはしません。**CLAUDE.md を今日直したとおり、
それは禁止されている側が許された側の名前を着ているだけです。

**それまでの間、外す道は一つもありません。**別の画像を選べば上書きはできます。

## I. オーナーの十の基準の置き場所

`docs/CHANGELOG.md` に原文で記録しました。**`docs/FEATURE_RULES.md` §
Owner decision log にも要ります** ── そのファイルは渡されていません。


## J. CLAUDE.md は `claude/docs` のもの（2026-09-01）

シート禁止の一文の直しは `claude/docs` がやります。この枝が一度直したもの
(cbc3965) は 5de1ccf で元に戻してあり、**`CLAUDE.md` は `origin/master` と
一字一句同じ**です。衝突しません。

**`claude/docs` へ必ず伝えること ── 狭めかたは二つで一組です:**

  禁止のまま  画面の代わりに使うシート（一画面ぶんの操作を、ページを作りたく
              ないからという理由で下から持ち上げたもの）
  許す        指の下の一つを消すか変えるかを訊く、**iOS 自身**が出すもの

**二つめが抜けると「アクションシートが許された」だけが残り、HTML で自前に
描いたシートが通ります。**それは禁止されている側が許可された側の名前を着て
いるだけです。書いた文は cbc3965 に残っているので読めます。


---

## 十二項目の現在（2026-09-01、この枝の最終状態）

| | | どこ |
|---|---|---|
| ① フォロー中の一覧の形 | 入った | 680be18（自己紹介の行だけ空。列が無い） |
| ② 人のページへ飛べる | 入った | 680be18 |
| ⑥ 未読の数字 | **入った** | e08543e（`www/shell.js` の `.tabn`／`notUnread()`） |
| ⑦ 引っ張って更新の印 | 入った | 26cd580 |
| ⑧ @lingua 強制フォロー | **コード不要** | `schema.sql:1422` の `profile_follows`、2026-08-26 から master。**本番に当てるだけ** |
| ⑩ 投稿画面の空白 | 入った | 45bbf5e（22px→4px。下の帯は決めごとなので残した） |
| ⑪ 画像はタップで直接 | 入った | c141326 ＋ d8ad522。削除は保留（BACKLOG） |
| ⑫ 通知の写し・空白 | **入った** | 7ad6437 ＋ e08543e（`lingua.notices`） |
| 見出しが Build | 入った | e6345de |

**渡されていないので止まっているもの:** ①の自己紹介の列（`schema.sql`）／
人のページの Following・Followers（`www/net.js`）／十の基準の
`docs/FEATURE_RULES.md` への記録（CHANGELOG には原文で入れてあります）。
