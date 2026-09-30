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
      { tap: 'do:keepPress', wait: 1500 },
      { cap: 'Type your conlang on your phone', capAt: 600, wait: 2200 },
    ],
  },
};
