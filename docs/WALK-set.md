# 手で歩いた記録（設定・アカウント） — 2026-09-06

`master`（`de4ad262`）を headless Chromium で人が触るように操作した記録。
**コードは一切直していない。**見たことだけを書く。**バグ 3 件、気になる 5 件。**

担当は設定・アカウントまわり ── `www/settings.js` `www/boot.js`
`www/onboard.js` `www/home.js` `www/store.js` `www/net.js` の画面側。
このセッションが変えたファイルは `docs/WALK-set.md` と、そこへの一行を足した
`docs/BACKLOG.md` だけ。

前の人が同じ日に全体を一周した記録（`claude/walk` の walk-0906）に
書かれているものは、ここには書かない。あの記録の
バグ 1（閉じた節の ＋）とバグ 2（`Your language` の数が上限を超えて出る）と
気になる D（押せそうで押せない Email の行）は、こちらでも同じものが見えている。

## どう触ったか

`tools/shot.mjs` `tools/press.mjs` `tools/open-check.mjs` と同じやり方で
playwright を書き、`www/` を 8154 番に出した。端末は 402×874、
deviceScaleFactor 3。押すのは実際の click で、`data-do` の名前から
`www/act.js` の一つの委譲リスナーを通る。字を描く画面だけは pointer
イベントしか聞いていないので、CDP の `Input.dispatchTouchEvent` で指を置いた
（playwright の mouse では一本も線が引けない）。`page.on('pageerror')` と
console.error は全部拾った。スクショは `shots/walk-set/`（コミットしない）。

このコンテナには外へ出る網が無い。`netPop()` の「接続がありません」は仕様
どおりの動きなので下には書かないし、それが下のボタンを覆ってしまうので、
seed の直後に `window.netPop=function(){}` を入れて黙らせた上で押した。
**ただしバグ 1 だけは、黙らせずに、ポップが出るはずの状態でもう一度確かめて
いる**（黙らせたせいで何も出ていないのではないことを確かめるため）。

オンボーディングは空の `localStorage` から始めた。設定の各画面は
`tools/fixture.mjs` の `seed()` を入れて `SET.plan` を三つとも試した。

## バグ（再現手順が書けるもの）

| # | プラン | 画面 | 操作 | 起きたこと | 期待 | スクショ |
|---|---|---|---|---|---|---|
| 1 | 全部 | 設定 → Account | 「Delete account」→ ポップの［Delete］ | ポップが閉じるだけ。アカウントは残り、サインインしたまま、画面は Account のまま。トーストもポップも出ない。8.5 秒待っても何も出ない | 消せなかったことを言う。`saveTry()` が保存で言うのと同じ扱い | `61-wipeall-ask.png` / `63-wipeall-nonet-netpop-live.png` / `64-wipeall-nonet-8s.png` |
| 2 | 全部 | 三か所 | 「この言語を削除」「アカウントを削除」「凍結画面」を開く | 三つとも**バックアップファイルの話をする**。2026-09-04 にファイルは消えている（`docs/CHANGELOG.md`、`www/backup.js` の冒頭） | ファイルが無いのだから、その一節が無いこと | `53-wipelangs-ask.png` / `61-wipeall-ask.png` / `90-frozen.png` |
| 3 | 全部 | 設定 →「Your language」→ Name | 鉛筆（`editName`）→ 欄を全選択して消す →［Save］ | 名前は「Shango」のまま。設定の部屋に戻るだけで、トーストもメッセージも出ない。押した人には何が起きたのか分からない | 空で保存できるか、できないと言うか、どちらか | `100-name-emptied.png` / `101-langs-after-empty-name.png` |

### 再現手順

**1.** 設定 → Account →「Delete account」。ポップが出る（"Erase everything?…"）
→［Delete］。`#pop` から `on` が外れ、`#sbg` も消える。`SESS` はそのまま、
`Object.keys(LANGS).length` も 1 のまま、`#app` の中身も一文字も変わらない。
console には `net::ERR_TUNNEL_CONNECTION_FAILED` が四本立つ。**`netPop()` を
黙らせずに同じことをしても、ポップは出ない。**2.5 秒後・8.5 秒後も同じ。

**2.** 三つとも英語の文をそのまま写す。
- 「Delete this language」のポップ ── `confirm.wipe.langs`:
  「… **Its backup file goes too.** It is removed from your account, so it
  will not come back on another phone. …」
- 「Delete account」のポップ ── `confirm.wipe`:
  「… every language, letter and setting goes from this phone;
  **the backup files go with them.** …」
- 凍結画面（`openCapLapse`） ── `cap.lapse.d`:
  「Back to Free: the dictionary lists 100 words. Nothing has been deleted.
  **It is all still here, and in your backup.**」

`www/backup.js` は今、章の名前だけが残っていて、書き出しも読み戻しも三世代も
設定画面の一覧も無い。ファイルが最後にあった日は `docs/CHANGELOG.md`
2026-09-04。**一番押すのが怖い二つのボタンが、無いものを根拠に「大丈夫」と
言っている。**十か国語ぶんの同じ鍵が同じことを言っている。

**3.** 設定 →「Your language」→ Name の行（`editName`）。欄には「Shango」が
入っている。欄を触って ⌘A → Backspace（欄の値は `""` になる）→［Save］。
`set:lang` に戻り、`langName` は `"Shango"`。`langs` の一覧も「Shango」。
オンボーディングの「Decide later」は名前を空のまま通すので、**空という状態は
このアプリにある**。あとから空に戻す道だけが、黙って効かない。

## 気になる（仕様かどうかこちらでは決められない）

| # | プラン | 画面 | 見たこと |
|---|---|---|---|
| A | 全部 | 言語のページ (`world`) | **作ったばかりの言語が「Public」オンで出てくる。**「New language」を押して `world` を開くと、`world().hide` は `undefined`、行の swt は `swt on`、Overview も Sections も DOWNLOADABLE も並んでいる。誰も公開すると言っていない。DOWNLOADABLE の四つ（Letters / Lexicon / Grammar / Keyboard）はどれも off で出る（`84-world-new-public-on.png`） |
| B | 全部 | 言語のページ (`world`) | **「Public」を切ると、その下が全部画面から消える。**残るのは題と「Public」の二行だけ。Overview に書いた文も、書いた記事の行も、DOWNLOADABLE の四つも消える。`world()` の中身は変わっていないので**消えてはいない**が、画面はそう言っていない（`85-world-public-off.png`） |
| C | plus | 設定 → Data | 「Import from CSV」の行は free と plus では `upData`、pro では `openImport`。**行の字はどのプランでも同じ**で、free と plus で押すと「You need to upgrade to use this feature」、pro で押すと取り込みの画面が開く。plus も金を払っているので、そのポップが何を勧めているのかは行からも文からも分からない（`102-data-free.png` / `102-data-plus.png` / `102-data-pro.png`） |
| D | 全部 | 設定 → Account → Sign out | 扉に戻り、そこから動かない（正しい）。ただし**サインアウトしたあとも `SET.plan` は `pro` のまま**。画面に出るものではないので押して見えるものではないが、扉しか無い状態で誰のものでもないプランが一つ残っている。`SET_PHONE`（`www/core.js`）に `planUid` が入っているので、次に誰が入ってくるかで決まる話だと思われる |
| E | 全部 | 凍結画面 (`openCapLapse`) | ［Upgrade］と［Close］の間が一画面分ちかく空いていて、画面の下三分の二が白い。字が三行あって、そのあとボタンが二つ、離れて縦に並ぶ（`90-frozen.png`） |

## 正しく動いたことの記録

- **空の `localStorage` からの一周。**字を描く画面から始まり（扉ではない）、
  一本引くと「Good. Add more, or move on.」に変わり、［Done］で案内が始まる。
  案内は 8 か所を順に回り、キーボードの所だけは 1.8 秒で自分から進む。
  そのあとタイムライン → 名前 → 扉。名前の画面の戻るでタイムラインに戻る。
- **案内の中のタイムラインは封がしてある。**`postOpen` `postLike`
  `go["profile","ilva"]` が全部markup に居るが、押しても画面は一文字も
  動かない。
- **扉の各入口。**Sign in / Forgot your password? / Create an account の
  三つとも開き、Forgot と Create には戻るが付いていて、扉の最初の顔には
  付いていない（サインアウトした人をそこから動かさないため）。空の欄で押すと
  三つとも「Type your address.」と言う。まともな住所とパスワードを入れて
  ［Sign in］すると「No connection. (token 0)」── この `(token 0)` は
  `netWhy()` の印で、`www/net.js` に何のためのものか書いてある。
- **設定の全部の部屋。**lang / look / acct / data / ui / pw、free・plus・pro
  の三回ぜんぶ開いて中身が出る。例外は 0 件、`#app` が空になったものも 0 件。
- **テーマ。**Light / Dark / System。System は入った時点で入（`SET.theme` が
  `'system'`）で、押すと今の見た目（light）に固定される。Dark を押すと
  `data-theme="dark"`、そこから System を押すと `'system'` に戻る。
- **表示言語 10 種 × 12 画面 = 120 画面**を出して、横に溢れているものを数えた。
  溢れたのは各言語の `plans` だけで、それは `.plrail` が
  `overflow-x:auto` の横スクロール（Free / Plus / Pro の三枚）だから。
  `documentElement.scrollWidth` は 402 のまま ── **画面そのものは
  どの言語でも横に広がらない。**
- **プランのページ。**月／年の切り替えは `plPick`、選んでいる方が枠で囲まれる。
  free・plus・pro のどれで開いても「current」が今のプランに付く。
  `plBuy` / `storeRestore` / `storeManage` はブラウザに StoreKit が無いので
  何も起きない。
- **言語の数（pro）。**2 つ目・3 つ目まで作れて、4 つ目でトースト
  「The most on this plan is 3.」。作るとその言語に切り替わって profile に
  降りる（`langOpen()` の `goTab('profile')`）。
- **名前の変更。**「Nurath」と打って［Save］で `set:lang` の行も `langs` の
  一覧も変わる。
- **この言語を削除。**二つある状態で開いている方を消すと、もう一方が開いて
  profile に降りる。**最後の一つを消すと、名前の無い言語が一つ新しく立つ**
  ので、言語が 0 の状態にはならない。
- **サインアウト。**トースト「Signed out」、扉。そのあと `settings` `set:acct`
  `langs` `build` `world` のどれへ行かせても扉のまま動かない。
- **`localStorage` に残る鍵。**`lingua.cur` `lingua.langs` `lingua.me`
  `lingua.posts` `lingua.set` の五つだけ。言語のスライスは一つも無い（規則 22）。
- **？の中身。**`pub` `kb` `wsys` `glyph` の四つとも開いて中身が出る。
- **自作フォントの on/off。**`wsys` の「Show my own letters」で
  `SET.myfont` が入り／切りになり、目次の字は入れても roman のまま
  （目次の字は `t()` の字で、言語の字ではないので正しい）。
