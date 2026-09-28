# Rule audit 2026-09-27 — words (dictionary, grammar, keyboard)

Branch `claude/audit-words` from `integ-0905`.

## Scope

May change: `www/words.js` `www/wordsheet.js` `www/import.js` `www/grammar.js`
`www/grammar-engine/*` `www/assist.js` `www/phases.js` `www/ipa.js`
`www/reading.js` `www/notes.js` `www/voice.js` `www/home.js` `www/keyboard.js`
`www/share.js` `www/sheet.js`, the `act-map.js`/`route-map.js` lines those
files name, the i18n keys they use, the checks that hold what is fixed, and this report.

May not change (listed only): `www/index.html` (r125), `www/store.js` and
`supabase/functions/verify-plan` (r121), `www/onboard.js` sign-in and `GOOGLE`
in `www/net.js` (r122), `android/**` (r123, r124), `www/push.js`,
`supabase/functions/push-send`, the device table in `schema.sql` (r124).


## How this was done

Every line of the fifteen files was read (each group's coverage list is at the
foot of its section), against CLAUDE.md, docs/FEATURE_RULES.md with its whole
decision log, DATA_SAFETY, DATA_MODEL, PAID_FEATURES, TESTING, HIDEFREE and
keyboard.md. "CONFIRMED" means read in the code and quoted; three keyboard items
were also run headless. Nothing here was pressed on a phone.

Items are numbered per group: `kb-12` is item 12 of the keyboard group.

## Ledger — what happened to each item

Every commit that fixes an item names it — `git log --grep 'words kb-1'` finds
the fix for `kb-1`. Each commit says what was watched red, and carries the
before/after pictures (`shots/audit-words-*`) where the look changed.

**Fixed** means code (or a sentence) changed on this branch and the check that
holds it was run; nothing here was pressed on a phone (CODE CONFIRMED only).

### sheetshare (www/sheet.js, www/share.js)

| item | outcome |
|---|---|
| 1, 3, 4, 13, 14, 16, 17 | fixed — comments |
| 2 | fixed — dead `/G1` taken out of the PDF |
| 8 | fixed — file name keeps the language's name, the word after it through `t()`; sheet-check watched red |
| 9 | fixed — the sheet's export is the share mark top right (rule six); marks-check green, 396 → 395 word-only |
| 15 | comment fixed; **OWNER**: `SHARE.how` prints `no bridge` / `sent` / `refused: …` in English on the digits page — (a) marks like net.js (`−` never sent …) or (b) through `t()` |
| 7 | **OWNER**: making a sheet asks no plan, PAID_FEATURES puts the whole chapter on Pro — (a) gate `shMake()` with `can('file')` or (b) making stays free and the docs say so |
| 5 | **OTHERS** shell.js `viewReset()` does not forget `SH` |
| 6 | **OTHERS** see the cover under "taken language" below |
| 10 | **OTHERS** i18n `wr.s2.d` 「ファイルアプリに入ります」 is stale (it is the share sheet now) — wording is the owner's |
| 11, 12 | not changed — row height is UNCONFIRMED (needs a fixture state with a read sheet); inline `style=` layout is not a corner/border |
| 18, 19, 20 | **OTHERS** docs/keyboard-extension.md §14, docs/FEATURES.md § write, sound.js comment |

### small (grammar-engine, assist, ipa, reading, notes, voice)

| item | outcome |
|---|---|
| 1, 3, 5, 6, 7, 8, 10, 17, 18, 19, 24, 25, 29, 31, 32, 41 | fixed (notes: one 保存しました after the server answers, reading needs no sign-in, a deleted note no longer shifts the next one's save mark, dead `ntNewSpent`, the blank line; comments) |
| 11, 20, 40 | fixed — renames `ntFound`→`ntNewest`, `pick`/`taken`→`asPick`/`asTaken`, `fromLegacy`→`fromLang` |
| 13, 14, 15, 16 | fixed — voice's dead Play-all residue and unused arguments |
| 21, 33 | fixed — two branches nothing reaches |
| 26 | fixed — three IPA examples a language does not have (χ fr, ʋ ko, ɤ ko; ɤ zh as 饿) |
| 27 | fixed — a meaning is not found inside a longer Cyrillic/Greek/accented-Latin word; grammar-engine-check watched red |
| 28, 34, 35, 37, 38 | fixed — engine roads nothing takes and exports nobody calls |
| 39 | half — the adapter's unused `'SOV'` default is gone; `model.wordOrder()` still reads a string, because grammar-engine-check holds that the six stored strings are read |
| 2, 4, 9, 12 (wording), 22, 23, 30, 36 | **OWNER** — as written in the group section below |
| 42–48 | **OTHERS** — as written below |

### pwi (phases.js, import.js, words.js)

| item | outcome |
|---|---|
| 1, 2, 3 | fixed — import on free adds no letters and renames no slot; import does not write a language it may not write; word-check watched red |
| 4, 5, 6 | fixed — the screen before the press and the press count on one road; an overwrite at the ceiling is allowed; the ceiling is the usual `up.need` pop |
| 13 | fixed — the migration no longer writes the read-only picture back as this phone's own; migrate-check watched red |
| 15 | fixed — a grammar stage of one's own asks the plan on the ＋; plan-check watched red |
| 8, 12, 16–20, 26 (comment), 27–33 | fixed — comments |
| 35 | fixed — `genTake()` no longer patches the sheet after opening it (`openAdd(from, sp)`) |
| 14 | **OWNER** — the stage subtitles: the owner cut four with 「↑これは説明だろ」 and the rest were left on purpose; whether 「一語で通じる言葉」… and 「1から{0}まで」 are explanation is theirs |
| 23 | not changed — carried in docs/BACKLOG.md (`migrateGramLang()` walks LANGS). The one-word fix it names (`LANGS[id].mine`) no longer exists: ownership is `langOwnOf()`'s three states, and "not asked yet" at launch is the open question |
| 34 | **OTHERS** — see "taken language" below |
| 7, 9, 10, 11, 22, 24, 25, 26 (undo), 36 | **OWNER** — as written below |
| 21 | **OTHERS** shell.js `viewReset()` does not forget `stExNew` |

### wordsheet (www/wordsheet.js)

| item | outcome |
|---|---|
| 1, 2, 3, 4, 5, 8, 9, 10 | fixed (the Save's draft holds examples and forms; delete/derive after the draft is let go; no 更新しました before the answer; a form not on the screen is not deleted by Save); word-check watched red |
| 11 | fixed — no pen, forms ＋ or rule button in somebody else's language; word-check watched red |
| 12 | fixed — the reading row is on every plan and sends free to the plans; word-check watched red |
| 13 | fixed — no text inside the relation sheet's boxes; the example box's `exHint()` is **OWNER** (the file argues both ways) |
| 15 | fixed — 「意味なし」 instead of the unpressable 「意味の追加」; a fixture face added so it can be photographed |
| 17 | fixed — the group is a `.grpsep`, not a margin |
| 24 | fixed — 「この活用を削除」 is the same bottom red row as 単語の削除 |
| 25 | fixed — the two ＋ read 「追加」 |
| 27–35, 37, 38 | fixed — comments |
| 40 | fixed — typing rewrites the syllables and the reading row too; word-check watched red |
| 6 | **OTHERS** — a rename Save that does not land leaves `NAV` on the new name. The cover is `keepSnap()`/`keepBack()` in shell.js holding `NAV`, which covers every save that moves the trail |
| 22 | **OTHERS** shell.js `viewReset()` (`fmNewG`, `fmrDraft` …) |
| 36, 41 | not changed — UNCONFIRMED (`addW.mns/pos` may be read as a generic `w`; whether the sheet ever holds `canvas.tc`) |
| 7, 14, 16, 18, 19, 20, 23, 26, 42 | **OWNER** — as written below |
| 21, 39 | **OTHERS** phases.js `openSlot` (a second draft builder), DATA_MODEL.md |

### grammar (www/grammar.js)

| item | outcome |
|---|---|
| 1, 2, 3, 4, 5, 8, 9, 12, 21, 25 | fixed (noun-class rename sheet; its Save in the bar; no default written as an answer; an emptied board is written empty; a rule picked in a chapter is picked there only; dead code); gramlang-check watched red |
| 7 | fixed — rename `setOrder`/`setNpOrder`/`setGPos` → `gOrderPut`/`gNpPut`/`gPosPut` |
| 16 | fixed — a derived noun is on the noun-class list and the form table; gramlang-check watched red |
| 26–44 | fixed — comments (36 and 42 were already gone) |
| 45 | fixed — a guard that cannot be false |
| 6 | **OTHERS** shell.js `viewReset()` (`g2Lift`, `G2POL`) |
| 11, 13, 15, 17, 18, 20, 22, 24 | **OWNER** — as written below |
| 23, 41 (BACKLOG) | **OTHERS** |

### The taken language — one hole, five doors

sheetshare-6, pwi-3, pwi-34, wordsheet-11 and the import are one statement: *a
screen that writes opens in a language that may not be written*. Each was
closed where it was drawn, the way the code already does it (`langLocked()`),
and `word-check` holds the word sheet and the import. **The cover for the
press is `makeNeed()` (www/onboard.js, r122's file)**: if it answered
`langLocked()` as well, every writing sheet would refuse in one place and the
per-screen refusals could be deleted.

### kb (www/keyboard.js, docs/keyboard.md)

| item | outcome |
|---|---|
| 1 | fixed — deleting keyboards through Select no longer moves the phone's keyboard to a neighbour (one road, `kbDropAll`); kb-check watched red |
| 4 | fixed — the ⋯ of board 0 has no 「組み直す」; kb-check watched red |
| 5 | already fixed on integ-0905 — `migrateKbFree()` is inside `migrateAll()`, and every caller runs it under `slAsApp()` |
| 7, 8, 9, 10 | fixed — i18n: an empty frame reads 「この枠を選ぶ」; the `?` no longer says a second press lets go; the join button is not "beside" only; the five unread `kb.pat.*.d` are gone |
| 12 | fixed — a keyboard page is deleted with the bin, not × |
| 17, 18 | fixed — a line that does nothing and a test that cannot be true |
| 19–39 | fixed — comments (the plan split of before 2026-09-25, gone screens and roads) |
| 40–49 | fixed — docs/keyboard.md rewritten to what the code does |
| 2, 3, 6, 11, 16 | **OWNER** — as written in the group section (3: 「最初から組み直す」 asks about one keyboard and removes every built one) |
| 13, 14 | **OTHERS** www/index.html — `.kbk.pick`, `.ltc.pick`, `.kbe .kbstk`, `.kbe .kbl.sm`, `.kbpad`, so the inline `style=` here can go |
| 15 | **OTHERS** www/glyph.js — `ICON_INLF`, `ICON_INRT`, `ICON_JOIN`, `ICON_KEYSET` belong in the `ICON_*` row (the comments say docs/BACKLOG.md carries the move; it does not) |

### home (www/home.js)

| item | outcome |
|---|---|
| 1, 2 | fixed — search shows what the free list shows, and its import row is the same door as Settings; plan-check watched red |
| 3 | fixed — the profile's language row waits for the server's answer about the page; world-check watched red |
| 4 | fixed — somebody else's language is written to this phone only after the take is answered; take-check watched red |
| 5 | fixed — 「非表示 n」 counts this account's own ceiling only; acct-check watched red |
| 6 | fixed — the overview note migration runs only on a language that may be written, as the app's write; world-check watched red |
| 11 | fixed — a section's own page draws nothing of somebody else's language; world-check watched red |
| 12 | fixed — the contents rows carry no unread counts; the two dead helpers and four unused keys went with them |
| 13–36 | fixed — comments (36 and 24 were already right after integ-0905) |
| 38, 39 | fixed — the overview ＋ reads 「追加」; `HELP.pub` is built by `helpMark()` and escaped |
| 7 | **OTHERS** — the name screen's Save is not the KEEP road. It can join it only when `netLangRename()` (www/net.js) answers a refusal to its caller, so `done(false)` can be said; net.js is not this branch's |
| 8, 9, 40, 41 | **OWNER** — as written below (8: the two deletes that do not ask; 9: the swipe's − or the bin) |
| 10, 37 | not changed — UNCONFIRMED (whether `netPrefsPut()` inside a Save is rolled back; which of two stacked comments on `langAddRow` is true) |
| 42 | **OTHERS** index.html inline styles |

### Left open, and why

- **grammar-14** — a negation or question rule's sentence always says 「動詞の先頭／末尾」, also on the noun sentence and existence pages. The fix needs the rule's op to carry the part of speech of the word the letters went on, which changes the stored rule (`STG.gr`): a CHANGELOG entry and a check first. Not done in this pass.
- **pwi-23** — as above.
- **wordsheet-36, 41; home-10, 37; sheetshare-11** — UNCONFIRMED; each says what would confirm it.

### Checks

Every behaviour fix names the check it was watched red on. The nineteen fast
checks are green on the last commit. Each slow check was run green after the
change it holds (grammar-engine-check, gramlang-check, word-check,
world-check, kb-check, keep-check, sheet-check, gen-check, marks-check), not
all again at the end. plan-check, take-check, acct-check and migrate-check
were run by the fixes that name them before the branches were brought
together, and have not been run since. The whole gate was not run — that is
the leader's.


---

## Group `kb` — www/keyboard.js

## Audit — GROUP=kb (`www/keyboard.js`, 4561 lines)

Branch `claude/audit-words` @ 126773ba. Read-only. Nothing in the repo was edited.
Three findings were **measured** in a headless Chromium with the real app and the
`tools/fixture.mjs` seed. The probe is `scratchpad/audit/kbprobe.mjs` and is not in the repo.
Everything else was established by reading the quoted lines, and says so.

---

### A. Behaviour and data (the important ones)

1. **`www/keyboard.js:2697-2706` (`kbSelDelGo`)**
   - **Rule broken.** CLAUDE.md § Data and rule 19: nothing may quietly change what somebody types with. The file's own rule, at `keyboard.js:173-178`, says "Without that, joining a copy in front of the applied board silently makes its neighbour the keyboard on the phone." That comment treats this as a fault, and `kbDropGo` handles it (`KB.at>i? KB.at-1 : KB.at`).
   - **Evidence.**
     ```
     KB.kbs.splice(ids[i]-1, 1);
     ...
     KB.at=kbClamp(KB.at, b.length);
     ```
     `KB.at` is never moved down when boards in front of it are deleted.
   - **Measured.** Three boards were built (qwerty, flick, abc) and flick was applied. Board 1 was then deleted through Select. Afterwards the applied board was **abc** (`A_gotIsAbc: true`). The keyboard on the phone changed with no press on it.
   - **Class: FIX-HERE (behaviour).** Rewrite the at/kbShow adjustment as a single step: subtract the number of deleted indexes below `at`. Share that one statement with `kbDropGo`.
   - **Data.** Stored data changes, because `KB.at` changes. The look does not change.
   - **Owner question in the same place.** When the applied board is itself deleted, both `kbDropGo` (`:888`) and `kbSelDelGo` make its neighbour the applied board instead of board 0. That is item 2.
   - **Confidence: CONFIRMED (measured).**

2. **`www/keyboard.js:888` and `:2705` (deleting the applied board)**
   - **Evidence.** `KB.at=kbClamp(KB.at>i? KB.at-1 : KB.at, b.length)`. If `KB.at===i`, the next board, or the last one, becomes the keyboard on the phone.
   - **Rule context.** The comment at `:869-871` still says "never the last one ... the app would be quietly back to the default". That test was removed (`:876`), so the comment is stale.
   - **Class: OWNER.** Which board is applied after the applied one is deleted? Options:
     - (a) board 0, the free QWERTY;
     - (b) the neighbour, which is what happens today, silently;
     - (c) refuse to delete the applied board until another one is applied.
   - **Confidence: CONFIRMED (code-read).**

3. **`www/keyboard.js:4200-4208` (`kbReset` / `kbResetGo`)**
   - **Rules broken.**
     - (i) The wording does not match the act. `kb.reset.ask` reads 「このキーボードを捨てて、最初の1枚に戻しますか？」 / "Throw this keyboard away and build the first one again?". But `kbResetGo` does `KB=null`, which throws away **every** board the person built, not "this keyboard". It is reached from the ⋯ of one board.
     - (ii) Rule 11: 「NOT SAVING IS THE SPEC. SAVING AND SAYING NOTHING IS NOT」. The reverse happens here: the screen says it is done when nothing was saved.
     - (iii) CLAUDE.md § Simple ("one thing is done by ONE mechanism"). The ⋯ page has two destructive rows that save in two different ways. `kbDropGo` calls `kbForget()` before `saveKb()`, so the delete is written at once. `kbResetGo` does not, so the reset is only the page's draft.
   - **Evidence.**
     ```
     function kbResetGo(){
       KB=null; saveKb(); kbLay=0; kbSel=null; render();
       toast(t('kb.reset.done'));
     }
     ```
   - **Measured** (reset pressed from ⋯ on board 1):
     - the slice still held 2 boards;
     - `keepDrafting()` was true;
     - the toast 「キーボードを組み直しました」 was on the screen;
     - backing out to the list then asked 「Save what you have typed?」.
   - **More, from the same run.** `saveKb()` → `kbVFix()` → `kbEdit()` re-mints `KB` (`:1238`), so `KB` is `{kbs:[]}` and not `null`. The comment at `:296-300` ("kbRead() turns ... a stored `null` into the same empty KB, which is what kbResetGo() means") describes a null that never reaches `kbWrite` on this road.
   - **Also.** `kbResetGo` does not call `kbForget()`, so `KBU` and `KEEP['kb|N']` still refer to boards that are gone.
   - **Class: OWNER, then FIX-HERE.**
     - The owner decides whether the reset means "all built keyboards" or "this keyboard back to its pattern", and whether the reset row should exist at all, since `kbSetPat` already rebuilds a board from its pattern.
     - After that decision the code is rewritten so that reset and delete save by the same road. The popAsk text is corrected in all 10 i18n files.
   - **Change type.** Behaviour. Stored data changes. The look changes (the toast).
   - **Confidence: CONFIRMED (measured).**

4. **`www/keyboard.js:4001` (`kbMore`)**
   - **Evidence.** The reset row is drawn outside the `!kbIsFree(now)` guard:
     ```
     '<button class="set" style="border-bottom:none"' + DO('kbReset') + '>'
     ```
     The comment above it (`:3992-3993`) says "Not board 0 ... nothing there to delete".
   - **Consequence.** If `form:kbmore` is ever standing on board 0 (it can be restored as a route), `kbResetGo` runs with `kbShow=0`, so `kbEdit()` returns null and does not re-mint. `kbWrite` then writes `null`, which goes to `slRm()`. That removes the slice **and its disk copy and the `.got` picture**. Nothing is sent, because `netSliceUp` has `if(mine===null){ done(false); return; }`, so the next `netLangFill` puts the keyboards back.
   - **Rule context.** Rule 22 says 「slRm() ... is only ever a person deleting a language or an account」.
   - **Class: FIX-HERE (behaviour).** Put the reset row inside the same guard, or follow whatever item 3 decides.
   - **Confidence: UNCONFIRMED.** The road to it is a restored route. To confirm: `go('form','kbmore')` with `kbShow=0`, press reset, answer yes, and read `slMine(langKey('kb'))` and `localStorage`.

5. **`www/core.js:1820` and `www/keyboard.js:278-285` (`migrateKbFree` → `saveKb`)**
   - **Rules broken.**
     - Rule 6 and `docs/FEATURES` of 2026-09-24: 「保存を押したら」. A save goes up when a person presses something.
     - The comment at `core.js:1814-1817`: 「The app's own writes ... the new one's top-ups and migrations. None of it is somebody changing their language, so none of it goes up by itself」.
   - **Evidence.**
     - `migrateAll` runs under `slAsApp(...)`, but `migrateKbFree();` is called bare after it (also at `core.js:1974`).
     - `migrateKbFree` ends in `saveKb()` → `kbWrite()` → `bkTouch()` + `slWr()`, and `slWr` marks `LTOUCH` when `!SL_APP`.
   - **Measured.** `slTouched(langKey('kb'))` was **true** after `migrateKbFree()` on an old-shape KB. The migration is marked as a person's write, and `bkTouch` sends it with no press.
   - **Side effect.** `saveKb()` also runs `kbVFix`/`kbWayOff` on whichever board `kbShow` points at when a language is opened.
   - **Class: FIX-HERE (behaviour).** The migration writes through `slAsApp(kbWrite)`, or is called inside `migrateAll`. It must not go through `saveKb()`, because a migration is not an edit.
   - **Data.** The same data is written; only whether it goes up without a press changes.
   - **Confidence: CONFIRMED (measured).**

6. **`www/keyboard.js:313-316` (`saveKb`)**
   - **Rule context.** One door: 「Every writer of the language asks this [langWrites] and nothing else」 (`core.js:1525`).
   - **Evidence.** `saveKb` first returns on `langLocked()`, then `kbWrite` asks `langWrites()`, which asks `langLocked()` again. The first check also keeps `kbVFix`/`kbWayOff` from mutating somebody else's board in memory, so it is not pure duplication.
   - **Class: OWNER / leave.** Noted for completeness. If it stays, the comment over `langWrites` in `core.js` should name it.
   - **Confidence: CONFIRMED (code-read).**

---

### B. Words on the screen (i18n)

7. **`www/keyboard.js:1665` and `:3753`**
   - **Rule broken.** An `aria-label` has to say what the control does. Owner decision 2026-08-28 「全部のます触ったら選択」: pressing a frame only selects it.
   - **Evidence.** Every frame is `DO('kbCellSel', ...)` with `aria-label="'+esc(t('kb.cell.add'))+'"`. That label is 「ここにキーを足す」 / "Add a key here", but pressing the frame does not add anything.
   - **Class: FIX-HERE.** Give the frame a "select this frame" label, meaning a new key in 10 languages, and keep `kb.cell.add` for the + button (`:3753`). The look does not change.
   - **Confidence: CONFIRMED.**

8. **`www/i18n/*.js` `hp.kb.2.d` (the text behind the `?` in `HELP.kb`, `keyboard.js:3961`)**
   - **Rule broken.** A document or help text claims something the code does not do.
   - **Evidence.**
     - The en text says "Press again to let go." The ja text says 「もう一度押すと外れます」.
     - The code does the opposite. `kbSelSpread` has `if(kbKeyIs(ri, ki)) return KBH;          /* already chosen: it stands */` (`:1859`). `kbHeadTo` has `if(kbHeadIs(k, i)) return KBH;` (`:2215`).
     - The owner removed the toggle: 「同じとこ触ると選択解除されるからわかりにくい」 (2026-08-27).
     - `docs/keyboard.md` §1/§3 agree with the code: 「押し直しても外れません」.
   - **Class: FIX-HERE (i18n wording, 10 files).** Example: "Press somewhere else to let go." Wording is the owner's (§ Deciding), so a proposed sentence goes to the owner.
   - **Confidence: CONFIRMED.**

9. **`www/i18n/*.js` `kb.key.join` 「隣のキーとくっつける」 / "Join to the key beside it"**
   - **Evidence.** The button also joins **down** (`kbJoinSel`, `:2391-2395`). `hp.kb.join.d` says so.
   - **Class: FIX-HERE (wording, owner signs off).**
   - **Confidence: CONFIRMED.**

10. **`www/i18n/*.js` `kb.pat.qwerty.d` / `flick.d` / `tap.d` / `chart.d` / `abc.d` are dead keys**
    - **Rule broken.** Rule 5 in spirit: nothing reads them. The only reader is `t('kb.pat.'+p)` at `:2972`, and `.d` is never appended.
    - **Evidence.**
      - `kbPatsHTML` comment (`:2955-2961`): 「They were five rows of prose ... the only words left are its name.」
      - `kb.pat.tap.d` = "One letter per key, five to a row", which is also false today. `kbTapLay` goes through `kbPer()` to ten across (docs/keyboard.md table: タップ 10 × 4).
    - **Class: FIX-HERE.** Delete the five keys from all 10 i18n files, with a DELETE REVIEW not needed because they are strings, not data. The look does not change.
    - **Confidence: CONFIRMED** (grep over `www/*.js`: 0 readers).

11. **`www/i18n/*.js` `kb.rm.q`, `kb.lay.rm.q`, `kb.pat.q` (confirm pops)**
    - **Rule.** No explaining. The confirm-pop decision of 2026-09-24 is 「○○を消しますか？」.
    - **Evidence.**
      - `kb.rm.q` 「このキーボードを消しますか？他のものはそのままです。」
      - `kb.lay.rm.q` 「…この面へ行くキーは1面目を指すようになります。」
      - `kb.pat.q` 「配列を変えると、現在のキーボードで設定した文字やキーは削除されます。」 This is a statement with no question.
      - Each sentence after the question explains a consequence.
    - **Class: OWNER.** Wording and "explaining" are the owner's. Options:
      - (a) cut each to the question alone;
      - (b) keep as is, as consequence-of-a-delete.
    - **Confidence: UNCONFIRMED.** Whether a consequence line counts as explaining is a person's reading, not a check.

---

### C. Shape, marks and CSS in JS

12. **`www/keyboard.js:2949-2951` (`kbLaysHTML`)**
    - **Rule broken.** CLAUDE.md § Shape, sixth: 「delete is the bin ... from the `ICON_*` row」.
    - **Evidence.** A face (page) of a keyboard is deleted with `ICON_CROSS`: `DO('kbDropLay', [at]) ... aria-label="'+esc(t('kb.lay.rm'))+'">'+ICON_CROSS`. × is close, not delete.
    - **Class: FIX-HERE.** Use `ICON_BIN`. The look changes, so a screenshot is required. docs/keyboard.md (「タブの横の ×」) is updated in the same commit.
    - **Confidence: CONFIRMED.**

13. **`www/keyboard.js:1985` `kbPickPaint()` and its uses at `:1654`, `:2600`, `:4443`**
    - **Rule broken.** A filled background is set from JS `style=` (brief: zero tolerance for CSS in JS). The comment itself says the reason is stale: 「index.html belongs to another session today ... If it should be a stylesheet rule, it is one line -- `.kbk.pick{background:var(--pur);color:var(--bg)}` -- and this goes」.
    - **Class: OTHERS.** The fix is in `www/index.html`: add `.kbk.pick` and `.ltc.pick` (the `ltc` in `kbLtGrid` needs a class instead of inline style). Then delete `kbPickPaint`/`kbPickCSS` here. The look is unchanged if the CSS matches.
    - **Confidence: CONFIRMED.**

14. **`www/keyboard.js:4308-4314` (`kbSlotFace`)**
    - **Evidence.** Inline `style="display:flex;...gap:2px"` and `style="font-size:.6rem;line-height:1"`, with the stale reason 「Written here rather than in www/index.html because that file is another session's this week.」
    - **Also.** `kbPadHTML` / `kbPadSmall` (`:4137-4151`) set layout and colour inline.
    - **Class: OTHERS** (`www/index.html`: e.g. `.kbe .kbstk`, `.kbe .kbl.sm`, `.kbpad`). After that, delete the inline styles here.
    - **Confidence: CONFIRMED.**

15. **`www/keyboard.js:3690-3723` (`ICON_INLF`, `ICON_INRT`, `ICON_JOIN`, `ICON_KEYSET` defined in keyboard.js)**
    - **Rules broken.**
      - CLAUDE.md § Shape sixth: marks come 「from the `ICON_*` row in `www/glyph.js`」.
      - § Simple: `ICON_KEYSET` is 「The same drawing as ICON_PEN in glyph.js」 (`:3716`), so it is a second drawing of one mark.
      - The comments claim 「docs/BACKLOG.md carries the move」 (`:3693`, `:3719`). **It does not**: grep of BACKLOG for ICON / keyboard.js finds no such entry.
      - The reason given, 「glyph.js is being changed on three other branches today」, is stale.
    - **Class: FIX-HERE + OTHERS** (move them into glyph.js's ICON row; ICON_PEN at the toolbar size). This is a refactor and must be its own commit. The look does not change.
    - **Confidence: CONFIRMED.**

16. **`www/keyboard.js:3952` (`HELP.kb`, step 3)**
    - **Rule.** `.btn` "is not to be reached for again".
    - **Evidence.** `'<button class="btn" style="width:100%;margin-top:10px"' + DO('kbSettings')`, which is non-ghost `.btn`.
    - **Class: OWNER.** The 2026-09-24 decision keeps 「字を囲ったボタン 9 か所 … 今のまま」, but the 9 places are not listed anywhere found.
    - **Confidence: UNCONFIRMED.** It is confirmed by finding the list of the 9, or by the owner.

---

### D. Code that does nothing

17. **`www/keyboard.js:582` (`kbFlickLay`)**
    - **Rule broken.** § Simple, patch residue.
    - **Evidence.** `if(n>fr) n=Math.ceil(keys.length/3)>fr? Math.ceil(keys.length/3) : n;` does nothing. `n=Math.max(3, ceil)` and `fr=kbRowsMax()-1=4`, so `n>4` implies `ceil>4`, so `n` is already `ceil`.
    - **Class: FIX-HERE (refactor, delete the line).** No data or look change.
    - **Confidence: CONFIRMED** (arithmetic, `kbRowsMax()=5`).

18. **`www/keyboard.js:2598-2600` (`kbHTML`)**
    - **Evidence.** `(ro? '' : kbPickCSS(ri, ki))` sits inside the `: ` (non-ro) branch of `out+= ro ? ... : ...`, so the `ro` test is dead.
    - **Class: FIX-HERE (refactor).**
    - **Confidence: CONFIRMED.**

---

### E. Comments that say something false today

Rule: 「a change lands with every sentence it falsifies」 / stale comments. All of these are **FIX-HERE, comment-only, no data, no look.** All are **CONFIRMED** by reading the code named.

19. **`:286-300`.** 「Every free language is that language. Free reads kbFixed() ... so on the free plan there is no other state this can be.」 This is false since 2026-09-25 「キーボードはプランで分けない」: free builds boards. The kbResetGo sentence is also false (item 3).

20. **`:369-371`.** 「Letters five to a row, with a space and a backspace under them. Used for both faces of the first keyboard」. It describes nothing: there is no function under it, and the first keyboard is `kbFixed()`.

21. **`:423-424`.** The bottom-bar comment is orphaned above `kbBarLay`; it describes `kbBar`.

22. **`:512-515`.** `kbDefault`: 「The first keyboard, so there is something to type on before anybody has built anything」. False: the first keyboard is `kbFixed()` (`kbOf`, `:1194-1198`). `kbDefault` is only `kbTapLay`.

23. **`:549`.** Orphan 「Ten to a row, which is what a row of a phone keyboard holds.」 sits above `kbFlickLay`.

24. **`:997-998`.** 「ten, nine, and seven letters with a delete two keys wide」, and `:1094` 「Two keys wide.」. The code is `d.w=3` (`:1114`). The comment at `:1110` already says 「Three wide」, so the block contradicts itself.

25. **`:1389-1401`.** Orphan comments about an `act`/`ro` function, above `kbCol`. They say 「What it does not have is an editor」 about the free plan, which is false since 2026-09-25.

26. **`:1467-1490`.** 「The reference is a 390 x 844 phone」. This was superseded by the very next comment (`:1491-1520`) and by `KB_REF_W=320, KB_REF_H=568`. Two contradicting comments are stacked.

27. **`:1758-1760`, `:1902`, `:2347`, `:2385-2387`, `:2654-2664`, `:2896-2898`, `:3494-3501`.** Orphaned or duplicate comment heads that describe the function below them wrongly or twice. Examples: 「Whether the selected key has one beside it to join to.」 immediately followed by the corrected version; two copies of the kbMoreQ head.

28. **`:2050-2052`** (`kbVJoin`). 「It answers whether it happened, so kbTapKey() can fall through to plain selection」. `kbTapKey` no longer calls `kbVJoin`; the only caller is `kbJoinSel` (`:2394`), which ignores the return value.

29. **`:2122-2128`** (`kbNHTML`). 「The row's number, which is also how the row goes. 「1触ったら1が全部消える」 ... It asks nothing first」. Pressing a number SELECTS since 「今即削除なの危なすぎだろ」. Deleting is the bin (`kbCut`).

30. **`:2185-2198`.** 「This does not change what happens yet ... What the sentence IS is still being asked」. It has been decided and implemented (`kbSelSpread` `:1840-1851`, `kbHeadTo` `:2207-2217`).

31. **`:3530-3543`.** 「the number takes the row, the letter takes the column ... It is asked for by name, by pressing the number or the letter of the thing being removed」. False: deletion is the bin on a selection.

32. **`:2776-2820`** (`vKb`). 「What they do not have is an editor for it, and that is the only thing Upgrade buys here」, 「kbNew() and kbAdd() ask instead ... send somebody to the plans screen」, 「the ceiling is met when the + is pressed」. All false since 2026-09-25: there is no ceiling, no plan question, and free has the editor. `:2834-2836` and `:2864-2866` (「the same face the free plan gets」) have the same stale framing.

33. **`:2909-2915`** (`kbMoreQ`). 「the ? that stood here has gone to the contents, beside the chapter's own name (www/home.js § vBuild)」. The `?` is on the LIST (`vKb` `:2846`, OWNER 2026-09-06 「一つ中＝キーボード一覧」). grep finds no `helpQ('kb')` in home.js.

34. **`:3018-3020`** (`kbApplyHTML`). 「On the one already applied it says so instead」. It returns `''` (`:3026`).

35. **`:3797-3801`** (`kbRepat`). 「the layout is rebuilt empty: everything assigned to a key on this keyboard goes」. `kbSetPatGo` → `kbPatLay(pat)` lays the letters on (OWNER 2026-09-11, `:738-757`).

36. **`:3838-3850`, `:4005-4016`, `:4032-4036`.** Orphan comments about deleted things: the in-chapter "what this chapter is" block, `sharePush` / "whether it reached the phone" (`kbOutSay` was deleted), and a two-places `kbLayRoom` sentence contradicted by the three-places comment under it.

37. **`:3933-3937`** (`HELP.kb`). 「The upgrade lines are kept and moved to the FOOT, after the steps」. There are no upgrade lines in `HELP.kb`.

38. **`:4110-4113`** (`kbAddLay`). 「kbDefault() has done this from the beginning ... a key to 1 on the first, a key to 0 on the second」. `kbDefault` links nothing (`:518-523`, `kbLinkFaces`).

39. **`:869-871`** (`kbDrop`). 「never the last one ... the app would be quietly back to the default」. There is no such test (`:876`). See item 2.

---

### F. `docs/keyboard.md` is out of date against the code and decisions

Class: FIX-HERE in the chapter's own doc, outside the assigned file. All items CONFIRMED against `www/keyboard.js`.

40. **§0.** 「プロフィール → 文字 → キーボード」「文字の章の一番下」. The keyboard is chapter VI of the contents (CLAUDE.md Layout).

41. **§0.5.** 「右上は ？ と…そして共有の印 ── フォントを書き出します（§ 6.5）」. The share mark was removed from the keyboard list (decision 2026-09-25 「フォントの書き出しは文字の画面の右上」). § 6.5 does not exist.

42. **§1.** 「`？`…は一覧と、1枚目（QWERTY）の頁にあります」 and 「手順は四つで、「設定を開く」のボタンは手順 1 と手順 3 の両方」. The code has the ? only on the list (`kbMoreQ` returns `''` on board 0). There are 3 steps (2026-09-18), and the button is in step 3 only (2026-09-06).

43. **§2 「押したとき」.** The table lists 層. The code offers 文字/スペース/削除/改行 (`kbKeyHTML` `:4253-4259`, OWNER 2026-09-06).

44. **§2 「幅（1・2・3・4）」 and 「← ＋キー →」.** Removed from the key page (OWNER 2026-09-06 「「幅」の段は消す」; ◀▶ gone, `:4260-4270`).

45. **§2 「キーを足す」.** 「選んだ枠の幅ぶんのキーが1つ入ります（半キーの枠には半キー）」. Contradicts 2026-09-05 「半キーを追加できるのやめてほしい」 (`kbCellFits`).

46. **§3 「行を足す」 and 「大きさの上限」.** 「一番下の破線の `＋`」. Removed 2026-09-04 (`:2615-2627`).

47. **§3 「足りていない行」.** 「半端が出るときはキー1つ単位に丸めて、余った半分は右に回ります」. **§3 「行を寄せる」**: 「丸ごと1キーの位置に落とすのは中央寄せだけ」. Both contradict 2026-08-28 and `kbLead`/`kbAlign1`, where centre does not round.

48. **§3 「ページを足す」.** 「「押したとき」を 層 にし」. 層 is no longer choosable.

49. **§5 examples, §6 「組んだキーボードが出る場所」 and §7.** They describe the in-app keyboard (spelling field, examples, post) and 層 keys switching in fields. The in-app keyboard was removed (`:2638-2652`).

---

### Owner decisions checked and found implemented (no finding)

- 2026-09-25 「キーボードはプランで分けない」: `keyboard.js` has no `can(` / `has(` / plan branch; the + is on every plan (`:2767-2773`).
- 2026-09-25 「複数のキーに一度に字を入れる」: the pen on a run (`:3755-3766`), ①② (`:2604`, `kbNth`), confirm-then-return (`kbSlotsPut` + `kbToBoard`).
- 2026-09-25 「字を選ぶ画面は一つ」: `pkKindsHTML` is used for the key (`:4242`, `:4461`); there is no なし and no input field.
- 2026-09-24 「2段をつないだキーの真下は画面どおり」: `kbKeyAtSheet` everywhere.
- 2026-09-24 「キーを運ぶ長押し 10px」: `HOLD_SLOP` (`:3281`).
- 2026-09-06 「設定へ飛ぶボタンは手順 3 にだけ」: `:3951-3954`.
- 2026-09-05 「半キーは新しく作れない」: `kbCellFits`.
- 2026-09-04 「一番下の＋を外す」: `:2615`.
- 2026-08-28 「全部の升、触ったら選択」: `kbCellSel`.
- 2026-08-26 rows ceiling: `kbRowsMax`.
- The `confirm`/`alert`/`prompt` ban holds: `popAsk` only.
- There are no `on*=` attributes, and every `DO(` name is in `act-map.js`.

---

### Counts

| Class | Items |
|---|---|
| FIX-HERE | 34 (items 1, 4, 5, 7, 8, 9, 10, 12, 15, 17, 18, 19–39 comments, and doc items 40–49 counted as one group) |
| OWNER | 5 (items 2, 3, 6, 11, 16) |
| OTHERS (`www/index.html` CSS) | 3 (items 13, 14, 15-part) |

Confidence: 3 were MEASURED (items 1, 3, 5). Items 4, 11 and 16 are UNCONFIRMED. The rest are CONFIRMED by reading the code.

---

### Coverage

- **`www/keyboard.js`**: lines 1–4561, read in full in chunks 1–400, 400–849, 850–1298, 1299–1747, 1748–2196, 2197–2645, 2646–3094, 3095–3543, 3544–3992 and 3993–4561. That covers every function from `kbMint` to `kbDelKey`.
- **`docs/keyboard.md`**: read in full.
- **`docs/FEATURE_RULES.md`**: lines 330–362, 524–600, 684–735, 1590–1620, 1755–1790, 2220–2275, 2388–2480, 2805–2830, 3605–3670 and 4755–4960 (all keyboard decisions).
- **Cross-checked, partial**:
  - `www/core.js`: `slOpen`/`slWr`/`slRm` 1058–1104, `langLocked`/`langWrites` 1514–1542, 1810–1825, 1965–1980, `save` 1991, `setKeep` 2635, `SET_PREFS` 1654.
  - `www/shell.js`: `go` 263–272, KEEP 440–570, `keepAsked`/`keepNo` 895–930.
  - `www/net.js`: `netSliceUp` / `netSaveNow` 2470–2620.
  - `www/sns.js`: `PAGE_READS` 686–735.
  - `www/backup.js`: `bkTouch`.
  - `www/i18n/ja.js` and `en.js`: every `kb.*` and `hp.kb.*` key.
  - `tools/keep-check.mjs` 10b and `tools/kb-check.mjs` head.


---

## Group `home` — www/home.js

## Audit — GROUP=home — www/home.js (2938 lines, branch claude/audit-words)

Read-only. Nothing in the repo was edited. Every line below was checked against the code it quotes.

### A. Behaviour / data / money

1. `www/home.js:970` — **Money: two doors to import disagree.** docs/PAID_FEATURES.md table: "CSV, file import, the sheet | gone, as they always were on free | `can()` on the press". Settings asks `can('data')` (settings.js:427 `(can('data')? DO('openImport') : DO('upData'))`); the find screen's row does not:
   `out+=fSec(t('find.in'), '')+fRow(t('set.csv.in'), '', DO('openImport'));`
   `openImport()` (import.js:605) asks no plan, and only `fileInHTML` asks `can('file')`, so on free the paste import is reachable through 検索 while Settings shows the door. One question ("may this plan import") has two answers.
   - class: FIX-HERE (behaviour): `fRow(..., can('data')? DO('openImport') : DO('upData'))`. Better: one function that both doors call. Whether paste import should be free at all is OWNER (options: (a) pro-only on both doors, which is the documented rule; (b) paste free on both, which means changing PAID_FEATURES.md). Look unchanged; no stored data.
   - confidence: CONFIRMED (the code of both doors; not pressed on a device)

2. `www/home.js:897-900, 885, 959, 886, 847-858` — **Money: search shows what the free list hides.** The file's own comments state the rule twice. At 840-843: "Searching past the free ceiling would put back on one screen exactly what the other one stops showing". At 901-903: "ltSeen(), not LETTERS … a search that answered off the whole list put those letters back on the screen through the other door." PAID_FEATURES: the dictionary on free "lists the first 100 words" (`wordsSeen()`), the alphabet "lists the free thirty-eight" (`ltSeen()`). These places still read the whole list:
   - `g.w=WORDS.filter(function(w){ return srcKey(w).indexOf(qq)>=0; })` (fHits, 899), so a word past 100 appears in results
   - `var noMn=WORDS.filter(...)` (fTodo, 885), which counts hidden words
   - `var noSnd=LETTERS.filter(...)` (fTodo, 886)
   - `lt=LETTERS.filter(ltHasShape)` (fRestHTML, 959), which draws hidden letters as keys
   - fWordsWithLtr, which takes `ltById(id)` over LETTERS (fine, because it filters `wordsSeen()`)
   - class: FIX-HERE (behaviour): use `wordsSeen()` / `ltSeen()` in fHits, fTodo and fRestHTML. Look changes on free, and only for a language that is over the ceiling. No stored data.
   - confidence: CONFIRMED (code); not pressed

3. `www/home.js:1445` (wldRow) — **"Not asked yet" and "private" share a branch.** Decision 2026-09-08 (FEATURE_RULES.md §「この言語は非公開か」の答えはサーバーの published_at 一つ) says: 「まだ聞いていない」は第三の状態で、画面には出さない。行が降りてくるまで「この言語について」もプロフィールの言語の行も開かない. CLAUDE.md § Data says: "Empty" and "broken" are different states and must not share a branch.
   `(wldHidden()? '<span class="wldoff">'+esc(t('wld.hidden'))+'</span>' : '')`
   `wldHidden()` = `!wldOpen().pub()` = `!wldPubOf(langId)`, which is `LPUB[k]===1`, so a language whose answer has not come down reads 「非公開」. The row is also drawn (and pressable) before `wldPubKnown(langId)`.
   - class: FIX-HERE (behaviour/look): draw the row, or at least its state word, only when `wldPubKnown(langId)`, and say 「非公開」 only for `wldPubKnown && !wldPubOf`. No data.
   - confidence: CONFIRMED (code). How often it is reachable depends on whether `mylangs` lands before the profile draws (profile's PAGE_READS includes `mylangs`). It is reachable offline / on a failed read; not measured.

4. `www/home.js:1892-1906` (wldGet) — **The phone writes before the server answers.** OWNER 2026-09-06 「先にサーバーじゃないの？失敗しましたなのに端末に出るの変じゃない？」 (shell.js § AND THE SERVER GOES FIRST).
   ```
   langSeenAdd(id, seen? seen.name : '', seen? seen.owner : '');
   ... slWr(langKeyOf(id, got[i][0]), got[i][1]);
   ...
   netTakePut(id, function(){...}, function(){ delete WLD_TAKING[k]; toast(t('net.offline')); render(); });
   ```
   The index row (`langStore()` → disk) and the slices are written before `netTakePut` is answered. On a refusal they stay behind. `slMine()` then holds them for the session, so `netLangsGone()` will not sweep that row, and the row counts into vLangs' `other` "n hidden" (see 5). Also line 1904: `if(!(seen && seen.owner)){ delete WLD_TAKING[k]; render(); return; }`. That path writes the index and slices, records no take, and says nothing. That is a silent failure, which rule 11 says is not the spec.
   - class: FIX-HERE (behaviour): send `netTakePut` first and write the index and slices in its success callback. Refuse (toast) when `seen.owner` is missing, before writing anything. This touches local index/LSL only; nothing on the server moves.
   - confidence: CONFIRMED (order in code); the consequence on a refused take is not reproduced

5. `www/home.js:2882, 2906, 2925` (langsList / vLangs) — **The index picture is counted, including another account's languages.** CLAUDE.md rule 22: "So the index is a picture for LOOKING AT, and nothing counts from it." The same function's own comment at 2893-2902 says: "Folding a list and writing 「非表示 n」 under it are both deciding … which is the server's answer … and not this index's."
   `other++;` for every `LW_NONE` (the comment at 2869 says this is "the last account's") and `LW_WAIT` entry, then `hid: other + (mine.length-mineSeen.length)` → `'<div class="note">'+esc(t('cap.hid', other))+'</div>'`.
   So account B is told "2 hidden" about account A's languages, and an unanswered launch shows a count taken from the picture. The comments at 2876-2879 and 2893-2902 contradict each other.
   - class: FIX-HERE (behaviour): `hid` = `mine.length-mineSeen.length` only (and only when `langMineKnown()`). Delete the `other` count and the 2876-2879 sentence that claims it. Look: the note disappears in those states. No data.
   - confidence: CONFIRMED (code)

6. `www/home.js:2135-2139, 1562-1568` (vWorld → wldNoteMigrate) — **A migration run from a view, and a second place migrations live.** core.js migrateAll: "EVERY OLD SHAPE BROUGHT FORWARD, AND ONLY WHERE IT CAN BE WRITTEN — One list, and three moments ask it … a migration that cannot write does not run and raises no mark". CLAUDE.md § Simple: one thing by one mechanism.
   `function vWorld(){ wldNoteMigrate(); wldKeepOn(); return wldPage(true); }`
   `w.ovs=a; w.ovnote=1; saveWld();`
   It runs on every render of the writing face. It runs before wldPage's `langTheirs` guard, so it mutates WLD in memory for a taken language too. Its mark `ovnote` is set in the global even when `saveWld()` refuses (`langWrites()` false: locked, or a draft on the trail). The `ovnote` then rides along with whatever the person saves next, which makes it the app's write inside the person's draft.
   - class: FIX-HERE (refactor + behaviour): delete the call from vWorld and add `wldNoteMigrate()` to `migrateAll()` (core.js, OTHERS file), guarded the same way (no mark when it cannot write). Data: `wld.note` is still copied, never removed (unchanged).
   - confidence: CONFIRMED (code)

7. `www/home.js:2601, 2588-2617` (editName/saveName) — **A Save in the corner that is not the KEEP road.** Every other Save is `keepOn`/`keepSave` (shell.js: "this function is the only caller of `b.save` there is"). This one is `navDo(t('notes.save'), 'saveName', null, true)`, which reads the DOM on the press. The comment admits the patch: "THE ONE DECIDE BUTTON THAT IS STILL LIT WHATEVER IS IN THE BOX … Giving it one means a name in www/act-map.js, which the session that wrote this does not own. Until then it says true". So leaving the form with a typed name never asks 「保存しますか」, and the button is lit when nothing changed. That is two mechanisms for "a form's Save".
   - class: FIX-HERE (behaviour) + OTHERS (act-map.js line): give `ln-nm` an `IN()` into a keepOn buffer whose save calls `netLangRename` and answers `done(ok)`, and delete the "still lit" comment. No data.
   - confidence: CONFIRMED (code)

8. `www/home.js:2707-2718, 2694-2700` (langDrop) and `www/home.js:1551-1555, 2415` (wldOvDel) — **Deletes with no confirm.** Decision 2026-09-24 (FEATURE_RULES.md:684 ff.): 「消す前の「○○を消しますか？」: 確認の窓を出す（17 か所とも今のまま）。十の基準の 9「削除→Undo」はこれで置き換え」. The langDrop comment still argues from the replaced criterion: "Nothing is asked first. What stands behind it is the road back rather than a dialog … the same shape the keyboard's bin has (CLAUDE.md rule 19)". The code calls `netTakeDrop` straight from the swipe's −. wldOvDel splices a row on the − with no popAsk. (It is a draft until Save on the writing face, which is some cover.)
   - class: OWNER. Are these two among the deletes that must ask? Options: (a) `popAsk` before `netTakeDrop` / before the splice; (b) keep them as they are and record them as exceptions. Either way the langDrop comment's justification is stale (comment-only fix in any case).
   - confidence: CONFIRMED that no confirm exists; UNCONFIRMED whether the 17 places include these

9. `www/home.js:2691-2692` (langRow) — **Delete drawn as a character, not the mark.** CLAUDE.md § A SIXTH: "delete is the bin … from the `ICON_*` row in `www/glyph.js`".
   `'<span class="swdel"'+DO('langDrop', [id])+' role="button" aria-label="'+esc(t('langs.drop'))+'">−</span>'`
   A literal U+2212 in text, not `ICON_MINUS`/`ICON_BIN`. notes.js:316-317 has the identical shape.
   - class: FIX-HERE (look) for home.js, OTHERS (notes.js) for the twin. Whether it should be the bin or ICON_MINUS is OWNER: the owner asked for 「メモと同じ形」, and wldOvDel uses ICON_MINUS on 「マイナスボタン」. Show both states in screenshots.
   - confidence: CONFIRMED

10. `www/home.js:558-561` (pkKeepSave) — **A second road up inside a Save, and it is not rolled back.** The shell.js keepSave rule is: one road up (`netSaveNow`), and `keepBack` reverts the phone when it does not land.
    `ltSetChar(...); SET.showScript=true; save(); netPrefsPut(); installScriptFont();`
    `netPrefsPut()` sends `showScript` on its own the moment the Save runs. If the slice send then fails, keepBack puts `SET` back on the phone, but the server already has `showScript=true`. The Save also changes a person's setting as a side effect of choosing a character (the comment says "it was here before").
    - class: FIX-HERE (behaviour) for the road. Letting `netSaveNow`/the prefs road run only after landing is a shell/net question (OTHERS). Whether choosing a character should flip the person's 「文字を表示」 setting at all is OWNER.
    - confidence: UNCONFIRMED (the ordering is read from code, not measured; confirm by failing the slice PUT in a check and reading the server's `profile.prefs`)

11. `www/home.js:1227-1248` (vWldArt) — **The taken-language guard is missing on one face of the article.** Decision 2026-09-23: 取った言語は wiki に出ない … about / world は自分の記事を描かない（`langTheirs()` 一つで問う）. wldPage guards with `if(!L && langTheirs(langId)) return viewGone();`, but vWldArt (a section's own page, `wldart`) has no such line. It draws the section's title and body as input/textarea for a taken language. No Save appears, because `wldArtKeepOn` returns on `langLocked()`.
    - class: FIX-HERE (behaviour): `if(langTheirs(langId)) return viewGone();` at the head of vWldArt, asking the same one function. No data.
    - confidence: UNCONFIRMED on reachability (the only door is the `world` face, which is already gone for a taken language; a stale trail entry would reach it). The code gap is confirmed.

### B. Dead code / write-only data

12. `www/home.js:55-110` (tocRows) — **Fields nobody reads, plus two empty concats.** CLAUDE.md rule 5: "Written and never read". Every row carries `v:` and `txt:` (`v:ltShaped(), txt:LETTERS.length? (ltShaped()+' / '+LETTERS.length) : '—'`, and so on). The only readers are tocNum (`.r`), vBuild (`.r`, `.k`) and shell.js:1309 (tocNum). Nothing reads `.v` or `.txt`, so each call computes ltShaped()/stCount() for nothing. `.concat([]).concat([])` at 81-109 are two empty arrays under comments about "the sounds … Plus's" row and "The AI conversation is Studio's … Studio reads I to VI". Studio is deleted (CLAUDE.md: "`['free','plus','studio']` became `['free','plus']` when Studio was deleted").
    - class: FIX-HERE (refactor, no look change): delete `v`/`txt`, the two concats and their comments. Rewrite the 22-34 header, which claims "how much of it there is … so does the card on the cover". No card reads it.
    - confidence: CONFIRMED (grep: tocRows is called only at home.js:51 and :794)

### C. Stale / false comments ("a change lands with every sentence it falsifies")

All C items: class FIX-HERE, comment-only, no behaviour/data/look change; confidence CONFIRMED unless noted.

13. `:10-11` An orphan comment ("The one thing worth doing next … Without it the contents page is a list of rooms…") sits over nothing. The function it described is gone, and capBanner has its own comment.
14. `:116-118` "the character is the clothing you setPlan for it. An entry is a plain string today and can become {ch, svg}" and `:773-774` "you setPlan sounds, you give them letters". `setPlan` is a struck name (CLAUDE.md § Names: ~~`setPlan`~~). These are mechanical rename residue, and the map they describe is gone (chOf → ltChar).
15. `:138-140` An orphan pair ("Which sound the picker is currently open for." / "Both pickers use the sheet…") above the form section. Pickers are pages now (pkKind) and there is no sheet.
16. `:562-563` The same comment line is written twice ("Characters already spoken for, so the palette can grey them out.").
17. `:572-573` An orphan ("One sound as a small tile … opens the picker in the sheet") with no function under it. `:574-587` "the three roots … HOME is the cover … FIND is search … its own tab" is also stale: find is under the build tab (shell.js PAGES `find: {lang:1, tab:'build'}`) and there is no cover.
18. `:804-828` The vFind header says "the search tab … a tab that the bottom bar sends you to". Find is reached from the contents bar (vBuild 782-784) and is not a tab.
19. `:998-1002, 1021-1024, 2136-2138` "it was in no backup, because a backup is SLICES"; "It runs from boot.js beside the other migrations … because saving touches the backup and backup.js is loaded after this file"; "saveWld() touches the backup and backup.js is loaded after this file, which is why migrateWorld() runs from boot.js". Actual: migrateWorld runs from `migrateAll()` in core.js:1961. The backup file is deleted (rule 11), and backup.js now holds bkTouch only.
20. `:1054-1056, 1064-1070, 1102-1106` These say "a press acts" and "the rows and the sections themselves are already on the language by the time the button is gold", and that pressing writes the language through saveWld(). Since OWNER 2026-09-24 「保存を押したら」, a press on this screen is a DRAFT: saveWld() returns at `langWrites()` while `keepDrafting()`. The rows are in the WLD global, not on the slice, until Save. UNCONFIRMED wording-level (the behaviour is correct; the sentences describe the old model).
21. `:1249-1277` "The World screen above is the EDITOR -- five kinds, three fields"; "It reads and touches nothing … the only profile this phone can show is this person's own"; "THIS IS THE LOOK ONLY … Nothing here asks the server … 「他人の使えるようになる」 is the server's half and is not started." All false now: wldGet, netLangPublic, wldSeenAsk and others' profiles exist.
22. `:1356-1358` "The page's own flag is the other way round -- absent is public", `:1374-1377` "2026-08-13 settled what a PAGE defaults to (`hide` absent = public)", and `:2269` "`hide` is one flag". Decision 2026-09-08: the answer is `published_at`, and `hide` is not read.
23. `:1398-1403` "it is the page-wide pair in the settings room asked of one section". Rule 20: the settings room's two rows went; the pair is on the article's writing face.
24. `:1453-1457` (ABOPEN) "The line that forgets it belongs in viewReset() in www/shell.js … this session does not own that file, so it is reported rather than reached into." It is done: shell.js:113-126 `viewLeft()` holds `if(ABPAGES[from] && !ABPAGES[to]) ABOPEN={};` and says "this is the ONLY place". The "SHUT is the default" half is correct (rule 20).
25. `:1484-1487, 1580-1583, 1672-1674` Session-ownership sentences that describe a place the code knows is wrong. "Here rather than in www/glyph.js because that file is not this session's … When the chapters are put back together this belongs with the rest of them" (ICON_DL / ICON_TOOK / ICON_FOLD live in home.js, while CLAUDE.md says the marks are "the `ICON_*` row in `www/glyph.js`"). Also "render() … www/glyph.js, which this session does not own", which is why wldRows guesses heights at "roughly thirty-four characters". The move of the three ICON_ constants is OTHERS (glyph.js, refactor-only commit). Sizing boxes after render is OTHERS (glyph.js render). The comments are FIX-HERE.
26. `:2037-2039` An orphan ("Named for the world and not for the view…") above the abLtCell comment, with nothing it applies to.
27. `:2090-2107, 2145-2166` wldSeenOf says "answering the same seven questions", "Not one of the eight", and wldOpen says "Eight questions". Both bundles have nine members (here, pub, w, letters, name, ws, snd, dir, mine). Also at 2161-2166: "This is the prepared half. Nothing yet builds one of these from anybody else's language … `wldOpen()` is the only one there is". wldSeenOf is that builder and sits 60 lines above.
28. `:2180-2182` "The sounds the language is made of, and whether this article is YOURS -- the Edit button and the pressable letter cells". The letter cells are not pressable on either face (abLtCell on both, 2452-2456), and the comment sits on `snd`, not on `mine`.
29. `:1228-1232` "PAGES[route].view() is called with no arguments (www/glyph.js)". The view is looked up through route-map.js `page(...)` (rule 4). The fact about no argument still holds; the pointer is stale.
30. `:2299-2310, 2311-2322, 2360-2368` A layered history of the ↓ mark on one's own rows ("ON YOUR OWN ARTICLE ONLY. This mark is…", "This SUPERSEDES…", and the dangling "It is not, and the mark is not lost"). CLAUDE.md: "Fixing means deleting: do not leave the old sentence standing with 「this is history」". Keep the one sentence about now (the ↓ is a row at the foot, only on somebody else's article).
31. `:2552-2553` The orphan "What making this language public means, behind the `?` in the bar" belongs to HELP.pub (2564), not to the HELP.wld header under it.
32. `:2573` "`confirm()`, `alert()`, `prompt()` and UIAlertController, none of them". CLAUDE.md: the system dialog is banned "WITH TWO THINGS IT IS FOR". UIAlertController is how the profile-picture sheet is drawn, and the rating prompt is the second.
33. `:2619-2623` "LANGS holds every language this device knows about … Pressing a row is the only way to change that". Wrong on both counts: the index is the account's (`lingua.langs.<uid>`, rule 22 "NOTHING IS THE PHONE'S"), and langNew / langMainFall / langForAcct also change `langId`.
34. `:2632-2637` "A language that is only READ is a row and not a button. langOpen() refuses it". This contradicts 2652-2656 ("the row is a button like any other and langOpen() takes it") and the code (`<button class="lgrow … swrow"` for LW_READ). Delete it.
35. `:2658-2663` "langLocked() in core.js, asked by every one of the seven savers". The one door is `langWrites()` now (core.js:1539). `:2675-2677` "langMine() is the one place that says which kind this is -- the same question vLangs() above asked", but the code asks `langWhose(id)!==LW_READ`, and vLangs is below.
36. `:2719-2725` "nothing else in this app slides sideways". The profile's three lists slide sideways (pfSwDown/pfSwUp, home.js:691-716, OWNER 2026-09-05) and so does the notebook row.
37. `:2776-2802` langAddRow carries two stacked header comments for one function. The first ("the list stays in Settings. It is still there") should be checked against settings.js before it is kept. UNCONFIRMED on the Settings link.

### D. Minor / shape (lower confidence)

38. `:2424-2425` The overview's ＋ has `aria-label="'+esc(t('wld.overview'))+'"'` → "Overview". CLAUDE.md § A SIXTH: "with the word on the button as its `aria-label`". The mark's word is "add", not the section's name. FIX-HERE (i18n key for the add verb, via t()). CONFIRMED.
39. `:2564-2570` (HELP.pub, used by settings.js:435) is built from raw `<div class="sec">`/`<div class="note">` with unescaped `t('wld.public.d')`. The file's own rule at 221-233 says: "Three shapes and every HELP body is built of them" (helpPara/helpStep/helpMark). Its content ("Public" and "Downloadable" for the settings `lang` room) also describes switches that rule 20 says left that room. FIX-HERE (build with helpPara/helpStep) and OTHERS/OWNER (whether settings' `lang` room still needs a `?` about 公開 at all). CONFIRMED that the shape differs; UNCONFIRMED what the room shows now.
40. `:948-956` (fPickedHTML) Pressing a sound or letter replaces the find body in place with a result list and an in-body back row (`ICON_BACK`), with no route. The system back / swipe-back leaves find instead of undoing the pick. That is possibly a "screen's worth" shown without being a screen (CLAUDE.md § Shape). OWNER/UNCONFIRMED.
41. `:504` `'<button class="pkclear"…>'+t('ch.clear')+'</button>'` "No character", a word button that removes the borrowed character. It is arguably a choice, not a delete (no mark rule applies). Listed so it is looked at: OWNER/UNCONFIRMED. Also `t()` output is not `esc()`'d here, nor at 2590 `<label>'+t('set.name')+'</label>` and 969 `t('find.todo.no')`. Those are harmless for the current strings but are an inconsistency.
42. Inline `style=` from JS at 245, 283, 443, 458, 736, 785, 1241. None of them is a border, radius or panel, so rule 18 is not broken. Listed for completeness only; moving them is OTHERS (index.html) and optional.

### Checked and found compliant (no finding)
- Rule 20: `ABOPEN` records what is OPEN (`abShut(r){ return !ABOPEN[r]; }`), and the reset lives only in shell.js viewLeft. The settings rows for 公開/DL are gone. `world().dl` is still read as the fallback (`wldSecDl` → `wldDl`), and nothing writes `dl`.
- Rule 21: `vAbout` → `wldPage(false[, wldSeenOf(a), a])`. The waiting face is drawn inside wldPage. `wldFrame` returns the bar+body, not the page. `vWorld` → `wldPage(true)`. There is one drawer per route.
- Decision 2026-09-23 (taken languages not in the wiki): `wldRow` and `wldPage` both ask `langTheirs(langId)`. The gap in vWldArt is item 11.
- Load rules: `about` has `pageReads` (`seen` / `lang`). `world`, `wldart`, `find`, `build` and `form` are `lang:1` in PAGES (default read). vAbout, vWorld, vProfile, vFind, vBuild and vLangs make no network calls. The only view-side network is wldGet on the ↓ press, which is allowed ("somebody else's chapter comes down when ↓ is pressed"). WLD_PAGE_KINDS = wld, snd, script, letters is the page's own read.
- No `on*=`, no confirm/alert/prompt, every DO name visible here is in act-map (act-check green today). The send/share corner is not used here. Edit is `navDo(... {icon:ICON_PEN})`.
- `list.map(postRow)` (757) is fine: postRow takes one argument. `ltOrder(drawn).map(function(l, i){ return abLtCell(l, i); })` passes the index on purpose.
- Data: migrateWorld copies only missing keys and leaves `SET.world`. wldNoteMigrate leaves `wld.note`. `wldOrderTo` keeps unknown rows. `hide` and `secs[r].hide` are left untouched. langsSeen cuts the list, not the data.

### Coverage — read in full
- www/home.js 1-2938, every line, in chunks: 1-330, 330-619, 619-1018, 1018-1437, 1437-1736, 1736-2035, 2035-2284, 2284-2593, 2593-2938.
- Functions: capBanner, tocNum, tocRows, chOf, invAll, scriptHave, inScript, scriptOn, wOut, openForm, formArg, vForm, helpNote, helpPara, helpStep, helpMark, helpQ, helpQCut, openHelp, formMount, closeSheet, pkTo, pkKindsHTML, pkList, pkKind, pkKeysWas, pkKeysKeepOn, pkParse, pkPicks, pkNthHTML, pkCharsHTML, pkTake, formAgain, openPick, pkKeepOn, pkKept, pkKeepSave, chTaken, pfSetTab, pfWho, pfMine, pfList, pfTabs, pfStep, pfSwDown, pfSwUp, vProfile, vBuild, vFind, fWordsWithSnd, fWordsWithLtr, fPick, fLtkHTML, fTodo, fHits, fSec, fRow, findBodyHTML, fResultsHTML, fPickedHTML, fRestHTML, findPaint, fSetQ, wldRead, migrateWorld, saveWld, world, wldKeyOv, wldKeyArt, wldNow, wldKeepOn, wldKeepSave, wldTyped, wldSet, wldArts, wldArtMint, wldArtBy, wldArtAdd, wldArtPut, wldArtSet, wldArtKeepOn, wldArtOne, wldArtT, wldArtB, vWldArt, wldPubGot, wldPubKnown, wldPubOf, wldHidden, setWldHide, wldDl, wldSecOf, wldSecDl, wldSecSet, setWldSecDl, wldRow, abShut, abToggle, iconMeter, wldOvs, wldOvMint, wldOvAdd, wldOvPut, wldOvSet, wldOvDel, wldNoteMigrate, wldDragBox/Down/Lift/Move/Up/Off, wldOrderTo, wldGrow, wldRows, wldSecRows, wldSecs, wldSecNm, wldSecNoGo, wldDlKind, wldGetRow, wldTakeOf, wldGet, wldMeterPaint, abSounds, abHead, abField, wldSeenAsk, wldSeenGot, wldSeen, vAbout, abLtCell, abInkMount, wldSliceOf, wldSeenOf, vWorld, wldOpen, wldFrame, wldPage, HELP.wld, HELP.pub, editName, saveName, langRow, langDrop, langSwAt/Shut/Down/Move/Up, langAddRow, langsSeen, langsList, vLangs.
- Cross-read to verify: core.js 1500-1600 (langLocked/langWrites/langHold), 1375-1392 (langSeenAdd), 1457, 1467-1471, 1920-1965 (migrateAll), 2805-2825 (CAN), 3014; shell.js 100-130 (viewLeft/ABOPEN), 540-720 (KEEP), 1122-1182 (PAGES), 1390-1455; sns.js 640-735 (PAGE_READS); backup.js 40-110; import.js 605-617; settings.js 425-437; notes.js 314-320; sound.js 808-811; glyph.js ICON_* lines; en.js strings; FEATURE_RULES.md 684-730, 935-955, 1480-1510, 3108-3135, 4525-4555, 6185-6215; PAID_FEATURES.md 530-545.


---

## Group `grammar` — www/grammar.js

## Audit: GROUP=grammar — www/grammar.js (2694 lines)

Branch read: claude/audit-words @ 126773ba. Read-only; nothing edited, nothing run but grep/sed.
Decisions looked up: FEATURE_RULES.md log 2026-09-23 活用は語にしない; 2026-09-11 節が頁 / 9章＋付録;
2026-09-04 頼まれていないものを書き込まない; 2026-09-10 「文法の各段は最初は何も置かれてない状態」
(quoted in code); 2026-09-06 「まだ書いていない章は薄い字」/ 語順ボード / 「箱でいいよ」 (CHANGELOG 7100);
2026-09-26 全画面の「?」 (r103); 2026-09-24 確認ポップ・取ってきた言語は編集できない; 2026-09-05 選択を戻ったら解除;
plan-lapse entry (自作のステージは隠れる). FM_INF has 24 labels and G2FM_CHAPS covers all 24 today.

### Findings

1. `www/grammar.js:1951` — rule 2 "Every user-facing string goes through t()" + i18n key set must exist in en (CLAUDE.md §2).
   - evidence: `t(i<0? 'g2.ncls.add' : 'form.save')` — `grep -rn "form\.save"` over the whole repo finds only this line; the key is in none of the ten `www/i18n/*.js`. `t()` returns the key itself when both lookups miss (`core.js:2046`), so the rename-a-class form shows the literal `form.save` on its button.
   - fixture face `'a noun class that exists'` (tools/fixture.mjs:2630) renders exactly this form, so i18n-check ought to be red; why it is not was not run (UNCONFIRMED part).
   - class: FIX-HERE — use an existing save key (e.g. the one other forms use) or add `form.save` to all ten files. behaviour/look (text), no data.
   - confidence: CONFIRMED (missing key)

2. `www/grammar.js:1950` — "`.btn` still exists on older screens; it is not to be reached for again" (CLAUDE.md § NO ROUNDED BOX) and "JavaScript may not [style]" (rule 18: zero from www/*.js); a Save/Add button written in the body of a form instead of the bar.
   - evidence: `'<button class="btn" style="width:100%;margin-top:6px"' + DO('nclsSave', [i]) + '>'` — nclsForm was written 2026-09-07/09, after the rule. `margin-top` on it is also the "margin-top to make a group" the rows rule forbids.
   - class: FIX-HERE — hand the Save to the bar via openForm's `right` (`navDo(...)`) or `.btn.ghost` with no inline style. look change (must be shown), no data. (keyboard.js:3952 and onboard.js:2127 carry the same pattern — OTHERS, list only.)
   - confidence: CONFIRMED

3. `www/grammar.js:1478-1495` (gPolOld) + `1431-1432` (gPolPut) — OWNER 2026-09-04 「頼まれていないものを、アプリが書き込まない…触っていない欄は空のまま」 and 2026-09-10 「文法の各段は最初は何も置かれてない状態」.
   - evidence: `at:(gPos('negp')==='before'? 'before' : 'after')` — `gPos()` answers `GPOS_DEF.negp='after'` (line 161) when nobody ever chose a side, so any language holding a not-word gets a NEGATION/VERB rule "after the verb" that nobody made; `gPolPut()` then writes it into `STG.gr` (`if(old){ a.push(old); STG.grm='1'; }`) on the first save of ANY negation/question target. It also makes `g2Said()`/`g2PolRow()` draw the 否定 section as answered.
   - class: FIX-HERE — gate the copy on `gPosSaid('negp')` (the value, as gPosSaid's own comment argues), not on `gPos()`. behaviour; stops a write of STG.gr; no removal.
   - confidence: CONFIRMED (code path); not pressed

4. `www/grammar.js:125` + `100` + `845-846` — same 2026-09-04 decision; 2026-09-06 「最初から主語と動詞とかが入ってるせいでわかりにくい」 (stored vs board split).
   - evidence: `b.save(s? s.split(',') : [])` → `setOrder([])` → `STG.order=orderSeq(v)` and `orderSeq` returns `ORDER_DEF.slice()` for an empty list. A board that had cards, emptied and saved, stores `['S','O','V']` and `stMarkSet('order')` — the app's default written as the language's answer; the board then reopens with 主語 目的語 動詞 placed.
   - class: FIX-HERE — `setOrder` stores `orderKeep(v)` (empty stays empty); `orderSeq()` stays the engine-side fallback only. behaviour; changes what is stored on that press (writes [] instead of SOV). OWNER only if "an emptied board means SOV" is wanted.
   - confidence: CONFIRMED (code)

5. `www/grammar.js:1062-1090, 1096-1105` (G2SEL) — DATA_SAFETY (nothing deleted that the person did not choose) / criterion 9 confirm before delete; `www/shell.js` viewLeft() drops `wSel` and the keyboard's selection on leaving but not `G2SEL`.
   - evidence: `G2SEL` is reset only in `viewReset()` (shell.js:57). Select in chapter A, tick a rule, go back, open chapter B: `g2ChapBar()` sees `G2SEL` and `g2SelList().length`, shows the bin; `g2SelDelGo()` deletes every id in G2SEL from `STG.fm` — rules of chapter A that are not on the screen. The popAsk only says a count.
   - class: FIX-HERE — drop G2SEL when the chapter is left (viewLeft, same shape as `wSel`), or key it by chapter. behaviour; prevents an unseen deletion.
   - confidence: CONFIRMED by reading; not pressed

6. `www/grammar.js:727` (g2Lift) and `1746, 1758-1767` (G2POL) — CLAUDE.md § One place: "Adding a screen that remembers something means adding it there [viewReset()]".
   - evidence: neither is in `viewReset()` (shell.js:33-95). `g2PolOpen()` resets G2POL only `if(G2POL.at!==key)`, so: (a) open language X, write two sentences on `neg:v`, open language Y, go to `neg:v` → X's unsaved sentences are on Y's page and its rule line is computed from them; (b) leave a page answering 「いいえ」, come back → the abandoned sentences reappear, and keepOn takes its mark from them so Save is grey while the screen ≠ what is stored.
   - class: FIX-HERE — reset both in viewReset(), and reset G2POL when the page is left. behaviour, no stored data.
   - confidence: CONFIRMED (code); not pressed

7. `www/grammar.js:125, 144, 191` — CLAUDE.md § Names: "`set*` is reserved for settings: it writes a field of `SET`… ~~setAbVow~~ … is `abSetVow`".
   - evidence: `function setOrder(v){ STG.order=…`, `function setNpOrder(v){ STG.np=…`, `function setGPos(id, v){ … STG.gpos[id]=v …` — all write STG (the language), none touches SET. `setGPos` is also an act name (act-map.js:294).
   - class: FIX-HERE — rename (e.g. `gOrderPut`, `gNpPut`, `gPosPut`), act-map twice, phases.js:501 comment. rename-only commit.
   - confidence: CONFIRMED

8. `www/grammar.js:1117-1129, 2077-2133` (g2Chap, g2PosTarget, g2FmsOf, g2HasFm, g2Add) — rule 5 (nothing that nothing reaches) / § Simple (the old one is deleted).
   - evidence: g2Add returns `''` whenever `c.fms`; the only chapters with `pos` and no `fms` are `n` and `adj`; `g2FmsOf` keeps a label only if `g2Chap({feature:…})===id`, and `g2Chap` returns `'n'` only for `feature==='CASE'` (no GFM_FEAT entry is CASE) and `''` otherwise. So g2Add is always `''` — the comment at 1138-1139 and gramlang-check:1638 both say so. Five functions and FM_INF walk exist to produce nothing; dead-check cannot see it because they are named. The comment 2091-2094 "A form added to the app lands in a chapter the day it is added" is false: a new FM_INF label lands only if someone adds it to the hand-written `G2FM_CHAPS` (UNCONFIRMED whether any check holds FM_INF ⊆ G2FM_CHAPS).
   - class: FIX-HERE — delete the five and `g2Add(c.id)` in g2Page; refactor-only, no look change.
   - confidence: CONFIRMED

9. `www/grammar.js:2690-2691, 2676-2678, 2622` — rule 5 / stale sentence.
   - evidence: `(c.id==='st'? '' : g2ChapEx(c.id))` — no chapter has id `st` (g2Chaps lists order,np,cx,ncls,det,cop,n,8 sections,adj,adp); the comments about 「この言語について」 describe a chapter that no longer exists here.
   - class: FIX-HERE — drop the condition and the two comments. refactor/comment, no look change.
   - confidence: CONFIRMED

10. `www/grammar.js:2596-2624` (g2Said) — OWNER 2026-09-06 「まだ書いていない章は薄い字」.
    - evidence: for `det` and `cop` with no example and no slot filled, none of the branches match and it reaches `return true;` (commented "この言語について counts what this language has and is never empty") — so 冠詞・指示詞 and コピュラ・存在 are never pale on the contents even when nothing is written; `cop`'s own negation/question rows (g2PolAt('n'/'ex')) are not counted either.
    - class: FIX-HERE — end with `return false` (and count cop's polar rules). look change (paleness) — must be shown. no data.
    - confidence: CONFIRMED (code); not photographed

11. `www/grammar.js:1091-1106, 2446-2479` — OWNER 2026-09-26 「？の中に描きまくろう」 (every screen that makes something says how it is used behind its `?`), FEATURE_RULES.md:410.
    - evidence: HELP is registered only for `G2FM_CHAPS` ids (`HELP['g2.'+G2FM_CHAPS[i].id]`), so the pages order, np, cx, ncls, det, cop, n, adj, adp have no `?` (helpQ returns ''). g2ChapBar's comment claims such a chapter "keeps the `?` alone" — false. r103's report listed `g2.*` as already covered, so the owner was never told.
    - class: OWNER (wording of nine help bodies is the owner's) + FIX-HERE for the false comment.
    - confidence: CONFIRMED

12. `www/grammar.js:2452-2467` (g2HelpOf) — home.js:221-232 "Three shapes and every HELP body is built of them" (helpPara/helpStep/helpMark, OWNER 2026-09-26).
    - evidence: `h+='<div class="sec">'+esc(fmLabel(f))+'</div>'; h+='<div class="note">'+…` — hand-built, a second way of writing a help body.
    - class: FIX-HERE — build with helpNote/helpStep. refactor; look should be identical (show it).
    - confidence: CONFIRMED

13. `www/grammar.js:44 (ROLES 'NEG','Q'), 259, 936-943, 1528-1538` — § Simple: "One thing is done by ONE mechanism, and no question is answered in two places."
    - evidence: where the negation word stands is answered by (a) the NEG card on the word-order board (`ROLES` → model.js `NEG:'NEGATION'`, translate.js:219/289/295 `onBoard.NEGATION` wins) and (b) the 否定 rule's `at` (`gNegSide()` → `NEGATION POSITION`). Same for the Q card vs a question rule written with `operation:'word'`. The comment at 936-943 says "Where a word stands is one operation of one rule now". The engine silently prefers the board.
    - class: OWNER — options: take NEG/Q off the board (the rule decides); or make the rule's `at` read from the board; or keep both and say which wins on screen.
    - confidence: CONFIRMED (code)

14. `www/grammar.js:1657-1662` (gPolSayOne) — a screen must not claim what is not so; decision 2026-09-11 (名詞の文・存在 are targets of their own).
    - evidence: `if(op.operation==='prefix') return t('g2.rule.start', esc(posLabel('v')), f);` — always 「動詞の先頭に」 / 「動詞の末尾に」, also for targets `n` (名詞の文), `ex` (存在), where the letters went on a noun or copula. gPolDiff knows the source word (`src[i]`) and could say its part of speech.
    - class: FIX-HERE — pass the part of speech of the word the affix went on. behaviour/look (text).
    - confidence: CONFIRMED (code); not photographed

15. `www/grammar.js:1420-1440, 1842-1845` — criterion 9 「確認ポップにしてください」 OWNER 2026-09-24 (a confirm before a delete).
    - evidence: `g2PolSaveGo` → `gPolRule(...)` returns `null` when the two sentences give no difference → `gPolPut` does `a.splice(i,1)`: pressing Save with emptied or identical lines deletes the target's rule and its `eg` sentences with no question.
    - class: OWNER — options: popAsk before a Save that removes a rule; or Save refuses an empty diff and deletion goes through Select/bin as on every other list.
    - confidence: CONFIRMED (code)

16. `www/grammar.js:2041, 2413` — decision 2026-09-23 「一覧から外す条件は `wIsForm()` 一か所」 and 「派生は今まで通り語として保存する」.
    - evidence: `if(w.pos!=='n' || w.fm) continue;` (g2Ncls) and `if(w.fm) continue;` (g2FmTable) over `wordsSeen()`, which already drops `wIsForm` words — so this second test only removes DERIVED words (group `d`) and orphaned forms. A derived noun (agent, diminutive…) can never be given a class and never appears in a chapter's table. A second answer to "is this a form".
    - class: FIX-HERE — delete the `w.fm` tests (wordsSeen already asked). behaviour; OWNER only if derived words are meant to be excluded. (wordsheet.js fmrTodo has the same `w.fm` test — OTHERS.)
    - confidence: CONFIRMED

17. `www/grammar.js:1906-1922` (nclsOf/nclsPut keyed by headword) — DATA_SAFETY (nothing a person made is lost because of a restructure); rule 14 (the trail/records follow a rename: navRename).
    - evidence: `STG.ncls.of[String(hw)]` — comment: "A word renamed loses its class". Renaming a noun silently drops its class; the old record stays under the old headword and a later word given that spelling inherits it. Nothing in wordsheet.js moves `ncls.of` (grep: no `ncls` outside grammar.js except fmLabel).
    - class: OWNER — options: carry the class across a rename (like navRename); or keep as is and say so.
    - confidence: CONFIRMED

18. `www/grammar.js:2010-2045` (g2Ncls/nclsRow) — banned shape 2 「the thing being chosen and the thing being changed on one screen」 (CLAUDE.md § Shape).
    - evidence: the chapter page lists the classes AND every noun of the dictionary, each noun carrying a row of class chips that write on press (`DO('nclsPut', [w.hw, a[i]])`). Choosing the noun and changing it are one screen, and the list is every noun of the language.
    - class: OWNER — options: a noun opens a page where its class is chosen; or the class page lists its nouns; or keep (「語ごとにどれか」 2026-09-07 did not say where).
    - confidence: CONFIRMED (shape)

19. `www/grammar.js:2565-2568` (g2ChapName) — a name a screen gives must be true (PAGES/pageName one answer).
    - evidence: `return c? c.nm : t('stg.order.t');` while vGram (phases.js:1112-1133) draws the contents for an unknown `v2:` arg (e.g. a bare `v2:neg`, or `v2:p1s` which 2026-09-11 retired and a relaunch can restore) — the bar says 語順 over the contents.
    - class: FIX-HERE — fall back to the name the bare `gram` route has. look (bar title).
    - confidence: CONFIRMED (code); not photographed

20. `www/grammar.js:156-162` (GPOS_DEF cxm/relm) — a comment that claims what is not so; § Deciding (defaults that are judgements are the owner's).
    - evidence: "A MARK OPENS ITS CLAUSE … that is not a guess about anybody's language: all ten of the interface languages do it" — Japanese and Korean put the subordinator at the END of the clause (雨が降る**ので**, 비가 오**니까**), Japanese relative clauses have no mark. The engine arranges every unanswered language by `cxm:'before', relm:'before'`.
    - class: OWNER (which default the engine uses, or none) + FIX-HERE comment-only.
    - confidence: CONFIRMED (the claim is false)

21. `www/grammar.js:469-472, 507, 568-572` (gFmLeftN, m.metadata.fmLeft) — CLAUDE.md § Scope forbids "*we'll need this later*".
    - evidence: "Nothing shows it yet; it is on the model so that the screen which will show it has something to read". Only tools/gramlang-check.mjs:768 reads it. `gFmLeftN` is a module global used only inside `gFmRules()`.
    - class: FIX-HERE — make it a local; OWNER whether rules that could not travel are shown anywhere. refactor.
    - confidence: CONFIRMED

22. `www/grammar.js:72-84, 116-125` (orderKeep on save) — DATA_SAFETY "a migration copies and never removes what it read".
    - evidence: "A card nobody knows is dropped" — a card an up-to-date build wrote (a role added later) read by an older build is dropped from the list, and the next Save writes the list without it.
    - class: OWNER — keep unknown cards through a save, or accept the loss.
    - confidence: UNCONFIRMED (needs two builds with different ROLES; confirm by seeding `STG.order=['S','X','V']` and saving the board)

23. `www/grammar.js:1782-1788` (g2PolLine uses `.gordc`) — CLAUDE.md rule 18: "The plans page's two term buttons are a box, and they are the only thing that is."
    - evidence: `'<button class="gordc"'…` — `.gordc` has `border:1px solid;border-radius:9px` (index.html:3670-3672), allowed in box-baseline for the word-order cards by 「箱でいいよ」 2026-09-06 (CHANGELOG:7100 only). The 否定/疑問 sentence page now wears the same box, widening the exception to a second screen; and CLAUDE.md rule 18 still says plterm is the only box.
    - class: OTHERS (index.html `.gordc`; CLAUDE.md rule 18 sentence) + OWNER (is the 否定 page covered by 「箱でいいよ」).
    - confidence: CONFIRMED

24. `www/grammar.js:125,144,193,757,1086,1435,1918-1920,1964,1987-1994` — OWNER 2026-09-24 「取ってきた言語を編集できるか→できない」; every writer asks langWrites().
    - evidence: each writer mutates `STG` first and only `saveStg()` asks `langWrites()` (phases.js:205). On a taken language the tray, side chips, class chips and the class form are still pressable (only Select is hidden, `!langLocked()` at 1103); a press changes the screen and memory, saves nothing and says nothing.
    - class: OWNER (surface-wide: what a taken language's grammar pages offer) — UNCONFIRMED whether `gram` chapters are reachable on a taken language; confirm by opening one.
    - confidence: UNCONFIRMED

25. `www/grammar.js:826-838` (g2KeepOn snapshot) — stale sentence + vestigial state.
    - evidence: "the rows of TWO under them, which are [written], because g2Move() on one of those is a swap" — g2Board draws no rows of two any more (936-943 says so); `gpos` in the snapshot guards nothing on this page.
    - class: FIX-HERE — comment, and drop `gpos` from the snapshot. refactor.
    - confidence: CONFIRMED

Stale / false comments (CLAUDE.md "a change lands with every sentence it falsifies"; "Fixing means deleting … do not leave the old sentence standing with 'this is history'"). All FIX-HERE, comment-only, no look, no data, CONFIRMED unless noted:

26. `109-111`, `557-562` — "the old stage screen goes on lighting the right one" / "one of the six on the old stage screen": the six-choice screen is gone (line 122 says so); `orderDef().id` is read only by tools (gramlang-check, migrate-check).
27. `195-196` — the "Which side, and of what" comment is written twice; the first copy is the superseded one.
28. `669-671` (gExLine) — "Showing it IN RED … is NOT here -- see the report … which this session does not own": `exLnHTML()` (wordsheet.js:459-468) wraps unknown words in `.exnew` now.
29. `691-704` — a block narrating six deleted functions (gSide, gNeedWords, gPairOf, gPosDemo, gOrderLine, gOrderDemo): history.
30. `718-722` — "the fifteen stages, STG and the six-choice are untouched": the stages became the book and the six-choice is gone.
31. `745-751` (g2Move) — "Two rows arrange two different things -- what order the roles go in, and which side": order is no longer a row.
32. `814-817` — orphan comment above g2Stored says "orderSeq() is what turns it back into the list"; 839-846 says the opposite and splits itself.
33. `936-943` — comment after `return` inside g2Board, narrating a removed row.
34. `979-990` — orphan "§14 Nouns" block with no function under it (the live one is 1130).
35. `1012-1015` — `lab` "the two callers … numerals ❶❷❸" (it is now g2FmSent's sentence) and "gEg above" (gEg is at 1169, below).
36. `1117-1129` — "a form is a CHAPTER now (g2Chaps below)" (a form is a heading in a section since 2026-09-11) and "g2FmRows() above" (it is at 2307).
37. `1130-1141, 1166` — "the three roles the 助詞 stage names -- 主語 / 目的語 / 受け手": seven since 2026-09-07 (GCASE, line 336 "Seven.").
38. `1211-1219` — "[negation/questions] are chapters of a form now, drawn by g2FmChap()": replaced by the two-sentence rule page (g2PolPage, 2026-09-10/11).
39. `1220-1239` — adjectives: "those rules are drawn under the same heading" contradicts 1269-1271; "nobody has to read a label" while g2SidePick draws the labelled pair whenever unanswered.
40. `2047-2059` — "`house-LOC` CANNOT BE WRITTEN … three roles": closed 2026-09-07 (BACKLOG:838 struck).
41. `2070-2075` — "THIS APP CAN WRITE TWO OF THE SEVEN": word, order and combination are written since 2026-09-10 (gPolDiff). docs/BACKLOG.md:803-836 is stale the same way — OTHERS.
42. `2080-2083` — "a verb has eleven of them": the verb sections carry 21 forms.
43. `2569-2583` — orphan: "What it has not got is a count": g2ChapVal (2652) gives `done / n`.
44. `2694` — the file ends on a `---- the screen ----` header with nothing under it (vGram is phases.js).
45. `1484` — `(typeof gSlot==='function')? gSlot(...)` guards a function declared in this same file (line 205): a check that can never be false.

### Counts
- FIX-HERE: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 19, 21, 25, 26-45 → 36 (11 and 20 also carry a FIX-HERE comment half)
- OWNER: 11, 13, 15, 17, 18, 20, 22, 24 → 8 (4, 16, 21, 23 also carry an owner question)
- OTHERS: 23 (index.html `.gordc`, CLAUDE.md rule 18), plus list-only: BACKLOG.md:803-836 (41), keyboard.js:3952 / onboard.js:2127 `.btn` + style (2), wordsheet.js fmrTodo `w.fm` (16)
- UNCONFIRMED: 22, 24 (and the why-not-red half of 1)

### Coverage — read in full
www/grammar.js lines 1-2694, every line, in chunks (1-60, 60-359, 360-689, 690-1018, 1019-1347, 1348-1676, 1677-2015, 2016-2354, 2355-2694).
Functions: orderKeep, orderSeq, orderDef, setOrder, npKeep, npStored, setNpOrder, gPos, gPosSaid, setGPos, gPosLab, gSlot, gSlotAll, gSlotAny, gRule, gRules, gInfl, gFmFeat, gFmForm, gFmDrop, gFmCond, gFmRules, gFmSpecificFirst, gFmPos, gModel, gForms, gUnits, gLay, gExLine, gWordOf, g2Three, g2Move, g2Chip, g2KeepKey, g2Bd, g2Stored, g2KeepOn, g2Seq, g2Set, g2Put, g2Take, g2CardName, g2Card, g2Board, g2Demo, g2NpDemo, g2Row, g2SelOn/Off/List/Tap/Del/DelGo, g2ChapBar, gFmAffix, g2Chap, gEg, g2Nouns, g2Made, g2Side, g2SidePick, g2Adj, g2Sec, g2Det, g2Cop, g2Cx, gPolFeat, gPolTarget, gPolAll, gPolFind, gPolPut, gPolOld, gPolRule, gPolOps, gPolSaidAny, gNegSide, gPolWordAt, gPolStem, gPolWhereAt, gPolRoleOf, gPolOrderOf, gPolDiff, gPolLeftAt, gPolSayOne, gPolSay, gPolOrderSay, g2PolAt, g2PolRow, g2PolChap, gPolEgList, g2PolOpen, g2PolPage, g2PolLine, g2PolTake, g2PolAdd, openPolWord, g2PolPickHTML, g2PolPutW, g2PolOwn, g2PolSaveGo, nclsAll, nclsName, nclsLive, nclsOf, nclsPut, nclsFm, nclsWordIds, nclsIndexOf, nclsNew, nclsOpen, nclsForm, nclsSave, nclsDel, nclsDelGo, nclsRow, g2Ncls, g2Adp, g2PosTarget, g2FmsOf, g2HasFm, g2Add, g2Num, g2MadeBy, g2RulesOf, g2SecRules, g2FmSent, g2FmWhen, g2FmRows, g2FmSlot, g2FmSec, g2Cell, g2FmCols, g2FmMade, g2FmTable, g2FmChap, g2HelpOf, g2HelpReg, g2Chaps, g2ChapBy, g2ChapName, g2Said, g2FmSaid, g2ChapVal, g2ChapRow, g2ChapEx, g2Page; load-time FORM_OPEN/HELP registrations.
Cross-read to verify: shell.js viewReset (33-95), viewLeft (125-170), pageName gram branch (1240-1256); phases.js saveStg (205), stTouched/stMarkSet (508-509), vGram (1100-1133), STG_DEF (60); core.js langLocked/langWrites (1514-1542), wIsForm (3197), t() (2043), SLICES (347); wordsheet.js FM_INF/fmGroup/fmInf/fmLabel (704-728), exLnHTML/exRowHTML (459-477), fmrTodo (940-955); words.js wordsSeen (149-156); home.js HELP/helpQ (215-318); act-map.js names (all DO/KD names in grammar.js registered; g2PolOwn via actKey); index.html .segs/.gordc/.nclsw CSS; tools/box-baseline.txt; docs/BACKLOG.md 803-850; docs/scope/r103-help.md.


---

## Group `wordsheet` — www/wordsheet.js

## Audit — GROUP=wordsheet — www/wordsheet.js (2273 lines)

Read-only audit on branch `claude/audit-words`. Nothing in the repo was edited.
"CONFIRMED" = the code path was read end to end and quoted. None of this was pressed in a
browser or on a phone, so every runtime effect below is CODE CONFIRMED only.

Decisions consulted: CLAUDE.md (whole file); docs/FEATURE_RULES.md Owner decision log:
2026-09-24 「画面・タイムライン・キーボード・保存・お金」(保存を押した時 / 取ってきた言語は編集できない /
単語のつづりの欄は描いた字), 2026-09-23 「活用は語にしない」, 2026-09-04 「保存を押したときだけ、保存されているものが変わる」,
2026-09-03 KEEP + 決定ボタンのルール, 2026-09-04 上限のポップ, 2026-09-05 「通信エラーなら進むわけねえだろ」,
2026-08-28 「赤文字消して」, 2026-09-26 由来/系統図 (CHANGELOG), 2026-09-26 意味のオン・オフ (not about this file: it is
post.js's composer, and nothing in wordsheet.js implements or contradicts it); docs/DATA_MODEL.md § A word;
docs/HIDEFREE.md (「全部一緒」); docs/FEATURES.md § layer 2.

---

### A. Saving, drafts, and what a press writes (the highest-impact group)

1. `www/wordsheet.js:1748-1756` (wdSig) and `2097-2101` (wdTakeFields), `508-511` (wdDelEx), `776-791` (fmPick)
   — **an example added or deleted, or a 語形 chosen, on an EXISTING word's sheet is never saved and nothing asks.**
   - Rule: 2026-09-24 「保存がサーバーに上がる時: 保存を押した時」 plus 2026-09-04 「保存を押したときだけ、保存されているものが変わる」.
     The sheet's own comment at 1742-1747 describes this exact bug for syn/ant/from: "a sheet holding them
     measured as a sheet holding nothing: leaving asked nothing, and what was chosen stayed in memory, unsaved,
     to ride the next save anywhere." It was fixed for those three and not for `ex` or `fm`.
   - Evidence: examples go onto the WORD rather than into wEdit: `w.ex.push({ln:ln, gl:actVal(b).trim()});` (2100),
     `w.ex.splice(i,1); wdStore(); wdPaint();` (510). The 語形 goes onto the word too: `if(f) w.fm=f; else delete w.fm; if(hw) save();` (790-791).
     While the edit sheet is on the trail (`keepOn(keepKeyOf('form','edit:'+openHw)...)`, 1773), `save()` →
     `langWrites()` → `keepDrafting()` is true, so nothing is written. The signature leaves both fields out:
     `JSON.stringify([sp, mns, pos, sub, reg, tags, ety, nt, (w&&w.syn)||[], (w&&w.ant)||[], String((w&&w.from)||'')])`.
     No `ex` and no `fm`. The Save stays grey, back() finds no change and leaves without asking, and the read page
     (drawn from WORDS) shows the example as though it were saved. A relaunch loses it; otherwise it rides the next unrelated save.
   - Class: **FIX-HERE**, behaviour. Rewrite, don't patch: the sheet should be stated once over everything on it,
     either by staging `ex`/`fm` in wEdit like every other field, or by building wdSig from the word's own
     relation fields as a set (`syn, ant, from, fm, ex`). Adding `ex` and `fm` to the list is the minimum. Stored
     data: after the fix these fields are only written when Save is pressed. Look: the Save lights after an example is added or removed.
   - Confidence: CONFIRMED (code path); runtime not pressed.

2. `www/wordsheet.js:2207-2218` (delWordGo) — **deleting a word from its own sheet is not written and not sent, and its save buffer is left behind.**
   - Rule: CLAUDE.md rule 6 / 2026-09-24 (on a screen with no Save the press is the save; a writer goes through
     `langWrites()`/`bkTouch()`); rule 14 (navDrop); DATA_SAFETY (a deletion is a stored change).
   - Evidence: `wDrop(gone); save(); navDrop('edit:'+gone); navDrop('word:'+gone); ...` The delete row only exists
     on the edit sheet (`mk? '' : ...DO('delWord')`, 1705), and that sheet's KEEP buffer is on the trail when `save()`
     runs. So `keepDrafting()` is true, `save()` returns without `slWr` or `bkTouch()`, and nothing sends after
     `navDrop`. The word vanishes from memory and `toast('toast.deleted')` is shown, but the slice and the server
     still hold it until some later save. `KEEP['form|edit:<gone>']` is never `keepDrop`ped. www/letters.js:1191-1193
     says "SAVE BUFFER WITH IT -- the same step delWordGo() takes for a word", which the code does not do. A new word
     later given the same spelling reuses the stale buffer (`keepOn` keeps an existing `was`, shell.js:454).
   - Class: **FIX-HERE**, behaviour. `keepDrop(keepKeyOf('form','edit:'+gone))` and `navDrop` BEFORE `save()`,
     or run the delete through `keepWrite()` the way addOne does. Also consider waiting for `netSaveNow` before
     toasting (see A5). Stored data: the deletion reaches the slice and server on the press. Look: none.
     (The letters.js comment is an OTHERS fix. letters.js:1189-1208 also calls `save()` before `keepDrop`, which looks like the same fault — OTHERS, UNCONFIRMED.)
   - Confidence: CONFIRMED (code path).

3. `www/wordsheet.js:1160-1169` (wfmDelGo) — **deleting a placed form is the same fault.**
   - Evidence: `if(out.length) w.fms=out; else delete w.fms; save(); keepDrop(...); back();`. `save()` runs while
     the form screen's own buffer (`keepOn(keepKeyOf('form', k)...)`, 1112) is on the trail, so it is held as a draft
     and nothing sends. `keepDrop` comes one line too late.
   - Class: **FIX-HERE**, behaviour: `keepDrop` before `save()` (or `keepWrite`). Stored data: the deletion is
     written and sent on the press.
   - Confidence: CONFIRMED (code path).

4. `www/wordsheet.js:562-587` (relNew) — **a second road for adding a word, and it says 「追加しました」 before anything is written.**
   - Rule: addOne's own header (116-160) and OWNER 2026-09-05/09-11 「通信エラーなら進むわけねえだろ全部」「電波なしならクルクル回るやろ」:
     a word is not added until it is up. CLAUDE.md § Simple: one thing, one mechanism.
   - Evidence: `w={hw:nw, mn:mn, mns:(mn?[mn]:[]), pos:addPos, at:Date.now(), sp:sp}; WORDS.push(w); toast(t('toast.added.1', nw));`.
     From the edit sheet's relate page this is held as the edit sheet's draft, so the toast is said over
     nothing written, and 「いいえ」 on that sheet silently removes the "added" word. From anywhere else it
     sends in the background with no wait (bkTouch). This is a third place that builds "what a new word is",
     after addOne (105-115) and fmrWord (970-973), and the three disagree (`pos:addPos` is the last-used part of
     speech, not the host word's).
   - Class: **FIX-HERE**, behaviour. Route it through the same shape as addOne (`keepSnap` → `keepWrite` →
     `netSaveNow`, toast on `up`), and have one builder for a new word record. Stored data: unchanged in shape.
   - Confidence: CONFIRMED (code path).

5. `www/wordsheet.js:2171` (wdWrite) — **the Save says 「{0} を更新しました」 before the server has answered.**
   - Rule: keepSave's own contract (shell.js:680-700, 「保存ボタン押して保存ができるかできないかは通信の有無だけ」 OWNER
     2026-09-05); CLAUDE rule 11 「保存して黙るのはだめ」, and saying "saved" over a failure is the same fault turned round.
   - Evidence: `save(); render(); toast(t('toast.saved', hw)); return true;`. This runs inside `b.save(...)`,
     BEFORE `netSaveNow` (shell.js keepSave). If the send fails, keepBack() puts the word back and netPop() comes up,
     but 「更新しました」 has already been said. addOne gets this right (toast inside the `up` callback, 178).
   - Class: **FIX-HERE**, behaviour. Pass a `landed` callback to `keepOn` in wdKeepOn (1773) and toast there. Look: the toast only appears on success.
   - Confidence: CONFIRMED.

6. `www/wordsheet.js:2160-2171` (wdWrite rename) — **rule 14: a Save that renames a word and does not land leaves the trail on a name that no longer exists.**
   - Rule: CLAUDE.md rule 14 (the trail follows a rename; landing on "That is no longer here" is the bug).
   - Evidence: `if(hw!==old){ wRename(old, hw); openHw=hw; }` runs inside the save, before the send. wRename
     (letters.js:1538-1540) moves NAV to `edit:<new>`/`word:<new>`/`ety`. On failure keepBack() restores the
     globals (`langHeldBack`) so the word is `old` again, but `NAV` and `openHw` stay on `new`. The next render asks
     `FORM_OPEN.edit(new)`, `findWord(new)` is null, and you get viewGone. word-check only drives the landed road.
   - Class: **FIX-HERE**, behaviour (move the trail/openHw half of the rename into the landed callback, or keep
     it in the snapshot). OTHERS as well if the fix goes into keepSnap/keepBack in shell.js.
   - Confidence: CONFIRMED (code path); runtime not pressed.

7. `www/wordsheet.js:1345-1377` (fmrKeepOn / fmrKeep) — **one screen, two ways of saving: a NEW rule waits for Save, an EXISTING rule is written and sent on every keystroke.**
   - Rule: 2026-09-24 「保存がサーバーに上がる時: 保存を押した時」; 2026-09-04 「打つそばから書き込む画面には、人が『これでいい』と決めた瞬間がありません」;
     CLAUDE § Simple (one mechanism). The comment at 1345-1347 argues the opposite: "putting it behind a Save would be changing a screen nobody asked to have changed".
   - Evidence: `if(r===fmrDraft) fmrKeepTouch(); else saveStg();`. `saveStg()` → `bkTouch()` → `netSaveNow()` on every
     `fmrSetAdd` input event, unless a Save screen happens to be on the trail behind it (the grammar section
     page has its own keepOn at grammar.js:825/1764; whether that is on the trail when a rule row is opened was not measured).
   - Class: **OWNER**. Options: (a) the existing rule's sheet gets the same Save as a new one (fmrKeepOn without
     the `fmrDraft` guard; the per-keystroke write is deleted); (b) keep it as it is and fix the rule text to name this
     screen as an exception. Either way, the comment at 1345-1347 has to go.
   - Confidence: CONFIRMED that the code does it; UNCONFIRMED whether a grammar buffer is on the trail at the time.

8. `www/wordsheet.js:2106-2112` (wdDerive) — **「派生語の作成」 with unsaved edits on the sheet throws those edits away.**
   - Evidence: `closeSheet(); openAdd(w.hw);`. closeSheet → back() → navLand → `keepAsked()` puts 「保存しますか」 up
     and stays (shell.js:245). openAdd then runs anyway: `openForm` folds the popup away, and the fresh draft
     overwrites `wEdit` (72-73), which was the parent sheet's typed state. Going back to the parent sheet rebuilds
     wEdit out of the word (openEdit), so what was typed is lost and nobody was asked.
   - Rule: 2026-09-03 KEEP (leaving a typed screen asks; 「いいえ」 is the only way typed work is dropped).
   - Class: **FIX-HERE**, behaviour. wdDerive should do nothing more when back() did not leave, e.g. open the
     add sheet only when `here()` is no longer `edit:<hw>`, or ask first.
   - Confidence: UNCONFIRMED (code path read; not pressed). Pressing Derive on a sheet with a typed change confirms it.

9. `www/wordsheet.js:44-77` (openAdd) — **the draft is reset before the ceiling is asked.**
   - Rule: the function's own first comment: "Asked before the sheet opens, so nobody types a word into a form
     that is going to refuse it". 2026-09-04 上限のポップ: "後ろは何も変わらない".
   - Evidence: `if(fresh){ ... addW={...}; wEdit={...}; addFmClear(); ... }` then `if(capStop(1)) return;` (77).
     A refused open has already replaced `wEdit`/`addW` under whatever screen is standing there. From the
     derive road that is the parent sheet's wEdit (item 8).
   - Class: **FIX-HERE**, behaviour: move `capStop(1)` above the `fresh` block (next to `makeNeed()`). No stored data.
   - Confidence: CONFIRMED.

10. `www/wordsheet.js:2130` (wdPutExtras) — **Save deletes a `fm` that is not on the screen.**
    - Rule: 2026-09-04 「保存を押したときだけ、保存されているものが変わる」, whose worked example is this same function's
      old `delete w.ph` ("画面に出ていない発音が消える ── バグ"); CLAUDE § Data (nothing removed because the current shape
      does not need it; deletion gets a DELETE REVIEW).
    - Evidence: `if(!w.from) delete w.fm;`. The 語形 row is only drawn when there is a parent (`(wdFrom()? wdFmHTML() : '')`,
      1665), so a word that carries `fm` with no `from` has nothing on screen for it. Such words exist: wDrop deleted
      children's `from` until 2026-09-26 (CHANGELOG 2026-09-26, "今までに消された `from` は戻らない"). Pressing Save
      to change only a meaning on one of them erases its `fm`.
    - Class: **OWNER** (it is a deletion), recommended FIX-HERE: delete that line. `fm` is written and taken off
      only where it is chosen (fmPick), which is what the comment at 2127 already claims. DATA_MODEL.md:681
      ("`wdPutExtras()` deletes it when the parent goes") is stale either way, because the parent going no longer
      touches `from` (OTHERS: docs).
    - Confidence: CONFIRMED.

### B. Owner decisions not implemented / implemented differently

11. `www/wordsheet.js:2010-2012` (openWord), `1085-1089` (wfmSecHTML), `999-1005` (fmrTodoHTML), `1705` (delete row) — **someone else's (taken) language still offers Edit, +, "make forms" and Delete.**
    - Rule: 2026-09-24 「ほかの人から取ってきた言語: 編集できない」. notes.js:78-86 shows the shape the app uses:
      `langLocked()? '' : navDo(t('wld.edit'), ...)` ("AND NOTHING TO PRESS IN SOMEBODY ELSE'S LANGUAGE").
    - Evidence: `helpQ('word')+navDo(t('word.edit'), 'openEdit', [w.hw], true, {icon:ICON_PEN})` with no lock check.
      On a locked language delWordGo runs `wDrop` on WORDS in memory, `save()` answers `saveNo()`, and
      `toast('toast.deleted')` still follows. fmrAdd pushes words into memory the same way. Nothing reaches
      storage (langWrites), but the screen offers editing and then contradicts itself.
    - Class: **FIX-HERE**, behaviour + look: `langLocked()? '' :` on the pen, the forms +, the fmrTodo button,
      and a guard in openEdit/openWfm/fmrAdd. No stored data.
    - Confidence: CONFIRMED.

12. `www/wordsheet.js:1651` — **the reading row is hidden on free rather than shown and sent to the plans.**
    - Rule: 「全部一緒 / 有料から無料も同じ画面でタップしたら有料に行くように」 OWNER 2026-09-04 (docs/HIDEFREE.md head;
      CLAUDE § What the free plan is: "the same screen on every plan ... pressing it goes to the plans").
    - Evidence: `(can('snd')? wdSeqHTML() : '')+`.
    - Class: **FIX-HERE**, behaviour + look: always draw the row, and on press ask `upStop(can('snd'))`
      (a small handler in place of the bare `DO('go',["spell"])`). No stored data. Screenshot needed on free and on paid.
    - Confidence: CONFIRMED.

13. `www/wordsheet.js:537-541` (vRelate) — **text written inside the boxes, which the owner asked to have removed.**
    - Rule: 「四角のなかにつづりとか読みとか書くの消して」 (quoted in this same file at 1588 and letters.js:1422;
      CHANGELOG 22378 "Nothing is written inside the boxes").
    - Evidence: `spTypeField('rel-hw', ' autocapitalize="none"', [], '', t('f.spelling'))` puts the placeholder 「つづり」 in the box.
      `lnField('rel-mn', t('f.meaning.ph'), '', '')` puts 「星」 there, an example answer.
      Neither box has an aria-label. The example box does the same (`lnField('wd-exl', exHint(), ...)`, 495; comment
      425-427), and 1585-1587 in this file calls exactly that "the app filling somebody's answer in for them".
    - Class: **FIX-HERE** for rel-hw/rel-mn (move the text to aria-label, placeholder ''). Look change, screenshot needed.
      **OWNER** for `exHint()` on the example box: the file argues both ways, 425-427 for it and 1585-1587 against.
    - Confidence: CONFIRMED.

14. `www/wordsheet.js:454-466` (exLnHTML) — **the `.exnew` span and its comment rest on a decision that is not in the docs, and red was abolished.**
    - Rule: 2026-08-28 「赤文字消して」 / 「辞書に意味の無い語を赤で出すのは無い … 赤そのものが消える」. The comment
      cites docs/FEATURES.md for "is shown IN RED", and FEATURES.md:207-208 no longer says red (only BACKLOG.md:2289 quotes it).
    - Evidence: `else out.push('<span class="exnew">'+sfontHTML(w)+'</span>');`. `grep exnew www/index.html` finds nothing,
      so the class is worn and styled by nothing. The comment says "Until it lands this changes nothing anybody can see".
    - Class: **OWNER**. (a) Red on examples is dead with the 08-28 decision: delete the span and the comment.
      (b) The owner wants examples marked: then the CSS is OTHERS (www/index.html `.exnew`) and FEATURES.md needs the sentence back.
    - Confidence: CONFIRMED.

15. `www/wordsheet.js:1955` and `552` — **"no meaning" is answered two ways, and one of them reads as an instruction.**
    - Rule: CLAUDE § Explaining (a screen does not tell somebody what to tap); § Simple (one answer per question).
    - Evidence: the read page prints `'<div class="note">'+esc(t('words.addmn'))+'</div>'` = 「意味の追加」 as
      unpressable text. The relate picker row prints `wMns(x)[0]||t('words.addmn')`, and pressing that row toggles a
      relation rather than adding a meaning. The family rows use `t('sent.nomean')` = 「意味なし」, which is a state.
      The read page also contradicts its own header comment (1817-1819: "Nothing empty is drawn").
    - Class: **FIX-HERE**, look: use `sent.nomean` in both places, or draw nothing on the read page. Screenshot needed.
    - Confidence: CONFIRMED.

16. `www/wordsheet.js:90, 568, 570, 798, 2146` — **the message says "2 letters or more" and the code accepts one; the same message answers an empty label.**
    - Evidence: `toast.hw2` = 「つづりは2文字以上必要です」. The guard is `if(!sp.length || !hw)`, so a one-letter word is
      accepted. fmNew (798) says it about an empty LABEL, which is not a spelling at all.
    - Class: **OWNER** (wording and the threshold are the owner's): either the minimum is one letter and the text
      changes, or it is two and the guards change. fmNew needs a message of its own either way.
    - Confidence: CONFIRMED.

17. `www/wordsheet.js:1661` — **a group made with `margin-top`, set as an inline style from JS.**
    - Rule: CLAUDE § Rows in one list are one height: "No `margin-top` on a row to make a group either … a group is made by a row that separates (`.grpsep`)".
    - Evidence: `'<div style="margin-top:22px">'+ wdPickRow(...)+wdSubHTML()+...+'</div>'`.
    - Class: **FIX-HERE**, look: `'<div class="grpsep"></div>'` before the rows, and no inline style. Screenshot needed.
    - Confidence: CONFIRMED.

18. Inline layout styles from JS elsewhere in the file:
    - `542` `style="width:100%;margin:8px 0 18px"`
    - `831` `style="margin-left:auto"`
    - `840` `style="margin-top:8px"`
    - `1922` `style="margin:0 0 0 auto"`
    - `2240` etyPad `padding-left`
    - Rule: rule 18 makes JS zero-tolerance only for box styles (border/radius), and none of these are that. They
      are still layout that no stylesheet can see, and 840 is a margin-top grouping a field under a list.
    - Class: **OWNER**/low. They are not a rule breach as written; whether "no style from JS" is wanted is the
      owner's. If yes, OTHERS: classes in www/index.html.
    - Confidence: CONFIRMED (the code); UNCONFIRMED (that it is a breach).

### C. One mechanism / values vs pointers

19. `www/wordsheet.js:589-590, 2184-2188` vs www/letters.js:1528 — **`from` is called a value in this file, and a rename rewrites it like a pointer.**
    - Rule: CLAUDE § The past; CHANGELOG 2026-09-26 "由来はつづりという値なので". The comment on wDrop says
      "`wRename` … is the same set of pointers read the other way round".
    - Evidence: `if(WORDS[i].from===old) WORDS[i].from=hw;` (letters.js wRename). wDrop leaves `from` alone
      because it is a value; wRename rewrites it as a reference. The two comments can't both be true.
    - Class: **OWNER** (does a child's `from` follow the parent's rename?). The fix lives in letters.js (OTHERS)
      and in the comments at 589-590/2181-2188 (FIX-HERE, comment-only).
    - Confidence: CONFIRMED.

20. `www/wordsheet.js:375-385` (wRelRename) — **a rename rewrites the text of every example sentence, and matches case differently from how the word is found.**
    - Evidence: `e.ln=String(e.ln||'').split(/\s+/).map(function(y){ return y===old? hw : y; }).join(' ');`. The
      match is case-sensitive, while `findWord` (183) and `exLnHTML`/`exSeq` are not. It also collapses the author's
      whitespace (`split(/\s+/)…join(' ')`), although exLnHTML's comment says "The gaps between them are kept exactly as they were typed".
    - Class: **OWNER** (should renaming a word rewrite sentences somebody typed?). If yes, FIX-HERE: rewrite
      tokens with the same case rule as findWord and keep the separators.
    - Confidence: CONFIRMED.

21. phases.js:540-565 (openSlot) vs `www/wordsheet.js:56-76` (openAdd) — **the new-word draft is built in two places.**
    - Rule: CLAUDE § Simple.
    - Evidence: openSlot writes its own `addW={hw:'', mns:[], pos:p.pos, syn:[], ant:[], ex:[]}` and
      `wEdit={seq:[], sp:[], mns:[...], pos:p.pos, reg:'', tags:[], ety:'', nt:''}`. There is no `sub`, and no `makeNeed()`.
    - Class: **OTHERS** (phases.js). One draft builder here would serve both.
    - Confidence: CONFIRMED.

22. `www/wordsheet.js` state not forgotten by viewReset (shell.js:33-93).
    - Rule: CLAUDE § One place: "Adding a screen that remembers something means adding it there".
    - Evidence: `fmNewG` (834, whether the own-label box is open) is set by `fmOpen` and never cleared anywhere
      (grep: 3 mentions). `fmrDraft`, `fmrOpen`, `addW`, `wEdit`, `addFms/addFmEd/addFmOff` and `addSlot` are not
      in viewReset either. A draft rule of one language can be saved into another language after `langOpen()`:
      `fmrById` still returns the draft, and fmrDraftWrite pushes it into the new `STG`.
    - Class: **FIX-HERE**/OTHERS (shell.js viewReset: add `fmNewG=''; fmrDraft=null;` and the rest). No stored data.
    - Confidence: CONFIRMED that they are not reset; the cross-language save is UNCONFIRMED.

### D. Marks, labels, touch

23. `www/wordsheet.js:317, 491` — **deleting a meaning or an example uses the ✕ (close) mark, not the bin.**
    - Rule: CLAUDE § A sixth: "delete is the bin … close … the marks every phone already draws". `word.ex.del` is 「例文の削除」.
    - Evidence: `DO('wdDelMn', [i]) ... ICON_CROSS`, `exBtn('wdDelEx', [i], 'word.ex.del', ICON_CROSS)`. The same convention is used across the app (post.js, keyboard.js, phases.js:730).
    - Class: **OWNER** (is taking an item off a list being assembled "delete" (bin) or "remove" (✕)? The answer is app-wide).
    - Confidence: CONFIRMED.

24. `www/wordsheet.js:1129-1130` — **「この活用を削除」 is a `.btn ghost` mid-screen, while 「単語の削除」 is the `.set end` + `.bad` row last on the page after a `.grpsep`.**
    - Rule: 「一番下がデリートになるように」 OWNER 2026-09-01 (quoted 1696-1698); § Simple, one shape for one thing.
    - Class: **FIX-HERE**, look: reuse the word sheet's delete row shape. Screenshot needed.
    - Confidence: CONFIRMED.

25. `www/wordsheet.js:1087` and `838` — **the + buttons' aria-labels are nouns, not the operation.**
    - Evidence: `secAdd(esc(t('word.fm.inf')), DO('openWfm',...), t('word.fm.inf'))` makes the + read 「活用」.
      `secAdd(..., DO('fmOpen',[g]), t('word.fm.own'))` makes it read 「自分のラベル」. The other secAdds use `word.mn.add` 「追加」.
    - Rule: CLAUDE § A sixth: "with the word on the button as its aria-label".
    - Class: **FIX-HERE**, no look change.
    - Confidence: CONFIRMED.

26. `www/wordsheet.js:1546-1548` (subAddRow) and `622-623` (wdDerive button) — **an add is written in words.**
    - Evidence: `ICON_ADD+esc(t('f.sub.new'))` = "+ 新しく作る" (the owner's quote at 1531 is 「追加は+〇にして」).
      `t('word.derive')` = 「派生語の作成」, words only. marks-check passes because these are not one bare verb.
    - Class: **OWNER** (the rule allows "a label that is more than the verb"; whether these are is a judgement).
    - Confidence: CONFIRMED (the code); UNCONFIRMED (that it is a breach).

### E. Stale / false comments (comment-only, FIX-HERE unless noted)

27. `10-19` — "They are out until Studio is". Studio was deleted (CLAUDE.md: `['free','plus','studio']` became `['free','plus']` "when Studio was deleted"), and the comment sits over no code. Delete it. CONFIRMED.
28. `186-189` — "The syllables, from the sounds…" is a dangling comment with no code under it. Delete it. CONFIRMED.
29. `202-213` — "Tap a letter in the row…", "The keyboard is letters when the language has any, and sounds…", and "typed on free, pressed on the paid plan, and the row of letters under it either way". The row, the tiles and the sound keyboard are gone (1636-1650 says so). Rewrite to say what is there now. CONFIRMED.
30. `1647-1650` — "a paid plan sees the word as its letters, and pressing one opens that letter's sound in this word". wdSeqHTML is one row going to `spell` (246-248). CONFIRMED.
31. `1652-1653` — "Only where a word is being coined. Asking for a spelling to be made up…" is dangling. The spelling suggester it described is gone. Delete it. CONFIRMED.
32. `2028-2030` — "A sound pressed on the sound keyboard is a step…" over wdSync. There is no sound keyboard. CONFIRMED.
33. `1967-1972` — two comments in a row that contradict each other ("the second only when it is a different day" vs "Both, always"). Delete the first. CONFIRMED.
34. `328-330` ("All three are edited on the word and saved as they are made … facts about the word rather than a draft of it") and `772-775` (fmPick, "Written onto the word as it is chosen … not a draft of it"). Since 2026-09-24 both are held as the sheet's draft until Save (keepDrafting). The comments describe the pre-09-24 behaviour. CONFIRMED.
35. `370`, `399-402` and `1823-1828` call the relation rows "chips … a box is a thing you take back off". `.rel` is a full-width row now (index.html:1614-1615, `display:block;width:100%`, border-top only). CONFIRMED.
36. `65-68` — "The draft holds only what a relation and an example need a WORD for", but `addW` also carries `mns:[]` and `pos:addPos`, which nothing reads off the draft (wEdit holds both). Either drop the two fields or the claim. CONFIRMED (low).
37. `425-427` — the placeholder comment sits above `exBtn`, 50 lines away from `exHint()` (478), which it is about. CONFIRMED (low).
38. `2181-2182` — "`wRename` … is the same set of pointers read the other way round; this is the one place they are cut". Not true for `from` (item 19). CONFIRMED.
39. DATA_MODEL.md:666-668 — "`wdPutExtras()` … is the one place that writes `nt/ety/reg/fm/tags/up`". `fm` is written by fmPick (790), addOne (111) and fmrWord (971), and wdPutExtras only deletes it. **OTHERS** (docs). CONFIRMED.

### F. Smaller UI / code facts

40. `215-230` (wdSetLn) — typing repaints the IPA line (`#wd-rd`) but not the syllable line `.wsub2` (1633-1634), nor the reading row's value (wdSeqHTML). Those two show the old word until the next repaint. **FIX-HERE**, look. CONFIRMED by reading (not pressed).
41. `637` (wdMount), `2011` — `phkMount(); geTiles();` mount `canvas.pkc` / `canvas.tc`. Since the tiles came off the sheet, no markup the sheet or read page builds appears to contain either class. These may be no-op leftovers. **UNCONFIRMED**: a render of both screens counting `canvas.pkc, canvas.tc` would settle it.
42. Names (CLAUDE § Names). `subList/subNew/subNewOpen/subAddRow/subPick`, `posPick`, `regPick/regLabel`, `relDirty/relNew`, `ex*`, `tagCut` and `spAdd` carry prefixes that are not the word sheet's (`wd*`/`w*`). `tag*` is sns.js's post-tag family, and `sp*` is letters.js's spelling family. `wWhen` is a date formatter under the word-data prefix. None is a `set*` misuse. **OWNER**/low (a rename rides alone per CLAUDE § Refactoring). CONFIRMED (the names); whether they "lie" is a judgement.

### Checked and found clean
- ES5: nothing banned seen (es5-check green).
- `on*=`: none. Every DO/IN/KD name in the file is registered in www/act-map.js (script-checked: 0 missing).
- confirm()/alert()/prompt(): none. Deletes ask through popAsk (1158, 2205).
- `has()`: none. Plans only via `can('snd')` and `capStop()`.
- Views (vSpell, vRelate, vFm, vPos, vSub, vReg, vEty) read nothing from the network. Their routes are `lang:1` in PAGES, so navLand reads the language on arrival.
- No function in the file is declared and unreferenced (grep count >1 for every one).
- Every visible string goes through t(). aria-labels are through t().
- The Add in the corner is `navDo(..., {icon:ICON_ADD2})`, Edit is ICON_PEN, and share is ICON_SHARE (on the letter-line, not in the bar corner; the rule's corner clause is about a screen's send/share, and this is a per-word card door).

### Coverage — read in full
www/wordsheet.js lines 1-2273, every line, in chunks 1-300, 300-700, 700-1100, 1100-1500, 1500-1900 and 1900-2273.
Functions: openAdd, addOne, findWord, wdTypeHTML, wdSetLn, wdSeqHTML, spAdd, vSpell, wdOpenMore, wdMnOpen, wdExOpen,
wdMnShow, wdExShow, wdMnsHTML, wRel, wRelWords, relDirty, wRelToggle, wRelOff, wRelRename, wdW, wdStore, wdRelHTML,
exSeq, exGloss, exBtn, exLnHTML, exRowHTML, exHint, wdExHTML, wdAddEx, wdDelEx, vRelate, relNew, wFromSet, wDescends,
wdNoteHTML, wdKidsHTML, wdMount, wdPaint, regLabel, fmOwn, fmGroup, fmInf, fmLabel, fmRank, fmMine, wdFrom, wdFmHTML,
fmPick, fmNew, fmSay, fmQ, fmRowHTML, fmOpen, fmGroupHTML, fmRules, fmrById, fmrStem, fmrEndsWith, fmrFits, fmrMake,
fmrTodo, fmrWord, fmrAdd, fmrTodoHTML, wForms, wFormOf, wfmRowHTML, wfmListHTML, wfmSecHTML, wfmKey, wfmArg, openWfm,
wfmFormHTML, wfmSetF, wfmSave, wfmDel, wfmDelGo, addFmClear, addFmDraft, addFmSync, addFmBoxHTML, addFmPaint,
addFmHTML, addFmSet, addFmDrop, addFmWrite, fmrNew, fmrSegs, fmrFormHTML, fmrPaint, openFmr, fmrSig, fmrKeepOn,
fmrKeepTouch, fmrDraftWrite, fmrKeep, fmrSetAdd, fmrSetAt, vFm, tagCut, wWhen, wdFromRowHTML, wdPickRow, wdRegHTML,
wdOneHTML, vPos, posPick, wdSubHTML, subList, subNewOpen, subAddRow, vSub, subPick, subNew, vReg, regPick, wdTagsHTML,
wdEtyHTML, wdSetReg, wdSetTags, wdSetEty, wdFormHTML, wdAddOn, wdSaveBtn, wdSig, wdSigEdit, wdNow, wdKeepOn,
wdKeepTouch, wdSecHTML, wdRelsHTML, wdFamSort, wdGoneRowHTML, wdRowHTML, wdFamOf, wdFamGroupHTML, wdFamHTML,
wdRdShown, wdViewHTML, HELP.word/ety/spell/rel, openWord, openEdit, wdSync, wdSetNt, wdSetPos, wdSetSub, wdSetRd,
wdTakeFields, wdAddMn, wdDelMn, wdDerive, wdPutExtras, wdWrite, wDrop, delWord, delWordGo, etyKids, etyDoorHTML,
etyPad, etyRowHTML, vEty.
Cross-read to verify: www/shell.js 33-93 (viewReset), 245 (navLand), 302-335, 452-484 (keepOn), 530-720 (KEEP/keepWrite/
keepDrafting/keepSnap/keepBack/keepSave), 932-980 (back/navRename/navDrop), 1118-1160 (PAGES), 1298-1301, 1505-1510;
www/core.js 1525-1575 (langWrites/langHeldBack), 1985-2002 (save), 2855-2885 (can), 2946-2996 (capStop/upStop);
www/backup.js 40-64 (bkTouch); www/phases.js 205, 540-565; www/letters.js 1180-1215, 1524-1552; www/grammar.js 815-835,
1755-1772, 2305-2318; www/notes.js 70-90; www/onboard.js 1228-1240; www/sns.js 688-775; www/act-map.js;
www/i18n/ja.js + en.js keys used by the file; www/index.html .rels/.rel/.pick/.mnx/.grpsep/.wsub2 (and the absence of .exnew).


---

## Group `sheetshare` — www/sheet.js, www/share.js

## Audit — GROUP=sheetshare (www/sheet.js, www/share.js)

Branch claude/audit-words @ 126773ba. Read-only; nothing in the repo was edited. Nothing was pressed on a
device; "CONFIRMED" below means confirmed by reading the code (quoted), not by running it.

### www/sheet.js

1. `www/sheet.js:14-15` — stale comment. CLAUDE.md: 「a change lands with every sentence it falsifies」.
   - evidence: header says `The name is also printed faintly INSIDE its box, so a person can see what each box is for.`
     while `shPageOps()` (lines 181-190) says `The name goes OVER the box and nowhere else. ... The box stays empty.`
     and lines 40-43 say the dots `replaced printing the name faintly inside the box`.
   - class: FIX-HERE — delete the two header sentences (comment-only; no data, no look).
   - confidence: CONFIRMED

2. `www/sheet.js:228` + `:248` — dead residue of the removed faint in-box name (rule 5 spirit: nothing that nothing reaches; CLAUDE.md § Simple: the old one is deleted).
   - evidence: `var gid = add('<< /Type /ExtGState /ca 0.14 >>');     /* the faint guide */` and every page's resources carry `/ExtGState << /G1 ' + gid + ' 0 R >>`, but `shPageOps()` never emits `/G1 gs` (grep: no `gs` operator in the file). The "faint guide" it served is the in-box name that was taken out.
   - class: FIX-HERE — remove the ExtGState object and the `/ExtGState` resource entry (behaviour of the PDF bytes only: object numbers shift; nothing stored, nothing visible changes). Check `tools/sheet-check.mjs` does not assert the object count first.
   - confidence: CONFIRMED

3. `www/sheet.js:194-196` — stale comment pointing at an assertion that is no longer in the file.
   - evidence: `There is an assertion below rather than a comment saying to be careful.` — the assertion was `shSane`, which lines 580-594 say is gone and `held by tools/sheet-check.mjs now`.
   - class: FIX-HERE — change "below" to name `tools/sheet-check.mjs` (comment-only).
   - confidence: CONFIRMED

4. `www/sheet.js:447-449` (+ `:442`) — comment names a parameter that does not exist; unused local.
   - evidence: comment `\`drop\` is the yes/no mask of what to KEEP` but the signature is `function shEdge(f, res, keep)`; `var n = res, i, x, y, g = [], seg = [], at = {}, id;` — `id` is never used in `shEdge`.
   - class: FIX-HERE — `drop` → `keep`, drop `id` from the var list (comment/refactor-only; no behaviour).
   - confidence: CONFIRMED

5. `www/sheet.js:838-841` — comment claims a reset that does not exist (CLAUDE.md § One place: `viewReset()` "Adding a screen that remembers something means adding it there").
   - evidence: `var SH = null; ... it is where you are in it, so shell.js's viewReset() drops it, exactly as it drops IMP.` — `viewReset()` (`www/shell.js:33-95`) resets `IMP=impBlank();` but has no `SH` line; grep finds `SH`/`shBlank` referenced nowhere outside sheet.js. So a sheet read (`SH.got`) and typed names survive opening another language and a sign-out/another account in the same run; pressing 取り込む then puts language A's reading into language B.
   - class: OTHERS (www/shell.js `viewReset()`: add `SH=null;` beside `IMP=impBlank();`) — behaviour change, in-memory only, no stored data. If shell.js is not to be touched, the comment in sheet.js must stop claiming it (comment-only).
   - confidence: CONFIRMED (read); not pressed.

6. `www/sheet.js:1488-1534` `shTakeIn()` — writes letters into a language that may not be written (OWNER 2026-09-24 「取ってきた言語を編集できるか →『できない』」; CLAUDE.md rule 22 / core.js `langWrites()`).
   - evidence: `shTakeIn` asks only `if(upStop(can('file'))) return;` then `ltNew({nm:g.nm, sh:g.sh, via:'write'})` / `inkSet(d, g.sh); d.via = 'write'; saveLetters();`. `ltNew` does `LETTERS.push(l); saveLetters();` and `saveLetters(){ if(!langWrites()) return; ...}` — so in a taken (langLocked) language the letters are pushed into memory, the save silently does nothing, `toast(tn('wr.took', n))` says N were taken and `go('ltset','alpha')` shows them; they are gone on next launch. `www/letters.js:1235-1241` documents this exact bug for another road and refuses with `if(langLocked()) return null;`. The door (`www/sound.js:865` `DO('openWrite')`) is drawn with no `langLocked()` condition. `tools/dl-check.mjs` has no reference to `shTakeIn`/`SH.got`, so no walk reaches the Take button in a taken language.
   - class: OTHERS for the cover (the one statement is "a letter is not made in a language that may not be written" — belongs in `ltNew()`/`inkSet()` in www/letters.js / glyph.js, which would also remove the plug at letters.js:1241), plus FIX-HERE only if the leader decides the sheet door itself is hidden in a taken language (not a session's call: § Deciding). Behaviour; no stored data changes (nothing reaches the server today either).
   - confidence: CONFIRMED by reading; not pressed on a device.

7. `www/sheet.js:1107-1204` `shMake()` / `openWrOut()` — making a sheet asks no plan, while the docs put the whole chapter on Pro.
   - evidence: `shMake(){ var s = shState(), names = ...; if(!names.length){...} pdf = shSheet(...)` — no `can()`. docs/PAID_FEATURES.md:452 `file | pro | ... **and the sheet** (ch 26)`; :469 `That puts chapter 26 on Pro, which is OWNER DECISION 2026-08-23`; :543 `CSV, file import, the sheet | gone, as they always were on free | can() on the press`. FEATURES.md: `OWNER DECISION 2026-08-23. **Pro** only ... The app hands out a PDF, somebody draws on it, and hands it back`. Only the read side (`fileInHTML`, `shTakeIn`) is gated. The sheet.js comment at 848-849 even says `this is Pro, and Pro is where a letter may be added at all` about the MAKE page.
   - class: OWNER — the free/paid boundary. Options: (a) gate the make press too: `if(upStop(can('file'))) return;` at the head of `shMake()` (screen stays the same on every plan, per 「全部一緒」); (b) keep making free and only taking-in Pro — then PAID_FEATURES.md:543 and the comment at sheet.js:848 must say so.
   - confidence: CONFIRMED (code); the intended reading is the owner's.

8. `www/sheet.js:1182-1185` `shFileName()` — a user-visible string not through `t()` (CLAUDE.md rule 2), and a non-Latin language name vanishes.
   - evidence: `var n = String(langName || '').replace(/[^\w \-]/g, '')...; return (n ? n.slice(0, 40) + ' ' : '') + 'sheet';` — the file name is what iOS's share sheet and Files show. `'sheet'` is English in all ten UI languages, and `[^\w \-]` deletes every non-ASCII character, so a language named 日本語/Ελληνικά gives a file called just `sheet`.
   - class: FIX-HERE (+ OTHERS: a new key in all ten `www/i18n/*.js`) — build the name from `t('wr.file')` and strip only characters a file name cannot hold (`/ \ : * ? " < > |`). Behaviour (file name only), nothing stored.
   - confidence: CONFIRMED (code); the share-sheet title not photographed.

9. `www/sheet.js:955-958` (`shOutHTML`) — the act is SHARE and it is a word at the foot, not the mark in the corner (CLAUDE.md sixth: 「a screen's send and share are that mark at the top right of the bar」, `navDo(..., {icon})`).
   - evidence: `'<div class="barfix"><button class="btn ghost"' + DO('shMake') + '>'+ esc(t('wr.out'))+'</button></div>'`; `wr.out` = 「用紙を書き出す」/"Save the sheet"; `shMake()` ends in `p('LinguaShare', 'shareFile', ...)`, i.e. iOS's share sheet — the same act the letters' font/SVG export draws as `navDo(t('lt.out'), 'go', ['ltout'], false, {icon:ICON_SHARE})` (`www/sound.js`) and the card uses. The 2026-09-24 decision keeps word buttons only for 「サインイン・次へ・保存・完了」; the label says "save" but the press opens a share sheet. `marks-check` cannot see it because the label is more than the bare verb.
   - class: OWNER — options: (a) ICON_SHARE via `navDo(t('wr.out'), 'shMake', null, ..., {icon:ICON_SHARE})` in the bar, word as aria-label (look change; screenshot both states); (b) keep the word, recorded as the owner's exception.
   - confidence: CONFIRMED (code)

10. `www/sheet.js:884-892` (HELP.wr) + `www/i18n/*.js` `wr.s2.d` — the help text states a road that no longer exists.
    - evidence: step 2 `wr.s2.d` = 「ファイルアプリに入ります。」 / "It goes into the Files app." Since 2026-09-24/26 the sheet goes to the temporary folder and is OFFERED through iOS's share sheet, then removed (sheet.js:1113-1121, 「書き出したシートは渡したら端末に残さない」 OWNER 2026-09-26). Nothing goes into Files unless the person chooses it there.
    - class: OTHERS (www/i18n/*.js, ten files; wording is the owner's per § Deciding — propose e.g. 「共有の画面が開きます。」 and ask).
    - confidence: CONFIRMED

11. `www/sheet.js:1260-1275` (`shInHTML`) — rows in one list at two heights (CLAUDE.md 「Rows in one list are one height」).
    - evidence: a box that came back drawn renders `<canvas class="shink" ... style="width:30px;height:30px;...">` + `.sl`; an empty box renders `.sl` + `.sv` text only. `.set` is `padding:15px 2px; font-size:.95rem; line-height:1.25` (index.html:1844), so a text-only row is ≈49px and a canvas row ≈60px. `press` checks type size and margin-top, not this, so nothing holds it.
    - class: FIX-HERE (draw an empty 30×30 slot in the empty row too, or move the size into a `.shink` rule in index.html — OTHERS) — look change; screenshot needed.
    - confidence: UNCONFIRMED — arithmetic from the CSS; needs a `shot.mjs` of the read page with a mixed result (fixture has to seed `SH.got`).

12. `www/sheet.js:998`, `:1257`, `:1265` — layout written as inline `style=` from JS.
    - evidence: `'<canvas id="wr-pv" style="width:100%;display:block;margin-top:14px"></canvas>'`, `'<div class="mini" style="margin-top:14px">'`, `style="width:30px;height:30px;display:block;flex:0 0 auto"`. Rule 18's zero-in-JS is stated for corners/borders, which these are not; the brief lists JS `style=` as zero-tolerance.
    - class: OTHERS (index.html: `#wr-pv`, `.shfrom`, `.shink` rules) — refactor, no look change intended. Report only if the leader reads the brief's zero-tolerance as wider than rule 18.
    - confidence: UNCONFIRMED (whether it is a breach at all)

13. `www/sheet.js:1277-1282` (comment in `shInHTML`) — says the second gate is "where the file arrives"; it is not.
    - evidence: `shTakeIn() asks it again where the file arrives` — the file arrives in `shInMount()`'s `change` listener (1322-1341), which asks no plan; `shTakeIn()` is the Take button, where the letters arrive.
    - class: FIX-HERE — "where the letters arrive" (comment-only).
    - confidence: CONFIRMED

### www/share.js

14. `www/share.js:19-22` — stale header: what a key types.
    - evidence: `what pressing it types      the letter's name, which is its code point` — `sharePua()` (lines 90-94) and CLAUDE.md rule 10's eighth claim: a letter key carries a private use code point, `A private use code point, and not the letter's name.` (line 72).
    - class: FIX-HERE — "a private use code point (sharePua)" (comment-only).
    - confidence: CONFIRMED

15. `www/share.js:36` + `:675-697` — "Nothing here is user-facing, so nothing here goes through t()" is false; `SHARE.how` is drawn on a screen in English (CLAUDE.md rule 2).
    - evidence: `SHARE.how='no bridge'`, `SHARE.how='sent'`, `SHARE.how='refused: '+(e.message||...)`; `www/numbers.js:487` `esc(n+' · '+(SHARE.how||'-'))` inside `numWidHTML()`, which the digits room draws (`www/sound.js:1214`). `www/net.js:460-467` argues these are status marks "not translated for the same reason a status code is not", but net.js uses symbols (`−` `≠` `∅`) and a number; share.js uses English words plus a native error message.
    - class: OWNER (+ FIX-HERE) — options: (a) share.js stores a code/symbol (e.g. `−` never sent, `✓` sent, `≠` refused) and numbers.js prints it — matches net.js's stance; (b) keep words and route through `t()` (ten i18n files, OTHERS). Either way the header sentence at line 36 is deleted. Behaviour: one status line's text.
    - confidence: CONFIRMED (code); whether `i18n-check` ever renders a non-empty `SHARE.how` not verified.

16. `www/share.js:480-482` — stale: plans no longer split the keyboard (OWNER 2026-09-25, 1.0.3 「キーボードはプランで分けない」; CLAUDE.md § What the free plan is: `kbOf` "the others are KB, on every plan").
    - evidence: `when the plan changes (free reads kbFixed and paid reads KB)` — contradicted 20 lines later by the same file: `The keyboard itself is the same on every plan now (kbOf(), OWNER 2026-09-25).`; `kbOf()` (keyboard.js:1209) asks no plan.
    - class: FIX-HERE — "when the plan changes (the writing system: free is an alphabet)" (comment-only).
    - confidence: CONFIRMED

17. `www/share.js:458-470` (comment in `shareKbd()`) — stale about key height (CLAUDE.md rule 19: a row is 0.1385 of the phone's short side; five rows).
    - evidence: `A row is one height now -- the height the free QWERTY and a Japanese kana keyboard are both already drawn at -- and the extension caps the total against the screen, so a keyboard somebody built ten rows deep is squeezed` — `KeyboardViewController.swift:46-49` `rowPerWidth: CGFloat = 0.1385 ... min(b.width, b.height) * rowPerWidth`, so a row is not one height across phones; the ceiling on adding is five rows (`kbRowsMax()`).
    - class: FIX-HERE — rewrite to "a row's height is the extension's (rowPerWidth, rule 19) and not sent" (comment-only).
    - confidence: CONFIRMED

18. `docs/keyboard-extension.md` §14 — the spec for share.js's conversion says things the code (and a later owner decision) contradict. CLAUDE.md: 「a change lands with every sentence it falsifies」; rule 10 names §14 as where the claims live.
    - evidence:
      - § 決まっていること: `ローマ字面は、変換が要る書き方では**1面目**にする` — `shareRomLay()` comment (share.js:405-418): `It is the LAST face ... 「1ページ目これになるのやめてくれない？1ページ目が自作のキーボードなんだから」`, and `shareKbd()` pushes it last and only onto a BUILT, non-hand board.
      - § 何を渡す: `"ink": [ {"t":"ka","st":[…]} ...` and `lay のキーと同じ {t,st,ch}` — `t` is now a private use code point, and a face also carries `nm`, `aw`, `dx` (shareFace, 118-146).
      - the table lists `syll / abugida / logo / alpha / abjad` — `shareRoman()` also gives `block` a roman face (`w==='block'`).
      - § なぜ要る: `設定はありません。wsys() が既に答えを持っているので、そこから決まります` — the roman face is decided by `langWsysOf(langId)` (what was CHOSEN) and deliberately NOT `wsys()` (share.js:377-395, rule 10's ninth claim); also `out.rom` now names the roman face, which §14 does not mention.
      - the drawing shows `🌐 あ space` on the roman face; `shareRomLay()` builds `[lay-back, sp(w3), del]` and `shareRows` adds no globe to it.
    - class: OTHERS (docs/keyboard-extension.md §14; the "1面目" line is a written decision replaced by the owner's later words — mark it replaced and fix, per § "stop only when the owner has not spoken").
    - confidence: CONFIRMED

### Stale sentences elsewhere about these two files (OTHERS, found while checking)

19. `docs/FEATURES.md:717-770` (§ write) — says what sheet.js no longer does.
    - `There is no picture of what was read on that page, deliberately` — `shInHTML()` draws `canvas.shink` per box via `inkCanvases()` (sheet.js:1206-1224 explain the reversal, OWNER 2026-09-01).
    - `**What is NOT in is the drawing.** Nothing renders sh yet, so an imported letter shows **blank**` — `inkGeo()`/`inkDef()` render `sh` (share.js:54-60 says so).
    - `a box called 7 becomes a new letter called 7 and does not land on the digit already in the alphabet` — `shTakeIn()` routes a digit into its slot or adds a second digit of that value (「用紙を入れて数字なら数字に振り分けて」「別に課金なんだから追加しろよ」 OWNER 2026-09-01).
    - `Three filled marks at three corners of each box and none at the fourth` — sheet.js:9-12: four marks at the corners of the PAGE.
    - class: OTHERS (docs/FEATURES.md — the leader's/owner of that file). confidence: CONFIRMED

20. `www/sound.js:856-860` — the comment over the sheet door says it is not gated and names a capability that does not exist.
    - evidence: `NOT GATED ... the gate is one line in \`CAN\` -- \`write: 'pro'\`` — there is no `write` capability (`PAID_FEATURES.md`: `There is no \`write\` capability and there is not going to be one`); the gate is `can('file')` inside `fileInHTML()` and `shTakeIn()`.
    - class: OTHERS (www/sound.js, comment-only). confidence: CONFIRMED

### Checked and found in order (not findings)

- Every `DO`/`IN` name in both files is registered: `openWrite openWrOut openWrIn shMake shTakeIn` (act-map.js:200-204), `shTyped` (actIn, :398), `upFile` via `fileInHTML`. No `on*=` attributes. No `confirm/alert/prompt`.
- Every visible string in sheet.js screens goes through `t()`/`tn()` (the `wr.*` keys) except item 8; the PDF's `Lingua  n/N` is the allowed painted/printed word.
- `can()` only with literals (`can('file')`, `can('wsys')`); no `has()`.
- `shDropOld()` deletion has its owner decisions (2026-09-25, 2026-09-26) and DELETE REVIEWs in docs/CHANGELOG.md; callers are boot.js:131 and settings.js:903 as the comment says.
- `via:'write'` is stamped on the letter at arrival (the past as a value) — matches DATA_MODEL.
- share.js: `shareTable()` asks the ink slot last (`shareMapLts`/`shareMapSp` check every key/letter first) as rule 10 says; `sharePua()` reads `ltPuaOrder()`, the one list; `shareSig()` is keyed by account and returns null (not '') while the plan is unanswered; the App Group gets '' for nobody signed in.
- All names that comments in both files point at exist (ltInk, kbFix, scriptSig, kbHandRows, kbLayLetter, wsGuess, numFace, numBlank, stWordFor, stAll, langForAcct, LANG_WAIT, inkCanvases, geMount, helpQ, HELP, FORM_OPEN, …).
- Known and carried elsewhere, not counted: sheet.js and store.js both claim chapter 26 (CLAUDE.md § Working on this repo; docs/BACKLOG.md).

### Coverage — read in full

- `www/sheet.js` lines 1-1586, every line, in chunks 1-200, 200-480, 480-760, 760-1040, 1040-1320, 1320-1586. Functions: shPerPage, shNum, shBoxAt, shLabelW, shMarks, shCellAt, shUtf8, shUnUtf8, shSum, shPacket, shPack, shUnpack, shOne, shPageOps, shSheet, shWarp, shReadStrip, shPdfJpeg, shPdfWhy, shPdfImageAt, shBoxInk, shBoxField, shEdge, shClean, shScan, shThin, shBlank, shState, shNames, shPages, HELP.wr, openWrite, shQ, shRoomHTML, openWrOut, shOutHTML, shPvHTML, shPvGrey, shPvDraw, shPvPage, shPvBox, shTyped, shPic, shPics, shDropOld, shMake, shFileName, openWrIn, shInHTML, shInkMount, shTakeCount, shInMount, shIsPdf, shFail, shTakeFile, shPdfDraw, shLook, shPage, shBoxShape, shTakeIn, FORM_OPEN.write/wrout/wrin.
- `www/share.js` lines 1-698, every line (1-250, 250-480, 480-698). Functions: shareInk, sharePua, shareFace, shareKey, shareRows, shareTable, sharePut, shareMapLts, shareMapWords, shareMapSp, shareConv, shareRoman, shareRomLay, shareKbd, shareHand, shareSig, shareNums, shareWordAll, shareSlotWords, shareSlotWord, shareSep, shareWidget, sharePlug, sharePush.
- Cross-read to verify: shell.js viewReset (33-95), fileInHTML (1442-1447); core.js langLocked/langWrites (1514-1542), save (1991-1999), upStop (2990-2999), planNo/planSaid; letters.js saveLetters (38), ltNew (472-495), 1235-1241; backup.js bkTouch; numbers.js 455-490; sound.js 820-870; keyboard.js kbOf/kbIsFree/kbApplied, 4005-4015; net.js 460-467; KeyboardViewController.swift rowPerWidth; docs/keyboard-extension.md §14 (794-930); docs/PAID_FEATURES.md 440-475, 535-550; docs/FEATURES.md 717-900; FEATURE_RULES.md decision log entries 2026-08-25 (PDF only), 2026-09-24, 2026-09-25, and the 用紙/録音 entry (~455-470); CHANGELOG DELETE REVIEW lines for Documents/Sheets.

### Counts

- FIX-HERE: 9 (items 1, 2, 3, 4, 8, 13, 14, 16, 17) — 7 comment-only, 1 PDF-bytes cleanup (2), 1 behaviour (8, needs one i18n key)
- OWNER: 3 (items 7, 9, 15)
- OTHERS: 7 (items 5, 6, 10, 18, 19, 20; 12 conditional)
- UNCONFIRMED: 2 (items 11, 12)


---

## Group `pwi` — www/phases.js, www/import.js, www/words.js

## Audit — GROUP pwi: www/phases.js, www/import.js, www/words.js

Branch `claude/audit-words`. I only read files. I edited nothing in the repo.
Every line of the three files was read (the ranges are at the foot).
Findings are ordered by weight inside each file. The totals by class are at the end.

---

### A. www/import.js

#### 1. `import.js:913-953`: letters are added, renamed and given sounds on the free plan with no `can('letters')` / `can('snd')`
- Rules broken:
  - CLAUDE.md § What the free plan is: "nothing on the free plan adds one, deletes one or renames one".
  - `CAN.letters: 'plus'  /* adding, naming and deleting a letter */` and `CAN.snd: 'plus' /* choosing a sound, rather than taking the letter's own */` (www/core.js:2819, 2831).
  - www/letters.js:975-977 claims: "what free cannot do is ADD a letter, and every road that makes one asks already -- newLetter(), shTakeIn(), **the import**." The import does not ask.
- Evidence: `grep "can(\|upStop" www/import.js` finds nothing. The road is:
  ```
  if(IMP.into==='l'){ ... ltNew({val:v, ch:r.ch, snd:u}); lts++; ...
        if(r.nm) l.nm=r.nm;
        if(u.length){ impGrow(u); l.snd=u; l.chose=1; }
  } else { ... ltNew({ch:r.ch, nm:r.nm, snd:u}); lts++;
  ```
  `ltNew()` (letters.js:472) has no gate of its own.
- The comment at 909-912 gives the wrong reason: "It costs no room on the free plan: the ceiling is on the dictionary, and an alphabet is not one."
- class: **FIX-HERE**. This is a behaviour change.
  - In `impPut`, the letter side asks `upStop(can('letters'))` once before its loop.
  - Setting `snd`/`chose` on an existing letter also asks `can('snd')`.
  - Rewrite the comment to match.
  - The screen stays the same on every plan (HIDEFREE): the press answers.
  - Stored data: none is changed. Letters that were already imported stay.
- confidence: **CONFIRMED** (code)

#### 2. `import.js:944`: `l.nm=r.nm` renames an existing letter, including a free SLOT
- Rule broken: "A slot's name does not change, on any plan" (decision log 2026-08-22; CLAUDE.md § What the free plan is; `ltSetRoman()` refuses it, letters.js:913-930). That function says the refusal belongs in the function "because this function is reachable from anywhere -- **the import**".
- Why it matters: the import does not go through `ltSetRoman()`. It writes `nm` raw. `ltName()` returns `l.nm` first (letters.js:140), and `kbNamed()` finds the QWERTY's keys by `ltName` (keyboard.js:1047-1053). So renaming a slot that carries a borrowed `ch` matching a file row, with 上書き chosen, takes that key off the free keyboard.
- Evidence: `l=impLtrBy(r.ch); if(l){ if(IMP.dup!=='over') continue; wasL++; if(r.nm) l.nm=r.nm;`
- class: **FIX-HERE**. This is behaviour.
  - Route the name through the one place that names a letter (`ltSetRoman`), or skip `nm` for `ltIsBase(l)`.
  - Stored data: none moves.
- confidence: **CONFIRMED** (code path). Reaching it needs a slot with a borrowed `ch`; I did not press it.

#### 3. `import.js:605, 847, 905-1011`: import writes into a language it may not write
- What is missing: no `makeNeed()`, no `langLocked()` / `langWrites()` before `WORDS`, `LETTERS` and `SND` are changed in memory.
- Rules broken:
  - CLAUDE.md § Online: making needs an account.
  - words.js's own sentence (words.js:322-328): "a refusal at the storage door alone is worse than no door: the word appears in the list, the screen says it worked, and it is gone on the next launch."
- Evidence:
  - `function openImport(){ IMP=impBlank(); impPaint(); }`
  - `function doImport(){ impPut(...) }`
  - `impPut` pushes to `WORDS` and changes `w.mns` etc. Only then does `save()` refuse (core.js:1993). After that `impLand` toasts `imp.done` "N語 入りました".
  - The door at home.js:970 (`fRow(t('set.csv.in'), '', DO('openImport'))`) is not gated either.
  - Compare `openAdd()`, which asks `makeNeed()` first (wordsheet.js:44).
- class: **FIX-HERE**. This is behaviour.
  - `openImport()` asks `makeNeed()` and refuses in `langLocked()`. `impPut` returns before touching anything unless `langWrites()`.
  - Stored data: none.
- confidence: **CONFIRMED** (code). Whether the find screen is reachable inside somebody else's language is **UNCONFIRMED**; opening home.js:970 there would confirm it.

#### 4. `import.js:1038`: the "list is full" toast always says 0 words were coined, and uses a sentence of its own for the ceiling
- Bug: `toast(full? t('csv.full', nw, 0) : ...)` with `csv.full = '{0}語取り込み、{1}語作成。上限に達しました'`. `{1}` is always 0, and `nw` (added+was) already includes the coined words.
- Rule broken: decision 2026-09-24 「上限に達した時の文: ほかの上限の文と同じ形」. Its implementation note says `up.need` is the one ceiling sentence (FEATURE_RULES.md:2388-2389, :684-727). The import says a different sentence in a toast, where every other ceiling uses `capStop`/`upStop`'s pop.
- class: **FIX-HERE**. This is behaviour and wording.
  - When `full`, call `capStop(1)` (the pop), then land.
  - Drop `csv.full` from the ten i18n files.
  - Stored data: none.
- confidence: **CONFIRMED**

#### 5. `import.js:782-812 vs 905-1007`: the screen before the press says counts that are not what the press does
- The comment makes the claim itself (782-784): "the counts on this screen are what will happen." Three ways it is false:
  - (a) The ceiling is not counted. On free with 30 words and a 300-row file, the button says `imp.go` "300語を取り込む" and 70 go in.
  - (b) `p.coin++` for every meaning-only row, while `impPut` skips those rows when `!addedSnd().length` (line 984) or when `asWord` fails 40 times (998).
  - (c) Digit rows (`numInBase(numTyped(...))`, 926-939) fill an empty slot as `wasL`. `impPlan` counts them as `ltr`/`have` by `impLtrBy` alone.
- class: **FIX-HERE**. This is behaviour.
  - `impPlan` asks the same questions `impPut` asks, ideally one function that both use (dry run vs write) rather than two parallel walks.
  - Stored data: none.
- confidence: **CONFIRMED** (code)

#### 6. `import.js:955`: at the ceiling, an OVERWRITE of an existing word is refused as well
- Evidence: `if(!capOK(1)){ full=true; break; }` runs before `w=findWord(hw)` and the `over` branch. Overwriting adds no word and is not counted (`wCountable`), yet every later overwrite row is dropped.
- class: **FIX-HERE**. This is behaviour.
  - Ask `capOK` only on the branch that pushes a new word, and `continue` rather than `break`, so the overwrites after it still apply.
- confidence: **CONFIRMED** (code)

#### 7. `import.js:902-904, 983-1000`: a second road that makes up words
- Rules broken:
  - CLAUDE.md § Simple: "One thing is done by ONE mechanism."
  - Decision 2026-09-26 (単語の自動生成) made `genWords()` (assist.js:103) the chapter that makes words out of the language's sounds and syllable shapes.
  - words.js:592-594 claims the sheet is "the one road a word goes into the dictionary by".
- What differs: a meaning-only row coins its word through `asWord('n')` (assist.js:32 → `makeWord`, reading.js:70). `genWords` spells every candidate through `spOf()` and throws away one that no letter can write: "a sound no letter writes is a word nobody can spell" (assist.js comment). The import's coined word has `hw=seq.join('')`, which is sounds rather than letters, carries no `sp`, and is never checked for being spellable. It also bypasses the add sheet (meaning/part of speech/ceiling asked there).
- Evidence: `seq=asWord('n'); ... hw=seq.join(''); w={hw:hw, ph:seq, ...}; WORDS.push(w);`
- class: **OWNER**. Options:
  - (a) The import coins through `genWords(1)`, so it has one generator and one notion of spellable.
  - (b) The import stops coining. A meaning-only row arrives as a word with no spelling, or is listed as not imported.
  - (c) Keep it as it is and correct the "one road" comment in words.js.
  - Stored data: (a) changes the shape of future coined words (they would carry `sp`). Existing words stay.
- confidence: **CONFIRMED** that there are two mechanisms. That coined words can be unspellable is **UNCONFIRMED** (no letter set was built to show it).

#### 8. `import.js:21-25, 527-531, 557-562`: "touches no global" is false above the line
- Rule broken: CLAUDE.md rule 7: "It is DOM-free and globals-free on purpose, so tools/import-check.mjs can `eval` that half in Node".
- Evidence:
  - `impNames()` reads `LANG` and `UI_LANGS` (286-298).
  - `impPosLabel()` reads `LANG` (343-351).
  - `impCut()` calls `ipaAll()` (508-510).
- Each is guarded by `typeof`. So in Node those branches silently answer the English-only list, and import-check never tests the ten-language header names (「つづり」「品詞」), the localized part-of-speech labels, or the chart cut. The app and the check run different code.
- class: **FIX-HERE**. This is a refactor.
  - Below the line, build the name/pos/inventory tables and pass them in as arguments (`impRead(src, dict)` / `impGuess(read, dict)`). The check then passes a real `LANG`. Otherwise, rewrite the three comments to say what is true.
  - Stored data: none.
- confidence: **CONFIRMED**

#### 9. `import.js:961-966`: 上書き replaces a word's meanings, part of speech and reading with no confirm and no undo
- Rules broken:
  - DATA_SAFETY / CLAUDE.md § Data: "the way a copy destroys somebody's work is by winning."
  - Decision 2026-09-24 (criterion 9 replaced): 「消す前は確認の窓」.
- What happened: `impUndo()` was deleted in 08058d36 (the four screens). The overwrite (`w.mns=impSenses(r.mn)`, `w.pos=...`, `w.ph=r.ph`) now has neither undo nor a pop. The comment at 854-858 ("Nothing is DELETED ... an overwrite that emptied the note somebody wrote here would be the file winning over their own work") is true of the note and false of the meanings.
- class: **OWNER**. Options:
  - (a) A `popAsk` "N 語を上書きしますか？" on 取り込む when `IMP.dup==='over' && p.have`.
  - (b) Overwrite ADDS meanings beside the existing ones (as examples already do).
  - (c) As it is.
- confidence: **CONFIRMED** (code)

#### 10. `import.js:577-587` and `700-727`: "FOUR SCREENS, ONE THING ON EACH", but the map screen holds two choices
- Rule broken: CLAUDE.md § Shape: "the thing being chosen and the thing being changed on one screen".
- Evidence: the map screen draws the side switch (`impSetInto`), the picture of the file, one `<select>` per column, Next and 選び直す. The ready screen puts a skip/overwrite choice beside the button that writes.
- class: **OWNER**. It is a judgement whether the side switch is a separate screen. The comment's "one thing on each" is at least false.
- confidence: **CONFIRMED** (what is drawn). Whether it breaks the rule is the owner's call.

#### 11. `www/i18n/*/csv.ph` (import.js:643): the placeholder is a worked example of formats
- Rule broken: CLAUDE.md § Explaining ("does not tell somebody what to tap").
- Evidence: `csv.ph = 'ねこ\nみず\n歩く\n\nkano, 山, 名詞'` teaches the two accepted shapes.
- class: **OWNER**. Keep an example placeholder, or blank it and move the formats into the `?`.
- confidence: **CONFIRMED** (text). Whether it counts as explaining is the owner's call.

#### 12. `import.js:614-616`: a comment sits over the wrong function
- Evidence: "Rebuilding it rather than patching a piece: choosing what a column is changes the counts…" sits over `impAgain()`, which resets to a blank import. It describes `impSetRole`/`impPaint`.
- class: **FIX-HERE**. Comment only.
- confidence: **CONFIRMED**

---

### B. www/phases.js

#### 13. `phases.js:163`: `migrateGramLang()` reads the read-only picture and writes it back as this phone's own
- Rule broken: CLAUDE.md rule 22: "`slMine()` never reads it [the `.got` picture] at all, which is the whole of the one-way line"; the picture "never goes back to the server".
- Evidence: `raw=slRd(key);` … `slWr(key, JSON.stringify(o));`
  - `slRd()` falls back to `lingua.<id>.phases.got` (core.js:977-981).
  - When that is what came back and `o.gpos` was undefined, the picture plus `gpos` goes into `LSL`. From then on `slMine()` answers it.
  - `netLangFill` skips any slice `slMine` holds (net.js:2121/2132: `if(slMine(langKeyOf(nid, k))!==null) continue;`), so the server's `phases` never comes down.
  - The next time a person writes `phases`, a slice built on the stale picture goes up.
  - It runs on every launch (by design, "again and again").
- A related risk: the `raw===null && o.gpos` branch (195-196) writes `{gpos}` alone into an absent slice. The comment at 191-194 itself says this is "a slice it [the fill] steps over for good". The server's rules, notes and stages for that language then do not come down that session.
- class: **FIX-HERE**. This is behaviour.
  - `raw=slMine(key)`.
  - Write only on top of a slice that was actually held here (`raw!==null`). An absent one is left for `netLangFill`, which then fills in the server's.
  - Stored data: none is lost. Less is written.
- confidence: code path **CONFIRMED**. Reachability is **UNCONFIRMED**. It needs an old-version phone whose older version left some slice key but no `phases` key, plus a `.got` picture of phases and `SET.gpos`. `migrate-check` seeding that state would confirm it.

#### 14. `phases.js:1053` with `www/i18n/*` `stg.{greet,pron,conj,part,polite}.d` and the computed `stg.{count,month,wday}.d`: subtitles that explain
- Rule broken: CLAUDE.md § Explaining: "No explanatory text in the app".
- The owner already called this exact line 「↑これは説明だろ」 (comment at 464-469, where four were removed).
- What remains is the same kind of line, telling what the stage is: 一語で通じる言葉, 主語になる語, 文と文をつなぐ語, 語の働きを示す小さな語, ていねいに言うときの形, 1から{0}まで.
- Evidence: `if(stWhat(p)) out+='<div class="note" style="margin-bottom:6px">'+esc(stWhat(p))+'</div>';`
- class: **FIX-HERE**. This is look and wording removal.
  - Drop the line and `stHasWhat`/`stWhat` (their only reader), and delete the keys from the ten i18n files (in scope). If a meaning is wanted, it goes behind the `?`.
  - Stored data: none.
  - If the owner considers 「1から12まで」 a count, it can stay. Flag that one.
- confidence: text **CONFIRMED**. That the owner treats these as explanation is inferred from the quoted decision.

#### 15. `phases.js:1027-1029, 569-582, 588-591`: on free, the ＋ opens the form and only the last press refuses
- Rule broken: HIDEFREE / OWNER 2026-09-04 「できないことは、有料と同じ画面に同じ形で出す。押したら有料へ」.
- What happens: on free, the ＋ opens the own-stage form. The person types a title and words, and only the final ＋ (`stAddOwn`) says `upStop(can('gram'))`.
- The comment at 589-590 is also false: "The screen only offers this on a paid plan". The fab is drawn on every plan unless `langLocked()`.
- Compare `openAdd`, which asks `capStop` before it opens.
- class: **FIX-HERE**. This is behaviour.
  - `openOwnPhase()` asks `upStop(can('gram'))` first, as `stDelOwn` does.
  - Rewrite the comment.
  - Stored data: none.
- confidence: **CONFIRMED** (code)

#### 16. `phases.js:606-612`: the comment contradicts the code and a superseding decision
- Evidence: the comment says "A stage of somebody's own **stays on the list**". Superseded by 「課金で追加した機能は無料になったら全部隠れる」 OWNER 2026-09-01, which `stAll()`/`stHidden()` (393-409) implement: it is hidden.
- class: **FIX-HERE**. Comment only.
- confidence: **CONFIRMED**

#### 17. `phases.js:584-587`: the comment names a function that does not exist and describes a different act
- Evidence: "Saying yes to the stage that is off the list. stMarkSet() is what stUsed() reads … and is already in the backup."
  - `stUsed` exists nowhere in `www/` (grep).
  - The function under it (`stAddOwn`) makes a new own stage.
  - "the backup" is deleted (rule 11).
- class: **FIX-HERE**. Comment only.
- confidence: **CONFIRMED**

#### 18. `phases.js:339-376`: two floating comments describe a mechanism that is gone and a count that is wrong
- Evidence:
  - 339-353: "Stages that are not every language's, and are not offered until somebody's language turns out to have one … A stage here appears the moment there is an answer in it". No such hiding exists; `STAGES` lists 助詞 always (the comment at 262-265: 「助詞は最初から出せ」).
  - 354-359: "Its slots are the three roles…" next to "SEVEN NOW, AND NOT THREE", with no declaration under either.
- class: **FIX-HERE**. Comment only (delete, or move the particles note onto the `part` row).
- confidence: **CONFIRMED**

#### 19. `phases.js:843-860`: the comment over `stHidHTML` describes a contents page that is gone
- Evidence: "ONE list of chapters … The sixteen follow … numbered on from the eight … Each group is NAMED … a `sec` and a name". The contents is now `G2BOOK`'s ten chapters, with no groups (see 952-958, "IT WAS GROUPS WITH HEADINGS … there is nothing left for a group to be").
- class: **FIX-HERE**. Comment only.
- confidence: **CONFIRMED**

#### 20. `phases.js:191-194`: the comment names the wrong function
- Evidence: "an absent slice is what netLangsDown() fills in". Per CLAUDE.md rule 11/22, `netLangsDown()` brings the index and `netLangFill()` brings slices.
- class: **FIX-HERE**. Comment only.
- confidence: **CONFIRMED**

#### 21. `phases.js:723-724`: `stExNew` is screen state that `viewReset()` does not forget
- Rule broken: CLAUDE.md § One place: "Adding a screen that remembers something means adding it there".
- Evidence: `var stExNew=''; function stExOpen(id){ stExNew=id; ...}`. It is absent from `viewReset()` (www/shell.js:33-70). Opening another language with the same stage id arrives with the example field already open.
- class: **OTHERS** (the fix is one line in www/shell.js `viewReset()`: `stExNew='';`).
- confidence: **CONFIRMED** (code)

#### 22. `phases.js:730`: delete of an example line is drawn as ✕ (`ICON_CROSS`), not the bin
- Rule broken: CLAUDE.md § sixth rule: "delete is the bin". The aria-label is `word.ex.del` 例文の削除.
- Evidence: `exBtn('stDelEx', [id, i], 'word.ex.del', ICON_CROSS)`. The word sheet does the same (wordsheet.js:491).
- class: **OWNER**. ✕ is "close" in the mark row; bin is "delete". Change both call sites to `ICON_BIN`, or decide that removing a line from an unsaved list is ✕. This is a look change and needs a screenshot.
- confidence: **CONFIRMED** (code)

#### 23. `phases.js:159`: `migrateGramLang()` walks `LANGS` (the index)
- Rule broken: CLAUDE.md rule 22: "the index is a picture for LOOKING AT, and nothing counts from it". What it needs to know (whether an older version left a disk key) is a fact about `localStorage`, not the index.
- Already carried in docs/BACKLOG.md:2005. It is listed here for completeness, not as a new finding.
- class: **FIX-HERE** (walk `localStorage` keys `lingua.<id>.<slice>` instead). It is already in BACKLOG.
- confidence: **CONFIRMED**

#### 24. `www/i18n/*` `stg.own.words.ph` ('1行に1つ'), `stg.own.title.ph` ('例：敬語'), `stg.ex.lb.ph` ('肯定 / 否定') (phases.js:576-578, 734): placeholders that instruct or give examples
- Rule broken: CLAUDE.md § Explaining ("does not tell somebody what to tap").
- class: **OWNER** (the same question as item 11).
- confidence: text **CONFIRMED**

---

### C. www/words.js

#### 25. `words.js:572-583`: the comment says the row plays nothing, but the code draws a play button on every row
- Evidence: the comment says "Nothing on the row plays it. The free plan does not edit sound, so a button about sound on every line of the dictionary is a control for a thing this plan does not do 「無料版は音の編集できないから」". Directly under it:
  `'<button class="esay"' + DO('sayPh', [wPh(w)]) + ' aria-label="'+esc(t('f.listen'))+'">'+ICON_SPK+'</button>'`
- History:
  - a97f5d3c (Aug 12) removed the row's play button on the owner's words.
  - 876710e8 (Aug 20, "a word says itself on its own row") put `esay` back.
  - The Aug 12 sentence was left standing.
- class: **OWNER**. Does 「無料版は音の編集できないから」 still stand?
  - (a) Remove `esay`; hearing a word is on its page.
  - (b) Keep `esay` and delete the stale sentence and its quote.
  - Either way, one of the two must go in the same commit.
- confidence: **CONFIRMED**

#### 26. `words.js:406-412`: the comment cites a replaced rule as the owner's, and the undo now stands beside a confirm
- Evidence: 「重要な操作は取り消せること」 -- the owner's …, "so it is asked AND it can be put back". Criterion 9 was replaced on 2026-09-24 by 「消す前は確認の窓」 (FEATURE_RULES.md:3365, :701).
- Rule broken: CLAUDE.md "when a decision replaces a rule, FIX THE RULE … Fixing means deleting".
- class:
  - **FIX-HERE**, comment only: rewrite 406-412 to cite 2026-09-24.
  - **OWNER**: whether `wUndo`/`wSelUndo`/`wordsUndoHTML` stay as a second mechanism beside the pop. Keeping them is not forbidden by the 09-24 text, but no decision asks for them now.
- confidence: **CONFIRMED**

#### 27. `words.js:122-131, 227-229, 60-62`: stale sentences about deleted machinery
- Evidence:
  - "packed by `bkPack()` and in the file in Documents": no `bkPack` exists; the Documents file was deleted (rule 11).
  - "once, out loud, on the day the plan ends (`capLapse()` in boot.js)": it is `capLapseSaw()`/`capLapsePop()` in settings.js (PAID_FEATURES.md).
  - "in `save()`, in the backup and in the file in Documents".
  - "nothing is in the backup".
- Rule broken: "a change lands with every sentence it falsifies".
- class: **FIX-HERE**. Comment only.
- confidence: **CONFIRMED**

#### 28. `words.js:457-460, 475-477`: the comment names `impUndo`, which was deleted in 08058d36
- Evidence: "which is what `impUndo` does with what an import overwrote" and "`impUndo`'s row, in the place this one's is missing from". letters.js:1214 carries the same stale name; that one is not ours.
- class: **FIX-HERE**. Comment only.
- confidence: **CONFIRMED** (`grep "function impUndo" www/` is empty)

#### 29. `words.js:8-14` vs `494-495`: the file header describes the list with a family and a rail
- Evidence: the header says "a rail that narrows by part of speech … and where a word came from written on it rather than implied by an indent". The entry comment says "Nothing about the family. A word is a word on this list". The part-of-speech rail is a single button that opens a list (286-290).
- class: **FIX-HERE**. Comment only.
- confidence: **CONFIRMED**

#### 30. `words.js:487-489`: the comment says the word speaks when touched and a chevron opens it
- Evidence: "The word says itself when you touch it; the chevron at its edge opens it." The row opens the word (576), and there is no chevron.
- class: **FIX-HERE**. Comment only.
- confidence: **CONFIRMED**

#### 31. `words.js:358-360`: the comment describes a filter sheet that the code does not draw
- Evidence: "Every kind that has a word in it, and the count beside each". `openFil()` lists all `POS` plus 意味なし whether a word is in it or not, and `wFilRow` draws no count.
- class: **FIX-HERE**. Comment only. Adding counts would be a feature nobody asked for.
- confidence: **CONFIRMED**

#### 32. `words.js:312-316`: a comment that the next comment contradicts
- Evidence: "What is under it is the two things being done to what was chosen, in the bar across the foot the app already has (`.barfix` …). Both are down until something is chosen". The next comment (317-321) says delete is in the top bar and there is no foot strip.
- class: **FIX-HERE**. Comment only.
- confidence: **CONFIRMED**

#### 33. `words.js:346-347`: an orphan comment with nothing under it
- Evidence: "Clearing leaves the cursor where it was…". There is no clear function in this file (the ✕ is `searchBox`'s, shell.js).
- class: **FIX-HERE**. Comment only.
- confidence: **CONFIRMED**

#### 34. `words.js:631-659`: `vGen` rows stay pressable in somebody else's language
- Rule broken: words.js:322-328 (the way in is not drawn where it cannot write).
- Evidence: `vGen` hides `gen.again` under `langLocked()`, but every row still says `DO('genTake',[i])`. `genTake` → `openAdd('')` asks `makeNeed()`/`capStop` and not `langLocked()`. The route `gen` exists in PAGES, while the door from the dictionary is hidden when locked.
- class: **FIX-HERE**. This is behaviour.
  - Rows are not buttons when `langLocked()`, or `genTake` refuses.
- confidence: code **CONFIRMED**. Reachability in a taken language is **UNCONFIRMED** (it needs a trail that arrives at `gen` there).

#### 35. `words.js:648-659`: `genTake` patches the sheet's state after opening it
- Rule broken: CLAUDE.md § Simple ("patch … one more condition … Forbidden").
- Evidence: `addW=null;` is put in front of `openAdd('')` to force its "fresh" branch. Then `wEdit.sp=...; wdSync(); relDirty(); render();` rewrites the draft the sheet already drew.
- class: **FIX-HERE**. This is a refactor.
  - `openAdd` takes the starting spelling as an argument (it already takes `par`'s spelling that way, wordsheet.js:72). `genTake` then becomes one call.
  - Stored data: none.
- confidence: **CONFIRMED**

#### 36. `words.js:634` (`gen.again` 作り直す) and `279` (`gen.door` 作る): word buttons in the corner
- Evidence: the code says (275-278) there is no settled mark for "make up words", so it stays a word; this follows CLAUDE.md. 作り直す (regenerate) may be the refresh mark every phone draws, but "refresh" is not in the owner's list.
- class: **OWNER** (whether 作り直す gets a mark). There is no violation as written.
- confidence: **CONFIRMED** (what is drawn)

---

### D. Found while reading, with the fix outside these files (OTHERS)

- **settings.js:427 vs home.js:970**: two doors to one import that answer differently.
  - settings: `(can('data')? DO('openImport') : DO('upData'))`, which is Pro only.
  - home.js's find screen: `DO('openImport')` on every plan.
  - FEATURES.md:60 says the paste is free and only a file is `file`.
  - This is two answers to one question (CLAUDE.md § Simple).
  - The fix: settings.js drops the `can('data')` gate (the owner's to confirm). settings.js is outside the scope.
- **shell.js viewReset()**: add `stExNew=''` (item 21).
- **letters.js:975-977**: its claim that "the import" asks before adding a letter is false until item 1 lands, and its line 1214 names `impUndo`.

### E. Checked and clean (so silence is not read as a pass)

- Every `DO`/`IN`/`CH`/`KD` name in the three files is registered in act-map.js (`act`/`actIn`/`actKey`). I checked all 36 by grep.
- No `on*=` attributes, and no `confirm(`/`alert(`/`prompt(`. The deletes use `popAsk` (words 443, phases 617).
- `has()` is not used. Plan questions are `can('gram')`/`wordCap()`/`capOK`/`fileInHTML`'s `can('file')` only.
- `wordsSeen()` matches the 100-word decision: it folds only the list; `null` plan folds nothing; forms are excluded via `wIsForm()`; the foot count uses `capWarnHTML`.
- `stAll`/`stHidden` match 「課金で追加した機能は無料になったら全部隠れる」.
- The gen chapter (vGen/vGenSyl/`STG.syl` in `STG_DEF`) is present per the 2026-09-26 decision, and goes up with the `phases` slice.
- Views (`vWords`, `vGen`, `vGenSyl`, `vGram`) make no network call.
- There are no chip rows. The part of speech and the sort are lists on forms.
- The inline `style=` attributes (phases 578/766/1053/1069 min-height and margin; import 704 margin) are not a border, corner or panel, so rule 18 is not touched. They were not counted.

### Coverage (read in full)

- `www/words.js` 1-683 (whole file).
- `www/phases.js` 1-1135 (whole file).
- `www/import.js` 1-1040 (whole file).
- Support read to verify findings:
  - core.js 925-1100 (slMine/slRd/slGot/slWr), 1539-1553, 1955-1975, 1991-2002, 2153-2156, 2808-2838, 2898-2906, 2924-2926.
  - letters.js 38, 138-144, 472-494, 913-990, 1478-1506.
  - assist.js 60-127.
  - wordsheet.js 41-90.
  - shell.js 25-70, 820-845, 1386-1447.
  - keyboard.js 1047-1054; net.js netLangFill (2114-2133).
  - i18n ja/en keys cited.
  - FEATURE_RULES.md 395-420, 684-727, 870-900, 3340-3375, 5740-5780.
  - PAID_FEATURES.md 525-580; HIDEFREE.md 125-200.

### Counts

- FIX-HERE: 27 (items 1, 2, 3, 4, 5, 6, 8, 12, 13, 14, 15, 16, 17, 18, 19, 20, 23, 26 [comment half], 27, 28, 29, 30, 31, 32, 33, 34, 35).
  - Behaviour: 1, 2, 3, 4, 5, 6, 13, 14, 15, 34.
  - Refactor: 8, 23, 35.
  - Comment-only: the rest.
- OWNER: 9 (items 7, 9, 10, 11, 22, 24, 25, 26 [undo half], 36).
- OTHERS: 3 (settings.js/home.js import door; shell.js viewReset `stExNew`; letters.js stale claims).


---

## Group `small` — www/grammar-engine/*, assist.js, ipa.js, reading.js, notes.js, voice.js

## Audit — GROUP=small (branch claude/audit-words, read-only)

Files: www/grammar-engine/{adapter,lexicon,model,morphology,translate}.js, www/assist.js, www/ipa.js, www/reading.js, www/notes.js, www/voice.js.
Every line of every file was read (ranges at the foot). Nothing in the repo was edited.

---

### notes.js

1. **`www/notes.js:159`** — the note's Save says 「saved」 TWICE, and the first one before the server has answered.
   - Rule: `www/shell.js` § keepSave (the rule's own home): "「保存しました」 is keepSave()'s one line for all nine … HERE AND NOWHERE ELSE … with this line it would have been said twice on one press", and "only when it LANDED"; CLAUDE.md rule 11 「NOT SAVING IS THE SPEC. SAVING AND SAYING NOTHING IS NOT」 / OWNER 2026-09-05 「通信エラーなら進むわけねえだろ全部」.
   - Evidence: `saveNotes(); toast(t('toast.note.kept'));` runs inside `b.save` (ntKeepOn line 141 `function(v, done){ saveNote(v); done(true); }`), i.e. before `netSaveNow()` in keepSave; keepSave then says `toast(t('keep.saved'))` again when it lands. On a failed send the person sees 「メモを保存しました」 plus the netPop failure.
   - class: FIX-HERE — delete the toast from saveNote (behaviour: one toast fewer; no stored data; look: toast). `toast.note.kept` becomes an unused i18n key in all ten files (OTHERS: www/i18n/*.js).
   - confidence: CONFIRMED (code order read; not pressed on a device)

2. **`www/notes.js:141,156`** — clearing a note and pressing Save reports success and writes nothing.
   - Rule: CLAUDE.md rule 11 「SAVING AND SAYING NOTHING IS NOT」; § Simple.
   - Evidence: `if(!ti && !bo) return;` in saveNote, but the caller unconditionally `done(true)` → keepSave sends nothing, toasts `keep.saved`, levels the buffer and goes back. The old text stays on the note; the person was told it saved.
   - class: OWNER — what an emptied note is: (a) refuse with a message and stay (`done(false)` + a said reason), (b) delete the note (needs the confirm pop and a DELETE REVIEW), (c) save it empty. Today it is none of these.
   - confidence: CONFIRMED by reading (not pressed)

3. **`www/notes.js:68`** (and comment 66-67) — READING a note requires signing in.
   - Rule: `www/onboard.js:1210-1217` (makeNeed's own spec, owner's words) 「全部の画面一通り見れるけど制作しようとするとログイン求められる」 — "The four the owner named … adding a note … **neither is looking at anything**. Every screen opens"; CLAUDE.md § Online "What there IS with no signal is what was loaded before, to look at".
   - Evidence: `function openNote(i){ if(!makeNeed()) return; …` — openNote is now the READ face (OWNER 2026-09-06 「開いた時は閲覧」); the comment "Editing one is making one … so this is asked on the way in" dates from when opening WAS editing.
   - class: FIX-HERE — take makeNeed() out of openNote; keep it in openNoteEdit (behaviour; no data; no look change except a signed-out tap now opens the note).
   - confidence: CONFIRMED by reading

4. **`www/notes.js:168-174` (`delNoteGo`)** — a swipe-delete removes the note with no confirmation.
   - Rule: CLAUDE.md § Shape, ten criteria "a confirm before a delete (criterion 9 … replaced 2026-09-24 「確認ポップにしてください」)"; FEATURE_RULES 2026-09-24 「消す前の『○○を消しますか？』: 確認の窓を出す（17 か所とも今のまま）」. Against it: OWNER 2026-09-05 「一覧から右にスワイプして削除。標準アプリと同じ作りにして」 (the iOS standard swipe-delete does not ask).
   - Evidence: `NOTES.splice(i,1); … saveNotes(); render(); toast(t('toast.note.gone'));` — no popAsk. The multi-select road (`ntSelDel`, 276-280) DOES ask.
   - class: OWNER — two written decisions disagree (swipe like the standard app vs. confirm before every delete). Options: (a) popAsk after the − is pressed; (b) swipe-delete is exempt, written into the decision log. Same question for `langDrop` swipe in home.js (OTHERS).
   - confidence: CONFIRMED

5. **`www/notes.js:168-174` vs `283-289`** — two delete roads that do different bookkeeping.
   - Rule: CLAUDE.md § Simple "One thing is done by ONE mechanism".
   - Evidence: delNoteGo adjusts `ntAt` (`if(ntAt===i) ntAt=-1; else if(ntAt>i) ntAt--;`), clears `ntSwipeAt`, toasts `toast.note.gone`; ntSelDelGo does none of the three.
   - class: FIX-HERE — one `ntDrop(indices)` both call (refactor + a toast added to multi-delete = behaviour; no stored-data change).
   - confidence: CONFIRMED

6. **`www/notes.js:109,139,143` + 170/285** — a note's draft buffer and its form are keyed by the note's ARRAY INDEX (`ntedit:<i>`, `note:<i>`), and deleting a note shifts every index after it without telling KEEP or the trail.
   - Rule: CLAUDE.md § The past / rule 14 ("the trail is told when a word is renamed and when one is deleted, because the trail names words and words move"); DATA_MODEL "value, not an id pointing at the current object".
   - Evidence: `keepKeyOf('form', 'ntedit:'+k)`; delNoteGo/ntSelDelGo call neither `keepDrop` nor `navDrop`. A KEEP entry survives a landed save (shell.js 719-721 levels, does not drop), and keepOn() re-uses an existing entry's `was` (shell.js 454) — so after deleting note 1, opening what is now note 3 may find note 4's old buffer.
   - class: FIX-HERE (key notes by a stable id, e.g. their `at`) — behaviour; stored data unchanged if the id is `at` which every note already carries (older notes without `at` need an answer → OWNER).
   - confidence: UNCONFIRMED — confirm by: open note 3, save, go back, swipe-delete note 1, open the note now at index 3 and see whether Save is gold / the fields hold another note's text.

7. **`www/notes.js:44-51, 69, 150-152, 158`** — `ntNewSpent` is a flag bolted round the `ntedit:-1` key, and its justification is gone.
   - Rule: CLAUDE.md § Simple (patch forbidden); "a change lands with every sentence it falsifies".
   - Evidence: comment 146-152 "Writing it down, and STAYING on it … without that line a second press would push a second copy". keepSave now goes BACK on a landed save (`navLand(to || backTo())`, shell.js 763, OWNER 2026-09-05 「保存したら一個前のページ」) and levels the buffer to `now()` of the fresh `{t:'',b:''}` object, so + already opens empty.
   - class: FIX-HERE — delete ntNewSpent and the keepDrop in openNote once pressed-confirmed; rewrite the 146-152 comment (behaviour-neutral if confirmed).
   - confidence: comment staleness CONFIRMED; flag being unnecessary UNCONFIRMED (press: + → type → Save → + again).

8. **`www/notes.js:333`** — a spacer made of a translated full-width space and an inline margin.
   - Rule: CLAUDE.md § Simple (patch); rule 2 intent (a key whose text is `'　'` in all ten files is not a string); § Rows "No margin … to make a group".
   - Evidence: `'<div class="note" style="margin-bottom:12px">'+t('notes.note')+'</div>'` with `'notes.note' : "　"` (en.js:729, ja.js:737) — the residue of an explanatory line that was emptied rather than removed.
   - class: FIX-HERE — delete the div (look changes: the list moves up ~12px + one line; needs a screenshot) and the `notes.note` key in www/i18n/*.js (OTHERS).
   - confidence: CONFIRMED

9. **`www/notes.js:122` → `www/i18n/{en,es,pt,fr,de,it,ru,zh,ko}.js` `notes.b.ph`** — the body placeholder explains, in nine languages.
   - Rule: CLAUDE.md § Explaining 「アプリ内に説明書くの禁止」 (placeholder counts: rule 2 names `placeholder`).
   - Evidence: en "Who speaks it, why a word means two things, anything you want to remember."; ja was cut to '本文'.
   - class: OWNER/OTHERS — FEATURE_RULES 2026-09-24 says 「説明っぽい文 … 今のまま」; whether this placeholder is one of those kept is the owner's. Fix lives in i18n files.
   - confidence: CONFIRMED (text); ruling UNCONFIRMED

10. **`www/notes.js:12-13`** — header says notes are "kept on the device with everything else".
    - Rule: CLAUDE.md § Online / rule 22 「THE LANGUAGE DOES NOT LIVE ON THIS PHONE」; "a change lands with every sentence it falsifies".
    - class: FIX-HERE comment-only.
    - confidence: CONFIRMED

11. **`www/notes.js:253-257` `ntFound`** — name says "found", nothing is searched (search removed 2026-09-04).
    - Rule: CLAUDE.md § Names "must be telling the truth".
    - class: FIX-HERE rename (own commit) or inline `NOTES` reversed.
    - confidence: CONFIRMED

12. **`www/i18n/*.js` (used by notes.js:336)** — empty state says the same thing twice: `notes.empty.t` 「まだメモがありません」 + `notes.empty.s` 「まだありません」; en `notes.edit` "Note" vs ja 「メモの編集」.
    - Rule: CLAUDE.md § Shape (little on a screen); consistency of wording is the owner's (§ Deciding).
    - class: OTHERS (i18n) / OWNER wording.
    - confidence: CONFIRMED

### voice.js

13. **`www/voice.js:263, 295-305`** — residue of the deleted 「Play all」: `VXRUN` is never assigned anything but 0, and a comment block describes a function that is not there.
    - Rule: CLAUDE.md rule 5 (written/read but nothing ever gives it a value = a wire with one end unattached); "a change lands with every sentence it falsifies". Play all, `saySeqs`, `sayStop`, `vxRunning` were deleted in 876710e8 (2026-08-20).
    - Evidence: `var VXRUN=0;` (305), `if(VXRUN){ clearTimeout(VXRUN); VXRUN=0; }` (263); comment 295-304 "This says a list straight through … It stops by throwing the audio context away".
    - class: FIX-HERE — delete VXRUN, line 263 and the 295-304 comment (refactor, no behaviour).
    - confidence: CONFIRMED (git show 876710e8)

14. **`www/voice.js:247-269` (`vxCut`)** — its reason and its render are about the deleted player.
    - Evidence: comment "the moment a whole dictionary is playing: thirty words is half a minute of queue"; `/* the button that said "stop" has nothing left to stop */ if(typeof render==='function') setTimeout(render, 0);` — no stop button exists, so this render repaints the whole screen for nothing.
    - Rule: as 13; § Simple.
    - class: FIX-HERE — drop the render and rewrite the comment; whether the 1.2 s queue-cut is still needed at all for single taps is UNCONFIRMED (a long word can exceed 1.2 s).
    - confidence: stale comment/render CONFIRMED; rest UNCONFIRMED

15. **`www/voice.js:233-245, 270-290`** — `sayPh(seq, ctx, f0)`: no caller passes `ctx` or `f0`, so the offline-render branch (`!ctx`, `x.startRendering`) and the `f0` parameter are dead.
    - Rule: CLAUDE.md rule 5 spirit (nothing that nothing reaches) — dead-check cannot see parameters.
    - Evidence: all 9 callers are `DO('sayPh', [seq])` / `sayOne(sym)`; grep for OfflineAudioContext/startRendering in www+tools: none outside voice.js.
    - class: FIX-HERE refactor (no behaviour).
    - confidence: CONFIRMED

16. **`www/voice.js:77`** — `vxFormant(x, src, hz, q, gain, t0, dur)`: `t0`,`dur` never used, never passed. FIX-HERE refactor. CONFIRMED.

### reading.js

17. **`www/reading.js:40-41, 97-99`** — three orphan comments with no code under them (linking and "what to do next" features, removed).
    - Rule: "a change lands with every sentence it falsifies"; rule 5.
    - Evidence: "/* Words run together when one ends on a consonant … */", "/* Pick a short run of words that shows linking off … */", "/* What to do next so that another rule appears … */" — file ends there.
    - class: FIX-HERE comment-only. confidence: CONFIRMED

18. **`www/reading.js:6`** — "Search hits on any of spelling, meaning, reading or IPA": there is no "reading" (the respelling is gone, same file 22-26); the key is spelling + meanings + IPA + tags. FIX-HERE comment. CONFIRMED.

19. **`www/reading.js:30`** — "`vSet('ui')` renders one sample word": vSet takes no argument (CLAUDE.md rule 20 "`vSet()` takes no argument, it reads `here().a`"). FIX-HERE comment. CONFIRMED.

20. **`www/reading.js:53` `pick`, `:62` `taken`** — single bare words in the global namespace.
    - Rule: CLAUDE.md § Names "Single bare verbs are not names here. `wipe` and `choose` said nothing about what they acted on".
    - class: FIX-HERE rename (own commit; callers assist.js 33/104, reading.js 71-79). CONFIRMED.
    - Also `srcKey` (10): search is `f*` by § Names; low. CONFIRMED.

21. **`www/reading.js:37`** — `(typeof findWord==='function')?` guard: findWord (wordsheet.js:182) always exists by the time seqOf runs, and no tool evaluates reading.js. Dead defensive branch; FIX-HERE refactor. CONFIRMED.

### assist.js (+ reading.js makeWord)

22. **`www/assist.js:28-49` (`asWord`) + `www/reading.js:70-96` (`makeWord`) vs `www/assist.js:56-129` (`genWords`)** — two word generators.
    - Rule: CLAUDE.md § Simple "One thing is done by ONE mechanism … A new mechanism covering the old one's gap is the one thing that must not happen … the old one is deleted"; OWNER 2026-09-26 「単語自動生成」 (FEATURE_RULES 405: 「その言語の音と音節の形から」).
    - Evidence: genWords builds from the sounds LETTERS write and spells every candidate through spOf ("a sound no letter writes is a word nobody can spell", 63-67). asWord/makeWord build from `analyze()` statistics and fall back to `addedSnd()` — the whole inventory — and its one caller (import.js:994) stores `hw=seq.join('')`, the IPA string, with no `sp`.
    - Also contradicts assist.js's own header 10-13 ("you say yes, or ask for another") and the reason asSounds was deleted (15-21 "A proposal nobody can refuse is not a proposal"): import puts asWord's output straight into WORDS.
    - class: OWNER (what a meaning-only imported row should become: a genWords word, a word with no spelling, or skipped) — then FIX-HERE deletes asWord+makeWord+pick (+ `analyze()` in core.js if nothing else asks: OTHERS). import.js is OTHERS.
    - confidence: CONFIRMED

23. **`www/assist.js:23-26`** — AI_SEAM comment: "when the hosted model is wired up it replaces the generator below and nothing else. The screens ask for a proposal and get a list back".
    - Rule: FEATURE_RULES 2026-08-12 "Implementation status: moot. There is no AI. ~~`AI_SEAM`~~" (struck) vs 5857-5860 "Build for the online and AI parts now … AI_SEAM in www/glyph.js" (standing) — two written statements disagree; and "the generator below" is now two (asWord returns one sequence, genWords a list).
    - class: OWNER (does an AI seam still exist?) → then comment-only fix here.
    - confidence: CONFIRMED (text)

### ipa.js

24. **`www/ipa.js:181-185`** — comment is inverted: "c is a palatal stop and k is on the chart before it -- so typing ka got ca". On IPA_CONS c is index 10 and k index 12 — c comes FIRST, which is why ka read as ca. FIX-HERE comment-only. CONFIRMED.

25. **`www/ipa.js:28-35`** — "It says what to do with your mouth, in pieces … Thirty-three fragments in each of the ten languages, joined". Nothing composes per-sound descriptions any more: sound.js 412-415 describes the GROUP ("not one of these per symbol either"), keys `ipa.d.m.*`; the fragments `ipa.m./p./h./b.*` are used only as search words (sound.js ipaWords). FIX-HERE comment-only. CONFIRMED.

26. **`www/ipa.js:36-39, 40-98` (IPA_IN)** — the table claims "only the sounds one of them genuinely has … says nothing rather than guessing", and some rows look wrong: `ɤ: ko 으` (으 is already the `ɯ` example, line 81), `χ: fr rue` (French r is ʁ, already line 72), `ʋ: ko 우유`, `ɤ: zh "de"` (pinyin, not the script the other zh rows use). Shown to people on the sound-group page (sound.js openIpaG).
    - class: FIX-HERE data (look: example rows change) — UNCONFIRMED: needs someone who knows those languages.

### grammar-engine/lexicon.js

27. **`www/grammar-engine/lexicon.js:73-84` (`edge`, `WORDCH=/[0-9A-Za-z]/`)** — a meaning is matched INSIDE a longer word in every script but plain ASCII.
    - Rule: the file's own contract (15-18 "It guesses at nothing. A meaning matches or it does not") and 73-77 ("Latin writes it with a space, so 'eat' may not be found inside 'eaten'"); ru/de/fr/es/pt/it/ko interface languages write spaces too.
    - Evidence (run in node): meaning `кот` cut out of `котёл` → `[{word:кот},{gap:"ёл"}]`; `eat`/`eaten` correctly a gap. Same for any accented Latin (é, ü) or Hangul. Reaches the grammar page's example lines (grammar.js gExLine → translate.run).
    - class: FIX-HERE — WORDCH as "a letter of a script that writes spaces" (e.g. Latin incl. diacritics, Greek, Cyrillic, Hangul ranges) — behaviour; no stored data (the line is filled only where empty and then stored, so future filled lines change).
    - confidence: CONFIRMED (measured)

28. **`www/grammar-engine/lexicon.js:31-35, 40`; `model.js:8-12`** — "A model saved before the list existed carries only the string, so it is split back apart HERE". No model is stored: adapter.js:48-54 "Nothing here reads or writes a stored model" and grammar.js gModel ("There was a second road here … `gram2` … It is gone", 2026-09-23). adapter always fills `meanings`, so `else if(trim(word.meaning)) src=String(word.meaning).split(' / ');` is a second road nothing reaches.
    - Rule: § Simple; rule 5; stale comments.
    - class: FIX-HERE — delete the branch and both comments (refactor; engine checks feed `meanings` — confirm tools/grammar-engine-check.mjs has no sample with only `meaning`).
    - confidence: CONFIRMED for www; tools samples UNCONFIRMED

29. **`www/grammar-engine/lexicon.js:5-8, 15-22`** — header quotes docs that no longer say it: "docs/FEATURES.md, under 'A post shown three ways' … Word order (SET.order, six of them)" (FEATURES.md:101 is now "A post shown two ways"; `SET.order` is struck, FEATURES 137; the order is cards, not six); "phGuess() is kept for exactly one job and never used to read a new word" (core.js 3144-3147: phGuess is wPh's fallback AND import's reader; reading.js seqOf reads any non-dictionary headword with it); "shown IN RED … the door to making that word" (OWNER 2026-08-28 「赤文字消して」; nothing draws a gap red or as a door — grammar.js:664-667 says so).
    - class: FIX-HERE comment-only. confidence: CONFIRMED

### grammar-engine/translate.js

30. **`www/grammar-engine/translate.js:825-832` (`marksFor`)** — visible words hard-coded in two languages, bypassing t().
    - Rule: CLAUDE.md rule 2 "Every user-facing string goes through t()"; wording is the owner's (§ Deciding).
    - Evidence: `out.push('ない'); … out.push('た')`, `out.push('not'); … out.push('(past)')`. toNatural's result is written INTO the post's meaning field as text (post.js:952 pwMn → pwMnFollow, OWNER 2026-09-26) and goes up as `post.mn`. i18n-check cannot see it (never a literal handed to toast/fillText).
    - class: OWNER (should an appended "(past)" exist at all, and in which languages) — then FIX-HERE: the caller passes the marks from t() (engine stays globals-free).
    - confidence: CONFIRMED

31. **`www/grammar-engine/translate.js:20-26`** — "What toNatural() says of a line IS put on a post -- as `post.mn`, at the moment it is written or edited, when the writer typed no meaning of their own (pwSend() and pwSaveEdit())". Superseded 2026-09-26: the machine's line is written into the FIELD as the line is typed and "What goes up is the field and nothing else … There used to be a second answer -- an empty field was given pwMn() at the moment of sending" (post.js:953-968). FIX-HERE comment-only. CONFIRMED.

32. **`www/grammar-engine/translate.js:126-132, 183-188, 353-356, 426-430, 551-554, 787-792`** — stale sentences: "in red, where it is the door to making that word" (×4; see 29); "www/grammar.js keeps all six" and "a third and any after it follow the sentence" (the order is a board of cards now — grammar.js 116-125 "The six buttons are gone" — and 326-333 in this same file says every unplaced noun follows); toNatural's "those three" is fine. FIX-HERE comment-only. CONFIRMED.

33. **`www/grammar-engine/translate.js:342-349`** — the comment says the catch-all sweep was taken out because "A net nothing reaches does not catch the next bug, it hides it", and the next line is a catch-all: `for(k=0;k<out.length;k++) if(!out[k].role) out[k].role='MODIFIER';`. Every `tag()` call passes a non-empty role unless a word-order code is the empty string.
    - Rule: § Simple / the comment's own rule.
    - class: FIX-HERE (delete, or state the one case it serves). confidence: UNCONFIRMED — confirm by deleting it and running `npm run` grammar-engine / gramlang checks, and by checking whether orderSeq() can yield ''.

34. **`www/grammar-engine/translate.js:557-561` (`modWords`)** — re-normalises `depth` "because a caller that forgot the argument … every relative clause was dropped". Every caller now passes it (npWrite ← pieceFor ← fromSemantic, which already normalises at 485). This is the plug beside the fix.
    - Rule: CLAUDE.md § Simple ("never add a second thing that asks again").
    - class: FIX-HERE refactor. confidence: CONFIRMED by reading

35. **`www/grammar-engine/translate.js:36-37`** — `CASE_ROLE` is read off `api.morphology` on the line BEFORE the `if(!api) throw` guard, and if morphology were absent `caseFor` would throw a TypeError instead of the file's own message. Load order (index.html 3884-3888) makes it work today. FIX-HERE (swap lines, guard morphology like the others). CONFIRMED (low).

36. **Writing side unreachable from the app: `translate.fromSemantic` (+ `pieceFor`, `npWrite`, `modWords`, `withClass`, `classOf`, `clause*`, `cxJoin`, `standardWord/Say`, `polarWrite/Do/Kind/Rules/Ops`, `caseFor`), `translate.toSemantic`, `morphology.derive`, `model.semanticIR`.**
    - Evidence: grep of www/ — no caller outside grammar-engine; only tools/grammar-engine-check.mjs and tools/gramlang-check.mjs call them. So in the app, the 否定・疑問 rules (OWNER 2026-09-10 「否定する相手で分ける … とエンジンが判断」, grammar.js 289-296 builds them), noun classes (OWNER 2026-09-07), 複文/relative clauses (OWNER 2026-09-07), 比較 and derivations change no output anybody sees: toNatural and translate.run/arrange never apply them.
    - Rule: CLAUDE.md rule 5 (nothing that nothing reaches — dead-check cannot see IIFE internals); owner decisions implemented only in a test harness; "Code confirmed … never stands in for" the feature.
    - class: OWNER — is the engine's writing side a seam for a future feature (then say so in docs/STATE.md/FEATURES.md), or should the app use it (e.g. gExLine / example lines / toNatural), or should it go?
    - confidence: CONFIRMED (grep)

37. **Exports and constructors nothing uses**: `model.morpheme()` (model.js:14) and `model.sentence()` (:23) — no caller in www or tools; `morphemeId` road in morphology `formOf` (never a morpheme in any model the app builds); `translate` exports `srcOrder`, `positionOf`, `markedIds`, `npOrderOf`, `glossLine`, `polarRules`, `polarKind`, `morphology.lookupWord`, `lexicon.keys` — no caller outside the engine files. FIX-HERE refactor (delete or un-export). CONFIRMED.

### grammar-engine/adapter.js, model.js

38. **`www/grammar-engine/adapter.js:15-22`** — the three aliases `pron`/`prep`/`int` and the uppercase fallback `||String(value).toUpperCase()` are kept "for what somebody else's word list might say on the way in", while the same comment says "posKey() in www/shell.js means a word already here is always one of the thirteen" — and the adapter is only ever handed WORDS or `{hw:'x', pos:p}` (grammar.js 523, 563, 2096). The fallback is the exact thing the comment blames ("The fallback made that invisible"). The only road to `ADPOSITION` as a part of speech is the `prep` alias, so translate.js kindOf `p==='ADPOSITION'` (146) is unreachable from the app.
    - Rule: § Simple; rule 5.
    - class: FIX-HERE (delete aliases + fallback → null) — behaviour-neutral for app data. confidence: CONFIRMED

39. **`www/grammar-engine/adapter.js:47` + `model.js:34`** — a second default word order: `legacySet.order||'SOV'` as a STRING, read by `value.split('')` — the exact shape grammar.js 557-562 describes as the 'SADVOV' bug. gModel always passes `orderDef().seq` (a list), and translate.js has its own default `['SUBJECT','OBJECT','VERB']` (190, 482). Two defaults for one question, one of them through a road known to mis-read multi-letter codes.
    - class: FIX-HERE (drop the adapter default and the string split). confidence: CONFIRMED by reading; whether any tool passes a string order UNCONFIRMED.

40. **`www/grammar-engine/adapter.js:1, 45, 47`** — "legacy adapter", `legacyWord:true`, `fromLegacy`, `source:'legacy-adapter'`: the app's current dictionary is not legacy; this is the only road. § Names ("must be telling the truth"). FIX-HERE rename (own commit). CONFIRMED (low).

### morphology.js

41. **`www/grammar-engine/morphology.js:108-116`** — "`derivation()` has been in model.js since Phase 1 with nothing in www/ that applied it … These three are that missing side": `derive()` still has no caller in www (see 36); only the read side is reached (parseToken → parseDerived). FIX-HERE comment, or OWNER with 36. CONFIRMED.

### OTHERS (outside my files, found on the way)

42. **CLAUDE.md § Layout** — "`www/ipa.js`, `reading.js` | spelling → IPA, IPA → per-language respelling" (reading.js no longer respells: reading.js 20-26) and "`www/assist.js`, `grammar.js` | what the app proposes: sounds, letters, words" (assist proposes words only; asSounds deleted, CHANGELOG ~12800). Doc fix.
43. **`www/wordsheet.js:16-18`** — "www/reading.js still has makeWord() and www/assist.js still proposes sounds, letters and words everywhere else in the app" — stale (same reason).
44. **`www/import.js:980-1000`** — the asWord road of item 22.
45. **`www/home.js:2691` (`langDrop` swipe)** — same confirm question as item 4.
46. **`www/home.js:2601`** — uses `t('notes.save')` for `saveName` (a notes key on another screen) — the key is the notes chapter's name for a word it no longer shows.
47. **`www/index.html` `.ntrow`** — `font:inherit` instead of font-size/line-height on the row class (CLAUDE.md § Rows); rows with and without a body line differ in height — UNCONFIRMED whether press counts that.
48. **docs/FEATURE_RULES.md 5857-5860 vs 5905** — AI_SEAM standing vs struck (item 23).

---

### Counts
- FIX-HERE: 30 (items 1,3,5,6,7,8,10,11,13,14,15,16,17,18,19,20,21,24,25,26,27,28,29,31,32,33,34,35,37,38,39,40,41 — some also carry an OWNER half; counted where the fix is ours)
- OWNER: 8 (2,4,9,22,23,30,36, plus the wording half of 12)
- OTHERS: 8 (12, 42-48)
- UNCONFIRMED among them: 6,7(part),14(part),26,28(tools part),33,39(part),47

### Coverage — read in full
- www/grammar-engine/adapter.js 1-55 (pos, mnList, meanings, idOf, meta, words, fromLegacy)
- www/grammar-engine/lexicon.js 1-123 (trim, norm, meaningsOf, keys, find, edge, isMark, bare, cut)
- www/grammar-engine/model.js 1-54 (id, object, array, word, morpheme, derivation, inflection, grammarRule, sentence, semanticIR, wordOrder, npOrder, languageModel)
- www/grammar-engine/morphology.js 1-211 (findById, formOf, conditionsHold, applies, derives, derivesWord, stemOf, add, featureMatches, caseRole, analyzeForm, inflect, derive, analyzeDerivation, parseDerived, lookupWord, formToken, parseToken, parseSentence)
- www/grammar-engine/translate.js 1-884 (rulesFor, positionOf, npOrderOf, markedIds, srcOrder, classOf, isMarked, kindOf, attach, tag, arrange+inner fns, run, line, meaningOf, toSemantic, caseFor, clauseMark, clauseText, clausesOf, fromSemantic, withClass, cxJoin, isPhrase, modWords, npWrite, standardWord, standardSay, pieceFor, surfaces, polarKind, polarRules, polarOps, polarVerbAt, polarDo, polarWrite, isSOV, targetOrder, marksFor, glossToken, glossLine, toNatural)
- www/assist.js 1-129 (asWord, asOrder, genShapes, genSounds, genWords)
- www/ipa.js 1-287 (tables, ipaIn, ipaAll, ipaIsVowel, IPA_WAS, IPA_ROMAN, ipaRoman, ipaLongest, ipaWasAt, ipaFromRoman, longCut)
- www/reading.js 1-99 (srcKey, seqOf, pick, taken, makeWord, orphan comments)
- www/notes.js 1-347 (ntRead, saveNotes, ntCut, ntHead, ntBody, openNote, ntReadHTML, openNoteEdit, FORM_OPEN, ntKeepOn, ntTyped, ntSetT/B, saveNote, ntKept, delNoteGo, swipe ntSw*, ntSwTapClose, ntFound, NTSEL ntSel*, HELP.notes, vNotes)
- www/voice.js 1-305 (vxCtx, vxWake, tables, vxVowel, vxCons, vxFormant, vxVoiced, vxNoise, vxEnv, vxOne, vxPlay, vxCut, sayPh, sayOne, VXRUN)
- Cross-read for verification: shell.js keepOn/keepDrop/keepDrafting/keepSave/keepNo (452-765), core.js langWrites/langHold (1530-1560), slWr (1068-), wPh/phGuess (3123-3160), onboard.js obNeed/makeNeed (1203-1240), grammar.js orderDef/gRules/gModel/gLay/gExLine (112-125, 280-300, 540-680), post.js pwMn (950-977), words.js vGen (585-700), sound.js ipaWords/openIpaG (375-450), sns.js PAGE_READS (660-732), act-map.js registrations, i18n en/ja notes.* keys, git show 876710e8.
- act-map: every DO/IN name in notes.js and voice.js is registered (openNote, openNoteEdit, ntSelTap, ntSwTapClose, delNoteGo, ntSelDel, ntSelOn, ntSelOff, sayPh; actIn ntSetT, ntSetB). No on*= attributes, no confirm/alert/prompt, no border/radius style from JS in these files.

