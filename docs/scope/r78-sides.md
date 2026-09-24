# r78-sides — 読む側は投稿に載っている物だけ、PUA は入力欄の外へ出ない（2026-09-24）

作業セッション r78-sides（`claude/r78-sides`、`origin/integ-0905` 7c890d26 から）。
指示: `claude/leader-briefs:docs/scope/brief-r78-sides.md`、追加（2026-09-24 06:14、キーの画面の確定）。

### Scope
- Goal: 読む側は投稿に載っている物だけで描き、何も書かない ／ PUA は入力欄の外へ出ない（r73 §2-9・§2-10、
  r76 が残した物）。先にゲートの赤（sheet-check の暦、press の .edit/.ppr/.tfont）。追加: キーの画面の確定を消す。
- Owns: 指示書の一覧（post・card・sns・me・sheet・act の IN・glyph の PUA・grammar/letters/wordsheet の PUA・
  keyboard の 1318 と追加の確定・cal・numbers・index.html の書体の CSS・act-map・i18n・検査・CLAUDE.md 8/12/13・
  CHANGELOG・決定ログ・この file）
- Does NOT own: それ以外すべて
- Check to run: 担当の検査の赤だけ。全ゲートは回さない。

## 報告

### 覆う一文と、それを持つ検査

| 一文 | どこで一つに | 検査（面を数える） |
|---|---|---|
| 読む側が描く物は投稿に載っている物だけ。読む側は何も書かない | `postRuns()`（文字として来た私用領域の字は U+FFFD） | line-check 10（タイムラインの `.pline` 全部の私用領域の字 = その投稿の形の字）・11（タイムラインとカード二枚を描く間のページの `save*` 全部と localStorage と ME・SET = 0） |
| 私用領域は入力欄の外へ出ない。配達一か所 | `puaTyped()`（glyph.js）→ `actTyped()`・`actVal()`（act.js） | pua-check A（全ルート・全面の欄 292 に打って、受け口 38 が渡された物）・B（`.value` の読みは actVal だけ、持っていない所は OWED で数を合わせる） |
| 直しは書いた時の ink、切り直すのは打ち直した時だけ | `pwSaveEdit()`・`postCutOf()` | pua-check C（字を描き直し字間を変えた後の直しで ink が一字も変わらない） |
| 一行の分け方は postRuns 一か所 ── 写真の上の字も | `pwMarkCut()`→`postRuns()`、幅は `pwMarkW()` | pua-check E（改行・空白 = inkSpace） |
| 字の形は inkGeo/inkSet だけ | keyboard.js kbMark・me.js meAvOf・sheet.js | ink-check A（OWED を仕組みごと消した） |
| 描いていない字はローマ字（カード） | card.js cardUnit | card-check 8 |

### 直した物（コミット順）

| # | 何 | ファイル | 赤を見た形 |
|---|---|---|---|
| 1 | ゲートの赤 sheet-check: 数字 7 は形を持ち、fixture が自作文字オフで来るのでローマ字 ── 決定どおり。検査の前提（その一問はオンで訊く） | tools/sheet-check.mjs | ltLineChar を l.st に戻して 0 pixels |
| 2 | 読む側: postRuns の私用領域 → U+FFFD、line-check 10・11、sides-check の偽のコメント | post.js, line-check, sides-check | 10: 一行を外して 4 件、11: postAvatar に saveMe を戻して saveMe 4 |
| 3 | カードの借りた字 → ローマ字 | card.js, card-check | 今のコードで「1 units carry α」 |
| 4 | r76 の OWED 三つ（kbMark・meAvOf・sheet の d.sh）と OWED の仕組み | keyboard.js, me.js, sheet.js, ink-check | meAvOf を l.st に戻して「me.js:98」 |
| 5 | PUA は欄の外へ出ない（配達・下書き・直し・名前の無い字・写真の上の字）、pua-check 新設（SLOW） | act.js, glyph.js, grammar.js, letters.js, wordsheet.js, post.js, 検査, package.json, gate.mjs, CHANGELOG | A・B・C・C2・D・E それぞれ（C は最初緑 ── 描き直さないと切り直しても同じ ink。検査を直した） |
| 6 | fixture: 写真の上の字を Lingua キーボードで打った形で | fixture | ── |
| 7 | sns.js の snsFil の偽のコメント | sns.js | ── |
| 8 | CLAUDE.md 規則 8・10・13 | CLAUDE.md | ── |
| 9 | 追加: キーの画面の確定を消す | keyboard.js, act-map, i18n×10, shell.js（一行）, kb-check, 決定ログ, CHANGELOG | 書く一行を抜いて 7 件、バーにボタンを戻して 1 件 |
| 10 | press の赤: `.meedit.edit`（r60 のペンで画面ごと無くなった）の CSS を消す／`.ppr` は fixPromo が render() で描いていて、歩きの前の面が残した状態でサインインの扉を描いていた ── vFeed() に／`.tfont` は写真の上の字の欄が着る。fixture の偽のコメント | index.html, fixture | 測った: 全 press で売れた枠の面が「Continue with Apple」を描いていた |

### 振る舞い
- 他人の投稿の本文に私用領域の字があっても、自分の字・別の投稿の字で描かれない（U+FFFD）。
- カード: 描いていない字は借りた字ではなく名前（ローマ字）。
- 用紙の字のキーにローマ字の印、用紙の字を顔に、空の数字の枠へ用紙の字を形として。
- Lingua キーボードで打った字は、どの欄からも、ローマ字と打った通りの切り方になって出る。
- 下書きは字を id で持つ。直す欄は投稿の形で開き、行を変えなければ ink はそのまま。
- 名前の無い字だけの行も送れて描かれる。
- 写真の上の字: 打った通りに切る（システムキーボードのローマ字は文字）、空白は本物の幅、改行で行が分かれる、欄は .tfont。
- キーの画面: 押した字がすぐキーに入り、もう一度で外れる。確定は無い。

### 保存するもの
- **下書き `body`**: `ln` がローマ字に、`cut` が増える（字の id）。前の下書きは書き換えない・消さない（開く時に今の並びで読む ── 前と同じ）。CHANGELOG 2026-09-24。
- 写真の上の字 `marks[].cut`（下書き・投稿の前の composer の中）。
- 直した投稿の `ink` は行が同じなら書いた時のまま（前は毎回切り直して null になっていた）。
- 消すものは無い。

### 回した検査
sheet・line・card・ink・post・draft・pua・word・forms・kb・act・i18n・plan（単独で、土台と同じ一つの赤）・press・速い物。
press（全部を直した後に一度）: 緑 ── 誰も着ない class 無し、押したボタン 19368 → 19818、名前 283/285 → 282/284
（kbLtPut が消えた分）。どちらも意図した動き。
**全ゲートは回していない。** 土台で既に赤: docs-check・token-check・writes-check（r79 の報告どおり）、kb-check の 4 件、
plan-check の 1 件 ── どれもこの変更の前から。

### 持ち物の外で、この変更で偽になった／直す必要がある物（直していない）
- `docs/DATA_MODEL.md:782` の `postInkTyped()` → `postInkOf()`、「composer と edit の両方が使う」→「送る時に作り、直しは行が同じなら書いた時の ink」。
- `docs/WALK-141.md:57・145` の `puaRoman()` → 打ち消すか `actVal()`（wordsheet の例文は actVal で読む）。
- `tools/word-check.mjs:651` のコメント「glyph.js § puaRoman」→ `§ puaTyped`。
- `tools/find-check.mjs:561` の `PW.ln = ln;` → `pwLine([{t: ln}]);`（PW の行は cut 一つ、`PW.ln` はその射影。直に書くと送る物が空）。
- pua-check B の OWED: `home.js`1・`import.js`1・`onboard.js`1・`phases.js`5 の `.value` を `actVal(el)` に。
- `ltHasShape()` と `ltDrawn()` が同じ関数（letters.js:81・569）── どちらを残しても呼び手が持ち物の外（ltDrawn: sound.js・sync.js・again/base-check、ltHasShape: home.js・share.js・wsys.js）。
- CLAUDE.md 規則 10 の一文（`puaRoman()`・`postCutTyped()`）は、持ち物は 8・12・13 だったが、この変更で偽になったので直した ── 手を出したことを言っておく。
- 追加の確定で `www/shell.js` viewReset の `kbLtPick=null` 一行と `tools/kb-check.mjs` の確定の節を直した（持ち物の外、指示の必然として）。

### オーナーへ（決めていない）
- カードの描いていない字が字間を空けた大文字（card.js:275・434、意図か）。
- モデレーション・通知の `p.ln` を ink で描くか（sns.js の通知、mod.js）。
- 投稿欄の `.tfont` を無条件か `myFontField()` か（r73 §5-14）── 今は `.pline, #pw-ln` の規則で無条件。
- ウィジェットの見本と本物（r76 のオーナーへ 1）。
- **開いている言語と違う言語の投稿を直して行を変えた時**: 欄はローマ字で開き、打ち直した行は今の言語の字で切られる（投稿の言語の字母はこの端末に無い）。直しを断るか、そのままか。
- 読む側で私用領域の字を U+FFFD で出す（inkChar の前例に合わせた、見た目の判断）。
- 写真の上の字の欄の書体が serif（.sfont）から UI の書体（.tfont の落ち先）に変わった。

### 写真（shots/）
- `r78-edit-{before,after}-ja.png` ── 直す欄（前: 全部ローマ字、後: 描いた k）
- `r78-mark-open-{before,after}-ja.png` ── 写真の上の字を選んだ所（前: serif・440 の板、後: 打った通り・字幅の板）
- `r78-kbkey-*`・`r78-kbkey-chosen-*`・`r78-kbslot-*` ── キーの画面（確定の有無）
- `r78-mark-*`・`r78-drafts-*` ── 前後が一バイトも同じ（fixture の範囲では見た目が変わらない）

**CODE CONFIRMED のみ。DEVICE CONFIRMED・OWNER CONFIRMED は無い。**
