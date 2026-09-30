/* ---------------------------------------------------------------------------
   tools/video/scripts.mjs — what each film presses, in order.

   One entry per video. The key is the file name and the id in
   docs/scope/r133-video/topics.md. A step is read by tools/video/rec.mjs:

     cap: 'text'        the caption over the top ('' takes it off);
                        capAt: px from the top when the top is where the thing is
     go: route, a: arg  arrive on a route the way a door does (no finger)
     tap: target        press it -- 'do:name' for the button carrying that
                        data-do, 'text:words' for what it says, or a selector.
                        nth: which of several; dx/dy: where inside it
     type: 'text'       type, into: target to press first; lingua: true types
                        each letter as the Lingua keyboard does (its PUA code)
     draw: [[[u,v],..]] strokes, each a list of points 0..1 inside `on`
                        (default: the first canvas)
     eval: 'js'         set something up in the page (never a press)
     wait: ms           how long to stand after the step (default 500)

   `setup` runs before filming starts. `blank` names letters left undrawn
   (every other a-z is given a shape by rec.mjs, see SHAPES there).
   --------------------------------------------------------------------------- */

/* what a keyboard's keys are on the page: the keys, the empty frames and the
   handwriting pad */
const KEYS = '[data-do=kbTapKey],[data-do=kbCellSel],.kbpad';

/* the fixture's language as an English film shows it: see 'words-make' */
const DICT_TIDY =
  "WORDS.forEach(function (w) {" +
  "  if (w.sub === '自動詞') w.sub = 'intransitive';" +
  "  if (w.sub === '他動詞') w.sub = 'transitive';" +
  "  if (w.hw === 'tirok') delete w.fm;" +
  "  if (w.hw === 'tir') w.fms = [];" +
  /* `at` is 1..11 in the fixture, which a word's page reads as 1970 */
  "  if (w.at < 1e6) w.at = Date.UTC(2026, 8, 1) + w.at * 86400000;" +
  "});" +
  /* t is the fixture's borrowed letter (l2, Ϙ), which rec.mjs's inkAll()
     leaves alone, so every t in the film came out roman: a shape of its
     own here, a T on its side like the rest */
  "LETTERS.forEach(function (l) {" +
  "  if (ltName(l) !== 't') return;" +
  "  l.ch = ''; l.st = [{ pts: [[170,112],[170,688]] }, { pts: [[170,400],[688,400]] }];" +
  "});" +
  "installScriptFont(); installTypeFont(); render();";

export const SCRIPTS = {
  /* 1-01 — draw a letter of your own */
  'draw-a-letter': {
    blank: ['m'],
    setup: [{ go: 'build' }],
    steps: [
      { cap: 'Draw your own alphabet', wait: 1400 },
      { tap: 'text:Letters', wait: 900 },
      { tap: 'text:Alphabet', wait: 900 },
      { cap: 'Pick a letter', wait: 300 },
      { tap: 'do:ltGo', nth: 12, wait: 900 },
      { cap: 'Tap it to open the pen', capAt: 240, wait: 300 },
      { tap: 'do:editLetter', wait: 1000 },
      { cap: 'Draw with your finger', wait: 200 },
      { draw: [
          [[0.22, 0.78], [0.22, 0.34]],
          [[0.22, 0.40], [0.36, 0.28], [0.50, 0.40], [0.50, 0.78]],
          [[0.50, 0.40], [0.64, 0.28], [0.78, 0.40], [0.78, 0.78]],
        ], gap: 380, wait: 700 },
      { cap: 'Round bends the last line', wait: 300 },
      { tap: 'do:geCircle', wait: 1300 },
      { cap: 'Save it', wait: 300 },
      { tap: 'do:keepPress', wait: 1500 },
      { cap: 'Saved', capAt: 330, wait: 1400 },
      { tap: 'do:back', wait: 900 },
      { cap: 'Now it is part of your alphabet', capAt: 300, wait: 2600 },
    ],
  },

  /* 2-01 — build a keyboard for your language */
  'build-a-keyboard': {
    setup: [{ go: 'build' }],
    steps: [
      { cap: 'A keyboard for your own language', capAt: 360, wait: 2200 },
      { tap: 'text:Keyboard', wait: 900 },
      { cap: 'Add one', capAt: 360, wait: 300 },
      { tap: 'do:kbNew', wait: 1000 },
      { cap: 'Pick a layout', capAt: 470, wait: 900 },
      { tap: 'text:Flick', wait: 1000 },
      { cap: 'Your letters are already on it', capAt: 36, wait: 2800 },
      { cap: 'Tap a key', capAt: 555, wait: 200 },
      { tap: 'do:kbTapKey', nth: 2, wait: 700 },
      { tap: 'do:kbOpenSel', wait: 1100 },
      { cap: 'Flick it four ways', capAt: 560, wait: 2000 },
      { tap: 'do:back', wait: 900 },
      { cap: 'Save it', capAt: 555, wait: 300 },
      { tap: 'do:keepPress', wait: 1600 },
      { cap: 'Your keyboard is ready', capAt: 360, wait: 2800 },
    ],
  },

  /* 4-05 — answer the day's prompt */
  'post-to-the-prompt': {
    setup: [
      { eval: "DAY = { id: 7, on_day: '2026-09-29', text: 'What did you eat today?', says: { en: 'What did you eat today?' } }" },
      { go: 'feed' },
    ],
    steps: [
      { cap: 'A new prompt every day', capAt: 470, wait: 2400 },
      { cap: 'Tap it to answer', capAt: 470, wait: 200 },
      { tap: 'do:openPost', nth: 0, wait: 1000 },
      { cap: 'Write in your own language', capAt: 330, wait: 300 },
      { type: 'tir mos kano', lingua: true, into: 'do:pwFocusLn', delay: 230, wait: 1400 },
      { cap: 'The prompt comes with it', capAt: 330, wait: 2400 },
      { cap: 'Post it', capAt: 330, wait: 300 },
      { tap: 'do:pwSend', wait: 1600 },
      { cap: 'Your answer is on the timeline', capAt: 470, wait: 2600 },
      { cap: 'Everyone answers the same prompt', capAt: 470, wait: 2600 },
    ],
  },

  /* r/conlangs, 2026-09-30 -- building a keyboard, the whole road: the list,
     one board, keys in and out, a row and a column selected and acted on,
     a key made two rows tall, a key given an IPA letter and one given a
     drawn letter, Save. Portrait at an iPhone's own 393x852, stills at 3x
     (1179x2556), all into promo/keyboard/. Two boards are made before the
     camera starts (kbAdd() -- the app's own), so the list has three. */
  'keyboard-reddit': {
    view: [393, 852, 3], size: [1080, 2340], out: 'promo/keyboard', hq: true, slow: 2,
    music: 'echoes_of_lumen-vlog-background-music-596303.mp3',
    /* the six layouts kbNew() offers, each made in a browser of its own and
       cut down to its keys (rec.mjs, takeCards) */
    cards: [
      { eval: "kbAdd('qwerty')", sel: KEYS },
      { eval: "kbAdd('flick')", sel: KEYS },
      { eval: "kbAdd('tap')", sel: KEYS },
      { eval: "kbAdd('chart')", sel: KEYS },
      { eval: "kbAdd('abc')", sel: KEYS },
      { eval: "kbAdd('hand')", sel: KEYS },
    ],
    setup: [
      { eval: "kbAdd('qwerty'); kbAdd('abc');" },
      { go: 'kb' },
    ],
    /* A key is added only where it is used, one at a time: beside z to be
       joined to it, under t to make t two rows tall, and two more for a
       character each 「最初に3つもキー足さなくていいよ」「横同士でくっつけて
       1つのキーにする動作入れたら」 OWNER 2026-09-30. Joining keeps the LEFT
       key (kbJoin) and the UPPER one (kbVJoin), so the key added is the one
       that goes and no letter is lost. Row 3 is gap, u v w x y z, gap. */
    steps: [
      { cap: 'Build a keyboard for your conlang', capAt: 600, wait: 2000, still: '01-keyboard-list' },
      { cap: 'Pick one', capAt: 600, wait: 200 },
      { tap: '[data-do=kbGoBoard][data-a="[2]"]', wait: 1200 },
      { cap: 'Every key is a letter you drew', capAt: 600, wait: 1800, still: '02-editor' },
      /* add one, beside z, and join the two */
      { cap: 'Add a key', capAt: 600, wait: 200 },
      { tap: '[data-do=kbCellSel][data-a="[2,16,2]"]', wait: 400 },
      { tap: 'do:kbCellPut', wait: 700 },
      { cap: 'Join keys side by side', capAt: 600, wait: 200 },
      { tap: '[data-do=kbTapKey][data-a="[2,6]"]', wait: 350 },
      { tap: '[data-do=kbTapKey][data-a="[2,7]"]', wait: 500 },
      { tap: 'do:kbJoinSel', wait: 1100 },
      /* delete: q -- the first press lets go of the wide z */
      { cap: 'Delete keys', capAt: 600, wait: 200 },
      { tap: '[data-do=kbTapKey][data-a="[1,6]"]', wait: 250 },
      { tap: '[data-do=kbTapKey][data-a="[1,6]"]', wait: 400 },
      { tap: 'do:kbCut', wait: 900 },
      /* a row: select it, push it left, centre, right */
      { cap: 'Select a row', capAt: 600, wait: 200 },
      { tap: '[data-do=kbHeadRow][data-a="[1]"]', wait: 800, still: '03-row-selected' },
      { cap: 'Push it left, centre or right', capAt: 600, wait: 200 },
      { tap: '[data-do=kbAlign][data-a=\'["l"]\']', wait: 650 },
      { tap: '[data-do=kbAlign][data-a=\'["c"]\']', wait: 650 },
      { tap: '[data-do=kbAlign][data-a=\'["r"]\']', wait: 850 },
      /* a column: select it (the first press lets go of the row), delete, undo */
      { cap: 'Select a column', capAt: 600, wait: 200 },
      { tap: '[data-do=kbHeadCol][data-a="[4]"]', wait: 250 },
      { tap: '[data-do=kbHeadCol][data-a="[4]"]', wait: 800, still: '04-column-selected' },
      { cap: 'Delete it in one go', capAt: 600, wait: 200 },
      { tap: 'do:kbCut', pop: true, wait: 600 },
      { tap: 'do:popYes', wait: 1000 },
      { cap: 'Undo is one tap', capAt: 600, wait: 200 },
      { tap: 'do:kbUndo', wait: 1000 },
      /* two rows tall: a key under t, then t and it joined */
      { cap: 'Make a key two rows tall', capAt: 600, wait: 200 },
      { tap: '[data-do=kbCellSel][data-a="[2,18,2]"]', wait: 350 },
      { tap: 'do:kbCellPut', wait: 500 },
      { tap: '[data-do=kbTapKey][data-a="[1,9]"]', wait: 350 },
      { tap: '[data-do=kbTapKey][data-a="[2,7]"]', wait: 500 },
      { tap: 'do:kbJoinSel', wait: 1100 },
      /* a key with an IPA letter on it */
      { cap: 'Put any character on a key', capAt: 600, wait: 200 },
      { tap: '[data-do=kbCellSel][data-a="[2,0,2]"]', wait: 350 },
      { tap: 'do:kbCellPut', wait: 450 },
      { tap: '[data-do=kbTapKey][data-a="[2,0]"]', wait: 400 },
      { tap: 'do:kbOpenSel', wait: 0 },
      { cap: '', wait: 900, still: '05-pick-a-character' },
      { tap: '[data-do=pkKind][data-a*=ipa]', wait: 800 },
      { tap: '[data-do=pkTake][data-a*="=ʃ"]', wait: 700 },
      { tap: 'do:keepPress', wait: 300 },
      { cap: 'IPA, accents, any script', capAt: 600, wait: 1300 },
      /* and one with a letter you drew: q, back where it was */
      { cap: 'Or a letter you drew', capAt: 600, wait: 200 },
      { tap: '[data-do=kbCellSel][data-a="[1,0,2]"]', wait: 350 },
      { tap: 'do:kbCellPut', wait: 450 },
      { tap: '[data-do=kbTapKey][data-a="[1,0]"]', wait: 400 },
      { tap: 'do:kbOpenSel', wait: 0 },
      { cap: '', wait: 800 },
      { tap: '[data-do=pkKind][data-a*=own]', wait: 800 },
      { tap: '[data-do=pkTake][data-a*="lt.q"]', wait: 700 },
      { tap: 'do:keepPress', wait: 300 },
      { cap: 'Save it', capAt: 600, wait: 2600, still: '06-finished-keyboard' },
      { tap: 'do:keepPress', wait: 1000 },
      /* and every layout a keyboard can start from, one after another */
      { card: 0, cardTitle: 'START FROM ANY LAYOUT', cap: 'QWERTY', capAt: 600, wait: 950 },
      { card: 1, cardTitle: 'START FROM ANY LAYOUT', cap: 'Flick', capAt: 600, wait: 950 },
      { card: 2, cardTitle: 'START FROM ANY LAYOUT', cap: 'Tap', capAt: 600, wait: 950 },
      { card: 3, cardTitle: 'START FROM ANY LAYOUT', cap: 'Chart', capAt: 600, wait: 950 },
      { card: 4, cardTitle: 'START FROM ANY LAYOUT', cap: 'ABC', capAt: 600, wait: 950 },
      { card: 5, cardTitle: 'START FROM ANY LAYOUT', cap: 'Handwriting', capAt: 600, wait: 950 },
    ],
  },

  /* Drawing, part 2 -- the tools under the square, one at a time, each with
     what it does. On a blank m, filmed as the keyboard film was. */
  'draw-tools': {
    view: [393, 852, 3], size: [1080, 2340], out: 'promo/draw', hq: true, slow: 2,
    music: 'sigmamusicart-background-music-inspiring-525840.mp3',
    blank: ['m'],
    setup: [{ go: 'letter', a: 'lt.m' }, { tap: 'do:editLetter', wait: 600 }],
    steps: [
      { cap: 'Draw with your finger', capAt: 650, wait: 300 },
      { draw: [[[0.30, 0.66], [0.50, 0.30], [0.70, 0.66], [0.30, 0.66]]], gap: 300, wait: 500 },
      { cap: 'Fill: a closed shape is filled in', capAt: 650, wait: 200 },
      { tap: 'do:geFill', wait: 1300, still: 't1-fill' },
      { cap: 'Round: bend the last line', capAt: 650, wait: 200 },
      { draw: [[[0.28, 0.24], [0.50, 0.14], [0.72, 0.24]]], gap: 300, wait: 300 },
      { tap: 'do:geCircle', wait: 1100, still: 't2-round' },
      { cap: 'Press it again to straighten it', capAt: 650, wait: 200 },
      { tap: 'do:geCircle', wait: 1000 },
      { cap: 'Undo and redo', capAt: 650, wait: 200 },
      { tap: 'do:geUndo', wait: 700 },
      { tap: 'do:geRedo', wait: 900 },
      { cap: 'Lasso: circle strokes to pick them up', capAt: 650, wait: 200 },
      { tap: 'do:geLasso', wait: 500 },
      { draw: [[[0.20, 0.72], [0.20, 0.24], [0.80, 0.24], [0.80, 0.72], [0.20, 0.72]]], gap: 300, wait: 700, still: 't3-lasso' },
      { cap: 'Drag them anywhere', capAt: 650, wait: 200 },
      { draw: [[[0.30, 0.66], [0.30, 0.80]]], gap: 300, wait: 900, log: 'JSON.stringify([GE.lsSel, GE.st[0].pts[0]])' },
      { cap: 'Or throw them away', capAt: 650, wait: 200 },
      { tap: 'do:geLsBin', wait: 1000, log: 'GE.st.length' },
      { cap: 'Undo brings them back', capAt: 650, wait: 200 },
      { tap: 'do:geUndo', wait: 1000 },
      { tap: 'do:geLasso', wait: 500 },
      { cap: 'Clear takes everything off', capAt: 650, wait: 200 },
      { tap: 'do:geClear', wait: 1000 },
      { tap: 'do:geUndo', wait: 900 },
      { cap: 'Save it', capAt: 650, wait: 300 },
      { tap: 'do:keepPress', wait: 1500, still: 't4-saved' },
    ],
  },

  /* The dictionary, in two films 「いいよ」 OWNER 2026-09-30 -- the one
     film asked for was split in two: making words, and using the
     dictionary. Filmed as the keyboard film was (393x852, 1080x2340, hq,
     slow 2, a track under the taps), into promo/words/.

     Two things in the fixture's language are put right in the page before
     filming, and only in the page: a subclass and a derivation label it
     carries in Japanese, which an English film would show as they are, and
     a future form of tir with no spelling, which the card draws in roman. */
  'words-make': {
    view: [393, 852, 3], size: [1080, 2340], out: 'promo/words', hq: true, slow: 2,
    music: 'sub_clair-background-music-550483.mp3',
    setup: [
      { eval: DICT_TIDY },
      { go: 'words' },
    ],
    /* Two words and nothing else: one typed, one generated, each given a
       meaning, saved, and found again by searching for what it means. The
       first cut also chose a part of speech, scrolled to the forms a rule
       makes and scrolled the list -- 「バグってるし、分かりにくい」 OWNER
       2026-09-30: a saved noun brings its diminutive into the list as a
       word with no meaning, and Generate changes the part of speech on its
       own, and on film both read as faults. A search finds the new word
       wherever it sorts, so nothing is scrolled. */
    steps: [
      { cap: 'Make words for your conlang', capAt: 600, wait: 1800, still: 'make-01-lexicon' },
      { cap: 'Tap + to add one', capAt: 600, wait: 200 },
      { tap: 'do:openAdd', wait: 1000 },
      { cap: 'Type it in your own letters', capAt: 600, wait: 200 },
      { type: 'velo', lingua: true, into: '#wd-ln', delay: 300, wait: 700 },
      { cap: 'Its sound is worked out for you', capAt: 600, wait: 2000, still: 'make-02-typed' },
      { cap: 'Write what it means', capAt: 600, wait: 200 },
      { tap: 'do:wdMnOpen', wait: 400 },
      { type: 'bird', delay: 140, wait: 300 },
      { eval: "wdAddMn()", wait: 1200, still: 'make-03-meaning' },
      { cap: 'Save it', capAt: 600, wait: 200 },
      { tap: 'do:keepPress', wait: 1300 },
      { cap: 'Now it is in your dictionary', capAt: 600, wait: 200 },
      { type: 'bird', into: '#w-q', delay: 200, wait: 2200, still: 'make-04-found' },
      { tap: '#w-x', wait: 700 },
      { cap: 'Out of ideas?', capAt: 600, wait: 900 },
      { tap: 'do:openAdd', wait: 900 },
      { cap: 'Generate a word that fits your sounds', capAt: 600, wait: 300 },
      { tap: 'do:wdGen', wait: 1100 },
      { tap: 'do:wdGen', wait: 1100 },
      { tap: 'do:wdGen', wait: 1500, still: 'make-05-generated' },
      { cap: 'Write what it means', capAt: 600, wait: 200 },
      { tap: 'do:wdMnOpen', wait: 400 },
      { type: 'star', delay: 140, wait: 300 },
      { eval: "wdAddMn()", wait: 900 },
      { cap: 'Save it', capAt: 600, wait: 200 },
      { tap: 'do:keepPress', wait: 1300 },
      { cap: 'Your language grows', capAt: 600, wait: 200 },
      { type: 'star', into: '#w-q', delay: 200, wait: 2600, still: 'make-06-grows' },
    ],
  },

  'words-use': {
    view: [393, 852, 3], size: [1080, 2340], out: 'promo/words', hq: true, slow: 2,
    music: 'verclub_music-background-music-571037.mp3',
    setup: [
      { eval: DICT_TIDY },
      { go: 'words' },
    ],
    steps: [
      { cap: 'Your conlang’s dictionary', capAt: 600, wait: 2000, still: 'use-01-lexicon' },
      { cap: 'Search by word or meaning', capAt: 600, wait: 200 },
      { type: 'see', into: '#w-q', delay: 260, wait: 1800, still: 'use-02-search' },
      { tap: '#w-x', wait: 700 },
      { cap: 'Only the verbs', capAt: 600, wait: 200 },
      { tap: 'do:openFil', wait: 900 },
      { tap: '[data-do=wordsSetFil][data-a=\'["v"]\']', wait: 1600, still: 'use-03-verbs' },
      { cap: 'Every word has a page', capAt: 600, wait: 200 },
      { tap: '[data-do=openWord][data-a=\'["tir"]\']', wait: 2000, still: 'use-04-word' },
      { cap: 'Every form of it', capAt: 600, wait: 200 },
      { scroll: 420, wait: 2200 },
      { cap: 'And its family tree', capAt: 600, wait: 200 },
      { tap: 'text:Family tree', wait: 2000, still: 'use-05-tree' },
      { tap: 'do:back', wait: 900 },
      { cap: 'Share it as a card', capAt: 600, wait: 200 },
      { tap: 'do:cardOpen', wait: 2800, still: 'use-06-card' },
    ],
  },
};
