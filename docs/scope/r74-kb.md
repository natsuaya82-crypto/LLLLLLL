# r74-kb — キーボードのシートと保存ボタンの画面（2026-09-24）

作業セッション r74-kb（`claude/r74-kb`、`origin/integ-0905` 6d0e60db から）。
指示書: `claude/leader-briefs:docs/scope/brief-r74-kb.md`。元の調べ: `docs/scope/r73-audit.md`
§ 2-16・§ 2-8・§ 2-3（sharePush の一行）、`docs/scope/r63-audit.md` K1〜K4、`docs/scope/r60-up.md`
「止めたこと K1」。

## 覆った一文と、それを数える検査（全部 `tools/kb-check.mjs` の末尾「r74 — the surfaces」）

| 覆う一文 | 置き場 | 検査が数えるもの | 直す前の赤 |
|---|---|---|---|
| 選択と巻き戻しは今の画面・今の板の物。離れたら忘れ、板は言語と `kbId` で名指す | `kbLeft()`（keyboard.js）← `viewLeft()`・`viewReset()`・`kbNoted()`。`navHas()` は route で答える | タブで離れて戻った後の `KBH`・`KBU`、言語 B で巻き戻しても A の配置が来ない | 2 |
| シートの座標は一つ、`KB_COLS` | `kbStart()`・`kbSheetAt()`。描画・`kbDelCol`・`kbColRows`・`kbColAt`・`kbCellPut`・`kbHeadPaint`・`kbAlign1` がそれで数える。`kbCols` は消した | 3 枚の板（10 キー＋2 キー、4・3・1 キーの行、無料 QWERTY）の全 30 列で「光るキー＝ゴミ箱が一キーぶん取るキー」、入れる行＝取る行、4 キーの板で右寄せが 10 列目・左寄せが 1 列目、升に入れたキーがその升に立つ | 3 |
| 横 10・行の天井・見ている板に触れるかは、それぞれ一か所 | `kbRoomFor()`・`kbRoomRow(rows)`・`kbEdit()`。層キーの置き場は `kbFaceSpot()` | コメントを外したソースで `KB_COLS`・`kbRowsMax()` との比べの数（1 か所ずつ）、`kbIsFree(kbShow)`/`KB.kbs[kbShow-1]` が `kbEdit` の外に 0 | 3 |
| 「これはもうありません」は `goneBox()` だけが描く | keyboard.js の 2 か所 | www/ の `t('form.gone')` 全部（`goneBox` の中か `toast(` 以外は落とす） | 1 |
| 移行は足すだけ | `migrateKbFree()` は写しを `KB.was0` に置く | 古い形の KB を移行して、一覧は作った板だけ・保存された slice に写しが残る | 1 |
| 保存の修理は保存した板だけ（r63 K3） | `kbVFix()` は `kbEdit()` の板 | 板 1 の一人ぼっちの二段キーが、板 2 を直しても動かない | 1 |
| キーボードの天井はサーバーの答えで数え、答えが無ければ数えない（r63 K4） | `kbCount()` は `langMineKnown()` が偽なら null、他の言語は `slMine()`。`kbCapStop()` は null で「接続できません」 | 写真（`.got`）だけの二枚を数えない、未回答で null・値段を出さない | 2 |
| プランが未回答の間、電話のキーボードに何も渡さない（r73 § 2-3 の sharePush） | `shareSig()` が null を持ち、`sharePush()` は null で何もしない | Pro の板を渡した後 `planForget()` → render で書き込み 0 | 1 |

名前の変更: `kbCellAdd` → `kbCellSel`（升を選ぶ）と `kbCellPut`（帯の ＋）。消した関数: `kbCols`、
`kbRoomIn`、`kbAddKey`（アプリの根から届かず kb-check だけが呼んでいた）、`kbLayPut`（別名）。

## リーダーの追加（2026-09-24 00:32）── press の赤「a row pushed down to make a group」

`HELP.kb`（無料プランの「キーボードの設定方法」）の `.note` が `margin-top:16px` で組を作っていた
（r75 の press の検査、`docs/scope/r75-shape.md` やり残し 1）。区切りの行 `.grpsep` に替えた。
同じ形のキーのページの「このキーを消す」（`margin-top:12px;border-bottom:none`）も
`.grpsep` ＋ `.set end` に。直す前の press で `1 FOUND` を見た。直した後の press は回していない。
写真: `shots/r74-kbhelp-{before,after}-ja.png`（28px 高くなる）、`shots/r74-keydel-{before,after}-ja.png`
（削除行が 20px 下がる）。幅いっぱいの `.btn` 2 つ（「設定を開く」「アップグレードする」）の
margin は press が数えない形（リストの兄弟ではない）なので触っていない。

## 止めたこと（持ち物の外、または決めごと）

1. **K1（保存ボタンの画面の「いいえ」）は入れていない。** 覆う一文は二つの半分でできている:
   (a) `keepOn` が初めて登録された時に `keepSnap()` を取り、「いいえ」で `keepBack()` する（shell.js、
   持ち物）、(b) その間 `netSaveUp()` が走らない（**www/net.js、r71-net の持ち物**）。
   (a) だけを入れると、1.2 秒の後には slice がもう上がっていて、`keepBack()` が `.was` も戻すので
   以後その slice は「動いていない」と読まれ、端末は開いた時の形・サーバーは変えた形のまま
   食い違い、次の起動でサーバーの形が戻ってくる。今（「いいえ」で何も戻らない）より悪いので、
   (a)(b) を一緒に入れる必要がある。(b) に要るのは `netSaveUp()` の頭の一行で、例えば
   「保存ボタンのある画面が何か持っている間は始めない」。**ただし範囲はオーナーか
   リーダーの判断が要る**: 今いる画面だけで訊くと、タブで離れた先の別の保存が下書きごと送る
   （`netSaveUpGo()` は動いた slice を全部送る）。どの画面の下書きでも止めるなら、下書きを
   残したまま他の画面で書いた物も「保存」まで上がらない。検査（保存ボタンのある画面を page
   から集め、書いて「いいえ」→ 開いた時の形・上がった要求 0）は、赤のまま門に入れられないので
   書いていない。
2. **短い行を保存の時に 10 まで埋めるか**（r73 § 5-13）は決めていない。指示書の覆う一文には
   「行は保存の時に 10 に埋め」とあるが、同じ指示書が「手で作った短い行の扱い」をオーナーへと
   している。埋めるとシートの見た目は変わらず（中央寄せと同じ `kbLead`）、**電話のキーボードでは
   横いっぱいに伸びていた短い行が中央に寄る**（保存したキーボードが見た目で動く）ので止めた。
   代わりに座標を「描いた位置」一つにした。そのため指示書の検査「どの板でも保存後
   `kbUsed(row)===KB_COLS`」は書いていない。
3. **二段キー（結合）の「下」は、まだ行の中の位置で数える。** `kbUnderOf`・`kbVJoin`・`kbVFix`・
   `kbSelSpread`・`kbJoinDown`・持ち運び（`kbDragTo`・`kbPairMove`）は `kbAtOf()`（行頭 0）で
   「真下」を探す。長さの違う二行では、シートに描かれる真下と一致しない。シートの座標に揃えると、
   既に保存されている結合のうち描かれ方が揃っていない物で `kbVFix()` が `h`/`up` を外す（人が
   作った物の欄を消す）ので、DELETE REVIEW 無しには進めない。どう扱うかはオーナー。
4. `langSaveAll()`（core.js、r71-net）が言語を離れる時に `saveKb()` を呼び、押していないのに
   `kbVFix()`・`kbWayOff()` が走る（r63 K3 の後半）。今回で範囲は見ている板だけになったが、
   押していない書き込みであることは変わらない。core.js は持ち物でない。
5. r73 § 2-3 の面全体（`PLAN` が null の間の `can()`・天井・一覧・値段）は触っていない。
   持ったのは sharePush の一か所だけ。

## オーナーへ（決めない）

- 短い行を保存の時に 10 まで埋めるか／拡張をシートの描き方（中央）に合わせるか（r73 § 5-13）。
- 長押しの 10px（決定 2026-09-01）がキーボードの「持って運ぶ」（今は 380ms・半径 12px）にも
  及ぶか（r73 § 5-13）。
- K1 の範囲（上の 1）。
- 結合の「下」をどの座標で数えるか（上の 3）。

## 見て変わること（写真）

- `shots/r74-align-right-{before,after}-ja.png` ── 4 キーの板で 2 キーの行を右寄せ。前は g 列で止まり、
  今は j 列（10 列目）に着く。
- `shots/r74-gone-key-{before,after}-ja.png` ── 無いキーのページ。前は小さな灰色の左寄せの文、
  今は他の画面と同じ「これはもうありません。」（上に出ている「接続できません」は撮影スクリプトに
  偽のサーバーが無いための物で、この変更とは関係ない）。
- 選択が章を離れると消えること、列の光りとゴミ箱が揃うことは、状態の違いで画面の描き方は
  変わっていない。

## 回したもの

- `node tools/kb-check.mjs`: 直す前で上の表の赤を一つずつ見て、直した後に緑。
- `node tools/plan-check.mjs`・`node tools/acct-check.mjs`: `kbCount()` を呼ぶので一度ずつ（どちらも通った）。
- `tools/pre-commit`（速い物と i18n）: 毎コミット。
- **全ゲートは回していない。** press・act・i18n の数（ボタン数・画面数）は fixture に面を一つ足した
  （「狭い板の短い行を右へ寄せた面」）ので動くはず。

## 端末

CODE CONFIRMED のみ。DEVICE CONFIRMED・OWNER CONFIRMED は無い。電話のキーボード（sharePush）と
キーボードのシートは端末で見ていない。
