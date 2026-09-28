# findings-log1 — docs/FEATURE_RULES.md § Owner decision log, headings 252..1699
Base: HEAD 3612e691 (claude/audit-docs, contains origin/integ-0905 7ad9b612). Branch merge status measured with
`git merge-base --is-ancestor origin/claude/<b> origin/integ-0905`: merged = r103 r104 r105 r106 r107 r108 r109 r112 r115 r119 r91 r92 r93;
NOT ancestor (but content may be in integ by another road) = r100 r101 r102 r113(1 fixture commit ahead) r46 r90 r94 r95 r96 r97 r98 r99.

## F1 docs/FEATURE_RULES.md:252 (お題は毎日、太平洋時間の 0 時)
- OLD-RULE-STANDING supabase/setup.md:755-765 (§ 9-5 毎日にする) — the dashboard table for the cron job has Name/Schedule/Type/Method/URL/Header and no timeout; the decision (line 258) and docs/BACKLOG.md:13 say the job's wait was 1000ms and had to be 60000ms (supabase/once/2026-09-27-prompt.sql:5-9 sets `timeout_milliseconds:=60000`). A person following setup.md today re-creates the 1000ms job that failed.
- Fix: add a row to the table at supabase/setup.md:765: `| Timeout | 60000 ms（既定の 1000ms では daily-prompt が間に合わず timed_out になる ── 2026-09-27） |`

## F2 docs/FEATURE_RULES.md:276 (Android 版)
- STATUS-WRONG — says 「土台は作業中（r115-android）」. `origin/claude/r115-android` is an ancestor of origin/integ-0905 (merged); android/ is in the tree (android/app/src/main/java/com/tokinets/lingua/{MainActivity,LinguaStorePlugin,LinguaSharePlugin,LinguaPushPlugin}.kt, commits 87e06075 5b342099 84f81b3a 4c97a157). Store plugin: "THERE IS NO STORE ON ANDROID YET"; push plugin rejects everything.
- Fix: `- Implementation status: 土台は integ-0905 に入った（r115-android 取り込み済み ── android/、Kotlin の LinguaShare／LinguaStore／LinguaPush、手で押すビルド）。課金（Google Play 直結・verify-plan の確かめ）・通知・キーボード・ウィジェットは未（LinguaStorePlugin は products 空・buy は断る、LinguaPushPlugin は全部断る）。`

## F3 docs/FEATURE_RULES.md:286 (投げ縄)
- STATUS-WRONG — 「IMPLEMENTED（`claude/r113-lasso`）」: the lasso is in integ-0905 (merge 9d246f37 「取り込み: claude/r113-lasso」, 8a9fed1e); only fixture commit 6b45dec3 is left on the branch. All cited names exist: www/glyph.js:2601 geLasso, 2682 geLsDown, 2698 geLsMove, 2727 geLsUp, 2768 geLsBin, 2635 geLsShut, 2663 geLsPast, 2530/2546/2560 gePtDown/Move/Up; thresholds match (glyph.js:2645-2649 2*D, D, 0.6*ext, 0.3*w*h; 2664 0.6 step). Commit 6e32d1e5 cites 「実機 170」, so 「端末では未確認」 is UNVERIFIED (may be stale).
- Fix: `IMPLEMENTED（integ-0905、r113-lasso 取り込み済み）── …（名前はそのまま）… 端末: 170 で囲む／なぞるをオーナーが見た（6e32d1e5）か、未確認かを書く`

## F4 docs/FEATURE_RULES.md:295 (通信・食い違い・保存を一本に)
- STATUS-WRONG (minor) — 「実装（claude/r112-one …）」: r112-one is merged into integ-0905. Names verified: www/net.js:310 netSend1, 2444 netPut; www/sync.js absent; supabase/schema.sql slice_in (389…). Only one XMLHttpRequest left in www/ (www/net.js:343, inside netSend1's road). 「本番の schema は未適用」 UNVERIFIED.
- Fix: `実装（integ-0905、r112-one 取り込み済み、CODE CONFIRMED のみ・実機未確認・本番の schema は未適用）`

## F5 docs/FEATURE_RULES.md:307 (課金者の印)
- STATUS-WRONG — 「実装（r109、`claude/r109-badge`…）」: merged into integ-0905. And the entry's Affected features stop at 投稿の頭・引用・人のページ・自分のページ; the code went further on an owner word not in the log: www/post.js:1541-1548 whoName() 「この一覧とかにも♦️つけてよ」 OWNER 2026-09-27 (lists of people, the post answered, the quoted post) — recorded only in docs/CHANGELOG.md:62.
- Fix: Implementation status → `実装（integ-0905、r109 取り込み済み、CODE CONFIRMED のみ）`; add to Affected features: `人の一覧・答えている投稿・引用の中の名前も同じ印（whoName() in www/post.js、「この一覧とかにも♦️つけてよ」OWNER 2026-09-27）。`

## F6 docs/FEATURE_RULES.md:351 (フォントの書き出しは文字の画面の右上)
- Implemented: www/sound.js:835-846 vLetters navDo(...ICON_SHARE) → vLtOut; ltFontOut www/sound.js:889 gated can('font') (www/core.js:2831 font:'plus'). 
- Stale sentence the move falsified (code, core area): www/core.js:2828-2829 comment 「ltFontOut() in www/keyboard.js is the one place it is asked」 — ltFontOut is in www/sound.js:889 (grep: only sound.js and act-map.js). Fix the comment to `www/sound.js`.

## F7 docs/FEATURE_RULES.md:378 (組み合わせの一マス) / :421-423 (r106) / :433 — branch names in status
- STATUS-WRONG (minor, same shape) — :378 「一マスは r105、`claude/r105-quad`。書き出しの画面は r104」, :433 「実装（r106、`claude/r106-rp`…）」: r104-blk, r105-quad, r106-rp are all ancestors of origin/integ-0905. Code verified: www/wsys.js:305 wsParts / :329 wsInto (seq.length>4, co.length>2, dy only if y1<=mid, dx only if x1<=mid — matches the decision), www/route-map.js:61 page('ltout', vLtOut), SCRIPT.blk read nowhere (grep `\.blk\b` www/*.js: no hit). :423 ? beside the name: www/glyph.js:1370 navTop('', helpQ('glyph')); repost line www/post.js:4199 post.rp.
- Fix: replace `claude/r10x-…` with `integ-0905（r10x 取り込み済み）` in each.

## F8 docs/FEATURE_RULES.md:513 (投稿の画面は揺れない) — Area line
- STATUS-WRONG — Area names 「`--vvtop`・`--vvkb` in `www/shell.js`」 unstruck, beside struck ~~vvFit()~~ ~~vpKbWire()~~; the Decision itself says --vvtop is removed, and `grep -rn -- '--vvtop\|--vvkb' www` finds nothing. keepStill exists (ios/App/App/MainViewController.swift:74, bounces=false :86).
- Fix: `…（~~`vvFit()`~~・~~`vpKbWire()`~~・~~`--vvtop`~~・~~`--vvkb`~~ in `www/shell.js`、`ios/App/App/`）`

## F9 docs/FEATURE_RULES.md:579 (キーボードはプランで分けない) — Implementation status
- SUPERSEDED-BODY-LEFT / STATUS-WRONG — status says r95 put in 「`=文字` の枠と「文字を入力」の欄」; the newer 2026-09-25「字を選ぶ画面は一つ」(:535) says 「キーボードの編集画面に r95 が足した「文字を入力」欄は消す」, and it is gone (no 文字を入力／字を入力または in www/i18n/ja.js; the kinds are www/home.js:368 pkKindsHTML / :391 pkKind). 「手書きは r96」 reads as not-yet; handwriting is built: ios/App/LinguaKeyboard/HandPad.swift, KeyboardViewController.swift:125.
- Fix: `- Implementation status: 実装（integ-0905、CODE CONFIRMED のみ・実機未確認）── キーボードは段を訊かない（~~`CAN.kb`~~・~~`kbCap()`~~ は無い）、既存の文字は `pkKindsHTML()`・`pkKind()`（`www/home.js`）から `=文字` の枠へ、「文字を入力」の欄は 2026-09-25「字を選ぶ画面は一つ」で消えた。フォントの書き出しは Plus（`ltFontOut()`、`www/sound.js`）。手書きは r96（`ios/App/LinguaKeyboard/HandPad.swift`）。`

## F10 OLD-RULE-STANDING docs/PAID_FEATURES.md:154, :541, :620-627 — replaced by docs/FEATURE_RULES.md:562 (キーボードはプランで分けない)
- :154 「無料の枠とは… キーボードは固定 QWERTY」 — keyboards are built on free now; what free is limited in is letters.
- :541 table of what free shows after a plan ends: 「the keyboard | the fixed QWERTY, in the app and on the phone | `kbOf()`」 — www/keyboard.js:1209 kbOf() returns kbBoards()[kbApplied()] with no plan question; nothing narrows a board to the QWERTY when a plan ends.
- :624-627 「the keyboard can be a QWERTY … built from LETTERS every time it is shown, stored nowhere, with nothing to set」 — that is the FIRST board only (CLAUDE.md § What the free plan is already says 「Keyboards are not divided by plan (OWNER 2026-09-25, 1.0.3)」).
- Fix: :154 → `…a–z と `!` `?` と基数ぶんの数字（キーボードは段で分けない ── 2026-09-25）、文法は…`; :541 → `| the keyboard | every board somebody built, unchanged — keyboards are not divided by plan (2026-09-25); a key carrying a letter past the free thirty-eight shows what `ltSeen()` shows | `kbOf()`, `www/keyboard.js` |` (UNVERIFIED what a key of a hidden letter draws — measure before writing); :624 → `…the FIRST keyboard can be a QWERTY with the drawn letters substituted in (`kbFixed()`), built from LETTERS every time it is shown, stored nowhere; the others are built, on every plan.`

## F11 docs/FEATURE_RULES.md:583, :730, :732 — 【差し替え済み】 headings in the wrong shape
- SUPERSEDED-FORMAT — FEATURE_RULES.md:211-216 says a wholly replaced entry keeps its heading 「opened with 【差し替え済み YYYY-MM-DD】, and ONE line naming what replaced it (`- 差し替えた決定: 「<heading>」（date）`)」. These three carry the mark at the END with no date and `→` in the heading, and have ZERO lines under them (e.g. :583 `### 2026-09-25 キーボードは誰でも作れる、…【差し替え済み】→ 2026-09-25「キーボードはプランで分けない」` followed directly by a blank line). Compare the correct :380-381, :898-899.
- Fix (:583): `### 【差し替え済み 2026-09-25】キーボードは誰でも作れる、自作文字のキーボードとフォントの書き出しは Plus から（2026-09-25）` + `- 差し替えた決定: 「キーボードはプランで分けない ── 置ける字は自作文字と既存の文字、差は自作文字をいくつ作れるかだけ」（2026-09-25）`; same shape for :730 (→「キーボードはプランで分けない」2026-09-25) and :732 (→「複数のキーに一度に字を入れる」2026-09-25). docs-check does not see these: tools/docs-check.mjs:632 `if (!/^### 【差し替え済み/.test(lines[i])) continue` only reads headings that OPEN with the mark, so an end-of-heading mark is counted as a live entry.

## F12 docs/FEATURE_RULES.md:585 (投稿の見た目) — partly replaced, part left
- SUPERSEDED-BODY-LEFT — the Decision 「投稿画面に切り替えを一つ置き」 and Implementation status 「切り替え ── 投稿画面の意味の欄の頭の行に「意味」の一語」 are replaced by 2026-09-26「意味のオン・オフは丸いトグル」(:483-487: 「「意味」と書いた字の切り替えは消す」). pwMnOff() is still the one answer (www/post.js:212). Also 「`claude/r94-social`」 — r94-social is not an ancestor of integ-0905 (52 commits ahead), but pwMnOff/.pline 15px (www/index.html:854 .9375rem)/.pmn 12px (:954 .75rem)/LinguaLine (www/glyph.js:3293) are all in integ.
- Fix: replace the 「切り替え ──」 clause with `切り替え ── 2026-09-26「意味のオン・オフは丸いトグル」で丸いトグルに替わった（`pwMnOff()` が答える一つは同じ）。`, and `claude/r94-social` → `integ-0905`.

## F13 docs/FEATURE_RULES.md:627 (広告は入れる。今はまだ出さない) — ad code left in www/
- DECISION-DIFFERENT (sns area, www/post.js:4353-4358) — status says 「`www/` から広告の行と `promo` を読む所を外した」. The row still draws a PR mark off `p.ad`: `(p.ad? '<span class="ppr">'+esc(t('post.pr'))+'</span>' : '')`, under a comment naming `netPromos()` as what puts `ad` on — `grep -n 'function netPromos' www/net.js` finds nothing. Nothing sets `p.ad` any more, so the branch is a wire with one end unattached (CLAUDE.md rule 5 prose), and the comment names a function that does not exist.
- Proposed: either remove the `p.ad` branch and its comment (and `post.pr` if nothing else uses it) with the rest of what r93 took out, or — since the decision says the ad shape 「は生きている」 and 出す日に戻す — say so in the comment and strike `netPromos()` there (`~~netPromos()~~, taken out by r93-noads; 35076603 is what puts it back`). Which of the two is the owner's (the entry says what comes back is the revert of 35076603).

## F14 docs/FEATURE_RULES.md:642 (ミュートの広さ) — push still rings
- DECISION-NOT-IMPLEMENTED (server, supabase/functions/push-send/) — Decision: 「ミュートした人: … その人からの通知（いいね・返信など）も出さない」. The in-app notices do (notices() uses mute_hides(), schema.sql), but `grep -rni mute supabase/functions/push-send/` → no hit: an iPhone push from a muted person still rings. The status admits it (「**iPhone のプッシュ通知はまだ鳴る**（push-send は持ち物の外）」) but docs/BACKLOG.md has no entry (`grep -ni 'mute\|ミュート' docs/BACKLOG.md` → nothing), so nobody carries it.
- Fix: implement in push-send (pushMay()/pushTo() asking mute_hides the way it relies on block_hides, index.ts:51), or add a BACKLOG entry: `## ミュートした人からの iPhone の通知はまだ鳴る（2026-09-25 の決定の残り）── push-send が mute を訊かない。`
- Also STATUS-WRONG minor: 「`claude/r88-mute2`」 is not an ancestor of integ-0905 (content is in: www/core.js:2435 planTopFull, www/post.js:97 postMuted, www/glyph.js:980 ICON_MUTE).

## F15 docs/FEATURE_RULES.md:663 (前の版のファイル) + :455 (録音と書き出したシートは端末に残さない) — documents left saying a recording lives on the phone
- OLD-RULE-STANDING docs/RECOVERY.md:89-95 — table row 「`Documents/Voices/` | 録った声のうち、まだサーバーに上がっていない物（下書き・送れなかった投稿・書いている投稿の声）」 and 「声は投稿が上がって `vu` になった時にそのファイルを消す」. Replaced by 2026-09-26 (:463 「録音は投稿・下書きと一緒にサーバーにあり」): www/rec.js:240 voKeep() puts a recording into the bucket as it is made (netUp), and docs/DATA_SAFETY.md:165-169 already says 「Nothing is written on the phone」.
- Fix RECOVERY.md:91: `| `Documents/Voices/` | 前の版が書いた声だけ（2026-09-26 から録音はその場でサーバーの post-media に上がり、端末には書かない）。下書き・送れなかった投稿が名指す間は読み、名指さない物は起動で消す（`voSweep()`） | 上書きしない |` and drop the 「投稿が上がって vu になった時にそのファイルを消す」 sentence.
- Same stale sentence in code (ios): ios/App/App/LinguaShare.swift:288-296 「Documents, and only until the post it is on has gone up … a recording is a file and the post being written carries its name. When the post lands … the file goes」 — rewrite to say the folder only holds what an earlier build wrote.

## F16 docs/FEATURE_RULES.md:684 (2026-09-24 画面・タイムライン・キーボード・保存・お金) — three bullets replaced by newer entries, not marked
- SUPERSEDED-UNMARKED — 「**広告**: 今は作らない。」 (:713) is replaced by 2026-09-25「広告は入れる。今はまだ出さない」(:627).
- SUPERSEDED-UNMARKED — 「**Android**: 今の更新が終わってから作る。」 (:717) is replaced by 2026-09-27「Android 版 ── 同じリポジトリ…」(:270), which is being built now (android/).
- SUPERSEDED-UNMARKED — 「**2台で同じ物を直した時**: 後から保存した方が残る。」 (:704) is restated/replaced by 2026-09-27「通信・食い違い・保存を一本に」(:291: 「欄は後から直した方が残る（2026-09-04）、一覧は両方足す」, judged on the server by slice_in()).
- Fix: delete the three bullets and add one line each: `- （広告の行は 2026-09-25「広告は入れる。今はまだ出さない」に替わった）` / `- （Android の行は 2026-09-27「Android 版」に替わった）` / `- （2台の行は 2026-09-27「通信・食い違い・保存を一本に」に替わった ── 欄は後から直した方、一覧は両方）`.
- STATUS-WRONG minor: 「r84（`claude/r84-save` …）」 — r84-save is not an ancestor of integ-0905, but langWrites (www/core.js:1539), keepDrafting (www/shell.js:565), NET_PAGE=50 (www/net.js:2761), kbKeyAtSheet (www/keyboard.js:2016), limit 3 versions (supabase/schema.sql:530, :3657) are all in integ. Say `integ-0905`.

## F17 docs/FEATURE_RULES.md:755 (リーダーの監査は30分ごと)
- OLD-RULE-STANDING CLAUDE.md:527 — 「the one往復 …, the fifteen-minute audit, and the three shapes a stuck session takes」; docs/LEADER.md:37 is 「## 監査 ── 30分ごと。OWNER DECISION 2026-09-24」.
- Fix CLAUDE.md:527: `the thirty-minute audit`.
- Also CLAUDE.md:526 「a session for the light items alone → five minutes each」 vs docs/LEADER.md:26 「一件 15 分以内」 (not from this entry; same sentence, same stale shape).

## F18 docs/FEATURE_RULES.md:814 (操作のボタンは字で書かない ── 印にする) — partly replaced by 2026-09-27, status stale
- SUPERSEDED-UNMARKED (part) — 「**画面の送る・共有は、印で、バーの右上**（`navDo()` の `icon`、右上を描く一か所）」 has a newer exception, 2026-09-27「字の画面の共有（SVG）は、字の横に並べて二つで真ん中」(:261 — 「共有は右上の角という決まり（2026-09-23）の、この画面だけの例外」); www/sound.js:1389-1399 draws `.ltshare` beside the letter. CLAUDE.md § Shape already carries it; this entry does not.
- Fix: add after the bullet: `  字の画面（vLetter）の共有だけは例外で、字の横 ── 2026-09-27「字の画面の共有（SVG）は、字の横に並べて二つで真ん中」。`
- STATUS-WRONG — 「r60 の持ち物（post.js の投稿ボタン、me.js のプロフィール編集）は数えて一覧に書き、r60 の後に直す」: both are done — www/post.js:485 `icon:(PW.ed? '' : ICON_SEND)`, www/me.js:705 `markBtn(ICON_PEN, t('me.edit'), 'openMe')`. Fix: `r70-marks。tools/marks-check.mjs が持つ。r60 の二つ（投稿ボタン・プロフィール編集）も印になった（www/post.js:485 ICON_SEND、www/me.js:705 ICON_PEN）。`

## F19 docs/FEATURE_RULES.md:898-899 (【差し替え済み 2026-09-25】広告は Twitter と同じ形) — the pointer names a heading that does not exist
- SUPERSEDED-FORMAT / STATUS-WRONG — 「- 差し替えた決定: 「広告は出さない ── AdMob も、売れる広告枠も、追跡の問いも無い」（2026-09-25）」: no entry has that heading (`grep -n '広告は出さない' docs/FEATURE_RULES.md` → only :899 and the pointers at :5074 :5188 :5196 :5232). The 2026-09-25 entry is 「広告は入れる。今はまだ出さない」(:627), and it says the opposite of the pointer's title: the ad shape of 2026-09-23 「は生きている」. So 898 is not wholly replaced at all — the SHAPE (擬態・右上に PR・売れる枠・pro は無し) is kept, and only 「今は AdMob」/出す時期 changed.
- Fix: rename the pointer to `「広告は入れる。今はまだ出さない」（2026-09-25）`, and either restore 898 as a live entry with the part that went (「今は AdMob」「今出す」) removed in one line, or keep the mark — which of the two is the owner's reading (627 says 「広告の形（2026-09-23…）は生きている」, so restoring looks right). Same stale title at :5074, :5188, :5196, :5232 (other readers' range) and docs/apple.md:716 (「Lingua は広告を出さず、誰も追跡しません（…2026-09-25「広告は出さない」）」 → cite 「広告は入れる。今はまだ出さない」; the sentence about today stays true).

## F20 docs/FEATURE_RULES.md:955 (人の言語の ↓ は ⭕) — 「未決」 line stale
- STATUS-WRONG — 「- 未決: 回っている間の印は、アプリに既にある回る印（`snsWaitWord()`）。文字どおりの ⭕ ではない。」: the row draws a literal ⭕ meter now — www/home.js:1809-1811 `'<span class="sv wldmeter" role="status" data-meter=…>'+iconMeter(WLD_TAKING[k])`, wldMeterPaint (home.js ~1900). snsWaitWord (www/sns.js:56) is not what the row uses.
- Fix: delete the 未決 line; status → `r59-take。行は iconMeter() の ⭕（進みが取れない間は回る）、済みは ⭕☑️（www/home.js wldGetRow・wldGet）。tools/take-check.mjs が持つ。`
- CONFLICT (owner's, UNVERIFIED on a screen) — 2026-09-27「押して通信を待つ間は、星が回る」(:297-305: every press-started request darkens the screen and spins netSpin, 「押す物すべて」) and 2026-09-23 :935/:767 (↓ shows the ⭕ meter on the row while it comes). ↓ is a press (DO('wldGet') → actRun → netPressed, www/act.js:100; netSlices is counted by netOn, www/net.js:222-226), so both run at once and the row's meter is under the dark. Neither entry restates the other. Ask: does ↓ keep its own ⭕ (and so stay out of the star), or does the star replace it?

## F21 docs/FEATURE_RULES.md:795-798 (一行を描く仕組みを一つにする) — status partly stale
- STATUS-WRONG — 「写真の上の字・下書き一覧・通知の行は r60 の持ち物で、直し方は `docs/scope/r76-lines.md`」: the notices row IS the one mechanism now — www/sns.js:2912 `'<span class="ntfp pline '+dirClass(…)+'">'`, www/index.html:2927 `.ntfp.pline` (and 2026-09-24 :691 decided 「通知の一覧の投稿の一行: 描いた字で出す」). The drafts list is still plain text (www/post.js:912 `<span class="dfl">'+esc(draftLn(d)…)`), so that part stays open; photo text UNVERIFIED.
- Fix: `… 通知の行は .pline になった（www/sns.js ntfp）。写真の上の字・下書き一覧（www/post.js vDrafts の .dfl）はまだ別の描き方 ── 直し方は docs/scope/r76-lines.md。`

## F22 docs/FEATURE_RULES.md:1234-1238 (2026-09-12 朝の六つ) — (b) is no longer 「半分」
- STATUS-WRONG — 「**(b) は半分** ── … **一覧にはまだ出ない**：段を訊けていない起動では `dlCap()` が 0 になり読む側の一覧が畳まれるため。… (`docs/BACKLOG.md` § 段を訊けていない間、一覧を切るか)」. Today www/core.js:2406-2410 dlCap() is `planNum(0, PLUS_DL, PRO_DL)`, and planNum (core.js:2903-2905) returns `null` while !planKnown(); www/home.js:2838-2851 langsSeen(): 「A CEILING THAT IS NOT A NUMBER DOES NOT CUT … if(cap===null) return ids;」 quoting this very decision. The BACKLOG section named does not exist (`grep -n '段を訊けていない' docs/BACKLOG.md` → nothing).
- Fix: `**(b) は入った** ── 取った言語は端末に残り（`langWhose()` が read、`again-check`）、段を訊けていない起動では天井が `null` で一覧を切らない（`dlCap()`／`planNum()`、`langsSeen()` in `www/home.js`）。`

## F23 docs/FEATURE_RULES.md:1331 (同じものを何度も運ばない) — partly replaced, status stale
- SUPERSEDED-UNMARKED — the first of the three, 「保存の写しを返さない」, is replaced by 2026-09-27「通信・食い違い・保存を一本に」(:291, :295 「答えは「今サーバーが持っている物」」): www/net.js:2494-2502 netSliceUp reads `a.body` (the server's merged slice) off every save's answer and writes it back (`slAsApp(slWr,[k, now])`).
- STATUS-WRONG — 「`claude/r10-wire` で作業中。」: nothing is 作業中 on that branch (it is an old line, 2874 commits off integ-0905); what the entry asked is in integ in its 09-27 form (netSaveNow sends only slTouched slices, no read before the write — www/net.js:2579-2588).
- Fix: Decision → drop 「保存の写しを返さない」 and add `（保存の答えに今のサーバーの中身が載るのは 2026-09-27「通信・食い違い・保存を一本に」で決まった形）`; status → `送る前の読みは無く（netSaveNow は人が書いた slice だけを一つずつ送る）、…起動の二度読みは UNVERIFIED — measure before writing.`

## F24 docs/FEATURE_RULES.md:1366-1367 (♡は押した瞬間に点き…／運営が戻せる画面)
- STATUS-WRONG — 「復旧は BACKLOG（リリース後、日数待ち）」: built — supabase/schema.sql:3690 admin_restore_lang() (is_staff), :3660 admin_hist(), three versions (schema.sql:530 `order by at desc limit 3`, :3657 `limit 3`), tools/hist-check.mjs; 2026-09-24 :727-728 says 「言語を前に戻す ── 入った」 and 2026-09-23 :843 records the gate.
- Fix: `復旧は入った（2026-09-24「言語を前に戻す」── `admin_hist()`・`admin_restore_lang()`、版は三つ、`hist-check`・`npm run rls`）。`
- CONFLICT (owner's) — this entry (2026-09-09): 「♡は押した瞬間に点いて数が 1 動く。サーバーに届かなかったら♡が消えて数が戻る。**何も言わない。**」 vs 2026-09-27「押して通信を待つ間は、星が回る ── 押す物すべて」(:300: 「画面は暗くなって押せない…落ちたら「接続できません」のポップに替わる」). ♡ is a press (DO → actRun → netPressed); netMark (www/net.js:4633) goes through netSend, so the star spins and the screen darkens over a ♡ that has already lit; postLike's failure road (www/post.js:4629 `function(){ delete PMARK[k]; render(); }`) puts no pop up. Neither entry restates the other.

## F25 docs/FEATURE_RULES.md:1371 (2026-09-09 の午後の十一) and :1407 (DL 言語の四つ) — slide-to-give-back is built; 4 の但し書き replaced
- STATUS-WRONG :1433 — 「3 は今の形。4 は BACKLOG。」 — item 4 (返す道は言語切り替え画面の行をスライドして消す) is built: www/home.js:2690-2692 `<div class="swipe" data-lgs=…><span class="swdel" DO('langDrop')…>`, www/home.js:2707 langDrop() → netTakeDrop (www/net.js:1858), DELETE REVIEW cited as CHANGELOG 2026-09-09. Fix: `4 は入った（`langDrop()`・`netTakeDrop()`、行をスライドして −）。`
- SUPERSEDED-UNMARKED :1402-1405 — 「**4 の但し書き** … リーダーの仮置き：**サインインした人の言語にする**（違えば言ってもらう）」 is answered the other way by the same day's :1356-1357 「一度もサーバーに上がっていない古い言語をサインインした人のものにする ── 作らない「いらん」」, and again 2026-09-24 :734 (「どの印も名指さない写しは誰の物にもならない」) and 2026-09-26 :461 (「特別に扱わない」). Fix: replace the 但し書き's last sentence with `答えは同じ日の「♡は押した瞬間に…」の二つ目 ── 作らない（「いらん」）。`
- DECISION-DIFFERENT (UNVERIFIED which list the 17 are) — www/home.js:2694-2700 langDrop's comment: 「Nothing is asked first. What stands behind it is the road back rather than a dialog」 — the shape 2026-09-24 :696 replaced (「消す前の「○○を消しますか？」: 確認の窓を出す … 十の基準の 9「削除→Undo」はこれで置き換え」; CLAUDE.md § Shape 「a confirm before a delete」). Giving a language back is a DELETE (it has a DELETE REVIEW). Whether it is one of the 「17 か所」 is not written anywhere I could find — owner's/leader's to say; the comment at least argues from the replaced rule.

## F26 docs/FEATURE_RULES.md:1444-1445 (DL した言語は「印」) — Decision's 未決 answered
- SUPERSEDED-BODY-LEFT — 「元が**非公開**にしたときは未決。」 is decided by 2026-09-09「DL 言語の四つ」item 2 (:1417-1419 「非公開は新規 DL を止めるだけ」); the status line at :1458 already points there. Fix: delete 「元が**非公開**にしたときは未決。」 and let the status line carry it.

## F27 docs/FEATURE_RULES.md:1653-1656 (保存されないのは仕様…) — the server half is no longer silent
- STATUS-WRONG — 「**サーバー側の失敗はまだ黙っています。**~~`netSlicePut()`~~ の失敗の道は `www/net.js` … **そこは残って います。**」. Today www/net.js:2554-2558 netSaveNow's failure road `no(d,s,m){ … netPop(d, s, m, netSaveNow); … }` puts up 「接続できません」 with ［再接続］, and a slice that did not land stays marked (netSlicesUp comment 2590-2596).
- OLD-RULE-STANDING CLAUDE.md rule 11 (§ 11, the paragraph 「**And the server half still says nothing** -- a slice that `netSliceUp()` could not put up stays marked and goes again with the next press, silently; `docs/BACKLOG.md` carries it.」) — false for a pressed save (netSaveNow → netPop), and docs/BACKLOG.md has no such entry (`grep -n -i 'silent\|黙って\|says nothing' docs/BACKLOG.md` finds nothing about it). UNVERIFIED for bkTouch's no-`done` road — it goes through the same `no()` so it pops too.
- Fix (both): `サーバー側の失敗は「接続できません」のポップ（netSaveNow の no() → netPop()、［再接続］で同じ保存）。届かなかった slice は印が残り、次の押しでまた行く。`

## F28 docs/FEATURE_RULES.md:1697-1698 (電波が無いときは、前に読み込んだ分を出す) — where the picture is
- STATUS-WRONG — 「`www/net.js` が画面だけの写しを一本持ちます。」 — the picture is `lingua.<id>.<slice>.got`, written by slGot() (www/core.js:976 slGotKey, :987 slGot) and read last by slRd(); slMine() never reads it (CLAUDE.md rule 22). Fix: `入りました 2026-09-05。写しは `lingua.<id>.<slice>.got`（`slGot()`、`www/core.js`）で、`slRd()` が最後に読み、上る道の `slMine()` は読まない。`

## F29 docs/FEATURE_RULES.md:1395-1396 (2026-09-09 の午後の十一) — no status, and the items can be read off the code
- STATUS-WRONG — 「**2026-09-23 に番号ごとの照合はしていない。**…どれが入ったかは、各番号の Area のコードを読むこと。」 Read today: 1 slide-to-give-back — www/home.js:2690 `.swipe`/`.swdel` DO('langDrop'); 7 @-posts only under 返信 — www/home.js:639 `pfTab==='re'` → postToWho() (www/post.js:4027, 「返信にだけ出して」 OWNER 2026-09-09 quoted); 8 × on Replying to — act('pwToOff', pwToOff) (www/act-map.js:274); 10 名詞クラスを消す — www/grammar.js:1974 nclsDel / :1982 nclsDelGo; 11 否定語の前／後 — www/grammar.js:1488 gPos('negp'). 2, 3 are 「このまま」; 4, 5 unanswered; 6, 9, 12, 15 UNVERIFIED (not measured here).
- Fix: replace the status with the per-number list above (and 「6・9・12・15 は未照合」).

## F30 docs/FEATURE_RULES.md:1036-1435 — old branch names as the whole of the status
- STATUS-WRONG (low) — r10-wire, r20-book, r23-sec, r27-off, r29-mixed, r33-owner, r34-lapse, r35-main, r36-index, r44-ios are each 2874-3129 commits off origin/integ-0905 and not ancestors of it (an older line); the code the entries name is in integ-0905 (e.g. www/core.js:2271 langsByAge, :2291 langMainId, :2331 langMainFall, :2489 langForAcct; www/net.js:2312 netLangsGone, :2685 langMineIds; www/settings.js:1009 capLapseSaw; supabase/schema.sql:2639 plan_lapse_seen; ios/App/LinguaKeyboard/Info.plist:33-34 RequestsOpenAccess false; ios/App/App/Info.plist:33-40 Portrait only; www/phases.js:898 G2BOOK = 9 chapters + app, verb has the six sections). A status that names only a branch reads as 「on that branch, not in the app」.
- Fix: add `（integ-0905 に入っている）` after each branch name, or replace it.

## F31 docs/FEATURE_RULES.md:1276-1284 (端末は何も決めない) — 「百か所の書き直しはまだ」 UNVERIFIED
- UNVERIFIED — 「**端末の印で分岐する百か所の書き直しはまだです** … 一覧（`docs/reports/mixed-2026-09-11.md`、`claude/r29-mixed`）→ オーナーが消す物を見る → 書き直し」. Much of it was later done by other decisions (2026-09-15 :1122 netLangsGone/LMINE, 2026-09-24 :734 r79-acct acctPut/acctFor, 2026-09-27 :288 slice_in on the server), so the sentence is likely stale, but nobody has re-counted the hundred against the report. Also cosmetic: no blank line between :1284 and the next heading :1285.
- Fix: re-count docs/reports/mixed-2026-09-11.md against integ-0905 and write what is left, or `（2026-09-15・2026-09-24・2026-09-27 の決定が大半を書き直した ── 残りは未照合）`.
