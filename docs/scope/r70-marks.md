# r70-marks ── 操作のボタンは字で書かない（OWNER 2026-09-23）

「あのさ、送信とか共有とかもそうだけど、文字でドカンって共有とか書くの禁止してるよね？
だから+〇とか送信なら紙飛行機マークにしてるはずなんだけど。これ禁止だから全部なくせや」

規則は `CLAUDE.md` § Shape の六つ目、決定ログは `docs/FEATURE_RULES.md` 2026-09-23。
持つ検査は `tools/marks-check.mjs`（`npm run marks`、gate の SLOW）。

## 数え方（面）

`press` と同じ集合 ── 全 view × 二つのプラン × 引数、オンボーディングの段と顔、
`halfDone()` の全部の顔（有料・無料）、全 `open*` の form ── に、各 route の本物の
`render()`（棒の隅のボタンは `show()` では出ない）と投稿画面を足す。1096 画面、
19561 個のボタン（`button`・`a`・`role=button` で `data-do` を持つもの）。

**字だけのボタン** ＝ 印（`svg`・`img`・`canvas`）が無く、字の中身が `t()` の英語の
文字列そのもの（`{0}` は何でも）。人の言語の語（単語の行、字の札）は `t()` の字では
ないので数えない。

**印の決まった操作** は英語の語で見分ける（act 名ではない ── 明日足されたボタンも明日
数えられる）：send/post/reply、share、add/new、delete/remove、close/cancel、back、edit、
undo/redo、search/find、settings、more。**ラベル全体がその語のとき**だけ。「アカウントを
削除」のような目的語つきは何が消えるかを言う行で、数えない。問い（`popAsk()`、`.popm`
と並ぶボタン）の答えは語で答えるもので、数えない。

## 印に替えたもの（直す前 20 件 → r70 で 18、残り 2 は r60）

| 画面 | 操作（act） | 前の字 | 印 | ファイル |
|---|---|---|---|---|
| カード | `cardSave` | 共有 | `ICON_SHARE` | card.js |
| お問い合わせ | `contactGo` | 送信 | `ICON_SEND`（新） | settings.js |
| 辞書を選んで | `wSelDel` | 削除 | `ICON_BIN` | shell.js `navDel()` |
| メモを選んで | `ntSelDel` | 削除 | `ICON_BIN` | shell.js `navDel()` |
| 規則を選んで | `g2SelDel` | 削除 | `ICON_BIN` | shell.js `navDel()` |
| キーボードを選んで | `kbSelDel` | 削除 | `ICON_BIN` | shell.js `navDel()`（keyboard.js は触らない） |
| 下書きを選んで | `dfSelDel` | 削除 | `ICON_BIN` | shell.js `navDel()`（post.js は触らない） |
| この言語について | `go`→world | 編集 | `ICON_PEN` | home.js |
| メモ（読む顔） | `openNoteEdit` | 編集 | `ICON_PEN` | notes.js |
| 語のページ | `openEdit` | 編集 | `ICON_PEN` | wordsheet.js |
| 新しい語 | `addOne` | 追加 | `ICON_ADD2` | wordsheet.js |
| 自分の項目 | `stAddOwn` | 追加 | `ICON_ADD2` | phases.js |
| 運営・スタッフ | `adminStaffAdd` | 追加 | `ICON_ADD2` | mod.js |
| 運営・お問い合わせ | `fbkDrop` | 削除 | `ICON_BIN` | mod.js |
| 運営・復旧 | `adRecFind` | さがす | `ICON_LENS` | mod.js |
| ノートの種類 | `nclsDel` | 削除 | `ICON_BIN` | grammar.js |
| まとめて消した後 | `wSelUndo` | 戻す | `ICON_UNDO` | words.js |
| 検索で音・字を押した後 | `fPick` | 戻る | `ICON_BACK` | home.js（fixture に顔を足した） |

仕組み：棒の隅は `navDo(label, name, args, on, {icon})`、選んで消す隅は `navDel()`
（いつもごみ箱）、ページの中の単独の印は `markBtn(icon, label, name, args, attrs)` 一つ
（CSS は `.navdo.navmk` と `.markb` 一つずつ）。字はどれも `aria-label`（`t()`）。

## 直さずに止めたもの（r60 の持ち物）── marks-check はこの二つで赤い

| 画面 | 操作 | 字 | 当てる印 | 直し方（r60 の後に） |
|---|---|---|---|---|
| 投稿画面 | `pwSend` | 投稿する | 紙飛行機 `ICON_SEND` | post.js:440 の `navDo(...)` の opts に `icon:ICON_SEND`（鍵の `mark` はそのまま横に並ぶ）。投稿の編集中の「保存」は印未決なので `PW.ed` の時は icon 無し |
| プロフィール | `openMe` | 編集 | `ICON_PEN` | me.js:659 の `<button class="meedit edit">` を `markBtn(ICON_PEN, t('me.edit'), 'openMe')` に（`.meedit` の位置取りは要確認・写真） |

r60 の持ち物で、印のある操作が字で出ているものは上の二つだけ（ソースでも `t()` の鍵から
一つずつ引いて確かめた: post.js の投稿メニューは印＋字、`kb.more`・`post.more`・
`sns.recent.drop`・`post.mark.del` は印で字は aria-label）。

## 替えなかったもの ── 印の決まっていない字のボタン（254）

何の印を当てるかは決めない（CLAUDE.md § Deciding）。操作としてよく出るもの：
完了（8 画面）・選択（5）・次へ（5）・保存（3）・確認（3）・アップグレードする・
やり直す・サインイン／サインアウト・アカウントを作る・スキップ・開く／設定を開く・
破棄する・上書き・戻す（通報の `modUp`）・切り抜き（`pwCutDo`、post.js）・拡大／縮小・
もっと読む／たたむ・購入を復元・登録・フォロー・パスワードを変える・PDF を選ぶ・
貼り付ける・コードを送る／もう一度送る・電話に反映・通報を退ける・停止／停止を解く・
「○○を削除」の行 9 本（アカウント・この言語・語・字・キー・キーボード・項目・形・投稿）・
種類を追加・語を派生・○件取り込む・あとで決める・今後表示しない。
残りの大半は選ぶもの（数・時制・品詞・書き方の種類・並べ方・タブ）で、操作ではなく値。

問いの答え（`popYes`/`popNo`、`capLapseShut`）の「削除」「閉じる」も字のまま。

全部の表（`node tools/marks-check.mjs --list` から。ja の列は英語の字から鍵を引いた
最初の一つで、「a」のような短い字では違う鍵に当たることがある ── en の列が正）：

| # | 操作（act） | 字（ja） | 字（en） | 最初に見えた画面 |
|---|---|---|---|---|
| 1 | `abScale` | 拡大 | Bigger | the abugida editor (paid) |
| 2 | `abScale` | 縮小 | Smaller | the abugida editor (paid) |
| 3 | `abSetVow` | 一つの | a | the abugida editor (paid) |
| 4 | `adminGo` | 詳細 | Open | vAdmin (free) |
| 5 | `adminStaffDrop` | {0}日 | @mod | the admin screen (paid) |
| 6 | `delWord` | 単語の削除 | Delete word | the word being edited (paid) |
| 7 | `dfSelOff` | 完了 | Done | the drafts, choosing, with nothing chosen yet (paid) |
| 8 | `dfSelOn` | 選択 | Select | the drafts, on their own page (paid) |
| 9 | `dirPick` | 縦書き（左から右） | Down, left to right | vWsys (free) |
| 10 | `dirPick` | 縦書き（右から左） | Down, right to left | vWsys (free) |
| 11 | `dirPick` | 右から左 | Right to left | vWsys (free) |
| 12 | `doImport` | {0} 字 | Import 1 letters | an alphabet about to come in (paid) |
| 13 | `doImport` | {0}語 | Import 1 words | a list about to come in (paid) |
| 14 | `fmPick` | 行為 | Action | vFm:tira (free) |
| 15 | `fmPick` | 形容詞化 | Adjective | vFm:tira (free) |
| 16 | `fmPick` | 副詞化 | Adverb | vFm:tira (free) |
| 17 | `fmPick` | 動作主 | Agent | vFm:tira (free) |
| 18 | `fmPick` | 指大 | Augmentative | vFm:tira (free) |
| 19 | `fmPick` | 可能形 | Can-form | the label of a form (paid) |
| 20 | `fmPick` | 使役形 | Causative | the label of a form (paid) |
| 21 | `fmPick` | 集合名詞 | Collective | vFm:tira (free) |
| 22 | `fmPick` | 条件形 | Conditional | the label of a form (paid) |
| 23 | `fmPick` | 指小 | Diminutive | vFm:tira (free) |
| 24 | `fmPick` | 一人称複数 | First person plural | the label of a form (paid) |
| 25 | `fmPick` | 一人称単数 | First person singular | the label of a form (paid) |
| 26 | `fmPick` | 未来形 | Future | the label of a form (paid) |
| 27 | `fmPick` | 命令形 | Imperative | the label of a form (paid) |
| 28 | `fmPick` | 道具 | Instrument | vFm:tira (free) |
| 29 | `fmPick` | 疑問 | Interrogative | the label of a form (paid) |
| 30 | `fmPick` | 比較級 | More-form | the label of a form (paid) |
| 31 | `fmPick` | 最上級 | Most-form | the label of a form (paid) |
| 32 | `fmPick` | 〜しなければならない | Must | the label of a form (paid) |
| 33 | `fmPick` | 否定の文 | Negative | the label of a form (paid) |
| 34 | `fmPick` | なし | None | vFm:tira (free) |
| 35 | `fmPick` | 反対 | Opposite | vFm:tira (free) |
| 36 | `fmPick` | 受身形 | Passive | the label of a form (paid) |
| 37 | `fmPick` | 過去形 | Past | the label of a form (paid) |
| 38 | `fmPick` | 完了形 | Perfect | the label of a form (paid) |
| 39 | `fmPick` | 場所 | Place | vFm:tira (free) |
| 40 | `fmPick` | 過去完了形 | Pluperfect | the label of a form (paid) |
| 41 | `fmPick` | 複数形 | Plural | the label of a form (paid) |
| 42 | `fmPick` | 現在形 | Present | the label of a form (paid) |
| 43 | `fmPick` | 進行形 | Progressive | the label of a form (paid) |
| 44 | `fmPick` | 性質 | Quality | vFm:tira (free) |
| 45 | `fmPick` | 二人称複数 | Second person plural | the label of a form (paid) |
| 46 | `fmPick` | 二人称単数 | Second person singular | the label of a form (paid) |
| 47 | `fmPick` | 三人称複数 | Third person plural | the label of a form (paid) |
| 48 | `fmPick` | 三人称単数 | Third person singular | the label of a form (paid) |
| 49 | `fmPick` | 動詞化 | Verb | vFm:tira (free) |
| 50 | `fmPick` | 〜したい | Want to | the label of a form (paid) |
| 51 | `fmrSetAt` | 後ろに | On the end | a rule written before the editor was two fields (paid) |
| 52 | `fmrSetAt` | 前に | On the front | a rule written before the editor was two fields (paid) |
| 53 | `fPick` | 一つの | a | vFind (free) |
| 54 | `fPick` | {0}分 | m | vFind (free) |
| 55 | `g2Put` | 疑問 | asking | vGram:v2:order (free) |
| 56 | `g2Put` | 主語 | doer | vGram:v2:order (free) |
| 57 | `g2Put` | 動詞 | doing | vGram:v2:order (free) |
| 58 | `g2Put` | 目的語 | done to | vGram:v2:order (free) |
| 59 | `g2Put` | どう | how | vGram:v2:order (free) |
| 60 | `g2Put` | いくつ | how many | vGram:v2:np (free) |
| 61 | `g2Put` | ない | not | vGram:v2:order (free) |
| 62 | `g2Put` | もの | the thing | vGram:v2:np (free) |
| 63 | `g2Put` | この | this | vGram:v2:np (free) |
| 64 | `g2Put` | 比較の相手 | what it beats | vGram:v2:order (free) |
| 65 | `g2Put` | なにをする | what it does | vGram:v2:np (free) |
| 66 | `g2Put` | 補語 | what it is | vGram:v2:order (free) |
| 67 | `g2Put` | どんな | what kind | vGram:v2:np (free) |
| 68 | `g2Put` | 場所 | where | vGram:v2:order (free) |
| 69 | `g2Put` | 持ち主 | whose | vGram:v2:np (free) |
| 70 | `g2SelOff` | 完了 | Done | the rules of a section, choosing (paid) |
| 71 | `g2SelOn` | 選択 | Select | vGram:v2:pl (free) |
| 72 | `g2SelTap` | {0}日 | noun: -k on the end | the rules of a section, choosing (paid) |
| 73 | `g2Take` | 主語 | doer | the word order, a fourth card on the board (paid) |
| 74 | `g2Take` | 動詞 | doing | the word order, a fourth card on the board (paid) |
| 75 | `g2Take` | 目的語 | done to | the word order, a fourth card on the board (paid) |
| 76 | `g2Take` | どう | how | the word order, a fourth card on the board (paid) |
| 77 | `go` | フォロー中 | Following | the timeline, following (paid) |
| 78 | `go` | おすすめ | For you | vOb step 1 |
| 79 | `go` | 最新 | Latest | vExplore (free) |
| 80 | `go` | 文字 | Letters | vAbugida (free) |
| 81 | `go` | アップグレードする | Upgrade | how the keyboard gets onto the phone (free) |
| 82 | `impAgain` | 最初から組み直す | Start over | a list waiting to be understood (paid) |
| 83 | `impScan` | 次へ | Next | a list being pasted (paid) |
| 84 | `impSetDup` | 上書き | Overwrite | a list about to come in (paid) |
| 85 | `impSetDup` | 飛ばす | Skip | a list about to come in (paid) |
| 86 | `impSetInto` | 文字 | Letters | a list waiting to be understood (paid) |
| 87 | `impSetInto` | 単語 | Lexicon | a list waiting to be understood (paid) |
| 88 | `impStep` | 次へ | Next | a list waiting to be understood (paid) |
| 89 | `impStep` | 貼り付ける | Paste it in | a file being chosen (paid) |
| 90 | `ipaToggle` | その他 | Other | the reading of a word (paid) |
| 91 | `ipaToggle` | この言語の音 | Sounds of this language | the reading of a word (paid) |
| 92 | `ipaToggle` | 母音 | Vowels | the reading of a word (paid) |
| 93 | `ipaToggle` | 接近音 | approximant | the reading of a word (paid) |
| 94 | `ipaToggle` | 摩擦音 | fricative | the reading of a word (paid) |
| 95 | `ipaToggle` | 側面接近音 | lateral appr. | the reading of a word (paid) |
| 96 | `ipaToggle` | 側面摩擦音 | lateral fric. | the reading of a word (paid) |
| 97 | `ipaToggle` | 鼻音 | nasal | the reading of a word (paid) |
| 98 | `ipaToggle` | 破裂音 | plosive | the reading of a word (paid) |
| 99 | `ipaToggle` | はじき音 | tap | the reading of a word (paid) |
| 100 | `ipaToggle` | ふるえ音 | trill | the reading of a word (paid) |
| 101 | `kbAdd` | ABC順 | ABC | choosing another keyboard (paid) |
| 102 | `kbAdd` | 音の表 | Chart | choosing another keyboard (paid) |
| 103 | `kbAdd` | フリック | Flick | choosing another keyboard (paid) |
| 104 | `kbAdd` | QWERTY | QWERTY | choosing another keyboard (paid) |
| 105 | `kbAdd` | タップ | Tap | choosing another keyboard (paid) |
| 106 | `kbApply` | 端末に適用 | Apply to the phone | a flick keyboard, being built (paid) |
| 107 | `kbDelKey` | このキーを消す | Delete this key | a key of the keyboard, opened (paid) |
| 108 | `kbDrop` | このキーボードを消す | Delete this keyboard | the two that undo a keyboard (paid) |
| 109 | `kbHeadCol` | 一つの | a | a flick keyboard, being built (paid) |
| 110 | `kbHeadCol` | {0}日 | d | a flick keyboard, being built (paid) |
| 111 | `kbHeadCol` | {0}時間 | h | a flick keyboard, being built (paid) |
| 112 | `kbLtPut` | 確定 | Confirm | a key with a letter chosen for it (paid) |
| 113 | `kbLtTap` | なし | Empty | a key of the keyboard, opened (paid) |
| 114 | `kbReset` | 最初から組み直す | Start over | the two that undo a keyboard (paid) |
| 115 | `kbSelOff` | 完了 | Done | the keyboards, choosing, with nothing chosen yet (paid) |
| 116 | `kbSelOn` | 選択 | Select | vKb (pro) |
| 117 | `kbSetKind` | 削除 | Backspace | a key of the keyboard, opened (paid) |
| 118 | `kbSetKind` | 文字 | Letters | a key of the keyboard, opened (paid) |
| 119 | `kbSetKind` | 改行 | New line | a key of the keyboard, opened (paid) |
| 120 | `kbSetKind` | スペース | Space | a key of the keyboard, opened (paid) |
| 121 | `kbSetPat` | ABC順 | ABC | the arrangement of a keyboard that already exists (paid) |
| 122 | `kbSetPat` | 音の表 | Chart | the arrangement of a keyboard that already exists (paid) |
| 123 | `kbSetPat` | フリック | Flick | the arrangement of a keyboard that already exists (paid) |
| 124 | `kbSetPat` | QWERTY | QWERTY | the arrangement of a keyboard that already exists (paid) |
| 125 | `kbSetPat` | タップ | Tap | the arrangement of a keyboard that already exists (paid) |
| 126 | `kbSettings` | 設定を開く | Open Settings | how the keyboard gets onto the phone (paid) |
| 127 | `kbSlot` | 一つの | a | a key with a letter chosen for it (paid) |
| 128 | `kbSlot` | {0}日 | d | a key of a flick keyboard, opened (paid) |
| 129 | `kbTapKey` | 一つの | a | a QWERTY keyboard, just made (paid) |
| 130 | `kbTapKey` | {0}日 | d | a QWERTY keyboard, just made (paid) |
| 131 | `kbTapKey` | {0}時間 | h | a QWERTY keyboard, just made (paid) |
| 132 | `kbTapKey` | {0}分 | m | a QWERTY keyboard, just made (paid) |
| 133 | `keepPress` | 保存 | Save | vWorld (free) |
| 134 | `ltDelete` | 文字の削除 | Delete letter | a letter beyond the thirty-eight, on the paid plan (paid) |
| 135 | `ltDropChar` | 字をつけない | No character | a borrowed letter, opened (paid) |
| 136 | `ltTakeChar` | 字をつけない | No character | characters on offer (paid) |
| 137 | `ltTakeSnd` | 一つの | a | the sounds, for one letter (paid) |
| 138 | `ltTakeSnd` | {0}日 | d | the sounds, searched (paid) |
| 139 | `ltTakeSnd` | {0}時間 | h | the sounds, searched (paid) |
| 140 | `ltTakeSnd` | {0}分 | m | the sounds, for one letter (paid) |
| 141 | `ltWobEnd` | 完了 | Done | the alphabet being held (paid) (paid) |
| 142 | `meFollow` | フォロー | Follow | somebody else's profile (paid) |
| 143 | `meFollow` | フォロー中 | Following | vFollows (free) |
| 144 | `modDown` | 投稿を消す | Delete post | the reports (paid) |
| 145 | `modDrop` | 通報を消す | Dismiss report | the reports (paid) |
| 146 | `modIn` | @{0} の凍結を解除 | Unsuspend @iri | the reports (paid) |
| 147 | `modOut` | {0}時間 | Suspend @veth | the reports (paid) |
| 148 | `modUp` | 戻す | Put back | the reports (paid) |
| 149 | `nclsPut` | なし | None | the noun classes, two of them (paid) |
| 150 | `nclsSave` | 種類を足す | Add a kind | naming a noun class (paid) |
| 151 | `ntSelOff` | 完了 | Done | the notes, choosing, with nothing chosen yet (paid) |
| 152 | `ntSelOn` | 選択 | Select | vNotes (free) |
| 153 | `obDone` | 完了 | Done | vOb step 0 |
| 154 | `obMailAgain` | 再送信 | Send it again | ob: the code out of the mail |
| 155 | `obMailCode` | 確定 | Confirm | ob: the code out of the mail |
| 156 | `obMailForgot` | 送る | Send the code | ob: having forgotten the password |
| 157 | `obMailGo` | アカウント登録はこちら | Create an account | vOb step 3 |
| 158 | `obMailGo` | パスワードをお忘れですか？ | Forgot your password? | vOb step 3 |
| 159 | `obMailGo` | ログインへ | Sign in instead | ob: making an account |
| 160 | `obMailIn` | ログイン | Sign in | vOb step 3 |
| 161 | `obMailUp` | アカウントを作る | Create account | ob: making an account |
| 162 | `obName` | 次へ | Next | vOb step 2 |
| 163 | `obNameLater` | あとで決める | Decide later | vOb step 2 |
| 164 | `obNewPwGo` | 決定 | Set it | ob: choosing a new password |
| 165 | `obPickScript` | ルーン文字 | Runic | ob: no script picked to borrow from |
| 166 | `obResetGo` | 確定 | Confirm | ob: the code of a reset |
| 167 | `obSkipAll` | ログインへ | Sign in instead | vOb step 0 |
| 168 | `obSnsGo` | 次へ | Next | vOb step 1 |
| 169 | `obWhoGo` | 次へ | Next | ob: saying who you are |
| 170 | `openPick` | 既存文字から選ぶ | Choose an existing character | one letter, on the paid plan (paid) |
| 171 | `pfSetTab` | いいね | Likes | vProfile (free) |
| 172 | `pfSetTab` | 投稿 | Posts | vProfile (free) |
| 173 | `pfSetTab` | 返信 | Replies | vProfile (free) |
| 174 | `pkSwitch` | {0}分 | ᚁᚂOgham | characters on offer (paid) |
| 175 | `plBuy` | サブスクライブする | Subscribe | vPlans (free) |
| 176 | `plPick` | {0}時間 | $4.99/ month | vPlans (free) |
| 177 | `plPick` | {0}％お得 | $49.99/ year17% off | vPlans (free) |
| 178 | `plPick` | {0}時間 | $9.99/ month | vPlans (free) |
| 179 | `plPick` | {0}％お得 | $99.99/ year17% off | vPlans (free) |
| 180 | `plPick` | {0}時間 | ¥750/ month | the plans, priced by the App Store (paid) |
| 181 | `plPick` | {0}％お得 | ¥9,000¥6,000/ year33% off | the plans, priced by the App Store (paid) |
| 182 | `posPick` | {0}分 | Idiom | what kind of word it is (paid) |
| 183 | `postUnfold` | たたむ | Show less | a long post opened again (paid) |
| 184 | `postUnfold` | もっと読む | Show more | a long post folded (paid) |
| 185 | `pushSw` | フォローされたとき | Followed | vSet:push (free) |
| 186 | `pushSw` | いいね | Likes | vSet:push (free) |
| 187 | `pushSw` | 返信 | Replies | vSet:push (free) |
| 188 | `pushSw` | リポスト | Reposts | vSet:push (free) |
| 189 | `pushSw` | 今日のお題 | Today’s prompt | vSet:push (free) |
| 190 | `pwCutAll` | 全体 | Whole | cropping a photograph (paid) |
| 191 | `pwCutDo` | 切り抜き | Crop | cropping a photograph (paid) |
| 192 | `pwMarkClose` | 完了 | Done | letters on a photograph (paid) |
| 193 | `pwSend` | 保存 | Save | a post being edited (paid) |
| 194 | `regPick` | なし | None | how it is said (paid) |
| 195 | `regPick` | 敬語 | Polite | how it is said (paid) |
| 196 | `regPick` | 俗語 | Slang | how it is said (paid) |
| 197 | `regPick` | 口語 | Spoken | how it is said (paid) |
| 198 | `sayPh` | {0}分 | m | openIpaG |
| 199 | `setAuto` | システム | System | vSet:look (free) |
| 200 | `setGPos` | 中の文の後 | After the inner sentence | vGram:v2:cx (free) |
| 201 | `setGPos` | 主文の後 | After the main sentence | vGram:v2:cx (free) |
| 202 | `setGPos` | 名詞の後 | After the noun | vGram:v2:degree (free) |
| 203 | `setGPos` | 中の文の前 | Before the inner sentence | vGram:v2:cx (free) |
| 204 | `setGPos` | 主文の前 | Before the main sentence | vGram:v2:cx (free) |
| 205 | `setGPos` | 名詞の前 | Before the noun | vGram:v2:degree (free) |
| 206 | `setKbRom` | キーに文字を表示 | A letter on each key | ob: the walk: the key the letter went on |
| 207 | `setLtFil` | 描画済み | Drawn | openLtView |
| 208 | `setLtFil` | 音なし | No sound | openLtView |
| 209 | `setLtFil` | 未描画 | Not drawn | openLtView |
| 210 | `setMyFont` | 自作文字を表示する | Show my own letters | vWsys (free) |
| 211 | `setPwForgot` | パスワードをお忘れですか？ | Forgot your password? | vSet:pw (free) |
| 212 | `setPwGo` | パスワードを変更 | Change password | vSet:pw (free) |
| 213 | `setSignOut` | ログアウト | Sign out | vSet:acct (free) |
| 214 | `setWldHide` | 公開 | Public | vWorld (free) |
| 215 | `setWldSecDl` | 文法 | Grammar | vWorld (free) |
| 216 | `setWldSecDl` | キーボード | Keyboard | vWorld (free) |
| 217 | `setWldSecDl` | 文字 | Letters | vWorld (free) |
| 218 | `setWldSecDl` | 単語 | Lexicon | vWorld (free) |
| 219 | `shMake` | 用紙を書き出す | Save the sheet | a sheet being made (paid) |
| 220 | `shTakeIn` | 1 字を取り込む | Take in 1 | a sheet that came back (paid) |
| 221 | `snsSetFil` | #今日のお題 | #Today’s prompt | vFilter (free) |
| 222 | `snsSetFil` | フォロー中 | Following | vFilter (free) |
| 223 | `snsSetSort` | 話題 | Top | vSort (free) |
| 224 | `snsTagGo` | #今日のお題 | #TodaysPrompt | vFeed (free) |
| 225 | `spAdd` | 一つの | a | the reading of a word (paid) |
| 226 | `spAdd` | {0}分 | m | the reading of a word (paid) |
| 227 | `stDelOwn` | 項目の削除 | Delete section | a grammar stage somebody added (paid) |
| 228 | `storeManage` | サブスクリプションを解除する | Cancel subscription | vPlans (free) |
| 229 | `storeRestore` | 購入を復元 | Restore purchases | vPlans (free) |
| 230 | `subPick` | 抽象名詞 | Abstract | sub (free, rendered) |
| 231 | `subPick` | 助動詞 | Auxiliary | the subclass under it (paid) |
| 232 | `subPick` | 集合名詞 | Collective | sub (free, rendered) |
| 233 | `subPick` | 普通名詞 | Common | sub (free, rendered) |
| 234 | `subPick` | 自動詞 | Intransitive | the subclass under it (paid) |
| 235 | `subPick` | 連結動詞 | Linking | the subclass under it (paid) |
| 236 | `subPick` | 物質名詞 | Mass | sub (free, rendered) |
| 237 | `subPick` | なし | None | the subclass under it (paid) |
| 238 | `subPick` | 固有名詞 | Proper | sub (free, rendered) |
| 239 | `subPick` | 他動詞 | Transitive | the subclass under it (paid) |
| 240 | `upFile` | PDF を選ぶ | Choose a PDF | a sheet to read back (free) |
| 241 | `wdDerive` | 派生語の作成 | Derive a word | the word being edited (paid) |
| 242 | `wfmDel` | この活用を削除 | Delete this form | a form being written (paid) |
| 243 | `wipeAll` | アカウントを削除 | Delete account | vSet:acct (free) |
| 244 | `wipeLangs` | この言語を削除 | Delete this language | vSet:acct (free) |
| 245 | `wordsSetFil` | {0}分 | Idiom | openFil |
| 246 | `wordsSetFil` | 意味なし | no meaning | openFil |
| 247 | `wordsSetSort` | 品詞ごと | By part of speech | openSort |
| 248 | `wSelOff` | 完了 | Done | the dictionary, choosing, with nothing chosen yet (paid) |
| 249 | `wSelOn` | 選択 | Select | vWords (free) |
| 250 | `wsPick` | アブジャド | Abjad | vWsys (free) |
| 251 | `wsPick` | アブギダ | Abugida | vWsys (free) |
| 252 | `wsPick` | アルファベット | Alphabet | vWsys (pro) |
| 253 | `wsPick` | 表語文字 | Logography | vWsys (free) |
| 254 | `wsPick` | 音節文字 | Syllabary | vWsys (free) |
