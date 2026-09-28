# Rule audit 2026-09-27 — glyph (letters and drawing)

OWNER 2026-09-27 「洗いざらい出して全部適応させて。コードも。全部見るんだぞ？」

Area: `www/letters.js` `www/sound.js` `www/glyph.js` `www/otf5.js` `www/wsys.js`
`www/numbers.js` — every line read (six readers, one per file, glyph.js in two
halves), and every finding below checked again by grep or by running the app
before it was written here. Branch `claude/audit-glyph` from `integ-0905`.

Status words: **fixed** (commit) · **fixing** (in this branch, not yet pushed)
· **owner** (a decision nobody here may make — options given) · **other**
(lives in a file another session owns, or outside this area — listed for later).

## A. Data, the past, and saving

| # | where | rule | what | status |
|---|---|---|---|---|
| A1 | `letters.js` `ltJoinSlots()`, called from `ltStart()` at every launch | Data (no automatic deletion); owner decision 2026-09-24 「昔の版で自動で増えた文字: 消さずに残す（公開したので「リリース前なら消してよい」は使えない）」 | Took the empty copy of a doubled slot out of the alphabet on every launch, on the authority of 2026-09-04 「リリース前の今は消していいから」, which the 09-24 answer to r73 Q12 replaced. Measured in base-check: a doubled alphabet 76 → 38 through `ltStart()`. | **fixed** `ffc7287c` (base-check, red watched); decision 09-04 marked 【差し替え済み】, BACKLOG item answered |
| A2 | `letters.js:47` `ltId()` | Data (a letter is lost) | The id is `l<LT_SEQ>_<count>_<len>` and `LT_SEQ` counts from zero every launch, so a letter added on one launch and a letter added on another with the same count wear ONE id — and two phones each adding their first letter do too. The server puts two copies together by id (`slice_arr`), so one of the two letters goes. | **fixed** `0f771215` (base-check: `l1_38_4` twice with the old minting) |
| A3 | `letters.js` `migrateSp()` (run by `migrateAll()` at every launch) | Data (a migration copies and never removes); The past; 「保存を押したときだけ、保存されているものが変わる」 OWNER 2026-09-04 | `spv` is never put on a word when it is made, so this "old words" migration runs on every word once. Measured: a word `kwa` made today, its letter renamed kw→zh on the letter page, next launch the word is renamed `zha` and the headword `kwa` is gone — with nothing pressed. It also deletes the `u` a spelling position carries when it equals what the letter reads NOW, which re-derives the past from the present. | **fixed** `519a942e` (migration deleted; migrate-check on the road the migrations really run — the old "imported pronunciation" claim stood on flat keys nothing reads and was green about nothing). acct-check 74/91 had stood on its side effect: `fa70b5f6` files the seed as an arrival does |
| A4 | `letters.js` `migrateSndName()` | Data (a migration never removes) | For a letter with no `chose`, overwrites `l.snd` with a reading of its name — its own comment says a sound somebody chose on the chart is "the cost". New letters are born with `chose`, so only old letters meet it, but the rule has no exception for old ones. | **fixed** `519a942e` (sound kept; `chose:1` when it differs from the name's reading) |
| A5 | `sound.js` `wsKeepSave()` → `wsys.js` `setWsys()` | One mechanism; rule 11 (not saving and saying nothing) | The writing-system screen's Save calls `done(true)` at once while `setWsys()` sends `language.wsys` on its own road (`netLangWsys`) and lands later — so the Save reports saved and levels the screen before the column has arrived, and a refusal then pops up behind a screen that already said it was saved. | **fixed** `f0da2dcf` (acct-check 63, red watched) |
| A6 | `wsys.js` `setWsys()` / `setScriptDir()` and `sound.js` `wsPick()` / `dirPick()` | One question in one place | The plan is asked on the press (`wsPick`, `dirPick` — the owner's place, 2026-09-01) and again at the write. The write-side ones are reachable only through the press. | **fixed** `f0da2dcf` |
| A7 | `wsys.js` `vSp()` | One question in one place | The spacing page reads `SCRIPT.dir` itself; everything else asks `scriptDir()`. On free (or a lapsed plan) with a stored direction the preview is drawn in a direction no post is written in. | **fixed** `4a9f7714` (writes-check READS `SCRIPT.dir → scriptDir`; shots/audit-glyph-sp-rtl-{free,pro}-{before,after}.png) |
| A8 | `sound.js` `abNudge()` / `abScale()`; `numbers.js` `numStepBase()` | Rule 22 (a taken language is only looked at); owner 2026-09-24 「取ってきた言語を編集できるか →『できない』」 | On a language this account took, the abugida bench and the base ± change points / `STG.base` / `LETTERS` in memory and rebuild the font; the save then refuses silently, so the screen shows a change no save keeps — the shape fixed for `ltForUnit()` on 09-24. `dl-check` compares counts only, so a moved point is invisible to it. | **fixed** (commit before the integ-0905 merge; dl-check now compares the whole language and walks every door's face — red watched on all three). The same walk found `setGPos` (`www/grammar.js`, audit-words) doing the same: **other**, held on a must-shrink list in dl-check |
| A9 | `letters.js` `ltSetRoman()` — the digit branch before `if(ltIsBase(l))` | Owner decision 2026-08-22 (a slot's name does not change, on any plan) | A slot typed a number becomes a digit and a new empty slot is made. CLAUDE.md names this (r73 § 4) and leaves it for the code. The letter page hides the field on slots, so it is reached only by other roads. | **owner** — two written decisions disagree and neither is restated: 2026-08-22 (a slot's name never changes) vs 2026-09-01 (a number typed on a letter moves it into the digits room); `ltIsBase()` counts a letter by its NAME, so an added letter called `q` is a slot, and base-check holds the 09-01 reading. Options: (a) the slot refusal first — a slot never becomes a digit; (b) as now — a number moves any letter, slot or not |
| A10 | `letters.js` `ltUp()` → `ltMove()` | Rule 6 (a save is a press somebody meant) | Holding a letter until it wobbles and letting go without moving it writes `ord` onto every letter and sends the alphabet. | **fixed** (base-check: 26 letters given an order with the old code) |

## B. Visible strings, shapes, marks

| # | where | rule | what | status |
|---|---|---|---|---|
| B1 | `numbers.js` `numWidOut()` (+ `share.js` `SHARE.how`) | Rule 2 (every visible string through `t()`) | The digits room prints `SHARE.how` — `'sent'`, `'no bridge'`, `'refused: '+native error` — in English in all ten languages. `i18n-check` cannot see it: in the walk it is `-`. | fixing |
| B2 | `sound.js` `vLetters()` — `style="margin-top:6px"` on the abugida `.trow` | Rows are one height; no `margin-top` to make a group (`.grpsep`) | | fixing |
| B3 | `sound.js` `vAbugida()` — `.segs scrollx` row of vowels over the controls that change the chosen vowel | Shape: a row you scroll sideways; the thing chosen and the thing changed on one screen | Redrawing the bench as "choose a vowel = a list/screen, change it = the screen you arrive at" is a redesign of a screen. | owner — (a) a list of vowels, pressing one goes to that vowel's bench; (b) keep it as it is (underlined tabs, not round chips) |
| B4 | `sound.js` sound cells hidden on free (`var free=(pick && can('snd') …)`) | 「全部一緒」 OWNER 2026-09-04 vs the 2026-09-01 line the code cites | Two written decisions disagree about this screen; neither restated. | owner — (a) draw the cells on free and let the press ask; (b) keep them hidden |
| B5 | `sound.js` `sndDrop()`; `glyph.js` `geLsBin()`, `geClear()` | Criterion 9 replaced 2026-09-24 「確認ポップにしてください」 — but the same entry says 「17 か所とも今のまま」 | Deletes with no `popAsk()`, undo behind them. Whether these are inside "a confirm before a delete" or the undo-backed editor is exempt is not written. | owner |
| B6 | `letters.js` `ltSetChar()` | as B5 | Choosing a borrowed character drops the drawing without asking. | owner |
| B7 | `glyph.js` `GICON.undo` / `GICON.redo` / `GICON.bin`, `MARK_PLUS`; `ICON_ADD` and `ICON_ADD2` | Sixth rule (marks come from the `ICON_*` row); one place | The glyph rail draws its own undo/redo (different paths from `ICON_UNDO`/`ICON_REDO`); `GICON.bin` and `MARK_PLUS` are hand copies of `ICON_BIN`/`ICON_PLUS`; two pluses at two weights. Making them one changes how the rail looks. | owner (look) — listed with screenshots when asked |

## C. One mechanism, dead and write-only

| # | where | what | status |
|---|---|---|---|
| C1 | `glyph.js` `GE.was` | written by `newGE()`, read nowhere — `KEEP[k].was` is what decides the Save | fixing |
| C2 | `glyph.js` `GE.fresh`, `GE.lsMove.moved` | written, read nowhere | fixing |
| C3 | `glyph.js` `geUp()` — `GE.hit=false` two lines before `if(fresh ‖ GE.moved ‖ GE.hit)` | a term that can never be true | fixing (measure first) |
| C4 | `glyph.js` `GE_HINT_DEMO['new']` | nothing can show it; its comment says otherwise | fixing |
| C5 | `otf5.js` `flattenQuad()`, `FLAT_TOL`, `var R = curve ‖ CURVE`, `GPEN.curve` | old curve code beside `bspline()`; `dead-check` reads column zero only | fixing |
| C6 | `numbers.js` `numSepText()` | both branches return `':'` | fixing |
| C7 | `numbers.js` the digits-in-a-base loop written three times (`numLineHTML`, `numSigns`, `numTimeHTML`) | one place | fixing |
| C8 | `numbers.js` empty `else if(col<=prev){}` | | fixing |
| C9 | `letters.js` `ltDelete()` `var nm`; `ltFreeSlot(nm0)`; `glyph.js` `geRail(st)`, `geTools` `var st` | unused | fixing |
| C10 | `numbers.js` clock preview — "same rule as ClockWidget.swift" | Swift asks `most<=2 && widest<=1700` and pulls the ring by `max(em*0.85, halfW)`; JS asks `most<=2` and `em*0.85` — the preview can show twelve numerals where the widget shows four | fixing |
| C11 | `letters.js` `ltDeleteGo()` slot branch vs `ltCanDelete()` | the slot branch (「枠は消えないでくれよ」) is reached by no screen — `ltCanDelete()` gives a slot no delete door; two answers | owner — (a) a slot gets a door that empties it (the branch's reading); (b) a slot has no delete at all (the door's reading), branch goes |
| C12 | `letters.js:307`, `home.js`, `keyboard.js` | hold-and-carry written three times at 380 ms; the shared hold is `HOLD_MS=500` | other (home.js, keyboard.js) + owner (which duration) |
| C13 | `sound.js` `ltFontOut()` / `ltSvgSend()`, `card.js`, `sheet.js` | the hand-over to the share sheet written four times; `ltSvg`'s `x()` is `esc()` again | fixing the two in sound.js onto one; card.js/sheet.js other |
| C14 | `otf5.js` the LinguaScript face gives a space a whole cell; `inkSpace()` takes the ordinary face's | two answers to "how wide is a space" | owner/measure — listed |
| C15 | `glyph.js:600` `document.addEventListener('paste', puaPaste)` | a second input road outside `act.js` | listed (not a rule-3 breach) |

## D. Names that lie (renames — separate commits)

| # | name | reason | status |
|---|---|---|---|
| D1 | `setLtFil` (sound.js) | writes a view filter, not `SET` | fixing → `ltSetFil` |
| D2 | `setWsys`, `setScriptDir`, `setScriptSp` (wsys.js) | write the language, not `SET` — the `setAbVow` fault | fixing |
| D3 | `addedSnd` (sound.js) | `add*` is the new-word sheet | fixing |
| D4 | `geTiles` (glyph.js) | fills alphabet tiles, not the glyph editor | fixing |

## E. Comments and documents that say what the code does not

Every one below was checked against the code by grep. All are being rewritten
to what is true now or deleted (「歴史とかいいから消せよ」).

- **wsys.js**: `SET.wsys` spoken of as live (56-61, 387-388, 395); "in the backup" (385, 399); "Setting one is `dir`, at Plus" (it is `pro`); "Nothing in the app asks can('dir') before drawing" (`scriptDir()` does); "the five" (there are six); "The screen only offers this on a paid plan" (every plan); orphan block 252-255; history quoting deleted code (103-106, 140-148); 字間 "saved the way every row of 設定 → 言語 saves".
- **numbers.js**: "no road can ask for two sevens" (`ltToDigit()` can); "the only automatic deletion in the app"; the date square and `DateWidget.swift` (neither exists); "ltStart calls it" (it is `ltSlotsFill()`).
- **otf5.js**: header "straight port … verify-otf5.mjs asserts that" (nothing runs it); 72-unit bend and `ROUND` (gone); "every letter is a cell" (not in `center`).
- **glyph.js**: header (boot lines, "no keyboard extension", "one square cell", pen 60); lattice N=11 / pen 60 over `n:21` / 24; "only the two ends go back onto the lattice" (every point does); "half a step" over `0.9`; orphan "a stroke is one line, or one corner" against 「160で止めないで」; `ICON_PLUS` three meanings; `sfontRuns` "three other things"; `vGlyph` bar "? on four screens"; `TAB_ICON` "three tabs"; `geStep` "ten lines from the top"; the save "THE DRAWING IS NOT TAKEN BACK" (`keepBack()` takes it back); rail "five marks" (six); the magnifier; "a key can be flicked off"; `AI_SEAM` "the advice below"; "14. Drawing" over `render()`; two hint comments and two `geUp` comments disagreeing; `phkHTML` "the keyboard a word is typed on"; `tools/mock/contrast`; orphan blocks; history names `scriptNameCodes`, `geLeft()`, `geKeepPut()`.
- **letters.js**: `ltFreeSlot()` DELETE REVIEW names the wrong row; "impUndo"; `langMigrate()`, `migratePh()`, `saveWord`, `ltRow`, "the backup file"; "Paid does not get this"; `ltSetRoman` blocks describing old behaviour (751-817, 384-391, 941-947); "the only caller that gives ltNew an id"; "twenty-eight slots"; `ltDelete()` "reached on free"; "Nothing this app has ever written can collide" (A2).
- **sound.js**: `setFor()`, `ltFieldHTML()`, `write: 'pro'`; "twenty-six" / "twenty-eight" slots; `ws.k.X.d`; "tapping it again says it does not"; composites "cannot be drawn over"; the Plus inventory page; `sndCell above`; "free has no digits room"; `ltAbField` "the onboarding's second step"; `ltTakeSnd` "joins the language"/"go()"; `can('snd')` "the same door".
- **outside the six, the same sentences**: `core.js:2859` and `docs/PAID_FEATURES.md:478,542` (can('dir')); `core.js:2828` (`ltFontOut()` "in keyboard.js"); `net.js:1872` ("the five kinds"); CLAUDE.md rule 17 ("two" built families — `LinguaLine` is the third) and § free plan ("The abugida bench needs `SET.wsys`").

## F. Listed for other sessions (not edited here)

- `www/index.html` (r125): `.segs.scrollx` — a row that scrolls sideways (B3); `.grpsep` is what B2 uses.
- `www/share.js` `SHARE.how` holds English (B1 changes what it holds).
- `www/card.js`, `www/sheet.js`: the share-sheet hand-over (C13).
- `www/home.js`, `www/keyboard.js`: the hold duration (C12).
- `www/grammar.js` (audit-words): `setGPos` writes the grammar's positions into a taken
  language in memory (rule 22) — found by the widened dl-check walk, held there on a
  must-shrink list. Also: drawing a screen writes empty defaults into the language —
  `STG.ex` filled with `[]` per key (the feed/explore/settings `go` presses reach it),
  and `openWord` puts `syn:[]`/`ant:[]` on a word (`www/words.js`). A view reads nothing
  (load rules); they write nothing a person made, so dl-check compares with empty
  values left out, and they are listed here.

## Commits

(filled in as they land)
