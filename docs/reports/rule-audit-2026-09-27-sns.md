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
| B5 | post.js `draftOpen` legacy `vo.b64` | data safety / saying nothing | when `voKeep()` fails the recording is dropped silently from the composer; comment says "put on the disk" | TODO |
| B6 | post.js `postTake` | a guard in the wrong order | `p.id` read before `!p` is checked (unreachable today: no caller passes null) | TODO (refactor) |
| B7 | sns.js `snsAnsHTML` | empty ≠ not answered | a new query draws the OLD answer, or 「No results」, until the new one lands (`r.q` never compared) | FIXED d904c23f (tl a3) |
| B8 | sns.js `vNotif` → `notSeen` | a view writes nothing | the read-marker moves inside the render; if the notices have not landed it is moved in memory and never saved | FIXED 982f5205 (tl a5; acct 89 given an answered pull) |
| B9 | sns.js `vThread` / `vPhoto` | empty ≠ broken | offline, a thread draws 「That is no longer here」 rather than 接続できません | NOT A VIOLATION — `navLand()` does not arrive when the thread read falls, so vThread never draws offline; `viewGone()` is only reached for an answered absence |
| B10 | sns.js filter page | load rules (`PAGE_READS`) | the filter page has no `pageReads` row; the kept words are read nowhere on arrival (comment cites a gone § WHAT AN OPEN ASKS FOR) | FIXED 0d69fd4f (tl a6) |
| B11 | sns.js `dayMap` | a view reads nothing | drawing a post row fetches an older day's prompt from inside the render and re-renders when it lands; a failure and "no row" share `PROMPT_ASK` | NEEDS THE SERVER — the clean answer is `post_seen` carrying the prompt's ten sayings (a column/join in schema.sql), so no screen fetches while drawing. Left in place until the leader assigns schema.sql |
| B12 | sns.js `vExplore` | a view reads nothing | the search is asked from inside the render (`if(snsQ && !snsHits) snsFind(...)`) | FIXED d904c23f (tl a4) — the one place a question is put is `snsAsk()` |
| B13 | sns.js `snsList` rec/day | a list the server chose is not chosen again here | おすすめ and #今日のお題 are a local sieve over every post in memory (profiles visited, threads…), not what `feed_hot()` answered. `FO_HAVE` fixed this for フォロー中 only | TODO |
| B14 | sns.js feed `pageReads` / `snsMore` | load rules | while a kept word is on, arrival reads and the bottom pages the hidden tab list; the word's own answer never pages | TODO |
| B15 | sns.js `snsSaveQ` / `snsRecentAdd` / `snsDropRecent` | online-only 2026-09-04; rule 11 (saying nothing) | the local copy is written whether the server took it or not; a failure says nothing | FIXED 373509b6 (tl a7; find-check waits for the answer) |
| B16 | sns.js `notRow` | load rules | a notice's line and photo appear only if another screen happened to load that post | TODO (needs server columns → see O-list if so) |
| B17 | post.js `postCountsPull` | dead branch | `typeof netPostCounts!=='function'` can never be true | TODO |
| B18 | post.js `pwSend` path `dayTagStore(PW.ln)` (+ `pwLineKept`, `draftKeep`) | one road for the day tag | a translated day-tag word typed as ordinary text is rewritten into `#今日のお題`; left from tags-in-the-body | OWNER → O16 |
| B19 | me.js `meProfPut` | online / one answer | `typeof netProfPut` branch writes name/@/bio to the phone alone; a no-row answer writes the local value | FIXED 9e9fdff0 (tl a8; `meKeepPut` deleted) |
| B20 | me.js `meAvGot` | the copy never wins over the answer | server `av:null` clears `pic` but keeps a local `ME.av`, which is then stamped on new posts | TODO |
| B21 | me.js `mePicAsk` catch | one road; 2026-09-03 「写真だけ」 | a failed native ask falls through to the file input (iOS's photo/camera/file sheet) | TODO |
| B22 | me.js `whoOf` POSTS fallback | one mechanism | a second answer to "who is this" built from a post copy; `bio/fo/fr` are never on a post | TODO |
| B23 | me.js `whoOf` self / `meCard` | rule 8; one answer | your own row's language is the OPEN language; everyone else sees the main (oldest) one | TODO |
| B24 | me.js name field placeholder | rule 8 | the person's name field shows the language's name as placeholder | TODO |
| B25 | rec.js `voTook` / `voStop` | a state with no way out | on a recorder error the stop face stays and does nothing | TODO |
| B26 | rec.js `voPlay` ← `netMedia` | empty ≠ broken | in flight, failed once, no session and absent all say 「この声は見つかりません」 (root in net.js) | TODO (rec.js half) / OTHER net.js half |
| B27 | rec.js `voDrop` | nothing deletes a thing another stored thing names | the minus deletes the bucket file while the server draft still names it | TODO |
| B28 | mod.js `goMod` | one door | `go('mod')` then `pullGo('mod')` again | TODO |
| B29 | mod.js `MODBUSY`/`MODERR` | one mechanism | a second copy of pullRun's in-flight/failed state; a failure is shown twice | TODO |
| B30 | mod.js admin reads | load rules | `admin` has no `PAGE_READS` row; the menu reads the whole feedback and reports lists it does not draw | TODO |
| B31 | mod.js `vMod` / feedback | a list cut at NET_PAGE carries on | the 51st report / feedback is unreachable | TODO |
| B32 | mod.js feedback count | a number that says the wrong thing | shows the length of a list capped at 50 beside a server count | TODO |
| B33 | mod.js `NET_STAFF` | written and never read; 2026-09-23 「スタッフなら誰でも」 | staff who are not the admin have no road to reports / 復旧 | TODO (read) + OWNER (which rooms) |
| B34 | mod.js `modRow` account report | wording / blank | an account report says 「@x の投稿」; a gone author prints 「@ の投稿」 | TODO |
| B35 | mod.js `adminGo` | wrong message | the one-field door says 「両方入力してください」 | TODO |
| B36 | mod.js `ADMIN_ERR` | one message, one place | a load failure is drawn under the staff field as if the handle failed | TODO |
| B37 | card.js `CARD.sh` | viewReset | a shape chosen for one card opens every later card | TODO (check) |

## Marks and shapes (look changes — screenshots in `shots/audit-sns-*`)

| id | where | rule | finding | status |
|---|---|---|---|---|
| M1 | post.js `postMenuHTML` delete row | sixth: delete is the bin | drawn with `ICON_CROSS` (close) | TODO |
| M2 | post.js photo screen crop button | sixth | 「切り抜く」 as a word; `ICON_CROP` exists and is used two lines above | TODO |
| M3 | post.js photo screen back arrow | one road; label | the back mark is labelled 「完了」 and does what the 完了 beside it does | TODO |
| M4 | mod.js `modRow` 「通報を消す」 | sixth; one act two ways | a word, where `fbkRow` draws the same act as the bin | TODO |
| M5 | mod.js staff row | sixth; criterion 9 | pressing the row removes staff, no mark, no ask (`del-check` says it takes nothing — it takes the role) | TODO (mark) + OWNER (ask) |
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

## Not a violation (an owner decision covers it)

- `meRowHas()` falling back to `ME.handle` while the answer is out —
  OWNER 2026-09-09 choice A (`www/shell.js` `appIs()`).
- `snsLocked()` in the three tabs is reachable only during the walk
  (`obTourOn()` answers 'app' with no session) — it is that state's answer,
  not a second road beside `appIs()`. Its comment about an anonymous
  self-sign-in is stale (C-list).
- Word-only Select / Done / Save / Follow — 2026-09-26 「マークなくていいやつはいい」.

## Refactors (separate commits, no behaviour change)

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

Roughly 110 comment blocks across the seven files that say something the code
does not do, name a function that is gone (`meFor`, `whoPull`,
`postHasMedia`, `draftsPullOnce`, `postCatchUp`, `snsMode`…), sit over the
wrong function, or keep history. Listed per file in the slice notes and
cleared per file in one commit each. → TODO

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
