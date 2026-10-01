# r158 — App Store の評価のお願いは、そのアカウントが初めてログインした直後に一度

決定: docs/FEATURE_RULES.md § Owner decision log 2026-09-25
「カテゴリはグラフィック&デザイン、App Store の評価のお願いを出す…」の二つ目の箇条
（2026-10-01 に差し替え ──「頼むのは初めてログインした直後」。開いた五回目はやめる）。

## 「初めてのログイン」をどう知るか（測った）
アカウントの物で、端末の物ではない（CLAUDE.md「NOTHING IS THE PHONE'S」）。

- 新しいアカウントと戻ってきたアカウントを分けているのは、サーバーの `profile` 行がもうあるかどうか。
  `netMyProfile()`（`www/net.js`）が `meRowGot(!!p)` で受け取り、`appIs()`（`www/shell.js`）は行が無ければ
  扉（`'door'`）── 名前と @ の面（`obWhoHTML()`）── を出す。行のあるアカウントはそこへ来ない。
- 行を**作る**のは `netMakeProfile()` ただ一つで、呼ぶのは `obWhoGo()`（`www/onboard.js`）の一行だけ。
  その成功の答えの中が「このアカウントが生まれた瞬間」で、@lingua のフォローもそこで付けている
  （コメント「this is the one place an account comes into existence」）。
- `profile.id` は `auth.users` の主キー（`supabase/schema.sql`）。二度目の insert はサーバーが 409 で断るので、
  成功の答えが来るのはアカウントに一度だけ。**一度を持っているのはサーバーの主キー**で、端末には何も書かない。
- メール・コード・Apple・Google のどの道でも、新しいアカウントは行が無いのでこの面を通る。
  別の端末で入る・出て入り直すアカウントは行があるので通らない → 頼まない。

だから頼む所は `obWhoGo()` の `netMakeProfile()` 成功の答えの中。Settings から後で作ったアカウント
（`obReturn()`）もその前で頼む（初めてのログインには違いない）。

### 限界
- 行を作る insert が通ったのに答えが端末に届かなかった（電波が切れた）場合、頼まない。次の入り直しは
  行があるので頼まない。その一回は失われる。
- 頼んだ後に iOS が実際に出すかどうか・年三回は iOS の物（TestFlight では出ない）。
- 頼むのは「行ができた」直後で、`obFinish()` が画面を進める前。

## 消すもの（書き直し）
- `rateOpen()`・`RATE_AT`（`www/core.js`）と、`www/boot.js` の呼び出し。開いた数は数えない。
- `tools/store-check.mjs` の `opened` 行（書く物が無くなる）。
- `SET.opened` は**端末に残っている物を消さない**。`SET_GONE` は消す一覧で、入れるにはオーナーの
  「消していいよ」が要る（2026-09-26 の前例）。だから入れない。誰も読まず誰も書かない欄として
  `lingua.set.<uid>` に残る。`docs/BACKLOG.md` に一行。

## 変えてよいもの
- `www/core.js`（評価の節を消す）、`www/boot.js`（呼び出しを消す）、`www/store.js`（`storeRate()`、LinguaStore への頼み）、
  `www/onboard.js`（`obWhoGo()` で頼む）
- `tools/acct-check.mjs`（94 を書き直す）、`tools/store-check.mjs`（`opened` 行）
- `ios/App/App/LinguaStore.swift`（コメントだけ。`rateOpen` の名前）
- `docs/CHANGELOG.md`（コードより先）、`docs/FEATURE_RULES.md`（実装状況、2026-09-26 の「起動だけ数える」の箇条）、
  `docs/BACKLOG.md`（`SET.opened` が残る）、`docs/STATE.md` の `rateOpen()` に取り消し線だけ（docs-check が落ちるため）

## 変えないもの
- 見た目（iOS のダイアログで、画面は何も変わらない）
- `CLAUDE.md`、`.claude/`、`tools/pre-commit`、`tools/commit-msg`
- サーバー（`supabase/schema.sql`）── 列は足さない

## CLAUDE.md（リーダーが直す）
CLAUDE.md は「when it is asked for is the owner's (decision log 2026-09-25)」とだけ書いていて、五回目とは言っていない。
直す文は無い。足すなら § Shape の二つ目の後に（案）:
「It is asked once per account, when that account's `profile` row is made at the door (`obWhoGo()`), and `acct-check` 94 holds it.」
