# r126-decide ── オーナーの決定 2026-09-28（owner-asks 1〜10 とミュートの通知）

ブランチ `claude/r126-decide`（integ-0905 から）。決定: `docs/FEATURE_RULES.md` § 2026-09-28 オーナーに訊いた十件の答え。

## 触ってよい
- `supabase/schema.sql` ── ブロックの時にフォローを両向きに外すトリガー、ピン留めの列、検索の話題順（r124 の device の節 1560〜1620 は触らない）
- `tools/rls-check.mjs` ── 上の三つの CASES（r124 の KNOCK の節と CASES の末尾は触らない）
- `www/post.js` ── `pwSendFell`・`postUpAll`・`pwSend` の焼きの失敗・`migratePostInk`・`postPin`・`postLike`
- `www/net.js` ── `postUpAll` の呼び出し（扉）、ピン留めの読み書き、`netFindPosts` の並び
- `www/sns.js` ── `snsSetSort` と検索の並び
- `www/core.js` ── `migratePostInk` の呼び出し
- `www/home.js` ── `langDrop` の確認、↓ のメーター
- `www/keyboard.js` ── `kbDelRow`・`kbDelCol` の前の確認
- `www/i18n/*.js`、`www/act-map.js`、`www/index.html`（必要な行だけ）
- 各変更を持つ検査（`tools/*-check.mjs`、`tools/fixture.mjs`）
- `CLAUDE.md` 規則 12・19、`docs/FEATURE_RULES.md`、`docs/DATA_MODEL.md`、`docs/CHANGELOG.md`、この文書、`shots/r126-*.png`

## 触らない
- `supabase/functions/push-send/*`・`tools/push-check.mjs` ── `claude/r124-android-push` が同じ所を書き換えている。
  ミュートした人の通知は、r124 が取り込まれてからにする（リーダーへ）。
- それ以外すべて。本番には何も当てない。

## 報告（2026-09-28）

**確認済みはコードだけ（CODE CONFIRMED）。実機では見ていない。オーナーも見ていない。本番には何も当てていない。**

| # | コミット | 何を | 持つ検査（赤を見た） |
|---|---|---|---|
| 決定 | `f7ba7b29` | 十件を決定ログに。差し替えた文（ブロック前のフォロー・送れない投稿・17 か所・⭕メーター・♡・凍結の制作・CLAUDE.md 12/19 条・過去の節） | docs-check |
| 1 | `80df8904` | `block_unfollow()` トリガー、両向きのフォローを外す。DELETE REVIEW | rls（トリガーを外して赤） |
| 2 | `b17726e3` `e2141543` `9547e4cd` | `profile.pin`（自分の投稿だけ、`profile_seen` で読める）、netPut、ページの一番上に印。写しの古いピンは一度だけ上げる（`mePinUp`、`SET.pinUp`） | rls・acct 96（写しに書く形／印を立てない形で赤） |
| 3 | `63d262f6` | `post_seen.buzz`（いいね＋リポスト、一か所で数える）、話題は `order=buzz.desc`、続きは offset | find・rls（順を渡さない形で赤） |
| 4 | `f9d0b7aa` | 送れない投稿は「送信できませんでした」、画面に残る、下書きにしない。`pwSendFell`・`postUpAll` を消した。DELETE REVIEW | post 20（下書きに入れる形で赤） |
| 5 | `7f9a6534` | schema.sql の注釈を「凍結中も作れる」に | ── |
| 6 | 決定ログのみ | `migratePosts` は今のまま | ── |
| 7 | `c9bfe0ab` | `migratePostInk` を消した。DELETE REVIEW | card（起動で切る形で赤） |
| 8 | `39f780b3` | 字が焼けなければ止めて「うまくいきませんでした」（`net.failed` を使う、新しい鍵なし） | post（黙って送る形で赤） |
| 9 | `63993868` | キーボードの行・列のゴミ箱と `langDrop` の前に popAsk。新しい鍵 `kb.cut.q.r`・`kb.cut.q.c`（十言語） | kb・dl（訊かない形で赤） |
| 10 | `a09aa0e1` | ↓ の ⭕ メーターと ♡ の PMARK を消し、星一つ | spin 6・8（二つとも戻して赤） |

### 止めた物・リーダーへ
- **ミュートした人の通知（push-send）はやっていない**。`claude/r124-android-push` が push-send の同じ所（index.ts 212〜262）を書き換え中。r124 の取り込みの後か、r124 に足すか。
- **凍結中の「作れる」**: 画面は止めないが、サーバーの `is_member()` が slice の書き込みを断るので、凍結中に作った物はサーバーに上がらない（アプリを閉じると消える）。オーナーの「作れる」がそこまで含むかは訊いていない。
- **ピン**: タイムラインの行にはもう印が出ない（その人のページにだけ）。ページの一覧の 50 件より古い投稿をピンにすると、一番上に出ない（読み込んだ分にあれば出る）。
- **キーを選んで押すゴミ箱**は訊かないまま（決定は行・列）。同じボタンなので揃えるかはオーナー。
- **文言**: 「選んだ行（列）を消しますか？」「〇〇 を消しますか？」「削除／閉じる」はこちらで書いた。オーナーの物。
- 絵: `shots/r126-*`。送れない投稿・焼けない写真の「前」は写せる面が無く、撮っていない。
- fixture に面を足した（送れない投稿・焼けない写真・二つの確認）ので press・act の数は動く。ゲートは回していない（リーダーの物）。
