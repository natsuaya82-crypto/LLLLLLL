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
     pick: 'file'       the photo the phone's picker answers with (rec.mjs)
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

/* The fixture's rules as the app writes them now: its old diminutive (a
   derivation for every part of speech, which the new-word sheet saves as a
   word with no meaning) taken off, the plural left. And an example on tir,
   so its page has one to read. See 'words-make'. */
const DICT_RULES =
  "STG.fm = (STG.fm || []).filter(function (r) { return r.fm !== 'dim'; });" +
  "WORDS.forEach(function (w) {" +
  "  if (w.hw === 'tir') w.ex = [{ ln: 'tir kano', gl: 'I see the mountain' }];" +
  "});" +
  "render();";

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
      { tap: 'do:popYes', wait: 1000, still: 'use-09-deleted' },
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
     what it does. On a blank m, filmed as the keyboard film was. The lasso
     rings every stroke, so what is carried and thrown away is the letter. */
  'draw-tools': {
    view: [393, 852, 3], size: [1080, 2340], out: 'promo/draw', hq: true, slow: 2,
    music: 'sigmamusicart-background-music-inspiring-525840.mp3',
    blank: ['m'],
    setup: [{ go: 'letter', a: 'lt.m' }, { tap: 'do:editLetter', wait: 600 }],
    steps: [
      { cap: 'Draw with your finger', capAt: 650, wait: 300 },
      { draw: [[[0.26, 0.26], [0.50, 0.14], [0.74, 0.26]]], gap: 300, wait: 500 },
      { cap: 'Round bends the last line', capAt: 650, wait: 200 },
      { tap: 'do:geCircle', wait: 1100, still: 't1-round' },
      { cap: 'Tap again to straighten it', capAt: 650, wait: 200 },
      { tap: 'do:geCircle', wait: 1000 },
      { cap: 'Close a shape', capAt: 650, wait: 200 },
      { draw: [[[0.30, 0.72], [0.50, 0.36], [0.70, 0.72], [0.30, 0.72]]], gap: 300, wait: 400 },
      { cap: 'Fill paints the inside', capAt: 650, wait: 200 },
      { tap: 'do:geFill', wait: 1300, still: 't2-fill' },
      { cap: 'Five line weights', capAt: 650, wait: 200 },
      { tap: '[data-do=geWidth][data-a="[6]"]', wait: 700 },
      { tap: '[data-do=geWidth][data-a="[24]"]', wait: 700 },
      { tap: '[data-do=geWidth][data-a="[14]"]', wait: 900, still: 't3-weight' },
      { cap: 'Undo and redo', capAt: 650, wait: 200 },
      { tap: 'do:geUndo', wait: 700 },
      { tap: 'do:geUndo', wait: 700 },
      { tap: 'do:geRedo', wait: 600 },
      { tap: 'do:geRedo', wait: 900 },
      { cap: 'Lasso: ring strokes to pick them up', capAt: 650, wait: 200 },
      { tap: 'do:geLasso', wait: 500 },
      { draw: [[[0.14, 0.80], [0.14, 0.08], [0.86, 0.08], [0.86, 0.80], [0.14, 0.80]]], gap: 300, wait: 800, still: 't4-lasso', log: 'JSON.stringify(GE.lsSel)' },
      { cap: 'Drag them anywhere', capAt: 650, wait: 200 },
      { draw: [[[0.50, 0.36], [0.50, 0.48]]], gap: 300, wait: 1000, log: 'JSON.stringify([GE.lsSel, GE.st[1] && GE.st[1].pts[0]])' },
      { cap: 'Or throw them away', capAt: 650, wait: 200 },
      { tap: 'do:geLsBin', wait: 1000, log: 'GE.st.length' },
      { cap: 'Undo brings them back', capAt: 650, wait: 200 },
      { tap: 'do:geUndo', wait: 1000 },
      { tap: 'do:geLasso', wait: 500 },
      { cap: 'Draw on a second layer', capAt: 650, wait: 200 },
      { tap: 'do:geLayerAdd', wait: 700 },
      { draw: [[[0.50, 0.08], [0.50, 0.30]]], gap: 300, wait: 900, still: 't5-layer' },
      { tap: '[data-do=geLayer][data-a="[1]"]', wait: 900 },
      { tap: '[data-do=geLayer][data-a="[2]"]', wait: 900 },
      { cap: 'Clear takes a layer off', capAt: 650, wait: 200 },
      { tap: 'do:geClear', wait: 1000 },
      { tap: 'do:geUndo', wait: 900 },
      { cap: 'Save it', capAt: 650, wait: 300 },
      { tap: 'do:keepPress', wait: 2200, still: 't6-saved' },
    ],
  },

  /* The alphabet chapter, round the whole of it: the three lists, a letter's
     sound, a letter borrowed from a script that exists, the marks, the digits
     and the base they count in, and the way out as a font. */
  'alphabet': {
    view: [393, 852, 3], size: [1080, 2340], out: 'promo/alphabet', hq: true, slow: 2,
    music: 'atlasaudio-music-background-606270.mp3',
    setup: [{ go: 'letters' }],
    steps: [
      { cap: 'Your alphabet, all in one place', capAt: 600, wait: 1800, still: 'a1-letters' },
      { cap: 'a to z, in your own shapes', capAt: 600, wait: 200 },
      { tap: '[data-do=go][data-a=\'["ltset","alpha"]\']', wait: 1800, still: 'a2-alphabet' },
      { cap: 'Tap to hear one', capAt: 600, wait: 200 },
      { tap: 'do:sayPh', nth: 0, wait: 900 },
      { tap: 'do:sayPh', nth: 1, wait: 1000 },
      { cap: 'Sort them your way', capAt: 600, wait: 200 },
      { tap: 'do:nextLtSort', wait: 1500 },
      { tap: 'do:nextLtSort', wait: 900 },
      { cap: 'Every letter has a sound', capAt: 600, wait: 200 },
      { tap: '[data-do=ltGo][data-a=\'["lt.c"]\']', wait: 1000 },
      { tap: 'do:openSnd', wait: 1200, still: 'a3-sounds' },
      { cap: 'Hear every sound of your language', capAt: 600, wait: 200 },
      { tap: 'do:sayPh', nth: 0, wait: 800 },
      { tap: 'do:sayPh', nth: 4, wait: 800 },
      { tap: 'do:sayPh', nth: 6, wait: 1000 },
      { tap: 'do:back', wait: 900 },
      { cap: 'Or borrow one from a real script', capAt: 600, wait: 200 },
      { tap: 'do:back', wait: 900 },
      { tap: '[data-do=ltGo][data-a=\'["lt.q"]\']', wait: 1000 },
      { tap: 'do:openPick', wait: 1200, still: 'a4-scripts' },
      { tap: '[data-do=pkKind][data-a*=greek]', wait: 1100 },
      { tap: '[data-do=pkTake][data-a*="Ψ"]', wait: 900 },
      { tap: 'do:keepPress', wait: 700 },
      { tap: 'do:back', wait: 1800, still: 'a5-borrowed' },
      { cap: 'Even ! and ? are yours', capAt: 600, wait: 200 },
      { tap: 'do:back', wait: 700 },
      { tap: 'do:back', wait: 900 },
      { tap: '[data-do=go][data-a=\'["ltset","mark"]\']', wait: 1800 },
      { cap: 'Your own digits too', capAt: 600, wait: 200 },
      { tap: 'do:back', wait: 800 },
      { tap: '[data-do=go][data-a=\'["ltset","num"]\']', wait: 1800, still: 'a6-digits' },
      { cap: 'Take them out as a font', capAt: 600, wait: 200 },
      { tap: 'do:back', wait: 800 },
      { tap: '[data-do=go][data-a=\'["ltout"]\']', wait: 3400, still: 'a8-export' },
    ],
  },

  /* The grammar book: its chapters, the word order put in by pressing the
     parts in the order they go, a line made from its meaning alone (gExLine,
     www/grammar.js -- the dictionary and the order), and a rule that makes a
     verb's past, answered on a verb's own page. */
  'grammar': {
    view: [393, 852, 3], size: [1080, 2340], out: 'promo/grammar', hq: true, slow: 2,
    music: 'echoes_of_lumen-vlog-background-music-596303.mp3',
    setup: [{ eval: DICT_TIDY }, { eval: DICT_RULES }, { go: 'gram' }],
    steps: [
      { cap: 'A whole grammar book, ready to fill', capAt: 600, wait: 2000, still: 'g1-book' },
      { cap: 'Start with the sentence', capAt: 600, wait: 200 },
      { tap: '[data-do=go][data-a*="book:snt"]', wait: 1000 },
      { tap: '[data-do=go][data-a*="v2:order"]', wait: 1000 },
      { cap: 'Tap the parts in the order they go', capAt: 600, wait: 200 },
      { tap: '[data-do=g2Put][data-a=\'["S"]\']', wait: 600 },
      { tap: '[data-do=g2Put][data-a=\'["O"]\']', wait: 600 },
      { tap: '[data-do=g2Put][data-a=\'["V"]\']', wait: 1400, still: 'g2-order' },
      { cap: 'Write only what a line means', capAt: 600, wait: 200 },
      { tap: 'do:stExOpen', wait: 800 },
      { type: 'river see mountain', into: '#sx-gl', delay: 90, wait: 400 },
      { cap: 'It is put in your words, in your order', capAt: 600, wait: 200 },
      { eval: "stAddEx('order')", wait: 2400, still: 'g3-line' },
      { tap: 'do:keepPress', wait: 900 },
      { cap: 'Save it', capAt: 600, wait: 200 },
      { tap: 'do:keepPress', wait: 1000 },
      { cap: 'Rules make the forms of a word', capAt: 600, wait: 200 },
      { go: 'gram' },
      { tap: '[data-do=go][data-a*="book:verb"]', wait: 900 },
      { tap: '[data-do=go][data-a*="v2:tense"]', wait: 1100 },
      { tap: '[data-do=fmrNew][data-a*="pst"]', wait: 1000 },
      { cap: 'The past: put -a on the end', capAt: 600, wait: 200 },
      { type: 'a', lingua: true, into: '#fmr-add', delay: 300, wait: 1400, still: 'g4-rule' },
      { tap: 'do:keepPress', wait: 1100 },
      { cap: 'Every verb follows it', capAt: 600, wait: 200 },
      { go: 'words' },
      { tap: '[data-do=openWord][data-a=\'["lom"]\']', wait: 400 },
      { wait: 2800, still: 'g5-past' },
    ],
  },

  /* A post: a line in your own letters, what it means, a tag, a photograph,
     and the timeline it lands on. The photograph is tools/video/
     photo-mountains.jpg, made for this film (a mountain at dusk, the line is
     "kano mos" -- the mountain is tall). */
  'post': {
    view: [393, 852, 3], size: [1080, 2340], out: 'promo/post', hq: true, slow: 2,
    music: 'sigmamusicart-background-music-inspiring-525840.mp3',
    /* The fixture's own post (p1) is a post never sent, cut with a
       half-drawn alphabet: on film it reads "Not sent" over "7ano mos tir".
       It is taken out of the page for this film only. */
    setup: [{ eval: "POSTS = POSTS.filter(function (p) { return p.id !== 'p1'; }); render();" }, { go: 'feed' }],
    steps: [
      { cap: 'Post in a language only you made', capAt: 600, wait: 2000, still: 'p1-feed' },
      { cap: 'Tap + to write', capAt: 600, wait: 200 },
      { tap: '[data-do=openPost][data-a*=new]', wait: 900 },
      { cap: 'Type in your own letters', capAt: 600, wait: 200 },
      { type: 'kano mos', lingua: true, into: 'do:pwFocusLn', delay: 260, wait: 1200, still: 'p2-line' },
      { cap: 'Its meaning comes from your dictionary', capAt: 600, wait: 2200 },
      { cap: 'Say it your way', capAt: 600, wait: 200 },
      { tap: '#pw-mn', wait: 200 },
      { eval: "document.getElementById('pw-mn').select()", wait: 200 },
      { type: 'The mountain is tall', delay: 80, wait: 900 },
      { cap: 'Tag it', capAt: 600, wait: 200 },
      { type: 'mountains', into: '.pwtag', delay: 110, wait: 900 },
      { cap: 'Add a photo', capAt: 600, wait: 200 },
      { pick: 'tools/video/photo-mountains.jpg' },
      { tap: 'do:pwPickLib', wait: 1800, still: 'p3-photo' },
      { cap: 'Post it', capAt: 600, wait: 200 },
      { tap: 'do:pwSend', wait: 1800 },
      { cap: 'It is on the timeline, in your letters', capAt: 600, wait: 2800, still: 'p4-posted' },
      { cap: 'Read other makers, in their letters', capAt: 600, wait: 200 },
      { scroll: 330, wait: 3000 },
    ],
  },

  /* The timeline, used: somebody else's post answered in your
     own letters and made into a card; a maker's profile, and the notices.
     What waits on the server is not in it (no server here): opening a
     thread, a like, a repost, a tag's search, a voice (its file), and the
     profile's photos and likes tabs. p1 is taken out as in 'post'. */
  'timeline': {
    view: [393, 852, 3], size: [1080, 2340], out: 'promo/timeline', hq: true, slow: 2,
    music: 'verclub_music-background-music-571037.mp3',
    setup: [{ eval: "POSTS = POSTS.filter(function (p) { return p.id !== 'p1'; }); render();" }, { go: 'feed' }],
    steps: [
      { cap: 'A timeline where everyone writes their own language', capAt: 600, wait: 2400, still: 't1-feed' },
      { cap: 'Reply in your own letters', capAt: 600, wait: 200 },
      { tap: '[data-do=postReply][data-a*=p2]', wait: 1000 },
      { type: 'sar mos', lingua: true, into: 'do:pwFocusLn', delay: 260, wait: 1200, still: 't2-reply' },
      { tap: 'do:pwSend', wait: 1600 },
      { cap: 'Share any post as a card', capAt: 600, wait: 200 },
      { tap: '[data-do=postCard][data-a*=p2]', wait: 1800, still: 't3-card' },
      { cap: 'In any shape', capAt: 600, wait: 200 },
      { tap: '[data-do=cardSetShape][data-a*="1:1"]', wait: 1300 },
      { tap: '[data-do=cardSetShape][data-a*="9:16"]', wait: 1500 },
      { tap: 'do:back', wait: 900 },
      { cap: 'Every maker has a profile', capAt: 600, wait: 200 },
      { eval: "profileOpen('iri')", wait: 1500, still: 't6-profile' },
      { cap: 'Their posts and their replies', capAt: 600, wait: 200 },
      { tap: '[data-do=pfSetTab][data-a*=re]', wait: 2200 },
      { cap: 'See who answered you', capAt: 600, wait: 200 },
      { tap: '[data-do=goTab][data-a*=notif]', wait: 2600, still: 't7-notices' },
    ],
  },

  /* The language's own page -- what it is, its sounds, its letters, the
     sections somebody wrote -- written, made public, and the notebook beside
     it. */
  'language': {
    view: [393, 852, 3], size: [1080, 2340], out: 'promo/language', hq: true, slow: 2,
    music: 'sub_clair-background-music-550483.mp3',
    setup: [{ eval: DICT_TIDY }, { go: 'about' }],
    steps: [
      { cap: 'A page about your language', capAt: 690, wait: 2000, still: 'l1-about' },
      { cap: 'Its sounds', capAt: 690, wait: 200 },
      { tap: '[data-do=abToggle][data-a*=sound]', wait: 2000, still: 'l2-sounds' },
      { tap: '[data-do=abToggle][data-a*=sound]', wait: 500 },
      { cap: 'Its letters', capAt: 690, wait: 200 },
      { tap: '[data-do=abToggle][data-a*=letters]', wait: 2000, still: 'l3-letters' },
      { tap: '[data-do=abToggle][data-a*=letters]', wait: 500 },
      { cap: 'And anything you write about it', capAt: 690, wait: 200 },
      { tap: '[data-do=abToggle][data-a*=A1]', wait: 2200, still: 'l4-section' },
      { tap: '[data-do=abToggle][data-a*=A1]', wait: 500 },
      { cap: 'Write it, and choose who sees it', capAt: 690, wait: 200 },
      { tap: '[data-do=go][data-a*=world]', wait: 2000, still: 'l5-edit' },
      { cap: 'Share the parts you want to share', capAt: 690, wait: 200 },
      { tap: '[data-do=setWldSecDl][data-a*=letters]', wait: 700 },
      { tap: '[data-do=setWldSecDl][data-a*=kb]', wait: 1200 },
      { tap: 'do:keepPress', wait: 2000 },
      { cap: 'Keep notes beside it', capAt: 600, wait: 200 },
      { go: 'notes' },
      { wait: 1500 },
      { tap: '[data-do=openNote]:not([data-a])', wait: 900 },
      { type: 'Sound changes', into: '#nt-t', delay: 90, wait: 300 },
      { type: 'k becomes ch before i and e?', into: '#nt-b', delay: 60, wait: 900, still: 'l6-note' },
      { tap: 'do:keepPress', wait: 2600, still: 'l7-notebook' },
    ],
  },

  /* Who you are and how the app looks: the profile and its editor, light and
     dark, and the ten languages the app speaks. The picture is iOS's own
     sheet (UIAlertController), so it is not in a browser's film. p1 is taken
     out as in 'post'. */
  'profile': {
    view: [393, 852, 3], size: [1080, 2340], out: 'promo/profile', hq: true, slow: 2,
    music: 'atlasaudio-music-background-606270.mp3',
    setup: [{ eval: "POSTS = POSTS.filter(function (p) { return p.id !== 'p1'; }); render();" }, { go: 'profile' }],
    steps: [
      { cap: 'Your profile', capAt: 600, wait: 1800, still: 'f1-profile' },
      { cap: 'Your name, and a line about you', capAt: 600, wait: 200 },
      { tap: 'do:openMe', wait: 900 },
      { tap: '#me-bio', wait: 200 },
      { eval: "document.getElementById('me-bio').select()", wait: 150 },
      { type: 'I make Shango, the language of the valley', delay: 55, wait: 1200, still: 'f2-edit' },
      { tap: 'do:keepPress', wait: 1800, still: 'f3-saved' },
      { cap: 'Light or dark', capAt: 600, wait: 200 },
      { tap: '[data-do=go][data-a*=settings]', wait: 900 },
      { tap: '[data-do=go][data-a*=look]', wait: 900 },
      { tap: '[data-do=setTheme][data-a*=light]', wait: 1600, still: 'f4-light' },
      { tap: '[data-do=setTheme][data-a*=dark]', wait: 1200 },
      { tap: 'do:back', wait: 800 },
      { cap: 'The app speaks ten languages', capAt: 600, wait: 200 },
      { tap: '[data-do=go][data-a*=\'"ui"\']', wait: 1000 },
      { tap: '[data-do=setUi][data-a*=ja]', wait: 1300, still: 'f5-japanese' },
      { tap: '[data-do=setUi][data-a*=es]', wait: 1100 },
      { tap: '[data-do=setUi][data-a*=ko]', wait: 1100 },
      { tap: '[data-do=setUi][data-a*=en]', wait: 1400 },
      { tap: 'do:back', wait: 2400, still: 'f6-settings' },
    ],
  },

  /* The calendar: a month is a word (www/cal.js). The months and the days of
     the week are word slots in the grammar book's appendix, each made where
     it is asked for, and the home screen's calendar and clock (the digits
     page shows them) draw what was made, in the language's own digits. */
  'calendar': {
    view: [393, 852, 3], size: [1080, 2340], out: 'promo/calendar', hq: true, slow: 2,
    music: 'echoes_of_lumen-vlog-background-music-596303.mp3',
    setup: [{ eval: DICT_TIDY }, { eval: DICT_RULES }, { go: 'gram', a: 'book:app' }],
    steps: [
      { cap: 'Name the months yourself', capAt: 600, wait: 200 },
      { tap: '[data-do=stOpen][data-a*=month]', wait: 1700, still: 'c1-months' },
      { cap: 'Each one is a word of your language', capAt: 600, wait: 200 },
      { tap: '[data-do=openSlot][data-a*=January]', wait: 1000 },
      { type: 'kanu', lingua: true, into: '#wd-ln', delay: 260, wait: 1200, still: 'c2-january' },
      { tap: 'do:addOne', wait: 1300 },
      { tap: 'do:back', wait: 900 },
      { tap: '[data-do=openSlot][data-a*=February]', wait: 900 },
      { type: 'sari', lingua: true, into: '#wd-ln', delay: 260, wait: 900 },
      { tap: 'do:addOne', wait: 1300 },
      { tap: 'do:back', wait: 900 },
      { tap: '[data-do=openSlot][data-a*=March]', wait: 900 },
      { type: 'tomo', lingua: true, into: '#wd-ln', delay: 260, wait: 900 },
      { tap: 'do:addOne', wait: 1300 },
      { tap: 'do:back', wait: 1700, still: 'c3-three' },
      { cap: 'And the days of the week', capAt: 600, wait: 200 },
      { tap: 'do:back', wait: 900 },
      { tap: '[data-do=stOpen][data-a*=wday]', wait: 2000, still: 'c4-week' },
      { cap: 'Your digits, your clock', capAt: 600, wait: 200 },
      { go: 'ltset', a: 'num' },
      { scroll: 400, wait: 3200, still: 'c5-home' },
    ],
  },

  /* On a paid plan: a letter past a to z (can('letters'), Plus), drawn and
     named, given a sound off the IPA chart (can('snd')); and digits counting
     in base 12 (can('letters')). The plan is set to Pro in the page
     (planGot), as tools/fixture.mjs does for the paid faces.
     The direction (can('dir')) is not in it: filmed on 2026-09-30, a line of
     this language's own letters written top to bottom came out with every
     letter on its side, and right to left came out right-aligned with the
     words still left to right. Why has not been found; reported, not filmed. */
  'plus': {
    view: [393, 852, 3], size: [1080, 2340], out: 'promo/plus', hq: true, slow: 2,
    music: 'sigmamusicart-background-music-inspiring-525840.mp3',
    setup: [{ eval: DICT_TIDY }, { eval: "planGot('pro'); render();" }, { go: 'ltset', a: 'alpha' }],
    steps: [
      { cap: 'Paid plans: go past a to z', capAt: 600, wait: 1800 },
      { cap: 'Add a letter', capAt: 600, wait: 200 },
      { tap: 'do:newLetter', wait: 1000 },
      { tap: 'do:editLetter', wait: 900 },
      { cap: 'Draw it', capAt: 650, wait: 200 },
      { draw: [
          [[0.26, 0.30], [0.40, 0.70], [0.54, 0.30], [0.68, 0.70]],
          [[0.26, 0.50], [0.74, 0.50]],
        ], gap: 300, wait: 700 },
      { tap: 'do:keepPress', wait: 1200 },
      { cap: 'Name it anything', capAt: 600, wait: 200 },
      { type: 'ph', into: '#lt-rom', delay: 260, wait: 1400, still: 'x1-new-letter' },
      { cap: 'Choose its sound from the IPA', capAt: 600, wait: 200 },
      { tap: 'do:openSnd', wait: 1000 },
      { tap: '[data-do=ipaToggle][data-a*="m.fricative"]', wait: 1000 },
      { tap: '[data-do=ltTakeSnd][data-a=\'["ɸ"]\']', wait: 1300, still: 'x1b-sound' },
      { tap: 'do:keepPress', wait: 1000 },
      { tap: 'do:keepPress', wait: 1600, still: 'x2-alphabet' },
      { cap: 'Count in base 12', capAt: 600, wait: 200 },
      { go: 'ltset', a: 'num' },
      { wait: 900 },
      { tap: '[data-do=numStepBase][data-a="[1]"]', wait: 900 },
      { tap: '[data-do=numStepBase][data-a="[1]"]', wait: 2400, still: 'x5-base12' },
    ],
  },

  /* A word list somebody already has, brought in whole (www/import.js, Pro:
     can('data') opens the door). Pasted as a spreadsheet would paste it,
     each column given its role, and in. */
  'import': {
    view: [393, 852, 3], size: [1080, 2340], out: 'promo/import', hq: true, slow: 2,
    music: 'verclub_music-background-music-571037.mp3',
    setup: [{ eval: DICT_TIDY }, { eval: DICT_RULES }, { eval: "planGot('pro'); render();" }, { go: 'settings' }],
    steps: [
      { cap: 'Got a word list?', capAt: 710, wait: 1600 },
      { tap: '[data-do=go][data-a*=\'"data"\']', wait: 1000, still: 'i1-data' },
      { tap: 'do:openImport', wait: 900 },
      { cap: 'Paste it in', capAt: 710, wait: 200 },
      { tap: '[data-do=impStep][data-a*=paste]', wait: 800 },
      { type: 'word,meaning,part of speech\nnira,sun,noun\nsoma,moon,noun\nvela,to fly,verb\nkiru,bright,adjective', into: '#f-csv', delay: 35, wait: 1000, still: 'i2-pasted' },
      { tap: 'do:impScan', wait: 1400 },
      { cap: 'Every column read', capAt: 710, wait: 2600, still: 'i3-columns' },
      { tap: 'text:Next', wait: 1500, still: 'i4-ready' },
      { cap: 'One tap', capAt: 710, wait: 200 },
      { tap: 'do:doImport', wait: 1500 },
      { cap: 'In your dictionary', capAt: 710, wait: 200 },
      { go: 'words' },
      { wait: 400 },
      { scroll: 700, wait: 2800, still: 'i5-in' },
    ],
  },

  /* A writing system that is not an alphabet (can('wsys'), Plus): an
     abugida, where a vowel is a mark on the consonant. The bench puts every
     consonant with each vowel at once; the mark is moved, sized and drawn
     there. Pro is set in the page as in 'plus'. */
  'abugida': {
    view: [393, 852, 3], size: [1080, 2340], out: 'promo/abugida', hq: true, slow: 2,
    music: 'atlasaudio-music-background-606270.mp3',
    setup: [{ eval: DICT_TIDY }, { eval: "planGot('pro'); render();" }, { go: 'wsys' }],
    steps: [
      { cap: 'Not every script is an alphabet', capAt: 600, wait: 2000, still: 'b1-kinds' },
      { cap: 'Make it an abugida', capAt: 600, wait: 200 },
      { tap: '[data-do=wsPick][data-a*=abugida]', wait: 900 },
      { tap: 'do:keepPress', wait: 1200 },
      { go: 'letters' },
      { wait: 700 },
      { tap: '[data-do=go][data-a*=abugida]', wait: 1000 },
      { cap: 'Every consonant with every vowel, built for you', capAt: 600, wait: 2600, still: 'b2-bench' },
      { cap: 'Move the vowel mark', capAt: 600, wait: 200 },
      { tap: '[data-do=abNudge][data-a="[0,-1]"]', wait: 600 },
      { tap: '[data-do=abNudge][data-a="[0,-1]"]', wait: 600 },
      { tap: '[data-do=abNudge][data-a="[1,0]"]', wait: 900 },
      { cap: 'Make it bigger or smaller', capAt: 600, wait: 200 },
      { tap: '[data-do=abScale][data-a="[1.25]"]', wait: 1300, still: 'b3-moved' },
      { cap: 'Draw a mark for each vowel', capAt: 600, wait: 200 },
      { tap: '[data-do=abSetVow][data-a*=\'"i"\']', wait: 1000 },
      { tap: '[data-do=editGlyph][data-a=\'["i"]\']', wait: 900 },
      { draw: [[[0.30, 0.20], [0.70, 0.20]], [[0.50, 0.10], [0.50, 0.30]]], gap: 300, wait: 600 },
      { tap: 'do:keepPress', wait: 1400 },
      { cap: 'And the whole row follows', capAt: 600, wait: 2800, still: 'b4-i' },
    ],
  },

  /* A draft: a line kept for later and picked up again. The drafts list
     waits for the server's answer (pullHad('drafts')); here it is told it
     has one, and netDraftUp() is heard in rec.mjs. p1 out as in 'post'. */
  'drafts': {
    view: [393, 852, 3], size: [1080, 2340], out: 'promo/drafts', hq: true, slow: 2,
    music: 'sub_clair-background-music-550483.mp3',
    setup: [{ eval: "POSTS = POSTS.filter(function (p) { return p.id !== 'p1'; }); PULL_GOT[pullKey('drafts')] = 1; render();" }, { go: 'feed' }],
    steps: [
      { cap: 'Not finished yet?', capAt: 600, wait: 200 },
      { tap: '[data-do=openPost][data-a*=new]', wait: 900 },
      { type: 'kano mos', lingua: true, into: 'do:pwFocusLn', delay: 260, wait: 900 },
      { cap: 'Keep it as a draft', capAt: 600, wait: 200 },
      { tap: 'do:draftKeep', wait: 1900, still: 'd1-kept' },
      { cap: 'Pick it up any time', capAt: 600, wait: 200 },
      { tap: '[data-do=openPost][data-a*=new]', wait: 900 },
      { tap: '[data-do=go][data-a*=drafts]', wait: 1500, still: 'd2-list' },
      { tap: '[data-do=draftOpen][data-a="[0]"]', wait: 1100 },
      { cap: 'Finish it', capAt: 600, wait: 200 },
      { tap: 'do:pwFocusLn', wait: 200 },
      { eval: "(function(){var e=document.getElementById('pw-ln'); e.focus(); if(e.setSelectionRange){e.setSelectionRange(e.value.length,e.value.length);} else {var r=document.createRange(); r.selectNodeContents(e); r.collapse(false); var s=getSelection(); s.removeAllRanges(); s.addRange(r);}})()", wait: 150 },
      { type: ' sar', lingua: true, delay: 260, wait: 900, still: 'd3-open' },
      { tap: 'do:pwSend', wait: 1800 },
      { cap: 'And post it', capAt: 600, wait: 2600, still: 'd4-posted' },
    ],
  },

  /* The first minutes: the onboarding as somebody new meets it -- draw an a,
     the walk, the name. Put in front of the camera the way tools/fixture.mjs
     puts its onboarding faces there (SET.done off, ob at its first step).
     Its screens say what they are, so the captions stay out of the way. */
  'start': {
    view: [393, 852, 3], size: [1080, 2340], out: 'promo/start', hq: true, slow: 2,
    music: 'echoes_of_lumen-vlog-background-music-596303.mp3',
    setup: [{ eval: "POSTS = POSTS.filter(function (p) { return p.id !== 'p1'; }); SET.done=false; SET.walked=false; SET.obback=null; ob=obBlank(); ob.step=OB_DRAW; GE=null; render();" }],
    steps: [
      { cap: 'Your first minute in Lingua', capAt: 330, wait: 2200, still: 's1-draw' },
      { cap: '', wait: 300 },
      { draw: [
          [[0.30, 0.74], [0.50, 0.26], [0.70, 0.74]],
          [[0.38, 0.56], [0.62, 0.56]],
        ], gap: 350, wait: 900, still: 's2-a' },
      { tap: 'do:obDone', wait: 1800, still: 's3-tour' },
      { tap: '[data-do=goTab][data-a*=build]', wait: 1500 },
      { tap: '[data-do=go][data-a=\'["kb"]\']', wait: 1500 },
      { tap: '[data-do=kbGoBoard][data-a="[0]"]', wait: 3000, still: 's4-key' },
      { tap: 'do:back', wait: 1500 },
      { tap: '[data-do=go][data-a*=letters]', wait: 3000, still: 's5-letters' },
      { tap: '.body', wait: 1500 },
      { tap: 'do:back', wait: 1500 },
      /* The sample timeline's photographs are the app's own files (www/img/
         pic1-5.jpg), and netMediaSrc() (www/net.js) takes a path that is not
         data:, blob: or http for a path in Storage, so on 2026-09-30 every
         one of them came out with data-med and no src -- an empty frame where
         the photo is. Reported, not fixed; for the film the page is given
         the file it names. */
      { tap: '[data-do=goTab][data-a*=feed]', wait: 300 },
      { eval: "Array.prototype.forEach.call(document.querySelectorAll('img[data-med^=\"img/\"]'), function (e) { e.src = e.getAttribute('data-med'); })", wait: 1700, still: 's6-sns' },
      { tap: 'text:Next', wait: 1600 },
      { tap: '#ob-name', wait: 200 },
      { eval: "document.getElementById('ob-name').select()", wait: 150 },
      { type: 'Velira', delay: 160, wait: 1200, still: 's7-name' },
      { tap: 'do:obName', wait: 3200, still: 's8-door' },
    ],
  },

  /* The dictionary, in two films 「いいよ」 OWNER 2026-09-30 -- the one
     film asked for was split in two: making words, and using the
     dictionary. Filmed as the keyboard film was (393x852, 1080x2340, hq,
     slow 2, a track under the taps), into promo/words/.
     「機能説明なんだから機能もりもりで」 OWNER 2026-09-30 -- each film shows
     as much of its half as there is, one short beat and one caption each.

     Put right in the page before filming, and only in the page (DICT_TIDY,
     DICT_RULES): a subclass and a derivation label the fixture carries in
     Japanese, a future of tir with no spelling, and the fixture's old
     diminutive rule. That rule is a DERIVATION for every part of speech --
     no screen writes one any more (tools/fixture.mjs) -- and the new-word
     sheet adds what it makes as a word of its own with no meaning, which on
     film reads as a fault (reported to the leader, not fixed here). The plural,
     an inflection, stays: it is what a word's page shows as its forms. */
  'words-make': {
    view: [393, 852, 3], size: [1080, 2340], out: 'promo/words', hq: true, slow: 2,
    music: 'sub_clair-background-music-550483.mp3',
    setup: [
      { eval: DICT_TIDY },
      { eval: DICT_RULES },
      { go: 'words' },
    ],
    /* Generate chooses a part of speech of its own when none was chosen on
       the sheet (wdGen), which on film is a row changing under nobody's
       finger. So the part of speech is chosen FIRST, and Generate then makes
       words of that kind -- which is also what it does. */
    steps: [
      { cap: 'Make words for your conlang', capAt: 600, wait: 1800, still: 'make-01-lexicon' },
      { cap: 'Tap + to add one', capAt: 600, wait: 200 },
      { tap: 'do:openAdd', wait: 900 },
      { cap: 'Type it in your own letters', capAt: 600, wait: 200 },
      { type: 'velo', lingua: true, into: '#wd-ln', delay: 280, wait: 600 },
      { cap: 'Its sound is worked out for you', capAt: 600, wait: 700, still: 'make-02-typed' },
      { tap: 'do:sayPh', wait: 1200 },
      { cap: 'Give it meanings, as many as you like', capAt: 600, wait: 200 },
      { tap: 'do:wdMnOpen', wait: 350 },
      { type: 'bird', delay: 120, wait: 250 },
      { eval: 'wdAddMn()', wait: 500 },
      { tap: 'do:wdMnOpen', wait: 350 },
      { type: 'messenger', delay: 90, wait: 250 },
      { eval: 'wdAddMn()', wait: 1100, still: 'make-03-meanings' },
      { cap: 'Part of speech', capAt: 600, wait: 200 },
      { tap: '[data-do=go][data-a=\'["pos"]\']', wait: 900 },
      { tap: '[data-do=posPick][data-a=\'["n"]\']', wait: 800 },
      { cap: 'Register', capAt: 600, wait: 200 },
      { tap: '[data-do=go][data-a=\'["reg"]\']', wait: 900 },
      { tap: '[data-do=regPick][data-a=\'["po"]\']', wait: 900 },
      { cap: 'Fields it belongs to', capAt: 600, wait: 200 },
      { type: 'animals, sky', into: '#wd-tags', delay: 90, wait: 900 },
      { cap: 'An example sentence', capAt: 600, wait: 200 },
      { tap: 'do:wdExOpen', wait: 400 },
      { type: 'velo mos', into: '#wd-exl', delay: 160, wait: 300 },
      { type: 'The bird is tall', into: '#wd-exg', delay: 80, wait: 300 },
      { eval: 'wdAddEx()', wait: 1300, still: 'make-04-example' },
      { cap: 'Save it', capAt: 600, wait: 200 },
      { tap: 'do:keepPress', wait: 1200 },
      { cap: 'Its forms follow your grammar', capAt: 600, wait: 200 },
      { type: 'bird', into: '#w-q', delay: 160, wait: 600 },
      { tap: '[data-do=openWord][data-a=\'["velo"]\']', wait: 1000 },
      { scroll: 300, wait: 1800, still: 'make-05-forms' },
      { cap: 'Make new words from it', capAt: 600, wait: 200 },
      { tap: 'do:openEdit', wait: 800 },
      { tap: 'do:wdDerive', wait: 900 },
      { tap: '#wd-ln', wait: 200 },
      { eval: "(function(){var e=document.getElementById('wd-ln');e.focus();e.setSelectionRange(e.value.length,e.value.length);})()", wait: 150 },
      { type: 'n', lingua: true, delay: 250, wait: 400 },
      { tap: 'do:wdMnOpen', wait: 350 },
      { type: 'flock', delay: 110, wait: 250 },
      { eval: 'wdAddMn()', wait: 900, still: 'make-06-derived' },
      { tap: 'do:keepPress', wait: 400 },
      { cap: 'It joins the family', capAt: 600, wait: 200 },
      { scroll: 500, wait: 1800 },
      { tap: 'text:Family tree', wait: 1900, still: 'make-06b-tree' },
      { cap: 'Out of ideas?', capAt: 600, wait: 900 },
      { eval: "q=''" },
      { go: 'words' },
      { tap: 'do:openAdd', wait: 800 },
      { cap: 'Choose a part of speech', capAt: 600, wait: 200 },
      { tap: '[data-do=go][data-a=\'["pos"]\']', wait: 800 },
      { tap: '[data-do=posPick][data-a=\'["v"]\']', wait: 700 },
      { cap: 'Generate one that fits your sounds', capAt: 600, wait: 200 },
      { tap: 'do:wdGen', wait: 1000 },
      { tap: 'do:wdGen', wait: 1000 },
      { tap: 'do:wdGen', wait: 1400, still: 'make-07-generated' },
      { tap: 'do:wdMnOpen', wait: 350 },
      { type: 'to fly', delay: 110, wait: 250 },
      { eval: 'wdAddMn()', wait: 700 },
      { tap: 'do:keepPress', wait: 1200 },
      { cap: 'Your language grows', capAt: 600, wait: 300 },
      { scroll: 2000, wait: 2600, still: 'make-08-grows' },
    ],
  },

  'words-use': {
    view: [393, 852, 3], size: [1080, 2340], out: 'promo/words', hq: true, slow: 2,
    music: 'verclub_music-background-music-571037.mp3',
    setup: [
      { eval: DICT_TIDY },
      { eval: DICT_RULES },
      { go: 'words' },
    ],
    steps: [
      { cap: 'Your conlang’s dictionary', capAt: 600, wait: 2400, still: 'use-01-lexicon' },
      { cap: 'Search by word or meaning', capAt: 600, wait: 200 },
      { type: 'see', into: '#w-q', delay: 240, wait: 2100, still: 'use-02-search' },
      { tap: '#w-x', wait: 600 },
      { cap: 'Filter by part of speech', capAt: 600, wait: 200 },
      { tap: 'do:openFil', wait: 800 },
      { tap: '[data-do=wordsSetFil][data-a=\'["v"]\']', wait: 1900, still: 'use-03-verbs' },
      { tap: 'do:openFil', wait: 600 },
      { tap: '[data-do=wordsSetFil][data-a=\'["*"]\']', wait: 600 },
      { cap: 'Sort by letter or by kind', capAt: 600, wait: 200 },
      { tap: 'do:openSort', wait: 800 },
      { tap: '[data-do=wordsSetSort][data-a=\'["pos"]\']', wait: 2200, still: 'use-04-sorted' },
      { cap: 'Every word has a page', capAt: 600, wait: 200 },
      { tap: '[data-do=openWord][data-a=\'["tir"]\']', wait: 1200 },
      { cap: 'Hear how it sounds', capAt: 600, wait: 200 },
      { tap: 'do:sayPh', wait: 1800, still: 'use-05-word' },
      { cap: 'Every form of it', capAt: 600, wait: 200 },
      { scroll: 260, wait: 2100 },
      { cap: 'Example sentences', capAt: 600, wait: 200 },
      { scroll: 380, wait: 2100 },
      { cap: 'Words made from it', capAt: 600, wait: 200 },
      { tap: 'text:Family tree', wait: 2400, still: 'use-06-tree' },
      { tap: 'do:back', wait: 800 },
      { cap: 'Share it as a card', capAt: 600, wait: 200 },
      { tap: 'do:cardOpen', wait: 3000, still: 'use-07-card' },
      { go: 'words' },
      { cap: 'Select several at once', capAt: 600, wait: 300 },
      { tap: 'do:wSelOn', wait: 600 },
      { tap: 'do:wSelTap', nth: 3, wait: 350 },
      { tap: 'do:wSelTap', nth: 4, wait: 1100, still: 'use-08-selected' },
      { cap: 'Delete them together', capAt: 600, wait: 200 },
      { tap: 'do:wSelDel', pop: true, wait: 700 },
      { tap: 'do:popYes', wait: 1000, still: 'use-09-deleted' },
      { cap: 'Undo is one tap', capAt: 600, wait: 200 },
      { tap: 'do:wSelUndo', wait: 1400, still: 'use-10-undone' },
      { scroll: -2000, wait: 300 },
      { cap: 'Your dictionary, your way', capAt: 600, wait: 2400 },
    ],
  },
};
