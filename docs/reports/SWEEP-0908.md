# SWEEP 0908 — 「答えが二か所にある」所の総ざらい

枝 `claude/r7-sweep` / 2026-09-08 / master `7f03753b` から

OWNER 2026-09-08「端末に hide の存在があるわけないやろ。全部オンラインだって
言ってるけど」「それ以外の古い端末要素全部消してる？」を受けて、`wld.hide` と
同じ形が他に無いかを洗いました。

## SCOPE

- **触った所**: このファイル一枚だけ。**コードは一行も変えていません。**
- **触っていない所**: `www/` `ios/` `tools/` `supabase/` その他すべて。
- **何も消していません。** 消すかどうかはオーナーの決めることです。
- 検査は回していません（規則 2、ゲートはリーダーの run）。
- `claude/r7-acct` が `hide` を一本化中。3 行目はその報告であって、この枝の
  仕事ではありません。

## 測ったか、読んだだけか

**全部「読んだだけ」です。** ブラウザも検査も走らせていないので、下の「ずれる
道」は**コードを読んで辿った道であって、押して確かめた事実ではありません**。
規則（原因は推測でなく確かめる）に照らして、ここは推測の側です。**どれ一つ、
この報告だけを根拠に直さないでください。**

---

## 一　二つ目の答え（消す候補）　８件

| # | 何の答え | 端末側 | サーバー側 | 今どちらを読んでいるか | ずれる道 |
|---|---|---|---|---|---|
| 1 | **言語の名前** | `LANGS[id].name`（`lingua.langs`）と `lang` スライス（`core.js:804`、`core.js:586`） | `language.name` 列、`language_seen.name` | 画面は `langName`（＝`lang` スライス）。一覧と他人のページは `language.name` | **改名が列に届かない。**`language.name` を書くのは `netLangRow()` の POST 一回だけ（`net.js:1157`）。`PATCH /rest/v1/language` は `published_at` しか書かない（`net.js:1243`）。改名すると `lang` スライスと索引だけ動き、列は作った日の名前のまま |
| 2 | **公開か非公開か** | `WLD.hide`（`wld` スライス、`home.js:1015`） | `language.published_at`（`schema.sql:208`、`slice_read` が読む） | 画面は `wldHidden()`＝端末側。読める/読めないは列 | 既知。`setWldHide()` が両方を書くので、`netLangPublic()` が落ちた回にずれる。**`claude/r7-acct` が一本化中** |
| 3 | **オンボーディングが済んでいるか** | `SET.plan` と並ぶ `SET.done`（`SET_PHONE` 入り、`core.js:1416`） | `profile` 行があるか | 扉だけサーバー（`onboard.js:933`「プロフィール行があれば初回ではない」）。**それ以外の全部が `SET.done`** — `langOwned()`（`core.js:1105`）、`glyph.js:2953`、`post.js:1801`、`route-map.js:33`、`shell.js:782` | 二台目にサインインすると扉は正しく通すが、`SET.done` は扉が通った後に立つ。扉を通らない道（既にセッションがある起動）で `SET.done` が false のままだと、`langOwned()` が「印の無い言語は自分のもの」と答える |
| 4 | **誰の言語か** | `LANGS[id].uid` と `LANGS[id].mine`（`lingua.langs`） | `language.owner` 列（`language_write` が `owner = auth.uid()`） | 画面と数え上げは端末側（`langOwned()` `langAcct()` `langCount()`） | `netLangsDown()` は自分の行しか取らないので、`uid` は入る。ずれるのは印の無い古い言語で、そこは `SET.done`（#3）に寄りかかっている |
| 5 | **いいね／ブースト／返信の数と、自分が押したか** | `p.li` `p.bo` `p.re` `p.lime` `p.bome`（`lingua.posts`、`post.js:3385` 他） | `post_seen.likes/boosts/replies/i_like/i_boost`（`schema.sql:1025`） | `postNLike()` 系（`post.js:1111`）が「サーバーの答えがあればサーバー、無ければ端末」 | 押した瞬間に端末側を動かし、`p.nlike` にも書き戻している（`post.js:3389`）。次の pull で上書きされる設計だが、**端末の数がディスクに残る**ので、`post_seen` が答えられない post（未送信・古い post）では端末の数が永久に画面に出る |
| 6 | **フォロー中／フォロワー** | `ME.fo` `ME.fr`（`lingua.me`、`me.js:242`） | `follow` 表、`profile_seen.fo` `.fr`（数） | 自分のページは `meNFollowing()`＝端末の配列の長さ（`me.js:589`）。他人のページは `p.fo` `p.fr`＝サーバーの数（`me.js:1259`） | **同じ数を二か所が別の元から出している。**端末側は起動時に一回だけ `meFollowsPull()` が入れ替える。もう一台でフォローした分はセッション中ずっと出ない。`me.js:1079` はサーバーの数を端末で ±1 している |
| 7 | **自己紹介** | `ME.bio`（`lingua.me`） | `profile.bio` 列 | 自分のページは `ME.bio`。他人のは `profile_seen.bio` | `netBioSync()`（`net.js:940`）が「両方あって違えば**端末が勝つ**」。二台が別の文を持つと、**後から起動した方の端末が相手の文を消す**。規則 22 の「写しは戻らない」の例外がここに一つある |
| 8 | **下書き** | `DRAFTS`（`lingua.drafts`） | `draft` 表 | 両方。`draftsPull()`（`post.js:591`）が下ろして、サーバーに無いものを上げる | **墓石が無い。**もう一台で消した下書きは、こちらが「サーバーが知らないもの」として上げ直す。消したものが戻ってくる道 |

### 消したら何が壊れるか（候補ごとに一行）

1. **言語の名前** — `lang` スライスを唯一の答えにすると、`language_seen` が名前を
   返せなくなる（列を読む SQL）。**列を消すのではなく、改名が列にも届くようにする
   のが素直**。逆に列を唯一にすると、電波の無い起動で自分の言語の名前が出ない。
2. **公開か非公開か** — `r7-acct` の担当。ここでは触れません。
3. **`SET.done`** — 消すと**オンボーディングの前が壊れます**。扉より前は
   `profile` 行が無いので、サーバーには「歩き途中」を表す答えが存在しない。
   `langOwned()` の「印の無い言語」の枝もここに乗っている。**残すもの**で、
   直すなら「扉を通らない起動でも `profile` 行から立て直す」側。片方を消す、
   という判断ができない行です。
4. **誰の言語か** — 消すと、電波の無い起動で一覧が空になる（誰のものか言えない
   言語は出せない）。**残すもの**。#3 が直れば印の無い言語の枝は消せます。
5. **投稿の数** — 端末側を消すと、**まだ送れていない自分の投稿が数を持てない**
   （`post_seen` に行が無い）。オフラインで書いた投稿が「0いいね」に見える。
6. **フォロー** — `ME.fo` を消すと Follow ボタンが押した直後に戻る（サーバーの
   答えを待つ間の状態が無くなる）。数の方（`meNFollowing()`）は
   `profile_seen.fo` に寄せられる。**配列は残し、数だけ一本化**が候補。
7. **自己紹介** — 端末側を消すと、電波の無いときに自分の紹介文が出ない。
   **勝ち負けの向き**（今は端末が勝つ）がオーナーの決めること。
8. **下書き** — 端末側を消すと、電波の無いときに下書きが書けない。
   直すなら「消した印」をサーバーに置く側で、これは削除に触るので DELETE REVIEW。

---

## 二　読み専用の写し（規則 22 の通り、消すものではない）　１０件

| 何の答え | 端末側 | サーバー側 | なぜ写しで良いか |
|---|---|---|---|
| 言語の中身（12 スライス） | `LSL`（メモリ）と `lingua.<id>.<slice>.got`（ディスク） | `slice` 表 | 一方通行が**機械で守られている**。`slRd()` は `.got` を見て、`slWr`/上りが使う `slMine()` は見ない（`core.js:352`, `394`）。`netSlice1()` が唯一の上りで `slMine()` を呼ぶ（`net.js:1655`） |
| 古い版がディスクに残した `lingua.<id>.<slice>` | 同上 | `slice` 表 | 移行。**写して消さない**。いつ読むのをやめるかは `docs/BACKLOG.md` |
| 二つが最後に一致した文字列 | `.was`（`LSL` の中、`core.js:306`） | — | 「消した」と「まだ知らない」を分ける印。ディスクに出ない |
| 星を付けた検索 | `SET.saved` | `saved_search` | pull が入れ替える（`sns.js:2175`）。`SET.savedUp` は一度きりの印 |
| 打っただけの検索 | `SET.recent` | `recent_search` | 同上（`sns.js:2282`） |
| 段（プラン） | `SET.plan` `SET.planWas` `SET.planV` | `plan` 表 / `verify-plan` | **`plan` 表への上りの道が無い**（`net.js:1016`）。答えは verify-plan だけが出す。`planWas` は「前回の起動で見た段」で、サーバーに対応物が無い |
| 表示名とハンドル | `ME.name` `ME.handle` | `profile.display` `.handle` | サインインで `profile` が上書きする（`onboard.js:901`, `1453`） |
| 小さい顔 | `ME.av` / `ME.avSent` | `profile.av` | `meAvSet()` が一度だけ書き、`netAvSync()` が差があるときだけ上げる |
| ブロック | `NET_BL`（メモリのみ） | `block` 表 | ディスクに出ない。起動ごとにサーバーへ聞く（`net.js:2301`） |
| 三つの数（字・語） | `WORDS.length` `LETTERS.length` | `language_seen.nwords` `.nletters` | **同じスライスを二か所で数えているだけ**で、元は一つ。二つ目の答えではない |
| 索引と立ち位置 | `lingua.langs` `lingua.cur` | — | 「サーバーに何を聞くか」であって答えではない |
| このスマホが誰か | `lingua.sess` | — | 唯一「誰のものでもない」鍵。規則 22 が明記 |
| 通知をどこまで読んだか | `SET.notAt` | — | **サーバーに既読の表を置かない決定**（「サーバーの既読の表は要りません」）。穴ではない |

---

## 三　逆向き — サーバーに列が無く、端末にしか無いもの　４件

`wld.hide` の逆で、「二つ目の答え」ではなく**答えが一つも上に無い**もの。
オーナーの「それ以外の古い端末要素全部消してる？」に直接当たります。

| 何 | 端末側 | サーバー | 状態 |
|---|---|---|---|
| **書記体系** | `SET.wsys`（`SET_PHONE` 入り） | **無し** | `tools/store-check.mjs` が自分で **GAP と書いている**。「言語のものなのに人の設定に入っているので、公開した言語は書記体系を見せられない」。`www/home.js` も同じ文を持っている |
| **プロフィールのリンク** | `ME.link`（`me.js:1398`、入力欄あり） | **無し** | 打てるが、`netMakeProfile()` が送るのは handle / display / av / bio だけ（`net.js:880`）。**他の誰にも見えず、スマホが消えたら消える** — 2026-09-01 に `bio` が直された時と同じ形 |
| **プロフィールの場所** | `ME.loc`（`me.js:1403`、入力欄あり） | **無し** | 同上 |
| 表示の設え | `SET.myfont` `SET.showScript` `SET.kbrom` | 無し | `SET_PHONE` に「この端末の設え」として入っている。アカウントのものか端末のものかは**判断**であって、この枝が決めることではありません |

---

## 突き合わせに使ったもの

- `grep -o "rest/v1/[a-z_]*" www/net.js | sort | uniq -c` — 17 の表と `rpc`
- RPC は 13：`account_ban` `account_delete` `account_unban` `admin_counts`
  `email_taken` `feed_fo` `feed_hot` `notices` `post_hide` `post_show`
  `report_drop` `staff_add` `staff_drop`
- `tools/store-check.mjs` の `ROADS`（8 行）と `FIELDS`（21 行）と `SET_PHONE`
- `supabase/schema.sql` の表と `add column`

## この枝が触っていないもの

コード、検査、`docs/` の他のファイル、`docs/CHANGELOG.md`。この報告は
**保存されるものを何も変えていない**ので CHANGELOG に行はありません。
