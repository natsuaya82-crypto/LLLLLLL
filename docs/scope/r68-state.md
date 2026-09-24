# r68-state ── 「まだ訊いていない」「空」「読めない」を別の状態に（2026-09-24）

作業セッション r68-state（`claude/r68-state`、`origin/integ-0905` 4d7cb549 から）。
指示: `claude/leader-briefs:docs/scope/brief-r68-state.md`、追加 A（r80 の端末側）・B（r78 の残り）。

### Scope
- Goal: r73 § 2-3・§ 2-4、r63 0-3。追加 A: サーバーが外すブロックを端末から消す。追加 B: r78 の残り。
- Owns: brief の一覧、追加で import.js・onboard.js・share.js・load-baseline・find/word/pua-check・again/base-check
- Does NOT own: それ以外すべて
- Check to run: 担当の検査の赤だけ。全ゲートは回さない。

## 覆う一文と、それを持つ検査

| 一文 | 一か所 | 検査（面を数える） |
|---|---|---|
| `PLAN` が null の間、プランを訊く所は切らない・書かない・外へ渡さない・値段を言わない | `www/core.js` § has: `can()`/`has()` は null、`upStop(ok)`（押す）・`planNo(ok)`（形）・`planSaid(ok)`（書く・渡す）・`planNum()`（数）、`planFits()` | `state-check` A（全 `*Cap` と `CAN` の全キー 18）・B（全 `*Seen`/`*Hidden` 5 が Pro と同じ長さ）・C（211 画面を描いて Pro より多く書かない・渡さない、1378 ボタンを押して値段へ行かない）・D（源で `go('plans')` と値段の pop は `upStop` だけ、`planKnown()` は core.js だけ） |
| 読んだ物は答え・空・読めないのどれかで、読めなかった slice には書かない。他人の物は形を確かめて描く | `slState(kind, s)`・`slOpen(kind)`・`slWr()` の守り（core.js） | `state-check` E（`JSON.parse(slRd(` 0、11 slice × 壊れ 3 形 = 29 で一バイトも変わらず上がらず「保存できませんでした」）・F（postInkOK・inkSteps・wldSliceOf・meCount） |

## コミット

| # | 何 | 赤を見た形 |
|---|---|---|
| 64b07a44 | find-check:561 `pwLine([{t: ln}])` | 直す前 find 9 件赤 |
| 0d0c275f | word-check:651 のコメント | ── |
| 71f5d21d | home・import・onboard・phases の `.value` 8 → `actVal()`、pua-check の OWED を仕組みごと消す | home.js:2450 を戻して B 赤 |
| 2afae096 | `ltDrawn()` を消し `ltHasShape()` 一つに（呼び手 letters・sound・sync・again・base） | 整理（振る舞い無し） |
| f45d0f9d | r80 の端末側（netFeed 3・netPromos・`netBlocked`・`NET_BL`・検索と通知の filter） | load-check・acct-check（緑） |
| c57ee0f1 | 覆う一文 1 ＋ state-check ＋ fixture の面 3 ＋ CHANGELOG ＋ PAID_FEATURES ＋ shots | 土台で A・B・D 赤、postEdit を戻して D 赤 |
| 3282361c | 覆う一文 2 ＋ CLAUDE.md 規則 22 ＋ STATE.md:593 | 守りを外して E 赤、F の四つを戻して F 13 件赤 |

## 振る舞い
- 答えの無い間: 辞書・字母・自分の段・キーボードの一覧は畳まない、140 字の輪は描かない、押すと「接続できません」、
  投稿を直す鉛筆も（文は `post.editplan` のまま）、書き方は言語のまま投稿に載る、字の名前を枠の名前にしても行を消さない、
  プランの画面は「購入」の代わりに「接続できません」、広告・AdMob・ATT は出さない。
- 読めない slice: 言語は空で開き、その slice への保存は「保存できませんでした」。`kbWrite()` が読めないキーボードを
  ディスクごと消していたのを止めた。`netKeeps()` は長さで比べない。
- 他人の物: 形でない ink は本文、`ink.sp` は 0〜2、形の違う slice は空の節、来ていない数は 0 と描かない。
- ブロック: 端末は答えを篩わない。起動でブロック一覧を読まなくなり、他人のページと explore の戸口で読む。

## 保存するもの
- 変わらない。新しく貯まるもの無し。**消すものが一つ減る**（読めないキーボードの slice の `slRm`）。CHANGELOG 2026-09-24 二件。

## 回した検査
state（赤も緑も）・find・pua・load・acct・dead・es5・import・docs・assets、最後に近い物として migrate・plan・keep・
again・kb・world・card・post を一度ずつ（全部緑）。**全ゲートは回していない。**

## やり残したこと（理由）
- **空の catch 26・null/[] にする catch 10**（r73 付録 A）は、slice の読み手の 10 か所以外は手を付けていない。
  どれも別の面（ネット・設定・端末の写し）で、一つずつ中身を読まずに消すと継ぎ当てになる。
- **`pullSay()` と `slState()` を一つに**は、していない。前者は問い（空中・答えた・落ちた）、後者は貯めた文字列の
  状態で、入力が違う。二つを一つの「描くもの」の関数にまとめると、画面ごとに「読めない」をどう描くかという
  言葉の問いになる（オーナー）。
- **電波なしで全画面を描き 0・「まだ何もない」・「非公開」が出る数 = 0** の検査は書いていない。直したのは `meCount` の
  0 だけ。「Untitled・Private」「まだ何も投稿していません」は pullSay の道で、画面ごとの言葉が要る。
- 描くだけで書く所（Pro でも）: `vWorld` の `saveWld`、通知の `notSeen()` の `saveTry` ── r73 § 2-2 の面、state-check が
  一覧に出すだけ。
- halfDone の面は state-check では押していない（面が「押して作る」物なので、描くと押すが分けられない）。press が押す。

## 持ち物の外に手を出したもの
- `docs/STATE.md:593` の `sySide()` → `slState()`（名前が消えて docs-check が赤になる一語だけ。リーダーのファイル）。

## 持ち物の外で見つけたこと（直していない）
- `tools/acct-check.mjs:947・1042` の `NET_BL = [];` は `NET_BL` が無くなったので何もしない行になった（害は無い、コメントが古い）。
- r51-spacing・r48-push-app の枝に持ち物のファイルのコミットがあるが、9/22–23 の物で integ に取り込み済み（0b4cf80b）と読んだ。

## オーナーへ
- 答えの無い間に無料の人へ広告を出すか（今は出さない。ATT はインストールで一度）。
- 答えの無い間のプランの画面に何を書くか（今は既にある「接続できません」）。
- 読めない slice のある言語をどう見せるか（今は空で開き、保存すると「保存できませんでした」）。

## リーダーの指示が間違っていた所
1. r80「`postBlocked()` と `postShown()` の中のそれ・`sns.js:2000` を消す ── 投稿はもう来ない」: 来ないのは**これから**の
   答えで、ブロックの前に降りた投稿は端末の写し（`POSTS`）に残る（`postTake()` は足すだけ）。消すとタイムライン・スレッド・
   人のページに出続けるので残した。
2. r80「`tools/load-baseline.txt` の `rest/v1/block` の行も消す」: 残す `netBlockedRead()` 自体が同じ読みをする。行を消すと
   上限を付けることになり、上限の先の人の「…」が嘘を言う。行は残して理由を書き直した。
3. r80「残す: `netBlockedRead()` の @ の写し」: それを起動で読む所は無く、消す `netBlocked()` が代わりに読んでいた。
   そのままでは誰も読まないので、引き表に `blocks` を足し、他人のページと explore の戸口で読むようにした。
4. brief「広告と ATT の門は `LinguaAds.swift`」: ATT は `start` を呼ばれた時だけ訊くので、門は `admStart()`（www）一つで
   足りた。Swift は触っていない。

**CODE CONFIRMED のみ。DEVICE CONFIRMED・OWNER CONFIRMED は無い。**
