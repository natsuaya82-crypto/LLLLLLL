# rule audit 2026-09-27 — sns (claude/audit-sns)

**Scope.** Owner order 2026-09-27 「洗いざらい出して全部適応させて」. Branch
`claude/audit-sns` from `integ-0905`.

May change: `www/sns.js` `www/post.js` `www/me.js` `www/card.js` `www/rec.js`
`www/mod.js` `www/cal.js`, the i18n keys they need, `www/act-map.js` lines for
their names, the checks that hold what is changed here, `docs/CHANGELOG.md`,
this file, `shots/audit-sns-*`.

May not change (listed only): `www/index.html` (r125), `www/store.js`,
`supabase/functions/verify-plan` (r121), `www/onboard.js` sign-in and `GOOGLE`
in `www/net.js` (r122), `android/**` (r123, r124), `www/push.js`,
`supabase/functions/push-send`, the device table in `schema.sql` (r124).
Owner matters are listed with options, not decided.

**How it was read.** Every line of the seven files (12,035 lines), in eight
slices, each checked against CLAUDE.md and `docs/`. Mechanical checks at the
start were all green (es5 sides act dead box marks store) — everything below
is what those checks do not see.

**Status key.** `FIXED <commit>` · `TODO` (mine, being done on this branch) ·
`OWNER` (needs a decision — options given) · `OTHER <owner>` (another session's
file) · `NOT A VIOLATION` (an owner decision already covers it — named).

**Tests.** Every behaviour fix has a line in `tools/tl-check.mjs` § the rule
audit (`au.*`), watched red with the fault in place before the fix.

---

## Behaviour faults (bugs)

| id | where | rule | finding | status |
|---|---|---|---|---|
| B1 | post.js `openReport` / `FORM_OPEN.report` | one place / a rebuild loses state | a report on a PERSON, its form built again from its key, sent nothing (`rpFor` held the handle beside the key) | FIXED 9cf80a43 (tl a1) |
| B2 | post.js `vDrafts` | online — a screen that half-works signed out | signed out, drew this phone's drafts and let them be opened/deleted | FIXED 44f29b03 (tl a2) |
| B3 | post.js `draftDropGo` | the server is where a draft lives | signed out, a draft the server holds was taken off this phone only; the row came back | FIXED 44f29b03 (tl a2) |
| B4 | post.js `draftOpen` | data safety | signed out, a draft was spliced out of the list before `openPost()` bounced to the feed. Now unreachable (B2 makes the list the door) | FIXED 44f29b03 (by B2) |
| B5 | post.js `draftOpen` legacy `vo.b64` | data safety / saying nothing | when `voKeep()` fails the recording is dropped silently from the composer; comment says "put on the disk" | FIXED ef60662b (tl a16) |
| B6 | post.js `postTake` | a guard in the wrong order | `p.id` read before `!p` is checked (unreachable today: no caller passes null) | FIXED a685f6f4 (refactor) |
| B7 | sns.js `snsAnsHTML` | empty ≠ not answered | a new query draws the OLD answer, or 「No results」, until the new one lands (`r.q` never compared) | FIXED d904c23f (tl a3) |
| B8 | sns.js `vNotif` → `notSeen` | a view writes nothing | the read-marker moves inside the render; if the notices have not landed it is moved in memory and never saved | FIXED 982f5205 (tl a5; acct 89 given an answered pull) |
| B9 | sns.js `vThread` / `vPhoto` | empty ≠ broken | offline, a thread draws 「That is no longer here」 rather than 接続できません | NOT A VIOLATION — `navLand()` does not arrive when the thread read falls, so vThread never draws offline; `viewGone()` is only reached for an answered absence |
| B10 | sns.js filter page | load rules (`PAGE_READS`) | the filter page has no `pageReads` row; the kept words are read nowhere on arrival (comment cites a gone § WHAT AN OPEN ASKS FOR) | FIXED 0d69fd4f (tl a6) |
| B11 | sns.js `dayMap` | a view reads nothing | drawing a post row fetches an older day's prompt from inside the render and re-renders when it lands; a failure and "no row" share `PROMPT_ASK` | NEEDS THE SERVER — the clean answer is `post_seen` carrying the prompt's ten sayings (a column/join in schema.sql), so no screen fetches while drawing. Left in place until the leader assigns schema.sql |
| B12 | sns.js `vExplore` | a view reads nothing | the search is asked from inside the render (`if(snsQ && !snsHits) snsFind(...)`) | FIXED d904c23f (tl a4) — the one place a question is put is `snsAsk()` |
| B13 | sns.js `snsList` rec/day | a list the server chose is not chosen again here | おすすめ and #今日のお題 are a local sieve over every post in memory (profiles visited, threads…), not what `feed_hot()` answered. `FO_HAVE` fixed this for フォロー中 only | FIXED 39db093c (tl a20) — `FEED_HAVE` one table for the three tabs; `FO_HAVE`/`snsMine` deleted |
| B14 | sns.js feed `pageReads` / `snsMore` | load rules | while a kept word is on, arrival reads and the bottom pages the hidden tab list; the word's own answer never pages | FIXED 074cb95f (tl a21) — `snsWordMore()` pages a word for the search and the timeline |
| B15 | sns.js `snsSaveQ` / `snsRecentAdd` / `snsDropRecent` | online-only 2026-09-04; rule 11 (saying nothing) | the local copy is written whether the server took it or not; a failure says nothing | FIXED 373509b6 (tl a7; find-check waits for the answer) |
| B16 | sns.js `notRow` | load rules | a notice's line and photo appear only if another screen happened to load that post | NEEDS THE SERVER — the notices RPC carrying the post's line/ink/first photo (schema.sql `notices()`), same shape as B11 |
| B17 | post.js `postCountsPull` | dead branch | `typeof netPostCounts!=='function'` can never be true | FIXED a685f6f4 (refactor) |
| B18 | post.js `pwSend` path `dayTagStore(PW.ln)` (+ `pwLineKept`, `draftKeep`) | one road for the day tag | a translated day-tag word typed as ordinary text is rewritten into `#今日のお題`; left from tags-in-the-body | OWNER → O16 |
| B19 | me.js `meProfPut` | online / one answer | `typeof netProfPut` branch writes name/@/bio to the phone alone; a no-row answer writes the local value | FIXED 9e9fdff0 (tl a8; `meKeepPut` deleted) |
| B20 | me.js `meAvGot` | the copy never wins over the answer | server `av:null` clears `pic` but keeps a local `ME.av`, which is then stamped on new posts | FIXED 8894efd9 (tl a9) |
| B21 | me.js `mePicAsk` catch | one road; 2026-09-03 「写真だけ」 | a failed native ask falls through to the file input (iOS's photo/camera/file sheet) | FIXED ae287c60 (tl a10) |
| B22 | me.js `whoOf` POSTS fallback | one mechanism | a second answer to "who is this" built from a post copy; `bio/fo/fr` are never on a post | FIXED d57c5b6a (tl a11) |
| B23 | me.js `whoOf` self / `meCard` | rule 8; one answer | your own row's language is the OPEN language; everyone else sees the main (oldest) one | FIXED ad9da25e (tl a12) — own row's language is the `profile_seen` row |
| B24 | me.js name field placeholder | rule 8 | the person's name field shows the language's name as placeholder | FIXED f1381fba (tl a13, shots/audit-sns-name-*) |
| B25 | rec.js `voTook` / `voStop` | a state with no way out | on a recorder error the stop face stays and does nothing | FIXED eb3320d7 (tl a18) |
| B26 | rec.js `voPlay` ← `netMedia` | empty ≠ broken | in flight, failed once, no session and absent all say 「この声は見つかりません」 (root in net.js) | OTHER net.js — `netMedia()` answers `''` for four states; rec.js can only say what it is told |
| B27 | rec.js `voDrop` | nothing deletes a thing another stored thing names | the minus deletes the bucket file while the server draft still names it | FIXED e682a9fd (tl a17) |
| B28 | mod.js `goMod` | one door | `go('mod')` then `pullGo('mod')` again | NOT A VIOLATION — `pullGo` is a person asking and is never refused; `navLand` alone would show a stale list to a moderator |
| B29 | mod.js `MODBUSY`/`MODERR` | one mechanism | a second copy of pullRun's in-flight/failed state; a failure is shown twice | FIXED 17b1c3d0 (tl a14) |
| B30 | mod.js admin reads | load rules | `admin` has no `PAGE_READS` row; the menu reads the whole feedback and reports lists it does not draw | TODO (not done) — `admin` has no `PAGE_READS` row; its reads (counts, staff, feedback, then `pullGo('mod')`) run from `goAdmin()`/`adminGo()`. The rewrite is `pageReads('admin', a => a==='fb'? [['fbk']] : [['admin']])` with `pullOn` asks, and it is tied to O18/O19. Staff-only screen |
| B31 | mod.js `vMod` / feedback | a list cut at NET_PAGE carries on | the 51st report / feedback is unreachable | TODO (not done) — needs `netReports`/`netFeedbacks` (www/net.js) to take a cursor; then `snsMore` pages them like a person's page |
| B32 | mod.js feedback count | a number that says the wrong thing | shows the length of a list capped at 50 beside a server count | OWNER → O18 |
| B33 | mod.js `NET_STAFF` | written and never read; 2026-09-23 「スタッフなら誰でも」 | staff who are not the admin have no road to reports / 復旧 | OWNER → O19 |
| B34 | mod.js `modRow` account report | wording / blank | an account report says 「@x の投稿」; a gone author prints 「@ の投稿」 | FIXED 5cd43969 (tl a15) — the blank half; the wording of an account report is O17 |
| B35 | mod.js `adminGo` | wrong message | the one-field door says 「両方入力してください」 | OWNER → O17 (a one-field sentence is new wording) |
| B36 | mod.js `ADMIN_ERR` | one message, one place | a load failure is drawn under the staff field as if the handle failed | TODO with B30 — the load's failure belongs to the read, not the staff field |
| B37 | card.js `CARD.sh` | viewReset | a shape chosen for one card opens every later card | FIXED 904e415d (tl a19) |

## Marks and shapes (look changes — screenshots in `shots/audit-sns-*`)

| id | where | rule | finding | status |
|---|---|---|---|---|
| M1 | post.js `postMenuHTML` delete row | sixth: delete is the bin | drawn with `ICON_CROSS` (close) | FIXED a752a1d1 (shots/audit-sns-postmenu-*) |
| M2 | post.js photo screen crop button | sixth | 「切り抜く」 as a word; `ICON_CROP` exists and is used two lines above | NOT A VIOLATION — crop is not among the marks the owner settled; 「マークの無い字はそのまま」 2026-09-26 |
| M3 | post.js photo screen back arrow | one road; label | the back mark is labelled 「完了」 and does what the 完了 beside it does | OWNER → O20 |
| M4 | mod.js `modRow` 「通報を消す」 | sixth; one act two ways | a word, where `fbkRow` draws the same act as the bin | FIXED a752a1d1 (shots/audit-sns-mod-*) |
| M5 | mod.js staff row | sixth; criterion 9 | pressing the row removes staff, no mark, no ask (`del-check` says it takes nothing — it takes the role) | OWNER (the ask) — the mark waits on it |
| M6 | post.js `.mkcols` colour swatches | banned: round chips scrolled sideways | eight 44px swatches + ✕ ≈ 470px in `overflow-x:auto` | OWNER (shape) / OTHER index.html (CSS) |
| M7 | mod.js `mod.up` 「戻す」 | sixth: undo is a mark? | putting a taken-down post back is written as a word | OWNER (is it undo) |
| M8 | post.js each row's share | sixth: share in the corner | every post's share is in its own action row (X's shape) | OWNER (an exception or not) |
| M9 | card.js the card plate | rule 18 (NO ROUNDED BOX) | the card picture is a filled rounded plate drawn on a canvas; `box-check` cannot see a canvas | OWNER |
| M10 | post.js `postRpHTML` inline 44pt style; mod.js `style="margin-top:18px"` | one place for a look | geometry set from JS | OTHER index.html (needs a class) |

## Deletes with no confirm (criterion 9, 2026-09-24 「17 か所とも今のまま」)

Which seventeen were meant is not written down. These delete with no
`popAsk` and each needs the owner's answer (options: ask / leave as is):
`voDrop` (the recording, in the bucket), `pwMarkDel` (letters on a photo —
`del-check` says it takes nothing, which is true until sent), `snsDropRecent`
(del-check carries 「1件づつ消せるでいいよ」 as its reason), un-starring a kept
word, `adminStaffDrop`, `meDropPic` (whether iOS's own sheet counts as the
ask). → OWNER.

## Owner decisions needed (options, not decided)

| id | question | what the code does | options |
|---|---|---|---|
| O1 | pinning | `postPin` writes only this phone's copy; `schema.sql` has no pin column. A pin is seen on no other phone | (a) a server column + netPut; (b) take pinning out |
| O2 | search 「話題」 | `snsSetSort('buzz')` changes nothing; `netFindPosts` always asks newest first. 2026-08-28 says 話題 is `feed_hot()` | (a) build the ordered search; (b) take the sort screen out until then |
| O3 | a post that would not send, with no signal | 2026-09-24 「下書きに入る」 vs rule 22 「写しは上がらない」: `pwSendFell` keeps an `up=0` draft on this phone and sends it later from that copy | (a) the draft stays in the composer and nothing is kept; (b) keep as now and write the exception into rule 22 |
| O4 | `postUpAll` at the door | every unsent post in `lingua.posts.<uid>` goes up from the phone's copy | (a) delete (2026-09-26 「上がっていない物は残らない」); (b) keep and name it |
| O5 | `pwPicRoom` / `POST_BYTES` | the phone's timeline copy decides whether a photo may be added or cropped; reason given (localStorage shared with the language) is gone | (a) a per-post limit; (b) no limit |
| O6 | `migratePosts` | stamps TODAY's name/handle/face onto old posts with none (the past from the present) | (a) delete; (b) keep |
| O7 | `migratePostInk` | cuts old posts with today's alphabet; CLAUDE.md rule 12 sanctions it, § The past forbids it | which rule wins |
| O8 | `migrateAv` | the face is decided on this phone from the open language and never reaches `profile.av` | (a) send it; (b) delete the migration |
| O9 | a photo whose letters fail to bake | goes up without them, silently | (a) stop the send and say so; (b) as now |
| O10 | the post-length ring while editing | refused at the press, no ring drawn | (a) the ring on the edit screen; (b) as now |
| O11 | notice kind 「pick」 | described and branched for; the server never sends it | (a) delete; (b) build it |
| O12 | `voSweepKeep` reads ownerless `lingua.drafts`/`lingua.posts` | 2026-09-24 「読まない、消さない」 vs 2026-09-25 「前の版の声のファイル: 消す」 | which reading |
| O13 | own profile card's language | follows the open language, others see the oldest | (a) the main language; (b) the open one |
| O14 | wording | `pop.undo` on unfollow reads "Undo" in English; `me.bio.ph` may read as explaining | the owner's words |
| O16 | is a `#` in the BODY still a tag | since 2026-09-15 tags are a frame and 「本文は本文だけ」, yet a new post's body still has the day's tag word rewritten on the way in (`dayTagStore(PW.ln)`) and `#` words drawn blue | (a) the body is verbatim, `#` in it is text; (b) keep treating it as a tag |
| O17 | wording on the reports screen | an account report is headed 「@x の投稿」; the one-field admin door says 「両方入力してください」 | the owner's words for both |
| O18 | the feedback row's number | the length of the first page (≤50) beside the reports row's server count | (a) a server count (admin_counts); (b) no number |
| O19 | staff who are not the admin | `NET_STAFF` is read and opens nothing; only `NET_ADMIN` reaches reports and 復旧 (2026-09-23 says 「スタッフなら誰でも」 for 履歴/戻す) | which rooms staff may enter |
| O20 | the photo editor's two exits | the back arrow (labelled 「完了」) and 完了 both run pwMarkClose() | (a) keep 完了 only; (b) keep the arrow only |
| O15 | `SET.trDate` / `SET.trN` | left in `SET`, nothing reads them | (a) into `SET_GONE`; (b) leave |

## Another session's file (listed for later)

- `www/index.html` (r125): `.mkcols` (M6); a class for `postRpHTML`'s 44pt
  span and mod.js's `margin-top:18px` (M10).
- `www/net.js`: `netMedia` answers `''` for four states (B26); `netFindPosts`
  takes no order (O2).
- `www/sheet.js`, `www/sound.js`: the share-bytes road is copied four times
  (card.js, sheet.js ×1, sound.js ×2) — one helper in share.js.
- `www/glyph.js`: `ICON_STAR`/`ICON_STAR_ON` are defined in sns.js, not in the
  `ICON_*` row.
- `www/onboard.js` (r122): handle bounds `2..24` written again beside
  `ME_MAX.handle` in me.js — one `meHandleOK()`.
- `tools/del-check.mjs`: `voDrop` still says "Documents/Voices";
  `adminStaffDrop` says it takes nothing.

- `www/net.js:3636`: a comment still says whoOf() walks POSTS (d57c5b6a took that road out).
- `www/me.js` `folPut()`: nothing in the app calls it; it is the checks' way in (fixture, acct-check).
- `www/me.js` inline styles on the profile editor (`width:96px…`, `gap:14px…`) — geometry from JS, wants classes in index.html (r125).

## Not a violation (an owner decision covers it)

- `meRowHas()` falling back to `ME.handle` while the answer is out —
  OWNER 2026-09-09 choice A (`www/shell.js` `appIs()`).
- `snsLocked()` in the three tabs is reachable only during the walk
  (`obTourOn()` answers 'app' with no session) — it is that state's answer,
  not a second road beside `appIs()`. Its comment about an anonymous
  self-sign-in is stale (C-list).
- Word-only Select / Done / Save / Follow — 2026-09-26 「マークなくていいやつはいい」.

## Refactors (separate commits, no behaviour change)

Done: a685f6f4 (dead guards, postTake order, voName param), b73692df
(pwOn/snsFilNow/strOf), 7988133e (card's dead word kind), 8451c6b5 (cal),
19a58966 (postInkOr), 4347d7e9 (adminRow). **Not done:** the join helper
askWho/askLangs; SNS_NEXT/SNS_END beside MORE_AT/MORE_END; postCopyTab via
postRuns (touches what is copied — wants its own check); modMark/modWhy;
the handle written three ways in mod.js; folForget's name; `ME.uid` (a stored
field — removing it drops it from the account's copy, so it stays).


`pwOn()` → `pwHas()`; `snsFilNow()` → `snsTab`; `dayTagStore` → `strOf()`;
`dayTagShow` dead branch; `askWho`/`askLangs` duplicated join; three paging
mechanisms (`SNS_NEXT/SNS_END`, `MORE_AT/MORE_END`, the search's own) → one;
`postInkOK(p.ink)? p.ink : {...}` written three times → one; `postCopyTab`
deciding runs itself → `postRuns()`; `folPut` dead; `ME.uid` write-only;
`typeof net*` guards on functions that always exist (me.js ×4, rec.js ×3,
post.js ×1); `voName(mime)` dead parameter; `modMark/modWhy` pairs; `adminRow`
dead branch; handle written three ways in mod.js; card.js dead `w` kind,
`subY`, word-source `dir`/`sd`/`mn`, `cardBlock` asking `geSide()` again;
cal.js `CAL_MONTHS` / `calMonths()` two names; `folForget` clearing people and
relations under a `fol*` name. → TODO

## Stale comments (only sentences about now)

Every comment found saying something the code does NOT do, or naming a
function that is gone, is corrected or deleted: ab3003c0 (sns.js), 4515d8bd
(post.js), 0a889f51 (me.js), b81cb9d2 (mod.js, card.js, rec.js).

**Not done: the history paragraphs that are true but past-tense** (「used
to…」, 「It was … until …」) — about sixty blocks across the seven files
(card.js 16, cal.js 3, mod.js 4, post.js ~15, sns.js ~12, me.js ~8). None of
them states something false about the code now; CLAUDE.md says they are to be
deleted all the same (「歴史とかいいから消せよ」). Left for one commit per
file.

---

## Commits

- 07a1fa9c scope
- 9cf80a43 B1
- 44f29b03 B2 B3 B4
- d904c23f B7 B12
- 982f5205 B8
- 0d69fd4f B10
- 373509b6 B15
- 9e9fdff0 B19
- 1e335913 integ-0905 brought in
- 8894efd9 B20 · ae287c60 B21 · d57c5b6a B22 · ad9da25e B23 · f1381fba B24
- a752a1d1 M1 M4 · 17b1c3d0 B29 · 5cd43969 B34 · ef60662b B5 · e682a9fd B27
- eb3320d7 B25 · 904e415d B37 · 39db093c B13 · 074cb95f B14
- refactors and comments as listed above
